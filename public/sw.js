/**
 * Service Worker - Aldeias Games PWA
 * Versão 3.11.0
 */

const CACHE_NAME = "aldeias-games-v3.11.0";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// Instalação - Cachear assets estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Cacheando assets estáticos");
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error("[SW] Erro ao cachear assets:", err);
      })
  );
  self.skipWaiting();
});

// Ativação - Limpar caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log("[SW] Eliminando cache antigo:", name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log("[SW] Service Worker ativado");
        return self.clients.claim();
      })
  );
});

// Fetch - Estratégia Cache First, depois Network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições de API
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Ignorar requisições de analytics
  if (url.hostname.includes("google-analytics") || url.hostname.includes("googletagmanager")) {
    return;
  }

  // Estratégia para assets estáticos
  if (request.destination === "image" || request.destination === "style" || request.destination === "script") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Atualizar cache em background
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {});
          return cached;
        }

        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // Retornar fallback offline se disponível
            if (request.destination === "image") {
              return caches.match("/icon-192x192.png");
            }
            return new Response("Offline", { status: 503 });
          });
      })
    );
    return;
  }

  // Estratégia Network First para páginas HTML
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached;
            }
            return caches.match("/");
          });
        })
    );
    return;
  }

  // Default: Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request);
    })
  );
});

// Push Notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.message || "Nova notificação",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: data.tag || "default",
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Aldeias Games", options)
  );
});

// Click em notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  let url = "/";

  if (notificationData?.url) {
    url = notificationData.url;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Se já há uma janela aberta, focar nela
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // Senão, abrir nova janela
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Background Sync (para quando voltar online)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-actions") {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  // Implementar sincronização de ações pendentes
  console.log("[SW] Sincronizando ações pendentes...");
}

// Mensagens do cliente
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
