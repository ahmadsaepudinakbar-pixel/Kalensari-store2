// ===================== PARKUR HANTU 3D (Three.js) =====================
// Tampilan 3D untuk mode Parkur Hantu di game.html.
// Fisika, kontrol, checkpoint & mode online TETAP memakai kode lama di game.html (satuan piksel dunia):
//   x = kiri-kanan, y = kedalaman lantai, z = tinggi.
// File ini hanya MENGGAMBAR dunia itu dalam 3D:  three.x = x*S, three.y = z*S, three.z = y*S.
// Kalau HP tidak mendukung WebGL / Three.js gagal dimuat, game otomatis memakai tampilan 2D lama.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const S = 1 / 62;                       // 62 piksel dunia = 1 meter
const TINGGI = 1.7;                     // tinggi hero (meter) — sama untuk Ocong & Kunti
const AIR = -50;                        // permukaan kali (piksel dunia); mati di PKWATER (-70)
const MODEL_BONEKA = 'model-3d/skinocong.glb';   // dipakai untuk skin "Ocong Boneka Horor"
const MODEL_OCONG = 'model-3d/skinocong-lompat.glb';   // hero Ocong (Pocong Lompat, sama dengan Game 3D); skin Pink (id kartu pocong:emas) = model ini berwarna pink
const rnd = (a, b) => a + Math.random() * (b - a);

// ---------- renderer ----------
const cv = document.createElement('canvas');
cv.id = 'pk3';
cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:none';
const wrap = document.getElementById('wrap'), cv2 = document.getElementById('cv');
wrap.insertBefore(cv, cv2);             // di bawah kanvas 2D (kanvas 2D dipakai untuk HUD & nama)

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }

if (renderer) mulai3D();

