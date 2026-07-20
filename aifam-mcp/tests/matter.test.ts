import { afterEach, describe, expect, it } from "vitest";
import { AddressInfo } from "node:net";
import { WebSocketServer, type WebSocket } from "ws";
import { MatterClient } from "../src/matter/client.js";
import { Logger } from "../src/logger.js";

const log = new Logger("error");

/**
 * Spin up a fake Home Assistant Matter Server: send a ServerInfo frame on
 * connect, then echo command results keyed by message_id.
 */
function startFakeServer(
  handler: (cmd: Record<string, unknown>) => Record<string, unknown>,
): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve) => {
    const wss = new WebSocketServer({ port: 0 }, () => {
      const { port } = wss.address() as AddressInfo;
      resolve({ url: `ws://127.0.0.1:${port}/ws`, close: () => wss.close() });
    });
    wss.on("connection", (ws: WebSocket) => {
      ws.send(JSON.stringify({ fabric_id: 1, schema_version: 11, sdk_version: "matter" }));
      ws.on("message", (data) => {
        const cmd = JSON.parse(data.toString());
        ws.send(JSON.stringify({ message_id: cmd.message_id, ...handler(cmd) }));
      });
    });
  });
}

describe("MatterClient", () => {
  let server: { url: string; close: () => void } | undefined;
  afterEach(() => server?.close());

  it("performs the ServerInfo handshake and correlates a command result", async () => {
    server = await startFakeServer((cmd) => {
      if (cmd.command === "get_nodes") return { result: [{ node_id: 1 }, { node_id: 2 }] };
      return { result: null };
    });
    const client = new MatterClient(server.url, 3000, log);
    const nodes = await client.getNodes();
    expect(nodes).toHaveLength(2);
    expect(client.serverInfo).toMatchObject({ fabric_id: 1 });
    client.close();
  });

  it("sends device_command with the documented envelope", async () => {
    let received: Record<string, unknown> | undefined;
    server = await startFakeServer((cmd) => {
      received = cmd;
      return { result: { ok: true } };
    });
    const client = new MatterClient(server.url, 3000, log);
    await client.deviceCommand({ node_id: 1, endpoint_id: 1, cluster_id: 6, command_name: "On" });
    expect(received).toMatchObject({
      command: "device_command",
      args: { node_id: 1, endpoint_id: 1, cluster_id: 6, command_name: "On", payload: {} },
    });
    client.close();
  });

  it("surfaces error_code responses as MatterError", async () => {
    server = await startFakeServer(() => ({ error_code: 1, details: "no such node" }));
    const client = new MatterClient(server.url, 3000, log);
    await expect(client.getNode(99)).rejects.toThrow(/no such node/);
    client.close();
  });

  it("reports a clear error when the server is unreachable", async () => {
    const client = new MatterClient("ws://127.0.0.1:1/ws", 1000, log);
    await expect(client.getNodes()).rejects.toThrow(/cannot reach Matter Server/);
  });
});
