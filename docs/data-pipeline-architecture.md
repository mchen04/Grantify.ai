# Grantify.ai Data Pipeline Architecture

This document outlines the architecture and implementation details for the Grantify.ai data pipeline, which is responsible for extracting grant data from Grants.gov, processing it, and storing it in the Supabase database.

## Overview

The data pipeline is a critical component of the Grantify.ai platform, ensuring that users have access to the latest grant opportunities. The pipeline runs daily at 6 AM EST to fetch the latest grant data from Grants.gov, process it, and make it available for search and recommendations.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│ Data        │────►│ Data        │────►│ Data        │────►│ Database    │
│ Extraction  │     │ Parsing     │     │ Processing  │     │ Storage     │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │             │
                                        │ AI          │
                                        │ Processing  │
                                        │             │
                                        └─────────────┘
```

## Components

### 1. Data Extraction

The data extraction component is responsible for downloading the latest grant data from Grants.gov.

#### Implementation Details:

```typescript
// src/utils/dataExtraction.ts

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export async function downloadGrantsData(): Promise<string> {
  try {
    // Get current date in YYYYMMDD format
    const dateStr = format(new Date(), 'yyyyMMdd');
    const fileName = `GrantsDBExtract${dateStr}.zip`;
    const url = `https://www.grants.gov/extract/${fileName}`;
    
    // Create downloads directory if it doesn't exist
    const downloadsDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    
    const filePath = path.join(downloadsDir, fileName);
    
    // Download file
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
    });
    
    // Save file to disk
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading grants data:', error);
    throw error;
  }
}
```

#### Error Handling and Retries:

```typescript
// src/utils/retry.ts

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    retryDelay: number;
    backoffFactor: number;
  } = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffFactor: 2,
  }
): Promise<T> {
  let lastError: Error;
  let delay = options.retryDelay;
  
  for (let attempt = 1; attempt <= options.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt <= options.maxRetries) {
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= options.backoffFactor;
      }
    }
  }
  
  throw lastError;
}

// Usage in data extraction
export async function downloadGrantsDataWithRetry(): Promise<string> {
  return withRetry(downloadGrantsData, {
    maxRetries: 5,
    retryDelay: 5000,
    backoffFactor: 1.5,
  });
}
```

### 2. Data Parsing

The data parsing component is responsible for extracting and parsing the XML data from the downloaded ZIP file.

#### Implementation Details:

```typescript
// src/utils/dataParsing.ts

import fs from 'fs';
import path from 'path';
import { Extract } from 'unzipper';
import { parseStringPromise } from 'xml2js';
import { Transform } from 'stream';

export async function extractAndParseXML(zipFilePath: string): Promise<any> {
  try {
    // Create a temporary directory for extraction
    const extractDir = path.join(path.dirname(zipFilePath), 'extract');
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    // Extract the ZIP file
    await fs.createReadStream(zipFilePath)
      .pipe(Extract({ path: extractDir }))
      .promise();
    
    // Find the XML file
    const files = fs.readdirSync(extractDir);
    const xmlFile = files.find(file => file.endsWith('.xml'));
    
    if (!xmlFile) {
      throw new Error('No XML file found in the ZIP archive');
    }
    
    const xmlFilePath = path.join(extractDir, xmlFile);
    
    // Read and parse the XML file
    const xmlData = fs.readFileSync(xmlFilePath, 'utf-8');
    const parsedData = await parseStringPromise(xmlData, {
      explicitArray: false,
      mergeAttrs: true,
    });
    
    // Clean up
    fs.rmSync(extractDir, { recursive: true, force: true });
    
    return parsedData;
  } catch (error) {
    console.error('Error extracting and parsing XML:', error);
    throw error;
  }
}

