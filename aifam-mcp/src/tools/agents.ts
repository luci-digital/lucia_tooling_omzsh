import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import type { ChatMessage } from "../mesh/exo.js";
import { fail, guard, json, text } from "./helpers.js";

export function registerAgentTools(server: McpServer, ctx: AppContext): void {
  server.registerTool(
    "agents_list",
    {
      title: "List Aifam agents",
      description:
        "List the registered Luciverse / Aifam agents with their tier, bonded frequency, role, and coherence.",
      inputSchema: {},
    },
    guard(async () => json({ agents: ctx.registry.list() })),
  );

  server.registerTool(
    "agent_invoke",
    {
      title: "Invoke an Aifam agent",
      description:
        "Route a prompt to a named Luciverse / Aifam agent. The agent is framed with its tier, frequency, and role, then runs distributed inference on the exo + MLX mesh. Honors the Luciverse minimum coherence gate.",
      inputSchema: {
        agent: z.string().describe("Agent id, e.g. lucia, veritas, juniper, cortana, judge-luci, root."),
        prompt: z.string().describe("The user prompt / task for the agent."),
        model: z.string().optional().describe("Override the model id; defaults to the agent's preferred model or the mesh default."),
        temperature: z.number().min(0).max(2).optional(),
        max_tokens: z.number().int().positive().optional(),
      },
    },
    guard(async ({ agent, prompt, model, temperature, max_tokens }) => {
      const a = ctx.registry.get(agent);
      if (!a) {
        const ids = ctx.registry.list().map((x) => x.id).join(", ");
        return fail(`Unknown agent "${agent}". Available: ${ids}`);
      }
      const min = ctx.config.luciverse.coherenceMin;
      if (a.coherence < min) {
        return fail(
          `Agent "${a.id}" coherence ${a.coherence} is below the Luciverse minimum ${min}; invocation refused.`,
        );
      }
      const modelId = model ?? a.model ?? ctx.exo.defaultModelId;
      const messages: ChatMessage[] = [
        { role: "system", content: ctx.registry.systemPrompt(a) },
        { role: "user", content: prompt },
      ];
      const res = await ctx.exo.chat({ model: modelId, messages, temperature, max_tokens });
      const reply = res.choices?.[0]?.message?.content ?? "";
      return text(
        `[${a.name} · ${a.tier} · ${a.frequency}Hz · model=${modelId}]\n\n${reply || JSON.stringify(res)}`,
      );
    }),
  );
}
