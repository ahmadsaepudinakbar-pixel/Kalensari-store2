/* KALENSARI STORE - PRODUCT FIX V9 */
(() => {
  'use strict';

  const WHATSAPP_NUMBER = '6280000000000';
  const PRODUCTS_KEY = 'kalensari_products_v9';
  const CART_KEY = 'kalensari_cart_v9';
  const DEFAULT_PRODUCTS = [{"id":1,"name":"Lotek Bongko","price":12000,"sale":8000,"category":"Makanan","unit":"1 porsi","seller":"Teh Ida","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/o-fvve-chatgpt%20image%20sep%2028%2C%202026%2C%2005_14_09%20am.png?versionId=sSlnWC5X3v6SfdE8SJ7kfFpkAAtYEG66"},{"id":2,"name":"Bakso Sapi Biasa","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/pf0do4-chatgpt%20image%20sep%2028%2C%202026%2C%2006_23_05%20am.png?versionId=LvDf81yvhC2OIgUPloRKlaBbRFi.9BuH"},{"id":3,"name":"MIe ayam Pedas","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"H. Diman, Mang Edo, Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/0qg0at-chatgpt%20image%20sep%2028%2C%202026%2C%2002_03_31%20pm.png?versionId=EH1aAjwRvQd3dMY93ItbAgINe5lzjnTw"},{"id":4,"name":"MIe ayam Biasa","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"H. Diman, Mang Edo, Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/m5q9je-chatgpt%20image%20sep%2028%2C%202026%2C%2002_02_42%20pm.png?versionId=Lci_mH9SOmBpD2nCjBV_Z_o_XXpxpW8v"},{"id":5,"name":"Bakso Tulang","price":25000,"sale":18000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Out of Stock","image":"https://cdn.store.link/products/kalensaristore80353/agx1iw-chatgpt%20image%20sep%2028%2C%202026%2C%2006_29_33%20am.png?versionId=1n1pJ2ilQgM4jrhR5X_0LEG9mB.lTmg8"},{"id":6,"name":"Bakso Telur","price":12000,"sale":10000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/8a69b3-chatgpt%20image%20sep%2028%2C%202026%2C%2006_34_03%20am.png?versionId=m_nc2BhsK7d4LdKAPdxnMAiRHAV.Q2qB"},{"id":7,"name":"Bakso Urat","price":18000,"sale":15000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/obbajp-chatgpt%20image%20sep%2028%2C%202026%2C%2006_36_33%20am.png?versionId=h_Evc0EcQtdz4PFbFk8aZey0jgRRXZ.p"},{"id":8,"name":"Jus Alpukat","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/3x8j0a-chatgpt%20image%20sep%2028%2C%202026%2C%2006_52_41%20am.png?versionId=eKLzC7y3fgCWrkTSAdcaLHEyEYAdZMsh"},{"id":9,"name":"Jus Buah Naga","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/p8vus5-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_02%20am.png?versionId=e6H7dwvYmMOZrI86QKN98dyVxHcc8V0M"},{"id":10,"name":"Jus Tomat","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/o4d1bt-chatgpt%20image%20sep%2028%2C%202026%2C%2007_20_47%20am.png?versionId=IbXRZdg2vp6bCuXJPch5YT7FgQZXXcRM"},{"id":11,"name":"Jus Mangga","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/lqk2sp-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_59%20am.png?versionId=FADsI7qbgepPpQt7XVGl901Q_3cKHFQW"},{"id":12,"name":"Es teh Manis","price":3000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/abqncl-hops-3260267377.webp?versionId=P4DG3eGis6QyEzh9ZFQm3CBF8p9DEJwx"},{"id":13,"name":"Es teh Matcha Late","price":6000,"sale":null,"category":"Minuman","unit":"1 cup besar Rasa Greentea","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/c9c6rx-images%20%281%29.jpg?versionId=K0P2vQjt8SpfWctljxkmCkUO_8AfkYf2"},{"id":14,"name":"Es teh Matcha Premium","price":15000,"sale":12000,"category":"Minuman","unit":"1 cup besar Rasa Greentea","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/bkv3a5-images.jpg?versionId=jKTeHTYDtwRD2qs6CWqYs9ZM2EBZ9emC"},{"id":15,"name":"Nasi Kebuli","price":25000,"sale":20000,"category":"Makanan","unit":"1 porsi","seller":"Teh iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/u4fafx-chatgpt%20image%20sep%2028%2C%202026%2C%2002_14_04%20pm.png?versionId=DHZD_c9LScH15.An7XpzcTJMrjDf0AJk"},{"id":16,"name":"Nasi Goreng","price":13000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Kang Diki Sueb","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/h38vn8-chatgpt%20image%20sep%2028%2C%202026%2C%2002_11_47%20pm.png?versionId=Q1UfoJozDqlb8kaNfjJqp6nKv74i_B3F"},{"id":17,"name":"Pecel Lele","price":15000,"sale":null,"category":"Makanan","unit":"Pecel Lele","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"},{"id":18,"name":"Pecel Lele + Nasi","price":20000,"sale":null,"category":"Makanan","unit":"Pecel Lele + Nasi","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"},{"id":19,"name":"Pecel Ayam","price":20000,"sale":null,"category":"Makanan","unit":"Pecel Ayam","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"},{"id":20,"name":"Pecel Ayam + Nasi","price":25000,"sale":null,"category":"Makanan","unit":"Pecel Ayam + Nasi","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"},{"id":21,"name":"Fried Chiken","price":10000,"sale":null,"category":"Makanan","unit":"Ayam Goreng Tepung","seller":"Warga Kalensari","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/q38c2x-chatgpt%20image%20sep%2028%2C%202026%2C%2002_23_43%20pm.png?versionId=RR2yA7Iutiz2jXiFwJNUzApiqzE7ItsL"},{"id":22,"name":"Soto Ayam","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Sate Madura","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/4io072-chatgpt%20image%20sep%2028%2C%202026%2C%2002_22_28%20pm.png?versionId=48IdG9bl9fPErJcNUzMeAPrvhzOOe_qr"},{"id":23,"name":"Sate Ayam","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Sate Madura","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ewpn71-chatgpt%20image%20sep%2028%2C%202026%2C%2002_18_51%20pm.png?versionId=X09ZJ.tPJyqr_LhYnZRngTpDFKIVqz0b"},{"id":24,"name":"Nasi Ayam Katsu","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Teh Iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ievcoz-chatgpt%20image%20sep%2028%2C%202026%2C%2002_17_10%20pm.png?versionId=buhfyErVz0r0y_eaESh2AooKeylFdopS"},{"id":25,"name":"Spageti","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Teh Iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/d62zqy-aa1408ce-c67d-4d63-aa67-12ec89b3c905.png?versionId=chUteSwuPamgkCgB_ORU_hnugVoqj8dW"}];

  let products = [];
  let cart = [];
  let activeCategory = 'Semua';

  const $ = id => document.getElementById(id);
  const rupiah = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');

  function loadProducts() {
    try {
      const saved = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || 'null');
      if (Array.isArray(saved) && saved.length >= 3 && saved.some(p => p.status === 'Show')) return saved;
    } catch(e) {}
    const copy = DEFAULT_PRODUCTS.map(p => ({...p}));
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(copy));
    return copy;
  }

  function loadCart() {
    try { const c = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(c) ? c : []; }
    catch(e) { return []; }
  }

  function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

  function escapeHTML(v) {
    return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  }

  function currentPrice(p) { return Number(p.sale) > 0 ? Number(p.sale) : Number(p.price || 0); }

  function imageHTML(p) {
    if (!p.image) return '<div class="product-placeholder">🍽️</div>';
    return `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="product-placeholder" style="display:none">🍽️</div>`;
  }

  function renderCategories() {
    const box = $('categories');
    if (!box) return;
    const cats = ['Semua', ...new Set(products.map(p => p.category || 'Lainnya'))];
    box.innerHTML = cats.map(c => `<button class="cat ${c === activeCategory ? 'active' : ''}" data-cat="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('');
    box.querySelectorAll('[data-cat]').forEach(btn => btn.onclick = () => {
      activeCategory = btn.dataset.cat;
      renderCategories();
      renderProducts();
      const section = $('products');
      if (section) section.scrollIntoView({behavior:'smooth'});
    });
  }

  function renderProducts() {
    const grid = $('productGrid');
    if (!grid) return;

    const search = $('searchInput');
    const sort = $('sortSelect');
    const q = search ? search.value.toLowerCase().trim() : '';
    const mode = sort ? sort.value : '';

    let list = products.filter(p => {
      const visible = p.status === 'Show' || p.status === undefined || p.status === null;
      const categoryOK = activeCategory === 'Semua' || p.category === activeCategory;
      const text = `${p.name || ''} ${p.category || ''} ${p.seller || ''}`.toLowerCase();
      return visible && categoryOK && (!q || text.includes(q));
    });

    if (mode === 'priceAsc' || mode === 'price-low') list.sort((a,b) => currentPrice(a)-currentPrice(b));
    if (mode === 'priceDesc' || mode === 'price-high') list.sort((a,b) => currentPrice(b)-currentPrice(a));
    if (mode === 'name') list.sort((a,b) => String(a.name).localeCompare(String(b.name),'id'));

    const result = $('resultInfo');
    if (result) result.textContent = `${list.length} produk`;

    if (!list.length) {
      grid.innerHTML = '<div class="empty-state"><b>Produk tidak ditemukan</b><br>Coba pilih kategori lain atau hapus pencarian.</div>';
      return;
    }

    grid.innerHTML = list.map(p => `
      <article class="product">
        <div class="product-img">
          ${Number(p.sale) > 0 ? '<span class="sale-badge">PROMO</span>' : ''}
          ${imageHTML(p)}
        </div>
        <div class="product-body">
          <h3>${escapeHTML(p.name)}</h3>
          <div class="price">${Number(p.sale) > 0 ? `<span class="old-price">${rupiah(p.price)}</span>` : ''}${rupiah(currentPrice(p))}</div>
          <small>${escapeHTML(p.unit || '1 porsi')}</small>
          <small class="seller">👤 ${escapeHTML(p.seller || 'Warga Kalensari')}</small>
          <div class="product-actions">
            <button class="btn outline" data-detail="${p.id}">Detail</button>
            <button class="btn primary" data-add="${p.id}">+ Keranjang</button>
          </div>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('[data-detail]').forEach(b => b.onclick = () => showProduct(Number(b.dataset.detail)));
    grid.querySelectorAll('[data-add]').forEach(b => b.onclick = () => addToCart(Number(b.dataset.add)));
  }

  function showProduct(id) {
    const p = products.find(x => Number(x.id) === Number(id));
    if (!p) return;
    const detail = $('productDetail');
    if (!detail) return;
    detail.innerHTML = `<div class="detail"><div class="detail-img">${imageHTML(p)}</div><div><p class="eyebrow">${escapeHTML(p.category)} • ${escapeHTML(p.seller)}</p><h2>${escapeHTML(p.name)}</h2><div class="price">${rupiah(currentPrice(p))}</div><p>Satuan: ${escapeHTML(p.unit || '1 porsi')}</p><button class="btn primary full" id="detailAdd">🛒 Tambah ke Keranjang</button></div></div>`;
    $('detailAdd').onclick = () => { addToCart(Number(p.id)); closeModal('productModal'); };
    openModal('productModal');
  }

  function addToCart(id) {
    const p = products.find(x => Number(x.id) === Number(id));
    if (!p) return;
    const item = cart.find(x => Number(x.id) === Number(id));
    if (item) item.qty++;
    else cart.push({id:Number(id), qty:1});
    saveCart(); renderCart(); toast(`${p.name} ditambahkan ke keranjang`);
  }

  function cartItems() { return cart.map(i => { const p=products.find(x=>Number(x.id)===Number(i.id)); return p ? {...p, qty:Number(i.qty)||1} : null; }).filter(Boolean); }
  function cartTotal() { return cartItems().reduce((s,p)=>s+currentPrice(p)*p.qty,0); }

  function renderCart() {
    const items = cartItems();
    const count = items.reduce((s,p)=>s+p.qty,0);
    if ($('cartCount')) $('cartCount').textContent = count;
    if ($('cartItemLabel')) $('cartItemLabel').textContent = `${count} item`;
    if ($('cartSubtotal')) $('cartSubtotal').textContent = rupiah(cartTotal());
    if ($('cartShipping')) $('cartShipping').textContent = 'Rp0';
    if ($('cartTotal')) $('cartTotal').textContent = rupiah(cartTotal());
    if ($('checkoutTotal')) $('checkoutTotal').textContent = rupiah(cartTotal());
    const box = $('cartItems');
    if (!box) return;
    box.innerHTML = items.length ? items.map(p => `<div class="cart-row"><div><div class="cart-name">${escapeHTML(p.name)}</div><div class="cart-price">${rupiah(currentPrice(p))} × ${p.qty}</div></div><div class="qty"><button data-minus="${p.id}">−</button><b>${p.qty}</b><button data-plus="${p.id}">+</button></div></div>`).join('') : '<div class="empty-state"><b>🛒 Keranjang masih kosong</b></div>';
    box.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>changeQty(Number(b.dataset.minus),-1));
    box.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>changeQty(Number(b.dataset.plus),1));
  }

  function changeQty(id,d) {
    const item=cart.find(x=>Number(x.id)===Number(id));
    if (!item) return;
    item.qty += d;
    if (item.qty <= 0) cart=cart.filter(x=>Number(x.id)!==Number(id));
    saveCart(); renderCart();
  }

  function openModal(id) { const m=$(id); if(m){m.classList.add('show');m.setAttribute('aria-hidden','false');} }
  function closeModal(id) { const m=$(id); if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true');} }
  function toast(msg) { const t=$('toast'); if(!t)return; t.textContent=msg;t.classList.add('show');clearTimeout(window.__kt);window.__kt=setTimeout(()=>t.classList.remove('show'),1800); }

  function setup() {
    products = loadProducts();
    cart = loadCart();

    renderCategories();
    renderProducts();
    renderCart();

    const search=$('searchInput'); if(search) search.addEventListener('input',renderProducts);
    const sort=$('sortSelect'); if(sort) sort.addEventListener('change',renderProducts);
    const clear=$('clearSearch'); if(clear) clear.onclick=()=>{if(search)search.value='';renderProducts();};

    const cartBtn=$('cartBtn'); if(cartBtn) cartBtn.onclick=()=>{renderCart();openModal('cartModal');};
    const checkoutBtn=$('checkoutBtn'); if(checkoutBtn) checkoutBtn.onclick=()=>{if(cartItems().length){closeModal('cartModal');openModal('checkoutModal');}};

    document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
    document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id);}));

    const year=$('year'); if(year) year.textContent=new Date().getFullYear();
    ['waHero','waGeneral','waFloat'].forEach(id=>{const el=$(id);if(el)el.href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Halo KALENSARI STORE, saya ingin bertanya tentang produk.')}`;});

    const form=$('checkoutForm');
    if(form) form.onsubmit=e=>{
      e.preventDefault();
      const fd=new FormData(form);
      const items=cartItems();
      const detail=items.map(p=>`- ${p.name} x${p.qty} = ${rupiah(currentPrice(p)*p.qty)}`).join('\n');
      const msg=`Halo KALENSARI STORE, saya ingin memesan:\n\n${detail}\n\nTOTAL: ${rupiah(cartTotal())}\n\nNama: ${fd.get('name')}\nNo. WhatsApp: ${fd.get('phone')}\nAlamat: ${fd.get('address')}\nCatatan: ${fd.get('note')||'-'}\nPembayaran: ${fd.get('payment')}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,'_blank');
      cart=[];saveCart();renderCart();form.reset();closeModal('checkoutModal');toast('Pesanan disiapkan untuk WhatsApp');
    };

    // Admin sederhana: reset data produk jika tombol Reset dipakai.
    const reset=$('resetProductsBtn');
    if(reset) reset.onclick=()=>{localStorage.setItem(PRODUCTS_KEY,JSON.stringify(DEFAULT_PRODUCTS));products=DEFAULT_PRODUCTS.map(p=>({...p}));renderCategories();renderProducts();toast('Produk dikembalikan ke data awal');};

    console.log('KALENSARI V9 OK - produk:', products.length);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',setup); else setup();
})();
