// ---------------------------------------------------------------
//  Crab / seaweed / ice-cream / shopping bag / mood emoji / bubbles + layout of the new stalls
// ---------------------------------------------------------------
import { drawFish, drawMango, drawSushi, registerItem } from './fish';
import { sprite } from './sprites';
import { drawKelpItem, drawKelpPlant } from './kelp';
import { drawSignCached, paintSign } from './signs';

const PI = Math.PI;
const PI2 = Math.PI * 2;
const OUT = '#58244a';
export type R = { x: number; y: number; w: number; h: number };

// ---------------- layout
/** shallow water you can wade through (seaweed farm) - overlaps the beach so the way in is continuous */
export const FARM_BOX: R = { x: 222, y: 592, w: 200, h: 196 };
export const FARM_PLOTS: R[] = [0, 1, 2].map((i) => ({ x: 236, y: 604 + i * 58, w: 108, h: 46 }));
/** crab pond: enlarged to full 150x150 size (matching fish pond POND 150x150!) */
export const PEN: R = { x: 370, y: 600, w: 150, h: 150 };
export const PEN_ZONE: R = { x: 360, y: 752, w: 170, h: 64 };
export const COOK = { x: 1345, y: 250, w: 225, h: 100, H: 30, cap: 18 };
export const COOK_ZONE: R = { x: 1348, y: 352, w: 96, h: 66 };
export const COOK_POT = { x: COOK.x + 44, y: COOK.y - COOK.H + 52 };
export const CRABQ = [{ x: 1535, y: 398 }, { x: 1535, y: 444 }];
export const ICE = { x: 1585, y: 250, w: 150, h: 100 };
export const ICEQ = [{ x: 1660, y: 398 }, { x: 1660, y: 444 }];
export const VENDOR_POS = { x: 1660, y: 292 };

export const crabSlot = (i: number) => ({ x: COOK.x + 98 + (i % 6) * 21, y: COOK.y - COOK.H + 29 + Math.floor(i / 6) * 20 });

// ---------------- shared bits
function ell(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, lw = 1.6) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, PI2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
}

// ---------------- crab
function paintCrab(c: CanvasRenderingContext2D, cooked: boolean, ph: number) {
  const body = cooked ? '#ff3b30' : '#5f8bc6';
  const dark = cooked ? '#a8120c' : '#2c4a7e';
  const light = cooked ? '#ff9b8e' : '#a8c9ee';
  c.lineJoin = 'round';
  c.lineCap = 'round';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y0 = 3 + i * 3.4, w = Math.sin(ph + i * 1.9 + (s > 0 ? 1.3 : 0)) * 1.4;
      c.beginPath();
      c.moveTo(s * 10, y0); c.lineTo(s * (17 + i * 1.5), y0 + 1.5 + w); c.lineTo(s * (19.5 + i * 1.5), y0 + 8 + i * 0.4);
      c.strokeStyle = dark; c.lineWidth = 4; c.stroke();
      c.strokeStyle = body; c.lineWidth = 2; c.stroke();
    }
  }
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(s * 10, -3); c.lineTo(s * 17, -10);
    c.strokeStyle = dark; c.lineWidth = 5.6; c.stroke();
    c.strokeStyle = body; c.lineWidth = 3.2; c.stroke();
    c.save();
    c.translate(s * 19.5, -15);
    c.rotate(s * 0.35);
    const parts: [number, number, number, number][] = [[-2.3, -1.6, 3.8, 6], [2.3, -1.6, 3.8, 6], [0, 1.4, 5.8, 4.8]];
    c.strokeStyle = dark; c.lineWidth = 4;
    for (const [x, y, rx, ry] of parts) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, PI2); c.stroke(); }
    c.fillStyle = body;
    for (const [x, y, rx, ry] of parts) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, PI2); c.fill(); }
    c.strokeStyle = dark; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(0, -3.6); c.lineTo(0, -8.4); c.stroke();
    c.restore();
  }
  // body
  const g = c.createRadialGradient(-4, -5, 2, 0, 0, 15);
  g.addColorStop(0, light); g.addColorStop(0.5, body); g.addColorStop(1, cooked ? '#d4201a' : '#3f68a8');
  c.beginPath(); c.ellipse(0, 0, 14.5, 10.8, 0, 0, PI2);
  c.fillStyle = g; c.fill();
  c.lineWidth = 2.6; c.strokeStyle = dark; c.stroke();
  c.fillStyle = cooked ? 'rgba(255,214,200,.55)' : 'rgba(215,235,255,.5)';
  for (const [x, y] of [[-7, 2], [6, 3.4], [0, 5.6]]) { c.beginPath(); c.arc(x, y, 1.4, 0, PI2); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.55)';
  c.beginPath(); c.ellipse(-6, -5, 4.4, 2, -0.5, 0, PI2); c.fill();
  // eyes on stalks
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(s * 4.2, -8.5); c.lineTo(s * 4.7, -12.4);
    c.strokeStyle = dark; c.lineWidth = 2; c.stroke();
    if (cooked) {
      c.beginPath(); c.arc(s * 4.9, -13.2, 3.1, PI * 1.08, PI * 1.92);
      c.strokeStyle = '#3a0a06'; c.lineWidth = 1.9; c.stroke();
    } else {
      ell(c, s * 4.9, -14, 3.5, 3.6, '#fff', dark, 1.4);
      ell(c, s * 5.2, -13.6, 1.7, 1.9, '#2a1420');
    }
  }
  c.beginPath(); c.arc(0, 3, 3.2, PI * 0.15, PI * 0.85);
  c.strokeStyle = dark; c.lineWidth = 1.6; c.stroke();
}

