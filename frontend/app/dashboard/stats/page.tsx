"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function StatsPage() {
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalPatients: 0,
    totalAppointments: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { count: messages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true });

    const { count: patients } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    const { count: appointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true });

    setStats({
      totalMessages: messages || 0,
      totalPatients: patients || 0,
      totalAppointments: appointments || 0,
    });
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Estadísticas</h1>

      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Mensajes" value={stats.totalMessages} />
        <StatCard label="Pacientes" value={stats.totalPatients} />
        <StatCard label="Turnos" value={stats.totalAppointments} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white p-6 rounded shadow text-center">
      <p className="text-gray-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
