import * as THREE from 'three';
import { buildCastleScene, CastleSceneData, InteractiveBuilding } from './castleBuilder';
import { createCloudSystem } from './clouds';
import { getMoonTexture } from './textures';

export interface CameraPreset {
  id: string;
  label: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export interface WorldSceneCallbacks {
  onHoverBuilding?: (building: InteractiveBuilding | null) => void;
  onFPSUpdate?: (fps: number) => void;
  onCameraModeChange?: (isAutoTour: boolean) => void;
}

export class WorldScene {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private castleData!: CastleSceneData;
  private cloudSystem!: ReturnType<typeof createCloudSystem>;

  // Animation & Time
  private clock = new THREE.Clock();
  private reqId: number | null = null;
  private isDestroyed = false;

  // Camera Orbit State
  private target = new THREE.Vector3(0, 6.0, 0);
  private currentCameraPos = new THREE.Vector3(-22, 16, 26);
  private desiredCameraPos = new THREE.Vector3(-22, 16, 26);
  private desiredTarget = new THREE.Vector3(0, 6.0, 0);

  // Manual Orbit controls state
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private spherical = new THREE.Spherical();
  private isUserInteracting = false;
  private lastUserInteractionTime = 0;
  private autoTourEnabled = true;

  // Cinematic Tour Path Waypoints
  private tourTime = 0;
  private tourCycleDuration = 45;
  private tourWaypoints: { pos: THREE.Vector3; target: THREE.Vector3 }[] = [];

  // Raycasting & Interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);
  private hoveredBuilding: InteractiveBuilding | null = null;
  private callbacks: WorldSceneCallbacks;

  // Performance telemetry
  private frameCount = 0;
  private lastFpsUpdateTime = 0;

  // Particles
  private starsParticles!: THREE.Points;
  private fireflies!: THREE.Points;
  private fireflyPositions!: Float32Array;

  // Moon
  private moonMesh!: THREE.Mesh;

  constructor(container: HTMLElement, callbacks: WorldSceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.init();
  }

  private init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    // Deep nocturnal indigo sky
    this.scene.background = new THREE.Color(0x060c18);
    // Linear fog preserves crisp visibility for the castle & islands (< 55 units)
    this.scene.fog = new THREE.Fog(0x081022, 55, 180);

    // 2. Camera with tuned near plane to maximize depth buffer precision
    this.camera = new THREE.PerspectiveCamera(40, width / height, 1.0, 240);
    this.camera.position.set(-22, 16, 26);
    this.camera.lookAt(this.target);

    // 3. WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting Setup
    this.setupLighting();

    // 5. Celestial Environment (Moon, Stars)
    this.setupCelestialSky();

    // 6. Castle Architecture & Satellite Islands
    this.castleData = buildCastleScene();
    this.scene.add(this.castleData.castleGroup);

    // 7. Volumetric Clouds
    this.cloudSystem = createCloudSystem();
    this.scene.add(this.cloudSystem.group);

    // 8. Fireflies / Stardust Motes
    this.setupFireflies();

    // 9. Cinematic Waypoints
    this.setupCinematicWaypoints();

    // 10. Event Listeners
    this.setupEventListeners();

    // 11. Start Loop
    this.lastFpsUpdateTime = performance.now();
    this.animate();
  }

  private setupLighting() {
    // A. Sky & Ground Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x5272a4, 0x142036, 1.4);
    this.scene.add(hemiLight);

    // B. Key Moon Directional Light (cool silvery blue with soft shadows)
    const moonLight = new THREE.DirectionalLight(0xdbe6fc, 3.0);
    moonLight.position.set(45, 38, -48);
    moonLight.castShadow = true;

    // Shadow configuration tuned to prevent shadow acne and clipping
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 10;
    moonLight.shadow.camera.far = 145;
    moonLight.shadow.camera.left = -30;
    moonLight.shadow.camera.right = 30;
    moonLight.shadow.camera.top = 30;
    moonLight.shadow.camera.bottom = -30;
    moonLight.shadow.bias = -0.0003;
    moonLight.shadow.normalBias = 0.03;
    moonLight.shadow.radius = 2.0;

    this.scene.add(moonLight);

    // C. Stylized Fill / Rim Light: fills shadow sides with rich indigo glow
    const fillLight = new THREE.DirectionalLight(0x385585, 1.2);
    fillLight.position.set(-35, 18, 40);
    this.scene.add(fillLight);

    // D. Warm town bounce light from glowing windows
    const townGlow = new THREE.PointLight(0xffaa40, 1.6, 40, 1.5);
    townGlow.position.set(0, 3.5, 2.5);
    this.scene.add(townGlow);
  }

