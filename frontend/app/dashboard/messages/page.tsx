"use client";

import { useEffect, useState } from "react";
import { useUserRole } from "@/src/hooks/useUserRole";
import "./messages.css";

type Thread = {
  id: string;
  contact_number: string;
  contact_name?: string;
  channel: string;
  last_message_at?: string;
  status?: string;
};

type Message = {
  id: string;
  direction: "in" | "out";
  body: string;
  created_at: string;
};

export default function MessagesPage() {
  const { role, ready } = useUserRole();
  const clinicId =
    localStorage.getItem("active_clinic_id") ||
    "bbe2d079-55fc-45a7-8aeb-99bb7cfc7112";

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000";

  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");

  const loadThreads = async () => {
    setLoading(true);
    const res = await fetch(
      `${apiBase}/api/messages/threads?clinic_id=${clinicId}`
    );
    const data = await res.json();
    setThreads(data.threads || []);
    setLoading(false);
  };

  const loadMessages = async (threadId: string) => {
    const res = await fetch(`${apiBase}/api/messages/threads/${threadId}`);
    const data = await res.json();
    setMessages(data.messages || []);
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThread) loadMessages(selectedThread.id);
  }, [selectedThread?.id]);

  const sendMessage = async () => {
    if (!selectedThread || !messageText.trim()) return;
    setError("");
    const res = await fetch(
      `${apiBase}/api/messages/threads/${selectedThread.id}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinicId,
          direction: "out",
          body: messageText.trim(),
        }),
      }
    );
    if (!res.ok) {
      setError("No se pudo enviar.");
      return;
    }
    setMessageText("");
    await loadMessages(selectedThread.id);
    await loadThreads();
  };

  const createThread = async () => {
    const number = prompt("Numero de contacto (+54...)");
    if (!number) return;
    const res = await fetch(`${apiBase}/api/messages/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinic_id: clinicId,
        contact_number: number,
        contact_name: "",
        channel: "whatsapp",
      }),
    });
    if (res.ok) {
      loadThreads();
    }
  };

  if (!ready) return null;
  if (role !== "admin" && role !== "recepcion") {
    return <div className="empty-chat">Sin permisos para mensajeria.</div>;
  }

  return (
    <div className="messages-page">
      <header className="messages-header">
        <h1>Mensajeria</h1>
        <button className="primary" onClick={createThread}>
          Nuevo chat
        </button>
      </header>

      <div className="messages-layout">
        <aside className="threads">
          {loading && <p>Cargando...</p>}
          {!loading && threads.length === 0 && (
            <p className="empty">No hay conversaciones.</p>
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              className={
                selectedThread?.id === t.id ? "thread active" : "thread"
              }
              onClick={() => setSelectedThread(t)}
            >
              <div className="thread-title">
                {t.contact_name || t.contact_number}
              </div>
              <div className="thread-meta">
                {t.channel} ·{" "}
                {t.last_message_at
                  ? new Date(t.last_message_at).toLocaleString()
                  : "-"}
              </div>
            </button>
          ))}
        </aside>

        <section className="chat">
          {!selectedThread && (
            <div className="empty-chat">Selecciona una conversacion.</div>
          )}
          {selectedThread && (
            <>
              <div className="chat-header">
                <h2>{selectedThread.contact_name || selectedThread.contact_number}</h2>
                <span>{selectedThread.channel}</span>
              </div>
              <div className="chat-body">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={m.direction === "out" ? "bubble out" : "bubble in"}
                  >
                    <p>{m.body}</p>
                    <span>{new Date(m.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escribe un mensaje..."
                />
                <button className="primary" onClick={sendMessage}>
                  Enviar
                </button>
              </div>
              {error && <p className="error">{error}</p>}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
