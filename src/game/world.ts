// ---------------------------------------------------------------
//  World layout + static painting (cached into Layers) + sea
// ---------------------------------------------------------------
import { FISH_S, SUSHI_COUNT, drawFish, drawFishDeep, drawSushi } from './fish';
import { drawCoral, drawRock, drawSeaweed, drawShell, drawStarfish, star4 } from './scenery';
import type { View } from './sprites';
import { FARM_BOX } from './extras';
import { paintUmbrella } from './extras2';
import { paintSign } from './signs';
import { GATE_X, ZONE_BANNERS, ZONE_DEFS, ZX, ZY, paintZoneBanner } from './zones';
import { paintHighway } from './road';
export { ZONE_BANNERS, paintZoneBanner };
export { GATE_X, ZX, ZY };

export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export const PI2 = Math.PI * 2;

export const MINX = -620;
export const WORLD_W = 3680; // expanded on the right for the highway & cat bus stop
export const WORLD_H = 1900;
export const MIN_Y = 190;
export const MAX_Y = 800;

// ---------------- layout
export const PIER = { x: -60, y: 270, w: 540, h: 280 };
export const PIER_WALK = { x1: -30, y1: 288, x2: 470, y2: 532 };
export const SPOTS: Pt[] = [{ x: 70, y: 340 }, { x: 70, y: 410 }, { x: 70, y: 480 }];
export const POND = { x: 296, y: 340, w: 150, h: 150, cap: 18 };
export const POND_ZONE: Rect = { x: 262, y: 312, w: 196, h: 206 };

export const TABLE = { x: 660, y: 250, w: 260, h: 100, H: 30, cap: 18 };
export const TABLE_ZONE: Rect = { x: 640, y: 352, w: 230, h: 84 };
export const STALLQ: Pt[] = [0, 1, 2, 3].map((i) => ({ x: 905, y: 395 + i * 50 }));

export const SUSHI = { x: 980, y: 250, w: 340, h: 100, H: 30 };
export const TRAY = { x: SUSHI.x + 12, y: SUSHI.y - SUSHI.H + 14, w: 88, h: 64, cap: 4 };
export const BOARD = { x: SUSHI.x + 112, y: SUSHI.y - SUSHI.H + 26, w: 112, h: 64 };
export const DISP = { x: SUSHI.x + 236, y: SUSHI.y - SUSHI.H + 12, w: 96, h: 80, cap: 18 };
export const BC: Pt = { x: BOARD.x + BOARD.w / 2, y: BOARD.y + 17 };
/** the chef stands BEHIND the cutting board (the board is drawn over his feet) */
export const CHEF_POS: Pt = { x: BC.x, y: BOARD.y + 8 };
export const SUSHI_ZONE: Rect = { x: 990, y: 352, w: 150, h: 84 };
export const SUSHIQ: Pt[] = [0, 1, 2].map((i) => ({ x: 1295, y: 395 + i * 46 }));

export const MANGO = { x: 520, y: 520, w: 210, h: 86, H: 28, cap: 18 };
export const MANGO_ZONE: Rect = { x: 530, y: 612, w: 190, h: 54 };
export const MANGOQ: Pt[] = [0, 1, 2].map((i) => ({ x: 790, y: 520 + i * 46 }));
export const TREES_POS: Pt[] = [{ x: 560, y: 846 }, { x: 660, y: 846 }, { x: 760, y: 846 }];

/** Counter table aligned with the juice bar (~548), cashier cat stands snugly right behind the register */
export const COUNTER = { x: 1330, y: 548, w: 250, h: 60, H: 30 };
export const REG_ZONE: Rect = { x: 1340, y: 614, w: 120, h: 80 };
export const MONEY_ZONE: Rect = { x: 1470, y: 614, w: 120, h: 80 };
export const HIRE_ZONE: Rect = { x: 1612, y: 528, w: 110, h: 80 };
export const CASHIER_POS: Pt = { x: 1385, y: 520 };
export const CASHQ: Pt[] = [0, 1, 2, 3].map((i) => ({ x: 1465, y: 755 + i * 46 }));
export const STACK = { x: 1512, y: 536 };
// SPAWN is the open door of the Beach Cat Bus parked at the road on the far right
export const SPAWN = { x: 3310, y: 520 };
export const LOOK_SEA = { x: -1, y: 0.12 };

export const billPos = (idx: number): Pt => {
  const slot = idx % 4, layer = Math.min(14, Math.floor(idx / 4));
  return { x: STACK.x + (slot % 2) * 44 + ((layer * 7) % 5 - 2), y: STACK.y + (slot >> 1) * 24 - layer * 4.2 };
};

export const shoreX = (y: number) => 360 + 16 * Math.sin(y * 0.012 + 0.5) + 10 * Math.sin(y * 0.031);
const landOk = (x: number, y: number) =>
  (x >= PIER_WALK.x1 && x <= PIER_WALK.x2 && y >= PIER_WALK.y1 && y <= PIER_WALK.y2) || x >= shoreX(y) + 14
  || (x >= FARM_BOX.x && x <= FARM_BOX.x + FARM_BOX.w && y >= FARM_BOX.y && y <= FARM_BOX.y + FARM_BOX.h);

