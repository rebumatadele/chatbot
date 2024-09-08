import { Pinecone } from "@pinecone-database/pinecone";
// import { processEmbeddings } from "./create-embeding"; // Import the embedding function
import { processEmbeddings } from "../../embeddings/gemini-embedding"; // Import the embedding function

// Initialize Pinecone client
const api_key = process.env.PINECONE_API_KEY || ""
const pc = new Pinecone({
    apiKey: api_key
  });

// Define the index name where you want to store the vectors
const indexName = "context-index";

// Function to store user-specific vectors
export const storeUserVectors = async (
  email: string,
  chunks: { content: string; metadata: any }[]
) => {
  try {
    // Generate embeddings for the chunks
    const embeddings = await processEmbeddings(email, chunks);

    // get a list of indexes
    const indexList = await pc.listIndexes();
    const indexNames = indexList?.indexes?.map((index) => index.name) || [];
    if(!indexNames.includes(indexName)){
        CreateIndex(indexName)
    }
    // Upsert (insert or update) the embeddings into the index
    const index = pc.index(indexName);
    await index.namespace(email).upsert(embeddings);

    console.log(`Successfully stored embeddings for user: ${email}`);
  } catch (error) {
    console.error("Error storing embeddings:", error);
    throw error;
  }
};

const CreateIndex = async (indexName: string) => {
 // Create an index (if not already created)
    await pc.createIndex({
        name: indexName,
        // dimension: 1536, // Replace with your model dimensions
        dimension: 768,
        metric: 'cosine', // Replace with your model metric
        spec: { 
        serverless: { 
            cloud: 'aws', 
            region: 'us-east-1' 
        }
        } 
    });
}

const DeleteIndex = async () => {
    await pc.deleteIndex(indexName);

}
//  Function to check if the index exists
// const checkIfIndexExists = async (indexName: string) => {
//     try {
//         const indices = await pc.listIndexes();
//         return indices.includes(indexName);
//     } catch (error) {
//         console.error("Error checking index:", error);
//         return false;
//     }
// };