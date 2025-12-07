from openai import AsyncOpenAI
from backend.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


# ============================================================
# GENERAL CHAT SYSTEM PROMPT
# ============================================================
GENERAL_CHAT_SYSTEM_PROMPT = """
You are a helpful biostatistics tutor.
You explain probability, inference, regression, ANOVA, sampling distributions,
and general statistical concepts in clear, intuitive language.
"""


async def openai_chat(user_message: str) -> str:
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": GENERAL_CHAT_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        max_tokens=400
    )
    return response.choices[0].message.content



# ============================================================
# ARTICLE ANALYSIS SYSTEM PROMPT (IMPROVED & STRICT)
# ============================================================
ARTICLE_ANALYSIS_SYSTEM_PROMPT = """
You are an academic tutor guiding a student through analyzing a research article.

Your role:
- Ask one guided question at a time.
- Encourage interpretation, identifying statistical methods, reasoning about study design,
  assumptions, limitations, communication choices, and alternative analyses.
- Use a friendly, Socratic tone.
- NEVER answer your own questions.

Strict answer-handling rules:
1. ANY non-empty student answer MUST be treated as a real answer.
2. NEVER say the student didn't respond, even if their answer is short.
3. You must always:
   - Reflect back what the student said,
   - Identify what is correct or promising,
   - Gently point out misunderstandings,
   - Ask ONE follow-up question that deepens understanding.

Output rules:
For the "start" prompt: produce only a short welcome message + first question.
For the "continue" prompt: produce ONLY:
1. Reflection section
2. Advice/Suggestion (if needed)
3. ONE follow-up question
"""


# ============================================================
# START ARTICLE ANALYSIS
# ============================================================
async def start_article_analysis(article_text: str) -> str:
    truncated_text = article_text[:8000]

    prompt = f"""
Here is the extracted article text:

{truncated_text}

Begin the guided question cycle.

Return ONLY:
1. A short welcome message (1 sentence)
2. The FIRST analysis question
"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": ARTICLE_ANALYSIS_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        max_tokens=500
    )

    return response.choices[0].message.content



# ============================================================
# CONTINUE ARTICLE ANALYSIS (With Proper Parsing)
# ============================================================
async def continue_article_analysis(student_answer: str) -> dict:
    """
    After the student answers a question, generate:
    - reflection
    - advice/suggestion (if needed)
    - follow-up question
    
    The model is required to return EXACT JSON so parsing is reliable.
    """

    prompt = f"""
The student answered:

\"\"\"{student_answer}\"\"\"

Now respond in STRICT JSON with exactly these keys:
- "reflection": summarize the student's reasoning.
- "clarification": provide advice/suggestions to correct misunderstandings or refine their interpretation.
- "followup_question": ask ONE next question that deepens analysis.

Your ENTIRE reply must be VALID JSON. DO NOT add explanation, commentary,
markdown, or text outside the JSON. Only output JSON.
Example format:

{{
  "reflection": "...",
  "clarification": "...",
  "followup_question": "..."
}}
"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": ARTICLE_ANALYSIS_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500,
        response_format={"type": "json_object"}  # forces JSON output
    )

    raw = response.choices[0].message.content

    # Parse JSON safely
    import json
    try:
        data = json.loads(raw)
    except Exception:
        # fallback: model returned something unexpected
        data = {
            "reflection": raw,
            "clarification": "",
            "followup_question": ""
        }

    # Guarantee all required keys exist
    return {
        "reflection": data.get("reflection", ""),
        "clarification": data.get("clarification", ""),
        "followup_question": data.get("followup_question", "")
    }

    # --------------------------------------------------------
    # PARSE THE MODEL OUTPUT INTO THE THREE EXPECTED SECTIONS
    # --------------------------------------------------------
    reflection = ""
    clarification = ""
    followup = ""

    for section in content.split("\n"):
        line = section.strip()
        if line.startswith("Reflection:"):
            reflection = line.replace("Reflection:", "").strip()
        elif line.startswith("Clarification:"):
            clarification = line.replace("Clarification:", "").strip()
        elif line.startswith("Follow-up Question:"):
            followup = line.replace("Follow-up Question:", "").strip()

    return {
        "reflection": reflection,
        "clarification": clarification,
        "followup_question": followup,
    }
