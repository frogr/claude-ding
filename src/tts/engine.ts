import type { ChildProcess } from "child_process";

export interface TTSEngine {
  speak(text: string, voice?: string, speed?: number, options?: { await?: boolean }): Promise<ChildProcess | void>;
}

// TTS engines will be implemented in Phase 2
export function createTTSEngine(_engine: string): TTSEngine {
  throw new Error("TTS support is coming in a future release.");
}
