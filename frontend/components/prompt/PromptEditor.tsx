'use client';

import { useState } from 'react';
import { Edit3, Copy, Trash2, Plus } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

interface PromptEditorProps {
  promptA: string;
  promptB: string;
  onPromptAChange: (value: string) => void;
  onPromptBChange: (value: string) => void;
  enableABTesting: boolean;
  onEnableABTestingChange: (enabled: boolean) => void;
}

export function PromptEditor({
  promptA,
  promptB,
  onPromptAChange,
  onPromptBChange,
  enableABTesting,
  onEnableABTestingChange,
}: PromptEditorProps) {
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    // You would typically show a toast here
  };

  const handleClearPrompt = (variant: 'A' | 'B') => {
    if (variant === 'A') {
      onPromptAChange('');
    } else {
      onPromptBChange('');
    }
  };

  const promptTemplates = [
    {
      name: 'Zero-shot',
      template: 'Please {task}',
      description: 'Direct instruction without examples'
    },
    {
      name: 'Chain-of-Thought',
      template: "Let's think step by step.\n\n{task}\n\nStep 1:",
      description: 'Encourage step-by-step reasoning'
    },
    {
      name: 'Few-shot',
      template: 'Here are some examples:\n\nExample 1: ...\nExample 2: ...\n\nNow: {task}',
      description: 'Provide examples before the task'
    },
    {
      name: 'Role-based',
      template: 'You are an expert in {domain}. Please {task}',
      description: 'Assign a specific role or expertise'
    }
  ];

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Prompt Editor</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* A/B Testing Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={enableABTesting}
                onChange={(e) => onEnableABTestingChange(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">A/B Testing</span>
            </label>
          </div>
        </div>
        
        {/* Template Quick Actions */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Quick Templates:</p>
          <div className="flex flex-wrap gap-2">
            {promptTemplates.map((template) => (
              <button
                key={template.name}
                onClick={() => {
                  const currentPrompt = activeTab === 'A' ? promptA : promptB;
                  const newPrompt = currentPrompt + '\n\n' + template.template;
                  if (activeTab === 'A') {
                    onPromptAChange(newPrompt);
                  } else {
                    onPromptBChange(newPrompt);
                  }
                }}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                title={template.description}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card-content">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('A')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'A'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Prompt A
            {promptA && <span className="ml-2 text-xs text-gray-400">({promptA.length} chars)</span>}
          </button>
          
          {enableABTesting && (
            <button
              onClick={() => setActiveTab('B')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'B'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Prompt B
              {promptB && <span className="ml-2 text-xs text-gray-400">({promptB.length} chars)</span>}
            </button>
          )}
        </div>

        {/* Prompt Content */}
        <div className="space-y-4">
          {activeTab === 'A' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Prompt A
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCopyPrompt(promptA)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy prompt"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleClearPrompt('A')}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Clear prompt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <TextareaAutosize
                value={promptA}
                onChange={(e) => onPromptAChange(e.target.value)}
                placeholder="Enter your prompt here... Use {variable} syntax for dynamic content."
                className="textarea w-full"
                minRows={6}
                maxRows={20}
              />
            </div>
          )}

          {activeTab === 'B' && enableABTesting && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Prompt B (A/B Test Variant)
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCopyPrompt(promptB)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy prompt"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleClearPrompt('B')}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Clear prompt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <TextareaAutosize
                value={promptB}
                onChange={(e) => onPromptBChange(e.target.value)}
                placeholder="Enter your alternative prompt for A/B testing..."
                className="textarea w-full"
                minRows={6}
                maxRows={20}
              />
            </div>
          )}
        </div>

        {/* Prompt Statistics */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Characters:</span>
              <span className="ml-1 font-medium">
                {activeTab === 'A' ? promptA.length : promptB.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Words:</span>
              <span className="ml-1 font-medium">
                {(activeTab === 'A' ? promptA : promptB).trim().split(/\s+/).filter(Boolean).length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Lines:</span>
              <span className="ml-1 font-medium">
                {(activeTab === 'A' ? promptA : promptB).split('\n').length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Est. Tokens:</span>
              <span className="ml-1 font-medium">
                {Math.ceil((activeTab === 'A' ? promptA : promptB).length / 4)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
