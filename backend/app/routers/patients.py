from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.main import supabase

router = APIRouter()


class PatientCreate(BaseModel):
    clinic_id: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    metadata: dict = Field(default_factory=dict)


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[dict] = None


class PatientHistoryCreate(BaseModel):
    clinic_id: str
    treatment_id: Optional[str] = None
    appointment_id: Optional[str] = None
    notes: Optional[str] = None
    visited_at: Optional[str] = None
    next_treatment_id: Optional[str] = None
    next_visit_at: Optional[str] = None


class PatientFileCreate(BaseModel):
    clinic_id: str
    file_url: str
    storage_path: Optional[str] = None
    file_name: Optional[str] = None
    file_type: str = "other"
    taken_at: Optional[str] = None
    notes: Optional[str] = None


@router.get("/patients")
def list_patients(clinic_id: str, query: Optional[str] = None):
    try:
        q = supabase.table("patients").select("*").eq("clinic_id", clinic_id)
        if query:
            pattern = f"%{query}%"
            q = q.or_(
                f"full_name.ilike.{pattern},phone.ilike.{pattern},email.ilike.{pattern}"
            )
        res = q.order("full_name", desc=False).limit(50).execute()
        return {"patients": res.data or []}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/patients")
def create_patient(payload: PatientCreate):
    try:
        res = supabase.table("patients").insert(payload.dict()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo crear paciente")
        return res.data[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/patients/{patient_id}")
def get_patient_detail(patient_id: str, clinic_id: str):
    try:
        patient = (
            supabase.table("patients")
            .select("*")
            .eq("id", patient_id)
            .eq("clinic_id", clinic_id)
            .single()
            .execute()
        )
        if not patient.data:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        history = (
            supabase.table("patient_history")
            .select("*")
            .eq("clinic_id", clinic_id)
            .eq("patient_id", patient_id)
            .order("visited_at", desc=True)
            .execute()
        )
        files = (
            supabase.table("patient_files")
            .select("*")
            .eq("clinic_id", clinic_id)
            .eq("patient_id", patient_id)
            .order("taken_at", desc=True)
            .execute()
        )

        return {
            "patient": patient.data,
            "history": history.data or [],
            "files": files.data or [],
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/patients/{patient_id}")
def update_patient(patient_id: str, payload: PatientUpdate):
    try:
        update_data = {k: v for k, v in payload.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="Sin cambios")

        res = (
            supabase.table("patients")
            .update(update_data)
            .eq("id", patient_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/patients/{patient_id}")
def delete_patient(patient_id: str):
    try:
        res = (
            supabase.table("patients")
            .delete()
            .eq("id", patient_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/patients/{patient_id}/history")
def add_patient_history(patient_id: str, payload: PatientHistoryCreate):
    try:
        row = payload.dict()
        row["patient_id"] = patient_id
        res = supabase.table("patient_history").insert(row).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo guardar historia")
        return res.data[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/patients/{patient_id}/files")
def add_patient_file(patient_id: str, payload: PatientFileCreate):
    try:
        row = payload.dict()
        row["patient_id"] = patient_id
        res = supabase.table("patient_files").insert(row).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo guardar archivo")
        return res.data[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
