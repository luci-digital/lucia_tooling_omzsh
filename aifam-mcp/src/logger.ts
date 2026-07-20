type Level = "debug" | "info" | "warn" | "error";

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/**
 * Structured logger that writes to stderr only. stdout is reserved for the MCP
 * stdio transport, so anything written there would corrupt the protocol stream.
 */
export class Logger {
  constructor(
    private readonly level: Level = "info",
    private readonly scope = "aifam",
  ) {}

  child(scope: string): Logger {
    return new Logger(this.level, `${this.scope}:${scope}`);
  }

  private write(level: Level, msg: string, meta?: unknown): void {
    if (ORDER[level] < ORDER[this.level]) return;
    const record: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      scope: this.scope,
      msg,
    };
    if (meta !== undefined) record.meta = meta;
    process.stderr.write(`${JSON.stringify(record)}\n`);
  }

  debug(msg: string, meta?: unknown): void {
    this.write("debug", msg, meta);
  }
  info(msg: string, meta?: unknown): void {
    this.write("info", msg, meta);
  }
  warn(msg: string, meta?: unknown): void {
    this.write("warn", msg, meta);
  }
  error(msg: string, meta?: unknown): void {
    this.write("error", msg, meta);
  }
}
