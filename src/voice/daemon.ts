import { spawn, type ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { VoiceState } from "./types.js";
import { EnergyVAD } from "./vad.js";
import { checkWakeWord } from "./wake.js";
import { recordWithSilenceDetection, cleanupRecording } from "./recorder.js";
import { transcribe } from "./transcriber.js";
import { injectText } from "./injector.js";
import { play } from "../sounds/player.js";
import { resolveSound } from "../sounds/resolver.js";
import { log } from "../utils/logger.js";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

interface DaemonOptions {
  modelPath: string;
  wakePhrase: string;
  silenceTimeout: number;
  terminal: "iterm2" | "terminal" | "auto";
}

export class VoiceDaemon extends EventEmitter {
  private state = VoiceState.IDLE;
  private recProcess: ChildProcess | null = null;
  private options: DaemonOptions;
  private running = false;

  constructor(options: DaemonOptions) {
    super();
    this.options = options;
  }

  async start(): Promise<void> {
    this.running = true;

    console.log();
    console.log(`  ${BOLD}claude-ding voice${RESET} ${DIM}(wake word mode)${RESET}`);
    console.log();
    console.log(`  ${DIM}Say "${this.options.wakePhrase}" to activate${RESET}`);
    console.log(`  ${DIM}Press${RESET} ${CYAN}Enter${RESET} ${DIM}for push-to-talk fallback${RESET}`);
    console.log(`  ${DIM}Press${RESET} ${CYAN}Ctrl+C${RESET} ${DIM}to quit${RESET}`);
    console.log();

    this.setState(VoiceState.IDLE);
    this.startContinuousListening();
    this.setupKeyboardFallback();
  }

  stop(): void {
    this.running = false;
    if (this.recProcess) {
      this.recProcess.kill();
      this.recProcess = null;
    }
  }

  private setState(newState: VoiceState): void {
    this.state = newState;
    this.emit("stateChange", newState);
    this.renderStatus();
  }

  private renderStatus(): void {
    switch (this.state) {
      case VoiceState.IDLE:
        process.stdout.write(`\r  ${DIM}Listening for "${this.options.wakePhrase}"...${RESET}    `);
        break;
      case VoiceState.LISTENING:
        process.stdout.write(`\r  ${GREEN}●${RESET} ${BOLD}Recording...${RESET}                      `);
        break;
      case VoiceState.TRANSCRIBING:
        process.stdout.write(`\r  ${YELLOW}◌${RESET} Transcribing...                      `);
        break;
      case VoiceState.INJECTING:
        process.stdout.write(`\r  ${CYAN}→${RESET} Injecting...                         `);
        break;
    }
  }

  private startContinuousListening(): void {
    // Spawn continuous SoX recording to stdout as raw PCM
    const args = [
      "-q",           // quiet
      "-t", "wav",    // output format
      "-r", "16000",  // sample rate
      "-c", "1",      // mono
      "-",            // stdout
    ];

    try {
      this.recProcess = spawn("rec", args, {
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch {
      log.error("Failed to start continuous recording. Install SoX: brew install sox");
      return;
    }

    this.recProcess.on("error", (err) => {
      log.error(`Continuous recording failed: ${err.message}`);
      // Restart after a delay
      if (this.running) {
        setTimeout(() => this.startContinuousListening(), 2000);
      }
    });

    this.recProcess.on("close", () => {
      if (this.running) {
        // Restart if it died unexpectedly
        setTimeout(() => this.startContinuousListening(), 1000);
      }
    });

    // Skip WAV header (44 bytes) then pipe through VAD
    const vad = new EnergyVAD({ threshold: 0.01, chunkDurationMs: 2000 });
    let headerSkipped = false;
    let headerBuffer = Buffer.alloc(0);

    this.recProcess.stdout?.on("data", (chunk: Buffer) => {
      if (!headerSkipped) {
        headerBuffer = Buffer.concat([headerBuffer, chunk]);
        if (headerBuffer.length >= 44) {
          const remaining = headerBuffer.subarray(44);
          headerSkipped = true;
          if (remaining.length > 0) {
            vad.write(remaining);
          }
        }
        return;
      }
      vad.write(chunk);
    });

    vad.on("vad", async (event: { hasVoice: boolean; energy: number; audio: Buffer }) => {
      if (this.state !== VoiceState.IDLE) return;
      if (!event.hasVoice) return;

      // Voice detected — check for wake word
      try {
        const result = await checkWakeWord(
          event.audio,
          this.options.modelPath,
          this.options.wakePhrase
        );

        if (result.detected && this.state === VoiceState.IDLE) {
          console.log();
          log.info(`Wake word detected!`);
          await this.handleActivation();
        }
      } catch {
        // Transient whisper failure — ignore and keep listening
      }
    });
  }

  private async handleActivation(): Promise<void> {
    this.setState(VoiceState.LISTENING);

    // Play activation chime
    try {
      const chime = resolveSound("session-start");
      if (chime) await play(chime, 50);
    } catch { /* ignore */ }

    try {
      // Record with silence detection
      const result = await recordWithSilenceDetection(this.options.silenceTimeout);
      console.log();
      log.dim(`  Recorded ${(result.durationMs / 1000).toFixed(1)}s`);

      // Transcribe
      this.setState(VoiceState.TRANSCRIBING);
      const text = await transcribe(result.filePath, this.options.modelPath);
      cleanupRecording(result.filePath);

      if (!text || text.trim().length === 0) {
        console.log(`  ${DIM}(no speech detected)${RESET}`);
        this.setState(VoiceState.IDLE);
        return;
      }

      console.log(`  ${CYAN}»${RESET} ${BOLD}${text}${RESET}`);

      // Inject
      this.setState(VoiceState.INJECTING);
      injectText(text, this.options.terminal);
      console.log(`  ${GREEN}✓${RESET} ${DIM}Sent to Claude Code${RESET}`);
      console.log();
    } catch (err: any) {
      console.log();
      log.error(err.message);
      console.log();
    }

    this.setState(VoiceState.IDLE);
  }

  private setupKeyboardFallback(): void {
    if (!process.stdin.isTTY) return;

    process.stdin.setRawMode(true);
    process.stdin.resume();

    process.stdin.on("data", async (key: Buffer) => {
      const char = key.toString();

      // Ctrl+C
      if (char === "\x03") {
        this.stop();
        console.log("\n");
        log.dim("  Voice mode exited.");
        process.exit(0);
      }

      // Enter — push-to-talk fallback
      if ((char === "\r" || char === "\n") && this.state === VoiceState.IDLE) {
        // Pause continuous listening during push-to-talk
        if (this.recProcess) {
          this.recProcess.kill();
          this.recProcess = null;
        }

        await this.handleActivation();

        // Restart continuous listening
        if (this.running) {
          this.startContinuousListening();
        }
      }
    });
  }
}
