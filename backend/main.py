from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import uuid
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging
from contextlib import asynccontextmanager

from models import (
    PromptTemplate, ModelConfig, ExperimentRequest, ExperimentResponse,
    ExperimentResult, ABTestConfig, ABTestResult, MetricsData
)
from llm_service import LLMService
from data_service import DataService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

# Global services
llm_service = None
data_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    global llm_service, data_service
    
    # Startup
    logger.info("Starting up Prompt Engineering Playground API")
    
    # Initialize services
    llm_service = LLMService()
    data_service = DataService()
    
    # Create logs directory
    os.makedirs("logs", exist_ok=True)
    
    yield
    
    # Shutdown
    logger.info("Shutting down Prompt Engineering Playground API")

# Create FastAPI app
app = FastAPI(
    title="Prompt Engineering & Chain-of-Thought Playground",
    description="A comprehensive API for prompt engineering experiments with multiple LLM providers",
    version="1.0.0",
    lifespan=lifespan
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Simple authentication (extend for production use)."""
    # For demo purposes, we'll accept any valid-looking token
    # In production, implement proper JWT validation
    if credentials and credentials.credentials:
        return {"user_id": "demo_user"}
    return {"user_id": "anonymous"}

# API Routes

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and load balancers."""
    try:
        # Check database connection
        await data_service.get_experiment_count()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "ok",
                "llm_service": "ok"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Prompt Engineering & Chain-of-Thought Playground API",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "llm_service": llm_service is not None,
            "data_service": data_service is not None
        }
    }

# Experiment endpoints

