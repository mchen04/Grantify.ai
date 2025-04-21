# Data Pipeline Architecture

## Overview
This document describes the data pipeline architecture for processing and managing grant data in the Grantify.ai platform, with a focus on the currently implemented components.

## Data Sources
- Grants.gov XML Extract (primary source)
- Support for additional sources via the `source` parameter (e.g., "Horizon Europe")

## Pipeline Components

### 1. Data Collection Layer
- Scheduled XML download from Grants.gov at 5 AM EST daily
- Fallback mechanism to try previous days if current day's file is unavailable
- Support for mock data during development
- Implemented in `grantsDownloader.ts`

### 2. Data Processing Layer
- Multiple text cleaning options:
  - OpenRouter (Mistral) for AI-powered cleaning
  - Gemini for AI-powered cleaning with free tier rate limits
  - Basic cleaning without AI for faster processing
- Contact information extraction and standardization
- Grant metadata normalization
- Processing status tracking
- Implemented in `grantsParser.ts`, `textCleaner.ts`, `geminiTextCleaner.ts`, and `basicTextCleaner.ts`

### 3. Data Storage Layer
- Supabase PostgreSQL database
- Schema with processing status and source tracking
- Indexes for efficient querying
- Pipeline run statistics storage
- Implemented via `supabaseClient.ts`

## Data Flow Architecture

### Ingestion Pipeline
- XML download from Grants.gov
- XML parsing with xml2js
- Filtering of expired grants
- Source tracking
- Implemented in `grantsDownloader.ts` and `grantsParser.ts`

### Processing Pipeline
- Three processing options:
  1. `updateGrantsLive.ts` - OpenRouter AI processing
  2. `updateGrantsWithGemini.ts` - Gemini AI processing with rate limiting
  3. `updateGrantsNoAI.ts` - Basic processing without AI
- Chunked processing for memory management
- Rate limiting for API quotas
- Caching for performance
- Implemented in respective script files

### Storage Pipeline
- Database writes with upsert logic
- Processing status updates
- Pipeline run statistics recording
- Implemented in `grantsService.ts`

## Performance Optimization
- Text cleaning cache in Gemini pipeline
- Chunked processing to manage memory usage
- Configurable batch sizes
- Database indexes for query performance
- Skip processing for existing grants

## Data Quality
- HTML cleaning and formatting
- Contact information standardization
- Phone number validation
- Fallback to basic cleaning when AI fails
- Error handling with detailed logging

## Database Schema
- `grants` table with:
  - `processing_status` column ("processed" or "not_processed")
  - `source` column (e.g., "grants.gov", "Horizon Europe")
  - Indexes for efficient querying
- `pipeline_runs` table for monitoring statistics

## Monitoring
- Pipeline run statistics in database
- Detailed logging of processing steps
- Error tracking with stack traces
- Processing status tracking
- Console output for real-time monitoring