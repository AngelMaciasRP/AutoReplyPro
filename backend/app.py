from fastapi import FastAPI, HTTPException

#supabase
from models.message_model import Message 
from services.supabase_client import save_message  

#telegram
from routers.telegram import router as telegram_router

#whatsapp
from routers.whatsapp import router as whatsapp_router

app = FastAPI()  

@app.get("/")
def home():
    return {"status": "API AutoReplyPro funcionando"}

@app.post("/message")                       #--------> SUPABASE AUTOGUARDADO DE MENSAJERIA
async def create_message(message: Message):  
    try:
        response = save_message(message.dict())  
        return {"status": "Éxito", "data": response.data}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor : {str(e)}"
        )
    

# APLICACIONES
app.include_router(telegram_router)
app.include_router(whatsapp_router)