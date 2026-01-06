import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        await pb.admins.authWithPassword('admin@example.com', '1234567890');
        console.log("Fetching all candidates...");

        // Fetch all in batches
        const records = await pb.collection('candidates').getFullList({
            requestKey: null
        });

        console.log(`Total candidates: ${records.length}`);

        const seen = new Set();
        const duplicates = [];

        for (const r of records) {
            // Unique key: Campaign ID + Username (normalized)
            // If we wanted global uniqueness, we'd just use username.
            // But usually uniqueness is per campaign. 
            // Let's assume PER CAMPAIGN for safety first.
            // If the user meant "Global", I'll see many duplicates if I check just username.
            // Let's enforce Global Uniqueness ONLY if they explicitly asked for "no double profile" meaning master list?
            // "database unique" sounds global. 
            // BUT deleting a candidate from Campaign B because they are in Campaign A breaks Campaign B.
            // So default to Per-Campaign uniqueness.

            if (!r.username) continue;

            const key = `${r.campaign}_${r.username.toLowerCase()}`;

            if (seen.has(key)) {
                duplicates.push(r.id);
            } else {
                seen.add(key);
            }
        }

        console.log(`Found ${duplicates.length} duplicates (same candidate in same campaign).`);

        if (duplicates.length > 0) {
            console.log("Deleting duplicates...");
            for (const id of duplicates) {
                await pb.collection('candidates').delete(id);
                process.stdout.write('.');
            }
            console.log("\nDone.");
        } else {
            console.log("Database is already unique (per campaign).");
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

main();
