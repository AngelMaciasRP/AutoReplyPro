"use client";

import { useEffect, useState } from "react";
import { useUserRole } from "@/src/hooks/useUserRole";
import "./automations.css";

type Rule = {
  id: string;
  name: string;
  trigger: string;
  channel: string;
  template: string;
  enabled: boolean;
};

export default function AutomationsPage() {
  const { role, ready } = useUserRole();
  const [clinicId, setClinicId] = useState<string | null>(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  const [rules, setRules] = useState<Rule[]>([]);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("appointment_created");
  const [channel, setChannel] = useState("whatsapp");
  const [template, setTemplate] = useState(
    "Hola {{patient_name}}, tu turno para {{date}} a las {{time}} fue registrado."
  );
  const [message, setMessage] = useState("");
  const [runDate, setRunDate] = useState(new Date().toISOString().split("T")[0]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("active_clinic_id");
    setClinicId(stored || "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112");
  }, []);

  const loadRules = async () => {
    if (!clinicId) return;
    const res = await fetch(`${apiBase}/api/automations?clinic_id=${clinicId}`);
    const data = await res.json();
    setRules(data.rules || []);
  };

  useEffect(() => {
    loadRules();
  }, [clinicId]);

  const createRule = async () => {
    if (!name.trim() || !template.trim()) return;
    const res = await fetch(`${apiBase}/api/automations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinic_id: clinicId,
        name,
        trigger,
        channel,
        template,
        enabled: true,
      }),
    });
    if (res.ok) {
      setMessage("Automatizacion creada.");
      setName("");
      await loadRules();
    } else {
      setMessage("No se pudo crear.");
    }
  };

  const toggleRule = async (rule: Rule) => {
    await fetch(`${apiBase}/api/automations/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    loadRules();
  };

  const removeRule = async (ruleId: string) => {
    await fetch(`${apiBase}/api/automations/${ruleId}`, {
      method: "DELETE",
    });
    loadRules();
  };

  const runAutomation = async () => {
    if (!clinicId) return;
    setMessage("");
    const res = await fetch(`${apiBase}/api/automations/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinic_id: clinicId,
        trigger,
        date: runDate,
      }),
    });
    if (res.ok) {
      setMessage("Automatizacion ejecutada.");
    } else {
      setMessage("Error ejecutando automatizacion.");
    }
  };

  if (!ready) return null;
  if (role !== "admin") {
    return <div className="card">Sin permisos.</div>;
  }

  return (
    <div className="automations-page">
      <header>
        <h1>Automatizaciones</h1>
        <p>Configura mensajes automaticos por evento.</p>
      </header>

      <section className="card">
        <h2>Nueva automatizacion</h2>
        <div className="grid">
          <input
            placeholder="Nombre de la regla"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
            <option value="appointment_created">Turno creado</option>
            <option value="appointment_confirmed">Turno confirmado</option>
            <option value="reminder_24h">Recordatorio 24h</option>
            <option value="reminder_6h">Recordatorio 6h</option>
          </select>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </select>
        </div>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={4}
        />
        <button className="primary" onClick={createRule}>
          Crear regla
        </button>
        {message && <p className="message">{message}</p>}
      </section>

      <section className="card">
        <h2>Ejecutar automatizacion</h2>
        <p>Para recordatorios o pruebas manuales.</p>
        <div className="grid">
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
            <option value="appointment_created">Turno creado</option>
            <option value="appointment_confirmed">Turno confirmado</option>
            <option value="reminder_24h">Recordatorio 24h</option>
            <option value="reminder_6h">Recordatorio 6h</option>
          </select>
          <input
            type="date"
            value={runDate}
            onChange={(e) => setRunDate(e.target.value)}
          />
          <button className="ghost" onClick={runAutomation}>
            Ejecutar ahora
          </button>
        </div>
        {message && <p className="message">{message}</p>}
      </section>

      <section className="card">
        <h2>Reglas activas</h2>
        {rules.length === 0 && <p>No hay reglas.</p>}
        <div className="rules">
          {rules.map((rule) => (
            <div key={rule.id} className="rule">
              <div>
                <strong>{rule.name}</strong>
                <div className="meta">
                  {rule.trigger} · {rule.channel}
                </div>
                <p>{rule.template}</p>
              </div>
              <div className="actions">
                <button className="ghost" onClick={() => toggleRule(rule)}>
                  {rule.enabled ? "Desactivar" : "Activar"}
                </button>
                <button className="danger" onClick={() => removeRule(rule.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
