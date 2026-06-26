import type { Logger } from "../logger.js";
import type { BackendChatRequest, BackendChatResponse, ChatBackend } from "./types.js";

/**
 * OpenAI-compatible cloud backend. Works with the OpenAI API and any provider
 * that speaks the same /chat/completions shape (Groq, OpenRouter, Together,
 * vLLM, LM Studio, ...) by pointing baseUrl + apiKey at them.
 */
export class OpenAICompatBackend implements ChatBackend {
  readonly name: string;
  readonly description: string;
  readonly defaultModel: string;
  private readonly base: string;

  constructor(
    opts: { name?: string; baseUrl: string; apiKey?: string; defaultModel: string },
    private readonly timeoutMs: number,
    private readonly log: Logger,
  ) {
    this.name = opts.name ?? "openai";
    this.base = opts.baseUrl.replace(/\/+$/, "");
    this.defaultModel = opts.defaultModel;
    this.apiKey = opts.apiKey;
    this.description = `OpenAI-compatible cloud runtime at ${this.base}.`;
  }

  private readonly apiKey?: string;

  available(): boolean {
    return Boolean(this.apiKey);
  }

  async chat(req: BackendChatRequest): Promise<BackendChatResponse> {
    if (!this.apiKey) throw new Error(`${this.name} backend is not configured (missing API key).`);
    const model = req.model ?? this.defaultModel;
    this.log.debug("openai-compat chat", { base: this.base, model });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.base}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: req.messages,
          temperature: req.temperature,
          max_tokens: req.maxTokens,
          stream: false,
        }),
      });
      const body = await res.text();
      if (!res.ok) {
        throw new Error(`${this.name} chat failed: ${res.status} ${res.statusText} ${body.slice(0, 300)}`);
      }
      const data = JSON.parse(body) as {
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
      };
      return {
        text: data.choices?.[0]?.message?.content ?? "",
        model: data.model ?? model,
        backend: this.name,
      };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`${this.name} chat timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
