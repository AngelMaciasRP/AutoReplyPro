# app/routers/stats.py
from fastapi import APIRouter, Query
from supabase import create_client
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/stats", tags=["stats"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


@router.get("/overview/{clinic_id}")
def overview(clinic_id: str, days: int = 30):
    end = datetime.utcnow()
    start = end - timedelta(days=days)

    # mensajes count
    m = supabase.table("messages").select("id", count="exact") \
        .eq("clinic_id", clinic_id) \
        .gte("created_at", start.isoformat()).lte("created_at", end.isoformat()) \
        .execute()

    # appointments total
    a = supabase.table("appointments").select("id", count="exact") \
        .eq("clinic_id", clinic_id).execute()

    # appointments by service
    by_service = supabase.table("appointments").select("service, count(*)").eq("clinic_id", clinic_id).execute()

    # upcoming next 7 days
    upcoming = supabase.table("appointments").select("*").eq("clinic_id", clinic_id).gte("scheduled_at", datetime.utcnow().isoformat()).lte((datetime.utcnow()+timedelta(days=7)).isoformat()).order("scheduled_at", {"ascending": True}).limit(50).execute()

    return {
        "messages_last_30_days": m.count if hasattr(m, "count") else (m.data[0]["count"] if m.data else 0),
        "appointments_total": a.count if hasattr(a, "count") else len(a.data),
        "by_service": by_service.data,
        "upcoming": upcoming.data
    }


@router.get("/appointment_breakdown/{clinic_id}")
def appointment_breakdown(clinic_id: str, days: int = 30):
    start = (datetime.utcnow() - timedelta(days=days)).isoformat()
    res = supabase.rpc("appointments_by_service_and_day", {"clinic_id": clinic_id, "start": start})
    # optional: create a stored procedure for efficiency, fallback to client-side grouping if not available
    return res.data
