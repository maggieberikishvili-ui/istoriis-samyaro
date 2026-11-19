/* ==========================================================
   ისტორიის სამყარო — მასწავლებლის რეჟიმი: გუნდური ვიქტორინა
   ----------------------------------------------------------
   ეკრანები: პარამეტრები → თამაში (პროექტორი) → შედეგები.
   თამაშის ლოგიკა — js/quiz-engine.js (IMS_QUIZ); აქ მხოლოდ
   ეკრანის აწყობა, ტაიმერი და კლავიატურა.
   სერვერი არ სჭირდება: ქულებს მასწავლებელი უწერს გუნდებს.
   ========================================================== */

(function () {
  "use strict";

  const { createEl, toRoman } = window.IMS_UTILS;
  const data = window.IMS_DATA;
  const quiz = window.IMS_QUIZ;
  const store = window.IMS_STORE;

  const TEAM_COUNTS = [2, 3, 4];
  const QUESTION_COUNTS = [10, 15, 20, 30];
  const TIME_LIMITS = [0, 20, 30, 45];
  const LETTERS = ["A", "B", "C", "D", "E", "F"];
  const MEDALS = ["🥇", "🥈", "🥉"];
  const MIN_COURSE_QUESTIONS = 10; // კურსი, სადაც ჯერ ცოტა კითხვაა, სიაში არ ჩანს

  const $ = (id) => document.getElementById(id);
  const el = {
    setup: $("setup"),
    form: $("setupForm"),
    courseChips: $("courseChips"),
    chapterList: $("chapterList"),
    poolInfo: $("poolInfo"),
    teamCountChips: $("teamCountChips"),
    teamNames: $("teamNames"),
    countChips: $("countChips"),
    timeChips: $("timeChips"),
    setupError: $("setupError"),
    play: $("play"),
    counter: $("qCounter"),
    source: $("qSource"),
    timer: $("timer"),
    timerValue: $("timerValue"),
    timebar: $("timebar"),
    prompt: $("qPrompt"),
    options: $("qOptions"),
    explain: $("qExplain"),
    award: $("award"),
    awardList: $("awardList"),
    scoreboard: $("scoreboard"),
    mainBtn: $("mainBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    exitBtn: $("exitBtn"),
    results: $("results"),
    podium: $("podium"),
    againBtn: $("againBtn"),
    setupBtn: $("setupBtn"),
  };

  /* ---------- პარამეტრები ---------- */

  const courses = data.courses.filter((c) => quiz.countQuestions(c.lessons) >= MIN_COURSE_QUESTIONS);

  const settings = {
    courseId: (courses[0] || {}).id,
    lessonIds: new Set(),
    teamCount: 2,
    teamNames: ["გუნდი 1", "გუნდი 2", "გუნდი 3", "გუნდი 4"],
    count: 15,
    timeLimit: 30,
  };

  function currentCourse() {
    return data.getCourse(settings.courseId);
  }

  function selectedLessons() {
    return currentCourse().lessons.filter((l) => settings.lessonIds.has(l.id));
  }

  /** ღილაკების ჯგუფი, სადაც ერთი არჩეულია (role="radio"). */
  function renderChips(container, items, value, onPick) {
    container.replaceChildren();
    items.forEach((item) => {
      const chip = createEl("button", "t-chip", item.label);
      chip.type = "button";
      chip.setAttribute("role", "radio");
      chip.setAttribute("aria-checked", String(item.value === value));
      chip.addEventListener("click", () => onPick(item.value));
      container.append(chip);
    });
  }

  function renderCourseChips() {
    renderChips(el.courseChips, courses.map((c) => ({ value: c.id, label: c.title })), settings.courseId, (id) => {
      if (id === settings.courseId) return;
      settings.courseId = id;
      selectDefaultLessons();
      renderSetup();
    });
  }

  /** ნაგულისხმევად — პირველი თავის ყველა გაკვეთილი. */
  function selectDefaultLessons() {
    const first = currentCourse().chapters.find((ch) => ch.lessons.length);
    settings.lessonIds = new Set(first ? first.lessons.map((l) => l.id) : []);
  }

  function renderChapters() {
    el.chapterList.replaceChildren();
    currentCourse().chapters.forEach((chapter) => {
      if (!chapter.lessons.length) return;
      const box = createEl("div", "t-chapter");

      const head = createEl("label", "t-check t-check--chapter");
      const all = createEl("input");
      all.type = "checkbox";
      const picked = chapter.lessons.filter((l) => settings.lessonIds.has(l.id)).length;
      all.checked = picked === chapter.lessons.length;
      all.indeterminate = picked > 0 && picked < chapter.lessons.length;
      all.addEventListener("change", () => {
        chapter.lessons.forEach((l) => (all.checked ? settings.lessonIds.add(l.id) : settings.lessonIds.delete(l.id)));
        renderChapters();
        renderPoolInfo();
      });
      head.append(all, createEl("span", "", "თავი " + toRoman(chapter.number) + ". " + chapter.title));
      head.append(createEl("span", "t-check__count", picked + " / " + chapter.lessons.length));
      box.append(head);

      const details = createEl("details", "t-chapter__lessons");
      details.open = picked > 0 && picked < chapter.lessons.length;
      details.append(createEl("summary", "", "გაკვეთილები"));
      const list = createEl("div", "t-chapter__list");
      chapter.lessons.forEach((lesson, i) => {
        const row = createEl("label", "t-check");
        const box2 = createEl("input");
        box2.type = "checkbox";
        box2.checked = settings.lessonIds.has(lesson.id);
        box2.addEventListener("change", () => {
          if (box2.checked) settings.lessonIds.add(lesson.id);
          else settings.lessonIds.delete(lesson.id);
          // სათაურის მდგომარეობა განახლდეს, details კი გაშლილი დარჩეს
          const n = chapter.lessons.filter((l) => settings.lessonIds.has(l.id)).length;
          all.checked = n === chapter.lessons.length;
          all.indeterminate = n > 0 && n < chapter.lessons.length;
          head.querySelector(".t-check__count").textContent = n + " / " + chapter.lessons.length;
          renderPoolInfo();
        });
        row.append(box2, createEl("span", "", (i + 1) + ". " + lesson.title));
        list.append(row);
      });
      details.append(list);
      box.append(details);
      el.chapterList.append(box);
    });
  }

  function renderPoolInfo() {
    const lessons = selectedLessons();
    const n = quiz.countQuestions(lessons);
    el.poolInfo.textContent = lessons.length
      ? "არჩეულია " + lessons.length + " გაკვეთილი · " + n + " კითხვა"
      : "აირჩიე ერთი გაკვეთილი მაინც.";
  }

  function renderTeams() {
    renderChips(el.teamCountChips, TEAM_COUNTS.map((n) => ({ value: n, label: n + " გუნდი" })), settings.teamCount, (n) => {
      settings.teamCount = n;
      renderTeams();
    });
    el.teamNames.replaceChildren();
    for (let i = 0; i < settings.teamCount; i++) {
      const field = createEl("label", "t-team-field team-" + i);
      field.append(createEl("span", "t-team-field__dot"));
      const input = createEl("input", "input");
      input.type = "text";
      input.maxLength = 20;
      input.value = settings.teamNames[i];
      input.setAttribute("aria-label", "გუნდი " + (i + 1) + " — სახელი");
      input.addEventListener("input", () => {
        settings.teamNames[i] = input.value;
      });
      field.append(input);
      el.teamNames.append(field);
    }
  }

  function renderGameChips() {
    renderChips(el.countChips, QUESTION_COUNTS.map((n) => ({ value: n, label: String(n) })), settings.count, (n) => {
      settings.count = n;
      renderGameChips();
    });
    renderChips(el.timeChips, TIME_LIMITS.map((s) => ({ value: s, label: s ? s + " წამი" : "დროის გარეშე" })), settings.timeLimit, (s) => {
      settings.timeLimit = s;
      renderGameChips();
    });
  }

  function renderSetup() {
    renderCourseChips();
    renderChapters();
    renderPoolInfo();
    renderTeams();
    renderGameChips();
  }

  /* ---------- ეკრანების გადართვა ---------- */

  function show(screen) {
    el.setup.hidden = screen !== "setup";
    el.play.hidden = screen !== "play";
    el.results.hidden = screen !== "results";
    window.scrollTo(0, 0);
  }

  /* ---------- თამაში ---------- */

  let game = null;
  let timerId = null;
  let deadline = 0;

  function teamNames() {
    return settings.teamNames.slice(0, settings.teamCount).map((name, i) => name.trim() || "გუნდი " + (i + 1));
  }

  function startGame() {
    const lessons = selectedLessons();
    if (!lessons.length || !quiz.countQuestions(lessons)) {
      el.setupError.textContent = "აირჩიე მასალა, რომელშიც კითხვებია.";
      el.setupError.hidden = false;
      return;
    }
    el.setupError.hidden = true;
    game = quiz.createGame({
      lessons: lessons,
      teamNames: teamNames(),
      count: settings.count,
      timeLimit: settings.timeLimit,
    });
    show("play");
    renderGame();
  }

  function update(nextState) {
    const phaseChanged = nextState.phase !== game.phase || nextState.index !== game.index;
    game = nextState;
    if (game.phase === "finished") {
      stopTimer();
      renderResults();
      show("results");
      return;
    }
    renderGame(phaseChanged);
  }

  function renderGame(restartTimer) {
    const q = quiz.currentQuestion(game);
    const revealed = game.phase === "reveal";

    el.counter.textContent = "კითხვა " + (game.index + 1) + " / " + game.questions.length;
    el.source.textContent = q.source;
    el.prompt.textContent = q.prompt;

    el.options.replaceChildren();
    el.options.className = "t-options" + (q.kind === "truefalse" ? " t-options--tf" : "");
    q.options.forEach((text, i) => {
      let cls = "t-option opt-" + (i % 4);
      if (revealed) cls += i === q.correct ? " is-correct" : " is-dim";
      const li = createEl("li", cls);
      li.append(createEl("span", "t-option__letter", q.kind === "truefalse" ? (i === 0 ? "✓" : "✗") : LETTERS[i]));
      li.append(createEl("span", "t-option__text", text));
      el.options.append(li);
    });

    el.explain.hidden = !revealed || !q.explanation;
    el.explain.textContent = q.explanation;

    el.award.hidden = !revealed;
    renderAwards();
    renderScoreboard();

    const last = game.index === game.questions.length - 1;
    el.mainBtn.textContent = revealed ? (last ? "🏆 შედეგები" : "შემდეგი კითხვა →") : "პასუხის ჩვენება";
    el.mainBtn.classList.toggle("btn--secondary", !revealed);

    if (game.phase === "question" && restartTimer !== false) startTimer();
    if (revealed) stopTimer();
  }

  function renderAwards() {
    el.awardList.replaceChildren();
    const awarded = game.awards[game.index];
    game.teams.forEach((team, i) => {
      const on = awarded.indexOf(i) !== -1;
      const btn = createEl("button", "t-award__btn team-" + i + (on ? " is-on" : ""));
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(on));
      btn.append(createEl("span", "t-award__key", String(i + 1)));
      btn.append(createEl("span", "", (on ? "✓ " : "") + team.name));
      btn.addEventListener("click", () => update(quiz.toggleAward(game, i)));
      el.awardList.append(btn);
    });
  }

  function renderScoreboard() {
    el.scoreboard.replaceChildren();
    quiz.scores(game).forEach((row) => {
      const li = createEl("li", "t-score__team team-" + row.index);
      li.append(createEl("span", "t-score__dot"));
      li.append(createEl("span", "t-score__name", row.name));
      li.append(createEl("strong", "t-score__value", String(row.score)));
      el.scoreboard.append(li);
    });
  }

  function mainAction() {
    if (!game) return;
    if (game.phase === "question") update(quiz.reveal(game));
    else if (game.phase === "reveal") update(quiz.next(game));
  }

  /* ---------- ტაიმერი ---------- */

  function startTimer() {
    stopTimer();
    const limit = game.timeLimit;
    el.timer.hidden = !limit;
    el.timebar.hidden = !limit;
    el.timer.classList.remove("is-low", "is-over");
    if (!limit) return;
    deadline = Date.now() + limit * 1000;
    el.timebar.max = limit * 1000;
    tick();
    timerId = setInterval(tick, 200);
  }

  function tick() {
    const left = Math.max(0, deadline - Date.now());
    const seconds = Math.ceil(left / 1000);
    el.timerValue.textContent = "⏱ " + seconds;
    el.timebar.value = left;
    el.timer.classList.toggle("is-low", seconds <= 5);
    if (left <= 0) {
      stopTimer();
      el.timer.classList.add("is-over");
      el.timerValue.textContent = "⏰ დრო!";
      update(quiz.reveal(game));
    }
  }

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
  }

  /* ---------- შედეგები ---------- */

  function renderResults() {
    el.podium.replaceChildren();
    quiz.ranking(game).forEach((row) => {
      const li = createEl("li", "t-podium__row team-" + row.index + " place-" + row.place);
      li.append(createEl("span", "t-podium__medal", MEDALS[row.place - 1] || row.place + "."));
      const text = createEl("span", "t-podium__text");
      text.append(createEl("strong", "t-podium__name", row.name));
      text.append(createEl("span", "t-podium__meta", row.correct + " სწორი პასუხი " + game.questions.length + "-დან"));
      li.append(text);
      li.append(createEl("strong", "t-podium__score", String(row.score)));
      el.podium.append(li);
    });
  }

  /* ---------- მოვლენები ---------- */

  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    startGame();
  });

  el.mainBtn.addEventListener("click", mainAction);

  el.exitBtn.addEventListener("click", () => {
    if (!window.confirm("დავასრულოთ თამაში? ქულები არ შეინახება.")) return;
    stopTimer();
    game = null;
    show("setup");
  });

  el.againBtn.addEventListener("click", startGame);
  el.setupBtn.addEventListener("click", () => {
    game = null;
    show("setup");
  });

  el.fullscreenBtn.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  });

  // კლავიატურა (პროექტორთან მუშაობისას): Space/Enter/→ — შემდეგი ნაბიჯი, 1–4 — გუნდის ქულა
  document.addEventListener("keydown", (e) => {
    if (el.play.hidden || !game) return;
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowRight" || ((e.key === " " || e.key === "Enter") && tag !== "BUTTON")) {
      e.preventDefault();
      mainAction();
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= game.teams.length) update(quiz.toggleAward(game, n - 1));
  });

  if (store && store.bindThemeToggle) store.bindThemeToggle($("themeToggle"), $("themeIcon"));

  selectDefaultLessons();
  renderSetup();
})();
