import type { ChatMessage } from "../mesh/exo.js";

export type { ChatMessage };

export interface BackendChatRequest {
  /** Model id; falls back to the backend's default when omitted. */
  model?: string;
  /** Ordered messages, may include a leading system message. */
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface BackendChatResponse {
  text: string;
  model: string;
  backend: string;
}

/**
 * A chat backend the Aifam mesh can route an agent to. The same interface
 * fronts local distributed inference (exo + MLX) and cloud runtimes
 * (Anthropic, OpenAI-compatible), so agents stay backend-agnostic.
 */
export interface ChatBackend {
  /** Stable id used to select this backend, e.g. "mesh", "anthropic", "openai". */
  readonly name: string;
  /** Human description for listings. */
  readonly description: string;
  /** Default model id for this backend. */
  readonly defaultModel: string;
  /** Whether the backend is configured and usable (e.g. has an API key). */
  available(): boolean;
  chat(req: BackendChatRequest): Promise<BackendChatResponse>;
}

/** Split a message list into the system prompt and the dialogue turns. */
export function splitSystem(messages: ChatMessage[]): {
  system?: string;
  turns: ChatMessage[];
} {
  const systemParts: string[] = [];
  const turns: ChatMessage[] = [];
  for (const m of messages) {
    if (m.role === "system") systemParts.push(m.content);
    else turns.push(m);
  }
  return {
    system: systemParts.length ? systemParts.join("\n\n") : undefined,
    turns,
  };
}
