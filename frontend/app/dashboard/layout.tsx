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
  { href: "/dashboard/messages", label: "Mensajeria" },
  { href: "/dashboard/automations", label: "Automatizaciones" },
  { href: "/dashboard/roles", label: "Roles" },
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
      setLoading(false);
    };

    checkAuthAndClinic();
  }, [router]);

  if (loading) {
    return <p style={{ padding: 20 }}>Cargando dashboard...</p>;
  }

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
          {navItems.map((item) => (
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
