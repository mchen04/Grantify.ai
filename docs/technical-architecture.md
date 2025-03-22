# Grantify.ai Technical Architecture

## System Architecture Overview

Grantify.ai follows a modern web application architecture with a clear separation of concerns:

1. **Frontend**: Next.js application providing the user interface
2. **Backend API**: Node.js server handling business logic and data processing
3. **Database**: Supabase (PostgreSQL) for data storage
4. **AI Services**: Gemini API / DeepSeek for grant categorization and recommendations
5. **Scheduled Jobs**: Cron jobs for data extraction and processing

## Component Details

### 1. Frontend (Next.js)

The frontend is built with Next.js, a React framework that provides server-side rendering, static site generation, and API routes.

#### Key Components:

- **Pages**: React components that represent different routes in the application
- **Components**: Reusable UI elements (GrantCard, SearchFilters, etc.)
- **Hooks**: Custom React hooks for state management and API calls
- **Context/Store**: Global state management using Zustand or Redux
- **API Client**: Wrapper for making requests to the backend API

#### Frontend Architecture:

```
frontend/
├─ pages/             # Route components
│  ├─ index.tsx       # Landing page
│  ├─ search.tsx      # Search page
│  ├─ dashboard/      # Dashboard pages
│  └─ grants/         # Grant detail pages
├─ components/        # Reusable UI components
├─ hooks/             # Custom React hooks
├─ lib/               # Utility functions and API client
├─ store/             # Global state management
└─ styles/            # CSS and Tailwind configuration
```

### 2. Backend API (Node.js)

The backend is built with Node.js and Express/Fastify, providing RESTful API endpoints for the frontend.

#### Key Components:

- **Routes**: Define API endpoints and HTTP methods
- **Controllers**: Handle request/response logic
- **Services**: Contain business logic
- **Models**: Define data structures
- **Utils**: Utility functions for data processing, AI integration, etc.

#### Backend Architecture:

```
backend/
├─ routes/            # API route definitions
├─ controllers/       # Request handlers
├─ services/          # Business logic
├─ models/            # Data models
├─ db/                # Database connection and queries
├─ utils/             # Utility functions
│  ├─ parseXML.ts     # XML parsing logic
│  ├─ cronJobs.ts     # Scheduled jobs
│  └─ aiIntegration.ts # AI service integration
└─ server.ts          # Main entry point
```

### 3. Database (Supabase/PostgreSQL)

Supabase provides a PostgreSQL database with additional features like authentication, storage, and real-time subscriptions.

#### Key Tables:

- **grants**: Stores grant data from Grants.gov
- **users**: Stores user information and preferences
- **user_interactions**: Tracks user actions (save, apply, ignore)

#### Database Schema:

```
┌─────────────────┐       ┌─────────────────┐
│     grants      │       │      users      │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ title           │       │ email           │
│ opportunity_id  │       │ preferences     │
│ category        │       │ created_at      │
│ funding_type    │       │ updated_at      │
│ activity_category│       └────────┬────────┘
│ eligible_applicants│              │
│ agency_name     │                 │
│ post_date       │                 │
│ close_date      │                 │
│ total_funding   │       ┌─────────▼─────────┐
│ award_ceiling   │       │ user_interactions │
│ award_floor     │◄──────┤─────────────────┤
│ cost_sharing    │       │ user_id         │
│ description     │       │ grant_id        │
│ additional_info_url│    │ action          │
│ grantor_contact_info│   │ timestamp       │
└─────────────────┘       └─────────────────┘
```

### AI Services Integration

The system currently uses OpenRouter API with Mistral-7B-Instruct for text processing:

#### Text Cleaning Service
- Implemented in `backend/src/utils/textCleaner.ts`
- Cleans grant descriptions by removing HTML artifacts and fixing formatting
- Processes contact information to standardize format
- Validates and formats phone numbers
- Infers names from email addresses when names aren't provided
- Implements caching, rate limiting, and retry mechanisms

#### AI Integration Flow:
```
1. Grant data extracted from Grants.gov
2. Raw description and contact information sent to TextCleaner
3. TextCleaner uses Mistral-7B via OpenRouter API to clean and format text
4. Cleaned data stored in database
5. Frontend displays clean, formatted grant information
```

