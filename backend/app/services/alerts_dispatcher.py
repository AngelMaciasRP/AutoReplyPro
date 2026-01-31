from typing import Any, Dict, Optional
from app.main import supabase


def dispatch_alerts(event_type: str, payload: Dict[str, Any], clinic_id: Optional[str] = None):
    if not clinic_id:
        return
    try:
        rules = (
            supabase.table("alert_rules")
            .select("*")
            .eq("clinic_id", clinic_id)
            .eq("event_type", event_type)
            .eq("enabled", True)
            .execute()
        )
        for rule in rules.data or []:
            supabase.table("alert_notifications").insert(
                {
                    "clinic_id": clinic_id,
                    "rule_id": rule.get("id"),
                    "event_type": event_type,
                    "payload": payload,
                    "status": "sent",
                }
            ).execute()
    except Exception:
        # best-effort
        return
