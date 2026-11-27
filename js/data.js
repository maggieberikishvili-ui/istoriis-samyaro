/* ==========================================================
   ისტორიის სამყარო — კურსებისა და გაკვეთილების სტრუქტურა
   ----------------------------------------------------------
   იერარქია:  კურსი → თავები (chapters) → გაკვეთილები (lessons)

     course  { id, badge, title, color, lessonPrefix, lessonCount }
             — აქ, COURSES სიაში (მხოლოდ სათაური და ფერი);
               თავები და გაკვეთილები — ცალკე ფაილში js/data/<id>.js:
               window.IMS_DATA.register({ id, chapters: [...] })
               (გვერდი ტვირთავს მხოლოდ საჭირო კლასის ფაილს;
               ახალი გაკვეთილისას გაზარდე lessonCount)
     chapter { id, title, description, sections?: [...], lessons: [...] }
     section { id, title, description, start: "პირველი გაკვეთილის id" }
       ქვეთავი (არასავალდებულო) — თავის გაკვეთილების ნაწილი, start-იდან
       შემდეგი ქვეთავის start-მდე. გაკვეთილები თავში რჩება (პროგრესი არ
       იცვლება); ფაილის ბოლოს ივსება section.lessons, section.number
       („1.2“) და lesson.sectionId.
     lesson  { id, title, description, xp, steps: [...] }

   ID-ების წესი (უნიკალური ყველა კურსში):
     თავი      g7-c1, g7-c2, …   (აბიტურიენტები: ne-c1, …)
     გაკვეთილი g7-l1, g7-l2, …   (აბიტურიენტები: ne-l1, …)
   გაკვეთილის id ინახება profile.completedLessons-ში და
   გადაეცემა lesson.html?course=...&lesson=... მისამართს —
   არსებული id-ების შეცვლა მომხმარებლის პროგრესს წაშლის!

   გაკვეთილები იხსნება თანმიმდევრობით მთელი კურსის მასშტაბით
   (თავი 1-ის ბოლო გაკვეთილის შემდეგ იხსნება თავი 2-ის პირველი).
   ფაილის ბოლოს course.lessons ავტომატურად ივსება ბრტყელი სიით.

   გაკვეთილის ნაბიჯები (steps) — ტიპები:
     theory    { title, icon, paragraphs: [...], fact? }
     choice    { question, options: [4], answer: index, explanation }
     truefalse { statement, answer: true|false, explanation }
     fill      { before, after, options: [...], answer: index, explanation }
     match     { prompt, pairs: [[მარცხენა, მარჯვენა], ...], explanation }

   ნებისმიერ ნაბიჯს (თეორიასა და კითხვას) შეიძლება ჰქონდეს სურათი:
     image: { src: "assets/images/ფაილი.jpg", caption: "სურ. 1. …", alt?: "…",
              credit?: "ფოტო: ავტორი (მოჭრილია)", licenseName?: "CC BY-SA 4.0",
              licenseUrl?: "https://…", sourceUrl?: "https://…" }
   (src — მხოლოდ assets/images/ საქაღალდიდან: jpg, png, webp, gif, svg, avif)
   რუკა: assets/images/map-<გაკვეთილი>.svg — იქმნება tools/make-map.py-ით; ბარათზე უფრო მაღალია
   და შეხებით სრული ზომით იხსნება.
   ========================================================== */

