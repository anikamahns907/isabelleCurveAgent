from openai import AsyncOpenAI
from backend.core.config import settings
from backend.core.rag import search_similar   # NEW (RAG integration)

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

import json

# ============================================================
# SYSTEM PROMPTS
# ============================================================
GENERAL_CHAT_SYSTEM_PROMPT = """
You are a helpful biostatistics tutor.
You explain probability, inference, regression, ANOVA, sampling distributions,
and general statistical concepts in clear, intuitive language.

You have access to retrieved course materials that may contain:
- textbook excerpts
- homework solutions
- exam guides
- lecture PDFs
- handouts
These appear under the heading 'Relevant course materials'.
Use them only to guide your explanation accurately.
"""


ARTICLE_ANALYSIS_SYSTEM_PROMPT = """
You are an academic biostatistics tutor guiding a student through analyzing a research article.
You teach through a structured guided-question cycle modeled after common biostatistics learning goals.

===========================
OVERALL PURPOSE
===========================
Your job is to help the student:
- Identify statistical methods
- Understand study design
- Interpret results thoughtfully
- Recognize assumptions and limitations
- Connect the article to course concepts
- Improve communication skills
- Think about alternative analyses
- Summarize findings clearly
- Interpret specific statistical outputs

You must NEVER give direct answers.
Always ask ONE question at a time based on the student's previous response.

===========================
STRICT BEHAVIOR RULES
===========================
1. NEVER answer your own questions.
2. NEVER invent results from the article.
3. Treat ANY non-empty student answer as legitimate.
4. NEVER say "the student did not respond."
5. ALWAYS produce:
   - Reflection
   - Advice/Suggestion
   - ONE follow-up question

===========================
START RULE
===========================
Return ONLY:
1) A 1-sentence welcome  
2) The first analysis question  

===========================
CONTINUE RULES
===========================
Return STRICT JSON:
{
  "reflection": "...",
  "clarification": "...",
  "followup_question": "..."   // OR null if the session should end
}

If the student expresses that they are finished, want to wrap up, or request a summary,
then output a final message and set "followup_question" to null.
Do NOT ask additional questions after that.
"""


# ============================================================
# GENERAL CHAT (Now RAG-powered)
# ============================================================
async def openai_chat(user_message: str) -> str:
    """
    General chat now retrieves relevant course materials.
    """

    # 🔍 RAG: retrieve 5 most relevant course chunks
    docs = await search_similar(user_message)
    context = "\n\n".join([d["content"] for d in docs]) if docs else "No relevant course materials retrieved."

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": GENERAL_CHAT_SYSTEM_PROMPT},
            {"role": "system", "content": f"Relevant course materials:\n{context}"},
            {"role": "user", "content": user_message},
        ],
        max_tokens=400
    )
    return response.choices[0].message.content



# ============================================================
# START ARTICLE ANALYSIS (no RAG needed here)
# ============================================================
async def start_article_analysis(article_text: str) -> str:
    truncated = article_text[:8000]

    prompt = f"""
Here is the extracted article text:

{truncated}

Begin the guided question cycle.

Return ONLY:
1. A short welcome message (1 sentence)
2. The FIRST analysis question
"""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": ARTICLE_ANALYSIS_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        max_tokens=500
    )

    return response.choices[0].message.content



# ============================================================
# CONTINUE ARTICLE ANALYSIS (Now RAG + memory)
# ============================================================
async def continue_article_analysis(student_answer: str, previous_messages: list) -> dict:
    """
    Memory-aware continuation + uses RAG to pull relevant course material.
    """

    # 🔍 RAG search based on student's answer
    docs = await search_similar(student_answer)
    course_context = "\n\n".join([d["content"] for d in docs]) if docs else "No relevant course materials retrieved."

    # Build message list
    messages = [
        {"role": "system", "content": ARTICLE_ANALYSIS_SYSTEM_PROMPT},
        {"role": "system", "content": f"Relevant course materials:\n{course_context}"}
    ]

    messages += previous_messages
    messages.append({"role": "user", "content": student_answer})

    # JSON formatting request
    formatting_prompt = f"""
The student answered:

\"\"\"{student_answer}\"\"\"

Respond ONLY as strict JSON:
{{
  "reflection": "...",
  "clarification": "...",
  "followup_question": "..."
}}
"""
    messages.append({"role": "user", "content": formatting_prompt})

    # Make LLM call
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=500,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content

    try:
        data = json.loads(raw)
    except Exception:
        data = {
            "reflection": raw,
            "clarification": "",
            "followup_question": ""
        }

    return {
        "reflection": data.get("reflection", ""),
        "clarification": data.get("clarification", ""),
        "followup_question": data.get("followup_question", "")
    }
