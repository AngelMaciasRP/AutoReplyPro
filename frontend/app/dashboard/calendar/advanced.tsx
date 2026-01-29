"use client";

import { useEffect, useMemo, useState } from "react";
import { t } from "../../../lib/i18n";
import { useAvailabilityCache } from "@/src/hooks/useAvailabilityCache";
import { useDebounce } from "@/src/hooks/useDebounce";
import { useWebSocket } from "@/src/hooks/useWebSocket";
import "./calendar.css";

type Appointment = {
    id: string;
    date: string;
    start_time: string;
    end_time?: string;
    patient_name: string;
    treatment_id?: string;
    status?: string;
    double_booked?: boolean;
};

export default function AdvancedCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [treatments, setTreatments] = useState<any[]>([]);
    const [patientQuery, setPatientQuery] = useState<string>("");
    const [patientResults, setPatientResults] = useState<any[]>([]);
    const [allPatients, setAllPatients] = useState<any[]>([]);
    const [patientName, setPatientName] = useState("");
    const [patientId, setPatientId] = useState<string | null>(null);
    const [showCreatePatient, setShowCreatePatient] = useState(false);
    const [newPatientPhone, setNewPatientPhone] = useState("");
    const [newPatientEmail, setNewPatientEmail] = useState("");
    const [showPatientList, setShowPatientList] = useState(false);
    const [selectedTreatment, setSelectedTreatment] = useState<string>("");
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedAvailableSlot, setSelectedAvailableSlot] = useState<string>("");
    const [showModal, setShowModal] = useState(false);
    const [bookingMessage, setBookingMessage] = useState<string | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isBooking, setIsBooking] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const clinicId = "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112";
    const apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:8000";
    const locale = (settings?.language || "es") as "es" | "en";

    const availabilityCache = useAvailabilityCache();
    const socket = useWebSocket(clinicId);
    const ODONTO_TREATMENTS = [
        { id: "consulta-evaluacion", name: "Consulta y evaluacion" },
        { id: "limpieza-profilaxis", name: "Limpieza dental (profilaxis)" },
        { id: "destartraje", name: "Destartraje (sarros)" },
        { id: "fluor", name: "Aplicacion de fluor" },
        { id: "selladores", name: "Selladores de fosas y fisuras" },
        { id: "blanqueamiento", name: "Blanqueamiento dental" },
        { id: "resina-compuesta", name: "Obturacion con resina (composite)" },
        { id: "amalgama", name: "Obturacion con amalgama" },
        { id: "reconstruccion", name: "Reconstruccion dental" },
        { id: "incrustacion", name: "Incrustacion (inlay/onlay)" },
        { id: "endodoncia-uni", name: "Endodoncia (1 conducto)" },
        { id: "endodoncia-multi", name: "Endodoncia (2-4 conductos)" },
        { id: "retrata-endodoncia", name: "Retratamiento endodontico" },
        { id: "periodontitis", name: "Tratamiento periodontal" },
        { id: "gingivitis", name: "Tratamiento de gingivitis" },
        { id: "exodoncia-simple", name: "Extraccion simple" },
        { id: "exodoncia-quirurgica", name: "Extraccion quirurgica" },
        { id: "cordales", name: "Extraccion de cordales" },
        { id: "implante", name: "Implante dental" },
        { id: "corona", name: "Corona dental" },
        { id: "puente", name: "Puente fijo" },
        { id: "carilla", name: "Carillas (veneers)" },
        { id: "protesis-parcial", name: "Protesis parcial removible" },
        { id: "protesis-total", name: "Protesis total" },
        { id: "ortodoncia", name: "Ortodoncia" },
        { id: "ortodoncia-invisible", name: "Ortodoncia invisible (alineadores)" },
        { id: "bruxismo", name: "Placa de bruxismo" },
        { id: "guardas", name: "Guardas nocturnas" },
        { id: "rx-periapical", name: "Radiografia periapical" },
        { id: "rx-panoramica", name: "Radiografia panoramica" },
        { id: "urgencia", name: "Urgencia dental" }
    ];

    useEffect(() => {
        fetch(`${apiBase}/api/clinic-settings/${clinicId}`)
            .then((res) => res.json())
            .then((data) => setSettings(data))
            .catch((err) => console.error("Error cargando settings:", err));

        setTreatments(ODONTO_TREATMENTS);
        fetch(`${apiBase}/api/treatments?clinic_id=${clinicId}`)
            .then((res) => res.json())
            .then((data) => {
                const apiTreatments = Array.isArray(data?.treatments) ? data.treatments : [];
                if (apiTreatments.length > 0) {
                    setTreatments(apiTreatments);
                }
            })
            .catch((err) => console.error("Error cargando tratamientos:", err));

        fetch(`${apiBase}/api/patients?clinic_id=${clinicId}`)
            .then((res) => res.json())
            .then((data) => {
                const patients = Array.isArray(data?.patients) ? data.patients : [];
                setAllPatients(patients);
                setPatientResults(patients);
            })
            .catch((err) => console.error("Error cargando pacientes:", err));
    }, [apiBase]);

    const debouncedSearch = useDebounce((value: string) => {
        if (value.trim().length === 0) {
            setPatientResults(allPatients);
            return;
        }
        fetch(
            `${apiBase}/api/patients?clinic_id=${clinicId}&query=${encodeURIComponent(value)}`
        )
            .then((res) => res.json())
            .then((data) => {
                const results = Array.isArray(data?.patients) ? data.patients : [];
                setPatientResults(results);
                const exact = results.find(
                    (p: any) => p.full_name?.toLowerCase() === value.toLowerCase()
                );
                setPatientId(exact ? exact.id : null);
            })
            .catch((err) => console.error("Error buscando pacientes:", err));
    }, 400);

    useEffect(() => {
        debouncedSearch(patientQuery);
    }, [patientQuery, debouncedSearch]);

    const fetchAppointments = () => {
        if (!selectedDate) return;
        setLoading(true);
        fetch(`${apiBase}/api/calendar/?clinic_id=${clinicId}&date=${selectedDate}`)
            .then((res) => res.json())
            .then((data) => setAppointments(Array.isArray(data) ? data : []))
            .catch((err) => console.error("Error cargando turnos:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAppointments();
    }, [apiBase, clinicId, selectedDate]);

    useEffect(() => {
        const handleChange = () => {
            fetchAppointments();
        };

        window.addEventListener("appointment_changed", handleChange);
        return () => window.removeEventListener("appointment_changed", handleChange);
    }, [apiBase, clinicId, selectedDate]);

    useEffect(() => {
        if (!selectedDate) {
            setAvailableSlots([]);
            return;
        }
        setSlotsLoading(true);
        if (!selectedTreatment) {
            setAvailableSlots(generateDaySlots());
            setSlotsLoading(false);
            return;
        }
        availabilityCache
            .getSlots(clinicId, selectedDate, selectedTreatment)
            .then((data) => {
                const slots = Array.isArray(data?.available_slots)
                    ? data.available_slots
                    : Array.isArray(data?.slots)
                    ? data.slots
                    : [];
                setAvailableSlots(slots.length ? slots : generateDaySlots());
            })
            .catch((err) => console.error("Error cargando slots:", err))
            .finally(() => setSlotsLoading(false));
    }, [selectedDate, selectedTreatment]);

    const daySlots = useMemo(() => generateDaySlots(), [settings, selectedDate]);
    const sortedPatients = useMemo(
        () =>
            [...allPatients].sort((a: any, b: any) =>
                (a.full_name || "").localeCompare(b.full_name || "", "es", {
                    sensitivity: "base",
                })
            ),
        [allPatients]
    );

    const handleCreatePatient = () => {
        if (!patientName.trim()) {
            setModalError("Completa el nombre del paciente.");
            return;
        }
        fetch(`${apiBase}/api/patients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clinic_id: clinicId,
                full_name: patientName.trim(),
                phone: newPatientPhone || null,
                email: newPatientEmail || null,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data?.error || data?.detail) {
                    setModalError(data.error || data.detail);
                    return;
                }
                const created = data;
                setAllPatients((prev) => [created, ...prev]);
                setPatientResults((prev) => [created, ...prev]);
                setPatientId(created.id);
                setShowCreatePatient(false);
                setNewPatientPhone("");
                setNewPatientEmail("");
                setModalError(null);
            })
            .catch((err) => setModalError(`Error creando paciente: ${err}`));
    };

    const handleCreateAppointment = () => {
        if (
            !patientName ||
            !selectedDate ||
            !selectedAvailableSlot ||
            !selectedTreatment ||
            !patientId
        ) {
            setModalError(t(locale, "calendar.completeFields"));
            return;
        }
        setIsBooking(true);
        setModalError(null);
        setBookingMessage(null);
        fetch(`${apiBase}/api/appointments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clinic_id: clinicId,
                patient_id: patientId,
                patient_name: patientName,
                patient_phone: "",
                date: selectedDate,
                start_time: selectedAvailableSlot,
                treatment_id: selectedTreatment,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data?.error) {
                    setBookingMessage(data.error);
                    return;
                }
                setBookingMessage(t(locale, "calendar.created"));
                availabilityCache.clearCache();
                fetchAppointments();
                setPatientName("");
                setPatientId(null);
                setSelectedAvailableSlot("");
                if (socket) {
                    socket.emit("create_appointment", {
                        clinic_id: clinicId,
                        appointment_id: data?.appointment?.id,
                        date: selectedDate,
                        start_time: selectedAvailableSlot,
                    });
                }
            })
            .catch((err) => setBookingMessage(`Error creando turno: ${err}`))
            .finally(() => setIsBooking(false));
    };

    const renderMonthView = () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const daysInMonth = monthEnd.getDate();
        const days: Date[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
        }
        const firstWeekday = monthStart.getDay(); // 0=Sun
        const offset = (firstWeekday + 6) % 7; // make Monday=0

        return (
            <div className="calendar-month-view">
                <div className="month-weekdays">
                    {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((d) => (
                        <div key={d} className="month-weekday">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="month-grid">
                    {Array.from({ length: offset }).map((_, idx) => (
                        <div key={`blank-${idx}`} className="month-day blank" />
                    ))}
                    {days.map((date, idx) => {
                        const dateStr = date.toISOString().split("T")[0];
                        return (
                            <div
                                key={idx}
                                className={[
                                    "month-day",
                                    dateStr === selectedDate ? "selected" : "",
                                    dateStr === todayStr ? "today" : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                onClick={() => {
                                    setSelectedDate(dateStr);
                                    setShowModal(true);
                                }}
                            >
                                <div className="month-day-number">{date.getDate()}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDayAgenda = () => {
        const selectedAppointments = appointments || [];
        return (
            <div className="day-agenda">
                {daySlots.map((slot) => {
                    const apt = selectedAppointments.find((a) => a.start_time === slot);
                    return (
                        <div key={slot} className={apt ? "agenda-slot booked" : "agenda-slot"}>
                            <span className="slot-time">{slot}</span>
                            {apt ? (
                                <span className="slot-detail">{apt.patient_name}</span>
                            ) : (
                                <span className="slot-detail">Libre</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const monthLabel = currentDate.toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
    });
    const todayStr = new Date().toISOString().split("T")[0];
    const canSubmit =
        !!patientName &&
        !!selectedDate &&
        !!selectedAvailableSlot &&
        !!selectedTreatment &&
        !!patientId;

    if (loading && !appointments.length) return <div>Cargando calendario...</div>;

    return (
        <div className="advanced-calendar-container">
            <div className="calendar-actions center">
                <button
                    className="primary"
                    onClick={() => {
                        setShowModal(true);
                        setModalError(null);
                        setBookingMessage(null);
                        setSelectedAvailableSlot("");
                        setPatientResults(allPatients);
                    }}
                >
                    Crear turno
                </button>
            </div>

            <div className="month-header">
                <button
                    className="month-nav"
                    onClick={() =>
                        setCurrentDate(
                            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
                        )
                    }
                >
                    ?
                </button>
                <div className="month-title">{monthLabel}</div>
                <button
                    className="month-nav"
                    onClick={() =>
                        setCurrentDate(
                            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                        )
                    }
                >
                    ?
                </button>
            </div>
            {renderMonthView()}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal large">
                        <div className="modal-header">
                            <div>
                                <h3>Agenda del dia {selectedDate}</h3>
                                <p className="modal-subtitle">
                                    {appointments.length} turnos cargados
                                </p>
                            </div>
                            <button className="ghost" onClick={() => setShowModal(false)}>
                                Cerrar
                            </button>
                        </div>
                        <div className="modal-columns single">
                            <div className="modal-column">
                                {renderDayAgenda()}
                            </div>
                            <div className="modal-column">
                                <div className="modal-field">
                                    <label>Nombre completo</label>
                                    <input
                                        value={patientName}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setPatientName(value);
                                            setPatientQuery(value);
                                            const exact = allPatients.find(
                                                (p: any) =>
                                                    p.full_name?.toLowerCase() === value.toLowerCase()
                                            );
                                            setPatientId(exact ? exact.id : null);
                                        }}
                                        list="patient-suggestions"
                                        placeholder="Buscar paciente..."
                                    />
                                    <datalist id="patient-suggestions">
                                        {patientResults.map((p: any) => (
                                            <option key={p.id} value={p.full_name} />
                                        ))}
                                    </datalist>
                                    <button
                                        type="button"
                                        className="ghost"
                                        onClick={() => setShowPatientList((prev) => !prev)}
                                        style={{ marginTop: 8, alignSelf: "flex-start" }}
                                    >
                                        {showPatientList
                                            ? "Ocultar lista"
                                            : "Ver lista de pacientes"}
                                    </button>
                                    {!patientId && patientName.trim().length > 1 && (
                                        <button
                                            type="button"
                                            className="ghost"
                                            onClick={() => setShowCreatePatient((prev) => !prev)}
                                            style={{ marginTop: 8, alignSelf: "flex-start" }}
                                        >
                                            Registrar paciente
                                        </button>
                                    )}
                                </div>
                                {showPatientList && (
                                    <div className="patient-list">
                                        {sortedPatients.map((p: any) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                className="patient-list-item"
                                                onClick={() => {
                                                    setPatientName(p.full_name);
                                                    setPatientId(p.id);
                                                    setPatientQuery(p.full_name);
                                                }}
                                            >
                                                <span>{p.full_name}</span>
                                                {p.phone ? (
                                                    <small>{p.phone}</small>
                                                ) : (
                                                    <small>sin telefono</small>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {showCreatePatient && (
                                    <div className="modal-field">
                                        <label>Telefono (opcional)</label>
                                        <input
                                            value={newPatientPhone}
                                            onChange={(e) => setNewPatientPhone(e.target.value)}
                                            placeholder="Telefono"
                                        />
                                        <label>Email (opcional)</label>
                                        <input
                                            value={newPatientEmail}
                                            onChange={(e) => setNewPatientEmail(e.target.value)}
                                            placeholder="Email"
                                        />
                                        <button
                                            type="button"
                                            className="primary"
                                            onClick={handleCreatePatient}
                                        >
                                            Guardar paciente
                                        </button>
                                    </div>
                                )}
                                <div className="modal-field">
                                    <label>Tratamiento</label>
                                    <select
                                        value={selectedTreatment}
                                        onChange={(e) => setSelectedTreatment(e.target.value)}
                                    >
                                        <option value="">Seleccionar tratamiento</option>
                                        {treatments.map((t: any) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="modal-field">
                                    <label>Fecha</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </div>
                                <div className="modal-field">
                                    <label>Hora</label>
                                    <select
                                        value={selectedAvailableSlot}
                                        onChange={(e) => setSelectedAvailableSlot(e.target.value)}
                                    >
                                        <option value="">
                                            {slotsLoading
                                                ? "Cargando..."
                                                : availableSlots.length
                                                ? "Seleccionar"
                                                : "Sin horarios disponibles"}
                                        </option>
                                        {availableSlots.map((slot) => (
                                            <option key={slot} value={slot}>
                                                {slot}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        onClick={() => {
                                            setPatientName("");
                                            setPatientQuery("");
                                            setPatientId(null);
                                            setSelectedTreatment("");
                                            setSelectedAvailableSlot("");
                                            setBookingMessage(null);
                                            setModalError(null);
                                        }}
                                    >
                                        Limpiar
                                    </button>
                                    <button
                                        className="primary"
                                        onClick={handleCreateAppointment}
                                        disabled={!canSubmit || isBooking}
                                    >
                                        {isBooking ? "Creando..." : "Crear"}
                                    </button>
                                </div>
                                {modalError && (
                                    <span className="booking-message">{modalError}</span>
                                )}
                                {bookingMessage && (
                                    <span className="booking-message">{bookingMessage}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    function generateDaySlots() {
        if (!settings) return [] as string[];
        const slots: string[] = [];
        const start = settings.open_time.split(":");
        const end = settings.close_time.split(":");
        const duration = settings.slot_minutes || 30;

        let hour = parseInt(start[0]);
        let min = parseInt(start[1]);
        const endHour = parseInt(end[0]);
        const endMin = parseInt(end[1]);

        while (hour < endHour || (hour == endHour && min < endMin)) {
            slots.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
            min += duration;
            if (min >= 60) {
                hour += Math.floor(min / 60);
                min = min % 60;
            }
        }
        return slots;
    }
}
