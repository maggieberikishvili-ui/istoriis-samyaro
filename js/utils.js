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

  window.IMS_UTILS = Object.freeze({ createEl, shuffle, toRoman, toggleFullscreen });
})();
