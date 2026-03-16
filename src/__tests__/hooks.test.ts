import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

describe("hook installer", () => {
  let tmpDir: string;
  let originalHome: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-ding-test-"));
    originalHome = process.env.HOME!;
    process.env.HOME = tmpDir;
    // Create .claude directory
    fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("installs hooks to settings.json", async () => {
    const { installHooks } = await import("../hooks/installer.js");
    const result = installHooks();
    expect(result.installed).toBe(true);

    const settings = JSON.parse(fs.readFileSync(result.path, "utf-8"));
    expect(settings.hooks.Stop).toBeDefined();
    expect(settings.hooks.Notification).toBeDefined();
    expect(settings.hooks.Stop[0].hooks[0].command).toContain("claude-ding");
  });

  it("preserves existing hooks", async () => {
    const settingsPath = path.join(tmpDir, ".claude", "settings.json");
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({
        hooks: {
          Stop: [
            { hooks: [{ type: "command", command: "my-other-tool notify" }] },
          ],
        },
      }),
    );

    const { installHooks } = await import("../hooks/installer.js");
    installHooks();

    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    // Should have both the existing hook and our hook
    expect(settings.hooks.Stop.length).toBe(2);
    expect(settings.hooks.Stop[0].hooks[0].command).toBe("my-other-tool notify");
    expect(settings.hooks.Stop[1].hooks[0].command).toContain("claude-ding");
  });

  it("uninstalls only claude-ding hooks", async () => {
    const settingsPath = path.join(tmpDir, ".claude", "settings.json");
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({
        hooks: {
          Stop: [
            { hooks: [{ type: "command", command: "my-other-tool notify" }] },
            { hooks: [{ type: "command", command: "claude-ding play task-complete" }] },
          ],
        },
      }),
    );

    const { uninstallHooks } = await import("../hooks/installer.js");
    const result = uninstallHooks();
    expect(result.removed).toBe(true);

    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    expect(settings.hooks.Stop.length).toBe(1);
    expect(settings.hooks.Stop[0].hooks[0].command).toBe("my-other-tool notify");
  });
});
