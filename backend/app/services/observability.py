from typing import Any, Dict, Optional
from app.main import supabase


def log_event(event_type: str, payload: Dict[str, Any], clinic_id: Optional[str] = None) -> None:
    try:
        supabase.table("system_events").insert(
            {"clinic_id": clinic_id, "event_type": event_type, "payload": payload}
        ).execute()
    except Exception:
        return
