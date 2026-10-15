/**
 * CricPlus 3D Live Auction Mascot Reaction Engine
 * 
 * Manages 12 SOLD + 12 UNSOLD distinct animations, history-aware
 * shuffled selection, state transitions, and event deduplication.
 */

export type MascotState = 'idle' | 'entering' | 'reacting' | 'holding' | 'exiting';

export interface ReactionConfig {
  id: string;
  category: 'sold' | 'unsold';
  name: string;
  clipName: string;
  tagline: string;
  description: string;
  // Procedural 3D Joint Pose targets for articulated Three.js skeleton
  pose: {
    headTiltY: number;      // Turn left/right
    headTiltX: number;      // Nod up/down
    headTiltZ: number;      // Tilt sideways
    bodyTiltY: number;      // Body twist
    bodyTiltX: number;      // Lean forward/back
    leftArmPitch: number;   // Left shoulder forward/back
    leftArmRoll: number;    // Left shoulder outward
    leftForearm: number;    // Left elbow bend
    rightArmPitch: number;  // Right shoulder forward/back
    rightArmRoll: number;   // Right shoulder outward
    rightForearm: number;   // Right elbow bend
    batAngleZ: number;      // Bat tilt in hand
    batAngleX: number;      // Bat rotation
    leftLegPitch: number;   // Left hip
    rightLegPitch: number;  // Right hip
    bounceSpeed: number;    // Idle bounce frequency
    bounceHeight: number;   // Idle jump/bob amplitude
    expression: 'smile' | 'laugh' | 'hero' | 'sad' | 'downcast' | 'sigh' | 'shock';
    showTrophy?: boolean;
    showBrokenHeart?: boolean;
    particleIntensity: 'high' | 'medium' | 'subtle';
  };
}

