import { ContactoContent } from "@/components/pages";
import { SectionJsonLd } from "@/components/SectionJsonLd";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("contacto", "es");

export default function Page() {
  return (
    <>
      <SectionJsonLd locale="es" path="/contacto" />
      <ContactoContent />
    </>
  );
}
