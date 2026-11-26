// Kalensari Game – server online (lobi, kode room, cari lawan acak, penerus data pertandingan)
// Mode: Duel 1 vs 1 (2 pemain), Duel Tim custom (1-3 vs 1-3) dan Parkur Hantu (balapan, maks 6 pemain per room)
// Main Bareng: lobi mudah (pesan 'lb…'): host pilih mode Duel/Parkur/Acak + arena, tiap pemain pilih hero diam-diam, lalu server membuat room-nya sendiri
// Versi game: game.html (menu, kartu, teman, Parkur 2D) & game3d.html (semua duel 3D, kirim v:'3d' di 'hello')
// Duel 1 vs 1 & Duel Tim dimainkan di game3d.html; game.html hanya menanyakan jenis room ('cek') lalu membuka game3d.html
// Jalankan: node server.js   (port bawaan 8090, hanya mendengar di 127.0.0.1; diakses lewat Nginx wss://game.kalensari.web.id/ws)
const http = require('http');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { WasitWN, TICK: WN_TICK } = require('./wasit-war-nanas.js');   // wasit War Nanas di server (monster, penjaga, buaya, tugu)

// ---------- WebSocket mini (tanpa paket tambahan, cukup Node.js) ----------
class Sock extends EventEmitter {
  constructor(socket) {
    super(); this.s = socket; this.readyState = 1; this.buf = Buffer.alloc(0); this.frag = null;
    socket.setNoDelay(true);
    socket.on('data', d => { this.buf = Buffer.concat([this.buf, d]); if (this.buf.length > 256 * 1024) return this.terminate(); this.parse(); });
    socket.on('close', () => this.closed());
    socket.on('error', () => this.closed());
  }
  parse() {
    for (;;) {
      const b = this.buf; if (b.length < 2) return;
      const fin = b[0] & 0x80, op = b[0] & 0x0f, masked = b[1] & 0x80; let len = b[1] & 0x7f, p = 2;
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); p = 4; }
      else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); p = 10; }
      if (len > MAX_PAYLOAD) return this.terminate();
      if (!masked) return this.terminate();             // klien wajib mengirim data ber-mask
      if (b.length < p + 4 + len) return;
      const mask = b.subarray(p, p + 4); p += 4;
      const data = Buffer.from(b.subarray(p, p + len));
      for (let i = 0; i < data.length; i++) data[i] ^= mask[i & 3];
      this.buf = b.subarray(p + len);
      if (op === 0x8) { this.raw(0x8, Buffer.alloc(0)); return this.terminate(); }
      if (op === 0x9) { this.raw(0xA, data); continue; }
      if (op === 0xA) { this.emit('pong'); continue; }
      if (op === 0x1 || op === 0x2) { if (fin) this.emit('message', data); else this.frag = [data]; continue; }
      if (op === 0x0 && this.frag) { this.frag.push(data); if (fin) { this.emit('message', Buffer.concat(this.frag)); this.frag = null; } continue; }
    }
  }
  raw(op, payload) {
    if (this.readyState !== 1) return;
    const n = payload.length; let h;
    if (n < 126) { h = Buffer.from([0x80 | op, n]); }
    else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x80 | op; h[1] = 126; h.writeUInt16BE(n, 2); }
    else { h = Buffer.alloc(10); h[0] = 0x80 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); }
    try { this.s.write(Buffer.concat([h, payload])); } catch { this.terminate(); }
  }
  send(str) { this.raw(0x1, Buffer.from(str)); }
  ping() { this.raw(0x9, Buffer.alloc(0)); }
  terminate() { if (this.readyState === 3) return; this.readyState = 3; try { this.s.destroy(); } catch {} this.closed(); }
  closed() { if (this.done) return; this.done = true; this.readyState = 3; this.emit('close'); }
}
const MAX_PAYLOAD = 64 * 1024;
const clients = new Set();
const wss = new EventEmitter();
wss.clients = clients;

const PORT = +process.env.PORT || 8090;
const HOST = process.env.HOST || '127.0.0.1';
const HEROES = ["pocong", "kuntilanak", "tuyul", "genderuwo", "pitung", "erick", "doni", "timunmas", "buto", "lutung", "saras", "angling", "dayang", "nyiroro", "siliwangi", "ciung", "sangkuriang", "kiansantang", "wiro", "roro", "masdim", "wewe", "blorong", "dewisri", "arjuna", "rawa"];   // samakan dengan HEROK di game.html (hero baru wajib ditambah di sini)   // doni: hero ke-7   // pitung: hero ke-5   // tuyul: hero ke-3, genderuwo: hero ke-4 (game3d)
const RELAY_FROM_HOST = new Set(['st', 'end']);   // data pertandingan dari host → tamu
const RELAY_FROM_GUEST = new Set(['in']);         // tombol tamu → host

const rooms = new Map();   // kode → {code, host, guest, active, quick, pub}
// ---------- AKUN PEMAIN (untuk fitur teman) ----------
// Server menanyakan ke Supabase: sesi akun pembeli → ID akun (PB0001). Alamat & kunci publik sama dengan config.js situs.
const SB_URL = process.env.KS_SUPABASE_URL || 'https://mochsxsxxwaibtfpudoz.supabase.co';
const SB_KEY = process.env.KS_SUPABASE_KEY || 'sb_publishable_9M1gzo3mE9YYpFrIExrCrA_stGdgkK9';
const akunWs = new Map();  // ID akun → ws yang sedang online
function cekAkun(sesi) {
  return new Promise(res => {
    try {
      const body = JSON.stringify({ p_sesi: String(sesi).slice(0, 200) }), u = new URL(SB_URL + '/rest/v1/rpc/game_akun_id');
      const rq = require('https').request(u, { method: 'POST', timeout: 8000, headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, r => {
        let d = ''; r.on('data', c => { d += c; if (d.length > 4000) rq.destroy(); }); r.on('end', () => { try { res(JSON.parse(d)); } catch { res(null); } });
      });
      rq.on('error', () => res(null)); rq.on('timeout', () => { rq.destroy(); res(null); }); rq.end(body);
    } catch { res(null); }
  });
}
function sbRpc(fn, isi) {   // panggil fungsi RPC Supabase (dipakai Rank)
  return new Promise(res => {
    try {
      const body = JSON.stringify(isi), u = new URL(SB_URL + '/rest/v1/rpc/' + fn);
      const rq = require('https').request(u, { method: 'POST', timeout: 10000, headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, r => {
        let d = ''; r.on('data', c => { d += c; if (d.length > 20000) rq.destroy(); }); r.on('end', () => { let j = null; try { j = JSON.parse(d); } catch { } if (r.statusCode >= 300) console.log(new Date().toISOString(), 'rpc ' + fn + ' gagal', r.statusCode, d.slice(0, 200)); res(r.statusCode < 300 ? j : null); });
      });
      rq.on('error', e => { console.log('rpc ' + fn + ' error', e.message); res(null); }); rq.on('timeout', () => { rq.destroy(); res(null); }); rq.end(body);
    } catch { res(null); }
  });
}
// ringkasan room tempat pemain berada (untuk daftar room & status teman)
function roomOf(ws) {
  const L = ws.lobi && lbrooms.get(ws.lobi);
  if (L) return lbInfo(L);
  const d = ws.room && rooms.get(ws.room);
  if (d) return { c: d.code, m: 'duel', n: d.host && d.host.name, a: d.host ? d.host.arena : 0, pl: d.guest ? 2 : 1, max: 2, st: d.active && d.guest ? 'main' : 'lobby', pub: !!d.pub };
  const t = ws.troom && trooms.get(ws.troom);
  if (t) return { c: t.code, m: 'tim', n: t.host && t.host.name, a: t.a, pl: t.pl.length + t.bots.length, max: 6, st: t.state === 'game' ? 'main' : 'lobby', pub: !!t.pub };
  const k = ws.proom && prooms.get(ws.proom);
  if (k) return { c: k.code, m: 'pk', n: k.host && k.host.name, a: k.a || 0, pl: k.pl.length, max: PK_MAX, st: k.state === 'race' ? 'main' : 'lobby', pub: !!k.pub, q: !!k.quick };
  return null;
}
function daftarRoom(ver = '') {   // semua room terbuka: duel 3D, duel tim 3D, parkur
  const L = [];
  rooms.forEach(r => { if (r.pub && r.host && !r.guest && !r.active && r.host.ver === '3d') L.push(Object.assign(roomOf(r.host), { t: r.t0 || 0 })); });
  trooms.forEach(r => { if (r.pub && r.host && r.ver === '3d' && r.state === 'lobby' && r.pl.length + r.bots.length < 6) L.push(Object.assign(roomOf(r.host), { t: r.t0 || 0 })); });
  prooms.forEach(r => { if (r.pub && r.host && !r.lb && r.state === 'lobby' && r.pl.length < PK_MAX) L.push(Object.assign(roomOf(r.host), { t: r.t0 || 0 })); });
  lbrooms.forEach(r => { if (r.pub && r.state === 'lobby' && r.mem.size < LB_MAX && lbOn(r).length) L.push(Object.assign(lbInfo(r), { t: r.t0 || 0 })); });
  return L.sort((a, b) => b.t - a.t).slice(0, 30).map(({ t, ...x }) => x);
}
let queue = [];            // pemain yang menunggu lawan acak
let nextId = 1;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`Kalensari Game Server OK – online: ${wss.clients.size}, room: ${rooms.size}, antre: ${queue.length}, room parkur: ${prooms.size}, room tim: ${trooms.size}, lobi main bareng: ${lbrooms.size}\n`);
  } else { res.writeHead(404); res.end(); }
});
server.on('upgrade', (req, socket, head) => {
  const key = req.headers['sec-websocket-key'];
  if (!req.url.startsWith('/ws') || !key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  const ws = new Sock(socket); clients.add(ws); ws.on('close', () => clients.delete(ws));
  wss.emit('connection', ws, req);
  if (head && head.length) { ws.buf = Buffer.concat([head, ws.buf]); ws.parse(); }   // data yang ikut terbawa di paket pertama
});

const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(typeof o === 'string' ? o : JSON.stringify(o)); };
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);

function newCode() {
  let c;
  do { c = String(Math.floor(1000 + Math.random() * 9000)); } while (rooms.has(c) || prooms.has(c) || trooms.has(c) || lbrooms.has(c));
  return c;
}

