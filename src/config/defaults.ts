import type { ClaudeDingConfig } from "./types.js";

export const DEFAULT_CONFIG: ClaudeDingConfig = {
  preset: "minimal",
  sounds: {},
  volume: 70,
  tts: {
    enabled: false,
    engine: "say",
    voice: "",
    speed: 1.0,
    readResponses: false,
    readSummary: false,
  },
  voice: {
    enabled: true,
    autoSend: true,
    terminal: "auto",
    language: "en",
    whisperModel: "ggml-base.en.bin",
  },
};