/** One crab size for everything: grown in the pond, carried, cooking, cooked, in a bag. */
export const CRAB_S = 0.9;

export function drawCrabSprite(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, cooked: boolean, t = 0, rot = 0, flip = 1) {
  const fr = Math.floor((((t * 9) % PI2) / PI2 + 1) % 1 * 6) % 6;
  const spr = sprite('crab2' + (cooked ? 'C' : 'R') + fr, 68, 56, (c) => { c.translate(0, 2); paintCrab(c, cooked, (fr / 6) * PI2); });
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(flip * s, s);
  ctx.drawImage(spr, -34, -28, 68, 56);
  ctx.restore();
}

// ---------------- seaweed (kelp ribbons, see kelp.ts)
export function drawSeaweedItem(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot = 0) {
  drawKelpItem(ctx, x, y, s, rot);
}

// ---------------- ice cream
function paintCone(c: CanvasRenderingContext2D, flavor: number) {
  const sc = ['#ff8fb8', '#7fe6c8', '#c98f5a'][flavor % 3], sc2 = ['#ffc0d8', '#b6f5e2', '#e8c294'][flavor % 3];
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-9.5, 3); c.lineTo(9.5, 3); c.lineTo(0, 27); c.closePath();
  c.fillStyle = '#f2bc6c'; c.fill();
  c.save(); c.clip();
  c.strokeStyle = 'rgba(150,88,28,.6)'; c.lineWidth = 1.3;
  for (let k = -14; k <= 14; k += 6) { c.beginPath(); c.moveTo(k, 2); c.lineTo(k + 15, 30); c.stroke(); c.beginPath(); c.moveTo(k + 15, 2); c.lineTo(k, 30); c.stroke(); }
  c.restore();
  c.beginPath(); c.moveTo(-9.5, 3); c.lineTo(9.5, 3); c.lineTo(0, 27); c.closePath();
  c.lineWidth = 2.2; c.strokeStyle = OUT; c.stroke();
  // scoops
  const scoop = (x: number, y: number, r: number, col: string) => {
    c.beginPath(); c.arc(x, y, r, PI, 0);
    c.lineTo(x + r, y + 4);
    for (let k = 3; k >= -3; k--) c.quadraticCurveTo(x + k * (r / 3) + r / 6, y + 8.5 - (k % 2 ? 1 : 0), x + (k - 1) * (r / 3) + r / 3 - r / 3, y + 4);
    c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = 2.2; c.strokeStyle = OUT; c.stroke();
  };
  scoop(0, -2, 11.2, sc);
  scoop(0, -13, 8, sc2);
  c.fillStyle = '#ff3b4d';
  c.beginPath(); c.arc(0, -25, 3.6, 0, PI2); c.fill(); c.lineWidth = 1.8; c.strokeStyle = OUT; c.stroke();
  c.strokeStyle = '#2d7a3a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -28); c.quadraticCurveTo(3, -32, 6, -31); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.6)';
  c.beginPath(); c.ellipse(-4.8, -5, 2.6, 1.6, -0.6, 0, PI2); c.fill();
  c.beginPath(); c.ellipse(-3, -15, 2, 1.2, -0.6, 0, PI2); c.fill();
}

export function drawCone(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, flavor = 0, rot = 0) {
  const spr = sprite('cone' + (flavor % 3), 50, 70, (c) => { c.translate(0, 2); paintCone(c, flavor); });
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.drawImage(spr, -25, -35, 50, 70);
  ctx.restore();
}

