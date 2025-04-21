-- Add processing_status and source columns to grants table
ALTER TABLE grants 
ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'not_processed' 
  CHECK (processing_status IN ('processed', 'not_processed'));

ALTER TABLE grants 
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'grants.gov';

-- Create index for the new columns
CREATE INDEX IF NOT EXISTS grants_processing_status_idx ON grants(processing_status);
CREATE INDEX IF NOT EXISTS grants_source_idx ON grants(source);

-- Add comment to explain the schema changes
COMMENT ON COLUMN grants.processing_status IS 'Indicates whether the grant has been processed by AI for text cleaning';
COMMENT ON COLUMN grants.source IS 'Indicates the source of the grant data (e.g., grants.gov, Horizon Europe)';