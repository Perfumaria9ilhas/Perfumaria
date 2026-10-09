"use client";
import { useState } from "react";
export function AccountDeletionRequest({ requested }: { requested: boolean }) {
  const [done, setDone] = useState(requested); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit() {
    if (busy) return; setBusy(true); setError("");
    try { const response = await fetch("/api/account/deletion", { method: "POST" }); if (!response.ok) throw new Error(); setDone(true); } catch { setError("Não foi possível enviar o pedido. Tente novamente."); } finally { setBusy(false); }
  }
  return <div className="mt-6 border-t border-[color:var(--line)] pt-4 text-sm">{done ? <p role="status">O seu pedido de eliminação está pendente de análise.</p> : confirm ? <div className="space-y-3"><p>Solicitar a eliminação da conta e dos seus dados pessoais? O pedido será analisado pela loja. Os registos comerciais necessários serão preservados.</p><div className="flex flex-wrap gap-2"><button disabled={busy} className="min-h-11 rounded-xl border px-4" onClick={() => setConfirm(false)}>Cancelar</button><button disabled={busy} className="min-h-11 rounded-xl border px-4 text-red-700" onClick={() => void submit()}>{busy ? "A enviar…" : "Confirmar pedido"}</button></div></div> : <button className="min-h-11 text-slate-600 underline" onClick={() => setConfirm(true)}>Solicitar eliminação da minha conta</button>}{error && <p role="alert" className="mt-2 text-red-700">{error}</p>}</div>;
}
