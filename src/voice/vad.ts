import { Transform, type TransformCallback } from "stream";

/**
 * Energy-based Voice Activity Detection on raw PCM audio.
 * Emits 'voice' events when energy exceeds threshold.
 */
export class EnergyVAD extends Transform {
  private threshold: number;
  private chunkDurationMs: number;
  private sampleRate: number;
  private bytesPerSample = 2; // 16-bit PCM
  private chunkSize: number;
  private buffer: Buffer = Buffer.alloc(0);

  constructor(options?: { threshold?: number; chunkDurationMs?: number; sampleRate?: number }) {
    super();
    this.threshold = options?.threshold ?? 0.01;
    this.chunkDurationMs = options?.chunkDurationMs ?? 2000;
    this.sampleRate = options?.sampleRate ?? 16000;
    this.chunkSize = Math.floor((this.sampleRate * this.chunkDurationMs) / 1000) * this.bytesPerSample;
  }

  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= this.chunkSize) {
      const audioChunk = this.buffer.subarray(0, this.chunkSize);
      this.buffer = this.buffer.subarray(this.chunkSize);

      const energy = this.computeEnergy(audioChunk);
      const hasVoice = energy > this.threshold;

      this.emit("vad", { hasVoice, energy, audio: audioChunk });
      this.push(audioChunk);
    }

    callback();
  }

  _flush(callback: TransformCallback): void {
    if (this.buffer.length > 0) {
      const energy = this.computeEnergy(this.buffer);
      this.emit("vad", { hasVoice: energy > this.threshold, energy, audio: this.buffer });
      this.push(this.buffer);
    }
    callback();
  }

  private computeEnergy(pcmData: Buffer): number {
    let sumSquares = 0;
    const numSamples = Math.floor(pcmData.length / this.bytesPerSample);

    for (let i = 0; i < numSamples; i++) {
      const sample = pcmData.readInt16LE(i * this.bytesPerSample) / 32768;
      sumSquares += sample * sample;
    }

    return Math.sqrt(sumSquares / numSamples); // RMS energy
  }
}
