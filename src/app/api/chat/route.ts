import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool, zodSchema } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
  }

  const { messages, systemPrompt } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system: systemPrompt,
    messages,
    tools: {
      add_event: tool({
        description:
          "Add a calendar event to this project. Use when the user asks to schedule, plan, or track a task or recurring activity.",
        inputSchema: zodSchema(z.object({
          title: z.string().describe("Event title"),
          date: z.string().describe("Date in YYYY-MM-DD format"),
          recurrence: z
            .enum(["none", "daily", "weekly", "biweekly", "monthly", "seasonal"])
            .describe("How often this repeats")
            .default("none"),
          priority: z
            .enum(["high", "medium", "low"])
            .describe("Priority level")
            .default("medium"),
          notes: z.string().optional().describe("Additional notes"),
        })),
      }),
      add_section: tool({
        description:
          "Add a new section to this project. Use when the user wants to add a new category of plants, animals, equipment, or work.",
        inputSchema: zodSchema(z.object({
          name: z.string().describe("Section name"),
          type: z
            .enum(["plant", "animal", "initiative", "equipment"])
            .describe("Section type"),
        })),
      }),
      add_item: tool({
        description:
          "Add an item to an existing section. Use when the user wants to record a specific plant, animal, or piece of equipment.",
        inputSchema: zodSchema(z.object({
          sectionName: z
            .string()
            .describe("Name of the section to add the item to"),
          name: z.string().describe("Item name"),
          variety: z.string().optional().describe("Variety or breed"),
          qty: z.number().int().min(1).describe("Quantity").default(1),
          notes: z.string().optional().describe("Notes about this item"),
        })),
      }),
      update_notes: tool({
        description:
          "Update the project notes. Use when the user asks to save, record, or update general information about the project.",
        inputSchema: zodSchema(z.object({
          notes: z.string().describe("The complete updated project notes"),
        })),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
