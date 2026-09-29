/* =========================================================
   KALENSARI STORE V7 - SCRIPT FINAL
   Desa Kuliner Kalensari
   ========================================================= */

"use strict";

/* =========================================================
   KONFIGURASI
   ========================================================= */

// Nomor WhatsApp toko.
// GANTI dengan nomor WhatsApp KALENSARI STORE.
const WHATSAPP_NUMBER = "6281234567890";

// Ongkos kirim
const SHIPPING_COST = 0;

// PIN Admin
const ADMIN_PIN = "1234";

// Aman walaupun config.js tidak tersedia
const CLOUD_CONFIG =
  window.CLOUD_CONFIG || {
    enabled: false,
    supabaseUrl: "",
    supabaseAnonKey: ""
  };


/* =========================================================
   DATA PRODUK
   ========================================================= */

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Lotek Bongko",
    price: 12000,
    sale: 8000,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Teh Ida",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/o-fvve-chatgpt%20image%20sep%2028%2C%202026%2C%2005_14_09%20am.png?versionId=sSlnWC5X3v6SfdE8SJ7kfFpkAAtYEG66"
  },
  {
    id: 2,
    name: "Bakso Sapi Biasa",
    price: 10000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Zyan Bakso",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/pf0do4-chatgpt%20image%20sep%2028%2C%202026%2C%2006_23_05%20am.png?versionId=LvDf81yvhC2OIgUPloRKlaBbRFi.9BuH"
  },
  {
    id: 3,
    name: "Mie Ayam Pedas",
    price: 10000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "H. Diman, Mang Edo, Mang Tardug",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/0qg0at-chatgpt%20image%20sep%2028%2C%202026%2C%2002_03_31%20pm.png?versionId=EH1aAjwRvQd3dMY93ItbAgINe5lzjnTw"
  },
  {
    id: 4,
    name: "Mie Ayam Biasa",
    price: 10000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "H. Diman, Mang Edo, Mang Tardug",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/m5q9je-chatgpt%20image%20sep%2028%2C%202026%2C%2002_02_42%20pm.png?versionId=Lci_mH9SOmBpD2nCjBV_Z_o_XXpxpW8v"
  },
  {
    id: 5,
    name: "Bakso Tulang",
    price: 25000,
    sale: 18000,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Zyan Bakso",
    status: "Out of Stock",
    image: "https://cdn.store.link/products/kalensaristore80353/agx1iw-chatgpt%20image%20sep%2028%2C%202026%2C%2006_29_33%20am.png?versionId=1n1pJ2ilQgM4jrhR5X_0LEG9mB.lTmg8"
  },
  {
    id: 6,
    name: "Bakso Telur",
    price: 12000,
    sale: 10000,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Zyan Bakso",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/8a69b3-chatgpt%20image%20sep%2028%2C%202026%2C%2006_34_03%20am.png?versionId=m_nc2BhsK7d4LdKAPdxnMAiRHAV.Q2qB"
  },
  {
    id: 7,
    name: "Bakso Urat",
    price: 18000,
    sale: 15000,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Zyan Bakso",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/obbajp-chatgpt%20image%20sep%2028%2C%202026%2C%2006_36_33%20am.png?versionId=h_Evc0EcQtdz4PFbFk8aZey0jgRRXZ.p"
  },
  {
    id: 8,
    name: "Jus Alpukat",
    price: 10000,
    sale: null,
    category: "Minuman",
    unit: "1 cup besar",
    seller: "Teh Liya",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/3x8j0a-chatgpt%20image%20sep%2028%2C%202026%2C%2006_52_41%20am.png?versionId=eKLzC7y3fgCWrkTSAdcaLHEyEYAdZMsh"
  },
  {
    id: 9,
    name: "Jus Buah Naga",
    price: 10000,
    sale: null,
    category: "Minuman",
    unit: "1 cup besar",
    seller: "Teh Liya",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/p8vus5-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_02%20am.png?versionId=e6H7dwvYmMOZrI86QKN98dyVxHcc8V0M"
  },
  {
    id: 10,
    name: "Jus Tomat",
    price: 10000,
    sale: null,
    category: "Minuman",
    unit: "1 cup besar",
    seller: "Teh Liya",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/o4d1bt-chatgpt%20image%20sep%2028%2C%202026%2C%2007_20_47%20am.png?versionId=IbXRZdg2vp6bCuXJPch5YT7FgQZXXcRM"
  },
  {
    id: 11,
    name: "Jus Mangga",
    price: 10000,
    sale: null,
    category: "Minuman",
    unit: "1 cup besar",
    seller: "Teh Liya",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/lqk2sp-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_59%20am.png?versionId=FADsI7qbgepPpQt7XVGl901Q_3cKHFQW"
  },
  {
    id: 12,
    name: "Es Teh Manis",
    price: 3000,
    sale: null,
    category: "Minuman",
    unit: "1 cup besar",
    seller: "Tea DESA",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/abqncl-hops-3260267377.webp?versionId=P4DG3eGis6QyEzh9ZFQm3CBF8p9DEJwx"
  },
  {
    id: 13,
    name: "Es Teh Matcha Latte",
    price: 6000,
    sale: null,
    category: "Minuman",
    unit: "1 cup besar rasa Greentea",
    seller: "Tea DESA",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/c9c6rx-images%20%281%29.jpg?versionId=K0P2vQjt8SpfWctljxkmCkUO_8AfkYf2"
  },
  {
    id: 14,
    name: "Es Teh Matcha Premium",
    price: 15000,
    sale: 12000,
    category: "Minuman",
    unit: "1 cup besar rasa Greentea",
    seller: "Tea DESA",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/bkv3a5-images.jpg?versionId=jKTeHTYDtwRD2qs6CWqYs9ZM2EBZ9emC"
  },
  {
    id: 15,
    name: "Nasi Kebuli",
    price: 25000,
    sale: 20000,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Teh Iyoh",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/u4fafx-chatgpt%20image%20sep%2028%2C%202026%2C%2002_14_04%20pm.png?versionId=DHZD_c9LScH15.An7XpzcTJMrjDf0AJk"
  },
  {
    id: 16,
    name: "Nasi Goreng",
    price: 13000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Kang Diki Sueb",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/h38vn8-chatgpt%20image%20sep%2028%2C%202026%2C%2002_11_47%20pm.png?versionId=Q1UfoJozDqlb8kaNfjJqp6nKv74i_B3F"
  },
  {
    id: 17,
    name: "Pecel Lele",
    price: 15000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Mang Tardug",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"
  },
  {
    id: 18,
    name: "Pecel Lele + Nasi",
    price: 20000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Mang Tardug",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"
  },
  {
    id: 19,
    name: "Pecel Ayam",
    price: 20000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Mang Tardug",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"
  },
  {
    id: 20,
    name: "Pecel Ayam + Nasi",
    price: 25000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Mang Tardug",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"
  },
  {
    id: 21,
    name: "Fried Chicken",
    price: 10000,
    sale: null,
    category: "Makanan",
    unit: "Ayam Goreng Tepung",
    seller: "Warga Kalensari",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/q38c2x-chatgpt%20image%20sep%2028%2C%202026%2C%2002_23_43%20pm.png?versionId=RR2yA7Iutiz2jXiFwJNUzApiqzE7ItsL"
  },
  {
    id: 22,
    name: "Soto Ayam",
    price: 20000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Sate Madura",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/4io072-chatgpt%20image%20sep%2028%2C%202026%2C%2002_22_28%20pm.png?versionId=48IdG9bl9fPErJcNUzMeAPrvhzOOe_qr"
  },
  {
    id: 23,
    name: "Sate Ayam",
    price: 20000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Sate Madura",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/ewpn71-chatgpt%20image%20sep%2028%2C%202026%2C%2002_18_51%20pm.png?versionId=X09ZJ.tPJyqr_LhYnZRngTpDFKIVqz0b"
  },
  {
    id: 24,
    name: "Nasi Ayam Katsu",
    price: 20000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Teh Iyoh",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/ievcoz-chatgpt%20image%20sep%2028%2C%202026%2C%2002_17_10%20pm.png?versionId=buhfyErVz0r0y_eaESh2AooKeylFdopS"
  },
  {
    id: 25,
    name: "Spageti",
    price: 10000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Teh Iyoh",
    status: "Show",
    image: "https://cdn.store.link/products/kalensaristore80353/d62zqy-aa1408ce-c67d-4d63-aa67-12ec89b3c905.png?versionId=chUteSwuPamgkCgB_ORU_hnugVoqj8dW"
  }
];


