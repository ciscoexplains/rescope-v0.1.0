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
        return {};
    }
};

const env = loadEnv();
const pb = new PocketBase(env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

async function check() {
    try {
        await pb.admins.authWithPassword(env.POCKETBASE_ADMIN_EMAIL, env.POCKETBASE_ADMIN_PASSWORD);
        console.log("Admin auth success.");

        try {
            const result = await pb.collection('search_trends').getList(1, 10);
            console.log(`Found 'search_trends' collection. Total items: ${result.totalItems}`);
            if (result.items.length > 0) {
                console.log("Sample item:", result.items[0]);
            } else {
                console.log("Collection is EMPTY.");
            }
        } catch (e) {
            console.error("Error accessing 'search_trends':", e.message);
        }

    } catch (e) {
        console.error("Script failed:", e);
    }
}

check();
