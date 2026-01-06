import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'apify_api_afKf8UReSRSrHEMaaU35XJmdBRs32c1WaRKG',
});

const input = {
    "excludePinnedPosts": false,
    "profiles": ["tiktok"],
    "resultsPerPage": 12,
    "shouldDownloadAvatars": false,
    "shouldDownloadCovers": false,
    "shouldDownloadSlideshowImages": false,
    "shouldDownloadSubtitles": false,
    "shouldDownloadVideos": false,
};

console.log('Input:', input);

try {
    console.log('Starting actor run...');
    const run = await client.actor("0FXVyOXXEmdGcV88a").call(input);
    console.log('Run finished. Dataset ID:', run.defaultDatasetId);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log('Items found:', items.length);

    if (items.length > 0) {
        const item = items[0];
        console.log('Item Keys:', Object.keys(item));
        console.log('authorMeta:', item.authorMeta);
        console.log('Does item["authorMeta.name"] exist?', item['authorMeta.name']);

        console.log('Sample data points:');
        console.log('Display Name:', item.authorMeta?.nickName);
        console.log('Username:', item.authorMeta?.name);
        console.log('Play Count:', item.playCount);
        console.log('createTimeISO:', item.createTimeISO);
        console.log('createTime:', item.createTime);
    } else {
        console.log('No items returned from dataset.');
    }
} catch (e) {
    console.error('Error:', e);
}