/* =========================================================
   DATA PRODUK
   ========================================================= */

let products;

try {
  const saved = JSON.parse(
    localStorage.getItem("kalensari_products") || "null"
  );

  products =
    Array.isArray(saved) && saved.length
      ? saved
      : DEFAULT_PRODUCTS.map(p => ({ ...p }));
} catch (error) {
  products = DEFAULT_PRODUCTS.map(p => ({ ...p }));
}

let cart = [];

try {
  const savedCart = JSON.parse(
    localStorage.getItem("kalensari_cart") || "[]"
  );

  cart = Array.isArray(savedCart) ? savedCart : [];
} catch (error) {
  cart = [];
}

let activeCategory = "Semua";
let adminLoggedIn = false;


/* =========================================================
   HELPER
   ========================================================= */

function rupiah(number) {
  return "Rp" + new Intl.NumberFormat("id-ID").format(
    Number(number) || 0
  );
}

function currentPrice(product) {
  return product && Number(product.sale) > 0
    ? Number(product.sale)
    : Number(product.price) || 0;
}

function saveProducts() {
  localStorage.setItem(
    "kalensari_products",
    JSON.stringify(products)
  );
}

function saveCart() {
  localStorage.setItem(
    "kalensari_cart",
    JSON.stringify(cart)
  );
}

function waLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getProductImage(imagePath) {
  if (!imagePath) return "";

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  if (!CLOUD_CONFIG.supabaseUrl) {
    return "";
  }

  return `${CLOUD_CONFIG.supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/products/${imagePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function priceHTML(product) {
  if (Number(product.sale) > 0) {
    return `
      <span class="old-price">${rupiah(product.price)}</span>
      ${rupiah(product.sale)}
    `;
  }

  return rupiah(product.price);
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}


/* =========================================================
   KATEGORI
   ========================================================= */

function renderCategories() {
  const container = document.getElementById("categories");

  if (!container) return;

  const categories = [
    "Semua",
    ...new Set(
      products
        .filter(p => p && p.category)
        .map(p => p.category)
    )
  ];

  container.innerHTML = categories
    .map(category => `
      <button
        class="cat ${category === activeCategory ? "active" : ""}"
        onclick="setCategory(${JSON.stringify(category)})"
      >
        ${esc(category)}
      </button>
    `)
    .join("");
}

function setCategory(category) {
  activeCategory = category;

  renderCategories();
  renderProducts();

  const productsSection = document.getElementById("products");

  if (productsSection) {
    productsSection.scrollIntoView({
      behavior: "smooth"
    });
  }
}


/* =========================================================
   PRODUK
   ========================================================= */

function renderProducts() {
  const grid = document.getElementById("productGrid");

  if (!grid) return;

  /*
    PERBAIKAN PENTING:
    searchInput dan sortSelect sudah dihapus dari HTML.
    Jadi script tidak boleh error ketika keduanya tidak ada.
  */

  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  const query = searchInput
    ? searchInput.value.toLowerCase().trim()
    : "";

  const sort = sortSelect
    ? sortSelect.value
    : "";

  let list = products.filter(product => {
    if (!product) return false;

    if (product.status !== "Show") return false;

    if (
      activeCategory !== "Semua" &&
      product.category !== activeCategory
    ) {
      return false;
    }

    if (!query) return true;

    const name = String(product.name || "").toLowerCase();
    const category = String(product.category || "").toLowerCase();
    const seller = String(product.seller || "").toLowerCase();

    return (
      name.includes(query) ||
      category.includes(query) ||
      seller.includes(query)
    );
  });

  if (sort === "priceAsc") {
    list.sort(
      (a, b) => currentPrice(a) - currentPrice(b)
    );
  }

  if (sort === "priceDesc") {
    list.sort(
      (a, b) => currentPrice(b) - currentPrice(a)
    );
  }

  if (sort === "name") {
    list.sort((a, b) =>
      String(a.name).localeCompare(
        String(b.name),
        "id"
      )
    );
  }

  const resultInfo = document.getElementById("resultInfo");

  if (resultInfo) {
    resultInfo.textContent = `${list.length} produk`;
  }

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <b>😔 Produk tidak ditemukan</b>
        <br>
        Coba pilih kategori lainnya.
      </div>
    `;

    return;
  }

  grid.innerHTML = list
    .map(product => `
      <article class="product">

        <div class="product-img">

          <img
            src="${esc(getProductImage(product.image))}"
            alt="${esc(product.name)}"
            loading="lazy"
            onerror="
              this.style.display='none';
              this.parentElement.classList.add('image-error');
            "
          >

          ${
            Number(product.sale) > 0
              ? `<span class="sale-badge">PROMO</span>`
              : ""
          }

        </div>

        <div class="product-body">

          <h3>${esc(product.name)}</h3>

          <div class="price">
            ${priceHTML(product)}
          </div>

          <small>
            ${esc(product.unit || "")}
          </small>

          <small class="seller">
            👤 ${esc(product.seller || "Warga Kalensari")}
          </small>

          <div class="product-actions">

            <button
              class="btn outline"
              onclick="showProduct(${Number(product.id)})"
            >
              Detail
            </button>

            <button
              class="btn primary"
              onclick="addToCart(${Number(product.id)})"
            >
              + Keranjang
            </button>

          </div>

        </div>

      </article>
    `)
    .join("");
}


/* =========================================================
   DETAIL PRODUK
   ========================================================= */

function showProduct(id) {
  const product = products.find(
    p => Number(p.id) === Number(id)
  );

  if (!product) return;

  const detail = document.getElementById("productDetail");

  if (!detail) return;

  const sold = product.status !== "Show";

  detail.innerHTML = `
    <div class="detail">

      <div class="detail-img">

        ${
          product.image
            ? `
              <img
                src="${esc(getProductImage(product.image))}"
                alt="${esc(product.name)}"
                onerror="this.style.display='none'"
              >
            `
            : "🖼️"
        }

      </div>

      <div>

        <p class="eyebrow">
          ${esc(product.category || "")}
          •
          ${esc(product.seller || "")}
        </p>

        <h2>
          ${esc(product.name)}
        </h2>

        <div class="price">
          ${priceHTML(product)}
        </div>

        <p>
          Satuan:
          ${esc(product.unit || "-")}
        </p>

        <p>
          ${
            sold
              ? "Stok habis."
              : "Produk tersedia untuk dipesan."
          }
        </p>

        <button
          class="btn primary full"
          ${sold ? "disabled" : ""}
          onclick="
            addToCart(${Number(product.id)});
            closeModal('productModal');
          "
        >
          🛒 Tambah ke Keranjang
        </button>

        <br><br>

        <a
          class="btn outline full"
          target="_blank"
          rel="noopener"
          href="${waLink(
            `Halo KALENSARI STORE, saya ingin membeli ${product.name} (${rupiah(
              currentPrice(product)
            )}).`
          )}"
        >
          💬 Beli via WhatsApp
        </a>

      </div>

    </div>
  `;

  openModal("productModal");
}


