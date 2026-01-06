import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function POST(req: Request) {
    try {
        const { query, limit } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const limitNumber = limit ? parseInt(limit) : 10;

        const apifyToken = process.env.APIFY_API_TOKEN;
        if (!apifyToken) {
            console.error('APIFY_API_TOKEN is not set');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        const client = new ApifyClient({
            token: apifyToken,
        });

        // Prepare Actor input based on user request
        const input = {
            "resultsPerPage": limitNumber,
            "profileScrapeSections": [
                "videos"
            ],
            "profileSorting": "latest",
            "excludePinnedPosts": false,
            "searchSection": "",
            "searchQueries": [query],
            "maxProfilesPerQuery": limitNumber,
            "searchSorting": "0",
            "searchDatePosted": "0",
            "scrapeRelatedVideos": false,
            "shouldDownloadVideos": false,
            "shouldDownloadCovers": false,
            "shouldDownloadSubtitles": false,
            "shouldDownloadSlideshowImages": false,
            "shouldDownloadAvatars": false,
            "shouldDownloadMusicCovers": false,
            "maxRepliesPerComment": 0,
            "proxyCountryCode": "None"
        };

        console.log('Running Apify actor with input:', JSON.stringify(input, null, 2));

        // Run the Actor and wait for it to finish
        // Actor ID: GdWCkxBtKWOsKjdch (TikTok Scraper)
        const run = await client.actor("GdWCkxBtKWOsKjdch").call(input);

        console.log('Actor finished. Fetching results from dataset:', run.defaultDatasetId);

        // Fetch results from the run's dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        return NextResponse.json({ results: items });

    } catch (error: any) {
        console.error('Apify Search Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch data from Apify'
        }, { status: 500 });
    }
}
