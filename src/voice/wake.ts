import fs from "fs";
import path from "path";
import os from "os";
import { transcribe } from "./transcriber.js";

const TMP_DIR = path.join(os.tmpdir(), "claude-ding");

/**
 * Check if an audio chunk contains the wake phrase.
 * Saves the chunk to a temporary WAV file, runs whisper-cpp, checks for phrase.
 */
export async function checkWakeWord(
  pcmAudio: Buffer,
  modelPath: string,
  wakePhrase = "hey claude"
): Promise<{ detected: boolean; fullText: string }> {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const wavPath = path.join(TMP_DIR, `wake-${Date.now()}.wav`);

  // Write PCM data as a WAV file (16kHz, mono, 16-bit)
  writeWav(wavPath, pcmAudio, 16000);

  try {
    const text = await transcribe(wavPath, modelPath);
    const normalized = text.toLowerCase().trim();

    // Check if the transcribed text starts with or contains the wake phrase
    const detected = normalized.includes(wakePhrase.toLowerCase());

    return { detected, fullText: text };
  } finally {
    try { fs.unlinkSync(wavPath); } catch { /* ignore */ }
  }
}

/**
 * Write raw PCM data as a WAV file.
 */
function writeWav(filePath: string, pcmData: Buffer, sampleRate: number): void {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;

  const header = Buffer.alloc(headerSize);
  header.write("RIFF", 0);
  header.writeUInt32LE(dataSize + headerSize - 8, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20);  // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  fs.writeFileSync(filePath, Buffer.concat([header, pcmData]));
}
