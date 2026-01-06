import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

const SCHEMA_DEF = [
    { name: 'kol_name', type: 'text' },
    { name: 'kol_id', type: 'text' },
    { name: 'contact', type: 'text' },
    { name: 'contact_name', type: 'text' },
    { name: 'email', type: 'text' }, // or email type
    { name: 'instagram', type: 'text' },
    { name: 'tiktok', type: 'text' },
    { name: 'ig_followers', type: 'number' },
    { name: 'tt_followers', type: 'number' },
    { name: 'tier', type: 'text' },
    { name: 'er', type: 'number' },
    { name: 'avg_views', type: 'number' },
    { name: 'is_verified', type: 'bool' },
    { name: 'type', type: 'text' },
    { name: 'categories', type: 'json' }, // Array of strings
    { name: 'grade', type: 'text' },
    { name: 'region', type: 'json' }, // Array of strings
    { name: 'gender', type: 'text' },
    { name: 'age', type: 'text' },
    { name: 'religion', type: 'text' },
    // Campaign link is assumed
    { name: 'campaign', type: 'relation', options: { collectionId: 'campaigns', maxSelect: 1 } },
    { name: 'status', type: 'text' } // Reviewed, Trashed, etc.
];

async function main() {
    try {
        await pb.admins.authWithPassword('admin@example.com', '1234567890');
        const collection = await pb.collections.getOne('candidates');

        let schema = collection.schema || collection.fields;
        let modified = false;

        const hasField = (name) => schema.find(f => f.name === name);

        for (const def of SCHEMA_DEF) {
            if (!hasField(def.name)) {
                console.log(`Adding missing field: ${def.name} (${def.type})`);
                schema.push({
                    name: def.name,
                    type: def.type,
                    required: false,
                    displayable: true,
                    options: def.options || {}
                });
                modified = true;
            } else {
                // Optional: Check if type matches? PB makes type changing hard, skipping for now unless critical.
            }
        }

        if (modified) {
            if (collection.schema) collection.schema = schema;
            else collection.fields = schema;

            await pb.collections.update('candidates', collection);
            console.log('Schema updated successfully!');
        } else {
            console.log('Database schema is already fully synced.');
        }

    } catch (err) {
        console.error('Error updating schema:', err);
    }
}

main();
