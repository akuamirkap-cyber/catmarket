import {
  CASHIER_PAL, CHEF_PAL, VENDOR_PAL, CUSTOMER_PALS, CAT_CFG, Cat, type CatCfg, type HatId, type SkinId, catLayout, DEFAULT_CFG, setCatCfg, makePlayerPal, clamp, drawCat, drawCatCached, hopCat, makeCat, postUpdate, updateCat,
} from './cat';
import { HELPER_PALS, FISHER_PAL, catHandPos, type Pal } from './cat';
import {
  FISH_S, FISH_VALUE, SUSHI_VALUE, drawBill, drawCoin, drawFish, drawItem, drawRice, drawSushi, isMaki, randomFishType,
} from './fish';
import { CANOPY_Y, MANGO_FR, PALM_CROWN, PALM_NUT, nutR, drawCoconut, drawCoral, drawCrab, drawGull, drawMangoTree, drawPalm, drawRock, star4 } from './scenery';
import { Layer, setSpriteRes, sprite } from './sprites';
import type { View } from './sprites';
import { sfx } from './audio';
import { drawCanopyDown, drawChest, drawParachute } from './treasure';
import {
  COOK, COOK_POT, COOK_ZONE, CRABQ, FARM_BOX, FARM_PLOTS, ICE, ICEQ, PEN, PEN_ZONE, VENDOR_POS, bubbleShell, crabSlot, drawBag, drawCone,
  CRAB_S, drawCookerDyn, drawCrabSprite, drawEmoji, drawFarmBed, drawFarmPlants, drawPenBack, drawPenCrab, drawPenFront, drawRegister,
  drawSeaweedItem, paintCooker, paintIceStall,
} from './extras';
import type { Mood, PenCrab } from './extras';
import { SLOTS, ZONE_DEFS, ZY, STALL_CATALOG, drawCustomSlot } from './zones';
import {
  makeVolleyballGame, updateVolleyball, drawVolleyballCourt, type VolleyballGame,
  drawSandPlayCat, drawSurfingCat, drawSunbathingCat, drawKiteFlyingCat,
  makePlaygroundCats, updatePlaygroundCats, drawPlaygroundCatItem, type PlaygroundCat,
} from './playground';
import { drawSignCached } from './signs';
import {
  APPLE_POS, ASSIST_HOME, ASSIST_ZONE, BLENDER, BOAT_DOCK, BOAT_ZONE, JUICE, JUICE_ZONE, JUICEQ, ORANGE_POS, WAGON_H,
  cupSlot, drawBlenderDyn, drawBoat, drawCup, drawFruit, drawFruitTree, drawWagon, paintJuiceStall,
} from './extras2';
import {
  BUS_DOOR, BUS_POS, BUS_STOP, ROAD_X, drawBusStop, drawCatBus, drawTrafficCar, makeTrafficCar, type TrafficCar,
} from './road';
import {
  BC, BOARD, CASHIER_POS, CASHQ, CHEF_POS, COUNTER, DISP, HIRE_ZONE, LOOK_SEA, MANGO, MANGOQ, MANGO_ZONE, MAX_Y, MINX, MIN_Y,
  MONEY_ZONE, PI2, POND, POND_ZONE, REG_ZONE, SPOTS, STACK, STALLQ, SUSHI, SUSHIQ, SUSHI_ZONE, TABLE, TABLE_ZONE, TRAY,
  TREES_POS, WORLD_H, WORLD_W, billPos, drawPierRipples, drawSea, easeBack, easeOut, inside, lerp, makeSeaGradient, paintCounter,
  paintMango, paintPier, paintGround, paintSushi, paintTable, rr, shoreX, walkable,
  fishIcon, ZONE_BANNERS, paintZoneBanner,
} from './world';
import type { Pt, Rect, Ripple, Swimmer } from './world';

const KEY = 'cat-fish-market-v2';
const ASSIST_COST = [140, 260, 420];
const HELPER_SPEED = 135;
const zc = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const WALK = 205;       // kecepatan normal (dulu ini kecepatan Shift)
const RUN = WALK * 2;   // Shift / joystick penuh: 2x kecepatan normal
const SPD_CAP = 700;    // pengaman atas saja: upgrade + skateboard + sprint tetap muat
const MS = 0.8; // cat draw scale
const ZOOM = 0.7; // camera zoomed out by 30%

type Kind = 'fish' | 'sushi' | 'mango' | 'crab' | 'ice' | 'juice';
type Variant = 'normal' | 'fat' | 'rich' | 'kid' | 'kitten';
interface PenC extends PenCrab { tx: number; ty: number; pause: number; feedPend: number }
interface Treasure {
  state: 'fall' | 'landed' | 'open'; x: number; y: number; tx: number; ty: number; t: number; land: number; open: number;
  life: number; ph: number; burst: boolean; sparkT: number;
}
const TREASURE_SPOTS: Pt[] = [{ x: 560, y: 450 }, { x: 1160, y: 480 }, { x: 820, y: 760 }, { x: 1400, y: 770 }, { x: 1500, y: 650 }];
interface Tree { x: number; y: number; fruit: number[]; pop: number[] }
interface JTree extends Tree { kind: 'orange' | 'apple' }
interface Helper {
  m: Cat; id: number; mode: 'think' | 'walk' | 'work' | 'fish'; way: Pt[]; work: (() => boolean | 'fish') | null; wt: number; wdt: number; rt: number; pend: number;
  face: Pt | null; icon: string; claim: string; stuck: number;
  fT: number; fWait: number; spot: number; tgt: Pt; bob: boolean; hooked: boolean; cast: boolean; bit: boolean;
}
interface Flyer {
  kind: 'item' | 'sushi' | 'bill' | 'coin' | 'cone' | 'cup'; ft: number; sx: number; sy: number; to: () => Pt; t: number; dur: number; h: number;
  spin: number; sc: number; done: () => void;
}
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; kind: 'dust' | 'grain' | 'streak' | 'drop' | 'bub' | 'spark' | 'steam'; ang: number; col?: string }
interface FText { x: number; y: number; t: number; text: string; color: string; big?: boolean }
interface Print { x: number; y: number; ang: number; t: number; life: number; a: number }
interface Gull { x: number; y: number; dir: number; sp: number; ph: number; delay: number }
type CState = 'q1' | 'q2' | 'pay' | 'leave';
interface Customer {
  m: Cat; kind: Kind; variant: Variant; mul: number; state: CState; want: number; taken: number[]; pending: number; timer: number; speed: number;
  way: Pt[]; arrived: boolean; waitT: number; drool: boolean; happyT: number; bubT: number; uid: number; wag?: Pt;
}
type ChefPhase = 'idle' | 'fetch' | 'chop' | 'form' | 'cheer';
type UnlId = 'spot2' | 'spot3' | 'sushi' | 'orchard' | 'cashier' | 'crab' | 'ice' | 'juice' | 'assist' | 'boat';
interface Unl { id: UnlId; cost: number; paid: number; done: boolean; bt: number; zone: Rect; label: string; icon: string; act: number }

export interface MissionInfo { text: string; prog: number; goal: number; reward: number; done: boolean }
export interface UpInfo { id: string; name: string; icon: string; lvl: number; max: number; cost: number; desc: string }
export interface Status {
  mode: 'IDLE' | 'WALK' | 'RUN';
  speed: number; carry: number; max: number; skid: boolean; fishing: boolean;
  pond: number; pondCap: number; table: number; tableCap: number;
  tray: number; trayCap: number; sushi: number; sushiCap: number; mango: number; mangoCap: number;
  crabOn: boolean; iceOn: boolean; crab: number; crabCap: number; rawIn: number;
  juiceOn: boolean; juice: number; juiceCap: number; assist: number; boatOn: boolean; level: number;
  money: number; sushiOn: boolean; orchardOn: boolean; cashierOn: boolean;
  skin: SkinId; hat: HatId; skatesOwned: boolean; skatesOn: boolean; boardOwned: boolean; boardOn: boolean; treasure: boolean; cat: CatCfg;
  zone2Stalls: string[];
  mission: MissionInfo; ups: UpInfo[];
}

interface Stats { caught: number; fishSold: number; sushiSold: number; mangoSold: number; earned: number; crabSold: number; iceSold: number; juiceSold: number }
interface MDef { text: string; goal: number; reward: number; up?: number; get: (g: Game) => number }
const MISSIONS: MDef[] = [
  // LEVEL 1: Tutorial Dasar Mancing
  { text: 'Langkah 1: Berdiri di kotak 🎣 dermaga, tangkap 2 ikan', goal: 2, reward: 30, get: (g) => g.stats.caught },
  // LEVEL 2: Mengisi Lapak Ikan
  { text: 'Langkah 2: Ambil ikan dari kolam 🪣, taruh di Meja Es', goal: 4, reward: 40, get: (g) => g.stats.caught },
  // LEVEL 3: Melayani Pembeli
  { text: 'Langkah 3: Layani pembeli di Meja Es & Kasir', goal: 3, reward: 50, get: (g) => g.stats.fishSold },
  // LEVEL 4: Mengambil Hasil Penjualan
  { text: 'Langkah 4: Berdiri di kotak hijau AMBIL UANG kasir', goal: 100, reward: 50, get: (g) => g.stats.earned },
  // LEVEL 5: Membuka Spot Mancing ke-2
  { text: 'Langkah 5: Berdiri di kotak $40 untuk buka Spot Mancing 2', goal: 1, reward: 60, get: (g) => (g.isDone('spot2') ? 1 : 0) },
  // LEVEL 6: Membuka Spot Mancing ke-3
  { text: 'Langkah 6: Buka Spot Mancing 3 ($70)', goal: 1, reward: 70, get: (g) => (g.isDone('spot3') ? 1 : 0) },
  // LEVEL 7: Membuka Bar Sushi
  { text: 'Langkah 7: Buka Bar Sushi 🍣 ($80)', goal: 1, reward: 80, get: (g) => (g.isDone('sushi') ? 1 : 0) },
  // LEVEL 8: Olah Ikan Jadi Sushi
  { text: 'Langkah 8: Bawa ikan ke nampan sushi, koki akan memotong', goal: 4, reward: 90, get: (g) => g.stats.sushiSold },
  // LEVEL 9: Jual Sushi Lezat
  { text: 'Langkah 9: Jual 8 sushi ke pembeli bertroli & berkantong', goal: 8, reward: 110, get: (g) => g.stats.sushiSold },
  // LEVEL 10: Membuka Kios Mangga
  { text: 'Langkah 10: Buka Kios & Kebun Mangga 🥭 ($140)', goal: 1, reward: 120, get: (g) => (g.isDone('orchard') ? 1 : 0) },
  // LEVEL 11: Panen Mangga Manis
  { text: 'Langkah 11: Petik mangga matang di bawah & bawa ke kios', goal: 6, reward: 130, get: (g) => g.stats.mangoSold },
  // LEVEL 12: Sewa Kasir Otomatis
  { text: 'Langkah 12: Sewa Kucing Kasir 🐱 ($120) agar bayar otomatis', goal: 1, reward: 150, get: (g) => (g.isDone('cashier') ? 1 : 0) },
  // LEVEL 13: Buka Budidaya Kepiting
  { text: 'Langkah 13: Buka Rantai Kepiting 🦀 ($220)', goal: 1, reward: 180, get: (g) => (g.isDone('crab') ? 1 : 0) },
  // LEVEL 14: Tanam & Panen Rumput Laut
  { text: 'Langkah 14: Masuk ke air dangkal, tanam rumput laut di ladang', goal: 3, reward: 190, get: (g) => (g.isDone('crab') ? 3 : 0) },
  // LEVEL 15: Beri Makan & Masak Kepiting
  { text: 'Langkah 15: Beri makan kepiting kolam, masak di mesin merah', goal: 3, reward: 220, get: (g) => g.stats.crabSold },
  // LEVEL 16: Sewakan Gerobak Es Krim
  { text: 'Langkah 16: Sewakan Gerobak Es Krim 🍦 ($150) untuk bonus!', goal: 1, reward: 220, get: (g) => (g.isDone('ice') ? 1 : 0) },
  // LEVEL 17: Buka Bar Jus Buah
  { text: 'Langkah 17: Buka Bar Jus Buah 🧃 ($200)', goal: 1, reward: 250, get: (g) => (g.isDone('juice') ? 1 : 0) },
  // LEVEL 18: Petik Jeruk & Apel Jadi Jus
  { text: 'Langkah 18: Petik jeruk/apel di pohon bawah, masukkan blender', goal: 6, reward: 280, get: (g) => g.stats.juiceSold },
  // LEVEL 19: Rekrut Asisten Kucing
  { text: 'Langkah 19: Rekrut Asisten Kucing 😸 di samping dermaga', goal: 1, reward: 300, get: (g) => (g.assistN >= 1 ? 1 : 0) },
  // LEVEL 20: Sewa Kapal Nelayan Pulau
  { text: 'Langkah 20: Sewa Kapal Nelayan ⛵ di dermaga barat ($240)', goal: 1, reward: 500, get: (g) => (g.isDone('boat') ? 1 : 0) },
];

const UPS = [
  { id: 'cap', name: 'Keranjang Besar', icon: '🧺', costs: [60, 130, 240, 400], desc: (l: number) => `Bawa ${6 + 2 * (l + 1)} item` },
  { id: 'spd', name: 'Sepatu Kilat', icon: '👟', costs: [50, 110, 200, 340], desc: (l: number) => `Lari +${7 * (l + 1)}%` },
  { id: 'fish', name: 'Joran Super', icon: '🎣', costs: [70, 140, 240, 380, 560], desc: (l: number) => `Ikan menggigit ${16 * (l + 1)}% lebih cepat` },
  { id: 'pond', name: 'Kolam Besar', icon: '🪣', costs: [70, 130, 210, 320, 480], desc: (l: number) => `Kolam muat ${8 + 2 * (l + 1)} ikan (maks 18)` },
  { id: 'price', name: 'Harga Premium', icon: '💰', costs: [90, 180, 300, 500], desc: (l: number) => `Harga jual +${12 * (l + 1)}%` },
];

function newSwimmer(): Swimmer {
  return {
    x: rr(MINX + 60, 40), y: rr(215, 1700), dir: Math.random() < 0.5 ? -1 : 1, face: 1, speed: rr(26, 50), vy: 0, ty: rr(215, 1700),
    t: rr(1, 4), ph: rr(0, 6), type: randomFishType(), hunt: false, gone: false, resp: 0, bubT: rr(1, 4), nib: 0, pitch: 0,
    depth: rr(0.05, 1), dT: rr(0.05, 1),
  };
}

export class Game {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private W = 0;
  private H = 0;
  private dprMax = 1;
  private rs = 1; // adaptive render-scale
  private npcTtl = 2; // how many frames a background-cat/scene bitmap is reused (adaptive)
  private hq = true; // adaptive effects quality
  private scale = 1;
  private cam = { x: 700, y: 460 };
  private time = 0;
  private V: View = { x0: 0, y0: 0, x1: 1, y1: 1 };
  private ema = 16.7;
  private cpuEma = 4;
  private perfT = 0;
  private coolT = 4;
  private fpsT = 0;
  private seaGrad: CanvasGradient | null = null;
  private bloomCv: HTMLCanvasElement | null = null;
  private bloomCtx: CanvasRenderingContext2D | null = null;
  private bloomMask: HTMLCanvasElement | null = null;
  private bloomMaskCtx: CanvasRenderingContext2D | null = null;
  private layers = {
    pier: new Layer(-70, 240, 590, 350),
    table: new Layer(640, 190, 300, 200),
    counter: new Layer(1290, 310, 330, 380),
    sushi: new Layer(960, 80, 380, 300),
    mango: new Layer(490, 400, 270, 220),
    ice: new Layer(1560, 110, 200, 260),
    cook: new Layer(1320, 100, 280, 270),
    juice: new Layer(990, 410, 260, 240),
  };
  private lres = 1;
  private dirty = new Set<string>(['pier', 'table', 'counter', 'sushi', 'mango', 'juice']);

  private keys = new Set<string>();
  private joy = { active: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 };
  runLatch = false;
  private shiftDown = false;
  private runInput = false; // true saat frame ini benar-benar berlari (untuk HUD)

  private player: Cat;
  private chefCat: Cat;
  private cashier: Cat | null = null;
  private ch = { phase: 'idle' as ChefPhase, t: 0, fish: 0, kind: 0, onBoard: false, cuts: 0, cutT: [-1, -1, -1] as number[], bounce: 0, ev: 0 };
  private customers: Customer[] = [];
  private qs: Record<Kind, Customer[]> = { fish: [], sushi: [], mango: [], crab: [], ice: [], juice: [] };
  private cashQ: Customer[] = [];
  private pond: { type: number; a: number; sp: number; rr: number; ph: number; face: number }[] = [];
  private pondPending = 0;
  private table: number[] = [];
  private tablePending = 0;
  private tablePop = 0;
  private tablePopIdx = -1;
  private sushiIn: number[] = [];
  private trayPending = 0;
  private sushiDisp: number[] = [];
  private dispPending = 0;
  private dispPop = 0;
  private dispPopIdx = -1;
  private mangoStock: number[] = [];
  private mangoPending = 0;
  private mangoPop = 0;
  private mangoPopIdx = -1;
  private trees: Tree[] = TREES_POS.map((p) => ({ x: p.x, y: p.y, fruit: [0.3, 0.7, 0.1], pop: [0, 0, 0] }));
  private sils: Swimmer[] = [];
  private flyers: Flyer[] = [];
  private renderItems: { y: number; draw: () => void }[] = [];
  private parts: Particle[] = [];
  private ripples: Ripple[] = [];
  private texts: FText[] = [];
  private prints: Print[] = [];
  private gulls: Gull[] = [];
  private palms = ([[560, 175, 1], [1345, 185, 1.2], [1700, 195, 1.1], [470, 190, 0.9]] as [number, number, number][]).map(([x, y, sc], i) => ({
    x, y, s: sc,
    nuts: [0, 1, 2].map((k) => ({
      g: i === 0 && k === 0 ? 1 : rr(0.2, 0.9), rate: 1 / rr(50, 80), ripeT: i === 0 && k === 0 ? 4 : rr(6, 22), shake: 0,
    })),
  }));
  private cocos: { x: number; y: number; z: number; vz: number; vx: number; fall: boolean; bounces: number; rest: number; spin: number; vs: number; r: number }[] = [];
  private crab = { x: 430, y: 650, dir: 1, pause: 1, mv: 0, t: 0 };

  // money
  private stack: number[] = [];
  private stackSum = 0;
  private stackPending = 0;
  private landT = 9;
  private money = 0;
  private combo = { n: 0, t: 9, amt: 0, pop: 0 };
  private payN = 0;
  private payT = 9;
  private payCd = 0;
  stats: Stats = { caught: 0, fishSold: 0, sushiSold: 0, mangoSold: 0, earned: 0, crabSold: 0, iceSold: 0, juiceSold: 0 };
  private mIdx = 0;
  private mT = 0;
  private upLvl: Record<string, number> = { cap: 0, spd: 0, fish: 0, price: 0, pond: 0 };
  private speedMul = 1;
  private saveT = 5;
  private unls: Unl[] = [
    { id: 'spot2', cost: 40, paid: 0, done: false, bt: 9, zone: { x: SPOTS[1].x - 30, y: SPOTS[1].y - 22, w: 60, h: 44 }, label: 'Spot 2', icon: '🎣', act: 0 },
    { id: 'spot3', cost: 70, paid: 0, done: false, bt: 9, zone: { x: SPOTS[2].x - 30, y: SPOTS[2].y - 22, w: 60, h: 44 }, label: 'Spot 3', icon: '🎣', act: 0 },
    { id: 'sushi', cost: 80, paid: 0, done: false, bt: 9, zone: { x: SUSHI_ZONE.x + 10, y: SUSHI_ZONE.y + 8, w: SUSHI_ZONE.w - 20, h: 64 }, label: 'BAR SUSHI', icon: '🍣', act: 0 },
    { id: 'orchard', cost: 140, paid: 0, done: false, bt: 9, zone: { x: MANGO_ZONE.x + 20, y: MANGO_ZONE.y + 2, w: MANGO_ZONE.w - 40, h: 50 }, label: 'KEBUN MANGGA', icon: '🥭', act: 0 },
    { id: 'cashier', cost: 120, paid: 0, done: false, bt: 9, zone: HIRE_ZONE, label: 'SEWA KASIR', icon: '😸', act: 0 },
    { id: 'crab', cost: 220, paid: 0, done: false, bt: 9, zone: COOK_ZONE, label: 'KEPITING', icon: '🦀', act: 0 },
    { id: 'ice', cost: 150, paid: 0, done: false, bt: 9, zone: { x: ICE.x + 5, y: 352, w: 140, h: 64 }, label: 'SEWA ES KRIM', icon: '🍦', act: 0 },
    { id: 'juice', cost: 200, paid: 0, done: false, bt: 9, zone: JUICE_ZONE, label: 'BAR JUS', icon: '🧃', act: 0 },
    { id: 'assist', cost: ASSIST_COST[0], paid: 0, done: false, bt: 9, zone: ASSIST_ZONE, label: 'ASISTEN 1/3', icon: '😸', act: 0 },
    { id: 'boat', cost: 240, paid: 0, done: false, bt: 9, zone: BOAT_ZONE, label: 'KAPAL IKAN', icon: '⛵', act: 0 },
  ];

  private spawnT = 1.2;
  private pickCd = 0;
  private dropCd = 0;
  private collectCd = 0;
  private textCd = 0;
  private streakT = 0;
  private skidT = 0;
  private statusT = 0;
  private statusKey = '';
  private rippleT = 0;
  private sparkT = 0;
  private pads = { table: 0, sushi: 0, mango: 0, reg: 0, money: 0, pen: 0, cook: 0, juice: 0 };
  private pondShake = 0;
  private pendingCarry = 0;
  // ---- crab chain + ice-cream rental
  private vendor: Cat | null = null;
  private plots = FARM_PLOTS.map(() => ({ state: 'empty' as 'empty' | 'grow' | 'ripe', g: 0, cd: 0, pop: 0 }));
  private pen: PenC[] = [0, 1, 2].map((i) => ({
    x: PEN.x + 24 + i * 28, y: PEN.y + 40 + (i % 2) * 20, dir: i % 2 ? -1 : 1, g: [0.2, 0.45, 0.75][i], hop: 0, eat: 0, t: i * 2, grow: 0,
    tx: PEN.x + 50, ty: PEN.y + 50, pause: 0.4 + i * 0.5, feedPend: 0,
  }));
  private cookIn = 0;
  private cookPending = 0;
  private cooking = false;
  private cookT = 0;
  private crabStock: number[] = [];
  private crabPending = 0;
  private iceStock: number[] = [];
  private wadeT = 0;
  private steamT = 0;
  private warmT = 0;
  assistN = 0;
  level = 1;
  zone2Stalls: string[] = ['kelapa', 'cangkang', 'udang', 'lobster', 'serut', 'mutiara'];
  private volleyball: VolleyballGame = makeVolleyballGame(2260, ZY + 450);
  private playgroundCats: PlaygroundCat[] = makePlaygroundCats();
  private slotPromptCd = 0;
  onSelectSlot: (slotIdx: number, curStall: string) => void = () => {};
  private tiles = new Map<string, HTMLCanvasElement>();
  private gateA: Record<number, number> = { 2: 1, 3: 1, 4: 1 };
  private decoPalms: { x: number; y: number; s: number }[] = (() => {
    const out: { x: number; y: number; s: number }[] = [];
    const cols = [[1880, 2310, 2740, 3100], [470, 880, 1290, 1650], [1880, 2310, 2740, 3100]];
    [2, 3, 4].forEach((z, i) => {
      const oy = z === 2 ? 0 : ZY;
      cols[i].forEach((x, k) => { out.push({ x, y: oy + 214 + (k % 2) * 8, s: 1 + (k % 3) * 0.08 }); out.push({ x: x + 60, y: oy + 772 - (k % 2) * 10, s: 0.95 }); });
    });
    return out;
  })();

  // Lively beach highway traffic driving along the road lanes (up & down)
  private trafficCars: TrafficCar[] = [
    makeTrafficCar('north', 150),
    makeTrafficCar('north', 580),
    makeTrafficCar('north', 1050),
    makeTrafficCar('north', 1520),
    makeTrafficCar('south', 120),
    makeTrafficCar('south', 480),
    makeTrafficCar('south', 920),
    makeTrafficCar('south', 1380),
    makeTrafficCar('south', 1740),
  ];
  private helpers: Helper[] = [];
  private juiceTrees: JTree[] = [
    ...ORANGE_POS.map((q) => ({ x: q.x, y: q.y, kind: 'orange' as const, fruit: [0.3, 0.7, 0.1], pop: [0, 0, 0] })),
    ...APPLE_POS.map((q) => ({ x: q.x, y: q.y, kind: 'apple' as const, fruit: [0.5, 0.2, 0.8], pop: [0, 0, 0] })),
  ];
  private juiceIn: number[] = [];
  private juicePending = 0;
  private blending = false;
  private blendT = 0;
  private blendType = 8;
  private juiceStock: number[] = [];
  private juiceCupPending = 0;
  private boat = { state: 'dock' as 'dock' | 'out' | 'far' | 'back', x: BOAT_DOCK.x, t: 0, load: 0, tossT: 0, wait: 5 };
  private fisher: Cat | null = null;
  private uidN = 0;
  private frameN = 0;
  private skin: SkinId = 'tabby';
  private hat: HatId = 'bucket';
  private skatesOwned = false;
  private skatesOn = false;
  private boardOwned = false;
  private boardOn = false;
  private skateT = 0;
  private treasure: Treasure | null = null;
  private treasureT = 14;
  private treasureCd = 0;
  private treasureAsk = false;

  // fishing state machine
  private fPhase: 'idle' | 'cast' | 'wait' | 'bite' | 'reel' = 'idle';
  private fT = 0;
  private fSpot = -1;
  private fCd = 0;
  private fTarget: Pt = { x: 0, y: 0 };
  private fSil: Swimmer | null = null;
  private fType = 0;
  private fFlyer: Flyer | null = null;
  private fLaunched = false;
  private fFlySet = false;
  private fLand = 0;
  private bobOn = false;
  private bobFly = false;
  private bobT = 0;
  private bobStart: Pt = { x: 0, y: 0 };
  private bob: Pt = { x: 0, y: 0 };
  private fRipT = 0;

