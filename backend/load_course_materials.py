import os
import fitz
import pytesseract
from PIL import Image
import asyncio
from backend.core.rag import embed_text
from backend.core.supabase_client import supabase

ROOT = "backend/course_materials"


def extract_from_pdf(path):
    print(f"[PDF] Extracting: {path}")
    text = ""
    try:
        doc = fitz.open(path)
        for pg in doc:
            text += pg.get_text()
        return " ".join(text.split())
    except Exception as e:
        print(f"ERROR reading PDF {path}: {e}")
        return ""


def extract_from_image(path):
    print(f"[IMG] OCR'ing: {path}")
    try:
        img = Image.open(path)
        text = pytesseract.image_to_string(img)
        return " ".join(text.split())
    except Exception as e:
        print(f"ERROR OCR image {path}: {e}")
        return ""


def chunk(text, size=800):
    words = text.split()
    for i in range(0, len(words), size):
        yield " ".join(words[i:i + size])


async def process_all():
    print("=== STARTING COURSE MATERIAL INGESTION ===")

    for root, _, files in os.walk(ROOT):
        for fname in files:
            path = os.path.join(root, fname)
            ext = fname.lower().split(".")[-1]

            # Extract text
            if ext == "pdf":
                full_text = extract_from_pdf(path)
            elif ext in ["jpg", "jpeg", "png"]:
                full_text = extract_from_image(path)
            else:
                print(f"[SKIP] Unsupported file type: {path}")
                continue

            if not full_text.strip():
                print(f"[WARN] No extractable text in {path}")
                continue

            # Chunk & insert
            for c in chunk(full_text):
                try:
                    emb = await embed_text(c)

                    # === IMPORTANT LOG ===
                    print(f"Inserting chunk from {path}...")

                    response = supabase.table("course_materials").insert({
                        "filepath": path,
                        "content": c,
                        "embedding": emb
                    }).execute()

                    # Log Supabase response
                    print("→ Insert response:", response)

                except Exception as e:
                    print(f"ERROR inserting chunk from {path}: {e}")

    print("=== DONE INGESTING ===")


if __name__ == "__main__":
    asyncio.run(process_all())
