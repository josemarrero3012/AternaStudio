"use client";

// Ilustraciones de Aterna. Todas comparten el mismo lenguaje (ver Ill.tsx):
// el árbol de la marca como hilo conductor, línea uniforme y tres tintas
// planas (a = azul, b = violeta, c = rosa) más un tono suave (s).

import { Dash, Dot, Ill, S, Spark, circ, rrect } from "./Ill";

type P = { className?: string; label?: string };

/** Diseño y desarrollo web: ventana de navegador que se está dibujando. */
export function IllWeb({ className, label }: P) {
  return (
    <Ill viewBox="0 0 320 240" className={className} label={label}>
      {/* ventana */}
      <S d={rrect(36, 34, 208, 156, 12)} f="s" />
      <S d="M36 58H244" />
      <Dot cx={52} cy={46} r={3.2} />
      <Dot cx={64} cy={46} r={3.2} />
      <Dot cx={76} cy={46} r={3.2} />
      {/* imagen principal */}
      <S d={rrect(54, 74, 98, 64, 5)} f="a" />
      <S d="M60 132L84 106L98 120L112 106L146 134" />
      <S d={circ(128, 92, 8)} f="c" />
      {/* texto y botón */}
      <S d="M168 80H222" />
      <S d="M168 93H212" />
      <S d="M168 106H218" />
      <S d={rrect(168, 118, 42, 15, 7.5)} f="c" />
      {/* tarjetas */}
      <S d={rrect(54, 150, 52, 26, 4)} f="b" />
      <S d={rrect(114, 150, 52, 26, 4)} f="s" />
      <S d={rrect(174, 150, 52, 26, 4)} f="s" />
      {/* etiqueta de código */}
      <S d={rrect(244, 22, 58, 38, 9)} f="b" />
      <S d="M262 33L255 41L262 49" />
      <S d="M284 33L291 41L284 49" />
      <S d="M276 31L270 51" />
      {/* lápiz */}
      <g transform="translate(252 150) rotate(-52)">
        <S d="M-52 -10H40V10H-52Z" f="c" />
        <S d="M40 -10H52V10H40Z" f="s" />
        <S d="M52 -10H60Q67 -10 67 -3V3Q67 10 60 10H52Z" f="b" />
        <S d="M-52 -10L-74 0L-52 10Z" f="s" />
        <path className="ill-dot" d="M-66 -3.6L-74 0L-66 3.6Z" />
        <S d="M-30 -10V10" />
      </g>
      {/* trazo que va dejando el lápiz */}
      <S d="M92 214Q126 200 150 212T206 206" tone="c" />
      <Spark x={22} y={26} s={8} tone="c" />
      <Spark x={300} y={196} s={6} />
      <Spark x={18} y={170} s={5} tone="a" />
    </Ill>
  );
}

/** SEO y crecimiento orgánico: lupa con un brote que crece y gráfica al alza. */
export function IllSeo({ className, label }: P) {
  return (
    <Ill viewBox="0 0 320 240" className={className} label={label}>
      <S d="M24 204H296" />
      {/* barras */}
      <S d={rrect(204, 156, 22, 48, 3)} f="b" />
      <S d={rrect(232, 124, 22, 80, 3)} f="a" />
      <S d={rrect(260, 90, 22, 114, 3)} f="c" />
      <S d="M198 136L224 110L242 122L282 66" tone="c" />
      <S d="M266 64H284V82" tone="c" />
      {/* lupa */}
      <S d="M167 145L205 183Q208 189 203 194Q197 198 191 193L153 156Z" f="b" />
      <S d={circ(116, 106, 60)} f="s" />
      <S d={circ(116, 106, 48)} />
      <S d="M80 84Q86 70 100 63" />
      {/* brote dentro de la lupa */}
      <S d="M90 146Q116 132 142 146" />
      <S d="M116 140Q113 120 118 98" />
      <S d="M117 124Q94 124 88 102Q110 98 117 120Z" f="c" />
      <S d="M118 108Q122 84 148 80Q148 104 119 110Z" f="a" />
      <Spark x={52} y={36} s={8} tone="a" />
      <Spark x={300} y={34} s={6} tone="c" />
      <Dot cx={186} cy={50} r={2.6} />
      <Dot cx={40} cy={180} r={2.6} />
    </Ill>
  );
}

