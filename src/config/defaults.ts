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
    wakeWord: false,
    wakePhrase: "hey claude",
    autoSend: true,
    terminal: "auto",
    silenceTimeout: 2.0,
    language: "en",
    whisperModel: "ggml-base.en.bin",
  },
};
