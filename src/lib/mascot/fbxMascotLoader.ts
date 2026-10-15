/**
 * CricPlus FBX Mascot Loader & Animation Controller
 * 
 * Directly loads Mixamo base character and animation FBX files in Three.js:
 * - Base Character: /models/cricplus/character.fbx
 * - Animations: Walking, Victory, Waving, Defeated
 * - Compatible skeleton: mixamorig6 hierarchy
 * - Driven by Three.js AnimationMixer with cross-fading
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export interface FbxMascotInstance {
  character: THREE.Group;
  mixer: THREE.AnimationMixer;
  clips: Record<string, THREE.AnimationClip>;
  playClip: (name: string, crossfadeDuration?: number, loop?: boolean) => THREE.AnimationAction | null;
  update: (delta: number) => void;
  dispose: () => void;
}

export interface CachedMascotData {
  characterCloneSource: THREE.Group;
  clips: Record<string, THREE.AnimationClip>;
}

// In-memory cache to prevent re-fetching/re-parsing 32MB FBX repeatedly
let cachedInstanceData: CachedMascotData | null = null;
let loadingPromise: Promise<CachedMascotData> | null = null;

/**
 * Make walking clip walk in-place so the character doesn't wander off-camera
 */
function makeInPlaceWalk(clip: THREE.AnimationClip): THREE.AnimationClip {
  const cloned = clip.clone();
  cloned.tracks = cloned.tracks.map((track) => {
    if (track.name.endsWith('Hips.position')) {
      const values = new Float32Array(track.values);
      const initialZ = values[2] || 0;
      for (let i = 2; i < values.length; i += 3) {
        values[i] = initialZ;
      }
      return new THREE.VectorKeyframeTrack(track.name, Array.from(track.times), Array.from(values));
    }
    return track;
  });
  return cloned;
}

/**
 * Pre-load base character and all animation clips
 */
export async function loadFbxMascotData(): Promise<CachedMascotData> {
  if (cachedInstanceData) return cachedInstanceData;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async (): Promise<CachedMascotData> => {
    const loader = new FBXLoader();

    // 1. Load Base Character
    const character = await new Promise<THREE.Group>((resolve, reject) => {
      loader.load(
        '/models/cricplus/character.fbx',
        (fbx) => resolve(fbx),
        undefined,
        (err) => reject(err)
      );
    });

    // Scale character to ~1.28 units tall (Mixamo FBX is ~160cm)
    character.scale.setScalar(0.008);
    character.position.set(0, 0, 0);

    // Ensure shadows and materials are responsive to stadium lights
    character.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          if (mat && 'shininess' in mat) {
            (mat as THREE.MeshPhongMaterial).shininess = 25;
          }
        });
      }
    });

    // 2. Load Animation FBX Files
    const animMap: Record<string, string> = {
      Walking: '/models/cricplus/Walking.fbx',
      Victory: '/models/cricplus/Victory.fbx',
      Waving: '/models/cricplus/Waving.fbx',
      Defeated: '/models/cricplus/Defeated.fbx',
      // Bonus clips if available
      StrutWalking: '/models/cricplus/StrutWalking.fbx',
      RumbaDancing: '/models/cricplus/RumbaDancing.fbx',
      SwingDancing: '/models/cricplus/SwingDancing.fbx',
      Angry: '/models/cricplus/Angry.fbx',
    };

    const loadedClips: Record<string, THREE.AnimationClip> = {};

    await Promise.all(
      Object.entries(animMap).map(async ([name, url]) => {
        try {
          const animFbx = await new Promise<THREE.Group>((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
          });
          if (animFbx.animations && animFbx.animations.length > 0) {
            let clip = animFbx.animations[0];
            if (name === 'Walking' || name === 'StrutWalking') {
              clip = makeInPlaceWalk(clip);
            }
            clip.name = name;
            loadedClips[name] = clip;
          }
        } catch (e) {
          console.warn(`[FBXLoader] Optional animation ${name} skipped:`, e);
        }
      })
    );

    cachedInstanceData = {
      characterCloneSource: character,
      clips: loadedClips,
    };

    return cachedInstanceData;
  })();

  return loadingPromise;
}

/**
 * Instantiate an active FBX Mascot Rig with its own AnimationMixer
 */
export async function createFbxMascotInstance(): Promise<FbxMascotInstance> {
  const data = await loadFbxMascotData();
  if (!data) throw new Error('Failed to load FBX mascot data');

  // Clone character for isolated mixer bindings with proper SkinnedMesh/bones cloning
  const character = SkeletonUtils.clone(data.characterCloneSource) as THREE.Group;
  const mixer = new THREE.AnimationMixer(character);

  let currentAction: THREE.AnimationAction | null = null;
  let currentClipName: string | null = null;

  const playClip = (name: string, crossfadeDuration = 0.35, loop = true): THREE.AnimationAction | null => {
    let clip = data.clips[name];
    if (!clip) {
      // Fallback mappings
      if (name.toLowerCase().includes('walk')) clip = data.clips.Walking;
      else if (name.toLowerCase().includes('wave')) clip = data.clips.Waving;
      else if (name.toLowerCase().includes('sold') || name.toLowerCase().includes('win')) clip = data.clips.Victory;
      else clip = data.clips.Defeated || data.clips.Walking;
    }

    if (!clip) return null;
    if (currentClipName === clip.name && currentAction && currentAction.isRunning()) {
      return currentAction;
    }

    const nextAction = mixer.clipAction(clip);
    nextAction.reset();
    nextAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    nextAction.clampWhenFinished = !loop;

    if (currentAction && currentAction !== nextAction) {
      nextAction.play();
      currentAction.crossFadeTo(nextAction, crossfadeDuration, true);
    } else {
      nextAction.play();
    }

    currentAction = nextAction;
    currentClipName = clip.name;
    return nextAction;
  };

  const update = (delta: number) => {
    mixer.update(delta);
  };

  const dispose = () => {
    mixer.stopAllAction();
    character.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      }
    });
  };

  return {
    character,
    mixer,
    clips: data.clips,
    playClip,
    update,
    dispose,
  };
}
