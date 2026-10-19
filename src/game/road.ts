// ---------------------------------------------------------------
//  Beach Highway, 2x Vertical Cat Bus (Facing Up) & Lively Traffic
//  Highway has a parking bay on the sidewalk for the bus, and moving
//  beach traffic (buggies, convertibles, scooters, delivery trucks)
// ---------------------------------------------------------------
import { sprite } from './sprites';

const PI = Math.PI;
const PI2 = Math.PI * 2;
const OUT = '#58244a';

export const ROAD_X = 3300;      // Start of asphalt highway
export const SIDEWALK_X = 3240;  // Start of concrete sidewalk
export const ROAD_W = 380;       // Width of highway up to WORLD_W (3680)

// The bus pulls snugly against the sidewalk into the bus bay at x=3310
// so that passing cars in the lanes (x=3430 and x=3580) pass safely!
export const BUS_STOP = { x: 3244, y: 520 };
export const BUS_DOOR = { x: 3254, y: 520 };
export const BUS_POS = { x: 3296, y: 520 };

function ell(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke?: string, lw = 1.6) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, PI2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
}

/** Paints the asphalt highway, sidewalk curb, lane markings, zebra cross, and street lamps */
export function paintHighway(c: CanvasRenderingContext2D, X0: number, Y0: number, X1: number, Y1: number) {
  void X0;
  if (X1 < SIDEWALK_X) return;

  // 1. Concrete sidewalk along the beach edge (x = 3240 to 3300)
  c.fillStyle = '#ded6c4';
  c.fillRect(SIDEWALK_X, Y0, ROAD_X - SIDEWALK_X, Y1 - Y0);
  // Curb stone edge with dark seam
  c.fillStyle = '#b0bac7';
  c.fillRect(ROAD_X - 6, Y0, 6, Y1 - Y0);
  c.fillStyle = '#58244a';
  c.fillRect(ROAD_X, Y0, 3, Y1 - Y0);
  // Sidewalk tile paving lines
  c.strokeStyle = 'rgba(120,105,80,.25)';
  c.lineWidth = 1.5;
  for (let y = Math.floor(Y0 / 32) * 32; y < Y1; y += 32) {
    c.beginPath(); c.moveTo(SIDEWALK_X, y); c.lineTo(ROAD_X - 6, y); c.stroke();
  }

  // 2. Highway Asphalt Surface (x = 3300 to 3680)
  c.fillStyle = '#2c3240';
  c.fillRect(ROAD_X, Y0, X1 - ROAD_X + 20, Y1 - Y0);

  // Bus parking bay line markings along the curb (x = 3300 to 3370)
  c.strokeStyle = '#ffd23f';
  c.lineWidth = 3;
  c.setLineDash([12, 10]);
  c.beginPath(); c.moveTo(ROAD_X + 68, 360); c.lineTo(ROAD_X + 68, 680); c.stroke();
  c.setLineDash([]);
  c.fillStyle = 'rgba(255,210,63,.15)';
  c.fillRect(ROAD_X - 16, 360, 84, 320);

  // Zebra cross at the bus stop entrance (y = 480 to 560)
  if (!(560 < Y0 || 480 > Y1)) {
    c.fillStyle = '#ffffff';
    for (let y = 486; y < 556; y += 18) {
      c.fillRect(ROAD_X + 6, y, 65, 10);
    }
  }

  // Center double yellow lines between Northbound and Southbound lanes (x = 3510)
  c.fillStyle = '#ffd23f';
  c.fillRect(ROAD_X + 204, Y0, 4, Y1 - Y0);
  c.fillRect(ROAD_X + 212, Y0, 4, Y1 - Y0);

  // White lane dashes
  c.strokeStyle = '#ffffff';
  c.lineWidth = 3.5;
  c.setLineDash([32, 26]);
  c.beginPath(); c.moveTo(ROAD_X + 136, Y0); c.lineTo(ROAD_X + 136, Y1); c.stroke(); // Northbound lane divider
  c.beginPath(); c.moveTo(ROAD_X + 286, Y0); c.lineTo(ROAD_X + 286, Y1); c.stroke(); // Southbound lane divider
  c.setLineDash([]);

  // Right edge solid white line & guardrail
  c.fillStyle = '#ffffff';
  c.fillRect(ROAD_X + 358, Y0, 4, Y1 - Y0);
  c.fillStyle = '#7a8698';
  c.fillRect(ROAD_X + 366, Y0, 14, Y1 - Y0);
}

