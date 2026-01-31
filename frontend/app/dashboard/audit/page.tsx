"use client";

import { useEffect, useState } from "react";
import { useUserRole } from "@/src/hooks/useUserRole";
import "./audit.css";

type AuditLog = {
  id: string;
  clinic_id: string;
  actor_id?: string | null;
  action: string;
  entity: string;
  entity_id: string;
  changes?: Record<string, any>;
  created_at: string;
};

export default function AuditPage() {
  const { role, ready } = useUserRole();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("active_clinic_id");
    setClinicId(stored || "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112");
  }, []);

  const loadLogs = async () => {
    if (!clinicId) return;
    setLoading(true);
    const params = new URLSearchParams({ clinic_id: clinicId, limit: "200" });
    if (actionFilter) params.set("action", actionFilter);
    if (entityFilter) params.set("entity", entityFilter);
    const res = await fetch(`${apiBase}/api/audit-logs?${params.toString()}`);
    const data = await res.json();
    setLogs(Array.isArray(data?.logs) ? data.logs : []);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [clinicId, actionFilter, entityFilter]);

  if (!ready) return null;
  if (role !== "admin") {
    return <div className="audit-card">Sin permisos.</div>;
  }

  return (
    <div className="audit-page">
      <header className="audit-header">
        <div>
          <h1>Auditoria</h1>
          <p>Registro de acciones del sistema.</p>
        </div>
        <button className="ghost" onClick={loadLogs}>
          Recargar
        </button>
      </header>

      <section className="audit-card">
        <div className="filters">
          <input
            placeholder="Filtrar por accion"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
          <input
            placeholder="Filtrar por entidad"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          />
        </div>
      </section>

      <section className="audit-card">
        {loading && <p>Cargando...</p>}
        {!loading && logs.length === 0 && <p>No hay logs.</p>}
        {!loading && logs.length > 0 && (
          <div className="audit-table">
            <div className="audit-row header">
              <span>Fecha</span>
              <span>Accion</span>
              <span>Entidad</span>
              <span>Detalle</span>
            </div>
            {logs.map((log) => (
              <div key={log.id} className="audit-row">
                <span>{log.created_at}</span>
                <span>{log.action}</span>
                <span>{log.entity}</span>
                <span className="detail">
                  {log.entity_id}
                  {log.changes ? ` | ${JSON.stringify(log.changes)}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
