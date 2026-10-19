import { useEffect, useRef, useState } from 'react';
import { Game, Status } from './game/game';
import { sfx } from './game/audio';
import { CAT_RANGE, DEFAULT_CFG, makePlayerPal, renderCatPreview } from './game/cat';
import type { CatCfg, HatId, SkinId } from './game/cat';
import { STALL_CATALOG } from './game/zones';

const EMPTY: Status = {
  mode: 'IDLE', speed: 0, carry: 0, max: 6, skid: false, fishing: false,
  pond: 0, pondCap: 8, table: 0, tableCap: 8, tray: 0, trayCap: 4, sushi: 0, sushiCap: 8, mango: 0, mangoCap: 8,
  crabOn: false, iceOn: false, crab: 0, crabCap: 18, rawIn: 0,
  juiceOn: false, juice: 0, juiceCap: 18, assist: 0, boatOn: false, level: 1,
  money: 0, sushiOn: false, orchardOn: false, cashierOn: false,
  skin: 'tabby', hat: 'bucket', skatesOwned: false, skatesOn: false, boardOwned: false, boardOn: false, treasure: false, cat: DEFAULT_CFG,
  zone2Stalls: ['kelapa', 'cangkang', 'udang', 'lobster', 'serut', 'mutiara'],
  mission: { text: 'Tangkap 3 ikan', prog: 0, goal: 3, reward: 30, done: false }, ups: [],
};

interface AdState { label: string; reward: string; cb: (ok: boolean) => void }
const AD_SECONDS = 5;

