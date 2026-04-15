"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ImageIcon, Send, Trash2, X, CheckCircle } from "lucide-react";
import { useAppDispatch, useCurrentUser, newId } from "@/lib/context";
import type {
  Project, ChatMessage, ToolResult, User,
  Event, Section, Item, Recurrence, Priority, SectionType,
} from "@/lib/types";
import type { AppAction } from "@/lib/context";
import type { Dispatch } from "react";

// --- System prompt ---

function buildSystemPrompt(project: Project, users: User[]): string {
  const today = new Date().toISOString().split("T")[0];
  const memberNames =
    (project.members ?? []).length > 0
      ? project.members.map((id) => users.find((u) => u.id === id)?.name ?? id).join(", ")
      : "Everyone";

  let prompt = `You are a knowledgeable homestead advisor helping manage the "${project.name}" project at a property in Duxbury, MA (USDA Zone 6b).

Today's date: ${today}
Project members: ${memberNames}`;

  if (project.notes) prompt += `\nProject notes: ${project.notes}`;

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
    const sorted = project.events.slice().sort((a, b) => a.date.localeCompare(b.date));
    for (const event of sorted.slice(0, 15)) {
      prompt += `\n- ${event.title} (${event.date}`;
      if (event.recurrence !== "none") prompt += `, ${event.recurrence}`;
      prompt += ")";
      if (event.notes) prompt += `: ${event.notes}`;
    }
  }

  prompt += "\n\nYou have full context about this project. Answer questions, help plan tasks, diagnose plant or animal issues from photos, and give actionable practical advice. When the user asks you to add events, sections, items, or update notes — use the available tools to make those changes directly.";

  return prompt;
}

// --- Tool execution ---

interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

function executeToolCall(
  call: ToolCall,
  project: Project,
  dispatch: Dispatch<AppAction>
): string {
  switch (call.toolName) {
    case "add_event": {
      const a = call.args as { title: string; date: string; recurrence?: Recurrence; priority?: Priority; notes?: string };
      const event: Event = {
        id: newId("evt"),
        title: a.title,
        date: a.date,
        recurrence: a.recurrence ?? "none",
        priority: a.priority ?? "medium",
        notes: a.notes ?? "",
        projectId: project.id,
        assignees: [],
        completionLog: [],
        intents: [],
      };
      dispatch({ type: "ADD_EVENT", projectId: project.id, event });
      return `Added event "${a.title}" on ${a.date}`;
    }
    case "add_section": {
      const a = call.args as { name: string; type: SectionType };
      const section: Section = {
        id: newId("sect"),
        name: a.name,
        type: a.type,
        details: {},
        items: [],
      };
      dispatch({ type: "ADD_SECTION", projectId: project.id, section });
      return `Added section "${a.name}"`;
    }
    case "add_item": {
      const a = call.args as { sectionName: string; name: string; variety?: string; qty?: number; notes?: string };
      const section = project.sections.find(
        (s) =>
          s.name.toLowerCase().includes(a.sectionName.toLowerCase()) ||
          a.sectionName.toLowerCase().includes(s.name.toLowerCase())
      );
      if (!section) return `Section "${a.sectionName}" not found`;
      const item: Item = {
        id: newId("item"),
        name: a.name,
        variety: a.variety ?? "",
        qty: a.qty ?? 1,
        date: new Date().toISOString().split("T")[0],
        notes: a.notes ?? "",
        status: "active",
      };
      dispatch({ type: "ADD_ITEM", projectId: project.id, sectionId: section.id, item });
      return `Added "${a.name}" to ${section.name}`;
    }
    case "update_notes": {
      const a = call.args as { notes: string };
      dispatch({ type: "UPDATE_PROJECT", projectId: project.id, updates: { notes: a.notes } });
      return "Updated project notes";
    }
    default:
      return `Unknown tool: ${call.toolName}`;
  }
}

// --- API message format ---

type ApiContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image"; image: URL }>;

function toApiMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.content.trim() !== "" || (m.imageUrls?.length ?? 0) > 0)
    .map((m) => {
      if (!m.imageUrls?.length) {
        return { role: m.role, content: m.content };
      }
      const parts: ApiContent = [
        { type: "text" as const, text: m.content },
        ...m.imageUrls.map((url) => ({ type: "image" as const, image: new URL(url) })),
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
  const dispatch    = useAppDispatch();
  useCurrentUser();

  const [messages,         setMessages]         = useState<ChatMessage[]>(
    (project.messages ?? []).filter((m) => m.content.trim() !== "" || (m.imageUrls?.length ?? 0) > 0)
  );
  const [input,            setInput]            = useState("");
  const [isStreaming,      setIsStreaming]       = useState(false);
  const [pendingImageUrl,  setPendingImageUrl]   = useState<string | null>(null);
  const [pendingImageName, setPendingImageName]  = useState<string | null>(null);
  const [uploadError,      setUploadError]       = useState<string | null>(null);
  const [confirmClear,     setConfirmClear]      = useState(false);

  const scrollRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages(
      (project.messages ?? []).filter((m) => m.content.trim() !== "" || (m.imageUrls?.length ?? 0) > 0)
    );
    setPendingImageUrl(null);
    setPendingImageName(null);
    setUploadError(null);
    setConfirmClear(false);
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        URL.revokeObjectURL(localUrl);
        setPendingImageUrl(json.url);
      }
    } catch {
      setUploadError("Upload failed — check BLOB_READ_WRITE_TOKEN");
      setPendingImageUrl(null);
      setPendingImageName(null);
      URL.revokeObjectURL(localUrl);
    }

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
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    setMessages([...nextMessages, assistantPlaceholder]);

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
            m.id === assistantId ? { ...m, content: `Error: ${err || res.statusText}` } : m
          )
        );
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = "";
      let accumulated = "";
      const pendingCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;

          try {
            const chunk = JSON.parse(payload) as { type: string; [key: string]: unknown };

            if (chunk.type === "text-delta") {
              accumulated += chunk.delta as string;
              const snap = accumulated;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: snap } : m))
              );
            } else if (chunk.type === "tool-input-available") {
              pendingCalls.push({
                toolCallId: chunk.toolCallId as string,
                toolName:   chunk.toolName as string,
                args:       chunk.input as Record<string, unknown>,
              });
            }
          } catch {}
        }
      }

      // Execute tool calls against live project state
      const toolResults: ToolResult[] = [];
      for (const call of pendingCalls) {
        const result = executeToolCall(call, project, dispatch);
        toolResults.push({ toolName: call.toolName, result });
      }

      if (!accumulated && toolResults.length === 0) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "No response received. Please try again." }
              : m
          )
        );
        return;
      }

      const finalAssistant: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: accumulated,
        toolResults: toolResults.length > 0 ? toolResults : undefined,
        createdAt: assistantPlaceholder.createdAt,
      };
      const finalMessages = [...nextMessages, finalAssistant];
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

      {/* Messages */}
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
              Plan, schedule, diagnose — or say &ldquo;add a weekly watering event&rdquo; and it&apos;ll happen.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isStreaming={isStreaming && msg.role === "assistant" && msg === messages[messages.length - 1]}
          />
        ))}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border px-4 py-3 flex flex-col gap-2">
        {pendingImageUrl && (
          <div className="flex items-center gap-2 px-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingImageUrl} alt="attachment" className="h-14 w-14 object-cover rounded border border-border" />
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-[11px] text-muted-foreground truncate">{pendingImageName}</span>
              <span className="text-[10px] text-muted-foreground/60">Ready to send</span>
            </div>
            <button onClick={() => { setPendingImageUrl(null); setPendingImageName(null); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X size={12} />
            </button>
          </div>
        )}

        {uploadError && <p className="text-[11px] text-destructive px-1">{uploadError}</p>}

        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mb-0.5"
            title="Attach photo"
          >
            <ImageIcon size={15} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask, plan, or say 'add event…'"
            rows={1}
            style={{ resize: "none" }}
            className="flex-1 bg-panel border border-border rounded px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring min-h-[36px] max-h-[120px] overflow-y-auto leading-relaxed"
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!canSend}
            className="p-1.5 flex-shrink-0 mb-0.5 transition-colors disabled:opacity-30"
            style={{ color: canSend ? "var(--primary)" : undefined }}
            title="Send (Enter)"
          >
            <Send size={15} />
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/50 px-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

// --- Message bubble ---

function MessageBubble({ msg, isStreaming }: { msg: ChatMessage; isStreaming: boolean }) {
  const isUser = msg.role === "user";

  return (
    <div className={`group flex flex-col gap-0.5 ${isUser ? "items-end" : "items-start"}`}>
      {msg.imageUrls?.map((url) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url} src={url} alt="attachment" className="max-w-[240px] max-h-[200px] object-cover rounded border border-border" />
      ))}

      {(msg.content || isStreaming) && (
        <div
          className="max-w-[85%] px-3 py-2 rounded text-[13px] leading-relaxed"
          style={
            isUser
              ? { backgroundColor: "var(--chat-user-bg)", color: "var(--chat-user-text)", border: "1px solid var(--chat-user-border)" }
              : { backgroundColor: "var(--chat-assistant-bg)", color: "var(--foreground)", border: "1px solid var(--chat-assistant-border)" }
          }
        >
          {msg.content ? (
            <FormattedContent content={msg.content} />
          ) : (
            <span className="inline-block w-1.5 h-3.5 bg-muted-foreground animate-pulse rounded-sm" />
          )}
        </div>
      )}

      {/* Tool results */}
      {msg.toolResults && msg.toolResults.length > 0 && (
        <div className="flex flex-col gap-1 mt-0.5">
          {msg.toolResults.map((tr, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle size={11} className="text-primary flex-shrink-0" />
              <span>{tr.result}</span>
            </div>
          ))}
        </div>
      )}

      <span className="text-[10px] text-muted-foreground/40 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}

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
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="text-[12px] font-mono bg-black/20 px-1 rounded">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
