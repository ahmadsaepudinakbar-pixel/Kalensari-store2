/* =====================================================================
   Kalensari Store • KAMERA DI DALAM HALAMAN (tanpa pindah ke aplikasi Kamera)
   Kenapa: di Android, saat <input type=file capture> membuka aplikasi Kamera, Chrome masuk
   ke belakang layar. Bila RAM HP sempit, Android menutup halaman Chrome -> setelah memotret
   halaman dimuat ulang (kembali ke dashboard) dan foto hilang ("memori penuh").
   Dengan kamera di dalam halaman, halaman tidak pernah ditinggalkan.

   Pemakaian:
     KSKamera.ambil(inputFile, {judul:"Foto bukti"})
       -> membuka kamera dalam halaman; hasil foto dimasukkan ke inputFile lalu event "change"
          dikirim seperti biasa (kode lama tetap jalan).
       -> bila kamera tidak bisa dibuka (tidak didukung / izin ditolak), otomatis memakai cara lama
          (inputFile.click()).
   ===================================================================== */
(function () {
  "use strict";
  var CSS = false;
  function css() {
    if (CSS) return; CSS = true;
    var s = document.createElement("style");
    s.textContent = ""
      + ".ksk-ov{position:fixed;inset:0;z-index:9700;background:#000;display:flex;flex-direction:column;color:#fff;font-family:inherit}"
      + ".ksk-top{display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 10px;background:linear-gradient(#000c,#0000);position:absolute;left:0;right:0;top:0;z-index:2}"
      + ".ksk-top b{flex:1;font-size:16px}.ksk-x{width:40px;height:40px;border-radius:50%;border:0;background:#ffffff26;color:#fff;font-size:20px;cursor:pointer}"
      + ".ksk-v{flex:1;position:relative;overflow:hidden;background:#111}.ksk-v video,.ksk-v img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.ksk-v img{object-fit:contain;background:#000}"
      + ".ksk-msg{position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;font-size:15px;color:#ddd}"
      + ".ksk-bar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 26px calc(22px + env(safe-area-inset-bottom,0px));background:#000}"
      + ".ksk-sm{min-width:74px;border:0;background:none;color:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer;padding:10px 4px}"
      + ".ksk-jepret{width:76px;height:76px;border-radius:50%;border:5px solid #fff;background:#fff;box-shadow:inset 0 0 0 4px #000;cursor:pointer;flex:none}"
      + ".ksk-jepret:active{transform:scale(.94)}.ksk-jepret:disabled{opacity:.4}"
      + ".ksk-pakai{border:0;border-radius:999px;background:#22a35a;color:#fff;font:inherit;font-weight:800;font-size:16px;padding:14px 26px;cursor:pointer}"
      + ".ksk-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .25s}";
    document.head.appendChild(s);
  }
  var buka = false, abaikan = 0;
  function sibuk() { if (buka) return true; if (abaikan && Date.now() - abaikan < 1500) { abaikan = 0; return true; } abaikan = 0; return false; }
  function bisa() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext); }

  function masukkan(inp, file) {
    try {
      var dt = new DataTransfer(); dt.items.add(file);
      inp.files = dt.files;
      inp.__ksCrop = true;   // foto bukti tidak perlu dipotong (lewati crop.js)
      inp.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch (e) { return false; }
  }

  function ambil(inp, opt) {
    opt = opt || {};
    if (!inp) return;
    if (!bisa()) { inp.click(); return; }
    css();
    var ov = document.createElement("div"); ov.className = "ksk-ov";
    ov.innerHTML = '<div class="ksk-top"><button type="button" class="ksk-x" aria-label="Tutup kamera">✕</button><b>' + (opt.judul || "Ambil foto") + '</b></div>'
      + '<div class="ksk-v"><video playsinline muted autoplay></video><img alt="" hidden><div class="ksk-msg">Membuka kamera…</div><div class="ksk-flash"></div></div>'
      + '<div class="ksk-bar"></div>';
    document.body.appendChild(ov); buka = true;
    var q = function (s) { return ov.querySelector(s); };
    var video = q("video"), img = q("img"), msg = q(".ksk-msg"), bar = q(".ksk-bar"), stream = null, depan = false, hasil = null, selesai = false;
    var lamaOvf = document.body.style.overflow; document.body.style.overflow = "hidden";

    function stop() { try { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} stream = null; }
    function tutup() { if (selesai) return; selesai = true; buka = false; stop(); try { if (img.src) URL.revokeObjectURL(img.src); } catch (e) {} window.removeEventListener("popstate", onBack); document.body.style.overflow = lamaOvf; ov.remove(); }
    function onBack() { tutup(); }
    // tombol kembali HP menutup kamera saja
    try { history.pushState({ kskam: 1 }, ""); window.addEventListener("popstate", onBack); } catch (e) {}
    function tutupDanKembali() { var ada = !selesai; tutup(); if (ada) try { abaikan = Date.now(); history.back(); } catch (e) { abaikan = 0; } }

    async function mulai() {
      stop(); msg.hidden = false; msg.textContent = "Membuka kamera…"; q(".ksk-jepret").disabled = true;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: depan ? "user" : { ideal: "environment" }, width: { ideal: 1600 }, height: { ideal: 1200 } } });
        if (selesai) return stop();
        video.srcObject = stream; await video.play().catch(function () {});
        msg.hidden = true; q(".ksk-jepret").disabled = false;
      } catch (e) {
        stop();
        if (selesai) return;
        // izin ditolak / kamera tidak ada -> pakai cara lama
        tutupDanKembali();
        if (e && (e.name === "NotAllowedError" || e.name === "SecurityError")) alert("Izin kamera ditolak. Izinkan Kamera untuk situs ini di pengaturan Chrome, atau pilih foto dari galeri.");
        inp.click();
      }
    }

    var BAR_KAMERA = '<button type="button" class="ksk-sm" data-a="galeri">Galeri</button><button type="button" class="ksk-jepret" aria-label="Jepret" disabled></button><button type="button" class="ksk-sm" data-a="balik">Putar</button>';
    function barKamera() {
      bar.innerHTML = BAR_KAMERA;
      q('[data-a="galeri"]').onclick = function () { tutupDanKembali(); inp.click(); };
      q('[data-a="balik"]').onclick = function () { depan = !depan; mulai(); };
      q(".ksk-jepret").onclick = jepret;
    }
    function jepret() {
      var w = video.videoWidth, h = video.videoHeight; if (!w || !h) return;
      var maks = 1600, k = Math.min(1, maks / Math.max(w, h));
      var c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
      var fl = q(".ksk-flash"); fl.style.opacity = ".8"; setTimeout(function () { fl.style.opacity = "0"; }, 120);
      c.toBlob(function (b) {
        c.width = c.height = 0;   // lepaskan memori kanvas
        if (!b) return;
        hasil = new File([b], "foto-" + Date.now() + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
        stop(); video.hidden = true; if (img.src) URL.revokeObjectURL(img.src); img.src = URL.createObjectURL(b); img.hidden = false;
        bar.innerHTML = '<button type="button" class="ksk-sm" data-a="ulang">Ulangi</button><button type="button" class="ksk-pakai" data-a="pakai">✓ Pakai foto</button>';
        q('[data-a="ulang"]').onclick = function () { hasil = null; img.hidden = true; video.hidden = false; barKamera(); mulai(); };
        q('[data-a="pakai"]').onclick = function () { var f = hasil; tutupDanKembali(); if (f && !masukkan(inp, f)) inp.click(); };
      }, "image/jpeg", 0.85);
    }
    q(".ksk-x").onclick = tutupDanKembali;
    barKamera();
    mulai();
  }

  window.KSKamera = { ambil: ambil, bisa: bisa, sibuk: sibuk };
})();
