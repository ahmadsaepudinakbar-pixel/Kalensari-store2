/* Kalensari Store - ID akun (PB-0001 pembeli, PJ-0001 penjual, KR-0001 kurir, JS-0001 penyedia jasa)
   - KSID.keWA(input, peran): bila input berupa ID akun, kembalikan ID yang dirapikan (dicocokkan di server saat masuk).
   - KSID.masuk / gantiPin / sesi / saya / simpan: masuk & ubah data akun lewat server dengan kunci sesi.
   - KSID.lencana(kode): potongan HTML "🆔 KR-0001" + tombol salin. */
(function () {
  var C = window.CLOUD_CONFIG || {};
  var AWAL = { pembeli: "PB", penjual: "PJ", kurir: "KR", jasa: "JS" };
  function rapikan(v) {
    var m = String(v || "").trim().toUpperCase().match(/^(PB|PJ|KR|JS)[\s-]?0*(\d{1,6})$/);
    return m ? m[1] + "-" + ("000" + m[2]).slice(-Math.max(4, m[2].length)) : null;
  }
  // Bila input berupa ID akun, kembalikan ID itu sendiri (dicocokkan di server saat masuk).
  // null = bukan ID (pakai nomor WA), "" = ID untuk peran lain.
  async function keWA(input, peran) {
    var kode = rapikan(input); if (!kode) return null;
    if (AWAL[peran] && kode.indexOf(AWAL[peran] + "-") !== 0) return "";
    return kode;
  }
  function lencana(kode) {
    if (!kode) return "";
    var k = String(kode).replace(/[^A-Z0-9-]/gi, "");
    return '<span class="ks-id" style="display:inline-flex;align-items:center;gap:6px;background:#f4efe9;color:#5b2e1a;border-radius:999px;padding:4px 6px 4px 12px;font:700 13px system-ui,sans-serif;letter-spacing:.5px">🆔 ' + k
      + '<button type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText(\'' + k + '\');this.textContent=\'✓\';setTimeout(()=>this.textContent=\'Salin\',1500)" style="border:0;background:#fff;border-radius:999px;padding:3px 10px;font:600 12px system-ui,sans-serif;color:#5b2e1a;cursor:pointer">Salin</button></span>';
  }
  // Masuk & ganti PIN diperiksa di server (PIN tidak lagi bisa dibaca dari web). Salah 5x = dikunci 15 menit.
  async function rpcAkun(fn, body) {
    var base = String(C.supabaseUrl || "").replace(/\/$/, "");
    var r = await fetch(base + "/rest/v1/rpc/" + fn, { method: "POST", headers: { apikey: C.supabaseAnonKey, Authorization: "Bearer " + C.supabaseAnonKey, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    var t = await r.text(), j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
    if (!r.ok) throw new Error((j && j.message) || "Gagal terhubung ke server (" + r.status + ")");
    if (!j || j.ok === false) { var er = new Error((j && j.pesan) || "Nomor atau PIN salah"); er.salahPin = !(j && j.sesi_habis); er.sesiHabis = !!(j && j.sesi_habis); er.kunci = !!(j && j.kunci); throw er; }
    return j;
  }
  // Sesi masuk: kunci acak dari server, disimpan di HP ini. Wajib untuk mengubah data akun sendiri.
  function sesi(peran) { try { return localStorage.getItem("kalensari_sesi_" + peran) || ""; } catch (e) { return ""; } }
  function setSesi(peran, t) { try { if (t) localStorage.setItem("kalensari_sesi_" + peran, t); } catch (e) {} }
  function hapusSesi(peran) { var t = sesi(peran); try { localStorage.removeItem("kalensari_sesi_" + peran); } catch (e) {} if (t) rpcAkun("keluar_akun", { p_sesi: t }).catch(function () {}); }
  async function saya(peran) { return rpcAkun("akun_saya", { p_sesi: sesi(peran), p_peran: peran }); }
  async function simpan(peran, data) { var j = await rpcAkun("simpan_anggota", { p_sesi: sesi(peran), p_peran: peran, p_data: data }); return j.data; }
  async function masuk(peran, wa, pin) { var j = await rpcAkun("masuk_akun", { p_peran: peran, p_wa: wa, p_pin: pin }); setSesi(peran, j.sesi); return j; }
  async function gantiPin(peran, wa, lama, baru) { var j = await rpcAkun("ganti_pin_akun", { p_peran: peran, p_wa: wa, p_pin_lama: lama, p_pin_baru: baru }); setSesi(peran, j.sesi); return j; }
  window.KSID = { keWA: keWA, rapikan: rapikan, lencana: lencana, masuk: masuk, gantiPin: gantiPin, rpc: rpcAkun,
                  sesi: sesi, setSesi: setSesi, hapusSesi: hapusSesi, saya: saya, simpan: simpan };
})();
