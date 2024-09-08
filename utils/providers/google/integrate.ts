"use server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
const apiKey = process.env.GOOGLE_API_KEY; // API key stored in environment variables

// Initialize LangChain's Google Generative AI chat model
const chatModel = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    maxOutputTokens: 2048,
});

export async function generateWithGoogle(prompt: string) {
    if (!apiKey) {
        console.error('GOOGLE_API_KEY is not set in the environment variables.');
        return null;
    }

    const maxRetries = 3; // Number of retry attempts
    const retryDelay = 1000; // Delay between retries in milliseconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const res = await chatModel.invoke([
                ["human", prompt]
            ]);
            return res.content;
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);

            if (attempt < maxRetries) {
                console.log(`Retrying in ${retryDelay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay)); // Delay before retry
            } else {
                console.error('All attempts failed. Please check your network connection.');
                return null;
            }
        }
    }
}
