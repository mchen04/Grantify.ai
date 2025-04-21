# Gemini Integration for Grant Processing

This document explains how to use the Gemini model integration for grant data processing as an alternative to OpenRouter.

## Overview

The system supports three AI processing pipelines:

1. **OpenRouter Pipeline** (original) - Uses OpenRouter API with Mistral model
2. **Gemini Pipeline** - Uses Google's Gemini 2.0 Flash Lite model (free tier) with rate limiting and chunked processing
3. **No-AI Pipeline** - Uses basic text cleaning without AI for simple processing needs

All pipelines work independently, and the system maintains compatibility with all approaches.

## Gemini Model Information

The implementation uses the **Gemini 2.0 Flash Lite** model, which is:
- Free of charge
- Subject to the following rate limits:
  - 30 requests per minute (RPM)
  - 1,000,000 tokens per minute (TPM)
  - 1,500 requests per day (RPD)

## Database Schema Changes

Two columns have been added to the `grants` table:

- `processing_status` - Indicates whether a grant has been processed by AI ("processed" or "not_processed")
- `source` - Indicates where the grant data came from (e.g., "grants.gov", "Horizon Europe")

These columns have indexes for efficient querying and are documented with comments in the schema.

## Setup

### 1. Apply Database Migration

Run the migration script to add the new columns:

```bash
# Apply the default migration (add_processing_status_and_source.sql)
ts-node scripts/applyMigration.ts

# Or specify a different migration file
ts-node scripts/applyMigration.ts --migration=your_migration_file.sql
```

The migration script will:
- Add the new columns if they don't exist
- Create indexes for efficient querying
- Add comments to document the schema changes
- Record the migration in the pipeline_runs table

### 2. Set Gemini API Key

Add your Gemini API key to your `.env` file:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

You can obtain a Gemini API key from the [Google AI Studio](https://ai.google.dev/).

## Usage

### Processing Grants with Gemini

The Gemini processing script processes grants in chunks and respects rate limits:

```bash
# Process grants with default settings (chunk size: 20, max requests: 50)
ts-node scripts/updateGrantsWithGemini.ts

# Customize chunk size and max requests (stay within rate limits)
ts-node scripts/updateGrantsWithGemini.ts --chunk-size=10 --max-requests=30
```

This script:
- Processes grants in chunks to manage memory usage
- Stops when it hits the specified request limit
- Marks entries as "processed" once completed
- Leaves others as "not_processed" so the next run resumes from the correct point
- Records detailed statistics in the pipeline_runs table

### Using the Original OpenRouter Pipeline

The original pipeline works with the new schema:

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

- `backend/src/utils/geminiTextCleaner.ts` - Gemini-based text cleaner with advanced features:
  - Sophisticated rate limiting with per-minute and per-day counters
  - Text cleaning cache to avoid redundant API calls
  - Advanced contact information processing with name inference
  - Error handling with exponential backoff retry logic
  - Fallback to basic cleaning when API calls fail
- `backend/scripts/updateGrantsWithGemini.ts` - Script for processing grants with Gemini
- `backend/src/db/migrations/add_processing_status_and_source.sql` - Database migration
- `backend/scripts/applyMigration.ts` - Script to apply database migrations

### Modified Files

- `backend/src/utils/grantsParser.ts` - Updated to include new fields and skip text cleaning for existing grants
- `backend/src/utils/cronJobs.ts` - Updated to handle source parameter and custom text cleaners
- `backend/scripts/updateGrantsLive.ts` - Updated to work with new schema and source parameter
- `backend/scripts/updateGrantsNoAI.ts` - Updated to work with new schema and source parameter

## Rate Limiting

The Gemini implementation includes sophisticated rate limiting to prevent API quota issues:

- Configurable request interval (default: 2 seconds between requests)
- Maximum requests per minute capped at 25 (to stay under the 30 RPM limit)
- Maximum requests per day capped at 1400 (to stay under the 1,500 RPD limit)
- Automatic pausing when rate limits are reached
- Queue-based processing to ensure orderly request handling
- Exponential backoff retry logic for failed requests
- Resumable processing (continues from where it left off)

## Contact Information Processing

The Gemini text cleaner includes advanced contact information processing:

- Extracts and cleans contact names, emails, and phone numbers
- Infers names from email addresses when names aren't provided
- Standardizes phone number formats (XXX-XXX-XXXX)
- Validates phone numbers and marks them as valid/invalid
- Tracks the source of information (provided vs. inferred)

## Troubleshooting

### Rate Limit Errors

If you encounter rate limit errors:

1. Decrease the chunk size: `--chunk-size=5`
2. Decrease the max requests: `--max-requests=20`
3. The script will automatically pause when approaching rate limits
4. If you hit the daily limit (1,500 requests), you'll need to wait until the next day

### Processing Status Issues

If grants aren't being marked as processed:

1. Check the database schema migration was applied successfully
2. Verify the Gemini API key is valid
3. Check the logs for any errors during processing
4. Examine the pipeline_runs table for detailed error information

## Monitoring

The system records pipeline runs in the `pipeline_runs` table, including:

- Number of grants processed
- Success/failure counts
- Duration
- Any errors encountered
- Type of processing (gemini_processing, migration, etc.)
- Timestamp of the run

You can query this table to monitor the processing status:

```sql
SELECT * FROM pipeline_runs
WHERE details->>'type' = 'gemini_processing'
ORDER BY timestamp DESC
LIMIT 10;
```

For migration runs:

```sql
SELECT * FROM pipeline_runs
WHERE details->>'type' = 'migration'
ORDER BY timestamp DESC
LIMIT 10;
```