/* =====================================================================
   KALENSARI STORE • Kuis Pintar di halaman toko
   1) Menambah "🎓 Kuis Pintar" di menu ☰ dan tombol di bawah daftar produk
   2) Popup pengumuman pemenang (sekali per pengumuman per HP)
   Pasang di index.html SETELAH script.js:  <script src="kuis-pemenang.js"></script>
   ===================================================================== */
(function () {
  const C = window.CLOUD_CONFIG || {};
  const BASE = String(C.supabaseUrl || "").replace(/\/$/, "");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rp = n => "Rp" + Number(n || 0).toLocaleString("id-ID");
  const BLN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const nmB = b => { const [y, m] = String(b || "").split("-"); return m ? BLN[+m - 1] + " " + y : ""; };

  const st = document.createElement("style");
  st.textContent = `
.kp-tombol{display:flex;align-items:center;gap:12px;margin:14px 0 4px;padding:6px 14px 6px 6px;border-radius:20px;text-decoration:none;color:#fff;background:linear-gradient(135deg,#753e20,#5b2e14);box-shadow:0 10px 24px -12px #5b2e14}
.kp-tombol .e{font-size:30px}.kp-tombol .lg{flex:none;width:96px;height:auto;aspect-ratio:194/174;border-radius:16px;display:block}
.kp-tombol span{min-width:0}.kp-tombol b{display:block;font-size:16px;line-height:1.25}.kp-tombol small{display:block;opacity:.9;font-size:12px;line-height:1.4;margin-top:2px}
.kp-tombol i{margin-left:auto;font-style:normal;background:#f2b231;color:#4a2510;font-weight:900;border-radius:999px;padding:8px 14px;font-size:14px;white-space:nowrap;box-shadow:0 3px 0 #c88a12}
@media(max-width:380px){.kp-tombol .lg{width:80px}.kp-tombol b{font-size:15px}.kp-tombol i{padding:7px 11px;font-size:13px}}
.kp-pop{position:fixed;inset:0;z-index:1500;background:#0009;display:flex;align-items:center;justify-content:center;padding:16px;animation:kpF .25s}
@keyframes kpF{from{opacity:0}}
.kp-box{background:#fffaf3;border-radius:24px;width:min(440px,100%);max-height:90vh;overflow:auto;position:relative;box-shadow:0 30px 60px #0006;animation:kpU .35s cubic-bezier(.2,1.4,.4,1)}
@keyframes kpU{from{transform:translateY(30px) scale(.95);opacity:0}}
.kp-head{background:linear-gradient(135deg,#8d4a25,#5b2e14);color:#fff;text-align:center;padding:22px 16px 18px;border-radius:24px 24px 0 0}
.kp-head .t{font-size:44px;line-height:1}.kp-head h3{margin:6px 0 2px;font-size:20px}.kp-head p{margin:0;opacity:.85;font-size:13px}
.kp-x{position:absolute;right:10px;top:8px;border:0;background:#ffffff26;color:#fff;width:34px;height:34px;border-radius:50%;font-size:20px;cursor:pointer}
.kp-body{padding:14px 16px 18px}
.kp-body h4{margin:8px 0 6px;font-size:14px;color:#7a3e20}
.kp-li{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #ecdccb;border-radius:14px;padding:9px 11px;margin-bottom:6px}
.kp-li .m{font-size:24px;width:30px;text-align:center}.kp-li b{display:block;font-size:14px}.kp-li small{color:#7b6556;font-size:12px}.kp-li em{margin-left:auto;font-style:normal;font-weight:800;color:#2f8a4c;font-size:13px;white-space:nowrap}
.kp-cta{display:block;text-align:center;margin-top:12px;background:#f2b231;color:#4a2510;font-weight:900;border-radius:14px;padding:12px;text-decoration:none;box-shadow:0 4px 0 #c88a12}
.kp-note{font-size:11px;color:#7b6556;text-align:center;margin-top:8px}`;
  document.head.appendChild(st);

  // 1) menu ☰ (dibuat oleh script.js)
  function pasangMenu() {
    const m = document.querySelector(".ks-menu");
    if (!m) return false;
    if (!m.querySelector('a[href="kuis.html"]')) {
      const a = document.createElement("a");
      a.setAttribute("role", "menuitem"); a.href = "kuis.html";
      a.style.cssText = "background:#fff4dc;color:#5b2e1a;margin-bottom:4px";
      a.innerHTML = '🎓 Kuis Pintar <span style="margin-left:auto;background:#f2b231;color:#4a2510;font-size:11px;font-weight:800;padding:2px 7px;border-radius:8px">Gratis</span>';
      m.insertBefore(a, m.firstChild);
    }
    return true;
  }
  if (!pasangMenu()) { let n = 0; const t = setInterval(() => { if (pasangMenu() || ++n > 40) clearInterval(t); }, 250); }

  // tombol di bawah daftar produk (di atas tombol Lapak Barter bila ada)
  function pasangTombol() {
    if (document.getElementById("kpTombol")) return;
    const ref = document.getElementById("lapakCard") || document.querySelector(".wa-banner") || document.querySelector("footer");
    if (!ref) return;
    const sec = document.createElement("section"); sec.className = "container"; sec.id = "kpTombol";
    sec.innerHTML = '<a class="kp-tombol" href="kuis.html"><img class="lg" src="img/kuis-logo.webp" alt="" width="194" height="174" loading="lazy"><span><b>Kuis Pintar Kalensari</b><small>Belajar gratis SD • SMP • SMA, kumpulkan poin, menangkan voucher!</small></span><i>Main ›</i></a>';
    ref.parentNode.insertBefore(sec, ref);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pasangTombol); else pasangTombol();

  // 2) popup pemenang
  if (!C.enabled || !BASE) return;
  const KUNCI = "ks_kuis_pemenang_dilihat";
  setTimeout(async () => {
    try {
      const r = await fetch(BASE + "/rest/v1/rpc/kuis_pemenang_terbit", { method: "POST", headers: { apikey: C.supabaseAnonKey, Authorization: "Bearer " + C.supabaseAnonKey, "Content-Type": "application/json" }, body: "{}" });
      if (!r.ok) return;
      const p = await r.json();
      if (!p || !p.bulan || (!(p.juara || []).length && !(p.undian || []).length)) return;
      const tanda = p.bulan + ":" + p.id;
      let lihat = ""; try { lihat = localStorage.getItem(KUNCI) || ""; } catch (e) {}
      if (lihat === tanda) return;
      // jangan menumpuk dengan popup lain yang sedang terbuka
      if (document.querySelector(".modal.show")) return;
      tampil(p, tanda);
    } catch (e) {}
  }, 2500);

  function tampil(p, tanda) {
    const med = ["🥇", "🥈", "🥉"];
    const j = (p.juara || []).map(x => `<div class="kp-li"><span class="m">${med[x.peringkat - 1] || x.peringkat}</span><span><b>${esc(x.nama)}</b><small>${esc(x.wa)} • ${x.benar} jawaban benar</small></span><em>${rp(x.hadiah)}</em></div>`).join("");
    const u = (p.undian || []).map(x => `<div class="kp-li"><span class="m">🎟️</span><span><b>${esc(x.nama)}</b><small>${esc(x.wa)} • Kupon ${esc(x.kupon)}</small></span><em>${rp(x.hadiah)}</em></div>`).join("");
    const el = document.createElement("div"); el.className = "kp-pop"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    el.innerHTML = `<div class="kp-box"><button class="kp-x" type="button" aria-label="Tutup">×</button>
      <div class="kp-head"><div class="t">🏆</div><h3>Pemenang Kuis Pintar</h3><p>${esc(nmB(p.bulan))} • Selamat kepada para pemenang!</p></div>
      <div class="kp-body">${j ? `<h4>Juara jawaban benar terbanyak</h4>${j}` : ""}${u ? `<h4>Pemenang undian kupon</h4>${u}` : ""}
      <a class="kp-cta" href="kuis.html">🎓 Ikut Kuis Pintar bulan ini</a>
      <div class="kp-note">Hadiah berupa saldo voucher belanja dan sudah masuk ke akun pemenang.</div></div></div>`;
    const tutup = () => { try { localStorage.setItem(KUNCI, tanda); } catch (e) {} el.remove(); };
    el.querySelector(".kp-x").onclick = tutup;
    el.addEventListener("click", e => { if (e.target === el) tutup(); });
    el.querySelector(".kp-cta").addEventListener("click", () => { try { localStorage.setItem(KUNCI, tanda); } catch (e) {} });
    document.body.appendChild(el);
  }
})();