// For large XML files, use streaming approach
export function parseXMLStream(zipFilePath: string): Transform {
  // Create a transform stream that processes chunks of XML data
  const transformStream = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        // Process XML chunk
        // ...
        callback(null, processedChunk);
      } catch (error) {
        callback(error as Error);
      }
    }
  });
  
  // Set up the pipeline
  fs.createReadStream(zipFilePath)
    .pipe(Extract())
    .pipe(/* XML parser stream */)
    .pipe(transformStream);
  
  return transformStream;
}
```

### 3. Data Processing

The data processing component is responsible for transforming the parsed XML data into a format suitable for storage in the database.

#### Implementation Details:

```typescript
// src/utils/dataProcessing.ts

import { Grant } from '../models/grant';

export function transformGrantData(rawData: any): Grant[] {
  try {
    const opportunities = Array.isArray(rawData.Grants.OpportunitySynopsisDetail_1_0)
      ? rawData.Grants.OpportunitySynopsisDetail_1_0
      : [rawData.Grants.OpportunitySynopsisDetail_1_0];
    
    return opportunities.map(opportunity => ({
      id: generateUUID(), // Generate a unique ID
      title: opportunity.OpportunityTitle || '',
      opportunity_id: opportunity.OpportunityID || '',
      opportunity_number: opportunity.OpportunityNumber || '',
      category: opportunity.CategoryOfFundingActivity || '',
      funding_type: opportunity.FundingInstrumentType || '',
      activity_category: [], // Will be filled by AI categorization
      eligible_applicants: parseEligibleApplicants(opportunity.EligibleApplicants),
      agency_name: opportunity.AgencyName || '',
      post_date: parseDate(opportunity.PostDate),
      close_date: parseDate(opportunity.CloseDate),
      total_funding: parseNumber(opportunity.EstimatedTotalProgramFunding),
      award_ceiling: parseNumber(opportunity.AwardCeiling),
      award_floor: parseNumber(opportunity.AwardFloor),
      cost_sharing: opportunity.CostSharingOrMatchingRequirement === 'Yes',
      description: opportunity.Description || '',
      additional_info_url: opportunity.AdditionalInformationURL || '',
      grantor_contact_name: opportunity.GrantorContactName || '',
      grantor_contact_email: opportunity.GrantorContactEmailAddress || '',
      grantor_contact_phone: opportunity.GrantorContactPhoneNumber || '',
    }));
  } catch (error) {
    console.error('Error transforming grant data:', error);
    throw error;
  }
}

function parseEligibleApplicants(eligibleApplicants: any): string[] {
  if (!eligibleApplicants) return [];
  
  if (typeof eligibleApplicants === 'string') {
    return [eligibleApplicants];
  }
  
  if (Array.isArray(eligibleApplicants)) {
    return eligibleApplicants;
  }
  
  if (eligibleApplicants.ApplicantType) {
    return Array.isArray(eligibleApplicants.ApplicantType)
      ? eligibleApplicants.ApplicantType
      : [eligibleApplicants.ApplicantType];
  }
  
  return [];
}

function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  try {
    return new Date(dateString);
  } catch (error) {
    console.warn(`Invalid date: ${dateString}`);
    return null;
  }
}

function parseNumber(numberString: string): number | null {
  if (!numberString) return null;
  
  try {
    return parseInt(numberString.replace(/[^0-9]/g, ''), 10);
  } catch (error) {
    console.warn(`Invalid number: ${numberString}`);
    return null;
  }
}

