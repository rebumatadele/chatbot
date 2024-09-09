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
  Clipboard,
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
import { marked } from "marked"; // Import the Markdown parser

interface Message {
  id: string;
  type: "text" | "code" | "list" | "mixed";
  content: string | string[];
  isUser: boolean;
}

export default function ClaudeChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [query, setQuery] = useState<string | null>(null);
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
        type: "text",
        content: inputMessage,
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
          response = await generateWithGoogle(
            `Given the context below, answer the user query in concise and human-readable format.
            Do not specifically mention the knowledge base in your response 
             Context: ${context}, 
             User Query: ${queryResponse}`
          );
        } else {
          response = await generateWithGoogle(
            `Based on your general knowledge, answer the user query in concise and human-readable format. 
            Do not specifically mention the knowledge base in your response 
            User Query: ${queryResponse}`
          );
        }

        StoreContext(response?.toString() || "", userSession);

        // Handle mixed content types
        const formattedContent = await formatMixedContent(
          response?.toString() || ""
        );

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "mixed",
            content: formattedContent,
            isUser: false,
          },
        ]);
      } catch (error) {
        console.error("Error fetching response:", error);
        toast.error("Failed to fetch response");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatMixedContent = async (response: string): Promise<string[]> => {
    const htmlContent = await marked.parse(response); // Convert Markdown to HTML
    const div = document.createElement("div");
    div.innerHTML = htmlContent;

    const content: string[] = [];
    div.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName === "PRE") {
          content.push(`\`\`\`\n${element.textContent}\n\`\`\``);
        } else if (element.tagName === "UL") {
          element.querySelectorAll("li").forEach((li) => {
            content.push(`- ${li.textContent}`);
          });
        } else {
          content.push(element.textContent || "");
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        content.push(node.textContent || "");
      }
    });

    return content.filter((line) => line.trim().length > 0); // Filter out empty lines
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const selectedFile = e.target.files[0];
      setFiles(selectedFile);
      let formData = new FormData();
      if (selectedFile.type === "application/pdf") {
        // Handle PDF files if needed
      } else {
        formData.append("file", selectedFile);
      }

      try {
        await processFile(await fetchSession(), formData);
      } catch (error) {
        console.error("File processing error:", error);
        toast.error("Failed to process file");
      } finally {
        setIsUploading(false);
      }
    }
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevents moving to the next line
      if (inputMessage.trim() !== "") {
        handleSendMessage(); // Call the submit function
        setInputMessage(""); // Clear the textarea after submission
      }
    }
  };

  const handleCopy = (content: string | string[]) => {
    if (Array.isArray(content)) {
      content = content.join("\n");
    }
    navigator.clipboard.writeText(content);
    toast.success("Code copied to clipboard!");
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
              {message.type === "text" && <p>{message.content}</p>}
              {message.type === "code" && (
                <div className="relative">
                  <pre className="bg-gray-200 p-3 rounded">
                    <code>{message.content}</code>
                  </pre>
                  <Button
                    onClick={() => handleCopy(message.content)}
                    className="absolute top-2 right-2"
                    variant="ghost"
                    size="icon"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {/* Handle mixed content */}
              {message.type === "mixed" && Array.isArray(message.content) && (
                <div>
                  {message.content.map((line, index) => {
                    if (line.startsWith("```")) {
                      return (
                        <div key={index} className="relative">
                          <pre className="bg-gray-200 p-3 rounded">
                            <code>{line.substring(3, line.length - 3)}</code>
                          </pre>
                          <Button
                            onClick={() =>
                              handleCopy(line.substring(3, line.length - 3))
                            }
                            className="absolute top-2 right-2"
                            variant="ghost"
                            size="icon"
                          >
                            <Clipboard className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    } else if (line.startsWith("- ")) {
                      return (
                        <ul key={index} className="list-disc pl-5">
                          <li>{line.substring(2)}</li>
                        </ul>
                      );
                    } else {
                      return <p key={index}>{line}</p>;
                    }
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-muted/50 border-t">
        {query && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[70%] p-3 rounded-lg bg-accent text-accent-foreground">
              <strong>Query:</strong> {query}
            </div>
          </div>
        )}
        <div className="flex items-center mb-2 gap-3">
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="icon"
            className="mr-2"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </Button>

          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow mr-2"
            rows={2}
            disabled={isLoading}
            onKeyDown={handleKeyDown} // Attach the keydown event
          />
          <Button onClick={handleSendMessage} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </Button>
          <Button
            onClick={() => {
              DeleteIndex("context-index");
              DeleteIndex("query-index");
              setMessages([]);
              toast.warning("Context cleared Successfully");
            }}
            disabled={isLoading}
            aria-label="Clear Context"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "clear context"}
          </Button>
        </div>
        {files && <p className="text-sm">Selected file: {files.name}</p>}
      </div>
    </div>
  );
}
