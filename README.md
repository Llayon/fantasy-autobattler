# ⚔️ Fantasy Autobattler

Browser-based asynchronous PvP autobattler in fantasy setting. Build teams within a 30-point budget, place units on an 8×10 grid, and battle opponents with full replay visualization.

**Current Version: v0.1.0-mvp** | **Development Progress: ~65% Complete (65/100 steps)**

## 🌿 Branches

| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | Active development | Current |
| `mvp-stable` | Frozen MVP release | Stable |
| `feature/roguelike-progression` | Roguelike run mode | Planned |

## ✨ Features

### Implemented
- 🎮 **15 Unique Units** with distinct roles, stats, and abilities
- 🗺️ **8×10 Grid Combat** with A* pathfinding and strategic positioning
- ⚔️ **Deterministic Battle Simulation** with full replay support
- 🎯 **Ability System** with active/passive abilities, buffs, debuffs
- 🤖 **AI Decision Making** with role-based targeting strategies
- 📊 **Team Synergies** (10 synergy types with stat bonuses)
- 🎬 **Battle Replay** with animations, event markers, and speed controls
- 👤 **Player Profiles** with rating system and battle history
- 📱 **Responsive Design** with mobile support and touch interactions
- 🌐 **i18n Ready** (Russian/English)

### In Progress
- 🏆 PvP Matchmaking
- 🎨 Advanced animations
- 📈 Leaderboards

### Planned (Roguelike Mode)
- 🎴 Faction-based deck building
- 📈 Run progression (9 wins / 4 losses)
- ⬆️ Unit upgrades (T1 → T2 → T3)
- 💰 Gold economy and draft system

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 (App Router) | React framework with SSR |
| Styling | Tailwind CSS | Utility-first CSS |
| State | Zustand | Lightweight state management |
| Drag & Drop | @dnd-kit/core | Touch-friendly drag and drop |
| i18n | next-intl | Internationalization |
| Backend | NestJS 10 | Node.js framework with DI |
| ORM | TypeORM | Database abstraction |
| Database | PostgreSQL 15 | Relational database |
| Container | Docker | Local development |
| Language | TypeScript 5 | Strict type safety |
| Testing | Jest | 650+ unit tests |

## 📁 Project Structure

```
autobattler/
├── backend/                    # NestJS API Server
│   ├── src/
│   │   ├── abilities/         # Ability definitions (15 abilities)
│   │   ├── auth/              # Guest authentication
│   │   ├── battle/            # Battle simulation, AI, pathfinding
│   │   ├── common/            # Filters, interceptors, exceptions
│   │   ├── config/            # Game constants
│   │   ├── entities/          # TypeORM entities
│   │   ├── health/            # Health check endpoints
│   │   ├── matchmaking/       # PvP matchmaking queue
│   │   ├── player/            # Player management
│   │   ├── rating/            # ELO rating system
│   │   ├── team/              # Team building & validation
│   │   ├── types/             # TypeScript types
│   │   └── unit/              # Unit definitions (15 units)
│   └── package.json
│
├── frontend/                   # Next.js Web Client
│   ├── src/
│   │   ├── app/               # Next.js pages
│   │   │   ├── page.tsx       # Team Builder (main)
│   │   │   ├── battle/        # Battle pages
│   │   │   ├── history/       # Battle history
│   │   │   └── profile/       # Player profile
│   │   ├── components/        # 50+ React components
│   │   ├── i18n/              # Internationalization
│   │   ├── lib/               # API client, utilities
│   │   ├── store/             # Zustand stores
│   │   ├── styles/            # CSS animations
│   │   └── types/             # TypeScript types
│   ├── messages/              # Translation files (ru, en)
│   └── package.json
│
├── docs/                       # Documentation
│   ├── GAME_DESIGN_DOCUMENT.md
│   ├── AI_DEVELOPMENT_PLAN.md # 100-step development plan
│   ├── ARCHITECTURE.md
│   ├── ENGINEERING_GUIDE.md
│   ├── ACCESSIBILITY.md
│   ├── CORE_LIBRARY.md        # Core engine API (planned)
│   ├── ROGUELIKE_DESIGN.md    # Roguelike mode GDD
│   ├── MOBILE_ACCESS.md       # Mobile dev setup
│   ├── archive/               # Historical MVP docs
│   └── reports/               # Validation reports
│
├── .kiro/                      # Kiro IDE specs
│   ├── specs/                 # Feature specifications
│   └── steering/              # Project context
│
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- npm or yarn

### 1. Start Database
```bash
docker-compose up -d
```

### 2. Start Backend
```bash
cd backend
npm install
npm run start:dev
# API runs on http://localhost:3004
# Swagger docs: http://localhost:3004/api/docs
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

### 4. Play!
Open http://localhost:3000, build your team, and battle!

### 📱 Mobile Access (Same Network)
```bash
# See docs/MOBILE_ACCESS.md for detailed instructions
# Frontend: http://<your-ip>:3000
# Backend: http://<your-ip>:3004
```

## 🎮 Game Mechanics

### Units (15 Total)

