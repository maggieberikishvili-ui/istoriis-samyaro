// Playwright — ბრაუზერის ავტომატური ტესტები (ეშვება GitHub Actions-ში, იხ. .github/workflows/check.yml).
// საიტს ემსახურება python3-ის მარტივი სერვერი; localhost-ზე sw.js Network-First რეჟიმშია.
const { defineConfig, devices } = require("@playwright/test");

// GitHub-ზე — სერვერზე დაყენებული Chrome (tests/run.sh აყენებს PW_CHANNEL-ს)
const channel = process.env.PW_CHANNEL || undefined;

module.exports = defineConfig({
  testDir: ".",
  timeout: 60 * 1000,
  retries: 1,
  // "github" — ჩავარდნილი ტესტი GitHub-ის Annotations-ში ჩანს (შესვლის გარეშეც)
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  use: {
    baseURL: "http://localhost:8765/",
    locale: "ka-GE",
    serviceWorkers: "allow",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel }, grepInvert: /@phone/ },
    { name: "phone", use: { ...devices["Pixel 7"], channel }, grep: /@phone/ },
  ],
  webServer: {
    command: "python3 -m http.server 8765",
    cwd: "..",
    url: "http://localhost:8765/index.html",
    reuseExistingServer: true,
  },
});
