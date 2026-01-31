from typing import Any, Dict, Optional, List
from app.main import supabase
from app.services.alerts_sender import send_email, send_webhook, send_whatsapp


def _build_message(event_type: str, payload: Dict[str, Any]) -> str:
    base = f"Alert: {event_type}"
    details = " ".join([f"{k}={v}" for k, v in payload.items()])
    return f"{base} {details}".strip()


def dispatch_alerts(
    event_type: str,
    payload: Dict[str, Any],
    clinic_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    if not clinic_id:
        return []
    try:
        rules = (
            supabase.table("alert_rules")
            .select("*")
            .eq("clinic_id", clinic_id)
            .eq("event_type", event_type)
            .eq("enabled", True)
            .execute()
        )
        notifications: List[Dict[str, Any]] = []
        for rule in rules.data or []:
            channel = rule.get("channel") or "email"
            target = rule.get("target") or ""
            message = _build_message(event_type, payload)
            ok = True
            error = ""
            if channel == "webhook":
                ok, error = send_webhook(target, {"event_type": event_type, "payload": payload})
            elif channel == "whatsapp":
                ok, error = send_whatsapp(target, message)
            else:
                ok, error = send_email(target, f"Alert: {event_type}", message)

            notif_payload = dict(payload)
            if error:
                notif_payload["error"] = error
            res = supabase.table("alert_notifications").insert(
                {
                    "clinic_id": clinic_id,
                    "rule_id": rule.get("id"),
                    "event_type": event_type,
                    "payload": notif_payload,
                    "status": "sent" if ok else "failed",
                }
            ).execute()
            if res.data:
                notifications.append(res.data[0])
        return notifications
    except Exception:
        return []
