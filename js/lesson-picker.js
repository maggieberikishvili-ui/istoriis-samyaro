/* ==========================================================
   ისტორიის სამყარო — მასალის არჩევა (მასწავლებლის რეჟიმი)
   ----------------------------------------------------------
   თავები ჩამრთველებით + ცალკეული გაკვეთილები (<details>-ში).
   საერთოა მასწავლებლის აქტივობებისთვის: ვიქტორინა (teacher.js),
   „ვინ ვარ მე?“ (whoami.js), „დროის ხაზის არქიტექტორი“ (architect.js).

   IMS_LESSON_PICKER.render(container, course, selected, onChange)
     course   — IMS_DATA.getCourse(...) (chapters[].lessons[])
     selected — Set გაკვეთილების id-ებით (პირდაპირ იცვლება)
     onChange — ეძახება ყოველი ცვლილების შემდეგ
   სტილი: css/teacher.css (.t-chapter, .t-check).
   ========================================================== */

(function () {
  "use strict";

  const { createEl, toRoman } = window.IMS_UTILS;

  function render(container, course, selected, onChange) {
    container.replaceChildren();
    course.chapters.forEach((chapter) => {
      if (!chapter.lessons.length) return;
      const box = createEl("div", "t-chapter");

      const head = createEl("label", "t-check t-check--chapter");
      const all = createEl("input");
      all.type = "checkbox";
      const count = createEl("span", "t-check__count");
      head.append(all, createEl("span", "", "თავი " + toRoman(chapter.number) + ". " + chapter.title), count);
      box.append(head);

      /** თავის ჩამრთველი და მრიცხველი არჩეული გაკვეთილების მიხედვით. */
      function syncHead() {
        const n = chapter.lessons.filter((l) => selected.has(l.id)).length;
        all.checked = n === chapter.lessons.length;
        all.indeterminate = n > 0 && n < chapter.lessons.length;
        count.textContent = n + " / " + chapter.lessons.length;
        return n;
      }

      all.addEventListener("change", () => {
        chapter.lessons.forEach((l) => (all.checked ? selected.add(l.id) : selected.delete(l.id)));
        render(container, course, selected, onChange);
        onChange();
      });

      const picked = syncHead();
      const details = createEl("details", "t-chapter__lessons");
      details.open = picked > 0 && picked < chapter.lessons.length;
      details.append(createEl("summary", "", "გაკვეთილები"));
      const list = createEl("div", "t-chapter__list");
      chapter.lessons.forEach((lesson, i) => {
        const row = createEl("label", "t-check");
        const check = createEl("input");
        check.type = "checkbox";
        check.checked = selected.has(lesson.id);
        check.addEventListener("change", () => {
          if (check.checked) selected.add(lesson.id);
          else selected.delete(lesson.id);
          syncHead(); // details გაშლილი რჩება
          onChange();
        });
        row.append(check, createEl("span", "", (i + 1) + ". " + lesson.title));
        list.append(row);
      });
      details.append(list);
      box.append(details);
      container.append(box);
    });
  }

  window.IMS_LESSON_PICKER = Object.freeze({ render: render });
})();