// ---------------- mood emoji
function paintEmoji(c: CanvasRenderingContext2D, kind: string) {
  const R0 = 13, brown = '#6b3f12';
  const g = c.createRadialGradient(-3, -4, 2, 0, 0, R0);
  g.addColorStop(0, '#ffeb94'); g.addColorStop(1, '#ffbf28');
  c.beginPath(); c.arc(0, 0, R0, 0, PI2);
  c.fillStyle = g; c.fill(); c.lineWidth = 2; c.strokeStyle = '#a8741a'; c.stroke();
  c.lineCap = 'round'; c.lineJoin = 'round';
  const mouth = (path: () => void) => { path(); c.fillStyle = '#7a2a1a'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = brown; c.stroke(); };
  if (kind === 'happy') {
    c.strokeStyle = brown; c.lineWidth = 2.3;
    for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 5.2, -2.2, 3, PI * 1.1, PI * 1.9); c.stroke(); }
    mouth(() => { c.beginPath(); c.moveTo(-7.4, 2); c.quadraticCurveTo(0, 14, 7.4, 2); c.closePath(); });
    c.save();
    c.beginPath(); c.moveTo(-7.4, 2); c.quadraticCurveTo(0, 14, 7.4, 2); c.closePath(); c.clip();
    ell(c, 0, 9.6, 4.2, 3, '#ff7a8a');
    c.fillStyle = '#fff'; c.fillRect(-7, 1.6, 14, 2.6);
    c.restore();
    c.fillStyle = 'rgba(255,110,130,.45)';
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 9.4, 3.2, 2.6, 1.7, 0, 0, PI2); c.fill(); }
  } else if (kind === 'sleepy') {
    c.strokeStyle = brown; c.lineWidth = 2.3;
    for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 5.2, -2.6, 3.1, PI * 0.12, PI * 0.88); c.stroke(); }
    ell(c, 0, 6.4, 2.3, 3, '#7a2a1a', brown, 1.4);
    c.fillStyle = '#4a78d6'; c.textAlign = 'center';
    c.font = '900 10px system-ui, sans-serif'; c.fillText('z', 13, -7);
    c.font = '900 7px system-ui, sans-serif'; c.fillText('z', 18, -13);
    ell(c, 9, 7.6, 3.4, 3, 'rgba(180,225,255,.9)', '#6aa8e6', 1);
  } else if (kind === 'sad') {
    c.strokeStyle = brown; c.lineWidth = 1.9;
    for (const s of [-1, 1]) { ell(c, s * 5.2, -0.6, 1.9, 2.5, brown); c.beginPath(); c.moveTo(s * 3, -8.6); c.lineTo(s * 8.4, -6); c.stroke(); }
    c.lineWidth = 2.3; c.beginPath(); c.arc(0, 12, 5.2, PI * 1.15, PI * 1.85); c.stroke();
    c.fillStyle = '#6cc4ff';
    c.beginPath(); c.moveTo(-8.8, 2); c.quadraticCurveTo(-12, 7.4, -8.8, 9.8); c.quadraticCurveTo(-5.6, 7.4, -8.8, 2); c.fill();
    c.lineWidth = 1; c.strokeStyle = '#2b86d6'; c.stroke();
  } else {
    for (const s of [-1, 1]) { ell(c, s * 5.2, -3, 2.5, 3.1, brown); ell(c, s * 4.5, -4, 0.9, 0.9, '#fff'); }
    mouth(() => { c.beginPath(); c.moveTo(-6.6, 3.4); c.quadraticCurveTo(0, 12.5, 6.6, 3.4); c.closePath(); });
    ell(c, 2.4, 9, 3.4, 2.6, '#ff7a8a', brown, 1);
    c.fillStyle = '#8fd8ff';
    c.beginPath(); c.moveTo(5.4, 9.8); c.quadraticCurveTo(2.6, 16, 5.4, 19); c.quadraticCurveTo(8.2, 16, 5.4, 9.8); c.fill();
    c.lineWidth = 1; c.strokeStyle = '#2b86d6'; c.stroke();
  }
}

export type Mood = 'happy' | 'sleepy' | 'sad' | 'drool';
export function drawEmoji(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, kind: Mood) {
  const spr = sprite('emo_' + kind, 48, 48, (c) => paintEmoji(c, kind));
  ctx.drawImage(spr, x - 24 * s, y - 24 * s, 48 * s, 48 * s);
}

// ---------------- cash register icon (for the "I want to pay" bubble)
export function drawRegister(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const spr = sprite('registerIc', 52, 46, (c) => {
    c.lineJoin = 'round';
    c.beginPath(); c.roundRect(-18, -4, 36, 17, 4); c.fillStyle = '#556070'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = '#2c3340'; c.stroke();
    c.beginPath(); c.roundRect(-13, -19, 26, 17, 4); c.fillStyle = '#7ee6a0'; c.fill(); c.strokeStyle = '#2c3340'; c.stroke();
    c.fillStyle = '#1d6b3a'; c.font = '900 13px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('$', 0, -6);
    c.fillStyle = '#c4ccd8';
    for (let i = 0; i < 4; i++) c.fillRect(-14 + i * 7.6, 3, 5.6, 5);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(-11, -17, 9, 2.4);
  });
  ctx.drawImage(spr, x - 26 * s, y - 23 * s, 52 * s, 46 * s);
}

