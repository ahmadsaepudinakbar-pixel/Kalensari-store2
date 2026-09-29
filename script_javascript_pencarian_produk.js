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
    document.querySelector('input[placeholder*="Cari makanan"]') || 
    document.querySelector('input[placeholder*="Cari"]') ||
    document.querySelector('#search-input');

  // Daftar kartu produk
  const productCards = document.querySelectorAll('.product-card, .card-produk, .grid > div, [data-product]');

  // ==========================================
  // 2. Event Tombol Floating Cari Produk
  // ==========================================
  if (floatingSearchBtn) {
    floatingSearchBtn.addEventListener("click", function (e) {
      e.preventDefault();
      
      if (mainSearchInput) {
        // Scroll halus menuju kolom pencarian utama
        mainSearchInput.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        // Fokuskan kursor ke kolom pencarian
        setTimeout(() => {
          mainSearchInput.focus();
          // Beri efek highlight visual sementara pada input pencarian
          mainSearchInput.style.transition = "box-shadow 0.3s ease";
          mainSearchInput.style.boxShadow = "0 0 0 3px rgba(184, 115, 51, 0.4)";
          
          setTimeout(() => {
            mainSearchInput.style.boxShadow = "";
          }, 1500);
        }, 400);
      } else {
        // Jika input pencarian tidak ditemukan, scroll ke bagian grid produk
        const productSection = document.querySelector('.product-section, .produk-container') || productCards[0]?.parentElement;
        if (productSection) {
          productSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  }

  // ==========================================
  // 3. Mesin Pencarian Real-Time (Filter Produk)
  // ==========================================
  if (mainSearchInput && productCards.length > 0) {
    mainSearchInput.addEventListener("input", function () {
      const keyword = this.value.toLowerCase().trim();

      productCards.forEach((card) => {
        const productName = card.textContent.toLowerCase();

        // Tampilkan atau sembunyikan kartu produk berdasarkan kata kunci
        if (productName.includes(keyword)) {
          card.style.display = "";
          card.style.opacity = "1";
          card.style.transform = "scale(1)";
        } else {
          card.style.display = "none";
        }
      });

      // Tampilkan pesan jika tidak ada produk yang cocok
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