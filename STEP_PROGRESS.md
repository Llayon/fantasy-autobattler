# Development Progress

> Post-MVP development tracking. For MVP history (Steps 1-65), see `docs/archive/STEP_PROGRESS_MVP.md`.

## Current Status

**Version:** Post-MVP (v0.1.0+)  
**Phase:** 6 - Core Extraction & Documentation

---

## Phase 6: Core Extraction (Steps 66-75)

| Step | Task | Status | Notes |
|------|------|--------|-------|
| 66 | Create core folder structure | ⬜ | `backend/src/core/` |
| 67 | Extract core types | ⬜ | GridConfig, BattleConfig |
| 68 | Extract grid module | ⬜ | grid.ts, pathfinding.ts |
| 69 | Extract battle module | ⬜ | damage.ts, turn-order.ts |
| 70 | Extract ability module | ⬜ | executor.ts, effects.ts |
| 71 | Move tests to core | ⬜ | Update imports |
| 72 | Create game module | ⬜ | `backend/src/game/` |
| 73 | Frontend core extraction | ⬜ | Components, hooks |
| 74 | Integration tests | ⬜ | Core independence |
| 75 | Documentation | ⬜ | CORE_LIBRARY.md |

---

## Phase 7: Documentation & Polish (Steps 76-80)

| Step | Task | Status | Notes |
|------|------|--------|-------|
| 76 | Archive MVP docs | ✅ | docs/archive/ |
| 77 | Move validation reports | ⬜ | docs/reports/ |
| 78 | Create CHANGELOG.md | ⬜ | Keep a Changelog format |
| 79 | Update ARCHITECTURE.md | ⬜ | Core/game layers |
| 80 | Update project-context.md | ⬜ | New structure |

---

## Phase 8: Roguelike Mode (Steps 81-100)

| Step | Task | Status | Notes |
|------|------|--------|-------|
| 81 | Faction system | ⬜ | 6 factions, 150 units |
| 82 | Leader system | ⬜ | 18 leaders |
| 83 | Spell system | ⬜ | Timing selection |
| 84 | Run entity | ⬜ | Database schema |
| 85 | Draft system | ⬜ | Initial + post-battle |
| 86 | Upgrade system | ⬜ | T1 → T2 → T3 |
| 87 | Budget progression | ⬜ | 10g → 65g |
| 88 | Async PvP | ⬜ | Snapshot matching |
| 89 | Rating system | ⬜ | Leagues |
| 90-100 | UI & Polish | ⬜ | Screens, animations |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete |
| 🔄 | In Progress |
| ⬜ | Not Started |
| ❌ | Blocked |

---

## Active Specs

| Spec | Status | Tasks |
|------|--------|-------|
| documentation-cleanup | 🔄 In Progress | 20 |
| core-extraction | ⬜ Ready | 24 |
| roguelike-run | ⬜ Ready | 36 |

---

*Last Updated: December 2025*
