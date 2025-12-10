# Fantasy Autobattler - Project Context

## Overview
Browser-based asynchronous PvP autobattler in fantasy setting. Players build teams within a 30-point budget, place units on an 8×10 grid, and battle opponents. Battles are simulated server-side and replayed on client.

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand |
| Backend | NestJS 10, TypeScript, TypeORM, PostgreSQL |
| Infrastructure | Docker, GitHub Actions CI/CD |
| Testing | Jest, Playwright (planned) |

## Key Architectural Decisions

### 1. Layered Architecture
- **Controllers**: HTTP handling only, no business logic
- **Services**: All business logic, dependency injection
- **Entities**: TypeORM database schema
- **Pure Functions**: Complex computations (battle simulator, pathfinding)

### 2. Guest Authentication
- No passwords, simple token-based auth
- Token stored in localStorage, sent via `x-guest-token` header
- UUID-based guest IDs

### 3. Deterministic Battle Simulation
- `simulateBattle()` is a pure function with seed parameter
- Same inputs + seed = identical output (enables replay)
- All randomness uses seeded PRNG

### 4. Grid-Based Combat (8×10)
- Player units: rows 0-1
- Enemy units: rows 8-9
- A* pathfinding for movement
- Manhattan distance for range calculations

## Game Parameters
| Parameter | Value |
|-----------|-------|
| Grid Size | 8×10 cells |
| Team Budget | 30 points |
| Unit Cost Range | 3-8 points |
| Max Units | Limited by budget only |
| Max Rounds | 100 |

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


## Planned Units (15 total)

### By Role
| Role | Units | Count |
|------|-------|-------|
| Tank | Knight, Guardian, Berserker | 3 |
| Melee DPS | Rogue, Duelist, Assassin | 3 |
| Ranged DPS | Archer, Crossbowman, Hunter | 3 |
| Mage | Mage, Warlock, Elementalist | 3 |
| Support | Priest, Bard | 2 |
| Control | Enchanter | 1 |

## File Structure

### Backend
```
backend/src/
├── auth/           # Guest authentication
├── player/         # Player profile & stats
├── team/           # Team building & validation (planned)
├── battle/         # Battle simulation & storage
├── matchmaking/    # PvP matchmaking (planned)
├── units/          # Unit definitions
├── entities/       # TypeORM entities
├── config/         # Game constants (planned)
└── types/          # Shared TypeScript types (planned)
```

### Frontend
```
frontend/src/
├── app/            # Next.js pages
│   ├── page.tsx           # Team Builder
│   ├── battle/[id]/       # Battle Replay
│   ├── history/           # Battle History (planned)
│   └── profile/           # Player Profile (planned)
├── components/     # React components
├── lib/            # API client, utilities
├── store/          # Zustand state management
└── types/          # TypeScript types
```

## Documentation Files
| File | Purpose |
|------|---------|
| `docs/GAME_DESIGN_DOCUMENT.md` | Full GDD with mechanics, units, UI |
| `docs/AI_DEVELOPMENT_PLAN.md` | 100-step development plan with prompts |
| `docs/ARCHITECTURE.md` | System architecture & data flow |
| `docs/ENGINEERING_GUIDE.md` | Coding standards, JSDoc, logging |
| `docs/ANTIPATTERNS.md` | Forbidden practices |
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
Dodge: % chance to avoid physical attacks
```

## Current Development Phase
**Phase 1: Foundation** — Core types, grid system, battle logic

See `docs/AI_DEVELOPMENT_PLAN.md` for detailed 100-step plan.
