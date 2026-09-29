<div class="search-container">
  <!-- Kolom Input -->
  <input type="text" id="myInput" placeholder="Ketik sesuatu di sini..." oninput="handleInput()">
  
  <!-- Logo/Ikon (Awalnya logo kaca pembesar / Search) -->
  <span id="iconBtn" onclick="handleIconClick()" class="icon">🔍</span>
</div>

<script>
  const inputEl = document.getElementById('myInput');
  const iconEl = document.getElementById('iconBtn');

  // 1. Fungsi saat pengguna mengetik
  function handleInput() {
    if (inputEl.value.trim() !== "") {
      // Jika ada teks, ubah logo menjadi X
      iconEl.textContent = "✖"; 
      iconEl.style.cursor = "pointer";
    } else {
      // Jika teks kosong, kembalikan ke logo awal
      iconEl.textContent = "🔍";
    }
  }

  // 2. Fungsi saat logo ditekan
  function handleIconClick() {
    // Jika logo saat ini adalah X, kembalikan semuanya seperti semula
    if (iconEl.textContent === "✖") {
      inputEl.value = ""; // Kosongkan input
      iconEl.textContent = "🔍"; // Kembalikan logo ke awal
      inputEl.focus(); // Fokuskan kembali ke input (opsional)
    }
  }
</script>
