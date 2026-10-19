// ---------------------------------------------------------------
//  Juice bar, orange / apple trees, fishing boat, beach wagon, beach umbrella
// ---------------------------------------------------------------
import { drawFish, drawMango, registerItem } from './fish';
import { CANOPY_Y, MANGO_FR } from './scenery';
import { sprite } from './sprites';
import { paintSign } from './signs';
import { PRODUCT_HOOKS, product } from './extras';
import type { BagItem } from './extras';

const PI = Math.PI;
const PI2 = PI * 2;
const OUT = '#58244a';
type Box = { x: number; y: number; w: number; h: number };

// ---------------- layout
export const JUICE = { x: 1010, y: 545, w: 220, h: 84, H: 26, cap: 18 };
export const JUICE_ZONE: Box = { x: 1022, y: 636, w: 196, h: 54 };
export const JUICEQ = [{ x: 1266, y: 566 }, { x: 1266, y: 612 }];
export const BLENDER = { x: JUICE.x + 34, y: JUICE.y - JUICE.H + 52 };
export const cupSlot = (i: number) => ({ x: JUICE.x + 80 + (i % 6) * 24, y: JUICE.y - JUICE.H + 36 + Math.floor(i / 6) * 16 });
export const ORANGE_POS = [{ x: 990, y: 852 }, { x: 1075, y: 852 }];
export const APPLE_POS = [{ x: 1160, y: 852 }, { x: 1245, y: 852 }];
export const BOAT_DOCK = { x: -128, y: 330 };
export const BOAT_ZONE: Box = { x: -28, y: 296, w: 64, h: 42 };
export const ASSIST_ZONE: Box = { x: 505, y: 380, w: 96, h: 62 };
export const ASSIST_HOME = { x: 560, y: 470 };
/** where the tow pole is attached, in wagon-local units (before the flip) */
export const WAGON_H = { dx: 33, dy: 19 };

function ell(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, lw = 1.6) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, PI2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
}

const easeBack = (k: number) => (k >= 1 ? 1 : 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2));

// ---------------- fruit
function leaf(c: CanvasRenderingContext2D, x: number, y: number, rot: number, len = 9) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(len * 0.5, -len * 0.5, len, 0);
  c.quadraticCurveTo(len * 0.5, len * 0.42, 0, 0);
  c.fillStyle = '#52c95a';
  c.fill();
  c.lineWidth = 1.7;
  c.strokeStyle = '#1f6a30';
  c.stroke();
  c.beginPath(); c.moveTo(1, 0); c.lineTo(len * 0.8, 0); c.lineWidth = 1; c.stroke();
  c.restore();
}

function paintOrange(c: CanvasRenderingContext2D, green: boolean) {
  c.lineJoin = 'round';
  const g = c.createRadialGradient(-4, -4, 2, 0, 1, 16);
  if (green) { g.addColorStop(0, '#dff48a'); g.addColorStop(1, '#6bb83a'); }
  else { g.addColorStop(0, '#ffc766'); g.addColorStop(0.55, '#ff9a1f'); g.addColorStop(1, '#e8650a'); }
  c.beginPath(); c.arc(0, 2, 14, 0, PI2);
  c.fillStyle = g; c.fill();
  c.lineWidth = 2.6; c.strokeStyle = green ? '#2f6a22' : '#9c3d06'; c.stroke();
  c.fillStyle = green ? 'rgba(40,110,20,.3)' : 'rgba(190,70,0,.3)';
  for (const [dx, dy] of [[-6, 4], [4, 7], [7, 0], [-2, 10], [-8, -2], [1, 1]]) { c.beginPath(); c.arc(dx, dy + 2, 0.9, 0, PI2); c.fill(); }
  c.fillStyle = green ? '#3f7a2a' : '#7a3b10';
  c.beginPath(); c.ellipse(0, -10.4, 3.4, 1.7, 0, 0, PI2); c.fill();
  leaf(c, 2, -11.6, -0.55, 10);
  c.fillStyle = 'rgba(255,255,255,.6)';
  c.beginPath(); c.ellipse(-6, -3, 4.4, 2.3, -0.7, 0, PI2); c.fill();
}

