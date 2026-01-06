import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

export async function POST(req: NextRequest) {
    try {
        const { username } = await req.json();

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        // Run Apify Actor (Same config as analyze-campaign)
        const input = {
            "profiles": [username],
            "profileScrapeSections": ["videos"],
            "profileSorting": "latest",
            "resultsPerPage": 12,
            "excludePinnedPosts": false,
            "shouldDownloadVideos": false,
            "shouldDownloadCovers": false,
            "shouldDownloadSubtitles": false,
            "shouldDownloadSlideshowImages": false,
            "shouldDownloadAvatars": false
        };

        const run = await client.actor("0FXVyOXXEmdGcV88a").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No posts found or profile is private' }, { status: 404 });
        }

        // Process Data for Frontend
        // We want individual post metrics for the chart
        const posts = items.map((item: any) => ({
            id: item.id,
            desc: item.text,
            createTime: item.createTime, // Unix timestamp usually
            views: item.playCount || 0,
            likes: item.diggCount || 0,
            comments: item.commentCount || 0,
            shares: item.shareCount || 0,
            cover: item.videoMeta?.coverUrl
        })).reverse(); // Reverse to show oldest -> newest on chart typically, or keep as is. Let's keep latest first but maybe flip for chart.

        // Calculate Aggregates
        let totalViews = 0;
        let totalEng = 0;
        let videoCount = 0;

        items.forEach((item: any) => {
            totalViews += item.playCount || 0;
            totalEng += (item.diggCount || 0) + (item.commentCount || 0) + (item.shareCount || 0) + (item.collectCount || 0);
            videoCount++;
        });

        const avgViews = videoCount > 0 ? Math.round(totalViews / videoCount) : 0;
        const er = totalViews > 0 ? ((totalEng / totalViews) * 100) : 0;

        // Profile Meta (from the first post usually)
        const profile = {
            username: (items[0]?.authorMeta as any)?.name,
            nickname: (items[0]?.authorMeta as any)?.nickName,
            avatar: (items[0]?.authorMeta as any)?.avatar,
            followers: (items[0]?.authorMeta as any)?.fans || 0,
            following: (items[0]?.authorMeta as any)?.following || 0,
            likes: (items[0]?.authorMeta as any)?.heart || 0,
            videos: (items[0]?.authorMeta as any)?.video || 0,
            verified: (items[0]?.authorMeta as any)?.verified || false,
            avgViews,
            er: parseFloat(er.toFixed(2))
        };

        return NextResponse.json({
            success: true,
            profile,
            posts
        });

    } catch (error: any) {
        console.error("Reach Prediction API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
