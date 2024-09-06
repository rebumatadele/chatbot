import { Pinecone } from "@pinecone-database/pinecone";
import { processEmbeddings } from "./create-embeding"; // Import the embedding function

// Initialize Pinecone client
const pc = new Pinecone({
    apiKey: '55304c21-e607-44c2-a788-abc8438a5010'
  });

// Define the index name where you want to store the vectors
const indexName = "user-embeddings-index";

// Function to store user-specific vectors
export const storeUserVectors = async (
  userId: string,
  chunks: { content: string; metadata: any }[]
) => {
  try {
    // Generate embeddings for the chunks
    const embeddings = await processEmbeddings(userId, chunks);

    // get a list of indexes
    const indexList = await pc.listIndexes();
    const indexNames = indexList?.indexes?.map((index) => index.name) || [];
    if(!indexNames.includes(indexName)){
        CreateIndex("user-embeddings-index")
    }
    // Upsert (insert or update) the embeddings into the index
    const index = pc.index(indexName);
    await index.namespace("book").upsert(embeddings);

    console.log(`Successfully stored embeddings for user: ${userId}`);
  } catch (error) {
    console.error("Error storing embeddings:", error);
    throw error;
  }
};

const CreateIndex = async (indexName: string) => {
 // Create an index (if not already created)
    await pc.createIndex({
        name: indexName,
        dimension: 1536, // Replace with your model dimensions
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
// // Function to check if the index exists
// const checkIfIndexExists = async (indexName: string) => {
//     try {
//         const indices = await pc.listIndexes();
//         return indices.includes(indexName);
//     } catch (error) {
//         console.error("Error checking index:", error);
//         return false;
//     }
// };