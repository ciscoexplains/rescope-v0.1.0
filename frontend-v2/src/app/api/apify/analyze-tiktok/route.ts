
import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const { profiles } = await req.json();

        if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
            return NextResponse.json({ error: 'Profiles array is required' }, { status: 400 });
        }

        // Limit to 5 results per page for analysis (stats based on recent 5 videos)
        const runInput = {
            "profiles": profiles,
            "profileScrapeSections": [
                "videos"
            ],
            // "profileSorting": "latest", // Not strictly supported by all actors but good intent
            "resultsPerPage": 5,
            "excludePinnedPosts": false,
            "shouldDownloadVideos": false,
            "shouldDownloadCovers": false,
            "shouldDownloadSubtitles": false,
            "shouldDownloadSlideshowImages": false,
            "shouldDownloadAvatars": false
        };

        // Run the Actor
        // Actor ID: 0FXVyOXXEmdGcV88a (TikTok Scraper)
        const run = await client.actor("0FXVyOXXEmdGcV88a").call(runInput);

        // Fetch results
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        // Process items to calculate Stats per profile
        // The output format usually contains one item per profile with a 'videos' array
        // OR one item per video if not grouped. 
        // Based on "profileScrapeSections": ["videos"], it likely returns profile objects with a 'videos' array nested.
        // Let's assume standard Apify TikTok Scraper (clockworks/tiktok-scraper or similar) output.
        // If it returns flat videos, we group by author.

        // Inspecting typical output for this actor (TikTok Scraper by Clockworks usually):
        // It returns one object per PROFILE if scrape sections are used, containing 'videos' array.

        const results: any = {};
        const profileMap: Map<string, { videos: any[], followers: number }> = new Map();

        items.forEach((item: any) => {
            // Try to find username
            const username = (item.name || item.uniqueId || item.authorMeta?.name || item.author?.uniqueId || '').toLowerCase();
            if (!username) return;

            if (!profileMap.has(username)) {
                profileMap.set(username, { videos: [], followers: 0 });
            }
            const profileData = profileMap.get(username)!;

            // Check if item is a profile with a 'videos' array
            if (Array.isArray(item.videos)) {
                profileData.videos.push(...item.videos);
                // Update followers if available and currently 0
                const followers = item.authorMeta?.fans || item.fans || item.stats?.followerCount || 0;
                if (followers > profileData.followers) profileData.followers = followers;
            }
            // Check if item is a video itself
            else if (item.playCount !== undefined || item.diggCount !== undefined) {
                profileData.videos.push(item);
                // Update followers if available (often in authorMeta for videos)
                const followers = item.authorMeta?.fans || item.author?.fans || 0;
                if (followers > profileData.followers) profileData.followers = followers;
            }
            // Fallback: check other profile fields if it's just a profile info scrape
            else if (item.stats || item.authorMeta) {
                const followers = item.stats?.followerCount || item.authorMeta?.fans || item.fans || 0;
                if (followers > profileData.followers) profileData.followers = followers;
            }
        });

        // Calculate stats for each profile
        profileMap.forEach((data, username) => {
            const videos = data.videos;
            const followers = data.followers;

            if (videos.length > 0) {
                let totalViews = 0;
                let totalInteractions = 0; // likes + comments + shares

                videos.forEach((video: any) => {
                    const playCount = video.playCount || 0;
                    const diggCount = video.diggCount || 0;
                    const commentCount = video.commentCount || 0;
                    const shareCount = video.shareCount || 0;

                    totalViews += playCount;
                    totalInteractions += (diggCount + commentCount); // User requested specific formula: Likes + Comments
                });

                const avgViews = Math.round(totalViews / videos.length);

                // ER Calculation: (Total Likes + Comments / Reach) x 100%
                // using Reach = Total Views of the analyzed videos
                let er = 0;
                if (totalViews > 0) {
                    er = (totalInteractions / totalViews) * 100;
                }

                results[username] = {
                    avg_views: avgViews,
                    er: parseFloat(er.toFixed(2)),
                    latest_videos_checked: videos.length
                };
            } else {
                // Return 0s if we found the profile but no videos (maybe private or error)
                results[username] = {
                    avg_views: 0,
                    er: 0,
                    latest_videos_checked: 0
                };
            }
        });

        return NextResponse.json({ results });

    } catch (error: any) {
        console.error("TikTok Analyze Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
