/* ==========================================================
   ისტორიის სამყარო — პროგრესი მშობლისთვის (progress.html)
   ----------------------------------------------------------
   ბოლო 7 დღის შეჯამება profile.activity-დან (იწერს storage.js:
   updateProfile — XP და გაკვეთილები, recordAnswer — პასუხები),
   კურსების პროგრესი და გასამეორებელი თემები profile.mistakes-დან.
   ტექსტი DOM-ში მხოლოდ textContent-ით.
   ========================================================== */

(function () {
  "use strict";

  const { createEl } = window.IMS_UTILS; // js/utils.js
  const store = window.IMS_STORE;
  const data = window.IMS_DATA;

  const WEEK = 7;
  const WEAK_TOP = 3;
  const WEEKDAYS = ["კვ", "ორ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];
  const BAR_STEPS = 10; // სვეტის სიმაღლე — 11 კლასი (h0…h10), inline სტილის გარეშე

  if (!store.requireAuth()) return;
  const daily = store.checkDaily();
  if (!daily) return;
  const profile = daily.profile;

  const $ = (id) => document.getElementById(id);

  /* ---------- თარიღები ---------- */

  /** ბოლო 7 დღე (ძველიდან დღევანდელამდე): [{ key, date }] */
  function lastDays() {
    const days = [];
    for (let i = WEEK - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ key: store.toDateKey(d), date: d });
    }
    return days;
  }

  function shortDate(d) {
    return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0");
  }

  /* ---------- კვირის შეჯამება ---------- */

  const days = lastDays();
  const week = days.map((d) => {
    const a = profile.activity[d.key] || { xp: 0, lessons: 0, correct: 0, wrong: 0 };
    return { key: d.key, date: d.date, xp: a.xp, lessons: a.lessons, correct: a.correct, wrong: a.wrong };
  });

  const sum = (field) => week.reduce((n, d) => n + d[field], 0);
  const totals = {
    xp: sum("xp"),
    lessons: sum("lessons"),
    correct: sum("correct"),
    wrong: sum("wrong"),
    active: week.filter((d) => d.xp > 0 || d.correct + d.wrong > 0).length,
  };
  const answered = totals.correct + totals.wrong;
  const accuracy = answered ? Math.round((totals.correct / answered) * 100) : null;

  function renderHeader() {
    $("reportTitle").textContent = profile.name;
    $("reportPeriod").textContent = shortDate(days[0].date) + " – " + shortDate(days[WEEK - 1].date) +
      " · 🔥 " + profile.streak + " დღე ზედიზედ · ⚡ სულ " + profile.xp + " XP";
  }

  function statItem(value, label, mod) {
    const li = createEl("li", "progress-stat progress-stat--" + mod);
    li.append(createEl("span", "progress-stat__value", value), createEl("span", "progress-stat__label", label));
    return li;
  }

  function renderWeek() {
    $("weekStats").replaceChildren(
      statItem(totals.active + " / " + WEEK, "აქტიური დღე", "days"),
      statItem(String(totals.lessons), "ახალი გაკვეთილი", "lessons"),
      statItem("+" + totals.xp, "XP", "xp"),
      statItem(accuracy === null ? "—" : accuracy + "%", "სწორი პასუხი", "accuracy")
    );

    const chart = $("weekChart");
    const max = Math.max(1, ...week.map((d) => d.xp));
    chart.setAttribute("aria-label", "XP დღეების მიხედვით: " +
      week.map((d) => WEEKDAYS[d.date.getDay()] + " " + d.xp).join(", "));
    chart.replaceChildren(...week.map((d, i) => {
      const col = createEl("div", "week-chart__day" + (i === WEEK - 1 ? " is-today" : ""));
      const level = d.xp > 0 ? Math.max(1, Math.round((d.xp / max) * BAR_STEPS)) : 0;
      const track = createEl("div", "week-chart__track");
      track.append(createEl("div", "week-chart__bar week-chart__bar--h" + level));
      col.append(
        createEl("span", "week-chart__value", d.xp ? String(d.xp) : ""),
        track,
        createEl("span", "week-chart__label", WEEKDAYS[d.date.getDay()])
      );
      return col;
    }));
  }

  /* ---------- კურსები ---------- */

  function renderCourses() {
    const done = profile.completedLessons;
    const rows = data.courses
      .map((course) => ({
        course: course,
        completed: Math.min(done.filter((id) => id.indexOf(course.lessonPrefix) === 0).length, course.lessonCount),
      }))
      .filter((r) => r.completed > 0);

    const list = $("courseRows");
    if (rows.length === 0) {
      list.replaceChildren(createEl("li", "progress-empty", "ჯერ არცერთი გაკვეთილი არ არის გავლილი."));
      return;
    }
    list.replaceChildren(...rows.map((r) => {
      const li = createEl("li", "progress-course");
      const head = createEl("div", "progress-course__head");
      head.append(
        createEl("span", "progress-course__name", r.course.title),
        createEl("span", "progress-course__count", r.completed + " / " + r.course.lessonCount + " გაკვეთილი")
      );
      const bar = createEl("progress", "progress-course__bar");
      bar.max = r.course.lessonCount;
      bar.value = r.completed;
      bar.setAttribute("aria-label", r.course.title + " — გავლილია " + r.completed + " / " + r.course.lessonCount);
      li.append(head, bar);
      return li;
    }));
  }

  /* ---------- გასამეორებელი თემები ---------- */

  let weakTopics = [];

  function renderWeak() {
    const counts = new Map();
    profile.mistakes.forEach((m) => {
      if (!data.findStep(m.c, m.l, m.i, m.q)) return;
      const key = m.c + "|" + m.l;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    weakTopics = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, WEAK_TOP)
      .map(([key, n]) => {
        const [courseId, lessonId] = key.split("|");
        const course = data.getCourse(courseId);
        const lesson = data.getLesson(courseId, lessonId);
        return { course: course, lesson: lesson, count: n };
      });

    const list = $("weakList");
    if (weakTopics.length === 0) {
      list.replaceChildren(createEl("li", "progress-empty", "✓ გასამეორებელი შეცდომები არ არის — ყოჩაღ!"));
      return;
    }
    list.replaceChildren(...weakTopics.map((t) => {
      const li = createEl("li", "progress-weak__item");
      const body = createEl("span", "progress-weak__body");
      body.append(
        createEl("span", "progress-weak__lesson", t.lesson.title),
        createEl("span", "progress-weak__course", t.course.title)
      );
      li.append(body, createEl("span", "progress-weak__count", t.count + " შეცდ."));
      return li;
    }));
  }

  /* ---------- გაზიარება (ტელეფონზე — Messenger, Viber…; კომპიუტერზე — კოპირება) ---------- */

  function shareText() {
    const lines = [
      "📊 " + profile.name + " — ისტორიის სამყარო",
      shortDate(days[0].date) + " – " + shortDate(days[WEEK - 1].date) + ":",
      "• აქტიური დღე: " + totals.active + " / " + WEEK,
      "• ახალი გაკვეთილი: " + totals.lessons,
      "• XP: +" + totals.xp + (accuracy === null ? "" : " · სწორი პასუხი: " + accuracy + "%"),
      "• 🔥 " + profile.streak + " დღე ზედიზედ",
    ];
    if (weakTopics.length) {
      lines.push("გასამეორებელი: " + weakTopics.map((t) => t.lesson.title).join("; "));
    }
    return lines.join("\n");
  }

  function bindShare() {
    const btn = $("shareBtn");
    const status = $("shareStatus");
    btn.addEventListener("click", async () => {
      const text = shareText();
      status.textContent = "";
      try {
        if (navigator.share) {
          await navigator.share({ title: "სწავლის შეჯამება", text: text });
          return;
        }
        await navigator.clipboard.writeText(text);
        status.textContent = "✓ ტექსტი დაკოპირდა — ჩასვი მესიჯში.";
      } catch (e) {
        if (e && e.name === "AbortError") return; // მომხმარებელმა გააუქმა
        // ბრაუზერმა კოპირება არ დაუშვა — ტექსტს ვაჩენთ მონიშნულს, ხელით დასაკოპირებლად
        const box = $("shareText");
        box.value = text;
        box.hidden = false;
        box.focus();
        box.select();
        status.textContent = "დააკოპირე ქვემოთ მონიშნული ტექსტი და ჩასვი მესიჯში.";
      }
    });
  }

  /* ---------- ინიციალიზაცია ---------- */

  store.bindThemeToggle($("themeToggle"), $("themeIcon"));
  renderHeader();
  renderWeek();
  renderCourses();
  bindShare();

  // სუსტი თემებისთვის საჭიროა იმ კლასების მასალა, სადაც შეცდომებია
  const courseIds = Array.from(new Set(profile.mistakes.map((m) => m.c))).filter((id) => data.getCourse(id));
  data.load(courseIds).then(renderWeak, data.showLoadError);
})();
