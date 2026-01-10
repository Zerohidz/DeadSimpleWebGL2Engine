# Flocking Frenzy - 5 Day Implementation Plan

**Project:** DeadSimpleWebGL2Engine → Flocking Frenzy  
**Team Size:** 4 developers  
**Timeline:** 5 days total (January 10-15, 2026)  
**Final Deadline:** January 15, 2026 (Presentation + Demo Video)  
**Strategy:** BBM414 requirements → Boids gameplay → Polish

> **📌 IMPORTANT NOTE:**  
> This project builds upon an existing WebGL2 engine codebase from a previous project.  
> The current codebase includes features like dual viewport, orbit camera, and comprehensive GUI.  
> While these are not required by BBM414/SRS, we will **keep existing features** and focus on adding missing requirements rather than removing functionality (time-efficient approach).

---

## 📋 Quick Navigation

- [Day 1: Critical Shader Requirements](#day-1-critical-shader-requirements-jan-11)
- [Day 2: BBM414 Mandatory Features](#day-2-bbm414-mandatory-features-jan-12)
- [Day 3: Boids Core Gameplay](#day-3-boids-core-gameplay-jan-13)
- [Day 4: Inventory, Scoring & Polish](#day-4-inventory-scoring--level-system-jan-14)
- [Day 5: Presentation & Demo](#day-5-presentation--demo-video-jan-15)
- [Team Roles](#team-structure-and-roles)
- [Git Workflow](#git-workflow-strategy)
- [Risk Management](#risk-management)

---

## Team Structure and Roles

| Developer | Primary Focus | Backup Tasks |
|-----------|---------------|--------------|
| **Dev 1** | Shader Pipeline (critical path) | Lighting system, post-processing |
| **Dev 2** | Spotlight & Lighting | Help menu, name scene |
| **Dev 3** | Boids Algorithm (parallel work) | Predator AI, fish rendering |
| **Dev 4** | Scoring & UI/UX | Inventory system, level system, audio |

**Collaboration Points:**
- Daily standup (morning): sync progress, resolve blockers
- Merge window (evening): integrate feature branches to `main`
- Code review: at least 1 other dev must review before merge

---

## Git Workflow Strategy

### Branch Structure

```
main (protected, always deployable)
├── day1-shaders
│   ├── feature/underwater-shader
│   ├── feature/spotlight-implementation
│   └── feature/glsl-separation
├── day2-mandatory-features
│   ├── feature/help-menu
│   └── feature/name-scene
├── day3-boids
│   ├── feature/boids-core
│   ├── feature/instanced-rendering
│   └── feature/predator-ai
└── day4-gameplay
    ├── feature/inventory-system
    ├── feature/scoring
    └── feature/level-system
```

### Commit Convention

Format: `[TYPE] Brief description (#issue-number)`

**Types:**
- `[FEAT]` - New feature
- `[FIX]` - Bug fix
- `[SHADER]` - Shader code changes
- `[DOCS]` - Documentation
- `[TEST]` - Testing, verification
- `[MERGE]` - Branch merge

**Example:**
```bash
git commit -m "[SHADER] Add underwater NPR fragment shader"
git commit -m "[FEAT] Implement boids separation behavior"
git commit -m "[FIX] Correct spotlight cone angle calculation"
```

---

## Day 1: Critical Shader Requirements (Jan 11)

**Goal:** Complete BBM414's most critical requirement: 2+ distinct shader programs

### Morning Session (4 hours)

#### Task 1.1: Separate GLSL to External Files [Dev 1] (1.5 hours)
**Current:** Shaders embedded in HTML `<script>` tags  
**Target:** Separate `.vert` and `.frag` files

**Steps:**
- [ ] Create `shaders/` directory
- [ ] Extract current Blinn-Phong shader to:
  - `shaders/phong.vert.glsl`
  - `shaders/phong.frag.glsl`
- [ ] Update shader loading in `main.js` to use `fetch()` API
- [ ] Test existing rendering still works

**Acceptance Criteria:**
- ✅ At least 2 vertex + 2 fragment shader files exist as separate `.glsl` files
- ✅ Shader loading is asynchronous (fetch API)
- ✅ No regressions in current rendering

**Priority:** 🔴 Critical (BBM414 requirement)

---

#### Task 1.2: Underwater NPR Shader [Dev 1] (2.5 hours)
**Goal:** Create visually distinct second shader program

**Steps:**
- [ ] Create `shaders/underwater.vert.glsl` (similar to phong, passes position/normal)
- [ ] Create `shaders/underwater.frag.glsl` with:
  - **Depth fog:** `mix(fogColor, objectColor, fogFactor)` based on fragment depth
  - **Caustics pattern:** Procedural noise or sine wave pattern
  - **Color grading:** Blue-teal tint for underwater feel
  - **Simplified lighting:** Basic directional only (performance)

**Code Hints (Fragment Shader):**
```glsl
// Depth fog
float depth = gl_FragCoord.z / gl_FragCoord.w;
float fogFactor = exp(-depth * fogDensity);
vec3 fogColor = vec3(0.0, 0.3, 0.5); // Underwater blue

// Caustics (simple procedural)
float caustic = sin(vWorldPos.x * 5.0 + time) * sin(vWorldPos.z * 5.0 + time);
caustic = caustic * 0.5 + 0.5; // Remap to [0,1]

// Final color
vec3 underwater = mix(baseColor * caustic, fogColor, 1.0 - fogFactor);
```

**Acceptance Criteria:**
- ✅ Visually VERY different from Blinn-Phong (obvious underwater effect)
- ✅ Affects entire scene (not just specific objects)
- ✅ No performance drop (target 60 FPS)

**Priority:** 🔴 Critical (BBM414 requirement)

---

### Afternoon Session (4 hours)

#### Task 1.3: Shader Switching Mechanism [Dev 1] (1 hour)
**Steps:**
- [ ] Add keyboard listeners: '1' = Phong, '2' = Underwater
- [ ] Implement shader program swap in render loop
- [ ] Add GUI toggle dropdown (optional, keyboard sufficient)
- [ ] Display active shader name on screen (small overlay)

**Acceptance Criteria:**
- ✅ User can switch shaders at runtime
- ✅ No visual glitches during switch
- ✅ Shader switch persists across frames

**Priority:** 🔴 Critical

---

#### Task 1.4: Spotlight Implementation [Dev 2] (3 hours)
**Current:** Point lights exist  
**Target:** Convert one to spotlight with cone + cutoff

**Steps:**
- [ ] Update fragment shader with spotlight struct:
```glsl
struct SpotLight {
    vec3 position;
    vec3 direction;
    vec3 color;
    float intensity;
    float cutOff;        // Inner cone (cos of angle)
    float outerCutOff;   // Outer cone for smooth edge
    float constant;
    float linear;
    float quadratic;
};
```
- [ ] Implement spotlight calculation (cone attenuation)
- [ ] Add GUI controls:
  - Position (X, Y, Z sliders)
  - Direction (X, Y, Z sliders, normalized)
  - Intensity, cutOff, outerCutOff
  - On/Off toggle
- [ ] Add cone visualization helper (optional)

**Code Hints:**
```glsl
float theta = dot(lightDir, normalize(-spotLight.direction));
float epsilon = spotLight.cutOff - spotLight.outerCutOff;
float intensity = clamp((theta - spotLight.outerCutOff) / epsilon, 0.0, 1.0);
```

**Acceptance Criteria:**
- ✅ Spotlight has visible cone shape (not omnidirectional)
- ✅ 6 DOF control (translate + rotate)
- ✅ Intensity adjustable
- ✅ On/Off toggle works

**Priority:** 🔴 Critical (BBM414 requirement)

---

### End of Day 1 Checklist
- [ ] 4+ GLSL files exist (2 vert, 2 frag minimum)
- [ ] 2 visually distinct shader programs implemented
- [ ] Runtime shader switching works
- [ ] At least 1 spotlight implemented
- [ ] Git commits: `[SHADER] Separate GLSL files`, `[SHADER] Add underwater NPR shader`, `[FEAT] Implement spotlight`

---

## Day 2: BBM414 Mandatory Features (Jan 12)

**Goal:** Complete remaining BBM414 base requirements

### Morning Session (4 hours)

#### Task 2.1: Help Menu [Dev 4] (2 hours)
**Steps:**
- [ ] Create HTML overlay `<div id="helpMenu">` in `index.html`
- [ ] Style with CSS (semi-transparent background, centered, scrollable)
- [ ] Add content sections:
  - **Camera Controls:** WASD, Space, Shift, Mouse
  - **Shader Switching:** '1', '2' keys
  - **Spotlight Controls:** GUI panel location
  - **Gameplay:** Inventory placement, simulation start, win/lose
  - **Special Keys:** 'H' (help), 'N' (name scene), ESC (pointer unlock)
- [ ] Add keyboard listener: 'H' or 'h' toggles visibility
- [ ] Test: Press H → menu appears, press H again → menu hides

**Acceptance Criteria:**
- ✅ 'H' key toggles help menu
- ✅ All controls documented
- ✅ Menu readable (good contrast, proper font size)

**Priority:** 🔴 Critical

---

#### Task 2.2: Group Name Scene [Dev 2] (2 hours)
**Steps:**
- [ ] Create 3D text or use instanced cubes to spell out team member names
  - Example: Use `createCube()` primitives arranged as letters (simpler)
  - Alternative: Load 3D text models (more complex)
- [ ] Position name objects at a designated location (e.g., `y = -50`)
- [ ] Add keyboard listener: 'N' or 'n' triggers camera transition
- [ ] Implement animated camera movement:
  - Store current camera position/rotation
  - Lerp/Slerp to name scene position (top-down view)
  - After 3 seconds, lerp back to original position
- [ ] Ensure camera never teleports (smooth animation)

**Code Hints:**
```javascript
// Linear interpolation for position
camera.position = vec3.lerp(out, currentPos, targetPos, t);

// Spherical interpolation for rotation (quaternions recommended)
// Or Euler angle lerp for simplicity
```

**Acceptance Criteria:**
- ✅ 'N' key triggers camera transition
- ✅ Camera moves smoothly (no teleport)
- ✅ Names visible from top-down view
- ✅ Camera returns to original position

**Priority:** 🔴 Critical

---

### Afternoon Session (4 hours)

#### Task 2.3: Fish Avoidance Behavior Setup [Dev 3] (2 hours)
**Preparation for Day 3 boids work**

**Steps:**
- [ ] Create `Fish` class/struct:
```javascript
class Fish {
    constructor(id) {
        this.id = id;
        this.position = vec3.create();
        this.velocity = vec3.create();
        this.acceleration = vec3.create();
        this.maxSpeed = 2.0;
        this.maxForce = 0.1;
    }
}
```
- [ ] Create `Boids` manager class skeleton
- [ ] Add basic update loop (empty for now, filled Day 3)
- [ ] Test: Spawn 10 fish, render as spheres

**Acceptance Criteria:**
- ✅ Fish class defined
- ✅ 10+ fish render correctly
- ✅ No performance issues

**Priority:** 🟡 High (prep work)

---

#### Task 2.4: Instanced Rendering Setup [Dev 3] (2 hours)
**Goal:** Prepare for rendering ~100 fish efficiently

**Steps:**
- [ ] Research WebGL2 instanced rendering (`gl.drawArraysInstanced`)
- [ ] Create instance buffer for fish positions
- [ ] Modify vertex shader to use `gl_InstanceID`
- [ ] Test with 100 simple cubes (fish placeholder)

**Code Hints:**
```glsl
// Vertex shader
layout(location = 3) in vec3 instancePosition; // Per-instance
gl_Position = projection * view * model * (vec4(aPosition, 1.0) + vec4(instancePosition, 0.0));
```

**Acceptance Criteria:**
- ✅ 100+ instances render efficiently (60 FPS)
- ✅ Each instance has unique position

**Priority:** 🟡 High (critical for Day 3)

---

### End of Day 2 Checklist
- [ ] Help menu functional ('H' key)
- [ ] Name scene with animated camera transition ('N' key)
- [ ] Fish class + instanced rendering ready
- [ ] All BBM414 base requirements met (shaders, spotlight, help, names)

---

## Day 3: Boids Core Gameplay (Jan 13)

**Goal:** Implement flocking algorithm and predator AI

### Morning Session (4 hours)

#### Task 3.1: Boids Algorithm - Separation [Dev 3] (1 hour)
**Steps:**
- [ ] Implement separation force:
```javascript
separation(fish, allFish, separationRadius = 1.5) {
    let steer = vec3.create();
    let count = 0;
    for (let other of allFish) {
        let d = vec3.distance(fish.position, other.position);
        if (d > 0 && d < separationRadius) {
            let diff = vec3.subtract(vec3.create(), fish.position, other.position);
            vec3.normalize(diff, diff);
            vec3.scale(diff, diff, 1.0 / d); // Weight by distance
            vec3.add(steer, steer, diff);
            count++;
        }
    }
    if (count > 0) {
        vec3.scale(steer, steer, 1.0 / count);
        vec3.normalize(steer, steer);
        vec3.scale(steer, steer, fish.maxSpeed);
        vec3.subtract(steer, steer, fish.velocity);
        // Limit to maxForce (not shown)
    }
    return steer;
}
```

**Acceptance Criteria:**
- ✅ Fish avoid crowding neighbors
- ✅ Visual separation observable

---

#### Task 3.2: Boids Algorithm - Alignment & Cohesion [Dev 3] (1.5 hours)
**Steps:**
- [ ] Implement alignment (match neighbor velocity)
- [ ] Implement cohesion (steer toward average neighbor position)
- [ ] Combine all three forces with weights:
```javascript
let sep = separation(fish, neighbors);
let ali = alignment(fish, neighbors);
let coh = cohesion(fish, neighbors);

vec3.scale(sep, sep, 1.5); // Separation weight
vec3.scale(ali, ali, 1.0); // Alignment weight
vec3.scale(coh, coh, 1.0); // Cohesion weight

vec3.add(fish.acceleration, sep, ali);
vec3.add(fish.acceleration, fish.acceleration, coh);
```

**Acceptance Criteria:**
- ✅ Fish flock together (cohesion)
- ✅ Fish move in similar directions (alignment)
- ✅ Emergent flocking behavior visible

---

#### Task 3.3: Goal-Seeking Behavior [Dev 3] (1.5 hours)
**Steps:**
- [ ] Add goal position (where bait will be placed)
- [ ] Implement seek force:
```javascript
seek(fish, target) {
    let desired = vec3.subtract(vec3.create(), target, fish.position);
    vec3.normalize(desired, desired);
    vec3.scale(desired, desired, fish.maxSpeed);
    let steer = vec3.subtract(vec3.create(), desired, fish.velocity);
    return steer;
}
```
- [ ] Add to acceleration with weight
- [ ] Test: Fish should gradually move toward goal

**Acceptance Criteria:**
- ✅ Fish move toward goal region
- ✅ Still maintain flocking (not straight line)

**Priority:** 🔴 Critical (SRS requirement)

---

### Afternoon Session (4 hours)

#### Task 3.4: Obstacle Avoidance [Dev 3] (2 hours)
**Steps:**
- [ ] Create obstacle array (rocks, walls)
- [ ] Implement avoidance force (raycasting or proximity-based)
- [ ] Add to boids acceleration
- [ ] Test with wall boundaries and rock objects

**Acceptance Criteria:**
- ✅ Fish avoid obstacles
- ✅ No fish pass through walls

**Priority:** 🔴 Critical

---

#### Task 3.5: Predator AI [Dev 3 + Dev 4] (2 hours)
**Steps:**
- [ ] Create `Predator` class (shark)
- [ ] Implement nearest fish detection:
```javascript
findNearestFish(predator, fishArray, detectionRadius) {
    let nearest = null;
    let minDist = Infinity;
    for (let fish of fishArray) {
        let d = vec3.distance(predator.position, fish.position);
        if (d < detectionRadius && d < minDist) {
            minDist = d;
            nearest = fish;
        }
    }
    return nearest;
}
```
- [ ] Implement steering toward target
- [ ] On contact (distance < threshold): remove fish from array
- [ ] Render predator as distinct model (scaled sphere or load shark model)

**Acceptance Criteria:**
- ✅ Predator hunts nearest fish
- ✅ Fish die on contact (removed from array)
- ✅ Predator visible and distinct

**Priority:** 🔴 Critical

---

### End of Day 3 Checklist
- [ ] Boids algorithm complete (separation, alignment, cohesion, goal-seeking, obstacle avoidance)
- [ ] ~100 fish swimming with emergent behavior
- [ ] Predator AI hunting fish
- [ ] Instanced rendering working (60 FPS with 100 fish)

---

## Day 4: Inventory, Scoring & Level System (Jan 14)

**Goal:** Complete gameplay loop

### Morning Session (4 hours)

#### Task 4.1: Inventory System [Dev 4] (2 hours)
**Steps:**
- [ ] Create `Inventory` class:
```javascript
class Inventory {
    constructor() {
        this.items = {
            rock: 3,
            spikedRock: 2,
            bait: 1,
            // current, spotlight (optional)
        };
    }
}
```
- [ ] Display inventory UI (HTML overlay or lil-gui)
- [ ] Show available item counts
- [ ] Highlight selected item type

**Acceptance Criteria:**
- ✅ Inventory displayed on screen
- ✅ Item counts accurate

**Priority:** 🔴 Critical

---

#### Task 4.2: Raycast Placement [Dev 4] (2 hours)
**Steps:**
- [ ] Implement mouse raycast from camera
- [ ] On click: place selected inventory item at raycast hit point
- [ ] Decrement inventory count
- [ ] Lock placement when inventory empty
- [ ] Add "Start Simulation" button (disabled until all items placed)

**Code Hints:**
```javascript
// Raycasting pseudo-code
function getRayFromMouse(mouseX, mouseY, camera) {
    // Convert screen coords to NDC
    // Unproject to world space
    // Return ray origin + direction
}
```

**Acceptance Criteria:**
- ✅ User can place items with mouse click
- ✅ Items correctly positioned in 3D space
- ✅ Cannot place when inventory empty

**Priority:** 🔴 Critical

---

### Afternoon Session (4 hours)

#### Task 4.3: Scoring System [Dev 4] (1.5 hours)
**Steps:**
- [ ] Initialize score = 100 at simulation start
- [ ] Decrease score on fish death (e.g., -10 per fish)
- [ ] Optionally: decrease score over time (minor penalty)
- [ ] Display score on screen (large, visible font)
- [ ] Color code: Green if winning, Red if losing

**Acceptance Criteria:**
- ✅ Score visible during simulation
- ✅ Score updates on fish death
- ✅ Color feedback works

**Priority:** 🔴 Critical

---

#### Task 4.4: Win/Lose Condition [Dev 4] (1 hour)
**Steps:**
- [ ] Define win threshold (e.g., 60% fish reach goal)
- [ ] Check condition every frame:
  - Fish in goal region count
  - Time elapsed (max 20 seconds)
- [ ] On win: Display "SUCCESS" overlay, play sound (optional)
- [ ] On lose: Display "FAILED" overlay, offer restart
- [ ] Pause simulation on outcome

**Acceptance Criteria:**
- ✅ Win/lose detected correctly
- ✅ Clear visual feedback
- ✅ Restart button works

**Priority:** 🔴 Critical

---

#### Task 4.5: Level System (Basic) [Dev 1 + Dev 2] (1.5 hours)
**Steps:**
- [ ] Create level data structure:
```javascript
const levels = [
    {
        id: 1,
        fishCount: 50,
        inventory: { rock: 3, spikedRock: 1, bait: 1 },
        winThreshold: 0.6, // 60%
        predatorCount: 1,
    },
    // Level 2, 3... (optional for now)
];
```
- [ ] Load level data on start
- [ ] Spawn fish, predators, set inventory based on level
- [ ] (Optional) Add level select UI

**Acceptance Criteria:**
- ✅ At least 1 playable level defined
- ✅ Level loads correctly

**Priority:** 🟡 High

---

### End of Day 4 Checklist
- [ ] Inventory + placement system working
- [ ] Scoring system functional
- [ ] Win/lose conditions implemented
- [ ] At least 1 complete playable level
- [ ] Full gameplay loop: prepare → simulate → outcome → restart

---

## Day 5: Presentation & Demo Video (Jan 15)

**Goal:** Final polish and deliverables

### Morning Session (4 hours)

#### Task 5.1: Audio Feedback [Dev 4] (1 hour)
**Steps:**
- [ ] Use Web Audio API or HTML5 `<audio>` tags
- [ ] Add success sound (win)
- [ ] Add failure sound (lose)
- [ ] (Optional) Background ambient underwater sound

**Acceptance Criteria:**
- ✅ Success/failure sounds play on outcome

**Priority:** 🟢 Medium

---

#### Task 5.2: Visual Polish [All Devs] (1.5 hours)
**Steps:**
- [ ] Adjust lighting for better visibility
- [ ] Ensure underwater shader looks appealing
- [ ] Add simple particle effects (optional, e.g., fish death sparkle)
- [ ] Check all GUI elements are readable
- [ ] Test on multiple browsers (Chrome, Firefox)

---

#### Task 5.3: Bug Fixes & Testing [All Devs] (1.5 hours)
**Steps:**
- [ ] Test full gameplay loop 5+ times
- [ ] Fix any crashes or visual glitches
- [ ] Performance optimization (if FPS drops)
- [ ] Edge case testing (all fish die, inventory edge cases)

---

### Afternoon Session (4 hours)

#### Task 5.4: Demo Video Recording [Dev 2 + Dev 4] (2 hours)
**Requirements (FINAL_GOAL.md):**
- How Informative (50%): Narration or text captions describing features
- Video/Audio Quality (25%): 720p+ stereo audio
- Game-Trailer-likeness (25%): Exciting, polished presentation

**Steps:**
- [ ] Script narration (or on-screen text):
  - Introduce project: "Flocking Frenzy - WebGL2 boids simulation"
  - Show shader switching ('1', '2' keys)
  - Show spotlight controls
  - Show inventory placement
  - Show simulation running (fish flocking, predator hunting)
  - Show win/lose outcomes
  - Show help menu ('H')
  - Show name scene ('N')
- [ ] Record gameplay with OBS or browser screen capture
- [ ] Edit with basic transitions (optional)
- [ ] Export as 720p+ MP4

**Acceptance Criteria:**
- ✅ Video is 1-3 minutes long
- ✅ All major features shown
- ✅ Audio clear (narration or music)

---

#### Task 5.5: Presentation Slides [Dev 1 + Dev 3] (2 hours)
**Steps:**
- [ ] Slide 1: Title + Team members
- [ ] Slide 2: Project overview (Flocking Frenzy concept)
- [ ] Slide 3: Technology stack (WebGL2, JavaScript, GLSL, gl-matrix, lil-gui)
- [ ] Slide 4-5: Shader code snippets (phong.frag, underwater.frag) + brief explanation
- [ ] Slide 6: Boids algorithm explanation (diagram + code snippets)
- [ ] Slide 7: Spotlight implementation (cone angle visualization)
- [ ] Slide 8: Gameplay features (inventory, scoring, levels)
- [ ] Slide 9: Demo video (embed or link)
- [ ] Slide 10: External resources used (gl-matrix, lil-gui, any models/textures)
- [ ] Slide 11: Q&A

**Acceptance Criteria:**
- ✅ 10-15 slides total
- ✅ Code snippets included
- ✅ Professional appearance

---

### End of Day 5 Checklist
- [ ] Demo video exported (720p+ MP4)
- [ ] Presentation slides complete (PPT/PDF)
- [ ] All code committed and pushed to GitHub
- [ ] Project directory cleaned and ZIPed
- [ ] Ready for submission

---

## Risk Management

### High-Priority Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Boids performance (100 fish lag)** | 🟡 Medium | 🔴 High | Use instanced rendering (Day 2 prep), limit to 50 fish if necessary |
| **Underwater shader not visually distinct** | 🟡 Medium | 🔴 High | Test early (Day 1), iterate with stronger fog/caustics |
| **Raycast placement bugs** | 🟡 Medium | 🟡 Medium | Test thoroughly, add debug visualization (ray lines) |
| **Time constraint (5 days tight)** | 🔴 High | 🔴 High | Prioritize critical features, skip optional polish if needed |
| **Merge conflicts (4 devs)** | 🟡 Medium | 🟡 Medium | Daily merges, clear module boundaries, code review |

### Contingency Plans

**If Day 3 boids lag:**
- Reduce fish count to 50
- Remove predator (becomes optional)
- Simplify obstacle avoidance

**If Day 4 inventory too complex:**
- Manual placement via GUI sliders (no raycast)
- Fixed inventory (no level variation)

**If Day 5 video recording fails:**
- Use static screenshots + narration
- Screen recording of browser window

---

## Success Criteria

### Minimum Viable Product (Must-Have)
- ✅ 2+ shader programs (Phong + Underwater)
- ✅ 4+ GLSL files (separate)
- ✅ Shader runtime switching
- ✅ 1 spotlight (6 DOF, on/off, intensity)
- ✅ Help menu ('H' toggle)
- ✅ Name scene ('N' animated camera)
- ✅ Boids flocking (50+ fish)
- ✅ Scoring system
- ✅ 1 playable level
- ✅ Demo video
- ✅ Presentation with shader code

### Nice-to-Have (Bonus)
- 🌟 100 fish with instanced rendering
- 🌟 Predator AI
- 🌟 Multiple levels
- 🌟 Audio feedback
- 🌟 Particle effects
- 🌟 Advanced caustics (texture-based)

---

## External Resources & References

**Libraries Used (Must cite in presentation):**
- **gl-matrix** (v3.4.4) - MIT License - Matrix/vector math
- **lil-gui** (v0.21) - MIT License - GUI controls

**Assets (if used):**
- Any 3D models: Cite source (Sketchfab, etc.)
- Any textures: Cite source or mark as self-made

**Code References:**
- WebGL2 Fundamentals: https://webgl2fundamentals.org/
- Boids algorithm: Craig Reynolds (1986) - https://www.red3d.com/cwr/boids/

---

## Document Version

**Version:** 3.0 (Complete Implementation Plan)  
**Last Updated:** 2026-01-10  
**Status:** Ready for execution  
**Total Estimated Hours:** ~80 developer-hours (4 devs × 5 days × 4 hours/day)

---

## Final Notes

1. **Existing Codebase Advantage:** The project already has dual viewport, orbit camera, procedural geometry, OBJ loading, and comprehensive GUI. These are NOT gold plating - they're inherited from a previous project. We keep them and focus on adding BBM414/SRS requirements.

2. **Daily Standups Essential:** With 4 developers and 5 days, communication is critical. 15-min morning standup prevents merge conflicts.

3. **Test Early, Test Often:** Don't wait until Day 5 to test the full gameplay loop. Test incrementally each day.

4. **Shader Quality:** The underwater shader MUST look significantly different from Phong. Don't settle for subtle differences - go bold with fog and caustics.

5. **Boids Debugging:** Use visual debugging (draw velocity vectors, highlight neighbors) to tune boids parameters.

**Good luck! 🚀**
