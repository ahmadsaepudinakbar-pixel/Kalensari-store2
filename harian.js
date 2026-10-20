/* Kalensari Store • PROGRAM HARIAN (supaya pembeli rajin membuka aplikasi)
   Dipakai di index.html (toko) dan dashboard-pembeli.html.
     KSHarian.tombolKabar()           -> ikon 📰 + angka kabar baru di header toko (sebelah kanan ☰), membuka panel Kabar Desa
     KSHarian.kabar(el, {maks})       -> kotak "📰 Kabar Desa" (store_settings 'kabar_desa', ditulis admin & penulis kabar)
     KSHarian.penulis(el, {onUbah})   -> kartu "✍️ Tulis Kabar Desa" di dashboard pembeli (hanya untuk akun penulis kabar;
                                         supabase-kabar-penulis.sql: kabar_saya, kabar_tulis, kabar_hapus)
     KSHarian.promo(el)               -> banner promo ongkir jam tertentu (cashback ke saldo voucher)
     KSHarian.menuBaru(el, {diToko})  -> kabar menu baru dari toko favorit (toko yang diikuti + toko produk favorit)
     KSHarian.absen(el, {ringkas, onHadiah}) -> kartu absen harian beruntun (butuh akun pembeli)
     KSHarian.tombolIkuti(kunciToko)  -> tombol "🔔 Ikuti toko" untuk bar toko di halaman produk
     KSHarian.siap()                  -> dipanggil script.js setelah produk dari database dimuat (halaman toko)
   Server: supabase-betah-harian.sql (absen_harian, promo_ongkir_info, cashback_saya). */
