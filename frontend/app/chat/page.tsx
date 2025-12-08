"use client";

import { useState, useRef, useEffect } from "react";
import ChatBubble from "@/components/ChatBubble";
import ChatInput from "@/components/ChatInput";
import { sendChat } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message: string) => {
    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const reader = await sendChat(message);

      // Insert one empty assistant bubble immediately
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let streamedText = "";
      const decoder = new TextDecoder();

      // STREAM LOOP
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamedText += decoder.decode(value);

        // Update existing assistant bubble
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: streamedText,
          };
          return updated;
        });
      }

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${
            error instanceof Error ? error.message : "Failed to send message"
          }`,
        },
      ]);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h1 className="mb-2 text-2xl font-semibold text-gray-900">
                  Biostats Tutor Chat
                </h1>
                <p className="text-gray-600">
                  Ask me anything about biostatistics!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => {
                const isAssistantTyping =
                  msg.role === "assistant" && msg.content === "" && isLoading;

                return (
                  <div key={idx}>
                    {isAssistantTyping ? (
                      // ONE bubble — shows only dots while empty
                      <div className="flex justify-start">
                        <div className="rounded-2xl bg-gray-100 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ChatBubble
                        message={msg.content}
                        isUser={msg.role === "user"}
                      />
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}

        </div>
      </div>

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
