// ---------------------------------------------------------------
//  Parachute treasure: neat canopy, hanging chest, collapse
// ---------------------------------------------------------------
import { sprite } from './sprites';

const PI = Math.PI;
const PI2 = Math.PI * 2;
const OUT = '#58244a';
const HANG = 122; // distance between the canopy rim and the chest centre
const RIM = 24;

function canopyRaw(c: CanvasRenderingContext2D) {
  // local (0,0) = sprite centre. Rim at y = RIM, apex at y = -48, half width 70.
  const R = 70, top = -48, N = 8;
  const xs = Array.from({ length: N + 1 }, (_, k) => -R * Math.cos((k * PI) / N));
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const dome = () => {
    c.beginPath();
    c.moveTo(-R, RIM);
    c.bezierCurveTo(-R, top + 8, -R * 0.5, top, 0, top);
    c.bezierCurveTo(R * 0.5, top, R, top + 8, R, RIM);
    for (let k = N - 1; k >= 0; k--) c.quadraticCurveTo((xs[k] + xs[k + 1]) / 2, RIM + 13, xs[k], RIM);
    c.closePath();
  };
  dome();
  c.fillStyle = '#fff6df';
  c.fill();
  c.save();
  dome();
  c.clip();
  const cols = ['#ff6f6a', '#ffd04a'];
  for (let k = 0; k < N; k += 2) {
    const x0 = xs[k], x1 = xs[k + 1];
    c.beginPath();
    c.moveTo(0, top - 3);
    c.quadraticCurveTo(x0 * 0.96, top + 26, x0, RIM + 16);
    c.lineTo(x1, RIM + 16);
    c.quadraticCurveTo(x1 * 0.96, top + 26, 0, top - 3);
    c.closePath();
    c.fillStyle = cols[(k / 2) % 2];
    c.fill();
  }
  // seams
  c.strokeStyle = 'rgba(88,36,74,.45)';
  c.lineWidth = 1.6;
  for (let k = 1; k < N; k++) {
    c.beginPath(); c.moveTo(0, top - 3); c.quadraticCurveTo(xs[k] * 0.96, top + 26, xs[k], RIM + 14); c.stroke();
  }
  // soft shading on the right + gloss on the left
  const sh = c.createLinearGradient(-R, 0, R, 0);
  sh.addColorStop(0, 'rgba(255,255,255,.22)');
  sh.addColorStop(0.45, 'rgba(255,255,255,0)');
  sh.addColorStop(1, 'rgba(88,36,74,.22)');
  c.fillStyle = sh;
  c.fillRect(-R - 4, top - 6, R * 2 + 8, 90);
  c.fillStyle = 'rgba(255,255,255,.5)';
  c.beginPath(); c.ellipse(-26, -22, 22, 7, -0.55, 0, PI2); c.fill();
  c.beginPath(); c.arc(-46, -2, 3, 0, PI2); c.fill();
  c.restore();
  dome();
  c.lineWidth = 3.4;
  c.strokeStyle = OUT;
  c.stroke();
  // little knob on top
  c.beginPath(); c.arc(0, top - 1, 4.6, 0, PI2);
  c.fillStyle = '#ffe680'; c.fill(); c.lineWidth = 2.2; c.stroke();
  // rim dots where the strings are tied
  for (let k = 0; k <= N; k++) {
    c.beginPath(); c.arc(xs[k], RIM + (k % 2 ? 1 : 0.4), 2.1, 0, PI2);
    c.fillStyle = '#ffe680'; c.fill(); c.lineWidth = 1.3; c.stroke();
  }
}

const ATTACH_Y = HANG - 34;
const canopyXs = () => Array.from({ length: 9 }, (_, k) => -70 * Math.cos((k * PI) / 8));
const canopySprite = () => sprite('canopy3', 170, 108, (c) => { c.translate(0, 6); canopyRaw(c); });