// ---- Monkey-Mart / Animal-Crossing style: cream panels, tan borders, chunky warm brown text
const PANEL = 'rounded-2xl border-[3px] border-[#e4bd84] bg-[#fff6df] shadow-[0_3px_0_#d2a566,0_8px_14px_rgba(0,0,0,.16)]';
const BROWN = 'text-[#6a4421]';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [bump, setBump] = useState(0);
  const [status, setStatus] = useState<Status>(EMPTY);
  const [runLatch, setRunLatch] = useState(false);
  const [muted, setMuted] = useState(false);
  const [panel, setPanel] = useState(false);
  const [wardrobe, setWardrobe] = useState(false);
  const [book, setBook] = useState(false);
  const [guide, setGuide] = useState(false);
  const [ratingModal, setRatingModal] = useState(false);
  const [slotModal, setSlotModal] = useState<{ idx: number; cur: string } | null>(null);
  const [stallFilter, setStallFilter] = useState('Semua');
  const [hasRated, setHasRated] = useState(() => (typeof localStorage !== 'undefined' ? localStorage.getItem('cat_market_rated') === '1' : false));
  const [ratingCount, setRatingCount] = useState(() => {
    if (typeof localStorage === 'undefined') return 8742;
    const v = localStorage.getItem('cat_market_rating_count');
    return v ? parseInt(v, 10) : 8742;
  });
  const [questOpen, setQuestOpen] = useState(true);
  const [prompt, setPrompt] = useState(false);
  const [ad, setAd] = useState<AdState | null>(null);
  const [adLeft, setAdLeft] = useState(AD_SECONDS);
  const [fps, setFps] = useState({ fps: 60, q: 'HQ 100%' });
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const money = status.money;
  const cat = status.cat;
  const catKey = JSON.stringify(cat);
  const setCat = (p: Partial<CatCfg>) => gameRef.current?.setCat(p);

  useEffect(() => {
    const g = new Game(canvasRef.current!);
    gameRef.current = g;
    g.onMoney = () => setBump((b) => b + 1);
    g.onStatus = (s) => setStatus(s);
    g.onFps = (f, q) => setFps({ fps: f, q });
    g.onTreasure = () => setPrompt(true);
    g.onSelectSlot = (idx, cur) => setSlotModal({ idx, cur });
    let tid = 0;
    g.onToast = (msg) => {
      setToast({ id: ++tid, msg });
      const my = tid;
      setTimeout(() => setToast((t) => (t && t.id === my ? null : t)), 3200);
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'r' && !e.repeat) setRunLatch(g.runLatch);
      if (k === 'm' && !e.repeat) { sfx.setMuted(!sfx.muted); setMuted(sfx.muted); }
      if (k === 'u' && !e.repeat) setPanel((v) => !v);
      if (k === 'k' && !e.repeat) setWardrobe((v) => !v);
      if (k === 'b' && !e.repeat) setBook((v) => !v);
      if ((k === 'h' || k === '?') && !e.repeat) setGuide((v) => !v);
      if (k === 'escape') { setPanel(false); setWardrobe(false); setBook(false); setGuide(false); setRatingModal(false); setSlotModal(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); g.destroy(); };
  }, []);

  useEffect(() => {
    if (gameRef.current) gameRef.current.paused = panel || wardrobe || book || guide || ratingModal || !!slotModal || prompt || !!ad;
  }, [panel, wardrobe, book, guide, ratingModal, prompt, ad]);

  useEffect(() => {
    if (!ad) return;
    setAdLeft(AD_SECONDS);
    const id = setInterval(() => setAdLeft((v) => Math.max(0, +(v - 0.1).toFixed(1))), 100);
    return () => clearInterval(id);
  }, [ad]);

  const requestAd = (label: string, reward: string, cb: (ok: boolean) => void) => {
    const poki = (window as unknown as { PokiSDK?: { rewardedBreak?: () => Promise<boolean> } }).PokiSDK;
    if (poki?.rewardedBreak) {
      poki.rewardedBreak().then((ok) => cb(!!ok)).catch(() => cb(false));
      return;
    }
    setAd({ label, reward, cb });
  };
  const finishAd = (ok: boolean) => {
    const a = ad;
    setAd(null);
    a?.cb(ok);
  };

  const watchBoard = () => requestAd('Skateboard', '🛹 Skateboard permanen', (ok) => { if (ok) gameRef.current?.grantBoard(); });
  const watchSkates = () => requestAd('Sepatu Roda', '🛼 Sepatu roda permanen', (ok) => { if (ok) gameRef.current?.grantSkates(); });
  const watchTreasure = () => {
    setPrompt(false);
    requestAd('Harta Karun', '🎁 Peti harta karun', (ok) => {
      if (ok) gameRef.current?.claimTreasure(); else gameRef.current?.declineTreasure();
    });
  };
  const declineTreasure = () => { setPrompt(false); gameRef.current?.declineTreasure(); };

  const toggleRun = () => {
    const g = gameRef.current;
    if (!g) return;
    g.runLatch = !g.runLatch;
    setRunLatch(g.runLatch);
  };
  const toggleMute = () => {
    sfx.unlock();
    sfx.setMuted(!sfx.muted);
    setMuted(sfx.muted);
    if (!sfx.muted) sfx.meow('meow', 1.1, 0.8);
  };

  const submitRating = () => {
    if (hasRated) return;
    const next = ratingCount + 1;
    setRatingCount(next);
    setHasRated(true);
    try {
      localStorage.setItem('cat_market_rated', '1');
      localStorage.setItem('cat_market_rating_count', String(next));
    } catch {}
    sfx.fanfare();
    if (gameRef.current) {
      gameRef.current.onToast('⭐ Terima kasih atas rating 5 bintangmu! 🐱💖 Suaramu telah dicatat!');
    }
  };

  const modeText = status.fishing ? '🎣 Mancing' : status.skid ? 'Skid' : status.mode === 'RUN' ? 'Lari' : status.mode === 'WALK' ? 'Jalan' : 'Santai';
  const m = status.mission;
  const mpct = Math.min(100, Math.round((m.prog / m.goal) * 100));
  const canBuy = status.ups.some((u) => u.lvl < u.max && money >= u.cost);

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-[#43b8ee] touch-none">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {/* ---------- TOP-LEFT HUD: Clean, Sleek, Minimalist (No cluttered chips!) ---------- */}
      <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-2 max-w-[85vw] sm:max-w-md">
        <div className="flex items-center gap-2">
          {/* Cash counter badge */}
          <div
            key={bump}
            className={`${PANEL} inline-flex items-center gap-2 py-1.5 pl-2 pr-4`}
            style={{ animation: bump ? 'pop .22s ease-out' : undefined }}
          >
            <div className="grid h-9 w-11 place-items-center rounded-lg border-[3px] border-[#237a2e] bg-[#46c652] shadow-inner">
              <div className="grid h-5 w-5 place-items-center rounded-full bg-[#a9f0b0] text-[11px] font-black text-[#237a2e]">$</div>
            </div>
            <span className={`text-[25px] font-black tabular-nums leading-none ${BROWN}`}>
              {money.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Buku Catatan / Stok Button (Opens the clean Ledger Book!) */}
          <button
            onClick={() => setBook(true)}
            onPointerDown={(e) => e.stopPropagation()}
            className={`${PANEL} group relative flex items-center gap-1.5 px-3 py-2 text-left transition hover:scale-105 active:scale-95`}
            title="Buka Catatan Stok & Toko (B)"
          >
            <span className="text-xl">📖</span>
            <div className="leading-tight">
              <div className={`text-[12px] font-black ${BROWN}`}>Catatan Stok</div>
              <div className="text-[10px] font-bold text-[#b4844c]">Tekan B</div>
            </div>
          </button>

          {/* Panduan Bermain Button */}
          <button
            onClick={() => setGuide(true)}
            onPointerDown={(e) => e.stopPropagation()}
            className="grid h-11 w-11 place-items-center rounded-2xl border-[3px] border-[#4ea8e8] bg-[#e1f5ff] text-xl font-black text-[#1d6fb8] shadow-[0_3px_0_#2a8ac8,0_6px_12px_rgba(0,0,0,.15)] transition hover:scale-105 active:scale-95"
            title="Panduan Bermain Singkat & Jelas"
          >
            ❓
          </button>
        </div>

        {/* Quest Notification Card (Sleek, Compact, Beautiful game notification style!) */}
        <div className="w-full max-w-[340px]">
          <div className="overflow-hidden rounded-2xl border-[2.5px] border-[#e8c68c] bg-gradient-to-b from-[#fffaf0] to-[#fff2d6] shadow-[0_3px_0_#d9a764,0_8px_16px_rgba(0,0,0,.12)]">
            <button
              onClick={() => setQuestOpen((v) => !v)}
              className="flex w-full items-center justify-between bg-gradient-to-r from-[#ffa53b] via-[#ff9424] to-[#ff8014] px-3 py-1.5 text-left text-white shadow-inner"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-black tracking-wide drop-shadow-sm">
                <span>⭐ MISI TUTORIAL · LEVEL {status.level}/20</span>
              </div>
              <div className="flex items-center gap-1.5">
                {!m.done && (
                  <span className="rounded-lg bg-white/95 px-2 py-0.5 text-[10px] font-black text-[#d06400] shadow-sm">
                    +${m.reward}
                  </span>
                )}
                <span className="text-[10px] font-bold text-white/90">{questOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {questOpen && (
              <div className="px-3 py-2">
                <div className={`text-[13px] font-black leading-snug ${BROWN}`}>
                  {m.text}
                </div>
                {!m.done ? (
                  <div className="mt-1.5 flex items-center gap-2.5">
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full border border-[#dca662] bg-[#f4e1ba]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-500 transition-[width] duration-300"
                        style={{ width: `${mpct}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-black tabular-nums ${BROWN}`}>
                      {m.prog}/{m.goal}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] font-black text-emerald-600">
                    🎉 Semua misi selesai!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------- TOP-RIGHT: Square Icon Buttons (Poki / Monkey-Mart Style) ---------- */}
      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
        <div className="flex flex-wrap justify-end gap-2">
          <SqBtn icon="⭐" label="10K Rating" onClick={() => setRatingModal(true)} badge={hasRated ? undefined : '5★'} />
          <SqBtn icon="🐾" label="Upgrade" onClick={() => setPanel((v) => !v)} badge={canBuy && !panel ? '!' : undefined} />
          <SqBtn icon="😺" label="Kostum" onClick={() => setWardrobe(true)} />
          {status.boardOwned ? (
            <SqBtn icon="🛹" label="Papan" on={status.boardOn} onClick={() => gameRef.current?.toggleBoard()} />
          ) : (
            <SqBtn icon="🛹" label="Papan" ad onClick={watchBoard} />
          )}
          {status.skatesOwned ? (
            <SqBtn icon="🛼" label="Roda" on={status.skatesOn} onClick={() => gameRef.current?.toggleSkates()} />
          ) : (
            <SqBtn icon="🛼" label="Roda" ad onClick={watchSkates} />
          )}
          <SqBtn icon="🏃" label="Lari" on={runLatch} onClick={toggleRun} />
          <SqBtn icon={muted ? '🔇' : '🔊'} label="Suara" on={!muted} onClick={toggleMute} />
        </div>

        <div className="pointer-events-none flex flex-wrap justify-end gap-1.5">
          <Chip>{modeText}</Chip>
          <Chip>🧺 {status.carry}/{status.max}</Chip>
        </div>
        <div className="pointer-events-none rounded-lg bg-black/30 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white/85">
          {fps.fps} FPS · {fps.q}
        </div>
      </div>

      {/* ---------- TOAST NOTIFICATION ---------- */}
      {toast && (
        <div key={toast.id} className="pointer-events-none absolute left-1/2 top-20 z-20 -translate-x-1/2" style={{ animation: 'toast 3.2s ease-out forwards' }}>
          <div className="relative rounded-2xl border-[3px] border-[#e0a000] bg-[#ffe14d] px-5 py-2.5 text-center text-sm font-black text-[#6a3d00] shadow-[0_4px_0_#c98a00,0_10px_18px_rgba(0,0,0,.2)]">
            {toast.msg}
            <span className="absolute -bottom-[9px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-b-[3px] border-r-[3px] border-[#e0a000] bg-[#ffe14d]" />
          </div>
        </div>
      )}

      {/* ---------- BUKU CATATAN TOKO & STOK MODAL ---------- */}
      {book && (
        <Modal onClose={() => setBook(false)}>
          <div className="mb-3 flex items-center justify-between border-b-2 border-[#e4bd84] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📖</span>
              <div>
                <div className={`text-lg font-black ${BROWN}`}>Buku Catatan Toko &amp; Stok</div>
                <div className="text-[11px] font-bold text-[#9a7448]">Semua kapasitas etalase kini 18 item!</div>
              </div>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-xl bg-[#f1dfba] font-black text-[#8a5a2b]" onClick={() => setBook(false)}>✕</button>
          </div>

          <div className="space-y-2.5">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#a07a4a]">📦 Stok Lapak Jualan</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <StockCard icon="🪣" name="Kolam Ikan" cur={status.pond} max={status.pondCap} color="bg-sky-500" />
              <StockCard icon="🧊" name="Meja Es Ikan" cur={status.table} max={status.tableCap} color="bg-cyan-500" />
              {status.sushiOn && <StockCard icon="🍣" name="Bar Sushi" cur={status.sushi} max={status.sushiCap} color="bg-rose-500" sub={`Mentah: ${status.tray}/${status.trayCap}`} />}
              {status.orchardOn && <StockCard icon="🥭" name="Kios Mangga" cur={status.mango} max={status.mangoCap} color="bg-amber-500" />}
              {status.crabOn && <StockCard icon="🦀" name="Kepiting Matang" cur={status.crab} max={status.crabCap} color="bg-red-500" sub={`Mentah: ${status.rawIn}`} />}
              {status.juiceOn && <StockCard icon="🧃" name="Bar Jus Buah" cur={status.juice} max={status.juiceCap} color="bg-teal-500" />}
            </div>

            <div className="mt-3 text-[11px] font-black uppercase tracking-wider text-[#a07a4a]">😸 Kru &amp; Otomatisasi</div>
            <div className="rounded-2xl border-2 border-[#ecd2a2] bg-white/75 p-2.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#6a4421]">😸 Asisten Kucing:</span>
                <span className="font-black text-emerald-700">{status.assist} / 3 Aktif</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#6a4421]">⛵ Kapal Nelayan:</span>
                <span className="font-black text-sky-700">{status.boatOn ? 'Aktif (Panen 10 ikan)' : 'Belum Dibeli'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#6a4421]">🐱 Kucing Kasir:</span>
                <span className="font-black text-emerald-700">{status.cashierOn ? 'Aktif di Meja Kasir' : 'Belum Disewa'}</span>
              </div>
            </div>

            <div className="mt-2 text-center text-[11px] font-semibold text-[#a07a4a]">
              Tips: Upgrade <b>Kolam Besar</b> &amp; <b>Joran Super</b> di tombol 🐾 Upgrade untuk mempercepat stok!
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- PANDUAN BERMAIN SINGKAT & JELAS MODAL ---------- */}
      {guide && (
        <Modal onClose={() => setGuide(false)}>
          <div className="mb-3 flex items-center justify-between border-b-2 border-[#e4bd84] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              <div>
                <div className={`text-lg font-black ${BROWN}`}>Panduan Bermain Cat Fish Market</div>
                <div className="text-[11px] font-bold text-[#9a7448]">Singkat, padat, dan mudah dipahami!</div>
              </div>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-xl bg-[#f1dfba] font-black text-[#8a5a2b]" onClick={() => setGuide(false)}>✕</button>
          </div>

          <div className="space-y-2.5 text-xs text-[#6a4421]">
            <GuideStep num="1" icon="🎣" title="Mancing & Kolam Ikan" desc="Berdiri di kotak 🎣 dermaga. Ikan otomatis ditarik dan melompat masuk ke kolam!" />
            <GuideStep num="2" icon="🧺" title="Angkut & Isi Lapak" desc="Dekati kolam/pohon untuk ambil hasil ke keranjang dada. Bawa ke Meja Es, Bar Sushi, Kios Mangga, dll." />
            <GuideStep num="3" icon="💵" title="Kasir & Panen Uang" desc="Pembeli antre ke kasir. Berdiri di kotak AMBIL UANG untuk mengumpulkan uang secara otomatis!" />
            <GuideStep num="4" icon="🦀" title="Kepiting & Bar Jus" desc="Tanam rumput laut di air dangkal -> beri makan kepiting -> masak di mesin merah. Petik jeruk & apel -> blender jus!" />
            <GuideStep num="5" icon="😸" title="Asisten & Kapal Nelayan" desc="Sewa 3 Asisten Kucing agar mereka mancing & isi stok otomatis! Sewa Kapal ⛵ agar nelayan pulang bawa 10 ikan." />
            <GuideStep num="6" icon="🔓" title="Naik Level & Buka Zona 2, 3, 4" desc="Selesaikan Quest untuk membuka level dan gerbang pulau berikutnya! Tekan SPACE jika ingin buka semua seketika." />

            <div className="mt-3 rounded-2xl border-2 border-[#ecd2a2] bg-white/80 p-2.5">
              <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-[#a07a4a]">⌨️ Tombol Pintas Keyboard</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-bold text-[#6a4421]">
                <div><b>WASD / Panah</b> : Jalan</div>
                <div><b>Shift / 🏃</b> : Lari Kencang</div>
                <div><b>B</b> : Buka Buku Stok</div>
                <div><b>U</b> : Menu Upgrade</div>
                <div><b>K</b> : Menu Kostum</div>
                <div><b>SPACE</b> : Buka Semua Rahasia</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- RATING COMMUNITY GOAL MODAL ---------- */}
      {ratingModal && (
        <Modal onClose={() => setRatingModal(false)}>
          <div className="mb-3 flex items-center justify-between border-b-2 border-[#e4bd84] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-spin" style={{ animationDuration: '6s' }}>⭐</span>
              <div>
                <div className={`text-lg font-black ${BROWN}`}>Target 10.000 Rating Bintang 5!</div>
                <div className="text-[11px] font-bold text-[#9a7448]">Dukungan komunitas untuk update bulan depan</div>
              </div>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-xl bg-[#f1dfba] font-black text-[#8a5a2b]" onClick={() => setRatingModal(false)}>✕</button>
          </div>

          <div className="space-y-3 text-xs text-[#6a4421]">
            <div className="rounded-2xl border-2 border-[#ecd2a2] bg-gradient-to-b from-[#fffaf0] to-[#fff0d0] p-3 shadow-sm text-center">
              <div className="text-3xl mb-1">🏝️ 🚧 🚀</div>
              <div className="font-black text-sm text-[#7a4810]">Bantu Buka Zona 3 &amp; Zona 4!</div>
              <div className="mt-1 text-[11px] font-semibold text-[#8a5c28] leading-relaxed">
                Zona 3 (Teluk Kelapa) dan Zona 4 (Pulau Mutiara) sedang dalam tahap pengembangan aktif.
                Jika rating game di browser mencapai <b>10.000 bintang 5</b>, progress ekspansi akan dilanjutkan dan dirilis bulan depan!
              </div>

              {/* Progress counter */}
              <div className="mt-3 rounded-xl border border-[#e8c68c] bg-white/90 p-2.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-amber-800">Progres Dukungan Pemain:</span>
                  <span className="text-emerald-700 font-extrabold tabular-nums">
                    {ratingCount.toLocaleString('id-ID')} / 10.000 ⭐
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full border border-[#dca662] bg-[#f4e1ba]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-500 transition-[width] duration-500"
                    style={{ width: `${Math.min(100, (ratingCount / 10000) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-[10px] font-bold text-amber-700">
                  {((ratingCount / 10000) * 100).toFixed(1)}% Tercapai
                </div>
              </div>
            </div>

            {/* Action button */}
            {hasRated ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-3 text-center font-black text-emerald-800">
                <span className="text-xl">✅</span>
                <span>Kamu sudah memberi rating 5 bintang! Terima kasih atas dukunganmu! 🐱💖</span>
              </div>
            ) : (
              <button
                onClick={submitRating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-b-4 border-[#c98a00] bg-gradient-to-b from-[#ffd43b] via-[#ffc71a] to-[#ffa500] py-3 text-base font-black text-[#582400] shadow-lg transition hover:brightness-105 active:translate-y-0.5 active:border-b-2"
              >
                <span className="text-xl">⭐</span>
                <span>Beri Rating 5 Bintang Sekarang!</span>
              </button>
            )}

            <div className="text-center text-[11px] font-semibold text-[#a07a4a]">
              Setiap rating darimu sangat berharga agar game ini terus diupdate dan makin seru!
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- MODAL PILIH LAPAK ZONA 2 (18 KATALOG LAPAK PANTAI) ---------- */}
      {slotModal && (
        <Modal onClose={() => setSlotModal(null)}>
          <div className="mb-3 flex items-center justify-between border-b-2 border-[#e4bd84] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎪</span>
              <div>
                <div className={`text-lg font-black ${BROWN}`}>Pilih Lapak Zona 2 · Slot #{slotModal.idx + 1}</div>
                <div className="text-[11px] font-bold text-[#9a7448]">Pilih dari 18 macam lapak pantai seru!</div>
              </div>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-xl bg-[#f1dfba] font-black text-[#8a5a2b]" onClick={() => setSlotModal(null)}>✕</button>
          </div>

          {/* Filter Categories */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {['Semua', 'Makanan', 'Minuman', 'Souvenir', 'Wahana', 'Relaksasi'].map((catName) => (
              <button
                key={catName}
                onClick={() => setStallFilter(catName)}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-black transition active:scale-95 ${
                  stallFilter === catName
                    ? 'border-2 border-[#c97a22] bg-[#ff9f45] text-white shadow-sm'
                    : 'border-2 border-[#ecd2a2] bg-white/80 text-[#8a5a28] hover:bg-[#ffeec2]'
                }`}
              >
                {catName}
              </button>
            ))}
          </div>

          {/* Stalls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {STALL_CATALOG.filter((st) => stallFilter === 'Semua' || st.category === stallFilter).map((st) => {
              const isCurrent = (status.zone2Stalls[slotModal.idx] || 'kelapa') === st.id;
              return (
                <div
                  key={st.id}
                  className={`relative flex flex-col justify-between rounded-2xl border-2 p-2.5 transition ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-300'
                      : 'border-[#ecd2a2] bg-white/85 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-3xl">{st.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[12.5px] font-black ${BROWN}`}>{st.name.replace('\n', ' ')}</span>
                      </div>
                      <div className="text-[10px] font-bold text-amber-700">{st.category} · Hasil +${st.price}</div>
                      <div className="mt-0.5 text-[10.5px] font-semibold leading-tight text-[#8a6a44]">{st.desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      gameRef.current?.setZone2Stall(slotModal.idx, st.id);
                      setSlotModal(null);
                    }}
                    className={`mt-2 w-full rounded-xl border-b-4 py-1.5 text-xs font-black text-white transition active:translate-y-0.5 active:border-b-2 ${
                      isCurrent
                        ? 'border-emerald-700 bg-emerald-500'
                        : 'border-[#c97a22] bg-gradient-to-b from-[#ffa042] to-[#e87018] hover:brightness-105'
                    }`}
                  >
                    {isCurrent ? '✓ TERPASANG' : 'PASANG DI SLOT INI'}
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* ---------- UPGRADE MODAL ---------- */}
      {panel && (
        <Modal onClose={() => setPanel(false)}>
          <div className="mb-3 flex items-center justify-between">
            <div className={`text-xl font-black ${BROWN}`}>🐾 Upgrade Toko</div>
            <div className="rounded-xl border-2 border-[#237a2e] bg-[#46c652] px-3 py-1 text-sm font-black text-white">${money.toLocaleString('id-ID')}</div>
          </div>
          <div className="space-y-2">
            {status.ups.map((u) => {
              const maxed = u.lvl >= u.max;
              const ok = !maxed && money >= u.cost;
              return (
                <div key={u.id} className="flex items-center gap-3 rounded-2xl border-2 border-[#ecd2a2] bg-white/80 p-2.5">
                  <div className="grid h-12 w-12 place-items-center rounded-xl border-2 border-[#ecd2a2] bg-[#ffeec2] text-2xl">{u.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-black ${BROWN}`}>{u.name}</div>
                    <div className="text-xs font-semibold text-[#9a7448]">{u.desc}</div>
                    <div className="mt-1 flex gap-1">
                      {Array.from({ length: u.max }).map((_, i) => (
                        <span key={i} className={`h-2 flex-1 rounded-full ${i < u.lvl ? 'bg-emerald-500' : 'bg-[#ecd9b0]'}`} />
                      ))}
                    </div>
                  </div>
                  <button
                    disabled={!ok}
                    onClick={() => gameRef.current?.buy(u.id)}
                    className={`min-w-[74px] rounded-xl border-b-4 px-3 py-2 text-sm font-black text-white transition active:translate-y-0.5 active:border-b-2 ${
                      maxed ? 'border-[#8a8a8a] bg-[#a8a8a8]' : ok ? 'border-emerald-700 bg-emerald-500' : 'border-[#8a8a8a] bg-[#b4b4b4] opacity-70'
                    }`}
                  >
                    {maxed ? 'MAX' : `$${u.cost}`}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[#9a7448]">
            <span>Buka area baru dengan berdiri di kotak harga 💰 — atau tekan <b>SPACE</b>.</span>
            <button
              className="ml-2 shrink-0 rounded-lg bg-[#f1dfba] px-2 py-1 font-bold text-[#9a7448] hover:bg-red-100 hover:text-red-600"
              onClick={() => { if (confirm('Hapus semua progres dan mulai dari awal?')) gameRef.current?.resetSave(); }}
            >
              Reset
            </button>
          </div>
        </Modal>
      )}

      {/* ---------- WARDROBE & SLIDERS MODAL ---------- */}
      {wardrobe && (
        <Modal onClose={() => setWardrobe(false)}>
          <div className="mb-2 flex items-center justify-between">
            <div className={`text-xl font-black ${BROWN}`}>😺 Kostum &amp; Ukuran Kucing</div>
            <button className="rounded-lg bg-[#f1dfba] px-2 py-1 text-sm font-black text-[#9a7448]" onClick={() => setWardrobe(false)}>✕</button>
          </div>

          <Label>Skin</Label>
          <div className="grid grid-cols-2 gap-2">
            {([['tabby', 'Tabby Oranye'], ['calico', 'Calico Biru']] as [SkinId, string][]).map(([id, label]) => (
              <CatCard key={id} rev={catKey} label={label} selected={status.skin === id} pal={makePlayerPal(id, status.hat)} skates={status.skatesOn} board={status.boardOn}
                onClick={() => gameRef.current?.setSkin(id)} />
            ))}
          </div>

          <Label>Topi</Label>
          <div className="grid grid-cols-3 gap-2">
            {([['bucket', 'Topi Bucket'], ['cap', 'Topi Biru'], ['none', 'Tanpa Topi']] as [HatId, string][]).map(([id, label]) => (
              <CatCard key={id} rev={catKey} label={label} selected={status.hat === id} pal={makePlayerPal(status.skin, id)} skates={status.skatesOn} board={status.boardOn} small
                onClick={() => gameRef.current?.setHat(id)} />
            ))}
          </div>

          <div className="mb-1 mt-3 flex items-center justify-between">
            <Label tight>Ukuran &amp; Bentuk</Label>
            <button onClick={() => gameRef.current?.resetCat()} className="rounded-lg bg-[#f1dfba] px-2 py-0.5 text-[11px] font-bold text-[#9a7448] hover:bg-amber-200">↺ Reset</button>
          </div>
          <div className="space-y-2.5 rounded-2xl border-2 border-[#ecd2a2] bg-white/70 p-3">
            <Slider label="Ukuran kepala" value={cat.head} range={CAT_RANGE.head} onChange={(v) => setCat({ head: v })} />
            <Slider label="Jarak antar mata" value={cat.eyeGap} range={CAT_RANGE.eyeGap} onChange={(v) => setCat({ eyeGap: v })} />
            <Slider label="Tinggi perut" value={cat.bellyH} range={CAT_RANGE.bellyH} onChange={(v) => setCat({ bellyH: v })} />
            <Slider label="Lebar perut" value={cat.bellyW} range={CAT_RANGE.bellyW} onChange={(v) => setCat({ bellyW: v })} />
            <Slider label="Panjang kaki" value={cat.legs} range={CAT_RANGE.legs} onChange={(v) => setCat({ legs: v })} />
            <Slider label="Jarak antar kaki" value={cat.legGap} range={CAT_RANGE.legGap} onChange={(v) => setCat({ legGap: v })} />
            <Slider label="Besar mata" value={cat.eyeSize} range={CAT_RANGE.eyeSize} onChange={(v) => setCat({ eyeSize: v })} />
            <Slider label="Posisi mata (naik / turun)" value={cat.eyeY} range={CAT_RANGE.eyeY} step={0.5}
              fmt={(v) => (v > 0 ? '+' : '') + v.toFixed(1)} onChange={(v) => setCat({ eyeY: v })} />
            <Slider label="Pupil naik / turun" value={cat.pupilY} range={CAT_RANGE.pupilY} step={0.25}
              fmt={(v) => (v > 0 ? '+' : '') + v.toFixed(2)} onChange={(v) => setCat({ pupilY: v })} />
            <Slider label="Jarak antar pupil (+ menjauh, − mendekat)" value={cat.pupilGap} range={CAT_RANGE.pupilGap} step={0.25}
              fmt={(v) => (v > 0 ? '+' : '') + v.toFixed(2)} onChange={(v) => setCat({ pupilGap: v })} />
            <Slider label="Besar pupil" value={cat.pupilSize} range={CAT_RANGE.pupilSize} onChange={(v) => setCat({ pupilSize: v })} />
            <button
              onClick={() => setCat({ sparkle: cat.sparkle > 0.5 ? 0 : 1 })}
              className={`flex w-full items-center justify-between rounded-xl border-b-4 px-3 py-2 text-sm font-black text-white transition active:translate-y-0.5 active:border-b-2 ${
                cat.sparkle > 0.5 ? 'border-fuchsia-700 bg-fuchsia-500' : 'border-[#8a8a8a] bg-[#a8a8a8]'
              }`}
            >
              <span>✨ Kilau pupil (sparkle)</span>
              <span>{cat.sparkle > 0.5 ? 'ON' : 'OFF'}</span>
            </button>
            <Slider label="Sudut kuping (miring keluar)" value={cat.earAngle} range={CAT_RANGE.earAngle} step={1}
              fmt={(v) => (v > 0 ? '+' : '') + Math.round(v) + '°'} onChange={(v) => setCat({ earAngle: v })} />
            <Slider label="Lebar kuping" value={cat.earWidth} range={CAT_RANGE.earWidth} onChange={(v) => setCat({ earWidth: v })} />
            <Slider label="Tinggi kuping" value={cat.earHeight} range={CAT_RANGE.earHeight} onChange={(v) => setCat({ earHeight: v })} />
            <Slider label="Posisi kuping (naik / turun dari kepala)" value={cat.earLift} range={CAT_RANGE.earLift} step={0.5}
              fmt={(v) => (v > 0 ? '+' : '') + v.toFixed(1)} onChange={(v) => setCat({ earLift: v })} />
            <Slider label="Posisi kepala (naik / turun)" value={cat.headLift} range={CAT_RANGE.headLift} step={0.5}
              fmt={(v) => (v > 0 ? '+' : '') + v.toFixed(1)} onChange={(v) => setCat({ headLift: v })} />
          </div>

          <ShopRow icon="🛹" title="Skateboard" desc="Kecepatan +42%, berdiri di atas papan & meluncur" owned={status.boardOwned} on={status.boardOn}
            onUse={() => gameRef.current?.toggleBoard()} onAd={() => { setWardrobe(false); watchBoard(); }} />
          <ShopRow icon="🛼" title="Sepatu Roda" desc="Kecepatan +32% & meluncur keren" owned={status.skatesOwned} on={status.skatesOn}
            onUse={() => gameRef.current?.toggleSkates()} onAd={() => { setWardrobe(false); watchSkates(); }} />
        </Modal>
      )}

      {/* ---------- TREASURE PROMPT MODAL ---------- */}
      {prompt && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className={`${PANEL} w-full max-w-sm p-5 text-center`} style={{ animation: 'pop .3s ease-out' }}>
            <div className="text-5xl" style={{ animation: 'wob 1.2s ease-in-out infinite' }}>🎁</div>
            <div className={`mt-1 text-2xl font-black ${BROWN}`}>Harta Karun!</div>
            <div className="mt-1 text-sm font-semibold text-[#9a7448]">Peti ini turun dari langit. Tonton iklan singkat untuk membukanya dan ambil hadiahnya!</div>
            <div className="mt-4 flex gap-2">
              <button onClick={declineTreasure} className="flex-1 rounded-xl border-b-4 border-[#b9a07a] bg-[#e8d6b0] px-3 py-3 text-sm font-black text-[#7a5a2a] active:translate-y-0.5 active:border-b-2">
                Nanti
              </button>
              <button onClick={watchTreasure} className="flex-[1.6] rounded-xl border-b-4 border-[#c98a00] bg-gradient-to-b from-[#ffe14d] to-[#ffc61a] px-3 py-3 text-sm font-black text-[#6a3d00] active:translate-y-0.5 active:border-b-2">
                ▶ Tonton Iklan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- REWARDED AD (SIMULATED / POKI) ---------- */}
      {ad && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/85 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300">
              <span>📺 Iklan Reward · simulasi</span>
              <span>{adLeft > 0 ? `Hadiah dalam ${Math.ceil(adLeft)}s` : 'Selesai!'}</span>
            </div>
            <div className="relative grid aspect-video place-items-center overflow-hidden bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-orange-400">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #fff 0, transparent 40%), radial-gradient(circle at 80% 70%, #fff 0, transparent 35%)' }} />
              <div className="relative text-center text-white drop-shadow">
                <div className="text-6xl" style={{ animation: 'wob 1.2s ease-in-out infinite' }}>🐱🎮</div>
                <div className="mt-2 text-2xl font-black">Game Seru Berikutnya!</div>
                <div className="text-sm font-semibold opacity-90">(ini hanya placeholder iklan)</div>
              </div>
            </div>
            <div className="h-1.5 bg-slate-700">
              <div className="h-full bg-emerald-400 transition-[width] duration-100" style={{ width: `${((AD_SECONDS - adLeft) / AD_SECONDS) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="text-xs font-semibold text-slate-300">Hadiah: <b className="text-yellow-300">{ad.reward}</b></div>
              {adLeft > 0 ? (
                <button onClick={() => finishAd(false)} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-600">
                  Tutup (tanpa hadiah)
                </button>
              ) : (
                <button onClick={() => finishAd(true)} className="rounded-xl border-b-4 border-emerald-700 bg-emerald-500 px-4 py-2 text-sm font-black text-white active:translate-y-0.5 active:border-b-2" style={{ animation: 'pop .3s ease-out' }}>
                  ✅ Klaim Hadiah
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.14)}100%{transform:scale(1)}}
        @keyframes wob{0%,100%{transform:rotate(-8deg) scale(1)}50%{transform:rotate(8deg) scale(1.1)}}
        @keyframes toast{0%{opacity:0;transform:translate(-50%,-14px) scale(.9)}8%{opacity:1;transform:translate(-50%,0) scale(1.04)}14%{transform:translate(-50%,0) scale(1)}85%{opacity:1}100%{opacity:0;transform:translate(-50%,-8px)}}
      `}</style>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <div className={`rounded-xl border-2 border-[#e4bd84] bg-[#fff6df] px-2.5 py-1 text-xs font-black shadow-[0_2px_0_#d2a566] ${BROWN}`}>{children}</div>;
}

function StockCard({ icon, name, cur, max, color, sub }: { icon: string; name: string; cur: number; max: number; color: string; sub?: string }) {
  const pct = Math.min(100, Math.round((cur / max) * 100));
  const full = cur >= max;
  return (
    <div className="rounded-2xl border-2 border-[#ecd2a2] bg-white/80 p-2.5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black text-white ${full ? 'bg-emerald-500' : 'bg-[#b4844c]'}`}>
          {full ? 'FULL' : `${cur}/${max}`}
        </span>
      </div>
      <div className="mt-1 font-black text-[#6a4421]">{name}</div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#f1dfba]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {sub && <div className="mt-1 text-[10px] font-bold text-[#a07a4a]">{sub}</div>}
    </div>
  );
}

function GuideStep({ num, icon, title, desc }: { num: string; icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#ecd2a2] bg-white/85 p-2.5 shadow-sm">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#ffeec2] text-lg font-black text-[#8a5a2b]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-[#8a5a2b] px-1.5 py-0.2 text-[9px] font-black text-white">LANGKAH {num}</span>
          <span className="font-black text-[#6a4421]">{title}</span>
        </div>
        <div className="mt-0.5 text-[11px] font-semibold leading-relaxed text-[#7a5a2a]">{desc}</div>
      </div>
    </div>
  );
}

function SqBtn({ icon, label, onClick, badge, on, ad }: { icon: string; label: string; onClick: () => void; badge?: string; on?: boolean; ad?: boolean }) {
  return (
    <button
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={`relative grid h-[56px] w-[56px] place-items-center rounded-2xl border-[3px] pb-1 shadow-[0_3px_0_#d2a566,0_8px_12px_rgba(0,0,0,.16)] transition active:translate-y-[2px] active:shadow-[0_1px_0_#d2a566] ${
        on ? 'border-[#46c26a] bg-[#e6ffe8]' : 'border-[#e4bd84] bg-[#fff6df]'
      }`}
    >
      <span className="text-[25px] leading-none drop-shadow-sm">{icon}</span>
      <span className={`-mt-0.5 text-[9px] font-black leading-none ${BROWN}`}>{label}</span>
      {badge && (
        <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-[3px] border-white bg-[#ff4d4d] text-[12px] font-black text-white" style={{ animation: 'pop 1s ease-in-out infinite' }}>
          {badge}
        </span>
      )}
      {on && <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[#46c26a] text-[11px] font-black text-white">✓</span>}
      {ad && (
        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border-2 border-[#e0a000] bg-[#ffe14d] px-1.5 py-[1px] text-[9px] font-black text-[#6a3d00] shadow-[0_2px_0_#c98a00]">
          ▶ IKLAN
        </span>
      )}
    </button>
  );
}

function Label({ children, tight }: { children: React.ReactNode; tight?: boolean }) {
  return <div className={`${tight ? '' : 'mb-1 mt-3'} text-xs font-black uppercase tracking-wider text-[#a07a4a]`}>{children}</div>;
}

function ShopRow({ icon, title, desc, owned, on, onUse, onAd }: { icon: string; title: string; desc: string; owned: boolean; on: boolean; onUse: () => void; onAd: () => void }) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-[#ecd2a2] bg-white/80 p-2.5">
      <div className="grid h-12 w-12 place-items-center rounded-xl border-2 border-[#ecd2a2] bg-[#ffeec2] text-2xl">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-black ${BROWN}`}>{title}</div>
        <div className="text-xs font-semibold text-[#9a7448]">{desc}</div>
      </div>
      {owned ? (
        <button onClick={onUse} className={`min-w-[84px] rounded-xl border-b-4 px-3 py-2 text-sm font-black text-white active:translate-y-0.5 active:border-b-2 ${on ? 'border-emerald-700 bg-emerald-500' : 'border-[#8a8a8a] bg-[#a8a8a8]'}`}>
          {on ? 'DIPAKAI' : 'PAKAI'}
        </button>
      ) : (
        <button onClick={onAd} className="min-w-[84px] rounded-xl border-b-4 border-[#c98a00] bg-[#ffd93b] px-3 py-2 text-sm font-black text-[#6a3d00] active:translate-y-0.5 active:border-b-2">
          ▶ Iklan
        </button>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/45 p-4 backdrop-blur-[2px]" onPointerDown={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border-4 border-[#e4bd84] bg-gradient-to-b from-[#fff9e8] to-[#ffefc9] p-4 shadow-[0_6px_0_#d2a566,0_16px_30px_rgba(0,0,0,.3)]" onPointerDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function CatCard({ label, selected, pal, onClick, skates, board, small, rev }: {
  board?: boolean; rev?: string; label: string; selected: boolean; pal: ReturnType<typeof makePlayerPal>; onClick: () => void; skates: boolean; small?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) renderCatPreview(ref.current, pal, skates, !!board);
  }, [pal, skates, board, rev]);
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border-4 bg-gradient-to-b from-[#fffdf3] to-[#ffeccb] p-1 text-center shadow transition active:scale-95 ${
        selected ? 'border-[#46c26a] ring-2 ring-[#aaf0bd]' : 'border-[#ecd2a2] hover:border-[#e4bd84]'
      }`}
    >
      <canvas ref={ref} className={`mx-auto block ${small ? 'h-[110px] w-[100px]' : 'h-[140px] w-[130px]'}`} />
      <div className={`mt-0.5 text-[12px] font-black ${BROWN}`}>{label}</div>
      {selected && <div className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#46c26a] text-[11px] font-black text-white">✓</div>}
    </button>
  );
}

function Slider({ label, value, range, onChange, step = 0.05, fmt }: { label: string; value: number; range: [number, number]; onChange: (v: number) => void; step?: number; fmt?: (v: number) => string }) {
  return (
    <label className="block">
      <div className={`mb-0.5 flex items-center justify-between text-xs font-bold ${BROWN}`}>
        <span>{label}</span>
        <span className="rounded-md bg-[#ffeec2] px-1.5 py-0.5 tabular-nums text-[#a05a00]">{fmt ? fmt(value) : value.toFixed(2) + '×'}</span>
      </div>
      <input
        type="range"
        min={range[0]}
        max={range[1]}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 w-full cursor-pointer accent-orange-500"
      />
    </label>
  );
}
