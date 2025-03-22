-- AI Text Cleaning Logs Table
CREATE TABLE IF NOT EXISTS ai_cleaning_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grant_id UUID REFERENCES grants(id),
  content_type TEXT NOT NULL CHECK (content_type IN ('description', 'contact_name')),
  original_text TEXT NOT NULL,
  cleaned_text TEXT NOT NULL,
  cleaning_steps JSONB NOT NULL, -- Store basic cleaning and AI cleaning results
  ai_instructions TEXT NOT NULL, -- Store the instructions used
  batch_id UUID, -- NULL for single texts, UUID for batched texts
  processing_time INTEGER, -- in milliseconds
  token_count INTEGER,
  cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ai_cleaning_logs_grant_id_idx ON ai_cleaning_logs(grant_id);
CREATE INDEX IF NOT EXISTS ai_cleaning_logs_content_type_idx ON ai_cleaning_logs(content_type);
CREATE INDEX IF NOT EXISTS ai_cleaning_logs_batch_id_idx ON ai_cleaning_logs(batch_id);

-- Enable RLS
ALTER TABLE ai_cleaning_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY ai_cleaning_logs_select_policy ON ai_cleaning_logs
  FOR SELECT USING (true);