/* =====================================================================
   KALENSARI STORE • Verifikasi 2 langkah (2FA) untuk akun admin
   Memakai MFA TOTP bawaan Supabase Auth (gratis). Kode 6 angka dari aplikasi
   Google Authenticator / Microsoft Authenticator / Authy di HP admin.

   Pemakaian (setelah login email + sandi berhasil):
     sess = await KS2FA.naikkan(sess)   // sess = {access_token, refresh_token, expires_at, email}
   - Sudah punya 2FA  -> minta kode 6 angka
   - Belum punya 2FA  -> tampil QR untuk dipindai, lalu kode 6 angka
   Hasil: sesi baru tingkat "aal2". Gagal / dibatalkan -> melempar Error.

   Database (supabase-admin-2fa.sql) menolak semua akses admin dari sesi
   tanpa 2FA untuk akun yang sudah memasang 2FA.
   ===================================================================== */
(function () {
  var CFG = function () { return window.CLOUD_CONFIG || {}; };
  var BASE = function () { return String(CFG().supabaseUrl || "").replace(/\/$/, ""); };

  async function req(path, token, opt) {
    opt = opt || {};
    var r = await fetch(BASE() + "/auth/v1/" + path, {
      method: opt.method || "GET",
      headers: { apikey: CFG().supabaseAnonKey, Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: opt.body ? JSON.stringify(opt.body) : undefined
    });
    var d = await r.json().catch(function () { return {}; });
    if (!r.ok) { var e = new Error(d.msg || d.message || d.error_description || ("HTTP " + r.status)); e.kode = d.error_code || d.code || r.status; throw e; }
    return d;
  }
  function sesiDari(d, email) {
    return { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600), email: (d.user && d.user.email) || email || "" };
  }
  function aal(token) {
    try { var p = JSON.parse(atob(String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); return p.aal || "aal1"; } catch (e) { return "aal1"; }
  }
  async function faktor(token) {
    var u = await req("user", token);
    return (u.factors || []).filter(function (f) { return f.factor_type === "totp"; });
  }

  // ---------- tampilan ----------
  function css() {
    if (document.getElementById("ks2faCss")) return;
    var s = document.createElement("style"); s.id = "ks2faCss";
    s.textContent = ".k2-ov{position:fixed;inset:0;z-index:100000;background:rgba(15,20,30,.62);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,Segoe UI,sans-serif}" +
      ".k2-c{background:#fff;color:#1d2433;width:min(400px,100%);border-radius:20px;padding:22px 20px;box-shadow:0 20px 60px rgba(0,0,0,.35);max-height:calc(100vh - 32px);overflow:auto}" +
      ".k2-c h3{margin:0 0 6px;font-size:19px}.k2-c p{margin:0 0 12px;font-size:14px;line-height:1.5;color:#4b5565}.k2-c ol{margin:0 0 12px;padding-left:20px;font-size:14px;line-height:1.55;color:#4b5565}" +
      ".k2-qr{display:grid;place-items:center;background:#f4f6f9;border-radius:14px;padding:12px;margin:0 0 10px}.k2-qr img{width:190px;height:190px;background:#fff;border-radius:8px}" +
      ".k2-sec{font:600 12px/1.4 ui-monospace,Menlo,Consolas,monospace;background:#f4f6f9;border-radius:10px;padding:8px 10px;word-break:break-all;margin:0 0 12px;color:#1d2433}" +
      ".k2-in{width:100%;box-sizing:border-box;font:700 26px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.35em;text-align:center;padding:12px;border:2px solid #d5dbe5;border-radius:14px;outline:none}.k2-in:focus{border-color:#16a34a}" +
      ".k2-er{color:#c0392b;font-size:13px;min-height:18px;margin:8px 0 0}.k2-b{display:block;width:100%;margin-top:10px;padding:13px;border:0;border-radius:14px;background:#16a34a;color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer}" +
      ".k2-b:disabled{opacity:.55}.k2-x{background:transparent;color:#4b5565;font-weight:600}";
    document.head.appendChild(s);
  }
  // Menampilkan jendela; onKode(kode) -> Promise; selesai bila resolve, pesan galat bila reject
  function jendela(html, onKode) {
    css();
    return new Promise(function (ok, gagal) {
      var ov = document.createElement("div"); ov.className = "k2-ov";
      ov.innerHTML = '<div class="k2-c" role="dialog" aria-modal="true">' + html +
        '<input class="k2-in" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" aria-label="Kode 6 angka">' +
        '<div class="k2-er"></div><button type="button" class="k2-b">Verifikasi</button><button type="button" class="k2-b k2-x">Batal</button></div>';
      document.body.appendChild(ov);
      var inp = ov.querySelector(".k2-in"), er = ov.querySelector(".k2-er"), b = ov.querySelector(".k2-b:not(.k2-x)"), sibuk = false;
      setTimeout(function () { inp.focus(); }, 50);
      async function kirim() {
        var k = inp.value.replace(/\D/g, "");
        if (k.length !== 6) { er.textContent = "Masukkan 6 angka dari aplikasi Authenticator."; return; }
        if (sibuk) return; sibuk = true; b.disabled = true; b.textContent = "Memeriksa…"; er.textContent = "";
        try { var h = await onKode(k); ov.remove(); ok(h); }
        catch (e) {
          sibuk = false; b.disabled = false; b.textContent = "Verifikasi"; inp.value = ""; inp.focus();
          er.textContent = /invalid|salah|incorrect|expired|kedaluwarsa/i.test(String(e.message)) ? "Kode salah atau sudah berganti. Coba kode terbaru." : "Gagal: " + String(e.message).slice(0, 90);
        }
      }
      b.onclick = kirim;
      inp.addEventListener("input", function () { inp.value = inp.value.replace(/\D/g, "").slice(0, 6); if (inp.value.length === 6) kirim(); });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") kirim(); });
      ov.querySelector(".k2-x").onclick = function () { ov.remove(); var e = new Error("Verifikasi 2 langkah dibatalkan."); e.batal = true; gagal(e); };
    });
  }
  function gambarQr(q) {
    q = String(q || "");
    if (/^data:/.test(q)) return q;
    if (/^\s*<svg/.test(q)) return "data:image/svg+xml;utf-8," + encodeURIComponent(q);
    return "";
  }

  // ---------- alur ----------
  async function verifikasi(token, id, kode, email) {
    var ch = await req("factors/" + id + "/challenge", token, { method: "POST", body: {} });
    var d = await req("factors/" + id + "/verify", token, { method: "POST", body: { challenge_id: ch.id, code: kode } });
    return sesiDari(d, email);
  }
  async function naikkan(sess) {
    if (!sess || !sess.access_token) throw new Error("login");
    if (aal(sess.access_token) === "aal2") return sess;
    var fs = await faktor(sess.access_token);
    var aktif = fs.filter(function (f) { return f.status === "verified"; })[0];
    if (aktif) {
      return jendela('<h3>🔐 Verifikasi 2 langkah</h3><p>Buka aplikasi <b>Authenticator</b> di HP Anda, lalu ketik kode 6 angka untuk <b>Kalensari Store</b>.</p>',
        function (k) { return verifikasi(sess.access_token, aktif.id, k, sess.email); });
    }
    // belum punya 2FA: bersihkan pendaftaran lama yang belum selesai, lalu daftar baru
    for (var i = 0; i < fs.length; i++) { try { await req("factors/" + fs[i].id, sess.access_token, { method: "DELETE" }); } catch (e) {} }
    var en = await req("factors", sess.access_token, { method: "POST", body: { factor_type: "totp", friendly_name: "Kalensari " + new Date().toISOString().slice(0, 16), issuer: "Kalensari Store" } });
    var qr = gambarQr(en.totp && en.totp.qr_code), rahasia = (en.totp && en.totp.secret) || "";
    return jendela('<h3>🔐 Pasang verifikasi 2 langkah</h3><p>Demi keamanan, akun admin wajib memakai kode dari HP setiap kali masuk. Cukup sekali dipasang.</p>' +
      '<ol><li>Pasang aplikasi <b>Google Authenticator</b> (gratis) di HP Anda.</li><li>Buka aplikasinya, tekan <b>+</b> → <b>Pindai kode QR</b>, lalu arahkan ke gambar di bawah.</li><li>Ketik kode 6 angka yang muncul di aplikasi.</li></ol>' +
      (qr ? '<div class="k2-qr"><img alt="Kode QR 2FA" src="' + qr + '"></div>' : "") +
      (rahasia ? '<p style="font-size:12.5px;margin-bottom:4px">Tidak bisa memindai? Pilih <b>Masukkan kunci penyiapan</b> lalu ketik kunci ini:</p><div class="k2-sec">' + rahasia.replace(/(.{4})/g, "$1 ").trim() + "</div>" : ""),
      function (k) { return verifikasi(sess.access_token, en.id, k, sess.email); });
  }
  // Untuk halaman Keamanan admin: status & hapus 2FA (butuh sesi aal2)
  async function status(token) {
    var fs = await faktor(token);
    return { aktif: fs.some(function (f) { return f.status === "verified"; }), faktor: fs, aal: aal(token) };
  }
  async function hapus(token) {
    var fs = await faktor(token);
    for (var i = 0; i < fs.length; i++) await req("factors/" + fs[i].id, token, { method: "DELETE" });
  }
  // Keluar dari SEMUA perangkat (semua sesi akun ini dicabut)
  async function keluarSemua(token) { await fetch(BASE() + "/auth/v1/logout?scope=global", { method: "POST", headers: { apikey: CFG().supabaseAnonKey, Authorization: "Bearer " + token } }); }

  window.KS2FA = { naikkan: naikkan, status: status, hapus: hapus, keluarSemua: keluarSemua, aal: aal };
})();
