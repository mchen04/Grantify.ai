# Grantify.ai AI Integration Strategy

## Current Implementation

### Text Cleaning Service
- **Implementation**: `TextCleaner` class in `backend/src/utils/textCleaner.ts`
- **AI Model**: Mistral-7B-Instruct via OpenRouter API
- **Features**:
  - Grant description cleaning (removes HTML artifacts, fixes formatting)
  - Contact information parsing and standardization
  - Phone number validation and formatting
  - Name inference from email addresses when name not provided
- **Optimizations**:
  - Request rate limiting to prevent API throttling
  - Caching of cleaned text to reduce API calls
  - Retry with exponential backoff for failed requests
  - Fallback to basic cleaning when AI service unavailable

## AI Integration Goals

1. **Automated Grant Categorization**: Use AI to analyze grant descriptions and assign relevant topics/categories
2. **Personalized Recommendations**: Provide tailored grant recommendations based on user preferences and behavior
3. **Improved Search Relevance**: Enhance search results with AI-powered ranking and relevance scoring
4. **User Preference Learning**: Continuously refine recommendations based on user interactions
5. **Scalable Processing**: Handle large volumes of grant data efficiently

## AI Service Selection

### Primary Option: Gemini API

**Strengths**:
- Powerful language understanding capabilities
- Strong performance on classification tasks
- Ability to generate embeddings for similarity matching
- Comprehensive documentation and support
- Scalable API with reasonable pricing

**Implementation Considerations**:
- API rate limits and quotas
- Token usage optimization
- Error handling and fallback mechanisms
- Caching strategies to reduce API calls

### Alternative Option: DeepSeek

**Strengths**:
- Specialized in document understanding
- Competitive pricing
- Good performance on classification tasks
- Open-source options available

**Implementation Considerations**:
- Integration complexity
- Community support
- Long-term viability
- Performance benchmarking against Gemini

## AI Implementation Components

### 1. Grant Categorization System

#### Process Flow:
1. Extract relevant text from grant data (title, description, objectives)
2. Preprocess text (remove stopwords, normalize, etc.)
3. Send to AI service for categorization
4. Store categories in the database
5. Update categories when grant data changes

#### Implementation Details:
```typescript
// Example categorization function
async function categorizeGrant(grant: Grant): Promise<string[]> {
  const textToAnalyze = `${grant.title}. ${grant.description}`;
  
  // Preprocess text
  const processedText = preprocessText(textToAnalyze);
  
  // Call AI service
  const categories = await aiService.categorize(processedText, {
    maxCategories: 5,
    confidenceThreshold: 0.7
  });
  
  // Store categories
  await database.updateGrantCategories(grant.id, categories);
  
  return categories;
}
```

#### Batch Processing:
- Process grants in batches to optimize API usage
- Implement queue system for large volumes
- Set up retry mechanism for failed categorizations
- Log categorization results for quality assessment

### 2. Embedding Generation

#### Process Flow:
1. Extract relevant text from grant data
2. Generate embeddings using AI service
3. Store embeddings in vector database or as arrays
4. Use embeddings for similarity matching and recommendations

#### Implementation Details:
```typescript
// Example embedding generation function
async function generateEmbeddings(grant: Grant): Promise<number[]> {
  const textToEmbed = `${grant.title}. ${grant.description}`;
  
  // Generate embeddings
  const embeddings = await aiService.generateEmbeddings(textToEmbed);
  
  // Store embeddings
  await database.updateGrantEmbeddings(grant.id, embeddings);
  
  return embeddings;
}
```

#### Optimization Strategies:
- Cache embeddings to reduce API calls
- Update embeddings only when grant data changes
- Use dimensionality reduction techniques if needed
- Consider using approximate nearest neighbor search for large datasets

### 3. Personalized Recommendation Engine

#### User Preference Vector:
- Create a preference vector for each user based on:
  - Explicitly selected topics/interests
  - Funding range preferences
  - Eligibility criteria
  - Past interactions (saved, applied, ignored grants)

#### Recommendation Algorithm:
```typescript
// Example recommendation function
async function getRecommendedGrants(userId: string): Promise<Grant[]> {
  // Get user preferences
  const userPreferences = await database.getUserPreferences(userId);
  
  // Get user interaction history
  const userInteractions = await database.getUserInteractions(userId);
  
  // Generate user preference vector
  const userVector = generateUserVector(userPreferences, userInteractions);
  
  // Find grants with similar embeddings
  const recommendedGrants = await database.findSimilarGrants(userVector, {
    limit: 20,
    excludeIds: userInteractions.filter(i => i.action === 'ignored').map(i => i.grantId)
  });
  
  // Apply additional filters (funding range, deadlines, etc.)
  const filteredGrants = applyUserFilters(recommendedGrants, userPreferences);
  
  return filteredGrants;
}
```

