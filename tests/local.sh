#!/usr/bin/env bash
# ბრაუზერის ტესტები შენს კომპიუტერზე (push-მდე): bash tests/local.sh
# იყენებს უკვე დაყენებულ Google Chrome-ს (ცალკე, დროებითი პროფილით — შენს ბრაუზერს არ ეხება).
# Playwright-ს პირველად თვითონ დააყენებს tests/node_modules-ში (git-ში არ მიდის).
# GitHub-ის ვერსია — tests/run.sh.
set -eu
cd "$(dirname "$0")"
export PATH="/usr/local/bin:$PATH"

if [ ! -d node_modules/@playwright/test ]; then
  echo "Playwright-ის დაყენება (ერთხელ)…"
  npm install --no-save --no-package-lock --no-audit --no-fund @playwright/test@1.55.0
fi

# Node 26 + Playwright 1.55 — უვნებელი DeprecationWarning-ის დამალვა
export NODE_NO_WARNINGS=1
PW_CHANNEL=chrome npx playwright test "$@"
