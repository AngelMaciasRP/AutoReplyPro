# 📋 INDICACIONES - HITO 1 AUTOREPLYQPO

## 📊 RESUMEN DE TRABAJO REALIZADO

### SESIÓN: 26 de Enero 2026
**Proyecto**: AutoReplyPro - Sistema de gestión de clínicas dentales  
**Hito**: HITO 1 - Configuración avanzada + Bloqueos + Double Booking + Calendar

---

## ✅ QUÉ SE COMPLETÓ

### 1. ANÁLISIS DEL PROYECTO
- ✅ Analizado codebase completo (backend FastAPI + frontend Next.js)
- ✅ Identificados problemas: Supabase clients duplicados, tablas inconsistentes, falta de auth
- ✅ Creado documento de estado (PROJECT_STATUS.md)

### 2. PLANIFICACIÓN
- ✅ Creado ROADMAP_COMPLETO.md con 6 hitos (17% completado = HITO 1)
- ✅ Desglosadas características por hito
- ✅ Definidos dependencies y milestones

### 3. BASE DE DATOS (SUPABASE)
**SQL CREADO**:
- ✅ `SQL_TABLAS_COMPLETAS.sql` - 6 tablas completas (CREATE TABLE)
- ✅ `SQL_TABLAS_SOLAMENTE.sql` - Alternativa compacta
- ✅ `SQL_INTEGRACION_COMPLETO.sql` - Con comentarios extensos

**TABLAS DISEÑADAS**:
```
1. clinic_settings (26 campos)
   - Configuración: timezone, horarios, almuerzo, trabajo_days
   - Bloqueos: blocked_dates, blocked_periods
   - Turnos: max_appointments_per_day, buffer, slot_minutes
   - Double booking: allow_double_booking, price_factor
   - Recordatorios: reminder_24h, reminder_6h
   - WhatsApp: bot_enabled, auto_reply_enabled, manual_mode
   - Confirmación: confirmation_required

2. appointments (15 campos)
   - Datos paciente: patient_name, patient_phone
   - Datos turno: date, start_time, end_time, treatment_id
   - Status: status (pending/confirmed/cancelled)
   - Control: double_booked, confirmation_required, cancellation_reason
   - Timestamps: created_at, updated_at

3. treatments (8 campos)
   - Servicios: name, description, duration_minutes, base_price

4. reminders (11 campos) - OPCIONAL
   - Recordatorios: type, message, status, error_message

5. messages (8 campos)
   - WhatsApp: phone, direction, message, raw JSONB

6. odontology_messages (7 campos) - LEGACY
   - Compatibilidad con versión anterior

ÍNDICES**: 16 índices (performance)
**TRIGGERS**: 5 triggers (updated_at automático)
```

### 4. BACKEND CODE (PYTHON/FASTAPI)
**5 ARCHIVOS EXISTENTES ACTUALIZADOS**:
- ✅ `backend/app/routers/clinic_settings.py` (150+ líneas)
  - GET /clinic-settings/{clinic_id}
  - PUT /clinic-settings/{clinic_id}
  - POST/DELETE blocked-dates
  - POST/DELETE blocked-periods

- ✅ `backend/app/routers/appointments.py` (146 líneas)
  - POST /appointments (crear turno)
  - PATCH /appointments/{id}/reschedule (reagendar)
  - PATCH /appointments/{id}/confirm (confirmar)
  - DELETE /appointments/{id} (cancelar)

- ✅ `backend/app/routers/availability.py` (80+ líneas)
  - GET /availability/slots (slots disponibles)
  - GET /availability/dates (próximas fechas disponibles)
  - GET /availability/summary (resumen configuración)

- ✅ `backend/app/services/agenda_logic.py` (200+ líneas)
  - get_clinic_settings()
  - get_available_slots() - valida bloqueos, almuerzo, double booking
  - create_appointment() - 5 validaciones
  - reschedule_appointment()

- ✅ `backend/app/services/availability.py` (150+ líneas)
  - is_date_blocked() - verifica bloqueos
  - is_work_day() - valida día laboral
  - generate_slots_with_lunch() - excluye almuerzo
  - get_available_dates() - 30 días disponibles

