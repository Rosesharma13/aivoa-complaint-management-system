import datetime as dt
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)

    # 1. Origin & Customer Details
    complaint_source = Column(String(120))
    customer_name = Column(String(200))

    # 2. Product & Batch Identification
    product_name = Column(String(200))
    product_strength_grade = Column(String(120))
    batch_lot_number = Column(String(120))
    manufacturing_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    quantity_affected = Column(Float, nullable=True)
    quantity_unit = Column(String(20), default="kg")

    # 3. Complaint Details
    complaint_type = Column(String(120))
    complaint_date = Column(Date, nullable=True)
    detailed_description = Column(Text)

    # 4. Initial Assessment & Priority
    initial_severity = Column(String(30))
    priority = Column(String(30))

    # Status / workflow
    status = Column(String(30), default="Pending Triage")

    # --- AI-generated fields (bonus features) ---
    completeness_score = Column(Integer, nullable=True)          # 0-100
    missing_fields = Column(Text, nullable=True)                  # JSON string list
    risk_classification = Column(String(30), nullable=True)       # Critical/Major/Minor
    risk_rationale = Column(Text, nullable=True)
    root_cause_recommendation = Column(Text, nullable=True)
    capa_recommendation = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    duplicate_of_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    duplicate_confidence = Column(Float, nullable=True)

    raw_source_text = Column(Text, nullable=True)  # original pasted/uploaded text, for audit + dup detection

    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    duplicate_of = relationship("Complaint", remote_side=[id])
