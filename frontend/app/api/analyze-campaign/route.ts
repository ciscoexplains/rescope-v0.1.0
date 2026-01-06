import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import PocketBase from 'pocketbase';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

export async function POST(req: NextRequest) {
    try {
        // 1. Admin Auth
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL!,
            process.env.POCKETBASE_ADMIN_PASSWORD!
        );

        const { candidates } = await req.json(); // Array of { id, username }
        if (!candidates || candidates.length === 0) {
            return NextResponse.json({ error: 'No candidates provided' }, { status: 400 });
        }

        const usernames = candidates.map((c: any) => c.username).filter(Boolean);

        // 2. Run Apify Actor
        const input = {
            "profiles": usernames,
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

        // 3. Process Results
        const metricsByUser: Record<string, any> = {};

        items.forEach((item: any) => {
            const username = item.authorMeta?.name?.toLowerCase();
            if (!username) return;

            if (!metricsByUser[username]) {
                metricsByUser[username] = {
                    totalLikes: 0,
                    totalComments: 0,
                    totalShares: 0,
                    totalCollects: 0,
                    totalViews: 0,
                    videoCount: 0,
                    followers: item.authorMeta?.fans || 0,
                    verified: item.authorMeta?.verified || false
                };
            }

            metricsByUser[username].totalLikes += item.diggCount || 0;
            metricsByUser[username].totalComments += item.commentCount || 0;
            metricsByUser[username].totalShares += item.shareCount || 0;
            metricsByUser[username].totalCollects += item.collectCount || 0;
            metricsByUser[username].totalViews += item.playCount || 0;
            metricsByUser[username].videoCount += 1;
            // Update latest verified status
            if (item.authorMeta?.verified !== undefined) {
                metricsByUser[username].verified = item.authorMeta.verified;
            }
        });

        // 4. Update PocketBase
        const updatePromises = candidates.map(async (cand: any) => {
            const username = cand.username.toLowerCase();
            const stats = metricsByUser[username];

            if (stats && stats.videoCount > 0) {
                const totalEng = stats.totalLikes + stats.totalComments + stats.totalShares + stats.totalCollects;

                // ER = (Total Engagement / Total Reach) * 100
                // Using Total Views as a proxy for Total Reach
                const totalReach = stats.totalViews;
                const er = totalReach > 0 ? ((totalEng / totalReach) * 100) : 0;

                const avgViews = Math.round(stats.totalViews / stats.videoCount);
                const reach = avgViews;

                await pb.collection('candidates').update(cand.id, {
                    er: parseFloat(er.toFixed(2)),
                    avg_views: avgViews,
                    reach: reach,
                    is_verified: stats.verified, // Update Verified
                    tt_followers: stats.followers,
                });
            }
        });

        await Promise.all(updatePromises);

        return NextResponse.json({ success: true, processed: candidates.length });

    } catch (error: any) {
        console.error("Deep Analyze Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
