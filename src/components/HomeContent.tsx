"use client";

// La portada, en su propio módulo: el recorrido de partículas (Journey y
// lib/tree) y las secciones de la portada solo los descarga quien entra en
// ella, no el resto de páginas.

import { useI18n } from "@/lib/i18n";
import { Journey } from "./Journey";
import { Approach, Cases, Services, StudioStatement } from "./homeSections";
import { FinalCTA } from "./sections";

// La portada abre con el recorrido (Journey: el árbol de Aterna en
// partículas, que baja a sus raíces y vuelve a crecer) y después cuenta
// quiénes somos (el estudio), después cómo trabajamos (el método) y luego
// casos de uso; con eso ya presentado,
// el catálogo de servicios y el contacto. Los casos solo salen cuando hay
// alguno real: tres huecos «Pendiente» en la portada restaban más de lo que
// contaban. La numeración se ajusta sola.
export function HomeContent() {
  const { t, locale } = useI18n();
  const withCases = t.cases.items.some((item) => !item.pending);
  const k = withCases ? 1 : 0;
  return (
    <>
      {/* Por idioma: el recorrido guarda sus palabras al montar. */}
      <Journey key={locale} />
      <StudioStatement n={1} />
      <Approach n={2} />
      {withCases ? <Cases n={3} /> : null}
      <Services n={3 + k} />
      <FinalCTA n={4 + k} />
    </>
  );
}

