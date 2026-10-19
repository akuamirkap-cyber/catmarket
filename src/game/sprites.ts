// ---------------------------------------------------------------
//  Offscreen caches: small sprites + big static layers.
//  Drawing a cached bitmap is far cheaper than re-tracing paths every frame.
// ---------------------------------------------------------------
let RES = 2;
const cache = new Map<string, HTMLCanvasElement>();

export const getSpriteRes = () => RES;

/** Returns true when the resolution changed (caches were flushed). */
export function setSpriteRes(r: number): boolean {
  const q = Math.max(1, Math.min(2.5, Math.ceil(r * 4) / 4));
  if (q === RES) return false;
  RES = q;
  cache.clear();
  return true;
}

/** Sprite centred on (0,0) in `draw`, logical size w x h. */
export function sprite(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  let s = cache.get(key);
  if (s) return s;
  s = document.createElement('canvas');
  s.width = Math.ceil(w * RES);
  s.height = Math.ceil(h * RES);
  const c = s.getContext('2d')!;
  c.scale(RES, RES);
  c.translate(w / 2, h / 2);
  draw(c);
  cache.set(key, s);
  return s;
}

export interface View { x0: number; y0: number; x1: number; y1: number }

/** A rectangular piece of the world painted once into a bitmap. */
export class Layer {
  cv: HTMLCanvasElement | null = null;
  constructor(public x: number, public y: number, public w: number, public h: number) {}

  build(res: number, paint: (c: CanvasRenderingContext2D) => void) {
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(this.w * res);
    cv.height = Math.ceil(this.h * res);
    const c = cv.getContext('2d')!;
    c.setTransform(res, 0, 0, res, -this.x * res, -this.y * res);
    paint(c);
    this.cv = cv;
  }

  visible(V: View, pad = 0) {
    return !(this.x - pad > V.x1 || this.x + this.w + pad < V.x0 || this.y - pad > V.y1 || this.y + this.h + pad < V.y0);
  }

  draw(ctx: CanvasRenderingContext2D, V: View) {
    if (!this.cv || !this.visible(V)) return;
    ctx.drawImage(this.cv, this.x, this.y, this.w, this.h);
  }
}
