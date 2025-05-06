import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}

// Create Supabase client with explicit auth context for service_role
// Using the most direct approach to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      // Set the Authorization header to use the service role key
      Authorization: `Bearer ${supabaseKey}`,
      // Explicitly set the role to service_role
      'X-Client-Info': 'service_role'
    }
  }
});

// Log that we're using the service role key
console.log('Supabase client initialized with service_role key');

export default supabase;