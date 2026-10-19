"use client";

import { Approach, FinalCTA, Hero, Services, StudioStatement } from "@/components/sections";

// Metadatos de la home: los del layout.
//
// El recorrido responde a las preguntas en el orden en que se las hace quien
// llega: qué hacéis (servicios, justo después de la promesa del hero), quién
// sois (el estudio: «Cuatro servicios, un solo estudio» da paso a «Un estudio
// pequeño, por decisión»), cómo trabajáis (el método) y cómo empezamos (el
// contacto, cuyo primer paso continúa el método).
export default function Home() {
  return (
    <>
      <Hero />
      <Services n={1} />
      <StudioStatement n={2} />
      <Approach n={3} />
      <FinalCTA n={4} />
    </>
  );
}
