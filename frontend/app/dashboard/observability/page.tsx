"use client";

import { useEffect, useState } from "react";
import { useUserRole } from "@/src/hooks/useUserRole";
import "./observability.css";

type EventRow = {
  id: string;
  clinic_id?: string | null;
  event_type: string;
  payload?: Record<string, any>;
  created_at: string;
};

export default function ObservabilityPage() {
  const { role, ready } = useUserRole();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState("");

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("active_clinic_id");
    setClinicId(stored || "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112");
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (clinicId) params.set("clinic_id", clinicId);
    if (eventType) params.set("event_type", eventType);
    const res = await fetch(`${apiBase}/api/events?${params.toString()}`);
    const data = await res.json();
    setEvents(Array.isArray(data?.events) ? data.events : []);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, [clinicId, eventType]);

  if (!ready) return null;
  if (role !== "admin") {
    return <div className="obs-card">Sin permisos.</div>;
  }

  return (
    <div className="obs-page">
      <header className="obs-header">
        <div>
          <h1>Observabilidad</h1>
          <p>Eventos del sistema.</p>
        </div>
        <button className="ghost" onClick={loadEvents}>
          Recargar
        </button>
      </header>

      <section className="obs-card">
        <div className="filters">
          <input
            placeholder="Filtrar por tipo de evento"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          />
        </div>
      </section>

      <section className="obs-card">
        {loading && <p>Cargando...</p>}
        {!loading && events.length === 0 && <p>No hay eventos.</p>}
        {!loading && events.length > 0 && (
          <div className="obs-table">
            <div className="obs-row header">
              <span>Fecha</span>
              <span>Tipo</span>
              <span>Detalle</span>
            </div>
            {events.map((evt) => (
              <div key={evt.id} className="obs-row">
                <span>{evt.created_at}</span>
                <span>{evt.event_type}</span>
                <span className="detail">
                  {evt.payload ? JSON.stringify(evt.payload) : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
