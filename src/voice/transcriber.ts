import { execFileSync, execSync } from "child_process";
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";
import { getConfigDir, ensureDir } from "../utils/paths.js";
import { log } from "../utils/logger.js";

const MODELS_DIR = path.join(getConfigDir(), "models");
const DEFAULT_MODEL = "ggml-base.en.bin";
const MODEL_URL = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${DEFAULT_MODEL}`;

/**
 * Ensure the whisper model is downloaded.
 */
export async function ensureModel(modelName = DEFAULT_MODEL): Promise<string> {
  ensureDir(MODELS_DIR);
  const modelPath = path.join(MODELS_DIR, modelName);

  if (fs.existsSync(modelPath)) {
    return modelPath;
  }

  log.info(`Downloading whisper model ${modelName} (~148MB)...`);
  log.dim(`  This is a one-time download.`);

  await downloadFile(MODEL_URL, modelPath);

  log.success(`Model downloaded to ${modelPath}`);
  return modelPath;
}

/**
 * Transcribe a WAV file using whisper-cpp CLI.
 */
export async function transcribe(wavPath: string, modelPath: string): Promise<string> {
  // Find whisper-cpp binary — try common names
  const binary = findWhisperBinary();
  if (!binary) {
    throw new Error(
      "whisper-cpp not found. Install it: brew install whisper-cpp"
    );
  }

  const args = [
    "-m", modelPath,
    "--no-timestamps",
    "-np",
    wavPath,
  ];

  try {
    const output = execFileSync(binary, args, {
      encoding: "utf-8",
      timeout: 30000,
      stdio: ["ignore", "pipe", "pipe"],
    });

    return parseWhisperOutput(output);
  } catch (err: any) {
    throw new Error(`Transcription failed: ${err.message}`);
  }
}

function findWhisperBinary(): string | null {
  const candidates = ["whisper-cli", "whisper-cpp", "whisper", "main"];

  for (const name of candidates) {
    try {
      execFileSync("which", [name], { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
      return name;
    } catch {
      // not found, try next
    }
  }

  // Check common Homebrew paths
  const brewPaths = [
    "/opt/homebrew/bin/whisper-cli",
    "/opt/homebrew/bin/whisper-cpp",
    "/usr/local/bin/whisper-cli",
    "/usr/local/bin/whisper-cpp",
  ];
  for (const p of brewPaths) {
    if (fs.existsSync(p)) return p;
  }

  return null;
}

function parseWhisperOutput(output: string): string {
  // whisper-cpp outputs transcribed text, possibly with timestamps like [00:00:00.000 --> 00:00:02.000]
  // With --no-timestamps, it should be clean text, but let's strip timestamps just in case
  const lines = output.split("\n");
  const textLines: string[] = [];

  for (const line of lines) {
    // Strip timestamp patterns like [00:00:00.000 --> 00:00:02.000]
    const cleaned = line
      .replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]\s*/g, "")
      .trim();

    if (cleaned && !cleaned.startsWith("whisper_") && !cleaned.startsWith("system_info")) {
      textLines.push(cleaned);
    }
  }

  return textLines.join(" ").trim();
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const get = url.startsWith("https") ? https.get : http.get;

    get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          reject(new Error("Redirect without location header"));
          return;
        }
        file.close();
        fs.unlinkSync(dest);
        downloadFile(redirectUrl, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status ${response.statusCode}`));
        return;
      }

      const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
      let downloadedBytes = 0;
      let lastPercent = 0;

      response.on("data", (chunk: Buffer) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0) {
          const percent = Math.floor((downloadedBytes / totalBytes) * 100);
          if (percent >= lastPercent + 10) {
            lastPercent = percent;
            process.stdout.write(`\r  ${percent}% downloaded...`);
          }
        }
      });

      response.pipe(file);

      file.on("finish", () => {
        file.close();
        console.log(); // newline after progress
        resolve();
      });
    }).on("error", (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}
