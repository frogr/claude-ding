import { spawn, type ChildProcess } from "child_process";
import path from "path";
import os from "os";
import fs from "fs";

const TMP_DIR = path.join(os.tmpdir(), "claude-ding");

export interface RecordingResult {
  filePath: string;
  durationMs: number;
}

export interface ActiveRecording {
  /** Stop the recording and return the result. */
  stop: () => Promise<RecordingResult>;
  /** The underlying process (for cleanup on exit). */
  process: ChildProcess;
  /** Path to the WAV file being written. */
  filePath: string;
}

/**
 * Start recording audio via SoX `rec`.
 * Returns a handle that the caller controls — call `stop()` when done.
 * No silence detection here; the caller decides when to stop.
 */
export function startRecording(): ActiveRecording {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const filePath = path.join(TMP_DIR, `recording-${Date.now()}.wav`);
  const startTime = Date.now();

  const proc = spawn("rec", [
    "-q",              // quiet (no progress)
    filePath,
    "rate", "16000",
    "channels", "1",
  ], { stdio: ["ignore", "pipe", "pipe"] });

  const stop = (): Promise<RecordingResult> => {
    return new Promise((resolve, reject) => {
      // If already exited, resolve immediately
      if (proc.exitCode !== null) {
        const durationMs = Date.now() - startTime;
        if (isValidRecording(filePath)) {
          resolve({ filePath, durationMs });
        } else {
          reject(new Error("No audio captured"));
        }
        return;
      }

      proc.on("close", () => {
        const durationMs = Date.now() - startTime;
        if (isValidRecording(filePath)) {
          resolve({ filePath, durationMs });
        } else {
          reject(new Error("No audio captured"));
        }
      });

      // Send SIGTERM — SoX finalizes the WAV header on clean shutdown
      proc.kill("SIGTERM");
    });
  };

  return { stop, process: proc, filePath };
}

/**
 * Legacy silence-based recording for wake word / daemon mode.
 * Uses SoX silence detection to auto-stop.
 */
export function recordWithSilenceDetection(silenceTimeout = 3.0): Promise<RecordingResult> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    const filePath = path.join(TMP_DIR, `recording-${Date.now()}.wav`);
    const startTime = Date.now();

    // More forgiving silence detection:
    // - Leading: start immediately (no skip)
    // - Trailing: stop after silenceTimeout seconds below 2% amplitude
    const args = [
      "-q",
      filePath,
      "rate", "16000",
      "channels", "1",
      "silence", "1", "0.1", "1%",    // start: need 0.1s above 1% (very easy trigger)
      "1", String(silenceTimeout), "2%", // stop: need full timeout below 2%
    ];

    let proc: ChildProcess;
    try {
      proc = spawn("rec", args, { stdio: ["ignore", "pipe", "pipe"] });
    } catch {
      reject(new Error("Failed to start 'rec'. Install SoX: brew install sox"));
      return;
    }

    let stderr = "";
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(new Error(`rec failed: ${err.message}. Install SoX: brew install sox`));
    });

    proc.on("close", (code) => {
      const durationMs = Date.now() - startTime;
      if (isValidRecording(filePath)) {
        resolve({ filePath, durationMs });
      } else {
        reject(new Error(`Recording failed (code ${code}): ${stderr}`));
      }
    });
  });
}

function isValidRecording(filePath: string): boolean {
  try {
    const stat = fs.statSync(filePath);
    return stat.size > 1000; // more than just a WAV header
  } catch {
    return false;
  }
}

/**
 * Clean up a recording file after use.
 */
export function cleanupRecording(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch { /* ignore */ }
}
