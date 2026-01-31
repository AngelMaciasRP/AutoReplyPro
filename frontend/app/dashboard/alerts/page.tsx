"use client";

import { useEffect, useState } from "react";
import { useUserRole } from "@/src/hooks/useUserRole";
import "./alerts.css";

type AlertRule = {
  id: string;
  clinic_id: string;
  name: string;
  event_type: string;
  channel: string;
  target?: string | null;
  enabled: boolean;
};

type AlertNotification = {
  id: string;
  clinic_id: string;
  rule_id?: string | null;
  event_type: string;
  payload?: Record<string, any>;
  status: string;
  created_at: string;
};

export default function AlertsPage() {
  const { role, ready } = useUserRole();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("appointment_created");
  const [channel, setChannel] = useState("email");
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("");

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("active_clinic_id");
    setClinicId(stored || "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112");
  }, []);

  const loadRules = async () => {
    if (!clinicId) return;
    const res = await fetch(`${apiBase}/api/alerts/rules?clinic_id=${clinicId}`);
    const data = await res.json();
    setRules(Array.isArray(data?.rules) ? data.rules : []);
  };

  const loadNotifications = async () => {
    if (!clinicId) return;
    const res = await fetch(
      `${apiBase}/api/alerts/notifications?clinic_id=${clinicId}`
    );
    const data = await res.json();
    setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
  };

  useEffect(() => {
    loadRules();
    loadNotifications();
  }, [clinicId]);

  const createRule = async () => {
    if (!clinicId || !name) return;
    const res = await fetch(`${apiBase}/api/alerts/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinic_id: clinicId,
        name,
        event_type: eventType,
        channel,
        target: target || null,
        enabled: true,
      }),
    });
    if (res.ok) {
      setMessage("Regla creada.");
      setName("");
      setTarget("");
      loadRules();
    } else {
      setMessage("No se pudo crear.");
    }
  };

  const toggleRule = async (rule: AlertRule) => {
    await fetch(`${apiBase}/api/alerts/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    loadRules();
  };

  const deleteRule = async (ruleId: string) => {
    await fetch(`${apiBase}/api/alerts/rules/${ruleId}`, { method: "DELETE" });
    loadRules();
  };

  const testAlert = async () => {
    if (!clinicId) return;
    const res = await fetch(`${apiBase}/api/alerts/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinic_id: clinicId,
        event_type: eventType,
        payload: { demo: true },
      }),
    });
    if (res.ok) {
      setMessage("Alerta enviada.");
      loadNotifications();
    } else {
      setMessage("Error enviando alerta.");
    }
  };

  if (!ready) return null;
  if (role !== "admin") {
    return <div className="alerts-card">Sin permisos.</div>;
  }

  return (
    <div className="alerts-page">
      <header className="alerts-header">
        <div>
          <h1>Alertas</h1>
          <p>Reglas y notificaciones internas.</p>
        </div>
        <button className="ghost" onClick={testAlert}>
          Probar alerta
        </button>
      </header>

      <section className="alerts-card">
        <h2>Nueva regla</h2>
        <div className="grid">
          <input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            <option value="appointment_created">Turno creado</option>
            <option value="appointment_cancelled">Turno cancelado</option>
            <option value="appointment_confirmed">Turno confirmado</option>
            <option value="billing">Billing</option>
            <option value="backup_created">Backup creado</option>
          </select>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="webhook">Webhook</option>
          </select>
          <input
            placeholder="Destino (email/telefono/url)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        <button className="primary" onClick={createRule}>
          Crear regla
        </button>
        {message && <p className="message">{message}</p>}
      </section>

      <section className="alerts-card">
        <h2>Reglas activas</h2>
        {rules.length === 0 && <p>No hay reglas.</p>}
        <div className="rules">
          {rules.map((r) => (
            <div key={r.id} className="rule">
              <div>
                <strong>{r.name}</strong>
                <div className="meta">
                  {r.event_type} · {r.channel} · {r.target || "sin destino"}
                </div>
              </div>
              <div className="actions">
                <button className="ghost" onClick={() => toggleRule(r)}>
                  {r.enabled ? "Desactivar" : "Activar"}
                </button>
                <button className="danger" onClick={() => deleteRule(r.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="alerts-card">
        <h2>Notificaciones</h2>
        {notifications.length === 0 && <p>No hay alertas.</p>}
        <div className="notifications">
          {notifications.map((n) => (
            <div key={n.id} className="notification">
              <span>{n.created_at}</span>
              <span>{n.event_type}</span>
              <span>{n.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
