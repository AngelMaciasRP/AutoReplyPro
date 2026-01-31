from typing import Any, Dict
import anyio
from app.services.socket_server import broadcast_change as socket_broadcast_change


def broadcast_change(clinic_id: str, event: str, data: Dict[str, Any]):
    try:
        anyio.from_thread.run(socket_broadcast_change, clinic_id, event, data)
    except RuntimeError:
        # If no event loop is available, skip realtime without failing the request.
        return
