from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.main import supabase
from app.services.automation_runner import run_automations_for_date, run_automations_for_appointment
from app.services.observability import log_event

router = APIRouter()


class AutomationCreate(BaseModel):
    clinic_id: str
    name: str
    trigger: str
    channel: str
    template: str
    enabled: bool = True


class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    trigger: Optional[str] = None
    channel: Optional[str] = None
    template: Optional[str] = None
    enabled: Optional[bool] = None


class AutomationRun(BaseModel):
    clinic_id: str
    trigger: str
    date: Optional[str] = None
    appointment_id: Optional[str] = None


@router.get("/automations")
def list_automations(clinic_id: str):
    try:
        res = (
            supabase.table("automation_rules")
            .select("*")
            .eq("clinic_id", clinic_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"rules": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/automations")
def create_automation(payload: AutomationCreate):
    try:
        res = supabase.table("automation_rules").insert(
            {
                "clinic_id": payload.clinic_id,
                "name": payload.name,
                "trigger": payload.trigger,
                "channel": payload.channel,
                "template": payload.template,
                "enabled": payload.enabled,
            }
        ).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo crear la automatizacion")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/automations/{rule_id}")
def update_automation(rule_id: str, payload: AutomationUpdate):
    try:
        updates = {k: v for k, v in payload.dict().items() if v is not None}
        if not updates:
            raise HTTPException(status_code=400, detail="Sin cambios")

        res = (
            supabase.table("automation_rules")
            .update(updates)
            .eq("id", rule_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Automatizacion no encontrada")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/automations/{rule_id}")
def delete_automation(rule_id: str):
    try:
        res = supabase.table("automation_rules").delete().eq("id", rule_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Automatizacion no encontrada")
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/automations/run")
def run_automation(payload: AutomationRun):
    try:
        if payload.appointment_id:
            apt = (
                supabase.table("appointments")
                .select("*")
                .eq("id", payload.appointment_id)
                .single()
                .execute()
            )
            if not apt.data:
                raise HTTPException(status_code=404, detail="Turno no encontrado")
            msgs = run_automations_for_appointment(payload.trigger, apt.data)
            log_event(
                "automation_run",
                {"trigger": payload.trigger, "appointment_id": payload.appointment_id, "count": len(msgs)},
                clinic_id=apt.data.get("clinic_id"),
            )
            return {"messages": msgs}

        if payload.date:
            msgs = run_automations_for_date(payload.clinic_id, payload.trigger, payload.date)
            log_event(
                "automation_run",
                {"trigger": payload.trigger, "date": payload.date, "count": len(msgs)},
                clinic_id=payload.clinic_id,
            )
            return {"messages": msgs}

        raise HTTPException(status_code=400, detail="Falta date o appointment_id")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
