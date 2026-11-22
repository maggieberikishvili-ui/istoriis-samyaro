/* ==========================================================
   Edubba — საკუთარი ხატულები: სიცოცხლე, XP, სერია
   ----------------------------------------------------------
   ემოჯის (❤️ ⚡ 🔥) ნაცვლად — ერთი SVG „სპრაიტი“, რომელიც გვერდზე ერთხელ ჩაიწერება:
     ic-heart  — ლაჟვარდის გული (ოქროსფერი ნაპერწკლები, ღია ძარღვი)
     ic-xp     — ქერის თავთავი: ნისაბას, წერისა და მარცვლეულის ქალღმერთის უძველესი ნიშანი
     ic-streak — ჩირაღდანი წითელი ცეცხლით
   HTML-ში:  <svg class="ims-icon" aria-hidden="true" focusable="false"><use href="#ic-heart"></use></svg>
   JS-ში:    IMS_ICONS.el("heart")  — იგივე <svg> ელემენტი
   ფერები — css/icons.css (--gem-lapis-*, --gem-gold-*, --ic-*), ორივე რეჟიმში ერთი (ფიზიკური ნივთებია).
   ========================================================== */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const HEART = "M16 28C7 21.5 3 16 3 11a6.5 6.5 0 0 1 13-1.5A6.5 6.5 0 0 1 29 11c0 5-4 10.5-13 17Z";

  const SPRITE =
    "<defs>" +
    '<radialGradient id="icG-lapis" class="ic-k--lapis" cx=".35" cy=".3" r=".85"><stop offset="0" class="ic-s-hi"/><stop offset=".5" class="ic-s-mid"/><stop offset="1" class="ic-s-lo"/></radialGradient>' +
    '<linearGradient id="icG-gold" class="ic-k--gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="ic-s-hi"/><stop offset=".5" class="ic-s-mid"/><stop offset="1" class="ic-s-lo"/></linearGradient>' +
    '<radialGradient id="icG-fire" class="ic-k--fire" cx=".5" cy=".8" r=".8"><stop offset="0" class="ic-s-hi"/><stop offset=".45" class="ic-s-mid"/><stop offset="1" class="ic-s-lo"/></radialGradient>' +
    "</defs>" +
    // სიცოცხლე — ლაჟვარდის გული
    '<symbol id="ic-heart" viewBox="0 0 32 32">' +
    '<path fill="url(#icG-lapis)" class="ic-edge ic-edge--lapis" d="' + HEART + '"/>' +
    '<path class="ic-vein" d="M7 14c3 .5 5 2.5 7 2.2s3.5-2 6-1.6M12 21c2-1 4-.6 6-1.4"/>' +
    '<circle class="ic-fleck" cx="11" cy="16.5" r=".9"/><circle class="ic-fleck" cx="19.5" cy="12.5" r=".8"/>' +
    '<circle class="ic-fleck" cx="17" cy="20.5" r=".7"/><circle class="ic-fleck" cx="23" cy="15" r=".6"/>' +
    '<ellipse class="ic-shine" cx="10" cy="9.5" rx="3.2" ry="2" transform="rotate(-25 10 9.5)"/>' +
    '<circle class="ic-shine" cx="22.5" cy="9" r="1"/>' +
    "</symbol>" +
    // XP — ქერის თავთავი
    '<symbol id="ic-xp" viewBox="0 0 32 32">' +
    '<path class="ic-stem" d="M16 30V7"/>' +
    '<g fill="url(#icG-gold)" class="ic-edge ic-edge--gold">' +
    '<ellipse cx="13.4" cy="23" rx="2.1" ry="3.4" transform="rotate(-28 13.4 23)"/><ellipse cx="18.6" cy="23" rx="2.1" ry="3.4" transform="rotate(28 18.6 23)"/>' +
    '<ellipse cx="13.4" cy="17.6" rx="2.1" ry="3.4" transform="rotate(-28 13.4 17.6)"/><ellipse cx="18.6" cy="17.6" rx="2.1" ry="3.4" transform="rotate(28 18.6 17.6)"/>' +
    '<ellipse cx="13.6" cy="12.3" rx="2" ry="3.2" transform="rotate(-26 13.6 12.3)"/><ellipse cx="18.4" cy="12.3" rx="2" ry="3.2" transform="rotate(26 18.4 12.3)"/>' +
    '<ellipse cx="16" cy="7.4" rx="1.9" ry="3.2"/>' +
    "</g>" +
    '<path class="ic-awn" d="M12 9.5 8.5 3M20 9.5 23.5 3M11.6 14.8 7 9M20.4 14.8 25 9M16 4.4V1"/>' +
    "</symbol>" +
    // სერია — ჩირაღდანი (ჰორიზონტალურად გაფართოებული, რომ პატარა ზომაზეც იკითხებოდეს)
    '<symbol id="ic-streak" viewBox="0 0 32 32"><g transform="matrix(1.45 0 0 1 -7.2 0)">' +
    '<path class="ic-wood" d="M13.6 17h4.8l-1.3 13h-2.2Z"/>' +
    '<rect x="12.5" y="15.5" width="7" height="3" rx="1.2" fill="url(#icG-gold)" class="ic-edge ic-edge--gold"/>' +
    '<path fill="url(#icG-fire)" d="M16 2c1 3.5 5.5 5.5 5.5 9.5A5.5 5.5 0 0 1 10.5 11.5c0-2 1-3.2 2.2-4.3.1 1.6.8 2.6 1.8 3C14 7.3 14.6 4.6 16 2Z"/>' +
    '<path class="ic-shine" d="M16 9.5c.8 1.5 2.3 2.4 2.3 4a2.3 2.3 0 0 1-4.6 0c0-1.4 1.4-2.4 2.3-4Z"/>' +
    "</g></symbol>";

  function inject() {
    if (document.getElementById("imsIcons")) return;
    const svg = document.createElementNS(NS, "svg");
    svg.id = "imsIcons";
    svg.setAttribute("class", "ims-icons-sprite");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.innerHTML = SPRITE;
    document.body.prepend(svg);
  }

  /** ხატულის <svg> ელემენტი JS-ისთვის. name: "heart" | "xp" | "streak". */
  function el(name, extraClass) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "ims-icon" + (extraClass ? " " + extraClass : ""));
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#ic-" + name);
    svg.append(use);
    return svg;
  }

  if (document.body) inject();
  else document.addEventListener("DOMContentLoaded", inject);

  window.IMS_ICONS = Object.freeze({ el: el });
})();
