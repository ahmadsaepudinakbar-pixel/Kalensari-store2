// KALENSARI STORE
const WHATSAPP_NUMBER = "6281234567890";
const SHIPPING_COST = 0;

// Aman jika config.js tidak ada
const CLOUD_CONFIG = window.CLOUD_CONFIG || { enabled:false, supabaseUrl:"", supabaseAnonKey:"" };
const DEFAULT_PRODUCTS = [{"id":1,"name":"Lotek Bongko","price":12000,"sale":8000,"category":"Makanan","unit":"1 porsi","seller":"Teh Ida","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/o-fvve-chatgpt%20image%20sep%2028%2C%202026%2C%2005_14_09%20am.png?versionId=sSlnWC5X3v6SfdE8SJ7kfFpkAAtYEG66"},{"id":2,"name":"Bakso Sapi Biasa","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/pf0do4-chatgpt%20image%20sep%2028%2C%202026%2C%2006_23_05%20am.png?versionId=LvDf81yvhC2OIgUPloRKlaBbRFi.9BuH"},{"id":3,"name":"MIe ayam Pedas","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"H. Diman, Mang Edo, Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/0qg0at-chatgpt%20image%20sep%2028%2C%202026%2C%2002_03_31%20pm.png?versionId=EH1aAjwRvQd3dMY93ItbAgINe5lzjnTw"},{"id":4,"name":"MIe ayam Biasa","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"H. Diman, Mang Edo, Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/m5q9je-chatgpt%20image%20sep%2028%2C%202026%2C%2002_02_42%20pm.png?versionId=Lci_mH9SOmBpD2nCjBV_Z_o_XXpxpW8v"},{"id":5,"name":"Bakso Tulang","price":25000,"sale":18000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Out of Stock","image":"https://cdn.store.link/products/kalensaristore80353/agx1iw-chatgpt%20image%20sep%2028%2C%202026%2C%2006_29_33%20am.png?versionId=1n1pJ2ilQgM4jrhR5X_0LEG9mB.lTmg8"},{"id":6,"name":"Bakso Telur","price":12000,"sale":10000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/8a69b3-chatgpt%20image%20sep%2028%2C%202026%2C%2006_34_03%20am.png?versionId=m_nc2BhsK7d4LdKAPdxnMAiRHAV.Q2qB"},{"id":7,"name":"Bakso Urat","price":18000,"sale":15000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/obbajp-chatgpt%20image%20sep%2028%2C%202026%2C%2006_36_33%20am.png?versionId=h_Evc0EcQtdz4PFbFk8aZey0jgRRXZ.p"},{"id":8,"name":"Jus Alpukat","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/3x8j0a-chatgpt%20image%20sep%2028%2C%202026%2C%2006_52_41%20am.png?versionId=eKLzC7y3fgCWrkTSAdcaLHEyEYAdZMsh"},{"id":9,"name":"Jus Buah Naga","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/p8vus5-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_02%20am.png?versionId=e6H7dwvYmMOZrI86QKN98dyVxHcc8V0M"},{"id":10,"name":"Jus Tomat","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/o4d1bt-chatgpt%20image%20sep%2028%2C%202026%2C%2007_20_47%20am.png?versionId=IbXRZdg2vp6bCuXJPch5YT7FgQZXXcRM"},{"id":11,"name":"Jus Mangga","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/lqk2sp-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_59%20am.png?versionId=FADsI7qbgepPpQt7XVGl901Q_3cKHFQW"},{"id":12,"name":"Es teh Manis","price":3000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/abqncl-hops-3260267377.webp?versionId=P4DG3eGis6QyEzh9ZFQm3CBF8p9DEJwx"},{"id":13,"name":"Es teh Matcha Late","price":6000,"sale":null,"category":"Minuman","unit":"1 cup besar Rasa Greentea","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/c9c6rx-images%20%281%29.jpg?versionId=K0P2vQjt8SpfWctljxkmCkUO_8AfkYf2"},{"id":14,"name":"Es teh Matcha Premium","price":15000,"sale":12000,"category":"Minuman","unit":"1 cup besar Rasa Greentea","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/bkv3a5-images.jpg?versionId=jKTeHTYDtwRD2qs6CWqYs9ZM2EBZ9emC"},{"id":15,"name":"Nasi Kebuli","price":25000,"sale":20000,"category":"Makanan","unit":"1 porsi","seller":"Teh iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/u4fafx-chatgpt%20image%20sep%2028%2C%202026%2C%2002_14_04%20pm.png?versionId=DHZD_c9LScH15.An7XpzcTJMrjDf0AJk"},{"id":16,"name":"Nasi Goreng","price":13000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Kang Diki Sueb","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/h38vn8-chatgpt%20image%20sep%2028%2C%202026%2C%2002_11_47%20pm.png?versionId=Q1UfoJozDqlb8kaNfjJqp6nKv74i_B3F"},{"id":17,"name":"Pecel Lele","price":15000,"sale":null,"category":"Makanan","unit":"Pecel Lele","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"},{"id":18,"name":"Pecel Lele + Nasi","price":20000,"sale":null,"category":"Makanan","unit":"Pecel Lele + Nasi","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"},{"id":19,"name":"Pecel Ayam","price":20000,"sale":null,"category":"Makanan","unit":"Pecel Ayam","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"},{"id":20,"name":"Pecel Ayam + Nasi","price":25000,"sale":null,"category":"Makanan","unit":"Pecel Ayam + Nasi","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"},{"id":21,"name":"Fried Chiken","price":10000,"sale":null,"category":"Makanan","unit":"Ayam Goreng Tepung","seller":"Warga Kalensari","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/q38c2x-chatgpt%20image%20sep%2028%2C%202026%2C%2002_23_43%20pm.png?versionId=RR2yA7Iutiz2jXiFwJNUzApiqzE7ItsL"},{"id":22,"name":"Soto Ayam","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Sate Madura","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/4io072-chatgpt%20image%20sep%2028%2C%202026%2C%2002_22_28%20pm.png?versionId=48IdG9bl9fPErJcNUzMeAPrvhzOOe_qr"},{"id":23,"name":"Sate Ayam","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Sate Madura","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ewpn71-chatgpt%20image%20sep%2028%2C%202026%2C%2002_18_51%20pm.png?versionId=X09ZJ.tPJyqr_LhYnZRngTpDFKIVqz0b"},{"id":24,"name":"Nasi Ayam Katsu","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Teh Iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ievcoz-chatgpt%20image%20sep%2028%2C%202026%2C%2002_17_10%20pm.png?versionId=buhfyErVz0r0y_eaESh2AooKeylFdopS"},{"id":25,"name":"Spageti","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Teh Iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/d62zqy-aa1408ce-c67d-4d63-aa67-12ec89b3c905.png?versionId=chUteSwuPamgkCgB_ORU_hnugVoqj8dW"}];

const ADMIN_PIN = "1234";

/* =====================================================
   PENYIMPANAN AMAN
   Mencegah website blank jika localStorage rusak,
   kosong, atau berisi data lama yang tidak lengkap.
   ===================================================== */
function readStorageJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(raw === null || raw === "") return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  }catch(err){
    console.warn("Data lokal tidak valid:", key, err);
    try{ localStorage.removeItem(key); }catch(_){}
    return fallback;
  }
}

