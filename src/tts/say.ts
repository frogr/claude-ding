import { spawn, type ChildProcess } from "child_process";
import { detectPlatform } from "../utils/platform.js";
import type { TTSEngine } from "./engine.js";

export class SayEngine implements TTSEngine {
  /**
   * Speak text via OS native TTS.
   * By default spawns detached (fire-and-forget).
   * Set `await` option to wait for speech to finish.
   */
  speak(text: string, voice?: string, speed?: number, options?: { await?: boolean }): Promise<ChildProcess> {
    const platform = detectPlatform();

    if (platform === "macos") {
      const args = [text];
      if (voice) args.push("-v", voice);
      if (speed) args.push("-r", String(Math.round(speed * 200)));

      if (options?.await) {
        return new Promise((resolve, reject) => {
          const proc = spawn("say", args, { stdio: "ignore" });
          proc.on("close", () => resolve(proc));
          proc.on("error", reject);
        });
      }

      const proc = spawn("say", args, { detached: true, stdio: "ignore" });
      proc.unref();
      return Promise.resolve(proc);
    } else if (platform === "linux") {
      const args = [text];
      if (speed) args.push("-s", String(Math.round(speed * 175)));

      if (options?.await) {
        return new Promise((resolve, reject) => {
          const proc = spawn("espeak-ng", args, { stdio: "ignore" });
          proc.on("close", () => resolve(proc));
          proc.on("error", reject);
        });
      }

      const proc = spawn("espeak-ng", args, { detached: true, stdio: "ignore" });
      proc.unref();
      return Promise.resolve(proc);
    } else {
      throw new Error("Native TTS not supported on this platform");
    }
  }
}
