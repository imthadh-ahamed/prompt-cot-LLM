export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'huggingface';
  model_name: string;
  temperature: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface PromptTemplate {
  id?: string;
  name: string;
  description: string;
  template: string;
  category: 'zero-shot' | 'one-shot' | 'few-shot' | 'chain-of-thought';
  variables: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ExperimentRequest {
  prompt: string;
  model_configs: ModelConfig[];
  template_id?: string;
  variables?: Record<string, any>;
  num_runs: number;
  enable_ab_testing: boolean;
}

export interface MetricsData {
  response_length: number;
  token_count: number;
  latency_ms: number;
  cost_estimate: number;
  sentiment_score?: number;
  readability_score?: number;
  coherence_score?: number;
}

export interface ExperimentResponse {
  id: string;
  responses: Array<{
    model_config: ModelConfig;
    response: string;
    metrics: MetricsData;
    token_usage: Record<string, number>;
    run_number: number;
    error?: string;
  }>;
  metrics: Record<string, any>;
  timestamp: string;
  duration: number;
}

export interface ExperimentLog {
  id: string;
  experiment_id: string;
  prompt: string;
  model_provider: string;
  model_name: string;
  response: string;
  metrics: MetricsData;
  timestamp: string;
  user_rating?: number;
  notes?: string;
}

export interface DashboardStats {
  total_experiments: number;
  provider_stats: Record<string, number>;
  average_rating: number;
  recent_activity: number;
}

export interface ABTestConfig {
  variant_a: ModelConfig;
  variant_b: ModelConfig;
  traffic_split: number;
  success_metric: 'latency' | 'response_length' | 'user_rating' | 'cost';
}
