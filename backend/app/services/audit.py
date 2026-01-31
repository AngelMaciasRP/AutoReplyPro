from typing import Any, Dict, Optional
from app.main import supabase


def log_audit(
    clinic_id: str,
    action: str,
    entity: str,
    entity_id: str,
    changes: Optional[Dict[str, Any]] = None,
    actor_id: Optional[str] = None,
) -> None:
    try:
        supabase.table("audit_logs").insert(
            {
                "clinic_id": clinic_id,
                "actor_id": actor_id,
                "action": action,
                "entity": entity,
                "entity_id": entity_id,
                "changes": changes or {},
            }
        ).execute()
    except Exception:
        # best-effort
        return
