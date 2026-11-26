// Kalensari Game – WASIT WAR NANAS DI SERVER
// Server yang menjalankan monster hutan, Sisingaan, Garuda, Buaya Danau, Buaya teman, Rumah & Tugu Nanas.
// Semua HP hanya menampilkan keadaan kiriman server (pesan 'wnSrv'), jadi dunia War Nanas sama di semua HP
// dan tidak ikut kacau kalau HP tuan rumah terputus.
//
// Koordinat = sistem jaringan (sudut pandang tim 0 asli): Rumah tim 0 di z = +40, Rumah tim 1 di z = −40.
// Nomor tim = nomor tim ASLI di server (ws.tmT / bot.tm). HP pemain sendiri yang membalik ke tampilan lokal.
//
// Angka keseimbangan di bawah HARUS sama dengan game3d.html (WNV, WN_KEMAH, SINGA_KLIP, BUAYA_KLIP, GARUDA_ULTI, …).
// Kalau mengubah angka di game3d.html, ubah juga di sini.
'use strict';

const TICK = 1 / 15;   // 15x per detik
const WNV = {
  singa: { hp: 6000, pulih: .005, R: 6.5, dmg: 260, jeda: 1.4, jangkau: 2.1, kec: 3.6 },
  garuda: { hp: 9000, pulih: .005, R: 7.5, dmg: 320, jeda: 1.6, padat: 1.9 },
  rumah: { hp: 8000, padat: 3.3 },
  tugu: { lama: 10, heal: .1, jedaHeal: 2, padat: 1.3, hadiahHp: .3, hadiahCd: 90 },
  mon: { hp: 650, dmg: 38, jeda: 1.2, kec: 3.2, leash: 8, ulang: 45, naikPerMenit: .06 },
  buaya: { hp: 3500, dmg: 200, jeda: 1.6, kec: 2.6, leash: 9, selang: 240, naikHp: .8, naikDmg: .5, naikPerMenit: 0 },
  buayaT: { hp: 1600, dmg: 130, dmgB: 160, jeda: 1.6, kec: 2.5 },
};
const WN_Z = { rumah: 40, garuda: 29, singa: 13 }, TUGU_R = 4.5, DANAU = [[-15.2, 0], [15.2, 0]];
const BATAS = { x0: -20, x1: 20, z0: -44, z1: 44 };
// monster hutan: [x, z, stat] untuk separuh tim 0 (z+), separuh tim 1 dicerminkan titik (−x, −z)
const KEMAH = [[-13, 9, 'spd'], [-14, 22, 'hp'], [-11, 36, 'cd'], [13, 9, 'as'], [14, 22, 'atk'], [11, 36, 'def'],
  [-18, 15, 'atk'], [18, 15, 'hp'], [-17.5, 29, 'as'], [17.5, 29, 'spd']];
const MON_KEMAH = ['tikus', 'babi', 'burung-bangkai', 'monyet', 'srigala', 'gurita', 'hiena', 'bangbung', 'monyet', 'tikus'];
// lama animasi 'serang' tiap monster (dari file GLB) & saat pukulan kena (bagian dari durasi)
const MON_SERANG = { babi: [1.2, .39], hiena: [1.2, .39], bangbung: [1.2, .67], 'burung-bangkai': [1.4, .6], gurita: [1.2, .56], monyet: [1.333, .63], srigala: [1.0, .37], tikus: [1.167, .46] };
const SINGA_KLIP = { serang1: { kena: .5, lama: 1.05 }, serang2: { kena: .62, lama: 1.05 }, putar: { kena: .9, lama: 2.5, area: 1, jeda: 2.6 } };
const BUAYA_KLIP = { sambar_gigit: { kena: .45, lama: 1.1 }, sabet_ekor: { kena: .58, lama: 1.25 }, ekor_putar: { kena: .85, lama: 1.7, area: 1, jeda: 2.6 }, terkam_lompat: { kena: .8, lama: 1.5, lompat: [.32, .8], jeda: 2.2 },
  pedang1: { kena: [.7, 1.07, 1.73], f: .5, lama: 2.34 }, pedang2: { kena: [.93], f: 1.1, lama: 2.5, area: 1 }, ulti: { kena: [1.41, 1.68], lama: 2.13 } };
const BUAYA_ULTI = { pertama: 10, jeda: 10, R: 3.8, f: 1.8, lambat: 1.5, lepas: 3 };
const BUAYA_URUT = ['pedang1', 'sabet_ekor', 'pedang2', 'sambar_gigit', 'ekor_putar'];
const GARUDA_ULTI = { jeda: 7, lepas: 3, R: 11, sudut: .7, lama: 1.75, kena: [.7, 1.15, 1.6], f: .9, bakar: 3, bakarDps: .04 };
const NAIK = { per: .08, maks: 10 };
const TUGU_KEC = [0, 1, 1 / .7, 1 / .5];
const PADAT_HERO = 3;   // detik: data hero lebih lama dari ini dianggap tidak ada (HP macet / keluar)

const r2 = v => Math.round(v * 100) / 100;
const hyp = Math.hypot;
const sudut = (dx, dz) => Math.atan2(dx, dz);

