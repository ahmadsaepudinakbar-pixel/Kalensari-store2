/* Kalensari Store - serah terima pesanan (sisi pembeli)
   - Kode 4 angka dibuat saat pemesanan, disimpan di HP pembeli (kalensari_kode_st)
     dan di database dalam bentuk acak (hash) lewat rpc simpan_kode_pesanan.
   - Kurir hanya bisa menandai selesai dengan kode ini, atau dengan foto bukti.
   - Pembeli bisa menekan "Belum saya terima" bila ada masalah -> admin diberi tahu. */
(function () {
  var C = window.CLOUD_CONFIG || {};
  var BASE = String(C.supabaseUrl || "").replace(/\/$/, "");
  var LK = "kalensari_kode_st";
  function on() { return !!(C.enabled && BASE && C.supabaseAnonKey); }
  function hdr() { return { apikey: C.supabaseAnonKey, Authorization: "Bearer " + C.supabaseAnonKey, "Content-Type": "application/json" }; }
  async function cf(path, opt) {
    opt = opt || {};
    var r = await fetch(BASE + "/rest/v1/" + path, Object.assign({}, opt, { headers: Object.assign(hdr(), opt.headers || {}) }));
    var t = await r.text(); if (!r.ok) throw new Error(t || r.status);
    return t ? JSON.parse(t) : [];
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function peta() { try { var v = JSON.parse(localStorage.getItem(LK) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }

  function buatKode() { var a = new Uint32Array(1); crypto.getRandomValues(a); return String(1000 + a[0] % 9000); }
  function simpanLokal(code, kode) { var m = peta(); m[code] = kode; var ks = Object.keys(m); if (ks.length > 60) ks.slice(0, ks.length - 60).forEach(function (k) { delete m[k]; }); try { localStorage.setItem(LK, JSON.stringify(m)); } catch (e) {} }
  function kodeOf(code) { return peta()[code] || ""; }
  async function daftarkan(code, kode) {
    simpanLokal(code, kode);
    if (!on()) return false;
    try { await cf("rpc/simpan_kode_pesanan", { method: "POST", body: JSON.stringify({ p_code: code, p_kode: kode }) }); return true; } catch (e) { return false; }
  }

  // info antar & laporan untuk beberapa pesanan sekaligus
  var INFO = {};
  async function muatInfo(codes) {
    codes = (codes || []).filter(Boolean); if (!codes.length || !on()) return INFO;
    var keys = []; codes.forEach(function (c) { keys.push("antar_" + c, "laporan_" + c); });
    try {
      var rows = await cf("store_settings?select=key,value&key=in.(" + keys.map(function (k) { return '"' + k + '"'; }).join(",") + ")");
      codes.forEach(function (c) { INFO[c] = INFO[c] || {}; });
      rows.forEach(function (r) { var c = r.key.replace(/^(antar|laporan)_/, ""); INFO[c] = INFO[c] || {}; INFO[c][r.key.indexOf("antar_") === 0 ? "antar" : "laporan"] = r.value; });
    } catch (e) {}
    return INFO;
  }

  var CSS = false;
  function css() {
    if (CSS) return; CSS = true;
    var s = document.createElement("style");
    s.textContent = ".st-kode{margin:10px 0;padding:10px 12px;border-radius:14px;background:#fff6dd;border:1px dashed #d9a400;font-size:13px;color:#5b3d00}"
      + ".st-kode b{font-size:24px;letter-spacing:6px;display:block;color:#3b2416;margin:2px 0}"
      + ".st-info{margin:10px 0;padding:10px 12px;border-radius:14px;background:#f4efe9;font-size:13px;color:#4a3426}"
      + ".st-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.st-btns button{border:1px solid #e3d3c3;background:#fff;color:#5b2e1a;border-radius:12px;padding:8px 12px;font:600 13px system-ui,sans-serif;font-family:inherit;cursor:pointer}"
      + ".st-btns button.warn{border-color:#d98c1f;color:#a35a00}.st-lap{color:#a35a00;font-weight:600}"
      + ".st-ov{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px}.st-ov img{max-width:100%;max-height:80vh;border-radius:12px}"
      + ".st-ov .x{position:absolute;top:12px;right:12px;border:0;background:#fff;border-radius:999px;width:40px;height:40px;font-size:18px;cursor:pointer}";
    document.head.appendChild(s);
  }

  /* Potongan HTML untuk kartu pesanan pembeli */
  function html(o) {
    css();
    var code = o.order_code, st = o.status || "menunggu", out = "";
    if (!code) return "";
    var kode = kodeOf(code);
    if (kode && ["menunggu", "baru", "diproses", "dikirim"].indexOf(st) >= 0)
      out += '<div class="st-kode">🔑 Kode serah terima<b>' + esc(kode) + '</b>Sebutkan kode ini ke kurir <u>hanya saat pesanan sudah Anda terima</u>.</div>';
    if (st === "selesai") {
      var inf = INFO[code] || {}, a = inf.antar, lap = inf.laporan, umur = Date.now() - Date.parse(o.updated_at || o.created_at || "");
      var isi = "";
      if (a && a.cara === "foto") isi += "📷 Kurir <b>" + esc(a.nama || "") + "</b> menyelesaikan dengan foto bukti" + (a.ket ? ": " + esc(a.ket) : "") + ".";
      else if (a && a.nama) isi += "✅ Diserahkan oleh kurir <b>" + esc(a.nama) + "</b>" + (a.cara === "kode" ? " (kode serah terima cocok)." : ".");
      var tombol = "";
      if (a && a.cara === "foto") tombol += '<button type="button" data-st-foto="' + esc(code) + '">📷 Lihat foto bukti</button>';
      if (lap) isi += (isi ? "<br>" : "") + '<span class="st-lap">' + (lap.beres ? "✅ Laporan Anda sudah ditangani admin." : "⚠️ Laporan terkirim. Admin akan menghubungi Anda.") + "</span>";
      else if (!(umur > 3 * 24 * 3600 * 1000)) tombol += '<button type="button" class="warn" data-st-lapor="' + esc(code) + '">⚠️ Belum saya terima</button>';
      if (isi || tombol) out += '<div class="st-info">' + isi + (tombol ? '<div class="st-btns">' + tombol + "</div>" : "") + "</div>";
    }
    return out;
  }

  async function lihatFoto(code) {
    css();
    var ov = document.createElement("div"); ov.className = "st-ov"; ov.innerHTML = '<span style="color:#fff">Memuat foto...</span><button class="x" type="button" aria-label="Tutup">✕</button>';
    document.body.appendChild(ov); ov.onclick = function (e) { if (e.target === ov || e.target.classList.contains("x")) ov.remove(); };
    try {
      var r = await cf("store_settings?select=value&key=eq." + encodeURIComponent("foto_" + code));
      var f = r[0] && r[0].value && r[0].value.foto;
      ov.innerHTML = (f && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(f) ? '<img alt="Foto bukti antar" src="' + f + '">' : '<span style="color:#fff">Foto tidak ditemukan.</span>') + '<button class="x" type="button" aria-label="Tutup">✕</button>';
    } catch (e) { ov.firstChild.textContent = "Gagal memuat foto."; }
  }

  async function lapor(code, hp) {
    var ket = prompt("Pesanan " + code + " belum Anda terima?\nCeritakan singkat masalahnya (boleh dikosongkan):", "");
    if (ket === null) return false;
    var a = (INFO[code] || {}).antar || null;
    // lewat server (supabase-keamanan-sisa.sql): nomor pemesan dicek, data kurir diambil dari server
    var lewat = false;
    try { await cf("rpc/lapor_pesanan", { method: "POST", body: JSON.stringify({ p_kode: code, p_hp: hp || "", p_ket: String(ket).slice(0, 300) }) }); lewat = true; }
    catch (e) { var m = String(e.message || e); if (!/PGRST202|Could not find the function|^404$/.test(m)) { var j = null; try { j = JSON.parse(m); } catch (x) {} throw new Error((j && j.message) || m); } }
    if (!lewat) await cf("store_settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ key: "laporan_" + code, value: { t: Date.now(), hp: hp || "", ket: String(ket).slice(0, 300), kurir: a ? { id: a.id, nama: a.nama, wa: a.wa, cara: a.cara } : null, beres: false } }]) });
    INFO[code] = INFO[code] || {}; INFO[code].laporan = { t: Date.now(), beres: false };
    return true;
  }

  /* Pasang klik untuk tombol di dalam el. after() dipanggil setelah laporan terkirim. */
  function pasang(el, hp, after) {
    if (!el || el.__st) return; el.__st = 1;
    el.addEventListener("click", async function (e) {
      var f = e.target.closest("[data-st-foto]"), l = e.target.closest("[data-st-lapor]");
      if (f) { lihatFoto(f.getAttribute("data-st-foto")); }
      if (l) {
        l.disabled = true;
        try { if (await lapor(l.getAttribute("data-st-lapor"), typeof hp === "function" ? hp() : hp)) { alert("Laporan terkirim. Admin akan segera menghubungi Anda."); if (after) after(); } }
        catch (err) { alert("Gagal mengirim laporan: " + String(err.message || err).slice(0, 80)); }
        l.disabled = false;
      }
    });
  }

  window.KSST = { buatKode: buatKode, daftarkan: daftarkan, kodeOf: kodeOf, muatInfo: muatInfo, html: html, pasang: pasang, lihatFoto: lihatFoto };
})();
