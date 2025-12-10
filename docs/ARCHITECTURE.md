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
