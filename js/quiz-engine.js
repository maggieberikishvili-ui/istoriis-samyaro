/* ==========================================================
   ისტორიის სამყარო — გუნდური ვიქტორინის ძრავა
   ----------------------------------------------------------
   მხოლოდ ლოგიკა, DOM-ის გარეშე: კითხვების შეგროვება
   გაკვეთილებიდან და თამაშის მდგომარეობა (state).
   state უბრალო JSON-ობიექტია — მომავალში შეიძლება სერვერზე
   შეინახოს ან მოსწავლეების ტელეფონებს გაეგზავნოს, ამიტომ
   ფუნქციები state-ს არ ცვლის, ახალს აბრუნებს.

   კითხვა (ნორმალიზებული):
     { id, kind: "choice" | "truefalse", prompt, options: [..],
       correct: index, explanation, source: "გაკვეთილის სათაური" }
   ========================================================== */

(function () {
  "use strict";

  const { shuffle } = window.IMS_UTILS;

  const POINTS_PER_CORRECT = 100;
  const TRUE_FALSE_OPTIONS = ["სწორია", "მცდარია"];

  /** ვარიანტების არევა ისე, რომ სწორი პასუხის ინდექსი არ დაიკარგოს. */
  function shuffleOptions(options, answer) {
    const order = shuffle(options.map((_, i) => i));
    return {
      options: order.map((i) => options[i]),
      correct: order.indexOf(answer),
    };
  }

  /** გაკვეთილის ერთი ნაბიჯი → ვიქტორინის კითხვა (ან null, თუ ტიპი არ გამოდგება). */
  function normalizeStep(step, lesson, k) {
    const base = { id: lesson.id + "#" + k, source: lesson.title, explanation: step.explanation || "" };

    if (step.type === "choice" && Array.isArray(step.options)) {
      return Object.assign(base, { kind: "choice", prompt: step.question },
        shuffleOptions(step.options, step.answer));
    }
    if (step.type === "fill" && Array.isArray(step.options)) {
      const prompt = [step.before, "_____", step.after].filter(Boolean).join(" ");
      return Object.assign(base, { kind: "choice", prompt: prompt },
        shuffleOptions(step.options, step.answer));
    }
    if (step.type === "truefalse") {
      return Object.assign(base, {
        kind: "truefalse",
        prompt: step.statement,
        options: TRUE_FALSE_OPTIONS.slice(),
        correct: step.answer ? 0 : 1,
      });
    }
    return null; // theory, match — ვიქტორინაში არ გამოიყენება
  }

  /** არჩეული გაკვეთილების ყველა შესაფერისი კითხვა. */
  function collectQuestions(lessons) {
    const pool = [];
    lessons.forEach((lesson) => {
      (lesson.steps || []).forEach((step, k) => {
        const q = normalizeStep(step, lesson, k);
        if (q) pool.push(q);
      });
    });
    return pool;
  }

  /** რამდენი კითხვაა გაკვეთილებში (სწრაფი დათვლა პარამეტრების ეკრანისთვის). */
  function countQuestions(lessons) {
    return lessons.reduce((sum, lesson) =>
      sum + (lesson.steps || []).filter((s) => s.type === "choice" || s.type === "fill" || s.type === "truefalse").length, 0);
  }

  /**
   * ახალი თამაში.
   * options: { lessons, teamNames: [..], count, timeLimit (წამი, 0 = გარეშე) }
   */
  function createGame(options) {
    const pool = shuffle(collectQuestions(options.lessons));
    const questions = pool.slice(0, Math.min(options.count, pool.length));
    return {
      questions: questions,
      teams: options.teamNames.map((name) => ({ name: name })),
      timeLimit: options.timeLimit || 0,
      index: 0,
      phase: questions.length ? "question" : "finished", // question → reveal → … → finished
      awards: questions.map(() => []), // კითხვის ინდექსი → გუნდების ინდექსები, ვინც სწორად უპასუხა
    };
  }

  function currentQuestion(state) {
    return state.questions[state.index] || null;
  }

  function reveal(state) {
    if (state.phase !== "question") return state;
    return Object.assign({}, state, { phase: "reveal" });
  }

  /** გუნდისთვის ქულის მინიჭება/მოხსნა მიმდინარე კითხვაზე (მხოლოდ პასუხის ჩვენების შემდეგ). */
  function toggleAward(state, teamIndex) {
    if (state.phase !== "reveal" || !state.teams[teamIndex]) return state;
    const awards = state.awards.slice();
    const list = awards[state.index].slice();
    const at = list.indexOf(teamIndex);
    if (at === -1) list.push(teamIndex);
    else list.splice(at, 1);
    awards[state.index] = list;
    return Object.assign({}, state, { awards: awards });
  }

  function next(state) {
    if (state.phase !== "reveal") return state;
    const last = state.index >= state.questions.length - 1;
    return Object.assign({}, state, {
      index: last ? state.index : state.index + 1,
      phase: last ? "finished" : "question",
    });
  }

  /** გუნდების ქულები: [{ index, name, score, correct }] — დალაგებული არ არის. */
  function scores(state) {
    return state.teams.map((team, i) => {
      const correct = state.awards.filter((list) => list.indexOf(i) !== -1).length;
      return { index: i, name: team.name, correct: correct, score: correct * POINTS_PER_CORRECT };
    });
  }

  /** საბოლოო რეიტინგი: ქულით კლებადობით; თანაბარ ქულებს ერთი ადგილი აქვთ. */
  function ranking(state) {
    const sorted = scores(state).sort((a, b) => b.score - a.score || a.index - b.index);
    let place = 0;
    let prev = null;
    return sorted.map((row, i) => {
      if (row.score !== prev) place = i + 1;
      prev = row.score;
      return Object.assign({ place: place }, row);
    });
  }

  window.IMS_QUIZ = Object.freeze({
    POINTS_PER_CORRECT,
    collectQuestions,
    countQuestions,
    createGame,
    currentQuestion,
    reveal,
    toggleAward,
    next,
    scores,
    ranking,
  });
})();
