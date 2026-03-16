import { resolveSound } from "../sounds/resolver.js";
import { play } from "../sounds/player.js";
import { readHookInput } from "../hooks/handler.js";
import { log } from "../utils/logger.js";
import type { SoundName } from "../config/types.js";

export async function playCommand(soundName: string): Promise<void> {
  // Read hook input if piped (don't block on it)
  readHookInput().catch(() => {});

  const filePath = resolveSound(soundName as SoundName);

  if (!filePath) {
    log.error(`Sound not found: ${soundName}`);
    process.exit(1);
  }

  await play(filePath);
}