function normalizeProduct(p, index){
  return {
    id: Number(p?.id) || (index + 1),
    name: String(p?.name || "Produk"),
    price: Number(p?.price) || 0,
    sale: Number(p?.sale) > 0 ? Number(p.sale) : null,
    category: String(p?.category || "Makanan"),
    unit: String(p?.unit || "1 porsi"),
    seller: String(p?.seller || "Warga Kalensari"),
    status: p?.status === "Out of Stock" ? "Out of Stock" : "Show",
    image: String(p?.image || "")
  };
}

function getDefaultProducts(){
  return DEFAULT_PRODUCTS.map(normalizeProduct);
}

let products = readStorageJSON("kalensari_products", null);
if(!Array.isArray(products) || products.length === 0){
  products = getDefaultProducts();
  localStorage.setItem("kalensari_products", JSON.stringify(products));
}else{
  products = products.map(normalizeProduct);
}

let cloudReady = false;
const saveProducts = () => localStorage.setItem("kalensari_products", JSON.stringify(products));

const cloudHeaders = () => ({
  apikey: CLOUD_CONFIG.supabaseAnonKey,
  Authorization: `Bearer ${CLOUD_CONFIG.supabaseAnonKey}`,
  "Content-Type": "application/json",
  Prefer: "return=representation"
});
async function cloudFetch(path, options={}) {
  if(!CLOUD_CONFIG?.enabled) throw new Error("cloud-disabled");
  const r=await fetch(`${CLOUD_CONFIG.supabaseUrl}/rest/v1/${path}`, {
    ...options, headers:{...cloudHeaders(), ...(options.headers||{})}
  });
  if(!r.ok) throw new Error(await r.text());
  const text=await r.text(); return text?JSON.parse(text):[];
}
async function loadCloudProducts(){
  if(!CLOUD_CONFIG?.enabled) return false;
  try {
    const data=await cloudFetch("products?select=*&order=id.asc");
    if(Array.isArray(data) && data.length){ products=data.map(p=>({...p})); saveProducts(); cloudReady=true; return true; }
    if(Array.isArray(data) && !data.length){
      await cloudFetch("products",{method:"POST",body:JSON.stringify(DEFAULT_PRODUCTS)});
      products=DEFAULT_PRODUCTS.map(p=>({...p})); saveProducts(); cloudReady=true; return true;
    }
  } catch(e){ console.warn("Supabase products:",e); }
  return false;
}
async function syncCloudProducts(){
  if(!CLOUD_CONFIG?.enabled) return;
  try {
    await cloudFetch("products?select=id",{method:"DELETE"});
    await cloudFetch("products",{method:"POST",body:JSON.stringify(products)});
    cloudReady=true; updateCloudStatus("☁️ Tersinkron online");
  } catch(e){ console.warn(e); updateCloudStatus("⚠️ Gagal sinkron. Data lokal tetap tersimpan."); }
}
function updateCloudStatus(text){const el=document.getElementById("cloudStatus");if(el)el.textContent=text;}
async function saveCloudOrder(payload){
  if(!CLOUD_CONFIG?.enabled) return false;
  try { await cloudFetch("orders",{method:"POST",body:JSON.stringify(payload)}); return true; } catch(e){ console.warn("Supabase orders:",e); return false; }
}
async function updateCloudOrderStatus(orderId, status){
  if(!CLOUD_CONFIG?.enabled || !orderId) return false;
  try {
    await cloudFetch(`orders?order_code=eq.${encodeURIComponent(orderId)}`,{method:"PATCH",body:JSON.stringify({status})});
    return true;
  } catch(e){ console.warn("Supabase update order:",e); return false; }
}
async function loadCloudOrders(){
  if(!CLOUD_CONFIG?.enabled) return [];
  try { return await cloudFetch("orders?select=*&order=created_at.desc&limit=30"); } catch(e){ return []; }
}



