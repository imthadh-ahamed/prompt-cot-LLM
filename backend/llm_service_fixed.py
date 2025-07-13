import os
import asyncio
import time
from typing import Dict, Any, List
import openai
import anthropic
from transformers import pipeline
import httpx
from models import ModelConfig, ModelProvider, MetricsData
import logging
import random

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        self.hf_pipeline = None
        self.demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize LLM clients with proper error handling and authentication."""
        if self.demo_mode:
            logger.info("Demo mode enabled - using mock responses")
            return
            
        try:
            # OpenAI Client
            openai_key = os.getenv("OPENAI_API_KEY")
            if openai_key and openai_key != "your_openai_api_key_here":
                self.openai_client = openai.AsyncOpenAI(api_key=openai_key)
                logger.info("OpenAI client initialized successfully")
            else:
                logger.warning("OpenAI API key not found or using placeholder")
            
            # Anthropic Client
            anthropic_key = os.getenv("ANTHROPIC_API_KEY")
            if anthropic_key and anthropic_key != "your_anthropic_api_key_here":
                self.anthropic_client = anthropic.AsyncAnthropic(api_key=anthropic_key)
                logger.info("Anthropic client initialized successfully")
            else:
                logger.warning("Anthropic API key not found or using placeholder")
                
        except Exception as e:
            logger.error(f"Error initializing LLM clients: {str(e)}")
    
    async def generate_response(self, prompt: str, model_config: ModelConfig) -> Dict[str, Any]:
        """Generate response from specified LLM provider with metrics tracking."""
        start_time = time.time()
        
        # Demo mode - return mock responses
        if self.demo_mode:
            return await self._generate_demo_response(prompt, model_config, start_time)
        
        try:
            if model_config.provider == ModelProvider.OPENAI:
                result = await self._generate_openai_response(prompt, model_config)
            elif model_config.provider == ModelProvider.ANTHROPIC:
                result = await self._generate_anthropic_response(prompt, model_config)
            elif model_config.provider == ModelProvider.HUGGINGFACE:
                result = await self._generate_huggingface_response(prompt, model_config)
            else:
                raise ValueError(f"Unsupported provider: {model_config.provider}")
            
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            
            # Calculate metrics
            metrics = self._calculate_metrics(result["response"], latency_ms, model_config)
            
            return {
                "response": result["response"],
                "token_usage": result.get("token_usage", {}),
                "metrics": metrics,
                "model_config": model_config.dict()
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            
            # Check if it's a quota/rate limit error and fall back to demo mode
            error_message = str(e).lower()
            if any(keyword in error_message for keyword in ['quota', 'rate limit', '429', 'insufficient_quota', 'exceeded']):
                logger.warning("Quota/rate limit error detected, falling back to demo mode")
                return await self._generate_demo_response(prompt, model_config, start_time)
            
            # Check if it's an authentication error and fall back to demo mode
            if any(keyword in error_message for keyword in ['authentication', 'api key', 'unauthorized', '401']):
                logger.warning("Authentication error detected, falling back to demo mode")
                return await self._generate_demo_response(prompt, model_config, start_time)
            
            raise
    
    async def _generate_openai_response(self, prompt: str, model_config: ModelConfig) -> Dict[str, Any]:
        """Generate response using OpenAI API."""
        if not self.openai_client:
            raise ValueError("OpenAI client not initialized")
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=model_config.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=model_config.temperature,
                max_tokens=model_config.max_tokens,
                top_p=model_config.top_p,
                frequency_penalty=model_config.frequency_penalty,
                presence_penalty=model_config.presence_penalty
            )
            
            return {
                "response": response.choices[0].message.content,
                "token_usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise
    
    async def _generate_anthropic_response(self, prompt: str, model_config: ModelConfig) -> Dict[str, Any]:
        """Generate response using Anthropic API."""
        if not self.anthropic_client:
            raise ValueError("Anthropic client not initialized")
        
        try:
            response = await self.anthropic_client.messages.create(
                model=model_config.model_name,
                max_tokens=model_config.max_tokens or 1000,
                temperature=model_config.temperature,
                messages=[{"role": "user", "content": prompt}]
            )
            
            return {
                "response": response.content[0].text,
                "token_usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                }
            }
        except Exception as e:
            logger.error(f"Anthropic API error: {str(e)}")
            raise
    
    async def _generate_huggingface_response(self, prompt: str, model_config: ModelConfig) -> Dict[str, Any]:
        """Generate response using Hugging Face models."""
        try:
            # For demo purposes, using a lightweight model
            # In production, you might want to use the Hugging Face API instead
            if not self.hf_pipeline:
                self.hf_pipeline = pipeline(
                    "text-generation",
                    model="gpt2",
                    max_length=min(model_config.max_tokens or 100, 200),
                    temperature=model_config.temperature
                )
            
            # Run in executor to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, lambda: self.hf_pipeline(prompt, max_length=200, num_return_sequences=1)
            )
            
            response_text = result[0]["generated_text"]
            
            return {
                "response": response_text,
                "token_usage": {
                    "estimated_tokens": len(response_text.split())
                }
            }
        except Exception as e:
            logger.error(f"Hugging Face error: {str(e)}")
            raise
    
    async def _generate_demo_response(self, prompt: str, model_config: ModelConfig, start_time: float) -> Dict[str, Any]:
        """Generate mock response for demo mode."""
        # Simulate processing time
        await asyncio.sleep(random.uniform(0.5, 2.0))
        
        # Check if we're in explicit demo mode or fallback mode
        is_fallback_mode = not self.demo_mode
        
        # Demo responses based on provider
        demo_responses = {
            ModelProvider.OPENAI: [
                "🔧 **Demo Mode Response** - This simulates OpenAI's GPT response. In production, this would be generated by the actual OpenAI API with full language model capabilities.",
                "📱 **Mock Response** - This demonstrates how OpenAI's models would respond to your prompt. The real implementation connects to OpenAI's API for authentic AI-generated content.",
                "⚡ **Playground Demo** - This sample response shows the expected output format from OpenAI's language models. Actual deployment uses live API connections."
            ],
            ModelProvider.ANTHROPIC: [
                "🔧 **Demo Mode Response** - This simulates Claude's response style. In production, Anthropic's AI assistant would provide thoughtful, nuanced responses with strong reasoning capabilities.",
                "📱 **Mock Response** - This demonstrates Claude's approach to helpful, harmless, and honest responses. Real deployment connects to Anthropic's API.",
                "⚡ **Playground Demo** - This sample shows how Claude typically structures detailed, ethical responses. Actual implementation uses live Anthropic API."
            ],
            ModelProvider.HUGGINGFACE: [
                "🔧 **Demo Mode Response** - This simulates output from Hugging Face models. Production deployment would use actual open-source transformer models from the Hub.",
                "📱 **Mock Response** - This demonstrates the variety of responses possible with Hugging Face's ecosystem of community models.",
                "⚡ **Playground Demo** - This sample shows typical output from open-source language models. Real implementation connects to Hugging Face inference."
            ]
        }
        
        # Select a random demo response
        responses = demo_responses.get(model_config.provider, ["🔧 **Demo Mode** - Mock response for testing purposes."])
        response_text = random.choice(responses)
        
        # Add fallback mode warning if applicable
        if is_fallback_mode:
            response_text = f"⚠️ **API Quota/Auth Error - Fallback Mode Active**\n\n{response_text}\n\n*Note: This demo response was triggered due to API quota limits or authentication issues. Please check your API keys and quota status.*"
        
        # Add some variation based on the prompt
        if "question" in prompt.lower() or "?" in prompt:
            response_text += f"\n\n💡 *Your prompt: '{prompt[:100]}{'...' if len(prompt) > 100 else ''}' - This showcases the interactive nature of the prompt engineering playground.*"
        
        # Calculate processing time
        latency = (time.time() - start_time) * 1000
        
        # Generate mock metrics
        word_count = len(response_text.split())
        token_count = int(word_count * 1.3)  # Rough token estimation
        
        metrics = MetricsData(
            response_length=len(response_text),
            token_count=token_count,
            latency_ms=latency,
            cost_estimate=random.uniform(0.0001, 0.001),  # Mock cost
            sentiment_score=random.uniform(0.3, 0.8),
            readability_score=random.uniform(0.6, 0.9)
        )
        
        return {
            "response": response_text,
            "metrics": metrics,
            "token_usage": {
                "prompt_tokens": len(prompt.split()) * 1.3,
                "completion_tokens": token_count,
                "total_tokens": len(prompt.split()) * 1.3 + token_count
            },
            "model_info": {
                "provider": model_config.provider.value,
                "model": model_config.model_name,
                "demo_mode": True
            }
        }
    
    def _calculate_metrics(self, response: str, latency_ms: float, model_config: ModelConfig) -> MetricsData:
        """Calculate response metrics."""
        try:
            # Basic metrics
            response_length = len(response)
            token_count = len(response.split())
            
            # Cost estimation (simplified)
            cost_estimate = self._estimate_cost(token_count, model_config)
            
            # Advanced metrics (simplified implementations)
            sentiment_score = self._calculate_sentiment(response)
            readability_score = self._calculate_readability(response)
            coherence_score = self._calculate_coherence(response)
            
            return MetricsData(
                response_length=response_length,
                token_count=token_count,
                latency_ms=latency_ms,
                cost_estimate=cost_estimate,
                sentiment_score=sentiment_score,
                readability_score=readability_score,
                coherence_score=coherence_score
            )
        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}")
            # Return basic metrics on error
            return MetricsData(
                response_length=len(response),
                token_count=len(response.split()),
                latency_ms=latency_ms,
                cost_estimate=0.0
            )
    
    def _estimate_cost(self, token_count: int, model_config: ModelConfig) -> float:
        """Estimate API cost based on token count and model."""
        # Simplified cost estimation
        cost_per_1k_tokens = {
            "gpt-4": 0.03,
            "gpt-3.5-turbo": 0.002,
            "claude-3-opus": 0.015,
            "claude-3-sonnet": 0.003,
        }
        
        rate = cost_per_1k_tokens.get(model_config.model_name, 0.001)
        return (token_count / 1000) * rate
    
    def _calculate_sentiment(self, text: str) -> float:
        """Calculate sentiment score (simplified)."""
        # In a real implementation, you'd use a proper sentiment analysis model
        positive_words = ["good", "great", "excellent", "amazing", "wonderful", "fantastic"]
        negative_words = ["bad", "terrible", "awful", "horrible", "poor", "disappointing"]
        
        words = text.lower().split()
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        if positive_count + negative_count == 0:
            return 0.0
        
        return (positive_count - negative_count) / (positive_count + negative_count)
    
    def _calculate_readability(self, text: str) -> float:
        """Calculate readability score (simplified Flesch Reading Ease)."""
        import re
        
        sentences = len(re.split(r'[.!?]+', text))
        words = len(text.split())
        syllables = sum(self._count_syllables(word) for word in text.split())
        
        if sentences == 0 or words == 0:
            return 0.0
        
        # Simplified Flesch Reading Ease formula
        score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words))
        return max(0.0, min(100.0, score)) / 100.0  # Normalize to 0-1
    
    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word (simplified)."""
        word = word.lower()
        vowels = "aeiouy"
        syllable_count = 0
        previous_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not previous_was_vowel:
                syllable_count += 1
            previous_was_vowel = is_vowel
        
        # Handle silent e
        if word.endswith('e'):
            syllable_count -= 1
        
        return max(1, syllable_count)
    
    def _calculate_coherence(self, text: str) -> float:
        """Calculate coherence score (simplified)."""
        sentences = text.split('.')
        if len(sentences) < 2:
            return 1.0
        
        # Simple coherence metric based on sentence length consistency
        lengths = [len(sentence.split()) for sentence in sentences if sentence.strip()]
        if not lengths:
            return 0.0
        
        avg_length = sum(lengths) / len(lengths)
        variance = sum((length - avg_length) ** 2 for length in lengths) / len(lengths)
        
        # Lower variance indicates better coherence
        coherence = 1.0 / (1.0 + variance / max(avg_length, 1))
        return coherence
