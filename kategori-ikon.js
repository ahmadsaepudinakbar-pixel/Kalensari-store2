/* =====================================================================
   KALENSARI • Ikon kategori dari admin
   Admin (admin.html > Kategori > ⋯ > Ganti ikon) bisa memasang foto
   pengganti ikon bawaan tiap kategori. Disimpan di store_settings
   "foto_ikon_kategori" = {map:{"Nama kategori":"data:image/..."}}.
   Di sini hanya dibaca lalu kategori digambar ulang.
   ===================================================================== */
(function(){
  if(window.KSKatIkon)return;
  var LS="kalensari_ikon_kategori",map={};
  try{var c=JSON.parse(localStorage.getItem(LS)||"null");if(c&&typeof c==="object")map=c;}catch(e){}
  function ok(u){return typeof u==="string"&&/^data:image\//.test(u);}
  window.KSKatIkon={foto:function(k){var u=map[k];return ok(u)?u:"";}};
  function gambar(){try{if(typeof renderCategories==="function")renderCategories();}catch(e){}}
  async function muat(){
    try{
      if(typeof CLOUD_CONFIG==="undefined"||!CLOUD_CONFIG||!CLOUD_CONFIG.enabled||typeof cloudFetch!=="function")return;
      var r=await cloudFetch("store_settings?select=value&key=eq.foto_ikon_kategori");
      var m=Array.isArray(r)&&r[0]&&r[0].value&&r[0].value.map;
      m=m&&typeof m==="object"?m:{};
      if(JSON.stringify(m)===JSON.stringify(map))return;
      map=m;
      try{if(Object.keys(m).length)localStorage.setItem(LS,JSON.stringify(m));else localStorage.removeItem(LS);}catch(e){}
      gambar();
    }catch(e){console.warn("Ikon kategori:",e);}
  }
  if(Object.keys(map).length)gambar();
  setTimeout(muat,700);
})();
