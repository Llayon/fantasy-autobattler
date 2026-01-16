# Fantasy Autobattler - Project Context

## Overview
Browser-based asynchronous PvP autobattler in fantasy setting. Players build teams within a 30-point budget, place units on an 8×10 grid, and battle opponents. Battles are simulated server-side and replayed on client with full animations.

**Development Progress: ~65% Complete (65/100 steps)**

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand |
| Drag & Drop | @dnd-kit/core (touch-friendly) |
| i18n | next-intl (Russian/English) |
| Backend | NestJS 10, TypeScript, TypeORM, PostgreSQL |
| Infrastructure | Docker, GitHub Actions CI/CD |
| Testing | Jest (650+ tests), Playwright (planned) |

## Key Architectural Decisions

### 1. Layered Architecture
- **Controllers**: HTTP handling only, no business logic
- **Services**: All business logic, dependency injection
- **Entities**: TypeORM database schema
- **Pure Functions**: Complex computations (battle simulator, pathfinding, AI)

### 2. Guest Authentication
- No passwords, simple token-based auth
- Token stored in localStorage, sent via `x-guest-token` header
- UUID-based guest IDs

### 3. Deterministic Battle Simulation
- `simulateBattle()` is a pure function with seed parameter
- Same inputs + seed = identical output (enables replay)
- All randomness uses seeded PRNG
- AI decisions are deterministic (ID-based tiebreaking)

### 4. Grid-Based Combat (8×10)
- Player units: rows 0-1
- Enemy units: rows 8-9
- A* pathfinding for movement
- Manhattan distance for range calculations

### 5. Ability System
- 15 unique abilities (11 active, 4 passive)
- Status effects with duration tracking
- Role-based AI targeting strategies
- Synergy bonuses for team composition

## Game Parameters
| Parameter | Value |
|-----------|-------|
| Grid Size | 8×10 cells |
| Team Budget | 30 points |
| Unit Cost Range | 3-8 points |
| Max Units | Limited by budget only |
| Max Rounds | 100 |
| Synergies | 10 types |

## Unit Stats System
| Stat | Abbrev | Description |
|------|--------|-------------|
| Health | HP | Hit points, dies at 0 |
| Attack | ATK | Base damage |
| Attack Count | #ATK | Attacks per turn |
| Armor | BR | Reduces physical damage |
| Speed | СК | Movement cells per turn |
| Initiative | ИН | Turn order (higher = first) |
| Dodge | УК | % chance to avoid physical attack |
| Range | - | Attack range in cells |

## Units (15 Total)

### By Role
| Role | Units | Count |
|------|-------|-------|
| Tank | Knight, Guardian, Berserker | 3 |
| Melee DPS | Rogue, Duelist, Assassin | 3 |
| Ranged DPS | Archer, Crossbowman, Hunter | 3 |
| Mage | Mage, Warlock, Elementalist | 3 |
| Support | Priest, Bard | 2 |
| Control | Enchanter | 1 |

### Abilities
| Ability | Unit | Type | Effect |
|---------|------|------|--------|
| shield_wall | Knight | Active | +50% armor, 2 turns |
| taunt | Guardian | Active | Force targeting, 2 turns |
| rage | Berserker | Passive | +50% ATK when HP < 50% |
| backstab | Rogue | Passive | +100% damage from behind |
| riposte | Duelist | Passive | 30% counter-attack |
| execute | Assassin | Passive | +100% damage to low HP |
| volley | Archer | Active | AoE damage, radius 2 |
| piercing_shot | Crossbowman | Active | Ignores 50% armor |
| trap | Hunter | Active | Stun trap, 1 turn |
| fireball | Mage | Active | 30 magic AoE damage |
| drain_life | Warlock | Active | Damage + 50% lifesteal |
| chain_lightning | Elementalist | Active | Chains to 2 enemies |
| heal | Priest | Active | Restore 25 HP |
| inspire | Bard | Active | +20% ATK to all allies |
| stun | Enchanter | Active | Target skips turn |

