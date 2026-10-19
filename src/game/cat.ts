// ---------------------------------------------------------------
//  Cute chibi cats (thick plum outline, big round eyes): physics + animation + drawing
// ---------------------------------------------------------------
import { drawItem } from './fish';
import { star4 } from './scenery';

const PI = Math.PI;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** cat-space height (above the feet) of the carried fish basket */
const OUT = '#58244a'; // signature plum outline

// ---------------------------------------------------------------
//  Adjustable proportions. Multipliers are relative to the ORIGINAL cat:
//  defaults = the user's tuned values (head 1.1, eye gap 1.1, belly 1.3 x 1.3, legs 1.05, leg gap 1.2, head lift +1.5, eye size 1.05,
//  eye Y -3.5, ear angle +16, ear width 1.2, ear height 0.75).
// ---------------------------------------------------------------
export interface CatCfg { head: number; eyeGap: number; bellyH: number; bellyW: number; legs: number; headLift: number; legGap: number; eyeSize: number; earAngle: number; earWidth: number; earLift: number; earHeight: number; eyeY: number;
  pupilY: number; pupilGap: number; pupilSize: number; sparkle: number }
export const DEFAULT_CFG: CatCfg = {
  head: 1.1, eyeGap: 1.1, bellyH: 1.3, bellyW: 1.3, legs: 1.05, headLift: 1.5, legGap: 1.2, eyeSize: 1.05, earAngle: 16,
  earWidth: 1.2, earLift: 0, earHeight: 0.75, eyeY: -3.5,
  pupilY: 1.5, pupilGap: -1, pupilSize: 1, sparkle: 1,
};
export const CAT_CFG: CatCfg = { ...DEFAULT_CFG };
export const CAT_RANGE: Record<keyof CatCfg, [number, number]> = {
  head: [0.7, 1.5], eyeGap: [0.6, 1.5], bellyH: [0.8, 3], bellyW: [0.8, 2.2], legs: [0.8, 3], headLift: [-10, 14], legGap: [0.4, 2], eyeSize: [0.6, 1.6], earAngle: [-25, 40],
  earWidth: [0.6, 1.6], earLift: [-8, 8], earHeight: [0.6, 1.6], eyeY: [-6, 6],
  pupilY: [-4, 4], pupilGap: [-3, 3], pupilSize: [0.7, 1.3], sparkle: [0, 1],
};

export function setCatCfg(p: Partial<CatCfg>) {
  for (const k of Object.keys(p) as (keyof CatCfg)[]) {
    const v = p[k];
    if (typeof v === 'number' && Number.isFinite(v)) CAT_CFG[k] = clamp(v, CAT_RANGE[k][0], CAT_RANGE[k][1]);
  }
}

/** Vertical layout in cat space (feet on y = 0, up is negative). */
export function catLayout(over?: Partial<CatCfg> | null) {
  const c = over ? { ...CAT_CFG, ...over } : CAT_CFG;
  const footY = -4.6;
  const leg = 10.25 * c.legs; // original leg length x multiplier
  const yHip = footY - leg;
  const yb = yHip + 1.5; // torso bottom
  const TH = 22.68 * c.bellyH; // torso height
  const yt = yb - TH; // torso top (neck)
  const HW = 13.5 * c.bellyW; // torso half width
  const hs = c.head;
  const headY = yt + 8 - 25.4 * hs - c.headLift; // chin overlaps the shoulders a little; headLift raises (+) / lowers (-) it
  return {
    footY, leg, yHip, yb, TH, yt, HW, hs, headY,
    chestY: -(yt + TH * 0.5),
    carryY: -(yt + TH * 0.62),
    height: -(headY - 47 * hs),
  };
}

export type SkinId = 'tabby' | 'calico';
export type HatId = 'bucket' | 'cap' | 'none';

export interface Pal {
  fur: string;
  furDark: string;
  belly: string;
  earIn: string;
  iris: string;
  stripe?: string;
  muzzle?: string;
  fluffy?: boolean;
  calico?: boolean;
  patchA?: string;
  patchB?: string;
  bow?: string; // head ribbon
  tie?: string; // neck bow tie
  hat?: 'bucket' | 'cap';
  toque?: boolean; // chef hat
  paper?: boolean; // ice-cream seller's paper hat
  suit?: string; // office jacket colour
  necktie?: string;
  glasses?: boolean;
  shades?: 'heart' | 'star' | 'round' | 'retro'; // beach sunglasses
  topper?: 'pirate' | 'beach' | 'visor'; // customer hats (do not hide the ears)
  lei?: boolean; // Hawaiian flower necklace
}

const SKIN_BASE: Record<SkinId, Pal> = {
  tabby: { fur: '#ffab58', furDark: '#c9772e', belly: '#ffe3c8', earIn: '#ff92aa', iris: '#4fd070', stripe: '#dd7a2c' },
  calico: { fur: '#ffffff', furDark: '#aab0c8', belly: '#ffffff', earIn: '#ff92aa', iris: '#6cc9ff', calico: true, patchA: '#5d6896', patchB: '#ff9f45' },
};

export const makePlayerPal = (skin: SkinId, hat: HatId): Pal => ({ ...SKIN_BASE[skin], hat: hat === 'none' ? undefined : hat });
export const PLAYER_PAL: Pal = makePlayerPal('tabby', 'bucket');

export const CHEF_PAL: Pal = {
  fur: '#fff4e0', furDark: '#c9a56e', belly: '#fffaf0', earIn: '#ffb8c4', iris: '#6cc9ff', stripe: '#f2b66a', toque: true, tie: '#e8453c',
};

export const VENDOR_PAL: Pal = {
  fur: '#fff0d8', furDark: '#c9a56e', belly: '#fffaf0', earIn: '#ff92aa', iris: '#6cc9ff', stripe: '#f2b66a', paper: true, tie: '#ff6fa5',
};

export const HELPER_PALS: Pal[] = [
  { fur: '#d9d3ff', furDark: '#7b6fb0', belly: '#f3f0ff', earIn: '#ff92aa', iris: '#6cc9ff', stripe: '#a99be0', hat: 'cap', tie: '#3b93e6' },
  { fur: '#ffd6a8', furDark: '#c4742c', belly: '#fff0dc', earIn: '#ff92aa', iris: '#8bdc4c', stripe: '#f0a860', hat: 'cap', tie: '#ff6fa5' },
  { fur: '#c9f0d8', furDark: '#4f9a72', belly: '#effff6', earIn: '#ff92aa', iris: '#ffd23f', stripe: '#8fd0aa', hat: 'cap', tie: '#ffb02e' },
];
export const FISHER_PAL: Pal = { ...makePlayerPal('calico', 'bucket'), tie: '#e8453c' };

export const CASHIER_PAL: Pal = {
  fur: '#c9ccd8', furDark: '#7b8097', belly: '#f1f3fa', earIn: '#ffb8c4', iris: '#ffd54a', stripe: '#9aa0b6', tie: '#3b93e6', bow: '#ff7aa8',
};

export const CUSTOMER_PALS: Pal[] = [
  { fur: '#fffdfb', furDark: '#c7bcd8', belly: '#ffffff', earIn: '#ffc6d2', iris: '#58b9ff', fluffy: true, bow: '#ff6fa5' },
  { fur: '#ffbb66', furDark: '#c4742c', belly: '#ffe9cf', earIn: '#ffb0b8', iris: '#8bdc4c', stripe: '#e68a2e' },
  { fur: '#b3bbc9', furDark: '#6f7788', belly: '#e8ecf4', earIn: '#ffb8c4', iris: '#ffd54a', stripe: '#8791a3', bow: '#4ab8f5' },
  { fur: '#5b5470', furDark: '#241f2e', belly: '#8a82a0', earIn: '#ff9fb2', iris: '#ffd23f', tie: '#ff5c7a' },
  { fur: '#f8e4c0', furDark: '#c9a56e', belly: '#fffaf0', earIn: '#ffb8c4', iris: '#6cc9ff', stripe: '#e8c78f', bow: '#ff8fb0' },
  { fur: '#4a4560', furDark: '#1f1b29', belly: '#ffffff', earIn: '#ff9fb2', iris: '#7de06b', muzzle: '#ffffff', tie: '#ff8a3d' },
  { fur: '#ffffff', furDark: '#aab0c8', belly: '#ffffff', earIn: '#ff9fb0', iris: '#ffd23f', calico: true, patchA: '#d9a066', patchB: '#5d6896', bow: '#ffd23f' },
];

interface Spring { x: number; y: number; vx: number; vy: number; rot: number; rv: number }

export interface Cat {
  x: number; y: number; vx: number; vy: number; ax: number; ay: number;
  fx: number; fy: number; side: number;
  phase: number; t: number; speed: number; mv: number; r: number;
  sq: number; sqV: number; sway: number; swayV: number; skid: number; idleT: number;
  blink: number; blinkT: number; tailPhase: number;
  hat: Spring;
  carry: number[];
  maxCarry: number;
  pal: Pal;
  look: { x: number; y: number } | null;
  stepSide: number;
  skidding: boolean;
  skates: boolean;
  board: boolean;
  lastStepN: number;
  alert: number;
  tug: number;
  happy: number;
  eyesOpen?: boolean; // forces round sparkly eyes open instead of ^^ happy eyes
  exc: number;
  focus: number;
  actT: number;
  glx: number; gly: number; glTx: number; glTy: number; glT: number;
  twL: number; twR: number;
  tilt: number; tiltTarget: number; tiltT: number;
  hopY: number; hopV: number;
  rod: { on: boolean; raise: number; bend: number; wx: number; wy: number };
  chef: { on: boolean; k: number; hold: number };
  hold: number; // -1 / +1: that arm holds a shopping bag / cone / wagon handle (0 = none)
  holdAng: number;
  size: number; // 1 = normal, 0.74 = kid, 0.52 = kitten ...
  build: Partial<CatCfg> | null; // per-cat body overrides (fat, kid ...)
}

export function makeCat(x: number, y: number, pal: Pal): Cat {
  const phase = Math.random() * 6;
  return {
    x, y, vx: 0, vy: 0, ax: 0, ay: 0, fx: 0, fy: 1, side: 1,
    phase, t: Math.random() * 10, speed: 0, mv: 0, r: 0,
    sq: 0, sqV: 0, sway: 0, swayV: 0, skid: 0, idleT: 0,
    blink: 0, blinkT: 1 + Math.random() * 3, tailPhase: Math.random() * 6,
    hat: { x: 0, y: 0, vx: 0, vy: 0, rot: 0, rv: 0 },
    carry: [], maxCarry: 6, pal, look: null, stepSide: -1, skidding: false, skates: false, board: false,
    lastStepN: Math.floor((phase - PI / 2) / PI),
    alert: 0, tug: 0, happy: 0, exc: 0, focus: 0, eyesOpen: false,
    actT: 1.5 + Math.random() * 2, glx: 0, gly: 0, glTx: 0, glTy: 0, glT: 0,
    twL: 0, twR: 0, tilt: 0, tiltTarget: 0, tiltT: 0, hopY: 0, hopV: 0,
    rod: { on: false, raise: 0, bend: 0, wx: 0, wy: 0 },
    chef: { on: false, k: 0, hold: 0 },
    size: 1, build: null, hold: 0, holdAng: 0.24,
  };
}

export function hopCat(m: Cat, v = 150) {
  if (m.hopY < 0.5) m.hopV = v;
}

export function updateCat(m: Cat, dt: number, tvx: number, tvy: number, accel: number) {
  const pvx = m.vx, pvy = m.vy;
  const dx = tvx - m.vx, dy = tvy - m.vy;
  const d = Math.hypot(dx, dy);
  const tSpeed = Math.hypot(tvx, tvy);
  const curSpeed = Math.hypot(m.vx, m.vy);
  const a = (tSpeed < curSpeed ? accel * 1.35 : accel) * dt;
  if (d <= a) { m.vx = tvx; m.vy = tvy; } else { m.vx += (dx / d) * a; m.vy += (dy / d) * a; }
  m.x += m.vx * dt;
  m.y += m.vy * dt;
  postUpdate(m, dt, pvx, pvy, tvx, tvy, tSpeed);
}