class WasitWN {
  constructor(room, kirim, opsi = {}) {
    this.r = room; this.kirim = kirim; this.botSrv = !!opsi.botSrv; this.t = 0; this.ev = []; this.jadwal = []; this.snapN = 0; this.tick = 0;
    this.H = new Map();   // id hero → { id, tm, x, z, hidup, max, t }
    this.bakar = new Map();
    this.tugu = { milik: -1, prog: 0, tim: -1, rebut: 0, hadiahT: [-1e9, -1e9] };
    this.selesai = false;
    this.buat();
    if (this.botSrv) this.botMulai(opsi.lv == null ? 1 : opsi.lv);   // Tahap 2: bot dijalankan server (bot-war-nanas.js)
  }

  // ---------- membuat monster & bangunan (urutan = urutan WN.kanon di game3d.html) ----------
  buat() {
    const L = [], ent = o => Object.assign({ mati: false, cdA: 0, serangT: 0, sas: null, oleh: null, kenaT: -1e9, ry: 0, jalan: 0, pusing: 0, kunci: 0, lambat: 0, atkN: 0, atkK: '', atkT: 0, lv: 0, naikN: 0, ultiT: 0, sembur: null, nSerang: 0, _snap: '' }, o, { x: o.hx, z: o.hz });
    for (const tm of [0, 1]) {
      const s = tm ? -1 : 1, hadap = tm ? 0 : Math.PI;
      L.push(ent({ jenis: 'rumah', tm, hx: 0, hz: s * WN_Z.rumah, hp: WNV.rumah.hp, padat: WNV.rumah.padat, ry: hadap }));
      L.push(ent({ jenis: 'garuda', tm, hx: 0, hz: s * WN_Z.garuda, hp: WNV.garuda.hp, padat: WNV.garuda.padat, R: WNV.garuda.R, dmg: WNV.garuda.dmg, jeda: WNV.garuda.jeda, ry: hadap, hadap0: hadap }));
      L.push(ent({ jenis: 'singa', tm, hx: 0, hz: s * WN_Z.singa, hp: WNV.singa.hp, R: WNV.singa.R, dmg: WNV.singa.dmg, jeda: WNV.singa.jeda, jangkau: WNV.singa.jangkau, kec: WNV.singa.kec, ry: hadap }));
      KEMAH.forEach(([x, z, st], ki) => { const hp = WNV.mon.hp * (st === 'hp' || st === 'def' ? 1.25 : st === 'spd' ? .8 : 1);
        const E = ent({ jenis: 'mon', tm: -1, hx: s * x, hz: s * z, hp, hpDasar: hp, stat: st, mk: MON_KEMAH[ki], dmg: WNV.mon.dmg, jeda: WNV.mon.jeda, kec: WNV.mon.kec, leash: WNV.mon.leash });
        E.ry = E.arahAsal = Math.atan2(-E.hx, -E.hz); L.push(E); });
    }
    DANAU.forEach(([x, z], i) => { const E = ent({ jenis: 'buaya', tm: -1, hx: x, hz: z, hp: WNV.buaya.hp, dmg: WNV.buaya.dmg, jeda: WNV.buaya.jeda, kec: WNV.buaya.kec, leash: WNV.buaya.leash, idx: i });
      E.mati = true; E.munculT = WNV.buaya.selang; E.ry = E.arahAsal = x < 0 ? Math.PI / 2 : -Math.PI / 2; L.push(E); });
    L.forEach(E => { E.hpMax = E.hp; });
    L.sort((a, b) => a.hx - b.hx || a.hz - b.hz);
    const bts = [0, 1].map(() => ent({ jenis: 'buayaT', tm: 0, hx: 0, hz: 0, hp: WNV.buayaT.hp, jeda: WNV.buayaT.jeda, kec: WNV.buayaT.kec }));
    bts.forEach(T => { T.mati = true; T.hpMax = T.hp; });
    this.E = L.concat(bts); this.E.forEach((E, i) => { E.ki = i; });
    this.bts = bts;   // bts[0] = slot danau kiri (x −15,2), bts[1] = danau kanan
    this.rumah = []; this.garuda = []; this.singa = [];
    this.E.forEach(E => { if (E.jenis === 'rumah') this.rumah[E.tm] = E; else if (E.jenis === 'garuda') this.garuda[E.tm] = E; else if (E.jenis === 'singa') this.singa[E.tm] = E; });
    this.padat = [{ x: 0, z: 0, R: WNV.tugu.padat }].concat(this.E.filter(E => E.padat).map(E => ({ x: E.hx, z: E.hz, R: E.padat, E })));
  }

