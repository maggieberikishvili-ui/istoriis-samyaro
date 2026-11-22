/* ==========================================================
   ისტორიის სამყარო — „დროის ხაზის არქიტექტორი“ (მასწავლებლის რეჟიმი)
   ----------------------------------------------------------
   მოვლენები — js/timeline-data.js (IMS_TIMELINE), აგურის კედელი —
   js/timeline-board.js (IMS_TL_BOARD); ორივე საერთოა მოსწავლის
   თამაშთან (games.js). ეკრანი ერთია, პროექტორზე / ინტერაქტიულ დაფაზე.
   ანგარიში და XP არ არის — მხოლოდ კლასის საერთო შედეგი.
   კლავიატურა: Enter — შემოწმება / შემდეგი რაუნდი.
   ========================================================== */

window.IMS_DATA.loadAll().then(function () {
  "use strict";

  const { createEl, shuffle, toggleFullscreen, confirmAction } = window.IMS_UTILS;
  const data = window.IMS_DATA;
  const timeline = window.IMS_TIMELINE;
  const board = window.IMS_TL_BOARD;
  const picker = window.IMS_LESSON_PICKER;
  const store = window.IMS_STORE;

  const ROUNDS = [3, 5, 7];
  const SIZES = [4, 5, 6];

  const $ = (id) => document.getElementById(id);
  const el = {
    setup: $("setup"),
    form: $("setupForm"),
    courseChips: $("courseChips"),
    chapterList: $("chapterList"),
    poolInfo: $("poolInfo"),
    roundChips: $("roundChips"),
    sizeChips: $("sizeChips"),
    setupError: $("setupError"),
    play: $("play"),
    counter: $("aCounter"),
    score: $("aScore"),
    wall: $("aWall"),
    pool: $("aPool"),
    yardLabel: $("aYardLabel"),
    verdict: $("aVerdict"),
    verdictTitle: $("aVerdictTitle"),
    verdictList: $("aVerdictList"),
    hint: $("aHint"),
    mainBtn: $("mainBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    exitBtn: $("exitBtn"),
    results: $("results"),
    endTitle: $("resultsTitle"),
    endText: $("endText"),
    againBtn: $("againBtn"),
    setupBtn: $("setupBtn"),
  };

  /* ---------- პარამეტრები ---------- */

  const courses = data.courses.filter((c) => /^grade-/.test(c.id));
  const minSize = Math.min.apply(null, SIZES);
  const ready = (id) => board.maxDisjoint(timeline.forCourse(id)) >= minSize;

  const settings = {
    courseId: (courses.find((c) => ready(c.id)) || courses[0]).id,
    lessonIds: new Set(),
    rounds: 3,
    size: 5,
  };

  function currentCourse() {
    return data.getCourse(settings.courseId);
  }

  function eventsInScope() {
    return timeline.forCourse(settings.courseId).filter((e) => settings.lessonIds.has(e.lesson));
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
    const items = courses.map((c) => ({
      value: c.id,
      label: ready(c.id) ? c.title : c.title + " · მალე",
      disabled: !ready(c.id),
    }));
    renderChips(el.courseChips, items, settings.courseId, (id) => {
      if (id === settings.courseId) return;
      settings.courseId = id;
      selectDefaultLessons();
      renderSetup();
    });
  }

  /** ნაგულისხმევად — პირველი თავი, რომელშიც დათარიღებული მოვლენებია. */
  function selectDefaultLessons() {
    const dated = new Set(timeline.forCourse(settings.courseId).map((e) => e.lesson));
    const first = currentCourse().chapters.find((ch) => ch.lessons.some((l) => dated.has(l.id)));
    settings.lessonIds = new Set(first ? first.lessons.map((l) => l.id) : []);
  }

  function renderPoolInfo() {
    const events = eventsInScope();
    el.poolInfo.textContent = settings.lessonIds.size
      ? "არჩეულია " + settings.lessonIds.size + " გაკვეთილი · " + events.length + " დათარიღებული მოვლენა"
      : "აირჩიე ერთი გაკვეთილი მაინც.";
  }

  function renderGameChips() {
    renderChips(el.roundChips, ROUNDS.map((n) => ({ value: n, label: String(n) })), settings.rounds, (n) => {
      settings.rounds = n;
      renderGameChips();
    });
    renderChips(el.sizeChips, SIZES.map((n) => ({ value: n, label: String(n) })), settings.size, (n) => {
      settings.size = n;
      renderGameChips();
    });
  }

  function renderSetup() {
    renderCourseChips();
    picker.render(el.chapterList, currentCourse(), settings.lessonIds, renderPoolInfo);
    renderPoolInfo();
    renderGameChips();
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
  // game = { pool, used, round, rounds, size, events, board, checked, score }

  function startGame() {
    const pool = eventsInScope();
    if (board.maxDisjoint(pool) < settings.size) {
      el.setupError.textContent = "არჩეულ მასალაში ცოტა დათარიღებული მოვლენაა " + settings.size +
        " აგურისთვის. დაამატე გაკვეთილები ან აირჩიე ნაკლები აგური.";
      el.setupError.hidden = false;
      return;
    }
    el.setupError.hidden = true;
    game = { pool: pool, used: new Set(), round: 0, rounds: settings.rounds, size: settings.size, score: 0 };
    show("play");
    nextRound();
  }

  function nextRound() {
    const events = board.pickRound(game.pool, game.used, game.size);
    if (!events) {
      finish();
      return;
    }
    events.forEach((e) => game.used.add(e));
    game.round += 1;
    game.checked = false;
    game.events = shuffle(events);

    el.counter.textContent = "რაუნდი " + game.round + " / " + game.rounds;
    el.verdict.hidden = true;
    el.yardLabel.hidden = false;
    el.hint.textContent = "საძირკველში — ყველაზე ძველი. აგური გადაათრიე ან შეეხე მას და მერე „＋ აქ“ ადგილს.";
    el.mainBtn.textContent = "🧱 შემოწმება";
    el.mainBtn.disabled = true;
    renderScore();

    game.board = board.create({
      wall: el.wall,
      pool: el.pool,
      events: game.events,
      onChange: (placed, total) => {
        el.mainBtn.disabled = placed < total;
        el.yardLabel.hidden = placed === total;
      },
    });
    window.scrollTo(0, 0);
  }

  function renderScore() {
    el.score.textContent = game.round > 1 || game.checked
      ? "სწორ ადგილზე: " + game.score + " / " + (game.checked ? game.round : game.round - 1) * game.size
      : "";
  }

  function check() {
    game.checked = true;
    const correct = board.sortedEvents(game.events);
    const right = game.board.reveal(correct);
    game.score += right;
    renderScore();

    const perfect = right === game.size;
    el.verdict.hidden = false;
    el.verdict.classList.toggle("is-perfect", perfect);
    el.verdictTitle.textContent = perfect
      ? "🏆 კედელი მყარია — ყველა აგური თავის ადგილზეა!"
      : "სწორ ადგილზეა " + right + " / " + game.size + ". სწორი რიგი — ძველიდან ახლისკენ:";
    el.verdictList.replaceChildren();
    el.verdictList.hidden = perfect;
    if (!perfect) {
      correct.forEach((ev) => {
        const li = createEl("li", "a-verdict__item");
        li.append(createEl("span", "a-verdict__date", ev.date), createEl("span", "", ev.text));
        el.verdictList.append(li);
      });
    }

    const last = game.round >= game.rounds;
    el.hint.textContent = perfect ? "" : "განიხილეთ: რომელმა აგურმა „დაბზარა“ კედელი და რატომ?";
    el.mainBtn.textContent = last ? "🏁 დასრულება" : "შემდეგი რაუნდი →";
    el.mainBtn.disabled = false;
  }

  function mainAction() {
    if (!game) return;
    if (!game.checked) {
      if (!el.mainBtn.disabled) check();
    } else if (game.round < game.rounds) {
      nextRound();
    } else {
      finish();
    }
  }

  function finish() {
    const max = game.round * game.size;
    const pct = max ? Math.round((game.score / max) * 100) : 0;
    el.endTitle.textContent = pct >= 80 ? "კედელი მყარია!" : pct >= 50 ? "კედელი დგას — ცოტა ბზარით" : "კედელს გამაგრება სჭირდება";
    el.endText.textContent = "კლასმა სწორ ადგილზე დადო " + game.score + " აგური " + max + "-დან (" + pct + "%).";
    game = null;
    show("results");
  }

  /* ---------- მოვლენები ---------- */

  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    startGame();
  });

  el.mainBtn.addEventListener("click", mainAction);
  el.fullscreenBtn.addEventListener("click", toggleFullscreen);

  el.exitBtn.addEventListener("click", () => {
    confirmAction({ title: "დავასრულოთ მშენებლობა?", text: "მიმდინარე რაუნდი შეწყდება.", ok: "დიახ, დავასრულოთ", cancel: "არა" }).then((ok) => {
      if (!ok) return;
      game = null;
      show("setup");
    });
  });

  el.againBtn.addEventListener("click", startGame);
  el.setupBtn.addEventListener("click", () => show("setup"));

  // კლავიატურა (პროექტორთან): Enter — შემოწმება / შემდეგი რაუნდი
  document.addEventListener("keydown", (e) => {
    if (el.play.hidden || !game || e.key !== "Enter" || e.target.tagName === "BUTTON") return;
    e.preventDefault();
    mainAction();
  });

  if (store && store.bindThemeToggle) store.bindThemeToggle($("themeToggle"), $("themeIcon"));

  selectDefaultLessons();
  renderSetup();
}, window.IMS_DATA.showLoadError);
