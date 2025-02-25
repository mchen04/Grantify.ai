# Grantify.ai

Grantify.ai is an AI-powered grant matching platform that helps users find relevant grants based on their preferences and interests.

## Overview

Grantify.ai extracts grant data daily from Grants.gov, uses AI to categorize grants, and provides personalized recommendations to users. The platform allows users to save, apply for, and ignore grants, learning from these interactions to improve future recommendations.

## Features

- Daily data extraction from Grants.gov XML Extract
- AI-based grant categorization using Gemini API / DeepSeek
- Hybrid search system (AI-driven personalized results + keyword-based filtering)
- Per-user learning to refine recommendations
- Responsive, modern UI

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
   - Create `.env` in the backend directory

5. Start the development servers
   - Frontend: `npm run dev` in the frontend directory
   - Backend: `npm run dev` in the backend directory

## Documentation

For more detailed information, see the documentation in the `docs/` directory:

- [Implementation Plan](docs/implementation-plan.md)
- [Technical Architecture](docs/technical-architecture.md)
- [Development Roadmap](docs/development-roadmap.md)
- [AI Integration Strategy](docs/ai-integration-strategy.md)
- [Data Pipeline Architecture](docs/data-pipeline-architecture.md)

## License

[MIT](LICENSE)