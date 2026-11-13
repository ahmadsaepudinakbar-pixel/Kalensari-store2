package id.web.kalensari.game;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Menyajikan file game dari dalam APK supaya game cepat terbuka & hemat kuota.
 *
 * Alamat tetap https://kalensari.web.id/... (jadi akun, Main Bareng, link undangan tetap jalan),
 * tetapi isinya diambil dari:
 *  - gambar-game/, icons/ & kode     -> ikut di dalam APK
 *  - model-3d/ (model 3D, ±150 MB)  -> TIDAK ikut di APK; diunduh sekali (layar "Mengunduh data game")
 *                                      lalu disimpan di folder data aplikasi: files/kgdata/model-3d/
 *                                      kalau situs memakai ?v= baru, dicek ke situs (ETag) dan diunduh ulang bila berubah
 *  - file kode (.html .js .css .json) -> selalu coba versi terbaru dari internet; kalau offline pakai simpanan / isi APK
 *  - three.js (cdn.jsdelivr) & font Google -> unduh sekali lalu disimpan di HP
 */
public class PenyajiAset {

    public static final String HOST = "kalensari.web.id";
    private static final String AKAR = "web/";

    private final AssetManager am;
    private final File dirCache, dirData;
    private final String ua;
    private final Map<String, Set<String>> isiFolder = new ConcurrentHashMap<>();
    private volatile List<Object[]> daftarVersi;
    private final Set<String> sudahDicek = Collections.newSetFromMap(new ConcurrentHashMap<>());   // model tanpa ?v=: dicek sekali per buka aplikasi   // {Pattern path, String v}

    public PenyajiAset(Context ctx, String userAgent) {
        am = ctx.getAssets();
        dirCache = new File(ctx.getFilesDir(), "kgcache");
        //noinspection ResultOfMethodCallIgnored
        dirCache.mkdirs();
        dirData = new File(ctx.getFilesDir(), "kgdata");
        ua = userAgent;
    }

    /** Dipanggil dari thread latar WebView. null = biarkan WebView mengurus sendiri. */
    public WebResourceResponse layani(WebResourceRequest req) {
        try {
            if (!"GET".equalsIgnoreCase(req.getMethod())) return null;
            Uri u = req.getUrl();
            if (!"https".equals(u.getScheme())) return null;
            String host = u.getHost(), path = u.getPath();
            if (host == null) return null;
            if (path == null || path.isEmpty()) path = "/";

            if (HOST.equals(host)) return layaniSitus(u, path);

            // pustaka luar yang bernomor versi tetap -> aman disimpan selamanya
            if ("cdn.jsdelivr.net".equals(host) && path.matches("/npm/[^/]+@\\d[^/]*/.*"))
                return dariSimpananAtauInternet(u.toString(), "cdn:" + u, jenis(path));
            if ("fonts.gstatic.com".equals(host))
                return dariSimpananAtauInternet(u.toString(), "font:" + u, jenis(path));
            if ("fonts.googleapis.com".equals(host))
                return dariSimpananAtauInternet(u.toString(), "fontcss:" + u, "text/css");
            return null;
        } catch (Throwable t) {
            return null;
        }
    }

    private WebResourceResponse layaniSitus(Uri u, String path) throws IOException {
        String rel = path.substring(1);
        if (rel.isEmpty()) rel = "index.html";

        // service worker situs tidak dipakai di aplikasi (penyimpanan sudah diurus di sini)
        if (rel.equals("sw.js")) return swKosong();

        if (rel.startsWith("model-3d/") || rel.startsWith("gambar-game/") || rel.startsWith("icons/")) {
            for (String n : u.getQueryParameterNames()) if (!n.equals("v")) return null;   // mis. ?r=... = muat ulang paksa
            String v = u.getQueryParameter("v");
            String aset = AKAR + rel;
            if (adaAset(aset) && (v == null || versiCocok(rel, v))) return dariAset(aset, jenis(rel));
            if (rel.startsWith("model-3d/") && !rel.contains("..")) return dariData(u, rel, v, jenis(rel));
            return dariSimpananAtauInternet(u.toString(), "aset:" + rel + (v == null ? "" : "?v=" + v), jenis(rel));
        }

        if (fileKode(rel)) return kodeTerbaru(u, rel);
        return null;
    }

    // ---------- file kode: internet dulu, cadangan simpanan / APK ----------
    private static boolean fileKode(String rel) {
        return rel.endsWith(".html") || rel.endsWith(".js") || rel.endsWith(".css")
                || rel.endsWith(".json") || rel.endsWith(".webmanifest");
    }

