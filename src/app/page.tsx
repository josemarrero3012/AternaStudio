"use client";

import { Approach, Cases, FinalCTA, Hero, Services, StudioStatement } from "@/components/sections";
import { WorkSection } from "@/components/Work";
import { useI18n } from "@/lib/i18n";

// Metadatos de la home: los del layout.
//
// Al entrar, la portada cuenta primero quiénes somos (el estudio), después
// cómo trabajamos (el método) y lo que hemos hecho con él (trabajo); con eso
// ya presentado, el catálogo de servicios y el contacto. Los casos de uso
// solo salen cuando hay alguno real: tres huecos «Pendiente» en la portada
// restaban más de lo que contaban. La numeración se ajusta sola.
export default function Home() {
  const { t } = useI18n();
  const withCases = t.cases.items.some((item) => !item.pending);
  const k = withCases ? 1 : 0;
  return (
    <>
      <Hero />
      <StudioStatement n={1} />
      <Approach n={2} />
      <WorkSection n={3} />
      {withCases ? <Cases n={4} /> : null}
      <Services n={4 + k} />
      <FinalCTA n={5 + k} />
    </>
  );
}
