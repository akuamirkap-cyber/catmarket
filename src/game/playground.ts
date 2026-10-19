// ---------------------------------------------------------------
//  Beach Playground & Resort (Zone 3 & 4):
//  1. Surfing cats carving across ocean waves with dynamic surf crests & spray
//  2. Grand 2X Sandcastle with cat scooping sand & patting towers
//  3. Running Kite Flying cats actively jogging back and forth with swooping kites
//  4. Roaming kittens & kid cats playing tag, chasing beach balls & crabs
//  5. 2X Giant Beach Volleyball court with 4 jumping cats & 2.4X beach ball
//  6. Sunbathing cats truly LYING DOWN (rebahan/tiduran santai) on towels
//  7. Sun from the LEFT: all shadows cast to the RIGHT, umbrellas angled to the left!
// ---------------------------------------------------------------
import { drawCat, drawCatCached, makeCat, CUSTOMER_PALS, type Cat, type Pal } from './cat';

const PI = Math.PI;
const PI2 = Math.PI * 2;
const OUT = '#58244a';

// ---------------------------------------------------------------
//  Background-sprite cache
//  The beach scenes below are built from hundreds of vector paths plus one or
//  more full cats. Re-tracing all of that every single frame is what made the
//  playground zone lag, so each self-contained scene is rasterised into a small
//  bitmap and refreshed every `ttl` frames (20-30 fps for background props).
// ---------------------------------------------------------------
interface SceneCache { cv: HTMLCanvasElement; cx: CanvasRenderingContext2D; w: number; h: number; s: number; tick: number; drawn: boolean }
const SCENE_CACHE = new Map<string, SceneCache>();

function cachedScene(
  ctx: CanvasRenderingContext2D, key: string, bx: number, by: number, bw: number, bh: number,
  res: number, ttl: number, draw: (c: CanvasRenderingContext2D) => void,
) {
  if (typeof document === 'undefined' || res <= 0) { draw(ctx); return; }
  const s = Math.max(0.5, Math.min(1.25, res));
  const w = Math.ceil(bw * s), h = Math.ceil(bh * s);
  let e = SCENE_CACHE.get(key);
  if (!e || e.s !== s || e.w !== w || e.h !== h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    e = { cv, cx: cv.getContext('2d')!, w, h, s, tick: 0, drawn: false };
    SCENE_CACHE.set(key, e);
  }
  e.tick++;
  if (!e.drawn || e.tick % ttl === 0) {
    const c = e.cx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, e.w, e.h);
    c.setTransform(s, 0, 0, s, -bx * s, -by * s);
    draw(c);
    e.drawn = true;
  }
  ctx.drawImage(e.cv, bx, by, bw, bh);
}

function ell(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, lw = 1.6) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, PI2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
}

