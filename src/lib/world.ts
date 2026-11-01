// El «mundo» 3D de la portada (Modo Premium): estado compartido entre el
// canvas (components/World.tsx), el hero y el CSS. No importa Three.js: la
// escena se descarga aparte, solo cuando hace falta (ver src/world/).
//
//   try  El equipo puede con él: el hero no carga el vídeo y espera al 3D.
//   on   La escena ya pinta: el canvas está a la vista y las secciones del
//        recorrido (hero, estudio y método) dejan ver el fondo 3D.
//   off  No hay 3D (falló, va lento o se pidió ?3d=0): el hero vuelve a ser
//        el de siempre, con el vídeo.
//
// Sin el atributo, la web es la de siempre desde el principio: móviles,
// tabletas, movimiento reducido, ahorro de datos o equipos modestos.

export type WorldState = "try" | "on" | "off";

/** Pantallas que pueden llevar el 3D: escritorio, con ratón. */
export const WORLD_MEDIA = "(min-width: 1024px) and (pointer: fine)";

const EVENT = "aterna:world";

/**
 * En línea al principio del <body>, después de CURTAIN_SCRIPT (que pone
 * data-motion): decide antes de pintar si se intenta el 3D, para que el hero
 * no enseñe ni descargue el vídeo. ?3d=1 lo fuerza (pruebas) y ?3d=0 lo
 * quita (comparar con la web de siempre).
 */
export const WORLD_SCRIPT = `try{var d=document.documentElement,q=location.search,n=navigator,c=n.connection;if(/[?&]3d=1/.test(q)){d.dataset.world="try";d.dataset.worldForce="1"}else if(!/[?&]3d=0/.test(q)&&d.dataset.motion==="on"&&matchMedia("${WORLD_MEDIA}").matches&&!(c&&c.saveData)&&!(n.deviceMemory<4)&&!(n.hardwareConcurrency<4))d.dataset.world="try"}catch(e){}`;

const root = () => document.documentElement;

export function worldState(): WorldState | undefined {
  const s = root().dataset.world;
  return s === "try" || s === "on" || s === "off" ? s : undefined;
}

/** Se está intentando o ya se ve: el hero no necesita su vídeo. */
export function worldActive() {
  const s = worldState();
  return s === "try" || s === "on";
}

/** ?3d=1: se enseña aunque el equipo vaya lento (para pruebas y capturas). */
export function worldForced() {
  return root().dataset.worldForce === "1";
}

export function setWorldState(state: WorldState) {
  if (root().dataset.world === state) return;
  root().dataset.world = state;
  window.dispatchEvent(new CustomEvent<WorldState>(EVENT, { detail: state }));
}

/** `cb` con cada cambio de estado. Devuelve cómo dejar de escuchar. */
export function onWorldState(cb: (state: WorldState) => void) {
  const run = (e: Event) => cb((e as CustomEvent<WorldState>).detail);
  window.addEventListener(EVENT, run);
  return () => window.removeEventListener(EVENT, run);
}

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;

/**
 * ¿Hay WebGL 2 con una tarjeta gráfica de verdad? Se mira con un canvas de
 * prueba antes de descargar Three.js, para no bajarlo en balde donde el
 * navegador pinta por software (sin aceleración, o en equipos virtuales).
 * Con ?3d=1 basta con que haya WebGL 2.
 */
export function gpuUsable(forced: boolean) {
  try {
    const gl = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: !forced });
    if (!gl) return false;
    // Chrome enmascara RENDERER ("WebKit WebGL") y da el nombre real con la
    // extensión; Firefox y Safari lo dan directamente (y Firefox avisa si se
    // pide la extensión, ya obsoleta allí).
    let gpu = String(gl.getParameter(gl.RENDERER));
    if (/^webkit webgl$/i.test(gpu)) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      if (info) gpu = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return forced || !SOFTWARE.test(gpu);
  } catch {
    return false;
  }
}
