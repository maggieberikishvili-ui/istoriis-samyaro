/* ==========================================================
   ისტორიის სამყარო — თემატური ილუსტრაციები ბილიკის გვერდით
   ----------------------------------------------------------
   მინიმალისტური, მქრქალი ვექტორული სტილი (viewBox 0 0 120 100).
   ფერები CSS კლასებით (იხ. css/dashboard.css → .il):
     f-terra / f-emerald / f-sand / f-ochre / f-paper / f-ink — შევსება
     o — შევსების გარეშე;  s-ink / s-thin / s-terra / s-ochre — კონტური
   ანიმაციები: a-flame (ცეცხლის რხევა), a-rays (მზის სხივები),
               a-wheel (ბორბლის ნელი ბრუნვა)
   სისქე: w4 / w5 / w6 / w8;  s-sand — ძვლისფერი კონტური

   თითო ბარათი = ერთი არტეფაქტი (საკუთარი სათაურით და ფაქტით).
   ბილიკზე ბარათები თანაბრად ნაწილდება და ერთ თავში არასოდეს
   მეორდება; თუ თავში ადგილი ბარათებზე მეტია, ფირფიტები უბრალოდ
   იშვიათად ჩნდება. თავებს შორის ბარათები არ იზიარება.

   გასაღები — თავის id (js/data.js); ბარათები დალაგებულია
   გაკვეთილების ქრონოლოგიით.
     g7-c1 — პრეისტორიული ხანა
     g7-c2 — ბრინჯაოს ხანა / ძველი აღმოსავლეთი
     g7-c3 — ანტიკური საბერძნეთი და ელინისტური სამყარო
     g7-c4 — ძველი რომი და ანტიკური საქართველო
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
        id: "hand-axe",
        title: "ქვის ხელის ცული (ბიფასი)",
        fact: "ბიფასი — ორივე მხრიდან ჩამოთლილი ქვის ცული. ქვის ხანის ადამიანი მას ჭრისთვის, თხრისა და ნადავლის დასაჭრელად იყენებდა.",
        shapes: [
          ground(90),
          el("path", { d: "M60 14 C80 28 86 60 66 88 L54 88 C34 60 40 28 60 14 Z", class: "f-sand s-ink" }),
          el("path", { d: "M60 26 L66 40 M52 44 L62 58 M68 52 L64 68 M54 66 L60 80", class: "s-thin o" }),
          el("path", { d: "M88 88 L95 79 L102 88 Z", class: "f-sand s-ink" }),
          el("path", { d: "M18 88 L23 82 L28 88 Z", class: "f-sand s-ink" }),
        ],
      },
      {
        id: "hearth",
        title: "კერა და ცეცხლი",
        fact: "ცეცხლის მოთვინიერებამ ადამიანს სითბო, მოხარშული საკვები და მხეცებისგან დაცვა მისცა — კერის გარშემო შეკრებილი ჯგუფი ერთიან თემად ყალიბდებოდა.",
        shapes: [
          ground(90),
          el("g", { transform: "translate(-19 0)" }, [
            el("line", { x1: 64, y1: 84, x2: 94, y2: 76, class: "s-ochre o w6" }),
            el("line", { x1: 64, y1: 76, x2: 94, y2: 84, class: "s-ochre o w6" }),
            el("circle", { cx: 64, cy: 87, r: 5, class: "f-sand s-ink" }),
            el("circle", { cx: 79, cy: 89, r: 5, class: "f-sand s-ink" }),
            el("circle", { cx: 94, cy: 87, r: 5, class: "f-sand s-ink" }),
            el("g", { class: "a-flame" }, [
              el("path", { d: "M79 76 C66 66 70 52 75 42 C77 52 83 52 81 40 C93 52 94 66 79 76 Z", class: "f-terra" }),
              el("path", { d: "M79 74 C72 68 73 60 76 55 C78 61 83 61 82 55 C87 63 86 70 79 74 Z", class: "f-ochre" }),
            ]),
          ]),
        ],
      },
      {
        id: "cave-bison",
        title: "გამოქვაბულის მხატვრობა",
        fact: "გამოქვაბულის მხატვრობის ზოგი ნიმუში 30 000 წელზე ძველია — ცხოველებს ოხრითა და ნახშირით ხატავდნენ.",
        shapes: [
          el("path", { d: "M6 22 Q60 6 114 22 L114 80 Q60 88 6 80 Z", class: "f-sand" }),
          el("g", { transform: "translate(18 6)" }, [
            el("path", { d: "M22 52 C22 42 32 36 42 38 C48 31 59 32 63 41 C67 45 67 53 63 55 L27 57 C24 56 22 54 22 52 Z", class: "f-terra" }),
            el("path", { d: "M29 56 L28 66 M37 57 L37 66 M53 56 L54 66 M60 55 L61 64", class: "s-terra o" }),
            el("path", { d: "M63 43 C69 40 71 44 69 49", class: "s-terra o" }),
            el("path", { d: "M23 48 L17 54", class: "s-terra o" }),
            el("circle", { cx: 74, cy: 24, r: 2, class: "f-ochre" }),
            el("circle", { cx: 80, cy: 21, r: 2, class: "f-ochre" }),
            el("circle", { cx: 86, cy: 25, r: 2, class: "f-ochre" }),
          ]),
        ],
      },
      {
        id: "bow-arrow",
        title: "მშვილდ-ისარი",
        fact: "მშვილდ-ისრით ნადირობა შორი მანძილიდან შეიძლებოდა — ეს გაცილებით უსაფრთხო და შედეგიანი იყო, ვიდრე შუბით ნადირთან ახლოს მისვლა.",
        shapes: [
          el("g", { transform: "translate(12 0)" }, [
            el("path", { d: "M32 16 Q4 50 32 84", class: "s-ochre o w4" }),
            el("path", { d: "M32 16 L44 50 L32 84", class: "s-thin o" }),
            el("line", { x1: 44, y1: 50, x2: 82, y2: 50, class: "s-ink o" }),
            el("path", { d: "M82 45 L92 50 L82 55 Z", class: "f-sand s-ink" }),
            el("path", { d: "M48 50 L42 44 M48 50 L42 56 M53 50 L47 44 M53 50 L47 56", class: "s-terra o" }),
          ]),
        ],
      },
      {
        id: "spear-point",
        title: "ქვის შუბისპირი",
        fact: "შუბისპირს კაჟისგან ან ობსიდიანისგან თლიდნენ და ხის ტარზე ძარღვითა და ფისით ამაგრებდნენ.",
        shapes: [
          el("path", { d: "M60 8 C72 30 72 54 60 70 C48 54 48 30 60 8 Z", class: "f-sand s-ink" }),
          el("path", { d: "M60 18 L56 32 M60 30 L64 44 M60 44 L56 58", class: "s-thin o" }),
          el("rect", { x: 54, y: 68, width: 12, height: 10, rx: 2, class: "f-ochre s-ink" }),
          el("path", { d: "M54 71 H66 M54 75 H66", class: "s-thin o" }),
          el("path", { d: "M60 78 V96", class: "s-ochre o w4" }),
        ],
      },
      {
        id: "bone-needle",
        title: "ძვლის ნემსი",
        fact: "ძვლის ნემსით ცხოველის ტყავისგან ტანსაცმელს კერავდნენ — ასე გადაურჩა ადამიანი დიდი გამყინვარების სიცივეს.",
        shapes: [
          ground(92),
          el("g", { transform: "translate(12 0)" }, [
            el("line", { x1: 16, y1: 84, x2: 66, y2: 22, class: "s-ink o w8" }),
            el("line", { x1: 16, y1: 84, x2: 66, y2: 22, class: "s-sand o w5" }),
            el("ellipse", { cx: 62, cy: 27, rx: 1.4, ry: 3.2, transform: "rotate(39 62 27)", class: "f-ink" }),
            el("path", { d: "M62 27 C78 30 72 46 86 50 C94 52 92 40 100 38", class: "s-terra o" }),
          ]),
        ],
      },
      {
        id: "petroglyph",
        title: "პეტროგლიფი",
        fact: "პეტროგლიფი ბერძნულად „ქვაზე ამოკვეთილს“ ნიშნავს — ქვაზე ამოკვეთილი ადამიანებისა და ცხოველების გამოსახულებები ჩვენი წინაპრების ნადირობასა და რწმენაზე მოგვითხრობს.",
        shapes: [
          ground(90),
          el("g", { transform: "translate(24 0)" }, [
            el("path", { d: "M6 90 C4 64 16 44 38 42 C60 40 70 60 68 90 Z", class: "f-sand s-ink" }),
            el("circle", { cx: 24, cy: 55, r: 2.6, class: "s-terra o" }),
            el("path", { d: "M24 58 V70 M24 62 L19 66 M24 62 L29 66 M24 70 L20 77 M24 70 L28 77", class: "s-terra o" }),
            el("path", { d: "M40 66 H52 M42 66 V73 M50 66 V73 M52 66 L55 61 M55 61 L53 57 M55 61 L58 57", class: "s-terra o" }),
            el("path", { d: "M38 82 a3 3 0 1 1 3 3", class: "s-terra o" }),
          ]),
        ],
      },
      {
        id: "hut",
        title: "უძველესი ქოხი",
        fact: "ბინადარ ცხოვრებაზე გადასვლისას ადამიანებმა ტოტების, თიხისა და ტყავისგან ქოხების აშენება დაიწყეს — ასე გაჩნდა პირველი დასახლებები.",
        shapes: [
          ground(90),
          el("g", { transform: "translate(-33 0)" }, [
            el("path", { d: "M74 90 L93 50 L112 90 Z", class: "f-ochre s-ink" }),
            el("path", { d: "M88 44 L93 50 L98 44", class: "s-ink o" }),
            el("path", { d: "M81 76 H105 M85 66 H101", class: "s-thin o" }),
            el("path", { d: "M89 90 V79 A4 4 0 0 1 97 79 V90 Z", class: "f-terra s-ink" }),
          ]),
        ],
      },
      {
        id: "neolithic-pot",
        title: "ორნამენტიანი თიხის ჭურჭელი",
        fact: "ნეოლითში ადამიანმა თიხის ჭურჭლის გამოწვა ისწავლა — მასში მოსავალს ინახავდნენ და საკვებს ხარშავდნენ.",
        shapes: [
          ground(92),
          el("g", { transform: "translate(-32 0)" }, [
            el("path", { d: "M84 52 H100 V58 H84 Z", class: "f-ochre s-ink" }),
            el("path", { d: "M84 58 C76 64 76 82 85 92 L99 92 C108 82 108 64 100 58 Z", class: "f-ochre s-ink" }),
            el("polyline", { points: "80,72 84,67 88,72 92,67 96,72 100,67 104,72", class: "s-thin o" }),
            el("path", { d: "M81 80 H103", class: "s-thin o" }),
          ]),
        ],
      },
    ],

    /* ========== თავი II — ბრინჯაოს ხანა / ძველი აღმოსავლეთი ========== */
    "g7-c2": [
      {
        id: "trialeti-cup",
        title: "თრიალეთის ოქროს თასი",
        fact: "თრიალეთის ყორღანებში (ძვ. წ. II ათასწლეული) აღმოჩენილი ოქროს თასი ძვირფასი თვლებითა და მარცვლოვანი ორნამენტით არის შემკული — ძველი ქართული ოქრომჭედლობის შედევრია.",
        shapes: [
          ground(90),
          el("path", { d: "M32 28 H88 L82 68 Q60 80 38 68 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M52 76 L48 88 H72 L68 76", class: "f-ochre s-ink" }),
          el("path", { d: "M34 36 H86", class: "s-thin o" }),
        ].concat(
          [40, 46, 52, 58, 64, 70, 76, 82].map((x) => el("circle", { cx: x, cy: 32, r: 1.5, class: "f-terra" })),
          [48, 60, 72].map((x) => el("circle", { cx: x, cy: 50, r: 4.5, class: "f-terra s-ink" })),
          [el("polyline", { points: "40,62 45,58 50,62 55,58 60,62 65,58 70,62 75,58 80,62", class: "s-thin o" })]
        ),
      },
      {
        id: "chariot",
        title: "საბრძოლო ეტლი",
        fact: "ძვ. წ. II ათასწლეულში წინა აზიაში ფართოდ გავრცელდა მსუბუქი, ღერძებიანი ბორბლით აღჭურვილი საბრძოლო ეტლი, რომელშიც ცხენებს აბამდნენ.",
        shapes: [
          ground(90),
          el("g", { transform: "translate(20 0)" }, [
            el("path", { d: "M18 60 H50 L46 72 H22 Z", class: "f-terra s-ink" }),
            el("path", { d: "M50 66 L70 60", class: "s-ink o" }),
            el("g", { class: "a-wheel" }, [
              el("circle", { cx: 34, cy: 76, r: 13, class: "f-paper s-ink" }),
            ].concat(spokes(34, 76, 13, 6))),
            el("circle", { cx: 34, cy: 76, r: 2.5, class: "f-ink" }),
          ]),
        ],
      },
      {
        id: "ziggurat",
        title: "ზიქურათი",
        fact: "ზიქურათი — მესოპოტამიური საფეხუროვანი ტაძარი თიხის აგურისგან; მის მწვერვალზე მდებარე სამლოცველოში მხოლოდ ქურუმები ადიოდნენ.",
        shapes: [
          ground(90),
          el("g", { transform: "translate(18 0)" }, [
            el("rect", { x: 10, y: 72, width: 64, height: 18, class: "f-ochre s-ink" }),
            el("rect", { x: 18, y: 56, width: 48, height: 16, class: "f-sand s-ink" }),
            el("rect", { x: 28, y: 42, width: 28, height: 14, class: "f-ochre s-ink" }),
            el("rect", { x: 36, y: 33, width: 12, height: 9, class: "f-terra s-ink" }),
            el("path", { d: "M38 90 V56 H46 V90", class: "f-paper s-ink" }),
            el("path", { d: "M38 62 H46 M38 68 H46 M38 74 H46 M38 80 H46 M38 86 H46", class: "s-thin o" }),
          ]),
        ],
      },
      {
        id: "cuneiform-tablet",
        title: "ლურსმული დამწერლობის ფირფიტა",
        fact: "ლურსმული დამწერლობა შუმერებმა ძვ. წ. IV ათასწლეულის ბოლოს შექმნეს — ნიშნებს რბილ თიხაზე ლერწმის წვეტით აჭდევდნენ.",
        shapes: [
          el("rect", { x: 34, y: 14, width: 52, height: 74, rx: 7, class: "f-sand s-ink" }),
        ].concat(cuneiform(41, 22, 7, 8)),
      },
      {
        id: "pyramids",
        title: "გიზას პირამიდები",
        fact: "გიზას დიდი პირამიდა ძვ. წ. XXVI საუკუნეში აიგო და 3 800 წელზე მეტ ხანს მსოფლიოში ყველაზე მაღალი ნაგებობა იყო.",
        shapes: [
          el("g", { class: "a-rays" }, rays(96, 22, 12, 18, 10)),
          el("circle", { cx: 96, cy: 22, r: 9, class: "f-ochre" }),
          ground(90),
          el("g", { transform: "translate(8 0)" }, [
            el("path", { d: "M10 90 L42 40 L74 90 Z", class: "f-sand s-ink" }),
            el("path", { d: "M42 40 L74 90 L50 90 Z", class: "f-ochre" }),
            el("path", { d: "M10 90 L42 40 L74 90 Z", class: "s-ink o" }),
            el("path", { d: "M58 90 L76 62 L94 90 Z", class: "f-sand s-ink" }),
          ]),
        ],
      },
      {
        id: "sphinx",
        title: "დიდი სფინქსი",
        fact: "დიდი სფინქსი — ლომის სხეულისა და ადამიანის თავის მქონე ქანდაკება გიზაში; იგი ერთიანი კლდისგან არის გამოკვეთილი.",
        shapes: [
          ground(90),
          el("path", { d: "M12 90 V76 C12 68 20 64 28 64 H80 C90 64 98 70 98 78 V90 Z", class: "f-sand s-ink" }),
          el("path", { d: "M96 84 H112 V90 H96", class: "f-sand s-ink" }),
          el("path", { d: "M72 66 V44 C72 32 94 32 94 44 V66 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M76 46 V64 M90 46 V64", class: "s-thin o" }),
          el("rect", { x: 78, y: 42, width: 10, height: 16, rx: 2, class: "f-sand s-ink" }),
          el("path", { d: "M80 48 H82 M84 48 H86 M81 53 H85", class: "s-thin o" }),
          el("path", { d: "M24 72 H64", class: "s-thin o" }),
        ],
      },
      {
        id: "hammurabi-stele",
        title: "ხამურაბის კანონების სტელა",
        fact: "ხამურაბის კანონები (ძვ. წ. XVIII ს.) ბაზალტის სტელაზეა ამოკვეთილი; დღეს სტელა პარიზში, ლუვრის მუზეუმში ინახება.",
        shapes: [
          ground(90),
          el("path", { d: "M38 90 V30 C38 14 82 14 82 30 V90 Z", class: "f-sand s-ink" }),
          el("rect", { x: 45, y: 22, width: 30, height: 24, rx: 3, class: "f-paper s-thin" }),
          el("circle", { cx: 53, cy: 29, r: 3, class: "f-ink" }),
          el("path", { d: "M53 32 V44 M50 37 H56", class: "s-ink o" }),
          el("circle", { cx: 67, cy: 31, r: 3, class: "f-ink" }),
          el("path", { d: "M63 44 V36 H71 V44", class: "s-ink o" }),
        ].concat(cuneiform(46, 52, 5, 4)),
      },
      {
        id: "golden-fleece",
        title: "ოქროს საწმისი",
        fact: "ბერძნული მითის მიხედვით, არგონავტები ოქროს საწმისისთვის კოლხეთში, აიეტ მეფის ქვეყანაში ჩავიდნენ; სტრაბონი მითს კოლხების მიერ ცხვრის ტყავით ოქროს მოპოვებას უკავშირებს.",
        shapes: [
          el("path", { d: "M30 90 V40 C30 31 34 27 40 26", class: "s-ochre o w6" }),
          ground(90),
          el("g", { transform: "translate(-32 4)" }, [
            el("path", { d: "M70 22 C84 18 100 20 114 24", class: "s-ink o" }),
            el("path", { d: "M92 21 V30", class: "s-thin o" }),
            el("circle", { cx: 86, cy: 38, r: 7, class: "f-ochre s-ink" }),
            el("circle", { cx: 98, cy: 38, r: 7, class: "f-ochre s-ink" }),
            el("circle", { cx: 84, cy: 49, r: 7, class: "f-ochre s-ink" }),
            el("circle", { cx: 100, cy: 49, r: 7, class: "f-ochre s-ink" }),
            el("circle", { cx: 92, cy: 56, r: 7, class: "f-ochre s-ink" }),
            el("circle", { cx: 92, cy: 45, r: 7, class: "f-ochre" }),
            el("path", { d: "M84 31 C80 26 86 24 88 28 M100 31 C104 26 98 24 96 28", class: "s-ink o" }),
          ]),
        ],
      },
    ],

    /* ===== თავი III — ანტიკური საბერძნეთი და ელინისტური სამყარო ===== */
    "g7-c3": [
      {
        id: "trireme",
        title: "ბერძნული ტრიერა",
        fact: "ტრიერა — ბერძნული საბრძოლო ხომალდი ნიჩბოსანთა სამი რიგითა და ბრინჯაოს ტარანით; სალამინთან (ძვ. წ. 480 წ.) სწორედ ტრიერებმა გაანადგურეს სპარსეთის ფლოტი.",
        shapes: [
          el("path", { d: "M6 88 q6 -4 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0", class: "s-thin o" }),
          el("line", { x1: 58, y1: 62, x2: 58, y2: 16, class: "s-ink o" }),
          el("rect", { x: 40, y: 20, width: 36, height: 30, class: "f-paper s-ink" }),
          el("path", { d: "M40 30 H76 M40 40 H76", class: "s-thin o" }),
        ].concat(
          [26, 35, 44, 53, 62, 71, 80, 89].map((x) => el("line", { x1: x, y1: 72, x2: x - 6, y2: 86, class: "s-ink o" })),
          [
            el("path", { d: "M10 60 H100 L110 54 L106 66 L116 70 L104 72 C80 78 40 78 18 72 Z", class: "f-terra s-ink" }),
            el("path", { d: "M10 60 C4 54 6 46 12 48", class: "s-ink o" }),
            el("circle", { cx: 98, cy: 64, r: 2.2, class: "f-paper s-ink" }),
            el("path", { d: "M18 66 H98", class: "s-thin o" }),
          ]
        ),
      },
      {
        id: "amphora",
        title: "ამფორა",
        fact: "ამფორა — ორყურა თიხის ჭურჭელი წვეტიანი ძირით; მასში ზღვით გადაჰქონდათ ღვინო, ზეითუნის ზეთი და კოლხური ფისი.",
        shapes: [
          ground(92),
          el("rect", { x: 50, y: 12, width: 20, height: 5, rx: 2, class: "f-terra s-ink" }),
          el("rect", { x: 53, y: 17, width: 14, height: 15, class: "f-terra s-ink" }),
          el("path", { d: "M53 32 C34 42 34 70 52 84 L56 92 H64 L68 84 C86 70 86 42 67 32 Z", class: "f-terra s-ink" }),
          el("path", { d: "M53 21 C40 21 40 36 46 40 M67 21 C80 21 80 36 74 40", class: "s-ink o" }),
          el("path", { d: "M42 50 H78 M41 64 H79", class: "s-thin o" }),
          el("polyline", { points: "46,59 50,55 54,59 58,55 62,59 66,55 70,59 74,55", class: "s-ochre o" }),
        ],
      },
      {
        id: "colchian-tetri",
        title: "კოლხური თეთრი",
        fact: "კოლხური თეთრი — ძვ. წ. VI საუკუნიდან კოლხეთში მოჭრილი ვერცხლის მონეტა, რომელზეც ხშირად ხარის თავია გამოსახული.",
        shapes: [
          el("circle", { cx: 60, cy: 50, r: 36, class: "f-sand s-ink" }),
          el("circle", { cx: 60, cy: 50, r: 30, class: "s-thin o" }),
          el("path", { d: "M50 44 C40 42 36 32 40 26 M70 44 C80 42 84 32 80 26", class: "s-ink o w4" }),
          el("path", { d: "M48 50 L40 52 L47 57 M72 50 L80 52 L73 57", class: "f-paper s-ink" }),
          el("path", { d: "M60 76 C52 76 48 66 48 56 C48 46 54 40 60 40 C66 40 72 46 72 56 C72 66 68 76 60 76 Z", class: "f-paper s-ink" }),
          el("circle", { cx: 55, cy: 54, r: 1.8, class: "f-ink" }),
          el("circle", { cx: 65, cy: 54, r: 1.8, class: "f-ink" }),
          el("path", { d: "M55 70 H57 M63 70 H65", class: "s-ink o" }),
        ],
      },
      {
        id: "ionic-column",
        title: "იონიური სვეტი",
        fact: "ბერძნები სამი სახის სვეტს (ორდერს) ქმნიდნენ — დორიულს, იონიურს და კორინთულს; იონიურ სვეტს თავზე ორი სპირალური ხვია (ვოლუტი) ამკობს.",
        shapes: [
          ground(90),
          el("rect", { x: 38, y: 84, width: 44, height: 6, class: "f-sand s-ink" }),
          el("rect", { x: 43, y: 79, width: 34, height: 5, class: "f-sand s-ink" }),
          el("rect", { x: 49, y: 30, width: 22, height: 49, class: "f-paper s-ink" }),
          el("path", { d: "M54 33 V77 M60 33 V77 M66 33 V77", class: "s-thin o" }),
          el("rect", { x: 38, y: 18, width: 44, height: 6, class: "f-sand s-ink" }),
          el("rect", { x: 42, y: 24, width: 36, height: 6, class: "f-sand s-ink" }),
          el("circle", { cx: 41, cy: 30, r: 6, class: "f-sand s-ink" }),
          el("circle", { cx: 79, cy: 30, r: 6, class: "f-sand s-ink" }),
          el("path", { d: "M41 30 m-2.5 0 a2.5 2.5 0 1 1 2.5 2.5 M79 30 m2.5 0 a2.5 2.5 0 1 0 -2.5 2.5", class: "s-thin o" }),
        ],
      },
      {
        id: "parthenon",
        title: "პართენონი",
        fact: "პართენონი ათენის აკროპოლისზე ძვ. წ. 447–432 წლებში, პერიკლეს დროს აიგო ქალღმერთ ათენას პატივსაცემად.",
        shapes: [
          el("g", { transform: "translate(12 0)" }, [
            el("path", { d: "M8 42 L48 26 L88 42 Z", class: "f-sand s-ink" }),
            el("rect", { x: 10, y: 42, width: 76, height: 7, class: "f-sand s-ink" }),
            el("rect", { x: 14, y: 49, width: 7, height: 32, class: "f-paper s-ink" }),
            el("rect", { x: 28, y: 49, width: 7, height: 32, class: "f-paper s-ink" }),
            el("rect", { x: 42, y: 49, width: 7, height: 32, class: "f-paper s-ink" }),
            el("rect", { x: 56, y: 49, width: 7, height: 32, class: "f-paper s-ink" }),
            el("rect", { x: 70, y: 49, width: 7, height: 32, class: "f-paper s-ink" }),
            el("rect", { x: 8, y: 81, width: 80, height: 5, class: "f-sand s-ink" }),
            el("rect", { x: 4, y: 86, width: 88, height: 5, class: "f-sand s-ink" }),
          ]),
        ],
      },
      {
        id: "hoplite-helmet",
        title: "ბერძენი ჰოპლიტის მუზარადი",
        fact: "ჰოპლიტი — ბერძენი მძიმედ შეიარაღებული ქვეითი. ბრინჯაოს მუზარადი, დიდი მრგვალი ფარი და გრძელი შუბი მას მარათონთან და თერმოპილესთან სპარსელებთან ბრძოლაში იცავდა.",
        shapes: [
          ground(90),
          el("path", { d: "M30 42 C32 16 76 10 94 30 L88 36 C74 22 46 24 38 44 Z", class: "f-terra s-ink" }),
          el("path", { d: "M38 44 C38 26 84 26 86 46 V80 H74 V62 H64 V84 H46 C40 72 38 58 38 44 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M46 54 Q55 50 64 54", class: "s-ink o w4" }),
          el("path", { d: "M74 62 V50", class: "s-thin o" }),
        ],
      },
      {
        id: "macedonian-shield",
        title: "მაკედონური ფარი და სარისა",
        fact: "ფილიპე II-ისა და ალექსანდრეს ფალანგის მეომრებს ეჭირათ მრგვალი ფარი და 6 მეტრამდე სიგრძის შუბი — სარისა; ფარებზე ზოგჯერ მაკედონური მზე (ვერგინას ვარსკვლავი) იყო გამოსახული.",
        shapes: [
          el("line", { x1: 12, y1: 96, x2: 104, y2: 8, class: "s-ochre o w4" }),
          el("path", { d: "M104 8 L94 12 L100 18 Z", class: "f-sand s-ink" }),
          el("circle", { cx: 58, cy: 52, r: 36, class: "f-ochre s-ink" }),
          el("circle", { cx: 58, cy: 52, r: 31, class: "s-thin o" }),
        ].concat(
          Array.from({ length: 16 }, (_, i) => {
            const a = (Math.PI * 2 * i) / 16;
            const r2 = i % 2 ? 16 : 23;
            return el("line", {
              x1: (58 + Math.cos(a) * 8).toFixed(1), y1: (52 + Math.sin(a) * 8).toFixed(1),
              x2: (58 + Math.cos(a) * r2).toFixed(1), y2: (52 + Math.sin(a) * r2).toFixed(1),
              class: "s-terra o",
            });
          }),
          [el("circle", { cx: 58, cy: 52, r: 7, class: "f-terra" })]
        ),
      },
      {
        id: "papyrus-scroll",
        title: "ალექსანდრიის ბიბლიოთეკის გრაგნილი",
        fact: "პტოლემეების დროს ალექსანდრიის ბიბლიოთეკაში ასობით ათასი პაპირუსის გრაგნილი ინახებოდა — იგი ელინისტური სამყაროს უდიდესი სამეცნიერო ცენტრი იყო.",
        shapes: [
          el("rect", { x: 24, y: 26, width: 72, height: 52, class: "f-paper s-ink" }),
          el("path", { d: "M32 36 H88 M32 44 H84 M32 52 H88 M32 60 H80 M32 68 H86", class: "s-thin o" }),
          el("rect", { x: 15, y: 22, width: 11, height: 60, rx: 5.5, class: "f-sand s-ink" }),
          el("rect", { x: 94, y: 22, width: 11, height: 60, rx: 5.5, class: "f-sand s-ink" }),
          el("path", { d: "M20.5 16 V22 M20.5 82 V88 M99.5 16 V22 M99.5 82 V88", class: "s-ink o w4" }),
        ],
      },
      {
        id: "armaztsikhe",
        title: "არმაზციხე — ქართლის ციხე-ქალაქი",
        fact: "სტრაბონის „ჰარმოზიკე“ — არმაზციხე (ბაგინეთი) მცხეთასთან; „ქართლის ცხოვრების“ მიხედვით, მის მახლობლად ფარნავაზმა არმაზის კერპი აღმართა.",
        shapes: [
          ground(90),
          el("rect", { x: 30, y: 52, width: 60, height: 38, class: "f-sand s-ink" }),
          el("rect", { x: 22, y: 36, width: 16, height: 54, class: "f-sand s-ink" }),
          el("rect", { x: 82, y: 36, width: 16, height: 54, class: "f-sand s-ink" }),
          el("path", { d: "M22 36 V30 H26 V36 M30 36 V30 H34 V36 M82 36 V30 H86 V36 M90 36 V30 H94 V36", class: "s-ink o" }),
          el("path", { d: "M44 52 V47 H48 V52 M56 52 V47 H60 V52 M68 52 V47 H72 V52", class: "s-ink o" }),
          el("path", { d: "M52 90 V74 A8 8 0 0 1 68 74 V90 Z", class: "f-terra s-ink" }),
          el("path", { d: "M26 50 V56 M90 50 V56", class: "s-ink o" }),
        ],
      },
    ],

    /* ======== თავი IV — ძველი რომი და ანტიკური საქართველო ======== */
    "g7-c4": [
      {
        id: "senate-scroll",
        title: "სენატის გრაგნილი",
        fact: "რომის რესპუბლიკაში სენატი განაგებდა ხაზინასა და საგარეო პოლიტიკას; სახელმწიფოს სიმბოლო იყო SPQR — „რომის სენატი და ხალხი“.",
        shapes: [
          el("rect", { x: 16, y: 38, width: 86, height: 24, rx: 12, class: "f-sand s-ink" }),
          el("ellipse", { cx: 102, cy: 50, rx: 6, ry: 12, class: "f-paper s-ink" }),
          el("path", { d: "M102 50 m-2.5 0 a2.5 2.5 0 1 1 2.5 2.5", class: "s-thin o" }),
          el("path", { d: "M28 44 H86 M28 56 H80", class: "s-thin o" }),
          el("path", { d: "M58 38 V62", class: "s-terra o" }),
          el("path", { d: "M54 74 L48 88 M62 74 L68 88", class: "s-terra o" }),
          el("circle", { cx: 58, cy: 68, r: 8, class: "f-terra s-ink" }),
          el("circle", { cx: 58, cy: 68, r: 4, class: "s-ochre o" }),
        ],
      },
      {
        id: "legion-eagle",
        title: "ლეგიონის არწივი (აკვილა)",
        fact: "ყოველ რომაულ ლეგიონს ჰქონდა თავისი სიმბოლო — არწივი ბუნიკზე; მისი დაკარგვა ლეგიონისთვის უდიდეს სირცხვილად ითვლებოდა.",
        shapes: [
          ground(90),
          el("rect", { x: 58, y: 54, width: 4, height: 36, class: "f-ochre s-ink" }),
          el("rect", { x: 48, y: 46, width: 24, height: 8, class: "f-terra s-ink" }),
          el("path", { d: "M56 34 C46 24 32 22 22 26 C30 30 34 36 42 38 C36 40 30 44 28 48 C40 48 50 44 56 40 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M64 34 C74 24 88 22 98 26 C90 30 86 36 78 38 C84 40 90 44 92 48 C80 48 70 44 64 40 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M60 46 C54 46 52 38 56 32 C58 28 62 28 64 32 C68 38 66 46 60 46 Z", class: "f-ochre s-ink" }),
          el("circle", { cx: 60, cy: 24, r: 5, class: "f-ochre s-ink" }),
          el("path", { d: "M64 23 L70 25 L64 27 Z", class: "f-terra" }),
          el("path", { d: "M52 90 H68", class: "s-ink o" }),
        ],
      },
      {
        id: "scutum",
        title: "ლეგიონერის ფარი — სკუტუმი",
        fact: "რომაელი ლეგიონერი მართკუთხა, მოხრილი ფარით — სკუტუმით იცავდა თავს; ფარებს მჭიდროდ აწყობდნენ და „კუს“ წყობას ქმნიდნენ.",
        shapes: [
          ground(92),
          el("rect", { x: 34, y: 12, width: 52, height: 76, rx: 7, class: "f-terra s-ink" }),
          el("rect", { x: 39, y: 17, width: 42, height: 66, rx: 4, class: "s-ochre o" }),
          el("path", { d: "M60 26 V42 M60 58 V74 M44 50 H51 M69 50 H76", class: "s-ochre o" }),
          el("path", { d: "M46 30 L52 36 M74 30 L68 36 M46 70 L52 64 M74 70 L68 64", class: "s-ochre o" }),
          el("circle", { cx: 60, cy: 50, r: 8, class: "f-ochre s-ink" }),
        ],
      },
      {
        id: "colosseum",
        title: "კოლოსეუმი",
        fact: "კოლოსეუმი (ფლავიუსების ამფითეატრი) ახ. წ. 80 წელს გაიხსნა და 50 ათასამდე მაყურებელს იტევდა — აქ გლადიატორთა ბრძოლები იმართებოდა.",
        shapes: [
          ground(90),
          el("path", { d: "M12 90 V36 H82 V44 H108 V90 Z", class: "f-sand s-ink" }),
          el("path", { d: "M12 52 H108 M12 68 H108", class: "s-thin o" }),
        ].concat(arches(18, 70, 7, 8, 18), arches(18, 54, 7, 8, 12), arches(18, 40, 5, 8, 10)),
      },
      {
        id: "vani-gold",
        title: "ვანის ოქრომჭედლობა",
        fact: "ანტიკური ვანის სამარხებში აღმოჩენილი ოქროს დიადემები, საყურეები და ყელსაბამები კოლხი ოქრომჭედლების უმაღლეს ოსტატობას ადასტურებს.",
        shapes: [
          el("path", { d: "M16 34 Q60 62 104 34", class: "s-ochre o w6" }),
          el("path", { d: "M16 34 Q60 62 104 34", class: "s-ink o" }),
        ].concat(
          [[29.2, 41.1], [44.6, 46.3], [60, 48], [75.4, 46.3], [90.8, 41.1]].reduce((acc, [x, y]) => acc.concat([
            el("path", { d: "M" + x + " " + y + " l6 10 l-6 10 l-6 -10 Z", class: "f-ochre s-ink" }),
            el("circle", { cx: x, cy: y + 10, r: 2, class: "f-terra" }),
            el("path", { d: "M" + x + " " + (y + 20) + " V" + (y + 24), class: "s-thin o" }),
            el("circle", { cx: x, cy: y + 27, r: 3, class: "f-ochre s-ink" }),
          ]), [])
        ),
      },
      {
        id: "kvevri",
        title: "ქართული ქვევრი",
        fact: "ქვევრი — მიწაში ჩაფლული დიდი თიხის ჭურჭელი ღვინის დასაყენებლად; ქვევრში ღვინის დაყენების ქართული ტრადიცია 2013 წელს UNESCO-ს არამატერიალური მემკვიდრეობის ნუსხაში შევიდა.",
        shapes: [
          ground(92),
          el("path", { d: "M50 16 C30 16 22 38 24 58 C26 78 40 90 50 92 C60 90 74 78 76 58 C78 38 70 16 50 16 Z", class: "f-terra s-ink" }),
          el("ellipse", { cx: 50, cy: 17, rx: 11, ry: 4, class: "f-ochre s-ink" }),
          el("path", { d: "M27 40 H73", class: "s-thin o" }),
          el("path", { d: "M92 26 C100 22 108 26 106 34 C100 34 94 32 92 26 Z", class: "f-emerald s-ink" }),
          el("path", { d: "M96 30 V38", class: "s-ink o" }),
        ].concat(
          [[92, 42], [100, 42], [96, 49], [104, 49], [88, 49], [92, 56], [100, 56], [96, 63]].map(([x, y]) =>
            el("circle", { cx: x, cy: y, r: 4, class: "f-emerald s-ink" }))
        ),
      },
      {
        id: "early-church",
        title: "ადრექრისტიანული ტაძარი",
        fact: "ქართლმა ქრისტიანობა სახელმწიფო რელიგიად IV საუკუნის პირველ ნახევარში, მეფე მირიანისა და წმინდა ნინოს დროს მიიღო.",
        shapes: [
          ground(90),
          el("rect", { x: 34, y: 54, width: 52, height: 36, class: "f-sand s-ink" }),
          el("path", { d: "M30 54 L60 40 L90 54 Z", class: "f-terra s-ink" }),
          el("rect", { x: 52, y: 28, width: 16, height: 16, class: "f-sand s-ink" }),
          el("path", { d: "M49 28 L60 14 L71 28 Z", class: "f-terra s-ink" }),
          el("path", { d: "M60 4 V14 M56 8 H64", class: "s-ink o" }),
          el("path", { d: "M55 90 V78 A5 5 0 0 1 65 78 V90 Z", class: "f-paper s-ink" }),
          el("path", { d: "M43 64 V72 M77 64 V72 M60 32 V38", class: "s-ink o" }),
        ],
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
