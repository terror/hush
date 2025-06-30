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
