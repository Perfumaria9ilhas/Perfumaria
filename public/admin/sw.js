/* Admin-only worker. No Cache API, HTML, API or private response storage. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => new Response(`<!doctype html><html lang="pt"><meta name="viewport" content="width=device-width,initial-scale=1"><title>9 Ilhas Admin</title><body style="font:16px system-ui;padding:32px;background:#f5f6f8"><h1>Sem ligação</h1><p>O Admin precisa de internet para consultar e guardar dados com segurança.</p><button onclick="location.reload()">Tentar novamente</button></body></html>`, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } })));
});
self.addEventListener("push", event => {
  let data = {}; try { data = event.data?.json() ?? {}; } catch { /* Generic safe fallback. */ }
  event.waitUntil(self.registration.showNotification("9 Ilhas Admin", {
    body: data.body || "Existem alertas para consultar no Admin.", icon: "/admin-pwa/icon-192.png",
    badge: "/admin-pwa/icon-192.png", tag: data.tag || "admin-alerts", renotify: false,
    data: { url: data.url || "/admin" },
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL(event.notification.data?.url || "/admin", self.location.origin);
    if (url.origin !== self.location.origin || !(url.pathname === "/admin" || url.pathname.startsWith("/admin/"))) return;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const client = windows.find(item => new URL(item.url).pathname.startsWith("/admin"));
    if (client) { await client.navigate(url.href); await client.focus(); } else await self.clients.openWindow(url.href);
  })());
});
