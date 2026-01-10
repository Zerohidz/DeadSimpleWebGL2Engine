# Flocking Frenzy - 5 Day Implementation Plan (Day 0 + 4 Days)

**Project:** DeadSimpleWebGL2Engine → Flocking Frenzy  
**Team Size:** 4 developers  
**Timeline:** 5 days total (January 10-15, 2026)  
  - **Day 0 (Jan 10):** Refactoring & Project Restructuring 🔧
  - **Day 1-4 (Jan 11-14):** Feature Implementation
  - **Day 5 (Jan 15):** Presentation & Demo
**Final Deadline:** January 15, 2026 (Presentation + Demo Video)  
**Strategy:** Refactor first (solid foundation) → BBM414 requirements → Boids gameplay → Polish

---

## 📋 Quick Navigation

- [Day 0: Refactoring](#day-0-refactoring-and-project-restructuring-) ← **START HERE**
- [Day 1: Infrastructure & GLSL Separation](#day-1-infrastructure--critical-requirements)
- [Day 2: BBM414 Features](#day-2-mandatory-bbm414-features)
- [Day 3: Boids & Scoring](#day-3-boids-gameplay--scoring)
- [Day 4: Level System & Polish](#day-4-level-system-inventory--polish)
- [Day 5: Presentation](#january-15-presentation-day)
- [Team Roles](#team-structure-and-roles)
- [Git Workflow](#git-workflow-strategy)
- [Risk Management](#risk-management)

---

## Team Structure and Roles

| Developer | Primary Focus | Backup Tasks |
|-----------|---------------|--------------|
| **Dev 1** | Shader Pipeline (critical path) | Help menu, post-processing |
| **Dev 2** | Lighting & Spotlight | Name scene, camera transitions |
| **Dev 3** | Boids Algorithm (parallel work) | Inventory system, fish AI |
| **Dev 4** | Scoring & UI/UX | Level system, audio feedback |

**Collaboration Points:**
- Daily standup (morning): sync progress, resolve blockers
- Merge window (evening): integrate feature branches to `main`
- Code review: at least 1 other dev must review before merge

---

## Git Workflow Strategy

### Branch Structure

```
main (protected, always deployable)
├── day0-refactoring
│   ├── feature/modularize-architecture
│   ├── feature/declarative-gui
│   └── feature/code-quality
├── day1-infrastructure
│   ├── feature/glsl-file-separation
│   ├── feature/shader-manager
│   └── feature/spotlight-implementation
├── day2-mandatory-features
│   ├── feature/underwater-shader
│   ├── feature/help-menu
│   └── feature/name-scene
├── day3-boids-gameplay
│   ├── feature/boids-core
│   ├── feature/instanced-rendering
│   └── feature/scoring-system
└── day4-polish-integration
    ├── feature/level-system
    ├── feature/inventory-placement
    └── feature/demo-video-prep
```

### Commit Convention

Format: `[TYPE] Brief description (#issue-number)`

**Types:**
- `[INFRA]` - Infrastructure, refactoring
- `[FEAT]` - New feature
- `[FIX]` - Bug fix
- `[SHADER]` - Shader code changes
- `[DOCS]` - Documentation
- `[TEST]` - Testing, verification
- `[MERGE]` - Branch merge
- `[REFACTOR]` - Code restructuring without behavior change

**Example:**
```bash
git commit -m "[REFACTOR] Extract Camera into separate module"
git commit -m "[SHADER] Separate GLSL code into .vert/.frag files"
git commit -m "[FEAT] Implement declarative GUI system"
```

---

> **⚠️ IMPORTANT: Start with Day 0!**  
> Do NOT skip the refactoring phase. It's the foundation for parallel development and prevents merge conflicts.

---

[REST OF DOCUMENT CONTINUES WITH FULL DAY 0-4 DETAILS FROM ARTIFACT...]

---

## Document Version

**Version:** 2.0 (Added Day 0 Refactoring Phase)  
**Last Updated:** 2026-01-10  
**Status:** Ready for team review

