'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  HeartCrack, 
  Sparkles, 
  X, 
  Shield, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Volume2,
  VolumeX
} from 'lucide-react';
import { 
  MascotReactionEngine, 
  ReactionConfig, 
  MascotState 
} from '@/lib/mascot/reactionEngine';
import { 
  createProceduralMascotRig, 
  MascotRig 
} from '@/lib/mascot/threeMascotModel';

export interface MascotEventData {
  id?: string;
  type: 'sold' | 'unsold';
  player: string;
  team?: string;
  price?: number;
  role?: string;
  timestamp?: number;
}

interface AuctionMascotOverlayProps {
  event: MascotEventData | null;
  onDismiss?: () => void;
  soundEnabled?: boolean;
}

export default function AuctionMascotOverlay({
  event,
  onDismiss,
  soundEnabled = true,
}: AuctionMascotOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active state machine
  const [activeReaction, setActiveReaction] = useState<ReactionConfig | null>(null);
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [visible, setVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<MascotEventData | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  // Internal references for animation loop
  const rigRef = useRef<MascotRig | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const stateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventQueueRef = useRef<MascotEventData[]>([]);
  const isAnimatingRef = useRef(false);

  // Animation motion variables
  const mascotPosRef = useRef({ x: 3.5, y: -0.6, z: 0 }); // Enters from right
  const targetXRef = useRef(1.1); // Stops near center-right
  const walkProgressRef = useRef(0);
  const isWalkingRef = useRef(true);

  // --------------------------------------------------------------------------
  // FIREWORKS / PARTICLES ON SOLD
  // --------------------------------------------------------------------------
  const triggerCelebrationParticles = useCallback((intensity: 'high' | 'medium' | 'subtle') => {
    if (intensity === 'subtle') return;

    // First burst: Gold and Emerald
    confetti({
      particleCount: intensity === 'high' ? 90 : 50,
      spread: 75,
      origin: { x: 0.65, y: 0.55 },
      colors: ['#10B981', '#F59E0B', '#3B82F6', '#FFD700', '#34D399'],
      disableForReducedMotion: true,
      zIndex: 9999,
    });

    // Second delayed burst from bottom right
    const t1 = setTimeout(() => {
      confetti({
        particleCount: intensity === 'high' ? 70 : 40,
        angle: 120,
        spread: 60,
        origin: { x: 0.85, y: 0.65 },
        colors: ['#F59E0B', '#10B981', '#60A5FA'],
        disableForReducedMotion: true,
        zIndex: 9999,
      });
    }, 280);

    return () => clearTimeout(t1);
  }, []);

  // --------------------------------------------------------------------------
  // THREE.JS SCENE SETUP & RENDER LOOP
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current) return;

    // Check WebGL availability
    try {
      const gl = canvasRef.current.getContext('webgl') || canvasRef.current.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const canvas = canvasRef.current;
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 600;

    // 1. Scene with transparent background
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera with responsive FOV
    const isMobile = window.innerWidth < 768;
    const camera = new THREE.PerspectiveCamera(isMobile ? 36 : 30, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 5.0);
    cameraRef.current = camera;

    // 3. WebGL Renderer with Alpha: true for crisp transparency
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    // 4. Studio Lighting tailored for Stadium Character Depth
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    mainKeyLight.position.set(3, 4, 3);
    scene.add(mainKeyLight);

    const stadiumRimLight = new THREE.DirectionalLight(0x00f0ff, 2.6); // Cyan rim light
    stadiumRimLight.position.set(-3, 2, -2);
    scene.add(stadiumRimLight);

    const fillGoldLight = new THREE.PointLight(0xf59e0b, 2.0, 10); // Warm gold fill
    fillGoldLight.position.set(1, 1, 2);
    scene.add(fillGoldLight);

    // 5. Procedural 3D Articulated Mascot Rig
    const rig = createProceduralMascotRig();
    rig.root.scale.setScalar(isMobile ? 0.95 : 1.15);
    rig.root.position.set(mascotPosRef.current.x, mascotPosRef.current.y, mascotPosRef.current.z);
    rig.root.rotation.y = -0.3; // Slight 3/4 turn towards viewer
    scene.add(rig.root);
    rigRef.current = rig;

    // 6. Handle Window Resizing
    const handleResize = () => {
      if (!canvas || !rendererRef.current || !cameraRef.current) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;

      cameraRef.current.aspect = w / h;
      cameraRef.current.fov = window.innerWidth < 768 ? 38 : 30;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);

    // 7. Core Three.js Animation Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!rigRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      walkProgressRef.current += delta;

      // Smooth Mascot Position Lerp (Entering / Exiting)
      const currentPos = mascotPosRef.current;
      const targetX = targetXRef.current;
      currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetX, isWalkingRef.current ? 0.08 : 0.04);
      rigRef.current.root.position.x = currentPos.x;

      // Update Kinematic Articulated Pose
      if (activeReaction) {
        rigRef.current.updatePose(
          activeReaction.pose,
          walkProgressRef.current,
          isWalkingRef.current
        );
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (rigRef.current) rigRef.current.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [activeReaction]);

  // --------------------------------------------------------------------------
  // EVENT QUEUE & STATE TRANSITIONS
  // --------------------------------------------------------------------------
  const startReactionSequence = useCallback(
    (eventData: MascotEventData) => {
      isAnimatingRef.current = true;
      setCurrentEvent(eventData);
      setVisible(true);

      // Select dynamic reaction variation via MascotReactionEngine
      const reaction =
        eventData.type === 'sold'
          ? MascotReactionEngine.getNextSoldReaction()
          : MascotReactionEngine.getNextUnsoldReaction();

      setActiveReaction(reaction);
      setMascotState('entering');

      // 1. Entering stage: Mascot walks in from right
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      mascotPosRef.current.x = isMobile ? 3.0 : 4.0;
      targetXRef.current = isMobile ? 0.35 : 1.15;
      isWalkingRef.current = true;

      // Trigger confetti immediately on sold entrance
      if (eventData.type === 'sold') {
        triggerCelebrationParticles(reaction.pose.particleIntensity);
      }

      // 2. Transition from Walking -> Reacting/Celebrating
      if (stateTimeoutRef.current) clearTimeout(stateTimeoutRef.current);

      stateTimeoutRef.current = setTimeout(() => {
        isWalkingRef.current = false;
        setMascotState('reacting');

        // 3. Hold celebration & display typography
        stateTimeoutRef.current = setTimeout(() => {
          setMascotState('holding');

          // 4. Exit smoothly after hold
          stateTimeoutRef.current = setTimeout(() => {
            setMascotState('exiting');
            isWalkingRef.current = true;
            targetXRef.current = isMobile ? 3.5 : 4.5; // Walk off to right

            // 5. Complete and reset
            stateTimeoutRef.current = setTimeout(() => {
              setVisible(false);
              setMascotState('idle');
              setActiveReaction(null);
              setCurrentEvent(null);
              isAnimatingRef.current = false;

              // Check if another event was queued
              if (eventQueueRef.current.length > 0) {
                const nextEvent = eventQueueRef.current.shift();
                if (nextEvent) {
                  setTimeout(() => startReactionSequence(nextEvent), 250);
                }
              } else if (onDismiss) {
                onDismiss();
              }
            }, 1200);
          }, 3800); // Hold time
        }, 800);
      }, 1400); // Entrance walk duration
    },
    [onDismiss, triggerCelebrationParticles]
  );

  // Handle incoming event prop with reliable deduplication
  useEffect(() => {
    if (!event) return;

    // Create unique event fingerprint: type-player-timestamp/price
    const eventId =
      event.id ||
      `${event.type}-${event.player}-${event.team || 'noteam'}-${event.price || 0}-${event.timestamp || Math.floor(Date.now() / 3000)}`;

    if (!MascotReactionEngine.isNewEvent(eventId, 10000)) {
      return; // Deduplicated! Prevent duplicate trigger
    }

    if (isAnimatingRef.current) {
      // If currently animating, push to queue (avoids conflicts/cut-offs)
      eventQueueRef.current.push(event);
    } else {
      startReactionSequence(event);
    }
  }, [event, startReactionSequence]);

  // Manual dismiss
  const handleManualClose = () => {
    if (stateTimeoutRef.current) clearTimeout(stateTimeoutRef.current);
    setVisible(false);
    setMascotState('idle');
    setActiveReaction(null);
    setCurrentEvent(null);
    isAnimatingRef.current = false;
    eventQueueRef.current = [];
    if (onDismiss) onDismiss();
  };

  if (!visible || !currentEvent) {
    return null;
  }

  const isSold = currentEvent.type === 'sold';
  const teamName = currentEvent.team || 'Franchise';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 pointer-events-none overflow-hidden select-none"
      aria-live="polite"
    >
      {/* ------------------------------------------------------------------- */}
      {/* 1. ATMOSPHERIC GROUND GLOW (Transparent Alpha Backdrop) */}
      {/* ------------------------------------------------------------------- */}
      <div
        className={`absolute bottom-0 right-0 w-full sm:w-[55vw] h-[45vh] rounded-tl-[120px] transition-opacity duration-1000 pointer-events-none blur-3xl ${
          isSold
            ? 'bg-gradient-to-t from-emerald-500/25 via-teal-500/15 to-transparent'
            : 'bg-gradient-to-t from-red-600/20 via-blue-900/15 to-transparent'
        }`}
      />

      {/* ------------------------------------------------------------------- */}
      {/* 2. THREE.JS TRANSPARENT 3D CANVAS */}
      {/* ------------------------------------------------------------------- */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ------------------------------------------------------------------- */}
      {/* 3. WEBGL FALLBACK (Graceful SVG render if WebGL disabled) */}
      {/* ------------------------------------------------------------------- */}
      {!webglSupported && (
        <div className="absolute right-12 bottom-20 w-64 h-80 flex items-center justify-center pointer-events-none animate-bounce">
          <div className="p-4 rounded-3xl bg-cricket-dark/90 border border-cricket-teal/50 shadow-2xl text-center">
            <div className="text-6xl mb-2">{isSold ? '🏆' : '💔'}</div>
            <div className="font-display font-bold text-sm text-white">
              {isSold ? 'Player Acquired!' : 'Better Luck Next Time!'}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 4. ANIMATED CELEBRATION / SYMPATHY BANNER (Matching Mockup) */}
      {/* ------------------------------------------------------------------- */}
      <div
        className={`absolute z-50 transition-all duration-700 transform pointer-events-auto ${
          mascotState === 'entering'
            ? 'opacity-0 translate-y-8 scale-95'
            : mascotState === 'exiting'
            ? 'opacity-0 translate-y-6 scale-95'
            : 'opacity-100 translate-y-0 scale-100'
        } bottom-10 sm:bottom-16 left-4 right-4 sm:left-auto sm:right-[18vw] sm:max-w-md`}
      >
        <div
          className={`relative rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl border-2 transition-all ${
            isSold
              ? 'bg-[#041a17]/90 border-emerald-400/80 shadow-[0_12px_45px_rgba(16,185,129,0.45)]'
              : 'bg-[#180911]/90 border-red-500/80 shadow-[0_12px_45px_rgba(239,68,68,0.35)]'
          }`}
        >
          {/* Subtle Close Button */}
          <button
            onClick={handleManualClose}
            className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
            title="Dismiss overlay"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            {/* Status Icon Badge */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                isSold
                  ? 'bg-gradient-to-tr from-emerald-500 to-amber-400 text-cricket-dark'
                  : 'bg-gradient-to-tr from-red-600 to-rose-400 text-white'
              }`}
            >
              {isSold ? (
                <Trophy className="w-6 h-6 animate-pulse" />
              ) : (
                <HeartCrack className="w-6 h-6 animate-pulse" />
              )}
            </div>

            {/* Marquee & Message Typography */}
            <div className="space-y-1 min-w-0 flex-1 pr-4">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isSold
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-red-500/20 text-red-300 border-red-400/40'
                  }`}
                >
                  {isSold ? 'PLAYER SOLD' : 'PLAYER UNSOLD'}
                </span>

                {activeReaction && (
                  <span className="text-[10px] text-gray-400 font-mono hidden sm:inline truncate">
                    • {activeReaction.name}
                  </span>
                )}
              </div>

              {/* Main Headline */}
              <h3 className="font-display font-black text-lg sm:text-xl text-white tracking-wide leading-tight drop-shadow-md">
                {isSold ? (
                  currentEvent.team ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-yellow-200 to-emerald-400">
                      ★ WELCOME TO TEAM {currentEvent.team.toUpperCase()}! ★
                    </span>
                  ) : (
                    <span>WELCOME TO THE TEAM!</span>
                  )
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-200 to-red-400">
                    BETTER LUCK NEXT TIME!
                  </span>
                )}
              </h3>

              {/* Player Name and Sold Price */}
              <p className="text-xs text-gray-200 font-medium truncate flex items-center gap-1.5">
                <span className="font-bold text-white">{currentEvent.player}</span>
                {currentEvent.price !== undefined && isSold && (
                  <>
                    <span className="text-cricket-gold font-bold">
                      • ₹{currentEvent.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">(Sold)</span>
                  </>
                )}
                {!isSold && (
                  <span className="text-[10px] text-red-300">
                    • Enters Unsold Pool for Round 2
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Reaction Tagline Bar */}
          {activeReaction && (
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-cricket-muted font-medium italic truncate">
                "{activeReaction.tagline}"
              </span>
              <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                CricPlus Mascot Overlay
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
