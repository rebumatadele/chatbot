"use server"
import { Pinecone } from '@pinecone-database/pinecone'
import { embedQuery } from '../../embeddings/gemini-embedding';

// Initialize Pinecone client
const api_key = process.env.PINECONE_API_KEY || ""
const pc = new Pinecone({ apiKey : api_key })
// Function to search for the nearest vector match and retrieve the document
export const SearchVector = async (email:string, text: any, indexName:string, top:number) => {
  const index = pc.index(indexName)
    // Get the embedding (vector) for the input text
    const vector = await embed(text, email);

    // Query Pinecone index using the vector
    const queryResponse = await index.namespace(email).query({
        vector: vector,
        topK: top, // Get the top match
        includeValues: true,
        includeMetadata: true, // Include metadata in the response
    });

    console.log("Query Response: ", queryResponse)
    
    // Check if matches were found
    if (queryResponse.matches.length > 0) {
        // Aggregate all retrieved texts into a single passage
        const aggregatedText = queryResponse.matches
            .map(match => match.metadata?.text) // Extract the text from metadata
            .filter(text => text) // Filter out any undefined or null texts
            .join('\n'); // Combine texts with a newline separator

        return aggregatedText;
    } else {
        console.warn("No matches found");
        return null;
    }
}

// Embedding function to create the vector from text
const embed = async (text: string, userId: string): Promise<number[]> => {
    // Create the query object
    const query = {
      content: text,
      metadata: {
        userId, // Add userId to metadata
      },
    };

    // Get the embedding result for the query
    const embedding = await embedQuery(query);

    // After getting the embedding, process it as needed
    const chunk = {
      values: embedding, // Embedding returned by embedQuery
      metadata: { ...query.metadata }, // Metadata with userId included
    };

    // Now you can use the `chunk` object as needed
    console.log("Processed chunk with embedding embed:", chunk);

    return embedding; // Return the embedding values
};
