/**
 * Application configuration
 */
export default {
  // Server configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || ''
  },
  
  // Redis configuration for caching
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    ttl: parseInt(process.env.REDIS_TTL || '3600'), // Default TTL: 1 hour
    ttlValues: {
      grant: parseInt(process.env.REDIS_TTL_GRANT || '3600'), // 1 hour
      search: parseInt(process.env.REDIS_TTL_SEARCH || '300'), // 5 minutes
      recommendation: parseInt(process.env.REDIS_TTL_RECOMMENDATION || '86400') // 24 hours
    }
  },
  
  // MeiliSearch configuration
  meilisearch: {
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY || '',
    indexPrefix: process.env.MEILISEARCH_INDEX_PREFIX || ''
  },
  
  // Grants.gov API configuration
  grantsGov: {
    baseUrl: 'https://www.grants.gov/grantsws/rest',
    extractUrl: 'https://www.grants.gov/extract/',
    extractV2Url: 'https://www.grants.gov/xml-extract/XMLExtract_Public.zip',
    userAgent: 'Grantify.ai/1.0'
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    directory: process.env.LOG_DIR || './logs'
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100') // 100 requests per windowMs
  },
  
  // Recommendation engine configuration
  recommendations: {
    // Number of grants to recommend per user
    limit: parseInt(process.env.RECOMMENDATION_LIMIT || '20'),
    // Minimum similarity score (0-1) for a grant to be recommended
    minScore: parseFloat(process.env.RECOMMENDATION_MIN_SCORE || '0.3'),
    // Weights for different factors in recommendation algorithm
    weights: {
      categoryMatch: parseFloat(process.env.RECOMMENDATION_WEIGHT_CATEGORY || '0.4'),
      agencyMatch: parseFloat(process.env.RECOMMENDATION_WEIGHT_AGENCY || '0.2'),
      fundingMatch: parseFloat(process.env.RECOMMENDATION_WEIGHT_FUNDING || '0.2'),
      eligibilityMatch: parseFloat(process.env.RECOMMENDATION_WEIGHT_ELIGIBILITY || '0.2')
    }
  }
};