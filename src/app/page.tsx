"use client";

import { Approach, Cases, FinalCTA, Hero, Services, StudioStatement } from "@/components/sections";
import { useI18n } from "@/lib/i18n";

// Metadatos de la home: los del layout.
//
// Al entrar, la portada cuenta primero quiénes somos (el estudio), después
// cómo trabajamos (el método) y luego casos de uso; con eso ya presentado,
// el catálogo de servicios y el contacto. Los casos solo salen cuando hay
// alguno real: tres huecos «Pendiente» en la portada restaban más de lo que
// contaban. La numeración se ajusta sola.
export default function Home() {
  const { t } = useI18n();
  const withCases = t.cases.items.some((item) => !item.pending);
  const k = withCases ? 1 : 0;
  return (
    <>
      <Hero />
      <StudioStatement n={1} />
      <Approach n={2} />
      {withCases ? <Cases n={3} /> : null}
      <Services n={3 + k} />
      <FinalCTA n={4 + k} />
    </>
  );
}
