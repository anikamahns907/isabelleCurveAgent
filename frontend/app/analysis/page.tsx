"use client";

import { useState, useRef, useEffect } from "react";
import PdfUploadBox from "@/components/PdfUploadBox";
import ChatInput from "@/components/ChatInput";
import AnalysisMessageBlock from "@/components/AnalysisMessageBlock";
import ChatBubble from "@/components/ChatBubble";
import {
  uploadArticlePDF,
  sendAnalysisAnswer,
  exportConversation,
} from "@/lib/api";

interface AnalysisTurn {
  type: "question" | "response";
  content?: string; // For initial question
  reflection?: string;
  clarification?: string;
  followupQuestion?: string | null;
  studentAnswer?: string;
}

export default function AnalysisPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turns, setTurns] = useState<AnalysisTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [turns, isLoading]);

  const handlePdfUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await uploadArticlePDF(file);
      setConversationId(String(response.conversation_id));
      setTurns([
        {
          type: "question",
          content: response.next_question,
        },
      ]);
      setIsComplete(false);
    } catch (error) {
      alert(
        `Failed to upload PDF: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (!conversationId) return;

    const studentTurn: AnalysisTurn = {
      type: "response",
      studentAnswer: answer,
    };
    setTurns((prev) => [...prev, studentTurn]);
    setIsLoading(true);

    try {
      const response = await sendAnalysisAnswer(conversationId, answer);
      const aiTurn: AnalysisTurn = {
        type: "response",
        reflection: response.reflection,
        clarification: response.clarification,
        followupQuestion: response.followup_question,
      };
      setTurns((prev) => [...prev, aiTurn]);

      if (response.followup_question === null) {
        setIsComplete(true);
      }
    } catch (error) {
      alert(
        `Failed to send answer: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!conversationId) return;

    try {
      const data = await exportConversation(conversationId);
      
      // Format transcript as markdown
      let markdown = `# Conversation Export\n\nConversation ID: ${data.conversation_id}\n\n---\n\n`;
      
      data.transcript.forEach((entry) => {
        const role = entry.role === "ai" ? "AI" : "Student";
        const timestamp = new Date(entry.timestamp).toLocaleString();
        markdown += `## ${role} (${timestamp})\n\n`;
        
        // Try to parse JSON content (for AI responses with reflection/clarification)
        try {
          const parsed = JSON.parse(entry.content);
          if (parsed.reflection) {
            markdown += `### Reflection\n${parsed.reflection}\n\n`;
          }
          if (parsed.clarification) {
            markdown += `### Clarification\n${parsed.clarification}\n\n`;
          }
          if (parsed.followup_question) {
            markdown += `### Follow-up Question\n${parsed.followup_question}\n\n`;
          }
        } catch {
          // Not JSON, just plain text
          markdown += `${entry.content}\n\n`;
        }
        markdown += "---\n\n";
      });

      // Download file
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${conversationId}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(
        `Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {!conversationId ? (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="mb-2 text-2xl font-semibold text-gray-900">
                  Article Analysis
                </h1>
                <p className="text-gray-600">
                  Upload a PDF article to start a guided Q&A session
                </p>
              </div>
              <PdfUploadBox onUpload={handlePdfUpload} disabled={isUploading} />
              {isUploading && (
                <div className="text-center text-sm text-gray-500">
                  Processing PDF...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {turns.map((turn, idx) => {
                if (turn.type === "question") {
                  return (
                    <ChatBubble
                      key={idx}
                      message={turn.content || ""}
                      isUser={false}
                    />
                  );
                } else {
                  return (
                    <div key={idx} className="space-y-4">
                      {turn.studentAnswer && (
                        <ChatBubble
                          message={turn.studentAnswer}
                          isUser={true}
                        />
                      )}
                      {turn.reflection && turn.clarification && (
                        <AnalysisMessageBlock
                          reflection={turn.reflection}
                          clarification={turn.clarification}
                          followupQuestion={turn.followupQuestion || null}
                        />
                      )}
                    </div>
                  );
                }
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                    </div>
                  </div>
                </div>
              )}
              {isComplete && (
                <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6 text-center">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Session Complete
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Great work! You&apos;ve completed the analysis session.
                  </p>
                  <button
                    onClick={handleExport}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    Export Conversation
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      {conversationId && !isComplete && (
        <ChatInput
          onSend={handleAnswer}
          disabled={isLoading}
          placeholder="Type your answer..."
        />
      )}
    </div>
  );
}
