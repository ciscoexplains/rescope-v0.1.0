import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';

const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            const [key, ...value] = line.split('=');
            if (key && value) {
                const val = value.join('=').trim().replace(/^["']|["']$/g, '');
                envVars[key.trim()] = val;
            }
        });
        return envVars;
    } catch (e) {
        console.error("Could not load .env.local", e);
        return {};
    }
};

const env = loadEnv();
const pb = new PocketBase(env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function debugFetch() {
    try {
        // Authenticate as admin first to rule out permissions initially
        await pb.admins.authWithPassword(env.POCKETBASE_ADMIN_EMAIL, env.POCKETBASE_ADMIN_PASSWORD);
        console.log("Admin Auth successful.");

        console.log("Fetching campaigns (Admin, no sort)...");
        let records = [];
        try {
            records = await pb.collection('campaigns').getFullList();
            console.log(`Success (Admin): Found ${records.length} campaigns.`);
            if (records.length > 0) {
                console.log("First record keys:", Object.keys(records[0]));
                console.log("First record updated:", records[0].updated);
            }
        } catch (e) { console.log("Failed without sort:", e.message); }

        console.log("Fetching with sort: '-created'...");
        try {
            await pb.collection('campaigns').getFullList({ sort: '-created' });
            console.log("Success: Sort by created works.");
        } catch (e) { console.log("Failed sort by created:", e.message); }

        console.log("Fetching with sort: '-updated'...");
        try {
            await pb.collection('campaigns').getFullList({ sort: '-updated' });
            console.log("Success: Sort by updated works.");
        } catch (e) { console.log("Failed sort by updated:", e.message); }

    } catch (err) {
        console.error("Fetch Failed:");
        console.error(err);
        if (err.data) console.error("Error Data:", JSON.stringify(err.data, null, 2));
        if (err.originalError) console.error("Original Error:", err.originalError);
    }
}

debugFetch();
