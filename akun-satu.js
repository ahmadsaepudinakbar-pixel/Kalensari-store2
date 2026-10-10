/* Kalensari Store • SATU AKUN untuk Pembeli + Penyedia Jasa + Lapak Barter
   - Akun induk = akun pembeli (nomor WA + PIN). Lapak barter (pasar.html) sudah memakai akun ini.
   - Profil penyedia jasa menempel di akun yang sama: diaktifkan sekali dari beranda pembeli, PIN-nya ikut PIN pembeli
     (lihat supabase-akun-satu.sql).
   Pemakaian: KSSatu.diam(wa, pin)  -> dipanggil setelah masuk pembeli, ikut masuk ke jasa tanpa tanya lagi
              KSSatu.bukaJasa(wa, nama) -> buka dashboard jasa (aktifkan dulu bila belum punya)
              KSSatu.keluarSemua()  -> hapus semua sesi (pembeli + jasa) di perangkat ini */
(function () {
  var C = function () { return window.CLOUD_CONFIG || {}; };
  var SESS_JASA = "kalensari_jasa_sess";
  function say(t) { if (typeof window.toast === "function") return window.toast(t); if (typeof window.showToast === "function") return window.showToast(t); alert(t); }
  async function cf(path, opt) {
    opt = opt || {};
    var base = String(C().supabaseUrl || "").replace(/\/$/, "");
    var r = await fetch(base + "/rest/v1/" + path, { method: opt.method || "GET", body: opt.body,
      headers: Object.assign({ apikey: C().supabaseAnonKey, Authorization: "Bearer " + C().supabaseAnonKey, "Content-Type": "application/json" }, opt.headers || {}) });
    var t = await r.text(); if (!r.ok) throw new Error(t || r.status); return t ? JSON.parse(t) : [];
  }
  async function baca(key, def) { var r = await cf("store_settings?select=value&key=eq." + key); return r[0] && r[0].value != null ? r[0].value : def; }
  async function tulis(key, value) { await cf("store_settings?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ key: key, value: value }]) }); }
  async function hashJasa(wa, pin) {
    var b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("kalensari-jasa:" + wa + ":" + pin));
    return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, "0"); }).join("");
  }
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  async function adaJasa(wa) { var acc = (await baca("jasa_accounts", {})) || {}; return !!acc[wa]; }
  function jasaAktif() { try { return !!(window.KSID && KSID.sesi("jasa") && sessionStorage.getItem(SESS_JASA)); } catch (e) { return false; } }
  async function masukJasa(wa, pin) { var a = await KSID.masuk("jasa", wa, pin); sessionStorage.setItem(SESS_JASA, a.wa || wa); return a; }

  // Setelah masuk sebagai pembeli: ikut masuk ke profil jasa (bila ada). Gagal = diabaikan, tidak mengganggu.
  async function diam(wa, pin) {
    try { if (window.KSID && C().enabled && await adaJasa(wa)) await masukJasa(wa, pin); } catch (e) { }
  }

  // Kotak kecil minta PIN (dan kategori bila baru mengaktifkan jasa)
  function tanya(judul, teks, kategori) {
    return new Promise(function (ok) {
      var ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;background:rgba(30,15,5,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px";
      ov.innerHTML = '<div style="background:#fff;width:min(420px,100%);border-radius:20px;padding:20px 18px;color:#3a1f10;font:15px system-ui,sans-serif"><h3 style="margin:0 0 6px">' + esc(judul) + '</h3><p style="margin:0 0 12px;color:#7a6454;font-size:14px">' + teks + '</p>'
        + (kategori ? '<label style="display:block;font-weight:700;font-size:13px;margin-bottom:10px">Kategori jasa<select id="ksKat" style="display:block;width:100%;margin-top:4px;padding:11px;border:1.5px solid #e6d8c8;border-radius:12px;font:inherit">' + kategori.map(function (k) { return '<option>' + esc(k) + '</option>'; }).join("") + '</select></label>' : "")
        + '<label style="display:block;font-weight:700;font-size:13px">PIN akun Anda<input id="ksPin" type="password" inputmode="numeric" maxlength="8" autocomplete="current-password" style="display:block;width:100%;margin-top:4px;padding:11px;border:1.5px solid #e6d8c8;border-radius:12px;font:inherit;box-sizing:border-box"></label>'
        + '<button type="button" id="ksGo" style="display:block;width:100%;margin-top:14px;padding:13px;border:0;border-radius:14px;background:#7b3f1d;color:#fff;font:inherit;font-weight:800;cursor:pointer">Lanjut</button><button type="button" id="ksX" style="display:block;width:100%;margin-top:6px;padding:10px;border:0;background:none;color:#7a6454;font:inherit;cursor:pointer">Batal</button></div>';
      document.body.appendChild(ov);
      var q = function (s) { return ov.querySelector(s); }, selesai = function (v) { ov.remove(); ok(v); };
      q("#ksX").onclick = function () { selesai(null); };
      q("#ksGo").onclick = function () { var pin = q("#ksPin").value; if (!/^\d{4,8}$/.test(pin)) return say("PIN 4–8 angka"); selesai({ pin: pin, kat: q("#ksKat") ? q("#ksKat").value : "" }); };
      q("#ksPin").onkeydown = function (e) { if (e.key === "Enter") q("#ksGo").click(); };
      setTimeout(function () { q("#ksPin").focus(); }, 50);
    });
  }

  async function aktifkan(wa, nama, pin, kat) {
    await KSID.masuk("pembeli", wa, pin);                       // pastikan PIN benar
    var acc = (await baca("jasa_accounts", {})) || {};
    if (!acc[wa]) {
      var id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      acc[wa] = { h: await hashJasa(wa, pin), id: id };
      await tulis("jasa_accounts", acc);
      var list = (await baca("jasa_members", [])) || []; if (!Array.isArray(list)) list = [];
      if (!list.some(function (x) { return x.id === id; }))
        list.push({ id: id, nama: nama || "Penyedia jasa", kategori: kat || "Lainnya", sub: "", ket: "", buka: "08:00", tutup: "17:00", dusun: "", rating: "", harga: "", wa: wa, libur: [], layanan: [], status: "Hide", pending: true, member: true, foto: "", updated: Date.now() });
      await tulis("jasa_members", list);
    }
    await masukJasa(wa, pin);
  }

  async function bukaJasa(wa, nama) {
    try {
      if (!C().enabled) return say("Database belum aktif");
      if (jasaAktif()) { location.href = "dashboard-jasa.html"; return; }
      var ada = await adaJasa(wa), kat = null;
      if (!ada) {
        try { var c = await baca("jasa_categories", []); kat = (Array.isArray(c) ? c : []).map(function (x) { return x && x.n; }).filter(function (x) { return typeof x === "string" && x; }); } catch (e) { }
        if (!kat || !kat.length) kat = ["Lainnya"];
      }
      var h = await tanya(ada ? "Buka profil jasa" : "Aktifkan profil penyedia jasa",
        ada ? "Masukkan PIN akun Anda untuk membuka dashboard jasa." : "Profil jasa memakai <b>akun yang sama</b> (nomor WA &amp; PIN Anda). Setelah aktif, lengkapi data jasa di dashboard dan tunggu persetujuan admin.", ada ? null : kat);
      if (!h) return;
      if (ada) await masukJasa(wa, h.pin); else await aktifkan(wa, nama, h.pin, h.kat);
      location.href = "dashboard-jasa.html";
    } catch (e) { say(e.message || "Gagal membuka profil jasa"); }
  }

  function keluarSemua() {
    ["pembeli", "jasa"].forEach(function (r) {
      try { if (window.KSID) KSID.hapusSesi(r); } catch (e) { }
      try { sessionStorage.removeItem("kalensari_" + r + "_sess"); localStorage.removeItem("kalensari_" + r + "_login"); localStorage.removeItem("kalensari_" + r + "_sess"); } catch (e) { }
    });
  }
  window.KSSatu = { diam: diam, bukaJasa: bukaJasa, keluarSemua: keluarSemua, adaJasa: adaJasa, jasaAktif: jasaAktif };
})();
