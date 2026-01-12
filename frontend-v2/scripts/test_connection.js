const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim();
        }
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
            supabaseKey = line.split('=')[1].trim();
        }
    }
} catch (error) {
    console.error("Error reading .env.local:", error.message);
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Could not find Supabase credentials in .env.local");
    console.log("Found URL:", supabaseUrl ? "Yes" : "No");
    console.log("Found Key:", supabaseKey ? "Yes" : "No");
    process.exit(1);
}

if (supabaseUrl.includes('your_supabase_url') || supabaseUrl.includes('example.supabase.co')) {
    console.error("Error: .env.local still contains placeholder/dummy values.");
    process.exit(1);
}

// 2. Initialize Client
console.log("Connecting to Supabase at:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

// 3. Test Connection
async function testConnection() {
    try {
        // Try to fetch metadata or a simple public table count
        // We'll try to list tables using a query that should return empty but succeed, 
        // or check auth.getSession which doesn't hit DB but checks URL.
        // Better: try to select from 'search_trends' (even if empty, it returns data: [])

        console.log("Attempting to fetch from 'search_trends'...");
        const { data, error } = await supabase.from('search_trends').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("Connection failed with error:", error.message);
            // Check for specific common errors
            if (error.code === 'PGRST301') console.error("Hint: Row Level Security might be blocking access, or table doesn't exist.");
        } else {
            console.log("✅ Connection Successful!");
            console.log("Successfully connected to Supabase.");
        }

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

testConnection();
