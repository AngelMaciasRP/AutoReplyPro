# app/routers/settings.py
from fastapi import APIRouter, HTTPException
from supabase import create_client
import os

router = APIRouter(prefix="/api/settings", tags=["settings"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


@router.get("/{clinic_id}")
def get_settings(clinic_id: str):
    res = supabase.table("settings").select("*").eq("clinic_id", clinic_id).execute()
    rows = res.data or []
    out = {}
    for r in rows:
        out[r["key"]] = r.get("value_json") if r.get("value_json") is not None else r.get("value")
    return out


@router.post("/{clinic_id}")
def upsert_setting(clinic_id: str, payload: dict):
    # payload: { key: "...", value: "..." } or { key: "...", value_json: {...} }
    key = payload.get("key")
    if not key:
        raise HTTPException(status_code=400, detail="key required")
    row = {
        "clinic_id": clinic_id,
        "key": key,
        "value": payload.get("value"),
        "value_json": payload.get("value_json")
    }
    res = supabase.table("settings").upsert(row, on_conflict=["clinic_id", "key"]).execute()
    return res.data