  // ---------- data dari HP pemain ----------
  // m: pesan 'st' / 'in' dari HP (m.w = id pengirim). Mengembalikan event yang masih perlu diteruskan ke HP lain.
  terima(ws, m) {
    if (Array.isArray(m.s)) { const s = m.s, fl = s[10] | 0; this.heroSet(ws.id, ws.tmT, s[0], s[1], !(fl & 8), s[11]); const h = this.H.get(ws.id); if (h) h.fl = fl; }
    if (Array.isArray(m.b) && this.r.host === ws && !this.botSrv) m.b.forEach(b => { const bot = (this.r.bots || []).find(x => x.i === b[0]); if (bot) this.heroSet(b[0], bot.tm, b[1], b[2], b[9] !== 'kalah', b[12]); });
    if (!Array.isArray(m.e) || !m.e.length) return;
    const sisa = [];
    for (const e of m.e) {
      if (!e || typeof e !== 'object') continue;
      if (e.k === 'wnHit') { const id = e.oleh != null && this.r.host === ws ? e.oleh : ws.id; this.kenaHero(this.E[e.i | 0], +e.d || 0, id); continue; }
      if (e.k === 'wnSt') { const E = this.E[e.i | 0]; if (E && !E.mati) { E.pusing = Math.max(E.pusing, Math.min(3, +e.p || 0)); E.kunci = Math.max(E.kunci, Math.min(3, +e.ku || 0)); E.lambat = Math.max(E.lambat, Math.min(3, +e.l || 0)); } continue; }
      if (e.k === 'wnLane' || e.k === 'wnHd') { if (e.k === 'wnLane') { sisa.push(e); if (this.botSrv) this.laneTerima(ws.id, e.l); } continue; }   // hadiah hanya dari server
      if (this.botSrv && e.ke != null && ['hit', 'kunci', 'pusing', 'lambat', 'tarik', 'angkat', 'kantong', 'hidupkan'].includes(e.k) && this.botEvent(e, ws.id)) continue;   // mengenai bot server
      if (this.botSrv && e.k === 'mati' && e.id === ws.id) this.heroMati(ws.id, e.oleh);   // pemain mati: bot pembunuh / pembantu dapat kartu
      sisa.push(e);
    }
    m.e = sisa;
  }
  heroSet(id, tm, x, z, hidup, max) {
    if (!isFinite(x) || !isFinite(z)) return;
    const h = this.H.get(id) || { id }; h.tm = tm ? 1 : 0; h.x = +x; h.z = +z; h.hidup = !!hidup; h.max = +max > 0 ? +max : (h.max || 1000); h.t = this.t; this.H.set(id, h);
  }
  heroes() { const out = []; this.H.forEach(h => { if (this.t - h.t < PADAT_HERO) out.push(h); }); return out; }

  // ---------- event ke HP ----------
  ev1(e) { this.ev.push(e); }
  pukulHero(h, dmg, dx, dz, dorong = 2) {   // monster / penjaga / buaya mengenai hero (darahnya dihitung di HP pemilik hero)
    if (!h) return; if (h.ent) { this.kena(h.ent, dmg, null); return; }
    if (!h.hidup) return;
    if (h.bot) { this.botKena(h.bot, dmg, 0, dx, dz, dorong); return; }   // bot server
    this.ev1({ k: 'hit', ke: h.id, d: Math.max(1, Math.round(dmg)), x: r2(dx), z: r2(dz), dr: dorong, oleh: 0 });
  }
  hadiah(id, x) { const o = this.B && this.B.get(id); if (o) { this.botHadiah(o, x); return; } this.ev1(Object.assign({ k: 'wnHd', ke: id }, x)); }
  anggotaTim(tm) { const r = this.r, ids = []; (r.pl || []).forEach(w => { if ((w.tmT ? 1 : 0) === tm) ids.push(w.id); }); (r.bots || []).forEach(b => { if ((b.tm ? 1 : 0) === tm) ids.push(b.i); }); if (r.tunda) r.tunda.forEach(T => { if ((T.tm ? 1 : 0) === tm) ids.push(T.i); }); return [...new Set(ids)]; }

  // ---------- damage hero → monster / bangunan ----------
  terkunci(E) { return (E.jenis === 'garuda' && !this.singa[E.tm].mati) || (E.jenis === 'rumah' && !this.garuda[E.tm].mati); }
  kenaHero(E, dmg, id) {
    if (!E || E.mati || this.selesai || !(dmg > 0)) return;
    const h = this.H.get(id), tm = h ? h.tm : null;
    if (tm != null && E.tm === tm) return;   // bangunan / buaya sendiri
    if ((E.jenis === 'singa' || E.jenis === 'garuda') && h && hyp(h.x - E.hx, h.z - E.hz) > E.R + 1.6) return;   // penjaga: hanya hero di dalam lingkaran (sedikit longgar untuk jeda jaringan)
    this.kena(E, Math.min(dmg, 20000), id);
  }
  kena(E, dmg, id) {
    if (E.mati || this.selesai) return;
    if (this.terkunci(E)) return;
    dmg = Math.max(1, Math.round(dmg));
    const h = id != null ? this.H.get(id) : null;
    E.hp = Math.max(0, E.hp - dmg); E.kenaT = this.t;
    if (id != null) {
      E.oleh = { id, tm: h ? h.tm : -1 };
      if (E.jenis === 'mon') { const bt = E.bantu || (E.bantu = new Map()), lama = bt.get(id), sum = lama && this.t - lama.t < 8 ? lama.dmg : 0; bt.set(id, { t: this.t, dmg: sum + dmg }); }
      if ((E.jenis === 'mon' || E.jenis === 'buaya') && E.sas == null) E.sas = id;
    }
    if (E.hp <= 0) this.mati(E);
  }
  mati(E) {
    E.mati = true; E.hp = 0; E.sas = null; E.sembur = null; E.lompat = null;
    const k = E.oleh;
    if (E.jenis === 'mon') {
      E.hidupT = this.t + WNV.mon.ulang;
      if (k && k.id != null) this.hadiah(k.id, { j: 'mon', st: E.stat });   // yang membunuh: pulih 20% HP + kartu (dihitung di HP / HP bot-nya)
      if (E.bantu) E.bantu.forEach((b, id) => { if (k && id === k.id) return; const h = this.H.get(id); if (this.t - b.t < 15 && b.dmg > 0 && (!k || !h || h.tm === k.tm)) this.hadiah(id, { j: 'asis' }); });   // assist monster (lane Support dicek di HP)
      E.bantu = null;
    } else if (E.jenis === 'rumah') {
      this.selesai = true; this.menang = 1 - E.tm;
      this.padat = this.padat.filter(q => q.E !== E);
    } else if (E.jenis === 'singa' || E.jenis === 'garuda') {
      this.padat = this.padat.filter(q => q.E !== E);
    } else if (E.jenis === 'buaya') {
      E.munculT = (Math.floor(this.t / WNV.buaya.selang) + 1) * WNV.buaya.selang;
      if (k && k.tm >= 0) { this.buayaTeman(k.tm, E.x, E.z, E.lv, E.idx); this.bonusBuaya(k.tm, '🐊 Buaya Danau'); }
    } else if (E.jenis === 'buayaT') {
      this.bonusBuaya(1 - E.tm, '🐊 Buaya Pendorong');
    }
    E.oleh = null;
  }
  bonusBuaya(tm, s) { this.anggotaTim(tm).forEach(id => this.hadiah(id, { j: 'buaya', s })); }
  buayaTeman(tm, x, z, lv = 1, idx = 0) {
    const E = this.bts[idx].mati ? this.bts[idx] : this.bts[1 - idx]; if (!E.mati) return;
    const V2 = WNV.buayaT, a = lv - 1;
    E.tm = tm; E.lv = lv; E.hpMax = Math.round(V2.hp * (1 + WNV.buaya.naikHp * a)); E.hp = E.hpMax;
    E.dmg = Math.round(V2.dmg * (1 + WNV.buaya.naikDmg * a)); E.dmgB = Math.round(V2.dmgB * (1 + WNV.buaya.naikDmg * a));
    E.mati = false; E.x = x; E.z = z; E.sas = null; E.cdA = 1; E.oleh = null; E.ultiT = 0; E.serangT = 0;
  }