/** lvl = player level, isSurfing = player riding surfboard (can freely surf across the entire ocean and beach!) */
export const walkable = (x: number, y: number, _lvl = 4, isSurfing = false) => {
  void _lvl;
  if (isSurfing) return x >= MINX + 40 && x <= WORLD_W - 60 && y >= MIN_Y && y <= WORLD_H - 60;
  return landOk(x, y);
};
export const inside = (p: Pt, r: Rect) => p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
export const rr = (a: number, b: number) => a + Math.random() * (b - a);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (x: number) => { const k = Math.max(0, Math.min(1, x)); return 1 - (1 - k) * (1 - k); };
export const easeBack = (k: number) => (k >= 1 ? 1 : 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2));

// ---------------- seeded decor
let seed = 11;
const srand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const SPECKLES: { x: number; y: number; r: number; c: number }[] = [];
for (let i = 0; i < 2300; i++) {
  const x = srand() * WORLD_W, y = srand() * WORLD_H;
  if (x > shoreX(y) + 40) SPECKLES.push({ x, y, r: 1.2 + srand() * 2.2, c: srand() < 0.5 ? 0 : 1 });
}
const PEBBLES: { x: number; y: number; r: number }[] = [];
for (let i = 0; i < 95; i++) {
  const y = srand() * WORLD_H;
  PEBBLES.push({ x: shoreX(y) + 34 + srand() * 40, y, r: 2 + srand() * 3 });
}
const STARFISH = [
  { x: 1010, y: 665, s: 1, r: 0.3 }, { x: 1210, y: 610, s: 0.8, r: 1 }, { x: 440, y: 560, s: 1.1, r: 0.6 },
  { x: 1020, y: 760, s: 0.9, r: 2 }, { x: 1180, y: 770, s: 1, r: 0.1 }, { x: 600, y: 300, s: 0.7, r: 1.4 },
  { x: 1650, y: 430, s: 0.9, r: 0.8 },
];
const SHELLS = [
  { x: 960, y: 640, s: 1, r: 0.2 }, { x: 1250, y: 660, s: 0.9, r: -0.4 }, { x: 1620, y: 690, s: 1, r: 0.9 },
  { x: 880, y: 640, s: 0.8, r: -0.2 }, { x: 440, y: 740, s: 0.9, r: 0.4 }, { x: 1560, y: 770, s: 0.9, r: 0.2 },
];
export const ROCKS = [
  { x: 232, y: 202, s: 1.3 }, { x: -130, y: 225, s: 1.4 }, { x: 120, y: 642, s: 1.5 }, { x: -250, y: 690, s: 1.6 },
  { x: 270, y: 770, s: 1.2 }, { x: -420, y: 420, s: 1.3 }, { x: -520, y: 640, s: 1.5 }, { x: -380, y: 250, s: 1.2 },
];
export const CORALS = [
  { x: 262, y: 208, s: 1, c: '#ff8fb5' }, { x: -98, y: 232, s: 1.1, c: '#ffb15c' }, { x: 150, y: 650, s: 1.1, c: '#ff9d5c' },
  { x: -222, y: 698, s: 1.2, c: '#ff7aa8' }, { x: -400, y: 430, s: 1, c: '#c78cff' }, { x: -490, y: 650, s: 1.1, c: '#ff8fb5' },
];
ROCKS.push(...ROCKS.map((r) => ({ ...r, y: r.y + ZY })));
CORALS.push(...CORALS.map((r) => ({ ...r, y: r.y + ZY })));
const WEEDS: Pt[] = [];
for (let i = 0; i < 60; i++) WEEDS.push({ x: MINX + 30 + srand() * (270 - MINX - 30), y: 215 + srand() * 575 + (i % 2 ? ZY : 0) });
const CAUSTICS = Array.from({ length: 150 }, () => ({
  x: MINX + srand() * (250 - MINX), y: srand() * WORLD_H, r: 16 + srand() * 28, ph: srand() * 6.28, rot: srand() * 3,
}));
const SPARKLES = Array.from({ length: 170 }, () => ({ x: MINX + srand() * (300 - MINX), y: srand() * WORLD_H, ph: srand() * 6.28 }));
const BUBBLES = Array.from({ length: 64 }, () => ({
  x: MINX + srand() * (270 - MINX), y: srand() * WORLD_H, sp: 12 + srand() * 18, ph: srand() * 6, r: 1.5 + srand() * 2.6,
}));
const SEABED = Array.from({ length: 32 }, (_, k) => ({
  x: -480 + srand() * 700, y: 200 + srand() * 600 + (k % 2 ? ZY : 0), rx: 40 + srand() * 90, ry: 16 + srand() * 34, a: 0.1 + srand() * 0.1,
}));
interface Deco { k: number; x: number; y: number; s: number; r: number; c: number }
const DECO: Deco[] = [];
for (const z of [2, 3, 4]) {
  const xa = z === 3 ? 450 : ZX + 50, xb = z === 3 ? ZX - 70 : WORLD_W - 70, ya = (z === 2 ? 0 : ZY) + 200;
  for (let i = 0; i < 26; i++) DECO.push({ k: Math.floor(srand() * 4), x: xa + srand() * (xb - xa), y: ya + srand() * 590, s: 0.7 + srand() * 0.5, r: srand() * 6.28, c: Math.floor(srand() * 4) });
}
const TOWEL = ['#ff7aa8', '#4ea8e8', '#ffd24a', '#7fe0a0'];
const ICE: { x: number; y: number; r: number; c: boolean }[] = [];
for (let i = 0; i < 22; i++) ICE.push({ x: srand(), y: srand(), r: 9 + srand() * 8, c: i % 3 === 0 });

