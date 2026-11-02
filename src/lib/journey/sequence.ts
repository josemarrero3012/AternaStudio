// Carga de los fotogramas: cada uno es su imagen de color y su mapa de
// profundidad, cargados juntos. Orden: el 0; cuando está, del 1 al 8 a la
// vez; cuando terminan, de cuatro en cuatro con 20 ms entre tandas. El
// fotograma que pide el scroll se adelanta a la cola. Un fotograma que falla
// se avisa una vez y no se reintenta (lo sustituye su vecino).
//
// Hay una sola secuencia por página y guarda lo cargado mientras viva la
// página: al volver a la portada sin recargar, ya está todo.

import { FRAME_COUNT, colorUrl, depthUrl } from "./config";

export type Frame = { color: HTMLImageElement; depth: HTMLImageElement };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // Van a WebGL. Mismo origen, pero así coinciden con las precargas
    // (crossorigin) y nunca acaban «manchando» el lienzo.
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      // Decodificado antes de subirlo a la GPU: sin tirones al hacer scroll.
      if (typeof img.decode === "function") img.decode().then(() => resolve(img), () => resolve(img));
      else resolve(img);
    };
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

type State = "idle" | "loading" | "ok" | "failed";

export class Sequence {
  frames: (Frame | null)[] = new Array(FRAME_COUNT).fill(null);
  state: State[] = new Array(FRAME_COUNT).fill("idle");
  /** Sube cada vez que llega un fotograma (para saber si hay que redibujar). */
  version = 0;
  private running = false;
  /** Hay una cadena de tandas en marcha (en vuelo o esperando los 20 ms). */
  private chain = false;
  private inFlight = false;
  private next = 1;
  private timer = 0;
  private listeners = new Set<() => void>();
  private first: Promise<boolean> | null = null;

  /** Resuelve true cuando el fotograma 0 está (false si falló). */
  start() {
    this.running = true;
    if (!this.first) {
      this.first = this.load(0).then((ok) => {
        this.pump(8);
        return ok;
      });
    } else if (this.state[0] !== "loading" && !this.chain) {
      this.pump(this.next === 1 ? 8 : 4);
    }
    return this.first;
  }

  /** Deja de lanzar tandas nuevas (las que están en vuelo terminan). */
  stop() {
    this.running = false;
    window.clearTimeout(this.timer);
    if (!this.inFlight) this.chain = false;
  }

  onLoad(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** El scroll quiere este fotograma: si no se ha pedido, ya. */
  request(i: number) {
    if (this.state[i] === "idle") void this.load(i);
  }

  /** El fotograma cargado más cercano: i, i − 1, i + 1, i − 2… */
  nearest(i: number) {
    for (let d = 0; d < FRAME_COUNT; d++) {
      const a = i - d;
      if (a >= 0 && this.frames[a]) return a;
      const b = i + d;
      if (d && b < FRAME_COUNT && this.frames[b]) return b;
    }
    return -1;
  }

  private async load(i: number) {
    this.state[i] = "loading";
    try {
      const [color, depth] = await Promise.all([loadImage(colorUrl(i)), loadImage(depthUrl(i))]);
      this.frames[i] = { color, depth };
      this.state[i] = "ok";
      this.version++;
      this.listeners.forEach((cb) => cb());
      return true;
    } catch (err) {
      this.state[i] = "failed";
      console.warn(`[recorrido] fotograma ${i}:`, err);
      return false;
    }
  }

  private pump(size: number) {
    const batch: number[] = [];
    while (this.running && this.next < FRAME_COUNT && batch.length < size) {
      if (this.state[this.next] === "idle") batch.push(this.next);
      this.next++;
    }
    if (!batch.length) {
      this.chain = false;
      return;
    }
    this.chain = true;
    this.inFlight = true;
    void Promise.allSettled(batch.map((i) => this.load(i))).then(() => {
      this.inFlight = false;
      if (!this.running) {
        this.chain = false;
        return;
      }
      this.timer = window.setTimeout(() => this.pump(4), 20);
    });
  }
}

let shared: Sequence | null = null;
export function getSequence() {
  if (!shared) shared = new Sequence();
  return shared;
}
