"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { InventoryDialog } from "./inventory-dialog";
type Alert = { category: string; label: string; count: number; href: string };
export function AdminNotifications() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/admin/alerts", { cache: "no-store", signal: controller.signal });
        if (!response.ok) { setAlerts([]); throw new Error(response.status === 401 ? "A sessão terminou. Entre novamente." : "Não foi possível atualizar os alertas."); }
        const data = await response.json(); setAlerts(data.alerts); setError("");
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Sem ligação."); }
    }
    void refresh();
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh); window.addEventListener("admin-alerts-change", refresh);
    return () => { controller.abort(); clearInterval(interval); window.removeEventListener("focus", refresh); window.removeEventListener("admin-alerts-change", refresh); };
  }, []);
  const total = alerts.reduce((sum, alert) => sum + alert.count, 0);
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={`Notificações: ${total} alertas por resolver`} className="admin-bell"><Bell size={23} />{total > 0 ? <span>{total > 99 ? "99+" : total}</span> : null}</button>
    {open ? <InventoryDialog title="Notificações" onClose={() => setOpen(false)}>
      <p className="mb-3 text-sm text-slate-500">Alertas atuais. Desaparecem quando a situação é resolvida.</p>
      {error ? <p role="alert" className="mb-3 text-sm text-red-700">{error}</p> : null}
      <div className="space-y-2">{alerts.filter(alert => alert.count > 0).map(alert => <Link key={alert.category} onClick={() => setOpen(false)} href={alert.href} className="flex min-h-14 items-center gap-3 rounded-xl border p-3"><strong className="rounded-lg bg-amber-50 px-3 py-1 text-amber-800">{alert.count}</strong><span className="flex-1 text-sm">{alert.label}</span><ChevronRight size={18} /></Link>)}</div>
      {!error && !total ? <p className="py-4 text-sm">Não há alertas por resolver.</p> : null}
      <Link href="/admin/definicoes" onClick={() => setOpen(false)} className="mt-5 block text-sm underline">Definições de notificações</Link>
    </InventoryDialog> : null}
  </>;
}
