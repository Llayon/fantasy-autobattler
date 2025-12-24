# Design: Documentation Cleanup

## Architecture Overview

### Target Documentation Structure

```
/                                    # Root (clean, minimal)
├── README.md                        # Quick start, architecture overview
├── CHANGELOG.md                     # NEW: Version history
├── STEP_PROGRESS.md                 # Concise post-MVP progress
├── docker-compose.yml
├── package.json
│
├── docs/                            # All documentation
│   ├── ARCHITECTURE.md              # Updated: core/game/api layers
│   ├── GAME_DESIGN_DOCUMENT.md      # Updated: + Roguelike section
│   ├── CORE_LIBRARY.md              # NEW: Core engine API
│   ├── ROGUELIKE_DESIGN.md          # NEW: Roguelike GDD
│   ├── AI_DEVELOPMENT_PLAN.md       # Updated: steps 66-130
│   ├── ENGINEERING_GUIDE.md         # No changes
│   ├── ANTIPATTERNS.md              # No changes
│   ├── ACCESSIBILITY.md             # No changes
│   │
│   ├── archive/                     # NEW: Historical docs
│   │   ├── STEP_PROGRESS_MVP.md     # Archived 9000+ lines
│   │   └── MVP_SUMMARY.md           # Consolidated summaries
│   │
│   └── reports/                     # NEW: Validation reports
│       ├── frontend-BattleReplay-ValidationReport.md
│       ├── frontend-UnitCard-ValidationReport.md
│       ├── backend-BATTLE_SIMULATOR_VERIFICATION.md
│       └── ...
│
├── .kiro/
│   ├── steering/
│   │   ├── project-context.md       # Updated: new structure
│   │   └── coding-rules.md          # No changes
│   │
│   └── specs/
│       ├── core-extraction/         # Active
│       ├── roguelike-run/           # Active
│       ├── performance-optimization/ # Active
│       ├── documentation-cleanup/   # Active (this spec)
│       ├── battle-replay-ux/        # + COMPLETED.md
│       └── hp-bar-visibility/       # + COMPLETED.md
│
├── backend/src/core/
│   └── README.md                    # NEW: Core modules docs
│
└── frontend/src/core/
    └── README.md                    # NEW: Core components docs
```

## Document Templates

### CHANGELOG.md Template

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Core library extraction (in progress)
- Documentation cleanup

## [0.1.0-mvp] - 2024-12-XX

### Added
- Complete battle simulation system with 15 units
- Team builder with drag-and-drop on 8×10 grid
- 15 unique abilities (11 active, 4 passive)
- 10 synergy bonuses
- Guest authentication system
- PvP matchmaking with ELO rating
- Battle replay with animations
- Internationalization (Russian/English)
- Mobile-responsive UI
- Debug mode for development

### Technical
- 650+ unit tests
- Deterministic battle simulation with seeded PRNG
- A* pathfinding algorithm
- TypeORM with PostgreSQL
- Next.js 14 with App Router
- Zustand state management
```

### docs/CORE_LIBRARY.md Template

```markdown
# Core Library Documentation

## Overview

The core library (`backend/src/core/` and `frontend/src/core/`) contains 
game-agnostic modules that can be reused across multiple projects.

## Backend Core Modules

### Grid System (`core/grid/`)

Position validation, distance calculations, and A* pathfinding.

#### Configuration

\`\`\`typescript
interface GridConfig {
  width: number;
  height: number;
  playerRows: number[];
  enemyRows: number[];
}
\`\`\`

#### Usage

\`\`\`typescript
import { isValidPosition, findPath, GridConfig } from '@core/grid';

const config: GridConfig = { width: 8, height: 10, playerRows: [0, 1], enemyRows: [8, 9] };
const valid = isValidPosition({ x: 3, y: 5 }, config);
const path = findPath(start, end, obstacles, config);
\`\`\`

### Battle Engine (`core/battle/`)

Damage calculations, turn order, and targeting algorithms.

#### Configuration

\`\`\`typescript
interface BattleConfig {
  maxRounds: number;
  minDamage: number;
  dodgeCapPercent: number;
}

interface DamageConfig {
  physicalFormula: (atk: number, armor: number, atkCount: number) => number;
  magicFormula: (atk: number, atkCount: number) => number;
}
\`\`\`

### Ability System (`core/abilities/`)

Generic ability execution and status effect management.

## Frontend Core Components

### BattleGrid

Generic grid renderer accepting GridConfig.

### UnitCard

Configurable unit display with custom stat rendering.

### BattleReplay

Event-driven replay player.

## Migration from Game-Specific Code

Original imports continue working via re-exports:

\`\`\`typescript
// Old (still works)
import { isValidPosition } from '../battle/grid';

// New (recommended)
import { isValidPosition } from '../core/grid';
\`\`\`
```

