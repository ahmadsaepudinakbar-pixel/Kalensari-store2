// KALENSARI STORE
const WHATSAPP_NUMBER = "6281234567890";
const SHIPPING_COST = 0;
const products = [{"id":1,"name":"Lotek Bongko","price":12000,"sale":8000,"category":"Makanan","unit":"1 porsi","seller":"Teh Ida","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/o-fvve-chatgpt%20image%20sep%2028%2C%202026%2C%2005_14_09%20am.png?versionId=sSlnWC5X3v6SfdE8SJ7kfFpkAAtYEG66"},{"id":2,"name":"Bakso Sapi Biasa","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/pf0do4-chatgpt%20image%20sep%2028%2C%202026%2C%2006_23_05%20am.png?versionId=LvDf81yvhC2OIgUPloRKlaBbRFi.9BuH"},{"id":3,"name":"MIe ayam Pedas","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"H. Diman, Mang Edo, Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/0qg0at-chatgpt%20image%20sep%2028%2C%202026%2C%2002_03_31%20pm.png?versionId=EH1aAjwRvQd3dMY93ItbAgINe5lzjnTw"},{"id":4,"name":"MIe ayam Biasa","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"H. Diman, Mang Edo, Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/m5q9je-chatgpt%20image%20sep%2028%2C%202026%2C%2002_02_42%20pm.png?versionId=Lci_mH9SOmBpD2nCjBV_Z_o_XXpxpW8v"},{"id":5,"name":"Bakso Tulang","price":25000,"sale":18000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Out of Stock","image":"https://cdn.store.link/products/kalensaristore80353/agx1iw-chatgpt%20image%20sep%2028%2C%202026%2C%2006_29_33%20am.png?versionId=1n1pJ2ilQgM4jrhR5X_0LEG9mB.lTmg8"},{"id":6,"name":"Bakso Telur","price":12000,"sale":10000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/8a69b3-chatgpt%20image%20sep%2028%2C%202026%2C%2006_34_03%20am.png?versionId=m_nc2BhsK7d4LdKAPdxnMAiRHAV.Q2qB"},{"id":7,"name":"Bakso Urat","price":18000,"sale":15000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/obbajp-chatgpt%20image%20sep%2028%2C%202026%2C%2006_36_33%20am.png?versionId=h_Evc0EcQtdz4PFbFk8aZey0jgRRXZ.p"},{"id":8,"name":"Jus Alpukat","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/3x8j0a-chatgpt%20image%20sep%2028%2C%202026%2C%2006_52_41%20am.png?versionId=eKLzC7y3fgCWrkTSAdcaLHEyEYAdZMsh"},{"id":9,"name":"Jus Buah Naga","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/p8vus5-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_02%20am.png?versionId=e6H7dwvYmMOZrI86QKN98dyVxHcc8V0M"},{"id":10,"name":"Jus Tomat","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/o4d1bt-chatgpt%20image%20sep%2028%2C%202026%2C%2007_20_47%20am.png?versionId=IbXRZdg2vp6bCuXJPch5YT7FgQZXXcRM"},{"id":11,"name":"Jus Mangga","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/lqk2sp-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_59%20am.png?versionId=FADsI7qbgepPpQt7XVGl901Q_3cKHFQW"},{"id":12,"name":"Es teh Manis","price":3000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/abqncl-hops-3260267377.webp?versionId=P4DG3eGis6QyEzh9ZFQm3CBF8p9DEJwx"},{"id":13,"name":"Es teh Matcha Late","price":6000,"sale":null,"category":"Minuman","unit":"1 cup besar Rasa Greentea","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/c9c6rx-images%20%281%29.jpg?versionId=K0P2vQjt8SpfWctljxkmCkUO_8AfkYf2"},{"id":14,"name":"Es teh Matcha Premium","price":15000,"sale":12000,"category":"Minuman","unit":"1 cup besar Rasa Greentea","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/bkv3a5-images.jpg?versionId=jKTeHTYDtwRD2qs6CWqYs9ZM2EBZ9emC"},{"id":15,"name":"Nasi Kebuli","price":25000,"sale":20000,"category":"Makanan","unit":"1 porsi","seller":"Teh iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/u4fafx-chatgpt%20image%20sep%2028%2C%202026%2C%2002_14_04%20pm.png?versionId=DHZD_c9LScH15.An7XpzcTJMrjDf0AJk"},{"id":16,"name":"Nasi Goreng","price":13000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Kang Diki Sueb","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/h38vn8-chatgpt%20image%20sep%2028%2C%202026%2C%2002_11_47%20pm.png?versionId=Q1UfoJozDqlb8kaNfjJqp6nKv74i_B3F"},{"id":17,"name":"Pecel Lele","price":15000,"sale":null,"category":"Makanan","unit":"Pecel Lele","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"},{"id":18,"name":"Pecel Lele + Nasi","price":20000,"sale":null,"category":"Makanan","unit":"Pecel Lele + Nasi","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"},{"id":19,"name":"Pecel Ayam","price":20000,"sale":null,"category":"Makanan","unit":"Pecel Ayam","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"},{"id":20,"name":"Pecel Ayam + Nasi","price":25000,"sale":null,"category":"Makanan","unit":"Pecel Ayam + Nasi","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"},{"id":21,"name":"Fried Chiken","price":10000,"sale":null,"category":"Makanan","unit":"Ayam Goreng Tepung","seller":"Warga Kalensari","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/q38c2x-chatgpt%20image%20sep%2028%2C%202026%2C%2002_23_43%20pm.png?versionId=RR2yA7Iutiz2jXiFwJNUzApiqzE7ItsL"},{"id":22,"name":"Soto Ayam","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Sate Madura","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/4io072-chatgpt%20image%20sep%2028%2C%202026%2C%2002_22_28%20pm.png?versionId=48IdG9bl9fPErJcNUzMeAPrvhzOOe_qr"},{"id":23,"name":"Sate Ayam","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Sate Madura","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ewpn71-chatgpt%20image%20sep%2028%2C%202026%2C%2002_18_51%20pm.png?versionId=X09ZJ.tPJyqr_LhYnZRngTpDFKIVqz0b"},{"id":24,"name":"Nasi Ayam Katsu","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Teh Iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ievcoz-chatgpt%20image%20sep%2028%2C%202026%2C%2002_17_10%20pm.png?versionId=buhfyErVz0r0y_eaESh2AooKeylFdopS"},{"id":25,"name":"Spageti","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Teh Iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/d62zqy-aa1408ce-c67d-4d63-aa67-12ec89b3c905.png?versionId=chUteSwuPamgkCgB_ORU_hnugVoqj8dW"}];

let cart = JSON.parse(localStorage.getItem("kalensari_cart") || "[]");
let activeCategory = "Semua";

const rupiah = n => "Rp" + new Intl.NumberFormat("id-ID").format(n);
const saveCart = () => localStorage.setItem("kalensari_cart", JSON.stringify(cart));
const waLink = message => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
const currentPrice = p => p.sale || p.price;

function priceHTML(p) {
  return p.sale ? `<span class="old-price">${rupiah(p.price)}</span>${rupiah(p.sale)}` : rupiah(p.price);
}
function renderCategories() {
  const cats=["Semua",...new Set(products.map(p=>p.category))];
  document.getElementById("categories").innerHTML=cats.map(c=>`<button class="cat ${c===activeCategory?"active":""}" onclick="setCategory('${c}')">${c}</button>`).join("");
}
function setCategory(c) {
  activeCategory=c; renderCategories(); renderProducts();
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
function renderProducts() {
  const q=document.getElementById("searchInput").value.toLowerCase().trim();
  const list=products.filter(p=>p.status==="Show" && (activeCategory==="Semua"||p.category===activeCategory) && (p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)));
  document.getElementById("resultInfo").textContent=`${list.length} produk`;
  document.getElementById("productGrid").innerHTML=list.length?list.map(p=>`
    <article class="product">
      <div class="product-img"><img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='🛍️'"></div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <div class="price">${priceHTML(p)}</div>
        <small>${p.unit}</small>
        <div class="product-actions">
          <button class="btn outline" onclick="showProduct(${p.id})">Detail</button>
          <button class="btn primary" onclick="addToCart(${p.id})">+ Keranjang</button>
        </div>
      </div>
    </article>`).join(""):"<p>Produk tidak ditemukan.</p>";
}
function showProduct(id) {
  const p=products.find(x=>x.id===id);
  const sold=p.status!=="Show";
  document.getElementById("productDetail").innerHTML=`
    <div class="detail">
      <div class="detail-img"><img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'"></div>
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
  saveCart();updateCartCount();renderCart();
}
function changeQty(id,d) {
  const item=cart.find(x=>x.id===id);if(!item)return;
  item.qty+=d;if(item.qty<=0)cart=cart.filter(x=>x.id!==id);
  saveCart();updateCartCount();renderCart();
}
function cartData() {return cart.map(i=>({...products.find(p=>p.id===i.id),qty:i.qty})).filter(x=>x.id);}
function renderCart() {
  const items=cartData(),subtotal=items.reduce((s,p)=>s+currentPrice(p)*p.qty,0),shipping=items.length?SHIPPING_COST:0;
  document.getElementById("cartItems").innerHTML=items.length?items.map(p=>`
    <div class="cart-row"><div><b>${p.name}</b><br><span>${rupiah(currentPrice(p))} × ${p.qty}</span></div>
    <div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><b>${p.qty}</b><button onclick="changeQty(${p.id},1)">+</button></div></div>`).join(""):"<p>Keranjang masih kosong.</p>";
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
document.getElementById("checkoutBtn").onclick=()=>{if(cart.length){closeModal("cartModal");openModal("checkoutModal")}};
document.getElementById("searchInput").addEventListener("input",renderProducts);
document.getElementById("waGeneral").href=waLink("Halo KALENSARI STORE, saya ingin bertanya tentang produk.");
document.getElementById("checkoutForm").addEventListener("submit",e=>{
  e.preventDefault();if(!cart.length)return;
  const f=new FormData(e.target),items=cartData(),subtotal=items.reduce((s,p)=>s+currentPrice(p)*p.qty,0),total=subtotal+SHIPPING_COST;
  const detail=items.map(p=>`- ${p.name} x${p.qty} = ${rupiah(currentPrice(p)*p.qty)}`).join("\n");
  const msg=`Halo KALENSARI STORE, saya ingin memesan:\n\n${detail}\n\nSubtotal: ${rupiah(subtotal)}\nOngkir: ${rupiah(SHIPPING_COST)}\nTOTAL: ${rupiah(total)}\n\nNama: ${f.get("name")}\nNo. WhatsApp: ${f.get("phone")}\nAlamat: ${f.get("address")}\nCatatan: ${f.get("note")||"-"}\nPembayaran: ${f.get("payment")}`;
  window.open(waLink(msg),"_blank");
});
document.getElementById("year").textContent=new Date().getFullYear();
renderCategories();renderProducts();updateCartCount();renderCart();
