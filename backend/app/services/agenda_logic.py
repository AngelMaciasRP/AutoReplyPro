from typing import Dict, List, Optional
from datetime import datetime, timedelta

from postgrest.exceptions import APIError

from app.main import supabase
from app.services.availability import (
    generate_slots,
    generate_slots_with_lunch,
    get_available_dates,
    is_date_blocked,
    is_work_day,
)


def get_clinic_settings(clinic_id: str) -> Dict:
    """Get clinic settings or empty dict."""
    try:
        settings = (
            supabase.table("clinic_settings")
            .select("*")
            .eq("clinic_id", clinic_id)
            .single()
            .execute()
        )
    except APIError as exc:
        if exc.code == "PGRST116":
            return {}
        raise

    return settings.data if settings.data else {}


def _get_max_per_slot(settings: Dict, allow_overbooking: bool) -> int:
    if not allow_overbooking:
        return 1
    return int(settings.get("max_appointments_per_slot", 2) or 2)


def get_available_slots(
    clinic_id: str,
    date: str,
    treatment_id: str,
    allow_double_booking: bool = False,
) -> List[str]:
    """
    Return available slots for a date/treatment.

    If allow_double_booking is True, allow multiple appointments per slot
    up to clinic_settings.max_appointments_per_slot.
    """
    settings = get_clinic_settings(clinic_id)
    if not settings:
        return []

    blocked_dates = settings.get("blocked_dates", [])
    blocked_periods = settings.get("blocked_periods", [])
    if is_date_blocked(blocked_dates, blocked_periods, date):
        return []

    work_days = settings.get("work_days", [0, 1, 2, 3, 4])
    if not is_work_day(work_days, date):
        return []

    try:
        treatment = (
            supabase.table("treatments")
            .select("duration_minutes")
            .eq("id", treatment_id)
            .single()
            .execute()
        )
    except APIError as exc:
        if exc.code == "PGRST116":
            return []
        raise
    if not treatment.data:
        return []

    duration = treatment.data["duration_minutes"]

    lunch_start = settings.get("lunch_start")
    lunch_end = settings.get("lunch_end")

    if lunch_start and lunch_end:
        all_slots = generate_slots_with_lunch(
            settings["open_time"],
            settings["close_time"],
            lunch_start,
            lunch_end,
            duration,
        )
    else:
        all_slots = generate_slots(
            settings["open_time"],
            settings["close_time"],
            duration,
        )

    appointments = (
        supabase.table("appointments")
        .select("start_time,status")
        .eq("clinic_id", clinic_id)
        .eq("date", date)
        .execute()
    )

    busy_slots = [
        a["start_time"]
        for a in (appointments.data or [])
        if a.get("status") != "cancelled"
    ]
    allow_overbooking = allow_double_booking or settings.get("allow_double_booking", False)
    max_per_slot = _get_max_per_slot(settings, allow_overbooking)

    slot_counts: Dict[str, int] = {}
    for slot in busy_slots:
        slot_counts[slot] = slot_counts.get(slot, 0) + 1

    available = [slot for slot in all_slots if slot_counts.get(slot, 0) < max_per_slot]
    return available


def get_available_dates_for_clinic(
    clinic_id: str,
    treatment_id: str,
    days_ahead: int = 30,
) -> List[Dict]:
    """Return upcoming dates with slot counts."""
    settings = get_clinic_settings(clinic_id)
    if not settings:
        return []

    work_days = settings.get("work_days", [0, 1, 2, 3, 4])
    blocked_dates = settings.get("blocked_dates", [])
    blocked_periods = settings.get("blocked_periods", [])

    available = get_available_dates(work_days, blocked_dates, blocked_periods, days_ahead)

    for date_info in available:
        if date_info["available"]:
            slots = get_available_slots(
                clinic_id,
                date_info["date"],
                treatment_id,
                allow_double_booking=settings.get("allow_double_booking", False),
            )
            date_info["available_slots_count"] = len(slots)
        else:
            date_info["available_slots_count"] = 0

    return available