let cart = readStorageJSON("kalensari_cart", []);
if(!Array.isArray(cart)) cart = [];
let activeCategory = "Semua";

const rupiah = n => "Rp" + new Intl.NumberFormat("id-ID").format(n);
const saveCart = () => localStorage.setItem("kalensari_cart", JSON.stringify(cart));
const waLink = message => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
const currentPrice = p => p.sale || p.price;

function priceHTML(p) {
  return p.sale ? `<span class="old-price">${rupiah(p.price)}</span>${rupiah(p.sale)}` : rupiah(p.price);
}
function renderCategories() {
  const categoryEl = document.getElementById("categories");
  if(!categoryEl) return;
  const cats=["Semua",...new Set(products.map(p=>String(p.category || "Makanan")))];
  if(!cats.includes(activeCategory)) activeCategory="Semua";
  categoryEl.innerHTML=cats.map(c=>`<button class="cat ${c===activeCategory?"active":""}" onclick="setCategory('${String(c).replace(/'/g,"\\'")}')">${c}</button>`).join("");
}
function setCategory(c) {
  activeCategory=c; renderCategories(); renderProducts();
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
function renderProducts() {
  const searchEl=document.getElementById("searchInput");
  const sortEl=document.getElementById("sortSelect");
  const q=searchEl ? searchEl.value.toLowerCase().trim() : "";
  const sort=sortEl ? sortEl.value : "";
  let list=products.filter(p=>{
    const name=String(p.name || "").toLowerCase();
    const category=String(p.category || "").toLowerCase();
    const seller=String(p.seller || "").toLowerCase();
    return p.status==="Show" &&
      (activeCategory==="Semua" || p.category===activeCategory) &&
      (name.includes(q) || category.includes(q) || seller.includes(q));
  });
  if(sort==="priceAsc" || sort==="price-low") list.sort((a,b)=>currentPrice(a)-currentPrice(b));
  if(sort==="priceDesc" || sort==="price-high") list.sort((a,b)=>currentPrice(b)-currentPrice(a));
  if(sort==="name") list.sort((a,b)=>String(a.name).localeCompare(String(b.name),"id"));
  const resultEl=document.getElementById("resultInfo");
  const gridEl=document.getElementById("productGrid");
  if(!gridEl) return;
  if(resultEl) resultEl.textContent=`${list.length} produk`;
  gridEl.innerHTML=list.length?list.map(p=>`
   <article class="product">
  <div class="product-img"><img src="${getProductImage(p.image)}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='🖼️'">
        ${p.sale?'<span class="sale-badge">PROMO</span>':''}
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <div class="price">${priceHTML(p)}</div>
        <small>${p.unit}</small><small class="seller">👤 ${p.seller}</small>
        <div class="product-actions">
          <button class="btn outline" onclick="showProduct(${p.id})">Detail</button>
          <button class="btn primary" onclick="addToCart(${p.id})">+ Keranjang</button>
        </div>
      </div>
    </article>`).join(""):`<div class="empty-state"><b>😔 Produk tidak ditemukan</b>Coba kata kunci atau kategori lain.</div>`;
}
function showProduct(id) {
  const p=products.find(x=>x.id===id);
  const sold=p.status!=="Show";
  document.getElementById("productDetail").innerHTML=`
    <div class="detail">
      <div class="detail-img"><img src="${getProductImage(p.image)}" alt="${p.name}" onerror="this.style.display='none'"></div>
      <div>
        <p class="eyebrow">${p.category} • ${p.seller}</p>
        <h2>${p.name}</h2>
        <div class="price">${priceHTML(p)}</div>
        <p>Satuan: ${p.unit}</p>
        <p>${sold?"Stok habis.":"Produk tersedia untuk dipesan."}</p>
        <button class="btn primary full" ${sold?"disabled":""} onclick="addToCart(${p.id});closeModal('productModal')">🛒 Tambah ke Keranjang</button>
        <br><br>
        <a class="btn outline full" target="_blank" href="${waLink(`Halo KALENSARI STORE, saya ingin membeli ${p.name} (${rupiah(currentPrice(p))}).`)}">💬 Beli via WhatsApp</a>
      </div>
    </div>`;
  openModal("productModal");
}
function addToCart(id) {
  const p=products.find(x=>x.id===id); if(!p||p.status!=="Show")return;
  const item=cart.find(x=>x.id===id); if(item)item.qty++; else cart.push({id,qty:1});
  saveCart();updateCartCount();renderCart();showToast(`${p.name} ditambahkan ke keranjang`);
}
function changeQty(id,d) {
  const item=cart.find(x=>x.id===id);if(!item)return;
  item.qty+=d;if(item.qty<=0)cart=cart.filter(x=>x.id!==id);
  saveCart();updateCartCount();renderCart();
}
function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  saveCart();
  updateCartCount();
  renderCart();
  showToast("Produk dihapus dari keranjang");
}
function clearCart() {
  if (!cart.length) return;
  if (!confirm("Kosongkan semua isi keranjang?")) return;
  cart = [];
  saveCart();
  updateCartCount();
  renderCart();
  showToast("Keranjang dikosongkan");
}
function cartData() {return cart.map(i=>({...products.find(p=>p.id===i.id),qty:i.qty})).filter(x=>x.id);}
function renderCart() {
  const items=cartData(),subtotal=items.reduce((s,p)=>s+currentPrice(p)*p.qty,0),shipping=items.length?SHIPPING_COST:0;
  document.getElementById("cartItems").innerHTML=items.length?items.map(p=>`
    <div class="cart-row"><div class="cart-product-info"><div class="cart-name">${p.name}</div><div class="cart-price">${rupiah(currentPrice(p))} × ${p.qty}</div></div>
    <div class="cart-row-actions"><div class="qty"><button onclick="changeQty(${p.id},-1)" aria-label="Kurangi">−</button><b>${p.qty}</b><button onclick="changeQty(${p.id},1)" aria-label="Tambah">+</button></div><button class="cart-remove" onclick="removeFromCart(${p.id})" aria-label="Hapus ${p.name}" title="Hapus">🗑️</button></div></div>`).join(""):`<div class="empty-state"><b>🛒 Keranjang masih kosong</b>Yuk pilih makanan atau minuman favoritmu.</div>`;
  document.getElementById("cartItemLabel").textContent=`${cart.reduce((s,i)=>s+i.qty,0)} item`;
  document.getElementById("cartSubtotal").textContent=rupiah(subtotal);
  document.getElementById("cartShipping").textContent=rupiah(shipping);
  document.getElementById("cartTotal").textContent=rupiah(subtotal+shipping);
  document.getElementById("checkoutTotal").textContent=rupiah(subtotal+shipping);
  document.getElementById("checkoutBtn").disabled=!items.length;
}
function updateCartCount() {document.getElementById("cartCount").textContent=cart.reduce((s,i)=>s+i.qty,0);}
function openModal(id) {document.getElementById(id).classList.add("show")}
function closeModal(id) {document.getElementById(id).classList.remove("show")}

