"use server"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
const apiKey = process.env.GOOGLE_API_KEY; // API key stored in environment variables

// Initialize LangChain's OpenAI embedding model
const chatModel = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    maxOutputTokens: 2048,
});


export async function generateWithGoogle(prompt:string){
    if (!apiKey) {
        console.error('GOOGLE_API_KEY is not set in the environment variables.');
        return null;
      }
      const res = await chatModel.invoke([
        [
          "human", prompt ]
      ])
    return res.content
}