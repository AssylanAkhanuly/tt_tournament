// SpinCoach service worker — Web Push for "your match is ready" alerts.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "SpinCoach", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "SpinCoach";
  const options = {
    body: data.body || "",
    tag: data.notification_id ? "notif-" + data.notification_id : undefined,
    renotify: true,
    data: { tournament_id: data.tournament_id || null },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const tid = event.notification.data && event.notification.data.tournament_id;
  const url = tid ? "/dashboard/tournaments/" + tid : "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
