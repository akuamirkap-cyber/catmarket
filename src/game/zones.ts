// ---------------------------------------------------------------
//  Zones & Stall Catalog:
//  - Zone 1: Pasar Ikan & Dermaga
//  - Zone 2: Pasar Ragam Lapak Pantai (Bisa pilih lapak apa saja!)
//  - Zone 3: Pantai Pasir & Ombak (Taman Bermain Kucing: Selancar, Main Pasir, Layangan)
//  - Zone 4: Resort Pantai & Volei (Volei Pantai, Berjemur & Santai)
// ---------------------------------------------------------------
import { drawSignCached, paintSign, SIGN_OUT } from './signs';

const PI2 = Math.PI * 2;
const OUT = SIGN_OUT;

export const ZX = 1760;
export const ZY = 1000;
export const GATE_X = 1752;
export const GATE_Y = 812;

export interface ZoneDef { id: number; name: string; theme: string; c1: string; c2: string; tint: string; x0: number; y0: number; x1: number; y1: number }
export const ZONE_DEFS: ZoneDef[] = [
  { id: 1, name: 'ZONA 1 · PASAR IKAN', theme: 'Pasar ikan & dermaga', c1: '#4fc3ee', c2: '#2a9fd8', tint: '', x0: 280, y0: 0, x1: ZX, y1: 880 },
  { id: 2, name: 'ZONA 2 · RAGAM LAPAK PANTAI', theme: 'Pilih & atur lapak sesukamu!', c1: '#ff9a6a', c2: '#e8643a', tint: 'rgba(255,165,120,.13)', x0: ZX, y0: 0, x1: 3240, y1: 880 },
  { id: 3, name: 'ZONA 3 · TAMAN BERMAIN PANTAI 🏖️', theme: 'Main pasir, berselancar & layangan', c1: '#5fd6c4', c2: '#2a9d8f', tint: 'rgba(110,225,225,.12)', x0: 280, y0: ZY, x1: ZX, y1: 1900 },
  { id: 4, name: 'ZONA 4 · RESORT VOLEI & SANTASI 🏐', theme: 'Volei pantai, berjemur & santai', c1: '#ff7aa8', c2: '#d4427b', tint: 'rgba(255,180,210,.14)', x0: ZX, y0: ZY, x1: 3240, y1: 1900 },
];

export interface StallItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  desc: string;
  c1: string;
  c2: string;
  price: number;
}

