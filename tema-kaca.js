/* =====================================================================
   KALENSARI STORE • TEMA "KACA PREMIUM" (Konsep A)
   - Header kapsul kaca melayang, ikon garis dalam kotak lembut,
     keranjang tombol cokelat dengan angka emas.
   - Menu ☰ menjadi PANEL KARTU di bawah header: banner profil + saldo
     voucher, 4 kartu (Kuis Pintar, Lapak Barter, Favorit saya, Kabar Desa),
     daftar "Masuk sebagai" (Penjual, Penyedia Jasa, Kurir), dan Keluar.
   - Tidak mengubah fungsi lama: menu yang dibuat skrip lain (kuis-pemenang.js,
     keluar.js, favorit di script.js) tetap dipakai, hanya disusun ulang.
   Pasang di index.html PALING BAWAH (setelah kuis-pemenang.js), gantikan tema-espresso.js:
     <script src="tema-kaca.js"></script>
   ===================================================================== */
(function () {
  if (window.__temaEspresso || window.__temaKaca) return; window.__temaKaca = true;
  var nav = document.querySelector(".header .nav"), btn = document.getElementById("menuBtn");
  if (!nav || !btn) return;
  document.documentElement.classList.add("tema-esp");

  /* ---------- ikon garis ---------- */
  var P = {
    menu: '<path d="M4 7h16M4 12h11M4 17h16"/>',
    news: '<rect x="3" y="4" width="15" height="16" rx="2.5"/><path d="M18 8h2a1 1 0 0 1 1 1v9a2 2 0 0 1-4 0M7 8h7M7 12h7M7 16h4"/>',
    box: '<path d="M21 8 12 3 3 8l9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>',
    bag: '<path d="M5.5 8h13l-1 12.5h-11L5.5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    store: '<path d="M3 9.5 4.6 4h14.8L21 9.5M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12.5V20h14v-7.5M10 20v-5h4v5"/>',
    cap: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9z"/><path d="M6.5 11v4.5c3 2.5 8 2.5 11 0V11M21.5 9v5"/>',
    swap: '<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.8 20c.8-3.6 3.3-5.5 6.2-5.5s5.4 1.9 6.2 5.5"/><path d="M15.5 5.3a3.4 3.4 0 0 1 0 6.4M17.5 14.8c2 .6 3.3 2.4 3.8 5.2"/>',
    shop: '<path d="M4 10v10h16V10M3 10l2-6h14l2 6zM9 20v-5h6v5"/>',
    hand: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a3.8 3.8 0 0 1 4.9-.4l.5.3a2.3 2.3 0 0 0 1.2.3H21"/><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8"/>',
    moto: '<circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><path d="M8.5 17h6l3-7h-4M5.5 14l3-5h3l3 8M15 6h3"/>',
    out: '<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 8l-4 4 4 4M6 12h10"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 4 8 4a2 2 0 0 0 0 4M12 8s1.5-4 4-4a2 2 0 0 1 0 4"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    dot: '<path d="m9 6 6 6-6 6"/>'
  };
  var ic = function (n, c) { return '<svg class="ksd-ic' + (c ? " " + c : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || P.dot) + "</svg>"; };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var rp = function (n) { return "Rp" + Number(n || 0).toLocaleString("id-ID"); };
  var EMOJI = /^[\s©®‼-㊙️‍☀-➿]*(?:[\uD83C-\uDBFF][\uDC00-\uDFFF][️‍]*)*[\s️]*/;


  /* ---------- gaya ---------- */
  var st = document.createElement("style");
  st.textContent = [
    /* header gaya A "Kaca Premium": kapsul kaca melayang, ikon dalam kotak lembut */
    "html.tema-esp .header{background:linear-gradient(180deg,#fffaf6 55%,rgba(255,250,246,0))!important;border-bottom:0!important;box-shadow:none!important;padding:8px 0 6px}",
    "html.tema-esp .header .nav{height:58px!important;gap:6px!important;padding:0 8px;border-radius:20px;background:rgba(255,255,255,.8);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 10px 30px -14px rgba(58,31,16,.38),inset 0 0 0 1px rgba(255,255,255,.95),0 0 0 1px #eadfd6}",
    "html.tema-esp .header .brand{order:3;margin:0 auto 0 4px!important;color:#4a2510!important;font-weight:900;font-size:20px!important;letter-spacing:.5px!important;white-space:nowrap;line-height:1}",
    "html.tema-esp .header .brand span{color:#b5561f;font-weight:600}",
    "html.tema-esp .header .nav>button{order:4;flex:none;position:relative;width:40px;height:40px;padding:0!important;margin:0!important;border:0!important;border-radius:14px!important;background:#f6ede4!important;color:#5b2e14!important;display:inline-grid;place-items:center;font-size:0!important;cursor:pointer;transition:background .2s,transform .15s}",
    "html.tema-esp .header .nav>button:hover{background:#efe1d4!important}",
    "html.tema-esp .header .nav>button:active{transform:scale(.93)}",
    "html.tema-esp .header #menuBtn{order:1;background:#5b2e14!important;color:#fff!important}",
    "html.tema-esp .header #kabarBtn{order:2}",
    "html.tema-esp .header .ksd-ic{width:21px;height:21px}",
    "html.tema-esp .header .kabar-btn b{position:absolute!important;top:-4px!important;right:-4px!important;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#e8483b!important;color:#fff!important;font:800 10.5px/18px Arial,sans-serif!important;text-align:center;box-shadow:0 0 0 2px #fff!important}",
    "html.tema-esp .header .kabar-btn b[hidden]{display:none!important}",
    "html.tema-esp .header .nav>.cart-btn{order:5!important;width:auto!important;display:inline-flex!important;align-items:center;gap:6px;padding:0 10px 0 11px!important;background:linear-gradient(135deg,#7a3e20,#4a2510)!important;color:#fff!important;box-shadow:0 6px 14px -8px #4a2510}",
    "html.tema-esp .header .nav>.cart-btn:hover{background:linear-gradient(135deg,#86462a,#55301a)!important}",
    "html.tema-esp .header .cart-btn b{position:static!important;display:inline-block!important;width:auto!important;height:auto!important;min-width:20px;background:#f5c542!important;color:#4a2510!important;border-radius:8px!important;font:900 12px/18px Arial,sans-serif!important;padding:0 6px;text-align:center;box-shadow:none!important}",
    "@media(max-width:520px){html.tema-esp .header .container.nav{width:calc(100% - 20px)}html.tema-esp .header .brand{font-size:16px!important}html.tema-esp .header .brand span{display:block;font-size:9.5px;letter-spacing:3.2px;font-weight:800;margin-top:3px}html.tema-esp .header .nav>button{width:38px;height:38px}}",
    "@media(max-width:375px){html.tema-esp .header #shopBtn{display:none!important}}",
    "@media(max-width:340px){html.tema-esp .header .nav{gap:3px!important;padding:0 6px}html.tema-esp .header .nav>button{width:34px;height:34px}html.tema-esp .header .brand{font-size:14px!important}}",
    "html.tema-esp .ksd-ic{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}",
    "html.tema-esp .ksd-ic{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}",
    /* panel kartu (Konsep A) */
    "html.tema-esp .ks-menu{display:flex!important;flex-direction:column;position:fixed!important;top:var(--ksp-top,76px)!important;left:10px!important;right:10px!important;bottom:auto!important;width:auto!important;max-width:460px;min-width:0!important;margin:0 auto;max-height:calc(100vh - var(--ksp-top,76px) - 14px);max-height:calc(100dvh - var(--ksp-top,76px) - 14px);padding:0!important;border:0!important;border-radius:26px!important;background:#fffaf6!important;box-shadow:0 28px 60px -20px rgba(58,31,16,.55),0 0 0 1px rgba(234,223,214,.9)!important;opacity:0;visibility:hidden;transform:translateY(-10px) scale(.98);transform-origin:top left;transition:opacity .2s,transform .24s cubic-bezier(.2,.9,.3,1),visibility 0s .24s}",
    "html.tema-esp .ks-menu.open{opacity:1;visibility:visible;transform:none;transition:opacity .2s,transform .24s cubic-bezier(.2,.9,.3,1)}",
    "html.tema-esp .ksd-dim{position:fixed;inset:0;background:rgba(40,20,8,.38);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);z-index:1190;opacity:0;visibility:hidden;transition:opacity .25s,visibility 0s .25s}",
    "html.tema-esp .ksd-dim.on{opacity:1;visibility:visible;transition:opacity .25s}",
    "html.tema-esp .ksd-scroll{flex:1;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:14px 14px 6px}",
    "html.tema-esp .ks-menu .ksp-ban{display:flex!important;align-items:center;gap:12px;width:auto!important;padding:14px 16px!important;margin:0 0 12px!important;border-radius:20px!important;background:linear-gradient(135deg,#7a3e20,#5a2c14)!important;color:#fff!important;text-decoration:none;font-weight:400!important}",
    "html.tema-esp .ksp-av{flex:none;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#ffe58a,#f0b93a);display:grid;place-items:center;font-size:30px;line-height:1;box-shadow:0 0 0 3px rgba(255,255,255,.22)}",
    "html.tema-esp .ksp-who{min-width:0;flex:1}",
    "html.tema-esp .ksp-who b{display:block;font-size:17px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "html.tema-esp .ksp-who small{display:block;font-size:12.5px;opacity:.85;margin-top:2px;font-weight:600}",
    "html.tema-esp .ksp-sal{flex:none;text-align:right}",
    "html.tema-esp .ksp-sal small{display:block;font-size:11px;opacity:.85;font-weight:600}",
    "html.tema-esp .ksp-sal b{display:block;font-size:18px;font-weight:900;color:#f5c542;white-space:nowrap}",
    "html.tema-esp .ksp-sal[hidden]{display:none!important}",
    "html.tema-esp .ksp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
    "html.tema-esp .ks-menu .ksp-tile{position:relative;display:flex!important;flex-direction:column;align-items:flex-start!important;gap:3px!important;width:auto!important;min-height:112px;padding:12px 12px 12px!important;margin:0!important;border:0!important;border-radius:20px!important;background:#f8efe7!important;color:#3a1f10!important;text-align:left;text-decoration:none;font:inherit;cursor:pointer;transition:transform .12s,background .15s}",
    "html.tema-esp .ks-menu .ksp-tile:hover{background:#f3e6da!important}html.tema-esp .ks-menu .ksp-tile:active{transform:scale(.97)}",
    "html.tema-esp .ksp-em{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:25px;line-height:1;margin-bottom:6px}",
    "html.tema-esp .ksp-tile b{font-size:15.5px;font-weight:900;line-height:1.2}",
    "html.tema-esp .ksp-tile small{font-size:12.5px;color:#7a6455;font-weight:600;line-height:1.3}",
    "html.tema-esp .ksp-tag{position:absolute;top:10px;right:10px;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:900;letter-spacing:.4px;background:#f5c542;color:#4a2510}",
    "html.tema-esp .ksp-tag.baru{background:#4a2510;color:#fff}",
    "html.tema-esp .ksp-sec{font-size:11px;letter-spacing:2px;color:#8f7a6b;font-weight:900;margin:16px 6px 4px}",
    "html.tema-esp .ksp-roles>a{display:flex!important;align-items:center;gap:12px!important;width:100%;padding:9px 6px!important;margin:0!important;border:0!important;border-radius:16px!important;background:none!important;color:#3a1f10!important;text-decoration:none;font:inherit}",
    "html.tema-esp .ksp-roles>a:hover,html.tema-esp .ksp-roles>a:focus-visible{background:#f8efe7!important;outline:none}",
    "html.tema-esp .ksp-roles .ksp-em{width:46px;height:46px;margin:0;background:#f4ece4;font-size:24px}",
    "html.tema-esp .ksp-roles span.t{min-width:0;flex:1}html.tema-esp .ksp-roles span.t b{display:block;font-size:16px;font-weight:900}html.tema-esp .ksp-roles span.t small{display:block;font-size:12.5px;color:#7a6455;font-weight:600;margin-top:1px}",
    "html.tema-esp .ksp-roles .ksd-ic{width:18px;height:18px;color:#9a8678}",
    "html.tema-esp .ksd-foot{border-top:1px solid #eadfd6;margin:0 14px;padding:6px 0 calc(8px + env(safe-area-inset-bottom))}",
    "html.tema-esp .ksd-foot:empty,html.tema-esp .ksd-foot:not(:has(>:not([hidden]))){display:none}",
    "html.tema-esp .ksd-foot>button{display:flex!important;align-items:center;gap:12px!important;width:100%;padding:8px 6px!important;margin:0!important;border:0!important;border-radius:16px!important;background:none!important;color:#c0392b!important;font-family:inherit;font-weight:900;font-size:16px;line-height:1.2;cursor:pointer;text-align:left}",
    "html.tema-esp .ksd-foot>button:hover{background:#fdecea!important}",
    "html.tema-esp #ksMenuKeluar{border-top:0!important;margin:0!important;border-radius:16px!important}",
    "html.tema-esp .ksd-foot>button .ksd-ic{width:46px;height:46px;padding:12px;border-radius:14px;background:#fdecea;color:#c0392b}",
    "html.tema-esp .ks-menu [hidden]{display:none!important}",
    "html.tema-esp.ksd-kunci,html.tema-esp.ksd-kunci body{overflow:hidden!important}",
    "@media(max-width:360px){html.tema-esp .ksp-ban{padding:12px!important}html.tema-esp .ksp-sal b{font-size:15px}html.tema-esp .ksp-av{width:44px;height:44px;font-size:25px}}",
    "@media(prefers-reduced-motion:reduce){html.tema-esp .ks-menu,html.tema-esp .ksd-dim{transition:none!important}}"
  ].join("\n");
  document.head.appendChild(st);

  /* ---------- tombol header: emoji -> ikon garis (badge angka tetap) ---------- */
  function gantiTeks(el, nama) {
    if (!el || el.querySelector(":scope>.ksd-ic")) return;
    [].slice.call(el.childNodes).forEach(function (n) { if (n.nodeType === 3) n.remove(); });
    el.insertAdjacentHTML("afterbegin", ic(nama));
  }
  function hiasHeader() {
    gantiTeks(btn, "menu");
    gantiTeks(document.getElementById("kabarBtn"), "news");
    gantiTeks(document.getElementById("myOrdersBtn"), "box");
    gantiTeks(document.getElementById("cartBtn"), "bag");
    gantiTeks(document.getElementById("shopBtn"), "store");
  }
  hiasHeader();
  new MutationObserver(hiasHeader).observe(nav, { childList: true });

  /* ---------- panel kartu ---------- */
  var m = document.querySelector(".ks-menu");
  if (!m) return;
  var awal = [].slice.call(m.children);
  var fav0 = function () { try { var a = JSON.parse(localStorage.getItem("kalensari_favorit") || "[]"); return Array.isArray(a) ? a.length : 0; } catch (e) { return 0; } };
  var tile = function (cls, em, bg, judul, ket, tag) {
    return '<span class="ksp-em" style="background:' + bg + '">' + em + "</span><b>" + judul + "</b><small>" + ket + "</small>" + (tag ? '<span class="ksp-tag ' + (tag === "BARU" ? "baru" : "") + '">' + tag + "</span>" : "");
  };
  m.innerHTML =
    '<div class="ksd-scroll">' +
      '<a class="ksp-ban" href="akun-pembeli.html"><span class="ksp-av">😊</span><span class="ksp-who"><b>Halo, Warga 👋</b><small>Masuk / daftar sebagai warga</small></span>' +
        '<span class="ksp-sal" hidden><small>Saldo voucher</small><b>Rp0</b></span></a>' +
      '<div class="ksp-grid">' +
        '<a class="ksp-tile" role="menuitem" href="kuis.html">' + tile("", "🎓", "#fdecc8", "Kuis Pintar", "Belajar, dapat voucher", "GRATIS") + "</a>" +
        '<a class="ksp-tile" role="menuitem" href="pasar.html">' + tile("", "🔁", "#dcecfb", "Lapak Barter", "Jual-beli &amp; tukar barang", "BARU") + "</a>" +
        '<button class="ksp-tile" type="button" role="menuitem" data-fav-menu="1" data-ksp="fav">' + tile("", "❤️", "#fde0e0", "Favorit saya", "<i class=\"ksp-nfav\">" + fav0() + "</i> produk disimpan") + "</button>" +
        '<button class="ksp-tile" type="button" role="menuitem" data-ksp="kabar">' + tile("", "📰", "#dff3e6", "Kabar Desa", "<i class=\"ksp-nkabar\">Lihat kabar</i>") + "</button>" +
      "</div>" +
      '<div class="ksp-sec">MASUK SEBAGAI</div>' +
      '<div class="ksp-roles">' +
        '<a role="menuitem" href="penjual.html"><span class="ksp-em">🏪</span><span class="t"><b>Penjual</b><small>Kelola toko &amp; pesanan</small></span>' + ic("dot") + "</a>" +
        '<a role="menuitem" href="akun-jasa.html"><span class="ksp-em">🤝</span><span class="t"><b>Penyedia Jasa</b><small>Tawarkan jasa ke warga</small></span>' + ic("dot") + "</a>" +
        '<a role="menuitem" href="akun-kurir.html"><span class="ksp-em">🛵</span><span class="t"><b>Kurir</b><small>Antar pesanan &amp; paket</small></span>' + ic("dot") + "</a>" +
      "</div>" +
    "</div>" +
    '<div class="ksd-foot"></div>';
  var foot = m.querySelector(".ksd-foot");
  m.querySelectorAll("i").forEach(function (i) { i.style.fontStyle = "normal"; });

  // item bawaan skrip lain: hanya Keluar yang dipindah ke bawah; sisanya sudah punya kartu sendiri
  function taruh(el, awalan) {
    if (!el || el.nodeType !== 1 || el.closest(".ksd-scroll")) return;
    if (!awalan && el.parentNode !== m) return;
    if (el.id === "ksMenuKeluar") {
      foot.appendChild(el); hiasKeluar(el);
      new MutationObserver(function () { hiasKeluar(el); }).observe(el, { childList: true });
    } else if (!el.classList.contains("ksd-scroll") && !el.classList.contains("ksd-foot")) el.remove();
  }
  function hiasKeluar(el) {
    if (el.querySelector(":scope>.ksd-ic")) return;
    var t = el.firstChild; while (t && t.nodeType === 3 && !t.nodeValue.trim()) t = t.nextSibling;
    if (t && t.nodeType === 3) t.nodeValue = t.nodeValue.replace(EMOJI, "");
    el.insertAdjacentHTML("afterbegin", ic("out"));
  }
  awal.forEach(function (el) { if (el.id === "ksMenuKeluar") taruh(el, true); });
  new MutationObserver(function (ms) {
    ms.forEach(function (x) { [].slice.call(x.addedNodes).forEach(taruh); });
  }).observe(m, { childList: true });

  /* buka / tutup: lapisan gelap, kunci gulir, posisi di bawah header, data profil */
  var dim = document.createElement("div"); dim.className = "ksd-dim"; document.body.appendChild(dim);
  function tutup() { m.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  dim.addEventListener("click", tutup);
  m.addEventListener("click", function (e) {
    var t = e.target.closest("[data-ksp]"); if (!t) return;
    var k = t.getAttribute("data-ksp"); tutup();
    if (k === "fav") { if (typeof bukaFavorit === "function") bukaFavorit(true); }
    else if (k === "kabar") { var kb = document.getElementById("kabarBtn"); if (kb) kb.click(); }
  }, true);
  function posisi() {
    var r = nav.getBoundingClientRect();
    m.style.setProperty("--ksp-top", Math.round(r.bottom + 10) + "px");
  }
  addEventListener("resize", posisi);
  btn.addEventListener("click", posisi, true);
  new MutationObserver(function () {
    var buka = m.classList.contains("open");
    dim.classList.toggle("on", buka);
    document.documentElement.classList.toggle("ksd-kunci", buka);
    if (buka) { posisi(); isiDinamis(); muatProfil(); }
  }).observe(m, { attributes: true, attributeFilter: ["class"] });

  function isiDinamis() {
    var f = m.querySelector(".ksp-nfav"); if (f) f.textContent = fav0();
    var kb = document.querySelector("#kabarBtn b"), k = m.querySelector(".ksp-nkabar");
    if (k) k.textContent = kb && !kb.hidden && kb.textContent ? kb.textContent + " kabar baru" : "Lihat kabar";
  }

  var profilT = 0;
  function masukPembeli() {
    try { if (localStorage.getItem("kalensari_sesi_pembeli")) return true; var v = JSON.parse(localStorage.getItem("kalensari_pembeli_login") || "null"); return !!(v && v.wa && v.exp > Date.now()); } catch (e) { return false; }
  }
  // data pembeli (nama + ID akun seperti PB0012) dibaca lewat server dengan sesi masuk
  async function akunSaya() {
    var C = window.CLOUD_CONFIG || {}, sesi = ""; try { sesi = localStorage.getItem("kalensari_sesi_pembeli") || ""; } catch (e) {}
    if (!sesi || !C.enabled || !C.supabaseUrl) return null;
    var r = await fetch(String(C.supabaseUrl).replace(/\/$/, "") + "/rest/v1/rpc/akun_saya", {
      method: "POST", headers: { apikey: C.supabaseAnonKey, Authorization: "Bearer " + C.supabaseAnonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_sesi: sesi, p_peran: "pembeli" })
    });
    var j = null; try { j = await r.json(); } catch (e) {}
    return j && j.ok ? j : null;
  }
  async function muatProfil() {
    var ban = m.querySelector(".ksp-ban"), who = m.querySelector(".ksp-who"), sal = m.querySelector(".ksp-sal");
    if (!masukPembeli()) {
      profilT = 0; sal.hidden = true; ban.setAttribute("href", "akun-pembeli.html");
      who.innerHTML = "<b>Halo, Warga 👋</b><small>Masuk / daftar sebagai warga</small>";
      return;
    }
    ban.setAttribute("href", "dashboard-pembeli.html");
    if (Date.now() - profilT < 60000) return; profilT = Date.now();
    try {
      var j = await akunSaya(); if (!j) { profilT = 0; return; }
      var d = j.data || {}, nama = String(d.nama || "").trim() || "Warga", depan = nama.split(/\s+/)[0];
      who.innerHTML = "<b>Halo, " + esc(depan) + " 👋</b><small>Warga Desa" + (d.kode ? " • " + esc(d.kode) : "") + "</small>";
      var s = typeof muatSaldoVoucher === "function" ? await muatSaldoVoucher(j.wa) : 0;
      sal.querySelector("b").textContent = rp(s); sal.hidden = false;
    } catch (e) { profilT = 0; }
  }
})();
