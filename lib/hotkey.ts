export interface HotkeyConfig {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  key: string;
}

export const DEFAULT_HOTKEY: HotkeyConfig = {
  ctrlKey: true,
  altKey: false,
  shiftKey: true,
  metaKey: false,
  key: 'L',
};

export function formatHotkey(config: HotkeyConfig): string {
  const parts = [];

  if (config.ctrlKey) parts.push('Ctrl');
  if (config.altKey) parts.push('Alt');
  if (config.shiftKey) parts.push('Shift');
  if (config.metaKey) parts.push('Cmd');

  parts.push(config.key);

  return parts.join(' + ');
}

export function matchesHotkey(
  event: KeyboardEvent,
  hotkey: HotkeyConfig
): boolean {
  return (
    event.ctrlKey === hotkey.ctrlKey &&
    event.altKey === hotkey.altKey &&
    event.shiftKey === hotkey.shiftKey &&
    event.metaKey === hotkey.metaKey &&
    event.key.toUpperCase() === hotkey.key.toUpperCase()
  );
}

export async function loadHotkeyFromStorage(): Promise<HotkeyConfig> {
  try {
    const result = (await browser.storage.sync.get('hotkey')) as {
      hotkey?: HotkeyConfig;
    };
    return result.hotkey || DEFAULT_HOTKEY;
  } catch (error) {
    console.error('Failed to load hotkey config:', error);
    return DEFAULT_HOTKEY;
  }
}

export async function saveHotkeyToStorage(hotkey: HotkeyConfig): Promise<void> {
  try {
    await browser.storage.sync.set({ hotkey });
  } catch (error) {
    console.error('Failed to save hotkey config:', error);
    throw new Error('Failed to save settings');
  }
}