document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("show")}));
document.getElementById("cartBtn").onclick=()=>{renderCart();openModal("cartModal")};
const clearCartBtn=document.getElementById("clearCartBtn");
if(clearCartBtn) clearCartBtn.onclick=clearCart;
document.getElementById("checkoutBtn").onclick=()=>{if(cart.length){closeModal("cartModal");openModal("checkoutModal")}};
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const clearSearch = document.getElementById("clearSearch");
if (searchInput) searchInput.addEventListener("input", renderProducts);
if (sortSelect) sortSelect.addEventListener("change", renderProducts);
if (clearSearch) clearSearch.addEventListener("click",()=>{ searchInput.value=""; renderProducts(); searchInput.focus(); });
function showToast(message){const t=document.getElementById("toast");t.textContent=message;t.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.remove("show"),1800)}
document.getElementById("waGeneral").href=waLink("Halo KALENSARI STORE, saya ingin bertanya tentang produk.");
document.getElementById("checkoutForm").addEventListener("submit",async e=>{
  e.preventDefault(); if(!cart.length)return;
  const f=new FormData(e.target),items=cartData(),subtotal=items.reduce((s,p)=>s+currentPrice(p)*p.qty,0),total=subtotal+SHIPPING_COST;
  // Nomor pesanan singkat: KS + 4 digit (contoh KS4512).
  // Cek riwayat lokal agar sebisa mungkin tidak terjadi nomor yang sama.
  const localOrdersForCode = readStorageJSON("kalensari_orders", []);
  let orderCode = "";
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = "KS" + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    if (!localOrdersForCode.some(o => o && o.order_code === code)) {
      orderCode = code;
      break;
    }
  }
  if (!orderCode) {
    orderCode = "KS" + String(Date.now() % 10000).padStart(4, "0");
  }
  const detail=items.map(p=>`- ${p.name} x${p.qty} = ${rupiah(currentPrice(p)*p.qty)}`).join("\n");
  const order={order_code:orderCode,customer_name:String(f.get("name")||""),customer_phone:String(f.get("phone")||""),address:String(f.get("address")||""),note:String(f.get("note")||""),payment:String(f.get("payment")||""),items,subtotal,shipping:SHIPPING_COST,total,status:"baru",created_at:new Date().toISOString()};
  const localOrders=readStorageJSON("kalensari_orders",[]);
  localOrders.unshift(order);
  localStorage.setItem("kalensari_orders",JSON.stringify(localOrders.slice(0,30)));
  await saveCloudOrder(order);
  const msg=`Halo KALENSARI STORE, saya ingin memesan.\n\nNo. Pesanan: ${orderCode}\n\n${detail}\n\nSubtotal: ${rupiah(subtotal)}\nOngkir: ${rupiah(SHIPPING_COST)}\nTOTAL: ${rupiah(total)}\n\nNama: ${order.customer_name}\nNo. WhatsApp: ${order.customer_phone}\nAlamat: ${order.address}\nCatatan: ${order.note||"-"}\nPembayaran: ${order.payment}`;
  window.open(waLink(msg),"_blank");
  cart=[]; saveCart(); updateCartCount(); renderCart(); e.target.reset(); closeModal("checkoutModal");
  showToast(`Pesanan ${orderCode} dibuat`);
  renderMyOrders();
});

