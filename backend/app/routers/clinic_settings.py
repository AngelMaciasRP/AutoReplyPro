from fastapi import APIRouter, Request, HTTPException
from postgrest.exceptions import APIError
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, date

router = APIRouter()

def supabase(req: Request):
    return req.app.state.supabase


# =========================
# MODELOS DE CONFIGURACIÓN
# =========================

class BlockedPeriod(BaseModel):
    start: str  # "2026-02-01"
    end: str    # "2026-02-10"
    reason: Optional[str] = None  # "Vacaciones", "Mantenimiento", etc.


class ClinicSettings(BaseModel):
    # Básico
    name: Optional[str] = "Mi Clínica"
    language: str = "es"  # es | en
    timezone: str = "America/Argentina/Buenos_Aires"
    
    # Horarios
    open_time: str = "09:00"
    close_time: str = "18:00"
    lunch_start: Optional[str] = None  # "12:00"
    lunch_end: Optional[str] = None    # "13:00"
    
    # Calendario
    work_days: List[int] = Field(default=[0, 1, 2, 3, 4])  # [0=Lun, 1=Mar, ..., 4=Vie]
    blocked_dates: List[str] = Field(default=[])  # ["2026-01-31", ...]
    blocked_periods: List[BlockedPeriod] = Field(default=[])  # Períodos bloqueados
    
    # Turnos
    slot_minutes: int = 30
    max_appointments_per_day: int = 20
    buffer_between_appointments: int = 0  # minutos de buffer
    max_appointments_per_slot: int = 2
    overbooking_extra_fee: float = 0
    overbooking_fee_type: str = "fixed"  # fixed | percent
    
    # WhatsApp
    bot_enabled: bool = True
    manual_mode: bool = False
    auto_reply_enabled: bool = True
    
    # Confirmación
    confirmation_required: bool = True
    reminder_24h: bool = True
    reminder_6h: bool = False
    
    # Double booking
    allow_double_booking: bool = False
    double_booking_price_factor: float = 1.5


# =========================
# GET CONFIGURACIÓN
# =========================
@router.get("/clinic-settings/{clinic_id}")
def get_settings(clinic_id: str, req: Request):
    if clinic_id == "default":
        raise HTTPException(status_code=400, detail="clinic_id inválido")

    sb = supabase(req)

    try:
        res = sb.table("clinic_settings") \
            .select("*") \
            .eq("clinic_id", clinic_id) \
            .single() \
            .execute()
    except APIError as e:
        if e.code == "PGRST116":
            res = None
        else:
            raise

    # Si no existe → crear defaults
    if not res or not res.data:
        defaults = ClinicSettings()
        ins = sb.table("clinic_settings").insert({
            "clinic_id": clinic_id,
            **defaults.dict()
        }).execute()

        if not ins.data:
            raise HTTPException(status_code=500, detail="Error creando settings")
        return ins.data[0]

    return res.data


# =========================
# UPDATE CONFIGURACIÓN COMPLETA
# =========================
@router.put("/clinic-settings/{clinic_id}")
def update_settings(
    clinic_id: str,
    payload: ClinicSettings,
    req: Request
):
    sb = supabase(req)

    res = sb.table("clinic_settings") \
        .update(payload.dict(exclude_unset=False)) \
        .eq("clinic_id", clinic_id) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="No se pudo actualizar")

    return res.data[0]


# =========================
# GESTIÓN DE FECHAS BLOQUEADAS
# =========================

@router.post("/clinic-settings/{clinic_id}/blocked-dates")
def add_blocked_dates(
    clinic_id: str,
    payload: dict,  # {"dates": ["2026-01-31", "2026-02-01"]}
    req: Request
):
    """Agregar fechas específicas bloqueadas"""
    sb = supabase(req)
    
    settings = sb.table("clinic_settings") \
        .select("blocked_dates") \
        .eq("clinic_id", clinic_id) \
        .single() \
        .execute()
    
    current_blocked = settings.data.get("blocked_dates", []) if settings.data else []
    new_dates = payload.get("dates", [])
    
    # Merge sin duplicados
    merged = list(set(current_blocked + new_dates))
    
    result = sb.table("clinic_settings") \
        .update({"blocked_dates": merged}) \
        .eq("clinic_id", clinic_id) \
        .execute()
    
    return {"blocked_dates": merged}


@router.delete("/clinic-settings/{clinic_id}/blocked-dates/{blocked_date}")
def remove_blocked_date(
    clinic_id: str,
    blocked_date: str,
    req: Request
):
    """Remover una fecha bloqueada"""
    sb = supabase(req)
    
    settings = sb.table("clinic_settings") \
        .select("blocked_dates") \
        .eq("clinic_id", clinic_id) \
        .single() \
        .execute()
    
    current_blocked = settings.data.get("blocked_dates", []) if settings.data else []
    updated = [d for d in current_blocked if d != blocked_date]
    
    result = sb.table("clinic_settings") \
        .update({"blocked_dates": updated}) \
        .eq("clinic_id", clinic_id) \
        .execute()
    
    return {"blocked_dates": updated}


@router.post("/clinic-settings/{clinic_id}/blocked-periods")
def add_blocked_period(
    clinic_id: str,
    payload: BlockedPeriod,
    req: Request
):
    """Agregar período bloqueado (ej: vacaciones)"""
    sb = supabase(req)
    
    settings = sb.table("clinic_settings") \
        .select("blocked_periods") \
        .eq("clinic_id", clinic_id) \
        .single() \
        .execute()
    
    current_periods = settings.data.get("blocked_periods", []) if settings.data else []
    current_periods.append(payload.dict())
    
    result = sb.table("clinic_settings") \
        .update({"blocked_periods": current_periods}) \
        .eq("clinic_id", clinic_id) \
        .execute()
    
    return {"blocked_periods": current_periods}


@router.delete("/clinic-settings/{clinic_id}/blocked-periods/{period_id}")
def remove_blocked_period(
    clinic_id: str,
    period_id: int,
    req: Request
):
    """Remover un período bloqueado"""
    sb = supabase(req)
    
    settings = sb.table("clinic_settings") \
        .select("blocked_periods") \
        .eq("clinic_id", clinic_id) \
        .single() \
        .execute()
    
    current_periods = settings.data.get("blocked_periods", []) if settings.data else []
    updated = [p for i, p in enumerate(current_periods) if i != period_id]
    
    result = sb.table("clinic_settings") \
        .update({"blocked_periods": updated}) \
        .eq("clinic_id", clinic_id) \
        .execute()
    
    return {"blocked_periods": updated}


@router.get("/clinic-settings/{clinic_id}/blocked-dates")
def get_blocked_dates(clinic_id: str, req: Request):
    """Obtener todas las fechas y períodos bloqueados"""
    sb = supabase(req)
    
    settings = sb.table("clinic_settings") \
        .select("blocked_dates, blocked_periods") \
        .eq("clinic_id", clinic_id) \
        .single() \
        .execute()
    
    if not settings.data:
        return {"blocked_dates": [], "blocked_periods": []}
    
    return {
        "blocked_dates": settings.data.get("blocked_dates", []),
        "blocked_periods": settings.data.get("blocked_periods", [])
    }