  // ---------- gerak ----------
  gerak(E, kx, kz, kec, dt) {
    const dx = kx - E.x, dz = kz - E.z, L = hyp(dx, dz); if (L < .05) return;
    const s = Math.min(L, kec * dt * (E.lambat > 0 ? .6 : 1)); E.x += dx / L * s; E.z += dz / L * s; this.hadap(E, sudut(dx, dz), dt); E.jalan = 1;
  }
  hadap(E, a, dt) { let d = a - E.ry; d = Math.atan2(Math.sin(d), Math.cos(d)); E.ry += d * Math.min(1, dt * 10); }
  stun(E, dt) { E.pusing = Math.max(0, E.pusing - dt); E.kunci = Math.max(0, E.kunci - dt); E.lambat = Math.max(0, E.lambat - dt); return E.pusing > 0 || E.kunci > 0; }
  tahan(E) {   // bangunan padat & batas arena
    for (const q of this.padat) { const dx = E.x - q.x, dz = E.z - q.z, L = hyp(dx, dz), R = q.R + .5; if (L < R) { if (L < 1e-3) E.z = q.z + Math.sign(q.z || 1) * R; else { E.x = q.x + dx / L * R; E.z = q.z + dz / L * R; } } }
    E.x = Math.max(BATAS.x0, Math.min(BATAS.x1, E.x)); E.z = Math.max(BATAS.z0, Math.min(BATAS.z1, E.z));
  }
  nanti(dt, fn) { this.jadwal.push({ t: this.t + dt, fn }); }
  posH(t) { return t.ent ? { x: t.ent.x, z: t.ent.z } : t; }
  hidupH(t) { return !!t && (t.ent ? !t.ent.mati : t.hidup && this.t - t.t < PADAT_HERO); }
  naikPukulan(E) { const m = 1 + NAIK.per * (E.naikN || 0); E.naikN = Math.min(NAIK.maks, (E.naikN || 0) + 1); return m; }
  serangBaru(E, klip, lama) { E.atkN = (E.atkN + 1) % 1000; E.atkK = klip || ''; E.atkT = lama; E.serangT = lama; }
  menit() { return Math.floor(this.t / 60); }

