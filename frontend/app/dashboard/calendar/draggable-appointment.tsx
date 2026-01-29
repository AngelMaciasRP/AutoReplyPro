"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DraggableAppointmentProps {
  id: string;
  appointment: {
    id: string;
    patient_name: string;
    start_time: string;
    status: string;
    double_booked?: boolean;
  };
}

export function DraggableAppointment({ id, appointment }: DraggableAppointmentProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusColor =
    appointment.status === "confirmed"
      ? "bg-green-200"
      : appointment.status === "cancelled"
        ? "bg-red-200"
        : "bg-yellow-200";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-2 mb-2 rounded cursor-move ${statusColor} hover:shadow-lg ${
        isDragging ? "shadow-xl scale-105" : "shadow"
      } transition-all`}
    >
      <p className="font-semibold text-sm">{appointment.patient_name}</p>
      <p className="text-xs text-gray-600">{appointment.start_time}</p>
      {appointment.double_booked && (
        <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded mt-1 inline-block">
          Double Booked
        </span>
      )}
    </div>
  );
}
