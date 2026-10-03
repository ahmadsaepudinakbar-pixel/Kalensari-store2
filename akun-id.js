/* Kalensari Store - ID akun (PB-0001 pembeli, PJ-0001 penjual, KR-0001 kurir, JS-0001 penyedia jasa)
   - KSID.keWA(input, peran): bila input berupa ID, kembalikan nomor WA pemilik akun (untuk masuk pakai ID + PIN).
     null = input bukan ID (pakai nomor WA seperti biasa), "" = ID tidak ditemukan.
   - KSID.lencana(kode): potongan HTML "🆔 KR-0001" + tombol salin. */
(function () {
  var C = window.CLOUD_CONFIG || {};
  var AWAL = { pembeli: "PB", penjual: "PJ", kurir: "KR", jasa: "JS" };
  function rapikan(v) {
    var m = String(v || "").trim().toUpperCase().match(/^(PB|PJ|KR|JS)[\s-]?0*(\d{1,6})$/);
    return m ? m[1] + "-" + ("000" + m[2]).slice(-Math.max(4, m[2].length)) : null;
  }
  async function ambil(key) {
    var base = String(C.supabaseUrl || "").replace(/\/$/, "");
    var r = await fetch(base + "/rest/v1/store_settings?select=value&key=eq." + encodeURIComponent(key), { headers: { apikey: C.supabaseAnonKey, Authorization: "Bearer " + C.supabaseAnonKey } });
    var j = await r.json(); return j && j[0] ? j[0].value : null;
  }
  async function keWA(input, peran) {
    var kode = rapikan(input); if (!kode) return null;
    if (AWAL[peran] && kode.indexOf(AWAL[peran] + "-") !== 0) return "";
    try {
      var hasil = await Promise.all([ambil(peran + "_members"), ambil(peran + "_accounts")]);
      var list = Array.isArray(hasil[0]) ? hasil[0] : [], acc = hasil[1] && typeof hasil[1] === "object" ? hasil[1] : {};
      var m = list.filter(function (x) { return x && String(x.kode || "").toUpperCase() === kode; })[0];
      if (!m) return "";
      var wa = Object.keys(acc).filter(function (w) { return acc[w] && acc[w].id === m.id; })[0];
      return wa || "";
    } catch (e) { return ""; }
  }
  function lencana(kode) {
    if (!kode) return "";
    var k = String(kode).replace(/[^A-Z0-9-]/gi, "");
    return '<span class="ks-id" style="display:inline-flex;align-items:center;gap:6px;background:#f4efe9;color:#5b2e1a;border-radius:999px;padding:4px 6px 4px 12px;font:700 13px system-ui,sans-serif;letter-spacing:.5px">🆔 ' + k
      + '<button type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText(\'' + k + '\');this.textContent=\'✓\';setTimeout(()=>this.textContent=\'Salin\',1500)" style="border:0;background:#fff;border-radius:999px;padding:3px 10px;font:600 12px system-ui,sans-serif;color:#5b2e1a;cursor:pointer">Salin</button></span>';
  }
  window.KSID = { keWA: keWA, rapikan: rapikan, lencana: lencana };
})();
