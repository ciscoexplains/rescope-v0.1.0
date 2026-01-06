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

async function enablePublic() {
    try {
        await pb.admins.authWithPassword(env.POCKETBASE_ADMIN_EMAIL, env.POCKETBASE_ADMIN_PASSWORD);

        console.log("Updating 'campaigns' rules...");
        const campaigns = await pb.collections.getOne('campaigns');
        await pb.collections.update(campaigns.id, {
            listRule: "",
            viewRule: "",
            createRule: "",
            updateRule: "",
            deleteRule: ""
        });

        console.log("Updating 'candidates' rules...");
        const candidates = await pb.collections.getOne('candidates');
        await pb.collections.update(candidates.id, {
            listRule: "",
            viewRule: "",
            createRule: "",
            updateRule: "",
            deleteRule: ""
        });

        console.log("SUCCESS: Collections are now public.");

    } catch (e) {
        console.error("Failed to update rules:", e);
    }
}

enablePublic();
