/* =====================================================================
   KALENSARI STORE • Login admin dipakai bersama (tanpa kode 2FA lagi)
   Kode 2FA hanya diminta di Panel Admin (admin.html). Halaman admin lain
   (Kuis, Admin Notif, TV, Jasa, atur banner di toko) memakai login dari
   Panel Admin yang sedang terbuka di browser yang sama.

   - Panel Admin menyimpan sesinya (yang sudah lolos 2FA) ke localStorage
     dan "berdetak" tiap 30 detik selama tab panel terbuka.
   - Halaman lain mengambil sesi itu. Bila Panel Admin sudah ditutup lebih
     dari 2 menit, sesi bersama dianggap habis -> harus masuk Panel Admin lagi.
   - Token yang diperbarui (refresh) oleh halaman mana pun ditulis balik,
     supaya semua halaman memakai token terbaru (Supabase menolak token lama).
   ===================================================================== */
(function () {
  if (window.KSSesi) return;
  var KEY = "ks_admin_sesi", BATAS = 2 * 60000;

  function aal(t) {
    try { var p = JSON.parse(atob(String(t).split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); return p.aal || "aal1"; } catch (e) { return ""; }
  }
  function sama(a, b) { return String((a && a.email) || "").toLowerCase() === String((b && b.email) || "").toLowerCase(); }
  function baca() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!o || !o.s || !o.s.refresh_token) return null;
      if (Date.now() - Number(o.t || 0) > BATAS) { localStorage.removeItem(KEY); return null; }
      return o;
    } catch (e) { return null; }
  }
  function tulis(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function bersih(s) { return { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at, email: s.email || "" }; }

  // sesi bersama yang masih berlaku (atau null)
  function ambil() { var o = baca(); return o ? bersih(o.s) : null; }
  // dipanggil Panel Admin setelah login 2FA berhasil; null = keluar
  function simpan(s) {
    if (!s) { try { localStorage.removeItem(KEY); } catch (e) {} return; }
    if (aal(s.access_token) !== "aal2") return;   // hanya sesi yang sudah lolos 2FA
    tulis({ s: bersih(s), t: Date.now() });
  }
  // token baru hasil refresh: tulis balik HANYA bila sesi bersama masih ada & akunnya sama
  function perbarui(s) {
    var o = baca(); if (!o || !s || !sama(o.s, s)) return;
    if ((Number(s.expires_at) || 0) < (Number(o.s.expires_at) || 0)) return;
    o.s = bersih(s); tulis(o);
  }
  // pilih token terbaru antara milik halaman ini dan sesi bersama
  function terbaru(lok) {
    var o = baca(); if (!o) return lok;
    if (!lok) return bersih(o.s);
    if (!sama(o.s, lok)) return lok;
    return (Number(o.s.expires_at) || 0) > (Number(lok.expires_at) || 0) ? Object.assign({}, lok, bersih(o.s)) : lok;
  }
  // Panel Admin: tetap tandai "masih terbuka" selama ada sesi
  var getter = null;
  function pantau(fn) {
    getter = fn;
    function detak() {
      var a = getter && getter(); if (!a || aal(a.access_token) !== "aal2") return;
      var o = baca();
      if (o && sama(o.s, a)) { o.t = Date.now(); if ((Number(a.expires_at) || 0) > (Number(o.s.expires_at) || 0)) o.s = bersih(a); tulis(o); }
      else if (!o) simpan(a);
    }
    detak(); setInterval(detak, 30000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) detak(); });
  }
  // halaman lain: jalankan cb begitu admin masuk Panel Admin di tab lain
  function saatMasuk(cb) {
    window.addEventListener("storage", function (e) { if (e.key === KEY && e.newValue) { var s = ambil(); if (s) cb(s); } });
  }
  // pesan bila login dengan sandi saja ditolak
  async function alasanTolak(token) {
    try { if (window.KS2FA && (await KS2FA.status(token)).aktif) return "Akun ini memakai verifikasi 2 langkah. Masuk dulu di Panel Admin (admin.html), lalu buka/muat ulang halaman ini."; } catch (e) {}
    return "Akun ini bukan admin.";
  }
  // Admin Notif (HP) ikut memakai sesi Panel Admin dan tidak boleh ikut keluar saat panel keluar.
  // Panel Admin cek tanda ini: bila ada, keluar panel hanya di perangkat ini (sesi tidak dicabut di server).
  var KEY_TETAP = "ks_admin_sesi_tetap";
  function tandaiTetap(email) { try { email ? localStorage.setItem(KEY_TETAP, String(email).toLowerCase()) : localStorage.removeItem(KEY_TETAP); } catch (e) {} }
  function dipakaiTetap(email) { try { var v = localStorage.getItem(KEY_TETAP); return !!v && v === String(email || "").toLowerCase(); } catch (e) { return false; } }
  window.KSSesi = { ambil: ambil, tandaiTetap: tandaiTetap, dipakaiTetap: dipakaiTetap, simpan: simpan, perbarui: perbarui, terbaru: terbaru, pantau: pantau, saatMasuk: saatMasuk, alasanTolak: alasanTolak, aal: aal };
})();