/* =========================================================
   KERANJANG
   ========================================================= */

function addToCart(id) {
  const product = products.find(
    p => Number(p.id) === Number(id)
  );

  if (!product) return;

  if (product.status !== "Show") {
    showToast("Produk sedang tidak tersedia");
    return;
  }

  const existing = cart.find(
    item => Number(item.id) === Number(id)
  );

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: Number(id),
      qty: 1
    });
  }

  saveCart();
  updateCartCount();
  renderCart();

  showToast(
    `${product.name} ditambahkan ke keranjang`
  );
}

function changeQty(id, difference) {
  const item = cart.find(
    item => Number(item.id) === Number(id)
  );

  if (!item) return;

  item.qty += difference;

  if (item.qty <= 0) {
    cart = cart.filter(
      item => Number(item.id) !== Number(id)
    );
  }

  saveCart();
  updateCartCount();
  renderCart();
}

function cartData() {
  return cart
    .map(item => {
      const product = products.find(
        p => Number(p.id) === Number(item.id)
      );

      if (!product) return null;

      return {
        ...product,
        qty: Number(item.qty) || 1
      };
    })
    .filter(Boolean);
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");

  if (!cartItems) return;

  const items = cartData();

  const subtotal = items.reduce(
    (total, product) =>
      total +
      currentPrice(product) *
        Number(product.qty),
    0
  );

  const shipping = items.length
    ? SHIPPING_COST
    : 0;

  if (!items.length) {
    cartItems.innerHTML = `
      <div class="empty-state">
        <b>🛒 Keranjang masih kosong</b>
        <br>
        Yuk pilih makanan atau minuman favoritmu.
      </div>
    `;
  } else {
    cartItems.innerHTML = items
      .map(product => `
        <div class="cart-row">

          <div>

            <div class="cart-name">
              ${esc(product.name)}
            </div>

            <div class="cart-price">
              ${rupiah(currentPrice(product))}
              ×
              ${product.qty}
            </div>

          </div>

          <div class="qty">

            <button
              onclick="changeQty(${product.id}, -1)"
            >
              −
            </button>

            <b>${product.qty}</b>

            <button
              onclick="changeQty(${product.id}, 1)"
            >
              +
            </button>

          </div>

        </div>
      `)
      .join("");
  }

  const totalItems = cart.reduce(
    (total, item) =>
      total + (Number(item.qty) || 0),
    0
  );

  const itemLabel =
    document.getElementById("cartItemLabel");

  const subtotalElement =
    document.getElementById("cartSubtotal");

  const shippingElement =
    document.getElementById("cartShipping");

  const totalElement =
    document.getElementById("cartTotal");

  const checkoutTotal =
    document.getElementById("checkoutTotal");

  const checkoutButton =
    document.getElementById("checkoutBtn");

  if (itemLabel) {
    itemLabel.textContent =
      `${totalItems} item`;
  }

  if (subtotalElement) {
    subtotalElement.textContent =
      rupiah(subtotal);
  }

  if (shippingElement) {
    shippingElement.textContent =
      rupiah(shipping);
  }

  if (totalElement) {
    totalElement.textContent =
      rupiah(subtotal + shipping);
  }

  if (checkoutTotal) {
    checkoutTotal.textContent =
      rupiah(subtotal + shipping);
  }

  if (checkoutButton) {
    checkoutButton.disabled =
      !items.length;
  }
}

function updateCartCount() {
  const countElement =
    document.getElementById("cartCount");

  if (!countElement) return;

  const total = cart.reduce(
    (sum, item) =>
      sum + (Number(item.qty) || 0),
    0
  );

  countElement.textContent = total;
}


/* =========================================================
   MODAL
   ========================================================= */

function openModal(id) {
  const modal = document.getElementById(id);

  if (!modal) return;

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  const modal = document.getElementById(id);

  if (!modal) return;

  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}


/* =========================================================
   EVENT MODAL
   ========================================================= */

document.querySelectorAll("[data-close]")
  .forEach(button => {
    button.addEventListener("click", () => {
      closeModal(button.dataset.close);
    });
  });

document.querySelectorAll(".modal")
  .forEach(modal => {

    modal.addEventListener("click", event => {

      if (event.target === modal) {
        modal.classList.remove("show");
        modal.setAttribute(
          "aria-hidden",
          "true"
        );
      }

    });

  });


/* =========================================================
   KERANJANG BUTTON
   ========================================================= */

const cartButton =
  document.getElementById("cartBtn");

if (cartButton) {
  cartButton.addEventListener(
    "click",
    () => {
      renderCart();
      openModal("cartModal");
    }
  );
}


