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

async function testCandidateCreation() {
    try {
        await pb.admins.authWithPassword(env.POCKETBASE_ADMIN_EMAIL, env.POCKETBASE_ADMIN_PASSWORD);

        console.log("Creating dummy campaign...");
        const campaign = await pb.collection('campaigns').create({
            name: 'Test Campaign',
            status: 'Loading'
        });
        console.log("Campaign created:", campaign.id);

        console.log("Attempting to create candidate...");
        try {
            const candidate = await pb.collection('candidates').create({
                campaign: campaign.id,
                kol_id: 'KOL9999999',
                kol_name: 'Test KOL',
                contact: 'None',
                contact_name: 'None',
                email: 'None',
                instagram: 'test',
                tiktok: 'test',
                ig_followers: 0,
                tt_followers: 1000,
                tier: 'Nano',
                er: 0,
                genuine_rate: 0,
                match_score: 0,
                type: 'Influencer',
                categories: ['Beauty'],
                grade: 'Middle-end',
                region: [],
                gender: 'Unknown',
                age: 'Unknown',
                religion: 'Unknown',
                avatar: 'https://example.com/avatar.jpg',
                username: 'test_user',
                signature: 'test sig',
                status: 'New'
            });
            console.log("Candidate created successfully:", candidate.id);
        } catch (e) {
            console.error("Failed to create candidate:");
            console.error(JSON.stringify(e.data, null, 2));
        }

        console.log("Cleaning up...");
        await pb.collection('campaigns').delete(campaign.id);

    } catch (e) {
        console.error("Main Script Error:", e);
    }
}

testCandidateCreation();
