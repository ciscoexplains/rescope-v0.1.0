import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        await pb.admins.authWithPassword('admin@example.com', '1234567890');
        const collection = await pb.collections.getOne('candidates');

        let schema = collection.schema || collection.fields;
        let modified = false;

        // Add 'is_verified'
        if (!schema.find(f => f.name === 'is_verified')) {
            schema.push({
                name: 'is_verified',
                type: 'bool',
                required: false,
                displayable: true,
                options: {}
            });
            console.log('Adding is_verified field...');
            modified = true;
        }

        if (modified) {
            if (collection.schema) collection.schema = schema;
            else collection.fields = schema;

            await pb.collections.update('candidates', collection);
            console.log('Schema updated successfully!');
        } else {
            console.log('Schema already has is_verified field.');
        }

    } catch (err) {
        console.error('Error updating schema:', err);
    }
}

main();
