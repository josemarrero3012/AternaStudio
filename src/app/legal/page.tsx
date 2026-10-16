import { LegalPage } from "@/components/LegalPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Aviso legal y privacidad",
  path: "/legal",
  description: "Aviso legal, política de privacidad (RGPD) y política de cookies de Aterna Studio.",
  noindex: true,
});

export default function Page() {
  return <LegalPage file="legal" title="Aviso legal y privacidad" lang="es" />;
}
