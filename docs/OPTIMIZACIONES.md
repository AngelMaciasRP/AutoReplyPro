# Optimizaciones - AutoReplyPro

## Performance
- Cache de availability (5 min) en frontend para evitar refetches innecesarios.
- Debounce en busquedas para reducir llamadas al backend.
- Lazy loading de vistas pesadas del calendario (cuando aplica).

## Caching
- Cache de slots por clinic_id + fecha.
- Invalida cache al crear/reprogramar turnos.

## Seguridad
- Validacion de disponibilidad en backend (no confiar en cliente).
- Filtrado por clinic_id en queries y eventos realtime.
- CORS controlado por entorno.

## Recomendaciones pendientes
- Rate limiting por IP en endpoints criticos.
- Auditoria de permisos por rol (admin/recepcion/doctor).
- Logs estructurados (json) con trazas de request.