// ---------------------------------------------------------------
//  1. MAIN PASIR: 2X GRAND SANDCASTLE & ANIMATED SCOOPING & PATTING CAT
// ---------------------------------------------------------------
export function drawSandPlayCat(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, pal: Pal, res = 0, ttl = 2) {
  if (res > 0) {
    cachedScene(ctx, `sand:${x}:${y}`, x - 175, y - 265, 430, 335, res, ttl, (c) => drawSandPlayCat(c, x, y, t, pal, 0));
    return;
  }
  ctx.save();
  ctx.translate(x, y);

  // Sun from the LEFT: shadow casts to the RIGHT (+dx, +dy)
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = '#3a2a10';
  ctx.beginPath(); ctx.ellipse(55, 24, 135, 36, 0.08, 0, PI2); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Sand Moat around the 2X grand castle
  ctx.strokeStyle = 'rgba(180,135,70,.45)';
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.ellipse(45, 12, 145, 54, 0, 0, PI2); ctx.stroke();

  // ---------------- 2X GIANT GRAND SANDCASTLE ----------------
  const cx = 45, cy = 0;

  // Outer Lower Sand Terrace
  ctx.beginPath();
  ctx.moveTo(cx - 105, cy + 26);
  ctx.lineTo(cx - 92, cy - 36);
  ctx.lineTo(cx + 92, cy - 36);
  ctx.lineTo(cx + 105, cy + 26);
  ctx.closePath();
  ctx.fillStyle = '#dec07a'; ctx.fill();
  ctx.lineWidth = 3.6; ctx.strokeStyle = OUT; ctx.stroke();

  // Lower crenellations
  for (let k = -84; k <= 84; k += 16) {
    ctx.fillStyle = '#e8cd88';
    ctx.fillRect(cx + k - 5, cy - 46, 10, 10);
    ctx.strokeRect(cx + k - 5, cy - 46, 10, 10);
  }

  // Upper Citadel Keep Wall
  ctx.beginPath();
  ctx.moveTo(cx - 65, cy - 36);
  ctx.lineTo(cx - 56, cy - 82);
  ctx.lineTo(cx + 56, cy - 82);
  ctx.lineTo(cx + 65, cy - 36);
  ctx.closePath();
  ctx.fillStyle = '#f0d38c'; ctx.fill();
  ctx.lineWidth = 3.4; ctx.strokeStyle = OUT; ctx.stroke();

  // Upper Citadel crenels
  for (let k = -48; k <= 48; k += 16) {
    ctx.fillStyle = '#f7de9e';
    ctx.fillRect(cx + k - 4, cy - 92, 9, 10);
    ctx.strokeRect(cx + k - 4, cy - 92, 9, 10);
  }

  // 4 Grand Flanking Towers
  for (const sx of [-88, 88]) {
    // Main corner towers
    ctx.beginPath();
    ctx.roundRect(cx + sx - 20, cy - 72, 40, 68, 6);
    ctx.fillStyle = sx < 0 ? '#f5db99' : '#deb66c'; ctx.fill();
    ctx.lineWidth = 3.4; ctx.strokeStyle = OUT; ctx.stroke();

    // Tower battlements
    for (const bx of [-14, -2, 10]) {
      ctx.fillRect(cx + sx + bx - 3, cy - 84, 7, 12);
      ctx.strokeRect(cx + sx + bx - 3, cy - 84, 7, 12);
    }

    // High Conical Tower Spires
    ctx.beginPath();
    ctx.moveTo(cx + sx - 24, cy - 82);
    ctx.lineTo(cx + sx, cy - 124);
    ctx.lineTo(cx + sx + 24, cy - 82);
    ctx.closePath();
    ctx.fillStyle = '#ffd24a'; ctx.fill();
    ctx.lineWidth = 3.2; ctx.strokeStyle = OUT; ctx.stroke();

    // Fluttering silk banner
    const fw = Math.sin(t * 8 + sx) * 4;
    ctx.strokeStyle = '#5a3a14'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(cx + sx, cy - 124); ctx.lineTo(cx + sx, cy - 146); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + sx, cy - 146); ctx.lineTo(cx + sx + 22 + fw, cy - 137); ctx.lineTo(cx + sx, cy - 128); ctx.closePath();
    ctx.fillStyle = sx < 0 ? '#ff4d6a' : '#4ea8e8'; ctx.fill();
    ctx.lineWidth = 2.0; ctx.strokeStyle = OUT; ctx.stroke();
  }

  // Grand Imperial Central Citadel Tower
  ctx.beginPath();
  ctx.roundRect(cx - 30, cy - 128, 60, 46, 8);
  ctx.fillStyle = '#fae6a8'; ctx.fill();
  ctx.lineWidth = 3.6; ctx.strokeStyle = OUT; ctx.stroke();

  // Central Keep battlements
  for (const bx of [-22, -10, 2, 14]) {
    ctx.fillRect(cx + bx - 3, cy - 138, 8, 10);
    ctx.strokeRect(cx + bx - 3, cy - 138, 8, 10);
  }

  // Majestic Golden Crown Spire & Flagpole
  ctx.beginPath();
  ctx.moveTo(cx - 32, cy - 138);
  ctx.lineTo(cx, cy - 176);
  ctx.lineTo(cx + 32, cy - 138);
  ctx.closePath();
  ctx.fillStyle = '#ffc83b'; ctx.fill();
  ctx.lineWidth = 3.4; ctx.strokeStyle = OUT; ctx.stroke();

  // Grand Star Royal Flag on Highest Spire
  const cfw = Math.sin(t * 9) * 5;
  ctx.strokeStyle = '#5a3a14'; ctx.lineWidth = 3.0;
  ctx.beginPath(); ctx.moveTo(cx, cy - 176); ctx.lineTo(cx, cy - 206); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 206); ctx.lineTo(cx + 32 + cfw, cy - 192); ctx.lineTo(cx, cy - 178); ctx.closePath();
  ctx.fillStyle = '#ff3b50'; ctx.fill();
  ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.fillStyle = '#ffe45c';
  ctx.beginPath(); ctx.arc(cx + 12 + cfw * 0.4, cy - 192, 4, 0, PI2); ctx.fill();

  // Arched Portcullis Gates & Wooden Planks
  ctx.beginPath(); ctx.arc(cx, cy + 26, 18, PI, 0); ctx.fillStyle = '#4a2c14'; ctx.fill();
  ctx.lineWidth = 3.0; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.fillStyle = '#a86c38';
  ctx.fillRect(cx - 15, cy + 22, 30, 8);

  // Sea Shell & Starfish Ornaments on Towers
  ctx.fillStyle = '#ff7aa8';
  ctx.beginPath(); ctx.arc(cx - 88, cy - 54, 5, 0, PI2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 88, cy - 54, 5, 0, PI2); ctx.fill();

  // Red toy bucket & sand tools
  ctx.beginPath();
  ctx.moveTo(-54, 10); ctx.lineTo(-34, 10); ctx.lineTo(-38, 34); ctx.lineTo(-50, 34); ctx.closePath();
  ctx.fillStyle = '#ff5a7a'; ctx.fill();
  ctx.lineWidth = 2.6; ctx.strokeStyle = OUT; ctx.stroke();

  // ---------------- ANIMATED CAT BUILDING & PATTING SAND ----------------
  // 3-Phase Animation Cycle:
  // Phase 1 (0.0 - 0.4): Scoop sand with spade
  // Phase 2 (0.4 - 0.7): Lift & dump sand on tower
  // Phase 3 (0.7 - 1.0): Rhythmic patting with both paws ("menepuk pasir")
  const cycle = (t * 1.8) % 1;
  const isPatting = cycle >= 0.65;
  const patCycle = ((cycle - 0.65) / 0.35) * PI2 * 3;
  const patY = isPatting ? Math.sin(patCycle) * 3 : 0;
  const scoopY = !isPatting ? Math.sin((cycle / 0.65) * PI2) * 5 : 0;

  const cat = makeCat(0, 0, pal);
  cat.t = t;
  cat.happy = 0;
  cat.exc = 0.9;
  cat.eyesOpen = true;  // Wide sparkly happy eyes!
  cat.fx = 1;
  cat.side = 1;

  ctx.save();
  ctx.translate(-26, 20 + (isPatting ? patY : scoopY * 0.4));
  drawCat(ctx, cat, 0.84);

  // Animated Hand holding Spade or Patting
  ctx.save();
  ctx.translate(16, -18);
  if (!isPatting) {
    // Scooping spade motion
    ctx.rotate(0.25 + Math.sin(cycle * PI2) * 0.45);
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(-2, 0, 5, 20);
    ctx.beginPath(); ctx.roundRect(-7, 18, 14, 14, 3); ctx.fillStyle = '#ff9f45'; ctx.fill();
    ctx.lineWidth = 1.8; ctx.strokeStyle = OUT; ctx.stroke();
    // Flying sand grains when lifting
    if (cycle > 0.3 && cycle < 0.65) {
      ctx.fillStyle = '#e8c27a';
      ctx.beginPath(); ctx.arc(12, 12, 2.4, 0, PI2); ctx.fill();
      ctx.beginPath(); ctx.arc(18, 7, 2.0, 0, PI2); ctx.fill();
    }
  } else {
    // Patting paws on the sand tower! ("nepuk-nepuk pasir rapi")
    ctx.rotate(0.8 + Math.sin(patCycle) * 0.3);
    ctx.beginPath(); ctx.ellipse(6, 6, 7, 6, 0, 0, PI2);
    ctx.fillStyle = pal.belly; ctx.fill();
    ctx.lineWidth = 2.0; ctx.strokeStyle = OUT; ctx.stroke();
    // Tiny sand dust puffs and sparkles on pat!
    ctx.fillStyle = '#edd18e';
    ctx.beginPath(); ctx.arc(14, 6 + patY, 2.2, 0, PI2); ctx.fill();
    ctx.beginPath(); ctx.arc(19, 3 + patY, 1.8, 0, PI2); ctx.fill();
  }
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------
//  2. BERSELANCAR: DYNAMIC SURFING CATS (Carving Ocean Waves + Feet Firmly Planted)
// ---------------------------------------------------------------
export function drawSurfingCat(ctx: CanvasRenderingContext2D, baseX: number, baseY: number, t: number, pal: Pal, id: number, res = 0, ttl = 2) {
  if (res > 0) {
    cachedScene(ctx, `surf:${baseX}:${baseY}:${id}`, baseX - 225, baseY - 165, 450, 250, res, ttl, (c) => drawSurfingCat(c, baseX, baseY, t, pal, id, 0));
    return;
  }
  // Leluasa berselancar: Carves across the ocean with wide sweep!
  const sweep = Math.sin(t * 0.95 + id * 2.1) * 85;
  const curX = baseX + sweep;
  const curDir = Math.cos(t * 0.95 + id * 2.1) >= 0 ? 1 : -1;

  // Ocean swell bob and pitch
  const waveH = Math.sin(t * 3.4 + curX * 0.02) * 11;
  const curY = baseY + waveH;
  const carveTilt = (curDir * 0.24) + Math.sin(t * 3.4 + curX * 0.02) * 0.15;

  ctx.save();
  ctx.translate(curX, curY);

  // 1. DYNAMIC ROLLING OCEAN SURF WAVE (Ombak besar bergulung & berbusa putih!)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-75 * curDir, 32);
  ctx.quadraticCurveTo(0, -10, 70 * curDir, 18);
  ctx.quadraticCurveTo(50 * curDir, 32, -75 * curDir, 32);
  ctx.closePath();
  ctx.fillStyle = 'rgba(68,212,242,.52)'; ctx.fill();

  // White cresting foam curl
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,.95)';
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(-65 * curDir, 20);
  ctx.quadraticCurveTo(-12 * curDir, -4, 58 * curDir, 16);
  ctx.stroke();

  // Water spray plumes shooting off the carving board edge
  for (let k = 0; k < 5; k++) {
    const spX = -55 * curDir - curDir * k * 14 + Math.sin(t * 16 + k) * 5;
    const spY = 14 + Math.sin(t * 14 + k) * 6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(spX, spY, 2.8 + (k % 2), 0, PI2); ctx.fill();
  }
  ctx.restore();

  // 2. SURFBOARD with feet FIRMLY PLANTED ON DECK (Napak di papan!)
  ctx.save();
  ctx.rotate(carveTilt);
  ctx.scale(curDir, 1);

  // Shadow in ocean water
  ctx.globalAlpha = 0.26; ctx.fillStyle = '#0a406a';
  ctx.beginPath(); ctx.ellipse(0, 18, 58, 10, 0, 0, PI2); ctx.fill();
  ctx.globalAlpha = 1;

  // Sleek Aerodynamic Tropical Surfboard
  const board = () => {
    ctx.beginPath();
    ctx.moveTo(-56, 7);
    ctx.quadraticCurveTo(0, 16, 56, 6);
    ctx.quadraticCurveTo(70, 4, 74, 1);
    ctx.quadraticCurveTo(68, -4, 54, -5);
    ctx.quadraticCurveTo(0, -12, -56, -6);
    ctx.quadraticCurveTo(-66, 1, -56, 7);
    ctx.closePath();
  };

  board();
  const bg = ctx.createLinearGradient(-56, 0, 74, 0);
  bg.addColorStop(0, '#ffd23f');
  bg.addColorStop(0.4, '#ff6b84');
  bg.addColorStop(1, '#4ea8e8');
  ctx.fillStyle = bg; ctx.fill();
  ctx.lineWidth = 3.4; ctx.strokeStyle = OUT; ctx.stroke();

  // Center racing stripe stringer
  ctx.save();
  board(); ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-65, -2.5, 145, 5.0);
  ctx.restore();

  // Under-water skeg fin
  ctx.beginPath();
  ctx.moveTo(-44, 9); ctx.lineTo(-52, 23); ctx.lineTo(-34, 9); ctx.closePath();
  ctx.fillStyle = '#1f6596'; ctx.fill();
  ctx.lineWidth = 2.0; ctx.strokeStyle = OUT; ctx.stroke();

  // 3. CAT FIRMLY STANDING ON DECK (Kaki napak kokoh di atas papan selancar)
  const cat = makeCat(0, 0, pal);
  cat.t = t;
  cat.happy = 0;
  cat.exc = 0.9;
  cat.eyesOpen = true;  // Wide sparkly eyes enjoying surfing!
  cat.fx = 1;
  cat.side = 1;
  cat.board = true;     // Surfer stance with knees bent and arms out for balance!

  ctx.save();
  // Aligned precisely so paws stand firmly on the deck top surface (napak di papan selancar)!
  ctx.translate(0, -8);
  drawCat(ctx, cat, 0.78);
  ctx.restore();
  ctx.restore(); // board frame
  ctx.restore(); // world frame
}

