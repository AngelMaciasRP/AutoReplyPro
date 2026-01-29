from fastapi import APIRouter
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
    except Exception:
        return {"ok": False}