function paintApple(c: CanvasRenderingContext2D, green: boolean) {
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const body = () => {
    c.beginPath();
    c.moveTo(0, -8);
    c.bezierCurveTo(-3, -14, -15, -12.5, -15, -1);
    c.bezierCurveTo(-15, 9, -8, 16, -3.6, 15);
    c.bezierCurveTo(-1.6, 14.3, 1.6, 14.3, 3.6, 15);
    c.bezierCurveTo(8, 16, 15, 9, 15, -1);
    c.bezierCurveTo(15, -12.5, 3, -14, 0, -8);
    c.closePath();
  };
  body();
  const g = c.createRadialGradient(-5, -4, 2, 0, 2, 19);
  if (green) { g.addColorStop(0, '#dcf88c'); g.addColorStop(0.6, '#8ccf48'); g.addColorStop(1, '#5aa02a'); }
  else { g.addColorStop(0, '#ff8c8c'); g.addColorStop(0.55, '#e8333f'); g.addColorStop(1, '#a8121f'); }
  c.fillStyle = g; c.fill();
  c.lineWidth = 2.6; c.strokeStyle = green ? '#2f6a22' : '#6e0a16'; c.stroke();
  c.save(); body(); c.clip();
  c.strokeStyle = green ? 'rgba(60,120,20,.22)' : 'rgba(90,0,12,.25)'; c.lineWidth = 1.6;
  for (const k of [-6, 6]) { c.beginPath(); c.moveTo(k * 0.4, -9); c.quadraticCurveTo(k * 1.6, 2, k * 0.9, 15); c.stroke(); }
  c.restore();
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, -8, 3, 1.5, 0, 0, PI2); c.fill();
  c.strokeStyle = '#5a3a1a'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(0, -8); c.quadraticCurveTo(1, -13, 3, -16); c.stroke();
  leaf(c, 2.4, -13.4, -0.4, 10);
  c.fillStyle = 'rgba(255,255,255,.65)';
  c.beginPath(); c.ellipse(-8, -4, 3.4, 5.4, 0.3, 0, PI2); c.fill();
}

export type FruitKind = 'orange' | 'apple' | 'mango';

export function drawFruit(ctx: CanvasRenderingContext2D, kind: FruitKind, x: number, y: number, s = 1, rot = 0, green = false) {
  if (kind === 'mango') { drawMango(ctx, x, y, s * 1.05, rot, 1, green); return; }
  const spr = sprite('fr_' + kind + (green ? 'g' : ''), 44, 48, (c) => (kind === 'orange' ? paintOrange(c, green) : paintApple(c, green)));
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.drawImage(spr, -22, -24, 44, 48);
  ctx.restore();
}

registerItem(8, (ctx, x, y, s, rot) => drawFruit(ctx, 'orange', x, y, s * 1.05, rot * 0.5));
registerItem(9, (ctx, x, y, s, rot) => drawFruit(ctx, 'apple', x, y, s * 1.05, rot * 0.5));

