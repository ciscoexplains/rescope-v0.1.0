import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN || '',
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Map UI fields to Apify input format
        const input = {
            operationMode: "networkExpansion",
            startUsernames: body.startProfiles || "",
            searchDepth: body.searchDepth || "1",
            maxCountExpansion: body.maxProfiles || 0,

            // Data extraction options
            extractEmail: body.extractEmail || false,
            extractPhoneNumber: body.extractPhone || false,
            extractWebsiteUrl: body.extractWebsite || false,
            extractBusinessCategory: body.extractCategory || false,
            extractPhysicalAddress: body.extractAddress || false,
            analyzeQuality: body.calculateER || false,
            extractPosts: body.extractCaptions || false,
            searchContactsInPosts: body.deepSearch || false,

            // Advanced filters
            keywords: body.keywords || [],
            keywordLocation: body.keywordLocation || "bio_or_name",
            locationKeywords: body.locationKeywords || "",
            profileLanguage: body.profileLanguage || "any",
            minFollowers: body.minFollowers || 0,
            maxFollowers: body.maxFollowers || 0,
            lastPostDays: body.lastPostDays || 0,
            minPostsInPeriod: body.minPosts || 0,
            postsCheckPeriodDays: body.postsPeriod || "30",
            recentReelFilterPeriod: body.recentReels || "disabled",
            minMedianViews: body.medianViews || 0,
            minViewToFollowerRatio: body.viewsRatio || false,
            contactInfoType: body.contactInfo || "any",
            hasWebsite: body.hasWebsite || false,
            accountType: body.accountType || "any",
            filterForInfluencers: body.filterInfluencers || false,
            categoryFilter: body.businessCategory || "any",
            mustBeVerified: body.mustBeVerified || false,

            clearSavedData: true,
            enableOfflineMode: false,
        };

        console.log('Starting Instagram scraper with input:', JSON.stringify(input, null, 2));

        // Run the Actor
        const run = await client.actor("r4hZOdD5FiHYo1bYa").call(input);

        // Fetch results from  dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        console.log(`Scraping completed. Found ${items.length} profiles.`);
        console.log('First item from Apify:', JSON.stringify(items[0], null, 2));

        // Transform Apify results to our format
        const results = items.map((item: any) => {
            // Calculate tier based on followers
            let tier = 'Nano';
            const followers = item['Followers Count'] || 0;
            if (followers >= 1000000) tier = 'Mega';
            else if (followers >= 100000) tier = 'Macro';
            else if (followers >= 10000) tier = 'Mid';
            else if (followers >= 1000) tier = 'Micro';

            // Extract username from Account URL
            const accountUrl = item['Account'] || '';
            const username = accountUrl.replace('https://instagram.com/', '').replace('https://www.instagram.com/', '');

            // Parse ER percentage string to number
            const erString = item['Median ER'] || '0%';
            const er = parseFloat(erString.replace('%', ''));

            return {
                username: username,
                full_name: item['Full Name'] || '',
                bio: item['Biography'] || '',
                avatar: item['Profile Picture URL'] || '',
                is_verified: item['Is Verified'] || false,
                is_private: item['Is Private'] || false,

                followers: followers,
                following: item['Following Count'] || 0,
                posts_count: item['Posts Count'] || 0,

                email: item['Email'] !== 'N/A' ? item['Email'] : '',
                contact: item['Phone'] !== 'N/A' ? item['Phone'] : '',
                website: item['External URL'] || '',

                business_category: item['Business Category'] || '',
                physical_address: '',
                account_type: item['Account Type'] || 'personal',

                avg_likes: item['Avg Likes'] || 0,
                avg_comments: item['Avg Comments'] || 0,
                avg_views: item['Avg Views'] || 0,
                er: er,
                median_views: item['Median Views'] || 0,

                quality_score: item['Quality'] === 'Good' ? 100 : item['Quality'] === 'Average' ? 50 : 25,

                tier: tier,
                profile_url: item['Account'] || `https://www.instagram.com/${username}`,
                external_url: item['External URL'] || '',
                profile_language: item['Detected Language'] !== 'N/A' ? item['Detected Language'] : '',
                last_post_days: item['Last Post Within (Days)'] || 0,
            };
        });

        return NextResponse.json({
            success: true,
            count: results.length,
            results: results,
            runId: run.id,
        });

    } catch (error: any) {
        console.error('Instagram scraper error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to scrape Instagram profiles',
            },
            { status: 500 }
        );
    }
}
