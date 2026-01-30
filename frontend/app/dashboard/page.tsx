"use client";

import { useEffect, useMemo, useState } from "react";
import { useUserRole } from "@/src/hooks/useUserRole";
import "./dashboard-home.css";

type Appointment = {
  id: string;
  start_time: string;
  patient_name: string;
  treatment_id?: string;
};

type Treatment = {
  id: string;
  name: string;
};

export default function DashboardHome() {
  const { role, ready } = useUserRole();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("active_clinic_id");
    setClinicId(stored || "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112");
  }, []);

  useEffect(() => {
    if (!clinicId) return;
    if (role !== "admin") return;
    const load = async () => {
      setLoading(true);
      const [aptsRes, treatmentsRes] = await Promise.all([
        fetch(`${apiBase}/api/calendar/?clinic_id=${clinicId}&date=${todayStr}`).then(
          (r) => r.json()
        ),
        fetch(`${apiBase}/api/treatments?clinic_id=${clinicId}`).then((r) => r.json()),
      ]);
      setAppointments(Array.isArray(aptsRes) ? aptsRes : []);
      setTreatments(Array.isArray(treatmentsRes?.treatments) ? treatmentsRes.treatments : []);
      setLoading(false);
    };
    load();
  }, [apiBase, clinicId, todayStr, role]);

  const treatmentMap = useMemo(() => {
    const map = new Map<string, string>();
    treatments.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [treatments]);

  if (!ready) return null;
  if (role !== "admin") {
    return <div className="home-card">Sin permisos para ver el resumen.</div>;
  }

  return (
    <div className="dashboard-home">
      <header className="home-header">
        <div>
          <h1>Resumen</h1>
          <p>Turnos del dia {todayStr}</p>
        </div>
      </header>

      <section className="home-card">
        <h2>Agenda de hoy</h2>
        {loading && <p>Cargando turnos...</p>}
        {!loading && appointments.length === 0 && (
          <p className="empty">No hay turnos para hoy.</p>
        )}
        <div className="appointments">
          {appointments.map((apt) => (
            <div key={apt.id} className="appointment-row">
              <div className="time">{apt.start_time}</div>
              <div className="details">
                <strong>{apt.patient_name}</strong>
                <span>
                  {apt.treatment_id ? treatmentMap.get(apt.treatment_id) : "Sin tratamiento"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
