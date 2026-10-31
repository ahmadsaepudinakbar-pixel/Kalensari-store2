// Kalensari Game – server online (lobi, kode room, cari lawan acak, penerus data pertandingan)
// Mode: Duel 1 vs 1 (2 pemain), Duel Tim custom (1-3 vs 1-3) dan Parkur Hantu (balapan, maks 6 pemain per room)
// Main Bareng: lobi mudah (pesan 'lb…'): host pilih mode Duel/Parkur/Acak + arena, tiap pemain pilih hero diam-diam, lalu server membuat room-nya sendiri
// Versi game: game.html (menu, kartu, teman, Parkur 2D) & game3d.html (semua duel 3D, kirim v:'3d' di 'hello')
// Duel 1 vs 1 & Duel Tim dimainkan di game3d.html; game.html hanya menanyakan jenis room ('cek') lalu membuka game3d.html
// Jalankan: node server.js   (port bawaan 8090, hanya mendengar di 127.0.0.1; diakses lewat Nginx wss://game.kalensari.web.id/ws)
const http = require('http');
const crypto = require('crypto');
const { EventEmitter } = require('events');

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
const HEROES = ['pocong', 'kuntilanak', 'tuyul'];   // tuyul: hero ke-3 (game3d)
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
  r.state = 'game';
  const ppl = w => ({ i: w.id, n: w.name, h: w.hero, s: w.skin || '', tm: w.tmT }), pbot = b => ({ i: b.i, n: b.n, h: b.h, s: '', tm: b.tm, bot: 1 });
  const pl = [0, 1].flatMap(t => r.pl.filter(w => w.tmT === t).map(ppl).concat(r.bots.filter(b => b.tm === t).map(pbot)));
  r.pl.forEach(w => send(w, { t: 'tmStart', pl, me: w.id, host: r.host.id, a: r.a, kw: r.kw, code: r.code }));
  console.log(new Date().toISOString(), 'duel tim mulai', r.code, r.lb ? '(main bareng ' + r.lb + ')' : '', pl.map(x => (x.tm ? 'M:' : 'B:') + x.n).join(', '));
}
function tmLeave(ws) {
  const r = ws.troom && trooms.get(ws.troom); ws.troom = null;
  if (!r) return;
  r.pl = r.pl.filter(w => w !== ws);
  if (!r.pl.length) { clearTimeout(r.autoT); trooms.delete(r.code); if (r.lb) lbKembali(r.lb, r.code); return; }
  const wasHost = r.host === ws;
  if (wasHost) r.host = r.pl[0];
  if (r.state === 'game') {
    r.pl.forEach(w => send(w, { t: 'tmLeft', i: ws.id, host: wasHost ? 1 : 0 }));
    if (wasHost) { r.state = 'lobby'; r.pl.forEach(w => { w.tmR = 0; }); tmRoomMsg(r); }   // wasit keluar → pertandingan berhenti
  } else tmRoomMsg(r);
}
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
    case 'tmOver': if (r && r.host === ws && r.state === 'game') { r.state = 'lobby'; r.pl.forEach(w => { w.tmR = 0; }); tmRoomMsg(r); if (r.lb) { r.exp = null; lbKembali(r.lb, r.code); } } return;
    case 'tmBack': if (r) tmRoomMsg(r); return;
  }
}
function tmRelay(ws, m, raw) {   // data pertandingan tim
  const r = ws.troom && trooms.get(ws.troom);
  if (!r || r.state !== 'game') return false;
  if (r.ver === '3d' && (m.t === 'st' || m.t === 'in')) { m.w = ws.id; const str = JSON.stringify(m); r.pl.forEach(w => { if (w !== ws) send(w, str); }); return true; }
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
const PK_ARENA = 2;         // jumlah lintasan parkur (0 = Jembatan Kali Angker, 1 = Dusun Malam Jumat)
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
      o.w = m.w ? 1 : 0; o.g = m.g ? 1 : 0; o.gl = m.gl ? 1 : 0; o.m = m.m ? 1 : 0; o.cp = m.cp | 0; o.a = m.a ? 1 : 0;
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
const LB_TUNGGU_3D = 30000;                // batas menunggu semua pemain masuk arena Duel 3D (ms)
const LB_KW = 10;                          // target kill Duel Main Bareng
const LB_MODE = ['duel', 'pk', 'acak'];
const LB_AR = { duel: 2, pk: PK_ARENA };   // jumlah arena: duel 3D (0 Lapangan SD, 1 Kuil Malam), parkur (lihat PK_ARENA)
const lbrooms = new Map();                 // kode → {code, hostPid, mem: Map pid→anggota, m, a, state:'lobby'|'hero'|'main', ...}
let lbSeq = 0;
const lbOn = L => [...L.mem.values()].filter(x => x.ws && x.ws.readyState === 1);
const lbHost = L => L.mem.get(L.hostPid);
function lbInfo(L) { const h = lbHost(L); return { c: L.code, m: 'lb', n: h ? h.n : 'Pemain', a: 0, pl: L.mem.size, max: LB_MAX, st: L.state === 'lobby' ? 'lobby' : 'main', pub: !!L.pub, lm: L.m || '' }; }
function lbKirim(L) {
  const pl = [...L.mem.values()].map(x => ({ k: x.k, n: x.n, on: x.ws && x.ws.readyState === 1 ? 1 : 0, h: x.pid === L.hostPid ? 1 : 0 }));
  const sisa = L.state === 'hero' ? Math.max(0, L.heroEnd - Date.now()) : 0;
  lbOn(L).forEach(x => send(x.ws, { t: 'lbRoom', code: L.code, me: x.k, host: x.pid === L.hostPid, pl, m: L.m, a: L.a, state: L.state, max: LB_MAX,
    ikut: x.inR ? 1 : 0, rm: L.state !== 'lobby' ? L.rm : '', ra: L.state !== 'lobby' ? L.ra : -1, sisa, pub: L.pub ? 1 : 0 }));
}
function lbJoin(ws, code) {
  const L = lbrooms.get(code);
  if (!L) { send(ws, { t: 'err', msg: 'Lobi ' + code + ' tidak ditemukan (mungkin sudah ditutup)', hilang: 1 }); return; }
  if (!ws.pid) { send(ws, { t: 'err', msg: 'Muat ulang halaman game lalu coba lagi' }); return; }
  let x = L.mem.get(ws.pid);
  if (!x && L.mem.size >= LB_MAX) { send(ws, { t: 'err', msg: 'Lobi sudah penuh (' + LB_MAX + ' pemain)' }); return; }
  if (ws.lobi !== code) leave(ws);
  if (!x) { x = { k: ++lbSeq, pid: ws.pid, ws: null, n: ws.name, h: ws.hero, s: ws.skin, gone: 0, inR: false, pick: 0 }; L.mem.set(ws.pid, x); }
  if (x.ws && x.ws !== ws) { x.ws.lobi = null; }          // HP yang sama membuka tab baru
  x.ws = ws; x.gone = 0; x.n = ws.name; ws.lobi = code;
  if (!x.pick) { x.h = ws.hero; x.s = ws.skin; }
  if (!lbHost(L) || !lbHost(L).ws) { const h = lbHost(L); if (!h) L.hostPid = ws.pid; }
  lbKirim(L);
  if (L.state === 'hero' && x.inR && !x.pick) send(ws, { t: 'lbHero', m: L.rm, a: L.ra, sec: Math.ceil((L.heroEnd - Date.now()) / 1000) });
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
  const ikut = lbOn(L).filter(x => x.inR);
  if (ikut.length && ikut.every(x => x.pick) && !L.cepat) { L.cepat = 1; clearTimeout(L.heroT); L.heroT = setTimeout(() => lbLuncur(L), 900); }
}
function lbKembali(code, sub) {   // pertandingan selesai → kembali ke lobi
  const L = lbrooms.get(code); if (!L || L.state !== 'main' || (sub && L.sub !== sub)) return;
  L.state = 'lobby'; L.sub = null; L.backT = Date.now();
  L.mem.forEach(x => { x.inR = false; x.pick = 0; if (!x.ws) x.gone = Date.now(); });
  lbKirim(L);
}
function lbBatal(L, msg) {
  L.state = 'lobby'; L.sub = null; L.mem.forEach(x => { x.inR = false; x.pick = 0; });
  lbOn(L).forEach(x => send(x.ws, { t: 'err', msg })); lbKirim(L);
}
function lbLuncur(L) {
  if (L.state !== 'hero') return;
  clearTimeout(L.heroT);
  const ikut = lbOn(L).filter(x => x.inR);
  if (ikut.length < 2) { lbBatal(L, 'Teman keluar sebelum mulai — tunggu teman lain lalu tekan MULAI lagi'); return; }
  ikut.forEach(x => { x.ws.hero = x.h; x.ws.skin = x.s || ''; });
  const code = newCode();
  L.state = 'main'; L.sub = code;
  if (L.rm === 'pk') {
    const host = (lbHost(L) && lbHost(L).ws && lbHost(L).inR) ? lbHost(L).ws : ikut[0].ws;
    const r = { code, quick: false, host, pl: ikut.map(x => x.ws), state: 'lobby', fin: [], a: L.ra, pub: false, t0: Date.now(), lb: L.code };
    prooms.set(code, r); r.pl.forEach(w => { w.proom = code; });
    lbKirim(L); pkRoomMsg(r); pkStart(r);
  } else {
    const acak = ikut.slice().sort(() => Math.random() - .5), exp = new Map();
    acak.forEach((x, i) => exp.set(x.pid, i % 2));   // 2 → 1v1, 3 → 2v1, 4 → 2v2, 5 → 3v2, 6 → 3v3
    const r = { code, host: null, pl: [], bots: [], state: 'lobby', a: L.ra, kw: LB_KW, pub: false, t0: Date.now(), ver: '3d', lb: L.code, exp, hostPid: L.hostPid };
    trooms.set(code, r);
    r.autoT = setTimeout(() => lbTmMulai(r, 1), LB_TUNGGU_3D);
    lbKirim(L);
    ikut.forEach(x => send(x.ws, { t: 'lbGo3d', code, a: L.ra, h: x.h, s: x.s || '', tm: exp.get(x.pid), kw: LB_KW, lb: L.code }));
    console.log(new Date().toISOString(), 'main bareng duel', L.code, '→ room', code, ikut.map(x => x.n).join(', '));
  }
}
function lbTmMulai(r, waktuHabis) {   // semua pemain Main Bareng sudah masuk arena 3D (atau waktu tunggu habis)
  if (r.state !== 'lobby' || !r.exp || trooms.get(r.code) !== r) return;
  clearTimeout(r.autoT);
  if (!waktuHabis && ![...r.exp.keys()].every(p => r.pl.some(w => w.pid === p))) return;
  if (r.pl.length < 2) { r.pl.forEach(w => send(w, { t: 'err', msg: 'Teman belum masuk arena — kembali ke lobi…', balik: 1 })); r.exp = null; lbKembali(r.lb, r.code); return; }
  for (const t of [0, 1]) if (!r.pl.some(w => w.tmT === t)) { const pindah = r.pl.filter(w => w.tmT !== t)[0]; pindah.tmT = t; }   // tim kosong → pindahkan 1 pemain
  r.host = r.pl.find(w => w.pid === r.hostPid) || r.pl[0];
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
    case 'lbMode': if (L && host && L.state === 'lobby' && LB_MODE.includes(m.m)) { L.m = m.m; L.a = -1; lbKirim(L); } return;
    case 'lbArena': {
      if (!L || !host || L.state !== 'lobby' || !LB_AR[L.m]) return;
      const a = m.a | 0; if (a < -1 || a >= LB_AR[L.m]) return;
      L.a = a; lbKirim(L); return;
    }
    case 'lbGo': {
      if (!L || !host || L.state !== 'lobby') return;
      if (!L.m) { send(ws, { t: 'err', msg: 'Pilih mode dulu: Duel, Parkur, atau Acak' }); return; }
      const on = lbOn(L);
      if (on.length < 2) { send(ws, { t: 'err', msg: 'Tunggu teman masuk dulu (minimal 2 pemain)' }); return; }
      L.rm = L.m === 'acak' ? (Math.random() < .5 ? 'duel' : 'pk') : L.m;
      L.ra = L.m !== 'acak' && L.a >= 0 ? L.a : Math.floor(Math.random() * LB_AR[L.rm]);
      L.state = 'hero'; L.cepat = 0; L.heroEnd = Date.now() + LB_HERO;
      L.mem.forEach(y => { y.inR = !!(y.ws && y.ws.readyState === 1); y.pick = 0; });
      on.forEach(y => send(y.ws, { t: 'lbHero', m: L.rm, a: L.ra, sec: LB_HERO / 1000 }));
      L.heroT = setTimeout(() => lbLuncur(L), LB_HERO + 500);
      lbKirim(L); return;
    }
    case 'lbPick': {   // pilihan hero hanya disimpan server, tidak dikirim ke pemain lain
      if (!L || !x || L.state !== 'hero' || !x.inR || !HEROES.includes(m.h)) return;
      x.h = m.h; x.s = clean(m.s, 20); x.pick = 1; ws.hero = x.h; ws.skin = x.s;
      lbCekPilih(L); return;
    }
    case 'lbPub': if (L && host) { L.pub = m.pub ? true : false; lbKirim(L); } return;
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
    if (ubah) lbRapikan(L);
  });
}, 3000);

