# Grant Update Scripts Documentation

This document provides information about the various scripts available for updating grant data from grants.gov in the Grantify.ai system.

## Overview

Grantify.ai provides several scripts for downloading and processing grant data from grants.gov. These scripts offer different text cleaning options to suit various needs:

1. **Gemini AI Processing** - Uses Google's Gemini AI for advanced text cleaning
2. **OpenRouter Processing** - Uses OpenRouter for text cleaning (default for scheduled jobs)
3. **Basic Processing** - Uses simple regex-based text cleaning without AI
4. **Raw Processing** - No text cleaning, stores data exactly as received

## Available Scripts

### 1. Update Grants with Gemini AI

This script downloads grant data from grants.gov and processes it using Google's Gemini AI for text cleaning.

**Script Path:** `backend/scripts/updateGrantsWithGemini.ts`

**Usage:**
```bash
ts-node backend/scripts/updateGrantsWithGemini.ts --chunk-size=20 --max-requests=50
```

**Parameters:**
- `--chunk-size`: Number of grants to process in each batch (default: 20)
- `--max-requests`: Maximum number of API requests to make in a single run (default: 50)

**Note:** The parameters are optional. You can run the script without parameters to use the defaults.

**Notes:**
- Uses Gemini 2.0 Flash Lite (free tier)
- Respects rate limits: 30 RPM, 1,000,000 TPM, 1,500 RPD
- Processes grants in chunks and can be run multiple times to process all grants
- Requires a Gemini API key in the `.env` file (GEMINI_API_KEY)

### 2. Update Grants with OpenRouter (Live)

This script downloads grant data from grants.gov and processes it using OpenRouter for text cleaning.

**Script Path:** `backend/scripts/updateGrantsLive.ts`

**Usage:**
```bash
ts-node backend/scripts/updateGrantsLive.ts --source=grants.gov
```

**Parameters:**
- `--source`: Source of the grant data (default: grants.gov)

**Note:** The parameter is optional. You can run the script without parameters to use the default source.

**Notes:**
- This is the default method used by the scheduled cron job
- Requires an OpenRouter API key in the `.env` file

### 3. Update Grants with Basic Cleaning (No AI)

This script downloads grant data from grants.gov and processes it using basic text cleaning without AI.

**Script Path:** `backend/scripts/updateGrantsNoAI.ts`

**Usage:**
```bash
ts-node backend/scripts/updateGrantsNoAI.ts --source=grants.gov
```

**Parameters:**
- `--source`: Source of the grant data (default: grants.gov)

**Note:** The parameter is optional. You can run the script without parameters to use the default source.

**Notes:**
- Uses simple regex-based cleaning for HTML entities, formatting, etc.
- Does not require any API keys
- Faster than AI-based methods but less sophisticated

### 4. Update Grants with Raw Data (No Cleaning)

This script downloads grant data from grants.gov and stores it in the database without any text cleaning.

**Script Path:** `backend/scripts/updateGrantsRaw.ts`

**Usage:**
```bash
ts-node backend/scripts/updateGrantsRaw.ts --source=grants.gov
```

**Parameters:**
- `--source`: Source of the grant data (default: grants.gov)

**Note:** The parameter is optional. You can run the script without parameters to use the default source.

**Notes:**
- Stores data exactly as received from grants.gov
- No text cleaning or processing is performed
- Fastest method but may include HTML artifacts and formatting issues

## Scheduled Cron Job

A cron job is configured to automatically update grants daily at 5 AM Eastern Time. By default, it uses Gemini for text cleaning.

The cron job configuration is defined in `backend/src/utils/cronJobs.ts`.

## Processing Status

Grants in the database have a `processing_status` field that indicates their processing state:

- `processed`: Grant has been processed with AI text cleaning
- `not_processed`: Grant has not been processed with AI text cleaning

## Enhanced Phone Number Handling

The text cleaning process now includes enhanced phone number handling:

### Features

1. **International Number Support**
   - Detects and preserves international phone number formats
   - Adds country code prefix (+) when missing
   - Adds country identification in parentheses (e.g., "(UK)", "(France)", etc.)

2. **Parenthetical Information**
   - Preserves any text in parentheses from the original data
   - Example: "123-456-7890 (Extension 123)" or "+44 20 1234 5678 (London Office)"

3. **Standardization**
   - US numbers are formatted as XXX-XXX-XXXX
   - International numbers maintain their original format with appropriate labeling
   - Numbers that don't match known patterns are preserved with their original format

### Examples

- US Number: `555-123-4567`
- US Number with Extension: `555-123-4567 (Ext. 123)`
- UK Number: `+44 20 1234 5678 (UK)`
- International: `+33 1 23 45 67 89 (France)`

## Troubleshooting

### API Key Issues

If you encounter errors related to API keys:

1. Check that the appropriate API key is set in your `.env` file:
   - For Gemini: `GEMINI_API_KEY`
   - For OpenRouter: Check the textCleaner configuration

### Rate Limiting

If you hit rate limits with Gemini:

1. Reduce the `--chunk-size` and `--max-requests` parameters
2. Wait a few minutes before running the script again
3. Consider using the basic or raw processing methods for large batches

### Database Errors

If you encounter database constraint errors:

1. Check that the `processing_status` field only contains allowed values ('processed' or 'not_processed')
2. Verify that all required fields are being populated correctly

## Best Practices

1. For development and testing, use the basic or raw processing methods to avoid API costs
2. For production data, use Gemini or OpenRouter for better quality
3. Run the Gemini processing script with smaller chunk sizes to avoid rate limiting
4. Monitor the pipeline_runs table for processing statistics and errors

## Clearing Grants from the Database

If you need to delete grants from the database, there are two scripts available:

### 1. Clear Grants Only

This script deletes all grants and pipeline runs from the database.

**Script Path:** `backend/scripts/clearGrants.ts`

**Usage:**
```bash
ts-node backend/scripts/clearGrants.ts
```

**What it does:**
- Deletes all records from the grants table
- Deletes all records from the pipeline_runs table
- Does not affect user data or interactions

### 2. Clear All Data

This script deletes all grants and related data from the database, handling foreign key constraints by deleting in the correct order.

**Script Path:** `backend/scripts/clearAllData.ts`

**Usage:**
```bash
ts-node backend/scripts/clearAllData.ts
```

**What it does:**
- Deletes all user interactions first (these reference grants)
- Deletes all grants
- Deletes all pipeline runs
- Provides a complete clean slate for the database

**Note:** Use this script with caution as it will delete user interaction data.