### Synergies (10 Types)
| Synergy | Requirement | Bonus |
|---------|-------------|-------|
| Frontline | 2+ tanks | +10% HP |
| Magic Circle | 2+ mages | +15% ATK |
| Assassin Guild | 2+ melee DPS | +20% Dodge |
| Ranger Corps | 2+ ranged DPS | +10% ATK, +10% Speed |
| Healing Aura | 2+ supports | +15% HP |
| Balanced | tank + melee + support | +5% all stats |
| Arcane Army | mage + control | +10% ATK, +10% Initiative |
| Iron Wall | 3+ tanks | +20% Armor |
| Glass Cannon | 3+ mages (no tanks) | +25% ATK |
| Swift Strike | ranged + melee | +15% Initiative |

## File Structure

### Backend
```
backend/src/
├── core/           # 🆕 Reusable battle engine (game-agnostic)
│   ├── grid/       # Grid utilities, A* pathfinding
│   │   ├── grid.ts           # createEmptyGrid, isValidPosition, manhattanDistance
│   │   └── pathfinding.ts    # findPath, hasPath, findClosestReachablePosition
│   ├── battle/     # Combat calculations
│   │   ├── damage.ts         # calculatePhysicalDamage, rollDodge
│   │   ├── turn-order.ts     # buildTurnQueue, getNextUnit
│   │   └── targeting.ts      # selectTarget, findNearestEnemy
│   ├── mechanics/  # 🆕 Core 2.0 - Modular combat mechanics
│   │   ├── config/           # Types, defaults, presets, validation
│   │   ├── tier0/            # Facing (directional combat)
│   │   ├── tier1/            # Resolve, Engagement, Flanking
│   │   ├── tier2/            # Riposte, Intercept, Aura
│   │   ├── tier3/            # Charge, Overwatch, Phalanx, LoS, Ammo
│   │   ├── tier4/            # Contagion, Armor Shred
│   │   └── processor.ts      # MechanicsProcessor factory
│   ├── progression/ # Core 3.0 - Roguelike progression systems
│   │   ├── deck/             # Card collection (createDeck, shuffleDeck, drawCards)
│   │   ├── hand/             # Hand management (createHand, addToHand)
│   │   ├── draft/            # Pick/ban drafting (createDraft, pickCard)
│   │   ├── upgrade/          # Tier upgrades (upgradeCard, getUpgradeCost)
│   │   ├── economy/          # Currency/rewards (createWallet, getReward)
│   │   ├── run/              # Run progression (createRun, recordWin)
│   │   └── snapshot/         # Async matchmaking (findOpponent, generateBot)
│   ├── types/      # Core type definitions
│   ├── utils/      # Seeded random (seededRandom, SeededRandom)
│   ├── events/     # Event emitter (createEventEmitter)
│   └── constants/  # Default values
├── game/           # 🆕 Game-specific content
│   ├── units/      # 15 unit definitions (unit.data.ts)
│   ├── abilities/  # Ability data (ability.data.ts)
│   ├── config/     # Game constants
│   ├── constants/  # TEAM_LIMITS, UNIT_ROLES
│   └── battle/     # Synergies, AI, bot generator
├── battle/         # Battle orchestration (NestJS services)
│   ├── battle.simulator.ts    # Main simulation loop
│   ├── battle.service.ts      # NestJS service
│   ├── ability.executor.ts    # Ability execution
│   ├── status-effects.ts      # Buff/debuff system
│   └── passive.abilities.ts   # Passive ability system
├── auth/           # Guest authentication
├── common/         # Filters, interceptors, exceptions
├── config/         # Game constants (re-exports from core/game)
├── entities/       # TypeORM entities
├── health/         # Health check endpoints
├── matchmaking/    # PvP matchmaking queue
├── player/         # Player profile & stats
├── rating/         # ELO rating system
├── team/           # Team building & validation
├── types/          # Shared TypeScript types (re-exports)
└── unit/           # Unit controller (re-exports)
```