/** Complete catalog of 18 Beach Stalls that players can choose to build on any Zone 2 slot */
export const STALL_CATALOG: StallItem[] = [
  { id: 'kelapa', name: 'Warung\nKelapa Muda', icon: '🥥', category: 'Minuman', desc: 'Air kelapa segar langsung dari pohon pantai', c1: '#ffc83a', c2: '#f0a410', price: 35 },
  { id: 'cangkang', name: 'Toko Cangkang\n& Kerang', icon: '🐚', category: 'Souvenir', desc: 'Koleksi kerang laut warna-warni cantik', c1: '#ff9fc1', c2: '#ff5f98', price: 40 },
  { id: 'udang', name: 'Lapak\nUdang Bakar', icon: '🦐', category: 'Makanan', desc: 'Udang bakar bumbu madu gurih lezat', c1: '#ff7a4a', c2: '#d6482c', price: 50 },
  { id: 'serut', name: 'Kedai\nEs Serut', icon: '🍧', category: 'Makanan', desc: 'Es serut pelangi dingin manis tropis', c1: '#a8f2d6', c2: '#3ed19e', price: 38 },
  { id: 'selancar', name: 'Sewa Papan\nSelancar', icon: '🏄', category: 'Wahana', desc: 'Penyewaan papan selancar ombak pantai', c1: '#4ea8e8', c2: '#2b7ec4', price: 55 },
  { id: 'topi', name: 'Toko Topi &\nKacamata', icon: '👒', category: 'Aksesoris', desc: 'Topi jerami & kacamata gaya pantai', c1: '#ffbf28', c2: '#e69010', price: 45 },
  { id: 'lobster', name: 'Dapur\nLobster Bakar', icon: '🦞', category: 'Makanan', desc: 'Lobster bakar mentega istimewa mewah', c1: '#e8453c', c2: '#b5241e', price: 65 },
  { id: 'cumi', name: 'Kios Sate\nCumi Bakar', icon: '🦑', category: 'Makanan', desc: 'Sate cumi manis kenyal favorit kucing', c1: '#c77dff', c2: '#8f3dd8', price: 48 },
  { id: 'souvenir', name: 'Toko\nCenderamata', icon: '🎁', category: 'Souvenir', desc: 'Oleh-oleh unik khas Cat Fish Market', c1: '#ffd43b', c2: '#ff9f45', price: 42 },
  { id: 'kayak', name: 'Sewa Kayak\n& Dayung', icon: '🛶', category: 'Wahana', desc: 'Petualangan menyusuri teluk air jernih', c1: '#2ea642', c2: '#18782a', price: 52 },
  { id: 'kopi', name: 'Kedai Kopi\nPantai', icon: '☕', category: 'Minuman', desc: 'Kopi dingin aromatik di tepi pantai', c1: '#b97b3c', c2: '#7a4e22', price: 36 },
  { id: 'rumput', name: 'Pasar Rumput\nLaut Crispy', icon: '🌿', category: 'Camilan', desc: 'Nori renyah panggang kaya rasa', c1: '#47d581', c2: '#249852', price: 32 },
  { id: 'restoran', name: 'Restoran\nTerumbu Karang', icon: '🍽️', category: 'Restoran', desc: 'Santapan mewah lezat pemandangan sunset', c1: '#e8648a', c2: '#b82a52', price: 70 },
  { id: 'mutiara', name: 'Toko Mutiara\nLaut Dalam', icon: '🦪', category: 'Perhiasan', desc: 'Mutiara alami berkilau bernilai tinggi', c1: '#e4ecf6', c2: '#9eb0c4', price: 80 },
  { id: 'layar', name: 'Sewa Perahu\nLayar Mini', icon: '⛵', category: 'Wahana', desc: 'Pelayaran santai menikmati hembusan angin', c1: '#3b93e6', c2: '#1d6fb8', price: 60 },
  { id: 'spa', name: 'Spa Pasir\n& Pijat Bulu', icon: '💆', category: 'Relaksasi', desc: 'Pijat relaksasi bulu dan cakar kucing', c1: '#ff92aa', c2: '#d4476f', price: 55 },
  { id: 'menara', name: 'Menara Penjaga\nPantai', icon: '🗼', category: 'Wisata', desc: 'Pemandangan 360 derajat seluruh pantai', c1: '#ff6b6b', c2: '#c93040', price: 40 },
  { id: 'taman', name: 'Taman Bunga\nTropis', icon: '🌺', category: 'Taman', desc: 'Bunga kamboja & kembang sepatu harum', c1: '#ff7aa8', c2: '#c72e66', price: 30 },
];

export interface Slot {
  idx: number;
  z: number;
  x: number;
  y: number;
  w: number;
  h: number;
  key: string;
}

/** 6 Customizable Stall Slots in Zone 2! (3 columns x 2 rows) */
export const SLOTS: Slot[] = [
  { idx: 0, z: 2, x: 1900, y: 258, w: 214, h: 112, key: '2_0' },
  { idx: 1, z: 2, x: 2340, y: 258, w: 214, h: 112, key: '2_1' },
  { idx: 2, z: 2, x: 2780, y: 258, w: 214, h: 112, key: '2_2' },
  { idx: 3, z: 2, x: 1900, y: 550, w: 214, h: 112, key: '2_3' },
  { idx: 4, z: 2, x: 2340, y: 550, w: 214, h: 112, key: '2_4' },
  { idx: 5, z: 2, x: 2780, y: 550, w: 214, h: 112, key: '2_5' },
];

export const ZONE_BANNERS: { z: number; x: number; y: number }[] = [
  { z: 2, x: 2480, y: 130 },
  { z: 3, x: 900, y: ZY + 130 },
  { z: 4, x: 2480, y: ZY + 130 },
];

export function paintZoneBanner(c: CanvasRenderingContext2D, z: number, x: number, y: number) {
  const d = ZONE_DEFS[z - 1];
  paintSign(c, x, y, d.name, { w: 420, h: 72, c1: d.c1, c2: d.c2, rim: '#a86a32', posts: 62, sub: d.theme });
}

/**
 * Draws a customized slot in Zone 2 with its chosen stall from the catalog!
 */
export const drawSlot = (ctx: CanvasRenderingContext2D, s: Slot, _open: boolean, t: number) => {
  const stall = STALL_CATALOG[s.idx % STALL_CATALOG.length];
  drawCustomSlot(ctx, s, stall, t);
};

