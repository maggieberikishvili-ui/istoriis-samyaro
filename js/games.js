/* ==========================================================
   ისტორიის სამყარო — თამაშები (ერთი მოთამაშისთვის, სერვერის გარეშე)
   ----------------------------------------------------------
   1. „დროსთან რბოლა“ — 60 წამი; choice / truefalse / fill კითხვები;
      ზედიზედ სწორი პასუხები ამრავლებს ქულას (×2 / ×3).
   2. „მეხსიერების ბარათები“ — 6 წყვილი (ცნება ↔ განმარტება)
      გაკვეთილების match-სავარჯიშოებიდან; ვარსკვლავები სვლების მიხედვით.
   - მასალა: მხოლოდ არჩეული კურსის გავლილი გაკვეთილები + მიმდინარე
     (ზუსტად ისე, როგორც „❤️ აღდგენის“ სავარჯიშოში).
   - რეკორდები და დღიური XP — localStorage (IMS_STORE, გასაღები ims_games),
     თითოეული მომხმარებლისთვის ცალ-ცალკე.
   - XP: დღეში მაქსიმუმ GAMES_XP_DAILY_CAP თამაშებიდან.
   - ტექსტი DOM-ში მხოლოდ textContent-ით.
   ========================================================== */

(function () {
  "use strict";

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

  const GAMES_XP_DAILY_CAP = 60;

  /* ---------- ავტორიზაცია და კურსი ---------- */

  if (!store.requireAuth()) return;
  const daily = store.checkDaily();
  if (!daily) return;

  const params = new URLSearchParams(window.location.search);
  const course =
    data.getCourse(params.get("course")) ||
    data.getCourse(store.readString(store.KEYS.selectedCourse)) ||
    data.courses[0];

  if (GAMES_PRO_ONLY && !daily.profile.isPro) {
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
    xpNote: $("xpNote"),

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

  function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function toRoman(n) {
    const map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let out = "";
    map.forEach(([v, g]) => { while (n >= v) { out += g; n -= v; } });
    return out;
  }

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
    scope: "all",        // "all" ან თავის id
    screen: "hub",
    lastGame: null,      // "race" | "memory"
  };

  function scopeLessons() {
    const lessons = unlockedLessons();
    return state.scope === "all" ? lessons : lessons.filter((l) => l.chapterId === state.scope);
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
  });

  /* ==========================================================
     მენიუ
     ========================================================== */

  function renderScope() {
    const unlocked = unlockedLessons();
    const chapters = course.chapters.filter((ch) => unlocked.some((l) => l.chapterId === ch.id));
    if (state.scope !== "all" && !chapters.some((ch) => ch.id === state.scope)) state.scope = "all";

    el.scopeList.replaceChildren();
    const options = [{ id: "all", label: "ყველა გავლილი", title: "ყველა გავლილი თავის მასალა" }].concat(
      chapters.map((ch) => ({ id: ch.id, label: "თავი " + toRoman(ch.number), title: ch.title }))
    );
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

    const earned = xpEarnedToday();
    el.xpNote.textContent = earned >= GAMES_XP_DAILY_CAP
      ? "⚡ დღევანდელი XP-ის ლიმიტი თამაშებიდან ამოიწურა (" + GAMES_XP_DAILY_CAP + "). შეგიძლია ითამაშო რეკორდისთვის!"
      : "⚡ თამაშებით დღეს მიღებული XP: " + earned + " / " + GAMES_XP_DAILY_CAP;
  }

  el.raceStart.addEventListener("click", startRace);
  el.memoryStart.addEventListener("click", startMemory);

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

  function renderRaceQuestion(step) {
    el.raceStage.replaceChildren();
    el.raceStage.classList.remove("is-anim");
    void el.raceStage.offsetWidth; // ანიმაციის თავიდან ჩართვა
    el.raceStage.classList.add("is-anim");

    let options;
    let blank = null;

    if (step.type === "truefalse") {
      el.raceStage.append(createEl("p", "exercise__label", "სწორია თუ მცდარია?"));
      el.raceStage.append(createEl("h1", "exercise__question race-question", step.statement));
      options = [
        { text: "სწორია", correct: step.answer === true },
        { text: "მცდარია", correct: step.answer === false },
      ];
    } else if (step.type === "fill") {
      el.raceStage.append(createEl("p", "exercise__label", "შეავსე გამოტოვებული"));
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
      el.raceStage.append(sentence);
      options = shuffle(step.options.map((t, i) => ({ text: t, correct: i === step.answer })));
    } else {
      el.raceStage.append(createEl("p", "exercise__label", "აირჩიე სწორი პასუხი"));
      el.raceStage.append(createEl("h1", "exercise__question race-question", step.question));
      options = shuffle(step.options.map((t, i) => ({ text: t, correct: i === step.answer })));
    }

    const list = createEl("div", "options" + (step.type === "truefalse" ? " options--row" : step.type === "fill" ? " options--chips" : ""));
    options.forEach((opt, i) => {
      const btn = createEl("button", "option");
      btn.type = "button";
      if (step.type === "choice") btn.append(createEl("span", "option__key", String(i + 1)));
      btn.append(createEl("span", "option__text", opt.text));
      btn.addEventListener("click", () => answerRace(btn, opt, list, blank));
      if (opt.correct) race.correctBtn = btn;
      list.append(btn);
    });
    el.raceStage.append(list);
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

  /* ---------- კლავიატურა: 1–4 რბოლაში ---------- */

  document.addEventListener("keydown", (e) => {
    if (state.screen !== "race" || race.locked) return;
    const n = Number(e.key);
    if (!Number.isInteger(n) || n < 1) return;
    const buttons = el.raceStage.querySelectorAll(".option");
    if (buttons[n - 1]) buttons[n - 1].click();
  });

  /* ---------- სტარტი ---------- */

  renderHub();
  show("hub");
})();
