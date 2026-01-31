from typing import Any, Dict, Optional
from app.main import supabase
from app.services.alerts_dispatcher import dispatch_alerts


def log_event(event_type: str, payload: Dict[str, Any], clinic_id: Optional[str] = None) -> None:
    try:
        supabase.table("system_events").insert(
            {"clinic_id": clinic_id, "event_type": event_type, "payload": payload}
        ).execute()
    except Exception:
        return
    dispatch_alerts(event_type, payload, clinic_id=clinic_id)
