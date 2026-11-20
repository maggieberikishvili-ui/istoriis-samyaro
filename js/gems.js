/* ==========================================================
   ძვირფასი ქვები ბილიკზე (SVG, ფოტოს გარეშე)
   ----------------------------------------------------------
   ერთი გაკვეთილი = ერთი ქვა. ქვის სახეობა გაკვეთილის რიგით ნომერზეა
   მიბმული კურსში (kindFor) — ახალი გაკვეთილი ბოლოში ემატება, ამიტომ
   ძველი ქვები არ იცვლება.

   გვერდზე ერთხელ ჩაიდება დამალული SVG „სპრაიტი“ (გრადიენტები + <symbol>-ები),
   ხოლო თითო ქვა მხოლოდ <use>-ია — მსუბუქია ასობით გაკვეთილზეც.
   ფერები — მხოლოდ css/variables.css-ის --gem-* ცვლადებით (css/gems.css).

   გამოყენება:
     IMS_GEMS.icon("lapis")          — გაპრიალებული ქვა
     IMS_GEMS.icon("lapis", "rough") — ნატეხი (გავლილია შეცდომებით)
     IMS_GEMS.icon(null, "socket")   — ცარიელი ბუდე
     IMS_GEMS.wedge()                — ლურსმნული სოლი (ბილიკის კავშირისთვის)
   ========================================================== */
