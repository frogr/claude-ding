import { log } from "../utils/logger.js";

export async function ttsCommand(_text: string, _options: { fromStdin?: boolean }): Promise<void> {
  log.warn("TTS support is coming in a future release.");
  log.dim("  Follow the project for updates: https://github.com/austn/claude-ding");
}
