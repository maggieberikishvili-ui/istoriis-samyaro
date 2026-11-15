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
  });

  const URLS = Object.freeze({
    login: "index.html",
    dashboard: "dashboard.html",
    lesson: "lesson.html",
  });

  const MAX_HEARTS = 5;

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
    };
  }

  /** აზღვევს არასწორი ან ძველი ფორმატის მონაცემებისგან. */
  function normalizeProfile(raw) {
    if (!raw || typeof raw !== "object") return null;
    return {
      name: typeof raw.name === "string" && raw.name.trim() ? raw.name : "მოსწავლე",
      email: typeof raw.email === "string" ? raw.email : null,
      isGuest: raw.isGuest === true || !raw.email,
      isPro: raw.isPro === true,
      xp: toCount(raw.xp, 0),
      streak: toCount(raw.streak, 1),
      hearts: Math.min(toCount(raw.hearts, MAX_HEARTS), MAX_HEARTS),
      completedLessons: Array.isArray(raw.completedLessons)
        ? raw.completedLessons.filter((id) => typeof id === "string")
        : [],
      lastActive: typeof raw.lastActive === "string" ? raw.lastActive : todayKey(),
    };
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
    mutator(profile);
    saveProfile(profile);
    return profile;
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

  function logout() {
    removeKey(KEYS.currentUser);
    redirect(URLS.login);
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
     გვერდის ჩატვირთვისას: თემა + ავტორიზაციის დაცვა
     ========================================================== */

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

    // დაბალი დონე
    readString: readString,
    writeString: writeString,
    toCount: toCount,
    todayKey: todayKey,

    // პროფილი
    createProfile: createProfile,
    loadProfile: loadProfile,
    saveProfile: saveProfile,
    updateProfile: updateProfile,
    checkDaily: checkDaily,
    hasUnlimitedHearts: hasUnlimitedHearts,

    // ანგარიშები / სესია
    getUsers: getUsers,
    saveUsers: saveUsers,
    findAccount: findAccount,
    startSession: startSession,
    isLoggedIn: isLoggedIn,
    requireAuth: requireAuth,
    logout: logout,
    redirect: redirect,

    // თემა
    bindThemeToggle: bindThemeToggle,
  });
})();
