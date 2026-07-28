import datetime as dt
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ComplaintBase(BaseModel):
    complaint_source: Optional[str] = None
    customer_name: Optional[str] = None

    product_name: Optional[str] = None
    product_strength_grade: Optional[str] = None
    batch_lot_number: Optional[str] = None
    manufacturing_date: Optional[dt.date] = None
    expiry_date: Optional[dt.date] = None
    quantity_affected: Optional[float] = None
    quantity_unit: Optional[str] = "kg"

    complaint_type: Optional[str] = None
    complaint_date: Optional[dt.date] = None
    detailed_description: Optional[str] = None

    initial_severity: Optional[str] = None
    priority: Optional[str] = None


class ComplaintCreate(ComplaintBase):
    status: Optional[str] = "Pending Triage"


class ComplaintUpdate(ComplaintBase):
    status: Optional[str] = None


class ComplaintOut(ComplaintBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    completeness_score: Optional[int] = None
    missing_fields: Optional[str] = None
    risk_classification: Optional[str] = None
    risk_rationale: Optional[str] = None
    root_cause_recommendation: Optional[str] = None
    capa_recommendation: Optional[str] = None
    ai_summary: Optional[str] = None
    duplicate_of_id: Optional[int] = None
    duplicate_confidence: Optional[float] = None
    created_at: dt.datetime
    updated_at: dt.datetime


class ExtractTextRequest(BaseModel):
    text: str


class ExtractionResult(BaseModel):
    """What the AI Copilot returns to auto-fill the form (left panel)."""
    extracted: ComplaintBase
    completeness_score: int
    missing_fields: List[str]
    risk_classification: str
    risk_rationale: str
    root_cause_recommendation: str
    capa_recommendation: str
    ai_summary: str
    possible_duplicate_id: Optional[int] = None
    duplicate_confidence: Optional[float] = None


class ChatRequest(BaseModel):
    message: str
    complaint_id: Optional[int] = None
    # lightweight context so the assistant can answer "what severity did you set?" etc.
    current_form_state: Optional[dict] = None


class ChatResponse(BaseModel):
    reply: str