function generateUUID(): string {
  // Simple UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Data validation
export function validateGrant(grant: Grant): boolean {
  // Basic validation
  if (!grant.title || !grant.opportunity_id) {
    return false;
  }
  
  // Additional validation rules
  // ...
  
  return true;
}
```

### 4. Database Storage

The database storage component is responsible for storing the processed grant data in the Supabase database.

#### Implementation Details:

```typescript
// src/utils/databaseStorage.ts

import { createClient } from '@supabase/supabase-js';
import { Grant } from '../models/grant';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function storeGrants(grants: Grant[]): Promise<void> {
  try {
    // Process in batches to avoid hitting limits
    const batchSize = 100;
    for (let i = 0; i < grants.length; i += batchSize) {
      const batch = grants.slice(i, i + batchSize);
      
      // Use upsert to insert or update
      const { error } = await supabase
        .from('grants')
        .upsert(batch, {
          onConflict: 'opportunity_id',
          ignoreDuplicates: false,
        });
      
      if (error) {
        throw error;
      }
      
      console.log(`Stored batch ${i / batchSize + 1} of ${Math.ceil(grants.length / batchSize)}`);
    }
  } catch (error) {
    console.error('Error storing grants:', error);
    throw error;
  }
}

export async function getExistingGrantIds(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('grants')
      .select('opportunity_id');
    
    if (error) {
      throw error;
    }
    
    return data.map(grant => grant.opportunity_id);
  } catch (error) {
    console.error('Error getting existing grant IDs:', error);
    throw error;
  }
}

// Delta updates
export async function performDeltaUpdate(grants: Grant[]): Promise<void> {
  try {
    // Get existing grant IDs
    const existingIds = await getExistingGrantIds();
    const existingIdSet = new Set(existingIds);
    
    // Split grants into new and existing
    const newGrants = grants.filter(grant => !existingIdSet.has(grant.opportunity_id));
    const updatedGrants = grants.filter(grant => existingIdSet.has(grant.opportunity_id));
    
    console.log(`Found ${newGrants.length} new grants and ${updatedGrants.length} existing grants`);
    
    // Store new grants
    if (newGrants.length > 0) {
      await storeGrants(newGrants);
    }
    
    // Update existing grants
    if (updatedGrants.length > 0) {
      await storeGrants(updatedGrants);
    }
  } catch (error) {
    console.error('Error performing delta update:', error);
    throw error;
  }
}
```

### 5. AI Processing

The AI processing component is responsible for categorizing grants and generating embeddings for similarity matching.

#### Implementation Details:

```typescript
// src/utils/aiProcessing.ts

import { AIServiceClient } from '../services/aiService';
import { Grant } from '../models/grant';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const aiService = new AIServiceClient(process.env.AI_API_KEY, process.env.AI_API_URL);

export async function categorizeGrant(grant: Grant): Promise<string[]> {
  try {
    const textToAnalyze = `${grant.title}. ${grant.description}`;
    
    // Call AI service to categorize grant
    const categories = await aiService.categorize(textToAnalyze, {
      maxCategories: 5,
      confidenceThreshold: 0.7,
    });
    
    // Update grant in database
    const { error } = await supabase
      .from('grants')
      .update({ activity_category: categories })
      .eq('id', grant.id);
    
    if (error) {
      throw error;
    }
    
    return categories;
  } catch (error) {
    console.error(`Error categorizing grant ${grant.id}:`, error);
    throw error;
  }
}

export async function generateEmbeddings(grant: Grant): Promise<number[]> {
  try {
    const textToEmbed = `${grant.title}. ${grant.description}`;
    
    // Call AI service to generate embeddings
    const embeddings = await aiService.generateEmbeddings(textToEmbed);
    
    // Update grant in database
    const { error } = await supabase
      .from('grants')
      .update({ embeddings })
      .eq('id', grant.id);
    
    if (error) {
      throw error;
    }
    
    return embeddings;
  } catch (error) {
    console.error(`Error generating embeddings for grant ${grant.id}:`, error);
    throw error;
  }
}

