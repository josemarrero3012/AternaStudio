import { ContactoContent } from "@/components/pages";
import type { Locale } from "@/lib/dict";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMeta("contacto", (await params).lang as Locale);
}

export default function Page() {
  return <ContactoContent />;
}