// ---------------- sea types
export interface Swimmer {
  x: number; y: number; dir: number; face: number; speed: number; vy: number; ty: number; t: number; ph: number;
  type: number; hunt: boolean; gone: boolean; resp: number; bubT: number; nib: number; pitch: number;
  depth: number; dT: number; // 0 = at the surface, 1 = deep (faded and blue-tinted)
}
export interface Ripple { x: number; y: number; t: number; max: number; r: number; pond: boolean }

// =====================================================================
//  Static painters (called once into Layers)
// =====================================================================
export const fishIcon = (type: number, dir: number) => (c: CanvasRenderingContext2D, x: number, y: number) => drawFish(c, x, y, type, 0.6, -0.08 * dir, dir, 1);

/** Paints the ground of the part of the world inside [X0..X1] x [Y0..Y1] (called once per tile). */
export function paintGround(c: CanvasRenderingContext2D, X0: number, Y0: number, X1: number, Y1: number) {
  c.fillStyle = '#f7e4a8';
  c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
  for (const row of [0, ZY]) {
    if (row + 150 < Y0 || row > Y1) continue;
    c.fillStyle = '#efd699';
    c.fillRect(280, row, WORLD_W - 280, 150);
    c.fillStyle = '#7ccb72';
    for (let x = 380; x < WORLD_W + 60; x += 34) {
      if (x < X0 - 40 || x > X1 + 40) continue;
      c.beginPath(); c.ellipse(x, row + 150, 22, 10 + ((x * 7) % 5), 0, Math.PI, 0); c.fill();
    }
    c.fillStyle = '#5fb55a';
    for (let x = 395; x < WORLD_W + 60; x += 68) {
      if (x < X0 - 40 || x > X1 + 40) continue;
      c.beginPath(); c.ellipse(x, row + 150, 12, 7, 0, Math.PI, 0); c.fill();
    }
  }
  for (const z of ZONE_DEFS) {
    if (!z.tint) continue;
    c.fillStyle = z.tint;
    c.fillRect(z.x0, z.y0 + (z.y0 === 0 ? 150 : 150), z.x1 - z.x0, z.y1 - z.y0 - 150);
  }
  for (const sp of SPECKLES) {
    if (sp.x < X0 - 6 || sp.x > X1 + 6 || sp.y < Y0 - 6 || sp.y > Y1 + 6) continue;
    c.fillStyle = sp.c ? '#fff2c4' : '#ead08a';
    c.beginPath(); c.arc(sp.x, sp.y, sp.r, 0, PI2); c.fill();
  }
  for (const pb of PEBBLES) {
    if (pb.x < X0 - 10 || pb.x > X1 + 10 || pb.y < Y0 - 10 || pb.y > Y1 + 10) continue;
    c.fillStyle = '#d9c9a4';
    c.beginPath(); c.ellipse(pb.x, pb.y, pb.r * 1.3, pb.r, 0, 0, PI2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)';
    c.beginPath(); c.ellipse(pb.x - pb.r * 0.3, pb.y - pb.r * 0.3, pb.r * 0.5, pb.r * 0.3, 0, 0, PI2); c.fill();
  }
  // boardwalk street between the two rows of zones: open, seamless sandy boardwalk where customers arrive
  if (!(955 < Y0 || 915 > Y1)) {
    c.fillStyle = '#c68a4d'; c.fillRect(380, 915, WORLD_W - 380, 40);
    for (let x = Math.max(380, Math.floor(X0 / 22) * 22); x < X1; x += 22) {
      c.fillStyle = (x / 22) % 2 ? 'rgba(255,255,255,.1)' : 'rgba(90,50,15,.12)';
      c.fillRect(x, 915, 22, 40);
      c.fillStyle = 'rgba(90,50,15,.25)'; c.fillRect(x, 915, 2, 40);
    }
    // Seamless wooden grain without dividing barriers or rails
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(380, 916, WORLD_W - 380, 2);
  }
  for (const s of STARFISH) if (s.x > X0 - 30 && s.x < X1 + 30 && s.y > Y0 - 30 && s.y < Y1 + 30) drawStarfish(c, s.x, s.y, s.s, s.r);
  for (const s of SHELLS) if (s.x > X0 - 30 && s.x < X1 + 30 && s.y > Y0 - 30 && s.y < Y1 + 30) drawShell(c, s.x, s.y, s.s, s.r);
  for (const d of DECO) {
    if (d.x < X0 - 50 || d.x > X1 + 50 || d.y < Y0 - 50 || d.y > Y1 + 50) continue;
    if (d.k === 0) drawStarfish(c, d.x, d.y, d.s, d.r);
    else if (d.k === 1) drawShell(c, d.x, d.y, d.s, d.r);
    else if (d.k === 2) {
      c.save(); c.translate(d.x, d.y); c.rotate((d.r - 3) * 0.12); c.scale(d.s, d.s);
      c.beginPath(); c.roundRect(-16, -26, 32, 52, 5); c.fillStyle = TOWEL[d.c]; c.fill(); c.lineWidth = 2.4; c.strokeStyle = '#58244a'; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.7)'; for (const yy of [-14, 0, 14]) c.fillRect(-16, yy - 3, 32, 6);
      c.restore();
    } else {
      c.save(); c.translate(d.x, d.y); c.scale(d.s, d.s);
      c.globalAlpha = 0.2; c.fillStyle = '#4a3a10'; c.beginPath(); c.ellipse(4, 6, 24, 7, 0, 0, PI2); c.fill(); c.globalAlpha = 1;
      c.lineJoin = 'round'; c.lineWidth = 2.4; c.strokeStyle = '#58244a';
      c.beginPath(); c.moveTo(-22, 4); c.lineTo(-18, -9); c.lineTo(18, -9); c.lineTo(22, 4); c.closePath(); c.fillStyle = '#e8c06a'; c.fill(); c.stroke();
      for (const tx of [-14, 0, 14]) { c.beginPath(); c.roundRect(tx - 5, -20, 10, 12, 2); c.fill(); c.stroke(); }
      c.beginPath(); c.moveTo(-3, -20); c.lineTo(-3, -32); c.lineTo(9, -28); c.lineTo(-3, -24); c.fillStyle = '#ff5a6a'; c.fill(); c.stroke();
      c.restore();
    }
  }
  // (signs are rendered in depth-sorted items so cats don't walk over them!)
  paintHighway(c, X0, Y0, X1, Y1);
}

