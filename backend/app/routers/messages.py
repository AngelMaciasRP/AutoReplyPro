from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.main import supabase

router = APIRouter()


class ThreadCreate(BaseModel):
    clinic_id: str
    contact_number: str
    contact_name: Optional[str] = None
    patient_id: Optional[str] = None
    channel: str = "whatsapp"


class MessageCreate(BaseModel):
    clinic_id: str
    direction: str
    body: str


@router.get("/messages/threads")
def list_threads(clinic_id: str, limit: int = 50):
    try:
        res = (
            supabase.table("message_threads")
            .select("*")
            .eq("clinic_id", clinic_id)
            .order("last_message_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"threads": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/threads")
def create_thread(payload: ThreadCreate):
    try:
        res = supabase.table("message_threads").insert(
            {
                "clinic_id": payload.clinic_id,
                "contact_number": payload.contact_number,
                "contact_name": payload.contact_name,
                "patient_id": payload.patient_id,
                "channel": payload.channel,
            }
        ).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo crear el hilo")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages/threads/{thread_id}")
def list_messages(thread_id: str):
    try:
        res = (
            supabase.table("messages")
            .select("*")
            .eq("thread_id", thread_id)
            .order("created_at", desc=False)
            .execute()
        )
        return {"messages": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/threads/{thread_id}/messages")
def create_message(thread_id: str, payload: MessageCreate):
    try:
        res = supabase.table("messages").insert(
            {
                "clinic_id": payload.clinic_id,
                "thread_id": thread_id,
                "direction": payload.direction,
                "body": payload.body,
                "status": "sent",
            }
        ).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo crear el mensaje")

        supabase.table("message_threads").update(
            {"last_message_at": "now()"}
        ).eq("id", thread_id).execute()

        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
