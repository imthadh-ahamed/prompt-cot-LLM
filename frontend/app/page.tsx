'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PromptEditor } from '@/components/prompt/PromptEditor';
import { ModelSelector } from '@/components/model/ModelSelector';
import { ResultsDisplay } from '@/components/results/ResultsDisplay';
import { ExperimentHistory } from '@/components/history/ExperimentHistory';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ExperimentRequest, ExperimentResponse, ModelConfig } from '@/types';
import { experimentApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'experiment' | 'history' | 'dashboard'>('experiment');
  const [isLoading, setIsLoading] = useState(false);
  const [currentExperiment, setCurrentExperiment] = useState<ExperimentResponse | null>(null);
  
  // Experiment state
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([
    {
      provider: 'openai',
      model_name: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000,
    }
  ]);
  const [enableABTesting, setEnableABTesting] = useState(false);
  const [numRuns, setNumRuns] = useState(1);

  const handleRunExperiment = async () => {
    if (!promptA.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setCurrentExperiment(null);

    try {
      const requests: ExperimentRequest[] = [];
      
      // Create request for Prompt A
      requests.push({
        prompt: promptA,
        model_configs: selectedModels,
        num_runs: numRuns,
        enable_ab_testing: enableABTesting && promptB.trim() !== '',
      });

      // Create request for Prompt B if A/B testing is enabled
      if (enableABTesting && promptB.trim()) {
        requests.push({
          prompt: promptB,
          model_configs: selectedModels,
          num_runs: numRuns,
          enable_ab_testing: true,
        });
      }

      // Run the first experiment (and potentially the second for A/B testing)
      const result = await experimentApi.runExperiment(requests[0]);
      setCurrentExperiment(result);
      
      // Check if any responses indicate demo/fallback mode
      const hasApiErrors = result.responses.some(r => 
        r.response && (
          r.response.includes('API Quota/Auth Error') ||
          r.response.includes('Demo Mode') ||
          r.response.includes('Mock Response')
        )
      );
      
      if (hasApiErrors) {
        toast.success(
          'Experiment completed in demo mode! Some API quotas may be exceeded. Check your API keys and billing.',
          { duration: 6000 }
        );
      } else {
        toast.success('Experiment completed successfully!');
      }
    } catch (error: any) {
      console.error('Error running experiment:', error);
      
      // Parse error message for better user feedback
      let errorMessage = 'Failed to run experiment. Please try again.';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          if (detail.includes('quota') || detail.includes('429')) {
            errorMessage = 'API quota exceeded. The app will now run in demo mode. Please check your API billing and quotas.';
          } else if (detail.includes('authentication') || detail.includes('401')) {
            errorMessage = 'API authentication failed. Please check your API keys in the backend configuration.';
          } else {
            errorMessage = detail;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 8000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'experiment', label: 'Experiment', icon: '🧪' },
              { id: 'history', label: 'History', icon: '📊' },
              { id: 'dashboard', label: 'Dashboard', icon: '📈' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'experiment' && (
          <div className="space-y-8">
            {/* Configuration Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Prompt Editor */}
              <div className="lg:col-span-2">
                <PromptEditor
                  promptA={promptA}
                  promptB={promptB}
                  onPromptAChange={setPromptA}
                  onPromptBChange={setPromptB}
                  enableABTesting={enableABTesting}
                  onEnableABTestingChange={setEnableABTesting}
                />
              </div>

              {/* Model Configuration */}
              <div>
                <ModelSelector
                  selectedModels={selectedModels}
                  onModelsChange={setSelectedModels}
                  numRuns={numRuns}
                  onNumRunsChange={setNumRuns}
                />
                
                {/* Run Button */}
                <div className="mt-6">
                  <button
                    onClick={handleRunExperiment}
                    disabled={isLoading || !promptA.trim()}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Running Experiment...
                      </div>
                    ) : (
                      'Run Experiment'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            {currentExperiment && (
              <ResultsDisplay experiment={currentExperiment} />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <ExperimentHistory />
        )}

        {activeTab === 'dashboard' && (
          <DashboardStats />
        )}
      </div>
    </div>
  );
}