export function paintPier(c: CanvasRenderingContext2D) {
  const { x, y, w, h } = PIER;
  c.fillStyle = 'rgba(8,50,100,.25)';
  c.fillRect(x + 8, y + 16, w, h);
  for (let yy = y, i = 0; yy < y + h; yy += 28, i++) {
    c.fillStyle = i % 2 ? '#cf9558' : '#c68a4d';
    c.fillRect(x, yy, w, Math.min(28, y + h - yy));
    c.fillStyle = 'rgba(90,50,15,.35)';
    c.fillRect(x, yy, w, 2);
    c.fillStyle = 'rgba(255,255,255,.14)';
    c.fillRect(x, yy + 3, w, 3);
    c.fillStyle = 'rgba(70,40,10,.35)';
    for (let nx = x + 14 + ((i * 41) % 60); nx < x + w; nx += 90) {
      c.beginPath(); c.arc(nx, yy + 14, 1.6, 0, PI2); c.fill();
    }
  }
  c.fillStyle = '#7a4a20';
  c.fillRect(x - 4, y, 6, h);
  c.fillRect(x, y - 4, w, 6);
  c.fillRect(x, y + h - 2, w, 6);
}

export function paintTable(c: CanvasRenderingContext2D) {
  const { x, y, w, h, H } = TABLE;
  c.globalAlpha = 0.18;
  c.fillStyle = '#5a4210';
  c.beginPath(); c.roundRect(x - 4, y + 8, w + 14, h + 6, 16); c.fill();
  c.globalAlpha = 1;
  c.fillStyle = '#2a78c8';
  c.beginPath(); c.roundRect(x, y + h - H - 6, w, H + 6, 12); c.fill();
  c.fillStyle = '#fff';
  c.fillRect(x + 10, y + h - H + 4, w - 20, 4);
  c.fillStyle = '#3b93e6';
  c.beginPath(); c.roundRect(x, y - H, w, h, 14); c.fill();
  c.fillStyle = '#e1f5ff';
  c.beginPath(); c.roundRect(x + 9, y - H + 9, w - 18, h - 22, 10); c.fill();
  c.save();
  c.beginPath(); c.roundRect(x + 9, y - H + 9, w - 18, h - 22, 10); c.clip();
  for (const ic of ICE) {
    const ix = x + 14 + ic.x * (w - 28), iy = y - H + 14 + ic.y * (h - 36);
    if (ic.c) {
      c.fillStyle = 'rgba(190,230,255,.8)';
      c.strokeStyle = 'rgba(255,255,255,.95)';
      c.lineWidth = 1.5;
      c.beginPath(); c.roundRect(ix - ic.r * 0.6, iy - ic.r * 0.6, ic.r * 1.2, ic.r * 1.2, 4); c.fill(); c.stroke();
    } else {
      c.fillStyle = 'rgba(255,255,255,.85)';
      c.beginPath(); c.arc(ix, iy, ic.r, 0, PI2); c.fill();
      c.fillStyle = 'rgba(180,225,250,.5)';
      c.beginPath(); c.arc(ix + 2, iy + 3, ic.r * 0.6, 0, PI2); c.fill();
    }
  }
  c.restore();
}

