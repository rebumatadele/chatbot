"use server"
import { splitTextIntoChunks } from "../preprocess/create-chunk";
import { generateWithAnthropic } from "../providers/claude/integrate";
import { generateWithGoogle } from "../providers/google/integrate";
import { SearchVector } from "../vector/pinecone/search-vector";
import { storeUserVectors } from "../vector/pinecone/store-vector";

// RAG Contextualize Chain
export default async function Context(
    inputMessage: string,
    email: string,
) {
      await StoreContext(inputMessage, email)
      // Search for the vectors related to the query index
      const query = await SearchVector(
        email,
        inputMessage,
        "query-index",
        10
      );
      const inp = `
        Given the recent chat history, summarize the user's query as a search term. 
        Resolve any pronouns or anaphoras with their actual names or contexts.
        If the user query mentions a PDF or text file, replace it with the phrase "based on the following".
        Return ONLY the paraphrase or search term.
        Chat history: ${query}
        User query: ${inputMessage.replace(/pdf|text file/gi, "based on the following")}
        `;
      // Generate a query using the API
      const newQuery = await generateWithGoogle(inp);
    return newQuery
}

export async function StoreContext(
  inputMessage: string,
  email: string){
  const chunks = await splitTextIntoChunks(inputMessage, 100, "");
  console.log(chunks)
  await storeUserVectors(email, chunks, "query-index");
}