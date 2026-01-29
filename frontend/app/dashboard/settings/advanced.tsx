"use client";

import { useEffect, useState } from "react";
import { t } from "../../../lib/i18n";
import "./settings.css";

type BlockedPeriod = {
    start: string;
    end: string;
    reason?: string;
};

type Settings = {
    name: string;
    timezone: string;
    language: string;
    open_time: string;
    close_time: string;
    lunch_start?: string | null;
    lunch_end?: string | null;
    slot_minutes: number;
    work_days: number[];
    blocked_dates: string[];
    blocked_periods: BlockedPeriod[];
    max_appointments_per_day: number;
    max_appointments_per_slot: number;
    overbooking_extra_fee: number;
    overbooking_fee_type: "fixed" | "percent";
    bot_enabled: boolean;
    manual_mode: boolean;
    auto_reply_enabled: boolean;
    confirmation_required: boolean;
    reminder_24h: boolean;
    reminder_6h: boolean;
    allow_double_booking: boolean;
    double_booking_price_factor: number;
    buffer_between_appointments: number;
};

export default function AdvancedSettingsPage() {
    const [clinicId, setClinicId] = useState<string | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<
        "horarios" | "bloqueos" | "turnos" | "whatsapp" | "confirmacion"
    >("horarios");
    const [msg, setMsg] = useState("");
    const [msgType, setMsgType] = useState<"success" | "error" | "">("");
    const [loadError, setLoadError] = useState("");
    const [newBlockedDate, setNewBlockedDate] = useState("");
    const [newBlockedPeriod, setNewBlockedPeriod] = useState<BlockedPeriod>({
        start: "",
        end: "",
        reason: "Vacaciones",
    });

    const workDayNames = [
        "Lunes",
        "Martes",
        "Miercoles",
        "Jueves",
        "Viernes",
        "Sabado",
        "Domingo",
    ];
    const locale = (settings?.language || "es") as "es" | "en";
    const [timezones, setTimezones] = useState<string[]>([]);
    const apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:8000";

    const formatTimezoneLabel = (tz: string) => {
        try {
            const now = new Date();
            const tzDate = new Date(now.toLocaleString("en-US", { timeZone: tz }));
            const offsetMinutes = Math.round(
                (tzDate.getTime() - now.getTime()) / 60000
            );
            const sign = offsetMinutes >= 0 ? "+" : "-";
            const abs = Math.abs(offsetMinutes);
            const hours = String(Math.floor(abs / 60)).padStart(2, "0");
            const minutes = String(abs % 60).padStart(2, "0");
            return `${tz} (UTC${sign}${hours}:${minutes})`;
        } catch {
            return tz;
        }
    };

    useEffect(() => {
        if (typeof Intl !== "undefined" && (Intl as any).supportedValuesOf) {
            const zones = (Intl as any).supportedValuesOf("timeZone") as string[];
            setTimezones(zones);
        }
    }, []);

    useEffect(() => {
        const stored =
            typeof window !== "undefined"
                ? localStorage.getItem("active_clinic_id")
                : null;
        setClinicId(stored || "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112");
    }, []);

    const loadSettings = () => {
        if (!clinicId) return;
        setLoadError("");
        setLoading(true);
        fetch(`${apiBase}/api/clinic-settings/${clinicId}`)
            .then((res) => res.json())
            .then((data) => {
                setSettings({ language: "es", ...data });
                setLoading(false);
            })
            .catch((err) => {
                setLoadError(String(err));
                setLoading(false);
            });
    };

    useEffect(() => {
        if (!clinicId) return;
        loadSettings();
    }, [apiBase, clinicId]);

    const saveSettings = async () => {
        if (!settings) return;
        try {
            const res = await fetch(
                `${apiBase}/api/clinic-settings/${clinicId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(settings),
                }
            );
            if (res.ok) {
                setMsg(t(locale, "settings.saveOk"));
                setMsgType("success");
                setTimeout(() => setMsg(""), 3000);
            } else {
                setMsg(t(locale, "settings.saveError"));
                setMsgType("error");
            }
        } catch (err) {
            setMsg(t(locale, "settings.saveError") + ": " + String(err));
            setMsgType("error");
        }
    };

    const toggleWorkDay = (day: number) => {
        if (!settings) return;
        const updated = settings.work_days.includes(day)
            ? settings.work_days.filter((d) => d !== day)
            : [...settings.work_days, day];
        setSettings({ ...settings, work_days: updated });
    };

    const addBlockedDate = () => {
        if (!newBlockedDate || !settings) return;
        setSettings({
            ...settings,
            blocked_dates: [...(settings.blocked_dates || []), newBlockedDate],
        });
        setNewBlockedDate("");
    };

    const removeBlockedDate = (date: string) => {
        if (!settings) return;
        setSettings({
            ...settings,
            blocked_dates: settings.blocked_dates.filter((d) => d !== date),
        });
    };

    const addBlockedPeriod = () => {
        if (!newBlockedPeriod.start || !newBlockedPeriod.end || !settings) return;
        setSettings({
            ...settings,
            blocked_periods: [...(settings.blocked_periods || []), newBlockedPeriod],
        });
        setNewBlockedPeriod({ start: "", end: "", reason: "Vacaciones" });
    };

    const removeBlockedPeriod = (idx: number) => {
        if (!settings) return;
        setSettings({
            ...settings,
            blocked_periods: settings.blocked_periods.filter((_, i) => i !== idx),
        });
    };

    if (loading) return <div className="settings-loading">Cargando...</div>;
    if (!settings)
        return (
            <div className="settings-error">
                Error cargando {loadError ? `: ${loadError}` : ""}
                <div style={{ marginTop: 12 }}>
                    <button className="btn-save" onClick={loadSettings}>
                        Reintentar
                    </button>
                </div>
            </div>
        );

    return (
        <div className="advanced-settings-container">
            <div className="settings-header">
                <h1>{t(locale, "settings.title")}</h1>
                <p className="clinic-name">{settings.name || "Mi Clinica"}</p>
                {msg && <p className={`message ${msgType}`}>{msg}</p>}
            </div>

            <div className="settings-tabs">
                {["horarios", "bloqueos", "turnos", "whatsapp", "confirmacion"].map(
                    (tab) => (
                        <button
                            key={tab}
                            className={`tab ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab as any)}
                        >
                            {tab === "horarios" && t(locale, "settings.tab.hours")}
                            {tab === "bloqueos" && t(locale, "settings.tab.blocks")}
                            {tab === "turnos" && t(locale, "settings.tab.appointments")}
                            {tab === "whatsapp" && t(locale, "settings.tab.whatsapp")}
                            {tab === "confirmacion" && t(locale, "settings.tab.confirmation")}
                        </button>
                    )
                )}
            </div>

            <div className="settings-content">
                {activeTab === "horarios" && (
                    <div className="tab-pane">
                        <h2>Horarios</h2>
                        <div className="settings-section">
                            <label>{t(locale, "settings.timezone")}:</label>
                            {timezones.length > 0 ? (
                                <select
                                    value={settings.timezone}
                                    onChange={(e) =>
                                        setSettings({ ...settings, timezone: e.target.value })
                                    }
                                >
                                    {timezones.map((tz) => (
                                        <option key={tz} value={tz}>
                                            {formatTimezoneLabel(tz)}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={settings.timezone}
                                    onChange={(e) =>
                                        setSettings({ ...settings, timezone: e.target.value })
                                    }
                                />
                            )}
                        </div>
                        <div className="settings-section">
                            <label>{t(locale, "settings.language")}:</label>
                            <select
                                value={settings.language}
                                onChange={(e) =>
                                    setSettings({ ...settings, language: e.target.value })
                                }
                            >
                                <option value="es">Espanol</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                        <div className="settings-row">
                            <div className="settings-section">
                                <label>Hora Apertura:</label>
                                <input
                                    type="time"
                                    value={settings.open_time}
                                    onChange={(e) =>
                                        setSettings({ ...settings, open_time: e.target.value })
                                    }
                                />
                            </div>
                            <div className="settings-section">
                                <label>Hora Cierre:</label>
                                <input
                                    type="time"
                                    value={settings.close_time}
                                    onChange={(e) =>
                                        setSettings({ ...settings, close_time: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="settings-row">
                            <div className="settings-section">
                                <label>Inicio Almuerzo:</label>
                                <input
                                    type="time"
                                    value={settings.lunch_start || ""}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            lunch_start: e.target.value || null,
                                        })
                                    }
                                />
                            </div>
                            <div className="settings-section">
                                <label>Fin Almuerzo:</label>
                                <input
                                    type="time"
                                    value={settings.lunch_end || ""}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            lunch_end: e.target.value || null,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="settings-section">
                            <label>Dias laborales:</label>
                            <div className="work-days-selector">
                                {workDayNames.map((dayName, idx) => (
                                    <button
                                        key={dayName}
                                        className={
                                            settings.work_days.includes(idx)
                                                ? "day-button active"
                                                : "day-button"
                                        }
                                        onClick={() => toggleWorkDay(idx)}
                                    >
                                        {dayName}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="settings-footer">
                            <button className="btn-save" onClick={saveSettings}>
                                Guardar
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "bloqueos" && (
                    <div className="tab-pane">
                        <h2>Bloqueos</h2>
                        <div className="settings-section">
                            <label>Fecha bloqueada:</label>
                            <div className="blocked-input-group">
                                <input
                                    type="date"
                                    value={newBlockedDate}
                                    onChange={(e) => setNewBlockedDate(e.target.value)}
                                />
                                <button className="btn-add" onClick={addBlockedDate}>
                                    Agregar
                                </button>
                            </div>
                            <ul className="blocked-list">
                                {(settings.blocked_dates || []).map((date) => (
                                    <li key={date} className="blocked-item">
                                        <span>{date}</span>
                                        <button
                                            className="btn-remove"
                                            onClick={() => removeBlockedDate(date)}
                                        >
                                            Eliminar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="settings-section">
                            <label>Periodo bloqueado:</label>
                            <div className="period-input-group">
                                <div>
                                    <label>Inicio</label>
                                    <input
                                        type="date"
                                        value={newBlockedPeriod.start}
                                        onChange={(e) =>
                                            setNewBlockedPeriod({
                                                ...newBlockedPeriod,
                                                start: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label>Fin</label>
                                    <input
                                        type="date"
                                        value={newBlockedPeriod.end}
                                        onChange={(e) =>
                                            setNewBlockedPeriod({
                                                ...newBlockedPeriod,
                                                end: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <button className="btn-add" onClick={addBlockedPeriod}>
                                    Agregar
                                </button>
                            </div>
                            <ul className="blocked-list">
                                {(settings.blocked_periods || []).map((period, idx) => (
                                    <li key={`${period.start}-${idx}`} className="blocked-period-item">
                                        <div>
                                            <strong>{period.start}</strong> - {period.end}
                                            {period.reason ? <div>{period.reason}</div> : null}
                                        </div>
                                        <button
                                            className="btn-remove"
                                            onClick={() => removeBlockedPeriod(idx)}
                                        >
                                            Eliminar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="settings-footer">
                            <button className="btn-save" onClick={saveSettings}>
                                Guardar
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "turnos" && (
                    <div className="tab-pane">
                        <h2>Turnos</h2>
                        <div className="settings-row">
                            <div className="settings-section">
                                <label>{t(locale, "settings.turns.duration")}:</label>
                                <input
                                    type="number"
                                    min="10"
                                    max="120"
                                    value={settings.slot_minutes}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            slot_minutes: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>
                            <div className="settings-section">
                                <label>{t(locale, "settings.turns.maxPerDay")}:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={settings.max_appointments_per_day}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            max_appointments_per_day: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>
                            <div className="settings-section">
                                <label>{t(locale, "settings.turns.maxPerSlot")}:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={settings.max_appointments_per_slot}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            max_appointments_per_slot: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="settings-section">
                            <label>{t(locale, "settings.turns.buffer")}:</label>
                            <input
                                type="number"
                                min="0"
                                value={settings.buffer_between_appointments}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        buffer_between_appointments: Number(e.target.value),
                                    })
                                }
                            />
                        </div>
                        <div className="settings-section">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={settings.allow_double_booking}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            allow_double_booking: e.target.checked,
                                        })
                                    }
                                />
                                {t(locale, "settings.turns.allowOver")}
                            </label>
                            {settings.allow_double_booking && (
                                <div className="settings-section indented">
                                    <label>{t(locale, "settings.turns.extraFee")}:</label>
                                    <div className="settings-row">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={settings.overbooking_extra_fee}
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    overbooking_extra_fee: Number(e.target.value),
                                                })
                                            }
                                        />
                                        <select
                                            value={settings.overbooking_fee_type}
                                            onChange={(e) =>
                                                setSettings({
                                                    ...settings,
                                                    overbooking_fee_type: e.target.value as
                                                        | "fixed"
                                                        | "percent",
                                                })
                                            }
                                        >
                                            <option value="fixed">
                                                {t(locale, "settings.fixed")}
                                            </option>
                                            <option value="percent">
                                                {t(locale, "settings.percent")}
                                            </option>
                                        </select>
                                    </div>
                                    <small>{t(locale, "settings.turns.extraFeeHint")}</small>
                                </div>
                            )}
                        </div>
                        <div className="settings-footer">
                            <button className="btn-save" onClick={saveSettings}>
                                Guardar
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "whatsapp" && (
                    <div className="tab-pane">
                        <h2>WhatsApp</h2>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.bot_enabled}
                                onChange={(e) =>
                                    setSettings({ ...settings, bot_enabled: e.target.checked })
                                }
                            />
                            Bot activo
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.auto_reply_enabled}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        auto_reply_enabled: e.target.checked,
                                    })
                                }
                            />
                            Respuestas automaticas
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.manual_mode}
                                onChange={(e) =>
                                    setSettings({ ...settings, manual_mode: e.target.checked })
                                }
                            />
                            Modo manual
                        </label>
                        <div className="settings-footer">
                            <button className="btn-save" onClick={saveSettings}>
                                Guardar
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "confirmacion" && (
                    <div className="tab-pane">
                        <h2>Confirmacion</h2>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.confirmation_required}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        confirmation_required: e.target.checked,
                                    })
                                }
                            />
                            Requerir confirmacion
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.reminder_24h}
                                onChange={(e) =>
                                    setSettings({ ...settings, reminder_24h: e.target.checked })
                                }
                            />
                            Recordatorio 24h
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.reminder_6h}
                                onChange={(e) =>
                                    setSettings({ ...settings, reminder_6h: e.target.checked })
                                }
                            />
                            Recordatorio 6h
                        </label>
                        <div className="settings-footer">
                            <button className="btn-save" onClick={saveSettings}>
                                Guardar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
