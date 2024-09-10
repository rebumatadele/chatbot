"use server";
import { storeUserVectors } from '../vector/pinecone/store-vector';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export const processFile = async (email: string, formData: any) => {
    const file = formData.get('file'); // Fetch file from formData (Buffer or string expected)

    if (!file) {
        console.warn("No file provided.");
        return;
    }

    try {
        // Assuming the file is a buffer, convert it to a string
        const fileContent = typeof file === "string" ? file : Buffer.from(await file.arrayBuffer()).toString('utf-8');

        if (fileContent) {
            // Use a default name for the uploaded content
            const fileName = 'uploaded-text';

            // Split the file content into chunks of 2000 characters
            const chunks = await splitTextIntoChunks(fileContent, 2000, fileName);

            // Log the chunks for debugging
            console.log("Chunks:", chunks);

            // Store the chunks in Pinecone (vector database)
            await storeUserVectors(email, chunks, "context-index");
        } else {
            console.warn("File content is empty or undefined.");
        }
    } catch (error) {
        console.error("Error processing file:", error);
    }
};

// Helper function to split the text into chunks with metadata
export const splitTextIntoChunks = async (text: string, chunkSize: number, source: string) => {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: chunkSize,
        chunkOverlap: Math.ceil(chunkSize / 10), // 10% overlap
    });

    const chunks = await splitter.createDocuments([text]);

    // Return an array of objects with content and metadata
    return chunks.map(chunk => ({
        content: chunk.pageContent,  // Extract chunk text
        metadata: { source }         // Attach metadata (source)
    }));
};
