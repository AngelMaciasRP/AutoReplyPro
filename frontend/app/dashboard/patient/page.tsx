"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    const { data } = await supabase.from("patients").select("*");
    setPatients(data);
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Pacientes</h1>

      <ul className="space-y-3">
        {patients.map((p) => (
          <li key={p.id} className="p-3 bg-white shadow rounded">
            <p className="font-semibold">{p.name}</p>
            <p>{p.phone}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
