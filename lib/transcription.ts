import {
  type AutomaticSpeechRecognitionPipeline,
  env,
  pipeline,
} from '@xenova/transformers';

import { blobToPCM } from './audio';
import { SettingsManager } from './settings';

env.allowLocalModels = false;

type Transcript = string;

const modelCache = new Map<string, AutomaticSpeechRecognitionPipeline>();

export class TranscriptionService {
  private settingsManager: SettingsManager;

  private static instance: TranscriptionService;

  private constructor() {
    this.settingsManager = SettingsManager.getInstance();
  }

  /**
   * Gets the singleton instance of the TranscriptionService.
   *
   * @returns The singleton TranscriptionService instance
   */
  static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }

    return TranscriptionService.instance;
  }

  /**
   * Retrieves or loads an automatic speech recognition model.
   *
   * Models are cached to avoid repeated loading.
   *
   * @param modelId - Optional model identifier. Uses settings default if not provided
   * @returns Promise resolving to the loaded ASR pipeline
   * @throws Error if model loading fails completely
   */
  async loadModel(
    modelId?: string
  ): Promise<AutomaticSpeechRecognitionPipeline> {
    const targetModelId =
      modelId || (await this.settingsManager.getSetting('model'));

    if (modelCache.has(targetModelId)) {
      return modelCache.get(targetModelId)!;
    }

    const asr = await pipeline<'automatic-speech-recognition'>(
      'automatic-speech-recognition',
      targetModelId,
      { device: 'webgpu' }
    );

    modelCache.set(targetModelId, asr);

    return asr;
  }

  /**
   * Transcribes audio data to text using automatic speech recognition.
   *
   * @param audioData - Float32Array containing PCM audio data
   * @param modelId - Optional model identifier to use for transcription
   * @returns Promise resolving to the transcribed text
   * @throws Error if transcription fails
   */
  async transcribe(
    audioData: Float32Array,
    modelId?: string
  ): Promise<Transcript> {
    const asr = await this.loadModel(modelId);
    const result = (await asr(audioData)) as { text: string };
    return result.text.trim();
  }

  /**
   * Transcribes audio from a Blob by converting it to PCM format first.
   *
   * @param blob - Audio blob to transcribe
   * @param modelId - Optional model identifier to use for transcription
   * @returns Promise resolving to the transcribed text
   * @throws Error if audio conversion or transcription fails
   */
  async transcribeBlob(blob: Blob, modelId?: string): Promise<Transcript> {
    return this.transcribe(await blobToPCM(blob), modelId);
  }
}
