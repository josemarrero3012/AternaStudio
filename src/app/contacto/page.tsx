import { ContactoContent } from "@/components/pages";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Contacto",
  path: "/contacto",
  description:
    "Escribe a contacto@aternastudio.com. Respondemos a todo, aunque sea para decir que no somos el estudio adecuado.",
});

export default function Page() {
  return <ContactoContent />;
}
