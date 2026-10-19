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
  var BAWAAN=[
    {k:"hero1",nama:"Banner 1 • Lezatnya",tipe:"hero"},
    {k:"hero2",nama:"Banner 2 • Kuis Pintar",tipe:"hero"},
    {k:"hero3",nama:"Banner 3 • Peduli",tipe:"hero"}
  ];
  var PROMO={k:"promo",nama:"Promo Spesial Hari Ini",tipe:"promo"};
  var MAKS_BARU=10;   // banner tambahan maksimal (total tampil <= 13)
  function tambahList(){return Array.isArray(cfg.tambah)?cfg.tambah:[];}
  function hapusList(){return Array.isArray(cfg.hapus)?cfg.hapus:[];}
  // semua kotak yang bisa diatur backgroundnya: 3 banner bawaan + banner tambahan + promo
  function slots(){
    var r=BAWAAN.map(function(x){return {k:x.k,nama:x.nama,tipe:"hero",bawaan:true};});
    tambahList().forEach(function(b,i){r.push({k:b.id,nama:"Banner baru "+(i+1)+(b.judul?" • "+String(b.judul).slice(0,22):""),tipe:"hero",bawaan:false});});
    r.push({k:PROMO.k,nama:PROMO.nama,tipe:"promo",bawaan:true});
    return r;
  }
  function slotOf(k){return slots().filter(function(s){return s.k===k;})[0];}
  function elDari(s){
    if(!s)return null;
    if(s.tipe==="promo")return document.querySelector("#promoWrap .promo-card");
    return document.querySelector('#heroTrack .hero-slide[data-bn="'+s.k+'"]');
  }
  function jumlahTampil(){return BAWAAN.filter(function(x){return hapusList().indexOf(x.k)<0&&!habis(x.k);}).length+tambahList().filter(function(b){return !habis(b.id);}).length;}
  /* ---------- hapus otomatis: tiap banner / foto promo boleh punya batas waktu tampil ---------- */
  function sampaiMap(){var m=cfg.sampai;return m&&typeof m==="object"&&!Array.isArray(m)?m:{};}
  function sampaiOf(k){var t=Number(sampaiMap()[k]);return t>0?t:0;}
  function habis(k){var t=sampaiOf(k);return t>0&&Date.now()>=t;}
  function setSampai(k,t){var m=Object.assign({},sampaiMap());if(t>0)m[k]=t;else delete m[k];if(Object.keys(m).length)cfg.sampai=m;else delete cfg.sampai;}
  function dua(n){return (n<10?"0":"")+n;}
  function keInput(t){if(!t)return "";var d=new Date(t);return d.getFullYear()+"-"+dua(d.getMonth()+1)+"-"+dua(d.getDate())+"T"+dua(d.getHours())+":"+dua(d.getMinutes());}
  function teksWaktu(t){var d=new Date(t),B=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];return d.getDate()+" "+B[d.getMonth()]+" "+d.getFullYear()+", "+dua(d.getHours())+"."+dua(d.getMinutes());}
  // saat batas waktu terdekat tiba (halaman masih terbuka) -> sembunyikan otomatis
  var habisT=null;
  function jadwalHabis(){
    clearTimeout(habisT);var now=Date.now(),m=sampaiMap(),min=0;
    Object.keys(m).forEach(function(k){var t=Number(m[k]);if(t>now&&(!min||t<min))min=t;});
    if(min)habisT=setTimeout(function(){bangunHero();terapkanSemua();if(panel&&buka)gambarPanel();},Math.min(min-now+500,6*3600000));
  }
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
  var cfg={},foto={},dirtyFoto={},fotoHapus=[];
  /* ---------- Promo: beberapa foto bergantian (efek memudar) ---------- */
  var MAKS_PROMO=5;
  function promoList(){
    var c=cfg.promo||{},l=Array.isArray(c.fl)?c.fl.filter(function(x){return /^promo(_[a-z0-9]+)?$/.test(String(x));}):[];
    return l.length?l:["promo"];
  }
  function promoSemua(){return promoList().filter(function(k){return !!foto[k];});}   // semua foto (untuk editor)
  function promoFoto(){return promoSemua().filter(function(k){return !habis(k);});}   // yang masih berlaku (tampil di beranda)
  // foto utama sebuah kotak (promo = foto pertama di daftar)
  function fs(s){if(!s)return "";if(s.tipe==="promo"){var l=promoFoto();return l.length?foto[l[0]]:"";}return foto[s.k]||"";}
  function fotoKeys(){var r=slots().map(function(s){return s.k;});promoList().forEach(function(k){if(r.indexOf(k)<0)r.push(k);});return r;}

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
      "html.tk .promo-card .bn-fade{position:absolute;inset:0;z-index:0;pointer-events:none;border-radius:inherit;overflow:hidden}"+
      "html.tk .promo-card .bn-fade i{position:absolute;inset:0;background-position:center;background-size:cover;background-repeat:no-repeat;opacity:0;transition:opacity 1.4s ease-in-out;will-change:opacity}"+
      "html.tk .promo-card .bn-fade i.on{opacity:1}"+
      "html.tk .promo-card .pc-tx h2,html.tk .promo-card .pc-tx p{transition:color .6s ease}"+
      "@media(prefers-reduced-motion:reduce){html.tk .promo-card .bn-fade i{transition-duration:.01s}}"+
      "#adminBanner .bn-thumbs{gap:8px}"+"#adminBanner input[type=file][hidden]{display:none!important}"+
      "#adminBanner .bn-fr{align-items:flex-start;flex-wrap:nowrap}#adminBanner .bn-fr .bn-th{flex:0 0 96px;margin-top:4px}"+
      "#adminBanner .bn-fw{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}#adminBanner .bn-wrow{flex-direction:column;align-items:stretch;gap:4px}"+
      "#adminBanner .bn-wk{flex-wrap:wrap;font-weight:700}#adminBanner .bn-wk input{flex:1;min-width:170px;padding:7px 8px;border:1px solid #d9c9bd;border-radius:8px;font:inherit;font-size:13px;background:#fff;margin:0;display:inline-block;width:auto}"+
      "#adminBanner .bn-fw .bn-chip,#adminBanner .bn-wrow .bn-chip{align-self:flex-start;padding:5px 10px;font-size:12px}"+
      "#adminBanner .bn-habis{color:#b3261e;font-weight:700}"+
      "#adminBanner .bn-th{position:relative;width:84px;aspect-ratio:3/1;border-radius:8px;background:#eee center/cover no-repeat;box-shadow:0 0 0 1px #d9c9bd}"+
      "#adminBanner .bn-th b{position:absolute;left:4px;top:3px;font-size:11px;line-height:1;background:rgba(0,0,0,.6);color:#fff;border-radius:6px;padding:2px 5px}"+
      "#adminBanner .bn-th button{position:absolute;right:-7px;top:-7px;width:22px;height:22px;border-radius:50%;border:0;background:#b3261e;color:#fff;font-size:12px;line-height:22px;padding:0;cursor:pointer}"+
      "html.tk .promo-card.bn-set::before{background:var(--bn-lingkar,rgba(255,255,255,.35));opacity:.75}"+
      "#adminBanner{border:1px solid #eadfd6;border-radius:16px;padding:14px;margin:12px 0;background:#fffaf2}"+
      "#adminBanner[hidden]{display:none}"+
      "#adminBanner .bn-head{display:flex;justify-content:space-between;align-items:center;gap:8px}"+
      "#adminBanner .bn-head h4{margin:0}"+
      "#adminBanner .bn-x{border:0;background:none;font-size:18px;cursor:pointer}"+
      "#adminBanner .bn-note{font-size:12.5px;color:#6a5a50;margin:6px 0 10px;line-height:1.45}"+
      "#adminBanner .bn-card{background:#fff;border:1px solid #eadfd6;border-radius:14px;padding:10px 12px;margin:0 0 10px}"+
      "#adminBanner .bn-card>b{display:block;margin-bottom:8px}"+
      "#adminBanner .bn-pvw{container-type:inline-size;max-width:480px;margin:0 0 8px}"+
      "#adminBanner .bn-prev{position:relative;overflow:hidden;display:flex;align-items:center;box-sizing:border-box;min-height:32cqw;padding:3.3cqw 2.8cqw 6cqw 3.9cqw;border-radius:4cqw;border:1px solid #eadfd6;line-height:1.2}"+
      "#adminBanner .bn-prev.bn-promo{min-height:25.5cqw;padding:2.8cqw 2.8cqw 2.8cqw 3.9cqw}"+
      "#adminBanner .bn-pt{position:relative;z-index:2;max-width:92%}"+
      "#adminBanner .bn-hero .bn-pc{display:none}"+
      "#adminBanner .bn-ps{display:block;font:700 5.3em/1 'Caveat','Nunito',cursive;font-style:normal;transform:rotate(-3deg);transform-origin:left;margin-bottom:.1em}"+
      "#adminBanner .bn-ph{display:block;font:800 4.2em/1.1 'Baloo 2','Nunito',sans-serif}"+
      "#adminBanner .bn-promo .bn-ph{font-size:4.4em;line-height:1.08}"+
      "#adminBanner .bn-pp{display:block;font:600 2.8em/1.35 'Nunito',sans-serif;margin:.3em 0 .7em}"+
      "#adminBanner .bn-pb{display:inline-flex;align-items:center;gap:.4em;padding:.55em 1.1em;border-radius:999px;font:800 3em/1 'Nunito',sans-serif;box-shadow:0 2cqw 4cqw -2cqw rgba(0,0,0,.55)}"+
      "#adminBanner .bn-pc{position:absolute;right:-9%;top:50%;transform:translateY(-50%);width:50%;aspect-ratio:1;border-radius:50%;overflow:hidden;display:grid;place-items:center;z-index:1;background:radial-gradient(circle at 35% 30%,#fff7e6,#f2d5a4);box-shadow:0 0 0 1.1cqw rgba(255,255,255,.14),0 3.3cqw 5cqw -2cqw rgba(0,0,0,.6)}"+
      "#adminBanner .bn-promo .bn-pc{right:3.5%;width:32%;background:#fff4e4;box-shadow:0 3cqw 5cqw -3cqw rgba(90,48,24,.65)}"+
      "#adminBanner .bn-pc img{width:100%;height:100%;object-fit:cover}"+
      "#adminBanner .bn-pc i{font-style:normal;font-size:20cqw;line-height:1}"+
      "#adminBanner .bn-promo .bn-pc i{font-size:15cqw}"+
      "#adminBanner .bn-dc{position:absolute;right:-14%;bottom:-48%;width:78%;aspect-ratio:1.5;border-radius:50%;opacity:.75;z-index:0}"+
      "#adminBanner .bn-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0}"+
      "#adminBanner .bn-sw{width:34px;height:34px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1.5px #d9c9bd;cursor:pointer;padding:0}"+
      "#adminBanner .bn-sw.on{box-shadow:0 0 0 3px #7a3e20}"+
      "#adminBanner .bn-chip{border:1px solid #d9c9bd;background:#fff;border-radius:999px;padding:7px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}"+
      "#adminBanner .bn-chip.on{background:#5b3017;border-color:#5b3017;color:#fff}"+
      "#adminBanner label.bn-l{display:flex;align-items:center;gap:6px;font-size:13px}"+
      "#adminBanner input[type=color]{width:44px;height:34px;padding:0;border:1px solid #d9c9bd;border-radius:8px;background:#fff}"+
      "#adminBanner input[type=range]{flex:1;min-width:120px;accent-color:#7a3e20}"+
      "#adminBanner .bn-ukuran{display:block;font-size:12px;color:#6a5a50;line-height:1.4;margin:2px 0 4px}"+
      "#adminBanner .bn-f{display:block;margin:0 0 8px;font-size:12.5px;color:#6a5a50}"+
      "#adminBanner .bn-f input{display:block;width:100%;margin-top:3px;padding:9px 10px;border:1px solid #d9c9bd;border-radius:10px;font:inherit;font-size:14px;box-sizing:border-box}"+
      "#adminBanner .bn-chip.bn-del{color:#b3261e;border-color:#e6b8b3}"+
      "#adminBanner .bn-chip[disabled]{opacity:.5;cursor:not-allowed}"+
      "#adminBanner .bn-save{width:100%;margin-top:4px}";
    document.head.appendChild(st);
  })();

  /* ---------- banner atas: tambah / hapus ---------- */
  var SLIDE_HTML='<div class="hs-tx"><em class="hs-script"></em><h1></h1><p></p><a class="hs-btn" href="#products"><span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></a></div><div class="hs-img"><span class="hs-emoji" aria-hidden="true"></span></div>';
  function aman(u){
    u=String(u||"").trim();
    if(!u)return "#products";
    if(/^https?:\/\//i.test(u))return u;
    if(/^(#|\/(?!\/)|\.\/|[a-z0-9_\-]+\.html)/i.test(u))return u;
    return "#products";
  }
  function isiSlide(el,b){
    var q=function(x){return el.querySelector(x);};
    var em=q(".hs-script"),h=q("h1"),p=q("p"),a=q(".hs-btn"),sp=q(".hs-btn span"),im=q(".hs-img"),emo=q(".hs-emoji");
    em.textContent=b.em||"";em.style.display=b.em?"":"none";
    h.textContent=b.judul||"";p.textContent=b.teks||"";p.style.display=b.teks?"":"none";
    sp.textContent=b.tombol||"";a.style.display=b.tombol?"":"none";a.setAttribute("href",aman(b.link));
    emo.textContent=b.emoji||"";im.style.display=b.emoji?"":"none";
  }
  function tandaiBawaan(){
    var tr=$("heroTrack");if(!tr)return;
    BAWAAN.forEach(function(x,i){var el=tr.children[i];if(el&&!el.getAttribute("data-bn")&&!el.classList.contains("bn-custom"))el.setAttribute("data-bn",x.k);});
  }
  function bangunHero(){
    var tr=$("heroTrack");if(!tr)return;
    BAWAAN.forEach(function(x){var el=tr.querySelector('[data-bn="'+x.k+'"]');if(el)el.style.display=(hapusList().indexOf(x.k)>=0||habis(x.k))?"none":"";});
    [].slice.call(tr.querySelectorAll(".bn-custom")).forEach(function(el){
      if(!tambahList().some(function(b){return b.id===el.getAttribute("data-bn");}))el.remove();
    });
    tambahList().forEach(function(b){
      var el=tr.querySelector('.bn-custom[data-bn="'+b.id+'"]');
      if(!el){el=document.createElement("article");el.className="hero-slide bn-custom";el.setAttribute("data-bn",b.id);el.innerHTML=SLIDE_HTML;tr.appendChild(el);}
      isiSlide(el,b);el.style.display=habis(b.id)?"none":"";
    });
    // semua banner sudah berakhir -> tampilkan banner 1 supaya beranda tidak kosong
    if(![].some.call(tr.children,function(x){return x.style.display!=="none";})){var f1=tr.querySelector('[data-bn="hero1"]');if(f1)f1.style.display="";}
    jadwalHabis();
    if(ada(window.ksHeroRefresh))window.ksHeroRefresh();
  }

  /* ---------- terapkan ke halaman ---------- */
  function tplDari(s,c){var L=TPL[s.tipe];for(var i=0;i<L.length;i++)if(L[i].id===c.p)return L[i];return null;}
  /* ---------- warna tulisan otomatis: latar terang -> tulisan gelap, latar gelap -> tulisan terang ---------- */
  function lumHex(h){
    h=String(h||"").replace("#","");if(h.length===3)h=h.replace(/(.)/g,"$1$1");
    if(!/^[0-9a-f]{6}$/i.test(h))return null;
    return lumRGB(parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16));
  }
  function lumRGB(r,g,b){
    function f(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);
  }
  function setNada(el,L){
    if(L===null||L===undefined||isNaN(L)){el.removeAttribute("data-tone");return;}
    el.setAttribute("data-tone",L>0.4?"terang":"gelap");
  }
  function nadaFoto(el,im,ov,tipe){
    try{
      var cv=document.createElement("canvas");cv.width=cv.height=24;
      var cx=cv.getContext("2d");cx.drawImage(im,0,0,24,24);
      var d=cx.getImageData(0,0,24,24).data,r=0,g=0,bl=0,n=d.length/4;
      for(var i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];bl+=d[i+2];}
      r/=n;g/=n;bl/=n;
      var o=tipe==="hero"?[20,10,5]:[251,228,204];
      r=r*(1-ov)+o[0]*ov;g=g*(1-ov)+o[1]*ov;bl=bl*(1-ov)+o[2]*ov;
      setNada(el,lumRGB(r,g,bl));
    }catch(e){el.removeAttribute("data-tone");}
  }
  var putarT=null,putarTok=0;
  function hentiPutar(el){clearInterval(putarT);putarT=null;putarTok++;var b=el&&el.querySelector(".bn-fade");if(b)b.remove();}
  // tumpuk semua foto promo, lalu ganti yang tampil dengan efek memudar
  function putar(el,c,lap,ov){
    var L=promoFoto().map(function(k){return foto[k];});if(L.length<2)return;
    var box=document.createElement("div");box.className="bn-fade";box.setAttribute("aria-hidden","true");
    L.forEach(function(u,i){var d=document.createElement("i");d.style.backgroundImage="linear-gradient("+lap+","+lap+"),url(\""+u+"\")";if(i===0)d.className="on";box.appendChild(d);});
    el.insertBefore(box,el.firstChild);
    var tok=putarTok,nada=[];
    L.forEach(function(u,i){var im=new Image();im.onload=function(){if(tok!==putarTok)return;var tmp=document.createElement("div");nadaFoto(tmp,im,ov,"promo");nada[i]=tmp.getAttribute("data-tone");};im.src=u;});
    var idx=0,dt=Math.max(3,Math.min(15,Number(c.dt)||5))*1000;
    putarT=setInterval(function(){
      if(document.hidden||tok!==putarTok)return;
      var ds=box.children;if(!ds.length)return;
      ds[idx].classList.remove("on");idx=(idx+1)%ds.length;ds[idx].classList.add("on");
      if(nada[idx]&&!warnaOk(c.tc))el.setAttribute("data-tone",nada[idx]);
    },dt);
  }
  function terapkan(s){
    var el=elDari(s);if(!el)return;
    var c=cfg[s.k]||{m:"def"};
    if(s.tipe==="promo")hentiPutar(el);
    el.classList.remove("bn-foto","bn-set");
    el.style.background="";el.style.removeProperty("--bn-lingkar");el.removeAttribute("data-tone");
    // tulisan sendiri: warna (tc) & ukuran (ts, persen)
    if(warnaOk(c.tc)){el.classList.add("bn-tc");el.style.setProperty("--bn-tc",c.tc);}else{el.classList.remove("bn-tc");el.style.removeProperty("--bn-tc");}
    var ts=Number(c.ts);if(ts>=60&&ts<=180&&ts!==100)el.style.setProperty("--bn-ts",String(ts/100));else el.style.removeProperty("--bn-ts");
    if(c.m==="preset"){
      var t=tplDari(s,c);if(!t)return;
      el.style.background="linear-gradient(100deg,"+t.a+" 0%,"+t.b+" 100%)";
      var l1=lumHex(t.a),l2=lumHex(t.b);setNada(el,l1===null||l2===null?null:(l1+l2)/2);
      if(s.tipe==="promo"){el.classList.add("bn-set");el.style.setProperty("--bn-lingkar",t.c||"rgba(255,255,255,.35)");}
    }else if(c.m==="warna"&&warnaOk(c.a)&&warnaOk(c.b)){
      el.style.background="linear-gradient(100deg,"+c.a+" 0%,"+c.b+" 100%)";
      var m1=lumHex(c.a),m2=lumHex(c.b);setNada(el,m1===null||m2===null?null:(m1+m2)/2);
      if(s.tipe==="promo")el.classList.add("bn-set");
    }else if(c.m==="foto"&&fs(s)){
      var ov=Math.max(0,Math.min(90,Number(c.ov)||0))/100;
      var lap=s.tipe==="hero"?"rgba(20,10,5,"+ov+")":"rgba(251,228,204,"+ov+")";
      var url=fs(s);
      if(s.tipe==="promo")putar(el,c,lap,ov);
      var im=new Image();   // muat dulu supaya pergantian tidak berkedip
      im.onload=function(){
        el.style.background="linear-gradient("+lap+","+lap+"),url(\""+url+"\") center/cover no-repeat";
        el.classList.add("bn-foto");nadaFoto(el,im,ov,s.tipe);
      };
      im.src=url;
    }
  }
  function terapkanSemua(){slots().forEach(terapkan);}

  /* ---------- simpan lokal (cadangan cepat supaya tidak berkedip) ---------- */
  function simpanLokal(){
    try{localStorage.setItem(LS_CFG,JSON.stringify(cfg));}catch(e){}
    fotoKeys().forEach(function(k){try{if(foto[k])localStorage.setItem(LS_FOTO+k,foto[k]);else localStorage.removeItem(LS_FOTO+k);}catch(e){}});
  }
  function bacaLokal(){
    try{var c=JSON.parse(localStorage.getItem(LS_CFG)||"null");if(c&&typeof c==="object"&&!Array.isArray(c))cfg=c;}catch(e){}
    fotoKeys().forEach(function(k){try{var f=localStorage.getItem(LS_FOTO+k);if(f)foto[k]=f;}catch(e){}});
  }

  /* ---------- muat dari database ---------- */
  async function muatCloud(){
    if(!cloudOn())return;
    try{
      var r=await cloudFetch("store_settings?select=value&key=eq.tema_banner");
      var v=Array.isArray(r)&&r[0]&&r[0].value;
      if(v&&typeof v==="object"&&!Array.isArray(v))cfg=v;
      else if(Array.isArray(r))cfg={};   // admin menghapus pengaturan -> kembali bawaan
      var perlu=slots().filter(function(s){return cfg[s.k]&&cfg[s.k].m==="foto";});
      if(perlu.length){
        var rows=await cloudFetch("store_settings?select=key,value&key=like.foto_banner_*");
        (Array.isArray(rows)?rows:[]).forEach(function(x){
          var k=String(x.key).slice(12);
          if(x.value&&typeof x.value.foto==="string"&&/^data:image\//.test(x.value.foto))foto[k]=x.value.foto;
        });
      }
      simpanLokal();bangunHero();terapkanSemua();
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
    if(c.m==="foto"&&fs(s))return "url('"+fs(s)+"')";
    var d=TPL[s.tipe][s.k==="hero3"?2:(s.k==="hero2"?1:0)];
    return "linear-gradient(100deg,"+d.a+","+d.b+")";
  }
  /* ---------- pratinjau banner di editor (meniru tampilan asli di HP) ---------- */
  var pvTok={};
  function liveTeks(s){
    var el=elDari(s),promo=s.tipe==="promo";
    var q=function(x){var n=el&&el.querySelector(x);return n?String(n.textContent||"").trim():"";};
    var im=el&&el.querySelector(promo?".pc-ph img":".hs-img img");
    var src=im&&!im.hidden?(im.getAttribute("src")||""):"";
    if(promo)return {em:"",h:q(".pc-tx h2")||"Promo Spesial Hari Ini",p:q(".pc-tx p"),b:q(".pc-btn"),emo:q(".pc-emoji")||"🍱",img:src};
    return {em:q(".hs-script"),h:q("h1")||"Judul banner",p:q("p"),b:q(".hs-btn span"),emo:q(".hs-emoji"),img:src};
  }
  // nada latar (terang/gelap) untuk pratinjau; foto -> null (dihitung belakangan)
  function nadaSlot(s){
    var c=cfg[s.k]||{m:"def"},a=null,b=null,t;
    if(c.m==="preset"){t=tplDari(s,c);if(t){a=t.a;b=t.b;}}
    else if(c.m==="warna"&&warnaOk(c.a)&&warnaOk(c.b)){a=c.a;b=c.b;}
    else if(c.m==="foto"&&fs(s))return null;
    else return s.tipe==="hero"?"gelap":"terang";
    var l1=lumHex(a),l2=lumHex(b);
    if(l1===null||l2===null)return null;
    return (l1+l2)/2>0.4?"terang":"gelap";
  }
  function prevHtml(s,tone){
    var c=cfg[s.k]||{m:"def"},hero=s.tipe==="hero",T=liveTeks(s);
    if(!tone)tone=hero?"gelap":"terang";
    var tc=warnaOk(c.tc)?c.tc:(tone==="terang"?(hero?"#3b1e12":"#5a2a14"):"#ffffff");
    var bb,bc;
    if(hero){if(tone==="terang"){bb="#5a2a14";bc="#fff";}else{bb="#f8b93a";bc="#5a2a14";}}
    else{if(tone==="gelap"){bb="#fff";bc="#5a2a14";}else{bb="#5a2a14";bc="#fff";}}
    var ts=Number(c.ts);ts=(ts>=60&&ts<=180)?ts/100:1;
    var bg,deco="";
    if(c.m==="foto"&&fs(s)){
      var ov=Math.max(0,Math.min(90,Number(c.ov)||0))/100;
      var lap=hero?"rgba(20,10,5,"+ov+")":"rgba(251,228,204,"+ov+")";
      bg="linear-gradient("+lap+","+lap+"),url('"+fs(s)+"') center/cover no-repeat";
    }else{
      bg=prevBg(s);
      if(!hero){
        var t=c.m==="preset"?tplDari(s,c):null;
        var dc=t?t.c:(c.m==="warna"?"rgba(255,255,255,.35)":"#f3c48f");
        deco='<i class="bn-dc" style="background:'+dc+'"></i>';
      }
    }
    var isi=T.img?'<img src="'+esc(T.img)+'" alt="">':'<i>'+esc(T.emo)+'</i>';
    return '<div class="bn-prev '+(hero?"bn-hero":"bn-promo")+'" data-s="'+s.k+'" data-tone="'+tone+'" style="background:'+bg+';color:'+tc+'">'+deco+
      '<div class="bn-pt" style="font-size:'+(ts*1)+'cqw">'+
        (T.em?'<em class="bn-ps">'+esc(T.em)+'</em>':'')+
        '<strong class="bn-ph">'+esc(T.h)+'</strong>'+
        (T.p?'<span class="bn-pp">'+esc(T.p)+'</span>':'')+
        (T.b?'<span class="bn-pb" style="background:'+bb+';color:'+bc+'">'+esc(T.b)+' ›</span>':'')+
      '</div>'+
      '<div class="bn-pc">'+isi+'</div></div>';
  }
  // perbarui pratinjau satu kotak tanpa menggambar ulang seluruh panel
  function segarPrev(k){
    var s=slotOf(k);if(!s||!panel)return;
    var cur=panel.querySelector('.bn-prev[data-s="'+k+'"]');if(!cur)return;
    cur.outerHTML=prevHtml(s,nadaSlot(s));
    var c=cfg[k]||{};
    if(c.m==="foto"&&fs(s)){
      var tok=pvTok[k]=(pvTok[k]||0)+1;
      var im=new Image();
      im.onload=function(){
        if(pvTok[k]!==tok)return;
        var tmp=document.createElement("div"),cc=cfg[k]||{};
        nadaFoto(tmp,im,Math.max(0,Math.min(90,Number(cc.ov)||0))/100,s.tipe);
        var t2=tmp.getAttribute("data-tone"),now=panel.querySelector('.bn-prev[data-s="'+k+'"]');
        if(now&&t2&&now.getAttribute("data-tone")!==t2)now.outerHTML=prevHtml(s,t2);
      };
      im.src=fs(s);
    }
  }
  function kolom(lbl,f,v,mx,ph,id){
    return '<label class="bn-f"><span>'+lbl+'</span><input type="text" maxlength="'+mx+'" data-bn="txt" data-s="'+id+'" data-f="'+f+'" value="'+esc(v||"")+'"'+(ph?' placeholder="'+esc(ph)+'"':"")+'></label>';
  }
  function kartu(s){
    var c=cfg[s.k]||{m:"def"},L=TPL[s.tipe];
    var hidden=s.bawaan&&s.tipe==="hero"&&hapusList().indexOf(s.k)>=0;
    var lewat=s.tipe==="hero"&&habis(s.k);
    var bx=!s.bawaan?tambahList().filter(function(x){return x.id===s.k;})[0]:null;
    var aksi="";
    if(s.tipe==="hero"&&s.bawaan){
      aksi=hidden?'<button type="button" class="bn-chip" data-bn="pulih-b" data-s="'+s.k+'">↩︎ Tampilkan lagi banner ini</button>'
        :'<button type="button" class="bn-chip bn-del" data-bn="hapus-b" data-s="'+s.k+'">🗑️ Hapus banner ini</button>';
    }else if(bx){
      aksi='<button type="button" class="bn-chip bn-del" data-bn="hapus-x" data-s="'+s.k+'">🗑️ Hapus banner ini</button>';
    }
    var teks=bx?'<div class="bn-fields">'+kolom("Tulisan kecil di atas judul (boleh kosong)","em",bx.em,40,"",s.k)+kolom("Judul","judul",bx.judul,60,"",s.k)+kolom("Keterangan (boleh kosong)","teks",bx.teks,90,"",s.k)+kolom("Teks tombol (kosongkan = tanpa tombol)","tombol",bx.tombol,24,"",s.k)+kolom("Tautan tombol","link",bx.link,200,"#products, kuis.html, atau https://…",s.k)+kolom("Emoji di lingkaran kanan (boleh kosong)","emoji",bx.emoji,4,"",s.k)+'</div>':"";
    var sw=L.map(function(t){
      return '<button type="button" class="bn-sw'+(c.m==="preset"&&c.p===t.id?" on":"")+'" title="'+esc(t.nama)+'" aria-label="'+esc(t.nama)+'" data-bn="preset" data-s="'+s.k+'" data-p="'+t.id+'" style="background:linear-gradient(135deg,'+t.a+','+t.b+')"></button>';
    }).join("");
    var a=warnaOk(c.a)?c.a:L[0].a,b=warnaOk(c.b)?c.b:L[0].b;
    var ov=c.m==="foto"?(Number(c.ov)||0):(s.tipe==="hero"?35:50);
    return '<div class="bn-card" data-k="'+s.k+'"'+(hidden||lewat?' style="opacity:.6"':"")+'><b>'+esc(s.nama)+(hidden?" (disembunyikan)":(lewat?" (⌛ sudah berakhir)":""))+'</b>'+teks+
      '<small class="bn-ukuran">👁️ Pratinjau (seperti tampilan di HP) — ikut berubah saat Anda mengatur</small>'+
      '<div class="bn-pvw">'+prevHtml(s,nadaSlot(s))+'</div>'+
      '<div class="bn-row"><button type="button" class="bn-chip'+(c.m==="def"||!c.m?" on":"")+'" data-bn="def" data-s="'+s.k+'">↩︎ Bawaan</button>'+sw+'</div>'+
      '<div class="bn-row"><button type="button" class="bn-chip'+(c.m==="warna"?" on":"")+'" data-bn="warna" data-s="'+s.k+'">🎨 Warna sendiri</button>'+
        '<label class="bn-l">Kiri <input type="color" data-bn="a" data-s="'+s.k+'" value="'+a+'"></label>'+
        '<label class="bn-l">Kanan <input type="color" data-bn="b" data-s="'+s.k+'" value="'+b+'"></label></div>'+
      '<div class="bn-row"><label class="bn-chip'+(c.m==="foto"?" on":"")+'" style="cursor:pointer">🖼️ '+(fs(s)?(s.tipe==="promo"&&promoSemua().length>1?"Ganti foto 1":"Ganti foto"):"Pakai foto")+
        '<input type="file" accept="image/*" data-crop="'+(s.tipe==="hero"?"2:1":"3:1")+'" data-bn="file" data-s="'+s.k+'"'+(s.tipe==="promo"?' data-fk="'+(promoSemua()[0]||"promo")+'"':"")+' hidden></label></div>'+
      (s.tipe==="promo"&&c.m==="foto"&&fs(s)?promoPanel(c):"")+
      '<small class="bn-ukuran">📐 Ukuran foto ideal: <b>'+(s.tipe==="hero"?"1200 × 600 px (perbandingan 2:1)":"1200 × 400 px (perbandingan 3:1)")+'</b>. '+
        (s.tipe==="hero"?"Teks ada di sisi kiri dan lingkaran foto menu di kanan, jadi pakai foto yang tidak ramai. ":"Teks di kiri dan foto menu bulat di kanan, jadi pakai foto yang tidak ramai. ")+
        'Di komputer kotak tampil lebih lebar, jadi bagian atas/bawah foto bisa terpotong: taruh objek penting di tengah.</small>'+
      (c.m==="foto"?'<div class="bn-row"><label class="bn-l" style="flex:1">'+(s.tipe==="hero"?"🌑 Lapisan gelap":"☀️ Lapisan terang")+' <b class="bn-pct">'+ov+'%</b> <input type="range" min="0" max="90" step="5" value="'+ov+'" data-bn="ov" data-s="'+s.k+'"></label></div>'+
        '<small class="bn-ukuran">'+(s.tipe==="hero"?"Geser ke kanan supaya foto lebih gelap dan teks putih lebih jelas.":"Geser ke kanan supaya foto lebih pudar dan teks cokelat lebih jelas.")+'</small>':'')+
    '<div class="bn-row"><b class="bn-l">✍️ Warna tulisan</b>'+
      '<button type="button" class="bn-chip'+(warnaOk(c.tc)?"":" on")+'" data-bn="tc-auto" data-s="'+s.k+'">Otomatis</button>'+
      '<button type="button" class="bn-chip'+(c.tc==="#ffffff"?" on":"")+'" data-bn="tc-putih" data-s="'+s.k+'">Putih</button>'+
      '<button type="button" class="bn-chip'+(c.tc==="#3b1e12"?" on":"")+'" data-bn="tc-coklat" data-s="'+s.k+'">Cokelat</button>'+
      '<label class="bn-l">Pilih <input type="color" data-bn="tc" data-s="'+s.k+'" value="'+(warnaOk(c.tc)?c.tc:"#ffffff")+'"></label></div>'+
    '<div class="bn-row"><b class="bn-l">🔠 Ukuran tulisan</b>'+
      '<button type="button" class="bn-chip" data-bn="ts-" data-s="'+s.k+'" aria-label="Kecilkan tulisan">−</button>'+
      '<b class="bn-pct">'+(Number(c.ts)||100)+'%</b>'+
      '<button type="button" class="bn-chip" data-bn="ts+" data-s="'+s.k+'" aria-label="Besarkan tulisan">+</button>'+
      '<button type="button" class="bn-chip" data-bn="ts0" data-s="'+s.k+'">Reset</button></div>'+
    (s.tipe==="hero"&&!hidden?'<div class="bn-row bn-wrow">'+waktuHtml(s.k)+'</div>':"")+
    (aksi?'<div class="bn-row">'+aksi+'</div>':"")+
    '</div>';
  }
  // isian "hapus otomatis" untuk satu banner / satu foto promo
  function waktuHtml(k){
    var t=sampaiOf(k),st;
    if(!t)st='<small class="bn-ukuran">Tampil terus (tanpa batas waktu)</small>';
    else if(habis(k))st='<small class="bn-ukuran bn-habis">⌛ Sudah berakhir '+teksWaktu(t)+' — tidak tampil lagi di beranda. Dihapus permanen saat Anda menekan Simpan.</small>';
    else st='<small class="bn-ukuran">Otomatis hilang pada <b>'+teksWaktu(t)+'</b></small>';
    return '<label class="bn-l bn-wk">⏰ Hapus otomatis <input type="datetime-local" data-bn="sampai" data-s="'+k+'" value="'+keInput(t)+'"></label>'+
      (t?'<button type="button" class="bn-chip" data-bn="sampai-x" data-s="'+k+'">Tanpa batas</button>':'')+st;
  }
  function promoPanel(c){
    var L=promoSemua(),dt=Number(c.dt)||5;
    return '<div class="bn-row"><b class="bn-l">🎞️ Foto bergantian (memudar) — '+L.length+'/'+MAKS_PROMO+'</b></div>'+
      L.map(function(k,i){
        return '<div class="bn-row bn-fr"><span class="bn-th" style="background-image:url(\''+foto[k]+'\')'+(habis(k)?';opacity:.45':'')+'"><b>'+(i+1)+'</b><button type="button" data-bn="foto-x" data-s="promo" data-fk="'+k+'" aria-label="Hapus foto '+(i+1)+'">✕</button></span>'+
          '<div class="bn-fw">'+waktuHtml(k)+'</div></div>';
      }).join("")+
      (L.length<MAKS_PROMO?'<div class="bn-row"><label class="bn-chip" style="cursor:pointer">➕ Tambah foto<input type="file" accept="image/*" data-crop="3:1" data-bn="file" data-s="promo" data-fk="baru" hidden></label></div>':"")+
      (L.length>1?'<div class="bn-row"><b class="bn-l">⏱️ Ganti tiap</b>'+[3,5,8,12].map(function(v){return '<button type="button" class="bn-chip'+(dt===v?" on":"")+'" data-bn="dt" data-s="promo" data-v="'+v+'">'+v+' detik</button>';}).join("")+'</div>':"")+
      '<small class="bn-ukuran">'+(L.length>1?"Foto tampil bergantian dengan efek memudar, urut dari nomor 1.":"Tambah foto ke-2 dst. supaya kotak promo berganti-ganti foto dengan efek memudar.")+' Maksimal '+MAKS_PROMO+' foto (makin banyak foto, beranda makin lama dimuat).</small>';
  }
  function gambarPanel(){
    if(!panel)return;
    panel.innerHTML='<div class="bn-head"><h4>🎨 Template Banner</h4><button type="button" class="bn-x" data-bn="tutup" aria-label="Tutup">✕</button></div>'+
      '<p class="bn-note">Hanya mengganti <b>background</b>. Teks, tombol, dan fitur kotak tidak berubah. Banner geser pakai warna/foto <b>gelap</b> agar teks putih terbaca; Promo pakai warna/foto <b>terang</b>. Geser slider untuk mengatur lapisan agar teks tetap jelas. Foto otomatis dikompres (lebar maks 1200 px, sekitar 150 KB) supaya web tetap ringan.</p>'+
      '<div class="bn-row"><button type="button" class="bn-chip on" data-bn="tambah"'+(tambahList().length>=MAKS_BARU?" disabled":"")+'>➕ Banner baru</button><small class="bn-ukuran">Maksimal '+MAKS_BARU+' banner tambahan. Banner bawaan boleh dihapus (disembunyikan) dan dipulihkan lagi.</small></div>'+
      slots().filter(function(x){return x.tipe==="hero";}).map(kartu).join("")+
      '<div class="bn-row" style="justify-content:center;margin:2px 0 12px"><button type="button" class="bn-chip on" data-bn="tambah"'+(tambahList().length>=MAKS_BARU?" disabled":"")+'>➕ Banner baru ('+tambahList().length+'/'+MAKS_BARU+')</button></div>'+
      slots().filter(function(x){return x.tipe!=="hero";}).map(kartu).join("")+
      '<button type="button" class="btn primary bn-save" data-bn="simpan">💾 Simpan untuk semua pengunjung</button>';
    slots().forEach(function(s){var c=cfg[s.k];if(c&&c.m==="foto"&&fs(s))segarPrev(s.k);});
  }
  function atur(k,nilai){cfg[k]=Object.assign({},cfg[k]||{},nilai);}

  // yang sudah lewat batas waktunya dihapus permanen (foto ikut dihapus dari database)
  function bersihkanHabis(){
    var n=0;
    promoSemua().forEach(function(k){if(habis(k)){delete foto[k];delete dirtyFoto[k];if(fotoHapus.indexOf(k)<0)fotoHapus.push(k);setSampai(k,0);n++;try{localStorage.removeItem(LS_FOTO+k);}catch(e){}}});
    if(n){var sisa=promoSemua(),cp=cfg.promo||{};if(sisa.length)cp.fl=sisa;else{cp.m="def";delete cp.fl;}cfg.promo=cp;}
    tambahList().forEach(function(b){if(habis(b.id)){cfg.tambah=tambahList().filter(function(x){return x.id!==b.id;});delete cfg[b.id];if(foto[b.id]){delete foto[b.id];fotoHapus.push(b.id);}delete dirtyFoto[b.id];setSampai(b.id,0);n++;}});
    BAWAAN.forEach(function(x){if(habis(x.k)){if(hapusList().indexOf(x.k)<0)cfg.hapus=hapusList().concat([x.k]);setSampai(x.k,0);n++;}});
    Object.keys(sampaiMap()).forEach(function(k){if(!slotOf(k)&&!foto[k])setSampai(k,0);});
    if(n){bangunHero();terapkanSemua();if(panel&&buka)gambarPanel();}
    return n;
  }
  async function simpanSemua(){
    var nHabis=bersihkanHabis();
    simpanLokal();
    if(!cloudOn()){toast("🎨 Banner disimpan di perangkat ini");return;}
    try{
      if(ada(adminEnsureFresh))await adminEnsureFresh();
      var bersih={};
      slots().forEach(function(s){var cc=cfg[s.k];if(cc&&((cc.m&&cc.m!=="def")||cc.tc||(cc.ts&&Number(cc.ts)!==100)))bersih[s.k]=cc;});
      if(hapusList().length)bersih.hapus=hapusList().slice();
      if(Object.keys(sampaiMap()).length)bersih.sampai=Object.assign({},sampaiMap());
      if(tambahList().length)bersih.tambah=tambahList().map(function(b){return {id:String(b.id),em:String(b.em||"").slice(0,40),judul:String(b.judul||"").slice(0,60),teks:String(b.teks||"").slice(0,90),tombol:String(b.tombol||"").slice(0,24),link:String(b.link||"").slice(0,200),emoji:String(b.emoji||"").slice(0,4)};});
      var body=[{key:"tema_banner",value:bersih}];
      Object.keys(dirtyFoto).forEach(function(k){if(foto[k])body.push({key:"foto_banner_"+k,value:{foto:foto[k]}});});
      await cloudFetch("store_settings?on_conflict=key",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(body)});
      fotoHapus=fotoHapus.filter(function(k){return !foto[k];});
      for(var i=0;i<fotoHapus.length;i++){try{await cloudFetch("store_settings?key=eq."+encodeURIComponent("foto_banner_"+fotoHapus[i]),{method:"DELETE"});}catch(e){}}
      fotoHapus=[];
      dirtyFoto={};cfg=bersih;
      toast("✅ Banner tersimpan untuk semua pengunjung"+(nHabis?" • "+nHabis+" yang sudah berakhir dihapus permanen":""));
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
    if(location.hash==="#atur-banner"){var ivB=setInterval(function(){var ap=$("adminPanel");if(ap&&!ap.hidden){clearInterval(ivB);if(!buka)tombol.click();try{panel.scrollIntoView({behavior:"smooth",block:"start"});}catch(e){}}},400);setTimeout(function(){clearInterval(ivB);},300000);}
    panel.addEventListener("click",async function(e){
      var t=e.target.closest("[data-bn]");if(!t)return;
      var a=t.dataset.bn,k=t.dataset.s;
      if(a==="tutup"){buka=false;panel.hidden=true;tombol.classList.remove("active");return;}
      if(a==="simpan"){await simpanSemua();return;}
      if(a==="tambah"){
        if(tambahList().length>=MAKS_BARU){toast("Maksimal "+MAKS_BARU+" banner tambahan");return;}
        var nb={id:"x"+Date.now().toString(36),em:"Baru!",judul:"Judul banner",teks:"Tulis keterangan di sini",tombol:"Lihat",link:"#products",emoji:"🎉"};
        cfg.tambah=tambahList().concat([nb]);bangunHero();terapkanSemua();gambarPanel();
        try{var nk=panel.querySelector('.bn-card[data-k="'+nb.id+'"]');if(nk){nk.scrollIntoView({behavior:"smooth",block:"center"});var fj=nk.querySelector('input[data-f="judul"]');if(fj){fj.focus({preventScroll:true});fj.select();}}}catch(e){}
        toast("➕ Banner ditambahkan. Isi tulisannya lalu tekan Simpan.");return;
      }
      if(a==="hapus-b"){
        if(jumlahTampil()<=1){toast("Sisakan minimal 1 banner");return;}
        cfg.hapus=hapusList().concat([k]);bangunHero();gambarPanel();toast("🗑️ Banner disembunyikan. Tekan Simpan.");return;
      }
      if(a==="pulih-b"){cfg.hapus=hapusList().filter(function(x){return x!==k;});bangunHero();gambarPanel();return;}
      if(a==="hapus-x"){
        if(jumlahTampil()<=1){toast("Sisakan minimal 1 banner");return;}
        if(!confirm("Hapus banner ini?"))return;
        cfg.tambah=tambahList().filter(function(x){return x.id!==k;});delete cfg[k];setSampai(k,0);
        if(foto[k]){delete foto[k];fotoHapus.push(k);}delete dirtyFoto[k];
        try{localStorage.removeItem(LS_FOTO+k);}catch(e){}
        bangunHero();terapkanSemua();gambarPanel();toast("🗑️ Banner dihapus. Tekan Simpan.");return;
      }
      if(a==="sampai-x"){setSampai(k,0);bangunHero();terapkanSemua();gambarPanel();toast("⏰ Batas waktu dihapus. Tekan Simpan.");return;}
      if(a==="dt"){atur("promo",{dt:Number(t.dataset.v)||5});terapkan(slotOf("promo"));gambarPanel();toast("⏱️ Foto promo berganti tiap "+t.dataset.v+" detik. Tekan Simpan.");return;}
      if(a==="foto-x"){
        var fx=t.dataset.fk;if(!foto[fx])return;
        if(!confirm("Hapus foto ini dari kotak promo?"))return;
        delete foto[fx];delete dirtyFoto[fx];if(fotoHapus.indexOf(fx)<0)fotoHapus.push(fx);setSampai(fx,0);
        try{localStorage.removeItem(LS_FOTO+fx);}catch(e){}
        var sisa=promoSemua();
        if(sisa.length)atur("promo",{fl:sisa});else{var cp=cfg.promo||{};cp.m="def";delete cp.fl;cfg.promo=cp;}
        terapkan(slotOf("promo"));gambarPanel();toast("🗑️ Foto dihapus. Tekan Simpan.");return;
      }
      if(a==="def"){var cd=cfg[k]||{},keep={};if(cd.tc)keep.tc=cd.tc;if(cd.ts)keep.ts=cd.ts;if(keep.tc||keep.ts)cfg[k]=keep;else delete cfg[k];terapkan(slotOf(k));gambarPanel();return;}
      if(a==="tc-auto"){atur(k,{tc:""});terapkan(slotOf(k));gambarPanel();return;}
      if(a==="tc-putih"){atur(k,{tc:"#ffffff"});terapkan(slotOf(k));gambarPanel();return;}
      if(a==="tc-coklat"){atur(k,{tc:"#3b1e12"});terapkan(slotOf(k));gambarPanel();return;}
      if(a==="ts-"||a==="ts+"||a==="ts0"){var cs=Number((cfg[k]||{}).ts)||100,ns=a==="ts0"?100:Math.max(60,Math.min(180,cs+(a==="ts+"?10:-10)));atur(k,{ts:ns});terapkan(slotOf(k));gambarPanel();return;}
      if(a==="preset"){atur(k,{m:"preset",p:t.dataset.p});terapkan(slotOf(k));gambarPanel();return;}
      if(a==="warna"){var L=TPL[slotOf(k).tipe];var c=cfg[k]||{};atur(k,{m:"warna",a:warnaOk(c.a)?c.a:L[0].a,b:warnaOk(c.b)?c.b:L[0].b});terapkan(slotOf(k));gambarPanel();return;}
    });
    panel.addEventListener("input",function(e){
      var t=e.target;if(!t.dataset||!t.dataset.bn)return;
      var a=t.dataset.bn,k=t.dataset.s;
      if(a==="txt"){
        var bb=tambahList().filter(function(x){return x.id===k;})[0],f=t.dataset.f;
        if(bb&&/^(em|judul|teks|tombol|link|emoji)$/.test(f)){bb[f]=t.value;var el=elDari(slotOf(k));if(el)isiSlide(el,bb);segarPrev(k);}
        return;
      }
      if(a==="a"||a==="b"){var c=cfg[k]||{};var o={m:"warna"};o[a]=t.value;if(!warnaOk(c.a)||!warnaOk(c.b)){var L=TPL[slotOf(k).tipe];o.a=o.a||L[0].a;o.b=o.b||L[0].b;}atur(k,o);terapkan(slotOf(k));
        segarPrev(k);}
      if(a==="tc"){atur(k,{tc:t.value});terapkan(slotOf(k));segarPrev(k);return;}
      if(a==="ov"){atur(k,{ov:Number(t.value)});terapkan(slotOf(k));var pc=t.closest(".bn-card");pc=pc&&pc.querySelector(".bn-pct");if(pc)pc.textContent=t.value+"%";segarPrev(k);}
    });
    panel.addEventListener("change",async function(e){
      var t=e.target;
      if(t.dataset&&t.dataset.bn==="sampai"){
        var kk=t.dataset.s,ms=t.value?new Date(t.value).getTime():0;
        if(t.value&&!(ms>0)){toast("⚠️ Tanggal tidak valid");return;}
        if(ms&&ms<=Date.now()&&!confirm("Waktu itu sudah lewat, jadi banner/foto ini langsung hilang dari beranda. Lanjutkan?")){gambarPanel();return;}
        setSampai(kk,ms);bangunHero();terapkanSemua();gambarPanel();
        toast(ms?"⏰ Akan hilang otomatis pada "+teksWaktu(ms)+". Tekan Simpan.":"⏰ Tampil terus. Tekan Simpan.");return;
      }
      if(!t.dataset||t.dataset.bn!=="file"||!t.files||!t.files[0])return;
      var k=t.dataset.s,fk=t.dataset.fk||k;
      try{
        var hasil=await kompres(t.files[0]);
        if(fk==="baru"){if(promoSemua().length>=MAKS_PROMO)throw new Error("Maksimal "+MAKS_PROMO+" foto");fk="promo_"+Date.now().toString(36);}
        foto[fk]=hasil.url;dirtyFoto[fk]=true;fotoHapus=fotoHapus.filter(function(x){return x!==fk;});
        if(slotOf(k).tipe==="promo"){var pl=promoSemua();if(pl.indexOf(fk)<0)pl.push(fk);atur("promo",{fl:pl});}
        atur(k,{m:"foto",ov:(cfg[k]&&cfg[k].ov!=null)?cfg[k].ov:(slotOf(k).tipe==="hero"?35:50)});
        terapkan(slotOf(k));gambarPanel();
        toast("🖼️ Foto dikompres otomatis: "+kb(hasil.awal)+" → "+kb(hasil.akhir)+". Tekan Simpan.");
      }catch(err){toast("⚠️ "+(err&&err.message||"Foto gagal dipakai"));}
      t.value="";
    });
    return true;
  }

  /* ---------- mulai ---------- */
  tandaiBawaan();bacaLokal();bangunHero();terapkanSemua();
  if(!pasangAdmin()){
    var n=0,iv=setInterval(function(){if(pasangAdmin()||++n>40)clearInterval(iv);},250);
  }
  // tunggu script.js selesai menyiapkan koneksi, lalu ambil dari database
  setTimeout(muatCloud,600);
  // dibuka dari Admin > Tampilan: tampilkan form login admin (setelah login, panel banner terbuka)
  if(location.hash==="#atur-banner"){setTimeout(function(){try{if(typeof openAdmin==="function")openAdmin();}catch(e){}},900);}
  window.KSBannerTema={terapkan:terapkanSemua,muat:muatCloud};
})();
