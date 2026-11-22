/* ==========================================================
   Edubba — საგანძური: ბლოკები, ლითონი და განძების ნახატები
   ----------------------------------------------------------
   ერთი გაკვეთილი = ერთი ქვა (js/gems.js); ერთი ბლოკი = ერთი განძი.
   ბლოკი — ქვეთავი, თუ თავს ქვეთავები აქვს; თუ არა — მთელი თავი.
   ყველაფერი ერთი კლასის შიგნით მუშაობს (მე-7 კლასელი მე-8-ს არ გადის).

   ლითონი ხარისხზეა დამოკიდებული და არასოდეს ჩამოდის:
     ბრინჯაო — ბლოკის ყველა გაკვეთილი დასრულებულია;
     ვერცხლი — ყველა ქვა გაპრიალებულია (profile.gems);
     ოქრო    — თითო გაკვეთილი ერთხელ მაინც გამეორებულია (profile.gemReviewed).

   გამოყენება (საგანძურის გვერდი, დაფის ბარათი, ურის თამაში):
     IMS_TREASURE.blocks(course)               — ბლოკების სია
     IMS_TREASURE.blockState(block, profile)    — { tier, done, total, rough, reviewed }
     IMS_TREASURE.progress(course, profile)     — { done, total, pct }
     IMS_TREASURE.firstBlockDone(course, profile)
     IMS_TREASURE.urDecoLevel(course, profile)  — ურის დაფის მორთულობა 0–2
     IMS_TREASURE.friezeUnlocked(profile)       — ფრიზის ფერის არჩევა გახსნილია?
     IMS_TREASURE.art(itemId, tier, locked)     — <svg> ნახატი
   ფერები — css/treasure.css (--tr-* ცვლადები css/variables.css-ში).
   ========================================================== */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  /** განძების კატალოგი — ერთი სია ყველა კლასისთვის; ბლოკი N იღებს N-ე ნივთს. */
  const CATALOG = [
    { id: "lyre", name: "ხარისთავიანი ლირა" },
    { id: "standard", name: "ურის შტანდარტი" },
    { id: "helmet", name: "მეომრის ჩაფხუტი" },
    { id: "dagger", name: "სამეფო ხანჯალი" },
    { id: "board", name: "ურის სათამაშო დაფა" },
    { id: "diadem", name: "დიადემა" },
    { id: "seal", name: "ცილინდრული საბეჭდავი" },
    { id: "cup", name: "ღარიანი სასმისი" },
  ];

  const TIER_NAMES = { bronze: "ბრინჯაო", silver: "ვერცხლი", gold: "ოქრო", progress: "მიმდინარე", locked: "დაფარული" };
  const METALS = ["bronze", "silver", "gold"];

  // გახსნები კლასის პროცენტით (ურის თამაში — პირველი დასრულებული ბლოკით)
  const UNLOCK_INLAY = 25;   // ურის დაფაზე პირველი ლაჟვარდის ჩასმები
  const UNLOCK_FRIEZE = 50;  // ფრიზის ფერის არჩევა (ფრიზი ერთია — საკმარისია ერთი კლასის 50%)
  const UNLOCK_FULL = 100;   // დაფა სრულად მოჭედილი

  /* ---------- ბლოკები ---------- */

  function blocks(course) {
    const out = [];
    course.chapters.forEach((ch, ci) => {
      const sections = ch.sections || [];
      if (sections.length) {
        sections.forEach((sec) => {
          out.push({
            id: sec.id,
            unit: "ქვეთავი",
            number: sec.number,
            title: sec.title,
            lessons: course.lessons.filter((l) => l.sectionId === sec.id),
          });
        });
      } else {
        out.push({
          id: ch.id,
          unit: "თავი",
          number: window.IMS_UTILS.toRoman(ci + 1),
          title: ch.title,
          lessons: ch.lessons.slice(),
        });
      }
    });
    return out
      .filter((b) => b.lessons.length)
      .map((b, i) => Object.assign(b, { index: i, item: CATALOG[i % CATALOG.length] }));
  }

  function blockState(block, profile) {
    const done = new Set(profile ? profile.completedLessons : []);
    const store = window.IMS_STORE;
    const total = block.lessons.length;
    const finished = block.lessons.filter((l) => done.has(l.id));
    const rough = finished.filter((l) => store.gemState(profile, l.id) === "rough").length;
    const reviewed = finished.filter((l) => profile && profile.gemReviewed && profile.gemReviewed[l.id]).length;
    let tier = "gold";
    if (finished.length === 0) tier = "locked";
    else if (finished.length < total) tier = "progress";
    else if (rough) tier = "bronze";
    else if (reviewed < total) tier = "silver";
    return { tier: tier, done: finished.length, total: total, rough: rough, reviewed: reviewed };
  }

  const isMetal = (tier) => METALS.includes(tier);

  function progress(course, profile) {
    const done = new Set(profile ? profile.completedLessons : []);
    const total = course.lessons.length;
    const count = course.lessons.filter((l) => done.has(l.id)).length;
    return { done: count, total: total, pct: total ? Math.floor((count / total) * 100) : 0 };
  }

  function firstBlockDone(course, profile) {
    return blocks(course).some((b) => isMetal(blockState(b, profile).tier));
  }

  /** ურის დაფის ფირფიტები: 0 — მხოლოდ კვეთა, 1 — ნაწილობრივ ლაჟვარდი (25%), 2 — სრულად (100%). */
  function urDecoLevel(course, profile) {
    const pct = progress(course, profile).pct;
    return pct >= UNLOCK_FULL ? 2 : pct >= UNLOCK_INLAY ? 1 : 0;
  }

  /** ფრიზის ფერის არჩევა: რომელიმე კლასში გავლილია ≥ 50% (კლასის ფაილის ჩატვირთვა არ სჭირდება). */
  function friezeUnlocked(profile) {
    const done = profile ? profile.completedLessons : [];
    return window.IMS_DATA.courses.some((c) => {
      const total = c.loaded ? c.lessons.length : c.lessonCount;
      const count = done.filter((id) => id.startsWith(c.lessonPrefix)).length;
      return total > 0 && (count / total) * 100 >= UNLOCK_FRIEZE;
    });
  }

  /** ბლოკები, რომლებმაც ახალ ლითონს მიაღწიეს, მაგრამ მოსწავლეს ჯერ არ უნახავს (profile.treasury). */
  function unseen(course, profile) {
    const seen = (profile && profile.treasury) || {};
    return blocks(course)
      .map((b) => ({ block: b, state: blockState(b, profile) }))
      .filter((x) => isMetal(x.state.tier) && METALS.indexOf(x.state.tier) > METALS.indexOf(seen[x.block.id]));
  }

  /* ---------- ნახატები (viewBox 0 0 100 100) ----------
     m — ლითონი (გრადიენტი ლითონის მიხედვით), md — ლითონის ჩრდილი, k/ko — კვეთა და კონტური,
     lp — ლაჟვარდი, cr — სარდიონი, sh — ნიჟარა, fl — ოქროსფერი ნაპერწკალი. */
  const ART = {
    lyre() {
      let h = '<rect class="tr-m" x="32" y="52" width="54" height="34" rx="2"/><rect class="tr-md" x="32" y="80" width="54" height="6"/>' +
        '<rect class="tr-sh" x="38" y="58" width="14" height="18"/><rect class="tr-lp" x="54" y="58" width="9" height="18"/><rect class="tr-sh" x="65" y="58" width="15" height="18"/>' +
        '<path class="tr-k" d="M38 67 H52 M65 67 H80"/>' +
        '<rect class="tr-m" x="37" y="16" width="5" height="38"/><rect class="tr-m" x="78" y="9" width="5" height="45"/>' +
        '<path class="tr-m" d="M33 18 L88 9 L88 14 L33 23Z"/>';
      for (let x = 46; x <= 74; x += 7) h += '<path class="tr-k" d="M' + x + " 53 L" + x + " " + (21 - (x - 33) * 0.16) + '"/>';
      h += '<path class="tr-m" d="M12 30 Q8 20 13 15 Q15 24 21 30Z M34 30 Q38 20 33 15 Q31 24 25 30Z"/>' +
        '<path class="tr-m" d="M13 34 Q23 26 33 34 L32 52 Q23 60 14 52Z"/>' +
        '<circle class="tr-lp" cx="18.5" cy="40" r="1.8"/><circle class="tr-lp" cx="27.5" cy="40" r="1.8"/>' +
        '<path class="tr-lp" d="M15 54 H31 L29 78 Q23 82 17 78Z"/><path class="tr-k" d="M19 57 V77 M23 57 V79 M27 57 V77"/>' +
        '<path class="tr-ko" d="M32 52 H86 V86 H32Z"/>';
      return h;
    },
    standard() {
      const xl = (y) => 20 - ((y - 16) * 6) / 70;
      const xr = (y) => 80 + ((y - 16) * 6) / 70;
      let h = '<path class="tr-m" d="M20 16 H80 L86 86 H14Z"/>';
      [[20, 37], [42, 59], [64, 82]].forEach(([a, b], r) => {
        h += '<path class="tr-lp" d="M' + (xl(a) + 3) + " " + a + " H" + (xr(a) - 3) + " L" + (xr(b) - 3) + " " + b + " H" + (xl(b) + 3) + 'Z"/>';
        const n = 5 + r;
        const w = (xr(b) - xl(b) - 10) / n;
        for (let i = 0; i < n; i++) {
          const cx = xl(b) + 7 + w * i + w / 2;
          h += '<circle class="tr-sh" cx="' + cx + '" cy="' + (a + 4.5) + '" r="2"/><rect class="tr-sh" x="' + (cx - 2) + '" y="' + (a + 7) + '" width="4" height="' + (b - a - 10) + '" rx="1.2"/>';
        }
      });
      h += '<path class="tr-cr" d="M' + xl(38.5) + " 38.5 H" + xr(38.5) + " L" + xr(40.5) + " 40.5 H" + xl(40.5) + "Z M" + xl(60.5) + " 60.5 H" + xr(60.5) + " L" + xr(62.5) + " 62.5 H" + xl(62.5) + 'Z"/>' +
        '<path class="tr-ko" d="M20 16 H80 L86 86 H14Z"/>';
      return h;
    },
    helmet() {
      return '<path class="tr-m" d="M20 62 Q16 18 50 14 Q84 18 80 62 L75 80 Q65 76 63 62 L37 62 Q35 76 25 80Z"/>' +
        '<ellipse class="tr-md" cx="50" cy="15" rx="14" ry="4"/>' +
        '<path class="tr-k" d="M26 30 Q34 25 42 30 Q50 25 58 30 Q66 25 74 30 M23 39 Q32 34 41 39 Q50 34 59 39 Q68 34 77 39 M22 48 Q31 43 40 48 Q50 43 60 48 Q69 43 78 48"/>' +
        '<ellipse class="tr-md" cx="33" cy="64" rx="4" ry="6"/><ellipse class="tr-md" cx="67" cy="64" rx="4" ry="6"/>' +
        '<path class="tr-ko" d="M20 62 Q16 18 50 14 Q84 18 80 62 L75 80 Q65 76 63 62 L37 62 Q35 76 25 80Z"/>';
    },
    dagger() {
      return '<g transform="rotate(-28 50 50)">' +
        '<path class="tr-m" d="M50 4 L58 20 L58 60 L42 60 L42 20Z"/><path class="tr-k" d="M50 9 V58"/>' +
        '<rect class="tr-m" x="34" y="60" width="32" height="6" rx="2"/>' +
        '<rect class="tr-lp" x="44" y="66" width="12" height="22" rx="2"/>' +
        '<circle class="tr-fl" cx="47" cy="72" r=".8"/><circle class="tr-fl" cx="53" cy="79" r=".7"/><circle class="tr-fl" cx="48" cy="84" r=".6"/>' +
        '<circle class="tr-m" cx="50" cy="70" r="1.6"/><circle class="tr-m" cx="50" cy="77" r="1.6"/><circle class="tr-m" cx="50" cy="84" r="1.6"/>' +
        '<circle class="tr-m" cx="50" cy="93" r="5.5"/><path class="tr-ko" d="M50 4 L58 20 L58 60 L42 60 L42 20Z"/></g>';
    },
    board() {
      let h = '<rect class="tr-m" x="6" y="32" width="88" height="36" rx="3"/>';
      const ros = (l, i) => (l !== 1 && (i === 0 || i === 6)) || (l === 1 && i === 3);
      for (let l = 0; l < 3; l++) {
        for (let i = 0; i < 8; i++) {
          if (l !== 1 && (i === 4 || i === 5)) continue;
          const x = 9 + i * 10.4;
          const y = 35 + l * 10.4;
          h += '<rect class="tr-sh" x="' + x + '" y="' + y + '" width="9.4" height="9.4" rx="1"/>';
          if (ros(l, i)) h += '<circle class="tr-lp" cx="' + (x + 4.7) + '" cy="' + (y + 4.7) + '" r="3.6"/><circle class="tr-cr" cx="' + (x + 4.7) + '" cy="' + (y + 4.7) + '" r="1.3"/>';
          else if ((l + i) % 2) h += '<circle class="tr-lp" cx="' + (x + 4.7) + '" cy="' + (y + 4.7) + '" r="1.4"/>';
          else {
            h += '<circle class="tr-lp" cx="' + (x + 2.6) + '" cy="' + (y + 2.6) + '" r=".9"/><circle class="tr-lp" cx="' + (x + 6.8) + '" cy="' + (y + 6.8) + '" r=".9"/>' +
              '<circle class="tr-cr" cx="' + (x + 6.8) + '" cy="' + (y + 2.6) + '" r=".9"/><circle class="tr-cr" cx="' + (x + 2.6) + '" cy="' + (y + 6.8) + '" r=".9"/>';
          }
        }
      }
      return h + '<rect class="tr-ko" x="6" y="32" width="88" height="36" rx="3"/>';
    },
    diadem() {
      let h = '<path class="tr-m" d="M8 62 Q50 38 92 62 L92 69 Q50 45 8 69Z"/>';
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const x = 8 + 84 * t;
        const y = 62 - 24 * 4 * t * (1 - t) * 0.55 + 7;
        h += '<circle class="' + (k % 2 ? "tr-lp" : "tr-cr") + '" cx="' + x + '" cy="' + (y + 4) + '" r="2.4"/>';
      }
      for (let k = 1; k < 12; k += 2) {
        const t = k / 12;
        const x = 8 + 84 * t;
        const y = 62 - 24 * 4 * t * (1 - t) * 0.55;
        const rot = ' transform="rotate(' + (t - 0.5) * 40 + " " + x + " " + y + ')"';
        h += '<ellipse class="tr-m" cx="' + x + '" cy="' + (y - 9) + '" rx="3.6" ry="8"' + rot + '/><path class="tr-k" d="M' + x + " " + (y - 2) + " V" + (y - 15) + '"' + rot + "/>";
      }
      [[30, 36], [50, 28], [70, 36]].forEach(([x, y]) => {
        for (let a = 0; a < 360; a += 45) h += '<ellipse class="tr-m" cx="' + x + '" cy="' + (y - 5) + '" rx="2.2" ry="4.6" transform="rotate(' + a + " " + x + " " + y + ')"/>';
        h += '<circle class="tr-cr" cx="' + x + '" cy="' + y + '" r="2.6"/>';
      });
      return h;
    },
    seal() {
      return '<rect class="tr-lp" x="12" y="24" width="28" height="54"/>' +
        '<circle class="tr-fl" cx="18" cy="36" r=".9"/><circle class="tr-fl" cx="30" cy="48" r=".8"/><circle class="tr-fl" cx="22" cy="60" r="1"/><circle class="tr-fl" cx="34" cy="66" r=".7"/>' +
        '<rect class="tr-m" x="12" y="20" width="28" height="7"/>' +
        '<ellipse class="tr-m" cx="26" cy="20" rx="14" ry="4"/><ellipse class="tr-md" cx="26" cy="82" rx="14" ry="4"/><rect class="tr-m" x="12" y="75" width="28" height="7"/>' +
        '<ellipse class="tr-ko" cx="26" cy="20" rx="14" ry="4"/>' +
        '<rect class="tr-sh" x="48" y="34" width="44" height="34" rx="2"/>' +
        '<path class="tr-k" d="M56 62 V48 M56 44 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M52 54 H60 M70 62 V48 M70 44 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M66 52 L74 56 M82 62 L86 44 L78 44 Z"/>';
    },
    cup() {
      let h = '<path class="tr-m" d="M22 20 H78 Q77 52 50 60 Q23 52 22 20Z"/>';
      for (let x = 30; x <= 70; x += 8) h += '<path class="tr-k" d="M' + x + " 24 Q" + (x + (50 - x) * 0.25) + " 44 " + (50 + (x - 50) * 0.4) + ' 56"/>';
      h += '<path class="tr-lp" d="M22.4 25 H77.6 L77.2 29 H22.8Z"/><ellipse class="tr-m" cx="50" cy="20" rx="28" ry="4.5"/><ellipse class="tr-md" cx="50" cy="20" rx="24" ry="2.8"/>' +
        '<rect class="tr-md" x="46" y="58" width="8" height="18"/><ellipse class="tr-m" cx="50" cy="80" rx="19" ry="5"/>' +
        '<path class="tr-ko" d="M22 20 H78 Q77 52 50 60 Q23 52 22 20Z"/>';
      return h;
    },
  };

  /** ლითონის გრადიენტები — გვერდზე ერთხელ (ნახატი მათ id-ით მიმართავს, inline სტილის გარეშე). */
  function ensureSprite() {
    if (document.getElementById("trSprite")) return;
    const svg = document.createElementNS(NS, "svg");
    svg.id = "trSprite";
    svg.setAttribute("class", "tr-sprite");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.innerHTML = "<defs>" + METALS.map((m) =>
      '<linearGradient id="trGrad-' + m + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" class="tr-s-hi tr-s--' + m + '"/><stop offset=".45" class="tr-s-mid tr-s--' + m + '"/><stop offset="1" class="tr-s-lo tr-s--' + m + '"/>' +
      "</linearGradient>").join("") + "</defs>";
    document.body.append(svg);
  }

  /**
   * განძის ნახატი. tier — "bronze" | "silver" | "gold" (ლითონი);
   * locked — სილუეტი (ჯერ დაუმთავრებელი ბლოკი), question — სილუეტზე „?“ (ჯერ დაუწყებელი).
   */
  function art(itemId, tier, opts) {
    ensureSprite();
    const o = opts || {};
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const metal = isMetal(tier) ? tier : "bronze";
    svg.setAttribute("class", "tr-art tr-art--" + metal + (o.locked ? " tr-art--sil" : ""));
    svg.innerHTML = ART[itemId]() + (o.question ? '<text class="tr-q" x="50" y="58" text-anchor="middle">?</text>' : "");
    return svg;
  }

  window.IMS_TREASURE = Object.freeze({
    CATALOG: CATALOG,
    TIER_NAMES: TIER_NAMES,
    UNLOCK_INLAY: UNLOCK_INLAY,
    UNLOCK_FRIEZE: UNLOCK_FRIEZE,
    UNLOCK_FULL: UNLOCK_FULL,
    blocks: blocks,
    blockState: blockState,
    isMetal: isMetal,
    progress: progress,
    firstBlockDone: firstBlockDone,
    urDecoLevel: urDecoLevel,
    friezeUnlocked: friezeUnlocked,
    unseen: unseen,
    art: art,
  });
})();
