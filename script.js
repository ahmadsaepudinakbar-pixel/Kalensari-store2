var KS_CUACA=null; // cuaca terkini (diisi muatCuaca di bawah)
// KALENSARI STORE
let WHATSAPP_NUMBER = "6281234567890"; // nomor bawaan; bisa diubah dari Admin > Ongkir
const DEFAULT_PRODUCTS = [{"id":1,"name":"Lotek Bongko","price":12000,"sale":8000,"category":"Makanan","unit":"1 porsi","seller":"Teh Ida","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/o-fvve-chatgpt%20image%20sep%2028%2C%202026%2C%2005_14_09%20am.png?versionId=sSlnWC5X3v6SfdE8SJ7kfFpkAAtYEG66"},{"id":2,"name":"Bakso Sapi Biasa","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/pf0do4-chatgpt%20image%20sep%2028%2C%202026%2C%2006_23_05%20am.png?versionId=LvDf81yvhC2OIgUPloRKlaBbRFi.9BuH"},{"id":3,"name":"MIe ayam Pedas","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"H. Diman, Mang Edo, Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/0qg0at-chatgpt%20image%20sep%2028%2C%202026%2C%2002_03_31%20pm.png?versionId=EH1aAjwRvQd3dMY93ItbAgINe5lzjnTw"},{"id":4,"name":"MIe ayam Biasa","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"H. Diman, Mang Edo, Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/m5q9je-chatgpt%20image%20sep%2028%2C%202026%2C%2002_02_42%20pm.png?versionId=Lci_mH9SOmBpD2nCjBV_Z_o_XXpxpW8v"},{"id":5,"name":"Bakso Tulang","price":25000,"sale":18000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Out of Stock","image":"https://cdn.store.link/products/kalensaristore80353/agx1iw-chatgpt%20image%20sep%2028%2C%202026%2C%2006_29_33%20am.png?versionId=1n1pJ2ilQgM4jrhR5X_0LEG9mB.lTmg8"},{"id":6,"name":"Bakso Telur","price":12000,"sale":10000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/8a69b3-chatgpt%20image%20sep%2028%2C%202026%2C%2006_34_03%20am.png?versionId=m_nc2BhsK7d4LdKAPdxnMAiRHAV.Q2qB"},{"id":7,"name":"Bakso Urat","price":18000,"sale":15000,"category":"Makanan","unit":"1 porsi","seller":"Zyan Bakso","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/obbajp-chatgpt%20image%20sep%2028%2C%202026%2C%2006_36_33%20am.png?versionId=h_Evc0EcQtdz4PFbFk8aZey0jgRRXZ.p"},{"id":8,"name":"Jus Alpukat","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/3x8j0a-chatgpt%20image%20sep%2028%2C%202026%2C%2006_52_41%20am.png?versionId=eKLzC7y3fgCWrkTSAdcaLHEyEYAdZMsh"},{"id":9,"name":"Jus Buah Naga","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/p8vus5-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_02%20am.png?versionId=e6H7dwvYmMOZrI86QKN98dyVxHcc8V0M"},{"id":10,"name":"Jus Tomat","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/o4d1bt-chatgpt%20image%20sep%2028%2C%202026%2C%2007_20_47%20am.png?versionId=IbXRZdg2vp6bCuXJPch5YT7FgQZXXcRM"},{"id":11,"name":"Jus Mangga","price":10000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Teh Liya","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/lqk2sp-chatgpt%20image%20sep%2028%2C%202026%2C%2007_22_59%20am.png?versionId=FADsI7qbgepPpQt7XVGl901Q_3cKHFQW"},{"id":12,"name":"Es teh Manis","price":3000,"sale":null,"category":"Minuman","unit":"1 cup besar","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/abqncl-hops-3260267377.webp?versionId=P4DG3eGis6QyEzh9ZFQm3CBF8p9DEJwx"},{"id":13,"name":"Es teh Matcha Late","price":6000,"sale":null,"category":"Minuman","unit":"1 cup besar Rasa Greentea","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/c9c6rx-images%20%281%29.jpg?versionId=K0P2vQjt8SpfWctljxkmCkUO_8AfkYf2"},{"id":14,"name":"Es teh Matcha Premium","price":15000,"sale":12000,"category":"Minuman","unit":"1 cup besar Rasa Greentea","seller":"Tea DESA","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/bkv3a5-images.jpg?versionId=jKTeHTYDtwRD2qs6CWqYs9ZM2EBZ9emC"},{"id":15,"name":"Nasi Kebuli","price":25000,"sale":20000,"category":"Makanan","unit":"1 porsi","seller":"Teh iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/u4fafx-chatgpt%20image%20sep%2028%2C%202026%2C%2002_14_04%20pm.png?versionId=DHZD_c9LScH15.An7XpzcTJMrjDf0AJk"},{"id":16,"name":"Nasi Goreng","price":13000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Kang Diki Sueb","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/h38vn8-chatgpt%20image%20sep%2028%2C%202026%2C%2002_11_47%20pm.png?versionId=Q1UfoJozDqlb8kaNfjJqp6nKv74i_B3F"},{"id":17,"product_group":"Pecel Lele","variant":"Lauk saja","name":"Pecel Lele","price":15000,"sale":null,"category":"Makanan","unit":"Pecel Lele","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"},{"id":18,"product_group":"Pecel Lele","variant":"+ Nasi","name":"Pecel Lele + Nasi","price":20000,"sale":null,"category":"Makanan","unit":"Pecel Lele + Nasi","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ota8dn-chatgpt%20image%20sep%2028%2C%202026%2C%2002_25_58%20pm.png?versionId=JUVeTbSTZiWtp5heJSYA9RlF7OmxzgOE"},{"id":19,"product_group":"Pecel Ayam","variant":"Lauk saja","name":"Pecel Ayam","price":20000,"sale":null,"category":"Makanan","unit":"Pecel Ayam","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"},{"id":20,"product_group":"Pecel Ayam","variant":"+ Nasi","name":"Pecel Ayam + Nasi","price":25000,"sale":null,"category":"Makanan","unit":"Pecel Ayam + Nasi","seller":"Mang Tardug","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/s1j6xi-chatgpt%20image%20sep%2028%2C%202026%2C%2002_24_40%20pm.png?versionId=daNVkTOKSqZw_EU5ERJdtgZb57aN5VWx"},{"id":21,"name":"Fried Chiken","price":10000,"sale":null,"category":"Makanan","unit":"Ayam Goreng Tepung","seller":"Warga Kalensari","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/q38c2x-chatgpt%20image%20sep%2028%2C%202026%2C%2002_23_43%20pm.png?versionId=RR2yA7Iutiz2jXiFwJNUzApiqzE7ItsL"},{"id":22,"name":"Soto Ayam","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Sate Madura","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/4io072-chatgpt%20image%20sep%2028%2C%202026%2C%2002_22_28%20pm.png?versionId=48IdG9bl9fPErJcNUzMeAPrvhzOOe_qr"},{"id":23,"name":"Sate Ayam","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Sate Madura","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ewpn71-chatgpt%20image%20sep%2028%2C%202026%2C%2002_18_51%20pm.png?versionId=X09ZJ.tPJyqr_LhYnZRngTpDFKIVqz0b"},{"id":24,"name":"Nasi Ayam Katsu","price":20000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Teh Iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/ievcoz-chatgpt%20image%20sep%2028%2C%202026%2C%2002_17_10%20pm.png?versionId=buhfyErVz0r0y_eaESh2AooKeylFdopS"},{"id":25,"name":"Spageti","price":10000,"sale":null,"category":"Makanan","unit":"1 porsi","seller":"Teh Iyoh","status":"Show","image":"https://cdn.store.link/products/kalensaristore80353/d62zqy-aa1408ce-c67d-4d63-aa67-12ec89b3c905.png?versionId=chUteSwuPamgkCgB_ORU_hnugVoqj8dW"}];

const pendingDeletes = new Set(); // id produk yang sengaja dihapus admin (agar produk baru milik penjual tidak ikut terhapus)
let products = JSON.parse(localStorage.getItem("kalensari_products") || "null") || DEFAULT_PRODUCTS.map(p=>({...p}));
let cloudReady = false;
const ORDER_STATUSES = ["menunggu","diproses","dikirim","selesai","dibatalkan","gagal"];
const saveProducts = () => localStorage.setItem("kalensari_products", JSON.stringify(products));
const getLocalOrders = () => { try { return JSON.parse(localStorage.getItem("kalensari_orders") || "[]"); } catch { return []; } };
const saveLocalOrders = rows => localStorage.setItem("kalensari_orders", JSON.stringify(rows));
const normalizePhone = v => String(v||"").replace(/[^0-9]/g, "").replace(/^0/, "62");
// Nomor pesanan singkat: KS-ddmm-XXX (tanggal WIB + 3 huruf/angka acak tanpa O/0/I/1/L)
const KODE_HURUF = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const makeOrderCode = (awal = "KS") => {
  const d = new Date(Date.now() + 7 * 3600 * 1000), tgl = String(d.getUTCDate()).padStart(2, "0") + String(d.getUTCMonth() + 1).padStart(2, "0");
  const r = new Uint32Array(3); crypto.getRandomValues(r);
  return `${awal}-${tgl}-${[...r].map(x => KODE_HURUF[x % KODE_HURUF.length]).join("")}`;
};
/* Baca pesanan lewat fungsi server (supabase-keamanan-baca.sql); bila belum ada, cara lama */
const bacaAman=(fn,body,lama)=>window.KSPesanan?KSPesanan.baca(fn,body,lama):lama();
const sesiPembeli=()=>{try{return localStorage.getItem("kalensari_sesi_pembeli")||""}catch(e){return""}};
const pesananKode=codes=>bacaAman("pesanan_kode",{p_kode:codes},()=>cloudFetch("orders?select=*&order_code=in.("+codes.map(c=>'"'+String(c).replace(/"/g,"")+'"').join(",")+")"));
// Pastikan nomor belum dipakai (sangat jarang terjadi, tapi dicek agar tidak dobel)
async function makeUniqueOrderCode(){
  let c = makeOrderCode();
  if(!CLOUD_CONFIG?.enabled) return c;
  for(let i = 0; i < 5; i++){
    try{ const r = await pesananKode([c]); if(!Array.isArray(r) || !r.length) return c; }catch(e){ return c; }
    c = makeOrderCode();
  }
  return c;
}

const cloudHeaders = () => ({
  apikey: CLOUD_CONFIG?.supabaseAnonKey || "",
  Authorization: `Bearer ${adminAuthToken() || CLOUD_CONFIG?.supabaseAnonKey || ""}`,
  "Content-Type": "application/json",
  Prefer: "return=representation"
});
// ===== LOGIN ADMIN (Supabase Auth) =====
// Sesi admin disimpan di sessionStorage: otomatis keluar saat tab/aplikasi ditutup.
const ADMIN_AUTH_KEY="kalensari_admin_auth";
let adminAuth=(()=>{try{return JSON.parse(sessionStorage.getItem(ADMIN_AUTH_KEY)||"null");}catch{return null;}})();
const saveAdminAuth=a=>{adminAuth=a;try{a?sessionStorage.setItem(ADMIN_AUTH_KEY,JSON.stringify(a)):sessionStorage.removeItem(ADMIN_AUTH_KEY);}catch{}};
function adminAuthToken(){return adminAuth&&adminAuth.access_token&&adminAuth.expires_at*1000>Date.now()?adminAuth.access_token:"";}
async function adminAuthRequest(grant,body){
  const base=String(CLOUD_CONFIG?.supabaseUrl||"").replace(/\/$/,"");
  const r=await fetch(`${base}/auth/v1/token?grant_type=${grant}`,{method:"POST",headers:{apikey:CLOUD_CONFIG.supabaseAnonKey,"Content-Type":"application/json"},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error_description||d.msg||d.message||`HTTP ${r.status}`);
  return {access_token:d.access_token,refresh_token:d.refresh_token,expires_at:d.expires_at||Math.floor(Date.now()/1000)+(d.expires_in||3600),email:d.user&&d.user.email};
}
async function adminEnsureFresh(){
  if(!adminAuth||!adminAuth.refresh_token)return;
  if(adminAuth.expires_at*1000-Date.now()>60000)return;
  try{saveAdminAuth({...await adminAuthRequest("refresh_token",{refresh_token:adminAuth.refresh_token}),email:adminAuth.email});}
  catch(e){console.warn("Sesi admin habis:",e);saveAdminAuth(null);if(typeof adminLoggedIn!=="undefined")adminLoggedIn=false;}
}
async function adminSignIn(email,password){
  const sess=await adminAuthRequest("password",{email,password});
  const base=String(CLOUD_CONFIG.supabaseUrl).replace(/\/$/,"");
  const r=await fetch(`${base}/rest/v1/rpc/is_admin`,{method:"POST",headers:{apikey:CLOUD_CONFIG.supabaseAnonKey,Authorization:`Bearer ${sess.access_token}`,"Content-Type":"application/json"},body:"{}"});
  if(!r.ok)throw new Error("cek-admin-gagal");
  if((await r.json())!==true)throw new Error("bukan-admin");
  saveAdminAuth(sess);return sess;
}
function adminSignOut(){
  const t=adminAuthToken();
  if(t){const base=String(CLOUD_CONFIG?.supabaseUrl||"").replace(/\/$/,"");fetch(`${base}/auth/v1/logout`,{method:"POST",headers:{apikey:CLOUD_CONFIG.supabaseAnonKey,Authorization:`Bearer ${t}`}}).catch(()=>{});}
  saveAdminAuth(null);
}

async function cloudFetch(path, options={}) {
  await adminEnsureFresh();
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
      // Hanya admin yang boleh menulis ke tabel produk (supabase-keamanan-produk.sql); pembeli cukup menampilkan.
      let adm=false;try{adm=!!adminLoggedIn}catch(e){}
      if(products.length>cloudRows.length&&adm) await syncCloudProducts();
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
  const EXTRA=["open_time","close_time","product_group","variant","toppings","topping_limit","min_order","variants"];
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
    if(pendingDeletes.size){
      const del=[...pendingDeletes].filter(Number.isFinite);
      if(del.length) await cloudFetch(`products?id=in.(${del.join(",")})`,{method:"DELETE"});
      pendingDeletes.clear();
    }
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
    await cloudFetch("orders",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(payload)});
    cloudReady=true; return {ok:true,data:payload};
  } catch(e){ console.error("Supabase orders gagal:",e); return {ok:false,error:String(e.message||e)}; }
}
async function saveCloudOrders(list){
  if(!CLOUD_CONFIG?.enabled) return {ok:false,error:"Database online belum aktif."};
  try {
    await cloudFetch("orders",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(list)});
    cloudReady=true; return {ok:true,data:Array.isArray(list)?list:[list]};
  } catch(e){ console.error("Supabase orders gagal:",e); return {ok:false,error:String(e.message||e)}; }
}
async function loadCloudOrders(){
  if(!CLOUD_CONFIG?.enabled) return [];
  return await cloudFetch("orders?select=*&order=created_at.desc&limit=100");
}
async function loadMyCloudOrders(phone,codes){
  if(!CLOUD_CONFIG?.enabled) return [];
  // Aman: dengan akun pembeli -> semua pesanan sendiri; tanpa akun -> hanya pesanan di HP ini (pakai kode)
  if(window.KSPesanan){
    const ss=sesiPembeli();
    try{
      if(ss){const r=await KSPesanan.baca("pesanan_saya",{p_sesi:ss},()=>null);if(r)return r;}
      else{const r=await KSPesanan.baca("pesanan_kode",{p_kode:(codes||[]).slice(0,30)},()=>null);if(r)return r;}
    }catch(e){if(!/fungsi|function/i.test(String(e.message)))throw e;}
  }
  if(!phone) return [];
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
// Promo aktif = ada harga promo dan (tanpa batas waktu atau belum lewat sale_until)
const promoOn = p => !!(p && Number(p.sale)>0 && (!p.sale_until || Date.parse(p.sale_until) > Date.now()));
const promoSisaHari = p => p && p.sale_until ? Math.ceil((Date.parse(p.sale_until)-Date.now())/864e5) : null;
// ===== VARIAN DI DALAM PRODUK: kolom "variants", satu baris = "Nama varian | Harga | habis (opsional)" =====
function parseVariants(p) {
  return String((p&&p.variants)||"").split(/\r?\n/).map(l=>{
    const ps=l.split("|").map(x=>x.trim());if(ps.length<2||!ps[0])return null;
    const price=Number(String(ps[1]).replace(/[^\d]/g,""));if(!Number.isFinite(price)||ps[1]==="")return null;
    return {name:ps[0],price,habis:ps.slice(2).some(x=>/^habis$/i.test(x))};
  }).filter(Boolean);
}
const hasVariants=p=>parseVariants(p).length>0;
const currentPrice = p => { const vs=parseVariants(p); if(vs.length){const ok=vs.filter(v=>!v.habis);return Math.min(...(ok.length?ok:vs).map(v=>v.price));} return promoOn(p) ? p.sale : p.price; };

function priceHTML(p) {
  {const vs=parseVariants(p);if(vs.length){const ok=vs.filter(v=>!v.habis),pr=(ok.length?ok:vs).map(v=>v.price),mn=Math.min(...pr),mx=Math.max(...pr);return mn===mx?rupiah(mn):`Mulai ${rupiah(mn)}`;}}
  if(!promoOn(p)) return rupiah(p.price);
  const h=promoSisaHari(p);
  return `<span class="old-price">${rupiah(p.price)}</span>${rupiah(p.sale)}${h!==null?`<small class="promo-sisa">⏳ Promo berakhir ${h<=1?"hari ini":h+" hari lagi"}</small>`:""}`;
}
// ===== JAM TERSEDIA PRODUK (diatur dari Admin, waktu WIB) =====
const STORE_TIME_ZONE="Asia/Jakarta";
function nowMinutesWIB(){
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:STORE_TIME_ZONE,hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
  const h=Number(parts.find(x=>x.type==="hour").value)%24, m=Number(parts.find(x=>x.type==="minute").value);
  return h*60+m;
}
const timeToMin=t=>{const m=/^(\d{1,2}):(\d{2})/.exec(String(t||""));return m?Number(m[1])*60+Number(m[2]):null};
// Jam tersedia per produk DINONAKTIFKAN: ketersediaan kini mengikuti jam buka/tutup toko (jadwal penjual).
const hasHours=p=>false;
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
const checkAdminPin=async()=>false; // PIN lama tidak dipakai lagi; admin masuk lewat Supabase Auth
// ===== /KODE ADMIN =====
{const saved=normalizePhone(readLS("kalensari_wa_number",""));if(saved.length>=9)WHATSAPP_NUMBER=saved;}
const BASE_CATEGORIES=["Makanan","Minuman"];
const allCategories=()=>[...new Set([...BASE_CATEGORIES,...customCategories,...products.map(p=>p.category).filter(Boolean)])].filter(c=>!removedCategories.includes(c)||products.some(p=>p.category===c));
const sellerKey=n=>String(n||"").trim().toLowerCase();
const shippingFeeFor=n=>{const v=shippingFees[sellerKey(n)],d=Number(shippingFees.__default)||0;return(v===undefined||v===null||v==="")?d:(Number(v)||0);};
// ===== ONGKIR = ongkir pertama toko + tambahan per KM (jarak garis lurus toko TERAKHIR di rute -> titik pembeli) =====
// Titik toko diambil dari lokasi yang disimpan penjual (penjual_members.latitude/longitude, dicocokkan lewat nama toko).
let sellerLocs=readLS("kalensari_seller_locs",{});
const SHIP_FREE_KM=2, SHIP_PER_KM=2500; // bawaan; bisa diubah di Admin > Ongkir
const shipFreeKm=()=>{const v=shippingFees.__freeKm;return(v===undefined||v===null||v==="")?SHIP_FREE_KM:Math.max(0,Number(v)||0);};
const shipPerKm=()=>{const v=shippingFees.__perKm;return(v===undefined||v===null||v==="")?SHIP_PER_KM:Math.max(0,Number(v)||0);};
const validLL=(a,b)=>{a=Number(a);b=Number(b);return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a)<=90&&Math.abs(b)<=180&&!(a===0&&b===0);};
const kmBetween=(a,b)=>{const R=6371,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng),h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));};
const fmtKm=k=>Number(k).toLocaleString("id-ID",{maximumFractionDigits:1});
const buyerPoint=()=>{const la=document.getElementById("ksMapLat")?.value,ln=document.getElementById("ksMapLng")?.value;return(String(la||"").trim()!==""&&String(ln||"").trim()!==""&&validLL(la,ln))?{lat:Number(la),lng:Number(ln)}:null;};
// ===== RUTE KURIR, SATU NOTA =====
// Kurir diarahkan: toko 1 -> toko 2 -> ... -> toko terakhir -> pembeli. Semua toko jadi SATU nota.
// Ongkir = ongkir pertama tiap toko yang disinggahi + tambahan per KM dari TOKO TERAKHIR (titik awal) ke pembeli.
// Urutan: toko tanpa titik lokasi lebih dulu, lalu toko bertitik dari yang TERJAUH ke yang TERDEKAT dengan pembeli
// (jadi toko terakhir = paling dekat pembeli). Sebelum titik pembeli ada, urutan mengikuti keranjang.
// state: ok = jarak terhitung | nobuyer = titik pembeli belum ada | nostore = titik toko terakhir belum disimpan penjual
function shippingRoute(items){
  const m=new Map();
  items.forEach(p=>{const k=sellerKey(p.seller);if(m.has(k))return;const l=sellerLocs[k];
    m.set(k,{name:String(p.seller||"Toko").trim(),base:shippingFeeFor(p.seller),loc:(l&&validLL(l.lat,l.lng))?l:null,km:null});});
  const b=buyerPoint(),all=[...m.values()];
  if(b)all.forEach(s=>{if(s.loc)s.km=kmBetween(s.loc,b);});
  const noLoc=all.filter(s=>!s.loc),withLoc=all.filter(s=>s.loc);
  if(b)withLoc.sort((x,y)=>y.km-x.km);
  const stops=[...noLoc,...withLoc],last=stops[stops.length-1]||null,base=stops.reduce((t,s)=>t+s.base,0);
  const r={stops,last,base,km:null,extra:0,fee:base,state:"ok"};
  if(!last||!last.loc){r.state="nostore";return r;}
  if(!b){r.state="nobuyer";return r;}
  r.km=last.km;
  r.extra=Math.max(0,Math.ceil(r.km-shipFreeKm()-1e-9))*shipPerKm(); // dibulatkan ke atas per KM penuh di atas batas
  r.fee=base+r.extra;
  return r;
}
function shipBreakdownHTML(r){
  if(!r||!r.stops.length)return"";
  const multi=r.stops.length>1,n=r.stops.length;
  const rows=r.stops.map((s,i)=>`<div class="ship-row"><span>${multi?`${i+1}. `:""}🏪 ${esc(s.name)}<small class="ship-sub">${multi?(i===n-1?"Toko terakhir • titik awal hitungan jarak":"Singgah ambil pesanan"):"Ongkir pertama toko"}</small></span><b>${s.base>0?rupiah(s.base):"Gratis"}</b></div>`).join("");
  let sub,val;
  if(r.state==="ok"){sub=`Jarak ${esc(r.last.name)} → pembeli ${fmtKm(r.km)} km`+(r.extra>0?`, lebih ${fmtKm(Math.ceil(r.km-shipFreeKm()-1e-9))} km × ${rupiah(shipPerKm())}`:` (masuk ${fmtKm(shipFreeKm())} km pertama)`);val=r.extra>0?rupiah(r.extra):"Gratis";}
  else if(r.state==="nostore"){sub="Lokasi toko belum diatur penjual";val="–";}
  else{sub=`+${rupiah(shipPerKm())}/km jika lebih dari ${fmtKm(shipFreeKm())} km dari ${esc(r.last.name)}`;val="–";}
  const missing=r.stops.filter(s=>!s.loc).length&&r.state==="ok";
  return`<div class="ship-head">Rute kurir · ${n} toko · 1 nota</div>${rows}<div class="ship-row"><span>🏠 Antar ke pembeli<small class="ship-sub">${sub}</small></span><b>${val}</b></div><p class="ship-note">ℹ️ Kurir mampir ke ${multi?"<b>setiap toko</b> berurutan, lalu":"toko, lalu"} mengantar ke pembeli, semuanya dalam <b>satu nota</b>. Ongkir = ongkir pertama tiap toko + <b>${rupiah(shipPerKm())} per km</b> untuk jarak <b>toko terakhir → pembeli</b> yang lebih dari <b>${fmtKm(shipFreeKm())} km</b> (dibulatkan ke atas).${r.state==="nobuyer"?" Tambahan jarak dihitung otomatis setelah alamat/lokasi dipilih di checkout.":""}${r.state==="nostore"?" Toko tanpa titik lokasi belum bisa dihitung jaraknya; admin akan konfirmasi lewat WhatsApp.":""}${missing?" Ada toko tanpa titik lokasi; urutannya didahulukan dan admin akan konfirmasi bila perlu.":""}</p>`;
}
const shippingTotal=items=>shippingRoute(items).fee;
// ===== JADWAL BUKA/TUTUP OTOMATIS PENJUAL (jam buka, jam tutup, hari libur; waktu WIB) =====
// sellerSchedule: {"nama penjual (huruf kecil)": {o:"08:00", c:"17:00", off:[0..6 libur tiap pekan, 0=Minggu], h:["2026-10-17" tanggal libur khusus]}}
let sellerSchedule=readLS("kalensari_seller_schedule",{});
// tutupToko: {"nama toko (huruf kecil)": {t:"waktu"}} = penjual menutup tokonya sendiri dari Aplikasi Penjual
let tutupToko=readLS("kalensari_tutup_toko",{});
// unggulanToko: {"nama toko (huruf kecil)": [id produk,...]} dipilih penjual (maks 3), tampil paling atas di halaman toko
let unggulanToko=readLS("kalensari_unggulan_toko",{});
const isUnggulan=p=>sellerList(p).some(n=>(unggulanToko[sellerKey(n)]||[]).map(String).includes(String(p.id)));
// Stok: null/kosong = tidak dibatasi
const stokOf=p=>p&&p.stock!=null&&p.stock!==""&&Number.isFinite(Number(p.stock))?Number(p.stock):null;
const qtyDiCart=(id,kecuali)=>cart.reduce((t,x,i)=>t+(x.id===id&&i!==kecuali?Number(x.qty)||0:0),0);
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
const sellerClosed=n=>!!closedSellers[sellerKey(n)]||!!tutupToko[sellerKey(n)]||!scheduleState(n).open;
const sellerWhy=p=>{const n=sellerList(p).find(sellerClosed);if(!n)return"";const k=sellerKey(n);return closedSellers[k]||tutupToko[k]?"Penjual sedang tutup":"Penjual sedang tutup • "+scheduleState(n).why;};
const openSellerList=p=>sellerList(p).filter(n=>!sellerClosed(n));
const allSellersClosed=p=>{const l=sellerList(p);return l.length>0&&l.every(sellerClosed);};
async function loadCloudSettings(){
  if(!CLOUD_CONFIG?.enabled)return false;
  try{
    const rows=await cloudFetch("store_settings?select=*&key=not.like.foto_*");
    (Array.isArray(rows)?rows:[]).forEach(r=>{
      if(r.key==="categories"&&Array.isArray(r.value)){customCategories=r.value;localStorage.setItem("kalensari_categories",JSON.stringify(customCategories));}
      if(r.key==="removed_categories"&&Array.isArray(r.value)){removedCategories=r.value;localStorage.setItem("kalensari_removed_categories",JSON.stringify(removedCategories));}
      if(r.key==="kontak_support"&&r.value&&typeof r.value==="object"){try{localStorage.setItem("kalensari_kontak_support",JSON.stringify(r.value));}catch(e){}tampilKontakSupport(r.value);}
      if(r.key==="whatsapp_number"&&typeof r.value==="string"){const n=normalizePhone(r.value);if(n.length>=9&&n.length<=15){WHATSAPP_NUMBER=n;localStorage.setItem("kalensari_wa_number",JSON.stringify(n));applyWaLinks();}}
      if(r.key==="admin_pin_hash"&&typeof r.value==="string"&&/^[0-9a-f]{64}$/.test(r.value)){adminPinHash=r.value;localStorage.setItem("kalensari_admin_pin_hash",JSON.stringify(adminPinHash));}
      if(r.key==="shipping_fees"&&r.value&&typeof r.value==="object"&&!Array.isArray(r.value)){shippingFees=r.value;localStorage.setItem("kalensari_shipping_fees",JSON.stringify(shippingFees));}
      if(r.key==="penjual_members"&&Array.isArray(r.value)){const m={};r.value.forEach(x=>{const nm=sellerKey(x&&(x.toko||x.usaha));if(nm&&validLL(x.latitude,x.longitude))m[nm]={lat:Number(x.latitude),lng:Number(x.longitude)};});sellerLocs=m;localStorage.setItem("kalensari_seller_locs",JSON.stringify(sellerLocs));}
      if(r.key==="seller_schedule"&&r.value&&typeof r.value==="object"&&!Array.isArray(r.value)){sellerSchedule=r.value;localStorage.setItem("kalensari_seller_schedule",JSON.stringify(sellerSchedule));}
      if(r.key==="unggulan_toko"&&r.value&&typeof r.value==="object"&&!Array.isArray(r.value)){unggulanToko=r.value;localStorage.setItem("kalensari_unggulan_toko",JSON.stringify(unggulanToko));}
      if(r.key==="tutup_toko"&&r.value&&typeof r.value==="object"&&!Array.isArray(r.value)){tutupToko=r.value;localStorage.setItem("kalensari_tutup_toko",JSON.stringify(tutupToko));}
      if(r.key==="closed_sellers"&&r.value&&typeof r.value==="object"&&!Array.isArray(r.value)){closedSellers=r.value;localStorage.setItem("kalensari_closed_sellers",JSON.stringify(closedSellers));}
      if(r.key==="penjual_members"&&Array.isArray(r.value)){r.value.forEach(x=>{if(x&&x.id)sellerIdMap[x.id]=sellerKey(x.toko||x.usaha)});}
      if(r.key==="cod_aturan"&&r.value&&typeof r.value==="object"&&!Array.isArray(r.value)){codAturan={...codAturan,...r.value};}
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
    await cloudFetch("store_settings?on_conflict=key",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify([{key:"categories",value:customCategories},{key:"removed_categories",value:removedCategories},{key:"shipping_fees",value:shippingFees},{key:"whatsapp_number",value:WHATSAPP_NUMBER},{key:"closed_sellers",value:closedSellers},{key:"seller_schedule",value:sellerSchedule}])});
    return true;
  }catch(e){
    console.error("Simpan pengaturan toko gagal:",e);
    updateCloudStatus("⚠️ Pengaturan toko baru tersimpan di perangkat ini. Jalankan supabase-pengaturan-toko.sql di Supabase.");
    return false;
  }
}
// Status produk: "Show" = tampil, "Sold Out" = stok habis (tampil tapi tidak bisa dibeli), selain itu (mis. "Hidden" / "Out of Stock" lama) = disembunyikan.
const isSoldOut=p=>p&&(p.status==="Sold Out"||(hasVariants(p)&&parseVariants(p).every(v=>v.habis)));
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
const lewatStok=(p,l)=>{const st=stokOf(products.find(x=>x.id===p.id)||p);return st!==null&&l.filter(x=>x.id===p.id).reduce((t,x)=>t+(Number(x.qty)||0),0)>st;};
const closedCartItems=()=>{const l=selItems();return l.filter(p=>p.status!=="Show"||!isInHours(p)||allSellersClosed(p)||lewatStok(p,l));};
function alertClosedItems(list){
  alert("Produk berikut sedang tidak bisa dipesan:\n\n"+list.map(p=>p.status!=="Show"?`- ${p.name} (stok habis)`:allSellersClosed(p)?`- ${p.name} (penjual ${p.seller} sedang tutup)`:isInHours(p)&&stokOf(p)!==null?`- ${p.name} (stok tinggal ${stokOf(p)}, kurangi jumlahnya)`:`- ${p.name} (jam ${hoursText(p)})`).join("\n")+"\n\nHapus dari keranjang atau pesan lagi saat tersedia.");
}

// ===== FILTER TOKO + URUTAN ACAK 20 MENIT =====
// activeSeller = nama toko (huruf kecil) yang sedang dipilih; "" = semua toko.
let activeSeller="";
// Urutan acak berganti tiap blok 20 menit (sama untuk semua pengunjung). Kunci blok
// dibekukan saat halaman dibuka / "Semua" diklik, supaya produk tidak melompat saat dilihat.
const SHUFFLE_MS=20*60*1000;
const shuffleBlockNow=()=>Math.floor(Date.now()/SHUFFLE_MS);
let shuffleBlock=shuffleBlockNow();
function shuffleKey(id){let h=2166136261^shuffleBlock;const s=String(id);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}h^=h>>>15;h=Math.imul(h,2246822507);h^=h>>>13;return h>>>0;}
const activeSellerName=()=>{if(!activeSeller)return"";for(const p of products){const n=sellerList(p).find(x=>sellerKey(x)===activeSeller);if(n)return n;}return activeSeller;};
const productHasSeller=(p,k)=>sellerList(p).some(n=>sellerKey(n)===k);

function renderCategories() {
  const cats=["Semua",...new Set(products.map(p=>p.category))];
  const tokoLbl=activeSeller?`🏪 ${esc(activeSellerName())}`:"🏪 Toko";
  document.getElementById("categories").innerHTML=cats.map(c=>`<button class="cat ${c===activeCategory&&!(c==="Semua"&&activeSeller)?"active":""}" onclick="setCategory(${JSON.stringify(c).replace(/"/g,'&quot;')})">${esc(c)}</button>`).join("")
    +`<button type="button" class="cat cat-toko${activeSeller?" active":""}" onclick="openShopPanel()">${tokoLbl}</button>`;
  renderSellerBar();
}
function setCategory(c) {
  if(c==="Semua"){activeSeller="";shuffleBlock=shuffleBlockNow();}
  activeCategory=c; renderCategories(); renderProducts();
  document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
function setSeller(k){
  activeSeller=k||"";
  if(!activeSeller)shuffleBlock=shuffleBlockNow();
  activeCategory="Semua";
  closeShopPanel();renderCategories();renderProducts();
  document.getElementById("products")?.scrollIntoView({behavior:"smooth"});
}
// Bar "Produk dari ..." + tombol "× Semua toko" tepat di atas grid produk
function renderSellerBar(){
  const grid=document.getElementById("productGrid");if(!grid)return;
  let bar=document.getElementById("sellerFilterBar");
  if(!bar){bar=document.createElement("div");bar.id="sellerFilterBar";bar.className="seller-filter-bar";grid.parentNode.insertBefore(bar,grid);}
  if(!activeSeller){bar.hidden=true;bar.innerHTML="";return;}
  const n=activeSellerName(),closed=sellerClosed(n);
  bar.hidden=false;
  const sfF=(shopFotos||{})[activeSeller];bar.innerHTML=`<span>${sfF?`<i class="sf-foto" style="background-image:url('${sfF}')"></i>`:"🏪"} Produk dari <b>${esc(n)}</b>${closed?' <em class="sf-closed">Tutup</em>':""}</span><button type="button" onclick="setSeller('')">× Semua toko</button>`;
}
// Daftar toko diambil otomatis dari nama penjual di tiap produk (produk multi-penjual masuk ke tiap toko).
function shopRows(){
  const m=new Map();
  products.filter(isVisible).forEach(p=>sellerList(p).forEach(n=>{
    const k=sellerKey(n);if(!m.has(k))m.set(k,{k,name:n,items:[]});
    const it=m.get(k).items,label=groupName(p)||p.name;if(!it.some(x=>x.toLowerCase()===label.toLowerCase()))it.push(label);
  }));
  return [...m.values()].map(r=>({...r,closed:sellerClosed(r.name)})).sort((a,b)=>(a.closed-b.closed)||a.name.localeCompare(b.name,"id"));
}
const shopInitials=n=>String(n||"").replace(/[^\p{L}\p{N}\s]/gu," ").trim().split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"🏪";
function ensureShopPanel(){
  let el=document.getElementById("shopPanel");if(el)return el;
  el=document.createElement("div");el.id="shopPanel";el.className="shop-sheet";el.hidden=true;
  el.innerHTML=`<div class="shop-sheet-bg" data-close></div><div class="shop-sheet-box" role="dialog" aria-modal="true" aria-labelledby="shopSheetTitle">
    <div class="shop-sheet-grip"></div>
    <div class="shop-sheet-head"><h3 id="shopSheetTitle">Daftar toko</h3><button type="button" class="shop-sheet-x" data-close aria-label="Tutup">✕</button></div>
    <input id="shopSearch" class="shop-search" type="search" placeholder="Cari toko..." autocomplete="off">
    <div id="shopList" class="shop-list"></div></div>`;
  document.body.appendChild(el);
  el.addEventListener("click",e=>{if(e.target.closest("[data-close]"))closeShopPanel();const r=e.target.closest("[data-shop]");if(r)setSeller(r.dataset.shop);});
  el.querySelector("#shopSearch").addEventListener("input",renderShopList);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!el.hidden)closeShopPanel();});
  return el;
}
function renderShopList(){
  const q=(document.getElementById("shopSearch")?.value||"").toLowerCase().trim();
  const rows=shopRows().filter(r=>!q||r.name.toLowerCase().includes(q)||r.items.some(x=>x.toLowerCase().includes(q)));
  document.getElementById("shopList").innerHTML=rows.length?rows.map(r=>`<button type="button" class="shop-row${r.k===activeSeller?" active":""}" data-shop="${esc(r.k)}">
      ${shopFotos[r.k]?`<span class="shop-ava foto" style="background-image:url('${shopFotos[r.k]}')"></span>`:`<span class="shop-ava">${esc(shopInitials(r.name))}</span>`}
      <span class="shop-info"><b>${esc(r.name)}</b><small>${r.items.length} produk · ${esc(r.items.slice(0,2).join(", "))}${r.items.length>2?", …":""}</small></span>
      <span class="shop-st ${r.closed?"off":"on"}">${r.closed?"Tutup":"Buka"}</span></button>`).join("")
    :`<p class="shop-empty">Toko tidak ditemukan.</p>`;
}
function openShopPanel(){
  muatFotoToko();const el=ensureShopPanel();const s=el.querySelector("#shopSearch");s.value="";renderShopList();
  el.hidden=false;document.body.classList.add("shop-open");requestAnimationFrame(()=>el.classList.add("show"));
}
function closeShopPanel(){
  const el=document.getElementById("shopPanel");if(!el||el.hidden)return;
  el.classList.remove("show");document.body.classList.remove("shop-open");setTimeout(()=>{el.hidden=true;},220);
}
// Ikon toko di header, di sebelah kiri keranjang
(function(){
  const cb=document.getElementById("cartBtn");if(!cb||document.getElementById("shopBtn"))return;
  const b=document.createElement("button");b.type="button";b.id="shopBtn";b.className="icon-btn shop-btn";b.title="Daftar toko";b.setAttribute("aria-label","Daftar toko");b.textContent="🏪";
  b.onclick=openShopPanel;cb.parentNode.insertBefore(b,cb);
})();
// Hapus tombol "Toko" lama di samping kolom Cari Produk (sudah diganti chip Toko & ikon header)
(function(){
  const si=document.getElementById("searchInput"),ss=document.getElementById("sortSelect");if(!si)return;
  let box=si.parentElement;while(box&&box!==document.body&&!(ss&&box.contains(ss)))box=box.parentElement;
  if(!box||box===document.body)box=si.closest(".shop-toolbar,.search-box")||si.parentElement;
  box.querySelectorAll("button,a,label,span").forEach(el=>{
    if(el.id==="shopBtn"||el.classList.contains("cat-toko")||el.contains(si)||(ss&&el.contains(ss)))return;
    if(/^\s*(🏪|🏬)?\s*toko\s*$/i.test(el.textContent||""))el.remove();
  });
})();
// ===== VARIAN PRODUK: produk dengan "Nama Grup" sama digabung jadi 1 kartu =====
const groupName=p=>String(p.product_group||"").trim();
const variantLabel=p=>String(p.variant||"").trim()||p.name;
function singleCardHTML(p) {
  const builder=parseToppings(p).length>0, tLimit=Number(p.topping_limit)||0, sClosed=allSellersClosed(p), soldOut=isSoldOut(p), nVar=parseVariants(p).length;
  return `
   <article class="product${soldOut?" soldout":""}">
  <div class="product-img"><img src="${getProductImage(p.image)}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='🖼️'">
        ${soldOut?'<span class="soldout-badge">STOK HABIS</span>':promoOn(p)?'<span class="sale-badge">PROMO</span>':''}${isUnggulan(p)?'<span class="ung-badge">⭐ Unggulan</span>':''}
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <div class="price">${builder?`Racik sendiri${Number(currentPrice(p))>0?` • mulai ${rupiah(currentPrice(p))}`:""}${tLimit?` • maks ${rupiah(tLimit)}`:""}`:priceHTML(p)}</div>
        <small>${nVar?`${nVar} pilihan varian`:p.unit}${!soldOut&&stokOf(p)!==null&&stokOf(p)<=5?` • <b class="sisa">Sisa ${stokOf(p)}</b>`:""}</small><small class="seller">👤 ${p.seller}</small>${hasHours(p)?`<small class="hours${isInHours(p)?"":" closed"}">🕒 ${hoursText(p)}${isInHours(p)?"":" • Belum tersedia"}</small>`:""}
        ${sClosed?`<small class="hours closed">🔒 ${esc(sellerWhy(p))}</small>`:""}
        <div class="product-actions">
          <button class="btn outline" onclick="showProduct(${p.id})">Detail</button>
          ${builder||nVar?`<button class="btn primary" ${isInHours(p)&&!sClosed&&!soldOut?"":"disabled"} onclick="showProduct(${p.id})">${soldOut?"Stok Habis":builder?"Pilih Topping":"Pilih Varian"}</button>`:`<button class="btn primary" ${isInHours(p)&&!sClosed&&!soldOut?"":"disabled"} onclick="addToCart(${p.id})">${soldOut?"Stok Habis":"+ Keranjang"}</button>`}
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
        ${v.every(isSoldOut)?'<span class="soldout-badge">STOK HABIS</span>':v.some(promoOn)?'<span class="sale-badge">PROMO</span>':''}${v.some(isUnggulan)?'<span class="ung-badge">⭐ Unggulan</span>':''}
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
  let list=products.filter(p=>isVisible(p) && (activeCategory==="Semua"||p.category===activeCategory) && (!activeSeller||productHasSeller(p,activeSeller)) && (p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)||String(p.seller||"").toLowerCase().includes(q)||groupName(p).toLowerCase().includes(q)));
  // Bawaan saat "Semua": urutan acak per blok 20 menit (dropdown Urutan tetap diutamakan)
  if(activeCategory==="Semua"&&!activeSeller&&!["priceAsc","price-low","priceDesc","price-high","name"].includes(sort)) list.sort((a,b)=>shuffleKey(groupName(a)||a.id)-shuffleKey(groupName(b)||b.id)||Number(a.id)-Number(b.id));
  // Menu menurut cuaca: hanya di tampilan bawaan "Semua" (tanpa pencarian & tanpa urutan pilihan pembeli)
  if(activeCategory==="Semua"&&!activeSeller&&!q&&!["priceAsc","price-low","priceDesc","price-high","name"].includes(sort)&&KS_CUACA&&KS_CUACA.mode!=="biasa"){const mau=KS_CUACA.mode==="panas"?"dingin":"hangat";list=list.map((p,i)=>[p,i]).sort((a,b)=>(jenisMenu(b[0])===mau)-(jenisMenu(a[0])===mau)||a[1]-b[1]).map(x=>x[0]);}
  if(sort==="priceAsc" || sort==="price-low") list.sort((a,b)=>currentPrice(a)-currentPrice(b));
  if(sort==="priceDesc" || sort==="price-high") list.sort((a,b)=>currentPrice(b)-currentPrice(a));
  if(sort==="name") list.sort((a,b)=>a.name.localeCompare(b.name,"id"));
  if(activeSeller){const ug=(unggulanToko[activeSeller]||[]).map(String),r=p=>{const i=ug.indexOf(String(p.id));return i<0?99:i};list=list.map((p,i)=>[p,i]).sort((a,b)=>r(a[0])-r(b[0])||a[1]-b[1]).map(x=>x[0]);}
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
  renderSellerBar();
  document.getElementById("productGrid").innerHTML=units.length?units.map(u=>u.single?singleCardHTML(u.single):(u.variants.length>1?groupCardHTML(u):singleCardHTML(u.variants[0]))).join(""):`<div class="empty-state"><b>😔 Produk tidak ditemukan</b>Coba kata kunci atau kategori lain.</div>`;
}
// ===== MENU PRASMANAN / RACIK SENDIRI (mis. Seblak Prasmanan) =====
// Topping disimpan di produk sebagai teks, satu baris = "Nama | Harga". Batas belanja per porsi = topping_limit.
function parseToppings(p) {
  return String(p.toppings||"").split(/\r?\n/).map(l=>{
    // "Nama | Harga | foto (opsional) | habis (opsional)"
    const m=/^(.+?)\s*[|=]\s*(?:rp\.?\s*)?([\d.,]+)\s*((?:\|\s*[^|]*?\s*)*)$/i.exec(l.trim());
    if(!m||/^#/.test(l.trim()))return null;
    const price=Number(m[2].replace(/[.,]/g,""));
    const ext=String(m[3]||"").split("|").map(x=>x.trim()).filter(Boolean);
    const img=ext.find(x=>/^(https?:\/\/|img\/|\.\/)/i.test(x))||"";
    const habis=ext.some(x=>/^habis$/i.test(x));
    return m[1].trim()&&Number.isFinite(price)?{name:m[1].trim(),price,img,habis}:null;
  }).filter(Boolean);
}
// Kelompok topping: baris diawali "#" jadi judul kelompok, mis. "# 🥬 SAYUR & PELENGKAP".
// Tambahkan "(pilih 1)" di judul agar pembeli hanya bisa memilih satu, mis. "# 🌶️ LEVEL PEDAS (pilih 1)".
function toppingGroups(p) {
  const g=[];let cur=null,i=0;
  String(p.toppings||"").split(/\r?\n/).forEach(l=>{
    const t=l.trim();if(!t)return;
    const h=/^#\s*(.+)$/.exec(t);
    if(h){cur={judul:h[1].replace(/\(\s*pilih\s*1\s*\)/i,"").trim(),satu:/\(\s*pilih\s*1\s*\)/i.test(h[1]),items:[]};g.push(cur);return;}
    if(!parseToppings({toppings:t}).length)return;
    if(!cur){cur={judul:"",satu:false,items:[]};g.push(cur);}
    cur.items.push(i++);
  });
  return g;
}
function pilihSatuTopping(i) {
  const p=detailProduct;if(!p)return;
  const grp=toppingGroups(p).find(x=>x.items.includes(i));if(!grp)return;
  if(parseToppings(p)[i]&&parseToppings(p)[i].habis){showToast(`${parseToppings(p)[i].name} sedang habis`);return;}
  const lama={...detailToppings};
  grp.items.forEach(j=>{delete detailToppings[j];});
  detailToppings[i]=1;
  const limit=Number(p.topping_limit)||0;
  if(limit&&toppingTotal(p)>limit){detailToppings=lama;showToast(`Melebihi batas ${rupiah(limit)} per porsi`);return;}
  grp.items.forEach(j=>document.getElementById(`tp-${j}`)?.classList.toggle("on",j===i));
  updateToppingSummary();
}
// Foto topping yang diunggah admin / penjual: store_settings "foto_topping_<id produk>" = {foto:{"Nama topping":"data:image/..."}}.
// Dimuat saat popup produk dibuka (tidak membebani daftar produk).
const FOTO_TOPPING={};
const fotoTopping=(p,t)=>((FOTO_TOPPING[p.id]||{})[t.name])||t.img||"";
async function muatFotoTopping(p){
  if(!p||!CLOUD_CONFIG?.enabled)return;
  try{
    const r=await cloudFetch("store_settings?select=value&key=eq."+encodeURIComponent("foto_topping_"+p.id));
    const m=r[0]&&r[0].value&&r[0].value.foto;if(!m||typeof m!=="object")return;
    FOTO_TOPPING[p.id]=m;
    if(detailProduct!==p)return;
    parseToppings(p).forEach((t,i)=>{const f=m[t.name];if(!f)return;const row=document.querySelector(`.topping-row[data-ti="${i}"]`);if(!row)return;
      let im=row.querySelector(".topping-img");if(!im){im=document.createElement("img");im.className="topping-img";im.alt=t.name;row.prepend(im);}im.src=f;});
  }catch(e){}
}
function htmlTopping(p) {
  const tops=parseToppings(p), grps=toppingGroups(p);
  const baris=i=>{const t=tops[i];const fi=fotoTopping(p,t);if(t.habis)return `<div class="topping-row habis" data-ti="${i}">${fi?`<img class="topping-img" src="${esc(fi)}" alt="${esc(t.name)}" loading="lazy" onerror="this.remove()">`:""}<div class="topping-info"><b>${esc(t.name)}</b><small>${t.price?rupiah(t.price):"Gratis"}</small></div><span class="topping-habis">Habis</span></div>`;return `<div class="topping-row" data-ti="${i}">${fi?`<img class="topping-img" src="${esc(fi)}" alt="${esc(t.name)}" loading="lazy" onerror="this.remove()">`:""}<div class="topping-info"><b>${esc(t.name)}</b><small>${t.price?rupiah(t.price):"Gratis"}</small></div><div class="qty"><button type="button" onclick="changeTopping(${i},-1)" aria-label="Kurangi ${esc(t.name)}">−</button><b id="tq-${i}">0</b><button type="button" onclick="changeTopping(${i},1)" aria-label="Tambah ${esc(t.name)}">+</button></div></div>`;};
  if(!grps.some(x=>x.judul))return `<div class="topping-list">${tops.map((t,i)=>baris(i)).join("")}</div>`;
  return grps.map(g=>`<div class="topping-grp">${g.judul?`<div class="topping-gh">${esc(g.judul)}${g.satu?` <small>pilih 1</small>`:""}</div>`:""}`
    +(g.satu?`<div class="topping-satu">${g.items.map(i=>tops[i].habis?`<button type="button" class="topping-chip habis" disabled>${esc(tops[i].name)}<small>Habis</small></button>`:`<button type="button" id="tp-${i}" class="topping-chip" onclick="pilihSatuTopping(${i})">${esc(tops[i].name)}${tops[i].price?`<small>${rupiah(tops[i].price)}</small>`:""}</button>`).join("")}</div>`
      :`<div class="topping-list">${g.items.map(baris).join("")}</div>`)+`</div>`).join("");
}
let detailProduct=null, detailToppings={};
function toppingTotal(p) {
  const tl=parseToppings(p);
  return hargaDasar(p)+Object.entries(detailToppings).reduce((t,[i,q])=>t+(tl[i]?tl[i].price*q:0),0);
}
function updateToppingSummary() {
  const p=detailProduct;if(!p)return;
  const total=toppingTotal(p), limit=Number(p.topping_limit)||0, min=Number(p.min_order)||0, kurang=Math.max(0,min-total);
  const el=document.getElementById("toppingTotal");
  if(el){el.classList.toggle("kurang",kurang>0);el.innerHTML=`<span>Total per porsi</span><b>${rupiah(total)}${limit?` / ${rupiah(limit)}`:""}</b>${limit?`<small>Sisa ${rupiah(Math.max(0,limit-total))}</small>`:""}${min?`<small class="tp-min">${kurang>0?`⚠️ Minimal order ${rupiah(min)} • tambah topping ${rupiah(kurang)} lagi`:`✅ Minimal order ${rupiah(min)} terpenuhi`}</small>`:""}`;}
  const btn=document.getElementById("detailAddBtn");
  if(btn)btn.textContent=`🛒 Tambah ke Keranjang • ${rupiah(total)}`;
}
function changeTopping(i,d) {
  const p=detailProduct;if(!p||!parseToppings(p)[i])return;
  if(d>0&&parseToppings(p)[i].habis){showToast(`${parseToppings(p)[i].name} sedang habis`);return;}
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
let detailQty=1, detailSeller="", detailSellers=[], detailVarian=-1;
const hargaDasar=p=>{const vs=parseVariants(p);return vs.length&&detailProduct===p&&vs[detailVarian]?vs[detailVarian].price:(Number(currentPrice(p))||0);};
function pilihVarian(i){
  const p=detailProduct,vs=parseVariants(p);if(!vs[i])return;if(vs[i].habis){showToast(`${vs[i].name} sedang habis`);return;}
  detailVarian=i;document.querySelectorAll("#varianPicker .variant-chip").forEach((b,k)=>b.classList.toggle("active",k===i));document.getElementById("varianPicker")?.classList.remove("need");
  const pr=document.getElementById("detailPrice");if(pr&&!parseToppings(p).length)pr.textContent=rupiah(vs[i].price);
  if(parseToppings(p).length)updateToppingSummary();else{const b=document.getElementById("detailAddBtn");if(b)b.textContent=`🛒 Tambah ke Keranjang • ${rupiah(vs[i].price)}`;}
}
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
  const pvs=detailProduct?parseVariants(detailProduct):[];
  if(pvs.length&&!pvs[detailVarian]){document.getElementById("varianPicker")?.classList.add("need");document.getElementById("varianPicker")?.scrollIntoView({behavior:"smooth",block:"center"});showToast("Pilih varian dulu");return;}
  const vNama=pvs.length?pvs[detailVarian].name:null;
  if(!detailSeller){
    document.getElementById("sellerPicker")?.classList.add("need");
    showToast("Pilih nama toko dulu");return;
  }
  const tl=detailProduct?parseToppings(detailProduct):[];
  if(tl.length){
    const chosen=Object.entries(detailToppings).filter(([,q])=>q>0).map(([i,q])=>[tl[i].name,tl[i].price,q]);
    const kurang=toppingGroups(detailProduct).find(g=>g.satu&&!g.items.some(i=>detailToppings[i]>0));
    if(kurang){showToast(`Pilih ${kurang.judul.replace(/^[^A-Za-z0-9]+/,"").toLowerCase()||"pilihan"} dulu`);return;}
    if(!chosen.some(([,pr])=>pr>0)){showToast("Pilih minimal 1 topping");return;}
    const minO=Number(detailProduct.min_order)||0, tot=toppingTotal(detailProduct);
    if(minO&&tot<minO){showToast(`Minimal order ${rupiah(minO)} per porsi. Tambah topping ${rupiah(minO-tot)} lagi`);document.getElementById("toppingTotal")?.scrollIntoView({behavior:"smooth",block:"center"});return;}
    addToCart(id,detailQty,detailSeller,vNama?{t:chosen,v:vNama}:{t:chosen});
  } else addToCart(id,detailQty,detailSeller,vNama?{v:vNama}:undefined);
  closeModal("productModal");
}
function gantiFotoDetail(btn,src) {
  const m=document.getElementById("detailMainImg");if(m){m.style.display="";m.src=src;}
  btn.parentElement.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b===btn));
}
function showProduct(id) {
  const p=products.find(x=>x.id===id);
  detailProduct=p;detailToppings={};
  const pv=parseVariants(p);detailVarian=pv.filter(v=>!v.habis).length===1?pv.findIndex(v=>!v.habis):-1;
  detailQty=1;detailSellers=openSellerList(p);detailSeller=detailSellers.length===1?detailSellers[0]:(detailSellers.find(n=>activeSeller&&sellerKey(n)===activeSeller)||"");
  const gname=groupName(p);
  const variants=gname?products.filter(x=>isVisible(x)&&groupName(x).toLowerCase()===gname.toLowerCase()):[];
  const isGroup=variants.length>1;
  const tops=parseToppings(p), isBuilder=tops.length>0, tLimit=Number(p.topping_limit)||0;
  const sold=p.status!=="Show", closedNow=!sold&&!isInHours(p), sellerShut=!sold&&allSellersClosed(p), unavailable=sold||closedNow||sellerShut;
  document.getElementById("productDetail").innerHTML=`
    <div class="detail">
      <div class="detail-img">${(()=>{const fs=productImages(p);return `<img id="detailMainImg" src="${getProductImage(fs[0]||"")}" alt="${p.name}" onerror="this.style.display='none'" onload="this.style.objectFit=this.naturalHeight>this.naturalWidth*1.15?'contain':'cover'"${fs.length>1?` onclick="window.open(this.src,'_blank')" style="cursor:zoom-in" title="Ketuk untuk memperbesar"`:""}>`+(fs.length>1?`<div class="detail-thumbs">${fs.map((f,k)=>`<button type="button" class="${k?"":"on"}" onclick="gantiFotoDetail(this,'${esc(getProductImage(f))}')" aria-label="Foto ${k+1}"><img src="${esc(getProductImage(f))}" alt="" loading="lazy"></button>`).join("")}</div>`:"");})()}</div>
      <div>
        <p class="eyebrow">${p.category} • ${p.seller}</p>
        <h2>${isGroup?esc(gname):p.name}</h2>
        ${isGroup?`<div class="variant-pick"><span class="seller-pick-title">Pilih Varian</span><div class="variant-picker">${variants.map(v=>`<button type="button" class="variant-chip${v.id===p.id?" active":""}" onclick="showProduct(${v.id})"><b>${esc(variantLabel(v))}</b><small>${isSoldOut(v)?"Habis":rupiah(currentPrice(v))}</small></button>`).join("")}</div></div>`:""}
        <div class="price" id="detailPrice">${isBuilder?`Racik sendiri${Number(currentPrice(p))>0?` • mulai ${rupiah(currentPrice(p))}`:""}${tLimit?` • maks ${rupiah(tLimit)}`:""}`:pv[detailVarian]?rupiah(pv[detailVarian].price):priceHTML(p)}</div>${pv.length?`<div class="variant-pick"><span class="seller-pick-title">Pilih Varian</span><div class="variant-picker" id="varianPicker">${pv.map((v,i)=>`<button type="button" class="variant-chip${i===detailVarian?" active":""}${v.habis?" habis":""}" ${v.habis?"disabled":""} onclick="pilihVarian(${i})"><b>${esc(v.name)}</b><small>${v.habis?"Habis":rupiah(v.price)}</small></button>`).join("")}</div></div>`:""}${isBuilder&&Number(p.min_order)>0?`<p class="tp-min-info">🧾 Minimal order <b>${rupiah(p.min_order)}</b> per porsi</p>`:""}
        <p>Satuan: ${p.unit}</p>
        <p>${sold?"Stok habis.":sellerShut?sellerWhy(p)+", produk belum bisa dipesan.":closedNow?"Saat ini di luar jam tersedia.":"Produk tersedia untuk dipesan."}</p>
        ${hasHours(p)?`<p class="hours-line${closedNow?" closed":""}">🕒 Tersedia setiap hari pukul ${hoursText(p)}</p>`:""}
        ${unavailable?"":`<div class="seller-pick"><span class="seller-pick-title">Pilih Toko</span><div id="sellerPicker" class="seller-picker">${detailSellers.map((n,i)=>`<button type="button" class="seller-chip${detailSeller===n?" active":""}" onclick="selectDetailSeller(${i})">🏪 ${esc(n)}</button>`).join("")}</div></div>
        ${isBuilder?`<div class="topping-box"><span class="seller-pick-title">Pilih Topping${tLimit?` <small>(total maks ${rupiah(tLimit)} per porsi)</small>`:""}</span>${htmlTopping(p)}<div id="toppingTotal" class="topping-total"></div></div>`:""}
        <div class="detail-qty"><span>Jumlah</span><div class="qty"><button type="button" onclick="changeDetailQty(${p.id},-1)" aria-label="Kurangi jumlah">−</button><b id="detailQtyValue">1</b><button type="button" onclick="changeDetailQty(${p.id},1)" aria-label="Tambah jumlah">+</button></div></div>`}
        <button id="detailAddBtn" class="btn primary full" ${unavailable?"disabled":""} onclick="addDetailToCart(${p.id})">🛒 Tambah ke Keranjang</button>
      </div>
    </div>`;
  openModal("productModal");
  if(isBuilder){updateToppingSummary();muatFotoTopping(p);}
}
function addToCart(id,qty=1,seller,custom) {
  const p=products.find(x=>x.id===id); if(!p||p.status!=="Show"){if(p&&isSoldOut(p))showToast(`${p.name} sedang habis`);return;}
  if(!isInHours(p)){showToast(`${p.name} tersedia pukul ${hoursText(p)}`);return;}
  if(allSellersClosed(p)){showToast("Penjual sedang tutup");return;}
  if(seller&&sellerClosed(seller)){showToast(`${seller} sedang tutup`);return;}
  if(!custom&&parseToppings(p).length){showProduct(id);showToast("Pilih topping dulu");return;}
  if(!(custom&&custom.v)&&hasVariants(p)){showProduct(id);showToast("Pilih varian dulu");return;}
  if(seller===undefined){
    // Produk dengan lebih dari satu toko: minta pelanggan memilih toko di popup Detail.
    const list=openSellerList(p);
    const pick=activeSeller&&list.find(n=>sellerKey(n)===activeSeller);
    if(pick)list.splice(0,list.length,pick);
    if(list.length>1){showProduct(id);showToast("Pilih nama toko dulu");return;}
    seller=list[0]||p.seller||"";
  }
  qty=Math.max(1,parseInt(qty)||1);
  {const st=stokOf(p),ada=qtyDiCart(id);if(st!==null&&ada+qty>st){if(st-ada<=0){showToast(`Stok ${p.name} tinggal ${st}${ada?`, sudah ${ada} di keranjang`:""}`);return;}qty=st-ada;showToast(`Stok ${p.name} tinggal ${st}`);}}
  const sig=custom?JSON.stringify([custom.v||"",custom.t||[]]):"";
  const item=cart.find(x=>x.id===id&&(x.seller||"")===seller&&(x.custom?JSON.stringify([x.custom.v||"",x.custom.t||[]]):"")===sig); if(item){item.qty+=qty;delete item.off;} else cart.push(custom?{id,qty,seller,custom}:{id,qty,seller});
  saveCart();updateCartCount();renderCart();showToast(`${qty>1?qty+"× ":""}${p.name}${custom&&custom.v?" ("+custom.v+")":""} • ${seller} ditambahkan ke keranjang`);
}
function changeQty(idx,d) {
  const item=cart[idx];if(!item)return;
  if(d>0){const p=products.find(x=>x.id===item.id),st=stokOf(p);if(st!==null&&qtyDiCart(item.id)+d>st){showToast(`Stok ${p.name} tinggal ${st}`);return;}}
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
    if(!i.custom&&hasVariants(p)){row.varHilang=true;row.name=`${p.name} (pilih varian)`;row.variants=null;}
    else if(i.custom&&i.custom.v&&!i.custom.t){
      // Item dengan varian: harga varian terbaru dari Admin/penjual
      const v=parseVariants(p).find(x=>x.name===i.custom.v);
      row.name=`${p.name} (${i.custom.v})`;row.price=v?v.price:0;row.sale=null;row.variants=null;row.varian=i.custom.v;
      if(!v)row.varHilang=true;else if(v.habis)row.varHabis=true;
    } else if(i.custom){
      // Item racik sendiri: harga = harga dasar + topping (harga topping terbaru dari Admin), nama memuat daftar topping.
      const tl=parseToppings(p);
      const habis=i.custom.t.filter(([n])=>{const cur=tl.find(x=>x.name===n);return cur&&cur.habis;});
      if(habis.length){i.custom.t=i.custom.t.filter(([n])=>!habis.some(h=>h[0]===n));setTimeout(()=>{saveCart();showToast(`⚠️ Topping ${habis.map(h=>h[0]).join(", ")} sedang habis, dikeluarkan dari ${p.name}`);},0);}
      const parts=i.custom.t.map(([n,pr,q])=>{const cur=tl.find(x=>x.name===n);return {n,pr:cur?cur.price:pr,q};});
      const vv=i.custom.v?parseVariants(p).find(x=>x.name===i.custom.v):null;
      row.name=`${p.name} (${[i.custom.v,...parts.map(x=>x.q>1?`${x.n} x${x.q}`:x.n)].filter(Boolean).join(", ")})`;
      row.price=(i.custom.v?(vv?vv.price:0):(Number(currentPrice(p))||0))+parts.reduce((t,x)=>t+x.pr*x.q,0);row.variants=null;if(i.custom.v)row.varian=i.custom.v;
      if(i.custom.v&&!vv)row.varHilang=true;else if(vv&&vv.habis)row.varHabis=true;
      if(Number(p.min_order)>0&&row.price<Number(p.min_order))row.kurangMin=Number(p.min_order)-row.price;
      row.sale=null;
    }
    return row;
  }).filter(Boolean);
}
// ===== KERANJANG PER TOKO (centang toko yang mau di-checkout; ongkir dihitung per toko) =====
// Centang per produk disimpan di item keranjang (off:true = tidak ikut checkout). Centang toko = centang semua produknya.
function cartGroups(){
  const m=new Map();
  cartData().forEach(p=>{const k=sellerKey(p.seller);if(!m.has(k))m.set(k,{k,name:String(p.seller||"Toko").trim(),all:[]});p.on=!(cart[p.idx]&&cart[p.idx].off);m.get(k).all.push(p);});
  // SATU KURIR per checkout: rute toko 1 -> toko 2 -> ... -> pembeli. Tiap nota = ongkir pertama tokonya;
  // tambahan jarak (toko terakhir -> pembeli) masuk ke nota toko terakhir. Total ongkir = rute gabungan.
  const gs=[...m.values()].map(g=>{const items=g.all.filter(p=>p.on),sub=items.reduce((s,p)=>s+currentPrice(p)*p.qty,0);
    return {...g,items,sub,on:items.length>0,full:items.length===g.all.length,closed:items.some(p=>allSellersClosed(p))};});
  const route=shippingRoute(gs.filter(g=>g.on).flatMap(g=>g.items)),lastK=route.last?sellerKey(route.last.name):"";
  return gs.map(g=>{const last=g.on&&g.k===lastK,base=shippingFeeFor(g.name);
    return {...g,route,last,base,urut:route.stops.findIndex(x=>sellerKey(x.name)===g.k)+1,fee:g.on?base+(last?route.extra:0):0};});
}
const selItems=()=>cartGroups().filter(g=>g.on).flatMap(g=>g.items);
function setOff(idxs,off){idxs.forEach(i=>{if(cart[i]){if(off)cart[i].off=true;else delete cart[i].off;}});saveCart();renderCart();}
function toggleProduk(idx){setOff([idx],!(cart[idx]&&cart[idx].off));}
function toggleToko(k){const g=cartGroups().find(x=>x.k===k);if(g)setOff(g.all.map(p=>p.idx),g.full);}
function toggleSemuaToko(){const gs=cartGroups(),all=gs.every(g=>g.full);setOff(gs.flatMap(g=>g.all.map(p=>p.idx)),all);}
function ongkirTeks(g){
  if(!g.on)return{v:rupiah(0),s:"tidak dipilih"};
  const multi=g.route.stops.length>1,ke=multi?` • ${g.last?"jemputan terakhir":`jemputan ke-${g.urut}`}`:"";
  if(g.last&&g.route.state==="nostore")return{v:rupiah(g.base),s:"lokasi toko belum diatur • admin konfirmasi"};
  return{v:g.base>0?rupiah(g.base):"Gratis",s:`ongkir pertama toko${ke}`};
}
// Tambahan jarak (toko terakhir -> rumah pembeli) ditampilkan sebagai baris sendiri di bawah nota terakhir
function jarakInfo(sel){
  const g=sel.find(x=>x.last);if(!g)return null;const r=g.route;
  if(r.state==="ok"){const lebih=Math.max(0,Math.ceil(r.km-shipFreeKm()-1e-9));
    return{v:r.extra>0?rupiah(r.extra):"Gratis",extra:r.extra,s:`${esc(g.name)} → rumah Anda ${fmtKm(r.km)} km • ${fmtKm(shipFreeKm())} km pertama gratis${lebih>0?` • ${lebih} km × ${rupiah(shipPerKm())}`:""}`};}
  if(r.state==="nobuyer")return{v:"–",extra:0,s:`${rupiah(shipPerKm())}/km jika lebih dari ${fmtKm(shipFreeKm())} km dari ${esc(g.name)} • dihitung setelah alamat dipilih`};
  return null;
}
function renderCart() {
  const gs=cartGroups(),sel=gs.filter(g=>g.on),subtotal=sel.reduce((t,g)=>t+g.sub,0),shipping=sel.reduce((t,g)=>t+g.fee,0);
  const semua=gs.length&&gs.every(g=>g.full);
  document.getElementById("cartItems").innerHTML=gs.length?(gs.reduce((t,g)=>t+g.all.length,0)>1?`<label class="cg-all"><input type="checkbox" ${semua?"checked":""} data-ind="${sel.length&&!semua?1:""}" onchange="toggleSemuaToko()"> Pilih semua <small>(${sel.reduce((t,g)=>t+g.items.length,0)}/${gs.reduce((t,g)=>t+g.all.length,0)} produk dipilih)</small></label>`:"")
    +gs.slice().sort((a,b)=>(b.on-a.on)||(a.urut-b.urut)).map(g=>{const o=ongkirTeks(g);return `<div class="cg${g.on?"":" off"}">
    <label class="cg-head"><input type="checkbox" ${g.full?"checked":""} data-ind="${g.on&&!g.full?1:""}" onchange="toggleToko('${esc(g.k).replace(/'/g,"&#39;")}')"><span>🏪 <b>${esc(g.name)}</b>${g.closed?' <em class="cg-tutup">Tutup</em>':""}</span></label>
    ${g.all.map(p=>`<div class="cart-row${p.on?"":" off"}"><input class="cr-cek" type="checkbox" ${p.on?"checked":""} onchange="toggleProduk(${p.idx})" aria-label="Pilih ${esc(p.name)}"><div class="cr-foto">${p.image?`<img src="${getProductImage(p.image)}" alt="" loading="lazy" onerror="this.remove()">`:""}<span>🍽️</span></div><div class="cart-info"><div class="cart-name">${p.name}</div><div class="cart-price">${rupiah(currentPrice(p))} × ${p.qty}</div>${p.varHabis||p.varHilang?`<small style="display:block;color:#b3261e;font-weight:700">⚠️ Varian ${p.varHilang?"sudah tidak dijual":"sedang habis"} — hapus item ini</small>`:p.kurangMin?`<small style="display:block;color:#b33d00;font-weight:700">⚠️ Kurang ${rupiah(p.kurangMin)} dari minimal order</small>`:""}</div>
      <div class="qty"><button onclick="changeQty(${p.idx},-1)">−</button><b>${p.qty}</b><button onclick="changeQty(${p.idx},1)">+</button></div>
      <button class="cart-remove" type="button" title="Hapus produk" aria-label="Hapus ${p.name} dari keranjang" onclick="removeFromCart(${p.idx})">🗑️</button></div>`).join("")}
    <div class="cg-ship"><span>🛵 Ongkir<small>${o.s}</small></span><b>${o.v}</b></div>
    <div class="cg-sum"><span>Total toko ini</span><b>${rupiah(g.sub+(g.on?g.base:0))}</b></div></div>`}).join("")
    +(()=>{const j=jarakInfo(sel);return j?`<div class="cg cg-jarak"><div class="cg-ship" style="border-top:0;padding-top:2px"><span>📏 <b>Tambahan jarak</b><small>${j.s}</small></span><b>${j.v}</b></div></div>`:""})()
    +(gs.length>1?`<p class="cg-note">ℹ️ Tiap toko jadi <b>nota terpisah</b>, tapi semuanya dijemput & diantar <b>1 kurir</b>${sel.length>1&&sel[0].route.stops.length>1?` (rute: ${sel[0].route.stops.map(x=>esc(x.name)).join(" → ")} → rumah Anda)`:""}. Produk yang tidak dicentang tetap tersimpan di keranjang.</p>`:"")
    :`<div class="empty-state"><b>🛒 Keranjang masih kosong</b>Yuk pilih makanan atau minuman favoritmu.</div>`;
  document.querySelectorAll('#cartItems [data-ind="1"]').forEach(x=>{x.indeterminate=true});
  document.getElementById("cartItemLabel").textContent=`${cart.reduce((s,i)=>s+i.qty,0)} item`;
  document.getElementById("cartSubtotal").textContent=rupiah(subtotal);
  document.getElementById("cartShipping").textContent=rupiah(shipping);
  {const old=document.getElementById("cartShipBreakdown");if(old)old.hidden=true;}
  {const tot=document.querySelector("#checkoutForm .checkout-total");if(tot){let cb=document.getElementById("coShipBreakdown");if(!cb){cb=document.createElement("div");cb.id="coShipBreakdown";cb.className="ship-breakdown";tot.insertAdjacentElement("beforebegin",cb);}
    cb.hidden=!sel.length;cb.innerHTML=`<div class="ship-head">${sel.length>1?`${sel.length} toko • ${sel.length} nota • 1 kurir`:"Rincian pesanan"}</div>`+sel.slice().sort((a,b)=>a.urut-b.urut).map((g,i)=>{const o=ongkirTeks(g);return `<div class="ship-row"><span>${sel.length>1?`Nota ${i+1} • `:""}🏪 ${esc(g.name)}<small class="ship-sub">Barang ${rupiah(g.sub)} • Ongkir ${o.v} (${o.s})</small></span><b>${rupiah(g.sub+g.base)}</b></div>`}).join("")
      +(()=>{const j=jarakInfo(sel);return j?`<div class="ship-row ship-jarak"><span>📏 Tambahan jarak<small class="ship-sub">${j.s}</small></span><b>${j.v}</b></div>`:""})()
      +(sel.length>1?`<p class="ship-note">🛵 Satu kurir menjemput ${sel[0].route.stops.map(x=>esc(x.name)).join(" → ")} lalu mengantar ke rumah Anda. ${"QRIS"===String(document.querySelector('#checkoutForm select[name="payment"]')?.value||"")?"Bayar QRIS cukup <b>sekali</b> untuk semua nota.":""}</p>`:"");}}
  document.getElementById("cartTotal").textContent=rupiah(subtotal+shipping);
  document.getElementById("checkoutTotal").textContent=rupiah(subtotal+shipping);
  document.getElementById("checkoutBtn").disabled=!sel.length;
  {const b=document.getElementById("checkoutBtn");if(b&&b.dataset.t0===undefined)b.dataset.t0=b.textContent;if(b)b.textContent=gs.length>1&&sel.length?`${b.dataset.t0} (${sel.length} toko)`:b.dataset.t0;}
  renderCekPesan();
}
function updateCartCount() {document.getElementById("cartCount").textContent=cart.reduce((s,i)=>s+i.qty,0);}
function openModal(id) {document.getElementById(id).classList.add("show")}
function closeModal(id) {document.getElementById(id).classList.remove("show")}

// ===== GOOGLE MAPS KALENSARI STORE V14 =====
function ksMapsSearch(q){ return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`; }
function ksMapsNavigate(q){ return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving&dir_action=navigate`; }
// --- Checkout: nama & WhatsApp otomatis dari akun pembeli; alamat = rumah atau lokasi saat ini ---
let checkoutBuyer=null, gpsLat="", gpsLng="";
const phoneShow=wa=>String(wa||"").replace(/^62/,"0");
async function loadBuyer(){
  let wa=null; try{ const v=JSON.parse(localStorage.getItem("kalensari_pembeli_login")||"null"); if(v&&v.wa&&v.exp>Date.now()) wa=v.wa; }catch(e){}
  if(!wa) wa=sessionStorage.getItem("kalensari_pembeli_sess"); if(!wa) return null;
  // data pembeli dibaca lewat server dengan sesi masuk (data warga tidak lagi terbuka di web)
  let sesi="";try{sesi=localStorage.getItem("kalensari_sesi_pembeli")||"";}catch(e){}
  if(!sesi||!CLOUD_CONFIG?.enabled) return null;
  let j=null;try{const base=String(CLOUD_CONFIG.supabaseUrl).replace(/\/$/,"");const r=await fetch(base+"/rest/v1/rpc/akun_saya",{method:"POST",headers:{apikey:CLOUD_CONFIG.supabaseAnonKey,Authorization:"Bearer "+CLOUD_CONFIG.supabaseAnonKey,"Content-Type":"application/json"},body:JSON.stringify({p_sesi:sesi,p_peran:"pembeli"})});j=await r.json();}catch(e){return null;}
  if(!j||!j.ok){if(j&&j.sesi_habis){try{localStorage.removeItem("kalensari_sesi_pembeli");localStorage.removeItem("kalensari_pembeli_login");sessionStorage.removeItem("kalensari_pembeli_sess");}catch(e){}}return null;}
  if(j.wa) wa=j.wa;
  const m=j.data||{};
  try{localStorage.setItem("kalensari_pembeli_login",JSON.stringify({wa,exp:Date.now()+365*864e5}));}catch(e){}
  const al=Array.isArray(m.alamat_list)?m.alamat_list:[],u=al.find(x=>x.id===m.alamat_utama)||al[0];
  return {wa, nama:String(m.nama||"").trim()||"Pembeli", alamat:String(m.alamat||"").trim(), lat:m.latitude, lng:m.longitude, label:u&&u.label||"Rumah", nAlamat:al.length};
}
const okCoord=(la,ln)=>{la=Number(la);ln=Number(ln);return Number.isFinite(la)&&Number.isFinite(ln)&&!(la===0&&ln===0);};
function renderCheckoutBuyer(){
  const b=checkoutBuyer; if(!b) return;
  document.getElementById("coBuyer").innerHTML=`<b>👤 Pemesan</b><div>${esc(b.nama)}</div><div>📱 ${esc(phoneShow(b.wa))}</div><small>Data otomatis dari akun warga. <a href="dashboard-pembeli.html">Ubah</a></small>`;
  document.querySelectorAll('#checkoutForm [name="addrMode"]').forEach(r=>r.checked=false);
  document.getElementById("coRumah").hidden=true; document.getElementById("coLokasi").hidden=true;
  document.getElementById("ksMapLat").value=""; document.getElementById("ksMapLng").value="";
}
function setupCheckoutMaps(){
  const form=document.getElementById("checkoutForm");
  if(!form || form.dataset.coWired) return; form.dataset.coWired="1";
  const rumah=document.getElementById("coRumah"), lok=document.getElementById("coLokasi"),
    status=document.getElementById("ksMapStatus"), getBtn=document.getElementById("ksGetLocation"), openBtn=document.getElementById("ksOpenMap"),
    latEl=document.getElementById("ksMapLat"), lngEl=document.getElementById("ksMapLng");
  const showGps=()=>{ if(okCoord(gpsLat,gpsLng)){ status.textContent=`✅ Lokasi tersimpan: ${Number(gpsLat).toFixed(6)}, ${Number(gpsLng).toFixed(6)}`; openBtn.style.display="block"; openBtn.onclick=()=>window.open(ksMapsSearch(`${gpsLat},${gpsLng}`),"_blank","noopener"); } else { status.textContent="Belum ada lokasi dipilih."; openBtn.style.display="none"; } };
  form.querySelectorAll('[name="addrMode"]').forEach(r=>r.addEventListener("change",()=>{
    const mode=r.value; if(!r.checked) return;
    rumah.hidden=mode!=="rumah"; lok.hidden=mode!=="lokasi";
    if(mode==="rumah"){
      const b=checkoutBuyer;
      if(!b||!b.alamat){
        showToast("Alamat belum diisi. Mengarahkan ke akun warga...");
        sessionStorage.setItem("kalensari_next","checkout");
        setTimeout(()=>{ksGo("dashboard-pembeli.html");},1200); return;
      }
      rumah.innerHTML=`<div><b>${esc(b.label||"Rumah")}</b> • ${esc(b.alamat)}</div>${okCoord(b.lat,b.lng)?"<small>✅ Titik Google Maps tersimpan</small>":""}<small style="display:block;color:#8b6d5c;margin-top:4px">Alamat utama dari akun warga.${b.nAlamat>1?" Ganti alamat utama di <a href=\"dashboard-pembeli.html\">akun</a>.":""}</small>`;
      latEl.value=okCoord(b.lat,b.lng)?Number(b.lat):""; lngEl.value=okCoord(b.lat,b.lng)?Number(b.lng):"";
    } else { latEl.value=gpsLat; lngEl.value=gpsLng; showGps(); }
    renderCart();
  }));
  getBtn.onclick=()=>{
    if(!navigator.geolocation){status.textContent="Browser tidak mendukung lokasi.";return;}
    status.textContent="📍 Mengambil lokasi...";
    navigator.geolocation.getCurrentPosition(pos=>{gpsLat=pos.coords.latitude.toFixed(6);gpsLng=pos.coords.longitude.toFixed(6);latEl.value=gpsLat;lngEl.value=gpsLng;showGps();renderCart();},
      err=>{status.textContent=err.code===1?"Izin lokasi diblokir. Klik ikon gembok di alamat → Lokasi → Izinkan, atau pilih Alamat rumah.":"Lokasi tidak bisa diperoleh. Coba lagi atau pilih Alamat rumah.";},
      {enableHighAccuracy:true,timeout:15000,maximumAge:60000});
  };
}
setupCheckoutMaps();

document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("show")}));
// ===== Cek sebelum checkout: penjual buka & ada kurir aktif. Alasannya ditampilkan ke pembeli. =====
let KS_KURIR=null; // jumlah kurir aktif (null = belum/ tidak bisa dicek -> tidak memblokir)
async function jumlahKurirAktif(){
  if(!CLOUD_CONFIG?.enabled) return null;
  try{
    const rows=await cloudFetch("store_settings?select=key,value&key=in.(kurir_members,kurir_biaya)");
    const S={};(rows||[]).forEach(r=>{S[r.key]=r.value;});
    let siap=(Array.isArray(S.kurir_members)?S.kurir_members:[]).filter(m=>m&&m.id&&m.pending!==true&&m.aktif!==false);
    const b=S.kurir_biaya&&typeof S.kurir_biaya==="object"?S.kurir_biaya:{};
    if(b.aktif){
      const min=b.mode==="persen"?(Number(b.minSaldo)||1000):Math.max(Number(b.minSaldo)||0,Number(b.potong)||0);
      try{const s={};(await cloudFetch("kurir_saldo?select=kurir_id,saldo")).forEach(x=>{s[x.kurir_id]=Number(x.saldo)||0;});siap=siap.filter(m=>(s[m.id]||0)>=min);}catch(e){}
    }
    return siap.length;
  }catch(e){ return null; }
}
function alasanTidakBisaPesan(){
  const a=[],closed=closedCartItems();
  const tutup=[...new Set(closed.filter(p=>p.status==="Show"&&allSellersClosed(p)).map(p=>p.seller).filter(Boolean))];
  if(tutup.length) a.push(`🏪 Toko <b>${esc(tutup.join(", "))}</b> sedang tutup. Hapus produknya dari keranjang atau pesan lagi saat toko buka.`);
  const habis=closed.filter(p=>p.status!=="Show").map(p=>p.name);
  if(habis.length) a.push(`📦 Stok habis: <b>${esc(habis.join(", "))}</b>. Hapus dari keranjang untuk melanjutkan.`);
  const jam=closed.filter(p=>p.status==="Show"&&!allSellersClosed(p)&&!isInHours(p));
  if(jam.length) a.push(`🕒 Belum waktunya: ${jam.map(p=>`<b>${esc(p.name)}</b> (tersedia ${esc(hoursText(p))})`).join(", ")}.`);
  if(KS_KURIR===0) a.push("🛵 Belum ada kurir yang aktif saat ini, jadi pesanan belum bisa diantar. Silakan coba lagi beberapa saat lagi.");
  return a;
}
function renderCekPesan(){
  const btn=document.getElementById("checkoutBtn");if(!btn)return;
  let box=document.getElementById("ksCekPesan");
  if(!box){box=document.createElement("div");box.id="ksCekPesan";box.style.cssText="margin:10px 0;padding:12px 14px;border-radius:14px;background:#fdecea;color:#7a2318;font-size:14px;line-height:1.45";btn.insertAdjacentElement("beforebegin",box);}
  const al=cart.length?alasanTidakBisaPesan():[];
  box.hidden=!al.length;
  box.innerHTML=al.length?`<b>⚠️ Pesanan belum bisa dibuat</b><ul style="margin:6px 0 0;padding-left:18px">${al.map(x=>`<li style="margin:4px 0">${x}</li>`).join("")}</ul>`:"";
  if(al.length)btn.disabled=true;
  return al;
}
async function cekBisaPesan(){ KS_KURIR=await jumlahKurirAktif(); return renderCekPesan()||[]; }
const teksAlasan=al=>al.map(x=>"• "+x.replace(/<[^>]+>/g,"")).join("\n\n");
document.getElementById("cartBtn").onclick=()=>{{const la=document.getElementById("ksMapLat"),ln=document.getElementById("ksMapLng");if(la)la.value="";if(ln)ln.value="";}renderCart();cekBisaPesan();openModal("cartModal")};
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
document.getElementById("checkoutBtn").onclick=async()=>{
  {const al=await cekBisaPesan(); if(al.length){alert("Pesanan belum bisa dibuat:\n\n"+teksAlasan(al));return;}}
  if(!cart.length) return;
  {const vh=cartData().filter(x=>(x.varHabis||x.varHilang)&&cart[x.idx]&&!cart[x.idx].off);
   if(vh.length){alert("Pesanan belum bisa dibuat:\n\n"+vh.map(x=>`• ${x.name}: varian ${x.varHilang?"sudah tidak dijual":"sedang habis"}`).join("\n")+"\n\nHapus item itu dari keranjang atau pilih varian lain.");return;}}
  {const km=cartData().filter(x=>x.kurangMin&&cart[x.idx]&&!cart[x.idx].off);
   if(km.length){alert("Pesanan belum bisa dibuat:\n\n"+km.map(x=>`• ${x.name}: ${rupiah(x.price)}, kurang ${rupiah(x.kurangMin)} dari minimal order ${rupiah(x.price+x.kurangMin)}`).join("\n")+"\n\nHapus lalu racik ulang dengan topping tambahan.");return;}}
  const b=await loadBuyer();
  if(!b){ sessionStorage.setItem("kalensari_next","checkout"); showToast("Silakan masuk dengan akun warga dulu..."); setTimeout(()=>{ksGo("akun-pembeli.html");},900); return; }
  checkoutBuyer=b; closeModal("cartModal"); renderCheckoutBuyer(); renderCart(); openModal("checkoutModal"); setupCheckoutMaps();
};
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
  if(!checkoutBuyer){showToast("Silakan masuk dengan akun warga dulu");return;}
  await Promise.all([loadCloudSettings(),refreshProductStatus()]);
  if(!cartGroups().some(g=>g.on)){alert("Centang minimal satu produk yang ingin di-checkout.");return;}
  {const closed=closedCartItems();if(closed.length){alertClosedItems(closed);return;}}
  {KS_KURIR=await jumlahKurirAktif();if(KS_KURIR===0){renderCekPesan();alert("Pesanan belum bisa dibuat:\n\n🛵 Belum ada kurir yang aktif saat ini, jadi pesanan belum bisa diantar. Silakan coba lagi beberapa saat lagi.");return;}}
  const f=new FormData(e.target);
  const phone=phoneShow(checkoutBuyer.wa), buyerName=checkoutBuyer.nama;
  const _la=document.getElementById("ksMapLat")?.value, _ln=document.getElementById("ksMapLng")?.value;
  const mapLat=String(_la||"").trim()===""?NaN:Number(_la), mapLng=String(_ln||"").trim()===""?NaN:Number(_ln);
  const hasMap=Number.isFinite(mapLat)&&Number.isFinite(mapLng)&&!(mapLat===0&&mapLng===0);
  const mode=f.get("addrMode");
  if(mode!=="rumah"&&mode!=="lokasi"){showToast("Pilih alamat pengiriman dulu");return;}
  if(mode==="rumah"&&!checkoutBuyer.alamat){showToast("Alamat rumah belum diisi");return;}
  if(mode==="lokasi"&&!hasMap){showToast("Ambil lokasi Anda dulu");return;}
  const address=mode==="rumah"?checkoutBuyer.alamat:"Titik lokasi saat ini (lihat link Google Maps)";
  const userNote=String(f.get("note")||"").trim();
  const mapToken=hasMap?`__KS_MAP__${mapLat.toFixed(6)},${mapLng.toFixed(6)}__END__`:"";
  const groups0=cartGroups().filter(g=>g.on),rt=groups0[0]?groups0[0].route:null;
  const routeNote=rt&&rt.stops.length>1?`[Rute kurir: ${rt.stops.map((x,i)=>`${i+1}. ${x.name}`).join(" → ")} → Pembeli]`:"";
  const orderNote=[userNote,routeNote,mapToken].filter(Boolean).join(" ");
  if(hasMap) localStorage.setItem("kalensari_checkout_location",JSON.stringify({lat:mapLat,lng:mapLng}));
  // ===== Lanjut pembayaran: pilih QRIS / COD dulu =====
  const pilihanBayar=bayarDipilih;bayarDipilih="";
  if(!pilihanBayar){bukaPilihBayar();return;}
  const pakaiSaldo=CLOUD_CONFIG?.enabled&&!/^cod/i.test(pilihanBayar)?saldoDipakai:0;saldoDipakai=0;
  // pesanan dengan saldo voucher disimpan sebagai QRIS dulu; database mengubahnya jadi "Saldo voucher" bila lunas penuh
  const payment=/^saldo/i.test(pilihanBayar)?"QRIS":pilihanBayar;
  let pinSaldo="";
  if(pakaiSaldo>0){pinSaldo=await mintaKataSandi(checkoutBuyer.wa);if(!pinSaldo)return;}
  let codTahan=false;
  if(isCod(payment)){
    const ci=await codInfo(phone);
    if(!ci.boleh){alert(ci.pesan);bukaPilihBayar("QRIS");return;}
    codTahan=ci.tahan;
  }
  const pakaiQris=/^qris/i.test(payment)&&QRIS_OTOMATIS&&!!CLOUD_CONFIG?.enabled;
  // COD: kata sandi sekarang. QRIS: kata sandi diminta setelah pembayaran lunas.
  if(!pakaiQris&&!pinSaldo&&!(await mintaKataSandi(checkoutBuyer.wa)))return;
  // ===== PESANAN DIPISAH PER TOKO: tiap toko yang dicentang = 1 nota, 1 kurir, ongkir sendiri =====
  const groups=groups0.slice().sort((a,b)=>a.urut-b.urut),createdAt=new Date().toISOString();
  const kodeST=window.KSST?KSST.buatKode():"";
  const codes=[];for(const g of groups){let c=await makeUniqueOrderCode();while(codes.includes(c))c=await makeUniqueOrderCode();codes.push(c);}
  const grup=groups.length>1?"G-"+codes[0]:null;
  const payloads=groups.map((g,i)=>{const items=g.items.map(({idx,on,...r})=>promoOn(r)?r:{...r,sale:null}),subtotal=g.sub,shipping=g.fee;
    return {order_code:codes[i],created_at:createdAt,customer_name:buyerName,customer_phone:phone,customer_phone_normalized:normalizePhone(phone),address,note:orderNote,payment,items,subtotal,shipping,total:subtotal+shipping,status:"menunggu",...(grup?{grup}:{}),...(codTahan?{pay_status:"tunggu_wa"}:{})};});
  const totalAll=payloads.reduce((t,x)=>t+x.total,0);
  const mapText=hasMap?`\nLokasi Maps: ${ksMapsSearch(`${mapLat},${mapLng}`)}`:"";
  const notaText=groups.map((g,i)=>{const r=g.route,pl=payloads[i];
    const ship=!g.last?`${pl.shipping>0?rupiah(pl.shipping):"Gratis"} (ongkir pertama toko)`:r.state==="ok"?`${pl.shipping>0?rupiah(pl.shipping):"Gratis"} (jarak ${g.name} → pembeli ${fmtKm(r.km)} km)`:`${rupiah(pl.shipping)} (jarak belum terhitung, mohon konfirmasi)`;
    return `NOTA ${i+1} • ${codes[i]}\nToko: ${g.name}\n${g.items.map(p=>`- ${p.name} x${p.qty} = ${rupiah(currentPrice(p)*p.qty)}`).join("\n")}\nSubtotal: ${rupiah(pl.subtotal)}\nOngkir: ${ship}\nTotal nota: ${rupiah(pl.total)}`;}).join("\n\n");
  const msg=`Halo KALENSARI STORE, saya ingin memesan${groups.length>1?` dari ${groups.length} toko (${groups.length} nota, diantar 1 kurir)`:""}:\n\n${groups.length>1&&routeNote?`RUTE KURIR: ${rt.stops.map((x,i)=>`${i+1}. ${x.name}`).join(" → ")} → Pembeli\n\n`:""}${notaText}\n\n${groups.length>1?`TOTAL SEMUA NOTA: ${rupiah(totalAll)}\n\n`:""}Nama: ${buyerName}\nNo. WhatsApp: ${phone}\nAlamat: ${address}\nCatatan: ${userNote||"-"}${mapText}\nPembayaran: ${payment}`;
  const msgWA=kodeST?msg+`\n\n🔑 Kode serah terima: ${kodeST}\n(sebutkan ke kurir hanya saat pesanan sudah diterima)`:msg;

  // Simpan lokal terlebih dahulu agar Pesanan Saya langsung berisi semua nota.
  const local=getLocalOrders(); payloads.forEach((pl,i)=>local.unshift({...pl,id:`local-${Date.now()}-${i}`})); saveLocalOrders(local);
  localStorage.setItem("kalensari_customer_phone",phone);
  if(kodeST) try{const m=JSON.parse(localStorage.getItem("kalensari_kode_st")||"{}");codes.forEach(c=>{m[c]=kodeST});localStorage.setItem("kalensari_kode_st",JSON.stringify(m))}catch(e){}

  const result=await saveCloudOrders(payloads);
  if(!result.ok){
    const rows=getLocalOrders().map(o=>codes.includes(o.order_code)?{...o,sync_error:result.error}:o); saveLocalOrders(rows);
    renderMyOrders();
    alert(`Pesanan tersimpan di perangkat, tetapi BELUM masuk database online.\n\nDetail: ${result.error}\n\nJalankan supabase.sql lalu pastikan RLS orders mengizinkan INSERT.`);
    showToast("⚠️ Pesanan tersimpan lokal; database gagal.");
    return;
  }
  // Ganti salinan lokal dengan data server jika tersedia.
  const savedMap=new Map((result.data||[]).filter(Boolean).map(r=>[r.order_code,r]));
  const merged=getLocalOrders().map(o=>savedMap.has(o.order_code)?{...o,...savedMap.get(o.order_code),sync_error:null}:o); saveLocalOrders(merged);
  renderMyOrders();
  if(kodeST) for(const c of codes) await KSST.daftarkan(c,kodeST);
  // satu QRIS untuk semua nota (nominal = total semua nota)
  const sukses={codes,groups:groups.map((g,i)=>({nama:g.name,items:g.items.map(p=>({n:p.name,q:p.qty,h:currentPrice(p)*p.qty})),sub:payloads[i].subtotal,ong:payloads[i].shipping,tot:payloads[i].total})),total:totalAll,payment,kodeST,codTahan,wa:checkoutBuyer.wa,nama:buyerName,address,t:createdAt};
  let lunasSaldo=false;
  if(pakaiSaldo>0){
    try{const r=await pakaiSaldoRpc(checkoutBuyer.wa,pinSaldo,codes,pakaiSaldo);sukses.saldo=pakaiSaldo;sukses.pinOk=true;lunasSaldo=Number(r.sisa)===0;
      try{const segar=await pesananKode(codes);const m=new Map((segar||[]).map(x=>[x.order_code,x]));saveLocalOrders(getLocalOrders().map(o=>m.has(o.order_code)?{...o,...m.get(o.order_code)}:o));renderMyOrders();}catch(e){}
      showToast(`🎟️ Saldo voucher ${rupiah(pakaiSaldo)} dipakai`);}
    catch(e){alert("Saldo voucher belum bisa dipakai:\n"+e.message+"\n\nSilakan bayar penuh dengan QRIS.");}
  }
  if(lunasSaldo)tampilSukses({...sukses,payment:"Saldo voucher",lunas:true});
  else if(pakaiQris||pakaiSaldo>0){KS_SUKSES=sukses;bayarQris(codes[0],msgWA+(sukses.saldo?`\n🎟️ Dipotong saldo voucher: ${rupiah(sukses.saldo)}`:""));}
  else tampilSukses(sukses);
  // hanya toko yang dicentang yang keluar dari keranjang; toko lain tetap tersimpan
  const done=new Set(groups.flatMap(g=>g.items.map(p=>p.idx)));cart=cart.filter((i,n)=>!done.has(n));
  saveCart();updateCartCount();renderCart();closeModal("checkoutModal");
  e.target.reset();
  if(window.KSNotif&&CLOUD_CONFIG?.enabled) setTimeout(()=>KSNotif.tawarkan({key:"pembeli_push_"+normalizePhone(phone),ajakan:"🔔 Kabari saya saat pesanan diterima toko & diantar kurir?"}),1500);
});

document.getElementById("year").textContent=new Date().getFullYear();
renderCategories();renderProducts();updateCartCount();renderCart();
if(new URLSearchParams(location.search).get("pesanan")){ history.replaceState(null,"",location.pathname); setTimeout(()=>document.getElementById("myOrdersBtn")?.click(),400); }
// ?toko=Nama Toko -> langsung tampilkan produk toko itu (dipakai tombol "Lihat Toko Saya" di aplikasi penjual)
{const tk=new URLSearchParams(location.search).get("toko");if(tk){history.replaceState(null,"",location.pathname);activeSeller=sellerKey(tk);activeCategory="Semua";renderCategories();renderProducts();setTimeout(()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"}),700);}}
if(location.hash==="#checkout"){ history.replaceState(null,"",location.pathname); if(cart.length) setTimeout(()=>document.getElementById("checkoutBtn").click(),400); }
(async()=>{ if(CLOUD_CONFIG?.enabled){ updateCloudStatus("☁️ Menghubungkan ke database..."); const ok=await loadCloudProducts(); await loadCloudSettings(); setTimeout(muatFotoToko,800); if(ok){renderCategories();renderProducts();renderCart();updateCloudStatus("☁️ Produk tersinkron online");} else updateCloudStatus("⚠️ Cloud belum tersambung. Periksa config.js dan SQL Supabase."); } })();

// ===== ADMIN DASHBOARD V6 =====
let adminLoggedIn = !!(adminAuth&&adminAuth.refresh_token);
function openAdmin(){
  {const pw=document.getElementById("adminPass");if(pw)pw.value="";}
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
    const lines=tText.split(/\r?\n/).filter(l=>l.trim()&&!/^#/.test(l.trim()));
    if(parseToppings({toppings:tText}).length<lines.length){showToast("Format topping salah. Gunakan satu baris: Nama | Harga");return;}
  }
  const tLim=Number(document.getElementById(`e-tlimit-${i}`).value);
  const p=products[i]; p.toppings=tText||null; p.topping_limit=tLim>0?tLim:null; p.open_time=openT||null; p.close_time=closeT||null; p.product_group=document.getElementById(`e-group-${i}`).value.trim()||null; p.variant=document.getElementById(`e-variant-${i}`).value.trim()||null; p.name=document.getElementById(`e-name-${i}`).value.trim(); p.category=document.getElementById(`e-cat-${i}`).value; p.price=Number(document.getElementById(`e-price-${i}`).value)||0; const sale=Number(document.getElementById(`e-sale-${i}`).value); p.sale=sale>0?sale:null; if(!p.sale||(p.sale_until&&Date.parse(p.sale_until)<=Date.now()))p.sale_until=null; p.seller=document.getElementById(`e-seller-${i}`).value.trim(); p.unit=document.getElementById(`e-unit-${i}`).value.trim(); p.image=document.getElementById(`e-image-${i}`).value.trim(); saveProducts(); syncCloudProducts(); renderProducts(); renderCategories(); renderAdminProducts(); showToast("Produk berhasil diperbarui");
}
function addAdminProduct(){
  const id=products.length?Math.max(...products.map(p=>p.id))+1:1;
  products.unshift({id,name:"Produk Baru",price:10000,sale:null,category:"Makanan",unit:"1 porsi",seller:"Warga Kalensari",status:"Show",image:""});
  saveProducts(); syncCloudProducts(); renderProducts(); renderCategories(); renderAdminProducts(); editAdminProduct(0); showToast("Produk baru ditambahkan");
}
function setProductStatus(i,status){if(!products[i]||products[i].status===status)return;products[i].status=status;saveProducts();syncCloudProducts();renderProducts();renderCategories();renderCart();renderAdminProducts();showToast(({"Show":"Produk ditampilkan","Sold Out":"Produk ditandai stok habis","Hidden":"Produk disembunyikan"})[status]);}
function deleteAdminProduct(i){if(!confirm(`Hapus ${products[i].name}?`))return;pendingDeletes.add(Number(products[i].id));products.splice(i,1);saveProducts();syncCloudProducts();renderProducts();renderCategories();renderAdminProducts();showToast("Produk dihapus");}
document.getElementById("menuBtn").onclick=openAdmin;
document.getElementById("adminLoginBtn").onclick=async()=>{
  const btn=document.getElementById("adminLoginBtn"),em=document.getElementById("adminEmail").value.trim(),pw=document.getElementById("adminPass").value;
  if(!em||!pw){showToast("Isi email dan kata sandi admin");return;}
  if(!CLOUD_CONFIG?.enabled){showToast("Database online belum aktif");return;}
  btn.disabled=true;const t=btn.textContent;btn.textContent="Memeriksa...";
  try{
    await adminSignIn(em,pw);
    adminLoggedIn=true;document.getElementById("adminPass").value="";
    try{await loadCloudSettings();}catch{}
    document.getElementById("adminLogin").hidden=true;document.getElementById("adminPanel").hidden=false;renderAdminProducts();showToast("Login admin berhasil");
  }catch(e){
    const m=String(e.message||e);
    showToast(m==="bukan-admin"?"Akun ini bukan admin":m==="cek-admin-gagal"?"Jalankan supabase-admin-auth.sql di Supabase dulu":/invalid|credentials/i.test(m)?"Email atau kata sandi salah":/confirm/i.test(m)?"Email admin belum dikonfirmasi di Supabase":"Gagal masuk: "+m.slice(0,80));
    if(m==="bukan-admin")adminSignOut();
  }finally{btn.disabled=false;btn.textContent=t;}
};
document.getElementById("adminPass").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();document.getElementById("adminLoginBtn").click();}});
document.getElementById("adminLogoutBtn").onclick=()=>{adminSignOut();adminLoggedIn=false;document.getElementById("adminPanel").hidden=true;document.getElementById("adminLogin").hidden=false;showToast("Anda sudah keluar dari admin");};
// Kolom kode admin: pastikan bisa menerima kode 4-12 karakter (tanpa batas panjang/pola bawaan HTML).
{const pi=document.getElementById("adminPin");if(pi){pi.removeAttribute("maxlength");pi.removeAttribute("pattern");pi.type="password";pi.setAttribute("autocomplete","off");}}
document.getElementById("addProductBtn").onclick=addAdminProduct;
document.getElementById("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(products,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="kalensari-products.json";a.click();URL.revokeObjectURL(a.href)};
document.getElementById("importFile").onchange=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!Array.isArray(data))throw Error();products=data.map((p,i)=>({...p,id:Number(p.id)||i+1}));saveProducts();syncCloudProducts();renderProducts();renderCategories();renderAdminProducts();showToast("Produk berhasil diimpor")}catch{showToast("File produk tidak valid")}};r.readAsText(file)};
document.getElementById("resetProductsBtn").onclick=()=>{if(!confirm("Kembalikan 25 produk bawaan?"))return;products=DEFAULT_PRODUCTS.map(p=>({...p}));saveProducts();syncCloudProducts();renderProducts();renderCategories();renderAdminProducts();showToast("Produk dikembalikan ke bawaan")};


function statusLabel(s){return ({menunggu:"Menunggu",baru:"Menunggu",diproses:"Diproses",dikirim:"Dikirim",selesai:"Selesai",dibatalkan:"Dibatalkan",gagal:"Gagal diantar"}[s]||s||"Menunggu");}
function statusSteps(status){
  const order=["menunggu","diproses","dikirim","selesai"]; const idx=order.indexOf(status);
  return `<div class="order-timeline">${order.map((x,i)=>`<div class="order-step ${status==='dibatalkan'?'cancelled':i<idx?'done':i===idx?'current':''}"><div class="dot">${i<idx?'✓':i===idx?'•':'○'}</div>${statusLabel(x)}</div>`).join("")}</div>`;
}
let myOrdersLast=null;
function renderMyOrders(rows=getLocalOrders()){
  const box=document.getElementById("myOrderList"), count=document.getElementById("myOrderCount"); if(!box)return;
  myOrdersLast=rows;
  if(window.KSPW)KSPW.pasang(box,rows,()=>renderMyOrders(myOrdersLast));
  if(window.KSUlasan){KSUlasan.pasang(box,()=>renderMyOrders(myOrdersLast));KSUlasan.muat(rows).then(baru=>{if(baru&&myOrdersLast===rows)renderMyOrders(rows);});}
  // Hanya pesanan AKTIF. Selesai / dibatalkan / gagal pindah ke Riwayat di akun pembeli (dashboard-pembeli.html#pesanan).
  const AKTIF_ST=["menunggu","baru","diproses","dikirim"];
  const sorted=[...rows].filter(o=>AKTIF_ST.includes(o.status||"menunggu")).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
  const riwayatN=rows.length-sorted.length;
  if(count)count.textContent=`${sorted.length} aktif`;
  box.innerHTML=sorted.length?sorted.map(kartuPesanan).join("")+riwayatLink(riwayatN):`<div class="empty-state"><b>📦 Tidak ada pesanan aktif</b>Pesanan yang sedang berjalan akan muncul di sini. Pesanan yang sudah selesai atau dibatalkan tersimpan di riwayat akun.</div>${riwayatLink(riwayatN)}`;
}
// ===== Kartu pesanan (tampilan baru) =====
const IKON_PS={
  menunggu:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" fill="currentColor"/></svg>',
  diproses:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  dikirim:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
  selesai:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 12.5 4 4 8-9"/></svg>'};
const SVG_ORANG='<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5z"/></svg>';
const SVG_TAS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const SVG_TELP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>';
const SVG_KAL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
const SVG_QR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M17 20h4M20 17v3"/></svg>';
function kartuPesanan(o){
  const st=!o.status||o.status==="baru"?"menunggu":o.status,lokal=String(o.id||"").startsWith("local-");
  const urut=["menunggu","diproses","dikirim","selesai"],idx=urut.indexOf(st);
  const tgl=new Date(o.created_at||Date.now()),tglTx=tgl.toLocaleDateString("id-ID",{day:"numeric",month:"short"})+", "+tgl.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});
  const langkah=urut.map((x,i)=>`<div class="ps-step ${st==="dibatalkan"?"x":i<idx?"done":i===idx?"now":""}"><span>${IKON_PS[x]}</span><small>${statusLabel(x)}</small></div>`).join('<i class="ps-line"></i>');
  const tokoTx=[...new Set((o.items||[]).map(x=>x.seller).filter(Boolean))].join(", ");
  const item=(o.items||[]).map(x=>`${esc(x.name)} ×${x.qty}`).join(" • ")+(tokoTx?` <span class="ps-toko">(${esc(tokoTx)})</span>`:"");
  const bisaQris=QRIS_OTOMATIS&&o.payment==="QRIS"&&o.pay_status!=="lunas"&&st!=="dibatalkan"&&!lokal;
  const aksi=bisaQris?`<button class="ps-aksi" type="button" onclick="bayarQris('${esc(o.order_code)}')">${SVG_QR}<span>Bayar dengan QRIS</span><em>›</em></button>`
    :st==="dikirim"&&!lokal?`<button class="ps-aksi" type="button" onclick="lacakKurir('${esc(o.order_code)}')"><b>🛵</b><span>Lacak kurir</span><em>›</em></button>`:"";
  const kode=window.KSST&&KSST.kodeOf?KSST.kodeOf(o.order_code):"";
  const kodeHtml=kode?`<div class="ps-kode"><div><div class="ps-kode-h"><b>🔑</b>Kode serah terima</div><strong>${esc(kode).split("").join(" ")}</strong><p>Sebutkan kode ini ke kurir <b>hanya saat pesanan sudah Anda terima.</b></p></div></div>`:(window.KSST?KSST.html(o):"");
  return `<div class="my-order-card ps-card st-${st}">
    <div class="ps-head"><div class="ps-ico">📦</div><div class="ps-id"><b>${esc(o.order_code||"Pesanan")}</b><small>${SVG_KAL}${tglTx}</small></div><span class="ps-pill"><i></i>${statusLabel(st)}<em>›</em></span></div>
    <div class="ps-steps">${langkah}</div>
    <div class="ps-row"><span class="ps-av">${SVG_ORANG}</span><div><b>${esc(o.customer_name||"")}</b><small>${SVG_TELP}${esc(o.customer_phone||"")}</small></div></div>
    <div class="ps-row"><span class="ps-av ps-av2">${SVG_TAS}</span><div class="ps-item">${item}</div></div>
    <div class="ps-tot"><strong>${rupiah(o.total||0)}</strong>${aksi}</div>
    ${o.pay_status==="tunggu_wa"&&st==="menunggu"?'<div class="order-hint">📞 Menunggu konfirmasi admin lewat WhatsApp (pesanan COD pertama)</div>':""}
    ${st==="dibatalkan"?infoBatal(o):""}
    ${Number(o.potong_saldo)>0?`<div class="order-hint">🎟️ Dipotong saldo voucher ${rupiah(o.potong_saldo)}</div>`:""}
    ${o.pay_status==="lunas"?(/^saldo/i.test(o.payment||"")?'<div class="order-hint success">🎟️ Lunas pakai saldo voucher</div>':'<div class="order-hint success">💳 Sudah dibayar lewat QRIS</div>'):""}
    ${kodeHtml}
    ${window.KSPW?KSPW.html(o):""}
    ${window.KSUlasan?KSUlasan.html(o):""}
    ${o.sync_error?`<div class="order-hint">⚠️ Belum tersinkron ke database: ${esc(o.sync_error)}</div>`:""}
  </div>`;
}
function riwayatLink(n){return n?`<a class="btn outline full riwayat-btn" href="dashboard-pembeli.html#pesanan">📜 Lihat riwayat pesanan (${n})</a>`:"";}
let pembeliNotif=null,pembeliHP="";
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
  if(!phone&&!sesiPembeli()&&!local.length){
    if(identity) identity.hidden=false;
    if(note){note.textContent="🔎 Masukkan nomor WhatsApp yang dipakai saat checkout agar Pesanan Saya sama di HP dan komputer.";note.className="order-sync-note offline";}
    return;
  }
  if(identity) identity.hidden=true;
  if(window.KSNotif){ pembeliHP=phone; if(!pembeliNotif) pembeliNotif=KSNotif.kartu(document.getElementById("ksNotifPembeli"),{key:()=>pembeliHP?"pembeli_push_"+pembeliHP:"",judul:"🔔 Kabari saya lewat notifikasi",ajakan:"Dapatkan pemberitahuan saat pesanan diterima toko, diantar kurir, dan selesai.",aktifTeks:"Anda akan diberi tahu saat status pesanan berubah."}); else pembeliNotif.refresh(); }
  try {
    const remote=await loadMyCloudOrders(phone,local.map(o=>o.order_code).filter(Boolean));
    const map=new Map(local.map(o=>[o.order_code||o.id,o]));
    remote.forEach(o=>map.set(o.order_code||o.id,{...map.get(o.order_code||o.id),...o,sync_error:null}));
    const rows=[...map.values()].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
    saveLocalOrders(rows);
    if(window.KSST){ await KSST.muatInfo(rows.filter(o=>o.status==="selesai"&&Date.now()-new Date(o.updated_at||o.created_at||0)<4*864e5).map(o=>o.order_code)); KSST.pasang(document.getElementById("myOrderList"),()=>pembeliHP,()=>renderMyOrders(rows)); }
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
  jasa.setAttribute("href","jasa.html");
  jasa.removeAttribute("target");jasa.removeAttribute("rel");
}
// Perbarui semua tautan WhatsApp statis setelah nomor diubah / dimuat dari database.
function applyWaLinks(){
  const q=t=>`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`;
  const g=document.getElementById("waGeneral");if(g)g.href=q("Halo KALENSARI STORE, saya ingin bertanya tentang produk.");
  setupHeroButtons();
  document.getElementById("waFloat")?.setAttribute("href",q("Halo KALENSARI STORE, saya ingin memesan."));
}
// Satu produk boleh punya beberapa foto: pisahkan dengan " | " atau baris baru di kolom foto.
// Foto pertama dipakai di kartu produk, semua foto tampil sebagai galeri di popup detail.
function productImages(p) {
  return String((p && p.image) || "").split(/\s*(?:\r?\n|\s\|\s)\s*/).map(x => x.trim()).filter(Boolean);
}
function getProductImage(imagePath) {
  if (!imagePath) return "";
  imagePath = String(imagePath).split(/\s*(?:\r?\n|\s\|\s)\s*/)[0].trim();
  // foto yang disimpan di repo GitHub (mis. img/seblak/foto.jpg) dipakai langsung
  if (/^(\.\/|\/|img\/|icons\/|data:image\/)/i.test(imagePath)) return imagePath;

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
        <div class="fee-default pin-card"><b>🔐 Login admin</b><small>Admin sekarang masuk dengan email &amp; kata sandi akun Supabase. Untuk mengganti kata sandi atau menambah admin, buka Supabase &gt; Authentication &gt; Users dan tabel <code>admins</code>.</small></div>
        <div class="fee-default"><label>🚚 Ongkir standar per toko (Rp)<input type="number" inputmode="numeric" min="0" step="500" data-act="fee-default" value="${Number(shippingFees.__default)||0}"></label><small>Dipakai untuk toko yang tarifnya dikosongkan. Tiap toko yang disinggahi kurir dihitung satu kali (2 toko = 2 × ongkir pertama), semuanya dalam satu nota.</small></div>
        <div class="fee-default"><b>📏 Tambahan ongkir per jarak</b><div class="pin-grid"><label>Gratis tambahan sampai (km)<input type="number" inputmode="decimal" min="0" step="0.5" data-act="fee-km" value="${shipFreeKm()}"></label><label>Tambahan per km (Rp)<input type="number" inputmode="numeric" min="0" step="500" data-act="fee-perkm" value="${shipPerKm()}"></label></div><small>Kurir mampir ke semua toko berurutan (dari yang terjauh ke yang terdekat dengan pembeli). Jarak tambahan dihitung dari TOKO TERAKHIR ke titik pembeli. Contoh: jarak 3,4 km dan gratis 2 km = 2 km × tarif per km (dibulatkan ke atas).</small></div>
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
    if(act!=="fee"&&act!=="fee-default"&&act!=="fee-km"&&act!=="fee-perkm")return;
    if(act==="fee-km"||act==="fee-perkm"){const v=Math.max(0,Number(String(t.value).replace(",","."))||0);if(act==="fee-km"){shippingFees.__freeKm=v;t.value=v;}else{shippingFees.__perKm=Math.round(v);t.value=Math.round(v);}renderCart();await persist(act==="fee-km"?`Batas tanpa tambahan: ${fmtKm(v)} km`:`Tambahan ${rupiah(Math.round(v))} per km`);return;}
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

// ===== MUSIK LATAR (otomatis diputar, ada tombol hidup/mati di pojok kanan bawah banner) =====
// Browser (Chrome/Safari) melarang suara otomatis sebelum pengunjung menyentuh halaman, jadi musik
// dicoba diputar saat halaman dibuka dan otomatis mulai pada ketukan/klik/tombol keyboard pertama.
(function(){
  const a=document.getElementById("bgMusic"),b=document.getElementById("musicBtn");if(!a||!b)return;
  a.volume=0.5;
  const KEY="kalensari_music_off";
  let off=false;try{off=localStorage.getItem(KEY)==="1";}catch{}
  const save=()=>{try{off?localStorage.setItem(KEY,"1"):localStorage.removeItem(KEY);}catch{}};
  const sync=()=>{const on=!a.paused;b.textContent=on?"🔊":"🔇";b.setAttribute("aria-pressed",String(on));
    b.setAttribute("aria-label",on?"Matikan musik":"Hidupkan musik");b.title=on?"Matikan musik":"Hidupkan musik";
    b.classList.toggle("wait",!on&&!off);};
  const start=()=>a.play().then(sync).catch(sync);
  const EV=["pointerdown","touchend","keydown","click"];
  const unlock=e=>{if(off||(e.target&&e.target.closest&&e.target.closest("#musicBtn")))return;
    a.play().then(()=>{sync();EV.forEach(v=>removeEventListener(v,unlock,true));}).catch(()=>{});};
  b.addEventListener("click",()=>{
    if(a.paused){off=false;save();start();}else{a.pause();off=true;save();sync();}
    EV.forEach(v=>removeEventListener(v,unlock,true));});
  a.addEventListener("play",sync);a.addEventListener("pause",sync);
  let resume=false;
  document.addEventListener("visibilitychange",()=>{ // hemat baterai: jeda saat tab disembunyikan
    if(document.hidden){resume=!a.paused;if(resume)a.pause();}else if(resume&&!off){a.play().catch(()=>{});resume=false;}});
  sync();
  if(!off){start();EV.forEach(v=>addEventListener(v,unlock,true));}
})();

// ===== MENU ☰ : Penjual, Penyedia Jasa, Admin (menggantikan ikon ⚙️ di header) =====
(function(){
  const btn=document.getElementById("menuBtn");if(!btn)return;
  btn.textContent="☰";btn.setAttribute("aria-label","Menu");btn.setAttribute("aria-haspopup","true");btn.setAttribute("aria-expanded","false");
  const st=document.createElement("style");
  st.textContent=`.ks-menu{position:fixed;z-index:1200;min-width:210px;background:#fff;border:1px solid #eadfd6;border-radius:16px;box-shadow:0 18px 40px -16px rgba(58,31,16,.45);padding:6px;display:none}
.ks-menu.open{display:block}
.ks-menu a,.ks-menu button{display:flex;gap:10px;align-items:center;width:100%;padding:12px 14px;border:0;background:none;border-radius:12px;font:inherit;font-weight:600;color:#3a1f10;text-decoration:none;cursor:pointer;text-align:left}
.ks-menu a:hover,.ks-menu button:hover,.ks-menu a:focus-visible,.ks-menu button:focus-visible{background:#f8edd3;outline:none}`;
  document.head.appendChild(st);
  const m=document.createElement("div");m.className="ks-menu";m.setAttribute("role","menu");
  m.innerHTML=`<a role="menuitem" href="pasar.html" style="background:#fff6ec;color:#5b2e1a;margin-bottom:4px">🔁 Lapak Barter <span style="margin-left:auto;background:#faeeda;color:#633806;font-size:11px;font-weight:800;padding:2px 7px;border-radius:8px">Baru</span></a><a role="menuitem" href="akun-pembeli.html"><svg width="30" height="30" viewBox="0 0 40 40" aria-hidden="true" style="flex:none;vertical-align:middle"><circle cx="20" cy="20" r="20" fill="#FFE27A"/><path d="M5 34c1-6 5-9 9-9s8 3 9 9z" fill="#4FC3A1"/><path d="M17 34c1-7 5-10 9-10s8 3 9 10z" fill="#FF8A5C"/><path d="M11 36c1-6 5-9 9-9s8 3 9 9z" fill="#5AA9F0"/><circle cx="12" cy="19" r="5" fill="#FFD3A8" stroke="#7a3e20" stroke-width="1"/><circle cx="28" cy="18" r="5.5" fill="#F7C39A" stroke="#7a3e20" stroke-width="1"/><circle cx="20" cy="22" r="5.5" fill="#FFDDB8" stroke="#7a3e20" stroke-width="1"/><path d="M17.8 23.5q2.2 2 4.4 0M9.8 20.3q2.2 1.8 4.4 0M25.8 19.5q2.2 1.8 4.4 0" stroke="#7a3e20" stroke-width="1.1" fill="none" stroke-linecap="round"/><circle cx="18.3" cy="21" r=".8" fill="#5b2e1a"/><circle cx="21.7" cy="21" r=".8" fill="#5b2e1a"/><circle cx="10.6" cy="18" r=".7" fill="#5b2e1a"/><circle cx="13.4" cy="18" r=".7" fill="#5b2e1a"/><circle cx="26.6" cy="17.2" r=".7" fill="#5b2e1a"/><circle cx="29.4" cy="17.2" r=".7" fill="#5b2e1a"/><path d="M14.5 17q5.5-6 11 0" fill="#5b2e1a" opacity=".85"/></svg> Warga Desa</a><a role="menuitem" href="penjual.html">🏪 Penjual</a><a role="menuitem" href="akun-jasa.html">🤝 Penyedia Jasa</a><a role="menuitem" href="akun-kurir.html">🛵 Kurir</a>`;
  document.body.appendChild(m);
  const close=()=>{m.classList.remove("open");btn.setAttribute("aria-expanded","false");};
  const place=()=>{const r=btn.getBoundingClientRect();m.style.top=(r.bottom+8)+"px";m.style.left=Math.max(8,Math.min(r.left,innerWidth-m.offsetWidth-8))+"px";};
  btn.onclick=e=>{e.stopPropagation();const open=!m.classList.contains("open");if(open){m.classList.add("open");place();}else m.classList.remove("open");btn.setAttribute("aria-expanded",String(open));};
  m.addEventListener("click",e=>{if(e.target.closest("a"))close();});
  document.addEventListener("click",e=>{if(!m.contains(e.target)&&e.target!==btn)close();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
  addEventListener("resize",close);addEventListener("scroll",close,{passive:true});
})();


// ===== ADMIN: ✅ Persetujuan (kurir, penyedia jasa, penjual) =====
(function(){
  const exp=document.getElementById("exportBtn"), list=document.getElementById("adminProductList");
  if(!exp||!list)return;
  const GROUPS=[
    {k:"kurir",label:"🛵 Kurir",members:"kurir_members",acc:"kurir_accounts",info:m=>[m.kendaraan,m.wilayah].filter(Boolean).join(" • ")||"-"},
    {k:"jasa",label:"🤝 Jasa",members:"jasa_members",acc:"jasa_accounts",info:m=>[m.kategori,m.dusun].filter(Boolean).join(" • ")||"-"},
    {k:"penjual",label:"🏪 Penjual",members:"penjual_members",acc:"penjual_accounts",info:m=>[m.toko||m.usaha,m.dusun].filter(Boolean).join(" • ")||"-"}
  ];
  const rd=async(key,def)=>{
    if(CLOUD_CONFIG?.enabled){const r=await cloudFetch(`store_settings?select=value&key=eq.${key}`);return r[0]&&r[0].value!=null?r[0].value:def;}
    try{const v=JSON.parse(localStorage.getItem("kalensari_"+key)||"null");return v==null?def:v;}catch{return def;}
  };
  const wr=async(key,val)=>{
    try{localStorage.setItem("kalensari_"+key,JSON.stringify(val));}catch{}
    if(CLOUD_CONFIG?.enabled)await cloudFetch("store_settings?on_conflict=key",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify([{key,value:val}])});
  };
  const st=document.createElement("style");
  st.textContent=`.ap-badge{display:inline-block;min-width:18px;margin-left:6px;padding:1px 6px;border-radius:999px;background:#c0392b;color:#fff;font-size:11px;font-weight:700;text-align:center}.ap-badge:empty{display:none}
#adminApprove{border:1px solid #eadfd6;border-radius:16px;padding:14px;margin:12px 0;background:#fffaf2}
#adminApprove .ap-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
#adminApprove .ap-tab{border:1px solid #d3bfa8;background:#fff;border-radius:999px;padding:8px 14px;font:inherit;font-weight:700;font-size:13px;cursor:pointer}
#adminApprove .ap-tab.on{background:#7b3f1d;border-color:#7b3f1d;color:#fff}
#adminApprove .ap-card{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid #eadfd6;background:#fff;border-radius:14px;padding:10px 12px;margin-top:8px}
#adminApprove .ap-card small{display:block;color:#5c4638;font-size:12px;margin-top:2px}
#adminApprove .ap-btns{display:flex;gap:6px}
#adminApprove .ap-btns button{border:1px solid #7b3f1d;background:#fff;color:#7b3f1d;border-radius:10px;padding:8px 12px;font:inherit;font-weight:700;font-size:13px;cursor:pointer}
#adminApprove .ap-btns .ap-ok{background:#228b4e;border-color:#228b4e;color:#fff}
#adminApprove .ap-btns .ap-no{border-color:#b83c2b;color:#b83c2b}
#adminApprove .ap-empty{font-size:13px;color:#5c4638;margin:10px 0 0}
.pl-toggle{cursor:pointer;user-select:none}.pl-toggle .pl-caret{display:inline-block;margin-left:8px;font-size:.8em;color:#7b3f1d}`;
  document.head.appendChild(st);
  const btn=document.createElement("button");btn.type="button";btn.id="approveBtn";btn.className=exp.className;btn.innerHTML='✅ Persetujuan<span class="ap-badge" id="apBadge"></span>';
  (document.getElementById("manageShipBtn")||exp).insertAdjacentElement("afterend",btn);
  const ap=document.createElement("div");ap.id="adminApprove";ap.hidden=true;list.parentNode.insertBefore(ap,list);
  let cur="kurir",data={},err="",busy=false;
  const pend=g=>(data[g.k]||[]).filter(m=>m&&m.pending===true);
  function badge(){const n=GROUPS.reduce((t,g)=>t+pend(g).length,0);document.getElementById("apBadge").textContent=n?String(n):"";}
  function render(){
    const g=GROUPS.find(x=>x.k===cur),rows=pend(g);
    ap.innerHTML=`<div class="extra-head" style="display:flex;justify-content:space-between;align-items:center"><h4 style="margin:0">✅ Persetujuan bergabung</h4><button type="button" class="extra-close" data-a="close" aria-label="Tutup">✕</button></div>
      <div class="ap-tabs">${GROUPS.map(x=>`<button type="button" class="ap-tab${x.k===cur?" on":""}" data-a="tab" data-g="${x.k}">${x.label} (${pend(x).length})</button>`).join("")}</div>
      ${err?`<p class="ap-empty">⚠️ ${esc(err)}</p>`:""}
      ${rows.length?rows.map(m=>`<div class="ap-card"><div><b>${esc(m.nama||"(tanpa nama)")}</b><small>📱 +${esc(m.wa||"")} • ${esc(g.info(m))}</small></div><div class="ap-btns"><button type="button" class="ap-ok" data-a="ok" data-g="${g.k}" data-id="${esc(m.id)}">✅ Setujui</button><button type="button" class="ap-no" data-a="no" data-g="${g.k}" data-id="${esc(m.id)}">✕ Tolak</button></div></div>`).join(""):`<p class="ap-empty">Tidak ada permintaan ${esc(g.label.replace(/^\S+\s/,""))} yang menunggu.</p>`}`;
    badge();
  }
  async function reload(){
    err="";
    for(const g of GROUPS){try{const v=await rd(g.members,[]);data[g.k]=Array.isArray(v)?v:[];}catch(e){data[g.k]=[];err="Sebagian data gagal dimuat: "+(e.message||e);}}
    render();
  }
  async function act(a,gk,id){
    const g=GROUPS.find(x=>x.k===gk);if(!g||busy)return;
    if(a==="no"&&!confirm("Tolak dan hapus pendaftaran ini? Orangnya bisa mendaftar ulang."))return;
    busy=true;
    try{
      const lst=await rd(g.members,[]),arr=Array.isArray(lst)?lst:[],m=arr.find(x=>x.id===id);
      if(!m){showToast("Data tidak ditemukan");return;}
      if(a==="ok"){
        const upd={...m,pending:false,updated:Date.now()};if(gk==="jasa")upd.status="Show";
        await wr(g.members,arr.map(x=>x.id===id?upd:x));
        let ext="";if(gk==="kurir"){try{const r=await cloudFetch("rpc/beri_saldo_awal",{method:"POST",body:JSON.stringify({p_kurir_id:id})});if(r!==null&&r!==undefined&&r!=="")ext=" + saldo awal";}catch(e){}}
        showToast(`"${m.nama||"Akun"}" disetujui${ext}`);
      }else{
        await wr(g.members,arr.filter(x=>x.id!==id));
        const acc=await rd(g.acc,{});let ch=false;for(const w in acc){if(acc[w]&&acc[w].id===id){delete acc[w];ch=true;}}
        if(ch)await wr(g.acc,acc);showToast("Pendaftaran ditolak");
      }
    }catch(e){showToast("Gagal: "+(e.message||e));}
    finally{busy=false;await reload();}
  }
  btn.addEventListener("click",()=>{
    const open=ap.hidden;ap.hidden=!open;
    if(open){const x=document.querySelector('#adminExtra:not([hidden]) [data-act="close"]');if(x)x.click();ap.innerHTML='<p class="ap-empty">Memuat...</p>';reload();}
  });
  ["manageCatBtn","manageSellerBtn","manageShipBtn"].forEach(id=>{const b=document.getElementById(id);if(b)b.addEventListener("click",()=>{ap.hidden=true;});});
  ap.addEventListener("click",e=>{
    const b=e.target.closest("[data-a]");if(!b)return;
    if(b.dataset.a==="close"){ap.hidden=true;}
    else if(b.dataset.a==="tab"){cur=b.dataset.g;render();}
    else act(b.dataset.a,b.dataset.g,b.dataset.id);
  });
  const lb=document.getElementById("adminLoginBtn");
  if(lb)lb.addEventListener("click",()=>{setTimeout(()=>{if(adminLoggedIn)reload();},1500);});
})();

// ===== ADMIN: "Daftar Produk" jadi folder (produk tampil hanya setelah diklik) =====
(function(){
  const list=document.getElementById("adminProductList"),panel=document.getElementById("adminPanel");
  if(!list||!panel)return;
  let head=[...panel.querySelectorAll("h1,h2,h3,h4,summary,legend")].find(h=>/Daftar Produk/i.test(h.textContent));
  if(!head){head=document.createElement("h3");head.textContent="📋 Daftar Produk";list.parentNode.insertBefore(head,list);}
  head.classList.add("pl-toggle");head.setAttribute("role","button");head.setAttribute("tabindex","0");
  const caret=document.createElement("span");caret.className="pl-caret";head.appendChild(caret);
  let open=false;
  function setFolder(v){
    open=!!v;list.style.display=open?"":"none";
    caret.textContent=(open?"▾ ":"▸ ")+"("+products.length+")";
    head.setAttribute("aria-expanded",String(open));
  }
  head.addEventListener("click",()=>setFolder(!open));
  head.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setFolder(!open);}});
  const add=document.getElementById("addProductBtn");
  if(add)add.addEventListener("click",()=>setFolder(true),true);
  const oa=openAdmin;openAdmin=function(){oa.apply(this,arguments);setFolder(false);};
  setFolder(false);
})();


