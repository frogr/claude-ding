import { spawn } from "child_process";
import { readLastAssistantMessage, extractTTSSummary } from "../voice/response-reader.js";
import { detectPlatform } from "../utils/platform.js";
import { loadConfig } from "../config/loader.js";

/**
 * Hook command: reads the last Claude response, extracts <tts> tag,
 * and speaks it aloud. Falls back to "Done" if no tag found.
 *
 * Must be fast — spawns `say` detached and exits immediately.
 */
export async function speakResponseCommand(): Promise<void> {
  const config = loadConfig();

  // Read hook input from stdin
  let hookInput: any = {};
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString("utf-8").trim();
    if (raw) hookInput = JSON.parse(raw);
  } catch {
    // No stdin or invalid JSON
  }

  let textToSpeak = "Done.";

  // Prefer last_assistant_message from hook input (Stop event provides it directly)
  const lastMessage = hookInput.last_assistant_message;
  const transcriptPath = hookInput.transcript_path;

  if (lastMessage) {
    const tts = extractTTSSummary(lastMessage);
    if (tts) {
      textToSpeak = tts;
    }
  } else if (transcriptPath) {
    const message = readLastAssistantMessage(transcriptPath);
    if (message) {
      const tts = extractTTSSummary(message);
      if (tts) {
        textToSpeak = tts;
      }
    }
  }

  // Speak detached so the hook exits immediately
  const platform = detectPlatform();
  if (platform === "macos") {
    const args = [textToSpeak];
    const voice = config.tts.voice;
    if (voice) args.push("-v", voice);
    if (config.tts.speed) args.push("-r", String(Math.round(config.tts.speed * 200)));

    const proc = spawn("say", args, { detached: true, stdio: "ignore" });
    proc.unref();
  } else if (platform === "linux") {
    const args = [textToSpeak];
    if (config.tts.speed) args.push("-s", String(Math.round(config.tts.speed * 175)));

    const proc = spawn("espeak-ng", args, { detached: true, stdio: "ignore" });
    proc.unref();
  }
}
