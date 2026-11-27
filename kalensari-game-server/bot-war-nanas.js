// Kalensari Game – BOT WAR NANAS DI SERVER (Tahap 2)
// Bot dijalankan server, bukan HP tuan rumah: tidak ikut diam kalau HP / tab tuan rumah macet.
// Otak bot = salinan otak bot game3d.html (buatBotPro + BOT_UMUM + wnSasaran) versi tanpa gambar:
//   gerak per lane, farming monster, rebut & pulih di Tugu Nanas, Buaya, dorong bersama menit ke-9, mundur saat sekarat,
//   serangan dasar, 3 skill dari tabel (dash / area / target / lompat / pel / buff / kebal), kartu stat, Poin Skill, bangkit.
// HP pemain hanya menggambar: posisi & animasi bot (baris 'b'), efek skill (event 'bfx'), pukulan ke hero (event 'hit').
// Angka harus sama dengan game3d.html (BOT_UMUM, HP_MAX, WN_ROLE, WN_MAKS_ROLE, WN_KURVA, BOT_LV).
'use strict';

const r2 = v => Math.round(v * 100) / 100;
const hyp = Math.hypot;
const sudut = (dx, dz) => Math.atan2(dx, dz);
const rnd = (a, b) => a + Math.random() * (b - a);
const acak = L => L[Math.floor(Math.random() * L.length)];

