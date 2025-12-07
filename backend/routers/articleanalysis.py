from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.core.pdf_extractor import extract_text_from_pdf
from backend.core.openai_client import (
    start_article_analysis,
    continue_article_analysis,
)
from backend.models.article_models import (
    ArticleAnalysisRequest,
    ArticleAnalysisInitResponse,
    ArticleAnalysisFollowupResponse,
)

router = APIRouter(prefix="/articleanalysis", tags=["Article Analysis"])


# ============================================================
# 1) START ARTICLE ANALYSIS — User uploads PDF
# ============================================================
@router.post("/start", response_model=ArticleAnalysisInitResponse)
async def start_analysis(file: UploadFile = File(...)):
    # Ensure PDF
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF.")

    # Read bytes and extract/clean PDF text
    pdf_bytes = await file.read()
    text = extract_text_from_pdf(pdf_bytes)

    # Ask OpenAI for the first question
    first_question = await start_article_analysis(text)

    return ArticleAnalysisInitResponse(
        message="PDF processed successfully.",
        next_question=first_question,
    )


# ============================================================
# 2) CONTINUE ARTICLE ANALYSIS — Student answers questions
# ============================================================
@router.post("/continue", response_model=ArticleAnalysisFollowupResponse)
async def continue_analysis(request: ArticleAnalysisRequest):
    if not request.student_answer or request.student_answer.strip() == "":
        raise HTTPException(
            status_code=400,
            detail="Student answer cannot be empty."
        )

    # Ask OpenAI to reflect + clarify + ask follow-up
    result = await continue_article_analysis(request.student_answer)

    return ArticleAnalysisFollowupResponse(
        reflection=result["reflection"],
        clarification=result["clarification"],
        followup_question=result["followup_question"],
    )
