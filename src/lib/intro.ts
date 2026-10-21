// Orden de la entrada en la portada, igual en todos los navegadores:
//
//   1. La cortina tapa (primera visita de la sesión) mientras el vídeo del
//      hero carga lo suficiente para arrancar sin cortes (heroReady). Nunca
//      espera más de READY_DEADLINE desde que se pidió la página: con una red
//      lenta la entrada no se queda colgada.
//   2. Empieza la entrada (startIntro): la cortina sube y, a la vez, el vídeo
//      arranca desde su primer fotograma (oscuro, del color de la página: el
//      árbol crece) y los textos aparecen con sus retrasos.
//
// Sin cortina (ya salió en esta sesión o movimiento reducido) la entrada
// empieza en cuanto hay JavaScript. Las piezas se enteran por un atributo en
// <html> y un evento, así da igual quién monte antes.

const READY = "aterna:hero-ready";
const INTRO = "aterna:intro";

/** Como mucho, la cortina espera al vídeo hasta este momento (ms desde la petición). */
export const READY_DEADLINE = 3000;

const root = () => document.documentElement;

/** El vídeo del hero puede arrancar (o no va a poder: error o sin vídeo). */
export function heroReady() {
  if (root().dataset.hero === "ready") return;
  root().dataset.hero = "ready";
  window.dispatchEvent(new Event(READY));
}

/** `cb` cuando el hero esté listo o, como tarde, en READY_DEADLINE. Devuelve cómo cancelarlo. */
export function whenHeroReady(cb: () => void) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    window.removeEventListener(READY, run);
    window.clearTimeout(timer);
    cb();
  };
  const timer = window.setTimeout(run, Math.max(0, READY_DEADLINE - performance.now()));
  if (root().dataset.hero === "ready") run();
  else window.addEventListener(READY, run);
  return () => {
    done = true;
    window.removeEventListener(READY, run);
    window.clearTimeout(timer);
  };
}

/** Empieza la entrada: la cortina sube, el vídeo arranca, salen los textos. */
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