/** Mantenimiento y soporte: escudo, llave y pulso de monitorización. */
export function IllCare({ className, label }: P) {
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x1 = 252 + Math.cos(a) * 17;
    const y1 = 62 + Math.sin(a) * 17;
    const x2 = 252 + Math.cos(a) * 25;
    const y2 = 62 + Math.sin(a) * 25;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }).join("");
  return (
    <Ill viewBox="0 0 320 240" className={className} label={label}>
      {/* pulso */}
      <S d="M20 212H88L100 190L114 230L126 200L136 212H300" tone="c" />
      {/* engranaje */}
      <S d={teeth} />
      <S d={circ(252, 62, 17)} f="c" />
      <S d={circ(252, 62, 6)} f="s" />
      {/* escudo */}
      <S d="M128 30Q160 48 194 42Q198 118 128 186Q58 118 62 42Q96 48 128 30Z" f="a" />
      <S d="M128 48Q152 60 176 58Q176 112 128 162" />
      <S d="M98 108L120 130L162 84" />
      {/* llave inglesa */}
      <g transform="translate(222 150) rotate(-38)">
        <S d="M-62 -9H22V9H-62Q-70 9 -70 0Q-70 -9 -62 -9Z" f="b" />
        <S d="M18 -8L24 -17A20 20 0 0 1 54 -12L42 -5V5L54 12A20 20 0 0 1 24 17L18 8Z" f="b" />
        <Dot cx={-56} cy={0} r={3} />
      </g>
      <Spark x={30} y={40} s={8} tone="c" />
      <Spark x={296} y={140} s={6} tone="a" />
      <Dot cx={210} cy={24} r={2.6} />
    </Ill>
  );
}

/** Asistente telefónico con IA: móvil que habla y burbuja que responde 24/7. */
export function IllVoice({ className, label }: P) {
  return (
    <Ill viewBox="0 0 320 240" className={className} label={label}>
      {/* ondas */}
      <S d="M54 96Q44 120 54 144" />
      <S d="M40 84Q24 120 40 156" />
      {/* móvil */}
      <S d={rrect(70, 34, 88, 166, 16)} f="s" />
      <S d={rrect(80, 54, 68, 122, 6)} f="a" />
      <S d="M104 44H124" />
      <Dot cx={114} cy={188} r={3.4} />
      <S d="M94 106V128M104 96V138M114 88V146M124 98V136M134 108V126" />
      {/* burbuja */}
      <S d="M186 46H280Q294 46 294 60V104Q294 118 280 118H206L180 138L188 118Q174 118 174 104V60Q174 46 186 46Z" f="b" />
      <Dot cx={210} cy={82} r={5} />
      <Dot cx={234} cy={82} r={5} />
      <Dot cx={258} cy={82} r={5} />
      {/* reloj 24 h */}
      <S d={circ(236, 186, 30)} f="c" />
      <S d="M236 186V166M236 186L250 194" />
      <Dot cx={236} cy={186} r={3} />
      <S d="M236 160V156M262 186H266M236 212V216M210 186H206" />
      <Spark x={302} y={30} s={8} tone="c" />
      <Spark x={176} y={176} s={5} tone="a" />
    </Ill>
  );
}

/**
 * El estudio: el árbol del símbolo, con raíces dentro de un círculo cerrado,
 * y una persona trabajando a su sombra.
 */
export function IllStudio({ className, label }: P) {
  return (
    <Ill viewBox="0 0 320 320" className={className} label={label}>
      <S d={circ(160, 160, 132)} />
      <Dash d={circ(160, 160, 146)} />
      {/* raíces */}
      <S d="M152 236Q128 250 110 270" />
      <S d="M160 238Q162 258 156 282" />
      <S d="M168 236Q192 250 212 268" />
      <S d="M146 240Q118 244 92 252" />
      <S d="M174 240Q204 244 228 252" />
      <S d="M60 236H260" />
      {/* tronco */}
      <S d="M150 236Q156 200 152 176Q149 162 136 152L144 145Q157 154 160 166Q163 154 177 144L185 151Q172 162 169 176Q166 200 172 236Z" f="b" />
      {/* copa: una nube con dos racimos de hojas */}
      <S d="M98 146Q76 140 80 118Q70 94 94 84Q96 58 124 56Q138 36 162 42Q186 34 202 54Q230 54 234 80Q254 96 242 118Q248 142 222 146Q206 162 184 152Q170 164 152 154Q130 164 116 150Q102 156 98 146Z" f="a" />
      {/* manchas de hojas, sin contorno, como tinta superpuesta */}
      <S d="M96 116Q92 98 108 96Q116 84 128 94Q134 106 122 114Q110 124 96 116Z" f="c" bg={false} line={false} />
      <S d="M170 128Q164 112 180 106Q194 98 206 108Q222 104 222 120Q224 136 204 136Q184 142 170 128Z" f="b" bg={false} line={false} />
      <S d="M160 58Q170 50 184 56Q192 66 180 72Q166 76 160 58Z" f="c" bg={false} line={false} />
      {/* ramitas dentro de la copa */}
      <S d="M160 150Q158 128 146 112M160 150Q166 126 188 114M160 150V120" />
      {/* persona con portátil, a la sombra */}
      <S d="M70 236Q72 208 84 202Q98 198 104 212L108 236Z" f="c" />
      <S d={circ(86, 186, 12)} f="s" />
      <path className="ill-dot" d="M74 184Q73 170 87 171Q99 172 99 184Q92 178 84 180Q78 182 74 184Z" />
      <S d="M100 236Q114 218 128 236" />
      <S d="M102 228L122 210L132 220L112 236Z" f="a" />
      <S d="M92 214Q100 226 110 226" />
      <Spark x={270} y={52} s={9} tone="c" />
      <Spark x={44} y={72} s={7} tone="a" />
      <Spark x={276} y={232} s={5} />
      {/* hojas que caen */}
      <S d="M244 196Q252 186 262 190Q256 202 244 196Z" f="a" />
      <S d="M232 216Q236 208 244 210Q242 220 232 216Z" f="c" />
    </Ill>
  );
}

