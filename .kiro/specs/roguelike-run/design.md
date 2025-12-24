# Design: Roguelike Run Mode

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                                                          │
│  ├── /run/new          → Faction & Leader Selection             │
│  ├── /run/[id]/draft   → Draft Screen (initial & post-battle)  │
│  ├── /run/[id]/battle  → Battle Prep & Replay                   │
│  ├── /run/[id]/shop    → Upgrade Shop                           │
│  └── /run/[id]/result  → Run End Screen                         │
│                                                                  │
│  Stores:                                                         │
│  ├── runStore.ts       → Run state, deck, hand                  │
│  ├── draftStore.ts     → Draft options, selection               │
│  └── shopStore.ts      → Upgrade state, gold                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  Modules:                                                        │
│  ├── run/              → Run CRUD, state management             │
│  ├── faction/          → Faction & Leader data                  │
│  ├── draft/            → Draft logic, card pool                 │
│  ├── spell/            → Spell definitions, execution           │
│  └── snapshot/         → Team snapshots for async PvP           │
│                                                                  │
│  Core (reused):                                                  │
│  ├── core/grid/        → Grid utilities (8×2 config)            │
│  ├── core/battle/      → Battle simulation                      │
│  └── core/abilities/   → Ability & spell execution              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                         │
│  ├── runs              → Run entity                             │
│  ├── factions          → Faction definitions                    │
│  ├── leaders           → Leader definitions                     │
│  ├── faction_units     → Units per faction                      │
│  ├── spells            → Spell definitions                      │
│  └── snapshots         → Team snapshots for matchmaking         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Run Entity

```typescript
@Entity('runs')
export class RunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  playerId: string;

  @ManyToOne(() => PlayerEntity)
  player: PlayerEntity;

  @Column({ type: 'varchar', length: 50 })
  faction: string;

  @Column('uuid')
  leaderId: string;

  @Column({ type: 'jsonb' })
  deck: DeckCard[];  // 12 units + 2 spells

  @Column({ type: 'jsonb' })
  hand: DeckCard[];  // Current hand

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @Column({ type: 'int', default: 0 })
  gold: number;

  @Column({ type: 'int', default: 10 })
  currentBudget: number;

  @Column({ type: 'jsonb', default: [] })
  battleHistory: string[];  // Battle log IDs

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'won' | 'lost';

  @Column({ type: 'int', default: 1000 })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Faction Entity

```typescript
@Entity('factions')
export class FactionEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;  // 'order', 'chaos', etc.

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb' })
  bonus: FactionBonus;  // { stat: 'hp', value: 0.1 }

  @Column({ type: 'varchar', length: 255 })
  icon: string;
}
```

### Leader Entity

```typescript
@Entity('leaders')
export class LeaderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  faction: string;

  @Column({ type: 'jsonb' })
  passive: PassiveAbility;

  @Column({ type: 'jsonb' })
  spells: string[];  // Spell IDs

  @Column({ type: 'varchar', length: 255 })
  portrait: string;
}
```

### Snapshot Entity

```typescript
@Entity('snapshots')
export class SnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  runId: string;

  @Column('uuid')
  playerId: string;

  @Column({ type: 'int' })
  wins: number;  // For matchmaking

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'jsonb' })
  team: PlacedUnit[];  // Unit positions

  @Column({ type: 'jsonb' })
  spellTimings: SpellTiming[];

  @Column({ type: 'varchar', length: 50 })
  faction: string;

  @Column('uuid')
  leaderId: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## API Endpoints

### Run Management

```typescript
// Create new run
POST /api/runs
Body: { faction: string, leaderId: string }
Response: { runId: string, initialDraft: Card[] }

// Get run state
GET /api/runs/:id
Response: Run

// Get active run for player
GET /api/runs/active
Response: Run | null
```

### Draft

```typescript
// Get draft options
GET /api/runs/:id/draft
Response: { cards: Card[], isInitial: boolean }

// Submit draft picks
POST /api/runs/:id/draft
Body: { picks: string[] }  // Card IDs
Response: { hand: Card[] }
```

### Battle

```typescript
// Find opponent
POST /api/runs/:id/battle/find
Response: { opponentSnapshot: Snapshot }

// Submit battle
POST /api/runs/:id/battle
Body: { 
  team: PlacedUnit[], 
  spellTimings: SpellTiming[] 
}
Response: { 
  battleId: string, 
  result: 'win' | 'lose',
  goldEarned: number,
  newBudget: number
}
```

### Shop

```typescript
// Get upgrade options
GET /api/runs/:id/shop
Response: { hand: Card[], gold: number, upgradeCosts: UpgradeCost[] }

// Upgrade card
POST /api/runs/:id/shop/upgrade
Body: { cardIndex: number }
Response: { hand: Card[], gold: number }
```

---

## Frontend Components

### New Components

```
frontend/src/components/roguelike/
├── FactionSelect.tsx      # Faction selection grid
├── LeaderSelect.tsx       # Leader selection (3 cards)
├── DraftScreen.tsx        # Draft card selection
├── DraftCard.tsx          # Individual draft card
├── RunStatusBar.tsx       # Wins/losses/gold/budget
├── UpgradeShop.tsx        # Upgrade interface
├── UpgradeCard.tsx        # Card with upgrade button
├── SpellTimingSelect.tsx  # Early/Mid/Late selector
├── RunEndScreen.tsx       # Victory/defeat screen
└── LeaderPortrait.tsx     # Leader with passive tooltip
```