export function drawChest(ctx: CanvasRenderingContext2D, x: number, y: number, open: number, s = 1, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#3a2a10';
  ctx.beginPath(); ctx.ellipse(0, 25, 34, 8, 0, 0, PI2); ctx.fill();
  ctx.globalAlpha = 1;

  const strap = (x0: number, y0: number, w: number, h: number) => {
    ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 2);
    ctx.fillStyle = '#ffd24a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x0 + 1.4, y0 + 2, 1.8, h - 4);
  };
  const rivets = (x0: number, ys: number[]) => {
    ctx.fillStyle = '#b8860b';
    for (const yy of ys) { ctx.beginPath(); ctx.arc(x0, yy, 1.5, 0, PI2); ctx.fill(); }
  };

  const lid = (lift: number) => {
    ctx.save();
    ctx.translate(0, -2 - lift * 26);
    ctx.scale(1, 1 - 0.46 * lift);
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.bezierCurveTo(-28, -27, -15, -33, 0, -33);
    ctx.bezierCurveTo(15, -33, 28, -27, 28, 0);
    ctx.closePath();
    ctx.fillStyle = lift > 0.4 ? '#a35f2c' : '#d38d47';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(110,56,20,.45)'; ctx.lineWidth = 1.5;
    for (const k of [-12, -22]) { ctx.beginPath(); ctx.moveTo(-30, k); ctx.quadraticCurveTo(0, k - 6, 30, k); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,235,190,.35)';
    ctx.beginPath(); ctx.ellipse(-8, -25, 14, 3.2, -0.15, 0, PI2); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = OUT;
    ctx.beginPath();
    ctx.moveTo(-28, 0); ctx.bezierCurveTo(-28, -27, -15, -33, 0, -33); ctx.bezierCurveTo(15, -33, 28, -27, 28, 0); ctx.closePath();
    ctx.stroke();
    strap(-19, -30, 8, 31);
    strap(11, -30, 8, 31);
    ctx.beginPath(); ctx.roundRect(-30, -5, 60, 8, 3);
    ctx.fillStyle = '#ffd24a'; ctx.fill(); ctx.lineWidth = 2.4; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-27, -3.4, 54, 1.6);
    ctx.restore();
  };

  if (open > 0.05) {
    // glowing treasure inside
    ctx.fillStyle = `rgba(255,240,150,${0.55 * open})`;
    ctx.beginPath(); ctx.ellipse(0, -6, 40, 22, 0, 0, PI2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -2, 25, 7.5, 0, 0, PI2);
    ctx.fillStyle = '#ffeaa0'; ctx.fill();
    for (const [cx, cy, cr] of [[-12, -9, 5.4], [-2, -13, 6], [10, -10, 5.4], [-6, -5, 5], [7, -4, 5]]) {
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, PI2);
      ctx.fillStyle = '#ffd43b'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = '#b8860b'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(cx - cr * 0.3, cy - cr * 0.3, cr * 0.28, 0, PI2); ctx.fill();
    }
    ctx.fillStyle = '#6fe3ff';
    ctx.beginPath(); ctx.moveTo(14, -14); ctx.lineTo(19, -9); ctx.lineTo(14, -4); ctx.lineTo(9, -9); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OUT; ctx.stroke();
  }

  // box
  ctx.beginPath(); ctx.roundRect(-28, -2, 56, 28, 6);
  ctx.fillStyle = '#b97a3b'; ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-28, -2, 56, 28, 6); ctx.clip();
  ctx.strokeStyle = 'rgba(100,50,16,.5)'; ctx.lineWidth = 1.6;
  for (const k of [7, 15]) { ctx.beginPath(); ctx.moveTo(-30, k); ctx.lineTo(30, k); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,225,170,.3)'; ctx.fillRect(-28, -1, 56, 3);
  ctx.fillStyle = 'rgba(80,36,10,.22)'; ctx.fillRect(-28, 20, 56, 6);
  ctx.restore();
  ctx.lineWidth = 3; ctx.strokeStyle = OUT;
  ctx.beginPath(); ctx.roundRect(-28, -2, 56, 28, 6); ctx.stroke();
  strap(-19, -2, 8, 28); strap(11, -2, 8, 28);
  rivets(-15, [4, 20]); rivets(15, [4, 20]);
  // corner brackets
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sx * 28, 14); ctx.lineTo(sx * 28, 26); ctx.lineTo(sx * 21, 26); ctx.closePath();
    ctx.fillStyle = '#ffd24a'; ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
  }
  if (open < 0.05) lid(0);
  // lock plate
  ctx.beginPath(); ctx.roundRect(-8, -9, 16, 19, 4);
  ctx.fillStyle = '#ffe680'; ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(0, -1.5, 2.6, 0, PI2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-1.4, -1); ctx.lineTo(1.4, -1); ctx.lineTo(2.2, 6); ctx.lineTo(-2.2, 6); ctx.closePath(); ctx.fill();
  // twinkle
  const sh = (Math.sin(t * 5) + 1) / 2;
  ctx.globalAlpha = 0.45 + 0.5 * sh;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * PI2 - PI / 2, r = i % 2 ? 1.2 : 4 + sh * 2; ctx.lineTo(-22 + Math.cos(a) * r, 4 + Math.sin(a) * r); }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/** Canopy + strings + chest swinging underneath. (x, y) = chest centre. */
export function drawParachute(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, t: number) {
  ctx.save();
  ctx.translate(x, y - HANG);
  ctx.rotate(ang);
  const xs = canopyXs();
  ctx.lineCap = 'round';
  for (let k = 0; k < xs.length; k++) {
    ctx.beginPath(); ctx.moveTo(xs[k], -11); ctx.lineTo(0, ATTACH_Y);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 1.1; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, ATTACH_Y, 4.2, 0, PI2);
  ctx.fillStyle = '#ffd24a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.drawImage(canopySprite(), -85, -48 - 54 + 6 + 0, 170, 108);
  drawChest(ctx, 0, HANG, 0, 1, t);
  ctx.restore();
}

/** Canopy that has lost its load: deflates, drifts down and fades. k = 0..1 */
export function drawCanopyDown(ctx: CanvasRenderingContext2D, x: number, y: number, k: number) {
  const e = 1 - (1 - k) * (1 - k);
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - Math.max(0, k - 0.45) * 1.8);
  ctx.translate(x + e * 36, y - HANG + e * (HANG - 4));
  ctx.scale(1 + 0.3 * e, Math.max(0.08, 1 - 0.86 * e));
  ctx.rotate(e * 0.25);
  ctx.drawImage(canopySprite(), -85, -96, 170, 108);
  ctx.restore();
}
