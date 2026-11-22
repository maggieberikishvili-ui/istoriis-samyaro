/* ==========================================================
   Edubba — იშვიათი მძივები (ერთი ყელსაბამი მთელ ანგარიშზე)
   ----------------------------------------------------------
   მძივი კარგი ჩვევისთვის მოდის და არასოდეს იკარგება:
     🔥 სერია        — s7 / s30 / s100: სერია N დღე, როცა გაკვეთილს ან ვარჯიშს ამთავრებ
                        (მხოლოდ შესვლა მძივს არ იძლევა — sync() შედეგის ეკრანზე ეშვება);
     🔁 გასწორება    — f10 / f50 / f100: „ჩემი შეცდომებიდან“ სწორად გაცემული პასუხები
                        (profile.fixedCount, ითვლის storage.js → recordAnswer);
     🏆 რეკორდი      — r1–r5: თამაშის არსებული რეკორდის გაუმჯობესება (games.js → saveRecord);
     🎲 ური          — u1: პირველი მოგება კომპიუტერთან (js/ur-game.js).

   პროფილში: profile.beads = { "<მძივის id>": "YYYY-MM-DD" },
             profile.beadsNew = [id…] — ჯერ არნაჩვენები („ახალი მძივის“ შეტყობინება).
   გამოყენება:
     IMS_BEADS.give(id)            — მძივის მიცემა (თუ ჯერ არ აქვს)
     IMS_BEADS.showNew(box)        — sync() + ახალი მძივების შეტყობინება box-ში
     IMS_BEADS.state(profile)      — [{ bead, got, have, need }] — საგანძურის გვერდისთვის
     IMS_BEADS.svg(bead, empty)    — მძივის <svg>; inner(bead, empty) — მხოლოდ შიგთავსი
   ფერები — --gem-* და --bead-* (css/variables.css), სტილი — css/beads.css.
   ========================================================== */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const store = window.IMS_STORE;

  const GROUPS = [
    { id: "streak", title: "🔥 სერია", lead: "სერიის მძივს გაკვეთილის ან ვარჯიშის დასრულება მოგცემს — მხოლოდ აპის გახსნა არა.", beads: [
      { id: "s7", name: "სარდიონის ბურთულა", shape: "sphere", kind: "carnelian", cond: "7 დღე ზედიზედ", need: 7, count: "streak" },
      { id: "s30", name: "ლაჟვარდის ორკონუსა მძივი", shape: "bicone", kind: "lapis", cond: "30 დღე ზედიზედ", need: 30, count: "streak" },
      { id: "s100", name: "ოქროს ღარიანი მძივი", shape: "melon", kind: "gold", cond: "100 დღე ზედიზედ", need: 100, count: "streak" },
    ] },
    { id: "fix", title: "🔁 შეცდომების გასწორება", lead: "ითვლება სწორი პასუხი კითხვაზე, რომელიც „ჩემს შეცდომებში“ იყო.", beads: [
      { id: "f10", name: "ნიჟარის დისკო", shape: "disc", kind: "shell", cond: "10 გასწორებული შეცდომა", need: 10, count: "fixedCount" },
      { id: "f50", name: "ვერცხლის კასრისებრი მძივი", shape: "barrel", kind: "silver", cond: "50 გასწორებული შეცდომა", need: 50, count: "fixedCount" },
      { id: "f100", name: "მოხატული სარდიონი", shape: "etched", kind: "carnelian", cond: "100 გასწორებული შეცდომა", need: 100, count: "fixedCount",
        fact: "ასეთი თეთრად მოხატული სარდიონის მძივები ურის სამეფო სამარხებშია ნაპოვნი. მათი მოხატვის ტექნიკა ინდის ველზე გამოიგონეს." },
    ] },
    { id: "rec", title: "🏆 რეკორდები", lead: "თითო თამაშზე ერთი მძივი: დაამყარე რეკორდი და მერე ერთხელ მაინც გააუმჯობესე.", beads: [
      { id: "r1", name: "აქატი · დროსთან რბოლა", shape: "banded", kind: "agate", cond: "გააუმჯობესე რბოლის რეკორდი", game: "race" },
      { id: "r2", name: "აქატი · მეხსიერების ბარათები", shape: "banded", kind: "agate", cond: "გააუმჯობესე მეხსიერების რეკორდი", game: "memory" },
      { id: "r3", name: "აქატი · დროის ხაზის არქიტექტორი", shape: "banded", kind: "agate", cond: "გააუმჯობესე არქიტექტორის რეკორდი", game: "timeline" },
      { id: "r4", name: "აქატი · ვინ ვარ მე?", shape: "banded", kind: "agate", cond: "გააუმჯობესე „ვინ ვარ მე?“-ს რეკორდი", game: "who" },
      { id: "r5", name: "აქატი · დეტექტივი", shape: "banded", kind: "agate", cond: "გააუმჯობესე დეტექტივის რეკორდი", game: "detective" },
    ] },
    { id: "ur", title: "🎲 ურის სამეფო თამაში", lead: "ყველაზე ძველ სამაგიდო თამაშში გამარჯვება.", beads: [
      { id: "u1", name: "ლაჟვარდი ოქროს თავსახურებით", shape: "capped", kind: "lapis", cond: "პირველი მოგება კომპიუტერთან" },
    ] },
  ];
  const ALL = GROUPS.reduce((list, g) => list.concat(g.beads), []);
  const BY_ID = {};
  ALL.forEach((b) => { BY_ID[b.id] = b; });

  /** ყელსაბამზე რიგი: შუაში — ყველაზე იშვიათი, გვერდებზე სიმეტრიულად. */
  const ORDER = ["r1", "f10", "r2", "s7", "r3", "u1", "s100", "s30", "f50", "r4", "f100", "r5"];
  const BIG = { s100: 2.25, s30: 2.25, u1: 1.95, f100: 1.95 };
  const KINDS = ["carnelian", "lapis", "gold", "agate", "silver", "shell"];

  /* ---------- მიცემა ---------- */

  /** პროფილის შიგნით (updateProfile-ის mutator-ში): true, თუ მძივი ახლა დაემატა. */
  function addTo(p, id) {
    if (!BY_ID[id] || p.beads[id]) return false;
    p.beads[id] = store.todayKey();
    p.beadsNew.push(id);
    return true;
  }

  function give(id) {
    const p = store.loadProfile();
    if (!p || !BY_ID[id] || p.beads[id]) return false;
    let added = false;
    store.updateProfile((q) => { added = addTo(q, id); });
    return added;
  }

  function counted(p, b) {
    return b.count === "streak" ? store.toCount(p.streak, 0) : store.toCount(p.fixedCount, 0);
  }

  /** სერიისა და გასწორების ზღვრების შემოწმება (შედეგის ეკრანზე — ანუ საქმის შემდეგ). */
  function sync() {
    const p = store.loadProfile();
    if (!p) return;
    const due = ALL.filter((b) => b.need && !p.beads[b.id] && counted(p, b) >= b.need);
    if (due.length) store.updateProfile((q) => { due.forEach((b) => addTo(q, b.id)); });
  }

  /** ახალი მძივები (ჯერ არნაჩვენები) — და სიის გასუფთავება. */
  function takeNew() {
    sync();
    const p = store.loadProfile();
    if (!p || !p.beadsNew.length) return [];
    const ids = p.beadsNew.filter((id) => BY_ID[id]);
    store.updateProfile((q) => { q.beadsNew = []; });
    return ids.map((id) => BY_ID[id]);
  }

  function recordBead(game) {
    const b = ALL.find((x) => x.game === game);
    return b ? b.id : null;
  }

  /** საგანძურის გვერდისთვის: თითო მძივზე — აქვს თუ არა და (ზღვრიანზე) რამდენი აკლია. */
  function state(profile) {
    return ALL.map((b) => ({
      bead: b,
      got: Boolean(profile.beads[b.id]),
      have: b.need ? Math.min(counted(profile, b), b.need) : 0,
      need: b.need || 0,
    }));
  }

  /* ---------- ნახატი (viewBox 0 0 40 40, ნახვრეტი ჰორიზონტალურად) ---------- */

  /** გრადიენტები გვერდზე ერთხელ — ფერი stop-ის კლასიდან (inline სტილის გარეშე). */
  function ensureSprite() {
    if (document.getElementById("beadSprite")) return;
    const svg = document.createElementNS(NS, "svg");
    svg.id = "beadSprite";
    svg.setAttribute("class", "bead-sprite");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.innerHTML = "<defs>" + KINDS.map((k) =>
      '<radialGradient id="beadGrad-' + k + '" class="bead-k--' + k + '" cx=".35" cy=".3" r=".8">' +
      '<stop offset="0" class="bead-s-hi"/><stop offset=".5" class="bead-s-mid"/><stop offset="1" class="bead-s-lo"/>' +
      "</radialGradient>").join("") + "</defs>";
    document.body.append(svg);
  }

  function inner(b, empty) {
    ensureSprite();
    const f = empty ? 'class="bead-empty"' : 'fill="url(#beadGrad-' + b.kind + ')"';
    const gl = (x, y, rx, ry) => (empty ? "" : '<ellipse class="bead-gl" cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '"/>');
    const k = " bead-k--" + b.kind;
    switch (b.shape) {
      case "sphere":
        return '<circle ' + f + ' cx="20" cy="20" r="11"/>' + gl(16, 15, 4, 2.6);
      case "bicone":
        return '<path ' + f + ' d="M5 20 L20 10 L35 20 L20 30 Z"/>' +
          (empty ? "" : '<path class="bead-lo' + k + '" d="M5 20 L20 30 L35 20 L20 23 Z"/><circle class="bead-fl" cx="14" cy="18" r=".8"/><circle class="bead-fl" cx="24" cy="16" r=".6"/><circle class="bead-fl" cx="27" cy="22" r=".7"/>') +
          gl(16, 15, 4.5, 1.6);
      case "melon":
        return '<ellipse ' + f + ' cx="20" cy="20" rx="13" ry="11"/>' +
          (empty ? "" : [10, 15, 20, 25, 30].map((x) => '<path class="bead-flute' + k + '" d="M' + x + " 9.6 Q" + (x + (x - 20) * 0.35) + " 20 " + x + ' 30.4"/>').join("")) +
          gl(15, 14, 4, 2.4);
      case "disc":
        return '<rect ' + f + ' x="15" y="7" width="10" height="26" rx="4"/>' + gl(18, 12, 1.6, 3);
      case "barrel":
        return '<path ' + f + ' d="M8 13 Q20 9 32 13 Q34 20 32 27 Q20 31 8 27 Q6 20 8 13 Z"/>' + gl(15, 14.5, 5, 1.8);
      case "etched":
        return '<path ' + f + ' d="M6 14 Q20 9 34 14 Q36 20 34 26 Q20 31 6 26 Q4 20 6 14 Z"/>' +
          (empty ? "" : '<circle class="bead-etch" cx="13" cy="20" r="3.4"/><circle class="bead-etch" cx="27" cy="20" r="3.4"/><path class="bead-etch" d="M17.5 15 Q20 20 17.5 25 M22.5 15 Q20 20 22.5 25"/>');
      case "banded":
        return '<path ' + f + ' d="M8 12.5 Q20 9 32 12.5 Q34 20 32 27.5 Q20 31 8 27.5 Q6 20 8 12.5 Z"/>' +
          (empty ? "" : '<path class="bead-band' + k + '" d="M12 11 Q14.5 20 12 29 M17 10.2 Q19 20 17 29.8 M24 10.2 Q22 20 24 29.8"/>') +
          gl(28, 14, 2.4, 1.5);
      case "capped":
        return '<ellipse ' + f + ' cx="20" cy="20" rx="9.5" ry="9"/>' +
          (empty
            ? '<path class="bead-empty" d="M6 13 H11 V27 H6 Z M29 13 H34 V27 H29 Z"/>'
            : '<rect class="bead-cap" x="5" y="13" width="6" height="14" rx="1.5"/><rect class="bead-cap" x="29" y="13" width="6" height="14" rx="1.5"/><circle class="bead-fl" cx="17" cy="23" r=".8"/><circle class="bead-fl" cx="23" cy="17" r=".7"/>') +
          gl(17, 15.5, 3.2, 2);
      default:
        return "";
    }
  }

  function svg(b, empty, cls) {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 40 40");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    s.setAttribute("class", "bead-art" + (cls ? " " + cls : ""));
    s.innerHTML = inner(b, empty);
    return s;
  }

  /* ---------- „ახალი მძივი“ შედეგის ეკრანზე ---------- */

  function toastText(b) {
    if (b.count === "streak") return b.need + " დღე ზედიზედ — ყელსაბამს დაემატა.";
    if (b.count === "fixedCount") return b.need + " შეცდომა გაასწორე — ყელსაბამს დაემატა.";
    if (b.game) return "რეკორდი გააუმჯობესე — ყელსაბამს დაემატა.";
    return "პირველი მოგება ურში — ყელსაბამს დაემატა.";
  }

  /** box — ცარიელი კონტეინერი შედეგის ეკრანზე; ახალი მძივის გარეშე დამალული რჩება. */
  function showNew(box) {
    if (!box) return;
    const fresh = takeNew();
    box.replaceChildren();
    box.hidden = fresh.length === 0;
    fresh.forEach((b) => {
      const toast = document.createElement("a");
      toast.className = "bead-toast";
      toast.href = store.URLS.treasury + "#beads";
      const text = document.createElement("div");
      const kicker = document.createElement("small");
      kicker.textContent = "✦ ახალი მძივი";
      const name = document.createElement("b");
      name.textContent = b.name;
      const line = document.createElement("span");
      line.textContent = toastText(b);
      text.append(kicker, name, line);
      toast.append(svg(b, false, "bead-toast__art"), text);
      box.append(toast);
    });
  }

  window.IMS_BEADS = Object.freeze({
    GROUPS: GROUPS,
    ALL: ALL,
    ORDER: ORDER,
    BIG: BIG,
    byId: (id) => BY_ID[id] || null,
    give: give,
    sync: sync,
    recordBead: recordBead,
    state: state,
    inner: inner,
    svg: svg,
    showNew: showNew,
  });
})();