// ---------------------------------------------------------------
//  3. MAIN LAYANGAN: KUCING SANTAI MENIKMATI LAYANGAN TERBANG DI PANTAI
// ---------------------------------------------------------------
export function drawKiteFlyingCat(ctx: CanvasRenderingContext2D, baseX: number, groundY: number, t: number, pal: Pal, kiteType: 'fish' | 'diamond', id = 0, res = 0, ttl = 2) {
  if (res > 0) {
    cachedScene(ctx, `kite:${baseX}:${groundY}:${kiteType}:${id}`, baseX - 300, groundY - 265, 480, 340, res, ttl, (c) => drawKiteFlyingCat(c, baseX, groundY, t, pal, kiteType, id, 0));
    return;
  }
  // Relaxed 24-second beach routine:
  // Phase 1 (0s - 16s, 67%): Berdiri santai di pasir hangat, menarik ulur benang perlahan, memandangi layangan meliuk anggun
  // Phase 2 (16s - 21s, 21%): Berjalan santai pelan (calm stroll) menikmati angin sepoi-sepoi pantai
  // Phase 3 (21s - 24s, 12%): Langkah ceria santai ringan (light relaxed steps, tidak lari liar/panik)
  const period = 24;
  const cycleT = ((t * 0.65 + id * 5.2) % period);

  let curX = baseX;
  let dir = 1;
  let mv = 0;
  let spd = 0;
  let kiteLift = 0;

  if (cycleT < 16) {
    // 1. BERDIRI SANTAI (Standing peacefully in the warm sand, gazing at the soaring kite)
    curX = baseX + Math.sin(t * 0.6) * 1.8;
    dir = id % 2 === 0 ? 1 : -1;
    mv = 0;
    spd = 0;
    kiteLift = Math.sin(t * 1.4 + id) * 12;
  } else if (cycleT < 21) {
    // 2. JALAN SANTAI PELAN (Gentle leisurely beach walk)
    const prog = (cycleT - 16) / 5;
    const walkSpan = 42;
    dir = id % 2 === 0 ? 1 : -1;
    curX = baseX + (prog * 2 - 1) * walkSpan * dir;
    mv = 1;
    spd = 32; // Very calm, relaxed pace
    kiteLift = 6 + Math.sin(t * 1.8 + id) * 10;
  } else {
    // 3. LANGKAH CERIA SANTAI (Gentle cheerful steps, enjoying a sea breeze)
    const prog = (cycleT - 21) / 3;
    const jogSpan = 38;
    dir = id % 2 === 0 ? -1 : 1;
    curX = baseX + (1 - prog * 2) * jogSpan * -dir;
    mv = 1;
    spd = 52; // Calm, cheerful stroll steps
    kiteLift = 14 + Math.sin(t * 2.2 + id) * 12;
  }

  // Kite soaring smoothly and gracefully in the warm coastal wind
  const lagDist = 85 + (mv ? 20 : 0);
  const kx = curX - dir * lagDist + Math.sin(t * 1.2 + id) * 18;
  const ky = groundY - 170 - kiteLift;

  // Cat hand position holding wooden spool
  const handX = curX + dir * 13;
  const handY = groundY - 34;

  // Curving string line moving gently with the ocean breeze
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(handX, handY);
  ctx.quadraticCurveTo((handX + kx) / 2 - dir * 12, (handY + ky) / 2 + 16, kx, ky);
  ctx.stroke();

  // Cat model: peaceful, joyful gaze looking up at the sky
  const cat = makeCat(0, 0, pal);
  cat.t = t;
  cat.mv = mv;
  cat.speed = spd;
  cat.r = mv ? 0.22 : 0.04; // Smooth, gentle step bounce
  cat.fx = dir;
  cat.side = dir;
  cat.happy = 0;
  cat.exc = mv ? 0.5 : 0.25;
  cat.eyesOpen = true; // Wide sparkly peaceful eyes gazing at the kite!
  cat.look = { x: -dir * 0.45, y: -1 }; // Looking up at the kite
  ctx.save();
  ctx.translate(curX, groundY);
  drawCat(ctx, cat, 0.74);

  // Red string spool in hand
  ctx.beginPath(); ctx.roundRect(dir * 12, -40, 7, 12, 2.5);
  ctx.fillStyle = '#ff4d5e'; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillRect(dir * 13, -38, 5, 8);
  ctx.restore();

  // Kite in the sky
  ctx.save();
  ctx.translate(kx, ky);
  ctx.rotate(dir * 0.25 + Math.sin(t * 3.2) * 0.16);

  if (kiteType === 'fish') {
    // Flying Koi fish kite!
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.quadraticCurveTo(0, -18, -20, -14);
    ctx.lineTo(-32, -20); ctx.lineTo(-27, 0); ctx.lineTo(-32, 20); ctx.lineTo(-20, 14);
    ctx.quadraticCurveTo(0, 18, 26, 0);
    ctx.closePath();
    ctx.fillStyle = '#ff6b84'; ctx.fill();
    ctx.lineWidth = 2.6; ctx.strokeStyle = OUT; ctx.stroke();

    // Scales
    ctx.fillStyle = '#ffd23f';
    for (const sx of [-6, 6]) {
      ctx.beginPath(); ctx.arc(sx, 0, 5.5, -PI / 2, PI / 2); ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = OUT; ctx.stroke();
    }
    ell(ctx, 17, -4.5, 3.4, 3.4, '#fff', OUT, 1.4);
    ell(ctx, 17.5, -4.5, 1.6, 1.6, '#2a1a28');
  } else {
    // Diamond kite
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -25); ctx.lineTo(18, 0); ctx.lineTo(0, 26); ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fillStyle = '#4ea8e8'; ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(18, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(-18, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 2.6; ctx.strokeStyle = OUT; ctx.stroke();
  }

  // Waving tail ribbons
  ctx.strokeStyle = '#ff9f45'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-20, 14);
  for (let k = 1; k <= 6; k++) {
    const rx = -20 - k * 9 + Math.sin(t * 9 + k) * 6;
    const ry = 14 + k * 9 + Math.cos(t * 9 + k) * 5;
    ctx.lineTo(rx, ry);
  }
  ctx.stroke();

  // Little colored bows
  for (const bi of [2, 4, 6]) {
    const bx = -20 - bi * 9, by = 14 + bi * 9;
    ctx.fillStyle = bi % 2 === 0 ? '#ff5a8a' : '#5bd669';
    ctx.beginPath(); ctx.ellipse(bx, by, 3.5, 2.2, 0.4, 0, PI2); ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------
//  4. BERJEMUR: KUCING BENAR-BENAR TIDURAN (REBAHAN DI HANDUK)
//     Sun on the LEFT -> Umbrella tilted LEFT, Shadow cast to RIGHT!
// ---------------------------------------------------------------
export function drawSunbathingCat(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, pal: Pal, towelCol: string, res = 0, ttl = 3) {
  if (res > 0) {
    cachedScene(ctx, `sun:${x}:${y}`, x - 125, y - 145, 250, 200, res, ttl, (c) => drawSunbathingCat(c, x, y, t, pal, towelCol, 0));
    return;
  }
  ctx.save();
  ctx.translate(x, y);

  // SUN FROM LEFT: Shadow falls to the RIGHT (+dx)
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#3a2a10';
  ctx.beginPath(); ctx.ellipse(14, 8, 48, 18, 0.06, 0, PI2); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 1. Striped Beach Towel
  ctx.beginPath(); ctx.roundRect(-42, -22, 84, 44, 7);
  ctx.fillStyle = towelCol; ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-42, -22, 84, 44, 7); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  for (let k = -36; k <= 36; k += 14) ctx.fillRect(k, -24, 6, 48);
  ctx.restore();
  ctx.lineWidth = 2.6; ctx.strokeStyle = OUT; ctx.stroke();

  // Towel fringes
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  for (const ty of [-16, -8, 0, 8, 16]) {
    ctx.beginPath(); ctx.moveTo(-42, ty); ctx.lineTo(-47, ty); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(42, ty); ctx.lineTo(47, ty); ctx.stroke();
  }

  // Soft pillow at head end (LEFT side, facing sun)
  ctx.beginPath(); ctx.roundRect(-38, -14, 18, 28, 6);
  ctx.fillStyle = '#fffdf0'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.strokeStyle = 'rgba(88,36,74,.22)';
  ctx.beginPath(); ctx.moveTo(-33, -8); ctx.lineTo(-33, 8); ctx.stroke();

  // 2. Beach Umbrella TILTED TO THE LEFT (Blocks sun from the left!)
  ctx.save();
  ctx.translate(-30, -22);
  ctx.rotate(-0.38); // Tilted strongly to the left!
  ctx.strokeStyle = OUT; ctx.lineWidth = 5.2; ctx.beginPath(); ctx.moveTo(0, 24); ctx.lineTo(0, -36); ctx.stroke();
  ctx.strokeStyle = '#ecd2a2'; ctx.lineWidth = 2.8; ctx.stroke();
  // Dome canopy
  ctx.beginPath();
  ctx.arc(0, -36, 32, PI, 0);
  ctx.closePath();
  ctx.fillStyle = '#ff6b84'; ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(0, -36, 32, PI, 0); ctx.clip();
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(-14, -68); ctx.lineTo(14, -68); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.lineWidth = 2.6; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.restore();

  // 3. Cold tropical coconut drink with mini-umbrella on the right
  ctx.save();
  ctx.translate(32, 8);
  ell(ctx, 0, 0, 8, 8, '#774a22', OUT, 2);
  ell(ctx, 0, -4, 7, 3, '#f4e4c2');
  ctx.strokeStyle = '#ff4d6a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(5, -14); ctx.stroke();
  ctx.fillStyle = '#ffe14d';
  ctx.beginPath(); ctx.moveTo(2, -9); ctx.lineTo(9, -15); ctx.lineTo(6, -8); ctx.closePath(); ctx.fill();
  ctx.restore();

  // 4. REAL CAT MODEL LYING DOWN ON BACK (Kucing model asli berbaring tiduran santai di atas handuk!)
  // Using drawCat rotated 90 degrees (laying horizontal on the pillow and towel!)
  // Head on the left pillow (facing up/sun), paws resting naturally, tail resting on the right.
  const cat = makeCat(0, 0, { ...pal, shades: 'retro', tie: undefined });
  cat.t = t;
  cat.happy = 0;
  cat.exc = 0;
  cat.mv = 0;
  cat.speed = 0;
  cat.idleT = 1;
  cat.eyesOpen = false; // Wearing cool sunglasses while sunbathing!
  cat.fx = 0;
  cat.fy = 1;

  ctx.save();
  // Translate to center of towel
  ctx.translate(6, 0);
  // Rotate 90 degrees counter-clockwise so head lies towards pillow on the left (-X) and feet to the right (+X)
  ctx.rotate(-PI / 2);
  // Scale cat model
  drawCat(ctx, cat, 0.72);
  ctx.restore();  ctx.restore(); // world
}

// ---------------------------------------------------------------
//  5. 2X LAPANGAN VOLEI PANTAI, 2.4X BOLA BESI VOLI & 4 KUCING MELOMPAT
// ---------------------------------------------------------------
export interface VolleyballGame {
  courtX: number;
  courtY: number;
  ballX: number;
  ballY: number;
  ballZ: number;
  ballVz: number;
  ballSide: number; // -1 = left team, +1 = right team
  catL1: Cat;
  catL2: Cat;
  catR1: Cat;
  catR2: Cat;
}

export function makeVolleyballGame(x: number, y: number): VolleyballGame {
  // Cats positions relative to court (m.x = 0, m.y = 0 so drawCat doesn't double-translate!)
  const catL1 = makeCat(0, 0, CUSTOMER_PALS[0]);
  const catL2 = makeCat(0, 0, CUSTOMER_PALS[1]);
  const catR1 = makeCat(0, 0, CUSTOMER_PALS[2]);
  const catR2 = makeCat(0, 0, CUSTOMER_PALS[3]);

  catL1.happy = 0; catL1.exc = 0.8; catL1.eyesOpen = true;
  catL2.happy = 0; catL2.exc = 0.8; catL2.eyesOpen = true;
  catR1.happy = 0; catR1.exc = 0.8; catR1.eyesOpen = true;
  catR2.happy = 0; catR2.exc = 0.8; catR2.eyesOpen = true;

  return {
    courtX: x, courtY: y,
    ballX: x - 55, ballY: y - 10, ballZ: 45, ballVz: 220, ballSide: -1,
    catL1, catL2, catR1, catR2,
  };
}

export function updateVolleyball(vg: VolleyballGame, dt: number) {
  // Ball gravity & horizontal motion across the net
  const g = 440;
  vg.ballVz -= g * dt;
  vg.ballZ += vg.ballVz * dt;
  vg.ballX += vg.ballSide * -1 * 110 * dt;

  // Active cat spikes when ball reaches hitting zone!
  if (vg.ballZ < 42 && vg.ballVz < 0) {
    vg.ballVz = 230;
    vg.ballSide = -vg.ballSide;
    const spiker = vg.ballSide > 0 ? vg.catL1 : vg.catR1;
    spiker.hopY = 24;
    spiker.sqV = 7;
  }

  // Decay jump
  for (const c of [vg.catL1, vg.catL2, vg.catR1, vg.catR2]) {
    c.hopY = Math.max(0, c.hopY - 65 * dt);
  }
}

export function drawVolleyballCourt(ctx: CanvasRenderingContext2D, vg: VolleyballGame, t: number, res = 0, ttl = 2) {
  const { courtX: x, courtY: y } = vg;
  if (res > 0) {
    cachedScene(ctx, `volley:${x}:${y}`, x - 245, y - 180, 490, 285, res, ttl, (c) => drawVolleyballCourt(c, vg, t, 0));
    return;
  }

  ctx.save();
  ctx.translate(x, y);

  // 1. 2X BIGGER SAND COURT (380px wide x 136px deep!)
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(-190, -68, 380, 136, 14);
  ctx.fillStyle = 'rgba(255,242,205,.4)'; ctx.fill();
  ctx.lineWidth = 3.6; ctx.strokeStyle = 'rgba(215,160,75,.85)';
  ctx.setLineDash([14, 10]); ctx.stroke(); ctx.setLineDash([]);

  // Court center dividing line
  ctx.beginPath(); ctx.moveTo(0, -68); ctx.lineTo(0, 68);
  ctx.strokeStyle = 'rgba(215,160,75,.6)'; ctx.lineWidth = 2.4; ctx.stroke();

  // 2. HIGH VOLLEYBALL NET (Across Y axis at X = 0)
  // High wooden support posts
  for (const py of [-74, 74]) {
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(-4, py - 62, 8, 66);
    ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.strokeRect(-4, py - 62, 8, 66);
    // Red flag on post top
    ctx.fillStyle = '#ff4d5e';
    ctx.beginPath(); ctx.moveTo(0, py - 62); ctx.lineTo(12, py - 56); ctx.lineTo(0, py - 50); ctx.closePath(); ctx.fill();
  }

  // White Volleyball Net Mesh (Taller!)
  const netH = 46;
  ctx.beginPath();
  ctx.moveTo(0, -74); ctx.lineTo(0, 74); ctx.lineTo(0, 74 - netH); ctx.lineTo(0, -74 - netH); ctx.closePath();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();

  // Net grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.4;
  for (let gy = -74; gy <= 74; gy += 10) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(0, gy - netH); ctx.stroke();
  }
  // Bold Yellow Top Net Band
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.moveTo(0, -74 - netH); ctx.lineTo(0, 74 - netH); ctx.stroke();

  ctx.restore(); // court center

  // 3. 4 ACTIVE PLAYING CATS (PROPERLY TRANSLATED WITHOUT DOUBLE TRANSLATION BUG!)
  // Team Left: Front Spiker & Back Defender
  ctx.save();
  ctx.translate(x - 65, y + 12 - vg.catL1.hopY);
  vg.catL1.fx = 1; vg.catL1.side = 1;
  drawCat(ctx, vg.catL1, 0.82);
  ctx.restore();

  ctx.save();
  ctx.translate(x - 130, y - 18 - vg.catL2.hopY);
  vg.catL2.fx = 1; vg.catL2.side = 1;
  drawCat(ctx, vg.catL2, 0.78);
  ctx.restore();

  // Team Right: Front Spiker & Back Defender
  ctx.save();
  ctx.translate(x + 65, y + 12 - vg.catR1.hopY);
  vg.catR1.fx = -1; vg.catR1.side = -1;
  drawCat(ctx, vg.catR1, 0.82);
  ctx.restore();

  ctx.save();
  ctx.translate(x + 130, y - 18 - vg.catR2.hopY);
  vg.catR2.fx = -1; vg.catR2.side = -1;
  drawCat(ctx, vg.catR2, 0.78);
  ctx.restore();

  // 4. 2.4X BIGGER BEACH VOLLEYBALL BALL
  // Radius was 9.5 -> 9.5 * 2.4 = ~23px radius!
  const BR = 23;
  ctx.save();
  // Ball shadow on court (grows/shrinks with height)
  ctx.globalAlpha = Math.max(0.12, 0.38 - vg.ballZ * 0.002);
  ctx.fillStyle = '#3a2a10';
  ctx.beginPath(); ctx.ellipse(vg.ballX + 10, vg.ballY + 4, BR * 0.9 - vg.ballZ * 0.04, BR * 0.4 - vg.ballZ * 0.02, 0, 0, PI2); ctx.fill();
  ctx.globalAlpha = 1;

  // Ball in air (spins as it flies!)
  ctx.translate(vg.ballX, vg.ballY - vg.ballZ);
  ctx.rotate(t * 6);

  ctx.beginPath(); ctx.arc(0, 0, BR, 0, PI2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.lineWidth = 3.6; ctx.strokeStyle = OUT; ctx.stroke();

  // Colorful tri-panel beach ball (Yellow, Sky Blue, White)
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, BR, 0, PI2); ctx.clip();
  // Yellow panel
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.arc(0, 0, BR, -0.7, 0.7); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  // Blue panel
  ctx.fillStyle = '#3eb5f0';
  ctx.beginPath(); ctx.arc(0, 0, BR, 1.4, 2.8); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  // Center badge
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, PI2); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.restore();

  ctx.restore();
}

