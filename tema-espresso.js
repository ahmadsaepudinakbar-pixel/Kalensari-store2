/* =====================================================================
   KALENSARI STORE • TEMA header "KACA PREMIUM" + menu ☰ "ESPRESSO EMAS"
   - Header kapsul kaca melayang, ikon garis dalam kotak lembut,
     keranjang tombol cokelat dengan angka emas.
   - Menu ☰ menjadi laci gelap dari kiri: profil + saldo voucher,
     bagian JELAJAHI (Kuis, Lapak Barter, Favorit, Daftar Toko) dan AKUN.
   - Tidak mengubah fungsi lama: tombol & menu yang dibuat skrip lain
     (harian.js, kuis-pemenang.js, keluar.js, favorit) tetap dipakai,
     hanya dipercantik dan disusun ulang.
   Pasang di index.html PALING BAWAH (setelah kuis-pemenang.js):
     <script src="tema-espresso.js"></script>
   ===================================================================== */
(function () {
  if (window.__temaEspresso) return; window.__temaEspresso = true;
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
  var G = "#d9a441", G2 = "#f1d08a";
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
    /* laci */
    "html.tema-esp .ks-menu{display:flex!important;flex-direction:column;position:fixed!important;left:0!important;top:0!important;bottom:0;height:100%;width:min(330px,86vw);min-width:0!important;max-height:none;border:0!important;border-radius:0 24px 24px 0!important;padding:0!important;overflow:hidden;background:linear-gradient(180deg,#2c160a,#40200f 55%,#2c160a)!important;color:#f5e6c8;box-shadow:24px 0 60px rgba(0,0,0,.5)!important;transform:translateX(-104%);visibility:hidden;transition:transform .32s cubic-bezier(.2,.9,.3,1),visibility 0s .32s;z-index:1200!important}",
    "html.tema-esp .ks-menu.open{transform:none;visibility:visible;transition:transform .32s cubic-bezier(.2,.9,.3,1)}",
    "html.tema-esp .ksd-dim{position:fixed;inset:0;background:rgba(20,10,4,.55);backdrop-filter:blur(2px);z-index:1190;opacity:0;visibility:hidden;transition:opacity .3s,visibility 0s .3s}",
    "html.tema-esp .ksd-dim.on{opacity:1;visibility:visible;transition:opacity .3s}",
    "html.tema-esp .ksd-scroll{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:18px 16px 10px;-webkit-overflow-scrolling:touch}",
    "html.tema-esp .ksd-head{display:flex;align-items:center;gap:12px;padding:2px 2px 16px;border-bottom:1px solid #d9a44133}",
    "html.tema-esp .ksd-av{flex:none;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#f5d27a,#c8901f);display:grid;place-items:center;color:#2c160a;font:900 22px Georgia,serif;box-shadow:0 0 0 3px #2c160a,0 0 0 4px " + G + "}",
    "html.tema-esp .ksd-av .ksd-ic{width:26px;height:26px;stroke-width:2}",
    "html.tema-esp .ksd-who{min-width:0;flex:1}",
    "html.tema-esp .ksd-who b{display:block;font-size:17px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "html.tema-esp .ksd-who small{display:block;color:" + G + ";font-size:12.5px;font-weight:700;margin-top:2px}",
    "html.tema-esp .ks-menu .ksd-who a{display:inline!important;width:auto!important;padding:0!important;margin:0!important;background:none!important;border-radius:0!important;font:inherit!important;color:" + G2 + "!important;text-decoration:underline;text-underline-offset:2px}",
    "html.tema-esp .ksd-x{flex:none;width:36px;height:36px;border-radius:50%;border:1px solid #d9a44155;background:none;color:" + G + ";display:grid;place-items:center;cursor:pointer;padding:0}",
    "html.tema-esp .ksd-x .ksd-ic{width:18px;height:18px}",
    "html.tema-esp .ks-menu .ksd-saldo{width:auto!important;font-weight:400!important;margin:14px 0 4px;border-radius:16px;padding:12px 14px!important;background:linear-gradient(135deg,#f5d27a,#c8901f);color:#2c160a;display:flex;align-items:center;gap:10px;text-decoration:none;box-shadow:0 10px 24px -12px #c8901f}",
    "html.tema-esp .ksd-saldo .ksd-ic{width:26px;height:26px}",
    "html.tema-esp .ksd-saldo b{display:block;font-size:15px}html.tema-esp .ksd-saldo small{font-size:11.5px;font-weight:700;opacity:.8}",
    "html.tema-esp .ksd-saldo em{margin-left:auto;font-style:normal;font-weight:900;font-size:17px;white-space:nowrap}",
    "html.tema-esp .ks-menu .ksd-saldo[hidden]{display:none!important}","html.tema-esp .ks-menu .ksd-saldo:hover{filter:brightness(1.05);background:linear-gradient(135deg,#f5d27a,#c8901f)!important}",
    "html.tema-esp .ksd-sec{font-size:10.5px;letter-spacing:2.2px;color:" + G + ";font-weight:800;margin:16px 6px 6px}",
    "html.tema-esp .ksd-g>a,html.tema-esp .ksd-g>button,html.tema-esp .ksd-foot>a,html.tema-esp .ksd-foot>button{display:flex!important;align-items:center;gap:13px!important;width:100%;padding:11px 10px!important;margin:0 0 2px!important;border:0!important;border-radius:12px!important;background:none!important;color:#f7ead0!important;font:600 15px/1.25 inherit!important;text-align:left;text-decoration:none;cursor:pointer}",
    "html.tema-esp .ksd-g>a:hover,html.tema-esp .ksd-g>button:hover,html.tema-esp .ksd-foot>button:hover,html.tema-esp .ksd-g>a:focus-visible,html.tema-esp .ksd-g>button:focus-visible{background:#ffffff12!important;outline:none}",
    "html.tema-esp .ksd-g>*>.ksd-ic{color:" + G + "}",
    "html.tema-esp .ksd-g>a>svg:not(.ksd-ic){display:none}",
    "html.tema-esp .ksd-g>* span{margin-left:auto!important;background:none!important;border:1px solid " + G + "!important;color:" + G2 + "!important;font-size:10.5px!important;font-weight:900!important;letter-spacing:.5px;text-transform:uppercase;border-radius:999px!important;padding:2px 8px!important}",
    "html.tema-esp .ks-menu [hidden]{display:none!important}",
    "html.tema-esp .ksd-foot{border-top:1px solid #d9a44133;padding:10px 16px calc(12px + env(safe-area-inset-bottom))}",
    "html.tema-esp .ksd-foot:empty,html.tema-esp .ksd-foot:not(:has(>:not([hidden]))){display:none}",
    "html.tema-esp #ksMenuKeluar{color:#f0a08e!important;border-top:0!important;margin:0!important}",
    "html.tema-esp #ksMenuKeluar .ksd-ic{color:#f0a08e!important}",
    "html.tema-esp.ksd-kunci,html.tema-esp.ksd-kunci body{overflow:hidden!important}",
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

  /* ---------- laci ---------- */
  var m = document.querySelector(".ks-menu");
  if (!m) return;
  var awal = [].slice.call(m.children);
  m.innerHTML =
    '<div class="ksd-scroll">' +
      '<div class="ksd-head"><span class="ksd-av">' + ic("user") + '</span><div class="ksd-who"><b>Selamat datang</b><small>✦ Warga Desa Kalensari</small></div>' +
      '<button type="button" class="ksd-x" aria-label="Tutup menu">' + ic("x") + "</button></div>" +
      '<a class="ksd-saldo" href="dashboard-pembeli.html" hidden>' + ic("gift") + '<span><b>Saldo voucher</b><small>Pakai saat checkout</small></span><em>Rp0</em></a>' +
      '<div class="ksd-sec">JELAJAHI</div><div class="ksd-g ksd-g1"></div>' +
      '<div class="ksd-sec">AKUN</div><div class="ksd-g ksd-g2"></div>' +
    "</div>" +
    '<div class="ksd-foot"></div>';
  var g1 = m.querySelector(".ksd-g1"), g2 = m.querySelector(".ksd-g2"), foot = m.querySelector(".ksd-foot");

  // item tambahan: Daftar Toko (ikon toko di header disembunyikan, pindah ke sini)
  var toko = document.createElement("button");
  toko.type = "button"; toko.setAttribute("role", "menuitem"); toko.dataset.ksdToko = "1"; toko.textContent = "Daftar Toko";
  toko.onclick = function () { tutup(); var s = document.getElementById("shopBtn"); if (s) s.click(); };

  // jenis tiap item: [kelompok, urutan, ikon]
  function jenis(el) {
    var h = (el.getAttribute && el.getAttribute("href")) || "";
    if (el.id === "ksMenuKeluar") return ["foot", 0, "out"];
    if (/kuis\.html/.test(h)) return ["g1", 1, "cap"];
    if (/pasar\.html/.test(h)) return ["g1", 2, "swap"];
    if (el.dataset && el.dataset.favMenu) return ["g1", 3, "heart"];
    if (el.dataset && el.dataset.ksdToko) return ["g1", 4, "store"];
    if (/akun-pembeli|dashboard-pembeli/.test(h)) return ["g2", 1, "users"];
    if (/penjual/.test(h)) return ["g2", 2, "shop"];
    if (/jasa/.test(h)) return ["g2", 3, "hand"];
    if (/kurir/.test(h)) return ["g2", 4, "moto"];
    return ["g2", 9, "dot"];
  }
  function hiasItem(el) {
    if (el.querySelector(":scope>.ksd-ic")) return;
    el.querySelectorAll(":scope>svg").forEach(function (s) { s.remove(); });
    var t = el.firstChild; while (t && t.nodeType === 3 && !t.nodeValue.trim()) t = t.nextSibling;
    if (t && t.nodeType === 3) t.nodeValue = t.nodeValue.replace(EMOJI, "");
    el.insertAdjacentHTML("afterbegin", ic(el.__ksdIkon || "dot"));
  }
  function taruh(el) {
    if (!el || el.nodeType !== 1 || /^ksd-/.test(el.className)) return;
    var j = jenis(el); el.__ksdIkon = j[2]; el.dataset.ksdUrut = j[1];
    var box = j[0] === "g1" ? g1 : j[0] === "foot" ? foot : g2;
    var lanjut = [].slice.call(box.children).find(function (c) { return Number(c.dataset.ksdUrut) > j[1]; });
    box.insertBefore(el, lanjut || null);
    hiasItem(el);
    if (el.id === "ksMenuKeluar") // keluar.js menulis ulang teksnya setiap menu dibuka
      new MutationObserver(function () { hiasItem(el); }).observe(el, { childList: true });
  }
  awal.forEach(taruh); taruh(toko);
  // item yang ditambahkan skrip lain belakangan (Kuis, Favorit, Keluar, dll.)
  new MutationObserver(function (ms) {
    ms.forEach(function (x) { [].slice.call(x.addedNodes).forEach(function (n) { if (n.parentNode === m) taruh(n); }); });
  }).observe(m, { childList: true });

  /* buka / tutup: lapisan gelap, kunci gulir, profil */
  var dim = document.createElement("div"); dim.className = "ksd-dim"; document.body.appendChild(dim);
  function tutup() { m.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  m.querySelector(".ksd-x").onclick = tutup;
  dim.addEventListener("click", tutup);
  m.addEventListener("click", function (e) { if (e.target.closest("button[role=menuitem]") && !e.target.closest("#ksMenuKeluar")) setTimeout(tutup, 0); });
  new MutationObserver(function () {
    var buka = m.classList.contains("open");
    dim.classList.toggle("on", buka);
    document.documentElement.classList.toggle("ksd-kunci", buka);
    if (buka) muatProfil();
  }).observe(m, { attributes: true, attributeFilter: ["class"] });

  var profilT = 0;
  function masukPembeli() {
    try { if (localStorage.getItem("kalensari_sesi_pembeli")) return true; var v = JSON.parse(localStorage.getItem("kalensari_pembeli_login") || "null"); return !!(v && v.wa && v.exp > Date.now()); } catch (e) { return false; }
  }
  async function muatProfil() {
    var who = m.querySelector(".ksd-who"), av = m.querySelector(".ksd-av"), sal = m.querySelector(".ksd-saldo");
    if (!masukPembeli()) {
      av.innerHTML = ic("user"); sal.hidden = true;
      who.innerHTML = '<b>Selamat datang 👋</b><small><a href="akun-pembeli.html">Masuk / daftar sebagai warga</a></small>';
      return;
    }
    if (Date.now() - profilT < 60000) return; profilT = Date.now();
    try {
      var b = typeof loadBuyer === "function" ? await loadBuyer() : null;
      if (!b) { profilT = 0; return; }
      av.textContent = (b.nama || "W").trim().charAt(0).toUpperCase();
      who.innerHTML = "<b>" + esc(b.nama) + "</b><small>✦ Warga Desa Kalensari</small>";
      var s = typeof muatSaldoVoucher === "function" ? await muatSaldoVoucher(b.wa) : 0;
      sal.querySelector("em").textContent = rp(s); sal.hidden = false;
    } catch (e) { profilT = 0; }
  }
})();
