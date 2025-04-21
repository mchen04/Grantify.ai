# Grantify.ai Backend

## Technology Stack
- Node.js
- Express
- TypeScript
- PostgreSQL (Supabase)
- OpenAI Integration
- Google Gemini Integration

## Directory Structure
```
backend/
├── src/
│   ├── db/           # Database connections and schemas
│   ├── models/       # Data models and interfaces
│   ├── routes/       # API route handlers
│   ├── services/     # Business logic implementation
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions and helpers
├── scripts/          # Database and utility scripts
└── tests/           # Test suites
```

## API Endpoints

### Grants
- `GET /api/grants` - List grants with filtering
- `GET /api/grants/:id` - Get grant details
- `POST /api/grants/search` - Search grants
- `GET /api/grants/recommendations` - Get personalized recommendations

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update user preferences

## Development Setup

### Prerequisites
- Node.js v18+
- npm or yarn
- Supabase account

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run development server
npm run dev
```

### Environment Variables
```
DATABASE_URL=your_supabase_connection_string
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3001
NODE_ENV=development
OPENROUTER_API_KEY=your_openrouter_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## Database Operations

### Migrations
```bash
# Run migrations
npm run db:migrate

# Create new migration
npm run db:migration:create

# Reset database
npm run db:reset
```

### Seeding
```bash
# Seed database with sample data
npm run db:seed
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- grants.test.ts

# Run tests with coverage
npm run test:coverage
```

## Code Quality

### Linting
```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

### Type Checking
```bash
# Run TypeScript compiler
npm run type-check
```

## Build and Deployment

### Building
```bash
# Build for production
npm run build
```

### Production Deployment
```bash
# Start production server
npm start
```

## Monitoring

### Logging
- Winston for logging
- Error tracking with source maps
- Request logging middleware

### Performance
- Response time monitoring
- Database query performance
- Memory usage tracking

## Grant Processing Scripts

### Available Scripts
```bash
# Process grants with mock data (for testing)
npm run update-grants

# Process grants with real data using OpenRouter
npm run update-grants-live

# Process grants with real data using Gemini API
npm run update-grants-gemini

# Process grants with real data without AI processing
npm run update-grants-no-ai

# Clear all grants from the database
npm run clear-grants

# Remove grants with past deadlines
npm run cleanup-expired

# Apply database migrations
npm run apply-migration
```

### Processing Pipelines
The system supports three processing pipelines:

1. **OpenRouter Pipeline** - Uses OpenRouter API with Mistral model
   ```bash
   npm run update-grants-live
   ```

2. **Gemini Pipeline** - Uses Google's Gemini 2.0 Flash Lite model with advanced features:
   - Sophisticated rate limiting (stays within free tier limits)
   - Text cleaning cache to avoid redundant API calls
   - Advanced contact information processing
   - Fallback to basic cleaning when API calls fail
   ```bash
   npm run update-grants-gemini
   ```

3. **No-AI Pipeline** - Uses basic text cleaning without AI
   ```bash
   npm run update-grants-no-ai
   ```

### Customizing Gemini Processing
```bash
# Process with custom chunk size and request limit
npm run update-grants-gemini -- --chunk-size=10 --max-requests=30
```

## Security Features
- JWT authentication
- Request rate limiting
- Input validation
- SQL injection prevention
- XSS protection

## Error Handling
- Centralized error handling
- Custom error classes
- Error logging
- Client-friendly error messages

## Caching Strategy
- Redis caching (optional)
- Query result caching
- Static data caching
- Cache invalidation

## Documentation
- API documentation with Swagger
- Code documentation with TSDoc
- Database schema documentation
- Architecture documentation