// =================== DUEL TIM CUSTOM (1-3 vs 1-3) ===================
// Pembuat room = wasit (menjalankan pertandingan & mengirim keadaan 'st' ke semua);
// tamu mengirim tombol 'in' → server menambahkan w = id pengirim lalu meneruskan ke pembuat room.
const TM_MAX = 3;                       // maks pemain per tim
const TM_KW = [3, 5, 10, 15, 20];       // pilihan target kill
const trooms = new Map();               // kode → {code, host, pl:[ws], state:'lobby'|'game', a, kw}
const tmCount = (r, t) => r.pl.filter(w => w.tmT === t).length + r.bots.filter(b => b.tm === t).length;   // bot ikut dihitung
let botSeq = 0;
function tmRoomMsg(r) {
  const pl = r.pl.map(w => ({ i: w.id, n: w.name, h: w.hero, s: w.skin || '', tm: w.tmT, r: w.tmR ? 1 : 0 }))
    .concat(r.bots.map(b => ({ i: b.i, n: b.n, h: b.h, s: '', tm: b.tm, r: 1, bot: 1 })));
  r.pl.forEach(w => send(w, { t: 'tmRoom', code: r.code, host: r.host === w, me: w.id, hostId: r.host && r.host.id, a: r.a, kw: r.kw, state: r.state, pl, max: TM_MAX, lb: r.lb || '', exp: r.exp ? r.exp.size : 0 }));
}
function tmJoin(ws, r) {
  leave(ws);
  const t0 = tmCount(r, 0), t1 = tmCount(r, 1);
  ws.tmT = t0 <= t1 ? (t0 < TM_MAX ? 0 : 1) : (t1 < TM_MAX ? 1 : 0); ws.tmR = 0;
  if (r.exp && r.exp.has(ws.pid)) { ws.tmT = r.exp.get(ws.pid); ws.tmR = 1; }   // Main Bareng: tim sudah dibagi server
  r.pl.push(ws); ws.troom = r.code; if (!r.host) r.host = ws;
  tmRoomMsg(r);
  if (r.exp && r.state === 'lobby' && [...r.exp.keys()].every(p => r.pl.some(w => w.pid === p))) setTimeout(() => lbTmMulai(r), 600);
}
function tmMulaiRoom(r) {   // mulai Duel Tim (dipakai tombol MULAI & Main Bareng)
  r.state = 'game'; r.mulaiT = Date.now(); r.skor = [0, 0]; r.cadang = new Map();
  const ppl = w => ({ i: w.id, n: w.name, h: w.hero, s: w.skin || '', tm: w.tmT }), pbot = b => ({ i: b.i, n: b.n, h: b.h, s: '', tm: b.tm, bot: 1 });
  const pl = [0, 1].flatMap(t => r.pl.filter(w => w.tmT === t).map(ppl).concat(r.bots.filter(b => b.tm === t).map(pbot)));
  let um = 0; if (r.um) { const p = r.pl.find(w => w.pid === r.um) || r.pl[Math.floor(Math.random() * r.pl.length)]; um = p.id; }
  // War Nanas: monster & bangunan dijalankan server (kalau semua HP sudah memakai game3d.html versi baru)
  const botSrv = BOT_SERVER && r.wn && r.pl.every(w => w.wns >= 2);   // Tahap 2: bot dijalankan server (semua HP sudah versi baru)
  r.sim = r.wn && r.pl.every(w => w.wns) ? new WasitWN(r, m => kirimWasit(r, m), { botSrv, lv: r.host ? r.host.blv : 1 }) : null;
  if (r.sim) r.sim.onMati = (id, tm) => { r.skor = r.skor || [0, 0]; r.skor[tm ? 0 : 1]++; };   // bot server mati → skor tim lawan
  const wnSrv = r.sim ? 1 : 0, bs = r.sim && r.sim.botSrv ? 1 : 0;
  r.pl.forEach(w => send(w, { t: 'tmStart', pl, me: w.id, host: r.host.id, a: r.a, kw: r.kw, dur: r.dur || 0, code: r.code, um, wn: r.wn || 0, wnSrv, botSrv: bs }));
  r.mulai = { pl, host: r.host.id, a: r.a, kw: r.kw, dur: r.dur || 0, code: r.code, um, wn: r.wn || 0, wnSrv, botSrv: bs };
  (r.tonton || []).forEach(w => send(w, Object.assign({ t: 'tmStart', me: w.id, tonton: 1 }, r.mulai)));
  if (r.wn) tmBotSapa(r);
  console.log(new Date().toISOString(), 'duel tim mulai', r.code, r.lb ? '(main bareng ' + r.lb + ')' : '', pl.map(x => (x.tm ? 'M:' : 'B:') + x.n).join(', '));
}
function tmLeave(ws) {
  const r = ws.troom && trooms.get(ws.troom); ws.troom = null;
  if (!r) return;
  if (r.tonton && r.tonton.includes(ws)) { r.tonton = r.tonton.filter(w => w !== ws); return; }   // penonton keluar
  if (r.state === 'game' && r.wn && r.pl.includes(ws) && ws.pid) { tmTunda(r, ws); return; }   // War Nanas: kursi ditahan dulu (sinyal putus) / diganti bot
  r.pl = r.pl.filter(w => w !== ws);
  if (r.rank && r.state === 'game') rkKabur(r, ws.pid);   // Rank: keluar di tengah pertandingan = kalah
  if (!r.pl.length) { clearTimeout(r.autoT); trooms.delete(r.code); if (r.lb) lbKembali(r.lb, r.code); return; }
  const wasHost = r.host === ws;
  if (wasHost) r.host = r.pl[0];
  if (r.state === 'game') {
    r.pl.forEach(w => send(w, { t: 'tmLeft', i: ws.id, host: wasHost ? 1 : 0 }));
    if (wasHost) { r.state = 'lobby'; r.pl.forEach(w => { w.tmR = 0; }); tmRoomMsg(r); }   // wasit keluar → pertandingan berhenti
  } else tmRoomMsg(r);
}
// ---- War Nanas online: sambung ulang & pindah wasit ----
// Putus sinyal → kursi ditahan 90 dtk (wasit yang punya teman manusia: wasit pindah setelah 12 dtk, kursinya tetap ditahan). Tersambung lagi (tmBalik) → main terus seperti biasa.
// Lewat batas / keluar sengaja → heronya dijalankan bot. Kalau yang hilang wasit, HP terkuat yang tersisa menjadi wasit baru.
const TM_TAHAN = 90000, TM_TAHAN_WASIT = 12000;
function tmTunda(r, ws) {
  const wasit = r.host === ws, putus = !!ws.putus;
  r.pl = r.pl.filter(w => w !== ws);
  if (wasit) r.host = null;
  r.tunda = r.tunda || new Map();
  const T = { pid: ws.pid, i: ws.id, tm: ws.tmT, h: ws.hero, s: ws.skin || '', n: ws.name, wasit };
  r.tunda.set(ws.pid, T);
  if (putus) r.pl.forEach(w => send(w, { t: 'tmPutus', i: T.i, host: wasit ? 1 : 0 }));
  T.timer = setTimeout(() => tmTundaHabis(r, ws.pid), putus ? TM_TAHAN : 0);
  if (putus && wasit && r.pl.length) T.timerW = setTimeout(() => tmPindahWasit(r, T), TM_TAHAN_WASIT);   // pemain lain tidak boleh menunggu lama: pertandingan dijalankan HP lain dulu
  console.log(new Date().toISOString(), 'war nanas', r.code, ws.name, putus ? 'terputus (kursi ditahan)' : 'keluar', wasit ? '[wasit]' : '');
}
function tmPindahWasit(r, T) {   // wasit belum kembali 12 dtk: HP terkuat yang tersisa jadi wasit, kursi wasit lama tetap ditahan sampai 90 dtk
  if (!r.tunda || r.tunda.get(T.pid) !== T || r.host || !r.pl.length || trooms.get(r.code) !== r || r.state !== 'game') return;
  T.wasit = false;
  r.host = r.pl.slice().sort((p, q) => (q.kuat || 0) - (p.kuat || 0))[0];
  r.pl.forEach(w => send(w, { t: 'tmWasit', host: r.host.id, bots: r.bots.map(b => b.i), tahan: T.i }));
  console.log(new Date().toISOString(), 'war nanas', r.code, 'wasit pindah ke', r.host.name, '(kursi', T.n, 'tetap ditahan)');
}
function tmTundaHabis(r, pid) {
  const T = r.tunda && r.tunda.get(pid); if (!T) return;
  clearTimeout(T.timerW); r.tunda.delete(pid);
  if (trooms.get(r.code) !== r || r.state !== 'game') return;
  if (r.rank) rkKabur(r, pid);   // Rank: tidak kembali = kalah
  r.bots.push({ i: T.i, n: T.n, h: T.h, tm: T.tm, ganti: 1 });   // heronya diteruskan bot (id sama)
  if (r.sim && r.sim.botSrv) { const h = r.sim.H.get(T.i); r.sim.tambahBot({ i: T.i, n: T.n, h: T.h, tm: T.tm }, { x: h && h.x, z: h && h.z, cadang: r.cadang && r.cadang.get(T.i) }); }   // bot server melanjutkan heronya
  if (!r.pl.length) { if (!r.tunda.size) { rkTutup(r); clearTimeout(r.autoT); trooms.delete(r.code); if (r.lb) lbKembali(r.lb, r.code); } return; }
  if (!r.host) {   // pindah wasit: HP terkuat yang tersisa
    r.host = r.pl.slice().sort((p, q) => (q.kuat || 0) - (p.kuat || 0))[0];
    r.pl.forEach(w => send(w, { t: 'tmWasit', host: r.host.id, bots: r.bots.map(b => b.i), keluar: T.i }));
    console.log(new Date().toISOString(), 'war nanas', r.code, 'wasit pindah ke', r.host.name);
  } else r.pl.forEach(w => send(w, { t: 'tmJadiBot', i: T.i }));
}
function tmBalik(ws, m) {   // HP yang tadi terputus masuk lagi ke pertandingan yang sama
  const r = trooms.get(clean(m.code, 6)), i = m.i | 0;
  if (!r || r.state !== 'game' || !ws.pid) { send(ws, { t: 'tmBalikGagal' }); return; }
  const T = r.tunda && r.tunda.get(ws.pid), lama = r.pl.find(w => w !== ws && w.pid === ws.pid && w.id === i);
  if (!(T && T.i === i) && !lama) { send(ws, { t: 'tmBalikGagal' }); return; }
  leave(ws);
  if (T && T.i === i) {
    clearTimeout(T.timer); clearTimeout(T.timerW); r.tunda.delete(ws.pid);
    ws.id = T.i; ws.tmT = T.tm; ws.hero = T.h; ws.skin = T.s; ws.tmR = 1; ws.troom = r.code; r.pl.push(ws);
    if (T.wasit && !r.host) r.host = ws;
  } else {   // server belum sadar koneksi lama putus: koneksi baru langsung menggantikannya
    ws.id = lama.id; ws.tmT = lama.tmT; ws.hero = lama.hero; ws.skin = lama.skin; ws.tmR = 1; ws.troom = r.code;
    r.pl[r.pl.indexOf(lama)] = ws; if (r.host === lama) r.host = ws;
    lama.troom = null; lama.lobi = null; try { lama.terminate(); } catch { }
  }
  send(ws, { t: 'tmBalikOk', host: r.host === ws ? 1 : 0, hostId: r.host ? r.host.id : 0 });
  r.pl.forEach(w => { if (w !== ws) send(w, { t: 'tmSambung', i: ws.id }); });
  console.log(new Date().toISOString(), 'war nanas', r.code, ws.name, 'tersambung lagi');
}
// ---- wasit War Nanas di server: 15x per detik, kirim keadaan ke semua HP ----
function kirimWasit(r, m) {
  const str = JSON.stringify(m);
  r.pl.forEach(w => send(w, str)); (r.tonton || []).forEach(w => send(w, str));
}
setInterval(() => {
  trooms.forEach(r => {
    const S = r.sim; if (!S) return;
    if (r.state !== 'game' || trooms.get(r.code) !== r) { r.sim = null; return; }
    if (S.selesai) { S.selesaiT = S.selesaiT || Date.now(); if (Date.now() - S.selesaiT > 15000) { r.sim = null; return; } }
    try { S.jalan(); } catch (e) { console.error(new Date().toISOString(), 'wasit war nanas error', r.code, e); }
  });
}, Math.round(WN_TICK * 1000));
// HP yang halamannya termuat ulang (mis. aplikasi ditutup Android saat membuka WhatsApp) masuk lagi ke War Nanas yang sama,
// selama kursinya masih ditahan (90 dtk) atau server belum sadar koneksi lamanya putus. Kartu stat, Poin Skill & skor ikut dikembalikan.
function tmCatat(r, ws, m) {
  if (Array.isArray(m.ws) && m.ws.length <= 10) (r.cadang || (r.cadang = new Map())).set(ws.id, m.ws);
  if (Array.isArray(m.e)) m.e.forEach(e => {
    if (!e || e.k !== 'mati') return;
    const id = e.id, p = r.pl.find(w => w.id === id), b = !p && r.bots.find(x => x.i === id), T = !p && !b && r.tunda && [...r.tunda.values()].find(x => x.i === id);
    const tm = p ? p.tmT : b ? b.tm : T ? T.tm : -1; if (tm < 0) return;
    r.skor = r.skor || [0, 0]; r.skor[tm ? 0 : 1]++;
  });
}
function tmMasukLagi(ws, r) {
  const T = r.tunda && r.tunda.get(ws.pid), lama = !T && r.pl.find(w => w !== ws && w.pid === ws.pid);
  if (!T && !lama) return false;
  leave(ws);
  if (T) {
    clearTimeout(T.timer); clearTimeout(T.timerW); r.tunda.delete(ws.pid);
    ws.id = T.i; ws.tmT = T.tm; ws.hero = T.h; ws.skin = T.s; r.pl.push(ws);
    if (T.wasit && !r.host) r.host = ws;
  } else {
    ws.id = lama.id; ws.tmT = lama.tmT; ws.hero = lama.hero; ws.skin = lama.skin;
    r.pl[r.pl.indexOf(lama)] = ws; if (r.host === lama) r.host = ws;
    lama.troom = null; lama.lobi = null; try { lama.terminate(); } catch { }
  }
  ws.tmR = 1; ws.troom = r.code;
  if (!r.host) r.host = ws;
  send(ws, Object.assign({ t: 'tmStart' }, r.mulai, { me: ws.id, host: r.host.id, ulang: 1, cadang: (r.cadang && r.cadang.get(ws.id)) || null, skor: r.skor || [0, 0], waktu: r.sim ? Math.round(r.sim.t) : 0 }));
  r.pl.forEach(w => { if (w !== ws) send(w, { t: 'tmSambung', i: ws.id }); });
  console.log(new Date().toISOString(), 'war nanas', r.code, ws.name, 'masuk lagi setelah halaman dimuat ulang');
  return true;
}
// HP tuan rumah (yang menjalankan bot) macet: mis. tab browser disembunyikan / aplikasi di latar belakang → bot ikut diam.
// Tidak ada kiriman 5 dtk → bot dipindah ke HP lain yang masih aktif (HP terkuat).
const TM_MACET = 5000;
const BOT_SERVER = true;   // false = bot War Nanas kembali dijalankan HP tuan rumah (cara lama)
setInterval(() => {
  const now = Date.now();
  trooms.forEach(r => {
    if (!r.wn || r.state !== 'game' || !r.host || !r.host.lastSt || r.pl.length < 2) return;
    if (now - r.host.lastSt < TM_MACET) return;
    const calon = r.pl.filter(w => w !== r.host && w.lastSt && now - w.lastSt < 2000).sort((p, q) => (q.kuat || 0) - (p.kuat || 0))[0];
    if (!calon) return;
    const lama = r.host; r.host = calon;
    r.pl.forEach(w => send(w, { t: 'tmWasit', host: r.host.id, bots: r.bots.map(b => b.i), macet: lama.id }));
    console.log(new Date().toISOString(), 'war nanas', r.code, 'HP wasit', lama.name, 'macet → bot pindah ke', calon.name);
  });
}, 1000);
// =================== MIC (suara tim, WebRTC) ===================
// Suara mengalir langsung antar-HP satu tim; server hanya menyampaikan "jabat tangan" (offer/answer/ICE) ke teman SATU TIM.
// TURN (coturn di VPS) dipakai kalau jaringan seluler menghalangi sambungan langsung. Kunci harus sama dengan static-auth-secret di /etc/turnserver.conf
const TURN_KUNCI = process.env.KS_TURN_KUNCI || '';
const TURN_HOST = process.env.KS_TURN_HOST || '139.190.101.234';
function iceUntuk(ws) {
  const s = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  if (TURN_KUNCI) {
    const username = Math.floor(Date.now() / 1000 + 6 * 3600) + ':' + (ws.id || 0);   // berlaku 6 jam
    const credential = crypto.createHmac('sha1', TURN_KUNCI).update(username).digest('base64');
    s.push({ urls: ['turn:' + TURN_HOST + ':3478?transport=udp', 'turn:' + TURN_HOST + ':3478?transport=tcp'], username, credential });
  }
  return s;
}
function tmRtc(r, ws, m) {
  if (!r || !r.pl.includes(ws) || !m.d) return;
  const raw = JSON.stringify(m.d); if (raw.length > 12000) return;
  const ke = r.pl.find(w => w.id === (m.ke | 0) && w.tmT === ws.tmT && w !== ws);   // hanya ke teman satu tim
  if (ke) send(ke, { t: 'tmRtc', dari: ws.id, d: m.d });
}
// =================== CHAT DALAM PERTANDINGAN (War Nanas) ===================
// chat cepat & chat ketik · tim: hanya ke satu tim · semua: termasuk lawan & penonton · kata kasar disaring di server
const CHAT_KASAR = ['anjing', 'anjeng', 'anjg', 'anying', 'anjir', 'bangsat', 'bngst', 'kontol', 'kntl', 'memek', 'mmk', 'ngentot', 'ngntt', 'entot', 'goblok', 'goblog', 'gblk', 'tolol', 'tll', 'kampret', 'jancok', 'jancuk', 'cuk', 'asu', 'jembut', 'bajingan', 'brengsek', 'bangke', 'keparat', 'pantek', 'lonte', 'pelacur', 'perek', 'coli', 'peler', 'pepek', 'titit', 'kehed', 'belegug', 'gelo', 'sundel', 'tai', 'taik', 'idiot', 'fuck', 'fck', 'shit', 'bitch', 'dick', 'pussy', 'bego', 'begok', 'kafir'];
const CHAT_LEET = { 4: 'a', '@': 'a', 1: 'i', '!': 'i', 3: 'e', 0: 'o', 5: 's', $: 's', 7: 't' };
const CHAT_RX = new RegExp('(^|[^a-z])(' + CHAT_KASAR.map(k => k.split('').map(c => c + '+').join('[\\W_]*')).join('|') + ')(?=$|[^a-z])', 'gi');
function chatSaring(x) {
  x = String(x || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const norm = x.toLowerCase().replace(/[4@1!305$7]/g, c => CHAT_LEET[c] || c);
  let out = x.split(''); CHAT_RX.lastIndex = 0; let mm;
  while ((mm = CHAT_RX.exec(norm))) { const a = mm.index + mm[1].length, b = mm.index + mm[0].length; for (let i = a; i < b; i++) if (out[i] !== ' ') out[i] = '*'; }
  return out.join('');
}
function chatKirim(r, dari, x, tim) {   // dari: {i, n, tm}
  const msg = { t: 'tmChat', i: dari.i, n: dari.n, tm: dari.tm, tim: tim ? 1 : 0, x };
  r.pl.forEach(w => { if (!tim || w.tmT === dari.tm) send(w, msg); });
  if (!tim) (r.tonton || []).forEach(w => send(w, msg));
}
function tmChat(r, ws, m) {
  if (!r || !r.pl.includes(ws)) return;
  const now = Date.now(); ws.chatT = (ws.chatT || []).filter(t => now - t < 10000);
  if (ws.chatT.length >= 6 || now - (ws.chatT[ws.chatT.length - 1] || 0) < 900) { send(ws, { t: 'tmChatTahan' }); return; }   // anti-spam
  const x = chatSaring(m.x); if (!x) return;
  ws.chatT.push(now);
  chatKirim(r, { i: ws.id, n: ws.name, tm: ws.tmT }, x, !!m.tim);
  if (m.tim && /tolo+ng|bantu|help/i.test(x)) tmBotJawab(r, ws.tmT);
}
// bot ikut ngobrol sedikit (biar terasa seperti pemain): sapaan awal, jawab minta tolong, GG di akhir
const BOT_SAPA = ['Semangat! 💪', 'Gas! 🔥', 'Ayo menang!', 'Bismillah', 'Siap!'], BOT_OTW = ['Otw! 🏃', 'Tunggu, otw', 'Siap, ke sana!', 'Otw bro'], BOT_GG = ['GG 👍', 'gg', 'GG wp', 'GG 🔥'];
const acakDari = a => a[Math.floor(Math.random() * a.length)];
function botAktif(r) { return (r.bots || []).filter(b => b && b.i != null); }
function tmBotSapa(r) {
  botAktif(r).forEach(b => { if (Math.random() < .3) setTimeout(() => { if (r.state === 'game' && trooms.get(r.code) === r) chatKirim(r, { i: b.i, n: b.n, tm: b.tm }, acakDari(BOT_SAPA), true); }, 16000 + Math.random() * 14000); });
}
function tmBotJawab(r, tm) {
  const kawan = botAktif(r).filter(b => b.tm === tm); if (!kawan.length || Math.random() > .6 || now0() - (r.botJawabT || 0) < 8000) return;
  r.botJawabT = now0(); const b = acakDari(kawan);
  setTimeout(() => { if (r.state === 'game') chatKirim(r, { i: b.i, n: b.n, tm: b.tm }, acakDari(BOT_OTW), true); }, 1200 + Math.random() * 1800);
}
function tmBotGG(r) {
  const bs = botAktif(r).filter(() => Math.random() < .4).slice(0, 3);
  bs.forEach((b, k) => setTimeout(() => chatKirim(r, { i: b.i, n: b.n, tm: b.tm }, acakDari(BOT_GG), false), 1500 + k * 1300 + Math.random() * 1500));
}
const now0 = () => Date.now();
function tmMsg(ws, m, raw) {
  const r = ws.troom && trooms.get(ws.troom);
  switch (m.t) {
    case 'tmCreate': {
      leave(ws); const code = newCode();
      const room = { code, host: null, pl: [], bots: [], state: 'lobby', a: ws.arena || 0, kw: 10, pub: m.pub !== 0, t0: Date.now(), ver: ws.ver || '' };
      trooms.set(code, room); tmJoin(ws, room); return;
    }
    case 'tmSet': {   // pemain mengubah tim / hero / siap (hanya di lobby)
      if (!r || r.state !== 'lobby') return;
      if ((m.tm === 0 || m.tm === 1) && m.tm !== ws.tmT) { if (tmCount(r, m.tm) >= TM_MAX) { send(ws, { t: 'err', msg: 'Tim itu sudah penuh (' + TM_MAX + ' pemain)' }); return; } ws.tmT = m.tm; ws.tmR = 0; }
      if (HEROES.includes(m.h)) { if (m.h !== ws.hero) ws.tmR = 0; ws.hero = m.h; ws.skin = clean(m.s, 20); }
      if (m.r != null) ws.tmR = m.r ? 1 : 0;
      tmRoomMsg(r); return;
    }
    case 'tmCfg': {   // pembuat room: arena & target kill
      if (!r || r.host !== ws || r.state !== 'lobby') return;
      if (m.a != null) r.a = Math.max(0, Math.min(9, m.a | 0));
      if (TM_KW.includes(m.kw | 0)) r.kw = m.kw | 0;
      tmRoomMsg(r); return;
    }
    case 'tmBot': {   // pembuat room menambah bot ke tim (slot kosong)
      if (!r || r.host !== ws || r.state !== 'lobby') return;
      const tm = m.tm === 1 ? 1 : 0;
      if (tmCount(r, tm) >= TM_MAX) { send(ws, { t: 'err', msg: 'Tim itu sudah penuh' }); return; }
      const h = HEROES.includes(m.h) ? m.h : HEROES[Math.floor(Math.random() * HEROES.length)];
      let k = 1; while (r.bots.some(b => b.n === 'Bot ' + k)) k++;
      r.bots.push({ i: -(++botSeq), n: 'Bot ' + k, h, tm });
      tmRoomMsg(r); return;
    }
    case 'tmBotDel': {   // hapus bot / ganti hero bot
      if (!r || r.host !== ws || r.state !== 'lobby') return;
      const b = r.bots.find(x => x.i === (m.i | 0)); if (!b) return;
      if (HEROES.includes(m.h)) b.h = m.h; else r.bots = r.bots.filter(x => x !== b);
      tmRoomMsg(r); return;
    }
    case 'tmGo': {
      if (!r || r.host !== ws || r.state !== 'lobby') return;
      if (!tmCount(r, 0) || !tmCount(r, 1)) { send(ws, { t: 'err', msg: 'Tiap tim minimal 1 pemain' }); return; }
      if (r.pl.some(w => w !== r.host && !w.tmR)) { send(ws, { t: 'err', msg: 'Tunggu semua pemain menekan SIAP' }); return; }
      tmMulaiRoom(r);
      return;
    }
    case 'tmOver': if (r && r.host === ws && r.state === 'game' && r.wn) tmBotGG(r);
      if (r && r.host === ws && r.state === 'game' && r.rank) { rkSelesai(r, m); return; }
      if (r && r.host === ws && r.state === 'game') { if (r.um && r.lb && m.first) { const w = r.pl.find(x => x.id === (m.first | 0)), L = lbrooms.get(r.lb); if (w && L) L.umNext = w.pid; } r.state = 'lobby'; r.pl.forEach(w => { w.tmR = 0; }); tmRoomMsg(r); if (r.lb) { r.exp = null; lbKembali(r.lb, r.code); } } return;
    case 'tmBack': if (r) tmRoomMsg(r); return;
    case 'tmBalik': tmBalik(ws, m); return;
    case 'tmChat': tmChat(r, ws, m); return;
    case 'tmAfk': if (r && r.pl.includes(ws)) { ws.afkMode = m.on ? 1 : 0; ws.afkSejak = m.on ? Date.now() - Math.min(120, Math.max(0, m.diam | 0)) * 1000 : 0; } return;   // diam: lama tidak menyentuh layar (dtk)
    case 'tmIce': send(ws, { t: 'tmIce', s: iceUntuk(ws) }); return;
    case 'tmRtc': tmRtc(r, ws, m); return;
    case 'tmMic': if (r && r.pl.includes(ws)) { ws.mic = m.on ? 1 : 0; r.pl.forEach(w => { if (w !== ws && w.tmT === ws.tmT) send(w, { t: 'tmMic', i: ws.id, on: ws.mic }); }); } return;
  }
}
function tmRelay(ws, m, raw) {   // data pertandingan tim
  const r = ws.troom && trooms.get(ws.troom);
  if (!r || r.state !== 'game') return false;
  if (r.ver === '3d' && (m.t === 'st' || m.t === 'in')) {
    if (!r.pl.includes(ws)) return true;
    ws.lastSt = Date.now();
    m.w = ws.id;
    if (r.wn) tmCatat(r, ws, m);   // kartu stat & skor (dipakai kalau HP ini masuk lagi setelah halaman dimuat ulang)
    if (r.sim) r.sim.terima(ws, m);   // posisi hero & damage ke monster/bangunan untuk wasit server
    const str = JSON.stringify(m);
    // 'st' boleh dilewati kalau HP penerima sedang macet; 'in' (tombol) selalu dikirim
    const boleh = w => m.t === 'in' || !w.s || w.s.writableLength < 32 * 1024;
    r.pl.forEach(w => { if (w !== ws && boleh(w)) send(w, str); });
    (r.tonton || []).forEach(w => { if (boleh(w)) send(w, str); });
    return true;
  }
  if (m.t === 'st' && r.host === ws) { const str = raw.toString(); r.pl.forEach(w => { if (w !== ws) send(w, str); }); return true; }
  if (m.t === 'in' && r.host !== ws) { m.w = ws.id; send(r.host, m); return true; }
  return false;
}

// =================== PARKUR HANTU ONLINE ===================
// Tiap HP menjalankan karakternya sendiri lalu mengirim posisinya; server meneruskan ke pemain lain di room,
// memberi aba-aba mulai yang sama untuk semua, dan mencatat urutan finis.
const PK_MAX = 6;            // maks pemain per room parkur
const PK_CD = 3500;          // hitung mundur sebelum mulai (ms)
const PK_LIMIT = 10 * 60000; // batas waktu balapan: 10 menit (ms)
const PK_DORONG = 9500;      // jeda minimal antar serangan Dorong (ms); di game 10 detik
const PK_AUTO = 12000;       // room acak: mulai otomatis 12 detik setelah ada 2 pemain
const PK_ARENA = 6;         // jumlah lintasan parkur (0 = Jembatan Kali Angker, 1 = Dusun Malam Jumat, 2 = Lari Jalan Desa)
const pkAr = m => Math.max(0, Math.min(PK_ARENA - 1, m.ar | 0));
const prooms = new Map();    // kode → {code, quick, host, pl:[ws], state:'lobby'|'race', t0, fin:[], tm, auto}
const pkInfo = ws => ({ i: ws.id, n: ws.name, h: ws.hero, s: ws.skin || '' });
const pkAll = (r, o, except) => { const str = JSON.stringify(o); r.pl.forEach(w => { if (w !== except) send(w, str); }); };
function pkRoomMsg(r) {
  r.pl.forEach(w => send(w, { t: 'pkRoom', code: r.code, quick: !!r.quick, host: r.host === w, me: w.id, hostId: r.host && r.host.id,
    pl: r.pl.map(pkInfo), a: r.a || 0, max: PK_MAX, auto: r.autoAt ? Math.max(0, r.autoAt - Date.now()) : 0, lb: r.lb || '' }));
}
function pkAutoCheck(r) {
  if (!r.quick || r.state !== 'lobby') return;
  if (r.pl.length >= 2 && !r.auto) { r.autoAt = Date.now() + PK_AUTO; r.auto = setTimeout(() => { r.auto = null; r.autoAt = 0; pkStart(r); }, PK_AUTO); }
  if (r.pl.length < 2 && r.auto) { clearTimeout(r.auto); r.auto = null; r.autoAt = 0; }
  if (r.pl.length >= PK_MAX && r.auto) { clearTimeout(r.auto); r.auto = null; r.autoAt = 0; pkStart(r); }
}
function pkStart(r) {
  if (r.state !== 'lobby' || r.pl.length < 2) return;
  if (r.auto) { clearTimeout(r.auto); r.auto = null; r.autoAt = 0; }
  r.state = 'race'; r.t0 = Date.now() + PK_CD; r.fin = []; r.racers = r.pl.length;
  pkAll(r, { t: 'pkStart', cd: PK_CD, a: r.a || 0, pl: r.pl.map(pkInfo) });
  r.tm = setTimeout(() => pkEnd(r), PK_CD + PK_LIMIT);
  console.log(new Date().toISOString(), 'parkur mulai', r.code, r.pl.map(w => w.name).join(', '));
}
function pkEnd(r) {
  if (r.state !== 'race') return;
  clearTimeout(r.tm); r.state = 'lobby';
  pkAll(r, { t: 'pkEnd', fin: r.fin });
  if (r.lb) { r.pl.forEach(w => { if (w.proom === r.code) w.proom = null; }); prooms.delete(r.code); lbKembali(r.lb, r.code); return; }   // Main Bareng: semua kembali ke lobi
  if (!r.pl.length) prooms.delete(r.code); else { pkRoomMsg(r); pkAutoCheck(r); }
}
function pkJoin(ws, r) {
  leave(ws);
  r.pl.push(ws); ws.proom = r.code; if (!r.host) r.host = ws;
  pkRoomMsg(r); pkAutoCheck(r);
}
function pkLeave(ws) {
  const r = ws.proom && prooms.get(ws.proom); ws.proom = null;
  if (!r) return;
  r.pl = r.pl.filter(w => w !== ws);
  if (!r.pl.length) { clearTimeout(r.tm); clearTimeout(r.auto); prooms.delete(r.code); if (r.lb) lbKembali(r.lb, r.code); return; }
  if (r.host === ws) r.host = r.pl[0];
  pkAll(r, { t: 'pkLeft', i: ws.id });
  if (r.state === 'lobby') { pkRoomMsg(r); pkAutoCheck(r); }
  else if (r.fin.length >= r.pl.length) pkEnd(r);      // yang tersisa sudah finis semua
}
function pkMsg(ws, m, raw) {
  const r = ws.proom && prooms.get(ws.proom);
  switch (m.t) {
    case 'pkCreate': { leave(ws); const code = newCode(); const room = { code, quick: false, host: null, pl: [], state: 'lobby', fin: [], a: pkAr(m), pub: m.pub !== 0, t0: Date.now() }; prooms.set(code, room); pkJoin(ws, room); return; }
    case 'pkQuick': {
      leave(ws);
      const ar = pkAr(m);   // room acak dicocokkan dengan lintasan yang sama
      let room = [...prooms.values()].find(x => x.quick && x.state === 'lobby' && x.pl.length < PK_MAX && (x.a || 0) === ar);
      if (!room) { const code = newCode(); room = { code, quick: true, host: null, pl: [], state: 'lobby', fin: [], a: ar, pub: true, t0: Date.now() }; prooms.set(code, room); }
      pkJoin(ws, room); return;
    }
    case 'pkGo': if (r && r.host === ws) { if (r.pl.length < 2) send(ws, { t: 'err', msg: 'Butuh minimal 2 pemain' }); else pkStart(r); } return;
    case 'pkPos': {
      if (!r || r.state !== 'race') return;
      const o = { t: 'pkPos', i: ws.id };
      for (const k of ['x', 'y', 'z', 'fx', 'fy']) o[k] = Math.round((+m[k] || 0) * 100) / 100;
      o.w = m.w ? 1 : 0; o.g = m.g ? 1 : 0; o.gl = m.gl ? 1 : 0; o.m = m.m ? 1 : 0; o.cp = m.cp | 0; o.a = m.a ? 1 : 0; o.dk = m.dk ? 1 : 0;
      pkAll(r, o, ws); return;
    }
    case 'pkHit': {   // serangan dasar "Dorong": diteruskan hanya ke pemain yang kena
      if (!r || r.state !== 'race' || Date.now() < r.t0) return;
      const tg = r.pl.find(w => w.id === (m.i | 0)); if (!tg || tg === ws) return;
      // satu serangan boleh mengenai beberapa pemain (dalam 80 ms), serangan berikutnya minimal PK_DORONG kemudian
      const now = Date.now();
      if (now - (ws.hitT || 0) >= PK_DORONG) { ws.hitT = now; ws.hitSet = new Set(); }
      else if (now - ws.hitT > 80 || ws.hitSet.has(tg.id)) return;
      ws.hitSet.add(tg.id);
      const cl = v => Math.max(-1, Math.min(1, +v || 0));
      send(tg, { t: 'pkHit', i: ws.id, dx: cl(m.dx), dy: cl(m.dy) });
      return;
    }
    case 'pkFin': {
      if (!r || r.state !== 'race' || r.fin.some(f => f.i === ws.id)) return;
      const tm = Math.max(0, (Date.now() - r.t0) / 1000);
      const f = { i: ws.id, n: ws.name, h: ws.hero, tm: Math.round(tm * 10) / 10, rank: r.fin.length + 1 };
      r.fin.push(f); pkAll(r, Object.assign({ t: 'pkFin' }, f));
      if (r.fin.length >= r.pl.length) setTimeout(() => pkEnd(r), 1500);
      return;
    }
  }
}

// =================== MAIN BARENG (lobi mudah untuk anak-anak) ===================
// Alur: tombol MAIN BARENG → lobi (teman masuk lewat link / QR / daftar room) → host memilih mode Duel / Parkur / Acak
// (+ arena, bawaan 🎲 acak) → MULAI → tiap pemain memilih hero sendiri di layar penuh (tidak melihat pilihan teman)
// → server membuat room Parkur / Duel Tim sendiri → selesai → semua kembali ke lobi yang sama.
// Anggota lobi dikenali dari pid (kode acak di localStorage HP), jadi tetap terdaftar walau halaman berpindah ke game3d.html.
const LB_MAX = 6;                          // maks pemain per lobi (Duel 3 vs 3 / Parkur 6 pemain)
const LB_HERO = 15000;                     // waktu memilih hero (ms)
const LB_GRACE = 90000;                    // anggota yang terputus tetap disimpan 90 detik (pindah halaman / sinyal hilang)
const LB_HOST_GANTI = 20000;               // host terputus 20 detik di lobi → host pindah ke pemain lain
const LB_TUNGGU_WN = 75000;               // War Nanas / Rank: memuat arena + model di HP lebih lama → tunggu sampai 75 dtk
const LB_TUNGGU_3D = 30000;                // batas menunggu semua pemain masuk arena Duel 3D (ms)
const LB_KW = 10;
const LB_DUR = [5, 7, 10, 15], LB_KILL = [10, 15, 20, 30];   // pilihan host untuk Duel Tim (menit / target kill)                          // target kill Duel Main Bareng
const LB_MODE = ['duel', 'tim', 'wn', 'pk', 'umpet', 'acak', 'rk'];   // rk = Rank party (maks 3 orang satu tim, cari lawan online)   // wn = War Nanas 3 vs 3 (slot kosong diisi bot)   // umpet = Petak Umpet Hantu (1 penjaga, sisanya sembunyi)   // duel = 1 vs 1 (bergiliran bila >2 pemain), tim = Biru vs Merah (+ bot)
const LB_AR = { duel: 4, tim: 4, wn: 1, pk: PK_ARENA + 1, umpet: 1 };   // pk: lintasan ke-7 (nomor PK_ARENA) = Petak Umpet Hantu
const UMPET_ARENA = 4;   // game3d.html: ARENA_NAMA[4] = 'kebun' (Kebun Malam)   // jumlah arena: duel 3D (0 Lapangan SD, 1 Kuil Malam, 2 Sawah Siang, 3 Taman Pink), parkur (lihat PK_ARENA)
const lbrooms = new Map();                 // kode → {code, hostPid, mem: Map pid→anggota, m, a, state:'lobby'|'hero'|'main', ...}
let lbSeq = 0;
const lbOn = L => [...L.mem.values()].filter(x => x.ws && x.ws.readyState === 1);
const lbHost = L => L.mem.get(L.hostPid);
function lbInfo(L) { const h = lbHost(L); return { c: L.code, m: 'lb', n: h ? h.n : 'Pemain', a: 0, pl: L.mem.size, max: LB_MAX, st: L.state === 'lobby' ? 'lobby' : 'main', pub: !!L.pub, lm: L.m || '' }; }
const lbTimM = m => m === 'tim' || m === 'wn';   // mode bertim (Biru/Merah · War Nanas: Merah/Putih)
function lbTimPos(L) { if (lbTimM(L.m) || lbTimM(L.rm)) [...L.mem.values(), ...(L.bots || [])].forEach(y => { if (y.pos != null) y.tm = y.pos % 2; }); }
const lbKotakTim = (L, t) => { for (let p = t; p < LB_MAX; p += 2) if (lbKosong(L, p)) return p; return -1; };   // kotak kosong pertama di kolom tim t
function lbKirim(L) {
  if (L.rank) return;   // Rank: tidak ada layar lobi
  lbPos(L); if (L.state === 'lobby') lbTimPos(L);
  const pl = [...L.mem.values()].map(x => ({ k: x.k, n: x.n, on: x.ws && x.ws.readyState === 1 ? 1 : 0, h: x.pid === L.hostPid ? 1 : 0, tm: x.tm | 0, p: x.pos }))
    .concat((L.bots || []).map(b => ({ k: b.k, n: b.n, on: 1, h: 0, tm: b.tm, bot: 1, p: b.pos })));   // bot yang ditambahkan host lewat tanda +
  const sisa = L.state === 'hero' ? Math.max(0, L.heroEnd - Date.now()) : 0;
  lbOn(L).forEach(x => send(x.ws, { t: 'lbRoom', code: L.code, me: x.k, host: x.pid === L.hostPid, pl, m: L.m, a: L.a, state: L.state, max: LB_MAX,
    ikut: x.inR ? 1 : 0, rm: L.state !== 'lobby' ? L.rm : '', ra: L.state !== 'lobby' ? L.ra : -1, sisa, wasit: x.wasit ? 1 : 0, pub: L.pub ? 1 : 0, bot: 0, tmMax: TM_MAX, dur: L.dur || 5, kill: L.kill || 10, rkT: L.rkQ ? Date.now() - L.rkQ.t0 : -1 }));
}
function lbJoin(ws, code) {
  const L = lbrooms.get(code);
  if (!L) { send(ws, { t: 'err', msg: 'Lobi ' + code + ' tidak ditemukan (mungkin sudah ditutup)', hilang: 1 }); return; }
  if (!ws.pid) { send(ws, { t: 'err', msg: 'Muat ulang halaman game lalu coba lagi' }); return; }
  let x = L.mem.get(ws.pid);
  if (!x && L.rkQ) rkBatalParty(L, '⚠️ ' + ws.name + ' masuk lobi — pencarian lawan dibatalkan');
  if (!x && L.mem.size + (L.bots || []).length >= LB_MAX && (L.bots || []).length) L.bots.pop();   // lobi penuh tapi ada bot → bot memberi tempat untuk teman
  if (!x && L.mem.size >= LB_MAX) { send(ws, { t: 'err', msg: 'Lobi sudah penuh (' + LB_MAX + ' pemain)' }); return; }
  if (ws.lobi !== code) leave(ws);
  if (!x) { x = { k: ++lbSeq, pid: ws.pid, ws: null, n: ws.name, h: ws.hero, s: ws.skin, gone: 0, inR: false, pick: 0, tm: lbTimKecil(L), main: 0 }; L.mem.set(ws.pid, x); }
  if (x.ws && x.ws !== ws) { x.ws.lobi = null; }          // HP yang sama membuka tab baru
  x.ws = ws; x.gone = 0; x.n = ws.name; ws.lobi = code; if (ws.foto != null) x.f = ws.foto;
  // foto profil: kirim semua foto anggota ke yang baru masuk, dan fotonya ke anggota lain
  send(ws, { t: 'lbFoto', L: [...L.mem.values()].filter(y => y.f).map(y => ({ k: y.k, f: y.f })) });
  if (x.f) lbOn(L).forEach(y => { if (y !== x) send(y.ws, { t: 'lbFoto', L: [{ k: x.k, f: x.f }] }); });
  if (!x.pick) { x.h = ws.hero; x.s = ws.skin; }
  if (!lbHost(L) || !lbHost(L).ws) { const h = lbHost(L); if (!h) L.hostPid = ws.pid; }
  lbKirim(L);
  if (L.state === 'hero' && x.inR && (!x.pick || L.draft)) send(ws, lbHeroMsg(L, x, Math.ceil((L.heroEnd - Date.now()) / 1000)));
}
function lbLeave(ws) {   // keluar dari lobi dengan sengaja (tombol Keluar)
  const L = ws.lobi && lbrooms.get(ws.lobi); ws.lobi = null;
  if (!L) return;
  const x = L.mem.get(ws.pid); if (x && x.ws === ws) L.mem.delete(ws.pid);
  lbRapikan(L);
}
function lbLepas(ws) {   // koneksi putus: tetap jadi anggota sementara
  const L = ws.lobi && lbrooms.get(ws.lobi); ws.lobi = null;
  if (!L) return;
  const x = L.mem.get(ws.pid); if (!x || x.ws !== ws) return;
  x.ws = null; x.gone = Date.now();
  lbKirim(L);
  if (L.state === 'hero') lbCekPilih(L);
}
function lbRapikan(L) {
  if (!L.mem.size) { clearTimeout(L.heroT); lbrooms.delete(L.code); return; }
  if (!L.mem.has(L.hostPid)) { const on = lbOn(L)[0] || [...L.mem.values()][0]; L.hostPid = on.pid; }
  lbKirim(L);
  if (L.state === 'hero') lbCekPilih(L);
}
function lbCekPilih(L) {   // semua yang ikut sudah memilih hero → langsung mulai
  if (L.draft) return;
  const ikut = lbOn(L).filter(x => x.inR);
  if (ikut.length && ikut.every(x => x.pick) && !L.cepat) { L.cepat = 1; clearTimeout(L.heroT);
    let d = 0; (L.preBots || []).filter(b => !b.h).forEach(b => { clearTimeout(b.t); d += 350 + Math.random() * 450; b.t = setTimeout(() => lbBotPilih(L, b), d); });
    L.heroT = setTimeout(() => lbLuncur(L), 1300 + d); }
}
function lbKembali(code, sub) {   // pertandingan selesai → kembali ke lobi
  const L = lbrooms.get(code); if (!L || L.state !== 'main' || (sub && L.sub !== sub)) return;
  L.state = 'lobby'; L.sub = null; L.backT = Date.now();
  L.mem.forEach(x => { x.inR = false; x.pick = 0; x.wasit = false; if (!x.ws) x.gone = Date.now(); });
  lbKirim(L);
}
function lbBatal(L, msg) {
  L.state = 'lobby'; L.sub = null; L.mem.forEach(x => { x.inR = false; x.pick = 0; });
  lbOn(L).forEach(x => send(x.ws, { t: 'err', msg })); lbKirim(L);
}
function lbPos(L) {   // pastikan semua anggota & bot punya nomor kotak yang unik
  const semua = [...L.mem.values(), ...(L.bots || [])], dipakai = new Set();
  semua.forEach(y => { if (y.pos != null && y.pos >= 0 && y.pos < LB_MAX && !dipakai.has(y.pos)) dipakai.add(y.pos); else y.pos = null; });
  semua.forEach(y => { if (y.pos == null) { let p = 0; while (dipakai.has(p)) p++; y.pos = p; dipakai.add(p); } });
}
const lbKosong = (L, p) => p >= 0 && p < LB_MAX && ![...L.mem.values(), ...(L.bots || [])].some(y => y.pos === p);
const lbJmlTim = (L, t) => [...L.mem.values()].filter(x => x.tm === t).length + (L.bots || []).filter(b => b.tm === t).length;
const lbBotBisa = m => m === 'duel' || m === 'tim' || m === 'wn';   // bot ikut Duel, Duel Tim & War Nanas
const lbBotNama = L => { let i = 1; while ((L.bots || []).some(b => b.n === 'Bot ' + i)) i++; return 'Bot ' + i; };
const lbTimKecil = L => lbJmlTim(L, 0) <= lbJmlTim(L, 1) ? 0 : 1;
function lbAturTim(L) {   // pastikan tim seimbang & tidak lebih dari 3 per tim
  [0, 1].forEach(t => { let n = 12; while (lbJmlTim(L, t) > TM_MAX && n--) { const x = (L.bots || []).slice().reverse().find(y => y.tm === t) || [...L.mem.values()].reverse().find(y => y.tm === t); if (!x) break; x.tm = 1 - t; } });
}
function lbRencanaBot(n0, n1) {   // isi slot kosong: kedua tim dibuat sama besar (1 orang → 1 vs 1 lawan bot)
  const target = Math.min(TM_MAX, Math.max(n0, n1, 1)), L = [];
  [[0, n0], [1, n1]].forEach(([t, n]) => { for (let i = n; i < target; i++) L.push(t); });
  return L;
}
// ---- Layar Pilih Hero online (Rank & Main Bareng) ----
// Mode tim (Duel Tim, War Nanas, Rank): DRAFT BERGILIRAN seperti MLBB — urutan 1-2-2-1, semua pilihan (teman & lawan) terlihat, hero tidak boleh kembar.
// Bot (pilihan host / pengisi War Nanas & Rank) ikut mendapat giliran dan "memilih" seperti pemain. Mode lain: semua memilih bersamaan.
const LB_GILIRAN = 15000, LB_GILIRAN_BOT = [1600, 4200];
const HERO_GRATIS = ['pocong', 'pitung', 'erick', 'doni', 'timunmas', 'buto', 'lutung', 'saras', 'angling', 'dayang', 'nyiroro', 'siliwangi', 'ciung', 'sangkuriang', 'kiansantang', 'wiro', 'roro', 'masdim', 'blorong', 'dewisri', 'arjuna', 'rawa'];
function lbSiapBot(L) {
  (L.preBots || []).forEach(b => clearTimeout(b.t)); L.preBots = [];
  if (L.draft) clearTimeout(L.draft.t); L.draft = null;
  if (!lbTimM(L.rm)) return;
  const on = lbOn(L).filter(x => x.inR), nama = on.map(x => x.n);
  (L.bots || []).forEach(b => L.preBots.push({ i: -(++botSeq), n: b.n, h: null, tm: b.tm | 0 }));
  if (L.rm === 'wn') [0, 1].forEach(t => { while (on.filter(x => (x.tm | 0) === t).length + L.preBots.filter(b => b.tm === t).length < TM_MAX)
    L.preBots.push({ i: -(++botSeq), n: L.rank ? rkNamaBot(nama.concat(L.preBots.map(b => b.n))) : '🤖 Bot ' + (L.preBots.length + 1), h: null, tm: t }); });
  // urutan draft
  const T = [0, 1].map(t => on.filter(x => (x.tm | 0) === t).map(x => ({ k: 'm' + x.k, x, tm: t })).concat(L.preBots.filter(b => b.tm === t).map(b => ({ k: 'b' + b.i, b, tm: t }))));
  T.forEach(a => a.sort(() => Math.random() - .5));
  const F = Math.random() < .5 ? 0 : 1, pola = [F]; while (pola.length < 12) { const g = 1 - pola[pola.length - 1]; pola.push(g, g); }
  const urut = [], sisa = [T[0].slice(), T[1].slice()];
  for (const t of pola) { if (!sisa[0].length && !sisa[1].length) break; const q = sisa[t].length ? sisa[t] : sisa[1 - t]; urut.push(q.shift()); }
  urut.forEach((S, i) => { S.id = 's' + Math.random().toString(36).slice(2, 7) + i; });   // kunci acak: dari luar tidak terlihat mana pemain / bot
  L.draft = { urutan: urut, idx: -1, t: null, tEnd: 0 };
}
function lbSlot(L, k) { return L.draft && L.draft.urutan.find(s => s.k === k); }
function lbHeroDipakai(L, tm) {   // draft: semua hero terkunci (dua tim) · selain itu: satu tim saja
  const semua = !!L.draft;
  return lbOn(L).filter(x => x.inR && x.pick && (semua || (x.tm | 0) === tm)).map(x => x.h).concat((L.preBots || []).filter(b => b.h && (semua || b.tm === tm)).map(b => b.h));
}
function lbKirimPilih(L, tm, d) { if (L.draft) { const S = L.draft.urutan.find(z => z.k === d.k); if (S) d = Object.assign({}, d, { k: S.id }); } lbOn(L).forEach(x => { if (x.inR && (L.draft || !lbTimM(L.rm) || (x.tm | 0) === tm)) send(x.ws, Object.assign({ t: 'lbPilih' }, d)); }); }
function lbBotPilih(L, b) {
  if (L.state !== 'hero' || b.h) return;
  const ada = lbHeroDipakai(L, b.tm), bebas = HEROES.filter(h => !ada.includes(h));
  b.h = bebas[Math.floor(Math.random() * bebas.length)] || HEROES[0];
  lbKirimPilih(L, b.tm, { k: 'b' + b.i, h: b.h, s: '' });
}
function lbDraftLanjut(L) {
  const D = L.draft; if (!D || L.state !== 'hero') return; clearTimeout(D.t);
  D.idx++;
  const ikut = lbOn(L).filter(x => x.inR);
  if (D.idx >= D.urutan.length) {   // semua terkunci → 3 dtk lalu masuk arena
    ikut.forEach(x => send(x.ws, { t: 'lbDraft', idx: D.idx, sec: 3, selesai: 1 }));
    clearTimeout(L.heroT); L.heroT = setTimeout(() => lbLuncur(L), 3200); return;
  }
  const S = D.urutan[D.idx]; D.tEnd = Date.now() + LB_GILIRAN;
  ikut.forEach(x => send(x.ws, { t: 'lbDraft', idx: D.idx, sec: LB_GILIRAN / 1000 }));
  if (S.b) D.t = setTimeout(() => { lbBotPilih(L, S.b); lbDraftLanjut(L); }, LB_GILIRAN_BOT[0] + Math.random() * (LB_GILIRAN_BOT[1] - LB_GILIRAN_BOT[0]));
  else D.t = setTimeout(() => lbPaksaPilih(L, S.x), (lbOn(L).includes(S.x) ? LB_GILIRAN + 800 : 1500));   // pemain offline: cepat dilewati
}
function lbPaksaPilih(L, x) {   // waktu giliran habis: dipilihkan (hero yang sedang dilihat / terakhir dipakai / hero gratis)
  if (L.state !== 'hero' || x.pick) { lbDraftLanjut(L); return; }
  const ada = lbHeroDipakai(L, x.tm | 0), coba = [x.lihat, x.ws && x.ws.hero, ...HERO_GRATIS.slice().sort(() => Math.random() - .5)];
  x.h = coba.find(h => h && HEROES.includes(h) && !ada.includes(h)) || HEROES.find(h => !ada.includes(h)); x.s = x.lihat === x.h ? x.lihatS || '' : ''; x.pick = 1;
  if (x.ws) { x.ws.hero = x.h; x.ws.skin = x.s; }
  lbKirimPilih(L, x.tm | 0, { k: 'm' + x.k, h: x.h, s: x.s, otomatis: 1 });
  lbDraftLanjut(L);
}
function lbHeroMsg(L, x, sec) {
  const timM = lbTimM(L.rm), tm = timM ? x.tm | 0 : -1, ikut = lbOn(L).filter(y => y.inR);
  const slot = S => Object.assign(S.x ? { k: S.id, n: S.x.n, h: S.x.pick ? S.x.h : null, s: S.x.pick ? S.x.s || '' : '' } : { k: S.id, n: S.b.n, h: S.b.h, s: '' }, S.x === x ? { aku: 1 } : {});
  if (L.draft) {
    const D = L.draft;
    return { t: 'lbHero', m: L.rm, a: L.ra, tm, rank: L.rank ? 1 : 0, draft: 1,
      kawan: D.urutan.filter(S => S.tm === tm).map(slot), lawan: D.urutan.filter(S => S.tm !== tm).map(slot),
      urutan: D.urutan.map(S => S.id), idx: Math.max(0, D.idx), sec: D.idx >= 0 ? Math.max(1, Math.ceil((D.tEnd - Date.now()) / 1000)) : LB_GILIRAN / 1000 };
  }
  const total = ikut.length + (L.rm === 'duel' && L.duelBot ? 1 : 0);
  return { t: 'lbHero', m: L.rm, a: L.ra, sec, tm, rank: L.rank ? 1 : 0, kawan: [{ k: 'm' + x.k, n: x.n, h: null, s: '', aku: 1 }], lawan: [], nLawan: Math.max(0, total - 1) };
}
function lbHeroMulai(L) {   // dipanggil saat layar pilih hero dibuka (Main Bareng & Rank)
  if (L.draft) { clearTimeout(L.heroT); L.heroT = null; setTimeout(() => lbDraftLanjut(L), 1800); }   // jeda sebentar supaya semua HP sudah membuka layar
  else L.heroT = setTimeout(() => lbLuncur(L), LB_HERO + 500);
}
function lbLuncur(L) {
  if (L.state !== 'hero') return;
  clearTimeout(L.heroT); if (L.draft) { clearTimeout(L.draft.t); L.draft = null; }
  const ikut = lbOn(L).filter(x => x.inR);
  const pakaiBot = false, botL = lbBotBisa(L.rm) ? (L.bots || []) : [];
  if (ikut.length + (pakaiBot ? 1 : 0) + (L.rm === 'duel' && ikut.length === 1 && L.duelBot ? 1 : L.rm === 'tim' ? botL.length : L.rm === 'wn' ? 5 : 0) < 2 || !ikut.length) { lbBatal(L, 'Teman keluar sebelum mulai — tunggu teman lain lalu tekan MULAI lagi'); return; }
  ikut.forEach(x => { x.ws.hero = x.h; x.ws.skin = x.s || ''; x.main = (x.main || 0) + 1; const ra = L.rkAkun && L.rkAkun.get(x.pid); if (ra) ra.h = x.h; });   // Rank: hero dicatat untuk riwayat
  const code = newCode();
  L.state = 'main'; L.sub = code;
  if (L.rm === 'pk') {
    const host = (lbHost(L) && lbHost(L).ws && lbHost(L).inR) ? lbHost(L).ws : ikut[0].ws;
    const r = { code, quick: false, host, pl: ikut.map(x => x.ws), state: 'lobby', fin: [], a: L.ra, pub: false, t0: Date.now(), lb: L.code };
    prooms.set(code, r); r.pl.forEach(w => { w.proom = code; });
    lbKirim(L); pkRoomMsg(r); pkStart(r);
  } else {
    const exp = new Map();
    let penjaga = '';
    if (L.rm === 'umpet') {   // Petak Umpet: semua satu kelompok; penjaga = yang pertama ketemu ronde lalu, kalau tidak ada diacak
      ikut.forEach(x => exp.set(x.pid, 0));
      penjaga = ikut.some(x => x.pid === L.umNext) ? L.umNext : ikut[Math.floor(Math.random() * ikut.length)].pid; L.umNext = '';
    }
    else if (lbTimM(L.rm)) ikut.forEach(x => exp.set(x.pid, x.tm | 0));             // tim pilihan pemain sendiri
    else ikut.slice().sort(() => Math.random() - .5).forEach((x, i) => exp.set(x.pid, i % 2));   // 1 vs 1
    const heroTim = t => ikut.filter(x => exp.get(x.pid) === t).map(x => x.h).concat(bots.filter(b => b.tm === t).map(b => b.h));
    const acakH = t => { const L2 = L.rank && t != null ? HEROES.filter(h => !heroTim(t).includes(h)) : HEROES; return L2[Math.floor(Math.random() * L2.length)]; };   // Rank: hero tidak kembar dalam satu tim
    let bots = [];
    if (L.rm === 'duel' && ikut.length === 1 && L.duelBot) bots = [{ i: -(++botSeq), n: L.duelBot.n, h: acakH(), tm: 1 - exp.get(ikut[0].pid) }];   // 1 lawan bot
    if (lbTimM(L.rm) && L.preBots && L.preBots.length) { L.preBots.forEach(b => { clearTimeout(b.t); bots.push({ i: b.i, n: b.n, h: b.h || acakH(b.tm), tm: b.tm }); }); L.preBots = []; }
    else if (lbTimM(L.rm)) bots = botL.map(b => ({ i: -(++botSeq), n: b.n, h: acakH(), tm: b.tm }));
    if (L.rm === 'wn') { const ada = t => [...exp.values()].filter(v => v === t).length + bots.filter(b => b.tm === t).length;   // War Nanas selalu 3 vs 3: kotak kosong diisi bot
      [0, 1].forEach(t => { while (ada(t) < TM_MAX) bots.push({ i: -(++botSeq), n: L.rank ? rkNamaBot(ikut.map(x => x.n).concat(bots.map(b => b.n))) : '🤖 Bot ' + (bots.length + 1), h: acakH(t), tm: t }); }); }
    const n0 = [...exp.values()].filter(t => t === 0).length + bots.filter(b => b.tm === 0).length, n1 = exp.size + bots.length - n0;
    if (pakaiBot) bots = bots.concat(lbRencanaBot(n0, n1).map((tm, i) => ({ i: -(++botSeq), n: 'Bot ' + (bots.length + i + 1), h: acakH(), tm })));
    const r = { code, host: null, pl: [], bots: [], botRencana: bots, state: 'lobby', a: L.rm === 'umpet' ? UMPET_ARENA : L.rm === 'wn' ? 0 : L.ra, um: penjaga, wn: L.rm === 'wn' ? 1 : 0, kw: L.rm === 'tim' ? L.kill || 10 : L.rm === 'wn' ? 0 : LB_KW, dur: L.rm === 'tim' ? (L.dur || 5) * 60 : 0, pub: false, t0: Date.now(), ver: '3d', lb: L.code, exp, hostPid: L.hostPid, rank: L.rank ? 1 : 0, rkAkun: L.rkAkun || null, rkSudah: new Set(), partai: L.partai || null, wasit: new Set(L.rm === 'duel' ? lbOn(L).filter(x => x.wasit).map(x => x.pid) : []), tonton: [] };
    trooms.set(code, r);
    r.autoT = setTimeout(() => lbTmMulai(r, 1), r.wn ? LB_TUNGGU_WN : LB_TUNGGU_3D);
    lbKirim(L);
    ikut.forEach(x => send(x.ws, { t: 'lbGo3d', code, m: L.rm, a: L.ra, h: x.h, s: x.s || '', tm: exp.get(x.pid), kw: r.kw, lb: L.code, rank: L.rank ? 1 : 0, lv: L.rank ? L.rkLv : undefined, pulang: L.pulang ? L.pulang.get(x.pid) || '' : '' }));
    lbOn(L).filter(x => x.wasit && r.wasit.has(x.pid)).forEach(x => send(x.ws, { t: 'lbGo3d', code, m: L.rm, a: L.ra, h: x.h || 'pocong', s: '', tm: 0, kw: LB_KW, lb: L.code, wasit: 1 }));   // wasit ikut membuka arena untuk menonton
    console.log(new Date().toISOString(), 'main bareng ' + L.rm, L.code, bots.length ? '+' + bots.length + ' bot' : '', '→ room', code, ikut.map(x => x.n).join(', '));
  }
}
function lbTmMulai(r, waktuHabis) {   // semua pemain Main Bareng sudah masuk arena 3D (atau waktu tunggu habis)
  if (r.state !== 'lobby' || !r.exp || trooms.get(r.code) !== r) return;
  clearTimeout(r.autoT);
  if (!waktuHabis && ![...r.exp.keys()].every(p => r.pl.some(w => w.pid === p))) return;
  r.bots = (r.botRencana || []).slice();
  if (!r.pl.length && r.wn) console.log(new Date().toISOString(), 'war nanas', r.code, 'batal: tidak ada pemain yang masuk arena dalam', (LB_TUNGGU_WN / 1000) + ' dtk');
  if (r.pl.length + r.bots.length < 2 || !r.pl.length) { r.pl.forEach(w => send(w, { t: 'err', msg: 'Teman belum masuk arena — kembali ke lobi…', balik: 1 })); r.exp = null; lbKembali(r.lb, r.code); return; }
  if (r.um) { if (r.pl.length < 2) { r.pl.forEach(w => send(w, { t: 'err', msg: 'Teman belum masuk arena — kembali ke lobi…', balik: 1 })); r.exp = null; lbKembali(r.lb, r.code); return; } }
  else for (const t of [0, 1]) if (!tmCount(r, t)) {   // tim kosong (ada yang tidak masuk) → pindahkan 1 pemain / bot
    const w = r.pl.length > 1 && r.pl.filter(x => x.tmT !== t).length > 1 ? r.pl.filter(x => x.tmT !== t)[0] : null;
    if (w) w.tmT = t; else { const b = r.bots.find(x => x.tm !== t); if (b && tmCount(r, 1 - t) > 1) b.tm = t; else r.bots.push({ i: -(++botSeq), n: r.rank ? rkNamaBot(r.pl.map(w => w.name).concat(r.bots.map(b => b.n))) : 'Bot ' + (r.bots.length + 1), h: HEROES[Math.floor(Math.random() * HEROES.length)], tm: t }); }
  }
  if (r.wn) [0, 1].forEach(t => { while (tmCount(r, t) < TM_MAX) r.bots.push({ i: -(++botSeq), n: r.rank ? rkNamaBot(r.pl.map(w => w.name).concat(r.bots.map(b => b.n))) : '🤖 Bot ' + (r.bots.length + 1), h: HEROES[Math.floor(Math.random() * HEROES.length)], tm: t }); });   // War Nanas: yang tidak masuk diganti bot
  // yang menjalankan bot = HP paling kuat (bukan selalu host lobi), supaya HP kentang tidak terbebani
  r.host = r.pl.slice().sort((p, q) => (q.kuat || 0) - (p.kuat || 0) || (q.pid === r.hostPid) - (p.pid === r.hostPid))[0];
  tmMulaiRoom(r);
}
function lbMsg(ws, m) {
  const L = ws.lobi && lbrooms.get(ws.lobi), x = L && L.mem.get(ws.pid), host = L && ws.pid === L.hostPid;
  switch (m.t) {
    case 'lbCreate': {
      if (!ws.pid) { send(ws, { t: 'err', msg: 'Muat ulang halaman game lalu coba lagi' }); return; }
      leave(ws); const code = newCode();
      lbrooms.set(code, { code, hostPid: ws.pid, mem: new Map(), m: '', a: -1, state: 'lobby', pub: m.pub !== 0, t0: Date.now(), rm: '', ra: -1 });
      lbJoin(ws, code); return;
    }
    case 'lbJoin': lbJoin(ws, clean(m.code, 6)); return;
    case 'lbMode': if (L && host && L.state === 'lobby' && !L.rkQ && LB_MODE.includes(m.m)) { if (m.m === 'rk') L.bots = []; if (LB_AR[L.m] !== LB_AR[m.m] || (L.m === 'pk') !== (m.m === 'pk')) L.a = -1; L.m = m.m; lbAturTim(L); lbKirim(L); } return;
    case 'lbTim': {   // pemain pindah tim sendiri (Duel Tim)
      if (!L || !x || L.state !== 'lobby') return;
      const t = m.tm === 1 ? 1 : 0; if (t === x.tm) return;
      const p = lbKotakTim(L, t); if (p < 0) { send(ws, { t: 'err', msg: 'Tim itu sudah penuh (' + TM_MAX + ' pemain)' }); return; }
      x.pos = p; x.tm = t; lbKirim(L); return;
    }
    case 'lbAtur': {   // host memilih batas durasi & batas kill Duel Tim
      if (!L || !host || L.state !== 'lobby') return;
      if (LB_DUR.includes(m.dur)) L.dur = m.dur; if (LB_KILL.includes(m.kill)) L.kill = m.kill;
      lbKirim(L); return;
    }
    case 'lbBotAdd': {   // host menambah bot ke kotak kosong
      if (!L || !host || L.state !== 'lobby') return; L.bots = L.bots || [];
      if (L.m === 'rk' || L.rkQ) { send(ws, { t: 'err', msg: 'Mode Rank tidak memakai bot pilihan — kursi kosong diisi otomatis saat mencari lawan' }); return; }
      if (L.mem.size + L.bots.length >= LB_MAX) { send(ws, { t: 'err', msg: 'Lobi sudah penuh' }); return; }
      L.bots.push({ k: ++lbSeq, n: lbBotNama(L), tm: lbTimKecil(L), pos: lbKosong(L, m.p | 0) ? m.p | 0 : null }); lbKirim(L); return;
    }
    case 'lbPindah': {   // pindah ke kotak kosong (Duel: kotak atas = pemain, bawah = wasit)
      if (!L || !x || L.state !== 'lobby' || !lbKosong(L, m.p | 0)) return;
      x.pos = m.p | 0; lbKirim(L); return;
    }
    case 'lbBotDel': if (L && host && L.state === 'lobby' && L.bots) { L.bots = L.bots.filter(b => b.k !== (m.k | 0)); lbKirim(L); } return;
    case 'lbBotTim': {   // host memindah tim bot (Duel Tim)
      const b = L && host && L.state === 'lobby' && (L.bots || []).find(y => y.k === (m.k | 0)); if (!b) return;
      const p = lbKotakTim(L, 1 - b.tm); if (p < 0) { send(ws, { t: 'err', msg: 'Tim itu sudah penuh (' + TM_MAX + ' pemain)' }); return; }
      b.pos = p; b.tm = 1 - b.tm; lbKirim(L); return;
    }
    case 'lbArena': {
      if (!L || !host || L.state !== 'lobby' || !LB_AR[L.m]) return;
      const a = m.a | 0; if (a < -1 || a >= LB_AR[L.m]) return;
      L.a = a; lbKirim(L); return;
    }
    case 'lbGo': {
      if (!L || !host || L.state !== 'lobby' || L.rkQ) return;
      if (L.m === 'rk') { rkParty(L, ws); return; }
      if (!L.m) { send(ws, { t: 'err', msg: 'Pilih mode dulu: Duel, Parkur, atau Acak' }); return; }
      const on = lbOn(L);
      const nb = (L.bots || []).length;
      L.rm = L.m === 'acak' ? (on.length > 2 ? (Math.random() < .5 ? 'tim' : 'pk') : on.length === 2 && !nb ? (Math.random() < .5 ? 'duel' : 'pk') : on.length === 2 ? (Math.random() < .5 ? 'tim' : 'pk') : (Math.random() < .5 ? 'duel' : 'tim')) : L.m;
      if (L.rm !== 'wn' && on.length + (lbBotBisa(L.rm) ? nb : 0) < 2) { send(ws, { t: 'err', msg: lbBotBisa(L.m) || L.m === 'acak' ? 'Tunggu teman masuk dulu, atau tambahkan 🤖 Bot lewat tanda +' : 'Tunggu teman masuk dulu (minimal 2 pemain)' }); return; }
      L.ra = L.m !== 'acak' && L.a >= 0 && L.a < LB_AR[L.rm] ? L.a : Math.floor(Math.random() * (L.rm === 'pk' ? PK_ARENA : LB_AR[L.rm]));   // acak parkur: hanya lintasan balapan
      if (L.rm === 'pk' && L.ra === PK_ARENA) { L.rm = 'umpet'; L.ra = 0; }   // lintasan Parkur ke-7 = Petak Umpet (dimainkan di game3d)
      if (lbTimM(L.rm)) { lbPos(L); lbTimPos(L); if (L.rm === 'tim' && !(L.bots || []).some(b => b.tm !== on[0].tm) && on.length > 1 && on.every(y => y.tm === on[0].tm)) { const y = on[on.length - 1], p = lbKotakTim(L, 1 - y.tm); if (p >= 0) { y.pos = p; y.tm = 1 - y.tm; } } }   // tanpa bot: jangan semua di satu tim
      // Duel 1 vs 1 dengan >2 pemain: yang paling jarang main yang maju (bergiliran), sisanya ikut ronde berikutnya
      let maju = on; L.duelBot = null; L.mem.forEach(y => { y.wasit = false; });
      if (L.rm === 'duel') {   // kotak 0 & 1 bertanding; kalau ada yang kosong, diisi dari kotak bawah (pemain dulu, lalu bot)
        lbPos(L); const bots = L.bots || [], ikutA = [...on, ...bots].filter(y => y.pos < 2);
        const naik = [...on.filter(y => y.pos >= 2).sort((a, b) => a.pos - b.pos), ...bots.filter(y => y.pos >= 2)];
        while (ikutA.length < 2 && naik.length) { const y = naik.shift(); y.pos = lbKosong(L, 0) ? 0 : 1; ikutA.push(y); }
        if (ikutA.length < 2) { send(ws, { t: 'err', msg: 'Isi 2 kotak atas dulu: ajak teman atau tambah 🤖 Bot' }); lbKirim(L); return; }
        maju = ikutA.filter(y => !bots.includes(y)); L.duelBot = ikutA.find(y => bots.includes(y)) || null;
        if (!maju.length) { send(ws, { t: 'err', msg: 'Minimal 1 pemain di kotak atas' }); lbKirim(L); return; }
        on.forEach(y => { if (!maju.includes(y)) y.wasit = true; });   // sisanya menonton sebagai wasit
      }
      L.state = 'hero'; L.cepat = 0; L.heroEnd = Date.now() + LB_HERO;
      L.mem.forEach(y => { y.inR = maju.includes(y); y.pick = 0; });
      lbSiapBot(L); maju.forEach(y => send(y.ws, lbHeroMsg(L, y, LB_HERO / 1000)));
      lbHeroMulai(L);
      lbKirim(L); return;
    }
    case 'lbPick': {   // pilihan hero: diumumkan ke teman satu tim (lawan tidak tahu) · hero yang sudah diambil teman ditolak
      if (!L || !x || L.state !== 'hero' || !x.inR || !HEROES.includes(m.h)) return;
      if (x.pick && x.h === m.h) { x.s = clean(m.s, 20); ws.skin = x.s; lbKirimPilih(L, x.tm | 0, { k: 'm' + x.k, h: x.h, s: x.s }); return; }   // ganti skin setelah kunci
      if (x.pick) return;
      if (L.draft) { const S = L.draft.urutan[L.draft.idx]; if (!S || S.x !== x) { send(ws, { t: 'lbPickTolak', h: m.h, giliran: 1 }); return; } }   // bukan gilirannya
      if (lbTimM(L.rm) && lbHeroDipakai(L, x.tm | 0).includes(m.h)) { send(ws, { t: 'lbPickTolak', h: m.h }); return; }
      x.h = m.h; x.s = clean(m.s, 20); x.pick = 1; ws.hero = x.h; ws.skin = x.s;
      lbKirimPilih(L, x.tm | 0, { k: 'm' + x.k, h: x.h, s: x.s });
      if (L.draft) lbDraftLanjut(L); else lbCekPilih(L); return;
    }
    case 'lbLihat': {   // hero yang sedang dilihat (dipakai kalau waktu giliran habis)
      if (L && x && L.state === 'hero' && HEROES.includes(m.h)) { x.lihat = m.h; x.lihatS = clean(m.s, 20); } return;
    }
    case 'lbPub': if (L && host) { L.pub = m.pub ? true : false; lbKirim(L); } return;
    case 'lbRkBatal': if (L && x && L.rkQ) rkBatalParty(L, '✖ ' + x.n + ' membatalkan pencarian lawan'); return;
  }
}
// bersihkan anggota yang lama terputus & pindahkan host yang hilang
setInterval(() => {
  const now = Date.now();
  lbrooms.forEach(L => {
    let ubah = false;
    if (L.state !== 'main') L.mem.forEach((x, p) => { if (!x.ws && x.gone && now - x.gone > LB_GRACE) { L.mem.delete(p); ubah = true; } });
    const h = lbHost(L);
    if (L.state === 'lobby' && h && !h.ws && now - Math.max(h.gone || 0, L.backT || 0) > LB_HOST_GANTI) { const on = lbOn(L)[0]; if (on) { L.hostPid = on.pid; ubah = true; } }
    if (L.state === 'main' && !lbOn(L).length && L.sub && !trooms.has(L.sub) && !prooms.has(L.sub)) { lbKembali(L.code); ubah = true; }
    if (L.rkMain) { const RL = lbrooms.get(L.rkMain), jalan = RL && (RL.state === 'hero' || (RL.state === 'main' && [...trooms.values()].some(r => r.lb === RL.code))); if (!jalan) { rkLepasParty(L.code); ubah = true; } }   // Rank party batal / selesai
    if (ubah) lbRapikan(L);
  });
}, 3000);

// =================== RANK ONLINE (War Nanas 3 vs 3) ===================
// Pemain menekan CARI LAWAN → antre. 6 pemain → langsung main. Kurang dari 6 → setelah 27–60 detik (acak per pemain,
// tidak diberitahukan) kursi kosong diisi bot bernama seperti pemain biasa. Hasil dikirim ke Supabase (game_rank_hasil)
// memakai kunci rahasia server: menang +25 (MVP +5), kalah −20 (MVP tim kalah hanya −10), keluar di tengah = kalah.
const RANK_KUNCI = process.env.KS_RANK_KUNCI || 'GANTI-KUNCI-RANK';
const RK_TUNGGU = [27000, 60000];          // lama menunggu sebelum diisi bot (acak)
const RK_ZIGZAG = [0, 1, 1, 0, 0, 1];      // pembagian tim berdasarkan poin (terkuat → tim 0, lalu 1, 1, 0, 0, 1)
let RK = [];                               // antrean: {ws, t0, tunggu, poin}
const RK_DEPAN = ['Raka', 'Dimas', 'Bayu', 'Fajar', 'Rizky', 'Adit', 'Galih', 'Ilham', 'Yoga', 'Reza', 'Bima', 'Arya', 'Dafa', 'Farel', 'Naufal', 'Rafi', 'Zidan', 'Alif', 'Haikal', 'Kevin',
  'Putri', 'Nayla', 'Salsa', 'Aulia', 'Citra', 'Dinda', 'Keysha', 'Zahra', 'Alya', 'Nabila', 'Rara', 'Tasya', 'Asep', 'Ujang', 'Cecep', 'Dadang', 'Euis', 'Neng', 'Agus', 'Wahyu', 'Ucup', 'Komeng', 'Iqbal', 'Satria', 'Gilang'];
const RK_GAYA = [
  n => n, n => n.toLowerCase(), n => n + (10 + Math.floor(Math.random() * 90)), n => n.toLowerCase() + '_' + (Math.floor(Math.random() * 999) + 1),
  n => n + ' ' + ['Gaming', 'Pro', 'GG', 'ID', 'Sakti', 'Ganteng', 'Kece', 'Jago', 'Santuy', 'Subang', 'Bandung', 'Garut'][Math.floor(Math.random() * 12)],
  n => ['xX', 'Si', 'Kang ', 'Mang ', 'Teh ', 'Bang ', 'Mas '][Math.floor(Math.random() * 7)] + n, n => n.toUpperCase(), n => n + '.' + String(2008 + Math.floor(Math.random() * 12)).slice(2)];
function rkNamaBot(dipakai) {
  for (let k = 0; k < 30; k++) { const d = RK_DEPAN[Math.floor(Math.random() * RK_DEPAN.length)], n = RK_GAYA[Math.floor(Math.random() * RK_GAYA.length)](d).slice(0, 16); if (!dipakai.some(x => String(x).toLowerCase().includes(d.toLowerCase()))) return n; }   // nama dasar tidak boleh kembar (neng & xXNeng)
  return 'Pemain' + (100 + Math.floor(Math.random() * 900));
}
const RK_TK = [0, 100, 250, 450, 700, 1000, 1400, 1900], RK_TK_NAMA = ['Anak Bawang', 'Prajurit', 'Jagoan', 'Pendekar', 'Ksatria', 'Panglima Tempur', 'Suhu', 'Sepuh'];
const rkTk = p => RK_TK.filter(b => (p | 0) >= b).length - 1;
const RK_PARTY_MAX = 3, RK_PARTY_SELISIH = 2;   // party Rank: maks 3 orang, selisih tingkat maks 2
const rkJml = e => e.anggota.length, rkPoin = e => e.anggota.reduce((s, a) => s + a.poin, 0);
function rkHapusEntri(e) { RK = RK.filter(z => z !== e); e.anggota.forEach(a => { if (a.ws.rkQ === e) a.ws.rkQ = null; }); }
function rkKeluarAntre(ws) {
  const e = ws.rkQ; if (!e) return; ws.rkQ = null;
  const L = e.party && lbrooms.get(e.party);
  if (L && L.rkQ === e) { rkBatalParty(L, '⚠️ ' + ws.name + ' keluar — pencarian lawan dibatalkan'); return; }
  rkHapusEntri(e);
}
function rkBatalParty(L, msg) {   // party Main Bareng berhenti mencari lawan
  const e = L.rkQ; if (!e) return; L.rkQ = null; rkHapusEntri(e);
  if (msg) lbOn(L).forEach(x => send(x.ws, { t: 'err', msg }));
  lbKirim(L);
}
async function rkParty(L, ws) {   // host lobi menekan CARI LAWAN di mode Rank
  const on = lbOn(L);
  if (!on.length) return;
  if (on.length > RK_PARTY_MAX) { send(ws, { t: 'err', msg: 'Rank party maksimal ' + RK_PARTY_MAX + ' orang (satu tim) — sisanya keluar dulu atau main mode lain' }); return; }
  const belum = on.filter(x => !x.ws.akun);
  if (belum.length) { send(ws, { t: 'err', msg: '🔒 Belum masuk akun: ' + belum.map(x => x.n).join(', ') + ' — semua anggota party wajib login akun warga desa' }); return; }
  if (L.rkCek) return; L.rkCek = 1;
  const poin = await Promise.all(on.map(x => sbRpc('game_rank_akun', { p_akun: x.ws.akun }).then(j => Math.max(0, (j && j.poin) | 0))));
  L.rkCek = 0;
  if (lbrooms.get(L.code) !== L || L.state !== 'lobby' || L.rkQ || L.m !== 'rk') return;
  const on2 = lbOn(L); if (on2.length !== on.length || on.some(x => !on2.includes(x))) { send(ws, { t: 'err', msg: 'Anggota lobi berubah — tekan CARI LAWAN lagi' }); return; }
  const tk = poin.map(rkTk), lo = Math.min(...tk), hi = Math.max(...tk);
  if (hi - lo > RK_PARTY_SELISIH) { const a = on[tk.indexOf(hi)], b = on[tk.indexOf(lo)];
    send(ws, { t: 'err', msg: 'Selisih tingkat terlalu jauh: ' + a.n + ' (' + RK_TK_NAMA[hi] + ') & ' + b.n + ' (' + RK_TK_NAMA[lo] + ') — maksimal ' + RK_PARTY_SELISIH + ' tingkat' }); return; }
  const e = { anggota: on.map((x, i) => ({ ws: x.ws, poin: poin[i] })), t0: Date.now(), tunggu: RK_TUNGGU[0] + Math.random() * (RK_TUNGGU[1] - RK_TUNGGU[0]), party: L.code };
  on.forEach(x => { rkKeluarAntre(x.ws); x.ws.rkQ = e; });
  L.rkQ = e; RK.push(e); lbKirim(L); rkCek();
  console.log(new Date().toISOString(), 'rank party mencari', L.code, on.map((x, i) => x.n + '(' + poin[i] + ')').join(', '));
}
function rkLepasParty(code) {   // pertandingan Rank party selesai → lobi Main Bareng dibuka lagi
  const L = lbrooms.get(code); if (!L || !L.rkMain) return;
  L.rkMain = null; lbKembali(code);
}
function rkMsg(ws, m) {
  switch (m.t) {
    case 'rkCari': {
      if (!ws.pid) { send(ws, { t: 'rkErr', msg: 'Muat ulang halaman game lalu coba lagi' }); return; }
      if (!ws.akun) {   // akun belum selesai dicek (hello baru dikirim) → tunggu sebentar
        if (ws.sesi && (m._c | 0) < 8) { setTimeout(() => { if (ws.readyState === 1) rkMsg(ws, Object.assign({}, m, { _c: (m._c | 0) + 1 })); }, 700); return; }
        send(ws, { t: 'rkErr', msg: 'Masuk akun warga desa dulu untuk main Rank', login: 1 }); return;
      }
      leave(ws);
      RK.filter(e => e.anggota.some(a => a.ws !== ws && (a.ws.pid === ws.pid || a.ws.akun === ws.akun))).forEach(e => e.anggota.forEach(a => { if (a.ws.pid === ws.pid || a.ws.akun === ws.akun) { send(a.ws, { t: 'rkBatal' }); rkKeluarAntre(a.ws); } }));
      const e = { anggota: [{ ws, poin: Math.max(0, Math.min(99999, m.poin | 0)) }], t0: Date.now(), tunggu: RK_TUNGGU[0] + Math.random() * (RK_TUNGGU[1] - RK_TUNGGU[0]), party: '' };
      ws.rkQ = e; RK.push(e);
      send(ws, { t: 'rkAntre' });
      rkCek(); return;
    }
    case 'rkBatal': rkKeluarAntre(ws); send(ws, { t: 'rkBatal' }); return;
  }
}
function rkSusun(daftar) {   // susun 2 tim × 3 kursi dari antrean (tertua dulu); party tidak dipisah
  const tim = [[], []], n = [0, 0], p = [0, 0], pakai = [];
  for (const e of daftar) {
    const k = rkJml(e), bisa = [0, 1].filter(t => n[t] + k <= TM_MAX); if (!bisa.length) continue;
    const t = bisa.length === 1 ? bisa[0] : n[0] !== n[1] ? (n[0] < n[1] ? 0 : 1) : (p[0] <= p[1] ? 0 : 1);   // isi tim yang lebih sedikit, kalau sama: yang poinnya lebih kecil
    tim[t].push(e); n[t] += k; p[t] += rkPoin(e); pakai.push(e);
    if (n[0] === TM_MAX && n[1] === TM_MAX) break;
  }
  return { tim, pakai, penuh: n[0] === TM_MAX && n[1] === TM_MAX };
}
function rkCek() {
  RK.slice().forEach(e => { if (e.anggota.every(a => a.ws.readyState === 1 && a.ws.rkQ === e)) return;
    const L = e.party && lbrooms.get(e.party); if (L && L.rkQ === e) rkBatalParty(L, '⚠️ Ada anggota yang terputus — pencarian lawan dibatalkan'); else rkHapusEntri(e); });
  for (let k = 0; k < 20 && RK.length; k++) {
    const S = rkSusun(RK);
    if (!S.penuh && Date.now() - RK[0].t0 < RK[0].tunggu) break;   // belum penuh & belum waktunya diisi bot
    RK = RK.filter(e => !S.pakai.includes(e)); rkMulai(S.tim);
  }
}
setInterval(rkCek, 1000);
function rkMulai(tim) {
  const semua = tim[0].concat(tim[1]); semua.forEach(e => e.anggota.forEach(a => { a.ws.rkQ = null; }));
  const code = newCode(), now = Date.now(), ang = [];
  [0, 1].forEach(t => tim[t].forEach(e => e.anggota.forEach(a => ang.push({ ws: a.ws, poin: a.poin, tm: t, party: e.party, t0: e.t0 }))));
  ang.sort((a, b) => b.poin - a.poin);
  const L = { code, hostPid: ang[0].ws.pid, mem: new Map(), m: 'wn', a: 0, rm: 'wn', ra: 0, state: 'hero', pub: false, t0: now, rank: 1, bots: [], cepat: 0, heroEnd: now + LB_HERO, rkAkun: new Map(), pulang: new Map(), partai: [] };
  const rata = ang.reduce((s, a) => s + a.poin, 0) / ang.length;
  L.rkLv = rata < 250 ? 1 : rata < 1000 ? 2 : 3;   // kemampuan bot mengikuti rata-rata poin (Sedang / Susah / Pro)
  ang.forEach(a => {
    const ws = a.ws, x = { k: ++lbSeq, pid: ws.pid, ws, n: ws.name, h: ws.hero, s: ws.skin, gone: 0, inR: true, pick: 0, tm: a.tm, main: 0 };
    L.mem.set(ws.pid, x); L.rkAkun.set(ws.pid, { akun: ws.akun, n: ws.name });
    if (a.party) {   // anggota party: lobi Main Bareng-nya ditahan sampai pertandingan selesai
      const PL = lbrooms.get(a.party);
      if (PL) { if (!L.partai.includes(a.party)) L.partai.push(a.party); L.pulang.set(ws.pid, a.party); PL.rkQ = null; PL.rkMain = code; PL.state = 'main'; PL.sub = null;
        const px = PL.mem.get(ws.pid); if (px && px.ws === ws) { px.ws = null; px.gone = 0; px.inR = false; } }
    }
    ws.lobi = code;
  });
  lbrooms.set(code, L);
  lbSiapBot(L); L.mem.forEach(x => { send(x.ws, { t: 'rkKetemu' }); send(x.ws, lbHeroMsg(L, x, LB_HERO / 1000)); });
  lbHeroMulai(L);
  console.log(new Date().toISOString(), 'rank ketemu', code, [0, 1].map(t => tim[t].map(e => e.anggota.map(a => a.ws.name + '(' + a.poin + ')').join('+') + (e.party ? '[party]' : '')).join(', ')).join('  VS  '), ang.length < LB_MAX ? '+' + (LB_MAX - ang.length) + ' bot' : '');
}
function rkKirimHasil(r, hasil) {   // hasil: [{pid, akun, nama, menang, mvp}]
  if (!hasil.length) return;
  hasil.forEach(h => r.rkSudah.add(h.pid));
  const dur = r.mulaiT ? Math.round((Date.now() - r.mulaiT) / 1000) : 0;
  sbRpc('game_rank_hasil', { p_kunci: RANK_KUNCI, p_hasil: hasil.map(h => { const a = r.rkAkun && r.rkAkun.get(h.pid); return { akun: h.akun, nama: h.nama, menang: !!h.menang, mvp: !!h.mvp, afk: h.afk | 0, hero: (a && a.h) || '', durasi: dur, keluar: !!h.keluar }; }) }).then(j => {
    const L = Array.isArray(j) ? j : [];
    hasil.forEach(h => {
      const d = L.find(x => x.akun === h.akun), w = r.pl.find(x => x.pid === h.pid) || akunWs.get(h.akun);
      if (d) send(w, { t: 'rkHasil', poin: d.poin, ubah: d.ubah, menang: h.menang ? 1 : 0, mvp: h.mvp ? 1 : 0, afk: h.afk | 0 });
      else send(w, { t: 'rkHasil', gagal: 1 });
    });
    console.log(new Date().toISOString(), 'rank hasil', r.code, hasil.map(h => h.nama + (h.menang ? ' M' : ' K') + (h.mvp ? '*' : '') + (h.afk ? ' afk' + h.afk : '') + (d => d ? ' ' + d.poin + '(' + d.ubah + ')' : ' ?')(L.find(x => x.akun === h.akun))).join(', '));
  });
}
function rkKabur(r, pid) {   // keluar di tengah pertandingan Rank → kalah; dicatat di akhir (menit AFK terus berjalan, maks 25)
  const a = r.rkAkun && r.rkAkun.get(pid); if (!a || r.rkSudah.has(pid)) return;
  r.rkPergi = r.rkPergi || new Set(); r.rkPergi.add(pid);
}
// ---- AFK Rank: −1 poin tiap menit AFK, maksimal 25 ----
// AFK = didiamkan minimal 1 menit berturut-turut (kurang dari 1 menit tidak dihitung; begitu lewat 1 menit, seluruh lamanya dihitung).
// Tanda "diam": Mode Otomatis aktif (tidak menyentuh layar), tidak mengirim data (aplikasi ditinggal / layar mati), terputus, atau keluar.
const RK_AFK_MAKS = 25, RK_AFK_MIN = 60000, RK_AFK_SEPI = 15000, RK_AFK_MUAT = 120000;
function rkAfkTotal(r, pid, now) {
  const S = r.rkAfkS && r.rkAfkS.get(pid); if (!S) return 0;
  const jalan = S.sejak != null && now - S.sejak >= RK_AFK_MIN ? now - S.sejak : 0;
  return S.ms + jalan;
}
const rkAfkMenit = (r, pid) => Math.min(RK_AFK_MAKS, Math.floor(rkAfkTotal(r, pid, Date.now()) / 60000));
setInterval(() => {
  const now = Date.now();
  trooms.forEach(r => {
    if (!r.rank || r.state !== 'game' || !r.rkAkun) return;
    r.rkAfkS = r.rkAfkS || new Map();
    r.rkAkun.forEach((a, pid) => {
      if (r.rkSudah.has(pid)) return;
      const S = r.rkAfkS.get(pid) || { ms: 0, sejak: null }; r.rkAfkS.set(pid, S);
      const w = r.pl.find(x => x.pid === pid);
      let mulai = null;   // perkiraan kapan mulai diam
      if (!w) mulai = S.pergiT || (S.pergiT = now);
      else {
        S.pergiT = 0;
        if (w.afkMode) mulai = w.afkSejak || now;
        if (w.lastSt ? now - w.lastSt > RK_AFK_SEPI : now - (r.mulaiT || now) > RK_AFK_MUAT) { const t = w.lastSt || (r.mulaiT + RK_AFK_MUAT); mulai = mulai == null ? t : Math.min(mulai, t); }
      }
      if (mulai != null) { if (S.sejak == null) S.sejak = mulai; }
      else if (S.sejak != null) { if (now - S.sejak >= RK_AFK_MIN) S.ms += now - S.sejak; S.sejak = null; }   // kembali main: diam ≥ 1 menit → dihitung
    });
  });
}, 5000);
function rkTutup(r) {   // room Rank bubar tanpa hasil (semua pergi) → yang belum tercatat = kalah + menit AFK
  if (!r.rank || !r.rkAkun) return;
  const hasil = []; r.rkAkun.forEach((a, pid) => { if (!r.rkSudah.has(pid)) hasil.push({ pid, akun: a.akun, nama: a.n, menang: false, mvp: false, afk: rkAfkMenit(r, pid), keluar: true }); });
  rkKirimHasil(r, hasil);
}
function rkSelesai(r, m) {   // pertandingan Rank selesai (dikirim HP wasit): m.m = tim pemenang, m.mvp = [id MVP tim 0, id MVP tim 1]
  const menang = m.m === 0 || m.m === 1 ? m.m : -1, mvp = Array.isArray(m.mvp) ? m.mvp.map(v => v | 0) : [];
  const hasil = [];
  (r.rkAkun || new Map()).forEach((a, pid) => {
    if (r.rkSudah.has(pid)) return;
    const td = r.tunda && r.tunda.get(pid), w = r.pl.find(x => x.pid === pid) || (td && { tmT: td.tm, id: td.i, name: td.n }), tm = r.exp ? r.exp.get(pid) : w && w.tmT;   // yang sedang tersambung ulang tetap dihitung
    if (!w || (r.rkPergi && r.rkPergi.has(pid) && !r.pl.some(x => x.pid === pid))) { hasil.push({ pid, akun: a.akun, nama: a.n, menang: false, mvp: false, afk: rkAfkMenit(r, pid), keluar: true }); return; }   // keluar / tidak pernah masuk arena = kalah
    if (menang < 0) return;   // seri: poin tidak berubah
    const t = w.tmT != null ? w.tmT : tm;
    hasil.push({ pid, akun: a.akun, nama: w.name || a.n, menang: t === menang, mvp: mvp[t] === w.id, afk: rkAfkMenit(r, pid) });
  });
  rkKirimHasil(r, hasil);
  if (r.tunda) { r.tunda.forEach(T => clearTimeout(T.timer)); r.tunda.clear(); }
  r.state = 'lobby'; r.exp = null; r.pl.forEach(w => { w.tmR = 0; });
  const L = r.lb && lbrooms.get(r.lb); if (L) { clearTimeout(L.heroT); lbrooms.delete(r.lb); }
  (r.partai || []).forEach(rkLepasParty);
}

function leave(ws, notify = true) {
  queue = queue.filter(q => q !== ws);
  rkKeluarAntre(ws);
  lbLeave(ws);
  pkLeave(ws);
  tmLeave(ws);
  const r = ws.room && rooms.get(ws.room);
  ws.room = null;
  if (!r) return;
  const peer = r.host === ws ? r.guest : r.host;
  if (!peer) { rooms.delete(r.code); return; }
  // room tetap ada: pemain yang tersisa menjadi pembuat room dan menunggu lawan (kode sama, bisa diajak lagi)
  r.host = peer; r.guest = null; r.active = false; r.quick = false; if (r.pub == null) r.pub = true;
  if (notify) send(peer, { t: 'peerLeft', code: r.code });
}

function begin(r) {
  r.active = true;
  const a = r.host.arena;
  send(r.host,  { t: 'start', role: 'host',  me: r.host.hero,  opp: r.guest.hero, oppName: r.guest.name, arena: a, code: r.code });
  send(r.guest, { t: 'start', role: 'guest', me: r.guest.hero, opp: r.host.hero,  oppName: r.host.name,  arena: a, code: r.code });
  console.log(new Date().toISOString(), 'mulai', r.code, r.host.name, 'vs', r.guest.name);
}

wss.on('connection', (ws, req) => {
  ws.id = nextId++; ws.alive = true; ws.name = 'Pemain'; ws.hero = 'pocong'; ws.arena = 0;
  ws.room = null; ws.proom = null; ws.troom = null; ws.ver = ''; ws.tmT = 0; ws.tmR = 0; ws.skin = ''; ws.win = Date.now(); ws.cnt = 0;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', raw => {
    // batasi banjir pesan: maks 150 pesan / detik per pemain
    const now = Date.now();
    if (now - ws.win > 1000) { ws.win = now; ws.cnt = 0; }
    if (++ws.cnt > 150) return;
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    if (m.t.startsWith('pk')) return pkMsg(ws, m, raw);
    if (m.t.startsWith('tm')) return tmMsg(ws, m, raw);
    if (m.t.startsWith('lb')) return lbMsg(ws, m);
    if (m.t.startsWith('rk')) return rkMsg(ws, m);
    if (ws.troom && tmRelay(ws, m, raw)) return;
    const r = ws.room && rooms.get(ws.room);

    // data pertandingan diteruskan apa adanya ke lawan
    if (r && r.active) {
      if (RELAY_FROM_HOST.has(m.t) && r.host === ws) { send(r.guest, raw.toString()); return; }
      if (RELAY_FROM_GUEST.has(m.t) && r.guest === ws) { send(r.host, raw.toString()); return; }
    }
    switch (m.t) {
      case 'hello':
        ws.name = clean(m.name, 16) || 'Pemain'; ws.helo = 1;
        ws.hero = HEROES.includes(m.hero) ? m.hero : 'pocong';
        ws.arena = Math.max(0, Math.min(9, m.arena | 0));
        ws.skin = clean(m.skin, 20);
        ws.kuat = Math.max(0, Math.min(999, +m.kuat || 0));   // perkiraan kekuatan HP (RAM, inti prosesor)
        ws.ver = clean(m.v, 8);   // '' = game.html (2D), '3d' = game3d.html
        ws.wns = Math.max(0, Math.min(9, m.wns | 0));   // 1: game3d.html bisa mengikuti wasit War Nanas di server · 2: juga bot server
        ws.blv = Math.max(0, Math.min(3, m.blv == null ? 1 : m.blv | 0));   // tingkat bot pilihan pemain (Main Bareng / Rank)
        if (m.pid) ws.pid = String(m.pid).replace(/[^A-Za-z0-9]/g, '').slice(0, 24);   // pengenal HP (Main Bareng)
        send(ws, { t: 'hi', id: ws.id });
        if (m.sesi && m.sesi !== ws.sesi) {
          ws.sesi = m.sesi;
          cekAkun(m.sesi).then(a => {
            if (!a || !a.ok || !a.id || ws.readyState !== 1) return;
            if (ws.akun && akunWs.get(ws.akun) === ws) akunWs.delete(ws.akun);
            ws.akun = a.id; akunWs.set(a.id, ws); send(ws, { t: 'akun', id: a.id });
          });
        }
        break;
      case 'foto': {   // foto profil kecil untuk kotak pemain di lobi Main Bareng (data URL ≤ 9 KB)
        const f = String(m.f || '');
        ws.foto = f.length <= 9000 && /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(f) ? f : '';
        const L = ws.lobi && lbrooms.get(ws.lobi), x = L && L.mem.get(ws.pid);
        if (x && x.ws === ws && x.f !== ws.foto) { x.f = ws.foto; lbOn(L).forEach(y => send(y.ws, { t: 'lbFoto', L: [{ k: x.k, f: x.f }] })); }
        break;
      }
      case 'list': send(ws, { t: 'list', r: daftarRoom(ws.ver || '') }); break;
      case 'online': {   // status teman: online? di room mana?
        const st = {};
        (Array.isArray(m.ids) ? m.ids.slice(0, 100) : []).forEach(id => {
          const w = akunWs.get(String(id)); if (!w || w.readyState !== 1) return;
          const r = roomOf(w), sama = r && roomOf(ws) && roomOf(ws).c === r.c;
          st[id] = { n: w.name, r: r ? { m: r.m, st: r.st, pl: r.pl, max: r.max, a: r.a, c: r.pub || sama ? r.c : '' } : null };
        });
        send(ws, { t: 'online', st }); break;
      }
      case 'aktif': {    // siapa saja yang sedang membuka game (untuk ajakan acak di lobi)
        const sayaR = roomOf(ws), L = [];
        clients.forEach(w => {
          if (w === ws || w.readyState !== 1 || !w.helo || (ws.pid && w.pid === ws.pid)) return;
          const r = roomOf(w); if (r && sayaR && r.c === sayaR.c) return;
          L.push({ i: w.id, n: w.name, st: !r ? 'menu' : r.st === 'main' ? 'main' : 'lobi', v: w.ver === '3d' ? 1 : 0 });
        });
        const urut = { menu: 0, lobi: 1, main: 2 };
        send(ws, { t: 'aktif', L: L.sort((a, b) => urut[a.st] - urut[b.st]).slice(0, 30) }); break;
      }
      case 'ajakId': {   // ajak pemain mana saja (dari daftar pemain aktif)
        const r = roomOf(ws); if (!r) { send(ws, { t: 'err', msg: 'Buat atau masuk room dulu, baru ajak' }); break; }
        if (Date.now() - (ws.ajakT || 0) < 1500) break; ws.ajakT = Date.now();
        const w = [...clients].find(x => x.id === (m.ke | 0));
        if (!w || w.readyState !== 1) { send(ws, { t: 'info', msg: 'Pemain itu sudah tidak aktif' }); break; }
        send(w, { t: 'diajak', dari: ws.akun || '', n: ws.name, c: r.c, m: r.m, a: r.a, acak: 1 });
        send(ws, { t: 'info', msg: 'Ajakan terkirim ke ' + w.name }); break;
      }
      case 'ajak': {     // ajak teman ke room saya
        const r = roomOf(ws); if (!r) { send(ws, { t: 'err', msg: 'Buat atau masuk room dulu, baru ajak teman' }); break; }
        if (Date.now() - (ws.ajakT || 0) < 2000) break; ws.ajakT = Date.now();
        const w = akunWs.get(String(m.ke));
        if (!w || w.readyState !== 1) { send(ws, { t: 'info', msg: 'Teman sedang tidak membuka game' }); break; }
        send(w, { t: 'diajak', dari: ws.akun || '', n: ws.name, c: r.c, m: r.m, a: r.a });
        send(ws, { t: 'info', msg: 'Ajakan terkirim ke ' + w.name }); break;
      }
      case 'create': {
        leave(ws);
        const code = newCode();
        rooms.set(code, { code, host: ws, guest: null, active: false, pub: m.pub !== 0, t0: Date.now() });
        ws.room = code;
        send(ws, { t: 'room', code, pub: m.pub !== 0 ? 1 : 0 });
        break;
      }
      case 'join': {
        const code = clean(m.code, 6);
        if (lbrooms.has(code)) { if (ws.ver === '3d') send(ws, { t: 'err', msg: 'Kode ' + code + ' adalah lobi Main Bareng — buka dari menu Kalensari Game' }); else lbJoin(ws, code); break; }
        if (ws.ver === '3d' && prooms.has(code)) { send(ws, { t: 'err', msg: 'Kode ' + code + ' adalah room Parkur Hantu — buka dari menu Kalensari Game' }); break; }
        if (trooms.has(code) && (trooms.get(code).ver || '') !== (ws.ver || '')) { send(ws, { t: 'err', msg: 'Room Duel Tim ' + code + ' dibuat di versi game yang lain' }); break; }
        const tr = trooms.get(code);
        if (tr) {   // kode milik room Duel Tim
          if (tr.state === 'game' && tr.wn && ws.pid && ws.ver === '3d' && tmMasukLagi(ws, tr)) break;   // War Nanas: HP yang halamannya termuat ulang masuk lagi ke kursinya
          if (tr.wasit && tr.wasit.has(ws.pid) && !(tr.exp && tr.exp.has(ws.pid))) {   // wasit Main Bareng: masuk sebagai penonton
            leave(ws); tr.tonton.push(ws); ws.troom = tr.code;
            if (tr.state === 'game' && tr.mulai) send(ws, Object.assign({ t: 'tmStart', me: ws.id, tonton: 1 }, tr.mulai));
            break;
          }
          if (tr.exp && !tr.exp.has(ws.pid)) { send(ws, { t: 'err', msg: 'Room ini khusus pemain Main Bareng', hilang: 1 }); break; }
          if (tr.state !== 'lobby') { send(ws, { t: 'err', msg: 'Room ini sedang bertanding — otomatis masuk setelah selesai…', tunggu: 1 }); break; }
          if (tmCount(tr, 0) + tmCount(tr, 1) >= TM_MAX * 2) { send(ws, { t: 'err', msg: tr.bots.length ? 'Room penuh — minta pembuat room menghapus 1 bot' : 'Room sudah penuh (3 vs 3)' }); break; }
          if (tr.pl.includes(ws)) break;
          tmJoin(ws, tr); break;
        }
        const pr = prooms.get(code);
        if (pr) {   // kode milik room Parkur Hantu
          if (pr.state !== 'lobby') { send(ws, { t: 'err', msg: 'Balapan di room ini sedang berjalan — otomatis masuk setelah selesai…', tunggu: 1 }); break; }
          if (pr.pl.length >= PK_MAX) { send(ws, { t: 'err', msg: 'Room parkur sudah penuh (' + PK_MAX + ' pemain)' }); break; }
          if (pr.pl.includes(ws)) break;
          pkJoin(ws, pr); break;
        }
        const room = rooms.get(code);
        if (!room) { send(ws, { t: 'err', msg: 'Room ' + code + ' tidak ditemukan (mungkin sudah ditutup)', hilang: 1 }); break; }
        if (room.active || room.guest) { send(ws, { t: 'err', msg: 'Room ' + code + ' sudah penuh (2/2)' }); break; }
        if ((room.host.ver || '') !== (ws.ver || '')) { send(ws, { t: 'err', msg: 'Room ' + code + ' dibuat di Kalensari Game versi ' + (room.host.ver === '3d' ? '3D' : '2D') + ' — buka game versi itu untuk bergabung' }); break; }
        if (room.host === ws) { send(ws, { t: 'room', code, pub: room.pub ? 1 : 0 }); break; }
        leave(ws);
        room.guest = ws; ws.room = code;
        begin(room);
        break;
      }
      case 'quick': {
        leave(ws);
        queue = queue.filter(q => q.readyState === 1);
        const iv = queue.findIndex(q => q !== ws && (q.ver || '') === (ws.ver || ''));   // lawan acak dari versi yang sama
        const other = iv >= 0 ? queue.splice(iv, 1)[0] : null;
        if (other) {
          const code = newCode();
          const room = { code, host: other, guest: ws, active: false, quick: true, pub: true, t0: Date.now() };
          rooms.set(code, room); other.room = ws.room = code;
          begin(room);
        } else { queue.push(ws); send(ws, { t: 'wait' }); }
        break;
      }
      case 'cek': {     // game.html: room ini jenis apa? (duel/tim → buka game3d.html, parkur → main di game.html)
        const code = clean(m.code, 6), d = rooms.get(code), t = trooms.get(code), k = prooms.get(code);
        if (lbrooms.has(code)) { send(ws, { t: 'cek', code, m: 'lb', v3: 1 }); break; }
        send(ws, { t: 'cek', code, m: d ? 'duel' : t ? 'tim' : k ? 'pk' : '', v3: d ? (d.host && d.host.ver === '3d' ? 1 : 0) : t ? (t.ver === '3d' ? 1 : 0) : 0 }); break;
      }
      case 'leave': leave(ws); send(ws, { t: 'left' }); break;
      case 'ping': send(ws, { t: 'pong', c: m.c }); break;
    }
  });
  ws.on('close', () => { ws.putus = true; lbLepas(ws); leave(ws); if (ws.akun && akunWs.get(ws.akun) === ws) akunWs.delete(ws.akun); });
  ws.on('error', () => {});
});

// putuskan koneksi yang mati setiap 15 detik
setInterval(() => {
  wss.clients.forEach(ws => { if (!ws.alive) return ws.terminate(); ws.alive = false; try { ws.ping(); } catch {} });
}, 15000);

server.listen(PORT, HOST, () => console.log(`Kalensari Game Server jalan di http://${HOST}:${PORT}  (WebSocket: /ws)`));
