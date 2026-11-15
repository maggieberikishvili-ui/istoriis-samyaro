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

  /** პროფილის განახლება საცავის მეშვეობით + ეკრანის განახლება. */
  function update(mutator) {
    const profile = store.updateProfile(mutator);
    if (!profile) return null;
    state.profile = profile;
    renderStats();
    return profile;
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
    el.statHearts.textContent = String(p.hearts);
  }

  /* ---------- დღიური შემოწმება და სიცოცხლეები ---------- */

  function runDailyCheck() {
    // ახალ დღეს: streak განახლდება და სიცოცხლეები 5-მდე შეივსება
    const result = store.checkDaily();
    if (!result) return;
    state.profile = result.profile;

    if (result.heartsRefilled) {
      showToast("☀️ ახალი დღე — სიცოცხლეები 5-მდე შეივსო!");
      return;
    }

    // იმავე დღეს სიცოცხლეები ამოიწურა → დაფაზე დაბრუნებისას აღდგება
    if (state.profile.hearts <= 0) {
      update((p) => {
        p.hearts = store.MAX_HEARTS;
      });
      showToast("❤️ სიცოცხლეები აღდგა — სცადე თავიდან!");
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
    renderCourses();
    renderPath();
  }

  /* ---------- გაკვეთილების ბილიკი ---------- */

  function lessonUrl(courseId, lessonId) {
    const params = new URLSearchParams({ course: courseId, lesson: lessonId });
    return store.URLS.lesson + "?" + params.toString();
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

      const icon = createEl("span", "", { completed: "✓", current: "★", locked: "🔒" }[status]);
      icon.setAttribute("aria-hidden", "true");
      node.append(icon);

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
})();
