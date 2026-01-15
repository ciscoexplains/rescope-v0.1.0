import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

console.log(`Connecting to ${supabaseUrl}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    const start = Date.now();
    try {
        const { data, error } = await supabase.from('campaigns').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Connection Successful!');
            console.log('Time taken:', Date.now() - start, 'ms');
            console.log('Data:', data); // Should be null for head:true
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testConnection();
