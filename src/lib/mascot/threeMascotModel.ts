/**
 * CricPlus 3D Mascot Articulated Model & Procedural Rig
 * 
 * Refined athletic character proportions:
 * - Perfectly grounded feet (y = 0)
 * - Athletic boy-cricketer proportions (balanced head-to-body ratio, no bobblehead)
 * - Authentic 3-rib cricket batting pads, spiked athletic shoes, willow bat, gloves, cap with peak
 * - Expressive animated eyes, smile/sad mouth, rosy cheeks
 * - Props: Golden championship cup (SOLD) & broken glowing heart (UNSOLD)
 * - Smooth pose interpolation, natural walk cycles, and full 24 reaction compatibility
 */

import * as THREE from 'three';
import { ReactionConfig } from './reactionEngine';

export interface MascotRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  cap: THREE.Group;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  mouth: THREE.Mesh;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  leftHand: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  rightHand: THREE.Group;
  bat: THREE.Group;
  leftThigh: THREE.Group;
  leftShin: THREE.Group;
  leftFoot: THREE.Group;
  rightThigh: THREE.Group;
  rightShin: THREE.Group;
  rightFoot: THREE.Group;
  trophy: THREE.Group;
  brokenHeart: THREE.Group;
  materials: Record<string, THREE.Material>;
  updatePose: (pose: ReactionConfig['pose'], walkProgress: number, isWalking: boolean) => void;
  dispose: () => void;
}

