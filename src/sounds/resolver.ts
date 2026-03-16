import path from "path";
import fs from "fs";
import { getSoundsDir } from "../utils/paths.js";
import { loadConfig } from "../config/loader.js";
import type { SoundName } from "../config/types.js";

const SOUND_KEY_MAP: Record<SoundName, keyof ReturnType<typeof loadConfig>["sounds"]> = {
  "task-complete": "taskComplete",
  "need-input": "needInput",
  idle: "idle",
  error: "error",
  "session-start": "sessionStart",
};

export function resolveSound(name: SoundName): string | null {
  const config = loadConfig();

  // Check for custom sound override
  const configKey = SOUND_KEY_MAP[name];
  const customPath = config.sounds[configKey];
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  // Resolve from preset
  const soundsDir = getSoundsDir();
  const presetDir = path.join(soundsDir, config.preset === "custom" ? "minimal" : config.preset);
  const filePath = path.join(presetDir, `${name}.mp3`);

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  return null;
}