// ---------------------------------------------------------------
//  6. PLAYGROUND ROAMING KITTENS & PLAYFUL CATS (12 Kucing & Anak Kucing Riang)
// ---------------------------------------------------------------
export interface PlaygroundCat {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  pal: Pal;
  size: number;
  build: Partial<import('./cat').CatCfg> | null;
  mode: 'tag' | 'ball' | 'chase' | 'splash' | 'tumble';
  t: number;
  seed: number;
  vx: number;
  vy: number;
  facing: number;
}

export function makePlaygroundCats(): PlaygroundCat[] {
  return [
    // 1. Kitten 1: Tabby Oranye playing tag
    { x: 680, y: 1340, baseX: 680, baseY: 1340, pal: CUSTOMER_PALS[1], size: 0.52, build: { head: 1.45, legs: 0.72 }, mode: 'tag', t: 0, seed: 1, vx: 0, vy: 0, facing: 1 },
    // 2. Kitten 2: Calico Biru chasing kitten 1
    { x: 740, y: 1360, baseX: 740, baseY: 1360, pal: CUSTOMER_PALS[6], size: 0.50, build: { head: 1.5, legs: 0.7 }, mode: 'tag', t: 0.5, seed: 2, vx: 0, vy: 0, facing: 1 },
    // 3. Kitten 3: Fluffy Pink bow kitten tagging along
    { x: 790, y: 1330, baseX: 790, baseY: 1330, pal: CUSTOMER_PALS[0], size: 0.48, build: { head: 1.48, legs: 0.68 }, mode: 'tag', t: 1.0, seed: 3, vx: 0, vy: 0, facing: -1 },

    // 4. Kid Cat 1: Dribbling Beach Ball
    { x: 980, y: 1440, baseX: 980, baseY: 1440, pal: CUSTOMER_PALS[4], size: 0.72, build: { head: 1.28, legs: 0.9 }, mode: 'ball', t: 0, seed: 4, vx: 0, vy: 0, facing: 1 },
    // 5. Kid Cat 2: Passing & receiving Beach Ball
    { x: 1060, y: 1445, baseX: 1060, baseY: 1445, pal: CUSTOMER_PALS[2], size: 0.74, build: { head: 1.25, legs: 0.9 }, mode: 'ball', t: 1.5, seed: 5, vx: 0, vy: 0, facing: -1 },

    // 6. Playful Kitten: Chasing a tiny beach sand crab
    { x: 1680, y: 1400, baseX: 1680, baseY: 1400, pal: CUSTOMER_PALS[3], size: 0.56, build: { head: 1.4, legs: 0.75 }, mode: 'chase', t: 0, seed: 6, vx: 0, vy: 0, facing: 1 },
    // 7. Playful Cat: Chasing sea shell along the shore
    { x: 1770, y: 1460, baseX: 1770, baseY: 1460, pal: CUSTOMER_PALS[5], size: 0.82, build: null, mode: 'chase', t: 0.8, seed: 7, vx: 0, vy: 0, facing: -1 },

    // 8. Kitten 4: Splashing playfully in the shallow shore water
    { x: 420, y: 1380, baseX: 420, baseY: 1380, pal: CUSTOMER_PALS[0], size: 0.54, build: { head: 1.42, legs: 0.7 }, mode: 'splash', t: 0, seed: 8, vx: 0, vy: 0, facing: 1 },
    // 9. Kitten 5: Jumping in the ocean foam
    { x: 470, y: 1430, baseX: 470, baseY: 1430, pal: CUSTOMER_PALS[1], size: 0.50, build: { head: 1.48, legs: 0.68 }, mode: 'splash', t: 1.2, seed: 9, vx: 0, vy: 0, facing: -1 },

    // 10. Tumbling Kitten: Doing playful cartwheels on warm sand
    { x: 1280, y: 1370, baseX: 1280, baseY: 1370, pal: CUSTOMER_PALS[2], size: 0.52, build: { head: 1.46, legs: 0.7 }, mode: 'tumble', t: 0, seed: 10, vx: 0, vy: 0, facing: 1 },
    // 11. Joyful Kid Cat: Running laps around the palm tree
    { x: 1480, y: 1440, baseX: 1480, baseY: 1440, pal: CUSTOMER_PALS[4], size: 0.70, build: { head: 1.3, legs: 0.88 }, mode: 'tag', t: 2.1, seed: 11, vx: 0, vy: 0, facing: 1 },
    // 12. Little Curious Kitten: Wandering and exploring beach shells
    { x: 1860, y: 1380, baseX: 1860, baseY: 1380, pal: CUSTOMER_PALS[6], size: 0.48, build: { head: 1.5, legs: 0.68 }, mode: 'chase', t: 1.8, seed: 12, vx: 0, vy: 0, facing: -1 },

    // 13. Kitten 6: Playful tabby exploring sand dunes
    { x: 890, y: 1370, baseX: 890, baseY: 1370, pal: CUSTOMER_PALS[1], size: 0.50, build: { head: 1.46, legs: 0.7 }, mode: 'tumble', t: 0.9, seed: 13, vx: 0, vy: 0, facing: 1 },
    // 14. Kitten 7: Chasing sea foam bubbles near pier
    { x: 530, y: 1390, baseX: 530, baseY: 1390, pal: CUSTOMER_PALS[5], size: 0.48, build: { head: 1.5, legs: 0.68 }, mode: 'splash', t: 2.3, seed: 14, vx: 0, vy: 0, facing: -1 },
    // 15. Kid Cat 3: Playful beach ball partner
    { x: 1180, y: 1450, baseX: 1180, baseY: 1450, pal: CUSTOMER_PALS[3], size: 0.68, build: { head: 1.3, legs: 0.85 }, mode: 'ball', t: 0.7, seed: 15, vx: 0, vy: 0, facing: 1 },
    // 16. Kitten 8: Chasing beach butterflies
    { x: 1580, y: 1370, baseX: 1580, baseY: 1370, pal: CUSTOMER_PALS[0], size: 0.46, build: { head: 1.52, legs: 0.66 }, mode: 'chase', t: 3.1, seed: 16, vx: 0, vy: 0, facing: -1 },
    // 17. Kitten 9: Tag buddy running joyful arcs
    { x: 840, y: 1360, baseX: 840, baseY: 1360, pal: CUSTOMER_PALS[4], size: 0.52, build: { head: 1.44, legs: 0.72 }, mode: 'tag', t: 1.4, seed: 17, vx: 0, vy: 0, facing: 1 },
    // 18. Kitten 10: Tumbling near sandcastle
    { x: 1360, y: 1390, baseX: 1360, baseY: 1390, pal: CUSTOMER_PALS[6], size: 0.49, build: { head: 1.48, legs: 0.69 }, mode: 'tumble', t: 2.6, seed: 18, vx: 0, vy: 0, facing: -1 },
  ];
}

