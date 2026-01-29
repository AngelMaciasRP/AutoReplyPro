"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Clinic = {
  id: string;
  name: string;
};

export function useClinic() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClinic = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Usuario no autenticado");
        setLoading(false);
        return;
      }

      const storedClinicId = localStorage.getItem("active_clinic_id");
      const clinicId = storedClinicId || user.id;

      if (!storedClinicId) {
        localStorage.setItem("active_clinic_id", clinicId);
      }

      const { data, error } = await supabase
        .from("clinic_settings")
        .select("clinic_id, name")
        .eq("clinic_id", clinicId)
        .maybeSingle();

      if (error) {
        setError("No se pudo cargar la clínica");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("No se pudo cargar la clínica");
        setLoading(false);
        return;
      }

      setClinic({ id: data.clinic_id, name: data.name });
      setLoading(false);
    };

    loadClinic();
  }, []);

  return {
    clinic,
    clinicId: clinic?.id ?? null,
    loading,
    error,
  };
}
