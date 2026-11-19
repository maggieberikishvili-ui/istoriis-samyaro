/* ==========================================================
   ისტორიის სამყარო — „დროის ხაზის არქიტექტორი“: აგურის კედელი
   ----------------------------------------------------------
   საერთო დაფა მოსწავლის თამაშისთვის (games.js) და მასწავლებლის
   აქტივობისთვის (architect.js). მოვლენა = აგური; კედელი შენდება
   ქვემოდან ზემოთ: საძირკველში — ყველაზე ძველი მოვლენა.

   ორი გზა:
     • გადათრევა (თითი / მაუსი) — აგური ჩაჯდება იქ, სადაც გაუშვებ;
     • შეხება — შეეხე აგურს, მერე „＋ აქ“ ადგილს (კლავიატურითაც).

   გამოყენება:
     const board = IMS_TL_BOARD.create({ wall, pool, events, onChange });
     board.placed()          → მოვლენები კედელში (ძველიდან ახლისკენ)
     board.reveal(correct)   → შემოწმება: აგურებზე ✓/✗ და თარიღი
   ========================================================== */

(function () {
  "use strict";

  const { createEl } = window.IMS_UTILS;

  const DRAG_START = 8;     // px — ამდენი გადაადგილების შემდეგ იწყება გადათრევა
  const DROP_MARGIN = 48;   // px — კედლის გარშემო, სადაც გაშვება ჯერ კიდევ ითვლება
  const EDGE_SCROLL = 56;   // px — ეკრანის კიდესთან გვერდი თავისით სქროლავს
  const SCROLL_STEP = 14;

  function create(opts) {
    const wall = opts.wall;
    const pool = opts.pool;
    const events = opts.events.slice();
    const onChange = opts.onChange || function () {};

    let placed = [];
    let selected = null;   // შეხებით არჩეული აგური
    let checked = null;    // შემოწმების შემდეგ — სწორი თანმიმდევრობა
    let drag = null;       // { ev, x, y, active, target }
    let suppressClick = false;

    wall.classList.add("tl-wall");
    pool.classList.add("tl-yard");

    /* ---------- დახმარება ---------- */

    function place(ev, index) {
      const old = placed.indexOf(ev);
      if (old !== -1) {
        placed.splice(old, 1);
        if (old < index) index -= 1;
      }
      placed.splice(index, 0, ev);
    }

    function changed() {
      selected = null;
      render();
      onChange(placed.length, events.length);
    }

    /* ---------- აწყობა ---------- */

    function render() {
      renderWall();
      renderPool();
    }

    function renderWall() {
      wall.replaceChildren();
      wall.classList.toggle("is-picking", !!selected);

      if (checked) {
        placed.forEach((ev, i) => {
          const ok = ev === checked[i];
          const li = createEl("li", "tl-brick " + (ok ? "is-correct" : "is-wrong"));
          const body = createEl("span", "tl-brick__body");
          body.append(
            createEl("span", "tl-brick__text", ev.text),
            createEl("span", "tl-brick__date", (ok ? "✓ " : "✗ ") + ev.date)
          );
          li.append(body);
          wall.append(li);
        });
        return;
      }

      const own = selected ? placed.indexOf(selected) : -1;
      for (let i = 0; i <= placed.length; i++) {
        if (selected && !(own !== -1 && (i === own || i === own + 1))) wall.append(gapButton(i));
        if (i < placed.length) wall.append(wallBrick(placed[i]));
      }

      if (!placed.length && !selected) {
        wall.append(createEl("li", "tl-wall__empty", "საძირკველი ცარიელია — გადმოიტანე აქ პირველი აგური"));
      }
    }

    function wallBrick(ev) {
      const li = createEl("li", "tl-brick");
      if (ev === selected) li.classList.add("is-selected");

      const main = createEl("button", "tl-brick__main");
      main.type = "button";
      main.setAttribute("aria-pressed", String(ev === selected));
      main.setAttribute("aria-label", ev.text + " — " + (placed.indexOf(ev) + 1) + " ძველიდან. შეეხე, რომ გადაიტანო");
      main.append(createEl("span", "tl-brick__text", ev.text));
      main.addEventListener("click", () => {
        if (consumeClick()) return;
        selected = selected === ev ? null : ev;
        render();
      });
      bindDrag(main, ev);

      const remove = createEl("button", "tl-brick__remove", "✕");
      remove.type = "button";
      remove.setAttribute("aria-label", "ამოიღე კედლიდან: " + ev.text);
      remove.addEventListener("click", () => {
        placed.splice(placed.indexOf(ev), 1);
        changed();
      });

      li.append(main, remove);
      return li;
    }

    function ghostBrick(ev) {
      const li = createEl("li", "tl-brick tl-brick--ghost");
      li.setAttribute("aria-hidden", "true");
      li.append(createEl("span", "tl-brick__text", ev.text));
      return li;
    }

    function gapButton(index) {
      const li = createEl("li", "tl-gap");
      const btn = createEl("button", "tl-gap__btn", index === 0 ? "＋ აქ (ყველაზე ძველი)" : "＋ აქ");
      btn.type = "button";
      btn.setAttribute("aria-label", "ჩადე აქ: " + (index + 1) + " ძველიდან");
      btn.addEventListener("click", () => {
        place(selected, index);
        changed();
      });
      li.append(btn);
      return li;
    }

    function renderPool() {
      pool.replaceChildren();
      pool.hidden = !!checked;
      if (checked) return;

      events.filter((e) => !placed.includes(e)).forEach((ev) => {
        const btn = createEl("button", "tl-brick tl-brick--loose");
        btn.type = "button";
        if (ev === selected) btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed", String(ev === selected));
        btn.append(createEl("span", "tl-brick__text", ev.text));
        btn.addEventListener("click", () => {
          if (consumeClick()) return;
          if (!placed.length) {
            place(ev, 0);
            changed();
            return;
          }
          selected = selected === ev ? null : ev;
          render();
        });
        bindDrag(btn, ev);
        pool.append(btn);
      });
    }

    /* ---------- გადათრევა ---------- */

    function consumeClick() {
      if (!suppressClick) return false;
      suppressClick = false;
      return true;
    }

    function bindDrag(node, ev) {
      node.addEventListener("pointerdown", (e) => {
        if (checked || e.button > 0) return;
        drag = { ev: ev, node: node, x: e.clientX, y: e.clientY, active: false, target: null, ghost: null };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onCancel);
      });
    }

    function onMove(e) {
      if (!drag) return;
      if (!drag.active) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < DRAG_START) return;
        beginDrag();
      }
      e.preventDefault();

      if (e.clientY < EDGE_SCROLL) window.scrollBy(0, -SCROLL_STEP);
      else if (e.clientY > window.innerHeight - EDGE_SCROLL) window.scrollBy(0, SCROLL_STEP);

      const target = targetIndex(e.clientX, e.clientY);
      if (target !== drag.target) {
        drag.target = target;
        moveGhost();
      }
    }

    /* DOM-ს გადათრევისას თავიდან არ ვაწყობთ (თითის შეხება არ უნდა დაიკარგოს):
       მხოლოდ ვმალავთ გადასათრევ აგურს და ვამოძრავებთ „მოჩვენებას“. */
    function beginDrag() {
      drag.active = true;
      selected = null;
      document.body.classList.add("is-tl-dragging");
      wall.classList.remove("is-picking");
      wall.querySelectorAll(".tl-gap, .tl-wall__empty").forEach((n) => n.remove());
      document.querySelectorAll(".tl-brick.is-selected").forEach((n) => n.classList.remove("is-selected"));
      drag.node.closest(".tl-brick").classList.add("is-dragging");
      drag.ghost = ghostBrick(drag.ev);
    }

    function restingBricks() {
      return Array.from(wall.querySelectorAll(".tl-brick:not(.tl-brick--ghost):not(.is-dragging)"));
    }

    function moveGhost() {
      if (drag.target === null) {
        drag.ghost.remove();
        return;
      }
      const bricks = restingBricks();
      const before = bricks[drag.target];
      if (before) wall.insertBefore(drag.ghost, before);
      else wall.append(drag.ghost);
    }

    /** სად ჩაჯდება აგური: ქვემოთ მდებარე (უფრო ძველი) აგურების რაოდენობა. */
    function targetIndex(x, y) {
      const r = wall.getBoundingClientRect();
      const inside = x > r.left - DROP_MARGIN && x < r.right + DROP_MARGIN &&
        y > r.top - DROP_MARGIN && y < r.bottom + DROP_MARGIN;
      if (!inside) return null;
      let below = 0;
      restingBricks().forEach((b) => {
        const br = b.getBoundingClientRect();
        if (br.top + br.height / 2 > y) below += 1;
      });
      return below;
    }

    function onUp() {
      const d = drag;
      stopDrag();
      if (!d || !d.active) return;
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);

      // სამიზნე ინდექსი დათვლილია კედელზე ამ აგურის გარეშე
      if (placed.includes(d.ev)) placed.splice(placed.indexOf(d.ev), 1);
      if (d.target !== null) placed.splice(d.target, 0, d.ev);
      changed();
    }

    function onCancel() {
      const wasActive = drag && drag.active;
      stopDrag();
      if (wasActive) render();
    }

    function stopDrag() {
      drag = null;
      document.body.classList.remove("is-tl-dragging");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    }

    render();
    onChange(0, events.length);

    return {
      placed: () => placed.slice(),
      /** შემოწმება: correct — მოვლენები სწორი თანმიმდევრობით (ძველიდან ახლისკენ). */
      reveal: function (correct) {
        stopDrag();
        selected = null;
        checked = correct.slice();
        render();
        return placed.filter((ev, i) => ev === checked[i]).length;
      },
    };
  }

  window.IMS_TL_BOARD = Object.freeze({ create: create });
})();
