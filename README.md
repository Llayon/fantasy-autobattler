# ⚔️ Fantasy Autobattler

Browser-based asynchronous autobattler game with fantasy theme. Build your team, battle bots, watch replays.

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 (App Router) | React framework with SSR |
| Styling | Tailwind CSS | Utility-first CSS |
| State | Zustand | Lightweight state management |
| Backend | NestJS 10 | Node.js framework with DI |
| ORM | TypeORM | Database abstraction |
| Database | PostgreSQL 15 | Relational database |
| Container | Docker | Local development |
| Language | TypeScript 5 | Type safety |

## 📁 Project Structure

```
autobattler/
├── backend/                    # NestJS API Server
│   ├── src/
│   │   ├── auth/              # Guest authentication module
│   │   ├── battle/            # Battle logic & simulation
│   │   ├── player/            # Player management
│   │   ├── entities/          # TypeORM database entities
│   │   ├── unit/              # Unit definitions & stats
│   │   └── main.ts            # Application entry point
│   └── package.json
│
├── frontend/                   # Next.js Web Client
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   ├── components/        # React UI components
│   │   ├── lib/               # API client & utilities
│   │   ├── store/             # Zustand state management
│   │   └── types/             # TypeScript type definitions
│   └── package.json
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── ENGINEERING_GUIDE.md   # Coding standards
│   └── ANTIPATTERNS.md        # What NOT to do
│
├── docker-compose.yml          # PostgreSQL container
└── README.md                   # This file
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
# API runs on http://localhost:3001
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

## 🎮 Game Mechanics

### Units
| Unit | HP | ATK | DEF | SPD | Ability |
|------|-----|-----|-----|-----|---------|
| ⚔️ Warrior | 100 | 15 | 10 | 5 | Taunt - enemies attack this unit first |
| 🔮 Mage | 60 | 25 | 3 | 8 | Splash - attacks hit 2 enemies |
| 💚 Healer | 70 | 8 | 5 | 10 | Heal - restores 15 HP to lowest ally |

### Battle Flow
1. Player builds team (3 units)
2. Click "Start Battle" → server generates bot team
3. Server simulates battle (deterministic)
4. Player watches step-by-step replay

### Combat Rules
- Turn order: sorted by SPD (highest first)
- Damage formula: `ATK - DEF` (minimum 1)
- Warriors are targeted first (taunt)
- Battle ends when one team is eliminated
- Max 50 rounds (draw if exceeded)

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/guest` | Create guest session |
| `GET` | `/player/me` | Get current player |
| `PUT` | `/player/team` | Update team composition |
| `POST` | `/battle/start` | Start battle vs bot |
| `GET` | `/battle/:id` | Get battle replay |
| `GET` | `/battle` | List player's battles |

### Authentication
All endpoints (except `/auth/guest`) require `x-guest-token` header.

## 🛠️ Development

### Useful Commands

```bash
# Backend
cd backend
npm run start:dev     # Development with hot reload
npm run build         # Production build
npm run start:prod    # Run production build

# Frontend
cd frontend
npm run dev           # Development server
npm run build         # Production build
npm run lint          # Run ESLint

# Database
docker-compose up -d   # Start PostgreSQL
docker-compose down    # Stop PostgreSQL
docker exec -it autobattler-db psql -U postgres -d autobattler  # Connect to DB
```

### Environment Variables

Backend (`.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/autobattler
PORT=3001
```

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design & data flow
- [Engineering Guide](./docs/ENGINEERING_GUIDE.md) - Coding standards & patterns
- [Antipatterns](./docs/ANTIPATTERNS.md) - What NOT to do

## 📄 License

MIT