/** Speech bubble in the reference style: cream fill + thick green outline + little tail pointing down. */
export function bubbleShell(ctx: CanvasRenderingContext2D, w: number, h: number, col = '#43c06c', tail = true) {
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(h * 0.38, 16));
  ctx.fillStyle = '#fffdf3'; ctx.fill();
  ctx.lineWidth = 3.6; ctx.strokeStyle = col; ctx.stroke();
  if (tail) {
    ctx.beginPath(); ctx.moveTo(-7, h / 2 - 1); ctx.lineTo(0, h / 2 + 9); ctx.lineTo(7, h / 2 - 1);
    ctx.strokeStyle = col; ctx.lineWidth = 3.6; ctx.stroke();
    ctx.fillStyle = '#fffdf3'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-5.4, h / 2 - 3); ctx.lineTo(5.4, h / 2 - 3); ctx.strokeStyle = '#fffdf3'; ctx.lineWidth = 4; ctx.stroke();
  }
}

// ---------------- shopping bag (plastic) with what the cat bought
export interface BagItem { kind: string; type: number }

export const PRODUCT_HOOKS: Record<string, (ctx: CanvasRenderingContext2D, it: BagItem, x: number, y: number, s: number, t: number) => void> = {};

export function product(ctx: CanvasRenderingContext2D, it: BagItem, x: number, y: number, s: number, t: number, outer = 1) {
  const hk = PRODUCT_HOOKS[it.kind];
  if (hk) { hk(ctx, it, x, y, s, t); return; }
  if (it.kind === 'fish') drawFish(ctx, x, y, it.type, s, -0.5, 1, t);
  else if (it.kind === 'sushi') drawSushi(ctx, x, y, s * 1.5, it.type);
  else if (it.kind === 'mango') drawMango(ctx, x, y, s * 1.1, 0.2, 1);
  else if (it.kind === 'crab') drawCrabSprite(ctx, x, y + 2, CRAB_S / outer, true, 0);
  else drawCone(ctx, x, y + 4, s * 0.62, it.type, 0.1);
}

/** (x, y) = where the handles are held. */
export function drawBag(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, items: BagItem[], swing: number, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(swing);
  ctx.scale(s, s);
  const n = Math.min(items.length, 3);
  // products first (they show through the translucent plastic and poke out of the top)
  for (let i = 0; i < n; i++) product(ctx, items[i], (i - (n - 1) / 2) * (items[i].kind === 'crab' ? 15 : 11), 7 + (i % 2) * 2, 0.5, t, s);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-10.5, 3.5); ctx.lineTo(10.5, 3.5); ctx.lineTo(12.5, 26);
    ctx.quadraticCurveTo(12.5, 29, 9.5, 29); ctx.lineTo(-9.5, 29); ctx.quadraticCurveTo(-12.5, 29, -12.5, 26);
    ctx.closePath();
  };
  body();
  ctx.fillStyle = 'rgba(255,255,255,.58)';
  ctx.fill();
  ctx.save();
  body(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-9, 6, 3, 24);
  ctx.fillStyle = 'rgba(255,150,190,.5)'; ctx.fillRect(-13, 22, 26, 3.4);
  ell(ctx, 0.5, 17, 3.6, 3, 'rgba(255,120,170,.8)');
  for (const dx of [-5, -1.7, 1.7, 5]) ell(ctx, dx + 0.5, 12.2, 1.3, 1.6, 'rgba(255,120,170,.8)');
  ctx.restore();
  body();
  ctx.lineWidth = 2.1; ctx.strokeStyle = OUT; ctx.lineJoin = 'round'; ctx.stroke();
  // handles
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-6.5, 4); ctx.quadraticCurveTo(-7, -10, 0, -10); ctx.quadraticCurveTo(7, -10, 6.5, 4);
  ctx.strokeStyle = OUT; ctx.lineWidth = 3.4; ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

// ---------------- item registry (carried by the player)
registerItem(5, (ctx, x, y, s, rot) => drawSeaweedItem(ctx, x, y, s * 0.95, rot));
registerItem(6, (ctx, x, y, _s, rot, dir) => drawCrabSprite(ctx, x, y, CRAB_S, false, 0, rot * 0.4, dir));
registerItem(7, (ctx, x, y, _s, rot, dir) => drawCrabSprite(ctx, x, y, CRAB_S, true, 0, rot * 0.4, dir));

