import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pb from '@/lib/pocketbase';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { description } = await req.json();

        if (!description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json({ error: 'GOOGLE_API_KEY is not set' }, { status: 500 });
        }

        // Authenticate as admin to fetch private collection
        await pb.collection('_superusers').authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL!,
            process.env.POCKETBASE_ADMIN_PASSWORD!
        );

        // Fetch all categories from PocketBase
        const records = await pb.collection('search_trends').getFullList({
            sort: 'main_category,sub_category',
        });

        // Create a list of "Main Category > Sub Category" for the prompt
        const categories = records.map(r => `${r.main_category} > ${r.sub_category}`);

        // Call Google AI
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
    You are an expert marketing assistant. 
    Your task is to analyze a campaign description and select the TOP 2 most suitable categories from the provided list.
    
    List of Categories:
    ${categories.join('\n')}
    
    Return ONLY a valid JSON array of strings containing the selected category pairs "Main Category > Sub Category". 
    Example: ["Category A > Sub 1", "Category B > Sub 2"]
    Do not add any explanation or markdown formatting.
    
    Campaign Description: ${description}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // Clean up potential markdown code blocks
        if (text.startsWith('```json')) {
            text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        let matchedCategories: string[] = [];
        try {
            matchedCategories = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON:", text);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        if (!matchedCategories || matchedCategories.length === 0) {
            return NextResponse.json({ error: 'Failed to classify campaign' }, { status: 500 });
        }

        const results = matchedCategories.map(catStr => {
            const [main, sub] = catStr.split(' > ');
            const record = records.find(r => r.main_category === main && r.sub_category === sub);
            if (record) {
                return {
                    category: catStr,
                    queries: record.queries,
                    main_category: record.main_category,
                    sub_category: record.sub_category
                };
            }
            return null;
        }).filter(item => item !== null);

        if (results.length === 0) {
            return NextResponse.json({ error: 'No matching categories found in database' }, { status: 404 });
        }

        return NextResponse.json({ results });

    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