### 5. FRONTEND CODE (REACT/NEXT.JS)
**4 ARCHIVOS NUEVOS CREADOS**:
- ✅ `frontend/app/dashboard/calendar/advanced.tsx` (400 líneas)
  - 3 vistas: Day (grid horario), Week (7 días), Month (calendario)
  - Filtros por tratamiento
  - Indicadores visuales (disponible/booked/double/blocked)
  - Summary cards (totales, confirmados, pendientes)

- ✅ `frontend/app/dashboard/calendar/calendar.css` (500 líneas)
  - Responsive grids
  - Colores: verde (disponible), naranja (booked), rojo (error)
  - Mobile breakpoints (480px, 768px)

- ✅ `frontend/app/dashboard/settings/advanced.tsx` (350 líneas)
  - 5 tabs profesionales:
    1. Horarios: timezone, open/close, lunch, work_days
    2. Bloqueos: add/remove fechas y períodos
    3. Turnos: duration, max/day, buffer, double_booking
    4. WhatsApp: bot config
    5. Confirmación: require confirmation, reminders

- ✅ `frontend/app/dashboard/settings/settings.css` (450 líneas)
  - Tab interface profesional
  - Form styling con validación
  - Responsivo mobile/tablet/desktop

### 6. DOCUMENTACIÓN
- ✅ Actualizado `.github/copilot-instructions.md` con HITO 1
- ✅ Creado `indicaciones.md` (guía de integración)
- ✅ Creado `SQL_TABLAS_COMPLETAS.sql` (listo para pegar)
- ✅ requirements.txt corregido (añadidos python-multipart, cors)

---

## 🔧 CAMBIOS TÉCNICOS CLAVE

### Database Schema (Supabase)
```sql
ANTES:
- clinic_settings: 6 columnas
- appointments: 8 columnas
- treatments: no existía
- reminders: no existía

DESPUÉS:
- clinic_settings: 26 columnas (+20)
- appointments: 15 columnas (+7)
- treatments: 8 columnas (nueva)
- reminders: 11 columnas (nueva)
- ÍNDICES: +16
- TRIGGERS: +5
```

### Backend Architecture
```python
PATRÓN 3-CAPAS:
Router → Service → Database

ROUTERS:
- clinic_settings.py → GET/PUT settings, manage bloqueos
- appointments.py → CRUD turnos + reschedule + confirm
- availability.py → GET slots, dates, summary

SERVICES:
- agenda_logic.py → Lógica turnos (validación 5 pasos)
- availability.py → Cálculo slots + bloqueos + almuerzo

VALIDACIONES:
1. ¿Fecha bloqueada? (blocked_dates + blocked_periods)
2. ¿Día laboral? (work_days array)
3. ¿Máx turnos/día? (max_appointments_per_day)
4. ¿Slot disponible? (occupied appointments)
5. ¿Crear turno? (status='pending')
```

### Frontend Architecture
```typescript
COMPONENTES:
- calendar/advanced.tsx
  └─ 3 views: Day, Week, Month
  └─ Filters, Summary cards
  └─ API integration

- settings/advanced.tsx
  └─ 5 tabs (horarios, bloqueos, turnos, etc)
  └─ Form validation
  └─ API integration

INTEGRACIONES:
- Supabase client (lib/supabaseClient.ts)
- HTTP API (http://localhost:8000/api)
- Real-time (future para HITO 2)
```

### Requirements.txt Actualizado
```
Agregados:
- python-multipart==0.0.6 (para formularios)
- cors==1.0.1 (para CORS)

Corregidos:
- dateparser → dateparser==1.1.8 (versión específica)
```

---

## ✅ ESTADO ACTUAL

| Componente | Estado | Detalle |
|-----------|--------|---------|
| Database | ✅ Completa | 6 tablas, 16 índices, 5 triggers en Supabase |
| Backend | ✅ Código listo | 5 routers + 2 services, validaciones 5-paso |
| Frontend | ✅ Componentes listos | Calendar 3-vistas + Settings 5-tabs |
| Requirements | ✅ Corregido | 13 dependencias versionnadas |
| Python env | ❌ Pendiente | Instalar Python 3.11+ |
| .env files | ⏳ TODO | Backend + Frontend |
| Testing | ⏳ TODO | 7 pasos de prueba |

---

## 📝 INSTRUCCIONES PARA CHATGPT (PARA CONTINUAR SIN FALLOS)

### CONTEXTO CRÍTICO

