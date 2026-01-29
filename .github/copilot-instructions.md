# AutoReplyPro - AI Copilot Instructions

## Project Overview
**AutoReplyPro** is a dental clinic management system combining WhatsApp messaging automation with appointment scheduling, availability management, and clinic operations. The stack is: Python FastAPI backend + Next.js 14 TypeScript frontend + Supabase database.

## Architecture & Critical Patterns

### Backend Architecture (FastAPI)
- **Entry point**: [backend/app/main.py](backend/app/main.py) - Creates FastAPI app with Supabase client and CORS middleware
- **Supabase initialization** (critical): Global `supabase` client created at app startup using `SUPABASE_SERVICE_ROLE` key (server-side operations)
- **Router structure**: All API routes are separate modules in [backend/app/routers/](backend/app/routers/) - imported and registered in `main.py` with prefixes
- **Services layer**: Business logic isolated in [backend/app/services/](backend/app/services/) - routers call services, not direct Supabase queries
- **Configuration**: [backend/app/core/supabase_client.py](backend/app/core/supabase_client.py) - duplicate Supabase client initialization (consolidate if refactoring)

### Data Flow & Critical Services
1. **WhatsApp webhook** ([app/routers/whatsapp.py](backend/app/routers/whatsapp.py)): Receives messages, saves to `messages` table
2. **AI Intent Classification** ([app/services/ai_service.py](backend/app/services/ai_service.py)): 
   - Loads JSON template from [flows_dental_general.json](backend/app/templates/flows_dental_general.json)
   - Classifies intents: `urgency`, `cleaning`, `pricing`, `appointment`, `question`
   - Returns templated replies - **all flows are data-driven from JSON**
3. **Appointment Logic** ([app/services/agenda_logic.py](backend/app/services/agenda_logic.py)):
   - Validates availability by checking booked appointments + clinic settings
   - Creates appointments only if slot is free - **atomic operation critical**
4. **Message Storage**: Two patterns coexist - `messages` table (raw WhatsApp) and `odontology_messages` (processed)

### Frontend Architecture (Next.js 14)
- **App Router**: Layout-based structure in [app/](frontend/app/)
- **Dashboard**: Main app at [app/dashboard/](frontend/app/dashboard/) with sub-routes (calendar, messages, stats, settings, patient)
- **Auth flow**: [app/login/page.tsx](frontend/app/login/page.tsx), [app/register/page.tsx](frontend/app/register/page.tsx), [app/onboarding/page.tsx](frontend/app/onboarding/page.tsx)
- **Supabase client**: [lib/supabaseClient.ts](frontend/lib/supabaseClient.ts) + provider pattern in [app/supabase-provider.tsx](frontend/app/supabase-provider.tsx)
- **Styling**: Tailwind CSS 4 + shadcn-style setup

### Database Schema (Supabase)
Key tables referenced (infer from code):
- `messages` - Raw WhatsApp messages (direction: in/out, body, clinic_id)
- `odontology_messages` - Processed messages (phone, direction, message, raw)
- `appointments` - Bookings (clinic_id, patient_name, patient_phone, date, start_time, treatment_id)
- `clinic_settings` - Per-clinic config (start_time, end_time - operating hours)
- `treatments` - Service templates (duration_minutes, pricing)

## Developer Workflows

### Running Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# OR: source .venv/bin/activate  # Unix
pip install -r requirements.txt
# Create .env with: SUPABASE_URL, SUPABASE_SERVICE_ROLE, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, VERIFY_TOKEN, OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Running Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

