"use client";

import { useRef } from "react";

export function useAvailabilityCache() {
  const cacheRef = useRef<Map<string, any>>(new Map());
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  const getSlots = async (clinicId: string, date: string, treatmentId: string) => {
    const key = `${clinicId}_${date}_${treatmentId}`;
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key);
    }

    const response = await fetch(
      `${apiBase}/api/availability/slots?clinic_id=${clinicId}&date=${date}&treatment_id=${treatmentId}`
    );
    const data = await response.json();
    cacheRef.current.set(key, data);

    setTimeout(() => {
      cacheRef.current.delete(key);
    }, 5 * 60 * 1000);

    return data;
  };

  const clearCache = () => {
    cacheRef.current.clear();
  };

  return { getSlots, clearCache };
}
