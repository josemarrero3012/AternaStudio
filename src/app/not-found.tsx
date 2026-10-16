import type { Metadata } from "next";
import { NotFoundContent } from "@/components/pages";

export const metadata: Metadata = {
  title: "Página no encontrada — Aterna Studio",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundContent />;
}
