/* KALENSARI • Tip untuk kurir (KSTip)
   - Pembeli bisa memberi tip setelah pesanan SELESAI (1 tip per pesanan).
   - Uang tip diberikan pembeli langsung ke kurir (tunai / transfer lewat WhatsApp kurir);
     aplikasi hanya mencatat, lalu kurir menekan "Sudah diterima" di dashboardnya.
   - Tabel & fungsi Supabase: supabase-kurir-semangat.sql (kurir_tip, kurir_tip_beri).
   Pemakaian:  await KSTip.muat(daftarPesanan);  html += KSTip.html(pesanan);  KSTip.pasang(kotak, renderUlang); */
window.KSTip = (function () {
  const DATA = {}, ORD = {};
  let ADA = true;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rp = n => "Rp" + Number(n || 0).toLocaleString("id-ID");
  const cfg = () => window.CLOUD_CONFIG || {};
  async function cf(p, o = {}) {
    const c = cfg(); if (!c.enabled || !c.supabaseUrl) throw new Error("Database belum aktif");
    const r = await fetch(String(c.supabaseUrl).replace(/\/$/, "") + "/rest/v1/" + p, { ...o, headers: { apikey: c.supabaseAnonKey, Authorization: "Bearer " + c.supabaseAnonKey, "Content-Type": "application/json", ...(o.headers || {}) } });
    const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
    if (!r.ok) { const e = new Error(String((j && (j.message || j.hint)) || t || r.status)); e.status = r.status; throw e; }
    return j == null ? [] : j;
  }
  const bisa = o => o && o.status === "selesai" && o.order_code && !String(o.id || "").startsWith("local-");

  function css() {
    if (document.getElementById("kstCss")) return;
    const st = document.createElement("style"); st.id = "kstCss";
    st.textContent = `.kst-btn{display:block;width:100%;margin-top:8px;padding:10px 12px;border-radius:12px;border:1.5px dashed #2e9b57;background:#f1fbf4;color:#14502c;font:inherit;font-weight:700;cursor:pointer;text-align:left}
.kst-done{margin-top:8px;padding:9px 12px;border-radius:12px;background:#eaf7ee;font-size:13px;color:#14502c;line-height:1.45}
.kst-ov{position:fixed;inset:0;background:rgba(30,15,5,.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center}.kst-card{background:#fff;width:min(480px,100%);border-radius:22px 22px 0 0;padding:20px 18px calc(18px + env(safe-area-inset-bottom,0px));font-family:inherit;color:#3a1f10;max-height:92vh;overflow:auto}
@media(min-width:560px){.kst-ov{align-items:center}.kst-card{border-radius:22px}}
.kst-card h3{margin:0 0 2px;font-size:19px}.kst-card p{margin:0 0 12px;color:#7a6454;font-size:13.5px}.kst-ch{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}.kst-ch button{border:1.5px solid #e6d8c8;background:#fff;border-radius:999px;padding:9px 15px;font:inherit;font-size:15px;font-weight:700;cursor:pointer;color:#5b4636}.kst-ch button.on{background:#e3f6ea;border-color:#2e9b57;color:#14502c}
.kst-card input[type=number],.kst-card textarea{width:100%;box-sizing:border-box;border:1.5px solid #e6d8c8;border-radius:12px;padding:10px;font:inherit;font-size:15px;margin-bottom:8px}.kst-info{font-size:12.5px;color:#7a6454;margin:6px 0 0;line-height:1.45}
.kst-go{display:block;width:100%;margin-top:12px;padding:13px;border:0;border-radius:14px;background:#2e9b57;color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer}.kst-go:disabled{opacity:.5}.kst-x{display:block;width:100%;margin-top:8px;padding:11px;border:0;background:none;color:#7a6454;font:inherit;cursor:pointer}.kst-err{color:#c0392b;font-size:13px;min-height:18px;margin-top:6px}`;
    document.head.appendChild(st);
  }

  // Ambil tip yang sudah tercatat untuk pesanan-pesanan ini. Mengembalikan true bila ada data baru.
  async function muat(rows) {
    (rows || []).forEach(o => { if (o && o.order_code) ORD[o.order_code] = o; });
    const codes = (rows || []).filter(bisa).map(o => o.order_code).filter(c => !(c in DATA));
    if (!codes.length || !ADA) return false;
    try {
      const r = await cf("kurir_tip?select=order_code,jumlah,diterima&order_code=in.(" + codes.map(c => '"' + String(c).replace(/"/g, "") + '"').join(",") + ")");
      codes.forEach(c => DATA[c] = null); (r || []).forEach(x => DATA[x.order_code] = x);
      return true;
    } catch (e) { if (e.status === 404 || /kurir_tip/.test(String(e.message))) ADA = false; return false; }
  }

  function html(o) {
    if (!ADA || !bisa(o) || !(o.order_code in DATA)) return "";
    css();
    const d = DATA[o.order_code];
    if (d) return `<div class="kst-done">🎁 Tip ${rp(d.jumlah)} untuk kurir sudah Anda catat. Terima kasih!</div>`;
    if (!o.kurir_id && "kurir_id" in o) return ""; // pesanan tanpa data kurir
    return `<button type="button" class="kst-btn" data-kst="${esc(o.order_code)}">🎁 Beri tip untuk kurir${o.kurir_nama ? " (" + esc(o.kurir_nama) + ")" : ""}</button>`;
  }

  function buka(code, selesai) {
    css();
    const o = ORD[code] || {}; let jumlah = 5000, kirim = false;
    const ov = document.createElement("div"); ov.className = "kst-ov";
    ov.innerHTML = `<div class="kst-card" role="dialog" aria-label="Beri tip untuk kurir"><h3>🎁 Tip untuk kurir</h3><p>Pesanan ${esc(code)}${o.kurir_nama ? " • diantar " + esc(o.kurir_nama) : ""}</p>
      <div class="kst-ch">${[2000, 5000, 10000].map(n => `<button type="button" data-n="${n}" class="${n === 5000 ? "on" : ""}">${rp(n)}</button>`).join("")}<button type="button" data-n="x">Lainnya</button></div>
      <input type="number" inputmode="numeric" min="1000" max="100000" step="500" placeholder="Nominal lain (Rp1.000 – Rp100.000)" hidden>
      <textarea maxlength="140" rows="2" placeholder="Ucapan untuk kurir (opsional)"></textarea>
      <div class="kst-info">ℹ️ Tip <b>diberikan langsung ke kurir</b> (tunai, atau transfer lewat WhatsApp kurir). Aplikasi hanya mencatat tip Anda supaya kurir tahu dan semangat. Tidak ada uang yang dipotong dari akun Anda.</div>
      <div class="kst-err"></div><button type="button" class="kst-go">Catat tip ${rp(5000)}</button><button type="button" class="kst-x">Nanti saja</button></div>`;
    document.body.appendChild(ov);
    const $ = q => ov.querySelector(q), go = $(".kst-go"), inp = $("input"), err = $(".kst-err");
    const tutup = () => ov.remove();
    const set = n => { jumlah = n; go.textContent = "Catat tip " + (n >= 1000 ? rp(n) : ""); };
    ov.addEventListener("click", e => {
      if (e.target === ov) return tutup();
      const b = e.target.closest(".kst-ch button"); if (!b) return;
      ov.querySelectorAll(".kst-ch button").forEach(x => x.classList.toggle("on", x === b));
      if (b.dataset.n === "x") { inp.hidden = false; inp.focus(); set(Math.round(Number(inp.value)) || 0); }
      else { inp.hidden = true; set(Number(b.dataset.n)); }
    });
    inp.addEventListener("input", () => set(Math.round(Number(inp.value)) || 0));
    $(".kst-x").onclick = tutup;
    go.onclick = async () => {
      if (kirim) return; err.textContent = "";
      if (!(jumlah >= 1000 && jumlah <= 100000)) { err.textContent = "Tip minimal Rp1.000 dan maksimal Rp100.000."; return; }
      kirim = true; go.disabled = true; go.textContent = "Menyimpan…";
      try {
        await cf("rpc/kurir_tip_beri", { method: "POST", body: JSON.stringify({ p_kode: code, p_jumlah: jumlah, p_pesan: $("textarea").value.trim() }) });
        DATA[code] = { order_code: code, jumlah, diterima: false };
        const wa = String(o.kurir_wa || "").replace(/\D/g, "");
        const teks = encodeURIComponent(`Halo ${o.kurir_nama || "kak"}, terima kasih sudah mengantar pesanan ${code}. Ini tip dari saya ${rp(jumlah)} 🙏`);
        $(".kst-card").innerHTML = `<h3>Terima kasih! 🙏</h3><p>Tip ${rp(jumlah)} sudah tercatat. Silakan berikan langsung ke kurir${wa ? ", atau kirim lewat WhatsApp:" : "."}</p>
          ${wa ? `<a class="kst-go" style="text-align:center;text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/${esc(wa)}?text=${teks}">💬 Chat kurir di WhatsApp</a>` : ""}<button type="button" class="kst-x">Tutup</button>`;
        $(".kst-x").onclick = tutup;
        if (typeof selesai === "function") selesai();
      } catch (e) {
        kirim = false; go.disabled = false; set(jumlah);
        const m = String(e.message || "");
        err.textContent = /sudah pernah/i.test(m) ? "Tip untuk pesanan ini sudah pernah dicatat." : /Could not find|404|kurir_tip_beri/i.test(m) ? "Fitur tip belum aktif. Hubungi admin." : m.slice(0, 120) || "Gagal menyimpan. Coba lagi.";
        if (/sudah pernah/i.test(m)) delete DATA[code];
      }
    };
  }

  // Pasang klik "Beri tip" pada sebuah kotak daftar pesanan (cukup sekali per kotak).
  function pasang(box, renderUlang) {
    if (!box) return; box._kstRender = renderUlang;
    if (box._kst) return; box._kst = true;
    box.addEventListener("click", e => { const b = e.target.closest("[data-kst]"); if (!b) return; e.preventDefault(); buka(b.dataset.kst, () => box._kstRender && box._kstRender()); });
  }
  return { muat, html, pasang, buka };
})();
