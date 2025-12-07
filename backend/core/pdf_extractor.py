import fitz  # PyMuPDF

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract and clean text from a PDF."""
    text = ""
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()

    cleaned = " ".join(text.split())  # normalize whitespace
    return cleaned
