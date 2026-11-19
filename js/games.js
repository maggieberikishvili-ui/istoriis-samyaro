/* ==========================================================
   ისტორიის სამყარო — თამაშები (ერთი მოთამაშისთვის, სერვერის გარეშე)
   ----------------------------------------------------------
   1. „დროსთან რბოლა“ — 60 წამი; choice / truefalse / fill კითხვები;
      ზედიზედ სწორი პასუხები ამრავლებს ქულას (×2 / ×3).
   2. „მეხსიერების ბარათები“ — 6 წყვილი (ცნება ↔ განმარტება)
      გაკვეთილების match-სავარჯიშოებიდან; ვარსკვლავები სვლების მიხედვით.
   3. „დროის ხაზი“ — 3 რაუნდი × 5 მოვლენა (js/timeline-data.js);
      ერთ რაუნდში მოვლენების თარიღები ერთმანეთს არასოდეს ფარავს.
   4. „ვინ ვარ მე?“ — 5 გმირი (js/whoami-data.js), თითოს 4 მინიშნება;
      ქულა: 4 → 1, ყოველი დამატებითი მინიშნება ან შეცდომა −1.
   5. „დღის გამოწვევა“ — 10 კითხვა, დღის მიხედვით ერთნაირი ყველასთვის.
   - კლასი (კურსი) — ?course=… ან დაფაზე არჩეული; მენიუში იცვლება.
     ყველა თამაში და მისი მასალა/რეკორდები კურსზეა მიბმული, ამიტომ ახალი
     კლასისთვის საკმარისია გაკვეთილები js/data.js-ში (+ მოვლენები და
     გმირები timeline-data.js / whoami-data.js-ში იმავე კურსის გასაღებით).
   - მასალა: მხოლოდ არჩეული კურსის გავლილი გაკვეთილები + მიმდინარე
     (ზუსტად ისე, როგორც „❤️ აღდგენის“ სავარჯიშოში).
   - რეკორდები და დღიური XP — localStorage (IMS_STORE, გასაღები ims_games),
     თითოეული მომხმარებლისთვის ცალ-ცალკე.
   - XP: დღეში მაქსიმუმ GAMES_XP_DAILY_CAP თამაშებიდან.
   - ტექსტი DOM-ში მხოლოდ textContent-ით.
   ========================================================== */