// ---------------- juice cup
function paintCup(c: CanvasRenderingContext2D, flavor: number) {
  const col = ['#ffc83a', '#ff8a1f', '#a6e65f'][flavor] ?? '#ffc83a';
  const deep = ['#f0a410', '#e0620a', '#74c23a'][flavor] ?? '#f0a410';
  c.lineJoin = 'round';
  c.lineCap = 'round';
  // straw
  c.strokeStyle = OUT; c.lineWidth = 5; c.beginPath(); c.moveTo(3, -8); c.lineTo(9, -23); c.stroke();
  c.strokeStyle = '#ff5a7a'; c.lineWidth = 2.6; c.stroke();
  c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.setLineDash([2.4, 3.2]); c.stroke(); c.setLineDash([]);
  const glass = () => {
    c.beginPath(); c.moveTo(-10.6, -9); c.lineTo(10.6, -9); c.lineTo(7.6, 17); c.quadraticCurveTo(0, 20.5, -7.6, 17); c.closePath();
  };
  glass(); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill();
  c.save(); glass(); c.clip();
  const g = c.createLinearGradient(0, -4, 0, 20); g.addColorStop(0, col); g.addColorStop(1, deep);
  c.fillStyle = g; c.fillRect(-12, -4, 24, 26);
  c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(0, -4, 10.6, 2.4, 0, 0, PI2); c.fill();
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(-8, -3, 2.6, 18);
  c.restore();
  glass(); c.lineWidth = 2.2; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.ellipse(0, -9, 10.6, 2.6, 0, 0, PI2); c.lineWidth = 1.8; c.stroke();
  // fruit slice on the rim
  c.save(); c.translate(10, -8); c.rotate(0.5);
  if (flavor === 1) { ell(c, 0, 0, 5.4, 5.4, '#ffb347', OUT, 1.6); c.strokeStyle = '#fff1c4'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(k * 2.1) * 4.4, Math.sin(k * 2.1) * 4.4); c.stroke(); } }
  else if (flavor === 2) { c.beginPath(); c.moveTo(-5, -1); c.quadraticCurveTo(0, -7, 5, -1); c.quadraticCurveTo(0, 5, -5, -1); c.fillStyle = '#fff8e0'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#c4162a'; c.stroke(); c.fillStyle = '#e8333f'; c.fillRect(-5, -3, 10, 1.6); }
  else { c.beginPath(); c.roundRect(-4.6, -3.4, 9.2, 6.8, 2.4); c.fillStyle = '#ffd24a'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#c47a0a'; c.stroke(); }
  c.restore();
}

export function drawCup(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, flavor: number, rot = 0) {
  const spr = sprite('cup' + flavor, 46, 58, (c) => paintCup(c, flavor));
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.drawImage(spr, -23, -29, 46, 58);
  ctx.restore();
}

PRODUCT_HOOKS.juice = (ctx, it, x, y, s) => drawCup(ctx, x, y - 2, s * 2.4, it.type);

// ---------------- juice stall
export function paintJuiceStall(c: CanvasRenderingContext2D) {
  const { x, y, w, h, H } = JUICE;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.globalAlpha = 0.2; c.fillStyle = '#4a3a10';
  c.beginPath(); c.roundRect(x - 4, y + 8, w + 14, h + 6, 16); c.fill(); c.globalAlpha = 1;
  paintSign(c, x + w / 2, 450, 'JUS BUAH', { w: w - 8, h: 62, c1: '#5fd6c4', c2: '#2a9d8f', rim: '#a86a32', posts: 52,
    icon: (c2, xx, yy) => drawFruit(c2, 'orange', xx, yy, 0.82, -0.2), iconR: (c2, xx, yy) => drawFruit(c2, 'apple', xx, yy, 0.82, 0.2) });
  // front
  c.beginPath(); c.roundRect(x, y + h - H - 6, w, H + 6, 12); c.fillStyle = '#2a9d8f'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.save(); c.beginPath(); c.roundRect(x, y + h - H - 6, w, H + 6, 12); c.clip();
  c.fillStyle = 'rgba(255,255,255,.26)';
  for (let k = 0; k < 11; k++) c.fillRect(x + 4 + k * 20, y + h - H - 6, 10, H + 8);
  c.restore();
  drawFruit(c, 'orange', x + 30, y + h - 12, 0.62, 0);
  drawMango(c, x + w / 2, y + h - 12, 0.5, 0, 1);
  drawFruit(c, 'apple', x + w - 30, y + h - 12, 0.62, 0);
  // top
  c.beginPath(); c.roundRect(x, y - H, w, h, 14); c.fillStyle = '#7fe0d0'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.roundRect(x + 6, y - H + 6, w - 12, h - 16, 10); c.fillStyle = '#c8f5ec'; c.fill();
  // blender machine base
  const bx = BLENDER.x, by = BLENDER.y;
  c.beginPath(); c.roundRect(bx - 25, by - 5, 50, 26, 8); c.fillStyle = '#2b8aa8'; c.fill(); c.lineWidth = 2.6; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.roundRect(bx - 21, by - 2, 42, 5, 2.5); c.fill();
  for (const [dx, col] of [[-12, '#ff5a7a'], [0, '#ffd93b'], [12, '#7fe08a']] as [number, string][]) { ell(c, bx + dx, by + 12, 3.6, 3.6, col, OUT, 1.6); }
  // cup tray
  c.beginPath(); c.roundRect(x + 64, y - H + 8, 152, 72, 9); c.fillStyle = '#e8fbff'; c.fill(); c.lineWidth = 2.6; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = 'rgba(160,225,235,.45)'; c.beginPath(); c.roundRect(x + 68, y - H + 12, 144, 64, 6); c.fill();
  // little hanging menu: three flavour dots on the sign post
  void h;
}

export function drawBlenderDyn(ctx: CanvasRenderingContext2D, o: { t: number; blending: boolean; prog: number; type: number; queued: number }) {
  const x = BLENDER.x, y = BLENDER.y;
  const cols = o.type === 4 ? ['#ffc83a', '#f0a410'] : o.type === 8 ? ['#ff9a2e', '#e0620a'] : ['#b6ee6f', '#74c23a'];
  const jar = () => { ctx.beginPath(); ctx.moveTo(x - 17, y - 50); ctx.lineTo(x + 17, y - 50); ctx.lineTo(x + 13, y - 7); ctx.quadraticCurveTo(x, y - 2, x - 13, y - 7); ctx.closePath(); };
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  jar(); ctx.fillStyle = 'rgba(238,251,255,.7)'; ctx.fill();
  ctx.save(); jar(); ctx.clip();
  if (o.blending) {
    const lvl = 8 + 30 * Math.min(1, o.prog * 1.5);
    const g = ctx.createLinearGradient(0, y - 8 - lvl, 0, y);
    g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 20, y - 8);
    for (let k = 0; k <= 8; k++) ctx.lineTo(x - 20 + k * 5, y - 8 - lvl + Math.sin(o.t * 14 + k) * 1.8);
    ctx.lineTo(x + 20, y); ctx.lineTo(x - 20, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (let k = 0; k < 6; k++) { const bt = (o.t * 1.6 + k * 0.37) % 1; ctx.beginPath(); ctx.arc(x + Math.sin(k * 2.3 + o.t * 6) * 8, y - 9 - bt * lvl, 1.4 + (k % 3) * 0.5, 0, PI2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.4;
    for (let k = 0; k < 2; k++) { const a = o.t * 38 + k * PI; ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + Math.cos(a) * 11, y - 11 + Math.sin(a) * 2.4); ctx.stroke(); }
  } else if (o.queued > 0) {
    ctx.fillStyle = cols[0];
    for (let k = 0; k < Math.min(4, o.queued); k++) ell(ctx, x - 6 + k * 4, y - 12 - (k % 2) * 3, 4.4, 4.4, cols[k % 2], 'rgba(88,36,74,.5)', 1.2);
  }
  ctx.restore();
  jar(); ctx.lineWidth = 2.6; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 12, y - 44); ctx.lineTo(x - 9.4, y - 14); ctx.stroke();
  const lift = o.blending ? Math.abs(Math.sin(o.t * 30)) * 1.4 : 0;
  ctx.beginPath(); ctx.roundRect(x - 20, y - 58 - lift, 40, 9, 4); ctx.fillStyle = '#ff5f7a'; ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.stroke();
  ell(ctx, x, y - 61 - lift, 5, 3, '#ffd24a', OUT, 1.6);
  if (o.queued > 0) {
    ctx.beginPath(); ctx.roundRect(x - 15, y - 82, 30, 16, 8); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#2a9d8f'; ctx.stroke();
    ctx.font = '900 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#146a60'; ctx.fillText('+' + o.queued, x, y - 70);
  }
}

// ---------------- orange / apple trees (same silhouette idea as the mango tree, different canopy + fruit)
function paintFruitTreeBody(c: CanvasRenderingContext2D, kind: 'orange' | 'apple') {
  c.globalAlpha = 0.18; c.fillStyle = '#4a3a10';
  c.beginPath(); c.ellipse(8, 3, 44, 11, 0, 0, PI2); c.fill(); c.globalAlpha = 1;
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-7, -30, 0, CANOPY_Y + 6);
  c.strokeStyle = '#6b3f1b'; c.lineWidth = 19; c.stroke();
  c.strokeStyle = '#a46a33'; c.lineWidth = 13; c.stroke();
  c.strokeStyle = 'rgba(80,45,15,.35)'; c.lineWidth = 2;
  for (const yy of [-12, -26, -40]) { c.beginPath(); c.moveTo(-5, yy); c.lineTo(3, yy - 3); c.stroke(); }
  c.translate(0, CANOPY_Y);
  const orange = kind === 'orange';
  const C: [number, number, number][] = orange
    ? [[-34, 10, 24], [34, 10, 24], [0, 14, 28], [-22, -16, 25], [24, -16, 26], [0, -32, 24], [-4, -6, 34]]
    : [[-44, 12, 22], [44, 12, 22], [0, 16, 27], [-28, -10, 27], [30, -10, 27], [0, -28, 25], [-6, -2, 38]];
  const pal = orange ? ['#1d7a3a', '#2ea04a', '#4cc063', '#7fe08a'] : ['#2f8a3a', '#58b948', '#78d05c', '#a4e885'];
  c.strokeStyle = pal[0]; c.lineWidth = 5;
  for (const [cx, cy, r] of C) { c.beginPath(); c.arc(cx, cy, r, 0, PI2); c.stroke(); }
  c.fillStyle = pal[1]; for (const [cx, cy, r] of C) { c.beginPath(); c.arc(cx, cy, r, 0, PI2); c.fill(); }
  c.fillStyle = pal[2]; for (const [cx, cy, r] of C) { c.beginPath(); c.arc(cx - r * 0.2, cy - r * 0.25, r * 0.72, 0, PI2); c.fill(); }
  c.fillStyle = pal[3];
  for (const [cx, cy, r] of [[-22, -26, 10], [20, -30, 11], [-38, 2, 8], [4, -12, 8]] as [number, number, number][]) { c.beginPath(); c.arc(cx, cy, r, 0, PI2); c.fill(); }
  // blossoms
  c.fillStyle = orange ? '#ffffff' : '#ffc2d8';
  for (const [bx, by] of [[-30, -4], [18, -4], [-6, -30], [34, 12], [-40, 14]]) {
    for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(bx + Math.cos(k * 1.256) * 2.6, by + Math.sin(k * 1.256) * 2.6, 1.7, 0, PI2); c.fill(); }
    ell(c, bx, by, 1.4, 1.4, '#ffd93b');
  }
}

