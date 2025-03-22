import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import { initCronJobs } from './utils/cronJobs';
import grantsRouter from './routes/grants.route';
import usersRouter from './routes/users.route';

// Create Express server
const app = express();
const port = process.env.PORT || 3001;

// Interface for error responses
interface ErrorResponse {
  message: string;
  error?: any;
}

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Admin routes for grants pipeline
app.get('/api/admin/pipeline/status', (_req: Request, res: Response) => {
  res.json({
    message: 'Pipeline status',
    status: 'idle',
    lastRun: null
  });
});

app.post('/api/admin/pipeline/run', (_req: Request, res: Response) => {
  // This would trigger a manual run of the grants pipeline
  // For now, just return a success message
  res.json({
    message: 'Pipeline run triggered',
    status: 'running'
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  const errorResponse: ErrorResponse = {
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  };
  res.status(500).json(errorResponse);
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;