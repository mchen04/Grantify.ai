# Grantify.ai

Grantify.ai is an AI-powered grant matching platform that helps users find relevant grants based on their preferences and interests.

## Overview

Grantify.ai extracts grant data daily from Grants.gov, uses AI to categorize grants, and provides personalized recommendations to users. The platform allows users to save, apply for, and ignore grants, learning from these interactions to improve future recommendations.

## Features

- Daily data extraction from Grants.gov XML Extract at 5 AM EST
- AI-based grant categorization using Gemini API / DeepSeek
- Hybrid search system (AI-driven personalized results + keyword-based filtering)
- Per-user learning to refine recommendations
- Responsive, modern UI
- Active grants only - automatically filters out expired opportunities

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **AI**: Gemini API / DeepSeek
- **Authentication**: Supabase Auth

## Project Structure

```
root/
├─ frontend/       # Next.js application
├─ backend/        # Node.js API server
│  ├─ data/        # Downloaded grant data (not committed to Git)
│  ├─ scripts/     # Utility scripts for data pipeline
│  └─ src/         # Source code
├─ docs/           # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Supabase account
- Gemini API / DeepSeek API key

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/grantify-ai.git
   cd grantify-ai
   ```

2. Install frontend dependencies
   ```
   cd frontend
   npm install
   ```

3. Install backend dependencies
   ```
   cd ../backend
   npm install
   ```

4. Set up environment variables
   - Create `.env.local` in the frontend directory
   - Create `.env` in the backend directory with the following:
     ```
     PORT=3001
     NODE_ENV=development
     SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_KEY=your_supabase_service_key
     ENABLE_CRON_JOBS=true
     GEMINI_API_KEY=your_gemini_api_key
     ```

5. Start the development servers
   - Frontend: `npm run dev` in the frontend directory
   - Backend: `npm run dev` in the backend directory

## Data Pipeline

The data pipeline automatically fetches grant data from Grants.gov, processes it, and stores it in the Supabase database. The system supports multiple AI processing pipelines to accommodate different needs.

### AI Processing Pipelines

1. **OpenRouter Pipeline** - Uses OpenRouter API with Mistral model for text cleaning
2. **Gemini Pipeline** - Uses Google's Gemini 2.0 Flash Lite model with rate limiting and caching
3. **No-AI Pipeline** - Uses basic text cleaning without AI for faster processing

### Running the Data Pipeline

1. Update the database schema (one-time setup):
   ```sql
   ALTER TABLE grants ALTER COLUMN total_funding TYPE bigint;
   ALTER TABLE grants ALTER COLUMN award_ceiling TYPE bigint;
   ALTER TABLE grants ALTER COLUMN award_floor TYPE bigint;
   CREATE INDEX IF NOT EXISTS grants_opportunity_id_idx ON grants(opportunity_id);
   ```

2. Clear existing grants (if needed):
   ```
   cd backend
   npm run clear-grants
   ```

3. Download and process grants:
   ```
   cd backend
   npm run update-grants-live
   ```

### Available Scripts

- `npm run update-grants`: Run the pipeline with mock data (for testing)
- `npm run update-grants-live`: Run the pipeline with real data from Grants.gov using OpenRouter
- `npm run update-grants-gemini`: Run the pipeline with real data using Gemini API
- `npm run update-grants-no-ai`: Run the pipeline with real data without AI processing
- `npm run clear-grants`: Clear all grants from the database
- `npm run update-schema`: Update the database schema (requires manual SQL execution)
- `npm run cleanup-expired`: Remove grants with past deadlines from the database
- `npm run apply-migration`: Apply database migrations

### Active Grants Only

The system is designed to work with active grants only:

1. **During Import**: The data pipeline filters out grants with past deadlines during the import process
2. **In the Frontend**: The search and dashboard pages only show grants with future deadlines
3. **Maintenance**: You can run `npm run cleanup-expired` to remove any expired grants from the database

This ensures users only see relevant, actionable grant opportunities.

## Deployment

For deployment instructions, see:
- [Vercel Deployment Guide](docs/vercel-deployment.md) - For deploying the frontend
- [Backend Deployment](docs/vercel-deployment.md#deploy-backend-separately) - For deploying the backend API

## Documentation

For more detailed information, see the documentation in the `docs/` directory:

- [Implementation Plan](docs/implementation-plan.md)
- [Technical Architecture](docs/technical-architecture.md)
- [Development Roadmap](docs/development-roadmap.md)
- [AI Integration Strategy](docs/ai-integration-strategy.md)
- [Data Pipeline Architecture](docs/data-pipeline-architecture.md)
- [Supabase Setup](docs/supabase-setup.md)
- [Vercel Deployment](docs/vercel-deployment.md)

## License

[MIT](LICENSE)