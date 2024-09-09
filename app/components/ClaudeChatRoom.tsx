"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "next-themes";
import { getSession } from "next-auth/react";
import {
  ArrowUp,
  Loader2,
  Moon,
  Settings,
  Sun,
  User,
  X,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { processFile } from "@/utils/preprocess/create-chunk";
import { SearchVector } from "@/utils/vector/pinecone/search-vector";
import { generateWithGoogle } from "@/utils/providers/google/integrate";
import Context, {
  StoreContext,
} from "@/utils/prompt-engineering/context-chain";
import { DeleteIndex } from "@/utils/vector/pinecone/store-vector";
import { generateWithAnthropic } from "@/utils/providers/claude/integrate";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function ClaudeChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [query, setQuery] = useState<string | null>(null); // Added query state
  const [files, setFiles] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { theme, setTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSession = async () => {
    const session = await getSession();
    return session?.user?.email || "";
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      setIsLoading(true);

      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputMessage,
        isUser: true,
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputMessage("");

      const userSession = await fetchSession();
      const queryResponse = await Context(inputMessage, userSession);

      const queryResp = queryResponse?.toString() || "";
      setQuery(queryResp);

      try {
        let context = await SearchVector(
          userSession,
          inputMessage + " : " + queryResponse,
          "context-index",
          5
        );

        let response;
        if (context) {
          response = await generateWithAnthropic(
            `Given the context below, answer the user query in concise and human-readable format.
            Do not specifically mention the knowledge base in your response 
             Context: ${context}, 
             User Query: ${queryResponse}`
          );
        } else {
          response = await generateWithAnthropic(
            `Based on your general knowledge, answer the user query in concise and human-readable format. 
            Do not specifically mention the knowledge base in your response 
            User Query: ${queryResponse}`
          );
        }

        StoreContext(response?.toString() || "", userSession);

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: response?.toString() || "",
            isUser: false,
          },
        ]);
      } catch (error) {
        console.error("Error fetching response:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const selectedFile = e.target.files[0];
      setFiles(selectedFile);
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        await processFile(await fetchSession(), formData);
      } catch (error) {
        console.error("File processing error:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex justify-between items-center p-4 bg-background border-b">
        <div className="text-2xl font-bold">Claude AI</div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.isUser ? "justify-end" : "justify-start"
            } mb-4`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-muted/50 border-t">
        {/* Display query above the response when it's available */}
        {query && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[70%] p-3 rounded-lg bg-accent text-accent-foreground">
              <strong>Query:</strong> {query}
            </div>
          </div>
        )}
        <div className="flex items-center mb-2">
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label="Upload Files"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </div>
        {files && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <div className="flex items-center justify-between bg-background p-2 rounded">
              <span className="truncate text-sm">{files.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label="Remove File"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end space-x-2 p-4 bg-background border-t">
        <Textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-grow resize-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button
          onClick={handleSendMessage}
          size="icon"
          className="rounded-full h-10 w-10"
          disabled={isLoading}
          aria-label="Send Message"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>

        <Button
          onClick={() => {
            DeleteIndex("context-index");
            DeleteIndex("query-index");
            setMessages([]);
            toast("Context cleared Successfully");
          }}
          size="icon"
          className="rounded-full h-10 w-10"
          disabled={isLoading}
          aria-label="Clear Context"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "X"}
        </Button>
      </div>

      <footer className="p-2 bg-background border-t text-center text-sm text-muted-foreground">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </div>
        ) : (
          <span>Claude AI Chat</span>
        )}
      </footer>
    </div>
  );
}
