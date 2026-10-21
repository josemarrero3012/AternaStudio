import { ContactoContent } from "@/components/pages";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("contacto", "es");

export default function Page() {
  return <ContactoContent />;
}
