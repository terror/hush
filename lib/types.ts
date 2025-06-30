export interface HotkeyConfig {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  key: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  size: string;
  languages: 'english' | 'multilingual';
}

export interface Settings {
  hotkey: HotkeyConfig;
  model: string; // Model ID
}

export interface StorageData {
  settings?: Settings;
}

export interface RecordingState {
  isRecording: boolean;
  targetElement: HTMLElement | null;
}

export type View = 'main' | 'settings';