// ---------------- farm / pen painters
export function drawFarmBed(ctx: CanvasRenderingContext2D, R0: R, state: string, t: number, idx: number) {
  ctx.save();
  ctx.beginPath(); ctx.roundRect(R0.x, R0.y, R0.w, R0.h, 12);
  ctx.fillStyle = 'rgba(200,255,245,.34)'; ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(R0.x, R0.y, R0.w, R0.h, 12); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.6;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    for (let x = R0.x; x <= R0.x + R0.w; x += 8) {
      const y = R0.y + 12 + k * 14 + Math.sin(x * 0.12 + t * 2 + k + idx) * 2;
      if (x === R0.x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(R0.x, R0.y, R0.w, R0.h, 12);
  ctx.lineWidth = 9; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.lineWidth = 5; ctx.strokeStyle = '#c98b4b'; ctx.stroke();
  ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,230,180,.6)';
  ctx.beginPath(); ctx.roundRect(R0.x + 1.5, R0.y + 1.5, R0.w - 3, R0.h - 3, 11); ctx.stroke();
  for (const [x, y] of [[R0.x, R0.y], [R0.x + R0.w, R0.y], [R0.x, R0.y + R0.h], [R0.x + R0.w, R0.y + R0.h]]) {
    ell(ctx, x, y, 5.6, 5.6, '#8a5a2b', OUT, 2);
  }
  if (state === 'ripe') {
    const a = 0.5 + 0.5 * Math.sin(t * 5 + idx);
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * a})`;
    for (const [dx, dy] of [[18, 10], [R0.w - 20, 14], [R0.w / 2, 8]]) {
      ctx.beginPath(); ctx.arc(R0.x + dx, R0.y + dy + a * -2, 2 + a * 1.4, 0, PI2); ctx.fill();
    }
  }
  ctx.restore();
}

export function drawFarmPlants(ctx: CanvasRenderingContext2D, R0: R, state: string, g: number, t: number, pop: number, idx: number) {
  const cols = 5;
  for (let i = 0; i < cols; i++) {
    const px = R0.x + 14 + (i * (R0.w - 28)) / (cols - 1), py = R0.y + R0.h - 9 - (i % 2) * 4;
    if (state === 'empty') {
      ell(ctx, px, py + 1, 3.6, 1.8, 'rgba(120,90,40,.45)');
      ell(ctx, px, py - 1.5, 1.6, 1.6, 'rgba(255,255,255,.65)');
    } else {
      drawKelpPlant(ctx, px, py + 2, Math.min(1, g), t, i * 1.7 + idx, pop);
    }
  }
}

export interface PenCrab { x: number; y: number; dir: number; g: number; hop: number; eat: number; t: number; grow: number }

/** The crab pond: wooden rim + clear teal water, drawn like the fish pond. */
export function drawPenBack(ctx: CanvasRenderingContext2D, t: number) {
  const { x, y, w, h } = PEN;
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.2; ctx.fillStyle = '#2a1a05';
  ctx.beginPath(); ctx.roundRect(x - 4, y + 4, w + 14, h + 16, 26); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#7a4a20'; ctx.beginPath(); ctx.roundRect(x - 9, y - 9, w + 18, h + 24, 26); ctx.fill();
  ctx.fillStyle = '#c88a4a'; ctx.beginPath(); ctx.roundRect(x - 9, y - 9, w + 18, h + 14, 26); ctx.fill();
  ctx.fillStyle = '#ecb878'; ctx.beginPath(); ctx.roundRect(x - 5, y - 5, w + 10, h + 10, 22); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.clip();
  // Crystal-clear turquoise pool water (exact same vibrant water shader as the fish pond!)
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#7de8f2');
  g.addColorStop(1, '#2aa8de');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  // Sandy bottom patches with soft pebbles
  ctx.fillStyle = 'rgba(255,238,170,.4)';
  ctx.beginPath(); ctx.ellipse(x + 30, y + h - 16, 36, 14, 0, 0, PI2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + w - 26, y + 20, 24, 10, 0, 0, PI2); ctx.fill();
  ctx.fillStyle = '#9cb4cc'; ctx.strokeStyle = '#5f7590'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(x + w - 22, y + h - 20, 14, 8, -0.15, 0, PI2); ctx.fill(); ctx.stroke();

  // Moving animated wave highlights
  ctx.strokeStyle = 'rgba(255,255,255,.42)';
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    for (let xx = x; xx <= x + w; xx += 8) {
      const yy = y + 20 + i * 26 + Math.sin(xx * 0.07 + t * 1.8 + i) * 3;
      if (xx === x) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  ctx.beginPath(); ctx.roundRect(x + 8, y + 6, 10, h - 34, 5); ctx.fill();
  // little sign above the pond
  drawSignCached(ctx, 'penLabel', x + w / 2, y - 24, 'KOLAM\nKEPITING', { w: 116, h: 44, c1: '#ff8a5a', c2: '#e0522c', rim: '#a86a32' });
}

export function drawPenCrab(ctx: CanvasRenderingContext2D, c: PenCrab, t: number) {
  const sc = (CRAB_S * (0.46 + 0.54 * Math.min(1, c.g))) * (1 + c.eat * 0.12 * Math.sin(c.eat * 12));
  const bob = -Math.abs(Math.sin(t * 6 + c.x)) * 1.2 * (c.hop > 0 ? 1 : 0.15) - c.hop * 7;
  // ripples around the feet (the crab wades in the water)
  ctx.lineWidth = 1.8;
  for (let k = 0; k < 2; k++) {
    const ph = (t * 1.3 + k * 0.5 + c.x * 0.02) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${(1 - ph) * 0.7})`;
    ctx.beginPath(); ctx.ellipse(c.x, c.y + 3, (12 + 24 * ph) * sc * 0.8, (4.5 + 9 * ph) * sc * 0.8, 0, 0, PI2); ctx.stroke();
  }
  drawCrabSprite(ctx, c.x, c.y - 10 * sc + bob, sc, false, c.t, 0, c.dir);
  // water line over the lower legs
  ctx.save();
  ctx.globalAlpha = 0.5; ctx.fillStyle = '#5fd6dc';
  ctx.beginPath(); ctx.ellipse(c.x, c.y - 1, 18 * sc, 6.6 * sc, 0, 0, PI2); ctx.fill();
  ctx.restore();
  if (c.g >= 1) {
    const a = 0.5 + 0.5 * Math.sin(t * 6 + c.x);
    ctx.fillStyle = `rgba(255,236,110,${0.6 + 0.4 * a})`;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const ang = (i / 8) * PI2 - PI / 2, rr = i % 2 ? 3 : 8; ctx.lineTo(c.x + Math.cos(ang) * rr, c.y - 44 * sc - a * 3 + Math.sin(ang) * rr); }
    ctx.closePath(); ctx.fill();
  }
}

