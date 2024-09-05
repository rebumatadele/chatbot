"use client"
import React, { useState } from 'react';
import { processFile } from '@/utils/create-chunk'; // Adjust the path as needed

const ChatRoom: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Use FileReader to read the file content
      const reader = new FileReader();

      // When the file is fully loaded, process it
      reader.onload = (event) => {
        const fileContent = event.target?.result;
        if (fileContent && selectedFile) {
          // File is fully loaded, process it
          console.log("File fully loaded, processing...");
          processFile(selectedFile);  // You can modify this to pass the content if needed
        }
      };

      // Read the file as text or as data URL, depending on the file type
      reader.readAsText(selectedFile);  // or reader.readAsDataURL(selectedFile);
    }
  };
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mockResponse = `Response to: ${query}`;
    setResponse(mockResponse);
    setQuery('');
    setFile(null);
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
          Send
        </button>
      </form>

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