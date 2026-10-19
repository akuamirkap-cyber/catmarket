// ---------------------------------------------------------------
//  Cute big fish: 0 clownfish, 1 blue, 2 pink, 3 green pufferfish
// ---------------------------------------------------------------
import { sprite } from './sprites';

const PI = Math.PI;

export const FISH_VALUE = [12, 10, 14, 20, 8]; // 0-3 fish, 4 mango
/** 10 kinds: 0-3 nigiri, 4-7 maki, 8 mango nigiri, 9 mango roll */
export const SUSHI_VALUE = [22, 18, 25, 38, 28, 24, 30, 44, 16, 26];
export const SUSHI_COUNT = 10;
/** every fish in the world is drawn at exactly this scale */
export const FISH_S = 0.8;
export const FISH_COUNT = 4;

const BODY = ['#ff8a1f', '#4aa8ff', '#ff8fc0', '#8ee060'];
const FIN = ['#ff6a00', '#2f7fe0', '#ff5fa2', '#5fbf3c'];
const BELLY = ['#ffbf73', '#b4e4ff', '#ffd6e8', '#fff2a6'];
const LINE = ['#b8470a', '#1f5fb8', '#c23b83', '#3f8f1f'];

export function randomFishType(): number {
  const r = Math.random();
  if (r < 0.3) return 0;
  if (r < 0.6) return 1;
  if (r < 0.87) return 2;
  return 3;
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, PI * 2);
}

