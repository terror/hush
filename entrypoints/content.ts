import { createRecordingManager } from '@/lib/audio';
import {
  OverlayManager,
  insertTextIntoElement,
  isTextField,
} from '@/lib/content';
import { matchesHotkey } from '@/lib/hotkey';
import { DEFAULT_SETTINGS, SettingsManager } from '@/lib/settings';
import { TranscriptionService } from '@/lib/transcription';
import { RecordingState } from '@/lib/types';

const state: RecordingState = {
  isRecording: false,
  targetElement: null,
};

let currentSettings = DEFAULT_SETTINGS;

const overlayManager = new OverlayManager();
const recordingManager = createRecordingManager();
const settingsManager = SettingsManager.getInstance();
const transcriptionService = TranscriptionService.getInstance();

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.info('[Hush] Content script loaded');
    initializeSettings();
    document.addEventListener('keydown', handleKeyDown);
    setupSettingsListener();
  },
});

async function initializeSettings() {
  try {
    currentSettings = await settingsManager.loadSettings();

    console.info('[Hush] Loaded settings:', currentSettings);

    try {
      await transcriptionService.loadModel(currentSettings.model);
      console.info('[Hush] Model loaded successfully');
    } catch (error) {
      console.warn('[Hush] Failed to load model:', error);
    }
  } catch (error) {
    console.error('[Hush] Failed to initialize settings:', error);
  }
}

function setupSettingsListener() {
  settingsManager.onSettingsChanged((newSettings) => {
    currentSettings = newSettings;
    console.info('[Hush] Settings updated:', newSettings);
  });
}

function handleKeyDown(event: KeyboardEvent) {
  if (matchesHotkey(event, currentSettings.hotkey)) {
    event.preventDefault();

    const activeElement = document.activeElement as HTMLElement;

    if (isTextField(activeElement)) {
      if (state.isRecording) {
        stopRecording();
      } else {
        startRecording(activeElement);
      }
    }
  }
}

async function startRecording(targetElement: HTMLElement) {
  if (state.isRecording) return;

  try {
    await recordingManager.start();

    state.isRecording = true;
    state.targetElement = targetElement;

    overlayManager.showRecording(currentSettings.hotkey);

    console.info('[Hush] Recording started');
  } catch (error) {
    let errorMessage = 'Failed to start recording';

    console.error(`[Hush] ${errorMessage}: ${error}`);

    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        errorMessage = `${errorMessage}: Microphone permission denied`;
      } else if (error.name === 'NotFoundError') {
        errorMessage = `${errorMessage}: No microphone found`;
      } else {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
    }

    overlayManager.showError(errorMessage);

    cleanup();
  }
}

async function stopRecording() {
  if (!recordingManager.isRecording()) return;

  console.info('[Hush] Stopping recording...');

  try {
    await processRecording(await recordingManager.stop());
  } catch (error) {
    let errorMessage = 'Failed to record audio';

    console.error(`[Hush] ${errorMessage}: ${error}`);

    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }

    overlayManager.showError(errorMessage);
  } finally {
    cleanup();
  }
}

async function processRecording(blob: Blob) {
  if (!state.targetElement) return;

  overlayManager.showTranscribing();

  console.info(
    `[Hush] Processing recording with model: ${currentSettings.model}`
  );

  try {
    const text = await transcriptionService.transcribeBlob(
      blob,
      currentSettings.model
    );

    if (text.trim()) {
      insertTextIntoElement(state.targetElement, text);
      overlayManager.showSuccess();
      console.info('[Hush] Transcription successful:', text);
    } else {
      overlayManager.showError('No speech detected');
      console.info('[Hush] No speech detected in recording');
    }
  } catch (error) {
    let errorMessage = 'Failed to transcribe audio';

    console.error(`[Hush] ${errorMessage}: ${error}`);

    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }

    overlayManager.showError(errorMessage);
  }
}

function cleanup() {
  state.isRecording = false;
  state.targetElement = null;
  recordingManager.cleanup();
  console.info('[Hush] Cleanup completed');
}
