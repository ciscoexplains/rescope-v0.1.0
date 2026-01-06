import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        await pb.admins.authWithPassword('admin@example.com', '1234567890');
        const collection = await pb.collections.getOne('candidates');

        let modified = false;

        // Check and Add 'avg_views'
        if (!collection.schema.find(f => f.name === 'avg_views')) {
            collection.schema.push({
                name: 'avg_views',
                type: 'number',
                required: false,
                options: {}
            });
            console.log('Adding avg_views field...');
            modified = true;
        }

        // Check and Add 'reach'
        if (!collection.schema.find(f => f.name === 'reach')) {
            collection.schema.push({
                name: 'reach',
                type: 'number',
                required: false,
                options: {}
            });
            console.log('Adding reach field...');
            modified = true;
        }

        if (modified) {
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
