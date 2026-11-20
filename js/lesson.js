/* ==========================================================
   ისტორიის სამყარო — გაკვეთილის ლოგიკა
   ----------------------------------------------------------
   - სავარჯიშოები: theory, choice, truefalse, fill, match
   - არასწორი პასუხი = −1 სიცოცხლე (მაშინვე ინახება პროფილში)
   - 0 სიცოცხლე → „სიცოცხლეები ამოიწურა“ → dashboard.html
   - დასრულება: პირველად → სრული XP, განმეორებით → +5 XP;
     თუ სიცოცხლე 5-ზე ნაკლებია → +1 ❤️
   - სიცოცხლის აღდგენის სავარჯიშო (lesson.html?mode=practice):
     3 შემთხვევითი კითხვა გავლილი/საბაზისო თემებიდან, შეცდომაზე
     სიცოცხლე არ აკლდება (არასწორი კითხვა ბოლოს მეორდება);
     3-ვე სწორად → +1 ❤️, +5 XP → dashboard.html
   - „ჩემი შეცდომები“ (lesson.html?mode=mistakes&course=…): ბოლო
     შეცდომები ამ კურსიდან (profile.mistakes), სიცოცხლე არ აკლდება;
     სწორი პასუხი კითხვას სიიდან შლის; +2 XP თითო კითხვაზე
   - 🔊 თეორიის ბარათის მოსმენა: აუდიო js/audio-manifest.js-დან
     (ამზადებს tools/make-audio.py; ღილაკი ჩანს მხოლოდ თუ ფაილი არსებობს)
   - ყოველი პასუხი აღირიცხება (store.recordAnswer): დღიური
     სტატისტიკა (progress.html) და შეცდომების სია
   - Pro (isPro: true): ∞ სიცოცხლე, შეცდომაზე არ აკლდება
   - საცავი და სინქრონიზაცია — js/storage.js (window.IMS_STORE)
   - ტექსტი DOM-ში მხოლოდ textContent-ით
   ========================================================== */

