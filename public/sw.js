const APP_ICON_URL = "/icon-192.png?v=2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(self.registration.showNotification(payload.title || "FyNest", {
    body: payload.body || "Die Einkaufsliste wurde aktualisiert.",
    icon: APP_ICON_URL,
    badge: APP_ICON_URL,
    data: { url: payload.url || "/shopping-list" },
    tag: payload.tag || "fynest-update"
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existingClient = clients.find((client) => client.url === targetUrl);
    if (existingClient) return existingClient.focus();
    return self.clients.openWindow(targetUrl);
  }));
});
