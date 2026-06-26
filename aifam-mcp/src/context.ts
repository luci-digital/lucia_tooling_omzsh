import type { Config } from "./config.js";
import { Logger } from "./logger.js";
import { ExoClient } from "./mesh/exo.js";
import { MatterClient } from "./matter/client.js";
import { AgentRegistry } from "./agents/registry.js";
import { BackendRegistry } from "./backends/registry.js";
import { MeshBackend } from "./backends/mesh.js";
import { OpenAICompatBackend } from "./backends/openai.js";
import { AnthropicBackend } from "./backends/anthropic.js";

/** Shared dependencies wired once and handed to every tool. */
export interface AppContext {
  config: Config;
  log: Logger;
  exo: ExoClient;
  matter: MatterClient;
  registry: AgentRegistry;
  backends: BackendRegistry;
}

export function createContext(config: Config): AppContext {
  const log = new Logger(config.logLevel);
  const exo = new ExoClient(
    config.exo.baseUrl,
    config.exo.defaultModel,
    config.exo.requestTimeoutMs,
    log.child("exo"),
  );
  const matter = new MatterClient(
    config.matter.wsUrl,
    config.matter.commandTimeoutMs,
    log.child("matter"),
  );
  const registry = AgentRegistry.load(log.child("agents"), config.luciverse.agentsFile);

  const backends = new BackendRegistry(
    [
      new MeshBackend(exo),
      new AnthropicBackend({
        apiKey: config.backends.anthropic.apiKey,
        baseUrl: config.backends.anthropic.baseUrl,
        defaultModel: config.backends.anthropic.defaultModel,
        maxTokens: config.backends.anthropic.maxTokens,
        timeoutMs: config.exo.requestTimeoutMs,
      }),
      new OpenAICompatBackend(
        {
          name: "openai",
          baseUrl: config.backends.openai.baseUrl,
          apiKey: config.backends.openai.apiKey,
          defaultModel: config.backends.openai.defaultModel,
        },
        config.exo.requestTimeoutMs,
        log.child("openai"),
      ),
    ],
    config.backends.default,
  );

  return { config, log, exo, matter, registry, backends };
}
