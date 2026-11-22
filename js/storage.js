/* ==========================================================
   ისტორიის სამყარო — საერთო საცავი (window.IMS_STORE)
   ----------------------------------------------------------
   ერთადერთი ადგილი, სადაც ხდება:
     • localStorage-თან მუშაობა
     • პროფილის შენახვა/სინქრონიზაცია
         ims_currentUser  ⇄  ims_users[email].profile
     • ავტორიზაციის შემოწმება და გადამისამართება
     • თემის (ims_theme) მართვა
     • დღიური შემოწმება: streak + სიცოცხლეების შევსება
     • PWA: Service Worker-ის რეგისტრაცია (./sw.js) და დაყენების მინიშნება

   ჩატვირთვა <head>-ში, defer-ის გარეშე (თემა და გადამისამართება
   გვერდის დახატვამდე უნდა მოხდეს):

     <script src="js/storage.js" data-auth="required"></script>

   data-auth:
     "required"   — შეუსვლელი მომხმარებელი → index.html
     "guest-only" — უკვე შესული მომხმარებელი → dashboard.html
   ========================================================== */

(function () {
  "use strict";

  const KEYS = Object.freeze({
    users: "ims_users",
    currentUser: "ims_currentUser",
    theme: "ims_theme",
    selectedCourse: "ims_selectedCourse",
    installDismissed: "ims_installDismissed",
    games: "ims_games",             // თამაშების რეკორდები და დღიური XP (თითო მომხმარებელზე)
    sectionFold: "ims_sectionFold", // თავებისა და ქვეთავების დაკეცვა დაფაზე: { chapterId/sectionId: true(გაშლილი)/false }
    guestProfile: "ims_guestProfile", // სტუმრის პროფილი გასვლის შემდეგ (ხელახლა შესვლისას აღდგება)
  });

  const URLS = Object.freeze({
    login: "index.html",
    dashboard: "dashboard.html",
    lesson: "lesson.html",
    games: "games.html",
    treasury: "treasury.html",
  });

  const MAX_HEARTS = 5;
  const MAX_MISTAKES = 60;   // „ჩემი შეცდომები“ — ბოლო 60 კითხვა
  const ACTIVITY_DAYS = 35;  // დღიური სტატისტიკა (მშობლის გვერდისთვის) — ბოლო 5 კვირა

  /* ==========================================================
     localStorage დამხმარეები
     ========================================================== */

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function readString(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function writeString(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function removeKey(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) { /* იგნორი */ }
  }

  /* ==========================================================
     თარიღები (ლოკალური დროით, YYYY-MM-DD)
     ========================================================== */

  function toDateKey(date) {
    return (
      date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0")
    );
  }

  function todayKey() {
    return toDateKey(new Date());
  }

  function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toDateKey(d);
  }

  /* ==========================================================
     პროფილი
     ========================================================== */

  function toCount(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
  }

  function createProfile(name, email, isGuest) {
    return {
      name: name,
      email: email,
      isGuest: isGuest,
      isPro: false,
      xp: 0,
      streak: 1,
      hearts: MAX_HEARTS,
      completedLessons: [],
      lastActive: todayKey(),
      mistakes: [],
      activity: {},
      gems: {},
      gemSeen: {},
    };
  }

  /**
   * „ჩემი შეცდომები“: [{ c: კურსი, l: გაკვეთილი, i: ნაბიჯის ნომერი,
   *   q: კითხვის ანაბეჭდი (IMS_DATA.stepFingerprint), d: თარიღი }]
   */
  function normalizeMistakes(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter((m) => m && typeof m.c === "string" && typeof m.l === "string" &&
        typeof m.q === "string" && Number.isInteger(m.i) && m.i >= 0)
      .map((m) => ({ c: m.c, l: m.l, i: m.i, q: m.q, d: typeof m.d === "string" ? m.d : todayKey() }))
      .slice(-MAX_MISTAKES);
  }

  /** დღიური სტატისტიკა: { "YYYY-MM-DD": { xp, lessons, correct, wrong } }, ბოლო ACTIVITY_DAYS დღე. */
  function normalizeActivity(raw) {
    const result = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return result;
    const from = new Date();
    from.setDate(from.getDate() - ACTIVITY_DAYS + 1);
    const oldest = toDateKey(from);
    Object.keys(raw).forEach((day) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < oldest) return;
      const d = raw[day] || {};
      result[day] = {
        xp: toCount(d.xp, 0),
        lessons: toCount(d.lessons, 0),
        correct: toCount(d.correct, 0),
        wrong: toCount(d.wrong, 0),
      };
    });
    return result;
  }

  /** დღევანდელი ჩანაწერი (საჭიროებისას იქმნება). */
  function todayActivity(profile) {
    const day = todayKey();
    if (!profile.activity[day]) profile.activity[day] = { xp: 0, lessons: 0, correct: 0, wrong: 0 };
    return profile.activity[day];
  }

  /** აზღვევს არასწორი ან ძველი ფორმატის მონაცემებისგან. */
  function normalizeProfile(raw) {
    if (!raw || typeof raw !== "object") return null;
    return {
      name: typeof raw.name === "string" && raw.name.trim() ? raw.name : "მოსწავლე",
      email: typeof raw.email === "string" ? raw.email : null,
      isGuest: raw.isGuest === true || !raw.email,
      isPro: raw.isPro === true,
      friezeColor: FRIEZE_COLORS.includes(raw.friezeColor) ? raw.friezeColor : "lapis",
      xp: toCount(raw.xp, 0),
      streak: toCount(raw.streak, 1),
      hearts: Math.min(toCount(raw.hearts, MAX_HEARTS), MAX_HEARTS),
      completedLessons: Array.isArray(raw.completedLessons)
        ? raw.completedLessons.filter((id) => typeof id === "string")
        : [],
      lastActive: typeof raw.lastActive === "string" ? raw.lastActive : todayKey(),
      mistakes: normalizeMistakes(raw.mistakes),
      activity: normalizeActivity(raw.activity),
      gems: normalizeGems(raw.gems),
      gemSeen: normalizeGemSeen(raw.gemSeen),
      gemReviewed: normalizeGemSeen(raw.gemReviewed),
      treasury: normalizeTreasury(raw.treasury),
      beads: normalizeGemSeen(raw.beads),
      beadsNew: Array.isArray(raw.beadsNew) ? raw.beadsNew.filter((id) => typeof id === "string").slice(-20) : [],
      fixedCount: toCount(raw.fixedCount, 0),
    };
  }

  /* ---------- ძვირფასი ქვები: ხარისხი თითო გაკვეთილზე ----------
     profile.gems = { "<გაკვეთილის id>": "rough" | "polished" }
     ნატეხი (rough) — გავლილია შეცდომებით; გაპრიალებული (polished) — უშეცდომოდ.
     ქვა არასოდეს უარესდება და არ იკარგება. ამ ველამდე გავლილ გაკვეთილებს
     ჩანაწერი არ აქვს — ისინი გაპრიალებულად ითვლება. */
  const GEM_QUALITIES = ["rough", "polished"];

  function normalizeGems(raw) {
    const out = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
    Object.keys(raw).forEach((id) => {
      if (GEM_QUALITIES.includes(raw[id])) out[id] = raw[id];
    });
    return out;
  }

  /* მტვერი: ქვა მტვრიანდება, თუ გაკვეთილი DUST_DAYS დღე არ გაგიმეორებია.
     profile.gemSeen = { "<გაკვეთილის id>": "YYYY-MM-DD" } — ბოლო გავლა ან გაწმენდა.
     მტვერი მხოლოდ იერია: ხარისხი (ნატეხი/გაპრიალებული) არ იცვლება და ქვა არ იკარგება. */
  const DUST_DAYS = 30;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  function normalizeGemSeen(raw) {
    const out = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
    Object.keys(raw).forEach((id) => {
      if (typeof raw[id] === "string" && DATE_RE.test(raw[id])) out[id] = raw[id];
    });
    return out;
  }

  /** რამდენი დღე გავიდა YYYY-MM-DD თარიღიდან (ადგილობრივი კალენდრით). */
  function daysSince(dateKey) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const then = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today - then) / 86400000);
  }

  /** მტვრიანია თუ არა გავლილი გაკვეთილის ქვა. */
  function gemDusty(profile, lessonId) {
    if (!profile || !profile.completedLessons.includes(lessonId)) return false;
    const seen = profile.gemSeen[lessonId];
    return Boolean(seen) && daysSince(seen) >= DUST_DAYS;
  }

  /** ქვის „გაწმენდა“: ბოლო გამეორების თარიღი = დღეს. */
  function touchGem(profile, lessonId) {
    profile.gemSeen[lessonId] = todayKey();
  }

  /* გამეორება (საგანძურის ოქროსთვის): profile.gemReviewed = { "<გაკვეთილის id>": "YYYY-MM-DD" } —
     პირველად როდის გაიმეორა უკვე გავლილი გაკვეთილი (ხელახლა გავლა ან მტვრის გაწმენდა).
     ერთხელ ჩაწერილი აღარ იშლება — განძი უკან არ ჩამოდის. */
  function reviewGem(profile, lessonId) {
    if (!profile.gemReviewed[lessonId]) profile.gemReviewed[lessonId] = todayKey();
  }

  /* საგანძური: profile.treasury = { "<ბლოკის id>": "bronze" | "silver" | "gold" } —
     რომელი ლითონი უკვე უნახავს მოსწავლეს (ახალი განძის გამოჩენის ანიმაცია ერთხელ ჩანს). */
  const TREASURE_TIERS = ["bronze", "silver", "gold"];

  function normalizeTreasury(raw) {
    const out = {};
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
    Object.keys(raw).forEach((id) => {
      if (TREASURE_TIERS.includes(raw[id])) out[id] = raw[id];
    });
    return out;
  }

  /**
   * გავლილ გაკვეთილებს, რომლებსაც თარიღი ჯერ არ აქვს (ფუნქციამდე გავლილი),
   * დღევანდელი თარიღი ეწერება — მტვერი მათზე DUST_DAYS დღეში გამოჩნდება.
   * აბრუნებს true-ს, თუ რამე შეიცვალა (მხოლოდ მაშინ ღირს შენახვა).
   */
  function stampGems(profile) {
    let changed = false;
    profile.completedLessons.forEach((id) => {
      if (!profile.gemSeen[id]) {
        profile.gemSeen[id] = todayKey();
        changed = true;
      }
    });
    return changed;
  }

  /** ქვის მდგომარეობა: null (ჯერ არ გავლილა) | "rough" | "polished". */
  function gemState(profile, lessonId) {
    if (!profile || !profile.completedLessons.includes(lessonId)) return null;
    return profile.gems[lessonId] === "rough" ? "rough" : "polished";
  }

  /**
   * გაკვეთილის დასრულებისას (updateProfile-ის შიგნით, completedLessons-ში
   * დამატებამდე): უშეცდომოდ → გაპრიალებული, თორემ ნატეხი (თუ უკვე არ იყო გაპრიალებული).
   * აბრუნებს { before, after }.
   */
  function recordGem(profile, lessonId, flawless) {
    const before = gemState(profile, lessonId);
    const after = flawless || before === "polished" ? "polished" : "rough";
    profile.gems[lessonId] = after;
    touchGem(profile, lessonId); // გაკვეთილის ნებისმიერი გავლა მტვერსაც წმენდს
    if (before !== null) reviewGem(profile, lessonId); // უკვე გავლილის ხელახლა გავლა = გამეორება
    return { before: before, after: after };
  }

  function loadProfile() {
    return normalizeProfile(readJSON(KEYS.currentUser, null));
  }

  /**
   * Pro მომხმარებელს აქვს ∞ სიცოცხლე: შეცდომაზე არ აკლდება.
   * (ამჟამად ყველას isPro: false — Pro ვერსიის მომზადება.)
   */
  function hasUnlimitedHearts(profile) {
    return Boolean(profile && profile.isPro === true);
  }

  /**
   * პროფილის შენახვა ორივე ადგილას სინქრონულად.
   * სტუმრის პროფილი ინახება მხოლოდ ims_currentUser-ში.
   */
  function saveProfile(profile) {
    const ok = writeJSON(KEYS.currentUser, profile);
    if (!profile.isGuest && profile.email) {
      const users = getUsers();
      if (Object.prototype.hasOwnProperty.call(users, profile.email)) {
        users[profile.email].profile = profile;
        writeJSON(KEYS.users, users);
      }
    }
    return ok;
  }

  /**
   * პროგრესის განახლების ერთადერთი გზა:
   *   IMS_STORE.updateProfile((p) => { p.xp += 10; });
   * ყოველთვის ახლად კითხულობს პროფილს (სხვა ჩანართის ცვლილებებიც რომ არ დაიკარგოს).
   * შეუსვლელ მომხმარებელს აბრუნებს index.html-ზე და აბრუნებს null-ს.
   */
  function updateProfile(mutator) {
    const profile = loadProfile();
    if (!profile) {
      redirect(URLS.login);
      return null;
    }
    const xpBefore = profile.xp;
    const lessonsBefore = profile.completedLessons.length;
    mutator(profile);
    // დღიური სტატისტიკა ერთ ადგილას — XP-ის ნებისმიერი წყაროდან (გაკვეთილი, თამაში, სავარჯიშო)
    const xpGain = profile.xp - xpBefore;
    const lessonGain = profile.completedLessons.length - lessonsBefore;
    if (xpGain > 0 || lessonGain > 0) {
      const day = todayActivity(profile);
      day.xp += Math.max(0, xpGain);
      day.lessons += Math.max(0, lessonGain);
    }
    saveProfile(profile);
    return profile;
  }

  /**
   * პასუხის აღრიცხვა: დღიური სტატისტიკა + „ჩემი შეცდომები“.
   *   question: { c, l, i, q } — რომელი კითხვა (IMS_DATA.stepFingerprint)
   * არასწორი → შეცდომების სიაში (ბოლოში); სწორი → სიიდან ამოიშლება.
   */
  function recordAnswer(question, isCorrect) {
    return updateProfile((p) => {
      const day = todayActivity(p);
      if (isCorrect) day.correct += 1;
      else day.wrong += 1;
      if (!question) return;
      const before = p.mistakes.length;
      p.mistakes = p.mistakes.filter((m) => !(m.c === question.c && m.l === question.l && m.q === question.q));
      // სწორი პასუხი კითხვაზე, რომელიც შეცდომებში იყო → „გასწორებული შეცდომა“ (მძივებისთვის, js/beads.js)
      if (isCorrect && p.mistakes.length < before) p.fixedCount += 1;
      if (!isCorrect) {
        p.mistakes.push({ c: question.c, l: question.l, i: question.i, q: question.q, d: todayKey() });
        p.mistakes = p.mistakes.slice(-MAX_MISTAKES);
      }
    });
  }

  /* ==========================================================
     ანგარიშები და სესია
     ========================================================== */

  function getUsers() {
    const users = readJSON(KEYS.users, {});
    return users && typeof users === "object" && !Array.isArray(users) ? users : {};
  }

  function saveUsers(users) {
    return writeJSON(KEYS.users, users);
  }

  function findAccount(email) {
    const users = getUsers();
    return Object.prototype.hasOwnProperty.call(users, email) ? users[email] : null;
  }

  function startSession(profile) {
    return writeJSON(KEYS.currentUser, profile);
  }

  function isLoggedIn() {
    return loadProfile() !== null;
  }

  /**
   * გასვლა. სტუმრის პროფილი (XP, პროგრესი, სიცოცხლეები) ცალკე ინახება,
   * რომ „სტუმრად“ ხელახლა შესვლამ ის არ გააქროს და სიცოცხლეები უფასოდ არ შეავსოს.
   */
  function logout() {
    const profile = loadProfile();
    if (profile && profile.isGuest) writeJSON(KEYS.guestProfile, profile);
    removeKey(KEYS.currentUser);
    redirect(URLS.login);
  }

  /** სტუმრის შენახული პროფილი (თუ ადრე სტუმრად იყო შესული), ან null. */
  function loadGuestProfile() {
    const profile = normalizeProfile(readJSON(KEYS.guestProfile, null));
    return profile && profile.isGuest ? profile : null;
  }

  function redirect(url) {
    window.location.replace(url);
  }

  /**
   * შესული მომხმარებლის პროფილი, ან გადამისამართება index.html-ზე.
   * გამოყენება: const profile = IMS_STORE.requireAuth(); if (!profile) return;
   */
  function requireAuth() {
    const profile = loadProfile();
    if (!profile) redirect(URLS.login);
    return profile;
  }

  /* ==========================================================
     დღიური შემოწმება: streak + სიცოცხლეები
     ========================================================== */

  /**
   * ახალ კალენდარულ დღეს:
   *   • streak: გუშინ აქტიური იყო → +1, დღე გამოტოვა → 1
   *   • სიცოცხლეები ივსება 5-მდე
   * აბრუნებს { newDay, heartsRefilled, profile }.
   */
  function checkDaily() {
    const current = loadProfile();
    if (!current) {
      redirect(URLS.login);
      return null;
    }

    const today = todayKey();
    if (current.lastActive === today) {
      return { newDay: false, heartsRefilled: false, profile: current };
    }

    let heartsRefilled = false;
    const profile = updateProfile((p) => {
      p.streak = p.lastActive === yesterdayKey() ? p.streak + 1 : 1;
      heartsRefilled = p.hearts < MAX_HEARTS;
      p.hearts = MAX_HEARTS;
      p.lastActive = today;
    });

    return { newDay: true, heartsRefilled: heartsRefilled, profile: profile };
  }

  /* ==========================================================
     თემა (Light / Dark)
     ========================================================== */

  const darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function applySavedTheme() {
    const saved = readString(KEYS.theme);
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
    const profile = readJSON(KEYS.currentUser, null);
    applyFrieze(profile && profile.friezeColor);
  }

  /* ფრიზის ფერი (საგანძურში იხსნება კლასის 50%-ზე): profile.friezeColor.
     ადრე ვსვამთ <html data-frieze>-ს, რომ გვერდმა ფერი არ „გადართოს“ ჩატვირთვისას. */
  const FRIEZE_COLORS = ["lapis", "carnelian", "gold", "clay"];

  function applyFrieze(color) {
    const root = document.documentElement;
    if (FRIEZE_COLORS.includes(color) && color !== "lapis") root.setAttribute("data-frieze", color);
    else root.removeAttribute("data-frieze");
  }

  function currentTheme() {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") return attr;
    return darkQuery && darkQuery.matches ? "dark" : "light";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    writeString(KEYS.theme, theme);
  }

  /** თემის გადამრთველი ღილაკის მიბმა (ხატულა + aria-label + click). */
  function bindThemeToggle(button, iconEl) {
    if (!button || !iconEl) return;

    function render() {
      const dark = currentTheme() === "dark";
      iconEl.textContent = dark ? "☀️" : "🌙";
      button.setAttribute("aria-label", dark ? "ნათელ თემაზე გადართვა" : "მუქ თემაზე გადართვა");
    }

    button.addEventListener("click", () => {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
      render();
    });

    if (darkQuery && darkQuery.addEventListener) {
      darkQuery.addEventListener("change", render);
    }

    // სხვა ჩანართში თემის შეცვლა
    window.addEventListener("storage", (e) => {
      if (e.key !== KEYS.theme) return;
      if (e.newValue === "dark" || e.newValue === "light") {
        document.documentElement.setAttribute("data-theme", e.newValue);
      }
      render();
    });

    render();
  }

  /* ==========================================================
     PWA: Service Worker + აპლიკაციის დაყენება
     ========================================================== */

  function registerServiceWorker() {
    // SW მუშაობს მხოლოდ უსაფრთხო კონტექსტში (HTTPS ან localhost), file://-ზე — არა
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        /* რეგისტრაცია ვერ მოხერხდა — საიტი ჩვეულებრივად მუშაობს ქეშის გარეშე */
      });
    });
  }

  // beforeinstallprompt შეიძლება ადრე მოვიდეს, ვიდრე გვერდის სკრიპტები ჩაიტვირთება —
  // ამიტომ ვიჭერთ აქ (storage.js <head>-ში იტვირთება) და ვინახავთ.
  let deferredInstallPrompt = null;
  const installListeners = [];

  function isStandalone() {
    return (
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true
    );
  }

  function isIos() {
    const ua = navigator.userAgent || "";
    return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  /**
   * "installed"   — უკვე აპლიკაციად არის გახსნილი
   * "available"   — ბრაუზერი გვთავაზობს დაყენებას (Chrome / Edge / Android)
   * "ios"         — iOS Safari: მხოლოდ „გაზიარება → მთავარ ეკრანზე დამატება“
   * "unavailable" — დაყენება ახლა შეუძლებელია
   */
  function getInstallState() {
    if (isStandalone()) return "installed";
    if (deferredInstallPrompt) return "available";
    if (isIos()) return "ios";
    return "unavailable";
  }

  function notifyInstall() {
    const state = getInstallState();
    installListeners.forEach((cb) => cb(state));
  }

  /** cb(state) გამოიძახება მაშინვე და ყოველი ცვლილებისას. */
  function onInstallStateChange(cb) {
    installListeners.push(cb);
    cb(getInstallState());
  }

  async function promptInstall() {
    if (!deferredInstallPrompt) return false;
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    notifyInstall();
    return choice && choice.outcome === "accepted";
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // ჩვენს ღილაკს ვაჩვენებთ ბრაუზერის ზოლის ნაცვლად
    deferredInstallPrompt = e;
    notifyInstall();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    notifyInstall();
  });

  /* ==========================================================
     გვერდის ჩატვირთვისას: თემა + ავტორიზაციის დაცვა + SW
     ========================================================== */

  registerServiceWorker();

  applySavedTheme();

  const script = document.currentScript;
  const authMode = script ? script.dataset.auth : null;

  if (authMode === "required" && !isLoggedIn()) {
    redirect(URLS.login);
  } else if (authMode === "guest-only" && isLoggedIn()) {
    redirect(URLS.dashboard);
  }

  /* ==========================================================
     საჯარო API
     ========================================================== */

  window.IMS_STORE = Object.freeze({
    KEYS: KEYS,
    URLS: URLS,
    MAX_HEARTS: MAX_HEARTS,
    ACTIVITY_DAYS: ACTIVITY_DAYS,

    // დაბალი დონე
    readString: readString,
    writeString: writeString,
    toCount: toCount,
    todayKey: todayKey,
    yesterdayKey: yesterdayKey,

    // პროფილი
    createProfile: createProfile,
    loadProfile: loadProfile,
    saveProfile: saveProfile,
    updateProfile: updateProfile,
    checkDaily: checkDaily,
    hasUnlimitedHearts: hasUnlimitedHearts,
    recordAnswer: recordAnswer,
    gemState: gemState,
    recordGem: recordGem,
    gemDusty: gemDusty,
    touchGem: touchGem,
    reviewGem: reviewGem,
    FRIEZE_COLORS: FRIEZE_COLORS,
    applyFrieze: applyFrieze,
    stampGems: stampGems,
    DUST_DAYS: DUST_DAYS,
    toDateKey: toDateKey,

    // ანგარიშები / სესია
    getUsers: getUsers,
    saveUsers: saveUsers,
    findAccount: findAccount,
    startSession: startSession,
    isLoggedIn: isLoggedIn,
    requireAuth: requireAuth,
    logout: logout,
    loadGuestProfile: loadGuestProfile,
    redirect: redirect,

    // თემა
    bindThemeToggle: bindThemeToggle,

    // PWA
    onInstallStateChange: onInstallStateChange,
    promptInstall: promptInstall,
  });
})();
