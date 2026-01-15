-- Add description column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN description text DEFAULT '';

COMMENT ON COLUMN campaigns.description IS 'Short description of the campaign';
