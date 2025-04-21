# Security Implementation Guide

This document outlines the security measures implemented in the Grantify.ai application to protect user data and ensure secure operations.

## Authentication & Authorization

### Backend Authentication Middleware

We've implemented a robust authentication middleware that verifies Supabase JWT tokens for all protected routes:

```typescript
// auth.middleware.ts
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
    }
    
    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    
    // Add user to request object
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

### User-Specific Authorization

We've added an authorization middleware to ensure users can only access their own data:

```typescript
export const authorizeUserMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestedUserId = req.params.userId || req.query.userId || req.body.userId;
  
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: Authentication required' });
  }
  
  if (requestedUserId && req.user.id !== requestedUserId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own data' });
  }
  
  next();
};
```

### Admin Route Protection

Admin routes are protected with both authentication and role-based authorization:

```typescript
adminRouter.get('/pipeline/status', authMiddleware, (req: Request, res: Response) => {
  // Check if user has admin role
  const user = req.user;
  if (!user || !user.email || user.email !== 'admin@grantify.ai') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  
  // Admin-only code here
});
```

## API and Backend Security

### Input Validation

We've implemented comprehensive input validation using express-validator:

```typescript
export const userPreferencesValidation = [
  body('preferences').isObject().withMessage('Preferences must be an object'),
  body('preferences.topics').optional().isArray().withMessage('Topics must be an array'),
  body('preferences.funding_min').optional().isInt({ min: 0 }).withMessage('Funding minimum must be a positive integer'),
  // Additional validation rules...
  validateRequest
];
```

### Rate Limiting

Rate limiting has been implemented to protect against brute-force attacks and DoS:

```typescript
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

// Stricter limits for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  // Additional configuration...
});
```

### CORS Configuration

CORS has been configured with more restrictive options:

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://grantify.ai', 'https://www.grantify.ai']
    : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

## Frontend Security

### Content Security Policy

We've implemented a Content Security Policy via Next.js middleware:

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} ${process.env.NEXT_PUBLIC_API_URL};
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
  `.replace(/\s+/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  // Additional security headers...

  return response;
}
```

## Logging and Monitoring

### Structured Logging

We've implemented structured logging with Winston:

```typescript
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'grantify-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ]
});
```

### Security Event Logging

We've added specific logging for security-related events:

```typescript
export const logSecurityEvent = (userId: string | null, action: string, details: any) => {
  logger.info('Security event', {
    userId,
    action,
    details,
    timestamp: new Date().toISOString()
  });
};
```

### Error Handling

We've enhanced error handling to provide better security and debugging:

```typescript
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Server error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || 'unauthenticated'
  });
  
  const errorResponse: ErrorResponse = {
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : {
      message: err.message,
      stack: err.stack
    }
  };
  
  res.status(500).json(errorResponse);
});
```

## Database Security

The application continues to leverage Supabase Row Level Security (RLS) policies to ensure data access control at the database level.

## Deployment Considerations

1. **Environment Variables**: Ensure all sensitive configuration is stored in environment variables.
2. **HTTPS**: Always use HTTPS in production environments.
3. **Regular Updates**: Keep all dependencies updated to patch security vulnerabilities.
4. **Security Audits**: Conduct regular security audits of the codebase.

## AI Integration Security

### API Key Management

We securely manage API keys for our AI integrations:

```typescript
// Environment variables for API keys
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Never expose API keys to the client
if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not found in environment variables. Gemini text cleaning will not work.');
}
```

### Rate Limiting for AI Services

We've implemented sophisticated rate limiting for the Gemini API to prevent quota issues:

```typescript
// Rate limiting for Gemini API
private maxRequestsPerMinute: number = 25; // Stay under 30 RPM limit
private maxRequestsPerDay: number = 1400; // Stay under 1,500 RPD limit
private requestsThisMinute: number = 0;
private dailyRequestCount: number = 0;
private minuteStartTime: number = Date.now();
private dayStartTime: number = Date.now();

// Check and reset rate limit counters
const now = Date.now();
      
// Reset minute counter if a minute has passed
if (now - this.minuteStartTime >= 60000) {
  this.requestsThisMinute = 0;
  this.minuteStartTime = now;
}

// Reset daily counter if a day has passed
if (now - this.dayStartTime >= 86400000) {
  this.dailyRequestCount = 0;
  this.dayStartTime = now;
}
```

### Error Handling for AI Services

We've implemented robust error handling for AI service calls:

```typescript
private async retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }
      const delay = initialDelay * Math.pow(2, retries);
      console.log(`Request failed, retrying in ${delay}ms...`);
      await this.sleep(delay);
      retries++;
    }
  }
}
```

## Future Enhancements

1. **Two-Factor Authentication**: Implement 2FA for additional account security.
2. **Security Headers**: Add additional security headers like HSTS.
3. **API Key Rotation**: Implement automatic rotation of API keys.
4. **Penetration Testing**: Conduct regular penetration testing.
5. **AI Service Fallbacks**: Implement additional fallback mechanisms for AI services.