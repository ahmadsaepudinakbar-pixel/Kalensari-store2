/* Kalensari Store • DERING SEPERTI TELEPON (penjual, kurir, admin-notif)
   Saat aplikasi sedang terbuka dan ada pesanan / kabar penting:
     - lagu pesanan-masuk.mp3 diputar berulang (loop) seperti nada dering telepon,
     - HP bergetar panjang berulang,
     - tampil layar "panggilan masuk" (bisa dimatikan bila halaman punya pop-up sendiri),
   sampai ditekan "Lihat" / "Diam", syarat selesai terpenuhi, atau 60 detik.
   Catatan: browser HP baru mengizinkan suara setelah layar pernah disentuh sekali.
   Pemakaian:
     KSDering.mulai({judul, isi, ikon, lihat:"Lihat pesanan", onLihat(){}, layar:true, sampai(){return false}})
     KSDering.stop()  •  KSDering.tes() */
(function () {
  "use strict";
  var LAGU = "pesanan-masuk.mp3", MAKS = 60000, GETAR = [800, 400, 800, 400, 800, 1200];
  var audio = null, aktif = false, tGetar = null, tCek = null, tMaks = null, opsi = {}, siap = false;
  function buatAudio() { if (!audio) { audio = new Audio(LAGU); audio.loop = true; audio.preload = "auto"; audio.volume = 1; } return audio; }
  // "Buka kunci" suara pada sentuhan pertama (aturan autoplay browser HP)
  function bukaKunci() {
    if (siap) return; siap = true;
    try { var a = buatAudio(); a.muted = true; var p = a.play(); if (p && p.then) p.then(function () { if (!aktif) { a.pause(); a.currentTime = 0; } a.muted = false; }).catch(function () { a.muted = false; siap = false; }); } catch (e) { siap = false; }
  }
  ["pointerdown", "touchend", "keydown", "click"].forEach(function (ev) { document.addEventListener(ev, bukaKunci, { passive: true }); });

  var CSS = false;
  function css() {
    if (CSS) return; CSS = true;
    var s = document.createElement("style");
    s.textContent = [
      "#ksDering{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:calc(48px + env(safe-area-inset-top,0px)) 24px calc(40px + env(safe-area-inset-bottom,0px));color:#fff;text-align:center;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:radial-gradient(120% 80% at 50% 0%,#2f6f4f 0%,#123526 55%,#0b2118 100%);animation:ksdIn .25s ease}",
      "@keyframes ksdIn{from{opacity:0}to{opacity:1}}",
      "#ksDering .kd-top small{display:block;font-size:14px;letter-spacing:.08em;opacity:.8;text-transform:uppercase}",
      "#ksDering .kd-top b{display:block;font-size:26px;margin-top:10px;line-height:1.25}",
      "#ksDering .kd-top p{margin:10px auto 0;font-size:16px;opacity:.9;max-width:320px;line-height:1.45}",
      "#ksDering .kd-ring{position:relative;width:150px;height:150px;display:grid;place-items:center}",
      "#ksDering .kd-ring span{position:absolute;inset:0;border-radius:50%;border:3px solid rgba(255,255,255,.35);animation:ksdPulse 1.6s ease-out infinite}",
      "#ksDering .kd-ring span:nth-child(2){animation-delay:.55s}#ksDering .kd-ring span:nth-child(3){animation-delay:1.1s}",
      "@keyframes ksdPulse{from{transform:scale(.6);opacity:1}to{transform:scale(1.5);opacity:0}}",
      "#ksDering .kd-ic{width:110px;height:110px;border-radius:50%;background:#fff;color:#123526;display:grid;place-items:center;font-size:52px;box-shadow:0 10px 30px rgba(0,0,0,.35);animation:ksdGoyang 1s ease-in-out infinite}",
      "@keyframes ksdGoyang{0%,100%{transform:rotate(0)}10%,30%{transform:rotate(-12deg)}20%,40%{transform:rotate(12deg)}50%{transform:rotate(0)}}",
      "#ksDering .kd-act{display:flex;gap:40px;justify-content:center;width:100%}",
      "#ksDering .kd-act button{border:0;background:none;color:#fff;font:600 14px system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer}",
      "#ksDering .kd-act i{font-style:normal;width:72px;height:72px;border-radius:50%;display:grid;place-items:center;font-size:30px;box-shadow:0 8px 20px rgba(0,0,0,.3)}",
      "#ksDering .kd-diam i{background:#e5484d}#ksDering .kd-lihat i{background:#2ecc71;animation:ksdNaik 1.2s ease-in-out infinite}",
      "@keyframes ksdNaik{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}",
      "#ksDering .kd-bunyi{margin-top:14px;border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.12);color:#fff;border-radius:999px;padding:8px 16px;font:600 13px system-ui,sans-serif;cursor:pointer}"
    ].join("\n");
    document.head.appendChild(s);
  }
  function putar() {
    var a = buatAudio(); a.muted = false;
    try { a.currentTime = 0; } catch (e) {}
    var p = a.play();
    if (p && p.catch) p.catch(function () { var b = document.querySelector("#ksDering .kd-bunyi"); if (b) b.hidden = false; });
  }
  function getar() { try { navigator.vibrate && navigator.vibrate(GETAR); } catch (e) {} }
  function layar() {
    css(); var el = document.getElementById("ksDering");
    if (!el) { el = document.createElement("div"); el.id = "ksDering"; el.setAttribute("role", "alertdialog"); el.setAttribute("aria-modal", "true"); document.body.appendChild(el); }
    el.innerHTML = '<div class="kd-top"><small>' + esc(opsi.label || "Kalensari Store") + '</small><b>' + esc(opsi.judul || "Pesanan baru masuk!") + "</b>" + (opsi.isi ? "<p>" + esc(opsi.isi) + "</p>" : "")
      + '<button type="button" class="kd-bunyi" hidden>🔊 Ketuk untuk membunyikan</button></div>'
      + '<div class="kd-ring"><span></span><span></span><span></span><div class="kd-ic">' + esc(opsi.ikon || "🔔") + "</div></div>"
      + '<div class="kd-act"><button type="button" class="kd-diam"><i>🔕</i>Diam</button><button type="button" class="kd-lihat"><i>' + esc(opsi.ikonLihat || "📋") + "</i>" + esc(opsi.lihat || "Lihat") + "</button></div>";
    el.querySelector(".kd-bunyi").onclick = function () { this.hidden = true; putar(); };
    el.querySelector(".kd-diam").onclick = function () { stop(); };
    el.querySelector(".kd-lihat").onclick = function () { var f = opsi.onLihat; stop(); if (f) try { f(); } catch (e) {} };
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function stop() {
    aktif = false; clearInterval(tGetar); clearInterval(tCek); clearTimeout(tMaks);
    try { if (audio) { audio.pause(); audio.currentTime = 0; } } catch (e) {}
    try { navigator.vibrate && navigator.vibrate(0); } catch (e) {}
    var el = document.getElementById("ksDering"); if (el) el.remove();
  }
  function mulai(o) {
    opsi = o || {};
    var sudah = aktif; aktif = true;
    if (opsi.layar !== false) layar();
    if (!sudah) { putar(); getar(); tGetar = setInterval(getar, 4400); }
    clearInterval(tCek); if (typeof opsi.sampai === "function") tCek = setInterval(function () { try { if (opsi.sampai()) stop(); } catch (e) {} }, 500);
    clearTimeout(tMaks); tMaks = setTimeout(stop, opsi.maks || MAKS);
  }
  window.KSDering = { mulai: mulai, stop: stop, aktif: function () { return aktif; },
    tes: function () { mulai({ judul: "Tes nada dering", isi: "Seperti ini bunyinya saat ada pesanan masuk.", ikon: "🔔", lihat: "OK", ikonLihat: "👍", maks: 15000 }); } };
})();
