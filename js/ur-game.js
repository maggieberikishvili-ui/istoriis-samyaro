/* ==========================================================
   Edubba — „ურის სამეფო თამაში“ (მოსწავლე, games.html)
   ----------------------------------------------------------
   ძველი მესოპოტამიური სამაგიდო თამაში კომპიუტერთან ან მეგობართან.
   პლაგინი: თავს არეგისტრირებს window.IMS_GAME_PLUGINS-ში (იხ. games.js).
   იხსნება, როცა მოსწავლე ამ კლასში პირველ ბლოკს დაასრულებს
   (ქვეთავს; თუ თავს ქვეთავები არ აქვს — მთელ თავს). ფირფიტების ლაჟვარდი
   კლასის პროცენტით ემატება (საგანძური, js/treasure.js).
   სტილი — css/ur.css, ფერები — css/variables.css (--ur-*).

   გეომეტრია: ზოლი (lane) 0 — კომპიუტერი, 1 — საერთო, 2 — შენ; idx 0–7 ზოლის გასწვრივ.
   ქვის პოზიცია: 0 — სახლში, 1–14 — დაფაზე, 15 — ფინიშში.
   ========================================================== */

(function () {
  "use strict";

  window.IMS_GAME_PLUGINS = window.IMS_GAME_PLUGINS || [];
  window.IMS_GAME_PLUGINS.push({ id: "ur", init: init });

  const NS = "http://www.w3.org/2000/svg";
  const PIECES = 7;
  const FINISH = 15;
  const HOME_IDX = 4;
  const FIN_IDX = 5;
  const ROSETTES = [4, 8, 14];          // ვარდულები შენი გზის ნომრებით
  const XP_WIN = 15;                    // მოგება კომპიუტერთან
  const XP_PLAY = 5;                    // დასრულებული თამაში (წაგებაც ითვლება)
  // ფირფიტების ორნამენტი (ზოლის გასწვრივ); null — სახლი/ფინიში
  const SIDE = ["rosette", "eyes", "circles", "eyes", null, null, "rosette", "diamond"];
  const MID = ["grid", "circles", "eyes", "rosette", "grid", "diamond", "eyes", "grid"];
  // მორთულობის დონე (0 — მხოლოდ კვეთა, 1 — ნაწილობრივ ლაჟვარდი, 2 — სრულად)
  // საგანძურიდან მოდის: კლასის 25% → 1, 100% → 2 (IMS_TREASURE.urDecoLevel).
  let DECO = 0;

  const laneOf = (p) => (p === "me" ? 2 : 0);
  const other = (p) => (p === "me" ? "ai" : "me");
  const shared = (pos) => pos >= 5 && pos <= 12;

  function spot(p, pos) {
    if (pos === 0) return [laneOf(p), HOME_IDX];
    if (pos === FINISH) return [laneOf(p), FIN_IDX];
    if (pos <= 4) return [laneOf(p), 4 - pos];
    if (pos <= 12) return [1, pos - 5];
    return [laneOf(p), 20 - pos];
  }

  /* ---------- ფირფიტების ორნამენტი (ფოტოს მოტივებით, ჩვენი ნახატი) ---------- */
  function art(kind) {
    let h = "";
    if (kind === "rosette") {
      h += '<circle class="ur-ln" cx="20" cy="20" r="17.5"/>';
      for (let a = 0; a < 360; a += 45) {
        h += '<path class="ur-bl" d="M20 20 C16.6 15 17 8 20 3.6 C23 8 23.4 15 20 20Z" transform="rotate(' + a + ' 20 20)"/>';
      }
      for (let a = 22.5; a < 360; a += 45) h += '<circle class="ur-br" cx="20" cy="5.2" r="1" transform="rotate(' + a + ' 20 20)"/>';
      h += '<circle class="ur-wh" cx="20" cy="20" r="4.2"/><circle class="ur-ln" cx="20" cy="20" r="4.2"/><circle class="ur-br" cx="20" cy="20" r="1.6"/>';
    } else if (kind === "eyes") {
      h += '<path class="ur-ln ur-ln--thin" d="M4 4 L36 36 M36 4 L4 36 M20 3 L37 20 L20 37 L3 20 Z"/>';
      [[9, 9], [31, 9], [20, 20], [9, 31], [31, 31]].forEach(([x, y]) => {
        h += '<circle class="ur-wh" cx="' + x + '" cy="' + y + '" r="5"/><circle class="ur-ln" cx="' + x + '" cy="' + y + '" r="5"/>' +
          '<circle class="ur-bl" cx="' + x + '" cy="' + y + '" r="2.4"/>';
      });
    } else if (kind === "circles") {
      [[11, 11, 6], [29, 12, 5], [12, 29, 5], [28, 28, 6.5], [20, 20, 2.6]].forEach(([x, y, r]) => {
        h += '<circle class="ur-ln" cx="' + x + '" cy="' + y + '" r="' + r + '"/><circle class="ur-br" cx="' + x + '" cy="' + y + '" r="' + Math.max(1.1, r * 0.28) + '"/>';
        if (r > 4) {
          for (let a = 0; a < 360; a += 60) h += '<circle class="ur-bl" cx="' + x + '" cy="' + (y - r - 2) + '" r=".9" transform="rotate(' + a + " " + x + " " + y + ')"/>';
        }
      });
    } else if (kind === "diamond") {
      h += '<path class="ur-ln" d="M20 3 L23 6 L23 9 L26 9 L26 12 L29 12 L29 15 L32 15 L32 18 L35 20 L32 22 L32 25 L29 25 L29 28 L26 28 L26 31 L23 31 L23 34 L20 37 L17 34 L17 31 L14 31 L14 28 L11 28 L11 25 L8 25 L8 22 L5 20 L8 18 L8 15 L11 15 L11 12 L14 12 L14 9 L17 9 L17 6 Z"/>';
      h += '<path class="ur-ln ur-ln--thin" d="M20 11 L29 20 L20 29 L11 20 Z"/>';
      [[20, 15], [25, 20], [20, 25], [15, 20]].forEach(([x, y]) => { h += '<circle class="ur-bl" cx="' + x + '" cy="' + y + '" r="1.8"/>'; });
      h += '<circle class="ur-br" cx="20" cy="20" r="1.8"/>';
      [[6, 6], [34, 6], [6, 34], [34, 34]].forEach(([x, y]) => { h += '<circle class="ur-br" cx="' + x + '" cy="' + y + '" r="1.4"/>'; });
    } else if (kind === "grid") {
      h += '<rect class="ur-ln" x="4" y="4" width="32" height="32"/>';
      for (let k = 1; k < 4; k++) h += '<path class="ur-ln ur-ln--thin" d="M' + (4 + k * 8) + " 4 V36 M4 " + (4 + k * 8) + ' H36"/>';
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const odd = (i + j) % 2;
          h += '<circle class="' + (odd ? "ur-br" : "ur-bl") + '" cx="' + (8 + i * 8) + '" cy="' + (8 + j * 8) + '" r="' + (odd ? 1.3 : 2) + '"/>';
        }
      }
    }
    return h;
  }

  function patSvg(lane, idx) {
    const kind = lane === 1 ? MID[idx] : SIDE[idx];
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 40 40");
    svg.setAttribute("aria-hidden", "true");
    const inlaid = DECO === 2 || (DECO === 1 && (kind === "rosette" || (lane + idx) % 2 === 0));
    svg.setAttribute("class", "ur-pat" + (inlaid ? "" : " ur-plain"));
    svg.innerHTML = art(kind);
    return svg;
  }

  /* კამათელი — ლაჟვარდის ოთხწახნაგა ქვა; on — თეთრი წვერი ზემოთაა */
  function dieArt(on) {
    let h = '<path class="ur-dl" d="M15 2 L2 26 L15 22 Z"/><path class="ur-dr" d="M15 2 L28 26 L15 22 Z"/>' +
      '<path class="ur-shine" d="M13.2 6.5 L6 20"/>' +
      '<circle class="ur-fleck" cx="9" cy="19" r=".7"/><circle class="ur-fleck" cx="12" cy="15" r=".5"/><circle class="ur-fleck" cx="20" cy="18" r=".6"/>';
    if (on) h += '<path class="ur-tip" d="M15 2 L9.6 12 L15 10.4 L20.4 12 Z"/>';
    return h;
  }

  /* ==========================================================
     პლაგინი
     ========================================================== */

  function init(host) {
    const store = window.IMS_STORE;
    const $ = (id) => document.getElementById(id);
    const el = {
      card: $("urCard"),
      start: $("urStart"),
      record: $("urRecord"),
      screen: $("ur"),
      table: $("urTable"),
      frame: $("urFrame"),
      board: $("urBoard"),
      whoMe: $("urWhoMe"),
      whoAi: $("urWhoAi"),
      nameMe: $("urNameMe"),
      nameAi: $("urNameAi"),
      scoreMe: $("urScoreMe"),
      scoreAi: $("urScoreAi"),
      dock: $("urDock"),
      hint: $("urHint"),
      hintBig: $("urHintBig"),
      hintSmall: $("urHintSmall"),
      dice: $("urDice"),
      dsum: $("urDsum"),
      roll: $("urRoll"),
      pop: $("urPop"),
      howto: $("urHowto"),
      howtoGo: $("urHowtoGo"),
      helpBtn: $("urHelpBtn"),
      setBtn: $("urSetBtn"),
      settings: $("urSettings"),
      modeAi: $("urModeAi"),
      modePvp: $("urModePvp"),
      routeChip: $("urRouteChip"),
      slowChip: $("urSlowChip"),
      newChip: $("urNewChip"),
      howRose: $("urHowRose"),
      howDie: $("urHowDie"),
    };

    const S = {
      me: [], ai: [], turn: "me", roll: null, dice: null, busy: false, over: false,
      mode: "ai", route: true, slow: true, moving: null, aiPick: null, aiLast: null,
      token: 0, // იზრდება ყოველ ახალ თამაშზე/გასვლაზე — ძველი ანიმაციები ჩერდება
    };
    let horiz = true;

    const human = (p) => p === "me" || S.mode === "pvp";
    const vsAi = () => S.mode === "ai";

    /** პაუზა, რომელიც აღარ „იღვიძებს“, თუ მოთამაშე თამაშიდან გავიდა ან თავიდან დაიწყო. */
    function sleep(ms) {
      const token = S.token;
      return new Promise((resolve) => {
        setTimeout(() => { if (token === S.token) resolve(); }, ms);
      });
    }
    const aiWait = (ms) => sleep(S.slow ? ms : ms * 0.5);

    /* ---------- გახსნა: პირველი დასრულებული ბლოკი (js/treasure.js) ---------- */

    function unlocked() {
      return window.IMS_TREASURE.firstBlockDone(host.course, store.loadProfile());
    }

    function renderCard() {
      const rec = host.getRecord("ur");
      const hasSections = host.course.chapters.some((ch) => (ch.sections || []).length);
      host.setCardState(
        el.card, el.start, el.record,
        unlocked(),
        rec && rec.played
          ? "🏆 კომპიუტერთან მოგება: " + rec.wins + " / " + rec.played
          : "ჯერ არ გითამაშია — სცადე, მოუგებ კომპიუტერს?",
        "🔒 დაასრულე პირველი " + (hasSections ? "ქვეთავი" : "თავი") + " — და თამაში გაიხსნება"
      );
    }

    /* ---------- ზომა: დაფა ეკრანზე ეტევა ---------- */

    function fit() {
      if (el.screen.hidden) return;
      const W = Math.min(el.screen.clientWidth, 1100) - 32;
      horiz = window.innerWidth >= 700;
      const gap = horiz ? 7 : 5;
      const top = el.frame.getBoundingClientRect().top + window.scrollY;
      const freeH = window.innerHeight - el.dock.offsetHeight - top - 70;
      // ჩარჩოს სისქე ≈ 0.16 × ფირფიტა ორივე მხარეს
      let sq = horiz
        ? Math.min((W - 7 * gap) / 8.32, (freeH - 2 * gap) / 3.32, 118)
        : Math.min((W - 2 * gap) / 3.32, (freeH - 7 * gap) / 8.32, 96);
      sq = Math.max(sq, horiz ? 54 : 46);
      el.screen.style.setProperty("--ur-sq", Math.floor(sq) + "px");
      el.screen.style.setProperty("--ur-gap", gap + "px");
      el.board.classList.toggle("is-vertical", !horiz);
      render();
    }

    const gridPos = (lane, idx) => (horiz ? { row: lane + 1, col: idx + 1 } : { row: idx + 1, col: lane + 1 });

    /* ---------- თამაშის მდგომარეობა ---------- */

    function reset() {
      S.token += 1;
      S.me = Array(PIECES).fill(0);
      S.ai = Array(PIECES).fill(0);
      Object.assign(S, { turn: "me", roll: null, dice: null, busy: false, over: false, moving: null, aiPick: null, aiLast: null });
      el.pop.classList.remove("is-show");
      drawDice();
      hint();
      render();
    }

    function legalMoves(p, roll) {
      if (!roll) return [];
      const mine = S[p];
      const theirs = S[other(p)];
      const seen = new Set();
      const out = [];
      mine.forEach((pos, i) => {
        if (pos === FINISH || seen.has(pos)) return;
        const to = pos + roll;
        if (to > FINISH) return;                          // ფინიშში — მხოლოდ ზუსტი რიცხვით
        if (to < FINISH && mine.includes(to)) return;     // საკუთარ ქვაზე ვერ დადგები
        if (to === 8 && theirs.includes(8)) return;       // შუა ვარდული დაცულია
        seen.add(pos);
        out.push({ i: i, from: pos, to: to });
      });
      return out;
    }

    const NAME = (p) => (p === "me" ? (vsAi() ? "შენ" : "ლაჟვარდისფერი") : (vsAi() ? "კომპიუტერი" : "ლალისფერი"));

    /* ---------- მინიშნება ---------- */

    function say(big, small, ai) {
      el.hintBig.textContent = big;
      el.hintSmall.textContent = small || "";
      el.hint.classList.toggle("is-ai", Boolean(ai));
    }

    function hint() {
      const p = S.turn;
      if (S.over) {
        const meWon = S.me.every((x) => x === FINISH);
        say(vsAi() ? (meWon ? "🏆 შენ მოიგე!" : "ამჯერად კომპიუტერმა მოიგო") : (meWon ? "🏆 ლაჟვარდისფერმა მოიგო!" : "🏆 ლალისფერმა მოიგო!"), "");
      } else if (!human(p)) {
        say("🤖 კომპიუტერის ჯერია…", "", true);
      } else if (S.roll === null) {
        say(vsAi() ? "🎲 შენი ჯერია" : p === "me" ? "🔵 ლაჟვარდისფრის ჯერია" : "🔴 ლალისფრის ჯერია", "დააჭირე „აგდებას“.");
      } else {
        const n = S.roll;
        const moves = legalMoves(p, n);
        if (n === 0) say("0 გამოვიდა 😕", "ვერცერთ კამათელს არ აქვს თეთრი წვერი ზემოთ — ჯერი გადადის.");
        else if (!moves.length) say(n + " გამოვიდა, მაგრამ სვლა არ არის", "ყველა გზა ჩაკეტილია — ჯერი გადადის.");
        else {
          say("გამოვიდა " + n + " → " + n + " უჯრა",
            moves.length === 1 && moves[0].from === 0
              ? "დააჭირე მოციმციმე ქვას „სახლში“ — ის დაფაზე შევა."
              : "დააჭირე მოციმციმე ქვას — ის მწვანე რგოლამდე წავა.");
        }
      }
    }

    async function pop(text, sub, ms) {
      el.pop.replaceChildren(text);
      if (sub) el.pop.append(window.IMS_UTILS.createEl("small", null, sub));
      el.pop.classList.add("is-show");
      await sleep(ms || 1300);
      el.pop.classList.remove("is-show");
      await sleep(200);
    }

    /* ---------- კამათლები ---------- */

    function drawDice(tumble) {
      el.dice.replaceChildren();
      for (let k = 0; k < 4; k++) {
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", "0 0 30 28");
        svg.setAttribute("class", "ur-die" + (tumble && k % 2 ? " is-tumble" : ""));
        svg.innerHTML = dieArt(Boolean(S.dice && S.dice[k]));
        el.dice.append(svg);
      }
      el.dsum.textContent = S.roll === null ? "" : "= " + S.roll;
      el.dice.setAttribute("aria-label", S.roll === null ? "კამათლები" : "გამოვიდა " + S.roll);
    }

    const throwOne = () => Array.from({ length: 4 }, () => (Math.random() < 0.5 ? 1 : 0));

    async function throwDice() {
      for (let k = 0; k < 6; k++) {
        S.dice = throwOne();
        S.roll = null;
        drawDice(k % 2);
        await sleep(70);
      }
      S.dice = throwOne();
      S.roll = S.dice.reduce((a, b) => a + b, 0);
      drawDice();
    }

    /* ---------- სვლა ---------- */

    async function onRoll() {
      if (S.over) { reset(); return; }
      if (S.busy || S.roll !== null || !human(S.turn)) return;
      S.busy = true;
      S.aiLast = null;
      render();
      await throwDice();
      S.busy = false;
      hint();
      render();
      if (!legalMoves(S.turn, S.roll).length) {
        S.busy = true;
        render();
        await sleep(1600);
        S.busy = false;
        endTurn(false);
      }
    }

    async function move(p, mv) {
      S.busy = true;
      S.moving = { p: p, i: mv.i };
      const stepMs = p === "ai" && vsAi() ? (S.slow ? 420 : 240) : 200;
      for (let pos = mv.from + 1; pos <= mv.to; pos++) {
        S[p][mv.i] = pos;
        render();
        await sleep(stepMs);
      }
      S.moving = null;

      const events = [];
      if (shared(mv.to)) {
        const opp = S[other(p)];
        const j = opp.indexOf(mv.to);
        if (j !== -1) {
          opp[j] = 0;
          if (vsAi()) {
            events.push(p === "me" ? ["💥 დაარტყი!", "კომპიუტერის ქვა სახლში დაბრუნდა."] : ["😮 შენი ქვა სახლში დაბრუნდა", "არაუშავს — ხელახლა შეიყვან."]);
          } else {
            events.push(["💥 დარტყმა!", "ქვა სახლში დაბრუნდა."]);
          }
        }
      }
      if (mv.to === FINISH) {
        const left = S[p].filter((x) => x !== FINISH).length;
        events.push(["🏁 ქვა მივიდა ბოლომდე!", left ? "კიდევ " + left + " დარჩა." : ""]);
      }
      const rosette = ROSETTES.includes(mv.to);
      if (rosette) events.push(["✿ ვარდული!", human(p) ? "კიდევ ერთხელ ააგდებ." : NAME(p) + " კიდევ ერთხელ აგდებს."]);
      S.roll = null;
      render();
      for (const [t, s] of events) await pop(t, s);

      if (S[p].every((x) => x === FINISH)) {
        S.over = true;
        S.busy = false;
        hint();
        render();
        await sleep(1400);
        finish();
        return;
      }
      if (p === "ai" && vsAi()) await aiWait(900);
      S.busy = false;
      endTurn(rosette);
    }

    function pick(mv) {
      if (!S.busy && human(S.turn) && S.roll) move(S.turn, mv);
    }

    function endTurn(again) {
      if (S.over) return;
      if (!again) S.turn = other(S.turn);
      S.roll = null;
      S.dice = null;
      drawDice();
      hint();
      render();
      if (!human(S.turn)) aiTurn();
    }

    /* ---------- კომპიუტერი ---------- */

    function score(mv) {
      const opp = S.me;
      let s = mv.to;
      if (mv.to === FINISH) s += 30;
      if (ROSETTES.includes(mv.to)) s += 25;
      if (shared(mv.to) && opp.includes(mv.to)) s += 40;
      if (shared(mv.from) && mv.from !== 8) s += 8;
      if (mv.from === 8) s -= 15;
      if (shared(mv.to) && mv.to !== 8 && opp.some((o) => o > 0 && o < mv.to && mv.to - o <= 4)) s -= 12;
      return s + Math.random() * 3;
    }

    async function aiTurn() {
      S.busy = true;
      S.aiLast = null;
      render();
      say("🤖 კომპიუტერის ჯერია", "", true);
      await aiWait(1000);
      await throwDice();
      render();
      const moves = legalMoves("ai", S.roll);
      say("🤖 კომპიუტერს გამოუვიდა " + S.roll, "", true);
      if (!moves.length) {
        await aiWait(1800);
        await pop(S.roll === 0 ? "🤖 0 გამოუვიდა" : "🤖 სვლა ვერ გააკეთა", "ახლა შენი ჯერია!");
        S.busy = false;
        endTurn(false);
        return;
      }
      await aiWait(1300);
      const mv = moves.sort((a, b) => score(b) - score(a))[0];
      S.aiPick = { from: spot("ai", mv.from), to: spot("ai", mv.to) };
      render();
      await aiWait(1700);
      S.aiPick = null;
      S.aiLast = { from: spot("ai", mv.from), to: mv.to === FINISH ? null : spot("ai", mv.to) };
      await move("ai", mv);
    }

    /* ---------- შედეგი ---------- */

    function finish() {
      const meWon = S.me.every((x) => x === FINISH);
      const mine = S.me.filter((x) => x === FINISH).length;
      const theirs = S.ai.filter((x) => x === FINISH).length;
      let xp = 0;
      if (vsAi()) {
        const prev = host.getRecord("ur") || { wins: 0, played: 0 };
        host.saveRecord("ur", { wins: prev.wins + (meWon ? 1 : 0), played: prev.played + 1 }, () => true);
        xp = host.awardXp(meWon ? XP_WIN : XP_PLAY);
        if (meWon) window.IMS_BEADS.give("u1"); // პირველი მოგება კომპიუტერთან → მძივი (მეორედ აღარ ემატება)
      }
      const rec = host.getRecord("ur");
      host.showResult({
        emblem: meWon ? "🏆" : vsAi() ? "🎲" : "🏆",
        title: vsAi() ? (meWon ? "შენ მოიგე!" : "ამჯერად კომპიუტერმა მოიგო") : (meWon ? "ლაჟვარდისფერმა მოიგო!" : "ლალისფერმა მოიგო!"),
        subtitle: vsAi()
          ? (meWon ? "ურის მეფეც მოგილოცავდა! " : "არაუშავს — ამ თამაშში იღბალიც ბევრს წყვეტს. ") + "ბოლომდე მიიყვანე " + mine + " ქვა " + PIECES + "-დან."
          : "ლაჟვარდისფერი: " + mine + " / " + PIECES + " · ლალისფერი: " + theirs + " / " + PIECES,
        newRecord: false,
        stats: vsAi()
          ? [
              host.statBox("შენი ქვები", mine + " / " + PIECES, "result-stat--accuracy"),
              host.statBox("მოგება", rec ? rec.wins + " / " + rec.played : "—", "result-stat--accuracy"),
              host.statBox("XP", "+" + xp, "result-stat--xp"),
            ]
          : [
              host.statBox("ლაჟვარდისფერი", mine + " / " + PIECES, "result-stat--accuracy"),
              host.statBox("ლალისფერი", theirs + " / " + PIECES, "result-stat--accuracy"),
            ],
        mistakes: [],
      });
    }

    /* ---------- ხატვა ---------- */

    function piece(p, extra) {
      return window.IMS_UTILS.createEl("span", "ur-pc ur-pc--" + p + (extra ? " " + extra : ""));
    }

    function render() {
      const { createEl } = window.IMS_UTILS;
      el.board.replaceChildren();
      const moves = S.roll && human(S.turn) && !S.busy ? legalMoves(S.turn, S.roll) : [];
      const at = (key, lane, idx) => moves.filter((m) => {
        const [l, i] = spot(S.turn, m[key]);
        return l === lane && i === idx;
      });
      const same = (a, lane, idx) => a && a[0] === lane && a[1] === idx;

      for (let lane = 0; lane < 3; lane++) {
        for (let idx = 0; idx < 8; idx++) {
          const d = createEl("div", "ur-cell");
          if (lane !== 1 && (idx === HOME_IDX || idx === FIN_IDX)) {
            const p = lane === 2 ? "me" : "ai";
            if (idx === HOME_IDX) {
              const waiting = S[p].filter((x) => x === 0).length;
              d.classList.add("ur-home");
              if (waiting) {
                const stack = createEl("span", "ur-stack");
                stack.append(piece(p));
                d.append(stack);
              }
              d.append(createEl("span", "ur-lbl", "სახლი"));
              if (waiting) d.append(createEl("span", "ur-badge", String(waiting)));
              d.setAttribute("aria-label", NAME(p) + ": სახლში " + waiting + " ქვა");
            } else {
              const done = S[p].filter((x) => x === FINISH).length;
              d.classList.add("ur-fin");
              d.append(createEl("span", "ur-flag", "🏁"), createEl("span", "ur-lbl", done + "/" + PIECES));
              d.setAttribute("aria-label", NAME(p) + ": ფინიშში " + done + " ქვა");
            }
          } else {
            d.classList.add("ur-sq");
            d.append(patSvg(lane, idx));
            if (S.route) {
              for (let pos = 1; pos <= 14; pos++) {
                if (same(spot("me", pos), lane, idx)) d.append(createEl("span", "ur-num", String(pos)));
              }
            }
            ["me", "ai"].forEach((p) => S[p].forEach((pos, i) => {
              if (pos < 1 || pos > 14) return;
              if (same(spot(p, pos), lane, idx)) {
                d.append(piece(p, S.moving && S.moving.p === p && S.moving.i === i ? "is-moving" : ""));
              }
            }));
          }

          if (S.aiPick) {
            if (same(S.aiPick.from, lane, idx)) d.classList.add("is-aipick");
            if (same(S.aiPick.to, lane, idx)) d.classList.add("is-aidest");
          }
          if (S.aiLast && !S.busy) {
            if (same(S.aiLast.from, lane, idx) && idx !== HOME_IDX) d.classList.add("is-ailast-from");
            if (same(S.aiLast.to, lane, idx)) d.classList.add("is-ailast-to");
          }

          const src = at("from", lane, idx);
          const dst = at("to", lane, idx);
          const mv = src[0] || dst[0];
          if (mv) {
            d.classList.add(src.length ? "is-can" : "is-dest");
            d.tabIndex = 0;
            d.setAttribute("role", "button");
            d.setAttribute("aria-label", src.length ? "ეს ქვა წაიყვანე " + S.roll + " უჯრით" : "ქვა აქ წავა");
            d.addEventListener("click", () => pick(mv));
            d.addEventListener("keydown", (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pick(mv);
              }
            });
          }

          const { row, col } = gridPos(lane, idx);
          d.classList.add("ur-r" + row, "ur-c" + col);
          el.board.append(d);
        }
      }
      if (S.route) drawRoute();

      ["me", "ai"].forEach((p) => {
        const box = p === "me" ? el.scoreMe : el.scoreAi;
        box.replaceChildren();
        S[p].slice().sort((a, c) => c - a).forEach((pos) => box.append(createEl("i", pos === FINISH ? "is-got" : null)));
        box.append(" " + S[p].filter((x) => x === FINISH).length + "/" + PIECES);
      });
      el.whoMe.classList.toggle("is-turn", S.turn === "me" && !S.over);
      el.whoAi.classList.toggle("is-turn", S.turn === "ai" && !S.over);
      el.nameAi.textContent = NAME("ai");
      el.nameMe.textContent = NAME("me");

      const canRoll = S.over || (!S.busy && S.roll === null && human(S.turn));
      el.roll.disabled = !canRoll;
      el.roll.classList.toggle("is-pulse", canRoll);
      el.roll.textContent = S.over ? "↺ ახალი თამაში" : "🎲 აგდება";
    }

    function drawRoute() {
      const cs = getComputedStyle(el.screen);
      const sq = parseFloat(cs.getPropertyValue("--ur-sq"));
      const gap = parseFloat(cs.getPropertyValue("--ur-gap"));
      const c = (lane, idx) => {
        const { row, col } = gridPos(lane, idx);
        return [(col - 1) * (sq + gap) + sq / 2, (row - 1) * (sq + gap) + sq / 2];
      };
      const pts = [c(2, HOME_IDX)];
      for (let pos = 1; pos <= 14; pos++) pts.push(c(...spot("me", pos)));
      pts.push(c(2, FIN_IDX));

      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "ur-route");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("viewBox", "0 0 " + el.board.offsetWidth + " " + el.board.offsetHeight);
      let h = '<path d="M' + pts.map((pt) => pt.join(" ")).join(" L") + '"/>';
      [[0, 1], [4, 5], [12, 13], [14, 15]].forEach(([a, z]) => {
        const [x1, y1] = pts[a];
        const [x2, y2] = pts[z];
        const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        const s = Math.max(8, sq * 0.13);
        h += '<path class="ur-arr" d="M' + s + " 0 L" + -s + " " + -s * 0.8 + " L" + -s + " " + s * 0.8 +
          ' Z" transform="translate(' + (x1 + x2) / 2 + " " + (y1 + y2) / 2 + ") rotate(" + ang + ')"/>';
      });
      svg.innerHTML = h;
      el.board.append(svg);
    }

    /* ---------- მართვა ---------- */

    function setChip(btn, on) {
      btn.setAttribute("aria-pressed", String(on));
    }

    function setMode(mode) {
      S.mode = mode;
      setChip(el.modeAi, mode === "ai");
      setChip(el.modePvp, mode === "pvp");
      reset();
    }

    function start() {
      if (!unlocked()) {
        host.goHub();
        return;
      }
      host.open("ur");
      DECO = window.IMS_TREASURE.urDecoLevel(host.course, store.loadProfile());
      el.settings.hidden = true;
      reset();
      window.requestAnimationFrame(fit);
      // „როგორ ვითამაშო?“ — პირველ თამაშამდე
      const rec = host.getRecord("ur");
      el.howto.hidden = Boolean(rec && rec.played);
    }

    el.start.addEventListener("click", start);
    el.roll.addEventListener("click", onRoll);
    el.helpBtn.addEventListener("click", () => { el.howto.hidden = false; el.howtoGo.focus(); });
    el.howtoGo.addEventListener("click", () => { el.howto.hidden = true; });
    el.setBtn.addEventListener("click", () => {
      el.settings.hidden = !el.settings.hidden;
      el.setBtn.setAttribute("aria-expanded", String(!el.settings.hidden));
      fit();
    });
    el.newChip.addEventListener("click", reset);
    el.modeAi.addEventListener("click", () => setMode("ai"));
    el.modePvp.addEventListener("click", () => setMode("pvp"));
    el.slowChip.addEventListener("click", () => { S.slow = !S.slow; setChip(el.slowChip, S.slow); });
    el.routeChip.addEventListener("click", () => { S.route = !S.route; setChip(el.routeChip, S.route); render(); });
    // თამაშიდან გასვლა (✕) — კომპიუტერის დაწყებული სვლა ჩერდება
    el.screen.querySelector(".games-exit").addEventListener("click", () => { S.token += 1; });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !el.howto.hidden) el.howto.hidden = true;
    });
    window.addEventListener("resize", fit);

    el.howRose.innerHTML = art("rosette");
    el.howDie.innerHTML = dieArt(true);

    return { renderCard: renderCard, start: start };
  }
})();
