import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

// Test config loading with a temp directory
describe("config", () => {
  let tmpDir: string;
  let originalHome: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-ding-test-"));
    originalHome = process.env.HOME!;
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns default config when no config file exists", async () => {
    const { loadConfig } = await import("../config/loader.js");
    const config = loadConfig();
    expect(config.preset).toBe("minimal");
    expect(config.volume).toBe(70);
    expect(config.tts.enabled).toBe(false);
  });

  it("saves and loads config", async () => {
    const { loadConfig, saveConfig } = await import("../config/loader.js");
    const config = loadConfig();
    config.preset = "starcraft";
    config.volume = 50;
    saveConfig(config);

    const loaded = loadConfig();
    expect(loaded.preset).toBe("starcraft");
    expect(loaded.volume).toBe(50);
  });
});

describe("config types", () => {
  it("exports sound names", async () => {
    const { SOUND_NAMES, PRESET_NAMES } = await import("../config/types.js");
    expect(SOUND_NAMES).toContain("task-complete");
    expect(SOUND_NAMES).toContain("error");
    expect(PRESET_NAMES).toContain("minimal");
    expect(PRESET_NAMES).toContain("starcraft");
  });
});
