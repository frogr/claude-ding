export interface ClaudeDingConfig {
  preset: "sci-fi" | "fantasy" | "retro" | "minimal" | "doom" | "nasa" | "custom";

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

  voice?: {
    enabled: boolean;
    wakeWord: boolean;
    wakePhrase: string;
    autoSend: boolean;
    terminal: "iterm2" | "terminal" | "auto";
    silenceTimeout: number;
    language: string;
    whisperModel: string;
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

export type PresetName = "sci-fi" | "fantasy" | "retro" | "minimal" | "doom" | "nasa";

export const PRESET_NAMES: PresetName[] = ["sci-fi", "fantasy", "retro", "minimal", "doom", "nasa"];
