import json
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.ai.document_parser import extract_text_from_upload
from app.ai.langgraph_workflow import run_complaint_workflow
from app.ai.groq_client import run_text_completion
from app.ai import prompts
from app.config import settings

router = APIRouter(prefix="/api/ai", tags=["ai"])

MAX_FILE_SIZE_MB = 10


def _existing_complaints_context(db: Session) -> list[dict]:
    rows = (
        db.query(models.Complaint)
        .order_by(models.Complaint.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "product_name": r.product_name,
            "batch_lot_number": r.batch_lot_number,
            "complaint_type": r.complaint_type,
            "detailed_description": r.detailed_description,
        }
        for r in rows
    ]


def _to_extraction_result(state: dict) -> schemas.ExtractionResult:
    return schemas.ExtractionResult(
        extracted=schemas.ComplaintBase(**state.get("extracted", {})),
        completeness_score=state.get("completeness_score", 0),
        missing_fields=state.get("missing_fields", []),
        risk_classification=state.get("risk_classification", "Minor"),
        risk_rationale=state.get("risk_rationale", ""),
        root_cause_recommendation=state.get("root_cause_recommendation", ""),
        capa_recommendation=state.get("capa_recommendation", ""),
        ai_summary=state.get("ai_summary", ""),
        possible_duplicate_id=state.get("possible_duplicate_id"),
        duplicate_confidence=state.get("duplicate_confidence"),
    )


@router.post("/extract-text", response_model=schemas.ExtractionResult)
def extract_from_text(payload: schemas.ExtractTextRequest, db: Session = Depends(get_db)):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured on the server (.env)")

    existing = _existing_complaints_context(db)
    state = run_complaint_workflow(payload.text, existing)
    return _to_extraction_result(state)


@router.post("/extract-file", response_model=schemas.ExtractionResult)
async def extract_from_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured on the server (.env)")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_FILE_SIZE_MB}MB limit")

    text = extract_text_from_upload(file.filename, content)
    if not text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any text from this file")

    existing = _existing_complaints_context(db)
    state = run_complaint_workflow(text, existing)
    return _to_extraction_result(state)


@router.post("/chat", response_model=schemas.ChatResponse)
def chat(payload: schemas.ChatRequest, db: Session = Depends(get_db)):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured on the server (.env)")

    context_parts = []
    if payload.complaint_id:
        complaint = db.query(models.Complaint).get(payload.complaint_id)
        if complaint:
            context_parts.append("Saved complaint record: " + json.dumps({
                k: v for k, v in complaint.__dict__.items() if not k.startswith("_")
            }, default=str))
    if payload.current_form_state:
        context_parts.append("Current (unsaved) form state: " + json.dumps(payload.current_form_state, default=str))

    context = "\n\n".join(context_parts) or "No complaint is currently loaded."
    user_prompt = f"Context:\n{context}\n\nUser question: {payload.message}"

    reply = run_text_completion(
        system_prompt=prompts.CHAT_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        model=settings.GROQ_REASONING_MODEL,
    )
    return schemas.ChatResponse(reply=reply)
