/* KALENSARI STORE - FINAL V8
   Tidak bergantung pada library eksternal.
   Produk tampil langsung dari localStorage; admin dapat menambah/edit/import/export.
*/
(() => {
  "use strict";

  const ADMIN_PIN = "1234";
  const STORE_KEY = "kalensari_products_v8";
  const CART_KEY = "kalensari_cart_v8";
  const ORDER_KEY = "kalensari_orders_v8";
  const CATEGORY_KEY = "kalensari_category_v8";

  // Ganti nomor ini dengan nomor WhatsApp toko jika diperlukan.
  const WHATSAPP_NUMBER = "6280000000000";

  const defaultProducts = [
    {id:"bakso-sapi",name:"Bakso Sapi",category:"Makanan",price:15000,stock:20,seller:"Warga Desa Kalensari",description:"Bakso sapi gurih dan hangat, cocok dinikmati kapan saja.",emoji:"🍜",image:""},
    {id:"bakso-tulang",name:"Bakso Tulang",category:"Makanan",price:18000,stock:20,seller:"Warga Desa Kalensari",description:"Bakso dengan kuah gurih dan tulang yang nikmat.",emoji:"🍲",image:""},
    {id:"bakso-telur",name:"Bakso Telur",category:"Makanan",price:17000,stock:20,seller:"Warga Desa Kalensari",description:"Bakso telur dengan kuah hangat dan gurih.",emoji:"🍜",image:""},
    {id:"bakso-urat",name:"Bakso Urat",category:"Makanan",price:18000,stock:20,seller:"Warga Desa Kalensari",description:"Bakso urat dengan tekstur kenyal dan rasa gurih.",emoji:"🍜",image:""},
    {id:"lotek-bongko",name:"Lotek Bongko",category:"Makanan",price:12000,stock:20,seller:"Warga Desa Kalensari",description:"Kuliner khas desa dengan cita rasa tradisional.",emoji:"🥗",image:""},
    {id:"bolu-pandan-almond",name:"Bolu Pandan Almond",category:"Kue",price:25000,stock:20,seller:"Warga Desa Kalensari",description:"Bolu pandan lembut dengan taburan almond.",emoji:"🍰",image:""},
    {id:"bolu-swiss-roll",name:"Bolu Swiss Roll",category:"Kue",price:25000,stock:20,seller:"Warga Desa Kalensari",description:"Bolu gulung lembut dengan rasa manis yang pas.",emoji:"🍰",image:""},
    {id:"donat-coklat",name:"Donat Coklat",category:"Kue",price:8000,stock:20,seller:"Warga Desa Kalensari",description:"Donat lembut dengan topping coklat.",emoji:"🍩",image:""},
    {id:"jus-alpukat",name:"Jus Alpukat",category:"Minuman",price:10000,stock:20,seller:"Warga Desa Kalensari",description:"Jus alpukat segar dan creamy.",emoji:"🥑",image:""},
    {id:"jus-tomat",name:"Jus Tomat",category:"Minuman",price:9000,stock:20,seller:"Warga Desa Kalensari",description:"Jus tomat segar.",emoji:"🍅",image:""},
    {id:"jus-buah-naga",name:"Jus Buah Naga",category:"Minuman",price:10000,stock:20,seller:"Warga Desa Kalensari",description:"Jus buah naga segar.",emoji:"🍹",image:""},
    {id:"jus-mangga",name:"Jus Mangga",category:"Minuman",price:10000,stock:20,seller:"Warga Desa Kalensari",description:"Jus mangga manis dan segar.",emoji:"🥭",image:""},
    {id:"es-teh-desa",name:"Es Teh DESA",category:"Minuman",price:5000,stock:30,seller:"Warga Desa Kalensari",description:"Es teh segar dalam cup besar.",emoji:"🥤",image:""}
  ];

  let products = loadProducts();
  let cart = loadJSON(CART_KEY, []);
  let activeCategory = "Semua";
  let searchTerm = "";
  let sortMode = "default";

  const $ = id => document.getElementById(id);
  const rupiah = n => "Rp" + Number(n || 0).toLocaleString("id-ID");
  const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

  function loadJSON(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
    catch { return fallback; }
  }

  function loadProducts() {
    const saved = loadJSON(STORE_KEY, null);
    if (Array.isArray(saved) && saved.length) return saved;
    localStorage.setItem(STORE_KEY, JSON.stringify(defaultProducts));
    return structuredClone(defaultProducts);
  }

  function saveProducts() {
    localStorage.setItem(STORE_KEY, JSON.stringify(products));
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function showToast(message) {
    const t = $("toast");
    if (!t) return;
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function openModal(id) {
    const el = $(id);
    if (!el) return;
    el.classList.add("show");
    el.setAttribute("aria-hidden","false");
  }

  function closeModal(id) {
    const el = $(id);
    if (!el) return;
    el.classList.remove("show");
    el.setAttribute("aria-hidden","true");
  }

  function setWhatsAppLinks() {
    const msg = encodeURIComponent("Halo KALENSARI STORE, saya ingin bertanya tentang produk.");
    ["waHero","waGeneral","waFloat"].forEach(id => {
      const el = $(id);
      if (el) el.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
    });
  }

  function renderCategories() {
    const box = $("categories");
    if (!box) return;
    const cats = ["Semua", ...new Set(products.map(p => p.category || "Lainnya"))];
    box.innerHTML = cats.map(cat =>
      `<button class="cat ${cat === activeCategory ? "active" : ""}" data-category="${escapeHTML(cat)}">${escapeHTML(cat)}</button>`
    ).join("");
    box.querySelectorAll(".cat").forEach(btn => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.category;
        renderCategories();
        renderProducts();
      });
    });
  }

  function filteredProducts() {
    let list = products.filter(p => {
      const categoryOK = activeCategory === "Semua" || (p.category || "Lainnya") === activeCategory;
      const q = searchTerm.toLowerCase();
      const text = `${p.name} ${p.category} ${p.description} ${p.seller}`.toLowerCase();
      return categoryOK && (!q || text.includes(q));
    });
    if (sortMode === "name") list.sort((a,b) => a.name.localeCompare(b.name));
    if (sortMode === "price-low") list.sort((a,b) => Number(a.price)-Number(b.price));
    if (sortMode === "price-high") list.sort((a,b) => Number(b.price)-Number(a.price));
    return list;
  }

  function productImage(p, large=false) {
    if (p.image) return `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="product-placeholder" style="display:none">${escapeHTML(p.emoji || "🍽️")}</div>`;
    return `<div class="product-placeholder">${escapeHTML(p.emoji || "🍽️")}</div>`;
  }

  function renderProducts() {
    const grid = $("productGrid");
    if (!grid) return;
    const list = filteredProducts();
    $("resultInfo").textContent = `${list.length} produk`;
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state"><b>Produk tidak ditemukan</b><span>Coba pilih kategori lain atau hapus pencarian.</span></div>`;
      return;
    }
    grid.innerHTML = list.map(p => {
      const stock = Number(p.stock ?? 0);
      return `<article class="product">
        <div class="product-img">
          ${p.sale ? `<span class="sale-badge">PROMO</span>` : ""}
          <span class="stock-badge ${stock <= 0 ? "off" : ""}">${stock > 0 ? "Tersedia" : "Habis"}</span>
          ${productImage(p)}
        </div>
        <div class="product-body">
          <h3>${escapeHTML(p.name)}</h3>
          <div class="price">${rupiah(p.price)}</div>
          <small>${escapeHTML(p.description || "Produk pilihan warga Kalensari.")}</small>
          <small class="seller">👤 ${escapeHTML(p.seller || "Warga Desa Kalensari")}</small>
          <div class="product-actions">
            <button class="btn outline" data-detail="${escapeHTML(p.id)}">Detail</button>
            <button class="btn primary" data-add="${escapeHTML(p.id)}" ${stock <= 0 ? "disabled" : ""}>+ Keranjang</button>
          </div>
        </div>
      </article>`;
    }).join("");

    grid.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => addToCart(b.dataset.add)));
    grid.querySelectorAll("[data-detail]").forEach(b => b.addEventListener("click", () => showDetail(b.dataset.detail)));
  }

  function showDetail(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    $("productDetail").innerHTML = `<div class="detail">
      <div class="detail-img">${productImage(p, true)}</div>
      <div>
        <span class="pill">${escapeHTML(p.category || "Lainnya")}</span>
        <h2>${escapeHTML(p.name)}</h2>
        <div class="price">${rupiah(p.price)}</div>
        <p>${escapeHTML(p.description || "")}</p>
        <p class="seller">👤 ${escapeHTML(p.seller || "Warga Desa Kalensari")}</p>
        <p><b>Stok:</b> ${Number(p.stock ?? 0)}</p>
        <button class="btn primary full" ${Number(p.stock ?? 0) <= 0 ? "disabled" : ""} id="detailAdd">🛒 Tambah ke Keranjang</button>
      </div>
    </div>`;
    $("detailAdd").addEventListener("click", () => { addToCart(id); closeModal("productModal"); });
    openModal("productModal");
  }

  function addToCart(id) {
    const p = products.find(x => x.id === id);
    if (!p || Number(p.stock ?? 0) <= 0) return showToast("Produk sedang habis.");
    const item = cart.find(x => x.id === id);
    if (item) item.qty = Math.min(item.qty + 1, Number(p.stock));
    else cart.push({id, qty:1});
    saveCart();
    renderCart();
    showToast(`${p.name} masuk keranjang.`);
  }

  function cartItems() {
    return cart.map(i => {
      const p = products.find(x => x.id === i.id);
      return p ? { ...p, qty:i.qty } : null;
    }).filter(Boolean);
  }

  function cartTotal() {
    return cartItems().reduce((sum,p) => sum + Number(p.price)*p.qty, 0);
  }

  function renderCart() {
    const items = cartItems();
    const count = items.reduce((s,p) => s+p.qty, 0);
    $("cartCount").textContent = count;
    $("cartItemLabel").textContent = `${count} item`;
    $("cartSubtotal").textContent = rupiah(cartTotal());
    $("cartShipping").textContent = "Rp0";
    $("cartTotal").textContent = rupiah(cartTotal());
    $("checkoutTotal").textContent = rupiah(cartTotal());

    $("cartItems").innerHTML = items.length ? items.map(p =>
      `<div class="cart-row">
        <div><div class="cart-name">${escapeHTML(p.name)}</div><div class="cart-price">${rupiah(p.price)} × ${p.qty}</div></div>
        <div class="qty">
          <button data-minus="${p.id}">−</button><b>${p.qty}</b><button data-plus="${p.id}">+</button>
          <button data-remove="${p.id}" title="Hapus">×</button>
        </div>
      </div>`).join("") : `<div class="empty-state"><b>Keranjang masih kosong</b><span>Pilih makanan atau minuman untuk mulai belanja.</span></div>`;

    $("cartItems").querySelectorAll("[data-minus]").forEach(b => b.onclick = () => changeQty(b.dataset.minus,-1));
    $("cartItems").querySelectorAll("[data-plus]").forEach(b => b.onclick = () => changeQty(b.dataset.plus,1));
    $("cartItems").querySelectorAll("[data-remove]").forEach(b => b.onclick = () => removeCart(b.dataset.remove));
  }

  function changeQty(id, delta) {
    const item = cart.find(x => x.id === id);
    const p = products.find(x => x.id === id);
    if (!item || !p) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(x => x.id !== id);
    else item.qty = Math.min(item.qty, Number(p.stock));
    saveCart(); renderCart();
  }

  function removeCart(id) {
    cart = cart.filter(x => x.id !== id);
    saveCart(); renderCart();
  }

  function renderAdmin() {
    const box = $("adminProductList");
    if (!box) return;
    box.innerHTML = products.map(p => `<div class="admin-product">
      <div>${p.image ? `<img src="${escapeHTML(p.image)}" alt="">` : `<div style="width:72px;height:72px;border-radius:10px;background:#f3e3d6;display:grid;place-items:center;font-size:35px">${escapeHTML(p.emoji || "🍽️")}</div>`}</div>
      <div class="admin-product-info"><h4>${escapeHTML(p.name)}</h4><small>${escapeHTML(p.category)} • ${rupiah(p.price)} • stok ${p.stock}</small></div>
      <div class="admin-product-actions"><button class="btn outline" data-edit="${p.id}">Edit</button><button class="btn outline" data-delete="${p.id}">Hapus</button></div>
    </div>`).join("");
    box.querySelectorAll("[data-delete]").forEach(b => b.onclick = () => {
      if (confirm("Hapus produk ini?")) { products = products.filter(p => p.id !== b.dataset.delete); saveProducts(); renderAll(); renderAdmin(); }
    });
    box.querySelectorAll("[data-edit]").forEach(b => editProduct(b.dataset.edit));
  }

  function editProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const name = prompt("Nama produk:", p.name); if (name === null) return;
    const price = prompt("Harga:", p.price); if (price === null) return;
    const stock = prompt("Stok:", p.stock); if (stock === null) return;
    const category = prompt("Kategori:", p.category); if (category === null) return;
    const image = prompt("URL gambar (kosongkan jika tidak ada):", p.image || ""); 
    p.name = name.trim() || p.name;
    p.price = Number(price) || p.price;
    p.stock = Math.max(0, Number(stock) || 0);
    p.category = category.trim() || p.category;
    p.image = image === null ? p.image : image.trim();
    saveProducts(); renderAll(); renderAdmin(); showToast("Produk diperbarui.");
  }

  function addProduct() {
    const name = prompt("Nama produk:"); if (!name) return;
    const price = prompt("Harga:", "10000"); if (price === null) return;
    const category = prompt("Kategori:", "Makanan"); if (!category) return;
    const emoji = prompt("Emoji gambar:", "🍽️") || "🍽️";
    const image = prompt("URL gambar (opsional):", "") || "";
    const description = prompt("Deskripsi:", "Produk pilihan warga Kalensari.") || "";
    const stock = prompt("Stok:", "20");
    products.push({id:uid(),name:name.trim(),price:Number(price)||0,category:category.trim(),emoji,image,description,stock:Math.max(0,Number(stock)||0),seller:"Warga Desa Kalensari"});
    saveProducts(); renderAll(); renderAdmin(); showToast("Produk ditambahkan.");
  }

  function exportProducts() {
    const blob = new Blob([JSON.stringify(products,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "produk-kalensari-store.json"; a.click();
    URL.revokeObjectURL(a.href);
  }

  function importProducts(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data) || !data.length) throw new Error();
        products = data; saveProducts(); renderAll(); renderAdmin(); showToast("Produk berhasil diimport.");
      } catch { alert("File produk tidak valid."); }
    };
    reader.readAsText(file);
  }

  function renderOrders() {
    const orders = loadJSON(ORDER_KEY, []);
    const box = $("adminOrderList");
    if (!box) return;
    box.innerHTML = orders.length ? orders.slice().reverse().map(o =>
      `<div class="admin-order"><strong>${escapeHTML(o.name)}</strong><span>${escapeHTML(o.phone)} • ${escapeHTML(o.payment)}</span><p>${escapeHTML(o.items)}</p><b>${rupiah(o.total)}</b><small>${escapeHTML(o.date)}</small></div>`
    ).join("") : `<div class="empty-state"><b>Belum ada pesanan</b></div>`;
  }

  function renderAll() {
    renderCategories();
    renderProducts();
    renderCart();
    setWhatsAppLinks();
  }

  function initEvents() {
    $("cartBtn").onclick = () => { renderCart(); openModal("cartModal"); };
    $("menuBtn").onclick = () => openModal("adminModal");
    $("checkoutBtn").onclick = () => {
      if (!cartItems().length) return showToast("Keranjang masih kosong.");
      closeModal("cartModal"); openModal("checkoutModal"); renderCart();
    };
    $("searchInput").oninput = e => { searchTerm=e.target.value.trim(); renderProducts(); };
    $("sortSelect").onchange = e => { sortMode=e.target.value; renderProducts(); };
    $("clearSearch").onclick = () => { $("searchInput").value=""; searchTerm=""; renderProducts(); };

    document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => closeModal(b.dataset.close));
    document.querySelectorAll(".modal").forEach(m => m.addEventListener("click", e => { if (e.target === m) closeModal(m.id); }));

    $("checkoutForm").onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const items = cartItems().map(p => `${p.name} x${p.qty}`).join(", ");
      const total = cartTotal();
      const order = {name:fd.get("name"),phone:fd.get("phone"),address:fd.get("address"),note:fd.get("note"),payment:fd.get("payment"),items,total,date:new Date().toLocaleString("id-ID")};
      const orders = loadJSON(ORDER_KEY, []); orders.push(order); localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
      const text = `Halo KALENSARI STORE,%0A%0APesanan:%0A${encodeURIComponent(items)}%0A%0ATotal: ${encodeURIComponent(rupiah(total))}%0ANama: ${encodeURIComponent(order.name)}%0ANo. WA: ${encodeURIComponent(order.phone)}%0AAlamat: ${encodeURIComponent(order.address)}%0APembayaran: ${encodeURIComponent(order.payment)}%0ACatatan: ${encodeURIComponent(order.note || "-")}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
      cart=[]; saveCart(); e.target.reset(); closeModal("checkoutModal"); renderCart(); showToast("Pesanan disiapkan untuk WhatsApp.");
    };

    $("adminLoginBtn").onclick = () => {
      if ($("adminPin").value === ADMIN_PIN) {
        $("adminLogin").hidden=true; $("adminPanel").hidden=false; renderAdmin(); renderOrders();
      } else showToast("PIN admin salah.");
    };
    $("addProductBtn").onclick = addProduct;
    $("exportBtn").onclick = exportProducts;
    $("importFile").onchange = e => { if(e.target.files[0]) importProducts(e.target.files[0]); e.target.value=""; };
    $("resetProductsBtn").onclick = () => {
      if (confirm("Kembalikan produk ke daftar bawaan?")) { products=structuredClone(defaultProducts); saveProducts(); renderAll(); renderAdmin(); }
    };
    $("refreshOrdersBtn").onclick = renderOrders;
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("year").textContent = new Date().getFullYear();
    initEvents();
    renderAll();
  });
})();
