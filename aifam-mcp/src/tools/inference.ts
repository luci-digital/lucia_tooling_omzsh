import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import type { ChatMessage } from "../mesh/exo.js";
import { guard, json, text } from "./helpers.js";

const messageShape = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string(),
});

export function registerInferenceTools(server: McpServer, ctx: AppContext): void {
  server.registerTool(
    "inference_chat",
    {
      title: "Distributed chat completion",
      description:
        "Run a chat completion on the exo + MLX distributed mesh. exo shards the model across auto-discovered nodes (MLX on Apple Silicon, tinygrad on GPUs) behind an OpenAI-compatible API, so this works from any AI runtime.",
      inputSchema: {
        messages: z.array(messageShape).min(1).describe("Chat messages in order."),
        model: z
          .string()
          .optional()
          .describe("Model id on the mesh. Defaults to the configured mesh default."),
        temperature: z.number().min(0).max(2).optional(),
        max_tokens: z.number().int().positive().optional(),
        ensure: z
          .boolean()
          .default(false)
          .describe("Place and warm the model on the cluster before inference to avoid a cold start."),
      },
    },
    guard(async ({ messages, model, temperature, max_tokens, ensure }) => {
      const modelId = model ?? ctx.exo.defaultModelId;
      if (ensure) await ctx.exo.ensureModel(modelId);
      const res = await ctx.exo.chat({
        model: modelId,
        messages: messages as ChatMessage[],
        temperature,
        max_tokens,
      });
      const reply = res.choices?.[0]?.message?.content ?? "";
      return text(reply || JSON.stringify(res));
    }),
  );

  server.registerTool(
    "mesh_status",
    {
      title: "Inference mesh status",
      description:
        "Inspect the exo cluster topology: discovered nodes, their inference runtime (MLX/tinygrad), device, and memory. Use this to see distributed-inference capacity.",
      inputSchema: {},
    },
    guard(async () => {
      const state = await ctx.exo.state();
      return json({
        endpoint: ctx.config.exo.baseUrl,
        nodeCount: state.nodeCount,
        nodes: state.nodes,
      });
    }),
  );

  server.registerTool(
    "mesh_models",
    {
      title: "List mesh models",
      description: "List models known to the exo cluster, optionally only those already downloaded.",
      inputSchema: {
        downloadedOnly: z.boolean().default(false).describe("Only return downloaded models."),
      },
    },
    guard(async ({ downloadedOnly }) => {
      const models = await ctx.exo.listModels(downloadedOnly ? "downloaded" : undefined);
      return json({ count: models.length, defaultModel: ctx.exo.defaultModelId, models });
    }),
  );

  server.registerTool(
    "mesh_ensure_model",
    {
      title: "Place and warm a model",
      description:
        "Create an inference instance for a model on the cluster and wait until it is ready, so subsequent inference calls do not cold-start.",
      inputSchema: {
        model: z.string().describe("Model id to place on the mesh."),
      },
    },
    guard(async ({ model }) => {
      const result = await ctx.exo.ensureModel(model);
      return json(result);
    }),
  );
}