// Migrasi kode pesanan lama ke format pendek KS + 4 angka.
// Contoh: KS2026093007104862 -> KS4512
function migrateOldOrderCodes(){
  const orders = readStorageJSON("kalensari_orders", []);
  if (!Array.isArray(orders) || !orders.length) return;

  const used = new Set();
  let changed = false;

  function newShortCode(){
    for(let attempt=0; attempt<100; attempt++){
      const code = "KS" + String(Math.floor(Math.random()*10000)).padStart(4,"0");
      if(!used.has(code)) return code;
    }
    return "KS" + String(Date.now()%10000).padStart(4,"0");
  }

  orders.forEach(order=>{
    const code = String(order?.order_code || "");
    // Pertahankan kode yang sudah benar: KS + tepat 4 angka.
    if(/^KS\d{4}$/.test(code) && !used.has(code)){
      used.add(code);
      return;
    }
    const shortCode = newShortCode();
    order.order_code = shortCode;
    used.add(shortCode);
    changed = true;
  });

  if(changed){
    localStorage.setItem("kalensari_orders", JSON.stringify(orders.slice(0,30)));
  }
}

function initKalensariStore(){
  try{
    migrateOldOrderCodes();
    const yearEl=document.getElementById("year");
    if(yearEl) yearEl.textContent=new Date().getFullYear();

    renderCategories();
    renderProducts();
    updateCartCount();
    renderCart();

    if(CLOUD_CONFIG?.enabled){
      updateCloudStatus("☁️ Menghubungkan ke database...");
      loadCloudProducts().then(ok=>{
        if(ok){
          renderCategories();
          renderProducts();
          updateCloudStatus("☁️ Produk tersinkron online");
        }else{
          updateCloudStatus("⚠️ Cloud belum tersambung. Data lokal tetap digunakan.");
        }
      }).catch(err=>{
        console.warn("Cloud init:",err);
        updateCloudStatus("⚠️ Cloud tidak tersambung. Data lokal tetap digunakan.");
      });
    }
  }catch(err){
    console.error("KALENSARI STORE gagal memuat:",err);
    // Jika data lama membuat halaman error, pulihkan otomatis ke produk bawaan.
    products=getDefaultProducts();
    saveProducts();
    try{
      renderCategories();
      renderProducts();
      updateCartCount();
      renderCart();
      showToast("Produk berhasil dipulihkan");
    }catch(recoveryError){
      console.error("Recovery gagal:",recoveryError);
    }
  }
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", initKalensariStore);
}else{
  initKalensariStore();
}


// ===== FLOATING PRODUCT SEARCH - BENAR-BENAR BISA MENCARI =====
const searchFloat = document.getElementById("searchFloat");
const quickSearchPanel = document.getElementById("quickSearchPanel");
const quickSearchInput = document.getElementById("quickSearchInput");
const quickSearchClear = document.getElementById("quickSearchClear");
const quickSearchResult = document.getElementById("quickSearchResult");

function setQuickSearchOpen(open){
  if(!quickSearchPanel || !searchFloat) return;
  quickSearchPanel.classList.toggle("show", open);
  quickSearchPanel.setAttribute("aria-hidden", open ? "false" : "true");
  searchFloat.classList.toggle("active", open);
  searchFloat.setAttribute("aria-expanded", open ? "true" : "false");
  if(open && quickSearchInput){
    const mainValue = document.getElementById("searchInput")?.value || "";
    quickSearchInput.value = mainValue;
    setTimeout(()=>{ quickSearchInput.focus(); quickSearchInput.select(); }, 80);
    updateQuickSearchResult();
  }
}

function updateQuickSearchResult(){
  if(!quickSearchInput || !quickSearchResult) return;
  const query = quickSearchInput.value.trim();
  if(!query){
    quickSearchResult.textContent = "Ketik nama produk untuk mencari.";
    return;
  }
  const q = query.toLowerCase();
  const matches = products.filter(p =>
    String(p.name||"").toLowerCase().includes(q) ||
    String(p.category||"").toLowerCase().includes(q) ||
    String(p.seller||"").toLowerCase().includes(q)
  );
  quickSearchResult.textContent = matches.length
    ? `${matches.length} produk ditemukan untuk “${query}”.`
    : `Produk “${query}” tidak ditemukan.`;
}

