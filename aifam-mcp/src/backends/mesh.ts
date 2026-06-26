import type { ExoClient } from "../mesh/exo.js";
import type { BackendChatRequest, BackendChatResponse, ChatBackend } from "./types.js";

/**
 * The local distributed-inference backend: routes chat to the exo + MLX
 * cluster. Always "available" — if no cluster is up, exo's client surfaces a
 * clear error at call time rather than at registration.
 */
export class MeshBackend implements ChatBackend {
  readonly name = "mesh";
  readonly description = "Distributed inference on the exo + MLX cluster (local, auto-discovered nodes).";

  constructor(private readonly exo: ExoClient) {}

  get defaultModel(): string {
    return this.exo.defaultModelId;
  }

  available(): boolean {
    return true;
  }

  async chat(req: BackendChatRequest): Promise<BackendChatResponse> {
    const model = req.model ?? this.defaultModel;
    const res = await this.exo.chat({
      model,
      messages: req.messages,
      temperature: req.temperature,
      max_tokens: req.maxTokens,
    });
    return {
      text: res.choices?.[0]?.message?.content ?? "",
      model: res.model ?? model,
      backend: this.name,
    };
  }
}
