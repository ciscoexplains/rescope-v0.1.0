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

async function createSchema() {
    try {
        console.log("Authenticating as Admin...");
        await pb.admins.authWithPassword(env.POCKETBASE_ADMIN_EMAIL, env.POCKETBASE_ADMIN_PASSWORD);

        // --- Clean up old collections ---
        // Since they are likely empty/broken, deleting should be fine.
        try { await pb.collection('candidates').delete(); console.log("Deleted candidates."); } catch (e) { }
        try { await pb.collection('campaigns').delete(); console.log("Deleted campaigns."); } catch (e) { }

        // --- Campaigns Collection ---
        console.log("Creating 'campaigns' collection...");
        let campaignsId;
        try {
            const campaignsCollection = await pb.collections.create({
                name: 'campaigns',
                type: 'base',
                fields: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'prompt', type: 'text' },
                    { name: 'client_name', type: 'text' },
                    {
                        name: 'status',
                        type: 'select',
                        options: { values: ['Loading', 'Ongoing', 'Analyzing', 'Completed', 'Failed'] }
                    },
                    { name: 'min_followers', type: 'number' },
                    { name: 'max_followers', type: 'number' },
                    { name: 'min_scraped', type: 'number' },
                    { name: 'max_scraped', type: 'number' },
                    { name: 'kol_count', type: 'number' }
                ]
            });
            console.log(`Collection 'campaigns' created (ID: ${campaignsCollection.id}).`);
            campaignsId = campaignsCollection.id;
        } catch (e) {
            console.log("Campaigns collection likely exists, fetching...");
            const c = await pb.collections.getOne('campaigns');
            campaignsId = c.id;
        }

        // --- Candidates Collection ---
        console.log("Creating 'candidates' collection...");
        await pb.collections.create({
            name: 'candidates',
            type: 'base',
            fields: [
                {
                    name: 'campaign',
                    type: 'relation',
                    required: true,
                    options: {
                        collectionId: campaignsId,
                        cascadeDelete: true,
                        maxSelect: 1
                    }
                },
                { name: 'kol_id', type: 'text' },
                { name: 'kol_name', type: 'text' },
                { name: 'contact', type: 'text' },
                { name: 'contact_name', type: 'text' },
                { name: 'email', type: 'text' },
                { name: 'instagram', type: 'text' },
                { name: 'tiktok', type: 'text' },
                { name: 'ig_followers', type: 'number' },
                { name: 'tt_followers', type: 'number' },
                {
                    name: 'tier',
                    type: 'select',
                    options: { values: ['Nano', 'Micro', 'Mid', 'Macro', 'Mega', 'Mid/Macro'] }
                },
                { name: 'er', type: 'number' },
                { name: 'genuine_rate', type: 'number' },
                { name: 'match_score', type: 'number' },
                { name: 'type', type: 'text' },
                { name: 'categories', type: 'json' }, // JSON has no detailed options
                { name: 'grade', type: 'text' },
                { name: 'region', type: 'json' },
                { name: 'gender', type: 'text' },
                { name: 'age', type: 'text' },
                { name: 'religion', type: 'text' },
                { name: 'avatar', type: 'url' },
                { name: 'username', type: 'text' },
                { name: 'signature', type: 'text' },
                {
                    name: 'status',
                    type: 'select',
                    options: { values: ['New', 'Reviewed', 'Trashed'] }
                }
            ]
        });
        console.log("Collection 'candidates' created.");

    } catch (err) {
        console.error("Error creating schema:", err);
        if (err.data) console.error(JSON.stringify(err.data, null, 2));
    }
}

createSchema();
