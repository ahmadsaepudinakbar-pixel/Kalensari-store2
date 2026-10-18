/* =====================================================================
   KALENSARI • Template banner (background bisa diganti admin)
   Hanya mengganti BACKGROUND 4 kotak di beranda:
     - Banner geser 1, 2, 3 (Lezatnya / Kuis / Peduli)
     - Kotak "Promo Spesial Hari Ini"
   Teks, tombol, dan fitur kotaknya TIDAK diubah.
   Pilihan: Bawaan • Template warna • Warna sendiri • Foto sendiri.
   Disimpan di store_settings: "tema_banner" (pilihan) + "foto_banner_<slot>" (foto).
   Hanya admin (login Supabase) yang bisa mengubah; semua pengunjung bisa membaca.
   ===================================================================== */
(function(){
  if(window.KSBannerTema)return;
  var SLOT=[
    {k:"hero1",nama:"Banner 1 • Lezatnya",tipe:"hero",sel:"#heroTrack .hero-slide:nth-child(1)"},
    {k:"hero2",nama:"Banner 2 • Kuis Pintar",tipe:"hero",sel:"#heroTrack .hero-slide:nth-child(2)"},
    {k:"hero3",nama:"Banner 3 • Peduli",tipe:"hero",sel:"#heroTrack .hero-slide:nth-child(3)"},
    {k:"promo",nama:"Promo Spesial Hari Ini",tipe:"promo",sel:"#promoWrap .promo-card"}
  ];
  // Template: banner geser = warna gelap (teks putih); promo = warna terang (teks cokelat)
  var TPL={
    hero:[
      {id:"cokelat",nama:"Cokelat",a:"#46230f",b:"#8a5128"},
      {id:"oranye",nama:"Oranye",a:"#6b3317",b:"#c8802f"},
      {id:"hijau",nama:"Hijau",a:"#2c4528",b:"#5a8a4a"},
      {id:"biru",nama:"Biru",a:"#12304f",b:"#2f6aa3"},
      {id:"marun",nama:"Marun",a:"#5a1420",b:"#a8383f"},
      {id:"ungu",nama:"Ungu",a:"#3a1f55",b:"#7b4aa8"},
      {id:"hitam",nama:"Hitam",a:"#1c1c1e",b:"#4a4a50"}
    ],
    promo:[
      {id:"krem",nama:"Krem",a:"#fbe4cc",b:"#f8d4b0",c:"#f3c48f"},
      {id:"hijau",nama:"Hijau muda",a:"#dff3df",b:"#bfe3c1",c:"#a9d6ac"},
      {id:"biru",nama:"Biru muda",a:"#dcecfb",b:"#bcd9f5",c:"#a6c9ee"},
      {id:"pink",nama:"Pink",a:"#fde1e8",b:"#f9c3d1",c:"#f4aebf"},
      {id:"kuning",nama:"Kuning",a:"#fff1c4",b:"#fbe08a",c:"#f6d26b"},
      {id:"lavender",nama:"Lavender",a:"#ece3fb",b:"#d6c6f3",c:"#c6b0ec"}
    ]
  };
  var LS_CFG="kalensari_tema_banner",LS_FOTO="kalensari_tema_banner_foto_";
  var cfg={},foto={},dirtyFoto={};

  function $(id){return document.getElementById(id);}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function warnaOk(v){return /^#[0-9a-f]{6}$/i.test(v||"");}
  function ada(f){return typeof f==="function";}
  function cloudOn(){try{return !!(typeof CLOUD_CONFIG!=="undefined"&&CLOUD_CONFIG&&CLOUD_CONFIG.enabled&&ada(cloudFetch));}catch(e){return false;}}
  function toast(m){try{if(ada(showToast))showToast(m);}catch(e){}}

  /* ---------- gaya tambahan (dekorasi ikut template) ---------- */
  (function(){
    var st=document.createElement("style");
    st.textContent=
      "html.tk .hero-slide,html.tk .promo-card{transition:background-color .35s ease}"+
      "html.tk .hero-slide.bn-foto::after{display:none}"+
      "html.tk .promo-card.bn-foto::before{display:none}"+
      "html.tk .promo-card.bn-set::before{background:var(--bn-lingkar,rgba(255,255,255,.35));opacity:.75}"+
      "#adminBanner{border:1px solid #eadfd6;border-radius:16px;padding:14px;margin:12px 0;background:#fffaf2}"+
      "#adminBanner[hidden]{display:none}"+
      "#adminBanner .bn-head{display:flex;justify-content:space-between;align-items:center;gap:8px}"+
      "#adminBanner .bn-head h4{margin:0}"+
      "#adminBanner .bn-x{border:0;background:none;font-size:18px;cursor:pointer}"+
      "#adminBanner .bn-note{font-size:12.5px;color:#6a5a50;margin:6px 0 10px;line-height:1.45}"+
      "#adminBanner .bn-card{background:#fff;border:1px solid #eadfd6;border-radius:14px;padding:10px 12px;margin:0 0 10px}"+
      "#adminBanner .bn-card>b{display:block;margin-bottom:8px}"+
      "#adminBanner .bn-prev{height:46px;border-radius:10px;margin:0 0 8px;border:1px solid #eadfd6;background-size:cover;background-position:center}"+
      "#adminBanner .bn-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0}"+
      "#adminBanner .bn-sw{width:34px;height:34px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1.5px #d9c9bd;cursor:pointer;padding:0}"+
      "#adminBanner .bn-sw.on{box-shadow:0 0 0 3px #7a3e20}"+
      "#adminBanner .bn-chip{border:1px solid #d9c9bd;background:#fff;border-radius:999px;padding:7px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}"+
      "#adminBanner .bn-chip.on{background:#5b3017;border-color:#5b3017;color:#fff}"+
      "#adminBanner label.bn-l{display:flex;align-items:center;gap:6px;font-size:13px}"+
      "#adminBanner input[type=color]{width:44px;height:34px;padding:0;border:1px solid #d9c9bd;border-radius:8px;background:#fff}"+
      "#adminBanner input[type=range]{flex:1;min-width:120px;accent-color:#7a3e20}"+
      "#adminBanner .bn-ukuran{display:block;font-size:12px;color:#6a5a50;line-height:1.4;margin:2px 0 4px}"+
      "#adminBanner .bn-save{width:100%;margin-top:4px}";
    document.head.appendChild(st);
  })();

  /* ---------- terapkan ke halaman ---------- */
  function tplDari(s,c){var L=TPL[s.tipe];for(var i=0;i<L.length;i++)if(L[i].id===c.p)return L[i];return null;}
  function terapkan(s){
    var el=document.querySelector(s.sel);if(!el)return;
    var c=cfg[s.k]||{m:"def"};
    el.classList.remove("bn-foto","bn-set");
    el.style.background="";el.style.removeProperty("--bn-lingkar");
    if(c.m==="preset"){
      var t=tplDari(s,c);if(!t)return;
      el.style.background="linear-gradient(100deg,"+t.a+" 0%,"+t.b+" 100%)";
      if(s.tipe==="promo"){el.classList.add("bn-set");el.style.setProperty("--bn-lingkar",t.c||"rgba(255,255,255,.35)");}
    }else if(c.m==="warna"&&warnaOk(c.a)&&warnaOk(c.b)){
      el.style.background="linear-gradient(100deg,"+c.a+" 0%,"+c.b+" 100%)";
      if(s.tipe==="promo")el.classList.add("bn-set");
    }else if(c.m==="foto"&&foto[s.k]){
      var ov=Math.max(0,Math.min(90,Number(c.ov)||0))/100;
      var lap=s.tipe==="hero"?"rgba(20,10,5,"+ov+")":"rgba(251,228,204,"+ov+")";
      var url=foto[s.k];
      var im=new Image();   // muat dulu supaya pergantian tidak berkedip
      im.onload=function(){
        el.style.background="linear-gradient("+lap+","+lap+"),url(\""+url+"\") center/cover no-repeat";
        el.classList.add("bn-foto");
      };
      im.src=url;
    }
  }
  function terapkanSemua(){SLOT.forEach(terapkan);}

  /* ---------- simpan lokal (cadangan cepat supaya tidak berkedip) ---------- */
  function simpanLokal(){
    try{localStorage.setItem(LS_CFG,JSON.stringify(cfg));}catch(e){}
    SLOT.forEach(function(s){try{if(foto[s.k])localStorage.setItem(LS_FOTO+s.k,foto[s.k]);else localStorage.removeItem(LS_FOTO+s.k);}catch(e){}});
  }
  function bacaLokal(){
    try{var c=JSON.parse(localStorage.getItem(LS_CFG)||"null");if(c&&typeof c==="object"&&!Array.isArray(c))cfg=c;}catch(e){}
    SLOT.forEach(function(s){try{var f=localStorage.getItem(LS_FOTO+s.k);if(f)foto[s.k]=f;}catch(e){}});
  }

  /* ---------- muat dari database ---------- */
  async function muatCloud(){
    if(!cloudOn())return;
    try{
      var r=await cloudFetch("store_settings?select=value&key=eq.tema_banner");
      var v=Array.isArray(r)&&r[0]&&r[0].value;
      if(v&&typeof v==="object"&&!Array.isArray(v))cfg=v;
      else if(Array.isArray(r))cfg={};   // admin menghapus pengaturan -> kembali bawaan
      var perlu=SLOT.filter(function(s){return cfg[s.k]&&cfg[s.k].m==="foto";});
      if(perlu.length){
        var rows=await cloudFetch("store_settings?select=key,value&key=like.foto_banner_*");
        (Array.isArray(rows)?rows:[]).forEach(function(x){
          var k=String(x.key).slice(12);
          if(x.value&&typeof x.value.foto==="string"&&/^data:image\//.test(x.value.foto))foto[k]=x.value.foto;
        });
      }
      simpanLokal();terapkanSemua();
    }catch(e){console.warn("Banner tema:",e);}
  }

  /* ---------- kompres foto otomatis (supaya web tidak berat) ---------- */
  // Target: lebar maks 1200 px, hasil <= ~150 KB. Pakai WebP bila browser mendukung (lebih kecil), cadangan JPEG.
  var TARGET_CHAR=200000;   // panjang data-URL ≈ 150 KB
  function webpDidukung(){try{var c=document.createElement("canvas");c.width=c.height=1;return c.toDataURL("image/webp").indexOf("data:image/webp")===0;}catch(e){return false;}}
  function kompres(file){
    return new Promise(function(ok,gagal){
      if(!file||!/^image\//.test(file.type||""))return gagal(new Error("Pilih file foto (JPG/PNG)"));
      var url=URL.createObjectURL(file),img=new Image(),awal=file.size||0;
      img.onerror=function(){URL.revokeObjectURL(url);gagal(new Error("Foto tidak bisa dibaca"));};
      img.onload=function(){
        URL.revokeObjectURL(url);
        var fmt=webpDidukung()?"image/webp":"image/jpeg",lebar=Math.min(1200,img.width),q=0.8,out="";
        for(var i=0;i<10;i++){
          var k=lebar/img.width,c=document.createElement("canvas");
          c.width=Math.max(1,Math.round(img.width*k));c.height=Math.max(1,Math.round(img.height*k));
          var x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);
          x.imageSmoothingQuality="high";x.drawImage(img,0,0,c.width,c.height);
          out=c.toDataURL(fmt,q);
          if(out.length<=TARGET_CHAR)return ok({url:out,awal:awal,akhir:Math.round(out.length*0.75)});
          if(q>0.55)q=Math.round((q-0.1)*100)/100;else lebar=Math.round(lebar*0.85);
        }
        gagal(new Error("Foto terlalu rumit untuk dikecilkan, coba foto lain"));
      };
      img.src=url;
    });
  }
  function kb(n){return n>=1048576?(n/1048576).toFixed(1)+" MB":Math.max(1,Math.round(n/1024))+" KB";}

  /* ---------- panel admin ---------- */
  var panel=null,tombol=null,buka=false;
  function prevBg(s){
    var c=cfg[s.k]||{m:"def"};
    if(c.m==="preset"){var t=tplDari(s,c);if(t)return "linear-gradient(100deg,"+t.a+","+t.b+")";}
    if(c.m==="warna"&&warnaOk(c.a)&&warnaOk(c.b))return "linear-gradient(100deg,"+c.a+","+c.b+")";
    if(c.m==="foto"&&foto[s.k])return "url('"+foto[s.k]+"')";
    var d=TPL[s.tipe][s.tipe==="promo"?0:(s.k==="hero3"?2:(s.k==="hero2"?1:0))];
    return "linear-gradient(100deg,"+d.a+","+d.b+")";
  }
  function kartu(s){
    var c=cfg[s.k]||{m:"def"},L=TPL[s.tipe];
    var sw=L.map(function(t){
      return '<button type="button" class="bn-sw'+(c.m==="preset"&&c.p===t.id?" on":"")+'" title="'+esc(t.nama)+'" aria-label="'+esc(t.nama)+'" data-bn="preset" data-s="'+s.k+'" data-p="'+t.id+'" style="background:linear-gradient(135deg,'+t.a+','+t.b+')"></button>';
    }).join("");
    var a=warnaOk(c.a)?c.a:L[0].a,b=warnaOk(c.b)?c.b:L[0].b;
    var ov=c.m==="foto"?(Number(c.ov)||0):(s.tipe==="hero"?35:50);
    return '<div class="bn-card"><b>'+esc(s.nama)+'</b>'+
      '<div class="bn-prev" style="background-image:'+prevBg(s)+'"></div>'+
      '<div class="bn-row"><button type="button" class="bn-chip'+(c.m==="def"||!c.m?" on":"")+'" data-bn="def" data-s="'+s.k+'">↩︎ Bawaan</button>'+sw+'</div>'+
      '<div class="bn-row"><button type="button" class="bn-chip'+(c.m==="warna"?" on":"")+'" data-bn="warna" data-s="'+s.k+'">🎨 Warna sendiri</button>'+
        '<label class="bn-l">Kiri <input type="color" data-bn="a" data-s="'+s.k+'" value="'+a+'"></label>'+
        '<label class="bn-l">Kanan <input type="color" data-bn="b" data-s="'+s.k+'" value="'+b+'"></label></div>'+
      '<div class="bn-row"><label class="bn-chip'+(c.m==="foto"?" on":"")+'" style="cursor:pointer">🖼️ '+(foto[s.k]?"Ganti foto":"Pakai foto")+
        '<input type="file" accept="image/*" data-crop="'+(s.tipe==="hero"?"2:1":"3:1")+'" data-bn="file" data-s="'+s.k+'" hidden></label></div>'+
      '<small class="bn-ukuran">📐 Ukuran foto ideal: <b>'+(s.tipe==="hero"?"1200 × 600 px (perbandingan 2:1)":"1200 × 400 px (perbandingan 3:1)")+'</b>. '+
        (s.tipe==="hero"?"Teks ada di sisi kiri dan lingkaran foto menu di kanan, jadi pakai foto yang tidak ramai. ":"Teks di kiri dan foto menu bulat di kanan, jadi pakai foto yang tidak ramai. ")+
        'Di komputer kotak tampil lebih lebar, jadi bagian atas/bawah foto bisa terpotong: taruh objek penting di tengah.</small>'+
      (c.m==="foto"?'<div class="bn-row"><label class="bn-l" style="flex:1">'+(s.tipe==="hero"?"🌑 Lapisan gelap":"☀️ Lapisan terang")+' <b class="bn-pct">'+ov+'%</b> <input type="range" min="0" max="90" step="5" value="'+ov+'" data-bn="ov" data-s="'+s.k+'"></label></div>'+
        '<small class="bn-ukuran">'+(s.tipe==="hero"?"Geser ke kanan supaya foto lebih gelap dan teks putih lebih jelas.":"Geser ke kanan supaya foto lebih pudar dan teks cokelat lebih jelas.")+'</small>':'')+
    '</div>';
  }
  function gambarPanel(){
    if(!panel)return;
    panel.innerHTML='<div class="bn-head"><h4>🎨 Template Banner</h4><button type="button" class="bn-x" data-bn="tutup" aria-label="Tutup">✕</button></div>'+
      '<p class="bn-note">Hanya mengganti <b>background</b>. Teks, tombol, dan fitur kotak tidak berubah. Banner geser pakai warna/foto <b>gelap</b> agar teks putih terbaca; Promo pakai warna/foto <b>terang</b>. Geser slider untuk mengatur lapisan agar teks tetap jelas. Foto otomatis dikompres (lebar maks 1200 px, sekitar 150 KB) supaya web tetap ringan.</p>'+
      SLOT.map(kartu).join("")+
      '<button type="button" class="btn primary bn-save" data-bn="simpan">💾 Simpan untuk semua pengunjung</button>';
  }
  function atur(k,nilai){cfg[k]=Object.assign({},cfg[k]||{},nilai);}
  function slotOf(k){return SLOT.filter(function(s){return s.k===k;})[0];}

  async function simpanSemua(){
    simpanLokal();
    if(!cloudOn()){toast("🎨 Banner disimpan di perangkat ini");return;}
    try{
      if(ada(adminEnsureFresh))await adminEnsureFresh();
      var bersih={};SLOT.forEach(function(s){if(cfg[s.k]&&cfg[s.k].m&&cfg[s.k].m!=="def")bersih[s.k]=cfg[s.k];});
      var body=[{key:"tema_banner",value:bersih}];
      Object.keys(dirtyFoto).forEach(function(k){if(foto[k])body.push({key:"foto_banner_"+k,value:{foto:foto[k]}});});
      await cloudFetch("store_settings?on_conflict=key",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(body)});
      dirtyFoto={};cfg=bersih;
      toast("✅ Banner tersimpan untuk semua pengunjung");
    }catch(e){
      console.warn("Simpan banner:",e);
      toast("⚠️ Belum tersimpan online. Pastikan sudah masuk sebagai admin.");
    }
  }

  function pasangAdmin(){
    var exp=$("exportBtn"),list=$("adminProductList");
    if(!exp||!list||$("manageBannerBtn"))return !!$("manageBannerBtn");
    tombol=document.createElement("button");tombol.type="button";tombol.id="manageBannerBtn";tombol.className=exp.className;tombol.textContent="🎨 Banner";
    var ref=$("manageShipBtn")||exp;ref.insertAdjacentElement("afterend",tombol);
    panel=document.createElement("div");panel.id="adminBanner";panel.hidden=true;
    list.parentNode.insertBefore(panel,list);
    tombol.addEventListener("click",function(){buka=!buka;panel.hidden=!buka;tombol.classList.toggle("active",buka);if(buka)gambarPanel();});
    panel.addEventListener("click",async function(e){
      var t=e.target.closest("[data-bn]");if(!t)return;
      var a=t.dataset.bn,k=t.dataset.s;
      if(a==="tutup"){buka=false;panel.hidden=true;tombol.classList.remove("active");return;}
      if(a==="simpan"){await simpanSemua();return;}
      if(a==="def"){delete cfg[k];terapkan(slotOf(k));gambarPanel();return;}
      if(a==="preset"){atur(k,{m:"preset",p:t.dataset.p});terapkan(slotOf(k));gambarPanel();return;}
      if(a==="warna"){var L=TPL[slotOf(k).tipe];var c=cfg[k]||{};atur(k,{m:"warna",a:warnaOk(c.a)?c.a:L[0].a,b:warnaOk(c.b)?c.b:L[0].b});terapkan(slotOf(k));gambarPanel();return;}
    });
    panel.addEventListener("input",function(e){
      var t=e.target;if(!t.dataset||!t.dataset.bn)return;
      var a=t.dataset.bn,k=t.dataset.s;
      if(a==="a"||a==="b"){var c=cfg[k]||{};var o={m:"warna"};o[a]=t.value;if(!warnaOk(c.a)||!warnaOk(c.b)){var L=TPL[slotOf(k).tipe];o.a=o.a||L[0].a;o.b=o.b||L[0].b;}atur(k,o);terapkan(slotOf(k));
        var card=t.closest(".bn-card"),pv=card&&card.querySelector(".bn-prev");if(pv)pv.style.backgroundImage=prevBg(slotOf(k));}
      if(a==="ov"){atur(k,{ov:Number(t.value)});terapkan(slotOf(k));var pc=t.closest(".bn-card");pc=pc&&pc.querySelector(".bn-pct");if(pc)pc.textContent=t.value+"%";}
    });
    panel.addEventListener("change",async function(e){
      var t=e.target;if(!t.dataset||t.dataset.bn!=="file"||!t.files||!t.files[0])return;
      var k=t.dataset.s;
      try{
        var hasil=await kompres(t.files[0]);
        foto[k]=hasil.url;dirtyFoto[k]=true;
        atur(k,{m:"foto",ov:(cfg[k]&&cfg[k].ov!=null)?cfg[k].ov:(slotOf(k).tipe==="hero"?35:50)});
        terapkan(slotOf(k));gambarPanel();
        toast("🖼️ Foto dikompres otomatis: "+kb(hasil.awal)+" → "+kb(hasil.akhir)+". Tekan Simpan.");
      }catch(err){toast("⚠️ "+(err&&err.message||"Foto gagal dipakai"));}
      t.value="";
    });
    return true;
  }

  /* ---------- mulai ---------- */
  bacaLokal();terapkanSemua();
  if(!pasangAdmin()){
    var n=0,iv=setInterval(function(){if(pasangAdmin()||++n>40)clearInterval(iv);},250);
  }
  // tunggu script.js selesai menyiapkan koneksi, lalu ambil dari database
  setTimeout(muatCloud,600);
  window.KSBannerTema={terapkan:terapkanSemua,muat:muatCloud};
})();
