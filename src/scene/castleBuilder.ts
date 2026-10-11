import * as THREE from 'three';
import {
  getPlasterTexture,
  getStoneTexture,
  getRoofTileTexture,
  getCopperPatinaTexture,
  getWoodPlankTexture,
  getCragRockTexture,
  getWindowPaneTexture,
} from './textures';

export interface AnimatedElement {
  update: (time: number, delta: number) => void;
}

export interface InteractiveBuilding {
  id: string;
  name: string;
  description: string;
  meshGroup: THREE.Group;
  windows: THREE.Mesh[];
  baseEmissiveIntensity: number[];
}

export interface CastleSceneData {
  castleGroup: THREE.Group;
  satelliteIslands: { group: THREE.Group; baseY: number; phase: number; speed: number; rotSpeed: number }[];
  animatedElements: AnimatedElement[];
  interactiveBuildings: InteractiveBuilding[];
  allLights: THREE.Light[];
  windowMaterials: THREE.MeshStandardMaterial[];
}

/**
 * Creates clean, solid craggy floating island mesh without internal Z-fighting
 */
function createCraggyIslandMesh(
  radiusTop: number,
  depth: number,
  rockMaterial: THREE.Material,
  grassMaterial: THREE.Material,
  stoneWallMaterial: THREE.Material
): { group: THREE.Group; topY: number } {
  const group = new THREE.Group();

  // 1. Underside Rock Cone
  const rockGeo = new THREE.ConeGeometry(radiusTop * 0.98, depth, 16, 8, true);
  rockGeo.rotateX(Math.PI); // apex pointing downward

  const pos = rockGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Don't deform the top rim vertices to guarantee clean junction
    if (y < -0.1) {
      const normY = Math.abs(y) / depth;
      const angle = Math.atan2(z, x);
      const disp =
        Math.sin(angle * 3.5 + y * 1.5) * (radiusTop * 0.18 * normY) +
        Math.cos(angle * 6.0 - y * 2.0) * (radiusTop * 0.12 * normY);

      const rad = Math.sqrt(x * x + z * z) + disp;
      pos.setX(i, Math.cos(angle) * Math.max(0.2, rad));
      pos.setZ(i, Math.sin(angle) * Math.max(0.2, rad));
    }
  }
  rockGeo.computeVertexNormals();

  const rockMesh = new THREE.Mesh(rockGeo, rockMaterial);
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  rockMesh.position.y = -depth * 0.5;
  group.add(rockMesh);

  // 2. Stone retaining rim around the top edge (frames and hides seams)
  const rimGeo = new THREE.CylinderGeometry(radiusTop, radiusTop * 1.02, 0.6, 16);
  const rimMesh = new THREE.Mesh(rimGeo, stoneWallMaterial);
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  rimMesh.position.y = 0.3;
  group.add(rimMesh);

  // 3. Grassy Top Plateau
  const grassGeo = new THREE.CylinderGeometry(radiusTop * 0.95, radiusTop * 0.96, 0.3, 16);
  const grassMesh = new THREE.Mesh(grassGeo, grassMaterial);
  grassMesh.receiveShadow = true;
  grassMesh.position.y = 0.65;
  group.add(grassMesh);

  return { group, topY: 0.8 };
}

/**
 * Creates dangling hanging vines and roots below rock islands
 */
function createHangingRoots(radius: number, depth: number, count: number): THREE.Group {
  const group = new THREE.Group();
  const rootMat = new THREE.MeshStandardMaterial({
    color: 0x1e1915,
    roughness: 0.95,
    metalness: 0.05,
  });

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const r = radius * (0.35 + Math.random() * 0.45);
    const startX = Math.cos(angle) * r;
    const startZ = Math.sin(angle) * r;
    const startY = -depth * (0.2 + Math.random() * 0.3);
    const length = depth * (0.4 + Math.random() * 0.55);

    const curvePoints = [
      new THREE.Vector3(startX, startY, startZ),
      new THREE.Vector3(startX + (Math.random() - 0.5) * 0.5, startY - length * 0.4, startZ + (Math.random() - 0.5) * 0.5),
      new THREE.Vector3(startX + (Math.random() - 0.5) * 0.8, startY - length * 0.75, startZ + (Math.random() - 0.5) * 0.8),
      new THREE.Vector3(startX + (Math.random() - 0.5) * 0.6, startY - length, startZ + (Math.random() - 0.5) * 0.6),
    ];

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const rootGeo = new THREE.TubeGeometry(curve, 8, 0.06 + Math.random() * 0.04, 5, false);
    const rootMesh = new THREE.Mesh(rootGeo, rootMat);
    group.add(rootMesh);
  }

  return group;
}

/**
 * Creates an ornamental hanging iron lantern with point light
 */
function createHangingLantern(
  lightColor = 0xffa433,
  intensity = 2.4,
  distance = 12
): { group: THREE.Group; light: THREE.PointLight; coreMesh: THREE.Mesh } {
  const group = new THREE.Group();

  // Iron chain
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f2126, metalness: 0.8, roughness: 0.35 });
  const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4);
  const chain = new THREE.Mesh(chainGeo, ironMat);
  chain.position.y = -0.4;
  group.add(chain);

  // Lantern cage
  const cageGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.4, 6);
  const cage = new THREE.Mesh(cageGeo, ironMat);
  cage.position.y = -1.0;
  group.add(cage);

  // Lantern pyramid cap
  const capGeo = new THREE.ConeGeometry(0.24, 0.18, 6);
  const cap = new THREE.Mesh(capGeo, ironMat);
  cap.position.y = -0.72;
  group.add(cap);

  // Glowing Core Glass
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xfff0aa,
    emissive: new THREE.Color(lightColor),
    emissiveIntensity: 3.5,
    roughness: 0.1,
  });
  const coreGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.y = -1.0;
  group.add(coreMesh);

  // Point light
  const light = new THREE.PointLight(lightColor, intensity, distance, 1.8);
  light.position.y = -1.0;
  group.add(light);

  return { group, light, coreMesh };
}

/**
 * Creates fluttering cloth pennants on poles
 */
