# Grantify.ai Data Pipeline Architecture

This document outlines the architecture and implementation details for the Grantify.ai data pipeline, which is responsible for extracting grant data from Grants.gov, processing it, and storing it in the Supabase database.

## Overview

The data pipeline is a critical component of the Grantify.ai platform, ensuring that users have access to the latest grant opportunities. The pipeline runs daily at 5 AM EST to fetch the latest grant data from Grants.gov, process it, and make it available for search and recommendations.

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

```javascript
// src/utils/grantsDownloader.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { promisify } = require('util');
const { mkdirp } = require('mkdirp');
const { format } = require('date-fns');
const cheerio = require('cheerio');

// Promisify fs functions
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

/**
 * Get the latest available XML extract URL from Grants.gov
 * @returns {Promise<string>} - URL of the latest XML extract
 */
async function getLatestXmlExtractUrl() {
  try {
    // Fetch the XML extract page
    const response = await axios.get('https://www.grants.gov/xml-extract');
    const $ = cheerio.load(response.data);
    
    // Find all links to ZIP files
    const zipLinks = [];
    $('a[href$=".zip"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('GrantsDBExtract')) {
        zipLinks.push(href);
      }
    });
    
    if (zipLinks.length === 0) {
      throw new Error('No ZIP files found on the XML extract page');
    }
    
    // Sort by date (assuming the filenames contain dates)
    zipLinks.sort().reverse();
    
    // Return the latest one
    const latestZipUrl = zipLinks[0];
    console.log(`Found latest XML extract: ${latestZipUrl}`);
    
    // If the URL is relative, make it absolute
    if (latestZipUrl.startsWith('/')) {
      return `https://www.grants.gov${latestZipUrl}`;
    }
    
    return latestZipUrl;
  } catch (error) {
    console.error('Error getting latest XML extract URL:', error);
    throw error;
  }
}

/**
 * Downloads the latest grants XML extract from Grants.gov
 * @param {Date} date - The date to download (defaults to today)
 * @param {boolean} useV2 - Whether to use the v2 version of the extract
 * @param {boolean} useMock - Whether to use the mock XML file (for testing)
 * @returns {Promise<string>} - Path to the extracted XML file
 */
async function downloadGrantsXml(date = new Date(), useV2 = true, useMock = false) {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../../data');
    const extractsDir = path.join(dataDir, 'extracts');
    const xmlDir = path.join(dataDir, 'xml');
    
    // Use mkdirp correctly - it's an async function in v3.x
    await mkdirp(dataDir);
    await mkdirp(extractsDir);
    await mkdirp(xmlDir);
    
    // Format date for filename
    const dateStr = format(date, 'yyyyMMdd');
    const v2Suffix = useV2 ? 'v2' : '';
    const filename = `GrantsDBExtract${dateStr}${v2Suffix}.zip`;
    const xmlFilename = `GrantsDBExtract${dateStr}${v2Suffix}.xml`;
    const xmlPath = path.join(xmlDir, xmlFilename);
    
    // Check if we already have the file
    if (await exists(xmlPath)) {
      console.log(`XML file already exists at ${xmlPath}`);
      return xmlPath;
    }
    
    // If using mock, return the path to the mock XML file
    if (useMock) {
      console.log(`Using mock XML file at ${xmlPath}`);
      return xmlPath;
    }
    
    try {
      // Get the latest XML extract URL from the Grants.gov website
      const zipUrl = await getLatestXmlExtractUrl();
      console.log(`Downloading grants extract from ${zipUrl}...`);
      
      // Extract the filename from the URL
      const urlFilename = zipUrl.split('/').pop();
      const zipPath = path.join(extractsDir, urlFilename);
      const extractedXmlFilename = urlFilename.replace('.zip', '.xml');
      const extractedXmlPath = path.join(xmlDir, extractedXmlFilename);
      
      // Download the zip file
      const response = await axios({
        method: 'get',
        url: zipUrl,
        responseType: 'arraybuffer',
        timeout: 60000, // 60 second timeout for large files
      });
      
      await writeFile(zipPath, response.data);
      console.log(`Downloaded zip file to ${zipPath}`);
      
      // Try to extract the zip file
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();
      
      // Check if the ZIP contains an XML file
      const xmlEntry = zipEntries.find(entry => entry.entryName.endsWith('.xml'));
      if (!xmlEntry) {
        throw new Error('ZIP file does not contain an XML file');
      }
      
      zip.extractAllTo(xmlDir, true);
      console.log(`Extracted XML file to ${xmlDir}`);
      
      // Return the path to the extracted XML file
      return extractedXmlPath;
    } catch (error) {
      console.error('Error downloading or extracting ZIP file:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error downloading grants XML:', error);
    throw error;
  }
}

