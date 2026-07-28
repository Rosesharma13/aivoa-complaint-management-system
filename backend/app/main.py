from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import complaints, ai_assistant

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AIVOA Customer Complaint Management System",
    description="AI-powered complaint intake & triage system for pharmaceutical manufacturing (API/FDF) QMS.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaints.router)
app.include_router(ai_assistant.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "aivoa-complaint-system-backend"}


@app.get("/api/health")
def health():
    return {"status": "healthy", "groq_key_configured": bool(settings.GROQ_API_KEY)}