export function drawPenFront(ctx: CanvasRenderingContext2D) {
  const { x, y, w, h } = PEN;
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(x - 9, y + h - 10, w + 18, 26, 13);
  ctx.fillStyle = '#d99a58'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#7a4a20'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,235,190,.5)'; ctx.beginPath(); ctx.roundRect(x - 2, y + h - 7, w + 4, 4, 2); ctx.fill();
}

// ---------------- static stall art
export function paintIceStall(c: CanvasRenderingContext2D) {
  const x = ICE.x, w = ICE.w;
  c.lineJoin = 'round';
  c.globalAlpha = 0.2; c.fillStyle = '#4a3a10';
  c.beginPath(); c.ellipse(x + w / 2 + 6, 354, w / 2 + 14, 11, 0, 0, PI2); c.fill(); c.globalAlpha = 1;
  // poles
  for (const px of [x + 5, x + w - 5]) {
    c.beginPath(); c.roundRect(px - 4, 186, 8, 112, 3); c.fillStyle = '#e8d7c0'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = OUT; c.stroke();
  }
  // cart wheels
  for (const wx of [x + 24, x + w - 24]) {
    c.beginPath(); c.arc(wx, 346, 14, 0, PI2); c.fillStyle = '#7a6a8a'; c.fill(); c.lineWidth = 2.6; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(wx, 346, 6, 0, PI2); c.fillStyle = '#f2e4ff'; c.fill(); c.lineWidth = 2; c.stroke();
  }
  // front panel
  c.beginPath(); c.roundRect(x, 294, w, 52, 10);
  c.fillStyle = '#ff9fc1'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.save(); c.beginPath(); c.roundRect(x, 294, w, 52, 10); c.clip();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
  for (let k = 0; k < 8; k++) for (let r = 0; r < 2; r++) { c.beginPath(); c.arc(x + 10 + k * 20 + r * 10, 322 + r * 12, 9, PI, 0); c.stroke(); }
  c.restore();
  // counter lip
  c.beginPath(); c.roundRect(x - 5, 282, w + 10, 17, 8);
  c.fillStyle = '#a8f2d6'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.roundRect(x + 4, 285, w - 8, 4, 2); c.fill();
  // awning
  const aw = w + 24, ax = x - 12, ay = 166;
  for (let k = 0; k < 8; k++) {
    const x0 = ax + k * (aw / 8);
    c.beginPath(); c.moveTo(x0, ay); c.lineTo(x0 + aw / 8, ay); c.lineTo(x0 + aw / 8, ay + 28);
    c.arc(x0 + aw / 16, ay + 28, aw / 16, 0, PI); c.closePath();
    c.fillStyle = k % 2 ? '#ffffff' : '#ff7fae'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = OUT; c.stroke();
  }
  c.beginPath(); c.roundRect(ax - 4, ay - 11, aw + 8, 15, 7); c.fillStyle = '#ff5f98'; c.fill(); c.lineWidth = 2.6; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.roundRect(ax + 6, ay - 8, aw - 12, 4, 2); c.fill();
  // bunting
  for (let k = 0; k < 6; k++) {
    const bx = x + 12 + k * ((w - 24) / 5);
    c.beginPath(); c.moveTo(bx - 6, ay - 8); c.lineTo(bx + 6, ay - 8); c.lineTo(bx, ay + 4); c.closePath();
    c.fillStyle = ['#ffd93b', '#7fe6c8', '#ff9fc1', '#9fc8ff'][k % 4]; c.fill(); c.lineWidth = 1.6; c.stroke();
  }
  paintSign(c, x + w / 2, ay + 36, 'ES KRIM', { w: 146, h: 36, c1: '#ff8fb8', c2: '#ff5f98', textFill: '#fff', textStroke: '#8a1f52' });
  // giant cone on top
  c.save(); c.translate(x + w / 2, 128); c.scale(1.5, 1.5);
  paintCone(c, 0);
  c.restore();
}

