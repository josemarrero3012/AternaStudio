import { ServiciosContent } from "@/components/pages";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Servicios",
  path: "/servicios",
  description:
    "Cuatro formas de trabajar juntos: diseño y desarrollo web (pago único), SEO y crecimiento orgánico, mantenimiento y asistente telefónico con IA 24/7. Precios claros.",
});

export default function Page() {
  return <ServiciosContent />;
}
