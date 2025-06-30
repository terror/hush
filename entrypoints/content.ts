import browser from 'webextension-polyfill';

import { blobToPCM } from './popup/audio';
import { transcribe } from './popup/whisper';

interface HotkeyConfig {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  key: string;
}

interface RecordingState {
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
  chunks: Blob[];
  targetElement: HTMLElement | null;
  overlay: HTMLElement | null;
}

const DEFAULT_HOTKEY: HotkeyConfig = {
  ctrlKey: true,
  altKey: false,
  shiftKey: true,
  metaKey: false,
  key: 'L',
};

const state: RecordingState = {
  isRecording: false,
  mediaRecorder: null,
  chunks: [],
  targetElement: null,
  overlay: null,
};

let currentHotkey: HotkeyConfig = DEFAULT_HOTKEY;

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('[Hush] Content script loaded');

    loadHotkeyConfig();

    document.addEventListener('keydown', handleKeyDown);

    browser.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.hotkey) {
        currentHotkey = changes.hotkey.newValue || DEFAULT_HOTKEY;
        console.log('[Hush] Hotkey updated:', formatHotkey(currentHotkey));
      }
    });
  },
});

async function loadHotkeyConfig() {
  try {
    const result = await browser.storage.sync.get('hotkey');

    if (result.hotkey) {
      currentHotkey = result.hotkey;
      console.log('[Hush] Loaded hotkey:', formatHotkey(currentHotkey));
    } else {
      await browser.storage.sync.set({ hotkey: DEFAULT_HOTKEY });
      console.log('[Hush] Using default hotkey:', formatHotkey(DEFAULT_HOTKEY));
    }
  } catch (error) {
    console.error('[Hush] Failed to load hotkey config:', error);
  }
}

function formatHotkey(config: HotkeyConfig): string {
  const parts = [];

  if (config.ctrlKey) {
    parts.push('Ctrl');
  }

  if (config.altKey) {
    parts.push('Alt');
  }

  if (config.shiftKey) {
    parts.push('Shift');
  }

  if (config.metaKey) {
    parts.push('Cmd');
  }

  parts.push(config.key);

  return parts.join(' + ');
}

function matchesHotkey(event: KeyboardEvent, hotkey: HotkeyConfig): boolean {
  return (
    event.ctrlKey === hotkey.ctrlKey &&
    event.altKey === hotkey.altKey &&
    event.shiftKey === hotkey.shiftKey &&
    event.metaKey === hotkey.metaKey &&
    event.key.toUpperCase() === hotkey.key.toUpperCase()
  );
}

function handleKeyDown(event: KeyboardEvent) {
  if (matchesHotkey(event, currentHotkey)) {
    event.preventDefault();

    const activeElement = document.activeElement as HTMLElement;

    if (isInputElement(activeElement)) {
      if (state.isRecording) {
        stopRecording();
      } else {
        startRecording(activeElement);
      }
    }
  }
}

function isInputElement(element: HTMLElement): boolean {
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.contentEditable === 'true' ||
    element.hasAttribute('contenteditable')
  );
}

async function startRecording(targetElement: HTMLElement) {
  if (state.isRecording) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    state.mediaRecorder = new MediaRecorder(stream);
    state.chunks = [];
    state.targetElement = targetElement;
    state.isRecording = true;

    state.mediaRecorder.ondataavailable = (event) => {
      state.chunks.push(event.data);
    };

    state.mediaRecorder.onstop = async () => {
      const webm = new Blob(state.chunks, { type: 'audio/webm' });
      await processRecording(webm);
      cleanup();
    };

    state.mediaRecorder.start();

    showRecordingOverlay();
  } catch (error) {
    console.error('[Hush] Failed to start recording:', error);
    showError('Microphone permission denied or not available');
    cleanup();
  }
}

function stopRecording() {
  if (state.mediaRecorder && state.isRecording) {
    state.mediaRecorder.stop();
    state.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
  }
}

async function processRecording(blob: Blob) {
  if (!state.targetElement) return;

  showTranscribingIndicator();

  try {
    const pcm = await blobToPCM(blob);
    const text = await transcribe(pcm);

    insertTextIntoElement(state.targetElement, text);
    showSuccessIndicator();
  } catch (error) {
    console.error('[Hush] Transcription failed:', error);
    showError('Transcription failed');
  }
}

function insertTextIntoElement(element: HTMLElement, text: string) {
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    const input = element as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const currentValue = input.value;

    input.value = currentValue.slice(0, start) + text + currentValue.slice(end);
    input.selectionStart = input.selectionEnd = start + text.length;

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (element.contentEditable === 'true') {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      element.textContent += text;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  element.focus();
}

function showRecordingOverlay() {
  removeOverlay();

  const overlay = document.createElement('div');
  overlay.className = 'hush-recording-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: hush-pulse 2s infinite;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        animation: hush-blink 1s infinite;
      "></div>
      Recording... Press ${formatHotkey(currentHotkey)} to stop
    </div>
  `;

  if (!document.querySelector('#hush-styles')) {
    const style = document.createElement('style');
    style.id = 'hush-styles';
    style.textContent = `
      @keyframes hush-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes hush-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      @keyframes hush-fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);
  state.overlay = overlay;
}

function showTranscribingIndicator() {
  removeOverlay();

  const overlay = document.createElement('div');
  overlay.className = 'hush-transcribing-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: hush-fadeIn 0.3s ease-out;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: #6b7280;
        border-radius: 50%;
        animation: hush-blink 1s infinite;
      "></div>
      Transcribing...
    </div>
  `;

  document.body.appendChild(overlay);
  state.overlay = overlay;
}

function showSuccessIndicator() {
  removeOverlay();

  const overlay = document.createElement('div');
  overlay.className = 'hush-success-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: hush-fadeIn 0.3s ease-out;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      Text inserted successfully!
    </div>
  `;

  document.body.appendChild(overlay);
  state.overlay = overlay;

  setTimeout(removeOverlay, 2000);
}

function showError(message: string) {
  removeOverlay();

  const overlay = document.createElement('div');
  overlay.className = 'hush-error-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: hush-fadeIn 0.3s ease-out;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      ${message}
    </div>
  `;

  document.body.appendChild(overlay);
  state.overlay = overlay;

  setTimeout(removeOverlay, 3000);
}

function removeOverlay() {
  if (state.overlay && state.overlay.parentNode) {
    state.overlay.remove();
    state.overlay = null;
  }
}

function cleanup() {
  state.isRecording = false;
  state.mediaRecorder = null;
  state.chunks = [];
  state.targetElement = null;
  removeOverlay();
}
