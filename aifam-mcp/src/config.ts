import { z } from "zod";

/**
 * Parse a boolean-ish environment string. `z.coerce.boolean()` treats any
 * non-empty string as `true` (so "false" -> true), which is the wrong default
 * for env flags, hence this explicit helper.
 */
function envBool(defaultValue: boolean) {
  return z
    .preprocess((v) => {
      if (v === undefined || v === null || v === "") return defaultValue;
      return !["false", "0", "no", "off"].includes(String(v).toLowerCase());
    }, z.boolean())
    .default(defaultValue);
}

const ConfigSchema = z.object({
  transport: z.enum(["stdio", "http"]).default("stdio"),
  http: z.object({
    host: z.string().default("127.0.0.1"),
    port: z.coerce.number().int().positive().default(8788),
    path: z.string().default("/mcp"),
  }),
  exo: z.object({
    baseUrl: z.string().url().default("http://localhost:52415"),
    defaultModel: z.string().default("llama-3.2-3b"),
    requestTimeoutMs: z.coerce.number().int().positive().default(600_000),
  }),
  matter: z.object({
    enabled: envBool(true),
    wsUrl: z.string().default("ws://localhost:5580/ws"),
    commandTimeoutMs: z.coerce.number().int().positive().default(30_000),
  }),
  luciverse: z.object({
    coherenceMin: z.coerce.number().min(0).max(1).default(0.7),
    agentsFile: z.string().optional(),
  }),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return ConfigSchema.parse({
    transport: env.AIFAM_TRANSPORT,
    http: {
      host: env.AIFAM_HTTP_HOST,
      port: env.AIFAM_HTTP_PORT,
      path: env.AIFAM_HTTP_PATH,
    },
    exo: {
      baseUrl: env.EXO_BASE_URL,
      defaultModel: env.EXO_DEFAULT_MODEL,
      requestTimeoutMs: env.EXO_REQUEST_TIMEOUT_MS,
    },
    matter: {
      enabled: env.MATTER_ENABLED,
      wsUrl: env.MATTER_WS_URL,
      commandTimeoutMs: env.MATTER_COMMAND_TIMEOUT_MS,
    },
    luciverse: {
      coherenceMin: env.LUCIVERSE_COHERENCE_MIN,
      agentsFile: env.AIFAM_AGENTS_FILE,
    },
    logLevel: env.LOG_LEVEL,
  });
}

export const SERVER_NAME = "aifam-mesh";
export const SERVER_VERSION = "0.1.0";
