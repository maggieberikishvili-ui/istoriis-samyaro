/* ==========================================================
   ისტორიის სამყარო — მასწავლებლის აქტივობების სია
   ----------------------------------------------------------
   ერთი ადგილი ყველა საკლასო აქტივობისთვის. ჩანართები ყველა
   მასწავლებლის გვერდზე აქედან იწყობა:
     <nav class="t-activities" data-activities="<მიმდინარე id>"></nav>
   ახალი აქტივობა = ერთი ჩანაწერი ACTIVITIES-ში (+ მისი გვერდი).
   ჩატვირთვა: <script src="js/activities.js" defer></script>
   ========================================================== */

(function () {
  "use strict";

  const ACTIVITIES = [
    { id: "quiz", icon: "❓", title: "გუნდური ვიქტორინა", href: "teacher.html" },
    { id: "decide", icon: "⚖️", title: "ისტორიული არჩევანი", href: "decide.html" },
  ];

  /** ჩანართების აწყობა ყველა <nav data-activities>-ში. */
  function renderTabs() {
    document.querySelectorAll("nav[data-activities]").forEach((nav) => {
      const current = nav.dataset.activities;
      nav.replaceChildren();
      ACTIVITIES.forEach((a) => {
        const link = document.createElement("a");
        link.className = "t-activity";
        link.href = a.href;
        link.textContent = a.icon + " " + a.title;
        if (a.id === current) link.setAttribute("aria-current", "page");
        nav.append(link);
      });
    });
  }

  renderTabs();

  window.IMS_ACTIVITIES = Object.freeze({ list: ACTIVITIES });
})();
