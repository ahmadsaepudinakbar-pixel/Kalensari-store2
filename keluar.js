/* Kalensari Store - menu "🚪 Keluar" di ☰, paling bawah setelah Admin.
   Muncul hanya kalau ada akun yang sedang masuk (Pembeli/Kurir/Penyedia Jasa/Penjual).
   Menghapus status masuk di HP ini; produk, keranjang, dan data akun di database tidak disentuh. */
(function () {
  var ROLES = [
    { k: "pembeli", l: "Pembeli" },
    { k: "kurir", l: "Kurir" },
    { k: "jasa", l: "Penyedia Jasa" },
    { k: "penjual", l: "Penjual" }
  ];
  var key = function (r) { return "kalensari_" + r + "_sess"; };
  var read = function (s, k) { try { return s.getItem(k); } catch (e) { return null; } };
  var drop = function (s, k) { try { s.removeItem(k); } catch (e) {} };
  var active = function () {
    return ROLES.filter(function (r) { return read(localStorage, key(r.k)) || read(sessionStorage, key(r.k)); });
  };
  var say = function (t) { if (typeof window.showToast === "function") window.showToast(t); else alert(t); };

  function init() {
    var menu = document.querySelector(".ks-menu"), btn = document.getElementById("menuBtn");
    if (!menu || !btn) return false;
    if (document.getElementById("ksMenuKeluar")) return true;

    var st = document.createElement("style");
    st.textContent = "#ksMenuKeluar{color:#b83c2b;margin-top:4px;border-top:1px solid #eadfd6;border-radius:0 0 12px 12px}#ksMenuKeluar[hidden]{display:none}";
    document.head.appendChild(st);

    var b = document.createElement("button");
    b.type = "button"; b.id = "ksMenuKeluar"; b.setAttribute("role", "menuitem");
    b.hidden = true; b.textContent = "🚪 Keluar";
    menu.appendChild(b);

    var refresh = function () { b.hidden = active().length === 0; };
    btn.addEventListener("click", refresh, true); // cek ulang setiap kali menu dibuka
    refresh();

    b.addEventListener("click", function () {
      var a = active();
      menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
      if (!a.length) { say("Anda belum masuk"); return; }
      var names = a.map(function (r) { return r.l; }).join(", ");
      if (!confirm("Keluar dari akun " + names + "?")) return;
      ROLES.forEach(function (r) { drop(localStorage, key(r.k)); drop(sessionStorage, key(r.k)); });
      refresh();
      say("Berhasil keluar");
    });
    return true;
  }

  if (!init()) {
    var n = 0, t = setInterval(function () { if (init() || ++n > 30) clearInterval(t); }, 100);
  }
})();