export function drawFruitTree(
  ctx: CanvasRenderingContext2D, x: number, y: number, t: number, fruit: number[], pop: number[], build: number, kind: 'orange' | 'apple',
) {
  const body = sprite('tree_' + kind, 230, 250, (c) => { c.translate(0, 85); paintFruitTreeBody(c, kind); });
  ctx.save();
  ctx.translate(x, y);
  if (build < 1) { const b = Math.max(0.01, easeBack(build)); ctx.scale(b, b); }
  ctx.rotate(Math.sin(t * 1.3 + x * 0.01) * 0.02);
  ctx.drawImage(body, -115, -210, 230, 250);
  ctx.translate(0, CANOPY_Y);
  for (let i = 0; i < MANGO_FR.length; i++) {
    const g = fruit[i];
    if (g <= 0.02) continue;
    const [fx, fy] = MANGO_FR[i];
    const ripe = g >= 1;
    const bob = ripe ? Math.sin(t * 4 + i * 2) * 1.6 : 0;
    ctx.strokeStyle = '#2f8a3c'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(fx, fy - 14); ctx.lineTo(fx, fy + 2 + bob); ctx.stroke();
    if (ripe) drawFruit(ctx, kind, fx, fy + 12 + bob, 0.95 * (1 + pop[i] * 0.3), Math.sin(t * 2 + i) * 0.1);
    else drawFruit(ctx, kind, fx, fy + 10, 0.4 + 0.5 * g, 0, true);
  }
  ctx.restore();
}

