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
    // Con React ya en marcha: si se escribe antes, al arrancar vacía los campos.
    await expect(page.locator("html")).toHaveAttribute("data-intro", "on");
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
    // Con React ya en marcha: si se escribe antes, al arrancar vacía los campos.
    await expect(page.locator("html")).toHaveAttribute("data-intro", "on");
    await page.locator("#cf-name").fill("Prueba");
    await page.locator("#cf-email").fill("prueba@example.com");
    await page.locator("#cf-message").fill("Mensaje de prueba automática.");
    await page.locator("#cf-consent").check();
    await page.locator(".contact-form__submit").click();
    await expect(page.locator(".contact-form__note")).toHaveAttribute("data-state", "sent");
    expect(body).toMatchObject({ name: "Prueba", email: "prueba@example.com", consent: true, company: "" });
  });

  test("trae el mensaje que deja el asistente", async ({ page }) => {
    // Al abrir la página con el enlace.
    await page.goto("/contacto?mensaje=Hola%2C%20quiero%20una%20web");
    await expect(page.locator("#cf-message")).toHaveValue("Hola, quiero una web");
    // Y al llegar desde otra página sin recargar, como hace el asistente.
    await page.goto("/servicios");
    await expect(page.locator("html")).toHaveAttribute("data-intro", "on");
    await page.evaluate(() => {
      const a = document.createElement("a");
      a.href = "/contacto?mensaje=Desde%20el%20asistente";
      a.textContent = "ir";
      document.body.append(a);
      a.click();
    });
    await expect(page).toHaveURL(/\/contacto\?mensaje=/);
    await expect(page.locator("#cf-message")).toHaveValue("Desde el asistente");
    // Lo escrito manda sobre el borrador.
    await page.locator("#cf-message").fill("Otro texto");
    await expect(page.locator("#cf-message")).toHaveValue("Otro texto");
  });

  test("si el servidor falla, lo dice", async ({ page }) => {
    await page.route("**/contacto.php", (route) => route.fulfill({ status: 502, json: { ok: false, error: "send_failed" } }));
    await page.goto("/contacto");
    // Con React ya en marcha: si se escribe antes, al arrancar vacía los campos.
    await expect(page.locator("html")).toHaveAttribute("data-intro", "on");
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

// «Qué incluye» de /servicios/web: la película y sus seis pasos (WebAnatomy).
test.describe("la película de diseño web", () => {
  // El WebKit de Playwright no siempre trae códecs de vídeo: sin vídeo queda
  // la imagen fija con la lista, que es lo que comprueba la última prueba.
  test.skip(({ browserName }) => browserName === "webkit", "Sin códecs de vídeo garantizados.");

  test("arranca al verse, se puede parar y cada paso lleva a su tramo", async ({ page }) => {
    await page.goto("/servicios/web");
    const stage = page.locator(".anatomy__stage");
    const video = stage.locator("video");
    const steps = page.locator(".anatomy__step");
    await expect(steps).toHaveCount(6);
    await stage.scrollIntoViewIfNeeded();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0), { timeout: 15_000 }).toBe(true);
    await stage.getByRole("button", { name: "Pausar" }).click();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await expect(stage.getByRole("button", { name: "Reproducir" })).toBeVisible();

    await steps.nth(3).click();
    await expect(steps.nth(3)).toHaveAttribute("aria-current", "step");
    expect(await video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(8);
  });

  test.describe("con movimiento reducido", () => {
    test.use({ reducedMotion: "reduce" });

    test("no arranca sola: imagen fija, y cada paso enseña su fotograma quieto", async ({ page }) => {
      await page.goto("/servicios/web");
      const stage = page.locator(".anatomy__stage");
      const video = stage.locator("video");
      await stage.scrollIntoViewIfNeeded();
      await expect(stage.locator("img")).toBeVisible();
      await page.waitForTimeout(800);
      expect(await video.evaluate((v: HTMLVideoElement) => v.paused && v.currentSrc === "")).toBe(true);

      await page.locator(".anatomy__step").nth(1).click();
      await expect(page.locator(".anatomy__step").nth(1)).toHaveAttribute("aria-current", "step");
      expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    });
  });
});

test("sin vídeo, «Qué incluye» de diseño web se queda con la imagen y los pasos", async ({ page }, info) => {
  test.skip(!isDesktop(info.project.name), "En móvil, igual que en escritorio.");
  await page.route("**/film/web/**/*.{webm,mp4}", (route) => route.abort());
  await page.goto("/servicios/web");
  const stage = page.locator(".anatomy__stage");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage.locator("img")).toBeVisible();
  await expect(page.locator(".anatomy__steps li")).toHaveCount(6);
  // Sin vídeo no hay nada que pausar: el botón desaparece.
  await expect(stage.getByRole("button")).toBeHidden({ timeout: 15_000 });
});