function runQuickSearch(){
  if(!quickSearchInput) return;
  const value = quickSearchInput.value.trim();
  const mainSearch = document.getElementById("searchInput");
  if(mainSearch){
    mainSearch.value = value;
    renderProducts();
  }
  const productsSection = document.getElementById("products");
  if(productsSection) productsSection.scrollIntoView({behavior:"smooth",block:"start"});
  updateQuickSearchResult();
}

if(searchFloat){
  searchFloat.addEventListener("click",()=>setQuickSearchOpen(!quickSearchPanel?.classList.contains("show")));
}
if(quickSearchInput){
  quickSearchInput.addEventListener("input",()=>{
    const mainSearch=document.getElementById("searchInput");
    if(mainSearch){mainSearch.value=quickSearchInput.value;renderProducts();}
    updateQuickSearchResult();
  });
  quickSearchInput.addEventListener("keydown",e=>{
    if(e.key==="Enter"){e.preventDefault();runQuickSearch();}
    if(e.key==="Escape")setQuickSearchOpen(false);
  });
}
if(quickSearchClear){
  quickSearchClear.addEventListener("click",()=>{
    if(quickSearchInput)quickSearchInput.value="";
    const mainSearch=document.getElementById("searchInput");
    if(mainSearch){mainSearch.value="";renderProducts();}
    updateQuickSearchResult();
    // Tombol X mengembalikan mesin pencarian ke kondisi pasif.
    setQuickSearchOpen(false);
  });
}
document.addEventListener("click",e=>{
  if(!quickSearchPanel || !searchFloat) return;
  if(quickSearchPanel.classList.contains("show") && !quickSearchPanel.contains(e.target) && !searchFloat.contains(e.target)){
    setQuickSearchOpen(false);
  }
});

// ===== PESANAN SAYA V10 =====
function normalizeOrderStatus(status){
  const allowed=["baru","diproses","dikirim","selesai","dibatalkan"];
  return allowed.includes(String(status)) ? String(status) : "baru";
}

function getLocalOrders(){
  const rows=readStorageJSON("kalensari_orders",[]);
  return Array.isArray(rows) ? rows : [];
}

function saveLocalOrders(rows){
  localStorage.setItem("kalensari_orders", JSON.stringify(rows.slice(0,30)));
}

function renderMyOrders(rowsOverride){
  const box=document.getElementById("myOrderList"); if(!box)return;
  const rows=Array.isArray(rowsOverride)?rowsOverride:getLocalOrders();
  const count=document.getElementById("myOrderCount"); if(count)count.textContent=`${rows.length} pesanan`;
  box.innerHTML=rows.length?rows.map(o=>{
    const status=normalizeOrderStatus(o.status);
    return `<div class="my-order-card">
      <div class="my-order-head"><b>📦 ${esc(o.order_code||"-")}</b><span class="order-status status-${esc(status)}">${statusLabel(status)}</span></div>
      <small>${new Date(o.created_at||Date.now()).toLocaleString("id-ID")}</small>
      <p>${(o.items||[]).map(x=>`${esc(x.name)} ×${x.qty}`).join(" • ")}</p>
      <strong>${rupiah(o.total||0)}</strong>
      ${status==="selesai"?'<div class="order-hint success">✅ Pesanan selesai</div>':status==="dibatalkan"?'<div class="order-hint danger">❌ Pesanan dibatalkan</div>':'<div class="order-hint">🔄 Status akan diperbarui oleh admin.</div>'}
    </div>`;
  }).join(""):'<div class="empty-state"><b>📦 Belum ada pesanan</b>Pesanan yang dibuat dari perangkat ini akan muncul di sini.</div>';
}

async function refreshMyOrdersFromCloud(){
  if(!CLOUD_CONFIG?.enabled) return;
  const local=getLocalOrders();
  if(!local.length) return;
  try{
    const cloudRows=await loadCloudOrders();
    const byCode=new Map(cloudRows.map(o=>[String(o.order_code||""),o]));
    let changed=false;
    local.forEach(o=>{
      const remote=byCode.get(String(o.order_code||""));
      if(remote && normalizeOrderStatus(o.status)!==normalizeOrderStatus(remote.status)){
        o.status=normalizeOrderStatus(remote.status);
        changed=true;
      }
    });
    if(changed) saveLocalOrders(local);
    renderMyOrders(local);
  }catch(e){console.warn("Refresh status pesanan:",e);}
}

const myOrdersBtn=document.getElementById("myOrdersBtn");
if(myOrdersBtn) myOrdersBtn.onclick=async()=>{
  renderMyOrders();
  openModal("myOrdersModal");
  await refreshMyOrdersFromCloud();
};