### Frontend
```
frontend/src/
├── core/           # 🆕 Reusable types and hooks
│   ├── types/      # Position, GridConfig, GridCell
│   └── hooks/      # useGridNavigation
├── app/            # Next.js pages
│   ├── page.tsx           # Team Builder (main)
│   ├── battle/[id]/       # Battle Replay
│   ├── history/           # Battle History
│   └── profile/           # Player Profile
├── components/     # 50+ React components
│   ├── AbilityAnimations.tsx
│   ├── AbilityBar.tsx
│   ├── AbilityIcon.tsx
│   ├── BattleGrid.tsx
│   ├── BattleReplay.tsx
│   ├── BattleResult.tsx
│   ├── BudgetIndicator.tsx
│   ├── DragDropProvider.tsx
│   ├── EnhancedBattleGrid.tsx
│   ├── ErrorStates.tsx
│   ├── LoadingStates.tsx
│   ├── MatchmakingPanel.tsx
│   ├── Navigation.tsx
│   ├── SavedTeamsModal.tsx
│   ├── StatusEffects.tsx
│   ├── SynergyDisplay.tsx
│   ├── TeamSummary.tsx
│   ├── UnitCard.tsx
│   ├── UnitDetailModal.tsx
│   └── UnitList.tsx
├── i18n/           # Internationalization
├── lib/            # API client, utilities
├── store/          # Zustand stores
│   ├── playerStore.ts
│   ├── teamStore.ts
│   ├── battleStore.ts
│   ├── matchmakingStore.ts
│   └── uiStore.ts
├── styles/         # CSS animations
└── types/          # TypeScript types
```

## Documentation Files
| File | Purpose |
|------|---------|
| `docs/GAME_DESIGN_DOCUMENT.md` | Full GDD with mechanics, units, UI |
| `docs/ROGUELIKE_DESIGN.md` | Roguelike mode GDD (6 factions, 18 leaders) |
| `docs/AI_DEVELOPMENT_PLAN.md` | 100-step development plan |
| `docs/ARCHITECTURE.md` | System architecture & data flow |
| `docs/CORE_LIBRARY.md` | Core engine API (Core 1.0 + 3.0) |
| `backend/src/core/README.md` | Core module documentation |
| `backend/src/core/progression/README.md` | Progression systems documentation |
| `docs/ENGINEERING_GUIDE.md` | Coding standards, JSDoc, logging |
| `docs/ANTIPATTERNS.md` | Forbidden practices |
| `docs/ACCESSIBILITY.md` | Accessibility guidelines |
| `docs/MOBILE_ACCESS.md` | Mobile development setup |
| `docs/archive/` | Historical MVP documentation |
| `docs/reports/` | Validation and verification reports |
| `CHANGELOG.md` | Version history |
| `STEP_PROGRESS.md` | Post-MVP development progress |
| `README.md` | Quick start guide |

## Development Standards

### Required for ALL Code
1. **JSDoc**: All public functions must have JSDoc with @param, @returns, @example
2. **Logging**: Use NestJS Logger with context (battleId, playerId, etc.)
3. **Types**: Explicit types, no `any`, no non-null assertions
4. **Tests**: 80% coverage target, deterministic tests

### Damage Formula
```
Physical: max(1, (ATK - armor) * atkCount)
Magic: ATK * atkCount (ignores armor)
Dodge: % chance to avoid physical attacks (max 50%)
```

### AI Decision Priority
```
Support: Heal wounded > Buff allies > Attack
Tank: Taunt > Defensive buff > Attack > Move
DPS: Execute low HP > Damage ability > Attack weakest
Mage: AoE if 2+ enemies > Single target > Attack
Control: Stun high threat > Attack
```

## Current Development Phase
**Phase 5: Polish & Optimization** — Battle replay UX, performance, accessibility

### Completed Phases
- ✅ Phase 1: Foundation (Steps 1-15)
- ✅ Phase 2: Matchmaking & Battles (Steps 16-30)
- ✅ Phase 3: Frontend Core (Steps 31-50)
- ✅ Phase 4: Abilities & Mechanics (Steps 51-65)

