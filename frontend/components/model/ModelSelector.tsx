'use client';

import { useState } from 'react';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { ModelConfig } from '@/types';
import { getModelDisplayName, getProviderColor } from '@/lib/utils';

interface ModelSelectorProps {
  selectedModels: ModelConfig[];
  onModelsChange: (models: ModelConfig[]) => void;
  numRuns: number;
  onNumRunsChange: (runs: number) => void;
}

const AVAILABLE_MODELS = {
  openai: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  huggingface: [
    { value: 'gpt2', label: 'GPT-2' },
    { value: 'distilgpt2', label: 'DistilGPT-2' },
  ],
};

export function ModelSelector({
  selectedModels,
  onModelsChange,
  numRuns,
  onNumRunsChange,
}: Readonly<ModelSelectorProps>) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addModel = () => {
    const newModel: ModelConfig = {
      provider: 'openai',
      model_name: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    };
    onModelsChange([...selectedModels, newModel]);
  };

  const removeModel = (index: number) => {
    const newModels = selectedModels.filter((_, i) => i !== index);
    onModelsChange(newModels);
  };

  const updateModel = (index: number, updates: Partial<ModelConfig>) => {
    const newModels = selectedModels.map((model, i) =>
      i === index ? { ...model, ...updates } : model
    );
    onModelsChange(newModels);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Model Configuration</h2>
          </div>
          <button
            onClick={addModel}
            className="btn-outline text-sm"
            title="Add another model"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="card-content space-y-6">
        {/* Number of Runs */}
        <div>
          <label htmlFor="num-runs-select" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Runs per Model
          </label>
          <select
            id="num-runs-select"
            value={numRuns}
            onChange={(e) => onNumRunsChange(Number(e.target.value))}
            className="input w-full"
          >
            {[1, 2, 3, 5, 10].map((num) => (
              <option key={num} value={num}>
                {num} run{num > 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Multiple runs help assess consistency and variability
          </p>
        </div>

        {/* Selected Models */}
        <div className="space-y-4">
          {selectedModels.map((model, index) => (
            <div
              key={`${model.provider}-${model.model_name}-${index}`}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`badge ${getProviderColor(model.provider)}`}>
                    {model.provider}
                  </span>
                  <span className="font-medium">
                    {getModelDisplayName(model.provider, model.model_name)}
                  </span>
                </div>
                {selectedModels.length > 1 && (
                  <button
                    onClick={() => removeModel(index)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove model"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Provider Selection */}
                <div>
                  <label htmlFor={`provider-select-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Provider
                  </label>
                  <select
                    id={`provider-select-${index}`}
                    aria-label="Provider"
                    value={model.provider}
                    onChange={(e) =>
                      updateModel(index, {
                        provider: e.target.value as ModelConfig['provider'],
                        model_name: AVAILABLE_MODELS[e.target.value as keyof typeof AVAILABLE_MODELS][0].value,
                      })
                    }
                    className="input w-full"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="huggingface">Hugging Face</option>
                  </select>
                </div>

                {/* Model Selection */}
                <div>
                  <label htmlFor={`model-select-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    id={`model-select-${index}`}
                    value={model.model_name}
                    onChange={(e) => updateModel(index, { model_name: e.target.value })}
                    className="input w-full"
                  >
                    {AVAILABLE_MODELS[model.provider].map((modelOption) => (
                      <option key={modelOption.value} value={modelOption.value}>
                        {modelOption.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Temperature */}
                <div>
                  <label
                    htmlFor={`temperature-input-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Temperature: {model.temperature}
                  </label>
                  <input
                    id={`temperature-input-${index}`}
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={model.temperature}
                    onChange={(e) => updateModel(index, { temperature: Number(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Conservative (0)</span>
                    <span>Creative (2)</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div>
                  <label
                    htmlFor={`max-tokens-input-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Max Tokens
                  </label>
                  <input
                    id={`max-tokens-input-${index}`}
                    type="number"
                    min="1"
                    max="4000"
                    value={model.max_tokens || 1000}
                    onChange={(e) => updateModel(index, { max_tokens: Number(e.target.value) })}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Advanced Parameters */}
              {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Top P: {model.top_p}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={model.top_p || 1.0}
                        onChange={(e) => updateModel(index, { top_p: Number(e.target.value) })}
                        className="w-full"
                        title="Top P"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency Penalty: {model.frequency_penalty}
                      </label>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={model.frequency_penalty || 0.0}
                        onChange={(e) => updateModel(index, { frequency_penalty: Number(e.target.value) })}
                        className="w-full"
                        title="Frequency Penalty"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Presence Penalty: {model.presence_penalty}
                      </label>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={model.presence_penalty || 0.0}
                        onChange={(e) => updateModel(index, { presence_penalty: Number(e.target.value) })}
                        className="w-full"
                        title="Presence Penalty"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Advanced Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Parameters
          </button>
        </div>
      </div>
    </div>
  );
}
