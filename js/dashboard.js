/* ==========================================================
   ისტორიის სამყარო — სასწავლო დაფის ლოგიკა
   ----------------------------------------------------------
   - შეუსვლელ მომხმარებელს აბრუნებს index.html-ზე
   - პროფილის ნებისმიერი ცვლილება ინახება ორივეგან:
       ims_currentUser  და  ims_users[email].profile (თუ სტუმარი არ არის)
   - DOM-ში მომხმარებლის/მონაცემების ტექსტი გამოდის მხოლოდ textContent-ით
   ========================================================== */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    users: "ims_users",
    currentUser: "ims_currentUser",
    theme: "ims_theme",
    selectedCourse: "ims_selectedCourse",
  };

  const LOGIN_URL = "index.html";
  const LESSON_URL = "lesson.html";

  // ბილიკის ზიგზაგის ფორმა (ჰორიზონტალური წანაცვლება)
  const PATH_OFFSETS = [0, -1, -1.6, -1, 0, 1, 1.6, 1];

  /* ---------- localStorage დამხმარეები ---------- */

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

  /* ---------- თარიღები (ლოკალური დროით) ---------- */

  function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function todayKey() {
    return toDateKey(new Date());
  }

  function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toDateKey(d);
  }

  /* ---------- პროფილი ---------- */

  function toCount(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
  }

  // აზღვევს არასწორი/ძველი ფორმატის მონაცემებისგან
  function normalizeProfile(raw) {
    if (!raw || typeof raw !== "object") return null;
    return {
      name: typeof raw.name === "string" && raw.name.trim() ? raw.name : "მოსწავლე",
      email: typeof raw.email === "string" ? raw.email : null,
      isGuest: raw.isGuest === true || !raw.email,
      xp: toCount(raw.xp, 0),
      streak: toCount(raw.streak, 1),
      hearts: Math.min(toCount(raw.hearts, 5), 5),
      completedLessons: Array.isArray(raw.completedLessons)
        ? raw.completedLessons.filter((id) => typeof id === "string")
        : [],
      lastActive: typeof raw.lastActive === "string" ? raw.lastActive : todayKey(),
    };
  }

  function loadProfile() {
    return normalizeProfile(readJSON(STORAGE_KEYS.currentUser, null));
  }

  /**
   * პროფილის შენახვა ორივე ადგილას სინქრონულად.
   * სტუმრის პროფილი ინახება მხოლოდ ims_currentUser-ში.
   */
  function saveProfile(profile) {
    const ok = writeJSON(STORAGE_KEYS.currentUser, profile);

    if (!profile.isGuest && profile.email) {
      const users = readJSON(STORAGE_KEYS.users, {});
      if (users && Object.prototype.hasOwnProperty.call(users, profile.email)) {
        users[profile.email].profile = profile;
        writeJSON(STORAGE_KEYS.users, users);
      }
    }
    return ok;
  }

  /**
   * პროგრესის განახლების ერთადერთი გზა:
   * updateProfile((p) => { p.xp += 10; });
   */
  function updateProfile(mutator) {
    const profile = loadProfile();
    if (!profile) {
      redirectToLogin();
      return null;
    }
    mutator(profile);
    saveProfile(profile);
    state.profile = profile;
    renderStats();
    return profile;
  }

  function redirectToLogin() {
    window.location.replace(LOGIN_URL);
  }

  /* ---------- ავტორიზაციის შემოწმება ---------- */

  const initialProfile = loadProfile();
  if (!initialProfile) {
    redirectToLogin();
    return;
  }

  const data = window.IMS_DATA;
  const state = {
    profile: initialProfile,
    courseId: null,
  };

  /* ---------- DOM ---------- */

  const el = {
    userName: document.getElementById("userName"),
    greetingTitle: document.getElementById("greetingTitle"),
    statStreak: document.getElementById("statStreak"),
    statXp: document.getElementById("statXp"),
    statHearts: document.getElementById("statHearts"),
    themeToggle: document.getElementById("themeToggle"),
    themeIcon: document.getElementById("themeIcon"),
    logoutBtn: document.getElementById("logoutBtn"),
    courseList: document.getElementById("courseList"),
    pathSection: document.getElementById("pathSection"),
    unitBanner: document.getElementById("unitBanner"),
    unitEyebrow: document.getElementById("unitEyebrow"),
    unitTitle: document.getElementById("unitTitle"),
    unitSubtitle: document.getElementById("unitSubtitle"),
    unitProgressText: document.getElementById("unitProgressText"),
    unitProgressFill: document.getElementById("unitProgressFill"),
    lessonPath: document.getElementById("lessonPath"),
    toast: document.getElementById("toast"),
  };

  function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* ---------- Toast ---------- */

  let toastTimer = null;

  function showToast(text) {
    el.toast.textContent = text;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.hidden = true;
    }, 2400);
  }

  /* ---------- სტატისტიკა / მომხმარებელი ---------- */

  function renderStats() {
    const p = state.profile;
    el.userName.textContent = p.name;
    el.greetingTitle.textContent = "გამარჯობა, " + p.name + "!";
    el.statStreak.textContent = String(p.streak);
    el.statXp.textContent = String(p.xp);
    el.statHearts.textContent = String(p.hearts);
  }

  /* ---------- დღიური სერია (streak) ---------- */

  function refreshStreak() {
    const today = todayKey();
    if (state.profile.lastActive === today) return;

    updateProfile((p) => {
      if (p.lastActive === yesterdayKey()) {
        p.streak += 1;
      } else {
        p.streak = 1; // დღე გამოტოვდა — სერია თავიდან იწყება
      }
      p.lastActive = today;
    });
  }

  /* ---------- კურსის პროგრესი ---------- */

  function courseProgress(course) {
    const done = new Set(state.profile.completedLessons);
    const completed = course.lessons.filter((l) => done.has(l.id)).length;
    return { completed: completed, total: course.lessons.length };
  }

  /* ---------- კურსის ბარათები ---------- */

  function renderCourses() {
    el.courseList.replaceChildren();

    data.courses.forEach((course) => {
      const selected = course.id === state.courseId;
      const progress = courseProgress(course);

      const card = createEl("button", "course-card");
      card.type = "button";
      card.id = "course-tab-" + course.id;
      card.dataset.color = course.color;
      card.setAttribute("role", "tab");
      card.setAttribute("aria-selected", String(selected));
      card.setAttribute("aria-controls", "pathSection");
      card.tabIndex = selected ? 0 : -1;

      card.append(
        createEl("span", "course-card__badge", course.badge),
        createEl("span", "course-card__title", course.title),
        createEl("span", "course-card__meta", progress.completed + " / " + progress.total + " გაკვეთილი")
      );

      card.addEventListener("click", () => selectCourse(course.id));
      card.addEventListener("keydown", onCourseKeydown);
      el.courseList.append(card);
    });
  }

  function onCourseKeydown(e) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();

    const ids = data.courses.map((c) => c.id);
    let i = ids.indexOf(state.courseId);
    if (e.key === "ArrowRight") i = (i + 1) % ids.length;
    if (e.key === "ArrowLeft") i = (i - 1 + ids.length) % ids.length;
    if (e.key === "Home") i = 0;
    if (e.key === "End") i = ids.length - 1;

    selectCourse(ids[i]);
    document.getElementById("course-tab-" + ids[i]).focus();
  }

  function selectCourse(courseId) {
    if (!data.getCourse(courseId)) courseId = data.courses[0].id;
    state.courseId = courseId;
    try {
      localStorage.setItem(STORAGE_KEYS.selectedCourse, courseId);
    } catch (e) { /* იგნორი */ }
    renderCourses();
    renderPath();
  }

  /* ---------- გაკვეთილების ბილიკი ---------- */

  function lessonUrl(courseId, lessonId) {
    const params = new URLSearchParams({ course: courseId, lesson: lessonId });
    return LESSON_URL + "?" + params.toString();
  }

  function renderPath() {
    const course = data.getCourse(state.courseId);
    const done = new Set(state.profile.completedLessons);
    const progress = courseProgress(course);

    // ბანერი
    el.pathSection.dataset.color = course.color;
    el.unitBanner.dataset.color = course.color;
    el.pathSection.setAttribute("aria-labelledby", "course-tab-" + course.id);
    el.unitEyebrow.textContent = course.title;
    el.unitTitle.textContent = course.subtitle;
    el.unitSubtitle.textContent = course.lessons.length + " გაკვეთილი";
    el.unitProgressText.textContent = "პროგრესი: " + progress.completed + " / " + progress.total;
    el.unitProgressFill.style.width =
      (progress.total ? Math.round((progress.completed / progress.total) * 100) : 0) + "%";

    // მიმდინარე = პირველი დაუსრულებელი გაკვეთილი
    const currentIndex = course.lessons.findIndex((l) => !done.has(l.id));

    el.lessonPath.replaceChildren();

    course.lessons.forEach((lesson, index) => {
      let status = "locked";
      if (done.has(lesson.id)) status = "completed";
      else if (index === currentIndex) status = "current";

      const item = createEl("li", "path__item");
      item.style.setProperty("--offset", String(PATH_OFFSETS[index % PATH_OFFSETS.length]));

      if (status === "current") {
        item.append(createEl("span", "path__start", "დაწყება"));
      }

      const node = createEl("button", "path-node path-node--" + status);
      node.type = "button";

      const icon = { completed: "✓", current: "★", locked: "🔒" }[status];
      node.append(createEl("span", "", icon));
      node.firstChild.setAttribute("aria-hidden", "true");

      const statusText = {
        completed: "დასრულებული",
        current: "მიმდინარე",
        locked: "დაბლოკილი",
      }[status];
      node.setAttribute("aria-label", (index + 1) + ". " + lesson.title + " — " + statusText);
      if (status === "locked") node.setAttribute("aria-disabled", "true");
      if (status === "current") node.setAttribute("aria-current", "step");

      node.addEventListener("click", () => {
        if (status === "locked") {
          showToast("🔒 ჯერ დაასრულე წინა გაკვეთილი");
          return;
        }
        window.location.href = lessonUrl(course.id, lesson.id);
      });

      const label = createEl(
        "span",
        "path__label" + (status === "locked" ? " path__label--locked" : ""),
        (index + 1) + ". " + lesson.title
      );
      label.setAttribute("aria-hidden", "true");

      item.append(node, label);
      el.lessonPath.append(item);
    });
  }

  /* ---------- თემა (Light / Dark) ---------- */

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") return attr;
    return darkQuery.matches ? "dark" : "light";
  }

  function renderThemeIcon() {
    const dark = currentTheme() === "dark";
    el.themeIcon.textContent = dark ? "☀️" : "🌙";
    el.themeToggle.setAttribute("aria-label", dark ? "ნათელ თემაზე გადართვა" : "მუქ თემაზე გადართვა");
  }

  el.themeToggle.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, next);
    } catch (e) { /* იგნორი */ }
    renderThemeIcon();
  });

  darkQuery.addEventListener("change", renderThemeIcon);

  /* ---------- გასვლა ---------- */

  el.logoutBtn.addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
    } catch (e) { /* იგნორი */ }
    redirectToLogin();
  });

  /* ---------- სხვა ჩანართში ცვლილება (მაგ.: გასვლა ან გაკვეთილის დასრულება) ---------- */

  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEYS.currentUser) return;
    const profile = loadProfile();
    if (!profile) {
      redirectToLogin();
      return;
    }
    state.profile = profile;
    renderStats();
    renderCourses();
    renderPath();
  });

  /* ---------- ინიციალიზაცია ---------- */

  renderStats();
  refreshStreak();
  renderThemeIcon();

  let savedCourse = null;
  try {
    savedCourse = localStorage.getItem(STORAGE_KEYS.selectedCourse);
  } catch (e) { /* იგნორი */ }
  selectCourse(savedCourse);

  // სხვა სკრიპტებისთვის (მაგ.: მომავალი lesson.js-ის ანალოგიური ლოგიკა)
  window.IMS_PROFILE = Object.freeze({ load: loadProfile, update: updateProfile });
})();
