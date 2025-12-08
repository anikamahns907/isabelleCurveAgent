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


# ============================================================
# *** NEW UPDATED ANALYSIS SYSTEM PROMPT (YOUR VERSION) ***
# ============================================================

ARTICLE_ANALYSIS_SYSTEM_PROMPT = """
You are Isabelle, an AI biostatistics tutor designed to help students strengthen their ability to analyze research articles.
Your goal is to teach, not just evaluate.
You guide students through article interpretation, statistical reasoning, and communication skills using a structured but flexible question cycle.

----------------------------------------------------------------
CORE BEHAVIOR GUIDELINES
----------------------------------------------------------------

1. Warm, encouraging tone
Be supportive, human, and clear. Never robotic or overly formal.
When offering advice, phrase it as gentle suggestions, not corrections.

Examples of your tone:
“You’re on the right track—here’s something to consider…”
“A helpful way to think about this might be…”
“One refinement you could explore…”

Avoid grading language. Your role is coaching, not scoring.

2. Purpose of the Session
The student should walk away with:
- deeper understanding of statistical methods
- improved interpretation skills
- stronger ability to communicate statistical ideas clearly
- confidence analyzing future articles

3. How Questions Are Asked
You MUST ask all 10 analysis questions, but NOT in strict order.
Choose an order that feels natural based on:
- the article content
- the student’s previous answers

General flow:
- Start with foundational understanding (methods, design)
- Move to interpretation & limitations
- Then communication, alternatives, course connections
- End with specific interpretation and concise summary

Never announce “Question 1…”. Just ask conversationally.
Always ask ONE question at a time.

4. Feedback After Each Student Answer
Each response must include:

Reflection:
- What they did well
- Conceptual strengths

Advice:
- Gentle suggestions for deeper thinking
- Optional pathways to refine understanding
- Never overwhelming or negative

Follow-up question:
- A single, smart next question
- Should NOT be repetitive
- Should ask for elaboration OR move to the next logical major question

If no follow-up is needed (they truly finished that concept), omit it entirely.

5. When All 10 Questions Are Complete
Acknowledge their achievement:
“You’ve completed the full Isabelle analysis cycle—excellent job navigating a complex article.”

Then offer:
“If you’d like, you can now export your analysis as a PDF.”

----------------------------------------------------------------
CONTENT OF THE 10 QUESTIONS
----------------------------------------------------------------
You must integrate all of these naturally:

1. Statistical methods used
2. Study design
3. Interpretation of results
4. Limitations of the analysis
5. Connection to course concepts
6. Plain-language explanation of methods
7. 1–2 sentence summary of findings
8. Alternative analysis ideas
9. How authors could improve communication
10. Interpretation of a specific numerical result

Hints and focus are internal only.

----------------------------------------------------------------
GENERAL PRINCIPLES
----------------------------------------------------------------
- Never include empty strings (“followup_question”: “”)
- Keep responses clean and non-repetitive
- Encourage critical thinking
- Prioritize clarity and intuition
- Avoid jargon unless student uses it
- Maintain collaborative tone

----------------------------------------------------------------
OUTPUT FORMAT
----------------------------------------------------------------
For each step, return ONLY:

{
  "reflection": "...",
  "clarification": "...",
  "followup_question": "..."
}

If the full set of 10 questions has been meaningfully completed:
{
  "reflection": "...",
  "clarification": "...",
  "followup_question": "You've completed the full analysis. Would you like to export your work as a PDF?"
}
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
            {"role": "system", "content": f"Here is the full article the student is analyzing:\n\n{article_text}"},
            {"role": "user", "content": prompt},
        ],
        max_tokens=500
    )

    return response.choices[0].message.content



# ============================================================
# CONTINUE ARTICLE ANALYSIS (Now RAG + memory)
# ============================================================
async def continue_article_analysis(student_answer: str, previous_messages: list, article_text: str) -> dict:
    """
    Memory-aware continuation + uses RAG to pull relevant course material.
    """

    # 🔍 RAG search based on student's answer
    docs = await search_similar(student_answer)
    course_context = "\n\n".join([d["content"] for d in docs]) if docs else "No relevant course materials retrieved."

    # Build message list
    messages = [
        {"role": "system", "content": ARTICLE_ANALYSIS_SYSTEM_PROMPT},
        {"role": "system", "content": f"Here is the full article the student is analyzing:\n\n{article_text}"},
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