/** Draws the Bus Stop Shelter and Pole on the sidewalk */
export function drawBusStop(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // Ground shadow
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#3a2a10';
  ctx.beginPath(); ctx.ellipse(0, 10, 36, 9, 0, 0, PI2); ctx.fill();
  ctx.globalAlpha = 1;

  // Wooden bench
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(-24, -2, 48, 10, 3);
  ctx.fillStyle = '#c88a4a'; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = OUT; ctx.stroke();
  for (const bx of [-18, 18]) {
    ctx.fillStyle = '#7a4a22';
    ctx.fillRect(bx - 2.5, 8, 5, 10);
  }

  // Bus shelter canopy posts
  ctx.fillStyle = '#4ea8e8';
  for (const px of [-22, 22]) {
    ctx.fillRect(px - 2.5, -45, 5, 50);
    ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.strokeRect(px - 2.5, -45, 5, 50);
  }

  // Cute rounded shelter roof
  ctx.beginPath();
  ctx.moveTo(-32, -45);
  ctx.quadraticCurveTo(0, -56, 32, -45);
  ctx.lineTo(32, -40);
  ctx.quadraticCurveTo(0, -50, -32, -40);
  ctx.closePath();
  ctx.fillStyle = '#ff7aa8'; ctx.fill();
  ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.stroke();

  // Round Bus Stop Sign Pole (Lollipop sign: 🚏 CAT BUS)
  ctx.save();
  ctx.translate(28, -6);
  ctx.fillStyle = '#6a7888';
  ctx.fillRect(-2, -35, 4, 45);
  // Round lollipop sign disc
  ctx.beginPath(); ctx.arc(0, -38, 14, 0, PI2);
  ctx.fillStyle = '#ffe14d'; ctx.fill();
  ctx.lineWidth = 2.6; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -38, 10, 0, PI2);
  ctx.lineWidth = 1.4; ctx.strokeStyle = '#e08a00'; ctx.stroke();
  ctx.font = '14px system-ui, "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚏', 0, -33);
  // Base plate
  ctx.beginPath(); ctx.ellipse(0, 10, 6, 2.5, 0, 0, PI2);
  ctx.fillStyle = '#4a5360'; ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ---------------------------------------------------------------
