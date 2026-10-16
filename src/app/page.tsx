"use client";

import { Approach, FinalCTA, Hero, Services, StudioStatement } from "@/components/sections";

// Metadatos de la home: los del layout.
export default function Home() {
  return (
    <>
      <Hero />
      <StudioStatement n={1} />
      <Services n={2} />
      <Approach n={3} />
      <FinalCTA />
    </>
  );
}
