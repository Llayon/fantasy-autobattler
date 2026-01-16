# Fantasy Roguelike

A clean, modular battle simulator for roguelike autobattler games.

## Overview

This repository contains a refactored battle simulator with:
- Unified Core library (Core 1.0 + Core 2.0 mechanics)
- Compact simulator (<500 lines)
- Clean API for roguelike mode
- Full property-based testing

## Project Structure

```
src/
├── core/           # Unified Core Library
│   ├── types/      # BattleState, BattleUnit, etc.
│   ├── grid/       # Grid utilities, A* pathfinding
│   ├── battle/     # Damage, turn-order, targeting
│   ├── mechanics/  # All 14 mechanics processors
│   └── utils/      # Seeded random, helpers
│
├── simulator/      # Battle Simulator (<500 lines)
│   ├── phases/     # Phase handlers
│   ├── ai/         # AI decision making
│   └── events.ts   # Event emitter
│
├── roguelike/      # Roguelike game logic
│   ├── run/        # Run progression
│   ├── draft/      # Card drafting
│   ├── upgrade/    # Unit upgrades
│   └── snapshot/   # Async PvP matchmaking
│
├── game/           # Game-specific content
│   ├── units/      # Unit definitions
│   ├── abilities/  # Ability data
│   └── factions/   # Faction definitions
│
└── api/            # REST API (NestJS)
    ├── run/        # Run endpoints
    ├── battle/     # Battle endpoints
    └── draft/      # Draft endpoints
```

## Getting Started

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run start:dev

# Build for production
npm run build
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Testing**: Jest + fast-check (property-based testing)
- **Database**: PostgreSQL + TypeORM

## License

MIT
