"use client";

// Ilustraciones de Aterna. El arte original está en design/illustrations/ y
// `node scripts/prepare-illustrations.js` lo deja en public/illustrations/.
// - Escenas y dibujos de línea (fondo crema → transparente): solo sobre papel.
// - Imágenes neón (luz sobre transparente): solo sobre tinta.
// Cada imagen se usa en un único sitio de la web.

import { Dot, Ill, IllImage, S, Spark, rrect } from "./Ill";

type P = { className?: string; label?: string };

/** Portada, bloque «Estudio»: una diseñadora pensando junto al portátil. */
export function IllStudio({ className, label }: P) {
  return <IllImage src="/illustrations/estudio-portada.webp" width={1200} height={664} className={className} label={label} />;
}

/** Página /estudio: alguien cuida una planta que crece. */
export function IllStudioPage({ className, label }: P) {
  return <IllImage src="/illustrations/estudio-pagina.webp" width={1200} height={608} className={className} label={label} />;
}

/** Contacto: el mensaje sale del sobre como un avión de papel. */
export function IllContact({ className, label }: P) {
  return <IllImage src="/illustrations/contacto.webp" width={840} height={521} className={className} label={label} />;
}

/** Cierre de página (contacto): avión de papel con estelas curvas. */
export function IllClosingPlane({ className, label }: P) {
  return <IllImage src="/illustrations/cierre-avion.webp" width={800} height={577} className={className} label={label} />;
}

const serviceImage = (slug: string, width: number, height: number) =>
  function IllService({ className, label }: P) {
    return <IllImage src={`/illustrations/servicio-${slug}.webp`} width={width} height={height} className={className} label={label} />;
  };

/** Iconos de los cuatro servicios (solo en la lista de la portada). */
export const serviceIllustrations = {
  web: serviceImage("web", 640, 403),
  seo: serviceImage("seo", 640, 391),
  mantenimiento: serviceImage("mantenimiento", 640, 324),
  "asistente-ia": serviceImage("asistente-ia", 640, 423),
} as const;

/**
 * 404: una señal que apunta a dos sitios y ninguno es este. Es el único
 * dibujo que sigue en SVG (motor en Ill.tsx).
 */
export function IllLost({ className, label }: P) {
  return (
    <Ill viewBox="0 0 320 240" className={className} label={label}>
      <S d="M30 214H290" />
      <S d="M120 214Q124 204 130 214M196 214Q200 202 206 214M216 214Q219 206 224 214" />
      <S d={rrect(150, 66, 14, 150, 3)} f="s" />
      <S d="M164 76H246L266 96L246 116H164Z" f="a" />
      <S d="M150 128H72L52 148L72 168H150Z" f="c" />
      <S d="M226 34Q226 16 244 16Q262 16 262 32Q262 46 246 52V62" />
      <Dot cx={246} cy={74} r={4} />
      <S d="M66 196Q74 184 86 188Q80 202 66 196Z" f="b" />
      <S d="M68 195Q76 191 83 189" />
      <Spark x={44} y={40} s={8} tone="c" />
      <Spark x={292} y={150} s={6} tone="a" />
    </Ill>
  );
}
