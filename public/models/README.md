# CricPlus 3D Mascot Model Specification

This directory is designated for the 3D mascot asset (`cricplus-mascot.glb`).

## Model Details
- **Filename:** `cricplus-mascot.glb`
- **Character:** "Champ" — CricPlus Corporate Cricket Mascot
- **Format:** Binary GLTF (.glb), glTF 2.0 with embedded PBR textures
- **Target Polygon Count:** 15,000 – 35,000 triangles (optimized for mobile 60fps WebGL)
- **Texture Resolution:** 2048x2048 (BaseColor, MetallicRoughness, Normal, Emissive)
- **Branding:** Royal blue cricket jersey with CricPlus chest typography, matching blue cricket cap/helmet with CricPlus crest, white batting pads (shin guards), white batting gloves, and natural willow wood cricket bat.

## Skeleton / Rigging Hierarchy
The model requires a humanoid humanoid skeleton with the following standard bone naming:
- `Root`
  - `Hips`
    - `Spine` -> `Spine1` -> `Chest` -> `Neck` -> `Head`
      - `LeftShoulder` -> `LeftArm` -> `LeftForeArm` -> `LeftHand`
      - `RightShoulder` -> `RightArm` -> `RightForeArm` -> `RightHand`
        - `BatSlot` (Right hand attachment bone for cricket bat prop)
    - `LeftUpLeg` -> `LeftLeg` -> `LeftFoot` -> `LeftToeBase`
    - `RightUpLeg` -> `RightLeg` -> `RightFoot` -> `RightToeBase`

## Required Animation Clips (12 SOLD + 12 UNSOLD + Transitions)
The Mascot Reaction Engine maps to the following animation clip names when loaded from `cricplus-mascot.glb`:

### Base Clips:
- `Idle` — Gentle breathing, bat resting on ground
- `Walk` — Natural forward walking cycle
- `Exit` — Smooth wave and stride off-screen

### 12 SOLD Celebration Clips:
1. `Sold_ThumbsUp` — Enthusiastic thumbs up gesture with right hand, smiling pose
2. `Sold_VictoryJump` — Explosive two-legged jump with bat raised high
3. `Sold_HeroWalk` — Confident swagger with bat slung casually over shoulder
4. `Sold_HappyClapping` — Rhythmic gloved hand clapping with wide grin
5. `Sold_VictoryDance` — Playful side-step celebration shuffle
6. `Sold_BothArmsRaised` — Dual arms thrust skyward in victory (V-pose)
7. `Sold_BatTwirl` — Smooth 360° bat spin in hand before resting on shoulder
8. `Sold_VictorySalute` — Raises bat towards dugout in formal cricketing salute
9. `Sold_FistPump` — Double fist pump with left arm while holding bat in right
10. `Sold_WelcomeWave` — Cheerful two-handed waving motion to new teammates
11. `Sold_VictorySpin` — 360-degree pirouette rotation with bat extended
12. `Sold_TrophyCelebration` — Holds gleaming golden trophy aloft with both hands

### 12 UNSOLD Disappointment Clips:
1. `Unsold_SadWalk` — Slow pacing, lowered head, slumped shoulders
2. `Unsold_DisappointedSit` — Sits gently on pitch, elbows on knees
3. `Unsold_HeadShake` — Slow, respectful head shake in gentle disbelief
4. `Unsold_WipeTear` — Wipes corner of eye with batting glove
5. `Unsold_ShoulderShrug` — Look to auctioneer, sympathetic shrug
6. `Unsold_SympatheticWave` — Gentle wave to the room with slight reassuring nod
7. `Unsold_SlowWalkOff` — Slow walk dragging bat softly along the turf
8. `Unsold_LookAtGround` — Staring quietly at the crease line
9. `Unsold_ShouldersDropping` — Posture slumping as air deflates
10. `Unsold_SitWithBat` — Resting chin on top of upright bat handle
11. `Unsold_GentleSigh` — Chest heave with downward glance
12. `Unsold_RegainConfidence` — Small fist pump and determined wave before exit

## Procedural Engine Fallback
If `cricplus-mascot.glb` is not placed in this directory, `AuctionMascotOverlay` automatically activates the built-in Three.js procedural 3D articulated mascot (`threeMascotModel.ts`). The procedural model constructs all 24 articulated bone poses, facial expressions, cricket bat, batting pads, jersey, cap, and golden trophy using pure Three.js geometry and kinematics.
