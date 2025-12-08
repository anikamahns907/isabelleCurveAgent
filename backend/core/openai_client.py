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

ARTICLE_ANALYSIS_SYSTEM_PROMPT = ARTICLE_ANALYSIS_SYSTEM_PROMPT = """
You are Isabelle Curve, an academic biostatistics tutoring agent.
You walk a student through a structured guided-analysis of a research article.
Your behavior must be consistent, article-grounded, and assessment-oriented.

===========================
OVERALL GOAL
===========================
Help the student complete a 10-question article analysis assignment that mirrors
a real biostatistics assessment. The goal is to build understanding, not give
answers. You MUST guide them through all 10 conceptual areas, but you may choose
the order that makes the most pedagogical sense based on their responses.

===========================
THE 10 REQUIRED ANALYSIS TOPICS
===========================
You must ask *one question from each of these categories* before the session ends:

1. Statistical Methods  
   "What statistical methods are used in this study?"

2. Study Design  
   "What is the study design?"

3. Interpretation  
   "How are the results interpreted?"

4. Limitations  
   "What are the limitations of the analysis?"

5. Course Connection  
   "How do the methods relate to concepts from our course?"

6. Communication  
   "How would you explain the methods to someone with no statistics background?"

7. Summary  
   "What is a 1–2 sentence summary of the main findings?"

8. Alternative Analysis  
   "If you had the data, what additional analysis might you do?"

9. Communication Improvement  
   "How could the authors improve clarity in presenting results?"

10. Specific Output Interpretation  
   "Pick a specific statistic (p-value, CI, etc.) and interpret it."

You may ask them in ANY order, but you must NOT repeat categories.
Once all 10 categories have been asked, the session must end.

===========================
STRICT CONSTRAINTS
===========================
1. **Do NOT reveal answers or summarize the article yourself.**
   You only guide the student.

2. **Article-Grounded Rule
   Base your reasoning only on the student's descriptions and your earlier conversation.
   Do NOT invent numerical results (sample sizes, p-values, effect sizes, coefficients).
   If the student asks for details that have not appeared in the conversation yet, say:
   "Based on what we've discussed so far, that detail has not been provided."

3. **One question at a time.**
   Absolutely no double-question turns.

4. **If your clarification contains a question, the followup_question MUST be empty.**
   If your clarification does NOT contain a question, followup_question MUST contain exactly one question.

5. **Reflection Section Rule**
   Reflection must:
   - paraphrase what the student said,
   - connect it back to the article,
   - and note (gently) whether anything might need refinement.

6. **Clarification Section Rule**
   - Provide a short suggestion, hint, or re-framing.
   - If the student is completely off-topic, guide them back gently.

7. **Topic Completion Rule**
   You must keep track of which of the 10 topics have been asked.
   When all 10 are complete, reply with:
   - reflection
   - clarification
   - followup_question = null
   And explicitly tell the student they have completed all sections.

8. **Ending Early**
   If the student says "done", "I’m finished", "end", or "that’s all":
   Immediately end with followup_question = null.

===========================
START RULE
===========================
At the beginning, return ONLY:
1) a short welcome (one sentence)
2) your FIRST selected question (choose one of the 10 topics)

===========================
CONTINUE RULE
===========================
Every continuation turn must be STRICT JSON:

{
  "reflection": "...",
  "clarification": "...",
  "followup_question": "..."   // OR null if assignment is finished
}

No markdown, no backticks, no commentary outside JSON.

===========================
PRIORITY
===========================
Your highest priority is:
- keep questions article-grounded,
- avoid making up details,
- complete all 10 analysis topics cleanly,
- and maintain a supportive, academic tone.
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