### 5. Data Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│ Cron Job    │────►│ XML Parser  │────►│ Data        │
│ (Daily 6AM) │     │             │     │ Transformer │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                                                ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│ Database    │◄────┤ AI          │◄────┤ Data        │
│ Storage     │     │ Categorizer │     │ Validator   │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## API Endpoints

### Grants API

- `GET /api/grants`: Get grants with filtering and pagination
- `GET /api/grants/:id`: Get details for a specific grant
- `GET /api/grants/recommended`: Get personalized grant recommendations

### Users API

- `GET /api/users/preferences`: Get user preferences
- `POST /api/users/preferences`: Update user preferences
- `POST /api/users/interactions`: Record user interaction with a grant

## Authentication Flow

Grantify.ai uses Supabase Auth for authentication:

1. User signs up/logs in via email+password or OAuth
2. Supabase Auth returns a JWT token
3. Frontend stores token in local storage
4. Token is included in API requests to authenticate the user
5. Backend verifies token with Supabase Auth

## Data Flow

### Grant Data Flow

1. Cron job fetches XML data from Grants.gov daily at 6 AM EST
2. XML is parsed and transformed into structured data
3. Data is validated and cleaned
4. Grants are inserted/updated in the database (upsert)
5. AI service categorizes grants and generates embeddings
6. Categories and embeddings are stored in the database

### User Interaction Flow

1. User searches for grants or views recommendations
2. User interacts with grants (save, apply, ignore)
3. Interactions are recorded in the database
4. AI recommendation system uses interactions to refine future recommendations

## Scalability Considerations

### Database Scalability

- **Indexing**: Create indexes on frequently queried columns
- **Partitioning**: Consider partitioning the grants table by date
- **Connection Pooling**: Use connection pooling for better performance
- **Query Optimization**: Optimize complex queries for better performance

### API Scalability

- **Caching**: Implement caching for frequently accessed data
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Load Balancing**: Use load balancing for high traffic
- **Serverless Functions**: Consider serverless functions for bursty workloads

### AI Service Scalability

- **Batching**: Batch API calls to reduce overhead
- **Caching**: Cache AI results to reduce API calls
- **Asynchronous Processing**: Process AI tasks asynchronously
- **Fallback Mechanisms**: Implement fallbacks if AI services are unavailable

## Security Considerations

- **Authentication**: Secure user authentication with Supabase Auth
- **Authorization**: Proper access control for API endpoints
- **Data Encryption**: Encrypt sensitive data in transit and at rest
- **Input Validation**: Validate and sanitize all user inputs
- **CSRF Protection**: Implement CSRF protection for API endpoints
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Dependency Management**: Regularly update dependencies to patch vulnerabilities

## Monitoring and Logging

- **Application Monitoring**: Monitor application performance and errors
- **Database Monitoring**: Monitor database performance and queries
- **API Monitoring**: Monitor API response times and errors
- **Cron Job Monitoring**: Monitor cron job execution and results
- **AI Service Monitoring**: Monitor AI service performance and costs
- **Logging**: Implement structured logging for debugging and auditing

## Deployment Architecture

### Frontend Deployment (Vercel)

- Next.js application deployed to Vercel
- Automatic deployments from Git repository
- Preview deployments for pull requests
- CDN for static assets

### Backend Deployment (Options)

- **Option 1**: Deploy to a cloud provider (AWS, GCP, Azure)
- **Option 2**: Use a container orchestration platform (Kubernetes, Docker Swarm)
- **Option 3**: Use a serverless platform (AWS Lambda, Vercel Functions)

### Database Deployment (Supabase)

- Managed PostgreSQL database provided by Supabase
- Automatic backups and scaling
- Connection pooling for better performance

## Conclusion

This technical architecture provides a comprehensive overview of the Grantify.ai system, including components, data flow, API endpoints, scalability considerations, and deployment architecture. This architecture is designed to be scalable, secure, and maintainable, providing a solid foundation for the Grantify.ai platform.