const checkoutButton =
  document.getElementById("checkoutBtn");

if (checkoutButton) {
  checkoutButton.addEventListener(
    "click",
    () => {

      if (!cartData().length) {
        showToast("Keranjang masih kosong");
        return;
      }

      closeModal("cartModal");
      openModal("checkoutModal");

    }
  );
}


/* =========================================================
   SEARCH - OPSIONAL
   Kalau nanti search ditambahkan lagi, otomatis aktif.
   ========================================================= */

const searchInput =
  document.getElementById("searchInput");

if (searchInput) {
  searchInput.addEventListener(
    "input",
    renderProducts
  );
}


const sortSelect =
  document.getElementById("sortSelect");

if (sortSelect) {
  sortSelect.addEventListener(
    "change",
    renderProducts
  );
}


const clearSearch =
  document.getElementById("clearSearch");

if (clearSearch) {
  clearSearch.addEventListener(
    "click",
    () => {

      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }

      renderProducts();
    }
  );
}


/* =========================================================
   WHATSAPP
   ========================================================= */

function setupWhatsApp() {

  const message =
    "Halo KALENSARI STORE, saya ingin bertanya tentang produk.";

  const hero =
    document.getElementById("waHero");

  if (hero) {
    hero.href = waLink(message);
  }

  const general =
    document.getElementById("waGeneral");

  if (general) {
    general.href = waLink(message);
  }

  const floating =
    document.getElementById("waFloat");

  if (floating) {
    floating.href = waLink(
      "Halo KALENSARI STORE, saya ingin memesan."
    );
  }
}

setupWhatsApp();


/* =========================================================
   CHECKOUT
   ========================================================= */

const checkoutForm =
  document.getElementById("checkoutForm");

if (checkoutForm) {

  checkoutForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const items = cartData();

      if (!items.length) {
        showToast("Keranjang masih kosong");
        return;
      }

      const formData =
        new FormData(checkoutForm);

      const subtotal =
        items.reduce(
          (total, product) =>
            total +
            currentPrice(product) *
              product.qty,
          0
        );

      const total =
        subtotal + SHIPPING_COST;

      const detail =
        items
          .map(
            product =>
              `- ${product.name} x${product.qty} = ${rupiah(
                currentPrice(product) *
                  product.qty
              )}`
          )
          .join("\n");

      const name =
        String(formData.get("name") || "");

      const phone =
        String(formData.get("phone") || "");

      const address =
        String(formData.get("address") || "");

      const note =
        String(formData.get("note") || "-");

      const payment =
        String(formData.get("payment") || "");

      const message =
`Halo KALENSARI STORE, saya ingin memesan:

${detail}

Subtotal: ${rupiah(subtotal)}
Ongkir: ${rupiah(SHIPPING_COST)}
TOTAL: ${rupiah(total)}

Nama: ${name}
No. WhatsApp: ${phone}
Alamat: ${address}
Catatan: ${note}
Pembayaran: ${payment}`;

      // Simpan pesanan ke cloud jika tersedia
      await saveCloudOrder({
        customer_name: name,
        customer_phone: phone,
        address,
        note,
        payment,
        items,
        subtotal,
        shipping: SHIPPING_COST,
        total,
        status: "baru"
      });

      window.open(
        waLink(message),
        "_blank"
      );

      // Kosongkan keranjang
      cart = [];

      saveCart();
      updateCartCount();
      renderCart();

      closeModal("checkoutModal");

      checkoutForm.reset();

      showToast(
        "Pesanan berhasil dikirim ke WhatsApp"
      );

    }
  );

}


/* =========================================================
   TAHUN FOOTER
   ========================================================= */

const year =
  document.getElementById("year");

if (year) {
  year.textContent =
    new Date().getFullYear();
}


/* =========================================================
   ADMIN
   ========================================================= */

function openAdmin() {

  const adminPin =
    document.getElementById("adminPin");

  const adminLogin =
    document.getElementById("adminLogin");

  const adminPanel =
    document.getElementById("adminPanel");

  if (adminPin) {
    adminPin.value = "";
  }

  if (adminLogin) {
    adminLogin.hidden =
      adminLoggedIn;
  }

  if (adminPanel) {
    adminPanel.hidden =
      !adminLoggedIn;
  }

  if (adminLoggedIn) {
    renderAdminProducts();
    renderAdminOrders();
  }

  openModal("adminModal");
}