// Process grants in batches
export async function processGrantsWithAI(grants: Grant[]): Promise<void> {
  try {
    // Process in batches to avoid hitting API limits
    const batchSize = 10;
    for (let i = 0; i < grants.length; i += batchSize) {
      const batch = grants.slice(i, i + batchSize);
      
      // Process each grant in the batch
      await Promise.all(batch.map(async (grant) => {
        try {
          // Categorize grant
          await categorizeGrant(grant);
          
          // Generate embeddings
          await generateEmbeddings(grant);
          
          console.log(`Processed grant ${grant.id}`);
        } catch (error) {
          console.error(`Error processing grant ${grant.id}:`, error);
          // Continue with other grants
        }
      }));
      
      console.log(`Processed batch ${i / batchSize + 1} of ${Math.ceil(grants.length / batchSize)}`);
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < grants.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error('Error processing grants with AI:', error);
    throw error;
  }
}
```

## Orchestration

The orchestration component is responsible for coordinating the entire data pipeline process.

### Implementation Details:

```typescript
// src/utils/pipelineOrchestrator.ts

import { downloadGrantsDataWithRetry } from './dataExtraction';
import { extractAndParseXML } from './dataParsing';
import { transformGrantData, validateGrant } from './dataProcessing';
import { performDeltaUpdate } from './databaseStorage';
import { processGrantsWithAI } from './aiProcessing';
import { Grant } from '../models/grant';

export async function runDataPipeline(): Promise<void> {
  try {
    console.log('Starting data pipeline...');
    
    // Step 1: Download grants data
    console.log('Downloading grants data...');
    const zipFilePath = await downloadGrantsDataWithRetry();
    console.log(`Downloaded grants data to ${zipFilePath}`);
    
    // Step 2: Extract and parse XML
    console.log('Extracting and parsing XML...');
    const parsedData = await extractAndParseXML(zipFilePath);
    console.log('Parsed XML data');
    
    // Step 3: Transform data
    console.log('Transforming grant data...');
    const grants = transformGrantData(parsedData);
    console.log(`Transformed ${grants.length} grants`);
    
    // Step 4: Validate data
    console.log('Validating grant data...');
    const validGrants = grants.filter(validateGrant);
    console.log(`Validated ${validGrants.length} grants (${grants.length - validGrants.length} invalid)`);
    
    // Step 5: Store in database
    console.log('Storing grants in database...');
    await performDeltaUpdate(validGrants);
    console.log('Stored grants in database');
    
    // Step 6: Process with AI
    console.log('Processing grants with AI...');
    await processGrantsWithAI(validGrants);
    console.log('Processed grants with AI');
    
    console.log('Data pipeline completed successfully');
  } catch (error) {
    console.error('Error running data pipeline:', error);
    throw error;
  }
}
```

### Cron Job Setup:

```typescript
// src/utils/cronJobs.ts

import cron from 'node-cron';
import { runDataPipeline } from './pipelineOrchestrator';

export function setupCronJobs(): void {
  // Run daily at 6 AM EST (11 AM UTC)
  cron.schedule('0 11 * * *', async () => {
    try {
      console.log('Running scheduled data pipeline...');
      await runDataPipeline();
      console.log('Scheduled data pipeline completed successfully');
    } catch (error) {
      console.error('Error running scheduled data pipeline:', error);
      // Send notification or alert
    }
  });
  
  console.log('Cron jobs set up successfully');
}
```

## Error Handling and Monitoring

### Logging:

```typescript
// src/utils/logger.ts

import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'data-pipeline' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export default logger;
```

### Monitoring:

```typescript
// src/utils/monitoring.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function recordPipelineRun(
  status: 'started' | 'completed' | 'failed',
  details?: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('pipeline_runs')
      .insert({
        status,
        details,
        timestamp: new Date().toISOString(),
      });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error recording pipeline run:', error);
    // Don't throw, as this is a monitoring function
  }
}

export async function getPipelineStats(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('pipeline_runs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting pipeline stats:', error);
    throw error;
  }
}
```

## Scalability Considerations

### Handling Large Files:

For large XML files, we can use a streaming approach to process the data in chunks:

```typescript
// src/utils/largeFileProcessing.ts

