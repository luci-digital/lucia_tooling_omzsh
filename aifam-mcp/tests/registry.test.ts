import { describe, expect, it } from "vitest";
import { AgentRegistry, DEFAULT_AGENTS } from "../src/agents/registry.js";
import { Logger } from "../src/logger.js";

const log = new Logger("error");

describe("AgentRegistry", () => {
  it("loads the built-in roster grounded in the Luciverse frequency map", () => {
    const reg = AgentRegistry.load(log);
    expect(reg.list().length).toBe(DEFAULT_AGENTS.length);
    expect(reg.get("lucia")).toMatchObject({ frequency: 741, tier: "PAC" });
    expect(reg.get("judge-luci")).toMatchObject({ frequency: 963, tier: "CORE" });
    expect(reg.get("veritas")).toMatchObject({ frequency: 528 });
  });

  it("returns undefined for unknown agents", () => {
    expect(AgentRegistry.load(log).get("nobody")).toBeUndefined();
  });

  it("builds a system prompt that frames the agent identity and tier flow", () => {
    const reg = AgentRegistry.load(log);
    const prompt = reg.systemPrompt(reg.get("lucia")!);
    expect(prompt).toContain("You are Lucia");
    expect(prompt).toContain("741 Hz");
    expect(prompt).toContain("PAC -> COMN -> CORE");
  });

  it("falls back to defaults when the roster file is missing", () => {
    const reg = AgentRegistry.load(log, "/nonexistent/agents.json");
    expect(reg.list().length).toBe(DEFAULT_AGENTS.length);
  });
});