export function paintCounter(c: CanvasRenderingContext2D) {
  const { x, y, w, h, H } = COUNTER;
  c.globalAlpha = 0.18;
  c.fillStyle = '#5a4210';
  c.beginPath(); c.roundRect(x - 4, y + 8, w + 12, h + 6, 14); c.fill();
  c.globalAlpha = 1;
  c.fillStyle = '#a56a33';
  c.beginPath(); c.roundRect(x, y + h - H - 6, w, H + 6, 10); c.fill();
  c.fillStyle = 'rgba(70,35,5,.3)';
  for (let k = 1; k < 5; k++) c.fillRect(x + k * (w / 5), y + h - H - 4, 2, H);
  c.fillStyle = '#e0a75e';
  c.beginPath(); c.roundRect(x, y - H, w, h, 12); c.fill();
  c.fillStyle = '#efbb78';
  c.beginPath(); c.roundRect(x + 6, y - H + 6, w - 12, h - 16, 8); c.fill();
  // gold tray where the money lands
  c.fillStyle = '#d4a23a';
  c.beginPath(); c.roundRect(STACK.x - 28, y - H + 3, 100, h - 8, 10); c.fill();
  c.fillStyle = '#f6e3a1';
  c.beginPath(); c.roundRect(STACK.x - 24, y - H + 7, 92, h - 16, 8); c.fill();
  // register
  const rx = x + 105, ry = y - H + 24;
  c.fillStyle = '#4a5162';
  c.beginPath(); c.roundRect(rx - 26, ry - 6, 52, 26, 5); c.fill();
  c.fillStyle = '#7ad0ff';
  c.beginPath(); c.roundRect(rx - 20, ry - 30, 40, 26, 4); c.fill();
  c.fillStyle = '#e8f6ff';
  c.font = '900 18px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText('$', rx, ry - 10);
  c.fillStyle = '#7a8499';
  for (let i = 0; i < 4; i++) c.fillRect(rx - 20 + i * 11, ry + 2, 8, 6);
  drawStarfish(c, x + 22, y - H + 44, 0.55, 0.4);
  drawShell(c, x + 20, y - H + 24, 0.5, 0.2);

  // beach umbrella (curved gores, scalloped rim, pole) - see extras2
  paintUmbrella(c, x + 150, y - H + 28);
}

export function paintSushi(c: CanvasRenderingContext2D) {
  const { x, y, w, h, H } = SUSHI;
  // sign (text is fitted, nothing overlaps)
  paintSign(c, 1060, 134, 'SUSHI', { w: 154, h: 60, c1: '#ec5560', c2: '#b52a34', rim: '#8a4a28', posts: 52 });
  // menu board with every sushi kind
  c.fillStyle = '#6b3f1b';
  c.fillRect(1166, 170, 8, 52);
  c.fillRect(1296, 170, 8, 52);
  c.fillStyle = '#7a4a22';
  c.beginPath(); c.roundRect(1146, 92, 178, 84, 12); c.fill();
  c.fillStyle = '#fff4d6';
  c.beginPath(); c.roundRect(1152, 98, 166, 72, 9); c.fill();
  c.fillStyle = '#e03a44';
  c.beginPath(); c.roundRect(1152, 98, 166, 17, 9); c.fill();
  c.fillStyle = '#fff';
  c.font = '900 12px system-ui, sans-serif';
  c.fillText('MENU  ·  ' + SUSHI_COUNT + ' JENIS', 1235, 111);
  for (let i = 0; i < SUSHI_COUNT; i++) {
    drawSushi(c, 1172 + (i % 5) * 33, 130 + Math.floor(i / 5) * 26, 0.62, i);
  }

  // body
  c.globalAlpha = 0.18;
  c.fillStyle = '#5a4210';
  c.beginPath(); c.roundRect(x - 4, y + 8, w + 14, h + 6, 16); c.fill();
  c.globalAlpha = 1;
  c.fillStyle = '#a8262e';
  c.beginPath(); c.roundRect(x, y + h - H - 6, w, H + 6, 12); c.fill();
  c.save();
  c.beginPath(); c.roundRect(x, y + h - H - 6, w, H + 6, 12); c.clip();
  c.strokeStyle = 'rgba(255,255,255,.3)';
  c.lineWidth = 2;
  for (let k = 0; k < Math.ceil(w / 24) + 1; k++) {
    for (let row = 0; row < 2; row++) {
      c.beginPath();
      c.arc(x + 6 + k * 24 + row * 12, y + h - H + 8 + row * 9, 11, Math.PI, 0);
      c.stroke();
    }
  }
  c.restore();
  c.fillStyle = '#c63a3f';
  c.beginPath(); c.roundRect(x, y - H, w, h, 14); c.fill();
  c.fillStyle = '#f6e3b8';
  c.beginPath(); c.roundRect(x + 6, y - H + 6, w - 12, h - 16, 10); c.fill();

  // raw tray
  c.fillStyle = '#9fd8f5';
  c.beginPath(); c.roundRect(TRAY.x, TRAY.y, TRAY.w, TRAY.h, 10); c.fill();
  c.fillStyle = '#e1f5ff';
  c.beginPath(); c.roundRect(TRAY.x + 4, TRAY.y + 4, TRAY.w - 8, TRAY.h - 8, 8); c.fill();
  c.fillStyle = 'rgba(255,255,255,.9)';
  for (const [ix, iy, ir] of [[10, 12, 6], [76, 20, 5], [14, 50, 5], [72, 54, 6], [44, 8, 4]]) {
    c.beginPath(); c.arc(TRAY.x + ix, TRAY.y + iy, ir, 0, PI2); c.fill();
  }
  // display tray
  c.fillStyle = '#e0b050';
  c.beginPath(); c.roundRect(DISP.x - 3, DISP.y - 3, DISP.w + 6, DISP.h + 6, 12); c.fill();
  c.fillStyle = '#3b2523';
  c.beginPath(); c.roundRect(DISP.x, DISP.y, DISP.w, DISP.h, 10); c.fill();
  for (let i = 0; i < 0; i++) {
    c.fillStyle = 'rgba(255,255,255,.12)';
    c.beginPath(); c.ellipse(DISP.x + 14 + (i % 4) * 23, DISP.y + 30 + Math.floor(i / 4) * 34, 12, 7.5, 0, 0, PI2); c.fill();
  }
}