import fs from 'fs';
import { Extract } from 'unzipper';
import { createClient } from '@supabase/supabase-js';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { XMLParser } from 'fast-xml-parser';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function processLargeXMLFile(zipFilePath: string): Promise<void> {
  try {
    // Create a transform stream to process XML records
    const processRecordStream = new Transform({
      objectMode: true,
      transform: async function(record, encoding, callback) {
        try {
          // Transform record
          const grant = transformRecord(record);
          
          // Validate grant
          if (!validateGrant(grant)) {
            return callback();
          }
          
          // Store in database
          const { error } = await supabase
            .from('grants')
            .upsert(grant, {
              onConflict: 'opportunity_id',
              ignoreDuplicates: false,
            });
          
          if (error) {
            return callback(error);
          }
          
          // Queue for AI processing
          // This could be a message to a queue system
          
          callback();
        } catch (error) {
          callback(error as Error);
        }
      }
    });
    
    // Set up XML parser
    const parser = new XMLParser({
      isArray: (name) => name === 'OpportunitySynopsisDetail_1_0',
      parseAttributeValue: true,
      ignoreAttributes: false,
    });
    
    // Process the file
    await pipeline(
      fs.createReadStream(zipFilePath),
      Extract(),
      // Some XML streaming parser
      processRecordStream
    );
  } catch (error) {
    console.error('Error processing large XML file:', error);
    throw error;
  }
}

function transformRecord(record: any): any {
  // Transform record to grant object
  // ...
  return grant;
}

function validateGrant(grant: any): boolean {
  // Validate grant
  // ...
  return true;
}
```

### Queue System:

For processing large numbers of grants, we can use a queue system:

```typescript
// src/utils/queueSystem.ts

import Queue from 'bull';
import { Grant } from '../models/grant';
import { categorizeGrant, generateEmbeddings } from './aiProcessing';

// Create queues
const categorizationQueue = new Queue('grant-categorization', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const embeddingsQueue = new Queue('grant-embeddings', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Process categorization queue
categorizationQueue.process(async (job) => {
  const grant = job.data.grant;
  return categorizeGrant(grant);
});

// Process embeddings queue
embeddingsQueue.process(async (job) => {
  const grant = job.data.grant;
  return generateEmbeddings(grant);
});

// Add grants to queues
export async function queueGrantForProcessing(grant: Grant): Promise<void> {
  try {
    // Add to categorization queue
    await categorizationQueue.add({ grant }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
    
    // Add to embeddings queue
    await embeddingsQueue.add({ grant }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  } catch (error) {
    console.error(`Error queuing grant ${grant.id} for processing:`, error);
    throw error;
  }
}

// Queue multiple grants
export async function queueGrantsForProcessing(grants: Grant[]): Promise<void> {
  try {
    await Promise.all(grants.map(queueGrantForProcessing));
  } catch (error) {
    console.error('Error queuing grants for processing:', error);
    throw error;
  }
}
```

## Deployment

### Docker Setup:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["npm", "start"]
```

### Docker Compose:

```yaml
# docker-compose.yml
version: '3'

services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - AI_API_KEY=${AI_API_KEY}
      - AI_API_URL=${AI_API_URL}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis
    volumes:
      - ./logs:/app/logs
      - ./downloads:/app/downloads

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

## Conclusion

This data pipeline architecture provides a comprehensive approach to extracting, processing, and storing grant data from Grants.gov. The pipeline is designed to be robust, scalable, and maintainable, with proper error handling, monitoring, and logging.

Key features of the architecture include:
- Daily automated data extraction from Grants.gov
- Robust error handling and retries
- Efficient processing of large XML files
- Delta updates to minimize database operations
- Integration with AI services for grant categorization
- Queue system for processing large numbers of grants
- Comprehensive monitoring and logging

By following this architecture, we can ensure that the Grantify.ai platform always has access to the latest grant data, providing users with up-to-date and relevant grant opportunities.