// Orden de la entrada, igual en todos los navegadores. En la portada la da
// el recorrido (Journey.tsx); en las demás páginas, IntroStart (Chrome.tsx)
// en cuanto hay JavaScript. Las piezas se enteran por un atributo en <html>
// y un evento, así da igual quién monte antes.

const INTRO = "aterna:intro";

const root = () => document.documentElement;

/** Empieza la entrada: sale la cabecera, los textos, el cursor. */
export function startIntro() {
  if (root().dataset.intro === "on") return;
  root().dataset.intro = "on";
  window.dispatchEvent(new Event(INTRO));
}

/** `cb` cuando empiece la entrada (ya, si empezó). Devuelve cómo cancelarlo. */
export function onIntro(cb: () => void) {
  if (root().dataset.intro === "on") {
    cb();
    return () => {};
  }
  const run = () => {
    window.removeEventListener(INTRO, run);
    cb();
  };
  window.addEventListener(INTRO, run);
  return () => window.removeEventListener(INTRO, run);
}
