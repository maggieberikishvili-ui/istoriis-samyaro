/* ==========================================================
   ისტორიის სამყარო — საერთო დამხმარე ფუნქციები
   ----------------------------------------------------------
   ერთი ადგილი ფუნქციებისთვის, რომლებიც რამდენიმე გვერდს
   სჭირდება (lesson, games, dashboard, teacher, decide). ახალი ასლები
   სხვა ფაილებში ნუ დაემატება — აქ დაამატე.
   ჩატვირთვა: <script src="js/utils.js" defer></script> გვერდის
   სკრიპტამდე.
   ========================================================== */

(function () {
  "use strict";

  /** DOM ელემენტი კლასით და (სურვილისამებრ) ტექსტით. */
  function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** მასივის არეული ასლი (ორიგინალი არ იცვლება). */
  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** რიცხვი რომაულად (1–39): 4 → IV. */
  function toRoman(n) {
    const map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let out = "";
    map.forEach(([value, glyph]) => {
      while (n >= value) {
        out += glyph;
        n -= value;
      }
    });
    return out || String(n);
  }

  /** მთელ ეკრანზე გადართვა / დაბრუნება (პროექტორი). */
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }

  /**
   * „ნამდვილად გსურს?“ — საიტის სტილის ფანჯარა window.confirm-ის ნაცვლად
   * (გაკვეთილიდან/თამაშიდან გასვლა, ანგარიშიდან გასვლა და სხვა შეუქცევადი ნაბიჯები).
   *   opts: { title, text, ok = "დიახ", cancel = "არა, დავრჩები", danger = true }
   * აბრუნებს Promise<boolean>-ს: true — დაადასტურა. Esc / ფონზე დაჭერა / „არა“ → false.
   * ფოკუსი თავიდან „არა“-ზეა — შემთხვევითი Enter არაფერს წაშლის.
   */
  function confirmAction(opts) {
    const o = opts || {};
    return new Promise((resolve) => {
      const dialog = createEl("dialog", "confirm-dialog");
      dialog.setAttribute("aria-labelledby", "confirmTitle");
      const title = createEl("h2", "confirm-dialog__title", o.title || "ნამდვილად?");
      title.id = "confirmTitle";
      dialog.append(title);
      if (o.text) dialog.append(createEl("p", "confirm-dialog__text", o.text));
      const actions = createEl("div", "confirm-dialog__actions");
      const cancel = createEl("button", "btn btn--outline", o.cancel || "არა, დავრჩები");
      const ok = createEl("button", "btn " + (o.danger === false ? "" : "btn--danger"), o.ok || "დიახ");
      cancel.type = "button";
      ok.type = "button";
      actions.append(cancel, ok);
      dialog.append(actions);

      // პასუხი ერთხელ: ფანჯარა მაშინვე იხურება და იშლება (Esc-ზე ბრაუზერი თვითონ ხურავს → "close")
      let done = false;
      const close = (value) => {
        if (done) return;
        done = true;
        if (dialog.open) dialog.close();
        dialog.remove();
        resolve(value);
      };
      cancel.addEventListener("click", () => close(false));
      ok.addEventListener("click", () => close(true));
      dialog.addEventListener("click", (e) => { if (e.target === dialog) close(false); });
      dialog.addEventListener("close", () => close(false));

      (document.fullscreenElement || document.body).append(dialog);
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
        cancel.focus();
      } else {
        dialog.remove();
        resolve(window.confirm((o.title || "") + (o.text ? "\n" + o.text : "")));
      }
    });
  }

  window.IMS_UTILS = Object.freeze({ createEl, shuffle, toRoman, toggleFullscreen, confirmAction });
})();
