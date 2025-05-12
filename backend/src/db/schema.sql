-- Grants.ai Database Schema SQL Script

-- ========= Extensions =========
-- Enable necessary extensions if they are not already enabled.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========= Tables =========

-- Grants Table (Core grant information)
CREATE TABLE IF NOT EXISTS grants (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),                          -- Grant_ID (Internal Primary Key)
  opportunity_id TEXT UNIQUE NOT NULL,                                    -- Funding_Opportunity_Number (Official Unique ID)
  opportunity_number TEXT,                                                -- Often synonymous with opportunity_id, but sometimes different (e.g., CFDA)

  -- Core Details
  title TEXT NOT NULL,                                                    -- Grant_Title
  description_short TEXT,                                                 -- Grant_Description_Short (Brief Summary - for list view)
  description_full TEXT,                                                  -- Grant_Description_Full (Full Description - for detail view)
  keywords TEXT[],                                                        -- Focus_Area / Keywords (Using array for multiple)
  category TEXT,                                                          -- Broad category (Retained from original, might overlap keywords)

  -- Agency Information
  agency_name TEXT,                                                       -- Funding_Agency
  agency_subdivision TEXT,                                                -- Agency_Subdivision
  agency_code TEXT,                                                       -- Agency Code (Retained from original)

  -- Source & Status
  source_url TEXT,                                                        -- Source_URL (Link to official announcement) - Renamed from additional_info_url
  data_source TEXT,                                                       -- Data_Source (Where the data originated, e.g., 'Grants.gov XML Feed', 'Manual Entry')
  status TEXT,                                                            -- Status (e.g., 'Forecasted', 'Posted', 'Closed', 'Archived') - Consider CHECK constraint or ENUM

  -- Dates
  post_date TIMESTAMP WITH TIME ZONE,                                     -- Open_Date (When the grant was posted/announced)
  close_date TIMESTAMP WITH TIME ZONE,                                    -- Application_Due_Date
  loi_due_date TIMESTAMP WITH TIME ZONE,                                  -- Letter_of_Intent_Due_Date (Nullable)
  expiration_date TIMESTAMP WITH TIME ZONE,                               -- Expiration_Date (When the announcement itself expires, might differ from close_date) (Nullable)
  earliest_start_date TIMESTAMP WITH TIME ZONE,                           -- Earliest_Start_Date (Nullable)

  -- Funding Details
  total_funding BIGINT,                                                   -- Estimated_Total_Program_Funding
  award_ceiling BIGINT,                                                   -- Funding_Amount_Ceiling
  award_floor BIGINT,                                                     -- Funding_Amount_Floor
  expected_award_count INTEGER,                                           -- Expected_Number_of_Awards (Nullable)

  -- Project & Cost Details
  project_period_max_years INTEGER,                                       -- Project_Period_Max_Years (Nullable)
  cost_sharing BOOLEAN DEFAULT FALSE,                                     -- Cost_Sharing_Required

  -- Eligibility
  eligible_applicants TEXT[],                                             -- Eligibility_Organizations (Retained from original)
  eligibility_pi TEXT,                                                    -- Eligibility_PI (Descriptive text, Nullable)

  -- Grant Type & Activity Details
  grant_type TEXT,                                                        -- Activity_Code / Grant_Type (Primary Type) - Renamed from funding_type
  activity_code TEXT,                                                     -- Activity_Code (Specific code if available, Nullable)
  activity_category TEXT[],                                               -- Activity Category (Retained from original, broader activities)
  announcement_type TEXT,                                                 -- Announcement_Type (e.g., 'New', 'Continuation', 'Revision') (Nullable)
  clinical_trial_allowed BOOLEAN,                                         -- Clinical_Trial_Allowed (Null indicates unknown, True/False if specified)

  -- Contact Information
  grantor_contact_name TEXT,                                              -- Contact_Name
  grantor_contact_role TEXT,                                              -- Contact_Role (Nullable)
  grantor_contact_email TEXT,                                             -- Contact_Email
  grantor_contact_phone TEXT,                                             -- Contact_Phone
  grantor_contact_affiliation TEXT,                                       -- Contact_Affiliation (Nullable)

  -- Additional Information & AI Features
  additional_notes TEXT,                                                  -- Additional_Notes / Key_Info_Highlight (Concise flags/notes) (Nullable)
  embeddings VECTOR(768),                                                 -- Embeddings for semantic search (Dimension matches Gemini)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),                          -- Links to Supabase auth user ID
  email TEXT NOT NULL UNIQUE,                                             -- Ensure email is unique here too for easier reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint explicitly if not handled by CREATE TABLE UNIQUE ( belt-and-suspenders )