//  2X BIGGER VERTICAL CAT BUS (FACING UP / NORTHBOUND)
//  Width ~96, Length ~230 (Top-down 2.5D perspective)
// ---------------------------------------------------------------
function paintVerticalBusRaw(c: CanvasRenderingContext2D, t: number) {
  void t;
  c.lineJoin = 'round';
  c.lineCap = 'round';

  const W = 92;   // Bus width across the lane
  const L = 224;  // Bus length (front is at -L/2, rear is at +L/2)

  // 1. Dual Headlight Beams shining forward (upwards) onto the road
  const beam = (hx: number) => {
    const bg = c.createRadialGradient(hx, -L / 2 - 10, 5, hx, -L / 2 - 80, 85);
    bg.addColorStop(0, 'rgba(255,250,180,.45)');
    bg.addColorStop(0.5, 'rgba(255,245,160,.18)');
    bg.addColorStop(1, 'rgba(255,240,150,0)');
    c.fillStyle = bg;
    c.beginPath();
    c.moveTo(hx - 8, -L / 2 - 6);
    c.lineTo(hx - 36, -L / 2 - 95);
    c.lineTo(hx + 36, -L / 2 - 95);
    c.lineTo(hx + 8, -L / 2 - 6);
    c.closePath();
    c.fill();
  };
  beam(-W / 2 + 18);
  beam(W / 2 - 18);

  // 2. Wheels on the sides (4 wheels visible partly under chassis)
  for (const wx of [-W / 2 - 3, W / 2 + 3]) {
    for (const wy of [-L / 2 + 46, L / 2 - 46]) {
      // Tire
      c.beginPath(); c.roundRect(wx - 4, wy - 15, 8, 30, 4);
      c.fillStyle = '#222530'; c.fill();
      c.lineWidth = 2.4; c.strokeStyle = OUT; c.stroke();
      // Hubcap
      c.fillStyle = '#e4edf6';
      c.fillRect(wx - 2, wy - 8, 4, 16);
    }
  }

  // 3. Cat Ears on Front Roof (pointing up / forward!)
  for (const es of [-1, 1]) {
    c.beginPath();
    c.moveTo(es * (W / 2 - 14) - 10, -L / 2 + 4);
    c.quadraticCurveTo(es * (W / 2 - 14), -L / 2 - 28, es * (W / 2 - 14) + 12, -L / 2 + 4);
    c.closePath();
    c.fillStyle = '#ff9f45'; c.fill();
    c.lineWidth = 3.2; c.strokeStyle = OUT; c.stroke();
    // Inner ear pink
    c.beginPath();
    c.moveTo(es * (W / 2 - 14) - 6, -L / 2 + 3);
    c.quadraticCurveTo(es * (W / 2 - 14), -L / 2 - 18, es * (W / 2 - 14) + 7, -L / 2 + 3);
    c.closePath();
    c.fillStyle = '#ff7aa8'; c.fill();
  }

  // 4. Main Bus Body Outline & Shell
  const bodyPath = () => {
    c.beginPath();
    c.moveTo(-W / 2 + 18, -L / 2);
    c.quadraticCurveTo(0, -L / 2 - 6, W / 2 - 18, -L / 2);
    c.quadraticCurveTo(W / 2, -L / 2, W / 2, -L / 2 + 20);
    c.lineTo(W / 2, L / 2 - 20);
    c.quadraticCurveTo(W / 2, L / 2, W / 2 - 18, L / 2);
    c.quadraticCurveTo(0, L / 2 + 5, -W / 2 + 18, L / 2);
    c.quadraticCurveTo(-W / 2, L / 2, -W / 2, L / 2 - 20);
    c.lineTo(-W / 2, -L / 2 + 20);
    c.quadraticCurveTo(-W / 2, -L / 2, -W / 2 + 18, -L / 2);
    c.closePath();
  };

  // Body fill (two-tone retro pastel cyan and cream)
  bodyPath();
  const bg = c.createLinearGradient(-W / 2, 0, W / 2, 0);
  bg.addColorStop(0, '#58d0f4');
  bg.addColorStop(0.3, '#6de0ff');
  bg.addColorStop(0.7, '#fff5dc');
  bg.addColorStop(1, '#ffeed0');
  c.fillStyle = bg; c.fill();
  c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();

  // Coral Pink accent stripe down the left side
  c.save();
  bodyPath(); c.clip();
  c.fillStyle = '#ff6b84';
  c.fillRect(-W / 2, -L / 2, 10, L);
  c.fillStyle = '#ffffff';
  c.fillRect(-W / 2 + 2, -L / 2, 2, L);
  c.restore();

  // 5. Front Windshield (Facing Up / North)
  c.beginPath();
  c.roundRect(-W / 2 + 12, -L / 2 + 10, W - 24, 38, 8);
  c.fillStyle = '#c5f2ff'; c.fill();
  c.lineWidth = 2.8; c.strokeStyle = OUT; c.stroke();
  // Windshield glass reflections
  c.fillStyle = 'rgba(255,255,255,.65)';
  c.beginPath();
  c.moveTo(-W / 2 + 18, -L / 2 + 14);
  c.lineTo(-W / 2 + 32, -L / 2 + 14);
  c.lineTo(-W / 2 + 24, -L / 2 + 42);
  c.lineTo(-W / 2 + 14, -L / 2 + 42);
  c.closePath(); c.fill();
  // Windshield wipers
  c.strokeStyle = OUT; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(-16, -L / 2 + 44); c.lineTo(-8, -L / 2 + 22); c.stroke();
  c.beginPath(); c.moveTo(16, -L / 2 + 44); c.lineTo(24, -L / 2 + 22); c.stroke();

  // Destination Signboard above windshield: "CAT FISH MARKET 🐟"
  c.beginPath();
  c.roundRect(-W / 2 + 14, -L / 2 - 4, W - 28, 14, 4);
  c.fillStyle = '#221e2c'; c.fill();
  c.lineWidth = 2; c.strokeStyle = '#ff9f45'; c.stroke();
  c.font = '900 8.5px system-ui, sans-serif';
  c.fillStyle = '#ffe45c';
  c.textAlign = 'center';
  c.fillText('CAT FISH MARKET 🐟', 0, -L / 2 + 7);

  // Headlights at front corners
  for (const hs of [-1, 1]) {
    c.beginPath();
    c.arc(hs * (W / 2 - 14), -L / 2 + 4, 5.5, 0, PI2);
    c.fillStyle = '#fff9d0'; c.fill();
    c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(hs * (W / 2 - 14), -L / 2 + 4, 2.5, 0, PI2);
    c.fillStyle = '#ffe14d'; c.fill();
  }

  // 6. Tinted Passenger Windows along the right side (clean glass, no cats showing)
  for (let i = 0; i < 4; i++) {
    const wy = -L / 2 + 62 + i * 36;
    c.beginPath();
    c.roundRect(W / 2 - 16, wy, 12, 26, 4);
    c.fillStyle = '#b6e8f8'; c.fill();
    c.lineWidth = 2.2; c.strokeStyle = OUT; c.stroke();
    // Glass reflections
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath(); c.moveTo(W / 2 - 14, wy + 2); c.lineTo(W / 2 - 6, wy + 2); c.lineTo(W / 2 - 14, wy + 20); c.closePath(); c.fill();
  }

  // 7. Left Side Windows + OPEN PASSENGER DOOR (facing the sidewalk curb!)
  // Door is situated at wy = -L / 2 + 62 (right near the front, facing sidewalk!)
  const dy = -L / 2 + 60;
  c.beginPath();
  c.roundRect(-W / 2 - 2, dy, 18, 48, 5);
  c.fillStyle = '#221a28'; c.fill();
  c.lineWidth = 2.6; c.strokeStyle = OUT; c.stroke();
  // Warm illuminated doorway steps
  c.fillStyle = '#ffeaa0';
  c.fillRect(-W / 2 - 2, dy + 6, 14, 12);
  c.fillRect(-W / 2 - 2, dy + 24, 14, 14);
  c.fillStyle = '#ff6b84';
  c.fillRect(-W / 2 - 4, dy + 2, 4, 44);

  // Other left side passenger windows
  for (let i = 2; i < 4; i++) {
    const wy = -L / 2 + 62 + i * 36;
    c.beginPath();
    c.roundRect(-W / 2 + 4, wy, 12, 26, 4);
    c.fillStyle = '#c5f2ff'; c.fill();
    c.lineWidth = 2.2; c.strokeStyle = OUT; c.stroke();
  }

  // 8. Roof Detailing (cream strip, vents, paw prints!)
  c.beginPath();
  c.roundRect(-W / 2 + 22, -L / 2 + 56, W - 44, L - 110, 8);
  c.fillStyle = '#fffdf5'; c.fill();
  c.lineWidth = 2; c.strokeStyle = 'rgba(88,36,74,.35)'; c.stroke();
  // Cute paw prints on the roof!
  for (let k = 0; k < 3; k++) {
    const py = -L / 2 + 76 + k * 34;
    c.fillStyle = '#ff9f45';
    c.beginPath(); c.ellipse(0, py, 4, 3, 0, 0, PI2); c.fill();
    for (const [tx, ty] of [[-4.5, -3], [-1.8, -5], [1.8, -5], [4.5, -3]]) {
      c.beginPath(); c.arc(tx, py + ty, 1.4, 0, PI2); c.fill();
    }
  }

  // 9. Rear Bumper & Red Taillights (Facing Down / South)
  for (const ts of [-1, 1]) {
    c.beginPath();
    c.roundRect(ts * (W / 2 - 14) - 4, L / 2 - 6, 8, 5, 2);
    c.fillStyle = '#ff3b30'; c.fill();
    c.lineWidth = 1.8; c.strokeStyle = OUT; c.stroke();
  }
}

