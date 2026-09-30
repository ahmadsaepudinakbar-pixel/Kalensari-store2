// KALENSARI STORE
let WHATSAPP_NUMBER = "6281234567890"; // nomor bawaan; bisa diubah dari Admin > Ongkir
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
  const EXTRA=["open_time","close_time","product_group","variant","toppings","topping_limit"];
  try {
    const rows=products.map(p=>{const r={...p};EXTRA.forEach(k=>{r[k]=p[k]??null;});return r;});
    // Jika ada kolom tambahan yang belum dibuat di Supabase, simpan tanpa kolom itu saja agar sinkron lain tidak rusak.
    const missing=new Set();
    for(let tries=0;tries<=EXTRA.length;tries++){
      const body=rows.map(r=>{const c={...r};missing.forEach(k=>delete c[k]);return c;});
      try { await cloudFetch("products?on_conflict=id",{...upsert,body:JSON.stringify(body)}); break; }
      catch(err) {
        const m=/Could not find the '(\w+)' column/.exec(String(err.message||err));
        if(!m||!EXTRA.includes(m[1])||missing.has(m[1])) throw err;
        missing.add(m[1]);
      }
    }
    const ids=products.map(p=>Number(p.id)).filter(Number.isFinite);
    const filter=ids.length?`id=not.in.(${ids.join(",")})`:"id=not.is.null";
    await cloudFetch(`products?${filter}`,{method:"DELETE"});
    cloudReady=true;
    updateCloudStatus(missing.size?`⚠️ Kolom belum ada di Supabase: ${[...missing].join(", ")}. Jalankan file SQL terkait (lihat CARA-UPDATE).`:"☁️ Produk tersinkron online");
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
// ===== KATEGORI CUSTOM & STATUS BUKA/TUTUP PENJUAL (pengaturan toko) =====
const readLS=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v??d;}catch{return d;}};
let customCategories=readLS("kalensari_categories",[]);
let closedSellers=readLS("kalensari_closed_sellers",{});
let removedCategories=readLS("kalensari_removed_categories",[]);
// Ongkir per toko: {__default: tarif standar, "nama toko (huruf kecil)": tarif khusus toko itu}
let shippingFees=readLS("kalensari_shipping_fees",{});
// ===== KODE ADMIN =====
// Kode admin bawaan = ADMIN_PIN. Setelah diganti dari Admin > Ongkir, yang disimpan hanya hash SHA-256 (bukan kode aslinya).
const PIN_SALT="kalensari-admin:";
let adminPinHash=String(readLS("kalensari_admin_pin_hash","")||"");
const hashPin=async v=>{if(!(window.crypto&&crypto.subtle))throw Error("no-crypto");const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(PIN_SALT+v));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");};
const checkAdminPin=async v=>{if(!adminPinHash)return v===ADMIN_PIN;try{return(await hashPin(v))===adminPinHash;}catch{return false;}};
// ===== /KODE ADMIN =====
{const saved=normalizePhone(readLS("kalensari_wa_number",""));if(saved.length>=9)WHATSAPP_NUMBER=saved;}
const BASE_CATEGORIES=["Makanan","Minuman"];
const allCategories=()=>[...new Set([...BASE_CATEGORIES,...customCategories,...products.map(p=>p.category).filter(Boolean)])].filter(c=>!removedCategories.includes(c)||products.some(p=>p.category===c));
const sellerKey=n=>String(n||"").trim().toLowerCase();
const shippingFeeFor=n=>{const v=shippingFees[sellerKey(n)],d=Number(shippingFees.__default)||0;return(v===undefined||v===null||v==="")?d:(Number(v)||0);};
// Satu tarif untuk tiap toko yang ada di keranjang (beberapa produk dari toko yang sama = satu ongkir).
const shippingBreakdown=items=>{const m=new Map();items.forEach(p=>{const k=sellerKey(p.seller);if(!m.has(k))m.set(k,{name:String(p.seller||"Toko").trim(),fee:shippingFeeFor(p.seller)});});return[...m.values()];};
const shippingTotal=items=>shippingBreakdown(items).reduce((t,x)=>t+x.fee,0);
// ===== JADWAL BUKA/TUTUP OTOMATIS PENJUAL (jam buka, jam tutup, hari libur; waktu WIB) =====
// sellerSchedule: {"nama penjual (huruf kecil)": {o:"08:00", c:"17:00", off:[0..6 libur tiap pekan, 0=Minggu], h:["2026-10-17" tanggal libur khusus]}}
let sellerSchedule=readLS("kalensari_seller_schedule",{});
const DAY_NAMES=["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const fmtDate=d=>{const[y,m,dd]=String(d).split("-");return`${dd}/${m}/${y}`;};
const dayOfWeek=d=>new Date(d+"T00:00:00Z").getUTCDay();
const shiftDay=(d,n)=>{const t=new Date(d+"T00:00:00Z");t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10);};
const wibDate=()=>new Intl.DateTimeFormat("en-CA",{timeZone:STORE_TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const dayIsOff=(s,d)=>(s.off||[]).includes(dayOfWeek(d))||(s.h||[]).includes(d);
function scheduleState(n){
  const s=sellerSchedule[sellerKey(n)];if(!s)return{open:true,why:""};
  const d=wibDate(),m=nowMinutesWIB(),o=timeToMin(s.o),c=timeToMin(s.c),hasT=o!==null&&c!==null&&o!==c;
  let open;
  if(!hasT)open=!dayIsOff(s,d);
  else if(o<c)open=!dayIsOff(s,d)&&m>=o&&m<c;
  else open=(m>=o&&!dayIsOff(s,d))||(m<c&&!dayIsOff(s,shiftDay(d,-1))); // jam lewat tengah malam
  if(open)return{open:true,why:""};
  return{open:false,why:dayIsOff(s,d)?"Libur hari ini":`Buka ${fmtTime(s.o)}–${fmtTime(s.c)} WIB`};
}
const sellerClosed=n=>!!closedSellers[sellerKey(n)]||!scheduleState(n).open;
const sellerWhy=p=>{const n=sellerList(p).find(sellerClosed);if(!n)return"";return closedSellers[sellerKey(n)]?"Penjual sedang tutup":"Penjual sedang tutup • "+scheduleState(n).why;};
const openSellerList=p=>sellerList(p).filter(n=>!sellerClosed(n));
const allSellersClosed=p=>{const l=sellerList(p);return l.length>0&&l.every(sellerClosed);};
async function loadCloudSettings(){
  if(!CLOUD_CONFIG?.enabled)return false;
  try{
    const rows=await cloudFetch("store_settings?select=*");
    (Array.isArray(rows)?rows:[]).forEach(r=>{
      if(r.key==="categories"&&Array.isArray(r.value)){customCategories=r.value;localStorage.setItem("kalensari_categories",JSON.stringify(customCategories));}
      if(r.key==="removed_categories"&&Array.isArray(r.value)){removedCategories=r.value;localStorage.setItem("kalensari_removed_categories",JSON.stringify(removedCategories));}
      if(r.key==="whatsapp_number"&&typeof r.value==="string"){const n=normalizePhone(r.value);if(n.length>=9&&n.length<=15){WHATSAPP_NUMBER=n;localStorage.setItem("kalensari_wa_number",JSON.stringify(n));applyWaLinks();}}
      if(r.key==="admin_pin_hash"&&typeof r.value==="string"&&/^[0-9a-f]{64}$/.test(r.value)){adminPinHash=r.value;localStorage.setItem("kalensari_admin_pin_hash",JSON.stringify(adminPinHash));}
      if(r.key==="shipping_fees"&&r.value&&typeof r.value==="object"&&!Array.isArray(r.value)){shippingFees=r.value;localStorage.setItem("kalensari_shipping_fees",JSON.stringify(shippingFees));}
      if(r.key==="seller_schedule"&&r.value&&typeof r.value==="object"&&!Array.isArray(r.value)){sellerSchedule=r.value;localStorage.setItem("kalensari_seller_schedule",JSON.stringify(sellerSchedule));}
      if(r.key==="closed_sellers"&&r.value&&typeof r.value==="object"&&!Array.isArray(r.value)){closedSellers=r.value;localStorage.setItem("kalensari_closed_sellers",JSON.stringify(closedSellers));}
    });
    return true;
  }catch(e){console.error("Supabase pengaturan toko:",e);return false;}
}
async function saveStoreSettings(){
  localStorage.setItem("kalensari_categories",JSON.stringify(customCategories));
  localStorage.setItem("kalensari_closed_sellers",JSON.stringify(closedSellers));
  localStorage.setItem("kalensari_seller_schedule",JSON.stringify(sellerSchedule));
  localStorage.setItem("kalensari_removed_categories",JSON.stringify(removedCategories));
  localStorage.setItem("kalensari_shipping_fees",JSON.stringify(shippingFees));
  localStorage.setItem("kalensari_wa_number",JSON.stringify(WHATSAPP_NUMBER));
  if(adminPinHash)localStorage.setItem("kalensari_admin_pin_hash",JSON.stringify(adminPinHash));
  if(!CLOUD_CONFIG?.enabled)return false;
  try{
    await cloudFetch("store_settings?on_conflict=key",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify([{key:"categories",value:customCategories},{key:"removed_categories",value:removedCategories},{key:"shipping_fees",value:shippingFees},{key:"whatsapp_number",value:WHATSAPP_NUMBER},...(adminPinHash?[{key:"admin_pin_hash",value:adminPinHash}]:[]),{key:"closed_sellers",value:closedSellers},{key:"seller_schedule",value:sellerSchedule}])});
    return true;
  }catch(e){
    console.error("Simpan pengaturan toko gagal:",e);
    updateCloudStatus("⚠️ Pengaturan toko baru tersimpan di perangkat ini. Jalankan supabase-pengaturan-toko.sql di Supabase.");
    return false;
  }
}
// Status produk: "Show" = tampil, "Sold Out" = stok habis (tampil tapi tidak bisa dibeli), selain itu (mis. "Hidden" / "Out of Stock" lama) = disembunyikan.
const isSoldOut=p=>p&&p.status==="Sold Out";
const isVisible=p=>p&&(p.status==="Show"||p.status==="Sold Out");
const statusKind=p=>p.status==="Show"?"show":p.status==="Sold Out"?"sold":"hidden";
async function refreshProductStatus(){
  if(!CLOUD_CONFIG?.enabled)return false;
  try{
    const rows=await cloudFetch("products?select=id,status");
    const m=new Map((Array.isArray(rows)?rows:[]).map(r=>[Number(r.id),r.status]));
    let changed=false;
    products.forEach(p=>{const st=m.get(Number(p.id));if(st&&st!==p.status){p.status=st;changed=true;}});
    if(changed){saveProducts();renderProducts();renderCart();}
    return true;
  }catch(e){console.error("Refresh status produk:",e);return false;}
}
const closedCartItems=()=>cartData().filter(p=>p.status!=="Show"||!isInHours(p)||allSellersClosed(p));
function alertClosedItems(list){
  alert("Produk berikut sedang tidak bisa dipesan:\n\n"+list.map(p=>p.status!=="Show"?`- ${p.name} (stok habis)`:allSellersClosed(p)?`- ${p.name} (penjual ${p.seller} sedang tutup)`:`- ${p.name} (jam ${hoursText(p)})`).join("\n")+"\n\nHapus dari keranjang atau pesan lagi saat tersedia.");
}

function renderCategories() {
  const cats=["Semua",...new Set(products.map(p=>p.category))];
  document.getElementById("categories").innerHTML=cats.map(c=>`<button class="cat ${c===activeCategory?"active":""}" onclick="setCategory(${JSON.stringify(c).replace(/"/g,'&quot;')})">${esc(c)}</button>`).join("");
}
function setCategory(c) {
  activeCategory=c; renderCategories(); renderProducts();
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
// ===== VARIAN PRODUK: produk dengan "Nama Grup" sama digabung jadi 1 kartu =====
const groupName=p=>String(p.product_group||"").trim();
const variantLabel=p=>String(p.variant||"").trim()||p.name;
function singleCardHTML(p) {
  const builder=parseToppings(p).length>0, tLimit=Number(p.topping_limit)||0, sClosed=allSellersClosed(p), soldOut=isSoldOut(p);
  return `
   <article class="product${soldOut?" soldout":""}">
  <div class="product-img"><img src="${getProductImage(p.image)}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='🖼️'">
        ${soldOut?'<span class="soldout-badge">STOK HABIS</span>':p.sale?'<span class="sale-badge">PROMO</span>':''}
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <div class="price">${builder?`Racik sendiri${tLimit?` • maks ${rupiah(tLimit)}`:""}`:priceHTML(p)}</div>
        <small>${p.unit}</small><small class="seller">👤 ${p.seller}</small>${hasHours(p)?`<small class="hours${isInHours(p)?"":" closed"}">🕒 ${hoursText(p)}${isInHours(p)?"":" • Belum tersedia"}</small>`:""}
        ${sClosed?`<small class="hours closed">🔒 ${esc(sellerWhy(p))}</small>`:""}
        <div class="product-actions">
          <button class="btn outline" onclick="showProduct(${p.id})">Detail</button>
          ${builder?`<button class="btn primary" ${isInHours(p)&&!sClosed&&!soldOut?"":"disabled"} onclick="showProduct(${p.id})">${soldOut?"Stok Habis":"Pilih Topping"}</button>`:`<button class="btn primary" ${isInHours(p)&&!sClosed&&!soldOut?"":"disabled"} onclick="addToCart(${p.id})">${soldOut?"Stok Habis":"+ Keranjang"}</button>`}
        </div>
      </div>
    </article>`;
}
function groupCardHTML(u) {
  const v=u.variants, first=v[0], prices=v.map(currentPrice), min=Math.min(...prices), max=Math.max(...prices);
  const sellers=[...new Set(v.flatMap(sellerList))].join(", ");
  return `
   <article class="product${v.every(isSoldOut)?" soldout":""}">
  <div class="product-img"><img src="${getProductImage(first.image)}" alt="${esc(u.group)}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='🖼️'">
        ${v.every(isSoldOut)?'<span class="soldout-badge">STOK HABIS</span>':v.some(x=>x.sale)?'<span class="sale-badge">PROMO</span>':''}
      </div>
      <div class="product-body">
        <h3>${esc(u.group)}</h3>
        <div class="price">${min===max?rupiah(min):`Mulai ${rupiah(min)}`}</div>
        <small>${v.length} pilihan varian</small><small class="seller">👤 ${esc(sellers)}</small>${v.every(x=>allSellersClosed(x))?`<small class="hours closed">🔒 ${esc(sellerWhy(v[0]))}</small>`:""}
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
  let list=products.filter(p=>isVisible(p) && (activeCategory==="Semua"||p.category===activeCategory) && (p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)||p.seller.toLowerCase().includes(q)||groupName(p).toLowerCase().includes(q)));
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
// ===== MENU PRASMANAN / RACIK SENDIRI (mis. Seblak Prasmanan) =====
// Topping disimpan di produk sebagai teks, satu baris = "Nama | Harga". Batas belanja per porsi = topping_limit.
function parseToppings(p) {
  return String(p.toppings||"").split(/\r?\n/).map(l=>{
    const m=/^(.+?)\s*[|=]\s*(?:rp\.?\s*)?([\d.,]+)\s*(?:\|\s*(\S+))?\s*$/i.exec(l.trim());
    if(!m)return null;
    const price=Number(m[2].replace(/[.,]/g,""));
    const img=/^https?:\/\//i.test(m[3]||"")?m[3]:"";
    return m[1].trim()&&Number.isFinite(price)?{name:m[1].trim(),price,img}:null;
  }).filter(Boolean);
}
let detailProduct=null, detailToppings={};
function toppingTotal(p) {
  const tl=parseToppings(p);
  return (Number(currentPrice(p))||0)+Object.entries(detailToppings).reduce((t,[i,q])=>t+(tl[i]?tl[i].price*q:0),0);
}
function updateToppingSummary() {
  const p=detailProduct;if(!p)return;
  const total=toppingTotal(p), limit=Number(p.topping_limit)||0;
  const el=document.getElementById("toppingTotal");
  if(el)el.innerHTML=`<span>Total per porsi</span><b>${rupiah(total)}${limit?` / ${rupiah(limit)}`:""}</b>${limit?`<small>Sisa ${rupiah(Math.max(0,limit-total))}</small>`:""}`;
  const btn=document.getElementById("detailAddBtn");
  if(btn)btn.textContent=`🛒 Tambah ke Keranjang • ${rupiah(total)}`;
}
function changeTopping(i,d) {
  const p=detailProduct;if(!p||!parseToppings(p)[i])return;
  const cur=detailToppings[i]||0, next=Math.max(0,Math.min(99,cur+d));
  if(next===cur)return;
  detailToppings[i]=next;
  const limit=Number(p.topping_limit)||0;
  if(d>0&&limit&&toppingTotal(p)>limit){
    detailToppings[i]=cur;if(!cur)delete detailToppings[i];
    showToast(`Melebihi batas ${rupiah(limit)} per porsi`);return;
  }
  if(!next)delete detailToppings[i];
  document.getElementById(`tq-${i}`).textContent=next;
  updateToppingSummary();
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
  const tl=detailProduct?parseToppings(detailProduct):[];
  if(tl.length){
    const chosen=Object.entries(detailToppings).filter(([,q])=>q>0).map(([i,q])=>[tl[i].name,tl[i].price,q]);
    if(!chosen.length){showToast("Pilih minimal 1 topping");return;}
    addToCart(id,detailQty,detailSeller,{t:chosen});
  } else addToCart(id,detailQty,detailSeller);
  closeModal("productModal");
}
function showProduct(id) {
  const p=products.find(x=>x.id===id);
  detailProduct=p;detailToppings={};
  detailQty=1;detailSellers=openSellerList(p);detailSeller=detailSellers.length===1?detailSellers[0]:"";
  const gname=groupName(p);
  const variants=gname?products.filter(x=>isVisible(x)&&groupName(x).toLowerCase()===gname.toLowerCase()):[];
  const isGroup=variants.length>1;
  const tops=parseToppings(p), isBuilder=tops.length>0, tLimit=Number(p.topping_limit)||0;
  const sold=p.status!=="Show", closedNow=!sold&&!isInHours(p), sellerShut=!sold&&allSellersClosed(p), unavailable=sold||closedNow||sellerShut;
  document.getElementById("productDetail").innerHTML=`
    <div class="detail">
      <div class="detail-img"><img src="${getProductImage(p.image)}" alt="${p.name}" onerror="this.style.display='none'"></div>
      <div>
        <p class="eyebrow">${p.category} • ${p.seller}</p>
        <h2>${isGroup?esc(gname):p.name}</h2>
        ${isGroup?`<div class="variant-pick"><span class="seller-pick-title">Pilih Varian</span><div class="variant-picker">${variants.map(v=>`<button type="button" class="variant-chip${v.id===p.id?" active":""}" onclick="showProduct(${v.id})"><b>${esc(variantLabel(v))}</b><small>${isSoldOut(v)?"Habis":rupiah(currentPrice(v))}</small></button>`).join("")}</div></div>`:""}
        <div class="price">${isBuilder?`Racik sendiri${tLimit?` • maks ${rupiah(tLimit)}`:""}`:priceHTML(p)}</div>
        <p>Satuan: ${p.unit}</p>
        <p>${sold?"Stok habis.":sellerShut?sellerWhy(p)+", produk belum bisa dipesan.":closedNow?"Saat ini di luar jam tersedia.":"Produk tersedia untuk dipesan."}</p>
        ${hasHours(p)?`<p class="hours-line${closedNow?" closed":""}">🕒 Tersedia setiap hari pukul ${hoursText(p)}</p>`:""}
        ${unavailable?"":`<div class="seller-pick"><span class="seller-pick-title">Pilih Toko</span><div id="sellerPicker" class="seller-picker">${detailSellers.map((n,i)=>`<button type="button" class="seller-chip${detailSeller===n?" active":""}" onclick="selectDetailSeller(${i})">🏪 ${esc(n)}</button>`).join("")}</div></div>
        ${isBuilder?`<div class="topping-box"><span class="seller-pick-title">Pilih Topping${tLimit?` <small>(total maks ${rupiah(tLimit)} per porsi)</small>`:""}</span><div class="topping-list">${tops.map((t,i)=>`<div class="topping-row">${t.img?`<img class="topping-img" src="${esc(t.img)}" alt="${esc(t.name)}" loading="lazy" onerror="this.remove()">`:""}<div class="topping-info"><b>${esc(t.name)}</b><small>${rupiah(t.price)}</small></div><div class="qty"><button type="button" onclick="changeTopping(${i},-1)" aria-label="Kurangi ${esc(t.name)}">−</button><b id="tq-${i}">0</b><button type="button" onclick="changeTopping(${i},1)" aria-label="Tambah ${esc(t.name)}">+</button></div></div>`).join("")}</div><div id="toppingTotal" class="topping-total"></div></div>`:""}
        <div class="detail-qty"><span>Jumlah</span><div class="qty"><button type="button" onclick="changeDetailQty(${p.id},-1)" aria-label="Kurangi jumlah">−</button><b id="detailQtyValue">1</b><button type="button" onclick="changeDetailQty(${p.id},1)" aria-label="Tambah jumlah">+</button></div></div>`}
        <button id="detailAddBtn" class="btn primary full" ${unavailable?"disabled":""} onclick="addDetailToCart(${p.id})">🛒 Tambah ke Keranjang</button>
      </div>
    </div>`;
  openModal("productModal");
  if(isBuilder)updateToppingSummary();
}
function addToCart(id,qty=1,seller,custom) {
  const p=products.find(x=>x.id===id); if(!p||p.status!=="Show"){if(p&&isSoldOut(p))showToast(`${p.name} sedang habis`);return;}
  if(!isInHours(p)){showToast(`${p.name} tersedia pukul ${hoursText(p)}`);return;}
  if(allSellersClosed(p)){showToast("Penjual sedang tutup");return;}
  if(seller&&sellerClosed(seller)){showToast(`${seller} sedang tutup`);return;}
  if(!custom&&parseToppings(p).length){showProduct(id);showToast("Pilih topping dulu");return;}
  if(seller===undefined){
    // Produk dengan lebih dari satu toko: minta pelanggan memilih toko di popup Detail.
    const list=openSellerList(p);
    if(list.length>1){showProduct(id);showToast("Pilih nama toko dulu");return;}
    seller=list[0]||p.seller||"";
  }
  qty=Math.max(1,parseInt(qty)||1);
  const sig=custom?JSON.stringify(custom.t):"";
  const item=cart.find(x=>x.id===id&&(x.seller||"")===seller&&(x.custom?JSON.stringify(x.custom.t):"")===sig); if(item)item.qty+=qty; else cart.push(custom?{id,qty,seller,custom}:{id,qty,seller});
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
function cartData() {
  return cart.map((i,idx)=>{
    const p=products.find(x=>x.id===i.id);if(!p)return null;
    const row={...p,qty:i.qty,seller:i.seller||p.seller,idx};
    if(i.custom){
      // Item racik sendiri: harga = harga dasar + topping (harga topping terbaru dari Admin), nama memuat daftar topping.
      const tl=parseToppings(p);
      const parts=i.custom.t.map(([n,pr,q])=>{const cur=tl.find(x=>x.name===n);return {n,pr:cur?cur.price:pr,q};});
      row.name=`${p.name} (${parts.map(x=>x.q>1?`${x.n} x${x.q}`:x.n).join(", ")})`;
      row.price=(Number(currentPrice(p))||0)+parts.reduce((t,x)=>t+x.pr*x.q,0);
      row.sale=null;
    }
    return row;
  }).filter(Boolean);
}
function renderCart() {
  const items=cartData(),subtotal=items.reduce((s,p)=>s+currentPrice(p)*p.qty,0),shipping=shippingTotal(items),ships=shippingBreakdown(items);
  document.getElementById("cartItems").innerHTML=items.length?items.map(p=>`
    <div class="cart-row"><div class="cart-info"><div class="cart-name">${p.name}</div><div class="cart-price">${rupiah(currentPrice(p))} × ${p.qty}</div><div class="cart-seller">🏪 ${esc(p.seller)}${allSellersClosed(p)?' • <b style="color:#b3261e">Tutup</b>':""}</div></div>
    <div class="qty"><button onclick="changeQty(${p.idx},-1)">−</button><b>${p.qty}</b><button onclick="changeQty(${p.idx},1)">+</button></div>
    <button class="cart-remove" type="button" title="Hapus produk" aria-label="Hapus ${p.name} dari keranjang" onclick="removeFromCart(${p.idx})">🗑️</button></div>`).join(""):`<div class="empty-state"><b>🛒 Keranjang masih kosong</b>Yuk pilih makanan atau minuman favoritmu.</div>`;
  document.getElementById("cartItemLabel").textContent=`${cart.reduce((s,i)=>s+i.qty,0)} item`;
  document.getElementById("cartSubtotal").textContent=rupiah(subtotal);
  document.getElementById("cartShipping").textContent=rupiah(shipping);
  {const row=document.getElementById("cartShipping").parentElement;let bd=document.getElementById("cartShipBreakdown");
   if(!bd){bd=document.createElement("div");bd.id="cartShipBreakdown";bd.className="ship-breakdown";row.insertAdjacentElement("afterend",bd);}
   bd.hidden=!ships.length;
   bd.innerHTML=ships.length?`<div class="ship-head">Rincian ongkir · ${ships.length} toko</div>${ships.map(x=>`<div class="ship-row"><span>🏪 ${esc(x.name)}</span><b>${x.fee>0?rupiah(x.fee):"Gratis"}</b></div>`).join("")}<p class="ship-note">ℹ️ Ongkir dihitung <b>per toko</b>, bukan per produk. Belanja dari ${ships.length>1?`${ships.length} toko berarti ongkir dikenakan ${ships.length} kali`:"1 toko berarti 1 kali ongkir"}; beberapa produk dari toko yang sama hanya kena satu ongkir.</p>`:"";}
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
  await Promise.all([loadCloudSettings(),refreshProductStatus()]);
  {const closed=closedCartItems();if(closed.length){alertClosedItems(closed);return;}}
  const f=new FormData(e.target),items=cartData().map(({idx,...r})=>r),subtotal=items.reduce((s,p)=>s+currentPrice(p)*p.qty,0),ships=shippingBreakdown(items),shipping=ships.reduce((t,x)=>t+x.fee,0),total=subtotal+shipping;
  const phone=String(f.get("phone")||"").trim();
  const orderCode=makeOrderCode();
  const createdAt=new Date().toISOString();
  const detail=items.map(p=>`- ${p.name} (Toko: ${p.seller}) x${p.qty} = ${rupiah(currentPrice(p)*p.qty)}`).join("\n");
  const msg=`Halo KALENSARI STORE, saya ingin memesan:\n\nKode Pesanan: ${orderCode}\n\n${detail}\n\nSubtotal: ${rupiah(subtotal)}\nOngkir: ${rupiah(shipping)}${ships.length?"\n"+ships.map(x=>`  • ${x.name}: ${rupiah(x.fee)}`).join("\n")+"\n  (ongkir dihitung per toko)":""}\nTOTAL: ${rupiah(total)}\n\nNama: ${f.get("name")}\nNo. WhatsApp: ${phone}\nAlamat: ${f.get("address")}\nCatatan: ${f.get("note")||"-"}\nPembayaran: ${f.get("payment")}`;
  const payload={order_code:orderCode,created_at:createdAt,customer_name:String(f.get("name")||""),customer_phone:phone,customer_phone_normalized:normalizePhone(phone),address:String(f.get("address")||""),note:String(f.get("note")||""),payment:String(f.get("payment")||""),items,subtotal,shipping,total,status:"menunggu"};

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
(async()=>{ if(CLOUD_CONFIG?.enabled){ updateCloudStatus("☁️ Menghubungkan ke database..."); const ok=await loadCloudProducts(); await loadCloudSettings(); if(ok){renderCategories();renderProducts();renderCart();updateCloudStatus("☁️ Produk tersinkron online");} else updateCloudStatus("⚠️ Cloud belum tersambung. Periksa config.js dan SQL Supabase."); } })();

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
      <div class="admin-product-info"><h4>${p.name} <span class="admin-status ${statusKind(p)==="hidden"?'off':statusKind(p)==="sold"?'sold':''}">${({show:"Tampil",sold:"Stok habis",hidden:"Disembunyikan"})[statusKind(p)]}</span></h4><small>${p.category} • ${rupiah(currentPrice(p))} • ${p.seller}${hasHours(p)?` • 🕒 ${hoursText(p)}`:""}${groupName(p)?` • 🧩 ${esc(groupName(p))} › ${esc(variantLabel(p))}`:""}${parseToppings(p).length?` • 🍲 ${parseToppings(p).length} topping${p.topping_limit?` (maks ${rupiah(p.topping_limit)})`:""}`:""}</small></div>
      <div class="admin-product-actions"><button class="btn outline" onclick="editAdminProduct(${i})">✏️ Edit</button><span class="seg status-seg" role="group" aria-label="Status produk">${[["show","Tampilkan","Show"],["sold","Stok Habis","Sold Out"],["hidden","Sembunyikan","Hidden"]].map(([k,l,v])=>`<button type="button" class="${statusKind(p)===k?"on-"+k:""}" onclick="setProductStatus(${i},'${v}')">${l}</button>`).join("")}</span><button class="btn outline" onclick="deleteAdminProduct(${i})">🗑️ Hapus</button></div>
      <div id="edit-${i}" class="admin-edit" hidden></div>
    </div>`).join("");
}
function editAdminProduct(i){
  const p=products[i], box=document.getElementById(`edit-${i}`);
  box.hidden=false;
  box.innerHTML=`
    <label>Nama<input id="e-name-${i}" value="${esc(p.name)}"></label>
    <label>Kategori<select id="e-cat-${i}">${allCategories().map(c=>`<option value="${esc(c)}" ${p.category===c?'selected':''}>${esc(c)}</option>`).join("")}</select></label>
    <label>Harga<input id="e-price-${i}" type="number" value="${p.price}"></label>
    <label>Harga Promo<input id="e-sale-${i}" type="number" value="${p.sale||''}" placeholder="Kosongkan jika tidak promo"></label>
    <label>Penjual<input id="e-seller-${i}" value="${esc(p.seller)}"></label>
    <label>Satuan<input id="e-unit-${i}" value="${esc(p.unit)}"></label>
    <label>Nama Grup (opsional)<input id="e-group-${i}" value="${esc(p.product_group||'')}" placeholder="mis. Pecel Lele"></label>
    <label>Nama Varian (opsional)<input id="e-variant-${i}" value="${esc(p.variant||'')}" placeholder="mis. Lauk saja / + Nasi"></label>
    <p class="wide admin-hint">🧩 Produk dengan Nama Grup yang sama digabung jadi 1 kartu dengan pilihan varian. Kosongkan jika tidak ingin digabung.</p>
    <label class="wide">Topping Prasmanan (opsional)<textarea id="e-toppings-${i}" rows="6" placeholder="Bakso | 1000 | https://link-foto.jpg&#10;Sosis | 1500&#10;Ceker | 2000">${esc(p.toppings||'')}</textarea></label>
    <label>Batas belanja per porsi (Rp)<input id="e-tlimit-${i}" type="number" value="${p.topping_limit||''}" placeholder="mis. 10000"></label>
    <p class="wide admin-hint">🍲 Satu baris = satu topping, format: Nama | Harga | URL Foto (foto boleh dikosongkan). Jika diisi, produk ini jadi menu racik (prasmanan) dan kolom Harga di atas menjadi harga dasar (isi 0 bila tidak ada). Kosongkan jika bukan menu prasmanan.</p>
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
  const tText=document.getElementById(`e-toppings-${i}`).value.trim();
  if(tText){
    const lines=tText.split(/\r?\n/).filter(l=>l.trim());
    if(parseToppings({toppings:tText}).length<lines.length){showToast("Format topping salah. Gunakan satu baris: Nama | Harga");return;}
  }
  const tLim=Number(document.getElementById(`e-tlimit-${i}`).value);
  const p=products[i]; p.toppings=tText||null; p.topping_limit=tLim>0?tLim:null; p.open_time=openT||null; p.close_time=closeT||null; p.product_group=document.getElementById(`e-group-${i}`).value.trim()||null; p.variant=document.getElementById(`e-variant-${i}`).value.trim()||null; p.name=document.getElementById(`e-name-${i}`).value.trim(); p.category=document.getElementById(`e-cat-${i}`).value; p.price=Number(document.getElementById(`e-price-${i}`).value)||0; const sale=Number(document.getElementById(`e-sale-${i}`).value); p.sale=sale>0?sale:null; p.seller=document.getElementById(`e-seller-${i}`).value.trim(); p.unit=document.getElementById(`e-unit-${i}`).value.trim(); p.image=document.getElementById(`e-image-${i}`).value.trim(); saveProducts(); syncCloudProducts(); renderProducts(); renderCategories(); renderAdminProducts(); showToast("Produk berhasil diperbarui");
}
function addAdminProduct(){
  const id=products.length?Math.max(...products.map(p=>p.id))+1:1;
  products.unshift({id,name:"Produk Baru",price:10000,sale:null,category:"Makanan",unit:"1 porsi",seller:"Warga Kalensari",status:"Show",image:""});
  saveProducts(); syncCloudProducts(); renderProducts(); renderCategories(); renderAdminProducts(); editAdminProduct(0); showToast("Produk baru ditambahkan");
}
function setProductStatus(i,status){if(!products[i]||products[i].status===status)return;products[i].status=status;saveProducts();syncCloudProducts();renderProducts();renderCategories();renderCart();renderAdminProducts();showToast(({"Show":"Produk ditampilkan","Sold Out":"Produk ditandai stok habis","Hidden":"Produk disembunyikan"})[status]);}
function deleteAdminProduct(i){if(!confirm(`Hapus ${products[i].name}?`))return;products.splice(i,1);saveProducts();syncCloudProducts();renderProducts();renderCategories();renderAdminProducts();showToast("Produk dihapus");}
document.getElementById("menuBtn").onclick=openAdmin;
document.getElementById("adminLoginBtn").onclick=async()=>{const v=document.getElementById("adminPin").value;try{await loadCloudSettings();}catch{}if(await checkAdminPin(v)){adminLoggedIn=true;document.getElementById("adminLogin").hidden=true;document.getElementById("adminPanel").hidden=false;renderAdminProducts();showToast("Login admin berhasil")}else showToast("Kode admin salah")};
// Kolom kode admin: pastikan bisa menerima kode 4-12 karakter (tanpa batas panjang/pola bawaan HTML).
{const pi=document.getElementById("adminPin");if(pi){pi.removeAttribute("maxlength");pi.removeAttribute("pattern");pi.type="password";pi.setAttribute("autocomplete","off");}}
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

setupHeroButtons();
document.getElementById("waFloat")?.setAttribute("href", `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Halo KALENSARI STORE, saya ingin memesan.")}`);
// Tombol hero: [Belanja Sekarang] [Info Santunan] [Penyedia Jasa]
// "Info Santunan" menggantikan tombol Chat WhatsApp lama (#waHero); "Penyedia Jasa" disisipkan di sebelahnya.
// "Info Santunan" membuka halaman santunan.html (data dari Google Sheet); "Penyedia Jasa" membuka WhatsApp toko.
function setupHeroButtons(){
  const info=document.getElementById("waHero");if(!info)return;
  const wa=t=>`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`;
  info.textContent="Info Santunan";
  info.setAttribute("href","santunan.html");
  info.removeAttribute("target");info.removeAttribute("rel");
  let jasa=document.getElementById("jasaHero");
  if(!jasa){jasa=info.cloneNode(false);jasa.id="jasaHero";jasa.classList.add("hero-jasa");info.insertAdjacentElement("afterend",jasa);}
  jasa.textContent="Penyedia Jasa";
  jasa.setAttribute("href",wa("Halo KALENSARI STORE, saya ingin bertanya tentang penyedia jasa."));
  jasa.setAttribute("target","_blank");jasa.setAttribute("rel","noopener");
}
// Perbarui semua tautan WhatsApp statis setelah nomor diubah / dimuat dari database.
function applyWaLinks(){
  const q=t=>`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`;
  const g=document.getElementById("waGeneral");if(g)g.href=q("Halo KALENSARI STORE, saya ingin bertanya tentang produk.");
  setupHeroButtons();
  document.getElementById("waFloat")?.setAttribute("href",q("Halo KALENSARI STORE, saya ingin memesan."));
}
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
setInterval(()=>{ if(products.some(hasHours)||Object.keys(sellerSchedule).length) renderProducts(); },60000);


// ===== ADMIN: + Kategori & Penjual (buka/tutup) =====
(function(){
  const exp=document.getElementById("exportBtn"), list=document.getElementById("adminProductList");
  if(!exp||!list)return;
  const mk=(id,text)=>{const b=document.createElement("button");b.type="button";b.id=id;b.className=exp.className;b.textContent=text;return b;};
  const bCat=mk("manageCatBtn","+ Kategori"), bSel=mk("manageSellerBtn","🏪 Penjual"), bShip=mk("manageShipBtn","🚚 Ongkir");
  exp.insertAdjacentElement("afterend",bShip); exp.insertAdjacentElement("afterend",bSel); exp.insertAdjacentElement("afterend",bCat);
  const panel=document.createElement("div"); panel.id="adminExtra"; panel.className="admin-extra"; panel.hidden=true;
  list.parentNode.insertBefore(panel,list);
  let mode="", selectedCat=""; const schedOpen=new Set();
  const schEdit=n=>{const k=sellerKey(n);const s=sellerSchedule[k]||(sellerSchedule[k]={o:"",c:"",off:[],h:[]});s.off=s.off||[];s.h=s.h||[];return s;};
  const schClean=n=>{const k=sellerKey(n),s=sellerSchedule[k];if(s&&!s.o&&!s.c&&!(s.off||[]).length&&!(s.h||[]).length)delete sellerSchedule[k];};
  const usedBy=c=>products.filter(p=>p.category===c).length;
  function sellerRows(){
    const map=new Map();
    products.forEach(p=>sellerList(p).forEach(n=>{const k=sellerKey(n);if(!map.has(k))map.set(k,{name:n,count:0});map.get(k).count++;}));
    return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,"id"));
  }
  function render(){
    panel.hidden=!mode; panel.classList.toggle("blue",mode==="ship");
    bCat.classList.toggle("active",mode==="cat"); bSel.classList.toggle("active",mode==="seller"); bShip.classList.toggle("active",mode==="ship");
    if(mode==="cat"){
      panel.innerHTML=`<div class="extra-head"><h4>🏷️ Kategori</h4><button type="button" class="extra-close" data-act="close" aria-label="Tutup">✕</button></div>
        <div class="extra-row"><input id="newCatInput" maxlength="30" placeholder="Nama kategori baru, mis. Jajanan"><button type="button" class="btn primary" data-act="addcat">Tambah</button></div>
        <div class="extra-cat-area"><div class="extra-chips">${allCategories().map(c=>`<button type="button" class="extra-chip${c===selectedCat?" selected":""}" data-act="selcat" data-name="${esc(c)}" aria-pressed="${c===selectedCat}">${esc(c)}</button>`).join("")}</div><button type="button" class="btn extra-del" data-act="delcat" ${selectedCat?"":"disabled"} title="${selectedCat?`Hapus kategori ${esc(selectedCat)}`:"Klik salah satu kategori dulu"}">Hapus</button></div>
        <p class="admin-hint">Klik nama kategori lalu tekan <b>Hapus</b> untuk menghapusnya (hanya bisa jika tidak ada produk di dalamnya). Kategori baru langsung muncul di pilihan Kategori saat Edit produk. Kategori baru tampil di halaman pembeli setelah ada produk di dalamnya.</p>`;
    } else if(mode==="seller"){
      const rows=sellerRows();
      panel.innerHTML=`<div class="extra-head"><h4>🏪 Status Penjual</h4><button type="button" class="extra-close" data-act="close" aria-label="Tutup">✕</button></div>
        <p class="admin-hint"><b>Tutup</b> = tutup paksa sampai dibuka lagi. <b>Buka</b> = mengikuti jadwal otomatis (jika jadwal diisi). Isi jam buka, jam tutup, dan hari libur di <b>🕒 Jadwal otomatis</b> tiap penjual (waktu WIB).</p>
        <div class="seller-status-list">${rows.map((r,i)=>{const m=!!closedSellers[sellerKey(r.name)],eff=sellerClosed(r.name),k=sellerKey(r.name),sc=sellerSchedule[k]||{},off=sc.off||[],hs=sc.h||[],nm=esc(r.name);
          const sum=[sc.o&&sc.c?`${fmtTime(sc.o)}–${fmtTime(sc.c)}`:"",off.length?"libur "+[1,2,3,4,5,6,0].filter(d=>off.includes(d)).map(d=>DAY_NAMES[d]).join(","):"",hs.length?hs.length+" tgl libur":""].filter(Boolean).join(" • ");
          return `<div class="seller-status-row"><div><b>${nm}</b><small>${r.count} produk • ${eff?"🔒 Tutup sekarang":"🟢 Buka sekarang"}</small></div><div class="seg"><button type="button" class="${m?"":"on-open"}" data-act="open" data-name="${nm}">Buka</button><button type="button" class="${m?"on-closed":""}" data-act="close-seller" data-name="${nm}">Tutup</button></div>
          <details class="sched"${schedOpen.has(k)?" open":""}><summary>🕒 Jadwal otomatis${sum?" — "+esc(sum):" (belum diatur)"}</summary>
            <div class="sched-grid"><label>Jam buka<input type="time" data-act="sch-o" data-name="${nm}" value="${esc(sc.o||"")}"></label><label>Jam tutup<input type="time" data-act="sch-c" data-name="${nm}" value="${esc(sc.c||"")}"></label></div>
            <div class="sched-days"><span>Libur tiap pekan:</span>${[1,2,3,4,5,6,0].map(d=>`<label><input type="checkbox" data-act="sch-day" data-d="${d}" data-name="${nm}"${off.includes(d)?" checked":""}>${DAY_NAMES[d]}</label>`).join("")}</div>
            <div class="sched-h"><span>Libur tanggal tertentu:</span><input type="date" aria-label="Tanggal libur"><button type="button" class="btn outline small" data-act="sch-addh" data-name="${nm}">+ Tambah</button></div>
            ${hs.length?`<div class="extra-chips">${hs.map(d=>`<button type="button" class="extra-chip" data-act="sch-delh" data-name="${nm}" data-date="${d}" title="Hapus libur">${fmtDate(d)} ✕</button>`).join("")}</div>`:""}
            <small class="sched-note">Kosongkan jam buka/tutup jika hanya ingin mengatur hari libur. Jam dipakai bersama hari libur.</small>
          </details></div>`;}).join("")||'<div class="empty-state">Belum ada penjual.</div>'}</div>`;
    } else if(mode==="ship"){
      const rows=sellerRows();
      panel.innerHTML=`<div class="extra-head"><h4>🚚 Ongkir & WhatsApp</h4><button type="button" class="extra-close" data-act="close" aria-label="Tutup">✕</button></div>
        <div class="fee-default"><label>💬 Nomor WhatsApp toko<span class="wa-row"><input id="waInput" type="tel" inputmode="tel" maxlength="20" placeholder="08123456789" value="${esc(WHATSAPP_NUMBER)}"><button type="button" class="btn primary" data-act="savewa">Simpan</button></span></label><small>Semua tombol WhatsApp dan pesanan checkout dikirim ke nomor ini. Boleh ditulis 08… atau 62… (otomatis diubah ke format 62…).</small></div>
        <div class="fee-default pin-card"><b>🔐 Kode admin</b><div class="pin-grid"><input id="pinOld" type="password" autocomplete="off" placeholder="Kode lama"><input id="pinNew" type="password" autocomplete="new-password" maxlength="12" placeholder="Kode baru (4–12 karakter)"><input id="pinNew2" type="password" autocomplete="new-password" maxlength="12" placeholder="Ulangi kode baru"><button type="button" class="btn primary" data-act="savepin">Ganti Kode</button></div><small>Kode ini dipakai untuk membuka Dashboard Admin. Kode lama diminta dulu sebelum diganti. Kode bawaan: 1234 — segera ganti.</small></div>
        <div class="fee-default"><label>🚚 Ongkir standar per toko (Rp)<input type="number" inputmode="numeric" min="0" step="500" data-act="fee-default" value="${Number(shippingFees.__default)||0}"></label><small>Dipakai untuk toko yang tarifnya dikosongkan. Pembeli dari 2 toko = 2 × ongkir.</small></div>
        <div class="seller-status-list">${rows.map(r=>`<div class="seller-status-row"><div><b>${esc(r.name)}</b><small>${r.count} produk</small></div><label class="fee-field">Ongkir Rp<input type="number" inputmode="numeric" min="0" step="500" data-act="fee" data-name="${esc(r.name)}" placeholder="${shippingFeeFor("")}" value="${shippingFees[sellerKey(r.name)]??""}"></label></div>`).join("")||'<div class="empty-state">Belum ada penjual.</div>'}</div>
        <p class="admin-hint">Kolom ongkir toko yang dikosongkan memakai tarif standar. Isi <b>0</b> untuk toko yang gratis ongkir.</p>`;
    } else panel.innerHTML="";
  }
  const toggle=m=>{mode=mode===m?"":m;selectedCat="";render();if(mode==="cat")document.getElementById("newCatInput")?.focus();};
  bCat.onclick=()=>toggle("cat"); bSel.onclick=()=>toggle("seller"); bShip.onclick=()=>toggle("ship");
  async function persist(msg){
    const ok=await saveStoreSettings();
    showToast(ok||!CLOUD_CONFIG?.enabled?msg:msg+" (belum tersimpan online)");
  }
  function afterSellerChange(){renderProducts();renderCart();renderAdminProducts();}
  panel.addEventListener("click",async e=>{
    const t=e.target.closest("[data-act]");if(!t)return;
    const act=t.dataset.act, name=t.dataset.name;
    if(act==="close"){mode="";selectedCat="";render();return;}
    if(act==="savewa"){
      const inp=document.getElementById("waInput"),n=normalizePhone(inp.value);
      if(n.length<9||n.length>15){showToast("Nomor WhatsApp tidak valid");inp.focus();return;}
      WHATSAPP_NUMBER=n;inp.value=n;applyWaLinks();
      await persist(`Nomor WhatsApp diubah ke ${n}`);return;
    }
    if(act==="savepin"){
      const g=id=>document.getElementById(id),o=g("pinOld").value,n=g("pinNew").value,n2=g("pinNew2").value;
      if(!(await checkAdminPin(o))){showToast("Kode admin lama salah");g("pinOld").focus();return;}
      if(n.length<4||n.length>12){showToast("Kode baru harus 4–12 karakter");g("pinNew").focus();return;}
      if(n!==n2){showToast("Kode baru dan ulangannya tidak sama");g("pinNew2").focus();return;}
      if(n===o){showToast("Kode baru sama dengan kode lama");g("pinNew").focus();return;}
      try{adminPinHash=await hashPin(n);}catch{showToast("Browser ini tidak mendukung penyimpanan kode aman");return;}
      ["pinOld","pinNew","pinNew2"].forEach(id=>{g(id).value="";});
      await persist("Kode admin berhasil diganti");return;
    }
    if(act==="selcat"){selectedCat=selectedCat===name?"":name;render();return;}
    if(act==="addcat"){
      const inp=document.getElementById("newCatInput"), v=inp.value.replace(/\s+/g," ").trim();
      if(!v){showToast("Isi nama kategori dulu");return;}
      if(allCategories().some(c=>c.toLowerCase()===v.toLowerCase())){showToast("Kategori itu sudah ada");return;}
      customCategories.push(v); removedCategories=removedCategories.filter(c=>c!==v); selectedCat=""; render();
      document.querySelectorAll('select[id^="e-cat-"]').forEach(sel=>{if(![...sel.options].some(o=>o.value===v))sel.add(new Option(v,v));});
      await persist(`Kategori "${v}" ditambahkan`);return;
    }
    if(act==="delcat"){
      const name=selectedCat;
      if(!name){showToast("Klik salah satu kategori dulu");return;}
      if(usedBy(name)){alert(`Kategori "${name}" masih dipakai ${usedBy(name)} produk. Pindahkan produknya dulu.`);return;}
      if(!confirm(`Hapus kategori "${name}"?`))return;
      customCategories=customCategories.filter(c=>c!==name);
      if(!removedCategories.includes(name))removedCategories.push(name);
      selectedCat=""; render();
      document.querySelectorAll('select[id^="e-cat-"]').forEach(sel=>{[...sel.options].forEach(o=>{if(o.value===name&&!o.selected)o.remove();});});
      await persist(`Kategori "${name}" dihapus`);return;
    }
    if(act==="sch-addh"){
      const v=t.closest(".sched").querySelector('input[type="date"]').value;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(v)){showToast("Pilih tanggal libur dulu");return;}
      const s=schEdit(name);if(!s.h.includes(v))s.h.push(v);s.h.sort();schedOpen.add(sellerKey(name));render();afterSellerChange();
      await persist(`Libur ${name} ${fmtDate(v)} ditambahkan`);return;
    }
    if(act==="sch-delh"){
      const s=schEdit(name);s.h=s.h.filter(x=>x!==t.dataset.date);schClean(name);schedOpen.add(sellerKey(name));render();afterSellerChange();
      await persist(`Libur ${name} ${fmtDate(t.dataset.date)} dihapus`);return;
    }
    if(act==="open"){delete closedSellers[sellerKey(name)];render();afterSellerChange();await persist(`${name} dibuka`);return;}
    if(act==="close-seller"){closedSellers[sellerKey(name)]=true;render();afterSellerChange();await persist(`${name} ditutup, produknya tidak bisa dipesan`);return;}
  });
  panel.addEventListener("change",async e=>{
    const t=e.target.closest("[data-act]");if(!t)return;
    const act=t.dataset.act;
    if(act==="sch-o"||act==="sch-c"||act==="sch-day"){
      const n=t.dataset.name,s=schEdit(n);
      if(act==="sch-o")s.o=t.value;else if(act==="sch-c")s.c=t.value;
      else{const d=Number(t.dataset.d);s.off=s.off.filter(x=>x!==d);if(t.checked)s.off.push(d);}
      const half=(s.o&&!s.c)||(!s.o&&s.c);
      schClean(n);schedOpen.add(sellerKey(n));render();afterSellerChange();
      await persist(half?"Isi jam buka DAN jam tutup agar jam berlaku":`Jadwal ${n} disimpan`);return;
    }
    if(act!=="fee"&&act!=="fee-default")return;
    const raw=String(t.value).trim(),n=Math.max(0,Math.round(Number(raw)||0));
    if(act==="fee-default"){shippingFees.__default=n;t.value=n;}
    else{const k=sellerKey(t.dataset.name);if(raw==="")delete shippingFees[k];else{shippingFees[k]=n;t.value=n;}}
    if(act==="fee-default")panel.querySelectorAll('input[data-act="fee"]').forEach(i=>i.placeholder=n);
    renderCart();
    await persist(act==="fee-default"?`Ongkir standar ${rupiah(n)} per toko`:`Ongkir ${t.dataset.name}: ${raw===""?"pakai tarif standar":rupiah(n)}`);
  });
  panel.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="newCatInput"){e.preventDefault();panel.querySelector('[data-act="addcat"]').click();}
    if(e.key==="Enter"&&["pinOld","pinNew","pinNew2"].includes(e.target.id)){e.preventDefault();panel.querySelector('[data-act="savepin"]').click();}
    if(e.key==="Enter"&&e.target.id==="waInput"){e.preventDefault();panel.querySelector('[data-act="savewa"]').click();}});
})();
