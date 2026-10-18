/* =====================================================================
   KALENSARI STORE • TEMA BARU "Hangat Beranda"  (pasangan tema-baru.css)
   Hanya menyambungkan tampilan baru ke fitur yang SUDAH ADA:
   - kolom cari di header  -> panel pencarian cepat (searchFloat)
   - ikon bel              -> Kabar Desa (kabarBtn)
   - nav bawah             -> Pesanan Saya, Favorit, Menu Akun (☰)
   - banner geser          -> dot, geser otomatis, foto dari produk toko
   - banner promo          -> filter produk yang sedang promo
   Dipasang PALING BAWAH di index.html (setelah tema-kaca.js).
   ===================================================================== */
(function () {
  "use strict";
  var d = document, w = window, root = d.documentElement;
  var $ = function (id) { return d.getElementById(id); };
  var gerakKurang = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------
     1. HEADER: ikon bel, badge keranjang, tombol cari
     --------------------------------------------------------------- */
  var BEL = '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4z"/><path d="M10 20.8a2.2 2.2 0 0 0 4 0"/>';
  function ikonBel() {
    var k = $("kabarBtn"); if (!k) return;
    var s = k.querySelector(".ksd-ic");
    if (s && !s.getAttribute("data-bel")) { s.innerHTML = BEL; s.setAttribute("data-bel", "1"); }
  }
  function badgeKeranjang() {
    var b = $("cartCount"); if (!b) return;
    b.classList.toggle("nol", !(parseInt(b.textContent, 10) > 0));
  }
  var nav = d.querySelector(".header .nav");
  ikonBel(); badgeKeranjang();
  if (nav) new MutationObserver(function () { ikonBel(); badgeKeranjang(); })
    .observe(nav, { childList: true, subtree: true, characterData: true });

  function bukaCari(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    var f = $("searchFloat"); if (!f) return;
    var hs = $("hdrSearch"), r = hs && hs.getBoundingClientRect();
    var top = (!root.classList.contains("hs-stuck") && r && r.bottom > 0) ? r.bottom + 8 : 84;
    root.style.setProperty("--qs-top", Math.round(top) + "px");
    f.click();
  }
  if ($("hdrSearch")) $("hdrSearch").addEventListener("click", bukaCari);
  if ($("hdrSearchMini")) $("hdrSearchMini").addEventListener("click", bukaCari);

  // header menyisakan baris atas saat digulir: tampilkan ikon cari kecil
  function saatGulir() { root.classList.toggle("hs-stuck", (w.pageYOffset || root.scrollTop) > 72); }
  w.addEventListener("scroll", saatGulir, { passive: true }); saatGulir();

  /* ---------------------------------------------------------------
     2. FILTER PROMO (mengikuti pola "Favorit" di script.js)
     --------------------------------------------------------------- */
  var hanyaPromo = false;
  function ada(fn) { try { return typeof fn === "function"; } catch (e) { return false; } }

  var _render = w.renderProducts;
  if (ada(_render)) {
    w.renderProducts = function () {
      var hasil;
      if (!hanyaPromo) { hasil = _render.apply(this, arguments); }
      else {
        var simpan = products;
        try {
          var promoGrup = {};
          simpan.forEach(function (p) { if (promoOn(p) && groupName(p)) promoGrup[groupName(p).toLowerCase()] = 1; });
          products = simpan.filter(function (p) { return promoOn(p) || (groupName(p) && promoGrup[groupName(p).toLowerCase()]); });
          hasil = _render.apply(this, arguments);
        } finally { products = simpan; }
        var bar = $("sellerFilterBar");
        if (bar) { bar.hidden = false; bar.innerHTML = '<span>🏷️ Produk promo</span><button type="button" onclick="bukaPromo(false)">× Semua produk</button>'; }
        var gr = $("productGrid");
        if (gr && !gr.querySelector(".product")) gr.innerHTML = '<div class="empty-state"><b>Belum ada produk promo</b>Promo baru akan tampil di sini.</div>';
      }
      try { segarkanFoto(); segarkanNav(); } catch (e) {}
      return hasil;
    };
  }

  w.bukaPromo = function (on) {
    on = (on === undefined) ? true : !!on;
    hanyaPromo = on;
    if (on) {
      try { if (hanyaFavorit) hanyaFavorit = false; } catch (e) {}
      try { activeCategory = "Semua"; activeSeller = ""; renderCategories(); } catch (e) {}
    }
    renderProducts();
    var g = $("productGrid");
    if (on && g) g.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // filter lain mematikan filter promo
  ["setCategory", "setSeller"].forEach(function (n) {
    var asli = w[n]; if (!ada(asli)) return;
    w[n] = function () { hanyaPromo = false; return asli.apply(this, arguments); };
  });
  (function () {
    var asli = w.bukaFavorit; if (!ada(asli)) return;
    w.bukaFavorit = function (on) { if (on === undefined || on) hanyaPromo = false; return asli.apply(this, arguments); };
  })();

  function adaPromo() { try { return products.some(function (p) { return p && p.status === "Show" && promoOn(p); }); } catch (e) { return false; } }

  if ($("promoBtn")) $("promoBtn").addEventListener("click", function () {
    if (adaPromo()) return w.bukaPromo(true);
    var hr = $("hrPromo");                       // promo ongkir dari program harian
    if (hr && !hr.hidden) return hr.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof showToast === "function") showToast("Belum ada promo hari ini. Cek lagi nanti ya!");
    var p = $("products"); if (p) p.scrollIntoView({ behavior: "smooth" });
  });

  if ($("lihatSemua")) $("lihatSemua").addEventListener("click", function () {
    hanyaPromo = false;
    try { if (hanyaFavorit) bukaFavorit(false); } catch (e) {}
    if (ada(w.setCategory)) w.setCategory("Semua");
  });

  /* ---------------------------------------------------------------
     3. FOTO BANNER & PROMO dari produk yang ada di toko
     --------------------------------------------------------------- */
  function pasangFoto(kotak, p) {
    if (!kotak || !p) return;
    var im = kotak.querySelector("img"); if (!im) return;
    kotak.setAttribute("data-pid", p.id);
    im.onload = function () { im.hidden = false; kotak.classList.add("has-img"); };
    im.onerror = function () { im.hidden = true; kotak.classList.remove("has-img"); };
    im.alt = "";
    im.src = getProductImage(p.image);
  }
  function masihAda(kotak) {
    var id = kotak && kotak.getAttribute("data-pid"); if (!id) return false;
    return products.some(function (p) { return String(p.id) === id && p.status === "Show"; });
  }
  function segarkanFoto() {
    if (typeof products === "undefined" || !products || !products.length || !ada(w.getProductImage)) return;
    var tampil = products.filter(function (p) { return p && p.status === "Show" && p.image; });
    if (!tampil.length) return;
    var hari = Math.floor(Date.now() / 864e5);

    var hero = $("heroImg");
    if (hero && !masihAda(hero)) {
      var makanan = tampil.filter(function (p) { return /nasi|ayam|seblak|mie|bakso|geprek|sate|soto/i.test(p.name + " " + p.category); });
      var sumber = makanan.length ? makanan : tampil;
      pasangFoto(hero, sumber[hari % sumber.length]);
    }

    var promoBox = $("promoImg");
    if (promoBox && !masihAda(promoBox)) {
      var promo = tampil.filter(function (p) { return promoOn(p); });
      var lain = tampil.filter(function (p) { return /es |kopi|teh|jus|boba|susu|minum/i.test(p.name + " " + p.category); });
      var pilih = promo.length ? promo : (lain.length ? lain : tampil);
      var p = pilih[(hari + 1) % pilih.length];
      pasangFoto(promoBox, p);
      var tx = d.querySelector("#promoWrap .pc-tx p");
      if (tx) tx.textContent = promo.length && ada(w.rupiah)
        ? p.name + " kini hanya " + rupiah(currentPrice(p)) + ". Jangan sampai terlewat!"
        : "Jangan lewatkan menu favorit dengan harga terbaik.";
    }
  }
  segarkanFoto();

  /* ---------------------------------------------------------------
     4. BANNER GESER
     --------------------------------------------------------------- */
  (function () {
    var tr = $("heroTrack"), dots = $("heroDots"); if (!tr || !dots) return;
    var n = tr.children.length, cur = 0, jeda = 0, timer;
    for (var i = 0; i < n; i++) {
      var b = d.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", "Banner " + (i + 1));
      (function (k) { b.addEventListener("click", function () { ke(k); jeda = Date.now() + 9000; }); })(i);
      dots.appendChild(b);
    }
    function tandai() {
      [].forEach.call(dots.children, function (x, k) { x.classList.toggle("on", k === cur); });
    }
    function ke(k) { tr.scrollTo({ left: k * tr.clientWidth, behavior: gerakKurang ? "auto" : "smooth" }); }
    var rf;
    tr.addEventListener("scroll", function () {
      cancelAnimationFrame(rf);
      rf = requestAnimationFrame(function () {
        var k = Math.round(tr.scrollLeft / (tr.clientWidth || 1));
        if (k !== cur) { cur = k; tandai(); }
      });
    }, { passive: true });
    ["touchstart", "pointerdown", "mouseenter", "focusin"].forEach(function (ev) {
      tr.addEventListener(ev, function () { jeda = Date.now() + 9000; }, { passive: true });
    });
    function terlihat() { var r = tr.getBoundingClientRect(); return r.bottom > 0 && r.top < (w.innerHeight || 0); }
    if (!gerakKurang) {
      timer = setInterval(function () {
        if (d.hidden || Date.now() < jeda || !terlihat()) return;
        ke((cur + 1) % n);
      }, 5500);
    }
    tandai();
  })();

  /* ---------------------------------------------------------------
     5. NAVIGASI BAWAH
     --------------------------------------------------------------- */
  var bn = $("bottomNav");
  function sedangAktif() {
    var menu = d.querySelector(".ks-menu");
    if (menu && menu.classList.contains("open")) return "akun";
    if (d.querySelector("#myOrdersModal.show")) return "orders";
    try { if (hanyaFavorit) return "fav"; } catch (e) {}
    return "home";
  }
  function segarkanNav() {
    if (!bn) return;
    var a = sedangAktif();
    [].forEach.call(bn.querySelectorAll(".bn"), function (b) { b.classList.toggle("on", b.getAttribute("data-nav") === a); });
  }
  if (bn) {
    bn.addEventListener("click", function (e) {
      var b = e.target.closest(".bn"); if (!b) return;
      var k = b.getAttribute("data-nav");
      if (k === "home") {
        hanyaPromo = false;
        try { if (hanyaFavorit) bukaFavorit(false); } catch (x) {}
        try {
          if (activeSeller || activeCategory !== "Semua") { activeSeller = ""; activeCategory = "Semua"; renderCategories(); }
          renderProducts();
        } catch (x) {}
        w.scrollTo({ top: 0, behavior: gerakKurang ? "auto" : "smooth" });
      } else if (k === "orders") {
        var o = $("myOrdersBtn"); if (o) o.click();
      } else if (k === "fav") {
        try { if (ada(w.bukaFavorit)) bukaFavorit(!hanyaFavorit); } catch (x) {}
      } else if (k === "akun") {
        e.stopPropagation();   // supaya klik ini tidak langsung menutup menu (pendengar dokumen script.js)
        var m = $("menuBtn"); if (m) m.click();
      }
      setTimeout(segarkanNav, 0);
    });
    var menu = d.querySelector(".ks-menu");
    if (menu) new MutationObserver(segarkanNav).observe(menu, { attributes: true, attributeFilter: ["class"] });
    var mo = $("myOrdersModal");
    if (mo) new MutationObserver(segarkanNav).observe(mo, { attributes: true, attributeFilter: ["class"] });
    segarkanNav();
  }
})();