// ---------------- fishing boat (bow points to +x; flip = -1 turns it around)
function paintHull(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  const hull = () => {
    c.beginPath(); c.moveTo(-62, -6); c.lineTo(54, -8); c.quadraticCurveTo(64, -10, 72, -22); c.quadraticCurveTo(69, 12, 38, 19);
    c.lineTo(-36, 19); c.quadraticCurveTo(-60, 15, -62, -6); c.closePath();
  };
  hull();
  const g = c.createLinearGradient(0, -8, 0, 19); g.addColorStop(0, '#f2564a'); g.addColorStop(1, '#bf2419');
  c.fillStyle = g; c.fill();
  c.save(); hull(); c.clip();
  c.fillStyle = '#ffffff'; c.fillRect(-70, -6, 150, 7);
  c.strokeStyle = 'rgba(100,20,16,.35)'; c.lineWidth = 1.4;
  for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-64, 5 + k * 4.4); c.quadraticCurveTo(0, 7 + k * 4.4, 70, -4 + k * 3.4); c.stroke(); }
  c.fillStyle = 'rgba(60,10,10,.3)'; c.fillRect(-70, 14, 150, 8);
  for (const px of [-32, -9, 14]) { ell(c, px, 6, 3.7, 3.7, '#bfe9ff', OUT, 1.6); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(px - 1, 5, 1.1, 0, PI2); c.fill(); }
  c.restore();
  hull(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.strokeStyle = '#ffe2b0'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-60, -7); c.lineTo(54, -9); c.stroke();
}

