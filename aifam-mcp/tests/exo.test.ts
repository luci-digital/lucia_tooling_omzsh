import { afterEach, describe, expect, it, vi } from "vitest";
import { ExoClient, normalizeModels, normalizeState } from "../src/mesh/exo.js";
import { Logger } from "../src/logger.js";

const log = new Logger("error");

describe("normalizeModels", () => {
  it("handles a plain array", () => {
    expect(normalizeModels([{ id: "a" }, { id: "b" }])).toHaveLength(2);
  });
  it("handles { models: [...] }", () => {
    expect(normalizeModels({ models: [{ id: "a" }] })[0].id).toBe("a");
  });
  it("handles an id-keyed object", () => {
    const out = normalizeModels({ "llama-3.2-3b": { downloaded: true } });
    expect(out[0]).toMatchObject({ id: "llama-3.2-3b", downloaded: true });
  });
});

describe("normalizeState", () => {
  it("extracts nodes and runtime/device fields", () => {
    const state = normalizeState({
      nodes: [
        { id: "n1", runtime: "mlx", device_capabilities: { model: "M3 Max", memory: 128 } },
        { node_id: "n2", inference_engine: "tinygrad" },
      ],
    });
    expect(state.nodeCount).toBe(2);
    expect(state.nodes[0]).toMatchObject({ id: "n1", runtime: "mlx", device: "M3 Max", memoryBytes: 128 });
    expect(state.nodes[1]).toMatchObject({ id: "n2", runtime: "tinygrad" });
  });
  it("is safe on empty/garbage input", () => {
    expect(normalizeState(null).nodeCount).toBe(0);
    expect(normalizeState({}).nodeCount).toBe(0);
  });
});

describe("ExoClient.chat", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts to the OpenAI-compatible endpoint and parses the reply", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ choices: [{ index: 0, message: { role: "assistant", content: "hi" } }] }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new ExoClient("http://exo.local:52415/", "llama-3.2-3b", 5000, log);
    const res = await client.chat({ model: "m", messages: [{ role: "user", content: "yo" }] });

    expect(res.choices[0].message.content).toBe("hi");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://exo.local:52415/v1/chat/completions");
    expect(JSON.parse((init as RequestInit).body as string).stream).toBe(false);
  });

  it("raises a helpful error when exo is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    const client = new ExoClient("http://localhost:52415", "m", 5000, log);
    await expect(client.state()).rejects.toThrow(/exo .* unreachable/);
  });
});
