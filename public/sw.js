/**
 * Service worker de IMAF.
 *
 * Solo guarda archivos públicos e inmutables. Nunca guarda páginas ni respuestas
 * de la API: las pantallas muestran datos personales y un equipo puede ser
 * compartido, así que nada de eso debe sobrevivir a un cierre de sesión.
 *
 * Sube CACHE_VERSION al cambiar PRECACHE o la estrategia de caché.
 */
const CACHE_VERSION = "v2";
const CACHE_PREFIX = "imaf-static-";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

// Cada despliegue genera archivos con hash nuevo. El límite evita que se
// acumulen en teléfonos con poco almacenamiento.
const MAX_ENTRIES = 200;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME,
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trimCache(cache) {
  const keys = await cache.keys();
  const excess = keys.length - MAX_ENTRIES;
  if (excess <= 0) return;

  const removable = keys.filter(
    (request) => !PRECACHE.includes(new URL(request.url).pathname),
  );
  await Promise.all(
    removable.slice(0, excess).map((request) => cache.delete(request)),
  );
}

/** Los archivos con hash no cambian nunca: si ya están guardados, sirven. */
async function cacheFirst(event) {
  const cached = await caches.match(event.request);
  if (cached) return cached;

  const response = await fetch(event.request);
  if (response.ok) {
    const copy = response.clone();
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        await cache.put(event.request, copy);
        await trimCache(cache);
      }),
    );
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // La API vive en otro dominio: sus respuestas no pasan por aquí.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match(OFFLINE_URL);
        return offline ?? Response.error();
      }),
    );
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    PRECACHE.includes(url.pathname)
  ) {
    event.respondWith(cacheFirst(event));
  }
});
