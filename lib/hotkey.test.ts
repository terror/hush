import { describe, expect, it } from 'bun:test';

import { formatHotkey, matchesHotkey } from '../lib/hotkey';
import { DEFAULT_SETTINGS } from './settings';
import { HotkeyConfig } from './types';

describe('formatHotkey', () => {
  it('should format hotkey with all modifiers', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: true,
      altKey: true,
      shiftKey: true,
      metaKey: true,
      key: 'A',
    };

    const result = formatHotkey(hotkey);

    expect(result).toBe('Ctrl + Alt + Shift + Cmd + A');
  });

  it('should format hotkey with only Ctrl', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      key: 'C',
    };

    const result = formatHotkey(hotkey);

    expect(result).toBe('Ctrl + C');
  });

  it('should format hotkey with only key (no modifiers)', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      key: 'Enter',
    };

    const result = formatHotkey(hotkey);

    expect(result).toBe('Enter');
  });

  it('should format hotkey with Alt and Shift', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: false,
      altKey: true,
      shiftKey: true,
      metaKey: false,
      key: 'Tab',
    };

    const result = formatHotkey(hotkey);
    expect(result).toBe('Alt + Shift + Tab');
  });

  it('should format hotkey with Meta key only', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: true,
      key: 'Space',
    };

    const result = formatHotkey(hotkey);
    expect(result).toBe('Cmd + Space');
  });

  it('should format default hotkey correctly', () => {
    const result = formatHotkey(DEFAULT_SETTINGS.hotkey);
    expect(result).toBe('Ctrl + Shift + L');
  });
});

describe('matchesHotkey', () => {
  const createKeyboardEvent = (config: Partial<KeyboardEvent>): KeyboardEvent =>
    ({
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      key: '',
      ...config,
    }) as KeyboardEvent;

  it('should match exact hotkey combination', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: false,
      key: 'L',
    };

    const event = createKeyboardEvent({
      ctrlKey: true,
      shiftKey: true,
      key: 'L',
    });

    expect(matchesHotkey(event, hotkey)).toBe(true);
  });

  it('should not match when modifier keys differ', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: false,
      key: 'L',
    };

    const event = createKeyboardEvent({
      ctrlKey: true,
      altKey: true, // Extra modifier
      shiftKey: true,
      key: 'L',
    });

    expect(matchesHotkey(event, hotkey)).toBe(false);
  });

  it('should not match when key differs', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: false,
      key: 'L',
    };

    const event = createKeyboardEvent({
      ctrlKey: true,
      shiftKey: true,
      key: 'K', // Different key
    });

    expect(matchesHotkey(event, hotkey)).toBe(false);
  });

  it('should not match when missing required modifiers', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: false,
      key: 'L',
    };

    const event = createKeyboardEvent({
      ctrlKey: true,
      // Missing shiftKey
      key: 'L',
    });

    expect(matchesHotkey(event, hotkey)).toBe(false);
  });

  it('should be case insensitive for key matching', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      key: 'a',
    };

    const event = createKeyboardEvent({
      ctrlKey: true,
      key: 'A', // Uppercase
    });

    expect(matchesHotkey(event, hotkey)).toBe(true);
  });

  it('should match with all modifiers false', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      key: 'Enter',
    };

    const event = createKeyboardEvent({
      key: 'Enter',
    });

    expect(matchesHotkey(event, hotkey)).toBe(true);
  });

  it('should match Meta key combinations', () => {
    const hotkey: HotkeyConfig = {
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: true,
      key: 'Space',
    };

    const event = createKeyboardEvent({
      metaKey: true,
      key: 'Space',
    });

    expect(matchesHotkey(event, hotkey)).toBe(true);
  });
});
