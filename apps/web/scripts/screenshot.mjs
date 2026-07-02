/**
 * Dev tool: screenshot a page at mobile width (390×844 — docs/07 §7).
 * Usage: node scripts/screenshot.mjs <url> <outfile> [waitMs] [full]
 */
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:3000/";
const out = process.argv[3] ?? "screenshot.png";
const wait = Number(process.argv[4] ?? 3000);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(wait);
await page.screenshot({ path: out, fullPage: process.argv[5] === "full" });
await browser.close();
console.log("saved", out);
