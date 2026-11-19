/* ==========================================================
   ისტორიის სამყარო — „ვინ ვარ მე?“ (მასწავლებლის რეჟიმი)
   ----------------------------------------------------------
   გმირები — js/whoami-data.js (IMS_WHOAMI), იგივე, რაც მოსწავლის
   თამაშში (games.js). ეკრანი ერთია, პროექტორზე: მინიშნებები რთულიდან
   მარტივისკენ იხსნება, კლასი ხმამაღლა ცდილობს გამოცნობას.
   ანგარიში და XP არ არის.
   კლავიატურა: → / ჰარი — შემდეგი მინიშნება, Enter — პასუხი / შემდეგი.
   ========================================================== */

window.IMS_DATA.loadAll().then(function () {
  "use strict";

  const { createEl, shuffle, toggleFullscreen } = window.IMS_UTILS;
  const data = window.IMS_DATA;
  const whoami = window.IMS_WHOAMI;
  const picker = window.IMS_LESSON_PICKER;
  const store = window.IMS_STORE;

  const COUNTS = [5, 10, 15];
  const MIN_HEROES = 4;      // ნაკლები გმირით ვარიანტები ვერ აეწყობა
  const LETTERS = ["A", "B", "C", "D"];

  const $ = (id) => document.getElementById(id);
  const el = {
    setup: $("setup"),
    form: $("setupForm"),
    courseChips: $("courseChips"),
    chapterList: $("chapterList"),
    poolInfo: $("poolInfo"),
    countChips: $("countChips"),
    setupError: $("setupError"),
    play: $("play"),
    counter: $("wCounter"),
    kind: $("wKind"),
    clues: $("wClues"),
    answer: $("wAnswer"),
    answerName: $("wAnswerName"),
    answerSource: $("wAnswerSource"),
    options: $("wOptions"),
    clueBtn: $("clueBtn"),
    optionsBtn: $("optionsBtn"),
    mainBtn: $("mainBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    exitBtn: $("exitBtn"),
    results: $("results"),
    summary: $("summary"),
    againBtn: $("againBtn"),
    setupBtn: $("setupBtn"),
  };

  /* ---------- პარამეტრები ---------- */

  const courses = data.courses.filter((c) => /^grade-/.test(c.id));
  const settings = {
    courseId: (courses.find((c) => whoami.forCourse(c.id).length >= MIN_HEROES) || courses[0]).id,
    lessonIds: new Set(),
    count: 10,
  };

  function currentCourse() {
    return data.getCourse(settings.courseId);
  }

  function heroesInScope() {
    return whoami.forCourse(settings.courseId).filter((h) => settings.lessonIds.has(h.lesson));
  }

  /** ღილაკების ჯგუფი, სადაც ერთი არჩეულია (role="radio"). */
  function renderChips(container, items, value, onPick) {
    container.replaceChildren();
    items.forEach((item) => {
      const chip = createEl("button", "t-chip", item.label);
      chip.type = "button";
      chip.setAttribute("role", "radio");
      chip.setAttribute("aria-checked", String(item.value === value));
      chip.disabled = !!item.disabled;
      chip.addEventListener("click", () => onPick(item.value));
      container.append(chip);
    });
  }

  function renderCourseChips() {
    const items = courses.map((c) => {
      const ready = whoami.forCourse(c.id).length >= MIN_HEROES;
      return { value: c.id, label: ready ? c.title : c.title + " · მალე", disabled: !ready };
    });
    renderChips(el.courseChips, items, settings.courseId, (id) => {
      if (id === settings.courseId) return;
      settings.courseId = id;
      selectDefaultLessons();
      renderSetup();
    });
  }

  /** ნაგულისხმევად — პირველი თავი, რომელშიც გმირები არიან. */
  function selectDefaultLessons() {
    const withHeroes = new Set(whoami.forCourse(settings.courseId).map((h) => h.lesson));
    const first = currentCourse().chapters.find((ch) => ch.lessons.some((l) => withHeroes.has(l.id)));
    settings.lessonIds = new Set(first ? first.lessons.map((l) => l.id) : []);
  }

  function renderPoolInfo() {
    const n = heroesInScope().length;
    el.poolInfo.textContent = settings.lessonIds.size
      ? "არჩეულია " + settings.lessonIds.size + " გაკვეთილი · " + n + " გმირი"
      : "აირჩიე ერთი გაკვეთილი მაინც.";
  }

  function renderCountChips() {
    renderChips(el.countChips, COUNTS.map((n) => ({ value: n, label: String(n) })), settings.count, (n) => {
      settings.count = n;
      renderCountChips();
    });
  }

  function renderSetup() {
    renderCourseChips();
    picker.render(el.chapterList, currentCourse(), settings.lessonIds, renderPoolInfo);
    renderPoolInfo();
    renderCountChips();
  }

  /* ---------- ეკრანები ---------- */

  function show(screen) {
    el.setup.hidden = screen !== "setup";
    el.play.hidden = screen !== "play";
    el.results.hidden = screen !== "results";
    window.scrollTo(0, 0);
  }

  /* ---------- თამაში ---------- */

  let game = null;
  // game = { pool, heroes, index, shown, options (null | []), revealed, fresh (ახალი მინიშნების ინდექსი), log }

  function startGame() {
    const pool = heroesInScope();
    if (pool.length < MIN_HEROES) {
      el.setupError.textContent = "არჩეულ მასალაში ცოტა გმირია (საჭიროა " + MIN_HEROES + " მაინც). დაამატე გაკვეთილები.";
      el.setupError.hidden = false;
      return;
    }
    el.setupError.hidden = true;
    game = { pool: pool, heroes: shuffle(pool).slice(0, settings.count), index: -1, log: [] };
    show("play");
    nextHero();
  }

  function nextHero() {
    game.index += 1;
    if (game.index >= game.heroes.length) {
      finish();
      return;
    }
    Object.assign(game, { shown: 1, options: null, revealed: false, fresh: 0 });
    render();
  }

  function currentHero() {
    return game.heroes[game.index];
  }

  function render() {
    const hero = currentHero();
    const total = hero.clues.length;
    const last = game.index === game.heroes.length - 1;

    el.counter.textContent = "გმირი " + (game.index + 1) + " / " + game.heroes.length;
    el.kind.textContent = whoami.kinds[hero.kind] || "";

    el.clues.replaceChildren();
    // ანიმაცია — მხოლოდ ახლად გახსნილ მინიშნებას (დანარჩენი არ „ციმციმებს“)
    hero.clues.forEach((clue, i) => {
      const open = game.revealed || i < game.shown; // პასუხის შემდეგ — ყველა მინიშნება
      const li = createEl("li", "w-clue" + (open ? "" : " is-locked") + (i === game.fresh ? " is-new" : ""));
      li.append(createEl("span", "w-clue__num", String(i + 1)));
      li.append(createEl("span", "w-clue__text", open ? clue : "🔒 მინიშნება " + (i + 1)));
      el.clues.append(li);
    });

    el.answer.hidden = !game.revealed;
    if (game.revealed) {
      el.answerName.textContent = hero.answer;
      const lesson = currentCourse().lessons.find((l) => l.id === hero.lesson);
      el.answerSource.textContent = lesson ? "📖 " + lesson.title : "";
    }

    el.options.hidden = !game.options;
    el.options.replaceChildren();
    (game.options || []).forEach((h, i) => {
      let cls = "t-option opt-" + i;
      if (game.revealed) cls += h === hero ? " is-correct" : " is-dim";
      const li = createEl("li", cls);
      li.append(createEl("span", "t-option__letter", LETTERS[i]), createEl("span", "t-option__text", h.answer));
      el.options.append(li);
    });

    const left = total - game.shown;
    el.clueBtn.textContent = game.revealed || !left ? "🔍 ყველა მინიშნება ჩანს" : "🔍 შემდეგი მინიშნება (" + left + ")";
    el.clueBtn.disabled = game.revealed || !left;
    el.optionsBtn.disabled = game.revealed || !!game.options;
    el.mainBtn.textContent = game.revealed ? (last ? "🏁 დასრულება" : "შემდეგი გმირი →") : "👁 პასუხის ჩვენება";
    game.fresh = -1;
  }

  function showClue() {
    if (!game || game.revealed || game.shown >= currentHero().clues.length) return;
    game.shown += 1;
    game.fresh = game.shown - 1;
    render();
  }

  function showOptions() {
    if (!game || game.revealed || game.options) return;
    const hero = currentHero();
    game.options = shuffle([hero].concat(whoami.distractors(hero, game.pool, whoami.forCourse(settings.courseId))));
    render();
  }

  function mainAction() {
    if (!game) return;
    if (!game.revealed) {
      game.revealed = true;
      game.log.push({ hero: currentHero(), shown: game.shown, options: !!game.options });
      render();
      el.answer.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      nextHero();
      window.scrollTo(0, 0);
    }
  }

  function finish() {
    el.summary.replaceChildren();
    game.log.forEach((entry) => {
      const li = createEl("li", "w-summary__row");
      li.append(createEl("span", "w-summary__name", entry.hero.answer));
      const meta = entry.shown + " მინიშნება" + (entry.options ? " · ვარიანტებით" : "");
      li.append(createEl("span", "w-summary__meta", meta));
      el.summary.append(li);
    });
    game = null;
    show("results");
  }

  /* ---------- მოვლენები ---------- */

  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    startGame();
  });

  el.clueBtn.addEventListener("click", showClue);
  el.optionsBtn.addEventListener("click", showOptions);
  el.mainBtn.addEventListener("click", mainAction);
  el.fullscreenBtn.addEventListener("click", toggleFullscreen);

  el.exitBtn.addEventListener("click", () => {
    if (!window.confirm("დავასრულოთ თამაში?")) return;
    game = null;
    show("setup");
  });

  el.againBtn.addEventListener("click", startGame);
  el.setupBtn.addEventListener("click", () => show("setup"));

  // კლავიატურა (პროექტორთან): → / ჰარი — მინიშნება, Enter — პასუხი ან შემდეგი გმირი
  document.addEventListener("keydown", (e) => {
    if (el.play.hidden || !game) return;
    if (e.target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      showClue();
    } else if (e.key === "Enter") {
      e.preventDefault();
      mainAction();
    }
  });

  if (store && store.bindThemeToggle) store.bindThemeToggle($("themeToggle"), $("themeIcon"));

  selectDefaultLessons();
  renderSetup();
}, window.IMS_DATA.showLoadError);
