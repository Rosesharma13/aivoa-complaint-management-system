# AIVOA.AI — AI-Powered Customer Complaint Management System

A Customer Complaint Management System for pharmaceutical (API & FDF) manufacturing,
built for the AIVOA.AI Round 1 assignment.

- **Frontend:** React + Redux Toolkit (Vite)
- **Backend:** Python + FastAPI
- **AI Orchestration:** LangGraph
- **LLMs:** Groq — `gemma2-9b-it` (extraction/summary) & `llama-3.3-70b-versatile` (reasoning: risk, root cause, CAPA, duplicate check, chat)
- **Database:** SQLAlchemy — works with PostgreSQL, MySQL, or SQLite (default, zero setup)

## What it does

1. **Log Customer Complaint** (left panel) — a structured QMS complaint form (origin,
   product/batch identification, complaint details, severity/priority).
2. **AI Complaint Intake Assistant** (right panel) — drag-and-drop a complaint
   document (PDF/DOCX/TXT/EML) or paste raw text/email. A LangGraph pipeline runs:
   `extract details → check completeness → classify risk → detect duplicates →
   recommend root cause → recommend CAPA → summarize`, then auto-fills the form
   and shows the AI's insights. A chat box lets you ask the assistant questions
   about the currently loaded complaint.
3. **Save Complaint** persists the record (with all AI-generated fields) to the database.

## Project structure

```
backend/
  app/
    main.py              FastAPI app + CORS
    config.py             Settings (.env)
    database.py            SQLAlchemy engine/session
    models.py               Complaint ORM model
    schemas.py                Pydantic request/response models
    routers/
      complaints.py          CRUD endpoints
      ai_assistant.py         Extraction + chat endpoints
    ai/
      groq_client.py          Groq SDK wrapper (JSON + text completions)
      prompts.py               System prompts for every AI step
      langgraph_workflow.py    The LangGraph StateGraph pipeline
      document_parser.py       PDF/DOCX/EML/TXT text extraction
  requirements.txt
  .env.example
frontend/
  src/
    App.jsx
    store/                Redux Toolkit slice + store
    api/api.js             Axios client
    components/
      ComplaintForm.jsx     Left panel
      AIAssistantPanel.jsx    Right panel (upload/paste/progress/chat/insights)
  package.json
sample_data/
  sample_complaint_email.txt   Use this to test the extraction end-to-end
```

## 1. Get a free Groq API key

1. Go to https://console.groq.com and sign up (free).
2. Create an API key under **API Keys**.
3. Keep it handy for step 2 below.

## 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# open .env and paste your GROQ_API_KEY
```

### Choosing a database (all free)

The `.env` ships with `DATABASE_URL=sqlite:///./aivoa_complaints.db` by default —
**this needs zero setup**, good for getting the demo running immediately.

To satisfy the assignment's "MySQL/Postgres SQL" requirement, PostgreSQL is easy to
run for free:

- **Local install (free, no subscription):** install PostgreSQL, create a database
  `aivoa_complaints`, then set:
  `DATABASE_URL=postgresql+psycopg2://postgres:<password>@localhost:5432/aivoa_complaints`
- **Free hosted Postgres (no local install):** create a free project on
  [Neon](https://neon.tech) or [Supabase](https://supabase.com) and paste the
  connection string they give you into `DATABASE_URL`.
- For MySQL instead, install `mysqlclient` or `pymysql` and use a
  `mysql+pymysql://user:pass@localhost/aivoa_complaints` URL — MySQL Community
  Server is free and open-source too.

Then run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/docs for interactive API docs, and
http://localhost:8000/api/health to confirm your Groq key is picked up.

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173. The Vite dev server proxies `/api` calls to the
backend on port 8000.

## 4. Try it out

1. Open the app — the right panel shows the AI Complaint Intake Assistant.
2. Paste the contents of `sample_data/sample_complaint_email.txt` into the
   "Paste Complaint Text / Email" box (or upload a PDF/DOCX/TXT/EML version of it),
   then click **Extract from Text**.
3. Watch the extraction progress, then review the auto-filled form (highlighted
   fields) and the AI Insights: completeness score, risk classification, root
   cause recommendation, CAPA recommendation, summary, and duplicate check.
4. Adjust any field manually if needed, then click **Save Complaint**.
5. Use the chat box to ask the assistant questions like *"Why was this classified
   as Major risk?"* or *"What CAPA did you recommend?"*.

## How this maps to the assignment's LangGraph / AI requirements

| Bonus feature | Where it's implemented |
|---|---|
| Complaint Completeness Checker | `node_completeness_check` in `langgraph_workflow.py` |
| Root Cause Recommendation | `node_root_cause` |
| Duplicate Complaint Detection | `node_duplicate_detection` (compares against last 50 saved complaints) |
| CAPA Recommendation | `node_capa` |
| Complaint Summary | `node_summarize` |
| AI Risk Classification | `node_risk_classification` |

Each node is a discrete LangGraph node so the graph, state, and prompts can each be
explained independently in your demo video walkthrough (frontend → API endpoint →
LangGraph node → Groq call → response → form population), as required in the
"Deliverables" section of the assignment.

## Notes

- Production-grade OCR isn't implemented (not required per the assignment) —
  `document_parser.py` covers PDF text layers, DOCX, EML, and plain text, which is
  enough for realistic demo documents you create yourself.
- All AI calls go through `groq_client.py` so swapping models (e.g. trying
  `llama-3.3-70b-versatile` for extraction too) is a one-line change in `.env`.
- Do not commit your real `.env` file (it's already listed conceptually as
  secret — create a `.gitignore` with `.env` and `venv/` before pushing to GitHub).
