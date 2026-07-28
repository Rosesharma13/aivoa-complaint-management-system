# AIVOA AI-Powered Customer Complaint Management System

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Redux-61DAFB)](https://react.dev/)
[![AI Workflow](https://img.shields.io/badge/AI-LangGraph-4B8BBE)](https://langchain-ai.github.io/langgraph/)
[![LLM](https://img.shields.io/badge/LLM-Groq%20Llama%203.3%2070B-orange)](https://groq.com/)
[![Database](https://img.shields.io/badge/database-PostgreSQL%20\(Neon\)-336791)](https://neon.tech/)
[![Backend](https://img.shields.io/badge/backend-Render-46E3B7)](https://render.com/)
[![Frontend](https://img.shields.io/badge/frontend-Vercel-000000)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](#license)

An AI-powered Complaint Management System built for the **AIVOA.AI Round 1 Assignment**. The platform assists pharmaceutical quality teams by automating complaint intake, information extraction, risk assessment, duplicate detection, CAPA recommendations, and complaint summarization using **LangGraph** and **Groq LLMs**.

## Live Demo

**Frontend:** https://aivoa-complaint-management-system.vercel.app/

**Backend API:** https://aivoa-backend-7yai.onrender.com/

**Swagger API Documentation:** https://aivoa-backend-7yai.onrender.com/docs

> **Note:** The backend is hosted on Render's free tier. If the service has been idle, the first request may take **30–60 seconds** while the server wakes up.

---

# Model Information

The original assignment referenced the `gemma2-9b-it` model. Since this model has been deprecated by Groq, this project uses **Llama 3.3 70B Versatile**, Groq's recommended production model.

The overall AI pipeline, prompt engineering strategy, and LangGraph workflow remain unchanged. Only the underlying model has been updated to ensure compatibility and improved response quality.

---

# Project Overview

Traditional complaint management systems require users to manually classify complaints, determine severity, assess risks, and identify possible root causes.

This project enhances that workflow by integrating an AI-powered LangGraph pipeline capable of automatically analyzing customer complaints and generating structured recommendations before the complaint is saved.

The application combines a modern React frontend with a FastAPI backend and a multi-step AI workflow to streamline pharmaceutical complaint management.

---

# AI Features

The LangGraph workflow performs multiple AI tasks automatically:

| AI Capability                    | Description                                                           |
| -------------------------------- | --------------------------------------------------------------------- |
| Complaint Information Extraction | Extracts structured information from emails, documents, or plain text |
| Complaint Completeness Check     | Detects missing or incomplete information                             |
| Risk Assessment                  | Predicts complaint severity and business impact                       |
| Duplicate Complaint Detection    | Compares against recent complaints stored in PostgreSQL               |
| Root Cause Recommendation        | Suggests probable causes based on complaint context                   |
| CAPA Recommendation              | Generates corrective and preventive actions                           |
| Complaint Summary                | Produces a concise management summary                                 |
| AI Chat Assistant                | Answers questions related to the active complaint                     |

---

# Try These Example Complaints

Paste one of these into the AI Assistant.

### Product Quality Complaint

> The customer reported that multiple tablets were broken inside the blister pack. Batch number B240315. Product received from Delhi warehouse.

### Packaging Complaint

> Customer received damaged outer packaging with torn labels. Batch PK2026-12. Product integrity appears affected.

### Duplicate Detection Demo

Submit this complaint first:

> The vial leaked during transportation causing product loss.

Then submit:

> During delivery the vial was leaking and a significant amount of product was lost.

The AI should identify these as potential duplicate complaints.

---

# Technology Stack

## Frontend

* React
* Redux Toolkit
* Vite
* Axios

## Backend

* FastAPI
* SQLAlchemy
* Pydantic
* Python 3.11

## AI Layer

* LangGraph
* LangChain
* Groq API
* Llama 3.3 70B Versatile

## Database

* PostgreSQL (Neon)

## Deployment

* Vercel (Frontend)
* Render (Backend)

---

# System Architecture

```text
Customer Complaint

        │

        ▼

 React Frontend (Vite)

        │

        ▼

 FastAPI Backend

        │

        ▼

 LangGraph Workflow

 ┌─────────────────────────────┐
 │ Complaint Extraction        │
 │ Completeness Check          │
 │ Risk Classification         │
 │ Duplicate Detection         │
 │ Root Cause Recommendation   │
 │ CAPA Recommendation         │
 │ Complaint Summary           │
 └─────────────────────────────┘

        │

        ▼

 Groq Llama 3.3 70B

        │

        ▼

 Structured JSON Response

        │

        ▼

 Complaint Form Auto-filled

        │

        ▼

 PostgreSQL (Neon)
```

---

# Project Structure

```text
aivoa-complaint-management-system/

├── backend/
│
├── app/
│   ├── ai/
│   │   ├── groq_client.py
│   │   ├── langgraph_workflow.py
│   │   ├── prompts.py
│   │   └── document_parser.py
│   │
│   ├── routers/
│   │   ├── complaints.py
│   │   └── ai_assistant.py
│   │
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── config.py
│   └── main.py
│
├── requirements.txt
├──runtime.txt
│
├── frontend/
│
├── src/
│   ├── components/
│   │   ├── ComplaintForm.jsx
│   │   └── AIAssistantPanel.jsx
│   │
│   ├── api/
│   │   ├── api.js
│   ├── store/
│   │   ├── complaintSlice.js
│   │   ├── store.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
│
├── sample_data/
│   └── sample_complaint_email.txt
│
├── .gitignore
└── README.md
```

---

# Getting Started

## Prerequisites

* Python 3.11+
* Node.js 18+
* Groq API Key
* PostgreSQL Database (Neon)

---

## Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
```

Configure your `.env`

```env
GROQ_API_KEY=YOUR_API_KEY

DATABASE_URL=YOUR_NEON_DATABASE_URL
```

Start the server

```bash
uvicorn app.main:app --reload
```

Backend:

http://localhost:8000

Swagger Docs:

http://localhost:8000/docs

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Runs at

http://localhost:5173

---

# API Endpoints

| Endpoint          | Method | Description                      |
| ----------------- | ------ | -------------------------------- |
| `/api/ai/analyze` | POST   | Run LangGraph complaint analysis |
| `/api/ai/chat`    | POST   | AI Assistant conversation        |
| `/api/complaints` | GET    | List saved complaints            |
| `/api/complaints` | POST   | Save complaint                   |
| `/api/health`     | GET    | Backend health check             |

---

# Engineering Challenges

During development several real-world engineering issues were encountered and resolved.

### LangGraph State Management

Resolved workflow state collisions by redesigning node outputs and assigning dedicated state keys, ensuring reliable execution across all AI stages.

### Groq Model Migration

Updated the project from Groq's deprecated Gemma model to **Llama 3.3 70B Versatile** without changing the workflow architecture or prompt logic.

### Database Integration

Integrated PostgreSQL (Neon) using SQLAlchemy and verified complaint persistence with duplicate detection against previously stored complaints.

---

# Future Enhancements

* OCR support for scanned complaint documents
* Email inbox integration
* Complaint analytics dashboard
* User authentication & role-based access
* Audit history and complaint versioning
* Multi-language complaint processing

---

# License

MIT License

---

# Author

**Rose Sharma**

B.Tech Computer Science Engineering (Artificial Intelligence)

**GitHub:** https://github.com/Rosesharma13

**LinkedIn:** https://www.linkedin.com/in/rose-sharma13

---

⭐ If you found this project interesting, consider giving the repository a star.