### Modified Components

```
frontend/src/components/
├── BattleGrid.tsx         # Support 8×2 config
├── UnitCard.tsx           # Add tier indicator
└── BattleReplay.tsx       # Support spell animations
```

### New Stores

```typescript
// frontend/src/store/runStore.ts
interface RunState {
  currentRun: Run | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createRun: (faction: string, leaderId: string) => Promise<void>;
  loadRun: (runId: string) => Promise<void>;
  loadActiveRun: () => Promise<void>;
}

// frontend/src/store/draftStore.ts
interface DraftState {
  options: Card[];
  selected: string[];
  isInitial: boolean;
  
  // Actions
  loadDraft: (runId: string) => Promise<void>;
  selectCard: (cardId: string) => void;
  submitDraft: (runId: string) => Promise<void>;
}
```

---

## Battle Simulation Changes

### Grid Configuration

```typescript
// Roguelike grid config
const ROGUELIKE_GRID_CONFIG: GridConfig = {
  width: 8,
  height: 2,  // Landing zone only
  playerRows: [0],
  enemyRows: [1],
};

// Battle expands to full grid during simulation
const BATTLE_GRID_CONFIG: GridConfig = {
  width: 8,
  height: 10,
  playerRows: [0, 1],
  enemyRows: [8, 9],
};
```

### Spell Execution

```typescript
interface SpellExecution {
  spellId: string;
  timing: 'early' | 'mid' | 'late';
  round: number;  // Calculated from timing
}

// In battle simulator
function executeSpells(
  state: BattleState, 
  spells: SpellExecution[],
  currentRound: number
): BattleState {
  const activeSpells = spells.filter(s => 
    shouldTriggerSpell(s, currentRound)
  );
  
  for (const spell of activeSpells) {
    state = applySpellEffect(state, spell);
  }
  
  return state;
}
```

### Leader Passive

```typescript
// Applied at battle start
function applyLeaderPassive(
  units: BattleUnit[],
  leader: Leader
): BattleUnit[] {
  return units.map(unit => ({
    ...unit,
    ...applyPassiveBonus(unit, leader.passive)
  }));
}
```

---

## Matchmaking Algorithm

```typescript
async function findOpponent(run: Run): Promise<Snapshot | null> {
  // 1. Find snapshots with similar wins
  const candidates = await this.snapshotRepo.find({
    where: {
      wins: Between(run.wins - 1, run.wins + 1),
      playerId: Not(run.playerId),  // Not self
    },
    order: { rating: 'ASC' },
    take: 10,
  });

  // 2. Filter by rating range
  const ratingRange = 200;
  const filtered = candidates.filter(s => 
    Math.abs(s.rating - run.rating) <= ratingRange
  );

  // 3. Random selection from filtered
  if (filtered.length > 0) {
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  // 4. Fallback: generate bot
  return this.generateBotSnapshot(run.wins);
}
```

---

## Gold & Budget Formulas

```typescript
// Budget progression
function getBudget(battleNumber: number): number {
  if (battleNumber <= 2) return 10;
  if (battleNumber <= 4) return 20;
  if (battleNumber <= 6) return 35;
  if (battleNumber <= 8) return 50;
  return 65;
}

// Gold reward
function getGoldReward(won: boolean, winStreak: number): number {
  if (!won) return 2;
  
  const base = 5;
  const streakBonus = winStreak >= 3 ? (winStreak - 2) * 2 : 0;
  return base + streakBonus;
}

// Upgrade cost
function getUpgradeCost(currentTier: number): number {
  return currentTier === 1 ? 5 : 10;  // T1→T2: 5g, T2→T3: 10g
}
```

---

## Rating Calculation

```typescript
function calculateRatingChange(
  playerRating: number,
  opponentRating: number,
  won: boolean
): number {
  const K = 32;  // K-factor
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actual = won ? 1 : 0;
  
  return Math.round(K * (actual - expected));
}
```

---

## UI Flow Diagrams

### Run Start Flow

```
[Main Menu] 
    │
    ▼
[Faction Select] ─── 6 faction cards with bonuses
    │
    ▼
[Leader Select] ─── 3 leader cards with passives
    │
    ▼
[Initial Draft] ─── Pick 3 from 5 cards
    │
    ▼
[Battle Prep] ─── Place units, select spell timing
```

### Battle Loop Flow

```
[Battle Prep]
    │
    ├── Place units on 8×2 grid
    ├── Select spell timings
    └── Click "Fight"
    │
    ▼
[Battle Replay] ─── Watch battle animation
    │
    ▼
[Result Screen] ─── Win/Lose, gold earned
    │
    ├── If 9 wins → [Victory Screen]
    ├── If 4 losses → [Defeat Screen]
    └── Otherwise ↓
    │
    ▼
[Draft Screen] ─── Pick 1 from 3 cards
    │
    ▼
[Upgrade Shop] ─── Optional upgrades
    │
    ▼
[Battle Prep] ─── Loop back
```

---

## Migration Strategy

1. **Phase 1**: Create new tables (runs, factions, leaders, snapshots)
2. **Phase 2**: Implement backend modules (run, draft, spell)
3. **Phase 3**: Create frontend pages and components
4. **Phase 4**: Integrate with existing battle system
5. **Phase 5**: Add matchmaking and rating

MVP mode remains unchanged - roguelike is a separate game mode.
