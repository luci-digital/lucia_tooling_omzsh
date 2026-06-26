import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import type { Agent } from "../agents/registry.js";
import type { ChatMessage } from "../mesh/exo.js";
import { fail, guard, json, text } from "./helpers.js";

function coherenceGate(ctx: AppContext, agent: Agent): string | undefined {
  const min = ctx.config.luciverse.coherenceMin;
  if (agent.coherence < min) {
    return `Agent "${agent.id}" coherence ${agent.coherence} is below the Luciverse minimum ${min}; invocation refused.`;
  }
  return undefined;
}

export function registerAgentTools(server: McpServer, ctx: AppContext): void {
  server.registerTool(
    "agents_list",
    {
      title: "List Aifam agents",
      description:
        "List the registered Luciverse / Aifam agents with their tier, bonded frequency, role, coherence, and preferred backend.",
      inputSchema: {},
    },
    guard(async () => json({ agents: ctx.registry.list() })),
  );

  server.registerTool(
    "backends_list",
    {
      title: "List inference backends",
      description:
        "List the chat backends an agent can be routed to (mesh = exo + MLX, plus cloud runtimes like anthropic and openai) and which are configured/available.",
      inputSchema: {},
    },
    guard(async () =>
      json({ default: ctx.config.backends.default, backends: ctx.backends.list() }),
    ),
  );

  server.registerTool(
    "agent_invoke",
    {
      title: "Invoke an Aifam agent",
      description:
        "Route a prompt to a named Luciverse / Aifam agent. The agent is framed with its tier, frequency, and role, then run on the chosen backend (mesh, anthropic, or openai). Honors the Luciverse minimum coherence gate.",
      inputSchema: {
        agent: z.string().describe("Agent id, e.g. lucia, veritas, juniper, cortana, judge-luci, root."),
        prompt: z.string().describe("The user prompt / task for the agent."),
        backend: z
          .string()
          .optional()
          .describe("Backend id: mesh | anthropic | openai. Defaults to the agent's preferred backend, then the global default."),
        model: z.string().optional().describe("Override the model id; defaults to the agent's preferred model or the backend default."),
        temperature: z.number().min(0).max(2).optional(),
        max_tokens: z.number().int().positive().optional(),
      },
    },
    guard(async ({ agent, prompt, backend, model, temperature, max_tokens }) => {
      const a = ctx.registry.get(agent);
      if (!a) {
        const ids = ctx.registry.list().map((x) => x.id).join(", ");
        return fail(`Unknown agent "${agent}". Available: ${ids}`);
      }
      const gate = coherenceGate(ctx, a);
      if (gate) return fail(gate);

      const target = backend ?? a.backend;
      const messages: ChatMessage[] = [
        { role: "system", content: ctx.registry.systemPrompt(a) },
        { role: "user", content: prompt },
      ];
      const res = await ctx.backends.chat(target, {
        model: model ?? a.model,
        messages,
        temperature,
        maxTokens: max_tokens,
      });
      return text(
        `[${a.name} · ${a.tier} · ${a.frequency}Hz · ${res.backend}:${res.model}]\n\n${res.text || "(empty response)"}`,
      );
    }),
  );

  server.registerTool(
    "agent_fanout",
    {
      title: "Fan an agent across backends",
      description:
        "Run the same prompt for one agent across multiple backends in parallel (e.g. mesh + anthropic + openai) and return every response side by side. Defaults to all configured backends. Useful for ensembling local and cloud runtimes.",
      inputSchema: {
        agent: z.string().describe("Agent id to run."),
        prompt: z.string().describe("The prompt to fan out."),
        backends: z
          .array(z.string())
          .optional()
          .describe("Backend ids to run on. Defaults to all configured/available backends."),
        model: z.string().optional().describe("Override the model id on every backend."),
        temperature: z.number().min(0).max(2).optional(),
        max_tokens: z.number().int().positive().optional(),
      },
    },
    guard(async ({ agent, prompt, backends, model, temperature, max_tokens }) => {
      const a = ctx.registry.get(agent);
      if (!a) {
        const ids = ctx.registry.list().map((x) => x.id).join(", ");
        return fail(`Unknown agent "${agent}". Available: ${ids}`);
      }
      const gate = coherenceGate(ctx, a);
      if (gate) return fail(gate);

      const targets = backends ?? ctx.backends.availableNames();
      if (targets.length === 0) return fail("No configured backends to fan out to.");

      const messages: ChatMessage[] = [
        { role: "system", content: ctx.registry.systemPrompt(a) },
        { role: "user", content: prompt },
      ];
      const results = await Promise.all(
        targets.map(async (name) => {
          try {
            const res = await ctx.backends.chat(name, {
              model: model ?? a.model,
              messages,
              temperature,
              maxTokens: max_tokens,
            });
            return { backend: name, model: res.model, ok: true as const, text: res.text };
          } catch (err) {
            return { backend: name, ok: false as const, error: (err as Error).message };
          }
        }),
      );
      return json({ agent: a.id, tier: a.tier, frequency: a.frequency, results });
    }),
  );
}
