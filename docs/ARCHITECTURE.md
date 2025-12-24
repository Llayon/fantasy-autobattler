# 🏛️ Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │    State (Zustand)      │  │
│  │  /          │  │ TeamBuilder │  │  - player               │  │
│  │  /battle/id │  │ BattleReplay│  │  - selectedTeam         │  │
│  │             │  │ UnitCard    │  │  - loading/error        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                           │                                      │
│                    ┌──────┴──────┐                               │
│                    │  API Client │                               │
│                    │  (lib/api)  │                               │
│                    └──────┬──────┘                               │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTP (localhost:3000 → 3001)
                            │ Header: x-guest-token
┌───────────────────────────┼─────────────────────────────────────┐
│                         BACKEND                                  │
│                    ┌──────┴──────┐                               │
│                    │ Controllers │                               │
│                    │ REST API    │                               │
│                    └──────┬──────┘                               │
│                           │                                      │
│  ┌────────────────────────┼────────────────────────────────┐    │
│  │                    Services                              │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │ AuthService │  │PlayerService│  │  BattleService  │  │    │
│  │  │ - guest     │  │ - getPlayer │  │  - startBattle  │  │    │
│  │  │ - validate  │  │ - updateTeam│  │  - getBattle    │  │    │
│  │  └─────────────┘  └─────────────┘  └────────┬────────┘  │    │
│  └─────────────────────────────────────────────┼───────────┘    │
│                                                │                 │
│                                    ┌───────────┴───────────┐    │
│                                    │   Battle Simulator    │    │
│                                    │   (Pure Function)     │    │
│                                    │   - deterministic     │    │
│                                    │   - no side effects   │    │
│                                    └───────────────────────┘    │
│                           │                                      │
│                    ┌──────┴──────┐                               │
│                    │   TypeORM   │                               │
│                    │  Entities   │                               │
│                    └──────┬──────┘                               │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │  PostgreSQL   │
                    │   (Docker)    │
                    └───────────────┘
```

## Code Organization

### Core vs Game Separation

The codebase separates reusable engine code from game-specific content:

```
backend/src/
├── core/                    # Reusable engine (game-agnostic) ✅
│   ├── grid/                # Grid utilities, A* pathfinding
│   │   ├── grid.ts          # createEmptyGrid, isValidPosition, manhattanDistance
│   │   └── pathfinding.ts   # findPath, hasPath, findClosestReachablePosition
│   ├── battle/              # Combat calculations
│   │   ├── damage.ts        # calculatePhysicalDamage, rollDodge, applyDamage
│   │   ├── turn-order.ts    # buildTurnQueue, getNextUnit, removeDeadUnits
│   │   └── targeting.ts     # selectTarget, findNearestEnemy, findWeakestEnemy
│   ├── types/               # Core type definitions
│   │   ├── grid.types.ts    # Position, GridCell, Grid
│   │   ├── battle.types.ts  # BattleUnit, BattleResult, TeamType
│   │   ├── ability.types.ts # AbilityEffect, StatusEffect
│   │   ├── config.types.ts  # GridConfig, BattleConfig
│   │   └── event.types.ts   # BattleEvent, MoveEvent, AttackEvent
│   ├── utils/               # Seeded random for determinism
│   │   └── random.ts        # seededRandom(), SeededRandom class
│   ├── events/              # Event system for battle logging
│   │   └── emitter.ts       # createEventEmitter, createEventCollector
│   ├── constants/           # Default values
│   └── abilities/           # (types only, implementation in battle/)
│
├── game/                    # Game-specific (Fantasy Autobattler) ✅
│   ├── units/               # 15 unit definitions (unit.data.ts)
│   ├── abilities/           # Ability data (ability.data.ts)
│   ├── config/              # Game constants (grid 8×10, budget 30)
│   ├── constants/           # TEAM_LIMITS, UNIT_ROLES
│   └── battle/              # Synergies, AI, bot generator
│       ├── synergies.ts     # 10 synergy definitions
│       ├── ai.decision.ts   # Role-based AI targeting
│       └── bot-generator.ts # Random bot team generation
│
├── battle/                  # Battle orchestration (NestJS services)
│   ├── battle.simulator.ts  # Main simulation loop
│   ├── battle.service.ts    # NestJS service (DB, matchmaking)
│   ├── ability.executor.ts  # Ability execution
│   ├── status-effects.ts    # Buff/debuff management
│   └── passive.abilities.ts # Passive ability triggers
│
└── [other modules]          # auth/, player/, team/, matchmaking/, entities/

frontend/src/
├── core/                    # Reusable types and hooks ✅
│   ├── types/               # Position, GridConfig, GridCell
│   └── hooks/               # useGridNavigation
│
└── [existing modules]       # App pages, game-specific components
```

### Core Module Principles

1. **Zero game dependencies**: Core modules never import from `game/`, `unit/`, or `abilities/`
2. **Configurable**: All functions accept optional config parameters (GridConfig, BattleConfig)
3. **Deterministic**: Same inputs + seed = same outputs (enables replays)
4. **Minimal interfaces**: Core uses minimal unit interfaces (GridUnit, DamageUnit, etc.)
5. **Pure functions**: No side effects, no database, no NestJS dependencies

### Import Rules

```typescript
// ✅ ALLOWED
import { findPath } from '@core/grid';           // game → core
import { UNIT_DATA } from '@game/units';         // battle → game
import { calculateDamage } from '../core/battle'; // relative within backend

