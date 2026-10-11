import * as THREE from 'three';

export interface CloudSystem {
  group: THREE.Group;
  update: (time: number, delta: number) => void;
}

/**
 * Creates a single 3D stylized puffy cloud cluster from overlapping spheres.
 * Real 3D geometry eliminates flat-plane slicing, Z-fighting, and sorting bugs.
 */
function createVolumetricCloudMesh(scale: number, material: THREE.Material): THREE.Group {
  const cluster = new THREE.Group();

  // Cluster of 6-9 overlapping spheres creating a fluffy cumulus shape
  const sphereGeo = new THREE.SphereGeometry(1.0, 10, 8);
  const puffCount = 6 + Math.floor(Math.random() * 4);

  for (let i = 0; i < puffCount; i++) {
    const puff = new THREE.Mesh(sphereGeo, material);
    puff.castShadow = false; // avoid self-shadow acne on soft clouds
    puff.receiveShadow = true;

    // Distribute horizontally and puff upwards
    const angle = (i / puffCount) * Math.PI * 2;
    const dist = (0.4 + Math.random() * 0.8) * scale;
    const px = Math.cos(angle) * dist;
    const pz = Math.sin(angle) * dist * 0.7;
    const py = (Math.random() - 0.2) * 0.5 * scale;

    const s = (0.7 + Math.random() * 0.7) * scale;
    puff.scale.set(s, s * 0.75, s);
    puff.position.set(px, py, pz);
    cluster.add(puff);
  }

  // Central taller dome puff
  const centerPuff = new THREE.Mesh(sphereGeo, material);
  centerPuff.receiveShadow = true;
  const cs = scale * 1.1;
  centerPuff.scale.set(cs, cs * 0.85, cs);
  centerPuff.position.set(0, scale * 0.35, 0);
  cluster.add(centerPuff);

  return cluster;
}

export function createCloudSystem(): CloudSystem {
  const group = new THREE.Group();
  group.name = 'VolumetricCloudArchipelago';

  // Soft stylized velvet cloud material
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0x485e82, // Moonlit nocturnal slate-blue
    roughness: 0.9,
    metalness: 0.05,
    emissive: new THREE.Color(0x1a263c), // Subtle inner lunar glow
    emissiveIntensity: 0.45,
    flatShading: false,
  });

  interface CloudInstance {
    mesh: THREE.Group;
    baseY: number;
    baseAngle: number;
    radius: number;
    speed: number;
    floatSpeed: number;
    phase: number;
  }

  const cloudInstances: CloudInstance[] = [];

  // 1. Lower Sea of Clouds: Circling beneath the islands at Y = -11 to -16
  const seaCount = 18;
  for (let i = 0; i < seaCount; i++) {
    const scale = 4.5 + Math.random() * 3.5;
    const cloud = createVolumetricCloudMesh(scale, cloudMat);

    // Keep safely outside main island (radius 20 to 50)
    const radius = 22 + Math.random() * 28;
    const baseAngle = (i / seaCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const baseY = -11.5 + (Math.random() - 0.5) * 3.0;

    group.add(cloud);
    cloudInstances.push({
      mesh: cloud,
      baseY,
      baseAngle,
      radius,
      speed: 0.012 + Math.random() * 0.012,
      floatSpeed: 0.25 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // 2. Mid-Altitude Drifting Puffs: Floating between peripheral islands (Y = -4 to 2)
  const midCount = 8;
  for (let j = 0; j < midCount; j++) {
    const scale = 2.8 + Math.random() * 2.2;
    const cloud = createVolumetricCloudMesh(scale, cloudMat);

    // Strictly in outer ring (radius 28 to 44) to never clip the central castle
    const radius = 30 + Math.random() * 16;
    const baseAngle = (j / midCount) * Math.PI * 2;
    const baseY = -3.5 + Math.random() * 5.0;

    group.add(cloud);
    cloudInstances.push({
      mesh: cloud,
      baseY,
      baseAngle,
      radius,
      speed: 0.016 + Math.random() * 0.015,
      floatSpeed: 0.3 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const update = (time: number, _delta: number) => {
    cloudInstances.forEach((cl) => {
      const angle = cl.baseAngle + time * cl.speed;
      const x = Math.cos(angle) * cl.radius;
      const z = Math.sin(angle) * cl.radius;
      const y = cl.baseY + Math.sin(time * cl.floatSpeed + cl.phase) * 0.6;

      cl.mesh.position.set(x, y, z);
      cl.mesh.rotation.y = angle * 0.5;
    });
  };

  return { group, update };
}
