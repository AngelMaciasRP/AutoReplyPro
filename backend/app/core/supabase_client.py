import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Ruta del .env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("❌ ERROR: SUPABASE_URL o SUPABASE_KEY faltan en el .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