export function updatePlaygroundCats(cats: PlaygroundCat[], dt: number) {
  for (const pc of cats) {
    pc.t += dt;
    const prevX = pc.x, prevY = pc.y;

    if (pc.mode === 'tag') {
      // Circular chase loop
      const a = pc.t * 1.6 + pc.seed * 2.2;
      pc.x = pc.baseX + Math.cos(a) * 55;
      pc.y = pc.baseY + Math.sin(a) * 35;
    } else if (pc.mode === 'ball') {
      // Dribbling back and forth smoothly
      const off = Math.sin(pc.t * 2.2 + pc.seed) * 45;
      pc.x = pc.baseX + off;
      pc.y = pc.baseY + Math.cos(pc.t * 1.1) * 8;
    } else if (pc.mode === 'chase') {
      // Zipping and pouncing on sand crab
      const off = Math.sin(pc.t * 1.8 + pc.seed * 1.5) * 50;
      pc.x = pc.baseX + off;
      pc.y = pc.baseY + Math.sin(pc.t * 3.6) * 12;
    } else if (pc.mode === 'splash') {
      // Bouncing in the wave edge
      const off = Math.sin(pc.t * 1.7 + pc.seed) * 30;
      pc.x = pc.baseX + off;
      pc.y = pc.baseY + Math.abs(Math.sin(pc.t * 3.2)) * 14;
    } else if (pc.mode === 'tumble') {
      // Playful back and forth tumbling run
      const off = Math.sin(pc.t * 1.5 + pc.seed) * 40;
      pc.x = pc.baseX + off;
      pc.y = pc.baseY + Math.sin(pc.t * 3.0) * 6;
    }

    // ACCURATE VELOCITY & FACING DIRECTION (Strict anti-jalan mundur!)
    // Kitten ALWAYS faces the direction of actual horizontal movement!
    pc.vx = (pc.x - prevX) / Math.max(0.001, dt);
    pc.vy = (pc.y - prevY) / Math.max(0.001, dt);
    if (Math.abs(pc.vx) > 0.5) {
      pc.facing = pc.vx > 0 ? 1 : -1;
    }
  }
}

