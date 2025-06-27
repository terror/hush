import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Copy, Mic, Square } from 'lucide-react';
import { useRef, useState } from 'react';

import { blobToPCM } from './audio';
import { transcribe } from './whisper';

export default function App() {
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
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

  return (
    <div className='w-80 bg-white'>
      <Card className='border-0 shadow-none'>
        <CardHeader className='pb-3 text-center'>
          <CardTitle className='text-xl font-light tracking-wide text-slate-800'>
            hush
          </CardTitle>
          <p className='text-xs text-slate-500'>Voice to text transcription</p>
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
