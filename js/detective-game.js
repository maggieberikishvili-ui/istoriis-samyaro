/* ==========================================================
   ისტორიის სამყარო — „დროში მოგზაურის დეტექტივი“ (მოსწავლე)
   ----------------------------------------------------------
   games.html-ის თამაში ცალკე ფაილში: თავს არეგისტრირებს
   window.IMS_GAME_PLUGINS-ში, games.js კი აძლევს მასალას, რეკორდს,
   XP-ს და შედეგის ეკრანს (host). დოკუმენტი — js/detective-board.js,
   საქმეები — js/detective-data.js (საერთოა მასწავლებლის გვერდთან).
   ქულა: თითო საქმეში ნაპოვნი ყალბი − ტყუილად მონიშნული.
   ========================================================== */

(function () {
  "use strict";

  const ROUNDS = 3;        // საქმე ერთ თამაშში (თუ ნაკლებია ღია — რამდენიც არის)
  const MIN_CASES = 2;

  window.IMS_GAME_PLUGINS = window.IMS_GAME_PLUGINS || [];
  window.IMS_GAME_PLUGINS.push({ id: "detective", init: init });

  function init(host) {
    const { shuffle } = window.IMS_UTILS;
    const cases = window.IMS_DETECTIVE;
    const boardApi = window.IMS_DETECTIVE_BOARD;

    const $ = (id) => document.getElementById(id);
    const el = {
      card: $("detectiveCard"),
      start: $("detectiveStart"),
      record: $("detectiveRecord"),
      round: $("detectiveRound"),
      task: $("detectiveTask"),
      doc: $("detectiveDoc"),
      evidence: $("detectiveEvidence"),
      footer: $("detectiveFooter"),
      feedback: $("detectiveFeedback"),
      feedbackIcon: $("detectiveFeedbackIcon"),
      feedbackTitle: $("detectiveFeedbackTitle"),
      feedbackText: $("detectiveFeedbackText"),
      btn: $("detectiveBtn"),
    };

    const game = { rounds: [], round: 0, board: null, checked: false, score: 0, max: 0, found: 0, wrong: 0, mistakes: [] };

    function casesInScope() {
      const ids = new Set(host.scopeLessons().map((l) => l.id));
      return cases.forCourse(host.course.id).filter((c) => ids.has(c.lesson));
    }

    function renderCard() {
      const rec = host.getRecord("detective");
      host.setCardState(
        el.card, el.start, el.record,
        casesInScope().length >= MIN_CASES,
        rec ? "🏅 რეკორდი: " + rec.score + " / " + rec.max + " · " + "★".repeat(rec.stars) : "რეკორდი ჯერ არ გაქვს — დაამყარე პირველი!",
        "🔒 ჯერ გაიარე მეტი გაკვეთილი — საქმეები ჯერ არ ჰყოფნის"
      );
    }

    function start() {
      const pool = casesInScope();
      if (pool.length < MIN_CASES) {
        host.goHub();
        return;
      }
      Object.assign(game, { rounds: shuffle(pool).slice(0, ROUNDS), round: 0, score: 0, max: 0, found: 0, wrong: 0, mistakes: [] });
      host.open("detective");
      nextCase();
    }

    function nextCase() {
      const caseData = game.rounds[game.round];
      game.round += 1;
      game.checked = false;

      el.round.textContent = game.round + " / " + game.rounds.length;
      el.feedback.hidden = true;
      el.footer.dataset.state = "idle";
      el.btn.disabled = true;

      game.board = boardApi.create({
        doc: el.doc,
        evidence: el.evidence,
        caseData: caseData,
        onChange: (marked, needed) => {
          el.task.textContent = "ამ დოკუმენტში " + needed + " ყალბი დეტალია. შეეხე საეჭვო ადგილს. მონიშნულია: " + marked + " / " + needed;
          el.btn.textContent = marked < needed ? "მონიშნე კიდევ " + (needed - marked) : "შემოწმება";
          el.btn.disabled = marked < needed;
        },
        onLimit: () => {
          el.task.textContent = "უკვე " + game.board.needed + " დეტალი მონიშნე. ჯერ მოხსენი რომელიმე (შეეხე ხელახლა).";
        },
      });
      game.caseData = caseData;
      window.scrollTo(0, 0);
    }

    function check() {
      game.checked = true;
      const r = game.board.reveal();
      game.score += r.score;
      game.max += r.needed;
      game.found += r.found;
      game.wrong += r.wrong;
      game.board.fakes().filter((p) => !game.board.isMarked(p)).forEach((p) => {
        game.mistakes.push({ question: game.caseData.title + ": „" + p.text + "“", answer: p.why });
      });

      const perfect = r.found === r.needed && r.wrong === 0;
      el.task.textContent = "საქმე „" + game.caseData.title + "“ დახურულია.";
      el.footer.dataset.state = perfect ? "correct" : "wrong";
      el.feedback.hidden = false;
      el.feedbackIcon.textContent = perfect ? "✓" : r.found ? "≈" : "✗";
      el.feedbackTitle.textContent = perfect ? "ყველა ყალბი დეტალი იპოვე!" : "ნაპოვნია " + r.found + " / " + r.needed;
      el.feedbackText.textContent = r.wrong
        ? "ტყუილი ეჭვი: " + r.wrong + " (−" + r.wrong + " ქულა). ქვემოთ — განმარტებები."
        : "ქვემოთ ნახე, რა იყო ყალბი და რატომ.";
      el.btn.textContent = game.round < game.rounds.length ? "შემდეგი საქმე" : "შედეგების ნახვა";
      el.btn.disabled = false;
    }

    function stars() {
      if (game.score >= game.max - 1) return 3;
      if (game.score >= Math.ceil(game.max * 0.6)) return 2;
      return 1;
    }

    function finish() {
      const s = stars();
      const result = { score: game.score, max: game.max, stars: s };
      const newRecord = game.score > 0 && host.saveRecord("detective", result, (a, b) => a.score > b.score);
      const xp = host.awardXp(game.score * 2);

      host.showResult({
        emblem: "★".repeat(s) + "☆".repeat(3 - s),
        title: s === 3 ? "ნამდვილი დეტექტივი!" : s === 2 ? "კარგი გამოძიებაა!" : "ყალბები ჯერ გამორბიან — სცადე კიდევ!",
        subtitle: "იპოვე " + game.found + " ყალბი დეტალი " + game.max + "-დან" + (game.wrong ? ", ტყუილი ეჭვი — " + game.wrong + "." : "."),
        newRecord: newRecord,
        stats: [
          host.statBox("ქულა", game.score + " / " + game.max, "result-stat--accuracy"),
          host.statBox("საქმე", String(game.rounds.length), "result-stat--accuracy"),
          host.statBox("XP", "+" + xp, "result-stat--xp"),
        ],
        mistakes: game.mistakes,
      });
    }

    el.start.addEventListener("click", start);
    el.btn.addEventListener("click", () => {
      if (!game.checked) {
        if (!el.btn.disabled) check();
      } else if (game.round < game.rounds.length) {
        nextCase();
      } else {
        finish();
      }
    });

    return { renderCard: renderCard, start: start };
  }
})();
