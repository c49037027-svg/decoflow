// DecoFlow Interactive 3D Demo
// 使用 Three.js 建立可互動的 3D 室內場景

(function () {
  'use strict';

  // 等待 DOM 與 Three.js 載入
  function init() {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded yet, retrying...');
      setTimeout(init, 100);
      return;
    }

    const canvas = document.getElementById('demoCanvas');
    if (!canvas) return;

    // === 場景基礎設定 ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeae5dc);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(7, 5.5, 8);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // === 燈光（初始值為北歐風的強度，避免淺色材質過曝）===
    const ambient = new THREE.AmbientLight(0xffffff, 0.28);
    scene.add(ambient);

    const sunlight = new THREE.DirectionalLight(0xfff2e0, 0.65);
    sunlight.position.set(6, 10, 4);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(2048, 2048);
    sunlight.shadow.camera.left = -10;
    sunlight.shadow.camera.right = 10;
    sunlight.shadow.camera.top = 10;
    sunlight.shadow.camera.bottom = -10;
    sunlight.shadow.bias = -0.0005;
    scene.add(sunlight);

    const fillLight = new THREE.HemisphereLight(0xfff5e0, 0x554a3a, 0.32);
    fillLight.position.set(0, 8, 0);
    scene.add(fillLight);

    // === 程序生成紋理（不依賴外部圖檔）===
    function makeFloorTexture(pattern) {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');

      if (pattern === 'wood_light') {
        ctx.fillStyle = '#d4b896';
        ctx.fillRect(0, 0, 512, 512);
        for (let y = 0; y < 512; y += 64) {
          const off = (y / 64) % 2 ? 64 : 0;
          for (let x = -64; x < 512; x += 128) {
            ctx.strokeStyle = 'rgba(80,55,30,0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + off, y, 128, 64);
            for (let i = 0; i < 5; i++) {
              ctx.strokeStyle = `rgba(80,55,30,${0.05 + Math.random() * 0.08})`;
              const yy = y + 4 + Math.random() * 56;
              ctx.beginPath();
              ctx.moveTo(x + off, yy);
              ctx.lineTo(x + off + 128, yy);
              ctx.stroke();
            }
          }
        }
      } else if (pattern === 'tatami') {
        ctx.fillStyle = '#c19a6b';
        ctx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            ctx.strokeStyle = '#4a3a2c';
            ctx.lineWidth = 6;
            ctx.strokeRect(j * 256 + 6, i * 256 + 6, 244, 244);
          }
        }
        for (let y = 0; y < 512; y += 3) {
          ctx.fillStyle = 'rgba(74,58,44,0.07)';
          ctx.fillRect(0, y, 512, 1);
        }
      } else if (pattern === 'dark_wood') {
        ctx.fillStyle = '#3a2c1f';
        ctx.fillRect(0, 0, 512, 512);
        for (let y = 0; y < 512; y += 64) {
          const off = (y / 64) % 2 ? 80 : 0;
          for (let x = -80; x < 512; x += 160) {
            ctx.strokeStyle = 'rgba(0,0,0,0.55)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + off, y, 160, 64);
            for (let i = 0; i < 6; i++) {
              ctx.strokeStyle = `rgba(0,0,0,${0.12 + Math.random() * 0.18})`;
              const yy = y + 4 + Math.random() * 56;
              ctx.beginPath();
              ctx.moveTo(x + off, yy);
              ctx.lineTo(x + off + 160, yy);
              ctx.stroke();
            }
          }
        }
        // 偶爾的刮痕
        for (let i = 0; i < 12; i++) {
          ctx.strokeStyle = `rgba(180,140,80,${0.1 + Math.random() * 0.1})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          const x1 = Math.random() * 512, y1 = Math.random() * 512;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 + Math.random() * 80 - 40, y1 + Math.random() * 10 - 5);
          ctx.stroke();
        }
      } else if (pattern === 'concrete') {
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 2500; i++) {
          ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
          ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
        }
        for (let i = 0; i < 8; i++) {
          ctx.strokeStyle = `rgba(80,80,80,${0.06 + Math.random() * 0.05})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(Math.random() * 512, Math.random() * 512);
          ctx.bezierCurveTo(
            Math.random() * 512, Math.random() * 512,
            Math.random() * 512, Math.random() * 512,
            Math.random() * 512, Math.random() * 512
          );
          ctx.stroke();
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      tex.needsUpdate = true;
      return tex;
    }

    function makeWallTexture(pattern) {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      if (pattern === 'brick') {
        ctx.fillStyle = '#2c2420';
        ctx.fillRect(0, 0, 512, 512);
        for (let y = 0; y < 512; y += 36) {
          const off = (y / 36) % 2 ? 0 : 72;
          for (let x = -72; x < 512; x += 144) {
            const r = 110 + Math.random() * 50;
            const g = 50 + Math.random() * 25;
            const b = 40 + Math.random() * 25;
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x + off + 3, y + 3, 138, 30);
            // 紋理斑點
            for (let k = 0; k < 8; k++) {
              ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.1})`;
              ctx.fillRect(x + off + 3 + Math.random() * 138, y + 3 + Math.random() * 30, 2, 2);
            }
          }
        }
      } else if (pattern === 'rice_paper') {
        ctx.fillStyle = '#f5ede0';
        ctx.fillRect(0, 0, 512, 512);
        // 米紙質感：垂直細紋
        for (let x = 0; x < 512; x += 2) {
          ctx.fillStyle = `rgba(180,160,120,${0.04 + Math.random() * 0.04})`;
          ctx.fillRect(x, 0, 1, 512);
        }
        // 偶爾的纖維
        for (let i = 0; i < 30; i++) {
          ctx.strokeStyle = `rgba(160,140,100,${0.15 + Math.random() * 0.15})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          const x = Math.random() * 512, y = Math.random() * 512;
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.random() * 30 - 15, y + Math.random() * 80 - 40);
          ctx.stroke();
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 1);
      tex.needsUpdate = true;
      return tex;
    }

    const floorTextures = {
      wood_light: makeFloorTexture('wood_light'),
      tatami: makeFloorTexture('tatami'),
      dark_wood: makeFloorTexture('dark_wood'),
      concrete: makeFloorTexture('concrete')
    };
    const wallTextures = {
      brick: makeWallTexture('brick'),
      rice_paper: makeWallTexture('rice_paper')
    };

    // === 材質 ===
    const M = {
      floor: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: 0.05, map: floorTextures.wood_light }),
      wall: new THREE.MeshStandardMaterial({ color: 0xf4f1ec, roughness: 0.92 }),
      ceiling: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.95 }),
      sofa: new THREE.MeshStandardMaterial({ color: 0xc9a87c, roughness: 0.85 }),
      table: new THREE.MeshStandardMaterial({ color: 0x6b5a48, roughness: 0.5 }),
      lampShade: new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.4, emissive: 0xffe4b5, emissiveIntensity: 0.15 }),
      plantPot: new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.7 }),
      plant: new THREE.MeshStandardMaterial({ color: 0x4a7c59, roughness: 0.8 }),
      rug: new THREE.MeshStandardMaterial({ color: 0xa89882, roughness: 0.95 }),
      painting: new THREE.MeshStandardMaterial({ color: 0xc9a87c, roughness: 0.5 }),
      paintingFrame: new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.4 }),
      // 新家具專屬材質（逐風格上色，確保符合風格）
      armchair: new THREE.MeshStandardMaterial({ color: 0xc9a87c, roughness: 0.85 }),
      sidetbl:  new THREE.MeshStandardMaterial({ color: 0x6b5a48, roughness: 0.5 }),
      tvcab:    new THREE.MeshStandardMaterial({ color: 0x6b5a48, roughness: 0.5 })
    };

    // === 房間結構 ===
    // 地板
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floor = new THREE.Mesh(floorGeo, M.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 牆面（後 + 左）
    const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.5), M.wall);
    wallBack.position.set(0, 3.25, -6);
    wallBack.receiveShadow = true;
    scene.add(wallBack);

    const wallLeft = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.5), M.wall);
    wallLeft.position.set(-6, 3.25, 0);
    wallLeft.rotation.y = Math.PI / 2;
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);

    // 天花板
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), M.ceiling);
    ceiling.position.y = 6.5;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // 踢腳板（增添細節）
    const skirtGeo = new THREE.BoxGeometry(12, 0.15, 0.05);
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    const skirtBack = new THREE.Mesh(skirtGeo, skirtMat);
    skirtBack.position.set(0, 0.075, -5.975);
    scene.add(skirtBack);

    const skirtLeft = new THREE.Mesh(skirtGeo, skirtMat);
    skirtLeft.rotation.y = Math.PI / 2;
    skirtLeft.position.set(-5.975, 0.075, 0);
    scene.add(skirtLeft);

    // 窗戶（後牆）— 打包成 Group 以便整體拖曳旋轉
    const windowGroup = new THREE.Group();
    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.2, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    windowFrame.position.set(0, 0, 0);
    windowGroup.add(windowFrame);

    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 1.9),
      new THREE.MeshStandardMaterial({
        color: 0xb8d4e8,
        roughness: 0.1,
        metalness: 0.3,
        transparent: true,
        opacity: 0.6,
        emissive: 0xb8d4e8,
        emissiveIntensity: 0.4
      })
    );
    windowGlass.position.set(0, 0, 0.05);
    windowGroup.add(windowGlass);

    // 窗格分隔
    const windowDivH = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 0.06, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    windowDivH.position.set(0, 0, 0.07);
    windowGroup.add(windowDivH);

    const windowDivV = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 1.9, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    windowDivV.position.set(0, 0, 0.07);
    windowGroup.add(windowDivV);

    // 將整個窗戶 Group 移到後牆位置
    windowGroup.position.set(2.5, 3.5, -5.95);
    scene.add(windowGroup);

    // === 家具 ===
    function makeBox(w, h, d, material) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }

    // 沙發
    const sofa = new THREE.Group();
    const sofaSeat = makeBox(3.4, 0.55, 1.4, M.sofa);
    sofaSeat.position.y = 0.45;
    const sofaBack = makeBox(3.4, 1.1, 0.35, M.sofa);
    sofaBack.position.set(0, 1.0, -0.52);
    const sofaArmL = makeBox(0.3, 0.85, 1.4, M.sofa);
    sofaArmL.position.set(-1.55, 0.6, 0);
    const sofaArmR = makeBox(0.3, 0.85, 1.4, M.sofa);
    sofaArmR.position.set(1.55, 0.6, 0);
    const cushion1 = makeBox(1.4, 0.3, 1.2, M.sofa);
    cushion1.position.set(-0.75, 0.85, 0);
    const cushion2 = makeBox(1.4, 0.3, 1.2, M.sofa);
    cushion2.position.set(0.75, 0.85, 0);
    // 沙發腳
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.4 });
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8), legMat);
      leg.position.set((i % 2 ? 1.4 : -1.4), 0.1, (i < 2 ? 0.55 : -0.55));
      leg.castShadow = true;
      sofa.add(leg);
    }
    sofa.add(sofaSeat, sofaBack, sofaArmL, sofaArmR, cushion1, cushion2);
    sofa.position.set(0, 0, -4);
    scene.add(sofa);

    // 茶几
    const table = new THREE.Group();
    const tableTop = makeBox(2.2, 0.12, 1.3, M.table);
    tableTop.position.y = 0.65;
    const tablePillar = makeBox(0.6, 0.55, 0.6, M.table);
    tablePillar.position.y = 0.275;
    table.add(tableTop, tablePillar);
    table.position.set(0, 0, -1.5);
    scene.add(table);

    // 茶几上的擺飾（書本與咖啡杯）
    const book = makeBox(0.4, 0.05, 0.28,
      new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.5 }));
    book.position.set(-0.6, 0.74, -1.5);
    book.rotation.y = -0.2;
    book.castShadow = true;
    scene.add(book);

    // 第二本書（堆疊在第一本上）
    const book2 = makeBox(0.36, 0.05, 0.26,
      new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.55 }));
    book2.position.set(-0.58, 0.795, -1.48);
    book2.rotation.y = -0.15;
    book2.castShadow = true;
    scene.add(book2);

    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.08, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    cup.position.set(0.4, 0.8, -1.4);
    cup.castShadow = true;
    scene.add(cup);

    // 小花瓶（增加可拖曳趣味）
    const vase = new THREE.Group();
    const vaseBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.08, 0.35, 20),
      new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.3, metalness: 0.2 })
    );
    vaseBody.position.y = 0.175;
    vaseBody.castShadow = true;
    const vaseFlower = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4a5a5, roughness: 0.7 })
    );
    vaseFlower.position.y = 0.42;
    vaseFlower.castShadow = true;
    vase.add(vaseBody, vaseFlower);
    vase.position.set(0.85, 0.71, -1.7);
    scene.add(vase);

    // 綁定茶几上的小物為茶几子物件（attach 保留 world transform）
    // → 茶几移動或旋轉時，小物自動跟隨；茶几隱藏時小物也自動隱藏
    table.attach(book);
    table.attach(book2);
    table.attach(cup);
    table.attach(vase);

    // 立燈
    const lamp = new THREE.Group();
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 0.08, 24),
      M.table
    );
    lampBase.position.y = 0.04;
    lampBase.castShadow = true;
    const lampPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.5, 12),
      M.table
    );
    lampPole.position.y = 1.3;
    lampPole.castShadow = true;
    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 0.7, 24, 1, true),
      M.lampShade
    );
    lampShade.position.y = 2.8;
    lampShade.castShadow = true;
    const lampBulb = new THREE.PointLight(0xffe4b5, 0.6, 10, 1.5);
    lampBulb.position.y = 2.5;
    lampBulb.castShadow = false;
    lamp.add(lampBase, lampPole, lampShade, lampBulb);
    lamp.position.set(-4, 0, -4.5);
    scene.add(lamp);

    // 植栽
    const plant = new THREE.Group();
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.32, 0.65, 20),
      M.plantPot
    );
    pot.position.y = 0.325;
    pot.castShadow = true;
    plant.add(pot);

    // 葉子（用多個球體模擬蓬鬆感）
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.42 + Math.random() * 0.12, 10, 10),
        M.plant
      );
      const angle = (i / 6) * Math.PI * 2;
      leaf.position.set(
        Math.cos(angle) * 0.18,
        0.95 + Math.random() * 0.4,
        Math.sin(angle) * 0.18
      );
      leaf.castShadow = true;
      plant.add(leaf);
    }
    const leafTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 12),
      M.plant
    );
    leafTop.position.y = 1.35;
    leafTop.castShadow = true;
    plant.add(leafTop);

    plant.position.set(4, 0, -4.5);
    scene.add(plant);

    // 地毯（包成 Group，讓 rotation.y 能正確繞世界 Y 軸水平旋轉）
    const rugMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 2.8),
      M.rug
    );
    rugMesh.rotation.x = -Math.PI / 2; // 內層 mesh 平放
    rugMesh.receiveShadow = true;
    const rug = new THREE.Group();
    rug.add(rugMesh);
    rug.position.set(0, 0.005, -1.8);
    scene.add(rug);

    // 牆面掛畫
    const painting = new THREE.Group();
    const paintingFrame = makeBox(1.8, 1.2, 0.05, M.paintingFrame);
    const paintingCanvas = makeBox(1.65, 1.05, 0.06, M.painting);
    painting.add(paintingFrame, paintingCanvas);
    painting.position.set(-2.5, 3.5, -5.92);
    scene.add(painting);

    // 物件參考
    const furniture = { sofa, table, lamp, plant, rug, painting };

    // === 標記可拖曳家具與其尺寸（半寬 / 半深，用於房間邊界判斷）===
    // canRotate: 是否可旋轉（小物件不旋轉避免穿模）
    sofa.userData.draggable  = true; sofa.userData.halfW  = 1.7;  sofa.userData.halfD  = 0.85; sofa.userData.canRotate = true;  sofa.userData.slot = 'sofa';
    table.userData.draggable = true; table.userData.halfW = 1.1;  table.userData.halfD = 0.65; table.userData.canRotate = true; table.userData.slot = 'table';
    lamp.userData.draggable  = true; lamp.userData.halfW  = 0.45; lamp.userData.halfD  = 0.45; lamp.userData.canRotate = false; lamp.userData.slot = 'lamp';
    plant.userData.draggable = true; plant.userData.halfW = 0.5;  plant.userData.halfD = 0.5;  plant.userData.canRotate = false;
    rug.userData.draggable   = true; rug.userData.halfW   = 2.25; rug.userData.halfD   = 1.4;  rug.userData.canRotate = true;
    // 茶几上的小物件
    book.userData.draggable  = true; book.userData.halfW  = 0.2;  book.userData.halfD  = 0.14; book.userData.canRotate = true;
    book2.userData.draggable = true; book2.userData.halfW = 0.18; book2.userData.halfD = 0.13; book2.userData.canRotate = true;
    cup.userData.draggable   = true; cup.userData.halfW   = 0.1;  cup.userData.halfD   = 0.1;  cup.userData.canRotate = false;
    vase.userData.draggable  = true; vase.userData.halfW  = 0.12; vase.userData.halfD  = 0.12; vase.userData.canRotate = false;
    // 牆上物品（painting / window）— 標記為 wallItem 啟用「沿牆滑動」模式
    painting.userData.draggable    = true; painting.userData.halfW    = 0.9; painting.userData.halfD    = 0.05; painting.userData.canRotate = true; painting.userData.wallItem = 'back';
    windowGroup.userData.draggable = true; windowGroup.userData.halfW = 1.5; windowGroup.userData.halfD = 0.06; windowGroup.userData.canRotate = true; windowGroup.userData.wallItem = 'back';

    const draggableList = [sofa, table, lamp, plant, rug, book, book2, cup, vase, painting, windowGroup];

    // 記錄原始位置與旋轉，以便「重置」
    const originalTransforms = {};
    draggableList.forEach(o => {
      originalTransforms[o.id] = {
        pos: o.position.clone(),
        rotY: o.rotation.y
      };
    });

    // === 通用 helper：註冊新物件為可拖曳 ===
    function registerDraggable(obj, opts) {
      obj.userData.draggable = true;
      obj.userData.halfW = opts.halfW;
      obj.userData.halfD = opts.halfD;
      obj.userData.canRotate = opts.canRotate !== false;
      if (opts.wallItem) obj.userData.wallItem = opts.wallItem;
      if (opts.slot) obj.userData.slot = opts.slot;
      draggableList.push(obj);
      originalTransforms[obj.id] = {
        pos: obj.position.clone(),
        rotY: obj.rotation.y
      };
      return obj;
    }

    // === 風格專屬擺飾（預設全部隱藏，applyStyle 切換顯示）===
    // 1) 北歐：沙發扶手上的對折毛毯（凹凸層次）
    const nordicBlanket = new THREE.Group();
    const blanketMat = new THREE.MeshStandardMaterial({ color: 0xd48a8a, roughness: 0.95 });
    // 底層
    const blanketLayer1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.55), blanketMat);
    blanketLayer1.position.y = 0.025;
    blanketLayer1.castShadow = true;
    blanketLayer1.receiveShadow = true;
    nordicBlanket.add(blanketLayer1);
    // 對折上層（稍小）
    const blanketLayer2 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.045, 0.45), blanketMat);
    blanketLayer2.position.set(-0.05, 0.075, 0.02);
    blanketLayer2.rotation.y = 0.1;
    blanketLayer2.castShadow = true;
    nordicBlanket.add(blanketLayer2);
    // 放在沙發右扶手上（沙發中心 (0,0,-4)、右扶手在 +1.55 x，扶手頂部約 y=1.02）
    nordicBlanket.position.set(1.45, 1.05, -4);
    nordicBlanket.rotation.y = 0.1;
    nordicBlanket.visible = true;
    scene.add(nordicBlanket);
    // 綁定到沙發：用 attach 重新 parent 同時保留 world transform
    // → 沙發移動/旋轉時毛毯自動跟著（透過 Three.js 場景圖）
    sofa.attach(nordicBlanket);
    registerDraggable(nordicBlanket, { halfW: 0.5, halfD: 0.3, canRotate: true });

    // 2) 日式：紙燈籠（含內部點光）
    const lantern = new THREE.Group();
    const lanternBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.55, 20),
      new THREE.MeshStandardMaterial({
        color: 0xf5e6d3, roughness: 0.7,
        emissive: 0xffd680, emissiveIntensity: 0.45,
        transparent: true, opacity: 0.95
      })
    );
    lanternBody.position.y = 0.4;
    const lanternCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.32, 0.06, 20),
      new THREE.MeshStandardMaterial({ color: 0x2c2c2c })
    );
    lanternCap.position.y = 0.7;
    const lanternBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.35, 0.06, 20),
      new THREE.MeshStandardMaterial({ color: 0x2c2c2c })
    );
    lanternBase.position.y = 0.1;
    // 橫條紋
    for (let i = 0; i < 4; i++) {
      const stripe = new THREE.Mesh(
        new THREE.TorusGeometry(0.325, 0.012, 6, 24),
        new THREE.MeshStandardMaterial({ color: 0x6b4a32 })
      );
      stripe.rotation.x = Math.PI / 2;
      stripe.position.y = 0.2 + i * 0.13;
      lantern.add(stripe);
    }
    const lanternGlow = new THREE.PointLight(0xffd680, 0.5, 4);
    lanternGlow.position.y = 0.4;
    lantern.add(lanternBody, lanternCap, lanternBase, lanternGlow);
    lantern.position.set(-4, 0, -2);
    lantern.visible = false;
    scene.add(lantern);
    registerDraggable(lantern, { halfW: 0.4, halfD: 0.4, canRotate: false });

    // 3) 工業：金屬層架
    const shelf = new THREE.Group();
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 });
    const shelfTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.4), shelfMat);
    shelfTop.position.y = 1.6;
    const shelfMid = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.4), shelfMat);
    shelfMid.position.y = 1.0;
    const shelfBot = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.4), shelfMat);
    shelfBot.position.y = 0.4;
    const shelfLegL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.65, 0.4), shelfMat);
    shelfLegL.position.set(-0.875, 0.825, 0);
    const shelfLegR = shelfLegL.clone();
    shelfLegR.position.x = 0.875;
    [shelfTop, shelfMid, shelfBot, shelfLegL, shelfLegR].forEach(p => {
      p.castShadow = true;
      shelf.add(p);
    });
    // 層架上的書本
    const shelfBook = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.28, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x8b4a3a, roughness: 0.5 })
    );
    shelfBook.position.set(-0.5, 1.78, 0);
    shelf.add(shelfBook);
    const shelfBook2 = shelfBook.clone();
    shelfBook2.position.x = -0.3;
    shelfBook2.material = new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.5 });
    shelf.add(shelfBook2);
    shelf.position.set(-4, 0, -1);
    shelf.visible = false;
    scene.add(shelf);
    registerDraggable(shelf, { halfW: 0.9, halfD: 0.2, canRotate: true });

    // 4) 極簡：白色雕塑（球體 + 立方體組合）
    const sculpture = new THREE.Group();
    const sculptureMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.4, metalness: 0.15 });
    const sBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.06, 24), sculptureMat);
    sBase.position.y = 0.03;
    const sSphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24), sculptureMat);
    sSphere.position.y = 0.4;
    const sRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 12, 32), sculptureMat);
    sRing.position.y = 0.75;
    sRing.rotation.x = Math.PI / 2.5;
    [sBase, sSphere, sRing].forEach(p => { p.castShadow = true; sculpture.add(p); });
    sculpture.position.set(5.0, 0, -4.5); // 放在盆栽（約 x=4）右邊
    sculpture.visible = false;
    scene.add(sculpture);
    registerDraggable(sculpture, { halfW: 0.4, halfD: 0.4, canRotate: false });

    // === 額外擺飾（階段 D 擴充：每風格再加 1-2 個）===
    // 北歐：桌上多肉
    const succulent = new THREE.Group();
    const succPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.1, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.8 })
    );
    succPot.position.y = 0.08;
    succPot.castShadow = true;
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.07 + Math.random() * 0.03, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x6b8e6b, roughness: 0.9 })
      );
      const a = (i / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 0.06, 0.18 + Math.random() * 0.05, Math.sin(a) * 0.06);
      leaf.scale.y = 1.5;
      leaf.castShadow = true;
      succulent.add(leaf);
    }
    succulent.add(succPot);
    succulent.position.set(-0.85, 0.71, -1.7);
    succulent.visible = true;
    scene.add(succulent);
    // 綁定為茶几子物件（位置自動跟隨茶几）
    table.attach(succulent);
    registerDraggable(succulent, { halfW: 0.15, halfD: 0.15, canRotate: false });

    // 日式：禪石擺設
    const zenStones = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95 });
    for (let i = 0; i < 3; i++) {
      const stone = new THREE.Mesh(
        new THREE.SphereGeometry(0.12 - i * 0.02, 10, 8),
        stoneMat
      );
      stone.scale.y = 0.5 + i * 0.1;
      stone.position.set(i * 0.25 - 0.25, 0.06 - i * 0.02, 0);
      stone.castShadow = true;
      zenStones.add(stone);
    }
    zenStones.position.set(3.5, 0, -0.5);
    zenStones.visible = false;
    scene.add(zenStones);
    registerDraggable(zenStones, { halfW: 0.5, halfD: 0.15, canRotate: true });

    // 工業：紅磚壁掛裝飾（吊在牆上的金屬牌）
    const metalSign = new THREE.Group();
    const signBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.6, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.7 })
    );
    const signText = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.15, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xc8a060, roughness: 0.3, metalness: 0.6 })
    );
    signText.position.z = 0.03;
    metalSign.add(signBase, signText);
    metalSign.position.set(2.5, 2.2, -5.93);
    metalSign.visible = false;
    scene.add(metalSign);
    registerDraggable(metalSign, { halfW: 0.45, halfD: 0.04, canRotate: true, wallItem: 'back' });

    // 極簡：白色蘭花瓷瓶
    const orchidVase = new THREE.Group();
    const ovBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.13, 0.42, 18),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1 })
    );
    ovBody.position.y = 0.21;
    ovBody.castShadow = true;
    // 蘭花莖
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x5a8268, roughness: 0.8 })
    );
    stem.position.y = 0.72;
    stem.rotation.z = 0.08;
    orchidVase.add(stem);
    // 蘭花瓣
    for (let i = 0; i < 3; i++) {
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xfff0f5, roughness: 0.7 })
      );
      petal.position.set(0.02, 0.85 + i * 0.08, 0);
      petal.scale.set(1.2, 0.3, 1.2);
      orchidVase.add(petal);
    }
    orchidVase.add(ovBody);
    orchidVase.position.set(-3.5, 0, -1.5);
    orchidVase.visible = false;
    scene.add(orchidVase);
    registerDraggable(orchidVase, { halfW: 0.15, halfD: 0.15, canRotate: false });

    // === 額外常駐家具（用 M 材質 → 會隨風格換色；可拖曳可購買）===
    // 單人扶手椅
    const armchair = new THREE.Group();
    const acSeat = makeBox(1.2, 0.5, 1.1, M.armchair); acSeat.position.y = 0.42;
    const acBack = makeBox(1.2, 0.9, 0.28, M.armchair); acBack.position.set(0, 0.85, -0.42);
    const acArmL = makeBox(0.22, 0.6, 1.1, M.armchair); acArmL.position.set(-0.5, 0.55, 0);
    const acArmR = makeBox(0.22, 0.6, 1.1, M.armchair); acArmR.position.set(0.5, 0.55, 0);
    const acCushion = makeBox(0.95, 0.22, 0.9, M.armchair); acCushion.position.set(0, 0.72, 0.05);
    armchair.add(acSeat, acBack, acArmL, acArmR, acCushion);
    armchair.position.set(3.4, 0, -2.2);
    armchair.rotation.y = -Math.PI / 5;
    scene.add(armchair);
    registerDraggable(armchair, { halfW: 0.7, halfD: 0.6, canRotate: true });
    armchair.userData.productKey = 'armchair';

    // 電視櫃（靠後牆）
    const tvStand = new THREE.Group();
    const tvBody = makeBox(3.0, 0.6, 0.5, M.tvcab); tvBody.position.y = 0.3;
    const tvLineMat = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.5 });
    const tvDoor1 = makeBox(1.4, 0.5, 0.04, tvLineMat); tvDoor1.position.set(-0.75, 0.3, 0.27);
    const tvDoor2 = makeBox(1.4, 0.5, 0.04, tvLineMat); tvDoor2.position.set(0.75, 0.3, 0.27);
    // 電視（螢幕）
    const tvScreen = makeBox(2.0, 1.15, 0.08, new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.3, metalness: 0.4 }));
    tvScreen.position.set(0, 1.2, 0); // 坐落在櫃子上方，不懸空
    // 電視底座
    const tvFoot = makeBox(0.5, 0.1, 0.2, tvLineMat); tvFoot.position.set(0, 0.65, 0);
    tvStand.add(tvBody, tvDoor1, tvDoor2, tvFoot, tvScreen);
    // 放在沙發對面（沙發在 z=-4 面向 +z，電視在前方 z≈0.2 面向 -z 朝向沙發）
    tvStand.position.set(0, 0, 0.2);
    tvStand.rotation.y = Math.PI;
    scene.add(tvStand);
    registerDraggable(tvStand, { halfW: 1.5, halfD: 0.3, canRotate: true });
    tvStand.userData.productKey = 'tvStand';

    // 邊几（沙發旁小桌）
    const sideTable = new THREE.Group();
    const stTop = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 20), M.sidetbl);
    stTop.position.y = 0.62; stTop.castShadow = true;
    const stLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 12), M.sidetbl);
    stLeg.position.y = 0.3; stLeg.castShadow = true;
    const stFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.04, 20), M.sidetbl);
    stFoot.position.y = 0.02;
    sideTable.add(stTop, stLeg, stFoot);
    sideTable.position.set(2.5, 0, -4.3); // 右移以避開較寬的 L 型沙發
    scene.add(sideTable);
    registerDraggable(sideTable, { halfW: 0.4, halfD: 0.4, canRotate: true });
    sideTable.userData.productKey = 'sideTable';

    // === 新家具的款式系統（每件多一款）===
    // 通用：單件家具的款式切換系統
    function makePieceModels(baseObj, slotName) {
      const variants = { base: baseObj };
      let key = 'base';
      function active() { return variants[key]; }
      function switchTo(k) {
        const cur = active(), tgt = variants[k];
        if (!tgt || tgt === cur) return;
        tgt.position.copy(cur.position); tgt.rotation.y = cur.rotation.y;
        cur.visible = false; cur.scale.set(1, 1, 1);
        key = k;
        tgt.visible = true; tgt.scale.set(0.01, 0.01, 0.01);
        const t0 = performance.now();
        (function step(now) {
          const t = Math.min((now - t0) / 400, 1); const e = 1 - Math.pow(1 - t, 3);
          tgt.scale.set(e, e, e); if (t < 1) requestAnimationFrame(step);
        })(performance.now());
      }
      baseObj.userData.slot = slotName;
      return { variants, active, switchTo, getKey: () => key };
    }

    // 扶手椅第二款：高背單椅
    const armchairB = (function() {
      const g = new THREE.Group();
      const seat = makeBox(1.1, 0.45, 1.0, M.armchair); seat.position.y = 0.4;
      const back = makeBox(1.1, 1.3, 0.25, M.armchair); back.position.set(0, 1.05, -0.38); // 高背
      const armL = makeBox(0.18, 0.5, 1.0, M.armchair); armL.position.set(-0.46, 0.5, 0);
      const armR = makeBox(0.18, 0.5, 1.0, M.armchair); armR.position.set(0.46, 0.5, 0);
      const cushion = makeBox(0.9, 0.2, 0.85, M.armchair); cushion.position.set(0, 0.65, 0.05);
      g.add(seat, back, armL, armR, cushion);
      return g;
    })();
    armchairB.position.copy(armchair.position); armchairB.rotation.y = armchair.rotation.y;
    armchairB.visible = false; scene.add(armchairB);
    registerDraggable(armchairB, { halfW: 0.6, halfD: 0.55, canRotate: true });
    armchairB.userData.productKey = 'armchairB';
    armchairB.userData.slot = 'armchair';

    // 日式低背單椅（與日式沙發同類型：矮木框、薄坐墊）
    const armchairJP = (function() {
      const g = new THREE.Group();
      const base = makeBox(1.15, 0.28, 1.05, M.armchair); base.position.y = 0.14; // 矮木框底座
      const back = makeBox(1.15, 0.45, 0.18, M.armchair); back.position.set(0, 0.46, -0.42); // 矮靠背
      const cushion = makeBox(1.0, 0.18, 0.9, M.armchair); cushion.position.set(0, 0.37, 0.05); // 薄坐墊
      const pillow = makeBox(0.4, 0.14, 0.4, M.armchair); pillow.position.set(0, 0.5, -0.28);
      g.add(base, back, cushion, pillow);
      return g;
    })();
    armchairJP.position.copy(armchair.position); armchairJP.rotation.y = armchair.rotation.y;
    armchairJP.visible = false; scene.add(armchairJP);
    registerDraggable(armchairJP, { halfW: 0.6, halfD: 0.55, canRotate: true });
    armchairJP.userData.productKey = 'armchairJP';
    armchairJP.userData.slot = 'armchair';

    const armchairSys = makePieceModels(armchair, 'armchair');
    armchairSys.variants.b = armchairB;
    armchairSys.variants.jp = armchairJP;

    // 電視櫃第二款：高展示櫃
    const tvStandB = (function() {
      const g = new THREE.Group();
      const lower = makeBox(2.6, 0.5, 0.45, M.tvcab); lower.position.y = 0.25;
      const upper = makeBox(0.5, 1.6, 0.4, M.tvcab); upper.position.set(-1.0, 1.05, 0);
      const sh1 = makeBox(0.5, 0.04, 0.4, M.tvcab); sh1.position.set(-1.0, 0.7, 0);
      const sh2 = makeBox(0.5, 0.04, 0.4, M.tvcab); sh2.position.set(-1.0, 1.2, 0);
      const tvScreen2 = makeBox(1.7, 1.0, 0.08, new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.3, metalness: 0.4 }));
      tvScreen2.position.set(0.5, 1.0, 0);
      g.add(lower, upper, sh1, sh2, tvScreen2);
      return g;
    })();
    tvStandB.position.copy(tvStand.position); tvStandB.rotation.y = tvStand.rotation.y;
    tvStandB.visible = false; scene.add(tvStandB);
    registerDraggable(tvStandB, { halfW: 1.3, halfD: 0.25, canRotate: true });
    tvStandB.userData.productKey = 'tvStandB';
    tvStandB.userData.slot = 'tvStand';
    const tvStandSys = makePieceModels(tvStand, 'tvStand');
    tvStandSys.variants.b = tvStandB;

    // 邊几第二款：方形三層几
    const sideTableB = (function() {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const sh = makeBox(0.55, 0.05, 0.55, M.sidetbl); sh.position.y = 0.2 + i * 0.25;
        g.add(sh);
      }
      for (let i = 0; i < 4; i++) {
        const leg = makeBox(0.05, 0.72, 0.05, M.sidetbl);
        leg.position.set((i % 2 ? 0.25 : -0.25), 0.36, (i < 2 ? 0.25 : -0.25));
        g.add(leg);
      }
      return g;
    })();
    sideTableB.position.copy(sideTable.position); sideTableB.rotation.y = sideTable.rotation.y;
    sideTableB.visible = false; scene.add(sideTableB);
    registerDraggable(sideTableB, { halfW: 0.32, halfD: 0.32, canRotate: true });
    sideTableB.userData.productKey = 'sideTableB';
    sideTableB.userData.slot = 'sideTable';
    const sideTableSys = makePieceModels(sideTable, 'sideTable');
    sideTableSys.variants.b = sideTableB;

    // === 風格專屬沙發變體（階段 C）===
    // Nordic 沙發已存在（即現有的 sofa 變數）
    // 以下建立 3 個新變體（預設隱藏，applyStyle 時切換）

    // 日式矮坐墊沙發
    const sofaJapanese = (function() {
      const g = new THREE.Group();
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.6 });
      const cushionMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.95 });
      // 木底座
      const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 1.5), woodMat);
      base.position.y = 0.15;
      base.castShadow = true;
      base.receiveShadow = true;
      g.add(base);
      // 矮靠背
      const back = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 0.2), woodMat);
      back.position.set(0, 0.55, -0.65);
      back.castShadow = true;
      g.add(back);
      // 三個獨立座墊
      for (let i = 0; i < 3; i++) {
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.2, 1.2), cushionMat);
        cushion.position.set(-1 + i, 0.4, 0.08);
        cushion.castShadow = true;
        g.add(cushion);
      }
      // 兩顆抱枕
      const pillowMat = new THREE.MeshStandardMaterial({ color: 0xd4a5a5, roughness: 0.9 });
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.4), pillowMat);
      p1.position.set(-1.2, 0.58, 0.3);
      p1.rotation.y = 0.3;
      p1.castShadow = true;
      g.add(p1);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.45),
        new THREE.MeshStandardMaterial({ color: 0xa89882, roughness: 0.9 }));
      p2.position.set(1.1, 0.58, 0.25);
      p2.rotation.y = -0.2;
      p2.castShadow = true;
      g.add(p2);
      return g;
    })();
    sofaJapanese.position.set(0, 0, -4);
    sofaJapanese.visible = false;
    scene.add(sofaJapanese);
    registerDraggable(sofaJapanese, { halfW: 1.7, halfD: 0.85, canRotate: true, slot: 'sofa' });

    // 工業 Chesterfield 皮沙發
    const sofaIndustrial = (function() {
      const g = new THREE.Group();
      const leatherMat = new THREE.MeshStandardMaterial({ color: 0x4a2c1a, roughness: 0.45, metalness: 0.2 });
      const darkLeather = new THREE.MeshStandardMaterial({ color: 0x3a1f10, roughness: 0.5, metalness: 0.15 });
      // 主體座位
      const seat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 1.5), leatherMat);
      seat.position.y = 0.5;
      seat.castShadow = true;
      g.add(seat);
      // 高靠背
      const back = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 0.3), leatherMat);
      back.position.set(0, 1.2, -0.6);
      back.castShadow = true;
      g.add(back);
      // 高捲狀扶手
      for (const side of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16), leatherMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(side * 1.55, 0.95, 0);
        arm.castShadow = true;
        g.add(arm);
      }
      // 沙發墊（深紋）
      for (let i = 0; i < 2; i++) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 1.3), darkLeather);
        c.position.set(i === 0 ? -0.75 : 0.75, 0.83, 0.05);
        c.castShadow = true;
        g.add(c);
      }
      // 銅釘裝飾
      const studMat = new THREE.MeshStandardMaterial({ color: 0xc8a060, roughness: 0.3, metalness: 0.85 });
      for (let i = 0; i < 14; i++) {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), studMat);
        stud.position.set(-1.7 + i * 0.26, 0.75, 0.77);
        g.add(stud);
      }
      // 木腳
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1a0d05, roughness: 0.3 });
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 8), legMat);
        leg.position.set((i % 2 ? 1.5 : -1.5), 0.15, (i < 2 ? 0.6 : -0.6));
        leg.castShadow = true;
        g.add(leg);
      }
      return g;
    })();
    sofaIndustrial.position.set(0, 0, -4);
    sofaIndustrial.visible = false;
    scene.add(sofaIndustrial);
    registerDraggable(sofaIndustrial, { halfW: 1.8, halfD: 0.9, canRotate: true, slot: 'sofa' });

    // 極簡低模組沙發
    const sofaMinimal = (function() {
      const g = new THREE.Group();
      const mainMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.55 });
      // 整體一塊（低長型）
      const main = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 1.4), mainMat);
      main.position.y = 0.3;
      main.castShadow = true;
      g.add(main);
      // 矮靠背
      const back = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 0.22), mainMat);
      back.position.set(0, 0.8, -0.59);
      back.castShadow = true;
      g.add(back);
      // 整體座墊（無分隔）
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.12, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.7 }));
      cushion.position.set(0, 0.66, 0.05);
      cushion.castShadow = true;
      g.add(cushion);
      // 點綴白色抱枕（單顆）
      const accent = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
      accent.position.set(1.2, 0.78, 0.3);
      accent.castShadow = true;
      g.add(accent);
      return g;
    })();
    sofaMinimal.position.set(0, 0, -4);
    sofaMinimal.visible = false;
    scene.add(sofaMinimal);
    registerDraggable(sofaMinimal, { halfW: 1.8, halfD: 0.7, canRotate: true, slot: 'sofa' });

    // 沙發變體映射 + helper
    const sofaVariants = {
      nordic: sofa,
      japanese: sofaJapanese,
      industrial: sofaIndustrial,
      minimal: sofaMinimal
    };

    // === 額外沙發款式（L 型、雙人）— 依「當前風格」重建幾何與材質，使其符合風格 ===
    // 每個風格的沙發外觀特徵
    const SOFA_STYLE = {
      nordic:     { color: 0xc9a87c, rough: 0.85, metal: 0,    low: false, leather: false, wood: false },
      japanese:   { color: 0xa89882, rough: 0.7,  metal: 0,    low: true,  leather: false, wood: true  },
      industrial: { color: 0x4a2c1a, rough: 0.45, metal: 0.25, low: false, leather: true,  wood: false },
      minimal:    { color: 0x222222, rough: 0.55, metal: 0,    low: true,  leather: false, wood: false }
    };
    function sofaMat(s) { return new THREE.MeshStandardMaterial({ color: s.color, roughness: s.rough, metalness: s.metal }); }
    function clearGroup(g) { while (g.children.length) g.remove(g.children[0]); }
    // 建立方塊並設定位置（注意：Three.js 的 position 唯讀，不能用 Object.assign 指定）
    function boxAt(w, h, d, mat, x, y, z) { const b = makeBox(w, h, d, mat); b.position.set(x, y, z); return b; }

    // 依風格重建 L 型沙發（左貴妃椅）
    function buildLSofa(g, styleKey) {
      clearGroup(g);
      const s = SOFA_STYLE[styleKey] || SOFA_STYLE.nordic;
      const m = sofaMat(s);
      const side = -1, LONG = 3.6, SHORT = 1.2, DEPTH = 1.0;
      const seatY = s.low ? 0.26 : 0.4, seatH = s.low ? 0.3 : 0.5;
      const backY = s.low ? 0.6 : 0.9, backH = s.low ? 0.5 : 0.85;
      const armH = s.low ? 0.42 : 0.62;
      const cuTop = seatY + seatH / 2 + 0.11;
      // 日式：木底座
      if (s.wood) {
        const woodM = new THREE.MeshStandardMaterial({ color: 0x5a3f28, roughness: 0.6 });
        const base = makeBox(LONG + 0.15, 0.12, DEPTH + SHORT + 0.15, woodM);
        base.position.set(0, 0.06, (SHORT) / 2); g.add(base);
      }
      g.add(boxAt(LONG, seatH, DEPTH, m, 0, seatY, 0));
      g.add(boxAt(LONG, backH, 0.25, m, 0, backY, -0.5));
      // 扶手：工業=捲狀皮、其餘=方塊
      if (s.leather) {
        const a1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, DEPTH, 14), m);
        a1.rotation.z = Math.PI / 2; a1.position.set(-side * (LONG / 2 + 0.1), seatY + 0.22, 0); g.add(a1);
        const a2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, DEPTH + SHORT, 14), m);
        a2.rotation.x = Math.PI / 2; a2.position.set(side * (LONG / 2 + 0.1), seatY + 0.22, SHORT / 2); g.add(a2);
      } else {
        g.add(boxAt(0.25, armH, DEPTH, m, -side * (LONG / 2 + 0.12), seatY + armH / 2 - 0.05, 0));
        g.add(boxAt(0.25, armH, DEPTH + SHORT, m, side * (LONG / 2 + 0.12), seatY + armH / 2 - 0.05, SHORT / 2));
      }
      // 貴妃椅座
      g.add(boxAt(1.1, seatH, SHORT, m, side * (LONG / 2 - 0.55), seatY, DEPTH / 2 + SHORT / 2));
      // 座墊
      const cuMat = s.leather ? new THREE.MeshStandardMaterial({ color: 0x3a1f10, roughness: 0.5, metalness: 0.15 }) : m;
      [-1.35, -0.45, 0.45, 1.35].forEach(cx => g.add(boxAt(0.84, 0.22, 0.85, cuMat, cx, cuTop, 0)));
      g.add(boxAt(0.95, 0.22, 1.0, cuMat, side * (LONG / 2 - 0.55), cuTop, DEPTH / 2 + SHORT / 2));
      // 工業：銅釘 + 木腳
      if (s.studs) {
        const studMat = new THREE.MeshStandardMaterial({ color: 0xc8a060, roughness: 0.3, metalness: 0.85 });
        for (let i = 0; i < 12; i++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), studMat); st.position.set(-1.6 + i * 0.3, backY + 0.05, -0.37); g.add(st); }
      }
      if (!s.low && !s.wood) {
        const legMat = new THREE.MeshStandardMaterial({ color: s.leather ? 0x1a0d05 : 0x2c2c2c, roughness: 0.4 });
        [[-1.6, 0.5], [1.6, 0.5], [-1.6, -0.4], [1.6, -0.4]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8), legMat); leg.position.set(lx, 0.1, lz); g.add(leg);
        });
      }
      g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    }

    // 依風格重建雙人沙發
    function buildLoveseat(g, styleKey) {
      clearGroup(g);
      const s = SOFA_STYLE[styleKey] || SOFA_STYLE.nordic;
      const m = sofaMat(s);
      const W = 2.2, D = 1.3;
      const seatY = s.low ? 0.28 : 0.45, seatH = s.low ? 0.32 : 0.55;
      const backY = s.low ? 0.62 : 0.95, backH = s.low ? 0.5 : 0.95;
      const armH = s.low ? 0.45 : 0.78;
      const cuTop = seatY + seatH / 2 + 0.13;
      if (s.wood) {
        const woodM = new THREE.MeshStandardMaterial({ color: 0x5a3f28, roughness: 0.6 });
        g.add(boxAt(W + 0.15, 0.12, D + 0.15, woodM, 0, 0.06, 0));
      }
      g.add(boxAt(W, seatH, D, m, 0, seatY, 0));
      g.add(boxAt(W, backH, 0.3, m, 0, backY, -0.5));
      if (s.leather) {
        [-1, 1].forEach(sx => { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, D, 14), m); a.rotation.x = Math.PI / 2; a.position.set(sx * 1.0, seatY + 0.24, 0); g.add(a); });
      } else {
        [-1, 1].forEach(sx => g.add(boxAt(0.28, armH, D, m, sx * 1.0, seatY + armH / 2 - 0.05, 0)));
      }
      const cuMat = s.leather ? new THREE.MeshStandardMaterial({ color: 0x3a1f10, roughness: 0.5, metalness: 0.15 }) : m;
      [-0.5, 0.5].forEach(cx => g.add(boxAt(0.9, 0.24, 1.1, cuMat, cx, cuTop, 0.05)));
      if (s.studs) {
        const studMat = new THREE.MeshStandardMaterial({ color: 0xc8a060, roughness: 0.3, metalness: 0.85 });
        for (let i = 0; i < 8; i++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), studMat); st.position.set(-0.9 + i * 0.26, backY + 0.05, -0.37); g.add(st); }
      }
      if (!s.low && !s.wood) {
        const legMat = new THREE.MeshStandardMaterial({ color: s.leather ? 0x1a0d05 : 0x2c2c2c, roughness: 0.4 });
        [[-0.95, 0.55], [0.95, 0.55], [-0.95, -0.55], [0.95, -0.55]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8), legMat); leg.position.set(lx, 0.1, lz); g.add(leg);
        });
      }
      g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    }

    // 依 altType 重建（給切換風格/選款式時呼叫）
    function rebuildAltSofa(group, styleKey) {
      if (group.userData.altType === 'L') buildLSofa(group, styleKey);
      else if (group.userData.altType === 'love') buildLoveseat(group, styleKey);
    }

    const sofaAltLL = new THREE.Group();
    sofaAltLL.userData.altType = 'L';
    buildLSofa(sofaAltLL, 'nordic');
    sofaAltLL.position.set(0, 0, -4); sofaAltLL.visible = false; scene.add(sofaAltLL);
    registerDraggable(sofaAltLL, { halfW: 2.05, halfD: 1.2, canRotate: true, slot: 'sofa' });

    const sofaAltLove = new THREE.Group();
    sofaAltLove.userData.altType = 'love';
    buildLoveseat(sofaAltLove, 'nordic');
    sofaAltLove.position.set(0, 0, -4); sofaAltLove.visible = false; scene.add(sofaAltLove);
    registerDraggable(sofaAltLove, { halfW: 1.25, halfD: 0.85, canRotate: true, slot: 'sofa' });

    sofaVariants.altLL = sofaAltLL;
    sofaVariants.altLove = sofaAltLove;

    // 明確追蹤當前 slot 對應的風格 key（跟可見性脫鉤，這樣 toggle off 後再 on 不會 fallback 回 Nordic）
    let currentSofaKey = 'nordic';
    function activeSofa() {
      return sofaVariants[currentSofaKey];
    }
    function switchSofaVariant(targetKey) {
      const current = activeSofa();
      const target = sofaVariants[targetKey];
      if (!target || target === current) return;
      // L 型/雙人沙發：依當前房間風格重建外觀（日式矮木框、工業皮革等）
      if (target.userData.altType) rebuildAltSofa(target, currentStyleKey);
      // 繼承當前位置與旋轉（讓 target 從 current 視覺位置開始，避免突兀）
      target.position.copy(current.position);
      target.rotation.y = current.rotation.y;
      current.visible = false;
      current.scale.set(1, 1, 1);
      currentSofaKey = targetKey;
      target.visible = true;
      target.scale.set(0.01, 0.01, 0.01);
      // Scale 動畫
      const t0 = performance.now();
      (function step(now) {
        const t = Math.min((now - t0) / 400, 1);
        const e = 1 - Math.pow(1 - t, 3);
        target.scale.set(e, e, e);
        if (t < 1) requestAnimationFrame(step);
      })(performance.now());
      // 補做位置動畫到 slotTargets — 確保 layout 動畫進行中切換變體也能跟到位
      smoothTransform(target, slotTargets.sofa.x, slotTargets.sofa.z, slotTargets.sofa.rotY, 600);
      // L 型沙發時把茶几移到貴妃椅對側，避免重疊
      repositionTableForSofa();
    }

    // L 型沙發時茶几移到貴妃椅對側（長邊前方），避免貴妃椅切到茶几
    function repositionTableForSofa() {
      let dx = 0;
      if (currentSofaKey === 'altLL') dx = 0.5;  // 貴妃椅在左 → 茶几略移右避開貴妃椅（但不碰到右邊邊几）
      const tbl = activeTable();
      smoothTransform(tbl, slotTargets.table.x + dx, slotTargets.table.z, slotTargets.table.rotY, 500);
    }

    // === 風格專屬茶几變體 ===
    // 日式：寬扁矮和室桌
    const tableJapanese = (function() {
      const g = new THREE.Group();
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3f28, roughness: 0.65 });
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 1.4), woodMat);
      top.position.y = 0.65;
      top.castShadow = true;
      top.receiveShadow = true;
      g.add(top);
      // 四個短角腳
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), woodMat);
        leg.position.set((i % 2 ? 1.05 : -1.05), 0.3, (i < 2 ? 0.6 : -0.6));
        leg.castShadow = true;
        g.add(leg);
      }
      // 桌下橫木
      const beam = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.05), woodMat);
      beam.position.y = 0.18;
      g.add(beam);
      return g;
    })();
    tableJapanese.position.set(0, 0, -1.5);
    tableJapanese.visible = false;
    scene.add(tableJapanese);
    registerDraggable(tableJapanese, { halfW: 1.2, halfD: 0.7, canRotate: true, slot: 'table' });

    // 工業：金屬管腳 + 厚實木板
    const tableIndustrial = (function() {
      const g = new THREE.Group();
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.7 });
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.8 });
      // 厚實木板
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 1.3), woodMat);
      top.position.y = 0.65;
      top.castShadow = true;
      top.receiveShadow = true;
      g.add(top);
      // 4 個金屬管腳
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 12), pipeMat);
        leg.position.set((i % 2 ? 0.95 : -0.95), 0.28, (i < 2 ? 0.55 : -0.55));
        leg.castShadow = true;
        g.add(leg);
      }
      // 橫向加強支架
      const brace1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 8), pipeMat);
      brace1.rotation.z = Math.PI / 2;
      brace1.position.y = 0.1;
      g.add(brace1);
      const brace2 = brace1.clone();
      brace2.rotation.z = 0;
      brace2.rotation.x = Math.PI / 2;
      brace2.scale.set(1, 1.15 / 1.9, 1);
      g.add(brace2);
      return g;
    })();
    tableIndustrial.position.set(0, 0, -1.5);
    tableIndustrial.visible = false;
    scene.add(tableIndustrial);
    registerDraggable(tableIndustrial, { halfW: 1.1, halfD: 0.65, canRotate: true, slot: 'table' });

    // 極簡：玻璃面 + 細黑腳
    const tableMinimal = (function() {
      const g = new THREE.Group();
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xeaf0f5, roughness: 0.05, metalness: 0.2,
        transparent: true, opacity: 0.6
      });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.4 });
      // 玻璃面
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.04, 1.1), glassMat);
      top.position.y = 0.66;
      g.add(top);
      // 玻璃邊緣（細框）
      const edge = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.06, 1.12), frameMat);
      edge.position.y = 0.63;
      g.add(edge);
      // 4 個極細黑腳
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.63, 0.035), frameMat);
        leg.position.set((i % 2 ? 0.96 : -0.96), 0.315, (i < 2 ? 0.46 : -0.46));
        leg.castShadow = true;
        g.add(leg);
      }
      return g;
    })();
    tableMinimal.position.set(0, 0, -1.5);
    tableMinimal.visible = false;
    scene.add(tableMinimal);
    registerDraggable(tableMinimal, { halfW: 1.05, halfD: 0.6, canRotate: true, slot: 'table' });

    // 茶几變體映射 + helper
    const tableVariants = {
      nordic: table,
      japanese: tableJapanese,
      industrial: tableIndustrial,
      minimal: tableMinimal
    };

    // === 額外茶几款式（用 M.table 材質→隨風格換色）===
    const tableAltSquare = (function() { // 方形雙層茶几
      const g = new THREE.Group();
      const top = makeBox(1.4, 0.1, 1.4, M.table); top.position.y = 0.62;
      const shelf = makeBox(1.2, 0.06, 1.2, M.table); shelf.position.y = 0.28;
      for (let i = 0; i < 4; i++) {
        const leg = makeBox(0.08, 0.62, 0.08, M.table);
        leg.position.set((i % 2 ? 0.62 : -0.62), 0.31, (i < 2 ? 0.62 : -0.62));
        g.add(leg);
      }
      g.add(top, shelf);
      return g;
    })();
    tableAltSquare.position.set(0, 0, -1.5); tableAltSquare.visible = false; scene.add(tableAltSquare);
    registerDraggable(tableAltSquare, { halfW: 0.75, halfD: 0.75, canRotate: true, slot: 'table' });

    const tableAltRound = (function() { // 圓形單柱茶几
      const g = new THREE.Group();
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.1, 28), M.table);
      top.position.y = 0.6; top.castShadow = true;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 16), M.table);
      pillar.position.y = 0.3;
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.05, 24), M.table);
      foot.position.y = 0.02;
      g.add(top, pillar, foot);
      return g;
    })();
    tableAltRound.position.set(0, 0, -1.5); tableAltRound.visible = false; scene.add(tableAltRound);
    registerDraggable(tableAltRound, { halfW: 0.78, halfD: 0.78, canRotate: false, slot: 'table' });

    tableVariants.altSquare = tableAltSquare;
    tableVariants.altRound = tableAltRound;

    let currentTableKey = 'nordic';
    function activeTable() {
      return tableVariants[currentTableKey];
    }
    function switchTableVariant(targetKey) {
      const current = activeTable();
      const target = tableVariants[targetKey];
      if (!target || target === current) return;
      target.position.copy(current.position);
      target.rotation.y = current.rotation.y;
      // 把桌上小物從 current 重新 attach 到 target（保留 world transform）
      [book, book2, cup, vase, succulent].forEach(item => {
        if (item.parent === current) target.attach(item);
      });
      current.visible = false;
      currentTableKey = targetKey;
      current.scale.set(1, 1, 1);
      target.visible = true;
      target.scale.set(0.01, 0.01, 0.01);
      const t0 = performance.now();
      (function step(now) {
        const t = Math.min((now - t0) / 400, 1);
        const e = 1 - Math.pow(1 - t, 3);
        target.scale.set(e, e, e);
        if (t < 1) requestAnimationFrame(step);
      })(performance.now());
      smoothTransform(target, slotTargets.table.x, slotTargets.table.z, slotTargets.table.rotY, 600);
    }

    // === 風格專屬立燈變體 ===
    // 日式：紙燈籠落地（較大版本，仿和室）
    const lampJapanese = (function() {
      const g = new THREE.Group();
      // 木底座
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.05, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.6 })
      );
      base.position.y = 0.025;
      base.castShadow = true;
      g.add(base);
      // 紙燈體（圓柱）
      const paper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 1.6, 24),
        new THREE.MeshStandardMaterial({
          color: 0xf5e6d3, roughness: 0.7,
          emissive: 0xffd680, emissiveIntensity: 0.55,
          transparent: true, opacity: 0.92
        })
      );
      paper.position.y = 0.85;
      g.add(paper);
      // 橫向竹條
      for (let i = 0; i < 5; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.355, 0.012, 6, 24),
          new THREE.MeshStandardMaterial({ color: 0x4a3a2c })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.25 + i * 0.32;
        g.add(ring);
      }
      // 頂蓋
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.35, 0.05, 24),
        new THREE.MeshStandardMaterial({ color: 0x2c2c2c })
      );
      cap.position.y = 1.68;
      g.add(cap);
      // 暖光點光源
      const glow = new THREE.PointLight(0xffd680, 0.7, 6);
      glow.position.y = 0.85;
      g.add(glow);
      return g;
    })();
    lampJapanese.position.set(-4, 0, -4.5);
    lampJapanese.visible = false;
    scene.add(lampJapanese);
    registerDraggable(lampJapanese, { halfW: 0.4, halfD: 0.4, canRotate: false, slot: 'lamp' });

    // 工業：愛迪生燈泡 + 黑色金屬桿
    const lampIndustrial = (function() {
      const g = new THREE.Group();
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.75 });
      // 底座
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.36, 0.05, 24),
        pipeMat
      );
      base.position.y = 0.025;
      base.castShadow = true;
      g.add(base);
      // 主桿
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 2.4, 12),
        pipeMat
      );
      pole.position.y = 1.25;
      pole.castShadow = true;
      g.add(pole);
      // 頂端橫桿
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12),
        pipeMat
      );
      arm.rotation.z = Math.PI / 2;
      arm.position.set(0.22, 2.45, 0);
      g.add(arm);
      // 燈座
      const socket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 0.08, 12),
        pipeMat
      );
      socket.position.set(0.47, 2.4, 0);
      g.add(socket);
      // 愛迪生燈泡（透明黃光，emissive）
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xffd680, roughness: 0.1, metalness: 0.05,
        emissive: 0xffaa30, emissiveIntensity: 0.85,
        transparent: true, opacity: 0.85
      });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), bulbMat);
      bulb.position.set(0.47, 2.25, 0);
      bulb.scale.set(0.9, 1.4, 0.9);
      g.add(bulb);
      // 點光源
      const glow = new THREE.PointLight(0xffaa30, 0.8, 7);
      glow.position.set(0.47, 2.25, 0);
      g.add(glow);
      return g;
    })();
    lampIndustrial.position.set(-4, 0, -4.5);
    lampIndustrial.visible = false;
    scene.add(lampIndustrial);
    registerDraggable(lampIndustrial, { halfW: 0.4, halfD: 0.4, canRotate: false, slot: 'lamp' });

    // 極簡：超細弧線立燈
    const lampMinimal = (function() {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.3, metalness: 0.2 });
      // 底座（圓盤）
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.32, 0.04, 24),
        mat
      );
      base.position.y = 0.02;
      base.castShadow = true;
      g.add(base);
      // 垂直細桿
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 2.5, 12),
        mat
      );
      pole.position.y = 1.29;
      pole.castShadow = true;
      g.add(pole);
      // 弧形頂段（用 Torus 切片模擬）
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.018, 8, 16, Math.PI / 2),
        mat
      );
      arc.position.set(0, 2.54, 0);
      arc.rotation.z = -Math.PI / 2;
      g.add(arc);
      // 末端燈頭（小球）
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xffffff, roughness: 0.2,
          emissive: 0xffffff, emissiveIntensity: 0.6
        })
      );
      head.position.set(0.35, 2.54, 0);
      g.add(head);
      // 中性白光
      const glow = new THREE.PointLight(0xffffff, 0.4, 5);
      glow.position.set(0.35, 2.54, 0);
      g.add(glow);
      return g;
    })();
    lampMinimal.position.set(-4, 0, -4.5);
    lampMinimal.visible = false;
    scene.add(lampMinimal);
    registerDraggable(lampMinimal, { halfW: 0.4, halfD: 0.4, canRotate: false, slot: 'lamp' });

    // 立燈變體映射 + helper
    const lampVariants = {
      nordic: lamp,
      japanese: lampJapanese,
      industrial: lampIndustrial,
      minimal: lampMinimal
    };

    // === 額外立燈款式 ===
    const lampAltTripod = (function() { // 三腳立燈
      const g = new THREE.Group();
      const poleMat = M.table;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 10), poleMat);
      pole.position.y = 1.3; pole.castShadow = true;
      for (let i = 0; i < 3; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), poleMat);
        const a = (i / 3) * Math.PI * 2;
        leg.position.set(Math.cos(a) * 0.35, 0.62, Math.sin(a) * 0.35);
        leg.rotation.z = Math.cos(a) * 0.4;
        leg.rotation.x = -Math.sin(a) * 0.4;
        leg.castShadow = true;
        g.add(leg);
      }
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.6, 20, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xe8d5b7, emissive: 0xffe4b5, emissiveIntensity: 0.3, roughness: 0.4, side: THREE.DoubleSide })
      );
      shade.position.y = 2.45; shade.castShadow = true;
      const bulb = new THREE.PointLight(0xffe4b5, 0.5, 7, 1.5); bulb.position.y = 2.4;
      g.add(pole, shade, bulb);
      return g;
    })();
    lampAltTripod.position.set(-4, 0, -4.5); lampAltTripod.visible = false; scene.add(lampAltTripod);
    registerDraggable(lampAltTripod, { halfW: 0.5, halfD: 0.5, canRotate: false, slot: 'lamp' });

    lampVariants.altTripod = lampAltTripod;

    let currentLampKey = 'nordic';
    function activeLamp() {
      return lampVariants[currentLampKey];
    }
    function switchLampVariant(targetKey) {
      const current = activeLamp();
      const target = lampVariants[targetKey];
      if (!target || target === current) return;
      target.position.copy(current.position);
      target.rotation.y = current.rotation.y;
      current.visible = false;
      current.scale.set(1, 1, 1);
      currentLampKey = targetKey;
      target.visible = true;
      target.scale.set(0.01, 0.01, 0.01);
      const t0 = performance.now();
      (function step(now) {
        const t = Math.min((now - t0) / 400, 1);
        const e = 1 - Math.pow(1 - t, 3);
        target.scale.set(e, e, e);
        if (t < 1) requestAnimationFrame(step);
      })(performance.now());
      smoothTransform(target, slotTargets.lamp.x, slotTargets.lamp.z, slotTargets.lamp.rotY, 600);
    }

    // 風格對應的擺飾與紋理映射
    const STYLE_DECOR = {
      nordic: ['blanket', 'succulent'],
      japanese: ['lantern'],          // 移除禪石（user 要求）
      industrial: ['shelf', 'metalSign'],
      minimal: ['sculpture', 'orchidVase']
    };
    // 記錄當前風格鍵（給 applyLayout 判斷風格擺飾要不要顯示用）
    let currentStyleKey = 'nordic';
    const decorMap = {
      blanket: nordicBlanket,
      lantern,
      shelf,
      sculpture,
      succulent,
      zenStones,
      metalSign,
      orchidVase
    };
    const STYLE_SOFA = {
      nordic: 'nordic',
      japanese: 'japanese',
      industrial: 'industrial',
      minimal: 'minimal'
    };
    const STYLE_TABLE = { nordic: 'nordic', japanese: 'japanese', industrial: 'industrial', minimal: 'minimal' };
    const STYLE_LAMP  = { nordic: 'nordic', japanese: 'japanese', industrial: 'industrial', minimal: 'minimal' };
    const STYLE_FLOOR = {
      nordic: 'wood_light',
      japanese: 'tatami',
      industrial: 'dark_wood',
      minimal: 'concrete'
    };
    const STYLE_WALL = {
      nordic: null,
      japanese: 'rice_paper',
      industrial: 'brick',
      minimal: null
    };

    // === 家具導購商品資料 ===
    // 沙發/茶几/立燈依風格有不同商品；其餘為固定商品
    const PRODUCTS = {
      sofa: {
        nordic:     { name: 'NORDIC 淺灰布質三人沙發 W210', brand: 'IKEA', price: 18900 },
        japanese:   { name: 'MUJI 低背實木框三人沙發 W200', brand: '無印良品 MUJI', price: 22500 },
        industrial: { name: 'VINTAGE 牛皮 Chesterfield 沙發 W220', brand: 'H&D 東稻家居', price: 32800 },
        minimal:    { name: 'PURE 羽絨低背模組沙發 W215', brand: 'hoi! 好好生活', price: 27600 },
        altLL:      { name: 'COMFY L 型四人沙發 W360', brand: 'IKEA', price: 32900 },
        altLove:    { name: 'COZY 雙人小沙發 W160', brand: 'hoi! 好好生活', price: 13800 }
      },
      table: {
        nordic:     { name: 'NORDIC 圓邊白橡木茶几 Ø90', brand: 'IKEA', price: 4990 },
        japanese:   { name: 'MUJI 胡桃木矮和室桌 W120', brand: '無印良品 MUJI', price: 6800 },
        industrial: { name: 'LOFT 鐵件實木茶几 W110', brand: 'H&D 東稻家居', price: 7500 },
        minimal:    { name: 'PURE 強化玻璃面茶几 W120', brand: 'hoi! 好好生活', price: 8200 },
        altSquare:  { name: 'STACK 方形雙層收納茶几 W140', brand: 'IKEA', price: 5990 },
        altRound:   { name: 'DRUM 圓形單柱茶几 Ø150', brand: 'hoi! 好好生活', price: 6500 }
      },
      lamp: {
        nordic:     { name: 'NORDIC 宣紙球形立燈 H160', brand: 'IKEA', price: 2490 },
        japanese:   { name: 'MUJI 和紙落地行燈 H170', brand: '無印良品 MUJI', price: 3200 },
        industrial: { name: 'EDISON 金屬桿復古立燈 H175', brand: 'H&D 東稻家居', price: 3980 },
        minimal:    { name: 'ARC 弧形 LED 釣魚燈 H210', brand: 'hoi! 好好生活', price: 4500 },
        altTripod:  { name: 'TRIPOD 三腳木質立燈 H160', brand: 'IKEA', price: 2890 }
      },
      plant:   { name: '龜背芋觀葉植栽（含陶盆）', brand: 'IKEA', price: 1290 },
      rug:     { name: '北歐幾何短毛地毯 160×230', brand: 'hoi! 好好生活', price: 3680 },
      blanket: { name: '美麗諾羊毛針織蓋毯', brand: '無印良品 MUJI', price: 990 },
      lantern: { name: '和風竹編紙燈籠擺飾', brand: '無印良品 MUJI', price: 1480 },
      shelf:   { name: '工業風鐵件四層收納架', brand: 'H&D 東稻家居', price: 5600 },
      sculpture:{ name: '北歐抽象石膏藝術擺飾', brand: 'hoi! 好好生活', price: 2200 },
      succulent:{ name: '多肉拼盤小盆栽', brand: 'IKEA', price: 390 },
      vase:    { name: '霧面陶瓷花瓶（附乾燥花）', brand: '無印良品 MUJI', price: 690 },
      armchair: { name: '單人弧背扶手椅', brand: 'H&D 東稻家居', price: 9800 },
      armchairB:{ name: '高背閱讀單椅', brand: 'H&D 東稻家居', price: 11200 },
      armchairJP:{ name: '日式低背實木單椅', brand: '無印良品 MUJI', price: 8600 },
      tvStand:  { name: '低式電視櫃＋65吋情境電視', brand: 'hoi! 好好生活', price: 15600 },
      tvStandB: { name: '高展示收納電視櫃＋電視', brand: 'hoi! 好好生活', price: 18900 },
      sideTable:{ name: '金屬圓盤邊几 Ø40', brand: 'IKEA', price: 1990 },
      sideTableB:{ name: '方形三層收納邊几', brand: 'IKEA', price: 2490 }
    };
    // 物件 → 商品 key 對應（變體型用 slot，其餘用名稱）
    function getProductFor(obj) {
      const slot = obj.userData.slot;
      if (slot === 'sofa') return PRODUCTS.sofa[currentSofaKey];
      if (slot === 'table') return PRODUCTS.table[currentTableKey];
      if (slot === 'lamp') return PRODUCTS.lamp[currentLampKey];
      const key = obj.userData.productKey;
      return key ? PRODUCTS[key] : null;
    }
    // 非變體家具標上商品 key
    plant.userData.productKey = 'plant';
    rug.userData.productKey = 'rug';
    nordicBlanket.userData.productKey = 'blanket';
    lantern.userData.productKey = 'lantern';
    shelf.userData.productKey = 'shelf';
    sculpture.userData.productKey = 'sculpture';
    succulent.userData.productKey = 'succulent';
    vase.userData.productKey = 'vase';

    // === OrbitControls ===
    const controls = new THREE.OrbitControls(camera, canvas);
    controls.target.set(0, 1.2, -2);
    controls.minDistance = 5;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minPolarAngle = Math.PI / 8;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = false;

    // === 家具拖曳 + 旋轉系統 ===
    const raycaster = new THREE.Raycaster();
    const ndcMouse = new THREE.Vector2();
    // 動態平面：每次拖曳開始時設為物件當前高度
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const tempVec = new THREE.Vector3();
    const dragOffset = new THREE.Vector3();
    let dragged = null;
    let dragOriginalY = 0;
    let hoverObj = null;
    const tapStart = { x: 0, y: 0, moved: 0 }; // 用於區分單擊與拖曳

    function updateMouseFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      ndcMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndcMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndcMouse, camera);
    }

    function findDraggableRoot(o) {
      while (o && !o.userData.draggable) o = o.parent;
      return o;
    }

    function pickDraggable() {
      const candidates = draggableList.filter(o => o.visible);
      const hits = raycaster.intersectObjects(candidates, true);
      for (const h of hits) {
        const root = findDraggableRoot(h.object);
        if (root) return { root: root, point: h.point };
      }
      return null;
    }

    // 根據旋轉動態計算邊界（每 90° 切換 W/D）
    function getEffectiveBounds(obj) {
      const rot = ((obj.rotation.y % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const swap = (rot > Math.PI / 4 && rot < 3 * Math.PI / 4) ||
                   (rot > 5 * Math.PI / 4 && rot < 7 * Math.PI / 4);
      return swap
        ? { hw: obj.userData.halfD, hd: obj.userData.halfW }
        : { hw: obj.userData.halfW, hd: obj.userData.halfD };
    }

    function clampInRoom(obj, x, z) {
      const half = 5.7; // 牆內側
      const b = getEffectiveBounds(obj);
      return {
        x: Math.max(-half + b.hw, Math.min(half - b.hw, x)),
        z: Math.max(-half + b.hd, Math.min(half - b.hd, z))
      };
    }

    let draggedIsWall = false; // 是否為牆上物品
    const WALL_Z = -5.95; // 後牆 z 座標
    const WALL_X = -5.95; // 左牆 x 座標
    const WALL_HALF = 6;   // 牆寬一半
    const WALL_TOP = 6.5;  // 牆高
    const backWallPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 5.95);
    const leftWallPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 5.95);
    const _vBack = new THREE.Vector3();
    const _vLeft = new THREE.Vector3();

    function setWallPlane(wall, item) {
      if (wall === 'back') {
        dragPlane.set(new THREE.Vector3(0, 0, 1), -item.position.z);
      } else { // 'left'
        dragPlane.set(new THREE.Vector3(1, 0, 0), -item.position.x);
      }
    }

    function applyWallTransform(item, wall) {
      // 將物件貼到指定牆面，並設定面向房間內部的旋轉
      if (wall === 'back') {
        item.position.z = WALL_Z;
        item.rotation.y = 0;
      } else { // 'left'
        item.position.x = WALL_X;
        item.rotation.y = Math.PI / 2;
      }
      item.userData.wallItem = wall;
    }

    // 透過滑鼠射線分別跟兩面牆的「平面」求交，挑可見範圍內最近的那面
    function detectTargetWall() {
      const hitBack = raycaster.ray.intersectPlane(backWallPlane, _vBack);
      const hitLeft = raycaster.ray.intersectPlane(leftWallPlane, _vLeft);
      const backValid = hitBack &&
        _vBack.x >= -WALL_HALF && _vBack.x <= WALL_HALF &&
        _vBack.y >= 0 && _vBack.y <= WALL_TOP;
      const leftValid = hitLeft &&
        _vLeft.z >= -WALL_HALF && _vLeft.z <= WALL_HALF &&
        _vLeft.y >= 0 && _vLeft.y <= WALL_TOP;
      if (backValid && leftValid) {
        const dBack = raycaster.ray.origin.distanceTo(_vBack);
        const dLeft = raycaster.ray.origin.distanceTo(_vLeft);
        return dBack < dLeft ? 'back' : 'left';
      }
      if (backValid) return 'back';
      if (leftValid) return 'left';
      return null; // 滑鼠不在任何牆面上 → 不切換
    }

    canvas.addEventListener('pointerdown', (e) => {
      updateMouseFromEvent(e);
      hideProductCard(); // 任何新互動先收起商品卡（點空白處也會關閉）
      const hit = pickDraggable();
      if (!hit) return;

      // 記錄按下位置與時間，用來在 pointerup 判斷「單擊」還是「拖曳」
      tapStart.x = e.clientX; tapStart.y = e.clientY; tapStart.moved = 0;

      dragged = hit.root;
      // 若 dragged 是其他物件的子物件（如毛毯綁在沙發上），先暫時 detach 到 scene
      // 以便在 world space 中拖曳，endDrag 時再 reattach
      if (dragged.parent && dragged.parent !== scene) {
        dragged.userData._origParent = dragged.parent;
        scene.attach(dragged); // 保留 world transform，僅切換 parent
      }
      dragOriginalY = dragged.position.y;
      draggedIsWall = !!dragged.userData.wallItem;
      controls.enabled = false;
      canvas.setPointerCapture(e.pointerId);

      if (draggedIsWall) {
        setWallPlane(dragged.userData.wallItem, dragged);
      } else {
        dragPlane.set(new THREE.Vector3(0, 1, 0), -dragOriginalY);
      }

      if (raycaster.ray.intersectPlane(dragPlane, tempVec)) {
        dragOffset.copy(tempVec).sub(dragged.position);
      }

      canvas.style.cursor = 'grabbing';

      // 視覺反饋：地毯與牆上物品不抬起
      if (dragged !== rug && !draggedIsWall) {
        dragged.position.y = dragOriginalY + 0.08;
      }
      e.preventDefault();
    });

    canvas.addEventListener('pointermove', (e) => {
      updateMouseFromEvent(e);

      if (dragged) {
        // 累積移動距離（判斷是否為拖曳）
        tapStart.moved += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
        if (draggedIsWall) {
          // === 牆上物品：自動偵測最近的牆並切換 ===
          const targetWall = detectTargetWall();
          if (targetWall && targetWall !== dragged.userData.wallItem) {
            // 切牆：更新位置、旋轉、拖曳平面
            applyWallTransform(dragged, targetWall);
            setWallPlane(targetWall, dragged);
            // 重設 offset 為 0，物件吸附到游標下
            dragOffset.set(0, 0, 0);
          }

          if (raycaster.ray.intersectPlane(dragPlane, tempVec)) {
            tempVec.sub(dragOffset);
            const halfRoomW = 5.7;
            const hw = dragged.userData.halfW || 0.5;
            const hh = (dragged === painting) ? 0.6 : 1.1; // 半高

            if (dragged.userData.wallItem === 'back') {
              dragged.position.x = Math.max(-halfRoomW + hw, Math.min(halfRoomW - hw, tempVec.x));
              dragged.position.y = Math.max(0.5 + hh, Math.min(6 - hh, tempVec.y));
              dragged.position.z = WALL_Z;
            } else {
              dragged.position.z = Math.max(-halfRoomW + hw, Math.min(halfRoomW - hw, tempVec.z));
              dragged.position.y = Math.max(0.5 + hh, Math.min(6 - hh, tempVec.y));
              dragged.position.x = WALL_X;
            }
          }
        } else {
          // === 一般物品：水平面拖曳 ===
          if (raycaster.ray.intersectPlane(dragPlane, tempVec)) {
            tempVec.sub(dragOffset);
            const c = clampInRoom(dragged, tempVec.x, tempVec.z);
            dragged.position.x = c.x;
            dragged.position.z = c.z;
          }
        }
      } else {
        // hover 偵測：更換游標、暫停相機縮放讓滾輪可以轉家具
        const hit = pickDraggable();
        if (hit) {
          canvas.style.cursor = 'grab';
          hoverObj = hit.root;
          controls.enableZoom = !hit.root.userData.canRotate ? true : false;
        } else {
          canvas.style.cursor = '';
          hoverObj = null;
          controls.enableZoom = true;
        }
      }
    });

    function endDrag(e) {
      if (!dragged) return;
      // 恢復原始 y（牆上物品 y 已被更新，不需恢復）
      if (!draggedIsWall) {
        dragged.position.y = dragOriginalY;
      }
      // 更新 slotTargets — 切換變體時新變體會繼承使用者擺放的位置
      const slot = dragged.userData.slot;
      if (slot && slotTargets[slot]) {
        slotTargets[slot] = {
          x: dragged.position.x,
          z: dragged.position.z,
          rotY: dragged.rotation.y
        };
      }
      // 若先前被 detach 過，現在 reattach 回原 parent（保留 world transform）
      if (dragged.userData._origParent) {
        dragged.userData._origParent.attach(dragged);
        delete dragged.userData._origParent;
      }
      // 幾乎沒移動 → 視為「單擊」→ 顯示商品卡（導購）
      const wasTap = tapStart.moved < 6;
      const tapped = dragged;
      dragged = null;
      draggedIsWall = false;
      controls.enabled = true;
      canvas.style.cursor = '';
      if (e && e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      if (wasTap) showProductCard(tapped);
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    // === 旋轉：雙擊 → 90° 旋轉 ===
    function smoothRotate(obj, delta, dur) {
      const startY = obj.rotation.y;
      const endY = startY + delta;
      const t0 = performance.now();
      dur = dur || 350;
      (function step(now) {
        const t = Math.min((now - t0) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        obj.rotation.y = startY + (endY - startY) * ease;
        if (t < 1) requestAnimationFrame(step);
      })(performance.now());
    }

    canvas.addEventListener('dblclick', (e) => {
      updateMouseFromEvent(e);
      const hit = pickDraggable();
      if (hit && hit.root.userData.canRotate) {
        e.preventDefault();
        smoothRotate(hit.root, Math.PI / 2);
      }
    });

    // === 旋轉：滾輪 → 連續微調（hover 在家具上時）===
    canvas.addEventListener('wheel', (e) => {
      if (hoverObj && hoverObj.userData.canRotate) {
        e.preventDefault();
        const step = e.deltaY > 0 ? 0.08 : -0.08;
        hoverObj.rotation.y += step;
      }
    }, { passive: false });

    // 重置位置 + 角度
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.entries(originalTransforms).forEach(([id, tr]) => {
          const obj = scene.getObjectById(parseInt(id));
          if (!obj) return;
          const fromPos = obj.position.clone();
          const fromRot = obj.rotation.y;
          const t0 = performance.now();
          const dur = 500;
          (function step(now) {
            const t = Math.min((now - t0) / dur, 1);
            const e = 1 - Math.pow(1 - t, 3);
            obj.position.lerpVectors(fromPos, tr.pos, e);
            obj.rotation.y = fromRot + (tr.rotY - fromRot) * e;
            if (t < 1) requestAnimationFrame(step);
          })(performance.now());
        });
      });
    }

    // === 家具導購：商品卡 + 購物車 ===
    const productCard = document.getElementById('productCard');
    const cartChip = document.getElementById('cartChip');
    let cardObj = null;       // 商品卡目前對應的 3D 物件
    let cardProduct = null;   // 目前顯示的商品資料
    const cart = [];          // 購物車內容 [{name, price}]
    const _projV = new THREE.Vector3();

    function fmtPrice(n) { return 'NT$' + n.toLocaleString('en-US'); }

    function positionCard() {
      if (!cardObj || !productCard) return;
      cardObj.getWorldPosition(_projV);
      _projV.y += 1.2; // 往上偏移到家具上方
      _projV.project(camera);
      const rect = canvas.getBoundingClientRect();
      let x = (_projV.x * 0.5 + 0.5) * rect.width;
      let y = (-_projV.y * 0.5 + 0.5) * rect.height;
      // 夾制在舞台範圍內，避免卡片（向上彈出 translate -110%）超出頂端被裁切
      const cardW = productCard.offsetWidth || 230;
      const cardH = productCard.offsetHeight || 240;
      x = Math.max(cardW / 2 + 6, Math.min(rect.width - cardW / 2 - 6, x));
      y = Math.max(cardH * 1.1 + 6, y); // 上緣不超出舞台頂
      productCard.style.left = x + 'px';
      productCard.style.top = y + 'px';
    }

    // 同一件家具的「其他款式」：風格款（隨房間風格）+ 額外新款式（用 M 材質，色彩跟著風格）
    // 第一項 '__style__' 代表當前風格的預設造型
    const MODEL_OPTIONS = {
      sofa:  [['__style__','風格款'], ['altLL','L 型沙發'], ['altLove','雙人沙發']],
      table: [['__style__','風格款'], ['altSquare','方形雙層'], ['altRound','圓形單柱']],
      lamp:  [['__style__','風格款'], ['altTripod','三腳立燈']],
      armchair:  [['base','弧背款'], ['b','高背款'], ['jp','日式低背']],
      tvStand:   [['base','低式款'], ['b','高展示款']],
      sideTable: [['base','圓盤款'], ['b','三層款']]
    };
    const modelSwitchers = {
      sofa: switchSofaVariant, table: switchTableVariant, lamp: switchLampVariant,
      armchair: armchairSys.switchTo, tvStand: tvStandSys.switchTo, sideTable: sideTableSys.switchTo
    };
    const modelActiveKey = {
      sofa: () => currentSofaKey, table: () => currentTableKey, lamp: () => currentLampKey,
      armchair: armchairSys.getKey, tvStand: tvStandSys.getKey, sideTable: sideTableSys.getKey
    };
    const modelActiveObj = {
      sofa: activeSofa, table: activeTable, lamp: activeLamp,
      armchair: armchairSys.active, tvStand: tvStandSys.active, sideTable: sideTableSys.active
    };
    const STYLE_KEYS = ['nordic', 'japanese', 'industrial', 'minimal'];

    function buildModelOptions(slot) {
      const wrap = document.getElementById('productModelsWrap');
      const box = document.getElementById('productModels');
      if (!wrap || !box) return;
      if (!slot || !MODEL_OPTIONS[slot]) { wrap.classList.add('hidden'); return; }
      wrap.classList.remove('hidden');
      const activeKey = modelActiveKey[slot]();
      const onStyle = STYLE_KEYS.indexOf(activeKey) >= 0; // 目前是否為風格預設造型
      box.innerHTML = MODEL_OPTIONS[slot].map(([key, label]) => {
        const isActive = (key === '__style__') ? onStyle : (key === activeKey);
        return '<button class="model-opt' + (isActive ? ' active' : '') + '" data-key="' + key + '">' + label + '</button>';
      }).join('');
      box.querySelectorAll('.model-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          let key = btn.dataset.key;
          if (key === '__style__') key = currentStyleKey; // 風格款 → 當前風格的造型
          modelSwitchers[slot](key);                 // 切換款式（不動房間風格）
          showProductCard(modelActiveObj[slot]());    // 重新顯示新款式的商品卡
        });
      });
    }

    function showProductCard(obj) {
      if (!productCard) return;
      const p = getProductFor(obj);
      if (!p) { hideProductCard(); return; }
      cardObj = obj;
      cardProduct = p;
      document.getElementById('productBrand').textContent = p.brand;
      document.getElementById('productName').textContent = p.name;
      document.getElementById('productPrice').textContent = fmtPrice(p.price);
      buildModelOptions(obj.userData.slot); // 變體家具顯示款式選擇
      const buyBtn = document.getElementById('productBuy');
      buyBtn.textContent = '🛒 加入購物車';
      buyBtn.classList.remove('added');
      positionCard();
      productCard.classList.add('show');
    }
    function hideProductCard() {
      if (productCard) productCard.classList.remove('show');
      cardObj = null; cardProduct = null;
    }

    const cartList = document.getElementById('cartList');
    const cartItemsEl = document.getElementById('cartItems');

    function renderCartList() {
      if (!cartItemsEl) return;
      if (cart.length === 0) {
        cartItemsEl.innerHTML = '<div class="cart-empty">購物車是空的<br/>點擊家具即可加入</div>';
      } else {
        cartItemsEl.innerHTML = cart.map((it, i) =>
          '<div class="cart-item">' +
            '<div class="cart-item-info">' +
              '<div class="cart-item-name">' + it.name + '</div>' +
              '<div class="cart-item-price">' + fmtPrice(it.price) + '</div>' +
            '</div>' +
            '<button class="cart-item-del" data-idx="' + i + '" title="移除">×</button>' +
          '</div>'
        ).join('');
        cartItemsEl.querySelectorAll('.cart-item-del').forEach(btn => {
          btn.addEventListener('click', () => {
            cart.splice(parseInt(btn.dataset.idx), 1);
            updateCartUI();
            renderCartList();
          });
        });
      }
      const total = cart.reduce((s, it) => s + it.price, 0);
      const totalEl = document.getElementById('cartListTotal');
      if (totalEl) totalEl.textContent = fmtPrice(total);
    }

    function updateCartUI() {
      const count = cart.length;
      const total = cart.reduce((s, it) => s + it.price, 0);
      document.getElementById('cartCount').textContent = count;
      document.getElementById('cartTotal').textContent = fmtPrice(total);
      if (cartChip) {
        cartChip.classList.remove('bump');
        void cartChip.offsetWidth;
        cartChip.classList.add('bump');
      }
      if (cartList && cartList.classList.contains('open')) renderCartList();
    }

    // 點擊購物車 chip → 展開/收合清單
    if (cartChip) cartChip.addEventListener('click', () => {
      const opening = !cartList.classList.contains('open');
      cartList.classList.toggle('open');
      if (opening) renderCartList();
    });
    const cartListClose = document.getElementById('cartListClose');
    if (cartListClose) cartListClose.addEventListener('click', () => cartList.classList.remove('open'));

    // 結帳
    const cartCheckout = document.getElementById('cartCheckout');
    if (cartCheckout) cartCheckout.addEventListener('click', () => {
      if (cart.length === 0) { alert('購物車是空的，先點選家具加入吧！'); return; }
      const count = cart.length;
      const total = cart.reduce((s, it) => s + it.price, 0);
      alert('🎉 結帳成功！\n\n共 ' + count + ' 件家具，總計 ' + fmtPrice(total) +
            '\n\n感謝透過 DecoFlow 導購下單，平台將收取品牌分潤。');
      cart.length = 0;
      updateCartUI();
      renderCartList();
      cartList.classList.remove('open');
    });

    const productClose = document.getElementById('productClose');
    if (productClose) productClose.addEventListener('click', hideProductCard);
    const productBuy = document.getElementById('productBuy');
    if (productBuy) productBuy.addEventListener('click', () => {
      if (!cardProduct) return;
      cart.push({ name: cardProduct.name, price: cardProduct.price });
      updateCartUI();
      productBuy.textContent = '✓ 已加入';
      productBuy.classList.add('added');
      setTimeout(hideProductCard, 700);
    });

    // === 動畫迴圈 ===
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      if (cardObj) positionCard(); // 商品卡跟隨物件 / 相機
      renderer.render(scene, camera);
    }
    animate();

    // 隱藏載入畫面
    const loader = document.getElementById('demoLoader');
    if (loader) {
      setTimeout(() => loader.classList.add('hidden'), 300);
    }

    // === 風格切換 ===
    const STYLES = {
      nordic: {
        name: '北歐風',
        floor: 0xd4b896,
        wall: 0xeae4d7,         // 略暗化避免過曝
        ceiling: 0xeae4d7,
        sofa: 0xc9a87c,
        table: 0x6b5a48,
        lampShade: 0xe8d5b7,
        plantPot: 0x8b6f47,
        plant: 0x4a7c59,
        rug: 0xa89882,
        painting: 0xc9a87c,
        paintingFrame: 0x2c2c2c,
        armchair: 0xc9a87c, sidetbl: 0x8b6f47, tvcab: 0x6b5a48,
        ambient: 0xffffff,
        sun: 0xfff2e0,
        // 燈光強度（解決過曝）
        ambientI: 0.28,
        sunI: 0.65,
        fillI: 0.32,
        floorTint: 0xc8c0b0,    // 地板貼圖染色（降低亮度）
        wallTint: 0xeae4d7      // 牆面色調
      },
      japanese: {
        name: '日式無印',
        floor: 0xc19a6b,
        wall: 0xe8dfc8,
        ceiling: 0xebe3cb,
        sofa: 0xa89882,
        table: 0x8b7355,
        lampShade: 0xf5f1ea,
        plantPot: 0x6b5a48,
        plant: 0x5a8268,
        rug: 0xd4cfc4,
        painting: 0xa89882,
        paintingFrame: 0x6b5a48,
        armchair: 0xa89882, sidetbl: 0x6b5a48, tvcab: 0x5a4530,
        ambient: 0xfff5dc,
        sun: 0xffe8b8,
        ambientI: 0.24,
        sunI: 0.55,
        fillI: 0.28,
        floorTint: 0xc0a880,
        wallTint: 0xd8cdb0
      },
      industrial: {
        name: '工業風',
        floor: 0x4a3a2c,
        wall: 0x3a3a3a,
        ceiling: 0x4a4a4a,
        sofa: 0x2c2c2c,
        table: 0x1a1a1a,
        lampShade: 0xd4a574,
        plantPot: 0x1a1a1a,
        plant: 0x4a6c4a,
        rug: 0x5a4a3a,
        painting: 0xd4a574,
        paintingFrame: 0x1a1a1a,
        armchair: 0x3a2a20, sidetbl: 0x2a2a2a, tvcab: 0x1a1a1a,
        ambient: 0xffd9a0,
        sun: 0xffb060,
        ambientI: 0.45,         // 維持原本較亮（材質本身深）
        sunI: 0.85,
        fillI: 0.55,
        floorTint: 0xffffff,    // 深色貼圖不需要染色
        wallTint: 0xffffff
      },
      minimal: {
        name: '現代極簡',
        floor: 0xe8e8e8,
        wall: 0xe8e8e8,
        ceiling: 0xeeeeee,
        sofa: 0x1a1a1a,
        table: 0x2c2c2c,
        lampShade: 0xffffff,
        plantPot: 0xffffff,
        plant: 0x4a7c59,
        rug: 0xcccccc,
        painting: 0x1a1a1a,
        paintingFrame: 0xffffff,
        armchair: 0x2a2a2a, sidetbl: 0xcccccc, tvcab: 0xe8e8e8,
        ambient: 0xffffff,
        sun: 0xffffff,
        ambientI: 0.32,
        sunI: 0.7,
        fillI: 0.35,
        floorTint: 0xcccccc,
        wallTint: 0xe8e8e8
      }
    };

    function lerpHex(a, b, t) {
      const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
      const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
      return (
        (Math.round(ar + (br - ar) * t) << 16) |
        (Math.round(ag + (bg - ag) * t) << 8) |
        Math.round(ab + (bb - ab) * t)
      );
    }

    // 通用淡入淡出（給擺飾用）
    function animateScale(obj, show) {
      if (show && obj.visible && obj.scale.x > 0.95) return;
      if (!show && !obj.visible) return;
      if (show) {
        obj.visible = true;
        obj.scale.set(0.01, 0.01, 0.01);
        const t0 = performance.now();
        const dur = 450;
        (function step(now) {
          const t = Math.min((now - t0) / dur, 1);
          const e = 1 - Math.pow(1 - t, 3);
          obj.scale.set(e, e, e);
          if (t < 1) requestAnimationFrame(step);
        })(performance.now());
      } else {
        const t0 = performance.now();
        const dur = 300;
        (function step(now) {
          const t = Math.min((now - t0) / dur, 1);
          const e = 1 - t;
          obj.scale.set(e, e, e);
          if (t < 1) requestAnimationFrame(step);
          else { obj.visible = false; obj.scale.set(1, 1, 1); }
        })(performance.now());
      }
    }

    let isAnimating = false;
    function applyStyle(styleKey) {
      const target = STYLES[styleKey];
      if (!target) return;
      currentStyleKey = styleKey;
      hideProductCard(); // 換風格收起商品卡（變體換了，舊卡片資料失效）

      const tag = document.getElementById('demoStyleTag');
      if (tag) {
        tag.textContent = target.name;
        tag.classList.remove('flash');
        void tag.offsetWidth;
        tag.classList.add('flash');
      }

      // === 切換地板紋理 ===
      const floorPattern = STYLE_FLOOR[styleKey];
      if (floorPattern && floorTextures[floorPattern]) {
        M.floor.map = floorTextures[floorPattern];
        // 用 floorTint 替代純白染色，避免淺色貼圖過曝
        M.floor.color.setHex(target.floorTint !== undefined ? target.floorTint : 0xffffff);
        M.floor.needsUpdate = true;
      }
      // === 切換牆面紋理 ===
      const wallPattern = STYLE_WALL[styleKey];
      if (wallPattern && wallTextures[wallPattern]) {
        M.wall.map = wallTextures[wallPattern];
        M.wall.color.setHex(target.wallTint !== undefined ? target.wallTint : 0xffffff);
      } else {
        M.wall.map = null;
        // 無貼圖時用 STYLES 的 wall 色（後面 lerp 動畫會處理）
      }
      M.wall.needsUpdate = true;

      // === 切換風格擺飾 ===
      const wantedDecor = new Set(STYLE_DECOR[styleKey] || []);
      Object.entries(decorMap).forEach(([name, obj]) => {
        animateScale(obj, wantedDecor.has(name));
      });

      // === 切換家具變體 ===
      // 若目前是 L 型/雙人沙發，保留款式但重建成新風格外觀；否則切回風格預設沙發
      if (currentSofaKey === 'altLL' || currentSofaKey === 'altLove') {
        rebuildAltSofa(activeSofa(), styleKey);
      } else {
        switchSofaVariant(STYLE_SOFA[styleKey]);
      }
      switchTableVariant(STYLE_TABLE[styleKey]);
      switchLampVariant(STYLE_LAMP[styleKey]);
      // 日式風格：扶手椅起始款改為日式低背（與日式沙發同類型）；離開日式則回標準弧背款
      if (styleKey === 'japanese') armchairSys.switchTo('jp');
      else if (armchairSys.getKey() === 'jp') armchairSys.switchTo('base');

      // === 顏色 + 燈光強度平滑過渡 ===
      const start = {};
      Object.keys(M).forEach(k => {
        start[k] = M[k].color.getHex();
      });
      start.ambient = ambient.color.getHex();
      start.sun = sunlight.color.getHex();
      start.ambientI = ambient.intensity;
      start.sunI = sunlight.intensity;
      start.fillI = fillLight.intensity;

      const targetAmbientI = target.ambientI !== undefined ? target.ambientI : 0.28;
      const targetSunI = target.sunI !== undefined ? target.sunI : 0.65;
      const targetFillI = target.fillI !== undefined ? target.fillI : 0.32;

      const dur = 700;
      const t0 = performance.now();
      isAnimating = true;

      function step(now) {
        let t = Math.min((now - t0) / dur, 1);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        Object.keys(M).forEach(k => {
          // 有貼圖的 floor 與 wall 保持染色（floorTint/wallTint 已在前面設定）
          if (k === 'floor') return;
          if (k === 'wall' && M.wall.map) return;
          if (target[k] !== undefined) {
            M[k].color.setHex(lerpHex(start[k], target[k], ease));
          }
        });
        ambient.color.setHex(lerpHex(start.ambient, target.ambient, ease));
        sunlight.color.setHex(lerpHex(start.sun, target.sun, ease));
        // 燈光強度過渡
        ambient.intensity = start.ambientI + (targetAmbientI - start.ambientI) * ease;
        sunlight.intensity = start.sunI + (targetSunI - start.sunI) * ease;
        fillLight.intensity = start.fillI + (targetFillI - start.fillI) * ease;

        if (t < 1) requestAnimationFrame(step);
        else isAnimating = false;
      }
      requestAnimationFrame(step);
    }

    // === 格局範本（重新設計，更符合室內設計邏輯）===
    const LAYOUTS = {
      classic: {
        name: '經典靠牆',
        // 沙發貼後牆、茶几在前、左燈右植栽
        sofa:  [0, -4, 0],
        table: [0, -2.2, 0],
        lamp:  [-3.5, -4, 0],
        plant: [3.8, -4.5, 0],
        rug:   [0, -2.8, 0],
        visible: { table: true, lamp: true }
      },
      diagonal: {
        name: '對角配置',
        // 沙發、茶几、地毯共用同一個傾斜角度；植栽放右後角落，平衡左後沙發
        sofa:  [-1.5, -3.8, Math.PI / 8],
        table: [-0.4, -2.3, Math.PI / 8],
        lamp:  [3.5, -1.5, 0],
        plant: [-4.5, -4.5, 0],
        rug:   [-1, -3, Math.PI / 8],
        visible: { table: true, lamp: true }
      },
      center_open: {
        name: '中央開放',
        // 沙發遠離後牆，整組家具置於房間中段
        sofa:  [0, -2.8, 0],
        table: [0, -1, 0],
        lamp:  [-3.5, -3, 0],
        plant: [3.5, -3, 0],
        rug:   [0, -2, 0],
        visible: { table: true, lamp: true }
      },
      reading_nook: {
        name: '閱讀角落',
        // 沙發放左後角，立燈緊鄰，營造閱讀區；茶几與地毯也對齊沙發角度
        sofa:  [-2.5, -4, Math.PI / 10],
        table: [-1.8, -2.6, Math.PI / 10],
        lamp:  [-4.3, -3, 0],
        plant: [4, -4.5, 0],
        rug:   [-2.2, -3.2, Math.PI / 10],
        visible: { table: true, lamp: true }
      },
      face_window: {
        name: '面窗式',
        // 沙發旋轉 +π/2 → 座位面向 +x（窗戶方向）
        // 茶几與地毯同樣旋轉 π/2 與沙發對齊（長軸沿 z 方向）
        sofa:  [-1, -3.2, Math.PI / 2],
        table: [0.7, -3.2, Math.PI / 2],
        lamp:  [-3.8, -3.2, 0],
        plant: [3.5, -4.5, 0],
        rug:   [-0.2, -3.2, Math.PI / 2],
        visible: { table: true, lamp: true }
      },
      minimal_void: {
        name: '極簡留白',
        // 只保留沙發、植栽、地毯，茶几與立燈隱藏
        sofa:  [0, -4, 0],
        table: [0, -2, 0],
        lamp:  [-3, -4, 0],
        plant: [4, -4.5, 0],
        rug:   [0, -2.5, 0],
        visible: { table: false, lamp: false }
      }
    };

    // 各格局的單人扶手椅位置（固定座位，避免隨沙發旋轉跑到牆外）
    const ARMCHAIR_LAYOUTS = {
      classic:      [3.6, -2.2, -0.6],
      diagonal:     [2.8, -3.0, -1.0],   // 移近座位區、面向沙發群
      center_open:  [3.6, -1.4, -0.8],
      reading_nook: [0.5, -3.7, -0.35], // 沙發右側，與沙發並排形成閱讀座位群、略朝內傾
      face_window:  [1.2, -1.0, Math.PI], // 旋轉 90° 面向窗戶/後方
      minimal_void: [4.0, -2.4, -0.6]
    };
    const TV_DISTANCE = 4.2; // 電視櫃與沙發的距離（在沙發正對面，拉開避免擠在茶几旁）

    // === slotTargets：追蹤每個變體型 slot 的「目標位置」===
    // 用於切換變體時，新變體會 smoothTransform 到此位置，
    // 避免「應用格局後切變體，新變體不跟著移動」的 bug
    const slotTargets = {
      sofa:  { x: 0, z: -4,   rotY: 0 },
      table: { x: 0, z: -1.5, rotY: 0 },
      lamp:  { x: -4, z: -4.5, rotY: 0 }
    };

    // 動態回傳當前該移動的家具（含目前可見的沙發/茶几/立燈變體）
    function getLayoutTargets() {
      return { sofa: activeSofa(), table: activeTable(), lamp: activeLamp(), plant, rug };
    }

    function smoothTransform(obj, tx, tz, trotY, dur) {
      // 取消先前動畫：每次呼叫都增加 ID，舊的 step 偵測到不符就停止
      obj.userData._txnId = (obj.userData._txnId || 0) + 1;
      const myId = obj.userData._txnId;
      const fromPos = obj.position.clone();
      const fromRot = obj.rotation.y;
      const tyKeep = obj.position.y;
      const t0 = performance.now();
      dur = dur || 700;
      (function step(now) {
        if (obj.userData._txnId !== myId) return; // 已被新的 smoothTransform 取代
        const t = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - t, 3);
        obj.position.x = fromPos.x + (tx - fromPos.x) * e;
        obj.position.z = fromPos.z + (tz - fromPos.z) * e;
        obj.position.y = tyKeep;
        obj.rotation.y = fromRot + (trotY - fromRot) * e;
        if (t < 1) requestAnimationFrame(step);
      })(performance.now());
    }

    function applyLayout(layoutKey) {
      const layout = LAYOUTS[layoutKey];
      if (!layout) return;
      hideProductCard(); // 換格局家具會移動，收起商品卡

      const tag = document.getElementById('demoStyleTag');
      if (tag) {
        const cur = tag.textContent.split(' · ')[0];
        tag.textContent = cur + ' · ' + layout.name;
        tag.classList.remove('flash');
        void tag.offsetWidth;
        tag.classList.add('flash');
      }

      // 計算各家具的舊位置與舊旋轉（用來計算附屬物的偏移與旋轉）
      const curTable = activeTable();
      const curSofa  = activeSofa();
      const oldTable = { x: curTable.position.x, z: curTable.position.z, rotY: curTable.rotation.y };
      const oldSofa  = { x: curSofa.position.x,  z: curSofa.position.z,  rotY: curSofa.rotation.y };

      // 更新 slotTargets — 切換變體時新變體會跟隨此目標
      if (layout.sofa)  slotTargets.sofa  = { x: layout.sofa[0],  z: layout.sofa[1],  rotY: layout.sofa[2] };
      if (layout.table) slotTargets.table = { x: layout.table[0], z: layout.table[1], rotY: layout.table[2] };
      if (layout.lamp)  slotTargets.lamp  = { x: layout.lamp[0],  z: layout.lamp[1],  rotY: layout.lamp[2] };

      const layoutTargets = getLayoutTargets();
      Object.entries(layoutTargets).forEach(([name, obj]) => {
        const spec = layout[name];
        if (!spec) return;
        smoothTransform(obj, spec[0], spec[1], spec[2], 750);
      });

      // helper: 把附屬物隨主家具一起移動 + 旋轉（用於桌上小物等）
      function moveAttached(items, parentSpec, oldParent) {
        if (!parentSpec) return;
        const dRot = parentSpec[2] - oldParent.rotY;
        const cosD = Math.cos(dRot);
        const sinD = Math.sin(dRot);
        items.forEach(item => {
          if (!item.visible) return;
          const ox = item.position.x - oldParent.x;
          const oz = item.position.z - oldParent.z;
          // 旋轉相對偏移
          const nox = ox * cosD - oz * sinD;
          const noz = ox * sinD + oz * cosD;
          smoothTransform(
            item,
            parentSpec[0] + nox,
            parentSpec[1] + noz,
            item.rotation.y + dRot,
            750
          );
        });
      }

      // helper: 平移（可旋轉物件會同時轉動）— 用於遠離主家具的擺飾
      function moveAttachedShift(items, parentSpec, oldParent) {
        if (!parentSpec) return;
        const dx = parentSpec[0] - oldParent.x;
        const dz = parentSpec[1] - oldParent.z;
        const dRot = parentSpec[2] - oldParent.rotY;
        const half = 5.7;
        items.forEach(item => {
          if (!item.visible) return;
          if (item.userData.wallItem) return; // 牆上物品另有邏輯
          const hw = item.userData.halfW || 0.5;
          const hd = item.userData.halfD || 0.5;
          const tx = Math.max(-half + hw, Math.min(half - hw, item.position.x + dx));
          const tz = Math.max(-half + hd, Math.min(half - hd, item.position.z + dz));
          // 可旋轉的物件（如鐵架、書本）跟著主家具的旋轉角度變化
          const trotY = item.userData.canRotate ? (item.rotation.y + dRot) : item.rotation.y;
          smoothTransform(item, tx, tz, trotY, 750);
        });
      }

      // 茶几上的小物已用 table.attach 綁定為茶几子物件，會自動跟隨茶几移動/旋轉/隱藏
      // 沙發上的毛毯：已用 sofa.attach 綁定，會自動跟隨沙發
      // 其他風格擺飾（紙燈籠、層架、雕塑、蘭花瓶）、邊几：隨沙發位置平移
      moveAttachedShift([lantern, zenStones, shelf, sculpture, orchidVase, sideTableSys.active()], layout.sofa, oldSofa);

      // 電視櫃：放在沙發正對面（沙發朝向 +z 旋轉 srot，前方 = sin/cos）
      if (layout.sofa) {
        const sx = layout.sofa[0], sz = layout.sofa[1], srot = layout.sofa[2];
        smoothTransform(tvStandSys.active(),
          sx + Math.sin(srot) * TV_DISTANCE,
          sz + Math.cos(srot) * TV_DISTANCE,
          srot + Math.PI, 750);
      }
      // 單人扶手椅：依格局固定座位（不隨沙發旋轉跑位）
      const ac = ARMCHAIR_LAYOUTS[layoutKey];
      if (ac) smoothTransform(armchairSys.active(), ac[0], ac[1], ac[2], 750);

      // L 型沙發時把茶几移到貴妃椅對側（避免重疊），須在上面茶几定位之後
      repositionTableForSofa();

      // 顯示/隱藏家具
      if (layout.visible) {
        Object.entries(layout.visible).forEach(([name, show]) => {
          const obj = (name === 'sofa') ? activeSofa() : layoutTargets[name];
          if (obj) animateScale(obj, show);
        });
      }
    }

    // === 風格按鈕 ===
    document.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyStyle(btn.dataset.style);
      });
    });

    // === 格局按鈕 ===
    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyLayout(btn.dataset.layout);
      });
    });

    // === 牆面顏色 ===
    function setWallColor(hexStr) {
      const c = parseInt(hexStr.replace('#', ''), 16);
      const start = M.wall.color.getHex();
      const t0 = performance.now();
      const dur = 400;
      function step(now) {
        const t = Math.min((now - t0) / dur, 1);
        M.wall.color.setHex(lerpHex(start, c, t));
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        setWallColor(sw.dataset.color);
        const picker = document.getElementById('customColor');
        if (picker) picker.value = sw.dataset.color;
      });
    });

    const customColor = document.getElementById('customColor');
    if (customColor) {
      customColor.addEventListener('input', e => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        setWallColor(e.target.value);
      });
    }

    // === 家具開關 ===
    // 切換用 active*() helpers 取得目前可見變體（含風格切換後的正確家具）
    function resolveFurnitureByName(name) {
      if (name === 'sofa') return activeSofa();
      if (name === 'table') return activeTable();
      if (name === 'lamp') return activeLamp();
      if (name === 'armchair') return armchairSys.active();
      if (name === 'tvStand') return tvStandSys.active();
      if (name === 'sideTable') return sideTableSys.active();
      return furniture[name]; // plant / rug / painting 沒有變體
    }
    document.querySelectorAll('.furniture-toggles input').forEach(cb => {
      cb.addEventListener('change', () => {
        const f = resolveFurnitureByName(cb.dataset.furn);
        if (!f) return;
        if (cb.checked) {
          f.visible = true;
          // 進場動畫
          f.scale.set(0.01, 0.01, 0.01);
          const t0 = performance.now();
          const dur = 400;
          function grow(now) {
            const t = Math.min((now - t0) / dur, 1);
            const e = 1 - Math.pow(1 - t, 3);
            f.scale.set(e, e, e);
            if (t < 1) requestAnimationFrame(grow);
          }
          requestAnimationFrame(grow);
        } else {
          // 退場動畫
          const t0 = performance.now();
          const dur = 300;
          function shrink(now) {
            const t = Math.min((now - t0) / dur, 1);
            const e = 1 - t;
            f.scale.set(e, e, e);
            if (t < 1) requestAnimationFrame(shrink);
            else f.visible = false;
          }
          requestAnimationFrame(shrink);
        }
      });
    });

    // === AI 隨機生成（隨機風格 × 隨機格局）===
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        const sKeys = Object.keys(STYLES);
        const lKeys = Object.keys(LAYOUTS);
        const randStyle = sKeys[Math.floor(Math.random() * sKeys.length)];
        const randLayout = lKeys[Math.floor(Math.random() * lKeys.length)];

        document.querySelectorAll('.style-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.style === randStyle);
        });
        applyStyle(randStyle);
        // 延後一點點再套格局，讓風格動畫先啟動
        setTimeout(() => applyLayout(randLayout), 80);

        // 旋轉相機到不同角度
        const targetAngle = Math.random() * Math.PI * 0.4 - Math.PI * 0.2;
        const radius = 10 + Math.random() * 2;
        const targetPos = new THREE.Vector3(
          Math.sin(targetAngle) * radius,
          5 + Math.random() * 1.5,
          Math.cos(targetAngle) * radius
        );
        animateCamera(targetPos, 800);

        generateBtn.classList.add('generating');
        setTimeout(() => generateBtn.classList.remove('generating'), 800);
      });
    }

    function animateCamera(target, dur) {
      const start = camera.position.clone();
      const t0 = performance.now();
      function step(now) {
        const t = Math.min((now - t0) / dur, 1);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        camera.position.lerpVectors(start, target, e);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // === 語音指令 ===
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    const voiceLabel = voiceBtn ? voiceBtn.querySelector('.voice-label') : null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    // 語音識別需要安全環境（https 或 localhost）。直接以 file:// 開啟會被瀏覽器封鎖麥克風。
    const insecureContext = (location.protocol === 'file:');

    if (insecureContext && voiceBtn) {
      // file:// 模式：說明如何用本機伺服器開啟
      if (voiceLabel) voiceLabel.textContent = '語音需用 localhost 開啟';
      if (voiceStatus) voiceStatus.innerHTML = '⚠️ 直接開檔案無法用麥克風。請在「專題」資料夾執行 <code>python3 -m http.server 8123</code>，再開 <code>http://localhost:8123</code>';
      voiceBtn.addEventListener('click', () => {
        if (voiceStatus) voiceStatus.innerHTML = '⚠️ 此頁是用 file:// 開啟，瀏覽器禁止麥克風。請改用 <code>http://localhost:8123</code>（見上方指令）後再試。';
      });
    } else if (SpeechRecognition && voiceBtn) {
      const recog = new SpeechRecognition();
      recog.lang = 'zh-TW';
      recog.continuous = false;
      recog.interimResults = false;

      voiceBtn.addEventListener('click', () => {
        try {
          recog.start();
          voiceBtn.classList.add('listening');
          if (voiceLabel) voiceLabel.textContent = '聆聽中... 請說話';
          if (voiceStatus) voiceStatus.textContent = '🎤 正在聆聽你的指令...';
        } catch (e) {
          if (voiceStatus) voiceStatus.textContent = '⚠️ 麥克風啟動失敗，請刷新頁面再試';
        }
      });

      recog.onresult = (e) => {
        const text = e.results[0][0].transcript;
        let style = null;
        let colorOnly = null;
        const lower = text.toLowerCase();

        if (text.includes('工業') || lower.includes('industrial')) style = 'industrial';
        else if (text.includes('北歐') || lower.includes('nordic')) style = 'nordic';
        else if (text.includes('日') || text.includes('無印') || lower.includes('japan') || lower.includes('muji')) style = 'japanese';
        else if (text.includes('極簡') || text.includes('現代') || text.includes('簡約') || lower.includes('minimal') || lower.includes('modern')) style = 'minimal';
        else if (text.includes('灰')) colorOnly = '#7a7a7a';
        else if (text.includes('白')) colorOnly = '#ffffff';
        else if (text.includes('黑')) colorOnly = '#2a2a2a';
        else if (text.includes('藍')) colorOnly = '#7a8aa0';
        else if (text.includes('綠')) colorOnly = '#a8c8b8';
        else if (text.includes('粉') || text.includes('桃')) colorOnly = '#d4a5a5';

        if (style) {
          document.querySelectorAll('.style-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.style === style);
          });
          applyStyle(style);
          if (voiceStatus) voiceStatus.textContent = '✨ 已切換為「' + STYLES[style].name + '」 — 識別語句：「' + text + '」';
        } else if (colorOnly) {
          setWallColor(colorOnly);
          if (voiceStatus) voiceStatus.textContent = '🖌️ 牆面已改為指定顏色 — 識別語句：「' + text + '」';
        } else {
          if (voiceStatus) voiceStatus.textContent = '🤔 未識別關鍵字：「' + text + '」 — 試試「換成北歐風」、「換成工業風」、「牆壁改成淺灰色」';
        }
      };

      recog.onerror = (e) => {
        if (voiceStatus) {
          if (e.error === 'not-allowed') {
            voiceStatus.textContent = '⚠️ 麥克風權限被拒。請於瀏覽器網址列允許麥克風存取（部分瀏覽器須以 http(s) 開啟）';
          } else if (e.error === 'no-speech') {
            voiceStatus.textContent = '🔇 沒有偵測到語音，請再試一次';
          } else {
            voiceStatus.textContent = '⚠️ 語音識別錯誤：' + e.error;
          }
        }
        voiceBtn.classList.remove('listening');
        if (voiceLabel) voiceLabel.textContent = '點擊說話，試試「換成工業風」';
      };

      recog.onend = () => {
        voiceBtn.classList.remove('listening');
        if (voiceLabel) voiceLabel.textContent = '再次點擊說話';
      };
    } else if (voiceBtn) {
      voiceBtn.disabled = true;
      if (voiceLabel) voiceLabel.textContent = '此瀏覽器不支援語音識別';
      if (voiceStatus) voiceStatus.textContent = '請使用 Chrome 或 Edge 體驗語音功能';
    }

    // 預設選中第一個顏色
    const firstSwatch = document.querySelector('.color-swatch');
    if (firstSwatch) firstSwatch.classList.add('active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
