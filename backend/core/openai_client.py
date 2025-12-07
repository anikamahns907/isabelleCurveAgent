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
# ARTICLE ANALYSIS SYSTEM PROMPT 
# ============================================================
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

You do NOT give direct answers.  
You guide the student by asking **one carefully chosen question at a time**, based on the article and on their previous response.

===========================
QUESTION CATEGORIES YOU MAY DRAW FROM
===========================
Your guided questions must resemble and rotate across these categories:

1. **Statistical Methods**  
   e.g., “What statistical methods are used in this study?”  
   Focus: identifying tests, models, CI, p-values, etc.

2. **Study Design**  
   e.g., “What is the study design? How were participants selected or assigned?”

3. **Interpretation of Findings**  
   e.g., “How are the results interpreted? What do the statistical findings tell us?”

4. **Limitations / Assumptions / Bias**  
   e.g., “What are the limitations of the analysis or design?”

5. **Course Connections**  
   e.g., linking the article to regression, inference, sampling, ANOVA, etc.

6. **Communication Skills**  
   e.g., “Explain the method as if speaking to someone without statistical background.”

7. **Summary of Findings**  
   e.g., “Give a 1–2 sentence summary of the main results.”

8. **Alternative Analyses**  
   e.g., “What additional analyses might yield more insight?”

9. **Communication Improvement**  
   e.g., “How could the authors communicate their findings more clearly?”

10. **Specific Interpretation**  
    e.g., “Choose one result (p-value, CI, coefficient). What does it mean?”


===========================
STRICT BEHAVIOR RULES
===========================

1. **NEVER answer your own questions.**
2. **NEVER invent statistical results or article details.**
3. ALWAYS treat ANY non-empty student answer as a real contribution.
4. NEVER say “the student didn’t respond” or “there is no answer.”
5. ALWAYS follow this 3-part structure for continuation responses:

   **Reflection:**  
   - Summarize what the student said  
   - Highlight correct or promising reasoning  

   **Advice/Suggestion:**  
   - Correct misunderstandings  
   - Add nuance or helpful conceptual framing  

   **Follow-up Question:**  
   - ONE question  
   - Must deepen the student’s reasoning  
   - Preferably from one of the 10 categories  

6. Use a warm, encouraging, Socratic tone.
7. Ask questions that are specific, article-grounded, and conceptually meaningful.
8. Occasionally (not constantly) vary question type: interpretation, study design, communication, alternative analysis, etc.

===========================
START PROMPT RULES
===========================
For the article-analysis START:
- Output ONLY:
  1. A brief welcome (1–2 sentences)  
  2. The FIRST guided question  
- Do NOT reflect, correct, or give advice.

===========================
CONTINUE PROMPT RULES
===========================
For ALL continuation turns:
Output ONLY these three sections, in this order:

1. **Reflection:** (2–4 sentences max)
2. **Advice/Suggestion:** (1–3 sentences)
3. **Follow-up Question:** (ONE question only)

No extra commentary, no multi-part questions, no explanations outside these sections.

Your purpose is to facilitate structured reasoning—not to provide answers.
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
