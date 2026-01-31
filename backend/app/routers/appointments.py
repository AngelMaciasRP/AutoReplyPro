from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.agenda_logic import (
    create_appointment,
    reschedule_appointment,
    get_available_slots
)
from app.main import supabase
from app.services.realtime import broadcast_change
from app.services.automation_runner import run_automations_for_appointment

router = APIRouter()

class AppointmentCreate(BaseModel):
    clinic_id: str
    patient_id: Optional[str] = None
    patient_name: str
    patient_phone: str
    date: str
    start_time: str
    treatment_id: str
    allow_double_booking: bool = False


class AppointmentReschedule(BaseModel):
    appointment_id: str
    new_date: str
    new_time: str


class AppointmentConfirm(BaseModel):
    appointment_id: str


class AppointmentCancel(BaseModel):
    appointment_id: str
    reason: str = None


@router.post("/appointments")
def create_appointment_route(data: AppointmentCreate):
    """Crear un nuevo turno"""
    try:
        result = create_appointment(
            clinic_id=data.clinic_id,
            patient_id=data.patient_id,
            patient_name=data.patient_name,
            patient_phone=data.patient_phone,
            date=data.date,
            start_time=data.start_time,
            treatment_id=data.treatment_id,
            allow_double_booking=data.allow_double_booking
        )
        if result and isinstance(result, dict):
            appointment = result.get("appointment") or result
            if isinstance(appointment, dict):
                broadcast_change(
                    data.clinic_id,
                    "appointment_created",
                    {
                        "appointment_id": appointment.get("id"),
                        "date": appointment.get("date"),
                        "start_time": appointment.get("start_time"),
                    },
                )
                run_automations_for_appointment("appointment_created", appointment)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/appointments/{appointment_id}/reschedule")
def reschedule_appointment_route(
    appointment_id: str,
    data: AppointmentReschedule
):
    """Reagendar un turno a nueva fecha/hora"""
    try:
        result = reschedule_appointment(
            appointment_id=appointment_id,
            new_date=data.new_date,
            new_time=data.new_time
        )
        if result and isinstance(result, dict):
            appointment = result.get("appointment") or result
            if isinstance(appointment, dict):
                broadcast_change(
                    appointment.get("clinic_id", ""),
                    "appointment_rescheduled",
                    {
                        "appointment_id": appointment_id,
                        "date": appointment.get("date"),
                        "start_time": appointment.get("start_time"),
                    },
                )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/appointments/{appointment_id}/confirm")
def confirm_appointment_route(appointment_id: str):
    """Confirmar un turno pendiente"""
    try:
        result = supabase.table("appointments") \
            .update({"status": "confirmed"}) \
            .eq("id", appointment_id) \
            .execute()
        
        if result.data:
            broadcast_change(
                result.data[0].get("clinic_id", ""),
                "appointment_confirmed",
                {"appointment_id": appointment_id},
            )
            run_automations_for_appointment("appointment_confirmed", result.data[0])
            return {"success": True, "appointment": result.data[0]}
        
        return {"error": "Turno no encontrado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/appointments/{appointment_id}")
def cancel_appointment_route(appointment_id: str, reason: str = None):
    """Cancelar un turno"""
    try:
        result = supabase.table("appointments") \
            .update({
                "status": "cancelled",
                "cancellation_reason": reason
            }) \
            .eq("id", appointment_id) \
            .execute()
        
        if result.data:
            broadcast_change(
                result.data[0].get("clinic_id", ""),
                "appointment_cancelled",
                {"appointment_id": appointment_id},
            )
            run_automations_for_appointment("appointment_cancelled", result.data[0])
            return {"success": True, "message": "Turno cancelado"}
        
        return {"error": "Turno no encontrado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/appointments")
def list_appointments(clinic_id: str, date: str = None, status: str = None):
    """Listar turnos de una clínica"""
    try:
        query = supabase.table("appointments") \
            .select("*") \
            .eq("clinic_id", clinic_id)
        
        if date:
            query = query.eq("date", date)
        
        if status:
            query = query.eq("status", status)
        
        result = query.execute()
        return {"appointments": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/appointments/{appointment_id}")
def get_appointment_detail(appointment_id: str):
    """Obtener detalles de un turno"""
    try:
        result = supabase.table("appointments") \
            .select("*") \
            .eq("id", appointment_id) \
            .single() \
            .execute()
        
        if result.data:
            return result.data
        
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/appointments/{appointment_id}/history")
def get_appointment_history(appointment_id: str, clinic_id: str):
    """Obtener historial de cambios de un turno"""
    try:
        result = supabase.table("appointment_changes") \
            .select("*") \
            .eq("appointment_id", appointment_id) \
            .eq("clinic_id", clinic_id) \
            .order("changed_at", desc=True) \
            .execute()

        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
