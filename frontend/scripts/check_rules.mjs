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

async function checkRules() {
    try {
        await pb.admins.authWithPassword(env.POCKETBASE_ADMIN_EMAIL, env.POCKETBASE_ADMIN_PASSWORD);

        const campaigns = await pb.collections.getOne('campaigns');
        console.log("Campaigns Rules:");
        console.log("List:", campaigns.listRule);
        console.log("View:", campaigns.viewRule);
        console.log("Create:", campaigns.createRule);
        console.log("Update:", campaigns.updateRule);
        console.log("Delete:", campaigns.deleteRule);

        const candidates = await pb.collections.getOne('candidates');
        console.log("\nCandidates Rules:");
        console.log("List:", candidates.listRule);
        console.log("View:", candidates.viewRule);
        console.log("Create:", candidates.createRule);
        console.log("Update:", candidates.updateRule);
        console.log("Delete:", candidates.deleteRule);

    } catch (e) {
        console.error(e);
    }
}

checkRules();
