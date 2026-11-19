/* ==========================================================
   ისტორიის სამყარო — „დროში მოგზაურის დეტექტივი“: დოკუმენტი
   ----------------------------------------------------------
   საერთო ძრავა მოსწავლის თამაშისთვის (detective-game.js, games.html)
   და მასწავლებლის აქტივობისთვის (detective.js, detective.html).
   საქმეები და ტექსტის ფორმატი — js/detective-data.js.

   const board = IMS_DETECTIVE_BOARD.create({ doc, evidence, caseData, onChange, onLimit });
     doc      — ელემენტი, სადაც დოკუმენტი იწყობა
     evidence — <ol>, სადაც შემოწმების შემდეგ განმარტებები ჩნდება
     onChange(marked, needed) — მონიშვნის ყოველი ცვლილებისას
     onLimit()                — როცა უკვე needed დეტალია მონიშნული
   board.reveal() → { found, wrong, missed, needed, score }
     score = ნაპოვნი − ტყუილად მონიშნული (0-ზე ნაკლები არა)
   ========================================================== */

(function () {
  "use strict";

  const { createEl } = window.IMS_UTILS;

  function create(opts) {
    const parts = window.IMS_DETECTIVE.parse(opts.caseData.text);
    const fakes = parts.filter((p) => p.kind === "fake");
    const needed = fakes.length;
    const onChange = opts.onChange || function () {};
    const onLimit = opts.onLimit || function () {};
    const marked = new Set();
    const buttons = new Map();
    let revealed = false;

    /* ---------- დოკუმენტი ---------- */

    opts.doc.replaceChildren();
    opts.doc.classList.add("dt-doc");
    opts.doc.append(
      createEl("p", "dt-doc__source", "📜 " + opts.caseData.source),
      createEl("h2", "dt-doc__title", opts.caseData.title)
    );

    const body = createEl("p", "dt-doc__text");
    parts.forEach((part) => {
      if (part.kind === "plain") {
        body.append(document.createTextNode(part.text));
        return;
      }
      // <span role="button">, არა <button>: ღილაკი ხაზზე არ იყოფა და გრძელი დეტალი ტექსტს „ამტვრევს“
      const btn = createEl("span", "dt-detail");
      btn.setAttribute("role", "button");
      btn.tabIndex = 0;
      btn.setAttribute("aria-pressed", "false");
      btn.append(createEl("span", "dt-detail__text", part.text));
      btn.addEventListener("click", () => toggle(part));
      btn.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        toggle(part);
      });
      buttons.set(part, btn);
      body.append(btn);
    });
    opts.doc.append(body);

    opts.evidence.replaceChildren();
    opts.evidence.hidden = true;

    function toggle(part) {
      if (revealed) return;
      if (marked.has(part)) {
        marked.delete(part);
      } else {
        if (marked.size >= needed) {
          onLimit();
          return;
        }
        marked.add(part);
      }
      const btn = buttons.get(part);
      btn.classList.toggle("is-marked", marked.has(part));
      btn.setAttribute("aria-pressed", String(marked.has(part)));
      onChange(marked.size, needed);
    }

    /* ---------- შემოწმება ---------- */

    function reveal() {
      revealed = true;
      let found = 0;
      let wrong = 0;

      buttons.forEach((btn, part) => {
        btn.tabIndex = -1;
        btn.setAttribute("aria-disabled", "true");
        btn.removeAttribute("aria-pressed");
        btn.classList.remove("is-marked");
        const isMarked = marked.has(part);
        if (part.kind === "fake") {
          if (isMarked) found += 1;
          btn.classList.add(isMarked ? "is-caught" : "is-missed");
          btn.append(createEl("span", "dt-detail__fix", part.anachronism ? "🕰️" : "→ " + part.fix));
        } else if (isMarked) {
          wrong += 1;
          btn.classList.add("is-false-alarm");
        }
      });

      opts.evidence.replaceChildren();
      fakes.forEach((part) => {
        const caught = marked.has(part);
        const li = createEl("li", "dt-clue " + (caught ? "is-caught" : "is-missed"));
        li.append(
          createEl("span", "dt-clue__status", caught ? "✓ ნაპოვნია" : "✗ გამოგრჩა"),
          createEl("span", "dt-clue__kind", part.anachronism ? "🕰️ ანაქრონიზმი" : "📜 ფაქტის შეცდომა"),
          createEl("span", "dt-clue__fake", "„" + part.text + "“"),
          createEl("span", "dt-clue__why", part.why)
        );
        opts.evidence.append(li);
      });
      parts.filter((p) => p.kind === "true" && marked.has(p)).forEach((part) => {
        const li = createEl("li", "dt-clue is-false-alarm");
        li.append(
          createEl("span", "dt-clue__status", "⚠ ტყუილი ეჭვი"),
          createEl("span", "dt-clue__fake", "„" + part.text + "“"),
          createEl("span", "dt-clue__why", "ეს დეტალი სწორია — ასე წერია გაკვეთილში.")
        );
        opts.evidence.append(li);
      });
      opts.evidence.hidden = false;

      return { found: found, wrong: wrong, missed: needed - found, needed: needed, score: Math.max(0, found - wrong) };
    }

    onChange(0, needed);

    return {
      needed: needed,
      marked: () => marked.size,
      reveal: reveal,
      /** ყალბი დეტალები (მოსწავლის „შეცდომების მიმოხილვისთვის“). */
      fakes: () => fakes.slice(),
      isMarked: (part) => marked.has(part),
    };
  }

  window.IMS_DETECTIVE_BOARD = Object.freeze({ create: create });
})();