export const SOLD_REACTIONS: ReactionConfig[] = [
  {
    id: 'sold-thumbs-up',
    category: 'sold',
    name: 'Thumbs-Up Welcome',
    clipName: 'Sold_ThumbsUp',
    tagline: 'PLAYER ACQUIRED! THUMBS UP!',
    description: 'Enthusiastic entrance with right-hand thumbs-up gesture and beaming smile',
    pose: {
      headTiltY: -0.15,
      headTiltX: -0.1,
      headTiltZ: 0.05,
      bodyTiltY: -0.1,
      bodyTiltX: -0.05,
      leftArmPitch: 0.2,
      leftArmRoll: 0.4,
      leftForearm: 0.6,
      rightArmPitch: 0.8,
      rightArmRoll: 0.7,
      rightForearm: 1.5, // Hand up giving thumbs up
      batAngleZ: 0.4,
      batAngleX: 0.2,
      leftLegPitch: 0.05,
      rightLegPitch: -0.05,
      bounceSpeed: 4.5,
      bounceHeight: 0.12,
      expression: 'smile',
      particleIntensity: 'high',
    },
  },
  {
    id: 'sold-victory-jump',
    category: 'sold',
    name: 'Excited Victory Jump',
    clipName: 'Sold_VictoryJump',
    tagline: 'MASSIVE BID WIN! VICTORY JUMP!',
    description: 'Running entrance with high-energy vertical leap and bat held high',
    pose: {
      headTiltY: 0,
      headTiltX: -0.3, // Looking up triumphantly
      headTiltZ: 0,
      bodyTiltY: 0,
      bodyTiltX: -0.15,
      leftArmPitch: 1.4,
      leftArmRoll: 0.8,
      leftForearm: 0.4,
      rightArmPitch: 1.8, // Bat thrust straight up
      rightArmRoll: 0.5,
      rightForearm: 0.2,
      batAngleZ: 0.1,
      batAngleX: 0.0,
      leftLegPitch: -0.4, // Jump tuck
      rightLegPitch: -0.3,
      bounceSpeed: 6.0,
      bounceHeight: 0.35,
      expression: 'laugh',
      particleIntensity: 'high',
    },
  },
  {
    id: 'sold-hero-walk',
    category: 'sold',
    name: 'Hero Walk with Bat on Shoulder',
    clipName: 'Sold_HeroWalk',
    tagline: 'BIG MATCH WINNER JOINS SQUAD!',
    description: 'Confident hero swagger with cricket bat casually resting across shoulder',
    pose: {
      headTiltY: -0.2,
      headTiltX: -0.05,
      headTiltZ: -0.1,
      bodyTiltY: -0.25,
      bodyTiltX: -0.08,
      leftArmPitch: 0.1,
      leftArmRoll: 0.3,
      leftForearm: 0.3,
      rightArmPitch: 1.2,
      rightArmRoll: 0.6,
      rightForearm: 2.1, // Hand resting over shoulder
      batAngleZ: -1.2,   // Bat resting back
      batAngleX: 0.4,
      leftLegPitch: 0.1,
      rightLegPitch: -0.1,
      bounceSpeed: 3.2,
      bounceHeight: 0.08,
      expression: 'hero',
      particleIntensity: 'medium',
    },
  },
  {
    id: 'sold-happy-clapping',
    category: 'sold',
    name: 'Happy Clapping',
    clipName: 'Sold_HappyClapping',
    tagline: 'FANTASTIC SIGNING! APPLAUSE!',
    description: 'Bouncy energetic stance clapping gloved hands together in celebration',
    pose: {
      headTiltY: 0.0,
      headTiltX: 0.0,
      headTiltZ: 0.0,
      bodyTiltY: 0.0,
      bodyTiltX: 0.05,
      leftArmPitch: 0.8,
      leftArmRoll: -0.3,
      leftForearm: 1.6,
      rightArmPitch: 0.8,
      rightArmRoll: -0.3,
      rightForearm: 1.6,
      batAngleZ: 0.2,
      batAngleX: 0.1,
      leftLegPitch: 0.0,
      rightLegPitch: 0.0,
      bounceSpeed: 5.5,
      bounceHeight: 0.15,
      expression: 'smile',
      particleIntensity: 'high',
    },
  },
  {
    id: 'sold-victory-dance',
    category: 'sold',
    name: 'Playful Victory Dance',
    clipName: 'Sold_VictoryDance',
    tagline: 'CHAMPION ENERGY! CELEBRATION DANCE!',
    description: 'Playful side-to-side rhythmic shuffle with bat pumping to the beat',
    pose: {
      headTiltY: 0.25,
      headTiltX: -0.1,
      headTiltZ: 0.2,
      bodyTiltY: 0.3,
      bodyTiltX: 0.0,
      leftArmPitch: 0.6,
      leftArmRoll: 0.9,
      leftForearm: 0.8,
      rightArmPitch: 1.1,
      rightArmRoll: 0.8,
      rightForearm: 1.0,
      batAngleZ: 0.6,
      batAngleX: -0.3,
      leftLegPitch: 0.3,
      rightLegPitch: -0.3,
      bounceSpeed: 5.8,
      bounceHeight: 0.2,
      expression: 'laugh',
      particleIntensity: 'high',
    },
  },
  {
    id: 'sold-both-arms-raised',
    category: 'sold',
    name: 'Both Arms Raised Triumph',
    clipName: 'Sold_BothArmsRaised',
    tagline: 'WHAT A DEAL! ARMS IN THE AIR!',
    description: 'Double arms hoisted skyward in classic international cricket victory pose',
    pose: {
      headTiltY: 0.0,
      headTiltX: -0.25,
      headTiltZ: 0.0,
      bodyTiltY: 0.0,
      bodyTiltX: -0.1,
      leftArmPitch: 1.7,
      leftArmRoll: 0.7,
      leftForearm: 0.3,
      rightArmPitch: 1.7,
      rightArmRoll: 0.7,
      rightForearm: 0.3,
      batAngleZ: 0.3,
      batAngleX: 0.1,
      leftLegPitch: 0.1,
      rightLegPitch: 0.1,
      bounceSpeed: 4.0,
      bounceHeight: 0.14,
      expression: 'laugh',
      particleIntensity: 'high',
    },
  },
  {
    id: 'sold-bat-twirl',
    category: 'sold',
    name: 'Bat Twirl Flourish',
    clipName: 'Sold_BatTwirl',
    tagline: 'MASTERSTROKE BID! BAT TWIRL!',
    description: 'Expertly spins the cricket willow in gloved hand and poses ready to strike',
    pose: {
      headTiltY: -0.15,
      headTiltX: 0.05,
      headTiltZ: -0.05,
      bodyTiltY: -0.15,
      bodyTiltX: 0.05,
      leftArmPitch: 0.3,
      leftArmRoll: 0.4,
      leftForearm: 0.7,
      rightArmPitch: 0.9,
      rightArmRoll: 0.5,
      rightForearm: 1.2,
      batAngleZ: 1.8, // Tilted forward twirl position
      batAngleX: 0.8,
      leftLegPitch: 0.15,
      rightLegPitch: -0.1,
      bounceSpeed: 4.2,
      bounceHeight: 0.1,
      expression: 'hero',
      particleIntensity: 'medium',
    },
  },
  {
    id: 'sold-victory-salute',
    category: 'sold',
    name: 'Respectful Victory Salute',
    clipName: 'Sold_VictorySalute',
    tagline: 'OFFICIAL WELCOME! SQUAD SALUTE!',
    description: 'Formal cricketer raise of the bat toward team dugout in gratitude',
    pose: {
      headTiltY: 0.05,
      headTiltX: -0.1,
      headTiltZ: 0.0,
      bodyTiltY: 0.05,
      bodyTiltX: -0.05,
      leftArmPitch: -0.1,
      leftArmRoll: 0.2,
      leftForearm: 0.3, // Hand at side / chest
      rightArmPitch: 1.3,
      rightArmRoll: 0.3,
      rightForearm: 0.5, // Raised bat salute
      batAngleZ: 0.1,
      batAngleX: 0.0,
      leftLegPitch: 0.0,
      rightLegPitch: 0.0,
      bounceSpeed: 3.0,
      bounceHeight: 0.06,
      expression: 'smile',
      particleIntensity: 'medium',
    },
  },
  {
    id: 'sold-fist-pump',
    category: 'sold',
    name: 'Fierce Fist Pump',
    clipName: 'Sold_FistPump',
    tagline: 'BOOM! SENSATIONAL PICKUP!',
    description: 'Dynamic double fist pump with gloved hand while swinging bat forward',
    pose: {
      headTiltY: -0.2,
      headTiltX: -0.15,
      headTiltZ: 0.1,
      bodyTiltY: -0.2,
      bodyTiltX: 0.1,
      leftArmPitch: 1.2,
      leftArmRoll: 0.4,
      leftForearm: 1.8, // Pumping fist
      rightArmPitch: 0.5,
      rightArmRoll: 0.6,
      rightForearm: 0.8,
      batAngleZ: 0.4,
      batAngleX: 0.3,
      leftLegPitch: -0.2,
      rightLegPitch: 0.2,
      bounceSpeed: 5.2,
      bounceHeight: 0.18,
      expression: 'laugh',
      particleIntensity: 'high',
    },
  },
  {
    id: 'sold-welcome-wave',
    category: 'sold',
    name: 'Warm Welcome Wave',
    clipName: 'Sold_WelcomeWave',
    tagline: 'WARMLY WELCOMING NEW TEAMMATE!',
    description: 'Friendly, warm wave with bat grounded in a show of clubhouse camaraderie',
    pose: {
      headTiltY: 0.1,
      headTiltX: -0.05,
      headTiltZ: 0.1,
      bodyTiltY: 0.05,
      bodyTiltX: 0.0,
      leftArmPitch: 1.1,
      leftArmRoll: 0.6,
      leftForearm: 1.4, // Waving hand
      rightArmPitch: 0.2,
      rightArmRoll: 0.3,
      rightForearm: 0.4, // Holding bat resting down
      batAngleZ: -0.2,
      batAngleX: 0.0,
      leftLegPitch: 0.0,
      rightLegPitch: 0.0,
      bounceSpeed: 3.8,
      bounceHeight: 0.1,
      expression: 'smile',
      particleIntensity: 'medium',
    },
  },
  {
    id: 'sold-victory-spin',
    category: 'sold',
    name: '360° Victory Spin',
    clipName: 'Sold_VictorySpin',
    tagline: 'PURE CELEBRATION! VICTORY PIRUETTE!',
    description: 'Smooth 360-degree twirl on batting spikes ending in power stance',
    pose: {
      headTiltY: 0.0,
      headTiltX: -0.1,
      headTiltZ: 0.0,
      bodyTiltY: 0.0, // Rotated continuously in Three.js renderer
      bodyTiltX: -0.05,
      leftArmPitch: 0.8,
      leftArmRoll: 0.9,
      leftForearm: 0.5,
      rightArmPitch: 0.9,
      rightArmRoll: 0.9,
      rightForearm: 0.5,
      batAngleZ: 0.5,
      batAngleX: 0.2,
      leftLegPitch: 0.1,
      rightLegPitch: -0.1,
      bounceSpeed: 6.2,
      bounceHeight: 0.22,
      expression: 'laugh',
      particleIntensity: 'high',
    },
  },
  {
    id: 'sold-trophy-celebration',
    category: 'sold',
    name: 'Golden Championship Trophy',
    clipName: 'Sold_TrophyCelebration',
    tagline: 'CHAMPIONS IN THE MAKING! GOLDEN TROPHY!',
    description: 'Mascot hoists gleaming 3D golden championship cup in both hands',
    pose: {
      headTiltY: 0.0,
      headTiltX: -0.2,
      headTiltZ: 0.0,
      bodyTiltY: 0.0,
      bodyTiltX: -0.08,
      leftArmPitch: 1.3,
      leftArmRoll: 0.3,
      leftForearm: 1.2,
      rightArmPitch: 1.3,
      rightArmRoll: 0.3,
      rightForearm: 1.2,
      batAngleZ: -0.8, // Bat strapped to side/back
      batAngleX: 0.0,
      leftLegPitch: 0.05,
      rightLegPitch: -0.05,
      bounceSpeed: 4.2,
      bounceHeight: 0.16,
      expression: 'laugh',
      showTrophy: true,
      particleIntensity: 'high',
    },
  },
];

