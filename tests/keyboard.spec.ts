import { expect, test, type Page } from "@playwright/test";
import { isDesktop, isMobile } from "./routes";

// Todo se puede usar solo con el teclado y siempre se ve dónde está el foco.

/** El foco se ve: contorno (o sombra) en el elemento enfocado. */
async function focusIsVisible(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return false;
    const s = getComputedStyle(el);
    return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none";
  });
}

test("el primer Tab lleva a «Saltar al contenido» y este al contenido", async ({ page }) => {
  await page.goto("/servicios/web");
  await page.keyboard.press("Tab");
  const skip = page.locator(".skip-link");
  await expect(skip).toBeFocused();
  expect(await focusIsVisible(page)).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.locator("#contenido")).toBeFocused();
});

test("la cabecera se recorre con Tab y el foco siempre se ve", async ({ page }, info) => {
  test.skip(!isDesktop(info.project.name), "En móvil, la navegación va en el menú.");
  await page.goto("/servicios");
  await page.keyboard.press("Tab"); // saltar al contenido
  const seen: string[] = [];
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press("Tab");
    const name = await page.evaluate(() => (document.activeElement?.textContent || document.activeElement?.getAttribute("aria-label") || "").trim());
    seen.push(name);
    expect(await focusIsVisible(page), `sin foco visible en «${name}»`).toBe(true);
  }
  // Marca, tres secciones, cuatro idiomas y la llamada: en ese orden.
  expect(seen.slice(1, 4)).toEqual(["Servicios", "Estudio", "Contacto"]);
  expect(seen.slice(4, 8)).toEqual(["ES", "EN", "NL", "DE"]);
});

test("el menú del móvil se abre, se recorre y se cierra con el teclado", async ({ page }, info) => {
  test.skip(!isMobile(info.project.name), "El menú desplegable es del móvil.");
  await page.goto("/estudio");
  const toggle = page.locator(".menu-toggle");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const panel = page.getByRole("dialog", { name: "Menú de navegación" });
  // El foco no se escapa del menú abierto (ni del botón que lo cierra).
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => !!document.activeElement?.closest("#menu-panel, .menu-toggle"));
    expect(inside, `Tab ${i + 1} sale del menú`).toBe(true);
  }
  await expect(panel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});

test("el asistente se abre y se cierra con el teclado", async ({ page }) => {
  await page.goto("/servicios");
  const orb = page.getByRole("button", { name: "Abrir el asistente de Aterna" });
  await orb.focus();
  expect(await focusIsVisible(page)).toBe(true);
  await page.keyboard.press("Enter");
  const input = page.getByPlaceholder("Pregunta lo que quieras…");
  await expect(input).toBeFocused();
  await page.keyboard.type("precio de una web");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Asistente de Aterna" })).toContainText("1490");
  await page.keyboard.press("Escape");
  await expect(orb).toBeFocused();
});

test("el formulario de contacto se rellena y se envía solo con el teclado", async ({ page }) => {
  let sent = false;
  await page.route("**/contacto.php", (route) => {
    sent = true;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto("/contacto");
  await page.locator("#cf-name").focus();
  await page.keyboard.type("Prueba");
  await page.keyboard.press("Tab");
  await expect(page.locator("#cf-email")).toBeFocused();
  await page.keyboard.type("prueba@example.com");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Mensaje escrito con el teclado.");
  await page.keyboard.press("Tab");
  await expect(page.locator("#cf-consent")).toBeFocused();
  expect(await focusIsVisible(page)).toBe(true);
  await page.keyboard.press("Space");
  await expect(page.locator("#cf-consent")).toBeChecked();
  // Tab hasta el botón de enviar (el enlace de privacidad va antes).
  for (let i = 0; i < 4 && !(await page.locator(".contact-form__submit").evaluate((b) => b === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(page.locator(".contact-form__submit")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".contact-form__note")).toHaveAttribute("data-state", "sent");
  expect(sent).toBe(true);
});
