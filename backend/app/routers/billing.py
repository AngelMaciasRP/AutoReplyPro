from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.main import supabase
from app.services.audit import log_audit
from app.services.observability import log_event

router = APIRouter()


class PlanCreate(BaseModel):
    name: str
    price_cents: int
    currency: str = "USD"
    interval: str = "month"
    limits: dict = {}


class SubscriptionCreate(BaseModel):
    clinic_id: str
    plan_id: str
    status: str = "trial"


@router.get("/billing/plans")
def list_plans():
    try:
        res = supabase.table("billing_plans").select("*").order("price_cents").execute()
        return {"plans": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/billing/plans")
def create_plan(payload: PlanCreate):
    try:
        res = supabase.table("billing_plans").insert(payload.dict()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo crear plan")
        plan = res.data[0]
        log_audit(
            "system",
            "create_plan",
            "billing_plans",
            plan.get("id", ""),
            {"name": plan.get("name"), "price_cents": plan.get("price_cents")},
        )
        log_event("billing_plan_created", {"plan_id": plan.get("id")}, clinic_id=None)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/billing/subscriptions")
def list_subscriptions(clinic_id: Optional[str] = None):
    try:
        query = supabase.table("billing_subscriptions").select("*")
        if clinic_id:
            query = query.eq("clinic_id", clinic_id)
        res = query.order("created_at", desc=True).execute()
        return {"subscriptions": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/billing/subscriptions")
def create_subscription(payload: SubscriptionCreate):
    try:
        res = supabase.table("billing_subscriptions").insert(payload.dict()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="No se pudo crear suscripcion")
        sub = res.data[0]
        log_audit(
            payload.clinic_id,
            "create_subscription",
            "billing_subscriptions",
            sub.get("id", ""),
            {"plan_id": payload.plan_id, "status": payload.status},
        )
        log_event(
            "subscription_created",
            {"subscription_id": sub.get("id"), "plan_id": payload.plan_id},
            clinic_id=payload.clinic_id,
        )
        return sub
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