    private WebResourceResponse kodeTerbaru(Uri u, String rel) throws IOException {
        String kunci = "kode:" + rel, m = jenis(rel);
        byte[] isi = unduhKecil(u.toString());
        if (isi != null) {
            simpan(kunci, isi);
            return jawab(m, new ByteArrayInputStream(isi), isi.length);
        }
        File f = berkas(kunci);
        if (f.isFile() && f.length() > 0) return jawab(m, new FileInputStream(f), f.length());
        String aset = AKAR + rel;
        if (adaAset(aset)) return dariAset(aset, m);
        return null;
    }

    private byte[] unduhKecil(String url) {
        HttpURLConnection c = null;
        try {
            c = buka(url, 5000, 12000);
            if (c.getResponseCode() != 200) return null;
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream bo = new ByteArrayOutputStream(64 * 1024);
                byte[] b = new byte[16 * 1024];
                int n;
                while ((n = in.read(b)) != -1) bo.write(b, 0, n);
                return bo.toByteArray();
            }
        } catch (IOException e) {
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }

    // ---------- simpanan di HP (unduh sekali) ----------
    private WebResourceResponse dariSimpananAtauInternet(String url, String kunci, String m) {
        File f = berkas(kunci);
        try {
            if (f.isFile() && f.length() > 0) return jawab(m, new FileInputStream(f), f.length());
            HttpURLConnection c = buka(url, 8000, 30000);
            if (c.getResponseCode() != 200) {
                c.disconnect();
                return null;
            }
            long n = c.getContentLengthLong();
            if (m == null) m = bersihkanJenis(c.getContentType());
            InputStream in = new SalinKeSimpanan(c, f, n);
            return jawab(m, in, n);
        } catch (IOException e) {
            return null;
        }
    }

    /** Mengalirkan unduhan ke WebView sambil menyimpannya; file baru dipakai kalau unduhan lengkap. */
    interface Selesai {
        void ok();
    }

    private static final class SalinKeSimpanan extends FilterInputStream {
        private final HttpURLConnection c;
        Selesai setelahLengkap;
        private final File tujuan, sementara;
        private final long harap;
        private OutputStream out;
        private long tertulis;
        private boolean selesai;

        SalinKeSimpanan(HttpURLConnection c, File tujuan, long harap) throws IOException {
            super(c.getInputStream());
            this.c = c;
            this.tujuan = tujuan;
            this.harap = harap;
            this.sementara = new File(tujuan.getPath() + "." + System.nanoTime() + ".tmp");
            try {
                out = new FileOutputStream(sementara);
            } catch (IOException e) {
                out = null;   // gagal menyimpan -> tetap tampilkan, hanya tidak disimpan
            }
        }

        @Override
        public int read() throws IOException {
            byte[] b = new byte[1];
            int n = read(b, 0, 1);
            return n == -1 ? -1 : (b[0] & 0xff);
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            int n = super.read(b, off, len);
            if (n == -1) {
                tutupBerkas(true);
            } else if (out != null) {
                try {
                    out.write(b, off, n);
                    tertulis += n;
                } catch (IOException e) {
                    tutupBerkas(false);
                }
            }
            return n;
        }

        private void tutupBerkas(boolean lengkap) {
            if (out == null) return;
            try {
                out.close();
            } catch (IOException ignored) {
            }
            out = null;
            if (lengkap && tertulis > 0 && (harap < 0 || tertulis == harap) && sementara.renameTo(tujuan)) {
                selesai = true;
                if (setelahLengkap != null) setelahLengkap.ok();
            } else {
                //noinspection ResultOfMethodCallIgnored
                sementara.delete();
            }
        }

        @Override
        public void close() throws IOException {
            try {
                super.close();
            } finally {
                if (!selesai) tutupBerkas(false);
                c.disconnect();
            }
        }
    }

    // ---------- data game (model 3D) di folder data aplikasi ----------
    private File berkasData(String rel) {
        return new File(dirData, rel);
    }

    private static File berkasInfo(File f) {
        return new File(f.getPath() + ".info");
    }

    /** {etag, versi ?v= terakhir} */
    private static String[] bacaInfo(File f) {
        String[] h = {"", ""};
        File i = berkasInfo(f);
        if (!i.isFile()) return h;
        try (InputStream in = new FileInputStream(i)) {
            byte[] b = new byte[(int) Math.min(i.length(), 4096)];
            int n = in.read(b);
            String[] p = new String(b, 0, Math.max(n, 0), StandardCharsets.UTF_8).split("\t", -1);
            if (p.length > 0) h[0] = p[0].trim();
            if (p.length > 1) h[1] = p[1].trim();
        } catch (IOException ignored) {
        }
        return h;
    }

