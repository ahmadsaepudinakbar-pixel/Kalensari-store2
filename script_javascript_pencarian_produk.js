/**
 * KALENSARI STORE - Pencarian Produk
 * FIX: tombol X mengembalikan mesin pencarian ke kondisi PASIF.
 */

document.addEventListener("DOMContentLoaded", function () {
  // ==========================================
  // 1. Inisialisasi Elemen
  // ==========================================
  const floatingSearchBtn =
    document.querySelector(".floating-search-btn") ||
    document.querySelector("#cari-produk-btn") ||
    Array.from(document.querySelectorAll("button, a")).find(el =>
      (el.textContent || "").includes("Cari Produk")
    );

  const mainSearchInput =
    document.querySelector('input[placeholder*="Cari makanan"]') ||
    document.querySelector('input[placeholder*="Cari"]') ||
    document.querySelector("#search-input");

  const productCards = document.querySelectorAll(
    ".product-card, .card-produk, .grid > div, [data-product]"
  );

  // ==========================================
  // 2. Tombol Floating Cari Produk
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
          mainSearchInput.style.boxShadow =
            "0 0 0 3px rgba(184, 115, 51, 0.4)";

          setTimeout(() => {
            mainSearchInput.style.boxShadow = "";
          }, 1500);
        }, 400);
      }
    });
  }

  // ==========================================
  // 3. Mesin Pencarian Real-Time
  // ==========================================
  if (mainSearchInput && productCards.length > 0) {
    mainSearchInput.addEventListener("input", function () {
      const keyword = this.value.toLowerCase().trim();

      productCards.forEach(card => {
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

  // ==========================================
  // 4. Pesan Produk Tidak Ditemukan
  // ==========================================
  function checkNoResults(keyword) {
    let noResultEl = document.getElementById("no-product-found");
    const container = productCards[0]?.parentElement;

    if (!container) return;

    const visibleProducts = Array.from(productCards).filter(
      card => card.style.display !== "none"
    );

    if (visibleProducts.length === 0 && keyword !== "") {
      if (!noResultEl) {
        noResultEl = document.createElement("div");
        noResultEl.id = "no-product-found";
        noResultEl.className =
          "text-center py-8 text-gray-500 w-full col-span-full";
        noResultEl.innerHTML =
          `<p class="text-base font-medium">Produk dengan kata kunci "<strong>${keyword}</strong>" tidak ditemukan.</p>`;
        container.appendChild(noResultEl);
      } else {
        noResultEl.innerHTML =
          `<p class="text-base font-medium">Produk dengan kata kunci "<strong>${keyword}</strong>" tidak ditemukan.</p>`;
        noResultEl.style.display = "block";
      }
    } else if (noResultEl) {
      noResultEl.style.display = "none";
    }
  }

  // ==========================================
  // 5. TAMBAHKAN TOMBOL X PADA MESIN PENCARIAN
  // ==========================================
  function addSearchCloseButton() {
    if (!mainSearchInput) return;

    // Jangan membuat tombol X lebih dari satu.
    if (document.getElementById("kalensari-search-close")) return;

    const wrapper =
      mainSearchInput.parentElement || mainSearchInput.closest("div");

    if (!wrapper) return;

    // Pastikan wrapper menjadi acuan posisi tombol.
    const computed = window.getComputedStyle(wrapper);
    if (computed.position === "static") {
      wrapper.style.position = "relative";
    }

    const closeBtn = document.createElement("button");
    closeBtn.id = "kalensari-search-close";
    closeBtn.type = "button";
    closeBtn.innerHTML = "×";
    closeBtn.setAttribute("aria-label", "Tutup pencarian");
    closeBtn.setAttribute("title", "Tutup pencarian");

    closeBtn.style.cssText = `
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: #777;
      font-size: 30px;
      line-height: 1;
      cursor: pointer;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    `;

    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.background = "#f2f2f2";
      closeBtn.style.color = "#333";
    });

    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.background = "transparent";
      closeBtn.style.color = "#777";
    });

    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      resetSearchToPassive();
    });

    wrapper.appendChild(closeBtn);

    // Beri ruang kanan agar teks tidak bertabrakan dengan X.
    mainSearchInput.style.paddingRight = "55px";
  }

  // Buat tombol X setelah halaman siap.
  addSearchCloseButton();

  // ==========================================
  // 6. FIX TOMBOL X
  // ==========================================

  // ==========================================
  function getSearchPanel() {
    if (!mainSearchInput) return null;

    const selectors = [
      "#search-panel",
      ".search-panel",
      ".search-container",
      ".search-box",
      ".pencarian-produk",
      ".product-search",
      "[data-search-panel]"
    ];

    for (const selector of selectors) {
      const panel = mainSearchInput.closest(selector);
      if (panel) return panel;
    }

    // Fallback untuk struktur HTML yang membungkus input
    // bersama judul "Cari produk".
    let parent = mainSearchInput.parentElement;

    for (let i = 0; parent && i < 7; i++, parent = parent.parentElement) {
      const text = (parent.textContent || "").toLowerCase();

      if (
        text.includes("cari produk") &&
        parent.contains(mainSearchInput)
      ) {
        return parent;
      }
    }

    return null;
  }

  function resetSearchToPassive() {
    if (!mainSearchInput) return;

    // Kosongkan input.
    mainSearchInput.value = "";

    // Kembalikan semua produk.
    productCards.forEach(card => {
      card.style.display = "";
      card.style.opacity = "1";
      card.style.transform = "scale(1)";
    });

    // Hapus pesan hasil pencarian.
    const noResultEl = document.getElementById("no-product-found");
    if (noResultEl) {
      noResultEl.style.display = "none";
    }

    // Hilangkan fokus dari input.
    mainSearchInput.blur();

    // Tutup panel pencarian agar kembali PASIF.
    const panel = getSearchPanel();

    if (panel) {
      panel.style.display = "none";
    }

    // Tampilkan lagi tombol pencarian melayang.
    if (floatingSearchBtn) {
      floatingSearchBtn.style.display = "";
      floatingSearchBtn.hidden = false;
      floatingSearchBtn.removeAttribute("aria-hidden");
    }
  }

  function isCloseButton(button) {
    const label = (
      button.getAttribute("aria-label") ||
      button.getAttribute("title") ||
      button.textContent ||
      button.value ||
      ""
    ).trim().toLowerCase();

    return (
      label === "x" ||
      label === "×" ||
      label.includes("tutup") ||
      label.includes("close") ||
      label.includes("hapus pencarian") ||
      label.includes("clear search")
    );
  }

  // Tangani tombol X yang sudah ada saat halaman dimuat.
  function setupCloseButtons() {
    if (!mainSearchInput) return;

    const buttons = Array.from(
      document.querySelectorAll(
        'button, [role="button"], input[type="button"], input[type="reset"]'
      )
    );

    buttons.forEach(button => {
      if (!isCloseButton(button)) return;

      const panel = button.closest(
        "#search-panel, .search-panel, .search-container, .search-box, " +
        ".pencarian-produk, .product-search, [data-search-panel]"
      );

      const nearInput =
        panel?.contains(mainSearchInput) ||
        button.parentElement?.contains(mainSearchInput) ||
        button.closest("div")?.contains(mainSearchInput);

      if (nearInput) {
        button.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          resetSearchToPassive();
        });
      }
    });
  }

  setupCloseButtons();

  // Event delegation: tetap bekerja jika tombol X dibuat
  // secara dinamis oleh HTML/JavaScript.
  document.addEventListener(
    "click",
    function (e) {
      if (!mainSearchInput) return;

      const button = e.target.closest(
        'button, [role="button"], input[type="button"], input[type="reset"]'
      );

      if (!button || !isCloseButton(button)) return;

      const panel = button.closest(
        "#search-panel, .search-panel, .search-container, .search-box, " +
        ".pencarian-produk, .product-search, [data-search-panel]"
      );

      if (panel?.contains(mainSearchInput)) {
        e.preventDefault();
        e.stopPropagation();
        resetSearchToPassive();
      }
    },
    true
  );
});
