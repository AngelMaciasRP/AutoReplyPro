from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.main import supabase

router = APIRouter()

# =========================
# Pydantic Schemas
# =========================

class TreatmentCreate(BaseModel):
    clinic_id: str
    name: str
    duration_minutes: int
    base_price: Optional[float] = None

class TreatmentResponse(BaseModel):
    id: str
    clinic_id: str
    name: str
    duration_minutes: int
    created_at: str

# =========================
# CREATE TREATMENT
# =========================

@router.post("/treatments/", response_model=TreatmentResponse)
def create_treatment(payload: TreatmentCreate):
    try:
        allowed_durations = {10, 15, 20, 25, 30, 45, 60, 90, 120}
        if payload.duration_minutes not in allowed_durations:
            raise HTTPException(
                status_code=400,
                detail="duration_minutes invalido. Usa 10, 15, 20, 25, 30, 45, 60, 90, 120",
            )
        result = supabase.table("treatments").insert({
            "clinic_id": payload.clinic_id,
            "name": payload.name,
            "duration_minutes": payload.duration_minutes,
            "base_price": payload.base_price,
        }).execute()

        if not result.data:
            raise HTTPException(status_code=400, detail="Error creating treatment")

        return result.data[0]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# LIST TREATMENTS
# =========================

@router.get("/treatments")
def list_treatments(clinic_id: str):
    try:
        result = supabase.table("treatments") \
            .select("*") \
            .eq("clinic_id", clinic_id) \
            .execute()

        return {"treatments": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
