# Getting Started with Grantify.ai Implementation

Based on our development roadmap, here's what should be implemented first:

## Phase 1: Project Setup and Infrastructure

### Step 1: Repository and Environment Setup
- Create Git repository
- Set up branch protection rules
- Create README.md with project overview
- Set up .gitignore file
- Configure ESLint and Prettier
- Set up GitHub Actions for CI/CD

### Step 2: Frontend Project Setup
- Initialize Next.js project with TypeScript
- Set up Tailwind CSS
- Configure folder structure
- Set up basic components (Layout, Navbar, Footer)
- Create placeholder pages
- Set up routing

### Step 3: Backend Project Setup
- Initialize Node.js project with TypeScript
- Set up Express/Fastify server
- Configure folder structure
- Set up basic middleware (CORS, body parser, etc.)
- Create placeholder API endpoints

### Step 4: Supabase Setup
- Create Supabase project
- Configure authentication settings
- Set up database schema
- Create tables (grants, users, user_interactions)
- Set up indexes for performance
- Configure row-level security policies

## Phase 2: Data Pipeline Implementation

### Step 1: Set Up Data Extraction
- Create utility to download XML extract from Grants.gov
- Implement error handling and fallbacks
- Set up directory structure for downloaded files

### Step 2: Implement Data Parsing
- Create XML parser for Grants.gov data
- Transform raw data into structured format
- Validate and clean data

### Step 3: Configure Database Storage
- Implement batch processing with progress bar
- Set up delta updates (only process new/changed grants)
- Create utility scripts for database management

### Step 4: Schedule Automated Updates
- Set up cron job to run at 5 AM EST daily
- Implement logging and monitoring
- Create manual trigger for updates

### Step 5: Database Schema Optimization
- Update funding fields to use bigint instead of integer
- Add indexes for faster lookups
- Implement efficient querying

## Running the Data Pipeline

1. Update the database schema (one-time setup):
   ```sql
   ALTER TABLE grants ALTER COLUMN total_funding TYPE bigint;
   ALTER TABLE grants ALTER COLUMN award_ceiling TYPE bigint;
   ALTER TABLE grants ALTER COLUMN award_floor TYPE bigint;
   CREATE INDEX IF NOT EXISTS grants_opportunity_id_idx ON grants(opportunity_id);
   ```

2. Clear existing grants (if needed):
   ```bash
   cd backend
   npm run clear-grants
   ```

3. Download and process grants:
   ```bash
   cd backend
   npm run update-grants-live
   ```

## Available Scripts

- `npm run update-grants`: Run the pipeline with mock data (for testing)
- `npm run update-grants-live`: Run the pipeline with real data from Grants.gov
- `npm run clear-grants`: Clear all grants from the database
- `npm run update-schema`: Update the database schema (requires manual SQL execution)

## Implementation Order

1. **First Week**: Focus on setting up the development environment and project structure
   - Create the repository and configure development tools
   - Set up the Next.js frontend project with Tailwind CSS
   - Initialize the Node.js backend project
   - Create the Supabase project and configure initial settings

2. **Second Week**: Implement basic functionality
   - Set up authentication with Supabase Auth
   - Create database schema and tables
   - Implement basic API endpoints
   - Create frontend pages and components

3. **Third Week**: Implement data pipeline
   - Set up data extraction from Grants.gov
   - Implement data parsing and transformation
   - Configure database storage with delta updates
   - Set up cron job for automated updates

This foundation will provide the infrastructure needed for the subsequent phases of development, including the AI integration and core features.

## Environment Variables

The backend requires the following environment variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

The OpenRouter API key is used by the `TextCleaner` service to clean grant descriptions and process contact information using the Mistral-7B-Instruct model.
