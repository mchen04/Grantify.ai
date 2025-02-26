-- Update funding fields to use bigint instead of integer to handle large funding amounts
ALTER TABLE grants ALTER COLUMN total_funding TYPE bigint;
ALTER TABLE grants ALTER COLUMN award_ceiling TYPE bigint;
ALTER TABLE grants ALTER COLUMN award_floor TYPE bigint;

-- Add an index on opportunity_id for faster lookups
CREATE INDEX IF NOT EXISTS grants_opportunity_id_idx ON grants(opportunity_id);

-- Add agency_code column if it doesn't exist
ALTER TABLE grants ADD COLUMN IF NOT EXISTS agency_code TEXT;