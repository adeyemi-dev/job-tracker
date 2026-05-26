// JobTracker notification service worker
// Holds the scheduled reminder independent of the browser tab lifecycle

let timer = null;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SCHEDULE") {
    clearTimeout(timer);
    if (data.delayMs > 0) {
      timer = setTimeout(() => {
        self.registration.showNotification(data.title, {
          body: data.body,
          icon: "/favicon.ico",
          tag: "jt-daily",
          requireInteraction: false,
        });
      }, data.delayMs);
    }
  }

  if (data.type === "CANCEL") {
    clearTimeout(timer);
    timer = null;
  }
});
