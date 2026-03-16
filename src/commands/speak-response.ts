import { SayEngine } from "../tts/say.js";
import { loadConfig } from "../config/loader.js";
import { readLastAssistantMessage, truncateToWords, firstSentence } from "../voice/response-reader.js";
import { log } from "../utils/logger.js";

/**
 * Hook command: reads the last Claude response from transcript and speaks it.
 * Called by the Stop hook. Reads hook input from stdin (JSON with transcript_path).
 */
export async function speakResponseCommand(): Promise<void> {
  const config = loadConfig();
  const tts = config.tts;

  if (!tts.readResponses && !tts.readSummary) {
    return;
  }

  // Read hook input from stdin
  let hookInput: any = {};
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString("utf-8").trim();
    if (raw) {
      hookInput = JSON.parse(raw);
    }
  } catch {
    // No stdin or invalid JSON — try to speak a generic message
  }

  const transcriptPath = hookInput.transcript_path;

  let textToSpeak: string;

  if (transcriptPath) {
    const message = readLastAssistantMessage(transcriptPath);
    if (!message) {
      textToSpeak = "Done.";
    } else if (tts.readSummary) {
      textToSpeak = firstSentence(message);
    } else {
      textToSpeak = truncateToWords(message, 50);
    }
  } else {
    // No transcript available — use the message field from hook input if present
    textToSpeak = hookInput.message || "Done.";
  }

  const engine = new SayEngine();
  try {
    await engine.speak(textToSpeak, tts.voice || undefined, tts.speed);
  } catch (err: any) {
    log.error(`TTS failed: ${err.message}`);
  }
}
