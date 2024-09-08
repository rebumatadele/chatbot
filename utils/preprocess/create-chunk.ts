"use server";
import { storeUserVectors } from '../vector/pinecone/store-vector';

export const processFile = async (email: string, formData: FormData) => {
    const file = formData.get('file') as File;
    
    if (!file) {
        console.warn("No file provided.");
        return;
    }

    console.log("Processing file:", file.name);

    try {
        // Read the file content as text
        const fileContent = await file.text();

        if (fileContent) {
            // Split the file content into chunks of 1000 characters
            const chunks = splitTextIntoChunks(fileContent, 500, file.name);

            // Log the chunks for debugging
            console.log("Chunks:", chunks);

            // Process the chunks to generate embeddings and store in Pinecone
            await storeUserVectors(email, chunks, "context-index");
        } else {
            console.warn("File content is empty or undefined.");
        }
    } catch (error) {
        console.error("Error processing file:", error);
    }
};

// Helper function to split the text into chunks
const splitTextIntoChunks = (text: string, chunkSize: number, source: string) => {
    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        const chunk = text.slice(startIndex, startIndex + chunkSize);
        const chunkData = {
            content: chunk,
            metadata: {
                source,
                startIndex,
            },
        };
        chunks.push(chunkData);
        startIndex += chunkSize;
    }

    return chunks;
};
