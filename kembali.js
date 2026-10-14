/* Kalensari Store • TOMBOL KEMBALI (back) di HP
   Supaya tombol kembali tidak langsung keluar halaman:
     1) tutup dulu jendela / pop-up / menu yang sedang terbuka,
     2) lalu kembali ke halaman utama aplikasi (Beranda / Dashboard),
     3) di halaman utama: "Tekan kembali sekali lagi untuk keluar".
   Pemakaian (setelah file ini dimuat):
     KSKembali.pasang({
       tutup:  () => true/false,   // tutup jendela teratas; true bila ada yang ditutup
       pulang: () => true/false,   // pindah ke halaman utama; true bila berpindah
       lewati: (e) => true/false,  // opsional: abaikan (mis. bingkai halaman lain sedang terbuka)
       pesan:  (teks) => {}        // opsional: cara menampilkan pesan
     }); */
(function () {
  "use strict";
  var ON = false;
  function tampil(t) {
    var el = document.getElementById("ksKbToast");
    if (!el) {
      el = document.createElement("div"); el.id = "ksKbToast"; el.setAttribute("role", "status");
      el.style.cssText = "position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:100000;background:rgba(30,20,12,.92);color:#fff;padding:10px 16px;border-radius:999px;font:600 13.5px system-ui,sans-serif;opacity:0;transition:opacity .2s;pointer-events:none;max-width:calc(100% - 32px);text-align:center";
      document.body.appendChild(el);
    }
    el.textContent = t; el.style.opacity = "1"; clearTimeout(tampil.t); tampil.t = setTimeout(function () { el.style.opacity = "0"; }, 1900);
  }
  function jaga() { try { history.pushState({ ksKembali: 1 }, ""); } catch (e) {} }
  window.KSKembali = {
    // jendela teratas dari daftar pemilih: tombol tutupnya ditekan, kalau tidak ada elemennya dihapus / disembunyikan
    tutupAtas: function (pemilih) {
      var l = [].slice.call(document.querySelectorAll(pemilih)).filter(function (e) { return e.offsetParent !== null || getComputedStyle(e).position === "fixed"; });
      if (!l.length) return false;
      var el = l[l.length - 1];
      var x = el.querySelector(".close,.x,[aria-label=Tutup],[aria-label='Tutup denah'],.pm-x,.pm-shx,.pm-dx,.kp-x,.ki-x,[data-tutup]");
      if (x) { x.click(); return true; }
      if (el.classList.contains("show")) { el.classList.remove("show"); return true; }
      el.remove(); return true;
    },
    pasang: function (o) {
      if (ON) return; ON = true; o = o || {};
      var keluar = 0, pesan = o.pesan || tampil;
      jaga();
      /* Dipanggil tombol kembali ANDROID (aplikasi APK, MainActivity.kt) lewat evaluateJavascript.
         WebView sering melewati riwayat buatan halaman, jadi tombol kembali bertanya ke halaman dulu.
         true = sudah ditangani (tetap di aplikasi), false = boleh keluar aplikasi. */
      window.KSBack = function () {
        try { if (window.KSKamera && KSKamera.tutup && KSKamera.tutup()) return true; } catch (x) {}
        try { if (window.KSNav && KSNav.terbuka && KSNav.terbuka()) { KSNav.tutup(true); return true; } } catch (x) {}
        try { if (o.lewati && o.lewati()) { history.back(); return true; } } catch (x) {}   // halaman/bingkai lain yang mengurus
        var beres = false;
        try { beres = !!(o.tutup && o.tutup()); } catch (x) {}
        if (!beres) { try { beres = !!(o.pulang && o.pulang()); } catch (x) {} }
        if (beres) return true;
        if (Date.now() - keluar < 2000) return false;
        keluar = Date.now(); pesan("Tekan kembali sekali lagi untuk keluar"); return true;
      };
      addEventListener("popstate", function (e) {
        if (o.lewati && o.lewati(e)) return;
        var beres = false;
        try { beres = !!(o.tutup && o.tutup()); } catch (x) {}
        if (!beres) { try { beres = !!(o.pulang && o.pulang()); } catch (x) {} }
        if (!beres) {
          if (Date.now() - keluar < 2000) { history.back(); return; }
          keluar = Date.now(); pesan("Tekan kembali sekali lagi untuk keluar");
        }
        jaga();
      });
    }
  };
})();