(function () {
  "use strict";
  var C = function () { return window.CLOUD_CONFIG || {}; };
  var on = function () { var c = C(); return !!(c.enabled && c.supabaseUrl && c.supabaseAnonKey); };
  var base = function () { return String(C().supabaseUrl || "").replace(/\/$/, ""); };
  var hdr = function () { var k = C().supabaseAnonKey; return { apikey: k, Authorization: "Bearer " + k, "Content-Type": "application/json" }; };
  async function rest(p) {
    var r = await fetch(base() + "/rest/v1/" + p, { headers: hdr() });
    if (!r.ok) throw new Error((await r.text()) || r.status);
    return r.json();
  }
  async function rpc(fn, body) {
    var r = await fetch(base() + "/rest/v1/rpc/" + fn, { method: "POST", headers: hdr(), body: JSON.stringify(body || {}) });
    var t = await r.text(), j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
    if (!r.ok) {
      var m = String((j && (j.message || j.hint)) || t || r.status), er = new Error(m.replace(/^SESI:\s*/, ""));
      er.tidakAda = r.status === 404 || /PGRST202|Could not find the function/i.test(m); er.sesiHabis = /Sesi berakhir/i.test(m); throw er;
    }
    return j;
  }
  var sesi = function () {
    try { if (window.KSPesanan && KSPesanan.sesi) { var s = KSPesanan.sesi("pembeli"); if (s) return s; } } catch (e) {}
    try { return localStorage.getItem("kalensari_sesi_pembeli") || ""; } catch (e) { return ""; }
  };
  var LS = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
  var LSset = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var rp = function (n) { return "Rp" + Number(n || 0).toLocaleString("id-ID"); };
  var say = function (t) { if (typeof window.toast === "function") return window.toast(t); if (typeof window.showToast === "function") return window.showToast(t); };
  var hariIni = function () { return new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); };   // tanggal WIB
  var jam = function (s) { var m = String(s || "").match(/^(\d{1,2}):(\d{2})$/); return m ? ("0" + m[1]).slice(-2) + ":" + m[2] : ""; };
  var jamTampil = function (s) { return jam(s).replace(":", "."); };
  var sembunyi = function (el) { if (el) { el.innerHTML = ""; el.hidden = true; } };

  /* ---------- gaya (sekali) ---------- */
  var CSS = false;
  function css() {
    if (CSS) return; CSS = true;
    var st = document.createElement("style");
    st.textContent = [
      ".hr-wrap{display:grid;gap:12px;margin:0 0 14px}.hr-wrap:empty,.hr-wrap:not(:has(>:not([hidden]))){display:none}",
      ".hr-card{background:#fff;border:1px solid #ead9c6;border-radius:20px;padding:14px 16px;color:#3a1f10;box-shadow:0 4px 14px rgba(91,44,18,.07);font-family:inherit}",
      ".hr-h{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:17px;color:#5b2c12}.hr-h small{margin-left:auto;font-size:12px;font-weight:600;color:#8a7466}",
      /* kabar desa */
      ".hr-kb[hidden]{display:none!important}.hr-kb{display:block;padding:10px 0;border-top:1px dashed #ead9c6;cursor:pointer}.hr-kb:first-of-type{border-top:0;padding-top:2px}",
      ".hr-kb-r{display:flex;gap:12px;align-items:flex-start}",
      ".hr-kb-ik{flex:none;width:42px;height:42px;border-radius:12px;background:#f5e8d8;display:grid;place-items:center;font-size:22px}",
      ".hr-kb.pn .hr-kb-ik{background:#ffe3c2}.hr-kb-t{flex:1;min-width:0}.hr-kb-t b{font-size:15px;line-height:1.3}",
      ".hr-kb-t em{font-style:normal;font-size:10.5px;font-weight:800;background:#e53935;color:#fff;border-radius:999px;padding:1px 7px;margin-left:6px;vertical-align:2px}",
      ".hr-kb-t .pin{background:#b8460b}",
      ".hr-kb-t p{margin:3px 0 4px;font-size:13.5px;color:#5c4638;line-height:1.45;white-space:pre-line;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".hr-kb.buka .hr-kb-t p{display:block;-webkit-line-clamp:unset}.hr-kb-t small{font-size:12px;color:#8a7466}.hr-kb-t small a{color:#7b3f1d;font-weight:700}",
      ".hr-kb img.hr-kb-f{display:none;width:100%;max-width:100%;height:auto;max-height:420px;object-fit:contain;background:#f5e8d8;border-radius:14px;margin:0 0 12px}.hr-kb.buka img.hr-kb-f[src]{display:block}",
      ".hr-kb img.hr-kb-thumb{display:block;flex:none;width:56px;height:56px;max-width:none;border-radius:12px;object-fit:cover;background:#f5e8d8}.hr-kb.buka img.hr-kb-thumb{display:none}",
      /* ikon kabar di header + panel */
      ".kabar-btn{position:relative;flex:none;background:none;border:0;font-size:22px;line-height:1;cursor:pointer;padding:4px 6px;margin:0;color:inherit}",
      ".nav.ada-kabar{gap:6px}.nav.ada-kabar .brand{white-space:nowrap;margin-right:auto;margin-left:10px}.nav.ada-kabar .cart-btn,.nav.ada-kabar .order-btn{white-space:nowrap;flex:none}",
      "@media(max-width:420px){.nav.ada-kabar{gap:2px}.nav.ada-kabar .brand{font-size:15px;letter-spacing:0;margin-left:8px}.nav.ada-kabar>button{font-size:19px;padding-left:3px;padding-right:3px}.nav.ada-kabar .kabar-btn b{right:-6px}}",
      "@media(max-width:350px){.nav.ada-kabar .brand{font-size:13px}.nav.ada-kabar>button{font-size:17px}}",
      ".kabar-btn b{position:absolute;top:-3px;right:-5px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#e53935;color:#fff;font-size:11px;font-weight:800;line-height:18px;text-align:center;box-shadow:0 0 0 2px #fff}",
      ".kabar-btn b[hidden]{display:none}",
      ".hr-pn{align-items:end!important;padding:0!important;place-items:end center!important}",
      ".hr-pn>div{max-width:560px!important;width:100%!important;max-height:88vh;display:flex;flex-direction:column;padding:0!important;border-radius:24px 24px 0 0!important;text-align:left!important;overflow:hidden}",
      ".hr-pn-h{display:flex;align-items:center;gap:8px;padding:16px 18px 10px;border-bottom:1px solid #f0e3d6}.hr-pn-h h3{margin:0!important;font-size:19px;flex:1}",
      ".hr-pn-h button{width:auto!important;background:#f5e8d8!important;color:#5b2c12!important;border-radius:999px!important;padding:6px 12px!important;font-size:18px!important}",
      ".hr-pn-b{overflow:auto;padding:6px 18px 22px;-webkit-overflow-scrolling:touch}.hr-pn-b .hr-card{border:0;box-shadow:none;padding:0;background:none}",
      ".hr-pn-kosong{text-align:center;color:#8a7466;padding:30px 10px;font-size:14px}",
      ".hr-kb-btn{display:inline-block;margin:6px 0 4px;padding:7px 14px;border-radius:999px;background:#7b3f1d;color:#fff!important;font-weight:800;font-size:13px;text-decoration:none}",
      ".hr-kb-t small i{font-style:normal;color:#7b3f1d;font-weight:700}",
      /* penulis kabar */
      ".hr-tl .hr-h small{font-weight:700}.hr-tl>p{margin:0 0 10px;font-size:13px;color:#5c4638}",
      ".hr-tl-row{display:flex;gap:8px;align-items:center;padding:8px 0;border-top:1px dashed #ead9c6;font-size:13.5px}.hr-tl-row span{flex:1;min-width:0}",
      ".hr-tl-row small{display:block;color:#8a7466;font-size:12px}.hr-tl-row button{flex:none;border:1px solid #e3d2c0;background:#fffaf2;border-radius:10px;padding:6px 9px;font-size:14px;cursor:pointer}",
      ".hr-tl-baru{width:100%;border:0;border-radius:999px;padding:11px;font:inherit;font-weight:800;font-size:15px;color:#fff;background:#7b3f1d;cursor:pointer;margin-top:4px}",
      ".hr-fm{max-height:92vh;overflow:auto;text-align:left!important;max-width:420px!important}.hr-fm h3{margin:0 0 10px!important}",
      ".hr-fm label{display:block;margin:10px 0 0;font-size:12.5px;font-weight:700;color:#7a5a46}",
      ".hr-fm input,.hr-fm textarea{display:block;width:100%;box-sizing:border-box;margin-top:4px;border:1px solid #e3d2c0;border-radius:12px;padding:10px 12px;font:inherit;font-size:15px;color:#3a1f10;background:#fffdf9}",
      ".hr-fm input[hidden]{display:none!important}",
      ".hr-fm .ik{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.hr-fm .ik button{width:auto;padding:5px 9px;font-size:20px;background:#f5e8d8;color:inherit;border-radius:10px}.hr-fm .ik button.on{outline:2px solid #7b3f1d}",
      ".hr-fm .ft{display:flex;gap:10px;align-items:center;margin-top:6px}.hr-fm .ft img{width:72px;height:72px;object-fit:cover;border-radius:12px;background:#f5e8d8}",
      ".hr-fm .ft label,.hr-fm .ft button{display:inline-block;width:auto;margin:0;padding:8px 12px;border-radius:10px;font-size:13px;font-weight:700;background:#f5e8d8;color:#5b2c12;cursor:pointer}",
      ".hr-fm .aks{display:flex;gap:8px;margin-top:16px}.hr-fm .aks button{flex:1}.hr-fm .aks .bt{background:#efe4d8;color:#5b2c12}",
      ".hr-fm small.nt{display:block;margin-top:4px;font-size:12px;color:#8a7466;font-weight:400}",
      ".hr-semua{display:block;width:100%;margin-top:8px;border:1px solid #e3d2c0;background:#fffaf2;color:#7b3f1d;border-radius:999px;padding:9px;font:inherit;font-weight:700;font-size:14px;cursor:pointer}",
      /* promo */
      ".hr-promo{display:flex;gap:12px;align-items:center;background:linear-gradient(120deg,#fff4d6,#ffe1c4);border:1.5px solid #f2b866;border-radius:20px;padding:13px 14px;color:#5a2d0c}",
      ".hr-promo>i{font-style:normal;font-size:30px;flex:none}.hr-promo b{display:block;font-size:15.5px}.hr-promo span{display:block;font-size:13px;margin-top:2px}",
      ".hr-promo small{display:block;font-size:12px;opacity:.8;margin-top:3px}.hr-promo .live{display:inline-block;background:#e53935;color:#fff;font-size:10.5px;font-weight:800;border-radius:999px;padding:1px 7px;margin-left:6px;vertical-align:2px;animation:hrKedip 1.4s infinite}",
      ".hr-promo.habis{background:#f4efe9;border-color:#e3d6c8;color:#6b5546}",
      "@keyframes hrKedip{50%{opacity:.45}}",
      /* menu baru */
      ".hr-mb{display:flex;gap:12px;align-items:center;background:#f0faf3;border:1.5px solid #bfe3cc;border-radius:20px;padding:12px 12px 12px 14px;color:#14502c}",
      ".hr-mb>i{font-style:normal;font-size:28px;flex:none}.hr-mb div{flex:1;min-width:0}.hr-mb b{display:block;font-size:15px}.hr-mb span{display:block;font-size:13px;color:#2c6b44;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".hr-mb button{flex:none;border:0;border-radius:999px;padding:9px 13px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;background:#228b4e;color:#fff}",
      ".hr-mb .x{background:none;color:#2c6b44;padding:6px 8px;font-size:18px}",
      /* absen (minimalis) */
      ".hr-ab{background:#fff;color:#3a1f10;border:1px solid #ecdcc8;border-radius:18px;padding:12px 14px;box-shadow:0 4px 14px rgba(91,44,18,.07)}",
      ".hr-ab-r{display:flex;align-items:center;gap:10px}.hr-ab-t{flex:1;min-width:0}",
      ".hr-ab-t b{display:block;font-size:14.5px;line-height:1.25;color:#5b2c12}.hr-ab-t b small{margin-left:6px;font-size:11.5px;font-weight:600;color:#a88b74}",
      ".hr-ab-t span{display:block;margin-top:2px;font-size:12px;line-height:1.35;color:#8a6b55}",
      ".hr-seg{display:flex;align-items:center;gap:5px;margin-top:10px}.hr-seg i{flex:1;height:6px;border-radius:99px;background:#efe3d4}",
      ".hr-seg i.on{background:linear-gradient(90deg,#f7c64a,#f2a51f)}",
      ".hr-seg i.hd{flex:none;height:auto;width:auto;background:none;font-style:normal;font-size:15px;line-height:1;filter:grayscale(1) opacity(.45)}.hr-seg i.hd.on{filter:none}",
      ".hr-ab button{flex:none;border:0;border-radius:999px;padding:8px 16px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;background:#7b3f1d;color:#fff}",
      ".hr-ab button:disabled{background:#f3eadf;color:#8a6b55;cursor:default}",
      ".hr-ab.ringkas{display:flex;align-items:center;gap:10px;padding:10px 12px}.hr-ab.ringkas>i{font-style:normal;font-size:22px}.hr-ab.ringkas div{flex:1;min-width:0}",
      ".hr-ab.ringkas b{display:block;font-size:14px;color:#5b2c12}.hr-ab.ringkas span{display:block;font-size:12px;color:#8a6b55}",
      ".hr-ikuti{border:1px solid #228b4e!important;color:#228b4e!important;background:#fff!important;margin-left:auto}.hr-ikuti.on{background:#228b4e!important;color:#fff!important}",
      ".hr-ov{position:fixed;inset:0;z-index:9500;background:rgba(40,20,8,.55);display:grid;place-items:center;padding:20px}",
      ".hr-ov>div{background:#fff;border-radius:24px;max-width:340px;width:100%;padding:24px 20px 18px;text-align:center;color:#3a1f10;box-shadow:0 20px 40px rgba(0,0,0,.25)}",
      ".hr-ov .big{font-size:52px;line-height:1}.hr-ov h3{margin:10px 0 2px;font-size:19px;color:#5b2c12}.hr-ov .rp{font-size:30px;font-weight:800;color:#228b4e;margin:4px 0 8px}",
      ".hr-ov p{margin:0 0 14px;font-size:14px;color:#5c4638}.hr-ov button{width:100%;border:0;border-radius:999px;padding:12px;font:inherit;font-weight:800;font-size:15px;color:#fff;background:#7b3f1d;cursor:pointer}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* ---------- 📰 KABAR DESA ---------- */
  var amanLink = function (u) { u = String(u || "").trim(); return /^(https?:\/\/|[a-z0-9][\w\-./]*(\.html)?([?#][^\s"'<>]*)?$)/i.test(u) && !/^javascript:/i.test(u) ? u : ""; };
  var tglTampil = function (t) { try { return new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short" }); } catch (e) { return ""; } };
  async function kabar(el, o) {
    o = o || {}; if (!el) return 0; css();
    if (!on()) return sembunyi(el), 0;
    var list = [];
    try { var r = await rest("store_settings?select=value&key=eq.kabar_desa"); list = r[0] && Array.isArray(r[0].value) ? r[0].value : []; }
    catch (e) { return sembunyi(el), 0; }
    var h = hariIni();
    list = list.filter(function (k) { return k && k.judul && k.tampil !== false && (!k.sampai || k.sampai >= h); })
      .sort(function (a, b) { return (b.penting ? 1 : 0) - (a.penting ? 1 : 0) || (Number(b.t) || 0) - (Number(a.t) || 0); });
    if (!list.length) {
      if (o.panel) { el.hidden = false; el.innerHTML = '<p class="hr-pn-kosong">Belum ada kabar desa saat ini.</p>'; return 0; }
      return sembunyi(el), 0;
    }
    // pertama kali dibuka di HP ini: hanya kabar 3 hari terakhir yang diberi tanda "Baru"
    var lihat = Number(LS("kalensari_kabar_dilihat", 0)) || (Date.now() - 3 * 864e5), maks = o.maks || 3, nBaru = 0;
    // **tebal**  *miring*  (seperti yang biasa diketik di WhatsApp / catatan)
    var gaya = function (t) { return esc(t).replace(/\*\*([^*\n][^*]*?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<i>$2</i>"); };
    var item = function (k, i) {
      var baru = (Number(k.t) || 0) > lihat; if (baru) nBaru++;
      var link = amanLink(k.link);
      return '<article class="hr-kb' + (k.penting ? " pn" : "") + (o.buka ? " buka" : "") + '"' + (i >= maks ? " hidden" : "") + ' data-kb="' + esc(k.id) + '">'
        + (k.foto ? '<img class="hr-kb-f" alt="" loading="lazy" data-foto="' + esc(k.id) + '">' : "")
        + '<div class="hr-kb-r"><div class="hr-kb-ik">' + esc(k.ikon || "📢") + '</div><div class="hr-kb-t"><b>' + esc(k.judul) + '</b>'
        + (k.penting ? '<em class="pin">Penting</em>' : baru ? "<em>Baru</em>" : "")
        + "<p>" + gaya(k.isi || "") + "</p>"
        + (link ? '<a class="hr-kb-btn" href="' + esc(link) + '"' + (/^https?:/i.test(link) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(k.tombol || "Selengkapnya") + " ›</a><br>" : "")
        + "<small>" + esc(tglTampil(k.t)) + (k.oleh ? " • oleh <i>" + esc(k.oleh) + "</i>" : "") + (k.sampai ? " • sampai " + esc(tglTampil(k.sampai)) : "") + "</small></div>"
        + (k.foto ? '<img class="hr-kb-thumb" alt="" data-foto="' + esc(k.id) + '">' : "") + "</div></article>";
    };
    el.hidden = false;
    el.innerHTML = '<section class="hr-card">' + (o.panel ? "" : '<h3 class="hr-h">📰 Kabar Desa<small>' + list.length + " kabar</small></h3>")
      + list.map(item).join("")
      + (list.length > maks ? '<button type="button" class="hr-semua">Lihat semua kabar (' + list.length + ")</button>" : "") + "</section>";
    el.dataset.kbMaks = maks;
    el.querySelectorAll(".hr-kb").forEach(function (a) { a.addEventListener("click", function (e) { if (!e.target.closest("a")) a.classList.toggle("buka"); }); });
    var bs = el.querySelector(".hr-semua");
    if (bs) bs.onclick = function () { el.querySelectorAll(".hr-kb[hidden]").forEach(function (a) { a.hidden = false; }); bs.remove(); };
    // foto disimpan terpisah (store_settings 'foto_kabar_<id>') supaya daftar kabar tetap ringan
    var adaFoto = list.filter(function (k) { return k.foto; }).map(function (k) { return '"foto_kabar_' + String(k.id).replace(/[^\w-]/g, "") + '"'; });
    if (adaFoto.length) rest("store_settings?select=key,value&key=in.(" + encodeURIComponent(adaFoto.join(",")) + ")").then(function (rows) {
      (rows || []).forEach(function (x) {
        var id = x.key.slice("foto_kabar_".length), f = x.value && x.value.foto;
        if (f && /^(data:image\/|https:\/\/)/.test(f)) el.querySelectorAll('[data-foto="' + id + '"]').forEach(function (im) { im.src = f; });
      });
    }).catch(function () {});
    LSset("kalensari_kabar_dilihat", Math.max.apply(null, [lihat].concat(list.map(function (k) { return Number(k.t) || 0; }))));
    hitungKabar();
    return nBaru;
  }

  /* ---------- 📰 ikon Kabar Desa di header (sebelah kiri tulisan KALENSARI) + angka kabar baru ---------- */
  async function hitungKabar() {
    var b = document.getElementById("kabarBtn"); if (!b || !on()) return;
    var list = [];
    try { var r = await rest("store_settings?select=value&key=eq.kabar_desa"); list = r[0] && Array.isArray(r[0].value) ? r[0].value : []; } catch (e) { return; }
    var h = hariIni(), lihat = Number(LS("kalensari_kabar_dilihat", 0)) || (Date.now() - 3 * 864e5);
    var aktif = list.filter(function (k) { return k && k.judul && k.tampil !== false && (!k.sampai || k.sampai >= h); });
    var n = aktif.filter(function (k) { return (Number(k.t) || 0) > lihat; }).length, bd = b.querySelector("b");
    bd.textContent = n > 9 ? "9+" : String(n); bd.hidden = !n;
    b.setAttribute("aria-label", n ? "Kabar Desa, " + n + " kabar baru" : "Kabar Desa");
  }
  function bukaPanelKabar() {
    css();
    var ov = document.createElement("div"); ov.className = "hr-ov hr-pn";
    ov.innerHTML = '<div role="dialog" aria-label="Kabar Desa"><div class="hr-pn-h"><h3>📰 Kabar Desa</h3><button type="button" aria-label="Tutup">✕</button></div><div class="hr-pn-b"><p class="hr-pn-kosong">Memuat kabar…</p></div></div>';
    document.body.appendChild(ov);
    var tutup = function () { ov.remove(); document.removeEventListener("keydown", esc_); };
    var esc_ = function (e) { if (e.key === "Escape") tutup(); };
    ov.querySelector(".hr-pn-h button").onclick = tutup;
    ov.addEventListener("click", function (e) { if (e.target === ov) tutup(); });
    document.addEventListener("keydown", esc_);
    kabar(ov.querySelector(".hr-pn-b"), { maks: 99, buka: true, panel: true });
  }
  function tombolKabar() {
    if (document.getElementById("kabarBtn")) return hitungKabar();
    var menu = document.getElementById("menuBtn"); if (!menu || !menu.parentNode) return;
    css();
    var b = document.createElement("button");
    b.type = "button"; b.id = "kabarBtn"; b.className = "kabar-btn"; b.title = "Kabar Desa";
    b.innerHTML = '📰<b hidden></b>';
    b.onclick = bukaPanelKabar;
    menu.parentNode.insertBefore(b, menu.nextSibling);
    menu.parentNode.classList.add("ada-kabar");
    hitungKabar();
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") hitungKabar(); });
    setInterval(function () { if (document.visibilityState === "visible") hitungKabar(); }, 5 * 60000);
  }

  /* ---------- ✍️ PENULIS KABAR (perangkat desa / akun pilihan admin) ---------- */
  var KB_IKON = ["📢", "📰", "🎉", "🕌", "💚", "🤲", "⚠️", "🌾", "🏥", "🎓", "⚽", "💧", "🚧"];
  var tglIso = function (d) { return new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10); };
  function kecilkanFoto(f) {
    return new Promise(function (ok, no) {
      var r = new FileReader(); r.onerror = no;
      r.onload = function () {
        var im = new Image(); im.onerror = no;
        im.onload = function () {
          var k = Math.min(1, 1000 / Math.max(im.width, im.height)), c = document.createElement("canvas");
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
          ok(c.toDataURL("image/jpeg", 0.8));
        };
        im.src = r.result;
      };
      r.readAsDataURL(f);
    });
  }
  async function penulis(el, o) {
    o = o || {}; if (!el) return; css();
    if (!on() || !sesi()) return sembunyi(el);
    var d; try { d = await rpc("kabar_saya", { p_sesi: sesi() }); } catch (e) { return sembunyi(el); }   // SQL belum dipasang / sesi habis
    if (!d || !d.penulis) return sembunyi(el);
    var hari = Number(d.hari) || 7, list = Array.isArray(d.kabar) ? d.kabar : [], h = hariIni();
    el.hidden = false;
    el.innerHTML = '<section class="hr-card hr-tl"><h3 class="hr-h">✍️ Tulis Kabar Desa<small>' + esc(d.ket || "Penulis kabar") + "</small></h3>"
      + "<p>Kabar Anda langsung tampil untuk semua warga di halaman toko dan dashboard, dan hilang otomatis setelah " + hari + " hari.</p>"
      + list.map(function (k) {
          var habis = k.sampai && k.sampai < h;
          return '<div class="hr-tl-row"><span><b>' + esc(k.ikon || "📢") + " " + esc(k.judul) + "</b><small>" + (habis ? "Sudah tidak tayang" : "Tayang sampai " + esc(tglTampil(k.sampai))) + "</small></span>"
            + '<button type="button" data-ubah="' + esc(k.id) + '" aria-label="Ubah">✎</button><button type="button" data-hapus="' + esc(k.id) + '" aria-label="Hapus">🗑</button></div>';
        }).join("")
      + '<button type="button" class="hr-tl-baru">📢 Tulis kabar baru</button></section>';
    var segar = function () { penulis(el, o); if (typeof o.onUbah === "function") o.onUbah(); };
    el.querySelector(".hr-tl-baru").onclick = function () { formKabar({}, hari, segar); };
    el.querySelectorAll("[data-ubah]").forEach(function (b) {
      b.onclick = function () { var k = list.find(function (x) { return x.id === b.dataset.ubah; }); if (k) formKabar(k, hari, segar); };
    });
    el.querySelectorAll("[data-hapus]").forEach(function (b) {
      b.onclick = async function () {
        var k = list.find(function (x) { return x.id === b.dataset.hapus; }); if (!k || !confirm('Hapus kabar "' + k.judul + '"?')) return;
        b.disabled = true;
        try { await rpc("kabar_hapus", { p_sesi: sesi(), p_id: k.id }); say("Kabar dihapus"); segar(); }
        catch (e) { b.disabled = false; say(e.message || "Gagal menghapus"); }
      };
    });
  }
  function formKabar(k, hari, selesai) {
    var maks = tglIso(new Date(Date.now() + hari * 864e5)), min = hariIni(), foto = null;   // foto: null = tetap, "hapus", atau data:image
    var ov = document.createElement("div"); ov.className = "hr-ov";
    ov.innerHTML = '<div class="hr-fm"><h3>' + (k.id ? "✎ Ubah kabar" : "📢 Tulis kabar baru") + "</h3>"
      + '<label>Ikon</label><div class="ik">' + KB_IKON.map(function (i) { return '<button type="button" data-ik="' + i + '"' + ((k.ikon || "📢") === i ? ' class="on"' : "") + ">" + i + "</button>"; }).join("") + "</div>"
      + '<label>Judul<input id="hfJudul" maxlength="80" placeholder="mis. Kerja bakti Minggu pagi" value="' + esc(k.judul || "") + '"></label>'
      + '<label>Isi kabar<textarea id="hfIsi" rows="5" maxlength="1500" placeholder="Tulis kabar untuk warga…">' + esc(k.isi || "") + "</textarea></label>"
      + '<label>Foto (opsional)</label><div class="ft"><img id="hfPrev" alt=""' + (k.foto ? "" : ' style="display:none"') + '><label>📷 Pilih foto<input type="file" accept="image/*" hidden id="hfFoto"></label>'
      + (k.foto ? '<button type="button" id="hfHapusFoto">Hapus foto</button>' : "") + "</div>"
      + '<label>Tautan tombol (opsional)<input id="hfLink" maxlength="300" placeholder="mis. https://wa.me/62812… atau santunan.html" value="' + esc(k.link || "") + '"></label>'
      + '<label>Tulisan di tombol<input id="hfTombol" maxlength="30" placeholder="mis. Daftar sekarang" value="' + esc(k.tombol || "") + '"><small class="nt">Tombol hanya muncul bila tautan diisi. Kosong = "Selengkapnya".</small></label>'
      + '<label>Tampil sampai<input type="date" id="hfSampai" min="' + min + '" max="' + maks + '" value="' + esc(k.sampai && k.sampai <= maks ? k.sampai : maks) + '"><small class="nt">Paling lama ' + hari + " hari. Setelah itu kabar hilang otomatis.</small></label>"
      + '<div class="aks"><button type="button" class="bt" id="hfBatal">Batal</button><button type="button" id="hfKirim">' + (k.id ? "💾 Simpan" : "📢 Terbitkan") + "</button></div></div>";
    document.body.appendChild(ov);
    var $f = function (id) { return ov.querySelector("#" + id); }, ikon = k.ikon || "📢";
    if (k.foto) rest("store_settings?select=value&key=eq." + encodeURIComponent("foto_kabar_" + k.id)).then(function (r) { var f = r[0] && r[0].value && r[0].value.foto; if (f && foto === null) $f("hfPrev").src = f; }).catch(function () {});
    ov.querySelectorAll("[data-ik]").forEach(function (b) { b.onclick = function () { ov.querySelectorAll("[data-ik]").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); ikon = b.dataset.ik; }; });
    $f("hfFoto").onchange = async function () {
      var f = this.files && this.files[0]; this.value = ""; if (!f) return;
      try { foto = await kecilkanFoto(f); $f("hfPrev").src = foto; $f("hfPrev").style.display = ""; } catch (e) { say("Foto tidak bisa dibaca"); }
    };
    if ($f("hfHapusFoto")) $f("hfHapusFoto").onclick = function () { foto = "hapus"; $f("hfPrev").style.display = "none"; this.remove(); };
    var tutup = function () { ov.remove(); };
    $f("hfBatal").onclick = tutup;
    ov.addEventListener("click", function (e) { if (e.target === ov) tutup(); });
    $f("hfKirim").onclick = async function () {
      var b = this, judul = $f("hfJudul").value.trim();
      if (!judul) return say("Judul wajib diisi");
      b.disabled = true; b.textContent = "⏳ Menyimpan...";
      try {
        await rpc("kabar_tulis", { p_sesi: sesi(), p_foto: foto, p_kabar: { id: k.id || null, ikon: ikon, judul: judul, isi: $f("hfIsi").value.trim(),
          link: amanLink($f("hfLink").value), tombol: $f("hfTombol").value.trim(), sampai: $f("hfSampai").value || "" } });
        tutup(); say(k.id ? "Kabar disimpan" : "📢 Kabar diterbitkan"); selesai();
      } catch (e) { b.disabled = false; b.textContent = k.id ? "💾 Simpan" : "📢 Terbitkan"; say(e.message || "Gagal menyimpan"); }
    };
  }

  /* ---------- 🎁 PROMO ONGKIR (cashback) ---------- */
  async function promo(el) {
    if (!el) return; css();
    if (!on()) return sembunyi(el);
    var p; try { p = await rpc("promo_ongkir_info"); } catch (e) { return sembunyi(el); }
    if (!p || !p.aktif || !p.hari_ini) return sembunyi(el);
    var now = jam(p.sekarang), mulai = jam(p.mulai), selesai = jam(p.selesai);
    if (now >= selesai) return sembunyi(el);                                   // sudah lewat untuk hari ini
    var nilai = (Number(p.persen) >= 100 ? "Ongkir kembali 100%" : "Ongkir kembali " + p.persen + "%") + (Number(p.maks) > 0 ? " (maks " + rp(p.maks) + ")" : "");
    var habis = p.berlangsung && p.sisa === 0;
    var sub = habis ? "Kuota hari ini sudah habis. Coba lagi besok ya!"
      : p.berlangsung ? "Berlaku sekarang sampai jam " + jamTampil(selesai) + (p.sisa != null ? " • sisa " + p.sisa + " pembeli" : "")
      : "Hari ini jam " + jamTampil(mulai) + "–" + jamTampil(selesai);
    el.hidden = false;
    el.innerHTML = '<section class="hr-promo' + (habis ? " habis" : "") + '"><i>' + (habis ? "⌛" : "🛵") + "</i><div><b>" + esc(nilai) + (p.berlangsung && !habis ? '<em class="live">BERLANGSUNG</em>' : "")
      + "</b><span>" + esc(sub) + "</span><small>Bayar ongkir seperti biasa. Setelah pesanan selesai, ongkirnya kembali jadi saldo voucher. 1× per hari per akun.</small></div></section>";
    // muat ulang otomatis saat promo dimulai / berakhir
    clearTimeout(el._hrT); el._hrT = setTimeout(function () { promo(el); }, 60000);
  }

  /* ---------- 🆕 MENU BARU DARI TOKO FAVORIT ---------- */
  var IKUTI = "kalensari_toko_ikuti", DILIHAT = "kalensari_menu_dilihat";
  var kunci = function (n) { return String(n || "").trim().toLowerCase(); };
  var tokoDari = function (p) { return String((p && p.seller) || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); };
  var tampil = function (p) { return p && p.status === "Show"; };
  function diikuti() { var l = LS(IKUTI, []); return Array.isArray(l) ? l.map(kunci).filter(Boolean) : []; }
  async function ambilProduk() {
    try { if (typeof products !== "undefined" && Array.isArray(products) && products.length) return products; } catch (e) {}   // halaman toko
    if (!on()) return [];
    try { return await rest("products?select=id,name,seller,status&limit=3000"); } catch (e) { return []; }
  }
  function tokoFavorit(prods) {
    var s = new Set(diikuti()), fav = LS("kalensari_favorit", []);
    if (Array.isArray(fav) && fav.length) {
      var f = new Set(fav.map(Number));
      prods.forEach(function (p) { if (f.has(Number(p.id))) tokoDari(p).forEach(function (n) { s.add(kunci(n)); }); });
    }
    return s;
  }
  function tandaiDilihat(k, prods) {
    var seen = LS(DILIHAT, {}); if (!seen || typeof seen !== "object" || Array.isArray(seen)) seen = {};
    seen[k] = prods.filter(function (p) { return tokoDari(p).some(function (n) { return kunci(n) === k; }); }).map(function (p) { return String(p.id); });
    LSset(DILIHAT, seen);
  }
  async function menuBaru(el, o) {
    o = o || {}; if (!el) return; css();
    await sinkronIkuti();
    var prods = await ambilProduk(); if (!prods.length) return sembunyi(el);
    var fav = tokoFavorit(prods); if (!fav.size) return sembunyi(el);
    var seen = LS(DILIHAT, {}); if (!seen || typeof seen !== "object" || Array.isArray(seen)) seen = {};
    var ubah = false, baru = [];
    fav.forEach(function (k) {
      var milik = prods.filter(function (p) { return tokoDari(p).some(function (n) { return kunci(n) === k; }); });
      if (!milik.length) return;
      if (!Array.isArray(seen[k])) { seen[k] = milik.map(function (p) { return String(p.id); }); ubah = true; return; }   // pertama kali: jadi patokan
      var lama = new Set(seen[k]), n = milik.filter(function (p) { return tampil(p) && !lama.has(String(p.id)); });
      if (n.length) baru.push({ k: k, nama: tokoDari(n[0]).find(function (x) { return kunci(x) === k; }) || k, items: n });
    });
    if (ubah) LSset(DILIHAT, seen);
    if (!baru.length) return sembunyi(el);
    el.hidden = false;
    el.innerHTML = baru.slice(0, 3).map(function (b) {
      var nm = b.items.map(function (p) { return p.name; }), teks = nm.slice(0, 2).join(", ") + (nm.length > 2 ? " +" + (nm.length - 2) + " lagi" : "");
      return '<section class="hr-mb"><i>🆕</i><div><b>Menu baru di ' + esc(b.nama) + "</b><span>" + esc(teks) + '</span></div><button type="button" data-mb-lihat="' + esc(b.k) + '" data-nama="' + esc(b.nama) + '">Lihat</button><button type="button" class="x" data-mb-tutup="' + esc(b.k) + '" aria-label="Tutup">×</button></section>';
    }).join("");
    el.querySelectorAll("[data-mb-lihat]").forEach(function (x) { x.onclick = function () {
      var k = x.dataset.mbLihat; tandaiDilihat(k, prods);
      if (o.diToko && typeof window.setSeller === "function") { window.setSeller(k); menuBaru(el, o); }
      else location.href = "index.html?toko=" + encodeURIComponent(x.dataset.nama || k);
    }; });
    el.querySelectorAll("[data-mb-tutup]").forEach(function (x) { x.onclick = function () { tandaiDilihat(x.dataset.mbTutup, prods); menuBaru(el, o); }; });
  }
  // Daftar ikuti juga disimpan di server (supabase-ikuti-toko.sql) supaya kirim-notif bisa mengabari lewat HP.
  // Pertama kali di HP ini: daftar lokal & server digabung. Sesudahnya server yang jadi patokan.
  var waSaya = function () { var v = LS("kalensari_pembeli_login", null); return v && v.wa ? String(v.wa) : ""; };
  async function simpanIkuti(l) { if (!on() || !sesi()) return false; try { await rpc("ikuti_toko", { p_sesi: sesi(), p_toko: l }); return true; } catch (e) { return false; } }
  async function sinkronIkuti() {
    if (!on() || !sesi()) return;
    try {
      var srv = await rpc("ikuti_toko", { p_sesi: sesi(), p_toko: null }); srv = Array.isArray(srv) ? srv.map(kunci) : [];
      var tanda = "kalensari_ikuti_sinkron_" + waSaya();
      if (!LS(tanda, false)) {
        var gab = Array.from(new Set(srv.concat(diikuti())));
        if (gab.length !== srv.length) await rpc("ikuti_toko", { p_sesi: sesi(), p_toko: gab });
        LSset(IKUTI, gab); LSset(tanda, true);
      } else LSset(IKUTI, srv);
    } catch (e) { /* fitur server belum aktif: tetap pakai daftar di HP */ }
  }
  function tombolIkuti(k) {
    css(); k = kunci(k); if (!k) return "";
    var ya = diikuti().indexOf(k) >= 0;
    return '<button type="button" class="hr-ikuti' + (ya ? " on" : "") + '" data-ikuti="' + esc(k) + '">' + (ya ? "🔔 Diikuti" : "🔔 Ikuti toko") + "</button>";
  }
  document.addEventListener("click", async function (e) {
    var b = e.target.closest && e.target.closest("[data-ikuti]"); if (!b) return;
    var k = b.dataset.ikuti, l = diikuti(), ya = l.indexOf(k) >= 0;
    l = ya ? l.filter(function (x) { return x !== k; }) : l.concat([k]); LSset(IKUTI, l);
    if (!ya) tandaiDilihat(k, await ambilProduk());   // menu yang sudah ada tidak dianggap baru
    var keServer = await simpanIkuti(l), izin = typeof Notification !== "undefined" && Notification.permission === "granted";
    say(ya ? "Berhenti mengikuti toko"
      : !keServer ? "🔔 Toko diikuti. Masuk akun pembeli agar dikabari lewat notifikasi HP saat ada menu baru."
      : izin ? "🔔 Toko diikuti. Anda dapat notifikasi HP saat ada menu baru."
      : "🔔 Toko diikuti. Aktifkan notifikasi di Dashboard > Akun agar dikabari lewat HP.");
    if (typeof window.renderSellerBar === "function") window.renderSellerBar(); else b.outerHTML = tombolIkuti(k);
  });

  /* ---------- ✅ ABSEN HARIAN ---------- */
  function rayakan(jml, n) {
    css();
    var ov = document.createElement("div"); ov.className = "hr-ov";
    ov.innerHTML = '<div role="dialog" aria-modal="true"><div class="big">🎉</div><h3>Hebat, ' + n + ' hari berturut-turut!</h3><div class="rp">+' + rp(jml) + '</div><p>Hadiah absen sudah masuk ke <b>saldo voucher</b> dan bisa langsung dipakai belanja.</p><button type="button">Mantap!</button></div>';
    ov.querySelector("button").onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
    try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (e) {}
  }
  async function absen(el, o) {
    o = o || {}; if (!el) return; css();
    if (!on() || !sesi()) return sembunyi(el);
    var s; try { s = await rpc("absen_harian", { p_sesi: sesi(), p_klaim: false }); } catch (e) { return sembunyi(el); }
    if (!s || !s.aktif) return sembunyi(el);
    if (o.ringkas && s.sudah) return sembunyi(el);                           // di toko: hilang setelah absen
    gambarAbsen(el, s, o);
  }
  function gambarAbsen(el, s, o) {
    var n = Number(s.hari) || 7, sik = Number(s.siklus) || 0, sisa = n - sik;
    var info = s.sudah
      ? (sik === n ? "Hadiah cair hari ini. Hitungan mulai lagi besok." : "Besok lagi" + (s.hadiah > 0 ? ", " + sisa + " hari lagi dapat " + rp(s.hadiah) : "") + ".")
      : (s.hadiah > 0 ? n + " hari berturut-turut dapat " + rp(s.hadiah) + "." : "Absen setiap hari, jangan sampai bolong.") + (sik > 0 ? " Sudah " + sik + " hari." : "");
    el.hidden = false;
    if (o.ringkas) {
      el.innerHTML = '<section class="hr-card hr-ab ringkas"><i>✅</i><div><b>Absen harian</b><span>' + esc(sik > 0 ? "Hari ke-" + (sik + 1) + " dari " + n + (s.hadiah > 0 ? ", hadiah " + rp(s.hadiah) : "") : (s.hadiah > 0 ? n + " hari berturut-turut dapat " + rp(s.hadiah) : "Absen tiap hari")) + '</span></div><button type="button">Absen</button></section>';
    } else {
      var dots = ""; for (var i = 1; i <= n; i++) dots += i === n ? '<i class="hd' + (i <= sik ? " on" : "") + '">🎁</i>' : '<i class="' + (i <= sik ? "on" : "") + '"></i>';
      el.innerHTML = '<section class="hr-card hr-ab"><div class="hr-ab-r"><div class="hr-ab-t"><b>Absen harian<small>' + (Number(s.total) || 0) + ' hari total</small></b><span>' + esc(info) + '</span></div><button type="button"' + (s.sudah ? " disabled" : "") + ">" + (s.sudah ? "✓ Sudah" : "Absen") + '</button></div><div class="hr-seg" aria-label="Absen ' + sik + " dari " + n + ' hari">' + dots + "</div></section>";
    }
    var b = el.querySelector("button");
    if (b && !s.sudah) b.onclick = async function () {
      b.disabled = true; b.textContent = "⏳";
      try {
        var r = await rpc("absen_harian", { p_sesi: sesi(), p_klaim: true });
        if (r && r.dapat > 0) { rayakan(r.dapat, r.hari); if (typeof o.onHadiah === "function") o.onHadiah(r); }
        else say("✅ Absen hari ke-" + (r && r.siklus) + " tercatat. Sampai besok!");
        if (o.ringkas) sembunyi(el); else gambarAbsen(el, r, o);
      } catch (e) { b.disabled = false; b.textContent = "Absen"; say(e.sesiHabis ? "Sesi berakhir. Silakan masuk lagi." : (e.tidakAda ? "Fitur absen belum aktif" : (e.message || "Gagal absen"))); }
    };
  }

  /* ---------- halaman toko ---------- */
  async function siap() {
    var w = document.getElementById("ksHarian"); if (!w) return;
    css(); w.classList.add("hr-wrap");
    if (!w.children.length) w.innerHTML = '<div id="hrAbsen" hidden></div><div id="hrPromo" hidden></div><div id="hrMenu" hidden></div>';
    absen(document.getElementById("hrAbsen"), { ringkas: true });
    promo(document.getElementById("hrPromo"));
    menuBaru(document.getElementById("hrMenu"), { diToko: true });
    tombolKabar();   // Kabar Desa: ikon 📰 + angka di header, dibuka sebagai panel
  }

  window.KSHarian = { kabar: kabar, bukaKabar: bukaPanelKabar, tombolKabar: tombolKabar, penulis: penulis, promo: promo, menuBaru: menuBaru, absen: absen, tombolIkuti: tombolIkuti, siap: siap, rpc: rpc, sesi: sesi };
})();
