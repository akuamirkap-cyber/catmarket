// ---------------------------------------------------------------
//  Beach / sea decoration helpers
// ---------------------------------------------------------------
import { drawMango } from './fish';
import { sprite } from './sprites';
import { drawKelpPlant } from './kelp';

const PI = Math.PI;

export function star4(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2 + rot - PI / 2;
    const rr = i % 2 ? r * 0.28 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawStarfish(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * PI * 2 - PI / 2;
    const r = i % 2 ? 6 : 15;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = '#ff8a5c';
  ctx.strokeStyle = '#d9603a';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd1b8';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * PI * 2 - PI / 2;
    ctx.beginPath(); ctx.arc(Math.cos(a) * 7, Math.sin(a) * 7, 1.3, 0, PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawShell(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.quadraticCurveTo(-16, 0, -12, -9);
  ctx.quadraticCurveTo(0, -16, 12, -9);
  ctx.quadraticCurveTo(16, 0, 0, 8);
  ctx.closePath();
  ctx.fillStyle = '#ffc2d4';
  ctx.strokeStyle = '#e88aa8';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1.2;
  for (const a of [-0.6, -0.2, 0.2, 0.6]) {
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(Math.sin(a) * 15, -9 + Math.abs(a) * 3);
    ctx.stroke();
  }
  ctx.fillStyle = '#e88aa8';
  ctx.fillRect(-4, 7, 8, 3);
  ctx.restore();
}

function drawRockRaw(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#10304a';
  ctx.beginPath(); ctx.ellipse(4, 4, 30, 9, 0, 0, PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(-26, 2);
  ctx.quadraticCurveTo(-28, -16, -8, -20);
  ctx.quadraticCurveTo(10, -26, 22, -10);
  ctx.quadraticCurveTo(32, 0, 24, 4);
  ctx.closePath();
  ctx.fillStyle = '#9aa4b4';
  ctx.strokeStyle = '#646e80';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b8c1cf';
  ctx.beginPath(); ctx.ellipse(-8, -12, 10, 5, -0.3, 0, PI * 2); ctx.fill();
  ctx.fillStyle = '#7e889a';
  ctx.beginPath(); ctx.ellipse(12, -2, 8, 4, 0.2, 0, PI * 2); ctx.fill();
  ctx.restore();
}

function drawCoralRaw(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.strokeStyle = col;
  ctx.lineWidth = 5;
  for (const [ax, ay, bx, by] of [[0, 0, 0, -22], [0, -10, -10, -22], [0, -12, 11, -24], [-10, -22, -14, -30], [11, -24, 15, -32]]) {
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  for (const [px, py] of [[0, -23], [-10, -23], [11, -25], [-14, -31], [15, -33]]) {
    ctx.beginPath(); ctx.arc(px, py, 2.2, 0, PI * 2); ctx.fill();
  }
  ctx.restore();
}

export interface GullState { x: number; y: number; dir: number; ph: number }

const GL = '#8a98b2';
const GN = 16;

interface WingGeom { P: number[][]; F: number[][]; B: number[][] }

/** Wing = a skeleton that bends (the tip lags behind the shoulder) with a leading and a trailing edge. */
function wingGeom(f: number, k: number, lagPhase: number, tipLag: number): WingGeom {
  const mid = -1.2, amp = 0.98;
  const aRoot = mid + amp * Math.cos(f + lagPhase);
  const aTip = mid + amp * Math.cos(f + lagPhase - tipLag);
  const step = (44 * k) / GN;
  const P: number[][] = [], F: number[][] = [], B: number[][] = [];
  let x = -2, y = -4;
  for (let i = 0; i <= GN; i++) {
    const u = i / GN;
    const a = aRoot + (aTip - aRoot) * Math.pow(u, 1.25);
    const dx = Math.sin(a), dy = -Math.cos(a), nx = Math.cos(a), ny = Math.sin(a);
    const wf = (4.4 * Math.pow(1 - u, 0.55) + 0.5 * (1 - u)) * k;
    const wb = 9.6 * Math.pow(1 - Math.pow(u, 1.5), 0.9) * k;
    P.push([x, y]); F.push([x + nx * wf, y + ny * wf]); B.push([x - nx * wb, y - ny * wb]);
    x += dx * step; y += dy * step;
  }
  return { P, F, B };
}

const wingOutline = (g: WingGeom) => [...g.F, ...g.B.slice(0, GN).reverse()];

function smoothClosed(c: CanvasRenderingContext2D, pts: number[][]) {
  const n = pts.length;
  c.beginPath();
  c.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  c.closePath();
}

function wingFill(c: CanvasRenderingContext2D, g: WingGeom, col: { base: string; mid: string; tip: string }) {
  smoothClosed(c, wingOutline(g));
  c.fillStyle = col.base;
  c.fill();
  c.save();
  smoothClosed(c, wingOutline(g));
  c.clip();
  const band = (i1: number, i2: number, color: string) => {
    c.beginPath();
    for (let i = i1; i <= i2; i++) { if (i === i1) c.moveTo(g.F[i][0], g.F[i][1]); else c.lineTo(g.F[i][0], g.F[i][1]); }
    for (let i = i2; i >= i1; i--) c.lineTo(g.B[i][0], g.B[i][1]);
    c.closePath();
    c.fillStyle = color;
    c.fill();
  };
  band(Math.round(GN * 0.45), Math.round(GN * 0.7), col.mid);
  band(Math.round(GN * 0.7), GN, col.tip);
  // feather lines (inside the wing only)
  c.strokeStyle = 'rgba(120,135,160,.5)';
  c.lineWidth = 1.2;
  c.lineCap = 'round';
  for (let i = 3; i < GN - 1; i += 3) {
    c.beginPath();
    c.moveTo(g.B[i][0], g.B[i][1]);
    c.lineTo(g.P[i][0] + (g.F[i][0] - g.P[i][0]) * 0.2, g.P[i][1] + (g.F[i][1] - g.P[i][1]) * 0.2);
    c.stroke();
  }
  c.restore();
}

/**
 * The gull is drawn in two passes: first every outline (far wing, tail, body, head, near wing),
 * then every fill. Because the fills come later, the outline between wing root / tail / neck and the body
 * disappears (they merge) while the different colours + a soft shadow keep them separate parts.
 */
function gullRaw(c: CanvasRenderingContext2D, fr: number) {
  const f = (fr / 10) * PI * 2;
  const far = wingGeom(f, 0.92, -0.55, 0.9);
  const near = wingGeom(f, 1, 0, 0.9);
  c.lineJoin = 'round';
  c.lineCap = 'round';

  // ---- pass 1: outlines
  c.strokeStyle = GL;
  c.lineWidth = 4.6;
  smoothClosed(c, wingOutline(far)); c.stroke();
  c.beginPath(); c.moveTo(-12, -3); c.lineTo(-28, -9.5); c.lineTo(-27, 3.5); c.lineTo(-12, 4); c.closePath(); c.stroke();
  c.beginPath(); c.ellipse(0, 0, 16, 8.4, -0.08, 0, PI * 2); c.stroke();
  c.beginPath(); c.arc(14, -5.5, 6.4, 0, PI * 2); c.stroke();
  smoothClosed(c, wingOutline(near)); c.stroke();

  // ---- pass 2: fills
  wingFill(c, far, { base: '#d3dae6', mid: '#8794ad', tip: '#2a3550' });
  // tail
  c.beginPath(); c.moveTo(-12, -3); c.lineTo(-28, -9.5); c.lineTo(-27, 3.5); c.lineTo(-12, 4); c.closePath();
  c.fillStyle = '#e8edf5'; c.fill();
  c.fillStyle = '#4b5873'; c.fillRect(-27.5, -5.6, 3.4, 7);
  // tucked orange legs (behind the body)
  c.strokeStyle = '#ff9a2e'; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(1, 6); c.lineTo(-5, 10); c.lineTo(-10, 9.5); c.stroke();
  // body
  c.beginPath(); c.ellipse(0, 0, 16, 8.4, -0.08, 0, PI * 2);
  c.fillStyle = '#ffffff'; c.fill();
  c.save();
  c.clip();
  c.fillStyle = '#e6edf6';
  c.beginPath(); c.ellipse(0, 7, 18, 5, 0, 0, PI * 2); c.fill();
  // soft shadow the near wing casts on the body (separates the parts without any outline)
  c.save();
  c.translate(1.4, 3.2);
  smoothClosed(c, wingOutline(near));
  c.fillStyle = 'rgba(104,122,156,.26)';
  c.fill();
  c.restore();
  c.restore();
  // head
  c.beginPath(); c.arc(14, -5.5, 6.4, 0, PI * 2);
  c.fillStyle = '#ffffff'; c.fill();
  // beak
  c.beginPath();
  c.moveTo(19.4, -7.4); c.lineTo(28, -5.6); c.quadraticCurveTo(28.6, -4.4, 27, -3.8); c.lineTo(19.6, -2.6); c.closePath();
  c.fillStyle = '#ffb02e'; c.fill();
  c.lineWidth = 1.6; c.strokeStyle = '#c97d0a'; c.stroke();
  c.fillStyle = '#ff4d4d';
  c.beginPath(); c.arc(25.6, -3.9, 1.1, 0, PI * 2); c.fill();
  // eye + cheek
  c.fillStyle = '#2b1b2e';
  c.beginPath(); c.arc(16, -7.4, 2, 0, PI * 2); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(16.6, -8.1, 0.8, 0, PI * 2); c.fill();
  c.globalAlpha = 0.5;
  c.fillStyle = '#ff9aa8';
  c.beginPath(); c.ellipse(13, -2.6, 2.2, 1.3, 0, 0, PI * 2); c.fill();
  c.globalAlpha = 1;
  // near wing last: it covers the root outline, so wing and body merge there
  wingFill(c, near, { base: '#f6f8fd', mid: '#b4c0d4', tip: '#38445e' });
}

export function drawGull(ctx: CanvasRenderingContext2D, g: GullState) {
  const fr = Math.floor((((g.ph / (PI * 2)) % 1) + 1) % 1 * 10) % 10;
  const spr = sprite('gull2_' + fr, 124, 118, (c) => gullRaw(c, fr));
  const bob = Math.sin(g.ph * 0.5) * 3;
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#10304a';
  ctx.beginPath(); ctx.ellipse(g.x + 16, g.y + 44, 17, 7, 0, 0, PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(g.x, g.y + bob);
  ctx.scale(g.dir * 1.2, 1.2);
  ctx.drawImage(spr, -62, -59, 124, 118);
  ctx.restore();
}

export function drawCrab(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, moving: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#4a3a10';
  ctx.beginPath(); ctx.ellipse(0, 6, 13, 4, 0, 0, PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#d6453a';
  ctx.lineWidth = 2.4;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const w = Math.sin(t * 16 + i * 1.7 + (s > 0 ? 1 : 0)) * 2 * moving;
      ctx.beginPath();
      ctx.moveTo(s * 6, 2 + i * 2);
      ctx.lineTo(s * (11 + i), 3 + i * 2.5 + w);
      ctx.lineTo(s * (13 + i), 7 + i * 2);
      ctx.stroke();
    }
    const up = Math.sin(t * 5 + s) * 1.2;
    ctx.beginPath();
    ctx.moveTo(s * 7, -1);
    ctx.lineTo(s * 12, -6 + up);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 13, -9 + up, 4.2, 0.4, PI * 1.55);
    ctx.fillStyle = '#ff6a58';
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(0, 1, 9, 6.5, 0, 0, PI * 2);
  ctx.fillStyle = '#ff6a58';
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.stroke();
  for (const s of [-1, 1]) {
    ctx.strokeStyle = '#d6453a';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(s * 3, -4); ctx.lineTo(s * 3.5, -8); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 3.5, -9, 2.4, 0, PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(s * 3.5, -8.6, 1.2, 0, PI * 2); ctx.fill();
  }
  ctx.restore();
}



// ---------------------------------------------------------------
//  Sprite-backed versions (drawn thousands of times, painted once)
// ---------------------------------------------------------------
export function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const spr = sprite('rock', 96, 64, (c) => drawRockRaw(c, 0, 0, 1));
  ctx.drawImage(spr, x - 48 * s, y - 32 * s, 96 * s, 64 * s);
}

export function drawCoral(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  const spr = sprite('coral' + col, 56, 60, (c) => { c.translate(0, 17); drawCoralRaw(c, 0, 0, 1, col); });
  ctx.drawImage(spr, x - 28 * s, y - 47 * s, 56 * s, 60 * s);
}

export function drawSeaweed(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawKelpPlant(ctx, x, y + 6, 1, t, x * 0.05);
}

// ---------------------------------------------------------------
//  Coconut palm: curved ringed trunk, serrated fronds, coconuts that ripen and drop
// ---------------------------------------------------------------
export const PALM_CROWN = { x: 12, y: -112 };
/** where each coconut hangs from (stem). The nut itself hangs below this point. */
export const PALM_NUT: [number, number][] = [[-17, 5], [17, 6], [0, 15]];
/** coconut radius at growth g (2x the old size); a fallen coconut keeps the ripe radius */
export const nutR = (g: number) => 2 * (3.4 + 6.4 * g);
export interface Nut { g: number; shake: number }

const TRUNK_P: [number, number][] = [[0, 0], [-12, -40], [25, -75], [12, -112]];
function trunkAt(u: number): [number, number] {
  const m = 1 - u, [a, b, c, d] = TRUNK_P;
  const k0 = m * m * m, k1 = 3 * m * m * u, k2 = 3 * m * u * u, k3 = u * u * u;
  return [k0 * a[0] + k1 * b[0] + k2 * c[0] + k3 * d[0], k0 * a[1] + k1 * b[1] + k2 * c[1] + k3 * d[1]];
}

function paintTrunk(c: CanvasRenderingContext2D) {
  const N = 26;
  const L: number[][] = [], R: number[][] = [], M: number[][] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const [x, y] = trunkAt(u);
    const [x2, y2] = trunkAt(Math.min(1, u + 0.01)), [x1, y1] = trunkAt(Math.max(0, u - 0.01));
    let tx = x2 - x1, ty = y2 - y1;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const nx = -ty, ny = tx;
    const hw = 9.6 - 5 * u + Math.max(0, 1 - u * 6) * 5.2; // tapers upward, flares at the root
    L.push([x + nx * hw, y + ny * hw]); R.push([x - nx * hw, y - ny * hw]); M.push([x, y, nx, ny, hw]);
  }
  const path = () => {
    c.beginPath();
    c.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i <= N; i++) c.lineTo(L[i][0], L[i][1]);
    for (let i = N; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
    c.quadraticCurveTo(M[0][0], 6, L[0][0], L[0][1]);
    c.closePath();
  };
  c.lineJoin = 'round';
  c.lineCap = 'round';
  path();
  const g = c.createLinearGradient(-16, 0, 32, 0);
  g.addColorStop(0, '#9a6330');
  g.addColorStop(0.45, '#c68d4b');
  g.addColorStop(1, '#8a5628');
  c.fillStyle = g;
  c.fill();
  c.save();
  path();
  c.clip();
  // growth rings
  for (let k = 0; k < 15; k++) {
    const m = M[Math.round(((k + 0.6) / 15) * N)];
    const w = m[4] + 2;
    c.strokeStyle = 'rgba(84,48,20,.5)';
    c.lineWidth = 1.7;
    c.beginPath();
    c.moveTo(m[0] + m[2] * w, m[1] + m[3] * w);
    c.quadraticCurveTo(m[0], m[1] + 2.6, m[0] - m[2] * w, m[1] - m[3] * w);
    c.stroke();
    c.strokeStyle = 'rgba(255,224,170,.22)';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(m[0] + m[2] * w, m[1] + m[3] * w - 2.4);
    c.quadraticCurveTo(m[0], m[1] + 0.2, m[0] - m[2] * w, m[1] - m[3] * w - 2.4);
    c.stroke();
  }
  // light on the left, shade on the right
  const side = (off: number, col: string, lw: number) => {
    c.strokeStyle = col;
    c.lineWidth = lw;
    c.beginPath();
    for (let i = 1; i < N; i++) {
      const m = M[i], sg = m[2] > 0 ? -1 : 1;
      const x = m[0] + sg * m[2] * m[4] * off, y = m[1] + sg * m[3] * m[4] * off;
      if (i === 1) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
  };
  side(0.46, 'rgba(255,232,185,.4)', 2.6);
  side(-0.62, 'rgba(70,35,10,.28)', 3.4);
  c.restore();
  path();
  c.lineWidth = 4.4;
  c.strokeStyle = '#5b3517';
  c.stroke();
}

/** 2x bigger fronds (lengths 108..132), lush tropical angles */
const FRONDS: [number, number, number][] = [
  [-3.05, 118, 0.48], [-2.62, 130, 0.40], [-2.15, 132, 0.30], [-1.80, 120, 0.20], [-1.50, 108, 0.14],
  [-1.20, 120, 0.20], [-0.90, 132, 0.30], [-0.50, 130, 0.40], [-0.10, 118, 0.48],
];

function paintFrond(c: CanvasRenderingContext2D, ang: number, len: number, droop: number, ph: number, i: number) {
  const M = 18;
  const sk: number[][] = [];
  for (let k = 0; k <= M; k++) {
    const u = k / M;
    const a = ang + Math.sin(ph + i * 0.9 + u * 1.6) * 0.065 * u;
    sk.push([Math.cos(a) * len * u, Math.sin(a) * len * u + droop * len * u * u]);
  }
  const nrm = (k: number) => {
    const a = sk[Math.min(M, k + 1)], b = sk[Math.max(0, k - 1)];
    let tx = a[0] - b[0], ty = a[1] - b[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    return [-ty, tx];
  };
  const sg = nrm(Math.round(M / 2))[1] <= 0 ? 1 : -1;
  const up: number[][] = [], lo: number[][] = [];
  for (let k = 0; k <= M; k++) {
    const u = k / M, [nx, ny] = nrm(k);
    // 2x wider, cute rounded scallop leaflets
    let w = 16.5 * Math.pow(Math.sin(PI * Math.pow(u, 0.7)), 0.85);
    if (k > 1 && k < M) w *= (k % 2 ? 0.84 : 1.12);
    up.push([sk[k][0] + nx * sg * w, sk[k][1] + ny * sg * w]);
    lo.push([sk[k][0] - nx * sg * w, sk[k][1] - ny * sg * w]);
  }
  const leaf = () => {
    c.beginPath();
    c.moveTo(up[0][0], up[0][1]);
    for (let k = 1; k <= M; k++) c.lineTo(up[k][0], up[k][1]);
    for (let k = M; k >= 0; k--) c.lineTo(lo[k][0], lo[k][1]);
    c.closePath();
  };
  leaf();
  c.fillStyle = '#2ea642';
  c.fill();
  c.beginPath();
  c.moveTo(sk[0][0], sk[0][1]);
  for (let k = 1; k <= M; k++) c.lineTo(sk[k][0], sk[k][1]);
  for (let k = M; k >= 0; k--) c.lineTo(up[k][0], up[k][1]);
  c.closePath();
  c.fillStyle = '#5bd669';
  c.fill();
  c.beginPath();
  c.moveTo(sk[0][0], sk[0][1]);
  for (let k = 1; k <= M; k++) c.lineTo(sk[k][0], sk[k][1]);
  c.strokeStyle = 'rgba(20,90,40,.55)';
  c.lineWidth = 2.2;
  c.stroke();
  leaf();
  c.lineWidth = 3.2;
  c.strokeStyle = '#185828';
  c.stroke();
}
function paintCrown(c: CanvasRenderingContext2D, ph: number) {
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const order = FRONDS.map((f, i) => ({ f, i })).sort((a, b) => Math.abs(a.f[0] + 1.5) - Math.abs(b.f[0] + 1.5));
  for (const { f, i } of order) paintFrond(c, f[0], f[1], f[2], ph, i);
  // brown boot where the fronds join
  c.beginPath(); c.ellipse(0, 1, 8.5, 6, 0, 0, PI * 2);
  c.fillStyle = '#8a5a2e'; c.fill();
  c.lineWidth = 2.4; c.strokeStyle = '#4a2c12'; c.stroke();
}

function paintCoconut(c: CanvasRenderingContext2D, ripe: boolean) {
  c.lineJoin = 'round';
  const g = c.createRadialGradient(-3.5, -4, 1.5, 0, 0, 12);
  if (ripe) { g.addColorStop(0, '#c08850'); g.addColorStop(1, '#774a22'); }
  else { g.addColorStop(0, '#b4e878'); g.addColorStop(1, '#58a838'); }
  c.beginPath(); c.arc(0, 0, 11, 0, PI * 2);
  c.fillStyle = g; c.fill();
  c.save();
  c.beginPath(); c.arc(0, 0, 11, 0, PI * 2); c.clip();
  c.strokeStyle = ripe ? 'rgba(52,26,8,.42)' : 'rgba(36,98,24,.35)';
  c.lineWidth = 1.2;
  for (const k of [-6, -2, 2, 6]) { c.beginPath(); c.ellipse(0, 0, Math.abs(k) + 3, 12, 0, PI * 1.5 - 1.2 + (k < 0 ? 0 : 0), PI * 1.5 + 1.2); c.stroke(); }
  c.restore();
  c.beginPath(); c.arc(0, 0, 11, 0, PI * 2);
  c.lineWidth = 2.3; c.strokeStyle = ripe ? '#3d2412' : '#2f6a22'; c.stroke();
  if (ripe) {
    c.fillStyle = 'rgba(36,18,6,.8)';
    for (const [x, y] of [[-3.2, -5.2], [3.2, -5.2], [0, -1.8]]) { c.beginPath(); c.arc(x, y, 1.35, 0, PI * 2); c.fill(); }
  }
  c.fillStyle = 'rgba(255,255,255,.42)';
  c.beginPath(); c.ellipse(-4.2, -5.6, 3.4, 2, -0.6, 0, PI * 2); c.fill();
}

export function drawCoconut(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ripe: boolean, rot = 0) {
  const spr = sprite(ripe ? 'cocoB2' : 'cocoG2', 68, 68, (c) => { c.scale(2, 2); paintCoconut(c, ripe); });
  const k = r / 22;
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.drawImage(spr, -34 * k, -34 * k, 68 * k, 68 * k);
  ctx.restore();
}

function paintPalmShadow(c: CanvasRenderingContext2D) {
  // sun comes from the upper left: the shadow falls to the lower right. Origin = foot of the trunk.
  c.lineCap = 'round';
  // trunk shadow: a tapered soft strip
  const tg = c.createLinearGradient(0, 0, 60, 14);
  tg.addColorStop(0, 'rgba(60,44,16,.26)');
  tg.addColorStop(1, 'rgba(60,44,16,.1)');
  c.fillStyle = tg;
  c.beginPath();
  c.moveTo(-8, -3); c.lineTo(58, 4); c.lineTo(58, 12); c.lineTo(-8, 7);
  c.closePath(); c.fill();
  // crown shadow: soft layered ellipses
  for (const [rx, ry, a] of [[50, 15, 0.1], [42, 12, 0.1], [32, 9, 0.1]] as [number, number, number][]) {
    c.fillStyle = `rgba(60,44,16,${a})`;
    c.beginPath(); c.ellipse(58, 8, rx, ry, 0.06, 0, PI * 2); c.fill();
  }
  // contact shadow at the foot
  c.fillStyle = 'rgba(60,44,16,.2)';
  c.beginPath(); c.ellipse(2, 3, 17, 6, 0, 0, PI * 2); c.fill();
}

export function drawPalm(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, nuts?: Nut[]) {
  const sh = sprite('palmSh3', 220, 90, (c) => { c.translate(-40, -10); paintPalmShadow(c); });
  ctx.drawImage(sh, x - 70 * s, y - 35 * s, 220 * s, 90 * s);
  const tr = sprite('palmT3', 170, 190, (c) => { c.translate(0, 65); paintTrunk(c); });
  ctx.drawImage(tr, x - 85 * s, y - 160 * s, 170 * s, 190 * s);
  const ph = t * 1.5 + x * 0.013;
  const fr = Math.floor((((ph % (PI * 2)) + PI * 2) % (PI * 2)) / (PI * 2) * 8) % 8;
  const crown = sprite('palmC3_' + fr, 380, 260, (c) => {
    c.translate(0, 30);
    paintCrown(c, (fr / 8) * PI * 2);
  });
  ctx.save();
  ctx.translate(x + PALM_CROWN.x * s, y + PALM_CROWN.y * s);
  ctx.rotate(Math.sin(ph) * 0.022);
  ctx.drawImage(crown, -190 * s, -160 * s, 380 * s, 260 * s);
  if (nuts) {
    for (let i = 0; i < nuts.length && i < PALM_NUT.length; i++) {
      const n = nuts[i];
      if (n.g < 0.05) continue;
      const r = nutR(n.g) * s;
      // hangs from its stem and swings like a pendulum when it is about to drop
      ctx.save();
      ctx.translate(PALM_NUT[i][0] * s, PALM_NUT[i][1] * s);
      ctx.rotate(Math.sin(t * 27 + i * 1.9) * 0.2 * n.shake);
      ctx.strokeStyle = '#2f7a38';
      ctx.lineWidth = 2.6 * s;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -3 * s); ctx.lineTo(0, r * 0.35); ctx.stroke();
      drawCoconut(ctx, 0, r * 0.92, r, n.g >= 1, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------
//  Mango tree
// ---------------------------------------------------------------
/** hanging fruit anchor points (relative to the canopy centre) */
export const MANGO_FR: [number, number][] = [[-30, 26], [3, 33], [33, 23]];
export const CANOPY_Y = -66;

const easeBack = (k: number) => (k >= 1 ? 1 : 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2));

function paintTreeBody(c: CanvasRenderingContext2D) {
  c.globalAlpha = 0.18;
  c.fillStyle = '#4a3a10';
  c.beginPath(); c.ellipse(8, 3, 44, 11, 0, 0, PI * 2); c.fill();
  c.globalAlpha = 1;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(-7, -30, 0, -CANOPY_Y * -1 + 6);
  c.strokeStyle = '#6b3f1b';
  c.lineWidth = 19;
  c.stroke();
  c.strokeStyle = '#a46a33';
  c.lineWidth = 13;
  c.stroke();
  c.strokeStyle = 'rgba(80,45,15,.35)';
  c.lineWidth = 2;
  for (const yy of [-12, -26, -40]) { c.beginPath(); c.moveTo(-5, yy); c.lineTo(3, yy - 3); c.stroke(); }
  c.translate(0, CANOPY_Y);
  const C: [number, number, number][] = [[-36, 8, 27], [36, 8, 27], [0, 12, 31], [-22, -22, 27], [24, -22, 28], [0, -34, 30], [-4, -8, 36]];
  c.lineJoin = 'round';
  c.strokeStyle = '#1f7a35';
  c.lineWidth = 5;
  for (const [cx, cy, r] of C) { c.beginPath(); c.arc(cx, cy, r, 0, PI * 2); c.stroke(); }
  c.fillStyle = '#3fb552';
  for (const [cx, cy, r] of C) { c.beginPath(); c.arc(cx, cy, r, 0, PI * 2); c.fill(); }
  c.fillStyle = '#58cc66';
  for (const [cx, cy, r] of C) { c.beginPath(); c.arc(cx - r * 0.2, cy - r * 0.25, r * 0.72, 0, PI * 2); c.fill(); }
  c.fillStyle = '#7fe08a';
  for (const [cx, cy, r] of [[-22, -30, 11], [20, -34, 12], [-40, 0, 9], [4, -14, 8]] as [number, number, number][]) { c.beginPath(); c.arc(cx, cy, r, 0, PI * 2); c.fill(); }
  c.strokeStyle = 'rgba(30,110,50,.45)';
  c.lineWidth = 2;
  for (const [lx, ly] of [[-30, -2], [-10, -26], [16, -10], [30, -30], [-4, 16], [38, 4]]) {
    c.beginPath(); c.moveTo(lx, ly); c.quadraticCurveTo(lx + 4, ly - 5, lx + 9, ly - 3); c.stroke();
  }
}

export function drawMangoTree(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, fruit: number[], pop: number[], build = 1) {
  const body = sprite('mangotree2', 230, 250, (c) => { c.translate(0, 85); paintTreeBody(c); });
  ctx.save();
  ctx.translate(x, y);
  if (build < 1) { const b = Math.max(0.01, easeBack(build)); ctx.scale(b, b); }
  const sway = Math.sin(t * 1.3 + x * 0.01) * 0.02;
  ctx.rotate(sway);
  ctx.drawImage(body, -115, -210, 230, 250);
  ctx.translate(0, CANOPY_Y);

  for (let i = 0; i < MANGO_FR.length; i++) {
    const g = fruit[i];
    if (g <= 0.02) continue;
    const [fx, fy] = MANGO_FR[i];
    const ripe = g >= 1;
    const bob = ripe ? Math.sin(t * 4 + i * 2) * 1.6 : 0;
    ctx.strokeStyle = '#2f8a3c';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(fx, fy - 14); ctx.lineTo(fx, fy + 2 + bob); ctx.stroke();
    if (ripe) {
      drawMango(ctx, fx, fy + 12 + bob, 0.95 * (1 + pop[i] * 0.3), Math.sin(t * 2 + i) * 0.1, 1);
    } else {
      drawMango(ctx, fx, fy + 10, 0.4 + 0.5 * g, 0, 1, true);
    }
  }
  ctx.restore();
}
