import json
from groq import Groq

from app.config import settings

_client = None


def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def run_json_completion(system_prompt: str, user_prompt: str, model: str, temperature: float = 0.2) -> dict:
    """
    Calls Groq chat completion and forces a JSON object back.
    gemma2-9b-it and llama-3.3-70b-versatile both support Groq's
    `response_format={"type": "json_object"}` mode.
    """
    client = get_client()
    completion = client.chat.completions.create(
        model=model,
        temperature=temperature,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    content = completion.choices[0].message.content
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # very small models occasionally wrap JSON in text/fences - salvage it
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1:
            return json.loads(content[start:end + 1])
        raise


def run_text_completion(system_prompt: str, user_prompt: str, model: str, temperature: float = 0.4) -> str:
    client = get_client()
    completion = client.chat.completions.create(
        model=model,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return completion.choices[0].message.content
