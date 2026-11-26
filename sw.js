/* ==========================================================
   Edubba (ისტორიის სამყარო) — Service Worker
   ----------------------------------------------------------
   • ყველა ბმული ფარდობითია (./) — მუშაობს GitHub Pages-ის
     ქვესაქაღალდეშიც (მაგ. /istoriis-samyaro/).
   • CORE_FILES — საიტის „ჩონჩხი“ (გვერდები, სტილები, ლოგიკა, შრიფტები):
     დაყენებისას ერთბაშად ჩაიწერება, მერე ქეშიდან მყისიერად იხსნება
     (Cache-First) — ნელ ინტერნეტზეც და ოფლაინშიც.
   • დანარჩენი (კლასების გაკვეთილები js/data/, თამაშების *-data.js) —
     ჩაიწერება პირველი გამოყენებისას და მერე ასევე ქეშიდან მოდის.
     ასე ტელეფონი არ იწერს იმ კლასებს, რომლებსაც მოსწავლე არ სწავლობს.
   • ახალი ვერსია: VERSION-ის შეცვლა → ბრაუზერი ახალ sw.js-ს აყენებს,
     ჩონჩხს თავიდან იწერს და ძველ ქეშს შლის (ახალი ფაილები ჩანს შემდეგ
     გახსნაზე). GitHub-ზე გამოქვეყნებისას VERSION-ს ავტომატურად ემატება
     ფაილების ჰეში (.github/workflows/check.yml) — ასე ნებისმიერი
     ცვლილება მომხმარებელთან აუცილებლად მივა.
   • localhost-ზე (შემოწმებისას) — Network-First: ცვლილება მაშინვე ჩანს.
   • სურათები (assets/images/): Stale-While-Revalidate ცალკე ქეშში,
     მაქსიმუმ MAX_IMAGES ფაილი. აუდიო ოფლაინისთვის არ ინახება.
   ========================================================== */

const VERSION = "v131";
const STATIC_CACHE = "ims-static-" + VERSION;
const IMAGE_CACHE = "ims-images";
const MAX_IMAGES = 120;

const DEV = ["localhost", "127.0.0.1", "[::1]"].includes(self.location.hostname);

// ნელ ქსელზე რამდენ ხანს ველოდოთ, სანამ ქეშს გამოვიყენებთ (მხოლოდ localhost)
const NETWORK_TIMEOUT_MS = 4000;

const CORE_FILES = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./lesson.html",
  "./games.html",
  "./teacher.html",
  "./decide.html",
  "./whoami.html",
  "./architect.html",
  "./detective.html",
  "./treasury.html",
  "./progress.html",
  "./manifest.json",
  "./css/fonts.css",
  "./css/variables.css",
  "./css/global.css",
  "./css/auth.css",
  "./css/dashboard.css",
  "./css/gems.css",
  "./css/lesson.css",
  "./css/games.css",
  "./css/timeline-board.css",
  "./css/teacher.css",
  "./css/decide.css",
  "./css/whoami.css",
  "./css/architect.css",
  "./css/detective.css",
  "./css/detective-board.css",
  "./css/ur.css",
  "./css/treasure.css",
  "./css/treasury.css",
  "./css/beads.css",
  "./css/icons.css",
  "./css/progress.css",
  "./js/storage.js",
  "./js/progress.js",
  "./js/utils.js",
  "./js/activities.js",
  "./js/data.js",
  "./js/audio-manifest.js",
  "./js/timeline-board.js",
  "./js/illustrations.js",
  "./js/gems.js",
  "./js/auth.js",
  "./js/dashboard.js",
  "./js/lesson.js",
  "./js/games.js",
  "./js/quiz-engine.js",
  "./js/teacher.js",
  "./js/decide.js",
  "./js/whoami.js",
  "./js/architect.js",
  "./js/detective.js",
  "./js/detective-board.js",
  "./js/detective-game.js",
  "./js/ur-game.js",
  "./js/treasure.js",
  "./js/treasury.js",
  "./js/beads.js",
  "./js/icons.js",
  "./js/lesson-picker.js",
  // შრიფტები (ქართული + ლათინური; დანარჩენი ნაწილები — საჭიროებისას)
  "./assets/fonts/noto-sans-georgian.woff2",
  "./assets/fonts/noto-sans-latin.woff2",
  "./assets/fonts/noto-serif-georgian.woff2",
  "./assets/fonts/gelasio-logo.woff2",
  "./icons/icon.svg",
  "./icons/logo-mark.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  // დაფის შუმერული ფონი (ფრიზი + ლურსმნული ჩანაწერი)
  "./assets/images/frieze-top.svg",
  "./assets/images/frieze-bottom.svg",
  "./assets/images/cuneiform-tile.svg",
];

/* ---------- install: ჩონჩხის წინასწარი ქეშირება ---------- */

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
  const keep = [STATIC_CACHE, IMAGE_CACHE];
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
  if (url.origin !== self.location.origin) return; // გარე წყაროები ჩვენ არ გვაქვს

  // აუდიო (assets/audio/) — ბრაუზერი პირდაპირ ტვირთავს (ნაწილ-ნაწილ, Range მოთხოვნებით);
  // ოფლაინისთვის წინასწარ არ ინახება — ფაილები დიდია
  if (url.pathname.includes("/assets/audio/")) return;

  if (url.pathname.includes("/assets/images/")) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, MAX_IMAGES));
  } else if (DEV) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

/** ქეშის გასაღები query-ს გარეშე: lesson.html?course=… → lesson.html */
function cacheKey(request) {
  const url = new URL(request.url);
  url.search = "";
  url.hash = "";
  return url.href;
}

/** ქსელიდან ახალი ასლი (HTTP ქეშის გადამოწმებით) და ჩაწერა ჩვენს ქეშში. */
async function fetchAndStore(request, cache, key) {
  const fresh =
    request.mode === "navigate"
      ? new Request(request.url, { cache: "no-cache", credentials: "same-origin" })
      : new Request(request, { cache: "no-cache" });
  const response = await fetch(fresh);
  if (response && response.ok && response.type === "basic") {
    await cache.put(key, response.clone());
  }
  return response;
}

/** ოფლაინში უცნობი გვერდი → შესვლის გვერდი (ის ქეშშია). */
async function offlineFallback(request, cache) {
  if (request.mode === "navigate") {
    const fallback = await cache.match(cacheKey(new Request("./index.html")));
    if (fallback) return fallback;
  }
  return Response.error();
}

/** Cache-First: ქეშიდან მყისიერად; თუ არ არის — ქსელიდან და ქეშში. */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const key = cacheKey(request);
  const cached = await cache.match(key);
  if (cached) return cached;
  try {
    return await fetchAndStore(request, cache, key);
  } catch (err) {
    return offlineFallback(request, cache);
  }
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

/** Network-First (localhost): ქსელი → ქეში. ცვლილებები მაშინვე ჩანს. */
async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const key = cacheKey(request);
  const network = fetchAndStore(request, cache, key);
  // თუ ქეშიდან უკვე ვუპასუხეთ, ქსელის შეცდომა კონსოლში "Uncaught" არ გამოჩნდეს
  network.catch(() => {});
  try {
    return await Promise.race([network, timeout(NETWORK_TIMEOUT_MS)]);
  } catch (err) {
    const cached = await cache.match(key);
    if (cached) return cached;
    try {
      return await network;
    } catch (networkErr) {
      return offlineFallback(request, cache);
    }
  }
}

/** Stale-While-Revalidate: ქეშიდან მაშინვე, ფონურად — განახლება. */
async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
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