/** Draws the 2x Bigger Beach Cat Bus parked at the road stop facing north */
export function drawCatBus(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // Idle subtle hum
  const hum = Math.sin(t * 14) * 0.8;
  const spr = sprite('catBusVert2x', 140, 260, (c) => {
    c.translate(0, 10);
    paintVerticalBusRaw(c, t);
  });

  ctx.save();
  ctx.translate(x, y + hum);

  // Big ground shadow under bus
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#1a1f2c';
  ctx.beginPath(); ctx.ellipse(0, 6, 52, 118, 0, 0, PI2); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.drawImage(spr, -70, -130, 140, 260);

  // Exhaust puff from rear bumper at bottom-right
  const pLife = (t * 2.5) % 1;
  const exX = 36, exY = 118 + pLife * 24;
  ctx.globalAlpha = (1 - pLife) * 0.55;
  ctx.fillStyle = '#f0f4fa';
  ctx.beginPath(); ctx.arc(exX, exY, 4 + pLife * 8, 0, PI2); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------
//  LIVELY HIGHWAY TRAFFIC (Moving Beach Vehicles)
// ---------------------------------------------------------------
export type CarType = 'beetle' | 'convertible' | 'scooter' | 'truck';

export interface TrafficCar {
  type: CarType;
  lane: 'north' | 'south'; // north = moving up (-y), south = moving down (+y)
  x: number;
  y: number;
  speed: number;
  color: string;
  seed: number;
}

export function makeTrafficCar(lane: 'north' | 'south', y: number): TrafficCar {
  const types: CarType[] = ['beetle', 'convertible', 'scooter', 'truck'];
  const colors = ['#ff6b84', '#ffd23f', '#4ea8e8', '#5bd669', '#ff9f45', '#c77dff', '#ffffff'];
  const type = types[Math.floor(Math.random() * types.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const speed = (lane === 'north' ? -1 : 1) * (130 + Math.random() * 60);
  const x = lane === 'north' ? ROAD_X + 136 : ROAD_X + 286;
  return { type, lane, x, y, speed, color, seed: Math.random() * 10 };
}

export function drawTrafficCar(ctx: CanvasRenderingContext2D, car: TrafficCar, t: number) {
  void t;
  const isNorth = car.lane === 'north';
  // Vehicles are 2X bigger for bold, satisfying visual scale!
  const W = (car.type === 'scooter' ? 32 : car.type === 'truck' ? 62 : 54) * 2;
  const L = (car.type === 'scooter' ? 52 : car.type === 'truck' ? 108 : 82) * 2;

  ctx.save();
  ctx.translate(car.x, car.y);

  // Ground shadow
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#1c202a';
  ctx.beginPath(); ctx.ellipse(0, 0, W * 0.55, L * 0.52, 0, 0, PI2); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.rotate(isNorth ? 0 : PI);

  // Headlight beams
  const hBeam = (hx: number) => {
    const bg = ctx.createRadialGradient(hx, -L / 2, 4, hx, -L / 2 - 50, 55);
    bg.addColorStop(0, 'rgba(255,250,180,.38)');
    bg.addColorStop(1, 'rgba(255,245,160,0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(hx - 5, -L / 2); ctx.lineTo(hx - 22, -L / 2 - 60); ctx.lineTo(hx + 22, -L / 2 - 60); ctx.lineTo(hx + 5, -L / 2);
    ctx.closePath(); ctx.fill();
  };
  hBeam(-W / 2 + 10);
  hBeam(W / 2 - 10);

  // Wheels
  for (const wx of [-W / 2 - 2, W / 2 + 2]) {
    for (const wy of [-L / 2 + 18, L / 2 - 18]) {
      ctx.beginPath(); ctx.roundRect(wx - 2.5, wy - 9, 5, 18, 2.5);
      ctx.fillStyle = '#222530'; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = OUT; ctx.stroke();
    }
  }

  // Car Body
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.roundRect(-W / 2, -L / 2, W, L, car.type === 'scooter' ? 14 : 12);
  ctx.fillStyle = car.color; ctx.fill();
  ctx.lineWidth = 2.8; ctx.strokeStyle = OUT; ctx.stroke();

  // Windshield & Cabin
  if (car.type === 'convertible') {
    // Open top with cat driver wearing sunglasses!
    ctx.beginPath(); ctx.roundRect(-W / 2 + 6, -L / 2 + 22, W - 12, 38, 6);
    ctx.fillStyle = '#24202e'; ctx.fill();
    // Windshield
    ctx.beginPath(); ctx.roundRect(-W / 2 + 6, -L / 2 + 12, W - 12, 10, 3);
    ctx.fillStyle = '#c5f2ff'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = OUT; ctx.stroke();
    // Leather headrests & steering wheel
    ell(ctx, -12, -L / 2 + 42, 10, 8, '#8a4a28', OUT, 2);
    ell(ctx, 12, -L / 2 + 42, 10, 8, '#8a4a28', OUT, 2);
    ctx.beginPath(); ctx.arc(-12, -L / 2 + 30, 8, 0, PI2);
    ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.stroke();
  } else if (car.type === 'scooter') {
    // Cute Vespa with cat rider
    ctx.beginPath(); ctx.roundRect(-W / 2 + 4, -L / 2 + 12, W - 8, 22, 5);
    ctx.fillStyle = '#f8f4ea'; ctx.fill();
    // Chrome handlebars & mirrors
    ctx.strokeStyle = '#c5d2e0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-W / 2 + 6, -L / 2 + 20); ctx.lineTo(W / 2 - 6, -L / 2 + 20); ctx.stroke();
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-W / 2 + 6, -L / 2 + 20); ctx.lineTo(W / 2 - 6, -L / 2 + 20); ctx.stroke();
    // Leather seat
    ctx.beginPath(); ctx.roundRect(-10, -6, 20, 28, 7);
    ctx.fillStyle = '#6a3c1a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
  } else if (car.type === 'truck') {
    // Mini pickup carrying surfboards or fruit
    ctx.beginPath(); ctx.roundRect(-W / 2 + 6, -L / 2 + 8, W - 12, 28, 6);
    ctx.fillStyle = '#c5f2ff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
    // Truck bed with colorful surfboard!
    ctx.beginPath(); ctx.roundRect(-W / 2 + 5, -L / 2 + 42, W - 10, L - 48, 4);
    ctx.fillStyle = '#e0a866'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
    // Surfboard lying in truck bed
    ctx.save();
    ctx.translate(0, 16); ctx.rotate(0.1);
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 24, 0, 0, PI2);
    ctx.fillStyle = '#ffd23f'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = '#d63447'; ctx.stroke();
    ctx.restore();
  } else {
    // Beetle roof & glass
    ctx.beginPath(); ctx.roundRect(-W / 2 + 6, -L / 2 + 16, W - 12, L - 32, 8);
    ctx.fillStyle = '#fffdf3'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
    // Front and rear glass
    ctx.beginPath(); ctx.roundRect(-W / 2 + 8, -L / 2 + 18, W - 16, 12, 3);
    ctx.fillStyle = '#c5f2ff'; ctx.fill();
    ctx.beginPath(); ctx.roundRect(-W / 2 + 8, L / 2 - 30, W - 16, 10, 3);
    ctx.fillStyle = '#c5f2ff'; ctx.fill();
  }

  // Headlights & Taillights
  for (const hs of [-1, 1]) {
    // Front light
    ctx.beginPath(); ctx.arc(hs * (W / 2 - 8), -L / 2 + 3, 4, 0, PI2);
    ctx.fillStyle = '#fff6bd'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = OUT; ctx.stroke();
    // Rear red light
    ctx.beginPath(); ctx.roundRect(hs * (W / 2 - 9) - 3, L / 2 - 5, 6, 4, 1.5);
    ctx.fillStyle = '#ff3b30'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke();
  }

  ctx.restore();
}