// ❌ FORBIDDEN
import { UNIT_DATA } from '@game/units';         // core → game (NEVER!)
import { BattleService } from '../battle';       // core → NestJS service
```

See `backend/src/core/README.md` for API documentation.
See `docs/CORE_LIBRARY.md` for design rationale.

## Layer Responsibilities

### Frontend Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Pages | `app/` | Route handling, data fetching, layout |
| Components | `components/` | UI rendering, user interaction |
| Store | `store/` | Global state, async actions |
| API Client | `lib/api.ts` | HTTP requests, token management |
| Types | `types/` | TypeScript interfaces |

### Backend Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Controllers | `*/controller.ts` | HTTP handling, validation, response |
| Services | `*/service.ts` | Business logic, orchestration |
| Entities | `entities/` | Database schema, relations |
| Guards | `auth/guard.ts` | Authentication, authorization |
| Pure Functions | `battle/simulator.ts` | Stateless computation |

## Data Flow

### Battle Start Flow

```
1. User clicks "Start Battle"
   │
2. Frontend: gameStore.startBattle()
   │
3. API Client: POST /battle/start
   │ Header: x-guest-token
   │
4. GuestGuard: validates token
   │
5. BattleController: calls service
   │
6. BattleService:
   │  a. Load player from DB
   │  b. Generate bot team (random)
   │  c. Call simulateBattle() ← Pure function
   │  d. Update player stats (wins/losses)
   │  e. Save battle log to DB
   │  f. Return battleId
   │
7. Frontend: redirect to /battle/[id]
   │
8. BattleReplay: fetch & animate events
```

## Database Schema

```
┌─────────────────────┐       ┌─────────────────────┐
│       Player        │       │      BattleLog      │
├─────────────────────┤       ├─────────────────────┤
│ id: UUID (PK)       │──────<│ id: UUID (PK)       │
│ guestId: string     │       │ playerId: UUID (FK) │
│ name: string        │       │ playerTeam: JSON    │
│ team: JSON          │       │ botTeam: JSON       │
│ wins: int           │       │ events: JSON        │
│ losses: int         │       │ winner: string      │
│ createdAt: datetime │       │ createdAt: datetime │
│ updatedAt: datetime │       └─────────────────────┘
└─────────────────────┘
```

## Key Design Decisions

### 1. Deterministic Battle Simulation
Battle simulator is a **pure function** - same inputs always produce same outputs. This enables:
- Replay functionality
- Easy testing
- Potential future: client-side prediction

### 2. Guest Authentication
Simple token-based auth without passwords:
- `POST /auth/guest` creates player + returns token
- Token stored in localStorage
- Sent via `x-guest-token` header
- No session management needed

### 3. JSON Columns for Flexible Data
Team composition and battle events stored as JSON:
- Flexible schema evolution
- No complex joins for replay data
- Trade-off: no referential integrity for nested data

### 4. Asynchronous Battle Model
Player doesn't wait for battle animation:
- Server simulates instantly
- Client fetches completed battle log
- Replay is purely client-side animation

## Module Dependencies

```
Backend:
  AppModule
    ├── TypeOrmModule (global)
    ├── AuthModule
    │     └── Player entity
    ├── PlayerModule
    │     ├── Player entity
    │     └── AuthModule (for guard)
    └── BattleModule
          ├── BattleLog entity
          ├── Player entity
          └── AuthModule (for guard)

Frontend:
  App
    ├── Zustand Store
    │     └── API Client
    ├── TeamBuilder
    │     └── UnitCard
    └── BattleReplay
          └── UnitDisplay
```


---

## Development Branches

| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | Active development | Current |
| `mvp-stable` | Frozen MVP (v0.1.0) | Stable |
| `feature/roguelike-progression` | Roguelike run mode | Planned |

### Version Tags
- `v0.1.0-mvp` — MVP release with team builder, async battles, replay system

---

## Future: Roguelike Run Mode

Planned progression system (9 wins / 4 losses format):

```
┌─────────────────────────────────────────────────────────────┐
│                      RUN START                               │
│  Select faction (6 options) → Select leader (3 per faction) │
│  Initial draft: Choose 3 from 5 random cards                │
│  Starting: 10g budget, 3 cards in hand                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BATTLE PHASE                              │
│  Place units on 8×2 landing zone (budget: 10g → 65g)        │
│  Select spell timing (Early/Mid/Late)                       │
│  Fight opponent snapshot (async, deterministic)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DRAFT PHASE                               │
│  Choose 1 from 3 cards (add to hand)                        │
│  Optional: Upgrade units (T1 → T2 → T3)                     │
│  Optional: Buy spells from shop                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    [9 wins OR 4 losses → RUN END]
```

Key features:
- **6 Factions**: Order, Chaos, Nature, Shadow, Arcane, Machine (25 units each)
- **18 Leaders**: 3 per faction with passive abilities and spells
- **Spell System**: 2 spells per deck with timing selection
- **Deck Building**: 14 cards max (12 units + 2 spells)
- **Async PvP**: Match against player snapshots

New entities required:
- `Run` — Run state (deck, hand, wins, losses, gold)
- `Faction` — Faction definitions with bonuses
- `Leader` — Leader definitions with passives and spells
- `Snapshot` — Team snapshots for async matchmaking

See `docs/ROGUELIKE_DESIGN.md` for full GDD.
See `.kiro/specs/roguelike-run/` for implementation plan.
