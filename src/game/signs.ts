// ---------------------------------------------------------------
//  One shared "shop sign" painter: text is always fitted, icons never overlap the text
// ---------------------------------------------------------------
import { sprite } from './sprites';

const PI2 = Math.PI * 2;
export const SIGN_OUT = '#58244a';

export type IconFn = (c: CanvasRenderingContext2D, x: number, y: number) => void;

export interface SignOpt {
  w: number;
  h: number;
  c1: string; // inner panel (top)
  c2: string; // inner panel (bottom)
  rim?: string; // wooden frame colour
  textFill?: string;
  textStroke?: string;
  icon?: IconFn;
  iconR?: IconFn;
  sub?: string; // small second line under the title
  posts?: number; // length of the two posts below the board (0 = none)
  stakes?: boolean; // little pointed stakes (for signs stuck in the sand)
}

/** Biggest font size (<= size0) at which every line fits in maxW. */
export function fitFont(c: CanvasRenderingContext2D, lines: string[], maxW: number, size0: number, minSize = 9, weight = 900): number {
  let size = size0;
  for (; size > minSize; size -= 0.5) {
    c.font = `${weight} ${size}px system-ui, sans-serif`;
    let ok = true;
    for (const l of lines) if (c.measureText(l).width > maxW) { ok = false; break; }
    if (ok) return size;
  }
  return minSize;
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

/** Paints a sign whose board centre is (cx, cy). */
export function paintSign(c: CanvasRenderingContext2D, cx: number, cy: number, text: string, o: SignOpt) {
  const { w, h } = o;
  const x = cx - w / 2, y = cy - h / 2;
  const rim = o.rim ?? '#a86a32';
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  // posts / stakes behind the board
  if (o.posts && o.posts > 0) {
    for (const sx of [cx - w / 2 + 22, cx + w / 2 - 22]) {
      c.globalAlpha = 0.2; c.fillStyle = '#3a2a10';
      c.beginPath(); c.ellipse(sx + 3, y + h + o.posts - 1, 11, 4, 0, 0, PI2); c.fill(); c.globalAlpha = 1;
      rr(c, sx - 5, y + h - 8, 10, o.posts + 8, 3);
      c.fillStyle = '#9a6a38'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = SIGN_OUT; c.stroke();
      c.fillStyle = 'rgba(255,230,180,.4)'; c.fillRect(sx - 3.4, y + h - 4, 2, o.posts);
    }
  }
  if (o.stakes) {
    for (const sx of [cx - w / 2 + 24, cx + w / 2 - 24]) {
      c.beginPath(); c.moveTo(sx - 4.4, y + h - 4); c.lineTo(sx + 4.4, y + h - 4); c.lineTo(sx, y + h + 16); c.closePath();
      c.fillStyle = '#9a6a38'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = SIGN_OUT; c.stroke();
    }
  }
  // soft shadow
  c.globalAlpha = 0.2; c.fillStyle = '#3a2a10';
  rr(c, x + 3, y + 5, w, h, h * 0.3); c.fill(); c.globalAlpha = 1;
  // wooden frame
  rr(c, x, y, w, h, h * 0.3);
  c.fillStyle = rim; c.fill();
  c.lineWidth = 3.4; c.strokeStyle = SIGN_OUT; c.stroke();
  c.fillStyle = 'rgba(255,235,190,.35)';
  rr(c, x + 3, y + 2.4, w - 6, 3, 1.5); c.fill();
  // inner panel
  const pad = Math.max(5, h * 0.12);
  const g = c.createLinearGradient(0, y + pad, 0, y + h - pad);
  g.addColorStop(0, o.c1); g.addColorStop(1, o.c2);
  rr(c, x + pad, y + pad, w - pad * 2, h - pad * 2, Math.max(4, h * 0.22));
  c.fillStyle = g; c.fill();
  c.lineWidth = 2; c.strokeStyle = 'rgba(88,36,74,.55)'; c.stroke();
  // gloss
  c.save();
  rr(c, x + pad, y + pad, w - pad * 2, h - pad * 2, Math.max(4, h * 0.22)); c.clip();
  c.fillStyle = 'rgba(255,255,255,.26)';
  c.fillRect(x + pad, y + pad, w - pad * 2, (h - pad * 2) * 0.38);
  c.restore();
  // rivets
  c.fillStyle = '#ffe6a0';
  for (const [rx, ry] of [[x + 7, y + 7], [x + w - 7, y + 7], [x + 7, y + h - 7], [x + w - 7, y + h - 7]]) {
    c.beginPath(); c.arc(rx, ry, 1.9, 0, PI2); c.fill(); c.lineWidth = 1; c.strokeStyle = SIGN_OUT; c.stroke();
  }
  // icons
  const iconW = Math.min(h * 0.95, 46);
  if (o.icon) o.icon(c, x + pad + iconW / 2 + 4, cy);
  if (o.iconR) o.iconR(c, x + w - pad - iconW / 2 - 4, cy);
  // text (always fitted into the free space between the icons)
  const left = x + pad + (o.icon ? iconW + 8 : 10), right = x + w - pad - (o.iconR ? iconW + 8 : 10);
  const maxW = Math.max(20, right - left - 12);
  const tx = (left + right) / 2;
  const lines = text.split('\n');
  const size0 = (o.sub ? h * 0.4 : lines.length > 1 ? h * 0.3 : h * 0.46);
  const size = fitFont(c, lines, maxW, size0, 8.5);
  c.textAlign = 'center';
  c.font = `900 ${size}px system-ui, sans-serif`;
  const total = lines.length * size * 1.08 + (o.sub ? size * 0.62 : 0);
  let ty = cy - total / 2 + size * 0.86;
  for (const l of lines) {
    c.lineWidth = Math.max(2.4, size * 0.2); c.strokeStyle = o.textStroke ?? SIGN_OUT; c.strokeText(l, tx, ty);
    c.fillStyle = o.textFill ?? '#ffffff'; c.fillText(l, tx, ty);
    ty += size * 1.08;
  }
  if (o.sub) {
    const s2 = fitFont(c, [o.sub], maxW, size * 0.62, 7.5);
    c.font = `800 ${s2}px system-ui, sans-serif`;
    c.fillStyle = 'rgba(255,255,255,.92)';
    c.fillText(o.sub, tx, ty - size * 0.1);
  }
  c.restore();
}

/** Same sign, painted once into a bitmap and then stamped (for dynamic scenes). */
export function drawSignCached(ctx: CanvasRenderingContext2D, key: string, cx: number, cy: number, text: string, o: SignOpt) {
  const P = (o.posts ?? 0) + (o.stakes ? 18 : 0);
  const W = Math.ceil(o.w + 24), H = Math.ceil(o.h + P + 28);
  const spr = sprite('sign_' + key, W, H, (c) => paintSign(c, 0, -P / 2, text, o));
  ctx.drawImage(spr, cx - W / 2, cy + P / 2 - H / 2, W, H);
}
