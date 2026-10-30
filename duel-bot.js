// =====================================================================
//  duel-bot.js — lawan bot OCONG 3D untuk uji-3d.html & uji-2d3d.html
//  Bot ikut terdaftar di daftar MUSUH halaman, jadi semua skill pemain
//  (Ocong maupun Kunti) otomatis bisa mengenai bot ini.
// =====================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/*
  env = {
    scene, model: 'model-3d/skinocong.glb', tinggi: 1.7,
    pemain: P,                         // objek pemain halaman (P.root, P.state)
    kenaPemain(dmg, dari, dorong),     // fungsi halaman untuk melukai pemain
    pemainAktif(),                     // false kalau pemain mati / sedang menghilang
    batasi(v), skala(v),               // jaga di dalam arena, skala kedalaman (2d3d)
    jarak: 1, cepat: 1,                // pengali jarak & kecepatan (arena 2d3d lebih kecil)
    efek: { gelombang(pos,R,umur,warna), percik(pos,n,warna,kuat,ukuran), kilat(pos,kuat), goyang(v) },
    rapikanKlip(clip, model, tRef, putar),
    bar,                               // elemen <div class="hp"> untuk darah bot
    posAwal: Vector3,
    selesai(hasil)                     // dipanggil 'menang' saat bot kalah
  }
