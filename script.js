// KALENSARI STORE
const WHATSAPP_NUMBER = "6281234567890";
const SHIPPING_COST = 0;
const DEFAULT_PRODUCTS = [{"id":1,"name":"Lotek Bongko","price":12000,"sale":8000,"category":"Makanan","unit":"1 porsi","seller":"Teh Ida","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/o-fvve-chatgpt%20image%20sep%2028%2C%202026%2C%2005_14_09%20am.png?versionId=sSlnWC5X3v6SfdE8SJ7kfFpkAAtYEG66"},{"id":2,"name":"Bakso Sapi Biasa","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/pf0do4-chatgpt%20image%20sep%2028%2C%202026%2C%2006_23_05%20am.png?versionId=LvDf81yvhC2OIgUPloRKlaBbRFi.9BuH"},{"id":3,"name":"MIe ayam Pedas","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"H. Diman, Mang Edo, Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/0qg0at-chatgpt%20image%20sep%2028%2C%202026%2C%2002_03_31%20pm.png?versionId=EH1aAjwRvQd3dMY93ItbAgINe5lzjnTw"},{"id":4,"name":"MIe ayam Biasa","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"H. Diman, Mang Edo, Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/m5q9je-chatgpt%20image%20sep%2028%2C%202026%2C%2002_02_42%20pm.png?versionId=Lci_mH9SOmBpD2nCjBV_Z_o_XXpxpW8v"},{"id":5,"name":"Bakso Tulang","price":25000,"sale":18000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Out of Stock","image":"https://cdn.store.link/products/kalensaristore80353/agx1iw-chatgpt%20image%20sep%2028%2C%202026%2C%2006_29_33%20am.png?versionId=1n1pJ2ilQgM4jrhR5X_0LEG9mB.lTmg8"},{"id":6,"name":"Bakso Telur","price":12000,"sale":10000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/8a69b3-chatgpt%20image%20sep%2028%2C%202026%2C%2006_34_03%20am.png?versionId=m_nc2BhsK7d4LdKAPdxnMAiRHAV.Q2qB"},{"id":7,"name":"Bakso Urat","price":18000,"sale":15000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/obbajp-chatgpt%20image%20sep%2028%2C%202026%2C%2006_36_33%20am.png?versionId=h_Evc0EcQtdz4PFbFk8aZey0jgRRXZ.p"},{"id":8,"name":"Jus Alpukat","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/3x8j0a-chatgpt%20image%20sep%2028%2C%202026%2C%2006_52_41%20am.png?versionId=eKLzC7y3fgCWrkTSAdcaLHEyEYAdZMsh"},{"id":9,"name":"Jus Buah Naga","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/p8vus5-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_02%20am.png?versionId=e6H7dwvYmMOZrI86QKN98dyVxHcc8V0M"},{"id":10,"name":"Jus Tomat","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/o4d1bt-chatgpt%20image%20sep%2028%2C%202026%2C%2007_20_47%20am.png?versionId=IbXRZdg2vp6bCuXJPch5YT7FgQZXXcRM"},{"id":11,"name":"Jus Mangga","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/lqk2sp-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_59%20am.png?versionId=FADsI7qbgepPpQt7XVGl901Q_3cKHFQW"},{"id":12,"name":"Es teh Manis","price":3000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/abqncl-hops-3260267377.webp?versionId=P4DG3eGis6QyEzh9ZFQm3CBF8p9DEJwx"},{"id":13,"name":"Es teh Matcha Late","price":6000,"sale":null,"category":"Minuman","unit":"1 cup besar Rasa Greentea","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/c9c6rx-images%20%281%29.jpg?versionId=K0P2vQjt8SpfWctljxkmCkUO_8AfkYf2"},{"id":14,"name":"Es teh Matcha Premium","price":15000,"sale":12000,"category":"Minuman","unit":"1 cup besar Rasa Greentea","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/bkv3a5-images.jpg?versionId=jKTeHTYDtwRD2qs6CWqYs9ZM2EBZ9emC"},{"id":15,"name":"Nasi Kebuli","price":25000,"sale":20000,"category":"Makanan","unit":"1 porsi","seller":"Teh iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/u4fafx-chatgpt%20image%20sep%2028%2C%202026%2C%2002_14_04%20pm.png?versionId=DHZD_c9LScH15.An7XpzcTJMrjDf0AJk"},{"id":16,"name":"Nasi Goreng","price":13000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Kang Diki Sueb","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/h38vn8-chatgpt%20image%20sep%2028%2C%202026%2C%2002_11_47%20pm.png?versionId=Q1UfoJozDqlb8kaNfjJqp6nKv74i_B3F"},{"id":17,"product_group":"Pecel Lele","variant":"Lauk saja","name":"Pecel Lele","price":15000,"sale":null,"category":"Makanan","unit":"Pecel Lele","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"},{"id":18,"product_group":"Pecel Lele","variant":"+ Nasi","name":"Pecel Lele + Nasi","price":20000,"sale":null,"category":"Makanan","unit":"Pecel Lele + Nasi","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"},{"id":19,"product_group":"Pecel Ayam","variant":"Lauk saja","name":"Pecel Ayam","price":20000,"sale":null,"category":"Makanan","unit":"Pecel Ayam","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"},{"id":20,"product_group":"Pecel Ayam","variant":"+ Nasi","name":"Pecel Ayam + Nasi","price":25000,"sale":null,"category":"Makanan","unit":"Pecel Ayam + Nasi","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"},{"id":21,"name":"Fried Chiken","price":10000,"sale":null,"category":"Makanan","unit":"Ayam Goreng Tepung","seller":"Warga Kalensari","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/q38c2x-chatgpt%20image%20sep%2028%2C%202026%2C%2002_23_43%20pm.png?versionId=RR2yA7Iutiz2jXiFwJNUzApiqzE7ItsL"},{"id":22,"name":"Soto Ayam","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Sate Madura","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/4io072-chatgpt%20image%20sep%2028%2C%202026%2C%2002_22_28%20pm.png?versionId=48IdG9bl9fPErJcNUzMeAPrvhzOOe_qr"},{"id":23,"name":"Sate Ayam","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Sate Madura","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ewpn71-chatgpt%20image%20sep%2028%2C%202026%2C%2002_18_51%20pm.png?versionId=X09ZJ.tPJyqr_LhYnZRngTpDFKIVqz0b"},{"id":24,"name":"Nasi Ayam Katsu","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Teh Iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ievcoz-chatgpt%20image%20sep%2028%2C%202026%2C%2002_17_10%20pm.png?versionId=buhfyErVz0r0y_eaESh2AooKeylFdopS"},{"id":25,"name":"Spageti","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Teh Iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/d62zqy-aa1408ce-c67d-4d63-aa67-12ec89b3c905.png?versionId=chUteSwuPamgkCgB_ORU_hnugVoqj8dW"}];

const ADMIN_PIN = "1234";
let products = JSON.parse(localStorage.getItem("kalensari_products") || "null") || DEFAULT_PRODUCTS.map(p=>({...p}));
let cloudReady = false;
const ORDER_STATUSES = ["menunggu","diproses","dikirim","selesai","dibatalkan"];
const saveProducts = () => localStorage.setItem("kalensari_products", JSON.stringify(products));
const getLocalOrders = () => { try { return JSON.parse(localStorage.getItem("kalensari_orders") || "[]"); } catch { return []; } };
const saveLocalOrders = rows => localStorage.setItem("kalensari_orders", JSON.stringify(rows));
const normalizePhone = v => String(v||"").replace(/[^0-9]/g, "").replace(/^0/, "62");
const makeOrderCode = () => `KS-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0,14)}-${Math.floor(100+Math.random()*900)}`;

const cloudHeaders = () => ({
  apikey: CLOUD_CONFIG?.supabaseAnonKey || "",
  Authorization: `Bearer ${CLOUD_CONFIG?.supabaseAnonKey || ""}`,
  "Content-Type": "application/json",
  Prefer: "return=representation"
});
async function cloudFetch(path, options={}) {
  if(!CLOUD_CONFIG?.enabled) throw new Error("Database online belum diaktifkan.");
  const base=String(CLOUD_CONFIG.supabaseUrl||"").replace(/\/$/,"");
  if(!base || !CLOUD_CONFIG.supabaseAnonKey) throw new Error("config.js belum berisi Supabase URL dan key.");
  const r=await fetch(`${base}/rest/v1/${path}`, {
    ...options, headers:{...cloudHeaders(), ...(options.headers||{})}
  });
  const text=await r.text();
  if(!r.ok) throw new Error(text || `HTTP ${r.status}`);
  return text?JSON.parse(text):[];
}

async function loadCloudProducts(){
  if(!CLOUD_CONFIG?.enabled) return false;
  try {
    const data=await cloudFetch("products?select=*&order=id.asc");
    const cloudRows=Array.isArray(data)?data:[];
    if(!cloudRows.length){
      await cloudFetch("products",{method:"POST",body:JSON.stringify(DEFAULT_PRODUCTS)});
      products=DEFAULT_PRODUCTS.map(p=>({...p}));
    } else {
      // Gabungkan produk cloud dengan 25 produk bawaan agar produk yang hilang kembali muncul.
      // Data yang sudah diedit di cloud tetap diprioritaskan.
      const byId=new Map(DEFAULT_PRODUCTS.map(p=>[Number(p.id),{...p}]));
      cloudRows.forEach(p=>byId.set(Number(p.id),{...byId.get(Number(p.id)),...p}));
      products=[...byId.values()].sort((a,b)=>Number(a.id)-Number(b.id));
      if(products.length>cloudRows.length) await syncCloudProducts();
    }
    saveProducts(); cloudReady=true; return true;
  } catch(e){
    console.error("Supabase products:",e);
    updateCloudStatus(`⚠️ Database produk gagal: ${String(e.message||e).slice(0,120)}`);
  }
  return false;
}
async function syncCloudProducts(){
  if(!CLOUD_CONFIG?.enabled) return false;
  // Sinkron aman: simpan/perbarui dulu (upsert), baru hapus produk yang sudah dihapus admin.
  const upsert={method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"}};
  try {
    const rows=products.map(p=>({...p,open_time:p.open_time??null,close_time:p.close_time??null,product_group:p.product_group??null,variant:p.variant??null}));
    // Jika kolom tambahan belum dibuat di Supabase, coba lagi tanpa kolom tersebut agar sinkron lain tidak rusak.
    const levels=[[],["product_group","variant"],["product_group","variant","open_time","close_time"]];
    let used=0;
    for(let L=0;L<levels.length;L++){
      const body=rows.map(r=>{const c={...r};levels[L].forEach(k=>delete c[k]);return c;});
      try { await cloudFetch("products?on_conflict=id",{...upsert,body:JSON.stringify(body)}); used=L; break; }
      catch(err) {
        const msg=String(err.message||err);
        if(L===levels.length-1||!/open_time|close_time|product_group|variant|schema cache|PGRST204/.test(msg)) throw err;
      }
    }
    const ids=products.map(p=>Number(p.id)).filter(Number.isFinite);
    const filter=ids.length?`id=not.in.(${ids.join(",")})`:"id=not.is.null";
    await cloudFetch(`products?${filter}`,{method:"DELETE"});
    cloudReady=true;
    updateCloudStatus(used===0?"☁️ Produk tersinkron online":used===1?"⚠️ Varian produk belum tersimpan online. Jalankan supabase-varian-produk.sql di Supabase.":"⚠️ Jam & varian belum tersimpan online. Jalankan supabase-jam-produk.sql dan supabase-varian-produk.sql di Supabase.");
    return true;
  } catch(e){
    console.error("Sinkron produk gagal:",e);
    updateCloudStatus(`⚠️ Gagal sinkron produk. Data lokal tetap tersimpan. Detail: ${String(e.message||e).slice(0,160)}`);
    return false;
  }
}
function updateCloudStatus(text){const el=document.getElementById("cloudStatus");if(el)el.textContent=text;}

async function saveCloudOrder(payload){
  if(!CLOUD_CONFIG?.enabled) return {ok:false,error:"Database online belum aktif."};
  try {
    const data=await cloudFetch("orders",{method:"POST",body:JSON.stringify(payload)});
    cloudReady=true; return {ok:true,data:Array.isArray(data)?data[0]:data};
  } catch(e){ console.error("Supabase orders gagal:",e); return {ok:false,error:String(e.message||e)}; }
}
async function loadCloudOrders(){
  if(!CLOUD_CONFIG?.enabled) return [];
  return await cloudFetch("orders?select=*&order=created_at.desc&limit=100");
}
async function loadMyCloudOrders(phone){
  if(!CLOUD_CONFIG?.enabled || !phone) return [];
  const raw=String(phone).trim();
  const normalized=normalizePhone(raw);
  const candidates=[raw,normalized].filter(Boolean);
  const all=[];
  // Utamakan kolom nomor yang sudah dinormalisasi agar HP/komputer
  // tetap menemukan pesanan walaupun satu perangkat menyimpan 08xx
  // dan perangkat lain memakai 62xx.
  if(normalized){
    try{
      const q=encodeURIComponent(normalized);
      const rows=await cloudFetch(`orders?select=*&customer_phone_normalized=eq.${q}&order=created_at.desc&limit=100`);
      if(Array.isArray(rows)) all.push(...rows);
    }catch(e){ /* fallback ke nomor lama */ }
  }
  for(const value of [...new Set(candidates)]){
    try{
      const q=encodeURIComponent(value);
      const rows=await cloudFetch(`orders?select=*&customer_phone=eq.${q}&order=created_at.desc&limit=100`);
      if(Array.isArray(rows)) all.push(...rows);
    }catch(e){ /* coba format nomor berikutnya */ }
  }
  return [...new Map(all.map(o=>[o.order_code||o.id,o])).values()].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
}
async function updateCloudOrderStatus(id,status){
  if(!CLOUD_CONFIG?.enabled) return {ok:false,error:"Database online belum aktif."};
  try { const data=await cloudFetch(`orders?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify({status,updated_at:new Date().toISOString()})}); return {ok:true,data}; }
  catch(e){ console.error("Update status gagal:",e); return {ok:false,error:String(e.message||e)}; }
}



let cart = JSON.parse(localStorage.getItem("kalensari_cart") || "[]");
let activeCategory = "Semua";

const rupiah = n => "Rp" + new Intl.NumberFormat("id-ID").format(n);
const saveCart = () => localStorage.setItem("kalensari_cart", JSON.stringify(cart));
const waLink = message => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
const currentPrice = p => p.sale || p.price;

function priceHTML(p) {
  return p.sale ? `<span class="old-price">${rupiah(p.price)}</span>${rupiah(p.sale)}` : rupiah(p.price);
}
// ===== JAM TERSEDIA PRODUK (diatur dari Admin, waktu WIB) =====
const STORE_TIME_ZONE="Asia/Jakarta";
function nowMinutesWIB(){
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:STORE_TIME_ZONE,hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
  const h=Number(parts.find(x=>x.type==="hour").value)%24, m=Number(parts.find(x=>x.type==="minute").value);
  return h*60+m;
}
const timeToMin=t=>{const m=/^(\d{1,2}):(\d{2})/.exec(String(t||""));return m?Number(m[1])*60+Number(m[2]):null};
const hasHours=p=>timeToMin(p.open_time)!==null&&timeToMin(p.close_time)!==null;
function isInHours(p){
  if(!hasHours(p))return true; // tanpa jam = tersedia sepanjang hari
  const o=timeToMin(p.open_time),c=timeToMin(p.close_time),n=nowMinutesWIB();
  if(o===c)return true;
  return o<c?(n>=o&&n<c):(n>=o||n<c); // mendukung jam lewat tengah malam, mis. 18.00 - 02.00
}
const fmtTime=t=>String(t).slice(0,5).replace(":",".");
const hoursText=p=>hasHours(p)?`${fmtTime(p.open_time)} – ${fmtTime(p.close_time)} WIB`:"";
const closedCartItems=()=>cartData().filter(p=>!isInHours(p));
function alertClosedItems(list){
  alert("Produk berikut sedang di luar jam tersedia:\n\n"+list.map(p=>`- ${p.name} (jam ${hoursText(p)})`).join("\n")+"\n\nHapus dari keranjang atau pesan lagi saat jam tersedia.");
}

function renderCategories() {
  const cats=["Semua",...new Set(products.map(p=>p.category))];
  document.getElementById("categories").innerHTML=cats.map(c=>`<button class="cat ${c===activeCategory?"active":""}" onclick="setCategory('${c}')">${c}</button>`).join("");
}
function setCategory(c) {
  activeCategory=c; renderCategories(); renderProducts();
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
// ===== VARIAN PRODUK: produk dengan "Nama Grup" sama digabung jadi 1 kartu =====
const groupName=p=>String(p.product_group||"").trim();
const variantLabel=p=>String(p.variant||"").trim()||p.name;
function singleCardHTML(p) {
  return `
   <article class="product">
  <div class="product-img"><img src="${getProductImage(p.image)}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='🖼️'">
        ${p.sale?'<span class="sale-badge">PROMO</span>':''}
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <div class="price">${priceHTML(p)}</div>
        <small>${p.unit}</small><small class="seller">👤 ${p.seller}</small>${hasHours(p)?`<small class="hours${isInHours(p)?"":" closed"}">🕒 ${hoursText(p)}${isInHours(p)?"":" • Belum tersedia"}</small>`:""}
        <div class="product-actions">
          <button class="btn outline" onclick="showProduct(${p.id})">Detail</button>
          <button class="btn primary" ${isInHours(p)?"":"disabled"} onclick="addToCart(${p.id})">+ Keranjang</button>
        </div>
      </div>
    </article>`;
}
function groupCardHTML(u) {
  const v=u.variants, first=v[0], prices=v.map(currentPrice), min=Math.min(...prices), max=Math.max(...prices);
  const sellers=[...new Set(v.flatMap(sellerList))].join(", ");
  return `
   <article class="product">
  <div class="product-img"><img src="${getProductImage(first.image)}" alt="${esc(u.group)}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='🖼️'">
        ${v.some(x=>x.sale)?'<span class="sale-badge">PROMO</span>':''}
      </div>
      <div class="product-body">
        <h3>${esc(u.group)}</h3>
        <div class="price">${min===max?rupiah(min):`Mulai ${rupiah(min)}`}</div>
        <small>${v.length} pilihan varian</small><small class="seller">👤 ${esc(sellers)}</small>
        <div class="product-actions">
          <button class="btn outline" onclick="showProduct(${first.id})">Detail</button>
          <button class="btn primary" onclick="showProduct(${first.id})">Pilih Varian</button>
        </div>
      </div>
    </article>`;
}
function renderProducts() {
  const q=document.getElementById("searchInput").value.toLowerCase().trim();
  const sort=document.getElementById("sortSelect").value;
  let list=products.filter(p=>p.status==="Show" && (activeCategory==="Semua"||p.category===activeCategory) && (p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)||p.seller.toLowerCase().includes(q)||groupName(p).toLowerCase().includes(q)));
  if(sort==="priceAsc" || sort==="price-low") list.sort((a,b)=>currentPrice(a)-currentPrice(b));
  if(sort==="priceDesc" || sort==="price-high") list.sort((a,b)=>currentPrice(b)-currentPrice(a));
  if(sort==="name") list.sort((a,b)=>a.name.localeCompare(b.name,"id"));
  // Gabungkan varian: kartu muncul di posisi produk pertama dari grupnya.
  const units=[], seen=new Map();
  list.forEach(p=>{
    const g=groupName(p);
    if(!g){units.push({single:p});return;}
    const key=g.toLowerCase();
    if(seen.has(key)){seen.get(key).variants.push(p);}
    else{const u={group:g,variants:[p]};seen.set(key,u);units.push(u);}
  });
  document.getElementById("resultInfo").textContent=`${units.length} produk`;
  document.getElementById("productGrid").innerHTML=units.length?units.map(u=>u.single?singleCardHTML(u.single):(u.variants.length>1?groupCardHTML(u):singleCardHTML(u.variants[0]))).join(""):`<div class="empty-state"><b>😔 Produk tidak ditemukan</b>Coba kata kunci atau kategori lain.</div>`;
}
// Pilihan jumlah (pcs) dan nama toko/penjual di popup Detail produk.
let detailQty=1, detailSeller="", detailSellers=[];
const sellerList = p => String(p.seller||"").split(",").map(x=>x.trim()).filter(Boolean);
function changeDetailQty(id,d) {
  detailQty=Math.max(1,Math.min(99,detailQty+d));
  document.getElementById("detailQtyValue").textContent=detailQty;
}
function selectDetailSeller(i) {
  detailSeller=detailSellers[i]||"";
  document.querySelectorAll("#sellerPicker .seller-chip").forEach((el,n)=>el.classList.toggle("active",n===i));
  document.getElementById("sellerPicker")?.classList.remove("need");
}
function addDetailToCart(id) {
  if(!detailSeller){
    document.getElementById("sellerPicker")?.classList.add("need");
    showToast("Pilih nama toko dulu");return;
  }
  addToCart(id,detailQty,detailSeller);closeModal("productModal");
}
function showProduct(id) {
  const p=products.find(x=>x.id===id);
  detailQty=1;detailSellers=sellerList(p);detailSeller=detailSellers.length===1?detailSellers[0]:"";
  const gname=groupName(p);
  const variants=gname?products.filter(x=>x.status==="Show"&&groupName(x).toLowerCase()===gname.toLowerCase()):[];
  const isGroup=variants.length>1;
  const sold=p.status!=="Show", closedNow=!sold&&!isInHours(p), unavailable=sold||closedNow;
  document.getElementById("productDetail").innerHTML=`
    <div class="detail">
      <div class="detail-img"><img src="${getProductImage(p.image)}" alt="${p.name}" onerror="this.style.display='none'"></div>
      <div>
        <p class="eyebrow">${p.category} • ${p.seller}</p>
        <h2>${isGroup?esc(gname):p.name}</h2>
        ${isGroup?`<div class="variant-pick"><span class="seller-pick-title">Pilih Varian</span><div class="variant-picker">${variants.map(v=>`<button type="button" class="variant-chip${v.id===p.id?" active":""}" onclick="showProduct(${v.id})"><b>${esc(variantLabel(v))}</b><small>${rupiah(currentPrice(v))}</small></button>`).join("")}</div></div>`:""}
        <div class="price">${priceHTML(p)}</div>
        <p>Satuan: ${p.unit}</p>
        <p>${sold?"Stok habis.":closedNow?"Saat ini di luar jam tersedia.":"Produk tersedia untuk dipesan."}</p>
        ${hasHours(p)?`<p class="hours-line${closedNow?" closed":""}">🕒 Tersedia setiap hari pukul ${hoursText(p)}</p>`:""}
        ${unavailable?"":`<div class="seller-pick"><span class="seller-pick-title">Pilih Toko</span><div id="sellerPicker" class="seller-picker">${detailSellers.map((n,i)=>`<button type="button" class="seller-chip${detailSeller===n?" active":""}" onclick="selectDetailSeller(${i})">🏪 ${esc(n)}</button>`).join("")}</div></div>
        <div class="detail-qty"><span>Jumlah</span><div class="qty"><button type="button" onclick="changeDetailQty(${p.id},-1)" aria-label="Kurangi jumlah">−</button><b id="detailQtyValue">1</b><button type="button" onclick="changeDetailQty(${p.id},1)" aria-label="Tambah jumlah">+</button></div></div>`}
        <button class="btn primary full" ${unavailable?"disabled":""} onclick="addDetailToCart(${p.id})">🛒 Tambah ke Keranjang</button>
      </div>
    </div>`;
  openModal("productModal");
}
function addToCart(id,qty=1,seller) {
  const p=products.find(x=>x.id===id); if(!p||p.status!=="Show")return;
  if(!isInHours(p)){showToast(`${p.name} tersedia pukul ${hoursText(p)}`);return;}
  if(seller===undefined){
    // Produk dengan lebih dari satu toko: minta pelanggan memilih toko di popup Detail.
    const list=sellerList(p);
    if(list.length>1){showProduct(id);showToast("Pilih nama toko dulu");return;}
    seller=list[0]||p.seller||"";
  }
  qty=Math.max(1,parseInt(qty)||1);
  const item=cart.find(x=>x.id===id&&(x.seller||"")===seller); if(item)item.qty+=qty; else cart.push({id,qty,seller});
  saveCart();updateCartCount();renderCart();showToast(`${qty>1?qty+"× ":""}${p.name} (${seller}) ditambahkan ke keranjang`);
}
function changeQty(idx,d) {
  const item=cart[idx];if(!item)return;
  item.qty+=d;if(item.qty<=0)cart.splice(idx,1);
  saveCart();updateCartCount();renderCart();
}
// Hapus satu produk dari keranjang (tombol tong sampah di sebelah kanan produk).
function removeFromCart(idx) {
  const item=cart[idx];if(!item)return;
  const p=products.find(x=>x.id===item.id);
  cart.splice(idx,1);
  saveCart();updateCartCount();renderCart();
  showToast(`🗑️ ${p?p.name:"Produk"} dihapus dari keranjang`);
}
function cartData() {return cart.map((i,idx)=>{const p=products.find(x=>x.id===i.id);return p?{...p,qty:i.qty,seller:i.seller||p.seller,idx}:null}).filter(Boolean);}
function renderCart() {
  const items=cartData(),subtotal=items.reduce((s,p)=>s+currentPrice(p)*p.qty,0),shipping=items.length?SHIPPING_COST:0;
  document.getElementById("cartItems").innerHTML=items.length?items.map(p=>`
    <div class="cart-row"><div class="cart-info"><div class="cart-name">${p.name}</div><div class="cart-price">${rupiah(currentPrice(p))} × ${p.qty}</div><div class="cart-seller">🏪 ${esc(p.seller)}</div></div>
    <div class="qty"><button onclick="changeQty(${p.idx},-1)">−</button><b>${p.qty}</b><button onclick="changeQty(${p.idx},1)">+</button></div>
    <button class="cart-remove" type="button" title="Hapus produk" aria-label="Hapus ${p.name} dari keranjang" onclick="removeFromCart(${p.idx})">🗑️</button></div>`).join(""):`<div class="empty-state"><b>🛒 Keranjang masih kosong</b>Yuk pilih makanan atau minuman favoritmu.</div>`;
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
// Tombol Kosongkan Keranjang: hapus seluruh isi keranjang dan simpan ke localStorage.
document.getElementById("clearCartBtn").onclick=()=>{
  if(!cart.length){showToast("🛒 Keranjang sudah kosong");return;}
  if(!confirm("Kosongkan semua isi keranjang?")) return;
  cart=[];
  saveCart();
  updateCartCount();
  renderCart();
  showToast("🗑️ Keranjang berhasil dikosongkan");
};
document.getElementById("checkoutBtn").onclick=()=>{const closed=closedCartItems();if(closed.length){alertClosedItems(closed);return;}if(cart.length){closeModal("cartModal");openModal("checkoutModal")}};
// Pencarian produk tidak boleh terisi otomatis dari nomor WhatsApp/autofill pelanggan.
const productSearchInput=document.getElementById("searchInput");
if(productSearchInput){
  // Pencarian produk TIDAK BOLEH diisi browser/autofill dari nomor WhatsApp.
  productSearchInput.setAttribute("autocomplete","new-password");
  productSearchInput.setAttribute("autocorrect","off");
  productSearchInput.setAttribute("autocapitalize","none");
  productSearchInput.setAttribute("spellcheck","false");
  productSearchInput.readOnly=true;

  const resetProductSearch=()=>{
    productSearchInput.value="";
    productSearchInput.readOnly=true;
    renderProducts();
  };

  // Aktif hanya setelah pengguna benar-benar memilih/mengetik kolom pencarian.
  const activateProductSearch=()=>{
    productSearchInput.readOnly=false;
    if(/^(?:\+?62|0)\d{8,14}$/.test(String(productSearchInput.value||"").replace(/[\s-]/g,""))){
      productSearchInput.value="";
    }
  };
  productSearchInput.addEventListener("pointerdown",activateProductSearch,{once:true});
  productSearchInput.addEventListener("focus",activateProductSearch);
  productSearchInput.addEventListener("input",renderProducts);

  // Chrome dapat melakukan autofill beberapa saat setelah halaman selesai dimuat.
  // Paksa kolom pencarian tetap kosong saat refresh / kembali ke halaman.
  resetProductSearch();
  setTimeout(resetProductSearch,100);
  setTimeout(resetProductSearch,500);
  setTimeout(resetProductSearch,1200);
  window.addEventListener("pageshow",resetProductSearch);
}

document.getElementById("sortSelect").addEventListener("change",renderProducts);
document.getElementById("clearSearch").addEventListener("click",()=>{document.getElementById("searchInput").value="";renderProducts();document.getElementById("searchInput").focus()});
function showToast(message){const t=document.getElementById("toast");t.textContent=message;t.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.remove("show"),1800)}
document.getElementById("waGeneral").href=waLink("Halo KALENSARI STORE, saya ingin bertanya tentang produk.");
document.getElementById("checkoutForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!cart.length)return;
  {const closed=closedCartItems();if(closed.length){alertClosedItems(closed);return;}}
  const f=new FormData(e.target),items=cartData().map(({idx,...r})=>r),subtotal=items.reduce((s,p)=>s+currentPrice(p)*p.qty,0),total=subtotal+SHIPPING_COST;
  const phone=String(f.get("phone")||"").trim();
  const orderCode=makeOrderCode();
  const createdAt=new Date().toISOString();
  const detail=items.map(p=>`- ${p.name} (Toko: ${p.seller}) x${p.qty} = ${rupiah(currentPrice(p)*p.qty)}`).join("\n");
  const msg=`Halo KALENSARI STORE, saya ingin memesan:\n\nKode Pesanan: ${orderCode}\n\n${detail}\n\nSubtotal: ${rupiah(subtotal)}\nOngkir: ${rupiah(SHIPPING_COST)}\nTOTAL: ${rupiah(total)}\n\nNama: ${f.get("name")}\nNo. WhatsApp: ${phone}\nAlamat: ${f.get("address")}\nCatatan: ${f.get("note")||"-"}\nPembayaran: ${f.get("payment")}`;
  const payload={order_code:orderCode,created_at:createdAt,customer_name:String(f.get("name")||""),customer_phone:phone,customer_phone_normalized:normalizePhone(phone),address:String(f.get("address")||""),note:String(f.get("note")||""),payment:String(f.get("payment")||""),items,subtotal,shipping:SHIPPING_COST,total,status:"menunggu"};

  // Simpan lokal terlebih dahulu agar Pesanan Saya langsung berisi pesanan.
  const local=getLocalOrders(); local.unshift({...payload,id:`local-${Date.now()}`}); saveLocalOrders(local);
  localStorage.setItem("kalensari_customer_phone",phone);

  const result=await saveCloudOrder(payload);
  if(!result.ok){
    // Pesanan tetap ada di Pesanan Saya, tetapi diberi tanda belum tersinkron.
    const rows=getLocalOrders().map(o=>o.order_code===orderCode?{...o,sync_error:result.error}:o); saveLocalOrders(rows);
    renderMyOrders();
    alert(`Pesanan tersimpan di perangkat, tetapi BELUM masuk database online.\n\nDetail: ${result.error}\n\nJalankan supabase.sql lalu pastikan RLS orders mengizinkan INSERT.`);
    showToast("⚠️ Pesanan tersimpan lokal; database gagal.");
    return;
  }
  // Ganti salinan lokal dengan data server jika tersedia.
  const saved=result.data||payload;
  const merged=getLocalOrders().map(o=>o.order_code===orderCode?{...o,...saved,sync_error:null}:o); saveLocalOrders(merged);
  renderMyOrders();
  window.open(waLink(msg),"_blank");
  cart=[];saveCart();updateCartCount();renderCart();closeModal("checkoutModal");
  showToast("✅ Pesanan tersimpan dan dikirim."); e.target.reset();
});

document.getElementById("year").textContent=new Date().getFullYear();
renderCategories();renderProducts();updateCartCount();renderCart();
(async()=>{ if(CLOUD_CONFIG?.enabled){ updateCloudStatus("☁️ Menghubungkan ke database..."); const ok=await loadCloudProducts(); if(ok){renderCategories();renderProducts();updateCloudStatus("☁️ Produk tersinkron online");} else updateCloudStatus("⚠️ Cloud belum tersambung. Periksa config.js dan SQL Supabase."); } })();

// ===== ADMIN DASHBOARD V6 =====
let adminLoggedIn = false;
function openAdmin(){
  document.getElementById("adminPin").value="";
  document.getElementById("adminLogin").hidden=adminLoggedIn;
  document.getElementById("adminPanel").hidden=!adminLoggedIn;
  if(adminLoggedIn) renderAdminProducts();
  openModal("adminModal");
}
function renderAdminProducts(){
  const box=document.getElementById("adminProductList");
  box.innerHTML=products.map((p,i)=>`
    <div class="admin-product">
      <img src="${p.image||''}" alt="${p.name}" onerror="this.style.display='none'">
      <div class="admin-product-info"><h4>${p.name} <span class="admin-status ${p.status!=="Show"?'off':''}">${p.status}</span></h4><small>${p.category} • ${rupiah(currentPrice(p))} • ${p.seller}${hasHours(p)?` • 🕒 ${hoursText(p)}`:""}${groupName(p)?` • 🧩 ${esc(groupName(p))} › ${esc(variantLabel(p))}`:""}</small></div>
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
    <label>Nama Grup (opsional)<input id="e-group-${i}" value="${esc(p.product_group||'')}" placeholder="mis. Pecel Lele"></label>
    <label>Nama Varian (opsional)<input id="e-variant-${i}" value="${esc(p.variant||'')}" placeholder="mis. Lauk saja / + Nasi"></label>
    <p class="wide admin-hint">🧩 Produk dengan Nama Grup yang sama digabung jadi 1 kartu dengan pilihan varian. Kosongkan jika tidak ingin digabung.</p>
    <label>Tersedia dari jam<input id="e-open-${i}" type="time" value="${esc(p.open_time||'')}"></label>
    <label>Sampai jam<input id="e-close-${i}" type="time" value="${esc(p.close_time||'')}"></label>
    <p class="wide admin-hint">🕒 Waktu WIB. Kosongkan kedua kolom jika produk tersedia sepanjang hari. Di luar jam ini pelanggan tidak bisa memesan.</p>
    <label class="wide">URL Foto<input id="e-image-${i}" value="${esc(p.image||'')}"></label>
    <div class="admin-edit-actions"><button class="btn primary" onclick="saveAdminProduct(${i})">💾 Simpan</button><button class="btn outline" onclick="renderAdminProducts()">Batal</button></div>`;
}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function saveAdminProduct(i){
  const openT=document.getElementById(`e-open-${i}`).value, closeT=document.getElementById(`e-close-${i}`).value;
  if(!!openT!==!!closeT){showToast("Isi jam mulai DAN jam selesai, atau kosongkan keduanya");return;}
  const p=products[i]; p.open_time=openT||null; p.close_time=closeT||null; p.product_group=document.getElementById(`e-group-${i}`).value.trim()||null; p.variant=document.getElementById(`e-variant-${i}`).value.trim()||null; p.name=document.getElementById(`e-name-${i}`).value.trim(); p.category=document.getElementById(`e-cat-${i}`).value; p.price=Number(document.getElementById(`e-price-${i}`).value)||0; const sale=Number(document.getElementById(`e-sale-${i}`).value); p.sale=sale>0?sale:null; p.seller=document.getElementById(`e-seller-${i}`).value.trim(); p.unit=document.getElementById(`e-unit-${i}`).value.trim(); p.image=document.getElementById(`e-image-${i}`).value.trim(); saveProducts(); syncCloudProducts(); renderProducts(); renderCategories(); renderAdminProducts(); showToast("Produk berhasil diperbarui");
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


function statusLabel(s){return ({menunggu:"Menunggu",baru:"Menunggu",diproses:"Diproses",dikirim:"Dikirim",selesai:"Selesai",dibatalkan:"Dibatalkan"}[s]||s||"Menunggu");}
function statusSteps(status){
  const order=["menunggu","diproses","dikirim","selesai"]; const idx=order.indexOf(status);
  return `<div class="order-timeline">${order.map((x,i)=>`<div class="order-step ${status==='dibatalkan'?'cancelled':i<idx?'done':i===idx?'current':''}"><div class="dot">${i<idx?'✓':i===idx?'•':'○'}</div>${statusLabel(x)}</div>`).join("")}</div>`;
}
function renderMyOrders(rows=getLocalOrders()){
  const box=document.getElementById("myOrderList"), count=document.getElementById("myOrderCount"); if(!box)return;
  const sorted=[...rows].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
  if(count)count.textContent=`${sorted.length} pesanan`;
  box.innerHTML=sorted.length?sorted.map(o=>`<div class="my-order-card">
    <div class="my-order-head"><div><b>${esc(o.order_code||"Pesanan")}</b><small>${new Date(o.created_at||Date.now()).toLocaleString("id-ID")}</small></div><span class="order-status ${o.status==='dibatalkan'?'status-dibatalkan':''}">${statusLabel(o.status)}</span></div>
    ${statusSteps(o.status)}
    <p><b>${esc(o.customer_name||"")}</b> • ${esc(o.customer_phone||"")}</p>
    <p>${(o.items||[]).map(x=>`${esc(x.name)}${x.seller?` (${esc(x.seller)})`:""} ×${x.qty}`).join(" • ")}</p>
    <strong>${rupiah(o.total||0)}</strong>
    ${o.sync_error?`<div class="order-hint">⚠️ Belum tersinkron ke database: ${esc(o.sync_error)}</div>`:""}
    ${o.updated_at?`<div class="order-updated">Diperbarui: ${new Date(o.updated_at).toLocaleString("id-ID")}</div>`:""}
  </div>`).join(""):'<div class="empty-state"><b>📦 Belum ada pesanan</b>Pesanan yang Anda buat akan muncul di sini.</div>';
}
async function refreshMyOrders(){
  const note=document.getElementById("myOrderSyncNote");
  const local=getLocalOrders();
  renderMyOrders(local);
  let phone=normalizePhone(localStorage.getItem("kalensari_customer_phone")||"");
  // Coba mengambil nomor dari pesanan lokal lama.
  if(!phone && local.length){
    const last=local.find(o=>o.customer_phone||o.customer_phone_normalized);
    phone=normalizePhone(last?.customer_phone_normalized||last?.customer_phone||"");
    if(phone) localStorage.setItem("kalensari_customer_phone",phone);
  }
  const input=document.getElementById("customerOrderPhone");
  const identity=document.getElementById("customerOrderIdentity");
  if(input && phone && !input.value) input.value=phone;
  if(!CLOUD_CONFIG?.enabled){
    if(identity) identity.hidden=true;
    if(note){note.textContent="📱 Menampilkan pesanan di perangkat ini.";note.className="order-sync-note offline";}
    return;
  }
  if(!phone){
    if(identity) identity.hidden=false;
    if(note){note.textContent="🔎 Masukkan nomor WhatsApp yang dipakai saat checkout agar Pesanan Saya sama di HP dan komputer.";note.className="order-sync-note offline";}
    return;
  }
  if(identity) identity.hidden=true;
  try {
    const remote=await loadMyCloudOrders(phone);
    const map=new Map(local.map(o=>[o.order_code||o.id,o]));
    remote.forEach(o=>map.set(o.order_code||o.id,{...map.get(o.order_code||o.id),...o,sync_error:null}));
    const rows=[...map.values()].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
    saveLocalOrders(rows);
    renderMyOrders(rows);
    if(note){note.textContent=remote.length?`☁️ ${remote.length} pesanan tersinkron dari database online.`:"☁️ Belum ada pesanan online untuk nomor ini.";note.className="order-sync-note cloud";}
  } catch(e){
    if(note){note.textContent=`⚠️ Database belum bisa dibaca: ${String(e.message||e).slice(0,140)}`;note.className="order-sync-note offline";}
  }
}

async function renderAdminOrders(){
  const box=document.getElementById("adminOrderList"); if(!box)return;
  if(!CLOUD_CONFIG?.enabled){box.innerHTML='<div class="empty-state">☁️ Aktifkan database online untuk mengelola pesanan.</div>';return;}
  box.innerHTML='<div class="empty-state">Memuat pesanan...</div>';
  try{
    const rows=await loadCloudOrders();
    const counts={menunggu:0,diproses:0,dikirim:0,selesai:0}; rows.forEach(o=>{const s=o.status==='baru'?'menunggu':o.status;if(counts[s]!==undefined)counts[s]++;});
    document.getElementById("statMenunggu").textContent=counts.menunggu;document.getElementById("statDiproses").textContent=counts.diproses;document.getElementById("statDikirim").textContent=counts.dikirim;document.getElementById("statSelesai").textContent=counts.selesai;
    box.innerHTML=rows.length?rows.map(o=>`<div class="admin-order">
      <div class="admin-order-top"><b>${esc(o.order_code||"Pesanan")}</b><span class="order-status">${statusLabel(o.status)}</span></div>
      <small>${new Date(o.created_at||Date.now()).toLocaleString("id-ID")}</small><b>${esc(o.customer_name||"Pelanggan")}</b><span>📱 ${esc(o.customer_phone||"")}</span>
      <p>${(o.items||[]).map(x=>`${esc(x.name)}${x.seller?` (${esc(x.seller)})`:""} ×${x.qty}`).join(" • ")}</p><strong>${rupiah(o.total||0)}</strong>
      <label>Status <select class="admin-order-status-select" onchange="changeOrderStatus('${esc(o.id)}',this.value)">${ORDER_STATUSES.map(s=>`<option value="${s}" ${(o.status==='baru'?"menunggu":o.status)===s?'selected':''}>${statusLabel(s)}</option>`).join("")}</select></label>
      <a class="btn outline" target="_blank" href="${waLink(`Halo ${o.customer_name||"Pelanggan"}, terkait pesanan ${o.order_code||"KALENSARI STORE"}.`)}">💬 WhatsApp</a>
    </div>`).join(""):'<div class="empty-state">Belum ada pesanan online.</div>';
  }catch(e){console.error(e);box.innerHTML=`<div class="empty-state">❌ Pesanan tidak bisa dimuat.<br><small>${esc(e.message||e)}</small></div>`;}
}
async function changeOrderStatus(id,status){
  const result=await updateCloudOrderStatus(id,status);
  if(!result.ok){alert("Status belum tersimpan.\n\n"+result.error);return;}
  // Perbarui salinan lokal jika order tersebut ada di perangkat ini.
  const rows=getLocalOrders().map(o=>String(o.id)===String(id)||o.order_code===result?.data?.[0]?.order_code?{...o,status,updated_at:new Date().toISOString()}:o);saveLocalOrders(rows);
  showToast("✅ Status pesanan diperbarui"); renderAdminOrders(); refreshMyOrders();
}
document.getElementById("myOrdersBtn")?.addEventListener("click",()=>{renderMyOrders();openModal("myOrdersModal");refreshMyOrders();});
document.getElementById("refreshMyOrdersBtn")?.addEventListener("click",refreshMyOrders);
document.getElementById("saveCustomerPhoneBtn")?.addEventListener("click",()=>{
  const input=document.getElementById("customerOrderPhone");
  const phone=normalizePhone(input?.value||"");
  if(!phone || phone.length<10){ alert("Masukkan nomor WhatsApp yang benar. Contoh: 082114541041"); return; }
  localStorage.setItem("kalensari_customer_phone",phone);
  refreshMyOrders();
});

document.getElementById("manageOrdersBtn")?.addEventListener("click",()=>{closeModal("adminModal");openModal("adminOrdersModal");renderAdminOrders();});
document.getElementById("refreshOrdersBtn")?.addEventListener("click",renderAdminOrders);
const __openAdmin=openAdmin; openAdmin=function(){__openAdmin();};

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

/* =========================================================
   KALENSARI STORE v10.6 - FIX PENCARIAN CEPAT
   Tombol "Cari Produk" pojok kanan bawah sekarang aktif.
   ========================================================= */
(function initKalensariQuickSearch(){
  function setup(){
    const floatBtn = document.getElementById('searchFloat');
    const panel = document.getElementById('quickSearchPanel');
    const input = document.getElementById('quickSearchInput');
    const clearBtn = document.getElementById('quickSearchClear');
    const result = document.getElementById('quickSearchResult');
    const mainInput = document.getElementById('searchInput');

    if(!floatBtn || !panel || !input || !result) return false;
    input.readOnly=true;
    input.value='';
    if(floatBtn.dataset.kalensariSearchReady === '1') return true;
    floatBtn.dataset.kalensariSearchReady = '1';

    const clean = value => String(value ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    const normalize = value => String(value || '').toLowerCase().trim();

    function openPanel(){
      panel.classList.add('show');
      panel.setAttribute('aria-hidden','false');
      floatBtn.setAttribute('aria-expanded','true');
      floatBtn.classList.add('active');
      input.readOnly=false;
      input.value='';
      input.focus();
    }

    function closePanel(){
      panel.classList.remove('show');
      panel.setAttribute('aria-hidden','true');
      floatBtn.setAttribute('aria-expanded','false');
      floatBtn.classList.remove('active');
      input.value='';
      result.innerHTML='Ketik nama produk untuk mencari.';
    }

    function getMatches(keyword){
      const q=normalize(keyword);
      const source=(typeof products!=='undefined' && Array.isArray(products)) ? products : [];
      if(!q) return [];
      return source.filter(p=>p && p.status==='Show').filter(p=>{
        const text=[p.name,p.category,p.seller].map(normalize).join(' ');
        return text.includes(q);
      }).slice(0,8);
    }

    function renderQuickResults(keyword){
      const q=normalize(keyword);
      if(!q){
        result.innerHTML='Ketik nama produk untuk mencari.';
        return;
      }

      const matches=getMatches(q);
      if(!matches.length){
        result.innerHTML=`<div class="quick-search-empty">Produk <b>“${clean(keyword)}”</b> tidak ditemukan.</div>`;
        return;
      }

      result.innerHTML=matches.map(p=>`
        <button type="button" class="quick-search-item" data-product-id="${Number(p.id)}">
          <span class="quick-search-item-name">${clean(p.name)}</span>
          <span class="quick-search-item-price">${typeof currentPrice==='function' && typeof rupiah==='function' ? rupiah(currentPrice(p)) : ''}</span>
        </button>
      `).join('');
    }

    floatBtn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      panel.classList.contains('show') ? closePanel() : openPanel();
    });

    input.addEventListener('input',()=>renderQuickResults(input.value));

    input.addEventListener('keydown',e=>{
      if(e.key==='Escape'){
        e.preventDefault();
        closePanel();
      } else if(e.key==='Enter'){
        const first=result.querySelector('[data-product-id]');
        if(first) first.click();
      }
    });

    result.addEventListener('click',e=>{
      const item=e.target.closest('[data-product-id]');
      if(!item) return;
      const id=Number(item.dataset.productId);
      const source=(typeof products!=='undefined' && Array.isArray(products)) ? products : [];
      const product=source.find(p=>Number(p.id)===id);

      if(product && mainInput){
        mainInput.value=product.name;
        if(typeof renderProducts==='function') renderProducts();
        setTimeout(()=>{
          const card=Array.from(document.querySelectorAll('#productGrid .product')).find(el=>
            el.querySelector('h3')?.textContent.trim()===product.name
          );
          if(card){
            card.scrollIntoView({behavior:'smooth',block:'center'});
            card.style.outline='3px solid rgba(122,62,32,.35)';
            setTimeout(()=>{card.style.outline='';},1800);
          } else {
            document.getElementById('products')?.scrollIntoView({behavior:'smooth',block:'start'});
          }
        },50);
      }
      closePanel();
    });

    clearBtn?.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      closePanel();
    });

    document.addEventListener('click',e=>{
      if(!panel.contains(e.target) && !floatBtn.contains(e.target)) closePanel();
    });

    return true;
  }

  if(!setup()){
    document.addEventListener('DOMContentLoaded',setup,{once:true});
    window.addEventListener('load',setup,{once:true});
  }
})();

// Perbarui status jam tersedia di daftar produk setiap 1 menit.
setInterval(()=>{ if(products.some(hasHours)) renderProducts(); },60000);
