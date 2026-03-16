export enum VoiceState {
  IDLE = "idle",
  LISTENING = "listening",
  TRANSCRIBING = "transcribing",
  INJECTING = "injecting",
}

export interface VoiceConfig {
  enabled: boolean;
  wakeWord: boolean;
  wakePhrase: string;
  autoSend: boolean;
  terminal: "iterm2" | "terminal" | "auto";
  silenceTimeout: number;
  language: string;
  whisperModel: string;
}
