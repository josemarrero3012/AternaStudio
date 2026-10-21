import { LegalPage } from "@/components/LegalPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("datenschutz", "es");

export default function Page() {
  return <LegalPage file="datenschutz" title="Datenschutzerklärung" lang="de" />;
}