#### Hybrid Approach:
- Combine embedding similarity with traditional filtering
- Weight recent interactions more heavily
- Include diversity in recommendations
- Adjust weights based on user feedback

### 4. Search Enhancement

#### AI-Enhanced Search:
- Use embeddings to find semantically similar grants
- Combine with keyword-based search for hybrid results
- Rank results based on relevance score and user preferences

#### Implementation Details:
```typescript
// Example search function
async function searchGrants(query: string, userId: string): Promise<Grant[]> {
  // Generate query embeddings
  const queryEmbeddings = await aiService.generateEmbeddings(query);
  
  // Get user preferences
  const userPreferences = await database.getUserPreferences(userId);
  
  // Perform hybrid search
  const results = await database.hybridSearch({
    keywords: query,
    embeddings: queryEmbeddings,
    userPreferences,
    limit: 50
  });
  
  // Rank results
  const rankedResults = rankSearchResults(results, userPreferences);
  
  return rankedResults;
}
```

#### Ranking Factors:
- Semantic similarity to query
- Match with user preferences
- Recency of grant posting
- Application deadline proximity
- Award amount alignment with preferences

### 5. Continuous Learning System

#### User Feedback Loop:
- Track user interactions (save, apply, ignore)
- Adjust recommendations based on interaction patterns
- Implement explicit feedback mechanisms (optional)

#### Implementation Details:
```typescript
// Example user interaction handler
async function handleUserInteraction(userId: string, grantId: string, action: 'saved' | 'applied' | 'ignored'): Promise<void> {
  // Record interaction
  await database.recordUserInteraction(userId, grantId, action);
  
  // Update user preference vector
  await updateUserPreferenceVector(userId, grantId, action);
  
  // Trigger recommendation refresh if needed
  if (action === 'saved' || action === 'applied') {
    await queueRecommendationRefresh(userId);
  }
}
```

#### Learning Strategy:
- Per-user learning (no global model updates)
- Incremental updates to preference vectors
- Periodic retraining for major preference shifts
- A/B testing for recommendation algorithm improvements

## Technical Implementation

### AI Service Integration

#### API Client:
```typescript
// Example AI service client
class AIServiceClient {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, any>;
  
  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.cache = new Map();
  }
  
  async categorize(text: string, options: CategoryOptions): Promise<string[]> {
    const cacheKey = `categorize:${text}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Call API
    const response = await fetch(`${this.baseUrl}/categorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ text, options })
    });
    
    const data = await response.json();
    
    // Cache result
    this.cache.set(cacheKey, data.categories);
    
    return data.categories;
  }
  
  async generateEmbeddings(text: string): Promise<number[]> {
    const cacheKey = `embeddings:${text}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Call API
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ text })
    });
    
    const data = await response.json();
    
    // Cache result
    this.cache.set(cacheKey, data.embeddings);
    
    return data.embeddings;
  }
}
```

#### Error Handling and Retries:
```typescript
// Example retry wrapper
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

### Database Schema Extensions

#### Vector Storage:
```sql
-- Add embeddings column to grants table
ALTER TABLE grants
ADD COLUMN embeddings vector(1536);

-- Create index for vector similarity search
CREATE INDEX grants_embeddings_idx ON grants
USING ivfflat (embeddings vector_cosine_ops)
WITH (lists = 100);
```

#### User Preference Storage:
```sql
-- User preferences table
CREATE TABLE user_preferences (
  user_id UUID REFERENCES users(id),
  preference_vector vector(1536),
  explicit_topics TEXT[],
  funding_min INTEGER,
  funding_max INTEGER,
  eligible_applicant_types TEXT[],
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id)
);
```

### Batch Processing System