  // ---------- otak monster hutan & Buaya Danau ----------
  aiMon(E, dt) {
    E.jalan = 0; if (this.stun(E, dt)) return;
    let tg = E.sas != null ? this.H.get(E.sas) : null;
    if (tg && (!this.hidupH(tg) || hyp(tg.x - E.hx, tg.z - E.hz) > E.leash)) { tg = null; E.sas = null; }
    const buaya = E.jenis === 'buaya';
    if (tg) {
      const L = hyp(tg.x - E.x, tg.z - E.z), jg = buaya ? 2.4 : 1.5;
      if (E.lompat && !(E.serangT > 0)) E.lompat = null;
      if (E.lompat) { const Lp = E.lompat, K = BUAYA_KLIP.terkam_lompat, u = Math.min(1, Math.max(0, (K.lama - E.serangT - K.lompat[0]) / (K.lompat[1] - K.lompat[0]))), e = u * u * (3 - 2 * u);
        E.x = Lp.x0 + (Lp.x1 - Lp.x0) * e; E.z = Lp.z0 + (Lp.z1 - Lp.z0) * e; this.hadap(E, Lp.a, dt); return; }
      if (buaya && this.buayaTempur(E, true) && L < BUAYA_ULTI.R + 1.5) { this.buayaUlti(E, h => true); return; }
      if (buaya && L > jg + .8 && L < 7 && E.cdA <= 0 && (E.terkamCd || 0) < this.t) {   // sasaran agak jauh → terkam melompat
        const K = BUAYA_KLIP.terkam_lompat, a = sudut(tg.x - E.x, tg.z - E.z);
        E.lompat = { x0: E.x, z0: E.z, x1: tg.x - Math.sin(a) * jg * .6, z1: tg.z - Math.cos(a) * jg * .6, a };
        this.serangBaru(E, 'terkam_lompat', K.lama); E.cdA = K.jeda; E.terkamCd = this.t + 7;
        const d = Math.round(E.dmg * 1.4);
        this.nanti(K.kena, () => { if (E.mati) return; this.heroes().forEach(h => { if (h.hidup && hyp(h.x - E.x, h.z - E.z) < 2.6) this.pukulHero(h, d, E.x, E.z, 4); }); });
        return; }
      if (L > jg && !(E.serangT > 0)) this.gerak(E, tg.x, tg.z, E.kec, dt); else this.hadap(E, sudut(tg.x - E.x, tg.z - E.z), dt);
      if (L <= jg + .2 && E.cdA <= 0) {
        const d = Math.round(E.dmg * (1 + (buaya ? WNV.buaya.naikPerMenit : WNV.mon.naikPerMenit) * this.menit()));
        if (buaya) {
          const n = BUAYA_URUT[(++E.nSerang) % BUAYA_URUT.length], K = BUAYA_KLIP[n];
          this.serangBaru(E, n, K.lama); E.cdA = Math.max(E.jeda, K.jeda || 0, K.lama * .92);
          [].concat(K.kena).forEach(t => this.nanti(t, () => { if (E.mati) return;
            const q = this.hidupH(tg) ? tg : { x: E.x, z: E.z }, cx = K.area ? E.x : E.x + (q.x - E.x) * .7, cz = K.area ? E.z : E.z + (q.z - E.z) * .7, r = K.area ? 3.2 : 2.4, dd = Math.round(d * (K.f || 1));
            this.heroes().forEach(h => { if (h.hidup && hyp(h.x - cx, h.z - cz) < r) this.pukulHero(h, dd, E.x, E.z, 3); }); }));
        } else {
          const S = MON_SERANG[E.mk] || [.75, .43];
          this.serangBaru(E, 'serang', S[0]); E.cdA = Math.max(E.jeda, S[0]);
          this.nanti(S[0] * S[1], () => { if (E.mati || !this.hidupH(tg)) return; this.pukulHero(tg, d, E.x, E.z, 1.5); });
        }
      }
    } else {
      if (buaya) this.buayaTempur(E, false);
      if (hyp(E.x - E.hx, E.z - E.hz) > .3) this.gerak(E, E.hx, E.hz, E.kec * 1.5, dt); else if (E.arahAsal !== undefined) this.hadap(E, E.arahAsal, dt);
      if (this.t - E.kenaT > 2.5 && E.hp < E.hpMax) E.hp = Math.min(E.hpMax, E.hp + E.hpMax * .25 * dt);
    }
  }
  buayaTempur(E, aktif) {
    if (aktif) { E.tempurLepas = this.t; if (!E.ultiT) E.ultiT = this.t + BUAYA_ULTI.pertama; }
    else if (E.ultiT && this.t - (E.tempurLepas || 0) > BUAYA_ULTI.lepas) E.ultiT = 0;
    return !!(E.ultiT && this.t >= E.ultiT && !(E.serangT > 0));
  }
  buayaUlti(E, kenaLawan) {
    const K = BUAYA_KLIP.ulti; E.ultiT = this.t + BUAYA_ULTI.jeda; this.serangBaru(E, 'ulti', K.lama); E.cdA = Math.max(E.cdA, K.lama); E.lompat = null;
    const d = Math.round((E.jenis === 'buayaT' ? E.dmg : E.dmg * (1 + WNV.buaya.naikPerMenit * this.menit())) * BUAYA_ULTI.f);
    K.kena.forEach(t => this.nanti(t, () => { if (E.mati) return; const cx = E.x, cz = E.z;
      this.heroes().forEach(h => { if (!h.hidup || !kenaLawan(h) || hyp(h.x - cx, h.z - cz) > BUAYA_ULTI.R) return; this.pukulHero(h, d, cx, cz, 4); if (h.bot) h.bot.lambat = Math.max(h.bot.lambat, BUAYA_ULTI.lambat); else this.ev1({ k: 'lambat', ke: h.id, d: BUAYA_ULTI.lambat }); });
      if (E.jenis === 'buayaT') { const S = this.berikut(1 - E.tm); if (S && !S.mati && hyp(S.x - cx, S.z - cz) < BUAYA_ULTI.R + (S.padat || 0)) this.kena(S, E.dmgB * 1.5, null); } }));
  }

