// DecoFlow AR 掃描展示（正面視角）
// 三階段自動循環：
//   1. 掃描空間  — 掃描光牆從左掃到右，地面網格亮起（空間建模）
//   2. 試擺家具  — 家具以青色線框（全息預覽）逐件浮現
//   3. 呈現實體  — 線框溶解，實體家具呈現
//   → 停留欣賞 → 淡出 → 循環

(function () {
  'use strict';

  function init() {
    if (typeof THREE === 'undefined') { setTimeout(init, 100); return; }
    const canvas = document.getElementById('arCanvas');
    if (!canvas) return;
    const statusEl = document.getElementById('arStatus');

    // === 場景 ===
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1620, 14, 26);

    // 正面視角：相機置中於 x 軸，正對房間
    const camera = new THREE.PerspectiveCamera(44, 2.3, 0.1, 100);
    camera.position.set(0, 3.6, 10);
    camera.lookAt(0, 1.3, -3.5);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    function resize() {
      const parent = canvas.parentElement;
      const w = parent.clientWidth, h = parent.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // === 燈光 ===
    const amb = new THREE.AmbientLight(0x99bbdd, 0.55);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xfff0dd, 0.85);
    dir.position.set(4, 10, 7);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -9; dir.shadow.camera.right = 9;
    dir.shadow.camera.top = 9; dir.shadow.camera.bottom = -9;
    dir.shadow.bias = -0.0006;
    scene.add(dir);

    // === 房間 ===
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.88 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 9),
      new THREE.MeshStandardMaterial({ color: 0x6a5848, roughness: 0.92 })
    );
    backWall.position.set(0, 4.5, -6.5);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // 地面掃描網格（青色，代表空間建模）
    const grid = new THREE.GridHelper(18, 36, 0x2299bb, 0x166580);
    grid.position.set(0, 0.02, -1);
    grid.material.opacity = 0.0;
    grid.material.transparent = true;
    scene.add(grid);

    // === 家具 builder ===
    function mat(color, rough, metal) {
      return new THREE.MeshStandardMaterial({ color: color, roughness: rough == null ? 0.8 : rough, metalness: metal || 0 });
    }
    function box(w, h, d, m) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.castShadow = true; mesh.receiveShadow = true;
      return mesh;
    }
    // 由實體 Group 產生青色線框 Group（每個 mesh 取 EdgesGeometry）
    function makeWire(group) {
      const wire = new THREE.Group();
      group.children.forEach(child => {
        if (child.isMesh) {
          const edges = new THREE.EdgesGeometry(child.geometry);
          const seg = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: 0x5fe8ff, transparent: true, opacity: 0
          }));
          seg.position.copy(child.position);
          seg.rotation.copy(child.rotation);
          seg.scale.copy(child.scale);
          wire.add(seg);
        }
      });
      wire.position.copy(group.position);
      wire.rotation.copy(group.rotation);
      wire.scale.copy(group.scale);
      return wire;
    }

    const items = []; // { solid, wire, order }
    function addItem(solid, order) {
      const wire = makeWire(solid);
      solid.visible = false;
      wire.visible = false;
      scene.add(solid);
      scene.add(wire);
      items.push({ solid: solid, wire: wire, order: order, wT: 0, sT: 0 });
    }

    function makePlant() {
      const g = new THREE.Group();
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.62, 14), mat(0x8b6f47, 0.7));
      pot.position.y = 0.31; pot.castShadow = true;
      g.add(pot);
      const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), mat(0x4a7c59));
      foliage.position.y = 1.15; foliage.scale.y = 1.25; foliage.castShadow = true;
      g.add(foliage);
      return g;
    }

    // 左植栽
    const plantL = makePlant();
    plantL.position.set(-4.6, 0, -3.8);
    addItem(plantL, 0);

    // 沙發
    const sofa = new THREE.Group();
    const sM = mat(0xc9a87c, 0.85);
    const seat = box(3.2, 0.55, 1.35, sM); seat.position.y = 0.45;
    const back = box(3.2, 1.0, 0.32, sM); back.position.set(0, 0.95, -0.5);
    const armL = box(0.3, 0.82, 1.35, sM); armL.position.set(-1.45, 0.6, 0);
    const armR = box(0.3, 0.82, 1.35, sM); armR.position.set(1.45, 0.6, 0);
    const cu1 = box(1.3, 0.28, 1.1, sM); cu1.position.set(-0.7, 0.82, 0);
    const cu2 = box(1.3, 0.28, 1.1, sM); cu2.position.set(0.7, 0.82, 0);
    sofa.add(seat, back, armL, armR, cu1, cu2);
    sofa.position.set(0, 0, -4.3);
    addItem(sofa, 1);

    // 地毯
    const rug = new THREE.Group();
    const rugMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), mat(0xa89882, 0.95));
    rugMesh.rotation.x = -Math.PI / 2;
    rugMesh.receiveShadow = true;
    rug.add(rugMesh);
    rug.position.set(0, 0.02, -2.6);
    addItem(rug, 2);

    // 茶几
    const table = new THREE.Group();
    const tM = mat(0x6b5a48, 0.5);
    const top = box(1.9, 0.12, 1.1, tM); top.position.y = 0.6;
    const pillar = box(0.55, 0.5, 0.55, tM); pillar.position.y = 0.3;
    table.add(top, pillar);
    table.position.set(0, 0, -2.6);
    addItem(table, 3);

    // 立燈
    const lamp = new THREE.Group();
    const lM = mat(0x4a3a2c, 0.5);
    const lbase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.08, 18), lM);
    lbase.position.y = 0.04; lbase.castShadow = true;
    const lpole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 10), lM);
    lpole.position.y = 1.2; lpole.castShadow = true;
    const lshade = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 0.6, 18, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xe8d5b7, emissive: 0xffe4b5, emissiveIntensity: 0.0, roughness: 0.4, side: THREE.DoubleSide })
    );
    lshade.position.y = 2.55; lshade.castShadow = true;
    const lbulb = new THREE.PointLight(0xffe4b5, 0.0, 8, 1.5);
    lbulb.position.y = 2.4;
    lamp.add(lbase, lpole, lshade, lbulb);
    lamp.position.set(3.2, 0, -4.2);
    lamp.userData.shade = lshade;
    lamp.userData.bulb = lbulb;
    addItem(lamp, 4);

    // 右植栽
    const plantR = makePlant();
    plantR.position.set(4.8, 0, -3.8);
    addItem(plantR, 5);

    const maxOrder = 5;

    // === 掃描光牆 ===
    const scanGroup = new THREE.Group();
    const scanSheet = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 9),
      new THREE.MeshBasicMaterial({
        color: 0x00e0ff, transparent: true, opacity: 0.16,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    scanSheet.rotation.y = Math.PI / 2;
    scanSheet.position.set(0, 3.5, -1);
    scanGroup.add(scanSheet);
    const scanEdge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 9),
      new THREE.MeshBasicMaterial({
        color: 0xaaffff, transparent: true, opacity: 0.95,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    scanEdge.rotation.y = Math.PI / 2;
    scanEdge.position.set(0, 3.5, -1);
    scanGroup.add(scanEdge);
    const scanFloor = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.05, 14),
      new THREE.MeshBasicMaterial({ color: 0xaaffff })
    );
    scanFloor.position.set(0, 0.04, -1);
    scanGroup.add(scanFloor);
    scene.add(scanGroup);

    // === 動畫狀態機 ===
    const SCAN_START = -8, SCAN_END = 8;
    const DUR = { scan: 2.6, wire: 2.4, solid: 1.4, hold: 2.6, fade: 1.0 };
    let phase = 'scan', phaseT = 0, lastPhase = '';
    const clock = new THREE.Clock();

    function easeOutBack(t) {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function setStatus(text, cls) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = 'ar-status' + (cls ? ' ' + cls : '');
    }
    function setWireOpacity(it, o) {
      it.wire.children.forEach(seg => { seg.material.opacity = o; });
    }
    function resetAll() {
      items.forEach(it => {
        it.solid.visible = false; it.solid.scale.setScalar(0.001); it.sT = 0;
        it.wire.visible = false; it.wire.scale.setScalar(0.001); it.wT = 0;
        setWireOpacity(it, 0);
      });
      if (lamp.userData.shade) lamp.userData.shade.material.emissiveIntensity = 0;
      if (lamp.userData.bulb) lamp.userData.bulb.intensity = 0;
    }
    resetAll();

    function animate() {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const et = clock.getElapsedTime();
      phaseT += dt;

      // ---- 階段 1：掃描空間 ----
      if (phase === 'scan') {
        if (lastPhase !== 'scan') { setStatus('◉ 掃描空間中…', ''); lastPhase = 'scan'; resetAll(); }
        const p = Math.min(phaseT / DUR.scan, 1);
        const scanX = SCAN_START + (SCAN_END - SCAN_START) * p;
        scanGroup.position.x = scanX;
        scanGroup.visible = true;
        scanEdge.material.opacity = 0.6 + Math.sin(et * 9) * 0.3;
        // 地面網格隨掃描亮起
        grid.material.opacity = 0.45 * p;
        if (p >= 1) { phase = 'wire'; phaseT = 0; }

      // ---- 階段 2：試擺家具（線框）----
      } else if (phase === 'wire') {
        if (lastPhase !== 'wire') { setStatus('◈ AI 試擺家具…', 'wire'); lastPhase = 'wire'; scanGroup.visible = false; }
        grid.material.opacity = 0.45;
        items.forEach(it => {
          const appearAt = it.order * 0.28;
          if (phaseT >= appearAt) {
            it.wire.visible = true;
            if (it.wT < 1) {
              it.wT = Math.min(it.wT + dt * 3.0, 1);
              const e = easeOutBack(it.wT);
              it.wire.scale.setScalar(Math.max(e, 0.001));
              setWireOpacity(it, Math.min(it.wT, 1) * 0.95);
            }
          }
        });
        if (phaseT >= DUR.wire) { phase = 'solid'; phaseT = 0; }

      // ---- 階段 3：呈現實體 ----
      } else if (phase === 'solid') {
        if (lastPhase !== 'solid') { setStatus('✦ 生成實體中…', 'solidify'); lastPhase = 'solid'; }
        const p = Math.min(phaseT / DUR.solid, 1);
        items.forEach(it => {
          // 實體淡入（scale 1 直接顯示，靠線框溶解過場）
          it.solid.visible = true;
          if (it.sT < 1) {
            it.sT = Math.min(it.sT + dt * 2.2, 1);
            const e = 0.8 + 0.2 * easeOutCubic(it.sT);
            it.solid.scale.setScalar(e);
          }
          // 線框淡出
          it.wT = Math.max(it.wT - dt * 2.2, 0);
          setWireOpacity(it, it.wT * 0.95);
          if (it.wT <= 0) it.wire.visible = false;
        });
        // 立燈逐漸亮起
        if (lamp.userData.shade) lamp.userData.shade.material.emissiveIntensity = 0.35 * p;
        if (lamp.userData.bulb) lamp.userData.bulb.intensity = 0.55 * p;
        if (p >= 1) { phase = 'hold'; phaseT = 0; }

      // ---- 階段 4：停留欣賞 ----
      } else if (phase === 'hold') {
        if (lastPhase !== 'hold') { setStatus('✓ 完工呈現', 'done'); lastPhase = 'hold'; }
        grid.material.opacity = Math.max(grid.material.opacity - dt * 0.4, 0.12);
        items.forEach(it => { it.solid.scale.setScalar(1); });
        if (phaseT >= DUR.hold) { phase = 'fade'; phaseT = 0; }

      // ---- 階段 5：淡出 → 循環 ----
      } else if (phase === 'fade') {
        if (lastPhase !== 'fade') { lastPhase = 'fade'; }
        const p = Math.min(phaseT / DUR.fade, 1);
        const s = 1 - easeOutCubic(p);
        items.forEach(it => { it.solid.scale.setScalar(Math.max(s, 0.001)); });
        grid.material.opacity = 0.12 * (1 - p);
        if (lamp.userData.shade) lamp.userData.shade.material.emissiveIntensity = 0.35 * (1 - p);
        if (lamp.userData.bulb) lamp.userData.bulb.intensity = 0.55 * (1 - p);
        if (p >= 1) {
          phase = 'scan'; phaseT = 0;
          scanGroup.position.x = SCAN_START;
        }
      }

      // 相機僅輕微上下浮動，保持正面
      camera.position.y = 3.6 + Math.sin(et * 0.4) * 0.18;
      camera.lookAt(0, 1.3, -3.5);

      renderer.render(scene, camera);
    }
    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
