import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { KEY_PAGES, localPath } from "./routes";

// Accesibilidad automática (axe, WCAG 2.2 A y AA) en las páginas principales,
// en español y en alemán (las palabras más largas). Falla con problemas
// graves o críticos; los menores salen en el informe como anexo.
//
// axe mira el estado de la página en un momento: con movimiento reducido
// no hay entradas a medias que confundan el contraste.
test.use({ reducedMotion: "reduce" });

/**
 * Problemas ya conocidos, con su porqué y cuándo se arreglan. La prueba los
 * deja pasar (salen en el anexo) y falla con cualquiera nuevo. Al
 * arreglarlos, se borran de aquí.
 */
const KNOWN: { id: string; target: string; why: string }[] = [
  {
    id: "target-size",
    target: ".header__lang",
    why: "En la portada, los idiomas de la cabecera miden menos de 24 px (WCAG 2.2, 2.5.8). Se rediseña la cabecera en la fase de dirección de arte.",
  },
];

const isKnown = (id: string, target: string) => KNOWN.some((k) => k.id === id && target.includes(k.target));

for (const locale of ["es", "de"] as const) {
  for (const route of KEY_PAGES) {
    const path = localPath(route, locale);
    test(`${path} sin problemas graves de accesibilidad`, async ({ page }, info) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      await info.attach("axe.json", { body: JSON.stringify(results.violations, null, 2), contentType: "application/json" });
      const serious = results.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .flatMap((v) =>
          v.nodes
            .map((n) => n.target.join(" "))
            .filter((target) => !isKnown(v.id, target))
            .map((target) => `${v.id} (${v.impact}): ${v.help} — ${target}`),
        );
      expect(serious).toEqual([]);
    });
  }
}
