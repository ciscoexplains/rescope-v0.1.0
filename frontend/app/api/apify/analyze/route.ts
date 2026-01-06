import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function POST(req: Request) {
    try {
        const { profiles } = await req.json();

        if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
            return NextResponse.json({ error: 'Profiles list is required' }, { status: 400 });
        }

        const apifyToken = process.env.APIFY_API_TOKEN;
        if (!apifyToken) {
            console.error('APIFY_API_TOKEN is not set');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        const client = new ApifyClient({
            token: apifyToken,
        });

        // Prepare input for TikTok Scraper
        const input = {
            "excludePinnedPosts": false,
            "profiles": profiles, // Array of usernames
            "resultsPerPage": 12,
            "shouldDownloadAvatars": false,
            "shouldDownloadCovers": false,
            "shouldDownloadSlideshowImages": false,
            "shouldDownloadSubtitles": false,
            "shouldDownloadVideos": false,
        };

        console.log('Running Apify actor (0FXVyOXXEmdGcV88a) for analysis with input:', JSON.stringify(input, null, 2));

        // Run the Actor
        // Actor ID: 0FXVyOXXEmdGcV88a (TikTok Scraper)
        const run = await client.actor("0FXVyOXXEmdGcV88a").call(input);

        console.log('Actor finished. Fetching results from dataset:', run.defaultDatasetId);

        // Fetch results
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        // Process results to calculate metrics per profile
        const analysisResults = calculateMetrics(items, profiles);

        return NextResponse.json({ results: analysisResults });

    } catch (error: any) {
        console.error('Apify Analysis Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to analyze profiles'
        }, { status: 500 });
    }
}

function calculateMetrics(items: any[], requestedProfiles: string[]) {
    // Group videos by username
    const groupedData: Record<string, any[]> = {};

    // Initialize for requested profiles to ensure they appear in results even if no data found
    requestedProfiles.forEach(p => {
        groupedData[p.toLowerCase()] = [];
    });

    items.forEach(item => {
        // Handle both nested and flattened keys
        const username = (item.authorMeta?.name || item['authorMeta.name'])?.toLowerCase();

        if (username) {
            // Find the key in groupedData that matches this username (to handle case differences)
            const targetKey = Object.keys(groupedData).find(k => k.toLowerCase() === username);

            if (targetKey) {
                groupedData[targetKey].push(item);
            } else if (groupedData[username]) {
                groupedData[username].push(item);
            } else {
                // If the scraper returns a profile we didn't explicitly ask for (e.g. related), ignore or add?
                // For now, only track requested profiles, but we need to ensure we don't drop data due to case mismatch
                // If strict mismatch, maybe we add it dynamically?
                // GroupedData was initialized with requestedProfiles lowercased keys.
                // So targetKey check above should cover it.
                // If we are here, it means we have data for a user we didn't initialize?
                // Let's add it just in case logic above failed
                if (!groupedData[username]) {
                    groupedData[username] = [];
                }
                groupedData[username].push(item);
            }
        }
    });

    const results = Object.keys(groupedData).map(username => {
        const videos = groupedData[username];
        if (videos.length === 0) {
            // Check if this username was one of the requested ones
            // Return error object if we expected data but got none
            return {
                username,
                error: 'No videos found or profile private',
                totalVideos: 0,
                totalViews: 0,
                avgViews: 0,
                totalInteractions: 0,
                erByViews: '0%',
                erByFollowers: '0%'
            };
        }

        // Sort by createTimeISO desc
        const sortedVideos = videos.sort((a, b) => {
            const dateA = new Date(a.createTimeISO || a['createTimeISO'] || 0).getTime();
            const dateB = new Date(b.createTimeISO || b['createTimeISO'] || 0).getTime();
            return dateB - dateA;
        });

        const recentVideos = sortedVideos.slice(0, 12);

        let totalViews = 0;
        let totalDiggs = 0;
        let totalComments = 0;
        let totalShares = 0;

        recentVideos.forEach(v => {
            totalViews += (v.playCount || v['playCount'] || 0);
            totalDiggs += (v.diggCount || v['diggCount'] || 0);
            totalComments += (v.commentCount || v['commentCount'] || 0);
            totalShares += (v.shareCount || v['shareCount'] || 0);
        });

        const totalVideos = recentVideos.length;
        const totalInteractions = totalDiggs + totalComments + totalShares;

        const avgViews = totalVideos > 0 ? totalViews / totalVideos : 0;

        const firstVid = recentVideos[0];
        const fans = firstVid.authorMeta?.fans || firstVid['authorMeta.fans'] || 0;
        const nickname = firstVid.authorMeta?.nickName || firstVid['authorMeta.nickName'] || '';
        const avatar = firstVid.authorMeta?.avatar || firstVid['authorMeta.avatar'] || '';
        const name = firstVid.authorMeta?.name || firstVid['authorMeta.name'] || username;

        // ER by Views
        const erByViews = totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0;

        // ER by Followers
        // Average Interactions per post / Followers
        const avgInteractions = totalVideos > 0 ? totalInteractions / totalVideos : 0;
        const erByFollowersPercentage = fans > 0 ? (avgInteractions / fans) * 100 : 0;

        return {
            username: name,
            nickname: nickname,
            avatar: avatar,
            totalVideos,
            totalViews,
            totalInteractions,
            avgViews,
            erByViews: erByViews.toFixed(2) + '%',
            erByFollowers: erByFollowersPercentage.toFixed(2) + '%',
            followers: fans,
        };
    });

    return results;
}
