from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.core.pdf_extractor import extract_text_from_pdf, extract_article_title
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
    
    # Extract article title
    article_title = extract_article_title(pdf_bytes)

    # Check if PDF extraction worked - if text is empty or too short, extraction likely failed
    if not text or len(text.strip()) < 50:
        return {
            "conversation_id": None,
            "message": (
                "Unable to extract text from PDF. The file may be corrupted, "
                "image-based (scanned), or password-protected. Please try a different PDF."
            ),
            "next_question": None,
            "suggestions": {
                "bruKnow": "https://bruknow.library.brown.edu/discovery/search?query=any,contains,biostatistics&tab=Everything&search_scope=MyInst_and_CI&vid=01BU_INST:BROWN",
                "pubmed": "https://pubmed.ncbi.nlm.nih.gov/",
                "nature": "https://www.nature.com/subjects/public-health",
                "sciencedirect": "https://www.sciencedirect.com"
            }
        }

    # --------- STRONG EMPIRICAL ARTICLE VALIDITY CHECK ---------
    lower = text.lower()

    # Must contain some data-like signals (expanded list for better coverage):
    empirical_signals = [
        # Statistical methods
        "regression", "confidence interval", "p-value", "p value", "p<", "p<=", "p =", "p=",
        "statistical analysis", "statistical test", "statistical method", "statistics",
        "anova", "t-test", "t test", "chi-square", "chi square", "fisher", "mann-whitney", "wilcoxon",
        "logistic", "cox model", "cox regression", "survival analysis", "kaplan-meier",
        "hazard ratio", "odds ratio", "relative risk", "effect size", "risk ratio",
        "correlation", "multivariate", "univariate", "bivariate",
        # Study design and data
        "sample size", "n=", "n =", "n:", "participants", "subjects", "patients", "individuals",
        "cohort", "case-control", "cross-sectional", "longitudinal", "prospective", "retrospective",
        "randomized", "randomised", "clinical trial", "experiment", "experimental",
        "study design", "research design", "methodology", "methods", "materials and methods",
        # Data collection and analysis
        "we analyzed", "we analysed", "data were", "data was", "measured", "measurement",
        "survey", "questionnaire", "collected data", "data collection", "collected",
        "outcome", "outcomes", "endpoint", "endpoints", "primary outcome", "secondary outcome",
        "baseline", "follow-up", "follow up", "intervention", "control group",
        # Results indicators
        "results", "findings", "statistically significant", "significance", "significant",
        "mean", "median", "sd=", "se=", "ci", "95%", "confidence", "standard deviation",
        # Analysis phrases
        "analyzed using", "analysed using", "performed using", "using", "analysis",
        "statistical software", "r software", "spss", "sas", "stata", "python",
        # Very common research terms (appear in almost all research articles)
        "hypothesis", "hypotheses", "aim", "objective", "objectives", "purpose",
        "data", "dataset", "database", "variable", "variables", "model", "models",
        "study", "studies", "research", "article", "paper", "publication",
        "analysis", "analyses", "analyze", "analyse", "analyzed", "analysed",
        "method", "methods", "result", "results", "finding", "findings",
        "conclusion", "conclusions", "discussion", "introduction", "abstract",
        "table", "tables", "figure", "figures", "fig", "figs"
    ]

    has_empirical_signal = any(sig in lower for sig in empirical_signals)

    # Must contain SOME numbers:
    has_numbers = any(char.isdigit() for char in text)

    # Check if text is substantial (likely a full article)
    # Use lower thresholds to be more lenient with extraction quality
    is_substantial = len(text) > 500
    is_very_substantial = len(text) > 2000  # Very likely a full research article

    # Editorial-like detection
    editorial_markers = [
        "editorial", "commentary", "opinion", "perspective",
    ]

    is_editorial_like = any(m in lower for m in editorial_markers)

    # FINAL RULE: Very lenient - accept if NOT editorial-like AND:
    # 1. Has empirical signal AND has numbers, OR
    # 2. Is substantial article (500+ chars) with numbers, OR  
    # 3. Is very substantial article (2000+ chars) - likely research even if extraction missed signals/numbers
    # This accounts for cases where PDF extraction might miss some terms but the article is clearly substantial research
    # The key is: if it's a substantial document, it's likely a research article (not an editorial)
    
    # Check if we have enough content to be a research article
    has_empirical_content = (
        (has_empirical_signal and has_numbers) or  # Standard case: has signals and numbers
        (is_substantial and has_numbers) or        # Fallback: substantial with numbers
        is_very_substantial                         # Very lenient: very substantial = likely research
    )
    
    is_valid_article = has_empirical_content and not is_editorial_like

    if not is_valid_article:
        return {
            "conversation_id": None,
            "message": (
                "This article does not appear to be an empirical research article with statistical analyses. "
                "To complete the 10-question peer assessment, you need an article that includes:\n\n"
                "• Empirical data and statistical methods\n"
                "• Quantitative results and analysis\n"
                "• Research methodology and findings\n\n"
                "Please browse for a different article that aligns with these requirements. "
                "Click 'Reset Chat' below to upload a new article."
            ),
            "next_question": None,
            "suggestions": {
                "bruKnow": "https://bruknow.library.brown.edu/discovery/search?query=any,contains,biostatistics&tab=Everything&search_scope=MyInst_and_CI&vid=01BU_INST:BROWN",
                "pubmed": "https://pubmed.ncbi.nlm.nih.gov/",
                "nature": "https://www.nature.com/subjects/public-health",
                "sciencedirect": "https://www.sciencedirect.com"
            }
        }

    # If valid, proceed:
    article = supabase.table("articles").insert({
        "pdf_text": text
    }).execute()
    article_id = article.data[0]["id"]

    conversation = supabase.table("conversations").insert({
        "article_id": article_id
    }).execute()
    conversation_id = conversation.data[0]["id"]

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
        "next_question": first_question,
        "is_valid": True,
        "article_title": article_title,
        "suggestions": {
            "bruKnow": "https://bruknow.library.brown.edu",
            "pubmed": "https://pubmed.ncbi.nlm.nih.gov",
            "nature": "https://www.nature.com",
            "sciencedirect": "https://www.sciencedirect.com"
        }
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

    # 2. Load history and article text
    history = supabase.table("conversation_turns") \
        .select("*") \
        .eq("conversation_id", conversation_id) \
        .order("created_at", desc=False) \
        .execute()

    turns = history.data

    # Fetch the article text tied to this conversation
    conversation = supabase.table("conversations") \
        .select("article_id") \
        .eq("id", conversation_id) \
        .single() \
        .execute()

    article_id = conversation.data["article_id"]

    article = supabase.table("articles") \
        .select("pdf_text") \
        .eq("id", article_id) \
        .single() \
        .execute()

    article_text = article.data["pdf_text"]


    # 3. Convert to OpenAI roles AND flatten JSON AI messages
    previous_messages = []
    for turn in turns:
        role = "user" if turn["role"] == "student" else "assistant"
        content = turn["content"]

        # If AI message is stored as JSON string, flatten into readable text
        try:
            parsed = json.loads(content)
            # Flatten into a single assistant message
            content = (
                f"Reflection: {parsed.get('reflection','')}\n"
                f"Clarification: {parsed.get('clarification','')}\n"
                f"Follow-up Question: {parsed.get('followup_question','')}"
            )
        except Exception:
            pass  # leave content unchanged if not JSON

        previous_messages.append({"role": role, "content": content})


    # 4. Generate AI response (reflection, advice, question)
    ai_output = await continue_article_analysis(
        student_answer=student_answer,
        previous_messages=previous_messages,
        article_text=article_text
    )


    # 5. Store AI turn in DB as JSON text
    supabase.table("conversation_turns").insert({
        "conversation_id": conversation_id,
        "role": "ai",
        "content": json.dumps(ai_output)
    }).execute()

    return ai_output

