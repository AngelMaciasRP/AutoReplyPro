from typing import Any, Dict
from app.services.socket_server import broadcast_change_bg


def broadcast_change(clinic_id: str, event: str, data: Dict[str, Any]):
    broadcast_change_bg(clinic_id, event, data)
