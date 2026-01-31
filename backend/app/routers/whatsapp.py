import os
from fastapi import APIRouter, HTTPException, Request
from app.main import supabase

router = APIRouter()

@router.get("/webhook")
async def whatsapp_verify(request: Request):
    """Meta webhook verification (GET)."""
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    verify_token = os.getenv("VERIFY_TOKEN", "")
    if mode == "subscribe" and token == verify_token:
        return int(challenge) if challenge is not None else ""
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def whatsapp_webhook(payload: dict):
    try:
        entry = payload["entry"][0]
        changes = entry["changes"][0]
        value = changes["value"]
        message = value["messages"][0]

        wa_number = message["from"]
        text = message["text"]["body"]

        clinic_id = payload.get("clinic_id")

        # create/find thread
        thread = (
            supabase.table("message_threads")
            .select("*")
            .eq("clinic_id", clinic_id)
            .eq("contact_number", wa_number)
            .limit(1)
            .execute()
        )
        if thread.data:
            thread_id = thread.data[0]["id"]
        else:
            created = (
                supabase.table("message_threads")
                .insert(
                    {
                        "clinic_id": clinic_id,
                        "contact_number": wa_number,
                        "contact_name": "",
                        "channel": "whatsapp",
                    }
                )
                .execute()
            )
            thread_id = created.data[0]["id"] if created.data else None

        if thread_id:
            supabase.table("messages").insert(
                {
                    "clinic_id": clinic_id,
                    "thread_id": thread_id,
                    "direction": "in",
                    "body": text,
                    "status": "received",
                }
            ).execute()

        return {"ok": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
