import { env, pipeline } from '@xenova/transformers';

env.allowLocalModels = false;

let asr: Awaited<ReturnType<typeof pipeline>> | null = null;

export async function transcribe(audioData: Float32Array): Promise<string> {
  if (!asr) {
    asr = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.en',
      { device: 'webgpu' }
    );
  }

  const result = await asr(audioData);

  return result.text.trim();
}

export async function transcribeBlob(blob: Blob): Promise<string> {
  const { blobToPCM } = await import('./audio');
  const pcm = await blobToPCM(blob);
  return transcribe(pcm);
}