  private setupCelestialSky() {
    // Moon Mesh
    const moonTex = getMoonTexture();
    const moonGeo = new THREE.SphereGeometry(7.5, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTex,
      color: 0xf4f8ff,
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(65, 48, -70);
    this.scene.add(this.moonMesh);

    // Soft Moon Halo
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 256;
    haloCanvas.height = 256;
    const hctx = haloCanvas.getContext('2d')!;
    const hgrad = hctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    hgrad.addColorStop(0, 'rgba(220, 235, 255, 0.5)');
    hgrad.addColorStop(0.35, 'rgba(175, 205, 255, 0.22)');
    hgrad.addColorStop(0.7, 'rgba(95, 145, 240, 0.06)');
    hgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    hctx.fillStyle = hgrad;
    hctx.fillRect(0, 0, 256, 256);

    const haloTex = new THREE.CanvasTexture(haloCanvas);
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
    });
    const haloSprite = new THREE.Sprite(haloMat);
    haloSprite.scale.set(38, 38, 1);
    haloSprite.position.copy(this.moonMesh.position);
    this.scene.add(haloSprite);

    // Starfield
    const starCount = 500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95);
      const dist = 160 + Math.random() * 50;

      const x = Math.sin(phi) * Math.cos(theta) * dist;
      const y = Math.cos(phi) * dist;
      const z = Math.sin(phi) * Math.sin(theta) * dist;

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = Math.max(10, y);
      starPositions[i * 3 + 2] = z;

      const tone = 0.8 + Math.random() * 0.2;
      starColors[i * 3] = tone;
      starColors[i * 3 + 1] = tone * (0.92 + Math.random() * 0.08);
      starColors[i * 3 + 2] = 1.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: false,
    });

    this.starsParticles = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starsParticles);
  }

  private setupFireflies() {
    const count = 65;
    const geo = new THREE.BufferGeometry();
    this.fireflyPositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      this.fireflyPositions[i * 3] = (Math.random() - 0.5) * 28;
      this.fireflyPositions[i * 3 + 1] = 1.5 + Math.random() * 11;
      this.fireflyPositions[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.fireflyPositions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffd578,
      size: 0.32,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    this.fireflies = new THREE.Points(geo, mat);
    this.scene.add(this.fireflies);
  }

  /**
   * Verified cinematic path framing ALL islands with generous clearance and zero occlusion
   */
  private setupCinematicWaypoints() {
    this.tourCycleDuration = 72; // Generous 72-second cinematic journey across the archipelago

    this.tourWaypoints = [
      // 1. Vista 3/4 do Castelo Central com Luar ao fundo
      {
        pos: new THREE.Vector3(-24, 18, 28),
        target: new THREE.Vector3(0, 6.0, 0),
      },
      // 2. Beirais e Luzes do Castelo (detalhes do deck, escadas e cordões de luz)
      {
        pos: new THREE.Vector3(11, 5.5, 17),
        target: new THREE.Vector3(1, 4.5, 2),
      },
      // 3. Chalé do Vento Leste (enquadramento frontal limpo sem nenhuma ilha na frente)
      {
        pos: new THREE.Vector3(30, 3.5, -28),
        target: new THREE.Vector3(21, -0.5, -17),
      },
      // 4. Aldeia Flutuante do Cais (casas gêmeas e píer suspenso sobre as nuvens)
      {
        pos: new THREE.Vector3(38, 5.5, 23),
        target: new THREE.Vector3(26, 1.8, 12),
      },
      // 5. Atalaia do Sul (torre com flâmula dourada e vigia)
      {
        pos: new THREE.Vector3(17, 8.5, 39),
        target: new THREE.Vector3(8, 5.0, 26),
      },
      // 6. Pedra do Farol Solitário (lanterna suspensa balançando no abismo)
      {
        pos: new THREE.Vector3(-29, 1.5, 30),
        target: new THREE.Vector3(-18, -1.0, 20),
      },
      // 7. Observatório das Estrelas (domo com anel giroscópico girando)
      {
        pos: new THREE.Vector3(-39, 6.0, 9),
        target: new THREE.Vector3(-26, 3.2, 2),
      },
      // 8. Residência do Mirante Ocidental (casa branca com alpendre e lampião)
      {
        pos: new THREE.Vector3(-28, 8.0, -28),
        target: new THREE.Vector3(-18, 4.0, -18),
      },
      // 9. Vista Aérea Zenital mostrando todo o conjunto de ilhas e o mar de nuvens
      {
        pos: new THREE.Vector3(-4, 46, 34),
        target: new THREE.Vector3(0, 3.0, 0),
      },
      // 10. Retorno suave à Vista 3/4 do Castelo
      {
        pos: new THREE.Vector3(-24, 18, 28),
        target: new THREE.Vector3(0, 6.0, 0),
      },
    ];
  }

  private setupEventListeners() {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('resize', this.onWindowResize);
  }

  private onPointerDown = (e: PointerEvent) => {
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
    this.isUserInteracting = true;
    this.lastUserInteractionTime = performance.now();
  };

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (!this.isDragging) {
      this.checkBuildingHover();
      return;
    }

    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };

    this.isUserInteracting = true;
    this.lastUserInteractionTime = performance.now();

    const offset = new THREE.Vector3().subVectors(this.desiredCameraPos, this.target);
    this.spherical.setFromVector3(offset);

    this.spherical.theta -= deltaX * 0.0065;
    this.spherical.phi -= deltaY * 0.0065;

    // Strict polar angle bounds: never clip below horizontal island base
    this.spherical.phi = Math.max(0.2, Math.min(Math.PI * 0.46, this.spherical.phi));

    offset.setFromSpherical(this.spherical);
    this.desiredCameraPos.copy(this.target).add(offset);
  };

  private onPointerUp = () => {
    this.isDragging = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.isUserInteracting = true;
    this.lastUserInteractionTime = performance.now();

    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    const offset = new THREE.Vector3().subVectors(this.desiredCameraPos, this.target);
    const curDist = offset.length();
    // Safe distance clamping: min 16, max 65
    const newDist = THREE.MathUtils.clamp(curDist * zoomFactor, 16, 65);

    offset.setLength(newDist);
    this.desiredCameraPos.copy(this.target).add(offset);
  };

  private onWindowResize = () => {
    if (this.isDestroyed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  private checkBuildingHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    let foundBuilding: InteractiveBuilding | null = null;
    for (const b of this.castleData.interactiveBuildings) {
      const intersects = this.raycaster.intersectObjects(b.meshGroup.children, true);
      if (intersects.length > 0) {
        foundBuilding = b;
        break;
      }
    }

    if (foundBuilding !== this.hoveredBuilding) {
      if (this.hoveredBuilding) {
        this.hoveredBuilding.windows.forEach((win, i) => {
          const mat = win.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = this.hoveredBuilding!.baseEmissiveIntensity[i];
        });
      }

      this.hoveredBuilding = foundBuilding;
      if (this.hoveredBuilding) {
        this.hoveredBuilding.windows.forEach((win, i) => {
          const mat = win.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = this.hoveredBuilding!.baseEmissiveIntensity[i] * 1.5 + 0.4;
        });
      }

      if (this.callbacks.onHoverBuilding) {
        this.callbacks.onHoverBuilding(this.hoveredBuilding);
      }
    }
  }

  public zoomIn() {
    this.isUserInteracting = true;
    this.lastUserInteractionTime = performance.now();
    const offset = new THREE.Vector3().subVectors(this.desiredCameraPos, this.target);
    const newDist = Math.max(16, offset.length() * 0.85);
    offset.setLength(newDist);
    this.desiredCameraPos.copy(this.target).add(offset);
  }

  public zoomOut() {
    this.isUserInteracting = true;
    this.lastUserInteractionTime = performance.now();
    const offset = new THREE.Vector3().subVectors(this.desiredCameraPos, this.target);
    const newDist = Math.min(65, offset.length() * 1.18);
    offset.setLength(newDist);
    this.desiredCameraPos.copy(this.target).add(offset);
  }

  public resetCamera() {
    this.isUserInteracting = false;
    this.desiredCameraPos.set(-22, 16, 26);
    this.desiredTarget.set(0, 6.0, 0);
  }

  public toggleAutoTour(): boolean {
    this.autoTourEnabled = !this.autoTourEnabled;
    if (this.autoTourEnabled) {
      this.isUserInteracting = false;
    }
    if (this.callbacks.onCameraModeChange) {
      this.callbacks.onCameraModeChange(this.autoTourEnabled);
    }
    return this.autoTourEnabled;
  }

  public setPreset(preset: CameraPreset) {
    this.isUserInteracting = true;
    this.lastUserInteractionTime = performance.now();
    this.desiredCameraPos.copy(preset.position);
    this.desiredTarget.copy(preset.target);
  }

  public captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  private animate = () => {
    if (this.isDestroyed) return;
    this.reqId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // 1. Performance Telemetry
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdateTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdateTime));
      if (this.callbacks.onFPSUpdate) {
        this.callbacks.onFPSUpdate(fps);
      }
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;
    }

    // 2. Camera Cinematic Path
    if (this.autoTourEnabled) {
      if (this.isUserInteracting && now - this.lastUserInteractionTime > 18000 && !this.isDragging) {
        this.isUserInteracting = false;
      }

      if (!this.isUserInteracting) {
        this.tourTime += delta;
        const progress = (this.tourTime % this.tourCycleDuration) / this.tourCycleDuration;

        const segCount = this.tourWaypoints.length - 1;
        const segProgress = progress * segCount;
        const segIndex = Math.floor(segProgress);
        const t = segProgress - segIndex;

        const easeT = t * t * (3 - 2 * t);

        const wpA = this.tourWaypoints[segIndex % this.tourWaypoints.length];
        const wpB = this.tourWaypoints[(segIndex + 1) % this.tourWaypoints.length];

        this.desiredCameraPos.lerpVectors(wpA.pos, wpB.pos, easeT);
        this.desiredTarget.lerpVectors(wpA.target, wpB.target, easeT);
      }
    }

    // Camera damping
    this.currentCameraPos.lerp(this.desiredCameraPos, 0.05);
    this.target.lerp(this.desiredTarget, 0.05);

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.target);

    // 3. Update Animated Scene Elements (Flags, smoke, rings)
    this.castleData.animatedElements.forEach((el) => el.update(time, delta));

    // 4. Update Satellite Islands Oscillation
    this.castleData.satelliteIslands.forEach((isle) => {
      const bobY = Math.sin(time * isle.speed + isle.phase) * 0.35;
      isle.group.position.y = isle.baseY + bobY;
      isle.group.rotation.y = Math.sin(time * isle.rotSpeed + isle.phase) * 0.03;
      isle.group.rotation.z = Math.cos(time * isle.speed * 0.7 + isle.phase) * 0.012;
    });

    // 5. Update Clouds
    this.cloudSystem.update(time, delta);

    // 6. Subtle Window Candle Flicker
    this.castleData.windowMaterials.forEach((mat, idx) => {
      const flicker = Math.sin(time * 3 + idx * 1.7) * 0.12 + Math.cos(time * 6 + idx * 2.1) * 0.08;
      mat.emissiveIntensity = Math.max(1.0, 1.8 + flicker);
    });

    // 7. Fireflies / Stardust Animation
    if (this.fireflyPositions) {
      const pos = this.fireflies.geometry.attributes.position;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) + Math.sin(time * 1.8 + i) * 0.015;
        let x = pos.getX(i) + 0.02;
        if (x > 22) x = -22;
        if (y > 15) y = 1.5;
        pos.setX(i, x);
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // 8. Render
    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    this.isDestroyed = true;
    if (this.reqId !== null) {
      cancelAnimationFrame(this.reqId);
    }

    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onWindowResize);

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
