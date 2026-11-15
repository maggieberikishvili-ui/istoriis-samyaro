/* ==========================================================
   ისტორიის სამყარო — სასწავლო დაფის ლოგიკა
   ----------------------------------------------------------
   საცავი, სინქრონიზაცია, თემა და ავტორიზაცია — js/storage.js
   DOM-ში ტექსტი გამოდის მხოლოდ textContent-ით.
   ========================================================== */

(function () {
  "use strict";

  const store = window.IMS_STORE;
  const data = window.IMS_DATA;

  // ზიგზაგის ფორმა (ჰორიზონტალური წანაცვლება)
  const PATH_OFFSETS = [0, -1, -1.6, -1, 0, 1, 1.6, 1];

  if (!store.requireAuth()) return;

  const state = {
    profile: store.loadProfile(),
    courseId: null,
  };

  /* ---------- DOM ---------- */

  const el = {
    userName: document.getElementById("userName"),
    greetingTitle: document.getElementById("greetingTitle"),
    statStreak: document.getElementById("statStreak"),
    statXp: document.getElementById("statXp"),
    statHearts: document.getElementById("statHearts"),
    heartsStat: document.getElementById("heartsStat"),
    refillItem: document.getElementById("refillItem"),
    refillBtn: document.getElementById("refillBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    courseList: document.getElementById("courseList"),
    pathSection: document.getElementById("pathSection"),
    chapterList: document.getElementById("chapterList"),
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
    }, 2800);
  }

  /* ---------- სტატისტიკა / მომხმარებელი ---------- */

  function renderStats() {
    const p = state.profile;
    el.userName.textContent = p.name;
    el.greetingTitle.textContent = "გამარჯობა, " + p.name + "!";
    el.statStreak.textContent = String(p.streak);
    el.statXp.textContent = String(p.xp);

    // Pro → ∞ სიცოცხლე; სხვებს — „+ ❤️ აღდგენა“, როცა სიცოცხლე < 5
    const unlimited = store.hasUnlimitedHearts(p);
    el.statHearts.textContent = unlimited ? "∞" : String(p.hearts);
    el.heartsStat.title = unlimited ? "Pro — ულიმიტო სიცოცხლე" : "სიცოცხლეები";
    el.refillItem.hidden = unlimited || p.hearts >= store.MAX_HEARTS;
  }

  /** 0 ❤️ (და არა Pro) — ახალ გაკვეთილს ვერ დაიწყებს. */
  function isOutOfHearts() {
    return !store.hasUnlimitedHearts(state.profile) && state.profile.hearts <= 0;
  }

  function nudgeRefill() {
    el.refillBtn.classList.remove("is-attention");
    void el.refillBtn.offsetWidth; // ანიმაციის თავიდან გაშვება
    el.refillBtn.classList.add("is-attention");
  }

  /* ---------- დღიური შემოწმება და სიცოცხლეები ---------- */

  function runDailyCheck() {
    // ავტომატური შევსება მხოლოდ ახალ კალენდარულ დღეს (streak-თან ერთად).
    // იმავე დღეს 0 ❤️ → მხოლოდ „+ ❤️ აღდგენის“ სავარჯიშოთი.
    const result = store.checkDaily();
    if (!result) return;
    state.profile = result.profile;

    if (result.heartsRefilled) {
      showToast("☀️ ახალი დღე — სიცოცხლეები 5-მდე შეივსო!");
    }
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
    store.writeString(store.KEYS.selectedCourse, courseId);
    // „+ ❤️ აღდგენა“ — სავარჯიშო მხოლოდ არჩეული კურსის კითხვებით
    el.refillBtn.href = store.URLS.lesson + "?" +
      new URLSearchParams({ mode: "practice", course: courseId }).toString();
    renderCourses();
    renderPath();
  }

  /* ---------- გაკვეთილების ბილიკი ---------- */

  function lessonUrl(courseId, lessonId) {
    const params = new URLSearchParams({ course: courseId, lesson: lessonId });
    return store.URLS.lesson + "?" + params.toString();
  }

  const SVG_NS = "http://www.w3.org/2000/svg";

  function toRoman(n) {
    const map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let out = "";
    map.forEach(([value, glyph]) => {
      while (n >= value) {
        out += glyph;
        n -= value;
      }
    });
    return out || String(n);
  }

  /** ბილიკის რენდერი: კურსის ყოველ თავს — ბანერი + მედალიონების ბილიკი. */
  function renderPath() {
    const course = data.getCourse(state.courseId);
    const done = new Set(state.profile.completedLessons);
    // მიმდინარე = კურსის პირველი დაუსრულებელი გაკვეთილი (თავების რიგით)
    const currentIndex = course.lessons.findIndex((l) => !done.has(l.id));

    el.pathSection.dataset.color = course.color;
    el.pathSection.setAttribute("aria-labelledby", "course-tab-" + course.id);
    el.chapterList.replaceChildren();

    course.chapters.forEach((chapter) => {
      el.chapterList.append(buildChapter(course, chapter, done, currentIndex));
    });

    scheduleRoutes();
  }

  function lessonStatus(course, lesson, done, currentIndex) {
    if (done.has(lesson.id)) return "completed";
    return course.lessons.indexOf(lesson) === currentIndex ? "current" : "locked";
  }

  function buildChapter(course, chapter, done, currentIndex) {
    const total = chapter.lessons.length;
    const completed = chapter.lessons.filter((l) => done.has(l.id)).length;
    const firstIndex = course.lessons.indexOf(chapter.lessons[0]);

    let chapterState = "active";
    if (total > 0 && completed === total) chapterState = "completed";
    else if (currentIndex !== -1 && firstIndex > currentIndex) chapterState = "locked";

    const section = createEl("section", "chapter chapter--" + chapterState);
    section.dataset.color = course.color;
    const titleId = "chapter-title-" + chapter.id;
    section.setAttribute("aria-labelledby", titleId);

    // --- პერგამენტის ბანერი ---
    const banner = createEl("header", "chapter-banner");

    const seal = createEl("span", "chapter-banner__seal", course.badge);
    seal.setAttribute("aria-hidden", "true");

    const body = createEl("div", "chapter-banner__body");
    body.append(createEl("p", "chapter-banner__eyebrow", "✦ თავი " + toRoman(chapter.number) + " ✦"));
    const title = createEl("h2", "chapter-banner__title", chapter.title);
    title.id = titleId;
    body.append(title);
    if (chapter.description) body.append(createEl("p", "chapter-banner__desc", chapter.description));

    const progressBox = createEl("div", "chapter-banner__progress");
    if (chapterState === "completed") progressBox.append(createEl("span", "chapter-banner__status", "✓ დასრულებული"));
    if (chapterState === "locked") progressBox.append(createEl("span", "chapter-banner__status", "🔒 დაბლოკილი"));
    progressBox.append(createEl("div", "", completed + " / " + total + " გაკვეთილი"));
    const bar = createEl("div", "chapter-progress");
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", chapter.title + " — პროგრესი");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(total));
    bar.setAttribute("aria-valuenow", String(completed));
    const fill = createEl("div", "chapter-progress__fill");
    fill.style.width = (total ? Math.round((completed / total) * 100) : 0) + "%";
    bar.append(fill);
    progressBox.append(bar);

    banner.append(seal, body, progressBox);
    section.append(banner);

    // --- მედალიონების ბილიკი + რუკის მარშრუტი ---
    const path = createEl("ol", "path");
    path.setAttribute("aria-label", "თავი " + chapter.number + " — გაკვეთილები");

    const route = document.createElementNS(SVG_NS, "svg");
    route.setAttribute("class", "path__route");
    route.setAttribute("aria-hidden", "true");
    route.setAttribute("focusable", "false");
    path.append(route);

    chapter.lessons.forEach((lesson, i) => {
      path.append(buildLessonNode(course, lesson, i, lessonStatus(course, lesson, done, currentIndex)));
    });

    section.append(path);
    return section;
  }

  function buildLessonNode(course, lesson, indexInChapter, status) {
    const item = createEl("li", "path__item");
    item.dataset.status = status;
    item.style.setProperty("--offset", String(PATH_OFFSETS[indexInChapter % PATH_OFFSETS.length]));

    if (status === "current") {
      item.append(createEl("span", "path__start", "დაწყება"));
    }

    const wrap = createEl("div", "medallion-wrap");
    if (status === "current") {
      const halo = createEl("span", "medallion-halo");
      halo.setAttribute("aria-hidden", "true");
      wrap.append(halo);
    }

    const node = createEl("button", "medallion medallion--" + status);
    node.type = "button";

    const symbol = createEl("span", "medallion__symbol", { completed: "✓", current: "★", locked: "🔒" }[status]);
    symbol.setAttribute("aria-hidden", "true");
    node.append(symbol);

    const statusText = { completed: "დასრულებული", current: "მიმდინარე", locked: "დაბლოკილი" }[status];
    node.setAttribute("aria-label", (indexInChapter + 1) + ". " + lesson.title + " — " + statusText);
    if (status === "locked") node.setAttribute("aria-disabled", "true");
    if (status === "current") node.setAttribute("aria-current", "step");

    node.addEventListener("click", () => {
      if (status === "locked") {
        showToast("🔒 ჯერ დაასრულე წინა გაკვეთილი");
        return;
      }
      if (isOutOfHearts()) {
        showToast("💔 სიცოცხლეები ამოიწურა! გაიარე სავარჯიშო სიცოცხლის აღსადგენად.");
        nudgeRefill();
        return;
      }
      window.location.href = lessonUrl(course.id, lesson.id);
    });

    wrap.append(node);

    const label = createEl(
      "span",
      "path__label" + (status === "locked" ? " path__label--locked" : ""),
      (indexInChapter + 1) + ". " + lesson.title
    );
    label.setAttribute("aria-hidden", "true");

    item.append(wrap, label);
    return item;
  }

  /* ---------- რუკის მარშრუტი (SVG) ---------- */

  /** მედალიონების ცენტრებს აერთებს დაკლაკნილი წყვეტილი ხაზით. */
  function drawRoute(path) {
    const svg = path.querySelector(".path__route");
    if (!svg) return;
    svg.replaceChildren();

    const items = Array.from(path.querySelectorAll(".path__item"));
    if (items.length < 2) return;

    const box = path.getBoundingClientRect();
    if (box.width === 0) return;
    svg.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);

    const points = items.map((item) => {
      const r = item.querySelector(".medallion").getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - box.left,
        y: r.top + r.height / 2 - box.top,
        reached: item.dataset.status !== "locked",
      };
    });

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const dy = b.y - a.y;
      // მონაცვლე „ღუზა“ — ძველი რუკის კლაკნილი გზა
      const bend = (i % 2 === 0 ? -1 : 1) * Math.min(36, box.width / 10);
      const d =
        "M " + a.x + " " + a.y +
        " C " + (a.x + bend) + " " + (a.y + dy * 0.45) +
        ", " + (b.x - bend) + " " + (b.y - dy * 0.45) +
        ", " + b.x + " " + b.y;

      const line = document.createElementNS(SVG_NS, "path");
      line.setAttribute("d", d);
      line.setAttribute("class", "path__route-line" + (b.reached ? " path__route-line--done" : ""));
      svg.append(line);
    }
  }

  let routeFrame = 0;

  function scheduleRoutes() {
    cancelAnimationFrame(routeFrame);
    routeFrame = requestAnimationFrame(() => {
      el.chapterList.querySelectorAll(".path").forEach(drawRoute);
    });
  }

  // ზომის/შრიფტის ცვლილებისას მარშრუტის თავიდან დახატვა
  if ("ResizeObserver" in window) {
    new ResizeObserver(scheduleRoutes).observe(el.chapterList);
  } else {
    window.addEventListener("resize", scheduleRoutes);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleRoutes);
  }

  /* ---------- აპლიკაციის დაყენება (PWA) ---------- */

  function setupInstallBanner() {
    const banner = document.getElementById("installBanner");
    const text = document.getElementById("installText");
    const installBtn = document.getElementById("installBtn");
    const dismissBtn = document.getElementById("installDismiss");

    const dismissed = () => store.readString(store.KEYS.installDismissed) === "1";

    store.onInstallStateChange((installState) => {
      const show = !dismissed() && (installState === "available" || installState === "ios");
      banner.hidden = !show;
      if (!show) return;

      installBtn.hidden = installState !== "available";
      text.textContent =
        installState === "ios"
          ? "Safari-ში დააჭირე „გაზიარებას“ (⬆️) და აირჩიე „მთავარ ეკრანზე დამატება“."
          : "გახსენი ერთი შეხებით, მთელ ეკრანზე — ინტერნეტის გარეშეც.";
    });

    installBtn.addEventListener("click", () => store.promptInstall());
    dismissBtn.addEventListener("click", () => {
      store.writeString(store.KEYS.installDismissed, "1");
      banner.hidden = true;
    });
  }

  /* ---------- გასვლა ---------- */

  el.logoutBtn.addEventListener("click", store.logout);

  /* ---------- სხვა ჩანართში ცვლილება (გასვლა / გაკვეთილის დასრულება) ---------- */

  window.addEventListener("storage", (e) => {
    if (e.key !== store.KEYS.currentUser) return;
    const profile = store.loadProfile();
    if (!profile) {
      store.redirect(store.URLS.login);
      return;
    }
    state.profile = profile;
    renderStats();
    renderCourses();
    renderPath();
  });

  /* ---------- ინიციალიზაცია ---------- */

  runDailyCheck();
  renderStats();
  store.bindThemeToggle(
    document.getElementById("themeToggle"),
    document.getElementById("themeIcon")
  );
  selectCourse(store.readString(store.KEYS.selectedCourse));
  setupInstallBanner();
})();
