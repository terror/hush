import { HotkeyConfig } from './types';

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
