const BASE = process.env.NEXT_PUBLIC_API_URL || "https://isabellecurveagent.onrender.com";
export interface ChatResponse {
  response: string;
}

export interface ArticleAnalysisStartResponse {
  conversation_id: string | null;
  message: string;
  next_question: string | null;
  is_valid: boolean;
  article_title?: string;
  suggestions?: {
    bruKnow: string;
    pubmed: string;
    nature: string;
    sciencedirect: string;
  };
}


export interface ArticleAnalysisContinueResponse {
  reflection: string;
  clarification: string;
  followup_question: string | null;
}

export interface TranscriptEntry {
  timestamp: string;
  role: "ai" | "student";
  content: string;
}

export interface ExportResponse {
  conversation_id: string;
  article_id?: string | null;
  article_title?: string;
  transcript: TranscriptEntry[];
}

/**
 * Send a message to the general chat endpoint
 */
export async function sendChat(message: string): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const response = await fetch(`${BASE}/chat-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  if (!response.ok || !response.body) {
    throw new Error("Streaming request failed");
  }

  return response.body.getReader();
}

/**
 * Upload a PDF file to start article analysis
 */
export async function uploadArticlePDF(
  file: File
): Promise<ArticleAnalysisStartResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE}/articleanalysis/start`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `PDF upload failed: ${response.statusText} - ${errorText}`
    );
  }

  return await response.json();
}

/**
 * Send a student answer to continue the article analysis conversation
 */
export async function sendAnalysisAnswer(
  conversationId: string,
  answer: string
): Promise<ArticleAnalysisContinueResponse> {
  const response = await fetch(`${BASE}/articleanalysis/continue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_id: String(conversationId),
      student_answer: answer,
    }),

  });

  if (!response.ok) {
    throw new Error(`Analysis answer failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Export a conversation transcript
 */
export async function exportConversation(
  conversationId: string
): Promise<ExportResponse> {
  const response = await fetch(
    `${BASE}/articleanalysis/export/${conversationId}`
  );

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return await response.json();
}
