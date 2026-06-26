import type { Config } from "./config.js";
import { Logger } from "./logger.js";
import { ExoClient } from "./mesh/exo.js";
import { MatterClient } from "./matter/client.js";
import { AgentRegistry } from "./agents/registry.js";

/** Shared dependencies wired once and handed to every tool. */
export interface AppContext {
  config: Config;
  log: Logger;
  exo: ExoClient;
  matter: MatterClient;
  registry: AgentRegistry;
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
  return { config, log, exo, matter, registry };
}
