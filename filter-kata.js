/* KALENSARI • Filter kata kasar (KSFilter)
   Kata kasar diganti bintang dengan panjang yang sama:  "dasar anjing" -> "dasar ******"
   - Mengenali variasi: huruf besar/kecil, huruf diulang (anjiiing), angka pengganti (4nj1ng), dan sisipan titik/strip (a.n.j.i.n.g).
   - Kata pendek yang berisiko salah sasaran (mis. "tai" di "taiwan") hanya dicocokkan sebagai KATA UTUH.
   Pemakaian:
     KSFilter.bersihkan("teks")        -> teks yang sudah disensor
     KSFilter.kotor("teks")            -> true bila ada kata kasar
     KSFilter.tambah(["kata1","kata2"]) -> tambah kata sendiri
     <textarea data-filter>            -> otomatis disensor SAAT MENGETIK (cukup tambahkan atribut data-filter) */
(function () {
  // Kata panjang & khas: dicocokkan di dalam kata (anjing -> anjingnya, anjiiing, dst.)
  var SUB = ["anjing", "anjink", "bangsat", "bajingan", "kontol", "goblok", "tolol", "kampret", "brengsek", "keparat",
    "sialan", "jancok", "jancuk", "pelacur", "lonte", "sundal", "jembut", "ngentot", "ngentod", "bedebah",
    "fuck", "bitch", "asshole", "bastard"];
  // Kata pendek / berisiko salah sasaran: hanya KATA UTUH (boleh diakhiri -nya / -lah / -kah)
  var TOK = ["tai", "asu", "cuk", "jing", "anjir", "memek", "pepek", "ngewe", "bokep", "coli", "bego", "perek", "idiot", "dungu",
    "kimak", "entot", "shit", "ajg", "anjg", "kntl", "bgst", "bngst", "gblk", "mmk"];
  var LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };
  var SEP = /[.\-_*+,'`]/;                     // sisipan yang diabaikan di dalam kata
  var PUTUS = /[\s!?()\[\]{};:"\/\\|<>=~#%^&]/; // pemisah kata
  var SUFIKS = "(?:nya|lah|kah)?";

  function rapat(s) { return String(s).replace(/(.)\1+/g, "$1"); }   // huruf berulang -> satu
  var KUSTOM = [], subList = [], tokRe = null;
  // Gabungkan kata bawaan + kata tambahan admin. >= 5 huruf: dicocokkan di dalam kata; 3-4 huruf: kata utuh.
  function bangun() {
    var sub = SUB.slice(), tok = TOK.slice();
    KUSTOM.forEach(function (k) { (k.length >= 5 ? sub : tok).push(k); });
    subList = sub.map(rapat).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    tokRe = new RegExp("^(?:" + tok.map(rapat).join("|") + ")" + SUFIKS + "$");
  }
  bangun();

  // Normalisasi satu kata: kembalikan {n: huruf rapi, a: indeks awal asli tiap huruf, z: indeks akhir asli tiap huruf}
  function normal(w, off) {
    var n = [], a = [], z = [];
    for (var i = 0; i < w.length; i++) {
      var c = w[i].toLowerCase(); if (SEP.test(c)) continue;
      c = LEET[c] || c; if (!/[a-z]/.test(c)) { n.push("\u0000"); a.push(off + i); z.push(off + i); continue; }
      if (n.length && n[n.length - 1] === c) { z[z.length - 1] = off + i; continue; }
      n.push(c); a.push(off + i); z.push(off + i);
    }
    return { n: n.join(""), a: a, z: z };
  }

  /* opsi.sedangMengetik = true: kata TERAKHIR yang belum diakhiri spasi/tanda baca tidak dicek sebagai kata utuh
     (supaya mengetik "taiwan" tidak tersensor di tengah jalan). */
  function cari(teks, opsi) {
    var s = String(teks == null ? "" : teks), hasil = [], i = 0, L = s.length, mengetik = !!(opsi && opsi.sedangMengetik);
    while (i < L) {
      if (PUTUS.test(s[i])) { i++; continue; }
      var j = i; while (j < L && !PUTUS.test(s[j])) j++;
      if (j - i > 40) { i = j; continue; }   // bukan kata biasa (URL / data gambar): lewati
      var w = s.slice(i, j), nm = normal(w, i), akhirBelum = mengetik && j === L;
      if (nm.n) {
        if (!akhirBelum && tokRe.test(nm.n)) hasil.push([i, j - 1]);
        else {
          for (var k = 0; k < subList.length; k++) {
            var p = nm.n.indexOf(subList[k]);
            while (p >= 0) { hasil.push([nm.a[p], nm.z[p + subList[k].length - 1]]); p = nm.n.indexOf(subList[k], p + subList[k].length); }
          }
        }
      }
      i = j;
    }
    return hasil;
  }

  function bersihkan(teks, opsi) {
    var s = String(teks == null ? "" : teks), r = cari(s, opsi); if (!r.length) return s;
    var c = s.split(""); r.forEach(function (x) { for (var q = x[0]; q <= x[1]; q++) c[q] = "*"; });
    return c.join("");
  }
  function kotor(teks) { return cari(teks).length > 0; }
  // Ganti seluruh daftar kata tambahan (dari admin). Huruf kecil, 3-30 huruf/angka, maks. 500 kata.
  function atur(daftar) {
    var h = [];
    (daftar || []).forEach(function (k) {
      k = String(k || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""); if (k.length >= 3 && k.length <= 30 && h.indexOf(k) < 0) h.push(k);
    });
    KUSTOM = h.slice(0, 500); bangun();
  }
  function tambah(daftar) { atur(KUSTOM.concat(daftar || [])); }

  /* Kata tambahan dari admin: store_settings "kata_terlarang" = {kata:[...]} (diatur di Admin > Pengaturan).
     Disimpan di HP agar langsung aktif saat halaman dibuka, lalu diperbarui dari server paling cepat tiap 10 menit. */
  var CK = "kalensari_kata_terlarang";
  function muat() {
    try { var c = JSON.parse(localStorage.getItem(CK) || "null"); if (c && Array.isArray(c.kata)) atur(c.kata); } catch (e) {}
    try {
      var cfg = window.CLOUD_CONFIG || {}; if (!cfg.enabled || !cfg.supabaseUrl) return;
      var c2 = JSON.parse(localStorage.getItem(CK) || "null"); if (c2 && Date.now() - (c2.cek || 0) < 600000) return;
      fetch(String(cfg.supabaseUrl).replace(/\/$/, "") + "/rest/v1/store_settings?select=value&key=eq.kata_terlarang",
        { headers: { apikey: cfg.supabaseAnonKey, Authorization: "Bearer " + cfg.supabaseAnonKey } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (!Array.isArray(j)) return; var v = (j[0] && j[0].value) || {}, k = Array.isArray(v.kata) ? v.kata : [];
          atur(k); try { localStorage.setItem(CK, JSON.stringify({ kata: k, cek: Date.now() })); } catch (e) {} })
        .catch(function () {});
    } catch (e) {}
  }

  window.KSFilter = { bersihkan: bersihkan, kotor: kotor, tambah: tambah, atur: atur, muat: muat, jumlahBawaan: SUB.length + TOK.length };
  if (typeof localStorage !== "undefined") muat();
  if (typeof module !== "undefined") module.exports = window.KSFilter;

  // Sensor langsung saat mengetik pada kolom bertanda data-filter (panjang teks tetap sama, kursor tidak loncat)
  if (typeof document !== "undefined") {
    var terap = function (el, mengetik) {
      if (!el || !el.matches || !el.matches("[data-filter]") || typeof el.value !== "string") return;
      var b = bersihkan(el.value, { sedangMengetik: mengetik });
      if (b !== el.value) { var a = el.selectionStart, z = el.selectionEnd; el.value = b; try { el.setSelectionRange(a, z); } catch (e) {} }
    };
    document.addEventListener("input", function (e) { if (!e.isComposing) terap(e.target, true); }, true);
    document.addEventListener("focusout", function (e) { terap(e.target, false); }, true);
  }
})();
