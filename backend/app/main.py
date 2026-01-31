import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
import socketio

# ===============================
# LOAD ENVIRONMENT VARIABLES
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(os.path.dirname(BASE_DIR), ".env")
load_dotenv(ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE:
    raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_ROLE missing in .env")

# ===============================
# SUPABASE CLIENT (GLOBAL)
# ===============================
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE
)

# ===============================
# FASTAPI APP
# ===============================
fastapi_app = FastAPI(title="AutoReplyPro Backend")
fastapi_app.state.supabase = supabase

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# ROUTERS (IMPORT AFTER SUPABASE)
# ===============================
from app.routers.whatsapp import router as whatsapp_router
from app.routers.appointments import router as appointments_router
from app.routers.calendar import router as calendar_router
from app.routers.availability import router as availability_router
from app.routers.clinic_settings import router as clinic_settings_router
from app.routers.treatments import router as treatments_router
from app.routers.patients import router as patients_router
from app.routers.roles import router as roles_router
from app.routers.messages import router as messages_router
from app.routers.automations import router as automations_router
from app.routers.billing import router as billing_router
from app.routers.observability import router as observability_router
from app.routers.playbooks import router as playbooks_router
from app.services.socket_server import sio

fastapi_app.include_router(clinic_settings_router, prefix="/api", tags=["clinic-settings"])
fastapi_app.include_router(whatsapp_router, prefix="/whatsapp")
fastapi_app.include_router(appointments_router, prefix="/api")
fastapi_app.include_router(calendar_router, prefix="/api")
fastapi_app.include_router(availability_router, prefix="/api")
fastapi_app.include_router(treatments_router, prefix="/api")
fastapi_app.include_router(patients_router, prefix="/api", tags=["patients"])
fastapi_app.include_router(roles_router, prefix="/api", tags=["roles"])
fastapi_app.include_router(messages_router, prefix="/api", tags=["messages"])
fastapi_app.include_router(automations_router, prefix="/api", tags=["automations"])
fastapi_app.include_router(billing_router, prefix="/api", tags=["billing"])
fastapi_app.include_router(observability_router, prefix="/api", tags=["observability"])
fastapi_app.include_router(playbooks_router, prefix="/api", tags=["playbooks"])

# Wrap FastAPI with Socket.IO ASGI app
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

# ===============================
# HEALTH CHECK
# ===============================
@fastapi_app.get("/api/health")
def health():
    return {"ok": True}
