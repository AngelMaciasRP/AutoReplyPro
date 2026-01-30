from fastapi import APIRouter, HTTPException
from app.main import supabase

router = APIRouter(prefix="/calendar")

@router.get("/")
def get_calendar_day(clinic_id: str, date: str):
    try:
        res = (
            supabase.table("appointments")
            .select("id,date,start_time,patient_name,treatment_id,status,double_booked")
            .eq("clinic_id", clinic_id)
            .eq("date", date)
            .neq("status", "cancelled")
            .order("start_time")
            .execute()
        )

        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
