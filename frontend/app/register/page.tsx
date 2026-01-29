// frontend/app/register/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);

    // 1️⃣ Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("🆕 signUp result:", { data, error });

    if (error) {
      setErrorMsg(error.message || "No se pudo registrar el usuario.");
      setLoading(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setErrorMsg("No se recibió el usuario desde Supabase.");
      setLoading(false);
      return;
    }

    // 2️⃣ Crear clínica vinculada
    const { error: clinicError } = await supabase.from("clinic_settings").insert({
      clinic_id: user.id,
      name: clinicName || "Clinica sin nombre",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    if (clinicError) {
      console.error("❌ Error insertando clinic:", clinicError);
      setErrorMsg(
        clinicError.message || "No se pudo crear la clínica vinculada."
      );
      setLoading(false);
      return;
    }

    localStorage.setItem("active_clinic_id", user.id);
    setInfoMsg(
      "Cuenta creada. Si tu proyecto requiere confirmar email, revisá tu correo. Luego podés iniciar sesión."
    );
    setLoading(false);

    // Pequeño delay para que lea el mensaje y luego lo mandamos a login
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Crear cuenta</h1>

        <form onSubmit={handleRegister} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre de la clínica"
            className="w-full border rounded px-3 py-2 text-sm"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="w-full border rounded px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMsg && (
            <p className="text-red-600 text-sm text-center">{errorMsg}</p>
          )}
          {infoMsg && (
            <p className="text-green-600 text-sm text-center">{infoMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded mt-2 disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          ¿Ya tenés cuenta?{" "}
          <a href="/login" className="text-sky-600 font-semibold">
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  );
}
