import { resolveSound } from "../sounds/resolver.js";
import { play } from "../sounds/player.js";
import { log } from "../utils/logger.js";
import { SOUND_NAMES } from "../config/types.js";
import type { SoundName } from "../config/types.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function testCommand(soundName?: string): Promise<void> {
  if (soundName) {
    const filePath = resolveSound(soundName as SoundName);
    if (!filePath) {
      log.error(`Sound not found: ${soundName}`);
      process.exit(1);
    }
    log.info(`Playing: ${soundName}`);
    await play(filePath);
    return;
  }

  log.info("Playing all configured sounds...\n");

  for (const name of SOUND_NAMES) {
    const filePath = resolveSound(name);
    if (!filePath) {
      log.warn(`  ${name}: not found`);
      continue;
    }
    log.info(`  ${name}`);
    await play(filePath);
    await sleep(1200);
  }

  log.success("Done!");
}
