const BASE = process.env.NEXT_PUBLIC_API_URL || "https://isabellecurveagent.onrender.com";

// Debug: Log the API URL in development (removed in production builds)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("API Base URL:", BASE);
}
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

  try {
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    const response = await fetch(`${BASE}/articleanalysis/start`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "Unable to read error message";
      }
      throw new Error(
        `PDF upload failed: ${response.statusText} - ${errorText}`
      );
    }

    const jsonResponse = await response.json();
    
    // DEBUG: Log raw API response and response metadata
    console.log("🌐 API Response (uploadArticlePDF):", JSON.stringify(jsonResponse, null, 2));
    console.log("🔍 Response Fields Check:", {
      "Status": response.status,
      "Has conversation_id": "conversation_id" in jsonResponse,
      "Has is_valid": "is_valid" in jsonResponse,
      "Has message": "message" in jsonResponse,
      "Has next_question": "next_question" in jsonResponse,
      "All keys": Object.keys(jsonResponse)
    });
    
    return jsonResponse;
  } catch (error) {
    // Handle network errors, CORS errors, and timeouts
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("PDF upload timed out. The file may be too large or the server is taking too long to respond.");
      }
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        throw new Error(
          `Failed to connect to server. Please check:\n` +
          `1. The backend server is running at ${BASE}\n` +
          `2. Your internet connection is working\n` +
          `3. There are no CORS or firewall issues`
        );
      }
      throw error;
    }
    throw new Error("Unknown error occurred during PDF upload");
  }
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

  const jsonResponse = await response.json();
  
  // DEBUG: Log raw API response and response metadata
  console.log("🌐 API Response (sendAnalysisAnswer):", JSON.stringify(jsonResponse, null, 2));
  console.log("🔍 Response Fields Check:", {
    "Status": response.status,
    "Has reflection": "reflection" in jsonResponse,
    "Has clarification": "clarification" in jsonResponse,
    "Has followup_question": "followup_question" in jsonResponse,
    "All keys": Object.keys(jsonResponse)
  });
  
  return jsonResponse;
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