(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const KINDS = ["lapis", "carnelian", "gold", "agate", "silver", "shell"];
  const NAMES = {
    lapis: "ლაჟვარდი", carnelian: "სარდიონი", gold: "ოქრო",
    agate: "აქატი", silver: "ვერცხლი", shell: "ნიჟარა",
  };

  // წახნაგოვანი (რვაკუთხა) ქვა + შიდა წახნაგები
  const CUT = "56,41.9 41.9,56 22.1,56 8,41.9 8,22.1 22.1,8 41.9,8 56,22.1";
  const TABLE = "44,37 37,44 27,44 20,37 20,27 27,20 37,20 44,27";
  const FACETS = "M56 41.9 L44 37 M41.9 56 L37 44 M22.1 56 L27 44 M8 41.9 L20 37 " +
    "M8 22.1 L20 27 M22.1 8 L27 20 M41.9 8 L37 20 M56 22.1 L44 27";
  // ნატეხი — უსწორმასწორო ქვა, ბზარები ერთი წერტილიდან
  const ROUGH = "M15 12 L40 6 L53 15 L57 39 L47 58 L19 57 L8 37 Z";
  const ROUGH_CRACKS = "M15 12 L30 30 L40 6 M30 30 L57 39 M30 30 L19 57 M30 30 L8 37 M30 30 L47 58";

  /** განმეორებადი „შემთხვევითი“ რიცხვები — ქვის ნახატი ყოველთვის ერთნაირია. */
  function seeded(seed) {
    let s = seed >>> 0;
    return function (min, max) {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      return min + r * (max - min);
    };
  }

  function node(tag, attrs, cls) {
    const n = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach((k) => n.setAttribute(k, attrs[k]));
    if (cls) n.setAttribute("class", cls);
    return n;
  }

  const f1 = (n) => n.toFixed(1);

  /** ქვის ზედაპირის ნახატი (ძარღვები, ზოლები, ბზინვარება). */
  function texture(kind) {
    const r = seeded(KINDS.indexOf(kind) + 7);
    const out = [];
    if (kind === "lapis") {
      // ღია ლაქები + თეთრი კალციტის ძარღვები + ოქროსფერი პირიტის ნაწილაკები
      for (let i = 0; i < 6; i++) {
        out.push(node("circle", { cx: f1(r(8, 56)), cy: f1(r(8, 56)), r: f1(r(3, 7)) }, "gem-tx gem-tx--cloud"));
      }
      for (let i = 0; i < 3; i++) {
        out.push(node("path", {
          d: "M" + f1(r(0, 64)) + " " + f1(r(-4, 20)) + " Q" + f1(r(10, 54)) + " " + f1(r(20, 44)) +
            " " + f1(r(0, 64)) + " " + f1(r(44, 70)),
          "stroke-width": f1(r(0.5, 1.4)),
        }, "gem-tx gem-tx--vein"));
      }
      for (let i = 0; i < 16; i++) {
        out.push(node("circle", { cx: f1(r(8, 56)), cy: f1(r(8, 56)), r: f1(r(0.4, 1.1)) }, "gem-tx gem-tx--fleck"));
      }
    } else if (kind === "agate") {
      // კონცენტრული ზოლები, ღია და მუქი მონაცვლეობით
      [6, 11, 15, 20, 25, 31].forEach((w, i) => {
        out.push(node("ellipse", { cx: 36, cy: 38, rx: w, ry: f1(w * 0.8) },
          "gem-tx gem-tx--band gem-tx--band-" + (i % 2 === 0 ? "light" : "dark")));
      });
    } else if (kind === "carnelian") {
      out.push(node("ellipse", { cx: 36, cy: 38, rx: 14, ry: 11 }, "gem-tx gem-tx--glow"));
      out.push(node("ellipse", { cx: 22, cy: 44, rx: 8, ry: 5 }, "gem-tx gem-tx--glow-soft"));
    } else if (kind === "shell") {
      // სადაფის ციმციმი
      out.push(node("path", { d: "M0 20 Q32 8 64 22 V30 Q32 16 0 28 Z" }, "gem-tx gem-tx--pearl-1"));
      out.push(node("path", { d: "M0 36 Q32 26 64 40 V46 Q32 34 0 44 Z" }, "gem-tx gem-tx--pearl-2"));
      out.push(node("path", { d: "M0 50 Q32 42 64 54 V58 Q32 48 0 56 Z" }, "gem-tx gem-tx--pearl-3"));
    } else {
      // ოქრო, ვერცხლი — ლითონის ანარეკლი
      out.push(node("path", { d: "M0 26 L64 14 V22 L0 34 Z" }, "gem-tx gem-tx--metal"));
    }
    return out;
  }

  function gradient(kind) {
    const metal = kind === "gold" || kind === "silver";
    const g = metal
      ? node("linearGradient", { id: "ims-gem-g-" + kind, x1: 0, y1: 0, x2: 1, y2: 1 })
      : node("radialGradient", { id: "ims-gem-g-" + kind, cx: "35%", cy: "30%", r: "80%" });
    [["0", "hi"], [".55", "mid"], ["1", "lo"]].forEach(([offset, tone]) => {
      g.append(node("stop", { offset: offset }, "gem-stop gem-stop--" + kind + "-" + tone));
    });
    return g;
  }

  /** ქვის ფორმა: წახნაგოვანი (გაპრიალებული) ან ნატეხი. */
  function outline(rough, attrs, cls) {
    return rough
      ? node("path", Object.assign({ d: ROUGH }, attrs), cls)
      : node("polygon", Object.assign({ points: CUT }, attrs), cls);
  }

  function gemSymbol(kind, rough) {
    const sym = node("symbol", { id: "ims-gem-" + kind + (rough ? "-rough" : ""), viewBox: "0 0 64 64" });
    sym.append(outline(rough, { transform: "translate(1.5 2.5)" }, "gem-shadow"));
    // ნატეხი მქრქალია (css: .gem-matte), გაპრიალებული — ბზინავს
    const body = node("g", null, rough ? "gem-matte" : null);
    body.append(outline(rough, { fill: "url(#ims-gem-g-" + kind + ")" }));
    const inner = node("g", { "clip-path": "url(#ims-gem-clip" + (rough ? "-rough" : "") + ")" });
    texture(kind).forEach((t) => inner.append(t));
    const facets = node("g", null, "gem-facets");
    if (rough) facets.append(node("path", { d: ROUGH_CRACKS }));
    else facets.append(node("polygon", { points: TABLE }), node("path", { d: FACETS }));
    inner.append(facets);
    if (!rough) {
      inner.append(node("ellipse", { cx: 22, cy: 18, rx: 11, ry: 5, transform: "rotate(-25 22 18)" }, "gem-gloss"));
    }
    body.append(inner);
    sym.append(body);
    sym.append(outline(rough, null, "gem-edge gem-edge--" + kind));
    return sym;
  }

  let spriteReady = false;

  /** დამალული სპრაიტი — ერთხელ, პირველივე გამოძახებისას. */
  function ensureSprite() {
    if (spriteReady) return;
    spriteReady = true;
    const svg = node("svg", { "aria-hidden": "true", focusable: "false" }, "gem-sprite");
    const defs = node("defs");
    const clip = node("clipPath", { id: "ims-gem-clip" });
    clip.append(node("polygon", { points: CUT }));
    const clipRough = node("clipPath", { id: "ims-gem-clip-rough" });
    clipRough.append(node("path", { d: ROUGH }));
    defs.append(clip, clipRough);
    KINDS.forEach((kind) => defs.append(gradient(kind)));
    svg.append(defs);
    KINDS.forEach((kind) => svg.append(gemSymbol(kind, false), gemSymbol(kind, true)));

    // ცარიელი ბუდე — წყვეტილი კონტური
    const socket = node("symbol", { id: "ims-gem-socket", viewBox: "0 0 64 64" });
    socket.append(node("polygon", { points: CUT }, "gem-socket"));
    svg.append(socket);

    // ლურსმნული სოლი: სამკუთხა თავი + გრძელი კუდი (ცენტრი — 0,0; მიმართულება → )
    const wedge = node("symbol", { id: "ims-wedge", viewBox: "-7 -4.5 17 9", overflow: "visible" });
    wedge.append(node("path", { d: "M-6 -3.6 L0 0 L-6 3.6 Z M-0.5 -0.7 H8 L9 0 L8 0.7 H-0.5 Z" }));
    svg.append(wedge);

    document.body.append(svg);
  }

  /**
   * ქვა ან ცარიელი ბუდე, როგორც <svg>. kind — KINDS-იდან;
   * state: "polished" (ნაგულისხმევი) | "rough" (ნატეხი) | "socket" (ცარიელი ბუდე).
   */
  function icon(kind, state) {
    ensureSprite();
    const isGem = state !== "socket" && KINDS.includes(kind);
    const rough = isGem && state === "rough";
    const svg = node("svg", { viewBox: "0 0 64 64", "aria-hidden": "true", focusable: "false" },
      "gem" + (isGem ? " gem--" + kind + (rough ? " gem--rough" : "") : " gem--socket"));
    svg.append(node("use", { href: isGem ? "#ims-gem-" + kind + (rough ? "-rough" : "") : "#ims-gem-socket" }));
    return svg;
  }

  /** ბილიკის სოლის <use> (სიგრძე ~17, სიმაღლე ~9 ერთეული). */
  function wedge(x, y, angle, cls) {
    ensureSprite();
    const use = node("use", {
      href: "#ims-wedge", x: -7, y: -4.5, width: 17, height: 9,
      transform: "translate(" + f1(x) + " " + f1(y) + ") rotate(" + Math.round(angle) + ")",
    }, cls);
    return use;
  }

  window.IMS_GEMS = {
    KINDS: KINDS,
    NAMES: NAMES,
    kindFor: (index) => KINDS[((index % KINDS.length) + KINDS.length) % KINDS.length],
    icon: icon,
    wedge: wedge,
  };
})();
