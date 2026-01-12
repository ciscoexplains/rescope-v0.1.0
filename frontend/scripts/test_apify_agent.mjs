import { ApifyClient } from 'apify-client';
import fs from 'fs';
import path from 'path';

// Helper to load env vars manually if not running via nextjs or dotenv-cli
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^['"]|['"]$/g, '');
                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
            });
        }
    } catch (e) {
        console.error("Error loading .env.local", e);
    }
}

loadEnv();

const token = process.env.APIFY_API_TOKEN;
if (!token) {
    console.error("APIFY_API_TOKEN is missing!");
    process.exit(1);
}

// Initialize the ApifyClient with API token
const client = new ApifyClient({
    token: token,
});

// Prepare Actor input
const input = {
    "usernames": [
        "instagram",
    ]
};

(async () => {
    try {
        console.log("Running actor 3R9pWxyCy9C2hRJfY...");
        // Run the Actor and wait for it to finish
        const run = await client.actor("3R9pWxyCy9C2hRJfY").call(input);
        console.log("Actor finished. Run Status:", run.status);

        // Fetch and print Actor results from the run's dataset (if any)
        console.log('Results from dataset: ' + run.defaultDatasetId);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items.length === 0) {
            console.log("No items found in dataset.");
        }

        items.forEach((item) => {
            console.dir(item, { depth: null, colors: true });
        });
    } catch (err) {
        console.error("Error:", err);
    }
})();
