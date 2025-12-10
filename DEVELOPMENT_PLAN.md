# Fantasy Autobattler - MVP Development Plan

## 🎮 Game Design Basics

### Core Mechanics

**Unit Types (3 for MVP):**
| Unit | HP | ATK | DEF | SPD | Special |
|------|-----|-----|-----|-----|---------|
| Warrior | 100 | 15 | 10 | 5 | Taunt (enemies target this unit first) |
| Mage | 60 | 25 | 3 | 8 | Splash (hits 2 enemies) |
| Healer | 70 | 8 | 5 | 10 | Heal (restores 15 HP to lowest ally) |

**Stats Explained:**
- HP: Health points
- ATK: Damage dealt
- DEF: Damage reduction (damage = ATK - DEF, min 1)
- SPD: Turn order (higher = acts first)

**Team Building:**
- Player picks 3 units for their team
- Each unit type can be used once per team

### Battle Flow (Asynchronous)

```
1. Player builds team → clicks "Start Battle"
2. Server generates bot team (random composition)
3. Server runs deterministic battle simulation
4. Server stores battle log in database
5. Player redirected to /battle/[id] to watch replay
```

### Battle Logic (Turn-Based)

```
1. Sort all units by SPD (descending)
2. Each unit takes action in order:
   - Healer: Heal lowest HP ally if any ally < 100% HP, else attack
   - Warrior: Attack (enemies prioritize attacking Warriors)
   - Mage: Attack 2 random enemies
3. Remove dead units (HP <= 0)
4. Repeat until one team is eliminated
5. Max 50 rounds (draw if exceeded)
```

---

## 📁 Project Structure

```
autobattler/
├── frontend/                 # Next.js App
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Team Builder
│   │   │   └── battle/
│   │   │       └── [id]/
│   │   │           └── page.tsx   # Battle Replay
│   │   ├── components/
│   │   │   ├── UnitCard.tsx
│   │   │   ├── TeamBuilder.tsx
│   │   │   ├── BattleReplay.tsx
│   │   │   └── UnitSprite.tsx
│   │   ├── store/
│   │   │   └── gameStore.ts       # Zustand store
│   │   ├── lib/
│   │   │   └── api.ts             # API client
│   │   └── types/
│   │       └── game.ts            # TypeScript types
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── package.json
│
├── backend/                  # NestJS App
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── guest.guard.ts
│   │   ├── player/
│   │   │   ├── player.module.ts
│   │   │   ├── player.controller.ts
│   │   │   └── player.service.ts
│   │   ├── battle/
│   │   │   ├── battle.module.ts
│   │   │   ├── battle.controller.ts
│   │   │   ├── battle.service.ts
│   │   │   └── battle.simulator.ts  # Pure function
│   │   └── unit/
│   │       ├── unit.module.ts
│   │       └── unit.data.ts         # Unit definitions
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── docker-compose.yml        # PostgreSQL
└── README.md
```

---

## 🗄️ Database Schema (Prisma)

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Player {
  id        String   @id @default(uuid())
  guestId   String   @unique
  name      String   @default("Guest")
  team      Json     @default("[]")  // Array of unit types
  wins      Int      @default(0)
  losses    Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  battles   BattleLog[]
}

model BattleLog {
  id           String   @id @default(uuid())
  playerId     String
  player       Player   @relation(fields: [playerId], references: [id])
  playerTeam   Json     // Snapshot of player's team
  botTeam      Json     // Generated bot team
  events       Json     // Array of battle events
  winner       String   // "player" | "bot" | "draw"
  createdAt    DateTime @default(now())
}
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/auth/guest` | Create guest session | - | `{ playerId, token }` |
| GET | `/player/me` | Get current player | Header: `x-guest-token` | `Player` object |
| PUT | `/player/team` | Update team | `{ team: ["Warrior", "Mage", "Healer"] }` | `Player` object |
| POST | `/battle/start` | Start battle vs bot | - | `{ battleId }` |
| GET | `/battle/:id` | Get battle log | - | `BattleLog` object |

---

## 📋 Battle Log Format

```json
{
  "id": "battle-uuid",
  "playerTeam": [
    { "type": "Warrior", "hp": 100, "atk": 15, "def": 10, "spd": 5 },
    { "type": "Mage", "hp": 60, "atk": 25, "def": 3, "spd": 8 },
    { "type": "Healer", "hp": 70, "atk": 8, "def": 5, "spd": 10 }
  ],
  "botTeam": [
    { "type": "Warrior", "hp": 100, "atk": 15, "def": 10, "spd": 5 },
    { "type": "Warrior", "hp": 100, "atk": 15, "def": 10, "spd": 5 },
    { "type": "Mage", "hp": 60, "atk": 25, "def": 3, "spd": 8 }
  ],
  "events": [
    { "round": 1, "actor": "player-Healer", "action": "heal", "target": "player-Warrior", "value": 15 },
    { "round": 1, "actor": "player-Mage", "action": "attack", "targets": ["bot-Warrior-1", "bot-Warrior-2"], "damage": [22, 22] },
    { "round": 1, "actor": "bot-Mage", "action": "attack", "targets": ["player-Warrior", "player-Mage"], "damage": [15, 22] },
    { "round": 1, "actor": "player-Warrior", "action": "attack", "target": "bot-Warrior-1", "damage": 5 },
    { "round": 1, "actor": "bot-Warrior-1", "action": "attack", "target": "player-Warrior", "damage": 5 },
    { "round": 1, "actor": "bot-Warrior-2", "action": "attack", "target": "player-Warrior", "damage": 5 },
    { "round": 2, "actor": "player-Healer", "action": "heal", "target": "player-Warrior", "value": 15 }
  ],
  "winner": "player"
}
```

---

## 🚀 Implementation Steps

### Weekend 1: Backend + Database

#### Day 1: Setup & Database

1. **Setup PostgreSQL with Docker**
2. **Initialize NestJS project**
3. **Setup Prisma & create schema**
4. **Implement Auth module (guest sessions)**

#### Day 2: Core Backend

5. **Implement Player module**
6. **Create Unit definitions**
7. **Implement Battle simulator (pure function)**
8. **Implement Battle module & endpoints**
9. **Test all endpoints with curl/Postman**

### Weekend 2: Frontend + Integration

#### Day 3: Frontend Setup

10. **Initialize Next.js project**
11. **Setup Tailwind CSS**
12. **Create Zustand store**
13. **Build Team Builder page**

#### Day 4: Battle & Polish

14. **Build Battle Replay page**
15. **Connect frontend to backend**
16. **Add animations/polish**
17. **Test full flow**

---

## 🛠️ Local Setup Instructions

### 1. PostgreSQL with Docker

```bash
# Create docker-compose.yml in project root
# Then run:
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
# Runs on http://localhost:3001
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### 4. CORS Configuration (NestJS main.ts)

```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

---

## ✅ MVP Checklist

- [ ] PostgreSQL running in Docker
- [ ] Guest authentication working
- [ ] Player can save team composition
- [ ] Battle simulator produces deterministic results
- [ ] Battle log stored in database
- [ ] Team Builder UI functional
- [ ] Battle Replay shows events step-by-step
- [ ] Mobile-responsive design

---

## 🎯 Out of Scope (Future)

- User accounts / real authentication
- Multiple factions with bonuses
- Unit leveling / progression
- PvP matchmaking
- Leaderboards
- Sound effects / music
- Deployment
