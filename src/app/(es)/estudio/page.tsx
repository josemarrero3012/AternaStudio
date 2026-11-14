import { EstudioContent } from "@/components/pages";
import { SectionJsonLd } from "@/components/SectionJsonLd";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("estudio", "es");

export default function Page() {
  return (
    <>
      <SectionJsonLd locale="es" path="/estudio" />
      <EstudioContent />
    </>
  );
}
