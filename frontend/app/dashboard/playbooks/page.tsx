"use client";

import { useEffect, useMemo, useState } from "react";
import { useUserRole } from "@/src/hooks/useUserRole";
import "./playbooks.css";

type Treatment = {
  id: string;
  name: string;
};

type Playbook = {
  id: string;
  clinic_id: string;
  treatment_id: string;
  title: string;
  description?: string | null;
  steps: string[];
  supplies: string[];
  duration_minutes?: number | null;
  notes_template?: string | null;
};

const DEFAULT_STEPS = [
  "Recepcion y anamnesis breve",
  "Evaluacion clinica",
  "Procedimiento principal",
  "Indicaciones post-tratamiento",
];

export default function PlaybooksPage() {
  const { role, ready } = useUserRole();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    steps: DEFAULT_STEPS.join("\n"),
    supplies: "Guantes\nMascarilla\nInstrumental",
    duration_minutes: "30",
    notes_template: "Evolucion: ...\nIndicaciones: ...",
  });
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

  useEffect(() => {
    if (!clinicId) return;
    fetch(`${apiBase}/api/treatments?clinic_id=${clinicId}`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data?.treatments) ? data.treatments : [];
        setTreatments(list);
        if (!selectedTreatmentId && list.length > 0) {
          setSelectedTreatmentId(list[0].id);
        }
      })
      .catch(() => setTreatments([]));
  }, [apiBase, clinicId]);

  const loadPlaybooks = () => {
    if (!clinicId) return;
    fetch(`${apiBase}/api/playbooks?clinic_id=${clinicId}`)
      .then((res) => res.json())
      .then((data) => setPlaybooks(Array.isArray(data?.playbooks) ? data.playbooks : []))
      .catch(() => setPlaybooks([]));
  };

  useEffect(() => {
    loadPlaybooks();
  }, [clinicId]);

  const currentPlaybook = useMemo(() => {
    return playbooks.find((p) => p.treatment_id === selectedTreatmentId) || null;
  }, [playbooks, selectedTreatmentId]);

  useEffect(() => {
    if (currentPlaybook) {
      setForm({
        title: currentPlaybook.title || "",
        description: currentPlaybook.description || "",
        steps: (currentPlaybook.steps || []).join("\n"),
        supplies: (currentPlaybook.supplies || []).join("\n"),
        duration_minutes: currentPlaybook.duration_minutes
          ? String(currentPlaybook.duration_minutes)
          : "30",
        notes_template: currentPlaybook.notes_template || "",
      });
    } else if (selectedTreatmentId) {
      const treatment = treatments.find((t) => t.id === selectedTreatmentId);
      setForm({
        title: treatment ? `Playbook: ${treatment.name}` : "Playbook",
        description: "",
        steps: DEFAULT_STEPS.join("\n"),
        supplies: "Guantes\nMascarilla\nInstrumental",
        duration_minutes: "30",
        notes_template: "Evolucion: ...\nIndicaciones: ...",
      });
    }
  }, [currentPlaybook, selectedTreatmentId, treatments]);

  const savePlaybook = async () => {
    if (!clinicId || !selectedTreatmentId) return;
    const payload = {
      clinic_id: clinicId,
      treatment_id: selectedTreatmentId,
      title: form.title.trim() || "Playbook",
      description: form.description.trim() || null,
      steps: form.steps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      supplies: form.supplies
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      duration_minutes: Number(form.duration_minutes) || null,
      notes_template: form.notes_template.trim() || null,
    };

    const url = currentPlaybook
      ? `${apiBase}/api/playbooks/${currentPlaybook.id}`
      : `${apiBase}/api/playbooks`;
    const method = currentPlaybook ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setMessage("Playbook guardado.");
      loadPlaybooks();
    } else {
      setMessage("Error al guardar.");
    }
  };

  const removePlaybook = async () => {
    if (!currentPlaybook) return;
    const ok = window.confirm("Eliminar playbook?");
    if (!ok) return;
    const res = await fetch(`${apiBase}/api/playbooks/${currentPlaybook.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMessage("Playbook eliminado.");
      loadPlaybooks();
    }
  };

  if (!ready) return null;
  if (role !== "admin" && role !== "doctor") {
    return <div className="playbook-card">Sin permisos.</div>;
  }

  return (
    <div className="playbooks-page">
      <header className="playbooks-header">
        <div>
          <h1>Playbooks odontologicos</h1>
          <p>Protocolos y checklist por tratamiento.</p>
        </div>
        <button className="primary" onClick={savePlaybook}>
          Guardar playbook
        </button>
      </header>

      <div className="playbooks-layout">
        <aside className="playbooks-sidebar">
          <h3>Tratamientos</h3>
          <div className="treatment-list">
            {treatments.map((t) => (
              <button
                key={t.id}
                className={
                  selectedTreatmentId === t.id ? "treatment active" : "treatment"
                }
                onClick={() => setSelectedTreatmentId(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="playbooks-editor">
          <div className="field">
            <label>Titulo</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Descripcion</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid">
            <div className="field">
              <label>Pasos (uno por linea)</label>
              <textarea
                rows={8}
                value={form.steps}
                onChange={(e) => setForm({ ...form, steps: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Insumos (uno por linea)</label>
              <textarea
                rows={8}
                value={form.supplies}
                onChange={(e) => setForm({ ...form, supplies: e.target.value })}
              />
            </div>
          </div>
          <div className="grid">
            <div className="field">
              <label>Duracion (min)</label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>Plantilla de evolucion</label>
              <textarea
                rows={3}
                value={form.notes_template}
                onChange={(e) =>
                  setForm({ ...form, notes_template: e.target.value })
                }
              />
            </div>
          </div>
          <div className="actions">
            <button className="ghost" onClick={removePlaybook} disabled={!currentPlaybook}>
              Eliminar
            </button>
            {message && <span className="message">{message}</span>}
          </div>
        </section>
      </div>
    </div>
  );
}
