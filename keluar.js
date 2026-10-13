/* Kalensari Store - menu "🚪 Keluar" di ☰ (paling bawah).
   Muncul hanya kalau ada akun yang sedang masuk di HP ini (Pembeli / Kurir / Penyedia Jasa / Penjual).
   Menghapus semua tanda masuk di HP ini (sesi server, "ingat saya", dan sesi tab), lalu memberi tahu server
   supaya kunci sesinya tidak bisa dipakai lagi (fungsi keluar_akun). Produk, keranjang, favorit, dan data akun
   di database tidak disentuh. Dipasang di index.html setelah script.js. */
(function () {
  var ROLES = [
    { k: "pembeli", l: "Pembeli" },
    { k: "kurir", l: "Kurir" },
    { k: "jasa", l: "Penyedia Jasa" },
    { k: "penjual", l: "Penjual" }
  ];
  // Semua tempat penyimpanan tanda masuk per peran
  var KUNCI = function (r) { return ["kalensari_" + r + "_sess", "kalensari_" + r + "_login", "kalensari_sesi_" + r]; };
  var read = function (s, k) { try { return s.getItem(k); } catch (e) { return null; } };
  var drop = function (s, k) { try { s.removeItem(k); } catch (e) {} };
  var loginBerlaku = function (r) {
    try { var v = JSON.parse(read(localStorage, "kalensari_" + r + "_login") || "null"); return !!(v && v.wa && v.exp > Date.now()); } catch (e) { return false; }
  };
  var active = function () {
    return ROLES.filter(function (r) {
      return read(localStorage, "kalensari_sesi_" + r.k) || loginBerlaku(r.k)
        || read(sessionStorage, "kalensari_" + r.k + "_sess") || read(localStorage, "kalensari_" + r.k + "_sess");
    });
  };
  var say = function (t) { if (typeof window.showToast === "function") window.showToast(t); else alert(t); };
  // Beri tahu server agar kunci sesi ini tidak berlaku lagi (gagal = diabaikan, tetap keluar di HP ini)
  function keluarServer(sesi) {
    var C = window.CLOUD_CONFIG || {};
    if (!sesi || !C.enabled || !C.supabaseUrl) return Promise.resolve();
    return fetch(String(C.supabaseUrl).replace(/\/$/, "") + "/rest/v1/rpc/keluar_akun", {
      method: "POST", keepalive: true,
      headers: { apikey: C.supabaseAnonKey, Authorization: "Bearer " + C.supabaseAnonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_sesi: sesi })
    }).catch(function () {});
  }

  function init() {
    var menu = document.querySelector(".ks-menu"), btn = document.getElementById("menuBtn");
    if (!menu || !btn) return false;
    if (document.getElementById("ksMenuKeluar")) return true;

    var st = document.createElement("style");
    st.textContent = "#ksMenuKeluar{color:#b83c2b!important;margin-top:4px;border-top:1px solid #eadfd6!important;border-radius:0 0 12px 12px!important}#ksMenuKeluar[hidden]{display:none!important}";
    document.head.appendChild(st);

    var b = document.createElement("button");
    b.type = "button"; b.id = "ksMenuKeluar"; b.setAttribute("role", "menuitem");
    b.hidden = true; b.textContent = "🚪 Keluar";
    menu.appendChild(b);

    var refresh = function () {
      var a = active();
      b.hidden = a.length === 0;
      b.textContent = a.length === 1 ? "🚪 Keluar (" + a[0].l + ")" : "🚪 Keluar";
    };
    btn.addEventListener("click", refresh, true); // cek ulang setiap kali menu dibuka
    refresh();

    b.addEventListener("click", async function () {
      var a = active();
      menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
      if (!a.length) { say("Anda belum masuk"); return; }
      var names = a.map(function (r) { return r.l; }).join(", ");
      if (!confirm("Keluar dari akun " + names + " di HP ini?\nUntuk masuk lagi perlu nomor WhatsApp / ID akun dan PIN.")) return;
      var tunggu = [];
      ROLES.forEach(function (r) {
        tunggu.push(keluarServer(read(localStorage, "kalensari_sesi_" + r.k)));
        KUNCI(r.k).forEach(function (k) { drop(localStorage, k); drop(sessionStorage, k); });
      });
      drop(sessionStorage, "kalensari_pin_tmp"); drop(sessionStorage, "kalensari_next");
      refresh();
      say("Berhasil keluar");
      // Muat ulang supaya data pemesan di checkout & "Pesanan Saya" ikut kosong
      await Promise.race([Promise.all(tunggu), new Promise(function (ok) { setTimeout(ok, 1500); })]);
      location.reload();
    });
    return true;
  }

  if (!init()) {
    var n = 0, t = setInterval(function () { if (init() || ++n > 30) clearInterval(t); }, 100);
  }
})();
