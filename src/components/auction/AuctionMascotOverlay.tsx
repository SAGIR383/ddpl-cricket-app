'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  HeartCrack, 
  Sparkles, 
  X, 
  ShieldCheck, 
  DollarSign
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

  // Reaction State Machine
  const [activeReaction, setActiveReaction] = useState<ReactionConfig | null>(null);
  const activeReactionRef = useRef<ReactionConfig | null>(null);
  activeReactionRef.current = activeReaction;

  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [visible, setVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<MascotEventData | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  // Internal references for Three.js instance
  const rigRef = useRef<MascotRig | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const stateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventQueueRef = useRef<MascotEventData[]>([]);
  const isAnimatingRef = useRef(false);

  // Horizontal motion inside the compact 320x340 stage
  const mascotPosRef = useRef({ x: 2.2, y: 0.0, z: 0 }); // Enters from offstage right
  const targetXRef = useRef(0.0); // Centers in the compact stage
  const walkProgressRef = useRef(0);
  const isWalkingRef = useRef(true);

  // --------------------------------------------------------------------------
  // TASTEFUL PARTICLES ON SOLD
  // --------------------------------------------------------------------------
  const triggerCelebrationParticles = useCallback((intensity: 'high' | 'medium' | 'subtle') => {
    if (intensity === 'subtle') return;

    try {
      // Localized golden-green confetti burst from bottom-right stage
      confetti({
        particleCount: intensity === 'high' ? 65 : 40,
        spread: 60,
        origin: { x: 0.88, y: 0.82 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#FFD700', '#34D399'],
        disableForReducedMotion: true,
        zIndex: 9999,
      });

      const t1 = setTimeout(() => {
        try {
          confetti({
            particleCount: intensity === 'high' ? 45 : 25,
            angle: 110,
            spread: 50,
            origin: { x: 0.92, y: 0.85 },
            colors: ['#F59E0B', '#10B981', '#60A5FA'],
            disableForReducedMotion: true,
            zIndex: 9999,
          });
        } catch {
          // ignore
        }
      }, 250);

      return () => clearTimeout(t1);
    } catch {
      // ignore
    }
  }, []);

  // --------------------------------------------------------------------------
  // INITIALIZE THREE.JS ON COMPACT STAGE (300-340px)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!visible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      const width = canvas.clientWidth || 320;
      const height = canvas.clientHeight || 340;

      // 1. Transparent Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // 2. Camera framing character from head (y=1.34) to feet (y=0)
      const camera = new THREE.PerspectiveCamera(27, width / height, 0.1, 50);
      camera.position.set(0, 0.65, 3.1);
      cameraRef.current = camera;

      // 3. WebGL Renderer with Alpha: true
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'default',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      rendererRef.current = renderer;

      // 4. Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambientLight);

      const mainKeyLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
      mainKeyLight.position.set(2, 3, 3);
      scene.add(mainKeyLight);

      const rimLight = new THREE.DirectionalLight(0x00f0ff, 2.4);
      rimLight.position.set(-2, 2, -2);
      scene.add(rimLight);

      const goldFillLight = new THREE.PointLight(0xf59e0b, 1.8, 8);
      goldFillLight.position.set(0.5, 0.8, 1.5);
      scene.add(goldFillLight);

      // 5. Procedural Articulated Mascot Rig
      const rig = createProceduralMascotRig();
      rig.root.position.set(mascotPosRef.current.x, mascotPosRef.current.y, mascotPosRef.current.z);
      rig.root.rotation.y = -0.22; // Natural angle towards user
      scene.add(rig.root);
      rigRef.current = rig;

      // 6. Handle Resizing
      const handleResize = () => {
        if (!canvas || !rendererRef.current || !cameraRef.current) return;
        const w = canvas.clientWidth || 320;
        const h = canvas.clientHeight || 340;
        if (w === 0 || h === 0) return;

        cameraRef.current.aspect = w / h;
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

        // Smooth horizontal walk interpolation (entering / holding / exiting)
        const currentPos = mascotPosRef.current;
        const targetX = targetXRef.current;
        currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetX, isWalkingRef.current ? 0.09 : 0.04);
        rigRef.current.root.position.x = currentPos.x;

        // Update Kinematic Articulated Pose
        const currentReaction = activeReactionRef.current;
        if (currentReaction) {
          rigRef.current.updatePose(
            currentReaction.pose,
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
        if (rigRef.current) {
          try {
            rigRef.current.dispose();
          } catch {
            // ignore
          }
          rigRef.current = null;
        }
        if (rendererRef.current) {
          try {
            rendererRef.current.dispose();
          } catch {
            // ignore
          }
          rendererRef.current = null;
        }
      };
    } catch (err) {
      console.warn('[AuctionMascotOverlay] WebGL fallback activated:', err);
      setWebglSupported(false);
    }
  }, [visible]);

  // --------------------------------------------------------------------------
  // STATE MACHINE & REACTION SEQUENCE
  // --------------------------------------------------------------------------
  const startReactionSequence = useCallback(
    (eventData: MascotEventData) => {
      isAnimatingRef.current = true;
      setCurrentEvent(eventData);
      setVisible(true);

      // Pick next dynamic reaction variation (history-aware, never repeat consecutively)
      const reaction =
        eventData.type === 'sold'
          ? MascotReactionEngine.getNextSoldReaction()
          : MascotReactionEngine.getNextUnsoldReaction();

      setActiveReaction(reaction);
      setMascotState('entering');

      // 1. Enter from right edge
      mascotPosRef.current.x = 2.2;
      targetXRef.current = 0.0;
      isWalkingRef.current = true;

      // Confetti burst on sold
      if (eventData.type === 'sold') {
        triggerCelebrationParticles(reaction.pose.particleIntensity);
      }

      if (stateTimeoutRef.current) clearTimeout(stateTimeoutRef.current);

      // 2. Stop and perform reaction pose
      stateTimeoutRef.current = setTimeout(() => {
        isWalkingRef.current = false;
        setMascotState('reacting');

        // 3. Hold pose and message
        stateTimeoutRef.current = setTimeout(() => {
          setMascotState('holding');

          // 4. Smooth exit
          stateTimeoutRef.current = setTimeout(() => {
            setMascotState('exiting');
            isWalkingRef.current = true;
            targetXRef.current = 2.4; // Steps off to the right

            // 5. Complete and cleanup
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
            }, 1000);
          }, 4200); // Hold time
        }, 600);
      }, 1200); // Entrance duration
    },
    [onDismiss, triggerCelebrationParticles]
  );

  // Handle incoming event prop with deduplication
  useEffect(() => {
    if (!event) return;

    const eventId =
      event.id ||
      `${event.type}-${event.player}-${event.team || 'noteam'}-${event.price || 0}-${event.timestamp || Math.floor(Date.now() / 3000)}`;

    if (!MascotReactionEngine.isNewEvent(eventId, 10000)) {
      return;
    }

    if (isAnimatingRef.current) {
      eventQueueRef.current.push(event);
    } else {
      startReactionSequence(event);
    }
  }, [event, startReactionSequence]);

  // Dismiss overlay manually
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
  const teamNameString = String(currentEvent.team || '').trim();
  const playerNameString = String(currentEvent.player || 'Player').trim();
  const priceFormatted = currentEvent.price !== undefined 
    ? Number(currentEvent.price).toLocaleString('en-IN')
    : null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40 pointer-events-none flex flex-col items-end gap-2.5 max-w-[92vw]"
      aria-live="polite"
    >
      {/* ------------------------------------------------------------------- */}
      {/* 1. COMPACT RESULT NOTIFICATION BANNER (Positioned Directly Adjacent) */}
      {/* ------------------------------------------------------------------- */}
      <div
        className={`transition-all duration-500 transform pointer-events-auto w-[290px] sm:w-[340px] ${
          mascotState === 'entering'
            ? 'opacity-0 translate-x-10 scale-95'
            : mascotState === 'exiting'
            ? 'opacity-0 translate-x-12 scale-95'
            : 'opacity-100 translate-x-0 scale-100'
        }`}
      >
        <div
          className={`relative rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl border transition-all ${
            isSold
              ? 'bg-[#041a17]/95 border-emerald-400/80 shadow-[0_10px_35px_rgba(16,185,129,0.35)]'
              : 'bg-[#180911]/95 border-red-500/80 shadow-[0_10px_35px_rgba(239,68,68,0.3)]'
          }`}
        >
          {/* Subtle Close Button */}
          <button
            onClick={handleManualClose}
            className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
            title="Dismiss mascot notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-start gap-3">
            {/* Status Icon Badge */}
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md mt-0.5 ${
                isSold
                  ? 'bg-gradient-to-tr from-emerald-500 to-amber-400 text-cricket-dark'
                  : 'bg-gradient-to-tr from-red-600 to-rose-400 text-white'
              }`}
            >
              {isSold ? (
                <Trophy className="w-5 h-5 animate-pulse" />
              ) : (
                <HeartCrack className="w-5 h-5 animate-pulse" />
              )}
            </div>

            {/* Marquee & Message Typography */}
            <div className="space-y-0.5 min-w-0 flex-1 pr-4">
              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    isSold
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-red-500/20 text-red-300 border-red-400/40'
                  }`}
                >
                  {isSold ? 'PLAYER SOLD' : 'PLAYER UNSOLD'}
                </span>

                {activeReaction && (
                  <span className="text-[9px] text-gray-400 font-mono truncate">
                    • {activeReaction.name}
                  </span>
                )}
              </div>

              {/* Main Headline */}
              <h4 className="font-display font-black text-sm sm:text-base text-white tracking-wide leading-tight drop-shadow">
                {isSold ? (
                  teamNameString && teamNameString !== 'Franchise' ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-yellow-200 to-emerald-400">
                      WELCOME TO TEAM {teamNameString.toUpperCase()}!
                    </span>
                  ) : (
                    <span>WELCOME TO THE TEAM!</span>
                  )
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-200 to-red-400">
                    BETTER LUCK NEXT TIME!
                  </span>
                )}
              </h4>

              {/* Player Name and Sold Price */}
              <p className="text-xs text-gray-200 font-medium truncate flex items-center gap-1.5 pt-0.5">
                <span className="font-bold text-white">{playerNameString}</span>
                {priceFormatted && isSold && (
                  <>
                    <span className="text-cricket-gold font-bold">
                      • ₹{priceFormatted}
                    </span>
                  </>
                )}
                {!isSold && (
                  <span className="text-[10px] text-red-300">
                    • Enters Unsold Pool
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. COMPACT MASCOT STAGE (30-35% Viewport Height, ~300-340px) */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative w-[260px] sm:w-[320px] h-[280px] sm:h-[340px] pointer-events-none flex items-end justify-center">
        {/* Soft Radial Stadium Ground Reflection */}
        <div
          className={`absolute bottom-0 w-44 h-16 rounded-full blur-xl pointer-events-none transition-opacity duration-700 ${
            isSold
              ? 'bg-emerald-400/25'
              : 'bg-red-500/20'
          }`}
        />

        {webglSupported ? (
          <canvas
            ref={canvasRef}
            className="w-full h-full pointer-events-none block"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          /* High-Fidelity 2D SVG Mascot Fallback (Exact Matching Scale) */
          <div className="relative w-44 h-56 sm:w-52 sm:h-64 filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)] flex items-end justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <radialGradient id="fbHead2" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFF3C4" />
                  <stop offset="65%" stopColor="#FDE68A" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </radialGradient>
                <radialGradient id="fbCap2" cx="40%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="60%" stopColor="#1D4ED8" />
                  <stop offset="100%" stopColor="#0F172A" />
                </radialGradient>
                <linearGradient id="fbBat2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>

              {/* Legs with Batting Pads */}
              <rect x="75" y="132" width="18" height="46" rx="6" fill="#F8FAFC" stroke="#0284C7" strokeWidth="2" />
              <rect x="107" y="132" width="18" height="46" rx="6" fill="#F8FAFC" stroke="#0284C7" strokeWidth="2" />
              <rect x="73" y="148" width="22" height="6" rx="2" fill="#F59E0B" />
              <rect x="105" y="148" width="22" height="6" rx="2" fill="#F59E0B" />

              {/* CricPlus Royal Blue Jersey */}
              <path d="M 68 85 L 132 85 L 126 132 L 74 132 Z" fill="url(#fbCap2)" />
              <circle cx="100" cy="100" r="14" fill="#F59E0B" opacity="0.3" />
              <text x="100" y="104" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">CRICPLUS</text>

              {/* Head */}
              <ellipse cx="100" cy="65" rx="26" ry="25" fill="url(#fbHead2)" />
              <circle cx="84" cy="74" r="4.5" fill="#F472B6" opacity="0.6" />
              <circle cx="116" cy="74" r="4.5" fill="#F472B6" opacity="0.6" />

              {/* Eyes */}
              <ellipse cx="89" cy="63" rx="4" ry="5.5" fill="#0F172A" />
              <circle cx="87.5" cy="61" r="1.3" fill="#FFFFFF" />
              <ellipse cx="111" cy="63" rx="4" ry="5.5" fill="#0F172A" />
              <circle cx="109.5" cy="61" r="1.3" fill="#FFFFFF" />

              {/* Mouth */}
              {isSold ? (
                <path d="M 92 73 Q 100 84 108 73 Z" fill="#991B1B" />
              ) : (
                <path d="M 93 77 Q 100 70 107 77" stroke="#991B1B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              )}

              {/* Cap with Visor */}
              <path d="M 70 54 Q 100 24 130 54 Z" fill="url(#fbCap2)" />
              <path d="M 66 55 Q 100 50 138 57" stroke="#0F172A" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <circle cx="100" cy="42" r="4" fill="#F59E0B" />

              {/* Arms & Bat */}
              {isSold ? (
                <>
                  <rect x="125" y="45" width="8" height="50" rx="3" fill="url(#fbBat2)" transform="rotate(22 125 45)" />
                  <circle cx="136" cy="98" r="7" fill="#FFFFFF" />
                  <circle cx="64" cy="95" r="7" fill="#FFFFFF" />
                </>
              ) : (
                <>
                  <rect x="120" y="88" width="7" height="50" rx="3" fill="url(#fbBat2)" transform="rotate(45 120 88)" />
                  <circle cx="122" cy="95" r="7" fill="#FFFFFF" />
                  <circle cx="78" cy="98" r="7" fill="#FFFFFF" />
                </>
              )}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