(function () {
  "use strict";

  const COURSES = [
    { id: "grade-7", badge: "7", title: "მე-7 კლასი", color: "green", lessonPrefix: "g7-l", lessonCount: 47 },
    { id: "grade-8", badge: "8", title: "მე-8 კლასი", color: "blue", lessonPrefix: "g8-l", lessonCount: 78 },
    { id: "grade-9", badge: "9", title: "მე-9 კლასი", color: "purple", lessonPrefix: "g9-l", lessonCount: 35 },
    { id: "grade-10", badge: "10", title: "მე-10 კლასი", color: "orange", lessonPrefix: "g10-l", lessonCount: 1 },
    { id: "grade-11", badge: "11", title: "მე-11 კლასი", color: "red", lessonPrefix: "g11-l", lessonCount: 1 },
    { id: "grade-12", badge: "12", title: "მე-12 კლასი", color: "teal", lessonPrefix: "g12-l", lessonCount: 1 },
    { id: "national-exams", badge: "🎓", title: "აბიტურიენტები", color: "gold", lessonPrefix: "ne-l", lessonCount: 1 },
  ];

  // კურსის ფაილები (js/data/<id>.js) — ამ სკრიპტის მისამართის მიხედვით
  const SELF = document.currentScript && document.currentScript.src;
  const BASE_URL = SELF ? SELF.replace(/data\.js(\?.*)?$/, "data/") : "js/data/";

  // ჯერ ჩაუტვირთავი კურსი: ცარიელი თავები/გაკვეთილები, loaded: false
  COURSES.forEach((course) => {
    course.loaded = false;
    course.chapters = [];
    course.lessons = [];
  });

  function getCourse(courseId) {
    return COURSES.find((c) => c.id === courseId) || null;
  }

  function getChapter(courseId, chapterId) {
    const course = getCourse(courseId);
    if (!course) return null;
    return course.chapters.find((ch) => ch.id === chapterId) || null;
  }

  function getLesson(courseId, lessonId) {
    const course = getCourse(courseId);
    if (!course) return null;
    return course.lessons.find((l) => l.id === lessonId) || null;
  }

  /* ----------------------------------------------------------
     კურსის ფაილის რეგისტრაცია (იძახებს js/data/<id>.js):
     ბრტყელი სია course.lessons (თავების რიგით) — გაკვეთილების
     გახსნის ლოგიკისა და სავარჯიშოსთვის; lesson.chapterId — უკუბმა.
     ---------------------------------------------------------- */
  function register(content) {
    const course = getCourse(content && content.id);
    if (!course) {
      console.warn("IMS_DATA: უცნობი კურსი — " + (content && content.id));
      return;
    }
    course.chapters = content.chapters;
    course.lessons = [];
    course.chapters.forEach((chapter, i) => {
      chapter.number = i + 1;
      chapter.lessons.forEach((lesson) => {
        lesson.chapterId = chapter.id;
        course.lessons.push(lesson);
      });
      // ქვეთავები: გაკვეთილები start-იდან შემდეგი ქვეთავის start-მდე
      const sections = chapter.sections || [];
      sections.forEach((section, k) => {
        section.number = chapter.number + "." + (k + 1);
        const from = chapter.lessons.findIndex((l) => l.id === section.start);
        const next = sections[k + 1];
        const to = next ? chapter.lessons.findIndex((l) => l.id === next.start) : chapter.lessons.length;
        section.lessons = from === -1 ? [] : chapter.lessons.slice(from, to === -1 ? chapter.lessons.length : to);
        section.lessons.forEach((lesson) => { lesson.sectionId = section.id; });
      });
    });
    course.loaded = true;
    validate(course);
  }

  /* ----------------------------------------------------------
     მონაცემების შემოწმება (კონტენტის დამატებისას შეცდომების
     დასაჭერად) — პრობლემას კონსოლში აჩვენებს
     ---------------------------------------------------------- */
  function validate(c) {
    const problems = [];
    const ids = [];
    if (c.lessons.length !== c.lessonCount) {
      problems.push(c.id + ": js/data.js-ში lessonCount = " + c.lessonCount + ", ფაილში კი " + c.lessons.length + " გაკვეთილია");
    }
    c.chapters.forEach((ch) => {
      ids.push(ch.id);
      (ch.sections || []).forEach((sec, k) => {
        ids.push(sec.id);
        const at = ch.lessons.findIndex((l) => l.id === sec.start);
        if (at === -1) problems.push(sec.id + ": start გაკვეთილი ამ თავში არ არის");
        if (k === 0 && at !== 0) problems.push(sec.id + ": პირველი ქვეთავი თავის პირველი გაკვეთილით უნდა იწყებოდეს");
        if (k > 0 && at <= ch.lessons.findIndex((l) => l.id === ch.sections[k - 1].start)) problems.push(sec.id + ": ქვეთავები გაკვეთილების რიგით უნდა იყოს");
      });
      ch.lessons.forEach((l) => {
        ids.push(l.id);
        if (c.lessonPrefix && l.id.indexOf(c.lessonPrefix) !== 0) problems.push(l.id + ": გაკვეთილის id უნდა იწყებოდეს „" + c.lessonPrefix + "“-ით");
        if (!Array.isArray(l.steps) || l.steps.length === 0) problems.push(l.id + ": steps ცარიელია");
        (l.steps || []).forEach((s, i) => {
          const where = l.id + " ნაბიჯი " + (i + 1);
          if ((s.type === "choice" || s.type === "fill") &&
              !(Number.isInteger(s.answer) && s.answer >= 0 && s.answer < (s.options || []).length)) {
            problems.push(where + ": answer არასწორია");
          }
          if (s.type === "choice" && (s.options || []).length !== 4) problems.push(where + ": ტესტს 4 ვარიანტი სჭირდება");
          if (s.type === "truefalse" && typeof s.answer !== "boolean") problems.push(where + ": answer უნდა იყოს true/false");
          if (s.image !== undefined) {
            const src = typeof s.image === "string" ? s.image : s.image && s.image.src;
            if (typeof src !== "string" || !/^assets\/images\/[^\s?#]+\.(jpe?g|png|webp|gif|svg|avif)$/i.test(src)) {
              problems.push(where + ": image.src უნდა იყოს assets/images/… (jpg, png, webp, gif, svg, avif, ჰარის გარეშე)");
            }
          }
          if (s.type === "match") {
            const left = new Set((s.pairs || []).map((p) => p[0]));
            const right = new Set((s.pairs || []).map((p) => p[1]));
            if (left.size !== (s.pairs || []).length || right.size !== (s.pairs || []).length) {
              problems.push(where + ": წყვილებში ტექსტი მეორდება");
            }
          }
        });
      });
    });
    // id უნიკალური უნდა იყოს ყველა ჩატვირთულ კურსს შორის
    const seen = new Set(COURSES.filter((o) => o !== c && o.loaded)
      .flatMap((o) => o.chapters.flatMap((ch) => [ch.id].concat((ch.sections || []).map((s) => s.id), ch.lessons.map((l) => l.id)))));
    COURSES.forEach((o) => seen.add(o.id));
    ids.forEach((id) => {
      if (seen.has(id)) problems.push("id მეორდება: " + id);
      seen.add(id);
    });
    if (problems.length) console.warn("IMS_DATA — მონაცემების შეცდომები:\n• " + problems.join("\n• "));
  }

  /* ----------------------------------------------------------
     ჩატვირთვა: მხოლოდ საჭირო კურსის ფაილი (<script> js/data/-დან)
     ---------------------------------------------------------- */
  const pending = {};

  function loadCourse(courseId) {
    const course = getCourse(courseId);
    if (!course) return Promise.reject(new Error("უცნობი კურსი: " + courseId));
    if (course.loaded) return Promise.resolve(course);
    if (!pending[courseId]) {
      pending[courseId] = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = BASE_URL + encodeURIComponent(course.id) + ".js";
        script.onload = () => {
          if (course.loaded) resolve(course);
          else reject(new Error(course.id + ": ფაილმა კურსი არ დაარეგისტრირა"));
        };
        script.onerror = () => {
          delete pending[courseId];
          script.remove();
          reject(new Error(course.id + ": ფაილი ვერ ჩაიტვირთა"));
        };
        document.head.append(script);
      });
    }
    return pending[courseId];
  }

  function load(courseIds) {
    return Promise.all(courseIds.map(loadCourse));
  }

  function loadAll() {
    return load(COURSES.map((c) => c.id));
  }

  /* ----------------------------------------------------------
     კითხვის „ანაბეჭდი“ — „ჩემი შეცდომებისთვის“ (profile.mistakes).
     კითხვას id არ აქვს, ამიტომ ვინახავთ გაკვეთილს, ნაბიჯის ნომერს
     და ტექსტის დასაწყისს: თუ გაკვეთილში ნაბიჯები გადაადგილდა,
     კითხვა ტექსტით მოიძებნება; თუ კითხვა წაიშალა — უბრალოდ გამოტოვდება.
     ---------------------------------------------------------- */
  const QUESTION_TYPES = ["choice", "truefalse", "fill", "match"];

  function isQuestion(step) {
    return Boolean(step) && QUESTION_TYPES.includes(step.type);
  }

  function stepFingerprint(step) {
    const text = step.question || step.statement || step.prompt ||
      ((step.before || "") + " … " + (step.after || ""));
    return step.type + ":" + String(text).trim().slice(0, 80);
  }

  /** შენახული შეცდომის კითხვა (ან null, თუ კითხვა აღარ არსებობს). */
  function findStep(courseId, lessonId, index, fingerprint) {
    const lesson = getLesson(courseId, lessonId);
    if (!lesson || !Array.isArray(lesson.steps)) return null;
    const byIndex = lesson.steps[index];
    if (isQuestion(byIndex) && stepFingerprint(byIndex) === fingerprint) return byIndex;
    return lesson.steps.find((s) => isQuestion(s) && stepFingerprint(s) === fingerprint) || null;
  }

  /** მიმდინარე კურსი: ?course=… → დაფაზე ბოლოს არჩეული → პირველი. */
  function currentCourseId() {
    const fromUrl = new URLSearchParams(window.location.search).get("course");
    if (getCourse(fromUrl)) return fromUrl;
    const store = window.IMS_STORE;
    const saved = store ? store.readString(store.KEYS.selectedCourse) : null;
    if (getCourse(saved)) return saved;
    return COURSES[0].id;
  }

  /** ჩატვირთვის შეცდომა — მოკლე შეტყობინება გვერდზე. */
  function showLoadError(err) {
    console.error(err);
    if (document.querySelector(".load-error")) return;
    const box = document.createElement("p");
    box.className = "alert alert--error load-error";
    box.setAttribute("role", "alert");
    box.textContent = "მასალა ვერ ჩაიტვირთა. შეამოწმე ინტერნეტი და განაახლე გვერდი.";
    document.body.prepend(box);
  }

  // გლობალური, მხოლოდ წასაკითხი წვდომა სხვა სკრიპტებისთვის
  window.IMS_DATA = Object.freeze({
    courses: COURSES,
    getCourse: getCourse,
    getChapter: getChapter,
    getLesson: getLesson,
    register: register,
    load: load,
    loadAll: loadAll,
    currentCourseId: currentCourseId,
    showLoadError: showLoadError,
    isQuestion: isQuestion,
    stepFingerprint: stepFingerprint,
    findStep: findStep,
  });
})();
