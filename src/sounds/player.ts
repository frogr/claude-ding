import { spawn } from "child_process";
import { detectAudioPlayer } from "../utils/platform.js";
import { loadConfig } from "../config/loader.js";
import { log } from "../utils/logger.js";

export async function play(filePath: string, volume?: number): Promise<void> {
  const player = detectAudioPlayer();

  if (!player) {
    log.error("No audio player found. Install one of: afplay, paplay, aplay, mpv, ffplay");
    return;
  }

  const config = loadConfig();
  const vol = volume ?? config.volume;

  // Check quiet hours
  if (isQuietHours(config)) {
    return;
  }

  const args = player.args(filePath, vol);

  const proc = spawn(player.command, args, {
    detached: true,
    stdio: "ignore",
  });

  proc.unref();
}

function isQuietHours(config: { quietHours?: { enabled: boolean; start: string; end: string } }): boolean {
  if (!config.quietHours?.enabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = config.quietHours.start.split(":").map(Number);
  const [endH, endM] = config.quietHours.end.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Wraps midnight (e.g., 22:00 - 08:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}
