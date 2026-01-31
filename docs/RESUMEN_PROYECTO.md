# Resumen del Proyecto - AutoReplyPro

## Objetivo
Construir un sistema operativo clinico digital con agenda inteligente, gestion de pacientes, automatizacion operativa, atencion automatica y soporte multiclínica con tiempo real. Base preparada para pagos, IA y notificaciones.

## Stack
- Frontend: Next.js 16
- Backend: FastAPI
- DB: Supabase (Postgres)
- Realtime: Socket.io (python-socketio + socket.io-client)
- WhatsApp: Cloud API (webhook)
- IA: OpenAI (auto-respuesta y agenda)

## Lo que funciona hoy
### Calendario
- Vista mensual con navegacion por mes.
- Calendario central con dias ordenados (Lun-Dom) y numeracion correcta.
- Click en un dia abre modal con agenda del dia.
- Boton "Crear turno" abre el mismo modal.

### Crear turno (modal)
- Nombre completo con sugerencias de pacientes registrados.
- Lista de tratamientos para seleccionar.
- Selector de fecha.
- Lista de horarios disponibles.
- Creacion de turno desde el modal.

### Turnos y disponibilidad
- Endpoints de turnos: crear, listar, confirmar, reprogramar, cancelar.
- Disponibilidad por fecha y resumen diario.
- Validaciones principales en backend (disponibilidad, horarios, etc.).

### Pacientes
- Listado y busqueda.
- Ficha con historia clinica en modo lectura.
- Boton para editar solo cuando se requiere.
- Carga de radiografias/panoramicas (subir archivo).
 - Historial clinico con sugerencias por playbook.

### Settings
- Horarios, timezone y dias laborales.
- Bloqueos de fechas y periodos.
- Configuracion de turnos (slot minutes, max por dia, buffer, sobreturnos).
- WhatsApp (toggles) y confirmacion.
- Idioma ES/EN.

### Realtime
- Socket.io integrado en backend y frontend.
- Eventos: connect, disconnect, reschedule, confirm, cancel, create.
- Sincronizacion en vivo por clinic_id.

### Playbooks odontologicos
- Protocolos por tratamiento (pasos, insumos, duracion, plantilla de notas).
- Edicion desde dashboard y sugerencia en historial clinico.

### Mensajeria + WhatsApp
- Inbox con threads y mensajes por paciente.
- Webhook verificado con Meta.
- Auto-respuesta con IA (agendar, responder, sugerir horarios).

### Automatizaciones
- Reglas por evento (turno creado, confirmado, recordatorios).
- Ejecucion manual por fecha.

### Auditoria
- Logs por accion (usuarios, pacientes, turnos, settings).
- UI de auditoria con filtros.

### Observabilidad
- Eventos del sistema (appointments, automations, billing, backups).
- UI de eventos.

### Billing
- Planes y suscripciones base.

### Backups y alertas
- Registro de backups manuales.
- Reglas de alertas y notificaciones internas.
- Envio real via email/WhatsApp/webhook (segun regla).

### Optimizaciones
- Cache de availability en frontend (5 min).
- Debounce en busquedas.

## Capa SaaS madura (lo que falta agregar)
### UX refinada y flujos optimizados
- Navegacion mas clara entre calendario, pacientes y settings.
- Formularios con validacion guiada y mensajes consistentes.
- Menos pasos para crear turno y gestionar disponibilidad.

### Onboarding perfecto
- Wizard de configuracion inicial por clinica.
- Datos de ejemplo y checklist de puesta en marcha.
- Tours guiados (tooltips) y estados vacios utiles.

### Roles y permisos
- Permisos finos por accion (RBAC granular).
- Superadmin y auditoria multi-clinica.

### Auditoria y Logs
- Logs estructurados (json) con request_id.
- Retencion, busqueda avanzada y export.

### Billing
- Limites por plan y facturacion real.
- Integracion con Stripe/MercadoPago.

### Notificaciones reales
- Plantillas multi-canal avanzadas.
- Entrega/lectura y reintentos.

### Mensajeria real
- Estados de entrega/lectura.
- Escalamiento a operador.

### Automatizaciones
- Reglas if/then avanzadas y plantillas por clinica.
- Sobreturnos automaticos segun demanda.

### Seguridad avanzada
- MFA, rotacion de tokens, expiracion de sesiones.
- Rate limiting y deteccion de abuso.
- Cifrado de archivos sensibles.

### Observabilidad
- Dashboards y alertas proactivas.

### Backups
- Backups automaticos y restore probado.
- Versionado de configuraciones criticas.

### Tests
- Unit y API tests (pytest + httpx).
- UI tests (Playwright) para calendario y modal.
- Smoke tests en CI.

### Compliance
- Politicas de privacidad y terminos.
- Manejo de datos sensibles.
- Procedimientos de acceso y borrado.

## Vision del producto
- Sistema operativo clinico digital.
- Atencion automatica.
- Gestion de pacientes y agenda inteligente.
- Automatizacion operativa.
- Tiempo real.
- Multiclinica.
- Integracion futura con pagos, IA y notificaciones.

## Documentacion
- Manual de usuario: `docs/MANUAL_USUARIO.md`.
- Documento oficial: `docs/DOCUMENTO_OFICIAL.md`.
- Optimizaciones: `docs/OPTIMIZACIONES.md`.
- Auditoria de codigo: `docs/AUDITORIA_CODIGO.md`.
- Guia video demo: `docs/VIDEO_DEMO_GUIA.md`.
- Roadmap por fases: `docs/ROADMAP_POR_FASES.md`.
- Deploy: `DEPLOY_PROD.md`.

## Estado de tests
- No se detectaron tests automatizados.
- Checklist manual en `HITO_2_PASO_A_PASO.md`.