// ===== HALAMAN DALAM BINGKAI: musik tidak putus saat membuka Santunan, Jasa, Akun, dll. =====
// index.html menjadi "rangka" yang tidak pernah dimuat ulang. Halaman lain (santunan.html, jasa.html, ...)
// tetap file sendiri, hanya dibuka di dalam bingkai di atas toko. Musik (#bgMusic) tetap jalan di rangka.
// Tombol "← Kembali ke toko" di halaman tersebut, atau tombol back HP, menutup bingkai.
function ksGo(url){ if(window.ksBuka) window.ksBuka(url); else location.href=url; }
(function(){
  if(window.top!==window.self) return; // index.html sendiri sedang di dalam bingkai: jangan buat bingkai lagi
  const st=document.createElement("style");
  st.textContent=`.ks-frame{position:fixed;inset:0;z-index:3000;background:#fffaf6;display:none}
.ks-frame.show{display:block}
.ks-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fffaf6}
.ks-frame-load{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);color:#7a3e20;font-weight:700;font-size:14px}
body.ks-frame-open{overflow:hidden}`;
  document.head.appendChild(st);
  const wrap=document.createElement("div");wrap.className="ks-frame";wrap.innerHTML='<div class="ks-frame-load">Memuat…</div>';
  document.body.appendChild(wrap);
  let fr=null,open=false;
  const here=new URL(location.href);
  const isHome=u=>u.origin===here.origin&&(/\/(index\.html)?$/i.test(u.pathname)||u.pathname===here.pathname);
  const isPage=u=>u.origin===here.origin&&/\.html?$/i.test(u.pathname)&&!isHome(u);
  function close(hash){
    if(!open)return;open=false;
    wrap.classList.remove("show");document.body.classList.remove("ks-frame-open");
    if(fr){fr.remove();fr=null;}
    if(history.state&&history.state.ksFrame)history.replaceState(null,"",location.pathname+location.search);
    // data mungkin berubah di halaman lain (mis. baru masuk akun pembeli)
    try{cart=JSON.parse(localStorage.getItem("kalensari_cart")||"[]");updateCartCount();renderCart();}catch(e){}
    if(hash==="#checkout"&&cart.length)setTimeout(()=>document.getElementById("checkoutBtn")?.click(),300);
    if(hash==="#products")document.getElementById("products")?.scrollIntoView();
  }
  function watch(){
    let w,d;try{w=fr.contentWindow;d=fr.contentDocument;w.location.href;}catch(e){return;} // beda domain: biarkan
    const u=new URL(w.location.href);
    if(isHome(u)){close(u.hash);return;}
    wrap.querySelector(".ks-frame-load").style.display="none";
    d.addEventListener("click",e=>{
      const a=e.target.closest&&e.target.closest("a[href]");if(!a||a.target==="_blank"||e.ctrlKey||e.metaKey||e.shiftKey)return;
      let t;try{t=new URL(a.getAttribute("href"),w.location.href);}catch(x){return;}
      if(isHome(t)){e.preventDefault();close(t.hash);}
    },true);
  }
  window.ksBuka=function(url){
    const u=new URL(url,location.href);
    if(!isPage(u)){location.href=u.href;return;}
    if(fr)fr.remove();
    fr=document.createElement("iframe");fr.title="Halaman Kalensari";fr.setAttribute("allow","geolocation; clipboard-write; autoplay");
    fr.addEventListener("load",watch);
    wrap.querySelector(".ks-frame-load").style.display="";
    wrap.appendChild(fr);fr.src=u.href;
    if(!open){open=true;history.pushState({ksFrame:1},"",location.pathname+location.search);}
    wrap.classList.add("show");document.body.classList.add("ks-frame-open");
  };
  // Tombol back HP / browser: kembali di dalam bingkai dulu, lalu menutup bingkai
  addEventListener("popstate",e=>{if(open&&!(e.state&&e.state.ksFrame))close();});
  // Semua link ke halaman lain di toko dibuka di bingkai
  document.addEventListener("click",e=>{
    if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest&&e.target.closest("a[href]");if(!a||a.target==="_blank"||a.hasAttribute("download"))return;
    let u;try{u=new URL(a.getAttribute("href"),location.href);}catch(x){return;}
    if(!isPage(u))return;
    e.preventDefault();window.ksBuka(u.href);
  });
})();


