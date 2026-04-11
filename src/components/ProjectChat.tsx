"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ImageIcon, Send, Trash2, X } from "lucide-react";
import { useAppDispatch, useCurrentUser, newId } from "@/lib/context";
import type { Project, ChatMessage, User } from "@/lib/types";

// --- System prompt builder ---

function buildSystemPrompt(project: Project, users: User[]): string {
  const today = new Date().toISOString().split("T")[0];
  const memberNames =
    (project.members ?? []).length > 0
      ? project.members
          .map((id) => users.find((u) => u.id === id)?.name ?? id)
          .join(", ")
      : "Everyone";

  let prompt = `You are a knowledgeable homestead advisor helping manage the "${project.name}" project at a property in Duxbury, MA (USDA Zone 6b).

Today's date: ${today}
Project members: ${memberNames}`;

  if (project.notes) {
    prompt += `\nProject notes: ${project.notes}`;
  }

  if (project.sections.length > 0) {
    prompt += "\n\nSections and items:";
    for (const section of project.sections) {
      prompt += `\n- ${section.name} (${section.type})`;
      for (const [key, val] of Object.entries(section.details)) {
        if (val) prompt += `\n  ${key}: ${val}`;
      }
      for (const item of section.items) {
        prompt += `\n  • ${item.name}${item.variety ? ` (${item.variety})` : ""}`;
        if (item.qty > 1) prompt += `, qty: ${item.qty}`;
        if (item.notes) prompt += ` — ${item.notes}`;
      }
    }
  }

  if (project.events.length > 0) {
    prompt += "\n\nScheduled events:";
    const sorted = project.events
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
    for (const event of sorted.slice(0, 15)) {
      prompt += `\n- ${event.title} (${event.date}`;
      if (event.recurrence !== "none") prompt += `, ${event.recurrence}`;
      prompt += ")";
      if (event.notes) prompt += `: ${event.notes}`;
    }
  }

  prompt +=
    "\n\nYou have full context about this project. Answer questions, help plan tasks, diagnose plant or animal issues from photos, and give actionable, practical advice. Be concise — this is a field tool.";

  return prompt;
}

// --- Types for API ---

type ApiMessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image"; image: URL }
    >;

interface ApiMessage {
  role: "user" | "assistant";
  content: ApiMessageContent;
}

function toApiMessages(messages: ChatMessage[]): ApiMessage[] {
  return messages
    .filter((m) => m.content.trim() !== "" || (m.imageUrls?.length ?? 0) > 0)
    .map((m) => {
      if (!m.imageUrls?.length) {
        return { role: m.role, content: m.content };
      }
      const parts: ApiMessageContent = [
        { type: "text" as const, text: m.content },
        ...m.imageUrls.map((url) => ({
          type: "image" as const,
          image: new URL(url),
        })),
      ];
      return { role: m.role, content: parts };
    });
}

// --- Component ---

interface ProjectChatProps {
  project: Project;
  users: User[];
}

