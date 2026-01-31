from fastapi import APIRouter, HTTPException
from typing import Optional
from app.main import supabase

router = APIRouter()


@router.get("/metrics")
def basic_metrics():
    # Minimal metrics endpoint (extend with real aggregation)
    return {"ok": True}


@router.post("/events")
def create_event(payload: dict):
    try:
        supabase.table("system_events").insert(payload).execute()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events")
def list_events(
    clinic_id: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = 100,
):
    try:
        query = supabase.table("system_events").select("*")
        if clinic_id:
            query = query.eq("clinic_id", clinic_id)
        if event_type:
            query = query.eq("event_type", event_type)
        res = query.order("created_at", desc=True).limit(limit).execute()
        return {"events": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
