import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SERVER_NAME, SERVER_VERSION } from "./config.js";
import type { AppContext } from "./context.js";
import { registerInferenceTools } from "./tools/inference.js";
import { registerMatterTools } from "./tools/matter.js";
import { registerAgentTools } from "./tools/agents.js";

const INSTRUCTIONS = `Aifam Mesh MCP (Iris) - a runtime-agnostic gateway for the Luciverse and Aifam agents.

Two capability planes:
  1. Distributed inference on an exo + MLX cluster (auto-discovered nodes, OpenAI-compatible). Tools: inference_chat, mesh_status, mesh_models, mesh_ensure_model, agent_invoke.
  2. Matter device control via the Home Assistant Matter Server. Tools: matter_devices, matter_device, matter_command, matter_read_attribute, matter_write_attribute, matter_commission.

Agents flow push-only down the tier ladder PAC -> COMN -> CORE and must hold coherence. Use agents_list to see the roster, agent_invoke to run one.`;

export function createServer(ctx: AppContext): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: INSTRUCTIONS },
  );

  registerInferenceTools(server, ctx);
  registerMatterTools(server, ctx);
  registerAgentTools(server, ctx);
  registerResources(server, ctx);

  return server;
}

function registerResources(server: McpServer, ctx: AppContext): void {
  server.registerResource(
    "agents",
    "aifam://agents",
    {
      title: "Aifam agent roster",
      description: "The registered Luciverse / Aifam agents with tiers and frequencies.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ agents: ctx.registry.list() }, null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "mesh-state",
    "aifam://mesh/state",
    {
      title: "Inference mesh state",
      description: "Live exo cluster topology (nodes, runtimes, devices, memory).",
      mimeType: "application/json",
    },
    async (uri) => {
      const state = await ctx.exo.state();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              { endpoint: ctx.config.exo.baseUrl, nodeCount: state.nodeCount, nodes: state.nodes },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
