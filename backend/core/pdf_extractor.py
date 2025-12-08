import fitz  # PyMuPDF

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract and clean text from a PDF."""
    try:
        text = ""
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            # Check if document is valid
            if doc.page_count == 0:
                return ""
            
            for page in doc:
                page_text = page.get_text()
                if page_text:
                    text += page_text + " "  # Add space between pages

        # Clean and normalize whitespace
        cleaned = " ".join(text.split())  # normalize whitespace
        return cleaned
    except Exception as e:
        # If extraction fails, return empty string (validation will catch this)
        print(f"PDF extraction error: {e}")
        return ""

def extract_article_title(file_bytes: bytes) -> str:
    """Extract article title from PDF. Gets raw text from first page to preserve line structure."""
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            if doc.page_count == 0:
                return "Untitled Article"
            
            # Get first page text with line breaks preserved
            first_page = doc[0]
            text = first_page.get_text()
            
            # Split into lines
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            
            # Look for title - usually first substantial line before "Abstract" or "Introduction"
            for line in lines[:15]:  # Check first 15 lines
                line_lower = line.lower()
                # Stop if we hit common section headers
                if any(header in line_lower for header in ['abstract', 'introduction', 'background', 'keywords']):
                    break
                # If we find a substantial line (likely the title)
                if len(line) > 15 and len(line) < 250:
                    return line
            
            # Fallback: use first substantial line
            for line in lines[:5]:
                if len(line) > 10:
                    if len(line) > 200:
                        return line[:200] + "..."
                    return line
            
            return "Untitled Article"
    except Exception as e:
        print(f"Title extraction error: {e}")
        return "Untitled Article"
