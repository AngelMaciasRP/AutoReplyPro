import os
import requests
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
MODEL = "deepseek-chat"  # Verifica el nombre del modelo en la documentación

async def generate_response(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {os.getenv('DEEPSEEK_API_KEY')}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    payload = {
        "model": MODEL,
        "messages":[
            {"role": "user",
            "content": prompt}
            ],
        "temperature": 0.7,
        "max_tokens": 150,
        "stream": False
    }

    try:
        response = requests.post(DEEPSEEK_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except requests.exceptions.HTTPError as e:
        return f"Error de API: {e.response.text}"
    except Exception as e:
        return f"Error: {str(e)}"