function mulai3D() {
  const HP = window.KG_DEV === 'hp' || matchMedia('(pointer:coarse)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, HP ? 1.35 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const LANGIT = 0x0b1430;
  scene.fog = new THREE.Fog(0x0a1226, 22, 75);
  const camera = new THREE.PerspectiveCamera(46, 2, 0.1, 260);
  const CAM_OFF = new THREE.Vector3(0, 5.4, 8.6);   // sudut kamera miring dari depan-atas (seperti mode duel)

  // ---------- tekstur buatan (tanpa file) ----------
  function tex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  function ulang(t, rx, ry) { const k = t.clone(); k.repeat.set(rx, ry); k.needsUpdate = true; return k; }
  const bintik = (x, w, h, n, warna, r0, r1) => { for (let i = 0; i < n; i++) { x.fillStyle = warna(); x.beginPath(); x.arc(Math.random() * w, Math.random() * h, rnd(r0, r1), 0, 7); x.fill(); } };

  scene.background = tex(4, 256, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#04060c'); g.addColorStop(.55, '#0b1430'); g.addColorStop(1, '#16244a');
    x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  });
  scene.background.wrapS = scene.background.wrapT = THREE.ClampToEdgeWrapping;

  const T_TANAH = tex(256, 256, (x, w, h) => {            // tanah berbatu di atas pijakan
    x.fillStyle = '#6e5c47'; x.fillRect(0, 0, w, h);
    bintik(x, w, h, 900, () => `rgba(${Math.random() < .5 ? '40,30,20' : '150,130,100'},${Math.random() * .25})`, 1, 6);
    bintik(x, w, h, 40, () => `rgba(70,110,50,${rnd(.2, .45)})`, 6, 18);   // lumut
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 2;
    for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(rnd(0, w), rnd(0, h)); x.lineTo(rnd(0, w), rnd(0, h)); x.stroke(); }
  });
  const T_BATU = tex(256, 256, (x, w, h) => {             // dinding batu kali
    x.fillStyle = '#2a211a'; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) for (let c = -1; c < 6; c++) {
      const bw = 56, bh = 32, ox = (r % 2) * 28;
      x.fillStyle = `hsl(${22 + rnd(-6, 6)},${rnd(14, 22)}%,${rnd(20, 30)}%)`;
      x.beginPath(); x.roundRect(c * bw + ox + 2, r * bh + 2, bw - 4, bh - 4, 6); x.fill();
      x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(c * bw + ox + 4, r * bh + 4, bw - 10, 4);
    }
    bintik(x, w, h, 50, () => `rgba(60,100,50,${rnd(.15, .4)})`, 3, 10);
  });
  const T_RETAK = tex(256, 256, (x, w, h) => {            // pijakan rapuh (runtuh)
    x.fillStyle = '#5d4c3c'; x.fillRect(0, 0, w, h);
    bintik(x, w, h, 600, () => `rgba(30,20,10,${Math.random() * .3})`, 1, 5);
    x.strokeStyle = '#1a0d06'; x.lineWidth = 4;
    for (let i = 0; i < 5; i++) { let px = rnd(0, w), py = rnd(0, h); x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += rnd(-40, 40); py += rnd(-40, 40); x.lineTo(px, py); } x.stroke(); }
  });
  const T_PAPAN = tex(256, 256, (x, w, h) => {            // papan kayu (garis finis)
    for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(30,${rnd(35, 45)}%,${rnd(28, 36)}%)`; x.fillRect(0, i * 32, w, 31); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, i * 32 + 30, w, 2); }
    x.strokeStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i < 40; i++) { const y = rnd(0, h); x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(80, y + rnd(-4, 4), 170, y + rnd(-4, 4), w, y); x.stroke(); }
  });
  const T_LUMUT = tex(256, 256, (x, w, h) => {            // checkpoint: batu berlumut
    x.fillStyle = '#56603f'; x.fillRect(0, 0, w, h);
    bintik(x, w, h, 700, () => `rgba(${Math.random() < .5 ? '30,45,20' : '130,150,90'},${Math.random() * .3})`, 1, 7);
  });
  const T_AIR = tex(256, 256, (x, w, h) => {
    x.fillStyle = '#0b2534'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(120,190,230,${rnd(.04, .14)})`; x.fillRect(rnd(0, w), rnd(0, h), rnd(20, 70), 2); }
  });
  T_AIR.repeat.set(30, 8);
  const T_RUMPUT = tex(256, 256, (x, w, h) => {
    x.fillStyle = '#16251a'; x.fillRect(0, 0, w, h);
    bintik(x, w, h, 900, () => `rgba(${Math.random() < .5 ? '10,20,10' : '50,80,40'},${Math.random() * .4})`, 1, 5);
  });
  T_RUMPUT.repeat.set(40, 6);
  const T_KAIN = tex(128, 256, (x, w, h) => {             // kain kafan (garis lipatan)
    x.fillStyle = '#ece8df'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(120,110,95,.22)'; x.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const y = rnd(0, h); x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(40, y + rnd(-12, 12), 90, y + rnd(-12, 12), w, y + rnd(-6, 6)); x.stroke(); }
    bintik(x, w, h, 80, () => `rgba(110,95,70,${rnd(.04, .1)})`, 2, 8);
  });
  const T_GLOW = tex(128, 128, (x, w, h) => {
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  T_GLOW.wrapS = T_GLOW.wrapT = THREE.ClampToEdgeWrapping;
  const glow = (warna, ukuran, opa = 1) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T_GLOW, color: warna, transparent: true, opacity: opa, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    s.scale.set(ukuran, ukuran, 1); return s;
  };
  function tulisan(teks, warna = '#3a1a00', latar = '#ffd166', lebar = 256, tinggi = 64, font = 'bold 40px Georgia') {
    const t = tex(lebar, tinggi, (x, w, h) => { if (latar) { x.fillStyle = latar; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, 10); x.fill(); } x.fillStyle = warna; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(teks, w / 2, h / 2 + 2); });
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }

  // ---------- cahaya: bulan purnama ----------
  const hemi = new THREE.HemisphereLight(0x8fa8ff, 0x1a1408, 1.1); scene.add(hemi);
  const bulanL = new THREE.DirectionalLight(0xcfdcff, 1.9);
  bulanL.castShadow = true; bulanL.shadow.mapSize.set(HP ? 1024 : 2048, HP ? 1024 : 2048);
  Object.assign(bulanL.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 50 });
  bulanL.shadow.bias = -0.0005; bulanL.shadow.normalBias = 0.03;
  scene.add(bulanL, bulanL.target);
  const ARAH_BULAN = new THREE.Vector3(14, 20, -12);
  const obor = new THREE.PointLight(0xffb46a, 4, 7, 1.6); scene.add(obor);   // cahaya hangat lembut di sekitar hero

  // langit: bulan, bintang, gunung (ikut kamera supaya selalu terlihat)
  const langit = new THREE.Group(); scene.add(langit);
  const bulan = new THREE.Mesh(new THREE.CircleGeometry(4.2, 40), new THREE.MeshBasicMaterial({ color: 0xfff7d6, fog: false }));
  bulan.position.set(38, 30, -95); langit.add(bulan);
  const bulanG = glow(0xfff3b0, 26, .55); bulanG.position.copy(bulan.position); langit.add(bulanG);
  {
    const n = 500, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i * 3] = rnd(-160, 160); p[i * 3 + 1] = rnd(8, 90); p[i * 3 + 2] = rnd(-130, -90); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    langit.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfd8ff, size: .35, sizeAttenuation: true, fog: false, transparent: true, opacity: .8 })));
  }
  const M_GUNUNG = [new THREE.MeshBasicMaterial({ color: 0x070b18, fog: false }), new THREE.MeshBasicMaterial({ color: 0x0b1226, fog: false })];
  for (let i = 0; i < 26; i++) {
    const jauh = i % 2, h = rnd(12, 28) * (jauh ? 1.3 : 1), m = new THREE.Mesh(new THREE.ConeGeometry(rnd(14, 24), h, 5), M_GUNUNG[jauh]);
    m.position.set(-130 + i * 11 + rnd(-4, 4), h / 2 - 4, jauh ? -88 : -70); m.rotation.y = rnd(0, 3); langit.add(m);
  }

  // ---------- kali (air) & tepi seberang (lintasan 1) ----------
  const env1 = new THREE.Group(); scene.add(env1);
  const air = new THREE.Mesh(new THREE.PlaneGeometry(400, 90), new THREE.MeshPhongMaterial({ map: T_AIR, color: 0x6f9ec0, specular: 0x1c2c44, shininess: 25, transparent: true, opacity: .93 }));
  air.rotation.x = -Math.PI / 2; air.position.set(60, AIR * S, 20); air.receiveShadow = true; env1.add(air);
  const dasar = new THREE.Mesh(new THREE.PlaneGeometry(400, 90), new THREE.MeshBasicMaterial({ color: 0x03080d }));
  dasar.rotation.x = -Math.PI / 2; dasar.position.set(60, AIR * S - 3, 20); env1.add(dasar);
  const tepi = new THREE.Mesh(new THREE.BoxGeometry(400, 1.4, 14), new THREE.MeshLambertMaterial({ map: T_RUMPUT }));
  tepi.position.set(60, -.25, -7.6); tepi.receiveShadow = true; env1.add(tepi);
  const tepiDepan = new THREE.Mesh(new THREE.BoxGeometry(400, 1.4, 10), new THREE.MeshLambertMaterial({ map: T_RUMPUT }));
  tepiDepan.position.set(60, -1.9, 19.5); env1.add(tepiDepan);   // tepi dekat kamera (lebih rendah, tidak menghalangi)

  // pepohonan, rumpun bambu & nisan di tepi seberang
  const M_BAMBU = new THREE.MeshLambertMaterial({ color: 0x3f6b2e }), M_DAUN = new THREE.MeshLambertMaterial({ color: 0x14301a }),
    M_KAYU = new THREE.MeshLambertMaterial({ color: 0x3a2716 }), M_NISAN = new THREE.MeshLambertMaterial({ color: 0x8b8a83 }),
    M_TALI = new THREE.MeshLambertMaterial({ color: 0x5a4220 });
  const hiasan = new THREE.Group(); env1.add(hiasan);
  for (let x = -12; x < 70; x += rnd(2.5, 5)) {
    const k = Math.random(), z = rnd(-12, -2.5);
    if (k < .4) {                       // rumpun bambu
      for (let j = 0; j < 6; j++) {
        const h = rnd(5, 9), b = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, h, 6), M_BAMBU);
        b.position.set(x + rnd(-.6, .6), h / 2 + .4, z + rnd(-.6, .6)); b.rotation.set(rnd(-.15, .15), 0, rnd(-.2, .2)); b.castShadow = true; hiasan.add(b);
        const d = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.8, 1.3), 0), M_DAUN); d.position.set(b.position.x + rnd(-.4, .4), h + .2, b.position.z); d.scale.y = .6; hiasan.add(d);
      }
    } else if (k < .75) {               // pohon beringin gelap
      const h = rnd(2.5, 4), t = new THREE.Mesh(new THREE.CylinderGeometry(.22, .4, h, 7), M_KAYU); t.position.set(x, h / 2 + .4, z); t.castShadow = true; hiasan.add(t);
      for (let j = 0; j < 3; j++) { const d = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(1.5, 2.4), 1), M_DAUN); d.position.set(x + rnd(-1, 1), h + rnd(.6, 1.8), z + rnd(-.8, .8)); d.castShadow = true; hiasan.add(d); }
    } else {                            // nisan kuburan
      for (let j = 0; j < 3; j++) { const n = new THREE.Mesh(new THREE.BoxGeometry(.35, .6, .12), M_NISAN); n.position.set(x + j * .9, .7, z + rnd(-.5, .5)); n.rotation.set(rnd(-.15, .1), rnd(-.3, .3), rnd(-.15, .15)); n.castShadow = true; hiasan.add(n); }
    }
  }

  // ---------- pijakan (dibangun ulang tiap level dimulai) ----------
  const M = {
    tanah: new THREE.MeshLambertMaterial({ map: T_TANAH }), batu: new THREE.MeshLambertMaterial({ map: T_BATU }),
    retak: new THREE.MeshLambertMaterial({ map: T_RETAK }), papan: new THREE.MeshLambertMaterial({ map: T_PAPAN }),
    lumut: new THREE.MeshLambertMaterial({ map: T_LUMUT }), bambu: new THREE.MeshLambertMaterial({ color: 0x9c7a3e }),
    merah: new THREE.MeshLambertMaterial({ color: 0xc1121f }), hitam: new THREE.MeshLambertMaterial({ color: 0x2b2b2b }),
  };
  const matUlang = (m, rx, ry) => { const k = m.clone(); k.map = ulang(m.map, rx, ry); return k; };
  const kotak = (w, h, d, mat, x, y, z, par) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; par.add(m); return m; };
  const tabung = (r1, r2, h, mat, x, y, z, par, seg = 8) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; par.add(m); return m; };

  let lvl = null, PL = [], KOIN = [];
  const dunia = new THREE.Group(); scene.add(dunia);
  function bersihkan() {
    dunia.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material._sekali) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    dunia.clear(); PL = []; KOIN = [];
  }
  function bangun() {
    bersihkan(); lvl = PK.pl;
    const dasarY = AIR * S - 2.5, A2 = PK.ar === 1, A3 = PK.ar === 2, DS = A2 || A3; env1.visible = PK.ar === 0; DESA = null; JALAN = null;
    langit.rotation.y = A3 ? -Math.PI / 2 : 0;   // Lari Jalan Desa: kamera menghadap ke depan (+x), langit & bulan diputar ke arah itu
    PK.pl.forEach(q => {
      const g = new THREE.Group(), w = q.w * S, d = q.d * S, top = q.z * S; dunia.add(g);
      const e = { q, g, top };
      if (q.t === 'pagar') {               // pagar bambu (harus dilompati)
        for (let z = .1; z < d; z += .32) { const t = tabung(.035, .04, top + .05, M_BAMBU2, w / 2, top / 2, z, g, 6); t.rotation.z = rnd(-.05, .05); }
        [top * .45, top - .04].forEach(y => { const r = tabung(.04, .04, d, M_BAMBU2, w / 2, y, d / 2, g, 6); r.rotation.x = Math.PI / 2; });
      } else if (q.t === 'bambu') {
        [.2, .5, .8].forEach(f => { const b = tabung(.07, .07, w, M.bambu, w / 2, top - .07, d * f, g, 7); b.rotation.z = Math.PI / 2; });
        for (let x = .3; x < w; x += 1.1) {
          [.1, .9].forEach(f => tabung(.06, .06, top - dasarY, M_KAYU, x, (top + dasarY) / 2, d * f, g, 6));
          const t = kotak(.05, .05, d + .1, M_TALI, x, top - .02, d / 2, g); t.castShadow = false;
        }
      } else {
        const mt = DS ? (q.t === 'licin' ? M2.lumpur : M2[q.o.tanah] || M2.gang) : q.t === 'runtuh' ? M.retak : q.t === 'finis' ? M.papan : q.t === 'cp' ? M.lumut : M.tanah;
        const atas = kotak(w, .26, d, matUlang(mt, w / 2, d / 2), w / 2, top - .13, d / 2, g); atas.material._sekali = 1;
        const tg = top - .26 - dasarY;
        const tiang = kotak(w * .94, tg, d * .94, matUlang(DS ? (q.t === 'licin' ? M2.lumpurSisi : M2.tanahSisi) : M.batu, w / 1.8, tg / 1.8), w / 2, dasarY + tg / 2, d / 2, g); tiang.material._sekali = 1;
        if (q.t === 'runtuh') e.retak = 1;
      }
      if (q.t === 'cp' || q.i === 0) {      // tiang lampion checkpoint
        const x = w - 24 * S;
        tabung(.04, .05, 1.2, M.hitam, x, top + .6, d * .25, g, 6);
        const lm = new THREE.MeshStandardMaterial({ color: 0x777777, emissive: 0x000000, emissiveIntensity: 2 }); lm._sekali = 1;
        e.lampu = kotak(.26, .3, .26, lm, x, top + 1.32, d * .25, g); e.lampu.castShadow = false;
        e.lampuG = glow(0x3fd14b, 1.8, 0); e.lampuG.position.set(x, top + 1.32, d * .25); g.add(e.lampuG);
        e.cpIdx = PK.cps.indexOf(q);
      }
      if (q.t === 'finis' && DS) gapuraDesa(g, w, d, top);
      else if (q.t === 'finis') {                // gapura merah + papan FINIS
        const fx = 125 * S;
        [.08, .92].forEach(f => tabung(.09, .1, 2.6, M.merah, fx, top + 1.3, d * f, g));
        kotak(.22, .18, d + .5, M.merah, fx, top + 2.55, d / 2, g); kotak(.16, .12, d + .1, M.hitam, fx, top + 2.2, d / 2, g);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tulisan('FINIS'), fog: false })); sp.material._sekali = 1;
        sp.scale.set(2.2, .55, 1); sp.position.set(fx, top + 3.05, d / 2); g.add(sp);
        const gl = glow(0xffd166, 4, .35); gl.position.copy(sp.position); g.add(gl);
        for (let i = 0; i < 6; i++) { const b = kotak(.3, .02, .3, i % 2 ? M.hitam : new THREE.MeshLambertMaterial({ color: 0xf2efe9 }), fx + .2, top + .01, d * (i + .5) / 6, g); b.castShadow = false; }
      }
      if (q.t === 'api') {                  // semburan api berkala
        const fx = (q.o.fx - q.x) * S, fz = d * .15;
        tabung(.07, .09, .6, M_KAYU, fx, top + .3, fz, g, 6);
        const am = new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }); am._sekali = 1;
        e.api = new THREE.Mesh(new THREE.ConeGeometry(.18, .6, 10, 1, true), am); e.api.position.set(fx, top + .9, fz); g.add(e.api);
        e.apiG = glow(0xff7a20, 1.6, .7); e.apiG.position.set(fx, top + .9, fz); g.add(e.apiG);
        const lm = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }); lm._sekali = 1;
        e.lantai = new THREE.Mesh(new THREE.CircleGeometry(1, 24), lm); e.lantai.rotation.x = -Math.PI / 2; e.lantai.position.set(fx, top + .02, d / 2); e.lantai.scale.set(.42, d / 2 + .12, 1); g.add(e.lantai);
        e.kobar = []; for (let i = 0; i < 5; i++) { const k = glow(0xff6a10, 1, 0); k.position.set(fx, top + .3, d * (i + .5) / 5); g.add(k); e.kobar.push(k); }
        const wm = new THREE.SpriteMaterial({ map: tulisan('⚠', '#ffd27a', null, 64, 64, 'bold 48px Arial'), transparent: true, opacity: 0, fog: false }); wm._sekali = 1;
        e.awas = new THREE.Sprite(wm); e.awas.scale.set(.5, .5, 1); e.awas.position.set(fx, top + 1.7, fz); g.add(e.awas);
        e.fx = fx; e.cahaya = new THREE.PointLight(0xff8a30, 0, 7, 1.5); e.cahaya.position.set(fx, top + 1, fz); g.add(e.cahaya);
      }
      PL.push(e);
    });
    if (A2) bangunDesa(dasarY);
    if (A3) bangunJalan(dasarY);
    PK.coins.forEach(c => {                // lampion (koin)
      const g = new THREE.Group(); g.position.set(c.x * S, c.z * S, c.y * S); dunia.add(g);
      const bd = new THREE.Mesh(new THREE.SphereGeometry(.15, 14, 10), new THREE.MeshStandardMaterial({ color: 0xc1121f, emissive: 0xff4a1a, emissiveIntensity: 1.1 }));
      bd.scale.y = 1.15; bd.material._sekali = 1; g.add(bd);
      [.17, -.17].forEach(y => { const t = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .05, 10), new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: .6, roughness: .4 })); t.material._sekali = 1; t.position.y = y; g.add(t); });
      const rumbai = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .18, 4), new THREE.MeshBasicMaterial({ color: 0xffd166 })); rumbai.material._sekali = 1; rumbai.position.y = -.28; g.add(rumbai);
      g.add(glow(0xffb703, 1.1, .7));
      KOIN.push({ c, g, y0: c.z * S });
    });
  }

  // ================= LINTASAN 2: DUSUN MALAM JUMAT =================
  const T_LUMPUR = tex(256, 256, (x, w, h) => { x.fillStyle = '#4a3420'; x.fillRect(0, 0, w, h); bintik(x, w, h, 500, () => `rgba(${Math.random() < .5 ? '25,15,8' : '120,90,60'},${Math.random() * .3})`, 2, 9); bintik(x, w, h, 30, () => `rgba(140,170,200,${rnd(.08, .2)})`, 4, 14); bintik(x, w, h, 40, () => `rgba(60,110,40,${rnd(.3, .6)})`, 1, 4); });
  const T_TANAHSISI = tex(256, 256, (x, w, h) => { x.fillStyle = '#3a2a1a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 12; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '20,12,6' : '90,65,40'},.35)`; x.fillRect(0, rnd(0, h), w, rnd(2, 8)); } bintik(x, w, h, 300, () => `rgba(0,0,0,${Math.random() * .25})`, 1, 4); });
  const T_KEBUN = tex(256, 256, (x, w, h) => { x.fillStyle = '#3d2c1c'; x.fillRect(0, 0, w, h); bintik(x, w, h, 500, () => `rgba(${Math.random() < .5 ? '20,14,8' : '100,80,55'},${Math.random() * .3})`, 1, 6);
    for (let i = 0; i < 26; i++) { x.save(); x.translate(rnd(0, w), rnd(0, h)); x.rotate(rnd(0, 7)); x.fillStyle = Math.random() < .5 ? '#5a4a1e' : '#3e5a22'; x.beginPath(); x.ellipse(0, 0, rnd(8, 20), rnd(3, 6), 0, 0, 7); x.fill(); x.restore(); } });
  const T_KUBUR = tex(256, 256, (x, w, h) => { x.fillStyle = '#26301f'; x.fillRect(0, 0, w, h); bintik(x, w, h, 900, () => `rgba(${Math.random() < .5 ? '10,18,8' : '70,90,50'},${Math.random() * .35})`, 1, 5); bintik(x, w, h, 20, () => `rgba(240,240,230,${rnd(.4, .8)})`, 1.5, 3); });
  const T_GANG = tex(256, 256, (x, w, h) => { x.fillStyle = '#4e4234'; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { x.fillStyle = `hsl(30,${rnd(8, 16)}%,${rnd(26, 34)}%)`; x.fillRect(c * 64 + (r % 2) * 32 + 2, r * 32 + 2, 60, 28); } bintik(x, w, h, 200, () => `rgba(0,0,0,${Math.random() * .2})`, 1, 4); });
  const T_SAWAH = tex(256, 256, (x, w, h) => { x.fillStyle = '#1d3420'; x.fillRect(0, 0, w, h); bintik(x, w, h, 60, () => `rgba(120,170,210,${rnd(.05, .15)})`, 6, 22); bintik(x, w, h, 400, () => `rgba(10,20,8,${Math.random() * .4})`, 1, 4); });
  const T_DINDING = tex(256, 256, (x, w, h) => { x.fillStyle = '#d8ccb0'; x.fillRect(0, 0, w, h); x.fillStyle = '#7a5a3a'; x.fillRect(0, h * .72, w, h * .28); bintik(x, w, h, 120, () => `rgba(90,70,40,${rnd(.04, .12)})`, 3, 14); });
  const T_GENTENG = tex(256, 256, (x, w, h) => { x.fillStyle = '#5a1e14'; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { x.fillStyle = `hsl(8,${rnd(45, 60)}%,${rnd(22, 32)}%)`; x.beginPath(); x.roundRect(c * 32 + (r % 2) * 16 + 1, r * 32 + 1, 30, 30, [0, 0, 10, 10]); x.fill(); } });
  const T_BATA = tex(256, 256, (x, w, h) => { x.fillStyle = '#3a1a14'; x.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) for (let c = -1; c < 5; c++) { x.fillStyle = `hsl(6,${rnd(40, 55)}%,${rnd(24, 32)}%)`; x.fillRect(c * 64 + (r % 2) * 32 + 2, r * 16 + 2, 60, 12); } });
  const M2 = {
    lumpur: new THREE.MeshStandardMaterial({ map: T_LUMPUR, roughness: .35, metalness: .05 }), lumpurSisi: new THREE.MeshLambertMaterial({ map: T_TANAHSISI, color: 0x9a8a7a }),
    tanahSisi: new THREE.MeshLambertMaterial({ map: T_TANAHSISI }), kebun: new THREE.MeshLambertMaterial({ map: T_KEBUN }), kubur: new THREE.MeshLambertMaterial({ map: T_KUBUR }),
    gang: new THREE.MeshLambertMaterial({ map: T_GANG }), pos: new THREE.MeshLambertMaterial({ map: T_GANG }),
  };
  const M_BAMBU2 = new THREE.MeshLambertMaterial({ color: 0xa8894a }), M_PISANG = new THREE.MeshLambertMaterial({ color: 0x2f6a2a, side: THREE.DoubleSide }),
    M_BTPISANG = new THREE.MeshLambertMaterial({ color: 0x5a6a2e }), M_PUTIH = new THREE.MeshLambertMaterial({ color: 0xece6d6 }), M_KULIT = new THREE.MeshLambertMaterial({ color: 0xc79a6a }),
    M_GELAP = new THREE.MeshLambertMaterial({ color: 0x151515 }), M_JENDELA = new THREE.MeshBasicMaterial({ color: 0xffcf6a }), M_GUNDUK = new THREE.MeshLambertMaterial({ color: 0x3a2c1c });
  let DESA = null;
  const grup = (par, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); par.add(g); return g; };
  const P = (x, y) => [x * S, y * S];                      // piksel dunia (x, kedalaman) → meter
  function bidang(tx, x0, x1, y0, y1, h, mat) {            // bidang datar (air sawah, kali)
    const m = new THREE.Mesh(new THREE.PlaneGeometry((x1 - x0) * S, (y1 - y0) * S), mat); m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2 * S, h, (y0 + y1) / 2 * S); m.receiveShadow = true; dunia.add(m); return m;
  }
  function tanahKotak(x0, x1, y0, y1, dasarY, mat) {      // tanah di luar jalur (halaman, kebun)
    const w = (x1 - x0) * S, d = (y1 - y0) * S, h = -.03 - dasarY, k = matUlang(mat, w / 3, d / 3); k._sekali = 1;
    kotak(w, h, d, k, (x0 + x1) / 2 * S, dasarY + h / 2, (y0 + y1) / 2 * S, dunia).castShadow = false;
  }
  function pohonPisang(x, z, s = 1) {
    const g = grup(dunia, x, 0, z); g.rotation.y = rnd(0, 7); g.scale.setScalar(s);
    tabung(.12, .17, 2.4, M_BTPISANG, 0, 1.2, 0, g, 8);
    for (let i = 0; i < 7; i++) {
      const p = new THREE.Group(); p.position.y = 2.3; p.rotation.y = i / 7 * Math.PI * 2 + rnd(-.2, .2); g.add(p);
      const d = new THREE.Mesh(new THREE.PlaneGeometry(.55, 1.9, 1, 3), M_PISANG); const pos = d.geometry.attributes.position;
      for (let k = 0; k < pos.count; k++) { const yy = pos.getY(k) + .95; pos.setZ(k, -yy * yy * .22); }
      d.geometry.translate(0, .95, 0); d.geometry.computeVertexNormals(); d.rotation.x = rnd(.6, 1.2); d.castShadow = true; p.add(d);
    }
    if (Math.random() < .5) { const j = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), new THREE.MeshLambertMaterial({ color: 0x6a8a2a })); j.material._sekali = 1; j.scale.y = 1.6; j.position.set(.18, 1.95, 0); g.add(j); }
    return g;
  }
  function nisan(x, z, rot = 0) {
    const g = grup(dunia, x, 0, z); g.rotation.y = rot;
    kotak(.55, .16, 1.2, M_GUNDUK, 0, .08, .35, g).castShadow = false;
    const n = kotak(.32, .5, .1, M_NISAN, 0, .3, 0, g); const c = tabung(.16, .16, .1, M_NISAN, 0, .55, 0, g, 12); c.rotation.x = Math.PI / 2; n.castShadow = true;
    if (Math.random() < .35) { const k = kotak(.36, .08, .12, M_PUTIH, 0, .42, 0, g); k.castShadow = false; }   // kain putih terikat
    return g;
  }
  function rumah(x, z, lebar, warna) {
    const g = grup(dunia, x, 0, z), t = 2.4, dl = 3;
    const dm = new THREE.MeshLambertMaterial({ map: ulang(T_DINDING, lebar / 2, 1), color: warna }); dm._sekali = 1; dm.map._sekali = 1;
    kotak(lebar, t, dl, dm, 0, t / 2, 0, g);
    const atapM = new THREE.MeshLambertMaterial({ map: ulang(T_GENTENG, 4, 2) }); atapM._sekali = 1;
    const sh = new THREE.Shape(); sh.moveTo(-dl / 2 - .3, 0); sh.lineTo(0, 1.3); sh.lineTo(dl / 2 + .3, 0); sh.closePath();
    const ag = new THREE.ExtrudeGeometry(sh, { depth: lebar + .4, bevelEnabled: false }); ag.translate(0, 0, -(lebar + .4) / 2); ag.rotateY(Math.PI / 2);
    const am = new THREE.Mesh(ag, atapM); am.position.y = t; am.castShadow = true; g.add(am);
    const jml = Math.max(1, Math.floor(lebar / 1.6));
    for (let i = 0; i < jml; i++) { const xx = -lebar / 2 + (i + .5) * lebar / jml; if (i === Math.floor(jml / 2)) { kotak(.7, 1.6, .05, M_GELAP, xx, .8, dl / 2 + .02, g).castShadow = false; continue; }
      const j = kotak(.6, .55, .05, Math.random() < .7 ? M_JENDELA : M_GELAP, xx, 1.45, dl / 2 + .02, g); j.castShadow = false; }
    return g;
  }
  function lampu(x, z, terang) {
    const g = grup(dunia, x, 0, z); tabung(.04, .06, 3, M.hitam, 0, 1.5, 0, g, 6); kotak(.5, .04, .04, M.hitam, .22, 2.95, 0, g);
    const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe2a0 })); b.material._sekali = 1; b.position.set(.45, 2.85, 0); g.add(b);
    const gl = glow(0xffc86a, 2.2, .8); gl.position.copy(b.position); g.add(gl);
    if (terang) { const l = new THREE.PointLight(0xffc070, 14, 11, 1.4); l.position.set(.45, 2.7, 0); g.add(l); }
    return g;
  }
  function gapuraDesa(g, w, d, top) {
    const fx = 125 * S, bm = new THREE.MeshLambertMaterial({ map: ulang(T_BATA, 1, 4) }); bm._sekali = 1;
    [-.15, d + .15].forEach(z => { kotak(.5, 3.2, .5, bm, fx, top + 1.6, z, g); kotak(.62, .14, .62, M_PUTIH, fx, top + 3.25, z, g); });
    kotak(.4, .35, d + 1, bm, fx, top + 3.45, d / 2, g);
    const sh = new THREE.Shape(); sh.moveTo(-.5, 0); sh.lineTo(0, .7); sh.lineTo(.5, 0); sh.closePath();
    const ag = new THREE.ExtrudeGeometry(sh, { depth: d + 1.2, bevelEnabled: false }); ag.translate(0, 0, -(d + 1.2) / 2);
    const atap = new THREE.Mesh(ag, new THREE.MeshLambertMaterial({ map: ulang(T_GENTENG, 1, 3) })); atap.material._sekali = 1; atap.position.set(fx, top + 3.62, d / 2); atap.castShadow = true; g.add(atap);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tulisan('FINIS · GAPURA DESA', '#3a1a00', '#ffd166', 512, 64, 'bold 34px Georgia'), fog: false })); sp.material._sekali = 1;
    sp.scale.set(3.4, .42, 1); sp.position.set(fx, top + 4.55, d / 2); g.add(sp);
    for (let i = 0; i < 8; i++) { const b = kotak(.3, .02, d / 8, i % 2 ? M.hitam : M_PUTIH, fx + .25, top + .01, d * (i + .5) / 8, g); b.castShadow = false; }
    [-.15, d + .15].forEach(z => { const gl = glow(0xffcf6a, 2.6, .55); gl.position.set(fx + .3, top + 2.6, z); g.add(gl); });
  }
  function orangSawah(x, z) {   // orang-orangan sawah
    const g = grup(dunia, x, AIR * S, z); tabung(.03, .03, 2.2, M_KAYU, 0, 1.1, 0, g, 5); const l = tabung(.025, .025, 1.3, M_KAYU, 0, 1.6, 0, g, 5); l.rotation.z = Math.PI / 2;
    const baju = new THREE.MeshLambertMaterial({ color: 0x5a3a6a }); baju._sekali = 1; kotak(.55, .6, .2, baju, 0, 1.45, 0, g);
    const k = new THREE.Mesh(new THREE.SphereGeometry(.15, 10, 8), new THREE.MeshLambertMaterial({ color: 0xc9a96e })); k.material._sekali = 1; k.position.y = 1.95; g.add(k);
    const c = new THREE.Mesh(new THREE.ConeGeometry(.35, .2, 12), new THREE.MeshLambertMaterial({ color: 0xb08a4a })); c.material._sekali = 1; c.position.y = 2.12; g.add(c);
  }
  function posRonda(x, z) {
    const g = grup(dunia, x, 0, z); [[-1.1, -.8], [1.1, -.8], [-1.1, .8], [1.1, .8]].forEach(([a, b]) => tabung(.07, .07, 2.1, M_KAYU, a, 1.05, b, g, 6));
    kotak(2.2, .1, 1.4, M.papan, 0, .5, 0, g);
    const atap = new THREE.Mesh(new THREE.ConeGeometry(1.9, .9, 4), new THREE.MeshLambertMaterial({ map: ulang(T_GENTENG, 3, 2) })); atap.material._sekali = 1; atap.rotation.y = Math.PI / 4; atap.position.y = 2.5; atap.castShadow = true; g.add(atap);
    const ken = tabung(.1, .1, .6, M.bambu, 1.15, 1.5, .85, g, 8); const b = glow(0xffcf6a, 2.4, .6); b.position.set(0, 2, 0); g.add(b);
    const l = new THREE.PointLight(0xffb060, 10, 9, 1.5); l.position.set(0, 1.9, .3); g.add(l); return ken;
  }
  function buatAnjing() {
    const g = grup(dunia, 0, 0, 0), b = new THREE.Group(); g.add(b);
    const bulu = new THREE.MeshLambertMaterial({ color: 0x1c1712 }); bulu._sekali = 1;
    kotak(.24, .22, .55, bulu, 0, .42, 0, b); const kp = kotak(.2, .2, .22, bulu, 0, .58, .34, b); kotak(.12, .1, .14, bulu, 0, .53, .5, b);
    [-.07, .07].forEach(x => { const t = new THREE.Mesh(new THREE.ConeGeometry(.045, .12, 4), bulu); t.position.set(x, .72, .3); b.add(t); const m = new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3a1a })); m.material._sekali = 1; m.position.set(x * .8, .62, .455); b.add(m); });
    const kaki = [[-.08, .2], [.08, .2], [-.08, -.2], [.08, -.2]].map(([x, z]) => { const p = new THREE.Group(); p.position.set(x, .32, z); b.add(p); const k = tabung(.03, .03, .32, bulu, 0, -.16, 0, p, 5); return p; });
    const ekor = new THREE.Group(); ekor.position.set(0, .5, -.27); b.add(ekor); const e = tabung(.02, .03, .28, bulu, 0, .12, 0, ekor, 5); ekor.rotation.x = -.7;
    return { g, b, kaki, ekor };
  }
  function buatRonda(x, z) {
    const g = grup(dunia, x, 0, z), sarung = new THREE.MeshLambertMaterial({ color: 0x2e4a34 }), baju = new THREE.MeshLambertMaterial({ color: 0x2f4f7a }); sarung._sekali = baju._sekali = 1;
    tabung(.2, .24, .8, sarung, 0, .4, 0, g, 10); tabung(.2, .19, .6, baju, 0, 1.1, 0, g, 10);
    const k = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 10), M_KULIT); k.position.y = 1.55; k.castShadow = true; g.add(k);
    tabung(.13, .13, .12, M_GELAP, 0, 1.68, 0, g, 12);
    const tg = new THREE.Group(); tg.position.set(.2, 1.25, .08); g.add(tg); const ln = tabung(.05, .05, .45, baju, 0, 0, .2, tg, 6); ln.rotation.x = Math.PI / 2;
    const senter = tabung(.05, .04, .24, new THREE.MeshLambertMaterial({ color: 0x8a8a8a }), 0, 0, .48, tg, 8); senter.rotation.x = Math.PI / 2;
    const L = 12.5, cg = new THREE.ConeGeometry(Math.tan(.2) * L, L, 28, 1, true); cg.rotateX(-Math.PI / 2); cg.translate(0, 0, L / 2);
    const cm = new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); cm._sekali = 1;
    const sinar = new THREE.Mesh(cg, cm); sinar.position.z = .6; sinar.rotation.x = .09; tg.add(sinar);
    const sp = new THREE.SpotLight(0xfff0c0, 40, 14, .21, .45, 1.2); sp.position.set(0, 0, .6); tg.add(sp); const tgt = new THREE.Object3D(); tgt.position.set(0, -1.1, 9); tg.add(tgt); sp.target = tgt;
    const ujung = glow(0xfff3b0, .6, .9); ujung.position.z = .62; tg.add(ujung);
    return { g, sinar, sp };
  }
  function buatBurung(k) {
    const g = grup(dunia, 0, 0, 0), b = new THREE.Group(), bebek = k === 'bebek'; g.add(b);
    const warna = new THREE.MeshLambertMaterial({ color: bebek ? 0xf2f0ea : (Math.random() < .5 ? 0xb8642a : 0xe9e1d0) }); warna._sekali = 1;
    const bd = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), warna); bd.scale.set(.85, bebek ? .7 : .9, 1.2); bd.position.y = .2; bd.castShadow = true; b.add(bd);
    const kp = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), warna); kp.position.set(0, bebek ? .36 : .38, .14); b.add(kp);
    const paruh = new THREE.Mesh(new THREE.ConeGeometry(.025, .08, 5), new THREE.MeshLambertMaterial({ color: 0xf0a020 })); paruh.material._sekali = 1; paruh.rotation.x = Math.PI / 2; paruh.position.set(0, kp.position.y, .23); if (bebek) paruh.scale.set(1.8, .6, 1.2); b.add(paruh);
    if (!bebek) { const j = new THREE.Mesh(new THREE.BoxGeometry(.02, .07, .08), new THREE.MeshLambertMaterial({ color: 0xd42a1a })); j.material._sekali = 1; j.position.set(0, .46, .14); b.add(j); }
    const ek = new THREE.Mesh(new THREE.ConeGeometry(.06, .16, 5), warna); ek.position.set(0, .3, -.16); ek.rotation.x = -.8; b.add(ek);
    return { g, b, kp };
  }
  function bangunDesa(dasarY) {
    const N = PK.npc; if (!N) return;
    // dasar gelap, sawah, kali
    bidang(0, -2000, 8400, -1600, 2400, dasarY - .1, new THREE.MeshBasicMaterial({ color: 0x050805 }));
    const sw = bidang(0, 500, 1580, -1600, 2400, AIR * S + .02, new THREE.MeshStandardMaterial({ map: ulang(T_SAWAH, 10, 34), roughness: .25, metalness: .1, color: 0x8aa088 })); sw.material._sekali = 1;
    const kl = bidang(0, 1700, 2160, -1600, 2400, AIR * S, new THREE.MeshPhongMaterial({ map: T_AIR, color: 0x6f9ec0, specular: 0x1c2c44, shininess: 25 })); kl.material._sekali = 1;
    // pematang di tepi sawah & tanggul kali (tanah)
    tanahKotak(-2000, 0, -1600, 2400, dasarY, M2.tanahSisi.clone()); tanahKotak(6220, 8400, -1600, 2400, dasarY, new THREE.MeshLambertMaterial({ map: T_RUMPUT }));
    tanahKotak(1580, 1700, -1600, 280, dasarY, new THREE.MeshLambertMaterial({ map: T_RUMPUT })); tanahKotak(1580, 1700, 480, 2400, dasarY, new THREE.MeshLambertMaterial({ map: T_RUMPUT }));
    tanahKotak(2160, 2300, -1600, 280, dasarY, new THREE.MeshLambertMaterial({ map: T_RUMPUT })); tanahKotak(2160, 2300, 480, 2400, dasarY, new THREE.MeshLambertMaterial({ map: T_RUMPUT }));
    PK.pl.forEach(q => { if (!q.o.tepi || q.t === 'pagar') return;
      const m = q.o.tanah === 'kubur' ? M2.kubur : q.o.tanah === 'gang' ? new THREE.MeshLambertMaterial({ map: T_RUMPUT }) : q.o.tanah === 'kebun' ? M2.kebun : new THREE.MeshLambertMaterial({ map: T_RUMPUT });
      tanahKotak(q.x, q.x + q.w, -1600, q.y, dasarY, m); tanahKotak(q.x, q.x + q.w, q.y + q.d, 2400, dasarY, m);
      // pagar bambu rendah di tepi jalan (tanda batas)
      const sisi = [q.y - 6, q.y + q.d + 6], panjang = q.w * S;
      sisi.forEach(yy => { [.25, .5].forEach(h => { const r = tabung(.025, .025, panjang, M_BAMBU2, (q.x + q.w / 2) * S, h, yy * S, dunia, 5); r.rotation.z = Math.PI / 2; r.castShadow = false; }); });
      const n = Math.max(2, Math.floor(panjang / 1.2)), im = new THREE.InstancedMesh(new THREE.CylinderGeometry(.035, .04, .65, 5), M_BAMBU2, n * 2), mt = new THREE.Matrix4();
      let i = 0; sisi.forEach(yy => { for (let k = 0; k < n; k++) { mt.makeTranslation((q.x + (k + .5) * q.w / n) * S, .32, yy * S); im.setMatrixAt(i++, mt); } }); dunia.add(im); });
    // padi di sawah (satu InstancedMesh)
    { const geo = new THREE.ConeGeometry(.09, .5, 4); geo.translate(0, .25, 0); const mat = new THREE.MeshLambertMaterial({ color: 0x3f7a2c }); mat._sekali = 1;
      const im = new THREE.InstancedMesh(geo, mat, 900), mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
      let n = 0; for (let x = 530; x < 1570 && n < 900; x += 26) for (let y = -200; y < 900 && n < 900; y += 30) { const px = x + rnd(-6, 6), py = y + rnd(-6, 6); if (pkDi(px, py, 14).length) continue;
        e.set(rnd(-.15, .15), rnd(0, 3), rnd(-.15, .15)); q.setFromEuler(e); const s2 = rnd(.8, 1.3); sc.set(s2, s2, s2); v.set(px * S, AIR * S, py * S); mt.compose(v, q, sc); im.setMatrixAt(n++, mt); }
      im.count = n; dunia.add(im); }
    orangSawah(...P(700, 560)); orangSawah(...P(1250, 120));
    { const g = grup(dunia, 1000 * S, AIR * S, -260 * S); [[-1, -.8], [1, -.8], [-1, .8], [1, .8]].forEach(([a, b]) => tabung(.06, .06, 2, M_KAYU, a, 1.4, b, g, 5)); kotak(2.1, .08, 1.7, M.papan, 0, 1.2, 0, g);
      const a = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1, 4), new THREE.MeshLambertMaterial({ color: 0x6a5a3a })); a.material._sekali = 1; a.rotation.y = Math.PI / 4; a.position.y = 2.8; a.castShadow = true; g.add(a); }   // gubuk sawah
    // rumpun bambu di tepi kali
    [[1630, -150], [1660, -420], [2230, -220], [2210, 30]].forEach(([x, y]) => { for (let j = 0; j < 7; j++) { const h = rnd(5, 8), b = tabung(.07, .09, h, M_BAMBU, x * S + rnd(-.6, .6), h / 2, y * S + rnd(-.6, .6), dunia, 6); b.rotation.set(rnd(-.15, .15), 0, rnd(-.2, .2)); const d = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.8, 1.2), 0), M_DAUN); d.position.set(b.position.x, h, b.position.z); d.scale.y = .6; dunia.add(d); } });
    // pos ronda di START
    DESA = { kenStart: posRonda(260 * S, 130 * S) };
    lampu(470 * S, 270 * S, 0);
    // kebun pisang
    N.hal.filter(h => h.k === 'pisang').forEach(h => pohonPisang(h.x * S, h.y * S, .9));
    for (let x = 2320; x < 3400; x += rnd(90, 150)) { pohonPisang(x * S, rnd(-300, 200) * S, rnd(.9, 1.25)); }
    // kuburan: nisan (padat), kamboja, nisan di luar jalur
    N.hal.filter(h => h.k === 'nisan').forEach(h => nisan(h.x * S, h.y * S, rnd(-.15, .15)));
    for (let x = 3430; x < 4480; x += rnd(70, 120)) { nisan(x * S, rnd(-280, 230) * S, rnd(-.3, .3)); if (Math.random() < .4) nisan(x * S, rnd(520, 640) * S, rnd(-.3, .3)); }
    [[3560, 120], [3980, -60], [4300, 160]].forEach(([x, y]) => { const g = grup(dunia, x * S, 0, y * S); const t = tabung(.12, .2, 2.2, M_KAYU, 0, 1.1, 0, g, 7); t.rotation.z = .2;
      for (let j = 0; j < 4; j++) { const d = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.7, 1), 0), M_DAUN); d.position.set(rnd(-.8, .9), rnd(2.1, 2.8), rnd(-.6, .6)); d.scale.y = .7; g.add(d); }
      const n = 40, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = rnd(-1.1, 1.2); p[i * 3 + 1] = rnd(2, 3.1); p[i * 3 + 2] = rnd(-.9, .9); }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(p, 3)); const pm = new THREE.PointsMaterial({ color: 0xfff6e8, size: .09 }); pm._sekali = 1; g.add(new THREE.Points(gg, pm)); });   // pohon kamboja berbunga putih
    // gang kampung: deret rumah, lampu jalan, kentongan
    const warna = [0xffffff, 0xd8e8d0, 0xf0d8c8, 0xd0dcf0];
    let i = 0; for (let x = 4600; x < 5680; x += 290) rumah((x + 110) * S, -110 * S, rnd(3.4, 4.2), warna[i++ % 4]);
    rumah(250 * S, -560 * S, 4, 0xe8d8c0); rumah(6000 * S, -120 * S, 4.4, 0xf0d8c8);
    lampu(4790 * S, 268 * S, 1); lampu(5420 * S, 268 * S, 0); lampu(5980 * S, 268 * S, 1);
    { const g = grup(dunia, 4560 * S, 0, 268 * S); tabung(.06, .06, 2.4, M_KAYU, 0, 1.2, 0, g, 6); kotak(.6, .06, .06, M_KAYU, .25, 2.35, 0, g);
      const pv = new THREE.Group(); pv.position.set(.5, 2.3, 0); g.add(pv); tabung(.12, .12, .7, M.bambu, 0, -.4, 0, pv, 10); DESA.kent = pv; }
    // tokoh: anjing, pak ronda, ayam & bebek
    DESA.anjing = buatAnjing(); DESA.ronda = buatRonda(N.ronda.x * S, N.ronda.y * S); DESA.burung = N.burung.map(b => buatBurung(b.k));
  }
  function updDesa(t, dt) {
    const N = PK.npc; if (!DESA || !N) return;
    const A = N.anjing, D = DESA.anjing, lari = A.lari || 0;
    D.g.position.set(A.x * S, 0, A.y * S); D.g.rotation.y = Math.atan2(A.fx || 0, A.fy || 0);
    const sp = lari >= 1 ? 22 : lari > 0 ? 9 : 0; D.kaki.forEach((k, i) => { k.rotation.x = sp ? Math.sin(t * sp + (i % 2 ? 0 : Math.PI) + (i > 1 ? Math.PI / 2 : 0)) * .7 : 0; });
    D.b.position.y = sp ? Math.abs(Math.sin(t * sp)) * .05 : 0; D.b.rotation.x = A.cd > 0 ? -.35 : 0; D.ekor.rotation.z = Math.sin(t * (lari ? 18 : 6)) * .5;
    const R = DESA.ronda; R.g.rotation.y = Math.atan2(Math.cos(N.ronda.a), Math.sin(N.ronda.a));
    R.sinar.material.opacity = N.ronda.on ? .13 : .05; R.sp.intensity = N.ronda.on ? 40 : 12;
    DESA.burung.forEach((m, i) => { const b = N.burung[i]; m.g.position.set(b.x * S, 0, b.y * S); m.g.rotation.y = b.fx > 0 ? Math.PI / 2 : -Math.PI / 2; m.b.position.y = Math.abs(Math.sin(t * 9 + i)) * .03; m.kp.position.y = (b.k === 'bebek' ? .36 : .38) - (Math.sin(t * 3 + i * 2) > .7 ? .1 : 0); });
    if (DESA.kent) DESA.kent.rotation.z = N.kent.bunyi ? Math.sin(t * 22) * .35 : DESA.kent.rotation.z * .9;
  }

  // ================= LINTASAN 3: LARI JALAN DESA (3 jalur, kamera dari belakang) =================
  let JALAN = null;
  const M_KAIN = [0xd23b3b, 0x2f7be0, 0xf2c94c, 0x3fae5a, 0xe86fb4, 0xf0f0e8].map(c => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
  const M_GEROBAK = new THREE.MeshLambertMaterial({ color: 0x8a5a2e }), M_RODA = new THREE.MeshLambertMaterial({ color: 0x2a1a10 }), M_HIJAU = new THREE.MeshLambertMaterial({ color: 0x1f5a2a }),
    M_KAMBING = new THREE.MeshLambertMaterial({ color: 0xece4d4 }), M_TANDUK = new THREE.MeshLambertMaterial({ color: 0x6a5a40 });
  function obGerobak(g) {   // gerobak kayu (tinggi: harus pindah jalur)
    kotak(1.15, .55, .72, M_GEROBAK, 0, .78, 0, g); kotak(1.2, .08, .78, M_KAYU, 0, .5, 0, g);
    [-.38, .38].forEach(z => { const r = tabung(.32, .32, .07, M_RODA, -.1, .34, z, g, 14); r.rotation.x = Math.PI / 2; });
    [-.25, .25].forEach(z => { const t = tabung(.03, .03, .9, M_KAYU, -.9, .6, z, g, 5); t.rotation.z = Math.PI / 2.4; });
    for (let i = 0; i < 4; i++) { const k = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), new THREE.MeshLambertMaterial({ color: [0x7a9a2a, 0xd0a030, 0x9a3a1a][i % 3] })); k.material._sekali = 1; k.position.set(rnd(-.35, .35), 1.15, rnd(-.2, .2)); k.castShadow = true; g.add(k); }
  }
  function obKeranda(g) {   // keranda bambu berkain hijau
    [[-.6, -.25], [.6, -.25], [-.6, .25], [.6, .25]].forEach(([x, z]) => tabung(.035, .035, .7, M.bambu, x, .35, z, g, 5));
    kotak(1.4, .1, .6, M.bambu, 0, .72, 0, g);
    const tutup = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, 1.3, 14, 1, false, 0, Math.PI), M_HIJAU); tutup.rotation.z = Math.PI / 2; tutup.rotation.y = Math.PI / 2; tutup.position.y = .78; tutup.castShadow = true; g.add(tutup);
    const pita = kotak(1.32, .05, .05, new THREE.MeshLambertMaterial({ color: 0xf2c94c }), 0, 1.1, 0, g); pita.material._sekali = 1;
    [-1, 1].forEach(a => { const t = tabung(.03, .03, .7, M.bambu, a * .95, .76, -.22, g, 5); t.rotation.z = Math.PI / 2; const t2 = t.clone(); t2.position.z = .22; g.add(t2); });
  }
  function obPagar(g) {   // pagar bambu rendah (lompati)
    [-.36, 0, .36].forEach(z => tabung(.035, .04, .64, M_BAMBU2, 0, .32, z, g, 6));
    [.22, .52].forEach(y => { const r = tabung(.03, .03, .86, M_BAMBU2, 0, y, 0, g, 6); r.rotation.x = Math.PI / 2; });
  }
  function obJemuran(g) {   // jemuran: tiang kiri-kanan + tali + baju (merunduk)
    [-.42, .42].forEach(z => tabung(.035, .04, 1.75, M_KAYU, 0, .875, z, g, 6));
    const tali = tabung(.012, .012, .86, M_TALI, 0, 1.62, 0, g, 4); tali.rotation.x = Math.PI / 2; tali.castShadow = false;
    const kain = []; [-.24, .02, .27].forEach((z, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.26, rnd(.42, .55)), M_KAIN[Math.floor(rnd(0, 6))]); m.geometry.translate(0, -m.geometry.parameters.height / 2, 0);
      m.position.set(0, 1.6, z); m.rotation.y = Math.PI / 2; m.castShadow = true; g.add(m); kain.push(m); });
    return kain;
  }
  function obKambing(g) {   // kambing (lompati)
    const b = new THREE.Group(); g.add(b);
    kotak(.62, .32, .3, M_KAMBING, 0, .5, 0, b); kotak(.2, .2, .18, M_KAMBING, .38, .68, 0, b);
    [-.06, .06].forEach(z => { const t = tabung(.015, .025, .14, M_TANDUK, .36, .83, z, b, 4); t.rotation.z = -.5; });
    const kaki = [[-.22, -.1], [-.22, .1], [.22, -.1], [.22, .1]].map(([x, z]) => { const p = new THREE.Group(); p.position.set(x, .36, z); b.add(p); tabung(.03, .03, .36, M_KAMBING, 0, -.18, 0, p, 5); return p; });
    const jng = kotak(.06, .1, .05, M_TANDUK, .46, .55, 0, b); jng.castShadow = false;
    return { b, kaki };
  }
  function bangunJalan(dasarY) {
    const R = PK.run; if (!R) return;
    const jl = PK.pl[0], Y0 = jl.y, Y1 = jl.y + jl.d, LJ = window.PKLANE || PKLANE, last = PK.pl[PK.pl.length - 1], LEN = last.x + last.w;
    // pemandangan dikelompokkan per 1.500 px → yang jauh disembunyikan (ringan untuk HP)
    const CH = 1500, kel = {}, chunk = x => { const k = Math.floor(x / CH); return kel[k] || (kel[k] = grup(dunia, 0, 0, 0)); };
    JALAN = { kel, CH };
    bidang(0, -1500, LEN + 3000, -1600, 2400, dasarY - .1, new THREE.MeshBasicMaterial({ color: 0x050805 }));
    // tanah di luar jalan: rumput (gang/kampung), kebun, kuburan
    PK.pl.forEach(q => { const m = q.o.tanah === 'kubur' ? M2.kubur : q.o.tanah === 'kebun' ? M2.kebun : new THREE.MeshLambertMaterial({ map: T_RUMPUT });
      tanahKotak(q.x, q.x + q.w, -1600, q.y, dasarY, m); tanahKotak(q.x, q.x + q.w, q.y + q.d, 2400, dasarY, m); });
    tanahKotak(-1500, 0, -1600, 2400, dasarY, new THREE.MeshLambertMaterial({ map: T_RUMPUT })); tanahKotak(LEN, LEN + 3000, -1600, 2400, dasarY, new THREE.MeshLambertMaterial({ map: T_RUMPUT }));
    // garis jalur putus-putus & pagar bambu di kedua tepi jalan
    { const batas = LJ.slice(1).map((y, k) => (y + LJ[k]) / 2), n = Math.ceil(LEN / 70) * batas.length;
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(34 * S, .012, .05), new THREE.MeshBasicMaterial({ color: 0xf2e6c0, transparent: true, opacity: .45 }), n), mt = new THREE.Matrix4();
      let i = 0; batas.forEach(y => { for (let x = 30; x < LEN && i < n; x += 70) { mt.makeTranslation(x * S, .006, y * S); im.setMatrixAt(i++, mt); } }); im.count = i; dunia.add(im); }
    [Y0 - 6, Y1 + 6].forEach(yy => { [.25, .5].forEach(h => { const r = tabung(.025, .025, LEN * S, M_BAMBU2, LEN / 2 * S, h, yy * S, dunia, 5); r.rotation.z = Math.PI / 2; r.castShadow = false; });
      const n = Math.floor(LEN / 75), im = new THREE.InstancedMesh(new THREE.CylinderGeometry(.035, .04, .65, 5), M_BAMBU2, n), mt = new THREE.Matrix4();
      for (let k = 0; k < n; k++) { mt.makeTranslation((k + .5) * 75 * S, .32, yy * S); im.setMatrixAt(k, mt); } dunia.add(im); });
    // pemandangan kiri-kanan menurut bagian lintasan
    const warna = [0xffffff, 0xd8e8d0, 0xf0d8c8, 0xd0dcf0, 0xf0e6b8], kiri = Y0 - 120, kanan = Y1 + 120;
    const pindah = (o, x) => { chunk(x).add(o); };   // pindahkan objek dari "dunia" ke kelompoknya
    PK.pl.forEach(q => { if (q.t === 'finis') return; const x0 = q.x + 120, x1 = q.x + q.w - 60, t = q.o.tanah;
      if (t === 'gang' || t === 'kampung') {
        let w = 0; for (let x = x0; x < x1; x += rnd(330, 430)) { const ki = w % 2 === 0; const r = rumah(x * S, (ki ? kiri - 30 : kanan + 30) * S, rnd(3.2, 4.2), warna[(w + (t === 'kampung' ? 2 : 0)) % 5]); if (!ki) r.rotation.y = Math.PI; pindah(r, x); w++; }
        for (let x = x0 + 400, k = 0; x < x1; x += 900, k++) pindah(lampu(x * S, (k % 2 ? Y0 - 18 : Y1 + 18) * S, k % 4 === 0), x);
      } else if (t === 'kebun') {
        for (let x = x0; x < x1; x += rnd(170, 260)) { pindah(pohonPisang(x * S, rnd(kiri - 130, kiri) * S, rnd(.9, 1.2)), x); pindah(pohonPisang((x + 80) * S, rnd(kanan, kanan + 130) * S, rnd(.9, 1.2)), x); }
      } else if (t === 'kubur') {
        for (let x = x0; x < x1; x += rnd(95, 150)) { pindah(nisan(x * S, rnd(kiri - 100, kiri + 20) * S, rnd(-.3, .3)), x); if (Math.random() < .7) pindah(nisan(x * S, rnd(kanan - 20, kanan + 100) * S, rnd(-.3, .3)), x); }
        for (let x = x0 + 300; x < x1; x += 1500) pindah(lampu(x * S, (Y0 - 18) * S, 0), x);
      } });
    DESA = { kenStart: posRonda(-160 * S, (Y0 - 80) * S) };
    // rintangan (ikut dikelompokkan)
    JALAN.ob = R.obs.map(o => { const g = grup(chunk(o.x), o.x * S, 0, o.y * S), e = { o, g, rot: 0 };
      if (o.jenis === 'gerobak') obGerobak(g); else if (o.jenis === 'keranda') obKeranda(g); else if (o.jenis === 'pagar') obPagar(g);
      else if (o.jenis === 'jemuran') e.kain = obJemuran(g); else if (o.jenis === 'kambing') Object.assign(e, obKambing(g));
      g.rotation.y = o.jenis === 'kambing' ? Math.PI / 2 : 0; return e; });
  }
  function updJalan(t, dt, P2) {
    if (!JALAN) return;
    const px = P2.x, kc = Math.floor(px / JALAN.CH);
    for (const k in JALAN.kel) JALAN.kel[k].visible = k >= kc - 1 && k <= kc + 3;   // hanya sekitar hero (±1,5 km di belakang, 6 km di depan)
    JALAN.ob.forEach(e => {
      const o = e.o, dekat = o.x - px > -900 && o.x - px < 4200; if (!dekat) return;
      if (o.jenis === 'kambing') { const zz = o.y * S, arah = zz - e.g.position.z; e.g.position.z = zz; if (Math.abs(arah) > 1e-4) e.g.rotation.y = arah > 0 ? -Math.PI / 2 : Math.PI / 2;   // kepala menghadap arah jalan
        e.kaki.forEach((k, i) => { k.rotation.z = Math.sin(t * 10 + (i % 2) * Math.PI) * .45; }); e.b.position.y = Math.abs(Math.sin(t * 10)) * .03; }
      if (e.kain) e.kain.forEach((m, i) => { m.rotation.x = Math.sin(t * 3 + i * 1.3 + o.x) * .18; });
      if (o.kena) {   // tertabrak: roboh ke samping
        e.rot = Math.min(1, e.rot + dt * 4);
        if (o.jenis === 'jemuran') { if (e.kain) e.kain.forEach(m => { m.position.y = 1.6 - e.rot * 1.4; m.rotation.x = e.rot * 1.2; }); }
        else { e.g.rotation.x = e.rot * (o.y < 380 ? -1.2 : 1.2); e.g.position.y = -e.rot * .05; }
      }
    });
  }

  // ---------- hero 3D ----------
  // Ocong & Kunti dibuat langsung dari bentuk 3D (tanpa file); skin "Ocong Boneka Horor" memakai model .glb
  function buatOcong(skin) {
    const g = new THREE.Group(), emas = skin === 'pocong:emas';
    const kain = new THREE.MeshStandardMaterial(emas ? { color: 0xff9ccf, metalness: .05, roughness: .8 } : { map: T_KAIN, color: 0xffffff, roughness: .95 });
    const prof = [[0, 0], [.15, .02], [.21, .2], [.25, .6], [.265, 1.0], [.245, 1.22], [.165, 1.34], [.205, 1.44], [.215, 1.58], [.16, 1.69], [.06, 1.75], [0, 1.76]].map(p => new THREE.Vector2(p[0], p[1]));
    const badan = new THREE.Mesh(new THREE.LatheGeometry(prof, 22), kain); badan.castShadow = true; g.add(badan);
    const ikat = emas ? new THREE.MeshStandardMaterial({ color: 0xc0508a, metalness: .1, roughness: .7 }) : new THREE.MeshLambertMaterial({ color: 0xbdb5a5 });
    [[1.34, .17], [.16, .2]].forEach(([y, r]) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, .03, 6, 18), ikat); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); });
    for (let i = 0; i < 4; i++) {        // pucuk ikatan kepala
      const c = new THREE.Mesh(new THREE.ConeGeometry(.045, .2, 5), kain); const a = i / 4 * Math.PI * 2;
      c.position.set(Math.cos(a) * .03, 1.82, Math.sin(a) * .03); c.rotation.set(Math.sin(a) * .5, 0, -Math.cos(a) * .5); g.add(c);
    }
    const lubang = new THREE.Mesh(new THREE.CircleGeometry(.12, 20), new THREE.MeshBasicMaterial({ color: 0x0c0d0a }));
    lubang.scale.set(1, 1.15, 1); lubang.position.set(0, 1.5, .214); lubang.rotation.x = -.1; g.add(lubang);
    const muka = new THREE.Mesh(new THREE.SphereGeometry(.1, 14, 10), new THREE.MeshLambertMaterial({ color: 0x8f9a86 }));
    muka.scale.set(1, 1.1, .45); muka.position.set(0, 1.49, .2); g.add(muka);
    const mata = new THREE.MeshBasicMaterial({ color: 0xff3020 });
    [-.04, .04].forEach(x => { const m = new THREE.Mesh(new THREE.SphereGeometry(.017, 8, 6), mata); m.position.set(x, 1.52, .245); g.add(m); });
    const s = TINGGI / 1.82; g.scale.setScalar(s);
    const root = new THREE.Group(), badanG = new THREE.Group(); badanG.add(g); root.add(badanG);
    return { root, badanG, jenis: 'ocong' };
  }
  function buatKunti(skin) {
    const g = new THREE.Group(), merah = skin === 'kuntilanak:merah';
    const baju = new THREE.MeshStandardMaterial({ color: merah ? 0xb3121f : 0xf1efe8, roughness: .9, side: THREE.DoubleSide, emissive: merah ? 0x300000 : 0x1a2233, emissiveIntensity: .6 });
    const prof = [[.44, 0], [.36, .25], [.28, .6], [.22, .95], [.19, 1.18], [.2, 1.32], [.13, 1.42], [.06, 1.45]].map(p => new THREE.Vector2(p[0], p[1]));
    const geo = new THREE.LatheGeometry(prof, 26), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < .1) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); pos.setY(i, y + Math.sin(a * 7) * .05 + Math.sin(a * 3) * .03); } }   // ujung baju compang-camping
    geo.computeVertexNormals();
    const gaun = new THREE.Mesh(geo, baju); gaun.castShadow = true; g.add(gaun);
    const kulit = new THREE.MeshLambertMaterial({ color: 0xd9d2c6 });
    const kepala = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), kulit); kepala.position.y = 1.57; kepala.scale.set(.9, 1.1, .95); g.add(kepala);
    const rambutM = new THREE.MeshLambertMaterial({ color: 0x07070a, side: THREE.DoubleSide });
    const atas = new THREE.Mesh(new THREE.SphereGeometry(.135, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55), rambutM); atas.position.y = 1.59; g.add(atas);
    const profR = [[.2, .55], [.17, .9], [.15, 1.25], [.135, 1.58]].map(p => new THREE.Vector2(p[0], p[1]));
    const belakang = new THREE.Mesh(new THREE.LatheGeometry(profR, 16, Math.PI * .55, Math.PI * .9), rambutM); belakang.castShadow = true; g.add(belakang);
    [-.07, .07].forEach(x => { const h = new THREE.Mesh(new THREE.BoxGeometry(.07, .5, .02), rambutM); h.position.set(x, 1.36, .12); h.rotation.x = .08; g.add(h); });  // rambut menutupi wajah
    const mataM = new THREE.MeshBasicMaterial({ color: 0x220000 }), pupil = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
    [-.04, .04].forEach(x => { const m = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), mataM); m.position.set(x * 1.1, 1.59, .1); m.scale.z = .4; g.add(m); const p = new THREE.Mesh(new THREE.SphereGeometry(.009, 6, 4), pupil); p.position.set(x * 1.1, 1.59, .112); g.add(p); });
    const tangan = [-1, 1].map(sd => {   // lengan terangkat ke depan
      const a = new THREE.Group(); a.position.set(sd * .19, 1.3, 0); g.add(a);
      const l = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, .55, 7), baju); l.position.y = -.25; a.add(l);
      const t = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), kulit); t.position.y = -.53; a.add(t);
      a.rotation.x = -1.1; a.rotation.z = sd * .12; return a;
    });
    g.scale.setScalar(TINGGI / 1.72);
    const root = new THREE.Group(), badanG = new THREE.Group(); badanG.add(g); root.add(badanG);
    return { root, badanG, jenis: 'kunti', tangan, baju };
  }

  // model .glb (skin boneka) — dimuat hanya bila ada pemain yang memakainya
  let BONEKA = null, bonekaMuat = 0;
  function rapikanKlip(clip, model, tRef, putar) {   // sama seperti uji-3d.html: animasi tidak bergeser/berputar sendiri
    const hn = clip.tracks.find(t => /Hips\.quaternion$/.test(t.name));
    const hips = hn && model.getObjectByName(hn.name.split('.')[0]);
    if (!hips) return clip;
    const pq = new THREE.Quaternion(); hips.parent.getWorldQuaternion(pq);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(pq.clone().invert()).normalize();
    const qt = hn, pt = clip.tracks.find(t => /Hips\.position$/.test(t.name));
    if (putar && qt) {
      const i = Math.max(0, qt.times.findIndex(x => x >= tRef)), qr = new THREE.Quaternion().fromArray(qt.values, i * 4);
      const rel = qr.clone().multiply(hips.quaternion.clone().invert());
      const ref = new THREE.Vector3(1, 0, 0); if (Math.abs(ref.dot(up)) > .9) ref.set(0, 0, 1); ref.addScaledVector(up, -ref.dot(up)).normalize();
      const v = ref.clone().applyQuaternion(rel); v.addScaledVector(up, -v.dot(up)).normalize();
      const sudut = Math.atan2(new THREE.Vector3().crossVectors(ref, v).dot(up), ref.dot(v));
      const fix = new THREE.Quaternion().setFromAxisAngle(up, -sudut), q = new THREE.Quaternion();
      for (let k = 0; k < qt.values.length; k += 4) q.fromArray(qt.values, k).premultiply(fix).toArray(qt.values, k);
      if (pt) { const p = new THREE.Vector3(); for (let k = 0; k < pt.values.length; k += 3) p.fromArray(pt.values, k).applyQuaternion(fix).toArray(pt.values, k); }
    }
    if (pt) {
      const v0 = new THREE.Vector3().fromArray(pt.values, 0), h0 = v0.clone().addScaledVector(up, -v0.dot(up)), p = new THREE.Vector3();
      for (let k = 0; k < pt.values.length; k += 3) { p.fromArray(pt.values, k); const tegak = p.dot(up); h0.clone().addScaledVector(up, tegak).toArray(pt.values, k); }
    }
    return clip;
  }
  function muatBoneka() {
    if (bonekaMuat) return; bonekaMuat = 1;
    new GLTFLoader().load(MODEL_BONEKA, gl => {
      const m = gl.scene; m.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.material) o.material.envMapIntensity = .6; } });
      const bb = new THREE.Box3().setFromObject(m), h = bb.max.y - bb.min.y; m.scale.setScalar(TINGGI / h); m.position.y = -bb.min.y * TINGGI / h;
      const cari = k => gl.animations.find(a => a.name.toLowerCase().includes(k)), sub = (c, n, a, b) => THREE.AnimationUtils.subclip(c, n, a, b, 24);
      const lompat = cari('jump_rope_01'), diam = cari('pocong') || gl.animations[0], K = {};
      if (lompat) { K.jalan = rapikanKlip(sub(lompat, 'jalan', 22, 46), m, .2, true); K.loncat = rapikanKlip(sub(lompat, 'loncat', 18, 34), m, .2, true); }
      if (diam) K.diam = rapikanKlip(diam.clone(), m, 0, false);
      BONEKA = { m, K };
      for (const k in HERO) if (HERO[k].skin === 'pocong:boneka') { buang(k); }   // ganti boneka sementara dengan model asli
    }, undefined, () => { BONEKA = null; });
  }
  // hero Ocong: model Pocong Lompat (animasi Hop & Idle), dimuat sekali lalu digandakan untuk tiap pemain
  let OCONG3D = null, ocongMuat = 0;
  function muatOcong3D() {
    if (ocongMuat) return; ocongMuat = 1;
    new GLTFLoader().load(MODEL_OCONG, gl => {
      const m = gl.scene; m.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.material) o.material.envMapIntensity = .6; } });
      const bb = new THREE.Box3().setFromObject(m), h = bb.max.y - bb.min.y, sk = TINGGI / h;
      m.scale.set(sk * 1.2, sk, sk * 1.2); m.position.y = -bb.min.y * sk;   // sedikit gemuk, sama seperti di Game 3D
      const cari = n => THREE.AnimationClip.findByName(gl.animations, n), hop = cari('Hop'), idle = cari('Idle') || hop;
      OCONG3D = { m, K: { jalan: hop, diam: idle } };
      for (const k in HERO) if (HERO[k].jenis === 'ocong') buang(k);   // ganti Ocong sementara dengan model asli
    }, undefined, () => { OCONG3D = null; });
  }
  function buatOcong3D(skin) {
    const m = SkeletonUtils.clone(OCONG3D.m), mixer = new THREE.AnimationMixer(m), act = {};
    for (const n in OCONG3D.K) if (OCONG3D.K[n]) act[n] = mixer.clipAction(OCONG3D.K[n]);
    if (skin === 'pocong:emas') m.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color = new THREE.Color(0xff9ccf); o.material.metalness = .05; o.material.roughness = .7; } });
    const root = new THREE.Group(), badanG = new THREE.Group(); badanG.add(m); root.add(badanG);
    return { root, badanG, jenis: 'lompat', mixer, act, cur: '' };
  }
  // Kunti (utama & merah) dan Tuyul: model 3D yang sama dengan Game 3D
  const MODEL_LAIN = {
    kunti: { url: 'model-3d/skinkunti-asli.glb', tinggi: TINGGI, klip: { diam: 'melayang', jalan: 'melayang', terbang: 'terbang' } },
    merah: { url: 'model-3d/skinkunti.glb', tinggi: TINGGI, klip: { diam: 'melayang', jalan: 'melayang', terbang: 'terbang' } },
    tuyul: { url: 'model-3d/tuyul.glb', tinggi: 1.15, klip: { diam: 'diam', jalan: 'lari', loncat: 'lompat' } },
  };
  const M3D = {};
  function muatM3D(kunci) {
    const c = MODEL_LAIN[kunci]; if (!c || c.muat) return; c.muat = 1;
    new GLTFLoader().load(c.url, gl => {
      const m = gl.scene; m.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.material) o.material.envMapIntensity = .6; } });
      const bb = new THREE.Box3().setFromObject(m), h = bb.max.y - bb.min.y, sk = c.tinggi / h; m.scale.setScalar(sk); m.position.y = -bb.min.y * sk;
      const K = {}; for (const n in c.klip) { const a = gl.animations.find(x => x.name === c.klip[n]); if (a) K[n] = rapikanKlip(a.clone(), m, 0, false); }
      if (!K.jalan) K.jalan = K.diam;
      M3D[kunci] = { m, K };
      for (const k in HERO) if (HERO[k].kunci3d === kunci && !HERO[k].mixer) buang(k);   // ganti bentuk sementara dengan model asli
    }, undefined, () => { });
  }
  function buatM3D(kunci) {
    const D = M3D[kunci], m = SkeletonUtils.clone(D.m), mixer = new THREE.AnimationMixer(m), act = {};
    for (const n in D.K) act[n] = mixer.clipAction(D.K[n]);
    if (act.loncat) { act.loncat.setLoop(THREE.LoopOnce); act.loncat.clampWhenFinished = true; }
    const root = new THREE.Group(), badanG = new THREE.Group(); badanG.add(m); root.add(badanG);
    return { root, badanG, jenis: kunci === 'tuyul' ? 'tuyul3d' : 'kunti3d', mixer, act, cur: '' };
  }
  function buatBoneka() {
    const m = SkeletonUtils.clone(BONEKA.m), mixer = new THREE.AnimationMixer(m), act = {};
    for (const n in BONEKA.K) { act[n] = mixer.clipAction(BONEKA.K[n]); }
    if (act.loncat) { act.loncat.setLoop(THREE.LoopOnce); act.loncat.clampWhenFinished = true; }
    const root = new THREE.Group(), badanG = new THREE.Group(); badanG.add(m); root.add(badanG);
    return { root, badanG, jenis: 'boneka', mixer, act, cur: '' };
  }
  function mainAnim(h, nama) {
    const a = h.act[nama]; if (!a || h.cur === nama) return;
    a.reset().setEffectiveWeight(1).fadeIn(.15).play(); const lama = h.act[h.cur]; if (lama) lama.fadeOut(.15); h.cur = nama;
  }

  const HERO = {};
  const BAYANGAN = new THREE.CircleGeometry(.36, 20), M_BAY = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .45, depthWrite: false });
  function buang(k) { const h = HERO[k]; if (!h) return; scene.remove(h.root, h.bay); if (h.mixer) h.mixer.stopAllAction(); h.root.traverse(o => { if (o.geometry && o.geometry !== BAYANGAN) o.geometry.dispose(); }); delete HERO[k]; }
  function heroUntuk(k, id, skin) {
    let h = HERO[k];
    const mauBoneka = id === 'pocong' && skin === 'pocong:boneka';
    if (h && (h.id !== id || h.skin !== skin || (mauBoneka && BONEKA && h.jenis !== 'boneka'))) { buang(k); h = null; }
    if (!h) {
      const kunci3d = id === 'tuyul' ? 'tuyul' : id === 'kuntilanak' ? (skin === 'kuntilanak:merah' ? 'merah' : 'kunti') : '';
      if (kunci3d) muatM3D(kunci3d); else if (mauBoneka) muatBoneka(); else muatOcong3D();
      h = kunci3d && M3D[kunci3d] ? buatM3D(kunci3d) : id === 'tuyul' ? buatOcong('') : id === 'kuntilanak' ? buatKunti(skin) : mauBoneka && BONEKA ? buatBoneka() : !mauBoneka && OCONG3D ? buatOcong3D(skin) : buatOcong(skin);
      h.id = id; h.skin = skin; h.arah = 0; h.hop = 0; h.kunci3d = kunci3d;
      h.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
      h.bay = new THREE.Mesh(BAYANGAN, M_BAY.clone()); h.bay.rotation.x = -Math.PI / 2; h.bay.renderOrder = 1;
      scene.add(h.root, h.bay); HERO[k] = h;
    }
    h.pakai = 1; return h;
  }
  function dasarDi(P2) {   // tinggi pijakan di bawah hero (untuk bayangan bulat)
    if (P2.gr && P2.gr.z != null) return P2.gr.z;
    const l = pkDi(P2.x, P2.y).filter(q => q.z <= P2.z + 1).sort((a, b) => b.z - a.z)[0];
    return l ? l.z : null;
  }
  function aturHero(h, P2, dt, t, saya) {
    const sembunyi = P2.mati > 40 || (saya && P2.mati > 0 && P2.z < AIR);
    h.root.visible = !sembunyi; h.bay.visible = false;
    if (sembunyi) return;
    const x = P2.x * S, y = P2.z * S, z = P2.y * S, diTanah = !!P2.gr, jalan = P2.walk > 0 && diTanah;
    // arah hadap halus
    const tuju = Math.atan2(P2.fvx || 0, P2.fvy || 0);
    let da = tuju - h.arah; da = Math.atan2(Math.sin(da), Math.cos(da)); h.arah += da * Math.min(1, dt * 12);
    h.root.position.set(x, y, z); h.root.rotation.y = h.arah;
    const B = h.badanG; B.position.set(0, 0, 0); B.rotation.set(0, 0, 0); B.scale.set(1, 1, 1);
    if (h.jenis === 'ocong') {
      if (jalan) { h.hop += dt * 9; const s = Math.abs(Math.sin(h.hop)); B.position.y = s * .2; B.scale.set(1 + (1 - s) * .06, 1 - (1 - s) * .08, 1 + (1 - s) * .06); }
      else if (diTanah) { h.hop += dt * 4.5; const s = Math.abs(Math.sin(h.hop)); B.position.y = s * .06; B.scale.y = 1 - (1 - s) * .04; }   // idle: loncat kecil
      else { B.rotation.x = THREE.MathUtils.clamp(-(P2.vz || 0) * .03, -.25, .25); B.scale.set(.96, 1.06, .96); }
    } else if (h.jenis === 'kunti') {
      B.position.y = .18 + Math.sin(t * 2.4 + h.arah) * .06;
      B.rotation.x = P2.walk > 0 ? .22 : .05;
      h.tangan.forEach((a, i) => { a.rotation.x = -1.1 + Math.sin(t * 3 + i * 1.7) * .12; });
      h.baju.emissiveIntensity = P2.glide > 0 ? 2.2 : .6;
    } else if (h.jenis === 'kunti3d') {   // melayang; pose terbang saat meluncur / di udara
      B.position.y = .15 + Math.sin(t * 2.4 + h.arah) * .06; B.rotation.x = P2.walk > 0 ? .18 : 0;
      mainAnim(h, (P2.glide > 0 || !diTanah) && h.act.terbang ? 'terbang' : 'diam'); h.mixer.update(dt);
    } else if (h.jenis === 'tuyul3d') {
      mainAnim(h, !diTanah && h.act.loncat ? 'loncat' : jalan ? 'jalan' : 'diam'); h.mixer.update(dt * (jalan ? 1.2 : 1));
    } else if (h.jenis === 'lompat') {
      mainAnim(h, jalan || !diTanah ? 'jalan' : 'diam'); h.mixer.update(dt * (jalan ? 1.4 : 1));
      if (!diTanah) B.rotation.x = THREE.MathUtils.clamp(-(P2.vz || 0) * .03, -.25, .25);
    } else if (h.jenis === 'boneka') {
      mainAnim(h, !diTanah ? 'loncat' : jalan ? 'jalan' : 'diam'); h.mixer.update(dt * (jalan ? 1.3 : 1));
    }
    if (P2.duck && diTanah) { B.scale.set(B.scale.x * 1.18, B.scale.y * .52, B.scale.z * 1.18); B.position.y = 0; B.rotation.x = .25; }   // merunduk (Lari Jalan Desa)
    // bayangan bulat di pijakan bawah (membantu memperkirakan lompatan)
    const b = dasarDi(P2);
    if (b != null) {
      const tg = Math.max(0, P2.z - b), k = Math.max(.35, 1 - tg / 180);
      h.bay.visible = true; h.bay.position.set(x, b * S + .015, z); h.bay.scale.setScalar(k); h.bay.material.opacity = .5 * k;
    }
  }

  // ---------- percikan air / bara api ----------
  const PERCIK = [];
  function percik(x, y, z, warna, n = 26, kuat = 3) {
    const p = new Float32Array(n * 3), v = [];
    for (let i = 0; i < n; i++) { p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; const a = rnd(0, 7), r = rnd(.3, 1) * kuat; v.push(new THREE.Vector3(Math.cos(a) * r * .5, rnd(.6, 1.2) * kuat, Math.sin(a) * r * .5)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: warna, size: .12, transparent: true, depthWrite: false })); pts.frustumCulled = false;
    scene.add(pts); PERCIK.push({ pts, v, t: 0 });
  }
  function updPercik(dt) {
    for (let i = PERCIK.length - 1; i >= 0; i--) {
      const e = PERCIK[i], a = e.pts.geometry.attributes.position.array; e.t += dt;
      e.v.forEach((v, j) => { v.y -= 9.8 * dt; a[j * 3] += v.x * dt; a[j * 3 + 1] += v.y * dt; a[j * 3 + 2] += v.z * dt; });
      e.pts.geometry.attributes.position.needsUpdate = true; e.pts.material.opacity = Math.max(0, 1 - e.t / .9);
      if (e.t > .9) { scene.remove(e.pts); e.pts.geometry.dispose(); e.pts.material.dispose(); PERCIK.splice(i, 1); }
    }
  }
  const status = {};   // ingat keadaan tiap hero (untuk efek saat masuk air / terbakar)
  function cekEfek(k, P2) {
    const s = status[k] || (status[k] = { bawah: 0, mati: 0 });
    const bawah = P2.z < AIR;
    if (bawah && !s.bawah && P2.mati <= 40) percik(P2.x * S, AIR * S + .05, P2.y * S, 0x9fd8ff, 34, 3.2);
    if (P2.mati > 0 && !s.mati && !bawah) percik(P2.x * S, P2.z * S + .8, P2.y * S, 0xffa040, 30, 2.2);
    s.bawah = bawah; s.mati = P2.mati > 0;
  }

  // ---------- kamera ----------
  const camT = new THREE.Vector3(), camPos = new THREE.Vector3();
  let camZ = 0, camBaru2 = 1;
  let camBaru = 1, tPrev = performance.now(), ukuran = '';
  function ukurUlang() {
    const w = wrap.clientWidth, h = wrap.clientHeight, u = w + 'x' + h;
    if (u === ukuran || !w || !h) return; ukuran = u;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  const proyV = new THREE.Vector3();
  window.PK3 = {
    ok: 1,
    // ubah posisi dunia (piksel) ke titik di kanvas HUD 800x400
    proj(x, y, z) { proyV.set(x * S, z * S, y * S).project(camera); return [(proyV.x + 1) / 2 * 800, (1 - proyV.y) / 2 * 400, proyV.z < 1]; },
    hide() { if (cv.style.display !== 'none') { cv.style.display = 'none'; camBaru = 1; } },
    draw() {
      try { return gambar(); } catch (e) { console.error('[Parkur 3D]', e); window.PK3.ok = 0; cv.style.display = 'none'; return false; }
    }
  };

  function gambar() {
    const P2 = PK.p; if (!P2 || !PK.pl || !PK.pl.length) return false;
    if (lvl !== PK.pl) { bangun(); camBaru = 1; }
    if (cv.style.display === 'none') cv.style.display = 'block';
    ukurUlang();
    const now = performance.now(), dt = Math.min(.05, (now - tPrev) / 1000), t = now / 1000; tPrev = now;

    // pijakan: bergerak, bergetar, runtuh
    const api = pkApi(), awas = !api && fr % 130 > 55;
    PL.forEach(e => {
      const q = e.q; let gx = pkPx(q) * S, gy = 0, gz = pkPy(q) * S;
      if (q.turun) { const a = Math.max(0, 1 - (200 - q.turun) / 25); gy = -(200 - q.turun) * 3 * S; e.g.visible = a > 0; }
      else { e.g.visible = true; if (q.tm) gx += Math.sin(fr * 1.3) * 2 * S; }
      e.g.position.set(gx, gy, gz);
      if (e.lampu) { const on = e.cpIdx >= 0 && e.cpIdx <= PK.cp; e.lampu.material.color.setHex(on ? 0x3fd14b : 0x777777); e.lampu.material.emissive.setHex(on ? 0x2a9a30 : 0x000000); e.lampuG.material.opacity = on ? .9 : 0; }
      if (e.api) {
        const s = api ? 1.9 + Math.sin(t * 30) * .2 : .8 + Math.sin(t * 12) * .08;
        e.api.scale.set(api ? 1.6 : 1, s, api ? 1.6 : 1); e.api.position.y = e.top + .6 + s * .3;
        e.apiG.scale.setScalar(api ? 4.5 : 1.6); e.apiG.position.y = e.top + .9 + (api ? .6 : 0);
        e.lantai.material.opacity = api ? .55 + Math.sin(t * 25) * .1 : 0;
        e.kobar.forEach((k, i) => { k.material.opacity = api ? .8 : 0; const s2 = 1.1 + Math.sin(t * 20 + i * 2) * .3; k.scale.set(s2 * .9, s2 * 1.6, 1); k.position.y = e.top + .5 + Math.sin(t * 17 + i) * .1; });
        e.awas.material.opacity = awas ? (Math.sin(t * 18) > 0 ? 1 : .3) : 0;
        e.cahaya.intensity = api ? 18 : 3;
      }
    });
    updDesa(t, dt); updJalan(t, dt, P2);
    // lampion
    KOIN.forEach(k => { k.g.visible = !k.c.ok; if (!k.c.ok) { k.g.position.y = k.y0 + Math.sin(t * 2.6 + k.c.x) * .06; k.g.rotation.y = t * 1.5 + k.c.x; } });
    // hero: saya + pemain online lain
    for (const k in HERO) HERO[k].pakai = 0;
    const saya = heroUntuk('me', P2.id, P2.skin || ''); aturHero(saya, P2, dt, t, 1); cekEfek('me', P2);
    if (PK.net) for (const k in PKN.ot) {
      const o = PKN.ot[k]; if (!o.ok) continue;
      const h = heroUntuk('o' + k, o.id, o.skin || ''); aturHero(h, o, dt, t, 0); cekEfek('o' + k, o);
    }
    for (const k in HERO) if (!HERO[k].pakai) buang(k);
    updPercik(dt);

    // air mengalir
    T_AIR.offset.x = (T_AIR.offset.x + dt * .03) % 1; T_AIR.offset.y = Math.sin(t * .5) * .02;

    // kamera mengikuti hero (melihat sedikit ke depan arah gerak)
    const dasar = P2.gr ? P2.z : Math.max(P2.z, P2.z * .6);
    const tx = (P2.x + (P2.fvx || 0) * 90) * S, ty = Math.max(AIR, dasar) * S + .9, tz = (P2.y + (P2.fvy || 0) * 25) * S;
    if (camBaru) { camT.set(tx, ty, tz); camBaru = 0; }
    else { const kx = 1 - Math.pow(.02, dt), ky = 1 - Math.pow(.12, dt); camT.x += (tx - camT.x) * kx; camT.y += (ty - camT.y) * ky; camT.z += (tz - camT.z) * kx; }
    if (PK.run) {   // Lari Jalan Desa: kamera di belakang hero (seperti game lari 3 jalur), ikut pindah jalur dengan halus
      if (camBaru2) { camZ = P2.y * S; camBaru2 = 0; } camZ += (P2.y * S - camZ) * (1 - Math.pow(.004, dt));
      const hx = P2.x * S, hy = Math.max(0, P2.z * S);
      const tengah = (PK.pl[0].y + PK.pl[0].d / 2) * S;   // kamera agak tertarik ke tengah jalan supaya 5 jalur terlihat
      camT.set(hx + 5.5, .9 + hy * .35, camZ * .65 + tengah * .35);
      camera.position.set(hx - 5.6, 3.4 + hy * .45, camZ * .75 + tengah * .25); camera.lookAt(camT);
      langit.position.set(camera.position.x, 0, camT.z);
    } else {
      camBaru2 = 1;
      camPos.copy(camT).add(CAM_OFF); camera.position.copy(camPos); camera.lookAt(camT.x, camT.y, camT.z);
      langit.position.set(camT.x * .85, 0, 0);
    }
    bulanL.position.copy(camT).add(ARAH_BULAN); bulanL.target.position.copy(camT);
    obor.position.set(P2.x * S, P2.z * S + 2.2, P2.y * S + 1.2);

    renderer.render(scene, camera);
    return true;
  }
}
