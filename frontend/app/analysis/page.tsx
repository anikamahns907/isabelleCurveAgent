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
  content?: string | null;  // <-- allow null
  reflection?: string;
  clarification?: string;
  followupQuestion?: string | null;
  studentAnswer?: string;
}


export default function AnalysisPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [articleTitle, setArticleTitle] = useState<string | null>(null);
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

    // INVALID ARTICLE CASE
    if (!response.is_valid || !response.conversation_id) {
      setConversationId(null);
      setTurns([
        {
          type: "question",
          content:
            response.message + "\n\n" +
            "**Browse for a different article:**\n\n" +
            "Here are recommended sources for empirical research articles:\n\n" +
            `• **Brown BruKnow Library:** [Search biostatistics articles](${response.suggestions?.bruKnow})\n` +
            `• **PubMed:** [Biomedical research database](${response.suggestions?.pubmed})\n` +
            `• **Nature Public Health:** [Research articles](${response.suggestions?.nature})\n` +
            `• **ScienceDirect:** [Scientific publications](${response.suggestions?.sciencedirect})\n\n` +
            "**Next Steps:**\n" +
            "1. Click the **'Reset Chat'** button below\n" +
            "2. Browse one of the sources above to find an empirical research article\n" +
            "3. Upload a new PDF that contains statistical methods and quantitative results"
        }
      ]);
      return;
    }

    // VALID ARTICLE CASE
    // ✅ VALID ARTICLE
    setConversationId(String(response.conversation_id));
    setArticleTitle(response.article_title || null);

    // CLEAR previous invalid messages
    setTurns([]);

    setTurns([
      {
        type: "question",
        content: response.next_question,
      },
    ]);

    setIsComplete(false);


  } catch (error) {
    alert(
      `Failed to upload PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
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
      
      // Import jsPDF dynamically
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();
      
      // PDF settings - minimal margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;
      const lineHeight = 5.5;
      
      // Helper to clean text (remove extra whitespace)
      const cleanText = (text: string): string => {
        return text.replace(/\s+/g, ' ').trim();
      };
      
      // Helper function to add text with word wrapping
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 9) => {
        doc.setFontSize(fontSize);
        const cleaned = cleanText(text);
        const lines = doc.splitTextToSize(cleaned, maxWidth);
        doc.text(lines, x, y);
        return lines.length * lineHeight;
      };
      
      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };
      
      // Minimal header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Article Analysis", margin, yPosition);
      yPosition += lineHeight * 1.2;
      
      // Article title
      if (data.article_title) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        const titleLines = doc.splitTextToSize(data.article_title, maxWidth);
        doc.text(titleLines, margin, yPosition);
        yPosition += titleLines.length * lineHeight * 1.1;
      }
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      if (data.article_id) {
        doc.text(`Article ID: ${data.article_id}`, margin, yPosition);
        yPosition += lineHeight * 0.8;
      }
      doc.text(`Conversation: ${data.conversation_id}`, margin, yPosition);
      yPosition += lineHeight * 1.5;
      doc.setTextColor(0, 0, 0);
      
      // Process each transcript entry
      data.transcript.forEach((entry) => {
        checkNewPage(lineHeight * 4);
        
        const role = entry.role === "ai" ? "Isabelle" : "Student";
        const timestamp = new Date(entry.timestamp).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        // Minimal role header
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text(`${role} • ${timestamp}`, margin, yPosition);
        yPosition += lineHeight * 1.2;
        doc.setTextColor(0, 0, 0);
        
        // Content
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        
        // Try to parse JSON content
        try {
          const parsed = JSON.parse(entry.content);
          const parts: string[] = [];
          
          if (parsed.reflection) {
            parts.push(`Reflection: ${cleanText(parsed.reflection)}`);
          }
          if (parsed.clarification) {
            parts.push(`Clarification: ${cleanText(parsed.clarification)}`);
          }
          if (parsed.followup_question) {
            parts.push(`Question: ${cleanText(parsed.followup_question)}`);
          }
          
          if (parts.length > 0) {
            const contentText = parts.join('\n');
            const height = addWrappedText(contentText, margin, yPosition, maxWidth);
            yPosition += height;
          }
        } catch {
          // Not JSON, just plain text
          const height = addWrappedText(entry.content, margin, yPosition, maxWidth);
          yPosition += height;
        }
        
        // Minimal spacing between entries
        yPosition += lineHeight * 1.2;
      });
      
      // Minimal footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text(
          `${i}/${pageCount}`,
          pageWidth - margin,
          pageHeight - 8,
          { align: "right" as const }
        );
        doc.setTextColor(0, 0, 0);
      }
      
      // Download PDF
      doc.save(`conversation-${conversationId}.pdf`);
    } catch (error) {
      alert(
        `Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };
  const resetChat = () => {
  setConversationId(null);
  setArticleTitle(null);
  setTurns([]);
  setIsComplete(false);
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
                  Upload a PDF article to start a guided assessment session with Isabelle
                </p>
              </div>
              <div className="space-y-4 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Choose an Article to Analyze
              </h2>
              <p className="text-sm text-gray-700">
                Before starting the guided analysis, please choose a biostatistics-related
                research article you want to explore.
                Try searching through{" "}
                <a
                  href="https://bruknow.library.brown.edu/discovery/search?query=any,contains,research%20articles&tab=CentralIndex&search_scope=CentralIndex&vid=01BU_INST:BROWN&mfacet=topic,include,Life%20Sciences%20%26%20Biomedicine,1&mfacet=topic,include,Science%20%26%20Technology,1&mfacet=topic,include,Humans,1&mfacet=topic,include,Physical%20Sciences,1&mfacet=topic,include,Technology,1&mfacet=topic,include,Biological%20And%20Medical%20Sciences,1&mfacet=topic,include,Social%20Sciences,1&mfacet=topic,include,Biochemistry%20%26%20Molecular%20Biology,1&mfacet=topic,include,Medical%20Sciences,1&mfacet=topic,include,Exact%20Sciences%20And%20Technology,1&mfacet=topic,include,Science%20%26%20Technology%20-%20Other%20Topics,1&mfacet=topic,include,Materials%20Science,1&mfacet=topic,include,Physics,1&mfacet=topic,include,Chemistry,1&mfacet=topic,include,Adult,1&mfacet=topic,include,Animals,1&mfacet=topic,include,Engineering,1&mfacet=topic,include,Male,1&mfacet=topic,include,Female,1&mfacet=topic,include,Middle%20Aged,1&lang=en&offset=0"
                  target="_blank"
                  className="text-[var(--isabelle-primary)] underline hover:text-blue-700"
                >
                  Brown Library Search (BruKnow)
                </a>{" "}
                or journals like{" "}
                <a
                  href="https://www.nature.com/subjects/biostatistics"
                  target="_blank"
                  className="text-[var(--isabelle-primary)] underline hover:text-blue-700"
                >
                  Nature
                </a>.
              </p>
              <p className="text-xs text-gray-500">
                Your PDF must be an empirical research article with a methods section and statistical analysis.
                Editorials, commentaries, and non-research summaries will not work correctly.
              </p>
              

            </div>

              <PdfUploadBox onUpload={handlePdfUpload} disabled={isUploading} />
              {!conversationId && turns.length > 0 && (
                <div className="text-center mt-6">
                  <button
                    onClick={resetChat}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                  >
                    Reset Chat
                  </button>
                </div>
              )}


              {isUploading && (
                <div className="text-center text-sm text-gray-500">
                  Processing PDF...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {articleTitle && (
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Analyzing: {articleTitle}
                  </h2>
                </div>
              )}
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
                    Great work! You&apos;ve completed the analysis session. Please export this conversation to later send to Professor Lipman.
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
