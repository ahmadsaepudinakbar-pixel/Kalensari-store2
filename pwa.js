/* Kalensari Store - pendaftaran PWA + tombol "Pasang Aplikasi" */
(function(){
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("sw.js").catch(function(e){ console.warn("SW gagal:", e); });
    });
  }
  var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (standalone) return;
  var deferred = null, btn = null;
  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault(); deferred = e;
    if (sessionStorage.getItem("ks_install_dismissed")) return;
    btn = document.createElement("div");
    btn.style.cssText = "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;display:flex;gap:6px;align-items:center;background:#7b3f1d;color:#fff;border-radius:999px;padding:6px 6px 6px 16px;box-shadow:0 4px 14px rgba(0,0,0,.3);font:600 14px Roboto,system-ui,sans-serif";
    btn.innerHTML = '<span>📲 Pasang aplikasi Kalensari</span><button type="button" id="ksInstallGo" style="border:0;background:#228b4e;color:#fff;font:inherit;border-radius:999px;padding:8px 14px;cursor:pointer">Pasang</button><button type="button" id="ksInstallX" aria-label="Tutup" style="border:0;background:transparent;color:#fff;font:inherit;padding:8px 10px;cursor:pointer">✕</button>';
    document.body.appendChild(btn);
    document.getElementById("ksInstallGo").onclick = function(){
      btn.remove(); deferred.prompt(); deferred.userChoice.finally(function(){ deferred = null; });
    };
    document.getElementById("ksInstallX").onclick = function(){
      btn.remove(); sessionStorage.setItem("ks_install_dismissed","1");
    };
  });
  window.addEventListener("appinstalled", function(){ if (btn) btn.remove(); });
})();
