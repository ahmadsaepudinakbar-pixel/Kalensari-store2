/* Kalensari Store • DERING SEPERTI TELEPON (penjual, kurir, admin-notif)
   Saat aplikasi sedang terbuka dan ada pesanan / kabar penting:
     - lagu pesanan-masuk.mp3 diputar berulang (loop) seperti nada dering telepon,
     - HP bergetar panjang berulang,
     - tampil panel "panggilan masuk" di sepertiga atas layar (bisa dimatikan bila halaman punya pop-up sendiri),
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
      "#ksDering{position:fixed;left:50%;top:0;transform:translateX(-50%);width:100%;max-width:520px;height:min(34vh,290px);min-height:220px;z-index:2147483000;display:flex;flex-direction:column;justify-content:space-between;gap:8px;padding:calc(16px + env(safe-area-inset-top,0px)) 18px 16px;color:#fff;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;border-radius:0 0 24px 24px;box-shadow:0 10px 40px rgba(0,0,0,.4);background:radial-gradient(120% 120% at 50% 0%,#2f6f4f 0%,#123526 60%,#0b2118 100%);animation:ksdIn .3s cubic-bezier(.2,.9,.3,1.1)}",
      "@keyframes ksdIn{from{transform:translate(-50%,-100%)}to{transform:translate(-50%,0)}}",
      "#ksDering .kd-main{display:flex;align-items:center;gap:14px;min-height:0}",
      "#ksDering .kd-top{flex:1;min-width:0}",
      "#ksDering .kd-top small{display:block;font-size:11.5px;letter-spacing:.08em;opacity:.8;text-transform:uppercase}",
      "#ksDering .kd-top b{display:block;font-size:19px;margin-top:3px;line-height:1.25}",
      "#ksDering .kd-top p{margin:4px 0 0;font-size:13.5px;opacity:.9;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      "#ksDering .kd-ring{position:relative;flex:none;width:74px;height:74px;display:grid;place-items:center}",
      "#ksDering .kd-ring span{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(255,255,255,.4);animation:ksdPulse 1.6s ease-out infinite}",
      "#ksDering .kd-ring span:nth-child(2){animation-delay:.55s}#ksDering .kd-ring span:nth-child(3){animation-delay:1.1s}",
      "@keyframes ksdPulse{from{transform:scale(.7);opacity:1}to{transform:scale(1.45);opacity:0}}",
      "#ksDering .kd-ic{width:62px;height:62px;border-radius:50%;background:#fff;color:#123526;display:grid;place-items:center;font-size:30px;box-shadow:0 6px 18px rgba(0,0,0,.3);animation:ksdGoyang 1s ease-in-out infinite}",
      "@keyframes ksdGoyang{0%,100%{transform:rotate(0)}10%,30%{transform:rotate(-12deg)}20%,40%{transform:rotate(12deg)}50%{transform:rotate(0)}}",
      "#ksDering .kd-act{display:flex;gap:12px;width:100%}",
      "#ksDering .kd-act button{flex:1;border:0;border-radius:16px;color:#fff;font:700 15px system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 10px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.25)}",
      "#ksDering .kd-act i{font-style:normal;font-size:20px}",
      "#ksDering .kd-diam{background:#e5484d}#ksDering .kd-lihat{background:#2ecc71;flex:1.4!important}",
      "#ksDering .kd-bunyi{margin-top:6px;border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.12);color:#fff;border-radius:999px;padding:5px 12px;font:600 12px system-ui,sans-serif;cursor:pointer}"
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
    el.innerHTML = '<div class="kd-main"><div class="kd-ring"><span></span><span></span><span></span><div class="kd-ic">' + esc(opsi.ikon || "🔔") + "</div></div>"
      + '<div class="kd-top"><small>' + esc(opsi.label || "Kalensari Store") + '</small><b>' + esc(opsi.judul || "Pesanan baru masuk!") + "</b>" + (opsi.isi ? "<p>" + esc(opsi.isi) + "</p>" : "")
      + '<button type="button" class="kd-bunyi" hidden>🔊 Ketuk untuk membunyikan</button></div></div>'
      + '<div class="kd-act"><button type="button" class="kd-diam"><i>🔕</i>Diam</button><button type="button" class="kd-lihat"><i>' + esc(opsi.ikonLihat || "📋") + "</i>" + esc(opsi.lihat || "Lihat") + "</button></div>";
    el.querySelector(".kd-bunyi").onclick = function () { this.hidden = true; putar(); };
    el.querySelector(".kd-diam").onclick = function () { stop(); };
    el.querySelector(".kd-lihat").onclick = function () { var f = opsi.onLihat; stop(); if (f) try { f(); } catch (e) {} };
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // Aplikasi Android (WebView): hentikan juga dering notifikasi bawaan HP
  function diamApp() { try { window.KalensariApp && window.KalensariApp.diam && window.KalensariApp.diam(); } catch (e) {} }
  function stop() {
    diamApp();
    aktif = false; clearInterval(tGetar); clearInterval(tCek); clearTimeout(tMaks);
    try { if (audio) { audio.pause(); audio.currentTime = 0; } } catch (e) {}
    try { navigator.vibrate && navigator.vibrate(0); } catch (e) {}
    var el = document.getElementById("ksDering"); if (el) el.remove();
  }
  function mulai(o) {
    opsi = o || {};
    // aplikasi sedang dibuka -> dering halaman ini yang dipakai, dering bawaan HP dihentikan agar tidak dobel
    if (document.visibilityState === "visible") diamApp();
    var sudah = aktif; aktif = true;
    if (opsi.layar !== false) layar();
    if (!sudah) { putar(); getar(); tGetar = setInterval(getar, 4400); }
    clearInterval(tCek); if (typeof opsi.sampai === "function") tCek = setInterval(function () { try { if (opsi.sampai()) stop(); } catch (e) {} }, 500);
    clearTimeout(tMaks); tMaks = setTimeout(stop, opsi.maks || MAKS);
  }
  /* Android 14+: izin "tampil layar penuh" agar panggilan pesanan muncul walau HP terkunci */
  function cekLayarPenuh() {
    var A = window.KalensariApp, el = document.getElementById("ksLayarPenuh");
    var perlu = false; try { perlu = !!(A && A.layarPenuhAktif && !A.layarPenuhAktif()); } catch (e) {}
    if (!perlu) { if (el) el.remove(); return; }
    if (el || !document.body) return;
    el = document.createElement("div"); el.id = "ksLayarPenuh"; el.setAttribute("role", "alert");
    el.style.cssText = "position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:99999;max-width:520px;margin:0 auto;background:#123526;color:#fff;border-radius:16px;padding:12px 14px;box-shadow:0 8px 24px rgba(0,0,0,.3);font:500 13.5px/1.4 system-ui,sans-serif;display:flex;gap:10px;align-items:center";
    el.innerHTML = '<span style="font-size:24px">📞</span><span style="flex:1"><b style="display:block;font-size:14px">Aktifkan panggilan layar penuh</b>Agar pesanan muncul seperti telepon saat HP terkunci.</span><button type="button" style="border:0;border-radius:999px;background:#2ecc71;color:#fff;font:700 13px system-ui,sans-serif;padding:9px 14px;cursor:pointer">Izinkan</button>';
    el.querySelector("button").onclick = function () { try { A.bukaIzinLayarPenuh(); } catch (e) {} };
    document.body.appendChild(el);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cekLayarPenuh); else cekLayarPenuh();
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") cekLayarPenuh(); });

  window.KSDering = { mulai: mulai, stop: stop, aktif: function () { return aktif; },
    tes: function () { mulai({ judul: "Tes nada dering", isi: "Seperti ini bunyinya saat ada pesanan masuk.", ikon: "🔔", lihat: "OK", ikonLihat: "👍", maks: 15000 }); } };
})();
