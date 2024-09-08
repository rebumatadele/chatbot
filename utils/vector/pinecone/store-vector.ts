"use server";
import { Pinecone } from "@pinecone-database/pinecone";
import { processEmbeddings } from "../../embeddings/gemini-embedding"; // Import the embedding function

// Initialize Pinecone client
const api_key = process.env.PINECONE_API_KEY || "";
const pc = new Pinecone({
  apiKey: api_key
});

// Function to store user-specific vectors
export const storeUserVectors = async (
  email: string,
  chunks: { content: string; metadata: any }[],
  indexName: string,
) => {
  try {
    // Generate embeddings for the chunks
    const embeddings = await processEmbeddings(email, chunks);

    // Get a list of indexes
    let indexList = await pc.listIndexes();
    let indexNames = indexList?.indexes?.map((index) => index.name) || [];
    
    if (!indexNames.includes(indexName)) {
      await CreateIndex(indexName);

      // Recheck index availability
      let indexExists = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        // Introduce a delay before rechecking
        await delay(2000); // 2-second delay
        indexList = await pc.listIndexes();
        indexNames = indexList?.indexes?.map((index) => index.name) || [];
        if (indexNames.includes(indexName)) {
          indexExists = true;
          break;
        }
      }

      if (!indexExists) {
        throw new Error(`Index ${indexName} was not found after creation.`);
      }
    }

    // Fetch the index and upsert (insert or update) the embeddings
    const index = pc.index(indexName);
    await index.namespace(email).upsert(embeddings);

    console.log(`Successfully stored embeddings for user: ${email}`);
  } catch (error) {
    console.error("Error storing embeddings:", error);
    throw error;
  }
};

// Function to create an index if it doesn't exist
const CreateIndex = async (indexName: string) => {
  try {
    await pc.createIndex({
      name: indexName,
      dimension: 768, // Replace with your model dimensions
      metric: 'cosine', // Replace with your model metric
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    console.log(`Index ${indexName} created successfully.`);
  } catch (error) {
    console.error(`Error creating index ${indexName}:`, error);
    throw error;
  }
};

// Utility function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Optional: Function to delete an index
export const DeleteIndex = async (indexName: string) => {
  try {
    await pc.deleteIndex(indexName);
    console.log(`Index ${indexName} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting index ${indexName}:`, error);
    throw error;
  }
};