export function paintCooker(c: CanvasRenderingContext2D) {
  const { x, y, w, h, H } = COOK;
  c.lineJoin = 'round';
  c.globalAlpha = 0.2; c.fillStyle = '#4a3a10';
  c.beginPath(); c.roundRect(x - 4, y + 8, w + 14, h + 6, 16); c.fill(); c.globalAlpha = 1;
  paintSign(c, x + w / 2, 142, 'KEPITING', { w: w - 6, h: 62, c1: '#ff8a5a', c2: '#d6482c', rim: '#8a4a28', posts: 66, icon: (c2: CanvasRenderingContext2D, xx: number, yy: number) => { c2.save(); c2.translate(xx, yy + 3); c2.scale(0.5, 0.5); paintCrab(c2, true, 0); c2.restore(); }, iconR: (c2: CanvasRenderingContext2D, xx: number, yy: number) => { c2.save(); c2.translate(xx, yy + 3); c2.scale(0.5, 0.5); paintCrab(c2, true, 0); c2.restore(); } });
  // cabinet
  c.beginPath(); c.roundRect(x, y + h - H - 6, w, H + 6, 12); c.fillStyle = '#2b6f86'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.save(); c.beginPath(); c.roundRect(x, y + h - H - 6, w, H + 6, 12); c.clip();
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2;
  for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(x + 8 + k * 20, y + h - H - 4); c.lineTo(x + 8 + k * 20, y + h + 4); c.stroke(); }
  c.restore();
  // fire window
  c.beginPath(); c.roundRect(x + 14, 322, 62, 22, 7); c.fillStyle = '#2a1410'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = '#9fb7c2'; c.stroke();
  // top face
  c.beginPath(); c.roundRect(x, y - H, w, h, 14); c.fillStyle = '#7fc2d6'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.roundRect(x + 6, y - H + 6, w - 12, h - 16, 10); c.fillStyle = '#a8dceb'; c.fill();
  // pot (copper)
  const px = COOK_POT.x, py = COOK_POT.y + 6;
  // chimney
  c.beginPath(); c.roundRect(px + 18, 186, 13, 66, 4); c.fillStyle = '#b8c4d0'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.roundRect(px + 14, 180, 21, 10, 4); c.fillStyle = '#dde4ec'; c.fill(); c.stroke();
  ell(c, px, py + 8, 31, 13, 'rgba(0,0,0,.18)');
  c.beginPath(); c.ellipse(px, py, 31, 25, 0, 0, PI2);
  const g = c.createLinearGradient(px - 31, 0, px + 31, 0);
  g.addColorStop(0, '#b8682f'); g.addColorStop(0.4, '#f0a05a'); g.addColorStop(1, '#a85a28');
  c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  for (const s of [-1, 1]) { ell(c, px + s * 33, py - 2, 5, 6, '#7a4a22', OUT, 2); }
  c.fillStyle = 'rgba(255,240,210,.55)'; c.beginPath(); c.ellipse(px - 14, py - 8, 8, 4, -0.5, 0, PI2); c.fill();
  for (const [dx, dy] of [[-18, 6], [0, 12], [18, 6]]) ell(c, px + dx, py + dy, 1.6, 1.6, '#7a4a22');
  // display tray
  c.beginPath(); c.roundRect(x + 84, y - H + 12, 132, 70, 9); c.fillStyle = '#e8f7fb'; c.fill(); c.lineWidth = 2.6; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = 'rgba(160,215,235,.45)'; c.beginPath(); c.roundRect(x + 88, y - H + 16, 124, 62, 6); c.fill();
}

