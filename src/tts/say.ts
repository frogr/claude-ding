import { spawn } from "child_process";
import { detectPlatform } from "../utils/platform.js";
import type { TTSEngine } from "./engine.js";

export class SayEngine implements TTSEngine {
  async speak(text: string, voice?: string, speed?: number): Promise<void> {
    const platform = detectPlatform();

    if (platform === "macos") {
      const args = [text];
      if (voice) args.push("-v", voice);
      if (speed) args.push("-r", String(Math.round(speed * 200)));
      const proc = spawn("say", args, { detached: true, stdio: "ignore" });
      proc.unref();
    } else if (platform === "linux") {
      const args = [text];
      if (speed) args.push("-s", String(Math.round(speed * 175)));
      const proc = spawn("espeak-ng", args, { detached: true, stdio: "ignore" });
      proc.unref();
    } else {
      throw new Error("Native TTS not supported on this platform");
    }
  }
}
