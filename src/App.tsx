/**
 * CASTLE ABOVE CLOUDS — A DREAM IN THE SKY · REBUILT
 * Real-time PBR Stylized Three.js Experience
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Volume2,
  VolumeX,
  Camera,
  Eye,
  EyeOff,
  Sparkles,
  Wind,
  Moon,
  Info,
} from 'lucide-react';
import { WorldScene, CameraPreset } from './scene/worldScene';
import { InteractiveBuilding } from './scene/castleBuilder';
import { ambientSound } from './scene/audio';

const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'lunar-three-quarter',
    label: 'Vista 3/4 & Luar',
    position: new THREE.Vector3(-24, 18, 28),
    target: new THREE.Vector3(0, 6, 0),
  },
  {
    id: 'deck-lights',
    label: 'Castelo & Beirais',
    position: new THREE.Vector3(11, 5.5, 17),
    target: new THREE.Vector3(1, 4.5, 2),
  },
  {
    id: 'satellite-cottage',
    label: 'Chalé do Vento Leste',
    position: new THREE.Vector3(30, 3.5, -28),
    target: new THREE.Vector3(21, -0.5, -17),
  },
  {
    id: 'village-pier',
    label: 'Aldeia do Cais Celeste',
    position: new THREE.Vector3(38, 5.5, 23),
    target: new THREE.Vector3(26, 1.8, 12),
  },
  {
    id: 'watchtower',
    label: 'Atalaia do Sul',
    position: new THREE.Vector3(17, 8.5, 39),
    target: new THREE.Vector3(8, 5.0, 26),
  },
  {
    id: 'observatory',
    label: 'Observatório das Estrelas',
    position: new THREE.Vector3(-39, 6.0, 9),
    target: new THREE.Vector3(-26, 3.2, 2),
  },
  {
    id: 'solitary-lighthouse',
    label: 'Pedra do Farol Solitário',
    position: new THREE.Vector3(-29, 1.5, 30),
    target: new THREE.Vector3(-18, -1.0, 20),
  },
  {
    id: 'birds-eye',
    label: 'Vista Aérea Geral',
    position: new THREE.Vector3(-4, 46, 34),
    target: new THREE.Vector3(0, 3, 0),
  },
];

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<WorldScene | null>(null);

  // UI state
  const [fps, setFps] = useState<number>(60);
  const [isAutoTour, setIsAutoTour] = useState<boolean>(true);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>('lunar-three-quarter');
  const [hoveredBuilding, setHoveredBuilding] = useState<InteractiveBuilding | null>(null);
  const [isUiVisible, setIsUiVisible] = useState<boolean>(true);
  const [snapshotFlash, setSnapshotFlash] = useState<boolean>(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new WorldScene(mountRef.current, {
      onFPSUpdate: (currentFps) => setFps(currentFps),
      onHoverBuilding: (building) => setHoveredBuilding(building),
      onCameraModeChange: (tourState) => setIsAutoTour(tourState),
    });

    worldRef.current = scene;

    return () => {
      scene.destroy();
      worldRef.current = null;
      ambientSound.stop();
    };
  }, []);

  // UI Handlers
  const handleZoomIn = useCallback(() => {
    worldRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    worldRef.current?.zoomOut();
  }, []);

  const handleReset = useCallback(() => {
    worldRef.current?.resetCamera();
    setActivePreset('lunar-three-quarter');
  }, []);

  const handleToggleAutoTour = useCallback(() => {
    if (worldRef.current) {
      const newState = worldRef.current.toggleAutoTour();
      setIsAutoTour(newState);
    }
  }, []);

  const handlePresetSelect = useCallback((preset: CameraPreset) => {
    worldRef.current?.setPreset(preset);
    setActivePreset(preset.id);
  }, []);

  const handleToggleAudio = useCallback(() => {
    const active = ambientSound.toggle();
    setIsAudioActive(active);
  }, []);

  const handleTakeSnapshot = useCallback(() => {
    if (!worldRef.current) return;
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 250);

    const dataUrl = worldRef.current.captureSnapshot();
    const link = document.createElement('a');
    link.download = `castle-above-clouds-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  return (
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden bg-[#040814] text-slate-100 font-sans select-none">
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing w-full h-full"
      />

      {/* Snapshot flash effect */}
      {snapshotFlash && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-300 opacity-90" />
      )}

      {/* Vertical Credit on the lateral side: STYLIZED WEB THREE.JS */}
      <div
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-500 hidden md:block ${
          isUiVisible ? 'opacity-40 hover:opacity-80' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-3 [writing-mode:vertical-rl] rotate-180">
          <span className="text-[10px] tracking-[0.35em] font-mono-telemetry uppercase text-slate-400">
            STYLIZED WEB THREE.JS
          </span>
          <div className="w-12 h-[1px] bg-gradient-to-t from-slate-400/50 to-transparent" />
        </div>
      </div>

      {/* Top Bar: Subtitle on Left, Badge on Right */}
      <header
        className={`absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-6 md:p-8 pointer-events-none transition-all duration-500 ${
          isUiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        {/* Subtitle */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse" />
          <span className="text-xs md:text-sm tracking-[0.28em] uppercase font-mono-telemetry text-amber-200/90 font-medium drop-shadow-md">
            A DREAM IN THE SKY · REBUILT
          </span>
        </div>

        {/* Top-Right Badge: REAL-TIME PBR SCENE */}
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full glass-pill flex items-center gap-2 border border-slate-700/60 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-[11px] font-mono-telemetry tracking-[0.2em] uppercase font-semibold text-slate-200">
              REAL-TIME PBR SCENE
            </span>
            <span className="text-[10px] font-mono-telemetry text-emerald-400/90 font-bold border-l border-slate-700/80 pl-2">
              {fps} FPS
            </span>
          </div>

          {/* Quick UI visibility toggle for clean video capture */}
          <button
            onClick={() => setIsUiVisible(!isUiVisible)}
            title="Ocultar interface para captura limpa"
            className="p-2 rounded-full glass-pill hover:bg-white/10 active:scale-95 transition text-slate-300"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Float button to restore UI if hidden */}
      {!isUiVisible && (
        <button
          onClick={() => setIsUiVisible(true)}
          title="Exibir Interface"
          className="absolute top-6 right-6 z-40 p-2.5 rounded-full glass-pill text-amber-300 hover:bg-white/10 shadow-xl transition"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}

      {/* Main Editorial Hero Typography on Left */}
      <main
        className={`absolute top-20 md:top-24 left-6 md:left-14 max-w-xl z-10 pointer-events-none transition-all duration-500 ${
          isUiVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
        }`}
      >
        <div className="space-y-3.5">
          {/* Main Title Badge */}
          <div className="inline-block">
            <h2 className="text-[11px] md:text-xs font-mono-telemetry tracking-[0.3em] uppercase text-sky-300/80">
              CASTLE ABOVE CLOUDS
            </h2>
          </div>

          {/* Main Large Text in Two Weights */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] leading-[1.08] tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] font-serif-title">
            <span className="font-light text-slate-200/90 block">Acima das nuvens,</span>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400">
              existe um castelo.
            </span>
          </h1>

          {/* Small Supporting Text */}
          <p className="text-xs sm:text-sm md:text-[14px] leading-relaxed text-slate-300/85 max-w-md pt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] font-normal">
            Circule lentamente pelos beirais e pelas torres, passarelas de madeira e chalés flutuantes. O luar desliza pelas paredes de pedra, e lâmpadas quentes se acendem nos cômodos onde as pessoas vivem.
          </p>

          {/* Interactive Hover Inspect Card */}
          {hoveredBuilding && (
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto">
              <div className="glass-panel p-3.5 rounded-xl max-w-sm border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider font-mono-telemetry">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>{hoveredBuilding.name}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-snug">
                  {hoveredBuilding.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Camera Angle Presets (Floating Selector) */}
      <nav
        className={`absolute top-20 md:top-24 right-6 md:right-8 z-20 flex flex-col gap-1.5 transition-all duration-500 ${
          isUiVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
        }`}
        aria-label="Ângulos de Câmera"
      >
        <span className="text-[10px] uppercase font-mono-telemetry tracking-widest text-slate-400 mb-0.5 text-right px-1">
          Ângulos de Câmera
        </span>
        <div className="flex flex-col gap-1 glass-panel p-1.5 rounded-xl max-h-[65vh] overflow-y-auto pr-1">
          {CAMERA_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all duration-200 flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30 shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{preset.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Bar: Navigation Icons on Left, Telemetry on Right */}
      <footer
        className={`absolute bottom-0 left-0 right-0 z-20 p-5 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pointer-events-none transition-all duration-500 ${
          isUiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Bottom Left: Navigation & Orbit Control Icons */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl border-slate-700/60">
            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              title="Aproximar Câmera"
              className="p-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-amber-200 active:scale-90 transition"
              aria-label="Aproximar câmera"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              title="Afastar Câmera"
              className="p-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-amber-200 active:scale-90 transition"
              aria-label="Afastar câmera"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-slate-700/80 mx-1" />

            {/* Reset View */}
            <button
              onClick={handleReset}
              title="Redefinir Visão Padrão"
              className="p-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-amber-200 active:scale-90 transition"
              aria-label="Redefinir visão"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Auto Orbit / Tour Toggle */}
            <button
              onClick={handleToggleAutoTour}
              title={isAutoTour ? 'Pausar Órbita Automática' : 'Iniciar Órbita Automática'}
              className={`p-2.5 rounded-xl transition flex items-center gap-1.5 ${
                isAutoTour
                  ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'hover:bg-white/10 text-slate-300'
              }`}
              aria-label="Alternar órbita automática"
            >
              <Compass className={`w-4 h-4 ${isAutoTour ? 'animate-spin [animation-duration:12s]' : ''}`} />
              <span className="text-[11px] font-mono-telemetry uppercase pr-1 font-semibold">
                {isAutoTour ? 'Órbita Ativa' : 'Orbitar'}
              </span>
            </button>

            <div className="w-[1px] h-5 bg-slate-700/80 mx-1" />

            {/* Ambient Sound Toggle */}
            <button
              onClick={handleToggleAudio}
              title={isAudioActive ? 'Silenciar Brisa Noturna' : 'Ativar Brisa Noturna & Sinos'}
              className={`p-2.5 rounded-xl transition ${
                isAudioActive
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                  : 'hover:bg-white/10 text-slate-300'
              }`}
              aria-label="Alternar som ambiente"
            >
              {isAudioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Snapshot Photo Button */}
            <button
              onClick={handleTakeSnapshot}
              title="Capturar Foto em Alta Resolução (PNG)"
              className="p-2.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-amber-300 active:scale-90 transition"
              aria-label="Capturar imagem"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Drag & Scroll Hint */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl glass-panel text-[11px] text-slate-400 font-mono-telemetry">
            <span>Arraste para orbitar · Rolagem para zoom</span>
          </div>
        </div>

        {/* Bottom Right: Telemetry as strictly requested */}
        <div className="pointer-events-auto">
          <div className="glass-panel px-4 py-2.5 rounded-2xl border-slate-700/60 shadow-2xl flex flex-col items-start md:items-end gap-1">
            <div className="text-[11px] md:text-xs font-mono-telemetry text-slate-200 tracking-wide text-left md:text-right">
              Coordenadas 32.7° N · 118.4° E / Luar · Brisa · Camada de nuvens a 1.200 m
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono-telemetry text-slate-400">
              <span className="flex items-center gap-1">
                <Moon className="w-3 h-3 text-sky-200" /> Luar Silencioso
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3 text-sky-300" /> Vento a 12 nós
              </span>
              <span>·</span>
              <span className="text-amber-300">2.400 K</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
