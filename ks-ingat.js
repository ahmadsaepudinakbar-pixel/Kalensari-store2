/* Kalensari Store • INGAT LOGIN di aplikasi Android (WebView)
   Di sebagian HP, data login di WebView bisa hilang saat aplikasi ditutup paksa.
   File ini menyalin data "kalensari_*" ke penyimpanan aplikasi Android (jembatan window.KalensariApp)
   dan memulihkannya saat aplikasi dibuka lagi. Di browser biasa file ini tidak melakukan apa-apa.
   Harus dimuat PALING AWAL di <head>, sebelum skrip lain. */
(function () {
  "use strict";
  var A = window.KalensariApp;
  if (!A || typeof A.simpanData !== "function" || typeof A.ambilData !== "function") return;
  var PFX = /^kalensari_/;
  var LS; try { LS = window.localStorage; } catch (e) { return; }
  if (!LS) return;

  // 1) pulihkan yang hilang
  try {
    var daftar = JSON.parse(A.daftarData() || "[]");
    daftar.forEach(function (k) {
      if (PFX.test(k) && LS.getItem(k) == null) { var v = A.ambilData(k); if (v != null && v !== "") LS.setItem(k, v); }
    });
  } catch (e) {}

  // 2) setiap perubahan ikut disalin ke aplikasi
  var asliSet = Storage.prototype.setItem, asliHapus = Storage.prototype.removeItem, asliBersih = Storage.prototype.clear;
  Storage.prototype.setItem = function (k, v) {
    asliSet.call(this, k, v);
    if (this === LS && PFX.test(String(k))) { try { A.simpanData(String(k), String(v)); } catch (e) {} }
  };
  Storage.prototype.removeItem = function (k) {
    asliHapus.call(this, k);
    if (this === LS && PFX.test(String(k))) { try { A.hapusData(String(k)); } catch (e) {} }
  };
  Storage.prototype.clear = function () {
    if (this === LS) { try { JSON.parse(A.daftarData() || "[]").forEach(function (k) { A.hapusData(k); }); } catch (e) {} }
    asliBersih.call(this);
  };

  // 3) salin juga yang sudah ada sekarang
  try { for (var i = 0; i < LS.length; i++) { var k = LS.key(i); if (PFX.test(k)) A.simpanData(k, LS.getItem(k)); } } catch (e) {}
})();
