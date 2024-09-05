import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";
// Initialize LangChain's OpenAI embedding model
dotenv.config();

// Initialize LangChain's OpenAI embedding model
const embeddingModel = new OpenAIEmbeddings(
  { openAIApiKey: process.env.OPENAI_API_KEY }
);

// Function to process embeddings and log them
export const processEmbeddings = async (chunks: { content: string, metadata: any }[]) => {
  try {
    let i = 1
    for (const chunk of chunks) {
      // Generate embeddings for the chunk using LangChain
      const [embedding] = await embeddingModel.embedDocuments([chunk.content]);
      
      // Log the embedding and its size
      console.log(`Embedding for chunk: ${i} :`, chunk.content);
      console.log(`Embedding vector (size: ${embedding.length}):`, embedding);
      i += 1
    }
    console.log("Done Vectorization")
  } catch (error) {
    console.error("Error processing embeddings:", error);
  }
};

// Embedding Query
export const embedQuery = async (query: {content: string, metadata:any}) => {
  const res = await embeddingModel.embedQuery(query.content);
  console.log(`Embedding for chunk:`, query.content);
  console.log(`Embedding for chunk:`, res);
}