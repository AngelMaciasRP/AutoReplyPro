from app.core.supabase_client import supabase

# Nombre correcto de la tabla en Supabase
TABLE_NAME = "odontology_messages"

def guardar_mensaje(phone: str, direction: str, message: str, raw=None):
    data = {
        "phone": phone,
        "direction": direction,
        "message": message,
        "raw": raw
    }

    # Insertar en la tabla correcta
    return supabase.table(TABLE_NAME).insert(data).execute()
