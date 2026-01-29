from datetime import datetime, timedelta, date
from typing import List, Dict

def _parse_time_hhmm(value: str) -> datetime:
    """
    Convierte 'HH:MM' a datetime (fecha dummy), para operar con timedelta.
    """
    return datetime.strptime(value, "%H:%M")

def generate_slots(start_time: str, end_time: str, duration_minutes: int):
    """
    Genera slots en formato 'HH:MM' desde start_time a end_time,
    avanzando duration_minutes.
    Ej: start=09:00 end=12:00 duration=30 => 09:00,09:30,10:00...
    
    Maneja almuerzo si está configurado.
    """
    if duration_minutes <= 0:
        return []

    start_dt = _parse_time_hhmm(start_time)
    end_dt = _parse_time_hhmm(end_time)

    # Si end <= start, no hay rango válido
    if end_dt <= start_dt:
        return []

    step = timedelta(minutes=duration_minutes)
    slots = []
    current = start_dt

    # Slot válido si entra completo en el rango: current + duration <= end
    while current + step <= end_dt:
        slots.append(current.strftime("%H:%M"))
        current += step

    return slots


def is_date_blocked(
    blocked_dates: List[str],
    blocked_periods: List[Dict],
    check_date: str
) -> bool:
    """
    Verifica si una fecha está bloqueada.
    
    blocked_dates: lista de strings "YYYY-MM-DD"
    blocked_periods: lista de {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}
    check_date: "YYYY-MM-DD"
    """
    # Check directos
    if check_date in blocked_dates:
        return True
    
    # Check en períodos
    check_dt = datetime.strptime(check_date, "%Y-%m-%d")
    for period in blocked_periods:
        start_dt = datetime.strptime(period["start"], "%Y-%m-%d")
        end_dt = datetime.strptime(period["end"], "%Y-%m-%d")
        
        if start_dt <= check_dt <= end_dt:
            return True
    
    return False


def is_work_day(work_days: List[int], check_date: str) -> bool:
    """
    Verifica si una fecha es día de trabajo.
    
    work_days: [0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie]
    check_date: "YYYY-MM-DD"
    """
    dt = datetime.strptime(check_date, "%Y-%m-%d")
    weekday = dt.weekday()  # 0=Lun, 6=Dom
    
    return weekday in work_days


def get_available_dates(
    work_days: List[int],
    blocked_dates: List[str],
    blocked_periods: List[Dict],
    days_ahead: int = 30
) -> List[Dict]:
    """
    Retorna próximas N fechas disponibles.
    
    Returns:
        [
            {"date": "2026-01-27", "day_name": "Lunes", "available": True},
            ...
        ]
    """
    available_dates = []
    current_date = datetime.now()
    
    day_names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    
    for i in range(days_ahead):
        check_date = current_date + timedelta(days=i)
        date_str = check_date.strftime("%Y-%m-%d")
        
        # No incluir fechas pasadas
        if check_date.date() < date.today():
            continue
        
        is_available = (
            is_work_day(work_days, date_str) and
            not is_date_blocked(blocked_dates, blocked_periods, date_str)
        )
        
        available_dates.append({
            "date": date_str,
            "day_name": day_names[check_date.weekday()],
            "available": is_available
        })
    
    return available_dates


def generate_slots_with_lunch(
    start_time: str,
    end_time: str,
    lunch_start: str,
    lunch_end: str,
    duration_minutes: int
) -> List[str]:
    """
    Genera slots excluyendo la hora de almuerzo.
    """
    if not lunch_start or not lunch_end:
        return generate_slots(start_time, end_time, duration_minutes)
    
    # Slots antes de almuerzo
    lunch_start_dt = _parse_time_hhmm(lunch_start)
    morning_slots = []
    
    start_dt = _parse_time_hhmm(start_time)
    step = timedelta(minutes=duration_minutes)
    current = start_dt
    
    while current + step <= lunch_start_dt:
        morning_slots.append(current.strftime("%H:%M"))
        current += step
    
    # Slots después de almuerzo
    lunch_end_dt = _parse_time_hhmm(lunch_end)
    end_dt = _parse_time_hhmm(end_time)
    afternoon_slots = []
    
    current = lunch_end_dt
    while current + step <= end_dt:
        afternoon_slots.append(current.strftime("%H:%M"))
        current += step
    
    return morning_slots + afternoon_slots
