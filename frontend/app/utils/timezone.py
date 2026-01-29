from datetime import datetime
import pytz
from dateutil import parser

def local_to_utc(local_datetime_str: str, timezone_str: str) -> datetime:
    """
    Convierte un datetime string local (YYYY-MM-DDTHH:MM)
    al UTC real según el timezone de la clínica
    """
    tz = pytz.timezone(timezone_str)

    naive_dt = parser.parse(local_datetime_str)
    local_dt = tz.localize(naive_dt)

    return local_dt.astimezone(pytz.utc)
