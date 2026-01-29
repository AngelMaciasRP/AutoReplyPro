# Roadmap por fases - AutoReplyPro

## Fase 0 - Foundation (1-2 semanas)
**Objetivo:** estabilidad y bases para escalar.
- Prioridad: alta
- Esfuerzo: medio

Entregables:
- Normalizar cliente API y manejo de errores.
- Tipos/validaciones de respuestas en frontend.
- Logs estructurados basicos en backend.
- Instrumentacion minima (request_id, tiempos).

## Fase 1 - UX Refinada y Flujos Optimizados (2-3 semanas)
**Objetivo:** reducir friccion y pasos.
- Prioridad: alta
- Esfuerzo: medio

Entregables:
- Formularios guiados con validaciones y mensajes consistentes.
- Menos pasos para crear turnos.
- Estados vacios utiles y microcopy.
- Confirmaciones claras y deshacer acciones criticas.

## Fase 2 - Onboarding Perfecto (2-3 semanas)
**Objetivo:** activacion rapida de clinicas nuevas.
- Prioridad: alta
- Esfuerzo: medio

Entregables:
- Wizard inicial por clinica (horarios, tratamientos, usuarios).
- Datos de ejemplo y checklist de puesta en marcha.
- Tours guiados en calendario y pacientes.

## Fase 3 - Roles y Permisos (2-4 semanas)
**Objetivo:** control de acceso granular.
- Prioridad: alta
- Esfuerzo: alto

Entregables:
- RBAC por modulo y accion.
- UI de gestion de usuarios/roles.
- Auditoria de acciones por usuario.
 - Tabla clinic_users + audit_logs en Supabase.
 - Endpoints API: roles, clinic-users, audit-logs.

## Fase 4 - Mensajeria Real (3-5 semanas)
**Objetivo:** inbox unificado.
- Prioridad: media-alta
- Esfuerzo: alto

Entregables:
- Inbox por paciente.
- Historial de conversaciones.
- Integracion con WhatsApp/Email/SMS.
- Estado de entrega/lectura.
 - Tablas message_threads y messages.
 - API de mensajes y UI inbox.

## Fase 5 - Automatizaciones (3-5 semanas)
**Objetivo:** reducir trabajo operativo.
- Prioridad: media
- Esfuerzo: alto

Entregables:
- Motor de reglas (si/entonces).
- Recordatorios y confirmaciones automaticas.
- Alertas por saturacion o huecos.
 - Tabla automation_rules + endpoints CRUD.
 - UI para crear reglas.

## Fase 6 - SaaS Maduro (4-8 semanas)
**Objetivo:** monetizacion y operacion estable.
- Prioridad: media
- Esfuerzo: alto

Entregables:
- Billing (planes, suscripciones, limites).
- Observabilidad (metricas, alertas, dashboards).
- Backups automatizados + restore probado.
- Compliance basico (privacy, terminos).
- Tests automatizados (API + UI).
 - SQL + endpoints base (billing, metrics, events).

## Dependencias clave
- Fase 3 (roles) antes de mensajeria y automatizaciones multiusuario.
- Onboarding y UX antes de billing para reducir churn.

## KPI sugeridos
- Tiempo promedio de alta de clinica.
- Turnos creados por usuario por semana.
- Tasa de confirmacion.
- Reduccion de no-shows.
