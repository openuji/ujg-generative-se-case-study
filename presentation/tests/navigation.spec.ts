import { expect, test } from "@playwright/test";

test("keyboard navigation updates the slide hash", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".slide")).toContainText("UJG started from frustration.");
  await expect(page).toHaveURL(/#slide-1-step-1$/);

  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".slide")).toContainText(
    "We usually start with the domain."
  );
  await expect(page).toHaveURL(/#slide-2-step-1$/);

  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".slide")).toContainText("UJG started from frustration.");
  await expect(page).toHaveURL(/#slide-1-step-1$/);

  await page.keyboard.press("End");
  await expect(page.locator(".slide")).toContainText("Open questions");
  await expect(page).toHaveURL(/#slide-8-step-1$/);

  await page.keyboard.press("Home");
  await expect(page.locator(".slide")).toContainText("UJG started from frustration.");
  await expect(page).toHaveURL(/#slide-1-step-1$/);
});

test("hash restores the requested page", async ({ page }) => {
  await page.goto("/#slide-7-step-3");
  await expect(page.locator(".slide")).toContainText(
    "Journey-aware data fetching with UJG + GraphQL"
  );
  await expect(page.locator(".slide-indicator")).toHaveText("7 / 8 - 3 / 3");
});

test("edge controls navigate by click", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Next slide" }).click();
  await expect(page.locator(".slide")).toContainText(
    "We usually start with the domain."
  );
  await page.getByRole("button", { name: "Previous slide" }).click();
  await expect(page.locator(".slide")).toContainText("UJG started from frustration.");
});

test("question slide reveals and hides sentences without changing slides", async ({
  page
}) => {
  await page.goto("/#slide-8-step-1");

  const nextButton = page.getByRole("button", { name: "Next slide" });
  const questions = page.locator(".questions-list li");
  await expect(questions).toHaveCount(3);
  await expect(questions.nth(0)).toHaveCSS("opacity", "0");
  await expect(questions.nth(1)).toHaveCSS("opacity", "0");
  await expect(questions.nth(2)).toHaveCSS("opacity", "0");

  await nextButton.click();
  await expect(page).toHaveURL(/#slide-8-step-1$/);
  await expect(page.locator(".slide")).toHaveAttribute(
    "aria-label",
    "Slide 8, step 1, reveal 1 of 3"
  );
  await expect(questions.nth(0)).toHaveCSS("opacity", "1");
  await expect(questions.nth(1)).toHaveCSS("opacity", "0");

  await nextButton.click();
  await expect(questions.nth(1)).toHaveCSS("opacity", "1");

  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/#slide-8-step-1$/);
  await expect(questions.nth(1)).toHaveCSS("opacity", "0");
  await expect(questions.nth(0)).toHaveCSS("opacity", "1");
});

test("every page renders without internal scrollbars or diagram errors", async ({
  page
}) => {
  const slideIds = [
    "slide-1-step-1",
    "slide-2-step-1",
    "slide-2-step-2",
    "slide-3-step-1",
    "slide-4-step-1",
    "slide-4-step-2",
    "slide-5-step-1",
    "slide-5-step-2",
    "slide-6-step-1",
    "slide-7-step-1",
    "slide-7-step-2",
    "slide-7-step-3",
    "slide-8-step-1"
  ];

  for (const slideId of slideIds) {
    await page.goto(`/#${slideId}`);
    await expect(page.locator(".slide")).toBeVisible();
    await expect(page.locator(".diagram-error")).toHaveCount(0);
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll(".mermaid-frame")).every((frame) =>
        frame.querySelector("svg")
      )
    );

    const metrics = await page.evaluate(() => {
      const slide = document.querySelector(".slide")!;
      const fit = document.querySelector(".slide-fit")!;
      const slideBounds = slide.getBoundingClientRect();
      const fitBounds = fit.getBoundingClientRect();

      return {
        bodyScrollWidth: document.body.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollHeight: document.body.scrollHeight,
        bodyClientHeight: document.body.clientHeight,
        rootScrollHeight: document.documentElement.scrollHeight,
        rootClientHeight: document.documentElement.clientHeight,
        slideOverflow: getComputedStyle(slide).overflow,
        slideBottom: slideBounds.bottom,
        fitBottom: fitBounds.bottom,
        slideRight: slideBounds.right,
        fitRight: fitBounds.right
      };
    });

    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth);
    expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.bodyClientHeight);
    expect(metrics.rootScrollHeight).toBeLessThanOrEqual(metrics.rootClientHeight);
    expect(metrics.slideOverflow).not.toBe("scroll");
    expect(metrics.slideBottom).toBeLessThanOrEqual(metrics.fitBottom + 1);
    expect(metrics.slideRight).toBeLessThanOrEqual(metrics.fitRight + 1);
  }
});
