/* =====================================================================
   KALENSARI • Animasi produk terbang ke keranjang
   Saat produk berhasil masuk keranjang (tombol + Keranjang di daftar menu
   atau dari popup Detail), foto produk melayang melengkung ke ikon
   keranjang di header, lalu ikon keranjang bergoyang kecil.
   Tidak mengubah cara kerja keranjang: addToCart asli tetap dipakai.
   ===================================================================== */
(function(){
  if(window.__ksTerbang)return;window.__ksTerbang=true;

  var st=document.createElement("style");
  st.textContent=
    ".ks-fly-x{position:fixed;left:0;top:0;z-index:9999;pointer-events:none;will-change:transform}"+
    ".ks-fly-y{will-change:transform}"+
    ".ks-fly-b{width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;overflow:hidden;background:#fbecd6 center/cover no-repeat;"+
      "box-shadow:0 0 0 3px #fff,0 0 0 5px #e9a93a,0 12px 24px -8px rgba(58,31,16,.6);display:grid;place-items:center;font-size:30px;will-change:transform,opacity}"+
    "@keyframes ksKeranjangGoyang{0%{transform:scale(1)}30%{transform:scale(1.25) rotate(-8deg)}55%{transform:scale(.92) rotate(6deg)}80%{transform:scale(1.06) rotate(-2deg)}100%{transform:scale(1)}}"+
    ".ks-cart-goyang{animation:ksKeranjangGoyang .55s ease}";
  document.head.appendChild(st);

  // ingat elemen terakhir yang ditekan (untuk tahu foto produk mana yang diterbangkan)
  var asal=null,asalT=0;
  document.addEventListener("pointerdown",function(e){asal=e.target;asalT=Date.now();},true);
  document.addEventListener("click",function(e){asal=e.target;asalT=Date.now();},true);

  function totalQty(){try{return (typeof cart!=="undefined"&&Array.isArray(cart))?cart.reduce(function(n,x){return n+(Number(x.qty)||0);},0):0;}catch(e){return 0;}}
  function terlihat(el){if(!el)return null;var r=el.getBoundingClientRect();if(!r.width||!r.height)return null;if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return null;var cs=getComputedStyle(el);if(cs.visibility==="hidden"||cs.display==="none")return null;return r;}

  function cariFoto(){
    if(!asal||Date.now()-asalT>4000||!asal.closest)return null;
    var kartu=asal.closest(".product");
    if(kartu){var im=kartu.querySelector(".product-img img");return {el:im&&im.style.display!=="none"?im:kartu.querySelector(".product-img"),src:im&&im.style.display!=="none"?im.currentSrc||im.src:""};}
    var modal=asal.closest(".modal,.modal-box,[role=dialog]");
    if(modal){var im2=modal.querySelector(".detail-img img, img");if(im2)return {el:im2,src:im2.currentSrc||im2.src};}
    return null;
  }

  function goyang(btn){if(!btn)return;btn.classList.remove("ks-cart-goyang");void btn.offsetWidth;btn.classList.add("ks-cart-goyang");}

  function terbang(){
    var btn=document.getElementById("cartBtn");
    var tujuan=terlihat(btn);
    var f=cariFoto();
    var kurangGerak=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(kurangGerak||!f||!f.el||!document.body.animate){goyang(btn);return;}
    var r=f.el.getBoundingClientRect();
    if(!r.width||!r.height){goyang(btn);return;}
    var x0=r.left+r.width/2,y0=r.top+r.height/2;
    // keranjang tidak terlihat (mis. tertutup) -> terbang ke pojok kanan atas
    var x1=tujuan?tujuan.left+tujuan.width/2:innerWidth-36,y1=tujuan?tujuan.top+tujuan.height/2:28;

    var ox=document.createElement("div");ox.className="ks-fly-x";
    var oy=document.createElement("div");oy.className="ks-fly-y";
    var b=document.createElement("div");b.className="ks-fly-b";
    if(f.src)b.style.backgroundImage="url(\""+String(f.src).replace(/"/g,"%22")+"\")";else b.textContent="🛍️";
    oy.appendChild(b);ox.appendChild(oy);document.body.appendChild(ox);

    var dur=Math.max(550,Math.min(900,Math.hypot(x1-x0,y1-y0)*0.9));
    // X cepat di awal, Y cepat di akhir -> lintasan melengkung tanpa keluar layar
    ox.animate([{transform:"translate("+x0+"px,0)"},{transform:"translate("+x1+"px,0)"}],{duration:dur,easing:"cubic-bezier(.2,.7,.4,1)",fill:"forwards"});
    oy.animate([{transform:"translateY("+y0+"px)"},{transform:"translateY("+(y0+Math.min(40,innerHeight-y0-40))+"px)",offset:.25},{transform:"translateY("+y1+"px)"}],{duration:dur,easing:"cubic-bezier(.5,0,.8,.6)",fill:"forwards"});
    var a=b.animate([{transform:"scale(1.15)",opacity:1},{transform:"scale(.9)",opacity:1,offset:.6},{transform:"scale(.25)",opacity:.6}],{duration:dur,easing:"ease-in",fill:"forwards"});
    var selesai=false;
    function beres(){if(selesai)return;selesai=true;ox.remove();goyang(btn);}
    a.onfinish=beres;setTimeout(beres,dur+300);
  }

  function pasang(){
    if(typeof window.addToCart!=="function"||window.addToCart.__terbang)return typeof window.addToCart==="function";
    var asli=window.addToCart;
    var bungkus=function(){
      var sebelum=totalQty(),hasil=asli.apply(this,arguments);
      try{if(totalQty()>sebelum)terbang();}catch(e){}
      return hasil;
    };
    bungkus.__terbang=true;window.addToCart=bungkus;
    return true;
  }
  if(!pasang()){var n=0,iv=setInterval(function(){if(pasang()||++n>40)clearInterval(iv);},250);}
})();