function renderAdminProducts() {

  const box =
    document.getElementById(
      "adminProductList"
    );

  if (!box) return;

  box.innerHTML = products
    .map((product, index) => `

      <div class="admin-product">

        ${
          product.image
            ? `
              <img
                src="${esc(
                  getProductImage(
                    product.image
                  )
                )}"
                alt="${esc(product.name)}"
                onerror="
                  this.style.display='none'
                "
              >
            `
            : `
              <div
                style="
                  width:72px;
                  height:72px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  background:#f3e3d6;
                  border-radius:10px;
                "
              >
                🍽️
              </div>
            `
        }

        <div class="admin-product-info">

          <h4>

            ${esc(product.name)}

            <span
              class="
                admin-status
                ${
                  product.status !== "Show"
                    ? "off"
                    : ""
                }
              "
            >
              ${esc(product.status)}
            </span>

          </h4>

          <small>
            ${esc(product.category)}
            •
            ${rupiah(
              currentPrice(product)
            )}
            •
            ${esc(product.seller)}
          </small>

        </div>

        <div class="admin-product-actions">

          <button
            class="btn outline"
            onclick="editAdminProduct(${index})"
          >
            ✏️ Edit
          </button>

          <button
            class="btn outline"
            onclick="toggleAdminProduct(${index})"
          >
            ${
              product.status === "Show"
                ? "⏸️ Sembunyikan"
                : "▶️ Tampilkan"
            }
          </button>

          <button
            class="btn outline"
            onclick="deleteAdminProduct(${index})"
          >
            🗑️ Hapus
          </button>

        </div>

        <div
          id="edit-${index}"
          class="admin-edit"
          hidden
        ></div>

      </div>

    `)
    .join("");
}


function editAdminProduct(index) {

  const product = products[index];

  if (!product) return;

  const box =
    document.getElementById(
      `edit-${index}`
    );

  if (!box) return;

  box.hidden = false;

  box.innerHTML = `

    <label>
      Nama
      <input
        id="e-name-${index}"
        value="${esc(product.name)}"
      >
    </label>

    <label>
      Kategori
      <select id="e-cat-${index}">
        <option
          ${
            product.category === "Makanan"
              ? "selected"
              : ""
          }
        >
          Makanan
        </option>

        <option
          ${
            product.category === "Minuman"
              ? "selected"
              : ""
          }
        >
          Minuman
        </option>
      </select>
    </label>

    <label>
      Harga
      <input
        id="e-price-${index}"
        type="number"
        value="${Number(product.price) || 0}"
      >
    </label>

    <label>
      Harga Promo
      <input
        id="e-sale-${index}"
        type="number"
        value="${
          Number(product.sale) > 0
            ? product.sale
            : ""
        }"
        placeholder="Kosongkan jika tidak promo"
      >
    </label>

    <label>
      Penjual
      <input
        id="e-seller-${index}"
        value="${esc(product.seller)}"
      >
    </label>

    <label>
      Satuan
      <input
        id="e-unit-${index}"
        value="${esc(product.unit)}"
      >
    </label>

    <label class="wide">
      URL Foto
      <input
        id="e-image-${index}"
        value="${esc(product.image || "")}"
      >
    </label>

    <div class="admin-edit-actions">

      <button
        class="btn primary"
        onclick="saveAdminProduct(${index})"
      >
        💾 Simpan
      </button>

      <button
        class="btn outline"
        onclick="renderAdminProducts()"
      >
        Batal
      </button>

    </div>
  `;
}


function saveAdminProduct(index) {

  const product = products[index];

  if (!product) return;

  const name =
    document.getElementById(
      `e-name-${index}`
    );

  const category =
    document.getElementById(
      `e-cat-${index}`
    );

  const price =
    document.getElementById(
      `e-price-${index}`
    );

  const sale =
    document.getElementById(
      `e-sale-${index}`
    );

  const seller =
    document.getElementById(
      `e-seller-${index}`
    );

  const unit =
    document.getElementById(
      `e-unit-${index}`
    );

  const image =
    document.getElementById(
      `e-image-${index}`
    );

  product.name =
    name ? name.value.trim() : product.name;

  product.category =
    category
      ? category.value
      : product.category;

  product.price =
    price
      ? Number(price.value) || 0
      : product.price;

  const saleValue =
    sale
      ? Number(sale.value)
      : 0;

  product.sale =
    saleValue > 0
      ? saleValue
      : null;

  product.seller =
    seller
      ? seller.value.trim()
      : product.seller;

  product.unit =
    unit
      ? unit.value.trim()
      : product.unit;

  product.image =
    image
      ? image.value.trim()
      : product.image;

  saveProducts();
  syncCloudProducts();

  renderCategories();
  renderProducts();
  renderAdminProducts();

  showToast(
    "Produk berhasil diperbarui"
  );
}


function addAdminProduct() {

  const newId =
    products.length
      ? Math.max(
          ...products.map(
            p => Number(p.id) || 0
          )
        ) + 1
      : 1;

  products.unshift({
    id: newId,
    name: "Produk Baru",
    price: 10000,
    sale: null,
    category: "Makanan",
    unit: "1 porsi",
    seller: "Warga Kalensari",
    status: "Show",
    image: ""
  });

  saveProducts();
  syncCloudProducts();

  renderCategories();
  renderProducts();
  renderAdminProducts();

  editAdminProduct(0);

  showToast(
    "Produk baru ditambahkan"
  );
}


function toggleAdminProduct(index) {

  const product = products[index];

  if (!product) return;

  product.status =
    product.status === "Show"
      ? "Out of Stock"
      : "Show";

  saveProducts();
  syncCloudProducts();

  renderProducts();
  renderAdminProducts();
}


