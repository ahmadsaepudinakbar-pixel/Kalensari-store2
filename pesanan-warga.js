/* KALENSARI • Tombol pesanan untuk warga (KSPW)
   - "Batalkan pesanan": selama status Menunggu (belum diterima toko). Bila sudah dibayar, uang nota itu kembali sebagai saldo voucher.
   - Banner multi toko: ringkasan nota per checkout (toko yang diproses, yang masih menunggu, yang batal + voucher).
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
  const bisaBatal = o => st(o) === "menunggu" && !lokal(o) && o.pay_status !== "verifikasi";
  const rp = n => "Rp" + (Number(n) || 0).toLocaleString("id-ID");
  const uangKembali = o => lunas(o) ? (Number(o.total) || 0) + (Number(o.potong_saldo) || 0) : (Number(o.potong_saldo) || 0);
  const items = o => { let it = o.items; if (typeof it === "string") { try { it = JSON.parse(it); } catch (e) { it = []; } } return Array.isArray(it) ? it : []; };
  function toast(t) { if (typeof window.showToast === "function") return window.showToast(t); if (typeof window.toast === "function") return window.toast(t); alert(t); }


  // ===== Ringkasan multi toko: 1 checkout ke banyak toko = beberapa nota yang berdiri sendiri =====
  const tokoNama = o => String((items(o)[0] || {}).seller || "Toko").split(",")[0].trim() || "Toko";
  const sisaMenit = o => { const t = Date.parse(o.paid_at || o.created_at || ""); return isNaN(t) ? null : Math.max(0, Math.ceil((t + 15 * 60000 - Date.now()) / 60000)); };
  const mulaiHitung = o => !(/^qris/i.test(String(o.payment || "")) && !lunas(o)) && o.pay_status !== "tunggu_wa";
  function grupRingkas(rows) {
    const m = new Map();
    (rows || []).forEach(o => { if (o && o.grup) { if (!m.has(o.grup)) m.set(o.grup, []); m.get(o.grup).push(o); } });
    const out = [];
    m.forEach((list, grup) => {
      if (list.length < 2) return;
      const s = x => st(x);
      const ok = list.filter(o => ["diproses", "dikirim", "selesai"].includes(s(o)));
      const tunggu = list.filter(o => s(o) === "menunggu");
      const batal = list.filter(o => s(o) === "dibatalkan");
      if (!list.some(o => ["menunggu", "diproses", "dikirim"].includes(s(o)))) return;   // sudah beres semua
      const kembali = batal.reduce((t, o) => t + uangKembali(o), 0);
      out.push({ grup, ok, tunggu, batal, kembali });
    });
    return out;
  }
  function grupHtml(rows) {
    css();
    return grupRingkas(rows).map(g => {
      const nm = l => l.map(tokoNama).filter((v, i, a) => a.indexOf(v) === i).join(", ");
      const baris = [];
      if (g.ok.length) baris.push(`✅ <b>${esc(nm(g.ok))}</b> sudah menerima dan ${g.tunggu.length ? "pesanannya langsung diproses" : "sedang disiapkan / dikirim ke Anda"}.`);
      if (g.tunggu.length) {
        const w = g.tunggu.filter(mulaiHitung).map(sisaMenit).filter(x => x !== null), sisa = w.length ? Math.min(...w) : null;
        baris.push(`⏳ <b>${esc(nm(g.tunggu))}</b> masih menunggu${sisa !== null ? ` (maks. ${sisa} menit lagi, lalu otomatis batal)` : ""}. Nota ini bisa Anda batalkan sendiri; toko lain tidak ikut batal.`);
      }
      if (g.batal.length) baris.push(`✖️ <b>${esc(nm(g.batal))}</b> dibatalkan.${g.kembali > 0 ? ` Harga produk + ongkir toko tersebut, <b>${rp(g.kembali)}</b>, dikembalikan sebagai <b>saldo voucher belanja</b> (cek Akun → Saldo voucher).` : ""}`);
      return `<div class="kspw-grup" data-kspw-grup="${esc(g.grup)}"><b>🧾 Pesanan dari ${g.ok.length + g.tunggu.length + g.batal.length} toko</b>${baris.map(x => `<p>${x}</p>`).join("")}</div>`;
    }).join("");
  }
  // Pasang banner di atas daftar + beri 1x pemberitahuan saat semua toko sudah menjawab dan ada yang batal
  function grupPasang(box, rows) {
    if (!box) return;
    box.querySelectorAll(".kspw-grup").forEach(x => x.remove());
    const h = grupHtml(rows); if (h) box.insertAdjacentHTML("afterbegin", h);
    grupRingkas(rows).forEach(g => {
      if (g.tunggu.length || !g.ok.length || !g.batal.length) return;
      const k = "ks_mt_info_" + g.grup;
      try { if (localStorage.getItem(k)) return; localStorage.setItem(k, "1"); } catch (e) { return; }
      toast("🛵 Pesanan Anda diproses dari toko yang menerima." + (g.kembali > 0 ? " Uang toko yang batal (" + rp(g.kembali) + ") kembali sebagai saldo voucher." : ""));
    });
  }

  function css() {
    if (document.getElementById("kspwCss")) return;
    const s = document.createElement("style"); s.id = "kspwCss";
    s.textContent = `.kspw{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.kspw button{flex:1;min-width:130px;padding:10px 12px;border-radius:12px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;border:1.5px solid #7a3e20;background:#fff;color:#7a3e20}
.kspw .ulang{background:#7a3e20;color:#fff}.kspw .batal{border-color:#c0392b;color:#c0392b}.kspw-note{font-size:12.5px;color:#8a2116;background:#fdecea;border-radius:10px;padding:7px 10px;margin-top:8px}
.kspw-ov{position:fixed;inset:0;background:rgba(30,15,5,.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center}.kspw-card{background:#fff;width:min(460px,100%);border-radius:22px 22px 0 0;padding:20px 18px calc(18px + env(safe-area-inset-bottom,0px));color:#3a1f10}
@media(min-width:560px){.kspw-ov{align-items:center}.kspw-card{border-radius:22px}}.kspw-card h3{margin:0 0 4px}.kspw-card p{margin:0 0 12px;color:#7a6454;font-size:14px}
.kspw-al{display:flex;flex-direction:column;gap:6px}.kspw-al button{text-align:left;padding:11px 12px;border:1.5px solid #e6d8c8;border-radius:12px;background:#fff;font:inherit;cursor:pointer}.kspw-al button.on{border-color:#c0392b;background:#fdecea;font-weight:700}
.kspw-go{display:block;width:100%;margin-top:12px;padding:13px;border:0;border-radius:14px;background:#c0392b;color:#fff;font:inherit;font-weight:800;cursor:pointer}.kspw-grup{background:#fff8ec;border:1.5px solid #f0d9b0;border-radius:14px;padding:10px 12px;margin:0 0 12px;color:#4a2b17;font-size:13.5px}.kspw-grup p{margin:6px 0 0}.kspw-go:disabled{opacity:.5}.kspw-x{display:block;width:100%;margin-top:8px;padding:10px;border:0;background:none;color:#7a6454;font:inherit;cursor:pointer}`;
    document.head.appendChild(s);
  }

  function html(o) {
    if (!o || !o.order_code) return "";
    css();
    const b = [];
    if (bisaBatal(o)) b.push(`<button type="button" class="batal" data-kspw-batal="${esc(o.order_code)}">${lunas(o) ? "✖ Batalkan • uang jadi voucher" : "✖ Batalkan pesanan"}</button>`);
    if (items(o).length && st(o) !== "menunggu") b.push(`<button type="button" class="ulang" data-kspw-ulang="${esc(o.order_code)}">🔁 Pesan lagi</button>`);
    let note = "";
    if (st(o) === "dibatalkan" && /^Dibatalkan pembeli/.test(o.gagal_alasan || "")) note = `<div class="kspw-note">${esc(o.gagal_alasan)}</div>`;
    else if (st(o) === "menunggu" && lunas(o)) note = `<div class="kspw-note" style="background:#f7f1ea;color:#5b4636">Sudah dibayar. Bisa dibatalkan selama toko belum menerima; ${rp(uangKembali(o))} (produk + ongkir) kembali sebagai saldo voucher.</div>`;
    else if (st(o) === "menunggu" && o.pay_status === "verifikasi") note = `<div class="kspw-note" style="background:#f7f1ea;color:#5b4636">Pembayaran sedang diperiksa admin, belum bisa dibatalkan.</div>`;
    return note + (b.length ? `<div class="kspw">${b.join("")}</div>` : "");
  }

  const ALASAN = ["Salah pilih produk / jumlah", "Ingin ganti alamat", "Berubah pikiran", "Terlalu lama menunggu", "Lainnya"];
  function batal(o, selesai) {
    css();
    let al = "", sibuk = false;
    const ov = document.createElement("div"); ov.className = "kspw-ov";
    ov.innerHTML = `<div class="kspw-card"><h3>Batalkan ${esc(o.order_code)}?</h3><p>Pesanan bisa dibatalkan selama toko belum menerimanya.${uangKembali(o) > 0 ? ` <b>${rp(uangKembali(o))}</b> (produk + ongkir nota ini) otomatis kembali sebagai <b>saldo voucher</b>.` : ""}${o.grup ? " Toko lain di pesanan yang sama tetap diproses." : ""} Pilih alasannya:</p>
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
        if (!Array.isArray(r) || !r.length) { toast("Pesanan tidak bisa dibatalkan: toko sudah menerimanya atau pembayaran sedang diperiksa."); }
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
  return { html, pasang, bisaBatal, grupHtml, grupPasang };
})();
