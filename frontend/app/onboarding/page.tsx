"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./onboarding.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type WizardStep = "clinica" | "horarios" | "turnos" | "tratamientos";

type TreatmentOption = {
  id: string;
  name: string;
  duration_minutes: number;
  selected: boolean;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("clinica");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [timezones, setTimezones] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    language: "es",
    timezone: "America/Argentina/Buenos_Aires",
    open_time: "09:00",
    close_time: "18:00",
    lunch_start: "",
    lunch_end: "",
    work_days: [0, 1, 2, 3, 4],
    slot_minutes: 30,
    max_appointments_per_day: 20,
    buffer_between_appointments: 0,
    allow_double_booking: false,
    max_appointments_per_slot: 2,
    overbooking_extra_fee: 0,
    overbooking_fee_type: "fixed",
  });

  const [treatments, setTreatments] = useState<TreatmentOption[]>([]);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  const steps: WizardStep[] = [
    "clinica",
    "horarios",
    "turnos",
    "tratamientos",
  ];

  const stepIndex = steps.indexOf(step);

  const workDayNames = useMemo(
    () => ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"],
    []
  );

  const defaultTreatments: TreatmentOption[] = useMemo(
    () => [
      { id: "consulta-evaluacion", name: "Consulta y evaluacion", duration_minutes: 30, selected: true },
      { id: "limpieza-profilaxis", name: "Limpieza dental (profilaxis)", duration_minutes: 30, selected: true },
      { id: "destartraje", name: "Destartraje (sarros)", duration_minutes: 30, selected: true },
      { id: "fluor", name: "Aplicacion de fluor", duration_minutes: 20, selected: false },
      { id: "selladores", name: "Selladores de fosas y fisuras", duration_minutes: 30, selected: false },
      { id: "blanqueamiento", name: "Blanqueamiento dental", duration_minutes: 60, selected: false },
      { id: "resina-compuesta", name: "Obturacion con resina (composite)", duration_minutes: 30, selected: true },
      { id: "endodoncia-uni", name: "Endodoncia (1 conducto)", duration_minutes: 60, selected: false },
      { id: "periodontitis", name: "Tratamiento periodontal", duration_minutes: 45, selected: false },
      { id: "exodoncia-simple", name: "Extraccion simple", duration_minutes: 30, selected: false },
      { id: "implante", name: "Implante dental", duration_minutes: 90, selected: false },
      { id: "ortodoncia", name: "Ortodoncia", duration_minutes: 45, selected: false },
      { id: "urgencia", name: "Urgencia dental", duration_minutes: 20, selected: true },
    ],
    []
  );

  useEffect(() => {
    if (typeof Intl !== "undefined" && (Intl as any).supportedValuesOf) {
      const zones = (Intl as any).supportedValuesOf("timeZone") as string[];
      setTimezones(zones);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setClinicId(user.id);

      try {
        const res = await fetch(`${apiBase}/api/clinic-settings/${user.id}`);
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          ...data,
          lunch_start: data?.lunch_start || "",
          lunch_end: data?.lunch_end || "",
        }));
      } catch {
        // keep defaults
      }

      try {
        const res = await fetch(`${apiBase}/api/treatments?clinic_id=${user.id}`);
        const data = await res.json();
        const existing = Array.isArray(data?.treatments) ? data.treatments : [];
        if (existing.length) {
          const merged = defaultTreatments.map((t) => ({
            ...t,
            selected: existing.some((e: any) => e.name === t.name),
          }));
          setTreatments(merged);
        } else {
          setTreatments(defaultTreatments);
        }
      } catch {
        setTreatments(defaultTreatments);
      }

      setLoading(false);
    };

    init();
  }, [apiBase, defaultTreatments, router]);

  const formatTimezoneLabel = (tz: string) => {
    try {
      const now = new Date();
      const tzDate = new Date(now.toLocaleString("en-US", { timeZone: tz }));
      const offsetMinutes = Math.round((tzDate.getTime() - now.getTime()) / 60000);
      const sign = offsetMinutes >= 0 ? "+" : "-";
      const abs = Math.abs(offsetMinutes);
      const hours = String(Math.floor(abs / 60)).padStart(2, "0");
      const minutes = String(abs % 60).padStart(2, "0");
      return `${tz} (UTC${sign}${hours}:${minutes})`;
    } catch {
      return tz;
    }
  };

  const nextStep = () => {
    setError(null);
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const prevStep = () => {
    setError(null);
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  const toggleWorkDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      work_days: prev.work_days.includes(day)
        ? prev.work_days.filter((d) => d !== day)
        : [...prev.work_days, day],
    }));
  };

  const toggleTreatment = (id: string) => {
    setTreatments((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, selected: !t.selected } : t
      )
    );
  };

  const updateTreatmentDuration = (id: string, value: number) => {
    setTreatments((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, duration_minutes: value } : t
      )
    );
  };

  const handleFinish = async () => {
    if (!clinicId) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        lunch_start: form.lunch_start || null,
        lunch_end: form.lunch_end || null,
      };

      const res = await fetch(`${apiBase}/api/clinic-settings/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar la configuracion");
      }

      const listRes = await fetch(`${apiBase}/api/treatments?clinic_id=${clinicId}`);
      const listData = await listRes.json();
      const existing = Array.isArray(listData?.treatments)
        ? listData.treatments
        : [];

      const toCreate = treatments.filter(
        (t) =>
          t.selected &&
          !existing.some((e: any) => e.name === t.name)
      );

      for (const treatment of toCreate) {
        await fetch(`${apiBase}/api/treatments/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clinic_id: clinicId,
            name: treatment.name,
            duration_minutes: treatment.duration_minutes,
          }),
        });
      }

      localStorage.setItem("active_clinic_id", clinicId);
      router.replace("/dashboard/calendar");
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="onboarding-loading">Cargando onboarding...</div>;

  return (
    <div className="onboarding">
      <header className="onboarding-header">
        <div>
          <h1>Bienvenido a AutoReplyPro</h1>
          <p>Configura lo esencial en 3 minutos.</p>
        </div>
        <div className="progress">
          {steps.map((s, idx) => (
            <div
              key={s}
              className={`progress-step ${
                idx === stepIndex ? "active" : idx < stepIndex ? "done" : ""
              }`}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      </header>

      <div className="onboarding-card">
        {step === "clinica" && (
          <div className="step">
            <h2>Clinica</h2>
            <p>Completa los datos basicos de tu clinica.</p>
            <div className="grid">
              <label>
                Nombre de clinica
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Mi Clinica"
                />
              </label>
              <label>
                Idioma
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                >
                  <option value="es">Espanol</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="span-2">
                Zona horaria
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                >
                  {(timezones.length ? timezones : [form.timezone]).map((tz) => (
                    <option key={tz} value={tz}>
                      {formatTimezoneLabel(tz)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        {step === "horarios" && (
          <div className="step">
            <h2>Horarios</h2>
            <p>Define tu disponibilidad habitual.</p>
            <div className="grid">
              <label>
                Apertura
                <input
                  type="time"
                  value={form.open_time}
                  onChange={(e) => setForm({ ...form, open_time: e.target.value })}
                />
              </label>
              <label>
                Cierre
                <input
                  type="time"
                  value={form.close_time}
                  onChange={(e) => setForm({ ...form, close_time: e.target.value })}
                />
              </label>
              <label>
                Almuerzo inicio
                <input
                  type="time"
                  value={form.lunch_start}
                  onChange={(e) => setForm({ ...form, lunch_start: e.target.value })}
                />
              </label>
              <label>
                Almuerzo fin
                <input
                  type="time"
                  value={form.lunch_end}
                  onChange={(e) => setForm({ ...form, lunch_end: e.target.value })}
                />
              </label>
            </div>
            <div className="workdays">
              {workDayNames.map((day, idx) => (
                <button
                  key={day}
                  className={form.work_days.includes(idx) ? "day active" : "day"}
                  onClick={() => toggleWorkDay(idx)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "turnos" && (
          <div className="step">
            <h2>Turnos</h2>
            <p>Ajusta la duracion y limites.</p>
            <div className="grid">
              <label>
                Minutos por turno
                <select
                  value={form.slot_minutes}
                  onChange={(e) =>
                    setForm({ ...form, slot_minutes: Number(e.target.value) })
                  }
                >
                  {[10, 15, 20, 25, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} minutos
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Max por dia
                <input
                  type="number"
                  value={form.max_appointments_per_day}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_appointments_per_day: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Buffer (min)
                <input
                  type="number"
                  value={form.buffer_between_appointments}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      buffer_between_appointments: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Sobreturnos permitidos
                <select
                  value={form.allow_double_booking ? "si" : "no"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      allow_double_booking: e.target.value === "si",
                    })
                  }
                >
                  <option value="no">No</option>
                  <option value="si">Si</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {step === "tratamientos" && (
          <div className="step">
            <h2>Tratamientos</h2>
            <p>Selecciona tratamientos para mostrar en el calendario.</p>
            <div className="treatment-list">
              {treatments.map((t) => (
                <div key={t.id} className={`treatment-item ${t.selected ? "on" : ""}`}>
                  <button className="toggle" onClick={() => toggleTreatment(t.id)}>
                    {t.selected ? "✓" : "+"}
                  </button>
                  <div className="treatment-info">
                    <span>{t.name}</span>
                    <small>{t.duration_minutes} min</small>
                  </div>
                  <select
                    value={t.duration_minutes}
                    onChange={(e) =>
                      updateTreatmentDuration(t.id, Number(e.target.value))
                    }
                  >
                    {[10, 15, 20, 25, 30, 45, 60, 90, 120].map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <footer className="wizard-actions">
          <button className="ghost" onClick={() => router.replace("/dashboard/calendar")}>
            Saltar por ahora
          </button>
          <div className="actions">
            <button className="ghost" onClick={prevStep} disabled={stepIndex === 0}>
              Atras
            </button>
            {stepIndex < steps.length - 1 ? (
              <button className="primary" onClick={nextStep}>
                Continuar
              </button>
            ) : (
              <button className="primary" onClick={handleFinish} disabled={saving}>
                {saving ? "Guardando..." : "Finalizar"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
