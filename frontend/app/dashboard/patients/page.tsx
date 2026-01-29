"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { t } from "../../../lib/i18n";
import "./patients.css";

type Patient = {
  id: string;
  clinic_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  dob?: string;
  address?: string;
  notes?: string;
  metadata?: Record<string, any>;
};

type HistoryEntry = {
  id: string;
  treatment_id?: string;
  appointment_id?: string;
  notes?: string;
  visited_at?: string;
  next_treatment_id?: string;
  next_visit_at?: string;
};

type PatientFile = {
  id: string;
  file_url: string;
  file_type?: string;
  taken_at?: string;
  notes?: string;
};

export default function PatientsPage() {
  const [clinicId, setClinicId] = useState<string>(
    "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112"
  );
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [locale, setLocale] = useState<"es" | "en">("es");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    dob: "",
    address: "",
    notes: "",
  });

  const [historyForm, setHistoryForm] = useState({
    treatment_id: "",
    notes: "",
    visited_at: "",
    next_treatment_id: "",
    next_visit_at: "",
  });

  const [fileForm, setFileForm] = useState({
    file: null as File | null,
    file_type: "panoramica",
    taken_at: "",
    notes: "",
  });

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("active_clinic_id") : null;
    if (stored) {
      setClinicId(stored);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [clinicId]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/clinic-settings/${clinicId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.language) {
          setLocale(data.language);
        }
      })
      .catch(() => setLocale("es"));
  }, [clinicId]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/treatments?clinic_id=${clinicId}`)
      .then((res) => res.json())
      .then((data) => setTreatments(Array.isArray(data?.treatments) ? data.treatments : []))
      .catch(() => setTreatments([]));
  }, [clinicId]);

  const loadPatients = (search?: string) => {
    const searchQuery = search ?? query;
    const url = new URL("http://localhost:8000/api/patients");
    url.searchParams.set("clinic_id", clinicId);
    if (searchQuery.trim()) {
      url.searchParams.set("query", searchQuery.trim());
    }

    fetch(url.toString())
      .then((res) => res.json())
      .then((data) => setPatients(Array.isArray(data?.patients) ? data.patients : []))
      .catch(() => setPatients([]));
  };

  const loadPatientDetail = (patientId: string) => {
    const url = new URL(`http://localhost:8000/api/patients/${patientId}`);
    url.searchParams.set("clinic_id", clinicId);

    fetch(url.toString())
      .then((res) => res.json())
      .then((data) => {
        setSelectedPatient(data.patient);
        setIsEditing(false);
        setShowCreateForm(false);
        setHistory(Array.isArray(data?.history) ? data.history : []);
        setFiles(Array.isArray(data?.files) ? data.files : []);
        if (data.patient) {
          setForm({
            full_name: data.patient.full_name || "",
            phone: data.patient.phone || "",
            email: data.patient.email || "",
            dob: data.patient.dob || "",
            address: data.patient.address || "",
            notes: data.patient.notes || "",
          });
        }
      })
      .catch(() => {
        setSelectedPatient(null);
        setHistory([]);
        setFiles([]);
      });
  };

  const handleCreatePatient = () => {
    setMessage(null);
    fetch("http://localhost:8000/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinic_id: clinicId, ...form }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          setMessage("Paciente creado.");
          setIsEditing(true);
          setShowCreateForm(true);
          loadPatients();
          loadPatientDetail(data.id);
        } else {
          setMessage(data?.detail || "No se pudo crear paciente.");
        }
      })
      .catch((err) => setMessage(`Error: ${err}`));
  };

  const handleUpdatePatient = () => {
    if (!selectedPatient) return;
    setMessage(null);
    fetch(`http://localhost:8000/api/patients/${selectedPatient.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          setMessage("Paciente actualizado.");
          loadPatients();
          loadPatientDetail(data.id);
        } else {
          setMessage(data?.detail || "No se pudo actualizar.");
        }
      })
      .catch((err) => setMessage(`Error: ${err}`));
  };

  const handleAddHistory = () => {
    if (!selectedPatient) return;
    setMessage(null);
    fetch(`http://localhost:8000/api/patients/${selectedPatient.id}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinic_id: clinicId, ...historyForm }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          setMessage("Historia guardada.");
          loadPatientDetail(selectedPatient.id);
          setHistoryForm({
            treatment_id: "",
            notes: "",
            visited_at: "",
            next_treatment_id: "",
            next_visit_at: "",
          });
        } else {
          setMessage(data?.detail || "No se pudo guardar historia.");
        }
      })
      .catch((err) => setMessage(`Error: ${err}`));
  };

  const handleUploadFile = async () => {
    if (!selectedPatient || !fileForm.file) return;
    setMessage(null);

    const storagePath = `${clinicId}/${selectedPatient.id}/${Date.now()}-${fileForm.file.name}`;
    const upload = await supabase.storage
      .from("patient-files")
      .upload(storagePath, fileForm.file, { upsert: true });

    if (upload.error) {
      setMessage(`Error subiendo archivo: ${upload.error.message}`);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("patient-files")
      .getPublicUrl(storagePath);

    const fileUrl = publicData?.publicUrl || "";

    fetch(`http://localhost:8000/api/patients/${selectedPatient.id}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinic_id: clinicId,
        file_url: fileUrl,
        storage_path: storagePath,
        file_name: fileForm.file.name,
        file_type: fileForm.file_type,
        taken_at: fileForm.taken_at || null,
        notes: fileForm.notes,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          setMessage("Archivo guardado.");
          loadPatientDetail(selectedPatient.id);
          setFileForm({ file: null, file_type: "panoramica", taken_at: "", notes: "" });
        } else {
          setMessage(data?.detail || "No se pudo guardar archivo.");
        }
      })
      .catch((err) => setMessage(`Error: ${err}`));
  };

  return (
    <div className="patients-page">
      <div className="patients-list">
        <h2>{t(locale, "patients.title")}</h2>
        <div className="search-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(locale, "patients.searchPlaceholder")}
          />
          <button type="button" onClick={() => loadPatients()}>
            {t(locale, "patients.search")}
          </button>
        </div>
        <ul>
          {patients.map((patient) => (
            <li key={patient.id}>
              <button type="button" onClick={() => loadPatientDetail(patient.id)}>
                <strong>{patient.full_name}</strong>
                <span>{patient.phone || patient.email || ""}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="patients-detail">
        <h2>{t(locale, "patients.detailTitle")}</h2>
        <div className="detail-actions">
          <button type="button" onClick={() => { setShowCreateForm(true); setIsEditing(true); setSelectedPatient(null); }}>
            {t(locale, "patients.create")}
          </button>
          {selectedPatient && (
            <button type="button" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? t(locale, "patients.save") : t(locale, "patients.edit")}
            </button>
          )}
        </div>
        {message && <p className="message">{message}</p>}

        {(showCreateForm || isEditing) && (
        <div className="form-card">
          <h3>{t(locale, "patients.mainData")}</h3>
          <div className="form-grid">
            <input
              placeholder={t(locale, "patients.fullName")}
              disabled={!isEditing}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <input
              placeholder={t(locale, "patients.phone")}
              disabled={!isEditing}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              placeholder={t(locale, "patients.email")}
              disabled={!isEditing}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="date"
              placeholder={t(locale, "patients.dob")}
              disabled={!isEditing}
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
            <input
              placeholder={t(locale, "patients.address")}
              disabled={!isEditing}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <textarea
              placeholder={t(locale, "patients.notes")}
              disabled={!isEditing}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="form-actions">
            {showCreateForm && (
            <button type="button" onClick={handleCreatePatient}>
              {t(locale, "patients.create")}
            </button>
            )}
            {isEditing && selectedPatient && (
            <button type="button" onClick={handleUpdatePatient}>
              {t(locale, "patients.save")}
            </button>
            )}
          </div>
        </div>
        )}

        {selectedPatient && (
          <>
            <div className="form-card">
              <h3>{t(locale, "patients.history")}</h3>
              <ul className="history-list">
                {history.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.treatment_id || "Tratamiento"}</strong>
                      <span>{item.visited_at || ""}</span>
                    </div>
                    <p>{item.notes}</p>
                    {item.next_visit_at && (
                      <small>Proximo: {item.next_visit_at}</small>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="form-card">
              <h3>{t(locale, "patients.files")}</h3>
              <div className="form-grid">
                <input
                  type="file"
                  onChange={(e) =>
                    setFileForm({ ...fileForm, file: e.target.files?.[0] || null })
                  }
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={handleUploadFile}>
                  {t(locale, "patients.upload")}
                </button>
              </div>
              <ul className="files-list">
                {files.map((file) => (
                  <li key={file.id}>
                    <a href={file.file_url} target="_blank" rel="noreferrer">
                      {file.file_type || "archivo"}
                    </a>
                    <span>{file.taken_at || ""}</span>
                    <small>{file.notes}</small>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