// ===== ADMIN DASHBOARD V10 =====
let adminLoggedIn = false;
function openAdmin(){
  document.getElementById("adminPin").value="";
  document.getElementById("adminLogin").hidden=adminLoggedIn;
  document.getElementById("adminPanel").hidden=!adminLoggedIn;
  if(adminLoggedIn){ renderAdminProducts(); renderAdminOrders(); }
  openModal("adminModal");
}
function renderAdminProducts(){
  const box=document.getElementById("adminProductList");
  box.innerHTML=products.map((p,i)=>`
    <div class="admin-product">
      <img src="${p.image||''}" alt="${p.name}" onerror="this.style.display='none'">
      <div class="admin-product-info"><h4>${p.name} <span class="admin-status ${p.status!=="Show"?'off':''}">${p.status}</span></h4><small>${p.category} • ${rupiah(currentPrice(p))} • ${p.seller}</small></div>
      <div class="admin-product-actions"><button class="btn outline" onclick="editAdminProduct(${i})">✏️ Edit</button><button class="btn outline" onclick="toggleAdminProduct(${i})">${p.status==='Show'?'⏸️ Sembunyikan':'▶️ Tampilkan'}</button><button class="btn outline" onclick="deleteAdminProduct(${i})">🗑️ Hapus</button></div>
      <div id="edit-${i}" class="admin-edit" hidden></div>
    </div>`).join("");
}
function editAdminProduct(i){
  const p=products[i], box=document.getElementById(`edit-${i}`);
  box.hidden=false;
  box.innerHTML=`
    <label>Nama<input id="e-name-${i}" value="${esc(p.name)}"></label>
    <label>Kategori<select id="e-cat-${i}"><option ${p.category==='Makanan'?'selected':''}>Makanan</option><option ${p.category==='Minuman'?'selected':''}>Minuman</option></select></label>
    <label>Harga<input id="e-price-${i}" type="number" value="${p.price}"></label>
    <label>Harga Promo<input id="e-sale-${i}" type="number" value="${p.sale||''}" placeholder="Kosongkan jika tidak promo"></label>
    <label>Penjual<input id="e-seller-${i}" value="${esc(p.seller)}"></label>
    <label>Satuan<input id="e-unit-${i}" value="${esc(p.unit)}"></label>
    <label class="wide">URL Foto<input id="e-image-${i}" value="${esc(p.image||'')}"></label>
    <div class="admin-edit-actions"><button class="btn primary" onclick="saveAdminProduct(${i})">💾 Simpan</button><button class="btn outline" onclick="renderAdminProducts()">Batal</button></div>`;
}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function saveAdminProduct(i){
  const p=products[i]; p.name=document.getElementById(`e-name-${i}`).value.trim(); p.category=document.getElementById(`e-cat-${i}`).value; p.price=Number(document.getElementById(`e-price-${i}`).value)||0; const sale=Number(document.getElementById(`e-sale-${i}`).value); p.sale=sale>0?sale:null; p.seller=document.getElementById(`e-seller-${i}`).value.trim(); p.unit=document.getElementById(`e-unit-${i}`).value.trim(); p.image=document.getElementById(`e-image-${i}`).value.trim(); saveProducts(); syncCloudProducts(); renderProducts(); renderCategories(); renderAdminProducts(); showToast("Produk berhasil diperbarui");
}
function addAdminProduct(){
  const id=products.length?Math.max(...products.map(p=>p.id))+1:1;
  products.unshift({id,name:"Produk Baru",price:10000,sale:null,category:"Makanan",unit:"1 porsi",seller:"Warga Kalensari",status:"Show",image:""});
  saveProducts(); syncCloudProducts(); renderProducts(); renderCategories(); renderAdminProducts(); editAdminProduct(0); showToast("Produk baru ditambahkan");
}
function toggleAdminProduct(i){products[i].status=products[i].status==='Show'?'Out of Stock':'Show';saveProducts();syncCloudProducts();renderProducts();renderAdminProducts();}
function deleteAdminProduct(i){if(!confirm(`Hapus ${products[i].name}?`))return;products.splice(i,1);saveProducts();syncCloudProducts();renderProducts();renderCategories();renderAdminProducts();showToast("Produk dihapus");}
document.getElementById("menuBtn").onclick=openAdmin;
document.getElementById("adminLoginBtn").onclick=()=>{if(document.getElementById("adminPin").value===ADMIN_PIN){adminLoggedIn=true;document.getElementById("adminLogin").hidden=true;document.getElementById("adminPanel").hidden=false;renderAdminProducts();showToast("Login admin berhasil")}else showToast("PIN admin salah")};
document.getElementById("addProductBtn").onclick=addAdminProduct;
document.getElementById("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(products,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="kalensari-products.json";a.click();URL.revokeObjectURL(a.href)};
document.getElementById("importFile").onchange=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!Array.isArray(data))throw Error();products=data.map((p,i)=>({...p,id:Number(p.id)||i+1}));saveProducts();syncCloudProducts();renderProducts();renderCategories();renderAdminProducts();showToast("Produk berhasil diimpor")}catch{showToast("File produk tidak valid")}};r.readAsText(file)};
document.getElementById("resetProductsBtn").onclick=()=>{if(!confirm("Kembalikan 25 produk bawaan?"))return;products=DEFAULT_PRODUCTS.map(p=>({...p}));saveProducts();syncCloudProducts();renderProducts();renderCategories();renderAdminProducts();showToast("Produk dikembalikan ke bawaan")};


