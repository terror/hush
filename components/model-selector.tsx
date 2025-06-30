import { AVAILABLE_MODELS } from '@/lib/model';
import { TranscriptionService } from '@/lib/transcription';
import type { ModelConfig } from '@/lib/types';
import { Brain, Check, Download, Globe, Languages } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const [preloadingModel, setPreloadingModel] = useState<string | null>(null);

  async function handleModelSelect(modelId: string) {
    if (modelId === selectedModel) return;

    setPreloadingModel(modelId);

    try {
      await TranscriptionService.getInstance().preloadModel(modelId);
      onModelChange(modelId);
    } catch (error) {
      toast.error(`Failed to load model: ${error}`);
    } finally {
      setPreloadingModel(null);
    }
  }

  function ModelCard({ model }: { model: ModelConfig }) {
    const isSelected = selectedModel === model.id;
    const isPreloading = preloadingModel === model.id;

    return (
      <div
        className={`cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 ${
          isSelected
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        } ${isPreloading ? 'opacity-50' : ''}`}
        onClick={() => handleModelSelect(model.id)}
      >
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <h4
                className={`text-sm font-medium ${
                  isSelected ? 'text-blue-800' : 'text-gray-800'
                }`}
              >
                {model.name}
              </h4>
              <div className='flex items-center gap-1'>
                {model.languages === 'multilingual' ? (
                  <Globe className='h-3 w-3 text-gray-500' />
                ) : (
                  <Languages className='h-3 w-3 text-gray-500' />
                )}
                <span className='font-mono text-xs text-gray-500'>
                  {model.size}
                </span>
              </div>
            </div>
            <p
              className={`mt-1 text-xs ${
                isSelected ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {model.description}
            </p>
          </div>

          <div className='ml-2 flex items-center'>
            {isPreloading ? (
              <Download className='h-4 w-4 animate-pulse text-blue-500' />
            ) : isSelected ? (
              <Check className='h-4 w-4 text-blue-500' />
            ) : null}
          </div>
        </div>

        <div className='mt-2 flex items-center gap-2'>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              model.languages === 'multilingual'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {model.languages === 'multilingual'
              ? 'Multilingual'
              : 'English Only'}
          </span>
        </div>
      </div>
    );
  }

  function ModelGroup({
    title,
    models,
  }: {
    title: string;
    models: ModelConfig[];
  }) {
    return (
      <div className='space-y-2'>
        <h3 className='flex items-center gap-2 text-sm font-semibold text-gray-700'>
          {title === 'English Models' ? (
            <Languages className='h-4 w-4' />
          ) : (
            <Globe className='h-4 w-4' />
          )}
          {title}
        </h3>
        <div className='space-y-2'>
          {models.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      </div>
    );
  }

  const englishModels = AVAILABLE_MODELS.filter(
    (m) => m.languages === 'english'
  );

  const multilingualModels = AVAILABLE_MODELS.filter(
    (m) => m.languages === 'multilingual'
  );

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <Brain className='h-4 w-4 text-gray-600' />
        <div>
          <h3 className='text-sm font-medium text-gray-800'>
            Speech Recognition Model
          </h3>
          <p className='text-xs text-gray-500'>
            Choose the model that best fits your needs
          </p>
        </div>
      </div>

      <div className='space-y-4'>
        <ModelGroup title='English Models' models={englishModels} />
        <ModelGroup title='Multilingual Models' models={multilingualModels} />
      </div>

      <div className='rounded-lg bg-slate-50 p-3 text-xs text-slate-500'>
        <div className='space-y-2'>
          <p>
            <strong>English models:</strong> Faster and more accurate for
            English-only content.
          </p>
          <p>
            <strong>Multilingual models:</strong> Support multiple languages but
            may be slower.
          </p>
          <p>
            <strong>Size:</strong> Larger models generally provide better
            accuracy but take longer to load.
          </p>
        </div>
      </div>
    </div>
  );
}
