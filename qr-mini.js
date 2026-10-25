/* qr-mini.js – pembuat kode QR kecil tanpa library luar (mode byte, koreksi M/Q, versi 1–10).
   Dipakai panel admin kartu: QRMini.svg(teks, ukuranPx) / QRMini.matrix(teks) */
(function (g) {
  const ECC = { L: [1, [-1,7,10,15,20,26,18,20,24,30,18], [-1,1,1,1,1,1,2,2,2,2,4]],
                M: [0, [-1,10,16,26,18,24,16,18,22,22,26], [-1,1,1,1,2,2,4,4,4,5,5]],
                Q: [3, [-1,13,22,18,26,18,24,18,22,20,24], [-1,1,1,2,2,4,4,6,6,8,8]] };
  const rawMods = v => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; };
  const dataCw = (v, e) => Math.floor(rawMods(v) / 8) - ECC[e][1][v] * ECC[e][2][v];
  const mul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; };
  function rsDiv(d) { const r = new Array(d).fill(0); r[d - 1] = 1; let root = 1; for (let i = 0; i < d; i++) { for (let j = 0; j < d; j++) { r[j] = mul(r[j], root); if (j + 1 < d) r[j] ^= r[j + 1]; } root = mul(root, 2); } return r; }
  function rsRem(data, div) { const r = div.map(() => 0); for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => r[i] ^= mul(c, f)); } return r; }
  function matrix(text, ecl) {
    ecl = ecl || 'M'; const bytes = Array.from(new TextEncoder().encode(String(text)));
    let v = 1; while (v <= 10 && bytes.length > dataCw(v, ecl) - (v < 10 ? 2 : 3)) v++;
    if (v > 10) throw new Error('Teks QR terlalu panjang');
    const bits = []; const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    const cap = dataCw(v, ecl) * 8; put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
    for (let p = 0xEC; bits.length < cap; p ^= 0xEC ^ 0x11) put(p, 8);
    const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    // blok + koreksi kesalahan, lalu disisipkan
    const nb = ECC[ecl][2][v], el = ECC[ecl][1][v], raw = Math.floor(rawMods(v) / 8), nShort = nb - raw % nb, sLen = Math.floor(raw / nb), div = rsDiv(el), blocks = [];
    for (let i = 0, k = 0; i < nb; i++) { const d = data.slice(k, k + sLen - el + (i < nShort ? 0 : 1)); k += d.length; const e = rsRem(d, div); if (i < nShort) d.push(0); blocks.push(d.concat(e)); }
    const all = []; for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== sLen - el || j >= nShort) all.push(b[i]); });
    const n = v * 4 + 17, M = [...Array(n)].map(() => new Array(n).fill(false)), F = [...Array(n)].map(() => new Array(n).fill(false));
    const set = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
    for (let i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (x, y) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy; if (xx >= 0 && xx < n && yy >= 0 && yy < n) set(xx, yy, d !== 2 && d !== 4); } };
    finder(3, 3); finder(n - 4, 3); finder(3, n - 4);
    if (v > 1) { const na = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2, pos = [6]; for (let p = n - 7; pos.length < na; p -= step) pos.splice(1, 0, p);
      pos.forEach((a, i) => pos.forEach((b, j) => { if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); })); }
    const fmt = mask => { const d = ECC[ecl][0] << 3 | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); const b = (d << 10 | r) ^ 0x5412, bit = i => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8)); for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(i)); for (let i = 8; i < 15; i++) set(8, n - 15 + i, bit(i)); set(8, n - 8, true); };
    fmt(0);
    if (v >= 7) { let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); const b = v << 12 | r; for (let i = 0; i < 18; i++) { const bt = ((b >>> i) & 1) === 1, a = n - 11 + i % 3, c = Math.floor(i / 3); set(a, c, bt); set(c, a, bt); } }
    let i = 0; for (let right = n - 1; right >= 1; right -= 2) { if (right === 6) right = 5; for (let vert = 0; vert < n; vert++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? n - 1 - vert : vert; if (!F[y][x] && i < all.length * 8) { M[y][x] = ((all[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; } } }
    // pilih pola mask dengan penalti terkecil
    const masks = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const apply = m => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!F[y][x] && masks[m](x, y)) M[y][x] = !M[y][x]; };
    const penalty = () => { let p = 0, dark = 0; const line = get => { for (let a = 0; a < n; a++) { let run = 1; for (let b = 1; b <= n; b++) { if (b < n && get(a, b) === get(a, b - 1)) run++; else { if (run >= 5) p += run - 2; run = 1; } } } };
      line((a, b) => M[a][b]); line((a, b) => M[b][a]);
      for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) { const c = M[y][x]; if (c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; }
      M.forEach(r => r.forEach(c => dark += c)); p += Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10; return p; };
    let best = 0, bp = Infinity; for (let m = 0; m < 8; m++) { apply(m); fmt(m); const pn = penalty(); if (pn < bp) { bp = pn; best = m; } apply(m); }
    apply(best); fmt(best); return M;
  }
  function svg(text, px, ecl) { const M = matrix(text, ecl), n = M.length, q = 4, t = n + q * 2; let d = '';
    M.forEach((r, y) => r.forEach((c, x) => { if (c) d += `M${x + q},${y + q}h1v1h-1z`; }));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" width="${px || t * 4}" height="${px || t * 4}" shape-rendering="crispEdges"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`; }
  function canvas(text, px, ecl, tepi) { const M = matrix(text, ecl), n = M.length, q = tepi == null ? 4 : tepi, t = n + q * 2, s = Math.max(1, Math.floor((px || t * 8) / t)), c = document.createElement('canvas'); c.width = c.height = t * s; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#000'; M.forEach((r, yy) => r.forEach((d, xx) => { if (d) x.fillRect((xx + q) * s, (yy + q) * s, s, s); })); return c; }
  g.QRMini = { matrix, svg, canvas };
})(window);
