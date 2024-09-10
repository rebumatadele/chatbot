"use server";
import { storeUserVectors } from '../vector/pinecone/store-vector';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

export const processFile = async (email: string, formData: FormData) => {    
    const file = formData.get('file');
    
    if (!file) {
        console.warn("No file provided.");
        return;
    }

    try {
        // Read the file content as text or use the string directly
        const fileContent = file instanceof File ? await file.text() : file;

        if (fileContent) {
            // Use file name if it's a File, otherwise a default name for string content
            const fileName = file instanceof File ? file.name : 'uploaded-text';

            // Split the file content into chunks of 2000 characters
            const chunks = await splitTextIntoChunks(fileContent, 2000, fileName);

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


// Helper function to split the text into chunks with metadata
export const splitTextIntoChunks = async (text: string, chunkSize: number, source: string) => {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: chunkSize,
        chunkOverlap: Math.ceil(chunkSize/10),
    });

    const chunks = await splitter.createDocuments([text]);

    // Return an array of objects with content and metadata
    return chunks.map(chunk => ({
        content: chunk.pageContent, // Extract chunk text
        metadata: { source }        // Attach metadata (source)
    }));
};