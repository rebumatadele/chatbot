"use server";
import { Pinecone } from "@pinecone-database/pinecone";
import { processEmbeddings } from "../../embeddings/gemini-embedding"; // Import the embedding function

// Initialize Pinecone client
const api_key = process.env.PINECONE_API_KEY || "";
const pc = new Pinecone({
  apiKey: api_key,
});

// Function to store user-specific vectors
export const storeUserVectors = async (
  email: string,
  chunks: { content: string; metadata: any }[],
  indexName: string,
) => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1-second delay

  try {
    // Generate embeddings for the chunks
    const embeddings = await processEmbeddings(email, chunks);

    // Get a list of indexes with retry logic
    let indexList;
    let indexNames;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        indexList = await pc.listIndexes();
        indexNames = indexList?.indexes?.map((index) => index.name) || [];
        break; // Exit loop if successful
      } catch (error) {
        console.error(`Attempt ${attempt} to list indexes failed:`, error);
        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay / 1000} seconds...`);
          await delay(retryDelay);
        } else {
          throw error; // If all retries fail, propagate the error
        }
      }
    }

    if (!indexNames?.includes(indexName)) {
      await CreateIndex(indexName);

      // Recheck index availability with retry logic
      let indexExists = false;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          await delay(2000); // 2-second delay before rechecking
          indexList = await pc.listIndexes();
          indexNames = indexList?.indexes?.map((index) => index.name) || [];
          if (indexNames.includes(indexName)) {
            indexExists = true;
            break;
          }
        } catch (error) {
          console.error(`Attempt ${attempt + 1} to recheck index failed:`, error);
          if (attempt < maxRetries - 1) {
            await delay(retryDelay);
          } else {
            throw error;
          }
        }
      }

      if (!indexExists) {
        throw new Error(`Index ${indexName} was not found after creation.`);
      }
    }

    // Fetch the index and upsert embeddings with retry logic
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const index = pc.index(indexName);
        await index.namespace(email).upsert(embeddings);
        console.log(`Successfully stored embeddings for user : ${email}`);
        break; // Exit loop if successful
      } catch (error) {
        console.error(`Attempt ${attempt} to upsert embeddings failed:`, error);
        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay / 1000} seconds...`);
          await delay(retryDelay);
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error("Error storing embeddings:", error);
    throw error;
  }
};

// Function to create an index if it doesn't exist with retry logic
const CreateIndex = async (indexName: string) => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1-second delay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await pc.createIndex({
        name: indexName,
        dimension: 768, // Replace with your model dimensions
        metric: 'cosine', // Replace with your model metric
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      console.log(`Index ${indexName} created successfully.`);
      break; // Exit loop if successful
    } catch (error) {
      console.error(`Attempt ${attempt} to create index ${indexName} failed:`, error);
      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await delay(retryDelay);
      } else {
        throw error;
      }
    }
  }
};

// Utility function for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Optional: Function to delete an index with retry logic
export const DeleteIndex = async (indexName: string) => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1-second delay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await pc.deleteIndex(indexName);
      console.log(`Index ${indexName} deleted successfully.`);
      break; // Exit loop if successful
    } catch (error) {
      console.error(`Attempt ${attempt} to delete index ${indexName} failed:`, error);
      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await delay(retryDelay);
      } else {
        throw error;
      }
    }
  }
};
