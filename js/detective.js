/* ==========================================================
   ისტორიის სამყარო — „დროში მოგზაურის დეტექტივი“ (მასწავლებლის რეჟიმი)
   ----------------------------------------------------------
   საქმეები — js/detective-data.js, დოკუმენტი — js/detective-board.js;
   ორივე საერთოა მოსწავლის თამაშთან (js/detective-game.js).
   მასწავლებელი ირჩევს საქმეს, კლასი მსჯელობს, მასწავლებელი ნიშნავს
   საეჭვო დეტალებს და აჭერს „შემოწმებას“. ანგარიში და XP არ არის.
   კლავიატურა: Enter — შემოწმება / შემდეგი საქმე.
   ========================================================== */

window.IMS_DATA.loadAll().then(function () {
  "use strict";

  const { createEl, toggleFullscreen, confirmAction } = window.IMS_UTILS;
  const data = window.IMS_DATA;
  const detective = window.IMS_DETECTIVE;
  const boardApi = window.IMS_DETECTIVE_BOARD;
  const picker = window.IMS_LESSON_PICKER;
  const store = window.IMS_STORE;

  const $ = (id) => document.getElementById(id);
  const el = {
    setup: $("setup"),
    courseChips: $("courseChips"),
    chapterList: $("chapterList"),
    caseList: $("caseList"),
    play: $("play"),
    counter: $("dcCounter"),
    lesson: $("dcLesson"),
    task: $("dcTask"),
    doc: $("dcDoc"),
    evidence: $("dcEvidence"),
    listBtn: $("listBtn"),
    mainBtn: $("mainBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    exitBtn: $("exitBtn"),
  };

  /* ---------- პარამეტრები ---------- */

  const courses = data.courses.filter((c) => /^grade-/.test(c.id));
  const settings = {
    courseId: (courses.find((c) => detective.forCourse(c.id).length) || courses[0]).id,
    lessonIds: new Set(),
  };

  function currentCourse() {
    return data.getCourse(settings.courseId);
  }

  function lessonTitle(id) {
    const lesson = currentCourse().lessons.find((l) => l.id === id);
    return lesson ? lesson.title : id;
  }

  /** არჩეული მასალის საქმეები — გაკვეთილების რიგით. */
  function casesInScope() {
    const order = currentCourse().lessons.map((l) => l.id);
    return detective.forCourse(settings.courseId)
      .filter((c) => settings.lessonIds.has(c.lesson))
      .sort((a, b) => order.indexOf(a.lesson) - order.indexOf(b.lesson));
  }

  function renderCourseChips() {
    el.courseChips.replaceChildren();
    courses.forEach((c) => {
      const count = detective.forCourse(c.id).length;
      const chip = createEl("button", "t-chip", count ? c.title : c.title + " · მალე");
      chip.type = "button";
      chip.setAttribute("role", "radio");
      chip.setAttribute("aria-checked", String(c.id === settings.courseId));
      chip.disabled = !count;
      chip.addEventListener("click", () => {
        if (c.id === settings.courseId) return;
        settings.courseId = c.id;
        selectDefaultLessons();
        renderSetup();
      });
      el.courseChips.append(chip);
    });
  }

  /** ნაგულისხმევად — კლასის ყველა გაკვეთილი, რომელსაც საქმე აქვს. */
  function selectDefaultLessons() {
    settings.lessonIds = new Set(detective.forCourse(settings.courseId).map((c) => c.lesson));
  }

  function renderCases() {
    el.caseList.replaceChildren();
    const list = casesInScope();
    if (!list.length) {
      el.caseList.append(createEl("p", "t-block__hint", "არჩეულ მასალაში საქმე ჯერ არ არის."));
      return;
    }
    list.forEach((c, i) => {
      const item = createEl("article", "dc-case");
      const start = createEl("button", "btn dc-case__start", "🔍 გამოძიება");
      start.type = "button";
      start.addEventListener("click", () => openCase(i));
      item.append(
        createEl("h3", "dc-case__title", c.title),
        createEl("p", "dc-case__meta", "📜 " + c.source + " · " + lessonTitle(c.lesson)),
        start
      );
      el.caseList.append(item);
    });
  }

  function renderSetup() {
    renderCourseChips();
    picker.render(el.chapterList, currentCourse(), settings.lessonIds, renderCases);
    renderCases();
  }

  /* ---------- გამოძიება ---------- */

  let play = null; // { list, index, board, checked }

  function show(screen) {
    el.setup.hidden = screen !== "setup";
    el.play.hidden = screen !== "play";
    window.scrollTo(0, 0);
  }

  function openCase(index) {
    const list = casesInScope();
    play = { list: list, index: index, checked: false };
    const c = list[index];

    el.counter.textContent = "საქმე " + (index + 1) + " / " + list.length;
    el.lesson.textContent = "📖 " + lessonTitle(c.lesson);
    el.listBtn.hidden = true;
    el.mainBtn.textContent = "🔍 შემოწმება";

    play.board = boardApi.create({
      doc: el.doc,
      evidence: el.evidence,
      caseData: c,
      onChange: (marked, needed) => {
        el.task.textContent = "დოკუმენტში " + needed + " ყალბი დეტალია. რომელია საეჭვო? მონიშნულია: " + marked + " / " + needed;
      },
      onLimit: () => {
        el.task.textContent = "უკვე " + play.board.needed + " დეტალია მონიშნული — ჯერ მოხსენი რომელიმე.";
      },
    });
    show("play");
  }

  function check() {
    play.checked = true;
    const r = play.board.reveal();
    el.task.textContent = r.found === r.needed && !r.wrong
      ? "🏆 კლასმა ყველა ყალბი დეტალი იპოვა!"
      : "ნაპოვნია " + r.found + " / " + r.needed + (r.wrong ? " · ტყუილი ეჭვი: " + r.wrong : "") + ". განიხილეთ განმარტებები:";
    const last = play.index >= play.list.length - 1;
    el.listBtn.hidden = false;
    el.mainBtn.textContent = last ? "☰ საქმეების სია" : "შემდეგი საქმე →";
    el.evidence.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function mainAction() {
    if (!play) return;
    if (!play.checked) check();
    else if (play.index < play.list.length - 1) openCase(play.index + 1);
    else backToList();
  }

  function backToList() {
    play = null;
    show("setup");
  }

  /* ---------- მოვლენები ---------- */

  el.mainBtn.addEventListener("click", mainAction);
  el.listBtn.addEventListener("click", backToList);
  el.exitBtn.addEventListener("click", () => {
    if (!play) return backToList();
    confirmAction({ title: "დავასრულოთ საქმე?", text: "მიმდინარე საქმე შეწყდება.", ok: "დიახ, დავასრულოთ", cancel: "არა" }).then((ok) => { if (ok) backToList(); });
  });
  el.fullscreenBtn.addEventListener("click", toggleFullscreen);

  document.addEventListener("keydown", (e) => {
    if (el.play.hidden || !play || e.key !== "Enter") return;
    if (e.target.tagName === "BUTTON" || e.target.getAttribute("role") === "button") return;
    e.preventDefault();
    mainAction();
  });

  if (store && store.bindThemeToggle) store.bindThemeToggle($("themeToggle"));

  selectDefaultLessons();
  renderSetup();
}, window.IMS_DATA.showLoadError);
