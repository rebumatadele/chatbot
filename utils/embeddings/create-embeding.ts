"use server"
import { OpenAIEmbeddings } from "@langchain/openai";

// Initialize LangChain's OpenAI embedding model
const embeddingModel = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});


// Function to process embeddings with user metadata
export const processEmbeddings = async (
  userId: string,
  chunks: { content: string; metadata: any }[]
) => {
  try {
    let i = 1;
    const embeddings = [];
    for (const chunk of chunks) {
      // Generate embeddings for the chunk using LangChain
      const [embedding] = await embeddingModel.embedDocuments([chunk.content]);

      // Push embedding with metadata for storing
      embeddings.push({
        id: `user-${userId}-chunk-${i}`, // Unique ID for each chunk
        values: embedding,
        metadata: { ...chunk.metadata, userId, text: chunk.content }, // Include original text
      });

      console.log(`Embedding for chunk: ${i} :`, chunk.content);
      console.log(`Embedding vector (size: ${embedding.length}):`, embedding);
      i += 1;
    }

    console.log("Done Vectorization");
    return embeddings;
  } catch (error) {
    console.error("Error processing embeddings:", error);
    throw error;
  }
};

// Embedding Query (for future use)
export const embedQuery = async (query: { content: string; metadata: any }) => {
  const res = await embeddingModel.embedQuery(query.content);
  console.log(`Embedding for query:`, query.content);
  console.log(`Embedding result:`, res);
  return res;
};