    private static void tulisInfo(File f, String etag, String v) {
        try (FileOutputStream o = new FileOutputStream(berkasInfo(f))) {
            o.write(((etag == null ? "" : etag) + "\t" + (v == null ? "" : v)).getBytes(StandardCharsets.UTF_8));
        } catch (IOException ignored) {
        }
    }

    private static WebResourceResponse dariBerkas(String m, File f) throws IOException {
        return jawab(m, new FileInputStream(f), f.length());
    }

    private WebResourceResponse dariData(Uri u, String rel, String v, String m) {
        File f = berkasData(rel);
        HttpURLConnection c = null;
        try {
            if (f.isFile() && f.length() > 0) {
                String[] info = bacaInfo(f);
                if (v != null ? v.equals(info[1]) : !sudahDicek.add(rel)) return dariBerkas(m, f);
                // situs memakai versi ?v= lain (atau tanpa ?v=, sekali per buka) -> cek apakah file di situs berubah
                try {
                    c = buka(u.toString(), 5000, 30000);
                    if (!info[0].isEmpty()) c.setRequestProperty("If-None-Match", info[0]);
                    int kode = c.getResponseCode();
                    if (kode == 304) {
                        c.disconnect();
                        tulisInfo(f, info[0], v != null ? v : info[1]);
                        return dariBerkas(m, f);
                    }
                    if (kode == 200) return unduhData(c, f, v != null ? v : info[1], m);
                    c.disconnect();
                } catch (IOException e) {
                    if (c != null) c.disconnect();   // offline -> pakai yang tersimpan
                }
                return dariBerkas(m, f);
            }
            c = buka(u.toString(), 8000, 30000);
            if (c.getResponseCode() != 200) {
                c.disconnect();
                return null;
            }
            return unduhData(c, f, v, m);
        } catch (IOException e) {
            if (c != null) c.disconnect();
            return null;
        }
    }

    private WebResourceResponse unduhData(HttpURLConnection c, File f, String v, String m) throws IOException {
        //noinspection ResultOfMethodCallIgnored
        f.getParentFile().mkdirs();
        long n = c.getContentLengthLong();
        String etag = c.getHeaderField("ETag");
        SalinKeSimpanan in = new SalinKeSimpanan(c, f, n);
        in.setelahLengkap = () -> tulisInfo(f, etag, v);
        return jawab(m, in, n);
    }

    // ---------- unduh semua data game sekaligus (layar "Mengunduh data game") ----------
    public interface Kemajuan {
        void kabar(long selesai, long total, int fileKe, int jumlahFile);
    }