// ჯერ იტვირთება საჭირო კლასის მასალა (js/data/), შემდეგ — გვერდი
window.IMS_DATA.load([window.IMS_DATA.currentCourseId()]).then(function () {
  "use strict";

  const { createEl, shuffle, toRoman } = window.IMS_UTILS; // js/utils.js

  const store = window.IMS_STORE;
  const data = window.IMS_DATA;

  /* ---------- პარამეტრები ---------- */

  const GAMES_PRO_ONLY = false;          // true → თამაშები მხოლოდ Pro-სთვის
  const RACE_SECONDS = 60;
  const RACE_TYPES = ["choice", "truefalse", "fill"];
  const RACE_MIN_QUESTIONS = 6;
  const RACE_POINTS = 10;
  const RACE_XP_CAP = 15;                // ერთ რბოლაში მაქსიმუმ
  const FEEDBACK_OK_MS = 380;
  const FEEDBACK_BAD_MS = 1300;

  const MEMORY_PAIRS = 6;
  const MEMORY_MAX_LEFT = 34;            // ცნების მაქსიმალური სიგრძე (სიმბოლო)
  const MEMORY_MAX_RIGHT = 70;           // განმარტების მაქსიმალური სიგრძე (ბარათზე რომ დაეტიოს)
  const MEMORY_MISMATCH_MS = 1000;
  const MEMORY_XP = { 3: 10, 2: 7, 1: 4 };

  const TIMELINE_ROUNDS = 3;
  const TIMELINE_SIZE = 5;
  const TIMELINE_XP_CAP = 15;

  const WHO_ROUNDS = 5;
  const WHO_CLUES = 4;
  const WHO_XP_CAP = 15;

  const DAILY_SIZE = 10;
  const DAILY_XP_PER = 2;                // სწორ პასუხზე, დღეში ერთხელ

  const GAMES_XP_DAILY_CAP = 60;

  /* ---------- ავტორიზაცია და კურსი ---------- */

  if (!store.requireAuth()) return;
  const session = store.checkDaily();
  if (!session) return;

  const params = new URLSearchParams(window.location.search);
  const course =
    data.getCourse(params.get("course")) ||
    data.getCourse(store.readString(store.KEYS.selectedCourse)) ||
    data.courses[0];

  if (GAMES_PRO_ONLY && !session.profile.isPro) {
    store.redirect(store.URLS.dashboard);
    return;
  }

  /* ---------- DOM ---------- */

  const $ = (id) => document.getElementById(id);
  const el = {
    hub: $("hub"),
    hubCourse: $("hubCourse"),
    scopeList: $("scopeList"),
    raceCard: $("raceCard"),
    raceRecord: $("raceRecord"),
    raceStart: $("raceStart"),
    memoryCard: $("memoryCard"),
    memoryRecord: $("memoryRecord"),
    memoryStart: $("memoryStart"),
    timelineCard: $("timelineCard"),
    timelineRecord: $("timelineRecord"),
    timelineStart: $("timelineStart"),
    whoCard: $("whoCard"),
    whoRecord: $("whoRecord"),
    whoStart: $("whoStart"),
    courseChips: $("courseChips"),
    dailyCard: $("dailyCard"),
    dailyDate: $("dailyDate"),
    dailyStreak: $("dailyStreak"),
    dailyStatus: $("dailyStatus"),
    dailyStart: $("dailyStart"),
    xpNote: $("xpNote"),

    daily: $("daily"),
    dailyProgress: $("dailyProgress"),
    dailyProgressFill: $("dailyProgressFill"),
    dailyCounter: $("dailyCounter"),
    dailyTime: $("dailyTime"),
    dailyStage: $("dailyStage"),
    resultShare: $("resultShare"),
    resultShareNote: $("resultShareNote"),

    who: $("who"),
    whoRound: $("whoRound"),
    whoProgress: $("whoProgress"),
    whoProgressFill: $("whoProgressFill"),
    whoKind: $("whoKind"),
    whoPoints: $("whoPoints"),
    whoClues: $("whoClues"),
    whoMore: $("whoMore"),
    whoHint: $("whoHint"),
    whoOptions: $("whoOptions"),
    whoFooter: $("whoFooter"),
    whoFeedback: $("whoFeedback"),
    whoFeedbackIcon: $("whoFeedbackIcon"),
    whoFeedbackTitle: $("whoFeedbackTitle"),
    whoFeedbackText: $("whoFeedbackText"),
    whoNext: $("whoNext"),

    timeline: $("timeline"),
    timelineRound: $("timelineRound"),
    timelineProgress: $("timelineProgress"),
    timelineProgressFill: $("timelineProgressFill"),
    timelineInstruction: $("timelineInstruction"),
    timelineSlots: $("timelineSlots"),
    timelinePool: $("timelinePool"),
    timelineAnswer: $("timelineAnswer"),
    timelineAnswerList: $("timelineAnswerList"),
    timelineFooter: $("timelineFooter"),
    timelineFeedback: $("timelineFeedback"),
    timelineFeedbackIcon: $("timelineFeedbackIcon"),
    timelineFeedbackTitle: $("timelineFeedbackTitle"),
    timelineFeedbackText: $("timelineFeedbackText"),
    timelineBtn: $("timelineBtn"),

    race: $("race"),
    raceStage: $("raceStage"),
    raceTimerFill: $("raceTimerFill"),
    raceClock: $("raceClock"),
    raceScore: $("raceScore"),
    raceCombo: $("raceCombo"),

    memory: $("memory"),
    memoryGrid: $("memoryGrid"),
    memoryMoves: $("memoryMoves"),
    memoryPairs: $("memoryPairs"),
    memoryTime: $("memoryTime"),

    result: $("result"),
    resultEmblem: $("resultEmblem"),
    resultTitle: $("resultTitle"),
    resultSubtitle: $("resultSubtitle"),
    resultRecord: $("resultRecord"),
    resultStats: $("resultStats"),
    resultReview: $("resultReview"),
    resultMistakes: $("resultMistakes"),
    resultAgain: $("resultAgain"),
    resultMenu: $("resultMenu"),
  };

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  /* ==========================================================
     მასალა: გავლილი + მიმდინარე გაკვეთილები
     ========================================================== */

  function unlockedLessons() {
    const profile = store.loadProfile();
    const done = new Set(profile ? profile.completedLessons : []);
    const currentIndex = course.lessons.findIndex((l) => !done.has(l.id));
    return course.lessons.filter((l, i) => done.has(l.id) || i === currentIndex);
  }

  const state = {
    scope: "all",        // "all", თავის id ან ქვეთავის id
    screen: "hub",
    lastGame: null,      // "race" | "memory"
  };

  function scopeLessons() {
    const lessons = unlockedLessons();
    return state.scope === "all" ? lessons : lessons.filter((l) => l.chapterId === state.scope || l.sectionId === state.scope);
  }

  function questionPool(lessons) {
    const pool = [];
    lessons.forEach((l) => {
      (l.steps || []).forEach((s) => {
        if (RACE_TYPES.includes(s.type)) pool.push(s);
      });
    });
    return pool;
  }

  /** ცნება ↔ განმარტება წყვილები; ერთნაირი ცნება/განმარტება ორჯერ არ შედის. */
  function pairPool(lessons) {
    const seenLeft = new Set();
    const seenRight = new Set();
    const pairs = [];
    lessons.forEach((l) => {
      (l.steps || []).forEach((s) => {
        if (s.type !== "match" || !Array.isArray(s.pairs)) return;
        s.pairs.forEach(([left, right]) => {
          if (typeof left !== "string" || typeof right !== "string") return;
          if (left.length > MEMORY_MAX_LEFT || right.length > MEMORY_MAX_RIGHT) return;
          if (seenLeft.has(left) || seenRight.has(right)) return;
          seenLeft.add(left);
          seenRight.add(right);
          pairs.push({ left: left, right: right });
        });
      });
    });
    return pairs;
  }

  /** „დროის ხაზის“ მოვლენები ამ კურსისთვის (js/timeline-data.js). */
  function timelineEvents() {
    return window.IMS_TIMELINE ? window.IMS_TIMELINE.forCourse(course.id) : [];
  }

  /** „ვინ ვარ მე?“ გმირები ამ კურსისთვის (js/whoami-data.js). */
  function whoHeroes() {
    return window.IMS_WHOAMI ? window.IMS_WHOAMI.forCourse(course.id) : [];
  }

  /* ==========================================================
     რეკორდები და XP (localStorage → IMS_STORE)
     ========================================================== */

  function readGames() {
    try {
      const raw = JSON.parse(store.readString(store.KEYS.games) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (e) {
      return {};
    }
  }

  function userKey() {
    const p = store.loadProfile();
    return p && p.email ? p.email : "guest";
  }

  function userGames() {
    const all = readGames();
    const mine = all[userKey()];
    return mine && typeof mine === "object" ? mine : {};
  }

  function saveUserGames(mine) {
    const all = readGames();
    all[userKey()] = mine;
    store.writeString(store.KEYS.games, JSON.stringify(all));
  }

  function recordKey(game) {
    return game + ":" + course.id + ":" + state.scope;
  }

  function getRecord(game) {
    const mine = userGames();
    return mine.records && mine.records[recordKey(game)] ? mine.records[recordKey(game)] : null;
  }

  /** ინახავს რეკორდს, თუ შედეგი უკეთესია. აბრუნებს true-ს ახალ რეკორდზე. */
  function saveRecord(game, result, isBetter) {
    const mine = userGames();
    mine.records = mine.records || {};
    const prev = mine.records[recordKey(game)] || null;
    if (prev && !isBetter(result, prev)) return false;
    mine.records[recordKey(game)] = result;
    saveUserGames(mine);
    return true;
  }

  function xpEarnedToday() {
    const mine = userGames();
    return mine.xpDay === store.todayKey() ? store.toCount(mine.xpToday, 0) : 0;
  }

  /** დაამატებს XP-ს დღიური ლიმიტის ფარგლებში; აბრუნებს რეალურად დამატებულს. */
  function awardXp(amount) {
    const left = Math.max(0, GAMES_XP_DAILY_CAP - xpEarnedToday());
    const gain = Math.min(left, Math.max(0, Math.floor(amount)));
    if (gain <= 0) return 0;
    const mine = userGames();
    mine.xpDay = store.todayKey();
    mine.xpToday = xpEarnedToday() + gain;
    saveUserGames(mine);
    store.updateProfile((p) => { p.xp += gain; });
    return gain;
  }

  /* ==========================================================
     ეკრანების გადართვა
     ========================================================== */

  let activeTimer = null;

  function stopTimer() {
    if (activeTimer) clearInterval(activeTimer);
    activeTimer = null;
  }

  function show(screen) {
    state.screen = screen;
    el.hub.hidden = screen !== "hub";
    el.race.hidden = screen !== "race";
    el.memory.hidden = screen !== "memory";
    el.timeline.hidden = screen !== "timeline";
    el.who.hidden = screen !== "who";
    el.daily.hidden = screen !== "daily";
    el.result.hidden = screen !== "result";
    window.scrollTo(0, 0);
  }

  function goHub() {
    stopTimer();
    renderHub();
    show("hub");
  }

  document.querySelectorAll(".games-exit").forEach((btn) => btn.addEventListener("click", goHub));
  el.resultMenu.addEventListener("click", goHub);
  el.resultAgain.addEventListener("click", () => {
    if (state.lastGame === "race") startRace();
    else if (state.lastGame === "memory") startMemory();
    else if (state.lastGame === "timeline") startTimeline();
    else if (state.lastGame === "who") startWho();
    else if (state.lastGame === "daily") startDaily();
  });

  /* ==========================================================
     მენიუ
     ========================================================== */

  function renderScope() {
    const unlocked = unlockedLessons();
    const chapters = course.chapters.filter((ch) => unlocked.some((l) => l.chapterId === ch.id));
    // ქვეთავები — თავის შემდეგ, მხოლოდ ღია გაკვეთილებით
    const options = [{ id: "all", label: "ყველა გავლილი", title: "ყველა გავლილი თავის მასალა" }];
    chapters.forEach((ch) => {
      options.push({ id: ch.id, label: "თავი " + toRoman(ch.number), title: ch.title });
      (ch.sections || []).forEach((sec) => {
        if (unlocked.some((l) => l.sectionId === sec.id)) {
          options.push({ id: sec.id, label: "ქვეთავი " + sec.number, title: sec.title });
        }
      });
    });
    if (!options.some((opt) => opt.id === state.scope)) state.scope = "all";

    el.scopeList.replaceChildren();
    options.forEach((opt) => {
      const btn = createEl("button", "games-scope__chip", opt.label);
      btn.type = "button";
      btn.title = opt.title;
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(opt.id === state.scope));
      btn.addEventListener("click", () => {
        state.scope = opt.id;
        renderHub();
      });
      el.scopeList.append(btn);
    });
  }

  function setCardState(card, button, recordEl, enabled, recordText, lockedText) {
    card.classList.toggle("is-locked", !enabled);
    button.disabled = !enabled;
    recordEl.textContent = enabled ? recordText : lockedText;
  }

  function renderHub() {
    el.hubCourse.textContent = course.title;
    renderCourseChips();
    renderDaily();
    renderScope();

    const lessons = scopeLessons();
    const questions = questionPool(lessons);
    const pairs = pairPool(lessons);

    const race = getRecord("race");
    setCardState(
      el.raceCard, el.raceStart, el.raceRecord,
      questions.length >= RACE_MIN_QUESTIONS,
      race ? "🏅 რეკორდი: " + race.score + " ქულა" : "რეკორდი ჯერ არ გაქვს — დაამყარე პირველი!",
      "🔒 ჯერ გაიარე მეტი გაკვეთილი ამ კურსში"
    );

    const mem = getRecord("memory");
    setCardState(
      el.memoryCard, el.memoryStart, el.memoryRecord,
      pairs.length >= MEMORY_PAIRS,
      mem ? "🏅 რეკორდი: " + mem.moves + " სვლა · " + "★".repeat(mem.stars) : "რეკორდი ჯერ არ გაქვს — დაამყარე პირველი!",
      "🔒 ჯერ გაიარე მეტი გაკვეთილი — საკმარისი წყვილი არ არის"
    );

    const lessonIds = new Set(lessons.map((l) => l.id));
    const tlEvents = timelineEvents().filter((e) => lessonIds.has(e.lesson));
    const tlRec = getRecord("timeline");
    setCardState(
      el.timelineCard, el.timelineStart, el.timelineRecord,
      maxDisjoint(tlEvents) >= TIMELINE_SIZE,
      tlRec ? "🏅 რეკორდი: " + tlRec.score + " / " + TIMELINE_ROUNDS * TIMELINE_SIZE + " · " + "★".repeat(tlRec.stars) : "რეკორდი ჯერ არ გაქვს — დაამყარე პირველი!",
      "🔒 ჯერ გაიარე მეტი გაკვეთილი — თარიღიანი მოვლენები არ ჰყოფნის"
    );

    const heroes = whoHeroes().filter((h) => lessonIds.has(h.lesson));
    const whoRec = getRecord("who");
    setCardState(
      el.whoCard, el.whoStart, el.whoRecord,
      heroes.length >= WHO_ROUNDS,
      whoRec ? "🏅 რეკორდი: " + whoRec.score + " / " + WHO_ROUNDS * WHO_CLUES + " · " + "★".repeat(whoRec.stars) : "რეკორდი ჯერ არ გაქვს — დაამყარე პირველი!",
      "🔒 ჯერ გაიარე მეტი გაკვეთილი — გმირები ჯერ არ ჰყოფნის"
    );

    const earned = xpEarnedToday();
    el.xpNote.textContent = earned >= GAMES_XP_DAILY_CAP
      ? "⚡ დღევანდელი XP-ის ლიმიტი თამაშებიდან ამოიწურა (" + GAMES_XP_DAILY_CAP + "). შეგიძლია ითამაშო რეკორდისთვის!"
      : "⚡ თამაშებით დღეს მიღებული XP: " + earned + " / " + GAMES_XP_DAILY_CAP;
  }

  el.raceStart.addEventListener("click", startRace);
  el.memoryStart.addEventListener("click", startMemory);
  el.timelineStart.addEventListener("click", startTimeline);
  el.whoStart.addEventListener("click", startWho);

  /* ==========================================================
     შედეგის ეკრანი
     ========================================================== */

  function statBox(label, value, modifier) {
    const box = createEl("div", "result-stat " + modifier);
    box.append(createEl("span", "result-stat__label", label), createEl("span", "result-stat__value", value));
    return box;
  }

  function showResult(opts) {
    stopTimer();
    el.resultEmblem.textContent = opts.emblem;
    el.resultTitle.textContent = opts.title;
    el.resultSubtitle.textContent = opts.subtitle;
    el.resultRecord.hidden = !opts.newRecord;
    el.resultShare.hidden = !opts.share;
    el.resultShareNote.hidden = true;
    el.resultStats.replaceChildren(...opts.stats);

    el.resultMistakes.replaceChildren();
    const mistakes = opts.mistakes || [];
    el.resultReview.hidden = mistakes.length === 0;
    mistakes.forEach((m) => {
      const li = createEl("li", "game-result__mistake");
      li.append(createEl("p", "game-result__q", m.question), createEl("p", "game-result__a", "✓ " + m.answer));
      el.resultMistakes.append(li);
    });
    show("result");
  }

  /* ==========================================================
     1. დროსთან რბოლა
     ========================================================== */

  const race = {
    queue: [],
    current: null,
    correctBtn: null,
    score: 0,
    correct: 0,
    answered: 0,
    streak: 0,
    bestStreak: 0,
    endsAt: 0,
    locked: false,
    finished: false,
    mistakes: [],
  };

  function multiplier(streak) {
    if (streak >= 7) return 3;
    if (streak >= 4) return 2;
    return 1;
  }

  function startRace() {
    const pool = questionPool(scopeLessons());
    if (pool.length < RACE_MIN_QUESTIONS) return goHub();

    state.lastGame = "race";
    Object.assign(race, {
      pool: pool,
      queue: shuffle(pool),
      current: null,
      score: 0,
      correct: 0,
      answered: 0,
      streak: 0,
      bestStreak: 0,
      endsAt: Date.now() + RACE_SECONDS * 1000,
      locked: false,
      finished: false,
      mistakes: [],
    });
    el.raceScore.textContent = "0";
    el.raceCombo.hidden = true;
    show("race");
    nextQuestion();

    stopTimer();
    tickRace();
    activeTimer = setInterval(tickRace, 100);
  }

  function tickRace() {
    const left = Math.max(0, race.endsAt - Date.now());
    el.raceTimerFill.style.width = (left / (RACE_SECONDS * 1000)) * 100 + "%";
    el.raceTimerFill.classList.toggle("is-low", left <= 10000);
    el.raceClock.textContent = String(Math.ceil(left / 1000));
    // დრო ამოიწურა: თუ უკუკავშირი ჩანს, დასრულება მის შემდეგ მოხდება
    if (left <= 0 && !race.locked) finishRace();
  }

  function nextQuestion() {
    if (race.queue.length === 0) race.queue = shuffle(race.pool);
    race.current = race.queue.pop();
    race.locked = false;
    renderRaceQuestion(race.current);
  }

  function correctText(step) {
    if (step.type === "truefalse") return step.answer ? "სწორია" : "მცდარია";
    return step.options[step.answer];
  }

  function questionText(step) {
    if (step.type === "truefalse") return step.statement;
    if (step.type === "fill") return [step.before, "___", step.after].filter(Boolean).join(" ");
    return step.question;
  }

  /**
   * კითხვის აგება (რბოლა და დღის გამოწვევა): choice / truefalse / fill.
   * shuffleFn — ვარიანტების არევა (რბოლაში შემთხვევითი, დღის გამოწვევაში — დღის მიხედვით).
   * აბრუნებს სწორი პასუხის ღილაკს.
   */
  function buildQuestion(stage, step, shuffleFn, onPick) {
    stage.replaceChildren();
    stage.classList.remove("is-anim");
    void stage.offsetWidth; // ანიმაციის თავიდან ჩართვა
    stage.classList.add("is-anim");

    let options;
    let blank = null;

    if (step.type === "truefalse") {
      stage.append(createEl("p", "exercise__label", "სწორია თუ მცდარია?"));
      stage.append(createEl("h1", "exercise__question race-question", step.statement));
      options = [
        { text: "სწორია", correct: step.answer === true },
        { text: "მცდარია", correct: step.answer === false },
      ];
    } else if (step.type === "fill") {
      stage.append(createEl("p", "exercise__label", "შეავსე გამოტოვებული"));
      const sentence = createEl("p", "fill-sentence race-question");
      blank = createEl("span", "fill-blank", " ");
      const before = (step.before || "").trim();
      const after = (step.after || "").trim();
      const glue = /^[.,;:!?)»“]/.test(after) ? "" : " ";
      const lead = /[„“«(]$/.test(before) ? "" : " ";
      sentence.append(
        document.createTextNode(before ? before + lead : ""),
        blank,
        document.createTextNode(after ? glue + after : "")
      );
      stage.append(sentence);
      options = shuffleFn(step.options.map((t, i) => ({ text: t, correct: i === step.answer })));
    } else {
      stage.append(createEl("p", "exercise__label", "აირჩიე სწორი პასუხი"));
      stage.append(createEl("h1", "exercise__question race-question", step.question));
      options = shuffleFn(step.options.map((t, i) => ({ text: t, correct: i === step.answer })));
    }

    let correctBtn = null;
    const list = createEl("div", "options" + (step.type === "truefalse" ? " options--row" : step.type === "fill" ? " options--chips" : ""));
    options.forEach((opt, i) => {
      const btn = createEl("button", "option");
      btn.type = "button";
      if (step.type === "choice") btn.append(createEl("span", "option__key", String(i + 1)));
      btn.append(createEl("span", "option__text", opt.text));
      btn.addEventListener("click", () => onPick(btn, opt, list, blank));
      if (opt.correct) correctBtn = btn;
      list.append(btn);
    });
    stage.append(list);
    return correctBtn;
  }

  function renderRaceQuestion(step) {
    race.correctBtn = buildQuestion(el.raceStage, step, shuffle, answerRace);
  }

  function answerRace(btn, opt, list, blank) {
    if (race.locked || race.finished) return;
    race.locked = true;
    race.answered += 1;

    const buttons = Array.from(list.querySelectorAll(".option"));
    buttons.forEach((b) => { b.disabled = true; });
    if (blank) {
      blank.textContent = opt.text;
      blank.classList.add("is-filled", opt.correct ? "is-correct" : "is-wrong");
    }

    if (opt.correct) {
      race.correct += 1;
      race.streak += 1;
      race.bestStreak = Math.max(race.bestStreak, race.streak);
      race.score += RACE_POINTS * multiplier(race.streak);
      btn.classList.add("is-correct");
    } else {
      race.streak = 0;
      btn.classList.add("is-wrong", "is-shake");
      // სწორი პასუხის ჩვენება
      if (race.correctBtn) race.correctBtn.classList.add("is-correct");
      race.mistakes.push({ question: questionText(race.current), answer: correctText(race.current) });
    }

    el.raceScore.textContent = String(race.score);
    const mult = multiplier(race.streak);
    el.raceCombo.hidden = mult === 1;
    el.raceCombo.textContent = "🔥 ×" + mult;

    setTimeout(() => {
      if (race.finished) return;
      if (Date.now() >= race.endsAt) finishRace();
      else nextQuestion();
    }, opt.correct ? FEEDBACK_OK_MS : FEEDBACK_BAD_MS);
  }

  function finishRace() {
    if (race.finished) return;
    race.finished = true;
    stopTimer();

    const result = { score: race.score, correct: race.correct, answered: race.answered };
    const newRecord = race.score > 0 && saveRecord("race", result, (a, b) => a.score > b.score);
    const xp = awardXp(Math.min(RACE_XP_CAP, race.correct));
    const accuracy = race.answered ? Math.round((race.correct / race.answered) * 100) : 0;

    showResult({
      emblem: race.score > 0 ? "⏱️" : "⌛",
      title: race.score > 0 ? "დრო ამოიწურა!" : "დრო ამოიწურა — სცადე კიდევ!",
      subtitle: "სწორი პასუხი: " + race.correct + " / " + race.answered + " · საუკეთესო სერია: " + race.bestStreak,
      newRecord: newRecord,
      stats: [
        statBox("ქულა", String(race.score), "result-stat--accuracy"),
        statBox("სიზუსტე", accuracy + "%", "result-stat--accuracy"),
        statBox("XP", "+" + xp, "result-stat--xp"),
      ],
      mistakes: race.mistakes.slice(-8),
    });
  }

  /* ==========================================================
     2. მეხსიერების ბარათები
     ========================================================== */

  const mem = {
    cards: [],
    open: [],
    matched: 0,
    moves: 0,
    startedAt: 0,
    busy: false,
    finished: false,
  };

  function starsFor(moves) {
    if (moves <= MEMORY_PAIRS + 3) return 3;
    if (moves <= MEMORY_PAIRS + 7) return 2;
    return 1;
  }

  function startMemory() {
    const pool = pairPool(scopeLessons());
    if (pool.length < MEMORY_PAIRS) return goHub();

    state.lastGame = "memory";
    const chosen = shuffle(pool).slice(0, MEMORY_PAIRS);
    const cards = [];
    chosen.forEach((pair, i) => {
      cards.push({ pair: i, kind: "term", text: pair.left });
      cards.push({ pair: i, kind: "def", text: pair.right });
    });

    Object.assign(mem, {
      cards: shuffle(cards),
      open: [],
      matched: 0,
      moves: 0,
      startedAt: Date.now(),
      busy: false,
      finished: false,
    });

    el.memoryGrid.replaceChildren();
    mem.cards.forEach((card, i) => {
      const btn = createEl("button", "mem-card mem-card--" + card.kind);
      btn.type = "button";
      btn.setAttribute("aria-label", "დახურული ბარათი " + (i + 1));
      const inner = createEl("span", "mem-card__inner");
      const back = createEl("span", "mem-card__face mem-card__back");
      back.append(createEl("span", "mem-card__emblem", "🏛️"));
      const front = createEl("span", "mem-card__face mem-card__front");
      front.append(
        createEl("span", "mem-card__kind", card.kind === "term" ? "ცნება" : "განმარტება"),
        createEl("span", "mem-card__text", card.text)
      );
      inner.append(back, front);
      btn.append(inner);
      btn.addEventListener("click", () => flipCard(i, btn));
      card.btn = btn;
      el.memoryGrid.append(btn);
    });

    renderMemoryHud();
    show("memory");

    stopTimer();
    activeTimer = setInterval(() => {
      el.memoryTime.textContent = formatTime((Date.now() - mem.startedAt) / 1000);
    }, 500);
  }

  function renderMemoryHud() {
    el.memoryMoves.textContent = String(mem.moves);
    el.memoryPairs.textContent = mem.matched + " / " + MEMORY_PAIRS;
    el.memoryTime.textContent = formatTime((Date.now() - mem.startedAt) / 1000);
  }

  function flipCard(index, btn) {
    const card = mem.cards[index];
    if (mem.busy || mem.finished || card.matched || mem.open.includes(index)) return;

    btn.classList.add("is-flipped");
    btn.setAttribute("aria-label", (card.kind === "term" ? "ცნება: " : "განმარტება: ") + card.text);
    mem.open.push(index);
    if (mem.open.length < 2) return;

    mem.moves += 1;
    const [a, b] = mem.open.map((i) => mem.cards[i]);

    if (a.pair === b.pair && a.kind !== b.kind) {
      a.matched = b.matched = true;
      a.btn.classList.add("is-matched");
      b.btn.classList.add("is-matched");
      a.btn.disabled = b.btn.disabled = true;
      mem.open = [];
      mem.matched += 1;
      renderMemoryHud();
      if (mem.matched === MEMORY_PAIRS) setTimeout(finishMemory, 600);
      return;
    }

    mem.busy = true;
    a.btn.classList.add("is-miss");
    b.btn.classList.add("is-miss");
    renderMemoryHud();
    setTimeout(() => {
      [a, b].forEach((c, k) => {
        c.btn.classList.remove("is-flipped", "is-miss");
        c.btn.setAttribute("aria-label", "დახურული ბარათი " + (mem.open[k] + 1));
      });
      mem.open = [];
      mem.busy = false;
    }, MEMORY_MISMATCH_MS);
  }

  function finishMemory() {
    if (mem.finished) return;
    mem.finished = true;
    stopTimer();

    const seconds = Math.round((Date.now() - mem.startedAt) / 1000);
    const stars = starsFor(mem.moves);
    const result = { moves: mem.moves, seconds: seconds, stars: stars };
    const newRecord = saveRecord("memory", result, (x, y) => x.moves < y.moves || (x.moves === y.moves && x.seconds < y.seconds));
    const xp = awardXp(MEMORY_XP[stars]);

    showResult({
      emblem: "★".repeat(stars) + "☆".repeat(3 - stars),
      title: stars === 3 ? "ბრწყინვალე მეხსიერება!" : stars === 2 ? "კარგი შედეგია!" : "ყველა წყვილი იპოვე!",
      subtitle: "იდეალური შედეგი — " + MEMORY_PAIRS + " სვლა. 3 ვარსკვლავისთვის საკმარისია " + (MEMORY_PAIRS + 3) + " სვლა.",
      newRecord: newRecord,
      stats: [
        statBox("სვლა", String(mem.moves), "result-stat--accuracy"),
        statBox("დრო", formatTime(seconds), "result-stat--accuracy"),
        statBox("XP", "+" + xp, "result-stat--xp"),
      ],
    });
  }

  /* ==========================================================
     3. დროის ხაზი
     ========================================================== */

  const tl = {
    pool: [],
    used: new Set(),
    round: 0,
    events: [],      // ამ რაუნდის 5 მოვლენა (შემთხვევითი რიგით)
    placed: [],      // მოთამაშის მიერ დალაგებული
    checked: false,
    score: 0,
    mistakes: [],
  };

  function overlaps(a, b) {
    return a.from <= b.to && b.from <= a.to;
  }

  /** რამდენი ურთიერთგადაუფარავი მოვლენის არჩევა შეიძლება (ხარბი ალგორითმი „to“-ს მიხედვით). */
  function maxDisjoint(events) {
    let count = 0;
    let lastTo = -Infinity;
    events.slice().sort((a, b) => a.to - b.to).forEach((e) => {
      if (e.from > lastTo) {
        count += 1;
        lastTo = e.to;
      }
    });
    return count;
  }

  /** 5 მოვლენა, რომელთა თარიღები ერთმანეთს არ ფარავს; ჯერ — ამ თამაშში ჯერ არნაჩვენები. */
  function pickRoundEvents() {
    for (let attempt = 0; attempt < 60; attempt++) {
      const fresh = tl.pool.filter((e) => !tl.used.has(e));
      const seen = tl.pool.filter((e) => tl.used.has(e));
      const order = attempt < 30 ? shuffle(fresh).concat(shuffle(seen)) : shuffle(tl.pool);
      const chosen = [];
      for (const e of order) {
        if (chosen.every((c) => !overlaps(c, e))) chosen.push(e);
        if (chosen.length === TIMELINE_SIZE) return chosen;
      }
    }
    return null;
  }

  function sortedEvents(events) {
    return events.slice().sort((a, b) => a.from - b.from);
  }

  function startTimeline() {
    const lessons = new Set(scopeLessons().map((l) => l.id));
    const pool = timelineEvents().filter((e) => lessons.has(e.lesson));
    if (maxDisjoint(pool) < TIMELINE_SIZE) return goHub();

    state.lastGame = "timeline";
    Object.assign(tl, { pool: pool, used: new Set(), round: 0, score: 0, mistakes: [] });
    show("timeline");
    nextTimelineRound();
  }

  function nextTimelineRound() {
    const events = pickRoundEvents();
    if (!events) return goHub();
    events.forEach((e) => tl.used.add(e));
    tl.round += 1;
    tl.events = shuffle(events);
    tl.placed = [];
    tl.checked = false;

    el.timelineRound.textContent = tl.round + " / " + TIMELINE_ROUNDS;
    el.timelineProgress.setAttribute("aria-valuenow", String(tl.round - 1));
    el.timelineProgressFill.style.width = ((tl.round - 1) / TIMELINE_ROUNDS) * 100 + "%";
    el.timelineAnswer.hidden = true;
    el.timelineFeedback.hidden = true;
    el.timelineFooter.dataset.state = "idle";
    el.timelineBtn.textContent = "შემოწმება";
    renderTimeline();
    window.scrollTo(0, 0);
  }

  function renderTimeline() {
    const correct = tl.checked ? sortedEvents(tl.events) : null;

    el.timelineSlots.replaceChildren();
    for (let i = 0; i < TIMELINE_SIZE; i++) {
      const ev = tl.placed[i];
      const li = createEl("li", "tl-slot");
      li.append(createEl("span", "tl-slot__num", String(i + 1)));

      if (!ev) {
        li.classList.add("is-empty");
        li.append(createEl("span", "tl-slot__empty", i === tl.placed.length ? "შემდეგი მოვლენა აქ ჩაჯდება" : "—"));
      } else if (tl.checked) {
        const ok = ev === correct[i];
        li.classList.add(ok ? "is-correct" : "is-wrong");
        const body = createEl("span", "tl-slot__body");
        body.append(createEl("span", "tl-slot__text", ev.text), createEl("span", "tl-slot__date", (ok ? "✓ " : "✗ ") + ev.date));
        li.append(body);
      } else {
        const btn = createEl("button", "tl-slot__event");
        btn.type = "button";
        btn.setAttribute("aria-label", (i + 1) + ". " + ev.text + " — შეეხე, რომ ამოიღო");
        btn.append(createEl("span", "tl-slot__text", ev.text), createEl("span", "tl-slot__remove", "✕"));
        btn.addEventListener("click", () => {
          tl.placed.splice(i, 1);
          renderTimeline();
        });
        li.append(btn);
      }
      el.timelineSlots.append(li);
    }

    el.timelinePool.replaceChildren();
    el.timelinePool.hidden = tl.checked;
    tl.events.filter((e) => !tl.placed.includes(e)).forEach((ev) => {
      const btn = createEl("button", "option tl-card");
      btn.type = "button";
      btn.append(createEl("span", "option__text", ev.text));
      btn.addEventListener("click", () => {
        if (tl.checked || tl.placed.length >= TIMELINE_SIZE) return;
        tl.placed.push(ev);
        renderTimeline();
      });
      el.timelinePool.append(btn);
    });

    el.timelineInstruction.hidden = tl.checked;
    el.timelineBtn.disabled = !tl.checked && tl.placed.length < TIMELINE_SIZE;
  }

  function checkTimeline() {
    tl.checked = true;
    const correct = sortedEvents(tl.events);
    const right = tl.placed.filter((ev, i) => ev === correct[i]).length;
    tl.score += right;

    renderTimeline();

    const perfect = right === TIMELINE_SIZE;
    if (!perfect) {
      el.timelineAnswerList.replaceChildren();
      correct.forEach((ev) => {
        const li = createEl("li", "tl-answer__item");
        li.append(createEl("span", "tl-answer__date", ev.date), createEl("span", "tl-answer__text", ev.text));
        el.timelineAnswerList.append(li);
      });
      el.timelineAnswer.hidden = false;
      tl.mistakes.push({ question: "რაუნდი " + tl.round, answer: correct.map((e) => e.date + " — " + e.text).join(" → ") });
    }

    el.timelineFooter.dataset.state = perfect ? "correct" : "wrong";
    el.timelineFeedback.hidden = false;
    el.timelineFeedbackIcon.textContent = perfect ? "✓" : right >= 3 ? "≈" : "✗";
    el.timelineFeedbackTitle.textContent = perfect ? "ყველაფერი სწორად დაალაგე!" : "სწორ ადგილზეა " + right + " / " + TIMELINE_SIZE;
    el.timelineFeedbackText.textContent = perfect ? "თარიღები ახლა თითოეულ მოვლენასთან ჩანს." : "ქვემოთ ნახე სწორი თანმიმდევრობა თარიღებით.";
    el.timelineBtn.textContent = tl.round < TIMELINE_ROUNDS ? "შემდეგი რაუნდი" : "შედეგების ნახვა";
    el.timelineBtn.disabled = false;
    el.timelineProgress.setAttribute("aria-valuenow", String(tl.round));
    el.timelineProgressFill.style.width = (tl.round / TIMELINE_ROUNDS) * 100 + "%";
  }

  function timelineStars(score) {
    const max = TIMELINE_ROUNDS * TIMELINE_SIZE;
    if (score >= max - 2) return 3;
    if (score >= Math.ceil(max * 0.6)) return 2;
    return 1;
  }

  function finishTimeline() {
    const max = TIMELINE_ROUNDS * TIMELINE_SIZE;
    const stars = timelineStars(tl.score);
    const result = { score: tl.score, stars: stars };
    const newRecord = tl.score > 0 && saveRecord("timeline", result, (a, b) => a.score > b.score);
    const xp = awardXp(Math.min(TIMELINE_XP_CAP, tl.score));

    showResult({
      emblem: "★".repeat(stars) + "☆".repeat(3 - stars),
      title: stars === 3 ? "ნამდვილი ისტორიკოსი!" : stars === 2 ? "კარგი შედეგია!" : "სცადე კიდევ ერთხელ!",
      subtitle: "სწორ ადგილზე დასვი " + tl.score + " მოვლენა " + max + "-დან.",
      newRecord: newRecord,
      stats: [
        statBox("ქულა", tl.score + " / " + max, "result-stat--accuracy"),
        statBox("სიზუსტე", Math.round((tl.score / max) * 100) + "%", "result-stat--accuracy"),
        statBox("XP", "+" + xp, "result-stat--xp"),
      ],
    });
  }

  el.timelineBtn.addEventListener("click", () => {
    if (!tl.checked) {
      if (tl.placed.length === TIMELINE_SIZE) checkTimeline();
    } else if (tl.round < TIMELINE_ROUNDS) {
      nextTimelineRound();
    } else {
      finishTimeline();
    }
  });

  /* ==========================================================
     4. ვინ ვარ მე?
     ========================================================== */

  const WHO_KIND = {
    person: "👤 პიროვნება",
    ancient: "🦴 უძველესი ადამიანი",
    place: "📍 ადგილი",
    state: "🏛️ სახელმწიფო",
    object: "🏺 ნივთი",
    people: "👥 ხალხი",
  };

  const who = {
    rounds: [],
    round: 0,
    hero: null,
    shown: 1,       // რამდენი მინიშნება ჩანს
    wrong: 0,
    done: false,
    score: 0,
    guessed: 0,
    buttons: [],
    review: [],
  };

  function heroesInScope() {
    const ids = new Set(scopeLessons().map((l) => l.id));
    return whoHeroes().filter((h) => ids.has(h.lesson));
  }

  /** 3 არასწორი ვარიანტი: ჯერ იმავე ტიპის ღია გმირები, მერე იმავე ტიპის სხვები, ბოლოს — ნებისმიერი. */
  function pickDistractors(hero, scopePool) {
    const all = whoHeroes();
    const groups = [
      scopePool.filter((h) => h.kind === hero.kind),
      all.filter((h) => h.kind === hero.kind),
      scopePool,
      all,
    ];
    const picked = [];
    const names = new Set([hero.answer]);
    groups.forEach((group) => {
      shuffle(group).forEach((h) => {
        if (picked.length < 3 && !names.has(h.answer)) {
          names.add(h.answer);
          picked.push(h);
        }
      });
    });
    return picked;
  }

  function whoPoints() {
    return Math.max(0, WHO_CLUES + 1 - who.shown);
  }

  function startWho() {
    const pool = heroesInScope();
    if (pool.length < WHO_ROUNDS) return goHub();

    state.lastGame = "who";
    Object.assign(who, { pool: pool, rounds: shuffle(pool).slice(0, WHO_ROUNDS), round: 0, score: 0, guessed: 0, review: [] });
    show("who");
    nextWhoRound();
  }

  function nextWhoRound() {
    who.hero = who.rounds[who.round];
    who.round += 1;
    who.shown = 1;
    who.wrong = 0;
    who.done = false;

    el.whoRound.textContent = who.round + " / " + WHO_ROUNDS;
    el.whoProgress.setAttribute("aria-valuenow", String(who.round - 1));
    el.whoProgressFill.style.width = ((who.round - 1) / WHO_ROUNDS) * 100 + "%";
    el.whoKind.textContent = WHO_KIND[who.hero.kind] || "";
    el.whoHint.textContent = "";
    el.whoFeedback.hidden = true;
    el.whoFooter.dataset.state = "idle";
    el.whoNext.disabled = true;
    el.whoNext.textContent = "აირჩიე პასუხი";

    // ვარიანტები — ერთხელ რაუნდზე
    el.whoOptions.replaceChildren();
    const options = shuffle([who.hero].concat(pickDistractors(who.hero, who.pool)));
    who.buttons = options.map((h, i) => {
      const btn = createEl("button", "option");
      btn.type = "button";
      btn.append(createEl("span", "option__key", String(i + 1)), createEl("span", "option__text", h.answer));
      btn.addEventListener("click", () => answerWho(btn, h));
      el.whoOptions.append(btn);
      return { btn: btn, hero: h };
    });

    renderWho();
    window.scrollTo(0, 0);
  }

  function renderWho() {
    el.whoClues.replaceChildren();
    who.hero.clues.forEach((text, i) => {
      if (i >= who.shown && !who.done) return;
      const li = createEl("li", "who-clue" + (i >= who.shown ? " is-extra" : "") + (i === who.shown - 1 && !who.done ? " is-new" : ""));
      li.append(createEl("span", "who-clue__num", String(i + 1)), createEl("span", "who-clue__text", text));
      el.whoClues.append(li);
    });
    el.whoPoints.textContent = who.done ? "" : "შესაძლო ქულა: " + whoPoints();
    el.whoMore.hidden = who.done;
    el.whoMore.disabled = who.shown >= WHO_CLUES;
    el.whoMore.textContent = who.shown >= WHO_CLUES ? "🔍 ყველა მინიშნება გახსნილია" : "🔍 კიდევ ერთი მინიშნება (−1 ქულა)";
  }

  el.whoMore.addEventListener("click", () => {
    if (who.done || who.shown >= WHO_CLUES) return;
    who.shown += 1;
    el.whoHint.textContent = "";
    renderWho();
  });

  function endWhoRound(gained) {
    who.done = true;
    who.buttons.forEach((b) => {
      b.btn.disabled = true;
      if (b.hero === who.hero) b.btn.classList.add("is-correct");
    });
    if (gained < WHO_CLUES) who.review.push({ question: who.hero.clues[WHO_CLUES - 1], answer: who.hero.answer });

    el.whoHint.textContent = "";
    el.whoFooter.dataset.state = gained > 0 ? "correct" : "wrong";
    el.whoFeedback.hidden = false;
    el.whoFeedbackIcon.textContent = gained > 0 ? "✓" : "✗";
    el.whoFeedbackTitle.textContent = gained > 0 ? "სწორია! +" + gained + " ქულა" : "ვერ გამოიცანი";
    el.whoFeedbackText.textContent = (gained > 0 ? "" : "სწორი პასუხი: ") + who.hero.answer + (gained > 0 ? " — ქვემოთ ყველა მინიშნება ჩანს." : "");
    el.whoNext.disabled = false;
    el.whoNext.textContent = who.round < WHO_ROUNDS ? "შემდეგი" : "შედეგების ნახვა";
    el.whoProgress.setAttribute("aria-valuenow", String(who.round));
    el.whoProgressFill.style.width = (who.round / WHO_ROUNDS) * 100 + "%";
    renderWho();
  }

  function answerWho(btn, hero) {
    if (who.done || btn.disabled) return;
    if (hero === who.hero) {
      const gained = whoPoints();
      who.score += gained;
      who.guessed += 1;
      btn.classList.add("is-correct");
      endWhoRound(gained);
      return;
    }
    who.wrong += 1;
    btn.disabled = true;
    btn.classList.add("is-wrong", "is-shake");
    if (who.shown < WHO_CLUES) {
      who.shown += 1;
      el.whoHint.textContent = "არასწორია — გაიხსნა ახალი მინიშნება.";
      renderWho();
    } else {
      endWhoRound(0);
    }
  }

  el.whoNext.addEventListener("click", () => {
    if (!who.done) return;
    if (who.round < WHO_ROUNDS) nextWhoRound();
    else finishWho();
  });

  function finishWho() {
    const max = WHO_ROUNDS * WHO_CLUES;
    const stars = who.score >= max - 4 ? 3 : who.score >= Math.ceil(max / 2) ? 2 : 1;
    const result = { score: who.score, stars: stars };
    const newRecord = who.score > 0 && saveRecord("who", result, (a, b) => a.score > b.score);
    const xp = awardXp(Math.min(WHO_XP_CAP, who.score));

    showResult({
      emblem: "★".repeat(stars) + "☆".repeat(3 - stars),
      title: stars === 3 ? "ისტორიის ნამდვილი მცოდნე!" : stars === 2 ? "კარგი შედეგია!" : "სცადე კიდევ ერთხელ!",
      subtitle: "ქულა მით მეტია, რაც ნაკლები მინიშნებით გამოიცნობ.",
      newRecord: newRecord,
      stats: [
        statBox("ქულა", who.score + " / " + max, "result-stat--accuracy"),
        statBox("გამოიცანი", who.guessed + " / " + WHO_ROUNDS, "result-stat--accuracy"),
        statBox("XP", "+" + xp, "result-stat--xp"),
      ],
      mistakes: who.review,
    });
  }

  /* ==========================================================
     5. დღის გამოწვევა
     ----------------------------------------------------------
     კითხვების რიგი და ვარიანტების რიგი გამოითვლება თარიღიდან და
     კურსიდან (seeded PRNG) — სერვერის გარეშე, ყველასთვის ერთნაირად.
     იმავე ეტაპზე მყოფი კლასელები ერთსა და იმავე 10 კითხვას იღებენ.
     ქულა ითვლება დღეში ერთხელ; შემდეგ — მხოლოდ ვარჯიში.
     ========================================================== */

  const MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
    "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];

  /** სტრიქონიდან 32-ბიტიანი რიცხვი (FNV-1a). */
  function hashSeed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** განმეორებადი შემთხვევითი რიცხვები (mulberry32). */
  function seededRandom(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededShuffle(list, rnd) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function todayLabel() {
    const d = new Date();
    return d.getDate() + " " + MONTHS[d.getMonth()] + ", " + d.getFullYear();
  }

  /** დღის 10 კითხვა: მთელი კურსის კითხვები დღის მიხედვით არეულია, შემდეგ — მხოლოდ ღია გაკვეთილებიდან. */
  function dailyQuestions() {
    const all = [];
    course.lessons.forEach((l) => {
      (l.steps || []).forEach((s) => {
        if (RACE_TYPES.includes(s.type)) all.push({ step: s, lesson: l.id, n: all.length });
      });
    });
    const open = new Set(unlockedLessons().map((l) => l.id));
    const rnd = seededRandom(hashSeed(store.todayKey() + "|" + course.id));
    return seededShuffle(all, rnd).filter((q) => open.has(q.lesson)).slice(0, DAILY_SIZE);
  }

  function dailyRecord() {
    const mine = userGames();
    const rec = mine.daily && mine.daily[course.id];
    return rec && rec.date === store.todayKey() ? rec : null;
  }

  function dailyStreak() {
    const mine = userGames();
    const s = mine.dailyStreak;
    if (!s || (s.last !== store.todayKey() && s.last !== store.yesterdayKey())) return 0;
    return store.toCount(s.count, 0);
  }

  function renderDaily() {
    el.dailyDate.textContent = todayLabel() + " · " + course.title;
    const streak = dailyStreak();
    el.dailyStreak.hidden = streak < 2;
    el.dailyStreak.textContent = "🔥 " + streak + " დღე";

    const enough = dailyQuestions().length >= DAILY_SIZE;
    const rec = dailyRecord();
    el.dailyCard.classList.toggle("is-done", Boolean(rec));
    el.dailyCard.classList.toggle("is-locked", !enough);
    el.dailyStart.disabled = !enough;
    el.dailyStatus.hidden = !rec && enough;
    if (!enough) {
      el.dailyStatus.textContent = "🔒 ჯერ გაიარე მეტი გაკვეთილი — საჭიროა მინიმუმ " + DAILY_SIZE + " კითხვა.";
      el.dailyStart.textContent = "დაწყება";
    } else if (rec) {
      el.dailyStatus.textContent = "✅ დღეს შესრულებულია: " + rec.correct + " / " + DAILY_SIZE + " · " + formatTime(rec.seconds) + ". ახალი გამოწვევა — ხვალ!";
      el.dailyStart.textContent = "ხელახლა (ვარჯიში)";
    } else {
      el.dailyStart.textContent = "დაწყება";
    }
  }

  const daily = {
    questions: [],
    index: 0,
    correct: 0,
    mistakes: [],
    startedAt: 0,
    locked: false,
    practice: false,
    correctBtn: null,
  };

  function startDaily() {
    const questions = dailyQuestions();
    if (questions.length < DAILY_SIZE) return goHub();
    state.lastGame = "daily";
    Object.assign(daily, {
      questions: questions,
      index: 0,
      correct: 0,
      mistakes: [],
      startedAt: Date.now(),
      locked: false,
      practice: Boolean(dailyRecord()),
    });
    show("daily");
    renderDailyQuestion();
    stopTimer();
    activeTimer = setInterval(() => {
      el.dailyTime.textContent = formatTime((Date.now() - daily.startedAt) / 1000);
    }, 500);
  }

  function renderDailyQuestion() {
    const q = daily.questions[daily.index];
    el.dailyCounter.textContent = daily.index + 1 + " / " + DAILY_SIZE;
    el.dailyProgress.setAttribute("aria-valuenow", String(daily.index));
    el.dailyProgressFill.style.width = (daily.index / DAILY_SIZE) * 100 + "%";
    el.dailyTime.textContent = formatTime((Date.now() - daily.startedAt) / 1000);
    daily.locked = false;
    const rnd = seededRandom(hashSeed(store.todayKey() + "|" + course.id + "|" + q.n));
    daily.correctBtn = buildQuestion(el.dailyStage, q.step, (list) => seededShuffle(list, rnd), answerDaily);
  }

  function answerDaily(btn, opt, list, blank) {
    if (daily.locked) return;
    daily.locked = true;
    list.querySelectorAll(".option").forEach((b) => { b.disabled = true; });
    if (blank) {
      blank.textContent = opt.text;
      blank.classList.add("is-filled", opt.correct ? "is-correct" : "is-wrong");
    }
    const step = daily.questions[daily.index].step;
    if (opt.correct) {
      daily.correct += 1;
      btn.classList.add("is-correct");
    } else {
      btn.classList.add("is-wrong", "is-shake");
      if (daily.correctBtn) daily.correctBtn.classList.add("is-correct");
      daily.mistakes.push({ question: questionText(step), answer: correctText(step) });
    }
    setTimeout(() => {
      if (state.screen !== "daily") return;
      daily.index += 1;
      if (daily.index >= DAILY_SIZE) finishDaily();
      else renderDailyQuestion();
    }, opt.correct ? FEEDBACK_OK_MS + 220 : FEEDBACK_BAD_MS);
  }

  function finishDaily() {
    stopTimer();
    const seconds = Math.round((Date.now() - daily.startedAt) / 1000);
    let xp = 0;
    let streak = dailyStreak();

    if (!daily.practice) {
      const mine = userGames();
      mine.daily = mine.daily || {};
      mine.daily[course.id] = { date: store.todayKey(), correct: daily.correct, seconds: seconds };
      const s = mine.dailyStreak || {};
      if (s.last !== store.todayKey()) {
        mine.dailyStreak = { last: store.todayKey(), count: s.last === store.yesterdayKey() ? store.toCount(s.count, 0) + 1 : 1 };
      }
      streak = mine.dailyStreak.count;
      saveUserGames(mine);
      // დღის გამოწვევის XP დღიურ ლიმიტში არ ითვლება — დღეში ერთხელ ხდება
      xp = daily.correct * DAILY_XP_PER;
      if (xp > 0) store.updateProfile((p) => { p.xp += xp; });
    }

    const perfect = daily.correct === DAILY_SIZE;
    state.shareText = "📅 ისტორიის სამყარო — დღის გამოწვევა\n" + todayLabel() + " · " + course.title + "\n" +
      "✅ " + daily.correct + " / " + DAILY_SIZE + " · ⏱ " + formatTime(seconds) +
      (streak >= 2 ? " · 🔥 " + streak + " დღე ზედიზედ" : "");

    showResult({
      emblem: perfect ? "🏆" : daily.correct >= 7 ? "🎯" : "📅",
      title: daily.practice ? "ვარჯიში დასრულდა" : perfect ? "იდეალური შედეგი!" : "დღის გამოწვევა შესრულდა!",
      subtitle: daily.practice
        ? "დღევანდელი ქულა უკვე შენახულია — ეს ვარჯიში იყო. ახალი გამოწვევა ხვალ გელოდება!"
        : "შეადარე შედეგი კლასელებს — დღეს მათაც იგივე კითხვები აქვთ.",
      newRecord: false,
      share: !daily.practice,
      stats: [
        statBox("სწორი", daily.correct + " / " + DAILY_SIZE, "result-stat--accuracy"),
        statBox("დრო", formatTime(seconds), "result-stat--accuracy"),
        statBox("XP", "+" + xp, "result-stat--xp"),
      ],
      mistakes: daily.mistakes,
    });
  }

  el.dailyStart.addEventListener("click", startDaily);

  el.resultShare.addEventListener("click", async () => {
    const text = state.shareText || "";
    let note = "";
    try {
      if (navigator.share) {
        await navigator.share({ text: text });
        note = "გაზიარებულია!";
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        note = "შედეგი დაკოპირდა — ჩასვი Messenger-ში ან WhatsApp-ში.";
      } else {
        note = text;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
      note = text;
    }
    el.resultShareNote.textContent = note;
    el.resultShareNote.hidden = false;
  });

  /* ==========================================================
     კლასის (კურსის) არჩევა
     ========================================================== */

  function renderCourseChips() {
    el.courseChips.replaceChildren();
    data.courses.forEach((c) => {
      const btn = createEl("button", "games-scope__chip", c.title);
      btn.type = "button";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(c.id === course.id));
      btn.addEventListener("click", () => {
        if (c.id === course.id) return;
        store.writeString(store.KEYS.selectedCourse, c.id);
        window.location.href = store.URLS.games + "?" + new URLSearchParams({ course: c.id }).toString();
      });
      el.courseChips.append(btn);
    });
  }

  /* ---------- კლავიატურა: 1–4 რბოლაში, „ვინ ვარ მე?“-სა და დღის გამოწვევაში ---------- */

  document.addEventListener("keydown", (e) => {
    const n = Number(e.key);
    if (!Number.isInteger(n) || n < 1) return;
    let buttons = null;
    if (state.screen === "race" && !race.locked) buttons = el.raceStage.querySelectorAll(".option");
    if (state.screen === "who" && !who.done) buttons = el.whoOptions.querySelectorAll(".option");
    if (state.screen === "daily" && !daily.locked) buttons = el.dailyStage.querySelectorAll(".option");
    if (buttons && buttons[n - 1]) buttons[n - 1].click();
  });

  /* ---------- სტარტი ---------- */

  renderHub();
  show("hub");
}, window.IMS_DATA.showLoadError);
