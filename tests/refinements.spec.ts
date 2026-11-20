import { expect, test } from "@playwright/test";

test("el logo vuelve al hero desde otra página y desde el recorrido", async ({ page }) => {
  await page.goto("/servicios/web");
  await page.locator(".header__brand").click();
  await expect(page).toHaveURL(/\/#inicio$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
  await page.evaluate(() => window.scrollTo(0, 1400));
  await expect(page.locator(".header__brand")).toHaveCSS("opacity", "1");
  await page.locator(".header__brand").click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
});

test("presupuestos sin importes y recorrido legible", async ({ page }, info) => {
  await page.goto("/servicios/web");
  await expect(page.locator(".plan__price")).toHaveText(Array(3).fill("Presupuesto a medida"));
  await expect(page.locator("body")).not.toContainText("€");
  await page.locator(".plans").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.locator(".plans").screenshot({ path: `/tmp/aterna-plans-${info.project.name}.png` });
  await page.goto("/");
  if (info.project.name === "desktop") {
    await expect(page.locator(".approach")).toHaveAttribute("data-rail", "on");
    await page.evaluate(() => {
      const pin = document.querySelector(".rail-pin")!;
      const rail = document.querySelector(".rail")!;
      window.scrollTo(0, pin.getBoundingClientRect().top + window.scrollY + (rail.scrollWidth - window.innerWidth) * 0.999);
    });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: "/tmp/aterna-rail.png" });
    await expect(page.locator(".rail__axis-base")).toHaveAttribute("d", /C/);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
