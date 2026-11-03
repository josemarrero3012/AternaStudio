// Sin paralaje (móvil, movimiento reducido, sin WebGL2 o sin AVIF): el
// fotograma plano, con la viñeta ya horneada, a pantalla completa en «cover»
// con el canvas 2D. La versión HD se funde sobre la ligera del mismo
// fotograma.

import { HD_FADE_MS } from "./config";
import { sizeCanvas } from "./gl";
import type { FrameRenderer } from "./layeredRenderer";
import type { Shown } from "./sequence";

export class FlatRenderer implements FrameRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly kind = "flat" as const;
  private ctx: CanvasRenderingContext2D;
  private cur: { index: number; level: number; bitmap: ImageBitmap } | null = null;
  private prev: ImageBitmap | null = null;
  private fadeStart = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Sin canvas 2D");
    this.ctx = ctx;
  }

  setPlan() {}

  resize() {
    return sizeCanvas(this.canvas);
  }

  private cover(bm: ImageBitmap, alpha: number) {
    if (!bm.width) return; // liberado con close()
    const { width: w, height: h } = this.canvas;
    const view = w / h;
    const img = bm.width / bm.height;
    const sw = view > img ? bm.width : bm.height * view;
    const sh = view > img ? bm.width / view : bm.height;
    this.ctx.globalAlpha = alpha;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.drawImage(bm, (bm.width - sw) / 2, (bm.height - sh) / 2, sw, sh, 0, 0, w, h);
  }

  draw(shown: Shown, _pointer: { x: number; y: number }, _amp: number, now: number) {
    const bitmap = shown.bitmaps[0];
    const cur = this.cur;
    if (cur && cur.index === shown.index && cur.level < shown.level) {
      this.prev = cur.bitmap;
      this.fadeStart = now;
    } else if (!cur || cur.index !== shown.index) {
      this.prev = null;
    }
    this.cur = { index: shown.index, level: shown.level, bitmap };
    const t = this.prev ? Math.min(1, (now - this.fadeStart) / HD_FADE_MS) : 1;
    if (this.prev && t < 1) this.cover(this.prev, 1);
    else this.prev = null;
    this.cover(bitmap, t);
    this.ctx.globalAlpha = 1;
    return !!this.prev;
  }

  stats() {
    return { textureBytes: 0 };
  }

  dispose() {
    this.cur = null;
    this.prev = null;
  }
}
