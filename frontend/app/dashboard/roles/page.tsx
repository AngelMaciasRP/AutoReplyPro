"use client";

import { useEffect, useState } from "react";
import { useUserRole } from "@/src/hooks/useUserRole";
import "./roles.css";

type Role = {
  name: string;
  description: string;
  permissions: string[];
};

type ClinicUser = {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at?: string;
};

export default function RolesPage() {
  const { role, ready } = useUserRole();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("recepcion");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("active_clinic_id");
    setClinicId(stored || "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112");
    setIsPrimaryAdmin(localStorage.getItem("is_primary_admin") === "true");
  }, []);

  const load = async () => {
    if (!clinicId) return;
    setLoading(true);
    const [rolesRes, usersRes] = await Promise.all([
      fetch(`${apiBase}/api/roles`).then((r) => r.json()),
      fetch(`${apiBase}/api/clinic-users?clinic_id=${clinicId}`).then((r) => r.json()),
    ]);
    setRoles(rolesRes.roles || []);
    setUsers(usersRes.users || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [clinicId]);

  const inviteUser = async () => {
    if (!isPrimaryAdmin) {
      setMessage("Solo el admin principal puede invitar o cambiar roles.");
      return;
    }
    if (!email) return;
    setMessage(null);
    const res = await fetch(`${apiBase}/api/clinic-users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinic_id: clinicId,
        email,
        role: selectedRole,
      }),
    });
    if (res.ok) {
      setEmail("");
      setMessage("Invitacion creada.");
      load();
    } else {
      setMessage("No se pudo invitar.");
    }
  };

  const updateRole = async (userId: string, role: string) => {
    if (!isPrimaryAdmin) {
      setMessage("Solo el admin principal puede invitar o cambiar roles.");
      return;
    }
    setMessage(null);
    const res = await fetch(`${apiBase}/api/clinic-users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setMessage("Rol actualizado.");
      load();
    } else {
      setMessage("Error actualizando rol.");
    }
  };

  if (!ready) return null;
  if (role !== "admin") {
    return <div className="roles-loading">Sin permisos.</div>;
  }

  if (loading) return <div className="roles-loading">Cargando...</div>;

  return (
    <div className="roles-page">
      <header className="roles-header">
        <div>
          <h1>Roles y permisos</h1>
          <p>Administra usuarios por clinica y sus accesos.</p>
        </div>
        <div className="role-tags">
          {roles.map((r) => (
            <span key={r.name} className="role-tag">
              {r.name}
            </span>
          ))}
        </div>
      </header>

      <section className="invite-card">
        <h2>Invitar usuario</h2>
        {!isPrimaryAdmin && (
          <p className="message">
            Solo el admin principal puede invitar o cambiar roles.
          </p>
        )}
        <div className="invite-grid">
          <input
            placeholder="email@clinica.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isPrimaryAdmin}
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={!isPrimaryAdmin}
          >
            {roles.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
          <button className="primary" onClick={inviteUser} disabled={!isPrimaryAdmin}>
            Invitar
          </button>
        </div>
        {message && <p className="message">{message}</p>}
      </section>

      <section className="users-card">
        <h2>Usuarios de la clinica</h2>
        <div className="users-table">
          <div className="users-header">
            <span>Email</span>
            <span>Rol</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {users.map((u) => (
            <div key={u.id} className="users-row">
              <span>{u.email}</span>
              <select
                value={u.role}
                onChange={(e) => updateRole(u.id, e.target.value)}
                disabled={!isPrimaryAdmin}
              >
                {roles.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
              <span className={`status ${u.status}`}>{u.status}</span>
              <button
                className="ghost"
                onClick={() => updateRole(u.id, u.role)}
                disabled={!isPrimaryAdmin}
              >
                Guardar
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
