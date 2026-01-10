# Requirements Specification Document

## Project Title: *Flocking Frenzy – Underwater Survival Puzzle*

---

## 1. Introduction

### 1.1 Purpose of the Document

This document defines the functional and non-functional requirements of the **Flocking Frenzy** project. The purpose is to provide a clear, unambiguous, and extensible specification that guides both implementation and evaluation of the project.

### 1.2 Project Overview

Flocking Frenzy is a **3D puzzle-based simulation game** implemented in **WebGL 2.x** using **JavaScript**, **GLSL**, and **HTML**, without the use of any game engine.
The core gameplay revolves around guiding a **school of fish** (implemented via a **boids-based flocking algorithm**) from a spawn region to a goal region while ensuring that a required percentage of the school survives.

The player does not directly control the fish; instead, they **shape the environment** by placing limited inventory items prior to starting the simulation.

---

## 2. High-Level Game Concept

### 2.1 Game Genre

* 3D Puzzle
* Simulation-driven gameplay
* Strategy through environmental manipulation

### 2.2 Core Gameplay Loop

1. Level loads (Preparation Phase)
2. Player places all required inventory items in the scene
3. Simulation is locked until inventory is fully placed
4. Player starts the simulation
5. Fish school spawns and boids simulation begins
6. Simulation runs for **maximum 20 seconds**
7. Outcome is evaluated:

   * Success → score awarded
   * Failure → level restart, no score

---

## 3. Level and Progression Design

### 3.1 Level-Based Structure

* The game is divided into **multiple discrete levels**
* Each level may differ in:

  * Number of fish
  * Inventory item types
  * Inventory item counts
  * Required survival percentage
  * Environmental difficulty

### 3.2 Win / Lose Conditions

* **Win Condition**:
  At least a predefined percentage of fish reach the goal region before the simulation ends.
* **Lose Condition**:
  Survival percentage falls below the threshold or time expires.

### 3.3 Replayability

* Failed levels must be replayed
* No partial scoring for failed attempts

---

## 4. Fish School (Boids System)

### 4.1 Fish Entity Characteristics

* All fish are of the **same species**
* Visual differences are optional but behaviorally identical
* Fish exist fully in 3D space

### 4.2 Boids Algorithm

Each fish follows a boids-based behavior model including:

* Separation
* Alignment
* Cohesion
* **Goal Seeking** (mandatory)
* Obstacle Avoidance

Boids parameters may be adjusted per level to create emergent behavioral differences without introducing new fish types.

### 4.3 Fish Count

* Typical value: ~100 fish
* May increase or decrease depending on level difficulty

### 4.4 Fish Mortality Rules

Fish can die under the following conditions:

* Eaten by a predator
* Collision with a **spiked rock**
* (Optional, toggleable) collision with other fish

Fish do **not** die from collisions with regular rocks.

---

## 5. Player Interaction and Inventory System

### 5.1 Inventory-Based Placement

* Each level provides a **limited inventory**
* All inventory items **must be placed** before simulation can start
* Inventory items are placed in a **first-person (FPS) camera mode**

### 5.2 Placeable Item Types

| Item                 | Behavior                          |
| -------------------- | --------------------------------- |
| Rock                 | Static obstacle                   |
| Spiked Rock          | Lethal obstacle                   |
| Current (Flow Field) | Applies directional force         |
| Spotlight            | Fish avoid illuminated regions    |
| Predator (Shark)     | Actively hunts fish               |
| Bait (Food)          | Attracts fish toward its location |

A bait item is **mandatory at the goal location**.

### 5.3 Runtime Modification Rules

* All placed objects are **locked during simulation**
* **Exception**: Predator behavior is dynamic by nature

---

## 6. Predator System

### 6.1 Predator AI Behavior

* Predator continuously searches for the **nearest fish within detection range**
* Moves directly toward the target fish
* Upon reaching the fish, the fish is removed (killed)

### 6.2 AI Complexity

* No global pathfinding required
* Pure local steering-based movement
* Behavior is deterministic and simple by design

---

## 7. Camera and Controls

### 7.1 Camera Mode

* Fully free **FPS camera**
* No alternative camera modes

### 7.2 Controls

* Mouse: Look around
* Keyboard:

  * WASD: horizontal movement
  * Space: move up
  * Shift: move down

### 7.3 Special Camera Transitions

* Keyboard shortcut moves camera to:

  * Group member name area (top-down view)
* Camera movement is animated (no teleportation)
* Camera orientation is computed relative to current position

---

## 8. Lighting System

### 8.1 Spotlight Requirements

* At least one movable spotlight exists in the scene
* Spotlight supports:

  * Translation and rotation (6 DOF)
  * On/off toggling
  * Intensity adjustment

### 8.2 Fish-Light Interaction

* Fish actively avoid regions illuminated by spotlight

---

## 9. Rendering and Shading

### 9.1 Mandatory Shader Programs

The project must include **at least two distinct shader programs**, each consisting of:

* One vertex shader
* One fragment shader

Shader programs must:

* Be written manually in GLSL
* Exist as separate source files
* Affect the **entire rendered scene**

### 9.2 Shader Types

* Shader Program 1: Realistic lighting (e.g., Phong / Blinn-Phong)
* Shader Program 2: Stylized or non-photorealistic underwater rendering

### 9.3 Shader Switching

* Shader switching occurs **instantly**
* Can be triggered at runtime by the user

### 9.4 Post-Processing

* No post-processing effects are used

---

## 10. Scoring System

### 10.1 Score Initialization

* Score starts at **100** at simulation start

### 10.2 Score Reduction

* Each fish death reduces the score
* Score is also influenced by:

  * Time taken for fish to reach the goal

### 10.3 Score Visibility

* Score is displayed continuously during simulation
* Final score is emphasized upon completion

### 10.4 Feedback

* Visual feedback:

  * Green score: success
  * Red score: failure
* Audio feedback:

  * Success sound
  * Failure sound

---

## 11. Help and User Guidance

### 11.1 Help Menu

* Pressing `H` / `h` toggles the help menu
* Help menu describes:

  * Controls
  * Gameplay rules
  * Inventory usage
  * Camera shortcuts

---

## 12. Technical Constraints

### 12.1 Technology Stack

* WebGL 2.x
* JavaScript (modular architecture)
* GLSL
* HTML

### 12.2 External Libraries

* Any external library may be used
* All libraries must be cited in the final presentation

---

## 13. Extensibility and Future-Proofing

The design intentionally allows:

* Toggling fish–fish collision deaths
* Adjusting boids parameters per level
* Adding new inventory items
* Increasing AI complexity
* Introducing additional shader programs

---

## 14. Out of Scope

* Multiplayer support
* Post-processing effects
* Advanced global pathfinding systems

---

## 15. Conclusion

Flocking Frenzy combines emergent behavior simulation with puzzle-driven level design. By separating preparation and simulation phases, the project enables meaningful player interaction while showcasing advanced graphics programming, shader design, and AI steering behaviors in a WebGL environment.
