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

async function inspectSchema() {
    try {
        await pb.admins.authWithPassword(env.POCKETBASE_ADMIN_EMAIL, env.POCKETBASE_ADMIN_PASSWORD);

        console.log("--- Campaigns Schema ---");
        try {
            const campaigns = await pb.collections.getOne('campaigns');
            console.log(JSON.stringify(campaigns.fields || campaigns.schema, null, 2));
        } catch (e) { console.log("Campaigns collection missing"); }

        console.log("\n--- Candidates Schema ---");
        try {
            const candidates = await pb.collections.getOne('candidates');
            console.log(JSON.stringify(candidates.fields || candidates.schema, null, 2));
        } catch (e) { console.log("Candidates collection missing"); }

    } catch (e) {
        console.error(e);
    }
}

inspectSchema();
