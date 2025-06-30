import { HotkeySelector } from '@/components/hotkey-selector';
import { ModelSelector } from '@/components/model-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_SETTINGS, SettingsManager } from '@/lib/settings';
import type { Settings } from '@/lib/types';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface SettingsViewProps {
  onBack: () => void;
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const settingsManager = useRef(SettingsManager.getInstance());

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const loadedSettings = await settingsManager.current.loadSettings();
      setSettings(loadedSettings);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      await settingsManager.current.saveSettings(settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (loading) {
    return (
      <div className='flex h-64 w-96 items-center justify-center bg-white'>
        <div className='text-sm text-gray-500'>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className='w-96 bg-white'>
      <Card className='border-0 shadow-none'>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={onBack}
              className='h-8 w-8'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <CardTitle className='text-lg font-light tracking-wide text-slate-800'>
              Settings
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          <div className='space-y-6'>
            <HotkeySelector
              hotkey={settings.hotkey}
              onHotkeyChange={(hotkey) =>
                setSettings((prev) => ({ ...prev, hotkey }))
              }
            />

            <div>
              <ModelSelector
                selectedModel={settings.model}
                onModelChange={(model) =>
                  setSettings((prev) => ({ ...prev, model }))
                }
              />
            </div>
          </div>

          <div>
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
                className={`h-3 w-3 transition-transform duration-300 ${
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
