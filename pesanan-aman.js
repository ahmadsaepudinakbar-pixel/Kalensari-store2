/* Kalensari Store • ubah pesanan lewat server (supabase-keamanan-pesanan.sql)
   KSPesanan.aksi(peran, kode, aksi, data, caraLama)
     peran : "penjual" | "kurir" | "tamu"
     kode  : kode pesanan (string) atau daftar kode
     caraLama : fungsi cadangan bila SQL keamanan pesanan belum dijalankan
   Hasil: {ok:true, jumlah, kode:[...]} */
(function () {
  var adaFungsi = true;
  function C() { return window.CLOUD_CONFIG || {}; }
  async function panggil(fn, body) {
    var base = String(C().supabaseUrl || "").replace(/\/$/, "");
    var r = await fetch(base + "/rest/v1/rpc/" + fn, { method: "POST", headers: { apikey: C().supabaseAnonKey, Authorization: "Bearer " + C().supabaseAnonKey, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    var t = await r.text(), j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
    if (!r.ok) {
      var m = String((j && (j.message || j.hint)) || t || r.status);
      if (r.status === 404 || /Could not find the function|PGRST202/i.test(m)) { var e1 = new Error("rpc"); e1.tidakAda = true; throw e1; }
      var e2 = new Error(m.replace(/^SESI:\s*/, "")); e2.sesiHabis = /Sesi berakhir/i.test(m); throw e2;
    }
    return j;
  }
  async function aksi(peran, kode, nama, data, caraLama) {
    var sesi = peran === "tamu" ? "" : (window.KSID && KSID.sesi(peran)) || "";
    if (adaFungsi) {
      try { return await panggil("pesanan_aksi", { p_sesi: sesi, p_peran: peran, p_kode: [].concat(kode), p_aksi: nama, p_data: data || {} }); }
      catch (e) { if (!e.tidakAda) throw e; adaFungsi = false; }
    }
    if (caraLama) { await caraLama(); return { ok: true, jumlah: [].concat(kode).length, lama: true }; }
    return { ok: true, jumlah: 0, lama: true };
  }
  async function cair(jumlah, rek, caraLama) {
    var sesi = (window.KSID && KSID.sesi("penjual")) || "";
    try { return await panggil("cair_ajukan", { p_sesi: sesi, p_jumlah: jumlah, p_rek: rek }); }
    catch (e) { if (!e.tidakAda || !caraLama) throw e; await caraLama(); return { ok: true, lama: true }; }
  }
  /* Baca data lewat fungsi server (supabase-keamanan-baca.sql). Bila fungsi belum ada, pakai caraLama(). */
  var adaBaca = {};
  async function baca(fn, body, caraLama) {
    if (adaBaca[fn] !== false) {
      try { var j = await panggil(fn, body || {}); adaBaca[fn] = true; return j; }
      catch (e) { if (!e.tidakAda || !caraLama) throw e; adaBaca[fn] = false; }
    }
    return caraLama();
  }
  function sesi(peran) { return (window.KSID && KSID.sesi(peran)) || (function () { try { return localStorage.getItem("kalensari_sesi_" + peran) || ""; } catch (e) { return ""; } })(); }
  /* Tulis catatan kurir (kurir_ord_ / antar_ / foto_ / lacak_) lewat server; value null = hapus */
  async function kurirSimpan(key, value, caraLama) {
    try { return await panggil("kurir_simpan", { p_sesi: sesi("kurir"), p_key: key, p_value: value }); }
    catch (e) { if (!e.tidakAda || !caraLama) throw e; return caraLama(); }
  }
  window.KSPesanan = { aksi: aksi, cair: cair, baca: baca, sesi: sesi, kurirSimpan: kurirSimpan };
})();
