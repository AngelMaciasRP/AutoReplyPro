import os  
from supabase import create_client

from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))  

def save_message(message: dict):  
    return supabase.table("messages").insert(message).execute() 