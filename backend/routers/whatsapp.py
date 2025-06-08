from fastapi import APIRouter, Request, Depends, Query
from services.supabase_client import save_message  
from services.gemini_service import generate_response  
import requests  
import os  

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])  

# Verificación inicial del webhook (requerido por Meta)  
@router.get("/webhook")  
async def verify_webhook(  
    hub_mode: str = Query(..., alias="hub.mode"),  
    hub_verify_token: str = Query(..., alias="hub.verify_token"),  
    hub_challenge: str = Query(..., alias="hub.challenge")  
):  
    if hub_mode == "subscribe" and hub_verify_token == os.getenv("WA_VERIFY_TOKEN"):  
        return int(hub_challenge)  
    return {"status": "error", "message": "Verificación fallida"}  

# Manejar mensajes entrantes  
@router.post("/webhook")
async def handle_webhook(request: Request):
    data = await request.json()
    print("Datos recibidos:", data)  # Agrega esto para depuración
    
    # Extracción correcta del mensaje
    try:
        message = data["entry"][0]["changes"][0]["value"]["messages"][0]
        user_number = message["from"]
        user_text = message["text"]["body"]
    except (KeyError, IndexError) as e:
        print("Error al parsear mensaje:", e)
        return {"status": "ok"}

    # Guardar mensaje en Supabase  
    save_message({"content": user_text, "platform": "whatsapp"})  

    # Generar respuesta  
    ai_response = generate_response(user_text)  

    # Enviar respuesta  
    response = requests.post(
        f"https://graph.facebook.com/v18.0/{os.getenv('WHATSAPP_PHONE_ID')}/messages",
        headers={
            "Authorization": f"Bearer {os.getenv('WHATSAPP_TOKEN')}",
            "Content-Type": "application/json"
        },
        json={
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": user_number,
            "type": "text",
            "text": {
                "body": ai_response,
                "preview_url": False  # ✅ Campo crítico
            }
        }
    )  

    print("Respuesta de Meta API:", response.json())