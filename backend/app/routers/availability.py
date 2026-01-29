from fastapi import APIRouter, HTTPException, Query
from app.services.agenda_logic import (
    get_available_slots,
    get_available_dates_for_clinic,
    get_clinic_settings
)

router = APIRouter()

@router.get("/availability/slots")
def availability_slots(
    clinic_id: str = Query(...),
    date: str = Query(..., description="YYYY-MM-DD"),
    treatment_id: str = Query(...),
    allow_double: bool = Query(False)
):
    """
    Devuelve slots disponibles para una clínica, fecha y tratamiento.
    
    allow_double: Si True, permite double booking (2 turnos en mismo horario)
    """
    try:
        slots = get_available_slots(
            clinic_id=clinic_id,
            date=date,
            treatment_id=treatment_id,
            allow_double_booking=allow_double
        )
        return {
            "date": date,
            "available_slots": slots,
            "total_available": len(slots)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando slots: {str(e)}")


@router.get("/availability/dates")
def availability_dates(
    clinic_id: str = Query(...),
    treatment_id: str = Query(...),
    days_ahead: int = Query(30)
):
    """
    Devuelve próximas N fechas disponibles con cantidad de slots.
    """
    try:
        dates = get_available_dates_for_clinic(
            clinic_id=clinic_id,
            treatment_id=treatment_id,
            days_ahead=days_ahead
        )
        
        available_only = [d for d in dates if d["available"]]
        
        return {
            "clinic_id": clinic_id,
            "treatment_id": treatment_id,
            "dates": available_only,
            "total_available_dates": len(available_only)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/availability/summary")
def availability_summary(clinic_id: str = Query(...)):
    """
    Resumen de configuración de disponibilidad de la clínica.
    """
    try:
        settings = get_clinic_settings(clinic_id)
        
        if not settings:
            raise HTTPException(status_code=404, detail="Clínica no encontrada")
        
        return {
            "clinic_id": clinic_id,
            "work_hours": {
                "open": settings.get("open_time"),
                "close": settings.get("close_time"),
                "lunch_start": settings.get("lunch_start"),
                "lunch_end": settings.get("lunch_end")
            },
            "work_days": settings.get("work_days", [0, 1, 2, 3, 4]),
            "slot_duration": settings.get("slot_minutes", 30),
            "max_appointments_per_day": settings.get("max_appointments_per_day", 20),
            "max_appointments_per_slot": settings.get("max_appointments_per_slot", 1),
            "double_booking_enabled": settings.get("allow_double_booking", False),
            "overbooking_extra_fee": settings.get("overbooking_extra_fee", 0),
            "overbooking_fee_type": settings.get("overbooking_fee_type", "fixed"),
            "blocked_dates_count": len(settings.get("blocked_dates", [])),
            "blocked_periods_count": len(settings.get("blocked_periods", []))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
