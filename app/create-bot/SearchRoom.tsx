"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CopyIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "next-auth/react";
import Context from "@/utils/prompt-engineering/context-chain";
import { SearchVector } from "@/utils/vector/pinecone/search-vector";
import { toast } from "sonner";
import { generateWithGoogle } from "@/utils/providers/google/integrate";
import { DeleteIndex } from "@/utils/vector/pinecone/store-vector";
import { processFile } from "@/utils/preprocess/create-chunk";
import PDF from "@/utils/preprocess/pdf-parsing"; // Ensure this is imported
import { generateWithAnthropic } from "@/utils/providers/claude/integrate";

export default function SearchRoom() {
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [outputs, setOutputs] = useState<string[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // Added loader for search

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIsUploading(true);
      try {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);

        for (const selectedFile of selectedFiles) {
          let formData = new FormData();

          if (selectedFile.type === "application/pdf") {
            const fd = new FormData();
            fd.append("pdf", selectedFile);
            const pdfContent = await PDF(fd);
            formData.append("file", pdfContent);
          } else {
            formData.append("file", selectedFile);
          }

          try {
            await processFile(await fetchSession(), formData);
          } catch (error) {
            console.error("File processing error:", error);
            toast.error("Failed to process file");
          }
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const fetchSession = async () => {
    const session = await getSession();
    return session?.user?.email || "";
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true); // Start the search loader
    try {
      const userSession = await fetchSession();
      const queryResponse = await Context(searchQuery, userSession);
      const queryResp = queryResponse?.toString() || "";
      setQuery(queryResp);

      let context = await SearchVector(
        userSession,
        searchQuery + " : " + queryResponse,
        "context-index",
        5
      );

      let response;
      if (context) {
        response = await generateWithAnthropic(
          `Rewrite the following paragraphs into cohesive human readable ones
          i want you to return all the paragraphs
          separate the paragraphs using line breaks
          remove any markups like *
          the paragraphs: ${context}`
        );
      }
      if (response == null) {
        toast.warning("Network Error Try Again");
      } else {
        setOutputs([`${response}`]);
      }
    } catch (error) {
      toast.warning("Search was not successful");
      console.error("Search error:", error);
    } finally {
      setIsSearching(false); // End the search loader
    }
  };

  const handleClearContext = () => {
    setFiles([]);
    setSearchQuery("");
    setOutputs([]);
    toast.warning(DeleteIndex("context-index"));
    toast.warning(DeleteIndex("query-index"));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-4 space-y-4">
      <div className="text-xl font-bold">Claude AI Search Engine</div>
        <div className="space-y-2">
          <Input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full"
          />
          {isUploading && (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          )}
          <p className="text-sm text-muted-foreground">
            Selected files: {files.map((file) => file.name).join(", ")}
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </form>

        <Button onClick={handleClearContext} variant="outline">
          Clear Context
        </Button>

        <div className="space-y-4">
          {outputs.map((output, index) => (
            <Card key={index}>
              <CardContent className="p-4 relative">
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(output)}
                >
                  <CopyIcon className="h-4 w-4" />
                  <span className="sr-only">Copy output</span>
                </Button>
                <Textarea
                  value={output}
                  readOnly
                  className="min-h-[500px] max-h-[1000px] resize-none"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
