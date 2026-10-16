import { LegalPage } from "@/components/LegalPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Datenschutzerklärung", path: "/datenschutz", noindex: true });

export default function Page() {
  return <LegalPage file="datenschutz" title="Datenschutzerklärung" lang="de" />;
}
