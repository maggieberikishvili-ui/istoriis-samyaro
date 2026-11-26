/* ==========================================================
   პროექტის შემოწმება — სინტაქსი + მონაცემების ლოგიკა + უსაფრთხოება
   ----------------------------------------------------------
   გაშვება:
     • კომპიუტერზე (Node არ სჭირდება, macOS-ის ჩაშენებული JS ძრავა):
         /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tools/check.js
     • GitHub-ზე (CI, .github/workflows/check.yml): node tools/check.js
   ორივე პროექტის ძირიდან ეშვება.

   შეცდომა (✗) — push/გამოქვეყნება ჩერდება. გაფრთხილება (!) — არ ჩერდება
   (მაგ. აუდიო ჯერ არ შექმნილა — დრაფტის ეტაპზე ასეა).
   ახალი წესი? დაამატე ქვემოთ შესაბამის ნაწილში.
   ========================================================== */

/* global process, require, read, load, print, quit */
(function () {
  "use strict";

  const IS_NODE = typeof process !== "undefined" && !!(process.versions && process.versions.node);
  const fs = IS_NODE ? require("fs") : null;
  const vm = IS_NODE ? require("vm") : null;
  const G = typeof globalThis !== "undefined" ? globalThis : this;

  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  const out = (s) => (IS_NODE ? console.log(s) : print(s));

  function readText(p) {
    return IS_NODE ? fs.readFileSync(p, "utf8") : read(p);
  }
  const existsCache = new Map();
  function exists(p) {
    if (existsCache.has(p)) return existsCache.get(p);
    let ok;
    if (IS_NODE) ok = fs.existsSync(p) && fs.statSync(p).isFile();
    else {
      try { read(p, "binary"); ok = true; } catch (e) { ok = false; }
    }
    existsCache.set(p, ok);
    return ok;
  }
  function run(p) {
    if (IS_NODE) vm.runInThisContext(readText(p), { filename: p });
    else load(p);
  }

  // ბრაუზერის მინიმალური „მოჩვენება“ — მონაცემთა ფაილებს მხოლოდ ეს სჭირდებათ
  G.window = G;
  G.document = { currentScript: null };
  G.location = { search: "" };
  let captured = [];
  G.console = {
    log: function () {},
    info: function () {},
    error: function () { captured.push([].join.call(arguments, " ")); },
    warn: function () { captured.push([].join.call(arguments, " ")); },
  };

  function loadFile(p, label) {
    captured = [];
    try {
      run(p);
    } catch (e) {
      err(p + ": ფაილი ვერ ჩაიტვირთა — " + (e && e.message ? e.message : e));
      return false;
    }
    captured.forEach((m) => err((label || p) + ": " + m));
    return true;
  }

  /* ---------- 1. მონაცემთა ფაილები (სინტაქსი + ჩაშენებული validate()) ---------- */

  if (!loadFile("js/data.js")) return finish();
  const DATA = G.IMS_DATA;
  DATA.courses.forEach((c) => {
    const p = "js/data/" + c.id + ".js";
    if (!exists(p)) return err(p + ": კურსის ფაილი არ არსებობს");
    loadFile(p);
    if (!c.loaded) err(p + ": register() არ გამოძახებულა");
  });
  ["js/audio-manifest.js", "js/timeline-data.js", "js/whoami-data.js", "js/detective-data.js",
    "js/decide-data.js", "js/illustrations.js"].forEach((p) => loadFile(p));

  const lessonIndex = new Map(); // id → { course, lesson, chapter }
  DATA.courses.forEach((c) => c.chapters.forEach((ch) => ch.lessons.forEach((l) => {
    lessonIndex.set(l.id, { course: c, lesson: l, chapter: ch });
  })));

  /* ---------- 2. გაკვეთილები: დამატებითი წესები (CLAUDE.md) ---------- */

  const QUESTION = { choice: 1, truefalse: 1, fill: 1, match: 1 };
  const ALL_TYPES = { theory: 1, choice: 1, truefalse: 1, fill: 1, match: 1 };
  function texts(step) {
    const t = [step.title, step.question, step.statement, step.before, step.after, step.prompt,
      step.explanation, step.fact].concat(step.paragraphs || [], step.options || []);
    (step.pairs || []).forEach((p) => t.push(p[0], p[1]));
    return t.filter((x) => typeof x === "string");
  }

  lessonIndex.forEach(({ lesson: l }) => {
    if (!l.title) err(l.id + ": სათაური აკლია");
    const tfs = [];
    (l.steps || []).forEach((s, i) => {
      const where = l.id + " ნაბიჯი " + (i + 1);
      if (!ALL_TYPES[s.type]) return err(where + ": უცნობი ტიპი „" + s.type + "“");
      if (s.type === "theory") {
        if (!s.title) err(where + ": თეორიის სათაური აკლია");
        if (!Array.isArray(s.paragraphs) || !s.paragraphs.length || s.paragraphs.some((p) => !p || !String(p).trim())) {
          err(where + ": paragraphs ცარიელია");
        }
      }
      if (QUESTION[s.type] && !(s.explanation && String(s.explanation).trim())) err(where + ": explanation აკლია");
      if (s.type === "fill" && (s.options || []).length < 2) err(where + ": fill-ს 2+ ვარიანტი სჭირდება");
      if (s.type === "match" && (s.pairs || []).length < 2) err(where + ": match-ს 2+ წყვილი სჭირდება");
      if (s.type === "truefalse") {
        tfs.push(s.answer);
        if (s.answer === false && !/^მცდარია/.test(s.explanation || "")) {
          err(where + ": მცდარის explanation უნდა იწყებოდეს „მცდარია — …“");
        }
      }
      if (s.image && typeof s.image === "object" && s.image.src && !exists(s.image.src)) {
        err(where + ": სურათი არ არსებობს — " + s.image.src);
      }
      if (s.image && typeof s.image === "string" && !exists(s.image)) err(where + ": სურათი არ არსებობს — " + s.image);
      texts(s).forEach((t) => {
        if (/\*\*/.test(t)) err(where + ": „**“ აპი არ აჩვენებს მუქად — ამოიღე");
        if (/<\/?[a-z][^>]*>/i.test(t)) err(where + ": ტექსტში HTML ტეგია — აპი მას ტექსტად აჩვენებს");
      });
    });
    if (tfs.length >= 2 && (tfs.indexOf(true) === -1 || tfs.indexOf(false) === -1)) {
      err(l.id + ": " + tfs.length + " სწორია/მცდარიაა — პასუხები შერეული უნდა იყოს");
    }
  });

  /* ---------- 3. აუდიო ---------- */

  const AUDIO = G.IMS_AUDIO || {};
  Object.keys(AUDIO).forEach((lid) => {
    const info = lessonIndex.get(lid);
    if (!info) return err("audio-manifest: უცნობი გაკვეთილი " + lid);
    Object.keys(AUDIO[lid]).forEach((k) => {
      const step = info.lesson.steps[Number(k)];
      const file = AUDIO[lid][k];
      if (!step || step.type !== "theory") err("audio-manifest: " + lid + " ნაბიჯი " + k + " თეორია არ არის");
      if (!exists(file)) err("audio-manifest: ფაილი არ არსებობს — " + file);
    });
  });
  // აუდიო აქვს ამ კლასების ყველა თეორიულ ბარათს (CLAUDE.md); აკლია → გაფრთხილება (დრაფტი)
  ["grade-7", "grade-8", "grade-9"].forEach((cid) => {
    const c = DATA.getCourse(cid);
    if (!c) return;
    c.lessons.forEach((l) => {
      const missing = [];
      (l.steps || []).forEach((s, i) => {
        if (s.type === "theory" && !(AUDIO[l.id] && AUDIO[l.id][i])) missing.push(i + 1);
      });
      if (missing.length) warn(l.id + ": აუდიო აკლია (ბარათი " + missing.join(", ") + ") — python3 tools/make-audio.py " + cid + " " + l.id);
    });
  });

  /* ---------- 4. თამაშები: გაკვეთილის ბმულები ---------- */

  function checkLessonRef(where, courseId, lid) {
    const info = lessonIndex.get(lid);
    if (!info) err(where + ": უცნობი გაკვეთილი " + lid);
    else if (info.course.id !== courseId) err(where + ": " + lid + " სხვა კურსისაა (" + info.course.id + ")");
  }
  DATA.courses.forEach((c) => {
    if (G.IMS_TIMELINE) G.IMS_TIMELINE.forCourse(c.id).forEach((e, i) => {
      const where = "timeline " + c.id + " #" + (i + 1) + " (" + e.text + ")";
      checkLessonRef(where, c.id, e.lesson);
      if (!Number.isInteger(e.from) || !Number.isInteger(e.to) || e.from > e.to) err(where + ": from/to არასწორია");
    });
    if (G.IMS_WHOAMI) G.IMS_WHOAMI.forCourse(c.id).forEach((h) => {
      const where = "whoami " + c.id + " „" + h.answer + "“";
      checkLessonRef(where, c.id, h.lesson);
      if (!G.IMS_WHOAMI.kinds[h.kind]) err(where + ": უცნობი kind " + h.kind);
      if (!Array.isArray(h.clues) || h.clues.length !== 4) err(where + ": 4 მინიშნება სჭირდება");
    });
    if (G.IMS_DETECTIVE) G.IMS_DETECTIVE.forCourse(c.id).forEach((d) => {
      checkLessonRef("detective " + d.id, c.id, d.lesson);
    });
    if (G.IMS_ILLUSTRATIONS) c.chapters.forEach((ch) => {
      G.IMS_ILLUSTRATIONS.forChapter(ch.id).forEach((card) => {
        if (card.after && !ch.lessons.some((l) => l.id === card.after)) err("illustrations " + card.id + ": after „" + card.after + "“ თავში " + ch.id + " არ არის");
      });
    });
  });
  if (G.IMS_DECIDE) G.IMS_DECIDE.scenarios.forEach((s) => {
    (s.lessons || []).forEach((lid) => checkLessonRef("decide " + s.id, s.course, lid));
  });

  /* ---------- 5. sw.js და HTML ---------- */

  const sw = readText("sw.js");
  if (!/const VERSION = "v\d+";/.test(sw)) err("sw.js: VERSION ვერ ვიპოვე");
  const coreBlock = (sw.split("CORE_FILES = [")[1] || "").split("];")[0];
  const core = new Set();
  (coreBlock.match(/"\.\/([^"]*)"/g) || []).forEach((q) => {
    const f = q.slice(3, -1);
    core.add(f);
    if (f && !exists(f)) err("sw.js CORE_FILES: ფაილი არ არსებობს — " + f);
  });

  const linked = new Set(); // ყველა JS/CSS, რომელსაც გვერდები ტვირთავს
  function isLazy(f) { return /^js\/data\//.test(f) || /-data\.js$/.test(f); }
  // შრიფტები: css/fonts.css-ის ყველა ფაილი არსებობს
  (readText("css/fonts.css").match(/url\("\.\.\/([^"]+)"\)/g) || []).forEach((u) => {
    const f = u.slice(8, -2);
    if (!exists(f)) err("css/fonts.css: შრიფტის ფაილი არ არსებობს — " + f);
  });

  const PAGES = ["index", "dashboard", "lesson", "games", "teacher", "decide", "whoami", "architect",
    "detective", "treasury", "progress"].map((n) => n + ".html");
  // CSP: ყველა გვერდზე ერთი და იგივე წესი (იხ. CLAUDE.md → უსაფრთხოება)
  const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; " +
    "font-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; " +
    "manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
  PAGES.forEach((page) => {
    if (!exists(page)) return err(page + ": გვერდი არ არსებობს");
    if (!core.has(page)) err(page + ": sw.js CORE_FILES-ში არ არის");
    const html = readText(page);
    const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/);
    if (!csp) err(page + ": CSP <meta> აკლია");
    else if (csp[1] !== CSP) err(page + ": CSP სხვა გვერდებს არ ემთხვევა");
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) err(page + ": inline <script> — CSP მას დაბლოკავს; გადაიტანე js/ ფაილში");
    if (/\sstyle="/i.test(html)) err(page + ": style=\"…\" — მხოლოდ კლასები (CLAUDE.md)");
    if (/<style[\s>]/i.test(html)) err(page + ": <style> ბლოკი — გადაიტანე css/ ფაილში");
    if (/\son[a-z]+="/i.test(html)) err(page + ": onclick=\"…\" და მსგავსი — CSP დაბლოკავს; გამოიყენე addEventListener");
    (html.match(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g) || []).forEach((tag) => {
      const url = tag.match(/(?:src|href)="([^"]+)"/)[1];
      if (/^https?:/.test(url)) {
        if (!/rel="canonical"|og:/.test(tag)) err(page + ": გარე ფაილი — " + url + " (CSP დაბლოკავს; ფაილი საიტზე უნდა იყოს)");
        return;
      }
      const f = url.replace(/^\.\//, "").split(/[?#]/)[0];
      if (!/\.(js|css|svg|png|json|woff2)$/.test(f)) return;
      if (exists(f)) linked.add(f);
      if (!exists(f)) err(page + ": ფაილი არ არსებობს — " + f);
      // მონაცემთა ფაილები (js/data/, *-data.js) წინასწარ არ იწერება — პირველი გამოყენებისას ქეშდება
      else if (/\.(js|css)$/.test(f) && !core.has(f) && !isLazy(f)) err(page + ": " + f + " sw.js CORE_FILES-ში არ არის");
      else if (isLazy(f) && core.has(f)) warn(f + ": მონაცემთა ფაილია — CORE_FILES-ში არ სჭირდება (წინასწარ ტვირთავს)");
    });
  });

  /* ---------- 6. უსაფრთხოება JS-ში (XSS) ---------- */

  // innerHTML/insertAdjacentHTML — მხოლოდ ჩვენს, კოდში ჩაწერილ SVG-ზე, მხოლოდ ამ ფაილებში.
  // ახალი ფაილი აქ ემატება მხოლოდ მაშინ, თუ HTML-ში მომხმარებლის/URL-ის ტექსტი არ ხვდება.
  const HTML_OK = { "js/beads.js": 1, "js/treasury.js": 1, "js/treasure.js": 1, "js/icons.js": 1, "js/ur-game.js": 1 };
  new Set([...core, ...linked]).forEach((f) => {
    if (!/^js\/.*\.js$/.test(f) || /^js\/data\//.test(f) || !exists(f)) return;
    const src = readText(f);
    if (/\beval\s*\(|new Function\s*\(|document\.write\s*\(/.test(src)) err(f + ": eval / new Function / document.write აკრძალულია");
    if (/\.(innerHTML|outerHTML)\s*\+?=(?!=)|insertAdjacentHTML\s*\(/.test(src) && !HTML_OK[f]) {
      err(f + ": innerHTML — გამოიყენე textContent / IMS_UTILS.createEl (XSS წესი, CLAUDE.md)");
    }
    if (/setAttribute\(\s*["']style["']|\.style\.cssText\s*=/.test(src)) err(f + ": style ატრიბუტი — CSP დაბლოკავს; გამოიყენე კლასი ან el.style.x");
  });

  return finish();

  function finish() {
    warnings.forEach((w) => out("  ! " + w));
    errors.forEach((e) => out("  ✗ " + e));
    out(errors.length
      ? "\nშემოწმება ვერ გავიდა: " + errors.length + " შეცდომა" + (warnings.length ? ", " + warnings.length + " გაფრთხილება" : "")
      : "\nშემოწმება გავიდა ✓" + (warnings.length ? " (" + warnings.length + " გაფრთხილება)" : ""));
    if (IS_NODE) process.exitCode = errors.length ? 1 : 0;
    else if (errors.length && typeof quit === "function") quit(1);
  }
})();
