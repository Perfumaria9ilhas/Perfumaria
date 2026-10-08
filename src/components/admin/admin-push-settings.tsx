"use client";
import { useEffect, useState } from "react";
type Preferences = { payments: boolean; deliveries: boolean; stock: boolean };
const defaults: Preferences = { payments: true, deliveries: true, stock: true };
export function AdminPushSettings() {
  const [config, setConfig] = useState<{ configured: boolean; publicKey?: string; message?: string } | null>(null);
  const [supported, setSupported] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [prefs, setPrefs] = useState(defaults);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const hasPush = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      setSupported(hasPush); setInstalled(matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
      try {
        const registration = hasPush ? await navigator.serviceWorker.getRegistration("/admin") : null;
        const sub = await registration?.pushManager.getSubscription() ?? null;
        const response = await fetch(`/api/admin/push${sub ? `?endpoint=${encodeURIComponent(sub.endpoint)}` : ""}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Não foi possível consultar as definições.");
        const data = await response.json();
        if (!cancelled) { setConfig(data); setSubscription(data.subscribed || !data.configured ? sub : null); if (data.preferences) setPrefs(data.preferences); }
      } catch { if (!cancelled) setMessage("Não foi possível consultar as definições. Tente novamente."); }
    }
    void load(); return () => { cancelled = true; };
  }, []);
  async function api(body: object) {
    const response = await fetch("/api/admin/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Não foi possível guardar.");
  }
  async function activate() {
    if (!config?.publicKey) return;
    setBusy(true); setMessage("");
    let created: PushSubscription | null = null;
    try {
      // Called only by this explicit button, never during page load.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permissão não concedida. Pode alterá-la nas definições do dispositivo.");
      const registration = await navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin", updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      const key = Uint8Array.from(atob(config.publicKey.replace(/-/g,"+").replace(/_/g,"/")), char => char.charCodeAt(0));
      const sub = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      created = sub;
      const json = sub.toJSON();
      await api({ action: "subscribe", subscription: { endpoint: json.endpoint, keys: json.keys }, preferences: prefs });
      setSubscription(sub); setMessage("Notificações ativadas neste dispositivo.");
    } catch (err) { if (created && !subscription) await created.unsubscribe().catch(() => false); setMessage(err instanceof Error ? err.message : "Não foi possível ativar."); }
    finally { setBusy(false); }
  }
  async function run(action: "unsubscribe" | "preferences" | "test") {
    if (!subscription) return;
    setBusy(true); setMessage("");
    try {
      await api({ action, endpoint: subscription.endpoint, ...(action === "preferences" ? { preferences: prefs } : {}) });
      if (action === "unsubscribe") { await subscription.unsubscribe(); setSubscription(null); }
      setMessage(action === "test" ? "Teste enviado. Confirme a receção no dispositivo." : action === "preferences" ? "Categorias guardadas para este dispositivo." : "Notificações desativadas.");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Não foi possível guardar."); } finally { setBusy(false); }
  }
  return <section className="rounded-2xl border bg-white p-5"><h2 className="text-xl">Notificações push</h2><p className="mt-2 text-sm text-slate-500">Alertas discretos, sem nomes de clientes, artigos ou valores no ecrã bloqueado.</p>
    {!installed ? <p className="mt-3 text-sm">No iPhone, instale primeiro a aplicação e abra pelo ícone do ecrã principal.</p> : null}
    {!supported ? <p className="mt-3 text-sm">Este browser não disponibiliza Web Push.</p> : null}
    {config && !config.configured ? <p className="mt-3 text-sm text-amber-800">{config.message}</p> : null}
    <fieldset disabled={busy} className="my-4 grid gap-2">{([['payments','Vendas por pagar'],['deliveries','Vendas por entregar'],['stock','Stock baixo']] as const).map(([key,label]) => <label key={key} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={prefs[key]} onChange={e => setPrefs({...prefs,[key]:e.target.checked})} />{label}</label>)}</fieldset>
    <div className="flex flex-wrap gap-2">{subscription ? <><button disabled={busy || !config?.configured} onClick={() => run("preferences")} className="rounded-xl border px-4 py-3 text-sm">Guardar categorias</button><button disabled={busy || !config?.configured} onClick={() => run("test")} className="rounded-xl border px-4 py-3 text-sm">Testar notificação</button><button disabled={busy} onClick={() => run("unsubscribe")} className="rounded-xl border px-4 py-3 text-sm">Desativar notificações</button></> : <button disabled={busy || !supported || !config?.configured} onClick={activate} className="rounded-xl bg-[color:var(--gold)] px-4 py-3 text-sm text-white">Ativar notificações</button>}</div>
    {message ? <p role="status" className="mt-3 text-sm">{message}</p> : null}
  </section>;
}
