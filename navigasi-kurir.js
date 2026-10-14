/* =====================================================================
   Kalensari Store • Navigasi kurir DI DALAM APLIKASI (peta gratis)
   - Peta OpenStreetMap / Satelit (Esri), rute jalan dari OSRM (tanpa kunci API, gratis).
   - Posisi kurir dari GPS HP, rute dihitung ulang otomatis, layar dijaga tetap menyala.
   - Bisa beberapa titik berurutan (mis. Toko A -> Toko B -> Pembeli).
   - Pilihan peta disimpan di HP kurir (localStorage "ks_kurir_peta"):
       "dalam"  = Peta Kalensari di dalam aplikasi (BAWAAN)
       "google" = buka aplikasi Google Maps
   Pemakaian:
     KSNav.buka({judul:"KS-0610-ABC", stops:[{nama, e:"🏪", lat, lng, ket, tel}, ...]})
     KSNav.mode() / KSNav.setMode("dalam"|"google")
     KSNav.urlGoogle(stops)  -> link Google Maps (rute lengkap)
   ===================================================================== */
(function () {
  var KEY = "ks_kurir_peta";
  function mode() { try { return localStorage.getItem(KEY) === "google" ? "google" : "dalam"; } catch (e) { return "dalam"; } }
  function setMode(m) { try { localStorage.setItem(KEY, m === "google" ? "google" : "dalam"); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ok(p) { return p && Number.isFinite(+p.lat) && Number.isFinite(+p.lng) && !(+p.lat === 0 && +p.lng === 0); }
  function urlGoogle(stops) {
    stops = (stops || []).filter(ok); if (!stops.length) return "";
    var last = stops[stops.length - 1], wp = stops.slice(0, -1).map(function (s) { return s.lat + "," + s.lng; }).join("|");
    return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(last.lat + "," + last.lng)
      + (wp ? "&waypoints=" + encodeURIComponent(wp) : "") + "&travelmode=driving&dir_action=navigate";
  }
  function jarakM(a, b) {
    var R = 6371000, r = function (x) { return x * Math.PI / 180; }, dLa = r(b.lat - a.lat), dLn = r(b.lng - a.lng);
    var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLn / 2) * Math.sin(dLn / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  // jarak tempuh di header: selalu dalam km, 1 angka di belakang koma (0,1 km … 2,5 km … 1 km)
  function kmSingkat(m) { var v = Math.max(0.1, Math.round(m / 100) / 10); return String(v).replace(".", ",") + " km"; }
  function km(m) { return m < 1000 ? Math.round(m / 10) * 10 + " m" : (m / 1000).toFixed(1).replace(".", ",") + " km"; }

  // ---- muat Leaflet sekali saja ----
  var siap = null;
  function muatLeaflet() {
    if (window.L && L.map) return Promise.resolve();
    if (siap) return siap;
    siap = new Promise(function (res, rej) {
      var c = document.createElement("link"); c.rel = "stylesheet"; c.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(c);
      var j = document.createElement("script"); j.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      j.onload = res; j.onerror = function () { siap = null; rej(new Error("Peta gagal dimuat")); }; document.head.appendChild(j);
    });
    return siap;
  }

  var CSS = false;
  function css() {
    if (CSS) return; CSS = true;
    var s = document.createElement("style");
    s.textContent = ""
      + ".ksn-ov{position:fixed;inset:0;z-index:9500;background:#eef0ea;font-family:inherit;color:#1f2a22}"
      + ".ksn-map{position:absolute;inset:0}"
      + ".ksn-top{position:absolute;z-index:620;top:max(10px,env(safe-area-inset-top));left:10px;right:10px;display:flex;gap:10px;align-items:center;background:#fff;border-radius:22px;padding:8px 10px;box-shadow:0 6px 18px rgba(20,40,25,.16)}"
      + ".ksn-x{border:0;background:#fdf1d8;color:#3a2a14;border-radius:16px;width:50px;height:50px;font-size:24px;cursor:pointer;flex:none}"
      + ".ksn-tt{flex:1;min-width:0}.ksn-tt b{display:block;font-size:19px;color:#4a1f0a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ksn-tot{font-style:normal;font-size:15px;font-weight:800;color:#14502c;background:#e9f6ed;border-radius:999px;padding:2px 9px;margin-left:8px;vertical-align:2px}"
      + ".ksn-gps{display:inline-flex;align-items:center;gap:6px;margin-top:3px;font-size:12.5px;font-weight:700;padding:3px 10px;border-radius:99px;background:#fdeacc;color:#7a3d00}"
      + ".ksn-gps i{width:8px;height:8px;border-radius:50%;background:#e0912a}.ksn-gps.ok{background:#e3f4e8;color:#14502c}.ksn-gps.ok i{background:#22a35a}"
      + ".ksn-gm{flex:none;width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#25a35a,#167a3f);display:grid;place-items:center;box-shadow:0 4px 10px rgba(22,122,63,.3)}"
      + ".ksn-more{flex:none;border:0;background:none;width:30px;height:44px;font-size:24px;font-weight:900;color:#2a2a2a;cursor:pointer}"
      + ".ksn-menu{position:absolute;right:8px;top:calc(100% + 6px);background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:6px;min-width:220px}"
      + ".ksn-menu button,.ksn-menu a{display:flex;gap:10px;align-items:center;width:100%;border:0;background:none;padding:12px;border-radius:12px;font:inherit;font-size:15px;font-weight:600;color:#1f2a22;text-decoration:none;cursor:pointer;text-align:left}"
      + ".ksn-menu button:hover,.ksn-menu a:hover{background:#f1f5f0}"
      + ".ksn-fab{position:absolute;z-index:600;right:12px;display:flex;flex-direction:column;gap:12px}"
      + ".ksn-fab button,.ksn-arrow{border:0;background:#fff;border-radius:50%;width:56px;height:56px;display:grid;place-items:center;box-shadow:0 4px 14px rgba(20,40,25,.2);cursor:pointer;color:#1f2a22}"
      + ".ksn-fab button.on{color:#1a73e8;box-shadow:0 0 0 3px rgba(26,115,232,.25),0 4px 14px rgba(20,40,25,.2)}"
      + ".ksn-arrow{position:absolute;z-index:600;left:14px;width:62px;height:62px;color:#1a73e8}.ksn-arrow.on{background:#e8f0fe}"
      + ".ksn-card{position:absolute;z-index:600;left:0;right:0;bottom:0;background:linear-gradient(180deg,#fff 0%,#f8fbf6 100%);border-radius:28px 28px 0 0;padding:10px 16px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -8px 26px rgba(20,40,25,.18);max-height:64vh;overflow:auto}"
      + ".ksn-handle{width:52px;height:5px;border-radius:9px;background:#d4d8d2;margin:0 auto 10px}"
      + ".ksn-step{margin:0 0 6px;display:flex;align-items:center;gap:8px}"
      + ".ksn-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 14px 5px 10px;border-radius:99px;background:#e8f5ec;color:#14502c;font-weight:800;font-size:14px}"
      + ".ksn-card h3{margin:2px 0 0;font-size:24px;color:#2a1508;display:flex;gap:12px;align-items:center}.ksn-card h3 span{font-size:34px;line-height:1}"
      + ".ksn-ket{margin:2px 0 10px 46px;color:#4b5563;font-size:14.5px}"
      + ".ksn-dots{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:0 0 10px;font-size:12.5px;color:#6b7a70}"
      + ".ksn-dots span{padding:3px 10px;border-radius:99px;background:#eef3ec}.ksn-dots span.now{background:#1f8f4c;color:#fff;font-weight:700}.ksn-dots span.done{text-decoration:line-through;opacity:.6}"
      + ".ksn-info{display:flex;gap:10px;margin:0 0 12px}.ksn-info div{flex:1;display:flex;align-items:center;gap:12px;background:#eef6ee;border-radius:18px;padding:12px 14px}"
      + ".ksn-info svg{flex:none;width:34px;height:34px}.ksn-info b{display:block;font-size:22px;color:#1f2a22;line-height:1.1}.ksn-info small{color:#5b6b60;font-size:13px}"
      + ".ksn-btns{display:flex;gap:10px}.ksn-btns a{flex:1;display:flex;align-items:center;gap:10px;border-radius:18px;padding:10px 12px;text-decoration:none;min-width:0}"
      + ".ksn-btns a b{display:block;font-size:17px}.ksn-btns a small{display:block;font-size:12.5px;opacity:.85}.ksn-btns a em{margin-left:auto;font-style:normal;font-size:22px}"
      + ".ksn-btns .ksn-tel{background:#fff;border:2px solid #b8dfc5;color:#1f2a22}.ksn-tel .ic{flex:none;width:42px;height:42px;border-radius:50%;background:#14532d;display:grid;place-items:center}"
      + ".ksn-btns .ksn-wa{background:linear-gradient(135deg,#25a35a,#167a3f);color:#fff;box-shadow:0 4px 12px rgba(22,122,63,.3)}.ksn-wa .ic{flex:none;width:42px;height:42px;display:grid;place-items:center}"
      + ".ksn-next{display:block;width:100%;margin-top:10px;border:0;border-radius:18px;padding:14px;font:inherit;font-weight:800;font-size:16px;background:#1f2a33;color:#fff;cursor:pointer}"
      + ".ksn-next.dekat{animation:ksnD 1.2s infinite}@keyframes ksnD{50%{box-shadow:0 0 0 7px rgba(29,78,216,.35)}}"
      + ".ksn-g{display:flex;align-items:center;gap:12px;margin-top:10px;padding:13px 16px;border-radius:16px;background:#eef3ee;color:#14502c;font-weight:700;font-size:15.5px;text-decoration:none}.ksn-g em{margin-left:auto;font-style:normal;font-size:20px}"
      + ".ksn-next[hidden],.ksn-btns[hidden],.ksn-ket[hidden]{display:none}"
      + ".ksn-attr{display:block;text-align:center;margin-top:6px;font-size:10.5px;color:#9aa39c}"
      + ".ksn-pin{font-size:30px;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}"
      + ".ksn-me{width:24px;height:24px;border-radius:50%;background:#1a73e8;border:4px solid #fff;box-shadow:0 0 0 14px rgba(26,115,232,.18)}"
      + "@media (prefers-reduced-motion:reduce){.ksn-next.dekat{animation:none}}"
      /* ===== tampilan rapi v2 ===== */
      + ".ksn-top{padding:6px 8px;border-radius:18px;gap:8px}.ksn-x{width:42px;height:42px;border-radius:13px;font-size:21px}"
      + ".ksn-tt b{display:flex;align-items:center;gap:7px;font-size:17px}.ksn-kode{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
      + ".ksn-tot{flex:none;margin:0;font-size:13px;padding:2px 9px;vertical-align:0}.ksn-gps{margin-top:2px;font-size:11.5px;padding:2px 9px}"
      + ".ksn-more{width:34px;height:42px}"
      + ".ksn-fab{right:10px;gap:9px}.ksn-fab button{width:46px;height:46px}.ksn-fab svg{width:22px;height:22px}"
      + ".ksn-arrow{left:12px;width:50px;height:50px}.ksn-arrow svg{width:24px;height:24px}"
      + ".ksn-card{padding:6px 14px calc(10px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0}.ksn-handle{width:42px;height:4px;margin:0 auto 8px}"
      + ".ksn-step{margin:0 0 4px}.ksn-chip{font-size:12px;padding:3px 10px 3px 8px}"
      + ".ksn-card h3{font-size:19px;gap:8px;margin:0}.ksn-card h3 span{font-size:24px}"
      + ".ksn-ket{margin:2px 0 8px 32px;font-size:13.5px}.ksn-dots{margin:0 0 8px;font-size:12px}"
      + ".ksn-info{gap:8px;margin:0 0 10px}.ksn-info div{gap:8px;border-radius:14px;padding:8px 10px}"
      + ".ksn-info svg{width:24px;height:24px}.ksn-info b{font-size:17px}.ksn-info small{font-size:11.5px}"
      + ".ksn-btns{gap:8px}.ksn-btns a{gap:8px;border-radius:14px;padding:7px 10px}.ksn-btns a b{font-size:15px}.ksn-btns a small{font-size:11px}.ksn-btns a em{font-size:18px}"
      + ".ksn-tel .ic,.ksn-wa .ic{width:32px;height:32px}.ksn-tel .ic svg,.ksn-wa .ic svg{width:18px;height:18px}.ksn-wa .ic svg{width:26px;height:26px}"
      + ".ksn-next{margin-top:8px;padding:12px;border-radius:14px;font-size:15px}.ksn-attr{margin-top:4px}"
      /* naik/turun */
      + ".ksn-card{max-height:78vh}.ksn-card:not(.besar){padding-bottom:calc(8px + env(safe-area-inset-bottom))}"
      + ".ksn-card:not(.besar)>:not(.ksn-handle):not(.ksn-mini){display:none!important}.ksn-card.besar .ksn-mini{display:none}"
      + ".ksn-handle{cursor:pointer;margin-bottom:6px}.ksn-card:not(.besar) .ksn-handle{margin-bottom:6px}"
      + ".ksn-mini{display:flex;align-items:center;gap:9px;cursor:pointer;min-height:44px}"
      + ".ksn-mi-ic{flex:none;font-size:24px;line-height:1}.ksn-mi-t{flex:1;min-width:0}"
      + ".ksn-mi-t b{display:block;font-size:16px;color:#2a1508;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
      + ".ksn-mi-t small{display:block;font-size:13px;font-weight:700;color:#14502c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
      + ".ksn-mi-tel,.ksn-mi-wa,.ksn-mi-up{flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;border:0;cursor:pointer;text-decoration:none}"
      + ".ksn-mi-tel{background:#14532d}.ksn-mi-wa{background:#25a35a}.ksn-mi-tel svg{width:18px;height:18px}.ksn-mi-wa svg{width:24px;height:24px}"
      + ".ksn-mi-up{background:#eef3ee;color:#14502c;font-size:20px;font-weight:900;line-height:1;padding-top:6px}.ksn-mi-tel[hidden],.ksn-mi-wa[hidden]{display:none}"
      /* 3 kotak 1 baris: jarak • perkiraan tiba • tujuan selanjutnya / selesai */
      + ".ksn-info{display:grid;grid-template-columns:1fr 1fr 1.12fr;gap:8px}.ksn-info>div{min-width:0;gap:6px;padding:8px 8px}"
      + ".ksn-info svg{width:22px;height:22px}.ksn-info b{font-size:16px;white-space:nowrap}.ksn-info small{font-size:11px;white-space:nowrap}.ksn-info span{min-width:0}"
      + ".ksn-info .ksn-next{margin:0;width:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px 6px;border-radius:14px;"
      + "background:linear-gradient(135deg,#1d4ed8,#1e3a8a);color:#fff;font-size:13px;font-weight:800;line-height:1.15;text-align:center;box-shadow:0 4px 12px rgba(30,58,138,.3)}"
      + ".ksn-info .ksn-next b{font-size:13px;white-space:normal;color:#fff}.ksn-nx-ic{font-size:19px;line-height:1}"
      + ".ksn-info .ksn-next.akhir{background:linear-gradient(135deg,#1d4ed8,#1e3a8a);box-shadow:0 4px 12px rgba(30,58,138,.3)}"
      + ".ksn-tema .ksn-mat{display:none}html.gelap .ksn-tema .ksn-bln{display:none}html.gelap .ksn-tema .ksn-mat{display:block}.ksn-tema{color:#5b4636}html.gelap .ksn-fab .ksn-tema{color:#ffcf5c}"
      + ".ksn-turun{position:absolute;top:8px;right:10px;width:36px;height:36px;border-radius:50%;border:0;background:#eef3ee;color:#14502c;font-size:20px;font-weight:900;cursor:pointer;line-height:1}";
    document.head.appendChild(s);
  }

  var aktif = null;   // satu navigasi terbuka pada satu waktu
  var abaikanBack = 0; // waktu peta ditutup lewat tombol ← (history.back() milik peta sendiri, jangan diproses halaman)
  // true bila tombol kembali HP sedang/baru saja dipakai untuk peta -> halaman jangan pindah tab
  function sibuk() {
    if (aktif) return true;
    if (abaikanBack && Date.now() - abaikanBack < 1500) { abaikanBack = 0; return true; }
    abaikanBack = 0; return false;
  }
  function tutup(dariBack) {
    if (!aktif) return;
    if (aktif.back) { window.removeEventListener("popstate", aktif.back); if (dariBack !== true) try { abaikanBack = Date.now(); history.back(); } catch (e) { abaikanBack = 0; } }
    try { if (aktif.watch != null) navigator.geolocation.clearWatch(aktif.watch); } catch (e) {}
    try { if (aktif.kunci) aktif.kunci.release(); } catch (e) {}
    clearInterval(aktif.iv); document.removeEventListener("visibilitychange", aktif.vis);
    if (aktif.peta) aktif.peta.remove();
    aktif.ov.remove(); document.body.style.overflow = aktif.ovf || ""; aktif = null;
  }

  async function buka(opt) {
    var stops = (opt && opt.stops || []).filter(ok).map(function (s) { return { nama: s.nama || "Tujuan", e: s.e || "📍", lat: +s.lat, lng: +s.lng, ket: s.ket || "", tel: s.tel || "", peran: s.peran || "" }; });
    if (!stops.length) { alert("Lokasi tujuan belum ada di pesanan ini."); return; }
    if (mode() === "google") { window.open(urlGoogle(stops), "_blank", "noopener"); return; }
    tutup(); css();
    var ov = document.createElement("div"); ov.className = "ksn-ov";
    var IK = {"map": "<svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20z\" fill=\"#fff\"/><path d=\"M8.5 4v13.5M15.5 6.5V20\" stroke=\"#cfe8d6\" stroke-width=\"1.4\"/><path d=\"M15.5 3.2c-1.9 0-3.3 1.4-3.3 3.2 0 2.3 3.3 5.6 3.3 5.6s3.3-3.3 3.3-5.6c0-1.8-1.4-3.2-3.3-3.2z\" fill=\"#e5484d\"/><circle cx=\"15.5\" cy=\"6.4\" r=\"1.2\" fill=\"#fff\"/></svg>", "loc": "<svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\"><circle cx=\"12\" cy=\"12\" r=\"6.5\"/><circle cx=\"12\" cy=\"12\" r=\"2.6\" fill=\"currentColor\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3\"/></svg>", "lay": "<svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linejoin=\"round\"><path d=\"m12 3 9 5-9 5-9-5z\"/><path d=\"m3 13 9 5 9-5\"/></svg>", "img": "<svg width=\"30\" height=\"30\" viewBox=\"0 0 24 24\"><rect x=\"2.5\" y=\"4\" width=\"19\" height=\"16\" rx=\"3\" fill=\"#7cc4f2\"/><path d=\"M2.5 16.5 8 11l4.5 4.5L15 13l6.5 5.5V17c0 1.7-1.3 3-3 3h-13c-1.7 0-3-1.3-3-3z\" fill=\"#3fae5a\"/><circle cx=\"16.5\" cy=\"8.5\" r=\"2\" fill=\"#ffd34d\"/></svg>", "arrow": "<svg width=\"30\" height=\"30\" viewBox=\"0 0 24 24\"><path d=\"M21 3 3 10.5l7.5 2.9L13.5 21z\" fill=\"currentColor\"/></svg>", "route": "<svg viewBox=\"0 0 36 36\" fill=\"none\"><circle cx=\"9\" cy=\"27\" r=\"4\" stroke=\"#1f8f4c\" stroke-width=\"3\"/><path d=\"M27 6c-3.3 0-6 2.6-6 5.8 0 4.2 6 10.2 6 10.2s6-6 6-10.2C33 8.6 30.3 6 27 6z\" fill=\"#1f8f4c\"/><circle cx=\"27\" cy=\"11.8\" r=\"2.2\" fill=\"#fff\"/><path d=\"M13 27h7a5 5 0 0 0 0-10h-1\" stroke=\"#1f8f4c\" stroke-width=\"3\" stroke-linecap=\"round\"/></svg>", "jam": "<svg viewBox=\"0 0 36 36\"><circle cx=\"18\" cy=\"19\" r=\"14\" fill=\"#1f8f4c\"/><circle cx=\"18\" cy=\"19\" r=\"10.5\" fill=\"#fff\"/><path d=\"M18 12.5V19l4 3\" stroke=\"#1f8f4c\" stroke-width=\"3\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M7 7.5 10.5 4M29 7.5 25.5 4\" stroke=\"#1f8f4c\" stroke-width=\"3\" stroke-linecap=\"round\"/></svg>", "telp": "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\"><path fill=\"#fff\" d=\"M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z\"/></svg>", "wa": "<svg width=\"40\" height=\"40\" viewBox=\"0 0 32 32\"><path fill=\"#fff\" d=\"M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Z\"/><path fill=\"#1f8f4c\" d=\"M16 26.6c-2 0-4-.6-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6Zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.2 1.3 3.4c.2.2 2.3 3.5 5.6 4.9 2.1.9 2.9 1 4 .8.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.6-.3Z\"/></svg>", "gpin": "<svg width=\"26\" height=\"26\" viewBox=\"0 0 24 24\"><path d=\"M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7z\" fill=\"#34a853\"/><path d=\"M12 2a7 7 0 0 0-7 7c0 1.5.5 3 1.3 4.4L12 9z\" fill=\"#4285f4\"/><path d=\"M12 2a7 7 0 0 1 7 7c0 1-.2 2-.6 3L12 9z\" fill=\"#ea4335\"/><path d=\"M12 9 6.3 13.4c.6 1.2 1.4 2.4 2.2 3.5L12 9z\" fill=\"#fbbc04\"/><circle cx=\"12\" cy=\"9\" r=\"2.6\" fill=\"#fff\"/></svg>"};
    ov.innerHTML = '<div class="ksn-map"></div>'
      + '<div class="ksn-top"><button class="ksn-x" type="button" aria-label="Tutup peta">←</button><div class="ksn-tt"><b><span class="ksn-kode">🧭 ' + esc(opt.judul || "Navigasi") + '</span><em class="ksn-tot" hidden></em></b><span class="ksn-gps"><i></i><span>GPS mencari…</span></span></div>'
      + '<button class="ksn-more" type="button" aria-label="Menu lainnya">⋮</button>'
      + '<div class="ksn-menu" hidden><button type="button" data-a="semua">🗺️ Lihat seluruh rute</button><button type="button" data-a="sat">🛰️ <span class="ksn-satl">Mode satelit</span></button><a class="ksn-gl" target="_blank" rel="noopener" href="#">' + IK.gpin + ' Buka di Google Maps</a></div></div>'
      + '<div class="ksn-fab" style="top:calc(max(10px,env(safe-area-inset-top)) + 72px)"><button type="button" data-a="ikut" class="on" title="Ikuti posisi saya" aria-label="Ikuti posisi saya">' + IK.loc + '</button><button type="button" data-a="semua" title="Lihat seluruh rute" aria-label="Lihat seluruh rute">' + IK.lay + '</button><button type="button" data-a="sat" title="Peta / Satelit" aria-label="Ganti peta atau satelit">' + IK.img + '</button><button type="button" data-a="tema" class="ksn-tema" title="Mode gelap / terang" aria-label="Ganti mode gelap atau terang"><svg class="ksn-bln" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z"/></svg><svg class="ksn-mat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg></button></div>'
      + '<button type="button" class="ksn-arrow on" data-a="ikut" aria-label="Kembali ke posisi saya">' + IK.arrow + '</button>'
      + '<div class="ksn-card"><div class="ksn-handle"></div>'
      + '<div class="ksn-mini" role="button" aria-label="Lihat detail tujuan"><span class="ksn-mi-ic"></span><div class="ksn-mi-t"><b class="ksn-mi-n"></b><small class="ksn-mi-s"></small></div>'
      + '<a class="ksn-mi-tel" href="#" aria-label="Telepon">' + IK.telp + '</a><a class="ksn-mi-wa" target="_blank" rel="noopener" href="#" aria-label="WhatsApp">' + IK.wa + '</a><button type="button" class="ksn-mi-up" aria-label="Naikkan">⌃</button></div>'
      + '<button type="button" class="ksn-turun" aria-label="Turunkan">⌄</button><p class="ksn-step"></p><h3></h3><p class="ksn-ket"></p><div class="ksn-dots"></div>'
      + '<div class="ksn-info"><div>' + IK.route + '<span><b class="ksn-jarak">-</b><small>Jarak rute</small></span></div><div>' + IK.jam + '<span><b class="ksn-eta">-</b><small>Perkiraan tiba</small></span></div>'
      + '<button type="button" class="ksn-next"><span class="ksn-nx-ic">➜</span><b class="ksn-nx-t">Tujuan selanjutnya</b></button></div>'
      + '<div class="ksn-btns"><a class="ksn-tel" href="#"><span class="ic">' + IK.telp + '</span><span><b>Telepon</b><small class="ksn-sub1"></small></span><em>›</em></a><a class="ksn-wa" target="_blank" rel="noopener" href="#"><span class="ic">' + IK.wa + '</span><span><b>WhatsApp</b><small class="ksn-sub2"></small></span><em>›</em></a></div>'
      + '<small class="ksn-attr">Peta © OpenStreetMap • Satelit © Esri • Rute OSRM</small></div>';
    document.body.appendChild(ov);
    var q = function (s) { return ov.querySelector(s); };
    var st = aktif = { ov: ov, ovf: document.body.style.overflow, i: 0, pos: null, ikut: true, ruteT: 0, ruteDari: null, garis: null, watch: null, kunci: null, iv: 0, vis: null, sat: false };
    document.body.style.overflow = "hidden";
    q(".ksn-x").onclick = function () { tutup(); };
    ov.querySelectorAll(".ksn-gl").forEach(function (a) { a.href = urlGoogle(stops); });
    q(".ksn-more").onclick = function (e) { e.stopPropagation(); q(".ksn-menu").hidden = !q(".ksn-menu").hidden; };
    ov.addEventListener("click", function (e) { if (!e.target.closest(".ksn-menu,.ksn-more")) q(".ksn-menu").hidden = true; });

    try { await muatLeaflet(); } catch (e) { q(".ksn-map").innerHTML = '<p style="padding:90px 20px;text-align:center">Peta tidak bisa dimuat (internet lemah?).<br>Pakai tombol <b>Buka di Google Maps</b> di bawah.</p>'; }
    if (aktif !== st) return;   // sudah ditutup saat memuat
    var peta = null, osm = null, sat = null, lbl = null, meMk = null;
    if (window.L) {
      peta = st.peta = L.map(q(".ksn-map"), { zoomControl: false, attributionControl: false }).setView([stops[0].lat, stops[0].lng], 16);
      osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(peta);
      sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, maxNativeZoom: 18, attribution: "Foto udara © Esri" });
      lbl = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, maxNativeZoom: 18 });
      stops.forEach(function (s, k) {
        L.marker([s.lat, s.lng], { icon: L.divIcon({ html: '<div class="ksn-pin">' + s.e + "</div>", className: "", iconSize: [28, 28], iconAnchor: [14, 26] }) })
          .addTo(peta).bindPopup("<b>" + (k + 1) + ". " + esc(s.nama) + "</b>" + (s.ket ? "<br>" + esc(s.ket) : ""));
      });
      meMk = L.marker([0, 0], { icon: L.divIcon({ html: '<div class="ksn-me"></div>', className: "", iconSize: [22, 22], iconAnchor: [11, 11] }), zIndexOffset: 1000 });
      peta.on("dragstart", function () { st.ikut = false; ov.querySelectorAll('[data-a="ikut"]').forEach(function (x) { x.classList.remove("on"); }); });
      setTimeout(function () { peta.invalidateSize(); if (st.ikut && st.pos) pusat([st.pos.lat, st.pos.lng], peta.getZoom(), false); }, 120);
    }
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]");
      if (b && b.dataset.a === "tema") { if (window.KSTema) KSTema.set(KSTema.gelap() ? "terang" : "gelap"); else document.documentElement.classList.toggle("gelap"); return; }
      if (!b || !peta) return;
      var ikutBtn = ov.querySelectorAll('[data-a="ikut"]');
      if (b.dataset.a === "ikut") { st.ikut = true; ikutBtn.forEach(function (x) { x.classList.add("on"); }); if (st.pos) pusat([st.pos.lat, st.pos.lng], Math.max(peta.getZoom(), 17), true); }
      if (b.dataset.a === "semua") { st.ikut = false; ikutBtn.forEach(function (x) { x.classList.remove("on"); }); lihatSemua(); }
      if (b.dataset.a === "sat") { st.sat = !st.sat; ov.classList.toggle("ksn-sat", st.sat); q(".ksn-satl").textContent = st.sat ? "Mode peta jalan" : "Mode satelit"; if (st.sat) { peta.removeLayer(osm); sat.addTo(peta); lbl.addTo(peta); } else { peta.removeLayer(sat); peta.removeLayer(lbl); osm.addTo(peta); } }
      q(".ksn-menu").hidden = true;
    });
    function kartuH() { var c = q(".ksn-card"); return c ? c.offsetHeight : 300; }
    function pusat(ll, z, anim) {   // taruh titik kurir di tengah area peta yang terlihat (di atas kartu bawah)
      peta.invalidateSize(); peta.setView(ll, z, { animate: anim }); var dy = Math.round((kartuH() - 90) / 2); if (dy > 0) peta.panBy([0, dy], { animate: false });
    }
    function lihatSemua() {
      if (!peta) return;
      var pts = stops.slice(st.i).map(function (s) { return [s.lat, s.lng]; }); if (st.pos) pts.push([st.pos.lat, st.pos.lng]);
      if (st.garis) { try { peta.fitBounds(st.garis.getBounds().extend(pts), { paddingTopLeft: [20, 110], paddingBottomRight: [20, kartuH() + 20] }); return; } catch (e) {} }
      if (pts.length > 1) peta.fitBounds(pts, { paddingTopLeft: [20, 110], paddingBottomRight: [20, kartuH() + 20] }); else pusat(pts[0], 17, false);
    }

    // ---- kotak tujuan naik/turun (bawaan: kecil, peta ±90% layar) ----
    function mini() {
      var s = stops[st.i]; if (!s) return;
      q(".ksn-mi-ic").textContent = s.e; q(".ksn-mi-n").textContent = s.nama;
      var j = q(".ksn-jarak").textContent, e = q(".ksn-eta").textContent;
      q(".ksn-mi-s").textContent = [j !== "-" ? j : "", e !== "-" ? e : ""].filter(Boolean).join(" · ") || (s.ket || "Menghitung rute…");
      var ada = !q(".ksn-btns").hidden;
      q(".ksn-mi-tel").hidden = q(".ksn-mi-wa").hidden = !ada;
      q(".ksn-mi-tel").href = q(".ksn-tel").href; q(".ksn-mi-wa").href = q(".ksn-wa").href;
    }
    function besar(on) {
      q(".ksn-card").classList.toggle("besar", !!on);
      setTimeout(function () { var ar = q(".ksn-arrow"); if (ar) ar.style.bottom = (kartuH() + 14) + "px"; }, 0);
    }
    q(".ksn-mini").onclick = function (e) { if (!e.target.closest("a")) besar(true); };
    q(".ksn-handle").onclick = function () { besar(!q(".ksn-card").classList.contains("besar")); };
    q(".ksn-turun").onclick = function () { besar(false); };
    try { var amati = new MutationObserver(mini); amati.observe(q(".ksn-jarak"), { childList: true, characterData: true, subtree: true }); amati.observe(q(".ksn-eta"), { childList: true, characterData: true, subtree: true }); } catch (e) {}
    function tampil() {
      var s = stops[st.i], akhir = st.i === stops.length - 1, nomor = String(s.tel || "").replace(/\D/g, "");
      q(".ksn-step").innerHTML = '<span class="ksn-chip">📍 Tujuan' + (stops.length > 1 ? " " + (st.i + 1) + " dari " + stops.length : "") + "</span>";
      q("h3").innerHTML = "<span>" + s.e + "</span>" + esc(s.nama);
      // nomor HP selalu milik tujuan yang sedang dituju (toko -> no. toko, pembeli -> no. pembeli); tidak memakai nomor tujuan lain
      var ket = s.ket || ""; if (!nomor && s.peran) ket += (ket ? " • " : "") + "No. HP " + s.peran + " belum ada";
      q(".ksn-ket").textContent = ket;
      q(".ksn-ket").hidden = !ket;
      q(".ksn-dots").innerHTML = stops.length > 1 ? stops.map(function (x, k) { return '<span class="' + (k < st.i ? "done" : k === st.i ? "now" : "") + '">' + x.e + " " + esc(x.nama) + "</span>"; }).join("›") : "";
      var peran = s.peran || "pembeli";
      q(".ksn-btns").hidden = !nomor;
      q(".ksn-tel").href = nomor ? "tel:+" + nomor : "#"; q(".ksn-sub1").textContent = "Hubungi " + peran;
      q(".ksn-wa").href = nomor ? "https://wa.me/" + nomor : "#"; q(".ksn-sub2").textContent = "Chat " + peran;
      // kotak ke-3: "Tujuan selanjutnya" (masih ada tujuan) / "Selesai" (tujuan terakhir)
      q(".ksn-nx-t").textContent = akhir ? (s.peran === "toko" ? "Sudah sampai" : "Selesai") : "Tujuan selanjutnya";
      q(".ksn-nx-ic").textContent = akhir ? "✓" : "➜";
      q(".ksn-next").classList.toggle("akhir", akhir);
      q(".ksn-jarak").textContent = "-"; q(".ksn-eta").textContent = "-";
      st.ruteT = 0; hitungRute(true);
      st.dekatLalu = false; mini(); besar(false);
    }
    q(".ksn-next").onclick = function () {
      if (st.i < stops.length - 1) { var dari = stops[st.i]; st.i++; tampil(); if (opt.onLanjut) try { opt.onLanjut(dari, stops[st.i], st.i); } catch (e) {} }
      else { var ak = stops[stops.length - 1]; tutup(); if (opt.onSampai) try { opt.onSampai(ak); } catch (e) {} }
    };

    // ---- rute jalan (OSRM, gratis tanpa kunci) ----
    async function hitungRute(fit) {
      if (!peta) return;
      var dari = st.pos || null, sisa = stops.slice(st.i);
      var titik = (dari ? [dari] : []).concat(sisa);
      if (titik.length < 2) { if (fit) lihatSemua(); garisLurus(); return; }
      st.ruteT = Date.now(); st.ruteDari = dari;
      try {
        var u = "https://router.project-osrm.org/route/v1/driving/" + titik.map(function (p) { return p.lng + "," + p.lat; }).join(";") + "?overview=full&geometries=geojson";
        var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 9000);
        var d = await (await fetch(u, { signal: ctl.signal })).json(); clearTimeout(t);
        if (aktif !== st) return;
        var r = d && d.routes && d.routes[0]; if (!r) throw new Error("rute kosong");
        if (st.garis) peta.removeLayer(st.garis);
        st.garis = L.geoJSON(r.geometry, { style: { color: "#228b4e", weight: 7, opacity: .85 } }).addTo(peta);
        var leg = r.legs && r.legs[0];
        var m = dari && leg ? leg.distance : r.distance, dtk = dari && leg ? leg.duration : r.duration;
        q(".ksn-jarak").textContent = dari ? km(m) : km(r.distance) + " (total)";
        tot(r.distance);   // total sisa perjalanan: posisi kurir -> semua tujuan yang tersisa
        q(".ksn-eta").textContent = dari ? Math.max(1, Math.round(dtk / 60)) + " menit" : "-";
        if (fit && !(st.ikut && st.pos)) lihatSemua();
      } catch (e) { garisLurus(); if (fit) lihatSemua(); }
    }
    function tot(m, kira) { var e = q(".ksn-tot"); if (!e) return; if (!(m > 0)) { e.hidden = true; return; } e.textContent = (kira ? "± " : "") + kmSingkat(m); e.hidden = false; }
    function garisLurus() {
      if (!peta) return;
      var titik = (st.pos ? [st.pos] : []).concat(stops.slice(st.i));
      if (st.garis) peta.removeLayer(st.garis);
      st.garis = L.polyline(titik.map(function (p) { return [p.lat, p.lng]; }), { color: "#7b3f1d", weight: 4, dashArray: "6 8" }).addTo(peta);
      if (st.pos) { q(".ksn-jarak").textContent = "± " + km(jarakM(st.pos, stops[st.i])); q(".ksn-eta").textContent = "-"; }
      // perkiraan garis lurus bila rute jalan tidak bisa dihitung
      var tt = 0; for (var k = 1; k < titik.length; k++) tt += jarakM(titik[k - 1], titik[k]);
      if (titik.length > 1) tot(tt, true);
    }

    // ---- GPS kurir ----
    if ("geolocation" in navigator) {
      st.watch = navigator.geolocation.watchPosition(function (p) {
        if (aktif !== st) return;
        var g = q(".ksn-gps"); g.lastChild.textContent = "GPS aktif"; g.classList.add("ok");
        var pertama = !st.pos; st.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        if (peta) { if (!peta.hasLayer(meMk)) meMk.addTo(peta); meMk.setLatLng([st.pos.lat, st.pos.lng]); if (st.ikut) pusat([st.pos.lat, st.pos.lng], pertama ? 17 : peta.getZoom(), !pertama); }
        var dekat = jarakM(st.pos, stops[st.i]) < 60; q(".ksn-next").classList.toggle("dekat", dekat);
        if (dekat && !st.dekatLalu) besar(true);   // sudah dekat: kotak naik supaya tombol "lanjut" terlihat
        st.dekatLalu = dekat;
        var geser = st.ruteDari ? jarakM(st.pos, st.ruteDari) : 1e9;
        if (pertama || Date.now() - st.ruteT > 30000 || geser > 150) hitungRute(pertama);
      }, function (err) {
        var g = q(".ksn-gps"); g.lastChild.textContent = err && err.code === 1 ? "Izin lokasi ditolak" : "GPS belum dapat"; g.classList.remove("ok");
      }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    } else q(".ksn-gps").lastChild.textContent = "GPS tidak didukung";

    // ---- layar tetap menyala selama navigasi ----
    async function jaga() { try { if (navigator.wakeLock && document.visibilityState === "visible") st.kunci = await navigator.wakeLock.request("screen"); } catch (e) {} }
    st.vis = function () { if (document.visibilityState === "visible") jaga(); };
    document.addEventListener("visibilitychange", st.vis); jaga();
    st.iv = setInterval(function () { if (st.pos && Date.now() - st.ruteT > 30000) hitungRute(false); }, 10000);

    // tombol kembali HP menutup peta, bukan keluar dari dashboard
    try { history.pushState({ ksnav: 1 }, ""); st.back = function () { if (aktif === st) tutup(true); }; window.addEventListener("popstate", st.back); } catch (e) {}
    tampil();
  }

  window.KSNav = { buka: buka, tutup: tutup, sibuk: sibuk, terbuka: function () { return !!aktif; }, mode: mode, setMode: setMode, urlGoogle: urlGoogle };
})();
