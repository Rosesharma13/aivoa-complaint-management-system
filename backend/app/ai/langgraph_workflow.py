"""
LangGraph workflow for the AI Complaint Intake Assistant.

Graph shape:

    extract_details --> completeness_check --> risk_classification
        --> duplicate_detection --> root_cause --> capa --> summarize --> END

Each node calls Groq (gemma2-9b-it for the lighter extraction/completeness steps,
llama-3.3-70b-versatile for the reasoning-heavier steps) and merges its output into
a shared state dict, which the FastAPI layer turns into an ExtractionResult.
"""
import json
from typing import TypedDict, Optional, List

from langgraph.graph import StateGraph, END

from app.config import settings
from app.ai.groq_client import run_json_completion
from app.ai import prompts


class ComplaintState(TypedDict, total=False):
    raw_text: str
    existing_complaints: List[dict]   # [{id, product_name, batch_lot_number, complaint_type, detailed_description}, ...]

    extracted: dict
    completeness_score: int
    missing_fields: List[str]
    risk_classification: str
    risk_rationale: str
    root_cause_recommendation: str
    capa_recommendation: str
    ai_summary: str
    possible_duplicate_id: Optional[int]
    duplicate_confidence: Optional[float]


def node_extract_details(state: ComplaintState) -> ComplaintState:
    result = run_json_completion(
        system_prompt=prompts.EXTRACTION_SYSTEM_PROMPT,
        user_prompt=state["raw_text"],
        model=settings.GROQ_EXTRACTION_MODEL,
    )
    state["extracted"] = result
    return state


def node_completeness_check(state: ComplaintState) -> ComplaintState:
    result = run_json_completion(
        system_prompt=prompts.COMPLETENESS_SYSTEM_PROMPT,
        user_prompt=json.dumps(state["extracted"]),
        model=settings.GROQ_EXTRACTION_MODEL,
    )
    state["completeness_score"] = result.get("completeness_score", 0)
    state["missing_fields"] = result.get("missing_fields", [])
    return state


def node_risk_classification(state: ComplaintState) -> ComplaintState:
    result = run_json_completion(
        system_prompt=prompts.RISK_SYSTEM_PROMPT,
        user_prompt=json.dumps(state["extracted"]),
        model=settings.GROQ_REASONING_MODEL,
    )
    state["risk_classification"] = result.get("risk_classification", "Minor")
    state["risk_rationale"] = result.get("risk_rationale", "")
    return state


def node_duplicate_detection(state: ComplaintState) -> ComplaintState:
    existing = state.get("existing_complaints") or []
    if not existing:
        state["possible_duplicate_id"] = None
        state["duplicate_confidence"] = 0.0
        return state

    payload = {"new_complaint": state["extracted"], "existing_complaints": existing}
    result = run_json_completion(
        system_prompt=prompts.DUPLICATE_SYSTEM_PROMPT,
        user_prompt=json.dumps(payload),
        model=settings.GROQ_REASONING_MODEL,
    )
    state["possible_duplicate_id"] = result.get("duplicate_id") if result.get("is_duplicate") else None
    state["duplicate_confidence"] = result.get("confidence", 0.0)
    return state


def node_root_cause(state: ComplaintState) -> ComplaintState:
    result = run_json_completion(
        system_prompt=prompts.ROOT_CAUSE_SYSTEM_PROMPT,
        user_prompt=json.dumps(state["extracted"]),
        model=settings.GROQ_REASONING_MODEL,
    )
    state["root_cause_recommendation"] = result.get("root_cause_recommendation", "")
    return state


def node_capa(state: ComplaintState) -> ComplaintState:
    payload = {
        "complaint": state["extracted"],
        "root_cause": state.get("root_cause_recommendation", ""),
    }
    result = run_json_completion(
        system_prompt=prompts.CAPA_SYSTEM_PROMPT,
        user_prompt=json.dumps(payload),
        model=settings.GROQ_REASONING_MODEL,
    )
    state["capa_recommendation"] = result.get("capa_recommendation", "")
    return state


def node_summarize(state: ComplaintState) -> ComplaintState:
    payload = {
        "complaint": state["extracted"],
        "risk": state.get("risk_classification"),
    }
    result = run_json_completion(
        system_prompt=prompts.SUMMARY_SYSTEM_PROMPT,
        user_prompt=json.dumps(payload),
        model=settings.GROQ_EXTRACTION_MODEL,
    )
    state["ai_summary"] = result.get("ai_summary", "")
    return state


def build_graph():
    graph = StateGraph(ComplaintState)

    graph.add_node("extract_details", node_extract_details)
    graph.add_node("completeness_check", node_completeness_check)
    graph.add_node("risk_classification", node_risk_classification)
    graph.add_node("duplicate_detection", node_duplicate_detection)
    graph.add_node("root_cause", node_root_cause)
    graph.add_node("capa", node_capa)
    graph.add_node("summarize", node_summarize)

    graph.set_entry_point("extract_details")
    graph.add_edge("extract_details", "completeness_check")
    graph.add_edge("completeness_check", "risk_classification")
    graph.add_edge("risk_classification", "duplicate_detection")
    graph.add_edge("duplicate_detection", "root_cause")
    graph.add_edge("root_cause", "capa")
    graph.add_edge("capa", "summarize")
    graph.add_edge("summarize", END)

    return graph.compile()


_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


def run_complaint_workflow(raw_text: str, existing_complaints: List[dict]) -> ComplaintState:
    graph = get_graph()
    initial_state: ComplaintState = {
        "raw_text": raw_text,
        "existing_complaints": existing_complaints,
    }
    final_state = graph.invoke(initial_state)
    return final_state
