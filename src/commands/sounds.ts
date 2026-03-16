import fs from "fs";
import path from "path";
import { loadConfig, updateConfig } from "../config/loader.js";
import { resolveSound } from "../sounds/resolver.js";
import { SOUND_NAMES } from "../config/types.js";
import type { SoundName } from "../config/types.js";
import { log } from "../utils/logger.js";

const SOUND_KEY_MAP: Record<SoundName, keyof ReturnType<typeof loadConfig>["sounds"]> = {
  "task-complete": "taskComplete",
  "need-input": "needInput",
  idle: "idle",
  error: "error",
  "session-start": "sessionStart",
};

export function soundsListCommand(): void {
  const config = loadConfig();

  console.log(`\n  Current preset: ${config.preset}`);
  console.log("  Sounds:\n");

  for (const name of SOUND_NAMES) {
    const configKey = SOUND_KEY_MAP[name];
    const customPath = config.sounds[configKey];
    const resolved = resolveSound(name);
    const label = customPath ? "(custom)" : "(preset)";
    console.log(`    ${name.padEnd(16)} ${label}  ${resolved ?? "not found"}`);
  }
  console.log();
}

export function soundsSetCommand(soundName: string, filePath: string): void {
  if (!SOUND_NAMES.includes(soundName as SoundName)) {
    log.error(`Unknown sound name: ${soundName}`);
    log.error(`Valid names: ${SOUND_NAMES.join(", ")}`);
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    log.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const configKey = SOUND_KEY_MAP[soundName as SoundName];
  const config = loadConfig();
  config.sounds[configKey] = resolved;
  updateConfig({ sounds: config.sounds });

  log.success(`${soundName} = ${resolved}`);
}

export function soundsResetCommand(soundName?: string): void {
  const config = loadConfig();

  if (soundName) {
    if (!SOUND_NAMES.includes(soundName as SoundName)) {
      log.error(`Unknown sound name: ${soundName}`);
      log.error(`Valid names: ${SOUND_NAMES.join(", ")}`);
      process.exit(1);
    }

    const configKey = SOUND_KEY_MAP[soundName as SoundName];
    delete config.sounds[configKey];
    updateConfig({ sounds: config.sounds });
    log.success(`Reset ${soundName} to preset default`);
  } else {
    updateConfig({ sounds: {} });
    log.success("Reset all sounds to preset defaults");
  }
}
