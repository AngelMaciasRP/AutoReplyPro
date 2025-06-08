import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Gemini cfg
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")

def generate_response(prompt: str) -> str:
    try:
        response = model.generate_content(
            f"Responde como asistente profesional de un restaurante, ESTE ES EL MENU https://www.mcdonalds.com.ar/menu envíar el catalogo por mensaje escrito y evitar envíar la url que incluya el precio. Mensaje del cliente: {prompt}"
            )
        return response.text
    except Exception as e:
        return f" Error: {str(e)}"

