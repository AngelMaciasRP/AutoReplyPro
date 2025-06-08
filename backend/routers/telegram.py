from fastapi import APIRouter, Request
from services.supabase_client import save_message
from services.gemini_service import generate_response
import requests
import os

router = APIRouter(prefix="/telegram", tags=["Telegram"])

@router.post("/webhook")
async def handle_webhook(request: Request):
    data = await request.json()
    message = data.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    user_text = message.get("text", "")

    # Guardar mensajes en Supabase
    save_message({
        "content": message.get("text", ""),
        "platform": "telegram"
    })

    # Generar respuesta con Gemini
    ai_response = generate_response(user_text)

    # Envía respuesta al usuario
    requests.post(
        f"https://api.telegram.org/bot{os.getenv('TELEGRAM_TOKEN')}/sendMessage",
        json={"chat_id": chat_id, "text": ai_response},
    )

    return {"status": "ok"}