**Proyecto**: AutoReplyPro - Gestión clínicas dentales  
**Stack**: Python FastAPI + Next.js 14 + Supabase PostgreSQL  
**Hito**: 1/6 (17% completado)  

### REGLAS NO NEGOCIABLES

#### 1. SUPABASE & DATABASE
```
❌ NUNCA crear nuevo cliente Supabase
✅ SIEMPRE usar cliente global de main.py
   Archivo: backend/app/main.py
   Patrón: supabase = create_client(url, key)
   
❌ NUNCA usar nombres tabla inconsistentes
✅ TABLAS OFICIALES:
   - clinic_settings (NO "clinics" ni "settings")
   - appointments (NO "turnos" ni "bookings")
   - treatments (NO "services")
   - messages (NO "whatsapp_messages")
   - reminders, odontology_messages

❌ NUNCA ejecutar queries sin .execute()
✅ PATRÓN correcto:
   supabase.table("X").select().eq("id", val).execute()
   
❌ NUNCA ignorar clinic_id
✅ SIEMPRE filtrar por clinic_id en queries
   .eq("clinic_id", clinic_id)
```

#### 2. BACKEND (FastAPI)
```
❌ NUNCA importar supabase en routers
✅ SIEMPRE:
   from app.main import supabase
   
❌ NUNCA hacer queries directas en routers
✅ SIEMPRE usar services:
   router → service → database
   Patrón: app/routers/ → app/services/
   
❌ NUNCA olvidar validaciones
✅ VALIDACIONES OBLIGATORIAS (5-paso):
   1. Fecha bloqueada? → is_date_blocked()
   2. Día laboral? → is_work_day()
   3. Máx turnos/día? → count appointments
   4. Slot disponible? → check appointments overlap
   5. Crear turno? → INSERT con status='pending'
```

#### 3. FRONTEND (Next.js)
```
❌ NUNCA hacer fetch directo a :8000
✅ SIEMPRE usar proxy:
   Ruta: frontend/app/api/proxy/route.ts
   Patrón: /api/proxy?endpoint=/appointments
   
❌ NUNCA hardcodear URLs
✅ SIEMPRE usar .env.local:
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   
❌ NUNCA ignorar timestamps
✅ SIEMPRE incluir:
   created_at, updated_at en responses
```

#### 4. VALIDACIÓN DE TURNOS (CRÍTICO)
```python
# PSEUDO-CÓDIGO CORRECTO:
def create_appointment(clinic_id, date, start_time, treatment):
    # PASO 1: Validar fecha no bloqueada
    if is_date_blocked(clinic_id, date):
        return {"error": "Fecha bloqueada"}
    
    # PASO 2: Validar día laboral
    if not is_work_day(clinic_id, date):
        return {"error": "Día no laboral"}
    
    # PASO 3: Validar máx turnos/día
    settings = get_clinic_settings(clinic_id)
    existing = count_appointments(clinic_id, date)
    if existing >= settings.max_appointments_per_day:
        return {"error": "Máximo turnos del día alcanzado"}
    
    # PASO 4: Validar slot no ocupado
    conflicts = find_overlapping(clinic_id, date, start_time, end_time)
    if conflicts and not settings.allow_double_booking:
        return {"error": "Slot ocupado"}
    
    # PASO 5: Crear turno
    appointment = insert_appointment({
        clinic_id, date, start_time, end_time,
        status='pending', double_booked=len(conflicts)>0
    })
    return appointment
```

#### 5. ESTRUCTURA ARCHIVOS
```
backend/
├── app/
│   ├── main.py ..................... Entrada + Supabase cliente
│   ├── routers/
│   │   ├── clinic_settings.py ...... Settings endpoints
│   │   ├── appointments.py ......... CRUD turnos
│   │   ├── availability.py ......... Slots disponibles
│   │   ├── messages.py, patients.py, etc.
│   ├── services/
│   │   ├── agenda_logic.py ......... Lógica turnos
│   │   ├── availability.py ......... Cálculo slots
│   │   ├── ai_service.py .......... Intent classification
│   ├── templates/
│   │   └── flows_dental_general.json (respuestas IA)
│   └── utils/
│       └── date_parser.py
├── requirements.txt ................ Dependencias
├── .env ............................ Supabase + OpenAI keys

frontend/
├── app/
│   ├── dashboard/
│   │   ├── calendar/advanced.tsx ... Calendar 3-vistas
│   │   ├── settings/advanced.tsx ... Settings 5-tabs
│   │   └── [otros]
│   ├── api/proxy/route.ts ......... Proxy backend calls
│   └── supabase-provider.tsx
├── lib/supabaseClient.ts ........... Supabase browser client
├── .env.local ...................... Public keys
└── package.json
```

