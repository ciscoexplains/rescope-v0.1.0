import { GoogleGenerativeAI } from '@google/generative-ai';
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
        return {};
    }
};

const env = loadEnv();
const apiKey = env.GOOGLE_API_KEY;

console.log(`Checking GOOGLE_API_KEY... Present? ${!!apiKey}`);

if (!apiKey) {
    console.error("No API Key found.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    console.log("Testing Gemini API...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        // Note: 'gemini-flash-latest' might be the issue if not supported. trying 'gemini-1.5-flash' is often safer.
        console.log("Model requested: gemini-flash-latest");

        const prompt = "Say 'Hello World' if you can hear me.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Success! Response:", text);
    } catch (e) {
        console.error("Gemini API Failed:");
        console.error(e.message);
        if (e.response) {
            console.error("Response:", e.response);
        }
    }
}

test();
