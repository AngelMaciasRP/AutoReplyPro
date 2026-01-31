from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.main import supabase
from app.services.audit import log_audit
from app.services.observability import log_event

router = APIRouter()


class BackupCreate(BaseModel):
    clinic_id: str
    label: Optional[str] = None
    status: str = "completed"
    storage_url: Optional[str] = None
    size_mb: Optional[float] = None


@router.get("/backups")
def list_backups(clinic_id: str, limit: int = 50):
    try:
        res = (
            supabase.table("backups")
            .select("*")
            .eq("clinic_id", clinic_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"backups": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backups")
def create_backup(payload: BackupCreate):
    try:
        res = supabase.table("backups").insert(payload.dict()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo crear backup")
        created = res.data[0]
        log_audit(
            payload.clinic_id,
            "create_backup",
            "backups",
            created.get("id", ""),
            {"status": created.get("status"), "label": created.get("label")},
        )
        log_event(
            "backup_created",
            {"backup_id": created.get("id"), "status": created.get("status")},
            clinic_id=payload.clinic_id,
        )
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
