import { LegalPage } from "@/components/LegalPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Impressum", path: "/impressum", noindex: true });

export default function Page() {
  return <LegalPage file="impressum" title="Impressum" lang="de" />;
}
