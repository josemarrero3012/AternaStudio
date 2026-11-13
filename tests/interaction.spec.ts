import { expect, test } from "@playwright/test";
import { isDesktop, isMobile } from "./routes";

// Lo que la gente toca: menú del móvil, cambio de idioma y formulario.

test("el menú del móvil se abre, atrapa el foco y se cierra con Escape", async ({ page }, info) => {
  test.skip(!isMobile(info.project.name), "El menú desplegable es del móvil.");
  await page.goto("/servicios");
  const toggle = page.locator(".menu-toggle");
  const panel = page.getByRole("dialog", { name: "Menú de navegación" });

  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeVisible();
  await expect.poll(() => panel.evaluate((el) => el.contains(document.activeElement))).toBe(true);

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});

test("el menú del móvil lleva a cada sección", async ({ page }, info) => {
  test.skip(!isMobile(info.project.name), "El menú desplegable es del móvil.");
  await page.goto("/");
  await page.locator(".menu-toggle").click();
  await page.getByRole("dialog", { name: "Menú de navegación" }).getByRole("link", { name: /Estudio/ }).click();
  await expect(page).toHaveURL(/\/estudio$/);
  await expect(page.locator("h1")).toBeVisible();
});

test("el selector de idioma lleva a la misma página en el otro idioma", async ({ page }, info) => {
  test.skip(!isDesktop(info.project.name), "En móvil está dentro del menú.");
  await page.goto("/servicios/web");
  const group = page.locator(".header__lang");
  await expect(group.getByRole("link", { name: /^EN/ })).toHaveAttribute("href", "/en/servicios/web");
  await expect(group.getByRole("link", { name: /^DE/ })).toHaveAttribute("href", "/de/servicios/web");
  await group.getByRole("link", { name: /^EN/ }).click();
  await expect(page).toHaveURL(/\/en\/servicios\/web$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test.describe("formulario de contacto", () => {
  test("vacío no se envía", async ({ page }) => {
    let sent = false;
    await page.route("**/contacto.php", (route) => {
      sent = true;
      return route.fulfill({ json: { ok: true } });
    });
    await page.goto("/contacto");
    await page.locator(".contact-form__submit").click();
    await expect(page.locator("#cf-name")).toBeFocused();
    expect(sent).toBe(false);
  });

  test("completo se envía y lo confirma", async ({ page }) => {
    let body: Record<string, unknown> | null = null;
    await page.route("**/contacto.php", async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto("/contacto");
    await page.locator("#cf-name").fill("Prueba");
    await page.locator("#cf-email").fill("prueba@example.com");
    await page.locator("#cf-message").fill("Mensaje de prueba automática.");
    await page.locator("#cf-consent").check();
    await page.locator(".contact-form__submit").click();
    await expect(page.locator(".contact-form__note")).toHaveAttribute("data-state", "sent");
    expect(body).toMatchObject({ name: "Prueba", email: "prueba@example.com", consent: true, company: "" });
  });

  test("si el servidor falla, lo dice", async ({ page }) => {
    await page.route("**/contacto.php", (route) => route.fulfill({ status: 502, json: { ok: false, error: "send_failed" } }));
    await page.goto("/contacto");
    await page.locator("#cf-name").fill("Prueba");
    await page.locator("#cf-email").fill("prueba@example.com");
    await page.locator("#cf-message").fill("Mensaje de prueba automática.");
    await page.locator("#cf-consent").check();
    await page.locator(".contact-form__submit").click();
    await expect(page.locator(".contact-form__note")).toHaveAttribute("data-state", "error");
  });
});

test("«Ver cómo trabajamos» lleva al método de la portada", async ({ page }, info) => {
  test.skip(!isDesktop(info.project.name), "En móvil, igual que en escritorio.");
  await page.goto("/estudio");
  const link = page.locator(".section-foot a", { hasText: "cómo trabajamos" });
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(page).toHaveURL(/\/#metodo$/);
  // El método queda arriba, bajo la cabecera (no se queda en /estudio).
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById("metodo")!.getBoundingClientRect().top)), { timeout: 8_000 }).toBeLessThan(200);
});
