from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.main import supabase

router = APIRouter()


class PlaybookPayload(BaseModel):
    clinic_id: str
    treatment_id: str
    title: str
    description: Optional[str] = None
    steps: List[str] = []
    supplies: List[str] = []
    duration_minutes: Optional[int] = None
    notes_template: Optional[str] = None


@router.get("/playbooks")
def list_playbooks(clinic_id: str, treatment_id: Optional[str] = None):
    try:
        query = supabase.table("treatment_playbooks").select("*").eq("clinic_id", clinic_id)
        if treatment_id:
            query = query.eq("treatment_id", treatment_id)
        res = query.execute()
        return {"playbooks": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/playbooks")
def create_playbook(payload: PlaybookPayload):
    try:
        row = payload.dict()
        res = supabase.table("treatment_playbooks").insert(row).execute()
        return {"playbook": res.data[0] if res.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/playbooks/{playbook_id}")
def update_playbook(playbook_id: str, payload: PlaybookPayload):
    try:
        row = payload.dict()
        res = supabase.table("treatment_playbooks").update(row).eq("id", playbook_id).execute()
        return {"playbook": res.data[0] if res.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/playbooks/{playbook_id}")
def delete_playbook(playbook_id: str):
    try:
        res = supabase.table("treatment_playbooks").delete().eq("id", playbook_id).execute()
        return {"ok": True, "deleted": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
