# Prompt Engineering & Chain-of-Thought Playground

A full-stack application for experimenting with prompt engineering techniques, chain-of-thought reasoning, and A/B testing across multiple LLM providers.

## Features

### Core Functionality
- **Prompt Editor**: Multi-tab interface for crafting and refining prompts
- **Template Library**: Pre-built templates for zero-shot, one-shot, few-shot, and chain-of-thought prompting
- **Model Selection**: Support for OpenAI GPT-4, Anthropic Claude, and Hugging Face models
- **A/B Testing**: Compare different prompts, models, and parameters side-by-side
- **Metrics & Analytics**: Track response length, token usage, latency, and self-consistency scores
- **Experiment History**: Comprehensive logging with search, filter, and export capabilities

### Technical Features
- **Real-time Results**: Async processing with live updates
- **Rate Limiting**: Configurable API rate limits to prevent abuse
- **Export Options**: CSV/JSON export for analysis
- **Responsive UI**: Modern, developer-friendly interface built with Tailwind CSS
- **Error Handling**: Comprehensive error handling and user feedback
- **Demo Mode**: Automatic fallback when API quotas are exceeded

## Screenshots

### Main Interface
![Main Dashboard](https://raw.githubusercontent.com/imthadh-ahamed/prompt-cot/main/Assets/Screenshot%202025-07-12%20101044.png)
*The main application interface showing the experiment tab with prompt editor and model configuration*

### Experiment Workflow
![Experiment Tab](https://raw.githubusercontent.com/imthadh-ahamed/prompt-cot/main/Assets/Screenshot%202025-07-12%20101056.png)
*Prompt editor with model selection and parameter controls*

### Results Display
![Results View](https://raw.githubusercontent.com/imthadh-ahamed/prompt-cot/main/Assets/Screenshot%202025-07-12%20101113.png)
*Response cards showing generated outputs with comprehensive metrics*

### Analytics Dashboard
![Analytics](https://raw.githubusercontent.com/imthadh-ahamed/prompt-cot/main/Assets/Screenshot%202025-07-12%20101433.png)
*Performance metrics and insights across all experiments*

### Experiment History
![History Tab](https://raw.githubusercontent.com/imthadh-ahamed/prompt-cot/main/Assets/Screenshot%202025-07-12%20101130.png)
*Searchable and filterable log of all past experiments*

## Architecture

### Backend (Python FastAPI)
- **FastAPI**: High-performance async web framework
- **SQLite**: Local database for experiment logging
- **Pandas**: Data analysis and export functionality
- **Multiple LLM Providers**: OpenAI, Anthropic, Hugging Face integration
- **Background Tasks**: Async experiment logging and processing

### Frontend (Next.js)
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching and caching
- **Shadcn/ui**: Modern UI components

## Quick Start

### Live Demo
Visit the application at:
- **Frontend**: `http://localhost:3000` (when running locally)
- **Backend API**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`

### UI Preview
Once running, you'll see:
1. **Clean Dashboard**: Modern interface with tabbed navigation
2. **Prompt Editor**: Large text area for crafting prompts
3. **Model Selector**: Choose between OpenAI, Anthropic, and Hugging Face
4. **Real-time Results**: Instant feedback with comprehensive metrics
5. **Demo Mode**: Automatic fallback when API quotas are exceeded

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd prompt-cot
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```env
# LLM API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Database
DATABASE_URL=sqlite:///./experiments.db

# Server Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
API_HOST=0.0.0.0
API_PORT=8000

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=60
```

#### Start the Backend
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Environment Configuration
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Start the Frontend
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage Guide

### Visual Workflow

```
1. Enter Prompt → 2. Select Model → 3. Configure → 4. Run → 5. Analyze
   ┌─────────┐      ┌─────────┐     ┌─────────┐   ┌─────┐   ┌─────────┐
   │ 📝 Type │      │ 🤖 Pick │     │ ⚙️ Set  │   │ ▶️  │   │ 📊 View │
   │ your    │  →   │ OpenAI, │  →  │ temp,   │ → │ Run │ → │ results │
   │ prompt  │      │ Claude, │     │ tokens  │   │     │   │ metrics │
   │ here    │      │ or HF   │     │ etc.    │   │     │   │ & data  │
   └─────────┘      └─────────┘     └─────────┘   └─────┘   └─────────┘
```

### Basic Workflow

1. **Create a Prompt**: Use the prompt editor to craft your prompt
2. **Select Model**: Choose your preferred LLM provider and model
3. **Configure Parameters**: Set temperature, max tokens, etc.
4. **Run Experiment**: Execute and view results with metrics
5. **Compare Results**: Use A/B testing to compare different approaches
6. **Analyze History**: Review past experiments and export data

### Prompt Templates

The application includes several built-in templates:

- **Zero-shot**: Direct question without examples
- **One-shot**: Single example provided
- **Few-shot**: Multiple examples for pattern learning
- **Chain-of-Thought**: Step-by-step reasoning prompts
- **Custom**: Create your own templates

### A/B Testing

1. Create two or more prompt variants
2. Select different models or parameters
3. Run experiments simultaneously
4. Compare metrics and outputs
5. Identify the best-performing approach

### Analytics Dashboard

Track key metrics across all experiments:
- Success rates by model
- Average response times
- Token usage patterns
- Cost analysis
- Quality scores

## API Reference

### Endpoints

#### Experiments
- `POST /api/experiments/run` - Run a single experiment
- `GET /api/experiments/history` - Get experiment history
- `DELETE /api/experiments/{id}` - Delete an experiment

#### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create a new template
- `PUT /api/templates/{id}` - Update a template
- `DELETE /api/templates/{id}` - Delete a template

#### A/B Testing
- `POST /api/ab-tests/run` - Run A/B test
- `GET /api/ab-tests/{id}/results` - Get A/B test results

#### Analytics
- `GET /api/analytics/summary` - Get analytics summary
- `GET /api/analytics/export` - Export data

### Response Format

All API responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Development

### Backend Development

#### Project Structure
```
backend/
├── main.py              # FastAPI application
├── models.py            # Pydantic models
├── llm_service.py       # LLM provider integrations
├── data_service.py      # Database and analytics
├── requirements.txt     # Python dependencies
└── .env.example        # Environment template
```

#### Adding New LLM Providers

1. Add provider configuration to `models.py`
2. Implement provider client in `llm_service.py`
3. Update model selector options

#### Database Schema

The application uses SQLite with the following tables:
- `experiments`: Experiment records and results
- `templates`: Prompt templates
- `ab_tests`: A/B test configurations and results

### Frontend Development

#### Project Structure
```
frontend/
├── app/                 # Next.js App Router
├── components/          # React components
├── lib/                # Utilities and API client
├── types/              # TypeScript definitions
└── package.json        # Node.js dependencies
```

#### Key Components

- **PromptEditor**: Multi-tab prompt editing interface with syntax highlighting
- **ModelSelector**: Model and parameter configuration with live validation
- **ResultsDisplay**: Output and metrics visualization with export options
- **ExperimentHistory**: Data table with filtering, search, and pagination
- **DashboardStats**: Analytics dashboard with charts and insights
- **ToastNotifications**: Contextual feedback system
- **LoadingStates**: Smooth progress indicators and skeleton screens

#### UI Component Architecture

```
App Layout
├── Header (Navigation & Branding)
├── TabNavigation (Experiment | History | Dashboard)
├── MainContent
│   ├── ExperimentTab
│   │   ├── PromptEditor (A/B toggle, templates)
│   │   ├── ModelSelector (provider, model, params)
│   │   ├── RunControls (num runs, execute button)
│   │   └── ResultsDisplay (responses, metrics, export)
│   ├── HistoryTab
│   │   ├── SearchBar & Filters
│   │   ├── ExperimentTable (sortable, expandable)
│   │   └── BulkActions (select, export, delete)
│   └── DashboardTab
│       ├── StatsOverview (success rates, costs)
│       ├── PerformanceCharts (latency, tokens)
│       └── ModelComparison (side-by-side stats)
└── Footer (Status indicators, version info)
```
## Deployment

### Using Docker (Recommended)

Create a `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./experiments.db
    volumes:
      - ./data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
```

### Manual Deployment

#### Backend (Production)
```bash
cd backend
pip install -r requirements.txt
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend (Production)
```bash
cd frontend
npm run build
npm start
```

## Configuration

### Environment Variables

#### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `ANTHROPIC_API_KEY` | Anthropic API key | Optional |
| `HUGGINGFACE_API_KEY` | Hugging Face API key | Optional |
| `DATABASE_URL` | SQLite database path | `sqlite:///./experiments.db` |
| `CORS_ORIGINS` | Allowed origins | `http://localhost:3000` |
| `RATE_LIMIT_REQUESTS` | Requests per period | `100` |
| `RATE_LIMIT_PERIOD` | Rate limit period (seconds) | `60` |

#### Frontend (.env.local)
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

### Testing

#### Backend Tests
```bash
cd backend
pytest tests/
```

#### Frontend Tests
```bash
cd frontend
npm test
```

## Roadmap

### Upcoming Features
- [ ] User authentication and multi-tenancy
- [ ] Advanced prompt optimization algorithms
- [ ] Integration with more LLM providers
- [ ] Real-time collaboration features
- [ ] Advanced analytics and reporting
- [ ] Plugin system for custom extensions