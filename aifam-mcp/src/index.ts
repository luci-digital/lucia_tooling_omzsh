#!/usr/bin/env node
import { createServer as createHttpServer, type IncomingMessage } from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadConfig, SERVER_NAME, SERVER_VERSION } from "./config.js";
import { createContext } from "./context.js";
import { createServer } from "./server.js";

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : undefined;
}

async function runStdio(): Promise<void> {
  const config = loadConfig();
  const ctx = createContext(config);
  const server = createServer(ctx);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  ctx.log.info(`${SERVER_NAME} v${SERVER_VERSION} ready on stdio`, {
    exo: config.exo.baseUrl,
    matter: config.matter.enabled ? config.matter.wsUrl : "disabled",
  });
}

async function runHttp(): Promise<void> {
  const config = loadConfig();
  const ctx = createContext(config);
  const { host, port, path } = config.http;

  // Stateless Streamable HTTP: a fresh server + transport per request keeps
  // concurrent runtimes isolated and avoids request-id collisions.
  const http = createHttpServer(async (req, res) => {
    if (req.url?.split("?")[0] !== path) {
      res.writeHead(404).end("not found");
      return;
    }
    if (req.method === "GET" && req.headers.accept?.includes("text/html")) {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end(`${SERVER_NAME} v${SERVER_VERSION} - POST MCP JSON-RPC to ${path}`);
      return;
    }
    try {
      const server = createServer(ctx);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, await readBody(req));
    } catch (err) {
      ctx.log.error("http request failed", { error: (err as Error).message });
      if (!res.headersSent) res.writeHead(500).end("internal error");
    }
  });

  http.listen(port, host, () => {
    ctx.log.info(`${SERVER_NAME} v${SERVER_VERSION} ready on http`, {
      url: `http://${host}:${port}${path}`,
      exo: config.exo.baseUrl,
      matter: config.matter.enabled ? config.matter.wsUrl : "disabled",
    });
  });
}

async function main(): Promise<void> {
  const transport = (process.env.AIFAM_TRANSPORT ?? "stdio").toLowerCase();
  if (transport === "http") await runHttp();
  else await runStdio();
}

main().catch((err) => {
  process.stderr.write(`fatal: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