### docs/ROGUELIKE_DESIGN.md Template

> **Note**: This file already exists at `docs/ROGUELIKE_DESIGN.md` with full GDD.

Key sections in the document:
- **6 Factions**: Order, Chaos, Nature, Shadow, Arcane, Machine (25 units each, 150 total)
- **18 Leaders**: 3 per faction with passive abilities and spells
- **Spell System**: 2 spells per deck with timing selection (Early/Mid/Late)
- **Deck Building**: 14 cards (12 units + 2 spells)
- **Draft System**: Initial 3/5, post-battle 1/3
- **Upgrade Tiers**: T1 → T2 (+25%) → T3 (+50%)
- **Budget Progression**: 10g → 65g over 9 battles
- **Async PvP**: Match against player snapshots
- **Rating System**: ELO with leagues (Bronze → Diamond)

## File Movement Plan

### Reports to Move

| Source | Destination |
|--------|-------------|
| `frontend/src/components/*-Report.md` | `docs/reports/frontend-*.md` |
| `frontend/src/components/*-ValidationReport.md` | `docs/reports/frontend-*.md` |
| `backend/src/battle/*_VERIFICATION.md` | `docs/reports/backend-*.md` |

### Files to Archive

| Source | Destination |
|--------|-------------|
| `STEP_PROGRESS.md` | `docs/archive/STEP_PROGRESS_MVP.md` |
| `STEP2_ACTIVE_UNIT_SUMMARY.md` | Consolidate to `docs/archive/MVP_SUMMARY.md` |
| `STEP3_TEAM_COLOR_CODING_SUMMARY.md` | Consolidate to `docs/archive/MVP_SUMMARY.md` |
| `STEP4_PROGRESS_BAR_MARKERS_SUMMARY.md` | Consolidate to `docs/archive/MVP_SUMMARY.md` |
| `DEBUG_MODE_SUMMARY.md` | Consolidate to `docs/archive/MVP_SUMMARY.md` |
| `DEVELOPMENT_PLAN.md` | `docs/archive/DEVELOPMENT_PLAN_OLD.md` |
| `docs/BATTLE_REPLAY_UX_ANALYSIS.md` | `docs/archive/` |
| `docs/BATTLE_REPLAY_UX_EXPERT_ANALYSIS.md` | `docs/archive/` |
| `docs/UI_REDESIGN_PLAN.md` | `docs/archive/` |

### Files to Delete (after archiving)

| File | Reason |
|------|--------|
| `MOBILE_ACCESS_SETUP.md` | Move to docs/ or consolidate |
| `MOBILE_QUICK_START.md` | Move to docs/ or consolidate |
| `КАК_ПОДКЛЮЧИТЬСЯ_С_ТЕЛЕФОНА.txt` | Consolidate with mobile docs |
| `battle_log.json` | Test artifact, should be in .gitignore |

### README Files to Move (frontend/src/components/)

| Source | Destination |
|--------|-------------|
| `README-UnitCardRefactor.md` | `docs/reports/frontend-UnitCardRefactor.md` |
| `README-ResponsiveTeamBuilder.md` | `docs/reports/frontend-ResponsiveTeamBuilder.md` |
| `README-MobileUX.md` | `docs/reports/frontend-MobileUX.md` |
| `README-DesktopLayout.md` | `docs/reports/frontend-DesktopLayout.md` |
| `README-DesignSpecCompliance.md` | `docs/reports/frontend-DesignSpecCompliance.md` |
| `README-ColorScheme.md` | `docs/reports/frontend-ColorScheme.md` |

## Update Checklist

### README.md Updates

- [ ] Add "Architecture" section with core/game diagram
- [ ] Update "Project Structure" section
- [ ] Add link to CHANGELOG.md
- [ ] Add link to docs/CORE_LIBRARY.md

### docs/ARCHITECTURE.md Updates

- [ ] Add "Core Library" section
- [ ] Update folder structure diagram
- [ ] Describe core/game/api separation
- [ ] Add dependency diagram

### docs/GAME_DESIGN_DOCUMENT.md Updates

- [ ] Add "Roguelike Run Mode" section
- [ ] Reference docs/ROGUELIKE_DESIGN.md for details

### .kiro/steering/project-context.md Updates

- [ ] Update "File Structure" section
- [ ] Add core/ and game/ folders
- [ ] Update "Documentation Files" table
- [ ] Add new specs to list

### docs/AI_DEVELOPMENT_PLAN.md Updates

- [ ] Add Phase 6: Core Extraction (Steps 66-75)
- [ ] Add Phase 7: Roguelike Mode (Steps 76-100)
- [ ] Add Phase 8: Polish & Launch (Steps 101-130)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Broken links after moves | Search & replace all references |
| Lost history | Git preserves history, archive files |
| Missing reports | Verify all files moved before delete |
