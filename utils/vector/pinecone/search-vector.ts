"use server";
import { Pinecone } from '@pinecone-database/pinecone';
import { embedQuery } from '../../embeddings/gemini-embedding';

// Initialize Pinecone client
const api_key = process.env.PINECONE_API_KEY || "";
const pc = new Pinecone({ apiKey: api_key });

// Function to search for the nearest vector match and retrieve the document
export const SearchVector = async (
  email: string,
  text: string,
  indexName: string,
  top: number
): Promise<string | null> => {
  try {
    const index = pc.index(indexName);

    // Get the embedding (vector) for the input text
    const vector = await embed(text, email);

    // Query Pinecone index using the vector
    const queryResponse = await index.namespace(email).query({
      vector: vector,
      topK: top, // Get the top matches
      includeValues: true,
      includeMetadata: true, // Include metadata in the response
    });

    const similarityThreshold = 0.5; // Example threshold for similarity

    // Check if matches were found
    if (queryResponse.matches.length > 0) {
      // Aggregate all retrieved texts into a single passage
      const aggregatedText = queryResponse.matches
        .filter(match => match.score !== undefined && match.score >= similarityThreshold) // Filter based on similarity score
        .map(match => match.metadata?.text) // Extract the text from metadata
        .filter(text => text) // Filter out any undefined or null texts
        .join('\n'); // Combine texts with a newline separator

      if (aggregatedText) {
        return aggregatedText; // Return the aggregated text
      } else {
        return  null;
      }
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// Embedding function to create the vector from text
const embed = async (text: string, userId: string): Promise<number[]> => {
  try {
    // Create the query object
    const query = {
      content: text,
      metadata: { userId }, // Add userId to metadata
    };

    // Get the embedding result for the query
    const embedding = await embedQuery(query);

    // Process the embedding and return the values
    return embedding;
  } catch (error) {
    throw new Error(`Error generating embedding`);
  }
};
