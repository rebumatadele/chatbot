import { processEmbeddings } from "./create-embeding";
export const processFile = (file: File) => {
    // Perform operations with the file here
    console.log("Processing file:", file.name);
  
    // Example: Reading the file
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const fileContent = event.target?.result as string;
      
      if (fileContent) {
        // Split the file content into chunks of 1000 characters
        const chunks = splitTextIntoChunks(fileContent, 1000, file.name);
  
        // Log the chunks for debugging
        console.log("Chunks:", chunks);

        // Process the chunks to generate embeddings and store them in Chroma DB
        processEmbeddings(chunks);
      }
    };
  
    reader.readAsText(file);
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
  