from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.main import supabase
from app.services.audit import log_audit
from app.services.observability import log_event

router = APIRouter()


class AlertRuleCreate(BaseModel):
    clinic_id: str
    name: str
    event_type: str
    channel: str = "email"
    target: Optional[str] = None
    enabled: bool = True


class AlertRuleUpdate(BaseModel):
    name: Optional[str] = None
    event_type: Optional[str] = None
    channel: Optional[str] = None
    target: Optional[str] = None
    enabled: Optional[bool] = None


class AlertTest(BaseModel):
    clinic_id: str
    event_type: str
    payload: dict = {}
    rule_id: Optional[str] = None


@router.get("/alerts/rules")
def list_rules(clinic_id: str):
    try:
        res = (
            supabase.table("alert_rules")
            .select("*")
            .eq("clinic_id", clinic_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"rules": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alerts/rules")
def create_rule(payload: AlertRuleCreate):
    try:
        res = supabase.table("alert_rules").insert(payload.dict()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo crear alerta")
        created = res.data[0]
        log_audit(
            payload.clinic_id,
            "create_alert_rule",
            "alert_rules",
            created.get("id", ""),
            {"event_type": payload.event_type, "channel": payload.channel},
        )
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/alerts/rules/{rule_id}")
def update_rule(rule_id: str, payload: AlertRuleUpdate):
    try:
        updates = {k: v for k, v in payload.dict().items() if v is not None}
        if not updates:
            raise HTTPException(status_code=400, detail="Sin cambios")
        res = (
            supabase.table("alert_rules")
            .update(updates)
            .eq("id", rule_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Regla no encontrada")
        updated = res.data[0]
        log_audit(
            updated.get("clinic_id", ""),
            "update_alert_rule",
            "alert_rules",
            rule_id,
            updates,
        )
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/alerts/rules/{rule_id}")
def delete_rule(rule_id: str):
    try:
        res = supabase.table("alert_rules").delete().eq("id", rule_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Regla no encontrada")
        deleted = res.data[0]
        log_audit(
            deleted.get("clinic_id", ""),
            "delete_alert_rule",
            "alert_rules",
            rule_id,
            {"name": deleted.get("name")},
        )
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/notifications")
def list_notifications(clinic_id: str, limit: int = 50):
    try:
        res = (
            supabase.table("alert_notifications")
            .select("*")
            .eq("clinic_id", clinic_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"notifications": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alerts/test")
def test_alert(payload: AlertTest):
    try:
        res = supabase.table("alert_notifications").insert(
            {
                "clinic_id": payload.clinic_id,
                "rule_id": payload.rule_id,
                "event_type": payload.event_type,
                "payload": payload.payload,
                "status": "sent",
            }
        ).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo enviar alerta")
        created = res.data[0]
        log_event(
            "alert_sent",
            {"notification_id": created.get("id"), "event_type": payload.event_type},
            clinic_id=payload.clinic_id,
        )
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
