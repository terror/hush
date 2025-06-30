export interface HotkeyConfig {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  key: string;
}

export interface StorageData {
  hotkey?: HotkeyConfig;
}

export interface RecordingState {
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
  chunks: Blob[];
  targetElement: HTMLElement | null;
  overlay: HTMLElement | null;
}

export type View = 'main' | 'settings';