    /** Daftar model dari assets/web/_daftar-unduh.txt (dibuat otomatis saat Build): {path, ukuran} */
    public List<String[]> daftarUnduh() {
        List<String[]> d = new ArrayList<>();
        try (InputStream in = am.open(AKAR + "_daftar-unduh.txt")) {
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] b = new byte[8192];
            int n;
            while ((n = in.read(b)) != -1) bo.write(b, 0, n);
            for (String baris : new String(bo.toByteArray(), StandardCharsets.UTF_8).split("\n")) {
                String[] p = baris.trim().split("\t");
                if (p.length == 2 && p[0].startsWith("model-3d/") && !p[0].contains("..")) d.add(p);
            }
        } catch (IOException ignored) {
        }
        return d;
    }

    public boolean sudahAda(String rel) {
        File f = berkasData(rel);
        return f.isFile() && f.length() > 0;
    }

    public long ukuran(String[] e) {
        try {
            return Long.parseLong(e[1]);
        } catch (NumberFormatException x) {
            return 0;
        }
    }

    /** Byte yang belum terunduh. */
    public long sisa(List<String[]> d) {
        long s = 0;
        for (String[] e : d) if (!sudahAda(e[0])) s += ukuran(e);
        return s;
    }

    public long ruangKosong() {
        //noinspection ResultOfMethodCallIgnored
        dirData.mkdirs();
        return dirData.getUsableSpace();
    }

    /** Mengunduh semua file yang belum ada. Melempar IOException kalau internet putus (yang sudah selesai tetap tersimpan). */
    public void unduhSemua(List<String[]> d, Kemajuan k, java.util.concurrent.atomic.AtomicBoolean batal) throws IOException {
        long total = 0, selesai = 0;
        for (String[] e : d) {
            total += ukuran(e);
            if (sudahAda(e[0])) selesai += ukuran(e);
        }
        int ke = 0;
        long kabarT = 0;
        for (String[] e : d) {
            ke++;
            if (batal.get()) throw new IOException("dibatalkan");
            if (sudahAda(e[0])) continue;
            IOException gagal = null;
            for (int coba = 0; coba < 3; coba++) {
                long awal = selesai;
                File f = berkasData(e[0]), tmp = new File(f.getPath() + ".unduh");
                //noinspection ResultOfMethodCallIgnored
                f.getParentFile().mkdirs();
                HttpURLConnection c = null;
                try {
                    c = buka("https://" + HOST + "/" + e[0], 10000, 30000);
                    if (c.getResponseCode() != 200) throw new IOException("HTTP " + c.getResponseCode() + " " + e[0]);
                    String etag = c.getHeaderField("ETag");
                    try (InputStream in = c.getInputStream(); OutputStream o = new FileOutputStream(tmp)) {
                        byte[] b = new byte[64 * 1024];
                        int n;
                        while ((n = in.read(b)) != -1) {
                            if (batal.get()) throw new IOException("dibatalkan");
                            o.write(b, 0, n);
                            selesai += n;
                            long t = System.currentTimeMillis();
                            if (t - kabarT > 120) {
                                kabarT = t;
                                k.kabar(Math.min(selesai, total), total, ke, d.size());
                            }
                        }
                    }
                    if (!tmp.renameTo(f)) throw new IOException("Gagal menyimpan " + e[0]);
                    tulisInfo(f, etag, "");
                    selesai = awal + ukuran(e);   // samakan dengan daftar (file gzip bisa beda hitungan)
                    gagal = null;
                    break;
                } catch (IOException x) {
                    gagal = x;
                    selesai = awal;
                    //noinspection ResultOfMethodCallIgnored
                    tmp.delete();
                    if (batal.get()) break;
                } finally {
                    if (c != null) c.disconnect();
                }
            }
            if (gagal != null) throw gagal;
            k.kabar(Math.min(selesai, total), total, ke, d.size());
        }
        k.kabar(total, total, d.size(), d.size());
    }

    private File berkas(String kunci) {
        return new File(dirCache, sha1(kunci));
    }

    private void simpan(String kunci, byte[] isi) {
        File f = berkas(kunci), tmp = new File(f.getPath() + "." + System.nanoTime() + ".tmp");
        try (FileOutputStream o = new FileOutputStream(tmp)) {
            o.write(isi);
        } catch (IOException e) {
            //noinspection ResultOfMethodCallIgnored
            tmp.delete();
            return;
        }
        if (!tmp.renameTo(f)) {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
            if (!tmp.renameTo(f)) {
                //noinspection ResultOfMethodCallIgnored
                tmp.delete();
            }
        }
    }

    private HttpURLConnection buka(String url, int tCon, int tBaca) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(tCon);
        c.setReadTimeout(tBaca);
        c.setInstanceFollowRedirects(true);
        c.setRequestProperty("User-Agent", ua);
        return c;
    }

    // ---------- isi APK ----------
    private boolean adaAset(String aset) {
        int i = aset.lastIndexOf('/');
        String dir = aset.substring(0, i), nama = aset.substring(i + 1);
        Set<String> isi = isiFolder.get(dir);
        if (isi == null) {
            String[] l;
            try {
                l = am.list(dir);
            } catch (IOException e) {
                l = null;
            }
            isi = l == null ? Collections.emptySet() : new HashSet<>(Arrays.asList(l));
            isiFolder.put(dir, isi);
        }
        return isi.contains(nama);
    }

    private WebResourceResponse dariAset(String aset, String m) throws IOException {
        long n = -1;
        try (AssetFileDescriptor fd = am.openFd(aset)) {   // hanya bisa untuk file yang tidak dikompres
            n = fd.getLength();
        } catch (IOException ignored) {
        }
        return jawab(m, am.open(aset, AssetManager.ACCESS_STREAMING), n);
    }

    /**
     * Versi ?v=.. yang dipakai kode game di dalam APK. Kalau situs sudah memakai versi lain
     * (model diperbarui), file diunduh dari internet supaya tidak memakai model lama.
     */
    private boolean versiCocok(String rel, String v) {
        List<Object[]> d = daftarVersi;
        if (d == null) {
            synchronized (this) {
                if (daftarVersi == null) daftarVersi = bacaVersi();
                d = daftarVersi;
            }
        }
        for (Object[] e : d) if (v.equals(e[1]) && ((Pattern) e[0]).matcher(rel).matches()) return true;
        return false;
    }

    private List<Object[]> bacaVersi() {
        List<Object[]> hasil = new ArrayList<>();
        Set<String> sudah = new HashSet<>();
        Pattern alamat = Pattern.compile("((?:model-3d|gambar-game|icons)/[^'\"`\\s?]*)\\?v=([A-Za-z0-9_.-]+)");
        Pattern sisipan = Pattern.compile("\\$\\{[^}]*\\}");
        String[] akar;
        try {
            akar = am.list("web");
        } catch (IOException e) {
            akar = null;
        }
        if (akar == null) return hasil;
        for (String nama : akar) {
            if (!(nama.endsWith(".html") || nama.endsWith(".js"))) continue;
            String teks;
            try (InputStream in = am.open(AKAR + nama)) {
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                byte[] b = new byte[32 * 1024];
                int n;
                while ((n = in.read(b)) != -1) bo.write(b, 0, n);
                teks = new String(bo.toByteArray(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                continue;
            }
            Matcher m = alamat.matcher(teks);
            while (m.find()) {
                String pola = m.group(1), v = m.group(2);
                if (!sudah.add(pola + "\u0000" + v)) continue;
                // `model-3d/monster-${k}.glb` -> model-3d/monster-[^/]*\.glb
                StringBuilder rx = new StringBuilder();
                Matcher s = sisipan.matcher(pola);
                int awal = 0;
                while (s.find()) {
                    rx.append(Pattern.quote(pola.substring(awal, s.start()))).append("[^/]*");
                    awal = s.end();
                }
                rx.append(Pattern.quote(pola.substring(awal)));
                try {
                    hasil.add(new Object[]{Pattern.compile(rx.toString()), v});
                } catch (RuntimeException ignored) {
                }
            }
        }
        return hasil;
    }

    // ---------- bantuan ----------
    private static WebResourceResponse jawab(String m, InputStream in, long n) {
        if (m == null) m = "application/octet-stream";
        Map<String, String> h = new HashMap<>();
        h.put("Access-Control-Allow-Origin", "*");
        if (n >= 0) h.put("Content-Length", Long.toString(n));
        String enc = (m.startsWith("text/") || m.contains("javascript") || m.contains("json")) ? "utf-8" : null;
        return new WebResourceResponse(m, enc, 200, "OK", h, in);
    }

    private static WebResourceResponse swKosong() {
        String js = "self.addEventListener('install',function(){self.skipWaiting()});"
                + "self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){"
                + "return Promise.all(k.map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});";
        byte[] b = js.getBytes(StandardCharsets.UTF_8);
        return jawab("application/javascript", new ByteArrayInputStream(b), b.length);
    }

    private static String bersihkanJenis(String ct) {
        if (ct == null) return null;
        int i = ct.indexOf(';');
        return (i >= 0 ? ct.substring(0, i) : ct).trim();
    }

    static String jenis(String p) {
        String s = p.toLowerCase();
        if (s.endsWith(".html") || s.endsWith(".htm")) return "text/html";
        if (s.endsWith(".js") || s.endsWith(".mjs")) return "application/javascript";
        if (s.endsWith(".css")) return "text/css";
        if (s.endsWith(".json")) return "application/json";
        if (s.endsWith(".webmanifest")) return "application/manifest+json";
        if (s.endsWith(".glb")) return "model/gltf-binary";
        if (s.endsWith(".gltf")) return "model/gltf+json";
        if (s.endsWith(".webp")) return "image/webp";
        if (s.endsWith(".png")) return "image/png";
        if (s.endsWith(".jpg") || s.endsWith(".jpeg")) return "image/jpeg";
        if (s.endsWith(".svg")) return "image/svg+xml";
        if (s.endsWith(".mp3")) return "audio/mpeg";
        if (s.endsWith(".woff2")) return "font/woff2";
        if (s.endsWith(".woff")) return "font/woff";
        if (s.endsWith(".ttf")) return "font/ttf";
        if (s.endsWith(".wasm")) return "application/wasm";
        return null;
    }

    private static String sha1(String s) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-1").digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder b = new StringBuilder();
            for (byte x : d) b.append(String.format("%02x", x));
            return b.toString();
        } catch (Exception e) {
            return Integer.toHexString(s.hashCode());
        }
    }
}
