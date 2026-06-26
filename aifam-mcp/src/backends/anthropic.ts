import Anthropic from "@anthropic-ai/sdk";
import type { BackendChatRequest, BackendChatResponse, ChatBackend } from "./types.js";
import { splitSystem } from "./types.js";

/**
 * Anthropic (Claude) cloud backend, via the official @anthropic-ai/sdk.
 *
 * Note: the current Opus family (claude-opus-4-8) uses adaptive thinking and
 * rejects sampling params (temperature/top_p), so we deliberately do not
 * forward `temperature` here — system + messages + max_tokens only.
 */
export class AnthropicBackend implements ChatBackend {
  readonly name = "anthropic";
  readonly description = "Anthropic Claude (cloud) via the official SDK.";
  readonly defaultModel: string;
  private readonly client?: Anthropic;
  private readonly maxTokens: number;

  constructor(opts: {
    apiKey?: string;
    baseUrl?: string;
    defaultModel: string;
    maxTokens: number;
    timeoutMs: number;
  }) {
    this.defaultModel = opts.defaultModel;
    this.maxTokens = opts.maxTokens;
    if (opts.apiKey) {
      this.client = new Anthropic({
        apiKey: opts.apiKey,
        ...(opts.baseUrl ? { baseURL: opts.baseUrl } : {}),
        timeout: opts.timeoutMs,
      });
    }
  }

  available(): boolean {
    return Boolean(this.client);
  }

  async chat(req: BackendChatRequest): Promise<BackendChatResponse> {
    if (!this.client) throw new Error("anthropic backend is not configured (missing ANTHROPIC_API_KEY).");
    const model = req.model ?? this.defaultModel;
    const { system, turns } = splitSystem(req.messages);
    const messages = turns.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));
    const res = await this.client.messages.create({
      model,
      max_tokens: req.maxTokens ?? this.maxTokens,
      ...(system ? { system } : {}),
      messages,
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return { text, model: res.model ?? model, backend: this.name };
  }
}
