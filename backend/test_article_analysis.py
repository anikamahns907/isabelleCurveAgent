import time
import requests

BASE_URL = "http://127.0.0.1:8000/articleanalysis"


def start_session(pdf_path: str):
    """Uploads a PDF and starts an article-analysis session."""
    print("\n=== STARTING NEW ARTICLE ANALYSIS SESSION ===")

    with open(pdf_path, "rb") as f:
        files = {"file": ("samplepdf.pdf", f, "application/pdf")}
        r = requests.post(f"{BASE_URL}/start", files=files)

    print("\n[START RESPONSE]")
    print(r.status_code, r.text)

    data = r.json()
    conversation_id = data["conversation_id"]

    print(f"\nStored conversation_id: {conversation_id}")
    print("First question:", data["next_question"])
    return conversation_id


def send_answer(conversation_id: str, text: str):
    """Sends a student answer to /continue and prints the AI's reply."""
    print("\n=== SENDING STUDENT ANSWER ===")
    print("Student:", text)

    payload = {
        "conversation_id": conversation_id,
        "student_answer": text
    }

    r = requests.post(f"{BASE_URL}/continue", json=payload)

    print("\n[CONTINUE RESPONSE]")
    print(r.status_code, r.text)

    try:
        response_json = r.json()
        print("\nReflection:", response_json["reflection"])
        print("Clarification:", response_json["clarification"])
        print("Next Question:", response_json["followup_question"])
        return response_json
    except Exception:
        print("Failed to parse JSON:", r.text)
        return None


if __name__ == "__main__":
    # --------------------------------------------------------
    # 1) Start the session
    # --------------------------------------------------------
    conversation_id = start_session("samplepdf.pdf")

    time.sleep(1)

    # --------------------------------------------------------
    # 2) Simulate a student answering progressively
    # --------------------------------------------------------
    student_messages = [
        "The study used logistic regression.",
        "The outcome variable was disease status.",
        "Predictor variables likely included age, sex, and baseline health.",
        "I’m not sure how interactions would affect the results.",
        "I think they controlled for confounders, but I'm not totally sure.",
        "Can you help me understand how to interpret coefficients in logistic regression?"
    ]

    for msg in student_messages:
        send_answer(conversation_id, msg)
        time.sleep(1)  # slight delay to mimic real usage
