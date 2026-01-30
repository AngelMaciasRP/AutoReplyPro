"use client";

import { useEffect, useState } from "react";
import { useUserRole } from "@/src/hooks/useUserRole";
import "./metrics.css";

type Metric = {
  label: string;
  value: string | number;
};

export default function MetricsPage() {
  const { role, ready } = useUserRole();
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);
    const res = await fetch(`${apiBase}/api/metrics`);
    const data = await res.json();
    const list: Metric[] = [{ label: "Health", value: data.ok ? "OK" : "Fail" }];
    setMetrics(list);
    setLoading(false);
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (!ready) return null;
  if (role !== "admin") {
    return <div className="card">Sin permisos.</div>;
  }

  return (
    <div className="metrics-page">
      <header>
        <h1>Metricas</h1>
        <button className="ghost" onClick={loadMetrics}>
          Recargar
        </button>
      </header>
      {loading && <p>Cargando...</p>}
      {!loading && (
        <div className="grid">
          {metrics.map((m) => (
            <div key={m.label} className="card">
              <span className="label">{m.label}</span>
              <strong>{m.value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
