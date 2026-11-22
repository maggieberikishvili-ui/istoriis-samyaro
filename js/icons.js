/* ==========================================================
   Edubba — საკუთარი ხატულები: სიცოცხლე, XP, სერია
   ----------------------------------------------------------
   ემოჯის (❤️ ⚡ 🔥) ნაცვლად — ერთი SVG „სპრაიტი“, რომელიც გვერდზე ერთხელ ჩაიწერება:
     ic-heart  — ლაჟვარდის გული (ოქროსფერი ნაპერწკლები, ღია ძარღვი)
     ic-xp     — ქერის თავთავი: ნისაბას, წერისა და მარცვლეულის ქალღმერთის უძველესი ნიშანი
     ic-streak — ჩირაღდანი წითელი ცეცხლით
     ic-day    — დღე: მზე ორ მთას შორის (ლურსმნული ნიშნის UD-ს — „მზე, დღე, სინათლე“ — მსგავსად)
     ic-night  — ღამე: მთა და ინანას რვაქიმიანი ვარსკვლავი (თქმულება „ინანა და ებიხი“)
     ic-broken — გატეხილი ლაჟვარდის გული (სიცოცხლეები ამოიწურა)
     ic-user, ic-chart, ic-logout — მენიუს ხაზოვანი ნიშნები (ტექსტის ფერით)
   HTML-ში:  <svg class="ims-icon" aria-hidden="true" focusable="false"><use href="#ic-heart"></use></svg>
   JS-ში:    IMS_ICONS.el("heart")  — იგივე <svg> ელემენტი
   ფერები — css/icons.css (--gem-lapis-*, --gem-gold-*, --ic-*), ორივე რეჟიმში ერთი (ფიზიკური ნივთებია).
   ========================================================== */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const HEART = "M16 28C7 21.5 3 16 3 11a6.5 6.5 0 0 1 13-1.5A6.5 6.5 0 0 1 29 11c0 5-4 10.5-13 17Z";

  const CRACK = "M16 9.5 13.4 14 17.6 18 14.4 22.2 16 28";
  const CRACK_LEFT = "M0 0H16V9.5L13.4 14 17.6 18 14.4 22.2 16 28V32H0Z";
  const CRACK_RIGHT = "M32 0H16V9.5L13.4 14 17.6 18 14.4 22.2 16 28V32H32Z";
  const STAR8 = "M16 .8 17.03 4.31 20.24 2.56 18.49 5.77 22 6.8 18.49 7.83 20.24 11.04 17.03 9.29 16 12.8 14.97 9.29 11.76 11.04 13.51 7.83 10 6.8 13.51 5.77 11.76 2.56 14.97 4.31Z";

  const SPRITE =
    "<defs>" +
    '<radialGradient id="icG-lapis" class="ic-k--lapis" cx=".35" cy=".3" r=".85"><stop offset="0" class="ic-s-hi"/><stop offset=".5" class="ic-s-mid"/><stop offset="1" class="ic-s-lo"/></radialGradient>' +
    '<linearGradient id="icG-gold" class="ic-k--gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="ic-s-hi"/><stop offset=".5" class="ic-s-mid"/><stop offset="1" class="ic-s-lo"/></linearGradient>' +
    '<radialGradient id="icG-fire" class="ic-k--fire" cx=".5" cy=".8" r=".8"><stop offset="0" class="ic-s-hi"/><stop offset=".45" class="ic-s-mid"/><stop offset="1" class="ic-s-lo"/></radialGradient>' +
    '<radialGradient id="icG-sun" class="ic-k--gold" cx=".38" cy=".35" r=".75"><stop offset="0" class="ic-s-hi"/><stop offset=".55" class="ic-s-mid"/><stop offset="1" class="ic-s-lo"/></radialGradient>' +
    '<linearGradient id="icG-clay" class="ic-k--clay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ic-s-hi"/><stop offset=".55" class="ic-s-mid"/><stop offset="1" class="ic-s-lo"/></linearGradient>' +
    '<linearGradient id="icG-dusk" class="ic-k--dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ic-s-hi"/><stop offset=".55" class="ic-s-mid"/><stop offset="1" class="ic-s-lo"/></linearGradient>' +
    '<clipPath id="icC-left"><path d="' + CRACK_LEFT + '"/></clipPath>' +
    '<clipPath id="icC-right"><path d="' + CRACK_RIGHT + '"/></clipPath>' +
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
    "</g></symbol>" +
    // დღე — მზე ორ მთას შორის
    '<symbol id="ic-day" viewBox="0 0 32 32">' +
    '<path class="ic-ray" d="M16 6.5v3M9.8 9l1.8 2M22.2 9l-1.8 2"/>' +
    '<circle cx="16" cy="20" r="7.5" fill="url(#icG-sun)" class="ic-edge ic-edge--gold"/>' +
    '<path fill="url(#icG-clay)" class="ic-edge ic-edge--clay" d="M1 28.5C3.5 22 5.5 15 7.5 15S11.5 21.5 16 24.5C20.5 21.5 22.5 15 24.5 15S28.5 22 31 28.5Z"/>' +
    "</symbol>" +
    // ღამე — მთა (ებიხი) და ინანას ვარსკვლავი
    '<symbol id="ic-night" viewBox="0 0 32 32">' +
    '<path fill="url(#icG-sun)" class="ic-star" d="' + STAR8 + '"/>' +
    '<path fill="url(#icG-dusk)" class="ic-edge ic-edge--dusk" d="M1 28.5C6.5 22.5 10.5 15 16 15S25.5 22.5 31 28.5Z"/>' +
    "</symbol>" +
    // გატეხილი გული — ორი ნახევარი ბზარის ხაზით
    '<symbol id="ic-broken" viewBox="0 0 32 32">' +
    '<g class="ic-half ic-half--l" clip-path="url(#icC-left)">' +
    '<path fill="url(#icG-lapis)" class="ic-edge ic-edge--lapis" d="' + HEART + '"/>' +
    '<path class="ic-crack" d="' + CRACK + '"/>' +
    '<circle class="ic-fleck" cx="9" cy="15" r=".8"/><circle class="ic-fleck" cx="12" cy="20" r=".6"/>' +
    '<ellipse class="ic-shine" cx="9.5" cy="9.5" rx="3" ry="1.8" transform="rotate(-25 9.5 9.5)"/>' +
    "</g>" +
    '<g class="ic-half ic-half--r" clip-path="url(#icC-right)">' +
    '<path fill="url(#icG-lapis)" class="ic-edge ic-edge--lapis" d="' + HEART + '"/>' +
    '<path class="ic-crack" d="' + CRACK + '"/>' +
    '<circle class="ic-fleck" cx="21" cy="13" r=".8"/><circle class="ic-fleck" cx="22.5" cy="17.5" r=".6"/>' +
    "</g></symbol>" +
    // მენიუს ხაზოვანი ნიშნები
    '<symbol id="ic-user" viewBox="0 0 32 32"><circle class="ic-line" cx="16" cy="11" r="5.5"/><path class="ic-line" d="M5.5 28c1.5-6 5.5-9 10.5-9s9 3 10.5 9"/></symbol>' +
    '<symbol id="ic-chart" viewBox="0 0 32 32"><path class="ic-line" d="M5 27h22M9 27V17M16 27V8M23 27V13"/></symbol>' +
    '<symbol id="ic-logout" viewBox="0 0 32 32"><path class="ic-line" d="M18 27H8V9a5 5 0 0 1 10 0v4M5 27h15M14 19h14M24 15l4 4-4 4"/></symbol>';

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

  /** ხატულის <svg> ელემენტი JS-ისთვის. name: "heart" | "xp" | "streak" | "day" | "night" | "broken" | … */
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