// ---- tabel hero (BOT_UMUM di game3d.html; 5 hero lama memakai versi umum sementara — Bagian 3: otak khusus) ----
const BOT_TABEL = {
  erick: { dasar: ['tendang0', 'tendang1'], s: [{ t: 'dash', a: 'terbang', dmg: 120, stun: .6 }, { t: 'area', a: 'tendang1', dmg: 130, r: 2.6, stun: .8 }, { t: 'lompat', a: 'ulti', dmg: 220, r: 3, stun: 1 }], cd: [.5, 6, 7, 14], cepat: 4.4 },
  doni: { dasar: ['pukul1', 'pukul2', 'tendang', 'lempar'], s: [{ t: 'pel', a: 'lempar', dmg: 110 }, { t: 'pel', a: 'tarik', dmg: 90, stun: 1.2 }, { t: 'area', a: 'pusar', dmg: 180, r: 3, stun: .5 }], cd: [.55, 6, 8, 14] },
  timun: { jauh: 1, jarak: 7, dasar: ['lempar', 'serang', 'sulur'], s: [{ t: 'target', a: 'bambu', dmg: 120, r: 1.8, stun: 1 }, { t: 'pel', a: 'sulur', dmg: 100, lambat: 2 }, { t: 'target', a: 'ulti', dmg: 200, r: 3, lambat: 2.5 }], cd: [.7, 7, 8, 15] },
  buto: { dasar: ['pukul'], s: [{ t: 'dash', a: 'seruduk', dmg: 120, stun: .8 }, { t: 'area', a: 'banting', dmg: 150, r: 2.4, stun: 1.2 }, { t: 'target', a: 'ulti', dmg: 230, r: 3, stun: 1.2, lambat: 2 }], cd: [.8, 7, 9, 16], cepat: 3.8 },
  lutung: { dasar: ['cakar1', 'cakar2', 'cakar3'], s: [{ t: 'lompat', a: 'loncat', dmg: 110, r: 2, stun: .5 }, { t: 'area', a: 'badai', dmg: 140, r: 2.6 }, { t: 'dash', a: 'terkam', dmg: 240, stun: 1 }], cd: [.45, 6, 7, 14], cepat: 4.6 },
  saras: { dasar: ['pukul1', 'pukul2', 'tendang'], s: [{ t: 'dash', a: 'gledeg', dmg: 120, stun: .5 }, { t: 'area', a: 'tinju', dmg: 150, r: 2.4, stun: .8 }, { t: 'lompat', a: 'loncat', dmg: 220, r: 3, stun: 1 }], cd: [.5, 6, 7, 14], cepat: 4.4 },
  angling: { jauh: 1, jarak: 7.5, cepat: 3.2, dasar: ['angin'], s: [{ t: 'pel', a: 'hembus', dmg: 100, dorong: 9 }, { t: 'pel', a: 'api', dmg: 140 }, { t: 'target', a: 'turun', dmg: 220, r: 3, stun: 1 }], cd: [.6, 7, 6, 15] },
  dayang: { jauh: 1, jarak: 7, cepat: 3.2, dasar: ['jarum'], s: [{ t: 'pel', a: 'benang', dmg: 100, stun: .8, lambat: 2 }, { t: 'area', a: 'pukul', dmg: 120, r: 2, stun: 1.2 }, { t: 'target', a: 'panggil', dmg: 200, r: 3, stun: 1.2 }], cd: [.55, 6, 8, 14] },
  nyi: { jauh: 1, jarak: 7.5, cepat: 3.2, dasar: ['serang'], s: [{ t: 'dash', a: 'renang', dmg: 90 }, { t: 'target', a: 'pusaran', dmg: 150, r: 2.6, lambat: 2 }, { t: 'target', a: 'ulti', dmg: 200, r: 2.4, lambat: 1.6 }], cd: [.6, 8, 9, 16] },
  siliwangi: { dasar: ['tebas1', 'tebas2', 'tebas3'], s: [{ t: 'lompat', a: 'panggil', dmg: 130, r: 2.2, stun: .8 }, { t: 'dash', a: 'tebas2', dmg: 110 }, { t: 'dash', a: 'tebas3', dmg: 240, stun: .8 }], cd: [.5, 9, 8, 16], cepat: 4.4 },
  ciung: { jauh: 1, jarak: 7, dasar: ['lempar'], s: [{ t: 'pel', a: 'perintah', dmg: 120, stun: 1.2 }, { t: 'dash', a: 'lincah', dmg: 60 }, { t: 'target', a: 'panggil', dmg: 220, r: 3, stun: .8 }], cd: [.7, 8, 8, 16] },
  sangkuriang: { dasar: ['pukul1', 'pukul2', 'pukul3'], s: [{ t: 'buff', a: 'lari', lama: 4 }, { t: 'area', a: 'putar', dmg: 150, r: 2.6, stun: 1.2 }, { t: 'target', a: 'panggil', dmg: 180, r: 3, stun: 1.2 }], cd: [.55, 10, 8, 16] },
  kiansantang: { dasar: ['tebas1', 'tebas2', 'tebas3'], s: [{ t: 'kebal', a: 'perisai', lama: 2 }, { t: 'dash', a: 'tebas3', dmg: 150 }, { t: 'area', a: 'putar', dmg: 200, r: 2.8, stun: .6 }], cd: [.45, 13, 8, 20], cepat: 4.6 },
  wewe: { jarak: 1.6, cepat: 3.9, dasar: ['pukul1', 'pukul2', 'pukul3'], s: [{ t: 'pel', a: 'lempar', dmg: 90, lambat: 3 }, { t: 'area', a: 'senandung', dmg: 40, r: 3, stun: 1.5 }, { t: 'dash', a: 'kejar', dmg: 260, stun: 1 }], cd: [.7, 7, 11, 24] },
  blorong: { jauh: 1, jarak: 7, cepat: 3.3, dasar: ['serang'], s: [{ t: 'target', a: 'panggil', dmg: 130, r: 1.4, stun: 1.2 }, { t: 'target', a: 'taruh', dmg: 100, r: 2.6, lambat: 2 }, { t: 'dash', a: 'teleport', dmg: 200, stun: .8 }], cd: [.65, 9, 11, 30] },
  masdim: { jauh: 1, jarak: 8, cepat: 3.8, dasar: ['serang'], s: [{ t: 'target', a: 'granat', dmg: 160, r: 2.6, lambat: 1.2 }, { t: 'dash', a: 'lompat', dmg: 30 }, { t: 'target', a: 'bren', dmg: 260, r: 2.6 }], cd: [.55, 7, 9, 18] },
  woyo: { dasar: ['pukul1', 'pukul2', 'tendang'], s: [{ t: 'dash', a: 'pukul2', dmg: 150 }, { t: 'area', a: 'gledeg', dmg: 170, r: 2.6, stun: .5 }, { t: 'dash', a: 'duduk', dmg: 200, stun: .6 }], cd: [.5, 8, 10, 40], cepat: 4.1 },   // Woyo: tinju penolong · hentakan bumi · ojek (bot: motor menabrak)
  patimura: { dasar: ['serang1', 'serang2', 'serang3'], s: [{ t: 'dash', a: 'serbu', dmg: 150 }, { t: 'pel', a: 'belah', dmg: 190, lambat: 1.5 }, { t: 'lompat', a: 'ulti', dmg: 220, r: 2.7, stun: .6 }], cd: [.5, 8, 9, 30], cepat: 4.3 },   // Pattimura: serbuan · belah parang · lompatan saparua
  guntur: { jauh: 1, jarak: 8, cepat: 3.7, dasar: ['serang'], s: [{ t: 'pel', a: 'petir', dmg: 200, lambat: 1 }, { t: 'dash', a: 'lesat', dmg: 40 }, { t: 'area', a: 'ulti', dmg: 300, r: 5 }], cd: [.6, 7, 10, 28] },   // Guntur: tombak petir · lesat · badai guntur
  rawa: { jauh: 1, jarak: 8, cepat: 3.9, dasar: ['serang'], s: [{ t: 'dash', a: 'lesat', dmg: 40, as: 2 }, { t: 'semedi', a: 'semedi', lama: 3 }, { t: 'hidupkan', a: 'ulti', lama: 3, R: 7 }], cd: [.6, 8, 16, 45] },   // Rawa Rontek: lesat + Attack Speed · semedi (kebal + pulih) · ritual kebangkitan
  arjuna: { jauh: 1, jarak: 8.5, cepat: 4.0, dasar: ['tembak'], s: [{ t: 'pel', a: 'tembak', dmg: 50, lambat: 1.5 }, { t: 'buff', a: 'tembak', lama: 3 }, { t: 'pel', a: 'panah', dmg: 380, stun: 1 }], cd: [.5, 8, 11, 30] },
  dewisri: { jauh: 1, jarak: 7.5, cepat: 3.7, dasar: ['serang'], s: [{ t: 'target', a: 'sungai', dmg: 40, r: 2.2, lambat: 2.5 }, { t: 'pel', a: 'kupu', dmg: 200 }, { t: 'buff', a: 'ulti', lama: 3 }], cd: [.6, 10, 8, 45] },
  roro: { jauh: 1, jarak: 7.5, cepat: 3.6, dasar: ['serang'], s: [{ t: 'area', a: 'lesung', dmg: 120, r: 3 }, { t: 'pel', a: 'patung', dmg: 130, stun: 1.2 }, { t: 'target', a: 'ulti', dmg: 260, r: 3.6 }], cd: [.6, 7, 10, 18] },
  wiro: { dasar: ['tebas1', 'tebas2', 'tebas3'], s: [{ t: 'pel', a: 'lempar', dmg: 130 }, { t: 'dash', a: 'silat', dmg: 110, stun: .5 }, { t: 'lompat', a: 'hantam', dmg: 230, r: 3.2, stun: 1 }], cd: [.45, 7, 8, 16], cepat: 4.6 },
  // --- 5 hero dengan otak khusus di game3d.html: sementara versi umum (jenis skill & angka mendekati aslinya) ---
  ocong: { dasar: ['sundul'], s: [{ t: 'lompat', a: 'loncat', dmg: 150, r: 2, stun: .5 }, { t: 'dash', a: 'guling', dmg: 120, dorong: 5 }, { t: 'area', a: 'lingkaran', dmg: 200, r: 2.7, dorong: 6 }], cd: [.55, 4, 4, 6], cepat: 4 },
  kunti: { jauh: 1, jarak: 7.5, cepat: 3.6, dasar: ['tembak'], s: [{ t: 'target', a: 'jerit', dmg: 140, r: 2.4 }, { t: 'buff', a: 'terbang', lama: 4 }, { t: 'target', a: 'tangan', dmg: 120, r: 1.6, stun: 1.5 }], cd: [.55, 4, 9, 6] },
  tuyul: { dasar: ['bacok'], s: [{ t: 'dash', a: 'seluncur', dmg: 120 }, { t: 'buff', a: 'jalan', lama: 3 }, { t: 'area', a: 'lompat', dmg: 150, r: 2.5, stun: .4 }], cd: [.4, 5, 8, 12], cepat: 4.6 },
  genderuwo: { dasar: ['hantam'], s: [{ t: 'dash', a: 'tinju', dmg: 150, stun: .6 }, { t: 'lompat', a: 'hantam', dmg: 180, r: 2.5, stun: 1 }, { t: 'buff', a: 'amuk', lama: 6 }], cd: [.8, 6, 7, 14], cepat: 3.5 },
  pitung: { dasar: ['pukul1', 'pukul2', 'tendang'], s: [{ t: 'dash', a: 'tusuk', dmg: 140 }, { t: 'area', a: 'bacokP', dmg: 160, r: 2.4 }, { t: 'lompat', a: 'ulti', dmg: 260, r: 2.5, stun: 1 }], cd: [.35, 5, 6, 12], cepat: 4.2 },
};
const HP_MAX = { ocong: 1900, kunti: 1900, tuyul: 1750, genderuwo: 2050, pitung: 1900, erick: 1900, doni: 1900, timun: 1850, buto: 2200, lutung: 1700, saras: 1850, angling: 1800, dayang: 1800, nyi: 1800, siliwangi: 1900, ciung: 1800, sangkuriang: 1950, kiansantang: 1850, wiro: 1900, roro: 1850, masdim: 1750, wewe: 1900, blorong: 1800, dewisri: 1750, arjuna: 1700, rawa: 1850, guntur: 1750, patimura: 2000, woyo: 2150 };
const HERO_3D = { pocong: 'ocong', kuntilanak: 'kunti', tuyul: 'tuyul', genderuwo: 'genderuwo', pitung: 'pitung', erick: 'erick', doni: 'doni', timunmas: 'timun', buto: 'buto', lutung: 'lutung', saras: 'saras', angling: 'angling', dayang: 'dayang', nyiroro: 'nyi', siliwangi: 'siliwangi', ciung: 'ciung', sangkuriang: 'sangkuriang', kiansantang: 'kiansantang', wiro: 'wiro', roro: 'roro', masdim: 'masdim', wewe: 'wewe', blorong: 'blorong', dewisri: 'dewisri', arjuna: 'arjuna', rawa: 'rawa', guntur: 'guntur', patimura: 'patimura', woyo: 'woyo' };
const WN_ROLE = { buto: 'tank', genderuwo: 'tank', sangkuriang: 'tank', dayang: 'mm', ciung: 'mm', kunti: 'mage', timun: 'mage', angling: 'mage', nyi: 'mage', roro: 'mage', masdim: 'mm', wewe: 'support', blorong: 'mage', dewisri: 'support', arjuna: 'mm', rawa: 'support', guntur: 'mage', patimura: 'fighter', woyo: 'support', tuyul: 'assassin', lutung: 'assassin', siliwangi: 'assassin' };
const PERAN_HERO = { buto: 'pengawal', genderuwo: 'pengawal', sangkuriang: 'pengawal', kunti: 'jauh', nyi: 'jauh', timun: 'jauh', angling: 'jauh', ciung: 'jauh', dayang: 'jauh', roro: 'jauh', masdim: 'jauh', blorong: 'jauh', dewisri: 'jauh', arjuna: 'jauh', rawa: 'jauh', guntur: 'jauh', patimura: 'dekat', woyo: 'dekat' };   // sisanya 'dekat'
const WN_MAKS = { hp: 100, atk: 100, def: 150, spd: 40, as: 100, cd: 40 };
const WN_MAKS_ROLE = { support: { spd: 60 }, tank: { hp: 200, spd: 60 }, mm: { atk: 200, as: 200 }, fighter: { atk: 200, def: 70 }, assassin: { atk: 200, cd: 60 }, mage: { atk: 200, cd: 60 } };
const WN_KURVA = { fighter: { dasar: .25, tahan: 6, habis: 12 }, mm: { dasar: .3, mulai: 6, penuh: 15 }, skill: { assassin: .2, mage: .2 }, dasarLemah: { assassin: .15, mage: .15 } };
const ST_K = ['hp', 'atk', 'def', 'spd', 'as', 'cd'];
const BOT_LV = [{ pikir: 2.4, dmg: .55, cepat: .85, cd: 1.6, agresi: .7 }, { pikir: 1.5, dmg: .8, cepat: .93, cd: 1.25, agresi: .85 }, { pikir: 1, dmg: 1, cepat: 1, cd: 1, agresi: 1 }, { pikir: .65, dmg: 1.15, cepat: 1.08, cd: .82, agresi: 1.3 }];
// semak tempat sembunyi War Nanas (berpasangan, cermin titik) — sama dengan SEMAK_WN di game3d.html
const SEMAK = [[-6.5, 5], [7, 10.5], [-9, 13.5], [8, 22], [-7, 22], [8.6, 1.8], [7, -3], [-8, 33]].flatMap(([x, z]) => [[x, z], [-x, -z]]);
const SEMAK_R = 1.6;
const WN_Z_RUMAH = 40, KEBAL_HIDUP = 3, JARAK_TUGU = 2.7;
const WNS = { mulai: 9, mundur: .3, kejar: 13, area: 14 };   // dorong bersama mulai menit ke-9
const WNP = { asisMon: 5, killMon: 2, minAsisHero: .05 }, WNA_ASIS = 5, WNB = 10;
const SUP_BK = { mulai: 60, selang: 20, maks: 15, nilai: 6 }, SUP_MENIT = 7;
const PADAT_MON = { mon: .8, buaya: 1.4 };
const TK = { n: 3, lama: 7, mulai: 1.05, jeda: 1.1, dmg: 35, R: 9.5 };   // tengkorak ulti Rawa Rontek (samakan dengan RRT.tk di game3d.html)
const TUGU = { R: 4.5, heal: .1, jedaHeal: 2, hadiahHp: .3 };