ALTER TABLE users ADD CONSTRAINT users_email_unique_constraint UNIQUE (email);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,        -- References users table, cascade delete
  topics TEXT[],                                                          -- Might align with grants.keywords or grants.category
  funding_min INTEGER,
  funding_max INTEGER,
  deadline_range TEXT DEFAULT '0',                                        -- Consider changing type if '0' isn't descriptive
  eligible_applicant_types TEXT[],                                        -- Aligns with grants.eligible_applicants
  agencies TEXT[],                                                        -- Aligns with grants.agency_name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Interactions Table
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,           -- References users table, cascade delete
  grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,           -- References grants table, cascade delete
  action TEXT NOT NULL CHECK (action IN ('saved', 'applied', 'ignored')), -- Ensure valid action types
  notes TEXT,                                                             -- User notes for this interaction
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, grant_id, action)                                       -- Prevents duplicate actions per user/grant
);

-- Pipeline Runs Table (for monitoring data pipeline)
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')), -- Ensure valid status types
  details JSONB,                                                          -- Store run details (e.g., errors, counts)
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ========= Indexes =========

-- Indexes for Grants table
CREATE INDEX IF NOT EXISTS grants_close_date_idx ON grants(close_date);
CREATE INDEX IF NOT EXISTS grants_post_date_idx ON grants(post_date);
CREATE INDEX IF NOT EXISTS grants_agency_name_idx ON grants(agency_name);
CREATE INDEX IF NOT EXISTS grants_agency_subdivision_idx ON grants(agency_subdivision);
CREATE INDEX IF NOT EXISTS grants_category_idx ON grants(category);
CREATE INDEX IF NOT EXISTS grants_keywords_idx ON grants USING GIN(keywords);          -- GIN for text array
CREATE INDEX IF NOT EXISTS grants_status_idx ON grants(status);
CREATE INDEX IF NOT EXISTS grants_grant_type_idx ON grants(grant_type);
CREATE INDEX IF NOT EXISTS grants_activity_category_idx ON grants USING GIN(activity_category); -- GIN for text array
CREATE INDEX IF NOT EXISTS grants_eligible_applicants_idx ON grants USING GIN(eligible_applicants); -- GIN for text array
CREATE INDEX IF NOT EXISTS grants_opportunity_id_idx ON grants(opportunity_id);      -- Keep index on unique ID

-- Index for vector similarity search on Grants embeddings
-- Using IVFFlat, consider HNSW for larger datasets.
-- Note: Recreate this index if embedding dimensions change.
-- DROP INDEX IF EXISTS grants_embeddings_idx; -- Uncomment to force recreation if needed
CREATE INDEX IF NOT EXISTS grants_embeddings_idx ON grants USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);
-- Alternative HNSW index:
-- CREATE INDEX IF NOT EXISTS grants_embeddings_hnsw_idx ON grants USING hnsw (embeddings vector_cosine_ops);

-- Indexes for User Interactions table
CREATE INDEX IF NOT EXISTS user_interactions_user_id_idx ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS user_interactions_grant_id_idx ON user_interactions(grant_id);
CREATE INDEX IF NOT EXISTS user_interactions_action_idx ON user_interactions(action);


-- ========= Functions and Triggers =========

-- Function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW(); -- Set updated_at to the current time
  RETURN NEW;             -- Return the modified row
END;
$$ LANGUAGE plpgsql;

-- Trigger for grants table to update updated_at on modification
DROP TRIGGER IF EXISTS update_grants_updated_at ON grants; -- Drop if exists to avoid errors on re-run
CREATE TRIGGER update_grants_updated_at
BEFORE UPDATE ON grants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table to update updated_at on modification
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_preferences table to update updated_at on modification
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to create a public.users record when a new auth.users is created (Supabase specific)
-- SECURITY DEFINER is often needed for a trigger in the 'auth' schema to insert into the 'public' schema.
-- Review your security model to ensure this is appropriate.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user's ID and email into the public users table
  -- Use ON CONFLICT DO NOTHING to safely handle potential duplicate calls or race conditions.
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table to call handle_new_user after a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Optional: Grant execute permission on the function if needed.
-- The role executing the trigger (often 'postgres' or 'supabase_admin' due to SECURITY DEFINER) needs execute permission.
-- GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres; -- Adjust role if different


-- ========= Row Level Security (RLS) Policies =========

-- Enable RLS on all relevant tables
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY; -- Be cautious with access control here

-- Force RLS for tables containing user data (prevents access if no policies match)
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE user_preferences FORCE ROW LEVEL SECURITY;
ALTER TABLE user_interactions FORCE ROW LEVEL SECURITY;

-- --- Grants Policies ---
-- Policy: Anyone can read grants (public data)
DROP POLICY IF EXISTS grants_select_policy ON grants;
CREATE POLICY grants_select_policy ON grants
  FOR SELECT USING (true); -- Allows SELECT for all roles/users

