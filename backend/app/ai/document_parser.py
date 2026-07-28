"""
Lightweight document text extraction. Per the assignment, production-grade OCR /
document parsing is NOT required — this covers the common formats (PDF, DOCX, TXT,
EML/plain email) well enough for the AI extraction step to work on.
"""
import io
import email
from email import policy


def extract_text_from_upload(filename: str, content: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "pdf":
        return _extract_pdf(content)
    if ext == "docx":
        return _extract_docx(content)
    if ext == "eml":
        return _extract_eml(content)
    # txt and anything else: best-effort decode
    return content.decode("utf-8", errors="ignore")


def _extract_pdf(content: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(content))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _extract_docx(content: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs)


def _extract_eml(content: bytes) -> str:
    msg = email.message_from_bytes(content, policy=policy.default)
    parts = [f"Subject: {msg.get('subject', '')}", f"From: {msg.get('from', '')}"]
    body = msg.get_body(preferencelist=("plain", "html"))
    if body:
        parts.append(body.get_content())
    return "\n".join(parts)
