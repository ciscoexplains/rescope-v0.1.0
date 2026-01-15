-- Update candidates_tiktok table schema
ALTER TABLE candidates_tiktok
ADD COLUMN IF NOT EXISTS profile_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS segment TEXT;

-- Verify columns exist (optional check)
-- SELECT * FROM candidates_tiktok LIMIT 1;
