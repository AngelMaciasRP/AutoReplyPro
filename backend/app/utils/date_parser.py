import dateparser
from datetime import datetime, time

def parse_natural_date(text: str):
    """
    Devuelve (date, time)
    - date = objeto date()
    - time = objeto time()
    """

    parsed = dateparser.parse(
        text,
        settings={
            "PREFER_DATES_FROM": "future",
            "TIMEZONE": "America/Argentina/Buenos_Aires",
            "RETURN_AS_TIMEZONE_AWARE": False   # <- CLAVE
        }
    )

    if not parsed:
        return None, None

    date = parsed.date()

    # si el usuario escribió “viernes” sin hora → no podemos seguir
    if parsed.hour == 0 and parsed.minute == 0 and "0" not in text:
        return date, None

    return date, time(parsed.hour, parsed.minute)
