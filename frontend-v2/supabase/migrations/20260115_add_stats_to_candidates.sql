-- Add total_likes and total_videos to candidates_tiktok
ALTER TABLE candidates_tiktok
ADD COLUMN IF NOT EXISTS total_likes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_videos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_views BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS er NUMERIC DEFAULT 0;