// ---------------- cooker (animated part): flames in the window, jiggling lid, progress, steam source is in game.ts
export function drawCookerDyn(ctx: CanvasRenderingContext2D, o: { t: number; cooking: boolean; prog: number; stock: number; cap: number; rawIn: number }) {
  const { x, y, H } = COOK;
  // flames
  const amp = o.cooking ? 1 : 0.34;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x + 14, 322, 62, 22, 7); ctx.clip();
  for (let k = 0; k < 5; k++) {
    const fx = x + 22 + k * 11.5, hh = (7 + 7 * Math.abs(Math.sin(o.t * 9 + k * 1.7))) * amp + 3;
    ctx.beginPath(); ctx.moveTo(fx - 5, 345); ctx.quadraticCurveTo(fx - 4, 345 - hh * 0.6, fx, 345 - hh); ctx.quadraticCurveTo(fx + 4, 345 - hh * 0.6, fx + 5, 345);
    ctx.fillStyle = '#ff7a1a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(fx - 2.6, 345); ctx.quadraticCurveTo(fx - 2, 345 - hh * 0.4, fx, 345 - hh * 0.62); ctx.quadraticCurveTo(fx + 2, 345 - hh * 0.4, fx + 2.6, 345);
    ctx.fillStyle = '#ffe45c'; ctx.fill();
  }
  ctx.restore();
  // Pot & Steamer Lid (panci kukus & tutup kubah tinggi montok)
  const px = COOK_POT.x, py = COOK_POT.y + 6;

  // 1. Crab inside the steamer pot (turns from raw blue to delicious steaming red!)
  if (o.cooking) {
    const bob = Math.sin(o.t * 12) * 1.2;
    // Crab sits deep inside the steamer pot body
    ctx.save();
    ctx.beginPath(); ctx.ellipse(px, py + 4, 30, 22, 0, 0, PI2); ctx.clip();
    drawCrabSprite(ctx, px, py - 2 + bob, CRAB_S, false, o.t * 0.6, 0, 1);
    ctx.globalAlpha = Math.min(1, Math.max(0, (o.prog - 0.12) / 0.75));
    drawCrabSprite(ctx, px, py - 2 + bob, CRAB_S, true, o.t * 0.6, 0, 1);
    ctx.restore();

    // Pot front rim overlapping crab legs nicely
    ctx.beginPath(); ctx.ellipse(px, py + 5, 31, 14, 0, 0.1, Math.PI - 0.1);
    ctx.lineWidth = 3.6; ctx.strokeStyle = '#9a5324'; ctx.stroke();
  }

  // 2. Tall, bold dome steamer lid (Tutup panci kukus ditinggikan & montok manis)
  // When cooking, the lid sits snugly ON TOP of the pot, gently vibrating with steam puffs!
  // Near completion (prog > 0.9) the lid lifts up high revealing the cooked crab!
  const isEnding = o.cooking && o.prog > 0.9;
  const lift = isEnding ? (o.prog - 0.9) * 220 : (o.cooking ? Math.abs(Math.sin(o.t * 16)) * 2.2 : 0);
  const jig = o.cooking && !isEnding ? Math.sin(o.t * 32) * 0.8 : 0;
  const LW = 31, LH = 34; // Tall dome height 34!

  ctx.save();
  ctx.translate(px + jig, py - 12 - lift);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Steamer dome lid path (tall, rounded, high dome with rim lip)
  const domeLid = () => {
    ctx.beginPath();
    ctx.moveTo(-LW, 4);
    ctx.quadraticCurveTo(-LW, -10, -LW * 0.82, -22);
    ctx.bezierCurveTo(-LW * 0.5, -LH, LW * 0.5, -LH, LW * 0.82, -22);
    ctx.quadraticCurveTo(LW, -10, LW, 4);
    ctx.quadraticCurveTo(0, 11, -LW, 4);
    ctx.closePath();
  };

  domeLid();
  const lg = ctx.createLinearGradient(-LW, 0, LW, 0);
  lg.addColorStop(0, '#c8d4e2');
  lg.addColorStop(0.4, '#ffffff');
  lg.addColorStop(0.75, '#e4ecf6');
  lg.addColorStop(1, '#9eb0c4');
  ctx.fillStyle = lg; ctx.fill();
  ctx.lineWidth = 3.2; ctx.strokeStyle = OUT; ctx.stroke();

  // Tiered steam rim at base of lid
  ctx.beginPath(); ctx.roundRect(-LW - 2, 1, LW * 2 + 4, 6, 2.5);
  ctx.fillStyle = '#b4c4d6'; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = OUT; ctx.stroke();

  // Shiny vertical reflection highlight on dome
  ctx.fillStyle = 'rgba(255,255,255,.65)';
  ctx.beginPath();
  ctx.ellipse(-11, -16, 6, 12, -0.2, 0, PI2);
  ctx.fill();

  // Cute wooden/cherry-red handle knob on top
  ctx.beginPath();
  ctx.roundRect(-5, -LH - 4, 10, 6, 2);
  ctx.fillStyle = '#9e4a28'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -LH - 7, 7, 0, PI2);
  ctx.fillStyle = '#ff4355'; ctx.fill();
  ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.fillStyle = '#ff9aa8';
  ctx.beginPath(); ctx.arc(-2, -LH - 9, 2.2, 0, PI2); ctx.fill();

  ctx.restore();
  // progress pill
  if (o.cooking) {
    ctx.beginPath(); ctx.roundRect(px - 26, py + 31, 52, 9, 4.5); ctx.fillStyle = 'rgba(40,20,20,.6)'; ctx.fill();
    ctx.beginPath(); ctx.roundRect(px - 26 + 1, py + 32, 50 * o.prog, 7, 3.5); ctx.fillStyle = '#ffd93b'; ctx.fill();
  }
  // counters
  const bad = (cx: number, cy: number, text: string, bg: string, fg: string, w = 46) => {
    ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - 9, w, 18, 9); ctx.fillStyle = bg; ctx.fill();
    ctx.font = '800 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = fg; ctx.fillText(text, cx, cy + 4);
  };
  bad(x + 150, y + 100 - H + 19, o.stock >= o.cap ? 'FULL' : `${o.stock}/${o.cap}`, o.stock >= o.cap ? '#3fae49' : '#fff', o.stock >= o.cap ? '#fff' : '#b0261a', 52);
  if (o.rawIn > 0) bad(px, y - H - 2, '🦀 ' + o.rawIn, '#fff', '#b0261a', 44);
}
