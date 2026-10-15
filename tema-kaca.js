/* =====================================================================
   KALENSARI STORE • TEMA "KACA PREMIUM" (Konsep A)
   - Header kapsul kaca melayang, ikon garis dalam kotak lembut,
     keranjang tombol cokelat dengan angka emas.
   - Menu ☰ SEDERHANA: daftar kecil di bawah header (Kuis Pintar, Lapak Barter,
     Favorit saya, Kabar Desa | Warga Desa, Penjual, Penyedia Jasa, Kurir | Keluar).
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
    /* strip paling atas: cokelat gelap + emas, satu baris */
    "html.tema-esp .top-strip{background:#4a2510!important;color:#f1d08a!important;border-bottom:1px solid #d9a441;padding:8px 12px!important;font-size:12px!important;font-weight:600;letter-spacing:.3px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "html.tema-esp .top-strip svg{width:14px;height:14px;vertical-align:-2px;margin-right:6px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}",
    "@media(max-width:340px){html.tema-esp .top-strip{font-size:11px!important;padding:7px 8px!important}}",
    /* menu sederhana: daftar kecil di bawah header */
    "html.tema-esp .ks-menu{display:flex!important;flex-direction:column;position:fixed!important;top:var(--ksp-top,76px)!important;left:10px!important;right:auto!important;bottom:auto!important;width:min(270px,calc(100vw - 20px))!important;min-width:0!important;max-height:calc(100vh - var(--ksp-top,76px) - 14px);max-height:calc(100dvh - var(--ksp-top,76px) - 14px);overflow-y:auto;padding:6px!important;border:0!important;border-radius:18px!important;background:#fff!important;box-shadow:0 18px 44px -16px rgba(58,31,16,.5),0 0 0 1px #eadfd6!important;opacity:0;visibility:hidden;transform:translateY(-6px);transform-origin:top left;transition:opacity .15s,transform .18s,visibility 0s .18s}",
    "html.tema-esp .ks-menu.open{opacity:1;visibility:visible;transform:none;transition:opacity .15s,transform .18s}",
    "html.tema-esp .ksd-dim{position:fixed;inset:0;background:rgba(40,20,8,.25);z-index:25;opacity:0;visibility:hidden;transition:opacity .2s,visibility 0s .2s}",
    "html.tema-esp .ksd-dim.on{opacity:1;visibility:visible;transition:opacity .2s}",
    "html.tema-esp .ks-menu .ksm-i{display:flex!important;align-items:center;gap:12px!important;width:100%!important;padding:11px 12px!important;margin:0!important;border:0!important;border-radius:12px!important;background:none!important;color:#3a1f10!important;font:inherit;font-weight:700!important;font-size:15px;text-align:left;text-decoration:none;cursor:pointer}",
    "html.tema-esp .ks-menu .ksm-i:hover,html.tema-esp .ks-menu .ksm-i:focus-visible{background:#f8efe7!important;outline:none}",
    "html.tema-esp .ksm-e{flex:none;width:24px;text-align:center;font-size:19px;line-height:1}",
    "html.tema-esp .ksm-t{margin-left:auto;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:900;letter-spacing:.4px;background:#f5c542;color:#4a2510}",
    "html.tema-esp .ksm-t.baru{background:#4a2510;color:#fff}",
    "html.tema-esp .ksm-n{margin-left:auto;font-size:12px;font-weight:800;color:#8f7a6b}",
    "html.tema-esp .ksm-hr{height:1px;background:#eadfd6;margin:5px 8px;border:0}",
    "html.tema-esp .ks-menu #ksMenuKeluar{color:#c0392b!important;border-top:0!important;margin:0!important;border-radius:12px!important}",
    "html.tema-esp .ks-menu #ksMenuKeluar .ksd-ic{width:22px;height:22px;color:#c0392b}",
    "html.tema-esp .ks-menu [hidden]{display:none!important}",
    "html.tema-esp .ksm-hr[hidden]{display:none!important}",
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

  /* ---------- menu sederhana ---------- */
  var m = document.querySelector(".ks-menu");
  if (!m) return;
  var awal = [].slice.call(m.children);
  var fav0 = function () { try { var a = JSON.parse(localStorage.getItem("kalensari_favorit") || "[]"); return Array.isArray(a) ? a.length : 0; } catch (e) { return 0; } };
  m.innerHTML =
    '<a class="ksm-i" role="menuitem" href="kuis.html"><span class="ksm-e">🎓</span>Kuis Pintar<span class="ksm-t">GRATIS</span></a>' +
    '<a class="ksm-i" role="menuitem" href="pasar.html"><span class="ksm-e">🔁</span>Lapak Barter<span class="ksm-t baru">BARU</span></a>' +
    '<button class="ksm-i" type="button" role="menuitem" data-fav-menu="1" data-ksp="fav"><span class="ksm-e">❤️</span>Favorit saya<span class="ksm-n"></span></button>' +
    '<button class="ksm-i" type="button" role="menuitem" data-ksp="kabar"><span class="ksm-e">📰</span>Kabar Desa<span class="ksm-t baru" hidden></span></button>' +
    '<hr class="ksm-hr">' +
    '<a class="ksm-i" role="menuitem" href="akun-pembeli.html"><span class="ksm-e">👥</span>Warga Desa</a>' +
    '<a class="ksm-i" role="menuitem" href="penjual.html"><span class="ksm-e">🏪</span>Penjual</a>' +
    '<a class="ksm-i" role="menuitem" href="akun-jasa.html"><span class="ksm-e">🤝</span>Penyedia Jasa</a>' +
    '<a class="ksm-i" role="menuitem" href="akun-kurir.html"><span class="ksm-e">🛵</span>Kurir</a>' +
    '<hr class="ksm-hr ksm-hr-out" hidden>';

  // Keluar (dibuat keluar.js) tetap dipakai, hanya dirapikan di bagian bawah
  function taruh(el, awalan) {
    if (!el || el.nodeType !== 1) return;
    if (!awalan && el.parentNode !== m) return;
    if (el.id === "ksMenuKeluar") {
      el.classList.add("ksm-i"); m.appendChild(el); hiasKeluar(el); sinkron();
      new MutationObserver(function () { hiasKeluar(el); sinkron(); }).observe(el, { childList: true, attributes: true, attributeFilter: ["hidden"] });
    } else if (!el.classList.contains("ksm-i") && !el.classList.contains("ksm-hr")) el.remove();
  }
  function hiasKeluar(el) {
    if (el.querySelector(":scope>.ksd-ic")) return;
    var t = el.firstChild; while (t && t.nodeType === 3 && !t.nodeValue.trim()) t = t.nextSibling;
    if (t && t.nodeType === 3) t.nodeValue = t.nodeValue.replace(EMOJI, "");
    el.insertAdjacentHTML("afterbegin", ic("out"));
  }
  function sinkron() { var k = document.getElementById("ksMenuKeluar"), h = m.querySelector(".ksm-hr-out"); if (h) h.hidden = !k || k.hidden; }
  awal.forEach(function (el) { if (el.id === "ksMenuKeluar") taruh(el, true); });
  new MutationObserver(function (ms) {
    ms.forEach(function (x) { [].slice.call(x.addedNodes).forEach(function (n) { taruh(n); }); });
  }).observe(m, { childList: true });

  /* buka / tutup: lapisan gelap tipis, kunci gulir, posisi di bawah header */
  var dim = document.createElement("div"); dim.className = "ksd-dim"; document.body.appendChild(dim);
  function tutup() { m.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  dim.addEventListener("click", tutup);
  m.addEventListener("click", function (e) {
    var t = e.target.closest("[data-ksp]"); if (!t) return;
    var k = t.getAttribute("data-ksp"); tutup();
    if (k === "fav") { if (typeof bukaFavorit === "function") bukaFavorit(true); }
    else if (k === "kabar") { var kb = document.getElementById("kabarBtn"); if (kb) kb.click(); }
  }, true);
  function posisi() { m.style.setProperty("--ksp-top", Math.max(8, Math.min(Math.round(nav.getBoundingClientRect().bottom + 8), 140)) + "px"); }
  addEventListener("resize", posisi);
  btn.addEventListener("click", posisi, true);
  function isi() {
    var n = fav0(), f = m.querySelector(".ksm-n"); if (f) f.textContent = n ? String(n) : "";
    var kb = document.querySelector("#kabarBtn b"), k = m.querySelector('[data-ksp="kabar"] .ksm-t');
    if (k) { var ada = kb && !kb.hidden && kb.textContent; k.hidden = !ada; k.textContent = ada ? kb.textContent + " BARU" : ""; }
  }
  new MutationObserver(function () {
    var buka = m.classList.contains("open");
    dim.classList.toggle("on", buka);
    if (buka) { posisi(); isi(); }
  }).observe(m, { attributes: true, attributeFilter: ["class"] });
})();
