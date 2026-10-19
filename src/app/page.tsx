"use client";

import { Approach, Cases, FinalCTA, Hero, Services, StudioStatement } from "@/components/sections";

// Metadatos de la home: los del layout.
//
// Al entrar, la portada cuenta primero quiénes somos (el estudio), después
// cómo trabajamos (el método) y luego casos de uso; con eso ya presentado,
// el catálogo de servicios y el contacto.
export default function Home() {
  return (
    <>
      <Hero />
      <StudioStatement n={1} />
      <Approach n={2} />
      <Cases n={3} />
      <Services n={4} />
      <FinalCTA n={5} />
    </>
  );
}