function paintBoatBack(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = 'rgba(88,36,74,.6)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-10, -60); c.lineTo(70, -20); c.stroke();
  c.strokeStyle = OUT; c.lineWidth = 6.4; c.beginPath(); c.moveTo(-10, -6); c.lineTo(-10, -62); c.stroke();
  c.strokeStyle = '#c98b4b'; c.lineWidth = 3.6; c.stroke();
  c.beginPath(); c.moveTo(-9, -62); c.lineTo(14, -56); c.lineTo(-9, -49); c.closePath();
  c.fillStyle = '#ffd24a'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.roundRect(-58, -26, 26, 20, 3); c.fillStyle = '#c98b4b'; c.fill(); c.lineWidth = 2.4; c.stroke();
  c.strokeStyle = 'rgba(100,50,16,.5)'; c.lineWidth = 1.4;
  for (const yy of [-20, -14]) { c.beginPath(); c.moveTo(-57, yy); c.lineTo(-33, yy); c.stroke(); }
}

export function drawBoat(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, tilt: number, flip: number, fishN: number, passenger: (() => void) | null) {
  const hull = sprite('boatHull', 170, 90, paintHull);
  const back = sprite('boatBack', 170, 140, paintBoatBack);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.globalAlpha = 0.2; ctx.fillStyle = '#0b3a6a';
  ctx.beginPath(); ctx.ellipse(2, 20, 74, 9, 0, 0, PI2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.save(); ctx.scale(flip, 1); ctx.drawImage(back, -85, -70, 170, 140); ctx.restore();
  if (passenger) passenger();
  ctx.save();
  ctx.scale(flip, 1);
  const n = Math.min(fishN, 6);
  for (let i = 0; i < n; i++) drawFish(ctx, -44 + i * 12, -13 - (i % 2) * 5, i % 4, 0.8, ((i * 37) % 7) * 0.05 - 0.15, i % 2 ? -1 : 1, t * 5 + i);
  ctx.drawImage(hull, -85, -45, 170, 90);
  ctx.restore();
  // foam along the waterline
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let k = 0; k <= 16; k++) { const px = -68 + k * 9, py = 17 + Math.sin(t * 3 + k * 0.7) * 1.6; if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
  ctx.stroke();
  ctx.restore();
}

// ---------------- beach wagon: slatted tub on two big wheels, neat 3x2 cargo grid, a rigid tow pole is drawn by the game
export function drawWagon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, items: BagItem[], f: number, t: number, spin: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * f, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.globalAlpha = 0.2; ctx.fillStyle = '#3a2a10';
  ctx.beginPath(); ctx.ellipse(0, 3, 40, 6.4, 0, 0, PI2); ctx.fill(); ctx.globalAlpha = 1;
  // cargo: two rows, evenly spaced, sitting inside the tub (drawn first, the tub front hides their feet)
  const n = Math.min(items.length, 6);
  for (let k = n - 1; k >= 0; k--) {
    const col = k % 3, row = Math.floor(k / 3);
    product(ctx, items[k], -17 + col * 17, -33 - row * 13, 0.8, t, s);
  }
  // tub
  const tub = () => {
    ctx.beginPath();
    ctx.moveTo(-31, -30); ctx.lineTo(31, -30); ctx.lineTo(28, -8); ctx.quadraticCurveTo(27, -5, 24, -5);
    ctx.lineTo(-24, -5); ctx.quadraticCurveTo(-27, -5, -28, -8); ctx.closePath();
  };
  tub(); ctx.fillStyle = '#3fb4e6'; ctx.fill();
  ctx.save(); tub(); ctx.clip();
  ctx.fillStyle = 'rgba(20,70,120,.22)'; ctx.fillRect(-34, -12, 68, 8);
  ctx.fillStyle = '#ffd93b'; ctx.fillRect(-34, -21, 68, 4.4);
  ctx.strokeStyle = 'rgba(20,70,120,.4)'; ctx.lineWidth = 1.4;
  for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 9, -30); ctx.lineTo(k * 9 * 0.92, -5); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.34)'; ctx.fillRect(-34, -29, 68, 3);
  ctx.restore();
  tub(); ctx.lineWidth = 2.6; ctx.strokeStyle = OUT; ctx.stroke();
  // top rim
  ctx.beginPath(); ctx.roundRect(-33, -34, 66, 6.4, 3.2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2.2; ctx.stroke();
  ctx.fillStyle = '#ff6a5a'; ctx.beginPath(); ctx.arc(-26, -30.8, 1.6, 0, PI2); ctx.arc(26, -30.8, 1.6, 0, PI2); ctx.fill();
  // tow bracket on the front (the side where the pole attaches)
  ctx.beginPath(); ctx.roundRect(28, -22, 9, 7, 2.4); ctx.fillStyle = '#ffd93b'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  // wheels
  for (const wx of [-17, 17]) {
    ell(ctx, wx, -7, 10.4, 10.4, '#3a2a48', OUT, 2.2);
    ell(ctx, wx, -7, 7.2, 7.2, '#ffd93b', OUT, 1.6);
    ell(ctx, wx, -7, 2.6, 2.6, '#ffffff', OUT, 1.2);
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) { const a = spin + (k * PI) / 2 + wx; ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * 2.6, -7 + Math.sin(a) * 2.6); ctx.lineTo(wx + Math.cos(a) * 7, -7 + Math.sin(a) * 7); ctx.stroke(); }
  }
  ctx.restore();
}

