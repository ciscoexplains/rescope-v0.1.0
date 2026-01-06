import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with API token
const client = new ApifyClient({
    token: 'apify_api_afKf8UReSRSrHEMaaU35XJmdBRs32c1WaRKG',
});

// Prepare Actor input
const input = {
    "profiles": [
        "apifyoffice"
    ],
    "profileScrapeSections": [
        "videos"
    ],
    "profileSorting": "latest",
    "resultsPerPage": 12,
    "excludePinnedPosts": false,
    "shouldDownloadVideos": false,
    "shouldDownloadCovers": false,
    "shouldDownloadSubtitles": false,
    "shouldDownloadSlideshowImages": false,
    "shouldDownloadAvatars": false
};

(async () => {
    // Run the Actor and wait for it to finish
    console.log("Starting Actor run...");
    const run = await client.actor("0FXVyOXXEmdGcV88a").call(input);

    // Fetch and print Actor results from the run's dataset (if any)
    console.log('Results from dataset:');
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    items.forEach((item) => {
        console.dir(item, { depth: null, colors: true });
    });
})();
