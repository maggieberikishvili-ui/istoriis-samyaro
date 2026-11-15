/* ==========================================================
   ისტორიის სამყარო — თემატური ილუსტრაციები ბილიკის გვერდით
   ----------------------------------------------------------
   მინიმალისტური, მქრქალი ვექტორული სტილი (viewBox 0 0 120 100).
   ფერები CSS კლასებით (იხ. css/dashboard.css → .il):
     f-terra / f-emerald / f-sand / f-ochre / f-paper / f-ink — შევსება
     o — შევსების გარეშე;  s-ink / s-thin / s-terra / s-ochre — კონტური
   ანიმაციები: a-flame (ცეცხლის რხევა), a-rays (მზის სხივები),
               a-wheel (ბორბლის ნელი ბრუნვა)

   გასაღები — თავის id (js/data.js): ილუსტრაციები ჩნდება მხოლოდ
   იმ თავებთან, რომლებიც მონაცემებში არსებობს.
   მე-7 კლასის სარჩევი:
     g7-c1 — პრეისტორიული ხანა
     g7-c2 — ბრინჯაოს ხანა / ძველი აღმოსავლეთი
     g7-c3 — ანტიკური და გვიანანტიკური ხანა
   ========================================================== */

(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";

  /* ---------- დამხმარეები ---------- */

  // ["tag", { attrs }, [children]]
  function el(tag, attrs, children) {
    return [tag, attrs || {}, children || []];
  }

  // ლურსმული ნიშნები (სოლისებური ჭდეები) თიხის ფირფიტაზე
  function cuneiform(x0, y0, cols, rows) {
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * 6 + (r % 2) * 2;
        const y = y0 + r * 8;
        out.push(el("path", { d: "M" + x + " " + y + " l4 1.6 l-4 1.6 z", class: "f-ink" }));
        if ((r + c) % 3 === 0) out.push(el("path", { d: "M" + (x + 1) + " " + (y + 4.5) + " v3", class: "s-thin o" }));
      }
    }
    return out;
  }

  // ბორბლის ღერძები
  function spokes(cx, cy, r, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n;
      out.push(el("line", {
        x1: cx, y1: cy,
        x2: (cx + Math.cos(a) * r).toFixed(1), y2: (cy + Math.sin(a) * r).toFixed(1),
        class: "s-ink o",
      }));
    }
    return out;
  }

  // მზის სხივები
  function rays(cx, cy, r1, r2, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n;
      out.push(el("line", {
        x1: (cx + Math.cos(a) * r1).toFixed(1), y1: (cy + Math.sin(a) * r1).toFixed(1),
        x2: (cx + Math.cos(a) * r2).toFixed(1), y2: (cy + Math.sin(a) * r2).toFixed(1),
        class: "s-ochre o",
      }));
    }
    return out;
  }

  // რომაული თაღების რიგი
  function arches(x0, y, count, w, h) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const x = x0 + i * (w + 4);
      out.push(el("path", {
        d: "M" + x + " " + (y + h) + " v-" + (h - w / 2) + " a" + w / 2 + " " + w / 2 + " 0 0 1 " + w + " 0 v" + (h - w / 2) + " z",
        class: "f-terra",
      }));
    }
    return out;
  }

  const ground = (y) => el("path", { d: "M6 " + y + " H114", class: "s-thin o" });

  /* ---------- ილუსტრაციები ---------- */

  const ILLUSTRATIONS = {
    /* ================= თავი I — პრეისტორიული ხანა ================= */
    "g7-c1": [
      {
        id: "stone-age-fire",
        title: "ქვის ხანა: იარაღი და კერა",
        fact: "დმანისში აღმოჩენილი ადამიანის ნაშთები დაახლოებით 1,8 მილიონი წლისაა — ერთ-ერთი უძველესი ევროპასა და აზიაში.",
        shapes: [
          ground(90),
          // ხელის ცული (ბიფასი)
          el("path", { d: "M28 34 C40 42 44 64 33 86 C22 70 18 50 28 34 Z", class: "f-sand s-ink" }),
          el("path", { d: "M28 44 L33 58 M25 58 L31 72 M34 50 L36 64", class: "s-thin o" }),
          // კაჟის ანატკეცი
          el("path", { d: "M44 88 L51 79 L56 88 Z", class: "f-sand s-ink" }),
          // კერის ქვები და შეშა
          el("line", { x1: 64, y1: 84, x2: 94, y2: 76, class: "s-ochre o w6" }),
          el("line", { x1: 64, y1: 76, x2: 94, y2: 84, class: "s-ochre o w6" }),
          el("circle", { cx: 64, cy: 87, r: 5, class: "f-sand s-ink" }),
          el("circle", { cx: 79, cy: 89, r: 5, class: "f-sand s-ink" }),
          el("circle", { cx: 94, cy: 87, r: 5, class: "f-sand s-ink" }),
          // ცეცხლი (ნელი რხევა)
          el("g", { class: "a-flame" }, [
            el("path", { d: "M79 76 C66 66 70 52 75 42 C77 52 83 52 81 40 C93 52 94 66 79 76 Z", class: "f-terra" }),
            el("path", { d: "M79 74 C72 68 73 60 76 55 C78 61 83 61 82 55 C87 63 86 70 79 74 Z", class: "f-ochre" }),
          ]),
        ],
      },
      {
        id: "cave-art-pottery",
        title: "გამოქვაბულის მხატვრობა და კერამიკა",
        fact: "გამოქვაბულის მხატვრობის ზოგი ნიმუში 30 000 წელზე ძველია — საღებავად ოხრასა და ნახშირს იყენებდნენ.",
        shapes: [
          // გამოქვაბულის კედელი
          el("path", { d: "M6 22 Q60 6 114 22 L114 74 Q60 82 6 74 Z", class: "f-sand" }),
          // ბიზონი
          el("path", { d: "M22 52 C22 42 32 36 42 38 C48 31 59 32 63 41 C67 45 67 53 63 55 L27 57 C24 56 22 54 22 52 Z", class: "f-terra" }),
          el("path", { d: "M29 56 L28 66 M37 57 L37 66 M53 56 L54 66 M60 55 L61 64", class: "s-terra o" }),
          el("path", { d: "M63 43 C69 40 71 44 69 49", class: "s-terra o" }),
          el("path", { d: "M23 48 L17 54", class: "s-terra o" }),
          // ოხრის წერტილები
          el("circle", { cx: 74, cy: 28, r: 2, class: "f-ochre" }),
          el("circle", { cx: 80, cy: 25, r: 2, class: "f-ochre" }),
          el("circle", { cx: 86, cy: 29, r: 2, class: "f-ochre" }),
          // ორნამენტიანი თიხის ჭურჭელი
          el("path", { d: "M84 52 H100 V58 H84 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M84 58 C76 64 76 82 85 92 L99 92 C108 82 108 64 100 58 Z", class: "f-ochre s-ink" }),
          el("polyline", { points: "80,72 84,67 88,72 92,67 96,72 100,67 104,72", class: "s-thin o" }),
          el("path", { d: "M81 80 H103", class: "s-thin o" }),
        ],
      },
    ],

    /* ========== თავი II — ბრინჯაოს ხანა / ძველი აღმოსავლეთი ========== */
    "g7-c2": [
      {
        id: "ziggurat-cuneiform",
        title: "ზიქურათი და ლურსმული დამწერლობა",
        fact: "ლურსმული დამწერლობა შუმერებმა ძვ. წ. IV ათასწლეულის ბოლოს შექმნეს — ნიშნებს რბილ თიხაზე ლერწმით აჭდევდნენ.",
        shapes: [
          ground(90),
          el("rect", { x: 10, y: 72, width: 64, height: 18, class: "f-ochre s-ink" }),
          el("rect", { x: 18, y: 56, width: 48, height: 16, class: "f-sand s-ink" }),
          el("rect", { x: 28, y: 42, width: 28, height: 14, class: "f-ochre s-ink" }),
          el("rect", { x: 36, y: 33, width: 12, height: 9, class: "f-terra s-ink" }),
          el("path", { d: "M38 90 V56 H46 V90", class: "f-paper s-ink" }),
          el("path", { d: "M38 62 H46 M38 68 H46 M38 74 H46 M38 80 H46 M38 86 H46", class: "s-thin o" }),
          // თიხის ფირფიტა
          el("rect", { x: 80, y: 44, width: 32, height: 44, rx: 5, class: "f-sand s-ink" }),
        ].concat(cuneiform(85, 50, 4, 5)),
      },
      {
        id: "pyramids-sphinx",
        title: "პირამიდები და სფინქსი",
        fact: "გიზის დიდი პირამიდა ძვ. წ. XXVI საუკუნეში აიგო და 3 800 წელზე მეტ ხანს მსოფლიოში ყველაზე მაღალი ნაგებობა იყო.",
        shapes: [
          el("g", { class: "a-rays" }, rays(94, 22, 12, 18, 10)),
          el("circle", { cx: 94, cy: 22, r: 9, class: "f-ochre" }),
          ground(90),
          el("path", { d: "M10 90 L42 40 L74 90 Z", class: "f-sand s-ink" }),
          el("path", { d: "M42 40 L74 90 L50 90 Z", class: "f-ochre" }),
          el("path", { d: "M10 90 L42 40 L74 90 Z", class: "s-ink o" }),
          el("path", { d: "M58 90 L76 62 L94 90 Z", class: "f-sand s-ink" }),
          // სფინქსი
          el("path", { d: "M82 90 V82 C82 78 86 76 90 76 H104 C108 76 112 79 112 84 V90 Z", class: "f-sand s-ink" }),
          el("path", { d: "M101 76 V65 C101 60 110 60 110 65 V76", class: "f-terra s-ink" }),
          el("path", { d: "M104 66 H108", class: "s-thin o" }),
        ],
      },
      {
        id: "chariot-fleece",
        title: "საბრძოლო ეტლი და ოქროს საწმისი",
        fact: "ხეთები მსუბუქი საბრძოლო ეტლებით იყვნენ ცნობილნი, ბერძნული მითი კი ოქროს საწმისს კოლხეთში, აიეტ მეფის ქვეყანაში ათავსებს.",
        shapes: [
          ground(90),
          // ეტლი
          el("path", { d: "M18 60 H50 L46 72 H22 Z", class: "f-terra s-ink" }),
          el("path", { d: "M50 66 L70 60", class: "s-ink o" }),
          el("g", { class: "a-wheel" }, [
            el("circle", { cx: 34, cy: 76, r: 13, class: "f-paper s-ink" }),
          ].concat(spokes(34, 76, 13, 6))),
          el("circle", { cx: 34, cy: 76, r: 2.5, class: "f-ink" }),
          // ტოტი და საწმისი
          el("path", { d: "M70 22 C84 18 100 20 114 24", class: "s-ink o" }),
          el("path", { d: "M92 21 V30", class: "s-thin o" }),
          el("circle", { cx: 86, cy: 38, r: 7, class: "f-ochre s-ink" }),
          el("circle", { cx: 98, cy: 38, r: 7, class: "f-ochre s-ink" }),
          el("circle", { cx: 84, cy: 49, r: 7, class: "f-ochre s-ink" }),
          el("circle", { cx: 100, cy: 49, r: 7, class: "f-ochre s-ink" }),
          el("circle", { cx: 92, cy: 56, r: 7, class: "f-ochre s-ink" }),
          el("circle", { cx: 92, cy: 45, r: 7, class: "f-ochre" }),
          el("path", { d: "M84 31 C80 26 86 24 88 28 M100 31 C104 26 98 24 96 28", class: "s-ink o" }),
        ],
      },
    ],

    /* ======== თავი III — ანტიკური და გვიანანტიკური ხანა ======== */
    "g7-c3": [
      {
        id: "parthenon-amphora",
        title: "პართენონი და ამფორა",
        fact: "პართენონი ათენის აკროპოლისზე ძვ. წ. 447–432 წლებში აიგო ქალღმერთ ათენას პატივსაცემად.",
        shapes: [
          el("path", { d: "M8 42 L48 26 L88 42 Z", class: "f-sand s-ink" }),
          el("rect", { x: 10, y: 42, width: 76, height: 7, class: "f-sand s-ink" }),
          el("rect", { x: 14, y: 49, width: 7, height: 32, class: "f-paper s-ink" }),
          el("rect", { x: 28, y: 49, width: 7, height: 32, class: "f-paper s-ink" }),
          el("rect", { x: 42, y: 49, width: 7, height: 32, class: "f-paper s-ink" }),
          el("rect", { x: 56, y: 49, width: 7, height: 32, class: "f-paper s-ink" }),
          el("rect", { x: 70, y: 49, width: 7, height: 32, class: "f-paper s-ink" }),
          el("rect", { x: 8, y: 81, width: 80, height: 5, class: "f-sand s-ink" }),
          el("rect", { x: 4, y: 86, width: 88, height: 5, class: "f-sand s-ink" }),
          // ამფორა
          el("rect", { x: 101, y: 46, width: 7, height: 9, class: "f-terra s-ink" }),
          el("path", { d: "M101 55 C92 62 92 80 101 90 C103 92 106 92 108 90 C117 80 117 62 108 55 Z", class: "f-terra s-ink" }),
          el("path", { d: "M101 49 C94 49 94 58 98 60 M108 49 C115 49 115 58 111 60", class: "s-ink o" }),
          el("path", { d: "M96 70 H113 M97 76 H112", class: "s-thin o" }),
        ],
      },
      {
        id: "helmet-fortress",
        title: "მაკედონური მუზარადი და ქართლის ციხე",
        fact: "ფარნავაზი (ძვ. წ. III ს.) ქართლის (იბერიის) პირველი მეფე იყო; „ქართლის ცხოვრება“ მას ქართული დამწერლობის შექმნასაც მიაწერს.",
        shapes: [
          ground(90),
          // მუზარადი ჯიღით
          el("path", { d: "M14 44 C16 24 44 18 56 36 L52 40 C44 30 26 32 20 46 Z", class: "f-terra s-ink" }),
          el("path", { d: "M20 46 C20 32 50 32 52 46 V68 H44 V56 H38 V72 H26 C22 64 20 56 20 46 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M26 52 H38", class: "s-ink o" }),
          // ციხესიმაგრე
          el("rect", { x: 66, y: 58, width: 44, height: 32, class: "f-sand s-ink" }),
          el("rect", { x: 62, y: 46, width: 12, height: 44, class: "f-sand s-ink" }),
          el("rect", { x: 102, y: 46, width: 12, height: 44, class: "f-sand s-ink" }),
          el("path", { d: "M62 46 V41 H65 V46 M68 46 V41 H71 V46 M102 46 V41 H105 V46 M108 46 V41 H111 V46", class: "s-ink o" }),
          el("path", { d: "M83 90 V78 A5 5 0 0 1 93 78 V90 Z", class: "f-terra s-ink" }),
          el("path", { d: "M66 58 V54 H70 M106 54 H110 V58", class: "s-thin o" }),
        ],
      },
      {
        id: "colosseum-church",
        title: "კოლოსეუმი და ადრექრისტიანული ტაძარი",
        fact: "კოლოსეუმი ახ. წ. 80 წელს გაიხსნა; ქართლმა კი ქრისტიანობა IV საუკუნეში, მირიან მეფისა და წმინდა ნინოს დროს მიიღო.",
        shapes: [
          ground(90),
          // კოლოსეუმი
          el("path", { d: "M6 90 V44 H38 V38 H68 V90 Z", class: "f-sand s-ink" }),
          el("path", { d: "M6 66 H68", class: "s-thin o" }),
          el("path", { d: "M6 52 H68", class: "s-thin o" }),
        ].concat(arches(10, 70, 5, 8, 18), arches(10, 54, 5, 8, 10), [
          // ტაძარი
          el("rect", { x: 78, y: 64, width: 34, height: 26, class: "f-sand s-ink" }),
          el("path", { d: "M75 64 L95 55 L115 64 Z", class: "f-terra s-ink" }),
          el("rect", { x: 89, y: 46, width: 12, height: 12, class: "f-sand s-ink" }),
          el("path", { d: "M87 46 L95 36 L103 46 Z", class: "f-terra s-ink" }),
          el("path", { d: "M95 26 V36 M91.5 30 H98.5", class: "s-ink o" }),
          el("path", { d: "M92 90 V80 A3 3 0 0 1 98 80 V90", class: "f-paper s-ink" }),
        ]),
      },
    ],
  };

  /* ---------- SVG-ის აგება (createElementNS — innerHTML-ის გარეშე) ---------- */

  function build(node) {
    const [tag, attrs, children] = node;
    const elx = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach((k) => elx.setAttribute(k, String(attrs[k])));
    children.forEach((child) => elx.append(build(child)));
    return elx;
  }

  function createSvg(illustration) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 120 100");
    svg.setAttribute("class", "il");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    illustration.shapes.forEach((shape) => svg.append(build(shape)));
    return svg;
  }

  function forChapter(chapterId) {
    return ILLUSTRATIONS[chapterId] || [];
  }

  window.IMS_ILLUSTRATIONS = Object.freeze({
    forChapter: forChapter,
    createSvg: createSvg,
  });
})();
