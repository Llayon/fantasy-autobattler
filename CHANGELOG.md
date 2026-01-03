# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Core 2.0: Mechanics System** — Modular combat mechanics with feature flags
  - `core/mechanics/config/` — Types, defaults, presets, validation
  - `core/mechanics/tier0/` — Facing (directional combat N/S/E/W)
  - `core/mechanics/tier1/` — Resolve (morale), Engagement (ZoC), Flanking (+15%/+30% damage)
  - `core/mechanics/tier2/` — Riposte (counter-attack), Intercept (movement blocking), Aura (area effects)
  - `core/mechanics/tier3/` — Charge (momentum), Overwatch (vigilance), Phalanx (formation), LoS (line of sight), Ammunition
  - `core/mechanics/tier4/` — Contagion (status spread), Armor Shred (armor degradation)
  - `MechanicsProcessor` factory with phase hooks integration
  - Three presets: `MVP_PRESET`, `TACTICAL_PRESET`, `ROGUELIKE_PRESET`
  - Automatic dependency resolution for mechanics
  - 2650+ tests including integration, snapshot, and benchmark tests
- Core library extraction (`backend/src/core/`) — game-agnostic battle engine
  - `core/grid/` — Grid utilities, A* pathfinding with configurable dimensions
  - `core/battle/` — Damage calculations, turn order, targeting strategies
  - `core/types/` — Core type definitions (Position, GridConfig, BattleConfig)
  - `core/utils/` — Seeded random (SeededRandom class, seededRandom function)
  - `core/events/` — Event emitter system (createEventEmitter, createEventCollector)
  - `core/constants/` — Default battle and grid constants
- Game-specific module (`backend/src/game/`)
  - `game/units/` — 15 unit definitions
  - `game/abilities/` — Ability data
  - `game/battle/` — Synergies, AI decision, bot generator
- Frontend core types (`frontend/src/core/`)
  - `core/types/` — Position, GridConfig, GridCell
  - `core/hooks/` — useGridNavigation hook
- Core integration tests (24 tests covering grid, damage, turn order, targeting, seeded random)
- `verify:core` npm script to validate core module independence
- CI pipeline step for core import verification
- Documentation cleanup and reorganization
- `docs/archive/` for historical MVP documentation
- `docs/reports/` for validation and verification reports
- New `STEP_PROGRESS.md` for post-MVP tracking

### Changed
- Moved grid.ts, pathfinding.ts to `core/grid/` (re-exports in original locations)
- Moved damage.ts, turn-order.ts, targeting.ts to `core/battle/` (re-exports in original locations)
- Moved unit.data.ts to `game/units/`
- Moved ability.data.ts to `game/abilities/`
- Moved synergies.ts, ai.decision.ts, bot-generator.ts to `game/battle/`
- Consolidated seededRandom implementations (was duplicated in 3 files)
- Updated ARCHITECTURE.md with core/game separation
- Updated project-context.md with new file structure
- Moved 46 validation reports to `docs/reports/`
- Archived MVP progress files to `docs/archive/`
- Consolidated step summaries into `MVP_SUMMARY.md`

### Technical
- 750+ unit tests (up from 650+)
- Path aliases: `@core/*`, `@game/*` in tsconfig.json
- All core modules are pure TypeScript with zero NestJS dependencies
- Core modules have zero imports from game-specific code

---

## [0.1.0-mvp] - 2024-12-23

### Added

#### Battle System
- Complete battle simulation with 15 unique units
- Deterministic simulation with seeded PRNG
- A* pathfinding for unit movement
- 15 abilities (11 active, 4 passive)
- 10 synergy bonuses for team composition
- Role-based AI targeting strategies

#### Team Builder
- Drag-and-drop unit placement on 8×10 grid
- 30-point budget system
- Team saving and loading
- Synergy display with active bonuses

#### Battle Replay
- Full animation playback
- Active unit indicators (yellow border + arrow)
- Team color coding in event log (blue/red dots)
- Progress bar with clickable event markers
- Auto-scroll to current event
- Debug mode with grid coordinates
- Playback speed control (0.25x - 4x)

#### Player System
- Guest authentication (token-based)
- Player profiles with statistics
- Battle history with replay access
- ELO rating system

#### Matchmaking
- PvP queue with rating-based matching
- Bot opponent fallback
- Real-time queue status

#### UI/UX
- Mobile-responsive design
- Internationalization (Russian/English)
- Accessibility compliance (WCAG 2.1)
- Loading and error states
- Undo/redo for team changes
- Autosave functionality

### Technical
- 650+ unit tests
- NestJS 10 backend with TypeORM
- Next.js 14 frontend with App Router
- Zustand state management
- Docker containerization
- GitHub Actions CI/CD

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0-mvp | 2024-12-23 | Initial MVP release |

---

*For detailed development history, see `docs/archive/STEP_PROGRESS_MVP.md`*
