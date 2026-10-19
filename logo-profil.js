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
    ".lp-card{position:fixed;z-index:9991;left:14px;width:max-content;min-width:176px;max-width:min(230px,calc(100vw - 28px));",
    "padding:10px 12px 11px;border-radius:16px;color:#fff3dd;font-family:Nunito,Arial,sans-serif;",
    "background:linear-gradient(150deg,#5a2d12,#34190b);border:1px solid rgba(246,196,83,.38);",
    "box-shadow:0 14px 28px -10px rgba(40,18,6,.6),inset 0 1px 0 rgba(255,255,255,.08);",
    "opacity:0;transform:translateY(-6px) scale(.96);transform-origin:top left;pointer-events:none;transition:opacity .16s,transform .16s}",
    ".lp-card.open{opacity:1;transform:none;pointer-events:auto}",
    ".lp-card::before{content:'';position:absolute;top:-5px;left:var(--lp-arrow,30px);width:10px;height:10px;background:#5a2d12;",
    "border-left:1px solid rgba(246,196,83,.38);border-top:1px solid rgba(246,196,83,.38);transform:rotate(45deg)}",
    ".lp-who{display:flex;align-items:center;gap:9px}",
    ".lp-av{width:32px;height:32px;border-radius:50%;flex:none;display:grid;place-items:center;font:800 15px/1 'Baloo 2',Nunito,sans-serif;",
    "color:#4a2510;background:linear-gradient(135deg,#ffd978,#f0a93a)}",
    ".lp-who b{display:block;font:800 14px/1.2 'Baloo 2',Nunito,sans-serif;color:#fff;word-break:break-word}",
    ".lp-who small{display:block;color:#e6c79a;font-size:10.5px;margin-top:1px;opacity:.9}",
    ".lp-saldo{margin-top:9px;padding:7px 10px;border-radius:11px;background:rgba(255,255,255,.08);border:1px solid rgba(246,196,83,.22)}",
    ".lp-saldo small{display:block;font-size:10px;font-weight:700;letter-spacing:.3px;color:#e6c79a}",
    ".lp-saldo b{display:block;font:800 18px/1.2 'Baloo 2',Nunito,sans-serif;color:#ffd466;white-space:nowrap}",
    ".lp-link{display:block;margin-top:7px;text-align:right;text-decoration:none;font-weight:800;font-size:11px;color:#f6c453}",
    ".lp-note{margin:0 0 7px;font-size:12px;color:#f1dcc0;line-height:1.4;max-width:190px}",
    ".lp-btn{display:block;text-align:center;text-decoration:none;font-weight:800;font-size:12px;padding:8px 12px;border-radius:10px;background:#f6c453;color:#4a2510}",
    ".lp-load{padding:2px;color:#e6c79a;font-size:12px}"
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
    card.style.top = Math.round(r.bottom + 9) + "px";
    var left = Math.max(10, Math.min(Math.round(r.left), window.innerWidth - card.offsetWidth - 10));
    card.style.left = left + "px";
    card.style.setProperty("--lp-arrow", Math.max(14, Math.round(lr.left + lr.width / 2 - left - 5)) + "px");
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
    isi('<p class="lp-note">Masuk dulu untuk melihat nama akun &amp; saldo voucher.</p>' +
      '<a class="lp-btn" href="akun-pembeli.html" data-go="akun-pembeli.html">Masuk / daftar</a>');
  }

  function tampilData(d) {
    var nama = d.nama || "Pembeli";
    isi('<div class="lp-who"><div class="lp-av">' + esc(nama.trim().charAt(0).toUpperCase() || "W") + '</div>' +
      '<div><b>' + esc(nama) + '</b><small>✦ Warga Kalensari</small></div></div>' +
      '<div class="lp-saldo"><small>🎟️ SALDO VOUCHER</small><b>' + rp(d.saldo) + '</b></div>' +
      '<a class="lp-link" href="dashboard-pembeli.html" data-go="dashboard-pembeli.html">Buka akun ›</a>');
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
