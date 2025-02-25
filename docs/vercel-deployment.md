# Vercel Deployment Guide for Grantify.ai

This guide outlines the steps to deploy the Grantify.ai frontend to Vercel.

## Overview

Grantify.ai is a monorepo with separate frontend and backend directories. For deployment, we'll use Vercel to host the Next.js frontend and a separate service (like Heroku, Railway, or a VPS) for the backend API.

## Deployment Configuration

### 1. Vercel Configuration

We've added a `vercel.json` file to the root of the project to configure the Vercel deployment:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm install",
  "framework": "nextjs"
}
```

This configuration tells Vercel to:
- Run the install command in the frontend directory
- Run the build command in the frontend directory
- Use the frontend/.next directory as the output directory
- Recognize the project as a Next.js project

### 2. Package.json Scripts

We've updated the root `package.json` to include separate build scripts:

```json
"scripts": {
  "build": "cd frontend && npm run build",
  "build:all": "cd frontend && npm run build && cd ../backend && npm run build"
}
```

- `npm run build`: Builds only the frontend (used by Vercel)
- `npm run build:all`: Builds both frontend and backend (used for full deployment)

## Deployment Steps

### 1. Deploy Frontend to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to Vercel and create a new project
3. Import your Git repository
4. Vercel will automatically detect the Next.js project and use the configuration from vercel.json
5. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous API key
   - `NEXT_PUBLIC_API_URL`: URL of your deployed backend API

### 2. Deploy Backend Separately

The backend needs to be deployed to a separate service that can run Node.js applications:

1. **Heroku**:
   ```bash
   cd backend
   heroku create
   git subtree push --prefix backend heroku main
   ```

2. **Railway**:
   - Create a new project in Railway
   - Connect your Git repository
   - Set the root directory to `/backend`
   - Configure environment variables

3. **VPS/Docker**:
   - Set up a VPS with Node.js
   - Clone the repository
   - Navigate to the backend directory
   - Install dependencies and start the server

### 3. Configure Environment Variables

Make sure to set the following environment variables in your backend deployment:

```
PORT=3001 (or let the platform set it)
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
ENABLE_CRON_JOBS=true
```

## Troubleshooting

### Common Deployment Issues

1. **Build Fails with "next: command not found"**:
   - This happens when Vercel tries to run the build command in the root directory
   - Solution: Use the vercel.json configuration to specify the correct build command

2. **API Connection Issues**:
   - Check that the `NEXT_PUBLIC_API_URL` environment variable is set correctly
   - Ensure CORS is properly configured in the backend

3. **Environment Variable Issues**:
   - Make sure all required environment variables are set in the Vercel dashboard
   - Check for typos in environment variable names

## Continuous Deployment

Vercel automatically deploys when you push to your Git repository. To set up continuous deployment for the backend:

1. Configure your CI/CD pipeline to deploy the backend when changes are pushed
2. Use branch protection rules to ensure only reviewed code is deployed

## Monitoring and Logs

- Use Vercel's built-in analytics and logs for the frontend
- Set up monitoring for the backend using the platform's tools or a service like New Relic or Datadog

## Next Steps

After deployment:

1. Set up a custom domain in Vercel
2. Configure SSL certificates
3. Set up monitoring and alerts
4. Implement a CI/CD pipeline for the backend