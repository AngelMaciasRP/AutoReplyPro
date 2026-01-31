# AutoReplyPro — AI Copilot Instructions

A concise, practical guide for AI coding agents working on AutoReplyPro (FastAPI backend + Next.js 14 frontend + Supabase).

## Quick start ✅
- Backend (Windows example):
  - cd backend
  - python -m venv .venv
  - .venv\Scripts\activate
  - pip install -r requirements.txt
  - ensure `backend/.env` contains: SUPABASE_URL, SUPABASE_SERVICE_ROLE (required), WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, VERIFY_TOKEN, OPENAI_API_KEY (optional)
  - run: uvicorn app.main:app --reload --port 8000 (note: `app` is a Socket.IO-wrapped ASGI app)
- Frontend:
  - cd frontend; npm ci; npm run dev (http://localhost:3000)

## Architecture snapshot 🔍
- Backend entry: `backend/app/main.py` — creates a global Supabase client and registers routers. The FastAPI app is wrapped by `socketio.ASGIApp` (run with `uvicorn app.main:app`).
- Services vs Routers: business logic lives in `backend/app/services/`; routers in `backend/app/routers/` should call services, not raw Supabase queries.
- Conversation flows: `backend/app/templates/flows_dental_general.json` is the single source of truth for templated replies; `app/services/ai_service.py` reads it.
- Frontend: Next.js 14 App Router, supabase browser client at `frontend/lib/supabaseClient.ts` and provider in `frontend/app/supabase-provider.tsx`.

## Critical patterns & concrete examples ⚠️
- Supabase usage: always call `.execute()` on queries and check `result.data`. Handle PostgREST "not found" (`PGRST116`) explicitly (see `agenda_logic.py`).
  - Example: supabase.table("treatments").select("duration_minutes").eq("id", treatment_id).single().execute()
- Appointment creation:
  - ALWAYS call `get_available_slots()` from `services/agenda_logic.py` before inserting.
  - Double-booking is controlled via clinic settings (`allow_double_booking`, `max_appointments_per_slot`, `overbooking_extra_fee`).
- Intent logic:
  - `ai_service.classify_intent()` uses keywords and `flows_dental_general.json` replies. When adding an intent, update JSON + `ai_service` keywords.
- Language: the app is Spanish-first — intent keywords, templates, and UI are Spanish.

## Tests & CI 🧪
- CI file: `.github/workflows/ci.yml` currently installs deps and compiles backend + builds frontend but DOES NOT run tests.
- Docs state tests use `pytest` + `httpx` (put backend tests under `backend/tests/` when adding them). Add a CI job to run `pytest` if you add tests.

## Debugging & integration pointers 🔧
- Use `backend/sample_payload.json` to simulate WhatsApp webhook payloads to `/whatsapp/webhook`.
- Health check: GET `/api/health`.
- For intent debugging, call `ai_service.classify_intent(text)` and `ai_service.get_reply_for_intent(intent, text)` locally.
- Run `uvicorn app.main:app` to exercise Socket.IO + FastAPI (not just FastAPI app).

## Files to review first (fast path) 📂
- `backend/app/main.py` — env validation, global supabase, router registration
- `backend/app/services/ai_service.py` — intent classification & reply composition
- `backend/app/services/agenda_logic.py` — availability, create/reschedule logic (atomic checks)
- `backend/app/services/availability.py` — slot generation helpers
- `backend/app/templates/flows_dental_general.json` — conversational templates
- `frontend/lib/supabaseClient.ts` and `frontend/app/supabase-provider.tsx` — browser Supabase patterns

## Gotchas & low-friction improvements 📝
- Duplicate Supabase clients exist (`app/main.py` and `app/core/supabase_client.py`) — prefer `fastapi_app.state.supabase` or the global from `main.py`.
- Table name inconsistency: `messages` vs `odontology_messages` — verify actual schema before changes.
- Tests referenced in docs but not present; add `pytest` tests and CI job when adding test coverage.
- OPENAI integration is optional: `OPENAI_API_KEY` may be present but current behavior is template-driven.

---

If you'd like, I can: update this file in the repo, add a short CI job that runs `pytest`, or add a sample test file for `ai_service` using `pytest` + `httpx`. Which would you prefer next?
