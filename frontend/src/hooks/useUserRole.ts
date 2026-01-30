"use client";

import { useEffect, useState } from "react";

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("user_role");
    setRole(stored || "admin");
  }, []);

  return { role, ready: role !== null };
}
