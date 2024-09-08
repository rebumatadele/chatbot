"use server"
import { generateWithGoogle } from "../providers/google/integrate";
import { SearchVector } from "../vector/pinecone/search-vector";
import { storeUserVectors } from "../vector/pinecone/store-vector";

// RAG Contextualize Chain
export default async function Context(
    inputMessage: string,
    email: string,
) {
      // Store the query in the Vector Database
      let inp = [];
      inp.push({ content: inputMessage, metadata: "" });

      storeUserVectors(email, inp, "query-index");
      // Search for the vectors related to the query index
      const query = await SearchVector(
        email,
        inputMessage,
        "query-index",
        3
      );
      console.log("USER QUERY: " , query)
      // Generate a query using the API
      const newQuery = await generateWithGoogle(`Given a context of recent chat history, summarize the user's query as a search term. Return ONLY this paraphrase. 
        chat history= ${query} 
          and user query= ${inputMessage}`);
      console.log(newQuery)
    return newQuery
}