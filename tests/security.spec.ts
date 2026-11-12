import { expect, test } from "@playwright/test";
import { LOCALES, ROUTES, localPath } from "./routes";

// Seguridad y privacidad de lo que se entrega. Las cabeceras salen del
// .htaccess (scripts/serve-out.mjs las lee de ahí), así que esto comprueba
// el mismo archivo que se sube a Hostinger.

const EXAMPLES = ["/ejemplos/nexo-asesores/", "/ejemplos/reformas-sevilla/"];

test("las páginas llevan las cabeceras de seguridad", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "Una vez basta.");
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("SAMEORIGIN");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["cross-origin-opener-policy"]).toBe("same-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  const csp = h["content-security-policy"] ?? "";
  for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'"]) {
    expect(csp).toContain(directive);
  }
});

// Ninguna página pide nada a otro dominio: ni fuentes, ni scripts, ni
// imágenes. Enviar la IP del visitante a terceros sin su consentimiento
// choca con el RGPD (la empresa está en Alemania). Con la política de
// contenido, además, el navegador lo bloquearía y la página se vería mal.
for (const path of [...LOCALES.flatMap((l) => ROUTES.map((r) => localPath(r, l))), ...EXAMPLES]) {
  test(`${path} no pide nada a otros dominios`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Lo mismo en móvil.");
    const external: string[] = [];
    const blocked: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (!["localhost", "127.0.0.1"].includes(url.hostname) && url.protocol.startsWith("http")) external.push(req.url());
    });
    page.on("console", (msg) => {
      if (/Content Security Policy|Refused to/i.test(msg.text())) blocked.push(msg.text());
    });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(external).toEqual([]);
    expect(blocked).toEqual([]);
  });
}

test("los ejemplos cargan sus fuentes desde la propia web", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Una vez basta.");
  for (const path of EXAMPLES) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    // El navegador solo descarga cada variante cuando la página la usa: se
    // mira que ninguna falle y que cada familia que se usa esté cargada.
    const state = await page.evaluate(() => {
      const faces = [...document.fonts];
      const families = ["Fraunces", "Hanken Grotesk", "IBM Plex Mono"];
      const used = new Set(
        [...document.querySelectorAll("body *")].map((el) => getComputedStyle(el).fontFamily.split(",")[0].replaceAll(/["']/g, "").trim()),
      );
      return {
        errors: faces.filter((f) => f.status === "error").map((f) => `${f.family} ${f.weight}`),
        notLoaded: families.filter((f) => used.has(f) && !faces.some((face) => face.family.replaceAll(/["']/g, "") === f && face.status === "loaded")),
        used: families.filter((f) => used.has(f)),
      };
    });
    expect(state.errors, path).toEqual([]);
    expect(state.notLoaded, path).toEqual([]);
    expect(state.used.length, `${path}: no usa ninguna de sus fuentes`).toBeGreaterThan(0);
  }
});
