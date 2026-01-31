import os
from fastapi import APIRouter, HTTPException, Request
from app.main import supabase
from app.services.ai_scheduler import build_ai_reply
from app.services.alerts_sender import send_whatsapp

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

        clinic_id = payload.get("clinic_id") or os.getenv("DEFAULT_CLINIC_ID")
        if not clinic_id:
            first = supabase.table("clinic_settings").select("clinic_id").limit(1).execute()
            clinic_id = first.data[0]["clinic_id"] if first.data else None

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

        # auto-reply with AI if enabled
        settings = (
            supabase.table("clinic_settings")
            .select("bot_enabled,auto_reply_enabled")
            .eq("clinic_id", clinic_id)
            .single()
            .execute()
        )
        if settings.data and settings.data.get("bot_enabled") and settings.data.get("auto_reply_enabled"):
            reply = build_ai_reply(clinic_id, text, wa_number)
            if reply:
                send_whatsapp(wa_number, reply)

        return {"ok": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