function deleteAdminProduct(index) {

  const product = products[index];

  if (!product) return;

  if (
    !confirm(
      `Hapus ${product.name}?`
    )
  ) {
    return;
  }

  products.splice(index, 1);

  saveProducts();
  syncCloudProducts();

  renderProducts();
  renderCategories();
  renderAdminProducts();

  showToast(
    "Produk berhasil dihapus"
  );
}


/* =========================================================
   ADMIN LOGIN
   ========================================================= */

const menuButton =
  document.getElementById("menuBtn");

if (menuButton) {
  menuButton.addEventListener(
    "click",
    openAdmin
  );
}


const adminLoginButton =
  document.getElementById(
    "adminLoginBtn"
  );

if (adminLoginButton) {

  adminLoginButton.addEventListener(
    "click",
    () => {

      const pin =
        document.getElementById(
          "adminPin"
        );

      if (
        pin &&
        pin.value === ADMIN_PIN
      ) {

        adminLoggedIn = true;

        const login =
          document.getElementById(
            "adminLogin"
          );

        const panel =
          document.getElementById(
            "adminPanel"
          );

        if (login) {
          login.hidden = true;
        }

        if (panel) {
          panel.hidden = false;
        }

        renderAdminProducts();
        renderAdminOrders();

        showToast(
          "Login admin berhasil"
        );

      } else {

        showToast(
          "PIN admin salah"
        );

      }

    }
  );

}


/* =========================================================
   ADMIN BUTTON
   ========================================================= */

const addProductButton =
  document.getElementById(
    "addProductBtn"
  );

if (addProductButton) {
  addProductButton.addEventListener(
    "click",
    addAdminProduct
  );
}


const exportButton =
  document.getElementById(
    "exportBtn"
  );

if (exportButton) {

  exportButton.addEventListener(
    "click",
    () => {

      const blob =
        new Blob(
          [
            JSON.stringify(
              products,
              null,
              2
            )
          ],
          {
            type:
              "application/json"
          }
        );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        "kalensari-products.json";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

    }
  );

}


/* =========================================================
   IMPORT PRODUK
   ========================================================= */

const importFile =
  document.getElementById(
    "importFile"
  );

if (importFile) {

  importFile.addEventListener(
    "change",
    event => {

      const file =
        event.target.files[0];

      if (!file) return;

      const reader =
        new FileReader();

      reader.onload = () => {

        try {

          const data =
            JSON.parse(
              reader.result
            );

          if (!Array.isArray(data)) {
            throw new Error(
              "Data bukan array"
            );
          }

          products =
            data.map(
              (product, index) => ({
                ...product,
                id:
                  Number(product.id) ||
                  index + 1
              })
            );

          saveProducts();
          syncCloudProducts();

          renderCategories();
          renderProducts();
          renderAdminProducts();

          showToast(
            "Produk berhasil diimpor"
          );

        } catch (error) {

          showToast(
            "File produk tidak valid"
          );

        }

      };

      reader.readAsText(file);

    }
  );

}


/* =========================================================
   RESET PRODUK
   ========================================================= */

const resetProductsButton =
  document.getElementById(
    "resetProductsBtn"
  );

if (resetProductsButton) {

  resetProductsButton.addEventListener(
    "click",
    () => {

      if (
        !confirm(
          "Kembalikan 25 produk bawaan?"
        )
      ) {
        return;
      }

      products =
        DEFAULT_PRODUCTS.map(
          product => ({
            ...product
          })
        );

      saveProducts();
      syncCloudProducts();

      renderCategories();
      renderProducts();
      renderAdminProducts();

      showToast(
        "Produk dikembalikan ke bawaan"
      );

    }
  );

}


/* =========================================================
   CLOUD / SUPABASE
   ========================================================= */

let cloudReady = false;

function cloudHeaders() {

  return {
    apikey:
      CLOUD_CONFIG.supabaseAnonKey,

    Authorization:
      `Bearer ${CLOUD_CONFIG.supabaseAnonKey}`,

    "Content-Type":
      "application/json",

    Prefer:
      "return=representation"
  };

}


async function cloudFetch(
  path,
  options = {}
) {

  if (
    !CLOUD_CONFIG.enabled ||
    !CLOUD_CONFIG.supabaseUrl ||
    !CLOUD_CONFIG.supabaseAnonKey
  ) {
    throw new Error(
      "cloud-disabled"
    );
  }

  const response =
    await fetch(
      `${CLOUD_CONFIG.supabaseUrl}/rest/v1/${path}`,
      {
        ...options,

        headers: {
          ...cloudHeaders(),
          ...(options.headers || {})
        }
      }
    );

  if (!response.ok) {
    throw new Error(
      await response.text()
    );
  }

  const text =
    await response.text();

  return text
    ? JSON.parse(text)
    : [];
}


