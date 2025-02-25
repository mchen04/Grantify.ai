# Supabase Setup Guide for Grantify.ai

This guide outlines the steps to set up Supabase for the Grantify.ai project, including database configuration, authentication, and security policies.

## 1. Create a Supabase Account and Project

1. Go to [Supabase](https://supabase.com/) and sign up for an account if you don't have one already.
2. Once logged in, create a new project:
   - Click "New Project"
   - Enter a name (e.g., "Grantify")
   - Choose a database password (save this securely)
   - Select a region closest to your users
   - Click "Create new project"

## 2. Get Your API Keys

After your project is created:

1. Go to the project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - **URL**: Your Supabase project URL
   - **anon public key**: Your anonymous API key

## 3. Update Environment Variables

Add these values to your environment files:

### Frontend (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env)

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

Note: The service key is different from the anon key. You can find it in the same API settings page.

## 4. Set Up Database Schema

We'll use the SQL schema we've already created. You can run this SQL in the Supabase SQL Editor:

1. Go to the SQL Editor in your Supabase dashboard
2. Create a new query
3. Paste the contents of `backend/src/db/schema.sql`
4. Run the query

Alternatively, you can use the Supabase CLI to apply migrations.

## 5. Configure Authentication

### Enable Email Authentication

1. Go to Authentication > Providers
2. Ensure "Email" is enabled
3. Configure settings as needed:
   - Disable email confirmations for development (optional)
   - Customize email templates if desired

### (Optional) Enable OAuth Providers

If you want to allow login with Google, GitHub, etc.:

1. Go to Authentication > Providers
2. Select the provider you want to enable
3. Follow the instructions to set up the OAuth credentials
4. Toggle the provider to "Enabled"

## 6. Set Up Row-Level Security (RLS)

Our schema already includes RLS policies, but ensure they're enabled:

1. Go to Database > Tables
2. For each table, check that RLS is enabled
3. Verify the policies match what's in our schema

## 7. Create Initial Data (Optional)

You may want to create some initial data for testing:

1. Go to the Table Editor
2. Add some sample grants
3. Create a test user account

## 8. Test the Connection

After setting up Supabase, test the connection:

```typescript
// In your frontend code
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test query
const { data, error } = await supabase.from('grants').select('*').limit(1);
console.log(data, error);
```

## 9. Implement Authentication UI

Now that Supabase is set up, you can implement the authentication UI using Supabase Auth components or custom components.

### Using Supabase Auth UI

```bash
# Install the Auth UI package
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

```typescript
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';

const LoginPage = () => {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providers={['google', 'github']}
    />
  );
};
```

## 10. Set Up User Management

After a user signs up, you'll need to:

1. Create a record in the `users` table
2. Initialize their preferences in the `user_preferences` table

This can be done using Supabase Functions or in your application code.

## Next Steps

After completing the Supabase setup:

1. Implement the signup and login pages
2. Create the user profile and preferences management
3. Implement the dashboard subpages (saved, applied, ignored grants)
4. Set up the data pipeline for extracting grant data
5. Integrate with an AI service for grant categorization