# Fantasy Autobattler - Project Context

## Overview
Browser-based asynchronous autobattler game with fantasy theme. Players build teams of 3 units and battle AI opponents.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand
- **Backend**: NestJS 10, TypeScript, TypeORM, PostgreSQL
- **Infrastructure**: Docker (PostgreSQL container)

## Key Architectural Decisions

### 1. Layered Architecture
- Controllers: HTTP handling only
- Services: Business logic
- Entities: Database schema
- Pure Functions: Complex computations (battle simulator)

### 2. Guest Authentication
- No passwords, simple token-based auth
- Token stored in localStorage, sent via `x-guest-token` header

### 3. Deterministic Battle Simulation
- `simulateBattle()` is a pure function
- Same inputs always produce same outputs
- Enables replay functionality

## File Structure Conventions

### Backend
```
src/
├── feature/
│   ├── feature.module.ts
│   ├── feature.controller.ts
│   ├── feature.service.ts
│   └── feature.guard.ts (if needed)
├── entities/
│   └── entity-name.entity.ts
└── main.ts
```

### Frontend
```
src/
├── app/           # Next.js pages
├── components/    # React components (PascalCase.tsx)
├── lib/           # Utilities (camelCase.ts)
├── store/         # Zustand stores
└── types/         # TypeScript types
```

## Important Files to Reference
- `docs/ENGINEERING_GUIDE.md` - Coding standards
- `docs/ANTIPATTERNS.md` - What NOT to do
- `docs/ARCHITECTURE.md` - System design

## Current Game Units
| Unit | HP | ATK | DEF | SPD | Special |
|------|-----|-----|-----|-----|---------|
| Warrior | 100 | 15 | 10 | 5 | Taunt |
| Mage | 60 | 25 | 3 | 8 | Splash (2 targets) |
| Healer | 70 | 8 | 5 | 10 | Heal 15 HP |