function diSemak(x, z) { for (let i = 0; i < SEMAK.length; i++) if (hyp(x - SEMAK[i][0], z - SEMAK[i][1]) < SEMAK_R) return i; return -1; }
function terlihat(tx, tz, ox, oz) { const s = diSemak(tx, tz); if (s < 0) return true; if (diSemak(ox, oz) === s) return true; return hyp(tx - ox, tz - oz) < 2.6; }

// dipasang ke WasitWN (wasit-war-nanas.js)
module.exports = function pasangBot(WasitWN) {
  const P = WasitWN.prototype;

  // ---------- membuat bot ----------
  P.botMulai = function (lv) {
    this.B = new Map(); this.botLv = BOT_LV[Math.max(0, Math.min(3, lv | 0))]; this.lane = new Map(); this.log = new Map(); this.supBk = new Map();
    (this.r.bots || []).forEach(b => this.tambahBot(b));
  };
  P.tambahBot = function (b, dari) {   // b: {i, n, h, tm} · dari: {x, z, cadang} (pemain yang digantikan bot)
    if (!this.B || this.B.has(b.i)) return;
    const hero = HERO_3D[b.h] || b.h || 'ocong', U = BOT_TABEL[hero] || BOT_TABEL.ocong, lv = this.botLv;
    const o = { id: b.i, tm: b.tm ? 1 : 0, hero, nama: b.n, U, cd: [0, 1.5, 1.5, 3], CD: U.cd.map(x => x * lv.cd), cepat: (U.cepat || 4.2) * lv.cepat,
      x: 0, z: 0, arah: b.tm ? 0 : Math.PI, ty: 0, hp: 1, hpMax: 1, mati: false, hidupT: 0, kebalT: 0, kebal: 0, buffT: 0, pusing: 0, kunci: 0, lambat: 0,
      state: 'bebas', t: 0, um: null, pikir: rnd(.3, 1), strafe: Math.random() < .5 ? 1 : -1, strafeT: 1, gc: 0, pel: [], an: 'diam', ts: 1, ungkap: 0, kenaT: -99,
      st: { hp: 0, atk: 0, def: 0, spd: 0, as: 0, cd: 0 }, sp: { poin: 1, buka: [true, false, false, false], kartu: 0 }, agresi: rnd(.85, 1.2) * lv.agresi };
    o.hpMax = HP_MAX[hero] || 1900; o.hp = o.hpMax;
    const [x, z] = this.botSpawn(o); o.x = x; o.z = z;
    if (dari) { if (isFinite(dari.x)) { o.x = dari.x; o.z = dari.z; } const c = dari.cadang;
      if (Array.isArray(c)) { ST_K.forEach((k, i) => { o.st[k] = +c[i] || 0; }); o.sp.buka = o.sp.buka.map((v, k) => v || !!((c[6] | 0) & (1 << k))); o.sp.poin = c[7] | 0; o.hpMax = (HP_MAX[hero] || 1900) + this.statF(o, 'hp'); o.hp = Math.max(1, Math.min(o.hpMax, dari.hp || o.hpMax)); } }
    this.B.set(o.id, o);
    this.botSpBuka(o);
    if (!this.lane.has(o.id)) this.laneIsi(o.tm);
    this.botH(o);
    return o;
  };
  P.botSpawn = function (o) {   // bangkit di depan rumah sendiri
    const ang = this.anggotaTim(o.tm), k = Math.max(0, ang.indexOf(o.id)), s = o.tm ? -1 : 1;
    return [[0, -2.6, 2.6][k % 3], s * (WN_Z_RUMAH - 4.7)];
  };
  P.botH = function (o) {   // daftar hero (dipakai monster, penjaga, tugu): bot ikut di dalamnya
    const h = this.H.get(o.id) || { id: o.id, bot: o }; h.bot = o; h.tm = o.tm; h.x = o.x; h.z = o.z; h.hidup = !o.mati; h.max = o.hpMax; h.t = this.t; h.fl = 0; this.H.set(o.id, h);
  };

  // ---------- stat kartu ----------
  P.role = function (o) { return WN_ROLE[o.hero] || 'fighter'; };
  P.maks = function (o, k) { const r = WN_MAKS_ROLE[this.role(o)]; return r && r[k] != null ? r[k] : WN_MAKS[k]; };
  P.statP = function (o, k) { return Math.min(this.maks(o, k), o.st[k] || 0); };
  P.statF = function (o, k) { const p = this.statP(o, k); return k === 'hp' ? Math.round(2000 * p / 100) : k === 'spd' ? 4 * p / 100 : k === 'atk' ? 1 + p / 100 : k === 'def' || k === 'as' ? 100 / (100 + p) : 1 - p / 100; };
  P.kurva = function (o, dasar) {
    const r = this.role(o), m = this.t / 60, K = WN_KURVA;
    if (r === 'fighter') return dasar ? 1 + K.fighter.dasar * (m <= K.fighter.tahan ? 1 : m >= K.fighter.habis ? 0 : (K.fighter.habis - m) / (K.fighter.habis - K.fighter.tahan)) : 1;
    if (r === 'mm') return dasar ? 1 + K.mm.dasar * Math.min(1, Math.max(0, (m - K.mm.mulai) / (K.mm.penuh - K.mm.mulai))) : 1;
    if (K.skill[r] != null) return dasar ? 1 - K.dasarLemah[r] : 1 + K.skill[r];
    return 1;
  };
  P.nilaiKartu = function (o, k, dasar) { return Math.min(20, Math.max(1, Math.round(dasar * this.maks(o, k) / 100))); };
  P.botTambah = function (o, k, v) { o.st[k] += v; if (k === 'hp') { const baru = (HP_MAX[o.hero] || 1900) + this.statF(o, 'hp'); if (!o.mati) o.hp += baru - o.hpMax; o.hpMax = baru; } };
  P.botKartu = function (o, st0, emas, nilai = 0, merah = false) {   // pilih 1 dari 3 kartu acak (bot Support: utamakan HP)
    this.botSpKartu(o, !!emas && !merah);
    const semua = ST_K.filter(k => this.statP(o, k) < this.maks(o, k)); if (!semua.length) return;
    const pil = st0 && semua.includes(st0) ? [st0] : []; while (pil.length < Math.min(3, semua.length)) { const k = acak(semua); if (!pil.includes(k)) pil.push(k); }
    const k = (this.lane.get(o.id) === 'support' && pil.includes('hp')) ? 'hp' : acak(pil);
    this.botTambah(o, k, this.nilaiKartu(o, k, nilai || (emas ? 10 + Math.floor(Math.random() * 11) : 5 + Math.floor(Math.random() * 11))));
  };
  P.botPasif = function (o, v) {   // kartu khusus lane Support: HP lalu Defense
    this.botSpKartu(o, false);
    const k = ['hp', 'def', 'spd', 'atk', 'as', 'cd'].find(x => this.statP(o, x) < this.maks(o, x)); if (k) this.botTambah(o, k, this.nilaiKartu(o, k, v));
  };
  P.botSpKartu = function (o, emas) { const s = o.sp; if (s.buka[1] && s.buka[2] && s.buka[3]) return; if (!emas && ++s.kartu < 2) return; if (!emas) s.kartu = 0; s.poin++; this.botSpBuka(o); };
  P.botSpBuka = function (o) {   // Poin Skill: Skill 1 / 2 dulu (acak), Skill 3 paling akhir
    const s = o.sp; while (s.poin > 0) { const L = !s.buka[1] || !s.buka[2] ? [1, 2].filter(i => !s.buka[i]) : s.buka[3] ? [] : [3]; if (!L.length) break; s.buka[acak(L)] = true; s.poin--; }
  };
  P.supAktif = function (o) { return this.lane.get(o.id) === 'support' && this.t < SUP_MENIT * 60; };

  // ---------- lane farming ----------
  P.laneSaran = function (hero) { const r = PERAN_HERO[hero] || 'dekat'; return r === 'pengawal' ? 'support' : r === 'jauh' ? 'kanan' : 'kiri'; };
  P.laneIsi = function (tm) {   // bot mengisi lane yang belum dipakai teman (utamakan saran role)
    const ang = this.anggotaTim(tm), pakai = new Set(ang.map(i => this.lane.get(i)).filter(Boolean));
    ang.filter(i => this.B.has(i) && !this.lane.has(i)).forEach(i => { const o = this.B.get(i); let l = this.laneSaran(o.hero); if (pakai.has(l)) l = ['kiri', 'kanan', 'support'].find(x => !pakai.has(x)) || l; this.lane.set(i, l); pakai.add(l); });
  };
  P.laneTerima = function (id, l) {   // pemain memilih lane → bot satu tim yang bentrok pindah ke lane kosong
    if (!['kiri', 'kanan', 'support'].includes(l)) return; this.lane.set(id, l);
    const h = this.H.get(id); if (!h) return; const ang = this.anggotaTim(h.tm);
    ang.forEach(i => { if (i !== id && this.B.has(i) && this.lane.get(i) === l) { this.lane.delete(i); } }); this.laneIsi(h.tm);
  };

  // ---------- damage ke bot ----------
  P.botKena = function (o, d, oleh, dx, dz, dorong = 0) {
    if (!o || o.mati || this.selesai || o.kebalT > this.t || o.kebal > 0) return;
    d = Math.max(1, Math.round(d * this.statF(o, 'def'))); o.hp -= d; o.kenaT = this.t;
    if (oleh) { const L = this.log.get(o.id) || new Map(), q = L.get(oleh); L.set(oleh, { t: this.t, dmg: (q && this.t - q.t < 10 ? q.dmg : 0) + d }); this.log.set(o.id, L); }
    if (dorong > 0 && isFinite(dx)) { const ex = o.x - dx, ez = o.z - dz, L = hyp(ex, ez) || 1; o.x += ex / L * Math.min(1.2, dorong * .15); o.z += ez / L * Math.min(1.2, dorong * .15); }
    if (o.hp <= 0) this.botMati(o, oleh);
  };
  P.pembunuh = function (id, tm, oleh) {   // hero lawan terakhir yang melukai dalam 10 detik
    const L = this.log.get(id) || new Map(), baru = [...L.entries()].filter(([a, q]) => this.t - q.t < 10 && this.timOf(a) !== tm && this.timOf(a) >= 0).sort((x, y) => y[1].t - x[1].t);
    const k = oleh != null && oleh !== 0 && this.timOf(oleh) >= 0 && this.timOf(oleh) !== tm ? oleh : baru.length ? baru[0][0] : null;
    return { k, asis: baru.filter(([a, q]) => a !== k && q.dmg > 0).map(([a, q]) => ({ a, dmg: q.dmg })) };
  };
  P.timOf = function (id) { const h = this.H.get(id); if (h) return h.tm; const w = (this.r.pl || []).find(x => x.id === id); return w ? (w.tmT ? 1 : 0) : -1; };
  P.hadiahKill = function (k, asis, maxKorban) {   // bot yang membunuh: kartu emas · bot yang membantu: kartu assist
    if (k != null && this.B.has(k)) this.botKartu(this.B.get(k), null, true);
    asis.forEach(({ a, dmg }) => { const o = this.B.get(a); if (o && dmg >= maxKorban * WNP.minAsisHero) this.botKartu(o, null, false, WNA_ASIS); });
  };
  P.botMati = function (o, oleh) {
    o.mati = true; o.hp = 0; o.state = 'kalah'; o.um = null; o.pel = []; o.an = 'kalah'; o.ty = 0; o.pusing = o.kunci = o.lambat = 0;
    const m = this.t / 60, jeda = m <= 10 ? 10 + 2 * Math.floor(m) : 30 + 3 * (Math.floor(m) - 10);
    o.hidupT = this.t + jeda;
    const { k, asis } = this.pembunuh(o.id, o.tm, oleh); this.log.delete(o.id);
    this.ev1({ k: 'mati', id: o.id, oleh: k });
    if (this.onMati) this.onMati(o.id, o.tm);
    this.hadiahKill(k, asis, o.hpMax);
    this.botH(o);
  };
  P.heroMati = function (id, oleh) {   // pemain mati (event 'mati' dari HP-nya): bot yang membunuh / membantu dapat kartu
    const h = this.H.get(id); if (!h || h.bot) return; const { k, asis } = this.pembunuh(id, h.tm, oleh); this.log.delete(id); this.hadiahKill(k, asis, h.max || 1900);
  };
  P.mayatDekat = function (o, R) {   // teman (pemain / bot) yang sedang gugur di dekat o
    const out = []; this.H.forEach(h => { if (h.id !== o.id && h.tm === o.tm && !h.hidup && this.t - h.t < 30 && hyp(h.x - o.x, h.z - o.z) <= R) out.push(h); }); return out;
  };
  P.botBangkit = function (o) {   // dibangkitkan Rawa Rontek: di tempat, darah penuh
    if (!o || !o.mati) return; o.mati = false; o.hp = o.hpMax; o.state = 'bebas'; o.um = null; o.an = 'diam'; o.kebalT = this.t + 1.5;
    this.ev1({ k: 'bfx', id: o.id, ph: 'hidup', rr: 1 }); this.botH(o);
  };
  P.botHidup = function (o) {
    const [x, z] = this.botSpawn(o); o.x = x; o.z = z; o.mati = false; o.hp = o.hpMax; o.state = 'bebas'; o.an = 'diam'; o.kebalT = this.t + KEBAL_HIDUP; o.cd = o.cd.map(c => Math.min(c, 1));
    this.ev1({ k: 'bfx', id: o.id, ph: 'hidup' }); this.botH(o);
  };

  // ---------- pukulan bot ----------
  P.dmgBot = function (o, d, dasar) { return Math.max(1, Math.round(d * this.botLv.dmg * this.statF(o, 'atk') * this.kurva(o, dasar))); };
  P.botPukulHero = function (o, h, d, stun, lambat, dorong) {   // h: entri daftar hero (pemain / bot)
    if (!h || !h.hidup || h.tm === o.tm) return;
    if (h.bot) { this.botKena(h.bot, d, o.id, o.x, o.z, dorong); if (stun) h.bot.pusing = Math.max(h.bot.pusing, stun); if (lambat) h.bot.lambat = Math.max(h.bot.lambat, lambat); return; }
    const L = this.log.get(h.id) || new Map(), q = L.get(o.id); L.set(o.id, { t: this.t, dmg: (q && this.t - q.t < 10 ? q.dmg : 0) + d }); this.log.set(h.id, L);
    this.ev1({ k: 'hit', ke: h.id, d, x: r2(o.x), z: r2(o.z), dr: dorong || 2, oleh: o.id });
    if (stun) this.ev1({ k: 'pusing', ke: h.id, d: r2(Math.min(2, stun)) });
    if (lambat) this.ev1({ k: 'lambat', ke: h.id, d: r2(Math.min(2, lambat)) });
  };
  P.botPukulEnt = function (o, E, d, dasar) {   // monster / penjaga / buaya / bangunan
    if (!E || E.mati || E.tm === o.tm) return;
    if (E.jenis === 'rumah' && !dasar) return;   // Rumah kebal skill: hanya serangan dasar
    if ((E.jenis === 'singa' || E.jenis === 'garuda') && hyp(o.x - E.hx, o.z - E.hz) > E.R + .8) return;   // penjaga: hanya dari dalam lingkaran
    this.kena(E, d, o.id);
  };
  P.musuhDi = function (o, x, z, r) {   // hero lawan (pemain & bot) di dalam lingkaran
    return this.heroes().filter(h => h.hidup && h.tm !== o.tm && hyp(h.x - x, h.z - z) < r);
  };

  // ---------- sasaran (salinan wnSasaran) ----------
  P.tampak = function (o, h) { return h.hidup && !(h.fl & 2) && (terlihat(h.x, h.z, o.x, o.z) || (h.fl & 128)); };
  P.berikutT = function (tm) { return this.berikut(tm); };
  P.penjagaDi = function (x, z, tm) { for (const E of [this.singa[tm], this.garuda[tm]]) if (!E.mati && hyp(x - E.hx, z - E.hz) < E.R + .5) return E; return null; };
  P.kuatTim = function (tm) { let s = 0, n = 0; this.anggotaTim(tm).forEach(id => { n++; const o = this.B.get(id); const st = o ? ST_K.map(k => o.st[k]) : (this.r.cadang && this.r.cadang.get(id)) || []; for (let i = 0; i < 6; i++) s += +st[i] || 0; }); return n ? s / n : 0; };
  P.titik = function (o) { const a = o.id * 2.1; return { titik: 1, x: Math.sin(a) * JARAK_TUGU, z: Math.cos(a) * JARAK_TUGU }; };
  P.proksi = function (o, E) { if (!E.padat) return { ent: E }; const dx = o.x - E.hx, dz = o.z - E.hz, L = hyp(dx, dz) || 1, R = E.padat + .55; return { ent: E, px: E.hx + dx / L * R, pz: E.hz + dz / L * R }; };
  P.pilihMonster = function (o) {
    let best = null, bd = 1e9; const sisi = o.tm ? -1 : 1, ln = this.lane.get(o.id), sx = ln === 'kiri' ? -sisi : ln === 'kanan' ? sisi : 0;
    this.E.forEach(E => { if (E.jenis !== 'mon' || E.mati) return; let d = hyp(E.x - o.x, E.z - o.z); if (Math.sign(E.hz) !== sisi) d += 14; if (sx && Math.sign(E.hx) !== sx) d += 12;
      if (ln === 'support') { this.B.forEach(b => { if (b !== o && b.tm === o.tm && b.monT === E && !b.mati) d -= 12; }); this.heroes().forEach(h => { if (!h.bot && h.tm === o.tm && h.hidup && hyp(E.x - h.x, E.z - h.z) < 7) d -= 10; }); }
      else this.B.forEach(b => { if (b !== o && b.tm === o.tm && b.monT === E) d += 9; });
      if (E.sas != null && E.sas !== o.id && this.timOf(E.sas) !== o.tm) d += 6;
      if (d < bd) { bd = d; best = E; } });
    o.monT = best; return best ? { ent: best } : null;
  };
  P.botSasaran = function (o) {
    const tm = o.tm, mu = 1 - tm, hpR = o.hp / o.hpMax, mnt = this.t / 60, H = this.heroes();
    { const S = this.berikut(mu);   // 0) menit ke-9: dorong bersama ke bangunan lawan berikutnya
      if (mnt >= WNS.mulai && S && hpR > WNS.mundur) {
        let h = null, hd = 1e9;
        H.forEach(u => { if (u.tm !== mu || !u.hidup) return; const d1 = hyp(u.x - o.x, u.z - o.z), d2 = hyp(u.x - S.hx, u.z - S.hz); if ((d1 < WNS.kejar || d2 < WNS.area) && this.tampak(o, u) && d1 < hd) { hd = d1; h = u; } });
        if (h) return { hero: h };
        const tim = [...this.B.values()].filter(b => b.tm === tm && !b.mati), jR = (S.R || S.padat || 4) + 2, sisi = tm ? -1 : 1;
        const kx = S.hx + ((o.id % 3) - 1) * 2.2, kz = S.hz + sisi * (jR + 3);
        const siap = tim.filter(b => hyp(b.x - kx, b.z - kz) < 8 || hyp(b.x - S.hx, b.z - S.hz) < jR + 1).length;
        if (siap < Math.min(2, tim.length)) return { titik: 1, x: kx, z: kz };
        return this.proksi(o, S);
      } }
    let musuh = null, bd = hpR < .3 ? 3.2 : 8.5;   // 1) hero lawan dekat & terlihat
    H.forEach(u => { if (u.tm !== mu || !u.hidup) return; const d = hyp(u.x - o.x, u.z - o.z); if (d < bd && this.tampak(o, u)) { bd = d; musuh = u; } });
    const dorong = this.bts.some(b => !b.mati && b.tm === tm) || (mnt >= 4 && this.kuatTim(tm) >= 150) || mnt >= 9;
    if (musuh && (!this.penjagaDi(musuh.x, musuh.z, mu) || dorong)) return { hero: musuh };
    const bl = this.bts.find(b => !b.mati && b.tm === mu && hyp(b.x - o.x, b.z - o.z) < 9); if (bl) return { ent: bl };
    if (hpR < .4 && this.tugu.milik === tm) return this.titik(o);   // 2) pulih di tugu sendiri
    if (hpR < .25) return this.titik(o);
    if (this.tugu.milik !== tm && mnt >= 1.5 && (Math.abs(o.id) % 3 !== 0 || mnt >= 3)) return this.titik(o);   // 3) rebut tugu
    { let bb = null, bd2 = 1e9; this.E.forEach(B => { if (B.jenis !== 'buaya' || B.mati) return; const d = hyp(B.x - o.x, B.z - o.z) + (B.lv > 1 && hpR < .8 ? 10 : 0); if (d < bd2) { bd2 = d; bb = B; } });   // 4) Buaya Danau
      if (bb && hpR > .55 && (Math.abs(o.id) % 2 === 0 || bd2 < 12)) return { ent: bb }; }
    const S = this.berikut(mu); if (S && dorong && hpR > .5) return this.proksi(o, S);   // 5) dorong bangunan
    return this.pilihMonster(o) || this.titik(o);   // 6) farming
  };

  // ---------- gerak ----------
  P.botKec = function (o) { return (o.cepat * (o.buffT > 0 ? 1.4 : 1) + this.statF(o, 'spd')) * (o.lambat > 0 ? .6 : 1); };
  P.botJalan = function (o, dx, dz, kec, dt, hadap) {
    const L = hyp(dx, dz); if (L < 1e-3) { o.an = 'diam'; if (hadap != null) o.arah = hadap; return; }
    o.x += dx / L * kec * dt; o.z += dz / L * kec * dt; o.arah = hadap != null ? hadap : sudut(dx, dz); o.an = 'lari'; o.ts = 1;
  };
  P.botTahan = function (o) {   // bangunan padat, monster tidak bisa ditembus, batas arena
    for (const q of this.padat) { const dx = o.x - q.x, dz = o.z - q.z, L = hyp(dx, dz), R = q.R + .4; if (L < R) { if (L < 1e-3) o.z = q.z + Math.sign(q.z || 1) * R; else { o.x = q.x + dx / L * R; o.z = q.z + dz / L * R; } } }
    this.E.forEach(E => { const r = PADAT_MON[E.jenis]; if (!r || E.mati) return; const R = r + .35, dx = o.x - E.x, dz = o.z - E.z, d = hyp(dx, dz); if (d < R && d > 1e-3) { const sg = Math.abs(o.id) % 2 ? 1 : -1; o.x = E.x + dx / d * R - dz / d * sg * .04; o.z = E.z + dz / d * R + dx / d * sg * .04; } });
    o.x = Math.max(-20, Math.min(20, o.x)); o.z = Math.max(-44, Math.min(44, o.z));
  };

  // ---------- skill (salinan otak bot umum) ----------
  P.botBisa = function (o, k, L, ent) {
    if (ent && ent.jenis === 'rumah') return false;   // Rumah: hanya serangan dasar
    switch (k.t) { case 'dash': return L > 1.4 && L < 5.5; case 'area': return L < (k.r || 2.5) - .3; case 'target': return L < 7.5; case 'lompat': return L > 2.4 && L < 7;
      case 'pel': return L < 7.5; case 'buff': return L < 9 && L > 3; case 'kebal': return o.hp / o.hpMax < .6 && L < 4;
      case 'semedi': return o.hp / o.hpMax < .45 && L < 7; case 'hidupkan': return this.mayatDekat(o, k.R || 7).length > 0; } return false;
  };
  P.botMulaiSkill = function (o, i, k, sas, tx, tz) {
    const cdK = i === 0 ? this.statF(o, 'as') : this.statF(o, 'cd');
    o.cd[i] = o.CD[i] * cdK / (i === 0 && o.asT > 0 ? 2 : 1); o.state = 'um'; o.t = 0; o.arah = sudut(tx - o.x, tz - o.z);
    const v = sas.hero && sas.hero.bot ? { x: 0, z: 0 } : (sas.hero ? (sas.hero.vx != null ? { x: sas.hero.vx, z: sas.hero.vz } : { x: 0, z: 0 }) : { x: 0, z: 0 });
    o.um = { k, i, hit: 0, sas, ax: o.x, az: o.z, tj: k.t === 'target' || k.t === 'lompat' ? this.batas(tx + v.x * .45, tz + v.z * .45) : null, n: o.gc };
    o.an = i === 0 ? (o.U.dasar[o.gc % o.U.dasar.length] || 'serang') : (k.a || 'serang'); o.ts = i === 0 ? (o.asT > 0 ? 2.2 : 1.4) : (k.t === 'dash' ? 1.4 : k.t === 'semedi' || k.t === 'hidupkan' ? 1 : 1.2);
    if (i === 0) o.gc++;
    o.ungkap = 1.2;
    this.ev1(Object.assign({ k: 'bfx', id: o.id, ph: 'mulai', i, t: k.t, r: k.r || 0, a: r2(o.arah), n: o.um.n, L: r2(Math.max(2, Math.min(9, hyp(tx - o.x, tz - o.z) + .5))), ep: [r2(tx), r2(tz)] }, o.um.tj ? { tj: [r2(o.um.tj[0]), r2(o.um.tj[1])] } : {}));
  };
  P.batas = function (x, z) { return [Math.max(-20, Math.min(20, x)), Math.max(-44, Math.min(44, z))]; };
  P.posSas = function (s) { if (!s) return null; if (s.hero) return s.hero.hidup ? { x: s.hero.x, z: s.hero.z } : null; if (s.ent) return s.ent.mati ? null : s.px != null ? { x: s.px, z: s.pz } : { x: s.ent.x, z: s.ent.z }; return s.titik ? { x: s.x, z: s.z } : null; };
  P.botKenaSas = function (o, s, d, k, dasar) {   // kenai sasaran utama (hero / monster / bangunan)
    if (s.hero) this.botPukulHero(o, s.hero, d, k.stun, k.lambat, k.dorong || 3); else if (s.ent) this.botPukulEnt(o, s.ent, d, dasar);
  };
  P.botArea = function (o, cx, cz, r, k, d, s) {   // kenai semua hero lawan di area + sasaran monster/bangunan
    let ada = false; this.musuhDi(o, cx, cz, r).forEach(h => { this.botPukulHero(o, h, d, k.stun, k.lambat, k.dorong || 3); ada = true; });
    if (s && s.ent && !s.ent.mati && hyp(s.ent.x - cx, s.ent.z - cz) < r + (s.ent.padat || .8)) { this.botPukulEnt(o, s.ent, d, false); ada = true; }
    return ada;
  };
  P.botTembak = function (o, k, dasar) {   // proyektil 14 m/dtk (bola cahaya / efek asli hero di HP)
    const s = o.um.sas, p = this.posSas(s); if (!p) return; const a = sudut(p.x - o.x, p.z - o.z);
    o.pel.push({ x: o.x, z: o.z, dx: Math.sin(a), dz: Math.cos(a), sisa: (o.U.jarak || 7) + 1.5, k, dasar, s, i: o.um.i });
    this.ev1({ k: 'bfx', id: o.id, ph: 'lepas', i: o.um.i, a: r2(a), n: o.um.n, L: r2(Math.max(2, Math.min(9, hyp(p.x - o.x, p.z - o.z) + .5))), ep: [r2(p.x), r2(p.z)] });
  };
  P.botUpdPel = function (o, dt) {
    for (let i = o.pel.length - 1; i >= 0; i--) { const q = o.pel[i], v = 14 * dt; q.x += q.dx * v; q.z += q.dz * v; q.sisa -= v;
      const d = this.dmgBot(o, q.k.dmg || 55, q.dasar); let kena = null;
      for (const h of this.heroes()) if (h.hidup && h.tm !== o.tm && hyp(h.x - q.x, h.z - q.z) < .9) { kena = h; break; }
      if (kena) { this.botPukulHero(o, kena, d, q.k.stun, q.k.lambat, q.k.dorong || 1.5); this.ev1({ k: 'bfx', id: o.id, ph: 'kenaPel', i: q.i, ep: [r2(kena.x), r2(kena.z)] }); o.pel.splice(i, 1); continue; }
      if (q.s && q.s.ent && !q.s.ent.mati && hyp(q.s.ent.x - q.x, q.s.ent.z - q.z) < (q.s.ent.padat || .9) + .6) { this.botPukulEnt(o, q.s.ent, d, q.dasar); o.pel.splice(i, 1); continue; }
      if (q.sisa <= 0) o.pel.splice(i, 1); }
  };
  P.botJalankan = function (o, dt) {   // jalankan skill yang sedang berlangsung (salinan jalankanUmum)
    const U = o.um, k = U.k, t = o.t, s = U.sas, p = this.posSas(s), r = k.r || 2.5;
    const kena = (ph, x) => this.ev1(Object.assign({ k: 'bfx', id: o.id, ph, i: U.i, a: r2(o.arah), n: U.n }, x || {}));
    const selesai = () => { o.state = 'bebas'; o.um = null; o.an = 'diam'; o.ty = 0; };
    if (k.t === 'dasar') {
      if (t > .25 && !U.hit) { U.hit = 1; if (o.U.jauh) this.botTembak(o, { t: 'dasar', dmg: 55, dorong: 1.5 }, true);
        else { kena('kena'); if (p && hyp(p.x - o.x, p.z - o.z) < 2.3 + (s.ent && s.ent.padat ? 0 : 0)) this.botKenaSas(o, s, this.dmgBot(o, 60, true), { dorong: 2 }, true); } }
      if (t > .5) selesai();
    } else if (k.t === 'dash') {
      if (t < .4) { o.x += Math.sin(o.arah) * 10 * dt; o.z += Math.cos(o.arah) * 10 * dt;
        if (!U.hit && p && hyp(p.x - o.x, p.z - o.z) < 1.6) { U.hit = 1; kena('kena', { ep: [r2(p.x), r2(p.z)] }); this.botKenaSas(o, s, this.dmgBot(o, k.dmg || 60, false), k, false); } }
      if (t > .6) { if (k.as) o.asT = 2; selesai(); }
    } else if (k.t === 'area') {
      if (t > .35 && !U.hit) { U.hit = 1; const ada = this.botArea(o, o.x, o.z, r, k, this.dmgBot(o, k.dmg || 60, false), s); kena('kena', { ada: ada ? 1 : 0, ep: p ? [r2(p.x), r2(p.z)] : undefined }); }
      if (t > .75) selesai();
    } else if (k.t === 'target') {
      const [tx, tz] = U.tj; if (t > .55 && !U.hit) { U.hit = 1; const ada = this.botArea(o, tx, tz, r, k, this.dmgBot(o, k.dmg || 60, false), s); kena('kena', { tj: [r2(tx), r2(tz)], ada: ada ? 1 : 0 }); }
      if (t > .95) selesai();
    } else if (k.t === 'lompat') {
      const [tx, tz] = U.tj, D = .6;
      if (t < D) { const u = t / D; o.x = U.ax + (tx - U.ax) * u; o.z = U.az + (tz - U.az) * u; o.ty = 2.4 * 4 * u * (1 - u); }
      else if (!U.hit) { U.hit = 1; o.x = tx; o.z = tz; o.ty = 0; const ada = this.botArea(o, tx, tz, r, k, this.dmgBot(o, k.dmg || 60, false), s); kena('kena', { tj: [r2(tx), r2(tz)], ada: ada ? 1 : 0 }); }
      if (t > D + .3) selesai();
    } else if (k.t === 'pel') {
      if (t > .3 && !U.hit) { U.hit = 1; this.botTembak(o, k, false); }
      if (t > .55) selesai();
    } else if (k.t === 'buff') { o.buffT = k.lama || 3; kena('kena'); selesai(); }
    else if (k.t === 'kebal') { o.kebal = k.lama || 2; kena('kena'); selesai(); }
    else if (k.t === 'semedi') {   // diam: kebal damage & stun, pulih 20% / dtk (dihitung di botLangkah)
      if (!U.hit) { U.hit = 1; o.semediT = k.lama || 3; o.kebal = Math.max(o.kebal, o.semediT); }
      o.an = 'semedi'; if (t > (k.lama || 3)) selesai();
    } else if (k.t === 'hidupkan') {   // ritual 3 dtk: teman gugur di radius bangkit (stun membatalkan, kecuali sedang semedi)
      if (!U.hit) { U.hit = 1; o.tk = { x: o.x, z: o.z, sampai: this.t + TK.lama, next: this.t + TK.mulai }; const k2 = o.U.s[1];   // 3 tengkorak bangkit dari lingkaran · kombo: semedi ikut dipakai kalau siap
        if (k2 && k2.t === 'semedi' && o.sp.buka[2] && o.cd[2] <= 0) { o.cd[2] = o.CD[2] * this.statF(o, 'cd'); o.semediT = k2.lama || 3; o.kebal = Math.max(o.kebal, o.semediT); this.ev1({ k: 'bfx', id: o.id, ph: 'mulai', i: 2, t: 'semedi', r: 0, a: r2(o.arah), n: U.n, L: 2, ep: [r2(o.x), r2(o.z)] }); } }
      o.an = 'ulti';
      if (t > (k.lama || 3)) { const daftar = this.mayatDekat(o, (k.R || 7) + .5);
        daftar.forEach(h => { if (h.bot) this.botBangkit(h.bot); else this.ev1({ k: 'hidupkan', ke: h.id, x: r2(h.x), z: r2(h.z), oleh: o.id }); });
        if (!daftar.length) o.cd[3] *= .5; selesai(); }
    }
    else selesai();
  };
  P.botOtak = function (o, dt) {
    const kH = o.U.s[2]; if (kH && kH.t === 'hidupkan' && o.pikir <= 0 && o.sp.buka[3] && o.cd[3] <= 0 && this.mayatDekat(o, kH.R || 7).length) { this.botMulaiSkill(o, 3, kH, { titik: 1, x: o.x, z: o.z }, o.x + Math.sin(o.arah), o.z + Math.cos(o.arah)); o.pikir = .3; return; }   // Rawa Rontek: ada teman gugur di dekat → ritual
    if (o.strafeT <= 0) { o.strafeT = rnd(.8, 2.2); if (Math.random() < .5) o.strafe *= -1; }
    if (!o.sas || o.sasT <= 0) { o.sas = this.botSasaran(o); o.sasT = .15; }   // pilih sasaran ±7x per detik
    let s = o.sas; const kec = this.botKec(o);
    if (s.titik) {   // titik berdiri (tugu / kumpul): ada hero lawan dekat → lawan dia
      const m = this.heroes().filter(h => h.hidup && h.tm !== o.tm && this.tampak(o, h) && hyp(h.x - o.x, h.z - o.z) < 6.5).sort((a, b) => hyp(a.x - o.x, a.z - o.z) - hyp(b.x - o.x, b.z - o.z))[0];
      if (m) s = o.sas = { hero: m };
      else { o.geserT = (o.geserT || 0) - dt; if (o.geserT <= 0 || !o.geser) { o.geserT = rnd(1.4, 3.2); o.geser = [rnd(-1, 1), rnd(-1, 1)]; }
        const dx = s.x + o.geser[0] - o.x, dz = s.z + o.geser[1] - o.z; if (hyp(dx, dz) > .35) this.botJalan(o, dx, dz, kec * (hyp(dx, dz) > 3 ? 1 : .6), dt); else o.an = 'diam'; return; }
    }
    const p = this.posSas(s); if (!p) { o.sas = null; o.an = 'diam'; return; }
    const L = hyp(p.x - o.x, p.z - o.z), hpR = o.hp / o.hpMax, U = o.U, ent = s.ent || null;
    if (o.pikir <= 0) {   // pakai skill / serangan dasar
      for (const i of [3, 2, 1]) { const k = U.s[i - 1]; if (!o.sp.buka[i] || o.cd[i] > 0 || !this.botBisa(o, k, L, ent)) continue; if (i === 3 && Math.random() < .3) continue; this.botMulaiSkill(o, i, k, s, p.x, p.z); o.pikir = rnd(.12, .3) / o.agresi * this.botLv.pikir; return; }
      const jgk = U.jauh ? U.jarak : (U.jarak || 1.9) + (ent && ent.padat && s.px == null ? ent.padat : 0) + (ent && !ent.padat ? .4 : 0);
      if (o.cd[0] <= 0 && L < jgk) { this.botMulaiSkill(o, 0, { t: 'dasar' }, s, p.x, p.z); o.pikir = rnd(.12, .3) / o.agresi * this.botLv.pikir; return; }
    }
    // bergerak (salinan posisi()): jarak jauh menjaga jarak, jarak dekat mendekat zig-zag, mundur saat terdesak
    const hp2 = s.hero ? (s.hero.bot ? s.hero.bot.hp / s.hero.bot.hpMax : .6) : 1, terdesak = s.hero && hpR < .3 && hp2 > hpR + .2;
    const kx = p.x - o.x, kz = p.z - o.z, hadap = sudut(kx, kz);
    if (terdesak) { const d = this.botMundur(o, p); this.botJalan(o, d[0], d[1], kec, dt, L < 9 ? hadap : null); return; }
    if (U.jauh && s.hero) { const d = this.botKite(o, p, U.jarak * .75 / o.agresi); this.botJalan(o, d[0], d[1], kec, dt, L < 9 ? hadap : null); return; }
    const jg = U.jauh ? U.jarak * .9 : 1.1 + (ent && s.px == null ? (ent.padat || .6) : 0);
    if (L < jg) { o.an = 'diam'; o.arah = hadap; return; }
    const z = L > 3 && s.hero ? .35 * o.strafe : 0; this.botJalan(o, kx / L - kz / L * z, kz / L + kx / L * z, kec, dt);
  };
  P.botKite = function (o, p, mau) { const dx = o.x - p.x, dz = o.z - p.z, L = hyp(dx, dz) || 1, ux = dx / L, uz = dz / L, c = Math.max(-1, Math.min(1, (mau - L) * .8));
    return [-uz * o.strafe * .85 + ux * c, ux * o.strafe * .85 + uz * c]; };
  P.botMundur = function (o, p) {   // kabur ke semak aman, kalau tidak ada menjauh sambil menyamping
    let best = null, bs = -1e9; SEMAK.forEach(([x, z]) => { const db = hyp(x - o.x, z - o.z), ds = hyp(x - p.x, z - p.z); if (db > 13 || ds < 3) return; const n = ds * 1.3 - db; if (n > bs) { bs = n; best = [x, z]; } });
    if (best && hyp(best[0] - o.x, best[1] - o.z) > .6) return [best[0] - o.x, best[1] - o.z]; return this.botKite(o, p, 9);
  };

  // ---------- satu langkah semua bot ----------
  P.botLangkah = function (dt) {
    if (!this.B || !this.B.size) return;
    // bonus kartu berkala lane Support (mulai menit ke-1, tiap 20 dtk, maks 15)
    if (this.t >= SUP_BK.mulai) this.B.forEach(o => { if (this.lane.get(o.id) !== 'support') return; let b = this.supBk.get(o.id); if (!b) { b = { n: 0, next: SUP_BK.mulai }; this.supBk.set(o.id, b); }
      if (b.n < SUP_BK.maks && this.t >= b.next) { b.n++; b.next = this.t + SUP_BK.selang; this.botPasif(o, SUP_BK.nilai); } });
    if (this.t > 16 && !this.laneUlang) { this.laneUlang = 1; this.laneIsi(0); this.laneIsi(1); }
    this.B.forEach(o => {
      if (o.tk) this.botTengkorak(o);
      if (o.mati) { if (this.t >= o.hidupT && !this.selesai) this.botHidup(o); this.botH(o); return; }
      o.cd = o.cd.map(c => Math.max(0, c - dt)); o.t += dt; o.pikir -= dt; o.strafeT -= dt; o.sasT = (o.sasT || 0) - dt;
      o.buffT = Math.max(0, o.buffT - dt); o.kebal = Math.max(0, o.kebal - dt); o.ungkap = Math.max(0, o.ungkap - dt); o.asT = Math.max(0, (o.asT || 0) - dt);
      if (o.semediT > 0) { o.semediT = Math.max(0, o.semediT - dt); o.pusing = o.kunci = 0; o.tarik = o.angkat = null; o.hp = Math.min(o.hpMax, o.hp + o.hpMax * .2 * dt); }   // Semedi Rawa Rontek
      if (o.pel.length) this.botUpdPel(o, dt);
      if (this.botPaksa(o, dt)) { this.botTahan(o); this.botH(o); return; }   // sedang ditarik / diangkat: tidak bisa apa-apa
      const pingsan = o.pusing > 0 || o.kunci > 0; o.pusing = Math.max(0, o.pusing - dt); o.kunci = Math.max(0, o.kunci - dt); o.lambat = Math.max(0, o.lambat - dt);
      if (pingsan) { if (o.state !== 'bebas' && !(o.um && o.um.k.t === 'lompat')) { o.state = 'bebas'; o.um = null; o.ty = 0; } o.an = 'diam'; }
      else if (o.state === 'um') this.botJalankan(o, dt);
      else this.botOtak(o, dt);
      // pulih di Tugu Nanas milik sendiri (10% HP / dtk, 2 dtk setelah terakhir kena)
      if (this.tugu.milik === o.tm && hyp(o.x, o.z) < TUGU.R && this.t - o.kenaT >= TUGU.jedaHeal && o.hp < o.hpMax) o.hp = Math.min(o.hpMax, o.hp + o.hpMax * TUGU.heal * dt);
      if (o.boncengT > this.t) { const h = this.H.get(o.bonceng); if (h && h.hidup) { o.x = h.x; o.z = h.z; } else o.boncengT = 0; }   // sedang dibonceng: ikut posisi Woyo
      this.botTahan(o); this.botH(o);
    });
  };
  P.botTengkorak = function (o) {   // tengkorak Ritual Kebangkitan: tiap 1,1 dtk 3 cakaran ke lawan terdekat di sekitar lingkaran (tampilannya disimulasikan HP)
    const q = o.tk; if (this.t >= q.sampai || this.selesai) { o.tk = null; return; } if (this.t < q.next) return; q.next += TK.jeda;
    const L = this.musuhDi(o, q.x, q.z, TK.R).sort((a, b) => hyp(a.x - q.x, a.z - q.z) - hyp(b.x - q.x, b.z - q.z)); if (!L.length) return;
    for (let k = 0; k < TK.n; k++) this.botPukulHero(o, L[k % Math.min(L.length, 2)], this.dmgBot(o, TK.dmg, false), 0, 0, .6);
  };
  P.botPaksa = function (o, dt) {   // gerak paksa dari skill pemain: tarik (lurus ke titik) · angkat (naik ke atas kepala Buto lalu dibanting)
    if (o.tarik) { const q = o.tarik; q.t += dt; const u = Math.min(1, q.t / q.d); o.x = q.ax + (q.x - q.ax) * u; o.z = q.az + (q.z - q.az) * u; o.an = 'diam';
      if (u >= 1) o.tarik = null; if (o.state !== 'bebas') { o.state = 'bebas'; o.um = null; } return true; }
    if (o.angkat) { const q = o.angkat; q.t += dt; o.an = 'diam'; if (o.state !== 'bebas') { o.state = 'bebas'; o.um = null; }
      if (q.t < q.d) { const u = Math.min(1, q.t / .42), e = u * u * (3 - 2 * u); o.x = q.ax + (q.hx - q.ax) * e; o.z = q.az + (q.hz - q.az) * e; o.ty = 2 * Math.sin(u * Math.PI / 2); return true; }
      const u = Math.min(1, (q.t - q.d) / q.tb); o.x = q.hx + (q.cx - q.hx) * u; o.z = q.hz + (q.cz - q.hz) * u; o.ty = 2 * (1 - u);
      if (u >= 1) { o.angkat = null; o.ty = 0; } return true; }
    return false;
  };
  // hadiah server untuk bot (pengganti event 'wnHd' ke HP)
  P.botHadiah = function (o, x) {
    if (o.mati && x.j !== 'buaya') return;
    if (x.j === 'mon') { o.hp = Math.min(o.hpMax, o.hp + o.hpMax * .2); if (this.supAktif(o)) this.botKartu(o, x.st, false, WNP.killMon, true); else this.botKartu(o, x.st, false); }
    else if (x.j === 'asis') { if (this.supAktif(o)) this.botPasif(o, WNP.asisMon); }
    else if (x.j === 'tugu') { o.hp = Math.min(o.hpMax, o.hp + o.hpMax * TUGU.hadiahHp); this.botKartu(o, null, true); }
    else if (x.j === 'buaya') this.botKartu(o, null, true, WNB);
  };
  // baris keadaan bot untuk HP (format sama dengan baris bot tuan rumah: [id, x, z, arah, tinggi, rx, ry, rz, hp, animasi, kecepatan, flag, hpMaks])
  P.botBaris = function () {
    const out = []; if (!this.B) return out;
    this.B.forEach(o => { const fl = (o.mati ? 8 : 0) | (o.ungkap > 0 ? 128 : 0) | (o.buffT > 0 && o.hero === 'genderuwo' ? 16 : 0);
      out.push([o.id, r2(o.x), r2(o.z), r2(o.arah), r2(o.ty), 0, 0, 0, Math.max(0, Math.round(o.hp)), o.mati ? 'kalah' : o.an, o.ts || 1, fl, Math.round(o.hpMax)]); });
    return out;
  };
  P.botCadang = function () { const out = []; if (!this.B) return out; this.B.forEach(o => { let mask = 0; o.sp.buka.forEach((b, k) => { if (b) mask |= 1 << k; }); out.push([o.id, ST_K.map(k => r2(o.st[k])).concat([mask, o.sp.poin])]); }); return out; };
  // event dari HP pemain yang mengenai bot server
  P.botEvent = function (e, dari) {
    const o = this.B && this.B.get(e.ke); if (!o) return false;
    const oleh = e.oleh != null && e.oleh !== 0 ? e.oleh : dari;
    if (e.k === 'hit') { const h = this.H.get(oleh); if (h && h.tm === o.tm) return true; this.botKena(o, Math.min(20000, +e.d || 0), oleh, +e.x, +e.z, +e.dr || 0); }
    else if (e.k === 'kunci') o.kunci = Math.max(o.kunci, Math.min(3, +e.d || 0));
    else if (e.k === 'pusing') o.pusing = Math.max(o.pusing, Math.min(2, +e.d || 0));
    else if (e.k === 'lambat') o.lambat = Math.max(o.lambat, Math.min(3, +e.d || 0));
    else if (e.k === 'bonceng') { const h = this.H.get(oleh); if (!o.mati && (!h || h.tm === o.tm)) { o.bonceng = oleh; o.boncengT = +e.lama > 0 ? this.t + Math.min(600, +e.lama) : 0; } }   // dibonceng Ojek Woyo (pemain)
    else if (e.k === 'hidupkan') { const h = this.H.get(oleh); if (o.mati && (!h || h.tm === o.tm)) this.botBangkit(o); }   // Ritual Kebangkitan Rawa Rontek (pemain)
    else if (e.k === 'tarik') { if (o.mati || o.semediT > 0 || !isFinite(+e.x)) return true; o.tarik = { ax: o.x, az: o.z, x: +e.x, z: +e.z, t: 0, d: Math.max(.05, Math.min(.6, +e.d || .3)) }; o.angkat = null; }   // ditarik (rantai Doni, culik Wewe, …)
    else if (e.k === 'angkat') {   // diangkat & dibanting Buto: maju ke depan Buto, naik ke atas kepala, lalu dilempar ke titik jatuh
      if (o.mati || o.semediT > 0 || !isFinite(+e.x)) return true; let fx = (+e.fx) - (+e.x), fz = (+e.fz) - (+e.z); if (!isFinite(fx) || hyp(fx, fz) < 1e-3) { fx = o.x - e.x; fz = o.z - e.z; } const L = hyp(fx, fz) || 1;
      const lama = Math.max(.2, Math.min(1.5, +e.d || .6) - .1), tb = Math.min(.6, Math.max(.1, +e.tb || .1));
      o.angkat = { ax: o.x, az: o.z, hx: +e.x + fx / L * .9, hz: +e.z + fz / L * .9, cx: +e.bx, cz: +e.bz, t: 0, d: lama, tb }; o.tarik = null; o.pusing = Math.max(o.pusing, lama + tb + .25); }
    else if (e.k === 'kantong') { o.kebal = Math.max(o.kebal, Math.min(4, +e.d || 3)); o.kunci = Math.max(o.kunci, Math.min(4, +e.d || 3)); }   // dimasukkan ke gendongan Wewe teman: kebal & diam
    else return false;
    return true;
  };
};
module.exports.BOT_TABEL = BOT_TABEL;
