/* =====================================================================
   KALENSARI • KSCrop — potong (crop) foto sebelum di-upload
   Cukup pasang <script src="crop.js"></script> di halaman.
   Setiap <input type="file" accept="image/*"> otomatis memunculkan layar potong:
     geser foto, cubit/geser slider untuk zoom, putar 90°, pilih bentuk (1:1, 4:3, ...).
   Hasil potongan menggantikan file asli, lalu kode halaman berjalan seperti biasa.
   Atur per input (opsional):
     data-crop="1:1" | "4:3" | "3:4" | "16:9" | "asli" | "bulat"  -> bentuk awal
     data-crop="off"                                              -> tanpa potong
   Bisa juga dipanggil langsung:  KSCrop.potong(file, {rasio:"1:1"}) -> Promise<File|null>
   ===================================================================== */
(function(){
  if(window.KSCrop) return;
  const RASIO = {"1:1":1, "4:3":4/3, "3:4":3/4, "16:9":16/9, "bulat":1};
  const MAKS = 1600;
  const css = `.ksc{position:fixed;inset:0;z-index:100000;background:#120a06;display:flex;flex-direction:column;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}
.ksc-top{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 8px}
.ksc-top b{font-size:16px}.ksc-top small{display:block;font-size:12px;opacity:.7;font-weight:400}
.ksc-ib{background:rgba(255,255,255,.14);border:0;color:#fff;font:inherit;font-size:13px;font-weight:700;padding:8px 12px;border-radius:999px;cursor:pointer;white-space:nowrap}
.ksc-st{position:relative;flex:1;overflow:hidden;cursor:grab}
.ksc-st:active{cursor:grabbing}
.ksc-st canvas{position:absolute;inset:0;width:100%;height:100%}
.ksc-bar{padding:8px 14px calc(12px + env(safe-area-inset-bottom,0px));background:#1d120c}
.ksc-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none}
.ksc-chips::-webkit-scrollbar{display:none}
.ksc-chips button{flex:none;border:1px solid rgba(255,255,255,.3);background:none;color:#fff;font:inherit;font-size:13px;padding:7px 12px;border-radius:999px;cursor:pointer}
.ksc-chips button.on{background:#f5c542;border-color:#f5c542;color:#3a1f10;font-weight:800}
.ksc-zoom{display:flex;align-items:center;gap:10px;margin:2px 0 10px;font-size:18px}
.ksc-zoom input{flex:1;accent-color:#f5c542}
.ksc-act{display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:8px}
.ksc-act button{border:0;border-radius:14px;padding:13px 6px;font:inherit;font-weight:800;font-size:14.5px;cursor:pointer}
.ksc-b1{background:rgba(255,255,255,.12);color:#fff}.ksc-b2{background:#f5c542;color:#3a1f10}`;
  let st = null;
  function pasangCss(){ if(st) return; st = document.createElement("style"); st.textContent = css; document.head.appendChild(st); }
  function bacaGambar(file){
    return new Promise((ok, no) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => { ok(im); setTimeout(() => URL.revokeObjectURL(url), 2000); };
      im.onerror = () => { URL.revokeObjectURL(url); no(new Error("Foto tidak bisa dibaca")); };
      im.src = url;
    });
  }
  // sumber gambar (sudah diputar) sebagai canvas, maksimal 2400px supaya HP tidak berat
  function sumber(im, putar){
    const k = Math.min(1, 2400 / Math.max(im.naturalWidth, im.naturalHeight));
    const w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k);
    const c = document.createElement("canvas"), r = putar % 2 === 1;
    c.width = r ? h : w; c.height = r ? w : h;
    const x = c.getContext("2d"); x.translate(c.width / 2, c.height / 2); x.rotate(putar * Math.PI / 2); x.drawImage(im, -w / 2, -h / 2, w, h);
    return c;
  }

  // Layar potong harus pas dengan area yang TERLIHAT. Bila halaman sedang di-zoom (mis. Mode Desktop di HP, atau dicubit),
  // overlay "fixed" biasa jadi lebih lebar/tinggi dari layar -> bingkai terpotong & tombol hilang. Di sini overlay
  // disesuaikan ke visualViewport dan diskalakan balik agar ukuran tombol/tulisan tetap normal.
  function pas(el){
    const v = window.visualViewport; if(!v) return;
    const sc = v.scale || 1;
    if(Math.abs(sc - 1) < 0.02 && Math.abs(v.offsetLeft) < 1 && Math.abs(v.offsetTop) < 1){
      ["inset","left","top","width","height","transform","transformOrigin"].forEach(k => el.style[k] = ""); return;
    }
    el.style.inset = "auto"; el.style.left = v.offsetLeft + "px"; el.style.top = v.offsetTop + "px";
    el.style.width = (v.width * sc) + "px"; el.style.height = (v.height * sc) + "px";
    el.style.transformOrigin = "0 0"; el.style.transform = "scale(" + (1 / sc) + ")";
  }

  function potong(file, opsi = {}){
    return new Promise(async selesai => {
      let im; try{ im = await bacaGambar(file); }catch(e){ selesai(file); return; }
      pasangCss();
      const awal = String(opsi.rasio || "1:1").toLowerCase();
      let mode = RASIO[awal] || awal === "asli" ? awal : "1:1", putar = 0, src = sumber(im, 0);
      const el = document.createElement("div"); el.className = "ksc";
      el.innerHTML = `<div class="ksc-top"><div><b>✂️ Potong foto</b><small>${esc(opsi.judul || "Geser & cubit untuk mengatur")}</small></div><button class="ksc-ib" data-a="putar" type="button">⟳ Putar</button></div>
        <div class="ksc-st"><canvas></canvas></div>
        <div class="ksc-bar"><div class="ksc-chips">${(opsi.kunci ? [mode] : ["1:1", "4:3", "3:4", "16:9", "asli"].concat(mode === "bulat" ? ["bulat"] : []))
          .map(k => `<button type="button" data-r="${k}" class="${k === mode ? "on" : ""}">${k === "asli" ? "Asli" : k === "bulat" ? "⭕ Bulat" : k}</button>`).join("")}</div>
          <div class="ksc-zoom">➖<input type="range" min="0" max="100" value="0" aria-label="Zoom">➕</div>
          <div class="ksc-act"><button class="ksc-b1" data-a="batal" type="button">Batal</button><button class="ksc-b1" data-a="lewati" type="button">Tanpa potong</button><button class="ksc-b2" data-a="ok" type="button">✅ Pakai foto</button></div></div>`;
      document.body.appendChild(el); pas(el);
      const stage = el.querySelector(".ksc-st"), cv = stage.querySelector("canvas"), g = cv.getContext("2d"), zoom = el.querySelector("input[type=range]");
      const kv = () => { const r = stage.getBoundingClientRect(); return r.width ? stage.offsetWidth / r.width : 1; };
      let W = 0, H = 0, dpr = 1, F = {x:0, y:0, w:0, h:0}, s = 1, sMin = 1, ox = 0, oy = 0;
      const rasio = () => mode === "asli" ? src.width / src.height : RASIO[mode];
      function ukur(){
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = stage.offsetWidth; H = stage.offsetHeight; cv.width = W * dpr; cv.height = H * dpr;
      }
      function bingkai(){
        const m = 22, a = rasio(); let fw = W - m * 2, fh = fw / a;
        if(fh > H - m * 2){ fh = H - m * 2; fw = fh * a; }
        F = {x:(W - fw) / 2, y:(H - fh) / 2, w:fw, h:fh};
        sMin = Math.max(F.w / src.width, F.h / src.height);
        s = sMin; ox = F.x + (F.w - src.width * s) / 2; oy = F.y + (F.h - src.height * s) / 2; zoom.value = 0; jepit(); gambar();
      }
      function jepit(){
        s = Math.max(sMin, Math.min(sMin * 6, s));
        ox = Math.min(F.x, Math.max(F.x + F.w - src.width * s, ox));
        oy = Math.min(F.y, Math.max(F.y + F.h - src.height * s, oy));
      }
      function gambar(){
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
        g.drawImage(src, ox, oy, src.width * s, src.height * s);
        g.save(); g.fillStyle = "rgba(0,0,0,.6)"; g.beginPath(); g.rect(0, 0, W, H);
        if(mode === "bulat") g.ellipse(F.x + F.w / 2, F.y + F.h / 2, F.w / 2, F.h / 2, 0, 0, Math.PI * 2, true);
        else { g.moveTo(F.x, F.y); g.lineTo(F.x, F.y + F.h); g.lineTo(F.x + F.w, F.y + F.h); g.lineTo(F.x + F.w, F.y); g.closePath(); }
        g.fill("evenodd"); g.restore();
        g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 2;
        if(mode === "bulat"){ g.beginPath(); g.ellipse(F.x + F.w / 2, F.y + F.h / 2, F.w / 2, F.h / 2, 0, 0, Math.PI * 2); g.stroke(); }
        else { g.strokeRect(F.x, F.y, F.w, F.h); g.strokeStyle = "rgba(255,255,255,.3)"; g.lineWidth = 1; g.beginPath();
          for(let i = 1; i < 3; i++){ g.moveTo(F.x + F.w * i / 3, F.y); g.lineTo(F.x + F.w * i / 3, F.y + F.h); g.moveTo(F.x, F.y + F.h * i / 3); g.lineTo(F.x + F.w, F.y + F.h * i / 3); } g.stroke(); }
      }
      function zoomKe(ns, cx, cy){ const ix = (cx - ox) / s, iy = (cy - oy) / s; s = ns; ox = cx - ix * s; oy = cy - iy * s; jepit(); zoom.value = Math.round((s / sMin - 1) / 5 * 100); gambar(); }
      ukur(); bingkai();
      const onRes = () => { pas(el); ukur(); bingkai(); }; window.addEventListener("resize", onRes);
      const onVV = () => pas(el); if(window.visualViewport){ visualViewport.addEventListener("resize", onVV); visualViewport.addEventListener("scroll", onVV); }
      // geser & cubit
      const P = new Map(); let jarak0 = 0, s0 = 1;
      stage.addEventListener("pointerdown", e => { stage.setPointerCapture(e.pointerId); P.set(e.pointerId, {x:e.clientX, y:e.clientY});
        if(P.size === 2){ const [a, b] = [...P.values()]; jarak0 = Math.hypot(a.x - b.x, a.y - b.y); s0 = s; } });
      stage.addEventListener("pointermove", e => { if(!P.has(e.pointerId)) return; const p = P.get(e.pointerId), c = kv(), dx = (e.clientX - p.x) * c, dy = (e.clientY - p.y) * c;
        p.x = e.clientX; p.y = e.clientY;
        if(P.size === 1){ ox += dx; oy += dy; jepit(); gambar(); }
        else if(P.size === 2){ const [a, b] = [...P.values()], r = stage.getBoundingClientRect(), c = kv(); zoomKe(s0 * Math.hypot(a.x - b.x, a.y - b.y) / (jarak0 || 1), ((a.x + b.x) / 2 - r.left) * c, ((a.y + b.y) / 2 - r.top) * c); } });
      const lepas = e => { P.delete(e.pointerId); if(P.size === 1){ jarak0 = 0; } };
      stage.addEventListener("pointerup", lepas); stage.addEventListener("pointercancel", lepas);
      stage.addEventListener("wheel", e => { e.preventDefault(); const r = stage.getBoundingClientRect(); const c = kv(); zoomKe(s * (e.deltaY < 0 ? 1.1 : 1 / 1.1), (e.clientX - r.left) * c, (e.clientY - r.top) * c); }, {passive:false});
      zoom.oninput = () => zoomKe(sMin * (1 + zoom.value / 100 * 5), F.x + F.w / 2, F.y + F.h / 2);
      el.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { mode = b.dataset.r; el.querySelectorAll("[data-r]").forEach(x => x.classList.toggle("on", x === b)); bingkai(); });
      const tutup = hasil => { window.removeEventListener("resize", onRes); if(window.visualViewport){ visualViewport.removeEventListener("resize", onVV); visualViewport.removeEventListener("scroll", onVV); } el.remove(); selesai(hasil); };
      el.querySelector('[data-a="putar"]').onclick = () => { putar = (putar + 1) % 4; src = sumber(im, putar); bingkai(); };
      el.querySelector('[data-a="batal"]').onclick = () => tutup(null);
      el.querySelector('[data-a="lewati"]').onclick = () => tutup(file);
      el.querySelector('[data-a="ok"]').onclick = () => {
        const sx = (F.x - ox) / s, sy = (F.y - oy) / s, sw = F.w / s, sh = F.h / s;
        const k = Math.min(1, (opsi.maks || MAKS) / Math.max(sw, sh)), c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(sw * k)); c.height = Math.max(1, Math.round(sh * k));
        const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);
        c.toBlob(b => { if(!b) return tutup(file); const nama = String(file.name || "foto").replace(/\.[^.]+$/, "") + "-crop.jpg";
          let f; try{ f = new File([b], nama, {type:"image/jpeg", lastModified:Date.now()}); }catch(e){ f = b; f.name = nama; } tutup(f); }, "image/jpeg", .9);
      };
    });
  }
  function esc(t){ return String(t).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

  // ===== otomatis untuk semua <input type="file"> foto =====
  let bisaGanti = true; try{ new DataTransfer(); }catch(e){ bisaGanti = false; }
  document.addEventListener("change", async e => {
    const inp = e.target;
    if(!bisaGanti || !inp || inp.tagName !== "INPUT" || inp.type !== "file") return;
    if(inp.__ksCrop){ inp.__ksCrop = false; return; }                         // event ulang dari kita sendiri
    const mode = (inp.dataset.crop || "").toLowerCase();
    if(mode === "off") return;
    const files = [...(inp.files || [])];
    if(!files.length || !files.every(f => /^image\//.test(f.type) && !/gif|svg/.test(f.type))) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const dt = new DataTransfer();
    for(let i = 0; i < files.length; i++){
      const hasil = await potong(files[i], {rasio:mode || "1:1", kunci:mode === "bulat", judul:files.length > 1 ? `Foto ${i + 1} dari ${files.length} • geser & cubit untuk mengatur` : ""});
      if(hasil) dt.items.add(hasil);
    }
    if(!dt.files.length){ inp.value = ""; return; }                            // semua dibatalkan
    inp.files = dt.files; inp.__ksCrop = true;
    inp.dispatchEvent(new Event("change", {bubbles:true}));
  }, true);

  window.KSCrop = {potong};
})();
