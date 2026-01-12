const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking "profiles" table...');
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

    if (profilesError) {
        console.error('❌ Error checking "profiles" table:', profilesError);
    } else {
        console.log('✅ "profiles" table exists.');
    }

    console.log('\nChecking "campaigns" table...');
    const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('count', { count: 'exact', head: true });

    if (campaignsError) {
        console.error('❌ Error checking "campaigns" table:', campaignsError);
    } else {
        console.log('✅ "campaigns" table exists.');
    }
}

checkTables();