#### Queue Implementation:
```typescript
// Example queue processor
class AIProcessingQueue {
  private queue: Queue;
  private aiService: AIServiceClient;
  
  constructor(aiService: AIServiceClient) {
    this.aiService = aiService;
    this.queue = new Queue('ai-processing', {
      concurrency: 5,
      timeout: 60000
    });
    
    this.setupWorkers();
  }
  
  private setupWorkers() {
    this.queue.process(async (job) => {
      const { type, data } = job.data;
      
      switch (type) {
        case 'categorize':
          return this.processCategorizationJob(data);
        case 'embeddings':
          return this.processEmbeddingsJob(data);
        default:
          throw new Error(`Unknown job type: ${type}`);
      }
    });
  }
  
  async queueGrantForProcessing(grant: Grant) {
    // Queue categorization
    await this.queue.add({
      type: 'categorize',
      data: { grantId: grant.id }
    });
    
    // Queue embeddings generation
    await this.queue.add({
      type: 'embeddings',
      data: { grantId: grant.id }
    });
  }
  
  private async processCategorizationJob(data: { grantId: string }) {
    const grant = await database.getGrant(data.grantId);
    return this.aiService.categorize(
      `${grant.title}. ${grant.description}`,
      { maxCategories: 5 }
    );
  }
  
  private async processEmbeddingsJob(data: { grantId: string }) {
    const grant = await database.getGrant(data.grantId);
    return this.aiService.generateEmbeddings(
      `${grant.title}. ${grant.description}`
    );
  }
}
```

## Performance Optimization

### Caching Strategy:
- Cache AI service responses to reduce API calls
- Use Redis or similar for distributed caching
- Implement TTL (time-to-live) for cache entries
- Invalidate cache when grant data changes

### Batch Processing:
- Process grants in batches to optimize API usage
- Use queue system for asynchronous processing
- Implement priority queue for important tasks
- Monitor queue length and processing time

### Database Optimization:
- Use appropriate indexes for vector similarity search
- Consider partitioning for large datasets
- Optimize query patterns for recommendation retrieval
- Use connection pooling for better performance

## Monitoring and Evaluation

### Key Metrics:
- AI service response time
- Categorization accuracy
- Recommendation relevance
- User engagement with recommendations
- API usage and costs

### Logging Strategy:
```typescript
// Example logging middleware
function logAIRequest(service: string, operation: string, startTime: number) {
  const duration = Date.now() - startTime;
  logger.info({
    service,
    operation,
    duration,
    timestamp: new Date().toISOString()
  });
}
```

### Quality Assessment:
- Periodic review of categorization results
- A/B testing for recommendation algorithms
- User feedback collection
- Performance benchmarking

## Fallback Mechanisms

### Degraded Service Modes:
- Keyword-based search if AI service is unavailable
- Cached recommendations if real-time generation fails
- Default categories if categorization fails
- Graceful degradation of features

### Implementation Example:
```typescript
// Example fallback for recommendations
async function getRecommendedGrantsWithFallback(userId: string): Promise<Grant[]> {
  try {
    // Try AI-powered recommendations
    return await getRecommendedGrants(userId);
  } catch (error) {
    logger.error('AI recommendation failed, using fallback', { error });
    
    // Fallback to simpler recommendation logic
    return getFallbackRecommendations(userId);
  }
}

// Fallback recommendation function
async function getFallbackRecommendations(userId: string): Promise<Grant[]> {
  const userPreferences = await database.getUserPreferences(userId);
  
  // Use simple keyword matching instead of embeddings
  return database.findGrantsByKeywords(
    userPreferences.explicit_topics,
    { limit: 20 }
  );
}
```

## Cost Management

### API Usage Optimization:
- Batch processing to reduce API calls
- Caching to avoid redundant calls
- Rate limiting to prevent unexpected costs
- Monitoring usage patterns

### Cost Estimation:
- Estimate API costs based on expected usage
- Set up alerts for unusual usage patterns
- Implement cost allocation tracking
- Regular review of cost-effectiveness

## Implementation Roadmap

### Phase 1: Foundation (Week 4)
- Set up AI service accounts
- Implement basic API client
- Create caching layer
- Set up monitoring and logging

### Phase 2: Grant Categorization (Week 5)
- Implement categorization logic
- Set up batch processing
- Create database schema extensions
- Test with sample data

### Phase 3: Embeddings and Recommendations (Week 6)
- Implement embeddings generation
- Create recommendation algorithm
- Set up vector storage
- Test recommendation quality

### Phase 4: Search Enhancement (Week 7)
- Implement hybrid search
- Create ranking algorithm
- Integrate with frontend
- Test search relevance

### Phase 5: Continuous Learning (Week 8-9)
- Implement user interaction tracking
- Create preference vector updates
- Set up A/B testing framework
- Monitor and refine algorithms

## Conclusion

This AI integration strategy provides a comprehensive approach to incorporating AI capabilities into the Grantify.ai platform. By following this strategy, we can create a powerful, personalized grant recommendation system that continuously improves based on user interactions.

The implementation will be phased to allow for testing and refinement at each stage, ensuring that the AI components are reliable, performant, and cost-effective. Regular monitoring and evaluation will help identify areas for improvement and ensure that the AI features are providing value to users.