export default function ProjectChat({ project, users }: ProjectChatProps) {
  const dispatch = useAppDispatch();
  const currentUser = useCurrentUser();

  const [messages, setMessages] = useState<ChatMessage[]>(
    (project.messages ?? []).filter((m) => m.content.trim() !== "" || (m.imageUrls?.length ?? 0) > 0)
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [pendingImageName, setPendingImageName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync messages when project changes (e.g. switching projects)
  useEffect(() => {
    setMessages(project.messages ?? []);
    setPendingImageUrl(null);
    setPendingImageName(null);
    setUploadError(null);
    setConfirmClear(false);
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveMessages = useCallback(
    (msgs: ChatMessage[]) => {
      const clean = msgs.filter((m) => m.content.trim() !== "" || (m.imageUrls?.length ?? 0) > 0);
      dispatch({ type: "SAVE_CHAT", projectId: project.id, messages: clean });
    },
    [dispatch, project.id]
  );

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    // Preview locally while uploading
    const localUrl = URL.createObjectURL(file);
    setPendingImageUrl(localUrl);
    setPendingImageName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || json.error) {
        setUploadError(json.error ?? "Upload failed");
        setPendingImageUrl(null);
        setPendingImageName(null);
        URL.revokeObjectURL(localUrl);
      } else {
        // Replace local blob URL with the persisted Blob URL
        URL.revokeObjectURL(localUrl);
        setPendingImageUrl(json.url);
      }
    } catch {
      setUploadError("Upload failed — check BLOB_READ_WRITE_TOKEN");
      setPendingImageUrl(null);
      setPendingImageName(null);
      URL.revokeObjectURL(localUrl);
    }

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text && !pendingImageUrl) return;
    if (isStreaming) return;

    const userMsg: ChatMessage = {
      id: newId("msg"),
      role: "user",
      content: text,
      imageUrls: pendingImageUrl ? [pendingImageUrl] : undefined,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setPendingImageUrl(null);
    setPendingImageName(null);
    setIsStreaming(true);

    const assistantId = newId("msg");
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    const withAssistant = [...nextMessages, assistantMsg];
    setMessages(withAssistant);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: toApiMessages(nextMessages),
          systemPrompt: buildSystemPrompt(project, users),
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${err || res.statusText}` }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: snap } : m
          )
        );
      }

      if (!accumulated) {
        // Stream returned empty — likely an upstream API error; show message, don't persist
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "No response received. Please try again." }
              : m
          )
        );
        return;
      }

      const finalMessages: ChatMessage[] = [
        ...nextMessages,
        { ...assistantMsg, content: accumulated },
      ];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Request failed. Check your connection and API key." }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    saveMessages([]);
    setConfirmClear(false);
    setIsStreaming(false);
  }

  const canSend = (input.trim().length > 0 || pendingImageUrl !== null) && !isStreaming;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-border flex-shrink-0">
        <span className="text-[11px] text-muted-foreground font-mono">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </span>
        {confirmClear ? (
          <span className="flex items-center gap-2 text-[11px]">
            <span className="text-muted-foreground">Clear history?</span>
            <button onClick={clearChat} className="text-destructive hover:opacity-80 font-medium">Yes</button>
            <button onClick={() => setConfirmClear(false)} className="text-muted-foreground hover:text-foreground">No</button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
            title="Clear conversation"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 min-h-0"
      >
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-12">
            <p className="text-[14px] text-foreground font-medium">
              Ask anything about {project.icon} {project.name}
            </p>
            <p className="text-[12px] text-muted-foreground max-w-[280px]">
              Planning, scheduling, plant health, or snap a photo from the field — all in context.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isStreaming={isStreaming && msg.role === "assistant" && msg === messages[messages.length - 1]} />
        ))}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-border px-4 py-3 flex flex-col gap-2">
        {/* Image preview */}
        {pendingImageUrl && (
          <div className="flex items-center gap-2 px-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImageUrl}
              alt="attachment"
              className="h-14 w-14 object-cover rounded border border-border"
            />
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-[11px] text-muted-foreground truncate">{pendingImageName}</span>
              <span className="text-[10px] text-muted-foreground/60">Ready to send</span>
            </div>
            <button
              onClick={() => { setPendingImageUrl(null); setPendingImageName(null); }}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {uploadError && (
          <p className="text-[11px] text-destructive px-1">{uploadError}</p>
        )}

        <div className="flex items-end gap-2">
          {/* Photo attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mb-0.5"
            title="Attach photo"
          >
            <ImageIcon size={15} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this project…"
            rows={1}
            style={{ resize: "none" }}
            className="flex-1 bg-panel border border-border rounded px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring min-h-[36px] max-h-[120px] overflow-y-auto leading-relaxed"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />

          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={!canSend}
            className="p-1.5 flex-shrink-0 mb-0.5 transition-colors disabled:opacity-30"
            style={{ color: canSend ? "#a3e635" : undefined }}
            title="Send (Enter)"
          >
            <Send size={15} />
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/50 px-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// --- Message bubble ---

function MessageBubble({ msg, isStreaming }: { msg: ChatMessage; isStreaming: boolean }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      {/* Images */}
      {msg.imageUrls?.map((url) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt="attachment"
          className="max-w-[240px] max-h-[200px] object-cover rounded border border-border"
        />
      ))}

      {/* Text */}
      {(msg.content || isStreaming) && (
        <div
          className={`max-w-[85%] px-3 py-2 rounded text-[13px] leading-relaxed ${
            isUser
              ? "bg-[#1a2a0a] text-[#c8f57a] border border-[#2a3f10]"
              : "bg-panel border border-border text-foreground"
          }`}
        >
          {msg.content ? (
            <FormattedContent content={msg.content} />
          ) : (
            <span className="inline-block w-1.5 h-3.5 bg-muted-foreground animate-pulse rounded-sm" />
          )}
        </div>
      )}

      {/* Timestamp */}
      <span className="text-[10px] text-muted-foreground/50 font-mono">
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}

// Minimal markdown rendering — bold, inline code, line breaks
function FormattedContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          <InlineLine text={line} />
        </span>
      ))}
    </>
  );
}

function InlineLine({ text }: { text: string }) {
  // Split on **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="text-[12px] font-mono bg-black/30 px-1 rounded">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
