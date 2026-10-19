// ---------------------------------------------------------------
//  Kelp / sea-leaf: broad ruffled ribbons on a stipe with little air bladders (NOT grass blades)
// ---------------------------------------------------------------
import { sprite } from './sprites';

const PI = Math.PI;
const PI2 = PI * 2;
const EDGE = '#14583a';
const PALS: [string, string, string][] = [
  ['#2f9d5a', '#79e29a', '#1c6e40'],
  ['#1f8a6a', '#5fdcbc', '#126650'],
  ['#6aa22f', '#c0e868', '#476f1c'],
  ['#3b8f8f', '#8ae6d8', '#1f6464'],
];

/** One broad ribbon with a ruffled, scalloped edge, a light midrib and an outline. */
function ribbon(c: CanvasRenderingContext2D, bx: number, by: number, ang: number, len: number, wid: number, ph: number, pal: [string, string, string], curl: number) {
  const N = 22;
  const sk: number[][] = [];
  let x = bx, y = by;
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    sk.push([x, y]);
    const a = ang + curl * u + Math.sin(ph + u * 3.4) * 0.34 * u;
    x += Math.sin(a) * (len / N);
    y -= Math.cos(a) * (len / N);
  }
  const L: number[][] = [], R: number[][] = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const a = sk[Math.min(N, k + 1)], b = sk[Math.max(0, k - 1)];
    let tx = a[0] - b[0], ty = a[1] - b[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const nx = -ty, ny = tx;
    const base = wid * Math.sin(PI * Math.pow(0.1 + 0.9 * u, 0.82));
    const wl = Math.max(0.2, base * (1 + Math.sin(u * 19 + ph * 2) * 0.17));
    const wr = Math.max(0.2, base * (1 + Math.sin(u * 19 + ph * 2 + 1.7) * 0.17));
    L.push([sk[k][0] + nx * wl, sk[k][1] + ny * wl]);
    R.push([sk[k][0] - nx * wr, sk[k][1] - ny * wr]);
  }
  const shape = () => {
    c.beginPath();
    c.moveTo(L[0][0], L[0][1]);
    for (let k = 1; k <= N; k++) c.lineTo(L[k][0], L[k][1]);
    for (let k = N; k >= 0; k--) c.lineTo(R[k][0], R[k][1]);
    c.closePath();
  };
  shape();
  const g = c.createLinearGradient(sk[0][0], sk[0][1], sk[N][0], sk[N][1]);
  g.addColorStop(0, pal[2]); g.addColorStop(0.45, pal[0]); g.addColorStop(1, pal[1]);
  c.fillStyle = g; c.fill();
  c.save();
  shape(); c.clip();
  // lighter half + ribs
  c.beginPath();
  c.moveTo(sk[0][0], sk[0][1]);
  for (let k = 1; k <= N; k++) c.lineTo(sk[k][0], sk[k][1]);
  for (let k = N; k >= 0; k--) c.lineTo(L[k][0], L[k][1]);
  c.closePath();
  c.fillStyle = 'rgba(255,255,255,.17)'; c.fill();
  c.strokeStyle = 'rgba(14,80,50,.38)'; c.lineWidth = 1.1; c.lineCap = 'round';
  for (let k = 3; k < N - 1; k += 2) {
    c.beginPath(); c.moveTo(sk[k][0], sk[k][1]); c.lineTo(L[k][0] * 0.55 + sk[k][0] * 0.45, L[k][1] * 0.55 + sk[k][1] * 0.45); c.stroke();
    c.beginPath(); c.moveTo(sk[k][0], sk[k][1]); c.lineTo(R[k][0] * 0.55 + sk[k][0] * 0.45, R[k][1] * 0.55 + sk[k][1] * 0.45); c.stroke();
  }
  c.restore();
  c.beginPath();
  c.moveTo(sk[1][0], sk[1][1]);
  for (let k = 2; k < N; k++) c.lineTo(sk[k][0], sk[k][1]);
  c.strokeStyle = 'rgba(255,255,255,.38)'; c.lineWidth = 1.4; c.stroke();
  shape();
  c.lineJoin = 'round'; c.lineWidth = 2.3; c.strokeStyle = EDGE; c.stroke();
}

