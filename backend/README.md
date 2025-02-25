# Grantify.ai Backend

This is the backend API for Grantify.ai, an AI-powered grant matching platform.

## Data Pipeline

The backend includes a data pipeline that fetches grant data from Grants.gov, processes it, and stores it in the Supabase database.

### How It Works

1. **Daily Cron Job**: The pipeline runs automatically at 5 AM EST every day.
2. **Data Extraction**: The pipeline downloads the latest XML extract from Grants.gov.
3. **Data Processing**: The XML data is parsed and transformed into a structured format.
4. **Delta Updates**: The pipeline only adds new grants and updates existing ones, preserving historical data.
5. **Database Storage**: The processed data is stored in the Supabase database.

### Files

- `src/utils/grantsDownloader.js`: Downloads the XML extract from Grants.gov
- `src/utils/grantsParser.js`: Parses the XML data and transforms it into a structured format
- `src/services/grantsService.js`: Handles storing the data in the database with delta updates
- `src/utils/cronJobs.js`: Sets up the cron job to run the pipeline daily
- `scripts/updateGrants.js`: Script to manually run the pipeline with mock data
- `scripts/updateGrantsLive.js`: Script to manually run the pipeline with live data from Grants.gov
- `scripts/update-schema.sql`: SQL script to update the database schema
- `scripts/clearGrants.js`: Script to clear all grants from the database
- `scripts/runSchemaUpdate.js`: Script to run the schema update SQL

### Manual Execution

To manually run the data pipeline with mock data (for testing):

```bash
npm run update-grants
```

To manually run the data pipeline with live data from Grants.gov:

```bash
npm run update-grants-live
```

The live data script will attempt to download the latest XML extract from Grants.gov. If the current day's file is not available, it will try previous days until it finds a valid file.

### Clearing Grants from the Database

If you need to clear all grants from the database (for example, to start fresh or fix data issues), you can run:

```bash
npm run clear-grants
```

This will delete all grants and pipeline runs from the database, giving you a clean slate.

### Fixing Integer Overflow Errors

If you encounter errors like `value "2192000000" is out of range for type integer`, you need to update the database schema to use `bigint` instead of `integer` for the funding fields. You can do this by running:

```bash
npm run update-schema
```

This will execute the SQL in `scripts/update-schema.sql` to update the funding fields to use `bigint` instead of `integer`, allowing them to handle larger funding amounts.

Alternatively, you can run the SQL manually in your Supabase SQL Editor:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Open a new query
4. Copy and paste the contents of `scripts/update-schema.sql`
5. Run the query

### Configuration

The pipeline can be configured using environment variables in the `.env` file:

- `ENABLE_CRON_JOBS`: Set to `true` to enable the cron jobs (default: `false`)
- `SUPABASE_URL`: The URL of your Supabase project
- `SUPABASE_SERVICE_KEY`: The service key for your Supabase project

## API Endpoints

### Grants

- `GET /api/grants`: Get all grants with optional filtering
- `GET /api/grants/:id`: Get a specific grant by ID
- `GET /api/grants/recommended`: Get recommended grants for a user

### Users

- `GET /api/users/preferences`: Get user preferences
- `POST /api/users/preferences`: Update user preferences
- `POST /api/users/interactions`: Record user interaction with a grant

### Admin

- `GET /api/admin/pipeline/status`: Get the status of the data pipeline
- `POST /api/admin/pipeline/run`: Trigger a manual run of the data pipeline

## Development

### Prerequisites

- Node.js 14+
- npm 6+
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with the required environment variables:

```
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
ENABLE_CRON_JOBS=true
```

4. Start the development server:

```bash
npm run dev
```

### Database Setup

The database schema is defined in `src/db/schema.sql`. You can run this file in the Supabase SQL Editor to create the necessary tables and indexes.

## Production Deployment

For production deployment, you'll need to:

1. Set up a server or cloud service (e.g., AWS, Heroku, DigitalOcean)
2. Configure environment variables for production
3. Set up a process manager (e.g., PM2) to keep the server running
4. Configure a reverse proxy (e.g., Nginx) to handle HTTPS

## License

MIT