| Role | Units | Cost | Key Stats |
|------|-------|------|-----------|
| 🛡️ Tank | Knight, Guardian, Berserker | 5-7 | High HP, Armor |
| ⚔️ Melee DPS | Rogue, Duelist, Assassin | 4-7 | High ATK, Dodge |
| 🏹 Ranged DPS | Archer, Crossbowman, Hunter | 4-6 | Range 4-5, Speed |
| 🔮 Mage | Mage, Warlock, Elementalist | 5-8 | Magic damage, AoE |
| 💚 Support | Priest, Bard | 5-6 | Healing, Buffs |
| ✨ Control | Enchanter | 6 | Stun, Debuffs |

### Abilities

| Ability | Unit | Effect |
|---------|------|--------|
| Shield Wall | Knight | +50% armor for 2 turns |
| Taunt | Guardian | Forces enemies to attack |
| Rage | Berserker | +50% ATK when HP < 50% |
| Backstab | Rogue | +100% damage from behind |
| Fireball | Mage | AoE magic damage |
| Heal | Priest | Restore 25 HP to ally |
| Stun | Enchanter | Target skips turn |

### Synergies (10 Types)

| Synergy | Requirement | Bonus |
|---------|-------------|-------|
| Frontline | 2+ Tanks | +10% HP |
| Magic Circle | 2+ Mages | +15% ATK |
| Balanced | Tank + Melee + Support | +5% all stats |
| Iron Wall | 3+ Tanks | +20% Armor |
| Glass Cannon | 3+ Mages (no tanks) | +25% ATK |

### Battle Flow
1. **Team Building**: Select units within 30-point budget
2. **Positioning**: Place units on 8×10 grid (rows 0-1)
3. **Battle**: Server simulates deterministically
4. **Replay**: Watch with animations, speed controls, event markers

### Combat Rules
- **Turn Order**: Initiative → Speed → ID (deterministic)
- **Physical Damage**: `max(1, (ATK - armor) * atkCount)`
- **Magic Damage**: `ATK * atkCount` (ignores armor)
- **Dodge**: % chance to avoid physical attacks
- **Max Rounds**: 100 (draw if exceeded)

## 🔌 API Reference

### Authentication
All endpoints (except `/auth/guest` and `/units`) require `x-guest-token` header.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/guest` | Create guest session |
| `GET` | `/player/me` | Get current player |
| `PUT` | `/player/name` | Update player name |
| `GET` | `/units` | Get all units |
| `GET` | `/units/:id` | Get unit by ID |
| `GET` | `/units/roles/:role` | Get units by role |
| `POST` | `/team` | Create team |
| `GET` | `/team` | Get player's teams |
| `PUT` | `/team/:id` | Update team |
| `DELETE` | `/team/:id` | Delete team |
| `POST` | `/team/:id/activate` | Activate team |
| `POST` | `/battle/start` | Start battle vs bot |
| `GET` | `/battle/:id` | Get battle replay |
| `GET` | `/battle` | List player's battles |
| `POST` | `/matchmaking/queue` | Join matchmaking |
| `DELETE` | `/matchmaking/queue` | Leave matchmaking |
| `GET` | `/health` | Health check |

**Swagger Documentation**: http://localhost:3004/api/docs

## 🛠️ Development

### Commands

```bash
# Backend
cd backend
npm run start:dev     # Development with hot reload
npm run build         # Production build
npm run test          # Run 650+ unit tests
npm run test:e2e      # E2E tests

# Frontend
cd frontend
npm run dev           # Development server
npm run build         # Production build
npm run lint          # Run ESLint

# Database
docker-compose up -d   # Start PostgreSQL
docker-compose down    # Stop PostgreSQL
```

### Environment Variables

Backend (`backend/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/autobattler
PORT=3004
```

Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3004
```

### Test Pages

| URL | Purpose |
|-----|---------|
| `/test-ability-animations` | Test ability animations |
| `/test-status-effects` | Test buff/debuff indicators |
| `/test-synergies` | Test synergy system |
| `/test-battle-replay` | Test replay controls |
| `/responsive-test` | Test responsive design |

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Game Design Document](./docs/GAME_DESIGN_DOCUMENT.md) | Full GDD with mechanics |
| [Roguelike Design](./docs/ROGUELIKE_DESIGN.md) | Roguelike mode GDD |
| [Architecture](./docs/ARCHITECTURE.md) | System design |
| [Core Library](./docs/CORE_LIBRARY.md) | Core engine API (planned) |
| [AI Development Plan](./docs/AI_DEVELOPMENT_PLAN.md) | 100-step plan |
| [Engineering Guide](./docs/ENGINEERING_GUIDE.md) | Coding standards |
| [Antipatterns](./docs/ANTIPATTERNS.md) | What NOT to do |
| [Accessibility](./docs/ACCESSIBILITY.md) | A11y guidelines |
| [Mobile Access](./docs/MOBILE_ACCESS.md) | Mobile dev setup |
| [Changelog](./CHANGELOG.md) | Version history |

## 📊 Development Progress

| Phase | Steps | Status |
|-------|-------|--------|
| 1. Foundation | 1-15 | ✅ Complete |
| 2. Matchmaking & Battles | 16-30 | ✅ Complete |
| 3. Frontend Core | 31-50 | ✅ Complete |
| 4. Abilities & Mechanics | 51-65 | ✅ Complete |
| 5. Polish & Optimization | 66-80 | 🔄 In Progress |
| 6. Testing & Quality | 81-90 | ⏳ Planned |
| 7. Deployment | 91-100 | ⏳ Planned |

See `STEP_PROGRESS.md` for detailed progress log.

## 📄 License

MIT
