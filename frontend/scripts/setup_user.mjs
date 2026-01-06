import PocketBase from 'pocketbase';

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

async function main() {
    const pb = new PocketBase(PB_URL);

    // Get args
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error('Usage: node setup_user.mjs <email> <password>');
        process.exit(1);
    }

    console.log(`Attempting to create user: ${email} at ${PB_URL}`);

    try {
        const data = {
            "username": email.split('@')[0],
            "email": email,
            "emailVisibility": true,
            "password": password,
            "passwordConfirm": password,
            "name": email.split('@')[0]
        };

        const record = await pb.collection('users').create(data);
        console.log('✅ User created successfully!');
        console.log('ID:', record.id);
        console.log('Email:', record.email);
        console.log('\nYou can now login with these credentials.');

    } catch (error) {
        if (error.status === 400) {
            console.error('❌ Validation failed. User likely already exists or password is too short (min 8 chars).');
            console.error('Details:', error.data);
        } else if (error.status === 0) {
            console.error('❌ Connection failed. Is PocketBase running at ' + PB_URL + '?');
        } else {
            console.error('❌ User creation failed:', error.message);
            console.error('Status:', error.status);
        }
    }
}

main();
