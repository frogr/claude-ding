import type { TTSEngine } from "./engine.js";

// Placeholder for future Kokoro local TTS support
export class KokoroEngine implements TTSEngine {
  async speak(_text: string, _voice?: string, _speed?: number): Promise<void> {
    throw new Error("Kokoro engine is not yet implemented.");
  }
}
