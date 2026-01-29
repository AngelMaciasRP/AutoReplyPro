// frontend/app/api/proxy/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path, method, data } = body;

    const backendResponse = await fetch(`${BACKEND_URL}${path}`, {
      method: method || "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: method !== "GET" ? JSON.stringify(data || {}) : undefined,
    });

    const text = await backendResponse.text();

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: backendResponse.status });
    } catch {
      return NextResponse.json(
        { error: "Respuesta no JSON del backend", raw: text },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { error: "Error interno del proxy", detail: err.message },
      { status: 500 }
    );
  }
}
