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
   არასავალდებულო `after: "გაკვეთილის id"` — ბარათი ზუსტად ამ გაკვეთილის
   შემდეგ ჩაჯდება (მე-8 კლასში ყოველ მეორე გაკვეთილზე, თემის მიხედვით).
   `after`-ის გარეშე ბარათები ბილიკზე თანაბრად ნაწილდება (მე-7 კლასი).
   ბილიკზე ბარათები თანაბრად ნაწილდება და ერთ თავში არასოდეს
   მეორდება; თუ თავში ადგილი ბარათებზე მეტია, ფირფიტები უბრალოდ
   იშვიათად ჩნდება. თავებს შორის ბარათები არ იზიარება.

   გასაღები — თავის id (js/data.js); ბარათები დალაგებულია
   გაკვეთილების ქრონოლოგიით.
     g7-c1 — პრეისტორიული ხანა
     g7-c2 — ბრინჯაოს ხანა / ძველი აღმოსავლეთი
     g7-c3 — ანტიკური საბერძნეთი და ელინისტური სამყარო
     g7-c4 — ძველი რომი და ანტიკური საქართველო
     g8-c1 — ადრეული და განვითარებული შუა საუკუნეები
     g10-c1 … g12-c1, ne-c1 — სხვა კლასების პირველი თავები (თითო ბარათი;
       ახალი გაკვეთილების დამატებისას ბარათებიც ემატება)
     g9-c1 — ახალი დრო: საქართველო და მსოფლიო (XVII–XIX სს.)
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

    /* ===== მე-8 კლასი, თავი I — ადრეული და განვითარებული შუა საუკუნეები ===== */
    "g8-c1": [
      {
        id: "gareja-cells",
        after: "g8-l12",
        title: "დავით გარეჯის კლდის სენაკები",
        fact: "VI საუკუნეში ასურელმა (სირიელმა) მამამ დავითმა გარეჯის უდაბნოში მონასტერი დააარსა; ბერები კლდეში გამოკვეთილ სენაკებში ცხოვრობდნენ და ლოცულობდნენ.",
        shapes: [
          ground(90),
          el("path", { d: "M8 90 C10 60 18 34 40 24 C58 16 80 18 96 30 C108 40 112 64 112 90 Z", class: "f-sand s-ink" }),
          el("path", { d: "M18 52 C30 48 40 50 48 46 M70 62 C84 58 96 60 106 56", class: "s-thin o" }),
          el("path", { d: "M30 70 V60 A6 6 0 0 1 42 60 V70 Z", class: "f-ink" }),
          el("path", { d: "M58 50 V42 A5 5 0 0 1 68 42 V50 Z", class: "f-ink" }),
          el("path", { d: "M80 72 V60 A6 6 0 0 1 92 60 V72 Z", class: "f-ink" }),
          el("path", { d: "M50 82 V76 A4 4 0 0 1 58 76 V82 Z", class: "f-ink" }),
          el("path", { d: "M26 70 H46 M54 50 H72 M76 72 H96", class: "s-thin o" }),
          el("path", { d: "M66 6 V20 M61 11 H71", class: "s-terra o" }),
        ],
      },
      {
        id: "manuscript",
        after: "g8-l18",
        title: "ხელნაწერი წიგნი",
        fact: "მონასტრებში წიგნებს ეტრატზე (სპეციალურად დამუშავებულ ტყავზე) ხელით წერდნენ და მოხატავდნენ — ერთი წიგნის გადაწერას ზოგჯერ წლები სჭირდებოდა.",
        shapes: [
          el("path", { d: "M60 30 C48 24 30 24 14 28 V82 C30 78 48 78 60 84 Z", class: "f-paper s-ink" }),
          el("path", { d: "M60 30 C72 24 90 24 106 28 V82 C90 78 72 78 60 84 Z", class: "f-paper s-ink" }),
          el("path", { d: "M22 40 H52 M22 47 H52 M22 54 H50 M22 61 H52 M22 68 H46", class: "s-thin o" }),
          el("rect", { x: 68, y: 36, width: 14, height: 14, class: "f-terra s-ink" }),
          el("circle", { cx: 75, cy: 43, r: 3, class: "f-ochre" }),
          el("path", { d: "M86 38 H98 M86 45 H98 M68 56 H98 M68 63 H96 M68 70 H98", class: "s-thin o" }),
          el("path", { d: "M60 84 V95", class: "s-terra o" }),
        ],
      },
      {
        id: "papal-keys",
        after: "g8-l2",
        title: "პაპის გასაღებები",
        fact: "რომის პაპის სიმბოლოა ორი გადაჯვარედინებული გასაღები — ოქროსა და ვერცხლის, „ცათა სასუფევლის გასაღებები“, რომლებიც, გადმოცემით, ქრისტემ მოციქულ პეტრეს გადასცა.",
        shapes: [
          ["f-sand", -38], ["f-ochre", 38],
        ].map(([fill, angle]) => el("g", { transform: "rotate(" + angle + " 60 54)" }, [
          el("circle", { cx: 60, cy: 22, r: 9, class: fill + " s-ink" }),
          el("circle", { cx: 60, cy: 22, r: 4, class: "f-paper s-ink" }),
          el("rect", { x: 57, y: 30, width: 6, height: 52, class: fill + " s-ink" }),
          el("path", { d: "M63 70 H72 V76 H68 V82 H63 Z", class: fill + " s-ink" }),
          el("path", { d: "M63 61 H70 V66 H63 Z", class: fill + " s-ink" }),
        ])).concat([
          el("path", { d: "M44 88 Q60 97 76 88", class: "s-terra o" }),
        ]),
      },
      {
        id: "francisca",
        title: "ფრანცისკა — ფრანკების ცული",
        fact: "ფრანცისკა ფრანკი მეომრების სატყორცნი ცული იყო — მას ბრძოლის დასაწყისში ისროდნენ, რომ მტრის ფარები დაემსხვრიათ და მწკრივი აერიათ.",
        shapes: [
          el("line", { x1: 30, y1: 92, x2: 70, y2: 18, class: "s-ink o w8" }),
          el("line", { x1: 30, y1: 92, x2: 70, y2: 18, class: "s-ochre o w5" }),
          el("path", { d: "M62 20 C70 14 84 10 96 16 C92 26 90 38 94 48 C84 44 74 36 66 34 Z", class: "f-sand s-ink" }),
          el("path", { d: "M96 16 C92 26 90 38 94 48", class: "s-ochre o" }),
          el("path", { d: "M36 80 L44 84 M40 72 L48 76", class: "s-terra o" }),
        ],
      },
      {
        id: "imperial-crown",
        after: "g8-l4",
        title: "საიმპერატორო გვირგვინი",
        fact: "800 წლის შობას, რომის წმინდა პეტრეს ტაძარში, პაპმა ლევ III-მ კარლოსს საიმპერატორო გვირგვინი დაადგა — დასავლეთში კვლავ გაჩნდა იმპერატორი.",
        shapes: [
          el("path", { d: "M24 78 H96 L92 88 H28 Z", class: "f-terra s-ink" }),
          el("path", { d: "M28 56 L28 34 L40 46 L50 28 L60 42 L70 28 L80 46 L92 34 L92 56 Z", class: "f-ochre s-ink" }),
          el("rect", { x: 28, y: 56, width: 64, height: 22, rx: 2, class: "f-ochre s-ink" }),
          el("circle", { cx: 40, cy: 67, r: 4, class: "f-terra s-ink" }),
          el("circle", { cx: 60, cy: 67, r: 4, class: "f-terra s-ink" }),
          el("circle", { cx: 80, cy: 67, r: 4, class: "f-terra s-ink" }),
          el("circle", { cx: 50, cy: 67, r: 2.6, class: "f-emerald" }),
          el("circle", { cx: 70, cy: 67, r: 2.6, class: "f-emerald" }),
          el("circle", { cx: 28, cy: 34, r: 2.5, class: "f-paper s-ink" }),
          el("circle", { cx: 50, cy: 28, r: 2.5, class: "f-paper s-ink" }),
          el("circle", { cx: 70, cy: 28, r: 2.5, class: "f-paper s-ink" }),
          el("circle", { cx: 92, cy: 34, r: 2.5, class: "f-paper s-ink" }),
          el("path", { d: "M60 12 V30 M54 18 H66", class: "s-ink o" }),
        ],
      },
      {
        id: "fire-altar",
        title: "სასანური ცეცხლის საკურთხეველი",
        fact: "სასანურ ირანში სახელმწიფო რელიგია ზოროასტრიზმი იყო — ცეცხლის ტაძრებში წმინდა ცეცხლი დღედაღამ ენთო და ქურუმები მას არასოდეს აქრობდნენ.",
        shapes: [
          ground(92),
          el("rect", { x: 38, y: 82, width: 44, height: 10, class: "f-sand s-ink" }),
          el("rect", { x: 44, y: 76, width: 32, height: 6, class: "f-sand s-ink" }),
          el("rect", { x: 52, y: 52, width: 16, height: 24, class: "f-sand s-ink" }),
          el("rect", { x: 44, y: 46, width: 32, height: 6, class: "f-sand s-ink" }),
          el("rect", { x: 38, y: 40, width: 44, height: 6, class: "f-sand s-ink" }),
          el("path", { d: "M42 46 Q34 56 38 66 M78 46 Q86 56 82 66", class: "s-terra o" }),
          el("g", { class: "a-flame" }, [
            el("path", { d: "M60 40 C48 32 50 20 56 10 C58 20 64 20 62 8 C74 20 74 32 60 40 Z", class: "f-terra" }),
            el("path", { d: "M60 38 C54 34 55 27 58 23 C60 28 64 28 63 23 C68 30 66 35 60 38 Z", class: "f-ochre" }),
          ]),
        ],
      },
      {
        id: "hagia-sophia",
        after: "g8-l23",
        title: "აია-სოფია",
        fact: "აია-სოფია 537 წელს აკურთხეს; მისი 30 მეტრზე მეტი დიამეტრის გუმბათი, ფანჯრების რიგის წყალობით, თითქოს ჰაერში ეკიდა.",
        shapes: [
          ground(90),
          el("rect", { x: 10, y: 66, width: 14, height: 24, class: "f-sand s-ink" }),
          el("rect", { x: 96, y: 66, width: 14, height: 24, class: "f-sand s-ink" }),
          el("path", { d: "M10 66 A7 7 0 0 1 24 66 Z M96 66 A7 7 0 0 1 110 66 Z", class: "f-terra s-ink" }),
          el("rect", { x: 24, y: 58, width: 72, height: 32, class: "f-sand s-ink" }),
          el("rect", { x: 34, y: 46, width: 52, height: 12, class: "f-sand s-ink" }),
          el("path", { d: "M40 49 V55 M46 49 V55 M52 49 V55 M58 49 V55 M64 49 V55 M70 49 V55 M76 49 V55 M82 49 V55", class: "s-thin o" }),
          el("path", { d: "M36 46 A24 22 0 0 1 84 46 Z", class: "f-terra s-ink" }),
          el("path", { d: "M60 12 V24 M56 16 H64", class: "s-ink o" }),
        ].concat(arches(46, 72, 3, 8, 18)),
      },
      {
        id: "justinian-code",
        after: "g8-l6",
        title: "იუსტინიანეს კოდექსი",
        fact: "529–534 წლებში იუსტინიანეს იურისტებმა რომაული სამართალი ერთ კრებულად შეკრიბეს — მის საფუძველზე ევროპის მრავალი ქვეყნის სამართალი დღემდე დგას.",
        shapes: [
          el("rect", { x: 86, y: 20, width: 5, height: 66, class: "f-paper s-ink" }),
          el("rect", { x: 32, y: 16, width: 56, height: 74, rx: 3, class: "f-terra s-ink" }),
          el("rect", { x: 28, y: 16, width: 9, height: 74, rx: 2, class: "f-ochre s-ink" }),
          el("rect", { x: 45, y: 26, width: 34, height: 54, class: "s-ochre o" }),
          el("path", { d: "M62 36 V66 M50 44 H74 M55 70 H69", class: "s-ochre o" }),
          el("path", { d: "M50 44 L46 54 M50 44 L54 54 M74 44 L70 54 M74 44 L78 54", class: "s-thin o" }),
          el("path", { d: "M45 54 A5 4 0 0 0 55 54 Z M69 54 A5 4 0 0 0 79 54 Z", class: "f-ochre s-ink" }),
        ],
      },
      {
        id: "astrolabe",
        after: "g8-l10",
        title: "არაბული ასტროლაბი",
        fact: "ასტროლაბით ვარსკვლავებისა და მზის სიმაღლეს ზომავდნენ. არაბმა მეცნიერებმა ის დახვეწეს და დროის, მიმართულებისა და გეოგრაფიული მდებარეობის დასადგენად იყენებდნენ.",
        shapes: [
          el("circle", { cx: 60, cy: 16, r: 5, class: "s-ink o w4" }),
          el("path", { d: "M60 21 V26", class: "s-ink o" }),
          el("circle", { cx: 60, cy: 56, r: 31, class: "f-ochre s-ink" }),
          el("circle", { cx: 60, cy: 56, r: 24, class: "f-paper s-ink" }),
        ].concat(rays(60, 56, 25, 29, 24), [
          el("path", { d: "M36 56 H84 M60 32 V80", class: "s-thin o" }),
          el("circle", { cx: 60, cy: 50, r: 14, class: "s-thin o" }),
          el("path", { d: "M60 56 L80 40", class: "s-terra o" }),
          el("circle", { cx: 60, cy: 56, r: 3, class: "f-ink" }),
        ]),
      },
      {
        id: "tbilisi-dirham",
        after: "g8-l8",
        title: "თბილისური დირჰემი",
        fact: "თბილისის ზარაფხანაში არაბული ვერცხლის მონეტა — დირჰემი იჭრებოდა. ასეთი მონეტები სხვა ქვეყნებშიც პოულობენ, რაც თბილისის საერთაშორისო ვაჭრობაში ჩართულობას ადასტურებს.",
        shapes: [
          el("circle", { cx: 88, cy: 72, r: 18, class: "f-sand s-ink" }),
          el("circle", { cx: 88, cy: 72, r: 13, class: "s-thin o" }),
          el("circle", { cx: 54, cy: 48, r: 32, class: "f-ochre s-ink" }),
          el("circle", { cx: 54, cy: 48, r: 25, class: "s-ink o" }),
          el("path", { d: "M38 42 q4 -7 8 0 t8 0 t8 0 t8 0 M38 54 H70", class: "s-ink o" }),
          el("circle", { cx: 46, cy: 61, r: 1.6, class: "f-ink" }),
          el("circle", { cx: 54, cy: 63, r: 1.6, class: "f-ink" }),
          el("circle", { cx: 62, cy: 61, r: 1.6, class: "f-ink" }),
        ],
      },
      {
        id: "knight-shield",
        after: "g8-l14",
        title: "რაინდის ფარი",
        fact: "რაინდის ფარზე მისი გერბი იყო გამოსახული — ჩაფხუტით სახედაფარულ რაინდს ბრძოლასა და ტურნირზე სწორედ გერბით ცნობდნენ.",
        shapes: [
          el("path", { d: "M14 26 H106", class: "s-ink o w5" }),
          el("path", { d: "M60 8 V26", class: "s-ink o w4" }),
          el("path", { d: "M30 22 H90 V48 C90 72 74 86 60 94 C46 86 30 72 30 48 Z", class: "f-terra s-ink" }),
          el("path", { d: "M60 30 V84 M38 50 H82", class: "s-ochre o w6" }),
          el("circle", { cx: 60, cy: 50, r: 5, class: "f-ochre s-ink" }),
        ],
      },
      {
        id: "caravan-camel",
        after: "g8-l16",
        title: "ქარავნის აქლემი",
        fact: "აბრეშუმის გზაზე ქარავნები აქლემებით მოძრაობდნენ: აქლემს ასობით კილოგრამი ტვირთის ტარება და დღეობით წყლის გარეშე სვლა შეუძლია.",
        shapes: [
          ground(90),
          el("path", { d: "M38 66 V88 M48 66 V88 M70 66 V88 M80 66 V88", class: "s-ink o w4" }),
          el("path", { d: "M30 60 C30 46 40 40 50 44 C54 32 66 32 70 44 C76 42 80 46 80 52 L82 40 C82 32 90 30 94 34 L99 38 L92 41 L90 54 C90 62 84 66 78 66 L34 66 C31 65 30 63 30 60 Z", class: "f-sand s-ink" }),
          el("path", { d: "M30 58 L24 68", class: "s-ink o" }),
          el("rect", { x: 50, y: 30, width: 18, height: 10, rx: 2, class: "f-terra s-ink" }),
          el("path", { d: "M54 40 V48 M64 40 V48", class: "s-ochre o" }),
          el("circle", { cx: 91, cy: 36, r: 1.4, class: "f-ink" }),
        ],
      },
      {
        id: "bagrati-cathedral",
        after: "g8-l21",
        title: "ბაგრატის ტაძარი",
        fact: "ქუთაისში, უქიმერიონის გორაზე, ბაგრატ III-ის დროს აგებული ტაძრის წარწერაში აგების თარიღად 1003 წელია მითითებული. ის ერთიანი საქართველოს სიმბოლოდ იქცა.",
        shapes: [
          ground(90),
          el("rect", { x: 18, y: 54, width: 84, height: 36, class: "f-sand s-ink" }),
          el("path", { d: "M14 54 L30 44 L46 54 M74 54 L90 44 L106 54", class: "f-terra s-ink" }),
          el("rect", { x: 49, y: 30, width: 22, height: 24, class: "f-sand s-ink" }),
          el("path", { d: "M46 30 L60 10 L74 30 Z", class: "f-terra s-ink" }),
          el("path", { d: "M56 36 V46 M64 36 V46", class: "s-ink o" }),
        ].concat(arches(29, 70, 5, 10, 20)),
      },
      {
        id: "chrysobull",
        after: "g8-l19",
        title: "ოქროს ბეჭდიანი სიგელი",
        fact: "ბიზანტიის იმპერატორი მოკავშირე მმართველებს ოქროს ბეჭდით დამოწმებულ სიგელს — ხრისობულს უგზავნიდა. ასე ფორმდებოდა ხელშეკრულებები და ბოძებული ტიტულები.",
        shapes: [
          el("rect", { x: 26, y: 12, width: 64, height: 58, rx: 2, class: "f-paper s-ink" }),
          el("rect", { x: 22, y: 10, width: 72, height: 7, rx: 3.5, class: "f-sand s-ink" }),
          el("path", { d: "M34 28 H82 M34 36 H78 M34 44 H82 M34 52 H72", class: "s-thin o" }),
          el("path", { d: "M54 70 L52 78 M62 70 L64 78", class: "s-terra o" }),
          el("circle", { cx: 58, cy: 86, r: 10, class: "f-ochre s-ink" }),
          el("path", { d: "M58 80 V92 M53 86 H63", class: "s-ink o" }),
        ],
      },
      {
        id: "seljuk-bow",
        after: "g8-l26",
        title: "სელჩუკური მშვილდი",
        fact: "სელჩუკი ცხენოსნები შედგენილ მშვილდს იყენებდნენ: ხის, რქისა და ძარღვისგან აწყობილი მშვილდი პატარა იყო, მაგრამ ძალიან შორს ისროდა — ცხენიდან სროლისთვის იდეალური.",
        shapes: [
          el("path", { d: "M44 12 C30 16 30 26 40 30 C56 38 56 62 40 70 C30 74 30 84 44 88", class: "s-ink o w6" }),
          el("path", { d: "M44 12 C30 16 30 26 40 30 C56 38 56 62 40 70 C30 74 30 84 44 88", class: "s-ochre o w4" }),
          el("path", { d: "M44 12 L44 88", class: "s-thin o" }),
          el("line", { x1: 44, y1: 50, x2: 100, y2: 50, class: "s-ink o" }),
          el("path", { d: "M100 45 L110 50 L100 55 Z", class: "f-sand s-ink" }),
          el("path", { d: "M50 50 L44 44 M50 50 L44 56 M56 50 L50 44 M56 50 L50 56", class: "s-terra o" }),
          el("rect", { x: 49, y: 46, width: 6, height: 8, rx: 1, class: "f-terra" }),
        ],
      },
      {
        id: "crusader-helm",
        after: "g8-l28",
        title: "ჯვაროსნის ჩაფხუტი",
        fact: "ჯვაროსანი რაინდის დახურული ჩაფხუტი თავსა და სახეს მთლიანად ფარავდა: რაინდი სამყაროს მხოლოდ ვიწრო ჭრილიდან ხედავდა, სუნთქავდა კი პატარა ნახვრეტებით.",
        shapes: [
          el("path", { d: "M34 32 Q34 14 60 14 Q86 14 86 32 V80 H34 Z", class: "f-sand s-ink" }),
          el("path", { d: "M60 15 V80", class: "s-ochre o w5" }),
          el("path", { d: "M38 44 H55 M65 44 H82", class: "s-ink o w4" }),
          el("path", { d: "M46 56 V72 M41 62 H51", class: "s-terra o" }),
          el("circle", { cx: 70, cy: 58, r: 1.6, class: "f-ink" }),
          el("circle", { cx: 76, cy: 62, r: 1.6, class: "f-ink" }),
          el("circle", { cx: 70, cy: 66, r: 1.6, class: "f-ink" }),
          el("circle", { cx: 76, cy: 70, r: 1.6, class: "f-ink" }),
          el("path", { d: "M28 80 H92", class: "s-ink o w4" }),
        ],
      },
      {
        id: "trebuchet",
        after: "g8-l30",
        title: "ტრებუშეტი",
        fact: "ტრებუშეტი საპირწონის სიმძიმით მუშაობდა: მძიმე ყუთი ქვემოთ ეშვებოდა, გრძელი მკლავი კი ასობით მეტრზე ტყორცნიდა ქვებს და ციხის კედლებს ანგრევდა.",
        shapes: [
          ground(92),
          el("rect", { x: 22, y: 84, width: 60, height: 7, class: "f-sand s-ink" }),
          el("path", { d: "M32 84 L52 42 L72 84 M40 68 H64", class: "s-ochre o w5" }),
          el("line", { x1: 30, y1: 54, x2: 100, y2: 18, class: "s-ink o w5" }),
          el("rect", { x: 18, y: 54, width: 20, height: 16, rx: 1, class: "f-terra s-ink" }),
          el("circle", { cx: 52, cy: 42, r: 3.2, class: "f-ink" }),
          el("path", { d: "M100 18 L106 32", class: "s-thin o" }),
          el("circle", { cx: 106, cy: 36, r: 5, class: "f-sand s-ink" }),
        ],
      },

      /* --- თამარ მეფის ეპოქა (g8-l33–l37) --- */
      {
        id: "magna-carta",
        after: "g8-l34",
        title: "თავისუფლებების დიდი ქარტია",
        fact: "1215 წელს ინგლისის მეფე ჯონ უმიწაწყლომ ქარტიას მოაწერა ხელი: ამიერიდან ახალ გადასახადს სამეფოს საერთო საბჭოს თანხმობის გარეშე ვეღარ დააწესებდა.",
        shapes: [
          el("rect", { x: 26, y: 20, width: 68, height: 58, class: "f-paper s-ink" }),
          el("rect", { x: 20, y: 14, width: 80, height: 10, rx: 5, class: "f-sand s-ink" }),
          el("rect", { x: 20, y: 72, width: 80, height: 10, rx: 5, class: "f-sand s-ink" }),
          el("path", { d: "M34 34 H86 M34 42 H82 M34 50 H86 M34 58 H66", class: "s-thin o" }),
          el("path", { d: "M74 82 L70 90 M78 82 L82 90", class: "s-terra o" }),
          el("circle", { cx: 76, cy: 91, r: 6, class: "f-terra s-ink" }),
          el("circle", { cx: 76, cy: 91, r: 2.4, class: "f-ochre" }),
        ],
      },
      {
        id: "caliph-banner",
        after: "g8-l36",
        title: "ხალიფას დროშა",
        fact: "1195 წელს, შამქორის ბრძოლაში, შალვა ახალციხელმა ხალიფას დროშა ხელთ იგდო. თამარმა ეს დროშა ხახულის ღვთისმშობლის ხატს შესწირა.",
        shapes: [
          ground(92),
          el("line", { x1: 36, y1: 12, x2: 36, y2: 92, class: "s-ink o w5" }),
          el("circle", { cx: 36, cy: 10, r: 4, class: "f-ochre s-ink" }),
          el("path", { d: "M38 18 H98 L86 36 L98 54 H38 Z", class: "f-terra s-ink" }),
          el("path", { d: "M46 28 H78 M46 44 H78", class: "s-ochre o w4" }),
          el("path", { d: "M26 92 H46", class: "s-ink o w4" }),
        ],
      },
      {
        id: "vardzia",
        after: "g8-l38",
        title: "ვარძია",
        fact: "ვარძია კლდეში ნაკვეთი ქალაქ-მონასტერია: აქ იყო სამეფო დარბაზი, მარნები და ეკლესიები, დიდ ეკლესიაში კი თამარის ფრესკული პორტრეტია.",
        shapes: [
          el("path", { d: "M8 92 L14 30 Q22 12 44 14 Q70 8 92 16 Q108 22 112 40 L112 92 Z", class: "f-sand s-ink" }),
          el("path", { d: "M22 34 h8 v-6 q-4 -4 -8 0 z M40 30 h8 v-7 q-4 -4 -8 0 z M60 28 h8 v-7 q-4 -4 -8 0 z M80 30 h8 v-6 q-4 -4 -8 0 z", class: "f-ink" }),
          el("path", { d: "M28 54 h9 v-8 q-4.5 -5 -9 0 z M50 52 h10 v-9 q-5 -5 -10 0 z M74 54 h9 v-8 q-4.5 -5 -9 0 z M94 56 h8 v-7 q-4 -4 -8 0 z", class: "f-ink" }),
          el("path", { d: "M20 76 h8 v-7 q-4 -4 -8 0 z M40 78 h8 v-7 q-4 -4 -8 0 z M84 78 h8 v-7 q-4 -4 -8 0 z", class: "f-ink" }),
          el("path", { d: "M56 80 v-12 l6 -6 l6 6 v12 z", class: "f-terra s-ink" }),
          el("path", { d: "M62 58 v-6 M59 55 h6", class: "s-ochre o" }),
          el("path", { d: "M16 62 H108 M12 84 H110", class: "s-thin o" }),
        ],
      },

      /* --- მონღოლები და საქართველო (g8-l39–) --- */
      {
        id: "yurt",
        after: "g8-l39",
        title: "იურტა",
        fact: "მონღოლები თექით დაფარულ მრგვალ კარვებში — იურტებში — ცხოვრობდნენ. იურტა ადვილად იშლებოდა და ახალ საძოვარზე გადაჰქონდათ.",
        shapes: [
          ground(90),
          el("path", { d: "M16 90 V58 Q60 46 104 58 V90 Z", class: "f-paper s-ink" }),
          el("path", { d: "M14 58 Q60 14 106 58 Q60 46 14 58 Z", class: "f-sand s-ink" }),
          el("path", { d: "M52 24 Q60 20 68 24", class: "s-ink o w4" }),
          el("path", { d: "M16 66 Q60 54 104 66 M16 80 Q60 68 104 80", class: "s-terra o" }),
          el("path", { d: "M50 90 V68 Q60 62 70 68 V90 Z", class: "f-terra s-ink" }),
          el("path", { d: "M54 74 H66 M54 80 H66", class: "s-ochre o" }),
        ],
      },
      {
        id: "metekhi-bridge",
        after: "g8-l41",
        title: "მეტეხის ხიდი",
        fact: "1226 წელს ჯალალ ად-დინის ბრძანებით სიონის ტაძრის ხატები მეტეხის ხიდზე დადეს — ვინც მათზე გადაბიჯებაზე უარს ამბობდა, თავს კვეთდნენ.",
        shapes: [
          el("path", { d: "M8 92 Q60 84 112 92", class: "s-thin o" }),
          el("path", { d: "M10 64 H110 V72 H10 Z", class: "f-sand s-ink" }),
          el("path", { d: "M22 72 V92 M98 72 V92", class: "s-ink o w4" }),
          el("path", { d: "M28 92 Q60 56 92 92", class: "f-paper s-ink" }),
          el("path", { d: "M74 64 V44 L84 34 L94 44 V64 Z", class: "f-terra s-ink" }),
          el("path", { d: "M84 34 V24 M80 28 H88", class: "s-ochre o" }),
          el("path", { d: "M38 60 h6 v4 h-6 z M52 60 h6 v4 h-6 z", class: "f-ochre s-ink" }),
        ],
      },
      {
        id: "rustavi-bowl",
        after: "g8-l43",
        title: "რუსთავის მოხატული ჭურჭელი",
        fact: "XX საუკუნის შუა ხანებში რუსთავის გათხრებისას აღმოჩნდა მოხატული ჭურჭლის ნამტვრევები — შუა საუკუნეების მჭიდროდ დასახლებული ქალაქის ნაშთი.",
        shapes: [
          ground(92),
          el("path", { d: "M18 46 L30 30 L52 24 L64 30 L80 24 L98 34 L104 52 L96 72 L78 86 L54 90 L34 82 L22 66 Z", class: "f-paper s-ink" }),
          el("path", { d: "M30 46 Q60 30 92 48 M28 70 Q60 84 92 66", class: "s-thin o" }),
          el("path", { d: "M44 64 Q46 48 60 46 Q68 40 76 44 L70 48 Q78 54 72 62 Q62 70 44 64 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M76 44 L84 42 L78 48", class: "f-terra s-ink" }),
          el("path", { d: "M50 62 L40 70 M58 64 L54 74", class: "s-terra o" }),
          el("path", { d: "M32 54 q6 -6 10 0 M84 66 q6 -6 10 0 M36 78 q4 -5 8 0", class: "s-ink o" }),
          el("path", { d: "M60 52 a3 3 0 1 0 0.1 0 z", class: "f-emerald s-ink" }),
        ],
      },
    ],

    /* ===== მე-8 კლასი, თავი II — გვიანდელი შუა საუკუნეები და ადრეული ახალი დრო ===== */
    "g8-c2": [
      {
        id: "giorgauli-coin",
        after: "g8-l45",
        title: "ვერცხლის „გიორგაული“",
        fact: "გიორგი V-მ ვაჭრობის ხელშესაწყობად სრულფასოვანი ვერცხლის მონეტა მოჭრა, რომელსაც „გიორგაული“ ერქვა.",
        shapes: [
          ground(92),
          el("circle", { cx: 84, cy: 70, r: 20, class: "f-sand s-ink" }),
          el("circle", { cx: 84, cy: 70, r: 14, class: "s-thin o" }),
          el("path", { d: "M78 66 H90 M78 72 H90 M80 78 H88", class: "s-ink o" }),
          el("circle", { cx: 50, cy: 52, r: 32, class: "f-paper s-ink" }),
          el("circle", { cx: 50, cy: 52, r: 25, class: "s-thin o" }),
          el("path", { d: "M50 34 V70 M32 52 H68", class: "s-ink o w4" }),
          el("path", { d: "M50 34 l-4 6 h8 z M50 70 l-4 -6 h8 z M32 52 l6 -4 v8 z M68 52 l-6 -4 v8 z", class: "f-ochre s-ink" }),
          el("path", { d: "M36 38 l3 3 M64 38 l-3 3 M36 66 l3 -3 M64 66 l-3 -3", class: "s-ink o" }),
        ],
      },
      {
        id: "timur-bust",
        after: "g8-l47",
        title: "თემურის ბიუსტი",
        fact: "რუსმა მეცნიერმა მიხეილ გერასიმოვმა თემურის სახე 1941 წელს მისი აკლდამიდან ამოღებული თავის ქალის მიხედვით აღადგინა.",
        shapes: [
          ground(92),
          el("rect", { x: 40, y: 82, width: 40, height: 10, class: "f-sand s-ink" }),
          el("path", { d: "M30 82 C32 70 44 64 60 64 C76 64 88 70 90 82 Z", class: "f-emerald s-ink" }),
          el("path", { d: "M52 58 V66 H68 V58", class: "f-sand s-ink" }),
          el("ellipse", { cx: 60, cy: 44, rx: 13, ry: 16, class: "f-sand s-ink" }),
          el("path", { d: "M49 50 C50 64 56 70 60 70 C64 70 70 64 71 50 C66 56 54 56 49 50 Z", class: "f-ink" }),
          el("path", { d: "M46 38 C46 26 52 20 60 12 C68 20 74 26 74 38 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M45 38 H75", class: "s-ink o w4" }),
          el("path", { d: "M54 44 h3 M63 44 h3", class: "s-ink o" }),
        ],
      },
      {
        id: "amilakhvari-arms",
        after: "g8-l49",
        title: "ამილახვრების გერბი",
        fact: "თავადი ამილახვრები აზნაურ ზედგენიძეთა შთამომავლები იყვნენ — გადმოცემით, იოთამ ზედგენიძემ სიცოცხლის ფასად გადაარჩინა მეფე გიორგი VII.",
        shapes: [
          ground(92),
          el("path", { d: "M36 14 H84 V54 C84 72 72 82 60 88 C48 82 36 72 36 54 Z", class: "f-paper s-ink" }),
          el("path", { d: "M36 40 H84 M60 14 V40", class: "s-ink o" }),
          el("path", { d: "M44 20 V34 M40 24 H48", class: "s-terra o w4" }),
          el("path", { d: "M66 20 h5 v10 h6 v5 h-11 z", class: "f-ochre s-ink" }),
          el("ellipse", { cx: 60, cy: 60, rx: 14, ry: 12, class: "s-ink o" }),
          el("path", { d: "M52 62 h16 M56 56 l4 -4 l4 4", class: "s-ink o" }),
        ],
      },
      {
        id: "basilica-bombard",
        after: "g8-l50",
        title: "ბომბარდა „ბაზილიკა“",
        fact: "მეჰმედ II-ის შეკვეთით უნგრელმა ინჟინერმა ურბანმა უზარმაზარი ბომბარდა ჩამოასხა — მისი ბირთვი 540–590 კგ-ს იწონიდა.",
        shapes: [
          ground(92),
          el("rect", { x: 22, y: 72, width: 58, height: 12, class: "f-sand s-ink" }),
          el("path", { d: "M20 70 L84 52 L88 66 L24 84 Z", class: "f-emerald s-ink" }),
          el("ellipse", { cx: 86, cy: 59, rx: 5, ry: 8, class: "f-ink" }),
          el("path", { d: "M40 64 L42 72 M58 59 L60 67 M72 55 L74 63", class: "s-ink o" }),
          el("circle", { cx: 98, cy: 82, r: 9, class: "f-paper s-ink" }),
          el("circle", { cx: 106, cy: 86, r: 6, class: "f-paper s-ink" }),
        ],
      },
      {
        id: "sealed-letter",
        after: "g8-l52",
        title: "წერილი ბურგუნდიაში",
        fact: "1459 წელს საქართველოს მეფე გიორგი VIII-მ და სამცხის ათაბაგმა ყვარყვარე II-მ ბურგუნდიის მთავარს ოსმალთა წინააღმდეგ ერთად ბრძოლის შესახებ მისწერეს.",
        shapes: [
          ground(92),
          el("path", { d: "M28 20 H92 V80 H28 Z", class: "f-paper s-ink" }),
          el("path", { d: "M24 16 H96 V24 H24 Z M24 76 H96 V84 H24 Z", class: "f-sand s-ink" }),
          el("path", { d: "M38 34 H82 M38 42 H82 M38 50 H74 M38 58 H66", class: "s-thin o" }),
          el("path", { d: "M76 74 V92 M84 74 V92", class: "s-terra o w4" }),
          el("circle", { cx: 80, cy: 68, r: 9, class: "f-terra s-ink" }),
          el("path", { d: "M80 62 V74 M74 68 H86", class: "s-sand o" }),
        ],
      },
      {
        id: "vakhtang-astrolabe",
        after: "g8-l54",
        title: "ასტროლაბი",
        fact: "ასტროლაბით მზისა და ვარსკვლავების მიხედვით ადგენდნენ, სად იმყოფებოდა გემი; ვახტანგ VI-ის XVIII საუკუნის ასტროლაბი საქართველოს მუზეუმშია დაცული.",
        shapes: [
          ground(94),
          el("circle", { cx: 60, cy: 12, r: 6, class: "s-ink o w4" }),
          el("path", { d: "M54 22 L60 16 L66 22 Z", class: "f-ochre s-ink" }),
          el("circle", { cx: 60, cy: 54, r: 34, class: "f-ochre s-ink" }),
          el("circle", { cx: 60, cy: 54, r: 28, class: "f-paper s-ink" }),
          el("circle", { cx: 60, cy: 54, r: 18, class: "s-thin o" }),
          el("circle", { cx: 60, cy: 60, r: 11, class: "s-thin o" }),
          el("path", { d: "M60 26 V82 M32 54 H88", class: "s-thin o" }),
          el("path", { d: "M38 70 L82 38", class: "s-terra o w5" }),
          el("circle", { cx: 60, cy: 54, r: 3, class: "f-ink" }),
          el("path", { d: "M45 41 l3 -2 l1 3 z M74 64 l3 -2 l1 3 z M70 36 l3 -2 l1 3 z", class: "f-terra" }),
        ],
      },
      {
        id: "machu-picchu",
        after: "g8-l56",
        title: "მაჩუ-პიკჩუ",
        fact: "ინკების XV საუკუნის ციხე-ქალაქი მაჩუ-პიკჩუ ესპანელების დაპყრობიდან ასიოდე წლის შემდეგ მიატოვეს; ის მხოლოდ 1911 წელს აღმოაჩინეს ხელახლა.",
        shapes: [
          ground(92),
          el("path", { d: "M70 62 L88 12 L96 20 L110 62 Z", class: "f-emerald s-ink" }),
          el("path", { d: "M6 92 V84 H20 V78 H34 V72 H48 V66 H96 V72 H106 V78 H114 V92 Z", class: "f-emerald s-ink" }),
          el("path", { d: "M6 84 H114 M20 78 H106 M34 72 H96", class: "s-thin o" }),
          el("path", { d: "M50 66 L52 50 H66 L68 66 Z M72 66 L74 52 H86 L88 66 Z", class: "f-sand s-ink" }),
          el("path", { d: "M49 51 L59 40 L69 51 Z M71 53 L80 43 L89 53 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M57 66 V59 H61 V66 Z M78 66 V60 H82 V66 Z", class: "f-ink" }),
          el("path", { d: "M24 78 V72 M38 72 V66", class: "s-ink o" }),
        ],
      },
      {
        id: "printing-press",
        after: "g8-l58",
        title: "საბეჭდი დაზგა",
        fact: "XV საუკუნეში იოჰან გუტენბერგმა ლითონის ასოები ჩამოასხა და პირველი საბეჭდი დაზგა შექმნა; მხოლოდ XV საუკუნეში ევროპაში 30 ათასი ნაბეჭდი წიგნი გამოიცა.",
        shapes: [
          ground(92),
          el("path", { d: "M30 92 V10 M90 92 V10", class: "s-ink o w5" }),
          el("path", { d: "M26 10 H94 V18 H26 Z", class: "f-sand s-ink" }),
          el("path", { d: "M54 18 V42 M66 18 V42", class: "s-ink o w4" }),
          el("path", { d: "M60 26 H96", class: "s-terra o w4" }),
          el("circle", { cx: 98, cy: 26, r: 4, class: "f-terra s-ink" }),
          el("path", { d: "M42 42 H78 V50 H42 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M36 56 H84 V64 H36 Z", class: "f-sand s-ink" }),
          el("path", { d: "M44 52 H76 V56 H44 Z", class: "f-paper s-ink" }),
          el("path", { d: "M30 74 H90", class: "s-ink o w4" }),
          el("path", { d: "M8 92 V74 H22 V92 Z", class: "f-paper s-ink" }),
          el("path", { d: "M11 79 H19 M11 83 H19 M11 87 H17", class: "s-thin o" }),
        ],
      },
      {
        id: "galileo-telescope",
        after: "g8-l60",
        title: "გალილეოს ტელესკოპი",
        fact: "გალილეო პირველი იყო, ვინც ლინზებიანი მილი ცისკენ მიმართა — ტელესკოპით დაინახა, რომ მთვარის ზედაპირი გლუვი არ არის, იუპიტერს კი თანამგზავრები ჰყავს.",
        shapes: [
          ground(92),
          el("path", { d: "M60 58 L44 92 M60 58 L76 92 M60 58 V92", class: "s-ink o w4" }),
          el("path", { d: "M22 74 L96 26 L102 35 L28 83 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M44 60 L50 69 M72 42 L78 51", class: "s-ink o" }),
          el("path", { d: "M96 26 L102 35", class: "s-terra o w5" }),
          el("circle", { cx: 60, cy: 58, r: 3, class: "f-ink" }),
          el("circle", { cx: 100, cy: 12, r: 7, class: "f-paper s-ink" }),
          el("circle", { cx: 98, cy: 10, r: 1.5, class: "f-sand" }),
          el("circle", { cx: 102, cy: 15, r: 1.2, class: "f-sand" }),
          el("circle", { cx: 18, cy: 16, r: 1.6, class: "f-ink" }),
          el("circle", { cx: 34, cy: 8, r: 1.2, class: "f-ink" }),
          el("circle", { cx: 72, cy: 10, r: 1.2, class: "f-ink" }),
        ],
      },
      {
        id: "jesuit-book",
        after: "g8-l62",
        title: "იეზუიტების სასკოლო წიგნი",
        fact: "იეზუიტების სკოლებში ასტრონომიას, ფიზიკასა და მათემატიკას ასწავლიდნენ, ორდენის წევრები კი აზიის ხალხების ენებს იკვლევდნენ და ლექსიკონებს ადგენდნენ.",
        shapes: [
          ground(92),
          el("path", { d: "M14 46 L18 42 V82 Q38 76 60 84 Q82 76 102 82 V42 L106 46 V88 Q82 82 60 90 Q38 82 14 88 Z", class: "f-terra s-ink" }),
          el("path", { d: "M18 42 Q38 36 60 44 V84 Q38 76 18 82 Z", class: "f-paper s-ink" }),
          el("path", { d: "M60 44 Q82 36 102 42 V82 Q82 76 60 84 Z", class: "f-paper s-ink" }),
          el("path", { d: "M24 52 Q38 48 54 53 M24 60 Q38 56 54 61 M24 68 Q38 64 54 69", class: "s-thin o" }),
          el("path", { d: "M66 53 Q82 48 96 52 M66 61 Q82 56 96 60 M66 69 Q82 64 96 68", class: "s-thin o" }),
          el("path", { d: "M92 22 H104 V34 H92 Z", class: "f-ink" }),
          el("path", { d: "M98 24 L82 4", class: "s-ink o w4" }),
          el("path", { d: "M82 4 Q76 14 90 16", class: "f-sand s-ink" }),
        ],
      },
      {
        id: "vardzia",
        after: "g8-l64",
        title: "ვარძია",
        fact: "1551 წელს შაჰ-თამაზმა ვარძია დიდი ბრძოლით აიღო და იქიდან დიდძალი ალაფი, მათ შორის წიგნები, წაიღო.",
        shapes: [
          ground(92),
          el("path", { d: "M6 92 L12 40 Q18 22 40 18 Q62 10 84 16 Q106 20 112 44 L116 92 Z", class: "f-sand s-ink" }),
          el("path", { d: "M24 50 h8 v-6 q-4 -4 -8 0 Z M44 46 h8 v-6 q-4 -4 -8 0 Z M64 46 h8 v-6 q-4 -4 -8 0 Z M84 50 h8 v-6 q-4 -4 -8 0 Z", class: "f-ink" }),
          el("path", { d: "M30 68 h8 v-6 q-4 -4 -8 0 Z M54 66 h8 v-6 q-4 -4 -8 0 Z M78 68 h8 v-6 q-4 -4 -8 0 Z", class: "f-ink" }),
          el("path", { d: "M18 58 H100 M22 76 H96", class: "s-thin o" }),
          el("path", { d: "M58 24 V34 M54 28 H62", class: "s-terra o w4" }),
        ],
      },
      {
        id: "yedikule",
        after: "g8-l66",
        title: "იედიყულეს ციხე",
        fact: "1600 წელს ფარცხისთან დატყვევებული სიმონ I სტამბოლის იედიყულეს ციხეში გამოკეტეს, სადაც ის 1611 წელს გარდაიცვალა.",
        shapes: [
          ground(92),
          el("path", { d: "M12 92 V36 H40 V92 Z M80 92 V36 H108 V92 Z", class: "f-sand s-ink" }),
          el("path", { d: "M12 36 v-6 h5 v6 m5 0 v-6 h6 v6 m5 0 v-6 h7 v6 M80 36 v-6 h5 v6 m5 0 v-6 h6 v6 m5 0 v-6 h7 v6", class: "s-ink o" }),
          el("path", { d: "M40 92 V56 H80 V92 Z", class: "f-paper s-ink" }),
          el("path", { d: "M40 56 v-5 h6 v5 m6 0 v-5 h6 v5 m6 0 v-5 h6 v5 m6 0 v-5 h4 v5", class: "s-ink o" }),
          el("path", { d: "M52 92 V74 Q60 66 68 74 V92 Z", class: "f-ink" }),
          el("path", { d: "M22 50 h8 v10 h-8 Z M90 50 h8 v10 h-8 Z", class: "f-ink" }),
          el("path", { d: "M24 50 V60 M28 50 V60 M92 50 V60 M96 50 V60", class: "s-sand o" }),
          el("path", { d: "M12 70 H40 M80 70 H108", class: "s-thin o" }),
        ],
      },
      {
        id: "gremi",
        after: "g8-l68",
        title: "გრემი",
        fact: "1614 წელს, შაჰ-აბასის პირველი ლაშქრობისას, ირანელებმა კახეთის სატახტო ქალაქი გრემი დაიკავეს.",
        shapes: [
          ground(92),
          el("path", { d: "M6 92 L22 74 H98 L114 92 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M24 74 V50 H62 V74 Z", class: "f-terra s-ink" }),
          el("path", { d: "M20 50 L43 40 L66 50 Z", class: "f-terra s-ink" }),
          el("path", { d: "M35 40 V26 H51 V40 Z", class: "f-terra s-ink" }),
          el("path", { d: "M33 26 L43 10 L53 26 Z", class: "f-ink" }),
          el("path", { d: "M43 10 V4 M40 6 H46", class: "s-ink o" }),
          el("path", { d: "M41 30 h4 v7 h-4 Z M38 74 V64 Q43 58 48 64 V74 Z", class: "f-ink" }),
          el("path", { d: "M74 74 V30 H98 V74 Z", class: "f-terra s-ink" }),
          el("path", { d: "M72 30 L86 22 L100 30 Z", class: "f-terra s-ink" }),
          el("path", { d: "M83 40 h6 v8 h-6 Z M83 56 h6 v8 h-6 Z", class: "f-ink" }),
          el("path", { d: "M24 62 H62 M74 50 H98", class: "s-thin o" }),
        ],
      },
      {
        id: "bazaleti",
        after: "g8-l70",
        title: "ბაზალეთის ტბა",
        fact: "1626 წელს ბაზალეთის ტბასთან ერთმანეთს თეიმურაზ I და გიორგი სააკაძე დაუპირისპირდნენ; დამარცხებული სააკაძე ოსმალეთში წავიდა.",
        shapes: [
          el("path", { d: "M0 70 L30 34 L52 56 L78 24 L120 70 Z", class: "f-sand s-ink" }),
          el("path", { d: "M78 24 L70 34 L78 32 L86 36 Z", class: "f-paper" }),
          el("path", { d: "M10 86 Q60 64 110 86 Q60 100 10 86 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M30 84 q6 -3 12 0 M56 80 q6 -3 12 0 M78 86 q6 -3 12 0", class: "s-thin o" }),
          el("path", { d: "M18 70 V50 M100 70 V46", class: "s-ink o" }),
          el("path", { d: "M18 50 L30 54 L18 58 Z", class: "f-terra" }),
          el("path", { d: "M100 46 L88 50 L100 54 Z", class: "f-ink" }),
        ],
      },
      {
        id: "mamluk",
        after: "g8-l72",
        title: "მამლუქი მეომარი",
        fact: "ეგვიპტეში XVI საუკუნიდან განსაკუთრებით ქართველი მამლუქები დაწინაურდნენ — მათ ხშირად ოლქების მმართველებადაც ნიშნავდნენ.",
        shapes: [
          ground(92),
          el("path", { d: "M46 92 L50 64 H70 L74 92 Z", class: "f-terra s-ink" }),
          el("path", { d: "M48 64 L52 40 H68 L72 64 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M52 40 L44 58 M68 40 L80 30", class: "s-ink w4" }),
          el("path", { d: "M60 26 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0", class: "f-sand s-ink" }),
          el("path", { d: "M50 24 Q60 8 70 24 Z", class: "f-paper s-ink" }),
          el("path", { d: "M78 34 L96 6", class: "s-ink w5" }),
          el("path", { d: "M50 52 H70 M56 64 V92 M64 64 V92", class: "s-thin o" }),
        ],
      },
      {
        id: "qvevri",
        after: "g8-l74",
        title: "ქვევრი",
        fact: "შარდენის ცნობით, სამეგრელოში ყურძენს ამოღარულ ხეში წურავდნენ, წვენს კი მიწაში ჩაფლულ ქვევრებში ასხამდნენ.",
        shapes: [
          ground(92),
          el("path", { d: "M14 60 H106 V92 H14 Z", class: "f-sand o" }),
          el("path", { d: "M48 40 Q30 56 40 78 Q52 98 60 98 Q68 98 80 78 Q90 56 72 40 Z", class: "f-terra s-ink" }),
          el("path", { d: "M48 40 H72 L70 34 H50 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M44 52 Q60 58 76 52", class: "s-thin o" }),
          el("path", { d: "M14 60 H106", class: "s-ink" }),
          el("path", { d: "M84 30 Q92 14 100 22 Q96 34 84 30 Z", class: "f-ochre s-thin" }),
          el("path", { d: "M90 32 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M98 36 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M94 42 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0", class: "f-ink s-thin" }),
        ],
      },
      {
        id: "granada",
        after: "g8-l76",
        title: "გრანადის ციხე",
        fact: "1492 წელს ფერდინანდმა და ისაბელმა გრანადა შემოიერთეს — რეკონკისტა დასრულდა და ესპანეთი საბოლოოდ გაერთიანდა.",
        shapes: [
          ground(92),
          el("path", { d: "M20 92 V50 H34 V92 Z M86 92 V50 H100 V92 Z", class: "f-terra s-ink" }),
          el("path", { d: "M34 92 V62 H86 V92 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M18 50 V42 H22 V46 H26 V42 H30 V46 H34 V42 H36 V50 Z M84 50 V42 H88 V46 H92 V42 H96 V46 H100 V42 H102 V50 Z", class: "f-terra s-ink" }),
          el("path", { d: "M34 62 V56 H40 V60 H46 V56 H52 V60 H58 V56 H64 V60 H70 V56 H76 V60 H82 V56 H86 V62 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M52 92 V78 Q60 66 68 78 V92 Z", class: "f-ink s-ink" }),
          el("path", { d: "M27 66 V58 M93 66 V58", class: "s-ink w4" }),
          el("path", { d: "M60 56 V30 M60 30 L76 36 L60 42", class: "f-paper s-ink" }),
        ],
      },
      {
        id: "manuscript",
        after: "g8-l78",
        title: "ხელნაწერი წიგნი",
        fact: "როცა ევროპაში უკვე წიგნებს ბეჭდავდნენ, საქართველოში წიგნები კიდევ დიდხანს ხელით იწერებოდა და ეკლესიისა და ფეოდალური ზედაფენის ვიწრო წრეს ემსახურებოდა.",
        shapes: [
          ground(92),
          el("path", { d: "M16 84 L60 76 L104 84 L104 34 L60 26 L16 34 Z", class: "f-terra s-ink" }),
          el("path", { d: "M20 80 L60 72 V30 L20 37 Z M100 80 L60 72 V30 L100 37 Z", class: "f-paper s-ink" }),
          el("path", { d: "M26 44 L54 39 M26 51 L54 46 M26 58 L54 53 M26 65 L54 60 M66 39 L94 44 M66 46 L94 51 M66 53 L94 58", class: "s-thin o" }),
          el("path", { d: "M68 60 h12 v12 h-12 Z", class: "f-ochre s-thin" }),
          el("path", { d: "M60 30 V72", class: "s-ink" }),
          el("path", { d: "M84 20 L100 8 L96 18 Z", class: "f-ink s-thin" }),
        ],
      },
    ],

    /* ===== მე-9 კლასი — ახალი დრო (XVII–XIX სს.) ===== */
    "g9-c1": [
      {
        id: "silk",
        after: "g9-l2",
        title: "აბრეშუმის კოჭა",
        fact: "XVII საუკუნეში აღმოსავლეთსა და ევროპას შორის ვაჭრობაში პირველ ადგილზე აბრეშუმი იყო; ოლეარიუსის ცნობით, საქართველო და სომხეთი წელიწადში 5 000 საპალნე აბრეშუმს აწარმოებდნენ.",
        shapes: [
          ground(90),
          el("path", { d: "M30 22 H70 V30 H30 Z M30 82 H70 V90 H30 Z", class: "f-ochre s-ink" }),
          el("path", { d: "M36 30 H64 V82 H36 Z", class: "f-terra s-ink" }),
          el("path", { d: "M36 38 H64 M36 46 H64 M36 54 H64 M36 62 H64 M36 70 H64 M36 78 H64", class: "s-thin o" }),
          el("path", { d: "M64 50 Q82 44 88 58 T104 70", class: "s-terra w4 o" }),
          el("ellipse", { cx: 96, cy: 82, rx: 9, ry: 6, class: "f-paper s-ink" }),
          el("path", { d: "M90 80 Q96 76 102 80 M90 84 Q96 88 102 84", class: "s-thin o" }),
        ],
      },
    ],

    /* ===== მე-10 კლასი — რევოლუციების ეპოქა ===== */
    "g10-c1": [
      {
        id: "bastille",
        title: "ბასტილიის ციხე",
        fact: "1789 წლის 14 ივლისს პარიზელებმა ბასტილიის ციხე-სიმაგრე აიღეს — ეს დღე დღემდე საფრანგეთის ეროვნული დღესასწაულია.",
        shapes: [
          ground(90),
          el("rect", { x: 30, y: 40, width: 60, height: 50, class: "f-sand s-ink" }),
          el("rect", { x: 18, y: 28, width: 20, height: 62, class: "f-sand s-ink" }),
          el("rect", { x: 82, y: 28, width: 20, height: 62, class: "f-sand s-ink" }),
          el("path", { d: "M18 28 V22 H23 V28 M33 28 V22 H38 V28 M82 28 V22 H87 V28 M97 28 V22 H102 V28", class: "s-ink o" }),
          el("path", { d: "M44 40 V35 H49 V40 M58 40 V35 H63 V40 M72 40 V35 H77 V40", class: "s-ink o" }),
          el("path", { d: "M28 44 V52 M92 44 V52 M28 64 V72 M92 64 V72", class: "s-ink o" }),
          el("path", { d: "M52 90 V72 A8 8 0 0 1 68 72 V90 Z", class: "f-ink" }),
          el("path", { d: "M28 22 V4", class: "s-ink o" }),
          el("path", { d: "M28 4 H44 L40 8 L44 12 H28 Z", class: "f-terra" }),
        ],
      },
    ],

    /* ===== მე-11 კლასი — პირველი მსოფლიო ომი ===== */
    "g11-c1": [
      {
        id: "trench-helmet",
        title: "ფოლადის ჩაფხუტი",
        fact: "ფოლადის ჩაფხუტი მასობრივად პირველ მსოფლიო ომში, 1915 წლიდან გავრცელდა — ჯარისკაცები თვეობით სანგრებში იბრძოდნენ და ჭურვის ნამსხვრევებისგან თავს იცავდნენ.",
        shapes: [
          el("path", { d: "M30 60 C30 36 44 26 60 26 C76 26 90 36 90 60 Z", class: "f-emerald s-ink" }),
          el("path", { d: "M14 62 C30 56 90 56 106 62 C96 68 24 68 14 62 Z", class: "f-emerald s-ink" }),
          el("circle", { cx: 60, cy: 30, r: 2, class: "f-ink" }),
          el("path", { d: "M34 64 Q60 88 86 64", class: "s-ochre o" }),
          el("path", { d: "M8 90 H112", class: "s-thin o" }),
        ].concat([16, 36, 56, 76, 96].map((x) =>
          el("path", { d: "M" + x + " 86 l8 8 M" + (x + 8) + " 86 l-8 8", class: "s-ink o" }))),
      },
    ],

    /* ===== მე-12 კლასი — ცივი ომი ===== */
    "g12-c1": [
      {
        id: "sputnik",
        title: "„სპუტნიკ-1“",
        fact: "1957 წელს საბჭოთა კავშირმა დედამიწის პირველი ხელოვნური თანამგზავრი „სპუტნიკ-1“ გაუშვა — ასე დაიწყო ცივი ომის „კოსმოსური რბოლა“ აშშ-სთან.",
        shapes: [
          el("path", { d: "M58 52 L108 70 M60 46 L110 54 M56 56 L100 86 M50 58 L86 94", class: "s-ink o" }),
          el("circle", { cx: 46, cy: 44, r: 16, class: "f-sand s-ink" }),
          el("path", { d: "M30 44 H62", class: "s-thin o" }),
          el("path", { d: "M37 36 A11 11 0 0 1 47 31", class: "s-thin o" }),
          el("circle", { cx: 20, cy: 18, r: 1.8, class: "f-ochre" }),
          el("circle", { cx: 96, cy: 18, r: 1.8, class: "f-ochre" }),
          el("circle", { cx: 16, cy: 80, r: 1.8, class: "f-ochre" }),
          el("circle", { cx: 104, cy: 34, r: 1.8, class: "f-ochre" }),
          el("circle", { cx: 80, cy: 12, r: 1.4, class: "f-ochre" }),
        ],
      },
    ],

    /* ===== აბიტურიენტები — წყაროებთან მუშაობა ===== */
    "ne-c1": [
      {
        id: "magnifier",
        title: "წყაროს კვლევა",
        fact: "ისტორიკოსი წყაროს ყოველთვის კრიტიკულად კითხულობს: ვინ შექმნა, როდის, ვისთვის და რა მიზნით — და ადარებს მას სხვა წყაროებს.",
        shapes: [
          el("path", { d: "M14 14 H62 L74 26 V88 H14 Z", class: "f-paper s-ink" }),
          el("path", { d: "M62 14 V26 H74", class: "s-ink o" }),
          el("path", { d: "M22 28 H54 M22 36 H62 M22 44 H66 M22 52 H50 M22 60 H56 M22 68 H46", class: "s-thin o" }),
          el("circle", { cx: 30, cy: 79, r: 5, class: "f-terra s-ink" }),
          el("line", { x1: 89, y1: 69, x2: 106, y2: 88, class: "s-ink o w8" }),
          el("line", { x1: 89, y1: 69, x2: 106, y2: 88, class: "s-terra o w5" }),
          el("circle", { cx: 76, cy: 56, r: 18, class: "f-paper s-ochre w6" }),
          el("circle", { cx: 76, cy: 56, r: 18, class: "s-ink o" }),
          el("path", { d: "M66 52 H88 M66 60 H84", class: "s-ink o" }),
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