const PG_CATS = new WeakMap<PlaygroundCat, Cat>();
export function drawPlaygroundCatItem(ctx: CanvasRenderingContext2D, pc: PlaygroundCat, t: number, res = 0, ttl = 2) {
  let cat = PG_CATS.get(pc);
  if (!cat) { cat = makeCat(0, 0, pc.pal); PG_CATS.set(pc, cat); }
  cat.t = t;
  cat.size = pc.size;
  cat.build = pc.build;
  const speed = Math.hypot(pc.vx, pc.vy);
  cat.mv = speed > 4 ? 1 : 0;
  cat.speed = Math.max(35, speed * 2.5);
  cat.r = 0.45; // Smooth bouncy run animation
  cat.phase = pc.t * 12; // Natural step cycle synced with speed
  cat.happy = 0;
  cat.eyesOpen = true; // Wide alert cute eyes!
  cat.exc = 0.85;

  // STRICT FACING DIRECTION: strictly aligned with movement so kittens never walk backwards!
  cat.vx = pc.vx;
  cat.vy = pc.vy;
  cat.fx = pc.facing;
  cat.side = pc.facing;

  ctx.save();
  ctx.translate(pc.x, pc.y);
  drawCatCached(ctx, cat, 0.78, res, ttl);

  // Playful props per mode
  if (pc.mode === 'ball') {
    // Colorful beach ball ahead of the running kitten
    const bx = 16 * pc.facing, by = -4;
    ell(ctx, bx, by + 6, 8, 3, 'rgba(50,30,10,.25)');
    ctx.beginPath(); ctx.arc(bx, by, 8.5, 0, PI2);
    ctx.fillStyle = '#ff6b84'; ctx.fill();
    ctx.lineWidth = 1.8; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.arc(bx, by, 8.5, -0.6, 0.6); ctx.lineTo(bx, by); ctx.closePath();
    ctx.fillStyle = '#ffd23f'; ctx.fill();
  } else if (pc.mode === 'chase') {
    // Little cute sand crab scurrying ahead of kitten
    const cx = 22 * pc.facing, cy = 2;
    ctx.fillStyle = '#e85a4a';
    ctx.beginPath(); ctx.ellipse(cx, cy, 5, 3.5, 0, 0, PI2); ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke();
    // Claws
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.arc(cx + pc.facing * 3, cy + s * 3.5, 1.8, 0, PI2); ctx.fill();
    }
  } else if (pc.mode === 'splash') {
    // Water droplets splashing at feet
    ctx.fillStyle = '#9fe8ff';
    for (let k = 0; k < 3; k++) {
      const sx = -pc.facing * 8 + Math.sin(t * 18 + k) * 6;
      const sy = 2 + Math.sin(t * 16 + k) * 4;
      ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, PI2); ctx.fill();
    }
  }

  ctx.restore();
}
