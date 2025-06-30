import { ModelConfig } from './types';

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'Xenova/whisper-tiny.en',
    name: 'Whisper Tiny',
    description: 'Fastest, English-only model',
    size: '~39MB',
    languages: 'english',
  },
  {
    id: 'Xenova/whisper-base.en',
    name: 'Whisper Base',
    description: 'Good balance of speed and accuracy for English',
    size: '~74MB',
    languages: 'english',
  },
  {
    id: 'Xenova/whisper-small.en',
    name: 'Whisper Small',
    description: 'Better accuracy, English-only',
    size: '~244MB',
    languages: 'english',
  },
  {
    id: 'Xenova/whisper-tiny',
    name: 'Whisper Tiny',
    description: 'Fastest multilingual model',
    size: '~39MB',
    languages: 'multilingual',
  },
  {
    id: 'Xenova/whisper-base',
    name: 'Whisper Base',
    description: 'Good balance for multiple languages',
    size: '~74MB',
    languages: 'multilingual',
  },
  {
    id: 'Xenova/whisper-small',
    name: 'Whisper Small',
    description: 'Better accuracy for multiple languages',
    size: '~244MB',
    languages: 'multilingual',
  },
];
