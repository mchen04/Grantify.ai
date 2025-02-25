const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { initCronJobs } = require('./utils/cronJobs');

// Load environment variables
dotenv.config();

// Create Express server
const app = express();
const port = process.env.PORT || 3001;

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

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Grantify.ai API',
    version: '1.0.0',
    status: 'running'
  });
});

// API routes
app.get('/api/grants', (req, res) => {
  res.json({
    message: 'Grants endpoint',
    grants: []
  });
});

app.get('/api/grants/recommended', (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  res.json({
    message: `Recommended grants for user: ${userId}`,
    grants: []
  });
});

app.get('/api/grants/:id', (req, res) => {
  const grantId = req.params.id;
  
  res.json({
    message: `Grant with ID: ${grantId}`,
    grant: { id: grantId }
  });
});

app.get('/api/users/preferences', (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  res.json({
    message: `Preferences for user: ${userId}`,
    preferences: {}
  });
});

app.post('/api/users/preferences', (req, res) => {
  const userId = req.body.userId;
  const preferences = req.body.preferences;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  if (!preferences) {
    return res.status(400).json({ message: 'Preferences are required' });
  }
  
  res.json({
    message: `Updated preferences for user: ${userId}`,
    preferences
  });
});

app.post('/api/users/interactions', (req, res) => {
  const interaction = req.body;
  
  if (!interaction.user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  if (!interaction.grant_id) {
    return res.status(400).json({ message: 'Grant ID is required' });
  }
  
  if (!interaction.action) {
    return res.status(400).json({ message: 'Action is required' });
  }
  
  res.json({
    message: `Recorded interaction for user: ${interaction.user_id}`,
    interaction
  });
});

// Admin routes for grants pipeline
app.get('/api/admin/pipeline/status', (req, res) => {
  res.json({
    message: 'Pipeline status',
    status: 'idle',
    lastRun: null
  });
});

app.post('/api/admin/pipeline/run', (req, res) => {
  // This would trigger a manual run of the grants pipeline
  // For now, just return a success message
  res.json({
    message: 'Pipeline run triggered',
    status: 'running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;