module.exports = {
  downloadGrantsXml,
  getLatestXmlExtractUrl
};
```

#### Error Handling and Retries:

```javascript
// src/utils/retry.js

export async function withRetry(
  fn,
  options = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffFactor: 2,
  }
) {
  let lastError;
  let delay = options.retryDelay;
  
  for (let attempt = 1; attempt <= options.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
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
export async function downloadGrantsDataWithRetry() {
  return withRetry(downloadGrantsXml, {
    maxRetries: 5,
    retryDelay: 5000,
    backoffFactor: 1.5,
  });
}
```

### 2. Data Parsing

The data parsing component is responsible for extracting and parsing the XML data from the downloaded ZIP file.

#### Implementation Details:

```javascript
// src/utils/grantsParser.js

const fs = require('fs');
const xml2js = require('xml2js');
const { promisify } = require('util');

// Promisify fs.readFile
const readFile = promisify(fs.readFile);

/**
 * Parse the grants XML file and convert it to a structured format
 * @param {string} xmlPath - Path to the XML file
 * @returns {Promise<Array>} - Array of grant objects
 */
async function parseGrantsXml(xmlPath) {
  try {
    console.log(`Parsing XML file: ${xmlPath}`);
    
    // Read the XML file
    const xmlData = await readFile(xmlPath, 'utf8');
    
    // Parse XML to JSON
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlData);
    
    // Extract grants from the parsed data
    const grantsData = result.Grants.OpportunitySynopsisDetail_1_0;
    
    if (!grantsData || !Array.isArray(grantsData)) {
      throw new Error('Invalid XML format: OpportunitySynopsisDetail_1_0 not found or not an array');
    }
    
    console.log(`Found ${grantsData.length} grants in the XML file`);
    
    // Transform the grants data into our database schema format
    const grants = grantsData.map(transformGrantData);
    
    return grants;
  } catch (error) {
    console.error('Error parsing grants XML:', error);
    throw error;
  }
}

/**
 * Transform the raw grant data from XML into our database schema format
 * @param {Object} grant - Raw grant data from XML
 * @returns {Object} - Transformed grant object
 */
function transformGrantData(grant) {
  // Helper function to convert date format from MMDDYYYY to ISO format
  const convertDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Extract month, day, and year
    const month = dateStr.substring(0, 2);
    const day = dateStr.substring(2, 4);
    const year = dateStr.substring(4, 8);
    
    // Create ISO date string
    return `${year}-${month}-${day}`;
  };
  
  // Helper function to parse funding amounts
  const parseFunding = (amount) => {
    if (!amount) return null;
    
    // Remove any non-numeric characters except decimal point
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    return cleanAmount ? parseInt(cleanAmount, 10) : null;
  };
  
  // Transform the grant data
  return {
    opportunity_id: grant.OpportunityID || '',
    opportunity_number: grant.OpportunityNumber || '',
    title: grant.OpportunityTitle || '',
    category: grant.OpportunityCategory || '',
    funding_type: grant.FundingInstrumentType || '',
    activity_category: [], // Will be filled by AI categorization
    eligible_applicants: parseEligibleApplicants(grant.EligibleApplicants),
    agency_name: grant.AgencyName || '',
    post_date: convertDate(grant.PostDate),
    close_date: convertDate(grant.CloseDate),
    total_funding: parseFunding(grant.EstimatedTotalProgramFunding),
    award_ceiling: parseFunding(grant.AwardCeiling),
    award_floor: parseFunding(grant.AwardFloor),
    cost_sharing: grant.CostSharingOrMatchingRequirement === 'Yes',
    description: grant.Description || '',
    additional_info_url: grant.AdditionalInformationURL || '',
    grantor_contact_name: grant.GrantorContactName || grant.GrantorContactText || '',
    grantor_contact_email: grant.GrantorContactEmail || '',
    grantor_contact_phone: grant.GrantorContactPhoneNumber || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

module.exports = {
  parseGrantsXml,
  transformGrantData
};
```

### 3. Database Storage

The database storage component is responsible for storing the processed grant data in the Supabase database.

#### Implementation Details:

```javascript
// src/services/grantsService.js

const supabase = require('../db/supabaseClient');
const { format } = require('date-fns');
const readline = require('readline');

/**
 * Service for managing grants in the database
 */
class GrantsService {
  /**
   * Store grants in the database with delta updates
   * @param {Array} grants - Array of grant objects to store
   * @returns {Promise<Object>} - Result of the operation
   */
  async storeGrants(grants) {
    try {
      console.log(`Processing ${grants.length} grants for storage...`);
      
      // Track statistics
      const stats = {
        total: grants.length,
        new: 0,
        updated: 0,
        unchanged: 0,
        failed: 0,
        startTime: new Date(),
        endTime: null,
        failedGrants: [], // Track failed grants for reporting
      };
      
      // Process grants in batches to avoid overwhelming the database
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < grants.length; i += batchSize) {
        batches.push(grants.slice(i, i + batchSize));
      }
      
      console.log(`Split grants into ${batches.length} batches of up to ${batchSize} grants each`);
      
      // Set up progress bar
      const progressBar = this.createProgressBar(batches.length);
      
      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        // Update progress bar
        this.updateProgressBar(progressBar, i + 1, batches.length);
        
        // Process each grant in the batch
        const batchResults = await Promise.all(
          batch.map(grant => this.processGrant(grant))
        );
        
        // Update statistics
        batchResults.forEach(result => {
          if (result.status === 'new') stats.new++;
          else if (result.status === 'updated') stats.updated++;
          else if (result.status === 'unchanged') stats.unchanged++;
          else {
            stats.failed++;
            if (result.error) {
              stats.failedGrants.push({
                id: result.id,
                error: result.error
              });
            }
          }
        });
      }
      
      // Complete the progress bar
      this.updateProgressBar(progressBar, batches.length, batches.length);
      console.log(''); // Add a newline after the progress bar
      
      // Log failed grants (limited to first 10)
      if (stats.failedGrants.length > 0) {
        console.log(`Failed to process ${stats.failedGrants.length} grants. First 10 errors:`);
        stats.failedGrants.slice(0, 10).forEach(failedGrant => {
          console.log(`Error processing grant ${failedGrant.id}: ${JSON.stringify(failedGrant.error)}`);
        });
        
        if (stats.failedGrants.length > 10) {
          console.log(`... and ${stats.failedGrants.length - 10} more errors`);
        }
      }
      
      // Record the pipeline run
      stats.endTime = new Date();
      await this.recordPipelineRun(stats);
      
      return stats;
    } catch (error) {
      console.error('Error storing grants:', error);
      
      // Record the failed pipeline run
      await this.recordPipelineRun({
        total: grants.length,
        new: 0,
        updated: 0,
        unchanged: 0,
        failed: grants.length,
        startTime: new Date(),
        endTime: new Date(),
        error: error.message,
      });
      
      throw error;
    }
  }
  
  /**
   * Create a progress bar
   * @param {number} total - Total number of items
   * @returns {Object} - Progress bar object
   */
  createProgressBar(total) {
    const progressBar = {
      total,
      current: 0,
      bar: '',
      percent: 0,
    };
    
    // Initialize the progress bar
    this.updateProgressBar(progressBar, 0, total);
    
    return progressBar;
  }
  
  /**
   * Update the progress bar
   * @param {Object} progressBar - Progress bar object
   * @param {number} current - Current progress
   * @param {number} total - Total items
   */
  updateProgressBar(progressBar, current, total) {
    progressBar.current = current;
    progressBar.percent = Math.floor((current / total) * 100);
    
    const barLength = 30;
    const filledLength = Math.floor((current / total) * barLength);
    const emptyLength = barLength - filledLength;
    
    const filledBar = '='.repeat(filledLength);
    const emptyBar = ' '.repeat(emptyLength);
    progressBar.bar = `[${filledBar}>${emptyBar}]`;
    
    // Clear the current line and write the progress bar
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`Progress: ${progressBar.bar} ${progressBar.percent}% (${current}/${total} batches)`);
  }
  
  /**
   * Process a single grant (insert, update, or skip)
   * @param {Object} grant - Grant object to process
   * @returns {Promise<Object>} - Result of the operation
   */
  async processGrant(grant) {
    try {
      // Check if the grant already exists
      const { data: existingGrant, error: fetchError } = await supabase
        .from('grants')
        .select('id, updated_at, opportunity_id')
        .eq('opportunity_id', grant.opportunity_id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw fetchError;
      }
      
      // If the grant doesn't exist, insert it
      if (!existingGrant) {
        const { error: insertError } = await supabase
          .from('grants')
          .insert(grant);
        
        if (insertError) throw insertError;
        
        return { status: 'new', id: grant.opportunity_id };
      }
      
      // If the grant exists, update it
      const { error: updateError } = await supabase
        .from('grants')
        .update({
          ...grant,
          id: existingGrant.id, // Preserve the original ID
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGrant.id);
      
      if (updateError) throw updateError;
      
      return { status: 'updated', id: existingGrant.id };
    } catch (error) {
      return { status: 'failed', id: grant.opportunity_id, error };
    }
  }
  
  /**
   * Record a pipeline run in the database
   * @param {Object} stats - Statistics about the pipeline run
   * @returns {Promise<void>}
   */
  async recordPipelineRun(stats) {
    try {
      const { error } = await supabase
        .from('pipeline_runs')
        .insert({
          status: stats.failed === stats.total ? 'failed' : 'completed',
          details: {
            total: stats.total,
            new: stats.new,
            updated: stats.updated,
            unchanged: stats.unchanged,
            failed: stats.failed,
            duration_ms: stats.endTime - stats.startTime,
            error: stats.error,
          },
          timestamp: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      console.log('Pipeline run recorded successfully');
    } catch (error) {
      console.error('Error recording pipeline run:', error);
    }
  }
}

module.exports = new GrantsService();
```

### 4. Database Schema

The database schema is designed to efficiently store and query grant data. To handle large funding amounts, we use `bigint` instead of `integer` for the funding fields.

```sql
-- Update funding fields to use bigint instead of integer to handle large funding amounts
ALTER TABLE grants ALTER COLUMN total_funding TYPE bigint;
ALTER TABLE grants ALTER COLUMN award_ceiling TYPE bigint;
ALTER TABLE grants ALTER COLUMN award_floor TYPE bigint;

-- Add an index on opportunity_id for faster lookups
CREATE INDEX IF NOT EXISTS grants_opportunity_id_idx ON grants(opportunity_id);
```

### 5. Orchestration

The orchestration component is responsible for coordinating the entire data pipeline process.

#### Implementation Details:

```javascript
// src/utils/cronJobs.js

const cron = require('node-cron');
const { downloadGrantsXml } = require('./grantsDownloader');
const { parseGrantsXml } = require('./grantsParser');
const grantsService = require('../services/grantsService');

/**
 * Initialize cron jobs
 */
function initCronJobs() {
  // Schedule the grants update job to run at 5 AM daily
  // Cron format: second(optional) minute hour day-of-month month day-of-week
  cron.schedule('0 5 * * *', async () => {
    console.log('Running grants update job...');
    await updateGrantsData();
  }, {
    scheduled: true,
    timezone: 'America/New_York' // 5 AM EST as specified
  });
  
  console.log('Cron jobs initialized. Grants update scheduled for 5 AM EST daily.');
}

/**
 * Update grants data from Grants.gov
 * @param {boolean} useMock - Whether to use the mock XML file (for testing)
 * @returns {Promise<void>}
 */
async function updateGrantsData(useMock = false) {
  try {
    console.log('Starting grants data update process...');
    
    // Step 1: Download the latest XML extract
    const xmlPath = await downloadGrantsXml(new Date(), true, useMock);
    console.log(`Using XML file at ${xmlPath}`);
    
    // Step 2: Parse the XML data
    const grants = await parseGrantsXml(xmlPath);
    console.log(`Parsed ${grants.length} grants from XML`);
    
    // Step 3: Store the grants in the database
    const result = await grantsService.storeGrants(grants);
    
    // Log the results
    console.log('Grants update completed successfully:');
    console.log(`- Total grants processed: ${result.total}`);
    console.log(`- New grants added: ${result.new}`);
    console.log(`- Existing grants updated: ${result.updated}`);
    console.log(`- Unchanged grants: ${result.unchanged}`);
    console.log(`- Failed grants: ${result.failed}`);
    console.log(`- Duration: ${(result.endTime - result.startTime) / 1000} seconds`);
  } catch (error) {
    console.error('Error updating grants data:', error);
  }
}

/**
 * Run the grants update job manually
 * @param {boolean} useMock - Whether to use the mock XML file (for testing)
 * @returns {Promise<void>}
 */
async function runGrantsUpdateJob(useMock = true) {
  console.log('Manually running grants update job...');
  await updateGrantsData(useMock);
}

module.exports = {
  initCronJobs,
  updateGrantsData,
  runGrantsUpdateJob
};
```

## Utility Scripts

### 1. Clear Grants

This script allows you to clear all grants from the database, giving you a clean slate.

```javascript
// scripts/clearGrants.js

/**
 * Script to clear all grants from the database
 * 
 * Usage: node scripts/clearGrants.js
 */

// Load environment variables
require('dotenv').config();

const supabase = require('../src/db/supabaseClient');

async function clearGrants() {
  try {
    console.log('Starting grants cleanup...');
    
    // Delete all records from the grants table
    console.log('Deleting all grants...');
    const { error: grantsError } = await supabase
      .from('grants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This is a trick to delete all records
    
    if (grantsError) {
      console.error('Error deleting grants:', grantsError);
    } else {
      console.log('All grants deleted successfully');
    }
    
    // Also delete all pipeline runs for a clean slate
    console.log('Deleting all pipeline runs...');
    const { error: pipelineError } = await supabase
      .from('pipeline_runs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (pipelineError) {
      console.error('Error deleting pipeline runs:', pipelineError);
    } else {
      console.log('All pipeline runs deleted successfully');
    }
    
    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  }
}

// Run the cleanup
clearGrants()
  .then(() => {
    console.log('Cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup script failed:', error);
    process.exit(1);
  });
```

## Error Handling and Monitoring

### Logging:

```javascript
// src/utils/logger.js

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
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data

volumes:
  data:
```

## Data Processing

### Text Cleaning
The pipeline includes a sophisticated text cleaning service implemented in `backend/src/utils/textCleaner.ts`:

1. **Description Cleaning**:
   - Raw grant descriptions often contain HTML artifacts, inconsistent formatting, and other issues
   - The `TextCleaner` class uses Mistral-7B-Instruct via OpenRouter API to clean descriptions
   - Removes HTML tags, fixes spacing, ensures proper capitalization and sentence structure
   - Falls back to basic HTML cleaning if AI service is unavailable

2. **Contact Information Processing**:
   - Parses and standardizes contact information (name, email, phone)
   - Removes titles from names and fixes capitalization
   - Standardizes phone numbers to XXX-XXX-XXXX format when possible
   - Infers names from email addresses when names aren't provided
   - Tracks data quality with source flags (provided vs. inferred)

3. **Optimizations**:
   - Implements request rate limiting to prevent API throttling
   - Caches cleaned text to reduce duplicate API calls
   - Uses retry with exponential backoff for failed requests

## Conclusion

This data pipeline architecture provides a comprehensive approach to extracting, processing, and storing grant data from Grants.gov. The pipeline is designed to be robust, scalable, and maintainable, with proper error handling, monitoring, and logging.

Key features of the architecture include:
- Daily automated data extraction from Grants.gov at 5 AM EST
- Robust error handling and fallbacks
- Progress bar for batch processing
- Support for large funding amounts using bigint
- Delta updates to minimize database operations
- Utility scripts for database management
- Comprehensive monitoring and logging

By following this architecture, we can ensure that the Grantify.ai platform always has access to the latest grant data, providing users with up-to-date and relevant grant opportunities.
