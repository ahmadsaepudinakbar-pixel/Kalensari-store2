// Kalensari Game – server online (lobi, kode room, cari lawan acak, penerus data pertandingan)
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
const HEROES = ['pocong', 'kuntilanak'];
const RELAY_FROM_HOST = new Set(['st', 'end']);   // data pertandingan dari host → tamu
const RELAY_FROM_GUEST = new Set(['in']);         // tombol tamu → host

const rooms = new Map();   // kode → {code, host, guest, active, quick}
let queue = [];            // pemain yang menunggu lawan acak
let nextId = 1;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`Kalensari Game Server OK – online: ${wss.clients.size}, room: ${rooms.size}, antre: ${queue.length}\n`);
  } else { res.writeHead(404); res.end(); }
});
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!req.url.startsWith('/ws') || !key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  const ws = new Sock(socket); clients.add(ws); ws.on('close', () => clients.delete(ws));
  wss.emit('connection', ws, req);
});

const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(typeof o === 'string' ? o : JSON.stringify(o)); };
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);

function newCode() {
  let c;
  do { c = String(Math.floor(1000 + Math.random() * 9000)); } while (rooms.has(c));
  return c;
}

function leave(ws, notify = true) {
  queue = queue.filter(q => q !== ws);
  const r = ws.room && rooms.get(ws.room);
  ws.room = null;
  if (!r) return;
  const peer = r.host === ws ? r.guest : r.host;
  rooms.delete(r.code);
  if (peer) { peer.room = null; if (notify) send(peer, { t: 'peerLeft' }); }
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
  ws.room = null; ws.win = Date.now(); ws.cnt = 0;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', raw => {
    // batasi banjir pesan: maks 150 pesan / detik per pemain
    const now = Date.now();
    if (now - ws.win > 1000) { ws.win = now; ws.cnt = 0; }
    if (++ws.cnt > 150) return;
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
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
        send(ws, { t: 'hi', id: ws.id });
        break;
      case 'create': {
        leave(ws);
        const code = newCode();
        rooms.set(code, { code, host: ws, guest: null, active: false });
        ws.room = code;
        send(ws, { t: 'room', code });
        break;
      }
      case 'join': {
        const code = clean(m.code, 6);
        const room = rooms.get(code);
        if (!room || room.active || room.guest) { send(ws, { t: 'err', msg: 'Kode room tidak ditemukan atau sudah penuh' }); break; }
        if (room.host === ws) { send(ws, { t: 'err', msg: 'Ini room Anda sendiri' }); break; }
        leave(ws);
        room.guest = ws; ws.room = code;
        begin(room);
        break;
      }
      case 'quick': {
        leave(ws);
        queue = queue.filter(q => q.readyState === 1);
        const other = queue.shift();
        if (other && other !== ws) {
          const code = newCode();
          const room = { code, host: other, guest: ws, active: false, quick: true };
          rooms.set(code, room); other.room = ws.room = code;
          begin(room);
        } else { queue.push(ws); send(ws, { t: 'wait' }); }
        break;
      }
      case 'leave': leave(ws); send(ws, { t: 'left' }); break;
      case 'ping': send(ws, { t: 'pong', c: m.c }); break;
    }
  });
  ws.on('close', () => leave(ws));
  ws.on('error', () => {});
});

// putuskan koneksi yang mati setiap 15 detik
setInterval(() => {
  wss.clients.forEach(ws => { if (!ws.alive) return ws.terminate(); ws.alive = false; try { ws.ping(); } catch {} });
}, 15000);

server.listen(PORT, HOST, () => console.log(`Kalensari Game Server jalan di http://${HOST}:${PORT}  (WebSocket: /ws)`));
