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
            const chunks = await splitTextIntoChunks(fileContent, 500, file.name);

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

// Helper function to split the text into chunks with period search
export const splitTextIntoChunks = (text: string, chunkSize: number, source: string) => {
    const chunks = [];
    let startIndex = 0;

    // If text is shorter than the chunk size, push the entire text
    if (text.length <= chunkSize) {
        chunks.push({
            content: text,
            metadata: {
                source,
                startIndex,
            },
        });
        return chunks;
    }

    // Split the text into chunks
    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;

        // If chunk size exceeds the remaining text, push what's left
        if (endIndex >= text.length) {
            endIndex = text.length;
        } else {
            // Look for a period within the next 50 characters after the chunk
            const periodIndex = text.slice(endIndex, endIndex + 50).indexOf('.');

            // If a period is found, adjust the endIndex to include it
            if (periodIndex !== -1) {
                endIndex += periodIndex + 1; // Include the period
            }
        }

        const chunk = text.slice(startIndex, endIndex);
        const chunkData = {
            content: chunk,
            metadata: {
                source,
                startIndex,
            },
        };
        chunks.push(chunkData);

        // Update the startIndex for the next chunk
        startIndex = endIndex;
    }

    return chunks;
};