@app.post("/api/experiments", response_model=ExperimentResponse)
@limiter.limit("10/minute")
async def run_experiment(
    request: Request,
    experiment_request: ExperimentRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """Run a prompt experiment with one or more model configurations."""
    try:
        experiment_id = str(uuid.uuid4())
        start_time = datetime.now()
        
        all_responses = []
        
        for model_config in experiment_request.model_configs:
            for run_num in range(experiment_request.num_runs):
                try:
                    # Generate response
                    response_data = await llm_service.generate_response(
                        experiment_request.prompt, model_config
                    )
                    
                    # Create experiment result
                    metrics_dict = response_data["metrics"].dict() if hasattr(response_data["metrics"], 'dict') else response_data["metrics"]
                    
                    experiment_result = ExperimentResult(
                        experiment_id=experiment_id,
                        prompt=experiment_request.prompt,
                        model_configuration=model_config,
                        response=response_data["response"],
                        metrics=metrics_dict,
                        timestamp=datetime.now(),
                        run_number=run_num + 1
                    )
                    
                    # Save experiment asynchronously
                    background_tasks.add_task(
                        save_experiment_background, experiment_result
                    )
                    
                    all_responses.append({
                        "model_config": model_config.dict(),
                        "response": response_data["response"],
                        "metrics": metrics_dict,
                        "token_usage": response_data.get("token_usage", {}),
                        "run_number": run_num + 1
                    })
                    
                except Exception as e:
                    logger.error(f"Error in experiment run: {str(e)}")
                    all_responses.append({
                        "model_config": model_config.dict(),
                        "error": str(e),
                        "run_number": run_num + 1
                    })
        
        # Calculate aggregate metrics
        successful_responses = [r for r in all_responses if "error" not in r]
        aggregate_metrics = calculate_aggregate_metrics(successful_responses)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        return ExperimentResponse(
            id=experiment_id,
            responses=all_responses,
            metrics=aggregate_metrics,
            timestamp=start_time,
            duration=duration
        )
        
    except Exception as e:
        logger.error(f"Error running experiment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def save_experiment_background(experiment_result: ExperimentResult):
    """Background task to save experiment result."""
    try:
        await asyncio.to_thread(data_service.save_experiment, experiment_result)
    except Exception as e:
        logger.error(f"Error saving experiment in background: {str(e)}")

def calculate_aggregate_metrics(responses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate aggregate metrics from multiple responses."""
    if not responses:
        return {}
    
    metrics_keys = ["response_length", "token_count", "latency_ms", "cost_estimate"]
    aggregates = {}
    
    for key in metrics_keys:
        values = [r["metrics"].get(key, 0) for r in responses if "metrics" in r]
        if values:
            aggregates[f"avg_{key}"] = sum(values) / len(values)
            aggregates[f"min_{key}"] = min(values)
            aggregates[f"max_{key}"] = max(values)
    
    aggregates["total_responses"] = len(responses)
    aggregates["success_rate"] = len(responses) / (len(responses) + sum(1 for r in responses if "error" in r))
    
    return aggregates

@app.get("/api/experiments", response_model=List[Dict[str, Any]])
async def get_experiments(
    limit: int = 100,
    offset: int = 0,
    model_provider: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Retrieve experiment history."""
    try:
        experiments = await asyncio.to_thread(
            data_service.get_experiments,
            limit=limit,
            offset=offset,
            model_provider=model_provider
        )
        return experiments
    except Exception as e:
        logger.error(f"Error retrieving experiments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/experiments/{experiment_id}/rating")
async def update_experiment_rating(
    experiment_id: str,
    rating: int,
    notes: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Update experiment rating and notes."""
    try:
        if not 1 <= rating <= 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        success = await asyncio.to_thread(
            data_service.update_experiment_rating,
            experiment_id, rating, notes
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        return {"message": "Rating updated successfully"}
    except Exception as e:
        logger.error(f"Error updating rating: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Template endpoints

@app.post("/api/templates", response_model=str)
async def create_template(
    template: PromptTemplate,
    user: dict = Depends(get_current_user)
):
    """Create or update a prompt template."""
    try:
        template_id = await asyncio.to_thread(data_service.save_template, template)
        return template_id
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/templates", response_model=List[PromptTemplate])
async def get_templates(
    category: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Retrieve prompt templates."""
    try:
        templates = await asyncio.to_thread(data_service.get_templates, category)
        return templates
    except Exception as e:
        logger.error(f"Error retrieving templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/templates/{template_id}")
async def delete_template(
    template_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a prompt template."""
    try:
        success = await asyncio.to_thread(data_service.delete_template, template_id)
        if not success:
            raise HTTPException(status_code=404, detail="Template not found")
        return {"message": "Template deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics endpoints

@app.get("/api/analytics/dashboard")
async def get_dashboard_data(user: dict = Depends(get_current_user)):
    """Get dashboard analytics data."""
    try:
        stats = await asyncio.to_thread(data_service.get_experiment_statistics)
        return stats
    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/export")
async def export_experiments(
    format: str = "csv",
    model_provider: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Export experiment data."""
    try:
        df = await data_service.get_experiments_dataframe(model_provider=model_provider)
        
        if format.lower() == "csv":
            return {
                "data": df.to_csv(index=False),
                "content_type": "text/csv",
                "filename": f"experiments_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        elif format.lower() == "json":
            return {
                "data": df.to_json(orient="records", date_format="iso"),
                "content_type": "application/json",
                "filename": f"experiments_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            }
        else:
            raise HTTPException(status_code=400, detail="Unsupported format")
            
    except Exception as e:
        logger.error(f"Error exporting data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# A/B Testing endpoints

@app.post("/api/ab-tests")
async def create_ab_test(
    config: ABTestConfig,
    user: dict = Depends(get_current_user)
):
    """Create a new A/B test configuration."""
    try:
        # Implement A/B test creation logic
        test_id = str(uuid.uuid4())
        # In a real implementation, you'd save this to the database
        return {"test_id": test_id, "message": "A/B test created successfully"}
    except Exception as e:
        logger.error(f"Error creating A/B test: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ab-tests/{test_id}/run")
async def run_ab_test(
    test_id: str,
    prompt: str,
    num_samples: int = 10,
    user: dict = Depends(get_current_user)
):
    """Run an A/B test with the specified configuration."""
    try:
        # Implement A/B test execution logic
        # This would involve running experiments with both variants
        # and collecting statistical results
        return {"message": "A/B test completed", "test_id": test_id}
    except Exception as e:
        logger.error(f"Error running A/B test: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Run the application
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=True,
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )
