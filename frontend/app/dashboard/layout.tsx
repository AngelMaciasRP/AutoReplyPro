"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import "./dashboard.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const navItems = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/calendar", label: "Calendario" },
  { href: "/dashboard/patients", label: "Pacientes" },
  { href: "/dashboard/playbooks", label: "Playbooks" },
  { href: "/dashboard/messages", label: "Mensajeria" },
  { href: "/dashboard/automations", label: "Automatizaciones" },
  { href: "/dashboard/roles", label: "Roles" },
  { href: "/dashboard/audit", label: "Auditoria" },
  { href: "/dashboard/settings", label: "Configuracion" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/metrics", label: "Metricas" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("admin");
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  useEffect(() => {
    const checkAuthAndClinic = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: clinic, error } = await supabase
        .from("clinic_settings")
        .select("clinic_id")
        .eq("clinic_id", user.id)
        .maybeSingle();

      if (error || !clinic) {
        router.replace("/onboarding");
        return;
      }

      localStorage.setItem("active_clinic_id", clinic.clinic_id);
      if (user?.id) {
        localStorage.setItem("active_user_id", user.id);
      }
      const isPrimaryAdmin = user?.id === clinic.clinic_id;
      localStorage.setItem("is_primary_admin", isPrimaryAdmin ? "true" : "false");
      if (user?.email) {
        localStorage.setItem("active_user_email", user.email);
        try {
          const res = await fetch(
            `${apiBase}/api/clinic-users?clinic_id=${clinic.clinic_id}&email=${encodeURIComponent(
              user.email
            )}`
          );
          const data = await res.json();
          const roleName = data?.users?.[0]?.role || "admin";
          localStorage.setItem("user_role", roleName);
          setRole(roleName);
        } catch {
          localStorage.setItem("user_role", "admin");
          setRole("admin");
        }
      }
      setLoading(false);
    };

    checkAuthAndClinic();
  }, [router]);

  if (loading) {
    return <p style={{ padding: 20 }}>Cargando dashboard...</p>;
  }

  const allowedNav =
    role === "admin"
      ? navItems
      : role === "recepcion"
      ? navItems.filter((item) =>
          ["/dashboard/calendar", "/dashboard/patients", "/dashboard/messages"].includes(
            item.href
          )
        )
      : role === "doctor"
      ? navItems.filter((item) =>
          ["/dashboard/calendar", "/dashboard/patients", "/dashboard/playbooks"].includes(
            item.href
          )
        )
      : [];

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">AR</div>
          <div>
            <strong>AutoReplyPro</strong>
            <small>Clinica digital</small>
          </div>
        </div>
        <nav className="nav">
          {allowedNav.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="dashboard-content">{children}</main>
    </div>
  );
}