export const UNSOLD_REACTIONS: ReactionConfig[] = [
  {
    id: 'unsold-sad-walk-head-down',
    category: 'unsold',
    name: 'Slow Sad Walk with Head Down',
    clipName: 'Unsold_SadWalk',
    tagline: 'NOT THIS TIME! COMING BACK STRONGER!',
    description: 'Slow mournful walk with chin resting against chest and bat trailing behind',
    pose: {
      headTiltY: 0.0,
      headTiltX: 0.45, // Head tilted down
      headTiltZ: 0.05,
      bodyTiltY: 0.05,
      bodyTiltX: 0.25, // Shoulders slumped forward
      leftArmPitch: -0.1,
      leftArmRoll: 0.15,
      leftForearm: 0.2,
      rightArmPitch: -0.2,
      rightArmRoll: 0.2,
      rightForearm: 0.2, // Arms limp
      batAngleZ: -0.6,
      batAngleX: 0.1,
      leftLegPitch: 0.1,
      rightLegPitch: -0.1,
      bounceSpeed: 1.8,
      bounceHeight: 0.03,
      expression: 'sad',
      showBrokenHeart: true,
      particleIntensity: 'subtle',
    },
  },
  {
    id: 'unsold-disappointed-sit',
    category: 'unsold',
    name: 'Disappointed Dugout Sit',
    clipName: 'Unsold_DisappointedSit',
    tagline: 'REST & RESET! ROUND 2 COMING UP!',
    description: 'Sits gently on the pitch turf, elbows on knees in thoughtful reflection',
    pose: {
      headTiltY: 0.0,
      headTiltX: 0.5,
      headTiltZ: 0.0,
      bodyTiltY: 0.0,
      bodyTiltX: 0.4,
      leftArmPitch: 0.8,
      leftArmRoll: 0.2,
      leftForearm: 1.4,
      rightArmPitch: 0.8,
      rightArmRoll: 0.2,
      rightForearm: 1.4,
      batAngleZ: 0.0,
      batAngleX: 0.0,
      leftLegPitch: 1.2, // Sitting posture
      rightLegPitch: 1.2,
      bounceSpeed: 1.2,
      bounceHeight: 0.01,
      expression: 'downcast',
      showBrokenHeart: true,
      particleIntensity: 'subtle',
    },
  },
  {
    id: 'unsold-gentle-head-shake',
    category: 'unsold',
    name: 'Gentle Disbelief Head Shake',
    clipName: 'Unsold_HeadShake',
    tagline: 'SHOCK PASSED LOT! SECOND ROUND RE-ENTRY!',
    description: 'Pauses at crease line and shakes head slowly in soft disbelief',
    pose: {
      headTiltY: 0.35, // Shakes back and forth
      headTiltX: 0.2,
      headTiltZ: 0.1,
      bodyTiltY: 0.1,
      bodyTiltX: 0.15,
      leftArmPitch: 0.3,
      leftArmRoll: 0.3,
      leftForearm: 0.5,
      rightArmPitch: 0.3,
      rightArmRoll: 0.3,
      rightForearm: 0.5,
      batAngleZ: -0.2,
      batAngleX: 0.0,
      leftLegPitch: 0.0,
      rightLegPitch: 0.0,
      bounceSpeed: 2.0,
      bounceHeight: 0.04,
      expression: 'shock',
      showBrokenHeart: true,
      particleIntensity: 'subtle',
    },
  },
  {
    id: 'unsold-wipe-tear',
    category: 'unsold',
    name: 'Wiping a Brave Tear',
    clipName: 'Unsold_WipeTear',
    tagline: 'HEAD HELD HIGH! KEEP THE PASSION ALIVE!',
    description: 'Uses edge of white batting glove to gently brush cheek in brave disappointment',
    pose: {
      headTiltY: -0.15,
      headTiltX: 0.25,
      headTiltZ: -0.1,
      bodyTiltY: -0.1,
      bodyTiltX: 0.1,
      leftArmPitch: 1.1,
      leftArmRoll: 0.2,
      leftForearm: 1.8, // Hand near eye
      rightArmPitch: 0.1,
      rightArmRoll: 0.2,
      rightForearm: 0.3,
      batAngleZ: -0.3,
      batAngleX: 0.0,
      leftLegPitch: 0.0,
      rightLegPitch: 0.0,
      bounceSpeed: 1.8,
      bounceHeight: 0.03,
      expression: 'sad',
      showBrokenHeart: true,
      particleIntensity: 'subtle',
    },
  },
  {
    id: 'unsold-shoulder-shrug',
    category: 'unsold',
    name: 'Sympathetic Shoulder Shrug',
    clipName: 'Unsold_ShoulderShrug',
    tagline: 'AUCTION TWIST! AVAILABLE IN ACCELERATED ROUND!',
    description: 'Looks toward auctioneer table, lifts and drops shoulders with a soft shrug',
    pose: {
      headTiltY: 0.0,
      headTiltX: 0.1,
      headTiltZ: 0.08,
      bodyTiltY: 0.0,
      bodyTiltX: 0.05,
      leftArmPitch: 0.2,
      leftArmRoll: 0.6,
      leftForearm: 0.9,
      rightArmPitch: 0.2,
      rightArmRoll: 0.6,
      rightForearm: 0.9,
      batAngleZ: 0.2,
      batAngleX: 0.0,
      leftLegPitch: 0.0,
      rightLegPitch: 0.0,
      bounceSpeed: 2.4,
      bounceHeight: 0.05,
      expression: 'downcast',
      showBrokenHeart: true,
      particleIntensity: 'subtle',
    },
  },
  {
    id: 'unsold-sympathetic-wave',
    category: 'unsold',
    name: 'Sympathetic Crowd Wave',
    clipName: 'Unsold_SympatheticWave',
    tagline: 'FAN APPRECIATION! TALENT WAITING IN THE WINGS!',
    description: 'Gives an encouraging small hand wave to supporters with warm supportive look',
    pose: {
      headTiltY: 0.1,
      headTiltX: 0.05,
      headTiltZ: 0.05,
      bodyTiltY: 0.05,
      bodyTiltX: 0.02,
      leftArmPitch: 0.7,
      leftArmRoll: 0.4,
      leftForearm: 1.2, // Small wave
      rightArmPitch: 0.1,
      rightArmRoll: 0.2,
      rightForearm: 0.3,
      batAngleZ: -0.2,
      batAngleX: 0.0,
      leftLegPitch: 0.0,
      rightLegPitch: 0.0,
      bounceSpeed: 2.6,
      bounceHeight: 0.05,
      expression: 'smile',
      showBrokenHeart: false,
      particleIntensity: 'subtle',
    },
  },
  {
    id: 'unsold-slow-walk-off',
    category: 'unsold',
    name: 'Quiet Stride to Dugout',
    clipName: 'Unsold_SlowWalkOff',
    tagline: 'PAUSE FOR NOW! RE-ENTERS IN LATER ROUNDS!',
    description: 'Slow paced stroll with bat dragging gently on the ground toward pavilion',
    pose: {
      headTiltY: -0.1,
      headTiltX: 0.35,
      headTiltZ: 0.0,
      bodyTiltY: -0.15,
      bodyTiltX: 0.2,
      leftArmPitch: -0.1,
      leftArmRoll: 0.15,
      leftForearm: 0.15,
      rightArmPitch: -0.3,
      rightArmRoll: 0.15,
      rightForearm: 0.15,
      batAngleZ: -0.9, // Bat dragging back
      batAngleX: 0.0,
      leftLegPitch: 0.15,
      rightLegPitch: -0.15,
      bounceSpeed: 2.0,
      bounceHeight: 0.04,
      expression: 'downcast',
      showBrokenHeart: true,
      particleIntensity: 'subtle',
    },
  },
  {
    id: 'unsold-look-at-ground',
    category: 'unsold',
    name: 'Quiet Contemplation at Crease',
    clipName: 'Unsold_LookAtGround',
    tagline: 'EYES ON THE PRIZE! GEARING UP FOR RETRY!',
    description: 'Stops and gazes thoughtfully at the turf crease with hands resting on bat',
    pose: {
      headTiltY: 0.0,
      headTiltX: 0.55, // Looking down at floor
      headTiltZ: 0.0,
      bodyTiltY: 0.0,
      bodyTiltX: 0.25,
      leftArmPitch: 0.4,
      leftArmRoll: 0.2,
      leftForearm: 0.8,
      rightArmPitch: 0.4,
      rightArmRoll: 0.2,
      rightForearm: 0.8,
      batAngleZ: 0.0,
      batAngleX: 0.0,
      leftLegPitch: 0.0,
      rightLegPitch: 0.0,
      bounceSpeed: 1.5,
      bounceHeight: 0.02,
      expression: 'downcast',
      showBrokenHeart: true,
      particleIntensity: 'subtle',
    },
  },
  {
    id: 'unsold-shoulders-dropping',
    category: 'unsold',
    name: 'Deflating Shoulders Exhale',
    clipName: 'Unsold_ShouldersDropping',
    tagline: 'TOUGH BREAK! STILL IN THE TOURNAMENT POOL!',
    description: 'Postures slumps as chest drops in an audible breath of disappointment',
    pose: {
      headTiltY: 0.0,
      headTiltX: 0.4,
      headTiltZ: 0.05,
      bodyTiltY: 0.0,
      bodyTiltX: 0.3,
      leftArmPitch: -0.15,
      leftArmRoll: 0.1,
      leftForearm: 0.1,
      rightArmPitch: -0.15,
      rightArmRoll: 0.1,
      rightForearm: 0.1,
      batAngleZ: -0.4,
      batAngleX: 0.0,
      leftLegPitch: 0.0,
      rightLegPitch: 0.0,
      bounceSpeed: 1.8,
      bounceHeight: 0.03,
      expression: 'sigh',
      showBrokenHeart: true,
      particleIntensity: 'subtle',
    },
  },
  {
    id: 'unsold-sit-with-bat',
    category: 'unsold',
    name: 'Resting Chin on Bat Handle',
    clipName: 'Unsold_SitWithBat',
    tagline: 'PATIENCE AT THE CREASE! NEXT CHANCE AWAITS!',
    description: 'Plants bat vertically and rests chin softly atop the rubber grip',
    pose: {
      headTiltY: 0.0,
      headTiltX: 0.3,
      headTiltZ: 0.0,
      bodyTiltY: 0.0,
      bodyTiltX: 0.2,
      leftArmPitch: 0.6,
      leftArmRoll: 0.1,
      leftForearm: 1.5,
      rightArmPitch: 0.6,
      rightArmRoll: 0.1,
      rightForearm: 1.5, // Both hands atop bat
      batAngleZ: 0.0,
      batAngleX: 0.0,
      leftLegPitch: 0.0,
      rightLegPitch: 0.0,
      bounceSpeed: 1.4,
      bounceHeight: 0.02,
      expression: 'downcast',
      showBrokenHeart: true,
      particleIntensity: 'subtle',
    },
  },
  {
    id: 'unsold-gentle-sigh',
    category: 'unsold',
    name: 'Gentle Player Sigh',
    clipName: 'Unsold_GentleSigh',
    tagline: 'DEEP BREATH! READY FOR COMEBACK IN ROUND 2!',
    description: 'Deep chest inhalation followed by a slow downward sigh and bat tilt',
    pose: {
      headTiltY: 0.05,
      headTiltX: 0.3,
      headTiltZ: 0.05,
      bodyTiltY: 0.0,
      bodyTiltX: 0.15,
      leftArmPitch: 0.1,
      leftArmRoll: 0.2,
      leftForearm: 0.4,
      rightArmPitch: 0.1,
      rightArmRoll: 0.2,
      rightForearm: 0.4,
      batAngleZ: -0.3,
      batAngleX: 0.1,
      leftLegPitch: 0.0,
      rightLegPitch: 0.0,
      bounceSpeed: 1.6,
      bounceHeight: 0.03,
      expression: 'sigh',
      showBrokenHeart: true,
      particleIntensity: 'subtle',
    },
  },
  {
    id: 'unsold-regain-confidence',
    category: 'unsold',
    name: 'Regaining Confidence Fist-Clench',
    clipName: 'Unsold_RegainConfidence',
    tagline: 'WARRIOR SPIRIT! THE COMEBACK IS ALWAYS STRONGER!',
    description: 'Starts disappointed, then shakes head, clenches fist and looks determinedly ahead',
    pose: {
      headTiltY: -0.1,
      headTiltX: -0.1, // Looks back up with hope
      headTiltZ: 0.0,
      bodyTiltY: -0.05,
      bodyTiltX: -0.05,
      leftArmPitch: 0.6,
      leftArmRoll: 0.3,
      leftForearm: 1.5, // Small determined fist
      rightArmPitch: 0.3,
      rightArmRoll: 0.3,
      rightForearm: 0.6,
      batAngleZ: 0.2,
      batAngleX: 0.0,
      leftLegPitch: 0.05,
      rightLegPitch: -0.05,
      bounceSpeed: 3.5,
      bounceHeight: 0.08,
      expression: 'hero',
      showBrokenHeart: false,
      particleIntensity: 'subtle',
    },
  },
];

