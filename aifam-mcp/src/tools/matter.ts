import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { fail, guard, json } from "./helpers.js";

export function registerMatterTools(server: McpServer, ctx: AppContext): void {
  if (!ctx.config.matter.enabled) {
    ctx.log.info("Matter tools disabled (MATTER_ENABLED=false)");
    return;
  }

  server.registerTool(
    "matter_devices",
    {
      title: "List Matter devices",
      description:
        "List all Matter devices commissioned on the Home Assistant Matter Server (lights, plugs, sensors, locks, thermostats). Returns the controller's node list.",
      inputSchema: {},
    },
    guard(async () => {
      const nodes = await ctx.matter.getNodes();
      return json({ count: Array.isArray(nodes) ? nodes.length : 0, nodes });
    }),
  );

  server.registerTool(
    "matter_device",
    {
      title: "Get a Matter device",
      description: "Get the full attribute set for a single commissioned Matter node by id.",
      inputSchema: { node_id: z.number().int().describe("Matter node id.") },
    },
    guard(async ({ node_id }) => json(await ctx.matter.getNode(node_id))),
  );

  server.registerTool(
    "matter_command",
    {
      title: "Send a Matter cluster command",
      description:
        "Invoke a cluster command on a device endpoint, e.g. OnOff cluster (id 6) On/Off/Toggle, or LevelControl (id 8) MoveToLevel. cluster_id and command_name follow the Matter spec.",
      inputSchema: {
        node_id: z.number().int(),
        endpoint_id: z.number().int().describe("Endpoint on the device, usually 1."),
        cluster_id: z.number().int().describe("Matter cluster id, e.g. 6 = OnOff, 8 = LevelControl."),
        command_name: z.string().describe('Command name, e.g. "On", "Off", "Toggle", "MoveToLevel".'),
        payload: z.record(z.unknown()).optional().describe("Command payload fields, if any."),
      },
    },
    guard(async (args) => json(await ctx.matter.deviceCommand(args))),
  );

  server.registerTool(
    "matter_read_attribute",
    {
      title: "Read a Matter attribute",
      description:
        'Read an attribute value via its path "endpoint/cluster/attribute" (e.g. "1/6/0" for OnOff state).',
      inputSchema: {
        node_id: z.number().int(),
        attribute_path: z.string().describe('Path "endpoint/cluster/attribute", e.g. "1/6/0".'),
      },
    },
    guard(async ({ node_id, attribute_path }) =>
      json(await ctx.matter.readAttribute(node_id, attribute_path)),
    ),
  );

  server.registerTool(
    "matter_write_attribute",
    {
      title: "Write a Matter attribute",
      description: 'Write a value to an attribute path "endpoint/cluster/attribute".',
      inputSchema: {
        node_id: z.number().int(),
        attribute_path: z.string(),
        value: z.unknown().describe("New attribute value."),
      },
    },
    guard(async ({ node_id, attribute_path, value }) =>
      json(await ctx.matter.writeAttribute(node_id, attribute_path, value)),
    ),
  );

  server.registerTool(
    "matter_commission",
    {
      title: "Commission a Matter device",
      description:
        "Commission a new Matter device using its pairing code (QR string starting MT: or an 11/21-digit manual code).",
      inputSchema: {
        code: z.string().describe("Matter pairing code (MT:... QR payload or numeric manual code)."),
        network_only: z
          .boolean()
          .default(false)
          .describe("Commission an already network-joined device only."),
      },
    },
    guard(async ({ code, network_only }) => {
      if (!code.trim()) return fail("A non-empty pairing code is required.");
      return json(await ctx.matter.commissionWithCode(code, network_only));
    }),
  );
}