function bladder(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath(); c.arc(x, y, r, 0, PI2);
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.5, x, y, r);
  g.addColorStop(0, '#fff4a8'); g.addColorStop(1, '#d9a93a');
  c.fillStyle = g; c.fill();
  c.lineWidth = 1.7; c.strokeStyle = '#7a5410'; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.8)';
  c.beginPath(); c.arc(x - r * 0.35, y - r * 0.38, r * 0.28, 0, PI2); c.fill();
}

/** stage 1..4. Origin = base of the plant, growing upward. ph = sway phase. */
export function paintKelp(c: CanvasRenderingContext2D, stage: number, ph: number, seed = 0) {
  const k = [0.34, 0.56, 0.8, 1][Math.max(0, Math.min(3, stage - 1))];
  const n = [2, 3, 4, 5][Math.max(0, Math.min(3, stage - 1))];
  c.lineCap = 'round';
  // holdfast on the sea floor
  c.fillStyle = '#7a5a32';
  c.beginPath(); c.ellipse(0, 2, 8 * k + 2, 3.2, 0, 0, PI2); c.fill();
  c.lineWidth = 1.6; c.strokeStyle = '#3c2810'; c.stroke();
  // stipe
  c.strokeStyle = '#5a3a14'; c.lineWidth = 4.4; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.sin(ph) * 2, -14 * k, Math.sin(ph + 1) * 2.4, -26 * k); c.stroke();
  c.strokeStyle = '#9a7a3a'; c.lineWidth = 2.2; c.stroke();
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => Math.abs(b - (n - 1) / 2) - Math.abs(a - (n - 1) / 2));
  for (const i of order) {
    const side = (i - (n - 1) / 2) / Math.max(1, (n - 1) / 2);
    const len = (22 + 17 * (1 - Math.abs(side) * 0.45) + ((seed * 7 + i * 3) % 5)) * k + 6;
    const wid = (4.4 + 2.4 * k) * (0.92 + ((i + seed) % 3) * 0.06);
    const pal = PALS[(i + Math.floor(seed)) % PALS.length];
    const bx = side * 4.4 * k, by = -4 - (1 - Math.abs(side)) * 7 * k;
    ribbon(c, bx, by, side * 0.62, len, wid, ph + i * 1.3 + seed, pal, side * 0.5);
    if (stage >= 2) bladder(c, bx + side * 3, by - 2.4, 2.5 + 0.9 * k);
  }
}

/** Draws a growing kelp plant (g 0.06..1) from cached frames; gently sways. */
export function drawKelpPlant(ctx: CanvasRenderingContext2D, x: number, y: number, g: number, t: number, seed: number, pop = 0, big = false) {
  const stage = g >= 1 ? 4 : g > 0.66 ? 3 : g > 0.33 ? 2 : 1;
  const fr = Math.floor((((t * 1.3 + seed) % PI2) + PI2) % PI2 / PI2 * 6) % 6;
  const sd = Math.floor(Math.abs(seed)) % 3;
  const spr = sprite(`kelp${stage}_${fr}_${sd}`, 96, 98, (c) => { c.translate(0, 8); paintKelp(c, stage, (fr / 6) * PI2, sd); });
  const grow = 0.62 + 0.38 * Math.min(1, g);
  const s = (big ? 1.25 : 1) * grow * (1 + pop * 0.2);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 1.6 + seed) * 0.05);
  ctx.scale(s, s);
  ctx.drawImage(spr, -48, -90, 96, 98);
  ctx.restore();
}

function paintKelpItem(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  for (const [a, pal, len] of [[-0.5, PALS[1], 26], [0.5, PALS[2], 26], [0, PALS[0], 31]] as [number, [string, string, string], number][]) {
    ribbon(c, 0, 12, a, len, 6.4, a * 5 + 1, pal, a * 0.55);
  }
  // tie
  c.beginPath(); c.roundRect(-7, 7, 14, 5.4, 2.4); c.fillStyle = '#ff6a5a'; c.fill(); c.lineWidth = 1.7; c.strokeStyle = '#7a1f12'; c.stroke();
  bladder(c, 8.4, -4, 3);
}

export function drawKelpItem(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot = 0) {
  const spr = sprite('kelpItem', 60, 56, (c) => { c.translate(0, 8); paintKelpItem(c); });
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot * 0.5);
  ctx.scale(s, s);
  ctx.drawImage(spr, -30, -28, 60, 56);
  ctx.restore();
}
