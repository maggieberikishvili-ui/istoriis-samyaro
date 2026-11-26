// გაკვეთილის ავტომატური „მოსწავლე“: გვერდზე ეშვება (page.evaluate) და ყოველ ნაბიჯს
// სწორი პასუხით გადის, მონაცემებიდან (IMS_DATA). აბრუნებს { steps } ან { error }.
// ფუნქცია თვითკმარია — Playwright მას ტექსტად გადასცემს ბრაუზერს.
function solveLesson(item) {
  const lesson = window.IMS_DATA.getLesson(item.course, item.lesson);
  if (!lesson) return { error: "გაკვეთილი ვერ მოიძებნა" };
  const $ = (sel) => document.querySelector(sel);
  const primary = $("#primaryBtn");
  const fail = (i, step, msg) => ({ error: "ნაბიჯი " + (i + 1) + " (" + step.type + "): " + msg });

  function clickPrimary() {
    if (primary.disabled) return false;
    primary.click();
    return true;
  }

  function pickOption(text) {
    const btn = Array.from(document.querySelectorAll("#stage .option")).find((b) => {
      const t = b.querySelector(".option__text");
      return (t ? t.textContent : b.textContent).trim() === String(text).trim();
    });
    if (!btn) return false;
    btn.click();
    return true;
  }

  for (let i = 0; i < lesson.steps.length; i++) {
    const step = lesson.steps[i];
    const type = step.type || "theory";

    if (type === "theory") {
      if (!$("#stage .theory")) return fail(i, step, "თეორიის ბარათი არ გამოჩნდა");
      if (!clickPrimary()) return fail(i, step, "„გაგრძელება“ გათიშულია");
      continue;
    }

    if (type === "choice" || type === "fill") {
      if (!pickOption(step.options[step.answer])) return fail(i, step, "სწორი ვარიანტი ვერ ვიპოვე: " + step.options[step.answer]);
    } else if (type === "truefalse") {
      if (!pickOption(step.answer ? "✓ სწორია" : "✕ მცდარია")) return fail(i, step, "სწორია/მცდარია ღილაკი ვერ ვიპოვე");
    } else if (type === "match") {
      const cols = document.querySelectorAll("#stage .match-col");
      if (cols.length !== 2) return fail(i, step, "წყვილების სვეტები ვერ ვიპოვე");
      for (let k = 0; k < step.pairs.length; k++) {
        const left = cols[0].querySelector('[data-pair="' + k + '"]');
        const right = cols[1].querySelector('[data-pair="' + k + '"]');
        if (!left || !right) return fail(i, step, "წყვილი " + (k + 1) + " ვერ ვიპოვე");
        left.click();
        right.click();
      }
    } else {
      return fail(i, step, "უცნობი ტიპი");
    }

    // match-ში შედეგი თავისით ჩნდება; დანარჩენში — „შემოწმება“
    if (type !== "match" && !clickPrimary()) return fail(i, step, "„შემოწმება“ გათიშულია");
    const title = $("#feedbackTitle");
    if ($("#feedback").hidden) return fail(i, step, "შედეგი არ გამოჩნდა");
    if (title && title.textContent.trim() === "არასწორია") {
      return fail(i, step, "სწორი პასუხი არასწორად ჩაითვალა — " + $("#feedbackText").textContent.slice(0, 120));
    }
    if (!clickPrimary()) return fail(i, step, "„გაგრძელება“ გათიშულია");
  }
  return { steps: lesson.steps.length };
}

module.exports = { solveLesson };