/** Fish faces +x. `dir` flips horizontally. `w` = tail wag phase. */
function drawFishRaw(ctx: CanvasRenderingContext2D, x: number, y: number, type: number, s = 1, rot = 0, dir = 1, w = 0) {
  const puff = type === 3;
  const C = BODY[type], FN = FIN[type], B = BELLY[type], O = LINE[type];
  const brx = puff ? 19 : 22;
  const bry = puff ? 18 : 14.5;
  const wag = Math.sin(w) * 0.28;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(dir * s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  ctx.strokeStyle = O;

  // tail
  ctx.save();
  ctx.translate(-brx + 4, 0);
  ctx.rotate(wag);
  const tl = puff ? -10 : -16, th = puff ? 8 : 12.5;
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(tl, -th);
  ctx.quadraticCurveTo(tl + 6, 0, tl, th);
  ctx.closePath();
  ctx.fillStyle = FN;
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (puff) {
    // spikes
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2;
      const a1 = a - 0.14, a2 = a + 0.14;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a1) * brx * 0.95, Math.sin(a1) * bry * 0.95);
      ctx.lineTo(Math.cos(a) * (brx + 5.5), Math.sin(a) * (bry + 5.5));
      ctx.lineTo(Math.cos(a2) * brx * 0.95, Math.sin(a2) * bry * 0.95);
      ctx.closePath();
      ctx.fillStyle = FN;
      ctx.fill();
      ctx.stroke();
    }
    ctx.lineWidth = 2;
  } else {
    // dorsal fin
    ctx.beginPath();
    ctx.moveTo(-10, -bry + 3);
    ctx.quadraticCurveTo(-4 + wag * 6, -bry - 13, 10, -bry + 3);
    ctx.closePath();
    ctx.fillStyle = FN;
    ctx.fill();
    ctx.stroke();
  }

  // body
  ctx.beginPath();
  ctx.ellipse(0, 0, brx, bry, 0, 0, PI * 2);
  ctx.fillStyle = C;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = B;
  ctx.beginPath();
  ctx.ellipse(2, bry * 0.95, brx * 0.85, bry * 0.55, 0, 0, PI * 2);
  ctx.fill();
  if (type === 0) {
    const stripe = (cx: number, wd: number) => {
      ctx.beginPath();
      ctx.moveTo(cx - wd / 2, -20);
      ctx.quadraticCurveTo(cx - wd / 2 - 3, 0, cx - wd / 2, 20);
      ctx.lineTo(cx + wd / 2, 20);
      ctx.quadraticCurveTo(cx + wd / 2 - 3, 0, cx + wd / 2, -20);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    };
    stripe(6, 7);
    stripe(-6, 8);
    stripe(-17, 5);
  } else if (type === 1) {
    ctx.fillStyle = 'rgba(30,90,200,.35)';
    ctx.beginPath();
    ctx.ellipse(0, -bry * 0.95, brx, bry * 0.55, 0, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -9);
    ctx.quadraticCurveTo(-11, 0, -8, 9);
    ctx.moveTo(-14, -7);
    ctx.quadraticCurveTo(-17, 0, -14, 7);
    ctx.stroke();
  } else if (type === 2) {
    ctx.fillStyle = '#ff5fa2';
    for (const [sx, sy, sr] of [[-8, -6, 2.6], [-2, -9, 2], [-13, -1, 2], [-6, 1, 1.7]]) {
      circle(ctx, sx, sy, sr);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = 'rgba(60,140,40,.45)';
    for (const [sx, sy, sr] of [[-6, -9, 2.6], [-12, -3, 2.2], [0, -12, 2], [-4, 0, 1.8]]) {
      circle(ctx, sx, sy, sr);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.strokeStyle = O;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, brx, bry, 0, 0, PI * 2);
  ctx.stroke();

  // pectoral fin
  ctx.save();
  ctx.translate(-1, puff ? 5 : 4);
  ctx.rotate(0.5 + wag * 1.4);
  ctx.beginPath();
  ctx.ellipse(-3, 2, 6.5, 3.6, 0, 0, PI * 2);
  ctx.fillStyle = FN;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();

  // eye
  const ex = puff ? 9 : 12, ey = puff ? -4 : -3.5, er = puff ? 6.4 : 5.8;
  circle(ctx, ex, ey, er);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#3a2a3a';
  ctx.stroke();
  circle(ctx, ex + 1, ey + 0.6, er * 0.68);
  ctx.fillStyle = '#2b1d2e';
  ctx.fill();
  circle(ctx, ex + 0.1, ey - 1.3, er * 0.3);
  ctx.fillStyle = '#fff';
  ctx.fill();
  circle(ctx, ex + 2.4, ey + 2.1, er * 0.14);
  ctx.fill();

  // mouth
  if (puff) {
    ctx.beginPath();
    ctx.ellipse(brx - 3, 3.5, 2.3, 2.9, 0, 0, PI * 2);
    ctx.fillStyle = '#ff7a8c';
    ctx.fill();
    ctx.lineWidth = 0.9;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(ex + 5, 3.2, 3.6, 0.15 * PI, 0.85 * PI);
    ctx.strokeStyle = '#4a2a2a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // blush
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#ff6f91';
  ctx.beginPath();
  ctx.ellipse(ex - 3.5, ey + 10.5, 3.8, 2.3, 0, 0, PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Dark swimming silhouette seen through the water. */
export function drawFishSil(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, dir: number, w: number, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  ctx.fillStyle = `rgba(6,60,130,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 11, 0, 0, PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(-17, 0);
  ctx.rotate(Math.sin(w) * 0.35);
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(-14, -10);
  ctx.lineTo(-14, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-6, -9);
  ctx.quadraticCurveTo(0, -18, 8, -9);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------
//  Sushi
// ---------------------------------------------------------------
const SLICE = ['#ff8f5a', '#e85f6a', '#ffb5c8', '#d4efa6', '#ffc93c'];
const SLICE_D = ['#dd5f2c', '#b3364a', '#df7897', '#8cbd5c', '#e0861a'];

export function drawRice(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.roundRect(-11, -4.5, 22, 11.5, 5.5);
  ctx.fillStyle = '#fffdf6';
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#d8cdbb';
  ctx.stroke();
  ctx.fillStyle = '#ece2cf';
  for (const [dx, dy] of [[-6, 1], [-1, 3.5], [5, 1.5], [1, -1.5]]) {
    ctx.beginPath();
    ctx.ellipse(dx, dy, 1.5, 0.8, 0.4, 0, PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawNigiriRaw(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, type: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  drawRice(ctx, 0, 2.6, 1);
  ctx.beginPath();
  ctx.moveTo(-12.6, 0);
  ctx.quadraticCurveTo(-13.4, -7.8, -6, -8.4);
  ctx.lineTo(6, -8.4);
  ctx.quadraticCurveTo(13.4, -7.8, 12.6, 0);
  ctx.quadraticCurveTo(0, 3.4, -12.6, 0);
  ctx.closePath();
  ctx.fillStyle = SLICE[type];
  ctx.fill();
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = SLICE_D[type];
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-8, -5.5); ctx.quadraticCurveTo(-4, -3.5, 0, -6);
  ctx.moveTo(1, -2.4); ctx.quadraticCurveTo(5, -4.6, 9, -3);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------
//  Cached (sprite) drawing API
// ---------------------------------------------------------------
const WAGN = 9;

/** Fish faces +x. Tail wag is quantised into 10 cached frames per fish type. */
export function drawFish(ctx: CanvasRenderingContext2D, x: number, y: number, type: number, s = 1, rot = 0, dir = 1, w = 0) {
  const idx = Math.round((Math.sin(w) * 0.5 + 0.5) * WAGN);
  const spr = sprite('f' + type + '_' + idx, 100, 80, (c) =>
    drawFishRaw(c, 0, 0, type, 1, 0, 1, Math.asin((idx / WAGN) * 2 - 1)));
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(dir * s, s);
  ctx.drawImage(spr, -50, -40, 100, 80);
  ctx.restore();
}

function drawMangoRaw(c: CanvasRenderingContext2D, green: boolean) {
  const OUTL = green ? '#2f5a1f' : '#6a3510';
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const body = () => {
    c.beginPath();
    c.moveTo(-17, 3);
    c.bezierCurveTo(-19, -9, -8, -16, 4, -15);
    c.bezierCurveTo(16, -15, 24, -4, 21, 6);
    c.bezierCurveTo(19, 15, 7, 19, -4, 17);
    c.bezierCurveTo(-13, 15, -16, 10, -17, 3);
    c.closePath();
  };
  // stem
  c.strokeStyle = '#5a3a1a';
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(3, -14); c.lineTo(5, -19); c.stroke();
  body();
  const g = c.createLinearGradient(-14, -14, 16, 16);
  if (green) { g.addColorStop(0, '#c9ec6a'); g.addColorStop(0.55, '#92d04a'); g.addColorStop(1, '#5fae33'); }
  else { g.addColorStop(0, '#ffe45a'); g.addColorStop(0.5, '#ffbd35'); g.addColorStop(1, '#ff8f1f'); }
  c.fillStyle = g;
  c.fill();
  c.save();
  body();
  c.clip();
  c.fillStyle = green ? 'rgba(40,110,20,.28)' : 'rgba(214,90,10,.34)';
  c.beginPath(); c.ellipse(13, 13, 17, 11, -0.5, 0, PI * 2); c.fill();
  if (!green) {
    c.fillStyle = 'rgba(255,110,60,.3)';
    c.beginPath(); c.ellipse(16, 4, 6, 9, 0.2, 0, PI * 2); c.fill();
  }
  c.restore();
  body();
  c.lineWidth = 2.6;
  c.strokeStyle = OUTL;
  c.stroke();
  // highlight
  c.fillStyle = 'rgba(255,255,255,.62)';
  c.beginPath(); c.ellipse(-8.5, -7.5, 5.4, 2.7, -0.7, 0, PI * 2); c.fill();
  c.beginPath(); c.arc(-3, -11.5, 1.4, 0, PI * 2); c.fill();
  // two leaves
  for (const [rot, len] of [[-2.35, 14], [-0.75, 13]] as [number, number][]) {
    c.save();
    c.translate(5, -18);
    c.rotate(rot);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.5, -6.2, len, 0);
    c.quadraticCurveTo(len * 0.5, 5.2, 0, 0);
    c.fillStyle = '#52c95a';
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = '#1f6a30';
    c.stroke();
    c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(1.5, 0); c.lineTo(len * 0.8, 0); c.stroke();
    c.restore();
  }
}

export function drawMango(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1, rot = 0, dir = 1, green = false) {
  const spr = sprite(green ? 'mangoG' : 'mango', 58, 60, (c) => drawMangoRaw(c, green));
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(dir * s, s);
  ctx.drawImage(spr, -29, -30, 58, 60);
  ctx.restore();
}

/** type 0-3 = fish, 4 = mango */
type ItemFn = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, dir: number) => void;
const EXTRA_ITEMS: Record<number, ItemFn> = {};
/** other modules (crab, seaweed ...) register how their carried items look */
export function registerItem(type: number, fn: ItemFn) { EXTRA_ITEMS[type] = fn; }

export function drawItem(ctx: CanvasRenderingContext2D, x: number, y: number, type: number, s = 1, rot = 0, dir = 1, w = 0) {
  if (type >= 5) { const f = EXTRA_ITEMS[type]; if (f) f(ctx, x, y, s, rot, dir); return; }
  if (type === 4) drawMango(ctx, x, y, s * 1.05, rot * 0.6, dir);
  else drawFish(ctx, x, y, type, s, rot, dir, w);
}

function drawMakiRaw(c: CanvasRenderingContext2D, kind: number) {
  const mango = kind === 9;
  const f = mango ? 4 : kind - 4;
  const col = SLICE[f], colD = SLICE_D[f];
  const nori = '#2f4a3c';
  c.lineJoin = 'round';
  // side wall
  c.fillStyle = mango ? '#f2ead8' : nori;
  c.beginPath(); c.ellipse(0, 6, 10.5, 5, 0, 0, PI * 2); c.fill();
  c.fillRect(-10.5, -1, 21, 7);
  c.beginPath(); c.ellipse(0, 6, 10.5, 5, 0, 0, PI); c.fillStyle = mango ? '#f2ead8' : nori; c.fill();
  c.strokeStyle = mango ? '#cdbf9f' : '#1a2b22';
  c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(-10.5, -1); c.lineTo(-10.5, 6); c.ellipse(0, 6, 10.5, 5, 0, PI, 0, true); c.lineTo(10.5, -1); c.stroke();
  // top face
  c.beginPath(); c.ellipse(0, -1, 10.5, 5.4, 0, 0, PI * 2);
  c.fillStyle = mango ? '#fffdf6' : nori;
  c.fill();
  c.stroke();
  if (mango) {
    c.fillStyle = '#3a2a1a';
    for (const [dx, dy] of [[-7, -3], [6, -4], [-2, 2], [8, 1], [-8, 1]]) { c.beginPath(); c.ellipse(dx, dy, 0.9, 0.5, 0.5, 0, PI * 2); c.fill(); }
    c.beginPath(); c.ellipse(0, -1, 6.2, 3.1, 0, 0, PI * 2); c.fillStyle = nori; c.fill();
  }
  c.beginPath(); c.ellipse(0, -1, 7.6, 3.7, 0, 0, PI * 2);
  c.fillStyle = '#fffdf6';
  c.fill();
  c.beginPath(); c.ellipse(0, -1, 3.9, 1.9, 0, 0, PI * 2);
  c.fillStyle = col;
  c.fill();
  c.lineWidth = 1;
  c.strokeStyle = colD;
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,.7)';
  c.beginPath(); c.ellipse(-1.2, -1.6, 1.4, 0.6, 0, 0, PI * 2); c.fill();
}

function drawSushiRaw(c: CanvasRenderingContext2D, kind: number) {
  if (kind <= 3) drawNigiriRaw(c, 0, 1, 1, kind, 0);
  else if (kind === 8) drawNigiriRaw(c, 0, 1, 1, 4, 0);
  else drawMakiRaw(c, kind);
}

/** kind 0-9, see SUSHI_VALUE */
export function drawSushi(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, kind: number, rot = 0) {
  const spr = sprite('s' + kind, 48, 40, (c) => drawSushiRaw(c, kind));
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.drawImage(spr, -24, -20, 48, 40);
  ctx.restore();
}
export const drawNigiri = drawSushi;

export const isMaki = (kind: number) => (kind >= 4 && kind <= 7) || kind === 9;

// ---------------------------------------------------------------
//  Money
// ---------------------------------------------------------------
function drawBillRaw(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  c.beginPath();
  c.roundRect(-17, -9, 34, 18, 3.5);
  c.fillStyle = '#46c652';
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = '#1f7a2c';
  c.stroke();
  c.beginPath();
  c.roundRect(-14, -6.2, 28, 12.4, 2);
  c.lineWidth = 1.1;
  c.strokeStyle = 'rgba(255,255,255,.55)';
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,.22)';
  c.beginPath(); c.roundRect(-15.5, -8, 31, 5, 2); c.fill();
  c.beginPath(); c.arc(0, 0, 5.6, 0, PI * 2);
  c.fillStyle = '#a9f0b0';
  c.fill();
  c.lineWidth = 1.2;
  c.strokeStyle = '#1f7a2c';
  c.stroke();
  c.fillStyle = '#1f7a2c';
  c.font = '900 8.5px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText('$', 0, 3);
  c.fillStyle = 'rgba(255,255,255,.6)';
  for (const [dx, dy] of [[-11.5, -4.5], [11.5, -4.5], [-11.5, 4.5], [11.5, 4.5]]) { c.beginPath(); c.arc(dx, dy, 1.3, 0, PI * 2); c.fill(); }
}

export function drawBill(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1, rot = 0) {
  const spr = sprite('bill', 44, 28, drawBillRaw);
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.drawImage(spr, -22, -14, 44, 28);
  ctx.restore();
}

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1, rot = 0) {
  const spr = sprite('coin', 28, 28, (c) => {
    c.beginPath(); c.arc(0, 0, 11, 0, PI * 2);
    c.fillStyle = '#ffd43b'; c.fill();
    c.lineWidth = 2; c.strokeStyle = '#c98a00'; c.stroke();
    c.beginPath(); c.arc(0, 0, 7.4, 0, PI * 2);
    c.lineWidth = 1.4; c.strokeStyle = '#e8a800'; c.stroke();
    c.fillStyle = '#c98a00';
    c.font = '900 11px system-ui, sans-serif'; c.textAlign = 'center';
    c.fillText('$', 0, 4);
    c.fillStyle = 'rgba(255,255,255,.65)';
    c.beginPath(); c.ellipse(-4, -5, 3.2, 1.6, -0.6, 0, PI * 2); c.fill();
  });
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.drawImage(spr, -14, -14, 28, 28);
  ctx.restore();
}

const DEEP_TINT = [0, 0.3, 0.52, 0.74];

/**
 * Fish seen through water. depth 0 = at the surface (full colour), 1 = deep down (blue-tinted, soft).
 * The size never changes (fish are always the same size); the caller fades it with globalAlpha.
 */
export function drawFishDeep(ctx: CanvasRenderingContext2D, x: number, y: number, type: number, s = 1, rot = 0, dir = 1, w = 0, depth = 0) {
  const lv = depth < 0.12 ? 0 : depth < 0.4 ? 1 : depth < 0.7 ? 2 : 3;
  if (lv === 0) { drawFish(ctx, x, y, type, s, rot, dir, w); return; }
  const idx = Math.round(Math.round((Math.sin(w) * 0.5 + 0.5) * WAGN) / 3) * 3; // 4 wag frames are enough for deep fish
  const spr = sprite('f' + type + '_' + idx + '_t' + lv, 100, 80, (c) => {
    if (lv >= 2 && 'filter' in c) (c as CanvasRenderingContext2D).filter = lv === 2 ? 'blur(0.5px)' : 'blur(1px)';
    drawFishRaw(c, 0, 0, type, 1, 0, 1, Math.asin((Math.min(idx, WAGN) / WAGN) * 2 - 1));
    if ('filter' in c) (c as CanvasRenderingContext2D).filter = 'none';
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = `rgba(22,108,196,${DEEP_TINT[lv]})`;
    c.fillRect(-50, -40, 100, 80);
  });
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(dir * s, s);
  ctx.drawImage(spr, -50, -40, 100, 80);
  ctx.restore();
}
