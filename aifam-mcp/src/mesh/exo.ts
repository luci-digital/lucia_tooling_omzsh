import type { Logger } from "../logger.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: false;
}

export interface ChatResponse {
  id?: string;
  model?: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason?: string;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

export interface ExoModel {
  id: string;
  ready?: boolean;
  downloaded?: boolean;
  status?: string;
  [key: string]: unknown;
}

/**
 * Summary of the exo cluster derived from `GET /state`. exo nodes auto-discover
 * each other; each node runs an MLX (Apple Silicon) or tinygrad inference shard.
 */
export interface MeshState {
  nodeCount: number;
  nodes: MeshNode[];
  raw: unknown;
}

export interface MeshNode {
  id: string;
  runtime?: string; // "mlx" | "tinygrad" | ...
  model?: string;
  device?: string;
  memoryBytes?: number;
  flops?: number;
}

export class ExoError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "ExoError";
  }
}

/**
 * Thin client for an exo distributed-inference cluster. exo speaks an
 * OpenAI-compatible API, so the agents stay runtime-agnostic: the same calls
 * work whether a node is MLX on a Mac, tinygrad on a GPU, or a remote shard.
 */
export class ExoClient {
  private readonly base: string;

  constructor(
    baseUrl: string,
    private readonly defaultModel: string,
    private readonly timeoutMs: number,
    private readonly log: Logger,
  ) {
    this.base = baseUrl.replace(/\/+$/, "");
  }

  get defaultModelId(): string {
    return this.defaultModel;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.base}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      this.log.debug("exo request", { url, method: init?.method ?? "GET" });
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      });
      const text = await res.text();
      if (!res.ok) {
        throw new ExoError(`exo ${path} failed: ${res.status} ${res.statusText}`, res.status, text);
      }
      return (text ? JSON.parse(text) : {}) as T;
    } catch (err) {
      if (err instanceof ExoError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new ExoError(`exo ${path} timed out after ${this.timeoutMs}ms`);
      }
      throw new ExoError(
        `exo ${path} unreachable at ${this.base}: ${(err as Error).message}. Is exo running? (exo serve)`,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({ ...req, stream: false }),
    });
  }

  async listModels(status?: "downloaded"): Promise<ExoModel[]> {
    const qs = status ? `?status=${status}` : "";
    const data = await this.request<unknown>(`/models${qs}`);
    return normalizeModels(data);
  }

  async state(): Promise<MeshState> {
    const raw = await this.request<unknown>("/state");
    return normalizeState(raw);
  }

  /**
   * Ensure a model is placed on the cluster before inference. Creates an
   * instance and waits for readiness so the first chat call doesn't cold-start.
   */
  async ensureModel(modelId: string): Promise<{ modelId: string; ready: boolean }> {
    await this.request<unknown>("/instance", {
      method: "POST",
      body: JSON.stringify({ model_id: modelId }),
    }).catch((err) => {
      // An already-placed model may return a conflict; treat that as success.
      if (err instanceof ExoError && err.status && err.status >= 400 && err.status < 500) {
        this.log.debug("instance already present or rejected, awaiting readiness", {
          modelId,
          status: err.status,
        });
        return;
      }
      throw err;
    });
    await this.request<unknown>(`/instance/await?model_id=${encodeURIComponent(modelId)}`);
    return { modelId, ready: true };
  }
}

export function normalizeModels(data: unknown): ExoModel[] {
  if (Array.isArray(data)) return data as ExoModel[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.models)) return obj.models as ExoModel[];
    if (Array.isArray(obj.data)) return obj.data as ExoModel[];
    // Object keyed by model id -> { ... }
    return Object.entries(obj).map(([id, v]) => ({ id, ...(v as object) }) as ExoModel);
  }
  return [];
}

export function normalizeState(raw: unknown): MeshState {
  const nodes: MeshNode[] = [];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidates =
      (Array.isArray(obj.nodes) && obj.nodes) ||
      (Array.isArray(obj.topology) && obj.topology) ||
      (obj.nodes && typeof obj.nodes === "object" && Object.values(obj.nodes)) ||
      [];
    for (const entry of candidates as unknown[]) {
      if (!entry || typeof entry !== "object") continue;
      const n = entry as Record<string, unknown>;
      const device = (n.device_capabilities ?? n.device ?? {}) as Record<string, unknown>;
      nodes.push({
        id: String(n.id ?? n.node_id ?? n.name ?? "unknown"),
        runtime: asString(n.runtime ?? n.inference_engine ?? device.inference_engine),
        model: asString(n.model ?? n.current_model),
        device: asString(device.model ?? device.chip ?? n.chip),
        memoryBytes: asNumber(device.memory ?? n.memory),
        flops: asNumber(device.flops ?? n.flops),
      });
    }
  }
  return { nodeCount: nodes.length, nodes, raw };
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function asNumber(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}
