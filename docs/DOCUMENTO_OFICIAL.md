# Documento Oficial - AutoReplyPro

## Resumen
AutoReplyPro es un sistema para clinicas odontologicas que integra agenda de turnos, disponibilidad, pacientes e integracion WhatsApp.

## Stack
- Backend: FastAPI + Supabase
- Frontend: Next.js + React
- DB: Supabase Postgres
- Realtime: Socket.io

## Endpoints clave
- GET /api/clinic-settings/{clinic_id}
- PUT /api/clinic-settings/{clinic_id}
- GET /api/calendar/?clinic_id=...&date=YYYY-MM-DD
- POST /api/appointments
- PATCH /api/appointments/{id}/reschedule
- GET /api/availability/slots
- GET /api/patients
- POST /api/patients

## Flujos principales
1) Configuracion inicial de clinica.
2) Creacion de turnos desde calendario.
3) Visualizacion de agenda por dia.
4) Registro de pacientes e historia clinica.

## Seguridad
- Service role solo en backend.
- Frontend usa anon key.

## Deployment
- Frontend: Vercel
- Backend: Render/Railway