/** Contacto: un avión de papel sale del sobre. */
export function IllContact({ className, label }: P) {
  return (
    <Ill viewBox="0 0 320 240" className={className} label={label}>
      <Dash d="M108 132Q100 70 150 74Q196 80 168 112Q148 132 198 112" />
      {/* sobre */}
      <S d={rrect(36, 132, 126, 82, 8)} f="s" />
      <S d="M38 138L99 182L160 138" />
      <S d="M38 210L84 172M160 210L114 172" />
      {/* avión */}
      <S d="M196 98L296 52L256 146L236 116Z" f="a" />
      <S d="M296 52L236 116L228 140L248 124" f="b" />
      <S d="M296 52L236 116" />
      <Spark x={290} y={170} s={8} tone="c" />
      <Spark x={60} y={60} s={6} tone="a" />
      <S d="M270 200Q278 190 288 194Q282 206 270 200Z" f="c" />
      <Dot cx={196} cy={196} r={2.6} />
    </Ill>
  );
}

/** 404: una señal que apunta a dos sitios y ninguno es este. */
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
      <Spark x={44} y={40} s={8} tone="c" />
      <Spark x={292} y={150} s={6} tone="a" />
    </Ill>
  );
}

// Iconos de las cuatro fases del método -------------------------------------

export function IllUnderstand({ className }: P) {
  return (
    <Ill viewBox="0 0 120 96" className={className}>
      <S d={rrect(18, 10, 58, 74, 5)} f="s" />
      <S d="M28 26H64M28 38H58M28 50H62M28 62H48" />
      <S d="M86 72L104 90" />
      <S d={circ(76, 60, 18)} f="a" />
      <Spark x={104} y={18} s={6} tone="c" />
    </Ill>
  );
}

export function IllDirect({ className }: P) {
  return (
    <Ill viewBox="0 0 120 96" className={className}>
      <S d={circ(58, 50, 36)} f="s" />
      <S d="M58 18V24M58 76V82M26 50H32M84 50H90" />
      <S d="M58 26L68 50H48Z" f="c" />
      <S d="M58 74L68 50H48Z" f="b" />
      <Dot cx={58} cy={50} r={3.4} />
      <Spark x={104} y={16} s={6} tone="a" />
    </Ill>
  );
}

export function IllBuild({ className }: P) {
  return (
    <Ill viewBox="0 0 120 96" className={className}>
      <S d={rrect(16, 52, 40, 34, 4)} f="a" />
      <S d={rrect(62, 52, 40, 34, 4)} f="b" />
      <S d={rrect(38, 14, 40, 34, 4)} f="c" />
      <S d="M50 26L44 31L50 36M66 26L72 31L66 36" />
      <Spark x={104} y={20} s={6} tone="a" />
    </Ill>
  );
}

export function IllGrow({ className }: P) {
  return (
    <Ill viewBox="0 0 120 96" className={className}>
      <S d="M18 86H92" />
      <S d="M58 86Q56 64 60 42" />
      <S d="M58 68Q38 68 32 52Q52 46 58 64Z" f="a" />
      <S d="M60 52Q64 30 86 28Q86 50 61 54Z" f="c" />
      <S d="M104 74V26M94 36L104 26L114 36" tone="c" />
      <Spark x={24} y={24} s={6} tone="b" />
    </Ill>
  );
}

export const serviceIllustrations = {
  web: IllWeb,
  seo: IllSeo,
  mantenimiento: IllCare,
  "asistente-ia": IllVoice,
} as const;

export const approachIllustrations = [IllUnderstand, IllDirect, IllBuild, IllGrow];
