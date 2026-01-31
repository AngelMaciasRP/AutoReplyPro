from typing import Any, Dict, Optional
from app.main import supabase


def _render_template(template: str, data: Dict[str, Any]) -> str:
    result = template
    for key, value in data.items():
        result = result.replace(f"{{{{{key}}}}}", str(value))
    return result


def _get_treatment_name(treatment_id: Optional[str]) -> str:
    if not treatment_id:
        return ""
    res = (
        supabase.table("treatments")
        .select("name")
        .eq("id", treatment_id)
        .single()
        .execute()
    )
    return res.data.get("name") if res.data else ""


def _get_patient_contact(clinic_id: str, patient_id: Optional[str], patient_name: str):
    if not patient_id:
        return {"contact_name": patient_name, "contact_number": ""}
    res = (
        supabase.table("patients")
        .select("full_name,phone")
        .eq("clinic_id", clinic_id)
        .eq("id", patient_id)
        .single()
        .execute()
    )
    if res.data:
        return {
            "contact_name": res.data.get("full_name") or patient_name,
            "contact_number": res.data.get("phone") or "",
        }
    return {"contact_name": patient_name, "contact_number": ""}


def _ensure_thread(clinic_id: str, patient_id: Optional[str], contact_number: str, contact_name: str):
    query = supabase.table("message_threads").select("*").eq("clinic_id", clinic_id)
    if patient_id:
        query = query.eq("patient_id", patient_id)
    elif contact_number:
        query = query.eq("contact_number", contact_number)
    thread_res = query.limit(1).execute()
    if thread_res.data:
        return thread_res.data[0]

    created = (
        supabase.table("message_threads")
        .insert(
            {
                "clinic_id": clinic_id,
                "patient_id": patient_id,
                "contact_number": contact_number or "",
                "contact_name": contact_name,
                "channel": "whatsapp",
            }
        )
        .execute()
    )
    return created.data[0] if created.data else None


def _create_message(clinic_id: str, thread_id: str, body: str):
    res = (
        supabase.table("messages")
        .insert(
            {
                "clinic_id": clinic_id,
                "thread_id": thread_id,
                "direction": "out",
                "body": body,
                "status": "sent",
            }
        )
        .execute()
    )
    return res.data[0] if res.data else None


def run_automations_for_appointment(trigger: str, appointment: Dict[str, Any]):
    clinic_id = appointment.get("clinic_id")
    if not clinic_id:
        return []

    rules = (
        supabase.table("automation_rules")
        .select("*")
        .eq("clinic_id", clinic_id)
        .eq("trigger", trigger)
        .eq("enabled", True)
        .execute()
    )
    rules_list = rules.data or []

    treatment_name = _get_treatment_name(appointment.get("treatment_id"))
    contact = _get_patient_contact(
        clinic_id,
        appointment.get("patient_id"),
        appointment.get("patient_name", ""),
    )

    context = {
        "patient_name": appointment.get("patient_name", ""),
        "date": appointment.get("date", ""),
        "time": appointment.get("start_time", ""),
        "treatment": treatment_name,
        "clinic_id": clinic_id,
    }

    created_messages = []
    for rule in rules_list:
        body = _render_template(rule.get("template", ""), context)
        thread = _ensure_thread(
            clinic_id,
            appointment.get("patient_id"),
            contact.get("contact_number", ""),
            contact.get("contact_name", appointment.get("patient_name", "")),
        )
        if not thread:
            continue
        msg = _create_message(clinic_id, thread["id"], body)
        if msg:
            created_messages.append(msg)

    return created_messages


def run_automations_for_date(clinic_id: str, trigger: str, date: str):
    appointments = (
        supabase.table("appointments")
        .select("*")
        .eq("clinic_id", clinic_id)
        .eq("date", date)
        .eq("status", "pending")
        .execute()
    )
    created = []
    for apt in appointments.data or []:
        created.extend(run_automations_for_appointment(trigger, apt))
    return created
