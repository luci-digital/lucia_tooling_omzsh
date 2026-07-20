import type { BackendChatRequest, BackendChatResponse, ChatBackend } from "./types.js";

/** Holds the configured chat backends and routes requests by name. */
export class BackendRegistry {
  private readonly byName = new Map<string, ChatBackend>();

  constructor(
    backends: ChatBackend[],
    private readonly defaultBackend: string,
  ) {
    for (const b of backends) this.byName.set(b.name, b);
  }

  /** All registered backends with their availability. */
  list(): Array<{ name: string; description: string; defaultModel: string; available: boolean }> {
    return [...this.byName.values()].map((b) => ({
      name: b.name,
      description: b.description,
      defaultModel: b.defaultModel,
      available: b.available(),
    }));
  }

  /** Names of backends that are configured and usable. */
  availableNames(): string[] {
    return [...this.byName.values()].filter((b) => b.available()).map((b) => b.name);
  }

  get(name: string): ChatBackend | undefined {
    return this.byName.get(name);
  }

  /** Resolve a backend name to a usable backend, applying the default. */
  resolve(name?: string): ChatBackend {
    const target = name ?? this.defaultBackend;
    const backend = this.byName.get(target);
    if (!backend) {
      throw new Error(`Unknown backend "${target}". Available: ${[...this.byName.keys()].join(", ")}`);
    }
    if (!backend.available()) {
      throw new Error(`Backend "${target}" is registered but not configured (missing API key?).`);
    }
    return backend;
  }

  chat(name: string | undefined, req: BackendChatRequest): Promise<BackendChatResponse> {
    return this.resolve(name).chat(req);
  }
}
