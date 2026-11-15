/* ==========================================================
   ისტორიის სამყარო — Service Worker
   ----------------------------------------------------------
   • ყველა ბმული ფარდობითია (./) — მუშაობს GitHub Pages-ის
     ქვესაქაღალდეშიც (მაგ. /istoriis-samyaro/).
   • საიტის ფაილები: Network-First — ინტერნეტით ყოველთვის
     უახლესი ვერსია მოდის (და ქეშიც ახლდება); ინტერნეტის
     გარეშე ან ნელ ქსელზე — ქეშიდან.
   • Google Fonts: Stale-While-Revalidate.
   • CORE_FILES-ის შეცვლისას გაზარდე VERSION.
   ========================================================== */

const VERSION = "v2";
const STATIC_CACHE = "ims-static-" + VERSION;
const FONT_CACHE = "ims-fonts-" + VERSION;

// ნელ ქსელზე რამდენ ხანს ველოდოთ, სანამ ქეშს გამოვიყენებთ
const NETWORK_TIMEOUT_MS = 4000;

const CORE_FILES = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./lesson.html",
  "./manifest.json",
  "./css/variables.css",
  "./css/global.css",
  "./css/auth.css",
  "./css/dashboard.css",
  "./css/lesson.css",
  "./js/storage.js",
  "./js/data.js",
  "./js/illustrations.js",
  "./js/auth.js",
  "./js/dashboard.js",
  "./js/lesson.js",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

/* ---------- install: ძირითადი ფაილების წინასწარი ქეშირება ---------- */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // cache: "reload" — HTTP ქეშის გვერდის ავლით, ყოველთვის ახალი ფაილები
      .then((cache) => cache.addAll(CORE_FILES.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

/* ---------- activate: ძველი ვერსიების ქეშის წაშლა ---------- */

self.addEventListener("activate", (event) => {
  const keep = [STATIC_CACHE, FONT_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("ims-") && !keep.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ---------- fetch ---------- */

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  // Chrome-ის ცნობილი ხარვეზის თავიდან აცილება
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  } else if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
  // სხვა ყველაფერს ბრაუზერი ჩვეულებრივად ამუშავებს
});

/** ქეშის გასაღები query-ს გარეშე: lesson.html?course=… → lesson.html */
function cacheKey(request) {
  const url = new URL(request.url);
  url.search = "";
  url.hash = "";
  return url.href;
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

/**
 * Network-First: ქსელი → (წარმატებისას ქეშის განახლება) → ქეში.
 * "no-cache" აიძულებს ბრაუზერს, სერვერთან გადაამოწმოს ფაილი,
 * ამიტომ განახლებები მომხმარებელთან მაშინვე ჩანს.
 */
async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const key = cacheKey(request);

  const freshRequest =
    request.mode === "navigate"
      ? new Request(request.url, { cache: "no-cache", credentials: "same-origin" })
      : new Request(request, { cache: "no-cache" });

  const network = fetch(freshRequest).then((response) => {
    if (response && response.ok && response.type === "basic") {
      cache.put(key, response.clone());
    }
    return response;
  });
  // თუ ქეშიდან უკვე ვუპასუხეთ, ქსელის შეცდომა კონსოლში "Uncaught" არ გამოჩნდეს
  network.catch(() => {});

  try {
    return await Promise.race([network, timeout(NETWORK_TIMEOUT_MS)]);
  } catch (err) {
    // ქსელი მიუწვდომელია ან ძალიან ნელია → ქეში
    const cached = await cache.match(key);
    if (cached) return cached;

    try {
      return await network; // ქეშში არ არის — ისევ ქსელს ველოდებით
    } catch (networkErr) {
      if (request.mode === "navigate") {
        const fallback = await cache.match(cacheKey(new Request("./index.html")));
        if (fallback) return fallback;
      }
      return Response.error();
    }
  }
}

/** Stale-While-Revalidate: ქეშიდან მაშინვე, ფონურად — განახლება. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(FONT_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || network;
}
