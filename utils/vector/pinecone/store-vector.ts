"use server";
import { Pinecone } from "@pinecone-database/pinecone";
import { processEmbeddings } from "../../embeddings/gemini-embedding"; // Import the embedding function

// Initialize Pinecone client
const api_key = process.env.PINECONE_API_KEY || "";
const pc = new Pinecone({ apiKey: api_key });

// Function to store user-specific vectors
export const storeUserVectors = async (
  email: string,
  chunks: { content: string; metadata: any }[],
  indexName: string,
) => {
  try {
    // Generate embeddings for the chunks
    const embeddings = await processEmbeddings(email, chunks);

    // Get the list of indexes with retry logic
    const indexNames = await retryOn404(() => pc.listIndexes(), 3, 1000)
      .then(indexList => indexList?.indexes?.map((index) => index.name) || []);

    // Create index if it doesn't exist
    if (!indexNames.includes(indexName)) {
      await CreateIndex(indexName);

      // Poll for index readiness
      await pollIndexReadiness(indexName);
    }

    // Fetch the index and upsert embeddings
    const index = pc.index(indexName);
    await retryOn404(() => index.namespace(email).upsert(embeddings), 3, 1000);

    console.log(`Successfully stored embeddings for user: ${email}`);
  } catch (error) {
    console.error("Error storing embeddings:", error);
    throw error;
  }
};

// Function to create an index
const CreateIndex = async (indexName: string) => {
  try {
    await pc.createIndex({
      name: indexName,
      dimension: 768, // Your model dimensions
      metric: 'cosine', // Your model metric
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });
    console.log(`Index ${indexName} created successfully.`);
  } catch (error) {
    console.error(`Error creating index ${indexName}:`, error);
    throw error;
  }
};

// Function to poll index readiness
const pollIndexReadiness = async (indexName: string, maxRetries = 10, retryDelay = 5000): Promise<void> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const describeIndex = await pc.describeIndex(indexName);
      if (describeIndex.status?.ready) {
        console.log(`Index ${indexName} is ready.`);
        return;
      }
    } catch (error) {
      console.error(`Error checking index status`);
    }

    console.log(`Index ${indexName} is not ready. Retrying in ${retryDelay / 1000} seconds...`);
    await delay(retryDelay);
  }

  throw new Error(`Index ${indexName} was not ready after ${maxRetries} attempts.`);
};

// Retry logic with error handling for specific cases (404 errors)
const retryOn404 = async <T>(fn: () => Promise<T>, maxRetries: number, retryDelay: number): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.error(`Attempt ${attempt} failed with 404:`, error);
        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay / 1000} seconds...`);
          await delay(retryDelay);
        } else {
          throw error;
        }
      } else {
        throw error; // Throw other errors directly
      }
    }
  }
  throw new Error('Max retries reached.');
};

// Utility function for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Optional: Function to delete an index with retry logic for 404 errors and index existence check
export const DeleteIndex = async (indexName: string): Promise<string> => {
  try {
    // Check if the index exists before attempting to delete
    const indexNames = await retryOn404(() => pc.listIndexes(), 3, 1000)
      .then(indexList => indexList?.indexes?.map((index) => index.name) || []);

    if (!indexNames.includes(indexName)) {
      return `Index ${indexName} does not exist, skipping deletion.`;
    }

    // Proceed with deletion if the index exists
    await retryOn404(() => pc.deleteIndex(indexName), 3, 1000);
    return `Index ${indexName} deleted successfully.`;
  } catch (error) {
    return `Error deleting index ${indexName}`;
  }
};
