"use client";
import { useState, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        const response = await fetch("/api/copilotkit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: updatedMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

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
      } catch (error) {
        console.error("Error:", error);
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === "assistant") {
            lastMessage.content = "Sorry, I encountered an error. Please try again.";
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
        Copilot Chat - Connected to Groq GPT-OSS-20B 🚀
      </h1>

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
            Welcome! Ask me something using the GPT-OSS-20B model...
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
          placeholder="Type your message..."
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
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </main>
  );
}
