/* Kalensari • Selfie ringan untuk HP
   Masalah: membuka aplikasi kamera bawaan (input capture) membuat Chrome HP yang RAM-nya sempit
   mematikan tab ("sisa memori sedikit"), sehingga halaman dimuat ulang dan form hilang.
   Solusi:
   1) KSSelfie.kamera  : kamera depan DI DALAM halaman (getUserMedia), tanpa pindah aplikasi. Bila tidak bisa, jatuh ke pilihan lama.
   2) KSSelfie.dariFile: foto dari galeri/kamera bawaan diperkecil hemat memori (tanpa FileReader/base64 besar).
   3) KSSelfie.draft   : isian form disimpan otomatis (kecuali PIN) dan dipulihkan bila halaman dimuat ulang. */
(function () {
  var W = window, UKURAN = 320;

  function kePersegi(sumber, sw, sh) {
    var z = Math.min(sw, sh), c = document.createElement("canvas");
    c.width = c.height = UKURAN;
    c.getContext("2d").drawImage(sumber, (sw - z) / 2, (sh - z) / 2, z, z, 0, 0, UKURAN, UKURAN);
    var out = c.toDataURL("image/jpeg", 0.82);
    c.width = c.height = 0;
    return out;
  }

  async function dariFile(file) {
    if (W.createImageBitmap) {
      try {
        var bmp = await createImageBitmap(file);   // memperhatikan rotasi EXIF di Chrome terbaru
        try { return kePersegi(bmp, bmp.width, bmp.height); } finally { if (bmp.close) bmp.close(); }
      } catch (e) { /* lanjut ke cara Image */ }
    }
    var url = URL.createObjectURL(file);
    try {
      var im = new Image();
      await new Promise(function (ok, no) { im.onload = ok; im.onerror = function () { no(new Error("File harus berupa gambar")); }; im.src = url; });
      return kePersegi(im, im.naturalWidth || im.width, im.naturalHeight || im.height);
    } finally { URL.revokeObjectURL(url); }
  }

  function kamera(onFoto, onGagal) {
    var md = navigator.mediaDevices;
    if (!md || !md.getUserMedia || !W.isSecureContext) { if (onGagal) onGagal(new Error("Kamera dalam halaman tidak tersedia")); return; }
    var stream = null, depan = true, ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;z-index:99999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;box-sizing:border-box";
    ov.innerHTML = '<div style="position:relative;width:min(88vw,70vh);aspect-ratio:1/1;border-radius:50%;overflow:hidden;border:4px solid #fff;background:#222"><video playsinline muted autoplay style="width:100%;height:100%;object-fit:cover"></video></div>' +
      '<div style="color:#fff;font:600 14px system-ui,sans-serif;text-align:center">Posisikan wajah di dalam lingkaran</div>' +
      '<div style="display:flex;gap:10px;width:min(88vw,420px)"><button type="button" data-a="x" style="flex:1;padding:14px 6px;border-radius:14px;border:1px solid #fff;background:transparent;color:#fff;font:700 15px system-ui,sans-serif">Batal</button>' +
      '<button type="button" data-a="s" style="flex:2;padding:14px 6px;border-radius:14px;border:0;background:#228b4e;color:#fff;font:700 16px system-ui,sans-serif">📸 Ambil foto</button>' +
      '<button type="button" data-a="f" style="flex:1;padding:14px 6px;border-radius:14px;border:1px solid #fff;background:transparent;color:#fff;font:700 15px system-ui,sans-serif">🔄</button></div>';
    var v = ov.querySelector("video");
    function tutup() { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } v.srcObject = null; if (ov.parentNode) ov.parentNode.removeChild(ov); }
    function mulai() {
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      v.style.transform = depan ? "scaleX(-1)" : "none";
      return md.getUserMedia({ video: { facingMode: depan ? "user" : "environment", width: { ideal: 640 }, height: { ideal: 640 } }, audio: false })
        .then(function (s) { stream = s; v.srcObject = s; return v.play(); });
    }
    ov.addEventListener("click", function (e) {
      var a = e.target && e.target.getAttribute && e.target.getAttribute("data-a");
      if (a === "x") tutup();
      else if (a === "f") { depan = !depan; mulai().catch(function () {}); }
      else if (a === "s") {
        if (!v.videoWidth) return;
        var foto = kePersegi(v, v.videoWidth, v.videoHeight);
        tutup(); onFoto(foto);
      }
    });
    document.body.appendChild(ov);
    mulai().catch(function (err) { tutup(); if (onGagal) onGagal(err); });
  }

  /* Simpan isian form otomatis. ids: id elemen yang disimpan. extra: {get:()=>obj, set:obj=>void} untuk foto/lokasi. */
  function draft(kunci, ids, extra) {
    var K = "kalensari_draft_" + kunci, BATAS = 2 * 3600 * 1000;
    function simpan() {
      var d = { t: Date.now(), v: {}, x: extra && extra.get ? extra.get() : null };
      ids.forEach(function (id) { var e = document.getElementById(id); if (e) d.v[id] = e.value; });
      try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) {}
    }
    function pulihkan() {
      var d; try { d = JSON.parse(localStorage.getItem(K) || "null"); } catch (e) {}
      if (!d || Date.now() - d.t > BATAS) { try { localStorage.removeItem(K); } catch (e) {} return false; }
      ids.forEach(function (id) { var e = document.getElementById(id); if (e && d.v[id] != null && !e.value) e.value = d.v[id]; });
      if (extra && extra.set && d.x) extra.set(d.x);
      return true;
    }
    var tmr; function tunda() { clearTimeout(tmr); tmr = setTimeout(simpan, 400); }
    ids.forEach(function (id) { var e = document.getElementById(id); if (e) { e.addEventListener("input", tunda); e.addEventListener("change", tunda); } });
    document.addEventListener("visibilitychange", function () { if (document.hidden) simpan(); });
    W.addEventListener("pagehide", simpan);
    return { simpan: simpan, pulihkan: pulihkan, hapus: function () { clearTimeout(tmr); try { localStorage.removeItem(K); } catch (e) {} } };
  }

  W.KSSelfie = { kamera: kamera, dariFile: dariFile, draft: draft };
})();