  // ---------- Sisingaan ----------
  cariDiLingkaran(E) {   // hero lawan (dan buaya lawan) terdekat di dalam lingkaran jaga
    let tg = null, bd = 1e9;
    this.heroes().forEach(h => { if (h.tm === E.tm || !h.hidup || hyp(h.x - E.hx, h.z - E.hz) > E.R) return; const d = hyp(h.x - E.x, h.z - E.z); if (d < bd) { bd = d; tg = h; } });
    this.bts.forEach(b => { if (!b.mati && b.tm !== E.tm && hyp(b.x - E.hx, b.z - E.hz) < E.R + 1.5) { const d = hyp(b.x - E.x, b.z - E.z) + 2; if (d < bd) { bd = d; tg = { ent: b }; } } });
    return tg;
  }
  sasaranPenjaga(E) {   // sasaran yang masih sah, atau cari baru
    const t = E.sasP; if (!t) return null;
    if (t.ent) return !t.ent.mati && t.ent.tm !== E.tm && hyp(t.ent.x - E.hx, t.ent.z - E.hz) < E.R + 1.5 ? t : null;
    const h = this.H.get(t.id); return h && this.hidupH(h) && h.tm !== E.tm && hyp(h.x - E.hx, h.z - E.hz) < E.R + .6 ? h : null;
  }
  aiSinga(E, dt) {
    E.jalan = 0; if (this.stun(E, dt)) return;
    let tg = this.sasaranPenjaga(E);
    if (!tg || Math.random() < dt * .8) tg = this.cariDiLingkaran(E);
    E.sasP = tg; E.sas = tg ? 1 : null;
    if (tg) {
      const q = this.posH(tg), L = hyp(q.x - E.x, q.z - E.z), jg = E.jangkau + (tg.ent ? 1 : 0);
      if (L > jg && !(E.serangT > 0)) { let kx = q.x, kz = q.z; const dx = kx - E.hx, dz = kz - E.hz, dl = hyp(dx, dz); if (dl > E.R) { kx = E.hx + dx / dl * E.R; kz = E.hz + dz / dl * E.R; } this.gerak(E, kx, kz, E.kec, dt); }
      else this.hadap(E, sudut(q.x - E.x, q.z - E.z), dt);
      if (L <= jg + .3 && E.cdA <= 0) {
        E.nSerang++; const n = E.nSerang % 3 === 0 ? 'putar' : E.nSerang % 3 === 1 ? 'serang1' : 'serang2', K = SINGA_KLIP[n];
        this.serangBaru(E, n, K.lama); E.cdA = K.jeda || E.jeda;
        const naik = this.naikPukulan(E), dmg = E.dmg * naik;
        this.nanti(K.kena, () => { if (E.mati) return;
          if (K.area) { this.heroes().forEach(h => { if (h.tm === E.tm || !h.hidup) return; if (hyp(h.x - E.x, h.z - E.z) < jg + 1) this.pukulHero(h, dmg, E.x, E.z, 4); });
            this.bts.forEach(b => { if (!b.mati && b.tm !== E.tm && hyp(b.x - E.x, b.z - E.z) < jg + 1) this.kena(b, dmg, null); }); return; }
          if (!this.hidupH(tg)) return; const p = this.posH(tg); if (hyp(p.x - E.x, p.z - E.z) < jg + 1) this.pukulHero(tg, dmg, E.x, E.z, 4); });
      }
    } else {
      if (hyp(E.x - E.hx, E.z - E.hz) > .3) this.gerak(E, E.hx, E.hz, E.kec, dt); else { this.hadap(E, E.tm ? 0 : Math.PI, dt); E.naikN = 0; }
      if (this.t - E.kenaT > 5 && E.hp < E.hpMax) E.hp = Math.min(E.hpMax, E.hp + E.hpMax * WNV.singa.pulih * dt);
    }
  }