export function paintMango(c: CanvasRenderingContext2D) {
  const { x, y, w, h, H } = MANGO;
  c.globalAlpha = 0.18;
  c.fillStyle = '#5a4210';
  c.beginPath(); c.roundRect(x - 4, y + 8, w + 14, h + 6, 16); c.fill();
  c.globalAlpha = 1;
  // awning poles
  c.fillStyle = '#7a4a20';
  c.fillRect(x + 6, y - H - 66, 8, 70);
  c.fillRect(x + w - 14, y - H - 66, 8, 70);
  // front
  c.fillStyle = '#8a5a2b';
  c.beginPath(); c.roundRect(x, y + h - H - 6, w, H + 6, 12); c.fill();
  c.fillStyle = 'rgba(60,30,5,.35)';
  for (let k = 1; k < 5; k++) c.fillRect(x + k * (w / 5), y + h - H - 4, 2, H);
  c.fillStyle = '#ffd43b';
  c.beginPath(); c.roundRect(x + 8, y + h - H + 2, w - 16, 9, 4); c.fill();
  // top
  c.fillStyle = '#d9a35d';
  c.beginPath(); c.roundRect(x, y - H, w, h, 14); c.fill();
  c.fillStyle = '#ffe9b8';
  c.beginPath(); c.roundRect(x + 8, y - H + 8, w - 16, h - 20, 10); c.fill();
  c.strokeStyle = 'rgba(190,140,70,.4)';
  c.lineWidth = 1.5;
  for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(x + 14, y - H + 16 + k * 10); c.lineTo(x + w - 14, y - H + 16 + k * 10); c.stroke(); }
  // striped awning
  const ay = y - H - 70, aw = w + 20, ax = x - 10;
  for (let k = 0; k < 8; k++) {
    const x0 = ax + k * (aw / 8);
    c.beginPath();
    c.moveTo(x0, ay);
    c.lineTo(x0 + aw / 8, ay);
    c.lineTo(x0 + aw / 8, ay + 30);
    c.arc(x0 + aw / 16, ay + 30, aw / 16, 0, Math.PI);
    c.closePath();
    c.fillStyle = k % 2 ? '#ffffff' : '#ffb02e';
    c.fill();
    c.strokeStyle = 'rgba(160,90,0,.4)';
    c.lineWidth = 1.5;
    c.stroke();
  }
  c.fillStyle = '#e8891a';
  c.beginPath(); c.roundRect(ax - 4, ay - 10, aw + 8, 14, 6); c.fill();
  paintSign(c, x + w / 2, ay + 34, 'MANGGA SEGAR', { w: 182, h: 34, c1: '#ffc83a', c2: '#f0a410', textFill: '#fff', textStroke: '#8a4a10' });
}

// =====================================================================
//  Dynamic painters
// =====================================================================
export function drawPierRipples(ctx: CanvasRenderingContext2D, t: number) {
  const { x, y, w, h } = PIER;
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const px = x + 18 + i * ((w - 36) / 5);
    for (const py of [y + h + 6, y - 2]) {
      ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.2 * Math.sin(t * 2 + i)})`;
      ctx.beginPath();
      ctx.ellipse(px, py + 6, 11 + Math.sin(t * 2 + i) * 2, 4.2, 0, 0, PI2);
      ctx.stroke();
    }
  }
  for (let k = 0; k < 6; k++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.45 + 0.2 * Math.sin(t * 2 + k)})`;
    ctx.beginPath();
    ctx.ellipse(x - 6, y + 20 + k * 50, 3.6 + Math.sin(t * 2 + k) * 1.5, 9, 0, 0, PI2);
    ctx.stroke();
  }
}

