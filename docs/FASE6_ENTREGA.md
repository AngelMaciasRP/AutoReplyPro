# Fase 6 - SaaS Maduro (Entrega)

## Alcance implementado
- Billing base: tablas de planes y suscripciones.
- Observabilidad basica: endpoint `/api/metrics` y tabla de eventos.
- Estructuras para compliance/backups (documentacion).

## SQL a ejecutar en Supabase
- `SQL_HITO6_SAAS.sql`

## Endpoints nuevos
- `GET /api/billing/plans`
- `POST /api/billing/plans`
- `GET /api/billing/subscriptions?clinic_id=...`
- `POST /api/billing/subscriptions`
- `GET /api/metrics`
- `POST /api/events`

## UI agregada
- `http://localhost:3000/dashboard/billing`
- `http://localhost:3000/dashboard/metrics`

## Pendientes recomendados
- Integracion con Stripe o proveedor local.
- Panel de billing en frontend.
- Metricas reales (latencia, errores, uso por clinica).
- Backups automáticos y restore probado.
- Compliance (privacy, terminos, data retention).
