-- Create scraper_history_tiktok table to persist search results
CREATE TABLE IF NOT EXISTS scraper_history_tiktok (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    username TEXT,
    kol_name TEXT,
    tt_followers BIGINT,
    avg_views BIGINT,
    status TEXT DEFAULT 'New',
    tier TEXT,
    tiktok TEXT,
    avatar TEXT,
    contact TEXT,
    email TEXT,
    er NUMERIC,
    profile_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    category TEXT,
    region TEXT,
    segment TEXT
);
