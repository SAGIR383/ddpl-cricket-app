'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  HeartCrack, 
  Sparkles, 
  X
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

  // Centered stage kinematics
  const mascotPosRef = useRef({ x: 0.0, y: 0.0, z: 0 });
  const walkProgressRef = useRef(0);
  const isWalkingRef = useRef(false);

  // --------------------------------------------------------------------------
  // TASTEFUL PARTICLES ON SOLD
  // --------------------------------------------------------------------------
  const triggerCelebrationParticles = useCallback((intensity: 'high' | 'medium' | 'subtle') => {
    if (intensity === 'subtle') return;

    try {
      // Centered golden-green celebration burst
      confetti({
        particleCount: intensity === 'high' ? 80 : 50,
        spread: 80,
        origin: { x: 0.5, y: 0.52 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#FFD700', '#FF6600'],
        disableForReducedMotion: true,
        zIndex: 9999,
      });

      const t1 = setTimeout(() => {
        try {
          confetti({
            particleCount: intensity === 'high' ? 50 : 30,
            angle: 90,
            spread: 70,
            origin: { x: 0.5, y: 0.58 },
            colors: ['#F59E0B', '#10B981', '#FF6600'],
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
  // INITIALIZE THREE.JS ON CENTERED STAGE (280-340px)
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

      // 2. Camera framing character from head (y=1.34) down to feet (y=0)
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

      // 4. Studio Lighting tailored for stadium character depth
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambientLight);

      const mainKeyLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
      mainKeyLight.position.set(2, 3, 3);
      scene.add(mainKeyLight);

      const rimLight = new THREE.DirectionalLight(0x00f0ff, 2.4);
      rimLight.position.set(-2, 2, -2);
      scene.add(rimLight);

      const orangeRimLight = new THREE.DirectionalLight(0xff6600, 1.8);
      orangeRimLight.position.set(2, 1, -2);
      scene.add(orangeRimLight);

      const goldFillLight = new THREE.PointLight(0xf59e0b, 1.6, 8);
      goldFillLight.position.set(0.5, 0.8, 1.5);
      scene.add(goldFillLight);

      // 5. Procedural Articulated Mascot Rig
      const rig = createProceduralMascotRig();
      rig.root.position.set(0, 0, 0);
      rig.root.rotation.y = -0.15; // Natural 3/4 front angle
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
      isWalkingRef.current = true;

      // Confetti burst on sold
      if (eventData.type === 'sold') {
        triggerCelebrationParticles(reaction.pose.particleIntensity);
      }

      if (stateTimeoutRef.current) clearTimeout(stateTimeoutRef.current);

      // Transition smoothly into center reaction pose
      stateTimeoutRef.current = setTimeout(() => {
        isWalkingRef.current = false;
        setMascotState('reacting');

        // Hold reaction pose and result message in center
        stateTimeoutRef.current = setTimeout(() => {
          setMascotState('holding');

          // Smooth fade-out and exit
          stateTimeoutRef.current = setTimeout(() => {
            setMascotState('exiting');

            // Complete cleanup
            stateTimeoutRef.current = setTimeout(() => {
              setVisible(false);
              setMascotState('idle');
              setActiveReaction(null);
              setCurrentEvent(null);
              isAnimatingRef.current = false;

              // Process any queued events
              if (eventQueueRef.current.length > 0) {
                const nextEvent = eventQueueRef.current.shift();
                if (nextEvent) {
                  setTimeout(() => startReactionSequence(nextEvent), 250);
                }
              } else if (onDismiss) {
                onDismiss();
              }
            }, 700);
          }, 3800); // Hold celebration in center for 3.8s
        }, 500);
      }, 700); // Entrance transition
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
      style={{
        position: 'fixed',
        top: '52%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      className={`z-40 pointer-events-none flex flex-col items-center justify-center transition-all duration-500 ${
        mascotState === 'entering'
          ? 'opacity-0 scale-90 -translate-y-[45%]'
          : mascotState === 'exiting'
          ? 'opacity-0 scale-90 -translate-y-[48%]'
          : 'opacity-100 scale-100'
      }`}
      aria-live="polite"
    >
      {/* ------------------------------------------------------------------- */}
      {/* 1. COMPACT RESULT NOTIFICATION BANNER (Centered Above Mascot) */}
      {/* ------------------------------------------------------------------- */}
      <div className="w-[300px] sm:w-[350px] pointer-events-auto mb-2 animate-fade-in">
        <div
          className={`relative rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl border transition-all ${
            isSold
              ? 'bg-[#041a17]/95 border-emerald-400/90 shadow-[0_12px_40px_rgba(16,185,129,0.45)]'
              : 'bg-[#180911]/95 border-red-500/90 shadow-[0_12px_40px_rgba(239,68,68,0.4)]'
          }`}
        >
          {/* Close Button */}
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
            <div className="space-y-0.5 min-w-0 flex-1 pr-3">
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
                      ★ WELCOME TO TEAM {teamNameString.toUpperCase()}! ★
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
      {/* 2. MEDIUM-SIZED CENTERED MASCOT STAGE (280-340px, min(40vh, 340px)) */}
      {/* ------------------------------------------------------------------- */}
      <div 
        style={{
          height: 'min(40vh, 340px)',
          width: 'min(85vw, 320px)',
        }}
        className="relative pointer-events-none flex items-end justify-center"
      >
        {/* Soft Radial Stadium Ground Reflection */}
        <div
          className={`absolute bottom-0 w-48 h-14 rounded-full blur-xl pointer-events-none transition-opacity duration-700 ${
            isSold ? 'bg-emerald-400/30' : 'bg-red-500/25'
          }`}
        />

        {webglSupported ? (
          <canvas
            ref={canvasRef}
            className="w-full h-full pointer-events-none block"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          /* High-Fidelity 2D SVG Mascot Fallback (Blue & Orange CricPlus Kit) */
          <div className="relative w-44 h-56 sm:w-52 sm:h-64 filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)] flex items-end justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <radialGradient id="fbHead3" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFF3C4" />
                  <stop offset="65%" stopColor="#FDE68A" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </radialGradient>
                <radialGradient id="fbCap3" cx="40%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="60%" stopColor="#1D4ED8" />
                  <stop offset="100%" stopColor="#0F172A" />
                </radialGradient>
                <linearGradient id="fbBat3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>

              {/* Legs with Batting Pads & Orange Knee Rolls */}
              <rect x="75" y="132" width="18" height="46" rx="6" fill="#F8FAFC" stroke="#0284C7" strokeWidth="2" />
              <rect x="107" y="132" width="18" height="46" rx="6" fill="#F8FAFC" stroke="#0284C7" strokeWidth="2" />
              <rect x="73" y="148" width="22" height="6" rx="2" fill="#FF6600" />
              <rect x="105" y="148" width="22" height="6" rx="2" fill="#FF6600" />

              {/* Blue & Orange CricPlus Jersey */}
              <path d="M 68 85 L 132 85 L 126 132 L 74 132 Z" fill="url(#fbCap3)" />
              <path d="M 85 85 L 100 102 L 115 85 Z" fill="#FF6600" />
              <text x="100" y="118" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">CRICPLUS</text>

              {/* Head */}
              <ellipse cx="100" cy="65" rx="26" ry="25" fill="url(#fbHead3)" />
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

              {/* Cap with Visor & Orange Crest */}
              <path d="M 70 54 Q 100 24 130 54 Z" fill="url(#fbCap3)" />
              <path d="M 66 55 Q 100 50 138 57" stroke="#0F172A" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <circle cx="100" cy="42" r="4.5" fill="#FF6600" />

              {/* Arms & Bat */}
              {isSold ? (
                <>
                  <rect x="125" y="45" width="8" height="50" rx="3" fill="url(#fbBat3)" transform="rotate(22 125 45)" />
                  <circle cx="136" cy="98" r="7" fill="#FFFFFF" />
                  <circle cx="64" cy="95" r="7" fill="#FFFFFF" />
                </>
              ) : (
                <>
                  <rect x="120" y="88" width="7" height="50" rx="3" fill="url(#fbBat3)" transform="rotate(45 120 88)" />
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