function createFlutteringFlag(colorHex: number, height = 0.7, width = 1.3): { mesh: THREE.Mesh; update: (t: number) => void } {
  const flagGeo = new THREE.PlaneGeometry(width, height, 8, 3);
  flagGeo.translate(width / 2, 0, 0);

  const flagMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(flagGeo, flagMat);
  mesh.castShadow = true;

  const origPositions = flagGeo.attributes.position.clone();

  const update = (t: number) => {
    const pos = flagGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const origX = origPositions.getX(i);
      const wave = Math.sin(t * 4.5 + origX * 3.8) * (origX / width) * 0.16;
      const waveY = Math.cos(t * 3.8 + origX * 3.2) * (origX / width) * 0.08;
      pos.setZ(i, wave);
      pos.setY(i, origPositions.getY(i) + waveY);
    }
    pos.needsUpdate = true;
  };

  return { mesh, update };
}

/**
 * Creates billowing chimney smoke puffs
 */
function createChimneySmoke(x: number, y: number, z: number): { group: THREE.Group; update: (t: number, dt: number) => void } {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const puffCount = 8;
  const puffs: { mesh: THREE.Mesh; age: number; maxAge: number; vx: number; vz: number }[] = [];
  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0xdde6f5,
    transparent: true,
    opacity: 0.4,
    roughness: 1,
    metalness: 0,
    depthWrite: false,
  });

  for (let i = 0; i < puffCount; i++) {
    const puffGeo = new THREE.SphereGeometry(0.14 + Math.random() * 0.08, 6, 6);
    const mesh = new THREE.Mesh(puffGeo, smokeMat.clone());
    const maxAge = 2.4 + Math.random() * 1.2;
    const age = (i / puffCount) * maxAge;
    mesh.position.set(0, 0, 0);
    mesh.scale.setScalar(0.01);
    group.add(mesh);

    puffs.push({
      mesh,
      age,
      maxAge,
      vx: 0.1 + (Math.random() - 0.5) * 0.06,
      vz: 0.05 + (Math.random() - 0.5) * 0.06,
    });
  }

  const update = (_t: number, dt: number) => {
    puffs.forEach((p) => {
      p.age += dt;
      if (p.age > p.maxAge) {
        p.age = 0;
        p.mesh.position.set(0, 0, 0);
      }
      const progress = p.age / p.maxAge;
      p.mesh.position.y = progress * 2.2;
      p.mesh.position.x = Math.sin(p.age * 2.2) * 0.12 + p.vx * progress * 2.8;
      p.mesh.position.z = Math.cos(p.age * 2.0) * 0.1 + p.vz * progress * 2.8;

      const scale = 0.5 + progress * 2.0;
      p.mesh.scale.setScalar(scale);

      const mat = p.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.sin(progress * Math.PI) * 0.35;
    });
  };

  return { group, update };
}

/**
 * Creates stylized miniature pine tree with foliage cone layers
 */
function createStylizedPineTree(height = 3.2): THREE.Group {
  const tree = new THREE.Group();

  // Trunk
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x483222, roughness: 0.85 });
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.16, height * 0.35, 6);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = height * 0.175;
  trunk.castShadow = true;
  tree.add(trunk);

  // Foliage cone tiers
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x2b4f34,
    roughness: 0.75,
  });

  const tiers = 3;
  for (let t = 0; t < tiers; t++) {
    const r = (1 - t * 0.25) * (height * 0.28);
    const h = height * 0.38;
    const coneGeo = new THREE.ConeGeometry(r, h, 7);
    const cone = new THREE.Mesh(coneGeo, foliageMat);
    cone.position.y = height * 0.3 + t * (height * 0.22);
    cone.castShadow = true;
    cone.receiveShadow = true;
    tree.add(cone);
  }

  return tree;
}

/**
 * Builds the complete solid, non-clipping 3D Castle scene
 */
