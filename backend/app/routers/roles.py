from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.main import supabase

router = APIRouter()


class Role(BaseModel):
    name: str
    description: str
    permissions: List[str]


class ClinicUserCreate(BaseModel):
    clinic_id: str
    email: str
    role: str
    actor_id: Optional[str] = None


class ClinicUserUpdate(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None
    actor_id: Optional[str] = None


def _default_roles() -> List[Role]:
    return [
        Role(
            name="admin",
            description="Acceso total a la clinica",
            permissions=["*"],
        ),
        Role(
            name="recepcion",
            description="Gestion de agenda y pacientes",
            permissions=["calendar.read", "calendar.write", "patients.read", "patients.write"],
        ),
        Role(
            name="doctor",
            description="Acceso clinico y agenda propia",
            permissions=["calendar.read", "patients.read"],
        ),
        Role(
            name="viewer",
            description="Solo lectura",
            permissions=["calendar.read", "patients.read"],
        ),
    ]


def _audit(clinic_id: str, actor_id: Optional[str], action: str, entity: str, entity_id: str, changes: dict):
    try:
        supabase.table("audit_logs").insert(
            {
                "clinic_id": clinic_id,
                "actor_id": actor_id,
                "action": action,
                "entity": entity,
                "entity_id": entity_id,
                "changes": changes,
            }
        ).execute()
    except Exception:
        # audit is best-effort
        pass


@router.get("/roles")
def list_roles():
    return {"roles": [r.dict() for r in _default_roles()]}


@router.get("/clinic-users")
def list_clinic_users(clinic_id: str):
    try:
        res = (
            supabase.table("clinic_users")
            .select("*")
            .eq("clinic_id", clinic_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"users": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clinic-users")
def create_clinic_user(payload: ClinicUserCreate):
    try:
        res = supabase.table("clinic_users").insert(
            {
                "clinic_id": payload.clinic_id,
                "email": payload.email,
                "role": payload.role,
                "status": "invited",
            }
        ).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo crear el usuario")
        created = res.data[0]
        _audit(
            payload.clinic_id,
            payload.actor_id,
            "invite_user",
            "clinic_users",
            created.get("id"),
            {"email": payload.email, "role": payload.role},
        )
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/clinic-users/{user_id}")
def update_clinic_user(user_id: str, payload: ClinicUserUpdate):
    try:
        updates = {k: v for k, v in payload.dict().items() if v is not None and k != "actor_id"}
        if not updates:
            raise HTTPException(status_code=400, detail="Sin cambios")

        res = (
            supabase.table("clinic_users")
            .update(updates)
            .eq("id", user_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        updated = res.data[0]
        _audit(
            updated.get("clinic_id"),
            payload.actor_id,
            "update_user",
            "clinic_users",
            user_id,
            updates,
        )
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit-logs")
def list_audit_logs(clinic_id: str, limit: int = 50):
    try:
        res = (
            supabase.table("audit_logs")
            .select("*")
            .eq("clinic_id", clinic_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"logs": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
