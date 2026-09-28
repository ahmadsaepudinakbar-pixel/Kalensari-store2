// ===== KALENSARI STORE =====
// GANTI nomor WhatsApp di bawah dengan nomor WhatsApp toko Anda.
// Format: kode negara tanpa +, contoh 6281234567890
const WHATSAPP_NUMBER = "6282114541041";
const SHIPPING_COST = 10000;

const products = [
  {id:1,name:"Brownies Coklat",price:35000,category:"Brownies",emoji:"🍫",desc:"Brownies lembut dengan rasa coklat yang nikmat, cocok untuk camilan dan hadiah."},
  {id:2,name:"Kastengel",price:45000,category:"Kue Kering",emoji:"🧀",desc:"Kastengel gurih dengan aroma keju yang cocok untuk keluarga dan acara spesial."},
  {id:3,name:"Kue Kacang",price:30000,category:"Kue Kering",emoji:"🥜",desc:"Kue kacang renyah dan nikmat dengan rasa kacang yang khas."},
  {id:4,name:"Kue Coklat Kering",price:32000,category:"Kue Kering",emoji:"🍪",desc:"Kue coklat kering yang renyah dan cocok menemani waktu santai."},
  {id:5,name:"Kue Semprit",price:30000,category:"Kue Kering",emoji:"🌸",desc:"Kue semprit lembut dan renyah dengan rasa manis yang pas."},
  {id:6,name:"Lidah Kucing",price:35000,category:"Kue Kering",emoji:"🍪",desc:"Lidah kucing tipis, renyah, dan cocok untuk sajian keluarga."},
  {id:7,name:"Cornflakes Cookies",price:35000,category:"Kue Kering",emoji:"🌽",desc:"Cookies renyah dengan cornflakes yang gurih dan lezat."},
  {id:8,name:"Hampers KALENSARI",price:85000,category:"Hampers",emoji:"🎁",desc:"Paket hampers pilihan KALENSARI STORE untuk hadiah dan momen spesial."}
];

let cart = JSON.parse(localStorage.getItem("kalensari_cart") || "[]");
let activeCategory = "Semua";

const rupiah = n => "Rp" + new Intl.NumberFormat("id-ID").format(n);
const saveCart = () => localStorage.setItem("kalensari_cart", JSON.stringify(cart));

function waLink(message){
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function renderCategories(){
  const cats=["Semua",...new Set(products.map(p=>p.category))];
  document.getElementById("categories").innerHTML=cats.map(c=>`<button class="cat ${c===activeCategory?"active":""}" onclick="setCategory('${c}')">${c}</button>`).join("");
}
function setCategory(c){activeCategory=c; renderCategories(); renderProducts(); document.getElementById("products").scrollIntoView({behavior:"smooth"});}
function renderProducts(){
  const q=document.getElementById("searchInput").value.toLowerCase().trim();
  const list=products.filter(p=>(activeCategory==="Semua"||p.category===activeCategory)&&(p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)));
  document.getElementById("resultInfo").textContent=`${list.length} produk`;
  document.getElementById("productGrid").innerHTML=list.length?list.map(p=>`
    <article class="product">
      <div class="product-img">${p.emoji}</div>
      <div class="product-body">
        <h3>${p.name}</h3><div class="price">${rupiah(p.price)}</div>
        <div class="product-actions">
          <button class="btn outline" onclick="showProduct(${p.id})">Detail</button>
          <button class="btn primary" onclick="addToCart(${p.id})">+ Keranjang</button>
        </div>
      </div>
    </article>`).join(""):`<p>Produk tidak ditemukan.</p>`;
}
function showProduct(id){
  const p=products.find(x=>x.id===id);
  document.getElementById("productDetail").innerHTML=`
    <div class="detail">
      <div class="detail-img">${p.emoji}</div>
      <div>
        <p class="eyebrow">${p.category}</p><h2>${p.name}</h2>
        <div class="price">${rupiah(p.price)}</div><p>${p.desc}</p>
        <button class="btn primary full" onclick="addToCart(${p.id});closeModal('productModal')">🛒 Tambah ke Keranjang</button>
        <br><br>
        <a class="btn outline full" target="_blank" href="${waLink(`Halo KALENSARI STORE, saya ingin membeli ${p.name} (${rupiah(p.price)}).`)}">💬 Beli via WhatsApp</a>
      </div>
    </div>`;
  openModal("productModal");
}
function addToCart(id){
  const item=cart.find(x=>x.id===id);
  if(item)item.qty++; else cart.push({id,qty:1});
  saveCart(); updateCartCount(); renderCart();
}
function changeQty(id,d){
  const item=cart.find(x=>x.id===id); if(!item)return;
  item.qty+=d; if(item.qty<=0)cart=cart.filter(x=>x.id!==id);
  saveCart();updateCartCount();renderCart();
}
function cartData(){
  return cart.map(i=>({...products.find(p=>p.id===i.id),qty:i.qty}));
}
function renderCart(){
  const items=cartData();
  const subtotal=items.reduce((s,p)=>s+p.price*p.qty,0);
  const shipping=items.length?SHIPPING_COST:0;
  document.getElementById("cartItems").innerHTML=items.length?items.map(p=>`
    <div class="cart-row">
      <div><b>${p.emoji} ${p.name}</b><br><span>${rupiah(p.price)} × ${p.qty}</span></div>
      <div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><b>${p.qty}</b><button onclick="changeQty(${p.id},1)">+</button></div>
    </div>`).join(""):"<p>Keranjang masih kosong.</p>";
  document.getElementById("cartSubtotal").textContent=rupiah(subtotal);
  document.getElementById("cartShipping").textContent=rupiah(shipping);
  document.getElementById("cartTotal").textContent=rupiah(subtotal+shipping);
  document.getElementById("checkoutTotal").textContent=rupiah(subtotal+shipping);
  document.getElementById("checkoutBtn").disabled=!items.length;
}
function updateCartCount(){document.getElementById("cartCount").textContent=cart.reduce((s,i)=>s+i.qty,0);}
function openModal(id){document.getElementById(id).classList.add("show")}
function closeModal(id){document.getElementById(id).classList.remove("show")}

document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("show")}));
document.getElementById("cartBtn").onclick=()=>{renderCart();openModal("cartModal")};
document.getElementById("checkoutBtn").onclick=()=>{if(cart.length){closeModal("cartModal");openModal("checkoutModal")}};
document.getElementById("searchInput").addEventListener("input",renderProducts);
document.getElementById("waGeneral").href=waLink("Halo KALENSARI STORE, saya ingin bertanya tentang produk.");
document.getElementById("checkoutForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(!cart.length)return;
  const f=new FormData(e.target), items=cartData();
  const subtotal=items.reduce((s,p)=>s+p.price*p.qty,0), total=subtotal+SHIPPING_COST;
  const detail=items.map(p=>`- ${p.name} x${p.qty} = ${rupiah(p.price*p.qty)}`).join("\n");
  const msg=`Halo KALENSARI STORE, saya ingin memesan:\n\n${detail}\n\nSubtotal: ${rupiah(subtotal)}\nOngkir: ${rupiah(SHIPPING_COST)}\nTOTAL: ${rupiah(total)}\n\nNama: ${f.get("name")}\nNo. WhatsApp: ${f.get("phone")}\nAlamat: ${f.get("address")}\nCatatan: ${f.get("note")||"-"}\nPembayaran: ${f.get("payment")}`;
  window.open(waLink(msg),"_blank");
});
document.getElementById("year").textContent=new Date().getFullYear();
renderCategories();renderProducts();updateCartCount();renderCart();
