import type { TTSEngine } from "./engine.js";

// Placeholder for Phase 2 — requires @andresaya/edge-tts dependency
export class EdgeTTSEngine implements TTSEngine {
  async speak(_text: string, _voice?: string, _speed?: number): Promise<void> {
    throw new Error("edge-tts engine is not yet implemented. Coming in Phase 2.");
  }
}