function leave(ws, notify = true) {
  queue = queue.filter(q => q !== ws);
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
    if (ws.troom && tmRelay(ws, m, raw)) return;
    const r = ws.room && rooms.get(ws.room);

    // data pertandingan diteruskan apa adanya ke lawan
    if (r && r.active) {
      if (RELAY_FROM_HOST.has(m.t) && r.host === ws) { send(r.guest, raw.toString()); return; }
      if (RELAY_FROM_GUEST.has(m.t) && r.guest === ws) { send(r.host, raw.toString()); return; }
    }
    switch (m.t) {
      case 'hello':
        ws.name = clean(m.name, 16) || 'Pemain';
        ws.hero = HEROES.includes(m.hero) ? m.hero : 'pocong';
        ws.arena = Math.max(0, Math.min(9, m.arena | 0));
        ws.skin = clean(m.skin, 20);
        ws.ver = clean(m.v, 8);   // '' = game.html (2D), '3d' = game3d.html
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
  ws.on('close', () => { lbLepas(ws); leave(ws); if (ws.akun && akunWs.get(ws.akun) === ws) akunWs.delete(ws.akun); });
  ws.on('error', () => {});
});

// putuskan koneksi yang mati setiap 15 detik
setInterval(() => {
  wss.clients.forEach(ws => { if (!ws.alive) return ws.terminate(); ws.alive = false; try { ws.ping(); } catch {} });
}, 15000);

server.listen(PORT, HOST, () => console.log(`Kalensari Game Server jalan di http://${HOST}:${PORT}  (WebSocket: /ws)`));
