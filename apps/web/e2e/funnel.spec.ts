import { expect, test } from "@playwright/test";

/**
 * The money path (docs/09 Phase 5 checklist): quiz → email → report renders;
 * token revisit works; invalid token 404s. Requires local Directus (seeded).
 */

test.describe("quiz → report funnel", () => {
  test("full playthrough produces a personalized, revisitable report", async ({ page }) => {
    await page.goto("/quiz");

    // 1 dob — drive the wheels by keyboard to 6 November 1988 (Emma Stone
    // vector: Life Path 7, seeker group). Also exercises listbox a11y.
    async function stepWheel(name: string, key: "ArrowUp" | "ArrowDown", times: number) {
      const wheel = page.getByRole("listbox", { name });
      await wheel.focus();
      for (let i = 0; i < times; i++) {
        await wheel.press(key);
        await page.waitForTimeout(60);
      }
    }
    await stepWheel("Day", "ArrowUp", 9); // 15 → 6
    await stepWheel("Month", "ArrowDown", 5); // June → November
    await stepWheel("Year", "ArrowDown", 4); // 1992 → 1988 (descending list)
    await page.getByRole("button", { name: "Continue" }).click();

    // 2 name — Emma Stone: LP 7, Expression 33 (engine test vector)
    await page.getByRole("textbox").fill("Emma Stone");
    await page.getByRole("button", { name: "Continue" }).click();

    // 3–7 choices
    await page.getByRole("radio", { name: /female/i }).click();
    await page.getByRole("heading", { name: /Emma, what's calling/i }).waitFor();
    await page.getByRole("radio", { name: /love/i }).click();
    await page.getByRole("radio", { name: /edge of something big/i }).click();
    await page.getByRole("radio", { name: /single/i }).click();
    await page.getByRole("radio", { name: /curious but new/i }).click();

    // 8 interstitial auto-advances → 9 email
    await page
      .getByRole("heading", { name: /Emma, your reading is ready/i })
      .waitFor({ timeout: 8000 });

    const email = `e2e-${Date.now()}@example.com`;
    await page.getByRole("textbox").fill(email);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /reveal my reading/i }).click();

    // report
    await page.waitForURL(/\/report\//, { timeout: 15_000 });
    const reportUrl = page.url();
    await expect(page.getByText(/Life Path 7/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Emma, you are a", { exact: true })).toBeVisible();
    // focus bridge personalization (seeker × love variant seeded)
    await expect(page.getByText(/seeker's heart/i)).toBeVisible();
    // required compliance footer
    await expect(page.getByText(/entertainment and self-reflection/i)).toBeVisible();

    // token revisit (fresh context — the emailed link scenario)
    await page.context().clearCookies();
    await page.goto(reportUrl);
    await expect(page.getByText("Emma, you are a", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("invalid and tampered tokens 404", async ({ page }) => {
    const bogus = await page.goto("/report/not-a-real-token");
    expect(bogus?.status()).toBe(404);

    const tampered = await page.goto(
      "/report/eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdead",
    );
    expect(tampered?.status()).toBe(404);
  });

  test("honeypot and junk submissions are rejected", async ({ request }) => {
    const spam = await request.post("/api/lead", {
      data: {
        tenant: "astro-note",
        email: "bot@example.com",
        consent_marketing: true,
        website: "http://spam.example", // honeypot filled → reject
        answers: { dob: "1990-05-15", full_name: "Bot Bot" },
        utm: {},
      },
    });
    expect(spam.status()).toBe(400);

    const disposable = await request.post("/api/lead", {
      data: {
        tenant: "astro-note",
        email: "x@mailinator.com",
        consent_marketing: false,
        website: "",
        answers: { dob: "1990-05-15", full_name: "Real Person" },
        utm: {},
      },
    });
    expect(disposable.status()).toBe(400);
    const body = (await disposable.json()) as { error: string };
    expect(body.error).toMatch(/disposable/i);
  });
});
