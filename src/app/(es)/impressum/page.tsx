import { LegalPage } from "@/components/LegalPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("impressum", "es");

export default function Page() {
  return <LegalPage file="impressum" title="Impressum" lang="de" />;
}