/**
 * Shuffled History-Aware Mascot Reaction Selection Engine
 */
class MascotReactionEngineClass {
  private soldHistory: string[] = [];
  private unsoldHistory: string[] = [];
  private soldQueue: ReactionConfig[] = [];
  private unsoldQueue: ReactionConfig[] = [];
  private lastSoldId: string | null = null;
  private lastUnsoldId: string | null = null;

  // Event deduplication cache: Key -> Timestamp
  private seenEvents = new Map<string, number>();

  constructor() {
    this.replenishSoldQueue();
    this.replenishUnsoldQueue();
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private replenishSoldQueue() {
    let pool = this.shuffle(SOLD_REACTIONS);
    // Avoid starting with the same reaction as the previous last
    if (this.lastSoldId && pool[0].id === this.lastSoldId && pool.length > 1) {
      const temp = pool[0];
      pool[0] = pool[1];
      pool[1] = temp;
    }
    this.soldQueue = pool;
  }

  private replenishUnsoldQueue() {
    let pool = this.shuffle(UNSOLD_REACTIONS);
    if (this.lastUnsoldId && pool[0].id === this.lastUnsoldId && pool.length > 1) {
      const temp = pool[0];
      pool[0] = pool[1];
      pool[1] = temp;
    }
    this.unsoldQueue = pool;
  }

  /**
   * Get next SOLD reaction ensuring no duplicate repeats across consecutive runs
   */
  public getNextSoldReaction(): ReactionConfig {
    if (this.soldQueue.length === 0) {
      this.replenishSoldQueue();
    }
    const reaction = this.soldQueue.shift() || SOLD_REACTIONS[0];
    this.lastSoldId = reaction.id;
    this.soldHistory.push(reaction.id);
    if (this.soldHistory.length > 50) this.soldHistory.shift();
    return reaction;
  }

  /**
   * Get next UNSOLD reaction ensuring no duplicate repeats across consecutive runs
   */
  public getNextUnsoldReaction(): ReactionConfig {
    if (this.unsoldQueue.length === 0) {
      this.replenishUnsoldQueue();
    }
    const reaction = this.unsoldQueue.shift() || UNSOLD_REACTIONS[0];
    this.lastUnsoldId = reaction.id;
    this.unsoldHistory.push(reaction.id);
    if (this.unsoldHistory.length > 50) this.unsoldHistory.shift();
    return reaction;
  }

  /**
   * Retrieve reaction by ID
   */
  public getReactionById(id: string): ReactionConfig | undefined {
    return (
      SOLD_REACTIONS.find((r) => r.id === id) ||
      UNSOLD_REACTIONS.find((r) => r.id === id)
    );
  }

  /**
   * Deduplicate real-time events to avoid double-triggers from React StrictMode,
   * broadcast echo, or websocket reconnection.
   * Returns true if event is NEW and should be processed.
   */
  public isNewEvent(eventId: string, ttlMs = 12000): boolean {
    const now = Date.now();
    
    // Purge expired entries
    this.seenEvents.forEach((timestamp, key) => {
      if (now - timestamp > ttlMs) {
        this.seenEvents.delete(key);
      }
    });

    if (this.seenEvents.has(eventId)) {
      return false; // Already processed
    }

    this.seenEvents.set(eventId, now);
    return true;
  }

  /**
   * Reset engine history (for testing or fresh tournament session)
   */
  public reset() {
    this.soldHistory = [];
    this.unsoldHistory = [];
    this.lastSoldId = null;
    this.lastUnsoldId = null;
    this.seenEvents.clear();
    this.replenishSoldQueue();
    this.replenishUnsoldQueue();
  }
}

// Export singleton instance
export const MascotReactionEngine = new MascotReactionEngineClass();
