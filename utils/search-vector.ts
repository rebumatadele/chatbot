"use server"
import { Pinecone } from '@pinecone-database/pinecone'
import { embedQuery } from './create-embeding';

// Initialize Pinecone client
const pc = new Pinecone({ apiKey : "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"})
const index = pc.index("user-embeddings-index")
// Function to search for the nearest vector match and retrieve the document
export const SearchVector = async (text: any) => {
    // Get the embedding (vector) for the input text
    const vector = await embed(text, "user 1");

    // Query Pinecone index using the vector
    const queryResponse = await index.namespace("book").query({
        vector: vector,
        topK: 10, // Get the top match
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
