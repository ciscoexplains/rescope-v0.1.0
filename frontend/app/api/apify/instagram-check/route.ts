import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function POST(req: Request) {
    try {
        const { username } = await req.json();

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const apifyToken = process.env.APIFY_API_TOKEN;
        if (!apifyToken) {
            console.error('APIFY_API_TOKEN is not set');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        const client = new ApifyClient({
            token: apifyToken,
        });

        const input = {
            "usernames": [username]
        };

        console.log('Running Apify actor 3R9pWxyCy9C2hRJfY with input:', JSON.stringify(input));

        const run = await client.actor("3R9pWxyCy9C2hRJfY").call(input);

        console.log('Actor finished. Fetching results from dataset:', run.defaultDatasetId);

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        // If items are empty, it might mean the profile wasn't found or private
        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No data found. Profile might be private or invalid.' }, { status: 404 });
        }

        return NextResponse.json({ result: items[0] });

    } catch (error: any) {
        console.error('Apify IG Check Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to analyze Instagram profile'
        }, { status: 500 });
    }
}