// ===== PEMBAYARAN QRIS OTOMATIS (Duitku lewat Supabase Edge Function "duitku-qris") =====
// Pembeli memilih "QRIS" saat checkout -> muncul QRIS dengan nominal sesuai total pesanan.
// Setelah dibayar, status pesanan otomatis "Lunas" (dicek tiap beberapa detik + callback Duitku).
var QRIS_OTOMATIS=true;   // ubah ke false untuk mematikan QRIS otomatis
var QRIS_FN="duitku-qris";
(function(){const o=[...document.querySelectorAll('#checkoutForm select[name="payment"] option')].find(x=>/^qris$/i.test(x.value||x.textContent));
  if(o&&QRIS_OTOMATIS){o.value="QRIS";o.textContent="QRIS (scan & bayar otomatis)";}})();
async function qrisApi(body){
  const base=String(CLOUD_CONFIG?.supabaseUrl||"").replace(/\/$/,"");
  const r=await fetch(`${base}/functions/v1/${QRIS_FN}`,{method:"POST",headers:{"Content-Type":"application/json",apikey:CLOUD_CONFIG.supabaseAnonKey,Authorization:`Bearer ${CLOUD_CONFIG.supabaseAnonKey}`},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.pesan||("HTTP "+r.status));return d;
}
let qrLib=null;
function muatQrLib(){if(window.qrcode)return Promise.resolve();if(qrLib)return qrLib;
  qrLib=new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";s.onload=ok;s.onerror=()=>{qrLib=null;no(new Error("Gagal memuat pembuat QR"))};document.head.appendChild(s);});return qrLib;}
function qrisModal(){
  let m=document.getElementById("qrisPayModal");if(m)return m;
  const st=document.createElement("style");st.textContent=`.qp-box{text-align:center}.qp-qr{width:min(300px,100%);margin:10px auto;padding:12px;border:3px solid #7a3e20;border-radius:18px;background:#fff}.qp-qr img{width:100%;height:auto;image-rendering:pixelated;display:block}
.qp-total{font-size:28px;font-weight:900;color:#7a3e20;margin:4px 0}.qp-st{border-radius:12px;padding:10px 12px;font-weight:700;margin:10px 0;background:#fff5ec;color:#6c5548}.qp-st.ok{background:#e8f7ec;color:#24633a}.qp-st.bad{background:#fdeaea;color:#8b3030}
.qp-acts{display:grid;gap:8px;margin-top:10px}.qp-head{display:flex;align-items:center;justify-content:center;gap:8px;font-weight:800;color:#3b2920}`;document.head.appendChild(st);
  m=document.createElement("div");m.id="qrisPayModal";m.className="modal";m.innerHTML=`<div class="modal-box qp-box"><button class="close" type="button" aria-label="Tutup">×</button><div id="qpBody"></div></div>`;
  document.body.appendChild(m);m.querySelector(".close").onclick=()=>tutupQris();m.addEventListener("click",e=>{if(e.target===m)tutupQris();});return m;
}
let qpTimer=null,qpTick=null,qpCode="",qpWa="";
function tutupQris(){clearInterval(qpTimer);clearInterval(qpTick);qpCode="";document.getElementById("qrisPayModal")?.classList.remove("show");refreshMyOrders?.();}
function qpRender(html){document.getElementById("qpBody").innerHTML=html;}
async function bayarQris(code,waMsg){
  qrisModal().classList.add("show");qpCode=code;if(waMsg)qpWa=waMsg;
  qpRender(`<span class="eyebrow">PEMBAYARAN</span><h2 style="margin:6px 0">💳 QRIS</h2><p>Menyiapkan QRIS untuk pesanan <b>${esc(code)}</b>...</p>`);
  try{
    const [d]=await Promise.all([qrisApi({aksi:"buat",order_code:code}),muatQrLib()]);
    if(qpCode!==code)return;
    if(d.pay_status==="lunas")return qpLunas(code);
    const q=qrcode(0,"M");q.addData(d.qr);q.make();
    qpRender(`<span class="eyebrow">KALENSARI STORE • PEMBAYARAN</span><div class="qp-head">QRIS • ${Number(d.nota)>1?`${d.nota} nota sekaligus`:esc(code)}</div>
      <div class="qp-total">${rupiah(Number(d.total)||0)}</div>
      <div class="qp-qr"><img alt="QRIS pembayaran ${esc(code)}" src="${q.createDataURL(8,2)}"></div>
      <div class="qp-st" id="qpSt">⏳ Menunggu pembayaran • sisa <b id="qpLeft">-</b></div>
      <small style="display:block;color:#6c5548">Scan dengan GoPay, OVO, DANA, ShopeePay, atau m-banking. Nominal sudah terisi otomatis. Di HP yang sama: tekan <b>Simpan QR</b>, lalu di aplikasi bank/e-wallet pilih Scan → gambar dari galeri.</small>
      <div class="qp-acts"><button class="btn primary" type="button" id="qpSimpan">⬇️ Simpan QR</button><button class="btn outline" type="button" id="qpCek">↻ Saya sudah bayar, cek sekarang</button><button class="btn light" type="button" id="qpNanti">Bayar nanti (lihat di 📦 Pesanan Saya)</button></div>`);
    document.getElementById("qpCek").onclick=()=>qpCekSekarang(code,true);
    document.getElementById("qpSimpan").onclick=()=>simpanQris(q,code,Number(d.total)||0);document.getElementById("qpNanti").onclick=tutupQris;
    const exp=new Date(d.expire).getTime();
    clearInterval(qpTick);qpTick=setInterval(()=>{const l=exp-Date.now(),el=document.getElementById("qpLeft");if(!el)return;
      if(l<=0){clearInterval(qpTick);clearInterval(qpTimer);qpHabis(code);return;}el.textContent=Math.floor(l/60000)+":"+String(Math.floor(l%60000/1000)).padStart(2,"0");},1000);
    clearInterval(qpTimer);qpTimer=setInterval(()=>qpCekSekarang(code,false),4000);
  }catch(e){
    qpRender(`<h2>💳 QRIS</h2><div class="qp-st bad">QRIS otomatis belum bisa dibuat.<br><small>${esc(e.message)}</small></div><p>Pesanan Anda tetap tersimpan. Hubungi toko lewat WhatsApp untuk cara bayar lain.</p><div class="qp-acts"><a class="btn primary" target="_blank" rel="noopener" href="${waLink(qpWa||("Halo KALENSARI STORE, saya ingin membayar pesanan "+code))}">💬 WhatsApp toko</a><button class="btn light" type="button" onclick="tutupQris()">Tutup</button></div>`);
  }
}
async function qpCekSekarang(code,manual){
  try{const d=await qrisApi({aksi:"cek",order_code:code});if(qpCode!==code)return;
    if(d.pay_status==="lunas")return qpLunas(code);
    if(d.pay_status==="kedaluwarsa"||d.pay_status==="gagal")return qpHabis(code);
    if(manual)showToast("Pembayaran belum diterima. Coba lagi beberapa detik lagi.");
  }catch(e){if(manual)showToast("Gagal mengecek: "+e.message);}
}
function qpLunas(code){
  clearInterval(qpTimer);clearInterval(qpTick);
  const rows=getLocalOrders().map(o=>o.order_code===code?{...o,pay_status:"lunas"}:o);saveLocalOrders(rows);renderMyOrders();
  qpRender(`<div style="font-size:64px">✅</div><h2 style="margin:4px 0">Pembayaran berhasil</h2><p>Pesanan <b>${esc(code)}</b> sudah <b>LUNAS</b> dan diteruskan ke penjual.</p>
    <div class="qp-acts">${qpWa?`<a class="btn primary" target="_blank" rel="noopener" href="${waLink(qpWa+"\n\n✅ SUDAH DIBAYAR LUNAS lewat QRIS")}">💬 Kirim nota ke WhatsApp</a>`:""}<button class="btn light" type="button" onclick="tutupQris()">Selesai</button></div>`);
}
function qpHabis(code){
  clearInterval(qpTimer);clearInterval(qpTick);
  qpRender(`<h2>⌛ Waktu bayar habis</h2><p>QRIS untuk pesanan <b>${esc(code)}</b> sudah tidak berlaku.</p><div class="qp-acts"><button class="btn primary" type="button" onclick="bayarQris('${esc(code)}')">Buat QRIS baru</button><button class="btn light" type="button" onclick="tutupQris()">Tutup</button></div>`);
}

// Simpan QR sebagai gambar PNG (putih bersih, ada nominal & kode pesanan) supaya bisa dipilih dari galeri di aplikasi bank/e-wallet
function simpanQris(q,code,total){
  const n=q.getModuleCount(),cell=Math.max(6,Math.floor(560/n)),qs=n*cell,pad=cell*4,W=qs+pad*2,H=70+pad+qs+pad*0.6+110;
  const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
  x.fillStyle="#ffffff";x.fillRect(0,0,W,H);
  x.fillStyle="#7a3e20";x.fillRect(0,0,W,70);
  x.fillStyle="#ffffff";x.font="bold 30px Arial,sans-serif";x.textAlign="center";x.fillText("KALENSARI STORE • QRIS",W/2,47);
  x.fillStyle="#140c08";for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(q.isDark(r,k))x.fillRect(pad+k*cell,70+pad+r*cell,cell,cell);
  x.fillStyle="#7a3e20";x.font="bold 44px Arial,sans-serif";x.fillText(rupiah(total),W/2,70+pad+qs+pad*0.6+40);
  x.fillStyle="#555";x.font="24px Arial,sans-serif";x.fillText("Pesanan "+code+" • berlaku 15 menit",W/2,70+pad+qs+pad*0.6+82);
  const nama="QRIS-"+code+".png";
  c.toBlob(b=>{if(!b){showToast("Gagal menyimpan gambar");return;}
    const f=new File([b],nama,{type:"image/png"});
    // iPhone: menu bagikan (ada "Simpan Gambar"); Android/komputer: langsung terunduh ke galeri/Download
    if(navigator.canShare&&navigator.canShare({files:[f]})&&/iPhone|iPad/i.test(navigator.userAgent)){navigator.share({files:[f],title:nama}).catch(()=>unduh(b));}
    else unduh(b);
  },"image/png");
  function unduh(b){const u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=nama;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);showToast("✅ QR disimpan. Buka aplikasi bank/e-wallet → Scan → pilih dari galeri.");}
}


// ===== PENGAMAN COD =====
// Aturan bisa diubah admin (menu "COD bermasalah"): batas nilai, konfirmasi WA pembeli baru, batas gagal.
var codAturan={maks:100000,wa_baru:true,maks_gagal:2,buka:{}};
const isCod=v=>/^cod/i.test(String(v||"").trim());
function pilihQrisCheckout(){const sel=document.querySelector('#checkoutForm select[name="payment"]');const o=sel&&[...sel.options].find(x=>/^qris/i.test(x.value||x.textContent));if(o){sel.value=o.value;sel.dispatchEvent(new Event("change"));}}
function totalCheckout(){return Number(String(document.getElementById("checkoutTotal")?.textContent||"").replace(/[^0-9]/g,""))||0;}
let codRiwayat={hp:"",t:0,data:null};
async function riwayatCod(phone){
  const hp=normalizePhone(phone);
  if(codRiwayat.hp===hp&&Date.now()-codRiwayat.t<60000)return codRiwayat.data;
  let rows=[];try{rows=await bacaAman("cod_riwayat",{p_wa:hp},()=>cloudFetch(`orders?select=status,payment,gagal_at,updated_at&customer_phone_normalized=eq.${encodeURIComponent(hp)}&status=in.(selesai,gagal)`));}catch(e){rows=null;}
  codRiwayat={hp,t:Date.now(),data:Array.isArray(rows)?rows:null};return codRiwayat.data;
}
async function codInfo(phone){
  const A=codAturan||{},maks=Number(A.maks)||0,hp=normalizePhone(phone),total=totalCheckout();
  const rows=await riwayatCod(phone);
  if(rows===null)return{boleh:true,tahan:A.wa_baru!==false,pesan:""};      // gagal cek riwayat: tetap boleh, tapi dikonfirmasi WA
  const buka=Date.parse((A.buka||{})[hp]||"")||0;
  const gagal=rows.filter(o=>o.status==="gagal"&&isCod(o.payment)&&(Date.parse(o.gagal_at||o.updated_at||"")||0)>buka).length;
  const selesai=rows.filter(o=>o.status==="selesai").length;
  const maksGagal=Number(A.maks_gagal)||2;
  if(gagal>=maksGagal)return{boleh:false,gagal,selesai,pesan:`COD belum bisa dipakai untuk nomor ini karena ${gagal}x pesanan gagal diantar.\n\nSilakan pilih pembayaran QRIS. Hubungi admin jika ada kekeliruan.`};
  if(maks>0&&total>maks)return{boleh:false,gagal,selesai,pesan:`COD maksimal ${rupiah(maks)}.\n\nTotal pesanan Anda ${rupiah(total)}, silakan bayar dengan QRIS.`};
  return{boleh:true,gagal,selesai,tahan:A.wa_baru!==false&&selesai===0,pesan:""};
}
(function(){
  const sel=document.querySelector('#checkoutForm select[name="payment"]');if(!sel)return;
  const hint=document.createElement("small");hint.id="codHint";hint.style.cssText="display:block;margin-top:6px;font-size:12px;line-height:1.45";sel.insertAdjacentElement("afterend",hint);
  let n=0;
  async function cek(){
    const my=++n;
    if(!isCod(sel.value)){hint.textContent="";return;}
    const maks=Number(codAturan.maks)||0;
    if(!checkoutBuyer){hint.style.color="#7a5b00";hint.textContent=maks?`COD maksimal ${rupiah(maks)}.`:"";return;}
    hint.style.color="#6b7280";hint.textContent="Mengecek COD…";
    const ci=await codInfo(phoneShow(checkoutBuyer.wa));if(my!==n)return;
    if(!ci.boleh){hint.style.color="#c0392b";hint.textContent="⚠️ "+ci.pesan.split("\n")[0]+" Pilih QRIS.";}
    else if(ci.tahan){hint.style.color="#9a6700";hint.textContent="📞 COD pertama: admin konfirmasi lewat WhatsApp dulu sebelum pesanan diteruskan ke toko.";}
    else{hint.style.color="#14502c";hint.textContent=`✅ Bisa COD${maks?` (maksimal ${rupiah(maks)})`:""}.`;}
  }
  sel.addEventListener("change",cek);
  const tot=document.getElementById("checkoutTotal");if(tot)new MutationObserver(cek).observe(tot,{childList:true,characterData:true,subtree:true});
})();


// ===== FOTO TOKO =====
// Penjual mengunggah foto dari aplikasi penjual -> store_settings "foto_toko_<id penjual>" = {foto, t, toko}.
// Ditampilkan di daftar Toko dan di bar "Produk dari ...". Disimpan sementara di perangkat supaya cepat.
var sellerIdMap={},shopFotos={};
try{const c=JSON.parse(localStorage.getItem("kalensari_shop_fotos")||"{}");if(c&&typeof c==="object")shopFotos=c;}catch(e){}
let fotoTokoJalan=null;
function muatFotoToko(){
  if(fotoTokoJalan||!CLOUD_CONFIG?.enabled)return fotoTokoJalan;
  fotoTokoJalan=(async()=>{try{
    const rows=await cloudFetch("store_settings?select=key,value&key=like.foto_toko_*");if(!Array.isArray(rows))return;
    const m={};rows.forEach(r=>{const v=r.value||{},id=String(r.key).slice(10),k=sellerIdMap[id]||sellerKey(v.toko);if(k&&v.foto)m[k]=v.foto;});
    shopFotos=m;try{localStorage.setItem("kalensari_shop_fotos",JSON.stringify(m));}catch(e){}
    if(document.getElementById("shopPanel")&&!document.getElementById("shopPanel").hidden)renderShopList();
    if(activeSeller)renderSellerBar();
  }catch(e){}})();return fotoTokoJalan;
}


// ===== LACAK KURIR (pembeli) =====
// Kurir yang sedang mengantar mengirim posisinya ke store_settings "lacak_<kode>" (diperbarui ±15 detik sekali).
function lacakKurir(code){
  const o=getLocalOrders().find(x=>x.order_code===code)||{};
  const m=String(o.note||"").match(/__KS_MAP__(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)__END__/),tuju=m?{lat:+m[1],lng:+m[2]}:null;
  document.getElementById("lacakBox")?.remove();
  const ov=document.createElement("div");ov.id="lacakBox";ov.className="lacak-ov";
  ov.innerHTML=`<div class="lacak-card"><div class="lacak-head"><b>🛵 Lacak kurir • ${esc(code)}</b><button type="button" aria-label="Tutup" data-x>✕</button></div>
    <div id="lacakMap" class="lacak-map"><p>Memuat posisi kurir…</p></div><div id="lacakInfo" class="lacak-info"></div></div>`;
  document.body.appendChild(ov);
  let timer=null,lastKey="",fotoK;
  const tutup=()=>{clearInterval(timer);ov.remove();};
  ov.addEventListener("click",e=>{if(e.target===ov||e.target.closest("[data-x]"))tutup();});
  const jarak=(a,b)=>{const R=6371,r=x=>x*Math.PI/180,dA=r(b.lat-a.lat),dB=r(b.lng-a.lng),h=Math.sin(dA/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dB/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
  async function muat(){
    if(!document.body.contains(ov))return clearInterval(timer);
    let v=null;try{const r=await cloudFetch("store_settings?select=value&key=eq."+encodeURIComponent("lacak_"+code));v=r&&r[0]&&r[0].value;}catch(e){}
    const map=document.getElementById("lacakMap"),info=document.getElementById("lacakInfo");if(!map)return;
    if(!v||!v.lat){map.innerHTML='<p>📡 Kurir belum membagikan lokasi.<br><small>Posisi muncul saat kurir membuka aplikasinya dan GPS menyala.</small></p>';info.innerHTML="";return;}
    const k=v.lat+","+v.lng;
    if(k!==lastKey){lastKey=k;await petaLacak(map,v,tuju);}
    const dtk=Math.max(0,Math.round((Date.now()-Number(v.t||0))/1000)),lalu=dtk<60?dtk+" detik":dtk<3600?Math.round(dtk/60)+" menit":"lebih dari 1 jam";
    const km=tuju?jarak(v,tuju):null;
    if(v.id&&fotoK===undefined){fotoK=null;cloudFetch("store_settings?select=value&key=eq."+encodeURIComponent("foto_kurir_"+v.id)).then(r=>{fotoK=r&&r[0]&&r[0].value&&r[0].value.foto||null;const a=document.getElementById("lacakAv");if(a&&fotoK){a.style.backgroundImage=`url('${fotoK}')`;a.textContent="";}}).catch(()=>{});}
    info.innerHTML=`<div class="lacak-kurir"><span id="lacakAv" class="lacak-av"${fotoK?` style="background-image:url('${fotoK}')"`:""}>${fotoK?"":"🛵"}</span><p><b>${esc(v.nama||"Kurir")}</b><br>sedang menuju alamat Anda</p></div>
      ${km!=null?`<p>Jarak ke lokasi Anda ± <b>${km<1?Math.round(km*1000)+" m":km.toFixed(1).replace(".",",")+" km"}</b>${km<0.15?" • kurir sudah dekat 🎉":""}</p>`:""}
      <p class="lacak-t">Diperbarui ${lalu} lalu${dtk>180?" • kurir mungkin sedang tidak membuka aplikasinya":""}</p>
      <div class="lacak-act">${v.wa?`<a class="btn outline small" target="_blank" rel="noopener" href="https://wa.me/${esc(String(v.wa).replace(/\D/g,""))}">💬 Chat kurir</a>`:""}<a class="btn outline small" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(k)}">Buka di Google Maps</a></div>`;
  }
  muat();timer=setInterval(muat,15000);
}
// Peta OpenStreetMap (Leaflet, gratis tanpa API key): 🛵 posisi kurir, 🏠 lokasi pembeli
let leafletSiap=null,lacakPeta=null;
function muatLeaflet(){
  if(window.L)return Promise.resolve();if(leafletSiap)return leafletSiap;
  leafletSiap=new Promise((ok,no)=>{const c=document.createElement("link");c.rel="stylesheet";c.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(c);
    const j=document.createElement("script");j.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";j.onload=ok;j.onerror=()=>{leafletSiap=null;no(new Error("peta gagal dimuat"))};document.head.appendChild(j);});
  return leafletSiap;
}
async function petaLacak(box,v,tuju){
  try{await muatLeaflet();}catch(e){box.innerHTML=`<p>Peta tidak bisa dimuat.<br><a href="https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}" target="_blank" rel="noopener">Lihat posisi kurir di Google Maps</a></p>`;lacakPeta=null;return;}
  const ik=(t,c)=>L.divIcon({className:"lacak-pin "+c,html:`<span>${t}</span>`,iconSize:[40,40],iconAnchor:[20,20]});
  const pos=[v.lat,v.lng];
  if(!lacakPeta||!box.contains(lacakPeta.el)){
    box.innerHTML="";const el=document.createElement("div");el.className="lacak-leaflet";box.appendChild(el);
    const m=L.map(el,{zoomControl:true,attributionControl:true}).setView(pos,16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(m);
    const kur=L.marker(pos,{icon:ik("🛵","kurir"),zIndexOffset:1000}).addTo(m);
    let garis=null;if(tuju){L.marker([tuju.lat,tuju.lng],{icon:ik("🏠","rumah")}).addTo(m);garis=L.polyline([pos,[tuju.lat,tuju.lng]],{color:"#7b3f1d",weight:3,dashArray:"6 8",opacity:.8}).addTo(m);m.fitBounds(L.latLngBounds([pos,[tuju.lat,tuju.lng]]),{padding:[40,40],maxZoom:17});}
    lacakPeta={el,m,kur,garis};setTimeout(()=>m.invalidateSize(),150);return;
  }
  lacakPeta.kur.setLatLng(pos);if(lacakPeta.garis&&tuju)lacakPeta.garis.setLatLngs([pos,[tuju.lat,tuju.lng]]);
  if(!lacakPeta.m.getBounds().pad(-0.1).contains(pos))lacakPeta.m.panTo(pos);
}

// rincian checkout ikut berubah saat cara bayar diganti (catatan QRIS sekali bayar untuk semua nota)
document.querySelector('#checkoutForm select[name="payment"]')?.addEventListener("change",()=>renderCart());

// ===== Total nota selalu terlihat: ringkasan + tombol menempel di bawah keranjang & checkout =====
(function(){
  const box=document.querySelector("#cartModal .modal-box"),sum=box&&box.querySelector(".summary"),btn=document.getElementById("checkoutBtn");
  if(box&&sum&&btn&&!document.getElementById("cartFoot")){const f=document.createElement("div");f.id="cartFoot";f.className="sticky-foot";sum.parentNode.insertBefore(f,sum);f.appendChild(sum);f.appendChild(btn);}
  const form=document.getElementById("checkoutForm"),tot=form&&form.querySelector(".checkout-total"),sub=form&&form.querySelector('button[type="submit"]');
  if(tot&&sub&&!document.getElementById("coFoot")){const f=document.createElement("div");f.id="coFoot";f.className="sticky-foot";tot.parentNode.insertBefore(f,tot);f.appendChild(tot);f.appendChild(sub);}
})();
{const t=document.querySelector('#checkoutForm textarea[name="note"]');if(t)t.placeholder="Contoh: dekat musola, gang 1 (opsional)";}

// ===== Tombol checkout: "Konfirmasi Pesanan" + wajib kata sandi (PIN) akun pembeli =====
{const b=document.querySelector('#checkoutForm button[type="submit"]');if(b)b.textContent="✅ Konfirmasi Pesanan";}
async function hashPinPembeli(wa,pin){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("kalensari-pembeli:"+wa+":"+pin));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");}
function mintaKataSandi(wa){
  return new Promise(selesai=>{
    document.getElementById("pinBox")?.remove();
    const ov=document.createElement("div");ov.id="pinBox";ov.className="pin-ov";
    ov.innerHTML=`<div class="pin-card"><b>🔒 Konfirmasi pesanan</b><p>Masukkan kata sandi (PIN) akun Anda untuk melanjutkan.</p>
      <input id="pinIn" type="password" inputmode="numeric" maxlength="8" autocomplete="current-password" placeholder="• • • •">
      <small id="pinErr"></small><div class="pin-act"><button type="button" class="btn light" id="pinBatal">Batal</button><button type="button" class="btn primary" id="pinOk">Konfirmasi</button></div></div>`;
    document.body.appendChild(ov);
    const inp=ov.querySelector("#pinIn"),err=ov.querySelector("#pinErr"),ok=ov.querySelector("#pinOk");let salah=0,sibuk=false;
    const tutup=v=>{ov.remove();selesai(v);};
    setTimeout(()=>inp.focus(),80);
    inp.oninput=()=>{inp.value=inp.value.replace(/\D/g,"");err.textContent="";};
    inp.onkeydown=e=>{if(e.key==="Enter")ok.click();};
    ov.querySelector("#pinBatal").onclick=()=>tutup(false);
    ok.onclick=async()=>{
      if(sibuk)return;const pin=inp.value;if(pin.length<4){err.textContent="Masukkan 4–8 angka kata sandi Anda.";return;}
      sibuk=true;ok.textContent="Memeriksa…";
      try{
        const base=String(CLOUD_CONFIG.supabaseUrl).replace(/\/$/,"");
        const r=await fetch(base+"/rest/v1/rpc/masuk_akun",{method:"POST",headers:{apikey:CLOUD_CONFIG.supabaseAnonKey,Authorization:"Bearer "+CLOUD_CONFIG.supabaseAnonKey,"Content-Type":"application/json"},body:JSON.stringify({p_peran:"pembeli",p_wa:wa,p_pin:pin})});
        const j=await r.json().catch(()=>null);if(!r.ok)throw new Error("server");
        if(j&&j.ok)return tutup(pin);
        salah++;inp.value="";err.textContent=String((j&&j.pesan)||"Kata sandi salah.").replace("Nomor atau PIN salah","Kata sandi salah");
        if(j&&j.kunci)setTimeout(()=>tutup(false),2500);
      }catch(e){err.textContent="Gagal memeriksa kata sandi. Periksa koneksi lalu coba lagi.";}
      finally{sibuk=false;ok.textContent="Konfirmasi";}
    };
  });
}

// ===== KARTU LAPAK BARTER di bawah daftar produk (3 iklan terbaru dari pasar.html) =====
(function(){
  if(document.getElementById("lapakCard"))return;
  const ref=document.querySelector(".wa-banner")||document.querySelector("footer");if(!ref)return;
  const sec=document.createElement("section");sec.className="container";sec.id="lapakCard";
  sec.innerHTML=`<div class="lk"><a class="lk-top" href="pasar.html"><div class="lk-ic">🔁</div><div><h3>Lapak Barter Kalensari</h3><p>Punya barang tak terpakai? Jual atau tukar dengan warga lain.</p></div></a>
    <div class="lk-row" id="lapakRow"><div class="lk-kosong">Memuat iklan terbaru…</div></div>
    <div class="lk-btn"><a class="w" href="pasar.html">Lihat lapak →</a><a class="o" href="pasar.html#/pasang">+ Pasang iklan</a></div></div>`;
  ref.parentNode.insertBefore(sec,ref);
  const row=sec.querySelector("#lapakRow");
  const tag=i=>i.harga?`<span class="j">${rupiah(i.harga)}</span>`:i.barter?`<span class="b">🔁 Barter</span>`:`<span class="n">Nego</span>`;
  (async()=>{
    let l=[];try{if(CLOUD_CONFIG?.enabled)l=await cloudFetch("lapak_iklan?select=id,judul,harga,barter,thumb&status=eq.aktif&order=created_at.desc&limit=3");}catch(e){l=null;}
    if(!Array.isArray(l)||!l.length){row.innerHTML=`<div class="lk-kosong">${l===null?"Lapak sedang disiapkan.":"Belum ada iklan. Jadilah yang pertama memasang barang!"}</div>`;return;}
    row.innerHTML=l.map(i=>`<a class="lk-it" href="pasar.html#/i/${i.id}"><div class="lk-ph"${i.thumb?` style="background-image:url('${i.thumb}')"`:""}>${i.thumb?"":"📦"}</div><b>${esc(i.judul)}</b>${tag(i)}</a>`).join("");
  })();
})();

// crop.js: semua upload foto di toko (mis. foto produk admin) bisa dipotong dulu
(function(){if(window.KSPW||document.querySelector('script[src*="pesanan-warga.js"]'))return;const s=document.createElement("script");s.src="pesanan-warga.js";s.onload=()=>{if(myOrdersLast)renderMyOrders(myOrdersLast);};document.head.appendChild(s);})();
(function(){if(window.KSUlasan||document.querySelector('script[src*="ulasan.js"]'))return;const s=document.createElement("script");s.src="ulasan.js";s.onload=()=>{if(myOrdersLast)renderMyOrders(myOrdersLast);};document.head.appendChild(s);})();
(function(){if(window.KSCrop||document.querySelector('script[src*="crop.js"]'))return;const s=document.createElement("script");s.src="crop.js";document.head.appendChild(s);})();

// ===== Label pilihan alamat di checkout: "Alamat utama" (alamat dikelola di akun warga) =====
{const r=document.querySelector('#checkoutForm [name="addrMode"][value="rumah"]');const l=r&&r.closest("label");if(l)[...l.childNodes].forEach(n=>{if(n.nodeType===3&&/Alamat rumah/.test(n.textContent))n.textContent=" 🏠 Alamat utama";});}

// ===== PRODUK FAVORIT ❤️ (disimpan di HP ini) =====
let favorit=readLS("kalensari_favorit",[]);if(!Array.isArray(favorit))favorit=[];
let hanyaFavorit=false;
const isFav=id=>favorit.includes(Number(id));
function toggleFav(id,ev){if(ev){ev.stopPropagation();ev.preventDefault();}id=Number(id);const on=!isFav(id);favorit=on?[...favorit,id]:favorit.filter(x=>x!==id);localStorage.setItem("kalensari_favorit",JSON.stringify(favorit));
  document.querySelectorAll(`[data-fav="${id}"]`).forEach(b=>{b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);b.textContent=favLabel(on);});
  showToast(on?"❤️ Disimpan ke favorit":"Dihapus dari favorit");if(hanyaFavorit)renderProducts();}
function bukaFavorit(on=true){hanyaFavorit=on;if(on){activeCategory="Semua";activeSeller="";}renderProducts();if(on)document.getElementById("productGrid")?.scrollIntoView({behavior:"smooth",block:"start"});}
const favLabel=on=>on?"❤️ Favorit saya":"🤍 Simpan ke favorit";
const favBtn=p=>`<button type="button" class="fav-pill${isFav(p.id)?" on":""}" data-fav="${p.id}" aria-pressed="${isFav(p.id)}" onclick="toggleFav(${p.id},event)">${favLabel(isFav(p.id))}</button>`;
// Tombol favorit hanya di halaman Detail produk (kartu produk tetap rapi)
{const _show=showProduct;showProduct=function(id){const r=_show.apply(this,arguments);const box=document.getElementById("productDetail"),h=box&&box.querySelector(".detail h2");const p=detailProduct;if(h&&p&&!box.querySelector(".fav-pill"))h.insertAdjacentHTML("afterend",favBtn(p));return r;};
 const _render=renderProducts;renderProducts=function(){
   if(!hanyaFavorit)return _render();
   const keep=products;try{products=products.filter(p=>isFav(p.id)||(groupName(p)&&products.some(x=>isFav(x.id)&&groupName(x).toLowerCase()===groupName(p).toLowerCase())));_render();}finally{products=keep;}
   const bar=document.getElementById("sellerFilterBar");if(bar){bar.hidden=false;bar.innerHTML=`<span>❤️ Produk favorit saya</span><button type="button" onclick="bukaFavorit(false)">× Semua produk</button>`;}
   if(!favorit.length)document.getElementById("productGrid").innerHTML='<div class="empty-state"><b>🤍 Belum ada favorit</b>Buka <b>Detail</b> produk lalu ketuk 🤍 Simpan ke favorit.</div>';
 };
 const _setSeller=setSeller;setSeller=function(k){hanyaFavorit=false;return _setSeller(k);};}
// Menu ☰: tambah "Favorit saya"
setTimeout(()=>{const m=document.querySelector(".ks-menu");if(m&&!m.querySelector("[data-fav-menu]")){const b=document.createElement("button");b.type="button";b.setAttribute("role","menuitem");b.dataset.favMenu="1";b.innerHTML="❤️ Favorit saya";b.onclick=()=>{m.classList.remove("open");bukaFavorit(true);};m.insertBefore(b,m.children[1]||null);}},0);

// ===== PESAN LAGI dari riwayat =====
window.ksPesanLagi=function(list,racik){
  let n=0;const lewat=[];
  (list||[]).forEach(x=>{const p=products.find(y=>y.id===Number(x.id));if(!p||p.status!=="Show"){lewat.push(p?p.name:"produk lama");return;}
    const seller=x.seller&&productHasSeller(p,sellerKey(x.seller))?x.seller:(sellerList(p)[0]||p.seller||"");const st=stokOf(p),ada=qtyDiCart(p.id);let q=Number(x.qty)||1;if(st!==null)q=Math.min(q,st-ada);if(q<=0){lewat.push(p.name+" (stok habis)");return;}
    if(hasVariants(p)){const v=parseVariants(p).find(y=>y.name===x.v);if(!v||v.habis){lewat.push(p.name+(x.v?` (${x.v})`:"")+" — pilih varian ulang");return;}
      const c=cart.find(y=>y.id===p.id&&(y.seller||"")===seller&&y.custom&&y.custom.v===x.v&&!y.custom.t);if(c){c.qty+=q;delete c.off;}else cart.push({id:p.id,qty:q,seller,custom:{v:x.v}});n++;return;}
    const c=cart.find(y=>y.id===p.id&&(y.seller||"")===seller&&!y.custom);if(c){c.qty+=q;delete c.off;}else cart.push({id:p.id,qty:q,seller});n++;});
  saveCart();updateCartCount();renderCart();
  document.querySelectorAll(".modal.show").forEach(m=>m.classList.remove("show"));
  if(n)openModal("cartModal");
  const pesan=[n?`🔁 ${n} produk dimasukkan ke keranjang`:"Tidak ada produk yang bisa dipesan lagi",lewat.length?`Tidak tersedia: ${lewat.join(", ")}`:"",racik&&racik.length?`Pilih ulang topping: ${racik.join(", ")}`:""].filter(Boolean).join(" • ");
  showToast(pesan);
};
if(location.hash==="#keranjang"||location.hash==="#favorit"){const h=location.hash;history.replaceState(null,"",location.pathname+location.search);
  setTimeout(()=>{if(h==="#favorit")return bukaFavorit(true);try{const r=JSON.parse(sessionStorage.getItem("kalensari_racik_ulang")||"null");sessionStorage.removeItem("kalensari_racik_ulang");if(r&&r.length)setTimeout(()=>showToast("Pilih ulang topping: "+r.join(", ")),1500);}catch(e){}renderCart();openModal("cartModal");},600);}

// ===== CHECKOUT BARU: Konfirmasi alamat → Lanjut pembayaran (QRIS / COD) → kata sandi → ✅ nota berhasil =====
let bayarDipilih="",KS_SUKSES=null,saldoDipakai=0;
// ===== SALDO VOUCHER BELANJA (tabel pembeli_saldo; dipakai lewat fungsi database pakai_saldo + PIN) =====
const QRIS_MIN=1000;   // sisa bayar QRIS minimal
async function muatSaldoVoucher(wa){if(!CLOUD_CONFIG?.enabled||!wa)return 0;try{const ss=sesiPembeli();if(ss&&window.KSPesanan){const j=await KSPesanan.baca("saldo_saya",{p_sesi:ss,p_peran:"pembeli"},()=>null);if(j)return Number(j.saldo)||0;}const r=await cloudFetch("pembeli_saldo?select=saldo&wa=eq."+encodeURIComponent(normalizePhone(wa)));return Number(r&&r[0]&&r[0].saldo)||0;}catch(e){return 0;}}
// saldo yang dipakai bersama QRIS: sisa bayar QRIS tidak boleh di bawah QRIS_MIN
function jatahSaldo(saldo,total){let x=Math.min(saldo,total);if(total-x>0&&total-x<QRIS_MIN)x=total-QRIS_MIN;return Math.max(0,x);}
async function pakaiSaldoRpc(wa,pin,codes,jumlah){const base=String(CLOUD_CONFIG.supabaseUrl).replace(/\/$/,"");
  const r=await fetch(base+"/rest/v1/rpc/pakai_saldo",{method:"POST",headers:{apikey:CLOUD_CONFIG.supabaseAnonKey,Authorization:"Bearer "+CLOUD_CONFIG.supabaseAnonKey,"Content-Type":"application/json"},body:JSON.stringify({p_wa:normalizePhone(wa),p_pin:pin,p_codes:codes,p_jumlah:jumlah})});
  const t=await r.text();if(!r.ok){let m=t;try{m=JSON.parse(t).message||t}catch(e){}throw new Error(m);}const j=t?JSON.parse(t):{};if(j&&j.ok===false)throw new Error(j.pesan||"Gagal memakai saldo");return j;}
{const m=document.getElementById("checkoutModal");if(m){const ey=m.querySelector(".eyebrow");if(ey)ey.textContent="KONFIRMASI ALAMAT";const nt=m.querySelector(".checkout-note");if(nt)nt.textContent="Periksa alamat pengiriman, lalu lanjut ke pembayaran.";}
 const sel=document.querySelector('#checkoutForm select[name="payment"]');if(sel){[...sel.options].forEach(o=>{if(/transfer/i.test(o.textContent))o.remove();});sel.insertAdjacentHTML("afterbegin",'<option value="" selected>-</option>');sel.value="";const l=sel.closest("label");if(l){l.hidden=true;l.style.display="none";}}
 const b=document.querySelector('#checkoutForm button[type="submit"]');if(b)b.textContent="➡️ Lanjut Pembayaran";}
async function bukaPilihBayar(awal){
  document.getElementById("payBox")?.remove();
  const tot=document.getElementById("checkoutTotal")?.textContent||"";
  const totNum=cartGroups().filter(g=>g.on).reduce((t,g)=>t+g.sub+g.fee,0);
  const saldo=checkoutBuyer?await muatSaldoVoucher(checkoutBuyer.wa):0;
  const ov=document.createElement("div");ov.id="payBox";ov.className="pay-ov";
  ov.innerHTML=`<div class="pay-card" role="dialog" aria-label="Pilih pembayaran"><span class="eyebrow">LANJUT PEMBAYARAN</span><h3>Pilih cara bayar</h3><div class="pay-tot"><span>Total bayar</span><b>${esc(tot)}</b></div>
    ${saldo>=totNum&&totNum>0?`<button type="button" class="pay-opt" data-p="Saldo voucher"><i>🎟️</i><span><b>Saldo voucher belanja</b><small>Bayar penuh pakai saldo voucher Anda (${rupiah(saldo)}). Langsung lunas.</small></span><em></em></button>`:""}
    <button type="button" class="pay-opt" data-p="QRIS"><i>📱</i><span><b>QRIS</b><small>Bayar sekarang pakai DANA, OVO, GoPay, ShopeePay atau m-banking. Otomatis lunas.</small></span><em></em></button>
    <button type="button" class="pay-opt" data-p="COD (jika tersedia)"><i>💵</i><span><b>COD (bayar di tempat)</b><small>Bayar tunai ke kurir saat pesanan sampai.</small></span><em></em></button>
    ${saldo>0&&saldo<totNum?`<label class="pay-saldo" id="paySaldoBox"><input type="checkbox" id="paySaldo" checked><span>🎟️ Pakai saldo voucher <b>${rupiah(saldo)}</b><small id="paySaldoInfo"></small></span></label>`:""}
    <button type="button" class="btn primary full" id="payOk" disabled>Konfirmasi</button><button type="button" class="pay-x" id="payX">Kembali ke alamat</button></div>`;
  document.body.appendChild(ov);
  const cb=ov.querySelector("#paySaldo"),info=ov.querySelector("#paySaldoInfo");
  const pakai=v=>v==="Saldo voucher"?totNum:(cb&&cb.checked&&/^qris/i.test(v||"QRIS")?jatahSaldo(saldo,totNum):0);
  let pil="";const pilih=v=>{pil=v;ov.querySelectorAll(".pay-opt").forEach(x=>x.classList.toggle("on",x.dataset.p===v));
    const sv=pakai(v),ok=ov.querySelector("#payOk");ok.disabled=!v;
    if(cb){const cod=/^cod/i.test(v||"");cb.disabled=cod;ov.querySelector("#paySaldoBox").classList.toggle("off",cod||!cb.checked);
      info.textContent=cod?"Saldo voucher hanya bisa dipakai dengan QRIS.":cb.checked?`Dipakai ${rupiah(jatahSaldo(saldo,totNum))} • sisa bayar QRIS ${rupiah(totNum-jatahSaldo(saldo,totNum))}`:"Tidak dipakai";}
    ok.textContent=!v?"Konfirmasi":v==="Saldo voucher"?"Konfirmasi • bayar pakai saldo":/^qris/i.test(v)?(sv?`Konfirmasi • QRIS ${rupiah(totNum-sv)} + saldo`:"Konfirmasi • bayar dengan QRIS"):"Konfirmasi • bayar COD";};
  if(cb)cb.onchange=()=>pilih(pil);
  ov.querySelectorAll(".pay-opt").forEach(x=>x.onclick=()=>pilih(x.dataset.p));if(awal)pilih(awal);
  ov.onclick=e=>{if(e.target===ov)ov.remove();};ov.querySelector("#payX").onclick=()=>ov.remove();
  pilih(pil||awal||"");
  ov.querySelector("#payOk").onclick=()=>{if(!pil)return;bayarDipilih=pil;saldoDipakai=pakai(pil);const sel=document.querySelector('#checkoutForm select[name="payment"]');if(sel){sel.value=pil;try{renderCart();}catch(e){}}ov.remove();document.getElementById("checkoutForm").requestSubmit();};
}
// QRIS lunas → minta kata sandi → nota berhasil
{const _lunas=qpLunas;qpLunas=async function(code){
  if(!(KS_SUKSES&&KS_SUKSES.codes.includes(code)))return _lunas(code);
  const s=KS_SUKSES;KS_SUKSES=null;clearInterval(qpTimer);clearInterval(qpTick);
  saveLocalOrders(getLocalOrders().map(o=>s.codes.includes(o.order_code)?{...o,pay_status:"lunas"}:o));renderMyOrders();
  tutupQris();showToast("💳 Pembayaran diterima");
  let ok=s.pinOk||await mintaKataSandi(s.wa);
  while(!ok){if(!confirm("Pembayaran Anda sudah LUNAS ✅\n\nMasukkan kata sandi untuk menyelesaikan dan melihat nota?\n(Batal = lihat nanti di 📦 Pesanan Saya)")){showToast("Pesanan sudah lunas. Nota ada di 📦 Pesanan Saya");return;}ok=await mintaKataSandi(s.wa);}
  tampilSukses({...s,lunas:true});
};}
function tampilSukses(s){
  document.getElementById("suksesBox")?.remove();
  const q=/^(qris|saldo)/i.test(s.payment),ov=document.createElement("div");ov.id="suksesBox";ov.className="ok-ov";
  ov.innerHTML=`<button type="button" class="ok-x" id="okX" aria-label="Tutup dan kembali ke toko">✕</button><div class="ok-card ok-v2"><span class="ok-daun l" aria-hidden="true"></span><span class="ok-daun r" aria-hidden="true"></span>
    <div class="ok-cek"><i class="ok-cf" aria-hidden="true"></i><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54"/><path d="M36 62 L53 79 L86 44"/></svg></div>
    <h2>Pesanan berhasil dibuat!</h2><p class="ok-sub">Terima kasih, <b>${esc(s.nama||"Warga")}</b> 🙏<br>Pesanan Anda sudah diteruskan ke ${s.groups.length>1?s.groups.length+" toko":"toko"} dan akan segera diproses.</p>
    <div class="ok-bayar ${q?"lunas":""}"><span class="ok-bi" aria-hidden="true">${q?"✅":"💵"}</span><span>${/^saldo/i.test(s.payment)?"Sudah dibayar <b>LUNAS</b> pakai saldo voucher":q?`Sudah dibayar <b>LUNAS</b> lewat QRIS${s.saldo?` + saldo voucher ${rupiah(s.saldo)}`:""}`:`Bayar tunai <b>${rupiah(s.total)}</b> ke kurir saat pesanan sampai`}</span></div>
    ${s.codTahan?'<div class="ok-info">📞 Ini pesanan COD pertama Anda. Admin akan menghubungi lewat WhatsApp untuk konfirmasi, lalu pesanan diteruskan ke toko.</div>':""}
    <div class="ok-nota"><div class="ok-nh"><b><span class="ok-ni" aria-hidden="true">📄</span>NOTA PESANAN</b><small>📅 ${new Date(s.t||Date.now()).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"})}</small></div>
      ${s.groups.map((g,i)=>`<div class="ok-g"><div class="ok-gh"><b>${s.groups.length>1?`Nota ${i+1} • `:""}${esc(s.codes[i])}</b><span>🏪 ${esc(g.nama)}</span></div>
        ${g.items.map(x=>`<div class="ok-r"><span>${esc(x.n)} ×${x.q}</span><span>${rupiah(x.h)}</span></div>`).join("")}
        <div class="ok-r m"><span>Ongkir</span><span>${g.ong>0?rupiah(g.ong):"Gratis"}</span></div>${s.groups.length>1?`<div class="ok-r m"><span>Total nota</span><span>${rupiah(g.tot)}</span></div>`:""}</div>`).join("")}
      <div class="ok-r t"><span><i aria-hidden="true">👛</i>Total ${q?"dibayar":"bayar"}</span><b>${rupiah(s.total)}</b></div>
      <div class="ok-alamat"><i aria-hidden="true">📍</i><span><b>Antar ke:</b> ${esc(s.address||"-")}</span></div>
      ${s.kodeST?`<div class="ok-kode"><i aria-hidden="true">🔑</i><span>Kode serah terima: <b>${esc(s.kodeST)}</b><small>Sebutkan ke kurir hanya saat pesanan sudah Anda terima.</small></span></div>`:""}</div>
    <p class="ok-terima"><em>Terima kasih sudah belanja di</em><b>Kalensari Store</b><small>Dukung usaha warga desa kita! 💚</small></p>
    <button type="button" class="btn primary full ok-kembali" id="okKembali">🛍️ Kembali ke Kalensari Store <span aria-hidden="true">→</span></button>
    <button type="button" class="ok-lihat" id="okLihat">📦 Lihat status di Pesanan Saya <span aria-hidden="true">→</span></button><div class="ok-desa" aria-hidden="true"></div></div>`;
  document.body.appendChild(ov);document.body.classList.add("ok-open");
  const tutup=()=>{ov.remove();document.body.classList.remove("ok-open");document.querySelectorAll(".modal.show").forEach(m=>m.classList.remove("show"));};
  ov.querySelector("#okKembali").onclick=()=>{tutup();scrollTo({top:0,behavior:"smooth"});};
  ov.querySelector("#okX").onclick=()=>{tutup();scrollTo({top:0,behavior:"smooth"});};
  ov.querySelector("#okLihat").onclick=()=>{tutup();openModal("myOrdersModal");try{refreshMyOrders();}catch(e){}};
}

// ===== KONTAK SUPPORT di bagian bawah halaman utama (diisi dari Admin > Pengaturan > Kontak Support) =====
function tampilKontakSupport(k){
  if(!k||typeof k!=="object")return;
  const em=document.getElementById("ksSupEmail"),tl=document.getElementById("ksSupTelp"),al=document.getElementById("ksSupAlamat");
  if(em&&k.email){em.textContent=k.email;em.href="mailto:"+k.email;}
  if(tl&&k.telp){const d=String(k.telp).replace(/\D/g,"").replace(/^0/,"62");tl.textContent=k.telp;tl.href="tel:+"+d;}
  if(al&&k.alamat)al.textContent=k.alamat;
}
try{tampilKontakSupport(JSON.parse(localStorage.getItem("kalensari_kontak_support")||"null"));}catch(e){}

// ===== MENU MENURUT CUACA (Open-Meteo, gratis tanpa API key) =====
// Panas (>= 30°C, tidak hujan) -> minuman segar/dingin di atas. Hujan atau <= 26°C -> makanan/minuman hangat di atas.
// Produk tidak disembunyikan, hanya urutan. Titik cuaca = rata-rata lokasi toko, atau titik desa di bawah ini.
const CUACA_DESA={lat:-6.42,lng:108.29};   // titik cadangan Desa Kalensari (boleh diubah)
const CUACA_SIMPAN=30*60*1000;             // cuaca diperbarui tiap 30 menit
function jenisMenu(p){
  const t=` ${p.name||""} ${groupName?groupName(p)||"":""} ${p.category||""} ${p.unit||""} `.toLowerCase();
  if(/\b(panas|hangat|anget)\b/.test(t))return"hangat";
  if(/\b(es|ice|iced|dingin)\b|jus|juice|matcha|boba|thai ?tea|milk ?shake|smoothie|soda|sirup|cendol|dawet|es ?krim|yakult|pop ?ice|segar/.test(t))return"dingin";
  if(/bakso|\bmie?\b|mie |soto|seblak|\bsop\b|\bsup\b|rawon|wedang|jahe|bandrek|kopi|bubur|indomie|ronde|sekoteng|kuah|cilok|tongseng|gulai|martabak|gorengan|bakwan|mendoan|pisang goreng|cireng/.test(t))return"hangat";
  return"netral";
}
function cuacaTitik(){const l=Object.values(sellerLocs||{}).filter(x=>x&&Number.isFinite(x.lat)&&Number.isFinite(x.lng));
  return l.length?{lat:l.reduce((t,x)=>t+x.lat,0)/l.length,lng:l.reduce((t,x)=>t+x.lng,0)/l.length}:CUACA_DESA;}
function cuacaTeks(kode){if([95,96,99].includes(kode))return["⛈️","hujan petir"];if((kode>=51&&kode<=67)||(kode>=80&&kode<=82))return["🌧️","hujan"];if([45,48].includes(kode))return["🌫️","berkabut"];if(kode<=1)return["☀️","cerah"];if(kode===2)return["⛅","cerah berawan"];return["☁️","berawan"];}
function cuacaMode(c){const hujan=(c.kode>=51&&c.kode<=67)||(c.kode>=80&&c.kode<=82)||c.kode>=95;return hujan||c.suhu<=26?"hujan":c.suhu>=30?"panas":"biasa";}
function tampilCuaca(){
  const grid=document.getElementById("productGrid");if(!grid||!KS_CUACA)return;
  let bar=document.getElementById("cuacaBar");if(!bar){bar=document.createElement("div");bar.id="cuacaBar";grid.insertAdjacentElement("beforebegin",bar);}
  const c=KS_CUACA,[ik,ket]=cuacaTeks(c.kode),malam=!c.siang&&c.kode<=1?"🌙":ik;
  const ajak=c.mode==="panas"?"yang segar-segar dulu, yuk! 🧊":c.mode==="hujan"?"yang hangat-hangat dulu, yuk! 🍜":"selamat memilih menu 😊";
  bar.className="cuaca-bar "+c.mode;bar.innerHTML=`<span class="cuaca-ik">${malam}</span><span><b>${Math.round(c.suhu)}°C, ${ket}</b> di Kalensari — ${ajak}</span>`;
}
async function muatCuaca(){
  try{const lama=JSON.parse(localStorage.getItem("kalensari_cuaca")||"null");if(lama&&Date.now()-lama.t<CUACA_SIMPAN){KS_CUACA=lama;tampilCuaca();renderProducts();return;}}catch(e){}
  try{const t=cuacaTitik();
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${t.lat.toFixed(3)}&longitude=${t.lng.toFixed(3)}&current=temperature_2m,weather_code,is_day&timezone=Asia%2FJakarta`);
    if(!r.ok)return;const d=await r.json(),cur=d&&d.current;if(!cur||!Number.isFinite(cur.temperature_2m))return;
    const c={suhu:cur.temperature_2m,kode:Number(cur.weather_code)||0,siang:cur.is_day!==0,t:Date.now()};c.mode=cuacaMode(c);
    KS_CUACA=c;try{localStorage.setItem("kalensari_cuaca",JSON.stringify(c));}catch(e){}
    tampilCuaca();renderProducts();
  }catch(e){console.warn("Cuaca tidak tersedia:",e);}
}
setTimeout(muatCuaca,1200);setInterval(muatCuaca,CUACA_SIMPAN);

// ===== Nota dibatalkan: alasan + status pengembalian dana (QRIS) =====
function infoBatal(o){
  const al=o.batal_alasan?String(o.batal_alasan).replace(/\s*\(dilaporkan kurir.*\)$/,""):"";
  let h=al?`<div class="order-hint">✖️ Dibatalkan: ${esc(al)}</div>`:"";
  if(o.pay_status==="lunas"){
    const r=o.refund&&typeof o.refund==="object"?o.refund:null,j=r&&Number(r.jumlah)>=0&&r.jumlah!==undefined?Number(r.jumlah):Number(o.total)||0;
    h+=r&&r.status==="saldo"
      ?`<div class="order-hint success">🎟️ ${rupiah(j)} sudah masuk saldo voucher belanja Anda. Bisa dipakai belanja lagi.</div>`
      :r&&r.status==="selesai"
      ?`<div class="order-hint success">✅ Dana ${rupiah(j)} sudah dikembalikan${r.selesai_t?" ("+new Date(r.selesai_t).toLocaleDateString("id-ID")+")":""}</div>`
      :`<div class="order-hint">💸 Dana ${rupiah(j)} akan dikembalikan admin (paling lambat 7 hari kerja). Admin akan menghubungi Anda lewat WhatsApp.</div>`;
  }
  if(/dilaporkan kurir/i.test(o.batal_alasan||""))h+=`<div class="order-hint success">🎁 Ada kompensasi saldo voucher karena toko tutup. Cek di akun → Saldo voucher.</div>`;
  if(Number(o.ongkir_tetap)>0&&!/^qris/i.test(String(o.payment||"")))h+=`<div class="order-hint">🛵 Ongkir jarak ${rupiah(o.ongkir_tetap)} dibayarkan bersama nota lain yang tetap diantar.</div>`;
  return h;
}
