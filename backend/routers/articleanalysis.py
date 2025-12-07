from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.core.pdf_extractor import extract_text_from_pdf
from backend.core.openai_client import (
    start_article_analysis,
    continue_article_analysis,
)
import json
from backend.models.article_models import (
    ArticleAnalysisRequest,
    ArticleAnalysisInitResponse,
    ArticleAnalysisFollowupResponse,
)


router = APIRouter(prefix="/articleanalysis", tags=["Article Analysis"])


# ============================================================
# 1) START ARTICLE ANALYSIS — User uploads PDF
# ============================================================
@router.post("/start")
async def start_analysis(file: UploadFile = File(...)):
    from backend.core.supabase_client import supabase

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF.")

    pdf_bytes = await file.read()
    text = extract_text_from_pdf(pdf_bytes)

    # 1. Store the article text
    article = supabase.table("articles").insert({
        "pdf_text": text
    }).execute()
    article_id = article.data[0]["id"]

    # 2. Create a new conversation session
    conversation = supabase.table("conversations").insert({
        "article_id": article_id
    }).execute()
    conversation_id = conversation.data[0]["id"]

    # 3. Generate first AI question
    first_question = await start_article_analysis(text)

    # 4. Save the AI message
    supabase.table("conversation_turns").insert({
        "conversation_id": conversation_id,
        "role": "ai",
        "content": first_question
    }).execute()

    return {
        "conversation_id": conversation_id,
        "message": "PDF processed successfully.",
        "next_question": first_question
    }



# ============================================================
# 2) CONTINUE ARTICLE ANALYSIS (Memory-aware)
# ============================================================
from pydantic import BaseModel

class ContinueRequest(BaseModel):
    conversation_id: str
    student_answer: str

@router.post("/continue")
async def continue_analysis(req: ContinueRequest):
    conversation_id = req.conversation_id
    student_answer = req.student_answer

    from backend.core.supabase_client import supabase
    import json

    # 1. Save student turn
    supabase.table("conversation_turns").insert({
        "conversation_id": conversation_id,
        "role": "student",
        "content": student_answer
    }).execute()

    # 2. Load history
    history = supabase.table("conversation_turns") \
        .select("*") \
        .eq("conversation_id", conversation_id) \
        .order("created_at", desc=False) \
        .execute()

    turns = history.data

    # 3. Convert to OpenAI roles
    previous_messages = []
    for turn in turns:
        role = "user" if turn["role"] == "student" else "assistant"
        previous_messages.append({"role": role, "content": turn["content"]})

    # 4. Generate AI response (reflection, advice, question)
    ai_output = await continue_article_analysis(
        student_answer=student_answer,
        previous_messages=previous_messages
    )

    # 5. Store AI turn in DB as JSON text
    supabase.table("conversation_turns").insert({
        "conversation_id": conversation_id,
        "role": "ai",
        "content": json.dumps(ai_output)
    }).execute()

    return ai_output
