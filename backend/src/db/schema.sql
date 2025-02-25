-- Grants.ai Database Schema

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Grants Table
CREATE TABLE IF NOT EXISTS grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  opportunity_id TEXT UNIQUE NOT NULL,
  opportunity_number TEXT,
  category TEXT,
  funding_type TEXT,
  activity_category TEXT[],
  eligible_applicants TEXT[],
  agency_name TEXT,
  post_date TIMESTAMP WITH TIME ZONE,
  close_date TIMESTAMP WITH TIME ZONE,
  total_funding INTEGER,
  award_ceiling INTEGER,
  award_floor INTEGER,
  cost_sharing BOOLEAN DEFAULT FALSE,
  description TEXT,
  additional_info_url TEXT,
  grantor_contact_name TEXT,
  grantor_contact_email TEXT,
  grantor_contact_phone TEXT,
  embeddings VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS grants_close_date_idx ON grants(close_date);
CREATE INDEX IF NOT EXISTS grants_agency_name_idx ON grants(agency_name);
CREATE INDEX IF NOT EXISTS grants_category_idx ON grants(category);
CREATE INDEX IF NOT EXISTS grants_activity_category_idx ON grants USING GIN(activity_category);
CREATE INDEX IF NOT EXISTS grants_eligible_applicants_idx ON grants USING GIN(eligible_applicants);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS grants_embeddings_idx ON grants USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);

-- Users Table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  topics TEXT[],
  funding_min INTEGER,
  funding_max INTEGER,
  eligible_applicant_types TEXT[],
  agencies TEXT[],
  locations TEXT[],
  preference_vector VECTOR(1536),
  notification_settings JSONB DEFAULT '{"email_frequency": "weekly", "notify_new_matches": true, "notify_deadlines": true}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Interactions Table
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  grant_id UUID NOT NULL REFERENCES grants(id),
  action TEXT NOT NULL CHECK (action IN ('saved', 'applied', 'ignored')),
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, grant_id, action)
);

-- Create indexes for user interactions
CREATE INDEX IF NOT EXISTS user_interactions_user_id_idx ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS user_interactions_grant_id_idx ON user_interactions(grant_id);
CREATE INDEX IF NOT EXISTS user_interactions_action_idx ON user_interactions(action);

-- Pipeline Runs Table (for monitoring data pipeline)
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

-- Grants policies
CREATE POLICY grants_select_policy ON grants
  FOR SELECT USING (true);  -- Anyone can read grants

-- Users policies
CREATE POLICY users_select_self ON users
  FOR SELECT USING (auth.uid() = id);  -- Users can only read their own data

CREATE POLICY users_update_self ON users
  FOR UPDATE USING (auth.uid() = id);  -- Users can only update their own data

-- User preferences policies
CREATE POLICY user_preferences_select_self ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);  -- Users can only read their own preferences

CREATE POLICY user_preferences_insert_self ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);  -- Users can only insert their own preferences

CREATE POLICY user_preferences_update_self ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);  -- Users can only update their own preferences

-- User interactions policies
CREATE POLICY user_interactions_select_self ON user_interactions
  FOR SELECT USING (auth.uid() = user_id);  -- Users can only read their own interactions

CREATE POLICY user_interactions_insert_self ON user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);  -- Users can only insert their own interactions

CREATE POLICY user_interactions_update_self ON user_interactions
  FOR UPDATE USING (auth.uid() = user_id);  -- Users can only update their own interactions

-- Pipeline runs policies (admin only)
CREATE POLICY pipeline_runs_admin_only ON pipeline_runs
  USING (auth.uid() IN (SELECT id FROM users WHERE email IN ('admin@grantify.ai')));

-- Functions and Triggers

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at column for grants
CREATE TRIGGER update_grants_updated_at
BEFORE UPDATE ON grants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update the updated_at column for users
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update the updated_at column for user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to create a user record when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create a user record when a new auth user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();