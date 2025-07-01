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
import { formatError } from '@/lib/utils';

/**
 * Current application settings, initialized with defaults.
 */
let settings = DEFAULT_SETTINGS;

/**
 * Global state object to track recording status and target element.
 */
const state: RecordingState = {
  isRecording: false,
  targetElement: null,
};

const overlayManager = new OverlayManager();
const recordingManager = createRecordingManager();
const settingsManager = SettingsManager.getInstance();
const transcriptionService = TranscriptionService.getInstance();

/**
 * Content script configuration that runs on all URLs.
 *
 * Sets up event listeners and initializes the application.
 */
export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    initialize();
  },
});

/**
 * Initializes the content script by loading settings and the transcription model.
 *
 * Sets up settings change listeners and attempts to pre-load the AI model.
 *
 * @async
 * @function initialize
 * @returns {Promise<void>}
 */
async function initialize(): Promise<void> {
  try {
    settings = await settingsManager.loadSettings();

    settingsManager.onSettingsChanged((newSettings) => {
      settings = newSettings;
    });

    await transcriptionService.loadModel(settings.model);

    document.addEventListener('keydown', handleKeyDown);

    console.info('[Hush] Content script initialized');
  } catch (error) {
    console.error(
      `[Hush] Failed to initialize content script: ${formatError(error)}`
    );
  }
}

/**
 * Handles keyboard events to trigger recording start/stop.
 *
 * Checks if the pressed key combination matches the configured hotkey.
 *
 * n.b. Only operates on text input fields.
 *
 * @param {KeyboardEvent} event - The keyboard event to handle
 */
function handleKeyDown(event: KeyboardEvent) {
  if (!matchesHotkey(event, settings.hotkey)) return;

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

/**
 * Starts audio recording for the specified target element.
 *
 * Initializes the recording manager, updates state, and shows recording overlay.
 *
 * @async
 * @param {HTMLElement} targetElement - The text field element to insert transcription into
 * @returns {Promise<void>}
 */
async function startRecording(targetElement: HTMLElement): Promise<void> {
  if (state.isRecording) return;

  try {
    await recordingManager.start();
    state.isRecording = true;
    state.targetElement = targetElement;
    overlayManager.showRecording(settings.hotkey);
  } catch (error) {
    overlayManager.showError(formatError(error));
    cleanup();
  }
}

/**
 * Stops the current recording and processes the recorded audio.
 *
 * Handles the recording data and initiates transcription process.
 *
 * @async
 * @returns {Promise<void>}
 */
async function stopRecording(): Promise<void> {
  if (!recordingManager.isRecording()) return;

  try {
    await processRecording(await recordingManager.stop());
  } catch (error) {
    overlayManager.showError(formatError(error));
  } finally {
    cleanup();
  }
}

/**
 * Processes the recorded audio blob by transcribing it to text.
 *
 * Inserts the transcribed text into the target element if successful.
 *
 * @async
 * @param {Blob} blob - The recorded audio data as a Blob
 * @returns {Promise<void>}
 */
async function processRecording(blob: Blob): Promise<void> {
  if (!state.targetElement) return;

  overlayManager.showTranscribing();

  try {
    const text = await transcriptionService.transcribeBlob(
      blob,
      settings.model
    );

    if (text.trim()) {
      insertTextIntoElement(state.targetElement, text);
      overlayManager.showSuccess('Text inserted successfully!');
    } else {
      overlayManager.showError('No speech detected');
    }
  } catch (error) {
    overlayManager.showError(formatError(error));
  }
}

/**
 * Cleans up the recording state and resources.
 *
 * Resets the global state and cleans up the recording manager.
 */
function cleanup() {
  state.isRecording = false;
  state.targetElement = null;
  recordingManager.cleanup();
}