  onMoney: (n: number) => void = () => {};
  onStatus: (s: Status) => void = () => {};
  onFps: (fps: number, quality: string) => void = () => {};
  onToast: (msg: string) => void = () => {};
  onTreasure: () => void = () => {};
  paused = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    // Phones & small screens start in the lighter quality tier right away: waiting for the
    // adaptive monitor to react would mean several laggy seconds after every load.
    const small = typeof window !== 'undefined' && (
      window.innerWidth < 900 ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches)
    );
    if (small) { this.rs = 0.8; this.hq = false; }
    this.player = makeCat(720, 470, makePlayerPal('tabby', 'bucket'));
    this.chefCat = makeCat(CHEF_POS.x, CHEF_POS.y, CHEF_PAL);
    this.chefCat.chef.on = true;
    this.chefCat.look = { x: 0, y: 1 };
    this.load();
    this.applyUps();
    this.applyCosmetics();
    for (let i = 0; i < 28; i++) this.sils.push(newSwimmer());
    for (let i = 0; i < 3; i++) {
      this.gulls.push({ x: MINX - 100, y: rr(220, 1700), dir: 1, sp: rr(70, 110), ph: rr(0, 6), delay: 1 + i * 5 + rr(0, 4) });
    }
    this.resize();
    this.bind();
    this.last = performance.now();
    const loop = (now: number) => {
      const raw = now - this.last;
      this.last = now;
      // Ultra-smooth frame pacing clamped between 1ms and 33ms (30-120+ FPS)
      const dt = clamp(raw / 1000, 0.001, 0.033);
      const t0 = performance.now();
      this.update(dt);
      this.render();
      const cpu = performance.now() - t0;
      this.ema += (Math.min(raw, 50) - this.ema) * 0.05;
      this.cpuEma += (cpu - this.cpuEma) * 0.08;
      this.perfT += dt;
      this.coolT -= dt;
      this.fpsT += dt;
      if (this.perfT > 1.5) { this.perfT = 0; this.adapt(); }
      if (this.fpsT > 1.0) { this.fpsT = 0; this.onFps(Math.round(1000 / Math.max(1, this.ema)), (this.hq ? 'HQ' : 'LQ') + ' ' + Math.round(this.rs * 100) + '%'); }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  // ------------------------------------------------ persistence / progress
  isDone(id: UnlId) { return this.unls.find((u) => u.id === id)!.done; }

  private load() {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
      if (!raw) return;
      const d = JSON.parse(raw);
      this.money = d.money | 0;
      this.mIdx = d.mi | 0;
      this.level = Math.min(20, this.mIdx + 1);
      Object.assign(this.stats, d.stats || {});
      Object.assign(this.upLvl, d.ups || {});
      if (d.skin === 'tabby' || d.skin === 'calico') this.skin = d.skin;
      if (d.hat === 'bucket' || d.hat === 'cap' || d.hat === 'none') this.hat = d.hat;
      if (d.cfg && d.cfgV === 6) setCatCfg(d.cfg);
      if (Array.isArray(d.sk)) { this.skatesOwned = !!d.sk[0]; this.skatesOn = !!d.sk[1]; }
      if (Array.isArray(d.bd)) { this.boardOwned = !!d.bd[0]; this.boardOn = !!d.bd[1]; }
      if (this.skatesOn && this.boardOn) this.boardOn = false;
      for (const [id, paid, done] of d.unl || []) {
        const u = this.unls.find((q) => q.id === id);
        if (u) { u.paid = paid; u.done = !!done; u.bt = 9; if (u.done) this.onBuilt(u, true); }
      }
      if (typeof d.ast === 'number') for (let i = 0; i < d.ast; i++) this.hireAssistant(false);
      if (Array.isArray(d.z2s)) this.zone2Stalls = d.z2s;
    } catch { /* ignore */ }
  }

  private save() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(KEY, JSON.stringify({
        money: this.money, mi: this.mIdx, stats: this.stats, ups: this.upLvl, unl: this.unls.map((u) => [u.id, u.paid, u.done]), ast: this.assistN, lvl: this.level,
        skin: this.skin, hat: this.hat, sk: [this.skatesOwned, this.skatesOn], bd: [this.boardOwned, this.boardOn], z2s: this.zone2Stalls, cfg: CAT_CFG, cfgV: 6,
      }));
    } catch { /* ignore */ }
  }

  resetSave() {
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY); } catch { /* ignore */ }
    location.reload();
  }

  private applyUps() {
    this.player.maxCarry = 6 + 2 * this.upLvl.cap;
    this.speedMul = 1 + 0.07 * this.upLvl.spd;
  }

  buy(id: string): boolean {
    const d = UPS.find((u) => u.id === id);
    if (!d) return false;
    const lvl = this.upLvl[id];
    if (lvl >= d.costs.length) return false;
    const cost = d.costs[lvl];
    if (this.money < cost) return false;
    this.money -= cost;
    this.upLvl[id] = lvl + 1;
    this.applyUps();
    this.onMoney(this.money);
    sfx.fanfare();
    this.sparks(this.player.x, this.player.y - 40, 16, 70);
    this.player.happy = 1.4;
    hopCat(this.player, 170);
    this.pushStatus();
    this.save();
    return true;
  }

  private onBuilt(u: Unl, silent: boolean) {
    if (u.id === 'ice') { this.vendor = makeCat(VENDOR_POS.x, VENDOR_POS.y, VENDOR_PAL); this.dirty.add('ice'); }
    if (u.id === 'crab') this.dirty.add('cook');
    if (u.id === 'juice') this.dirty.add('juice');
    if (u.id === 'boat') { this.fisher = makeCat(BOAT_DOCK.x, BOAT_DOCK.y, FISHER_PAL); this.boat.state = 'dock'; this.boat.x = BOAT_DOCK.x; this.boat.wait = silent ? 4 : 2; }
    if (u.id === 'cashier') {
      this.cashier = makeCat(CASHIER_POS.x, CASHIER_POS.y, CASHIER_PAL);
      this.cashier.look = { x: 0, y: 1 };
    }
    if (u.id === 'orchard') this.trees.forEach((t) => { t.fruit = [rr(0.5, 1), rr(0.2, 0.8), rr(0, 0.5)]; });
    if (u.id === 'sushi') this.dirty.add('sushi');
    if (u.id === 'orchard') this.dirty.add('mango');
    if (!silent) this.dirty.add(u.id === 'sushi' ? 'sushi' : u.id === 'orchard' ? 'mango' : '');
  }

  private levelUp(n: number) {
    if (n <= this.level) return;
    this.level = n;
    const p = this.player;
    sfx.fanfare();
    this.sparks(p.x, p.y - 60, 44, 170);
    this.sparks(p.x, p.y - 100, 20, 110, ['#ffe45c', '#ffffff']);
    this.texts.push({ x: p.x, y: p.y - 150, t: 0, text: `LEVEL ${n}! 🎉`, color: '#ffe45c', big: true });
    this.onToast(`🎉 LEVEL ${n}! ${ZONE_DEFS[n - 1].name} terbuka`);
    p.happy = 1.8;
    hopCat(p, 200);
    this.pushStatus();
    this.save();
  }

  private completeUnlock(u: Unl) {
    if (u.id === 'assist') { this.hireAssistant(true); return; }
    u.done = true;
    u.bt = 0;
    this.onBuilt(u, false);
    const cx = u.zone.x + u.zone.w / 2, cy = u.zone.y + u.zone.h / 2;
    this.sparks(cx, cy, 26, 120);
    this.sparks(cx, cy - 30, 14, 80);
    sfx.fanfare();
    this.player.happy = 1.6;
    hopCat(this.player, 190);
    this.texts.push({ x: cx, y: cy - 30, t: 0, text: 'DIBUKA! ' + u.icon, color: '#ffe45c', big: true });
    this.onToast(`${u.icon} ${u.label} dibuka!`);
    this.statusKey = '';
    this.save();
  }

  private checkMission() {
    const m = MISSIONS[this.mIdx];
    if (!m || m.get(this) < m.goal) return;
    this.mIdx++;
    this.addMoney(m.reward, false);
    if (m.up) this.levelUp(m.up);
    const p = this.player;
    sfx.fanfare();
    this.sparks(p.x, p.y - 50, 24, 110);
    p.happy = 1.6;
    hopCat(p, 190);
    this.texts.push({ x: p.x, y: p.y - 150, t: 0, text: `MISI SELESAI! +$${m.reward}`, color: '#7dff9a', big: true });
    this.onToast(`✅ ${m.text} — hadiah $${m.reward}`);
    this.statusKey = '';
    this.save();
  }

  private addMoney(v: number, count = true) {
    this.money += v;
    if (count) this.stats.earned += v;
    this.onMoney(this.money);
  }

  // ------------------------------------------------ adaptive performance (ultra smooth)
  private adapt() {
    if (this.coolT > 0) return;
    if (this.ema > 24 || this.cpuEma > 13) {
      if (this.hq) { this.hq = false; this.coolT = 2.0; }
      else if (this.rs > 0.55) { this.rs = Math.max(0.55, this.rs - 0.1); this.coolT = 2.0; this.applySize(); }
      else if (this.npcTtl < 4) { this.npcTtl++; this.coolT = 2.0; }
    } else if (this.ema < 19 && this.cpuEma < 7) {
      if (this.npcTtl > 2 && this.cpuEma < 6) { this.npcTtl--; this.coolT = 4; }
      if (this.rs < 1) { this.rs = Math.min(1, this.rs + 0.1); this.coolT = 5; this.applySize(); }
      else if (!this.hq && this.cpuEma < 6) { this.hq = true; this.coolT = 6; }
    }
  }

  private applySize() {
    const eff = this.dprMax * this.rs;
    const w = Math.round(this.W * eff), h = Math.round(this.H * eff);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'low';
  }

  // ------------------------------------------------ input
  private onKeyDown = (e: KeyboardEvent) => {
    sfx.unlock(); sfx.startAmbience();
    const k = e.key.toLowerCase();
    if (e.shiftKey || k === 'shift') this.shiftDown = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (k === 'r' && !e.repeat) this.runLatch = !this.runLatch;
    if (k === ' ' && !e.repeat && !this.paused) this.unlockAll();
    if (k === 't' && !e.repeat && !this.paused && !this.treasure) this.spawnTreasure();
    this.keys.add(k);
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
    if (!e.shiftKey) this.shiftDown = false;
  };
  private onBlur = () => { this.keys.clear(); this.shiftDown = false; this.joy.active = false; };

  /** Lari: tombol Shift fisik, tombol R (latch), atau dorong joystick penuh di HP. */
  private sprinting() { return this.shiftDown || this.runLatch || this.keys.has('shift'); }
  private resizeTimer = 0;
  private onResize = () => {
    // Mobile browsers fire a burst of resize events while the address bar slides away;
    // re-allocating the canvas and rebuilding every cached layer on each one caused a
    // visible freeze, so settle first and resize once.
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => { this.resizeTimer = 0; this.resize(); }, 120) as unknown as number;
  };
  private onPD = (e: PointerEvent) => {
    sfx.unlock(); sfx.startAmbience();
    if (this.joy.active) return;
    this.canvas.setPointerCapture(e.pointerId);
    const r = this.canvas.getBoundingClientRect();
    this.joy = { active: true, id: e.pointerId, ox: e.clientX - r.left, oy: e.clientY - r.top, x: e.clientX - r.left, y: e.clientY - r.top };
  };
  private onPM = (e: PointerEvent) => {
    if (!this.joy.active || e.pointerId !== this.joy.id) return;
    const r = this.canvas.getBoundingClientRect();
    this.joy.x = e.clientX - r.left;
    this.joy.y = e.clientY - r.top;
  };
  private onPU = (e: PointerEvent) => {
    if (e.pointerId === this.joy.id) this.joy.active = false;
  };

  private bind() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('resize', this.onResize);
    this.canvas.addEventListener('pointerdown', this.onPD);
    this.canvas.addEventListener('pointermove', this.onPM);
    this.canvas.addEventListener('pointerup', this.onPU);
    this.canvas.addEventListener('pointercancel', this.onPU);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.save();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onResize);
    this.canvas.removeEventListener('pointerdown', this.onPD);
    this.canvas.removeEventListener('pointermove', this.onPM);
    this.canvas.removeEventListener('pointerup', this.onPU);
    this.canvas.removeEventListener('pointercancel', this.onPU);
  }

  private resize() {
    // 1.5x is plenty for this flat cartoon art: 1.75x burned ~35% more fill-rate for a
    // difference nobody can see on a phone, which was one of the main lag sources.
    this.dprMax = Math.min(1.5, window.devicePixelRatio || 1);
    this.W = this.canvas.clientWidth;
    this.H = this.canvas.clientHeight;
    this.scale = Math.max(this.W / 1000, this.H / 620, 0.8) * ZOOM;
    // hard pixel budget for huge desktop windows / 4K screens
    const budget = 2_600_000;
    const px = this.W * this.H * this.dprMax * this.dprMax;
    if (px > budget) this.dprMax = Math.max(0.75, this.dprMax * Math.sqrt(budget / px));
    this.applySize();
    const base = this.scale * this.dprMax;
    const res = clamp(Math.ceil(base * 4) / 4, 0.75, 1.5);
    const spriteChanged = setSpriteRes(base);
    if (res !== this.lres || spriteChanged) {
      this.lres = res;
      this.tiles.clear();
      for (const k of Object.keys(this.layers)) this.dirty.add(k);
    }
  }

  private readInput() {
    let dx = 0, dy = 0, spd = WALK;
    this.runInput = false;
    const k = this.keys;
    if (k.has('a') || k.has('arrowleft')) dx -= 1;
    if (k.has('d') || k.has('arrowright')) dx += 1;
    if (k.has('w') || k.has('arrowup')) dy -= 1;
    if (k.has('s') || k.has('arrowdown')) dy += 1;
    if (dx || dy) {
      const l = Math.hypot(dx, dy);
      dx /= l; dy /= l;
      this.runInput = this.sprinting();
      spd = this.runInput ? RUN : WALK;
    }
    if (this.joy.active) {
      const jx = this.joy.x - this.joy.ox, jy = this.joy.y - this.joy.oy;
      const l = Math.hypot(jx, jy);
      const mag = clamp(l / 60, 0, 1);
      if (l > 8) {
        dx = jx / l; dy = jy / l;
        // dorong setengah = jalan normal, dorong penuh = RUN; tombol Lari menjaga RUN walau dorongan kecil
        const base = mag < 0.6 ? WALK * (mag / 0.6) : WALK + (RUN - WALK) * ((mag - 0.6) / 0.4);
        spd = this.sprinting() ? Math.max(base, RUN * Math.min(1, mag * 1.4)) : base;
        if (spd > WALK * 1.02) this.runInput = true;
        spd = Math.max(spd, 40);
      }
    }
    return { dx, dy, spd: Math.min(SPD_CAP, spd * this.speedMul * this.rideMul()) };
  }

  // ------------------------------------------------ coconuts
  private updatePalms(dt: number, p: Cat) {
    for (const pm of this.palms) {
      pm.nuts.forEach((n, k) => {
        if (n.g < 1) { n.g = Math.min(1, n.g + dt * n.rate); n.shake = 0; return; }
        n.ripeT -= dt;
        n.shake = n.ripeT < 0.9 ? 1 - Math.max(0, n.ripeT) / 0.9 : 0; // the swing grows smoothly until it lets go
        if (n.ripeT <= 0) {
          if (this.cocos.length < 5) this.dropCoconut(pm, n, k);
          else { n.ripeT = 0.6; n.shake = 0; } // wait until the ground is clear again
        }
      });
    }
    for (let i = this.cocos.length - 1; i >= 0; i--) {
      const c = this.cocos[i];
      c.spin += c.vs * dt;
      if (c.fall) {
        c.vz -= 760 * dt;
        c.z += c.vz * dt;
        c.x += c.vx * dt;
        if (c.z <= 0) {
          c.z = 0;
          if (c.vz < -75 && c.bounces < 2) {
            c.vz = -c.vz * 0.42; c.vx *= 0.5; c.vs *= 0.6; c.bounces++;
            for (let k = 0; k < 3; k++) this.dust(c.x + rr(-5, 5), c.y - 1, 0.9);
            sfx.thud();
          } else { c.fall = false; c.vz = 0; c.vx = 0; c.vs = 0; c.rest = 0; }
        }
      } else c.rest += dt;
      const ready = !c.fall || c.bounces >= 1;
      if (ready && Math.hypot(p.x - c.x, p.y - c.y) < 30 + c.r) {
        this.cocos.splice(i, 1);
        const v = Math.round(6 * (1 + 0.12 * this.upLvl.price));
        this.sparks(c.x, c.y - 10, 7, 54, ['#ffe45c', '#ffffff', '#9bffaa']);
        sfx.coin();
        this.fly({
          kind: 'coin', sx: c.x, sy: c.y - 10, dur: 0.4, h: 40, spin: rr(-8, 8), to: () => ({ x: p.x, y: p.y - catLayout().chestY * MS }),
          done: () => { this.addMoney(v); this.texts.push({ x: p.x, y: p.y - catLayout().height * MS - 14, t: 0, text: '+$' + v + ' 🥥', color: '#ffe45c' }); },
        });
        continue;
      }
      if (c.rest > 32) this.cocos.splice(i, 1);
    }
  }

  private dropCoconut(pm: { x: number; y: number; s: number }, n: { g: number; rate: number; ripeT: number; shake: number }, k: number) {
    const R = nutR(1) * pm.s; // a fallen coconut keeps exactly the size of the ripe one on the tree
    const x0 = pm.x + (PALM_CROWN.x + PALM_NUT[k][0]) * pm.s;
    const z0 = (-PALM_CROWN.y - PALM_NUT[k][1] - nutR(1) * 0.92) * pm.s;
    const gy = Math.max(198, pm.y + rr(14, 44) * pm.s);
    const gx = clamp(pm.x + rr(-46, 46) * pm.s, 410, 1698);
    const T = Math.sqrt((2 * z0) / 760);
    this.cocos.push({ x: x0, y: gy, z: z0, vz: 0, vx: (gx - x0) / T, fall: true, bounces: 0, rest: 0, spin: 0, vs: rr(-7, 7), r: R });
    this.sparks(x0, gy - z0, 5, 42, ['#58c963', '#2f9e45', '#8be07a']);
    sfx.blip(520, 260, 0.12, 'sine', 0.1);
    n.g = 0.05; n.shake = 0; n.ripeT = rr(10, 28); n.rate = 1 / rr(50, 80);
  }

  private drawCoco(ctx: CanvasRenderingContext2D, c: { x: number; y: number; z: number; fall: boolean; spin: number; rest: number; bounces: number; r: number }) {
    const h = Math.min(1, c.z / 120);
    ctx.globalAlpha = 0.24 * (1 - 0.5 * h);
    ctx.fillStyle = '#3a2a10';
    ctx.beginPath(); ctx.ellipse(c.x + c.r * 0.12, c.y + 1, c.r * 0.95 * (1 - 0.4 * h), c.r * 0.36 * (1 - 0.4 * h), 0, 0, PI2); ctx.fill();
    ctx.globalAlpha = c.rest > 27 ? Math.max(0, 1 - (c.rest - 27) / 5) : 1;
    drawCoconut(ctx, c.x, c.y - c.z - c.r * 0.72, c.r, true, c.spin);
    if (!c.fall || c.bounces >= 1) {
      const pul = 0.5 + 0.5 * Math.sin(this.time * 5 + c.x);
      ctx.globalAlpha *= 0.5 + 0.5 * pul;
      ctx.fillStyle = '#fff6b0';
      star4(ctx, c.x + c.r * 0.9, c.y - c.r * 1.5 - pul * 2, 3 + pul * 2.2, this.time);
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------ cosmetics / unlock-all / treasure
  private applyCosmetics() {
    this.player.pal = makePlayerPal(this.skin, this.hat);
    this.player.skates = this.skatesOn && this.skatesOwned;
    this.player.board = this.boardOn && this.boardOwned;
  }

  setSkin(id: SkinId) {
    if (this.skin === id) return;
    this.skin = id;
    this.applyCosmetics();
    this.cosmeticFx();
  }

  setHat(id: HatId) {
    if (this.hat === id) return;
    this.hat = id;
    this.applyCosmetics();
    this.cosmeticFx();
  }

  /** The update loop is paused while a dialog is open, so dialogs need an immediate refresh. */
  private pushStatus() {
    const st = this.getStatus();
    this.statusKey = JSON.stringify(st);
    this.onStatus(st);
  }

  setZone2Stall(slotIdx: number, stallId: string) {
    this.zone2Stalls[slotIdx] = stallId;
    sfx.fanfare();
    const st = STALL_CATALOG.find((q) => q.id === stallId);
    this.onToast(`🎉 Lapak ${slotIdx + 1} dipasang: ${st ? st.name.replace('\n', ' ') : stallId}!`);
    this.pushStatus();
    this.save();
  }

  setCat(p: Partial<CatCfg>) {
    setCatCfg(p);
    this.pushStatus();
    this.save();
  }

  resetCat() {
    setCatCfg(DEFAULT_CFG);
    this.pushStatus();
    this.save();
  }

  private cosmeticFx() {
    const p = this.player;
    sfx.pop();
    this.sparks(p.x, p.y - 50, 12, 60);
    p.happy = 1.2;
    hopCat(p, 150);
    this.pushStatus();
    this.save();
  }

  private rideMul() {
    if (this.boardOn && this.boardOwned) return 1.42;
    if (this.skatesOn && this.skatesOwned) return 1.32;
    return 1;
  }

  private gliding() { return (this.skatesOn && this.skatesOwned) || (this.boardOn && this.boardOwned); }

  toggleBoard() {
    if (!this.boardOwned) return;
    this.boardOn = !this.boardOn;
    if (this.boardOn) this.skatesOn = false;
    this.applyCosmetics();
    this.cosmeticFx();
  }

  grantBoard() {
    this.boardOwned = true;
    this.boardOn = true;
    this.skatesOn = false;
    this.applyCosmetics();
    const p = this.player;
    sfx.fanfare();
    this.sparks(p.x, p.y - 8, 22, 100);
    p.happy = 1.6;
    hopCat(p, 190);
    this.onToast('🛹 Skateboard didapat! Meluncur lebih kencang!');
    this.pushStatus();
    this.save();
  }

  toggleSkates() {
    if (!this.skatesOwned) return;
    this.skatesOn = !this.skatesOn;
    if (this.skatesOn) this.boardOn = false;
    this.applyCosmetics();
    this.cosmeticFx();
  }

  grantSkates() {
    this.skatesOwned = true;
    this.skatesOn = true;
    this.boardOn = false;
    this.applyCosmetics();
    const p = this.player;
    sfx.fanfare();
    this.sparks(p.x, p.y - 8, 22, 100);
    p.happy = 1.6;
    hopCat(p, 190);
    this.onToast('🛼 Sepatu roda didapat! Lari lebih kencang!');
    this.statusKey = '';
    this.save();
  }

  /** SPACE: open every locked thing (areas, cashier, roller skates). */
  unlockAll() {
    let n = 0;
    if (this.level < 4) { this.level = 4; n++; }
    for (const u of this.unls) if (!u.done) {
      if (u.id === 'assist') { while (this.assistN < 3) this.hireAssistant(false); u.done = true; n++; continue; }
      u.paid = u.cost; this.completeUnlock(u); n++;
    }
    if (!this.boardOwned) { this.boardOwned = true; n++; }
    if (!this.skatesOwned) { this.grantSkates(); n++; }
    this.onToast(n ? '🔓 Semua yang terkunci sudah terbuka!' : '✅ Semuanya sudah terbuka');
  }

  private spawnTreasure() {
    const s = TREASURE_SPOTS[Math.floor(Math.random() * TREASURE_SPOTS.length)];
    this.treasure = { state: 'fall', x: s.x, y: s.y - 700, tx: s.x, ty: s.y, t: 0, land: 0, open: 0, life: 0, ph: rr(0, 6), burst: false, sparkT: 0 };
    this.treasureAsk = false;
    this.onToast('🪂 Harta karun turun dari langit!');
    sfx.alert();
  }

  private updateTreasure(dt: number, p: Cat) {
    this.treasureCd -= dt;
    const tr = this.treasure;
    if (!tr) {
      this.treasureT -= dt;
      if (this.treasureT <= 0) this.spawnTreasure();
      return;
    }
    tr.t += dt;
    if (tr.state === 'fall') {
      const remain = tr.ty - tr.y;
      const vy = clamp(24 + remain * 0.42, 30, 88);
      tr.y += vy * dt;
      const k = clamp(remain / 500, 0, 1);
      tr.x = tr.tx + Math.sin(tr.t * 1.4 + tr.ph) * 38 * k;
      if (tr.y >= tr.ty) {
        tr.y = tr.ty; tr.x = tr.tx; tr.state = 'landed'; tr.land = 0;
        sfx.thud();
        for (let i = 0; i < 6; i++) this.dust(tr.x + rr(-22, 22), tr.y + 12, 1.6);
        this.sparks(tr.x, tr.y - 10, 14, 80, ['#ffe45c', '#ffffff', '#ffb02e']);
      }
    } else if (tr.state === 'landed') {
      tr.land += dt;
      tr.life += dt;
      tr.sparkT -= dt;
      if (tr.sparkT <= 0) {
        tr.sparkT = 0.32;
        this.sparks(tr.x + rr(-18, 18), tr.y - rr(6, 30), 1, 24, ['#ffe45c', '#ffffff']);
      }
      if (!this.treasureAsk && this.treasureCd <= 0 && Math.hypot(p.x - tr.x, p.y - tr.y) < 56) {
        this.treasureAsk = true;
        this.onTreasure();
      }
      if (tr.life > 110) {
        this.sparks(tr.x, tr.y - 10, 16, 80);
        this.treasure = null;
        this.treasureT = rr(30, 45);
        this.onToast('💨 Harta karun hilang…');
      }
    } else {
      tr.open = Math.min(1, tr.open + dt * 2.4);
      tr.life += dt;
      if (!tr.burst && tr.open >= 0.55) {
        tr.burst = true;
        const mul = 1 + 0.12 * this.upLvl.price;
        const total = Math.round(rr(260, 460) * mul);
        const n = 12;
        let rest = total;
        for (let i = 0; i < n; i++) {
          const amt = i === n - 1 ? rest : Math.floor(total / n);
          rest -= amt;
          this.fly({
            kind: i % 3 === 0 ? 'coin' : 'bill', sx: tr.x + rr(-10, 10), sy: tr.y - 22, t: -i * 0.07, dur: 0.6, h: 90 + rr(0, 50), spin: rr(-9, 9), sc: 1.15,
            to: () => ({ x: p.x, y: p.y - catLayout().chestY * MS }),
            done: () => { this.addMoney(amt); sfx.coinStep(i); p.sqV += 1.6; this.sparks(p.x, p.y - 32, 2, 46, ['#ffe45c', '#9bffaa', '#ffffff']); },
          });
        }
        this.sparks(tr.x, tr.y - 22, 34, 150, ['#ffe45c', '#ffffff', '#ff9ccc', '#9be8ff']);
        this.texts.push({ x: tr.x, y: tr.y - 70, t: 0, text: '+$' + total, color: '#ffe45c', big: true });
        sfx.fanfare();
        p.happy = 1.8;
        hopCat(p, 190);
      }
      if (tr.life > 1.6) {
        this.treasure = null;
        this.treasureT = rr(40, 65);
      }
    }
  }

  claimTreasure() {
    const tr = this.treasure;
    this.treasureAsk = false;
    if (!tr || tr.state !== 'landed') return;
    tr.state = 'open';
    tr.open = 0;
    tr.life = 0;
    tr.burst = false;
  }

  declineTreasure() {
    this.treasureAsk = false;
    this.treasureCd = 7;
  }

  private drawTreasureAir(ctx: CanvasRenderingContext2D, V: View) {
    const tr = this.treasure;
    if (!tr) return;
    if (tr.x < V.x0 - 140 || tr.x > V.x1 + 140 || tr.y - 200 > V.y1 || tr.y + 60 < V.y0) return;
    if (tr.state === 'fall') {
      const k = clamp((tr.ty - tr.y) / 320, 0.12, 1);
      drawParachute(ctx, tr.x, tr.y, Math.sin(tr.t * 1.4 + tr.ph) * 0.15 * k, this.time);
    } else if (tr.state === 'landed' && tr.land < 2.4) {
      drawCanopyDown(ctx, tr.x, tr.y, tr.land / 2.4);
    }
  }

  private drawTreasureLanded(ctx: CanvasRenderingContext2D, tr: Treasure) {
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
    const fade = tr.state === 'open' ? clamp(1 - (tr.life - 0.9) / 0.7, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    // glow
    ctx.fillStyle = `rgba(255,230,120,${0.22 + pulse * 0.16})`;
    ctx.beginPath(); ctx.ellipse(tr.x, tr.y + 14, 46 + pulse * 6, 15 + pulse * 2, 0, 0, PI2); ctx.fill();
    if (tr.state === 'open') {
      ctx.fillStyle = `rgba(255,236,150,${0.5 * tr.open})`;
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.2 + Math.sin(this.time * 2) * 0.05;
        ctx.beginPath();
        ctx.moveTo(tr.x, tr.y - 8);
        ctx.lineTo(tr.x + Math.cos(a - 0.05) * 100, tr.y - 8 + Math.sin(a - 0.05) * 100);
        ctx.lineTo(tr.x + Math.cos(a + 0.05) * 100, tr.y - 8 + Math.sin(a + 0.05) * 100);
        ctx.closePath();
        ctx.fill();
      }
    }
    const hop = tr.state === 'landed' ? Math.max(0, Math.sin(this.time * 3)) * 3 : 0;
    drawChest(ctx, tr.x, tr.y - hop, tr.open, 1, this.time);
    if (tr.state === 'landed') {
      // "watch ad" bubble
      const by = tr.y - 58 - pulse * 3;
      ctx.fillStyle = '#ff4d5e';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(tr.x - 38, by - 13, 76, 26, 13); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(tr.x - 28, by - 6); ctx.lineTo(tr.x - 28, by + 6); ctx.lineTo(tr.x - 18, by); ctx.closePath(); ctx.fill();
      ctx.font = '900 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('IKLAN', tr.x + 8, by + 4);
    }
    ctx.restore();
  }

  private drawTreasureArrow(ctx: CanvasRenderingContext2D, V: View) {
    const tr = this.treasure;
    if (!tr) return;
    const sx = (tr.x - V.x0) * this.scale, sy = (tr.y - 20 - V.y0) * this.scale;
    const m = 44;
    if (sx > m && sx < this.W - m && sy > 70 && sy < this.H - m) return;
    const cx = this.W / 2, cy = this.H / 2;
    const ang = Math.atan2(sy - cy, sx - cx);
    const ex = clamp(sx, m + 40, this.W - m), ey = clamp(sy, 90, this.H - m);
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 6);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.scale(1 + pulse * 0.1, 1 + pulse * 0.1);
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = '#ffd43b';
    ctx.strokeStyle = '#58244a';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(18, -10); ctx.lineTo(18, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, 21, 0, PI2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 3; ctx.stroke();
    ctx.font = '22px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText('🎁', 0, 8);
    ctx.restore();
  }

  // ------------------------------------------------ ground tiles + zones
  private buildTile(X: number, Y: number, S: number): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    const r = Math.min(this.lres, 1.25);
    cv.width = cv.height = Math.ceil(S * r);
    const c = cv.getContext('2d')!;
    c.setTransform(r, 0, 0, r, -X * r, -Y * r);
    paintGround(c, X, Y, X + S, Y + S);
    return cv;
  }

  /** The ground is painted lazily in 640x640 tiles (so the 4x bigger world does not need a giant bitmap). */
  private drawTerrain(ctx: CanvasRenderingContext2D, V: View) {
    const T = 640, OX = 280;
    const tx0 = Math.max(0, Math.floor((V.x0 - OX) / T)), tx1 = Math.min(Math.floor((WORLD_W - OX) / T), Math.floor((V.x1 - OX) / T));
    const ty0 = Math.max(0, Math.floor(V.y0 / T)), ty1 = Math.min(Math.floor(WORLD_H / T), Math.floor(V.y1 / T));
    let built = 0;
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const key = tx + ',' + ty;
        const X = OX + tx * T, Y = ty * T;
        let tile = this.tiles.get(key);
        if (!tile && built < 2 && typeof document !== 'undefined') {
          tile = this.buildTile(X, Y, T + 2);
          built++;
          if (this.tiles.size >= 18) this.tiles.delete(this.tiles.keys().next().value as string);
        }
        if (tile) {
          this.tiles.delete(key);
          this.tiles.set(key, tile);
          ctx.drawImage(tile, X, Y, T + 2, T + 2);
        } else { ctx.fillStyle = '#f7e4a8'; ctx.fillRect(X, Y, T + 2, T + 2); }
      }
    }
  }

  private drawZones(ctx: CanvasRenderingContext2D, V: View) {
    for (const sl of SLOTS) {
      if (sl.x > V.x1 + 40 || sl.x + sl.w < V.x0 - 40 || sl.y > V.y1 + 40 || sl.y + sl.h < V.y0 - 90) continue;
      const stallId = this.zone2Stalls[sl.idx] || 'kelapa';
      const stall = STALL_CATALOG.find((q) => q.id === stallId) || STALL_CATALOG[0];
      drawCustomSlot(ctx, sl, stall, this.time);
    }
  }

  // ------------------------------------------------ pond / rod / fruit helpers
  private pondCap() { return 8 + 2 * (this.upLvl.pond || 0); }
  private rodWs() { return Math.max(0.22, 1 - 0.16 * this.upLvl.fish); }

  private landFish(type: number, from: Pt, dur = 0.95, h = 105): boolean {
    if (this.pondFull()) return false;
    this.pondPending++;
    const tgt = { x: POND.x + POND.w / 2 + rr(-34, 34), y: POND.y + POND.h / 2 + rr(-36, 36) };
    this.fly({
      kind: 'item', ft: type, sx: from.x, sy: from.y, dur, h, to: () => tgt,
      done: () => {
        this.pondPending--;
        this.stats.caught++;
        this.pond.push({ type, a: rr(0, 6.28), sp: (Math.random() < 0.5 ? -1 : 1) * rr(0.6, 1.1), rr: rr(0.5, 0.95), ph: rr(0, 6), face: 1 });
        this.splash(tgt.x, tgt.y, 8, 0.8, true);
        this.pondShake = 1;
        sfx.splash(0.5);
      },
    });
    return true;
  }

  private pickTreeFruit(tr: Tree, i: number, type: number, m: Cat, bump: (d: number) => void) {
    tr.fruit[i] = 0;
    tr.pop[i] = 1;
    bump(1);
    const from = { x: tr.x + MANGO_FR[i][0], y: tr.y + CANOPY_Y + MANGO_FR[i][1] + 12 };
    this.sparks(from.x, from.y, 4, 40, ['#ffe45c', '#ffffff']);
    sfx.pop();
    this.fly({ kind: 'item', ft: type, sx: from.x, sy: from.y, h: 40, to: () => this.basketPos(m), done: () => { bump(-1); m.carry.push(type); m.sqV += 3; } });
  }

  // ------------------------------------------------ juice bar
  private updateJuice(dt: number, p: Cat) {
    if (!this.isDone('juice')) return;
    for (const tr of this.juiceTrees) {
      for (let i = 0; i < 3; i++) {
        if (tr.fruit[i] < 1) tr.fruit[i] = Math.min(1, tr.fruit[i] + dt / 9);
        tr.pop[i] = Math.max(0, tr.pop[i] - dt * 3);
      }
    }
    const room = p.carry.length + this.pendingCarry < p.maxCarry;
    if (this.pickCd <= 0 && room) {
      outer: for (const tr of this.juiceTrees) {
        if (Math.hypot(p.x - tr.x, p.y - tr.y) > 78) continue;
        for (let i = 0; i < 3; i++) {
          if (tr.fruit[i] >= 1) {
            this.pickCd = 0.16;
            this.pickTreeFruit(tr, i, tr.kind === 'orange' ? 8 : 9, p, (d) => { this.pendingCarry += d; });
            break outer;
          }
        }
      }
    }
    const isFruit = (t: number) => t === 4 || t === 8 || t === 9;
    if (inside(p, JUICE_ZONE) && this.dropCd <= 0 && this.juiceIn.length + this.juicePending < 4 && this.hasCarry(p, isFruit)) {
      this.dropCd = 0.16;
      this.dropIntoBlender(p, this.takeCarry(p, isFruit));
    }
    this.updateBlender(dt);
  }

  private dropIntoBlender(m: Cat, type: number) {
    const from = this.basketPos(m);
    this.juicePending++;
    sfx.pop();
    this.fly({
      kind: 'item', ft: type, sx: from.x, sy: from.y, dur: 0.45, h: 52, to: () => ({ x: BLENDER.x, y: BLENDER.y - 20 }),
      done: () => { this.juicePending--; this.juiceIn.push(type); },
    });
  }

  private updateBlender(dt: number) {
    if (!this.blending && this.juiceIn.length > 0 && this.juiceStock.length + this.juiceCupPending < JUICE.cap) {
      this.blending = true; this.blendT = 0; this.blendType = this.juiceIn.shift()!;
      sfx.blip(180, 360, 0.22, 'sawtooth', 0.05);
    }
    if (!this.blending) return;
    this.blendT += dt;
    if (Math.random() < dt * 6) this.sparks(BLENDER.x + rr(-10, 10), BLENDER.y - rr(20, 50), 1, 20, ['#ffffff', '#ffe45c']);
    if (this.blendT >= 1.9) {
      this.blending = false;
      const flavor = this.blendType === 4 ? 0 : this.blendType === 8 ? 1 : 2;
      const tgt = cupSlot(this.juiceStock.length + this.juiceCupPending);
      this.juiceCupPending++;
      this.fly({
        kind: 'cup', ft: flavor, sx: BLENDER.x, sy: BLENDER.y - 24, dur: 0.5, h: 52, to: () => tgt,
        done: () => {
          this.juiceCupPending--;
          this.juiceStock.push(flavor);
          sfx.coin();
          this.sparks(tgt.x, tgt.y, 4, 30, ['#ffe45c', '#ffffff', '#9bffaa']);
        },
      });
    }
  }

  private drawJuiceStall(ctx: CanvasRenderingContext2D, V: View) {
    const u = this.unls[7];
    this.popped(ctx, { x: JUICE.x + JUICE.w / 2, y: JUICE.y + JUICE.h }, u.bt, () => this.layers.juice.draw(ctx, V));
    if (u.bt < 0.7) return;
    drawBlenderDyn(ctx, { t: this.time, blending: this.blending, prog: clamp(this.blendT / 1.9, 0, 1), type: this.blendType, queued: this.juiceIn.length });
    for (let i = 0; i < this.juiceStock.length; i++) { const s = cupSlot(i); drawCup(ctx, s.x, s.y, 1.4, this.juiceStock[i]); }
    const full = this.juiceStock.length >= JUICE.cap;
    this.badge(ctx, JUICE.x + JUICE.w - 54, JUICE.y + JUICE.h - JUICE.H + 19, full ? 'FULL' : `${this.juiceStock.length}/${JUICE.cap}`, full ? '#3fae49' : '#fff', full ? '#fff' : '#146a60');
  }

  // ------------------------------------------------ assistant cats
  hireAssistant(fx: boolean) {
    if (this.assistN >= 3) return;
    const id = this.assistN++;
    const m = makeCat(ASSIST_HOME.x + id * 32, ASSIST_HOME.y + 18, HELPER_PALS[id % HELPER_PALS.length]);
    m.maxCarry = 5;
    m.happy = 1;
    this.helpers.push({
      m, id, mode: 'think', way: [], work: null, wt: 0, wdt: 0.18, rt: 0.6, pend: 0, face: null, icon: '', claim: '', stuck: 0,
      fT: 0, fWait: 3, spot: -1, tgt: { x: 0, y: 0 }, bob: false, hooked: false, cast: false, bit: false,
    });
    const u = this.unls.find((q) => q.id === 'assist')!;
    u.paid = 0;
    if (this.assistN >= 3) u.done = true;
    else { u.cost = ASSIST_COST[this.assistN]; u.label = `ASISTEN ${this.assistN + 1}/3`; }
    if (fx) {
      const p = this.player;
      sfx.fanfare();
      this.sparks(m.x, m.y - 40, 22, 90);
      this.texts.push({ x: m.x, y: m.y - 110, t: 0, text: `ASISTEN ${this.assistN}! 😸`, color: '#ffe45c', big: true });
      this.onToast(`😸 Asisten kucing ke-${this.assistN} mulai bekerja!`);
      p.happy = 1.4;
      hopCat(p, 150);
      this.pushStatus();
      this.save();
    }
  }

  private route(a: Pt, b: Pt): Pt[] {
    const inSea = (q: Pt) => q.x < 372 && q.y > 280 && q.y < 545;
    const inFarm = (q: Pt) => q.x < 372 && q.y > 580;
    if ((inSea(a) && inSea(b)) || (inFarm(a) && inFarm(b))) return [b];
    const out: Pt[] = [];
    if (inSea(a)) out.push({ x: 452, y: clamp(a.y, 300, 520) });
    if (inFarm(a)) out.push({ x: 406, y: clamp(a.y, 604, 780) });
    if (inSea(b)) out.push({ x: 452, y: clamp(b.y, 300, 520) });
    if (inFarm(b)) out.push({ x: 406, y: clamp(b.y, 604, 780) });
    out.push(b);
    return out;
  }

  private wGo(w: Helper, goal: Pt, work: () => boolean | 'fish', icon: string, wdt = 0.18, face: Pt | null = null) {
    w.way = this.route({ x: w.m.x, y: w.m.y }, goal);
    w.mode = 'walk'; w.work = work; w.wdt = wdt; w.icon = icon; w.face = face;
  }

  private claimed(key: string, w: Helper) { return this.helpers.some((o) => o !== w && o.claim === key); }

  private updateHelpers(dt: number) {
    for (const w of this.helpers) {
      const m = w.m;
      let tvx = 0, tvy = 0;
      m.look = null;
      if (w.mode === 'think') {
        w.rt -= dt;
        if (w.rt <= 0) this.wThink(w);
      } else if (w.mode === 'walk') {
        const tg = w.way[0];
        if (!tg) { w.mode = 'work'; w.wt = 0.05; }
        else {
          const dx = tg.x - m.x, dy = tg.y - m.y, d = Math.hypot(dx, dy);
          const last = w.way.length === 1;
          if (d < (last ? 5 : 14)) { w.way.shift(); if (!w.way.length) { w.mode = 'work'; w.wt = 0.05; } }
          else { const sp = last ? Math.min(HELPER_SPEED, d * 8) : HELPER_SPEED; tvx = (dx / d) * sp; tvy = (dy / d) * sp; }
        }
      } else if (w.mode === 'work') {
        m.look = w.face;
        w.wt -= dt;
        if (w.wt <= 0) {
          w.wt = w.wdt;
          const r = w.work ? w.work() : false;
          if (r === 'fish') w.mode = 'fish';
          else if (!r) { w.mode = 'think'; w.work = null; w.rt = 0.2; }
        }
      } else this.wFishing(w, dt);
      if (w.mode !== 'fish') m.rod.on = false;
      updateCat(m, dt, tvx, tvy, 1100);
      if (m.stepSide >= 0 && m.speed > 80) this.stepDust(m, false);
    }
  }

  private wThink(w: Helper) {
    const m = w.m;
    w.claim = '';
    // 1) bring what we carry to the right place
    if (m.carry.length > 0) {
      if (this.wDeliver(w, m.carry[m.carry.length - 1])) { w.stuck = 0; return; }
      if (++w.stuck > 30) { m.carry.length = 0; w.stuck = 0; }
      w.icon = '⏳'; w.rt = 0.5;
      return;
    }
    w.stuck = 0;
    // 2) find the most urgent job (low stock = high priority)
    const cands: { s: number; run: () => void }[] = [];
    const sushiOn = this.isDone('sushi');
    const tableR = (this.table.length + this.tablePending) / TABLE.cap;
    const trayRoom = sushiOn && this.sushiIn.length + this.trayPending < TRAY.cap;
    const sushiR = (this.sushiDisp.length + this.sushiIn.length * 2) / DISP.cap;
    const fishNeed = Math.max(tableR < 1 ? 1 - tableR : 0, trayRoom ? 1 - sushiR : 0);
    const pondN = this.pond.length;
    if (pondN > 0 && fishNeed > 0.06) cands.push({ s: 0.52 + fishNeed * 0.55, run: () => this.wTaskPond(w) });
    if (!this.pondFull()) {
      const sp = this.wPickSpot(w);
      if (sp >= 0) cands.push({ s: 0.14 + (1 - pondN / this.pondCap()) * 0.42 + fishNeed * 0.2 + (pondN === 0 ? 0.25 : 0), run: () => this.wTaskFish(w, sp) });
    }
    if (this.isDone('crab')) {
      const hungry = this.pen.some((c) => c.g + 0.34 * c.feedPend < 0.99);
      const ripePlot = this.plots.findIndex((q, i) => q.state === 'ripe' && !this.claimed('plot' + i, w));
      if (hungry && ripePlot >= 0) cands.push({ s: 0.6, run: () => this.wTaskHarvestPlot(w, ripePlot) });
      const emptyPlot = this.plots.findIndex((q, i) => q.state === 'empty' && q.cd <= 0 && !this.claimed('plot' + i, w));
      if (emptyPlot >= 0 && (hungry || this.plots.every((q) => q.state === 'empty'))) cands.push({ s: 0.27 + (hungry ? 0.12 : 0), run: () => this.wTaskPlant(w, emptyPlot) });
      const rc = this.pen.findIndex((c, i) => c.g >= 1 && !this.claimed('crab' + i, w));
      const cookRoom = this.cookIn + this.cookPending < 4 && this.crabStock.length + this.crabPending < COOK.cap;
      if (rc >= 0 && cookRoom) cands.push({ s: 0.5 + (1 - this.crabStock.length / COOK.cap) * 0.4, run: () => this.wTaskCrab(w, rc) });
    }
    const fruitTrees: { tr: Tree; type: number; key: string }[] = [];
    if (this.isDone('orchard')) this.trees.forEach((tr, i) => fruitTrees.push({ tr, type: 4, key: 'tm' + i }));
    if (this.isDone('juice')) this.juiceTrees.forEach((tr, i) => fruitTrees.push({ tr, type: tr.kind === 'orange' ? 8 : 9, key: 'tj' + i }));
    const juiceNeed = this.isDone('juice') ? 1 - (this.juiceStock.length + this.juiceIn.length) / JUICE.cap : 0;
    const mangoNeed = this.isDone('orchard') ? 1 - this.mangoStock.length / MANGO.cap : 0;
    for (const f of fruitTrees) {
      if (!f.tr.fruit.some((v) => v >= 1) || this.claimed(f.key, w)) continue;
      const need = f.type === 4 ? Math.max(mangoNeed, juiceNeed * 0.8) : juiceNeed;
      if (need > 0.08) cands.push({ s: 0.36 + need * 0.5, run: () => this.wTaskFruit(w, f.tr, f.type, f.key) });
    }
    let best: { s: number; run: () => void } | null = null, bs = 0.12;
    for (const c of cands) { const sc = c.s + rr(0, 0.04); if (sc > bs) { bs = sc; best = c; } }
    if (best) { best.run(); return; }
    // nothing to do: wait near the hire pad
    const home = { x: ASSIST_HOME.x + w.id * 32, y: ASSIST_HOME.y + 18 };
    w.icon = '';
    if (Math.hypot(m.x - home.x, m.y - home.y) > 24) this.wGo(w, home, () => false, '');
    else w.rt = 1;
  }

  private wDeliver(w: Helper, t: number): boolean {
    if (t < 4) {
      const tableRoom = this.table.length + this.tablePending < TABLE.cap;
      const trayRoom = this.isDone('sushi') && this.sushiIn.length + this.trayPending < TRAY.cap;
      if (!tableRoom && !trayRoom) return false;
      const tableR = this.table.length / TABLE.cap, sushiR = (this.sushiDisp.length + this.sushiIn.length * 2) / DISP.cap;
      if (trayRoom && (!tableRoom || sushiR < tableR)) this.wGo(w, zc(SUSHI_ZONE), () => this.wDropTray(w), '🍣', 0.17, { x: 0, y: -1 });
      else this.wGo(w, zc(TABLE_ZONE), () => this.wDropTable(w), '🐟', 0.17, { x: 0, y: -1 });
      return true;
    }
    if (t === 4 || t === 8 || t === 9) {
      const mRoom = t === 4 && this.isDone('orchard') && this.mangoStock.length + this.mangoPending < MANGO.cap;
      const jRoom = this.isDone('juice') && this.juiceIn.length + this.juicePending < 4 && this.juiceStock.length + this.juiceCupPending < JUICE.cap;
      const mR = this.mangoStock.length / MANGO.cap, jR = (this.juiceStock.length + this.juiceIn.length) / JUICE.cap;
      if (jRoom && (!mRoom || jR < mR - 0.12)) { this.wGo(w, zc(JUICE_ZONE), () => this.wDropJuice(w), '🧃', 0.2, { x: 0, y: -1 }); return true; }
      if (mRoom) { this.wGo(w, zc(MANGO_ZONE), () => this.wDropMango(w), '🥭', 0.17, { x: 0, y: -1 }); return true; }
      return false;
    }
    if (t === 5) {
      if (!this.pen.some((c) => c.g + 0.34 * c.feedPend < 0.99)) return false;
      this.wGo(w, zc(PEN_ZONE), () => this.wFeed(w), '🌿', 0.2, { x: 0, y: -1 });
      return true;
    }
    if (t === 6) {
      if (this.cookIn + this.cookPending >= 4) return false;
      this.wGo(w, zc(COOK_ZONE), () => this.wDropCook(w), '🦀', 0.2, { x: 0, y: -1 });
      return true;
    }
    return false;
  }

  private wDropTable(w: Helper): boolean {
    const m = w.m;
    if (this.table.length + this.tablePending >= TABLE.cap || !this.hasCarry(m, (t) => t < 4)) return false;
    const idx = this.table.length + this.tablePending;
    const from = this.basketPos(m);
    const type = this.takeCarry(m, (t) => t < 4);
    this.tablePending++;
    const tgt = this.tableSlot(idx);
    this.fly({ kind: 'item', ft: type, sx: from.x, sy: from.y, dur: 0.4, to: () => tgt, done: () => { this.tablePending--; this.table.push(type); this.tablePop = 1; this.tablePopIdx = this.table.length - 1; } });
    return this.hasCarry(m, (t) => t < 4);
  }

  private wDropTray(w: Helper): boolean {
    const m = w.m;
    if (this.sushiIn.length + this.trayPending >= TRAY.cap || !this.hasCarry(m, (t) => t <= 4)) return false;
    const idx = this.sushiIn.length + this.trayPending;
    const from = this.basketPos(m);
    const type = this.takeCarry(m, (t) => t <= 4);
    this.trayPending++;
    const tgt = this.traySlot(idx);
    this.fly({ kind: 'item', ft: type, sx: from.x, sy: from.y, dur: 0.45, h: 52, to: () => tgt, done: () => { this.trayPending--; this.sushiIn.push(type); } });
    return this.hasCarry(m, (t) => t <= 4);
  }

  private wDropMango(w: Helper): boolean {
    const m = w.m;
    if (this.mangoStock.length + this.mangoPending >= MANGO.cap || !this.hasCarry(m, (t) => t === 4)) return false;
    const idx = this.mangoStock.length + this.mangoPending;
    const from = this.basketPos(m);
    this.takeCarry(m, (t) => t === 4);
    this.mangoPending++;
    const tgt = this.mangoSlot(idx);
    this.fly({ kind: 'item', ft: 4, sx: from.x, sy: from.y, dur: 0.4, to: () => tgt, done: () => { this.mangoPending--; this.mangoStock.push(4); this.mangoPop = 1; this.mangoPopIdx = this.mangoStock.length - 1; } });
    return this.hasCarry(m, (t) => t === 4);
  }

  private wDropJuice(w: Helper): boolean {
    const m = w.m;
    const isFruit = (t: number) => t === 4 || t === 8 || t === 9;
    if (this.juiceIn.length + this.juicePending >= 4 || !this.hasCarry(m, isFruit)) return false;
    this.dropIntoBlender(m, this.takeCarry(m, isFruit));
    return this.hasCarry(m, isFruit);
  }

  private wDropCook(w: Helper): boolean {
    const m = w.m;
    if (this.cookIn + this.cookPending >= 4 || !this.hasCarry(m, (t) => t === 6)) return false;
    const from = this.basketPos(m);
    this.takeCarry(m, (t) => t === 6);
    this.cookPending++;
    this.fly({ kind: 'item', ft: 6, sx: from.x, sy: from.y, dur: 0.45, h: 52, to: () => ({ x: COOK_POT.x, y: COOK_POT.y - 8 }), done: () => { this.cookPending--; this.cookIn++; this.steam(COOK_POT.x, COOK_POT.y - 8, 3); } });
    return this.hasCarry(m, (t) => t === 6);
  }

  private wFeed(w: Helper): boolean {
    const m = w.m;
    if (!this.hasCarry(m, (t) => t === 5)) return false;
    const need = (c: PenC) => c.g + 0.34 * c.feedPend;
    const cr = this.pen.filter((c) => need(c) < 0.99).sort((a, b) => need(a) - need(b))[0];
    if (!cr) return false;
    const from = this.basketPos(m);
    this.takeCarry(m, (t) => t === 5);
    cr.feedPend++;
    this.fly({
      kind: 'item', ft: 5, sx: from.x, sy: from.y, dur: 0.42, h: 46, to: () => ({ x: cr.x, y: cr.y - 10 }),
      done: () => {
        cr.feedPend = Math.max(0, cr.feedPend - 1);
        cr.g = Math.min(1, cr.g + 0.34); cr.eat = 1; cr.hop = 0.8;
        this.sparks(cr.x, cr.y - 14, 5, 34, ['#9bffaa', '#ff9ccc', '#ffffff']);
        if (cr.g >= 1) this.texts.push({ x: cr.x, y: cr.y - 56, t: 0, text: 'SIAP PANEN!', color: '#ffe45c' });
      },
    });
    return this.hasCarry(m, (t) => t === 5);
  }

  private wTaskPond(w: Helper) {
    const m = w.m;
    this.wGo(w, { x: POND.x + POND.w / 2, y: POND.y + POND.h + 22 }, () => {
      if (!this.pond.length || m.carry.length + w.pend >= m.maxCarry) return false;
      const f = this.pond.pop()!;
      const from = this.pondFishPos(f);
      w.pend++;
      this.splash(from.x, from.y, 3, 0.4, true);
      this.fly({ kind: 'item', ft: f.type, sx: from.x, sy: from.y, dur: 0.42, h: 46, to: () => this.basketPos(m), done: () => { w.pend--; m.carry.push(f.type); } });
      return this.pond.length > 0 && m.carry.length + w.pend < m.maxCarry;
    }, '🐟', 0.16, { x: 0, y: -1 });
  }

  private wPickSpot(w: Helper): number {
    const order = w.spot >= 0 ? [w.spot, ...SPOTS.map((_, i) => i).filter((i) => i !== w.spot)] : SPOTS.map((_, i) => i);
    for (const i of order) {
      if (!this.spotOpen(i) || this.claimed('spot' + i, w)) continue;
      if (Math.hypot(this.player.x - SPOTS[i].x, this.player.y - SPOTS[i].y) < 44) continue;
      return i;
    }
    return -1;
  }

  private wTaskFish(w: Helper, i: number) {
    w.claim = 'spot' + i;
    w.spot = i;
    this.wGo(w, { x: SPOTS[i].x, y: SPOTS[i].y }, () => {
      w.fT = 0;
      w.fWait = (1.6 + rr(0, 1.4)) * this.rodWs() + 0.9;
      w.tgt = { x: SPOTS[i].x - rr(140, 200), y: SPOTS[i].y + rr(-14, 14) };
      w.bob = false; w.hooked = false; w.cast = false; w.bit = false;
      return 'fish';
    }, '🎣', 0.1, LOOK_SEA);
  }

  private wFishing(w: Helper, dt: number) {
    const m = w.m, rod = m.rod;
    const t = (w.fT += dt), T = w.fWait;
    rod.on = true;
    m.look = LOOK_SEA;
    const bendTo = (v: number) => { rod.bend += (v - rod.bend) * Math.min(1, dt * 12); };
    if (t < 0.85) {
      if (t < 0.3) { const k = t / 0.3; rod.raise = (1 - (1 - k) * (1 - k)) * 1.5; m.tug = -0.5 * k; }
      else if (t < 0.42) rod.raise = 1.5 - ((t - 0.3) / 0.12) * 1.8;
      else rod.raise = -0.3 * (1 - clamp((t - 0.42) / 0.4, 0, 1));
      bendTo(t > 0.3 && t < 0.62 ? 1 : 0);
      if (!w.cast && t >= 0.42) { w.cast = true; w.bob = true; this.splash(w.tgt.x, w.tgt.y, 5, 0.5); }
    } else if (t < T) {
      rod.raise += (0 - rod.raise) * Math.min(1, dt * 8);
      bendTo(0.15 + Math.max(0, Math.sin(t * 7)) * 0.2);
    } else if (t < T + 0.55) {
      if (!w.bit) { w.bit = true; m.alert = 1; this.splash(w.tgt.x, w.tgt.y, 4, 0.5); }
      bendTo(0.9);
      rod.raise += (-0.1 - rod.raise) * Math.min(1, dt * 10);
    } else {
      const tr = t - T - 0.55;
      if (tr < 0.24) { const k = tr / 0.24; rod.raise = -0.1 + (1 - (1 - k) * (1 - k)) * 1.15; bendTo(1); m.tug = 1; }
      else {
        if (!w.hooked) {
          w.hooked = true;
          w.bob = false;
          this.splash(w.tgt.x, w.tgt.y, 12, 1.1);
          sfx.splash(0.4);
          this.landFish(randomFishType(), w.tgt);
          m.happy = 1;
          hopCat(m, 140);
        }
        const k2 = clamp((tr - 0.24) / 0.8, 0, 1);
        rod.raise = 1.05 + 0.85 * Math.sin(Math.min(1, k2 / 0.55) * Math.PI / 2) - clamp((k2 - 0.72) / 0.28, 0, 1) * 1.3;
        bendTo(k2 < 0.72 ? 0.8 : -0.5);
        if (tr >= 1.2) { rod.on = false; rod.raise = 0; w.mode = 'think'; w.rt = 0.15; }
      }
    }
  }

  private wTaskHarvestPlot(w: Helper, i: number) {
    const R = FARM_PLOTS[i], m = w.m;
    w.claim = 'plot' + i;
    this.wGo(w, { x: R.x + R.w / 2, y: R.y + R.h / 2 }, () => {
      const pl = this.plots[i];
      if (pl.state === 'ripe' && m.carry.length + w.pend < m.maxCarry) {
        pl.state = 'empty'; pl.g = 0; pl.cd = 1.6; w.pend++;
        this.splash(R.x + R.w / 2, R.y + R.h / 2, 8, 0.8);
        sfx.splash(0.4);
        this.fly({ kind: 'item', ft: 5, sx: R.x + R.w / 2, sy: R.y + R.h / 2, h: 46, to: () => this.basketPos(m), done: () => { w.pend--; m.carry.push(5); } });
      }
      return false;
    }, '🌿', 0.3);
  }

  private wTaskPlant(w: Helper, i: number) {
    const R = FARM_PLOTS[i];
    w.claim = 'plot' + i;
    this.wGo(w, { x: R.x + R.w / 2, y: R.y + R.h / 2 }, () => {
      const pl = this.plots[i];
      if (pl.state === 'empty') {
        pl.state = 'grow'; pl.g = 0.06; pl.pop = 1;
        sfx.pop();
        this.splash(R.x + R.w / 2, R.y + R.h / 2, 5, 0.5);
        this.sparks(R.x + R.w / 2, R.y + R.h / 2, 4, 30, ['#9bffaa', '#ffffff']);
      }
      return false;
    }, '🌱', 0.3);
  }

  private wTaskCrab(w: Helper, idx: number) {
    const c0 = this.pen[idx], m = w.m;
    w.claim = 'crab' + idx;
    this.wGo(w, { x: clamp(c0.x, PEN.x + 14, PEN.x + PEN.w - 14), y: PEN.y + PEN.h + 22 }, () => {
      const cc = this.pen[idx];
      if (cc.g >= 1 && Math.hypot(m.x - cc.x, m.y - cc.y) < 100 && m.carry.length + w.pend < m.maxCarry) {
        cc.g = 0.12; cc.feedPend = 0; cc.hop = 1; w.pend++;
        this.sparks(cc.x, cc.y - 14, 8, 50, ['#ffe45c', '#ffffff']);
        sfx.pop();
        this.fly({ kind: 'item', ft: 6, sx: cc.x, sy: cc.y - 12, h: 50, to: () => this.basketPos(m), done: () => { w.pend--; m.carry.push(6); } });
      }
      return false;
    }, '🦀', 0.3, { x: 0, y: -1 });
  }

  private wTaskFruit(w: Helper, tr: Tree, type: number, key: string) {
    const m = w.m;
    w.claim = key;
    this.wGo(w, { x: tr.x, y: tr.y + 14 }, () => {
      if (m.carry.length + w.pend >= m.maxCarry) return false;
      for (let i = 0; i < 3; i++) {
        if (tr.fruit[i] >= 1) { this.pickTreeFruit(tr, i, type, m, (d) => { w.pend += d; }); return true; }
      }
      return false;
    }, type === 4 ? '🥭' : type === 8 ? '🍊' : '🍎', 0.28, { x: 0, y: -1 });
  }

  private drawHelperTag(ctx: CanvasRenderingContext2D, w: Helper) {
    if (!w.icon) return;
    const m = w.m;
    const y = m.y - (catLayout().height + 8) * MS - 14 - m.hopY * MS - Math.sin(this.time * 4 + w.id) * 1.4;
    ctx.beginPath(); ctx.roundRect(m.x - 14, y - 12, 28, 24, 10);
    ctx.fillStyle = '#fffdf3'; ctx.fill();
    ctx.lineWidth = 2.6; ctx.strokeStyle = '#e4bd84'; ctx.stroke();
    ctx.font = '15px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(w.icon, m.x, y + 5.5);
  }

  private drawHelperLines(ctx: CanvasRenderingContext2D) {
    for (const w of this.helpers) {
      if (w.mode !== 'fish' || !w.m.rod.on || !w.bob) continue;
      const tip = { x: w.m.rod.wx, y: w.m.rod.wy };
      const e = { x: w.tgt.x, y: w.tgt.y + Math.sin(this.time * 3 + w.id) * 1.2 };
      ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.quadraticCurveTo((tip.x + e.x) / 2, (tip.y + e.y) / 2 + 10, e.x, e.y);
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(e.x, e.y, 5.2, 0, PI2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#7a2a30'; ctx.stroke();
      ctx.beginPath(); ctx.arc(e.x, e.y, 5.2, Math.PI, 0); ctx.fillStyle = '#ff4d5e'; ctx.fill();
    }
  }

  // ------------------------------------------------ fishing boat
  private updateBoat(dt: number) {
    const f = this.fisher;
    if (!this.isDone('boat') || !f) return;
    const b = this.boat;
    b.t += dt;
    postUpdate(f, dt, 0, 0, 0, 0, 0);
    if (b.state === 'dock') {
      b.x = BOAT_DOCK.x;
      if (b.load > 0) {
        b.tossT -= dt;
        if (b.tossT <= 0) {
          b.tossT = 0.32;
          b.load--;
          const from = { x: b.x + 6, y: BOAT_DOCK.y - 20 };
          if (!this.landFish(randomFishType(), from, 0.8, 80)) { this.addMoney(6); this.texts.push({ x: b.x, y: BOAT_DOCK.y - 90, t: 0, text: '+$6', color: '#9bffaa' }); }
          f.happy = 1;
          hopCat(f, 100);
          sfx.splash(0.4);
        }
      } else {
        b.wait -= dt;
        if (b.wait <= 0 && this.pond.length + this.pondPending <= this.pondCap() - 5) { b.state = 'out'; b.t = 0; sfx.blip(300, 600, 0.2, 'triangle', 0.15); }
      }
    } else if (b.state === 'out') {
      b.x -= 85 * dt;
      if (b.x < -820) { b.state = 'far'; b.t = 0; }
    } else if (b.state === 'far') {
      if (b.t > 14) { b.state = 'back'; b.t = 0; b.x = -820; }
    } else {
      b.x += 100 * dt;
      if (b.x >= BOAT_DOCK.x) {
        b.x = BOAT_DOCK.x; b.state = 'dock'; b.load = 10; b.tossT = 0.7; b.wait = 7;
        sfx.fanfare();
        this.texts.push({ x: b.x, y: BOAT_DOCK.y - 110, t: 0, text: 'PULANG BAWA 10 IKAN! 🐟', color: '#ffe45c', big: true });
      }
    }
    if ((b.state === 'out' || b.state === 'back') && Math.random() < dt * 9) {
      this.ripples.push({ x: b.x + (b.state === 'out' ? 50 : -50), y: BOAT_DOCK.y + 16, t: 0, max: 0.9, r: 18, pond: false });
    }
  }

  private drawBoatItem(ctx: CanvasRenderingContext2D) {
    const b = this.boat, f = this.fisher;
    if (!f) return;
    const flip = b.state === 'out' ? -1 : 1;
    const moving = b.state === 'out' || b.state === 'back';
    const tilt = Math.sin(this.time * 1.7) * 0.035 + (moving ? Math.sin(this.time * 3) * 0.02 : 0);
    const by = BOAT_DOCK.y + Math.sin(this.time * 2) * 2.2;
    const fishN = b.state === 'back' ? 10 : b.state === 'dock' ? b.load : 0;
    drawBoat(ctx, b.x, by, this.time, tilt, flip, fishN, () => {
      f.x = -flip * 10; f.y = -6; f.look = { x: flip, y: 0.15 };
      drawCat(ctx, f, MS);
    });
  }

  // ------------------------------------------------ helpers
  private pondFull() { return this.pond.length + this.pondPending >= this.pondCap(); }

  private pondFishPos(f: { a: number; rr: number; ph: number }): Pt {
    const cx = POND.x + POND.w / 2, cy = POND.y + POND.h / 2;
    return { x: cx + Math.cos(f.a) * (POND.w / 2 - 24) * f.rr, y: cy + Math.sin(f.a) * (POND.h / 2 - 28) * f.rr + Math.sin(this.time * 3 + f.ph) * 1.5 };
  }

  private tableSlot(i: number): Pt {
    return { x: TABLE.x + 30 + (i % 6) * 40, y: TABLE.y - TABLE.H + 31 + Math.floor(i / 6) * 20 };
  }
  private traySlot(i: number): Pt { return { x: TRAY.x + 24 + (i % 2) * 40, y: TRAY.y + 20 + Math.floor(i / 2) * 30 }; }
  private dispSlot(i: number): Pt { return { x: DISP.x + 14 + (i % 6) * 13.6, y: DISP.y + 18 + Math.floor(i / 6) * 24 }; }
  private mangoSlot(i: number): Pt { return { x: MANGO.x + 25 + (i % 6) * 32, y: MANGO.y - MANGO.H + 25 + Math.floor(i / 6) * 17 }; }
  private basketPos(p: Cat): Pt { return { x: p.x + p.sway * 1.6 * MS, y: p.y - (catLayout().carryY + 4) * MS }; }

  private takeCarry(p: Cat, pred: (t: number) => boolean): number {
    for (let i = p.carry.length - 1; i >= 0; i--) if (pred(p.carry[i])) return p.carry.splice(i, 1)[0];
    return -1;
  }
  private hasCarry(p: Cat, pred: (t: number) => boolean) { return p.carry.some(pred); }

  private fly(f: Partial<Flyer> & Pick<Flyer, 'kind' | 'sx' | 'sy' | 'to' | 'done'>) {
    this.flyers.push({ ft: 0, t: 0, dur: 0.42, h: 44, spin: 0, sc: 1, ...f });
  }

  private splash(x: number, y: number, n = 10, big = 1, pond = false) {
    if (this.parts.length < 260) {
      for (let i = 0; i < n; i++) {
        this.parts.push({ x, y, vx: (Math.random() - 0.5) * 110 * big, vy: -(90 + Math.random() * 130) * big, life: 0.55 + Math.random() * 0.25, max: 0.8, r: 2 + Math.random() * 2.2, kind: 'drop', ang: 0 });
      }
    }
    this.ripples.push({ x, y, t: 0, max: 0.9, r: 22 * big, pond });
    this.ripples.push({ x, y, t: -0.18, max: 0.9, r: 34 * big, pond });
  }

  private dust(x: number, y: number, s: number, kx = 0) {
    if (this.parts.length > 260) return;
    this.parts.push({ x, y, vx: kx + (Math.random() - 0.5) * 24, vy: -8 - Math.random() * 14, life: 0.4 + Math.random() * 0.15, max: 0.5, r: (4 + Math.random() * 3) * s, kind: 'dust', ang: 0 });
  }

  /** a little sand puff + a few grains kicked backwards from the planted foot */
  private stepDust(m: Cat, strong: boolean) {
    if (m.x < shoreX(m.y) + 22) return; // wooden pier: no sand
    const sd = m.stepSide ? 1 : -1;
    const Lg = catLayout();
    const hipX = Math.min(7 * CAT_CFG.legGap, Lg.HW * 0.8);
    const fx = m.x + (sd * (hipX + 1.2) + m.fx * 9.5) * MS;
    const fy = m.y - 1;
    const back = -m.fx * (strong ? 46 : 30);
    const nPuff = strong ? 2 : 1, nGrain = strong ? 4 : 2;
    for (let i = 0; i < nPuff; i++) {
      if (this.parts.length > 260) return;
      this.parts.push({
        x: fx + rr(-2, 2), y: fy, vx: back * rr(0.5, 1) + rr(-8, 8), vy: -rr(7, 15), life: rr(0.34, 0.5), max: 0.5,
        r: rr(2.2, 3.4) * (strong ? 1.25 : 1), kind: 'dust', ang: 0,
      });
    }
    for (let i = 0; i < nGrain; i++) {
      if (this.parts.length > 260) return;
      this.parts.push({
        x: fx + rr(-3, 3), y: fy - rr(0, 2), vx: back * rr(0.6, 1.5) + rr(-12, 12), vy: -rr(24, 52), life: rr(0.3, 0.48), max: 0.48,
        r: rr(0.8, 1.5), kind: 'grain', ang: 0,
      });
    }
  }

  private sparks(x: number, y: number, n: number, spread = 60, cols?: string[]) {
    const cs = cols ?? ['#ffe45c', '#ffffff', '#ff9ccc', '#9be8ff'];
    for (let i = 0; i < n && this.parts.length < 300; i++) {
      const a = Math.random() * PI2, sp = rr(20, spread);
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: rr(0.4, 0.75), max: 0.75, r: rr(2.6, 5.2), kind: 'spark', ang: rr(0, 3), col: cs[i % cs.length] });
    }
  }

  private addPrint(m: Cat, a: number) {
    if (m.x < shoreX(m.y) + 24) return;
    const ang = Math.atan2(m.vy, m.vx);
    const side = m.stepSide ? 1 : -1;
    this.prints.push({ x: m.x - Math.sin(ang) * side * 5 * MS, y: m.y + Math.cos(ang) * side * 5 * MS - 1, ang, t: 0, life: 3.2, a });
    if (this.prints.length > 90) this.prints.shift();
  }

  private flyerPos(f: Flyer, t: number): Pt {
    const to = f.to();
    const tt = clamp(t, 0, 1);
    const e = tt * tt * (3 - 2 * tt);
    return { x: f.sx + (to.x - f.sx) * e, y: f.sy + (to.y - f.sy) * e - Math.sin(tt * Math.PI) * f.h };
  }

  private spotOpen(i: number) { return i === 0 || (i === 1 && this.isDone('spot2')) || (i === 2 && this.isDone('spot3')); }

  // ------------------------------------------------ update
  private update(dt: number) {
    if (this.paused) return;
    this.time += dt;
    const p = this.player;
    const inp = this.readInput();
    const tvx = inp.dx * inp.spd, tvy = inp.dy * inp.spd;
    const tSpeed = Math.hypot(tvx, tvy);
    const pvx = p.vx, pvy = p.vy;
    const px = p.x, py = p.y;

    {
      const dx = tvx - p.vx, dy = tvy - p.vy;
      const d = Math.hypot(dx, dy);
      const cur = Math.hypot(p.vx, p.vy);
      const a = (this.gliding() ? (tSpeed < cur ? 1500 : 1050) : (tSpeed < cur ? 2300 : 1500)) * dt;
      if (d <= a) { p.vx = tvx; p.vy = tvy; } else { p.vx += (dx / d) * a; p.vy += (dy / d) * a; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.collide(p, px, py);
    postUpdate(p, dt, pvx, pvy, tvx, tvy, tSpeed);

    if (p.stepSide >= 0 && p.speed > 40 && !p.skates && !p.board) {
      this.addPrint(p, 0.42);
      // saat lari, debu kaki lebih tebal supaya kecepatannya terasa
      this.stepDust(p, p.r > 0.5 || (this.runInput && p.speed > WALK * 1.2));
    }
    if ((p.skates || p.board) && p.speed > 110 && this.hq) {
      this.skateT -= dt;
      if (this.skateT <= 0 && this.parts.length < 260) {
        this.skateT = 0.04;
        for (const sd of [-1, 1]) {
          this.parts.push({
            x: p.x + sd * 6 * MS - p.fx * 8, y: p.y - 1, vx: -p.vx * 0.2 + (Math.random() - 0.5) * 30, vy: -rr(10, 40), life: 0.28, max: 0.28,
            r: rr(2, 3.4), kind: 'spark', ang: rr(0, 3), col: ['#ffd23f', '#ff9a3c', '#ffffff'][Math.floor(Math.random() * 3)],
          });
        }
      }
    }
    if (p.skid > 0.5) {
      this.skidT -= dt;
      if (this.skidT <= 0) {
        this.skidT = 0.035;
        for (let i = 0; i < 2; i++) this.dust(p.x + (Math.random() - 0.5) * 14, p.y - 1, 1.6);
      }
    }
    if (p.r > 0.55) {
      this.streakT -= dt;
      if (this.streakT <= 0 && this.parts.length < 260) {
        this.streakT = 0.05;
        this.parts.push({
          x: p.x - p.fx * 14 + (Math.random() - 0.5) * 18, y: p.y - 12 - Math.random() * 40,
          vx: -p.vx * 0.25, vy: -p.vy * 0.25, life: 0.22, max: 0.22, r: 12 + Math.random() * 8, kind: 'streak', ang: Math.atan2(p.vy, p.vx),
        });
      }
      this.sparkT -= dt;
      if (this.sparkT <= 0 && this.hq) {
        this.sparkT = 0.13;
        this.parts.push({
          x: p.x - p.fx * 12 + (Math.random() - 0.5) * 20, y: p.y - 14 - Math.random() * 30, vx: -p.vx * 0.12 + (Math.random() - 0.5) * 20, vy: -22,
          life: 0.5, max: 0.5, r: 3 + Math.random() * 2.4, kind: 'spark', ang: Math.random() * 3, col: ['#ffe45c', '#ff9ccc', '#ffffff'][Math.floor(Math.random() * 3)],
        });
      }
    }

    this.updateSea(dt);
    this.updateCrab(dt);

    let inSpot = -1;
    for (let i = 0; i < SPOTS.length; i++) if (this.spotOpen(i) && Math.hypot(p.x - SPOTS[i].x, p.y - SPOTS[i].y) < 30) inSpot = i;
    this.updateFishing(dt, inSpot);

    this.pickCd -= dt; this.dropCd -= dt; this.collectCd -= dt; this.textCd -= dt; this.payCd -= dt;
    this.pondShake = Math.max(0, this.pondShake - dt * 3);
    const sushiOn = this.isDone('sushi'), orchardOn = this.isDone('orchard');
    const inTable = inside(p, TABLE_ZONE);
    const inSushi = sushiOn && inside(p, SUSHI_ZONE);
    const inMango = orchardOn && inside(p, MANGO_ZONE);
    const inReg = inside(p, REG_ZONE);
    const inMoney = inside(p, MONEY_ZONE);
    const sm = Math.min(1, dt * 10);
    this.pads.table += ((inTable ? 1 : 0) - this.pads.table) * sm;
    this.pads.sushi += ((inSushi ? 1 : 0) - this.pads.sushi) * sm;
    this.pads.mango += ((inMango ? 1 : 0) - this.pads.mango) * sm;
    this.pads.reg += ((inReg ? 1 : 0) - this.pads.reg) * sm;
    this.pads.money += ((inMoney ? 1 : 0) - this.pads.money) * sm;
    this.pads.pen += ((this.isDone('crab') && inside(p, PEN_ZONE) ? 1 : 0) - this.pads.pen) * sm;
    this.pads.cook += ((this.isDone('crab') && inside(p, COOK_ZONE) ? 1 : 0) - this.pads.cook) * sm;
    this.pads.juice += ((this.isDone('juice') && inside(p, JUICE_ZONE) ? 1 : 0) - this.pads.juice) * sm;

    for (const f of this.pond) {
      f.a += f.sp * dt;
      const vx = -Math.sin(f.a) * f.sp;
      f.face += ((vx >= 0 ? 1 : -1) - f.face) * Math.min(1, dt * 7);
    }

    const room = p.carry.length + this.pendingCarry < p.maxCarry;
    // fish out of the pond
    if (this.pickCd <= 0 && inside(p, POND_ZONE) && this.pond.length > 0 && room) {
      const f = this.pond.pop()!;
      const from = this.pondFishPos(f);
      this.pickCd = 0.14;
      this.pendingCarry++;
      this.splash(from.x, from.y, 4, 0.5, true);
      sfx.pop();
      this.fly({
        kind: 'item', ft: f.type, sx: from.x, sy: from.y, h: 46, to: () => this.basketPos(p),
        done: () => { this.pendingCarry--; p.carry.push(f.type); p.sqV += 3; },
      });
    }
    // mango from trees
    if (orchardOn && this.pickCd <= 0 && room) {
      outer: for (const tr of this.trees) {
        if (Math.hypot(p.x - tr.x, p.y - tr.y) > 78) continue;
        for (let i = 0; i < 3; i++) {
          if (tr.fruit[i] >= 1) {
            tr.fruit[i] = 0;
            tr.pop[i] = 1;
            this.pickCd = 0.16;
            this.pendingCarry++;
            const from = { x: tr.x + MANGO_FR[i][0], y: tr.y + CANOPY_Y + MANGO_FR[i][1] + 12 };
            this.sparks(from.x, from.y, 4, 40, ['#ffe45c', '#ffffff']);
            sfx.pop();
            this.fly({
              kind: 'item', ft: 4, sx: from.x, sy: from.y, h: 40, to: () => this.basketPos(p),
              done: () => { this.pendingCarry--; p.carry.push(4); p.sqV += 3; },
            });
            break outer;
          }
        }
      }
    }
    for (const tr of this.trees) {
      for (let i = 0; i < 3; i++) {
        if (tr.fruit[i] < 1 && orchardOn) tr.fruit[i] = Math.min(1, tr.fruit[i] + dt / 8);
        tr.pop[i] = Math.max(0, tr.pop[i] - dt * 3);
      }
    }
    // drop fish on the ice table
    if (inTable && this.dropCd <= 0 && this.hasCarry(p, (t) => t < 4) && this.table.length + this.tablePending < TABLE.cap) {
      this.dropCd = 0.14;
      const idx = this.table.length + this.tablePending;
      const from = this.basketPos(p);
      const type = this.takeCarry(p, (t) => t < 4);
      this.tablePending++;
      const tgt = this.tableSlot(idx);
      sfx.pop();
      this.fly({
        kind: 'item', ft: type, sx: from.x, sy: from.y, dur: 0.4, to: () => tgt,
        done: () => { this.tablePending--; this.table.push(type); this.tablePop = 1; this.tablePopIdx = this.table.length - 1; },
      });
    }
    // drop mango on the fruit stall
    // Zone 2 slot interaction
    if (this.slotPromptCd <= 0 && p.speed < 40) {
      for (const sl of SLOTS) {
        if (inside(p, { x: sl.x, y: sl.y, w: sl.w, h: sl.h })) {
          this.slotPromptCd = 3.5;
          this.onSelectSlot(sl.idx, this.zone2Stalls[sl.idx] || 'kelapa');
          break;
        }
      }
    }

    if (inMango && this.dropCd <= 0 && this.hasCarry(p, (t) => t === 4) && this.mangoStock.length + this.mangoPending < MANGO.cap) {
      this.dropCd = 0.14;
      const idx = this.mangoStock.length + this.mangoPending;
      const from = this.basketPos(p);
      this.takeCarry(p, (t) => t === 4);
      this.mangoPending++;
      const tgt = this.mangoSlot(idx);
      sfx.pop();
      this.fly({
        kind: 'item', ft: 4, sx: from.x, sy: from.y, dur: 0.4, to: () => tgt,
        done: () => { this.mangoPending--; this.mangoStock.push(4); this.mangoPop = 1; this.mangoPopIdx = this.mangoStock.length - 1; },
      });
    }
    // anything goes to the sushi tray
    if (inSushi && this.dropCd <= 0 && this.hasCarry(p, (t) => t <= 4) && this.sushiIn.length + this.trayPending < TRAY.cap) {
      this.dropCd = 0.14;
      const idx = this.sushiIn.length + this.trayPending;
      const from = this.basketPos(p);
      const type = this.takeCarry(p, (t) => t <= 4);
      this.trayPending++;
      const tgt = this.traySlot(idx);
      sfx.pop();
      this.fly({
        kind: 'item', ft: type, sx: from.x, sy: from.y, dur: 0.45, h: 52, to: () => tgt,
        done: () => { this.trayPending--; this.sushiIn.push(type); },
      });
    }

    // ---- satisfying money collection: bills pop off the counter stack with a rising pitch
    if (inMoney && this.stack.length > 0 && this.collectCd <= 0) {
      const n = this.combo.n;
      this.collectCd = Math.max(0.03, 0.09 - n * 0.0045);
      const v = this.stack.pop()!;
      this.stackSum -= v;
      const from = billPos(this.stack.length);
      this.combo.n++;
      this.combo.t = 0;
      this.landT = 9;
      this.fly({
        kind: 'bill', sx: from.x, sy: from.y, dur: 0.4, h: 50 + rr(0, 22), spin: rr(-9, 9), sc: 1.15, to: () => ({ x: p.x, y: p.y - catLayout().chestY * MS }),
        done: () => {
          this.addMoney(v);
          this.combo.amt += v;
          this.combo.t = 0;
          this.combo.pop = 1;
          p.sqV += 1.8;
          sfx.coinStep(n);
          this.sparks(p.x, p.y - 32, 2, 46, ['#ffe45c', '#9bffaa', '#ffffff']);
        },
      });
      if (n % 4 === 0) { p.happy = Math.max(p.happy, 0.9); hopCat(p, 100); }
    }
    this.combo.t += dt;
    this.combo.pop = Math.max(0, this.combo.pop - dt * 6);
    if (!inMoney || this.stack.length === 0) { if (this.combo.t > 0.6) this.combo.n = 0; }
    if (this.combo.amt > 0 && this.combo.t > 0.85) {
      const amt = this.combo.amt;
      this.texts.push({ x: p.x, y: p.y - 150, t: 0, text: '+$' + amt, color: '#ffe45c', big: amt >= 50 });
      if (amt >= 60) { p.happy = 1.3; hopCat(p, 160); sfx.cha(); this.sparks(p.x, p.y - 60, 14, 90, ['#ffe45c', '#9bffaa']); }
      this.combo.amt = 0;
    }
    this.landT += dt;

    // ---- unlock pads: stand on them to pay, coins fly out one by one
    this.payT += dt;
    if (this.payT > 0.5) this.payN = 0;
    for (const u of this.unls) {
      if (u.done) { u.bt += dt; continue; }
      const on = inside(p, u.zone) && p.speed < 130;
      u.act += ((on ? 1 : 0) - u.act) * sm;
      if (on && this.money > 0 && this.payCd <= 0) {
        this.payCd = 0.045;
        const step = Math.max(1, Math.ceil(u.cost / 22));
        const amt = Math.min(step, u.cost - u.paid, this.money);
        this.money -= amt;
        u.paid += amt;
        this.onMoney(this.money);
        this.payT = 0;
        sfx.coinStep(this.payN++);
        const zc = { x: u.zone.x + u.zone.w / 2, y: u.zone.y + u.zone.h / 2 };
        this.fly({ kind: 'coin', sx: p.x, sy: p.y - catLayout().chestY * MS, dur: 0.35, h: 36, spin: rr(-8, 8), to: () => zc, done: () => {} });
        if (u.paid >= u.cost) this.completeUnlock(u);
      }
    }

    this.updateTreasure(dt, p);
    this.updatePalms(dt, p);
    this.updateCrabChain(dt, p);
    this.updateJuice(dt, p);
    updateVolleyball(this.volleyball, dt);
    updatePlaygroundCats(this.playgroundCats, dt);
    this.slotPromptCd = Math.max(0, this.slotPromptCd - dt);
    this.updateHelpers(dt);
    this.updateBoat(dt);
    // Highway traffic movement: cars drive along the lanes smoothly
    for (const car of this.trafficCars) {
      car.y += car.speed * dt;
      if (car.speed < 0 && car.y < -130) {
        car.y = WORLD_H + 130;
        car.speed = -(130 + Math.random() * 70);
      } else if (car.speed > 0 && car.y > WORLD_H + 130) {
        car.y = -130;
        car.speed = 130 + Math.random() * 70;
      }
    }
    for (const z of [2, 3, 4]) this.gateA[z] += ((this.level >= z ? 0 : 1) - this.gateA[z]) * Math.min(1, dt * 2.5);
    this.updateChef(dt);
    if (this.cashier) {
      const c = this.cashier;
      postUpdate(c, dt, 0, 0, 0, 0, 0);
      const u = this.unls[4];
      if (u.bt > 0.6 && Math.random() < dt * 0.15) hopCat(c, 100);
    }
    if (this.vendor) postUpdate(this.vendor, dt, 0, 0, 0, 0, 0);
    this.updateCustomers(dt, inReg || this.isDone('cashier'));

    // flyers
    for (const f of this.flyers) f.t += dt / f.dur;
    for (let i = this.flyers.length - 1; i >= 0; i--) {
      if (this.flyers[i].t >= 1) { this.flyers[i].done(); this.flyers.splice(i, 1); }
    }
    for (const q of this.parts) {
      q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.kind === 'dust') { q.vx *= 0.94; q.vy *= 0.94; }
      if (q.kind === 'drop') q.vy += 520 * dt;
      if (q.kind === 'grain') { q.vy += 260 * dt; q.vx *= 0.97; }
      if (q.kind === 'steam') { q.vx += Math.sin(q.life * 5 + q.x) * 9 * dt; q.vy *= 0.992; q.r += dt * 4.2; }
      if (q.kind === 'spark') { q.vx *= 0.96; q.vy *= 0.96; }
    }
    this.parts = this.parts.filter((q) => q.life > 0);
    for (const r of this.ripples) r.t += dt;
    this.ripples = this.ripples.filter((r) => r.t < r.max);
    for (const t of this.texts) { t.t += dt; t.y -= 34 * dt; }
    this.texts = this.texts.filter((t) => t.t < 0.9);
    for (const q of this.prints) q.t += dt;
    this.prints = this.prints.filter((q) => q.t < q.life);
    this.tablePop = Math.max(0, this.tablePop - dt * 4);
    this.dispPop = Math.max(0, this.dispPop - dt * 4);
    this.mangoPop = Math.max(0, this.mangoPop - dt * 4);

    const k = Math.min(1, dt * 5);
    this.cam.x += (p.x + p.vx * 0.25 - this.cam.x) * k;
    this.cam.y += (p.y - 30 + p.vy * 0.2 - this.cam.y) * k;

    this.mT -= dt;
    if (this.mT <= 0) { this.mT = 0.3; this.checkMission(); }
    this.saveT -= dt;
    if (this.saveT <= 0) { this.saveT = 6; this.save(); }

    this.statusT -= dt;
    if (this.statusT <= 0) {
      this.statusT = 0.2;
      const st = this.getStatus();
      const key = JSON.stringify(st);
      if (key !== this.statusKey) { this.statusKey = key; this.onStatus(st); }
    }
  }

  getStatus(): Status {
    const p = this.player;
    const m = MISSIONS[this.mIdx];
    return {
      mode: p.speed < 20 ? 'IDLE' : this.runInput ? 'RUN' : 'WALK',
      speed: Math.round(p.speed / 5) * 5, carry: p.carry.length, max: p.maxCarry, skid: p.skidding, fishing: this.fPhase !== 'idle',
      pond: this.pond.length, pondCap: this.pondCap(), table: this.table.length, tableCap: TABLE.cap,
      tray: this.sushiIn.length, trayCap: TRAY.cap, sushi: this.sushiDisp.length, sushiCap: DISP.cap,
      mango: this.mangoStock.length, mangoCap: MANGO.cap,
      crabOn: this.isDone('crab'), iceOn: this.isDone('ice'), crab: this.crabStock.length, crabCap: COOK.cap, rawIn: this.cookIn + (this.cooking ? 1 : 0),
      juiceOn: this.isDone('juice'), juice: this.juiceStock.length, juiceCap: JUICE.cap, assist: this.assistN, boatOn: this.isDone('boat'), level: Math.min(20, this.mIdx + 1),
      money: this.money, sushiOn: this.isDone('sushi'), orchardOn: this.isDone('orchard'), cashierOn: this.isDone('cashier'),
      skin: this.skin, hat: this.hat, skatesOwned: this.skatesOwned, skatesOn: this.skatesOn, boardOwned: this.boardOwned, boardOn: this.boardOn, treasure: !!this.treasure, cat: { ...CAT_CFG },
      zone2Stalls: [...this.zone2Stalls],
      mission: m
        ? { text: m.text, prog: Math.min(m.goal, m.get(this)), goal: m.goal, reward: m.reward, done: false }
        : { text: 'Semua misi selesai! 🎉', prog: 1, goal: 1, reward: 0, done: true },
      ups: UPS.map((u) => {
        const lvl = this.upLvl[u.id];
        const max = u.costs.length;
        return { id: u.id, name: u.name, icon: u.icon, lvl, max, cost: lvl < max ? u.costs[lvl] : 0, desc: lvl < max ? u.desc(lvl) : 'MAX' };
      }),
    };
  }

  private collide(m: Cat, px: number, py: number) {
    const rad = 11;
    const lv = this.level;
    // All zones are seamlessly open and walkable! Highway road begins at ROAD_X
    m.x = clamp(m.x, MINX + 40, ROAD_X - 10);
    m.y = clamp(m.y, MIN_Y, ZY + MAX_Y);
    if (!walkable(m.x, m.y, lv, m.board)) {
      if (walkable(px, m.y, lv, m.board)) { m.x = px; m.vx = 0; }
      else if (walkable(m.x, py, lv, m.board)) { m.y = py; m.vy = 0; }
      else { m.x = px; m.y = py; m.vx = 0; m.vy = 0; }
    }
    pushOut(m, TABLE.x, TABLE.y - 4, TABLE.w, TABLE.h + 4, rad);
    if (this.isDone('sushi')) pushOut(m, SUSHI.x, SUSHI.y - 4, SUSHI.w, SUSHI.h + 4, rad);
    if (this.isDone('orchard')) {
      pushOut(m, MANGO.x, MANGO.y - 4, MANGO.w, MANGO.h + 4, rad);
      for (const t of this.trees) pushOut(m, t.x - 8, t.y - 6, 16, 10, rad);
    }
    pushOut(m, COUNTER.x, COUNTER.y - 4, COUNTER.w, COUNTER.h + 4, rad);
    // Signs collision (posts and boards)
    pushOut(m, 3120 - 115, 330, 230, 48, rad); // SELAMAT DATANG board beside Lapak Udang Bakar
    pushOut(m, 3120 - 95, 378, 14, 60, rad);   // post left
    pushOut(m, 3120 + 81, 378, 14, 60, rad);   // post right
    pushOut(m, BUS_STOP.x - 22, BUS_STOP.y - 45, 44, 52, rad); // Bus stop shelter
    pushOut(m, BUS_POS.x - 46, BUS_POS.y - 110, 92, 220, rad); // 2x Cat Bus in bus bay
    pushOut(m, 600, 90, 380, 80, rad); // CAT FISH MARKET board
    pushOut(m, 616, 170, 14, 60, rad); // post left
    pushOut(m, 952, 170, 14, 60, rad); // post right
    if (this.isDone('crab')) { pushOut(m, COOK.x, COOK.y - 4, COOK.w, COOK.h + 4, rad); pushOut(m, PEN.x - 4, PEN.y - 4, PEN.w + 8, PEN.h + 6, rad); }
    if (this.isDone('ice')) pushOut(m, ICE.x, 280, ICE.w, 68, rad);
    if (this.isDone('juice')) { pushOut(m, JUICE.x, JUICE.y - 4, JUICE.w, JUICE.h + 4, rad); for (const t of this.juiceTrees) pushOut(m, t.x - 8, t.y - 6, 16, 10, rad); }
    pushOut(m, POND.x - 6, POND.y - 6, POND.w + 12, POND.h + 12, rad);
  }

  // ------------------------------------------------ sea life
  private updateCrab(dt: number) {
    const c = this.crab;
    c.t += dt;
    c.pause -= dt;
    if (c.pause <= 0) {
      if (c.mv > 0.5 || Math.random() < 0.4) { c.mv = 0; c.pause = rr(0.8, 2.4); }
      else { c.mv = 1; c.pause = rr(1.2, 3); if (Math.random() < 0.5) c.dir = -c.dir; }
    }
    c.y += c.dir * c.mv * 36 * dt;
    if (c.y < 580) c.dir = 1;
    if (c.y > 780) c.dir = -1;
    c.x = shoreX(c.y) + 66;
  }

  private updateSea(dt: number) {
    const huntMul = 1 + 0.3 * this.upLvl.fish;
    for (const s of this.sils) {
      s.ph += dt * (5 + s.speed * 0.1);
      if (s.gone) {
        s.resp -= dt;
        if (s.resp <= 0) Object.assign(s, newSwimmer(), { x: rr(MINX + 60, 20) });
        continue;
      }
      if (s.hunt) {
        const T = this.fTarget;
        // rises from the deep into full colour as it closes in on the bobber
        s.depth = Math.max(0, s.depth - dt * (0.4 + 0.7 * clamp(1 - Math.hypot(T.x - s.x, T.y - s.y) / 320, 0, 1)));
        const mouthing = this.fPhase === 'wait' || this.fPhase === 'bite';
        const dx = T.x - s.x, dy = T.y - s.y;
        const d = Math.hypot(dx, dy);
        if (d > 22) {
          const sp = clamp(d * 3, 40, 190) * huntMul;
          const vx = (dx / d) * sp, vy = (dy / d) * sp;
          s.x += vx * dt; s.y += vy * dt;
          s.speed = sp;
          if (Math.abs(dx) > 10) s.dir = Math.sign(dx);
          s.pitch = clamp(Math.atan2(vy, Math.abs(vx) + 1), -0.6, 0.6);
        } else if (mouthing) {
          const bite = this.fPhase === 'bite';
          s.nib += dt * (bite ? 40 : 9);
          const amp = bite ? 3.2 : 2;
          const tx = T.x - s.dir * 17 + Math.sin(s.nib) * amp;
          const ty = T.y + 2 + Math.cos(s.nib * 0.7) * amp * 0.6;
          s.x += (tx - s.x) * Math.min(1, dt * 8);
          s.y += (ty - s.y) * Math.min(1, dt * 8);
          s.speed = 14;
          s.pitch = Math.sin(s.nib) * (bite ? 0.35 : 0.12);
        } else {
          s.x += (dx / (d || 1)) * 50 * dt; s.y += (dy / (d || 1)) * 50 * dt;
        }
        s.face += (s.dir - s.face) * Math.min(1, dt * 9);
        continue;
      }
      s.depth += (s.dT - s.depth) * Math.min(1, dt * 0.55);
      s.t -= dt;
      if (s.t <= 0) {
        s.dT = rr(0.05, 1);
        if (Math.random() < 0.4) s.dir = -s.dir;
        s.ty = clamp(s.y + rr(-90, 90), 215, 1720);
        s.speed = rr(24, 54);
        s.t = rr(2.5, 6);
      }
      s.x += s.dir * s.speed * dt;
      const vyT = clamp((s.ty - s.y) * 0.5, -20, 20);
      s.vy += (vyT - s.vy) * Math.min(1, dt * 2);
      s.y += s.vy * dt;
      s.y = clamp(s.y, 205, 1730);
      if (s.x < MINX + 50) { s.dir = 1; s.t = rr(2, 5); }
      if (s.x > shoreX(s.y) - 70) { s.dir = -1; s.t = rr(2, 5); }
      s.face += (s.dir - s.face) * Math.min(1, dt * 5);
      s.pitch += (clamp(Math.atan2(s.vy, s.speed), -0.5, 0.5) - s.pitch) * Math.min(1, dt * 4);
      s.bubT -= dt;
      if (s.bubT <= 0) {
        s.bubT = rr(1.5, 4);
        if (this.parts.length < 260) this.parts.push({ x: s.x + s.dir * 20, y: s.y - 4, vx: 0, vy: -20, life: 1.3, max: 1.3, r: rr(1.8, 3.2), kind: 'bub', ang: 0 });
      }
    }
    this.rippleT -= dt;
    if (this.rippleT <= 0) {
      this.rippleT = 0.6;
      const s = this.sils[Math.floor(Math.random() * this.sils.length)];
      if (!s.gone) this.ripples.push({ x: s.x, y: s.y, t: 0, max: 1.1, r: 16, pond: false });
    }
    for (const g of this.gulls) {
      if (g.delay > 0) { g.delay -= dt; continue; }
      g.x += g.dir * g.sp * dt;
      g.ph += dt * 7;
      if ((g.dir > 0 && g.x > WORLD_W + 90) || (g.dir < 0 && g.x < MINX - 90)) {
        g.dir = Math.random() < 0.5 ? 1 : -1;
        g.x = g.dir > 0 ? MINX - 90 : WORLD_W + 90;
        g.y = rr(220, 1700);
        g.sp = rr(70, 115);
        g.delay = rr(2, 8);
      }
    }
  }

  // ------------------------------------------------ fishing
  private cancelFishing() {
    this.fPhase = 'idle';
    this.bobOn = false;
    this.bobFly = false;
    this.player.rod.on = false;
    this.player.rod.raise = 0;
    if (this.fSil) { this.fSil.hunt = false; this.fSil = null; }
    this.fCd = 0.25;
    this.fFlyer = null;
  }

  private updateFishing(dt: number, inSpot: number) {
    const p = this.player;
    const rod = p.rod;
    this.fCd -= dt;
    const ws = this.rodWs();

    if (this.fPhase === 'idle') {
      rod.on = false;
      const still = p.speed < 45;
      p.look = inSpot >= 0 && still ? LOOK_SEA : null;
      if (inSpot >= 0 && still && this.fCd <= 0 && !this.pondFull()) {
        this.fPhase = 'cast';
        this.fT = 0;
        this.fSpot = inSpot;
        this.fLaunched = false;
        this.fFlySet = false;
        rod.on = true;
        rod.raise = 0;
        this.fTarget = { x: SPOTS[inSpot].x - rr(140, 200), y: SPOTS[inSpot].y + rr(-14, 14) };
        this.fFlyer = null;
      }
      return;
    }

    if (inSpot !== this.fSpot || p.speed > 70) { this.cancelFishing(); return; }
    p.look = LOOK_SEA;
    rod.on = true;
    this.fT += dt;
    const t = this.fT;
    const bendTo = (v: number) => { rod.bend += (v - rod.bend) * Math.min(1, dt * 12); };

    if (this.fPhase === 'cast') {
      if (t < 0.3) { const k = t / 0.3; rod.raise = (1 - (1 - k) * (1 - k)) * 1.5; }
      else if (t < 0.42) rod.raise = 1.5 - ((t - 0.3) / 0.12) * 1.8;
      else rod.raise = -0.3 * (1 - clamp((t - 0.42) / 0.4, 0, 1));
      bendTo(t > 0.3 && t < 0.62 ? 1 : 0);
      if (t < 0.3) p.tug = -0.5 * (t / 0.3);
      if (!this.fLaunched && t >= 0.42) {
        this.fLaunched = true;
        this.bobOn = true;
        this.bobFly = true;
        this.bobT = 0;
        this.bobStart = { x: rod.wx, y: rod.wy };
        this.bob = { ...this.bobStart };
        sfx.blip(500, 250, 0.18, 'sine', 0.12);
      }
      if (this.bobFly) {
        this.bobT += dt / 0.55;
        const e = clamp(this.bobT, 0, 1);
        this.bob = {
          x: this.bobStart.x + (this.fTarget.x - this.bobStart.x) * e,
          y: this.bobStart.y + (this.fTarget.y - this.bobStart.y) * e - Math.sin(e * Math.PI) * 55,
        };
        if (this.bobT >= 1) {
          this.bobFly = false;
          this.bob = { ...this.fTarget };
          this.splash(this.fTarget.x, this.fTarget.y, 6, 0.6);
          sfx.splash(0.5);
          this.fPhase = 'wait';
          this.fT = 0;
          this.fRipT = 0;
          let best: Swimmer | null = null, bd = 1e9;
          for (const s of this.sils) {
            if (s.gone || s.hunt) continue;
            const d = Math.hypot(s.x - this.fTarget.x, s.y - this.fTarget.y);
            if (d < bd) { bd = d; best = s; }
          }
          if (best && bd > 260) {
            best.x = this.fTarget.x - rr(110, 190);
            best.y = clamp(this.fTarget.y + rr(-70, 70), 215, 780);
            best.dir = 1;
          }
          this.fSil = best;
          if (best) best.hunt = true;
        }
      }
      return;
    }

    if (this.fPhase === 'wait') {
      rod.raise += (0 - rod.raise) * Math.min(1, dt * 8);
      const near = this.fSil ? Math.hypot(this.fSil.x - this.fTarget.x, this.fSil.y - this.fTarget.y) : 999;
      const nib = Math.max(0, Math.sin(t * 7)) * (near < 45 ? 0.45 : 0.1);
      bendTo(0.15 + nib);
      this.bob = { x: this.fTarget.x, y: this.fTarget.y + Math.sin(t * 3) * 1.3 + nib * 2.5 };
      this.fRipT -= dt;
      if (this.fRipT <= 0) { this.fRipT = 0.9; this.ripples.push({ x: this.fTarget.x, y: this.fTarget.y + 2, t: 0, max: 1, r: 14, pond: false }); }
      let arrived = false;
      if (this.fSil) arrived = near < 24 && t > 1.2 * ws;
      else arrived = t > 1.6 * ws;
      if (arrived || t > 7) {
        this.fPhase = 'bite';
        this.fT = 0;
        this.fType = this.fSil ? this.fSil.type : randomFishType();
        p.alert = 1;
        sfx.alert();
        this.splash(this.fTarget.x, this.fTarget.y, 5, 0.5);
      }
      return;
    }

    if (this.fPhase === 'bite') {
      bendTo(0.9);
      rod.raise += (-0.1 - rod.raise) * Math.min(1, dt * 10);
      this.bob = { x: this.fTarget.x + Math.sin(t * 50) * 1.2, y: this.fTarget.y + 4 + Math.sin(t * 40) * 1.5 };
      p.alert = Math.max(p.alert, 0.6);
      if (t >= 0.55) { this.fPhase = 'reel'; this.fT = 0; this.fFlySet = false; p.tug = 1; }
      return;
    }

    // reel: hook set -> rip the fish out -> swing it over the head -> flick -> lands in the pond
    if (!this.fFlySet) {
      const k = clamp(t / 0.24, 0, 1);
      rod.raise = -0.1 + (1 - (1 - k) * (1 - k)) * 1.15;
      bendTo(1);
      p.tug = 1;
      this.bob = { x: this.fTarget.x, y: this.fTarget.y - k * 4 };
      if (t >= 0.24) {
        this.fFlySet = true;
        this.fLand = 0;
        this.bobOn = false;
        this.pondPending++;
        if (this.fSil) { this.fSil.gone = true; this.fSil.hunt = false; this.fSil.resp = rr(3, 6); this.fSil = null; }
        const type = this.fType;
        const from = { ...this.fTarget };
        const tgt = { x: POND.x + POND.w / 2 + rr(-26, 26), y: POND.y + POND.h / 2 + rr(-30, 30) };
        this.splash(from.x, from.y, 16, 1.3);
        sfx.splash(1);
        sfx.blip(300, 900, 0.18, 'triangle', 0.18);
        p.happy = 1;
        hopCat(p, 170);
        const before = this.flyers.length;
        this.fly({
          kind: 'item', ft: type, sx: from.x, sy: from.y, dur: 1.05, h: 115, to: () => tgt,
          done: () => {
            this.pondPending--;
            this.stats.caught++;
            this.pond.push({ type, a: rr(0, 6.28), sp: (Math.random() < 0.5 ? -1 : 1) * rr(0.6, 1.1), rr: rr(0.5, 0.95), ph: rr(0, 6), face: 1 });
            this.splash(tgt.x, tgt.y, 10, 0.9, true);
            this.pondShake = 1;
            sfx.splash(0.8);
            p.happy = 1;
            hopCat(p, 130);
            if (Math.random() < 0.85) sfx.meow('mew', 1.3, 0.8);
          },
        });
        this.fFlyer = this.flyers[before];
      }
      return;
    }
    const fl = this.fFlyer;
    if (fl && this.flyers.includes(fl)) {
      const ft = clamp(fl.t, 0, 1);
      const up = Math.sin(clamp(ft / 0.55, 0, 1) * Math.PI / 2);
      const snap = clamp((ft - 0.72) / 0.28, 0, 1);
      rod.raise = 1.05 + 0.85 * up - snap * 1.3;
      bendTo(ft < 0.72 ? 0.8 : -0.5);
      if (ft < 0.5) p.tug = Math.max(p.tug, 0.8);
    } else {
      this.fLand += dt;
      rod.raise += (0 - rod.raise) * Math.min(1, dt * 9);
      bendTo(0);
      if (this.fLand > 0.4) { this.fPhase = 'idle'; rod.on = false; this.fFlyer = null; this.fCd = 0.35; }
    }
  }

  // ------------------------------------------------ sushi chef
  private cutXs() { return this.ch.fish === 4 ? [6, -8, -1] : [10, -14, -2]; }

  private updateChef(dt: number) {
    if (!this.isDone('sushi')) return;
    const ch = this.ch;
    const c = this.chefCat;
    ch.t += dt;
    ch.bounce = Math.max(0, ch.bounce - dt * 7);
    for (let j = 0; j < 3; j++) if (ch.cutT[j] >= 0) ch.cutT[j] += dt;
    const sm = (cur: number, target: number, sp: number) => cur + (target - cur) * Math.min(1, dt * sp);
    let kTarget = -1;
    let holdT = 0, focusT = 0;

    if (ch.phase === 'idle') {
      kTarget = 0;
      if (this.sushiIn.length > 0 && this.sushiDisp.length + this.dispPending + 2 <= DISP.cap) {
        ch.fish = this.sushiIn.shift()!;
        ch.kind = ch.fish === 4 ? (Math.random() < 0.5 ? 8 : 9) : Math.random() < 0.4 ? 4 + ch.fish : ch.fish;
        ch.phase = 'fetch';
        ch.t = 0;
        ch.onBoard = false;
        ch.cuts = 0;
        ch.cutT = [-1, -1, -1];
        const from = this.traySlot(0);
        sfx.pop();
        this.fly({
          kind: 'item', ft: ch.fish, sx: from.x, sy: from.y, dur: 0.42, h: 36, to: () => ({ x: BC.x, y: BC.y }),
          done: () => { ch.onBoard = true; ch.bounce = 0.6; },
        });
      }
    } else if (ch.phase === 'fetch') {
      kTarget = 0; holdT = 1; focusT = 1;
      if (ch.onBoard && ch.t > 0.3) { ch.phase = 'chop'; ch.t = 0; }
    } else if (ch.phase === 'chop') {
      holdT = 1; focusT = 1;
      const P = 0.36;
      const tp = ch.t - 0.12;
      if (tp < 0) kTarget = 0.3;
      else if (tp >= 3 * P) {
        c.chef.k = 0;
        ch.phase = 'form'; ch.t = 0; ch.ev = 0;
        kTarget = 0;
      } else {
        const j = Math.min(2, Math.floor(tp / P));
        const u = tp / P - j;
        let k = 0;
        if (u < 0.55) k = easeOut(u / 0.55);
        else if (u < 0.7) k = 1 - (u - 0.55) / 0.15;
        c.chef.k = k;
        if (u >= 0.7 && ch.cuts <= j) {
          ch.cuts = j + 1;
          ch.cutT[j] = 0;
          ch.bounce = 1;
          c.sqV += 5;
          sfx.chop();
          this.sparks(BC.x + this.cutXs()[j] * FISH_S, BC.y, 5, 45);
        }
      }
    } else if (ch.phase === 'form') {
      kTarget = 0; holdT = ch.t < 0.25 ? 1 : 0; focusT = 1;
      if (ch.ev === 0) {
        ch.ev = 1;
        this.sparks(BC.x + 24 * FISH_S, BC.y, 6, 55);
        this.sparks(BC.x - 28 * FISH_S, BC.y, 6, 55);
        sfx.pop();
      }
      if (ch.ev === 1 && ch.t >= 0.65) {
        ch.ev = 2;
        this.sparks(BC.x - 14, BC.y + 8, 7, 50);
        this.sparks(BC.x + 14, BC.y + 8, 7, 50);
        sfx.coin();
        c.sqV += 4;
      }
      if (ch.ev === 2 && ch.t >= 0.95) {
        ch.ev = 3;
        const kind = ch.kind;
        for (let n = 0; n < 2; n++) {
          const idx = this.sushiDisp.length + this.dispPending;
          this.dispPending++;
          const tgt = this.dispSlot(idx);
          this.fly({
            kind: 'sushi', ft: kind, sx: BC.x + (n ? 14 : -14), sy: BC.y + 8, t: -n * 0.16, dur: 0.5, h: 50, to: () => tgt,
            done: () => {
              this.dispPending--;
              this.sushiDisp.push(kind);
              this.dispPop = 1;
              this.dispPopIdx = this.sushiDisp.length - 1;
              sfx.coin();
              this.sparks(tgt.x, tgt.y, 3, 30);
            },
          });
        }
        ch.phase = 'cheer';
        ch.t = 0;
        c.happy = 1.3;
        hopCat(c, 160);
        sfx.meow('mew', 1.25, 0.6);
      }
    } else {
      kTarget = 0;
      if (ch.t > 0.9) { ch.phase = 'idle'; ch.t = 0; }
    }
    if (kTarget >= 0) c.chef.k = sm(c.chef.k, kTarget, 12);
    c.chef.hold = sm(c.chef.hold, holdT, 10);
    c.focus = sm(c.focus, focusT, 8);
    postUpdate(c, dt, 0, 0, 0, 0, 0);
  }

  // ------------------------------------------------ customers
  private catH(m: Cat) { return catLayout(m.build).height * MS * m.size; }
  private chestOf(m: Cat) { return catLayout(m.build).chestY * MS * m.size; }

  private valueOf(c: Customer) {
    const mul = 1 + 0.12 * this.upLvl.price;
    const each = (t: number) => (c.kind === 'sushi' ? SUSHI_VALUE[t] : c.kind === 'crab' ? 46 : c.kind === 'juice' ? [34, 28, 26][t] ?? 28 : FISH_VALUE[t]);
    return Math.round(c.taken.reduce((a, t) => a + each(t), 0) * mul * c.mul);
  }

  private stockOf(k: Kind) {
    return k === 'fish' ? this.table : k === 'sushi' ? this.sushiDisp : k === 'mango' ? this.mangoStock : k === 'crab' ? this.crabStock : k === 'juice' ? this.juiceStock : this.iceStock;
  }
  private slotOf(k: Kind, i: number): Pt {
    return k === 'fish' ? this.tableSlot(i) : k === 'sushi' ? this.dispSlot(i) : k === 'mango' ? this.mangoSlot(i) : k === 'crab' ? crabSlot(i)
      : k === 'juice' ? cupSlot(i) : { x: VENDOR_POS.x + 22, y: VENDOR_POS.y - 26 };
  }
  private slotsOf(k: Kind): Pt[] { return k === 'fish' ? STALLQ : k === 'sushi' ? SUSHIQ : k === 'mango' ? MANGOQ : k === 'crab' ? CRABQ : k === 'juice' ? JUICEQ : ICEQ; }

  private moodOf(c: Customer): Mood {
    if (c.happyT > 0 || c.state === 'pay') return 'happy';
    if (c.drool && (c.kind === 'sushi' || c.kind === 'crab') && this.crabStock.length > 0 && (c.state === 'q1' || c.state === 'q2')) return 'drool';
    if (c.waitT < 11) return 'happy';
    return c.waitT < 24 ? 'sleepy' : 'sad';
  }

  /** neat stream of bills: same start point, same arc, one after another, flat, landing in an orderly stack */
  private sendBills(from: Pt, sum: number) {
    const bills = clamp(Math.ceil(sum / 14), 2, 6);
    let rest = sum;
    for (let b = 0; b < bills; b++) {
      const amt = b === bills - 1 ? rest : Math.floor(sum / bills);
      rest -= amt;
      const idx = this.stack.length + this.stackPending++;
      const tgt = billPos(idx);
      this.fly({
        kind: 'bill', sx: from.x, sy: from.y, t: -b * 0.12, dur: 0.46, h: 46, spin: 0, sc: 1.15, to: () => tgt,
        done: () => {
          this.stackPending--;
          if (this.stack.length < 150) this.stack.push(amt); else this.stack[this.stack.length - 1] += amt;
          this.stackSum += amt;
          this.landT = 0;
          sfx.coin();
          if (this.hq) this.sparks(tgt.x, tgt.y - 6, 2, 26, ['#9bffaa', '#ffffff']);
        },
      });
    }
  }

  private spawnCustomer(): boolean {
    const opts: Kind[] = [];
    if (this.qs.fish.length < 4) opts.push('fish', 'fish');
    if (this.isDone('sushi') && this.qs.sushi.length < 3) opts.push('sushi', 'sushi');
    if (this.isDone('orchard') && this.qs.mango.length < 3) opts.push('mango');
    if (this.isDone('crab') && this.qs.crab.length < 2) opts.push('crab', 'crab');
    if (this.isDone('ice') && this.qs.ice.length < 2) opts.push('ice', 'ice');
    if (this.isDone('juice') && this.qs.juice.length < 2) opts.push('juice', 'juice');
    if (!opts.length || this.customers.length >= 11) return false;
    const kind = opts[Math.floor(Math.random() * opts.length)];
    const r = Math.random();
    const variant: Variant = r < 0.44 ? 'normal' : r < 0.6 ? 'fat' : r < 0.72 ? 'rich' : r < 0.87 ? 'kid' : 'kitten';
    let pal: Pal = CUSTOMER_PALS[Math.floor(Math.random() * CUSTOMER_PALS.length)];
    let mul = 1, want = 1 + Math.floor(Math.random() * 3), speed = rr(105, 125);
    if (variant === 'rich') {
      const suits = ['#2f66c7', '#f1f4fa', '#f0bd2c', '#2b2833'], necks = ['#ffd24a', '#e8453c', '#2b2833', '#ff6fa5'];
      const si = Math.floor(Math.random() * suits.length);
      pal = { ...pal, tie: undefined, bow: undefined, suit: suits[si], necktie: necks[si], glasses: true };
      mul = 1.8; want = 3 + Math.floor(Math.random() * 2); speed *= 0.95;
    } else {
      const a = Math.random();
      const acc: Partial<Pal> = {};
      if (a < 0.2) acc.topper = 'pirate'; else if (a < 0.4) acc.topper = 'beach'; else if (a < 0.55) acc.topper = 'visor';
      if (Math.random() < 0.3) acc.lei = true;
      if (Math.random() < 0.26) acc.shades = (['heart', 'star', 'round', 'retro'] as const)[Math.floor(Math.random() * 4)];
      pal = { ...pal, ...acc, ...(acc.topper ? { bow: undefined } : {}) };
      if (variant === 'fat') { want = 3 + Math.floor(Math.random() * 3); speed *= 0.85; }
      else if (variant === 'kid') { want = 1; speed *= 1.12; mul = 0.9; }
      else if (variant === 'kitten') { want = 1; speed *= 1.05; mul = 0.8; }
    }
    // Customer cats arrive by stepping off the Beach Cat Bus parked at the highway!
    const m = makeCat(BUS_DOOR.x, BUS_DOOR.y, pal);
    m.happy = 1;
    if (variant === 'fat') { m.build = { bellyW: 2.1, bellyH: 1.18, head: 1.06, legs: 0.95, legGap: 1.35 }; m.size = 1.05; }
    else if (variant === 'kid') { m.build = { head: 1.32, eyeSize: 1.14, bellyH: 0.95, bellyW: 1.0, legs: 0.9, eyeGap: 1.05 }; m.size = 0.74; }
    else if (variant === 'kitten') { m.build = { head: 1.5, eyeSize: 1.26, bellyH: 0.82, bellyW: 0.95, legs: 0.7, earHeight: 0.9 }; m.size = 0.52; }
    // Walk off the bus door, across the sidewalk curb, and into the market plaza
    const way: Pt[] = [
      { x: 3240, y: 520 },
      { x: 3040, y: 520 },
      { x: 1760, y: 520 },
      ...(kind === 'sushi' ? [{ x: 1295, y: 520 }, { x: 1295, y: 780 }]
        : kind === 'mango' ? [{ x: 850, y: 520 }, { x: 850, y: 700 }]
        : kind === 'crab' ? [{ x: 1612, y: 520 }, { x: 1612, y: 430 }]
        : kind === 'ice' ? [{ x: 1660, y: 520 }, { x: 1660, y: 470 }]
        : kind === 'juice' ? [{ x: 1266, y: 520 }, { x: 1266, y: 780 }]
        : [{ x: 965, y: 520 }, { x: 905, y: 520 }])
    ];
    const c: Customer = {
      m, kind, variant, mul, state: 'q1', want, taken: [], pending: 0, timer: 0.6, speed, way, arrived: false,
      waitT: 0, drool: Math.random() < 0.5, happyT: 0, bubT: 0, uid: ++this.uidN,
    };
    this.customers.push(c);
    this.qs[kind].push(c);
    sfx.meow('mew', variant === 'kitten' ? rr(1.5, 1.9) : variant === 'kid' ? rr(1.25, 1.55) : variant === 'fat' ? rr(0.7, 0.85) : rr(0.85, 1.3), 0.45);
    return true;
  }

  private finishIce(c: Customer) {
    const m = c.m;
    this.qs.ice = this.qs.ice.filter((o) => o !== c);
    const lucky = Math.random() < 0.2;
    const bonus = Math.round(15 * c.taken.length * c.mul * (1 + 0.12 * this.upLvl.price) * (lucky ? 1.6 : 1));
    this.stats.iceSold += c.taken.length;
    this.sendBills({ x: VENDOR_POS.x + 6, y: VENDOR_POS.y - 34 }, bonus);
    this.texts.push({ x: VENDOR_POS.x, y: VENDOR_POS.y - 120, t: 0, text: 'BONUS +$' + bonus + (lucky ? ' 💖' : ''), color: '#ffd93b', big: true });
    sfx.cha();
    m.happy = 1.6; hopCat(m, 150);
    if (this.vendor) { this.vendor.happy = 1.2; hopCat(this.vendor, 140); }
    sfx.meow('meow', rr(0.95, 1.4), 0.7);
    c.state = 'leave'; c.happyT = 2.6; c.bubT = 0;
    c.way = [{ x: 1760, y: 520 }, { x: 3040, y: 520 }, { x: 3240, y: 520 }, { x: BUS_DOOR.x, y: BUS_DOOR.y }];
  }

  private updateCustomers(dt: number, payReady: boolean) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) this.spawnT = this.spawnCustomer() ? rr(3.4, 5.6) : 1;

    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      const m = c.m;
      const q = this.qs[c.kind];
      const slots = this.slotsOf(c.kind);
      c.bubT += dt;
      if (c.happyT > 0) c.happyT -= dt;
      if (c.state === 'q1' || c.state === 'q2') c.waitT += dt;
      let target: Pt = { x: m.x, y: m.y };
      let final = true;
      if (c.way.length) { target = c.way[0]; final = false; }
      else if (c.state === 'q1') target = slots[Math.max(0, q.indexOf(c))];
      else if (c.state === 'q2') target = CASHQ[Math.max(0, this.cashQ.indexOf(c))];
      else if (c.state === 'leave') target = { x: BUS_DOOR.x, y: BUS_DOOR.y };

      const dx = target.x - m.x, dy = target.y - m.y;
      const d = Math.hypot(dx, dy);
      if (!final && d < 10) c.way.shift();
      let tvx = 0, tvy = 0;
      if (d > 3) { const sp = final ? Math.min(c.speed, d * 8) : c.speed; tvx = (dx / d) * sp; tvy = (dy / d) * sp; }
      updateCat(m, dt, tvx, tvy, 700);
      if (m.stepSide >= 0 && m.speed > 80) {
        this.addPrint(m, 0.28);
        this.stepDust(m, false);
      }
      const arrivedSlot = final && d < 10;
      const hk = this.holdKind(c);
      m.hold = hk ? (m.fx > 0.5 ? -1 : 1) : 0;
      m.holdAng = hk === 'cone' ? 0.62 : hk === 'wagon' ? 0.5 : 0.24;
      if (hk === 'wagon') {
        const kk = MS * m.size, tx = m.x - m.side * 88 * kk, ty = m.y + 2;
        if (!c.wag) c.wag = { x: tx, y: ty };
        const a = Math.min(1, dt * 5);
        c.wag.x += (tx - c.wag.x) * a;
        c.wag.y += (ty - c.wag.y) * a;
      }

      if (c.state === 'q1') {
        // everybody in the line faces the stand (mango stall is on the left, the others are above)
        m.look = arrivedSlot ? (c.kind === 'mango' || c.kind === 'juice' ? { x: -1, y: 0 } : { x: 0, y: -1 }) : null;
        const atFront = q.indexOf(c) === 0 && arrivedSlot;
        if (atFront) {
          if (!c.arrived) { c.arrived = true; m.happy = 0.8; hopCat(m, 110); }
          c.timer -= dt;
          const src = this.stockOf(c.kind);
          const infinite = c.kind === 'ice';
          if (c.timer <= 0 && (infinite || src.length > 0) && c.taken.length + c.pending < c.want) {
            const type = infinite ? Math.floor(Math.random() * 3) : src.pop()!;
            const s = this.slotOf(c.kind, src.length);
            c.pending++;
            c.timer = infinite ? 0.75 : 0.55;
            sfx.pop();
            if (infinite && this.vendor) { hopCat(this.vendor, 90); this.vendor.happy = 0.8; }
            this.fly({
              kind: c.kind === 'sushi' ? 'sushi' : c.kind === 'juice' ? 'cup' : infinite ? 'cone' : 'item', ft: type, sx: s.x, sy: s.y, spin: infinite ? rr(-3, 3) : 0,
              to: () => ({ x: m.x, y: m.y - this.chestOf(m) }),
              done: () => {
                c.pending--; c.taken.push(type); m.happy = 0.9; m.sqV += 3; hopCat(m, 100);
                this.sparks(m.x, m.y - this.catH(m) * 0.7, 3, 28, ['#ff9ccc', '#ffffff']);
                if (c.taken.length === 1) sfx.meow('mew', rr(0.9, 1.2), 0.5);
              },
            });
          }
          if (c.taken.length >= c.want && c.pending === 0) {
            if (c.kind === 'ice') this.finishIce(c);
            else if (this.cashQ.length < 3) {
              q.shift();
              this.cashQ.push(c);
              c.state = 'q2';
              c.waitT = 0; c.bubT = 0;
              m.look = null;
              c.way = c.kind === 'fish' ? [{ x: 965, y: 440 }, { x: 965, y: 700 }] : c.kind === 'sushi' ? [{ x: 1295, y: 700 }]
                : c.kind === 'mango' ? [{ x: 850, y: 700 }] : c.kind === 'juice' ? [{ x: 1266, y: 702 }] : [{ x: 1612, y: 470 }, { x: 1612, y: 755 }];
            }
          }
        }
      } else if (c.state === 'q2') {
        m.look = arrivedSlot ? { x: 0, y: -1 } : null; // facing the counter
        if (this.cashQ.indexOf(c) === 0 && arrivedSlot && payReady) { c.state = 'pay'; c.timer = 0.5; c.bubT = 0; }
      } else if (c.state === 'pay') {
        c.timer -= dt;
        if (c.timer <= 0) {
          this.cashQ = this.cashQ.filter((o) => o !== c);
          const total = this.valueOf(c);
          if (c.kind === 'fish') this.stats.fishSold += c.taken.length;
          else if (c.kind === 'sushi') this.stats.sushiSold += c.taken.length;
          else if (c.kind === 'crab') this.stats.crabSold += c.taken.length;
          else if (c.kind === 'juice') this.stats.juiceSold += c.taken.length;
          else this.stats.mangoSold += c.taken.length;
          const tip = Math.random() < (c.variant === 'rich' ? 0.4 : 0.14);
          const sum = total + (tip ? Math.round(total * 0.3) : 0);
          this.sendBills({ x: m.x, y: m.y - this.chestOf(m) * 1.1 }, sum);
          sfx.cha();
          if (this.cashier) { this.cashier.happy = 1; hopCat(this.cashier, 130); }
          if (tip) this.texts.push({ x: m.x, y: m.y - this.catH(m) - 10, t: 0, text: 'TIP! 💖', color: '#ff9ccc', big: true });
          m.happy = 1.5;
          hopCat(m, 150);
          sfx.meow('meow', rr(0.9, 1.25), 0.8);
          c.state = 'leave'; c.happyT = 2.4; c.bubT = 0;
          m.look = null;
          c.way = [{ x: 1760, y: 520 }, { x: 3040, y: 520 }, { x: 3240, y: 520 }, { x: BUS_DOOR.x, y: BUS_DOOR.y }];
        }
      } else if (c.state === 'leave' && final && Math.hypot(m.x - BUS_DOOR.x, m.y - BUS_DOOR.y) < 22) {
        // Customer hops onto the Beach Cat Bus to go home!
        hopCat(m, 120);
        sfx.meow('mew', 1.2, 0.45);
        this.customers.splice(i, 1);
      }
    }
  }

  // ------------------------------------------------ crab chain: seaweed farm -> crab pen -> cooker -> customers
  private steam(x: number, y: number, n: number) {
    for (let i = 0; i < n && this.parts.length < 300; i++) {
      this.parts.push({ x: x + rr(-3, 3), y, vx: rr(-5, 5), vy: -rr(16, 30), life: rr(1.0, 1.6), max: 1.6, r: rr(3, 5), kind: 'steam', ang: 0 });
    }
  }

  private updateCrabChain(dt: number, p: Cat) {
    if (!this.isDone('crab')) return;
    const roomNow = () => p.carry.length + this.pendingCarry < p.maxCarry;

    // wading through the shallows
    if (inside(p, FARM_BOX) && p.x < 392 && p.speed > 35) {
      this.wadeT -= dt;
      if (this.wadeT <= 0) {
        this.wadeT = 0.2;
        this.ripples.push({ x: p.x, y: p.y + 2, t: 0, max: 0.8, r: 14, pond: false });
        if (Math.random() < 0.4) this.splash(p.x + rr(-6, 6), p.y, 2, 0.35);
      }
    }

    // seaweed beds: walk in to plant, wait to grow, walk through again to harvest
    FARM_PLOTS.forEach((R, i) => {
      const pl = this.plots[i];
      pl.cd -= dt; pl.pop = Math.max(0, pl.pop - dt * 3);
      if (pl.state === 'grow') {
        pl.g = Math.min(1, pl.g + dt / 9);
        if (pl.g >= 1) { pl.state = 'ripe'; this.sparks(R.x + R.w / 2, R.y + R.h / 2, 8, 40, ['#9bffaa', '#ffffff']); sfx.blip(660, 990, 0.1, 'sine', 0.12); }
      }
      const on = p.x > R.x - 4 && p.x < R.x + R.w + 4 && p.y > R.y - 4 && p.y < R.y + R.h + 14;
      if (!on) return;
      if (pl.state === 'empty' && pl.cd <= 0) {
        pl.state = 'grow'; pl.g = 0.06; pl.pop = 1; sfx.pop();
        this.splash(R.x + R.w / 2, R.y + R.h / 2, 5, 0.5);
        this.sparks(R.x + R.w / 2, R.y + R.h / 2, 4, 30, ['#9bffaa', '#ffffff']);
      } else if (pl.state === 'ripe' && roomNow() && this.pickCd <= 0) {
        pl.state = 'empty'; pl.g = 0; pl.cd = 1.6; this.pickCd = 0.16; this.pendingCarry++;
        this.splash(R.x + R.w / 2, R.y + R.h / 2, 8, 0.8);
        sfx.splash(0.5);
        this.fly({
          kind: 'item', ft: 5, sx: R.x + R.w / 2, sy: R.y + R.h / 2, h: 46, to: () => this.basketPos(p),
          done: () => { this.pendingCarry--; p.carry.push(5); p.sqV += 3; },
        });
      }
    });

    // crab pen
    for (const c of this.pen) {
      c.hop = Math.max(0, c.hop - dt * 3); c.eat = Math.max(0, c.eat - dt * 1.6);
      const dxm = c.tx - c.x;
      const moving = Math.abs(dxm) > 2;
      c.t += dt * (moving ? 1 : 0.2);
      if (moving) {
        c.dir = dxm > 0 ? 1 : -1;
        c.x += Math.sign(dxm) * Math.min(Math.abs(dxm), 26 * dt);
        c.y += clamp(c.ty - c.y, -10 * dt, 10 * dt);
      } else {
        c.pause -= dt;
        if (c.pause <= 0) { c.tx = rr(PEN.x + 20, PEN.x + PEN.w - 20); c.ty = rr(PEN.y + 28, PEN.y + PEN.h - 16); c.pause = rr(0.6, 2.2); }
      }
      // Effortless harvesting: standing anywhere near the crab pond instantly scoops ripe crabs!
      const nearPond = inside(p, PEN_ZONE) || Math.hypot(p.x - (PEN.x + PEN.w / 2), p.y - (PEN.y + PEN.h / 2)) < 140;
      if (c.g >= 1 && nearPond && this.pickCd <= 0 && roomNow()) {
        c.g = 0.12; c.feedPend = 0; c.hop = 1.4; this.pickCd = 0.14; this.pendingCarry++;
        this.sparks(c.x, c.y - 14, 10, 55, ['#ffe45c', '#ffffff', '#ff9a40']);
        sfx.pop();
        this.fly({
          kind: 'item', ft: 6, sx: c.x, sy: c.y - 12, h: 50, to: () => this.basketPos(p),
          done: () => { this.pendingCarry--; p.carry.push(6); p.sqV += 3; },
        });
      }
    }
    // feed seaweed to the crabs
    if (inside(p, PEN_ZONE) && this.dropCd <= 0 && this.hasCarry(p, (t) => t === 5)) {
      const need = (c: PenC) => c.g + 0.34 * c.feedPend;
      const cr = this.pen.filter((c) => need(c) < 0.99).sort((a, b) => need(a) - need(b))[0];
      if (cr) {
        this.dropCd = 0.16;
        const from = this.basketPos(p);
        this.takeCarry(p, (t) => t === 5);
        cr.feedPend++;
        sfx.pop();
        this.fly({
          kind: 'item', ft: 5, sx: from.x, sy: from.y, dur: 0.42, h: 46, to: () => ({ x: cr.x, y: cr.y - 10 }),
          done: () => {
            cr.feedPend = Math.max(0, cr.feedPend - 1);
            cr.g = Math.min(1, cr.g + 0.34); cr.eat = 1; cr.hop = 0.8;
            this.sparks(cr.x, cr.y - 14, 5, 34, ['#9bffaa', '#ff9ccc', '#ffffff']);
            sfx.blip(520, 880, 0.1, 'triangle', 0.14);
            if (cr.g >= 1) this.texts.push({ x: cr.x, y: cr.y - 56, t: 0, text: 'SIAP PANEN!', color: '#ffe45c' });
          },
        });
      }
    }

    // raw crab -> cooker
    if (inside(p, COOK_ZONE) && this.dropCd <= 0 && this.cookIn + this.cookPending < 4 && this.hasCarry(p, (t) => t === 6)) {
      this.dropCd = 0.16;
      const from = this.basketPos(p);
      this.takeCarry(p, (t) => t === 6);
      this.cookPending++;
      sfx.pop();
      this.fly({
        kind: 'item', ft: 6, sx: from.x, sy: from.y, dur: 0.45, h: 52, to: () => ({ x: COOK_POT.x, y: COOK_POT.y - 8 }),
        done: () => { this.cookPending--; this.cookIn++; this.steam(COOK_POT.x, COOK_POT.y - 8, 3); },
      });
    }
    if (!this.cooking && this.cookIn > 0 && this.crabStock.length + this.crabPending < COOK.cap) {
      this.cooking = true; this.cookT = 0; this.cookIn--;
      sfx.blip(300, 600, 0.15, 'triangle', 0.12);
    }
    if (this.cooking) {
      this.cookT += dt;
      this.steamT -= dt;
      if (this.steamT <= 0) { this.steamT = 0.07; this.steam(COOK_POT.x + rr(-14, 14), COOK_POT.y - 8, 1); this.steam(COOK_POT.x + 24, 178, 1); }
      if (this.cookT >= 3.2) {
        this.cooking = false;
        const tgt = crabSlot(this.crabStock.length + this.crabPending);
        this.crabPending++;
        sfx.pop();
        this.sparks(COOK_POT.x, COOK_POT.y - 14, 8, 50, ['#ffe45c', '#ff9a8a', '#ffffff']);
        this.fly({
          kind: 'item', ft: 7, sx: COOK_POT.x, sy: COOK_POT.y - 12, dur: 0.55, h: 60, to: () => tgt,
          done: () => {
            this.crabPending--;
            this.crabStock.push(7);
            this.sparks(tgt.x, tgt.y, 6, 40, ['#ffe45c', '#ffffff', '#ff9a8a']);
            sfx.coin();
            this.steam(tgt.x, tgt.y - 8, 5);
          },
        });
      }
    }
    // gentle warm steam rising from the finished crabs
    if (this.crabStock.length > 0) {
      this.warmT -= dt;
      if (this.warmT <= 0) { this.warmT = 0.2; const q = crabSlot(Math.floor(Math.random() * this.crabStock.length)); this.steam(q.x + rr(-4, 4), q.y - 12, 1); }
    }
  }

  // ------------------------------------------------ render
  private buildLayers() {
    const paint: Record<string, (c: CanvasRenderingContext2D) => void> = {
      pier: paintPier, table: paintTable, counter: paintCounter, sushi: paintSushi, mango: paintMango, ice: paintIceStall, cook: paintCooker, juice: paintJuiceStall,
    };
    for (const name of this.dirty) {
      const L = (this.layers as Record<string, Layer>)[name];
      if (!L) continue;
      if (name === 'sushi' && !this.isDone('sushi')) { L.cv = null; continue; }
      if (name === 'mango' && !this.isDone('orchard')) { L.cv = null; continue; }
      if (name === 'ice' && !this.isDone('ice')) { L.cv = null; continue; }
      if (name === 'cook' && !this.isDone('crab')) { L.cv = null; continue; }
      if (name === 'juice' && !this.isDone('juice')) { L.cv = null; continue; }
      L.build(this.lres, paint[name]);
    }
    this.dirty.clear();
  }

  private render() {
    const ctx = this.ctx;
    this.frameN++;
    if (this.dirty.size) this.buildLayers();
    const eff = this.dprMax * this.rs;
    const s = this.scale * eff;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const vw = this.W / this.scale, vh = this.H / this.scale;
    const WW = WORLD_W - MINX;
    let cx = this.cam.x - vw / 2, cy = this.cam.y - vh / 2;
    cx = vw >= WW ? MINX + (WW - vw) / 2 : clamp(cx, MINX, WORLD_W - vw);
    cy = vh >= WORLD_H ? (WORLD_H - vh) / 2 : clamp(cy, 0, WORLD_H - vh);
    const V = this.V;
    V.x0 = cx; V.y0 = cy; V.x1 = cx + vw; V.y1 = cy + vh;
    ctx.fillStyle = '#43b8ee';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(s, 0, 0, s, -cx * s, -cy * s);
    if (!this.seaGrad) this.seaGrad = makeSeaGradient(ctx);
    const inV = (x: number, y: number, pad: number) => x + pad > V.x0 && x - pad < V.x1 && y + pad > V.y0 && y - pad < V.y1;

    const L = this.layers;
    this.drawTerrain(ctx, V);
    drawSea(ctx, V, this.time, this.hq, this.seaGrad, this.sils, this.ripples);
    L.pier.draw(ctx, V);
    if (L.pier.visible(V)) drawPierRipples(ctx, this.time);
    if (this.isDone('crab')) FARM_PLOTS.forEach((R, i) => { if (inV(R.x + 54, R.y + 23, 80)) drawFarmBed(ctx, R, this.plots[i].state, this.time, i); });
    this.drawGhosts(ctx, V);
    this.drawGhosts2(ctx, V);
    this.drawPads(ctx, V, inV);
    this.drawZones(ctx, V);
    this.drawPrints(ctx, inV);

    for (const q of this.parts) {
      if (q.kind !== 'dust' && q.kind !== 'bub' && q.kind !== 'grain') continue;
      if (!inV(q.x, q.y, 20)) continue;
      const a = clamp(q.life / q.max, 0, 1);
      if (q.kind === 'dust') {
        const rr2 = q.r * (1.5 - a * 0.5);
        ctx.globalAlpha = a * 0.85;
        ctx.fillStyle = '#fff7de';
        ctx.strokeStyle = 'rgba(206,166,92,.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(q.x, q.y, rr2, 0, PI2);
        ctx.fill();
        ctx.stroke();
      } else if (q.kind === 'grain') {
        ctx.globalAlpha = Math.min(1, a * 1.6);
        ctx.fillStyle = '#d3a95a';
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r, 0, PI2);
        ctx.fill();
      } else {
        ctx.globalAlpha = Math.min(1, a * 1.6) * 0.8;
        ctx.strokeStyle = '#eafcff';
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(q.x + Math.sin(q.life * 6) * 2, q.y, q.r, 0, PI2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    const sushiU = this.unls[2], orchU = this.unls[3], cashU = this.unls[4];
    const items = this.renderItems;
    items.length = 0;
    if (inV(POND.x + 60, POND.y + 60, 140)) items.push({ y: POND.y + POND.h + 8, draw: () => this.drawPond(ctx) });
    if (inV(TABLE.x + 130, TABLE.y, 190)) items.push({ y: TABLE.y + TABLE.h, draw: () => this.drawTable(ctx, V) });
    if (sushiU.done && inV(SUSHI.x + 170, SUSHI.y, 260)) {
      items.push({ y: SUSHI.y + SUSHI.h - 20, draw: () => this.drawSushiBar(ctx, V) });
    }
    if (orchU.done && inV(MANGO.x + 100, MANGO.y, 200)) items.push({ y: MANGO.y + MANGO.h, draw: () => this.drawMangoStall(ctx, V) });
    if (orchU.done) {
      this.trees.forEach((tr, i) => {
        if (inV(tr.x, tr.y, 150)) items.push({ y: tr.y, draw: () => drawMangoTree(ctx, tr.x, tr.y, this.time, tr.fruit, tr.pop, clamp((orchU.bt - i * 0.15) / 0.7, 0, 1)) });
      });
    }
    const juiceU = this.unls[7];
    if (juiceU.done) {
      if (inV(JUICE.x + 110, JUICE.y, 200)) items.push({ y: JUICE.y + JUICE.h, draw: () => this.drawJuiceStall(ctx, V) });
      this.juiceTrees.forEach((tr, i) => {
        if (inV(tr.x, tr.y, 150)) items.push({ y: tr.y, draw: () => drawFruitTree(ctx, tr.x, tr.y, this.time, tr.fruit, tr.pop, clamp((juiceU.bt - i * 0.15) / 0.7, 0, 1), tr.kind) });
      });
    }
    for (const w of this.helpers) if (inV(w.m.x, w.m.y, 120)) items.push({ y: w.m.y, draw: () => { drawCatCached(ctx, w.m, MS, s, this.npcTtl + 1); this.drawHelperTag(ctx, w); } });
    if (this.isDone('boat') && this.boat.state !== 'far' && inV(this.boat.x, BOAT_DOCK.y, 170)) items.push({ y: BOAT_DOCK.y + 20, draw: () => this.drawBoatItem(ctx) });
    // Free-standing wooden signs (depth-sorted with cats so no cat stands on top of a sign!)
    if (inV(790, 160, 240)) items.push({ y: 230, draw: () => drawSignCached(ctx, 'market', 790, 128, 'CAT FISH MARKET', { w: 380, h: 80, c1: '#4fc3ee', c2: '#2a9fd8', posts: 62, icon: fishIcon(0, 1), iconR: fishIcon(2, -1) }) });
    // SELAMAT DATANG signboard placed proudly beside Lapak Udang Bakar in Zona 2!
    if (inV(3120, 360, 240)) items.push({ y: 428, draw: () => drawSignCached(ctx, 'welcome', 3120, 360, 'SELAMAT DATANG 🐱\nKE PASAR KUCING', { w: 230, h: 62, c1: '#ff9fc1', c2: '#ff5f98', posts: 68, sub: '◀ SILAKAN MASUK' }) });
    // Beach Bus Stop & Parked 2x Cat Bus (facing up in the sidewalk bus bay)
    if (inV(BUS_STOP.x, BUS_STOP.y, 140)) items.push({ y: BUS_STOP.y + 12, draw: () => drawBusStop(ctx, BUS_STOP.x, BUS_STOP.y) });
    if (inV(BUS_POS.x, BUS_POS.y, 260)) items.push({ y: BUS_POS.y + 115, draw: () => drawCatBus(ctx, BUS_POS.x, BUS_POS.y, this.time) });
    // Lively Highway Traffic (moving cars on the road)
    for (const car of this.trafficCars) {
      if (inV(car.x, car.y, 110)) items.push({ y: car.y, draw: () => drawTrafficCar(ctx, car, this.time) });
    }
    for (const b of ZONE_BANNERS) if (inV(b.x, b.y + 40, 240)) items.push({ y: b.y + 35 + 62, draw: () => paintZoneBanner(ctx, b.z, b.x, b.y) });

    if (inV(COUNTER.x + 125, COUNTER.y, 260)) {
      if (this.cashier) items.push({ y: CASHIER_POS.y, draw: () => {
        this.popped(ctx, CASHIER_POS, cashU.bt, () => drawCatCached(ctx, this.cashier!, MS, s, this.npcTtl + 1));
        if (cashU.bt > 0.7) {
          const cm = this.cashier!, ty = cm.y - (catLayout().height + 6) * MS - 12;
          ctx.beginPath(); ctx.roundRect(cm.x - 25, ty - 9, 50, 18, 9); ctx.fillStyle = '#2b8aa8'; ctx.fill();
          ctx.lineWidth = 2.2; ctx.strokeStyle = '#fffdf3'; ctx.stroke();
          ctx.font = '900 10px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('KASIR', cm.x, ty + 3.6);
        }
      } });
      items.push({ y: COUNTER.y + COUNTER.h, draw: () => this.drawCounter(ctx, V) });
    }
    for (const pm of this.palms) if (inV(pm.x, pm.y, 150)) items.push({ y: pm.y, draw: () => drawPalm(ctx, pm.x, pm.y, pm.s, this.time, pm.nuts) });
    for (const q of this.decoPalms) if (inV(q.x, q.y, 150)) items.push({ y: q.y, draw: () => drawPalm(ctx, q.x, q.y, q.s, this.time) });
    for (const cc of this.cocos) if (inV(cc.x, cc.y, 40)) items.push({ y: cc.y, draw: () => this.drawCoco(ctx, cc) });
    const crabU = this.unls[5], iceU = this.unls[6];
    if (crabU.done) {
      FARM_PLOTS.forEach((R, i) => { if (inV(R.x + 54, R.y + 23, 90)) items.push({ y: R.y + R.h - 2, draw: () => drawFarmPlants(ctx, R, this.plots[i].state, this.plots[i].g, this.time, this.plots[i].pop, i) }); });
      if (inV(PEN.x + 52, PEN.y + 45, 110)) items.push({ y: PEN.y + PEN.h, draw: () => this.drawPenAll(ctx) });
      if (inV(COOK.x + 75, COOK.y, 200)) items.push({ y: COOK.y + COOK.h - 20, draw: () => this.drawCooker(ctx, V) });
    }
    if (iceU.done && inV(ICE.x + 75, ICE.y, 200)) items.push({ y: ICE.y + ICE.h - 14, draw: () => this.drawIceStall(ctx, V) });
    if (!crabU.done && inV(this.crab.x, this.crab.y, 40)) items.push({ y: this.crab.y, draw: () => drawCrab(ctx, this.crab.x, this.crab.y, this.crab.t, this.crab.mv) });
    items.push({ y: 745, draw: () => { drawRock(ctx, 1700, 745, 1.3); drawCoral(ctx, 1668, 750, 0.9, '#ff7aa8'); } });

    // Zone 3 Beach Playground: Surfing, Sand play, Kite flying
    // Surfers ride the OPEN WATER well away from the shoreline (shore is at x ~= 360):
    // three of them carve different lanes so the sea always looks alive.
    if (inV(110, ZY + 300, 300)) items.push({ y: ZY + 310, draw: () => drawSurfingCat(ctx, 110, ZY + 300, this.time, CUSTOMER_PALS[2], 0, s, this.npcTtl) });
    if (inV(-60, ZY + 650, 300)) items.push({ y: ZY + 660, draw: () => drawSurfingCat(ctx, -60, ZY + 650, this.time, CUSTOMER_PALS[4], 1, s, this.npcTtl) });
    if (inV(-250, ZY + 470, 300)) items.push({ y: ZY + 480, draw: () => drawSurfingCat(ctx, -250, ZY + 470, this.time, CUSTOMER_PALS[0], 2, s, this.npcTtl) });
    if (inV(620, ZY + 480, 140)) items.push({ y: ZY + 490, draw: () => drawSandPlayCat(ctx, 620, ZY + 480, this.time, CUSTOMER_PALS[0], s, this.npcTtl) });
    if (inV(1140, ZY + 620, 140)) items.push({ y: ZY + 630, draw: () => drawSandPlayCat(ctx, 1140, ZY + 620, this.time, CUSTOMER_PALS[1], s, this.npcTtl) });
    if (inV(840, ZY + 340, 180)) items.push({ y: ZY + 350, draw: () => drawKiteFlyingCat(ctx, 840, ZY + 340, this.time, CUSTOMER_PALS[3], 'fish', 0, s, this.npcTtl) });
    if (inV(1420, ZY + 540, 180)) items.push({ y: ZY + 550, draw: () => drawKiteFlyingCat(ctx, 1420, ZY + 540, this.time, CUSTOMER_PALS[5], 'diamond', 1, s, this.npcTtl) });

    // Zone 4 Beach Resort: Volleyball Court, Sunbathing cats
    if (inV(2260, ZY + 450, 260)) items.push({ y: ZY + 450, draw: () => drawVolleyballCourt(ctx, this.volleyball, this.time, s, this.npcTtl) });
    if (inV(2680, ZY + 360, 140)) items.push({ y: ZY + 370, draw: () => drawSunbathingCat(ctx, 2680, ZY + 360, this.time, CUSTOMER_PALS[1], '#ff7aa8', s, this.npcTtl) });
    if (inV(2920, ZY + 560, 140)) items.push({ y: ZY + 570, draw: () => drawSunbathingCat(ctx, 2920, ZY + 560, this.time, CUSTOMER_PALS[3], '#4ea8e8', s, this.npcTtl) });
    if (inV(2520, ZY + 700, 140)) items.push({ y: ZY + 710, draw: () => drawSunbathingCat(ctx, 2520, ZY + 700, this.time, CUSTOMER_PALS[5], '#ffd24a', s, this.npcTtl) });
    if (inV(1960, ZY + 640, 140)) items.push({ y: ZY + 650, draw: () => drawSandPlayCat(ctx, 1960, ZY + 640, this.time, CUSTOMER_PALS[4], s, this.npcTtl) });

    // Roaming kittens & playful cats in the playground
    for (const pc of this.playgroundCats) {
      if (inV(pc.x, pc.y, 80)) items.push({ y: pc.y, draw: () => drawPlaygroundCatItem(ctx, pc, this.time, s, this.npcTtl) });
    }
    for (const c of this.customers) if (inV(c.m.x, c.m.y, 120)) items.push({ y: c.m.y, draw: () => { this.drawWagonOf(ctx, c); this.drawCustomer(ctx, c); this.drawHeld(ctx, c); } });
    if (this.treasure && this.treasure.state !== 'fall') { const tr = this.treasure; items.push({ y: tr.y, draw: () => this.drawTreasureLanded(ctx, tr) }); }
    items.push({ y: this.player.y, draw: () => drawCat(ctx, this.player, MS) });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();

    this.drawFishingLine(ctx);
    this.drawHelperLines(ctx);
    this.drawTreasureAir(ctx, V);

    for (const q of this.parts) {
      if (q.kind !== 'streak' || !inV(q.x, q.y, 30)) continue;
      const a = clamp(q.life / q.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.7;
      ctx.translate(q.x, q.y);
      ctx.rotate(q.ang);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(-q.r, -1.2, q.r, 2.4, 1.2);
      ctx.fill();
      ctx.restore();
    }

    for (const c of this.customers) if (inV(c.m.x, c.m.y, 120)) this.drawBubble(ctx, c);

    for (const f of this.flyers) {
      if (f.t < 0) continue;
      const pos = this.flyerPos(f, f.t);
      if (!inV(pos.x, pos.y, 60)) continue;
      if (f.kind === 'item') {
        const nx = this.flyerPos(f, f.t + 0.04);
        const dx = nx.x - pos.x, dy = nx.y - pos.y;
        const dir = dx >= 0 ? 1 : -1;
        const ang = Math.atan2(dy, dx);
        drawItem(ctx, pos.x, pos.y, f.ft, FISH_S, dir > 0 ? ang : ang - Math.PI, dir, this.time * 25);
      } else if (f.kind === 'sushi') drawSushi(ctx, pos.x, pos.y, 1.15, f.ft, Math.sin(f.t * PI2) * 0.25);
      else if (f.kind === 'cone') drawCone(ctx, pos.x, pos.y, 0.7, f.ft, f.t * f.spin);
      else if (f.kind === 'cup') drawCup(ctx, pos.x, pos.y, 1.4, f.ft, Math.sin(f.t * 6) * 0.2);
      else if (f.kind === 'bill') drawBill(ctx, pos.x, pos.y, f.sc, f.t * f.spin);
      else drawCoin(ctx, pos.x, pos.y, 0.9, f.t * f.spin);
    }

    for (const q of this.parts) {
      if (!inV(q.x, q.y, 20)) continue;
      if (q.kind === 'drop') {
        ctx.globalAlpha = clamp(q.life / 0.3, 0, 1);
        ctx.fillStyle = '#e4f7ff';
        ctx.strokeStyle = '#6fc3ee';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r, 0, PI2);
        ctx.fill();
        ctx.stroke();
      } else if (q.kind === 'steam') {
        const a = clamp(q.life / q.max, 0, 1);
        ctx.globalAlpha = Math.min(0.5, a * 0.75);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, PI2); ctx.fill();
        ctx.globalAlpha *= 0.6;
        ctx.beginPath(); ctx.arc(q.x + q.r * 0.4, q.y - q.r * 0.3, q.r * 0.7, 0, PI2); ctx.fill();
      } else if (q.kind === 'spark') {
        ctx.globalAlpha = clamp(q.life / 0.3, 0, 1);
        ctx.fillStyle = q.col ?? '#fff';
        star4(ctx, q.x, q.y, q.r * clamp(q.life / q.max + 0.3, 0, 1), q.ang + q.life * 4);
      }
    }
    ctx.globalAlpha = 1;

    const pl = this.player;
    if (this.fPhase === 'bite') {
      const pop = Math.min(1, this.fT / 0.12);
      const sc = (0.4 + 0.6 * pop) * (1 + Math.sin(this.fT * 30) * 0.06);
      ctx.save();
      ctx.translate(pl.x, pl.y - (catLayout().height - 2) * MS - 18 - pl.hopY * MS);
      ctx.scale(sc, sc);
      ctx.fillStyle = '#ff4d5e';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, PI2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, 8);
      ctx.restore();
    }

    for (const g of this.gulls) if (g.delay <= 0 && inV(g.x, g.y, 60)) drawGull(ctx, g);

    // live combo counter while collecting money
    if (this.combo.amt > 0) {
      const sc = 1 + this.combo.pop * 0.35 + Math.min(0.5, this.combo.amt / 400);
      ctx.save();
      ctx.translate(pl.x, pl.y - (catLayout().height * MS + 42) - pl.hopY * MS);
      ctx.scale(sc, sc);
      ctx.font = '900 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#14502a';
      ctx.strokeText('+$' + this.combo.amt, 0, 0);
      ctx.fillStyle = '#ffe45c';
      ctx.fillText('+$' + this.combo.amt, 0, 0);
      ctx.restore();
    }

    for (const t of this.texts) {
      ctx.globalAlpha = 1 - t.t / 0.9;
      ctx.font = (t.big ? '900 22px' : '900 17px') + ' system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#14502a';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    this.drawBloom(ctx);
    ctx.setTransform(eff, 0, 0, eff, 0, 0);
    this.drawTreasureArrow(ctx, V);
    if (this.joy.active) {
      const { ox, oy } = this.joy;
      let jx = this.joy.x - ox, jy = this.joy.y - oy;
      const l = Math.hypot(jx, jy);
      if (l > 60) { jx = (jx / l) * 60; jy = (jy / l) * 60; }
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ox, oy, 62, 0, PI2); ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#ffd93b';
      ctx.strokeStyle = '#c98a00';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ox + jx, oy + jy, 26, 0, PI2); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Soft bloom, filter-free.
   * The finished frame is shrunk 1/12 (which already blurs it a lot), the highlights are
   * pushed up with a couple of cheap additive passes and the result is scaled back up with
   * smoothing. No canvas `filter` is used: `brightness()/contrast()/blur()` on the main
   * canvas forces an expensive readback on mobile GPUs and was eating ~half of the frame.
   * A horizontal mask keeps the glow around the sea / water / shore.
   */
  private drawBloom(ctx: CanvasRenderingContext2D) {
    if (!this.hq || typeof document === 'undefined') return;
    const cw = this.canvas.width, ch = this.canvas.height;
    const cs = this.scale * this.dprMax * this.rs; // canvas pixels per world unit
    const WCUT = 1000; // the glow has faded to nothing by here, so nothing is drawn beyond it
    const dxMax = Math.min(cw, Math.ceil((WCUT - this.V.x0) * cs));
    if (dxMax <= 8) return; // looking at far-away land only: no bloom needed
    const bw = Math.max(8, Math.round(cw / 12)), bh = Math.max(8, Math.round(ch / 12));
    if (!this.bloomCv || this.bloomCv.width !== bw || this.bloomCv.height !== bh || !this.bloomMask) {
      this.bloomCv = document.createElement('canvas');
      this.bloomCv.width = bw; this.bloomCv.height = bh;
      this.bloomCtx = this.bloomCv.getContext('2d');
      this.bloomMask = document.createElement('canvas');
      this.bloomMask.width = bw; this.bloomMask.height = bh;
      this.bloomMaskCtx = this.bloomMask.getContext('2d');
    }
    const b = this.bloomCtx, m = this.bloomMaskCtx;
    if (!b || !m) return;
    // Reading the finished frame back is the expensive part (it forces a full-canvas
    // snapshot, which is very slow on mobile GPUs): refresh the glow every 4th frame and
    // keep stamping the previous one in between. Nobody can tell at this softness.
    if (this.frameN % 4 === 0) {
      b.globalCompositeOperation = 'copy';
      b.imageSmoothingEnabled = true;
      b.imageSmoothingQuality = 'low';
      b.drawImage(this.canvas, 0, 0, cw, ch, 0, 0, bw, bh);
      // push the highlights: two additive passes clip the bright sea/foam towards white
      // while the dark parts stay dark, mimicking brightness + contrast without filters
      b.globalCompositeOperation = 'lighter';
      b.globalAlpha = 0.85;
      b.drawImage(this.bloomCv, 0, 0);
      b.drawImage(this.bloomCv, 0, 0);
      b.globalAlpha = 1;
      b.globalCompositeOperation = 'source-over';
      // fade by position: full strength over the water, a light touch on land
      m.globalCompositeOperation = 'copy';
      m.drawImage(this.bloomCv, 0, 0);
      m.globalCompositeOperation = 'destination-in';
      const px = this.scale * this.dprMax * this.rs * (bw / cw); // world unit -> mask pixel
      const toX = (wx: number) => (wx - this.V.x0) * px;
      const g = m.createLinearGradient(toX(400), 0, toX(760), 0);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.5, 'rgba(0,0,0,0.22)');
      g.addColorStop(1, 'rgba(0,0,0,0.06)');
      m.fillStyle = g;
      m.fillRect(0, 0, bw, bh);
      m.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.3;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    const sxMax = Math.min(bw, Math.ceil((dxMax * bw) / cw));
    ctx.drawImage(this.bloomMask!, 0, 0, sxMax, bh, 0, 0, (sxMax * cw) / bw, ch);
    ctx.restore();
  }

  private popped(ctx: CanvasRenderingContext2D, at: Pt, bt: number, fn: () => void) {
    if (bt >= 0.7) { fn(); return; }
    const k = Math.max(0.01, easeBack(clamp(bt / 0.7, 0, 1)));
    ctx.save();
    ctx.translate(at.x, at.y);
    ctx.scale(k, k);
    ctx.translate(-at.x, -at.y);
    fn();
    ctx.restore();
  }

  private ghost(ctx: CanvasRenderingContext2D, r: Rect, label: string) {
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 18); ctx.fill();
    ctx.setLineDash([12, 10]);
    ctx.lineDashOffset = -this.time * 10;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(80,50,10,.55)';
    ctx.strokeText(label, r.x + r.w / 2, r.y + r.h / 2 - 6);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 - 6);
  }

  private drawGhosts(ctx: CanvasRenderingContext2D, V: View) {
    if (!this.isDone('sushi') && SUSHI.x < V.x1 && SUSHI.x + SUSHI.w > V.x0) {
      this.ghost(ctx, { x: SUSHI.x, y: SUSHI.y - SUSHI.H, w: SUSHI.w, h: SUSHI.h + 20 }, '🍣 BAR SUSHI');
    }
    if (!this.isDone('orchard') && MANGO.x < V.x1 && MANGO.x + MANGO.w > V.x0 && V.y1 > MANGO.y - 40) {
      this.ghost(ctx, { x: MANGO.x, y: MANGO.y - MANGO.H, w: MANGO.w, h: MANGO.h + 10 }, '🥭 KIOS MANGGA');
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      for (const t of TREES_POS) { ctx.beginPath(); ctx.arc(t.x, t.y - 62, 40, 0, PI2); ctx.fill(); }
    }
    if (!this.isDone('cashier') && inside({ x: HIRE_ZONE.x, y: HIRE_ZONE.y }, { x: V.x0 - 200, y: V.y0 - 200, w: V.x1 - V.x0 + 400, h: V.y1 - V.y0 + 400 })) {
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      ctx.beginPath(); ctx.ellipse(CASHIER_POS.x, CASHIER_POS.y, 18, 7, 0, 0, PI2); ctx.fill();
    }
  }

  private drawPads(ctx: CanvasRenderingContext2D, V: View, inV: (x: number, y: number, p: number) => boolean) {
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
    const dashed = (r: Rect, a: number, col: string) => {
      ctx.fillStyle = `rgba(255,255,255,${0.4 + a * 0.35})`;
      ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 14); ctx.fill();
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -this.time * 12;
      ctx.lineWidth = 3;
      ctx.strokeStyle = col;
      ctx.stroke();
      ctx.setLineDash([]);
    };
    SPOTS.forEach((s, i) => {
      if (!this.spotOpen(i) || !inV(s.x, s.y, 60)) return;
      const act = this.fSpot === i && this.fPhase !== 'idle' ? 1 : 0;
      dashed({ x: s.x - 30, y: s.y - 22, w: 60, h: 44 }, act, `rgba(40,140,215,${0.7 + act * 0.3})`);
      drawFish(ctx, s.x, s.y + 1, 0, 0.5 + act * 0.1 + pulse * 0.03, 0, 1, this.time * 3 + i);
    });
    if (inV(TABLE.x + 130, TABLE.y + 130, 200)) {
      dashed({ x: TABLE.x + 20, y: TABLE.y + TABLE.h + 18, w: TABLE.w - 40, h: 46 }, this.pads.table, `rgba(40,140,215,${0.6 + this.pads.table * 0.4})`);
      drawFish(ctx, TABLE.x + TABLE.w / 2, TABLE.y + TABLE.h + 41, 1, FISH_S * (1 + this.pads.table * 0.15 + pulse * 0.04), -0.1, 1, this.time * 3);
    }
    if (this.isDone('sushi') && this.unls[2].bt > 0.7) {
      dashed({ x: SUSHI_ZONE.x + 10, y: SUSHI_ZONE.y + 18, w: SUSHI_ZONE.w - 20, h: 46 }, this.pads.sushi, `rgba(224,58,68,${0.6 + this.pads.sushi * 0.4})`);
      drawSushi(ctx, SUSHI_ZONE.x + SUSHI_ZONE.w / 2, SUSHI_ZONE.y + 42, 1.45 * (1 + this.pads.sushi * 0.15 + pulse * 0.04), 0);
    }
    if (this.isDone('orchard') && this.unls[3].bt > 0.7) {
      dashed({ x: MANGO_ZONE.x + 20, y: MANGO_ZONE.y + 4, w: MANGO_ZONE.w - 40, h: 46 }, this.pads.mango, `rgba(240,160,20,${0.6 + this.pads.mango * 0.4})`);
      drawItem(ctx, MANGO_ZONE.x + MANGO_ZONE.w / 2, MANGO_ZONE.y + 28, 4, FISH_S * (1.1 + this.pads.mango * 0.15 + pulse * 0.04), 0, 1, 0);
    }
    if (this.isDone('juice') && this.unls[7].bt > 0.7) {
      dashed(JUICE_ZONE, this.pads.juice, `rgba(40,170,150,${0.6 + this.pads.juice * 0.4})`);
      const jp = 1 + this.pads.juice * 0.15 + pulse * 0.04;
      drawFruit(ctx, 'orange', JUICE_ZONE.x + 64, JUICE_ZONE.y + 28, 0.95 * jp, -0.2);
      drawFruit(ctx, 'mango', JUICE_ZONE.x + 98, JUICE_ZONE.y + 28, 0.82 * jp, 0.1);
      drawFruit(ctx, 'apple', JUICE_ZONE.x + 132, JUICE_ZONE.y + 28, 0.95 * jp, 0.2);
    }
    if (this.isDone('crab') && this.unls[5].bt > 0.7) {
      dashed(PEN_ZONE, this.pads.pen, `rgba(70,180,110,${0.6 + this.pads.pen * 0.4})`);
      drawSeaweedItem(ctx, PEN_ZONE.x + PEN_ZONE.w / 2, PEN_ZONE.y + 26, 1.2 * (1 + this.pads.pen * 0.15 + pulse * 0.04), 0);
      dashed(COOK_ZONE, this.pads.cook, `rgba(224,90,50,${0.6 + this.pads.cook * 0.4})`);
      drawCrabSprite(ctx, COOK_ZONE.x + COOK_ZONE.w / 2, COOK_ZONE.y + 36, 0.9 * (1 + this.pads.cook * 0.15 + pulse * 0.04), false, 0);
    }
    if (inV(REG_ZONE.x + 60, REG_ZONE.y + 40, 120) && !this.isDone('cashier')) {
      dashed(REG_ZONE, this.pads.reg, `rgba(40,150,215,${0.6 + this.pads.reg * 0.4})`);
      ctx.font = '900 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1d6fb8';
      ctx.fillText('KASIR', REG_ZONE.x + REG_ZONE.w / 2, REG_ZONE.y + REG_ZONE.h - 8);
      drawCoin(ctx, REG_ZONE.x + REG_ZONE.w / 2, REG_ZONE.y + 30, 1.5 * (1 + this.pads.reg * 0.2 + pulse * 0.05), 0);
    }
    if (inV(MONEY_ZONE.x + 60, MONEY_ZONE.y + 40, 120)) {
      const has = this.stack.length > 0;
      dashed(MONEY_ZONE, this.pads.money, `rgba(60,170,80,${0.6 + this.pads.money * 0.4})`);
      if (has) {
        ctx.fillStyle = `rgba(120,255,150,${0.18 + 0.2 * pulse})`;
        ctx.beginPath(); ctx.roundRect(MONEY_ZONE.x - 4, MONEY_ZONE.y - 4, MONEY_ZONE.w + 8, MONEY_ZONE.h + 8, 18); ctx.fill();
      }
      ctx.font = '900 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2e8a3a';
      ctx.fillText('AMBIL UANG', MONEY_ZONE.x + MONEY_ZONE.w / 2, MONEY_ZONE.y + MONEY_ZONE.h - 8);
      drawBill(ctx, MONEY_ZONE.x + MONEY_ZONE.w / 2, MONEY_ZONE.y + 30 - (has ? pulse * 4 : 0), 1.45 * (1 + this.pads.money * 0.2 + (has ? pulse * 0.08 : 0)), -0.15);
    }
    for (const u of this.unls) if (!u.done && inV(u.zone.x + u.zone.w / 2, u.zone.y + u.zone.h / 2, 120)) this.drawUnlockPad(ctx, u, pulse);
    void V;
  }

  private drawUnlockPad(ctx: CanvasRenderingContext2D, u: Unl, pulse: number) {
    const z = u.zone;
    const small = z.w < 80;
    ctx.fillStyle = `rgba(255,250,225,${0.68 + u.act * 0.25})`;
    ctx.beginPath(); ctx.roundRect(z.x, z.y, z.w, z.h, 14); ctx.fill();
    const k = u.paid / u.cost;
    if (k > 0) {
      ctx.save();
      ctx.beginPath(); ctx.roundRect(z.x, z.y, z.w, z.h, 14); ctx.clip();
      ctx.fillStyle = 'rgba(255,205,40,.6)';
      ctx.fillRect(z.x, z.y, z.w * k, z.h);
      ctx.restore();
    }
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = -this.time * 14;
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(214,150,10,${0.7 + u.act * 0.3})`;
    ctx.beginPath(); ctx.roundRect(z.x, z.y, z.w, z.h, 14); ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = 'center';
    const bob = Math.sin(this.time * 3 + z.x) * 2 + u.act * -2;
    const left = z.x + (small ? z.w / 2 : 32);
    ctx.font = (small ? 18 : 28) + 'px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.fillText(u.icon, left, z.y + (small ? 19 : z.h / 2 + 10) + bob);
    ctx.font = (small ? '900 15px' : '900 24px') + ' system-ui, sans-serif';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#7a4a00';
    const px = small ? z.x + z.w / 2 : z.x + z.w * 0.64, py = small ? z.y + z.h - 7 : z.y + z.h / 2 + 9;
    const price = '$' + (u.cost - u.paid);
    ctx.strokeText(price, px, py);
    ctx.fillStyle = '#fff';
    ctx.fillText(price, px, py);
    // label pill
    ctx.font = '900 11px system-ui, sans-serif';
    const tw = ctx.measureText(u.label).width + 16;
    ctx.fillStyle = 'rgba(122,74,0,.85)';
    ctx.beginPath(); ctx.roundRect(z.x + z.w / 2 - tw / 2, z.y - 20 - pulse * 2, tw, 17, 8); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(u.label, z.x + z.w / 2, z.y - 8 - pulse * 2);
  }

  private drawPrints(ctx: CanvasRenderingContext2D, inV: (x: number, y: number, p: number) => boolean) {
    if (!this.prints.length) return;
    const spr = sprite('paw', 16, 16, (c) => {
      c.fillStyle = 'rgb(150,105,45)';
      c.beginPath(); c.ellipse(0, 1.5, 3.4, 2.8, 0, 0, PI2); c.fill();
      for (const [tx, ty] of [[-4, -2.6], [-1.6, -5], [1.6, -5], [4, -2.6]]) { c.beginPath(); c.ellipse(tx, ty, 1.5, 1.8, 0, 0, PI2); c.fill(); }
    });
    for (const q of this.prints) {
      if (!inV(q.x, q.y, 10)) continue;
      ctx.globalAlpha = (1 - q.t / q.life) * q.a;
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(q.ang + Math.PI / 2);
      ctx.drawImage(spr, -8, -8, 16, 16);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- items
  private drawPond(ctx: CanvasRenderingContext2D) {
    const { x, y, w, h } = POND;
    const shake = Math.sin(this.time * 40) * this.pondShake * 1.2;
    ctx.save();
    ctx.translate(shake, 0);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#2a1a05';
    ctx.beginPath(); ctx.roundRect(x - 4, y + 4, w + 14, h + 16, 24); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#7a4a20';
    ctx.beginPath(); ctx.roundRect(x - 9, y - 9, w + 18, h + 24, 24); ctx.fill();
    ctx.fillStyle = '#c88a4a';
    ctx.beginPath(); ctx.roundRect(x - 9, y - 9, w + 18, h + 14, 24); ctx.fill();
    ctx.fillStyle = '#e0a766';
    ctx.beginPath(); ctx.roundRect(x - 5, y - 5, w + 10, h + 10, 20); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#7de8f2');
    g.addColorStop(1, '#2aa8de');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      for (let xx = x; xx <= x + w; xx += 10) {
        const yy = y + 22 + i * 32 + Math.sin(xx * 0.07 + this.time * 1.8 + i) * 3;
        if (xx === x) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
    for (const f of this.pond) {
      const pos = this.pondFishPos(f);
      const vy = Math.cos(f.a) * f.sp * (POND.h / 2), vx = -Math.sin(f.a) * f.sp * (POND.w / 2);
      const pitch = clamp(Math.atan2(vy, Math.abs(vx) + 4), -0.5, 0.5);
      drawFish(ctx, pos.x, pos.y, f.type, FISH_S, pitch * f.face, f.face, this.time * 9 + f.ph);
    }
    for (const r of this.ripples) {
      if (!r.pond || r.t < 0) continue;
      const k = r.t / r.max;
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r * k + 3, (r.r * k + 3) * 0.6, 0, 0, PI2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.beginPath(); ctx.roundRect(x + 8, y + 6, 10, h - 30, 5); ctx.fill();
    const full = this.pond.length + this.pondPending >= this.pondCap();
    this.badge(ctx, x + w / 2, y + h + 11, full ? 'FULL' : `${this.pond.length}/${this.pondCap()}`, full ? '#ff5a6a' : '#fff', full ? '#fff' : '#1d6fb8');
    ctx.restore();
  }

  private badge(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, bg: string, fg: string, w = 60) {
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - 9, w, 18, 9); ctx.fill();
    ctx.font = '800 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = fg;
    ctx.fillText(text, cx, cy + 4);
  }

  private drawTable(ctx: CanvasRenderingContext2D, V: View) {
    this.layers.table.draw(ctx, V);
    for (let i = 0; i < this.table.length; i++) {
      const pos = this.tableSlot(i);
      const pop = i === this.tablePopIdx ? this.tablePop : 0;
      drawFish(ctx, pos.x, pos.y - pop * 5, this.table[i], FISH_S * (1 + pop * 0.12), 0, 1, 0);
    }
    const full = this.table.length >= TABLE.cap;
    this.badge(ctx, TABLE.x + TABLE.w / 2, TABLE.y + TABLE.h - TABLE.H + 19, full ? 'FULL' : `${this.table.length}/${TABLE.cap}`, full ? '#3fae49' : '#fff', full ? '#fff' : '#1d6fb8');
  }

  private drawMangoStall(ctx: CanvasRenderingContext2D, V: View) {
    const u = this.unls[3];
    const mid = { x: MANGO.x + MANGO.w / 2, y: MANGO.y + MANGO.h };
    this.popped(ctx, mid, u.bt, () => this.layers.mango.draw(ctx, V));
    if (u.bt < 0.7) return;
    for (let i = 0; i < this.mangoStock.length; i++) {
      const s = this.mangoSlot(i);
      const pop = i === this.mangoPopIdx ? this.mangoPop : 0;
      drawItem(ctx, s.x, s.y - pop * 5, 4, FISH_S * (1.0 + pop * 0.2), -0.08, 1, 0);
    }
    const full = this.mangoStock.length >= MANGO.cap;
    this.badge(ctx, MANGO.x + MANGO.w / 2, MANGO.y + MANGO.h - MANGO.H + 19, full ? 'FULL' : `${this.mangoStock.length}/${MANGO.cap}`, full ? '#3fae49' : '#fff', full ? '#fff' : '#c46a00');
  }

  /** screen pixels per world unit (used by the sprite caches) */
  private get pxScale() { return this.scale * this.dprMax * this.rs; }

  private drawSushiBar(ctx: CanvasRenderingContext2D, V: View) {
    const u = this.unls[2];
    const mid = { x: SUSHI.x + SUSHI.w / 2, y: SUSHI.y + SUSHI.h };
    this.popped(ctx, mid, u.bt, () => this.layers.sushi.draw(ctx, V));
    if (u.bt < 0.7) return;
    const { y, h, H } = SUSHI;
    for (let i = 0; i < this.sushiIn.length; i++) {
      const s = this.traySlot(i);
      drawItem(ctx, s.x, s.y, this.sushiIn[i], FISH_S, ((i * 29) % 5) * 0.03 - 0.06, i % 2 ? -1 : 1, 0);
    }
    // the chef stands behind the board (the board is drawn over his feet)
    drawCatCached(ctx, this.chefCat, MS, this.pxScale, this.npcTtl);
    // cutting board (bounces when the knife hits)
    const bo = this.ch.bounce * 2;
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#5a3a10';
    ctx.beginPath(); ctx.roundRect(BOARD.x + 3, BOARD.y + 5 + bo * 0.4, BOARD.w, BOARD.h, 12); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#b97b3c';
    ctx.beginPath(); ctx.roundRect(BOARD.x, BOARD.y + bo, BOARD.w, BOARD.h, 12); ctx.fill();
    ctx.fillStyle = '#e0aa66';
    ctx.beginPath(); ctx.roundRect(BOARD.x + 3, BOARD.y + 1 + bo, BOARD.w - 6, BOARD.h - 8, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(140,90,40,.35)';
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(BOARD.x + 12, BOARD.y + 12 + k * 13 + bo);
      ctx.quadraticCurveTo(BOARD.x + BOARD.w / 2, BOARD.y + 8 + k * 13 + bo, BOARD.x + BOARD.w - 12, BOARD.y + 12 + k * 13 + bo);
      ctx.stroke();
    }
    this.drawBoardItems(ctx);

    for (let i = 0; i < this.sushiDisp.length; i++) {
      const s = this.dispSlot(i);
      const pop = i === this.dispPopIdx ? this.dispPop : 0;
      drawSushi(ctx, s.x, s.y - pop * 4, 0.78 + pop * 0.2, this.sushiDisp[i]);
    }
    const full = this.sushiDisp.length >= DISP.cap;
    this.badge(ctx, DISP.x + DISP.w / 2, y + h - H + 19, full ? 'FULL' : `${this.sushiDisp.length}/${DISP.cap}`, full ? '#3fae49' : '#fff', full ? '#fff' : '#a8262e');
    this.badge(ctx, TRAY.x + TRAY.w / 2, y + h - H + 19, `${this.sushiIn.length}/${TRAY.cap}`, '#fff', '#1d6fb8', 44);
  }

  private drawBoardItems(ctx: CanvasRenderingContext2D) {
    const ch = this.ch;
    const bo = ch.bounce * 2;
    const type = ch.fish;
    const mango = type === 4;
    const wag = Math.sin(this.time * 14) * Math.max(0, 1 - ch.t * 3);
    const ex = mango ? 17 : 22, ey = mango ? 14 : 14.5;

    const seg = (x0: number, x1: number, ox: number, oy: number, rot: number, sc: number, alpha: number, cutL: boolean, cutR: boolean) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(BC.x + ox, BC.y + oy + bo);
      ctx.rotate(rot);
      ctx.scale(FISH_S * sc, FISH_S * sc);
      ctx.beginPath();
      ctx.rect(x0, -48, x1 - x0, 96);
      ctx.clip();
      drawItem(ctx, 0, 0, type, 1, 0, 1, 0);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, ex, ey, 0, 0, PI2);
      ctx.clip();
      ctx.fillStyle = mango ? '#fff3b8' : '#ffe6df';
      if (cutL) ctx.fillRect(x0, -16, 2.8, 32);
      if (cutR) ctx.fillRect(x1 - 2.8, -16, 2.8, 32);
      ctx.restore();
      ctx.restore();
    };

    const cutXs = this.cutXs();
    const gp = (j: number) => (ch.cutT[j] < 0 ? 0 : easeOut(ch.cutT[j] / 0.16));
    const whole = () => drawItem(ctx, BC.x, BC.y + bo, type, FISH_S, 0, 1, wag);

    if (ch.phase === 'fetch' && ch.onBoard) {
      whole();
    } else if (ch.phase === 'chop') {
      if (ch.cuts === 0) whole();
      else {
        const done = cutXs.filter((_, j) => ch.cuts > j).sort((a, b) => a - b);
        const bounds = [-70, ...done, 70];
        const [c0, c1, c2] = cutXs;
        for (let i = 0; i < bounds.length - 1; i++) {
          const x0 = bounds[i], x1 = bounds[i + 1];
          const c = (x0 + x1) / 2;
          let ox = 0, rot = 0;
          if (c >= c0) ox += 5 * gp(0);
          if (c <= c1) ox -= 5 * gp(1);
          if (c > c1 && c < c0 && ch.cuts >= 3) { ox += (c < c2 ? -3.5 : 3.5) * gp(2); rot = (c < c2 ? -0.05 : 0.05) * gp(2); }
          seg(x0, x1, ox, 0, rot, 1, 1, done.includes(x0), done.includes(x1));
        }
      }
    } else if (ch.phase === 'form') {
      const t = ch.t;
      const [c0, c1, c2] = cutXs;
      if (isMaki(ch.kind)) {
        // pieces spin and shrink into two little rolls
        const e = clamp(t / 0.45, 0, 1);
        if (e < 1) drawItem(ctx, BC.x, BC.y + bo, type, FISH_S * (1 - e) + 0.001, e * 3, 1, 0);
        if (t >= 0.3) {
          const k = clamp((t - 0.3) / 0.35, 0, 1);
          const pop = t > 0.65 ? Math.max(0, 1 - (t - 0.65) / 0.25) : 0;
          const sc = 1.15 * Math.max(0.01, easeBack(k)) * (1 + 0.2 * pop);
          drawSushi(ctx, BC.x - 14, BC.y + 9 + bo - pop * 3, sc, ch.kind);
          drawSushi(ctx, BC.x + 14, BC.y + 9 + bo - pop * 3, sc, ch.kind);
        }
      } else {
        const rs = clamp((t - 0.1) / 0.25, 0, 1);
        const back = rs < 1 ? 1 + 2.2 * Math.pow(rs - 1, 3) + 1.2 * Math.pow(rs - 1, 2) : 1;
        if (t >= 0.1 && t < 0.65) {
          drawRice(ctx, BC.x - 14, BC.y + 13 + bo, 1.15 * back * Math.min(1, rs * 1.6));
          drawRice(ctx, BC.x + 14, BC.y + 13 + bo, 1.15 * back * Math.min(1, rs * 1.6));
        }
        const sh = clamp(t / 0.2, 0, 1);
        if (sh < 1) {
          seg(c0, 70, 5, -sh * 6, sh * 0.9, 1 - sh, 1 - sh, true, false);
          seg(-70, c1, -5, -sh * 6, -sh * 0.9, 1 - sh, 1 - sh, false, true);
        }
        if (t < 0.65) {
          const e = easeOut((t - 0.38) / 0.27);
          const arc = Math.sin(clamp((t - 0.38) / 0.27, 0, 1) * Math.PI) * 11;
          const sc = 1 + 0.9 * e;
          seg(c1, c2, lerp(-3.5, -7.6, e), e * 7 - arc, lerp(-0.05, 0, e), sc, 1, true, true);
          seg(c2, c0, lerp(3.5, 10.8, e), e * 7 - arc, lerp(0.05, 0, e), sc, 1, true, true);
        } else {
          const pop = Math.max(0, 1 - (t - 0.65) / 0.25);
          const sc = 1.15 * (1 + 0.22 * pop);
          drawSushi(ctx, BC.x - 14, BC.y + 9 + bo - pop * 3, sc, ch.kind);
          drawSushi(ctx, BC.x + 14, BC.y + 9 + bo - pop * 3, sc, ch.kind);
        }
      }
    }
  }

  private drawCounter(ctx: CanvasRenderingContext2D, V: View) {
    this.layers.counter.draw(ctx, V);
    // big bills stacked right on the counter
    const n = Math.min(this.stack.length, 60);
    for (let i = 0; i < n; i++) {
      const pos = billPos(i);
      let yo = 0;
      if (i === this.stack.length - 1 && this.landT < 0.3) { const k = 1 - this.landT / 0.3; yo = -k * k * 10; }
      drawBill(ctx, pos.x, pos.y + yo, 1, ((i * 53) % 7 - 3) * 0.03);
    }
    if (this.stack.length > 0) {
      const top = billPos(Math.max(0, n - 1)).y - 24;
      const k = this.landT < 0.25 ? 1 + 0.25 * (1 - this.landT / 0.25) : 1;
      ctx.save();
      ctx.translate(STACK.x + 22, top);
      ctx.scale(k, k);
      this.badge(ctx, 0, 0, '$' + this.stackSum, '#2e8a3a', '#fff', 70);
      ctx.restore();
    }
  }

  private drawFishingLine(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    if (!p.rod.on) return;
    const tip = { x: p.rod.wx, y: p.rod.wy };
    let end: Pt | null = null;
    let sag = 14;
    if (this.bobOn) {
      end = this.bob;
      if (this.fPhase === 'wait' || this.fPhase === 'bite') sag = this.fPhase === 'bite' ? 3 : 10;
      else if (this.bobFly) sag = 6;
    } else if (this.fFlyer && this.flyers.includes(this.fFlyer) && this.fFlyer.t < 0.93) {
      end = this.flyerPos(this.fFlyer, this.fFlyer.t);
      sag = 2 + clamp((this.fFlyer.t - 0.5) / 0.43, 0, 1) * 16;
    }
    if (!end) return;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.quadraticCurveTo((tip.x + end.x) / 2, (tip.y + end.y) / 2 + sag, end.x, end.y);
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    if (this.bobOn) {
      const b = this.bob;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#7a2a30';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, 5.2, 0, PI2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff4d5e';
      ctx.beginPath(); ctx.arc(0, 0, 5.2, Math.PI, 0); ctx.fill();
      ctx.restore();
    }
  }

  private drawPenAll(ctx: CanvasRenderingContext2D) {
    drawPenBack(ctx, this.time);
    for (const c of [...this.pen].sort((a, b) => a.y - b.y)) drawPenCrab(ctx, c, this.time);
    drawPenFront(ctx);
  }

  private drawCooker(ctx: CanvasRenderingContext2D, V: View) {
    const u = this.unls[5];
    this.popped(ctx, { x: COOK.x + COOK.w / 2, y: COOK.y + COOK.h }, u.bt, () => this.layers.cook.draw(ctx, V));
    if (u.bt < 0.7) return;
    drawCookerDyn(ctx, { t: this.time, cooking: this.cooking, prog: clamp(this.cookT / 3.2, 0, 1), stock: this.crabStock.length, cap: COOK.cap, rawIn: this.cookIn + (this.cooking ? 1 : 0) });
    for (let i = 0; i < this.crabStock.length; i++) { const sl = crabSlot(i); drawCrabSprite(ctx, sl.x, sl.y, CRAB_S, true, 0); }
  }

  private drawIceStall(ctx: CanvasRenderingContext2D, V: View) {
    const u = this.unls[6];
    if (this.vendor && u.bt >= 0.7) drawCatCached(ctx, this.vendor, MS, this.pxScale, this.npcTtl + 1); // behind the cart: the cart is drawn over his legs
    this.popped(ctx, { x: ICE.x + ICE.w / 2, y: ICE.y + ICE.h }, u.bt, () => this.layers.ice.draw(ctx, V));
  }

  /**
   * Customers who stand still (queueing) are drawn into a small bitmap that is refreshed every 3rd frame:
   * a cat is a lot of vector paths, so this saves most of the cost of a long queue. Walking cats are drawn live.
   */
  private drawCustomer(ctx: CanvasRenderingContext2D, c: Customer) {
    const m = c.m;
    const s = Math.min(2, this.pxScale);
    // Walking cats and their idle animation (breathing, blinking, tail) now go through the
    // shared per-cat sprite cache, so a whole queue costs a handful of bitmap stamps
    // instead of re-tracing every cat's 400+ vector paths on every frame.
    drawCatCached(ctx, m, MS, s, 2);
  }

  /** the plastic shopping bag (with the products inside), or the ice-cream cone, in the cat's hand */
  private holdKind(c: Customer): 'bag' | 'wagon' | 'cone' | null {
    if (c.kind === 'ice') return c.taken.length > 0 ? 'cone' : null;
    if (c.taken.length > 0 && c.taken.length >= c.want && c.state !== 'q1') return c.want >= 3 ? 'wagon' : 'bag';
    return null;
  }

  private drawWagonOf(ctx: CanvasRenderingContext2D, c: Customer) {
    if (this.holdKind(c) !== 'wagon' || !c.wag) return;
    const m = c.m, k = MS * m.size * 1.5;
    const f = m.x > c.wag.x ? 1 : -1;
    drawWagon(ctx, c.wag.x, c.wag.y, k, c.taken.map((t) => ({ kind: c.kind, type: t })), f, this.time, c.wag.x * 0.12);
  }

  private drawHeld(ctx: CanvasRenderingContext2D, c: Customer) {
    const m = c.m;
    const hk = this.holdKind(c);
    if (!hk || !m.hold) return;
    const k = MS * m.size;
    const hp = catHandPos(m.build, m.holdAng);
    const bob = (0.5 + 0.5 * Math.cos(2 * m.phase)) * 3 * m.mv;
    const hx = m.x + m.hold * hp.x * k, hy = m.y + (hp.y - bob - m.hopY) * k;
    if (hk === 'bag') {
      const s = k * 1.96; // the bag is twice as big as before
      drawBag(ctx, hx, hy + 8 * s, s, c.taken.map((t) => ({ kind: c.kind, type: t })), Math.sin(m.phase) * 0.12 * m.mv + 0.03, this.time);
    } else if (hk === 'cone') {
      const s = k * 0.95;
      drawCone(ctx, hx, hy - 24 * s, s, c.taken[0], 0.06 + Math.sin(m.phase) * 0.08 * m.mv);
    } else if (c.wag) {
      // one straight tow pole from the wagon bracket to the paw (no separate bits that can drift apart)
      const s = k * 1.5, f = m.x > c.wag.x ? 1 : -1;
      const ex = c.wag.x + f * WAGON_H.dx * s, ey = c.wag.y - WAGON_H.dy * s;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy);
      ctx.strokeStyle = '#58244a'; ctx.lineWidth = 5.4 * k; ctx.stroke();
      ctx.strokeStyle = '#ff6a5a'; ctx.lineWidth = 3 * k; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1 * k; ctx.beginPath(); ctx.moveTo(ex, ey - 0.8 * k); ctx.lineTo(hx, hy - 0.8 * k); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex, ey, 2.6 * k, 0, PI2); ctx.fillStyle = '#ffd93b'; ctx.fill(); ctx.lineWidth = 1.6 * k; ctx.strokeStyle = '#58244a'; ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(hx, hy, 6.6 * k, 5.6 * k, 0, 0, PI2);
    ctx.fillStyle = m.pal.belly; ctx.fill();
    ctx.lineWidth = 2.2 * k; ctx.strokeStyle = '#58244a'; ctx.stroke();
  }

  private drawBubble(ctx: CanvasRenderingContext2D, c: Customer) {
    const show = c.state === 'q1' || c.state === 'q2' || c.state === 'pay' || (c.state === 'leave' && c.happyT > 0);
    if (!show || (c.state === 'q1' && c.way.length && c.way.length > 1)) return;
    const m = c.m;
    const k = MS * m.size;
    const topY = m.y - (catLayout(m.build).height - 4) * k - 22 - m.hopY * k - Math.sin(this.time * 4 + m.x) * 1.4;
    const front = c.state === 'q1' && this.qs[c.kind][0] === c && !c.way.length;
    const toPay = c.state === 'q2' || c.state === 'pay';
    const pop = Math.max(0.01, easeBack(clamp(c.bubT / 0.35, 0, 1)));
    const mood = this.moodOf(c);
    ctx.save();
    ctx.translate(m.x, topY);
    ctx.scale(pop, pop);
    const GR = '#43c06c';
    ctx.textAlign = 'center';
    ctx.font = '900 15px system-ui, sans-serif';
    if (front) {
      bubbleShell(ctx, 78, 34, GR);
      if (c.kind === 'sushi') drawSushi(ctx, -22, 1, 0.68, this.sushiDisp.length ? this.sushiDisp[this.sushiDisp.length - 1] : 0);
      else if (c.kind === 'mango') drawItem(ctx, -22, 0, 4, 0.56, 0, 1, 0);
      else if (c.kind === 'crab') drawCrabSprite(ctx, -22, 0, 0.5, true, 0);
      else if (c.kind === 'ice') drawCone(ctx, -22, 2, 0.46, 0, 0);
      else if (c.kind === 'juice') drawCup(ctx, -22, 2, 0.5, this.juiceStock.length ? this.juiceStock[this.juiceStock.length - 1] : 0);
      else drawFish(ctx, -22, 0, this.table.length ? this.table[this.table.length - 1] : 1, 0.56, 0, 1, this.time * 4);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillText(`${c.taken.length}/${c.want}`, 14, 6);
    } else if (toPay) {
      const first = this.cashQ[0] === c;
      bubbleShell(ctx, first ? 92 : 58, 42, GR);
      drawRegister(ctx, first ? -24 : 0, 0, 0.78);
      if (first) { ctx.fillStyle = '#2e8a3a'; ctx.fillText(`$${this.valueOf(c)}`, 20, 6); }
    }
    // mood emoji: its own little bubble next to the main one (or alone for cats just waiting in line)
    if (front || toPay) {
      ctx.save();
      ctx.translate(front ? 36 : (this.cashQ[0] === c ? 44 : 32), -26);
      bubbleShell(ctx, 32, 32, GR, false);
      drawEmoji(ctx, 0, 0, 0.74, mood);
      ctx.restore();
    } else {
      bubbleShell(ctx, 40, 40, GR);
      drawEmoji(ctx, 0, 0, 0.9, mood);
    }
    ctx.restore();
  }

  private drawGhosts2(ctx: CanvasRenderingContext2D, V: View) {
    const vis = (r: Rect) => r.x < V.x1 && r.x + r.w > V.x0 && r.y < V.y1 && r.y + r.h > V.y0;
    if (!this.isDone('crab')) {
      const a: Rect = { x: COOK.x, y: COOK.y - COOK.H, w: COOK.w, h: COOK.h + 20 };
      if (vis(a)) this.ghost(ctx, a, '🦀 KEPITING');
      const f: Rect = { x: 232, y: 600, w: 120, h: 172 };
      if (vis(f)) this.ghost(ctx, f, '🌿 LADANG');
      if (vis(PEN)) this.ghost(ctx, PEN, '🦀 KOLAM KEPITING');
    }
    if (!this.isDone('juice')) {
      const a: Rect = { x: JUICE.x, y: JUICE.y - JUICE.H, w: JUICE.w, h: JUICE.h + 20 };
      if (vis(a)) this.ghost(ctx, a, '🧃 BAR JUS');
      for (const t of [...ORANGE_POS, ...APPLE_POS]) if (t.x < V.x1 && t.x > V.x0) { ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(t.x, t.y - 62, 40, 0, PI2); ctx.fill(); }
    }
    if (!this.isDone('boat')) {
      const a: Rect = { x: -200, y: BOAT_DOCK.y - 30, w: 150, h: 70 };
      if (vis(a)) this.ghost(ctx, a, '⛵ KAPAL');
    }
    if (!this.isDone('ice')) {
      const a: Rect = { x: ICE.x, y: 268, w: ICE.w, h: 82 };
      if (vis(a)) this.ghost(ctx, a, '🍦 ES KRIM');
    }
  }
}

// =====================================================================
function pushOut(m: Cat, rx: number, ry: number, rw: number, rh: number, rad: number) {
  const cx = clamp(m.x, rx, rx + rw), cy = clamp(m.y, ry, ry + rh);
  const dx = m.x - cx, dy = m.y - cy;
  const d = Math.hypot(dx, dy);
  if (d >= rad) return;
  if (d === 0) { m.y = ry - rad; return; }
  const nx = dx / d, ny = dy / d;
  m.x = cx + nx * rad;
  m.y = cy + ny * rad;
  const vn = m.vx * nx + m.vy * ny;
  if (vn < 0) { m.vx -= vn * nx; m.vy -= vn * ny; }
}
