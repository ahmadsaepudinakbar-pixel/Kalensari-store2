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
  var subList = SUB.map(rapat), tokRe = null;
  function bangunTok() { tokRe = new RegExp("^(?:" + TOK.map(rapat).join("|") + ")" + SUFIKS + "$"); }
  bangunTok();

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
  function tambah(daftar) {
    (daftar || []).forEach(function (k) {
      k = String(k || "").trim().toLowerCase(); if (k.length < 3) return;
      if (k.length >= 5) { var r = rapat(k); if (subList.indexOf(r) < 0) subList.push(r); }
      else if (TOK.indexOf(k) < 0) TOK.push(k);
    }); bangunTok();
  }

  window.KSFilter = { bersihkan: bersihkan, kotor: kotor, tambah: tambah };
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
