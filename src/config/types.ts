export interface ClaudeDingConfig {
  preset: "sci-fi" | "fantasy" | "retro" | "minimal" | "custom";

  sounds: {
    taskComplete?: string;
    needInput?: string;
    idle?: string;
    error?: string;
    sessionStart?: string;
  };

  volume: number;

  tts: {
    enabled: boolean;
    engine: "edge-tts" | "kokoro" | "say";
    voice: string;
    speed: number;
    readResponses: boolean;
    readSummary: boolean;
  };

  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export type SoundName = "task-complete" | "need-input" | "idle" | "error" | "session-start";

export const SOUND_NAMES: SoundName[] = [
  "task-complete",
  "need-input",
  "idle",
  "error",
  "session-start",
];

export type PresetName = "sci-fi" | "fantasy" | "retro" | "minimal";

export const PRESET_NAMES: PresetName[] = ["sci-fi", "fantasy", "retro", "minimal"];
