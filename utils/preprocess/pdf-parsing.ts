"use server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import pdfParser from "pdf-parse";

export default async function PDF(formData: FormData) {
    const file = formData.get("pdf");
    console.log("I am here");
    
    if (!(file instanceof File)) {
        throw new Error("No valid PDF file provided");
    }

    // Generate a unique filename and save directory
    const fileName = `${uuidv4()}.pdf`;
    const filePath = path.join(process.cwd(), "temp", fileName);

    try {
        // Create a buffer from the file and save it to disk
        const buffer = Buffer.from(await file.arrayBuffer());

        // Ensure the temp folder exists
        fs.mkdirSync(path.dirname(filePath), { recursive: true });

        // Write the file to the temp directory
        fs.writeFileSync(filePath, buffer);

        // Ensure file exists before reading
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at ${filePath}`);
        }

        const dataBuffer = fs.readFileSync(filePath);
        
        // Parse the PDF file from the path
        console.log("File Path", filePath);
        const pdfData = await pdfParser(dataBuffer);
        console.log("pdf data", pdfData);
        const text = pdfData.text;

        return text;
    } catch (error) {
        console.error("Error processing PDF:", error);
        throw new Error("Failed to process PDF");
    } finally {
        // Clean up and remove the file after processing
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            console.log("File cleanup done");
        } catch (cleanupError) {
            console.error("Error cleaning up file:", cleanupError);
        }
    }
}