### Recent Additions (December 2025)
- Battle Replay UX improvements (active unit indicators, team colors, event markers)
- Debug mode toggle in profile settings
- Progress bar with clickable event markers
- Auto-scroll in event log
- Mobile access configuration
- **v0.1.0-mvp tag created** — frozen MVP state
- **Core extraction spec** — separating reusable engine code
- **Roguelike run spec** — 9 wins / 4 losses progression mode

## Git Branches

| Branch | Purpose |
|--------|---------|
| `main` | Active development |
| `mvp-stable` | Frozen MVP (v0.1.0) |
| `feature/roguelike-progression` | Roguelike run mode (planned) |

## Planned Architecture Changes

### Core Library Extraction ✅ (In Progress - PR 5)
Reusable engine code extracted to `backend/src/core/`:
- `core/grid/` — Grid utilities, A* pathfinding
- `core/battle/` — Damage, turn order, targeting
- `core/mechanics/` — **Core 2.0** Modular combat mechanics (14 systems)
- `core/progression/` — **Core 3.0** Deck, draft, upgrade, economy, run, snapshot
- `core/types/` — Core type definitions
- `core/utils/` — Seeded random for determinism
- `core/events/` — Event emitter system

### Core 2.0: Mechanics System ✅ Complete
Modular battle mechanics with feature flags:
- **Tier 0**: Facing (directional combat)
- **Tier 1**: Resolve, Engagement, Flanking
- **Tier 2**: Riposte, Intercept, Aura
- **Tier 3**: Charge, Overwatch, Phalanx, LoS, Ammunition
- **Tier 4**: Contagion, Armor Shred

Three presets available:
- `MVP_PRESET` — All disabled (Core 1.0 behavior)
- `TACTICAL_PRESET` — Tier 0-2 mechanics
- `ROGUELIKE_PRESET` — All 14 mechanics enabled

See `backend/src/core/mechanics/README.md` for documentation.

### Core 3.0: Progression Systems ✅ Complete
Seven reusable systems for roguelike/deckbuilder games:
- **Deck** — Card collection with shuffle, draw, validation
- **Hand** — Hand management with overflow handling
- **Draft** — Pick/ban card drafting with rerolls
- **Upgrade** — Tier-based upgrades (T1→T2→T3)
- **Economy** — Currency, rewards, interest
- **Run** — Win/loss tracking, phase cycling, streaks
- **Snapshot** — Async PvP matchmaking with bot fallback

All systems are generic, deterministic (seeded random), and immutable.
See `backend/src/core/progression/README.md` for full documentation.

Game-specific code moved to `backend/src/game/`:
- `game/units/` — Unit definitions
- `game/abilities/` — Ability data
- `game/battle/` — Synergies, AI, bot generator

Frontend core types in `frontend/src/core/`:
- `core/types/` — Position, GridConfig
- `core/hooks/` — useGridNavigation

See `backend/src/core/README.md` for API documentation.
See `.kiro/specs/core-extraction/` for full specification.

### Roguelike Run Mode (Future)
New progression system with:
- Faction-based deck building (12 units)
- Draft mechanics (initial 3/4, post-battle 1/3)
- Unit upgrades (T1 → T2 → T3)
- Budget progression (10g → 65g)
- Run end at 9 wins or 4 losses

See `.kiro/specs/roguelike-run/` for full specification.

## Kiro Specs

| Spec | Status | Description |
|------|--------|-------------|
| `documentation-cleanup` | 🔄 In Progress | Reorganize docs structure |
| `core-extraction` | 🔄 In Progress (PR 5) | Extract reusable engine code (Core 1.0) |
| `core-progression` | ✅ Complete | Progression systems (Core 3.0) |
| `core-mechanics-2.0` | ✅ Complete | Modular combat mechanics with feature flags |
| `roguelike-run` | ⬜ Ready | Roguelike progression mode (12 mechanics) |
| `battle-replay-ux` | ✅ Complete | Battle replay improvements |
| `hp-bar-visibility` | ✅ Complete | HP bar visibility |

See `docs/AI_DEVELOPMENT_PLAN.md` for detailed 100-step plan.
See `STEP_PROGRESS.md` for post-MVP progress.
