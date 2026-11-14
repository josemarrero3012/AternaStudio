import { expect, test, type APIRequestContext } from "@playwright/test";
import { LOCALES, ROUTES, SITE, localPath, publicUrl, type Locale } from "./routes";

// Datos estructurados (schema.org) e imagen para redes de cada página, en
// los cuatro idiomas. Se lee el HTML exportado, como lo verían Google y las
// redes sociales (sin ejecutar JavaScript).

type Node = Record<string, unknown> & { "@type"?: string };

async function load(request: APIRequestContext, path: string) {
  const html = await (await request.get(path)).text();
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const nodes: Node[] = ld.flatMap((x) => (Array.isArray(x) ? x : [x])).flatMap((x) => (x["@graph"] as Node[]) ?? [x]);
  const meta = (prop: string) => html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`))?.[1];
  return { nodes, meta, html };
}

const SERVICES = ["web", "seo", "mantenimiento", "asistente-ia"];
const localOf = (url: string) => url.replace(SITE, "") || "/";

for (const locale of LOCALES) {
  test(`datos estructurados e imagen para redes en ${locale}`, async ({ request }, info) => {
    test.skip(info.project.name !== "desktop", "Es el mismo HTML en todos los navegadores.");
    const image = `${SITE}/brand/og-${locale}.jpg`;
    const img = await request.get(localOf(image));
    expect(img.status(), image).toBe(200);
    expect(img.headers()["content-type"]).toContain("image/jpeg");

    for (const route of ROUTES) {
      const path = localPath(route, locale);
      const { nodes, meta } = await load(request, path);

      // Imagen para redes, la del idioma, con su texto alternativo.
      expect(meta("og:image"), path).toBe(image);
      expect(meta("twitter:image"), path).toBe(image);
      expect(meta("og:image:alt"), path).toMatch(/^Aterna Studio — .+/);

      // La organización, una vez y con su id; las demás piezas la citan.
      const orgs = nodes.filter((n) => n["@type"] === "Organization");
      expect(orgs, path).toHaveLength(1);
      expect(orgs[0]["@id"]).toBe(`${SITE}/#organization`);
      expect(orgs[0].address).toMatchObject({ addressCountry: "DE" });

      // Ruta de navegación donde toca: Inicio › … › esta página.
      const crumbs = nodes.find((n) => n["@type"] === "BreadcrumbList") as { itemListElement: { position: number; name: string; item: string }[] } | undefined;
      const depth = route.startsWith("/servicios/") ? 3 : ["/servicios", "/estudio", "/contacto"].includes(route) ? 2 : 0;
      if (!depth) {
        expect(crumbs, path).toBeUndefined();
      } else {
        expect(crumbs?.itemListElement, path).toHaveLength(depth);
        crumbs!.itemListElement.forEach((c, i) => expect(c.position).toBe(i + 1));
        expect(crumbs!.itemListElement[0].item).toBe(publicUrl("/", locale));
        expect(crumbs!.itemListElement.at(-1)!.item).toBe(publicUrl(route, locale));
        for (const c of crumbs!.itemListElement) {
          expect(c.name.trim().length, `${path}: nombre vacío`).toBeGreaterThan(0);
          expect((await request.get(localOf(c.item))).status(), c.item).toBe(200);
        }
      }

      // Fichas de servicio: el servicio, sus planes y las preguntas.
      if (route.startsWith("/servicios/")) {
        const svc = nodes.find((n) => n["@type"] === "Service") as Node & { offers: Node[] };
        expect(svc, path).toBeTruthy();
        expect(String(svc.name), path).not.toContain("·");
        expect(svc.provider).toEqual({ "@id": `${SITE}/#organization` });
        expect(svc.url).toBe(publicUrl(route, locale));
        expect(svc.areaServed, `${path}: sin zona de servicio inventada`).toBeUndefined();
        expect(svc.offers.length).toBeGreaterThan(1);
        for (const o of svc.offers) {
          const spec = o.priceSpecification as Node | undefined;
          if (route === "/servicios/asistente-ia") expect(o.price, `${path}: precio personalizado`).toBeUndefined();
          else expect(Number(o.price), path).toBeGreaterThan(0);
          if (["/servicios/seo", "/servicios/mantenimiento"].includes(route)) {
            expect(spec, `${path}: los mensuales llevan la unidad`).toMatchObject({ "@type": "UnitPriceSpecification", unitCode: "MON" });
          }
          if (route === "/servicios/web") expect(spec, `${path}: «desde» como precio mínimo`).toMatchObject({ minPrice: o.price });
        }
        const faq = nodes.find((n) => n["@type"] === "FAQPage") as Node & { mainEntity: Node[] };
        expect(faq?.mainEntity.length, path).toBeGreaterThan(0);
      }
    }
  });
}

test("las fichas de servicio existen en los cuatro idiomas", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "Una vez basta.");
  for (const locale of LOCALES as readonly Locale[]) {
    for (const s of SERVICES) expect((await request.get(localPath(`/servicios/${s}`, locale))).status()).toBe(200);
  }
});
