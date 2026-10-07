/* Kalensari Store \u2022 Hapus akun sendiri (syarat Google Play)
   Pakai:  <div id="ksHapusAkun"></div>  lalu  KSHapus.pasang(document.getElementById("ksHapusAkun"), "pembeli")
   Peran: "pembeli" | "penjual" | "kurir" | "jasa". Butuh akun-id.js (KSID) & fungsi server hapus_akun_saya
   (supabase-hapus-akun.sql). Penjelasan untuk pengguna ada di privasi.html#hapus-akun. */
(function () {
  var NAMA = { pembeli: "pembeli", penjual: "penjual", kurir: "kurir", jasa: "penyedia jasa" };
  var CATATAN = {
    pembeli: ["Saldo voucher yang belum dipakai akan hangus.", "Iklan & komentar Anda di Lapak Barter ikut terhapus."],
    penjual: ["Semua produk toko Anda disembunyikan dari Kalensari Store.", "Cairkan dulu saldo penjualan Anda sebelum menghapus akun.", "Iklan & komentar Anda di Lapak Barter ikut terhapus."],
    kurir: ["Saldo kurir yang tersisa tidak bisa dipakai lagi. Hubungi admin bila ingin dicairkan dulu.", "Iklan & komentar Anda di Lapak Barter ikut terhapus."],
    jasa: ["Profil jasa Anda tidak tampil lagi di halaman Penyedia Jasa.", "Iklan & komentar Anda di Lapak Barter ikut terhapus."]
  };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var CSS = false;
  function css() {
    if (CSS) return; CSS = true;
    var st = document.createElement("style");
    st.textContent = ".ksh{margin-top:14px;border:1.5px solid #f1c0ba;background:#fff7f6;border-radius:16px;padding:14px 16px;color:#3b2416;font-size:14px}"
      + ".ksh b{display:block;font-size:15px;color:#a3261c;margin-bottom:4px}.ksh p{margin:0 0 10px;color:#6b5546;line-height:1.45}"
      + ".ksh button{border:1.5px solid #c0392b;background:#fff;color:#b3261e;border-radius:12px;padding:10px 14px;font:600 14px inherit;cursor:pointer}"
      + ".ksh-ov{position:fixed;inset:0;z-index:9990;background:rgba(40,20,10,.6);display:flex;align-items:flex-end;justify-content:center}"
      + ".ksh-bx{background:#fff;border-radius:20px 20px 0 0;width:min(520px,100%);max-height:92vh;overflow:auto;padding:18px 16px 22px;font:14px/1.5 system-ui,sans-serif;color:#3b2416}"
      + ".ksh-bx h3{margin:0 0 6px;font-size:18px;color:#a3261c}.ksh-bx ul{margin:6px 0 12px;padding-left:20px;color:#5b4637}.ksh-bx li{margin:4px 0}"
      + ".ksh-bx label{display:block;font-weight:600;margin:10px 0 4px}.ksh-bx input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #e3d2c3;border-radius:12px;font:inherit}"
      + ".ksh-bx .ksh-a{display:flex;gap:8px;margin-top:14px}.ksh-bx .ksh-a button{flex:1;border-radius:12px;padding:11px;font:700 14px inherit;cursor:pointer;border:1.5px solid #d9c8b8;background:#fff;color:#5b2e1a}"
      + ".ksh-bx .ksh-a .ya{background:#b3261e;border-color:#b3261e;color:#fff}.ksh-bx .ksh-a .ya:disabled{opacity:.5}"
      + ".ksh-bx .ksh-e{color:#b3261e;font-size:13px;margin-top:8px;min-height:18px}";
    document.head.appendChild(st);
  }
  function bersihkan(peran) {
    ["kalensari_" + peran + "_sess", "kalensari_sesi_" + peran, "kalensari_" + peran + "_login"].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
      try { sessionStorage.removeItem(k); } catch (e) {}
    });
  }
  function dialog(peran) {
    css();
    var ov = document.createElement("div"); ov.className = "ksh-ov";
    ov.innerHTML = '<div class="ksh-bx" role="dialog" aria-modal="true" aria-label="Hapus akun">'
      + "<h3>\u26A0\uFE0F Hapus akun " + esc(NAMA[peran]) + "</h3>"
      + "<p>Akun ini akan dihapus permanen dan <b>tidak bisa dikembalikan</b>.</p><ul>"
      + "<li>Nama, nomor WhatsApp, PIN, alamat, titik lokasi, dan foto Anda dihapus.</li>"
      + CATATAN[peran].map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("")
      + "<li>Nota pesanan & catatan keuangan tetap disimpan untuk pembukuan.</li>"
      + "<li>Pesanan yang masih berjalan harus selesai atau dibatalkan dulu.</li></ul>"
      + '<p style="font-size:13px;color:#7a6454">Selengkapnya: <a href="privasi.html#hapus-akun" target="_blank" rel="noopener">Kebijakan Privasi</a></p>'
      + '<label for="kshPin">PIN akun</label><input id="kshPin" type="password" inputmode="numeric" maxlength="8" autocomplete="current-password">'
      + '<label for="kshKet">Ketik <b style="display:inline;color:#a3261c">HAPUS</b> untuk konfirmasi</label><input id="kshKet" autocomplete="off" autocapitalize="characters" placeholder="HAPUS">'
      + '<div class="ksh-e" id="kshErr"></div>'
      + '<div class="ksh-a"><button type="button" data-x>Batal</button><button type="button" class="ya" data-y disabled>Hapus akun saya</button></div></div>';
    document.body.appendChild(ov);
    var pin = ov.querySelector("#kshPin"), ket = ov.querySelector("#kshKet"), ya = ov.querySelector("[data-y]"), err = ov.querySelector("#kshErr");
    var cek = function () { ya.disabled = !(/^\d{4,8}$/.test(pin.value) && ket.value.trim().toUpperCase() === "HAPUS"); };
    pin.oninput = cek; ket.oninput = cek;
    var tutup = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) tutup(); };
    ov.querySelector("[data-x]").onclick = tutup;
    ya.onclick = async function () {
      ya.disabled = true; ya.textContent = "Menghapus..."; err.textContent = "";
      try {
        if (!window.KSID) throw new Error("Muat ulang halaman lalu coba lagi");
        await KSID.rpc("hapus_akun_saya", { p_sesi: KSID.sesi(peran), p_peran: peran, p_pin: pin.value, p_konfirmasi: ket.value.trim() });
        bersihkan(peran);
        tutup();
        alert("Akun Anda sudah dihapus. Terima kasih telah memakai Kalensari Store.");
        location.replace("index.html");
      } catch (e) {
        var m = String((e && e.message) || e).replace(/^SESI:\s*/, "");
        if (/Could not find the function|PGRST202/i.test(m)) m = "Fitur hapus akun belum aktif. Hubungi admin untuk menghapus akun.";
        err.textContent = m.slice(0, 160); ya.textContent = "Hapus akun saya"; cek();
      }
    };
    setTimeout(function () { pin.focus(); }, 50);
  }
  function pasang(el, peran) {
    if (!el || !NAMA[peran]) return;
    css();
    el.innerHTML = '<div class="ksh"><b>\uD83D\uDDD1\uFE0F Hapus akun</b><p>Menghapus akun ' + esc(NAMA[peran]) + " beserta data pribadi Anda secara permanen.</p>"
      + '<button type="button">Hapus akun saya</button></div>';
    el.querySelector("button").onclick = function () { dialog(peran); };
  }
  window.KSHapus = { pasang: pasang };
})();