export function drawCustomSlot(ctx: CanvasRenderingContext2D, s: Slot, stall: StallItem, t: number) {
  ctx.save();
  ctx.lineJoin = 'round';

  // Ground shadow
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#3a2a10';
  ctx.beginPath(); ctx.roundRect(s.x - 3, s.y + 6, s.w + 12, s.h + 8, 18); ctx.fill();
  ctx.globalAlpha = 1;

  // Stall Counter base & awning
  ctx.beginPath(); ctx.roundRect(s.x, s.y + s.h - 38, s.w, 38, 10);
  ctx.fillStyle = '#c98a4d'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke();

  // Striped counter front
  ctx.save();
  ctx.beginPath(); ctx.roundRect(s.x, s.y + s.h - 38, s.w, 38, 10); ctx.clip();
  ctx.fillStyle = stall.c1;
  for (let k = 0; k < 12; k++) ctx.fillRect(s.x + 8 + k * 18, s.y + s.h - 38, 9, 40);
  ctx.restore();

  // Counter top lip
  ctx.beginPath(); ctx.roundRect(s.x - 4, s.y + s.h - 44, s.w + 8, 14, 6);
  ctx.fillStyle = '#ffd984'; ctx.fill();
  ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.stroke();

  // Big cute center icon
  ctx.font = '38px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.fillText(stall.icon, s.x + s.w / 2, s.y + s.h / 2 + 6 + Math.sin(t * 3 + s.idx) * 2);

  // Sign above stall
  drawSignCached(ctx, 'cslot_' + s.idx + '_' + stall.id, s.x + s.w / 2, s.y - 18, stall.name, {
    w: s.w - 8, h: 52, c1: stall.c1, c2: stall.c2, stakes: true,
  });

  // Action badge: "GANTI LAPAK ⚙️"
  const label = 'GANTI LAPAK ⚙️';
  ctx.font = '900 10.5px system-ui, sans-serif';
  const tw = ctx.measureText(label).width + 20;
  const px = s.x + s.w / 2 - tw / 2, py = s.y + s.h - 10;
  ctx.beginPath(); ctx.roundRect(px, py - 9, tw, 18, 9);
  ctx.fillStyle = '#fffdf3'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.fillStyle = '#7a441e';
  ctx.fillText(label, s.x + s.w / 2, py + 4);

  ctx.restore();
}

/** Gate rendering helper - Zone 3 & 4 are open beach playgrounds, gate only visible if closed */
export function drawGate(ctx: CanvasRenderingContext2D, z: number, kind: 'v' | 'h', fixed: number, from: number, to: number, a: number, t: number, withSign = true) {
  if (a < 0.02) return;
  const d = ZONE_DEFS[z - 1];
  ctx.save();
  ctx.globalAlpha = Math.min(1, a * 1.2);
  ctx.translate(0, (1 - a) * 26);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const step = 54;
  const n = Math.max(2, Math.round((to - from) / step));
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const u = from + ((to - from) * i) / n;
    pts.push(kind === 'v' ? [fixed, u] : [u, fixed]);
  }
  // ropes (behind posts)
  for (const hgt of [14, 27]) {
    for (let i = 0; i < n; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const sag = 5 + Math.sin(t * 1.5 + i) * 0.6;
      ctx.beginPath();
      ctx.moveTo(x0, y0 - hgt);
      ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - hgt + sag, x1, y1 - hgt);
      ctx.strokeStyle = SIGN_OUT; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = '#f5e2b5'; ctx.lineWidth = 2.6; ctx.stroke();
    }
  }
  // pennants
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - 27 + 5;
    const sw = Math.sin(t * 3 + i * 1.7) * 1.8;
    ctx.beginPath(); ctx.moveTo(mx - 6, my); ctx.lineTo(mx + 6, my); ctx.lineTo(mx + sw, my + 15); ctx.closePath();
    ctx.fillStyle = i % 2 ? '#ffd93b' : d.c1; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = SIGN_OUT; ctx.stroke();
  }
  // posts
  for (const [x, y] of pts) {
    ctx.globalAlpha *= 0.9; ctx.fillStyle = 'rgba(60,44,16,.22)';
    ctx.beginPath(); ctx.ellipse(x + 3, y + 2, 9, 3.4, 0, 0, PI2); ctx.fill(); ctx.globalAlpha = Math.min(1, a * 1.2);
    ctx.beginPath(); ctx.roundRect(x - 5, y - 38, 10, 40, 4); ctx.fillStyle = '#b97b3c'; ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = SIGN_OUT; ctx.stroke();
    ctx.fillStyle = 'rgba(255,230,180,.45)'; ctx.fillRect(x - 3, y - 35, 2, 34);
    ctx.beginPath(); ctx.arc(x, y - 38, 5.4, 0, PI2); ctx.fillStyle = '#ffd24a'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  }
  if (withSign) {
    const cx = kind === 'v' ? fixed : (from + to) / 2;
    const cy = kind === 'v' ? from + (to - from) * 0.86 : fixed;
    drawSignCached(ctx, 'gate' + z, cx, cy - 58, d.name, {
      w: 230, h: 62, c1: d.c1, c2: d.c2, sub: d.theme, posts: 28,
    });
  }
  ctx.restore();
}
