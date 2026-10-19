/* =====================================================================
   KALENSARI STORE • Klik LOGO di header -> kartu kecil berisi
   NAMA AKUN PEMBELI + SALDO VOUCHER BELANJA.
   - Belum masuk: kartu ajakan "Masuk / daftar sebagai warga".
   - Memakai fungsi lama: loadBuyer() dan muatSaldoVoucher() dari script.js
     (tidak ada tabel / SQL baru).
   Pasang di index.html PALING BAWAH (setelah banner-tema.js):
     <script src="logo-profil.js?v=1"></script>
   ===================================================================== */
(function () {
  if (window.__logoProfil) return; window.__logoProfil = true;

  var brand = document.querySelector(".header .brand");
  if (!brand) return;

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var rp = function (n) { return "Rp" + new Intl.NumberFormat("id-ID").format(Number(n) || 0); };

  /* ---------- gaya ---------- */
  var st = document.createElement("style");
  st.textContent = [
    ".lp-ov{position:fixed;inset:0;z-index:9990;background:transparent;display:none}",
    ".lp-ov.open{display:block}",
    ".lp-card{position:fixed;z-index:9991;left:14px;width:min(300px,calc(100vw - 28px));background:#fff;border-radius:20px;",
    "padding:16px;box-shadow:0 18px 40px -12px rgba(60,30,10,.45),0 2px 8px rgba(60,30,10,.12);border:1px solid #f0e2d6;",
    "font-family:Nunito,Arial,sans-serif;color:#3b2417;opacity:0;transform:translateY(-8px) scale(.97);transform-origin:top left;",
    "pointer-events:none;transition:opacity .18s,transform .18s}",
    ".lp-card.open{opacity:1;transform:none;pointer-events:auto}",
    ".lp-card::before{content:'';position:absolute;top:-7px;left:var(--lp-arrow,34px);width:14px;height:14px;background:#fff;",
    "border-left:1px solid #f0e2d6;border-top:1px solid #f0e2d6;transform:rotate(45deg)}",
    ".lp-who{display:flex;align-items:center;gap:12px}",
    ".lp-av{width:46px;height:46px;border-radius:50%;flex:none;display:grid;place-items:center;font:800 20px/1 'Baloo 2',Nunito,sans-serif;",
    "color:#fff;background:linear-gradient(135deg,#7a3e20,#b5561f);border:3px solid #f6c453}",
    ".lp-who b{display:block;font:800 16px/1.25 'Baloo 2',Nunito,sans-serif;color:#4a2510;word-break:break-word}",
    ".lp-who small{display:block;color:#8b6d5c;font-size:12px;margin-top:1px}",
    ".lp-saldo{margin-top:14px;display:flex;align-items:center;gap:11px;padding:12px 14px;border-radius:14px;",
    "background:linear-gradient(135deg,#fff3d6,#ffe4a8);border:1px solid #f3d38a}",
    ".lp-saldo i{font-style:normal;font-size:24px}",
    ".lp-saldo span{flex:1;min-width:0}",
    ".lp-saldo small{display:block;font-size:11.5px;font-weight:700;color:#8a5a12}",
    ".lp-saldo b{display:block;font:800 21px/1.2 'Baloo 2',Nunito,sans-serif;color:#5a2d0d}",
    ".lp-btn{display:block;margin-top:12px;text-align:center;text-decoration:none;font-weight:800;font-size:13.5px;",
    "padding:11px 14px;border-radius:12px;background:#5a2d12;color:#fff}",
    ".lp-btn.alt{background:#fff;color:#5a2d12;border:1.5px solid #5a2d12}",
    ".lp-note{margin:0 0 4px;font-size:13px;color:#6c5548;line-height:1.45}",
    ".lp-load{padding:6px 2px;color:#8b6d5c;font-size:13px}"
  ].join("");
  document.head.appendChild(st);

  /* ---------- elemen ---------- */
  var ov = document.createElement("div"); ov.className = "lp-ov";
  var card = document.createElement("div"); card.className = "lp-card";
  card.setAttribute("role", "dialog"); card.setAttribute("aria-label", "Akun pembeli");
  document.body.appendChild(ov); document.body.appendChild(card);

  var cache = null, cacheT = 0, token = 0;

  function masukPembeli() {
    try {
      if (localStorage.getItem("kalensari_sesi_pembeli")) return true;
      var v = JSON.parse(localStorage.getItem("kalensari_pembeli_login") || "null");
      return !!(v && v.wa && v.exp > Date.now());
    } catch (e) { return false; }
  }

  function pergi(url) {
    if (typeof ksGo === "function") ksGo(url); else location.href = url;
  }

  function posisi() {
    var r = brand.getBoundingClientRect();
    var logo = brand.querySelector(".brand-logo") || brand;
    var lr = logo.getBoundingClientRect();
    card.style.top = Math.round(r.bottom + 12) + "px";
    var left = Math.max(10, Math.min(Math.round(r.left), window.innerWidth - card.offsetWidth - 10));
    card.style.left = left + "px";
    card.style.setProperty("--lp-arrow", Math.max(18, Math.round(lr.left + lr.width / 2 - left - 7)) + "px");
  }

  function isi(html) {
    card.innerHTML = html;
    var a = card.querySelectorAll("a[data-go]");
    for (var i = 0; i < a.length; i++) a[i].addEventListener("click", function (e) {
      e.preventDefault(); tutup(); pergi(this.getAttribute("data-go"));
    });
    posisi();
  }

  function tampilTamu() {
    isi('<p class="lp-note">Masuk dulu untuk melihat nama akun dan saldo voucher belanja Anda.</p>' +
      '<a class="lp-btn" href="akun-pembeli.html" data-go="akun-pembeli.html">Masuk / daftar sebagai warga</a>');
  }

  function tampilData(d) {
    var nama = d.nama || "Pembeli";
    isi('<div class="lp-who"><div class="lp-av">' + esc(nama.trim().charAt(0).toUpperCase() || "W") + '</div>' +
      '<div><b>' + esc(nama) + '</b><small>✦ Warga Desa Kalensari</small></div></div>' +
      '<div class="lp-saldo"><i>🎟️</i><span><small>Saldo voucher belanja</small><b>' + rp(d.saldo) + '</b></span></div>' +
      '<a class="lp-btn alt" href="dashboard-pembeli.html" data-go="dashboard-pembeli.html">Buka akun saya</a>');
  }

  async function muat() {
    if (!masukPembeli()) { tampilTamu(); return; }
    if (cache && Date.now() - cacheT < 30000) { tampilData(cache); return; }
    var my = ++token;
    isi('<div class="lp-load">Memuat akun…</div>');
    try {
      var b = typeof loadBuyer === "function" ? await loadBuyer() : null;
      if (my !== token) return;
      if (!b) { tampilTamu(); return; }
      var s = typeof muatSaldoVoucher === "function" ? await muatSaldoVoucher(b.wa) : 0;
      if (my !== token) return;
      cache = { nama: b.nama, saldo: s }; cacheT = Date.now();
      tampilData(cache);
    } catch (e) {
      if (my === token) isi('<p class="lp-note">Akun belum bisa dimuat. Coba lagi sebentar lagi.</p>');
    }
  }

  function buka() {
    ov.classList.add("open"); card.classList.add("open");
    posisi(); muat();
  }
  function tutup() {
    token++; ov.classList.remove("open"); card.classList.remove("open");
  }

  /* klik logo (fase capture supaya tidak ikut lompat ke #home) */
  brand.addEventListener("click", function (e) {
    e.preventDefault(); e.stopPropagation();
    if (card.classList.contains("open")) tutup(); else buka();
  }, true);

  ov.addEventListener("click", tutup);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") tutup(); });
  window.addEventListener("resize", function () { if (card.classList.contains("open")) posisi(); });
  window.addEventListener("scroll", function () { if (card.classList.contains("open")) posisi(); }, { passive: true });

  /* setelah masuk / keluar akun, data lama dibuang */
  window.addEventListener("storage", function () { cache = null; });
})();