// ჯერ იტვირთება საჭირო კლასის მასალა (js/data/), შემდეგ — გვერდი
window.IMS_DATA.load([window.IMS_DATA.currentCourseId()]).then(function () {
  "use strict";

  const { createEl, shuffle } = window.IMS_UTILS; // js/utils.js

  const store = window.IMS_STORE;

  const REPEAT_XP = 5;
  const HEART_REWARD = 1;
  const GAME_OVER_REDIRECT_MS = 4000;

  const PRACTICE_SIZE = 3;
  const PRACTICE_XP = 5;
  const PRACTICE_REDIRECT_MS = 3500;
  const PRACTICE_TYPES = ["choice", "truefalse", "fill"];
  const MISTAKES_SIZE = 10;  // „ჩემი შეცდომები“ — ერთ ჯერზე მაქსიმუმ 10 კითხვა
  const MISTAKES_XP = 2;     // თითო გამეორებულ კითხვაზე

  /* ==========================================================
     გაკვეთილის ჩატვირთვა და შემოწმება
     ========================================================== */

  if (!store.requireAuth()) return;

  // ახალი დღე → streak განახლება და სიცოცხლეების შევსება
  const daily = store.checkDaily();
  if (!daily) return;
  const initialProfile = daily.profile;
  const unlimited = store.hasUnlimitedHearts(initialProfile);

  const DASHBOARD_URL = store.URLS.dashboard;

  const params = new URLSearchParams(window.location.search);
  const isPractice = params.get("mode") === "practice";
  const isMistakes = params.get("mode") === "mistakes";
  // გამეორების რეჟიმი: სიცოცხლე არ აკლდება, არასწორი კითხვა ბოლოს მეორდება
  const isReview = isPractice || isMistakes;

  let lesson = null;
  let lessonCourse = null; // ჩვეულებრივი გაკვეთილის კურსი (ქვის სახეობისთვის)
  let steps;
  let practiceCourse = null;
  let practiceTarget = PRACTICE_SIZE; // რამდენი სწორი პასუხი სჭირდება სავარჯიშოს
  // კითხვა → { c, l, i, q }: რომელი გაკვეთილის რომელი კითხვაა (შეცდომების აღრიცხვისთვის)
  const stepInfo = new Map();

  function rememberStep(courseId, lessonId, step, index) {
    if (!window.IMS_DATA.isQuestion(step)) return;
    stepInfo.set(step, { c: courseId, l: lessonId, i: index, q: window.IMS_DATA.stepFingerprint(step) });
  }

  if (isMistakes) {
    practiceCourse =
      window.IMS_DATA.getCourse(params.get("course")) ||
      window.IMS_DATA.getCourse(store.readString(store.KEYS.selectedCourse)) ||
      window.IMS_DATA.courses[0];
    steps = buildMistakeSteps(initialProfile, practiceCourse);
    if (steps.length === 0) {
      store.redirect(DASHBOARD_URL);
      return;
    }
    practiceTarget = steps.length;
    document.title = "ჩემი შეცდომები — Edubba";
  } else if (isPractice) {
    // სავარჯიშო საჭიროა მხოლოდ მაშინ, როცა სიცოცხლე 5-ზე ნაკლებია (და არა Pro)
    if (unlimited || initialProfile.hearts >= store.MAX_HEARTS) {
      store.redirect(DASHBOARD_URL);
      return;
    }
    // კურსი: ?course=… → დაფაზე ბოლოს არჩეული → პირველი კურსი
    practiceCourse =
      window.IMS_DATA.getCourse(params.get("course")) ||
      window.IMS_DATA.getCourse(store.readString(store.KEYS.selectedCourse)) ||
      window.IMS_DATA.courses[0];

    steps = buildPracticeSteps(initialProfile, practiceCourse);
    if (steps.length === 0) {
      store.redirect(DASHBOARD_URL);
      return;
    }
    practiceTarget = steps.length; // ჩვეულებრივ ზუსტად 3
    document.title = "სიცოცხლის აღდგენა — Edubba";
  } else {
    const course = window.IMS_DATA.getCourse(params.get("course"));
    lesson = course ? window.IMS_DATA.getLesson(course.id, params.get("lesson")) : null;
    lessonCourse = course;

    if (!lesson || !Array.isArray(lesson.steps) || lesson.steps.length === 0) {
      store.redirect(DASHBOARD_URL);
      return;
    }

    // დაბლოკილ გაკვეთილზე პირდაპირი ბმულით შესვლის აკრძალვა.
    // უკვე გავლილი გაკვეთილი ყოველთვის იხსნება — მაშინაც, თუ მის წინ
    // მოგვიანებით ახალი გაკვეთილი ჩაემატა (მაგ. g7-l3 → g7-l2-მდე).
    const doneSet = new Set(initialProfile.completedLessons);
    const lessonIndex = course.lessons.indexOf(lesson);
    const firstOpenIndex = course.lessons.findIndex((l) => !doneSet.has(l.id));
    if (!doneSet.has(lesson.id) && firstOpenIndex !== -1 && lessonIndex > firstOpenIndex) {
      store.redirect(DASHBOARD_URL);
      return;
    }

    steps = lesson.steps.slice();
    steps.forEach((s, i) => rememberStep(course.id, lesson.id, s, i));
    document.title = lesson.title + " — Edubba";
  }

  /** „ჩემი შეცდომები“: ამ კურსის ბოლო შეცდომები (უახლესი — პირველი), არეული. */
  function buildMistakeSteps(profile, course) {
    const list = [];
    profile.mistakes.slice().reverse().forEach((m) => {
      if (m.c !== course.id || list.length >= MISTAKES_SIZE) return;
      const step = window.IMS_DATA.findStep(m.c, m.l, m.i, m.q);
      if (!step || stepInfo.has(step)) return;
      rememberStep(m.c, m.l, step, m.i);
      list.push(step);
    });
    return shuffle(list);
  }

  /**
   * სავარჯიშოს კითხვები — მხოლოდ ერთი კურსიდან:
   * მისი გავლილი გაკვეთილები + მიმდინარე (პირველი დაუსრულებელი).
   * დაბლოკილი გაკვეთილები და სხვა კლასები არ შედის.
   */
  function buildPracticeSteps(profile, course) {
    const done = new Set(profile.completedLessons);
    const currentIndex = course.lessons.findIndex((l) => !done.has(l.id));

    const pool = [];
    course.lessons.forEach((l, i) => {
      const unlocked = done.has(l.id) || i === currentIndex;
      if (!unlocked) return;
      (l.steps || []).forEach((s, k) => {
        if (PRACTICE_TYPES.includes(s.type)) pool.push({ step: s, lessonId: l.id, index: k });
      });
    });

    return shuffle(pool).slice(0, PRACTICE_SIZE).map((item) => {
      rememberStep(course.id, item.lessonId, item.step, item.index);
      return item.step;
    });
  }

  /* ==========================================================
     მდგომარეობა და DOM
     ========================================================== */

  const questionTotal = steps.filter((s) => s.type !== "theory").length;

  const state = {
    index: 0,
    hearts: initialProfile.hearts,
    correct: 0,
    attempts: 0,
    onPrimary: null,
    finished: false,
  };

  /** სიცოცხლეები ამოიწურა? (Pro-სა და სავარჯიშოში — არასდროს) */
  function isOutOfHearts() {
    return !unlimited && !isReview && state.hearts <= 0;
  }

  const el = {
    stage: document.getElementById("stage"),
    footer: document.getElementById("footer"),
    feedback: document.getElementById("feedback"),
    feedbackIcon: document.getElementById("feedbackIcon"),
    feedbackTitle: document.getElementById("feedbackTitle"),
    feedbackText: document.getElementById("feedbackText"),
    primaryBtn: document.getElementById("primaryBtn"),
    progressBar: document.getElementById("progressBar"),
    progressFill: document.getElementById("progressFill"),
    heartsBox: document.getElementById("heartsBox"),
    heartsCount: document.getElementById("heartsCount"),
    victory: document.getElementById("victoryScreen"),
    victoryEmblem: document.getElementById("victoryEmblem"),
    victoryTitle: document.getElementById("victoryTitle"),
    victorySubtitle: document.getElementById("victorySubtitle"),
    victoryXp: document.getElementById("victoryXp"),
    victoryAccuracy: document.getElementById("victoryAccuracy"),
    victoryHeartsStat: document.getElementById("victoryHeartsStat"),
    victoryHearts: document.getElementById("victoryHearts"),
    victoryGem: document.getElementById("victoryGem"),
    gameOver: document.getElementById("gameOverScreen"),
  };

  /* ==========================================================
     ზედა პანელი: პროგრესი და სიცოცხლეები
     ========================================================== */

  function renderProgress() {
    const ratio = isReview ? state.correct / practiceTarget : state.index / steps.length;
    const pct = Math.min(100, Math.round(ratio * 100));
    el.progressFill.style.width = pct + "%";
    el.progressBar.setAttribute("aria-valuenow", String(pct));
  }

  function renderHearts(animate) {
    el.heartsCount.textContent = unlimited ? "∞" : String(state.hearts);
    el.heartsBox.title = unlimited ? "Pro — ულიმიტო სიცოცხლე" : "დარჩენილი სიცოცხლეები";
    if (animate) {
      el.heartsBox.classList.remove("is-hit");
      void el.heartsBox.offsetWidth; // ანიმაციის თავიდან გაშვება
      el.heartsBox.classList.add("is-hit");
    }
  }

  function loseHeart() {
    if (unlimited || isReview) return; // Pro და გამეორება — სიცოცხლე არ აკლდება
    const profile = store.updateProfile((p) => {
      p.hearts = Math.max(0, p.hearts - 1);
    });
    if (!profile) return;
    state.hearts = profile.hearts;
    renderHearts(true);
  }

  /* ==========================================================
     ქვედა პანელი
     ========================================================== */

  function setFooter(options) {
    el.footer.dataset.state = options.state || "idle";
    el.feedback.hidden = true;
    el.primaryBtn.textContent = options.label;
    el.primaryBtn.disabled = !options.enabled;
    el.primaryBtn.classList.toggle("btn--danger", options.state === "wrong");
    state.onPrimary = options.onPrimary || null;
  }

  function enablePrimary(enabled) {
    el.primaryBtn.disabled = !enabled;
  }

  el.primaryBtn.addEventListener("click", () => {
    if (!el.primaryBtn.disabled && typeof state.onPrimary === "function") {
      state.onPrimary();
    }
  });

  /**
   * პასუხის შედეგის ჩვენება.
   * heartAlreadyLost — წყვილების სავარჯიშოში სიცოცხლე შეცდომისთანავე აკლდება.
   */
  function showResult(isCorrect, explanation, heartAlreadyLost) {
    state.attempts += 1;
    let text = explanation || "";
    // სტატისტიკა + „ჩემი შეცდომები“ (სწორი პასუხი კითხვას სიიდან შლის)
    store.recordAnswer(stepInfo.get(steps[state.index]) || null, isCorrect);

    if (isCorrect) {
      state.correct += 1;
      renderProgress();
    } else {
      if (!heartAlreadyLost) loseHeart();
      if (isReview) {
        // სავარჯიშოში არასწორი კითხვა ბოლოს კიდევ ერთხელ შეგხვდება
        steps.push(steps[state.index]);
        text += " სიცოცხლე არ დაგაკლდა — ეს კითხვა ბოლოს კიდევ ერთხელ შეგხვდება.";
      }
    }

    const practiceDone = isReview && state.correct >= practiceTarget;

    setFooter({
      state: isCorrect ? "correct" : "wrong",
      label: practiceDone ? "დასრულება" : "გაგრძელება",
      enabled: true,
      onPrimary: isOutOfHearts() ? showGameOver : nextStep,
    });

    el.feedbackIcon.textContent = isCorrect ? "✓" : "✕";
    el.feedbackTitle.textContent = isCorrect ? pickPraise() : "არასწორია";
    el.feedbackText.textContent = text.trim();
    el.feedback.hidden = false;
    el.primaryBtn.focus();
  }

  function pickPraise() {
    const list = ["შესანიშნავია!", "სწორია!", "ყოჩაღ!", "ზუსტად ასეა!"];
    return list[Math.floor(Math.random() * list.length)];
  }

  /* ==========================================================
     ნაბიჯების ნავიგაცია
     ========================================================== */

  function nextStep() {
    state.index += 1;
    renderProgress();
    // სავარჯიშო მთავრდება ზუსტად 3 სწორ პასუხზე — ზედმეტი კითხვა აღარ გამოდის
    const practiceDone = isReview && state.correct >= practiceTarget;
    if (practiceDone || state.index >= steps.length) {
      finishLesson();
    } else {
      renderStep();
    }
  }

  function renderStep() {
    stopAudio();
    const step = steps[state.index];
    el.stage.replaceChildren();
    // ახალი ნაბიჯის ანიმაცია
    el.stage.style.animation = "none";
    void el.stage.offsetWidth;
    el.stage.style.animation = "";

    const renderers = {
      theory: renderTheory,
      choice: renderChoice,
      truefalse: renderTrueFalse,
      fill: renderFill,
      match: renderMatch,
    };
    (renderers[step.type] || renderTheory)(step);
  }

  /* ==========================================================
     სავარჯიშოების ტიპები
     ========================================================== */

  /* ---------- სურათი / არტეფაქტი (არასავალდებულო) ---------- */

  // მხოლოდ პროექტის assets/images/ საქაღალდიდან და მხოლოდ სურათის ფორმატები
  const IMAGE_PATH = /^assets\/images\/(?!.*\.\.)[^\s"'<>\\?#]+\.(jpe?g|png|webp|gif|svg|avif)$/i;

  /** მხოლოდ https:// ბმულები (ავტორობისა და ლიცენზიისთვის) */
  function safeUrl(url) {
    return typeof url === "string" && /^https:\/\/[^\s"'<>]+$/.test(url.trim()) ? url.trim() : "";
  }

  function externalLink(text, href) {
    const a = createEl("a", "lesson-figure__link", text);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  /** step.image: "assets/images/x.jpg" ან { src, caption, alt, credit, licenseName, licenseUrl, sourceUrl } */
  function normalizeImage(image) {
    if (!image) return null;
    const data = typeof image === "string" ? { src: image } : image;
    if (!data || typeof data.src !== "string" || !IMAGE_PATH.test(data.src.trim())) return null;
    return {
      src: data.src.trim(),
      caption: typeof data.caption === "string" ? data.caption.trim() : "",
      credit: typeof data.credit === "string" ? data.credit.trim() : "",
      licenseName: typeof data.licenseName === "string" ? data.licenseName.trim() : "",
      licenseUrl: safeUrl(data.licenseUrl),
      sourceUrl: safeUrl(data.sourceUrl),
      alt: typeof data.alt === "string" && data.alt.trim() ? data.alt.trim() : "",
    };
  }

  /** <figure> სურათითა და წარწერით; ჩატვირთვის შეცდომისას იმალება. */
  function buildFigure(image) {
    const data = normalizeImage(image);
    if (!data) return null;

    const figure = createEl("figure", "lesson-figure");
    const img = document.createElement("img");
    img.className = "lesson-figure__img";
    img.src = data.src;
    img.alt = data.alt || data.caption || "ილუსტრაცია";
    img.decoding = "async";
    img.addEventListener("error", () => {
      figure.hidden = true;
    });
    figure.append(img);

    if (data.caption || data.credit || data.licenseName) {
      const caption = createEl("figcaption", "lesson-figure__caption");
      if (data.caption) caption.append(createEl("span", "lesson-figure__text", data.caption));

      // ავტორობა: „ფოტო: … · CC BY-SA 2.0 · წყარო“ (CC ლიცენზიების მოთხოვნა)
      if (data.credit || data.licenseName) {
        const credit = createEl("span", "lesson-figure__credit");
        if (data.credit) credit.append(document.createTextNode(data.credit));
        if (data.licenseName) {
          if (credit.childNodes.length) credit.append(document.createTextNode(" · "));
          credit.append(data.licenseUrl ? externalLink(data.licenseName, data.licenseUrl) : document.createTextNode(data.licenseName));
        }
        if (data.sourceUrl) {
          credit.append(document.createTextNode(" · "), externalLink("წყარო", data.sourceUrl));
        }
        caption.append(credit);
      }
      figure.append(caption);
    }
    return figure;
  }

  /** გაკვეთილის ყველა სურათის წინასწარ ჩატვირთვა — სწრაფი ჩვენება და ოფლაინ ქეში. */
  function preloadImages() {
    steps.forEach((step) => {
      const data = normalizeImage(step.image);
      if (data) {
        const img = new Image();
        img.src = data.src;
      }
    });
  }

  // --- თეორიული ბარათი ---
  function renderTheory(step) {
    const wrap = createEl("article", "theory");
    wrap.append(createEl("div", "theory__icon", step.icon || "📖"));
    wrap.firstChild.setAttribute("aria-hidden", "true");
    wrap.append(createEl("h1", "theory__title", step.title || ""));

    const listen = buildListenButton(step);
    if (listen) wrap.append(listen);

    const figure = buildFigure(step.image);
    if (figure) wrap.append(figure);

    (step.paragraphs || []).forEach((text) => {
      wrap.append(createEl("p", "theory__text", text));
    });

    if (step.fact) {
      const fact = createEl("aside", "theory__fact");
      const icon = createEl("span", "theory__fact-icon", "💡");
      icon.setAttribute("aria-hidden", "true");
      fact.append(icon, createEl("p", "theory__fact-text", step.fact));
      wrap.append(fact);
    }

    el.stage.append(wrap);
    setFooter({ label: "გასაგებია, გავაგრძელოთ", enabled: true, onPrimary: nextStep });
  }

  /* ---------- 🔊 მოსმენა (ხელოვნური ხმა) ---------- */

  let audio = null;

  function stopAudio() {
    if (!audio) return;
    audio.pause();
    audio = null;
  }

  /** ღილაკი მხოლოდ მაშინ, თუ ამ ბარათს აუდიო აქვს (js/audio-manifest.js). */
  function buildListenButton(step) {
    const files = lesson && window.IMS_AUDIO ? window.IMS_AUDIO[lesson.id] : null;
    const src = files ? files[String(lesson.steps.indexOf(step))] : null;
    if (!src) return null;

    const btn = createEl("button", "theory__listen");
    btn.type = "button";
    const icon = createEl("span", "theory__listen-icon", "🔊");
    icon.setAttribute("aria-hidden", "true");
    const label = createEl("span", "theory__listen-label", "მოუსმინე");
    btn.append(icon, label, createEl("span", "theory__listen-note", "ხელოვნური ხმა"));
    btn.setAttribute("aria-pressed", "false");

    function render(playing) {
      icon.textContent = playing ? "⏸️" : "🔊";
      label.textContent = playing ? "პაუზა" : "მოუსმინე";
      btn.setAttribute("aria-pressed", String(playing));
      btn.classList.toggle("is-playing", playing);
    }

    btn.addEventListener("click", () => {
      if (audio && !audio.paused) {
        audio.pause();
        return;
      }
      if (!audio) {
        audio = new Audio(src);
        const current = audio;
        current.addEventListener("play", () => { if (audio === current) render(true); });
        current.addEventListener("pause", () => { if (audio === current) render(false); });
        current.addEventListener("ended", () => { if (audio === current) { audio = null; render(false); } });
        current.addEventListener("error", () => { btn.disabled = true; label.textContent = "ვერ ჩაიტვირთა"; });
      }
      audio.play().catch(() => render(false));
    });
    return btn;
  }

  /**
   * ზოგადი „აირჩიე ერთი“ სავარჯიშო (choice / truefalse / fill).
   * options: [{ text, correct }], onSelect: არჩევისას დამატებითი მოქმედება
   */
  function renderOptionExercise(config) {
    let selected = null;

    const list = createEl("div", "options " + (config.layout || ""));
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", "პასუხის ვარიანტები");

    const buttons = config.options.map((opt, i) => {
      const btn = createEl("button", "option");
      btn.type = "button";
      btn.setAttribute("aria-pressed", "false");
      if (config.showKeys) {
        const key = createEl("span", "option__key", String(i + 1));
        key.setAttribute("aria-hidden", "true");
        btn.append(key);
      }
      btn.append(createEl("span", "option__text", opt.text));

      btn.addEventListener("click", () => {
        selected = i;
        buttons.forEach((b, j) => {
          b.classList.toggle("is-selected", j === i);
          b.setAttribute("aria-pressed", String(j === i));
        });
        if (config.onSelect) config.onSelect(opt);
        enablePrimary(true);
      });

      list.append(btn);
      return btn;
    });

    el.stage.append(list);

    setFooter({
      label: "შემოწმება",
      enabled: false,
      onPrimary: () => {
        if (selected === null) return;
        const isCorrect = config.options[selected].correct;

        buttons.forEach((b, j) => {
          b.disabled = true;
          b.classList.remove("is-selected");
          if (config.options[j].correct) b.classList.add("is-correct");
          else if (j === selected) b.classList.add("is-wrong");
        });
        if (config.onCheck) config.onCheck(isCorrect);

        let text = config.explanation || "";
        if (!isCorrect && config.correctText) {
          text = "სწორი პასუხი: " + config.correctText + ". " + text;
        }
        showResult(isCorrect, text, false);
      },
    });
  }

  function exerciseHeader(label, question, image) {
    el.stage.append(createEl("p", "exercise__label", (isPractice ? "❤️ სავარჯიშო · " + practiceCourse.title + " · " : isMistakes ? "🔁 ჩემი შეცდომები · " + practiceCourse.title + " · " : "") + label));
    if (question) el.stage.append(createEl("h1", "exercise__question", question));
    const figure = buildFigure(image);
    if (figure) el.stage.append(figure);
  }

  // --- ტესტი 4 ვარიანტით ---
  function renderChoice(step) {
    exerciseHeader("აირჩიე სწორი პასუხი", step.question, step.image);
    const options = shuffle(step.options.map((text, i) => ({ text, correct: i === step.answer })));
    renderOptionExercise({
      options: options,
      showKeys: true,
      explanation: step.explanation,
      correctText: step.options[step.answer],
    });
  }

  // --- სწორია / მცდარია ---
  function renderTrueFalse(step) {
    exerciseHeader("სწორია თუ მცდარი?", step.statement, step.image);
    renderOptionExercise({
      layout: "options--row",
      options: [
        { text: "✓ სწორია", correct: step.answer === true },
        { text: "✕ მცდარია", correct: step.answer === false },
      ],
      showKeys: false,
      explanation: step.explanation,
    });
  }

  // --- წინადადების შევსება ---
  function renderFill(step) {
    exerciseHeader("შეავსე გამოტოვებული სიტყვა", "", step.image);

    const sentence = createEl("p", "fill-sentence");
    const blank = createEl("span", "fill-blank", " ");
    blank.setAttribute("aria-label", "გამოტოვებული სიტყვა");
    // პუნქტუაციის (. , ; : ! ?) წინ და გამხსნელი ბრჭყალის/ფრჩხილის შემდეგ ჰარი არ ჩაჯდეს:
    // „მონები, რომლებიც…“, „„ღმერთის კარიბჭე“
    const before = (step.before || "").trim();
    const after = (step.after || "").trim();
    const glue = /^[.,;:!?)»“]/.test(after) ? "" : " ";
    const lead = /[„“«(]$/.test(before) ? "" : " ";
    sentence.append(
      document.createTextNode(before ? before + lead : ""),
      blank,
      document.createTextNode(after ? glue + after : "")
    );
    el.stage.append(sentence);

    const options = shuffle(step.options.map((text, i) => ({ text, correct: i === step.answer })));
    renderOptionExercise({
      layout: "options--chips",
      options: options,
      showKeys: false,
      explanation: step.explanation,
      correctText: step.options[step.answer],
      onSelect: (opt) => {
        blank.textContent = opt.text;
        blank.classList.add("is-filled");
      },
      onCheck: (isCorrect) => {
        blank.classList.add(isCorrect ? "is-correct" : "is-wrong");
      },
    });
  }

  // --- წყვილების დაკავშირება ---
  function renderMatch(step) {
    exerciseHeader("დააკავშირე წყვილები", step.prompt, step.image);

    const grid = createEl("div", "match-grid");
    const leftCol = createEl("div", "match-col");
    const rightCol = createEl("div", "match-col");
    grid.append(leftCol, rightCol);
    el.stage.append(grid);

    let pickLeft = null;
    let pickRight = null;
    let matched = 0;
    let mistakes = 0;
    let locked = false;

    function makeTile(text, pairIndex, side) {
      const btn = createEl("button", "option", text);
      btn.type = "button";
      btn.dataset.pair = String(pairIndex);
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => onPick(btn, side));
      return btn;
    }

    const leftTiles = step.pairs.map((pair, i) => makeTile(pair[0], i, "left"));
    const rightTiles = shuffle(step.pairs.map((pair, i) => makeTile(pair[1], i, "right")));
    leftCol.append(...leftTiles);
    rightCol.append(...rightTiles);

    function select(btn, on) {
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", String(on));
    }

    function onPick(btn, side) {
      if (locked || btn.disabled) return;

      if (side === "left") {
        if (pickLeft) select(pickLeft, false);
        pickLeft = pickLeft === btn ? null : btn;
        if (pickLeft) select(pickLeft, true);
      } else {
        if (pickRight) select(pickRight, false);
        pickRight = pickRight === btn ? null : btn;
        if (pickRight) select(pickRight, true);
      }

      if (pickLeft && pickRight) evaluatePair();
    }

    function evaluatePair() {
      const a = pickLeft;
      const b = pickRight;
      pickLeft = null;
      pickRight = null;
      select(a, false);
      select(b, false);

      if (a.dataset.pair === b.dataset.pair) {
        [a, b].forEach((t) => {
          t.classList.add("is-matched");
          t.disabled = true;
        });
        matched += 1;
        if (matched === step.pairs.length) {
          const perfect = mistakes === 0;
          showResult(
            perfect,
            perfect
              ? step.explanation || ""
              : "ყველა წყვილი დაკავშირებულია, მაგრამ " + mistakes + " შეცდომით. " + (step.explanation || ""),
            true
          );
        }
        return;
      }

      // არასწორი წყვილი
      mistakes += 1;
      locked = true;
      [a, b].forEach((t) => t.classList.add("is-wrong", "is-shake"));
      loseHeart();

      setTimeout(() => {
        [a, b].forEach((t) => t.classList.remove("is-wrong", "is-shake"));
        locked = false;
        if (isOutOfHearts()) {
          showResult(false, "წყვილის დაკავშირებისას დაშვებულია შეცდომა.", true);
        }
      }, 600);
    }

    setFooter({ label: "შემოწმება", enabled: false });
  }

  /* ==========================================================
     დასრულება / სიცოცხლეების ამოწურვა
     ========================================================== */

  function hideLesson() {
    stopAudio();
    el.stage.hidden = true;
    el.footer.hidden = true;
  }

  function finishLesson() {
    if (state.finished) return;
    state.finished = true;
    if (isPractice) {
      finishPractice();
      return;
    }
    if (isMistakes) {
      finishMistakes();
      return;
    }

    let xpGain = 0;
    let heartGain = 0;
    let firstTime = false;
    let gem = null;
    // უშეცდომო გავლა → გაპრიალებული ქვა; შეცდომით → ნატეხი
    const flawless = state.correct === state.attempts;

    const profile = store.updateProfile((p) => {
      gem = store.recordGem(p, lesson.id, flawless);
      firstTime = !p.completedLessons.includes(lesson.id);
      xpGain = firstTime ? store.toCount(lesson.xp, 10) : REPEAT_XP;
      if (firstTime) p.completedLessons.push(lesson.id);
      p.xp += xpGain;

      // წარმატებით დასრულება → +1 ❤️ (მაქსიმუმ 5-მდე; Pro-ს არ სჭირდება)
      if (!unlimited && p.hearts < store.MAX_HEARTS) {
        heartGain = Math.min(HEART_REWARD, store.MAX_HEARTS - p.hearts);
        p.hearts += heartGain;
      }
    });
    if (!profile) return;

    state.hearts = profile.hearts;
    renderHearts(heartGain > 0);

    const accuracy = questionTotal ? Math.round((state.correct / questionTotal) * 100) : 100;

    hideLesson();
    el.victoryXp.textContent = "+" + xpGain;
    el.victoryAccuracy.textContent = accuracy + "%";
    el.victoryHeartsStat.hidden = heartGain === 0;
    el.victoryHearts.textContent = "+" + heartGain + " ❤️";
    el.victorySubtitle.textContent = firstTime
      ? "„" + lesson.title + "“ — გავლილია!"
      : "განმეორებითი გავლა — სიმბოლური +" + REPEAT_XP + " XP.";
    renderVictoryGem(gem);
    el.victory.hidden = false;
    el.victory.querySelector(".result__btn").focus();
  }

  /** ქვა გამარჯვების ეკრანზე: მიღებული/გაპრიალებული ქვა ან მინიშნება, როგორ გაპრიალდეს. */
  function renderVictoryGem(gem) {
    const gems = window.IMS_GEMS;
    if (!gem || !gems || !lessonCourse) return;
    const kind = gems.kindFor(lessonCourse.lessons.indexOf(lesson));
    const name = gems.NAMES[kind];
    let text;
    if (gem.after === "rough") {
      text = (gem.before ? name + " ჯერ ისევ ნატეხია." : "ახალი ქვა — " + name + ", ჯერ ნატეხი.") +
        " გაიარე გაკვეთილი უშეცდომოდ და გაპრიალდება.";
    } else if (gem.before === "rough") {
      text = name + " გაპრიალდა! ✦";
    } else if (gem.before === "polished") {
      text = name + " ისევ ბრწყინავს.";
    } else {
      text = "ახალი ქვა — " + name + ", უშეცდომოდ და უკვე გაპრიალებული! ✦";
    }
    const box = el.victoryGem;
    const art = box.querySelector(".result__gem-art");
    art.replaceChildren(gems.icon(kind, gem.after));
    box.querySelector(".result__gem-text").textContent = text;
    box.hidden = false;
  }

  /** სავარჯიშოს დასრულება: +1 ❤️ (მაქს. 5) და +5 XP, შემდეგ დაფაზე დაბრუნება. */
  function finishPractice() {
    let heartGain = 0;

    const profile = store.updateProfile((p) => {
      heartGain = Math.min(HEART_REWARD, Math.max(0, store.MAX_HEARTS - p.hearts));
      p.hearts += heartGain;
      p.xp += PRACTICE_XP;
    });
    if (!profile) return;

    state.hearts = profile.hearts;
    renderHearts(heartGain > 0);
    renderProgress();

    const accuracy = state.attempts ? Math.round((state.correct / state.attempts) * 100) : 100;

    hideLesson();
    el.victoryEmblem.textContent = "❤️";
    el.victoryTitle.textContent = "სიცოცხლე აღდგა!";
    el.victorySubtitle.textContent =
      (practiceTarget === 3 ? "3-ვე" : "ყველა") + " კითხვას სწორად უპასუხე. ახლა გაქვს " + profile.hearts + " ❤️ — ბრუნდები დაფაზე…";
    el.victoryXp.textContent = "+" + PRACTICE_XP;
    el.victoryAccuracy.textContent = accuracy + "%";
    el.victoryHeartsStat.hidden = heartGain === 0;
    el.victoryHearts.textContent = "+" + heartGain + " ❤️";
    el.victory.hidden = false;
    el.victory.querySelector(".result__btn").focus();

    setTimeout(() => store.redirect(DASHBOARD_URL), PRACTICE_REDIRECT_MS);
  }

  /** „ჩემი შეცდომების“ დასრულება: +2 XP თითო კითხვაზე, სიცოცხლე არ იცვლება. */
  function finishMistakes() {
    const xpGain = practiceTarget * MISTAKES_XP;
    const profile = store.updateProfile((p) => {
      p.xp += xpGain;
    });
    if (!profile) return;
    renderProgress();

    const left = profile.mistakes.filter((m) => m.c === practiceCourse.id).length;
    const accuracy = state.attempts ? Math.round((state.correct / state.attempts) * 100) : 100;

    hideLesson();
    el.victoryEmblem.textContent = "🔁";
    el.victoryTitle.textContent = "შეცდომები გამოსწორებულია!";
    el.victorySubtitle.textContent = practiceTarget + " კითხვა გაიმეორე. " +
      (left ? "სიაში კიდევ " + left + " კითხვა დარჩა." : "სია ცარიელია — ყოჩაღ!");
    el.victoryXp.textContent = "+" + xpGain;
    el.victoryAccuracy.textContent = accuracy + "%";
    el.victoryHeartsStat.hidden = true;
    el.victory.hidden = false;
    el.victory.querySelector(".result__btn").focus();
  }

  function showGameOver() {
    if (state.finished) return;
    state.finished = true;
    hideLesson();
    el.gameOver.hidden = false;
    el.gameOver.querySelector(".result__btn").focus();
    setTimeout(() => store.redirect(DASHBOARD_URL), GAME_OVER_REDIRECT_MS);
  }

  /* ==========================================================
     კლავიატურა: Enter → მთავარი ღილაკი, 1–4 → ვარიანტის არჩევა
     ========================================================== */

  document.addEventListener("keydown", (e) => {
    if (state.finished || e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = document.activeElement && document.activeElement.tagName;

    if (e.key === "Enter" && tag !== "BUTTON" && tag !== "A") {
      e.preventDefault();
      el.primaryBtn.click();
      return;
    }

    if (/^[1-9]$/.test(e.key) && el.footer.dataset.state === "idle") {
      const options = el.stage.querySelectorAll(".options .option:not(:disabled)");
      const target = options[Number(e.key) - 1];
      if (target) target.click();
    }
  });

  /* ==========================================================
     ინიციალიზაცია
     ========================================================== */

  renderHearts(false);
  preloadImages();
  renderProgress();

  if (isOutOfHearts()) {
    showGameOver();
  } else {
    renderStep();
  }
}, window.IMS_DATA.showLoadError);
