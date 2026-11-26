#!/usr/bin/env bash
# ბრაუზერის ტესტების გაშვება GitHub Actions-ში (.github/workflows/check.yml → bash tests/run.sh).
# ყველა დეტალი აქ არის, რომ workflow ფაილის შეცვლა აღარ დაგვჭირდეს.
# შეცდომისას ტექსტი GitHub-ის „Annotations“-ში ჩნდება (::error::) — ის შესვლის გარეშეც ჩანს.
set -u
cd "$(dirname "$0")"

LOG="$(mktemp)"

# ბრძანების გაშვება; ჩავარდნისას — ბოლო ხაზები ანოტაციად
step() {
  local title="$1"; shift
  echo "::group::$title"
  "$@" >"$LOG" 2>&1
  local status=$?
  cat "$LOG"
  echo "::endgroup::"
  if [ $status -ne 0 ]; then
    local tail_text
    tail_text="$(tail -n 40 "$LOG" | sed 's/%/%25/g' | awk '{printf "%s%%0A", $0}')"
    echo "::error title=$title ჩავარდა::$tail_text"
    exit $status
  fi
}

step "Playwright-ის დაყენება" npm install --no-save --no-package-lock --no-audit --no-fund @playwright/test@1.55.0
# ბრაუზერი: GitHub-ის სერვერზე უკვე დაყენებული Google Chrome (channel: "chrome");
# თუ არ არის — Playwright-ის Chromium.
if ! command -v google-chrome >/dev/null 2>&1; then
  step "Chromium-ის დაყენება" npx playwright install --with-deps chromium
  export PW_CHANNEL=""
else
  export PW_CHANNEL="chrome"
fi
step "ტესტები" npx playwright test
