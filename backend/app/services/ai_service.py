# app/services/ai_service.py
import os, json
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Load templates
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "..", "templates", "flows_dental_general.json")
try:
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        FLOWS = json.load(f)
except Exception:
    FLOWS = {}

URGENT_KEYWORDS = FLOWS.get("triage_urgency", {}).get("keywords", ["dolor","duele","sangre","hinchado","urgente","emergencia"])

def classify_intent(text: str) -> str:
    if not text:
        return "unknown"
    txt = text.lower()
    for k in URGENT_KEYWORDS:
        if k in txt:
            return "urgency"
    if "limpieza" in txt or "limpiar" in txt:
        return "cleaning"
    if "precio" in txt or "cuesta" in txt or "valor" in txt:
        return "pricing"
    if "turno" in txt or "cita" in txt or "mañana" in txt or "hoy" in txt:
        return "appointment"
    return "question"

def get_reply_for_intent(intent: str, text: str) -> str:
    if intent == "urgency":
        return FLOWS.get("triage_urgency", {}).get("reply", "Lamentamos que estés con dolor. ¿Desde cuándo? ¿Querés turno prioritario?")
    if intent == "cleaning":
        return FLOWS.get("prices", {}).get("limpieza", "Limpieza: $3000 (orientativo). ¿Querés turno?")
    if intent == "pricing":
        prices = FLOWS.get("prices", {})
        return " | ".join(prices.values()) if prices else "Te comparto precios orientativos."
    if intent == "appointment":
        return FLOWS.get("appointment_flow", "Para reservar necesitamos: Nombre, día, franja horaria.")
    return FLOWS.get("welcome", "Hola 👋 ¿En qué podemos ayudarte hoy?")
