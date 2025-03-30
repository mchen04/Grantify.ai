import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import { initCronJobs } from './utils/cronJobs';
import grantsRouter from './routes/grants.route';
import usersRouter from './routes/users.route';
import logger, { logApiRequest } from './utils/logger';
import { apiLimiter, authLimiter } from './middleware/rate-limit.middleware';
import path from 'path';
import fs from 'fs';

// Create Express server
const app = express();
const port = process.env.PORT || 3001;

// Interface for error responses
interface ErrorResponse {
  message: string;
  error?: any;
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
// Apply CORS with more restrictive options
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://grantify.ai', 'https://www.grantify.ai']
    : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// Logging
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) }
}));

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiting to all routes
app.use(apiLimiter);

// Custom request logger
app.use((req, res, next) => {
  logApiRequest(req, res);
  next();
});

// Initialize cron jobs if enabled
if (process.env.ENABLE_CRON_JOBS === 'true') {
  initCronJobs();
  console.log('Cron jobs initialized');
} else {
  console.log('Cron jobs disabled. Set ENABLE_CRON_JOBS=true to enable.');
}

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Grantify.ai API',
    version: '1.0.0',
    status: 'running'
  });
});

// API routes
app.use('/api/grants', grantsRouter);
app.use('/api/users', usersRouter);

// Import auth middleware
import { authMiddleware } from './middleware/auth.middleware';

// Admin routes with stricter rate limiting and authentication
const adminRouter = express.Router();
app.use('/api/admin', authLimiter, adminRouter);

// Admin routes for grants pipeline (protected)
adminRouter.get('/pipeline/status', authMiddleware, (req: Request, res: Response) => {
  // Check if user has admin role
  const user = req.user;
  if (!user || !user.email || user.email !== 'admin@grantify.ai') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  
  logger.info('Admin accessed pipeline status', { userId: user.id });
  
  res.json({
    message: 'Pipeline status',
    status: 'idle',
    lastRun: null
  });
});

adminRouter.post('/pipeline/run', authMiddleware, (req: Request, res: Response) => {
  // Check if user has admin role
  const user = req.user;
  if (!user || !user.email || user.email !== 'admin@grantify.ai') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  
  logger.info('Admin triggered pipeline run', { userId: user.id });
  
  // This would trigger a manual run of the grants pipeline
  // For now, just return a success message
  res.json({
    message: 'Pipeline run triggered',
    status: 'running'
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  // Log the error with request details
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

// Start server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`, {
    environment: process.env.NODE_ENV || 'development',
    port,
    timestamp: new Date().toISOString()
  });
});

export default app;