// ---------------- beach umbrella (red / white) with curved gores, scalloped rim and a proper pole
export function paintUmbrella(c: CanvasRenderingContext2D, ux: number, base: number) {
  // pole shortened by ~40% (rim was base - 168, now base - 102) so the dome sits cute and cozy right above the table!
  const R = 90, N = 8, rim = base - 102, ap = rim - 48;
  c.lineJoin = 'round'; c.lineCap = 'round';
  ell(c, ux, base + 5, 17, 6.5, '#b88a56', OUT, 2.4);
  ell(c, ux, base + 3, 11, 4, '#d9ad78');
  c.strokeStyle = OUT; c.lineWidth = 8.4; c.beginPath(); c.moveTo(ux, base + 2); c.lineTo(ux, rim - 4); c.stroke();
  c.strokeStyle = '#ecd2a2'; c.lineWidth = 4.4; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(ux - 1.2, base); c.lineTo(ux - 1.2, rim); c.stroke();
  const xs = Array.from({ length: N + 1 }, (_, k) => ux - R * Math.cos((k * PI) / N));
  const mid = ap + (rim - ap) * 0.45;
  const dome = () => {
    c.beginPath(); c.moveTo(ux - R, rim);
    c.bezierCurveTo(ux - R, ap + 12, ux - R * 0.5, ap, ux, ap);
    c.bezierCurveTo(ux + R * 0.5, ap, ux + R, ap + 12, ux + R, rim);
    for (let k = N - 1; k >= 0; k--) c.quadraticCurveTo((xs[k] + xs[k + 1]) / 2, rim + 14, xs[k], rim);
    c.closePath();
  };
  dome(); c.fillStyle = '#ffffff'; c.fill();
  c.save(); dome(); c.clip();
  for (let k = 0; k < N; k += 2) {
    c.beginPath(); c.moveTo(ux, ap - 3);
    c.quadraticCurveTo(ux + (xs[k] - ux) * 0.96, mid, xs[k], rim + 16);
    c.lineTo(xs[k + 1], rim + 16);
    c.quadraticCurveTo(ux + (xs[k + 1] - ux) * 0.96, mid, ux, ap - 3);
    c.closePath(); c.fillStyle = '#ff4a5a'; c.fill();
  }
  c.strokeStyle = 'rgba(88,36,74,.45)'; c.lineWidth = 1.6;
  for (let k = 1; k < N; k++) { c.beginPath(); c.moveTo(ux, ap - 3); c.quadraticCurveTo(ux + (xs[k] - ux) * 0.96, mid, xs[k], rim + 14); c.stroke(); }
  const sh = c.createLinearGradient(ux - R, 0, ux + R, 0);
  sh.addColorStop(0, 'rgba(255,255,255,.2)'); sh.addColorStop(0.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(88,36,74,.24)');
  c.fillStyle = sh; c.fillRect(ux - R - 4, ap - 6, R * 2 + 8, 90);
  c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(ux - 32, ap + 22, 26, 8, -0.55, 0, PI2); c.fill();
  c.restore();
  dome(); c.lineWidth = 3.4; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(ux - 2.6, ap - 3); c.lineTo(ux, ap - 14); c.lineTo(ux + 2.6, ap - 3); c.closePath();
  c.fillStyle = '#ffe680'; c.fill(); c.lineWidth = 2; c.stroke();
  ell(c, ux, ap - 14, 3.4, 3.4, '#ffe680', OUT, 2);
  for (let k = 0; k <= N; k++) ell(c, xs[k], rim + 0.4, 2.1, 2.1, '#ffe680', OUT, 1.3);
}