export const seaEdge = (y: number, t: number) => shoreX(y) + Math.sin(t * 1.3) * 7 + 4 * Math.sin(y * 0.08 + t * 2);

export function makeSeaGradient(ctx: CanvasRenderingContext2D) {
  // bright, clear tropical water: no dark navy any more
  const g = ctx.createLinearGradient(MINX, 0, 430, 0);
  g.addColorStop(0, '#2f9fe6');
  g.addColorStop(0.3, '#43b8ee');
  g.addColorStop(0.58, '#66d3f0');
  g.addColorStop(0.82, '#98e8ee');
  g.addColorStop(1, '#cdf7e9');
  return g;
}

/** Sea + shoreline. Only the visible slice is traced and nothing is clipped. */
export function drawSea(
  ctx: CanvasRenderingContext2D, V: View, t: number, hq: boolean, grad: CanvasGradient, sils: Swimmer[], ripples: Ripple[],
) {
  const XL = Math.min(MINX - 40, V.x0 - 20);
  const y0 = Math.max(-30, V.y0 - 24), y1 = Math.min(WORLD_H + 30, V.y1 + 24);
  const st = 14;
  const edge = (y: number) => seaEdge(y, t);
  if (V.x0 > 520) return;

  ctx.beginPath();
  ctx.moveTo(XL, y0);
  for (let y = y0; y < y1; y += st) ctx.lineTo(edge(y), y);
  ctx.lineTo(edge(y1), y1);
  ctx.lineTo(XL, y1);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // sandy sea floor glowing through the clear water
  for (const sb of SEABED) {
    if (sb.y < y0 - 60 || sb.y > y1 + 60 || sb.x + sb.rx < V.x0 - 40) continue;
    ctx.fillStyle = `rgba(255,238,170,${sb.a})`;
    ctx.beginPath(); ctx.ellipse(sb.x, sb.y, sb.rx, sb.ry, 0, 0, PI2); ctx.fill();
    ctx.fillStyle = `rgba(255,248,210,${sb.a * 0.8})`;
    ctx.beginPath(); ctx.ellipse(sb.x - sb.rx * 0.1, sb.y - sb.ry * 0.15, sb.rx * 0.6, sb.ry * 0.55, 0, 0, PI2); ctx.fill();
  }
  // shallow turquoise band that glows towards the beach
  const shallow = ctx.createLinearGradient(160, 0, 380, 0);
  shallow.addColorStop(0, 'rgba(160,255,235,0)');
  shallow.addColorStop(1, 'rgba(160,255,235,.32)');
  ctx.fillStyle = shallow;
  ctx.fillRect(160, y0, 260, y1 - y0);

  // light rays
  for (let i = 0; i < 4; i++) {
    const x0 = MINX + i * 230 + Math.sin(t * 0.25 + i) * 40;
    if (x0 + 90 < V.x0 - 300 || x0 - 220 > V.x1) continue;
    ctx.fillStyle = `rgba(255,255,255,${0.06 + 0.03 * Math.sin(t * 0.6 + i * 2)})`;
    ctx.beginPath();
    ctx.moveTo(x0, y0 - 40);
    ctx.lineTo(x0 + 80, y0 - 40);
    ctx.lineTo(x0 - 100 - (y1 - y0) * 0.05, y1 + 40);
    ctx.lineTo(x0 - 220 - (y1 - y0) * 0.05, y1 + 40);
    ctx.closePath();
    ctx.fill();
  }
  if (hq) {
    for (const cs of CAUSTICS) {
      if (cs.y < y0 - 40 || cs.y > y1 + 40 || cs.x < V.x0 - 60) continue;
      ctx.fillStyle = `rgba(255,255,255,${0.09 + 0.07 * Math.sin(t * 1.2 + cs.ph)})`;
      ctx.beginPath();
      ctx.ellipse(cs.x + Math.sin(t * 0.4 + cs.ph) * 14, cs.y + Math.cos(t * 0.35 + cs.ph) * 9, cs.r, cs.r * 0.42, cs.rot + Math.sin(t * 0.2 + cs.ph) * 0.3, 0, PI2);
      ctx.fill();
    }
  }

  // open-sea wave lines
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = 'rgba(255,255,255,.36)';
  ctx.setLineDash([26, 46]);
  for (let i = 0; i < 22; i++) {
    const by = 30 + i * 92;
    if (by < y0 - 12 || by > y1 + 12) continue;
    ctx.lineDashOffset = -t * (18 + (i % 4) * 5) - i * 13;
    ctx.beginPath();
    const xe = shoreX(by) - 30;
    const xs = Math.max(MINX - 40, Math.floor((V.x0 - 40) / 16) * 16);
    for (let x = xs; x < xe; x += 28) {
      const yy = by + Math.sin(x * 0.035 + t * 1.2 + i) * 4;
      if (x === xs) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // swells rolling toward the shore
  const nW = hq ? 4 : 2;
  for (let i = 0; i < nW; i++) {
    const d = (t * 28 + i * (330 / nW)) % 330;
    const a = Math.sin((Math.PI * d) / 330);
    ctx.beginPath();
    let first = true;
    for (let y = y0; y <= y1; y += 24) {
      const x = edge(y) - 26 - d + Math.sin(y * 0.05 + t * 1.4 + i * 2.1) * 6;
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(255,255,255,${0.4 * a})`;
    ctx.lineWidth = 2 + (1 - d / 330) * 3.5;
    ctx.stroke();
  }
  if (hq) {
    ctx.fillStyle = '#fff';
    for (const sp of SPARKLES) {
      if (sp.y < y0 || sp.y > y1) continue;
      const v = Math.sin(t * 2 + sp.ph);
      if (v > 0.78) {
        ctx.globalAlpha = (v - 0.78) * 4;
        star4(ctx, sp.x, sp.y, 2 + (v - 0.78) * 18, sp.ph);
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.lineWidth = 1.2;
    for (const b of BUBBLES) {
      const y = ((b.y - t * b.sp) % WORLD_H + WORLD_H) % WORLD_H;
      if (y < y0 || y > y1) continue;
      ctx.beginPath();
      ctx.arc(b.x + Math.sin(t * 1.5 + b.ph) * 5, y, b.r, 0, PI2);
      ctx.fill();
      ctx.stroke();
    }
  }

  for (const sw of WEEDS) if (sw.y > y0 - 10 && sw.y < y1 + 60 && sw.x > V.x0 - 40) drawSeaweed(ctx, sw.x, sw.y, t);
  for (const r of ROCKS) if (r.y > y0 - 30 && r.y < y1 + 40 && r.x > V.x0 - 60) drawRock(ctx, r.x, r.y, r.s);
  for (const c of CORALS) if (c.y > y0 - 50 && c.y < y1 + 40 && c.x > V.x0 - 60) drawCoral(ctx, c.x, c.y, c.s, c.c);

  // swimming fish seen through the water
  // the deeper a fish swims, the fainter and bluer it gets (it sinks into the water); near the bobber it rises into full colour
  for (const s of sils) {
    if (s.gone || s.y < y0 - 40 || s.y > y1 + 40 || s.x < V.x0 - 60 || s.x > V.x1 + 60) continue;
    const d = s.depth;
    ctx.globalAlpha = 0.96 - 0.74 * Math.pow(d, 0.8);
    drawFishDeep(ctx, s.x, s.y, s.type, FISH_S, s.pitch * s.face, s.face, s.ph, d);
  }
  ctx.globalAlpha = 1;

  ctx.lineWidth = 2;
  for (const r of ripples) {
    if (r.pond || r.t < 0 || r.x > 440) continue;
    const k = r.t / r.max;
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, r.r * k + 3, (r.r * k + 3) * 0.55, 0, 0, PI2);
    ctx.stroke();
  }

  // wet sand
  ctx.beginPath();
  ctx.moveTo(edge(y0), y0);
  for (let y = y0; y < y1; y += st) ctx.lineTo(edge(y), y);
  ctx.lineTo(edge(y1), y1);
  for (let y = y1; y >= y0; y -= st) ctx.lineTo(shoreX(y) + 36, y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(176,132,66,.28)';
  ctx.fill();

  // foam band
  ctx.beginPath();
  for (let y = y0; y < y1; y += 9) {
    const x = edge(y) + 4 + Math.sin(y * 0.15 + t * 2.2) * 3 + Math.sin(y * 0.4 + t * 3) * 1.5;
    if (y === y0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  for (let y = y1; y >= y0; y -= 9) ctx.lineTo(edge(y) - 12 - 4 * Math.sin(y * 0.1 + t * 1.7), y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,.94)';
  ctx.fill();
  ctx.beginPath();
  for (let y = y0; y < y1; y += 12) {
    const x = edge(y) - 28 + Math.sin(t * 1.3 + 1.5) * 8 + Math.sin(y * 0.07 + t) * 4;
    if (y === y0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 5;
  ctx.setLineDash([16, 12]);
  ctx.lineDashOffset = -t * 14;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < 64; i++) {
    const y = (i * 37 + t * 6) % WORLD_H;
    if (y < y0 || y > y1) continue;
    ctx.beginPath();
    ctx.arc(edge(y) - 6 + Math.sin(t * 2 + i) * 4, y, 1.6 + (i % 3), 0, PI2);
    ctx.fill();
  }
  ctx.beginPath();
  for (let y = y0; y < y1; y += 12) {
    const x = edge(y) + 18 + Math.sin(t * 1.3) * 3;
    if (y === y0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = `rgba(255,255,255,${0.22 + 0.12 * Math.sin(t * 1.3 + 1)})`;
  ctx.lineWidth = 3;
  ctx.stroke();
}
