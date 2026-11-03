// El vidrio de las tarjetas: no es backdrop-filter. Cada lienzo
// canvas[data-blur] es una copia desenfocada del recorrido justo detrás de su
// padre, redibujada cada vez que cambia el recorrido. Así enseña solo la
// cueva de raíces (sin el velo de encima) y sigue funcionando dentro del
// contenedor que se funde. Se pinta a ¼ de resolución: desenfocado no se
// nota y con un lienzo de 3840 son 16 veces menos píxeles que desenfocar.

const REDUCE = 4;

export function drawGlass(stage: HTMLElement, cave: HTMLCanvasElement) {
  const src = cave.getBoundingClientRect();
  if (!src.width || !src.height) return;
  const scale = cave.width / src.width; // px del dispositivo por px CSS
  for (const canvas of stage.querySelectorAll<HTMLCanvasElement>("canvas[data-blur]")) {
    const host = canvas.parentElement;
    if (!host) continue;
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(host).visibility === "hidden") continue;
    const blur = Number(canvas.dataset.blur);
    const pad = blur * 2; // pasa del borde: los cantos se desenfocan con lo que hay alrededor
    const cssW = r.width + pad * 2;
    const cssH = r.height + pad * 2;
    const w = Math.max(1, Math.round((cssW * scale) / REDUCE));
    const h = Math.max(1, Math.round((cssH * scale) / REDUCE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    Object.assign(canvas.style, { left: `${-pad}px`, top: `${-pad}px`, width: `${cssW}px`, height: `${cssH}px` });
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.filter = `blur(${(blur * scale) / REDUCE}px)`;
    const sx = (r.left - src.left - pad) * scale;
    const sy = (r.top - src.top - pad) * scale;
    ctx.drawImage(cave, sx, sy, cssW * scale, cssH * scale, 0, 0, w, h);
    ctx.filter = "none";
  }
}
