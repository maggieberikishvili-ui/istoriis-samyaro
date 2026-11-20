/* ==========================================================
   ისტორიის სამყარო — სასწავლო დაფის ლოგიკა
   ----------------------------------------------------------
   საცავი, სინქრონიზაცია, თემა და ავტორიზაცია — js/storage.js
   DOM-ში ტექსტი გამოდის მხოლოდ textContent-ით.
   ========================================================== */

// ჯერ იტვირთება საჭირო კლასის მასალა (js/data/), შემდეგ — გვერდი
window.IMS_DATA.load([window.IMS_DATA.currentCourseId()]).then(function () {
  "use strict";

  const { createEl, toRoman } = window.IMS_UTILS; // js/utils.js

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
    mistakesLink: document.getElementById("mistakesLink"),
    mistakesText: document.getElementById("mistakesText"),
    logoutBtn: document.getElementById("logoutBtn"),
    courseList: document.getElementById("courseList"),
    pathSection: document.getElementById("pathSection"),
    chapterList: document.getElementById("chapterList"),
    toast: document.getElementById("toast"),
  };

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

    // მტვრის ათვლა: ადრე გავლილ გაკვეთილებს თარიღი ეწერება (ერთხელ)
    const p = state.profile;
    if (typeof store.stampGems === "function" && p.completedLessons.some((id) => !p.gemSeen[id])) {
      state.profile = store.updateProfile((x) => store.stampGems(x)) || p;
    }

    if (result.heartsRefilled) {
      showToast("☀️ ახალი დღე — სიცოცხლეები 5-მდე შეივსო!");
    }
  }

  /* ---------- კურსის პროგრესი ---------- */

  function courseProgress(course) {
    const done = new Set(state.profile.completedLessons);
    if (!course.loaded) {
      // კურსის ფაილი ჯერ არ ჩატვირთულა — ვითვლით id-ის პრეფიქსით (g8-l…)
      const completed = Array.from(done).filter((id) => id.indexOf(course.lessonPrefix) === 0).length;
      return { completed: Math.min(completed, course.lessonCount), total: course.lessonCount };
    }
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
    // არჩეული კლასის მასალა იტვირთება მხოლოდ საჭიროებისას (js/data/<id>.js)
    el.pathSection.setAttribute("aria-busy", "true");
    data.load([courseId]).then(() => {
      if (state.courseId !== courseId) return; // სანამ იტვირთებოდა, სხვა კლასი აირჩიეს
      el.pathSection.removeAttribute("aria-busy");
      renderCourses();
      renderPath();
      renderMistakes();
    }, data.showLoadError);
  }

  /* ---------- ჩემი შეცდომები (არჩეული კურსი) ---------- */

  function renderMistakes() {
    const courseId = state.courseId;
    const count = state.profile.mistakes.filter((m) =>
      m.c === courseId && data.findStep(m.c, m.l, m.i, m.q)).length;
    el.mistakesLink.hidden = count === 0;
    el.mistakesLink.href = store.URLS.lesson + "?" +
      new URLSearchParams({ mode: "mistakes", course: courseId }).toString();
    el.mistakesText.textContent = count + " კითხვა · სიცოცხლე არ აკლდება";
  }

  /* ---------- გაკვეთილების ბილიკი ---------- */

  function lessonUrl(courseId, lessonId) {
    const params = new URLSearchParams({ course: courseId, lesson: lessonId });
    return store.URLS.lesson + "?" + params.toString();
  }

  const SVG_NS = "http://www.w3.org/2000/svg";

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

    // --- დაკეცვა: ბანერზე დაჭერა თავის ბილიკს მალავს/აჩენს (ყველა კლასში) ---
    // დასრულებული თავი თავიდან დაკეცილია; მოსწავლის არჩევანი ინახება.
    const savedFold = readFolds()[chapter.id];
    let open = typeof savedFold === "boolean" ? savedFold : chapterState !== "completed";
    section.dataset.open = String(open);

    const pathId = "chapter-path-" + chapter.id;
    const toggle = createEl("button", "chapter-banner__toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-controls", pathId);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", "თავი " + toRoman(chapter.number) + ": " + chapter.title + " — გაკვეთილების ჩვენება");
    toggle.append(foldChevron());

    banner.append(body, progressBox, toggle);
    section.append(banner);

    // --- მედალიონების ბილიკი + რუკის მარშრუტი ---
    const path = createEl("ol", "path");
    path.id = pathId;
    path.hidden = !open;
    path.setAttribute("aria-label", "თავი " + chapter.number + " — გაკვეთილები");

    function setOpen(next) {
      open = next;
      section.dataset.open = String(next);
      toggle.setAttribute("aria-expanded", String(next));
      path.hidden = !next;
      saveFold(chapter.id, next);
      scheduleRoutes();
    }
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(!open);
    });
    banner.addEventListener("click", () => setOpen(!open));

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
    side.append(foldChevron());

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

    const node = createEl("button", "medallion medallion--gem medallion--" + status);
    node.type = "button";

    // ერთი გაკვეთილი = ერთი ქვა (js/gems.js): გავლილზე — ქვა, დანარჩენზე — ცარიელი ბუდე
    const gems = window.IMS_GEMS;
    const kind = gems.kindFor(course.lessons.indexOf(lesson));
    const symbol = createEl("span", "medallion__symbol");
    symbol.setAttribute("aria-hidden", "true");
    // (typeof — თუ ბრაუზერს ჯერ ძველი storage.js აქვს, ბილიკი მაინც გამოჩნდეს)
    const quality = status !== "completed" ? "socket"
      : typeof store.gemState === "function" ? store.gemState(state.profile, lesson.id) : "polished";
    const dusty = status === "completed" && typeof store.gemDusty === "function" &&
      store.gemDusty(state.profile, lesson.id);
    symbol.append(gems.icon(kind, quality, dusty));
    if (status === "locked") {
      const lock = createEl("span", "medallion__lock");
      lock.append(lockIcon());
      symbol.append(lock);
    }
    node.append(symbol);

    const statusText = { completed: "დასრულებული", current: "მიმდინარე", locked: "დაბლოკილი" }[status] +
      (dusty ? ", ქვა მტვრიანია" : quality === "rough" ? ", ქვა ნატეხია — გაიარე უშეცდომოდ და გაპრიალდება" : "");
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
    // მტვრიანი ქვა: ღილაკი — 5 სწრაფი კითხვა ამ გაკვეთილიდან (lesson.html?mode=clean)
    if (dusty) {
      const clean = createEl("a", "path__polish path__polish--dust", "🧹 გაწმინდე · 5 კითხვა");
      clean.href = store.URLS.lesson + "?" +
        new URLSearchParams({ mode: "clean", course: course.id, lesson: lesson.id }).toString();
      clean.setAttribute("aria-label", lesson.title + " — მტვრის გაწმენდა, 5 კითხვა");
      item.append(clean);
    } else if (quality === "rough") {
    // ნატეხი ქვა: მინიშნება, რომ განმეორებით უშეცდომოდ გავლა ქვას გააპრიალებს
      const tag = createEl("span", "path__polish", "✦ გააპრიალე");
      tag.setAttribute("aria-hidden", "true");
      item.append(tag);
    }
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
  /** დაკეცვის ისარი — ერთნაირი თავისა და ქვეთავის ზოლზე (css: .fold-chevron). */
  function foldChevron() {
    const wrap = createEl("span", "fold-chevron");
    wrap.setAttribute("aria-hidden", "true");
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("focusable", "false");
    const line = document.createElementNS(SVG_NS, "path");
    line.setAttribute("d", "M6 9l6 6 6-6");
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", "2.6");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    svg.append(line);
    wrap.append(svg);
    return wrap;
  }

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

  /** ქვების ცენტრებს აერთებს დაკლაკნილი გზით — ლურსმნული სოლების რიგით. */
  function drawRoute(path) {
    const svg = path.querySelector(".path__route");
    if (!svg) return;
    svg.replaceChildren();

    const items = Array.from(path.querySelectorAll(".path__item")).filter((item) => !item.hidden);
    if (items.length < 2) return;

    const box = path.getBoundingClientRect();
    if (box.width === 0) return;
    svg.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);

    // ქვა + სათაური: აქ სოლები არ ჯდება (გზა სათაურის ქვემოდან იწყება)
    const PAD = 6;
    const zones = items.map((item) => {
      const r = item.getBoundingClientRect();
      return {
        left: r.left - box.left - PAD, right: r.right - box.left + PAD,
        top: r.top - box.top - PAD, bottom: r.bottom - box.top + PAD,
      };
    });
    const free = (p) => !zones.some((z) => p.x > z.left && p.x < z.right && p.y > z.top && p.y < z.bottom);

    const points = items.map((item) => {
      const r = item.querySelector(".medallion").getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - box.left,
        y: r.top + r.height / 2 - box.top,
        reached: item.dataset.status !== "locked",
      };
    });

    // ლურსმნული სოლები მრუდის გასწვრივ: გავლილი გზა — მუქი, წინ — ღია
    const STEP = 19;   // მანძილი სოლებს შორის
    const probe = document.createElementNS(SVG_NS, "path");
    svg.append(probe);
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const dy = b.y - a.y;
      // მონაცვლე მოხვევა — ძველი რუკის კლაკნილი გზა
      const bend = (i % 2 === 0 ? -1 : 1) * Math.min(48, box.width / 8);
      probe.setAttribute("d",
        "M " + a.x + " " + a.y +
        " C " + (a.x + bend) + " " + (a.y + dy * 0.45) +
        ", " + (b.x - bend) + " " + (b.y - dy * 0.45) +
        ", " + b.x + " " + b.y);
      const length = probe.getTotalLength();
      const cls = "path__wedge" + (b.reached ? " path__wedge--done" : "");
      // პირველი თავისუფალი წერტილიდან ვიწყებთ, რომ ყოველ მონაკვეთზე სოლები თანაბრად დალაგდეს
      let t = 0;
      while (t < length && !free(probe.getPointAtLength(t))) t += 2;
      for (t += STEP / 2; t < length; t += STEP) {
        const p = probe.getPointAtLength(t);
        if (!free(p)) continue;
        const q = probe.getPointAtLength(Math.min(length, t + 1));
        const angle = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
        svg.append(window.IMS_GEMS.wedge(p.x, p.y, angle, cls));
      }
    }
    probe.remove();
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
    renderMistakes();
  });

  /* ---------- ინიციალიზაცია ---------- */

  runDailyCheck();
  renderStats();
  store.bindThemeToggle(
    document.getElementById("themeToggle"),
    document.getElementById("themeIcon")
  );
  selectCourse(data.currentCourseId());
  setupInstallBanner();
}, window.IMS_DATA.showLoadError);