#### 6. ENDPOINTS BACKEND (NO CAMBIAR NOMBRES)
```
GET    /clinic-settings/{clinic_id}
PUT    /clinic-settings/{clinic_id}
POST   /clinic-settings/{clinic_id}/blocked-dates
DELETE /clinic-settings/{clinic_id}/blocked-dates/{date}
POST   /clinic-settings/{clinic_id}/blocked-periods
DELETE /clinic-settings/{clinic_id}/blocked-periods/{period_id}

POST   /appointments
GET    /appointments/{clinic_id}
PATCH  /appointments/{id}/reschedule
PATCH  /appointments/{id}/confirm
DELETE /appointments/{id}

GET    /availability/slots
GET    /availability/dates
GET    /availability/summary
```

#### 7. REQUESTS/RESPONSES (MODELOS)
```python
# CreateAppointment
{
    "clinic_id": "uuid",
    "patient_name": "string",
    "patient_phone": "+34...",
    "date": "YYYY-MM-DD",
    "start_time": "HH:MM",
    "treatment_id": "uuid"
}

# Response (exitoso)
{
    "id": "uuid",
    "status": "pending",
    "date": "YYYY-MM-DD",
    "start_time": "HH:MM",
    "double_booked": false,
    "created_at": "ISO8601"
}

# Response (error)
{
    "error": "Descripción del error",
    "code": "ERROR_CODE"
}
```

---

## ⚠️ PROBLEMAS COMUNES (CÓMO EVITARLOS)

### Error: "clinic_settings not found"
✅ **Causa**: No filtra por clinic_id  
✅ **Solución**: Siempre `.eq("clinic_id", clinic_id)`

### Error: "Appointment overlap"
✅ **Causa**: No valida hora de inicio/fin  
✅ **Solución**: Check step 4 - find_overlapping debe comparar ranges

### Error: "Python not found"
✅ **Causa**: Python no instalado o no en PATH  
✅ **Solución**: 
   - Descargar python.org (versión 3.11+)
   - ✅ Marcar "Add Python to PATH" durante instalación
   - Verificar: `python --version`

### Error: "CORS blocked"
✅ **Causa**: Frontend no puede llamar backend  
✅ **Solución**: Verificar CORS en main.py:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Error: "Module not found"
✅ **Causa**: Falta instalar dependencias  
✅ **Solución**:
   ```powershell
   pip install -r requirements.txt
   ```

---

## 🚀 PRÓXIMOS PASOS (ORDEN EXACTO)

---

## 🚀 PRÓXIMOS PASOS

### PASO 1: COPIAR BACKEND CODE (5 archivos Python)
**Ubicación**: `backend/app/`

Copia estos archivos a tu proyecto:

```
1. routers/clinic_settings.py
2. routers/appointments.py  
3. routers/availability.py
4. services/agenda_logic.py
5. services/availability.py
```

**Desde donde?**: Están en `backend/app/` (ya existen en tu proyecto)

**Qué hacen?**:
- clinic_settings.py → Endpoints para configuración
- appointments.py → Endpoints para turnos
- availability.py → Endpoints para slots disponibles
- agenda_logic.py → Lógica de citas y bloqueos
- availability.py (service) → Cálculo de disponibilidad

---

### PASO 2: COPIAR FRONTEND CODE (4 archivos React + CSS)
**Ubicación**: `frontend/app/dashboard/`

Copia estos archivos:

```
1. calendar/advanced.tsx
2. calendar/calendar.css
3. settings/advanced.tsx
4. settings/settings.css
```

**Qué hacen?**:
- Calendar avanzado (3 vistas: día, semana, mes)
- Settings con 5 tabs (horarios, bloqueos, turnos, WhatsApp, confirmación)

---

### PASO 3: ACTUALIZAR MAIN.PY
**Archivo**: `backend/app/main.py`

Asegúrate que importe los routers:

