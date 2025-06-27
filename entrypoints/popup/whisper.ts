import { env } from '@xenova/transformers';
import { pipeline } from '@xenova/transformers';

env.allowLocalModels = false;

let asr: Awaited<ReturnType<typeof pipeline>> | null = null;

export async function transcribe(blob: Float32Array): Promise<string> {
  asr ??= await pipeline(
    'automatic-speech-recognition',
    'Xenova/whisper-tiny.en',
    { device: 'webgpu' }
  );

  const result = await asr(blob);

  return result.text.trim();
}