-- --- Users Policies ---
-- Policy: Users can select their own user record
DROP POLICY IF EXISTS users_select_self ON users;
CREATE POLICY users_select_self ON users
  FOR SELECT USING (auth.uid() = id); -- Only allow selecting the row where the user's UID matches the id

-- Policy: Allow the handle_new_user trigger function (running as SECURITY DEFINER) to insert new rows
DROP POLICY IF EXISTS users_allow_trigger_insert ON users;
CREATE POLICY users_allow_trigger_insert ON users
  FOR INSERT WITH CHECK (true); -- Very permissive for INSERT; relies on trigger security. Consider role-based check if needed.

-- Policy: Users can update their own user record
DROP POLICY IF EXISTS users_update_self ON users;
CREATE POLICY users_update_self ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id); -- Allow user to update only their own row

-- --- User Preferences Policies ---
-- Policy: Users can select their own preferences
DROP POLICY IF EXISTS user_preferences_select_self ON user_preferences;
CREATE POLICY user_preferences_select_self ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
DROP POLICY IF EXISTS user_preferences_insert_self ON user_preferences;
CREATE POLICY user_preferences_insert_self ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id); -- Ensure user_id matches the authenticated user on insert

-- Policy: Users can update their own preferences
DROP POLICY IF EXISTS user_preferences_update_self ON user_preferences;
CREATE POLICY user_preferences_update_self ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
DROP POLICY IF EXISTS user_preferences_delete_self ON user_preferences;
CREATE POLICY user_preferences_delete_self ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- --- User Interactions Policies ---
-- Policy: Users can select their own interactions
DROP POLICY IF EXISTS user_interactions_select_self ON user_interactions;
CREATE POLICY user_interactions_select_self ON user_interactions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own interactions
DROP POLICY IF EXISTS user_interactions_insert_self ON user_interactions;
CREATE POLICY user_interactions_insert_self ON user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id); -- Ensure user_id matches the authenticated user

-- Policy: Users can update their own interactions (e.g., changing notes)
DROP POLICY IF EXISTS user_interactions_update_self ON user_interactions;
CREATE POLICY user_interactions_update_self ON user_interactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own interactions
DROP POLICY IF EXISTS user_interactions_delete_self ON user_interactions;
CREATE POLICY user_interactions_delete_self ON user_interactions
  FOR DELETE USING (auth.uid() = user_id);

-- --- Pipeline Runs Policies ---
-- Policy: Restrict access to pipeline runs (e.g., service role or specific admin UIDs)
-- WARNING: Hardcoding emails/UIDs is generally discouraged. Use roles or claims if possible.
DROP POLICY IF EXISTS pipeline_runs_admin_only ON pipeline_runs;
CREATE POLICY pipeline_runs_admin_only ON pipeline_runs
  FOR ALL -- Apply to SELECT, INSERT, UPDATE, DELETE
  USING (
    auth.role() = 'service_role'
    -- OR auth.uid() IN (SELECT id FROM users WHERE email = 'admin@grantify.ai') -- Example: Allow specific admin UID(s)
    -- OR (auth.jwt() ->> 'app_metadata')::jsonb ->> 'is_admin' = 'true' -- Preferred: Check custom claim
  )
  WITH CHECK (
    auth.role() = 'service_role'
    -- OR auth.uid() IN (SELECT id FROM users WHERE email = 'admin@grantify.ai') -- Example: Allow specific admin UID(s)
    -- OR (auth.jwt() ->> 'app_metadata')::jsonb ->> 'is_admin' = 'true' -- Preferred: Check custom claim
  );

-- Grant service_role full access to grants table for backend processes
DROP POLICY IF EXISTS grants_service_role_access ON grants;
CREATE POLICY grants_service_role_access ON grants
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ========= Table Privileges (Grants) =========

-- Grant necessary privileges to the 'authenticated' role for the user_preferences table.
-- This works in conjunction with RLS policies. RLS policies restrict *which rows*
-- can be accessed/modified by a user, while these GRANT statements provide the fundamental
-- permission for the 'authenticated' role to perform SELECT, INSERT, UPDATE, or DELETE
-- operations on the table itself. Both are often required for the 'authenticated' role.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_preferences TO authenticated;

-- Note: Similar grants might be needed for other tables like 'user_interactions' if they
-- are accessed by authenticated users and face similar permission issues.
-- For 'users' table, RLS policies allow self-select and self-update, and inserts are
-- handled by a trigger. Explicit grants to 'authenticated' might be redundant but
-- could be added if issues arise.
-- The 'grants' table is publicly readable via its RLS policy.


-- ========= End of Script =========