"use client";

import { useEffect, useState } from "react";
import { useUserRole } from "@/src/hooks/useUserRole";
import "./backups.css";

type Backup = {
  id: string;
  clinic_id: string;
  label?: string | null;
  status: string;
  storage_url?: string | null;
  size_mb?: number | null;
  created_at: string;
};

export default function BackupsPage() {
  const { role, ready } = useUserRole();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [label, setLabel] = useState("");
  const [storageUrl, setStorageUrl] = useState("");
  const [sizeMb, setSizeMb] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("active_clinic_id");
    setClinicId(stored || "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112");
  }, []);

  const loadBackups = async () => {
    if (!clinicId) return;
    setLoading(true);
    const res = await fetch(`${apiBase}/api/backups?clinic_id=${clinicId}`);
    const data = await res.json();
    setBackups(Array.isArray(data?.backups) ? data.backups : []);
    setLoading(false);
  };

  useEffect(() => {
    loadBackups();
  }, [clinicId]);

  const createBackup = async () => {
    if (!clinicId) return;
    const res = await fetch(`${apiBase}/api/backups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinic_id: clinicId,
        label: label || "Backup manual",
        status: "completed",
        storage_url: storageUrl || null,
        size_mb: sizeMb ? Number(sizeMb) : null,
      }),
    });
    if (res.ok) {
      setMessage("Backup creado.");
      setLabel("");
      setStorageUrl("");
      setSizeMb("");
      loadBackups();
    } else {
      setMessage("No se pudo crear backup.");
    }
  };

  if (!ready) return null;
  if (role !== "admin") {
    return <div className="backup-card">Sin permisos.</div>;
  }

  return (
    <div className="backups-page">
      <header className="backups-header">
        <div>
          <h1>Backups</h1>
          <p>Respaldo y snapshots de la clinica.</p>
        </div>
        <button className="primary" onClick={createBackup}>
          Crear backup
        </button>
      </header>

      <section className="backup-card">
        <h2>Nuevo backup</h2>
        <div className="grid">
          <input
            placeholder="Etiqueta"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            placeholder="URL almacenamiento (opcional)"
            value={storageUrl}
            onChange={(e) => setStorageUrl(e.target.value)}
          />
          <input
            type="number"
            placeholder="Tamaño MB"
            value={sizeMb}
            onChange={(e) => setSizeMb(e.target.value)}
          />
        </div>
        {message && <p className="message">{message}</p>}
      </section>

      <section className="backup-card">
        <h2>Historial</h2>
        {loading && <p>Cargando...</p>}
        {!loading && backups.length === 0 && <p>No hay backups.</p>}
        {!loading && backups.length > 0 && (
          <div className="backup-table">
            <div className="backup-row header">
              <span>Fecha</span>
              <span>Estado</span>
              <span>Etiqueta</span>
              <span>URL</span>
            </div>
            {backups.map((b) => (
              <div key={b.id} className="backup-row">
                <span>{b.created_at}</span>
                <span>{b.status}</span>
                <span>{b.label || "-"}</span>
                <span className="url">{b.storage_url || "-"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
