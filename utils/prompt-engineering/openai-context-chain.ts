"use server"
import { OpenAI } from "@langchain/openai";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import  Con from "./context-chain";

const model = new OpenAI({
    model: "gpt-4",
});
const memory = new BufferMemory();
const chain = new ConversationChain({ llm: model, memory: memory });

export default async function Context(
    inputMessage: string,
    email: string,
) {
    const inp = `
        Given a user query, summarize the user's query as a single search term. 
        Rephrase or resolve any pronouns or anaphoras into their actual names or contexts.
        Return ONLY the search term itself, without any extra explanation or information.
        Example: "discovery of Egypt"
        User query: ${await Con(inputMessage, email)}
    `;
    
    const response = await chain.call({input: inp });
    const responseText = response.response;
    const searchTerm = responseText.match(/"(.*?)"/)?.[1] || responseText;

    console.log("response from openai", { searchTerm });
    return searchTerm
    }