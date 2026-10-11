"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InventoryDialog } from "./inventory-dialog";

export function useStockLeaveWarning(dirty: boolean) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<{ question: string; action: () => void } | null>(null);
  const dirtyRef = useRef(dirty);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  function confirm(question: string, action: () => void) { setConfirmation({ question, action }); }

  useEffect(() => {
    const question = "Existem alterações de stock por guardar. Sair e descartá-las?";
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) { event.preventDefault(); event.returnValue = ""; }
    };
    const click = (event: MouseEvent) => {
      if (!dirtyRef.current || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search) return;
      event.preventDefault(); event.stopImmediatePropagation();
      setConfirmation({ question, action: () => { dirtyRef.current = false; if (url.origin === location.origin) router.push(url.pathname + url.search + url.hash); else location.assign(url.href); } });
    };
    const submit = (event: SubmitEvent) => {
      if (dirtyRef.current && event.target instanceof HTMLFormElement && event.target.querySelector('button')?.textContent?.includes("Terminar sessão")) {
        event.preventDefault(); event.stopImmediatePropagation();
        const form = event.target;
        setConfirmation({ question, action: () => { dirtyRef.current = false; form.requestSubmit(); } });
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true); document.removeEventListener("submit", submit, true);
    };
  }, [router]);

  useEffect(() => {
    if (!dirty) {
      // Remove our same-URL guard after saving/discarding, without a page reload.
      if (history.state?.stockLeaveGuard) history.back();
      return;
    }
    const url = location.href;
    if (!history.state?.stockLeaveGuard) history.pushState({ ...history.state, stockLeaveGuard: true }, "", url);
    const popstate = () => {
      history.pushState({ ...history.state, stockLeaveGuard: true }, "", url);
      setConfirmation({ question: "Existem alterações de stock por guardar. Voltar e descartá-las?", action: () => {
        dirtyRef.current = false; window.removeEventListener("popstate", popstate); history.go(-2);
      } });
    };
    window.addEventListener("popstate", popstate);
    return () => {
      window.removeEventListener("popstate", popstate);
    };
  }, [dirty]);

  const dialog = confirmation ? <InventoryDialog title="Alterações por guardar" onClose={() => setConfirmation(null)}>
    <p className="mb-4 text-sm">{confirmation.question}</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setConfirmation(null)} className="min-h-11 rounded-xl border px-4">Cancelar</button>
      <button type="button" onClick={() => { const action = confirmation.action; setConfirmation(null); action(); }} className="min-h-11 rounded-xl bg-[color:var(--atlantic)] px-4 text-white">Confirmar</button>
    </div>
  </InventoryDialog> : null;
  return { confirm, dialog };
}
