-- Add missing columns to scraper_history_tiktok
ALTER TABLE scraper_history_tiktok
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS total_likes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_videos BIGINT DEFAULT 0;
