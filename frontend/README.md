# Grantify.ai Frontend

## Technology Stack
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Supabase Client

## Directory Structure
```
frontend/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # Reusable React components
│   │   ├── filters/   # Search filter components
│   │   ├── Layout/    # Layout components
│   │   └── search/    # Search-related components
│   ├── contexts/      # React context providers
│   ├── lib/           # Utility functions and API clients
│   ├── models/        # TypeScript interfaces
│   ├── types/         # Type definitions
│   └── utils/         # Helper functions
└── public/            # Static assets
```

## Features
- Server-side rendering
- Client-side navigation
- Real-time updates
- Responsive design
- Progressive web app
- SEO optimization
- Integration with multiple AI processing pipelines (OpenRouter, Gemini, No-AI)

## Components

### Core Components
- Layout - Base layout structure
- Navbar - Navigation component
- Footer - Footer component
- GrantCard - Grant display component

### Search Components
- SearchBar - Search input handling
- SearchResults - Results display
- SortAndFilterControls - Result filtering

### Filter Components
- ActiveFilters - Active filter display
- CostSharingFilter - Cost filter
- DeadlineFilter - Deadline filter
- FundingRangeFilter - Funding amount filter
- MultiSelect - Multi-option selector

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
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## State Management
- React Context for global state
- Local component state
- Supabase real-time subscriptions
- Form state management

## Styling
- Tailwind CSS for styling
- Custom theme configuration
- Responsive design system
- Dark mode support
- CSS modules for components

## Testing

### Unit Testing
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage
```

### End-to-End Testing
```bash
# Run E2E tests
npm run test:e2e
```

## Code Quality

### Linting
```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

### Type Checking
```bash
# Run TypeScript compiler
npm run type-check
```

### Formatting
```bash
# Format code with Prettier
npm run format
```

## Build and Deployment

### Building
```bash
# Build for production
npm run build

# Analyze bundle size
npm run analyze
```

### Static Export
```bash
# Generate static export
npm run export
```

## Performance Optimization
- Code splitting
- Image optimization
- Font optimization
- Bundle size analysis
- Lazy loading
- Caching strategies

## SEO
- Meta tags management
- Structured data
- Sitemap generation
- robots.txt configuration
- Open Graph tags

## Accessibility
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus management

## Browser Support
- Modern browsers
- Progressive enhancement
- Polyfill strategy
- Fallback components

## Error Handling
- Error boundaries
- Loading states
- Network error handling
- Form validation
- User feedback

## Security
- Content Security Policy
- XSS prevention
- CSRF protection
- Input sanitization
- Secure headers

## Documentation
- Component documentation
- API integration docs
- State management docs
- Styling guidelines
- Contribution guide

## Backend Integration

The frontend interacts with the backend API which provides:

- Grant data processed through multiple AI pipelines:
  - OpenRouter (Mistral) for text cleaning
  - Google Gemini for text cleaning with rate limiting
  - Basic processing without AI
- Search functionality with filters
- User preference management
- Personalized recommendations

For more details on the backend implementation, see the [backend README](../backend/README.md) and the [AI Integration Strategy](../docs/ai-integration-strategy.md).
