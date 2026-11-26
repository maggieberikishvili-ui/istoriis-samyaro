// საიტის „კვამლის ტესტები“ — ნამდვილ ბრაუზერში ამოწმებს, რომ მთავარი გზები მუშაობს:
// რეგისტრაცია, ყველა გვერდი შეცდომების გარეშე, ყოველი გაკვეთილი ბოლომდე, XP-ის შენახვა,
// ტელეფონის სიგანე. ეშვება GitHub Actions-ში ყოველ push-ზე (npx playwright test).
const { test, expect } = require("@playwright/test");
const { solveLesson } = require("./lesson-solver");

const PAGES = ["dashboard", "lesson", "games", "teacher", "decide", "whoami", "architect",
  "detective", "treasury", "progress"];

/** აგროვებს JS შეცდომებს, console.error-ს და CSP-ის დარღვევებს. */
function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console: " + m.text());
  });
  page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      console.error("CSP: " + e.violatedDirective + " " + e.blockedURI);
    });
  });
  return errors;
}

let userCount = 0;
/** ახალი მოსწავლის რეგისტრაცია ფორმით → დაფა. */
async function register(page) {
  userCount += 1;
  await page.goto("index.html");
  await page.click("#roleStudent");
  await page.click("#tabRegister");
  await page.fill("#name", "ტესტი");
  await page.fill("#email", "test" + Date.now() + "-" + userCount + "@example.com");
  await page.fill("#password", "test-password-123");
  await page.click("#submitBtn");
  await page.waitForURL(/dashboard\.html/);
}

test("რეგისტრაცია → დაფა, გასვლა და ხელახლა შესვლა", async ({ page }) => {
  const errors = watchErrors(page);
  await register(page);
  const profile = await page.evaluate(() => window.IMS_STORE.loadProfile());
  expect(profile.name).toBe("ტესტი");
  // სესიის დასრულება → შესვლის გვერდზე უნდა დაგვაბრუნოს
  await Promise.all([page.waitForURL(/index\.html/), page.evaluate(() => window.IMS_STORE.logout())]);
  await page.goto("dashboard.html");
  await page.waitForURL(/index\.html/);
  expect(errors).toEqual([]);
});

test("ყველა გვერდი იხსნება შეცდომების გარეშე", async ({ page }) => {
  const errors = watchErrors(page);
  await register(page);
  for (const name of PAGES) {
    await page.goto(name + ".html");
    await page.waitForLoadState("networkidle");
    expect(errors, name + ".html").toEqual([]);
  }
});

test("ჩვეულებრივი გაკვეთილი: ბოლომდე გავლა, XP და პროგრესი ინახება", async ({ page }) => {
  const errors = watchErrors(page);
  await register(page);
  const first = await page.evaluate(async () => {
    const data = window.IMS_DATA;
    const course = data.courses.find((c) => c.id === data.currentCourseId());
    await data.load([course.id]);
    return { course: course.id, lesson: course.lessons[0].id };
  });
  await page.goto("lesson.html?course=" + first.course + "&lesson=" + first.lesson);
  await page.waitForSelector("#primaryBtn");
  const result = await page.evaluate(solveLesson, first);
  expect(result.error, JSON.stringify(result)).toBeUndefined();
  await expect(page.locator("#victoryScreen")).toBeVisible();
  const profile = await page.evaluate(() => window.IMS_STORE.loadProfile());
  expect(profile.xp).toBeGreaterThan(0);
  expect(profile.completedLessons).toContain(first.lesson);
  expect(errors).toEqual([]);
});

test("ყველა გაკვეთილი ბოლომდე გადის (ავტორის რეჟიმი, სწორი პასუხებით)", async ({ page }) => {
  test.setTimeout(15 * 60 * 1000);
  const errors = watchErrors(page);
  await register(page);
  await page.goto("dashboard.html?author=1");
  const lessons = await page.evaluate(async () => {
    const data = window.IMS_DATA;
    await data.loadAll();
    return data.courses.flatMap((c) => c.lessons.map((l) => ({ course: c.id, lesson: l.id })));
  });
  expect(lessons.length).toBeGreaterThan(0);
  const failed = [];
  for (const item of lessons) {
    await page.goto("lesson.html?course=" + item.course + "&lesson=" + item.lesson);
    await page.waitForSelector("#primaryBtn");
    const result = await page.evaluate(solveLesson, item);
    const done = await page.locator("#victoryScreen").isVisible();
    if (result.error || !done) failed.push(item.lesson + ": " + (result.error || "დასრულების ეკრანი არ გამოჩნდა"));
    if (errors.length) failed.push(item.lesson + ": " + errors.splice(0).join(" | "));
  }
  expect(failed, "გაკვეთილები შეცდომით").toEqual([]);
});

test("ტელეფონი: გვერდები ეკრანზე ეტევა (გვერდითი სქროლის გარეშე) @phone", async ({ page }) => {
  const errors = watchErrors(page);
  await register(page);
  for (const name of ["dashboard", "games", "treasury", "progress", "lesson"]) {
    await page.goto(name + ".html");
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, name + ".html — გვერდითი სქროლი (px)").toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});
