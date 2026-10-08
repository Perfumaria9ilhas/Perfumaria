"use client";
import { useEffect } from "react";
export function AdminPwa() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin", updateViaCache: "none" }).catch(() => { /* Settings show push support separately; the Admin remains usable. */ });
    }
  }, []);
  return null;
}
