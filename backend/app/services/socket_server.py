import socketio
from app.services.websocket_service import ws_manager

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


@sio.event
async def connect(sid, environ, auth):
    clinic_id = (auth or {}).get("clinic_id", "default")
    await ws_manager.connect(clinic_id, sid)
    await sio.enter_room(sid, f"clinic_{clinic_id}")


@sio.event
async def disconnect(sid):
    await ws_manager.disconnect_any(sid)


async def broadcast_change(clinic_id: str, event: str, data: dict, sid: str | None = None):
    change = await ws_manager.broadcast_change(clinic_id, event, data)
    await sio.emit(event, change, room=f"clinic_{clinic_id}", skip_sid=sid)


@sio.event
async def reschedule_appointment(sid, data):
    clinic_id = (data or {}).get("clinic_id", "default")
    await broadcast_change(clinic_id, "appointment_rescheduled", data, sid)


@sio.event
async def confirm_appointment(sid, data):
    clinic_id = (data or {}).get("clinic_id", "default")
    await broadcast_change(clinic_id, "appointment_confirmed", data, sid)


@sio.event
async def cancel_appointment(sid, data):
    clinic_id = (data or {}).get("clinic_id", "default")
    await broadcast_change(clinic_id, "appointment_cancelled", data, sid)


@sio.event
async def create_appointment(sid, data):
    clinic_id = (data or {}).get("clinic_id", "default")
    await broadcast_change(clinic_id, "appointment_created", data, sid)


def broadcast_change_bg(clinic_id: str, event: str, data: dict):
    async def _emit():
        await broadcast_change(clinic_id, event, data)

    sio.start_background_task(_emit)
