/* ==========================================================
   ისტორიის სამყარო — ავტორიზაციის ლოგიკა
   ----------------------------------------------------------
   საცავი, სესია და თემა — js/storage.js (window.IMS_STORE).
   უკვე შესული მომხმარებლის გადამისამართებას აკეთებს
   storage.js (data-auth="guest-only").

   შენიშვნა: ეს მხოლოდ ბრაუზერის (client-side) ავტორიზაციაა.
   პაროლი არ ინახება ღია სახით — ინახება SHA-256 ჰეში მარილით,
   მაგრამ რეალური დაცვისთვის საჭიროა სერვერი.
   ========================================================== */

(function () {
  "use strict";

  const store = window.IMS_STORE;
  if (store.isLoggedIn()) return; // გადამისამართება უკვე მიმდინარეობს

  const REDIRECT_DELAY_MS = 900;
  const NAME_MIN = 2;
  const NAME_MAX = 30;
  const PASSWORD_MIN = 6;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------- პაროლის ჰეშირება (Web Crypto) ---------- */

  function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function generateSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return bufferToHex(bytes.buffer);
  }

  async function hashPassword(password, salt) {
    if (!window.crypto || !crypto.subtle) {
      throw new Error("NO_CRYPTO");
    }
    const data = new TextEncoder().encode(salt + ":" + password);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return bufferToHex(digest);
  }

  /* ---------- DOM ---------- */

  const form = document.getElementById("authForm");
  const formTitle = document.getElementById("formTitle");
  const message = document.getElementById("formMessage");
  const nameField = document.getElementById("nameField");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const passwordHint = document.getElementById("passwordHint");
  const passwordToggle = document.getElementById("passwordToggle");
  const submitBtn = document.getElementById("submitBtn");
  const guestBtn = document.getElementById("guestBtn");
  const tabs = document.querySelectorAll(".tab");

  let mode = "login"; // "login" | "register"
  let busy = false;
  let sessionStarted = false;

  /* ---------- შეტყობინებები (მხოლოდ textContent — XSS დაცვა) ---------- */

  function showMessage(text, type) {
    message.textContent = text;
    message.className = "alert " + (type === "success" ? "alert--success" : "alert--error");
    message.setAttribute("role", type === "success" ? "status" : "alert");
    message.hidden = false;
  }

  function clearMessage() {
    message.textContent = "";
    message.hidden = true;
    [nameInput, emailInput, passwordInput].forEach((el) => el.removeAttribute("aria-invalid"));
  }

  function markInvalid(input, text) {
    input.setAttribute("aria-invalid", "true");
    input.focus();
    showMessage(text, "error");
  }

  /* ---------- რეჟიმის გადართვა ---------- */

  function setMode(newMode) {
    mode = newMode;
    const isRegister = mode === "register";

    tabs.forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) form.setAttribute("aria-labelledby", tab.id);
    });

    nameField.hidden = !isRegister;
    passwordHint.hidden = !isRegister;
    nameInput.required = isRegister;
    passwordInput.autocomplete = isRegister ? "new-password" : "current-password";

    formTitle.textContent = isRegister ? "შექმენი ანგარიში" : "კეთილი იყოს შენი დაბრუნება!";
    submitBtn.textContent = isRegister ? "რეგისტრაცია" : "შესვლა";

    clearMessage();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
    tab.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const next = mode === "login" ? "register" : "login";
        setMode(next);
        document.querySelector('.tab[data-mode="' + next + '"]').focus();
      }
    });
  });

  /* ---------- პაროლის ჩვენება / დამალვა ---------- */

  passwordToggle.addEventListener("click", () => {
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    passwordToggle.setAttribute("aria-pressed", String(show));
    passwordToggle.setAttribute("aria-label", show ? "პაროლის დამალვა" : "პაროლის ჩვენება");
    passwordToggle.textContent = show ? "🙈" : "👁️";
  });

  /* ---------- სესიის დაწყება და გადამისამართება ---------- */

  function setBusy(state) {
    busy = state;
    submitBtn.disabled = state;
    guestBtn.disabled = state;
  }

  function beginSession(profile) {
    if (!store.startSession(profile)) {
      showMessage("მონაცემების შენახვა ვერ მოხერხდა. შეამოწმე ბრაუზერის პარამეტრები.", "error");
      return;
    }
    sessionStarted = true;
    // სახელი გამოდის მხოლოდ textContent-ით
    showMessage("მოგესალმებით, " + profile.name + "!", "success");
    setTimeout(() => store.redirect(store.URLS.dashboard), REDIRECT_DELAY_MS);
  }

  /* ---------- ვალიდაცია ---------- */

  function validate() {
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (mode === "register" && (name.length < NAME_MIN || name.length > NAME_MAX)) {
      markInvalid(nameInput, "სახელი უნდა შეიცავდეს " + NAME_MIN + "–" + NAME_MAX + " სიმბოლოს.");
      return null;
    }
    if (!EMAIL_PATTERN.test(email)) {
      markInvalid(emailInput, "შეიყვანე სწორი ელ-ფოსტა.");
      return null;
    }
    if (password.length < PASSWORD_MIN) {
      markInvalid(passwordInput, "პაროლი უნდა იყოს მინიმუმ " + PASSWORD_MIN + " სიმბოლო.");
      return null;
    }
    return { name, email, password };
  }

  /* ---------- რეგისტრაცია / შესვლა ---------- */

  async function register({ name, email, password }) {
    if (store.findAccount(email)) {
      markInvalid(emailInput, "ეს ელ-ფოსტა უკვე დარეგისტრირებულია. სცადე შესვლა.");
      return;
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const profile = store.createProfile(name, email, false);

    const users = store.getUsers();
    users[email] = {
      salt: salt,
      passwordHash: passwordHash,
      createdAt: new Date().toISOString(),
      profile: profile,
    };

    if (!store.saveUsers(users)) {
      showMessage("ანგარიშის შენახვა ვერ მოხერხდა.", "error");
      return;
    }
    beginSession(profile);
  }

  async function login({ email, password }) {
    const account = store.findAccount(email);
    // ერთნაირი შეტყობინება — არ ვამჟღავნებთ, არსებობს თუ არა ელ-ფოსტა
    const failText = "ელ-ფოსტა ან პაროლი არასწორია.";

    if (!account) {
      showMessage(failText, "error");
      return;
    }

    const hash = await hashPassword(password, account.salt);
    if (hash !== account.passwordHash) {
      passwordInput.setAttribute("aria-invalid", "true");
      showMessage(failText, "error");
      return;
    }

    const profile = Object.assign(store.createProfile("", email, false), account.profile);
    beginSession(profile);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    clearMessage();

    const data = validate();
    if (!data) return;

    setBusy(true);
    try {
      if (mode === "register") {
        await register(data);
      } else {
        await login(data);
      }
    } catch (err) {
      showMessage(
        err && err.message === "NO_CRYPTO"
          ? "ბრაუზერი არ უჭერს მხარს დაშიფვრას. გახსენი გვერდი localhost-ით ან HTTPS-ით."
          : "დაფიქსირდა შეცდომა. სცადე თავიდან.",
        "error"
      );
    } finally {
      // წარმატების შემთხვევაში ღილაკები გათიშული რჩება გადამისამართებამდე
      if (!sessionStarted) setBusy(false);
    }
  });

  /* ---------- სტუმარი ---------- */

  guestBtn.addEventListener("click", () => {
    if (busy) return;
    clearMessage();
    setBusy(true);
    // ადრინდელი სტუმრის პროფილი აღდგება (პროგრესი და სიცოცხლეები არ ნულდება)
    beginSession(store.loadGuestProfile() || store.createProfile("სტუმარი", null, true));
    if (!sessionStarted) setBusy(false);
  });

  /* ---------- ვინ ხარ? (მოსწავლე → ავტორიზაცია; მასწავლებელი → teacher.html ბმულით) ---------- */

  const roleCard = document.getElementById("roleCard");
  const authCard = document.getElementById("authCard");

  function showAuth(visible) {
    roleCard.hidden = visible;
    authCard.hidden = !visible;
    if (visible) emailInput.focus();
  }

  document.getElementById("roleStudent").addEventListener("click", () => showAuth(true));
  document.getElementById("roleBack").addEventListener("click", () => showAuth(false));

  /* ---------- ინიციალიზაცია ---------- */

  store.bindThemeToggle(
    document.getElementById("themeToggle"),
    document.getElementById("themeIcon")
  );

  // „📲 დაყენება“ — ჩანს მხოლოდ მაშინ, როცა ბრაუზერი დაყენებას გვთავაზობს
  const installBtn = document.getElementById("installBtn");
  store.onInstallStateChange((state) => {
    installBtn.hidden = state !== "available";
  });
  installBtn.addEventListener("click", () => store.promptInstall());

  setMode("login");
})();