# ============================================================
# 3) EXPORT CONVERSATION
# ============================================================
@router.get("/export/{conversation_id}")
async def export_conversation(conversation_id: str):
    """
    Returns the entire conversation (AI + student messages)
    in chronological order so the front end can render/export it.
    Also includes article_id for linking.
    """
    from backend.core.supabase_client import supabase

    # Load conversation to get article_id
    conversation = supabase.table("conversations") \
        .select("article_id") \
        .eq("id", conversation_id) \
        .single() \
        .execute()
    
    article_id = conversation.data.get("article_id") if conversation.data else None
    
    # Get article title - use first part of text as fallback
    article_title = "Untitled Article"
    if article_id:
        article = supabase.table("articles") \
            .select("pdf_text") \
            .eq("id", article_id) \
            .single() \
            .execute()
        if article.data and article.data.get("pdf_text"):
            text = article.data["pdf_text"]
            # Use first 150 characters as title (since text is normalized)
            if len(text) > 20:
                article_title = text[:150].strip()
                if len(text) > 150:
                    article_title += "..."

    # Load turns
    history = supabase.table("conversation_turns") \
        .select("*") \
        .eq("conversation_id", conversation_id) \
        .order("created_at", desc=False) \
        .execute()

    turns = history.data

    # Format export transcript
    transcript = []
    for turn in turns:
        transcript.append({
            "timestamp": turn["created_at"],
            "role": turn["role"],
            "content": turn["content"]
        })

    return {
        "conversation_id": conversation_id,
        "article_id": article_id,
        "article_title": article_title,
        "transcript": transcript
    }