def create_appointment(
    clinic_id: str,
    patient_name: str,
    patient_phone: str,
    date: str,
    start_time: str,
    treatment_id: str,
    allow_double_booking: bool = False,
    patient_id: Optional[str] = None,
) -> Dict:
    """Create appointment with validation."""
    settings = get_clinic_settings(clinic_id)
    if not settings:
        return {"error": "Clinica no encontrada"}

    if not patient_id:
        patient_lookup = (
            supabase.table("patients")
            .select("id")
            .eq("clinic_id", clinic_id)
            .eq("full_name", patient_name)
            .limit(1)
            .execute()
        )
        if not patient_lookup.data:
            return {"error": "Paciente no registrado"}
        patient_id = patient_lookup.data[0]["id"]

    allow_overbooking = allow_double_booking or settings.get("allow_double_booking", False)
    available = get_available_slots(
        clinic_id,
        date,
        treatment_id,
        allow_double_booking=allow_overbooking,
    )
    if start_time not in available:
        return {"error": "Horario no disponible"}

    max_appointments = settings.get("max_appointments_per_day", 20)
    today_appointments = (
        supabase.table("appointments")
        .select("id")
        .eq("clinic_id", clinic_id)
        .eq("date", date)
        .execute()
    )
    if len(today_appointments.data or []) >= max_appointments:
        return {"error": "Limite de turnos por dia alcanzado"}

    try:
        treatment = (
            supabase.table("treatments")
            .select("duration_minutes, base_price")
            .eq("id", treatment_id)
            .single()
            .execute()
        )
    except APIError as exc:
        if exc.code == "PGRST116":
            return {"error": "Tratamiento no registrado"}
        raise
    if not treatment.data:
        return {"error": "Tratamiento no registrado"}
    duration = treatment.data["duration_minutes"] if treatment.data else 30
    base_price = treatment.data.get("base_price", 0) if treatment.data else 0

    start_dt = datetime.strptime(start_time, "%H:%M")
    end_dt = start_dt + timedelta(minutes=duration)
    end_time = end_dt.strftime("%H:%M")

    existing_at_slot = (
        supabase.table("appointments")
        .select("id")
        .eq("clinic_id", clinic_id)
        .eq("date", date)
        .eq("start_time", start_time)
        .execute()
    )

    already_count = len(existing_at_slot.data or [])
    max_per_slot = _get_max_per_slot(settings, allow_overbooking)
    is_overbooked = allow_overbooking and already_count > 0 and already_count < max_per_slot

    extra_fee = 0
    if is_overbooked:
        fee_value = settings.get("overbooking_extra_fee", 0) or 0
        fee_type = settings.get("overbooking_fee_type", "fixed")
        if fee_type == "percent":
            extra_fee = round((base_price or 0) * float(fee_value) / 100, 2)
        else:
            extra_fee = float(fee_value)

    result = (
        supabase.table("appointments")
        .insert(
            {
                "clinic_id": clinic_id,
                "patient_id": patient_id,
                "patient_name": patient_name,
                "patient_phone": patient_phone,
                "date": date,
                "start_time": start_time,
                "end_time": end_time,
                "treatment_id": treatment_id,
                "double_booked": is_overbooked,
                "overbooked": is_overbooked,
                "extra_fee": extra_fee,
                "status": "pending",
                "confirmation_required": settings.get("confirmation_required", True),
            }
        )
        .execute()
    )

    if result.data:
        return {"success": True, "appointment": result.data[0]}

    return {"error": "No se pudo crear el turno"}


def reschedule_appointment(
    appointment_id: str,
    new_date: str,
    new_time: str,
) -> Dict:
    """Reschedule appointment."""
    apt = (
        supabase.table("appointments")
        .select("*")
        .eq("id", appointment_id)
        .single()
        .execute()
    )
    if not apt.data:
        return {"error": "Turno no encontrado"}

    clinic_id = apt.data.get("clinic_id")
    settings = get_clinic_settings(clinic_id)
    available = get_available_slots(
        clinic_id,
        new_date,
        apt.data["treatment_id"],
        allow_double_booking=settings.get("allow_double_booking", False),
    )
    if new_time not in available:
        return {"error": "Nuevo horario no disponible"}

    result = (
        supabase.table("appointments")
        .update({"date": new_date, "start_time": new_time, "status": "pending"})
        .eq("id", appointment_id)
        .execute()
    )

    if result.data:
        return {"success": True, "appointment": result.data[0]}

    return {"error": "No se pudo reagendar"}
