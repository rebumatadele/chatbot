"use server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import pdfParser from "pdf-parse";

export default async function PDF(formData: any) {
    const file = formData.get("pdf");

    // Check if file is provided
    if (!file) {
        throw new Error("No valid PDF file provided");
    }

    // Generate a unique file name
    const fileName = `${uuidv4()}.pdf`;
    const tempDir = "/tmp";  // For environments like AWS Lambda
    const filePath = path.join(tempDir, fileName);

    try {
        // Ensure the /tmp directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Write the buffer to a file in /tmp
        fs.writeFileSync(filePath, buffer);

        // Parse the PDF file from the buffer
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParser(dataBuffer);

        // Return the parsed text from the PDF
        return pdfData.text;
    } catch (error) {
        console.error("Error processing PDF:", error);
        throw new Error("Failed to process PDF");
    } finally {
        // Clean up the file after processing
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
