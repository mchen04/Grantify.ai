# Gemini Integration for Grant Processing

This document explains how to use the new Gemini model integration for grant data processing as an alternative to OpenRouter.

## Overview

The system now supports two AI processing pipelines:

1. **OpenRouter Pipeline** (original) - Uses OpenRouter API with Mistral model
2. **Gemini Pipeline** (new) - Uses Google's Gemini API with rate limiting and chunked processing

Both pipelines can work independently, and the system maintains compatibility with both approaches.

## Database Schema Changes

Two new columns have been added to the `grants` table:

- `processing_status` - Indicates whether a grant has been processed by AI ("processed" or "not_processed")
- `source` - Indicates where the grant data came from (e.g., "grants.gov", "Horizon Europe")

## Setup

### 1. Apply Database Migration

Run the migration script to add the new columns:

```bash
ts-node scripts/applyMigration.ts
```

### 2. Set Gemini API Key

Add your Gemini API key to your `.env` file:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

You can obtain a Gemini API key from the [Google AI Studio](https://ai.google.dev/).

## Usage

### Processing Grants with Gemini

The new Gemini processing script processes grants in chunks and respects rate limits:

```bash
# Process grants with default settings (chunk size: 50, max requests: 100)
ts-node scripts/updateGrantsWithGemini.ts

# Customize chunk size and max requests
ts-node scripts/updateGrantsWithGemini.ts --chunk-size=25 --max-requests=50
```

This script:
- Processes grants in chunks
- Stops when it hits the specified request limit
- Marks entries as "processed" once completed
- Leaves others as "not_processed" so the next run resumes from the correct point

### Using the Original OpenRouter Pipeline

The original pipeline still works and has been updated to respect the new schema:

```bash
# Process grants with OpenRouter
ts-node scripts/updateGrantsLive.ts

# Specify a different source
ts-node scripts/updateGrantsLive.ts --source="Horizon Europe"
```

### Using the No-AI Pipeline

For basic processing without AI:

```bash
# Process grants without AI
ts-node scripts/updateGrantsNoAI.ts

# Specify a different source
ts-node scripts/updateGrantsNoAI.ts --source="Horizon Europe"
```

## Implementation Details

### New Files

- `backend/src/utils/geminiTextCleaner.ts` - Gemini-based text cleaner
- `backend/scripts/updateGrantsWithGemini.ts` - Script for processing grants with Gemini
- `backend/src/db/migrations/add_processing_status_and_source.sql` - Database migration
- `backend/scripts/applyMigration.ts` - Script to apply database migrations

### Modified Files

- `backend/src/utils/grantsParser.ts` - Updated to include new fields
- `backend/src/utils/cronJobs.ts` - Updated to handle source parameter
- `backend/scripts/updateGrantsLive.ts` - Updated to work with new schema
- `backend/scripts/updateGrantsNoAI.ts` - Updated to work with new schema

## Rate Limiting

The Gemini implementation includes built-in rate limiting to prevent API quota issues:

- Configurable request interval (default: 1 second between requests)
- Configurable maximum requests per minute (default: 60)
- Automatic pausing when rate limits are reached
- Resumable processing (continues from where it left off)

## Troubleshooting

### Rate Limit Errors

If you encounter rate limit errors:

1. Decrease the chunk size: `--chunk-size=10`
2. Decrease the max requests: `--max-requests=30`
3. Check your Gemini API quota in the Google AI Studio

### Processing Status Issues

If grants aren't being marked as processed:

1. Check the database schema migration was applied successfully
2. Verify the Gemini API key is valid
3. Check the logs for any errors during processing

## Monitoring

The system records pipeline runs in the `pipeline_runs` table, including:

- Number of grants processed
- Success/failure counts
- Duration
- Any errors encountered

You can query this table to monitor the processing status:

```sql
SELECT * FROM pipeline_runs 
WHERE details->>'type' = 'gemini_processing' 
ORDER BY timestamp DESC 
LIMIT 10;