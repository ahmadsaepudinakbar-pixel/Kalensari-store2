/* Kalensari Store - kode referal toko (QR toko).
   Link QR toko: index.html?toko=PJ0012&pasang=1 (membuka halaman toko)
   Kode disimpan di HP sejak pertama kali dibuka, jadi tetap ada setelah aplikasi dipasang
   dan terisi otomatis di form daftar pembeli (akun-pembeli.html).
   Pemakaian: KSRefToko.baca() -> "PJ-0012" atau ""  |  KSRefToko.hapus() */
(function(){
  var KEY = "ks_ref_toko", UMUR = 30 * 24 * 3600 * 1000;
  function norm(v){
    v = String(v || "").toUpperCase().replace(/\s/g, "");
    var m = v.replace(/-/g, "").match(/^([A-Z]{2})(\d{1,6})$/);
    return m ? m[1] + (m[2].length < 4 ? ("0000" + m[2]).slice(-4) : m[2]) : "";   // format tanpa strip: PJ0015
  }
  function simpan(k){
    try{ localStorage.setItem(KEY, JSON.stringify({k:k, t:Date.now()})); }catch(e){}
    try{ document.cookie = KEY + "=" + k + "; max-age=" + (UMUR/1000) + "; path=/; SameSite=Lax"; }catch(e){}
  }
  function baca(){
    try{
      var o = JSON.parse(localStorage.getItem(KEY) || "null");
      if(o && o.k && Date.now() - o.t < UMUR) return o.k;
    }catch(e){}
    try{
      var m = document.cookie.match(new RegExp("(?:^|; )" + KEY + "=([^;]+)"));
      if(m) return norm(decodeURIComponent(m[1]));
    }catch(e){}
    return "";
  }
  function hapus(){
    try{ localStorage.removeItem(KEY); }catch(e){}
    try{ document.cookie = KEY + "=; max-age=0; path=/"; }catch(e){}
  }
  window.KSRefToko = {baca:baca, hapus:hapus, norm:norm};

  var dariLink = "";
  try{ var p = new URLSearchParams(location.search); dariLink = norm(p.get("toko") || p.get("ref")); }catch(e){}
  if(!dariLink) return;
  simpan(dariLink);

  // Sambutan kecil di halaman toko/pasang aplikasi (hanya saat dibuka lewat QR)
  document.addEventListener("DOMContentLoaded", function(){
    if(!/(^|\/)(index\.html|aplikasi\.html)?$/.test(location.pathname)) return;
    var b = document.createElement("div");
    b.style.cssText = "position:fixed;left:12px;right:12px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:9998;background:#7b3f1d;color:#fff;border-radius:16px;padding:10px 12px;font:14px/1.35 system-ui,sans-serif;display:flex;gap:8px;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.25)";
    b.innerHTML = '<span style="flex:1">🏪 Pasang aplikasi Kalensari Store lalu daftar: kode toko <b>' + dariLink + '</b> terisi otomatis.</span><button type="button" aria-label="Tutup" style="border:0;background:transparent;color:#fff;font:inherit;padding:6px 8px;cursor:pointer">✕</button>';
    b.querySelector("button").onclick = function(){ b.remove(); };
    document.body.appendChild(b);
    setTimeout(function(){ if(b.parentNode) b.remove(); }, 9000);
  });
})();
