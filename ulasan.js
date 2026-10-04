/* KALENSARI • Ulasan pembeli untuk toko (KSUlasan)
   - Pembeli memberi bintang 1–5 + komentar setelah pesanan SELESAI (per toko di pesanan).
   - Ulasan TIDAK ditampilkan di Kalensari Store: hanya dibaca penjual (Aplikasi Penjual) dan admin.
   - Tabel Supabase: ulasan (lihat supabase-ulasan.sql).
   Pemakaian:  await KSUlasan.muat(daftarPesanan);  html += KSUlasan.html(pesanan);  KSUlasan.pasang(kotak, renderUlang); */
window.KSUlasan = (function () {
  const DATA = {}, ORD = {};
  let ADA = true;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cfg = () => window.CLOUD_CONFIG || {};
  async function cf(p, o = {}) {
    const c = cfg(); if (!c.enabled || !c.supabaseUrl) throw new Error("Database belum aktif");
    const r = await fetch(String(c.supabaseUrl).replace(/\/$/, "") + "/rest/v1/" + p, { ...o, headers: { apikey: c.supabaseAnonKey, Authorization: "Bearer " + c.supabaseAnonKey, "Content-Type": "application/json", ...(o.headers || {}) } });
    const t = await r.text(); if (!r.ok) { const e = new Error(t || r.status); e.status = r.status; throw e; } return t ? JSON.parse(t) : [];
  }
  const K = s => String(s || "").trim().toLowerCase();
  // daftar toko di sebuah pesanan: [[kunci, nama]]
  const tokoDari = o => [...new Map((o.items || []).map(x => String(x.seller || "").split(",")[0].trim()).filter(Boolean).map(n => [K(n), n])).entries()];
  const bisa = o => o && o.status === "selesai" && o.order_code && !String(o.id || "").startsWith("local-");
  const bintang = n => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);

  function css() {
    if (document.getElementById("ksuCss")) return;
    const st = document.createElement("style"); st.id = "ksuCss";
    st.textContent = `.ksu-btn{display:block;width:100%;margin-top:8px;padding:10px 12px;border-radius:12px;border:1.5px dashed #e0a106;background:#fffaf0;color:#7a4b00;font:inherit;font-weight:700;cursor:pointer;text-align:left}
.ksu-done{margin-top:8px;padding:9px 12px;border-radius:12px;background:#f7f1ea;font-size:13px;color:#5b4636;line-height:1.45}.ksu-done .s{color:#e0a106;letter-spacing:1px}.ksu-bls{margin-top:6px;padding:7px 10px;border-left:3px solid #7a3e20;background:#fff;border-radius:8px}
.ksu-ov{position:fixed;inset:0;background:rgba(30,15,5,.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center}.ksu-card{background:#fff;width:min(480px,100%);border-radius:22px 22px 0 0;padding:20px 18px calc(18px + env(safe-area-inset-bottom,0px));font-family:inherit;color:#3a1f10;max-height:92vh;overflow:auto}
@media(min-width:560px){.ksu-ov{align-items:center}.ksu-card{border-radius:22px}}
.ksu-card h3{margin:0 0 2px;font-size:19px}.ksu-card p{margin:0 0 12px;color:#7a6454;font-size:13.5px}.ksu-st{display:flex;justify-content:center;gap:6px;margin:6px 0 2px}.ksu-st button{border:0;background:none;font-size:40px;line-height:1;cursor:pointer;color:#e3d6c8;padding:0 2px}.ksu-st button.on{color:#f2b01e}
.ksu-lbl{text-align:center;font-weight:700;min-height:22px;color:#7a4b00;margin-bottom:10px}.ksu-ch{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.ksu-ch button{border:1.5px solid #e6d8c8;background:#fff;border-radius:999px;padding:6px 11px;font:inherit;font-size:13px;cursor:pointer;color:#5b4636}.ksu-ch button.on{background:#fff3cd;border-color:#e0a106;color:#7a4b00;font-weight:700}
.ksu-card textarea{width:100%;box-sizing:border-box;min-height:84px;border:1.5px solid #e6d8c8;border-radius:12px;padding:10px;font:inherit;font-size:15px;resize:vertical}.ksu-info{font-size:12px;color:#7a6454;margin:8px 0 0}
.ksu-go{display:block;width:100%;margin-top:12px;padding:13px;border:0;border-radius:14px;background:#7a3e20;color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer}.ksu-go:disabled{opacity:.5}.ksu-x{display:block;width:100%;margin-top:8px;padding:11px;border:0;background:none;color:#7a6454;font:inherit;cursor:pointer}.ksu-err{color:#c0392b;font-size:13px;min-height:18px;margin-top:6px}`;
    document.head.appendChild(st);
  }

  // Ambil ulasan yang sudah ada untuk pesanan-pesanan ini. Mengembalikan true bila ada data baru.
  async function muat(rows) {
    (rows || []).forEach(o => { if (o && o.order_code) ORD[o.order_code] = o; });
    const codes = (rows || []).filter(bisa).map(o => o.order_code).filter(c => !(c in DATA));
    if (!codes.length || !ADA) return false;
    try {
      const r = await cf("ulasan?select=order_code,toko,bintang,isi,balasan,created_at&order_code=in.(" + codes.map(c => '"' + String(c).replace(/"/g, "") + '"').join(",") + ")");
      codes.forEach(c => DATA[c] = []); (r || []).forEach(x => (DATA[x.order_code] || (DATA[x.order_code] = [])).push(x));
      return true;
    } catch (e) { if (e.status === 404 || /ulasan/.test(String(e.message))) ADA = false; return false; }
  }

  function html(o) {
    if (!ADA || !bisa(o)) return "";
    const d = DATA[o.order_code]; if (!d) return "";
    css();
    return tokoDari(o).map(([k, n]) => {
      const u = d.find(x => x.toko === k);
      if (u) return `<div class="ksu-done"><span class="s">${bintang(u.bintang)}</span> Ulasan Anda untuk <b>${esc(n)}</b>${u.isi ? `<br>“${esc(u.isi)}”` : ""}${u.balasan ? `<div class="ksu-bls">💬 <b>Balasan ${esc(n)}:</b> ${esc(u.balasan)}</div>` : ""}</div>`;
      return `<button type="button" class="ksu-btn" data-ksu="${esc(o.order_code)}" data-ksut="${esc(k)}" data-ksun="${esc(n)}">⭐ Beri ulasan untuk ${esc(n)}</button>`;
    }).join("");
  }

  const LBL = ["", "Kecewa 😞", "Kurang 😕", "Cukup 🙂", "Bagus 😊", "Mantap sekali! 🤩"];
  const CH = ["Rasanya enak", "Porsi pas", "Harga sesuai", "Kemasan rapi", "Cepat disiapkan", "Kurang matang", "Pesanan kurang lengkap"];
  function buka(code, tk, nama, selesai) {
    css();
    const o = ORD[code] || {}; let n = 0, kirim = false; const pilih = new Set();
    const ov = document.createElement("div"); ov.className = "ksu-ov";
    ov.innerHTML = `<div class="ksu-card" role="dialog" aria-label="Beri ulasan"><h3>⭐ Ulasan untuk ${esc(nama)}</h3><p>Pesanan ${esc(code)}</p>
      <div class="ksu-st">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-n="${i}" aria-label="${i} bintang">★</button>`).join("")}</div><div class="ksu-lbl">Ketuk bintang</div>
      <div class="ksu-ch">${CH.map(c => `<button type="button">${esc(c)}</button>`).join("")}</div>
      <textarea maxlength="400" placeholder="Ceritakan pengalaman Anda (opsional)"></textarea>
      <div class="ksu-info">🔒 Ulasan hanya dibaca oleh penjual & admin, tidak ditampilkan di Kalensari Store.</div><div class="ksu-err"></div>
      <button type="button" class="ksu-go" disabled>Kirim ulasan</button><button type="button" class="ksu-x">Nanti saja</button></div>`;
    document.body.appendChild(ov);
    const $ = s => ov.querySelector(s), tutup = () => ov.remove();
    ov.addEventListener("click", e => { if (e.target === ov) tutup(); });
    $(".ksu-x").onclick = tutup;
    ov.querySelectorAll(".ksu-st button").forEach(b => b.onclick = () => { n = +b.dataset.n; ov.querySelectorAll(".ksu-st button").forEach(x => x.classList.toggle("on", +x.dataset.n <= n)); $(".ksu-lbl").textContent = LBL[n]; $(".ksu-go").disabled = false; });
    ov.querySelectorAll(".ksu-ch button").forEach(b => b.onclick = () => { const t = b.textContent; pilih.has(t) ? pilih.delete(t) : pilih.add(t); b.classList.toggle("on"); });
    $(".ksu-go").onclick = async () => {
      if (kirim || !n) return; kirim = true; $(".ksu-go").textContent = "Mengirim…"; $(".ksu-err").textContent = "";
      const isi = [[...pilih].join(", "), $("textarea").value.trim()].filter(Boolean).join(". ").slice(0, 500);
      const row = { order_code: code, toko: tk, toko_nama: nama, bintang: n, isi, nama: String(o.customer_name || "").slice(0, 60), wa: String(o.customer_phone_normalized || o.customer_phone || "").slice(0, 16) };
      try {
        await cf("ulasan", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(row) });
        (DATA[code] || (DATA[code] = [])).push({ ...row, created_at: new Date().toISOString() });
        tutup(); if (typeof selesai === "function") selesai(); toast("🙏 Terima kasih! Ulasan terkirim ke " + nama);
      } catch (e) {
        kirim = false; $(".ksu-go").textContent = "Kirim ulasan";
        const m = String(e.message || e);
        $(".ksu-err").textContent = e.status === 409 || /duplicate|unique/i.test(m) ? "Pesanan ini sudah pernah diulas." : /row-level|policy|violates/i.test(m) ? "Ulasan hanya bisa diberikan untuk pesanan yang sudah selesai." : e.status === 404 ? "Fitur ulasan belum aktif (tabel belum dibuat)." : "Gagal mengirim. Cek internet lalu coba lagi.";
        if (e.status === 409 || /duplicate|unique/i.test(m)) { delete DATA[code]; }
      }
    };
  }
  function toast(t) { if (typeof window.showToast === "function") return window.showToast(t); if (typeof window.toast === "function") return window.toast(t); }

  // Pasang klik "Beri ulasan" pada sebuah kotak daftar pesanan (cukup sekali per kotak).
  function pasang(box, renderUlang) {
    if (!box) return; box._ksuRender = renderUlang;
    if (box._ksu) return; box._ksu = true;
    box.addEventListener("click", e => { const b = e.target.closest("[data-ksu]"); if (!b) return; e.preventDefault(); buka(b.dataset.ksu, b.dataset.ksut, b.dataset.ksun, () => box._ksuRender && box._ksuRender()); });
  }
  return { muat, html, pasang, buka, bintang };
})();
