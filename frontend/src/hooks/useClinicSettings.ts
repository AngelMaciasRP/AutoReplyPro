"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useClinic } from "./useClinic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type ClinicSettings = {
  timezone: string;
  work_days: number[];
  work_start: string;
  work_end: string;
  slot_minutes: number;
  bot_enabled: boolean;
};

export function useClinicSettings() {
  const { clinicId } = useClinic();
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("clinic_settings")
        .select("*")
        .eq("clinic_id", clinicId)
        .single();

      if (!data && !error) {
        // crear configuración por defecto
        const { data: created } = await supabase
          .from("clinic_settings")
          .insert({ clinic_id: clinicId })
          .select()
          .single();

        setSettings(created);
      } else {
        setSettings(data);
      }

      setLoading(false);
    };

    load();
  }, [clinicId]);

  const updateSettings = async (patch: Partial<ClinicSettings>) => {
    if (!clinicId) return;

    const { data } = await supabase
      .from("clinic_settings")
      .update(patch)
      .eq("clinic_id", clinicId)
      .select()
      .single();

    setSettings(data);
  };

  return { settings, loading, updateSettings };
}
