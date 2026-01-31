# Documento Oficial - AutoReplyPro

## Resumen Ejecutivo
AutoReplyPro es un SaaS multi-clinica para consultorios (arrancando por odontologia) que transforma la atencion por WhatsApp y la agenda manual en un sistema operativo clinico. Recibe mensajes, entiende la intencion del paciente, ofrece horarios validos, agenda, confirma, recuerda, registra historial y lo muestra en un dashboard.

No es un bot. Es gestion operativa + automatizacion + control.

## Problema que resuelve
- WhatsApp como bandeja de entrada caotica.
- Turnos mal gestionados (dobles reservas, huecos, cambios sin registro).
- Ausentismo por falta de recordatorios y confirmacion.
- Oportunidades perdidas por respuestas tardias.
- Cero visibilidad operativa.

AutoReplyPro profesionaliza todo el flujo y centraliza la operacion.

## Que hace el sistema (en la practica)
### A) Atencion automatica (WhatsApp)
- Webhook recibe mensajes.
- Se guarda conversacion en Supabase.
- IA responde y puede agendar turnos automaticamente.
- Flujos: pedir turno, cancelar, reprogramar, dudas generales.

### B) Agenda inteligente
Calcula disponibilidad considerando:
- Timezone, dias laborales y horarios.
- Duracion por tratamiento.
- Bloqueos (fechas/periodos).

Permite:
- Crear / confirmar / cancelar / reprogramar turnos.
- Ver agenda por dia/semana/mes.

### C) Panel Operativo (Dashboard)
Modulo clave por rol:
- Calendar: agenda por fecha.
- Messages: conversaciones.
- Patients: ficha e historial clinico.
- Settings: horarios, reglas, WhatsApp, idioma.
- Playbooks: protocolos por tratamiento.
- Auditoria, Observabilidad, Alertas, Backups.

### D) Automatizaciones
Reglas y templates por evento:
- Turno creado, confirmado, recordatorios 24h/6h.
- Notificaciones automaticas por canal.

### E) Multi-clinica (SaaS)
Cada clinica opera aislada:
- settings, pacientes, mensajes, turnos, tratamientos
- escalable a multiples clinicas en paralelo

## Estado actual (implementado)
- Agenda y disponibilidad completas.
- Pacientes con historial clinico y archivos.
- Playbooks odontologicos por tratamiento.
- WhatsApp webhook + auto-respuesta con IA.
- Automatizaciones y mensajes.
- Realtime (Socket.io).
- Roles base y auditoria.
- Observabilidad y eventos.
- Backups y alertas con envio real.

## Stack real
Frontend:
- Next.js 16
- Supabase Auth
- Dashboard /dashboard/*

Backend:
- FastAPI
- Socket.io (python-socketio)
- Integracion WhatsApp Cloud API

DB (Supabase Postgres):
- clinic_settings, patients, appointments, treatments
- messages, message_threads
- playbooks, automation_rules
- audit_logs, system_events, backups, alerts

## Endpoints principales
- /api/clinic-settings
- /api/appointments
- /api/calendar
- /api/availability
- /api/patients
- /api/messages
- /api/automations
- /api/playbooks
- /api/audit-logs
- /api/events
- /api/backups
- /api/alerts/*
- /whatsapp/webhook

## Seguridad
- SUPABASE_SERVICE_ROLE solo en backend.
- Frontend usa anon key.
- CORS limitado a frontends autorizados.

## Deployment
- Frontend: Vercel
- Backend: Render/Railway

## Roadmap de madurez (proxima capa)
- Billing real (Stripe/MercadoPago).
- Observabilidad avanzada (dashboards y alertas proactivas).
- Logs estructurados + retencion.
- Compliance y backups automaticos.
- IA entrenable por clinica (knowledge base).
