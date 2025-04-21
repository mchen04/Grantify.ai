# AI Integration Strategy

## Overview
This document outlines the AI integration architecture and implementation details for the Grantify.ai platform, focusing on the multiple AI processing pipelines currently implemented.

## AI Processing Pipelines

### 1. OpenRouter Pipeline (Original)
- Uses OpenRouter API with Mistral model
- Processes grant descriptions and contact information
- Handles full text cleaning and formatting
- Implemented in `textCleaner.ts`
- Accessed via `updateGrantsLive.ts` script

### 2. Gemini Pipeline
- Uses Google's Gemini 2.0 Flash Lite model (free tier)
- Sophisticated rate limiting to stay within free tier limits:
  - 30 requests per minute (RPM)
  - 1,000,000 tokens per minute (TPM)
  - 1,500 requests per day (RPD)
- Text cleaning cache to avoid redundant API calls
- Advanced contact information processing with name inference
- Implemented in `geminiTextCleaner.ts`
- Accessed via `updateGrantsWithGemini.ts` script

### 3. No-AI Pipeline
- Uses basic text cleaning without AI
- HTML cleaning and simple formatting
- Faster processing for large batches
- Implemented in `basicTextCleaner.ts`
- Accessed via `updateGrantsNoAI.ts` script

## Technical Implementation

### AI Models
- Gemini 2.0 Flash Lite (Google)
- Mistral (via OpenRouter)
- Basic text processing (no AI)

### Integration Points
- Batch processing pipeline for grants
- Database storage with processing status tracking
- Configurable source parameter for different data sources
- Pipeline run monitoring and statistics

### Data Flow
1. Grant data downloaded from source (e.g., grants.gov)
2. Data parsed and normalized
3. Text cleaned through selected AI pipeline
4. Results stored in database with processing status
5. Pipeline statistics recorded for monitoring

## Performance Optimizations
- Text cleaning cache for Gemini pipeline
- Chunked processing to manage memory usage
- Configurable batch sizes
- Rate limiting to prevent API quota issues
- Exponential backoff retry logic for failed requests

## Security and Privacy
- API key management via environment variables
- Input validation before AI processing
- Rate limiting to prevent abuse
- Error handling with fallback to basic cleaning

## Monitoring and Maintenance
- Pipeline run statistics stored in database
- Detailed logging of processing steps
- Error tracking with stack traces
- Processing status tracking for each grant
- Resumable processing for interrupted runs