export function postUpdate(m: Cat, dt: number, pvx: number, pvy: number, tvx: number, tvy: number, tSpeed: number) {
  m.t += dt;
  m.speed = Math.hypot(m.vx, m.vy);
  m.ax = (m.vx - pvx) / dt;
  m.ay = (m.vy - pvy) / dt;

  m.skidding = tSpeed > 20 && m.speed > 130 && m.vx * tvx + m.vy * tvy < 0;
  m.skid += ((m.skidding ? 1 : 0) - m.skid) * Math.min(1, dt * 12);

  let tfx: number, tfy: number;
  if (m.speed > 25) {
    tfx = m.vx / m.speed; tfy = m.vy / m.speed; m.idleT = 0;
    if (Math.abs(m.vx) > 20) m.side = Math.sign(m.vx);
  } else {
    m.idleT += dt;
    if (m.look) {
      const l = Math.hypot(m.look.x, m.look.y) || 1;
      tfx = m.look.x / l; tfy = m.look.y / l;
      if (Math.abs(tfx) > 0.3) m.side = Math.sign(tfx);
    } else if (m.idleT > 0.45) { tfx = 0; tfy = 1; } else { tfx = m.fx; tfy = m.fy; }
  }
  const k = Math.min(1, dt * (m.speed > 25 ? 14 : 8));
  m.fx += (tfx - m.fx) * k;
  m.fy += (tfy - m.fy) * k;

  m.mv += (clamp(m.speed / 70, 0, 1) - m.mv) * Math.min(1, dt * 14);
  m.r += (clamp((m.speed - 175) / 80, 0, 1) - m.r) * Math.min(1, dt * 9);

  m.phase += m.speed * dt * 0.058 * (m.skates ? 0.62 : m.board ? 0.9 : 1);
  m.tailPhase += dt * (2.0 + 8 * m.mv + 6 * m.r);

  m.stepSide = -1;
  const n = Math.floor((m.phase - PI / 2) / PI);
  if (n !== m.lastStepN) {
    m.lastStepN = n;
    if (m.speed > 40) {
      m.stepSide = ((n % 2) + 2) % 2 === 0 ? 1 : 0;
      m.sqV += 8 * m.mv * (0.8 + m.r * 0.9) * (m.skates || m.board ? 0.2 : 1);
      m.hat.vy -= (12 + 14 * m.r) * m.mv;
      m.hat.rv += (Math.random() - 0.5) * (0.5 + 0.8 * m.r);
    }
  }

  const idle = m.speed < 20 && !m.rod.on && !m.look && !m.chef.on;
  if (idle) {
    m.actT -= dt;
    if (m.actT <= 0 && m.idleT > 0.8) {
      m.actT = 1.4 + Math.random() * 2.4;
      const a = Math.random();
      if (a < 0.24) {
        m.glTx = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.4);
        m.glTy = (Math.random() - 0.5) * 0.9;
        m.glT = 1.1;
      } else if (a < 0.44) {
        if (Math.random() < 0.5) m.twL = 1; else m.twR = 1;
      } else if (a < 0.62) {
        m.tiltTarget = (Math.random() < 0.5 ? -1 : 1) * 0.2;
        m.tiltT = 1.2;
      } else if (a < 0.76) {
        hopCat(m, 120);
      } else if (a < 0.9) {
        m.happy = Math.max(m.happy, 1.0);
        hopCat(m, 140);
      } else {
        m.twL = 1; m.twR = 1;
      }
    }
  }
  m.glT -= dt;
  if (m.glT <= 0 || !idle) { m.glTx = 0; m.glTy = 0; }
  m.glx += (m.glTx - m.glx) * Math.min(1, dt * 12);
  m.gly += (m.glTy - m.gly) * Math.min(1, dt * 12);
  m.tiltT -= dt;
  if (m.tiltT <= 0 || !idle) m.tiltTarget = 0;
  m.tilt += (m.tiltTarget - m.tilt) * Math.min(1, dt * 7);
  m.twL = Math.max(0, m.twL - dt * 3.2);
  m.twR = Math.max(0, m.twR - dt * 3.2);

  if (m.hopY > 0 || m.hopV > 0) {
    m.hopV -= 760 * dt;
    m.hopY += m.hopV * dt;
    if (m.hopY <= 0) {
      if (m.hopV < -60) m.sqV += Math.min(7, -m.hopV / 55);
      m.hopY = 0; m.hopV = 0;
    }
  }

  m.sqV += (-300 * m.sq - 15 * m.sqV) * dt;
  m.sq = clamp(m.sq + m.sqV * dt, -1.5, 1.5);

  const target = -m.vx / 400;
  m.swayV += (-190 * (m.sway - target) - 14 * m.swayV - 0.09 * m.ax) * dt;
  m.sway = clamp(m.sway + m.swayV * dt, -1.3, 1.3);

  const h = m.hat;
  h.vx += (300 * (-m.vx * 0.018 - h.x) - 16 * h.vx) * dt;
  h.vy += (320 * (0 - h.y) - 11 * h.vy) * dt;
  h.rv += (220 * (-m.vx * 0.0014 - h.rot) - 9 * h.rv) * dt;
  h.x = clamp(h.x + h.vx * dt, -8, 8);
  h.y = clamp(h.y + h.vy * dt, -10, 6);
  h.rot = clamp(h.rot + h.rv * dt, -0.6, 0.6);

  m.blinkT -= dt;
  if (m.blinkT < 0) { m.blink = 1; m.blinkT = 2 + Math.random() * 3.5; if (Math.random() < 0.2) m.blinkT = 0.25; }
  m.blink = Math.max(0, m.blink - dt * 7);
  m.alert = Math.max(0, m.alert - dt * 2.2);
  m.tug = Math.max(0, m.tug - dt * 2.4);
  m.happy = Math.max(0, m.happy - dt * 0.8);
  const excT = Math.max(m.r * 1.15, Math.min(1, m.happy * 1.25));
  m.exc += (excT - m.exc) * Math.min(1, dt * 10);
}

// ---------------------------------------------------------------
//  Drawing helpers
// ---------------------------------------------------------------
function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, lw = 1.6) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}

export { drawBill } from './fish';

// Round chibi eye: perfectly circular white, big round pupil, slim crescent lid line (like the reference)
const BROWN = '#3a2313';
const ER = 10.6; // eye white radius (circle)
const PR = 7.7; // pupil radius (circle)

interface PupilOpt { y: number; gap: number; size: number; sparkle: boolean }

