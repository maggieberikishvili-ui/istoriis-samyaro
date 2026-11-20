/* tools/make-audio.py-ს დამხმარე (macOS-ის jsc ძრავისთვის):
   js/data/<კურსი>.js-ის შემდეგ ეშვება და ბეჭდავს თეორიულ ბარათებს JSON-ად:
   { "<გაკვეთილის id>": [{ i: ნაბიჯის ნომერი, title, paragraphs, fact }] } */
var out = {};
(globalThis.__course.chapters || []).forEach(function (chapter) {
  chapter.lessons.forEach(function (lesson) {
    out[lesson.id] = [];
    lesson.steps.forEach(function (step, i) {
      if (step.type !== "theory") return;
      out[lesson.id].push({ i: i, title: step.title || "", paragraphs: step.paragraphs || [], fact: step.fact || "" });
    });
  });
});
print(JSON.stringify(out));
