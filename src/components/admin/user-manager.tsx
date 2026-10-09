"use client";
import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Ellipsis, LockKeyhole, UserRound, X } from "lucide-react";
import type { AccountChange, ManagedAccount } from "@/lib/account-management";
const roles = { CUSTOMER: "Cliente", ADMIN: "Administrador", SUPERADMIN: "Superadmin" };
const actions: Record<AccountChange["action"], string> = { PROMOTE: "Atribuir acesso de administrador", DEMOTE: "Retirar acesso de administrador", DISABLE: "Desativar conta", ENABLE: "Reativar conta", DELETE: "Eliminar conta", DISMISS_REQUEST: "Arquivar pedido de eliminação" };
const field = "min-h-11 w-full rounded-xl border border-[color:var(--line)] bg-white px-3 text-sm";
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Atlantic/Azores" }).format(new Date(value)) : "Não disponível";
type Audit = { id: string; action: string; createdAt: string };
export function UserManager({ initialAccounts }: { initialAccounts: ManagedAccount[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [query, setQuery] = useState(""); const [role, setRole] = useState(""); const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<ManagedAccount | null>(null);
  const [action, setAction] = useState<AccountChange["action"] | null>(null);
  const [confirmation, setConfirmation] = useState(""); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [audit, setAudit] = useState<Audit[]>([]); const [auditError, setAuditError] = useState("");
  const auditRequest = useRef(0);
  const visible = accounts.filter(a => `${a.name} ${a.email}`.toLocaleLowerCase("pt").includes(query.toLocaleLowerCase("pt")) && (!role || a.role === role) && (!status || (status === "REQUEST" ? !!a.deletionRequestedAt : status === "ACTIVE" ? a.active : !a.active)));
  async function open(account: ManagedAccount) {
    setSelected(account); setAction(null); setError(""); setConfirmation(""); setAudit([]); setAuditError("");
    const requestId = ++auditRequest.current;
    try { const response = await fetch(`/api/admin/users?audit=${encodeURIComponent(account.id)}`, { cache: "no-store" }); if (!response.ok) throw new Error(); const data = await response.json(); if (requestId === auditRequest.current) setAudit(data.audit); } catch { if (requestId === auditRequest.current) setAuditError("Não foi possível carregar o histórico."); }
  }
  async function save() {
    if (!selected || selected.protected || selected.kind === "CONFIGURED" || !action || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, kind: selected.kind, version: selected.updatedAt, action, ...(action === "DELETE" ? { confirmation } : {}) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Não foi possível guardar.");
      setAccounts(data.accounts); setSelected(null); setNotice("Alteração guardada e registada no histórico.");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível guardar."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="space-y-4">
    <p className="text-sm text-slate-600">Contas registadas no site. Os nomes das vendas manuais não são contas de utilizador.</p>
    <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
      <input aria-label="Pesquisar utilizadores" placeholder="Pesquisar nome ou email…" value={query} onChange={e => setQuery(e.target.value)} className={field} />
      <select aria-label="Filtrar por papel" value={role} onChange={e => setRole(e.target.value)} className={field}><option value="">Todos os papéis</option>{Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select aria-label="Filtrar por estado" value={status} onChange={e => setStatus(e.target.value)} className={field}><option value="">Todos os estados</option><option value="ACTIVE">Contas ativas</option><option value="INACTIVE">Contas desativadas</option><option value="REQUEST">Pedidos de eliminação</option></select>
    </div>
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <p className="text-xs text-slate-500">{visible.length} conta(s)</p>
    <div className="divide-y divide-[color:var(--line)] overflow-hidden rounded-2xl border border-[color:var(--line)] bg-white">{visible.map(account => <div key={`${account.kind}:${account.id}`} className="flex items-center gap-3 p-3 sm:p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--sand-soft)] text-[color:var(--atlantic)]">{account.protected ? <LockKeyhole size={20} /> : <UserRound size={20} />}</span>
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{account.name}</p><p className="break-all text-xs text-slate-500">{account.email}</p><p className="mt-1 text-xs">{roles[account.role]} · {account.protected ? "Protegida" : account.active ? "Conta ativa" : "Desativada"}</p>{account.deletionRequestedAt && <p className="mt-1 text-xs font-semibold text-amber-700">Eliminação solicitada</p>}<p className="mt-1 hidden text-xs text-slate-500 md:block">Criada: {date(account.createdAt)} · Último acesso: {date(account.lastLoginAt)}</p></div>
      <button onClick={() => void open(account)} aria-label={`Opções de ${account.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[color:var(--line)]"><Ellipsis /></button>
    </div>)}{!visible.length && <p className="p-5 text-sm text-slate-500">Nenhuma conta corresponde aos filtros.</p>}</div>
    <Dialog.Root open={!!selected} onOpenChange={open => { if (!open && !busy) setSelected(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[85dvh] w-[calc(100%-24px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-[#fffdf9] p-5 shadow-xl">
      <Dialog.Title className="pr-10 font-serif text-2xl">{selected?.name}</Dialog.Title><Dialog.Description className="mt-1 break-all text-sm text-slate-500">{selected?.email}</Dialog.Description><Dialog.Close disabled={busy} aria-label="Fechar detalhes" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center"><X /></Dialog.Close>
      {selected && <><dl className="my-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Papel</dt><dd>{roles[selected.role]}</dd></div><div><dt className="text-slate-500">Estado</dt><dd>{selected.active ? "Ativa" : "Desativada"}</dd></div><div><dt className="text-slate-500">Criação</dt><dd>{date(selected.createdAt)}</dd></div><div><dt className="text-slate-500">Último acesso</dt><dd>{date(selected.lastLoginAt)}</dd></div><div><dt className="text-slate-500">Pedidos associados</dt><dd>{selected.orders}</dd></div></dl>
      {selected.deletionRequestedAt && <p className="mb-4 text-sm text-amber-800">Pedido de eliminação: {date(selected.deletionRequestedAt)}</p>}
      {selected.protected ? <p className="rounded-xl bg-[color:var(--sand-soft)] p-3 text-sm">Conta principal protegida. Os seus acessos e credenciais são geridos no Railway, fora deste painel.</p> : !action ? <div className="grid gap-2">{[
        ...(selected.kind === "CUSTOMER" ? [selected.role === "ADMIN" ? "DEMOTE" : "PROMOTE"] as AccountChange["action"][] : []),
        selected.active ? "DISABLE" as const : "ENABLE" as const,
        ...(selected.deletionRequestedAt ? ["DISMISS_REQUEST" as const] : []), "DELETE" as const,
      ].map(a => <button key={a} className={`${field} text-left ${a === "DELETE" ? "text-red-700" : ""}`} onClick={() => { setAction(a); setError(""); }}>{actions[a]}</button>)}</div> : <div className="space-y-3 rounded-xl border border-[color:var(--line)] p-3"><p className="font-semibold">{actions[action]}?</p><p className="text-sm text-slate-600">{action === "DELETE" ? "A conta e os dados de contacto dos pedidos associados serão removidos ou anonimizados. Vendas, valores, artigos e movimentos permanecem no histórico. Esta ação não pode ser desfeita." : action === "PROMOTE" ? "Esta conta terá acesso às áreas operacionais do Admin. Não poderá gerir utilizadores ou a conta principal. As sessões atuais serão invalidadas." : action === "DEMOTE" || action === "DISABLE" ? "As sessões atuais serão invalidadas imediatamente. O histórico comercial será preservado." : "A alteração ficará registada no histórico."}</p>
      {action === "DELETE" && <label className="block text-sm">Escreva ELIMINAR para confirmar<input className={`${field} mt-2`} value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" /></label>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex gap-2"><button className={field} disabled={busy} onClick={() => setAction(null)}>Cancelar</button><button className={`${field} bg-[color:var(--atlantic)]! text-white disabled:opacity-50`} disabled={busy || action === "DELETE" && confirmation !== "ELIMINAR"} onClick={() => void save()}>{busy ? "A guardar…" : "Confirmar"}</button></div></div>}
      <h3 className="mb-2 mt-5 text-sm font-semibold">Histórico de acessos</h3>{auditError ? <p className="text-xs text-red-700">{auditError}</p> : audit.length ? <ul className="space-y-2 text-xs text-slate-600">{audit.map(a => <li key={a.id}>{actions[a.action as AccountChange["action"]] ?? (a.action === "REQUEST_DELETION" ? "Eliminação solicitada pelo cliente" : a.action)} · {date(a.createdAt)}</li>)}</ul> : <p className="text-xs text-slate-500">Sem operações registadas.</p>}</>}
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
