import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        await pb.admins.authWithPassword('admin@example.com', '1234567890');
        const collection = await pb.collections.getOne('candidates');

        console.log('Collection keys:', Object.keys(collection));
        // console.log('Full collection:', JSON.stringify(collection, null, 2));

        let schema = collection.schema || collection.fields; // Adapt to version
        if (!schema) {
            console.error('Could not find schema or fields property on collection.');
            return;
        }

        let modified = false;

        // Helper to check existence
        const hasField = (name) => schema.find(f => f.name === name);

        // Add 'avg_views'
        if (!hasField('avg_views')) {
            schema.push({
                name: 'avg_views',
                type: 'number',
                required: false,
                displayable: true,
                options: {}
            });
            console.log('Adding avg_views field...');
            modified = true;
        }

        // Add 'reach'
        if (!hasField('reach')) {
            schema.push({
                name: 'reach',
                type: 'number',
                required: false,
                displayable: true,
                options: {}
            });
            console.log('Adding reach field...');
            modified = true;
        }

        if (modified) {
            // Assign back to the correct property
            if (collection.schema) collection.schema = schema;
            else collection.fields = schema;

            await pb.collections.update('candidates', collection);
            console.log('Schema updated successfully!');
        } else {
            console.log('Schema already has these fields.');
        }

    } catch (err) {
        console.error('Error updating schema:', err);
    }
}

main();