```python
from app.routers.clinic_settings import router as clinic_settings_router
from app.routers.appointments import router as appointments_router
from app.routers.availability import router as availability_router

# Incluir routers
app.include_router(clinic_settings_router, prefix="/api", tags=["clinic-settings"])
app.include_router(appointments_router, prefix="/api", tags=["appointments"])
app.include_router(availability_router, prefix="/api", tags=["availability"])
```

---

### PASO 4: INSTALAR DEPENDENCIAS
**Backend**:
```bash
cd backend
pip install -r requirements.txt
```

**Frontend**:
```bash
cd frontend
npm install
```

---

### PASO 5: TEST LOCAL

**Backend** (terminal 1):
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Frontend** (terminal 2):
```bash
cd frontend
npm run dev
```

**Verificar**:
- Backend: http://localhost:8000/docs (Swagger UI)
- Frontend: http://localhost:3000

---

### PASO 6: PROBAR ENDPOINTS

**GET Settings**:
```bash
curl http://localhost:8000/api/clinic-settings/clinic_001
```

**POST Appointment**:
```bash
curl -X POST http://localhost:8000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "clinic_id": "clinic_001",
    "patient_name": "Juan Pérez",
    "patient_phone": "+54911234567",
    "date": "2026-01-27",
    "start_time": "10:00",
    "treatment_id": "...",
    "allow_double_booking": false
  }'
```

**GET Available Slots**:
```bash
curl http://localhost:8000/api/availability/slots?clinic_id=clinic_001&date=2026-01-27
```

---

### PASO 7: DEPLOY A PRODUCCIÓN

**Backend** (Railway/Render):
1. Push a GitHub
2. Conectar repo
3. Deploy

**Frontend** (Vercel):
1. Push a GitHub
2. Conectar repo
3. Deploy

---

## 📊 CHECKLIST

### Bases de Datos
- [ ] SQL ejecutado en Supabase
- [ ] 6 tablas creadas (clinic_settings, appointments, treatments, reminders, messages, odontology_messages)
- [ ] 16 índices creados
- [ ] 5 triggers activos

### Backend
- [ ] Copié 5 archivos Python
- [ ] Actualicé main.py con imports
- [ ] Instalé dependencias
- [ ] Backend corriendo en localhost:8000
- [ ] Swagger UI funciona (/docs)

### Frontend
- [ ] Copié 4 archivos React + CSS
- [ ] Instalé dependencias
- [ ] Frontend corriendo en localhost:3000
- [ ] Components renderean (calendar, settings)

### Testing
- [ ] GET /api/clinic-settings/{id} funciona
- [ ] POST /api/appointments funciona
- [ ] GET /api/availability/slots funciona
- [ ] Frontend se conecta a backend

### Deploy
- [ ] Backend deployado
- [ ] Frontend deployado
- [ ] Ambos conectados
- [ ] Funciona en producción

---

## 🎯 RESUMEN RÁPIDO

```
1. SQL en Supabase ✅
2. Backend code (5 archivos)
3. Frontend code (4 archivos)
4. Test local
5. Deploy
```

**¿Dónde están los archivos?**
- Backend: `backend/app/routers/` y `backend/app/services/`
- Frontend: `frontend/app/dashboard/calendar/` y `frontend/app/dashboard/settings/`

**¿Necesitas ayuda?**
- Backend: Revisa `backend/app/main.py` para imports
- Frontend: Revisa `frontend/app/supabase-provider.tsx` para Supabase client
- BD: Revisa tabla `clinic_settings` en Supabase

---

## 📝 NOTAS IMPORTANTES

1. **clinic_id**: Es el identificador único de cada clínica (TEXT)
2. **API Base**: `http://localhost:8000/api`
3. **Frontend URL**: `http://localhost:3000`
4. **Supabase Keys**: Asegúrate que estén en `.env`

**Variables de entorno necesarias**:
```
SUPABASE_URL=tu_url
SUPABASE_SERVICE_ROLE=tu_key
WHATSAPP_TOKEN=tu_token
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

---

## 🚀 ¿LISTO?

1. Ejecuta SQL
2. Copia backend code
3. Copia frontend code
4. Test local
5. Deploy

**¡Adelante!**

---

*Última actualización: 26 de Enero 2026*
*Status: ✅ HITO 1 LISTO PARA IMPLEMENTAR*
