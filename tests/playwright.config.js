// Playwright — ბრაუზერის ავტომატური ტესტები (ეშვება GitHub Actions-ში, იხ. .github/workflows/check.yml).
// საიტს ემსახურება python3-ის მარტივი სერვერი; localhost-ზე sw.js Network-First რეჟიმშია.
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: ".",
  timeout: 60 * 1000,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8765/",
    locale: "ka-GE",
    serviceWorkers: "allow",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@phone/ },
    { name: "phone", use: { ...devices["Pixel 7"] }, grep: /@phone/ },
  ],
  webServer: {
    command: "python3 -m http.server 8765",
    cwd: "..",
    url: "http://localhost:8765/index.html",
    reuseExistingServer: true,
  },
});
