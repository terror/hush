import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle,
  ArrowLeft,
  Copy,
  Keyboard,
  Mic,
  Save,
  Settings,
  Square,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { blobToPCM } from './audio';
import { transcribe } from './whisper';

interface HotkeyConfig {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  key: string;
}

const DEFAULT_HOTKEY: HotkeyConfig = {
  ctrlKey: true,
  altKey: false,
  shiftKey: true,
  metaKey: false,
  key: 'L',
};

type View = 'main' | 'settings';

interface HotkeySettingProps {
  hotkey: HotkeyConfig;
  onHotkeyChange: (hotkey: HotkeyConfig) => void;
  onError: (error: string) => void;
}

function HotkeySetting({
  hotkey,
  onHotkeyChange,
  onError,
}: HotkeySettingProps) {
  const [isListening, setIsListening] = useState(false);

  function startListening() {
    setIsListening(true);
    onError('');
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
      onError(
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

  function formatHotkey(config: HotkeyConfig): string {
    const parts = [];
    if (config.ctrlKey) parts.push('Ctrl');
    if (config.altKey) parts.push('Alt');
    if (config.shiftKey) parts.push('Shift');
    if (config.metaKey) parts.push('Cmd');
    parts.push(config.key);
    return parts.join(' + ');
  }

  function resetToDefault() {
    onHotkeyChange(DEFAULT_HOTKEY);
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

interface SettingsViewProps {
  onBack: () => void;
  error: string;
  onError: (error: string) => void;
}

function SettingsView({ onBack, error, onError }: SettingsViewProps) {
  const [hotkey, setHotkey] = useState<HotkeyConfig>(DEFAULT_HOTKEY);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const result = await browser.storage.sync.get('hotkey');

      if (result.hotkey) {
        setHotkey(result.hotkey);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  async function saveSettings() {
    try {
      await browser.storage.sync.set({ hotkey });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (err) {
      onError('Failed to save settings');
      setTimeout(() => onError(''), 3000);
    }
  }

  return (
    <div className='w-80 bg-white'>
      <Card className='border-0 shadow-none'>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={onBack}
              className='h-8 w-8 p-1'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <CardTitle className='text-lg font-light tracking-wide text-slate-800'>
              Settings
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant='destructive' className='border-red-200 bg-red-50'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='text-red-800'>
                {error}
              </AlertDescription>
            </Alert>
          )}

          <HotkeySetting
            hotkey={hotkey}
            onHotkeyChange={setHotkey}
            onError={onError}
          />

          <div className='pt-4'>
            <Button
              onClick={saveSettings}
              size='sm'
              className={`w-full transition-all duration-300 ${
                settingsSaved
                  ? 'bg-green-500 text-white hover:bg-green-500'
                  : ''
              }`}
            >
              <Save
                className={`mr-2 h-3 w-3 transition-transform duration-300 ${
                  settingsSaved ? 'scale-110' : ''
                }`}
              />
              {settingsSaved ? 'Saved!' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  const [error, setError] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState('');
  const [view, setView] = useState<View>('main');

  const media = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function start() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      media.current = new MediaRecorder(stream);
      media.current.ondataavailable = (e) => chunks.current.push(e.data);
      media.current.start();
      setRecording(true);
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setError(
          'Microphone permission denied. Please allow access to continue.'
        );
      } else {
        setError(`${e.name}: ${e.message}`);
      }
    }
  }

  async function stop() {
    media.current?.stop();
    media.current?.stream.getTracks().forEach((t) => t.stop());
    media.current!.onstop = async () => {
      const webm = new Blob(chunks.current, { type: 'audio/webm' });
      chunks.current = [];

      setIsTranscribing(true);
      setText('');

      try {
        const pcm = await blobToPCM(webm);
        const out = await transcribe(pcm);
        setText(out);
      } catch (e: any) {
        setError(`Transcription failed: ${e.message}`);
      } finally {
        setRecording(false);
        setIsTranscribing(false);
      }
    };
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch (e: any) {
      setError('Failed to copy to clipboard');
    }
  }

  if (view === 'settings') {
    return (
      <SettingsView
        onBack={() => setView('main')}
        error={error}
        onError={setError}
      />
    );
  }

  return (
    <div className='w-80 bg-white'>
      <Card className='border-0 shadow-none'>
        <CardHeader className='relative pb-3'>
          <div className='text-center'>
            <CardTitle className='text-xl font-light tracking-wide text-slate-800'>
              hush
            </CardTitle>
            <p className='text-xs text-slate-500'>
              Voice to text transcription
            </p>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setView('settings')}
            className='absolute top-4 right-4 h-8 w-8 p-1'
          >
            <Settings className='h-4 w-4' />
          </Button>
        </CardHeader>

        <CardContent className='space-y-3 p-4'>
          {error && (
            <Alert variant='destructive' className='border-red-200 bg-red-50'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='text-red-800'>
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className='flex justify-center'>
            {recording ? (
              <Button
                onClick={stop}
                size='lg'
                className='h-16 w-16 rounded-full border-2 border-red-200 bg-red-500 shadow-md transition-all duration-200 hover:scale-105 hover:bg-red-600'
              >
                <Square className='h-6 w-6 text-white' />
              </Button>
            ) : (
              <Button
                onClick={start}
                size='lg'
                disabled={isTranscribing}
                className='h-16 w-16 rounded-full border-2 border-slate-200 bg-slate-800 shadow-md transition-all duration-200 hover:scale-105 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                <Mic className='h-6 w-6 text-white' />
              </Button>
            )}
          </div>

          {recording && (
            <div className='text-center'>
              <div className='inline-flex items-center gap-2 font-medium text-red-600'>
                <div className='h-2 w-2 animate-pulse rounded-full bg-red-500'></div>
                Recording...
              </div>
            </div>
          )}

          {isTranscribing && (
            <div className='text-center'>
              <div className='inline-flex items-center gap-2 text-slate-600'>
                <div className='h-2 w-2 animate-pulse rounded-full bg-slate-400'></div>
                Transcribing...
              </div>
            </div>
          )}

          {text && !isTranscribing && (
            <div className='space-y-2'>
              <ScrollArea className='h-24 w-full rounded-lg border bg-slate-50 p-3'>
                <p className='text-xs leading-relaxed whitespace-pre-wrap text-slate-700'>
                  {text}
                </p>
              </ScrollArea>

              <Button
                onClick={copy}
                variant='outline'
                size='sm'
                className={`w-full transition-all duration-300 ${
                  justCopied
                    ? 'border-green-500 bg-green-500 text-white hover:bg-green-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <Copy
                  className={`mr-2 h-3 w-3 transition-transform duration-300 ${
                    justCopied ? 'scale-110' : ''
                  }`}
                />
                {justCopied ? 'Copied!' : 'Copy to clipboard'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
