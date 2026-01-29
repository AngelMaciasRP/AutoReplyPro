from typing import Dict, Set
from datetime import datetime


class WebSocketManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, Set[str]] = {}
        self.change_history: list[dict] = []

    async def connect(self, clinic_id: str, sid: str) -> None:
        if clinic_id not in self.active_connections:
            self.active_connections[clinic_id] = set()
        self.active_connections[clinic_id].add(sid)

    async def disconnect(self, clinic_id: str, sid: str) -> None:
        if clinic_id in self.active_connections:
            self.active_connections[clinic_id].discard(sid)
            if not self.active_connections[clinic_id]:
                self.active_connections.pop(clinic_id, None)

    async def disconnect_any(self, sid: str) -> None:
        for clinic_id in list(self.active_connections.keys()):
            if sid in self.active_connections.get(clinic_id, set()):
                await self.disconnect(clinic_id, sid)

    async def broadcast_change(self, clinic_id: str, event: str, data: dict) -> dict:
        change = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": event,
            "data": data,
        }
        self.change_history.append(change)
        return change

    def get_active_users(self, clinic_id: str) -> int:
        return len(self.active_connections.get(clinic_id, set()))


ws_manager = WebSocketManager()
