/* =========================================================
   musik.js — musik latar Kalensari Store (halaman terpisah)
   Pasang di SEMUA halaman:  <script src="musik.js" defer></script>
   Tombol musik (id="speakerBtn") cukup ada di halaman utama saja.
   ========================================================= */
(function () {
  // ---------- PENGATURAN ----------
  var SRC         = 'musik.mp3';  // lokasi file musik
  var VOLUME      = 0.4;
  var MUTED_CLASS = 'muted';      // class tampilan "speaker dicoret" milikmu

  // ---------- KUNCI PENYIMPANAN ----------
  var K_MUTED = 'musikMati';  // pilihan pengguna: '1' = dimatikan
  var K_POS   = 'musikPos';   // posisi terakhir (detik)
  var K_TS    = 'musikTs';    // waktu simpan terakhir, '0' jika sedang berhenti

  var audio = new Audio(SRC);
  audio.loop = true;
  audio.volume = VOLUME;
  audio.preload = 'auto';

  var userMuted = localStorage.getItem(K_MUTED) === '1';
  var btn = document.getElementById('speakerBtn'); // null di halaman selain utama

  // ---------- SIMPAN / PULIHKAN POSISI ----------
  function save() {
    try {
      localStorage.setItem(K_POS, String(audio.currentTime));
      localStorage.setItem(K_TS, audio.paused ? '0' : String(Date.now()));
    } catch (e) {}
  }

  function savedPosition() {
    var pos = parseFloat(localStorage.getItem(K_POS)) || 0;
    var ts  = parseInt(localStorage.getItem(K_TS), 10) || 0;
    // jika sebelumnya sedang main, tambahkan waktu yang terlewat saat pindah halaman
    if (ts) pos += (Date.now() - ts) / 1000;
    return pos;
  }

  // ---------- TAMPILAN TOMBOL ----------
  function updateIcon() {
    if (!btn) return;
    var mati = userMuted || audio.paused;
    btn.classList.toggle(MUTED_CLASS, mati);
    btn.setAttribute('aria-pressed', String(!mati));
  }

  // ---------- PUTAR ----------
  function tryPlay() {
    if (userMuted) return;
    var p = audio.play();
    if (p && p.catch) p.catch(function () { /* diblokir browser, tunggu sentuhan */ });
  }

  // browser sering memblokir autoplay di halaman baru -> mulai di sentuhan pertama
  var GESTURES = ['pointerdown', 'touchend', 'click', 'keydown'];
  function onGesture(e) {
    if (btn && e.target && btn.contains(e.target)) return; // biar tombol yang mengatur
    tryPlay();
  }
  GESTURES.forEach(function (ev) {
    document.addEventListener(ev, onGesture, { passive: true });
  });
  audio.addEventListener('playing', function () {
    GESTURES.forEach(function (ev) { document.removeEventListener(ev, onGesture); });
  });

  audio.addEventListener('play', updateIcon);
  audio.addEventListener('pause', updateIcon);

  // setelah metadata siap: lompat ke posisi terakhir, lalu putar
  audio.addEventListener('loadedmetadata', function () {
    var pos = savedPosition();
    if (audio.duration && isFinite(audio.duration)) pos = pos % audio.duration;
    try { audio.currentTime = pos; } catch (e) {}
    tryPlay();
  });

  // ---------- TOMBOL (hanya ada di halaman utama) ----------
  if (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (userMuted || audio.paused) {
        userMuted = false;
        localStorage.setItem(K_MUTED, '0');
        audio.play().catch(function () {});
      } else {
        userMuted = true;
        localStorage.setItem(K_MUTED, '1');
        audio.pause();
      }
      save();
      updateIcon();
    });
  }

  // ---------- SIMPAN OTOMATIS ----------
  setInterval(save, 1000);
  window.addEventListener('pagehide', save); // saat pindah halaman (audio masih jalan)

  // jeda saat tab/aplikasi di background, lanjut saat kembali
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      audio.pause();
      save();
    } else {
      tryPlay();
    }
  });

  updateIcon();
})();
