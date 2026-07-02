/** Dev tool: verify consent banner lifecycle + console cleanliness. */
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3996";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().slice(0, 140));
});
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message.slice(0, 140)));

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
console.log(
  "consent banner visible:",
  await page.getByRole("button", { name: "Essential only" }).isVisible(),
);
await page.getByRole("button", { name: "Accept" }).click();
await page.waitForTimeout(400);
console.log(
  "banner dismissed after Accept:",
  !(await page.getByRole("button", { name: "Essential only" }).isVisible().catch(() => false)),
);
console.log("an_consent =", await page.evaluate(() => localStorage.getItem("an_consent")));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(800);
console.log(
  "banner stays hidden on reload:",
  !(await page.getByRole("button", { name: "Essential only" }).isVisible().catch(() => false)),
);
await page.goto(`${base}/quiz`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
console.log("console errors across landing+quiz:", errors.length ? errors : "NONE");
await browser.close();
