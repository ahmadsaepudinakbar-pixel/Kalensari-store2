/* ===== SLIDE IKLAN BERANDA =====
   Maksimal 10 iklan. Tampil 1 sampai 10, lalu kembali ke 1.
   Cara mengubah: edit daftar ADS di bawah ini.
   e   = emoji/gambar kecil     t = judul        d = keterangan singkat
   tag = label kecil di atas    btn = tulisan tombol
   c1, c2 = warna latar (gradasi)
   link = alamat halaman (misal "jasa.html" atau "#products")
   wa   = jika diisi, tombol membuka WhatsApp toko dengan pesan tersebut
   Hapus tanda "CONTOH" setelah diganti dengan iklan asli. */
const ADS = [
  {e:"🍜", tag:"KULINER · CONTOH", t:"Bakso Kuah Komplit", d:"Hangat, gurih, porsi pas. Cocok untuk makan siang keluarga.", btn:"Lihat menu", c1:"#8a3b12", c2:"#c0662b", link:"#products"},
  {e:"🥤", tag:"MINUMAN · CONTOH", t:"Es Teh Jumbo Rp5.000", d:"Segar diminum siang hari. Beli 5 gelas gratis 1.", btn:"Pesan sekarang", c1:"#0f6b4a", c2:"#2a9d6b", link:"#products"},
  {e:"🍱", tag:"PRASMANAN · CONTOH", t:"Paket Nasi Box Hajatan", d:"Terima pesanan untuk pengajian, arisan, dan syukuran.", btn:"Tanya via WhatsApp", c1:"#7a3e20", c2:"#b9722f", wa:"Halo KALENSARI STORE, saya ingin tanya paket nasi box."},
  {e:"🧁", tag:"JAJANAN · CONTOH", t:"Kue Basah & Kue Kering", d:"Buatan warga, cocok untuk oleh-oleh dan hantaran.", btn:"Lihat produk", c1:"#9b3d5a", c2:"#d1698a", link:"#products"},
  {e:"📶", tag:"JASA · CONTOH", t:"Pasang WiFi Rumah", d:"Pemasangan cepat dan rapi oleh penyedia jasa desa.", btn:"Lihat penyedia jasa", c1:"#14577a", c2:"#2a8fb8", link:"jasa.html"},
  {e:"🔧", tag:"JASA · CONTOH", t:"Servis Motor & Bengkel", d:"Servis ringan, ganti oli, tambal ban. Bisa panggil ke rumah.", btn:"Lihat penyedia jasa", c1:"#3b4252", c2:"#667089", link:"jasa.html"},
  {e:"🧵", tag:"JASA · CONTOH", t:"Jahit & Permak Pakaian", d:"Permak celana, seragam, dan pesan baju sesuai ukuran.", btn:"Lihat penyedia jasa", c1:"#6b3fa0", c2:"#9a6bd1", link:"jasa.html"},
  {e:"📹", tag:"JASA · CONTOH", t:"Pasang CCTV Rumah & Warung", d:"Tenang saat ditinggal pergi. Konsultasi gratis.", btn:"Lihat penyedia jasa", c1:"#1f3a5f", c2:"#3e6aa0", link:"jasa.html"},
  {e:"💚", tag:"SANTUNAN", t:"Yuk Berbagi untuk Anak Yatim", d:"Lihat laporan kas dan daftar donatur secara terbuka.", btn:"Info santunan", c1:"#1e7a3c", c2:"#46a861", link:"santunan.html"},
  {e:"📣", tag:"PASANG IKLAN", t:"Iklankan Usaha Anda di Sini", d:"Dilihat warga Kalensari setiap hari. Hubungi admin.", btn:"Hubungi admin", c1:"#b0541a", c2:"#e08a2e", wa:"Halo KALENSARI STORE, saya ingin memasang iklan di beranda."}
].slice(0, 10);

(function(){
  const box = document.getElementById("adSlider");
  if (!box || !ADS.length) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const waUrl = t => (typeof WHATSAPP_NUMBER !== "undefined" ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}` : "#products");

  box.innerHTML =
    `<div class="ad-viewport">${ADS.map((a, i) =>
      `<a class="ad-slide" href="${a.wa ? "#" : esc(a.link || "#products")}" ${a.wa ? `data-wa="${esc(a.wa)}"` : ""} style="--a:${a.c1};--b:${a.c2}" aria-label="Iklan ${i + 1} dari ${ADS.length}">
        <span class="ad-emo" aria-hidden="true">${a.e}</span>
        <span class="ad-tx"><em>${esc(a.tag)}</em><strong>${esc(a.t)}</strong><span>${esc(a.d)}</span><b>${esc(a.btn)} &rarr;</b></span>
      </a>`).join("")}</div>
    <div class="ad-bar">
      <div class="ad-dots">${ADS.map((_, i) => `<button type="button" aria-label="Iklan ${i + 1}"></button>`).join("")}</div>
      <button type="button" class="ad-pause" aria-label="Jeda slide iklan">&#10074;&#10074;</button>
    </div>`;

  const slides = [...box.querySelectorAll(".ad-slide")];
  const dots = [...box.querySelectorAll(".ad-dots button")];
  const pauseBtn = box.querySelector(".ad-pause");
  const vp = box.querySelector(".ad-viewport");
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let i = 0, timer = null, userPaused = reduce, hover = false;

  function show(n) {
    i = (n + slides.length) % slides.length;          // setelah terakhir kembali ke 1
    slides.forEach((s, k) => { s.classList.toggle("on", k === i); s.tabIndex = k === i ? 0 : -1; s.setAttribute("aria-hidden", k === i ? "false" : "true"); });
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
  }
  function stop() { clearInterval(timer); timer = null; }
  function start() { stop(); if (!userPaused && !hover && slides.length > 1) timer = setInterval(() => show(i + 1), 4500); }
  function go(n) { show(n); start(); }

  dots.forEach((d, k) => d.addEventListener("click", () => go(k)));
  pauseBtn.addEventListener("click", () => {
    userPaused = !userPaused;
    pauseBtn.innerHTML = userPaused ? "&#9654;" : "&#10074;&#10074;";
    pauseBtn.setAttribute("aria-label", userPaused ? "Putar slide iklan" : "Jeda slide iklan");
    start();
  });
  box.addEventListener("mouseenter", () => { hover = true; stop(); });
  box.addEventListener("mouseleave", () => { hover = false; start(); });
  box.addEventListener("focusin", () => { hover = true; stop(); });
  box.addEventListener("focusout", () => { hover = false; start(); });
  slides.forEach(s => s.addEventListener("click", e => {
    if (s.dataset.wa) { e.preventDefault(); window.open(waUrl(s.dataset.wa), "_blank", "noopener"); }
  }));

  /* geser dengan jari */
  let x0 = null;
  vp.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; stop(); }, {passive: true});
  vp.addEventListener("touchend", e => {
    if (x0 !== null) { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); }
    x0 = null; start();
  }, {passive: true});

  if (userPaused) pauseBtn.innerHTML = "&#9654;";
  show(0); start();
})();
