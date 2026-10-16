import { EstudioContent } from "@/components/pages";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Estudio",
  path: "/estudio",
  description:
    "Aterna es un estudio digital independiente para negocios que aún no tienen web, o necesitan una que esté a la altura. Pocos proyectos, hechos enteros.",
});

export default function Page() {
  return <EstudioContent />;
}
