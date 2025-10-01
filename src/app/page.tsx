"use client";
import { useState, useRef } from "react";
import { HTTP_CONSTANTS } from "../config/constants";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"chat" | "nlq">("nlq"); // Default to NLQ mode
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const userMessage: Message = {
        role: "user",
        content: input.trim(),
        id: Date.now().toString()
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      // Add assistant message placeholder
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        id: (Date.now() + 1).toString()
      };
      setMessages([...updatedMessages, assistantMessage]);

      try {
        const endpoint = mode === "chat" ? "/api/chat" : "/api/nlq";
        const body = mode === "chat"
          ? {
              messages: updatedMessages.map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            }
          : { query: userMessage.content };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": HTTP_CONSTANTS.CONTENT_TYPE.JSON,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        if (mode === "chat") {
          // Handle streaming chat response
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let accumulatedContent = "";

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              accumulatedContent += chunk;

              setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === "assistant") {
                  lastMessage.content = accumulatedContent;
                }
                return newMessages;
              });

              scrollToBottom();
            }
          }
        } else {
          // Handle NLQ JSON response
          const result = await response.json();

          if (result.error) {
            let errorContent = `**Error:** ${result.error}`;

            if (result.details) {
              errorContent += `\n\n**Details:** ${result.details}`;
            }

            if (result.validationErrors) {
              errorContent += `\n\n**Validation Errors:**\n${result.validationErrors.map((err: string, i: number) => `${i + 1}. ${err}`).join('\n')}`;
            }

            if (result.parseError) {
              errorContent += `\n\n**Parse Error:** ${result.parseError}`;
            }

            if (result.rawResponse) {
              errorContent += `\n\n**Raw AI Response:**\n\`\`\`\n${result.rawResponse}\n\`\`\``;
            }

            if (result.plan) {
              errorContent += `\n\n**Generated Plan:**\n\`\`\`json\n${JSON.stringify(result.plan, null, 2)}\n\`\`\``;
            }

            if (result.compiledQuery) {
              errorContent += `\n\n**Compiled Query:**\n\`\`\`graphql\n${result.compiledQuery}\n\`\`\``;
            }

            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === "assistant") {
                lastMessage.content = errorContent;
              }
              return newMessages;
            });
          } else {
            // Format the NLQ response
            const formattedResponse = `
**Query Plan:**
\`\`\`json
${JSON.stringify(result.plan, null, 2)}
\`\`\`

**Compiled GraphQL:**
\`\`\`graphql
${result.compiledQuery}
\`\`\`

**Results:**
\`\`\`json
${JSON.stringify(result.data, null, 2)}
\`\`\`
${result.entityResolutions ? `\n**Entity Resolutions:**\n${JSON.stringify(result.entityResolutions, null, 2)}` : ""}
            `.trim();

            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === "assistant") {
                lastMessage.content = formattedResponse;
              }
              return newMessages;
            });
          }
        }
      } catch (error) {
        console.error("Error:", error);
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === "assistant") {
            lastMessage.content = `Sorry, I encountered an error: ${error instanceof Error ? error.message : String(error)}`;
          }
          return newMessages;
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <main style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        NL-GraphQL Demo - Connected to Groq (GPT-OSS-20B)
      </h1>

      {/* Mode Toggle */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setMode("nlq")}
          style={{
            padding: "8px 16px",
            backgroundColor: mode === "nlq" ? "#007bff" : "#f8f9fa",
            color: mode === "nlq" ? "white" : "#333",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          NL-GraphQL
        </button>
        <button
          onClick={() => setMode("chat")}
          style={{
            padding: "8px 16px",
            backgroundColor: mode === "chat" ? "#007bff" : "#f8f9fa",
            color: mode === "chat" ? "white" : "#333",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Chat
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: "auto",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
        backgroundColor: "#f9f9f9"
      }}>
        {messages.length === 0 && (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            {mode === "nlq"
              ? "Welcome! Ask natural language questions about football stats (e.g., 'Show me Mohamed Salah's goals this season')"
              : "Welcome! Ask me anything using the GPT-OSS-20B model"
            }
          </p>
        )}
        {messages.map((message) => (
          <div key={message.id} style={{
            marginBottom: "12px",
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: message.role === "user" ? "#e3f2fd" : "#fff",
            border: message.role === "assistant" ? "1px solid #e0e0e0" : "none",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word"
          }}>
            <strong style={{ color: message.role === "user" ? "#1976d2" : "#2e7d32" }}>
              {message.role === "user" ? "You" : "Assistant"}:
            </strong>{" "}
            {message.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "nlq" ? "Ask about football stats (e.g., 'Liverpool's recent matches')..." : "Type your message..."}
          style={{
            flex: 1,
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "16px"
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: "12px 24px",
            backgroundColor: isLoading || !input.trim() ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "16px"
          }}
        >
          {isLoading ? "..." : mode === "nlq" ? "Query" : "Send"}
        </button>
      </form>
    </main>
  );
}
