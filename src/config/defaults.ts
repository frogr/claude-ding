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
};
