import json
import os
import re
import urllib.request
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from app.main import supabase
from app.services.agenda_logic import create_appointment, get_available_dates_for_clinic, get_available_slots
from app.services.ai_service import classify_intent, get_reply_for_intent


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def _http_post(url: str, payload: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _extract_with_openai(text: str, treatments: List[str]) -> Dict[str, Any]:
    if not OPENAI_API_KEY:
        return {}

    system = (
        "Eres un asistente de agenda odontologica. Responde SOLO JSON. "
        "Devuelve: intent (appointment|question|cancel|confirm), "
        "patient_name, date (YYYY-MM-DD o null), time (HH:MM o null), "
        "treatment (string o null), action (string o null), reply (string o null)."
    )
    user = f"Mensaje: {text}\nTratamientos disponibles: {', '.join(treatments)}"
    payload = {
        "model": "gpt-4o-mini",
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.2,
    }
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    data = _http_post("https://api.openai.com/v1/chat/completions", payload, headers)
    content = data["choices"][0]["message"]["content"]
    try:
        return json.loads(content)
    except Exception:
        return {}


def _parse_date(date_str: Optional[str]) -> Optional[str]:
    if not date_str:
        return None
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return date_str
    except Exception:
        return None


def _parse_time(time_str: Optional[str]) -> Optional[str]:
    if not time_str:
        return None
    try:
        datetime.strptime(time_str, "%H:%M")
        return time_str
    except Exception:
        return None


def _find_treatment_id(clinic_id: str, treatment_name: Optional[str]) -> Optional[str]:
    if not treatment_name:
        return None
    name = _normalize(treatment_name)
    res = (
        supabase.table("treatments")
        .select("id,name")
        .eq("clinic_id", clinic_id)
        .execute()
    )
    for t in res.data or []:
        if name in _normalize(t.get("name", "")):
            return t.get("id")
    return None


def _get_treatments_names(clinic_id: str) -> List[str]:
    res = (
        supabase.table("treatments")
        .select("name")
        .eq("clinic_id", clinic_id)
        .execute()
    )
    return [t.get("name") for t in (res.data or []) if t.get("name")]


def _ensure_patient(clinic_id: str, patient_name: str, phone: str) -> Optional[str]:
    lookup = (
        supabase.table("patients")
        .select("id")
        .eq("clinic_id", clinic_id)
        .eq("full_name", patient_name)
        .limit(1)
        .execute()
    )
    if lookup.data:
        return lookup.data[0]["id"]

    created = (
        supabase.table("patients")
        .insert(
            {
                "clinic_id": clinic_id,
                "full_name": patient_name,
                "phone": phone,
            }
        )
        .execute()
    )
    return created.data[0]["id"] if created.data else None


def _suggest_slots(clinic_id: str, treatment_id: str, date: Optional[str]) -> Tuple[Optional[str], List[str]]:
    if date:
        slots = get_available_slots(clinic_id, date, treatment_id)
        if slots:
            return date, slots
    dates = get_available_dates_for_clinic(clinic_id, treatment_id, days_ahead=7)
    for d in dates:
        if d.get("available"):
            slots = get_available_slots(clinic_id, d.get("date"), treatment_id)
            return d.get("date"), slots
    return None, []


def build_ai_reply(
    clinic_id: str,
    incoming_text: str,
    phone: str,
) -> str:
    treatments = _get_treatments_names(clinic_id)
    ai = _extract_with_openai(incoming_text, treatments)

    intent = ai.get("intent") if ai else None
    if not intent:
        intent = classify_intent(incoming_text)

    if intent not in ["appointment", "question", "cancel", "confirm"]:
        intent = "question"

    if intent != "appointment":
        return ai.get("reply") if ai and ai.get("reply") else get_reply_for_intent(intent, incoming_text)

    patient_name = (ai.get("patient_name") or "").strip() if ai else ""
    treatment_name = ai.get("treatment") if ai else None
    date = _parse_date(ai.get("date") if ai else None)
    time = _parse_time(ai.get("time") if ai else None)

    if not patient_name:
        return "Para reservar necesito tu nombre completo."

    treatment_id = _find_treatment_id(clinic_id, treatment_name)
    if not treatment_id:
        return "Decime que tratamiento necesitas. Ej: limpieza, consulta, ortodoncia."

    if not date or not time:
        sug_date, slots = _suggest_slots(clinic_id, treatment_id, date)
        if not sug_date:
            return "No encuentro horarios disponibles en los proximos dias."
        sample = ", ".join(slots[:5]) if slots else ""
        return f"Disponibilidad para {sug_date}: {sample}. Decime horario."

    patient_id = _ensure_patient(clinic_id, patient_name, phone)
    if not patient_id:
        return "No pude registrar el paciente, intenta de nuevo."

    result = create_appointment(
        clinic_id=clinic_id,
        patient_id=patient_id,
        patient_name=patient_name,
        patient_phone=phone,
        date=date,
        start_time=time,
        treatment_id=treatment_id,
        allow_double_booking=False,
    )
    if result.get("error"):
        return f"No pude agendar: {result['error']}. Decime otro horario."

    return f"Turno confirmado para {patient_name} el {date} a las {time}."
