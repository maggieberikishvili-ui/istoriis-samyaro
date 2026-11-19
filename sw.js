/* ==========================================================
   ისტორიის სამყარო — Service Worker
   ----------------------------------------------------------
   • ყველა ბმული ფარდობითია (./) — მუშაობს GitHub Pages-ის
     ქვესაქაღალდეშიც (მაგ. /istoriis-samyaro/).
   • საიტის ფაილები: Network-First — ინტერნეტით ყოველთვის
     უახლესი ვერსია მოდის (და ქეშიც ახლდება); ინტერნეტის
     გარეშე ან ნელ ქსელზე — ქეშიდან.
   • Google Fonts: Stale-While-Revalidate.
   • სურათები (assets/images/): Stale-While-Revalidate ცალკე ქეშში,
     მაქსიმუმ MAX_IMAGES ფაილი (ძველი იშლება).
   • CORE_FILES-ის შეცვლისას გაზარდე VERSION.
   ========================================================== */

const VERSION = "v21";
const STATIC_CACHE = "ims-static-" + VERSION;
const FONT_CACHE = "ims-fonts-" + VERSION;
const IMAGE_CACHE = "ims-images-" + VERSION;
const MAX_IMAGES = 120;

// ნელ ქსელზე რამდენ ხანს ველოდოთ, სანამ ქეშს გამოვიყენებთ
const NETWORK_TIMEOUT_MS = 4000;

const CORE_FILES = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./lesson.html",
  "./games.html",
  "./manifest.json",
  "./css/variables.css",
  "./css/global.css",
  "./css/auth.css",
  "./css/dashboard.css",
  "./css/lesson.css",
  "./css/games.css",
  "./js/storage.js",
  "./js/data.js",
  "./js/timeline-data.js",
  "./js/whoami-data.js",
  "./js/illustrations.js",
  "./js/auth.js",
  "./js/dashboard.js",
  "./js/lesson.js",
  "./js/games.js",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  // სასწავლო სურათები, რომლებიც ოფლაინშიც თავიდანვე უნდა იყოს ხელმისაწვდომი
  "./assets/images/clay-pot.jpg",
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
  const keep = [STATIC_CACHE, FONT_CACHE, IMAGE_CACHE];
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

  if (url.origin === self.location.origin && url.pathname.includes("/assets/images/")) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, MAX_IMAGES));
  } else if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  } else if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
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
async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then(async (response) => {
      if (response && (response.ok || response.type === "opaque")) {
        await cache.put(request, response.clone());
        if (maxEntries) await trimCache(cache, maxEntries);
      }
      return response;
    })
    .catch(() => cached || Response.error());

  return cached || network;
}

/** ქეშში მაქსიმუმ maxEntries ჩანაწერი — ყველაზე ძველი იშლება. */
async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}
