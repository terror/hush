import {
  type AutomaticSpeechRecognitionPipeline,
  env,
  pipeline,
} from '@xenova/transformers';

import { blobToPCM } from './audio';

env.allowLocalModels = false;

const MODEL_NAME = 'Xenova/whisper-base';

type Transcript = string;

let asr: AutomaticSpeechRecognitionPipeline | null = null;

/**
 * Transcribes PCM audio using the Xenova Whisper automatic‑speech‑recognition pipeline.
 *
 * The first call lazily initialises the heavy Whisper model and caches the
 * resulting {@link AutomaticSpeechRecognitionPipeline} in the `asr` variable so
 * that subsequent calls incur *no* model‑loading overhead.
 *
 * Whisper expects **mono 16 kHz** linear PCM wrapped in a {@link Float32Array}.
 * If your input is a different format or sample‑rate, convert it beforehand —
 * or use {@link transcribeBlob}, which handles typical browser audio blobs for
 * you.
 *
 * @param audioData Raw 16 kHz mono PCM samples to transcribe.
 * @returns A {@link Transcript} containing the recognised text as a string.
 *          Language detection is handled by the multilingual Whisper model
 *          but not exposed in this simplified interface.
 *
 * @example
 * ```ts
 * const pcm = recordMicrophone();
 * const text = await transcribe(pcm);
 * console.log(text);
 * ```
 *
 * @throws If the model cannot be loaded or inference fails.
 */
export async function transcribe(audioData: Float32Array): Promise<Transcript> {
  if (!asr) {
    asr = await pipeline<'automatic-speech-recognition'>(
      'automatic-speech-recognition',
      MODEL_NAME,
      { device: 'webgpu' }
    );
  }

  const result = (await asr(audioData)) as { text: string };

  return result.text.trim();
}

export async function transcribeBlob(blob: Blob): Promise<Transcript> {
  return transcribe(await blobToPCM(blob));
}