function updateAdminOrderStats(rows){
  const counts={baru:0,diproses:0,dikirim:0,selesai:0};
  (rows||[]).forEach(o=>{
    const s=normalizeOrderStatus(o.status);
    if(Object.prototype.hasOwnProperty.call(counts,s)) counts[s]++;
  });
  const map={baru:"statMenunggu",diproses:"statDiproses",dikirim:"statDikirim",selesai:"statSelesai"};
  Object.entries(map).forEach(([s,id])=>{const el=document.getElementById(id);if(el)el.textContent=counts[s];});
}

function mergeCloudOrdersWithLocal(cloudRows){
  const local=getLocalOrders();
  const localByCode=new Map(local.map(o=>[String(o.order_code||""),o]));
  (cloudRows||[]).forEach(remote=>{
    const code=String(remote.order_code||"");
    if(!code)return;
    const old=localByCode.get(code);
    if(old){ old.status=normalizeOrderStatus(remote.status); }
    else { local.push({...remote,status:normalizeOrderStatus(remote.status)}); }
  });
  saveLocalOrders(local);
  return local;
}

async function getAdminOrders(){
  if(CLOUD_CONFIG?.enabled){
    const cloudRows=await loadCloudOrders();
    return mergeCloudOrdersWithLocal(cloudRows);
  }
  return getLocalOrders();
}

async function renderAdminOrders(){
  const box=document.getElementById("adminOrderList"); if(!box)return;
  box.innerHTML='<div class="empty-state">⏳ Memuat pesanan...</div>';
  const rows=await getAdminOrders();
  updateAdminOrderStats(rows);
  if(!rows.length){
    box.innerHTML='<div class="empty-state"><b>📋 Belum ada pesanan</b><br>Pesanan pelanggan akan muncul di sini setelah checkout.</div>';
    return;
  }
  box.innerHTML=rows.map(o=>{
    const status=normalizeOrderStatus(o.status);
    const code=String(o.order_code||"");
    return `<div class="admin-order">
      <div class="admin-order-top"><b>📦 ${esc(code||"-")}</b><span class="order-status status-${esc(status)}">${statusLabel(status)}</span></div>
      <span>👤 ${esc(o.customer_name||"Pelanggan")} • ${esc(o.customer_phone||"")}</span>
      <small>🕒 ${new Date(o.created_at||Date.now()).toLocaleString("id-ID")}</small>
      <strong>💰 ${rupiah(o.total||0)}</strong>
      <p>${(o.items||[]).map(x=>`${esc(x.name)} ×${x.qty}`).join(" • ")}</p>
      <label>Status Pesanan
        <select data-order-code="${esc(code)}" class="admin-order-status-select">
          ${["baru","diproses","dikirim","selesai","dibatalkan"].map(s=>`<option value="${s}" ${status===s?'selected':''}>${statusLabel(s)}</option>`).join("")}
        </select>
      </label>
      <a class="btn outline" target="_blank" rel="noopener" href="${waLink(`Halo ${o.customer_name||"Pelanggan"}, terkait pesanan ${code} KALENSARI STORE.`)}">💬 WhatsApp</a>
    </div>`;
  }).join("");

  box.querySelectorAll(".admin-order-status-select").forEach(select=>{
    select.addEventListener("change",()=>changeOrderStatus(select.dataset.orderCode,select.value));
  });
}

function statusLabel(s){
  return ({baru:"Menunggu",diproses:"Diproses",dikirim:"Dikirim",selesai:"Selesai",dibatalkan:"Dibatalkan"}[normalizeOrderStatus(s)]||"Menunggu");
}

async function changeOrderStatus(orderCode,status){
  if(!orderCode)return;
  status=normalizeOrderStatus(status);
  const rows=getLocalOrders();
  const localOrder=rows.find(o=>String(o.order_code||"")===String(orderCode));
  if(localOrder){ localOrder.status=status; saveLocalOrders(rows); }
  else { showToast("Pesanan tidak ditemukan di perangkat ini"); return; }

  let cloudOK=true;
  if(CLOUD_CONFIG?.enabled){ cloudOK=await updateCloudOrderStatus(orderCode,status); }
  if(!cloudOK){
    showToast(`Status lokal ${orderCode} menjadi ${statusLabel(status)}; cloud gagal diperbarui`);
  }else{
    showToast(`Status ${orderCode}: ${statusLabel(status)}`);
  }
  renderMyOrders(rows);
  renderAdminOrders();
}

document.getElementById("refreshOrdersBtn")?.addEventListener("click",renderAdminOrders);

document.getElementById("waHero")?.setAttribute("href", `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Halo KALENSARI STORE, saya ingin bertanya tentang produk.")}`);
document.getElementById("waFloat")?.setAttribute("href", `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Halo KALENSARI STORE, saya ingin memesan.")}`);
function getProductImage(imagePath) {
  if (!imagePath) return "";

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  return `${(CLOUD_CONFIG?.supabaseUrl || "").replace(/\/$/, "")}/storage/v1/object/public/products/${imagePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
