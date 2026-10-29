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

  // ---------- kali (air) & tepi seberang ----------
  const air = new THREE.Mesh(new THREE.PlaneGeometry(400, 90), new THREE.MeshPhongMaterial({ map: T_AIR, color: 0x6f9ec0, specular: 0x1c2c44, shininess: 25, transparent: true, opacity: .93 }));
  air.rotation.x = -Math.PI / 2; air.position.set(60, AIR * S, 20); air.receiveShadow = true; scene.add(air);
  const dasar = new THREE.Mesh(new THREE.PlaneGeometry(400, 90), new THREE.MeshBasicMaterial({ color: 0x03080d }));
  dasar.rotation.x = -Math.PI / 2; dasar.position.set(60, AIR * S - 3, 20); scene.add(dasar);
  const tepi = new THREE.Mesh(new THREE.BoxGeometry(400, 1.4, 14), new THREE.MeshLambertMaterial({ map: T_RUMPUT }));
  tepi.position.set(60, -.25, -7.6); tepi.receiveShadow = true; scene.add(tepi);
  const tepiDepan = new THREE.Mesh(new THREE.BoxGeometry(400, 1.4, 10), new THREE.MeshLambertMaterial({ map: T_RUMPUT }));
  tepiDepan.position.set(60, -1.9, 19.5); scene.add(tepiDepan);   // tepi dekat kamera (lebih rendah, tidak menghalangi)

  // pepohonan, rumpun bambu & nisan di tepi seberang
  const M_BAMBU = new THREE.MeshLambertMaterial({ color: 0x3f6b2e }), M_DAUN = new THREE.MeshLambertMaterial({ color: 0x14301a }),
    M_KAYU = new THREE.MeshLambertMaterial({ color: 0x3a2716 }), M_NISAN = new THREE.MeshLambertMaterial({ color: 0x8b8a83 }),
    M_TALI = new THREE.MeshLambertMaterial({ color: 0x5a4220 });
  const hiasan = new THREE.Group(); scene.add(hiasan);
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
    const dasarY = AIR * S - 2.5;
    PK.pl.forEach(q => {
      const g = new THREE.Group(), w = q.w * S, d = q.d * S, top = q.z * S; dunia.add(g);
      const e = { q, g, top };
      if (q.t === 'bambu') {
        [.2, .5, .8].forEach(f => { const b = tabung(.07, .07, w, M.bambu, w / 2, top - .07, d * f, g, 7); b.rotation.z = Math.PI / 2; });
        for (let x = .3; x < w; x += 1.1) {
          [.1, .9].forEach(f => tabung(.06, .06, top - dasarY, M_KAYU, x, (top + dasarY) / 2, d * f, g, 6));
          const t = kotak(.05, .05, d + .1, M_TALI, x, top - .02, d / 2, g); t.castShadow = false;
        }
      } else {
        const mt = q.t === 'runtuh' ? M.retak : q.t === 'finis' ? M.papan : q.t === 'cp' ? M.lumut : M.tanah;
        const atas = kotak(w, .26, d, matUlang(mt, w / 2, d / 2), w / 2, top - .13, d / 2, g); atas.material._sekali = 1;
        const tg = top - .26 - dasarY;
        const tiang = kotak(w * .94, tg, d * .94, matUlang(M.batu, w / 1.8, tg / 1.8), w / 2, dasarY + tg / 2, d / 2, g); tiang.material._sekali = 1;
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
      if (q.t === 'finis') {                // gapura merah + papan FINIS
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

  // ---------- hero 3D ----------
  // Ocong & Kunti dibuat langsung dari bentuk 3D (tanpa file); skin "Ocong Boneka Horor" memakai model .glb
  function buatOcong(skin) {
    const g = new THREE.Group(), emas = skin === 'pocong:emas';
    const kain = new THREE.MeshStandardMaterial(emas ? { color: 0xe0b04a, metalness: .55, roughness: .45 } : { map: T_KAIN, color: 0xffffff, roughness: .95 });
    const prof = [[0, 0], [.15, .02], [.21, .2], [.25, .6], [.265, 1.0], [.245, 1.22], [.165, 1.34], [.205, 1.44], [.215, 1.58], [.16, 1.69], [.06, 1.75], [0, 1.76]].map(p => new THREE.Vector2(p[0], p[1]));
    const badan = new THREE.Mesh(new THREE.LatheGeometry(prof, 22), kain); badan.castShadow = true; g.add(badan);
    const ikat = emas ? new THREE.MeshStandardMaterial({ color: 0x8a5a10, metalness: .6, roughness: .5 }) : new THREE.MeshLambertMaterial({ color: 0xbdb5a5 });
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
      if (mauBoneka) muatBoneka();
      h = id === 'kuntilanak' ? buatKunti(skin) : mauBoneka && BONEKA ? buatBoneka() : buatOcong(skin);
      h.id = id; h.skin = skin; h.arah = 0; h.hop = 0;
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
    } else if (h.jenis === 'boneka') {
      mainAnim(h, !diTanah ? 'loncat' : jalan ? 'jalan' : 'diam'); h.mixer.update(dt * (jalan ? 1.3 : 1));
    }
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
    camPos.copy(camT).add(CAM_OFF); camera.position.copy(camPos); camera.lookAt(camT.x, camT.y, camT.z);
    langit.position.set(camT.x * .85, 0, 0);
    bulanL.position.copy(camT).add(ARAH_BULAN); bulanL.target.position.copy(camT);
    obor.position.set(P2.x * S, P2.z * S + 2.2, P2.y * S + 1.2);

    renderer.render(scene, camera);
    return true;
  }
}
