import WebSocket from "ws";
import type { Logger } from "../logger.js";

/**
 * Minimal client for the Home Assistant Matter Server WebSocket API
 * (home-assistant-libs/python-matter-server, default ws://host:5580/ws).
 *
 * Protocol: the server sends a ServerInfo message on connect, then every
 * command is `{ message_id, command, args }` and is answered by a message
 * carrying the same `message_id` with either `result` or `error_code`.
 */

export interface MatterCommandArgs {
  [key: string]: unknown;
}

export class MatterError extends Error {
  constructor(
    message: string,
    readonly code?: string | number,
  ) {
    super(message);
    this.name = "MatterError";
  }
}

interface Pending {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class MatterClient {
  private ws?: WebSocket;
  private connecting?: Promise<void>;
  private readonly pending = new Map<string, Pending>();
  private counter = 0;
  serverInfo?: Record<string, unknown>;

  constructor(
    private readonly url: string,
    private readonly commandTimeoutMs: number,
    private readonly log: Logger,
  ) {}

  private nextId(): string {
    this.counter += 1;
    return `aifam-${this.counter}`;
  }

  /** Lazily open the socket and wait for the initial ServerInfo handshake. */
  private async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.connecting) return this.connecting;

    this.connecting = new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      const onErr = (err: Error) => {
        this.connecting = undefined;
        reject(
          new MatterError(
            `cannot reach Matter Server at ${this.url}: ${err.message}. Is the Home Assistant Matter Server running?`,
          ),
        );
      };

      ws.once("error", onErr);

      ws.once("message", (data: WebSocket.RawData) => {
        // First frame is the ServerInfo handshake.
        try {
          this.serverInfo = JSON.parse(data.toString());
        } catch {
          this.serverInfo = undefined;
        }
        ws.off("error", onErr);
        ws.on("message", (d) => this.onMessage(d));
        ws.on("close", () => this.onClose());
        ws.on("error", (e) => this.log.warn("matter ws error", { error: e.message }));
        this.log.info("connected to Matter Server", { url: this.url });
        resolve();
      });
    });

    try {
      await this.connecting;
    } finally {
      this.connecting = undefined;
    }
  }

  private onMessage(data: WebSocket.RawData): void {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    const id = msg.message_id as string | undefined;
    if (!id || !this.pending.has(id)) return; // events without a request id are ignored for now
    const entry = this.pending.get(id)!;
    this.pending.delete(id);
    clearTimeout(entry.timer);
    if (msg.error_code !== undefined && msg.error_code !== null) {
      entry.reject(
        new MatterError(
          `Matter command failed (${String(msg.error_code)}): ${String(msg.details ?? "")}`,
          msg.error_code as string | number,
        ),
      );
    } else {
      entry.resolve(msg.result);
    }
  }

  private onClose(): void {
    this.log.warn("matter ws closed; pending commands rejected");
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(new MatterError("Matter Server connection closed"));
    }
    this.pending.clear();
    this.ws = undefined;
  }

  /** Send a command and await its correlated response. */
  async command<T = unknown>(command: string, args?: MatterCommandArgs): Promise<T> {
    await this.connect();
    const message_id = this.nextId();
    const payload = JSON.stringify(args ? { message_id, command, args } : { message_id, command });

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(message_id);
        reject(new MatterError(`Matter command "${command}" timed out after ${this.commandTimeoutMs}ms`));
      }, this.commandTimeoutMs);
      this.pending.set(message_id, { resolve: resolve as (v: unknown) => void, reject, timer });
      this.ws!.send(payload, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(message_id);
          reject(new MatterError(`failed to send "${command}": ${err.message}`));
        }
      });
    });
  }

  // --- Convenience wrappers over documented commands -----------------------

  getNodes(): Promise<unknown[]> {
    return this.command<unknown[]>("get_nodes");
  }
  getNode(nodeId: number): Promise<unknown> {
    return this.command("get_node", { node_id: nodeId });
  }
  deviceCommand(args: {
    node_id: number;
    endpoint_id: number;
    cluster_id: number;
    command_name: string;
    payload?: Record<string, unknown>;
  }): Promise<unknown> {
    return this.command("device_command", { payload: {}, ...args });
  }
  readAttribute(nodeId: number, attributePath: string): Promise<unknown> {
    return this.command("read_attribute", { node_id: nodeId, attribute_path: attributePath });
  }
  writeAttribute(nodeId: number, attributePath: string, value: unknown): Promise<unknown> {
    return this.command("write_attribute", { node_id: nodeId, attribute_path: attributePath, value });
  }
  commissionWithCode(code: string, networkOnly = false): Promise<unknown> {
    return this.command("commission_with_code", { code, network_only: networkOnly });
  }

  close(): void {
    this.ws?.close();
    this.ws = undefined;
  }
}
