# Getting Started with Grantify.ai

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (via Supabase)
- Git

## Repository Setup

```bash
# Clone the repository
git clone https://github.com/your-org/grantify.ai.git
cd grantify.ai

# Install dependencies for both frontend and backend
npm install
cd frontend && npm install
cd ../backend && npm install
```

## Environment Configuration

### Frontend Configuration
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend Configuration
Create a `.env` file in the backend directory:
```env
DATABASE_URL=your_supabase_connection_string
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3001
NODE_ENV=development
OPENROUTER_API_KEY=your_openrouter_api_key
GEMINI_API_KEY=your_gemini_api_key
```

You can obtain a Gemini API key from the [Google AI Studio](https://ai.google.dev/).

## Database Setup
1. Set up a Supabase project
2. Run the database migrations:
```bash
cd backend
npm run db:migrate
```

## Running the Application

### Development Mode
1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend application:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build
1. Build the backend:
```bash
cd backend
npm run build
```

2. Build the frontend:
```bash
cd frontend
npm run build
```

## Testing
- Run backend tests:
```bash
cd backend
npm test
```

- Run frontend tests:
```bash
cd frontend
npm test
```

## Development Tools
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type checking
- Jest for testing

## Common Development Tasks

### Code Formatting
```bash
npm run format
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

## Troubleshooting

### Common Issues
1. Database connection errors
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure proper environment variables

2. Build errors
   - Clear node_modules and reinstall
   - Update dependencies
   - Check TypeScript errors

3. Runtime errors
   - Check console logs
   - Verify API endpoints
   - Validate environment variables

## Additional Resources
- [Supabase Documentation](https://supabase.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)