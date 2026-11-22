/* ==========================================================
   Edubba — „ჩემი საგანძური“ (treasury.html)
   ----------------------------------------------------------
   ზემოთ — კლასის პროგრესი და გახსნები, ქვემოთ — „თარო“: თითო ბლოკს
   (ქვეთავს ან თავს) თითო განძი. ლოგიკა და ნახატები — js/treasure.js.
   ახალი ლითონი (ბრინჯაო/ვერცხლი/ოქრო) ერთხელ „გამოჩნდება“ ანიმაციით;
   ნანახი ლითონები ინახება profile.treasury-ში. ტექსტი — მხოლოდ textContent-ით.
   ========================================================== */
(function () {
  "use strict";

  const { createEl } = window.IMS_UTILS;
  const store = window.IMS_STORE;
  const data = window.IMS_DATA;
  const T = window.IMS_TREASURE;
  const gems = window.IMS_GEMS;

  if (!store.requireAuth()) return;
  const daily = store.checkDaily();
  if (!daily) return;
  let profile = daily.profile;

  const $ = (id) => document.getElementById(id);
  const el = {
    tabs: $("courseTabs"),
    pct: $("pct"),
    pctText: $("pctText"),
    bar: $("bar"),
    unlocks: $("unlocks"),
    shelfTitle: $("shelfTitle"),
    shelf: $("shelf"),
    reveal: $("reveal"),
    revealStage: $("revealStage"),
    revealKicker: $("revealKicker"),
    revealArt: $("revealArt"),
    revealGems: $("revealGems"),
    revealTitle: $("revealTitle"),
    revealText: $("revealText"),
    revealClose: $("revealClose"),
  };

  store.bindThemeToggle($("themeToggle"), $("themeIcon"));

  // „მე-8 კლასი“ → „მე-8 კლასის“ (თაროს სათაურისთვის)
  const genitive = (title) => (/კლასი$/.test(title) ? title.replace(/კლასი$/, "კლასის") : title);

  /** კლასები ჩანართებად: რომელშიც რამე გავლილია + მიმდინარე. */
  function courseIds() {
    const current = data.currentCourseId();
    const done = profile.completedLessons;
    return data.courses
      .filter((c) => c.id === current || done.some((id) => id.startsWith(c.lessonPrefix)))
      .map((c) => c.id);
  }

  let courseId = data.currentCourseId();

  /* ---------- ჩანართები ---------- */

  function renderTabs() {
    const ids = courseIds();
    el.tabs.hidden = ids.length < 2;
    el.tabs.replaceChildren();
    ids.forEach((id) => {
      const c = data.getCourse(id);
      const tab = createEl("button", "tsy-tab", c.title);
      tab.type = "button";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(id === courseId));
      tab.tabIndex = id === courseId ? 0 : -1;
      tab.addEventListener("click", () => select(id));
      el.tabs.append(tab);
    });
  }

  el.tabs.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const ids = courseIds();
    const i = ids.indexOf(courseId);
    const next = ids[(i + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length];
    select(next).then(() => {
      const tab = el.tabs.querySelector('[aria-selected="true"]');
      if (tab) tab.focus();
    });
  });

  /* ---------- პროგრესი და გახსნები ---------- */

  function renderProgress(course) {
    const p = T.progress(course, profile);
    el.pct.textContent = p.pct + "%";
    el.pctText.textContent = course.title + " · " + p.done + " / " + p.total + " ქვა შეგროვებულია";
    el.bar.style.setProperty("--progress", p.pct + "%");
    el.bar.setAttribute("aria-valuenow", String(p.pct));
    el.bar.setAttribute("aria-label", "კლასის პროგრესი: " + p.pct + "%");
    el.bar.querySelectorAll("[data-pct]").forEach((mark) => {
      mark.classList.toggle("is-on", p.pct >= Number(mark.dataset.pct));
    });

    const need = (pct) => Math.max(0, Math.ceil((p.total * pct) / 100) - p.done);
    const unit = course.chapters.some((ch) => (ch.sections || []).length) ? "ქვეთავი" : "თავი";
    const items = [
      { icon: "🎲", title: "ურის სამეფო თამაში", on: T.firstBlockDone(course, profile), lockText: "პირველი დასრულებული " + unit, href: "games.html?course=" + course.id },
      { icon: "◈", title: "ურის დაფაზე ლაჟვარდის ჩასმები", on: p.pct >= T.UNLOCK_INLAY, lockText: T.UNLOCK_INLAY + "% · კიდევ " + need(T.UNLOCK_INLAY) + " გაკვეთილი" },
      { icon: "🎨", title: "ფრიზის ფერის არჩევა", on: T.friezeUnlocked(profile), lockText: T.UNLOCK_FRIEZE + "% · კიდევ " + need(T.UNLOCK_FRIEZE) + " გაკვეთილი", picker: true },
      { icon: "✦", title: "ურის დაფა სრულად მოჭედილი", on: p.pct >= T.UNLOCK_FULL, lockText: T.UNLOCK_FULL + "% · კიდევ " + need(T.UNLOCK_FULL) + " გაკვეთილი" },
    ];
    el.unlocks.replaceChildren(...items.map((u) => {
      const li = createEl("li", "tsy-unlock" + (u.on ? " is-on" : "") + (u.picker && u.on ? " tsy-unlock--wide" : ""));
      li.append(createEl("span", "tsy-unlock__icon", u.icon));
      const body = createEl("span", "tsy-unlock__body");
      const status = createEl("span", "tsy-unlock__state", u.on ? "✓ გახსნილია" : "🔒 " + u.lockText);
      if (u.on && u.href) {
        const link = createEl("a", "tsy-unlock__link", "თამაში →");
        link.href = u.href;
        status.append(" · ", link);
      }
      body.append(createEl("b", "tsy-unlock__title", u.title), status);
      if (u.picker && u.on) body.append(friezePicker());
      li.append(body);
      return li;
    }));
  }

  /* ---------- ფრიზის ფერი (დაფის ზედა და ქვედა ორნამენტი) ---------- */

  const FRIEZE_NAMES = { lapis: "ლაჟვარდი", carnelian: "სარდიონი", gold: "ოქრო", clay: "თიხა" };

  function friezePicker() {
    const box = createEl("span", "tsy-frieze");
    box.append(createEl("span", "tsy-frieze__preview"));
    const group = createEl("span", "tsy-frieze__swatches");
    group.setAttribute("role", "radiogroup");
    group.setAttribute("aria-label", "ფრიზის ფერი");
    store.FRIEZE_COLORS.forEach((color) => {
      const btn = createEl("button", "tsy-swatch tsy-swatch--" + color);
      btn.type = "button";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(profile.friezeColor === color));
      btn.setAttribute("aria-label", FRIEZE_NAMES[color]);
      btn.title = FRIEZE_NAMES[color];
      btn.addEventListener("click", () => {
        profile = store.updateProfile((p) => { p.friezeColor = color; }) || profile;
        store.applyFrieze(profile.friezeColor);
        group.querySelectorAll(".tsy-swatch").forEach((b) => {
          b.setAttribute("aria-checked", String(b === btn));
        });
      });
      group.append(btn);
    });
    box.append(group);
    return box;
  }

  /* ---------- თარო ---------- */

  function gemRow(course, block) {
    const row = createEl("span", "tsy-gems");
    block.lessons.forEach((lesson) => {
      const quality = store.gemState(profile, lesson.id);
      const kind = gems.kindFor(course.lessons.indexOf(lesson));
      row.append(quality
        ? gems.icon(kind, quality, store.gemDusty(profile, lesson.id))
        : gems.icon(null, "socket"));
    });
    return row;
  }

  function nextText(st, unit) {
    if (st.tier === "locked") return "დაიწყე ეს " + unit + " — გაიგებ, რა განძი იმალება.";
    if (st.tier === "progress") return (st.total - st.done) + " გაკვეთილი დარჩა ბრინჯაომდე.";
    if (st.tier === "bronze") return "ვერცხლამდე: გააპრიალე " + st.rough + " ნატეხი ქვა (გაიარე უშეცდომოდ).";
    if (st.tier === "silver") return "ოქრომდე: გაიმეორე კიდევ " + (st.total - st.reviewed) + " გაკვეთილი.";
    return "სრულად ბრწყინავს! ✦";
  }

  function itemCard(course, block) {
    const st = T.blockState(block, profile);
    const metal = T.isMetal(st.tier);
    const card = createEl("article", "tsy-item tsy-item--" + st.tier);

    const art = createEl("div", "tsy-item__art");
    art.append(T.art(block.item.id, st.tier, { locked: !metal, question: st.tier === "locked" }));
    if (st.tier === "gold") {
      for (let k = 0; k < 3; k++) art.append(createEl("span", "tsy-sparkle tsy-sparkle--" + (k + 1), "✦"));
    }
    art.append(createEl("span", "tr-badge tsy-item__badge" + (metal ? " tr-badge--" + st.tier : ""), T.TIER_NAMES[st.tier]));
    card.append(art);

    card.append(
      createEl("h3", "tsy-item__name", st.tier === "locked" ? "დაფარული განძი" : block.item.name),
      createEl("p", "tsy-item__block", block.unit + " " + block.number + " · " + block.title)
    );
    const row = gemRow(course, block);
    row.setAttribute("role", "img");
    row.setAttribute("aria-label", st.done + " / " + st.total + " ქვა");
    card.append(row, createEl("p", "tsy-item__next", nextText(st, block.unit)));
    return card;
  }

  function renderShelf(course) {
    const list = T.blocks(course);
    el.shelfTitle.textContent = genitive(course.title) + " თარო · " + list.length + " განძი";
    el.shelf.replaceChildren(...list.map((b) => itemCard(course, b)));
  }

  /* ---------- ახალი განძის გამოჩენა ---------- */

  const REVEAL_TEXT = {
    bronze: "ქვებმა ბრინჯაოს განძი შექმნა. გააპრიალე ნატეხი ქვები — და ის ვერცხლად იქცევა.",
    silver: "ყველა ქვა გაპრიალებულია — განძი ვერცხლად იქცა! გაიმეორე გაკვეთილები და ოქროდ იქცევა.",
    gold: "ყველა გაკვეთილი გაიმეორე — განძი ოქროდ იქცა! ის უკან აღარ ჩამოდის.",
  };
  const KICKER = { bronze: "ბლოკი დასრულდა!", silver: "განძი გაბრწყინდა!", gold: "ოქროს განძი!" };

  let lastFocus = null;

  /** ერთ ვიზიტზე ერთი გამოჩენა — ბოლო ახალი; დახურვისას ყველა ახალი ნანახად ითვლება. */
  function maybeReveal(course) {
    const fresh = T.unseen(course, profile);
    if (!fresh.length) return;
    const { block, state } = fresh[fresh.length - 1];
    el.revealKicker.textContent = KICKER[state.tier];
    el.revealArt.replaceChildren(T.art(block.item.id, state.tier));
    el.revealGems.replaceChildren(...block.lessons.map((l, j) => {
      const icon = gems.icon(gems.kindFor(course.lessons.indexOf(l)), store.gemState(profile, l.id) || "polished");
      icon.classList.add("tsy-fly", "tsy-fly--" + (j % 8));
      return icon;
    }));
    el.revealTitle.textContent = block.item.name + " · " + T.TIER_NAMES[state.tier];
    el.revealText.textContent = block.unit + " " + block.number + ": " + REVEAL_TEXT[state.tier];
    el.revealStage.className = "tsy-reveal__stage tsy-reveal__stage--" + state.tier;

    lastFocus = document.activeElement;
    el.reveal.hidden = false;
    el.revealStage.classList.remove("is-go");
    void el.revealStage.offsetWidth; // ანიმაციის თავიდან გაშვება
    el.revealStage.classList.add("is-go");
    el.revealClose.focus();

    el.reveal.dataset.course = course.id;
  }

  function closeReveal() {
    if (el.reveal.hidden) return;
    el.reveal.hidden = true;
    const course = data.getCourse(el.reveal.dataset.course);
    const fresh = T.unseen(course, profile);
    profile = store.updateProfile((p) => {
      fresh.forEach((x) => { p.treasury[x.block.id] = x.state.tier; });
    }) || profile;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  el.revealClose.addEventListener("click", closeReveal);
  el.reveal.addEventListener("click", (e) => { if (e.target === el.reveal) closeReveal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeReveal(); });

  /* ---------- ლეგენდა ---------- */

  [["legendBronze", "bronze"], ["legendSilver", "silver"], ["legendGold", "gold"]].forEach(([id, tier]) => {
    $(id).append(T.art("lyre", tier));
  });

  /* ---------- სტარტი ---------- */

  function select(id) {
    courseId = id;
    renderTabs();
    return data.load([id]).then(([course]) => {
      if (courseId !== id) return;
      renderProgress(course);
      renderShelf(course);
      maybeReveal(course);
    }, data.showLoadError);
  }

  select(courseId);
})();
