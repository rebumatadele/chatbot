"use client";
import React, { useState } from "react";
import { processFile } from "@/utils/create-chunk";
import { SearchVector } from "@/utils/search-vector";
import { generateWithAnthropic } from "@/utils/claude/integrate";

const ChatRoom = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<any>();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsLoading(true);
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", selectedFile);
      await processFile(formData);
      setIsLoading(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const mockResponse = await SearchVector(query);
    console.log("Response", mockResponse);
    const response = await generateWithAnthropic(
      query + "use the following as a context and respond in 2 sentence" + mockResponse
    );
    console.log("Response", response);
    setResponse(response);
    setQuery("");
    setFile(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-5">
      <h1 className="text-3xl font-bold mb-6">Chatbot</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center w-full max-w-md"
      >
        <div className="mb-4 w-full">
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2"
          />
          {isLoading && (
            <div className="mt-2 flex justify-center">
              <div className="border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
            </div>
          )}
        </div>
        <div className="mb-4 w-full">
          <input
            type="text"
            placeholder="Write your query here..."
            value={query}
            onChange={handleQueryChange}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
        >
          {isLoading ? "Loading..." : "Send"}
        </button>
      </form>

      {isLoading && (
        <div className="mt-6 flex justify-center">
          <div className="border-4 border-blue-500 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
        </div>
      )}

      {response && (
        <div className="mt-6 bg-gray-200 rounded-lg p-4 w-full max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">Response:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;