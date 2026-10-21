import { LegalPage } from "@/components/LegalPage";
import type { Locale } from "@/lib/dict";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMeta("impressum", (await params).lang as Locale);
}

export default function Page() {
  return <LegalPage file="impressum" title="Impressum" lang="de" />;
}
