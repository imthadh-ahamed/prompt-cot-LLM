'use client';

import { useState } from 'react';
import { BarChart3, Clock, DollarSign, MessageSquare, Copy, Star } from 'lucide-react';
import { ExperimentResponse } from '@/types';
import { formatLatency, formatCost, formatTokens, getModelDisplayName, getProviderColor } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ResultsDisplayProps {
  experiment: ExperimentResponse;
}

export function ResultsDisplay({ experiment }: ResultsDisplayProps) {
  const [selectedResponse, setSelectedResponse] = useState(0);
  const [showRawData, setShowRawData] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You would typically show a toast here
  };

  const responses = experiment.responses.filter(r => !r.error);
  const errors = experiment.responses.filter(r => r.error);

  if (responses.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results</h3>
            <p className="text-gray-500">All requests failed. Please check your configuration and try again.</p>
            {errors.length > 0 && (
              <div className="mt-4 text-left max-w-md mx-auto">
                <h4 className="font-medium text-red-700 mb-2">Errors:</h4>
                {errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                    {error.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Experiment Results</h2>
            <span className="badge badge-primary">{responses.length} responses</span>
          </div>
        </div>
        
        <div className="card-content">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-sm text-gray-500">Avg Latency</div>
              <div className="text-xl font-semibold">
                {formatLatency(experiment.metrics.avg_latency_ms || 0)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-sm text-gray-500">Est. Cost</div>
              <div className="text-xl font-semibold">
                {formatCost(experiment.metrics.avg_cost_estimate || 0)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-sm text-gray-500">Avg Tokens</div>
              <div className="text-xl font-semibold">
                {formatTokens(experiment.metrics.avg_token_count || 0)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-xl font-semibold">
                {((experiment.metrics.success_rate || 0) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response Selector */}
      {responses.length > 1 && (
        <div className="card">
          <div className="card-content">
            <div className="flex flex-wrap gap-2">
              {responses.map((response, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedResponse(index)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    selectedResponse === index
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`badge ${getProviderColor(response.model_config.provider)} mr-2`}>
                    {response.model_config.provider}
                  </span>
                  {getModelDisplayName(response.model_config.provider, response.model_config.model_name)}
                  <span className="ml-2 text-xs text-gray-500">
                    Run {response.run_number}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Response Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Response Content */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Response</h3>
                <div className="flex items-center space-x-2">
                  <span className={`badge ${getProviderColor(responses[selectedResponse].model_config.provider)}`}>
                    {getModelDisplayName(
                      responses[selectedResponse].model_config.provider,
                      responses[selectedResponse].model_config.model_name
                    )}
                  </span>
                  <button
                    onClick={() => copyToClipboard(responses[selectedResponse].response)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Copy response"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card-content">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                  {responses[selectedResponse].response}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Panel */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Metrics</h3>
            </div>
            
            <div className="card-content space-y-4">
              {/* Performance Metrics */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Response Time:</span>
                    <span className="font-medium">
                      {formatLatency(responses[selectedResponse].metrics.latency_ms)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Token Count:</span>
                    <span className="font-medium">
                      {formatTokens(responses[selectedResponse].metrics.token_count)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cost Estimate:</span>
                    <span className="font-medium">
                      {formatCost(responses[selectedResponse].metrics.cost_estimate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality Metrics */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Quality</h4>
                <div className="space-y-2 text-sm">
                  {responses[selectedResponse].metrics.sentiment_score !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sentiment:</span>
                      <span className="font-medium">
                        {(responses[selectedResponse].metrics.sentiment_score! * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {responses[selectedResponse].metrics.readability_score !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Readability:</span>
                      <span className="font-medium">
                        {(responses[selectedResponse].metrics.readability_score! * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {responses[selectedResponse].metrics.coherence_score !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Coherence:</span>
                      <span className="font-medium">
                        {(responses[selectedResponse].metrics.coherence_score! * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Token Usage */}
              {responses[selectedResponse].token_usage && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Token Usage</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(responses[selectedResponse].token_usage).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-500 capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Raw Data Toggle */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Raw Data</h3>
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="btn-outline text-sm"
            >
              {showRawData ? 'Hide' : 'Show'} Raw Data
            </button>
          </div>
        </div>
        
        {showRawData && (
          <div className="card-content">
            <SyntaxHighlighter
              language="json"
              style={tomorrow}
              className="text-sm"
            >
              {JSON.stringify(experiment, null, 2)}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  );
}
