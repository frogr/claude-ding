import { describe, it, expect } from "vitest";
import { detectPlatform, detectAudioPlayer } from "../utils/platform.js";

describe("platform", () => {
  it("detects current platform", () => {
    const platform = detectPlatform();
    expect(["macos", "linux", "windows", "unknown"]).toContain(platform);
  });

  it("finds an audio player", () => {
    const player = detectAudioPlayer();
    // Should find something on macOS/Linux CI
    expect(player).not.toBeNull();
    expect(player!.command).toBeTruthy();
  });
});
