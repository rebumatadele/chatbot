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
        3
      );
      console.log("USER QUERY: " , query)
      // Generate a query using the API
      const newQuery = await generateWithAnthropic(`Given a context of recent chat history, summarize the user's query as a search term. 
        rephrase or (Coreference Resolution) the anaphoras including pronouns with the actual names or contexts.
        Return ONLY this paraphrase. 
        chat history= ${query} 
        and user query= ${inputMessage}`);
      console.log(newQuery)
    return newQuery
}

export async function StoreContext(
  inputMessage: string,
  email: string){
  // Store the query in the Vector Database
  const chunks = await splitTextIntoChunks(inputMessage, 100, "");
  console.log(chunks)
  // let inp = [];
  // inp.push({ content: inputMessage, metadata: "" });
  await storeUserVectors(email, chunks, "query-index");
}