function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, open: number, lx: number, ly: number, happy: boolean, iris: string, t: number, size = 1, pu: PupilOpt = { y: 0, gap: 0, size: 1, sparkle: true }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);

  if (happy) {
    // happy "^ ^" eye: arc 1.1pi..1.9pi plus lashes at the outer end
    ctx.lineCap = 'round';
    ctx.strokeStyle = BROWN;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.arc(0, 4.5, ER * 0.84, PI * 1.1, PI * 1.9);
    ctx.stroke();
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(s * 7.5, 2.3);
    ctx.lineTo(s * 11.8, -0.2);
    ctx.moveTo(s * 6.4, 0.3);
    ctx.lineTo(s * 10.2, -3);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.scale(1, Math.max(0.08, open));

  // eye white (a circle)
  ctx.beginPath();
  ctx.arc(0, 0, ER, 0, PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // pupil (round, clipped to the white)
  ctx.save();
  ctx.clip();
  const prr = PR * pu.size;
  const ox = clamp(lx, -1.3, 1.3) * 2.0 + s * pu.gap; // gap > 0 pushes the pupils apart, < 0 pulls them together
  const oy = 1.2 + clamp(ly, -1.3, 1.3) * 2.0 - pu.y; // pupil y > 0 raises the pupil
  ctx.beginPath();
  ctx.arc(ox, oy, prr, 0, PI * 2);
  ctx.fillStyle = BROWN;
  ctx.fill();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.ellipse(ox, oy + 4.2 * pu.size, prr * 0.7, prr * 0.4, 0, 0, PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (pu.sparkle) {
    const tw = 1 + 0.1 * Math.sin(t * 4 + s);
    const k = pu.size;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ox - 2.7 * k, oy - 3.2 * k, 3.2 * tw * k, 0, PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ox + 3 * k, oy + 3 * k, 1.9 * k, 0, PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ox + 0.2 * k, oy + 5.4 * k, 1 * k, 0, PI * 2); ctx.fill();
  }
  ctx.restore();

  // soft lower lash line
  ctx.beginPath();
  ctx.arc(0, 0, ER + 0.5, PI * 0.16, PI * 0.84);
  ctx.strokeStyle = 'rgba(90,50,20,0.26)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.stroke();

  // slim black crescent on the upper-outer side: thick in the middle, tapering to both tips
  const mid = -PI / 2 + s * 0.42;
  const half = PI * 0.56;
  const N = 22;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    const a = mid - half + k * half * 2;
    const w = 0.15 + 2.7 * Math.pow(Math.sin(PI * k), 0.85);
    const r = ER + w * 0.78;
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  for (let i = N; i >= 0; i--) {
    const k = i / N;
    const a = mid - half + k * half * 2;
    const r = ER - 0.9 * Math.pow(Math.sin(PI * k), 0.6);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = BROWN;
  ctx.fill();

  // tiny lashes flicking off the outer tip of the crescent
  ctx.strokeStyle = BROWN;
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  const tip = mid + s * half;
  for (const da of [0, -s * 0.2]) {
    const a = tip + da;
    const px = Math.cos(a) * (ER + 0.6), py = Math.sin(a) * (ER + 0.6);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + s * 3.6, py - 2.2 - da * s * 3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBow(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 1.8;
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(d * 6, -8, d * 11, -5);
    ctx.quadraticCurveTo(d * 13, 0, d * 11, 5);
    ctx.quadraticCurveTo(d * 6, 8, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ell(ctx, 0, 0, 3, 3, color, OUT, 1.6);
  ctx.restore();
}

/** Tail is 30% shorter than before. Its outline starts a little way out from the body, so the root has no outline ring. */
function drawTail(ctx: CanvasRenderingContext2D, m: Cat, p: Pal, mode: 'behind' | 'front' | 'base' = 'behind') {
  const Ly = catLayout();
  const mv = m.mv, r = m.r;
  const dirX = -m.side;
  const ix = dirX * 0.9, iy = -0.55;
  // facing up (away from the camera): the tail swings out beside the body so that its tip is seen from the front
  const away = clamp((-m.fy - 0.25) / 0.6, 0, 1);
  const tx = -m.fx * 0.9 * (1 - away) + dirX * 0.95 * away, ty = -0.6 - r * 0.45 - m.fy * 0.3 + away * 0.15;
  const mvw = Math.max(mv, away);
  let dx = ix + (tx - ix) * mvw, dy = iy + (ty - iy) * mvw;
  const l = Math.hypot(dx, dy) || 1;
  dx /= l; dy /= l;
  const ang = Math.atan2(dy, dx);
  const curlDir = dx >= 0 ? -1 : 1;
  const curl = 0.14 - 0.06 * mv;
  const N = 11, L = 6.6 * 0.7;
  const pts: number[][] = [[dirX * Ly.HW * 0.55, Ly.yb - 5]];
  let x = pts[0][0], y = pts[0][1];
  for (let i = 0; i < N; i++) {
    const k = (i + 1) / N;
    const wave = Math.sin(m.tailPhase - i * 0.6) * (0.12 + 0.16 * mv + 0.22 * r) * (0.35 + k);
    const a = ang + curlDir * curl * i + wave;
    x += Math.cos(a) * L;
    y += Math.sin(a) * L;
    pts.push([x, y]);
  }
  const W = p.fluffy ? 9.6 : 8;
  ctx.lineJoin = 'round';
  const path = (a = 0, b = N) => {
    ctx.beginPath();
    ctx.moveTo(pts[a][0], pts[a][1]);
    for (let i = a + 1; i < b; i++) {
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    }
    ctx.lineTo(pts[b][0], pts[b][1]);
  };
  if (mode === 'base') {
    // fur drawn over the body outline where the tail leaves the body: tail and body merge without a line
    ctx.lineCap = 'butt';
    path(1, 4);
    ctx.strokeStyle = p.fur;
    ctx.lineWidth = W + 0.8;
    ctx.stroke();
    ctx.lineCap = 'round';
    return;
  }
  // outline: flat start (no cap) + a round dot at the tip
  ctx.lineCap = 'butt';
  path(1, N);
  ctx.strokeStyle = OUT;
  ctx.lineWidth = W + 4;
  ctx.stroke();
  ctx.fillStyle = OUT;
  ctx.beginPath(); ctx.arc(pts[N][0], pts[N][1], (W + 4) / 2, 0, PI * 2); ctx.fill();
  ctx.lineCap = 'round';
  path();
  ctx.strokeStyle = p.fur;
  ctx.lineWidth = W;
  ctx.stroke();
  if (p.calico) {
    path(3, 6);
    ctx.strokeStyle = p.patchB ?? '#ff9f45';
    ctx.lineWidth = W;
    ctx.stroke();
    path(6, N);
    ctx.strokeStyle = p.patchA ?? '#5d6896';
    ctx.stroke();
  }
  if (p.stripe) {
    ctx.strokeStyle = p.stripe;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'butt';
    for (const i of [4, 6, 8, 10]) {
      const a = pts[i], b = pts[i + 1];
      const sx = b[0] - a[0], sy = b[1] - a[1];
      const sl = Math.hypot(sx, sy) || 1;
      const nx = -sy / sl, ny = sx / sl;
      ctx.beginPath();
      ctx.moveTo(a[0] + nx * (W / 2 - 0.4), a[1] + ny * (W / 2 - 0.4));
      ctx.lineTo(a[0] - nx * (W / 2 - 0.4), a[1] - ny * (W / 2 - 0.4));
      ctx.stroke();
    }
    ctx.lineCap = 'round';
  }
}

// ---------------------------------------------------------------
//  Limbs: plump tapered tubes, 10% wider at the far end than at the root
// ---------------------------------------------------------------
const ARM_R0 = 3.9;
const ARM_R1 = ARM_R0 * 1.1;
const LEG_R0 = 4.3;
const LEG_R1 = LEG_R0 * 1.1;
const FOOT_RX = 7 * 1.1;
const FOOT_RY = 4.5 * 1.1;
const PAW_RX = 6.6 * 1.1;
const PAW_RY = 5.6 * 1.1;
const LIMB_OUT = 4.8; // stroke width for the outline pass (half of it shows)

/** Path of a tube from (x0,y0,r0) to (x1,y1,r1). */
function limbShape(ctx: CanvasRenderingContext2D, x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) {
  const dx = x1 - x0, dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  ctx.beginPath();
  if (d < 0.05) { ctx.arc(x0, y0, Math.max(r0, r1), 0, PI * 2); return; }
  const a = Math.atan2(dy, dx);
  const beta = Math.acos(clamp((r0 - r1) / d, -1, 1));
  ctx.arc(x1, y1, r1, a - beta, a + beta, false);
  ctx.arc(x0, y0, r0, a + beta, a + PI * 2 - beta, false);
  ctx.closePath();
}

/** One-shot limb (outline + fill) for limbs that sit on top of the body. */
function limbDraw(ctx: CanvasRenderingContext2D, x0: number, y0: number, r0: number, x1: number, y1: number, r1: number, fill: string) {
  limbShape(ctx, x0, y0, r0, x1, y1, r1);
  ctx.lineJoin = 'round';
  ctx.lineWidth = LIMB_OUT;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
}

interface Hand { x: number; y: number; s: number; rot: number; thumb: number }

/** Mitten paw, drawn in two passes ('o' outline, 'f' fill) so it merges with the arm. thumb 0..1 = cheering thumb. */
function handPass(ctx: CanvasRenderingContext2D, h: Hand, p: Pal, pass: 'o' | 'f') {
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.rot);
  ctx.lineJoin = 'round';
  const th = h.thumb > 0.05;
  const paw = () => { ctx.beginPath(); ctx.ellipse(0, 0, PAW_RX, PAW_RY, 0, 0, PI * 2); };
  const thumb = () => { ctx.beginPath(); ctx.ellipse(-h.s * 1.4, -5.8 * h.thumb, 3, 4 * h.thumb + 0.5, -h.s * 0.28, 0, PI * 2); };
  if (pass === 'o') {
    ctx.lineWidth = LIMB_OUT;
    ctx.strokeStyle = OUT;
    paw(); ctx.stroke();
    if (th) { thumb(); ctx.stroke(); }
  } else {
    ctx.fillStyle = p.belly;
    paw(); ctx.fill();
    if (th) { thumb(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(88,36,74,.32)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-1.6, 1.4); ctx.lineTo(-1.6, 4.2); ctx.moveTo(1.8, 1.4); ctx.lineTo(1.8, 4.2); ctx.stroke();
  }
  ctx.restore();
}

function drawCarry(ctx: CanvasRenderingContext2D, m: Cat, p: Pal, mode: 'full' | 'basket') {
  const n = m.carry.length;
  if (!n) return;
  const Ly = catLayout();
  const cx = m.sway * 1.6;
  const by = -Ly.carryY + Math.sin(m.t * 3) * 0.4 * (1 - m.mv) + Math.abs(Math.cos(m.phase)) * 0.8 * m.mv;

  // Arms holding the basket/wadah
  if (mode === 'full') {
    for (const s of [-1, 1]) {
      limbDraw(ctx, s * Ly.HW * 0.82, Ly.yt + 8, ARM_R0, cx + s * 20, by - 1, ARM_R1, p.suit ?? p.fur);
    }
  }

  // ---- MONKEY-MART VERTICAL STACK (Tumpuk ke atas tinggi di wadah) ----
  // Items stack vertically one on top of another reaching upwards!
  // The cat is drawn at 0.8x in the world, so an item drawn here at 1.06 is drawn at
  // 1.06 * 0.8 = 0.85 world scale — exactly the size it has lying on the ground (FISH_S 0.8).
  // That is why a fish / fruit no longer "shrinks" when it is picked up into the basket.
  const itemStep = 19;
  const itemS = 1.06;
  // The pile leans slightly away from the face as it grows (Monkey-Mart style) so the cat
  // still reads as a cat while carrying a full load.
  const pileX = cx;
  for (let i = 0; i < n; i++) {
    // Dynamic sway for the tall stack as the cat runs; a tiny alternating offset makes the
    // pile look stacked (like a real pile of fruit) instead of a straight column.
    const swayX = (m.sway * 1.3 + Math.sin(m.phase + i * 0.35) * (0.8 + i * 0.4) * m.mv) * (0.7 + i * 0.28);
    const swayRot = (m.sway * 0.04 + Math.sin(m.phase + i * 0.3) * 0.025 * m.mv) * Math.min(i, 5);
    const ix = pileX + swayX + (i % 2 ? 1.6 : -1.6);
    const iy = by - 9 - i * itemStep;
    drawItem(ctx, ix, iy, m.carry[i], itemS, swayRot, 1, m.t * 5 + i);
  }

  // Woven Wicker Basket at the base supporting the stack
  ctx.beginPath();
  ctx.moveTo(pileX - 24, by - 6);
  ctx.lineTo(pileX + 24, by - 6);
  ctx.quadraticCurveTo(pileX + 22, by + 11, pileX + 14, by + 11);
  ctx.lineTo(pileX - 14, by + 11);
  ctx.quadraticCurveTo(pileX - 22, by + 11, pileX - 24, by - 6);
  ctx.closePath();
  ctx.fillStyle = '#e2a85e';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(138,90,37,.55)';
  ctx.lineWidth = 1.3;
  for (let k = -24; k <= 24; k += 6) {
    ctx.beginPath(); ctx.moveTo(pileX + k, by - 7); ctx.lineTo(pileX + k + 8, by + 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pileX + k + 8, by - 7); ctx.lineTo(pileX + k, by + 12); ctx.stroke();
  }
  ctx.restore();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUT;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pileX - 24, by - 6);
  ctx.quadraticCurveTo(pileX - 22, by + 11, pileX - 14, by + 11);
  ctx.lineTo(pileX + 14, by + 11);
  ctx.quadraticCurveTo(pileX + 22, by + 11, pileX + 24, by - 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(pileX - 26, by - 9, 52, 6, 3);
  ctx.fillStyle = '#f2c882';
  ctx.fill();
  ctx.stroke();

  // ---- FLOATING "MAX" BADGE ABOVE THE TALL STACK (GAYA MONKEY MART REFERENSI) ----
  if (n >= m.maxCarry) {
    const topIdx = n - 1;
    const topSwayX = (m.sway * 1.3 + Math.sin(m.phase + topIdx * 0.35) * (0.8 + topIdx * 0.4) * m.mv) * (0.7 + topIdx * 0.28);
    const topX = pileX + topSwayX + (topIdx % 2 ? 1.6 : -1.6);
    const topY = by - 9 - topIdx * itemStep - 22 + Math.sin(m.t * 7) * 2;

    ctx.save();
    ctx.translate(topX, topY);
    ctx.font = '900 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    // Thick bold cartoon dark purple outline
    ctx.lineWidth = 4.8;
    ctx.strokeStyle = '#381640';
    ctx.strokeText('MAX', 0, 0);
    // Vibrant Monkey-Mart purple gradient fill
    ctx.fillStyle = '#9438c8';
    ctx.fillText('MAX', 0, 0);
    // Inner bright highlight for 3D depth
    ctx.fillStyle = '#f0cfff';
    ctx.fillText('MAX', 0, -0.6);
    ctx.restore();
  }

  // Paws holding the sides of the basket
  if (mode === 'full') {
    for (const s of [-1, 1]) ell(ctx, pileX + s * 22, by - 1, 5.8, 5.8, p.belly, OUT, 2);
  }
}

function drawKnife(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.roundRect(-2.6, -9, 5.2, 11, 2.2);
  ctx.fillStyle = '#7a4a22';
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3.4, 1.5);
  ctx.lineTo(3.4, 1.5);
  ctx.lineTo(3.4, 22);
  ctx.quadraticCurveTo(3, 27, -3.4, 28);
  ctx.closePath();
  ctx.fillStyle = '#e8eef6';
  ctx.fill();
  ctx.strokeStyle = '#6b6a86';
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillRect(-1.6, 4, 1.8, 17);
  ctx.restore();
}

/**
 * Chunky quad roller skate pinned accurately to the cat's foot sole (telapak kaki).
 * (x, y) = foot center, rot = foot tilt/angle, dir = facing direction, fa = facing aspect.
 * The skate attaches right under the sole and rotates precisely with the foot!
 */
function drawSkate(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, spin: number, dir: number, fa = 0) {
  ctx.save();
  ctx.translate(x, y);
  const d = dir >= 0 ? 1 : -1;
  // Apply facing scale first, then rotate by rot * d so the skate tilts in the exact direction of the foot
  ctx.scale(d, 1);
  ctx.rotate(rot * d);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const lw = 1.6;

  // Front / Angled view (facing camera or downward)
  if (fa < 0.4) {
    const w = 18;
    // Metal chassis plate directly under the foot sole (telapak kaki)
    ctx.beginPath(); ctx.roundRect(-w / 2, 4.2, w, 2.8, 1.2);
    ctx.fillStyle = '#b4bdd0'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    // 4 wheels (front pair & back pair)
    for (const wx of [-w / 2 + 1.5, w / 2 - 1.5]) {
      for (const wy of [6.6, 9.6]) {
        ctx.beginPath(); ctx.arc(wx, wy, 2.7, 0, PI * 2);
        ctx.fillStyle = wy > 8 ? '#ff6fa5' : '#ff8fbc'; ctx.fill();
        ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke();
        ctx.beginPath(); ctx.arc(wx, wy, 1.0, 0, PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      }
    }
    // Front rubber toe stop
    ctx.beginPath(); ctx.ellipse(0, 6.2, 3.2, 2.2, 0, 0, PI * 2);
    ctx.fillStyle = '#ff5a8a'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke();
    // Snug boot cuff collar hugging the paw bottom
    ctx.beginPath(); ctx.roundRect(-w / 2 + 1, -1.0, w - 2, 5.6, 2.2);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = '#ff7aa8'; ctx.fillRect(-w / 2 + 3, 1.2, w - 6, 2.4);
  } else {
    // Side profile view (facing left/right along movement direction)
    // 4 wheels mounted under the sole plate
    for (const wx of [-7.6, -2.6, 2.6, 7.6]) {
      ctx.beginPath(); ctx.arc(wx, 7.2, 2.8, 0, PI * 2);
      ctx.fillStyle = wx < 0 ? '#ff6fa5' : '#ff8fbc'; ctx.fill();
      ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.beginPath(); ctx.arc(wx, 7.2, 1.0, 0, PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(wx, 7.2); ctx.lineTo(wx + Math.cos(spin + wx) * 1.8, 7.2 + Math.sin(spin + wx) * 1.8); ctx.stroke();
    }

    // Metal sole chassis plate flush under paw sole
    ctx.beginPath(); ctx.roundRect(-9.8, 4.0, 20.4, 2.8, 1.3);
    ctx.fillStyle = '#b4bdd0'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    // Front rubber toe stop
    ctx.beginPath(); ctx.ellipse(11.8, 5.8, 2.2, 2.6, 0, 0, PI * 2);
    ctx.fillStyle = '#ff5a8a'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke();

    // Boot body wrapping comfortably around the sole and heel
    const boot = () => {
      ctx.beginPath();
      ctx.moveTo(-9.2, 4.2);
      ctx.lineTo(-9.8, -6.0);
      ctx.quadraticCurveTo(-9.8, -7.2, -8.6, -7.2);
      ctx.lineTo(-1.6, -7.2);
      ctx.lineTo(-0.5, -3.0);
      ctx.quadraticCurveTo(2.6, -1.8, 6.2, -1.6);
      ctx.quadraticCurveTo(11.8, -1.4, 11.8, 1.2);
      ctx.quadraticCurveTo(11.8, 4.2, 10.2, 4.2);
      ctx.closePath();
    };
    boot();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.save(); boot(); ctx.clip();
    ctx.fillStyle = '#ff7aa8';
    ctx.beginPath(); ctx.moveTo(4.6, 4.2); ctx.lineTo(5.4, -2.4); ctx.lineTo(13, -2.4); ctx.lineTo(13, 4.2); ctx.closePath(); ctx.fill();
    ctx.restore();
    boot(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();

    // Pink ankle cuff collar
    ctx.beginPath(); ctx.roundRect(-10.2, -8.2, 9.6, 3.2, 1.4);
    ctx.fillStyle = '#ff5a8a'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke();
  }
  ctx.restore();
}

/** Mochi head: soft, plump and wide - a gentle dome on top, cheeks puffing out, slightly sagging flat-ish bottom. */
function headPath(ctx: CanvasRenderingContext2D) {
  const N = 112, cy = 1.4, rx = 31.8, ry = 24.4;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const a = (i / N) * PI * 2;
    const c = Math.cos(a), sn = Math.sin(a);
    const n = sn > 0 ? 2.3 : 2; // bottom is a touch fuller (mochi sag), top is a pure dome
    const e = 2 / n;
    let x = rx * Math.sign(c) * Math.pow(Math.abs(c), e);
    const y = cy + ry * Math.sign(sn) * Math.pow(Math.abs(sn), e);
    x *= 1 + 0.05 * Math.max(0, sn) * Math.max(0, sn); // cheeks puff out low on the face
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Surfboard / Skateboard: Paws firmly planted on the deck surface (napak di papan selancar).
 * If surfing on water or moving fast, renders dynamic rolling ocean waves and sea foam!
 */
function drawBoard(ctx: CanvasRenderingContext2D, m: Cat) {
  const S = 1.6;
  const tilt = -m.fx * 0.04 * m.mv + Math.sin(m.t * 18) * 0.015 * m.mv;
  const isSurfing = m.x < 380 || m.speed > 160;

  ctx.save();
  // Align deck top directly under the paws so the cat is firmly planted on deck (napak di papan selancar)!
  ctx.translate(0, 0.4);
  ctx.rotate(tilt);
  ctx.scale(S, S);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 1. DYNAMIC OCEAN SURF WAVES (Ombak bergulung & buih putih saat berselancar)
  if (isSurfing) {
    const dir = m.fx >= 0 ? 1 : -1;
    // Rolling wave crest
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-32 * dir, 12);
    ctx.quadraticCurveTo(0, -3, 30 * dir, 7);
    ctx.quadraticCurveTo(20 * dir, 14, -32 * dir, 14);
    ctx.closePath();
    ctx.fillStyle = 'rgba(78,212,238,.48)'; ctx.fill();

    // White cresting water foam
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-28 * dir, 8);
    ctx.quadraticCurveTo(-6 * dir, -1.5, 26 * dir, 6);
    ctx.stroke();

    // Flying water droplets
    for (let k = 0; k < 3; k++) {
      const spX = -25 * dir - dir * k * 7 + Math.sin(m.t * 16 + k) * 3;
      const spY = 5 + Math.sin(m.t * 14 + k) * 3;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(spX, spY, 1.4, 0, PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Shadow under board
  ctx.save();
  ctx.globalAlpha = 0.22; ctx.fillStyle = isSurfing ? '#0a406a' : '#3a2a10';
  ctx.beginPath(); ctx.ellipse(0, 3.2, 26, 2.5, 0, 0, PI * 2); ctx.fill();
  ctx.restore();

  // Wheels if on land (or skeg fin if on water)
  if (!isSurfing) {
    const spin = m.phase * 3.4;
    for (const wx of [-14.5, 14.5]) {
      ctx.beginPath(); ctx.moveTo(wx - 4, 1.8); ctx.lineTo(wx + 4, 1.8); ctx.lineTo(wx + 2.8, 3.4); ctx.lineTo(wx - 2.8, 3.4); ctx.closePath();
      ctx.fillStyle = '#b4bdd0'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.beginPath(); ctx.arc(wx, 3.4, 2.4, 0, PI * 2); ctx.fillStyle = '#6fe8c8'; ctx.fill(); ctx.lineWidth = 1.3; ctx.stroke();
      ctx.beginPath(); ctx.arc(wx, 3.4, 0.9, 0, PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(wx, 3.4); ctx.lineTo(wx + Math.cos(spin + wx) * 1.5, 3.4 + Math.sin(spin + wx) * 1.5); ctx.stroke();
    }
  } else {
    // Under-water skeg fin
    ctx.beginPath(); ctx.moveTo(-16, 1.5); ctx.lineTo(-20, 7.5); ctx.lineTo(-11, 1.5); ctx.closePath();
    ctx.fillStyle = '#1f6596'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = OUT; ctx.stroke();
  }

  // Surfboard / Skateboard Deck
  const deck = () => {
    ctx.beginPath();
    ctx.moveTo(-27, -2.5);
    ctx.quadraticCurveTo(-27.6, 0.5, -23.4, 1.2);
    ctx.lineTo(23.4, 1.2);
    ctx.quadraticCurveTo(27.6, 0.5, 27, -2.5);
    ctx.quadraticCurveTo(24.2, 2.8, 17, 3.0);
    ctx.lineTo(-17, 3.0);
    ctx.quadraticCurveTo(-24.2, 2.8, -27, -2.5);
    ctx.closePath();
  };
  deck();
  const g = ctx.createLinearGradient(-27, 0, 27, 0);
  g.addColorStop(0, '#ffd23f');
  g.addColorStop(0.4, '#ff6b84');
  g.addColorStop(1, '#4ea8e8');
  ctx.fillStyle = g; ctx.fill();
  ctx.save();
  deck(); ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-28, -0.6, 56, 1.8); // Center racing stringer
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath(); ctx.ellipse(0, 0.2, 3.0, 1.4, 0, 0, PI * 2); ctx.fill();
  for (const [px, py] of [[-4.0, -0.8], [-1.3, -1.6], [1.3, -1.6], [4.0, -0.8]]) {
    ctx.beginPath(); ctx.ellipse(px, py, 1.0, 1.1, 0, 0, PI * 2); ctx.fill();
  }
  ctx.restore();
  deck(); ctx.lineWidth = 2.2; ctx.strokeStyle = OUT; ctx.stroke();

  // Dark grip tape pad where the cat's feet plant!
  ctx.beginPath(); ctx.roundRect(-19, -1.6, 38, 2.2, 1.0);
  ctx.fillStyle = 'rgba(58,28,64,.85)'; ctx.fill();
  ctx.restore();
}

function headClip(ctx: CanvasRenderingContext2D) {
  headPath(ctx);
  ctx.clip();
}

/** Office jacket painted over the torso (must be called inside the torso clip). */
function drawSuit(ctx: CanvasRenderingContext2D, p: Pal, HW: number, yt: number, yb: number, TH: number, faceA: number) {
  const suit = p.suit!;
  ctx.fillStyle = suit;
  ctx.fillRect(-HW * 1.3, yt - 3, HW * 2.6, TH + 8);
  if (faceA > 0.3) {
    ctx.save();
    ctx.globalAlpha = faceA;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-HW * 0.38, yt - 2); ctx.lineTo(HW * 0.38, yt - 2); ctx.lineTo(0, yt + TH * 0.58); ctx.closePath(); ctx.fill();
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sd * HW * 0.38, yt - 2); ctx.lineTo(sd * HW * 0.7, yt + TH * 0.2); ctx.lineTo(sd * HW * 0.26, yt + TH * 0.44); ctx.lineTo(0, yt + TH * 0.58);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(88,36,74,.9)'; ctx.stroke();
    }
    ctx.fillStyle = p.necktie ?? '#e8453c';
    ctx.beginPath(); ctx.roundRect(-2.8, yt, 5.6, 5, 1.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2.8, yt + 4.4); ctx.lineTo(2.8, yt + 4.4); ctx.lineTo(3.8, yt + TH * 0.42); ctx.lineTo(0, yt + TH * 0.52); ctx.lineTo(-3.8, yt + TH * 0.42); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, yt + TH * 0.58); ctx.lineTo(0, yb + 3); ctx.stroke();
  ctx.fillStyle = '#ffe680';
  for (const f of [0.7, 0.86]) { ctx.beginPath(); ctx.arc(HW * 0.13, yt + TH * f, 1.9, 0, PI * 2); ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = OUT; ctx.stroke(); }
  ctx.strokeStyle = 'rgba(0,0,0,.26)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-HW * 0.76, yt + TH * 0.4); ctx.lineTo(-HW * 0.44, yt + TH * 0.4); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(-HW * 0.7, yt + TH * 0.4); ctx.lineTo(-HW * 0.56, yt + TH * 0.31); ctx.lineTo(-HW * 0.46, yt + TH * 0.4); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(-HW, yt, HW, yb);
  const gold = suit === '#f0bd2c';
  g.addColorStop(0, `rgba(255,255,255,${gold ? 0.45 : 0.2})`);
  g.addColorStop(0.3, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(60,20,50,.16)');
  ctx.fillStyle = g;
  ctx.fillRect(-HW * 1.3, yt - 3, HW * 2.6, TH + 8);
}

type Eyewear = 'office' | 'heart' | 'star' | 'round' | 'retro';

function lensPath(c: CanvasRenderingContext2D, style: Eyewear, r: number) {
  c.beginPath();
  if (style === 'heart') {
    const k = r * 1.04;
    c.moveTo(0, k * 0.92);
    c.bezierCurveTo(-k * 1.5, k * 0.1, -k * 1.0, -k * 1.02, 0, -k * 0.3);
    c.bezierCurveTo(k * 1.0, -k * 1.02, k * 1.5, k * 0.1, 0, k * 0.92);
    c.closePath();
  } else if (style === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -PI / 2 + (i * PI) / 5, rad = i % 2 ? r * 0.58 : r * 1.14;
      if (i === 0) c.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); else c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    c.closePath();
  } else if (style === 'retro') c.roundRect(-r * 1.04, -r * 0.84, r * 2.08, r * 1.56, r * 0.5);
  else c.arc(0, 0, r, 0, PI * 2);
}

/** Office glasses (thin, clear) or beach sunglasses (heart / star / round sunset / retro). Lenses are centred on the eyes. */
function drawGlasses(ctx: CanvasRenderingContext2D, eg: number, ey: number, size: number, style: Eyewear = 'office') {
  const T = {
    office: { frame: '#2a2530', a: 'rgba(200,235,255,.22)', b: 'rgba(200,235,255,.22)', lw: 2.4, r: 11.8 },
    heart: { frame: '#ff4f8a', a: 'rgba(255,176,96,.84)', b: 'rgba(255,72,142,.88)', lw: 3, r: 11.4 },
    star: { frame: '#ffc61a', a: 'rgba(120,228,255,.84)', b: 'rgba(40,120,224,.9)', lw: 3, r: 11.2 },
    round: { frame: '#fff6e0', a: 'rgba(255,200,72,.84)', b: 'rgba(255,92,122,.88)', lw: 3.2, r: 12 },
    retro: { frame: '#27c9b0', a: 'rgba(76,86,130,.9)', b: 'rgba(20,24,52,.95)', lw: 3.2, r: 11.4 },
  }[style];
  const r = T.r * size;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // temples + bridge first (behind the lenses)
  const arm = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.strokeStyle = OUT; ctx.lineWidth = T.lw + 2.6; ctx.stroke();
    ctx.strokeStyle = T.frame; ctx.lineWidth = T.lw; ctx.stroke();
  };
  for (const s of [-1, 1]) arm(s * (eg + r * 0.92), ey - 1, s * (eg + r * 0.92 + 8), ey - 3.4);
  ctx.beginPath(); ctx.moveTo(-eg + r * 0.9, ey - 1.4); ctx.quadraticCurveTo(0, ey - 5.4, eg - r * 0.9, ey - 1.4);
  ctx.strokeStyle = OUT; ctx.lineWidth = T.lw + 2.6; ctx.stroke();
  ctx.strokeStyle = T.frame; ctx.lineWidth = T.lw; ctx.stroke();
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * eg, ey);
    lensPath(ctx, style, r);
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, T.a); g.addColorStop(1, T.b);
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    lensPath(ctx, style, r); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.3;
    ctx.beginPath(); ctx.moveTo(-r * 0.58, -r * 0.1); ctx.lineTo(-r * 0.12, -r * 0.62); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.22); ctx.lineTo(-r * 0.5, -r * 0.02); ctx.stroke();
    if (style !== 'office') { // horizon line reflected in the lens
      ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-r, r * 0.34); ctx.lineTo(r, r * 0.34); ctx.stroke();
    }
    ctx.restore();
    lensPath(ctx, style, r);
    ctx.strokeStyle = OUT; ctx.lineWidth = T.lw + 2.6; ctx.stroke();
    ctx.strokeStyle = T.frame; ctx.lineWidth = T.lw; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** hand position (cat units, relative to the feet) of the idle / holding arm. x is positive: multiply by the side. */
export function catHandPos(build: Partial<CatCfg> | null, ang: number) {
  const L = catLayout(build);
  const cyT = L.yt + L.TH / 2, shY = L.yt + 8;
  const shRel = clamp((shY - cyT) / (L.TH / 2), -0.97, 0.97);
  const shX = L.HW * Math.sqrt(1 - shRel * shRel) * (1 + 0.13 * shRel) * 0.82;
  return { x: shX + Math.sin(ang) * 11.5, y: shY + Math.cos(ang) * 11.5 };
}

/** Customer hats. All share one outline weight, a soft highlight and symmetric shapes that sit on the head dome. */
function drawTopper(ctx: CanvasRenderingContext2D, m: Cat, kind: 'pirate' | 'beach' | 'visor') {
  ctx.save();
  ctx.translate(m.hat.x * 0.5, -19 + m.hat.y * 0.5);
  ctx.rotate(m.hat.rot * 0.4);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const LW = 2.8;
  if (kind === 'pirate') {
    // tricorn: black crown, curved brim with gold trim, skull & bones, red plume
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(-31, 0);
      ctx.bezierCurveTo(-32, -13, -24, -18, -15, -20);
      ctx.bezierCurveTo(-8, -30, 8, -30, 15, -20);
      ctx.bezierCurveTo(24, -18, 32, -13, 31, 0);
      ctx.bezierCurveTo(18, -6, -18, -6, -31, 0);
      ctx.closePath();
    };
    // plume (behind the hat)
    ctx.save(); ctx.translate(20, -19); ctx.rotate(0.65);
    ctx.beginPath(); ctx.ellipse(0, -7, 3.8, 10.5, 0, 0, PI * 2); ctx.fillStyle = '#ff5a6a'; ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, -1); ctx.stroke();
    ctx.restore();
    body(); ctx.fillStyle = '#2b2838'; ctx.fill();
    ctx.save(); body(); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.ellipse(-12, -19, 14, 4, -0.5, 0, PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-27, -3.6); ctx.bezierCurveTo(-16, -9, 16, -9, 27, -3.6); ctx.stroke();
    body(); ctx.lineWidth = LW; ctx.strokeStyle = OUT; ctx.stroke();
    // skull + crossbones
    ctx.save(); ctx.translate(0, -15.5);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7.4, 4.6); ctx.lineTo(7.4, 10); ctx.moveTo(7.4, 4.6); ctx.lineTo(-7.4, 10); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 5.2, 0, PI * 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-3, 2.2, 6, 4.6, 1.6); ctx.fill();
    ctx.fillStyle = '#2b2838'; ctx.beginPath(); ctx.arc(-1.9, -0.5, 1.4, 0, PI * 2); ctx.arc(1.9, -0.5, 1.4, 0, PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 1.4); ctx.lineTo(-0.9, 2.8); ctx.lineTo(0.9, 2.8); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (kind === 'beach') {
    // straw sun hat: wide round brim, domed crown, pink band with a hibiscus
    ctx.beginPath(); ctx.ellipse(0, -1, 32, 8.4, 0, 0, PI * 2);
    ctx.fillStyle = '#efcb70'; ctx.fill(); ctx.lineWidth = LW; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -1, 32, 8.4, 0, 0, PI * 2); ctx.clip();
    ctx.strokeStyle = 'rgba(160,110,34,.5)'; ctx.lineWidth = 1.2;
    for (const k of [0.82, 0.64, 0.46]) { ctx.beginPath(); ctx.ellipse(0, -1, 32 * k, 8.4 * k, 0, 0, PI * 2); ctx.stroke(); }
    ctx.restore();
    const crown = () => {
      ctx.beginPath();
      ctx.moveTo(-17, -1);
      ctx.bezierCurveTo(-18, -17, -9, -25, 0, -25);
      ctx.bezierCurveTo(9, -25, 18, -17, 17, -1);
      ctx.closePath();
    };
    crown(); ctx.fillStyle = '#f8de8e'; ctx.fill();
    ctx.save(); crown(); ctx.clip();
    ctx.strokeStyle = 'rgba(176,124,40,.38)'; ctx.lineWidth = 1.1;
    for (let k = -14; k <= 14; k += 4.5) { ctx.beginPath(); ctx.moveTo(k * 0.7, -26); ctx.lineTo(k, 0); ctx.stroke(); }
    ctx.fillStyle = '#ff7aa8'; ctx.fillRect(-20, -11, 40, 7.4);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-20, -11, 40, 1.8);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(-8, -19, 5, 2.4, -0.7, 0, PI * 2); ctx.fill();
    ctx.restore();
    crown(); ctx.lineWidth = LW; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -1, 32, 8.4, 0, 0.04, PI - 0.04); ctx.lineWidth = LW; ctx.stroke();
    for (let k = 0; k < 5; k++) { const a = (k / 5) * PI * 2 - PI / 2; ctx.beginPath(); ctx.ellipse(11 + Math.cos(a) * 3.6, -7.4 + Math.sin(a) * 3.6, 3, 3, 0, 0, PI * 2); ctx.fillStyle = '#ff3d6e'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(11, -7.4, 2, 0, PI * 2); ctx.fillStyle = '#ffd93b'; ctx.fill();
  } else {
    // visor: curved sky-blue band across the head + a curved yellow bill in front
    ctx.beginPath();
    ctx.moveTo(-28, 4); ctx.bezierCurveTo(-27, -11, 27, -11, 28, 4);
    ctx.lineTo(28, 10); ctx.bezierCurveTo(27, -4, -27, -4, -28, 10); ctx.closePath();
    ctx.fillStyle = '#7fd8ff'; ctx.fill(); ctx.lineWidth = LW; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath(); ctx.moveTo(-20, -2); ctx.bezierCurveTo(-10, -8, 10, -8, 20, -2); ctx.lineTo(20, 0.4); ctx.bezierCurveTo(10, -5, -10, -5, -20, 0.4); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-24, 8); ctx.bezierCurveTo(-14, 21, 14, 21, 24, 8); ctx.bezierCurveTo(14, 13, -14, 13, -24, 8); ctx.closePath();
    ctx.fillStyle = '#ffd24a'; ctx.fill(); ctx.lineWidth = LW; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-8, 13, 7, 1.6, 0.1, 0, PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawLei(ctx: CanvasRenderingContext2D, HW: number, yt: number, TH: number, faceA: number) {
  ctx.save();
  ctx.globalAlpha = faceA;
  const cols = ['#ff5a8a', '#ffd93b', '#ff8a3a', '#ffffff', '#ff5a8a', '#7fe08a'];
  const N = 9;
  const pt = (i: number) => { const u = (i / N) * 2 - 1; return { x: u * HW * 0.62, y: yt + 9 + (1 - u * u) * TH * 0.18 }; };
  ctx.strokeStyle = '#3a8a4a'; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i <= N; i++) { const q = pt(i); if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); }
  ctx.stroke();
  for (let i = 0; i <= N; i++) {
    const q = pt(i), col = cols[i % cols.length];
    ctx.beginPath(); ctx.arc(q.x, q.y, 3.5, 0, PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = col === '#ffd93b' ? '#ff5a8a' : '#ffd93b'; ctx.beginPath(); ctx.arc(q.x, q.y, 1.2, 0, PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawCap(ctx: CanvasRenderingContext2D, m: Cat) {
  ctx.save();
  ctx.translate(m.hat.x * 0.6, m.hat.y * 0.6);
  ctx.rotate(m.hat.rot * 0.6 - 0.03);
  ctx.lineJoin = 'round';
  // button
  ell(ctx, 0, -39.5, 6.6, 3.3, '#5568d8', OUT, 2.4);
  // dome
  ctx.beginPath();
  ctx.moveTo(-28, -9);
  ctx.bezierCurveTo(-30, -34, -12, -40, 2, -38);
  ctx.bezierCurveTo(20, -38, 31, -26, 29, -9);
  ctx.closePath();
  ctx.fillStyle = '#6f8cee';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(70,56,190,.45)';
  ctx.beginPath(); ctx.ellipse(-27, -22, 10, 22, 0, 0, PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(29, -22, 6, 20, 0, 0, PI * 2); ctx.fill();
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  // cream front panel
  ctx.beginPath();
  ctx.moveTo(-19, -11);
  ctx.bezierCurveTo(-19, -30, -6, -35, 6, -34);
  ctx.bezierCurveTo(18, -33, 25, -24, 24, -11);
  ctx.closePath();
  ctx.fillStyle = '#ece6d2';
  ctx.fill();
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.ellipse(-8, -29, 7, 2.6, -0.4, 0, PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-9, -26, 24, 12, 3);
  ctx.fillStyle = '#cfc5ad';
  ctx.fill();
  // visor
  ctx.beginPath();
  ctx.moveTo(-27, -12);
  ctx.lineTo(31, -15);
  ctx.quadraticCurveTo(40, -14, 38, -7);
  ctx.lineTo(36, -3);
  ctx.quadraticCurveTo(4, 3, -26, -2);
  ctx.quadraticCurveTo(-31, -7, -27, -12);
  ctx.closePath();
  ctx.fillStyle = '#6f8cee';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#4553c9';
  ctx.beginPath();
  ctx.moveTo(-30, -4); ctx.quadraticCurveTo(4, 1, 40, -6); ctx.lineTo(40, 6); ctx.lineTo(-30, 6); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.beginPath(); ctx.ellipse(-4, -11, 18, 2, -0.04, 0, PI * 2); ctx.fill();
  ctx.restore();
  ctx.lineWidth = 2.8;
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------
//  Cat drawing (origin = feet on the ground). Short chibi proportions.
// ---------------------------------------------------------------
function drawCatInner(ctx: CanvasRenderingContext2D, m: Cat, scale = 1) {
  const p = m.pal;
  const Ly = catLayout();
  const { HW, TH, yt, yb, yHip, hs } = Ly;
  const mv = m.mv, r = m.r;
  const sinP = Math.sin(m.phase);
  // face only fades out when walking away from the camera; sideways / towards the camera it is 100% opaque
  const faceA = clamp((m.fy + 0.82) / 0.12, 0, 1);
  const back = faceA < 0.5;
  const base = m.rod.on ? ctx.getTransform() : null;
  const chef = m.chef.on;
  const sk = m.skates ? 1 : 0;
  const bd = m.board ? 1 : 0;
  const ride = Math.max(sk, bd);
  const lk = Ly.leg / 17.4;

  // smooth up/down: highest when the legs pass each other, lowest when a foot lands (cos^2, no kinks)
  const bob = (0.5 + 0.5 * Math.cos(2 * m.phase)) * (3 + 2.8 * r) * mv * (1 - 0.8 * ride);
  const breath = Math.sin(m.t * 2.6) * (1 - mv);
  const air = bob * 0.6 + m.hopY * 0.9;

  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(scale, scale);

  ctx.save();
  ctx.globalAlpha = Math.max(0.08, 0.22 - air * 0.012);
  ell(ctx, 0, 0, 18 - air * 0.5, 6.8 - air * 0.18, '#3a2a10');
  ctx.restore();

  const sy = 1 - m.sq * 0.08 + breath * 0.02 + r * 0.025;
  const sx = 1 + m.sq * 0.08 - breath * 0.02 - r * 0.018;
  ctx.scale(sx, sy);
  if (bd) drawBoard(ctx, m);
  ctx.translate(0, -bob - m.hopY - bd * 1.5 - sk * 2);

  // ---- legs, torso and arms are outlined TOGETHER first, then filled TOGETHER:
  //      the outline never shows between them (they merge) but each is still its own part.
  // Smooth walk: feet swing on rounded arcs (lift is squared => no kinks), knees bend towards the facing direction,
  // and every foot points the way the cat is going.
  const kk = Math.max(lk, 0.92);
  const stride = (9 + 5.6 * r) * (1 + 0.75 * sk) * kk;
  const hipX = Math.min(7 * CAT_CFG.legGap, HW * 0.8);
  const face = clamp(m.fx, -1, 1);
  const fa = Math.abs(face);
  const legs = [-1, 1].map((sd) => {
    const ph = m.phase + (sd > 0 ? 0 : PI);
    const stepMul = 1 - 0.9 * bd;
    const fwd = Math.sin(ph) * mv * stepMul;
    const up = Math.max(0, Math.cos(ph));
    const lift = up * up * (4.8 + 3.4 * r) * mv * (1 - 0.78 * sk) * stepMul * kk;
    const pitch = fwd * 0.34 * (1 - sk);
    const fx = sd * (hipX + 1.2 - bd * 2.4) + m.fx * (fwd * stride + bd * 0.6);
    const fy = Ly.footY - lift + m.fy * fwd * stride * 0.55 - 2 * sk;
    const y0 = yb - 7;
    const mx = (sd * hipX + fx) / 2, my = (y0 + fy - 1) / 2;
    const bend = (1.4 + lift * 0.55) * (1 + 0.4 * r) + bd * 1.6;
    return {
      sd, x0: sd * hipX, y0, fx, fy,
      kx: mx + (fa > 0.2 ? face : 0.0) * bend + sd * 0.8 * (1 - fa), ky: my - lift * 0.18,
      rot: -face * pitch, face,
    };
  });

  const skidLean = m.skid * -Math.sign(m.vx || 1) * 0.3;
  const lean = 0.8 * (m.fx * (0.1 + 0.16 * r + 0.1 * sk + 0.12 * bd) * mv + skidLean - m.fx * m.tug * 0.22
    + Math.sin(m.t * 1.3) * 0.03 * (1 - mv));
  ctx.save();
  ctx.translate(0, yHip);
  ctx.rotate(lean);
  ctx.translate(0, -yHip);
  /** run `fn` in the un-leaned frame (legs stay planted while the upper body leans) */
  const unlean = (fn: () => void) => {
    ctx.save();
    ctx.translate(0, yHip);
    ctx.rotate(-lean);
    ctx.translate(0, -yHip);
    fn();
    ctx.restore();
  };

  const carrying = m.carry.length > 0;
  const rod = m.rod;
  const carryFront = carrying && m.fy >= -0.3;

  if (!(m.fy < -0.3)) drawTail(ctx, m, p);
  if (carrying && !carryFront) drawCarry(ctx, m, p, 'basket');

  // round, egg-shaped body: narrow shoulders, widest at the belly
  const EGG_K = 0.13;
  const cyT = yt + TH / 2;
  const torso = () => {
    ctx.beginPath();
    const N = 48;
    for (let i = 0; i < N; i++) {
      const a = -PI / 2 + (i / N) * PI * 2;
      const sn = Math.sin(a), cs = Math.cos(a);
      const x = HW * cs * (1 + EGG_K * sn), y = cyT + (TH / 2) * sn;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };
  const shY = yt + 8;
  const shRel = clamp((shY - cyT) / (TH / 2), -0.97, 0.97);
  const shX = HW * Math.sqrt(1 - shRel * shRel) * (1 + EGG_K * shRel) * 0.82;

  // fishing-rod geometry (needed by the arms)
  const rs = m.fx < 0 ? -1 : 1;
  let rdx = 0, rdy = 0, bx = 0;
  const by = yt + TH * 0.5;
  if (rod.on) {
    const a2 = -2.45 + rod.raise * 0.85;
    rdx = -rs * Math.cos(a2);
    rdy = Math.sin(a2);
    bx = rs * 2;
  }

  // arm poses that merge with the body (idle / walk / run / cheer)
  const armsMerged = !chef && !rod.on && !carryFront;
  const arms: { sd: number; hx: number; hy: number; hand: Hand }[] = [];
  if (armsMerged) {
    const A = 11.5;
    for (const sd of [-1, 1]) {
      const swing = m.hold === sd ? 0 : Math.sin(m.phase + (sd > 0 ? 0 : PI) + PI - 0.5); // hands lag a little behind the legs
      const idleSway = Math.sin(m.t * 1.9 + sd * 1.3) * 0.045 * (1 - mv);
      let ang = 0.3 + idleSway; // IDLE: hanging down, relaxed
      ang += (0.5 * mv * (1 - r) + 0.8 * r) * swing * (1 - 0.55 * Math.abs(m.fx)) * (1 - 0.7 * bd) + 0.3 * r + 0.14 * sk + 0.62 * bd; // WALK pendulum / RUN pump / board balance
      ang = Math.max(0.06, ang);
      const cheer = m.hold === sd ? 0 : clamp(m.exc * (1 - r) * 1.15, 0, 1); // CHEER: arms out and up with thumbs
      const cheerAng = 2.0 + Math.sin(m.t * 11 + sd * 2) * 0.24;
      ang = ang + (cheerAng - ang) * cheer;
      if (m.hold === sd) ang = m.holdAng + Math.sin(m.phase * 2) * 0.03 * mv;
      const len = A * (1 - 0.12 * r * (1 - Math.abs(swing))) * (1 + 0.1 * cheer);
      const hx = sd * shX + sd * Math.sin(ang) * len + m.fx * swing * (7 + 4 * r) * mv;
      const hy = shY + Math.cos(ang) * len + m.fy * swing * 1.6 * mv - Math.max(0, swing) * 2.2 * mv * Math.abs(m.fx);
      arms.push({
        sd, hx, hy,
        hand: { x: hx, y: hy, s: sd, rot: sd * (0.1 + 0.04 * Math.sin(m.t * 9) * m.exc) * cheer, thumb: clamp((cheer - 0.35) * 2, 0, 1) },
      });
    }
  }

  // Depth: when moving right the screen-LEFT arm + leg come in FRONT of the body and the screen-RIGHT ones go BEHIND it
  // (and the other way round when moving left). Standing still / vertical movement keeps the merged look.
  const turn = clamp(m.fx * 1.6, -1, 1) * mv;
  const depth = Math.abs(turn) > 0.5;
  const frontSd = turn > 0 ? -1 : 1;
  const legBehind = depth ? legs.filter((L) => L.sd !== frontSd) : [];
  const legFront = depth ? legs.filter((L) => L.sd === frontSd) : [];
  const legMerged = depth ? [] : legs;
  const armBehind = depth ? arms.filter((a) => a.sd !== frontSd) : [];
  const armFront = depth ? arms.filter((a) => a.sd === frontSd) : [];
  const armMerged = depth ? [] : arms;

  type Leg = (typeof legs)[number];
  type Arm = (typeof arms)[number];
  const footC = (L: Leg) => ({ x: L.fx + L.sd * 1.7 * (1 - fa) + L.face * 3.3, y: L.fy });
  const footShape = (L: Leg) => {
    const c = footC(L);
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, FOOT_RX * (1 + 0.26 * fa), FOOT_RY * (1 - 0.1 * fa), L.rot, 0, PI * 2);
  };
  /** thigh + shin, joined at a knee that bends towards the facing direction */
  const legSegs = (L: Leg): [number, number, number, number, number, number][] => {
    const rm = (LEG_R0 + LEG_R1) / 2;
    return [[L.x0, L.y0, LEG_R0, L.kx, L.ky, rm * 1.04], [L.kx, L.ky, rm * 1.04, L.fx, L.fy - 1, LEG_R1]];
  };
  const legPath = (L: Leg, fill: boolean) => {
    for (const [x0, y0, r0, x1, y1, r1] of legSegs(L)) {
      limbShape(ctx, x0, y0, r0, x1, y1, r1);
      if (fill) ctx.fill(); else ctx.stroke();
    }
  };
  const legOutline = (L: Leg) => {
    ctx.lineWidth = LIMB_OUT;
    legPath(L, false);
    footShape(L); ctx.stroke();
  };
  const toeMarks = (L: Leg) => {
    const c = footC(L);
    ctx.strokeStyle = 'rgba(88,36,74,.34)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    const rx = FOOT_RX * (1 + 0.26 * fa), ry = FOOT_RY * (1 - 0.1 * fa);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(L.rot);
    // seen from the side: two short toe lines at the toe end; seen from the front: toe lines at the bottom
    ctx.globalAlpha = fa;
    const tx = L.face * rx * 0.55;
    ctx.beginPath(); ctx.moveTo(tx, -ry * 0.45); ctx.lineTo(tx + L.face * 1.3, -ry * 0.1); ctx.moveTo(tx, ry * 0.05); ctx.lineTo(tx + L.face * 1.3, ry * 0.4); ctx.stroke();
    ctx.globalAlpha = 1 - fa;
    ctx.beginPath(); ctx.moveTo(-1.8, ry * 0.18); ctx.lineTo(-1.8, ry * 0.66); ctx.moveTo(1.8, ry * 0.18); ctx.lineTo(1.8, ry * 0.66); ctx.stroke();
    ctx.restore();
  };
  const legFill = (L: Leg, shade = 0) => {
    ctx.fillStyle = p.fur;
    legPath(L, true);
    if (p.stripe) {
      ctx.strokeStyle = p.stripe;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'butt';
      for (const f of [0.6, 0.82]) {
        const lx = L.kx + (L.fx - L.kx) * f, ly = L.ky + (L.fy - 1 - L.ky) * f;
        ctx.beginPath(); ctx.moveTo(lx - 3.9, ly); ctx.lineTo(lx + 3.9, ly); ctx.stroke();
      }
      ctx.lineCap = 'round';
    }
    ctx.fillStyle = p.belly;
    footShape(L); ctx.fill();
    if (!sk) toeMarks(L);
    if (shade > 0) {
      ctx.fillStyle = `rgba(88,36,74,${shade})`;
      legPath(L, true);
      footShape(L); ctx.fill();
    }
  };
  const armOutline = (a: Arm) => {
    ctx.lineWidth = LIMB_OUT;
    limbShape(ctx, a.sd * shX, shY, ARM_R0, a.hx, a.hy, ARM_R1); ctx.stroke();
    handPass(ctx, a.hand, p, 'o');
  };
  const armFill = (a: Arm, shade = 0) => {
    ctx.fillStyle = p.suit ?? p.fur;
    limbShape(ctx, a.sd * shX, shY, ARM_R0, a.hx, a.hy, ARM_R1); ctx.fill();
    handPass(ctx, a.hand, p, 'f');
    if (shade > 0) {
      ctx.fillStyle = `rgba(88,36,74,${shade})`;
      limbShape(ctx, a.sd * shX, shY, ARM_R0, a.hx, a.hy, ARM_R1); ctx.fill();
      ctx.beginPath(); ctx.ellipse(a.hand.x, a.hand.y, PAW_RX, PAW_RY, 0, 0, PI * 2); ctx.fill();
    }
  };

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUT;

  // ---- behind the body (far-side limbs)
  unlean(() => { for (const L of legBehind) { ctx.strokeStyle = OUT; legOutline(L); legFill(L, 0.16); } });
  for (const a of armBehind) { ctx.strokeStyle = OUT; armOutline(a); armFill(a, 0.16); }

  // ---- merged limbs: every outline first, then every fill (no line between limb and body)
  ctx.strokeStyle = OUT;
  unlean(() => { for (const L of legMerged) legOutline(L); });
  for (const a of armMerged) armOutline(a);
  ctx.lineWidth = 5.6;
  torso();
  ctx.stroke();
  // fur over the body outline where the tail leaves the body (before the arms are filled, so hands stay on top)
  if (!(m.fy < -0.3)) drawTail(ctx, m, p, 'base');
  unlean(() => { for (const L of legMerged) legFill(L); });
  for (const a of armMerged) armFill(a);
  torso();
  ctx.fillStyle = p.fur;
  ctx.fill();

  // torso markings (clipped to the body)
  ctx.save();
  torso();
  ctx.clip();
  if (p.calico) {
    ell(ctx, -HW * 0.78, yt + TH * 0.72, HW * 0.55, TH * 0.42, p.patchA ?? '#5d6896');
    ell(ctx, HW * 0.8, yt + TH * 0.3, HW * 0.5, TH * 0.34, p.patchB ?? '#ff9f45');
  }
  if (p.stripe) {
    ctx.strokeStyle = p.stripe;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    for (const f of [0.26, 0.38, 0.5, 0.62, 0.74, 0.86]) {
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sd * HW * 1.1, yt + TH * f);
        ctx.lineTo(sd * HW * 0.7, yt + TH * f + 1);
        ctx.stroke();
      }
    }
  }
  if (!p.calico) {
    ctx.save();
    ctx.globalAlpha = faceA;
    if (!p.suit) ell(ctx, 0, yt + TH * 0.58, HW * 0.66, TH * 0.4, p.belly);
    ctx.restore();
  }
  if (p.suit) drawSuit(ctx, p, HW, yt, yb, TH, faceA);
  // soft round shading on the lower belly
  ctx.globalAlpha = 0.1;
  ell(ctx, 0, yb + 2, HW * 1.0, TH * 0.22, '#58244a');
  ctx.globalAlpha = 0.2;
  ell(ctx, -HW * 0.42, yt + TH * 0.22, HW * 0.2, TH * 0.1, '#ffffff');
  ctx.restore();

  if (p.lei && faceA > 0.3) drawLei(ctx, HW, yt, TH, faceA);
  // faint hip creases: the legs are separate parts, but with no hard line
  ctx.strokeStyle = 'rgba(88,36,74,.2)';
  ctx.lineWidth = 1.7;
  ctx.lineCap = 'round';
  for (const L of legs) {
    ctx.beginPath();
    ctx.moveTo(L.sd * hipX - 5, yb - 5.2);
    ctx.quadraticCurveTo(L.sd * hipX, yb - 2, L.sd * hipX + 5, yb - 5.2);
    ctx.stroke();
  }

  // ---- in front of the body (near-side limbs keep their own outline)
  unlean(() => { for (const L of legFront) { ctx.strokeStyle = OUT; legOutline(L); legFill(L); } });
  for (const a of armFront) { ctx.strokeStyle = OUT; armOutline(a); armFill(a); }

  if (sk) unlean(() => {
    for (const L of legs) {
      const c = footC(L);
      drawSkate(ctx, c.x, c.y, L.rot, m.phase * 3 + L.sd, Math.abs(m.fx) > 0.2 ? Math.sign(m.fx) : 1, fa);
    }
  });

  // fishing rod
  if (rod.on) {
    const S = { x: bx - rdx * 8, y: by - rdy * 8 };
    const T = { x: bx + rdx * 70, y: by + rdy * 70 + rod.bend * 15 };
    const C = { x: bx + rdx * 35, y: by + rdy * 35 + rod.bend * 6 };
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.quadraticCurveTo(C.x, C.y, T.x, T.y);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 5.4;
    ctx.stroke();
    ctx.strokeStyle = '#d29a52';
    ctx.lineWidth = 2.9;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(bx + rdx * 5, by + rdy * 5);
    ctx.strokeStyle = '#e0565f';
    ctx.lineWidth = 4;
    ctx.stroke();
    const cur = ctx.getTransform();
    const pt = base!.inverse().transformPoint(cur.transformPoint(new DOMPoint(T.x, T.y)));
    rod.wx = pt.x;
    rod.wy = pt.y;
  }

  // arms that cross the body (fishing / chef) keep their own outline so they stay visible
  const armDraw = (sx0: number, sy0: number, hx: number, hy: number) => limbDraw(ctx, sx0, sy0, ARM_R0, hx, hy, ARM_R1, p.fur);
  if (chef) {
    const k = m.chef.k, hold = m.chef.hold;
    const lhx = -HW * 0.5 * hold - (HW + 6) * (1 - hold);
    const lhy = yt + TH * 0.5 + hold * 8;
    const carr: [number, number, number][] = [[-1, lhx, lhy], [1, HW + 2, yt + TH * 0.7 - 26 * k]];
    for (const [sd, hx, hy] of carr) {
      armDraw(sd * shX, shY, hx, hy);
      if (sd > 0) drawKnife(ctx, hx, hy, 0.12 - k * 0.1);
      ell(ctx, hx, hy, 5.8, 5.8, p.belly, OUT, 2);
    }
  } else if (rod.on) {
    for (const sd of [-1, 1]) {
      let sx0 = sd * shX, sy0 = shY, hx: number, hy: number;
      if (sd === rs) { hx = bx + rdx * 9; hy = by + rdy * 9; }
      else { sx0 = -rs * 5; sy0 = yt + 7; hx = bx + rdx * 2; hy = by + rdy * 2; }
      armDraw(sx0, sy0, hx, hy);
      ell(ctx, hx, hy, 5.8, 5.8, p.belly, OUT, 2);
    }
  }


  // ---- head
  const nod = chef ? (1 - m.chef.k) * 1.6 : 0;
  // head: ONLY a smooth, slightly delayed up/down bob while moving (no tilt, no sideways sway)
  const headBob = (0.5 + 0.5 * Math.cos(2 * m.phase - 0.7)) * (0.9 + 1.1 * r) * mv * (1 - 0.8 * ride) - m.alert * 2.5 + breath * 0.5 + nod;
  const headTilt = Math.sin(m.t * 0.9) * 0.03 * (1 - mv) + m.tilt - lean * 0.5 + Math.sin(m.t * 9) * 0.02 * m.exc;
  ctx.save();
  ctx.translate(0, Ly.headY + headBob);
  ctx.rotate(headTilt);
  ctx.scale((1 + m.sq * 0.035 + r * 0.01) * hs, (1 - m.sq * 0.035) * hs);

  // ears (reference 3): wide triangle that rises from the top corners of the head, rounded tip, leaning outward
  // ears (reference 2): broad soft triangle. The outer edge flows straight up out of the cheek line,
  // the tip is gently rounded, the inner edge is a smooth concave slope down into a shallow valley.
  const earPath = (s: number) => {
    ctx.beginPath();
    ctx.moveTo(s * 30.6, -2);
    ctx.bezierCurveTo(s * 32.2, -14, s * 31.6, -28, s * 27.6, -40.4);
    ctx.bezierCurveTo(s * 26.6, -43.4, s * 23.8, -44.6, s * 21.4, -42.6);
    ctx.bezierCurveTo(s * 15.6, -38, s * 9.2, -30.4, s * 3.6, -21.5);
    ctx.closePath();
  };
  // pink part: a rounded triangle that hugs the outer side of the ear
  const earInner = (s: number) => {
    ctx.beginPath();
    ctx.moveTo(s * 27.2, -9.5);
    ctx.bezierCurveTo(s * 28.8, -19, s * 28.2, -29, s * 25.2, -36.6);
    ctx.bezierCurveTo(s * 24.4, -38.8, s * 22.4, -39.2, s * 20.8, -37.6);
    ctx.bezierCurveTo(s * 16.6, -33.4, s * 12, -28, s * 8.8, -22.4);
    ctx.quadraticCurveTo(s * 17.6, -18.4, s * 27.2, -9.5);
    ctx.closePath();
  };
  const withEar = (s: number, fn: () => void) => {
    const tw = s < 0 ? m.twL : m.twR;
    const flop = Math.sin(m.phase * 2 - 1.1) * (0.04 + 0.14 * r) * mv;
    const idleW = Math.sin(m.t * 2.1 + s * 1.3) * 0.03 * (1 - mv);
    const a = s * (CAT_CFG.earAngle * PI / 180 - 0.03 + (0.06 + 0.34 * r) * mv + flop) + idleW + Math.sin(m.t * 45) * 0.3 * tw + Math.sin(m.t * 32) * 0.07 * m.alert
      + Math.sin(m.t * 14 + s) * 0.05 * m.exc;
    ctx.save();
    ctx.translate(0, -CAT_CFG.earLift); // + = ear sits higher on the head
    ctx.translate(s * 19, -10);
    ctx.rotate(a);
    ctx.scale((1 + m.alert * 0.1) * CAT_CFG.earWidth, (1 + m.alert * 0.1) * CAT_CFG.earHeight);
    ctx.translate(-s * 19, 10);
    fn();
    ctx.restore();
  };
  const showEars = p.hat !== 'cap' && p.topper !== 'pirate' && p.topper !== 'beach';
  const tufts: [number, number][] = [];
  if (p.fluffy) {
    for (let i = 0; i < 13; i++) {
      const a = 0.04 * PI + (i / 12) * 0.92 * PI;
      for (const s of [-1, 1]) tufts.push([s * Math.cos(a) * 30.5, 5 + Math.sin(a) * 20.5]);
    }
  }

  // pass 1: every outline, pass 2: every fill -> ears and head merge into one silhouette
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 5.6;
  if (showEars) for (const s of [-1, 1]) withEar(s, () => { earPath(s); ctx.stroke(); });
  for (const [tx, ty] of tufts) { ctx.beginPath(); ctx.arc(tx, ty, 5.8, 0, PI * 2); ctx.stroke(); }
  headPath(ctx);
  ctx.stroke();

  ctx.fillStyle = p.fur;
  if (showEars) {
    for (const s of [-1, 1]) {
      withEar(s, () => {
        earPath(s);
        ctx.fill();
        if (p.calico) {
          ctx.save();
          earPath(s);
          ctx.clip();
          ell(ctx, s * 22, -30, 13, 18, s < 0 ? (p.patchA ?? '#5d6896') : (p.patchB ?? '#ff9f45'));
          ctx.restore();
        }
      });
    }
  }
  ctx.fillStyle = p.fur;
  for (const [tx, ty] of tufts) { ctx.beginPath(); ctx.arc(tx, ty, 5.8, 0, PI * 2); ctx.fill(); }
  headPath(ctx);
  ctx.fill();

  if (p.calico && !back) {
    ctx.save();
    headClip(ctx);
    ctx.beginPath();
    ctx.moveTo(-40, -40); ctx.lineTo(-2, -40);
    ctx.bezierCurveTo(-6, -20, 2, -6, -10, 4);
    ctx.bezierCurveTo(-16, 12, -22, 14, -40, 12);
    ctx.closePath();
    ctx.fillStyle = p.patchA ?? '#5d6896';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -40); ctx.lineTo(40, -40); ctx.lineTo(40, 14);
    ctx.bezierCurveTo(30, 12, 22, 10, 14, 6);
    ctx.bezierCurveTo(6, -4, 10, -14, 8, -40);
    ctx.closePath();
    ctx.fillStyle = p.patchB ?? '#ff9f45';
    ctx.fill();
    ctx.restore();
  }
  // ---- inner ears (drawn on top of the head so the pink is never clipped)
  if (showEars && !back) {
    for (const s of [-1, 1]) {
      withEar(s, () => {
        ctx.save();
        ctx.globalAlpha = faceA;
        earInner(s);
        const eg = ctx.createLinearGradient(s * 20, -40, s * 18, -12);
        eg.addColorStop(0, p.earIn);
        eg.addColorStop(1, p.earIn);
        ctx.fillStyle = eg;
        ctx.fill();
        // lighter top, deeper pink at the base
        earInner(s);
        const sh = ctx.createLinearGradient(s * 20, -40, s * 18, -12);
        sh.addColorStop(0, 'rgba(255,255,255,.34)');
        sh.addColorStop(0.55, 'rgba(255,255,255,0)');
        sh.addColorStop(1, 'rgba(200,60,90,.22)');
        ctx.fillStyle = sh;
        ctx.fill();
        // rim: soft salmon line all around, a bit stronger along the inner (fold) side
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        earInner(s);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(222,118,122,.95)';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 20.8, -37.2);
        ctx.bezierCurveTo(s * 16.6, -33.2, s * 12, -27.8, s * 8.8, -22.4);
        ctx.quadraticCurveTo(s * 17.6, -18.4, s * 27.2, -9.5);
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = 'rgba(205,92,104,.55)';
        ctx.stroke();
        ctx.restore();
      });
    }
  }

  if (back) {
    ctx.save();
    headClip(ctx);
    ctx.globalAlpha = 0.18 * (1 - faceA);
    ctx.fillStyle = p.furDark;
    ctx.fillRect(-40, -40, 80, 80);
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ell(ctx, -10, -17.5, 10, 3.8, '#ffffff');
    ctx.restore();
  }

  // face
  if (faceA > 0.01) {
    ctx.save();
    ctx.globalAlpha = faceA;
    const ox = clamp(m.fx * 7 + m.glx * 2.5, -8, 8);
    const oy = m.fy < 0 ? m.fy * 5 : 0;
    ctx.translate(ox, oy);
    ctx.scale(1 - Math.abs(m.fx) * 0.1, 1);

    if (p.stripe) {
      // forehead stripes (tapered) + cheek bars
      ctx.fillStyle = p.stripe;
      for (const [sx, h, w, tilt] of [[-8.5, 10, 3.4, 0.14], [0, 13.5, 4, 0], [8.5, 10, 3.4, -0.14]] as [number, number, number, number][]) {
        ctx.save();
        ctx.translate(sx, -23);
        ctx.rotate(tilt);
        ctx.beginPath();
        ctx.moveTo(-w / 2, 0);
        ctx.quadraticCurveTo(-w / 2, h * 0.6, 0, h);
        ctx.quadraticCurveTo(w / 2, h * 0.6, w / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = p.stripe;
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      for (const s of [-1, 1]) {
        for (const yy of [-1, 6]) {
          ctx.beginPath();
          ctx.moveTo(s * 30, yy);
          ctx.lineTo(s * 24.2, yy + 0.7);
          ctx.stroke();
        }
      }
    }
    if (!p.fluffy && !p.calico) {
      ctx.save();
      headClip(ctx);
      ell(ctx, 0, 18, 20, 10.5, p.muzzle ?? p.belly);
      ctx.restore();
    }

    const open = 1 - Math.sin(Math.min(1, m.blink) * PI) * 0.9;
    const lx = clamp(m.fx * 1.1 + m.glx, -1.3, 1.3);
    const ly = clamp(m.fy * 0.7 + m.gly + m.focus, -1.3, 1.3);
    const hp = m.eyesOpen ? false : (r > 0.55 ? Math.sin(m.t * 3.2) > -0.35 : m.happy > 0.45);
    const eg = 13.2 * CAT_CFG.eyeGap;
    const pu: PupilOpt = { y: CAT_CFG.pupilY, gap: CAT_CFG.pupilGap, size: CAT_CFG.pupilSize, sparkle: CAT_CFG.sparkle > 0.5 };
    drawEye(ctx, -eg, -1 - CAT_CFG.eyeY, -1, open, lx, ly, hp, p.iris, m.t, CAT_CFG.eyeSize, pu);
    drawEye(ctx, eg, -1 - CAT_CFG.eyeY, 1, open, lx, ly, hp, p.iris, m.t, CAT_CFG.eyeSize, pu);
    if (p.glasses || p.shades) drawGlasses(ctx, eg, -1 - CAT_CFG.eyeY, CAT_CFG.eyeSize, p.shades ?? 'office');

    ctx.save();
    ctx.globalAlpha = faceA * (0.3 + 0.4 * m.exc);
    const bl = 1 + 0.25 * m.exc;
    const bxx = Math.min(eg + 10.5, 27);
    ell(ctx, -bxx, 12.5, 4.6 * bl, 2.8 * bl, '#ff7fa0');
    ell(ctx, bxx, 12.5, 4.6 * bl, 2.8 * bl, '#ff7fa0');
    ctx.restore();

    // nose
    ctx.beginPath();
    ctx.moveTo(-3.2, 10.2);
    ctx.quadraticCurveTo(0, 9.4, 3.2, 10.2);
    ctx.quadraticCurveTo(1.6, 13.6, 0, 13.8);
    ctx.quadraticCurveTo(-1.6, 13.6, -3.2, 10.2);
    ctx.closePath();
    ctx.fillStyle = '#ff8fa8';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = OUT;
    ctx.stroke();

    // cat mouth: philtrum, a smooth "w" upper lip and one clean U-shaped open smile with a clipped tongue
    const o = clamp(0.72 + 0.3 * m.exc + (r > 0.3 ? 0.12 * Math.abs(sinP) : 0.04 * Math.sin(m.t * 5)), 0.55, 1);
    const my = 15.8, mw = 6.4, md = 8.6 * o;
    const mouth = () => {
      ctx.beginPath();
      ctx.moveTo(-mw, my);
      ctx.quadraticCurveTo(-mw * 0.5, my + 3.4, 0, my);
      ctx.quadraticCurveTo(mw * 0.5, my + 3.4, mw, my);
      ctx.bezierCurveTo(mw * 0.9, my + md * 1.08, -mw * 0.9, my + md * 1.08, -mw, my);
      ctx.closePath();
    };
    mouth();
    ctx.fillStyle = '#6a1f4a';
    ctx.fill();
    ctx.save();
    mouth();
    ctx.clip();
    // small tongue that only peeks out of the bottom of the smile (never fills the whole mouth)
    ell(ctx, 0, my + md * 0.84, 3.7, md * 0.3 + 0.4, '#ff8fb0');
    ctx.strokeStyle = 'rgba(214,96,116,.7)';
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(0, my + md * 0.6); ctx.lineTo(0, my + md * 0.78); ctx.stroke();
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = OUT;
    mouth();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 13.7); ctx.lineTo(0, my);
    ctx.stroke();

    // whiskers: straight lines poking out of the cheeks
    const fl = -mv * (2 + 3 * r);
    ctx.lineWidth = 2.3;
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sd * 25, 11);
      ctx.lineTo(sd * (41 + fl), 10.5 + Math.sin(m.t * 2 + sd) * 0.5);
      ctx.moveTo(sd * 24, 15.5);
      ctx.lineTo(sd * (38 + fl), 20 + Math.sin(m.t * 2.3 - sd) * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (p.bow) drawBow(ctx, -19, -21, 0.95, -0.5, p.bow);

  if (p.hat === 'bucket') {
    ctx.save();
    ctx.translate(m.hat.x * 0.7, -21 + m.hat.y * 0.7);
    ctx.rotate(m.hat.rot * 0.7);
    ctx.lineJoin = 'round';
    // brim
    ctx.beginPath(); ctx.ellipse(0, 0, 25, 6.6, 0, 0, PI * 2);
    ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 2.8; ctx.strokeStyle = OUT; ctx.stroke();
    // crown
    const crown = () => {
      ctx.beginPath();
      ctx.moveTo(-16, -1);
      ctx.bezierCurveTo(-17, -15, -9, -20, 0, -20);
      ctx.bezierCurveTo(9, -20, 17, -15, 16, -1);
      ctx.closePath();
    };
    crown(); ctx.fillStyle = '#ffe680'; ctx.fill();
    ctx.save(); crown(); ctx.clip();
    ctx.fillStyle = '#4ea8e8'; ctx.fillRect(-18, -8.4, 36, 7);
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-18, -8.4, 36, 1.8);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-7, -15, 4.6, 2.2, -0.7, 0, PI * 2); ctx.fill();
    ctx.restore();
    crown(); ctx.lineWidth = 2.8; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 25, 6.6, 0, 0.05, PI - 0.05); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -4.9, 2.4, 0, PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  } else if (p.hat === 'cap') {
    drawCap(ctx, m);
  }

  if (p.topper) drawTopper(ctx, m, p.topper);
  if (p.toque) {
    // tall chef hat: puffy top, folds, red band sitting on the forehead
    ctx.save();
    ctx.translate(m.hat.x * 0.5, m.hat.y * 0.5);
    ctx.rotate(m.hat.rot * 0.5);
    const puffs: [number, number, number][] = [[-16, -35, 9.6], [16, -35, 9.6], [-8, -43, 10.6], [8, -43, 10.6], [0, -38.5, 11.6]];
    ctx.lineJoin = 'round';
    ctx.strokeStyle = OUT; ctx.lineWidth = 5.4;
    for (const [x, y, r] of puffs) { ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.roundRect(-23, -32, 46, 16, 5); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (const [x, y, r] of puffs) { ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.roundRect(-23, -32, 46, 16, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(150,160,195,.5)'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, -33); ctx.quadraticCurveTo(-13, -39, -9, -46); ctx.moveTo(10, -33); ctx.quadraticCurveTo(13, -39, 8, -46); ctx.moveTo(0, -33); ctx.lineTo(0, -41); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.ellipse(-13, -43, 5, 2.4, -0.6, 0, PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(-23, -32, 46, 16, 5); ctx.clip();
    ctx.fillStyle = '#e8453c'; ctx.fillRect(-24, -23, 48, 7);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-24, -22, 48, 1.6);
    ctx.fillStyle = 'rgba(150,160,195,.35)'; ctx.fillRect(-24, -32, 48, 3);
    ctx.restore();
    ctx.restore();
  }
  if (p.paper) {
    // seller's paper hat: striped cone with a folded band and a pompom
    ctx.save();
    ctx.translate(m.hat.x * 0.5, m.hat.y * 0.5);
    ctx.rotate(m.hat.rot * 0.4);
    ctx.lineJoin = 'round';
    const cone = () => { ctx.beginPath(); ctx.moveTo(-18, -20); ctx.lineTo(18, -20); ctx.lineTo(7, -42); ctx.quadraticCurveTo(0, -45, -7, -42); ctx.closePath(); };
    cone(); ctx.fillStyle = '#ff9fc1'; ctx.fill();
    ctx.save(); cone(); ctx.clip();
    ctx.fillStyle = '#ffffff';
    for (const x of [-9, 0, 9]) { ctx.beginPath(); ctx.moveTo(x - 2.4, -46); ctx.lineTo(x + 2.4, -46); ctx.lineTo(x + 5, -19); ctx.lineTo(x - 0.4, -19); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-8, -34, 2.6, 8, 0.25, 0, PI * 2); ctx.fill();
    ctx.restore();
    cone(); ctx.lineWidth = 2.8; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-21, -22, 42, 8.4, 3.4); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5f98'; ctx.fillRect(-19.6, -18.8, 39.2, 2.4);
    ctx.beginPath(); ctx.arc(0, -44, 4.4, 0, PI * 2); ctx.fillStyle = '#ffe27a'; ctx.fill(); ctx.lineWidth = 2.4; ctx.stroke();
    ctx.restore();
  }
  ctx.restore(); // head
  // seen from behind the tail is drawn last: the whole tail, tip included, is in front of the body and the back of the head
  if (m.fy < -0.3) drawTail(ctx, m, p, 'front');

  if (p.tie && faceA > 0.3) {
    ctx.save();
    ctx.globalAlpha = faceA;
    drawBow(ctx, 0, yt + 10, 0.8, 0, p.tie);
    ctx.restore();
  }

  // The carried pile is drawn over the body but under nothing: the cat holds its wadah in
  // front of the chest exactly like Monkey Mart (face normally peeks above a short stack).
  // the pile is held in front of the cat, nudged to the side so the face stays visible
  if (carryFront) drawCarry(ctx, m, p, rod.on ? 'basket' : 'full');

  if (m.exc > 0.5) {
    const a0 = m.t * 2.4;
    for (let i = 0; i < 3; i++) {
      const a = a0 + (i * PI * 2) / 3;
      const tw = 0.6 + 0.4 * Math.sin(m.t * 9 + i * 2);
      ctx.globalAlpha = clamp((m.exc - 0.5) * 2.4, 0, 1) * tw;
      ctx.fillStyle = i === 1 ? '#ff9ccc' : '#ffe45c';
      star4(ctx, Math.cos(a) * 42 * hs, Ly.headY - 8 + Math.sin(a) * 16 * hs, 3.4 + tw * 2.6, m.t * 2 + i);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore(); // upper body
  ctx.restore(); // root
}

// ---------------------------------------------------------------
//  NPC sprite cache
//  A cat is a LOT of vector paths (outline pass + fill pass, eyes, ears, hat...).
//  For background cats we rasterise the cat into a small per-cat bitmap and only
//  refresh it every `ttl` frames. The bitmap is stamped at the cat's live position,
//  so movement stays perfectly smooth while the CPU cost drops by `ttl` times.
// ---------------------------------------------------------------
interface CatSprite { cv: HTMLCanvasElement; cx: CanvasRenderingContext2D; s: number; k: number; tick: number }
const CAT_SPRITES = new WeakMap<Cat, CatSprite>();

export function drawCatCached(ctx: CanvasRenderingContext2D, m: Cat, scale: number, res: number, ttl = 2) {
  // never cache the fishing pose (it measures the live transform) or a tall carried stack
  if (typeof document === 'undefined' || ttl <= 1 || m.rod.on || m.carry.length > 0 || res <= 0) {
    drawCat(ctx, m, scale);
    return;
  }
  const k = scale * (m.size || 1);
  const Ly = catLayout(m.build);
  const above = Math.ceil((Ly.height + 40 + Math.max(0, m.hopY)) * k) + 8;
  const below = Math.ceil(18 * k) + 4;
  const halfW = Math.ceil(Math.max(Ly.HW + 42, 64) * k) + 4;
  const s = Math.max(0.5, Math.min(1.75, res));
  let e = CAT_SPRITES.get(m);
  if (!e || e.s !== s || e.k !== k) {
    const cv = document.createElement('canvas');
    cv.width = Math.max(8, Math.ceil(2 * halfW * s));
    cv.height = Math.max(8, Math.ceil((above + below) * s));
    e = { cv, cx: cv.getContext('2d')!, s, k, tick: 0 };
    CAT_SPRITES.set(m, e);
  }
  if (e.tick % ttl === 0) {
    const c = e.cx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, e.cv.width, e.cv.height);
    c.setTransform(s, 0, 0, s, e.cv.width / 2, e.cv.height - below * s);
    const ox = m.x, oy = m.y;
    m.x = 0; m.y = 0;
    drawCat(c, m, scale);
    m.x = ox; m.y = oy;
  }
  e.tick++;
  ctx.drawImage(e.cv, m.x - halfW, m.y - above, 2 * halfW, above + below);
}

/** Draws a cat. Per-cat build overrides (fat / kid / kitten ...) and size are applied here. */
export function drawCat(ctx: CanvasRenderingContext2D, m: Cat, scale = 1) {
  const k = scale * (m.size || 1);
  if (!m.build) { drawCatInner(ctx, m, k); return; }
  const saved = { ...CAT_CFG };
  Object.assign(CAT_CFG, m.build);
  try { drawCatInner(ctx, m, k); } finally { Object.assign(CAT_CFG, saved); }
}

/** Draws a static preview of a cat into a DOM canvas (wardrobe cards). */
export function renderCatPreview(canvas: HTMLCanvasElement, pal: Pal, skates = false, board = false) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = 2;
  const w = canvas.clientWidth || 130, h = canvas.clientHeight || 140;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const c = makeCat(0, 0, pal);
  c.skates = skates;
  c.board = board;
  c.t = 1.2;
  c.happy = 0.9;
  c.exc = 0.45;
  const Ly = catLayout();
  const k = Math.min((h - 14) / (Ly.height + 4), w / (2 * Math.max(43, Ly.HW + 26)));
  ctx.save();
  ctx.translate(w / 2, h - 8);
  drawCat(ctx, c, k);
  ctx.restore();
}