async function loadCloudProducts() {

  if (!CLOUD_CONFIG.enabled) {
    return false;
  }

  try {

    const data =
      await cloudFetch(
        "products?select=*&order=id.asc"
      );

    if (
      Array.isArray(data) &&
      data.length
    ) {

      products =
        data.map(
          product => ({
            ...product
          })
        );

      saveProducts();

      cloudReady = true;

      return true;
    }

    if (
      Array.isArray(data) &&
      !data.length
    ) {

      await cloudFetch(
        "products",
        {
          method: "POST",
          body:
            JSON.stringify(
              DEFAULT_PRODUCTS
            )
        }
      );

      products =
        DEFAULT_PRODUCTS.map(
          product => ({
            ...product
          })
        );

      saveProducts();

      cloudReady = true;

      return true;
    }

  } catch (error) {

    console.warn(
      "Supabase products:",
      error
    );

  }

  return false;
}


async function syncCloudProducts() {

  if (!CLOUD_CONFIG.enabled) {
    return;
  }

  try {

    await cloudFetch(
      "products?select=id",
      {
        method: "DELETE"
      }
    );

    await cloudFetch(
      "products",
      {
        method: "POST",
        body:
          JSON.stringify(
            products
          )
      }
    );

    cloudReady = true;

    updateCloudStatus(
      "☁️ Tersinkron online"
    );

  } catch (error) {

    console.warn(error);

    updateCloudStatus(
      "⚠️ Gagal sinkron. Data lokal tetap tersimpan."
    );

  }
}


function updateCloudStatus(text) {

  const element =
    document.getElementById(
      "cloudStatus"
    );

  if (element) {
    element.textContent = text;
  }
}


async function saveCloudOrder(
  payload
) {

  if (!CLOUD_CONFIG.enabled) {
    return false;
  }

  try {

    await cloudFetch(
      "orders",
      {
        method: "POST",
        body:
          JSON.stringify(payload)
      }
    );

    return true;

  } catch (error) {

    console.warn(
      "Supabase orders:",
      error
    );

    return false;

  }
}


async function loadCloudOrders() {

  if (!CLOUD_CONFIG.enabled) {
    return [];
  }

  try {

    return await cloudFetch(
      "orders?select=*&order=created_at.desc&limit=30"
    );

  } catch (error) {

    console.warn(error);

    return [];

  }
}


/* =========================================================
   ADMIN PESANAN
   ========================================================= */

async function renderAdminOrders() {

  const box =
    document.getElementById(
      "adminOrderList"
    );

  if (!box) return;

  if (!CLOUD_CONFIG.enabled) {

    box.innerHTML = `
      <div class="empty-state">
        ☁️ Mode lokal aktif.
        <br>
        Pesanan tetap dikirim melalui WhatsApp.
      </div>
    `;

    return;
  }

  box.innerHTML = `
    <div class="empty-state">
      Memuat pesanan...
    </div>
  `;

  const orders =
    await loadCloudOrders();

  if (!orders.length) {

    box.innerHTML = `
      <div class="empty-state">
        Belum ada pesanan online.
      </div>
    `;

    return;
  }

  box.innerHTML =
    orders
      .map(order => `

        <div class="admin-order">

          <b>
            ${esc(
              order.customer_name ||
              "Pelanggan"
            )}
          </b>

          <span>
            ${esc(
              order.customer_phone ||
              ""
            )}
          </span>

          <small>
            ${
              order.created_at
                ? new Date(
                    order.created_at
                  ).toLocaleString(
                    "id-ID"
                  )
                : ""
            }
          </small>

          <strong>
            ${rupiah(
              order.total || 0
            )}
          </strong>

          <p>
            ${
              (order.items || [])
                .map(
                  item =>
                    `${esc(
                      item.name
                    )} ×${item.qty}`
                )
                .join(" • ")
            }
          </p>

          <a
            class="btn outline"
            target="_blank"
            rel="noopener"
            href="${waLink(
              `Halo ${order.customer_name || "Pelanggan"}, terkait pesanan KALENSARI STORE.`
            )}"
          >
            💬 WhatsApp
          </a>

        </div>

      `)
      .join("");
}


const refreshOrdersButton =
  document.getElementById(
    "refreshOrdersBtn"
  );

if (refreshOrdersButton) {

  refreshOrdersButton.addEventListener(
    "click",
    renderAdminOrders
  );

}


/* =========================================================
   CLOUD INIT
   ========================================================= */

async function initializeCloud() {

  if (!CLOUD_CONFIG.enabled) {
    return;
  }

  updateCloudStatus(
    "☁️ Menghubungkan ke database..."
  );

  const connected =
    await loadCloudProducts();

  if (connected) {

    renderCategories();
    renderProducts();

    updateCloudStatus(
      "☁️ Produk tersinkron online"
    );

  } else {

    updateCloudStatus(
      "⚠️ Cloud belum tersambung. Data lokal tetap digunakan."
    );

  }

}


/* =========================================================
   INITIALIZE WEBSITE
   ========================================================= */

function initializeWebsite() {

  renderCategories();
  renderProducts();
  updateCartCount();
  renderCart();
  setupWhatsApp();

  initializeCloud();

}


/* =========================================================
   START
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeWebsite
  );

} else {

  initializeWebsite();

}