export function createProceduralMascotRig(): MascotRig {
  const materials: Record<string, THREE.Material> = {};

  // High quality PBR-tuned materials
  const jerseyBlue = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // CricPlus Royal Blue
    roughness: 0.35,
    metalness: 0.1,
  });
  materials.jersey = jerseyBlue;

  const jerseyDarkBlue = new THREE.MeshStandardMaterial({
    color: 0x0f2356, // Deep Navy shorts & cap trim
    roughness: 0.45,
  });
  materials.jerseyDark = jerseyDarkBlue;

  const skinTone = new THREE.MeshStandardMaterial({
    color: 0xfbd0a2, // Warm peach skin
    roughness: 0.55,
    metalness: 0.02,
  });
  materials.skin = skinTone;

  const darkHair = new THREE.MeshStandardMaterial({
    color: 0x1e1511, // Dark brown hair
    roughness: 0.7,
  });
  materials.hair = darkHair;

  const goldAccent = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // CricPlus Gold Accent
    roughness: 0.25,
    metalness: 0.5,
  });
  materials.gold = goldAccent;

  const padWhite = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Batting pad white
    roughness: 0.3,
    metalness: 0.05,
  });
  materials.padWhite = padWhite;

  const gloveWhite = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
  });
  materials.gloveWhite = gloveWhite;

  const willowWood = new THREE.MeshStandardMaterial({
    color: 0xdfad73, // English willow cricket bat
    roughness: 0.45,
    metalness: 0.0,
  });
  materials.batWood = willowWood;

  const batGrip = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // CricPlus Sky blue rubber grip
    roughness: 0.8,
  });
  materials.batGrip = batGrip;

  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x09090b });
  materials.eye = eyeMaterial;

  const eyeReflection = new THREE.MeshBasicMaterial({ color: 0xffffff });
  materials.reflection = eyeReflection;

  const mouthMaterial = new THREE.MeshStandardMaterial({
    color: 0x881337,
    roughness: 0.4,
  });
  materials.mouth = mouthMaterial;

  const trophyGold = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.9,
    roughness: 0.15,
    emissive: 0xb45309,
    emissiveIntensity: 0.2,
  });
  materials.trophyGold = trophyGold;

  const heartRed = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.35,
    roughness: 0.3,
  });
  materials.heartRed = heartRed;

  // --------------------------------------------------------------------------
  // HIERARCHY ASSEMBLY (Height ~ 1.34 units, Grounded at y = 0)
  // --------------------------------------------------------------------------
  const root = new THREE.Group();
  root.name = 'MascotRoot';

  // Hips anchored at natural standing waist height
  const hips = new THREE.Group();
  hips.position.y = 0.62;
  root.add(hips);

  // Pelvis / Shorts (Athletic cut)
  const pelvisGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.15, 16);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, jerseyDarkBlue);
  hips.add(pelvisMesh);

  // Torso / Jersey (Tapered athletic build)
  const torso = new THREE.Group();
  torso.position.y = 0.08;
  hips.add(torso);

  const chestGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.32, 16);
  const chestMesh = new THREE.Mesh(chestGeo, jerseyBlue);
  chestMesh.position.y = 0.16;
  torso.add(chestMesh);

  // Gold Trim Collar & Chest Stripe
  const collarGeo = new THREE.TorusGeometry(0.21, 0.015, 8, 20);
  const collarMesh = new THREE.Mesh(collarGeo, goldAccent);
  collarMesh.rotation.x = Math.PI / 2;
  collarMesh.position.y = 0.28;
  torso.add(collarMesh);

  // Head & Neck (Proportionate: radius 0.22, realistic athletic ratio)
  const head = new THREE.Group();
  head.position.y = 0.36;
  torso.add(head);

  const headGeo = new THREE.SphereGeometry(0.22, 24, 20);
  headGeo.scale(1.0, 1.05, 1.0);
  const headMesh = new THREE.Mesh(headGeo, skinTone);
  headMesh.position.y = 0.12;
  head.add(headMesh);

  // Hair Tuft on temples
  const hairGeo = new THREE.SphereGeometry(0.225, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
  const hairMesh = new THREE.Mesh(hairGeo, darkHair);
  hairMesh.position.set(0, 0.16, -0.01);
  head.add(hairMesh);

  // CricPlus Cricket Cap / Helmet
  const cap = new THREE.Group();
  cap.position.y = 0.22;
  head.add(cap);

  const capDomeGeo = new THREE.SphereGeometry(0.23, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const capDome = new THREE.Mesh(capDomeGeo, jerseyBlue);
  cap.add(capDome);

  // Cap Visor (Curved Peak)
  const visorGeo = new THREE.CylinderGeometry(0.25, 0.26, 0.025, 16, 1, false, -Math.PI * 0.4, Math.PI * 0.8);
  const visor = new THREE.Mesh(visorGeo, jerseyDarkBlue);
  visor.position.set(0, -0.01, 0.12);
  visor.rotation.x = 0.22;
  cap.add(visor);

  // Gold Crest Badge on Cap
  const emblemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.015, 16);
  const emblem = new THREE.Mesh(emblemGeo, goldAccent);
  emblem.rotation.x = Math.PI / 2;
  emblem.position.set(0, 0.08, 0.23);
  cap.add(emblem);

  // Eyes (Expressive Pixar-Style Pupils)
  const eyeGeo = new THREE.SphereGeometry(0.045, 12, 10);
  eyeGeo.scale(1.0, 1.25, 0.4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.075, 0.12, 0.20);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.075, 0.12, 0.20);
  head.add(rightEye);

  // Glossy Catchlight Reflection in Eyes
  const sparkGeo = new THREE.SphereGeometry(0.014, 8, 8);
  const sparkL = new THREE.Mesh(sparkGeo, eyeReflection);
  sparkL.position.set(-0.012, 0.02, 0.035);
  leftEye.add(sparkL);
  const sparkR = new THREE.Mesh(sparkGeo, eyeReflection);
  sparkR.position.set(-0.012, 0.02, 0.035);
  rightEye.add(sparkR);

  // Rosy Cheerful Cheeks
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.45 });
  const blushGeo = new THREE.CircleGeometry(0.035, 12);
  const blushL = new THREE.Mesh(blushGeo, blushMat);
  blushL.position.set(-0.13, 0.06, 0.18);
  blushL.rotation.y = -0.35;
  head.add(blushL);
  const blushR = new THREE.Mesh(blushGeo, blushMat);
  blushR.position.set(0.13, 0.06, 0.18);
  blushR.rotation.y = 0.35;
  head.add(blushR);

  // Dynamic Expressive Mouth
  const mouthGeo = new THREE.TorusGeometry(0.045, 0.016, 8, 16, Math.PI);
  const mouth = new THREE.Mesh(mouthGeo, mouthMaterial);
  mouth.position.set(0, 0.03, 0.21);
  mouth.rotation.x = Math.PI / 1.1; // Friendly smile
  head.add(mouth);

  // --------------------------------------------------------------------------
  // ARMS & HANDS
  // --------------------------------------------------------------------------
  const upperArmGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.20, 12);
  const forearmGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.18, 12);
  const gloveGeo = new THREE.SphereGeometry(0.065, 12, 10);
  gloveGeo.scale(1.0, 1.2, 0.8);

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.25, 0.28, 0);
  torso.add(leftArm);

  const leftUpperArmMesh = new THREE.Mesh(upperArmGeo, jerseyBlue);
  leftUpperArmMesh.position.y = -0.10;
  leftArm.add(leftUpperArmMesh);

  const leftForearm = new THREE.Group();
  leftForearm.position.y = -0.20;
  leftArm.add(leftForearm);

  const leftForearmMesh = new THREE.Mesh(forearmGeo, skinTone);
  leftForearmMesh.position.y = -0.09;
  leftForearm.add(leftForearmMesh);

  const leftHand = new THREE.Group();
  leftHand.position.y = -0.18;
  leftForearm.add(leftHand);

  const leftGloveMesh = new THREE.Mesh(gloveGeo, gloveWhite);
  leftHand.add(leftGloveMesh);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(0.25, 0.28, 0);
  torso.add(rightArm);

  const rightUpperArmMesh = new THREE.Mesh(upperArmGeo, jerseyBlue);
  rightUpperArmMesh.position.y = -0.10;
  rightArm.add(rightUpperArmMesh);

  const rightForearm = new THREE.Group();
  rightForearm.position.y = -0.20;
  rightArm.add(rightForearm);

  const rightForearmMesh = new THREE.Mesh(forearmGeo, skinTone);
  rightForearmMesh.position.y = -0.09;
  rightForearm.add(rightForearmMesh);

  const rightHand = new THREE.Group();
  rightHand.position.y = -0.18;
  rightForearm.add(rightHand);

  const rightGloveMesh = new THREE.Mesh(gloveGeo, gloveWhite);
  rightHand.add(rightGloveMesh);

  // --------------------------------------------------------------------------
  // CRICKET BAT (Proportionate English Willow)
  // --------------------------------------------------------------------------
  const bat = new THREE.Group();
  bat.position.set(0, -0.03, 0.05);
  rightHand.add(bat);

  // Rubber Spiral Grip
  const batHandleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 10);
  const batHandleMesh = new THREE.Mesh(batHandleGeo, batGrip);
  batHandleMesh.position.y = 0.10;
  bat.add(batHandleMesh);

  // Bat Blade
  const batBladeGeo = new THREE.BoxGeometry(0.095, 0.48, 0.032);
  const batBladeMesh = new THREE.Mesh(batBladeGeo, willowWood);
  batBladeMesh.position.y = -0.24;
  bat.add(batBladeMesh);

  // CricPlus Cyan Decal on Bat
  const batStripeGeo = new THREE.PlaneGeometry(0.065, 0.18);
  const batStripeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const batStripeMesh = new THREE.Mesh(batStripeGeo, batStripeMat);
  batStripeMesh.position.set(0, -0.18, 0.018);
  bat.add(batStripeMesh);

  // --------------------------------------------------------------------------
  // LEGS & BATTING PADS (Authentic 3-Rib Padding, Grounded at y = 0)
  // --------------------------------------------------------------------------
  const thighGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.22, 12);
  const padGeo = new THREE.BoxGeometry(0.11, 0.28, 0.10);
  const kneeRollGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.11, 10);
  const shoeGeo = new THREE.BoxGeometry(0.095, 0.065, 0.18);

  // Left Leg
  const leftThigh = new THREE.Group();
  leftThigh.position.set(-0.11, -0.08, 0);
  hips.add(leftThigh);

  const leftThighMesh = new THREE.Mesh(thighGeo, jerseyDarkBlue);
  leftThighMesh.position.y = -0.11;
  leftThigh.add(leftThighMesh);

  const leftShin = new THREE.Group();
  leftShin.position.y = -0.22;
  leftThigh.add(leftShin);

  const leftPadMesh = new THREE.Mesh(padGeo, padWhite);
  leftPadMesh.position.set(0, -0.14, 0.015);
  leftShin.add(leftPadMesh);

  const leftKneeRoll = new THREE.Mesh(kneeRollGeo, goldAccent);
  leftKneeRoll.rotation.z = Math.PI / 2;
  leftKneeRoll.position.set(0, -0.03, 0.055);
  leftShin.add(leftKneeRoll);

  // Left Shoe firmly on floor
  const leftFoot = new THREE.Group();
  leftFoot.position.set(0, -0.28, 0);
  leftShin.add(leftFoot);

  const leftShoeMesh = new THREE.Mesh(shoeGeo, padWhite);
  leftShoeMesh.position.set(0, -0.032, 0.04);
  leftFoot.add(leftShoeMesh);

  // Right Leg
  const rightThigh = new THREE.Group();
  rightThigh.position.set(0.11, -0.08, 0);
  hips.add(rightThigh);

  const rightThighMesh = new THREE.Mesh(thighGeo, jerseyDarkBlue);
  rightThighMesh.position.y = -0.11;
  rightThigh.add(rightThighMesh);

  const rightShin = new THREE.Group();
  rightShin.position.y = -0.22;
  rightThigh.add(rightShin);

  const rightPadMesh = new THREE.Mesh(padGeo, padWhite);
  rightPadMesh.position.set(0, -0.14, 0.015);
  rightShin.add(rightPadMesh);

  const rightKneeRoll = new THREE.Mesh(kneeRollGeo, goldAccent);
  rightKneeRoll.rotation.z = Math.PI / 2;
  rightKneeRoll.position.set(0, -0.03, 0.055);
  rightShin.add(rightKneeRoll);

  // Right Shoe firmly on floor
  const rightFoot = new THREE.Group();
  rightFoot.position.set(0, -0.28, 0);
  rightShin.add(rightFoot);

  const rightShoeMesh = new THREE.Mesh(shoeGeo, padWhite);
  rightShoeMesh.position.set(0, -0.032, 0.04);
  rightFoot.add(rightShoeMesh);

  // --------------------------------------------------------------------------
  // PROPS: GOLDEN CHAMPIONSHIP TROPHY
  // --------------------------------------------------------------------------
  const trophy = new THREE.Group();
  trophy.position.set(-0.25, 0.35, 0.25);
  trophy.visible = false;
  root.add(trophy);

  const cupGeo = new THREE.CylinderGeometry(0.12, 0.06, 0.18, 16);
  const cupMesh = new THREE.Mesh(cupGeo, trophyGold);
  trophy.add(cupMesh);

  const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.08, 10);
  const stemMesh = new THREE.Mesh(stemGeo, trophyGold);
  stemMesh.position.y = -0.12;
  trophy.add(stemMesh);

  const baseGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.05, 14);
  const baseMesh = new THREE.Mesh(baseGeo, jerseyDarkBlue);
  baseMesh.position.y = -0.18;
  trophy.add(baseMesh);

  const handleGeo = new THREE.TorusGeometry(0.055, 0.014, 8, 16, Math.PI);
  const handleL = new THREE.Mesh(handleGeo, trophyGold);
  handleL.rotation.z = -Math.PI / 2;
  handleL.position.set(-0.11, 0.03, 0);
  trophy.add(handleL);

  const handleR = new THREE.Mesh(handleGeo, trophyGold);
  handleR.rotation.z = Math.PI / 2;
  handleR.position.set(0.11, 0.03, 0);
  trophy.add(handleR);

  // --------------------------------------------------------------------------
  // PROPS: BROKEN HEART (UNSOLD REACTION)
  // --------------------------------------------------------------------------
  const brokenHeart = new THREE.Group();
  brokenHeart.position.set(0.35, 0.45, 0.2);
  brokenHeart.visible = false;
  root.add(brokenHeart);

  const heartShapeL = new THREE.Shape();
  heartShapeL.moveTo(0, 0);
  heartShapeL.bezierCurveTo(-0.1, 0.1, -0.18, 0.25, -0.1, 0.35);
  heartShapeL.bezierCurveTo(-0.04, 0.45, 0, 0.35, 0, 0.25);
  heartShapeL.lineTo(-0.02, 0.15);
  heartShapeL.lineTo(0, 0);

  const extrudeSettings = { depth: 0.03, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.01, bevelThickness: 0.015 };
  const heartGeoL = new THREE.ExtrudeGeometry(heartShapeL, extrudeSettings);
  const heartMeshL = new THREE.Mesh(heartGeoL, heartRed);
  heartMeshL.position.x = -0.04;
  brokenHeart.add(heartMeshL);

  const heartShapeR = new THREE.Shape();
  heartShapeR.moveTo(0, 0);
  heartShapeR.bezierCurveTo(0.1, 0.1, 0.18, 0.25, 0.1, 0.35);
  heartShapeR.bezierCurveTo(0.04, 0.45, 0, 0.35, 0, 0.25);
  heartShapeR.lineTo(0.02, 0.15);
  heartShapeR.lineTo(0, 0);

  const heartGeoR = new THREE.ExtrudeGeometry(heartShapeR, extrudeSettings);
  const heartMeshR = new THREE.Mesh(heartGeoR, heartRed);
  heartMeshR.position.x = 0.04;
  brokenHeart.add(heartMeshR);

  // --------------------------------------------------------------------------
  // POSE INTERPOLATION & UPDATE METHOD
  // --------------------------------------------------------------------------
  const updatePose = (pose: ReactionConfig['pose'], walkProgress: number, isWalking: boolean) => {
    if (isWalking) {
      // Natural walking cycle (legs swing, body bobs, arms counter-swing)
      const walkCycle = Math.sin(walkProgress * 8);
      const walkCycleOpposite = Math.sin(walkProgress * 8 + Math.PI);
      const bob = Math.abs(Math.sin(walkProgress * 8)) * 0.05;

      hips.position.y = 0.62 + bob;
      torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, walkCycle * 0.12, 0.2);

      leftThigh.rotation.x = walkCycle * 0.45;
      rightThigh.rotation.x = walkCycleOpposite * 0.45;

      leftShin.rotation.x = Math.max(0, -walkCycle * 0.4);
      rightShin.rotation.x = Math.max(0, -walkCycleOpposite * 0.4);

      leftArm.rotation.x = walkCycleOpposite * 0.4;
      rightArm.rotation.x = walkCycle * 0.25;
      bat.rotation.x = 0.15;
    } else {
      // Static / Celebration Pose Kinematics
      const bounce = Math.sin(walkProgress * pose.bounceSpeed) * (pose.bounceHeight * 0.6);
      hips.position.y = THREE.MathUtils.lerp(hips.position.y, 0.62 + bounce, 0.15);

      torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, pose.bodyTiltY, 0.1);
      torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, pose.bodyTiltX, 0.1);

      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, pose.headTiltY, 0.12);
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, pose.headTiltX, 0.12);
      head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, pose.headTiltZ, 0.12);

      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, pose.leftArmPitch, 0.12);
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, pose.leftArmRoll, 0.12);
      leftForearm.rotation.x = THREE.MathUtils.lerp(leftForearm.rotation.x, pose.leftForearm, 0.12);

      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, pose.rightArmPitch, 0.12);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -pose.rightArmRoll, 0.12);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, pose.rightForearm, 0.12);

      bat.rotation.z = THREE.MathUtils.lerp(bat.rotation.z, pose.batAngleZ, 0.12);
      bat.rotation.x = THREE.MathUtils.lerp(bat.rotation.x, pose.batAngleX, 0.12);

      leftThigh.rotation.x = THREE.MathUtils.lerp(leftThigh.rotation.x, pose.leftLegPitch, 0.12);
      rightThigh.rotation.x = THREE.MathUtils.lerp(rightThigh.rotation.x, pose.rightLegPitch, 0.12);
      leftShin.rotation.x = THREE.MathUtils.lerp(leftShin.rotation.x, 0, 0.12);
      rightShin.rotation.x = THREE.MathUtils.lerp(rightShin.rotation.x, 0, 0.12);

      // Facial Expression
      if (pose.expression === 'smile' || pose.expression === 'laugh') {
        mouth.rotation.x = Math.PI / 1.1; // Big cheerful smile
        mouth.scale.set(1.1, 1.2, 1.0);
        leftEye.scale.set(1.0, 1.25, 0.4);
        rightEye.scale.set(1.0, 1.25, 0.4);
      } else if (pose.expression === 'sad' || pose.expression === 'downcast' || pose.expression === 'sigh') {
        mouth.rotation.x = -Math.PI / 1.1; // Frown / downcast
        mouth.scale.set(0.85, 0.75, 1.0);
        leftEye.scale.set(1.0, 0.7, 0.4); // Drooping eyelids
        rightEye.scale.set(1.0, 0.7, 0.4);
      } else if (pose.expression === 'shock') {
        mouth.rotation.x = 0;
        mouth.scale.set(0.6, 0.6, 0.6);
        leftEye.scale.set(1.2, 1.4, 0.4);
        rightEye.scale.set(1.2, 1.4, 0.4);
      }

      // Trophy visibility & floating bob
      trophy.visible = !!pose.showTrophy;
      if (trophy.visible) {
        trophy.position.y = 0.35 + Math.sin(walkProgress * 4) * 0.03;
        trophy.rotation.y += 0.015;
      }

      // Broken Heart visibility & gentle crack tilt
      brokenHeart.visible = !!pose.showBrokenHeart;
      if (brokenHeart.visible) {
        brokenHeart.position.y = 0.45 + Math.sin(walkProgress * 3) * 0.03;
        brokenHeart.rotation.z = Math.sin(walkProgress * 2) * 0.06;
      }
    }
  };

  const dispose = () => {
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
      }
    });

    for (const key in materials) {
      materials[key].dispose();
    }
  };

  return {
    root,
    hips,
    torso,
    head,
    cap,
    leftEye,
    rightEye,
    mouth,
    leftArm,
    leftForearm,
    leftHand,
    rightArm,
    rightForearm,
    rightHand,
    bat,
    leftThigh,
    leftShin,
    leftFoot,
    rightThigh,
    rightShin,
    rightFoot,
    trophy,
    brokenHeart,
    materials,
    updatePose,
    dispose,
  };
}
