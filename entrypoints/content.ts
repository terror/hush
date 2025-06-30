import { createRecordingManager } from '@/lib/audio';
import {
  OverlayManager,
  insertTextIntoElement,
  isTextField,
} from '@/lib/content';
import {
  DEFAULT_HOTKEY,
  type HotkeyConfig,
  loadHotkeyFromStorage,
  matchesHotkey,
} from '@/lib/hotkey';
import { transcribeBlob } from '@/lib/transcription';

interface RecordingState {
  isRecording: boolean;
  targetElement: HTMLElement | null;
}

const state: RecordingState = {
  isRecording: false,
  targetElement: null,
};

let currentHotkey: HotkeyConfig = DEFAULT_HOTKEY;

const recordingManager = createRecordingManager();
const overlayManager = new OverlayManager();

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('[Hush] Content script loaded');
    initializeHotkey();
    document.addEventListener('keydown', handleKeyDown);
    setupStorageListener();
  },
});

async function initializeHotkey() {
  currentHotkey = await loadHotkeyFromStorage();
  console.log('[Hush] Loaded hotkey:', currentHotkey);
}

function setupStorageListener() {
  browser.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.hotkey) {
      currentHotkey = changes.hotkey.newValue || DEFAULT_HOTKEY;
      console.log('[Hush] Hotkey updated:', currentHotkey);
    }
  });
}

function handleKeyDown(event: KeyboardEvent) {
  if (matchesHotkey(event, currentHotkey)) {
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

    overlayManager.showRecording(currentHotkey);
  } catch (error) {
    console.error('[Hush] Failed to start recording:', error);
    overlayManager.showError('Microphone permission denied or not available');
    cleanup();
  }
}

async function stopRecording() {
  if (!recordingManager.isRecording()) return;

  try {
    const blob = await recordingManager.stop();
    await processRecording(blob);
  } catch (error) {
    console.error('[Hush] Recording failed:', error);
    overlayManager.showError('Recording failed');
  } finally {
    cleanup();
  }
}

async function processRecording(blob: Blob) {
  if (!state.targetElement) return;

  overlayManager.showTranscribing();

  try {
    const text = await transcribeBlob(blob);
    insertTextIntoElement(state.targetElement, text);
    overlayManager.showSuccess();
  } catch (error) {
    console.error('[Hush] Transcription failed:', error);
    overlayManager.showError('Transcription failed');
  }
}

function cleanup() {
  state.isRecording = false;
  state.targetElement = null;
  recordingManager.cleanup();
}
