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
  // მარშრუტი ცენტრთან ახლოს — გვერდებზე ილუსტრაციებისთვის ადგილი რჩება
  const PATH_OFFSETS = [0, -1, 0, 1];
  // ილუსტრაცია ყოველი მეორე გაკვეთილის შემდეგ — ასე ის ყოველთვის მარშრუტის საპირისპირო მხარესაა
  const DECOR_EVERY = 2;

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
    gamesLink: document.getElementById("gamesLink"),
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
    // თამაშები — არჩეული კურსის მასალით
    el.gamesLink.href = store.URLS.games + "?" + new URLSearchParams({ course: courseId }).toString();
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
    if (total === 0) chapterState = "locked"; // გაკვეთილები ჯერ არ დამატებულა
    else if (completed === total) chapterState = "completed";
    else if (currentIndex !== -1 && firstIndex > currentIndex) chapterState = "locked";

    const section = createEl("section", "chapter chapter--" + chapterState);
    section.dataset.color = course.color;
    const titleId = "chapter-title-" + chapter.id;
    section.setAttribute("aria-labelledby", titleId);

    // --- პერგამენტის ბანერი ---
    const banner = createEl("header", "chapter-banner");

    const body = createEl("div", "chapter-banner__body");
    body.append(createEl("p", "chapter-banner__eyebrow", "თავი " + toRoman(chapter.number) + " · " + course.title));
    const title = createEl("h2", "chapter-banner__title", chapter.title);
    title.id = titleId;
    body.append(title);
    if (chapter.description) body.append(createEl("p", "chapter-banner__desc", chapter.description));

    const progressBox = createEl("div", "chapter-banner__progress");
    if (chapterState === "completed") progressBox.append(createEl("span", "chapter-banner__status", "✓ დასრულებული"));
    if (chapterState === "locked") progressBox.append(createEl("span", "chapter-banner__status", total ? "🔒 დაბლოკილი" : "⏳ მალე დაემატება"));
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

    banner.append(body, progressBox);
    section.append(banner);

    // --- მედალიონების ბილიკი + რუკის მარშრუტი ---
    const path = createEl("ol", "path");
    path.setAttribute("aria-label", "თავი " + chapter.number + " — გაკვეთილები");

    const route = document.createElementNS(SVG_NS, "svg");
    route.setAttribute("class", "path__route");
    route.setAttribute("aria-hidden", "true");
    route.setAttribute("focusable", "false");
    path.append(route);

    // თემატური ილუსტრაციები: თითო ფირფიტა = ერთი არტეფაქტი საკუთარი tooltip-ით.
    // ერთ თავში ბარათი არასოდეს მეორდება (იხ. planDecor), მხარეები მონაცვლეობს.
    const decor = window.IMS_ILLUSTRATIONS ? window.IMS_ILLUSTRATIONS.forChapter(chapter.id) : [];
    const plan = anchoredDecor(chapter.lessons, decor) || planDecor(chapter.lessons.length, decor.length);
    let decorIndex = 0;
    // ქვეთავები (თუ აქვს): ზოლი პირველი გაკვეთილის წინ; ქვეთავის გაკვეთილები
    // და ილუსტრაციები data-section-ით ინიშნება, რომ ზოლიდან დაიკეცოს.
    const sections = chapter.sections || [];
    const sectionByStart = new Map(sections.map((sec, k) => [sec.start, { sec: sec, k: k }]));
    let group = null; // { sec, k, open }
    chapter.lessons.forEach((lesson, i) => {
      if (sectionByStart.has(lesson.id)) {
        const { sec, k } = sectionByStart.get(lesson.id);
        const banner = buildSectionBanner(course, sec, k, done, currentIndex);
        group = { sec: sec, k: k, open: banner.dataset.open === "true" };
        path.append(banner);
      }
      const node = buildLessonNode(course, lesson, i, lessonStatus(course, lesson, done, currentIndex));
      if (group) markSectionItem(node, group);
      path.append(node);
      if (plan.has(i)) {
        const card = buildDecor(decor[plan.get(i)], decorIndex);
        if (group) markSectionItem(card, group);
        path.append(card);
        decorIndex += 1;
      }
    });

    section.append(path);
    return section;
  }

  /* ---------- ქვეთავები: ფერადი ზოლი, დაკეცვა, „თემები“ ---------- */

  // ქვეთავების ფერები რიგრიგობით (css/dashboard.css → .sec-0 … .sec-4)
  const SECTION_COLORS = 5;

  function readFolds() {
    try {
      const value = JSON.parse(store.readString(store.KEYS.sectionFold) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (e) {
      return {};
    }
  }

  function saveFold(sectionId, open) {
    const folds = readFolds();
    folds[sectionId] = open;
    store.writeString(store.KEYS.sectionFold, JSON.stringify(folds));
  }

  function markSectionItem(item, group) {
    item.dataset.section = group.sec.id;
    item.classList.add("sec-" + (group.k % SECTION_COLORS));
    item.hidden = !group.open;
  }

  /**
   * ქვეთავის ზოლი: ფერადი ნომერი, სათაური, პროგრესი, 🏅 დასრულებისას.
   * დასრულებული ქვეთავი თავიდან დაკეცილია; მოსწავლის არჩევანი ინახება.
   */
  function buildSectionBanner(course, section, k, done, currentIndex) {
    const total = section.lessons.length;
    const completed = section.lessons.filter((l) => done.has(l.id)).length;
    const firstIndex = total ? course.lessons.indexOf(section.lessons[0]) : -1;
    let state = "active";
    if (total && completed === total) state = "completed";
    else if (!total || (currentIndex !== -1 && firstIndex > currentIndex)) state = "locked";

    const saved = readFolds()[section.id];
    const open = typeof saved === "boolean" ? saved : state !== "completed";

    const item = createEl("li", "path__section path__section--" + state + " sec-" + (k % SECTION_COLORS));
    item.dataset.open = String(open);

    const head = createEl("button", "path__section-head");
    head.type = "button";
    head.setAttribute("aria-expanded", String(open));

    const badge = createEl("span", "path__section-badge", section.number);
    badge.setAttribute("aria-hidden", "true");

    const text = createEl("span", "path__section-text");
    text.append(createEl("span", "path__section-eyebrow", "ქვეთავი " + section.number));
    text.append(createEl("span", "path__section-title", section.title));

    const side = createEl("span", "path__section-side");
    if (state === "completed") side.append(createEl("span", "path__section-medal", "🏅"));
    if (state === "locked") side.append(createEl("span", "path__section-lock", "🔒"));
    const chevron = createEl("span", "path__section-chevron", "▾");
    chevron.setAttribute("aria-hidden", "true");
    side.append(chevron);

    head.append(badge, text, side);
    head.setAttribute("aria-label", "ქვეთავი " + section.number + ": " + section.title + " — " +
      completed + " / " + total + " გაკვეთილი" + (state === "completed" ? ", დასრულებული" : ""));
    head.addEventListener("click", () => {
      const next = item.dataset.open !== "true";
      item.dataset.open = String(next);
      head.setAttribute("aria-expanded", String(next));
      item.parentElement.querySelectorAll('[data-section="' + section.id + '"]').forEach((node) => {
        node.hidden = !next;
      });
      saveFold(section.id, next);
      scheduleRoutes();
    });
    item.append(head);

    const meta = createEl("div", "path__section-meta");
    const bar = createEl("div", "chapter-progress path__section-progress");
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", "ქვეთავი " + section.number + " — პროგრესი");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(total));
    bar.setAttribute("aria-valuenow", String(completed));
    const fill = createEl("div", "chapter-progress__fill");
    fill.style.width = (total ? Math.round((completed / total) * 100) : 0) + "%";
    bar.append(fill);
    meta.append(bar, createEl("span", "path__section-count", completed + " / " + total));
    item.append(meta);

    if (section.description) {
      const topics = createEl("details", "path__section-topics");
      topics.append(createEl("summary", "", "თემები"));
      topics.append(createEl("p", "", section.description));
      topics.addEventListener("toggle", scheduleRoutes);
      item.append(topics);
    }
    return item;
  }

  function buildLessonNode(course, lesson, indexInChapter, status) {
    const item = createEl("li", "path__item");
    item.dataset.status = status;
    item.style.setProperty("--offset", String(PATH_OFFSETS[indexInChapter % PATH_OFFSETS.length]));

    if (status === "current") {
      item.append(createEl("span", "path__start", "დაწყება"));
    }

    const wrap = createEl("div", "medallion-wrap");

    const node = createEl("button", "medallion medallion--" + status);
    node.type = "button";

    const symbol = createEl("span", "medallion__symbol");
    symbol.setAttribute("aria-hidden", "true");
    if (status === "locked") symbol.append(lockIcon());
    else symbol.textContent = status === "completed" ? "✓" : "★";
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

  /* ---------- თემატური ილუსტრაციები + ფაქტის tooltip ---------- */

  /**
   * სად და რომელი ბარათი ჩავსვათ: Map(გაკვეთილის ინდექსი → ბარათის ინდექსი).
   * ადგილები — ყოველი DECOR_EVERY გაკვეთილის შემდეგ (ერთგაკვეთილიან თავში — ერთი).
   * ბარათები თანაბრად ნაწილდება და არასოდეს მეორდება: თუ ადგილი ბარათებზე
   * მეტია, ზედმეტი ადგილები გამოიტოვება (ფირფიტები უფრო იშვიათად ჩნდება).
   */
  function planDecor(lessonCount, cardCount) {
    const plan = new Map();
    if (!lessonCount || !cardCount) return plan;
    const slots = [];
    for (let i = DECOR_EVERY - 1; i < lessonCount; i += DECOR_EVERY) slots.push(i);
    if (!slots.length) slots.push(lessonCount - 1);
    const used = Math.min(slots.length, cardCount);
    const pick = (k, from) => (used === 1 ? 0 : Math.round((k * (from - 1)) / (used - 1)));
    for (let k = 0; k < used; k++) plan.set(slots[pick(k, slots.length)], pick(k, cardCount));
    return plan;
  }

  /**
   * თუ ბარათებს აქვთ `after` (გაკვეთილის id), ბარათი ზუსტად იმ გაკვეთილის
   * შემდეგ ჯდება — თემატური დამთხვევისთვის. უცნობი id-ის ბარათი გამოიტოვება.
   * თუ არცერთ ბარათს არ აქვს `after`, გამოიყენება planDecor (თანაბარი განაწილება).
   */
  function anchoredDecor(lessons, cards) {
    if (!cards.some((card) => card.after)) return null;
    const plan = new Map();
    cards.forEach((card, k) => {
      const i = lessons.findIndex((lesson) => lesson.id === card.after);
      if (i !== -1 && !plan.has(i)) plan.set(i, k);
    });
    return plan;
  }

  let decorSeq = 0;

  function buildDecor(illustration, k) {
    const item = createEl("li", "path__decor path__decor--" + (k % 2 === 0 ? "right" : "left"));
    // სხვადასხვა ფაზა, რომ ილუსტრაციები სინქრონულად არ „ცეკვავდნენ“
    item.style.setProperty("--delay", (-(k * 1.3)).toFixed(1) + "s");

    const tipId = "decor-tip-" + (++decorSeq);
    const btn = createEl("button", "path__decor-btn");
    btn.type = "button";
    btn.setAttribute("aria-label", illustration.title + " — საინტერესო ფაქტი");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-describedby", tipId);
    btn.append(window.IMS_ILLUSTRATIONS.createSvg(illustration));

    const tip = createEl("span", "path__decor-tip");
    tip.id = tipId;
    tip.setAttribute("role", "tooltip");
    tip.append(
      createEl("strong", "path__decor-title", illustration.title),
      createEl("span", "path__decor-fact", illustration.fact)
    );

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDecor(item);
    });

    item.append(btn, tip);
    return item;
  }

  function closeDecors(except) {
    el.chapterList.querySelectorAll(".path__decor.is-open").forEach((d) => {
      if (d === except) return;
      d.classList.remove("is-open");
      d.querySelector(".path__decor-btn").setAttribute("aria-expanded", "false");
    });
  }

  function toggleDecor(item) {
    const open = !item.classList.contains("is-open");
    closeDecors(item);
    item.classList.toggle("is-open", open);
    item.querySelector(".path__decor-btn").setAttribute("aria-expanded", String(open));
  }

  // შეხება სხვაგან ან Escape — tooltip იხურება
  document.addEventListener("click", () => closeDecors(null));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDecors(null);
  });

  /** ბრტყელი ბოქლომის ხატულა (SVG) დაბლოკილი ნიშნისთვის. */
  function lockIcon() {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("focusable", "false");
    const shackle = document.createElementNS(SVG_NS, "path");
    shackle.setAttribute("d", "M8 11V8a4 4 0 0 1 8 0v3");
    shackle.setAttribute("fill", "none");
    shackle.setAttribute("stroke", "currentColor");
    shackle.setAttribute("stroke-width", "2.2");
    shackle.setAttribute("stroke-linecap", "round");
    const body = document.createElementNS(SVG_NS, "rect");
    body.setAttribute("x", "5.5");
    body.setAttribute("y", "11");
    body.setAttribute("width", "13");
    body.setAttribute("height", "9.5");
    body.setAttribute("rx", "2");
    body.setAttribute("fill", "currentColor");
    svg.append(shackle, body);
    return svg;
  }

  /* ---------- რუკის მარშრუტი (SVG) ---------- */

  /** მედალიონების ცენტრებს აერთებს დაკლაკნილი წყვეტილი ხაზით. */
  function drawRoute(path) {
    const svg = path.querySelector(".path__route");
    if (!svg) return;
    svg.replaceChildren();

    const items = Array.from(path.querySelectorAll(".path__item")).filter((item) => !item.hidden);
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
        color: getComputedStyle(item).getPropertyValue("--sec").trim(),
      };
    });

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const dy = b.y - a.y;
      // მონაცვლე მოხვევა — ძველი რუკის კლაკნილი გზა
      const bend = (i % 2 === 0 ? -1 : 1) * Math.min(48, box.width / 8);
      const d =
        "M " + a.x + " " + a.y +
        " C " + (a.x + bend) + " " + (a.y + dy * 0.45) +
        ", " + (b.x - bend) + " " + (b.y - dy * 0.45) +
        ", " + b.x + " " + b.y;

      const line = document.createElementNS(SVG_NS, "path");
      line.setAttribute("d", d);
      line.setAttribute("class", "path__route-line" + (b.reached ? " path__route-line--done" : ""));
      // ქვეთავის შიგნით გავლილი გზა ქვეთავის ფერისაა
      if (b.reached && b.color && a.color === b.color) line.style.stroke = b.color;
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