export function buildCastleScene(): CastleSceneData {
  const castleGroup = new THREE.Group();
  castleGroup.name = 'CastleMaster';

  const animatedElements: AnimatedElement[] = [];
  const interactiveBuildings: InteractiveBuilding[] = [];
  const allLights: THREE.Light[] = [];
  const windowMaterials: THREE.MeshStandardMaterial[] = [];
  const satelliteIslands: CastleSceneData['satelliteIslands'] = [];

  // PBR Textures
  const plaster = getPlasterTexture();
  const stone = getStoneTexture();
  const roof = getRoofTileTexture();
  const wood = getWoodPlankTexture();
  const crag = getCragRockTexture();
  const copperPatina = getCopperPatinaTexture();
  const winTex = getWindowPaneTexture();

  // Materials with vibrant, legible tones that pop under lunar lighting
  const plasterMat = new THREE.MeshStandardMaterial({
    map: plaster.map,
    bumpMap: plaster.bumpMap,
    bumpScale: 0.03,
    color: 0xfffaf2, // bright warm off-white stucco
    roughness: 0.8,
    metalness: 0.05,
  });

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stone.map,
    bumpMap: stone.bumpMap,
    bumpScale: 0.06,
    color: 0xb5ad9f, // warm legible ashlar stone
    roughness: 0.85,
    metalness: 0.08,
  });

  const redRoofMat = new THREE.MeshStandardMaterial({
    map: roof.map,
    bumpMap: roof.bumpMap,
    bumpScale: 0.05,
    color: 0xc83a2c, // vivid terracotta crimson
    roughness: 0.4,
    metalness: 0.12,
  });

  const greenRoofMat = new THREE.MeshStandardMaterial({
    map: copperPatina,
    roughness: 0.45,
    metalness: 0.3,
    color: 0x427c6b,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    map: wood.map,
    bumpMap: wood.bumpMap,
    bumpScale: 0.04,
    color: 0x8a5b36,
    roughness: 0.7,
    metalness: 0.05,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x362418,
    roughness: 0.75,
    metalness: 0.08,
  });

  const darkRockMat = new THREE.MeshStandardMaterial({
    map: crag.map,
    bumpMap: crag.bumpMap,
    bumpScale: 0.15,
    color: 0x2e3540,
    roughness: 0.9,
    metalness: 0.1,
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x385c30, // lush alpine grass
    roughness: 0.85,
    metalness: 0.05,
  });

  // Solid 3D Window Component: Protrudes cleanly to eliminate co-planar Z-fighting
  const createSolidWindow = (
    w = 0.65,
    h = 0.95,
    brightness = 1.0
  ): { group: THREE.Group; mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial } => {
    const group = new THREE.Group();

    // 1. Protruding Wooden Frame (0.16 units thick)
    const frameGeo = new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.16);
    const frameMesh = new THREE.Mesh(frameGeo, darkWoodMat);
    frameMesh.position.z = 0.08;
    group.add(frameMesh);

    // 2. Stone Sill at the base
    const sillGeo = new THREE.BoxGeometry(w + 0.22, 0.1, 0.22);
    const sillMesh = new THREE.Mesh(sillGeo, stoneMat);
    sillMesh.position.set(0, -h * 0.5 - 0.02, 0.11);
    group.add(sillMesh);

    // 3. Glowing Glass Pane (recessed inside the frame at z = 0.1)
    const glassMat = new THREE.MeshStandardMaterial({
      map: winTex,
      emissive: new THREE.Color(0xffa83b),
      emissiveMap: winTex,
      emissiveIntensity: 1.8 * brightness,
      roughness: 0.2,
      metalness: 0.1,
    });
    windowMaterials.push(glassMat);

    const glassGeo = new THREE.BoxGeometry(w, h, 0.06);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = 0.11;
    group.add(glassMesh);

    return { group, mesh: glassMesh, mat: glassMat };
  };

  // ==========================================
  // 1. MAIN ISLAND
  // ==========================================
  const mainIslandGroup = new THREE.Group();
  mainIslandGroup.name = 'MainIsland';
  castleGroup.add(mainIslandGroup);

  const mainRadius = 14;
  const mainDepth = 15;
  const { group: islandBaseMesh } = createCraggyIslandMesh(
    mainRadius,
    mainDepth,
    darkRockMat,
    grassMat,
    stoneMat
  );
  mainIslandGroup.add(islandBaseMesh);

  // Hanging roots and underslung lanterns
  const mainRoots = createHangingRoots(mainRadius, mainDepth, 22);
  mainIslandGroup.add(mainRoots);

  const lant1 = createHangingLantern(0xff9e33, 2.2, 14);
  lant1.group.position.set(-6, -4, 5);
  mainIslandGroup.add(lant1.group);
  allLights.push(lant1.light);

  const lant2 = createHangingLantern(0xffaa44, 2.2, 14);
  lant2.group.position.set(5.5, -5, -4);
  mainIslandGroup.add(lant2.group);
  allLights.push(lant2.light);

  // Upper stone fortress terrace (elevated foundation)
  const upperPlatGeo = new THREE.CylinderGeometry(9.5, 10.2, 1.4, 16);
  const upperPlat = new THREE.Mesh(upperPlatGeo, stoneMat);
  upperPlat.position.y = 1.4;
  upperPlat.castShadow = true;
  upperPlat.receiveShadow = true;
  mainIslandGroup.add(upperPlat);

  // ==========================================
  // A. MAIN KEEP (TORRE DE MENAGEM)
  // ==========================================
  const keepGroup = new THREE.Group();
  keepGroup.position.set(0, 2.1, -0.5);
  mainIslandGroup.add(keepGroup);

  const keepWindows: THREE.Mesh[] = [];
  const keepBaseIntensities: number[] = [];

  // Lower Stone Base (Fortified) - Y: 0 to 4.8
  const keepBaseGeo = new THREE.BoxGeometry(6.4, 4.8, 6.4);
  const keepBase = new THREE.Mesh(keepBaseGeo, stoneMat);
  keepBase.position.y = 2.4;
  keepBase.castShadow = true;
  keepBase.receiveShadow = true;
  keepGroup.add(keepBase);

  // Corbel ledge / machicolations ring - Y: 4.8 to 5.2
  const corbelGeo = new THREE.BoxGeometry(7.2, 0.4, 7.2);
  const corbelMesh = new THREE.Mesh(corbelGeo, stoneMat);
  corbelMesh.position.y = 5.0;
  corbelMesh.castShadow = true;
  keepGroup.add(corbelMesh);

  // Upper Stucco Tower - Y: 5.2 to 12.4
  const keepUpperGeo = new THREE.BoxGeometry(6.2, 7.2, 6.2);
  const keepUpper = new THREE.Mesh(keepUpperGeo, plasterMat);
  keepUpper.position.y = 8.8;
  keepUpper.castShadow = true;
  keepUpper.receiveShadow = true;
  keepGroup.add(keepUpper);

  // Timber corner posts on keep
  const cornerPostGeo = new THREE.BoxGeometry(0.35, 7.2, 0.35);
  [
    [-3.1, 8.8, -3.1],
    [3.1, 8.8, -3.1],
    [-3.1, 8.8, 3.1],
    [3.1, 8.8, 3.1],
  ].forEach(([cx, cy, cz]) => {
    const post = new THREE.Mesh(cornerPostGeo, darkWoodMat);
    post.position.set(cx, cy, cz);
    keepGroup.add(post);
  });

  // Roof Cornice - Y: 12.4 to 12.9
  const keepCorniceGeo = new THREE.BoxGeometry(6.8, 0.5, 6.8);
  const keepCornice = new THREE.Mesh(keepCorniceGeo, stoneMat);
  keepCornice.position.y = 12.65;
  keepCornice.castShadow = true;
  keepGroup.add(keepCornice);

  // High Conical Red Spire - Y: 12.9 to 21.7
  const keepSpireGeo = new THREE.ConeGeometry(4.6, 8.8, 14);
  const keepSpire = new THREE.Mesh(keepSpireGeo, redRoofMat);
  keepSpire.position.y = 17.3;
  keepSpire.castShadow = true;
  keepGroup.add(keepSpire);

  // Spire Finial & Pennant Flag
  const finialGeo = new THREE.CylinderGeometry(0.05, 0.08, 2.6, 6);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5c030, metalness: 0.9, roughness: 0.2 });
  const finial = new THREE.Mesh(finialGeo, goldMat);
  finial.position.y = 22.9;
  keepGroup.add(finial);

  const mainFlag = createFlutteringFlag(0xfac828, 0.8, 1.8);
  mainFlag.mesh.position.set(0, 23.2, 0);
  keepGroup.add(mainFlag.mesh);
  animatedElements.push({ update: (t) => mainFlag.update(t) });

  // Add Solid 3D Windows to Keep
  const addKeepWin = (x: number, y: number, z: number, ry: number, b: number) => {
    const { group: winGroup, mesh, mat } = createSolidWindow(0.7, 1.05, b);
    winGroup.position.set(x, y, z);
    winGroup.rotation.y = ry;
    keepGroup.add(winGroup);
    keepWindows.push(mesh);
    keepBaseIntensities.push(mat.emissiveIntensity);
  };

  // Front Windows (Facing South, Z = 3.1)
  addKeepWin(-1.5, 7.2, 3.1, 0, 1.3);
  addKeepWin(1.5, 7.2, 3.1, 0, 0.9);
  addKeepWin(0, 10.2, 3.1, 0, 1.6);
  addKeepWin(-1.5, 10.2, 3.1, 0, 0.8);
  addKeepWin(1.5, 10.2, 3.1, 0, 1.2);

  // Arched portal door at base
  const doorGeo = new THREE.BoxGeometry(1.6, 2.6, 0.3);
  const door = new THREE.Mesh(doorGeo, darkWoodMat);
  door.position.set(0, 1.3, 3.25);
  keepGroup.add(door);

  const doorLantern = createHangingLantern(0xffaa40, 2.0, 8);
  doorLantern.group.position.set(1.3, 2.6, 3.5);
  doorLantern.group.scale.setScalar(0.7);
  keepGroup.add(doorLantern.group);
  allLights.push(doorLantern.light);

  // Side and back windows
  addKeepWin(3.1, 8.5, 0, Math.PI / 2, 1.1);
  addKeepWin(-3.1, 8.5, 0, -Math.PI / 2, 1.0);
  addKeepWin(0, 9.5, -3.1, Math.PI, 0.85);

  interactiveBuildings.push({
    id: 'main-keep',
    name: 'Torre de Menagem Principal',
    description: 'Coração da cidadela celeste. Espira de terracota carmim a mais de 35 metros de altitude, flâmula de seda e salão nobre.',
    meshGroup: keepGroup,
    windows: keepWindows,
    baseEmissiveIntensity: keepBaseIntensities,
  });

  // ==========================================
  // B. ATTACHED ROUND TOWER (TORRE REDONDA ANEXA)
  // ==========================================
  const roundTowerGroup = new THREE.Group();
  roundTowerGroup.position.set(4.3, 2.1, 1.8);
  mainIslandGroup.add(roundTowerGroup);

  const roundTowerWindows: THREE.Mesh[] = [];
  const roundBaseIntensities: number[] = [];

  // Stone base - Y: 0 to 4.0
  const roundBaseGeo = new THREE.CylinderGeometry(2.35, 2.55, 4.0, 16);
  const roundBase = new THREE.Mesh(roundBaseGeo, stoneMat);
  roundBase.position.y = 2.0;
  roundBase.castShadow = true;
  roundTowerGroup.add(roundBase);

  // Stucco cylinder - Y: 4.0 to 14.0
  const roundBodyGeo = new THREE.CylinderGeometry(2.2, 2.35, 10.0, 16);
  const roundBody = new THREE.Mesh(roundBodyGeo, plasterMat);
  roundBody.position.y = 9.0;
  roundBody.castShadow = true;
  roundTowerGroup.add(roundBody);

  // Corbel ledge - Y: 14.0 to 14.6
  const roundCorbelGeo = new THREE.CylinderGeometry(2.65, 2.2, 0.6, 16);
  const roundCorbel = new THREE.Mesh(roundCorbelGeo, stoneMat);
  roundCorbel.position.y = 14.3;
  roundCorbel.castShadow = true;
  roundTowerGroup.add(roundCorbel);

  // Conical roof - Y: 14.6 to 20.2
  const roundRoofGeo = new THREE.ConeGeometry(2.8, 5.6, 16);
  const roundRoof = new THREE.Mesh(roundRoofGeo, redRoofMat);
  roundRoof.position.y = 17.4;
  roundRoof.castShadow = true;
  roundTowerGroup.add(roundRoof);

  // Round tower flag
  const roundFlag = createFlutteringFlag(0xfaab28, 0.5, 1.1);
  roundFlag.mesh.position.set(0, 20.4, 0);
  roundTowerGroup.add(roundFlag.mesh);
  animatedElements.push({ update: (t) => roundFlag.update(t + 1.2) });

  // Slit windows oriented outward at exact calculated radius + 0.08
  const slitAngles = [0.2, 1.3, 2.5, 3.9, 5.3];
  const slitHeights = [4.8, 7.5, 10.2, 12.4, 6.2];
  slitAngles.forEach((ang, idx) => {
    const { group: winGroup, mesh, mat } = createSolidWindow(0.38, 0.85, 1.1 + (idx % 2) * 0.4);
    const r = 2.32; // safely outside the body cylinder
    winGroup.position.set(Math.sin(ang) * r, slitHeights[idx], Math.cos(ang) * r);
    winGroup.rotation.y = ang;
    roundTowerGroup.add(winGroup);
    roundTowerWindows.push(mesh);
    roundBaseIntensities.push(mat.emissiveIntensity);
  });

  interactiveBuildings.push({
    id: 'round-tower',
    name: 'Torre Redonda Anexa',
    description: 'Torre de vigia e arquivo estelar com seteiras estreitas e mirante panorâmico sobre o mar de nuvens.',
    meshGroup: roundTowerGroup,
    windows: roundTowerWindows,
    baseEmissiveIntensity: roundBaseIntensities,
  });

  // ==========================================
  // C. LOWER RESIDENTIAL WING (ALA INFERIOR)
  // ==========================================
  const lowerWingGroup = new THREE.Group();
  lowerWingGroup.position.set(-4.2, 1.5, 2.2);
  mainIslandGroup.add(lowerWingGroup);

  const wingWindows: THREE.Mesh[] = [];
  const wingBaseIntensities: number[] = [];

  // Stone first floor - Y: 0 to 3.4
  const wingFloor1Geo = new THREE.BoxGeometry(4.8, 3.4, 4.2);
  const wingFloor1 = new THREE.Mesh(wingFloor1Geo, stoneMat);
  wingFloor1.position.y = 1.7;
  wingFloor1.castShadow = true;
  lowerWingGroup.add(wingFloor1);

  // Stucco second floor - Y: 3.4 to 6.4
  const wingFloor2Geo = new THREE.BoxGeometry(5.0, 3.0, 4.4);
  const wingFloor2 = new THREE.Mesh(wingFloor2Geo, plasterMat);
  wingFloor2.position.y = 4.9;
  wingFloor2.castShadow = true;
  lowerWingGroup.add(wingFloor2);

  // Green copper gabled roof - Y: 6.4 to 9.4
  const greenRoofGeo = new THREE.ConeGeometry(3.8, 3.0, 4);
  greenRoofGeo.rotateY(Math.PI / 4);
  const greenRoof = new THREE.Mesh(greenRoofGeo, greenRoofMat);
  greenRoof.position.y = 7.9;
  greenRoof.scale.set(1.3, 1.0, 1.0);
  greenRoof.castShadow = true;
  lowerWingGroup.add(greenRoof);

  // Stone Chimney with Warm Rising Smoke Puffs
  const chimneyGeo = new THREE.BoxGeometry(0.7, 3.4, 0.7);
  const chimney = new THREE.Mesh(chimneyGeo, stoneMat);
  chimney.position.set(1.6, 8.0, -1.0);
  chimney.castShadow = true;
  lowerWingGroup.add(chimney);

  const chimneySmoke = createChimneySmoke(-2.6, 11.4, 1.2);
  mainIslandGroup.add(chimneySmoke.group);
  animatedElements.push({ update: (t, dt) => chimneySmoke.update(t, dt) });

  // Open wooden balcony/colonnade along front
  const balconyFloorGeo = new THREE.BoxGeometry(4.6, 0.22, 1.4);
  const balconyFloor = new THREE.Mesh(balconyFloorGeo, woodMat);
  balconyFloor.position.set(0, 3.4, 2.9);
  balconyFloor.castShadow = true;
  lowerWingGroup.add(balconyFloor);

  [-2.1, -0.7, 0.7, 2.1].forEach((bx) => {
    const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 6);
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(bx, 3.9, 3.5);
    lowerWingGroup.add(post);
  });
  const balcRailGeo = new THREE.BoxGeometry(4.6, 0.08, 0.08);
  const balcRail = new THREE.Mesh(balcRailGeo, woodMat);
  balcRail.position.set(0, 4.4, 3.5);
  lowerWingGroup.add(balcRail);

  // Windows for lower residential wing
  const addWingWin = (x: number, y: number, z: number, ry: number, b: number) => {
    const { group: winGroup, mesh, mat } = createSolidWindow(0.7, 0.95, b);
    winGroup.position.set(x, y, z);
    winGroup.rotation.y = ry;
    lowerWingGroup.add(winGroup);
    wingWindows.push(mesh);
    wingBaseIntensities.push(mat.emissiveIntensity);
  };

  addWingWin(-1.2, 1.8, 2.1, 0, 1.3);
  addWingWin(1.2, 1.8, 2.1, 0, 1.0);
  addWingWin(-1.1, 4.9, 2.2, 0, 1.5);
  addWingWin(1.1, 4.9, 2.2, 0, 1.1);
  addWingWin(-2.5, 4.9, 0, -Math.PI / 2, 0.9);

  interactiveBuildings.push({
    id: 'lower-wing',
    name: 'Ala Residencial dos Terraços',
    description: 'Chalé com telhado de cobre oxidado, varanda panorâmica, lareira crepitante e cômodos acolhedores iluminados pelo luar.',
    meshGroup: lowerWingGroup,
    windows: wingWindows,
    baseEmissiveIntensity: wingBaseIntensities,
  });

  // ==========================================
  // D. EXTERIOR WOODEN STAIRS & WRAP-AROUND DECK
  // ==========================================
  const deckGroup = new THREE.Group();
  mainIslandGroup.add(deckGroup);

  const walkwayRadius = 12.2;
  const plankSegments = 24;
  const stringLightPoints: THREE.Vector3[] = [];

  for (let i = 0; i < plankSegments; i++) {
    const ang = -0.5 + (i / plankSegments) * 2.7;
    const r = walkwayRadius + Math.sin(i * 0.4) * 0.3;
    const px = Math.cos(ang) * r;
    const pz = Math.sin(ang) * r;
    const py = 1.0 + Math.sin(i * 0.2) * 0.25;

    const plankGeo = new THREE.BoxGeometry(1.6, 0.14, 0.65);
    const plank = new THREE.Mesh(plankGeo, woodMat);
    plank.position.set(px, py, pz);
    plank.rotation.y = -ang + Math.PI / 2;
    plank.castShadow = true;
    deckGroup.add(plank);

    // Support pilings anchored into cliff
    if (i % 3 === 0) {
      const pilingGeo = new THREE.CylinderGeometry(0.1, 0.12, 2.6, 5);
      const piling = new THREE.Mesh(pilingGeo, darkWoodMat);
      piling.position.set(px * 0.95, py - 1.3, pz * 0.95);
      deckGroup.add(piling);

      const railPostGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.95, 5);
      const railPost = new THREE.Mesh(railPostGeo, darkWoodMat);
      railPost.position.set(px * 1.05, py + 0.48, pz * 1.05);
      deckGroup.add(railPost);

      stringLightPoints.push(new THREE.Vector3(px * 1.05, py + 0.92, pz * 1.05));
    }
  }

  // Wooden staircase
  const stairSteps = 10;
  for (let s = 0; s < stairSteps; s++) {
    const t = s / stairSteps;
    const sx = -2.0 + t * 2.8;
    const sy = 0.8 + t * 1.6;
    const sz = 7.0 - t * 3.4;

    const stepGeo = new THREE.BoxGeometry(1.6, 0.16, 0.45);
    const step = new THREE.Mesh(stepGeo, woodMat);
    step.position.set(sx, sy, sz);
    step.rotation.y = -0.4;
    step.castShadow = true;
    deckGroup.add(step);
  }

  // Fairy String Lights draped along the outer handrail
  if (stringLightPoints.length > 2) {
    const curve = new THREE.CatmullRomCurve3(stringLightPoints);
    const wireGeo = new THREE.TubeGeometry(curve, 32, 0.018, 4, false);
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    deckGroup.add(wire);

    const bulbGeo = new THREE.SphereGeometry(0.07, 6, 6);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffefb8,
      emissive: new THREE.Color(0xffaa33),
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });

    const bulbCount = 20;
    for (let i = 0; i < bulbCount; i++) {
      const u = (i + 0.5) / bulbCount;
      const pt = curve.getPoint(u);
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.copy(pt);
      deckGroup.add(bulb);
    }
  }

  // ==========================================
  // E. MARKET STALL & DETAILS
  // ==========================================
  const marketGroup = new THREE.Group();
  marketGroup.position.set(3.4, 1.0, 7.2);
  marketGroup.rotation.y = -0.5;
  mainIslandGroup.add(marketGroup);

  const tableGeo = new THREE.BoxGeometry(2.2, 0.8, 1.1);
  const table = new THREE.Mesh(tableGeo, woodMat);
  table.position.y = 0.4;
  table.castShadow = true;
  marketGroup.add(table);

  const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 5);
  [
    [-1.0, -0.45],
    [1.0, -0.45],
    [-1.0, 0.45],
    [1.0, 0.45],
  ].forEach(([px, pz]) => {
    const pole = new THREE.Mesh(poleGeo, darkWoodMat);
    pole.position.set(px, 1.1, pz);
    marketGroup.add(pole);
  });

  const canopyGeo = new THREE.ConeGeometry(1.8, 0.6, 4);
  canopyGeo.rotateY(Math.PI / 4);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xaa342a, roughness: 0.65 });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 2.3, 0);
  canopy.scale.set(1.4, 0.8, 1.0);
  canopy.castShadow = true;
  marketGroup.add(canopy);

  const marketLantern = createHangingLantern(0xffaa40, 1.8, 8);
  marketLantern.group.position.set(0, 2.0, 0);
  marketLantern.group.scale.setScalar(0.7);
  marketGroup.add(marketLantern.group);
  allLights.push(marketLantern.light);

  // Miniature Pine Trees on the island
  const pine1 = createStylizedPineTree(3.8);
  pine1.position.set(-8.5, 0.8, -3.5);
  mainIslandGroup.add(pine1);

  const pine2 = createStylizedPineTree(2.8);
  pine2.position.set(-7.5, 0.8, -5.5);
  mainIslandGroup.add(pine2);

  const pine3 = createStylizedPineTree(3.2);
  pine3.position.set(7.5, 0.8, -6.5);
  mainIslandGroup.add(pine3);

  // ==========================================
  // 2. SATELLITE ISLANDS (DISTRIBUÍDAS EM SETORES DESOBSTRUÍDOS)
  // ==========================================
  // Satellite 1: Cozy Cottage with Red Gable Roof & Chimney Smoke (Setor Nordeste)
  {
    const sat1 = new THREE.Group();
    sat1.position.set(21, -1.5, -17);
    castleGroup.add(sat1);

    const rad = 4.4;
    const dep = 6.5;
    const { group: s1Base } = createCraggyIslandMesh(rad, dep, darkRockMat, grassMat, stoneMat);
    sat1.add(s1Base);
    sat1.add(createHangingRoots(rad, dep, 8));

    const cottageGeo = new THREE.BoxGeometry(2.8, 2.2, 2.4);
    const cottage = new THREE.Mesh(cottageGeo, plasterMat);
    cottage.position.y = 1.9;
    cottage.castShadow = true;
    sat1.add(cottage);

    const cRoofGeo = new THREE.ConeGeometry(2.4, 1.8, 4);
    cRoofGeo.rotateY(Math.PI / 4);
    const cRoof = new THREE.Mesh(cRoofGeo, redRoofMat);
    cRoof.position.y = 3.6;
    cRoof.scale.set(1.3, 1, 1.1);
    cRoof.castShadow = true;
    sat1.add(cRoof);

    const cChimneyGeo = new THREE.BoxGeometry(0.5, 1.8, 0.5);
    const cChimney = new THREE.Mesh(cChimneyGeo, stoneMat);
    cChimney.position.set(0.9, 3.8, 0.5);
    sat1.add(cChimney);

    const smoke = createChimneySmoke(21 + 0.9, -1.5 + 4.6, -17 + 0.5);
    castleGroup.add(smoke.group);
    animatedElements.push({ update: (t, dt) => smoke.update(t, dt) });

    const cWin1 = createSolidWindow(0.5, 0.75, 1.4);
    cWin1.group.position.set(0, 1.9, 1.2);
    sat1.add(cWin1.group);

    const cWin2 = createSolidWindow(0.5, 0.75, 1.0);
    cWin2.group.position.set(1.4, 1.9, 0);
    cWin2.group.rotation.y = Math.PI / 2;
    sat1.add(cWin2.group);

    const lant = createHangingLantern(0xffaa40, 1.4, 7);
    lant.group.position.set(-0.8, 2.4, 1.4);
    lant.group.scale.setScalar(0.65);
    sat1.add(lant.group);
    allLights.push(lant.light);

    satelliteIslands.push({ group: sat1, baseY: -1.5, phase: 0.0, speed: 0.6, rotSpeed: 0.06 });
    interactiveBuildings.push({
      id: 'sat-cottage',
      name: 'Chalé do Vento Leste',
      description: 'Habitação acolhedora com chaminé ativa, telhado de telhas carmim e jardim suspenso nas correntes de ar.',
      meshGroup: sat1,
      windows: [cWin1.mesh, cWin2.mesh],
      baseEmissiveIntensity: [cWin1.mat.emissiveIntensity, cWin2.mat.emissiveIntensity],
    });
  }

  // Satellite 2: White House with Porch Lamp (Setor Noroeste)
  {
    const sat2 = new THREE.Group();
    sat2.position.set(-18, 3.0, -18);
    castleGroup.add(sat2);

    const rad = 4.8;
    const dep = 7.0;
    const { group: s2Base } = createCraggyIslandMesh(rad, dep, darkRockMat, grassMat, stoneMat);
    sat2.add(s2Base);
    sat2.add(createHangingRoots(rad, dep, 10));

    const houseGeo = new THREE.BoxGeometry(3.2, 2.6, 2.8);
    const house = new THREE.Mesh(houseGeo, plasterMat);
    house.position.y = 2.1;
    house.castShadow = true;
    sat2.add(house);

    const hRoofGeo = new THREE.ConeGeometry(2.6, 2.2, 4);
    hRoofGeo.rotateY(Math.PI / 4);
    const hRoof = new THREE.Mesh(hRoofGeo, redRoofMat);
    hRoof.position.y = 4.2;
    hRoof.scale.set(1.3, 1, 1.15);
    sat2.add(hRoof);

    const porchFloorGeo = new THREE.BoxGeometry(2.4, 0.16, 1.2);
    const porchFloor = new THREE.Mesh(porchFloorGeo, woodMat);
    porchFloor.position.set(0, 0.8, 1.9);
    sat2.add(porchFloor);

    const porchLamp = createHangingLantern(0xffb555, 1.5, 8);
    porchLamp.group.position.set(0.6, 2.5, 2.2);
    porchLamp.group.scale.setScalar(0.7);
    sat2.add(porchLamp.group);
    allLights.push(porchLamp.light);

    const hWin = createSolidWindow(0.6, 0.85, 1.4);
    hWin.group.position.set(-0.6, 2.2, 1.4);
    sat2.add(hWin.group);

    satelliteIslands.push({ group: sat2, baseY: 3.0, phase: 1.8, speed: 0.5, rotSpeed: -0.05 });
    interactiveBuildings.push({
      id: 'sat-white-house',
      name: 'Residência do Mirante Ocidental',
      description: 'Casa branca com alpendre de madeira iluminado por lampião acolhedor sobre o mar de nuvens.',
      meshGroup: sat2,
      windows: [hWin.mesh],
      baseEmissiveIntensity: [hWin.mat.emissiveIntensity],
    });
  }

  // Satellite 3: Bare Rock with Solitary Lantern (Setor Sudoeste)
  {
    const sat3 = new THREE.Group();
    sat3.position.set(-18, -3.5, 20);
    castleGroup.add(sat3);

    const rad = 3.2;
    const dep = 6.5;
    const { group: s3Base } = createCraggyIslandMesh(rad, dep, darkRockMat, darkRockMat, stoneMat);
    sat3.add(s3Base);
    sat3.add(createHangingRoots(rad, dep, 6));

    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.8, 6);
    const pole = new THREE.Mesh(poleGeo, darkWoodMat);
    pole.position.set(0, 2.1, 0);
    pole.rotation.z = 0.08;
    sat3.add(pole);

    const solitaryLantern = createHangingLantern(0xffaa33, 2.5, 12);
    solitaryLantern.group.position.set(0.4, 3.2, 0);
    sat3.add(solitaryLantern.group);
    allLights.push(solitaryLantern.light);

    satelliteIslands.push({ group: sat3, baseY: -3.5, phase: 3.2, speed: 0.75, rotSpeed: 0.08 });
    interactiveBuildings.push({
      id: 'sat-lantern-rock',
      name: 'Pedra do Farol Solitário',
      description: 'Penedo escarpado com uma única lanterna balançando suavemente no vazio estrelado.',
      meshGroup: sat3,
      windows: [],
      baseEmissiveIntensity: [],
    });
  }

  // Satellite 4: Watchtower with Flag (Setor Sul)
  {
    const sat4 = new THREE.Group();
    sat4.position.set(8, 3.0, 26);
    castleGroup.add(sat4);

    const rad = 4.0;
    const dep = 5.5;
    const { group: s4Base } = createCraggyIslandMesh(rad, dep, darkRockMat, grassMat, stoneMat);
    sat4.add(s4Base);
    sat4.add(createHangingRoots(rad, dep, 8));

    const towerGeo = new THREE.CylinderGeometry(1.3, 1.5, 5.2, 14);
    const tower = new THREE.Mesh(towerGeo, stoneMat);
    tower.position.y = 3.4;
    tower.castShadow = true;
    sat4.add(tower);

    const tRoofGeo = new THREE.ConeGeometry(1.7, 3.0, 14);
    const tRoof = new THREE.Mesh(tRoofGeo, redRoofMat);
    tRoof.position.y = 7.3;
    sat4.add(tRoof);

    const flag = createFlutteringFlag(0xfac828, 0.5, 1.0);
    flag.mesh.position.set(0, 9.0, 0);
    sat4.add(flag.mesh);
    animatedElements.push({ update: (t) => flag.update(t + 2.5) });

    const tWin = createSolidWindow(0.35, 0.75, 1.3);
    tWin.group.position.set(0, 4.2, 1.35);
    sat4.add(tWin.group);

    satelliteIslands.push({ group: sat4, baseY: 3.0, phase: 4.5, speed: 0.55, rotSpeed: -0.06 });
    interactiveBuildings.push({
      id: 'sat-watchtower',
      name: 'Atalaia do Sul',
      description: 'Posto de observação avançado com flâmula dourada acenando para as rajadas de vento noturno.',
      meshGroup: sat4,
      windows: [tWin.mesh],
      baseEmissiveIntensity: [tWin.mat.emissiveIntensity],
    });
  }

  // Satellite 5: Village Islet with Air Pier (Setor Sudeste/Leste)
  {
    const sat5 = new THREE.Group();
    sat5.position.set(26, 0.5, 12);
    castleGroup.add(sat5);

    const rad = 6.4;
    const dep = 8.5;
    const { group: s5Base } = createCraggyIslandMesh(rad, dep, darkRockMat, grassMat, stoneMat);
    sat5.add(s5Base);
    sat5.add(createHangingRoots(rad, dep, 14));

    const house1Geo = new THREE.BoxGeometry(2.6, 2.2, 2.2);
    const house1 = new THREE.Mesh(house1Geo, plasterMat);
    house1.position.set(-1.2, 1.9, 0.5);
    sat5.add(house1);

    const r1Geo = new THREE.ConeGeometry(2.2, 1.8, 4);
    r1Geo.rotateY(Math.PI / 4);
    const r1 = new THREE.Mesh(r1Geo, redRoofMat);
    r1.position.set(-1.2, 3.6, 0.5);
    r1.scale.set(1.2, 1, 1.1);
    sat5.add(r1);

    const house2Geo = new THREE.BoxGeometry(2.2, 2.0, 2.0);
    const house2 = new THREE.Mesh(house2Geo, plasterMat);
    house2.position.set(1.4, 1.8, -0.6);
    sat5.add(house2);

    const r2Geo = new THREE.ConeGeometry(1.8, 1.6, 4);
    r2Geo.rotateY(Math.PI / 4);
    const r2 = new THREE.Mesh(r2Geo, greenRoofMat);
    r2.position.set(1.4, 3.4, -0.6);
    sat5.add(r2);

    const pierGeo = new THREE.BoxGeometry(1.4, 0.16, 4.2);
    const pier = new THREE.Mesh(pierGeo, woodMat);
    pier.position.set(-0.5, 0.9, 4.2);
    sat5.add(pier);

    const pierLantern = createHangingLantern(0xffa233, 1.5, 7);
    pierLantern.group.position.set(-0.5, 2.0, 6.1);
    pierLantern.group.scale.setScalar(0.65);
    sat5.add(pierLantern.group);
    allLights.push(pierLantern.light);

    const vWin1 = createSolidWindow(0.45, 0.75, 1.2);
    vWin1.group.position.set(-1.2, 2.0, 1.6);
    sat5.add(vWin1.group);

    const vWin2 = createSolidWindow(0.45, 0.75, 1.4);
    vWin2.group.position.set(1.4, 1.9, 0.4);
    sat5.add(vWin2.group);

    satelliteIslands.push({ group: sat5, baseY: 0.5, phase: 2.3, speed: 0.45, rotSpeed: 0.05 });
    interactiveBuildings.push({
      id: 'sat-village',
      name: 'Aldeia Flutuante do Cais',
      description: 'Povoado com píer suspenso projetado sobre o vazio para atracação de barcos celestes.',
      meshGroup: sat5,
      windows: [vWin1.mesh, vWin2.mesh],
      baseEmissiveIntensity: [vWin1.mat.emissiveIntensity, vWin2.mat.emissiveIntensity],
    });
  }

  // Satellite 6: Celestial Observatory / Gyroscope Ring (Setor Oeste)
  {
    const sat6 = new THREE.Group();
    sat6.position.set(-26, 1.0, 2);
    castleGroup.add(sat6);

    const rad = 4.8;
    const dep = 7.0;
    const { group: s6Base } = createCraggyIslandMesh(rad, dep, darkRockMat, grassMat, stoneMat);
    sat6.add(s6Base);
    sat6.add(createHangingRoots(rad, dep, 10));

    // Dome observatory tower
    const obsGeo = new THREE.CylinderGeometry(1.8, 2.0, 3.2, 14);
    const obs = new THREE.Mesh(obsGeo, stoneMat);
    obs.position.y = 2.4;
    sat6.add(obs);

    const domeGeo = new THREE.SphereGeometry(1.8, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x3d7062, roughness: 0.4, metalness: 0.4 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 4.0;
    sat6.add(dome);

    // Spinning Celestial Ring at the summit
    const ringGeo = new THREE.TorusGeometry(1.2, 0.06, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xf5c030, metalness: 0.9, roughness: 0.2 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 6.0;
    sat6.add(ringMesh);

    animatedElements.push({
      update: (t) => {
        ringMesh.rotation.x = t * 0.8;
        ringMesh.rotation.y = t * 1.1;
      },
    });

    const obsLantern = createHangingLantern(0xffaa40, 1.8, 8);
    obsLantern.group.position.set(0, 5.0, 0);
    obsLantern.group.scale.setScalar(0.65);
    sat6.add(obsLantern.group);
    allLights.push(obsLantern.light);

    satelliteIslands.push({ group: sat6, baseY: 0.5, phase: 5.1, speed: 0.48, rotSpeed: -0.05 });
    interactiveBuildings.push({
      id: 'sat-observatory',
      name: 'Observatório das Estrelas',
      description: 'Domo astronômico com giroscópio celestial dourado calibrando a órbita das ilhas no éter.',
      meshGroup: sat6,
      windows: [],
      baseEmissiveIntensity: [],
    });
  }

  // Satellite 7: Stepping Rock
  {
    const sat7 = new THREE.Group();
    sat7.position.set(7, -5.5, 17);
    castleGroup.add(sat7);

    const rad = 2.8;
    const dep = 5.0;
    const { group: s7Base } = createCraggyIslandMesh(rad, dep, darkRockMat, grassMat, stoneMat);
    sat7.add(s7Base);

    const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.8, 6);
    const post = new THREE.Mesh(postGeo, darkWoodMat);
    post.position.set(-0.4, 1.6, -0.6);
    sat7.add(post);

    satelliteIslands.push({ group: sat7, baseY: -5.5, phase: 1.1, speed: 0.7, rotSpeed: 0.08 });
  }

  return {
    castleGroup,
    satelliteIslands,
    animatedElements,
    interactiveBuildings,
    allLights,
    windowMaterials,
  };
}
