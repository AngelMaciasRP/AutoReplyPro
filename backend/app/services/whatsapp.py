from fastapi import APIRouter, HTTPException
from app.main import supabase

router = APIRouter()

@router.post("/webhook")
async def whatsapp_webhook(payload: dict):
    try:
        entry = payload["entry"][0]
        changes = entry["changes"][0]
        value = changes["value"]
        message = value["messages"][0]

        wa_number = message["from"]
        text = message["text"]["body"]

        supabase.table("messages").insert({
            "clinic_id": payload.get("clinic_id"),
            "direction": "in",
            "body": text
        }).execute()

        return {"ok": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
