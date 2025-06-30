import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createRecordingManager } from '@/lib/audio';
import { TranscriptionService } from '@/lib/transcription';
import type { View } from '@/lib/types';
import { SettingsView } from '@/views/settings';
import { Copy, Mic, Settings as SettingsIcon, Square } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export default function App() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState('');
  const [view, setView] = useState<View>('main');

  const recordingManager = useRef(createRecordingManager());
  const transcriptionService = useRef(TranscriptionService.getInstance());

  async function start() {
    try {
      await recordingManager.current.start();
      setRecording(true);
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        toast.error(
          'Microphone permission denied. Please allow access to continue.'
        );
      } else {
        toast.error(`${e.name}: ${e.message}`);
      }
    }
  }

  async function stop() {
    try {
      const blob = await recordingManager.current.stop();
      setRecording(false);
      setIsTranscribing(true);
      setText('');
      const transcribedText =
        await transcriptionService.current.transcribeBlob(blob);
      setText(transcribedText);
    } catch (e: any) {
      toast.error(`Transcription failed: ${e.message}`);
    } finally {
      setIsTranscribing(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch (e: any) {
      toast.error('Failed to copy to clipboard');
    }
  }

  if (view === 'settings') {
    return <SettingsView onBack={() => setView('main')} />;
  }

  return (
    <div className='w-96 bg-white'>
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
            <SettingsIcon className='h-4 w-4' />
          </Button>
        </CardHeader>

        <CardContent className='space-y-3 p-4'>
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
                  justCopied ? 'bg-green-500 text-white hover:bg-green-500' : ''
                }`}
              >
                <Copy
                  className={`h-3 w-3 transition-transform duration-300 ${
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
