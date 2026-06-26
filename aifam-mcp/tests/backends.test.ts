import { afterEach, describe, expect, it, vi } from "vitest";
import { Logger } from "../src/logger.js";
import { ExoClient } from "../src/mesh/exo.js";
import { MeshBackend } from "../src/backends/mesh.js";
import { OpenAICompatBackend } from "../src/backends/openai.js";
import { BackendRegistry } from "../src/backends/registry.js";
import { splitSystem } from "../src/backends/types.js";

const log = new Logger("error");

describe("splitSystem", () => {
  it("separates system messages from dialogue turns", () => {
    const { system, turns } = splitSystem([
      { role: "system", content: "you are X" },
      { role: "user", content: "hi" },
      { role: "assistant", content: "yo" },
    ]);
    expect(system).toBe("you are X");
    expect(turns).toHaveLength(2);
    expect(turns[0].role).toBe("user");
  });
});

describe("MeshBackend", () => {
  afterEach(() => vi.restoreAllMocks());
  it("routes chat through the exo client", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ model: "m", choices: [{ index: 0, message: { role: "assistant", content: "hi" } }] }),
          { status: 200 },
        ),
      ),
    );
    const exo = new ExoClient("http://exo:52415", "llama-3.2-3b", 5000, log);
    const mesh = new MeshBackend(exo);
    expect(mesh.available()).toBe(true);
    expect(mesh.defaultModel).toBe("llama-3.2-3b");
    const res = await mesh.chat({ messages: [{ role: "user", content: "yo" }] });
    expect(res).toMatchObject({ text: "hi", backend: "mesh" });
  });
});

describe("OpenAICompatBackend", () => {
  afterEach(() => vi.restoreAllMocks());

  it("is unavailable without an API key", () => {
    const b = new OpenAICompatBackend({ baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" }, 5000, log);
    expect(b.available()).toBe(false);
  });

  it("posts to /chat/completions with a bearer token", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ model: "gpt-x", choices: [{ message: { content: "cloud-hi" } }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const b = new OpenAICompatBackend(
      { baseUrl: "https://api.openai.com/v1/", apiKey: "sk-test", defaultModel: "gpt-4o-mini" },
      5000,
      log,
    );
    expect(b.available()).toBe(true);
    const res = await b.chat({ messages: [{ role: "user", content: "hey" }] });
    expect(res).toMatchObject({ text: "cloud-hi", backend: "openai" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect((init as RequestInit).headers).toMatchObject({ authorization: "Bearer sk-test" });
  });
});

describe("BackendRegistry", () => {
  it("lists, resolves the default, and rejects unconfigured backends", async () => {
    const exo = new ExoClient("http://exo:52415", "m", 5000, log);
    const reg = new BackendRegistry(
      [
        new MeshBackend(exo),
        new OpenAICompatBackend({ name: "openai", baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" }, 5000, log),
      ],
      "mesh",
    );
    expect(reg.availableNames()).toEqual(["mesh"]);
    expect(reg.resolve().name).toBe("mesh");
    expect(() => reg.resolve("openai")).toThrow(/not configured/);
    expect(() => reg.resolve("nope")).toThrow(/Unknown backend/);
    expect(reg.list().find((b) => b.name === "mesh")?.available).toBe(true);
  });
});
