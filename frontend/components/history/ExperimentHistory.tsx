'use client';

import { useState, useEffect } from 'react';
import { History, Search, Download, Star } from 'lucide-react';
import { ExperimentLog } from '@/types';
import { experimentApi } from '@/lib/api';
import { formatLatency, formatCost, getModelDisplayName, getProviderColor, truncateText } from '@/lib/utils';

export function ExperimentHistory() {
  const [experiments, setExperiments] = useState<ExperimentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('');

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      const data = await experimentApi.getExperiments({ limit: 50 });
      setExperiments(data);
    } catch (error) {
      console.error('Failed to load experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await experimentApi.exportExperiments('csv', filterProvider);
      // Create download
      const blob = new Blob([data.data], { type: data.content_type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = exp.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.response.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = !filterProvider || exp.model_provider === filterProvider;
    return matchesSearch && matchesProvider;
  });

  if (loading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="animate-pulse space-y-4">
            {['one', 'two', 'three', 'four', 'five'].map((key) => (
              <div key={key} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Experiment History</h2>
              <span className="badge badge-secondary">{filteredExperiments.length} experiments</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExport}
                className="btn-outline text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search prompts and responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="provider-select" className="sr-only">
                Filter by provider
              </label>
              <select
                id="provider-select"
                aria-label="Filter by provider"
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="input"
              >
                <option value="">All Providers</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="huggingface">Hugging Face</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Experiments List */}
      <div className="card">
        <div className="card-content">
          {filteredExperiments.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Experiments Found</h3>
              <p className="text-gray-500">
                {searchTerm || filterProvider ? 'No experiments match your filters.' : 'Run your first experiment to see results here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExperiments.map((experiment) => (
                <div key={experiment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`badge ${getProviderColor(experiment.model_provider)}`}>
                          {getModelDisplayName(experiment.model_provider, experiment.model_name)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(experiment.timestamp).toLocaleDateString()} at{' '}
                          {new Date(experiment.timestamp).toLocaleTimeString()}
                        </span>
                        {experiment.user_rating && (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">{experiment.user_rating}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Prompt */}
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Prompt:</h4>
                        <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                          {truncateText(experiment.prompt, 150)}
                        </p>
                      </div>
                      
                      {/* Response */}
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Response:</h4>
                        <p className="text-sm text-gray-700">
                          {truncateText(experiment.response, 200)}
                        </p>
                      </div>
                      
                      {/* Notes */}
                      {experiment.notes && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Notes:</h4>
                          <p className="text-sm text-gray-600 italic">
                            {experiment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Metrics */}
                    <div className="ml-4 text-right">
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-500">Latency:</span>{' '}
                          <span className="font-medium">{formatLatency(experiment.metrics.latency_ms)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Tokens:</span>{' '}
                          <span className="font-medium">{experiment.metrics.token_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cost:</span>{' '}
                          <span className="font-medium">{formatCost(experiment.metrics.cost_estimate)}</span>
                        </div>
                        {experiment.metrics.sentiment_score !== undefined && (
                          <div>
                            <span className="text-gray-500">Sentiment:</span>{' '}
                            <span className="font-medium">
                              {(experiment.metrics.sentiment_score * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
