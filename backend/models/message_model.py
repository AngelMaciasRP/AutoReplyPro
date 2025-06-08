from pydantic import BaseModel
from datetime import datetime

class Message(BaseModel):
    content: str
    platform: str
    # created_at se genera automaticamente
