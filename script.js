/**
 * KALENSARI STORE - Script Integrasi Pencarian Produk & Dynamic Clear
 */

document.addEventListener("DOMContentLoaded", function () {
  // ==========================================
  // 1. Inisialisasi Elemen
  // ==========================================
  
  // Tombol melayang di pojok kanan bawah
  const floatingSearchBtn = 
    document.querySelector('.floating-search-btn') || 
    document.querySelector('#cari-produk-btn') ||
    Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Cari Produk'));

  // Input teks pencarian produk utama
  const mainSearchInput = 
    document.querySelector('input[placeholder*="Cari makanan"]') || 
    document.querySelector('input[placeholder*="Cari"]') ||
    document.querySelector('#search-input');

  // Ikon/Logo Pencarian & Clear (X)
  const searchIcon = document.querySelector('#searchIcon, .search-icon');
  const clearIcon = document.querySelector('#clearIcon, .clear-icon');
  const actionBtn = document.querySelector('#actionBtn, .icon-btn');

  // Daftar kartu produk
  const productCards = document.querySelectorAll('.product-card, .card-produk, .grid > div, [data-product]');

  // ==========================================
  // 2. Fungsi Pengubah Logo (Search <-> X)
  // ==========================================
  function updateIconState() {
    if (!mainSearchInput) return;
    
    const hasValue = mainSearchInput.value.trim() !== '';

    if (searchIcon && clearIcon) {
      if (hasValue) {
        searchIcon.classList.remove('active');
        searchIcon.style.display = 'none';
        clearIcon.classList.add('active');
        clearIcon.style.display = 'block';
      } else {
        clearIcon.classList.remove('active');
        clearIcon.style.display = 'none';
        searchIcon.classList.add('active');
        searchIcon.style.display = 'block';
      }
    }
  }

  // Event handler jika tombol ikon "X" ditekan
  if (actionBtn) {
    actionBtn.addEventListener('click', function () {
      if (mainSearchInput && mainSearchInput.value !== '') {
        mainSearchInput.value = ''; // Kosongkan input
        updateIconState();          // Kembalikan logo ke semula
        filterProducts('');         // Reset tampilan produk
        mainSearchInput.focus();    // Kembalikan fokus kursor
      }
    });
  }

  // ==========================================
  // 3. Event Tombol Floating Cari Produk
  // ==========================================
  if (floatingSearchBtn) {
    floatingSearchBtn.addEventListener("click", function (e) {
      e.preventDefault();
      
      if (mainSearchInput) {
        mainSearchInput.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        setTimeout(() => {
          mainSearchInput.focus();
          mainSearchInput.style.transition = "box-shadow 0.3s ease";
          mainSearchInput.style.boxShadow = "0 0 0 3px rgba(184, 115, 51, 0.4)";
          
          setTimeout(() => {
            mainSearchInput.style.boxShadow = "";
          }, 1500);
        }, 400);
      } else {
        const productSection = document.querySelector('.product-section, .produk-container') || productCards[0]?.parentElement;
        if (productSection) {
          productSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  }

  // ==========================================
  // 4. Mesin Pencarian Real-Time (Filter Produk)
  // ==========================================
  function filterProducts(keyword) {
    const cleanKeyword = keyword.toLowerCase().trim();

    productCards.forEach((card) => {
      const productName = card.textContent.toLowerCase();

      if (productName.includes(cleanKeyword)) {
        card.style.display = "";
        card.style.opacity = "1";
        card.style.transform = "scale(1)";
      } else {
        card.style.display = "none";
      }
    });

    checkNoResults(cleanKeyword);
  }

  if (mainSearchInput) {
    mainSearchInput.addEventListener("input", function () {
      updateIconState();
      filterProducts(this.value);
    });
  }

  // Fungsi penanganan jika produk tidak ditemukan
  function checkNoResults(keyword) {
    let noResultEl = document.getElementById("no-product-found");
    const container = productCards[0]?.parentElement;

    if (!container) return;

    const visibleProducts = Array.from(productCards).filter(
      (card) => card.style.display !== "none"
    );

    if (visibleProducts.length === 0 && keyword !== "") {
      if (!noResultEl) {
        noResultEl = document.createElement("div");
        noResultEl.id = "no-product-found";
        noResultEl.className = "text-center py-8 text-gray-500 w-full col-span-full";
        container.appendChild(noResultEl);
      }
      
      noResultEl.textContent = `Produk dengan kata kunci "${keyword}" tidak ditemukan.`;
      noResultEl.style.display = "block";
    } else if (noResultEl) {
      noResultEl.style.display = "none";
    }
  }
});
