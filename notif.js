/* Kalensari Store - notifikasi HP (Web Push) untuk penjual, kurir, pembeli & admin.
   Langganan disimpan di store_settings dengan kunci <peran>_push_<id> (admin: admin_push).
   Pengiriman dilakukan oleh fungsi Supabase "kirim-notif". */
(function () {
  var C = window.CLOUD_CONFIG || {};
  var VAPID = C.vapidPublicKey || "";
  var BASE = String(C.supabaseUrl || "").replace(/\/$/, "");
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;

  function didukung() { return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!VAPID && !!BASE; }
  function b64u8(b) { var p = "=".repeat((4 - b.length % 4) % 4), r = atob((b + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, function (c) { return c.charCodeAt(0); }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  async function reg() {
    var r = await navigator.serviceWorker.getRegistration();
    if (!r) r = await navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;
    return r;
  }
  function kunciSama(sub) {
    try {
      var k = sub.options && sub.options.applicationServerKey; if (!k) return true;
      var a = new Uint8Array(k), b = b64u8(VAPID);
      return a.length === b.length && a.every(function (x, i) { return x === b[i]; });
    } catch (e) { return true; }
  }
  async function langgananSaatIni() {
    var r = await reg(), s = await r.pushManager.getSubscription();
    if (s && !kunciSama(s)) { try { await s.unsubscribe(); } catch (e) {} s = null; }   // kunci server berganti -> daftar ulang
    return s;
  }
  async function berlangganan() {
    var s = await langgananSaatIni();
    if (!s) s = await (await reg()).pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u8(VAPID) });
    return s;
  }
  function hdr(token) { var k = C.supabaseAnonKey; return { apikey: k, Authorization: "Bearer " + (token || k), "Content-Type": "application/json" }; }
  /* Pembeli / penjual / kurir / jasa: simpan lewat fungsi server notif_langganan (supabase-notif-aman.sql).
     Hasil: true = sudah lewat server, false = fungsi belum ada (pakai cara lama). Admin tetap cara lama (pakai token admin). */
  var adaRpc = true;
  async function lewatServer(key, sub, extra, hapus) {
    var m = /^(pembeli|penjual|kurir|jasa)_push_(.+)$/.exec(key || "");
    if (!m || !adaRpc) return false;
    var sesi = ""; try { sesi = (window.KSID && KSID.sesi(m[1])) || localStorage.getItem("kalensari_sesi_" + m[1]) || ""; } catch (e) {}
    var js = sub.toJSON ? sub.toJSON() : sub;
    var r = await fetch(BASE + "/rest/v1/rpc/notif_langganan", { method: "POST", headers: hdr(), body: JSON.stringify({ p_sesi: sesi, p_peran: m[1], p_sub: { endpoint: js.endpoint, keys: js.keys || {} }, p_extra: extra || {}, p_hapus: !!hapus, p_wa: m[1] === "pembeli" ? m[2] : null }) });
    if (r.ok) return true;
    var t = await r.text(), j = null; try { j = JSON.parse(t); } catch (e) {}
    var msg = String((j && (j.message || j.hint)) || t || r.status);
    if (r.status === 404 || /Could not find the function|PGRST202/i.test(msg)) { adaRpc = false; return false; }
    throw new Error(msg.replace(/^SESI:\s*/, ""));
  }
  async function simpan(key, sub, extra, token) {
    if (!token && await lewatServer(key, sub, extra, false)) { try { localStorage.setItem("ks_notif_" + key, "1"); } catch (e) {} return; }
    var h = hdr(token), cur = [], lama = {};
    try {
      var r0 = await fetch(BASE + "/rest/v1/store_settings?select=value&key=eq." + encodeURIComponent(key), { headers: h });
      var j = await r0.json(); lama = (j[0] && j[0].value && typeof j[0].value === "object") ? j[0].value : {}; cur = Array.isArray(lama.subs) ? lama.subs : [];
    } catch (e) {}
    var js = sub.toJSON();
    cur = cur.filter(function (x) { return x && x.endpoint !== js.endpoint; });
    cur.push({ endpoint: js.endpoint, keys: js.keys });
    var val = Object.assign({}, lama, extra || {}, { subs: cur.slice(-5), t: Date.now() });
    var r = await fetch(BASE + "/rest/v1/store_settings?on_conflict=key", { method: "POST", headers: Object.assign({}, h, { Prefer: "resolution=merge-duplicates,return=minimal" }), body: JSON.stringify([{ key: key, value: val }]) });
    if (!r.ok) throw new Error("Gagal menyimpan (" + r.status + ")");
    try { localStorage.setItem("ks_notif_" + key, "1"); } catch (e) {}
  }
  async function aktifkan(key, opt) {
    opt = opt || {};
    var perm = await Notification.requestPermission();
    if (perm !== "granted") throw new Error("Izin notifikasi tidak diberikan");
    var s = await berlangganan();
    await simpan(key, s, opt.extra, typeof opt.token === "function" ? await opt.token() : opt.token);
    return s;
  }
  async function matikan(key, token) {
    var h = hdr(token), s = null;
    try { s = await langgananSaatIni(); } catch (e) {}
    if (s && !token && await lewatServer(key, s, null, true)) s = null;
    if (s) {
      var r0 = await fetch(BASE + "/rest/v1/store_settings?select=value&key=eq." + encodeURIComponent(key), { headers: h });
      var j = await r0.json(), lama = (j[0] && j[0].value && typeof j[0].value === "object") ? j[0].value : {};
      var ep = s.endpoint, subs = (Array.isArray(lama.subs) ? lama.subs : []).filter(function (x) { return x && x.endpoint !== ep; });
      var r = await fetch(BASE + "/rest/v1/store_settings?on_conflict=key", { method: "POST", headers: Object.assign({}, h, { Prefer: "resolution=merge-duplicates,return=minimal" }), body: JSON.stringify([{ key: key, value: Object.assign({}, lama, { subs: subs, t: Date.now() }) }]) });
      if (!r.ok) throw new Error("Gagal mematikan (" + r.status + ")");
    }
    try { localStorage.setItem("ks_notif_" + key, "0"); } catch (e) {}
    SUDAH[key] = 0;
  }
  async function tes(key) {
    try {
      var r = await fetch(BASE + "/functions/v1/kirim-notif", { method: "POST", headers: { "Content-Type": "application/json", apikey: C.supabaseAnonKey }, body: JSON.stringify({ uji: key }) });
      var j = await r.json();
      if (j && j.terkirim > 0) return "server";
      if (j && j.error === "tunggu sebentar") return "tunggu";
    } catch (e) {}
    try { var g = await reg(); await g.showNotification("Kalensari Store", { body: "Tes notifikasi (lokal) 🎉", icon: "icons/icon-192.png", tag: "tes" }); } catch (e) {}
    return "lokal";
  }
  async function status(key) {
    if (!didukung()) return ios && !standalone ? "ios" : "tidak";
    if (Notification.permission === "denied") return "diblokir";
    if (Notification.permission !== "granted") return "belum";
    var s = null; try { s = await langgananSaatIni(); } catch (e) {}
    var mati = false; try { mati = localStorage.getItem("ks_notif_" + key) === "0"; } catch (e) {}
    return s && !mati ? "aktif" : "belum";
  }

  var CSS_OK = false, SUDAH = {};
  function css() {
    if (CSS_OK) return; CSS_OK = true;
    var st = document.createElement("style");
    st.textContent = ".ksn{border-radius:18px;padding:14px 16px;background:#fffaf2;box-shadow:0 2px 12px rgba(80,45,20,.08);margin:12px 0;font-size:14px;color:#3b2416}"
      + ".ksn b{display:block;font-size:15px;margin-bottom:4px}.ksn p{margin:0 0 10px;color:#6b5546;line-height:1.45}.ksn.ok{background:#e9f7ee}.ksn.ok p{margin:0;color:#14502c}"
      + ".ksn .ksb{display:flex;gap:8px;flex-wrap:wrap}.ksn button{border:0;border-radius:12px;padding:10px 16px;font-weight:600;font-size:14px;font-family:inherit;cursor:pointer;background:#228b4e;color:#fff}"
      + ".ksn button.ks2{background:#fff;color:#5b2e1a;border:1px solid #e3d3c3}.ksn button:disabled{opacity:.6}"
      + ".ksn-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9998;width:min(440px,calc(100% - 32px));background:#5b2e1a;color:#fff;border-radius:18px;padding:12px 14px;box-shadow:0 6px 20px rgba(0,0,0,.3);font:14px/1.4 Roboto,system-ui,sans-serif;display:flex;gap:10px;align-items:center}"
      + ".ksn-bar span{flex:1}.ksn-bar button{border:0;border-radius:12px;padding:9px 14px;font-weight:600;font-size:14px;font-family:inherit;cursor:pointer;background:#228b4e;color:#fff}.ksn-bar button.x{background:transparent;padding:9px 8px}";
    document.head.appendChild(st);
  }
  function toastKecil(t) {
    var el = document.createElement("div"); el.textContent = t;
    el.style.cssText = "position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:9999;background:#3b2416;color:#fff;padding:10px 16px;border-radius:12px;font:14px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);max-width:90%";
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 3200);
  }

  /* Kartu status + tombol "Aktifkan notifikasi" di dalam elemen el.
     opt: {key, judul, ajakan, aktifTeks, extra, token, sembunyiBilaAktif} */
  function kartu(el, opt) {
    if (!el) return { refresh: function () {} };
    css();
    var sibuk = false;
    async function render() {
      var key = typeof opt.key === "function" ? opt.key() : opt.key;
      if (!key) { el.innerHTML = ""; return; }
      var s = await status(key);
      if (s === "aktif") {
        // simpan ulang supaya langganan di perangkat ini selalu tercatat untuk akun ini
        try { var sub = await langgananSaatIni(); if (sub && !SUDAH[key]) { SUDAH[key] = 1; Promise.resolve(typeof opt.token === "function" ? opt.token() : opt.token).then(function (tk) { return simpan(key, sub, opt.extra, tk); }).catch(function () { SUDAH[key] = 0; }); } } catch (e) {}
        if (opt.sembunyiBilaAktif) { el.innerHTML = ""; return; }
        el.innerHTML = '<div class="ksn ok"><b>🔔 Notifikasi aktif</b><p>' + esc(opt.aktifTeks || "Anda akan diberi tahu di HP ini walaupun aplikasi ditutup.") + '</p><div class="ksb" style="margin-top:10px"><button type="button" class="ks2" data-t>Kirim tes</button>' + (opt.tanpaMatikan ? '' : '<button type="button" class="ks2" data-m>🔕 Matikan di perangkat ini</button>') + '</div></div>';
      } else if (s === "belum") {
        el.innerHTML = '<div class="ksn"><b>' + esc(opt.judul || "🔔 Aktifkan notifikasi") + '</b><p>' + esc(opt.ajakan || "Dapatkan pemberitahuan di HP walaupun aplikasi sedang ditutup.") + '</p><div class="ksb"><button type="button" data-a>🔔 Aktifkan notifikasi</button></div></div>';
      } else if (s === "diblokir") {
        el.innerHTML = '<div class="ksn"><b>🔕 Notifikasi diblokir</b><p>Buka pengaturan situs / aplikasi di HP (ikon gembok di sebelah alamat web), izinkan <b style="display:inline">Notifikasi</b>, lalu muat ulang halaman ini.</p></div>';
      } else if (s === "ios") {
        el.innerHTML = '<div class="ksn"><b>🔔 Notifikasi di iPhone</b><p>Buka menu Bagikan → "Tambah ke Layar Utama", lalu buka aplikasi dari ikon tersebut untuk mengaktifkan notifikasi.</p></div>';
      } else {
        el.innerHTML = opt.sembunyiBilaAktif ? "" : '<div class="ksn"><b>🔔 Notifikasi</b><p>Browser ini belum mendukung notifikasi. Coba buka dengan Google Chrome.</p></div>';
      }
      var a = el.querySelector("[data-a]"), t = el.querySelector("[data-t]"), m = el.querySelector("[data-m]");
      if (m) m.onclick = async function () {
        if (!confirm("Matikan notifikasi di perangkat ini?")) return;
        m.disabled = true;
        try { await matikan(key, typeof opt.token === "function" ? await opt.token() : opt.token); toastKecil("🔕 Notifikasi dimatikan di perangkat ini"); }
        catch (e) { toastKecil(String(e.message || e).slice(0, 90)); }
        render();
      };
      if (a) a.onclick = async function () {
        if (sibuk) return; sibuk = true; a.disabled = true; a.textContent = "Mengaktifkan...";
        try { await aktifkan(key, opt); toastKecil("✅ Notifikasi diaktifkan"); }
        catch (e) { toastKecil(String(e.message || e).slice(0, 90)); }
        sibuk = false; render();
      };
      if (t) t.onclick = async function () {
        t.disabled = true; var h = await tes(key);
        toastKecil(h === "server" ? "Tes dikirim. Notifikasi akan muncul sebentar lagi." : h === "tunggu" ? "Tunggu 30 detik sebelum tes lagi." : "Notifikasi lokal muncul. Pengiriman dari server belum aktif.");
        setTimeout(function () { t.disabled = false; }, 3000);
      };
    }
    render();
    return { refresh: render };
  }

  /* Bilah ajakan melayang (mis. setelah checkout). Muncul sekali bila belum aktif. */
  async function tawarkan(opt) {
    var key = opt.key; if (!key) return;
    var s = await status(key);
    if (s === "aktif") { kartu(document.createElement("div"), Object.assign({}, opt, { sembunyiBilaAktif: true })); return; }
    if (s !== "belum") return;
    try { if (sessionStorage.getItem("ks_notif_tolak_" + key)) return; } catch (e) {}
    css();
    var old = document.querySelector(".ksn-bar"); if (old) old.remove();
    var bar = document.createElement("div"); bar.className = "ksn-bar";
    bar.innerHTML = "<span>" + esc(opt.ajakan || "🔔 Kabari saya lewat notifikasi HP?") + '</span><button type="button" data-a>Aktifkan</button><button type="button" class="x" aria-label="Tutup">✕</button>';
    document.body.appendChild(bar);
    bar.querySelector(".x").onclick = function () { bar.remove(); try { sessionStorage.setItem("ks_notif_tolak_" + key, "1"); } catch (e) {} };
    bar.querySelector("[data-a]").onclick = async function () {
      bar.remove();
      try { await aktifkan(key, opt); toastKecil("✅ Notifikasi diaktifkan"); if (opt.selesai) opt.selesai(); }
      catch (e) { toastKecil(String(e.message || e).slice(0, 90)); }
    };
  }

  window.KSNotif = { didukung: didukung, status: status, aktifkan: aktifkan, matikan: matikan, tes: tes, kartu: kartu, tawarkan: tawarkan };
})();
