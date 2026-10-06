/* KALENSARI • Tombol pesanan untuk warga (KSPW)
   - "Batalkan pesanan": hanya selama status Menunggu (belum diterima toko) dan belum dibayar QRIS.
   - "Pesan lagi": isi pesanan lama dimasukkan ke keranjang (produk yang masih dijual).
   Pemakaian: html += KSPW.html(pesanan);  KSPW.pasang(kotak, daftarPesanan, renderUlang); */
window.KSPW = (function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cfg = () => window.CLOUD_CONFIG || {};
  async function cf(p, o = {}) {
    const c = cfg(); if (!c.enabled || !c.supabaseUrl) throw new Error("Database belum aktif");
    const r = await fetch(String(c.supabaseUrl).replace(/\/$/, "") + "/rest/v1/" + p, { ...o, headers: { apikey: c.supabaseAnonKey, Authorization: "Bearer " + c.supabaseAnonKey, "Content-Type": "application/json", ...(o.headers || {}) } });
    const t = await r.text(); if (!r.ok) throw new Error(t || r.status); return t ? JSON.parse(t) : [];
  }
  const st = o => !o.status || o.status === "baru" ? "menunggu" : o.status;
  const lokal = o => String(o.id || "").startsWith("local-");
  const lunas = o => o.pay_status === "lunas";
  const bisaBatal = o => st(o) === "menunggu" && !lokal(o) && !lunas(o);
  const items = o => { let it = o.items; if (typeof it === "string") { try { it = JSON.parse(it); } catch (e) { it = []; } } return Array.isArray(it) ? it : []; };
  function toast(t) { if (typeof window.showToast === "function") return window.showToast(t); if (typeof window.toast === "function") return window.toast(t); alert(t); }

  function css() {
    if (document.getElementById("kspwCss")) return;
    const s = document.createElement("style"); s.id = "kspwCss";
    s.textContent = `.kspw{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.kspw button{flex:1;min-width:130px;padding:10px 12px;border-radius:12px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;border:1.5px solid #7a3e20;background:#fff;color:#7a3e20}
.kspw .ulang{background:#7a3e20;color:#fff}.kspw .batal{border-color:#c0392b;color:#c0392b}.kspw-note{font-size:12.5px;color:#8a2116;background:#fdecea;border-radius:10px;padding:7px 10px;margin-top:8px}
.kspw-ov{position:fixed;inset:0;background:rgba(30,15,5,.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center}.kspw-card{background:#fff;width:min(460px,100%);border-radius:22px 22px 0 0;padding:20px 18px calc(18px + env(safe-area-inset-bottom,0px));color:#3a1f10}
@media(min-width:560px){.kspw-ov{align-items:center}.kspw-card{border-radius:22px}}.kspw-card h3{margin:0 0 4px}.kspw-card p{margin:0 0 12px;color:#7a6454;font-size:14px}
.kspw-al{display:flex;flex-direction:column;gap:6px}.kspw-al button{text-align:left;padding:11px 12px;border:1.5px solid #e6d8c8;border-radius:12px;background:#fff;font:inherit;cursor:pointer}.kspw-al button.on{border-color:#c0392b;background:#fdecea;font-weight:700}
.kspw-go{display:block;width:100%;margin-top:12px;padding:13px;border:0;border-radius:14px;background:#c0392b;color:#fff;font:inherit;font-weight:800;cursor:pointer}.kspw-go:disabled{opacity:.5}.kspw-x{display:block;width:100%;margin-top:8px;padding:10px;border:0;background:none;color:#7a6454;font:inherit;cursor:pointer}`;
    document.head.appendChild(s);
  }

  function html(o) {
    if (!o || !o.order_code) return "";
    css();
    const b = [];
    if (bisaBatal(o)) b.push(`<button type="button" class="batal" data-kspw-batal="${esc(o.order_code)}">✖ Batalkan pesanan</button>`);
    if (items(o).length && st(o) !== "menunggu") b.push(`<button type="button" class="ulang" data-kspw-ulang="${esc(o.order_code)}">🔁 Pesan lagi</button>`);
    let note = "";
    if (st(o) === "dibatalkan" && /^Dibatalkan pembeli/.test(o.gagal_alasan || "")) note = `<div class="kspw-note">${esc(o.gagal_alasan)}</div>`;
    else if (st(o) === "menunggu" && lunas(o)) note = `<div class="kspw-note" style="background:#f7f1ea;color:#5b4636">Sudah dibayar QRIS. Untuk membatalkan, hubungi admin.</div>`;
    return note + (b.length ? `<div class="kspw">${b.join("")}</div>` : "");
  }

  const ALASAN = ["Salah pilih produk / jumlah", "Ingin ganti alamat", "Berubah pikiran", "Terlalu lama menunggu", "Lainnya"];
  function batal(o, selesai) {
    css();
    let al = "", sibuk = false;
    const ov = document.createElement("div"); ov.className = "kspw-ov";
    ov.innerHTML = `<div class="kspw-card"><h3>Batalkan ${esc(o.order_code)}?</h3><p>Pesanan bisa dibatalkan selama toko belum menerimanya. Pilih alasannya:</p>
      <div class="kspw-al">${ALASAN.map(a => `<button type="button">${esc(a)}</button>`).join("")}</div>
      <button type="button" class="kspw-go" disabled>Ya, batalkan pesanan</button><button type="button" class="kspw-x">Tidak jadi</button></div>`;
    document.body.appendChild(ov);
    const q = s => ov.querySelector(s);
    ov.addEventListener("click", e => { if (e.target === ov) ov.remove(); });
    q(".kspw-x").onclick = () => ov.remove();
    ov.querySelectorAll(".kspw-al button").forEach(b => b.onclick = () => { al = b.textContent; ov.querySelectorAll(".kspw-al button").forEach(x => x.classList.toggle("on", x === b)); q(".kspw-go").disabled = false; });
    q(".kspw-go").onclick = async () => {
      if (sibuk || !al) return; sibuk = true; q(".kspw-go").textContent = "Membatalkan…";
      try {
        const now = new Date().toISOString();
        const lama = async () => { const r = await cf("orders?order_code=eq." + encodeURIComponent(o.order_code) + "&and=(or(status.is.null,status.in.(baru,menunggu)),or(pay_status.is.null,pay_status.neq.lunas))", { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "dibatalkan", gagal_alasan: "Dibatalkan pembeli: " + al, updated_at: now }) })
          .catch(async e => { if (/gagal_alasan/.test(String(e.message))) return cf("orders?order_code=eq." + encodeURIComponent(o.order_code) + "&and=(or(status.is.null,status.in.(baru,menunggu)),or(pay_status.is.null,pay_status.neq.lunas))", { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "dibatalkan", updated_at: now }) }); throw e; });
          if (!Array.isArray(r) || !r.length) throw new Error("tidak-bisa"); };
        let r = [1];
        try { const h = window.KSPesanan ? await KSPesanan.aksi("tamu", o.order_code, "batal_pembeli", { alasan: al }, lama) : (await lama(), { jumlah: 1 }); if (!h.jumlah) r = []; }
        catch (e) { if (e.message !== "tidak-bisa") throw e; r = []; }
        ov.remove();
        if (!Array.isArray(r) || !r.length) { toast("Pesanan tidak bisa dibatalkan: toko sudah menerimanya atau sudah dibayar."); }
        else { Object.assign(o, { status: "dibatalkan", gagal_alasan: "Dibatalkan pembeli: " + al, updated_at: now }); toast("Pesanan " + o.order_code + " dibatalkan"); }
        try { const L = JSON.parse(localStorage.getItem("kalensari_orders") || "[]"); localStorage.setItem("kalensari_orders", JSON.stringify(L.map(x => x.order_code === o.order_code ? { ...x, status: o.status, gagal_alasan: o.gagal_alasan } : x))); } catch (e) { }
        if (typeof selesai === "function") selesai();
      } catch (e) { sibuk = false; q(".kspw-go").textContent = "Ya, batalkan pesanan"; toast("Gagal membatalkan. Cek internet lalu coba lagi."); }
    };
  }

  // Pesan lagi: [{id, qty, seller}] → keranjang. Produk racik (topping) perlu dipilih ulang di toko.
  function pesanLagi(o) {
    const it = items(o), racik = it.filter(x => x.toppings), list = it.filter(x => !x.toppings && x.id != null).map(x => ({ id: Number(x.id), qty: Number(x.qty) || 1, seller: String(x.seller || "").split(",")[0].trim(), ...(x.varian ? { v: x.varian } : {}) }));
    if (!list.length && racik.length) { toast("Produk racik/topping perlu dipilih ulang di toko"); }
    if (typeof window.ksPesanLagi === "function") return window.ksPesanLagi(list, racik.map(x => String(x.name || "").split(" (")[0]));
    try {
      const cart = JSON.parse(localStorage.getItem("kalensari_cart") || "[]");
      list.forEach(x => { const v = x.v; delete x.v; const c = cart.find(y => y.id === x.id && (y.seller || "") === x.seller && (v ? (y.custom && y.custom.v === v && !y.custom.t) : !y.custom)); if (c) { c.qty += x.qty; delete c.off; } else cart.push(v ? { ...x, custom: { v } } : x); });
      localStorage.setItem("kalensari_cart", JSON.stringify(cart));
      if (racik.length) sessionStorage.setItem("kalensari_racik_ulang", JSON.stringify(racik.map(x => String(x.name || "").split(" (")[0])));
    } catch (e) { }
    location.href = "index.html#keranjang";
  }

  function pasang(box, rows, renderUlang) {
    if (!box) return; box._kspwRows = rows; box._kspwRender = renderUlang;
    if (box._kspw) return; box._kspw = true;
    box.addEventListener("click", e => {
      const b = e.target.closest("[data-kspw-batal],[data-kspw-ulang]"); if (!b) return;
      e.preventDefault();
      const code = b.dataset.kspwBatal || b.dataset.kspwUlang, o = (box._kspwRows || []).find(x => x.order_code === code); if (!o) return;
      if (b.dataset.kspwBatal) batal(o, () => box._kspwRender && box._kspwRender()); else pesanLagi(o);
    });
  }
  return { html, pasang, bisaBatal };
})();
