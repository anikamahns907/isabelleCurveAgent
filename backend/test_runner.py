# This script simulates a real 10-question Isabelle Curve article analysis session.
# It:
# 1. Uploads a PDF to /articleanalysis/start
# 2. Receives the first question from the AI
# 3. Sends a series of simulated student answers to /articleanalysis/continue
# 4. Prints every reflection/clarification/followup JSON from the AI
# 5. Stops automatically when followup_question = null
# 6. Exports a full transcript from /articleanalysis/export
#
# Purpose:
# - Test correctness of system prompt
# - Test JSON formatting reliability
# - Test RAG conditioning
# - Test end-of-session behavior
# - Ensure model follows “one question at a time” rules
# - Verify the PDF → extract → conversation flow
"""
test_runner.py

A standalone script to automatically test the full
PDF → start → student answers → continue → finish → export
pipeline of the Isabelle Curve backend.

Run with:
    python test_runner.py
"""

import time
import json
import requests

BASE = "http://127.0.0.1:8000/analysis"


# ------------------------------------------------------------
# 1) Upload PDF and start analysis
# ------------------------------------------------------------
def start_session(pdf_path: str):
    print("\n=== STARTING ARTICLE ANALYSIS SESSION ===")
    with open(pdf_path, "rb") as f:
        files = {"file": ("article.pdf", f, "application/pdf")}
        r = requests.post(f"{BASE}/start", files=files)

    print("\n[START RESPONSE]")
    print(r.status_code, r.text)

    data = r.json()
    conversation_id = data["conversation_id"]
    first_question = data["next_question"]

    print(f"\nConversation ID: {conversation_id}")
    print(f"First Question:\n{first_question}\n")

    return conversation_id, first_question


# ------------------------------------------------------------
# 2) Send a student reply to /continue
# ------------------------------------------------------------
def student_reply(conversation_id: str, text: str):
    print("\n=== STUDENT REPLY ===")
    print("Student:", text)

    payload = {
        "conversation_id": conversation_id,
        "student_answer": text,
    }

    r = requests.post(f"{BASE}/continue", json=payload)

    print("\n[AI RESPONSE]")
    if r.status_code != 200:
        print(r.status_code, r.text)
        return None

    try:
        data = r.json()
    except Exception:
        print("Error: Could not parse AI JSON:\n", r.text)
        return None

    print(json.dumps(data, indent=2))
    return data


# ------------------------------------------------------------
# 3) Export the conversation transcript
# ------------------------------------------------------------
def export_transcript(conversation_id: str):
    print("\n=== EXPORTING TRANSCRIPT ===")
    r = requests.get(f"{BASE}/export/{conversation_id}")

    if r.status_code != 200:
        print("Export error:", r.text)
        return

    data = r.json()
    print("[Export retrieved successfully]")
    print("Turns:", len(data["transcript"]))

    # Save markdown
    md_file = f"export_{conversation_id}.md"
    with open(md_file, "w") as f:
        for t in data["transcript"]:
            ts = t["timestamp"]
            role = t["role"].upper()
            content = t["content"]

            f.write(f"### {role} — {ts}\n")

            try:
                parsed = json.loads(content)
                if parsed.get("reflection"):
                    f.write(f"Reflection:\n{parsed['reflection']}\n\n")
                if parsed.get("clarification"):
                    f.write(f"Clarification:\n{parsed['clarification']}\n\n")
                if parsed.get("followup_question"):
                    f.write(f"Follow-Up Question:\n{parsed['followup_question']}\n\n")
            except:
                f.write(content + "\n\n")

            f.write("\n---\n\n")

    print(f"Transcript saved → {md_file}")


# ------------------------------------------------------------
# 4) Main test sequence
# ------------------------------------------------------------
if __name__ == "__main__":
    # ======= CHANGE THIS TO ANY PDF YOU WANT =======
    PDF_PATH = "samplepdf.pdf"

    conversation_id, first_q = start_session(PDF_PATH)

    time.sleep(1)

    # ======= STUDENT SIMULATION ANSWERS =======
    # You can add more – or replace these with random generators
    student_messages = [
        "I think the study used linear regression because they measured a continuous outcome.",
        "It looks like the design was observational, maybe cross-sectional?",
        "The results seem to indicate an association but not necessarily causation.",
        "A limitation might be residual confounding and maybe small sample size.",
        "This reminds me of what we learned about regression assumptions.",
        "To explain to someone without stats background: it's basically checking how one variable predicts another.",
        "A short summary would be: the authors found a significant relationship between exposure and outcome.",
        "An additional analysis could be adjusting for interactions or trying a stratified model.",
        "The authors could improve clarity by explaining their variable selection process.",
        "A specific statistic: the confidence interval shows the plausible range of the effect.",
    ]

    # ======= RUN THROUGH THE ANALYSIS =======
    for msg in student_messages:
        ai = student_reply(conversation_id, msg)
        if ai is None:
            break

        # Stop if the agent signals completion
        if ai.get("followup_question") is None:
            print("\n=== SESSION COMPLETE ===")
            break

        time.sleep(1)

    # ======= EXPORT AT END =======
    export_transcript(conversation_id)
