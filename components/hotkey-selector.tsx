import { Button } from '@/components/ui/button';
import { formatHotkey } from '@/lib/hotkey';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import type { HotkeyConfig } from '@/lib/types';
import { Keyboard, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface HotkeySelectorProps {
  hotkey: HotkeyConfig;
  onHotkeyChange: (hotkey: HotkeyConfig) => void;
}

export function HotkeySelector({
  hotkey,
  onHotkeyChange,
}: HotkeySelectorProps) {
  const [isListening, setIsListening] = useState(false);

  function startListening() {
    setIsListening(true);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!isListening) return;

    event.preventDefault();
    event.stopPropagation();

    if (
      ['Control', 'Alt', 'Shift', 'Meta', 'Cmd', 'Command'].includes(event.key)
    ) {
      return;
    }

    if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
      toast.error(
        'Please use at least one modifier key (Ctrl, Alt, Shift, or Cmd)'
      );

      return;
    }

    const newHotkey: HotkeyConfig = {
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      key: event.key.toUpperCase(),
    };

    onHotkeyChange(newHotkey);
    setIsListening(false);
  }

  function resetToDefault() {
    onHotkeyChange(DEFAULT_SETTINGS.hotkey);
    setIsListening(false);
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Keyboard className='h-4 w-4 text-slate-600' />
        <div>
          <h3 className='text-sm font-medium text-slate-800'>Hotkey</h3>
          <p className='text-xs text-slate-500'>
            Keyboard shortcut for voice recording
          </p>
        </div>
      </div>

      <div
        className={`cursor-pointer rounded-lg border-2 p-3 text-center font-mono text-sm transition-colors ${
          isListening
            ? 'border-blue-400 bg-blue-50 text-blue-700'
            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
        }`}
        onClick={startListening}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {isListening ? 'Press key combination...' : formatHotkey(hotkey)}
      </div>

      <div className='flex gap-2'>
        <Button
          onClick={resetToDefault}
          variant='outline'
          size='sm'
          className='flex-1'
        >
          <RotateCcw className='h-3 w-3' />
          Reset
        </Button>
      </div>

      <div className='rounded-lg bg-slate-50 p-3 text-xs text-slate-500'>
        <p>
          <strong>Usage:</strong> Focus on any text input and press your hotkey
          to start recording.
        </p>
        <p className='mt-1'>
          <strong>Note:</strong> Requires at least one modifier key for safety.
        </p>
      </div>
    </div>
  );
}
