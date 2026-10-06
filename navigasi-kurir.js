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
      + ".ksn-ov{position:fixed;inset:0;z-index:9500;background:#e9e4da;font-family:inherit}"
      + ".ksn-map{position:absolute;inset:0}"
      + ".ksn-top{position:absolute;z-index:600;top:max(10px,env(safe-area-inset-top));left:10px;right:10px;display:flex;gap:8px;align-items:center;background:#fffdf8;border-radius:16px;padding:8px 10px;box-shadow:0 4px 14px rgba(0,0,0,.2)}"
      + ".ksn-top b{flex:1;min-width:0;font-size:15px;color:#5b2c12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
      + ".ksn-x{border:0;background:#f3e9dc;color:#5b2c12;border-radius:12px;width:40px;height:40px;font-size:20px;cursor:pointer;flex:none}"
      + ".ksn-gps{font-size:12px;font-weight:700;padding:5px 10px;border-radius:99px;background:#f6d9b8;color:#7a3d00;white-space:nowrap}"
      + ".ksn-gps.ok{background:#cfe9d6;color:#17562d}"
      + ".ksn-fab{position:absolute;z-index:600;right:12px;display:flex;flex-direction:column;gap:8px}"
      + ".ksn-fab button{border:0;background:#fffdf8;border-radius:14px;width:46px;height:46px;font-size:20px;box-shadow:0 3px 10px rgba(0,0,0,.2);cursor:pointer}"
      + ".ksn-fab button.on{background:#228b4e;color:#fff}"
      + ".ksn-card{position:absolute;z-index:600;left:0;right:0;bottom:0;background:#fffdf8;border-radius:22px 22px 0 0;padding:14px 16px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -6px 22px rgba(0,0,0,.2);max-height:62vh;overflow:auto}"
      + ".ksn-step{font-size:12.5px;font-weight:800;color:#228b4e;margin:0}"
      + ".ksn-card h3{margin:2px 0;font-size:19px;color:#5b2c12;display:flex;gap:8px;align-items:center}"
      + ".ksn-ket{margin:0 0 10px;color:#6b5a4c;font-size:14px}"
      + ".ksn-info{display:flex;gap:10px;margin-bottom:10px}.ksn-info div{flex:1;background:#f3eee2;border-radius:14px;padding:8px 12px}"
      + ".ksn-info b{display:block;font-size:20px;color:#3a1f10}.ksn-info small{color:#7a6f62;font-size:12px}"
      + ".ksn-dots{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:0 0 10px;font-size:12.5px;color:#7a6f62}"
      + ".ksn-dots span{padding:3px 9px;border-radius:99px;background:#f3eee2}.ksn-dots span.now{background:#228b4e;color:#fff;font-weight:700}.ksn-dots span.done{text-decoration:line-through;opacity:.6}"
      + ".ksn-btns{display:flex;gap:8px}.ksn-btns a,.ksn-btns button{flex:1;border:0;border-radius:14px;padding:13px 8px;font-weight:700;font-size:15px;text-align:center;text-decoration:none;cursor:pointer;font-family:inherit}"
      + ".ksn-b1{background:#228b4e;color:#fff}.ksn-b2{background:#efe6d4;color:#5b2c12}"
      + ".ksn-b1.dekat{animation:ksnD 1.2s infinite}@keyframes ksnD{50%{box-shadow:0 0 0 7px rgba(34,139,78,.28)}}"
      + ".ksn-g{display:block;text-align:center;margin-top:10px;font-size:13px;color:#7a6f62}"
      + ".ksn-attr{display:block;text-align:center;margin-top:6px;font-size:10.5px;color:#a3978a}"
      + ".ksn-pin{font-size:26px;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}"
      + ".ksn-me{width:22px;height:22px;border-radius:50%;background:#1a73e8;border:4px solid #fff;box-shadow:0 0 0 6px rgba(26,115,232,.25)}"
      + "@media (prefers-reduced-motion:reduce){.ksn-b1.dekat{animation:none}}";
    document.head.appendChild(s);
  }

  var aktif = null;   // satu navigasi terbuka pada satu waktu
  function tutup(dariBack) {
    if (!aktif) return;
    if (aktif.back) { window.removeEventListener("popstate", aktif.back); if (dariBack !== true) try { history.back(); } catch (e) {} }
    try { if (aktif.watch != null) navigator.geolocation.clearWatch(aktif.watch); } catch (e) {}
    try { if (aktif.kunci) aktif.kunci.release(); } catch (e) {}
    clearInterval(aktif.iv); document.removeEventListener("visibilitychange", aktif.vis);
    if (aktif.peta) aktif.peta.remove();
    aktif.ov.remove(); document.body.style.overflow = aktif.ovf || ""; aktif = null;
  }

  async function buka(opt) {
    var stops = (opt && opt.stops || []).filter(ok).map(function (s) { return { nama: s.nama || "Tujuan", e: s.e || "📍", lat: +s.lat, lng: +s.lng, ket: s.ket || "", tel: s.tel || "" }; });
    if (!stops.length) { alert("Lokasi tujuan belum ada di pesanan ini."); return; }
    if (mode() === "google") { window.open(urlGoogle(stops), "_blank", "noopener"); return; }
    tutup(); css();
    var ov = document.createElement("div"); ov.className = "ksn-ov";
    ov.innerHTML = '<div class="ksn-map"></div>'
      + '<div class="ksn-top"><button class="ksn-x" type="button" aria-label="Tutup peta">←</button><b>🧭 ' + esc(opt.judul || "Navigasi") + '</b><span class="ksn-gps">GPS mencari…</span></div>'
      + '<div class="ksn-fab" style="top:calc(max(10px,env(safe-area-inset-top)) + 66px)"><button type="button" data-a="ikut" class="on" title="Ikuti posisi saya" aria-label="Ikuti posisi saya">🎯</button><button type="button" data-a="semua" title="Lihat seluruh rute" aria-label="Lihat seluruh rute">🗺️</button><button type="button" data-a="sat" title="Peta / Satelit" aria-label="Ganti peta atau satelit">🛰️</button></div>'
      + '<div class="ksn-card"><p class="ksn-step"></p><h3></h3><p class="ksn-ket"></p><div class="ksn-dots"></div>'
      + '<div class="ksn-info"><div><b class="ksn-jarak">-</b><small>Jarak rute</small></div><div><b class="ksn-eta">-</b><small>Perkiraan tiba</small></div></div>'
      + '<div class="ksn-btns"><a class="ksn-b2 ksn-tel" href="#">📞 Telepon</a><button type="button" class="ksn-b1 ksn-next"></button></div>'
      + '<a class="ksn-g" target="_blank" rel="noopener" href="#">Peta bermasalah? Buka di Google Maps</a><small class="ksn-attr">Peta © OpenStreetMap • Satelit © Esri • Rute OSRM</small></div>';
    document.body.appendChild(ov);
    var q = function (s) { return ov.querySelector(s); };
    var st = aktif = { ov: ov, ovf: document.body.style.overflow, i: 0, pos: null, ikut: true, ruteT: 0, ruteDari: null, garis: null, watch: null, kunci: null, iv: 0, vis: null, sat: false };
    document.body.style.overflow = "hidden";
    q(".ksn-x").onclick = function () { tutup(); };
    q(".ksn-g").href = urlGoogle(stops);

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
      peta.on("dragstart", function () { st.ikut = false; q('[data-a="ikut"]').classList.remove("on"); });
      setTimeout(function () { peta.invalidateSize(); }, 80);
    }
    q(".ksn-fab").onclick = function (e) {
      var b = e.target.closest("button"); if (!b || !peta) return;
      if (b.dataset.a === "ikut") { st.ikut = true; b.classList.add("on"); if (st.pos) peta.setView([st.pos.lat, st.pos.lng], Math.max(peta.getZoom(), 17)); }
      if (b.dataset.a === "semua") { st.ikut = false; q('[data-a="ikut"]').classList.remove("on"); lihatSemua(); }
      if (b.dataset.a === "sat") { st.sat = !st.sat; b.textContent = st.sat ? "🗺️" : "🛰️"; if (st.sat) { peta.removeLayer(osm); sat.addTo(peta); lbl.addTo(peta); } else { peta.removeLayer(sat); peta.removeLayer(lbl); osm.addTo(peta); } }
    };
    function lihatSemua() {
      if (!peta) return;
      var pts = stops.slice(st.i).map(function (s) { return [s.lat, s.lng]; }); if (st.pos) pts.push([st.pos.lat, st.pos.lng]);
      if (st.garis) { try { peta.fitBounds(st.garis.getBounds().extend(pts), { paddingTopLeft: [20, 80], paddingBottomRight: [20, 300] }); return; } catch (e) {} }
      if (pts.length > 1) peta.fitBounds(pts, { paddingTopLeft: [20, 80], paddingBottomRight: [20, 300] }); else peta.setView(pts[0], 17);
    }

    function tampil() {
      var s = stops[st.i], akhir = st.i === stops.length - 1;
      q(".ksn-step").textContent = stops.length > 1 ? "Tujuan " + (st.i + 1) + " dari " + stops.length : "Tujuan";
      q("h3").innerHTML = "<span>" + s.e + "</span>" + esc(s.nama);
      q(".ksn-ket").textContent = s.ket || "";
      q(".ksn-ket").hidden = !s.ket;
      q(".ksn-dots").innerHTML = stops.length > 1 ? stops.map(function (x, k) { return '<span class="' + (k < st.i ? "done" : k === st.i ? "now" : "") + '">' + x.e + " " + esc(x.nama) + "</span>"; }).join("›") : "";
      var tel = q(".ksn-tel"); tel.hidden = !s.tel; tel.href = s.tel ? "tel:+" + String(s.tel).replace(/\D/g, "") : "#";
      q(".ksn-next").textContent = akhir ? "✅ Sudah sampai" : "Sudah di sini, lanjut ›";
      q(".ksn-jarak").textContent = "-"; q(".ksn-eta").textContent = "-";
      st.ruteT = 0; hitungRute(true);
    }
    q(".ksn-next").onclick = function () {
      if (st.i < stops.length - 1) { st.i++; tampil(); }
      else { tutup(); if (opt.onSampai) try { opt.onSampai(); } catch (e) {} }
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
        q(".ksn-eta").textContent = dari ? Math.max(1, Math.round(dtk / 60)) + " menit" : "-";
        if (fit && !(st.ikut && st.pos)) lihatSemua();
      } catch (e) { garisLurus(); if (fit) lihatSemua(); }
    }
    function garisLurus() {
      if (!peta) return;
      var titik = (st.pos ? [st.pos] : []).concat(stops.slice(st.i));
      if (st.garis) peta.removeLayer(st.garis);
      st.garis = L.polyline(titik.map(function (p) { return [p.lat, p.lng]; }), { color: "#7b3f1d", weight: 4, dashArray: "6 8" }).addTo(peta);
      if (st.pos) { q(".ksn-jarak").textContent = "± " + km(jarakM(st.pos, stops[st.i])); q(".ksn-eta").textContent = "-"; }
    }

    // ---- GPS kurir ----
    if ("geolocation" in navigator) {
      st.watch = navigator.geolocation.watchPosition(function (p) {
        if (aktif !== st) return;
        var g = q(".ksn-gps"); g.textContent = "GPS aktif"; g.classList.add("ok");
        var pertama = !st.pos; st.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        if (peta) { if (!peta.hasLayer(meMk)) meMk.addTo(peta); meMk.setLatLng([st.pos.lat, st.pos.lng]); if (st.ikut) peta.setView([st.pos.lat, st.pos.lng], pertama ? 17 : peta.getZoom(), { animate: !pertama }); }
        var dekat = jarakM(st.pos, stops[st.i]) < 60; q(".ksn-next").classList.toggle("dekat", dekat);
        var geser = st.ruteDari ? jarakM(st.pos, st.ruteDari) : 1e9;
        if (pertama || Date.now() - st.ruteT > 30000 || geser > 150) hitungRute(pertama);
      }, function (err) {
        var g = q(".ksn-gps"); g.textContent = err && err.code === 1 ? "Izin lokasi ditolak" : "GPS belum dapat"; g.classList.remove("ok");
      }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    } else q(".ksn-gps").textContent = "GPS tidak didukung";

    // ---- layar tetap menyala selama navigasi ----
    async function jaga() { try { if (navigator.wakeLock && document.visibilityState === "visible") st.kunci = await navigator.wakeLock.request("screen"); } catch (e) {} }
    st.vis = function () { if (document.visibilityState === "visible") jaga(); };
    document.addEventListener("visibilitychange", st.vis); jaga();
    st.iv = setInterval(function () { if (st.pos && Date.now() - st.ruteT > 30000) hitungRute(false); }, 10000);

    // tombol kembali HP menutup peta, bukan keluar dari dashboard
    try { history.pushState({ ksnav: 1 }, ""); st.back = function () { if (aktif === st) tutup(true); }; window.addEventListener("popstate", st.back); } catch (e) {}
    tampil();
  }

  window.KSNav = { buka: buka, tutup: tutup, mode: mode, setMode: setMode, urlGoogle: urlGoogle };
})();