*/
export async function buatBotOcong(env) {
  const J = env.jarak ?? 1, CEPAT = env.cepat ?? 1;
  const gl = await new GLTFLoader().loadAsync(env.model);
  const m = gl.scene, bahan = [];
  m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.material = o.material.clone(); if (o.material.emissive) { o.material.emissive = new THREE.Color(0x7a0808); o.material.emissiveIntensity = .3; } bahan.push(o.material); } });
  const bb = new THREE.Box3().setFromObject(m), h = bb.max.y - bb.min.y;
  m.scale.setScalar(env.tinggi / h); m.position.y = -bb.min.y * env.tinggi / h;

  const root = new THREE.Group(), tilt = new THREE.Group(); root.add(tilt); tilt.add(m); env.scene.add(root);
  root.position.copy(env.posAwal);

  // ---- animasi (sama dengan pemain Ocong) ----
  const mixer = new THREE.AnimationMixer(m), act = {};
  const cari = k => gl.animations.find(a => a.name.toLowerCase().includes(k));
  const sub = (c, n, a, b) => THREE.AnimationUtils.subclip(c, n, a, b, 24);
  const sekali = a => { a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; return a; };
  const lompat = cari('jump_rope_01'), guling = cari('rolling'), kalah = cari('defeat'), diam = cari('pocong') || gl.animations[0];
  if (lompat) { act.jalan = mixer.clipAction(env.rapikanKlip(sub(lompat, 'jalan', 22, 46), m, .2, true)); act.loncat = sekali(mixer.clipAction(env.rapikanKlip(sub(lompat, 'loncat', 18, 34), m, .2, true))); }
  if (guling) act.guling = sekali(mixer.clipAction(env.rapikanKlip(sub(guling, 'guling', 14, 58), m, 0, true)));
  if (kalah) act.kalah = sekali(mixer.clipAction(env.rapikanKlip(kalah, m, .4, false)));
  if (diam) act.diam = mixer.clipAction(env.rapikanKlip(diam.clone(), m, 0, false));
  let cur = '';
  function main(n, fade = .15, cepat = 1) { const a = act[n]; if (!a) return; a.timeScale = cepat; if (cur === n) return; a.reset().setEffectiveWeight(1).fadeIn(fade).play(); if (act[cur]) act[cur].fadeOut(fade); cur = n; }
  function mainUlang(n, fade, cepat) { if (cur === n) cur = ''; main(n, fade, cepat); }
  main('diam');

  // ---- tanda peringatan merah di lantai (supaya pemain sempat menghindar) ----
  const TANDA = [];
  function tanda(pos, R, umur) {
    const g = new THREE.Group();
    const isi = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: .18, depthWrite: false, blending: THREE.AdditiveBlending }));
    const tepi = new THREE.Mesh(new THREE.RingGeometry(.92, 1, 48), new THREE.MeshBasicMaterial({ color: 0xff4030, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending }));
    [isi, tepi].forEach(o => { o.rotation.x = -Math.PI / 2; g.add(o); });
    g.position.copy(pos).setY(.05); g.scale.setScalar(R); env.scene.add(g);
    const e = { g, isi, tepi, t: 0, umur }; TANDA.push(e); return e;
  }
  function updTanda(dt) {
    for (let i = TANDA.length - 1; i >= 0; i--) { const e = TANDA[i]; e.t += dt; const q = e.t / e.umur;
      e.isi.material.opacity = .12 + .25 * q; e.tepi.material.opacity = .5 + .5 * Math.abs(Math.sin(e.t * 14));
      if (e.t >= e.umur) { env.scene.remove(e.g); e.g.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); }); TANDA.splice(i, 1); } }
  }

  // ---- data bot, didaftarkan ke MUSUH halaman ----
  const mt = { g: root, hp: 1000, v: new THREE.Vector3(), y: 0, vy: 0, putar: 0, kilau: 0, mati: 0, kunci: 0, pusing: 0, bar: env.bar, bot: true, asal: env.posAwal.clone(), nama: 'Ocong (bot)' };
  const B = { state: 'bebas', t: 0, arah: Math.PI, cd: [0, 3, 4, 8], pikir: 0, hit: 0, sudahSelesai: false };
  const CD = [1.2, 6, 7, 10];

  const kePemain = () => env.pemain.root.position.clone().sub(root.position).setY(0);
  function hadapPemain() { const d = kePemain(); if (d.lengthSq() > .01) B.arah = Math.atan2(d.x, d.z); }
  const depan = () => new THREE.Vector3(Math.sin(B.arah), 0, Math.cos(B.arah));
  const jarakPemain = () => kePemain().length();
  function mulai(s) { B.state = s; B.t = 0; B.hit = 0; }

  function upd(dt) {
    const pos = root.position, ef = env.efek, sk = env.skala ? env.skala(pos) : 1;
    updTanda(dt);
    // --- kalah ---
    if (mt.mati) {
      if (!B.sudahSelesai) { B.sudahSelesai = true; B.state = 'kalah'; mainUlang('kalah', .1); TANDA.forEach(e => e.t = e.umur); env.selesai && env.selesai('menang'); }
      mt.vy -= 20 * dt; mt.y = Math.max(0, mt.y + mt.vy * dt); tilt.position.y = mt.y; mt.mati = Math.max(.01, mt.mati);   // tetap terbaring sampai Main Lagi
      mixer.update(dt); if (mt.bar) mt.bar.style.display = 'none'; return;
    }
    // --- fisika terkena serangan pemain ---
    pos.addScaledVector(mt.v, dt); mt.v.multiplyScalar(Math.pow(.02, dt));
    mt.vy -= 20 * dt; mt.y = Math.max(0, mt.y + mt.vy * dt); if (mt.y === 0 && mt.vy < 0) mt.vy = 0;
    if (mt.kilau > 0) mt.kilau -= dt;
    bahan.forEach(b => { if (b.emissive) { b.emissive.setHex(mt.kilau > 0 ? 0xff3030 : mt.kunci > 0 ? 0x6020a0 : 0x7a0808); b.emissiveIntensity = mt.kilau > 0 ? 1.1 : .3; } });
    const pingsan = mt.kunci > 0 || mt.pusing > 0;
    mt.pusing = Math.max(0, mt.pusing - dt); mt.kunci = Math.max(0, mt.kunci - dt);
    if (mt.kunci > 0) mt.v.set(0, 0, 0);
    B.cd = B.cd.map(c => Math.max(0, c - dt)); B.t += dt; B.pikir -= dt;
    tilt.rotation.set(0, 0, 0); tilt.scale.set(1, 1, 1); let naik = 0;
    if (pingsan && B.state !== 'loncat') { B.state = 'bebas'; main('diam', .2); tilt.rotation.z = Math.sin(performance.now() / 90) * .12; }
    const L = jarakPemain(), aktif = env.pemainAktif();

    if (B.state === 'bebas' && !pingsan) {
      if (aktif) hadapPemain();
      if (!aktif) main('diam', .25);
      else if (B.pikir <= 0 && B.cd[3] <= 0 && L < 2.4 * J) { mulai('lingkaran'); tanda(pos, 2.7 * J, .55); }
      else if (B.pikir <= 0 && B.cd[1] <= 0 && L > 3 * J && L < 7 * J) {
        mulai('loncat'); B.awal = pos.clone(); const dk = kePemain(); B.tujuan = pos.clone().addScaledVector(dk.normalize(), Math.max(0, L - .9 * J)).setY(0); env.batasi(B.tujuan); /* mendarat di depan pemain, tidak menimpa */ tanda(B.tujuan, 2 * J, .9); ef.gelombang(pos, 1.4 * J, .4, 0xff4020); }
      else if (B.pikir <= 0 && B.cd[2] <= 0 && L < 5 * J && L > 1.8 * J) { mulai('guling'); B.kenaT = 0; mainUlang('guling', .08, 1.6); }
      else if (B.cd[0] <= 0 && L < 1.5 * J) mulai('sundul');
      else if (L > 1.25 * J) { const d = kePemain().normalize(); pos.addScaledVector(d, 2.7 * CEPAT * sk * dt); main('jalan', .15, 1.5); }
      else main('diam', .25);
      if (B.state !== 'bebas') { B.pikir = .5 + Math.random() * .6; }   // jeda berpikir: bot tidak memakai skill beruntun
    }
    else if (B.state === 'sundul') {            // ancang-ancang → menerjang → hantam
      const t = B.t; main('diam', .1);
      if (t < .3) { const c = t / .3; tilt.scale.set(1 + .08 * c, 1 - .14 * c, 1 + .08 * c); tilt.rotation.x = -.18 * c; }
      else if (t < .42) { pos.addScaledVector(depan(), 6 * J * dt); tilt.rotation.x = .5; }
      else if (!B.hit) { B.hit = 1; const hp = pos.clone().addScaledVector(depan(), .9 * J);
        ef.percik(hp, 20, 0xff7040, 3.5 * J, .16); ef.kilat(hp, 20);
        if (env.pemain.root.position.distanceTo(hp) < 1.3 * J) env.kenaPemain(45 + Math.round(Math.random() * 10), pos, 4); }
      else tilt.rotation.x = .35 * Math.max(0, 1 - (t - .42) / .2);
      if (t > .7) { B.state = 'bebas'; B.cd[0] = CD[0]; }
    }
    else if (B.state === 'loncat') {            // jongkok → melayang → mendarat (lihat tanda merah)
      const t = B.t, NA = .3, TB = .6;
      if (t < NA) { const c = t / NA; tilt.scale.set(1 + .12 * c, 1 - .2 * c, 1 + .12 * c); main('diam', .1); }
      else if (t < NA + TB) { const u = (t - NA) / TB, e = u * u * (3 - 2 * u) * .3 + u * .7; main('loncat', .05, 1.4);
        pos.lerpVectors(B.awal, B.tujuan, e); naik = 2.8 * J * 4 * u * (1 - u); tilt.rotation.x = -.25 + .5 * u; }
      else if (!B.hit) { B.hit = 1; pos.copy(B.tujuan);
        ef.gelombang(pos, 3.4 * J, .55, 0xff4020); ef.gelombang(pos, 2 * J, .4, 0xffa040); ef.percik(pos, 50, 0xff5020, 5.5 * J, .18); ef.kilat(pos, 45); ef.goyang(.3);
        if (env.pemain.root.position.distanceTo(pos) < 2 * J) env.kenaPemain(130, pos, 7); }
      else { const c = Math.max(0, 1 - (t - NA - TB) / .2); tilt.scale.set(1 + .15 * c, 1 - .22 * c, 1 + .15 * c); main('diam', .2); }
      if (t > NA + TB + .35) { B.state = 'bebas'; B.cd[1] = CD[1]; }
    }
    else if (B.state === 'guling') {            // berguling cepat ke arah pemain
      const t = B.t; if (t < .3) hadapPemain();
      pos.addScaledVector(depan(), 7 * J * dt * (t < .75 ? 1 : 0)); B.kenaT -= dt;
      if (B.kenaT <= 0 && env.pemain.root.position.distanceTo(pos) < 1.1 * J) { B.kenaT = .3; env.kenaPemain(45, pos.clone().addScaledVector(depan(), -1), 4); }
      if (Math.random() < .4) ef.percik(pos, 3, 0x9a8a78, 1.5 * J, .2);
      if (t > .95) { B.state = 'bebas'; B.cd[2] = CD[2]; main('diam', .2); }
    }
    else if (B.state === 'lingkaran') {         // tanda merah dulu → berputar → ledakan
      const t = B.t; main('diam', .1);
      if (t < .55) { tilt.scale.set(1, 1 - .1 * Math.sin(t * 30), 1); }
      else if (t < .9) { const c = (t - .55) / .35; tilt.rotation.y = c * Math.PI * 2; naik = Math.sin(c * Math.PI) * .45; }
      if (t > .9 && !B.hit) { B.hit = 1; ef.gelombang(pos, 5.5 * J, .6, 0xff3a10); ef.gelombang(pos, 3.6 * J, .5, 0xffb060); ef.percik(pos, 70, 0xff4020, 6 * J, .18); ef.kilat(pos, 55); ef.goyang(.35);
        if (env.pemain.root.position.distanceTo(pos) < 2.7 * J) env.kenaPemain(150, pos, 8); }
      if (t > 1.4) { B.state = 'bebas'; B.cd[3] = CD[3]; }
    }
    // jangan menumpuk dengan pemain
    const d = kePemain(), Lmin = .8 * J, Ld = d.length();
    if (Ld < Lmin && B.state !== 'loncat') { if (Ld < 1e-3) d.set(Math.sin(B.arah), 0, Math.cos(B.arah)); else d.normalize(); pos.addScaledVector(d, -(Lmin - Ld)); }
    env.batasi(pos);
    root.scale.setScalar(sk);
    tilt.position.y = mt.y + naik;
    let da = B.arah - root.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); root.rotation.y += da * Math.min(1, dt * 12);
    mixer.update(dt);
  }

  function reset() {
    mt.hp = 1000; mt.mati = 0; mt.kunci = 0; mt.pusing = 0; mt.v.set(0, 0, 0); mt.y = 0; mt.vy = 0; mt.kilau = 0;
    root.position.copy(mt.asal); B.state = 'bebas'; B.cd = [0, 3, 4, 8]; B.sudahSelesai = false; B.arah = Math.PI; root.rotation.y = Math.PI;
    TANDA.forEach(e => e.t = e.umur); mainUlang('diam', .1); if (mt.bar) mt.bar.style.display = '';
  }
  root.rotation.y = B.arah;
  return { mt, upd, reset, root, tilt, get anim() { return cur; }, get arah() { return B.arah; } };   // tilt & anim: dikirim ke pemain lain (Duel Tim)
}
