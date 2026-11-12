import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { KEY_PAGES } from "./routes";

// Capturas de referencia de las páginas principales, para ver qué cambia de
// verdad en cada fase. Con movimiento reducido (sin entradas a medias) y sin
// los lienzos (partículas, polvo de luz y orbe del asistente), que se mueven
// solos y no se repiten igual dos veces. Solo en local: ver playwright.config.ts.

for (const route of KEY_PAGES) {
  test(`captura de ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    const name = route === "/" ? "portada" : route.slice(1).replaceAll("/", "-");
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      stylePath: join(__dirname, "visual.css"),
      timeout: 30_000,
    });
  });
}
