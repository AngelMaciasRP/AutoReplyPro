"use client";

import { useEffect, useState } from "react";
import "./billing.css";

type Plan = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  interval: string;
  limits?: Record<string, any>;
};

type Subscription = {
  id: string;
  clinic_id: string;
  plan_id: string;
  status: string;
  current_period_end?: string;
};

export default function BillingPage() {
  const clinicId =
    localStorage.getItem("active_clinic_id") ||
    "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112";

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [interval, setInterval] = useState("month");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    const [plansRes, subsRes] = await Promise.all([
      fetch(`${apiBase}/api/billing/plans`).then((r) => r.json()),
      fetch(`${apiBase}/api/billing/subscriptions?clinic_id=${clinicId}`).then((r) =>
        r.json()
      ),
    ]);
    setPlans(plansRes.plans || []);
    setSubs(subsRes.subscriptions || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const createPlan = async () => {
    if (!name || price <= 0) return;
    const res = await fetch(`${apiBase}/api/billing/plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price_cents: price,
        currency,
        interval,
        limits: {},
      }),
    });
    if (res.ok) {
      setMessage("Plan creado");
      setName("");
      setPrice(0);
      loadData();
    } else {
      setMessage("Error creando plan");
    }
  };

  const createSubscription = async (planId: string) => {
    const res = await fetch(`${apiBase}/api/billing/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinic_id: clinicId, plan_id: planId, status: "trial" }),
    });
    if (res.ok) {
      setMessage("Suscripcion creada");
      loadData();
    } else {
      setMessage("Error creando suscripcion");
    }
  };

  return (
    <div className="billing-page">
      <header>
        <h1>Billing</h1>
        <p>Planes y suscripciones por clinica.</p>
      </header>

      <section className="card">
        <h2>Crear plan</h2>
        <div className="grid">
          <input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Precio en centavos"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
          <select value={interval} onChange={(e) => setInterval(e.target.value)}>
            <option value="month">Mensual</option>
            <option value="year">Anual</option>
          </select>
        </div>
        <button className="primary" onClick={createPlan}>
          Crear
        </button>
        {message && <p className="message">{message}</p>}
      </section>

      <section className="card">
        <h2>Planes disponibles</h2>
        <div className="list">
          {plans.map((p) => (
            <div key={p.id} className="item">
              <div>
                <strong>{p.name}</strong>
                <div className="meta">
                  {p.price_cents} {p.currency} / {p.interval}
                </div>
              </div>
              <button className="ghost" onClick={() => createSubscription(p.id)}>
                Suscribirse
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Suscripciones</h2>
        <div className="list">
          {subs.map((s) => (
            <div key={s.id} className="item">
              <div>
                <strong>{s.status}</strong>
                <div className="meta">Plan: {s.plan_id}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