### Environment Setup
Backend `.env` requirements:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE` (required - app crashes without)
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `VERIFY_TOKEN`
- `OPENAI_API_KEY` (optional - for advanced AI)

Frontend uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe keys).

## Project-Specific Conventions

### Naming & Organization
- Router files use snake_case: `app/routers/whatsapp.py`, `clinic_settings.py`
- Service files parallel router names: `whatsapp.py` service, `whatsapp.py` router
- Pydantic models inline in routers (e.g., `AppointmentCreate` in appointments.py)
- Python imports: Absolute paths from `app.` root (e.g., `from app.main import supabase`)

### Supabase Patterns
- **Global client in main.py**: Used across routers/services - DO NOT create new clients per request
- **Table names**: Check existing queries for exact names (inconsistency: `messages` vs `odontology_messages`)
- **Query pattern**: `supabase.table("X").select().eq().single().execute()` - always `.execute()` at end
- **Error handling**: Catch `.data` being empty/None - often returns empty dict instead of error

### Spanish Content Focus
- All user-facing text in Spanish (UI, templates, flows)
- [flows_dental_general.json](backend/app/templates/flows_dental_general.json) is the single source of truth for chatbot responses
- Intent keywords are Spanish: "dolor", "turno", "cita", "limpieza", etc.

## Critical Integration Points

### WhatsApp → Database → Replies Flow
1. WhatsApp webhook POST to `/whatsapp/webhook`
2. Extract message, classify intent via `ai_service.get_reply_for_intent()`
3. Save to `odontology_messages` table
4. Return templated response (no OpenAI calls in current implementation - all rule-based)

### Appointment Creation Atomic Flow
- Always call `get_available_slots()` BEFORE creating appointment
- Slots generated from clinic_settings (operating hours) + treatment duration
- Existing appointments checked against date/time
- Return error dict `{"error": "reason"}` on validation failure

### Frontend API Communication
- Proxy pattern at [app/api/proxy/route.ts](frontend/app/api/proxy/route.ts) for backend calls
- Supabase browser client handles real-time updates (use `NEXT_PUBLIC_` keys)
- CORS configured for localhost:3000 ↔ :8000

## File Dependencies (Do Not Separate)
- `app/main.py` → must import all routers AFTER supabase client creation
- `ai_service.py` → requires `templates/flows_dental_general.json` (hardcoded path)
- `agenda_logic.py` → depends on `services/availability.py` for slot generation

## Common Gotchas
1. **Duplicate Supabase clients**: Both `main.py` and `core/supabase_client.py` create clients - consolidate in production
2. **Missing .env**: FastAPI crashes immediately if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE` missing
3. **Table name inconsistency**: Code uses both `messages` and `odontology_messages` - verify which is correct schema
4. **No real OpenAI integration**: Despite `OPENAI_API_KEY` setup, current AI is template-based, not LLM-driven
5. **Spanish-only UI**: No i18n setup - hardcoded Spanish throughout

## Quick Reference
| Need | File | Notes |
|------|------|-------|
| Add new chat intent | `templates/flows_dental_general.json` + `ai_service.py` | Update keywords & replies |
| New API endpoint | Create in `routers/*.py`, register in `main.py` | Use existing Pydantic model pattern |
| Clinic settings | `services/agenda_logic.py` | Reads from clinic_settings table |
| Styling | `frontend/app/globals.css` + Tailwind classes | Next.js 14 App Router convention |
| Database queries | `services/` folder | Always use global `supabase` client |

## 🎯 HITO 1 - COMPLETADO (26-01-2026)

### Features Implementadas
- ✅ UX avanzada de configuración (5 tabs: Horarios, Bloqueos, Turnos, WhatsApp, Confirmación)
- ✅ Bloqueo de fechas específicas + períodos (vacaciones)
- ✅ Doble turno diario (2 pacientes mismo horario)
- ✅ Calendario avanzado (3 vistas: día, semana, mes)
- ✅ Almuerzo configurable
- ✅ Status de turnos (pending, confirmed, cancelled)

### Archivos Nuevos
- `frontend/app/dashboard/calendar/advanced.tsx` - Calendar profesional
- `frontend/app/dashboard/calendar/calendar.css` - Estilos responsive
- `frontend/app/dashboard/settings/advanced.tsx` - Settings 5 tabs
- `frontend/app/dashboard/settings/settings.css` - CSS profesional

### Archivos Modificados
- `app/routers/clinic_settings.py` - Extendido 2x (nuevos endpoints de bloqueos)
- `app/routers/appointments.py` - Reescrito completamente (soporta double booking)
- `app/routers/availability.py` - 3 endpoints nuevos
- `app/services/availability.py` - 5 funciones nuevas (bloqueos, almuerzo, etc)
- `app/services/agenda_logic.py` - Completamente reescrito

### Documentación
- [INDICE_DOCUMENTACION.md] - Índice y guía rápida
- [ENTREGA_HITO1.md] - Resumen de entrega
- [RESUMEN_HITO1.md] - Resumen ejecutivo
- [HITO_1_COMPLETADO.md] - Especificaciones técnicas
- [GUIA_INTEGRACION_HITO1.md] - Pasos de integración
- [ROADMAP_COMPLETO.md] - Plan 6 hitos
- [HITO_2_ROADMAP.md] - Siguiente hito

## 📋 Estado Actual del Proyecto

**Hitos Completados**: 1/6 (17%)
**Backend Coverage**: 65%
**Frontend Coverage**: 45%
**Database Schema**: 60%
**Documentación**: 100%

### Próximos Pasos Recomendados
1. Integrar HITO 1 usando [GUIA_INTEGRACION_HITO1.md]
2. Test en staging
3. Deploy a producción
4. Luego considerar HITO 2 (Drag-Drop + Real-Time)
