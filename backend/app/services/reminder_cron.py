import asyncio
from datetime import datetime, timedelta
from app.supabase_client import get_supabase_client

supabase = get_supabase_client()

async def reminder_loop():
    while True:
        now = datetime.utcnow()
        res = supabase.table("appointments") \
            .select("*") \
            .eq("reminder_sent", False) \
            .execute()

        for ap in res.data:
            if datetime.fromisoformat(ap["starts_at"]) - now < timedelta(hours=24):
                supabase.table("appointments") \
                    .update({"reminder_sent": True}) \
                    .eq("id", ap["id"]) \
                    .execute()

        await asyncio.sleep(60)
