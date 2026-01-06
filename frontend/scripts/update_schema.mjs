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

async function updateSchema() {
    try {
        console.log("Authenticating as Admin...");
        await pb.admins.authWithPassword(env.POCKETBASE_ADMIN_EMAIL, env.POCKETBASE_ADMIN_PASSWORD);

        console.log("Fetching 'candidates' collection...");
        const collection = await pb.collections.getOne('candidates');

        console.log("Updating schema...");
        const newSchema = [...collection.schema];

        // Remove existing status if any (to replace)
        const exists = newSchema.findIndex(f => f.name === 'status');
        if (exists !== -1) {
            newSchema.splice(exists, 1);
        }

        newSchema.push({
            name: 'status',
            type: 'select',
            options: { values: ['New', 'Reviewed', 'Trashed'] }
        });

        await pb.collections.update(collection.id, {
            schema: newSchema
        });

        console.log("Schema updated successfully.");

    } catch (err) {
        console.error("Error updating schema:", err);
    }
}

updateSchema();
