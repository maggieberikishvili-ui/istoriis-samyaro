/* ==========================================================
   ისტორიის სამყარო — „ისტორიული არჩევანი“ (მასწავლებლის რეჟიმი)
   ----------------------------------------------------------
   სცენარები — js/decide-data.js (IMS_DECIDE). კლასი ბარათზე
   ირჩევს ← ან → გზას; სკალები 0–100 (სტარტი 50). რომელიმე 0-ზე —
   სამეფო ეცემა; ბოლომდე მისვლისას: „გადარჩა“ ან „ტრიუმფი“
   (თუ ყველა სკალა ≥ TRIUMPH_MIN). ანგარიში და XP არ არის —
   ეკრანი ერთია, პროექტორზე.
   ========================================================== */

(function () {
  "use strict";

  const { createEl, toggleFullscreen, confirmAction } = window.IMS_UTILS;
  const data = window.IMS_DATA;
  const decide = window.IMS_DECIDE;
  const store = window.IMS_STORE;

  const START_VALUE = 50;
  const MAX_VALUE = 100;
  const TRIUMPH_MIN = 30;
  const LOW_VALUE = 20;      // სკალა „საშიშ ზონაშია“
  const SWIPE_LEAN = 40;     // px — ბარათი იხრება
  const SWIPE_PICK = 110;    // px — არჩევანი მიღებულია

  const SCALE_INFO = {
    economy: { icon: "💰", label: "ხაზინა" },
    army: { icon: "⚔️", label: "ლაშქარი" },
    legitimacy: { icon: "🏛️", label: "ნდობა" },
  };

  const ENDING_INFO = {
    economy: { icon: "🪙", title: "ხაზინა დაცარიელდა" },
    army: { icon: "🏳️", title: "ლაშქარი დამარცხდა" },
    legitimacy: { icon: "⚡", title: "ნდობა დაიკარგა" },
    survived: { icon: "🛡️", title: "სამეფო გადარჩა" },
    triumph: { icon: "👑", title: "ტრიუმფი!" },
  };

  const $ = (id) => document.getElementById(id);
  const el = {
    setup: $("setup"),
    courseChips: $("courseChips"),
    scenarioList: $("scenarioList"),
    play: $("play"),
    counter: $("dCounter"),
    source: $("dSource"),
    scales: $("scales"),
    introCard: $("introCard"),
    character: $("dCharacter"),
    years: $("dYears"),
    intro: $("dIntro"),
    card: $("card"),
    cardTag: $("cardTag"),
    cardWho: $("cardWho"),
    cardSituation: $("cardSituation"),
    choices: $("choices"),
    leftBtn: $("leftBtn"),
    rightBtn: $("rightBtn"),
    leftLabel: $("leftLabel"),
    rightLabel: $("rightLabel"),
    result: $("result"),
    resultChoice: $("resultChoice"),
    resultOutcome: $("resultOutcome"),
    historyBadge: $("historyBadge"),
    historyText: $("historyText"),
    hint: $("hint"),
    mainBtn: $("mainBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    exitBtn: $("exitBtn"),
    end: $("end"),
    endIcon: $("endIcon"),
    endTitle: $("endTitle"),
    endText: $("endText"),
    endScales: $("endScales"),
    endMatch: $("endMatch"),
    endReality: $("endReality"),
    endDiscussion: $("endDiscussion"),
    againBtn: $("againBtn"),
    setupBtn: $("setupBtn"),
  };

  /* ---------- მდგომარეობა ---------- */

  const courses = data.courses.filter((c) => /^grade-/.test(c.id));
  let courseId = (courses.find((c) => decide.forCourse(c.id).length) || courses[0]).id;

  let game = null;
  // game = { scenario, index, card, values, flags, phase, shown, matches, judged }
  //   phase: "intro" | "choose" | "result" | "over"

  /* ==========================================================
     სცენარის არჩევა
     ========================================================== */

  function renderCourseChips() {
    el.courseChips.replaceChildren();
    courses.forEach((c) => {
      const count = decide.forCourse(c.id).length;
      const chip = createEl("button", "t-chip", count ? c.title : c.title + " · მალე");
      chip.type = "button";
      chip.setAttribute("role", "radio");
      chip.setAttribute("aria-checked", String(c.id === courseId));
      chip.disabled = !count;
      chip.addEventListener("click", () => {
        courseId = c.id;
        renderCourseChips();
        renderScenarios();
      });
      el.courseChips.append(chip);
    });
  }

  function renderScenarios() {
    el.scenarioList.replaceChildren();
    const list = decide.forCourse(courseId);
    if (!list.length) {
      el.scenarioList.append(createEl("p", "t-block__hint", "ამ კლასისთვის სცენარი ჯერ არ არის."));
      return;
    }
    list.forEach((scenario) => {
      const item = createEl("article", "d-scenario");
      const lessons = createEl("p", "d-scenario__lessons", "გაკვეთილები: " + scenario.lessons.join(", "));
      const start = createEl("button", "btn d-scenario__start", "▶ დაწყება");
      start.type = "button";
      start.addEventListener("click", () => startGame(scenario));
      item.append(
        createEl("h3", "d-scenario__title", scenario.title),
        createEl("p", "d-scenario__who", scenario.character + " · " + scenario.years),
        createEl("p", "d-scenario__meta", "≈ " + countRounds(scenario) + " გადაწყვეტილება · 15–25 წუთი"),
        lessons,
        start
      );
      el.scenarioList.append(item);
      showLessonTitles(scenario, lessons);
    });
  }

  /** რამდენ ბარათს ხედავს კლასი ისტორიული გზით (ალტერნატიული ბარათების გარეშე). */
  function countRounds(scenario) {
    return scenario.cards.filter((c) => !c.alternative).length;
  }

  /** გაკვეთილების სათაურები (და შემოწმება, რომ ასეთი გაკვეთილები არსებობს). */
  function showLessonTitles(scenario, target) {
    data.load([scenario.course]).then(() => {
      const titles = scenario.lessons.map((id) => {
        const lesson = data.getLesson(scenario.course, id);
        if (!lesson) console.warn("IMS_DECIDE — " + scenario.id + ": გაკვეთილი " + id + " არ არსებობს");
        return lesson ? lesson.title : id;
      });
      target.textContent = "გაკვეთილები: " + titles.join(" · ");
    }, () => { /* სათაურების გარეშეც მუშაობს */ });
  }

  /* ==========================================================
     თამაში
     ========================================================== */

  function show(section) {
    el.setup.hidden = section !== "setup";
    el.play.hidden = section !== "play";
    el.end.hidden = section !== "end";
    window.scrollTo(0, 0);
  }

  function startGame(scenario) {
    const values = {};
    decide.scales.forEach((k) => { values[k] = START_VALUE; });
    game = {
      scenario: scenario,
      index: -1,
      card: null,
      values: values,
      flags: {},
      phase: "intro",
      shown: 0,
      matches: 0,
      judged: 0,
      choices: [],
    };
    el.source.textContent = scenario.title;
    renderScales(el.scales, null);
    show("play");
    renderIntro();
  }

  function renderIntro() {
    el.counter.textContent = "შესავალი";
    el.character.textContent = scenario().character;
    el.years.textContent = scenario().years;
    el.intro.textContent = scenario().intro;
    el.introCard.hidden = false;
    el.card.hidden = true;
    el.choices.hidden = true;
    el.result.hidden = true;
    el.hint.textContent = "წაიკითხეთ შესავალი ერთად.";
    setMain("▶ დავიწყოთ");
  }

  function scenario() {
    return game.scenario;
  }

  /** ბარათი ჩანს, თუ მისი პირობა სრულდება. */
  function cardAvailable(card) {
    const r = card.requires;
    if (!r) return true;
    if (r.flag && !game.flags[r.flag]) return false;
    if (r.notFlag && game.flags[r.notFlag]) return false;
    if (r.below && Object.keys(r.below).some((k) => !(game.values[k] < r.below[k]))) return false;
    if (r.atLeast && Object.keys(r.atLeast).some((k) => !(game.values[k] >= r.atLeast[k]))) return false;
    return true;
  }

  function nextCard() {
    const cards = scenario().cards;
    let i = game.index + 1;
    while (i < cards.length && !cardAvailable(cards[i])) i++;
    if (i >= cards.length) {
      finish(null);
      return;
    }
    game.index = i;
    game.card = cards[i];
    game.shown += 1;
    game.phase = "choose";
    renderCard();
  }

  function renderCard() {
    const card = game.card;
    el.counter.textContent = "გადაწყვეტილება " + game.shown;
    el.introCard.hidden = true;
    el.result.hidden = true;
    el.card.hidden = false;
    el.choices.hidden = false;
    el.card.classList.remove("is-leaning-left", "is-leaning-right", "is-gone-left", "is-gone-right");
    el.cardTag.hidden = !card.alternative;
    el.cardWho.textContent = card.who;
    el.cardSituation.textContent = card.situation;
    el.leftLabel.textContent = card.left.label;
    el.rightLabel.textContent = card.right.label;
    el.leftBtn.disabled = false;
    el.rightBtn.disabled = false;
    el.leftBtn.classList.remove("is-picked");
    el.rightBtn.classList.remove("is-picked");
    renderScales(el.scales, null);
    window.scrollTo(0, 0);
    el.hint.textContent = "იმსჯელეთ და აირჩიეთ: ← ან →";
    setMain(null);
  }

  function choose(side) {
    if (!game || game.phase !== "choose") return;
    const card = game.card;
    const option = card[side];
    game.phase = "result";
    game.choices.push({ card: card.id, side: side });

    // სკალების ცვლილება
    const deltas = {};
    decide.scales.forEach((k) => {
      const before = game.values[k];
      const after = Math.max(0, Math.min(MAX_VALUE, before + option.effects[k]));
      deltas[k] = after - before;
      game.values[k] = after;
    });
    if (option.set) game.flags[option.set] = true;
    if (card.historical) {
      game.judged += 1;
      if (card.historical === side) game.matches += 1;
    }

    // ბარათი „გაფრინდება“ არჩეულ მხარეს
    el.card.classList.remove("is-leaning-left", "is-leaning-right");
    el.card.classList.add(side === "left" ? "is-gone-left" : "is-gone-right");
    el.leftBtn.disabled = true;
    el.rightBtn.disabled = true;
    (side === "left" ? el.leftBtn : el.rightBtn).classList.add("is-picked");

    renderScales(el.scales, deltas);
    renderResult(card, side, option);
    el.result.scrollIntoView({ block: "nearest", behavior: "smooth" });

    const fallen = decide.scales.find((k) => game.values[k] <= 0);
    if (fallen) {
      game.fallen = fallen;
      setMain("დასასრული ▶");
    } else {
      setMain("შემდეგი ▶");
    }
    el.hint.textContent = "";
  }

  function renderResult(card, side, option) {
    el.result.hidden = false;
    el.resultChoice.textContent = (side === "left" ? "← " : "→ ") + option.label;
    el.resultOutcome.textContent = option.outcome;

    el.historyBadge.className = "d-history__badge";
    if (card.historical === side) {
      el.historyBadge.textContent = "✓ ისტორიული არჩევანი";
      el.historyBadge.classList.add("is-match");
    } else if (card.historical) {
      el.historyBadge.textContent = "✗ სინამდვილეში სხვა გზა აირჩიეს";
      el.historyBadge.classList.add("is-miss");
    } else {
      el.historyBadge.textContent = "";
    }
    el.historyText.textContent = card.history;
  }

  /* ---------- სკალები ---------- */

  function renderScales(container, deltas) {
    container.replaceChildren();
    decide.scales.forEach((k) => {
      const info = SCALE_INFO[k];
      const value = game.values[k];
      const item = createEl("li", "d-scale d-scale--" + k);
      if (value <= LOW_VALUE) item.classList.add("is-low");

      const head = createEl("span", "d-scale__head");
      head.append(
        createEl("span", "d-scale__icon", info.icon),
        createEl("span", "d-scale__label", info.label),
        createEl("span", "d-scale__value", String(value))
      );
      const delta = deltas && deltas[k];
      if (delta) {
        const badge = createEl("span", "d-scale__delta " + (delta > 0 ? "is-up" : "is-down"), (delta > 0 ? "+" : "−") + Math.abs(delta));
        head.append(badge);
      }

      const bar = createEl("progress", "d-scale__bar");
      bar.max = MAX_VALUE;
      bar.value = value;
      bar.setAttribute("aria-label", info.label + ": " + value + " / " + MAX_VALUE);

      item.append(head, bar);
      container.append(item);
    });
  }

  /* ---------- დასასრული ---------- */

  function finish() {
    game.phase = "over";
    const fallen = game.fallen;
    const allGood = decide.scales.every((k) => game.values[k] >= TRIUMPH_MIN);
    const key = fallen || (allGood ? "triumph" : "survived");

    el.end.dataset.ending = fallen ? "fail" : key;
    el.endIcon.textContent = ENDING_INFO[key].icon;
    el.endTitle.textContent = ENDING_INFO[key].title;
    el.endText.textContent = scenario().endings[key];
    renderScales(el.endScales, null);

    el.endMatch.textContent = game.judged
      ? "თქვენი არჩევანი ისტორიულს დაემთხვა " + game.matches + "-ჯერ " + game.judged + "-დან · მიღებულია " + game.choices.length + " გადაწყვეტილება"
      : "მიღებულია " + game.choices.length + " გადაწყვეტილება";
    el.endReality.textContent = scenario().reality;

    el.endDiscussion.replaceChildren();
    (scenario().discussion || []).forEach((q) => el.endDiscussion.append(createEl("li", "d-discuss__item", q)));

    show("end");
  }

  /* ---------- მთავარი ღილაკი ---------- */

  function setMain(text) {
    el.mainBtn.hidden = !text;
    if (text) el.mainBtn.textContent = text;
  }

  function advance() {
    if (!game) return;
    if (game.phase === "intro") nextCard();
    else if (game.phase === "result") {
      if (game.fallen) finish();
      else nextCard();
    }
  }

  el.mainBtn.addEventListener("click", advance);
  el.leftBtn.addEventListener("click", () => choose("left"));
  el.rightBtn.addEventListener("click", () => choose("right"));

  // ღილაკზე მიტანისას ბარათი შესაბამის მხარეს იხრება
  [["left", el.leftBtn], ["right", el.rightBtn]].forEach(([side, btn]) => {
    const lean = () => { if (game && game.phase === "choose") setLean(side); };
    const unlean = () => { if (game && game.phase === "choose") setLean(null); };
    btn.addEventListener("pointerenter", lean);
    btn.addEventListener("focus", lean);
    btn.addEventListener("pointerleave", unlean);
    btn.addEventListener("blur", unlean);
  });

  function setLean(side) {
    el.card.classList.toggle("is-leaning-left", side === "left");
    el.card.classList.toggle("is-leaning-right", side === "right");
  }

  /* ---------- გადასმა (თითით ან მაუსით) ---------- */

  let drag = null;

  el.card.addEventListener("pointerdown", (e) => {
    if (!game || game.phase !== "choose") return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    el.card.setPointerCapture(e.pointerId);
  });

  el.card.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    setLean(dx <= -SWIPE_LEAN ? "left" : dx >= SWIPE_LEAN ? "right" : null);
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag = null;
    if (Math.abs(dx) >= SWIPE_PICK && Math.abs(dx) > Math.abs(dy)) choose(dx < 0 ? "left" : "right");
    else setLean(null);
  }

  el.card.addEventListener("pointerup", endDrag);
  el.card.addEventListener("pointercancel", endDrag);

  /* ---------- კლავიატურა (პროექტორთან) ---------- */

  document.addEventListener("keydown", (e) => {
    if (el.play.hidden || !game) return;
    if (e.key === "ArrowLeft" && game.phase === "choose") {
      e.preventDefault();
      choose("left");
    } else if (e.key === "ArrowRight" && game.phase === "choose") {
      e.preventDefault();
      choose("right");
    } else if ((e.key === "Enter" || e.key === " ") && game.phase !== "choose") {
      // ღილაკზე ფოკუსისას Enter/Space თავად ღილაკს აჭერს
      // (ისრები აქ არ მუშაობს — ორმაგი დაჭერით „სინამდვილეში“ არ გამოგრჩეს)
      if (e.target.tagName === "BUTTON" || e.target.tagName === "A") return;
      e.preventDefault();
      advance();
    }
  });

  /* ---------- დანარჩენი ღილაკები ---------- */

  el.fullscreenBtn.addEventListener("click", toggleFullscreen);

  el.exitBtn.addEventListener("click", () => {
    const leave = () => {
      game = null;
      show("setup");
    };
    if (!game || game.phase === "over") return leave();
    confirmAction({ title: "დავასრულოთ თამაში?", text: "სცენარი შეწყდება.", ok: "დიახ, დავასრულოთ", cancel: "არა" }).then((ok) => { if (ok) leave(); });
  });

  el.againBtn.addEventListener("click", () => startGame(scenario()));
  el.setupBtn.addEventListener("click", () => {
    game = null;
    show("setup");
  });

  if (store && store.bindThemeToggle) store.bindThemeToggle($("themeToggle"));

  renderCourseChips();
  renderScenarios();
})();
