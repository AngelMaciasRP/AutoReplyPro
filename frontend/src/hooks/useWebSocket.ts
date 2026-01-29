"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useWebSocket(clinicId: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:8000";
    socketRef.current = io(apiUrl, {
      auth: { clinic_id: clinicId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("appointment_rescheduled", (data) => {
      window.dispatchEvent(new CustomEvent("appointment_changed", { detail: data }));
    });

    socketRef.current.on("appointment_confirmed", (data) => {
      window.dispatchEvent(new CustomEvent("appointment_changed", { detail: data }));
    });

    socketRef.current.on("appointment_cancelled", (data) => {
      window.dispatchEvent(new CustomEvent("appointment_changed", { detail: data }));
    });

    socketRef.current.on("appointment_created", (data) => {
      window.dispatchEvent(new CustomEvent("appointment_changed", { detail: data }));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [clinicId]);

  return socketRef.current;
}
