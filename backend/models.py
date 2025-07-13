from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum

class PromptTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    template: str
    category: Literal["zero-shot", "one-shot", "few-shot", "chain-of-thought"]
    variables: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ModelProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    HUGGINGFACE = "huggingface"

class ModelConfig(BaseModel):
    provider: ModelProvider
    model_name: str
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=1000, ge=1, le=4000)
    top_p: Optional[float] = Field(default=1.0, ge=0.0, le=1.0)
    frequency_penalty: Optional[float] = Field(default=0.0, ge=-2.0, le=2.0)
    presence_penalty: Optional[float] = Field(default=0.0, ge=-2.0, le=2.0)

class ExperimentRequest(BaseModel):
    prompt: str
    model_configs: List[ModelConfig]
    template_id: Optional[str] = None
    variables: Optional[Dict[str, Any]] = {}
    num_runs: int = Field(default=1, ge=1, le=10)
    enable_ab_testing: bool = False

class ExperimentResponse(BaseModel):
    id: str
    responses: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    timestamp: datetime
    duration: float

class ExperimentResult(BaseModel):
    experiment_id: str
    prompt: str
    model_configuration: ModelConfig
    response: str
    metrics: Dict[str, Any]
    timestamp: datetime
    run_number: int

class MetricsData(BaseModel):
    response_length: int
    token_count: int
    latency_ms: float
    cost_estimate: float
    sentiment_score: Optional[float] = None
    readability_score: Optional[float] = None
    coherence_score: Optional[float] = None

class ExperimentLog(BaseModel):
    id: str
    experiment_id: str
    prompt: str
    model_provider: str
    model_name: str
    response: str
    metrics: MetricsData
    timestamp: datetime
    user_rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None

class ABTestConfig(BaseModel):
    variant_a: ModelConfig
    variant_b: ModelConfig
    traffic_split: float = Field(default=0.5, ge=0.0, le=1.0)
    success_metric: Literal["latency", "response_length", "user_rating", "cost"]

class ABTestResult(BaseModel):
    test_id: str
    variant_a_results: List[ExperimentResult]
    variant_b_results: List[ExperimentResult]
    statistical_significance: Dict[str, Any]
    winner: Optional[Literal["variant_a", "variant_b", "no_difference"]] = None
