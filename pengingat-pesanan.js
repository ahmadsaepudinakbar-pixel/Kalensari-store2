/* Kalensari Store • PENGINGAT PESANAN (halaman toko, khusus akun pembeli)
   Kartu kecil di bawah layar: pesanan yang sedang berjalan & pesanan QRIS yang belum dibayar.
   Aturan supaya tidak mengganggu / salah tagih:
     - pesanan berjalan  : muncul sekali per perubahan status (menunggu -> diproses -> dikirim)
     - belum dibayar     : hanya QRIS yang belum lunas & belum kirim bukti, status masih menunggu;
                           muncul lagi paling cepat 30 menit setelah ditutup
     - "Menunggu verifikasi" (bukti sudah dikirim) tidak ditagih; COD tidak pernah ditagih
     - menunggu popup lain (pemenang kuis, absen, modal) ditutup dulu
   Data dari server lewat KSPesanan.baca("pesanan_saya") (pesanan-aman.js). Dipasang di index.html setelah script.js. */
(function () {
  "use strict";
  var LIHAT = "kalensari_ingat_pesanan", JEDA_BAYAR = 30 * 60000;
  var AKTIF = ["menunggu", "baru", "diproses", "dikirim"];
  var LBL = { menunggu: "Menunggu toko", baru: "Menunggu toko", diproses: "Disiapkan toko", dikirim: "Sedang diantar" };
  var IK = { menunggu: "⏳", baru: "⏳", diproses: "👨‍🍳", dikirim: "🛵" };
  var C = function () { return window.CLOUD_CONFIG || {}; };
  var sesi = function () { try { return localStorage.getItem("kalensari_sesi_pembeli") || ""; } catch (e) { return ""; } };
  var LS = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
  var LSset = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var rp = function (n) { return "Rp" + Number(n || 0).toLocaleString("id-ID"); };
  var itemsOf = function (o) { var it = o.items; if (typeof it === "string") { try { it = JSON.parse(it); } catch (e) { it = []; } } return Array.isArray(it) ? it : []; };
  var trOf = function (o) { var x = itemsOf(o)[0]; return x && x.layanan ? x : null; };
  var st = function (o) { return o.status || "menunggu"; };
  // Belum dibayar = QRIS, belum lunas, belum kirim bukti, belum kedaluwarsa, pesanan masih menunggu
  var belumBayar = function (o) {
    return /^qris/i.test(String(o.payment || "")) && ["menunggu", "baru"].indexOf(st(o)) >= 0
      && ["lunas", "verifikasi", "kedaluwarsa", "gagal", "tunggu_wa"].indexOf(o.pay_status || "") < 0;
  };
  var tanda = function (o) { return st(o) + ":" + (o.pay_status || ""); };

  var CSS = false;
  function css() {
    if (CSS) return; CSS = true;
    var s = document.createElement("style");
    s.textContent = [
      "#ksIngat{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translate(-50%,140%);z-index:1400;width:min(440px,calc(100% - 20px));background:#fff;color:#3a1f10;border-radius:20px;box-shadow:0 18px 44px rgba(58,31,16,.32);border:1px solid #ead9c6;transition:transform .35s cubic-bezier(.2,.9,.3,1.1);font-family:inherit}",
      "#ksIngat.on{transform:translate(-50%,0)}",
      "#ksIngat .ki-h{display:flex;align-items:center;gap:8px;padding:12px 12px 6px 16px}#ksIngat .ki-h b{flex:1;font-size:15px;color:#5b2c12}",
      "#ksIngat .ki-x{border:0;background:#f5e8d8;color:#5b2c12;width:30px;height:30px;border-radius:50%;font-size:16px;cursor:pointer;line-height:1}",
      "#ksIngat ul{list-style:none;margin:0;padding:0 12px;max-height:46vh;overflow:auto}",
      "#ksIngat li{display:flex;align-items:center;gap:10px;padding:9px 4px;border-top:1px dashed #ead9c6}#ksIngat li:first-child{border-top:0}",
      "#ksIngat li>i{font-style:normal;font-size:22px;width:36px;height:36px;border-radius:12px;background:#f5e8d8;display:grid;place-items:center;flex:none}",
      "#ksIngat li.bayar>i{background:#fdecea}#ksIngat li div{flex:1;min-width:0}",
      "#ksIngat li b{display:block;font-size:13.5px}#ksIngat li small{display:block;font-size:12px;color:#7a6556;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "#ksIngat li em{font-style:normal;font-size:11px;font-weight:800;border-radius:999px;padding:2px 8px;background:#e3edff;color:#1f55c0;white-space:nowrap}",
      "#ksIngat li.bayar em{background:#fdecea;color:#b42323}#ksIngat li.kirim em{background:#e8e4ff;color:#4b3bb5}",
      "#ksIngat li button{border:0;border-radius:10px;padding:7px 10px;font:inherit;font-weight:800;font-size:12px;cursor:pointer;background:#c0392b;color:#fff;white-space:nowrap}",
      "#ksIngat .ki-a{display:flex;gap:8px;padding:8px 12px 12px}#ksIngat .ki-a button{flex:1;border:0;border-radius:12px;padding:11px;font:inherit;font-weight:800;font-size:14px;cursor:pointer}",
      "#ksIngat .ki-lihat{background:#7b3f1d;color:#fff}#ksIngat .ki-nanti{background:#f5e8d8;color:#5b2c12}"
    ].join("\n");
    document.head.appendChild(s);
  }

  // Ada popup / modal lain yang sedang terbuka?
  function adaPopup() {
    return !!document.querySelector(".kp-pop, .hr-ov, .nb-ov, .modal.show, .ksh-ov, .lacak-ov, [role=dialog][aria-modal=true]:not(#ksIngat)");
  }
  function tungguSepi(fn) {
    var n = 0, t = setInterval(function () { if (!adaPopup()) { clearInterval(t); fn(); } else if (++n > 60) clearInterval(t); }, 1500);
    if (!adaPopup()) { clearInterval(t); fn(); }
  }

  async function ambil() {
    if (!sesi() || !window.KSPesanan || !C().enabled) return [];
    try {
      var r = await KSPesanan.baca("pesanan_saya", { p_sesi: sesi() }, async function () { return []; });
      return Array.isArray(r) ? r : [];
    } catch (e) { return []; }
  }

  function tutup(el) { el.classList.remove("on"); setTimeout(function () { el.remove(); }, 400); }
  function tandaiDilihat(list) {
    var m = LS(LIHAT, {}); if (!m || typeof m !== "object") m = {};
    var now = Date.now();
    list.forEach(function (o) { m[o.order_code] = { s: tanda(o), t: now }; });
    // bersihkan catatan lama (> 7 hari)
    Object.keys(m).forEach(function (k) { if (now - (m[k].t || 0) > 7 * 864e5) delete m[k]; });
    LSset(LIHAT, m);
  }

  async function cek() {
    if (document.getElementById("ksIngat")) return;
    var rows = await ambil(); if (!rows.length) return;
    var uniq = {}; rows.forEach(function (o) { if (o && o.order_code) uniq[o.order_code] = o; });
    var aktif = Object.keys(uniq).map(function (k) { return uniq[k]; }).filter(function (o) { return AKTIF.indexOf(st(o)) >= 0; })
      .sort(function (a, b) { return (belumBayar(b) ? 1 : 0) - (belumBayar(a) ? 1 : 0) || new Date(b.created_at || 0) - new Date(a.created_at || 0); });
    if (!aktif.length) return;
    var m = LS(LIHAT, {}), now = Date.now();
    var perlu = aktif.filter(function (o) {
      var c = m[o.order_code];
      if (!c || c.s !== tanda(o)) return true;                          // baru / status berubah
      return belumBayar(o) && now - (c.t || 0) > JEDA_BAYAR;            // belum bayar: ingatkan lagi tiap 30 menit
    });
    if (!perlu.length) return;
    tungguSepi(function () { tampil(aktif); });
  }

  function tampil(aktif) {
    if (document.getElementById("ksIngat")) return;
    css();
    var bayar = aktif.filter(belumBayar), jalan = aktif.length - bayar.length;
    var judul = bayar.length && jalan ? "📦 " + jalan + " pesanan berjalan • " + bayar.length + " belum dibayar"
      : bayar.length ? "⚠️ " + bayar.length + " pesanan belum dibayar" : "📦 " + jalan + " pesanan sedang berjalan";
    var el = document.createElement("div"); el.id = "ksIngat"; el.setAttribute("role", "status");
    el.innerHTML = '<div class="ki-h"><b>' + esc(judul) + '</b><button type="button" class="ki-x" aria-label="Tutup">✕</button></div><ul>'
      + aktif.slice(0, 4).map(function (o) {
        var t = trOf(o), b = belumBayar(o), s = st(o);
        var isi = t ? (t.layanan === "paket" ? "📦 Kirim paket" : "🛵 Ojek") + " • " + rp(o.total)
          : itemsOf(o).slice(0, 2).map(function (i) { return (i.name || "Item") + " ×" + (i.qty || 1); }).join(", ") + " • " + rp(o.total);
        return '<li class="' + (b ? "bayar" : s === "dikirim" ? "kirim" : "") + '"><i>' + (b ? "💳" : t ? (t.layanan === "paket" ? "📦" : "🛵") : IK[s] || "📦") + "</i><div><b>" + esc(o.order_code) + "</b><small>" + esc(isi) + "</small></div>"
          + (b ? '<button type="button" data-bayar="' + esc(o.order_code) + '">Bayar</button>' : "<em>" + esc(o.pay_status === "verifikasi" && ["menunggu", "baru"].indexOf(s) >= 0 ? "Verifikasi bayar" : (LBL[s] || s)) + "</em>") + "</li>";
      }).join("") + (aktif.length > 4 ? '<li><div><small>+' + (aktif.length - 4) + " pesanan lainnya</small></div></li>" : "") + "</ul>"
      + '<div class="ki-a"><button type="button" class="ki-nanti">Nanti</button><button type="button" class="ki-lihat">Lihat pesanan</button></div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("on"); }); });
    var selesai = function () { tandaiDilihat(aktif); tutup(el); };
    el.querySelector(".ki-x").onclick = selesai;
    el.querySelector(".ki-nanti").onclick = selesai;
    el.querySelector(".ki-lihat").onclick = function () {
      selesai();
      var t = aktif.length === 1 && trOf(aktif[0]);
      if (t) { location.href = "ojek.html?lacak=" + encodeURIComponent(aktif[0].order_code); return; }
      var b = document.getElementById("myOrdersBtn"); if (b) b.click(); else location.href = "dashboard-pembeli.html#pesanan";
    };
    el.querySelectorAll("[data-bayar]").forEach(function (x) {
      x.onclick = function () {
        selesai();
        if (typeof window.bayarQris === "function") { try { window.bayarQris(x.dataset.bayar); return; } catch (e) {} }
        var b = document.getElementById("myOrdersBtn"); if (b) b.click();
      };
    });
  }

  // Jalankan setelah halaman & data toko siap, dan saat aplikasi dibuka lagi dari belakang layar
  function mulai() { setTimeout(cek, 2500); }
  if (document.readyState === "complete") mulai(); else addEventListener("load", mulai);
  var terakhir = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && Date.now() - terakhir > 60000) { terakhir = Date.now(); setTimeout(cek, 1200); }
  });
})();
