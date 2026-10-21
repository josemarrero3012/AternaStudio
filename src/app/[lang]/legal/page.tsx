import { LegalPage } from "@/components/LegalPage";
import type { Locale } from "@/lib/dict";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMeta("legal", (await params).lang as Locale);
}

export default function Page() {
  return <LegalPage file="legal" title="Aviso legal y privacidad" lang="es" />;
}
