/**
 * Decode an audio {@link Blob} and convert it to **mono 32-bit floating-point**
 * PCM samples, optionally resampling to a target sample-rate.
 *
 * The browser’s `AudioContext` is used for the initial decode, and an
 * `OfflineAudioContext` is spun up when resampling is required.
 *
 * • If the blob’s native sample-rate already matches `targetRate`, the decoded
 *   buffer is returned directly (fast path).
 * • Otherwise, the audio is rendered through an offline graph to produce a
 *   buffer at the desired rate before returning its first channel.
 *
 * @param blob       Audio file or stream (WAV, MP3, Ogg, etc.) to decode.
 * @param targetRate Sample-rate in hertz to resample to (default **16 000 Hz**,
 *                   which Whisper expects).
 *
 * @returns A `Float32Array` containing **mono** PCM samples at `targetRate`.
 *
 * @example
 * ```ts
 * const pcm = await blobToPCM(fileBlob, 16_000);
 * console.log(`Got ${pcm.length} samples ready for ASR`);
 * ```
 *
 * @throws DOMException If decoding fails (e.g., unsupported codec).
 */
export async function blobToPCM(
  blob: Blob,
  targetRate = 16_000
): Promise<Float32Array> {
  const ctx = new AudioContext();

  const buf = await ctx.decodeAudioData(await blob.arrayBuffer());

  if (buf.sampleRate !== targetRate) {
    const off = new OfflineAudioContext(
      1,
      buf.duration * targetRate,
      targetRate
    );

    const src = off.createBufferSource();
    src.buffer = buf;
    src.connect(off.destination);
    src.start();

    const rendered = await off.startRendering();

    return rendered.getChannelData(0);
  }

  return buf.getChannelData(0);
}

export interface RecordingManager {
  start(): Promise<void>;
  stop(): Promise<Blob>;
  isRecording(): boolean;
  cleanup(): void;
}

export function createRecordingManager(): RecordingManager {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let recording = false;

  return {
    async start() {
      if (recording) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];
      recording = true;

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.start();
    },

    stop() {
      return new Promise<Blob>((resolve) => {
        if (!mediaRecorder || !recording) {
          resolve(new Blob());
          return;
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          this.cleanup();
          resolve(blob);
        };

        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      });
    },

    isRecording() {
      return recording;
    },

    cleanup() {
      recording = false;
      mediaRecorder = null;
      chunks = [];
    },
  };
}
