import { execFileSync } from "child_process";
import { VoiceState } from "../voice/types.js";
import { startRecording, cleanupRecording, type ActiveRecording } from "../voice/recorder.js";
import { ensureModel, transcribe } from "../voice/transcriber.js";
import { injectText } from "../voice/injector.js";
import { loadConfig } from "../config/loader.js";
import { play } from "../sounds/player.js";
import { resolveSound } from "../sounds/resolver.js";
import { log } from "../utils/logger.js";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

export async function voiceCommand(): Promise<void> {
  const config = loadConfig();
  const voiceConfig = config.voice ?? {
    enabled: true,
    autoSend: true,
    terminal: "auto" as const,
    whisperModel: "ggml-base.en.bin",
    language: "en",
  };

  if (!checkDependency("rec", "sox")) return;
  if (!checkDependency("whisper-cli", "whisper-cpp")) return;

  let modelPath: string;
  try {
    modelPath = await ensureModel(voiceConfig.whisperModel ?? "ggml-base.en.bin");
  } catch (err: any) {
    log.error(`Failed to prepare whisper model: ${err.message}`);
    return;
  }

  // ── Push-to-talk mode ──
  console.log();
  console.log(`  ${BOLD}claude-ding voice${RESET} ${DIM}push-to-talk${RESET}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  ${CYAN}Enter${RESET}  start / stop recording`);
  console.log(`  ${CYAN}Ctrl+C${RESET} quit`);
  console.log();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  let state = VoiceState.IDLE;
  let activeRecording: ActiveRecording | null = null;

  const showIdle = () => {
    process.stdout.write(`\r\x1b[K  ${DIM}Ready —${RESET} press Enter to speak`);
  };

  showIdle();

  process.stdin.on("data", async (key: Buffer) => {
    const char = key.toString();

    // Ctrl+C
    if (char === "\x03") {
      if (activeRecording) {
        activeRecording.process.kill("SIGTERM");
      }
      console.log("\n");
      log.dim("  Voice mode exited.");
      process.exit(0);
    }

    // Enter or Space — toggle recording
    if (char === "\r" || char === "\n" || char === " ") {
      // ── Stop recording ──
      if (state === VoiceState.LISTENING && activeRecording) {
        process.stdout.write(`\r\x1b[K  ${YELLOW}◌${RESET} Stopping...`);

        try {
          const result = await activeRecording.stop();
          activeRecording = null;
          const secs = (result.durationMs / 1000).toFixed(1);

          // Transcribe
          state = VoiceState.TRANSCRIBING;
          process.stdout.write(`\r\x1b[K  ${YELLOW}◌${RESET} Transcribing ${DIM}(${secs}s of audio)${RESET}`);

          const text = await transcribe(result.filePath, modelPath);
          cleanupRecording(result.filePath);

          if (!text || text.trim().length === 0) {
            process.stdout.write(`\r\x1b[K`);
            console.log(`  ${DIM}(no speech detected)${RESET}`);
            console.log();
            state = VoiceState.IDLE;
            showIdle();
            return;
          }

          // ── Show transcription prominently ──
          process.stdout.write(`\r\x1b[K`);
          console.log();
          console.log(`  ┌─────────────────────────────────────`);
          console.log(`  │ ${CYAN}You said:${RESET}`);
          // Word-wrap long text
          const wrapped = wordWrap(text, 60);
          for (const line of wrapped) {
            console.log(`  │ ${BOLD}${line}${RESET}`);
          }
          console.log(`  └─────────────────────────────────────`);

          // Inject into Claude Code terminal
          state = VoiceState.INJECTING;
          const terminal = (voiceConfig.terminal as "iterm2" | "terminal" | "auto") ?? "auto";
          injectText(text, terminal);
          console.log(`  ${GREEN}✓${RESET} Sent to Claude Code`);
          console.log();
        } catch (err: any) {
          activeRecording = null;
          process.stdout.write(`\r\x1b[K`);
          console.log(`  ${RED}✗${RESET} ${err.message}`);
          console.log();
        }

        state = VoiceState.IDLE;
        showIdle();
        return;
      }

      // ── Start recording ──
      if (state === VoiceState.IDLE) {
        state = VoiceState.LISTENING;

        // Play a quick chime
        try {
          const chime = resolveSound("session-start");
          if (chime) play(chime, 40);
        } catch { /* ignore */ }

        try {
          activeRecording = startRecording();
        } catch (err: any) {
          console.log(`\n  ${RED}✗${RESET} ${err.message}`);
          state = VoiceState.IDLE;
          showIdle();
          return;
        }

        process.stdout.write(`\r\x1b[K  ${RED}●${RESET} ${BOLD}Recording${RESET} ${DIM}— press Enter to stop${RESET}`);

        // Safety timeout: auto-stop after 60s
        setTimeout(() => {
          if (state === VoiceState.LISTENING && activeRecording) {
            process.stdin.emit("data", Buffer.from("\r"));
          }
        }, 60000);
      }
    }
  });
}

function wordWrap(text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length + word.length + 1 > maxWidth && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function checkDependency(binary: string, brewPackage: string): boolean {
  try {
    execFileSync("which", [binary], { stdio: ["ignore", "pipe", "pipe"] });
    return true;
  } catch {
    log.error(`'${binary}' not found. Install it: brew install ${brewPackage}`);
    return false;
  }
}