  // ---------- Garuda ----------
  aiGaruda(E, dt) {
    if (!E.ultiT && !E.sembur) E.naikN = 0;
    if (this.stun(E, dt)) { E.sembur = null; return; }
    if (E.sembur) { this.updSembur(E, dt); return; }
    let tg = this.sasaranPenjaga(E);
    if (!tg || Math.random() < dt) tg = this.cariDiLingkaran(E);
    E.sasP = tg; E.sas = tg ? 1 : null;
    if (tg) { E.tempurLepas = this.t; if (!E.ultiT) E.ultiT = this.t + GARUDA_ULTI.jeda;
      const q = this.posH(tg); this.hadap(E, sudut(q.x - E.hx, q.z - E.hz), dt * .5);
      if (this.t >= E.ultiT) { this.sembur(E, tg); return; } }
    else { if (E.ultiT && this.t - (E.tempurLepas || 0) > GARUDA_ULTI.lepas) E.ultiT = 0; this.hadap(E, E.hadap0, dt * .15); }
    if (tg && E.cdA <= 0) {   // serangan biasa: bola api terbang 15 m/dtk dari paruh (tinggi ±4,8 m) ke sasaran
      E.cdA = E.jeda; this.serangBaru(E, '', .4);
      const naik = this.naikPukulan(E), dmg = E.dmg * naik, q = this.posH(tg), jarak = Math.hypot(hyp(q.x - E.hx, q.z - E.hz), 3.8);
      this.nanti(jarak / 15, () => { if (E.mati || !this.hidupH(tg)) return; const p = this.posH(tg); this.pukulHero(tg, dmg, p.x, p.z, 3); });
    } else if (!tg && this.t - E.kenaT > 5 && E.hp < E.hpMax) E.hp = Math.min(E.hpMax, E.hp + E.hpMax * WNV.garuda.pulih * dt);
  }
  sembur(E, tg) {
    const q = this.posH(tg), a = sudut(q.x - E.hx, q.z - E.hz);
    E.ultiT = this.t + GARUDA_ULTI.jeda; E.cdA = Math.max(E.cdA, GARUDA_ULTI.lama + .4); E.sembur = { a, t: 0, i: 0 };
  }
  updSembur(E, dt) {
    const S = E.sembur, U = GARUDA_ULTI; S.t += dt; this.hadap(E, S.a, dt);
    while (S.i < U.kena.length && S.t >= U.kena[S.i]) { S.i++; this.semburKena(E, S.a); }
    if (S.t >= U.lama + .3) E.sembur = null;
  }
  semburKena(E, a) {
    const U = GARUDA_ULTI, dmg = Math.round(E.dmg * U.f);
    const diKipas = (x, z) => { const dx = x - E.hx, dz = z - E.hz, L = hyp(dx, dz); if (L > U.R + .4 || L < .01) return false; let da = sudut(dx, dz) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); return Math.abs(da) <= U.sudut + .6 / Math.max(L, 1); };
    this.heroes().forEach(h => { if (h.tm === E.tm || !h.hidup || !diKipas(h.x, h.z)) return; this.pukulHero(h, dmg, E.hx, E.hz, 2.5); this.terbakar(h.id, h.max || 1000); });
    this.bts.forEach(b => { if (!b.mati && b.tm !== E.tm && diKipas(b.x, b.z)) { this.kena(b, dmg, null); this.terbakar('bt' + b.ki, b.hpMax, b); } });
  }
  terbakar(id, max, ent) {   // kena api lagi: waktu terbakar diulang dari awal (tidak menumpuk)
    const b = this.bakar.get(id); if (b) { b.sisa = GARUDA_ULTI.bakar; b.max = max || b.max; } else this.bakar.set(id, { sisa: GARUDA_ULTI.bakar, tk: .5, max: max || 1000, ent });
  }
  updBakar(dt) {   // terbakar api Garuda: 4% HP maks / dtk (tiap 0,5 dtk) selama 3 dtk
    this.bakar.forEach((b, id) => {
      const h = b.ent ? { ent: b.ent } : this.H.get(id);
      if (!this.hidupH(h)) { this.bakar.delete(id); return; }
      b.sisa -= dt; b.tk -= dt;
      if (b.tk <= 0) { b.tk += .5; const d = Math.max(1, Math.round(b.max * GARUDA_ULTI.bakarDps * .5)), p = this.posH(h); this.pukulHero(h, d, p.x, p.z, 0); }
      if (b.sisa <= 0) this.bakar.delete(id);
    });
  }

  // ---------- Buaya teman (mendorong ke bangunan lawan) ----------
  berikut(tm) { return !this.singa[tm].mati ? this.singa[tm] : !this.garuda[tm].mati ? this.garuda[tm] : this.rumah[tm]; }
  aiBuayaT(E, dt) {
    const mu = 1 - E.tm; E.jalan = 0; if (this.stun(E, dt)) return;
    let tg = null, bd = 4.2; this.heroes().forEach(h => { if (h.tm === mu && h.hidup) { const d = hyp(h.x - E.x, h.z - E.z); if (d < bd) { bd = d; tg = h; } } });
    const S = this.berikut(mu); let bang = false; if (!tg) { if (!S || S.mati) return; tg = { ent: S }; bang = true; }
    const q = this.posH(tg), jg = bang ? (S.padat || 0) + 1.9 : 2.2, L = hyp(q.x - E.x, q.z - E.z);
    if (L > jg && !(E.serangT > 0)) {
      let kx = q.x, kz = q.z; const arah = Math.sign(q.z - E.z) || 1;
      if (Math.abs(E.x) > 2.8) { kx = 0; kz = E.z + arah * 2; }
      else if (Math.abs(E.z) < 3.5 && Math.abs(q.z) > 3.5) { kx = 2.7; kz = E.z + arah * 2.5; }   // memutar di samping Tugu Nanas
      this.gerak(E, kx, kz, E.kec, dt);
    } else this.hadap(E, sudut(q.x - E.x, q.z - E.z), dt);
    const dekat = L <= jg + .3;
    if (this.buayaTempur(E, dekat) && dekat) { this.buayaUlti(E, h => h.tm !== E.tm); return; }
    if (dekat && E.cdA <= 0) {
      const urut = BUAYA_URUT.filter(n => !BUAYA_KLIP[n].area), n = urut[(++E.nSerang) % urut.length], K = BUAYA_KLIP[n];
      this.serangBaru(E, n, K.lama); E.cdA = Math.max(E.jeda, K.lama * .92);
      [].concat(K.kena).forEach(t => this.nanti(t, () => { if (E.mati) return; const f = K.f || 1;
        if (bang) { if (!S.mati) this.kena(S, E.dmgB * f, null); return; }
        if (!this.hidupH(tg)) return; const p = this.posH(tg); if (hyp(p.x - E.x, p.z - E.z) < jg + 1) this.pukulHero(tg, E.dmg * f, E.x, E.z, 3); }));
    }
  }

  // ---------- Tugu Nanas ----------
  updTugu(dt) {
    const T = this.tugu, n = [0, 0], dlm = [];
    this.heroes().forEach(h => { if (h.hidup && hyp(h.x, h.z) < TUGU_R) { n[h.tm]++; dlm.push(h); } });
    T.rebut = 0;
    if (n[0] && n[1]) { T.rebut = 1; return; }
    const t = n[0] ? 0 : n[1] ? 1 : -1;
    if (t >= 0 && t !== T.milik) {
      if (T.tim !== t) { T.tim = t; T.prog = 0; }
      T.prog += dt * TUGU_KEC[Math.min(3, n[t])];
      if (T.prog >= WNV.tugu.lama) {
        T.milik = t; T.prog = 0; T.tim = -1;
        if (this.t - T.hadiahT[t] >= WNV.tugu.hadiahCd) { T.hadiahT[t] = this.t; dlm.forEach(h => { if (h.tm === t && h.hidup) this.hadiah(h.id, { j: 'tugu' }); }); }
      }
    } else { T.prog = Math.max(0, T.prog - dt * 1.5); if (T.prog <= 0) T.tim = -1; }
  }

  // ---------- satu langkah simulasi ----------
  langkah(dt) {
    this.t += dt;
    // jadwal pukulan (saat animasi kena)
    if (this.jadwal.length) { const siap = this.jadwal.filter(j => j.t <= this.t); this.jadwal = this.jadwal.filter(j => j.t > this.t); siap.forEach(j => { try { j.fn(); } catch (e) { console.error('[wasit WN]', e); } }); }
    if (this.selesai) return;
    // Buaya Danau muncul tiap 4 menit (level = kemunculan ke berapa)
    this.E.forEach(B => { if (B.jenis !== 'buaya' || !B.mati || this.t < B.munculT) return;
      const lv = Math.max(1, Math.floor(this.t / WNV.buaya.selang)), a = lv - 1; B.lv = lv; B.munculT = 1e9;
      B.hpMax = Math.round(WNV.buaya.hp * (1 + WNV.buaya.naikHp * a)); B.hp = B.hpMax; B.dmg = Math.round(WNV.buaya.dmg * (1 + WNV.buaya.naikDmg * a));
      B.mati = false; B.x = B.hx; B.z = B.hz; B.ry = B.arahAsal; B.sas = null; B.oleh = null; B.ultiT = 0; B.serangT = 0; B.cdA = 0; });
    this.E.forEach(E => {
      if (E.mati) {
        if (E.jenis === 'mon' && this.t > E.hidupT) { const k = 1 + WNV.mon.naikPerMenit * this.menit(); E.hpMax = Math.round(E.hpDasar * k); E.hp = E.hpMax;
          E.mati = false; E.x = E.hx; E.z = E.hz; E.ry = E.arahAsal; E.sas = null; E.oleh = null; E.cdA = 0; E.serangT = 0; }
        return;
      }
      E.cdA = Math.max(0, E.cdA - dt); E.serangT = Math.max(0, E.serangT - dt);
      if (E.jenis === 'mon' || E.jenis === 'buaya') this.aiMon(E, dt); else if (E.jenis === 'singa') this.aiSinga(E, dt); else if (E.jenis === 'garuda') this.aiGaruda(E, dt); else if (E.jenis === 'buayaT') this.aiBuayaT(E, dt);
      if (E.jenis === 'rumah' || E.jenis === 'garuda') { E.x = E.hx; E.z = E.hz; } else this.tahan(E);
    });
    if (this.botSrv) this.botLangkah(dt);
    this.updBakar(dt); this.updTugu(dt);
  }

  // ---------- kiriman ke HP (format sama dengan wnSnap di game3d.html) ----------
  snap() {
    const semua = (this.snapN = this.snapN + 1) % 15 === 0, out = [];   // semua baris tiap ±2 dtk
    this.E.forEach((E, i) => {
      const tampak = !E.mati;
      const f = (E.mati ? 1 : 0) | (E.jalan ? 2 : 0) | (E.ultiT || E.sembur ? 4 : 0) | (E.sas != null ? 8 : 0) | (tampak ? 16 : 0);
      const d = [i, Math.round(E.hp), Math.round(E.hpMax), r2(E.x), r2(E.z), r2(E.ry), f, E.atkN | 0, E.atkK || '', r2(E.atkT || 0), E.sembur ? r2(E.sembur.a) : null, E.tm, E.lv | 0];
      const kunci = d.join(','); if (!semua && E._snap === kunci) return; E._snap = kunci; out.push(d);
    });
    const T = this.tugu, w = { w: r2(this.t), e: out, t: [T.milik, r2(T.prog), T.tim, T.rebut] };
    if (this.botSrv && semua) w.s = this.botCadang();   // kartu stat & skill bot (untuk tabel / pengganti)
    return w;
  }
  jalan() {   // dipanggil tiap TICK
    if (!this.mulaiJalan) { for (const h of this.H.values()) if (!h.bot) { this.mulaiJalan = true; break; } if (!this.mulaiJalan) return; }   // jam pertandingan baru jalan setelah pemain pertama masuk arena (HP lambat memuat model)
    this.tick++;
    this.langkah(TICK);
    const kirimSnap = this.tick % 2 === 0;   // 7,5x per detik (gerak monster & lompatan Buaya lebih halus)
    if (!kirimSnap && !this.ev.length) return;
    const m = { t: 'wnSrv' };
    if (kirimSnap) { m.wn = this.snap(); if (this.botSrv) m.b = this.botBaris(); }
    if (this.ev.length) m.e = this.ev.splice(0);
    this.kirim(m);
  }
}

require('./bot-war-nanas.js')(WasitWN);   // otak bot War Nanas (Tahap 2)
module.exports = { WasitWN, TICK };
