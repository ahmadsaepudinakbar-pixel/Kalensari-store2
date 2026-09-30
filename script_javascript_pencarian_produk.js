/**
 * KALENSARI STORE - Script Integrasi Pencarian Produk
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
    document.querySelector('input[placeholder*="Ketik nama produk"]') || 
    document.querySelector('input[placeholder*="Cari makanan"]') || 
    document.querySelector('input[placeholder*="Cari"]') ||
    document.querySelector('#search-input');

  // Wadah / Modal Pencarian (Kotak Putih Pencarian)
  const searchModalContainer = 
    document.querySelector('.search-modal') || 
    document.querySelector('.search-box') ||
    mainSearchInput?.closest('div.fixed, div.absolute, div[class*="shadow"]') ||
    mainSearchInput?.closest('.bg-white');

  // Tombol Silang / Close (Tombol "x")
  const closeSearchBtn = 
    document.querySelector('#close-search-btn') ||
    document.querySelector('.close-search') ||
    searchModalContainer?.querySelector('button:has(svg), button:has(span), span.cursor-pointer') ||
    Array.from(document.querySelectorAll('button, span, div')).find(el => el.textContent.trim() === 'x' || el.textContent.trim() === '×');

  // Daftar kartu produk
  const productCards = document.querySelectorAll('.product-card, .card-produk, .grid > div, [data-product]');

  // ==========================================
  // 2. Event Tombol Floating Cari Produk (Aktifkan Pencarian)
  // ==========================================
  if (floatingSearchBtn) {
    floatingSearchBtn.addEventListener("click", function (e) {
      e.preventDefault();
      
      // Tampilkan wadah pencarian jika sebelumnya disembunyikan
      if (searchModalContainer) {
        searchModalContainer.style.display = "block";
      }

      if (mainSearchInput) {
        // Scroll halus menuju kolom pencarian utama
        mainSearchInput.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        // Fokuskan kursor ke kolom pencarian
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
  // 3. Event Tombol Close / Silang "x" (Kembalikan ke Pasif)
  // ==========================================
  if (closeSearchBtn) {
    closeSearchBtn.addEventListener("click", function (e) {
      e.preventDefault();

      // 1. Sembunyikan wadah/modal pencarian
      if (searchModalContainer) {
        searchModalContainer.style.display = "none";
      }

      // 2. Kosongkan nilai pencarian
      if (mainSearchInput) {
        mainSearchInput.value = "";
      }

      // 3. Tampilkan kembali semua produk ke kondisi semula
      productCards.forEach((card) => {
        card.style.display = "";
        card.style.opacity = "1";
        card.style.transform = "scale(1)";
      });

      // 4. Sembunyikan pesan "produk tidak ditemukan" jika ada
      const noResultEl = document.getElementById("no-product-found");
      if (noResultEl) {
        noResultEl.style.display = "none";
      }
    });
  }

  // ==========================================
  // 4. Mesin Pencarian Real-Time (Filter Produk)
  // ==========================================
  if (mainSearchInput && productCards.length > 0) {
    mainSearchInput.addEventListener("input", function () {
      const keyword = this.value.toLowerCase().trim();

      productCards.forEach((card) => {
        const productName = card.textContent.toLowerCase();

        if (productName.includes(keyword)) {
          card.style.display = "";
          card.style.opacity = "1";
          card.style.transform = "scale(1)";
        } else {
          card.style.display = "none";
        }
      });

      checkNoResults(keyword);
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
        noResultEl.innerHTML = `<p class="text-base font-medium">Produk dengan kata kunci "<strong>${keyword}</strong>" tidak ditemukan.</p>`;
        container.appendChild(noResultEl);
      } else {
        noResultEl.innerHTML = `<p class="text-base font-medium">Produk dengan kata kunci "<strong>${keyword}</strong>" tidak ditemukan.</p>`;
        noResultEl.style.display = "block";
      }
    } else if (noResultEl) {
      noResultEl.style.display = "none";
    }
  }
});