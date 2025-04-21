# Technical Implementation Details

## Core System Components

### Authentication System
- Supabase Authentication integration
- JWT token management
- Role-based access control
- Session management
- Password reset flow
- OAuth providers integration

### Grant Management System
- Grant data model
- CRUD operations
- Search functionality
- Filtering system
- Sorting capabilities
- Pagination implementation

### Recommendation Engine
- Similarity matching algorithm
- User preference tracking
- Grant relevance scoring
- Personalization system
- Recommendation caching
- Update triggers

### Grant Processing Pipeline
- Multiple AI processing options:
  - OpenRouter (Mistral) pipeline for text cleaning
  - Gemini pipeline with rate limiting and caching
  - No-AI pipeline for basic text processing
- Chunked processing for large datasets
- Processing status tracking
- Source attribution
- Pipeline run monitoring

### User Profile System
- Profile data model
- Preference management
- Grant history tracking
- Saved searches
- Notification settings
- Data privacy controls

### Search System
- Full-text search implementation
- Advanced filtering
- Faceted search
- Search result ranking
- Query optimization
- Search analytics

## Technical Specifications

### Frontend Architecture
- Next.js framework
- React components
- TypeScript implementation
- Tailwind CSS styling
- State management
- Client-side caching
- Route protection
- Error boundaries

### Backend Architecture
- Node.js runtime
- Express framework
- TypeScript implementation
- RESTful API design
- Middleware structure
- Error handling
- Rate limiting
- Request validation

### Database Design
- Supabase tables
- Relationships
- Indexes
- Constraints
- Triggers
- Views
- Functions

### API Endpoints
- Authentication routes
- User management
- Grant operations
- Search endpoints
- Recommendation API
- Profile management
- Admin operations

### Security Measures
- Input validation
- XSS prevention
- CSRF protection
- Rate limiting
- SQL injection prevention
- Authentication checks
- Authorization rules

### Performance Optimizations
- Database indexing
- Query optimization
- Caching strategy
- Load balancing
- Connection pooling
- Asset optimization
- Code splitting

### Monitoring System
- Error tracking
- Performance metrics
- User analytics
- System health checks
- Resource monitoring
- Alert system
- Logging strategy

### Testing Strategy
- Unit tests
- Integration tests
- End-to-end tests
- Performance tests
- Security tests
- API tests
- Component tests

### Deployment Configuration
- Environment setup
- Build process
- Deployment pipeline
- Rollback procedure
- SSL configuration
- Domain setup
- CDN integration