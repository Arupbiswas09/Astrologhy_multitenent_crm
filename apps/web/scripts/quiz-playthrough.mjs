/**
 * Dev tool: drive the full quiz at 390px and screenshot each step.
 * Usage: node scripts/quiz-playthrough.mjs [baseUrl] [outDir]
 * Exits non-zero if any step fails to appear.
 */
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3998";
const outDir = process.argv[3] ?? "/tmp";
const shot = (page, name) => page.screenshot({ path: `${outDir}/quiz-${name}.png` });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto(`${base}/quiz`, { waitUntil: "networkidle" });

  // Step 1 — DOB wheel
  await page.getByRole("heading", { name: /when were you born/i }).waitFor();
  await shot(page, "1-dob");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2 — full name with letters-to-numbers preview
  await page.getByRole("heading", { name: /full birth name/i }).waitFor();
  await page.getByRole("textbox").pressSequentially("Emma Stone", { delay: 55 });
  await shot(page, "2-name");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3 — gender (optional, has skip)
  await page.getByRole("heading", { name: /how do you identify/i }).waitFor();
  await shot(page, "3-gender");
  await page.getByRole("radio", { name: /female/i }).click();

  // Step 4 — focus area (first_name interpolation!)
  await page.getByRole("heading", { name: /Emma, what's calling/i }).waitFor();
  await shot(page, "4-focus");
  await page.getByRole("radio", { name: /love/i }).click();

  // Step 5 — feeling
  await page.getByRole("heading", { name: /feels most like you/i }).waitFor();
  await page.getByRole("radio", { name: /edge of something big/i }).click();

  // Step 6 — relationship
  await page.getByRole("heading", { name: /your heart/i }).waitFor();
  await shot(page, "6-heart");
  await page.getByRole("radio", { name: /single/i }).click();

  // Step 7 — belief
  await page.getByRole("heading", { name: /connection to numerology/i }).waitFor();
  await page.getByRole("radio", { name: /curious but new/i }).click();

  // Step 8 — interstitial (orbit-collapse, ~3.5s)
  await page.getByRole("heading", { name: /reading your numbers/i }).waitFor();
  await page.waitForTimeout(1200);
  await shot(page, "8-interstitial");

  // Step 9 — email capture (auto-advanced from interstitial)
  await page.getByRole("heading", { name: /Emma, your reading is ready/i }).waitFor({
    timeout: 6000,
  });
  await shot(page, "9-email");

  // Refresh resume check (docs/09 Phase 4: refresh mid-quiz resumes)
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Emma, your reading is ready/i }).waitFor({
    timeout: 6000,
  });
  console.log("resume-after-refresh: OK");

  // Submit (Phase 5 endpoint may not exist yet — error state is acceptable)
  await page.getByRole("textbox").fill("emma@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /reveal my reading/i }).click();
  await page.waitForTimeout(2500);
  await shot(page, "10-submit");
  console.log("final url:", page.url());
  console.log("PLAYTHROUGH OK");
} catch (err) {
  await shot(page, "FAILED");
  console.error("PLAYTHROUGH FAILED:", err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
