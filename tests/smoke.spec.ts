import { expect, test, type Page } from "@playwright/test";
import { LOCALES, NOINDEX, ROUTES, isDesktop, localPath, publicUrl } from "./routes";

/** Errores de consola y peticiones propias que fallan mientras se usa la página. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (err) => problems.push(`excepción: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`consola: ${msg.text()}`);
  });
  page.on("response", (res) => {
    const url = new URL(res.url());
    if (url.hostname === "localhost" && res.status() >= 400) problems.push(`${res.status()} ${url.pathname}`);
  });
  return problems;
}

// Cada página, en cada idioma: carga sin errores, con su idioma, un solo h1
// y los metadatos de SEO que le tocan. Solo en escritorio (el HTML es el mismo).
for (const locale of LOCALES) {
  for (const route of ROUTES) {
    const path = localPath(route, locale);
    test(`${path} carga bien`, async ({ page }, info) => {
      test.skip(!isDesktop(info.project.name), "El HTML es el mismo en móvil; se mira en cada navegador de escritorio.");
      const problems = watch(page);
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/Aterna Studio/);

      const noindex = NOINDEX.has(route);
      const canonical = publicUrl(route, noindex ? "es" : locale);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
      if (noindex) {
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
      } else {
        // En Google se ven unos 150 caracteres: menos de 50 se queda corto.
        await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{50,}/);
        for (const l of LOCALES) {
          await expect(page.locator(`link[rel="alternate"][hreflang="${l}"]`)).toHaveAttribute("href", publicUrl(route, l));
        }
        await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute("href", publicUrl(route, "es"));
      }

      await page.waitForLoadState("networkidle");
      expect(problems).toEqual([]);
    });
  }
}

test("cada idioma tiene su 404", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "Una vez basta.");
  for (const locale of LOCALES) {
    const res = await request.get(localPath("/no-existe-esta-pagina", locale));
    expect(res.status()).toBe(404);
    expect(await res.text()).toContain(`<html lang="${locale}"`);
  }
});

test("los enlaces internos no llevan a una 404", async ({ page, request }, info) => {
  test.skip(info.project.name !== "desktop", "Una vez basta.");
  // Recorre 44 páginas: necesita más que los 30 s por defecto.
  test.setTimeout(120_000);
  const found = new Set<string>();
  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      await page.goto(localPath(route, locale), { waitUntil: "domcontentloaded" });
      const hrefs = await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
      for (const href of hrefs) found.add(href.split("#")[0].split("?")[0] || "/");
    }
  }
  const broken: string[] = [];
  for (const href of found) {
    const res = await request.get(href);
    if (res.status() !== 200) broken.push(`${res.status()} ${href}`);
  }
  expect(broken, `${found.size} enlaces revisados`).toEqual([]);
});

test("robots.txt y sitemap.xml cubren las páginas indexables", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "Una vez basta.");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap: https://aternastudio.com/sitemap.xml");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      const loc = `<loc>${publicUrl(route, locale)}</loc>`;
      if (NOINDEX.has(route)) expect(sitemap).not.toContain(loc);
      else expect(sitemap).toContain(loc);
    }
  }
});
