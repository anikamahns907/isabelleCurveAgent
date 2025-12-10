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
  content?: string | null;
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
  const [showInvalidModal, setShowInvalidModal] = useState(false);
  const [invalidArticleSuggestions, setInvalidArticleSuggestions] = useState<{
    bruKnow?: string;
    pubmed?: string;
    nature?: string;
    sciencedirect?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [turns, isLoading]);

  // ------------------------------------------------------------
  // PDF UPLOAD LOGIC
  // ------------------------------------------------------------
  const handlePdfUpload = async (file: File) => {
    setIsUploading(true);

    try {
      const response = await uploadArticlePDF(file);
      
      // DEBUG: Log backend response
      console.log("📥 Backend Response (PDF Upload):", JSON.stringify(response, null, 2));
      
      // Infer is_valid if missing (fallback: if conversation_id exists, article is valid)
      const is_valid = response.is_valid !== undefined 
        ? response.is_valid 
        : !!response.conversation_id;
      
      console.log("📊 Response Evaluation:", {
        "is_valid (from backend)": response.is_valid,
        "is_valid (inferred)": is_valid,
        "has_conversation_id": !!response.conversation_id,
        "will_show_invalid": !is_valid || !response.conversation_id,
        "decision": (!is_valid || !response.conversation_id) ? "INVALID → Show error message" : "VALID → Start conversation"
      });

      // INVALID ARTICLE CASE
      if (!is_valid || !response.conversation_id) {
        setConversationId(null);
        setTurns([]);
        setInvalidArticleSuggestions(response.suggestions || null);
        setShowInvalidModal(true);
        return;
      }

      // VALID ARTICLE CASE
      setConversationId(String(response.conversation_id));
      setArticleTitle(response.article_title || null);

      // clear previous state
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

  // ------------------------------------------------------------
  // ANSWER LOGIC
  // ------------------------------------------------------------
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
      
      // DEBUG: Log backend response
      console.log("📥 Backend Response (Answer):", JSON.stringify(response, null, 2));
      console.log("📊 Response Evaluation:", {
        has_reflection: !!response.reflection,
        has_clarification: !!response.clarification,
        followup_question: response.followup_question,
        is_complete: response.followup_question === null
      });
      
      const aiTurn: AnalysisTurn = {
        type: "response",
        reflection: response.reflection,
        clarification: response.clarification,
        followupQuestion: response.followup_question,
      };
      
      console.log("🎨 Frontend Turn Object:", JSON.stringify(aiTurn, null, 2));

      setTurns((prev) => [...prev, aiTurn]);

      if (response.followup_question === null) {
        setIsComplete(true);
      }
    } catch (error) {
      alert(
        `Failed to send answer: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------
  // EXPORT LOGIC
  // ------------------------------------------------------------
  const handleExport = async () => {
    if (!conversationId) return;

    try {
      const data = await exportConversation(conversationId);
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;
      const lineHeight = 5.5;

      const cleanText = (text: string): string => {
        return text.replace(/\s+/g, " ").trim();
      };

      const addWrappedText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        fontSize: number = 9
      ) => {
        doc.setFontSize(fontSize);
        const cleaned = cleanText(text);
        const lines = doc.splitTextToSize(cleaned, maxWidth);
        doc.text(lines, x, y);
        return lines.length * lineHeight;
      };

      const checkNewPage = (needed: number) => {
        if (yPosition + needed > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
        }
      };

      // HEADER
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Article Analysis Session", margin, yPosition);
      yPosition += lineHeight * 1.2;

      if (data.article_title) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(data.article_title, maxWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * lineHeight * 1.1;
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

      // TRANSCRIPT
      data.transcript.forEach((entry) => {
        checkNewPage(lineHeight * 4);

        const role = entry.role === "ai" ? "Isabelle" : "Student";

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text(`${role}`, margin, yPosition);
        yPosition += lineHeight * 1.1;
        doc.setTextColor(0, 0, 0);

        try {
          const parsed = JSON.parse(entry.content);
          const parts: string[] = [];

          if (parsed.reflection)
            parts.push("Reflection: " + cleanText(parsed.reflection));
          if (parsed.clarification)
            parts.push("Clarification: " + cleanText(parsed.clarification));
          if (parsed.followup_question)
            parts.push("Question: " + cleanText(parsed.followup_question));

          const combined = parts.join("\n");
          const h = addWrappedText(combined, margin, yPosition, maxWidth);
          yPosition += h;
        } catch {
          const h = addWrappedText(entry.content, margin, yPosition, maxWidth);
          yPosition += h;
        }

        yPosition += lineHeight * 1.2;
      });

      doc.save(`conversation-${conversationId}.pdf`);
    } catch (error) {
      alert(
        `Failed to export: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const resetChat = () => {
    setConversationId(null);
    setArticleTitle(null);
    setTurns([]);
    setIsComplete(false);
    setShowInvalidModal(false);
    setInvalidArticleSuggestions(null);
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto max-w-4xl px-3 py-8 sm:px-4 lg:px-6">

          {!conversationId ? (
            <div className="space-y-6">

              <div className="text-center">
                <h1 className="mb-2 text-2xl font-semibold text-gray-900">
                  Start Article Discussion
                </h1>
                <p className="text-gray-600">
                  Upload a PDF to begin the guided 10-question analysis with Isabelle.
                </p>
              </div>

              <div className="space-y-4 text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Choose an Article to Analyze
                </h2>
                <p className="text-sm text-gray-600">
                  Browse... {" "}
                  <a
                    href="https://bruknow.library.brown.edu/discovery/search?query=any,contains,biostatistics&tab=Everything&search_scope=MyInst_and_CI&vid=01BU_INST:BROWN"
                    target="_blank"
                    className="text-[var(--isabelle-primary)] hover:text-blue-700 underline"
                  >
                    Brown BruKnow Library
                  </a>
                  ,{" "}
                  <a
                    href="https://pubmed.ncbi.nlm.nih.gov/"
                    target="_blank"
                    className="text-[var(--isabelle-primary)] hover:text-blue-700 underline"
                  >
                    PubMed
                  </a>
                  ,{" "}
                  <a
                    href="https://www.nature.com/subjects/biostatistics"
                    target="_blank"
                    className="text-[var(--isabelle-primary)] hover:text-blue-700 underline"
                  >
                    Nature
                  </a>
                  ,{" "}
                  <a
                    href="https://www.sciencedirect.com"
                    target="_blank"
                    className="text-[var(--isabelle-primary)] hover:text-blue-700 underline"
                  >
                    ScienceDirect
                  </a>
                  .
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Please upload an empirical biostatistics research article.  
                  Your answers should be multiple full sentences because they will appear
                  in your exported PDF submission to Professor Lipman.
                </p>

                <p className="text-xs text-gray-500">
                  Articles must include a Methods section, statistical analysis, and quantitative results.
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
                    Great work — you have finished all 10 questions.  
                    Export your PDF to submit to Professor Lipman.
                  </p>
                  <button
                    onClick={handleExport}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
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
          placeholder="Write a complete multi-sentence answer..."
        />
      )}

      {/* Invalid Article Modal */}
      {showInvalidModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-gray-100/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInvalidModal(false)}
        >
          <div 
            className="bg-white shadow-2xl rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Invalid Article</h2>
                <button
                  onClick={() => setShowInvalidModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6 text-gray-700">
                {/* Error Message */}
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-sm leading-relaxed text-gray-900">
                    This article cannot be used for the 10-question biostatistics assessment.
                  </p>
                </div>

                {/* Requirements */}
                <div className="bg-blue-50 border-l-4 border-[var(--isabelle-primary)] p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">Article Requirements</h3>
                  <p className="mb-3 text-sm">
                    To begin, you must upload an <strong>empirical research article</strong> that includes:
                  </p>

                  <ul className="list-disc list-inside space-y-1 ml-2 mb-3 text-sm">
                    <li>A clear <strong>Methods</strong> section</li>
                    <li><strong>Statistical tests or models</strong> (e.g., regression, ANOVA, confidence intervals, p-values)</li>
                    <li><strong>Quantitative results</strong> and a Results section</li>
                    <li>An identifiable study design (RCT, cohort study, cross-sectional, etc.)</li>
                  </ul>

                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Not acceptable:</strong> Editorials, news articles, commentaries, summaries, or conceptual papers.
                  </p>
                </div>

                {/* Suggested Links */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Browse for Articles</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    You may browse for a new article at:
                  </p>
                  <ul className="space-y-2 text-sm">
                    {invalidArticleSuggestions?.bruKnow && (
                      <li>
                        • <a 
                            href={invalidArticleSuggestions.bruKnow}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--isabelle-primary)] hover:text-blue-700 underline"
                          >
                            Brown BruKnow Library
                          </a>
                      </li>
                    )}
                    {invalidArticleSuggestions?.pubmed && (
                      <li>
                        • <a 
                            href={invalidArticleSuggestions.pubmed}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--isabelle-primary)] hover:text-blue-700 underline"
                          >
                            PubMed
                          </a>
                      </li>
                    )}
                    {invalidArticleSuggestions?.nature && (
                      <li>
                        • <a 
                            href={invalidArticleSuggestions.nature}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--isabelle-primary)] hover:text-blue-700 underline"
                          >
                            Nature Public Health
                          </a>
                      </li>
                    )}
                    {invalidArticleSuggestions?.sciencedirect && (
                      <li>
                        • <a 
                            href={invalidArticleSuggestions.sciencedirect}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--isabelle-primary)] hover:text-blue-700 underline"
                          >
                            ScienceDirect
                          </a>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Next Steps */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">Next Steps</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Close this dialog</li>
                    <li>Choose a valid empirical article from one of the sources above</li>
                    <li>Upload the PDF again to start the guided 10-question session</li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowInvalidModal(false)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
