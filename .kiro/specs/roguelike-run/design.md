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
│  ├── core/grid/        → Grid utilities (8×10 battle grid)      │
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

## Deck vs Hand System

### Terminology

| Term | Description |
|------|-------------|
| **Deck** | Pre-built collection of 12 units + 2 spells (14 cards total). Fixed at run start based on faction. |
| **Hand** | Units currently available for placement on the deployment grid. Starts with 3, grows to max 12. |
| **Remaining Deck** | Cards in deck that haven't been drafted to hand yet. |

### Deck Building Flow (Future Feature)

```
┌─────────────────────────────────────────────────────────────┐
│                    DECK BUILDING (Future)                    │
│  1. Select Faction (determines unit pool: 25 units)         │
│  2. Select Leader (determines spell pool: 3 spells)         │
│  3. Build Deck: Pick 12 units + 2 spells                    │
│  4. Save Deck for run                                       │
└─────────────────────────────────────────────────────────────┘
```

### Phase 1: Starter Decks

For Phase 1, each faction has a pre-built balanced starter deck:
- Fixed 12 T1 units per faction (see units-phase1.md)
- 2 spells from leader's options
- Custom deck building unlocked via player progression (future)

### Draft Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    RUN START                                 │
│  Deck: 12 units + 2 spells (faction-specific)               │
│  Hand: empty                                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  INITIAL DRAFT                               │
│  Show: 5 random cards from deck                             │
│  Pick: 3 cards → move to hand                               │
│  Remaining deck: 9 units + 2 spells                         │
│  Hand: 3 units                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  POST-BATTLE DRAFT                           │
│  Show: 3 random cards from remaining deck                   │
│  Pick: 1 card → add to hand                                 │
│  Repeat after each battle until deck empty                  │
└─────────────────────────────────────────────────────────────┘
```

### Draft Progression Example

| After Battle | Remaining Deck | Hand Size |
|--------------|----------------|-----------|
| Start        | 12 units       | 0         |
| Initial      | 9 units        | 3         |
| Battle 1     | 8 units        | 4         |
| Battle 2     | 7 units        | 5         |
| ...          | ...            | ...       |
| Battle 9     | 0 units        | 12        |

### Key Rules

1. **Deck is fixed** — determined by faction at run start
2. **Hand grows** — from 3 to max 12 units through drafts
3. **No selling** — units cannot be sold, only repositioned
4. **Spells separate** — 2 spells are always available (not drafted)
5. **Draft is random** — cards shown are random from remaining deck

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
  deck: DeckCard[];  // Full deck: 12 units + 2 spells (fixed at run start)

  @Column({ type: 'jsonb' })
  remainingDeck: DeckCard[];  // Cards not yet drafted to hand

  @Column({ type: 'jsonb' })
  hand: DeckCard[];  // Units available for placement (3-12)

  @Column({ type: 'jsonb' })
  spells: SpellCard[];  // 2 spells (always available, not drafted)

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @Column({ type: 'int', default: 0 })
  consecutiveLosses: number;  // For win streak bonus calculation

  @Column({ type: 'int', default: 0 })
  consecutiveWins: number;  // For win streak bonus calculation

  @Column({ type: 'int', default: 10 })
  gold: number;  // Current gold (starts at 10)

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
// Roguelike uses same battle grid as MVP (8×10)
// Deployment zone is 8×2 (same as current MVP)
const ROGUELIKE_GRID_CONFIG: GridConfig = {
  width: 8,
  height: 10,  // Full battle grid
  playerRows: [0, 1],  // 2 rows for deployment (8×2 zone)
  enemyRows: [8, 9],   // Enemy deployment zone
};
```

### Spell Execution

Spells trigger based on team HP thresholds, not round numbers.

```typescript
interface SpellExecution {
  spellId: string;
  timing: 'early' | 'mid' | 'late';
  triggered: boolean;  // Track if already triggered
}

// Spell timing thresholds (based on team HP)
const SPELL_TIMING_THRESHOLDS = {
  early: 1.0,   // Triggers immediately at battle start
  mid: 0.7,    // Triggers when any ally drops below 70% HP
  late: 0.4,   // Triggers when any ally drops below 40% HP
};

// Check if spell should trigger based on team HP
function shouldTriggerSpell(
  spell: SpellExecution,
  units: BattleUnit[],
  timing: 'early' | 'mid' | 'late'
): boolean {
  if (spell.triggered) return false;
  if (spell.timing !== timing) return false;
  
  if (timing === 'early') return true;  // Always trigger at start
  
  const threshold = SPELL_TIMING_THRESHOLDS[timing];
  return units.some(unit => 
    unit.currentHp / unit.maxHp < threshold
  );
}

// In battle simulator
function executeSpells(
  state: BattleState, 
  spells: SpellExecution[]
): BattleState {
  for (const spell of spells) {
    if (shouldTriggerSpell(spell, state.playerUnits, spell.timing)) {
      state = applySpellEffect(state, spell);
      spell.triggered = true;
    }
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

## Gold Economy

```typescript
// Starting gold: 10g
// Win reward: +7g + streak bonus
// Lose reward: +9g (catch-up mechanic)

function getGoldReward(won: boolean, winStreak: number): number {
  if (!won) return 9;  // Lose: 9g (catch-up mechanic)
  
  const base = 7;  // Win: 7g base
  const streakBonus = winStreak >= 3 ? (winStreak - 2) * 2 : 0;
  return base + streakBonus;
}

// Upgrade cost (percentage-based system)
function getUpgradeCost(t1Cost: number, targetTier: number): number {
  if (targetTier === 2) return t1Cost;  // T1→T2: 100% of T1 cost
  if (targetTier === 3) return Math.round(t1Cost * 1.5);  // T2→T3: 150% of T1 cost (rounded)
  return 0;
}

// Units cannot be sold, only repositioned on deployment grid
```

### Gold Progression Example

| Battle | Result | Gold Earned | Total Gold |
|--------|--------|-------------|------------|
| Start  | -      | 10g         | 10         |
| 1      | Win    | +7g         | 17         |
| 2      | Win    | +7g         | 24         |
| 3      | Lose   | +9g         | 33         |
| 4      | Lose   | +9g         | 42         |
| 5      | Win    | +7g         | 49         |
| 6      | Win (3-streak) | +9g | 58         |

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
    ├── Place units on 8×2 deployment zone (rows 0-1)
    ├── Select spell timings
    └── Click "Fight"
    │
    ▼
[Battle Replay] ─── Watch battle animation (full 8×10 grid)
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
[Upgrade Shop] ─── Optional upgrades (units cannot be sold)
    │
    ▼
[Battle Prep] ─── Loop back
```

---

## Faction Units & Leaders Design

### Unit Structure

```typescript
interface FactionUnit {
  id: string;
  name: string;
  faction: Faction;
  role: 'tank' | 'melee_dps' | 'ranged_dps' | 'mage' | 'support' | 'control';
  tier: 1 | 2 | 3;  // T1 = common, T2 = rare, T3 = epic
  cost: number;     // Gold cost (3-8)
  
  // Base stats (T1)
  hp: number;
  atk: number;
  armor: number;
  speed: number;
  initiative: number;
  range: number;
  attackCount: number;
  dodge: number;
  
  ability?: Ability;
}
```

### Unit Distribution per Faction (25 units each)

| Role | T1 (Common) | T2 (Rare) | T3 (Epic) | Total |
|------|-------------|-----------|-----------|-------|
| Tank | 2 | 2 | 1 | 5 |
| Melee DPS | 2 | 2 | 1 | 5 |
| Ranged DPS | 2 | 2 | 1 | 5 |
| Mage | 2 | 1 | 1 | 4 |
| Support | 2 | 1 | 1 | 4 |
| Control | 1 | 1 | 0 | 2 |
| **Total** | **11** | **9** | **5** | **25** |

### Tier Stats & Upgrade Costs

| Tier | Stats | Upgrade Cost | Purchasable |
|------|-------|--------------|-------------|
| T1 | Base (100%) | - | ✅ Yes |
| T2 | +50% all stats | 100% of T1 cost | ❌ Upgrade only |
| T3 | +100% all stats + ability | 150% of T1 cost (rounded) | ❌ Upgrade only |

**Example (Swordsman, T1 cost: 3g):**
- T1→T2: 3g upgrade cost
- T2→T3: 5g upgrade cost (3 × 1.5 = 4.5, rounded to 5)
- Total to T3: 3g (buy) + 3g (T2) + 5g (T3) = 11g

---

### Order Faction (Knights, Paladins)

**Bonus**: +10% HP to all units

**Theme**: Holy warriors, defensive formations, healing and protection

#### Leaders (3)

| Leader | Passive | Spells |
|--------|---------|--------|
| **Ser Aldric** | Holy Shield: All units gain +15% armor | Divine Smite, Blessing of Light |
| **Lady Elara** | Righteous Fury: Units deal +10% damage to enemies below 50% HP | Holy Nova, Guardian Angel |
| **Grand Marshal Vorn** | Formation: Adjacent units share 10% of damage taken | Rally Cry, Fortress |

#### Units (25)

**Tanks (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Squire | T1 | 3 | 80 | 12 | 15 | - |
| Footman | T1 | 4 | 100 | 15 | 20 | Shield Wall |
| Knight | T2 | 5 | 130 | 18 | 25 | Taunt |
| Paladin | T2 | 6 | 150 | 20 | 30 | Holy Shield |
| Grand Champion | T3 | 8 | 200 | 25 | 40 | Unbreakable |

**Melee DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Militia | T1 | 3 | 60 | 18 | 5 | - |
| Swordsman | T1 | 4 | 70 | 22 | 8 | - |
| Crusader | T2 | 5 | 85 | 28 | 12 | Zealous Strike |
| Templar | T2 | 6 | 95 | 32 | 15 | Holy Blade |
| Inquisitor | T3 | 7 | 110 | 40 | 18 | Purge |

**Ranged DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Bowman | T1 | 3 | 50 | 20 | 3 | - |
| Crossbowman | T1 | 4 | 55 | 25 | 5 | Piercing Shot |
| Marksman | T2 | 5 | 65 | 30 | 8 | Volley |
| Ballista Crew | T2 | 6 | 75 | 35 | 10 | Siege Shot |
| Holy Archer | T3 | 7 | 85 | 42 | 12 | Blessed Arrow |

**Mages (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Acolyte | T1 | 3 | 45 | 22 | 2 | - |
| Cleric | T1 | 4 | 50 | 25 | 3 | Minor Heal |
| Battle Priest | T2 | 6 | 65 | 32 | 5 | Smite |
| High Priest | T3 | 8 | 80 | 40 | 8 | Divine Wrath |

**Support (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Medic | T1 | 3 | 55 | 10 | 5 | Heal |
| Banner Bearer | T1 | 4 | 60 | 12 | 8 | Inspire |
| War Chaplain | T2 | 5 | 75 | 15 | 10 | Mass Heal |
| Saint | T3 | 7 | 90 | 20 | 12 | Resurrection |

**Control (2)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Peacekeeper | T1 | 4 | 65 | 15 | 10 | Pacify |
| Justicar | T2 | 6 | 85 | 20 | 15 | Judgment |

---

### Chaos Faction (Demons, Warlocks)

**Bonus**: +15% ATK to all units

**Theme**: Aggressive, high damage, life steal, corruption

#### Leaders (3)

| Leader | Passive | Spells |
|--------|---------|--------|
| **Malachar the Defiler** | Blood Pact: Units heal 15% of damage dealt | Hellfire, Soul Drain |
| **Vex'thar** | Chaos Surge: +20% ATK when below 50% HP | Corruption, Demon Gate |
| **Lilith** | Seduction: 10% chance to charm enemy on hit | Dark Pact, Nightmare |

#### Units (25)

**Tanks (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Imp | T1 | 3 | 70 | 15 | 10 | - |
| Hellhound | T1 | 4 | 90 | 18 | 12 | Frenzy |
| Demon Guard | T2 | 5 | 120 | 22 | 18 | Demonic Shield |
| Pit Lord | T2 | 6 | 140 | 25 | 22 | Cleave |
| Infernal | T3 | 8 | 180 | 30 | 28 | Immolation |

**Melee DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Cultist | T1 | 3 | 55 | 22 | 3 | - |
| Berserker | T1 | 4 | 65 | 28 | 5 | Rage |
| Succubus | T2 | 5 | 75 | 35 | 8 | Life Drain |
| Doom Knight | T2 | 6 | 85 | 40 | 12 | Execute |
| Demon Lord | T3 | 8 | 100 | 50 | 15 | Annihilate |

**Ranged DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Dark Archer | T1 | 3 | 45 | 24 | 2 | - |
| Warlock Adept | T1 | 4 | 50 | 28 | 3 | Shadow Bolt |
| Fel Caster | T2 | 5 | 60 | 34 | 5 | Chaos Bolt |
| Doom Caller | T2 | 6 | 70 | 38 | 8 | Rain of Fire |
| Arch Warlock | T3 | 7 | 80 | 45 | 10 | Apocalypse |

**Mages (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Hex Witch | T1 | 3 | 40 | 26 | 2 | Curse |
| Blood Mage | T1 | 4 | 45 | 30 | 3 | Blood Bolt |
| Necromancer | T2 | 6 | 55 | 38 | 5 | Raise Dead |
| Lich | T3 | 8 | 70 | 48 | 8 | Death Coil |

**Support (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Dark Acolyte | T1 | 3 | 50 | 12 | 4 | Dark Heal |
| Soul Collector | T1 | 4 | 55 | 15 | 6 | Soul Harvest |
| Demon Priest | T2 | 5 | 70 | 18 | 8 | Infernal Blessing |
| Void Walker | T3 | 7 | 85 | 22 | 10 | Void Shield |

**Control (2)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Mind Flayer | T1 | 4 | 60 | 18 | 8 | Confuse |
| Dread Lord | T2 | 6 | 80 | 24 | 12 | Fear |

---

### Nature Faction (Druids, Beasts)

**Bonus**: +10% Regen to all units

**Theme**: Regeneration, beasts, poison, growth

#### Leaders (3)

| Leader | Passive | Spells |
|--------|---------|--------|
| **Oakenheart** | Nature's Blessing: All units regenerate 3% HP per round | Entangle, Wild Growth |
| **Fang** | Pack Leader: Beast units gain +15% ATK | Stampede, Call of the Wild |
| **Willow** | Thorns: Attackers take 10% damage reflected | Poison Cloud, Rejuvenation |

#### Units (25)

**Tanks (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Treant Sapling | T1 | 3 | 85 | 10 | 12 | - |
| Bear | T1 | 4 | 110 | 14 | 15 | Maul |
| Ancient Treant | T2 | 5 | 140 | 16 | 20 | Root |
| Dire Bear | T2 | 6 | 160 | 20 | 25 | Roar |
| Forest Guardian | T3 | 8 | 220 | 22 | 35 | Nature's Wrath |

**Melee DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Wolf | T1 | 3 | 55 | 20 | 5 | - |
| Panther | T1 | 4 | 60 | 25 | 6 | Pounce |
| Werewolf | T2 | 5 | 75 | 32 | 10 | Feral Strike |
| Dire Wolf | T2 | 6 | 85 | 36 | 12 | Pack Tactics |
| Alpha Beast | T3 | 7 | 100 | 45 | 15 | Savage Fury |

**Ranged DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Thorn Thrower | T1 | 3 | 48 | 22 | 3 | - |
| Poison Spitter | T1 | 4 | 52 | 24 | 4 | Poison |
| Hunter | T2 | 5 | 62 | 30 | 6 | Trap |
| Venomancer | T2 | 6 | 70 | 34 | 8 | Venom Spray |
| Forest Sniper | T3 | 7 | 82 | 42 | 10 | Deadly Shot |

**Mages (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Seedling | T1 | 3 | 42 | 20 | 2 | Grow |
| Druid | T1 | 4 | 48 | 24 | 3 | Nature's Touch |
| Elder Druid | T2 | 6 | 60 | 32 | 5 | Moonfire |
| Archdruid | T3 | 8 | 75 | 40 | 8 | Wrath of Nature |

**Support (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Sprite | T1 | 3 | 50 | 8 | 3 | Heal |
| Dryad | T1 | 4 | 58 | 12 | 5 | Rejuvenate |
| Keeper | T2 | 5 | 72 | 15 | 8 | Tranquility |
| Ancient of Lore | T3 | 7 | 88 | 18 | 10 | Life Bloom |

**Control (2)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Vine Weaver | T1 | 4 | 62 | 14 | 8 | Entangle |
| Swamp Thing | T2 | 6 | 82 | 18 | 12 | Slow |

---

### Shadow Faction (Assassins, Rogues)

**Bonus**: +20% Dodge to all units

**Theme**: Stealth, critical hits, poison, evasion

#### Leaders (3)

| Leader | Passive | Spells |
|--------|---------|--------|
| **Shade** | Shadow Step: Units have 20% chance to dodge first attack | Smoke Bomb, Assassinate |
| **Viper** | Lethal Poison: Attacks apply poison (3% HP/round) | Poison Nova, Venomous Strike |
| **Whisper** | Silent Kill: +50% damage to isolated targets | Shadow Clone, Vanish |

#### Units (25)

**Tanks (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Thug | T1 | 3 | 75 | 14 | 8 | - |
| Enforcer | T1 | 4 | 95 | 18 | 12 | Intimidate |
| Shadow Guard | T2 | 5 | 115 | 22 | 16 | Evasion |
| Nightblade | T2 | 6 | 130 | 26 | 20 | Parry |
| Phantom | T3 | 8 | 160 | 32 | 25 | Phase |

**Melee DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Pickpocket | T1 | 3 | 50 | 24 | 3 | - |
| Rogue | T1 | 4 | 58 | 30 | 5 | Backstab |
| Assassin | T2 | 5 | 68 | 38 | 8 | Execute |
| Shadow Dancer | T2 | 6 | 78 | 44 | 10 | Blade Dance |
| Death Dealer | T3 | 7 | 90 | 55 | 12 | Death Mark |

**Ranged DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Knife Thrower | T1 | 3 | 42 | 26 | 2 | - |
| Poison Dart | T1 | 4 | 48 | 28 | 3 | Poison |
| Sharpshooter | T2 | 5 | 58 | 35 | 5 | Headshot |
| Shadow Archer | T2 | 6 | 66 | 40 | 7 | Shadow Arrow |
| Silent Death | T3 | 7 | 78 | 50 | 10 | Lethal Shot |

**Mages (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Illusionist | T1 | 3 | 38 | 22 | 2 | Blind |
| Shadow Mage | T1 | 4 | 44 | 28 | 3 | Shadow Bolt |
| Nightstalker | T2 | 6 | 55 | 36 | 5 | Nightmare |
| Void Assassin | T3 | 8 | 68 | 46 | 8 | Void Strike |

**Support (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Spy | T1 | 3 | 48 | 10 | 4 | Scout |
| Saboteur | T1 | 4 | 54 | 14 | 6 | Weaken |
| Shadow Priest | T2 | 5 | 68 | 16 | 8 | Dark Heal |
| Master of Shadows | T3 | 7 | 82 | 20 | 10 | Shadow Veil |

**Control (2)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Trickster | T1 | 4 | 58 | 16 | 6 | Confuse |
| Mind Breaker | T2 | 6 | 76 | 22 | 10 | Stun |

---

### Arcane Faction (Mages, Elementals)

**Bonus**: +15% Magic DMG to all units

**Theme**: Elemental magic, AoE damage, mana manipulation

#### Leaders (3)

| Leader | Passive | Spells |
|--------|---------|--------|
| **Archmage Zephyr** | Arcane Mastery: Spells deal +20% damage | Meteor, Time Warp |
| **Ignis** | Burning Soul: Attacks apply burn (2% HP/round) | Inferno, Fire Shield |
| **Frost Queen** | Frozen Heart: Slows enemies by 15% | Blizzard, Ice Prison |

#### Units (25)

**Tanks (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Stone Golem | T1 | 3 | 90 | 10 | 18 | - |
| Ice Elemental | T1 | 4 | 105 | 14 | 20 | Frost Armor |
| Earth Elemental | T2 | 5 | 135 | 18 | 28 | Earthquake |
| Fire Elemental | T2 | 6 | 145 | 22 | 24 | Immolate |
| Arcane Titan | T3 | 8 | 190 | 28 | 35 | Arcane Shield |

**Melee DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Spark | T1 | 3 | 52 | 22 | 4 | - |
| Flame Dancer | T1 | 4 | 60 | 28 | 6 | Fire Touch |
| Storm Elemental | T2 | 5 | 72 | 35 | 10 | Lightning Strike |
| Magma Golem | T2 | 6 | 82 | 40 | 14 | Lava Burst |
| Phoenix | T3 | 8 | 95 | 50 | 16 | Rebirth |

**Ranged DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Apprentice | T1 | 3 | 40 | 24 | 2 | - |
| Fire Mage | T1 | 4 | 46 | 30 | 3 | Fireball |
| Ice Mage | T2 | 5 | 56 | 36 | 5 | Frost Bolt |
| Lightning Mage | T2 | 6 | 64 | 42 | 7 | Chain Lightning |
| Archmage | T3 | 8 | 76 | 52 | 10 | Arcane Barrage |

**Mages (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Conjurer | T1 | 3 | 38 | 26 | 2 | Summon |
| Elementalist | T1 | 4 | 44 | 32 | 3 | Elemental Bolt |
| Battle Mage | T2 | 6 | 55 | 42 | 6 | Arcane Explosion |
| Grand Magus | T3 | 8 | 68 | 55 | 8 | Meteor |

**Support (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Enchanter | T1 | 3 | 46 | 10 | 3 | Buff |
| Chronomancer | T1 | 4 | 52 | 14 | 5 | Haste |
| Arcane Healer | T2 | 5 | 66 | 18 | 8 | Mana Shield |
| Time Weaver | T3 | 7 | 80 | 22 | 10 | Time Stop |

**Control (2)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Frost Witch | T1 | 4 | 56 | 18 | 6 | Freeze |
| Void Mage | T2 | 6 | 74 | 24 | 10 | Silence |

---

### Machine Faction (Constructs, Engineers)

**Bonus**: +15% Armor to all units

**Theme**: Mechanical units, turrets, shields, explosions

#### Leaders (3)

| Leader | Passive | Spells |
|--------|---------|--------|
| **Chief Engineer Grix** | Overcharge: Mechanical units gain +10% ATK each round | Deploy Turret, EMP |
| **Iron Maiden** | Fortify: Units gain +5 armor when stationary | Barricade, Artillery Strike |
| **Dr. Boom** | Explosive: Dead units explode for 20% HP AoE | Bomb Squad, Self-Destruct |

#### Units (25)

**Tanks (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Scrap Bot | T1 | 3 | 85 | 12 | 20 | - |
| Shield Drone | T1 | 4 | 100 | 14 | 25 | Shield |
| War Machine | T2 | 5 | 130 | 18 | 32 | Fortify |
| Siege Tank | T2 | 6 | 150 | 22 | 38 | Siege Mode |
| Colossus | T3 | 8 | 200 | 28 | 50 | Unstoppable |

**Melee DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Repair Bot | T1 | 3 | 55 | 18 | 8 | - |
| Blade Drone | T1 | 4 | 62 | 24 | 10 | Spin |
| Assault Mech | T2 | 5 | 75 | 32 | 15 | Charge |
| Destroyer | T2 | 6 | 85 | 38 | 18 | Overdrive |
| Omega Unit | T3 | 8 | 100 | 48 | 22 | Annihilate |

**Ranged DPS (5)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Gun Turret | T1 | 3 | 50 | 22 | 12 | - |
| Rocket Bot | T1 | 4 | 55 | 28 | 14 | Rocket |
| Sniper Drone | T2 | 5 | 65 | 35 | 16 | Precision |
| Artillery | T2 | 6 | 72 | 40 | 18 | Barrage |
| Devastator | T3 | 7 | 85 | 50 | 22 | Obliterate |

**Mages (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Spark Plug | T1 | 3 | 42 | 24 | 8 | Shock |
| Tesla Coil | T1 | 4 | 48 | 30 | 10 | Arc |
| Plasma Cannon | T2 | 6 | 60 | 40 | 14 | Plasma Bolt |
| Doom Cannon | T3 | 8 | 75 | 52 | 18 | Doom Ray |

**Support (4)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| Medic Bot | T1 | 3 | 52 | 8 | 10 | Repair |
| Shield Generator | T1 | 4 | 58 | 10 | 15 | Shield All |
| Engineer | T2 | 5 | 72 | 14 | 18 | Upgrade |
| Master Engineer | T3 | 7 | 88 | 18 | 22 | Overclock |

**Control (2)**
| Name | Tier | Cost | HP | ATK | Armor | Ability |
|------|------|------|-----|-----|-------|---------|
| EMP Drone | T1 | 4 | 60 | 16 | 12 | Disable |
| Gravity Well | T2 | 6 | 78 | 20 | 16 | Pull |

---

## Resolve System (Morale)

### Overview

Resolve is a secondary resource (0-100) that represents a unit's psychological stability (humans) or magical cohesion (undead). The mechanic allows winning not just through HP damage, but by breaking the enemy's will or magical bonds.

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIT STATUS BARS                          │
│  ┌──────────────────────────────────────┐ HP (Red)          │
│  │████████████████████░░░░░░░░░░░░░░░░░│ 65/100            │
│  └──────────────────────────────────────┘                    │
│  ┌──────────────────────────────────────┐ Resolve (Blue)    │
│  │██████████████░░░░░░░░░░░░░░░░░░░░░░░│ 45/100            │
│  └──────────────────────────────────────┘                    │
│  (Undead: Purple bar instead of Blue)                        │
└─────────────────────────────────────────────────────────────┘
```

### Core Mechanics

```typescript
interface UnitResolve {
  current: number;      // 0-100
  max: number;          // Base max resolve
  wasAttacked: boolean; // True if unit received damage this round (resets at turn start)
  state: 'ready' | 'retreating' | 'crumbling';  // Faction-specific states
}
```

**Key Rule: Resolve Damage = 100% ATK**
- Every attack deals Resolve damage equal to attacker's ATK
- Armor does NOT reduce Resolve damage
- This makes high-ATK units effective at breaking morale

### Resolve Damage Triggers

| Trigger | Resolve Damage | Condition |
|---------|----------------|-----------|
| Direct Attack | -100% ATK | Primary way to reduce Resolve |
| Ally Death (adjacent) | -15 | Ally dies within 1 cell |
| Ally Death (nearby) | -8 | Ally dies within 3 cells |
| Flank/Rear Attack | -12 | Additional to attack damage |
| Surrounded | -20 | 3+ enemies adjacent at turn start |
| Terror Aura | -10/turn | Passive while in monster's zone |

### Resolve Recovery

| Source | Value | Condition |
|--------|-------|-----------|
| Base Regeneration | MAX(5, 5% Max) | At turn start (living units only) |
| "Rest" Multiplier | x2.5 | Applied to Base if wasAttacked == false |
| Safe Zone | +5 | No enemies within 3 cells |
| Kill Enemy | +10 | Instant bonus on kill |
| Support Aura | +8 | Within 2 cells of Priest/Necromancer |
| Rally Spell | +30 | Leader spell (targeted) |

**Note:** Undead have Base Regeneration = 0. They can only recover Resolve through auras and spells.

---

### Faction Asymmetry

#### A. Empire (Humans) — "Retreating" State

When Resolve drops to 0:

```typescript
function handleHumanBreak(unit: BattleUnit): void {
  unit.resolve.state = 'retreating';
  
  // Immediate retreat: move 1-2 cells toward own edge
  const fleeTarget = findFleePosition(unit);
  moveUnit(unit, fleeTarget);
  
  // Free attacks from engaged enemies
  for (const enemy of getAdjacentEnemies(unit)) {
    performFreeAttack(enemy, unit);
  }
}
```

**Retreating Behavior:**
- Unit moves 1-2 cells toward own deployment edge
- Cannot attack or use abilities
- Loses Zone of Control
- Enemies in contact get 1 free attack (hit in the back)
- **Rally:** Automatically returns to Ready state when Resolve ≥ 25

#### B. Undead — "Crumbling" State

When Resolve drops to 0:

```typescript
function handleUndeadBreak(unit: BattleUnit): void {
  unit.resolve.state = 'crumbling';
  // Does NOT retreat, continues blocking the cell
}

function processCrumbling(unit: BattleUnit): void {
  if (unit.resolve.state !== 'crumbling') return;
  
  // Lose 15% current HP each turn
  const hpLoss = Math.floor(unit.currentHp * 0.15);
  unit.currentHp -= hpLoss;
  
  // -50% ATK and Armor while crumbling
  unit.effectiveAtk = unit.baseAtk * 0.5;
  unit.effectiveArmor = unit.baseArmor * 0.5;
}
```

**Crumbling Behavior:**
- Does NOT retreat — continues blocking the cell
- Loses 15% current HP at start of each turn
- ATK and Armor reduced by 50%
- Base Regeneration = 0 (cannot self-recover)
- **Recovery:** Only through forced Resolve healing (Necromancer Aura or Spell)

---

### Faction Comparison

| Aspect | Empire (Humans) | Undead |
|--------|-----------------|--------|
| State at Resolve 0 | Retreating | Crumbling |
| Movement | Flees toward edge | Stays in place |
| Combat | Cannot attack | Can attack (at -50% ATK) |
| HP Loss | None | -15% HP/turn |
| Self-Recovery | Yes (Base + Rest) | No (only via auras/spells) |
| Rally Threshold | 25 Resolve | Any Resolve > 0 |
| Tactical Role | Mobile, recoverable | Immobile, attrition |

**Strategic Implications:**
- **Empire** wins through maneuver and recovery during "rest" periods
- **Undead** wins by standing their ground, forcing enemies to hack through crumbling but blocking units

---

### Visual Feedback

```
Ready:        [████████████████████] Blue bar full
Low Resolve:  [████████░░░░░░░░░░░░] Blue bar depleting (flashes white on hit)
Critical:     [███░░░░░░░░░░░░░░░░░] Blue bar flashing red
Retreating:   [░░░░░░░░░░░░░░░░░░░░] "Broken Shield" icon (Humans)
Crumbling:    [░░░░░░░░░░░░░░░░░░░░] "Skull in Mist" icon (Undead, purple bar)
```

### Integration with Spells

Leader spells can interact with Resolve:

| Spell | Effect |
|-------|--------|
| **Rally** | Restore 30 Resolve to all allies, return Retreating units to Ready |
| **Inspire** | +20 Resolve to target, remove debuffs |
| **Terror** | -30 Resolve to all enemies in radius |
| **Dark Binding** | Restore 20 Resolve to Crumbling undead unit |
| **Fear** | Target loses 50% current Resolve |

### Battle Simulator Integration

```typescript
// In battle loop, after damage phase
function processResolve(state: BattleState): BattleState {
  for (const unit of state.allUnits) {
    // Reset wasAttacked flag at turn start
    if (unit.isStartOfTurn) {
      unit.resolve.wasAttacked = false;
    }
    
    // Check for break (Resolve = 0)
    if (unit.resolve.current <= 0 && unit.resolve.state === 'ready') {
      if (unit.faction === 'humans') {
        handleHumanBreak(unit);
        state.events.push({ type: 'unit_retreating', unitId: unit.id });
      } else if (unit.faction === 'undead') {
        handleUndeadBreak(unit);
        state.events.push({ type: 'unit_crumbling', unitId: unit.id });
      }
    }
    
    // Process crumbling damage (Undead only)
    if (unit.resolve.state === 'crumbling') {
      processCrumbling(unit);
    }
    
    // Check for rally (Humans only)
    if (unit.resolve.state === 'retreating' && unit.resolve.current >= 25) {
      unit.resolve.state = 'ready';
      state.events.push({ type: 'unit_rallied', unitId: unit.id });
    }
    
    // Apply resolve recovery
    applyResolveRecovery(unit, state);
  }
  
  return state;
}

function applyResolveRecovery(unit: BattleUnit, state: BattleState): void {
  if (unit.resolve.state !== 'ready') return;
  
  // Base regeneration (0 for undead)
  let recovery = unit.faction === 'undead' ? 0 : Math.max(5, unit.resolve.max * 0.05);
  
  // Rest multiplier (x2.5 if not attacked)
  if (!unit.resolve.wasAttacked) {
    recovery *= 2.5;
  }
  
  // Safe zone bonus
  if (!hasEnemiesWithinRange(unit, 3, state)) {
    recovery += 5;
  }
  
  // Support aura bonus
  if (hasSupportAura(unit, state)) {
    recovery += 8;
  }
  
  unit.resolve.current = Math.min(unit.resolve.max, unit.resolve.current + recovery);
}
```

---

## Migration Strategy

1. **Phase 1**: Create new tables (runs, factions, leaders, snapshots)
2. **Phase 2**: Implement backend modules (run, draft, spell)
3. **Phase 3**: Create frontend pages and components
4. **Phase 4**: Integrate with existing battle system
5. **Phase 5**: Add matchmaking and rating
6. **Phase 6**: Implement Resolve system
7. **Phase 7**: Implement Engagement system

MVP mode remains unchanged - roguelike is a separate game mode.

---

## Engagement System (Zone of Control)

### Overview

Engagement creates "sticky" melee combat that prevents chaotic movement, establishes front lines, and protects backline units.

```
┌─────────────────────────────────────────────────────────────┐
│                    ENGAGEMENT ZONE                           │
│                                                              │
│         [E]     ← Enemy unit                                │
│       ↙ ↓ ↘                                                 │
│     [X][X][X]   ← Zone of Control (8 cells)                 │
│     [X][U][X]   ← Unit [U] is ENGAGED                       │
│     [X][X][X]                                                │
│                                                              │
│  Unit cannot move while enemy is adjacent                   │
└─────────────────────────────────────────────────────────────┘
```

### Core Mechanics

```typescript
interface EngagementState {
  isEngaged: boolean;
  engagedBy: string[];  // Unit IDs of engaging enemies
  canDisengage: boolean;
}

function checkEngagement(unit: BattleUnit, state: BattleState): boolean {
  const adjacentEnemies = getAdjacentUnits(unit.position, state)
    .filter(u => u.team !== unit.team && u.isAlive);
  return adjacentEnemies.length > 0;
}
```

### Engagement Rules

```typescript
// At start of unit's turn
function processEngagement(unit: BattleUnit, state: BattleState): void {
  unit.engagement.isEngaged = checkEngagement(unit, state);
  
  if (unit.engagement.isEngaged) {
    // Block normal movement
    unit.canMove = false;
    
    // Force target selection from engaging enemies
    unit.forcedTargets = unit.engagement.engagedBy;
    
    // Apply archery penalty for ranged units
    if (unit.range > 1) {
      unit.canUseRangedAttack = false;
    }
  }
}
```

### Disengage Action

```typescript
interface DisengageResult {
  success: boolean;
  attacksOfOpportunity: Attack[];
  newPosition: Position;
}

function attemptDisengage(unit: BattleUnit, state: BattleState): DisengageResult {
  const engagingEnemies = getEngagingEnemies(unit, state);
  
  // Find escape direction (toward own edge or away from enemies)
  const escapePosition = findEscapePosition(unit, state);
  if (!escapePosition) {
    return { success: false, attacksOfOpportunity: [], newPosition: unit.position };
  }
  
  // Trigger Attacks of Opportunity
  const attacks: Attack[] = [];
  for (const enemy of engagingEnemies) {
    if (!hasTag(enemy, 'Incorporeal')) {
      const attack = createAttackOfOpportunity(enemy, unit);
      attacks.push(attack);
      
      // AoO deals damage to both HP and Resolve
      applyDamage(unit, attack.damage);
      applyResolveDamage(unit, attack.damage);
    }
  }
  
  // Move unit 1 cell
  unit.position = escapePosition;
  unit.hasActed = true;  // Cannot attack this turn
  
  return { success: true, attacksOfOpportunity: attacks, newPosition: escapePosition };
}
```

### AI Disengage Priority

```typescript
function shouldDisengage(unit: BattleUnit, state: BattleState): boolean {
  const role = unit.role;
  
  // Ranged/Mage: Always try to escape melee
  if (role === 'ranged_dps' || role === 'mage') {
    return true;  // 100% priority
  }
  
  // Assassin/Wolf: Escape if better target nearby
  if (hasTag(unit, 'Skirmisher') || role === 'melee_dps') {
    const betterTarget = findHighPriorityTarget(unit, state);
    if (betterTarget && Math.random() < 0.7) {
      return true;  // 70% priority
    }
  }
  
  // Blocker: Escape if blocking stronger ally
  if (isBlockingAlly(unit, state) && Math.random() < 0.3) {
    return true;  // 30% priority
  }
  
  return false;
}
```

### Unit Tags

```typescript
type EngagementTag = 'Incorporeal' | 'Flyer' | 'Skirmisher' | 'Unstoppable' | 'LongReach' | 'Heavy';

interface TagEffects {
  ignoresEngagement: boolean;
  triggersAoO: boolean;
  canPassThrough: boolean;
  engagementRange: number;
}

const TAG_EFFECTS: Record<EngagementTag, TagEffects> = {
  Incorporeal: {
    ignoresEngagement: true,
    triggersAoO: false,
    canPassThrough: true,
    engagementRange: 1,
  },
  Flyer: {
    ignoresEngagement: true,  // During movement only
    triggersAoO: true,        // On takeoff
    canPassThrough: true,     // By air
    engagementRange: 1,
  },
  Skirmisher: {
    ignoresEngagement: false, // Can move through with Speed
    triggersAoO: true,        // Per cell passed
    canPassThrough: false,
    engagementRange: 1,
  },
  Unstoppable: {
    ignoresEngagement: true,  // From small/medium only
    triggersAoO: false,       // From infantry
    canPassThrough: true,     // With micro-damage
    engagementRange: 1,
  },
  LongReach: {
    ignoresEngagement: false,
    triggersAoO: true,
    canPassThrough: false,
    engagementRange: 2,       // Engages from 1 empty cell away
  },
  Heavy: {
    ignoresEngagement: false,
    triggersAoO: true,
    canPassThrough: false,
    engagementRange: 1,
  },
};
```

### Faction-Specific Tactics

#### Empire (Humans)
- **Strategy**: Use Engagement to create "shield wall". Swordsmen engage enemies while archers work from behind.
- **T3 Ability**: "Coordinated Retreat" — unit takes 50% less damage from Attacks of Opportunity.

#### Undead
- **Strategy**: Use Engagement as a trap. Zombies engage elite knights, preventing movement even as zombies die.
- **Note**: Undead don't retreat from panic (they crumble in place), so their only way to break Engagement is tactical Disengage.

### Battle Simulator Integration

```typescript
// In battle loop, before action phase
function processEngagementPhase(state: BattleState): BattleState {
  for (const unit of state.allUnits) {
    // Update engagement state
    unit.engagement.isEngaged = checkEngagement(unit, state);
    unit.engagement.engagedBy = getEngagingEnemies(unit, state).map(e => e.id);
    
    // Check for tag-based exceptions
    if (hasTag(unit, 'Incorporeal')) {
      unit.engagement.isEngaged = false;
    }
    
    // AI decision: should this unit disengage?
    if (unit.engagement.isEngaged && shouldDisengage(unit, state)) {
      const result = attemptDisengage(unit, state);
      if (result.success) {
        for (const attack of result.attacksOfOpportunity) {
          state.events.push({ 
            type: 'attack_of_opportunity', 
            attackerId: attack.attackerId,
            targetId: unit.id,
            damage: attack.damage,
          });
        }
        state.events.push({ 
          type: 'unit_disengaged', 
          unitId: unit.id, 
          newPosition: result.newPosition,
        });
      }
    }
  }
  
  return state;
}
```

### Visual Feedback

```
Engaged:      Unit has red border, "crossed swords" icon
Disengage:    Arrow animation showing retreat path
AoO:          Quick slash animation from each engaging enemy
Incorporeal:  Unit appears translucent, passes through enemies
Flyer:        Unit rises, moves over battlefield, lands
Unstoppable:  Unit pushes through with "impact" effect
```

---

## Flanking System

### Overview

Flanking rewards tactical positioning by punishing units attacked from sides or rear. It creates meaningful choices about formation and maneuver.

```
┌─────────────────────────────────────────────────────────────┐
│                    FACING & ARCS                             │
│                                                              │
│              [F][F][F]  ← Front Arc (3 cells)               │
│           [S]   ↑   [S]  ← Side Arcs (2 cells each)         │
│           [S]  [U]  [S]  ← Unit facing NORTH                │
│              [R][R][R]  ← Rear Arc (3 cells)                │
│                                                              │
│  Attacks from [S] or [R] = FLANKING                         │
└─────────────────────────────────────────────────────────────┘
```

### Core Mechanics

```typescript
type FacingDirection = 'north' | 'south' | 'east' | 'west';

interface UnitFacing {
  direction: FacingDirection;
  frontArc: Position[];   // 3 cells
  flankArc: Position[];   // 4 cells (2 each side)
  rearArc: Position[];    // 3 cells
}

function updateFacing(unit: BattleUnit, action: 'move' | 'attack', target: Position): void {
  // Unit faces direction of last movement or attack
  const dx = target.x - unit.position.x;
  const dy = target.y - unit.position.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    unit.facing.direction = dx > 0 ? 'east' : 'west';
  } else {
    unit.facing.direction = dy > 0 ? 'south' : 'north';
  }
  
  recalculateArcs(unit);
}
```

### Flanking Detection

```typescript
type AttackArc = 'front' | 'flank' | 'rear';

function getAttackArc(attacker: Position, target: BattleUnit): AttackArc {
  if (target.facing.frontArc.some(p => p.x === attacker.x && p.y === attacker.y)) {
    return 'front';
  }
  if (target.facing.rearArc.some(p => p.x === attacker.x && p.y === attacker.y)) {
    return 'rear';
  }
  return 'flank';
}

function isFlanking(attacker: Position, target: BattleUnit): boolean {
  const arc = getAttackArc(attacker, target);
  return arc === 'flank' || arc === 'rear';
}
```

### Flanking Effects

```typescript
interface FlankingEffects {
  noRiposte: boolean;           // Target cannot counter-attack
  bonusResolveDamage: number;   // +12 shock damage
  bypassShield: boolean;        // Shield armor bonus ignored
}

function applyFlankingEffects(attacker: BattleUnit, target: BattleUnit): FlankingEffects {
  const arc = getAttackArc(attacker.position, target);
  
  if (arc === 'front') {
    return { noRiposte: false, bonusResolveDamage: 0, bypassShield: false };
  }
  
  // Flank or Rear attack
  return {
    noRiposte: true,
    bonusResolveDamage: 12,
    bypassShield: true,
  };
}
```

### Engagement + Flanking Interaction

```typescript
function processFlankingInEngagement(unit: BattleUnit, state: BattleState): void {
  // If unit is engaged from front, it cannot turn to face flankers
  if (unit.engagement.isEngaged) {
    const frontalEnemy = unit.engagement.engagedBy[0];
    if (frontalEnemy && isInFrontArc(frontalEnemy, unit)) {
      // Unit is "locked" facing the frontal enemy
      // All other attackers get flanking bonus
      unit.facingLocked = true;
    }
  }
}

// Unit only turns after frontal enemy dies
function onEnemyDeath(deadEnemy: BattleUnit, state: BattleState): void {
  for (const unit of state.allUnits) {
    if (unit.facingLocked && unit.engagement.engagedBy[0] === deadEnemy.id) {
      unit.facingLocked = false;
      // Unit can now turn to face remaining threats
    }
  }
}
```

### Visual Feedback

```
Facing:       Subtle arrow indicator on unit
Flanked:      "Flanked!" popup, red flash
Shield Bypass: Broken shield icon
Rear Attack:  "Backstab!" popup, critical hit effect
```

---

## Line of Sight System (Ranged Trajectories)

### Overview

LoS creates meaningful deployment decisions by differentiating between direct-fire and arc-fire ranged units. Players must balance defensive density against ranged effectiveness.

```
┌─────────────────────────────────────────────────────────────┐
│                    DIRECT FIRE (Blocked)                     │
│                                                              │
│     [E] ← Enemy target                                      │
│      ↑                                                       │
│     [A] ← Ally (BLOCKS line of sight)                       │
│      ↑                                                       │
│     [M] ← Musketeer (CANNOT fire)                           │
│                                                              │
│  "Musketeer's shot is blocked by allied unit"               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ARC FIRE (Clear)                          │
│                                                              │
│     [E] ← Enemy target                                      │
│      ↑                                                       │
│     [A] ← Ally (arrow flies OVER)                           │
│      ↑                                                       │
│     [B] ← Bowman (CAN fire)                                 │
│                                                              │
│  "Bowman's arrow arcs over allied unit"                     │
└─────────────────────────────────────────────────────────────┘
```

### Core Mechanics

```typescript
type TrajectoryType = 'direct' | 'arc' | 'homing';

interface RangedUnit {
  trajectory: TrajectoryType;
  range: number;
}

const TRAJECTORY_TAGS: Record<string, TrajectoryType> = {
  'DirectFire': 'direct',   // Muskets, Crossbows, Magic Rays
  'ArcFire': 'arc',         // Bows, Mortars, Catapults
  'MagicMissile': 'homing', // Single-target spells (ignore LoS)
};
```

### LoS Calculation (Bresenham Line)

```typescript
function hasLineOfSight(
  shooter: Position,
  target: Position,
  state: BattleState
): boolean {
  const line = getBresenhamLine(shooter, target);
  
  // Check all cells between shooter and target (exclusive)
  for (let i = 1; i < line.length - 1; i++) {
    const cell = line[i];
    if (isOccupied(cell, state)) {
      return false;  // Blocked by unit
    }
  }
  
  return true;
}

function getBresenhamLine(start: Position, end: Position): Position[] {
  const points: Position[] = [];
  let x0 = start.x, y0 = start.y;
  const x1 = end.x, y1 = end.y;
  
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  while (true) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  
  return points;
}
```

### Ranged Attack Validation

```typescript
function canRangedAttack(
  attacker: BattleUnit,
  target: BattleUnit,
  state: BattleState
): { canAttack: boolean; reason?: string } {
  // Check range
  const distance = manhattanDistance(attacker.position, target.position);
  if (distance > attacker.range) {
    return { canAttack: false, reason: 'out_of_range' };
  }
  
  // Check trajectory type
  const trajectory = getTrajectoryType(attacker);
  
  switch (trajectory) {
    case 'arc':
    case 'homing':
      // Always can fire (ignores LoS)
      return { canAttack: true };
      
    case 'direct':
      // Requires clear LoS
      if (!hasLineOfSight(attacker.position, target.position, state)) {
        return { canAttack: false, reason: 'los_blocked' };
      }
      return { canAttack: true };
  }
}
```

### AI Behavior (LoS-Aware)

```typescript
function findRangedTarget(
  unit: BattleUnit,
  state: BattleState
): BattleUnit | null {
  const trajectory = getTrajectoryType(unit);
  const enemies = getEnemyUnits(unit, state);
  
  // Filter by range and LoS
  const validTargets = enemies.filter(enemy => {
    const result = canRangedAttack(unit, enemy, state);
    return result.canAttack;
  });
  
  if (validTargets.length === 0) {
    // No valid targets - consider repositioning
    if (trajectory === 'direct') {
      return null;  // AI will try to move for better LoS
    }
  }
  
  // Priority: lowest HP > highest threat > nearest
  return validTargets.sort((a, b) => {
    if (a.hp !== b.hp) return a.hp - b.hp;
    if (a.atk !== b.atk) return b.atk - a.atk;
    return manhattanDistance(unit.position, a.position) - 
           manhattanDistance(unit.position, b.position);
  })[0] || null;
}

function findCorridorToShooter(
  fastUnit: BattleUnit,
  state: BattleState
): Position[] | null {
  // AI looks for empty cells leading directly to enemy ranged units
  const enemyRanged = getEnemyUnits(fastUnit, state)
    .filter(u => u.range > 1);
  
  for (const shooter of enemyRanged) {
    // Check if there's a direct path (corridor) to the shooter
    const path = findPath(fastUnit.position, shooter.position, state);
    if (path && hasOpenCorridor(path, state)) {
      return path;
    }
  }
  
  return null;
}

function hasOpenCorridor(path: Position[], state: BattleState): boolean {
  // A corridor is "open" if it doesn't require engaging enemy tanks
  const engagementCells = path.filter(p => 
    getAdjacentUnits(p, state).some(u => u.role === 'tank')
  );
  return engagementCells.length === 0;
}
```

### Dynamic LoS Events

```typescript
// When unit retreats, check if it blocks allied shooters
function onUnitRetreat(unit: BattleUnit, newPosition: Position, state: BattleState): void {
  const alliedShooters = getAlliedUnits(unit, state)
    .filter(u => u.range > 1 && getTrajectoryType(u) === 'direct');
  
  for (const shooter of alliedShooters) {
    // Check if retreat position blocks any of shooter's targets
    const targets = getEnemyUnits(shooter, state);
    for (const target of targets) {
      const line = getBresenhamLine(shooter.position, target.position);
      if (line.some(p => p.x === newPosition.x && p.y === newPosition.y)) {
        state.events.push({
          type: 'los_blocked_by_retreat',
          shooterId: shooter.id,
          blockerId: unit.id,
          targetId: target.id,
        });
      }
    }
  }
}

// When unit dies, check if it opens new firing lanes
function onUnitDeath(unit: BattleUnit, state: BattleState): void {
  const enemyShooters = getEnemyUnits(unit, state)
    .filter(u => u.range > 1 && getTrajectoryType(u) === 'direct');
  
  for (const shooter of enemyShooters) {
    // Check if death opens LoS to new targets
    const newTargets = getAlliedUnits(unit, state).filter(ally => {
      const line = getBresenhamLine(shooter.position, ally.position);
      return line.some(p => p.x === unit.position.x && p.y === unit.position.y);
    });
    
    if (newTargets.length > 0) {
      state.events.push({
        type: 'los_opened',
        shooterId: shooter.id,
        newTargets: newTargets.map(t => t.id),
      });
    }
  }
}
```

### Deployment Preview (UI)

```typescript
interface LoSPreview {
  validTargets: Position[];      // Green highlight
  blockedTargets: Position[];    // Red highlight
  firingLanes: Position[][];     // Lines showing clear paths
  corridors: Position[];         // Yellow highlight (vulnerability)
}

function calculateLoSPreview(
  rangedUnit: BattleUnit,
  deploymentGrid: Position[],
  state: BattleState
): LoSPreview {
  const trajectory = getTrajectoryType(rangedUnit);
  const preview: LoSPreview = {
    validTargets: [],
    blockedTargets: [],
    firingLanes: [],
    corridors: [],
  };
  
  // For each potential enemy position (rows 8-9)
  for (let y = 8; y <= 9; y++) {
    for (let x = 0; x < 8; x++) {
      const targetPos = { x, y };
      
      if (trajectory === 'direct') {
        if (hasLineOfSight(rangedUnit.position, targetPos, state)) {
          preview.validTargets.push(targetPos);
          preview.firingLanes.push(getBresenhamLine(rangedUnit.position, targetPos));
        } else {
          preview.blockedTargets.push(targetPos);
        }
      } else {
        // Arc fire - all in range are valid
        preview.validTargets.push(targetPos);
      }
    }
  }
  
  // Identify corridors (empty cells that fast enemies could use)
  preview.corridors = findVulnerableCorridors(rangedUnit.position, state);
  
  return preview;
}

function findVulnerableCorridors(shooterPos: Position, state: BattleState): Position[] {
  const corridors: Position[] = [];
  
  // Check deployment zone (rows 0-1) for empty cells in front of shooter
  for (let y = 0; y <= 1; y++) {
    for (let x = 0; x < 8; x++) {
      const pos = { x, y };
      if (!isOccupied(pos, state)) {
        // Check if this empty cell creates a direct path to shooter
        if (hasDirectPath(pos, shooterPos, state)) {
          corridors.push(pos);
        }
      }
    }
  }
  
  return corridors;
}
```

### Formation Strategies

```
┌─────────────────────────────────────────────────────────────┐
│              TIGHT DEFENSE (Phalanx)                         │
│                                                              │
│  Row 1: [T][T][T][T][T][T][T][T]  ← Full tank line          │
│  Row 0: [M][M][A][A][M][M][A][A]  ← Mixed ranged            │
│                                                              │
│  + Maximum Phalanx bonus                                    │
│  + No corridors for enemy                                   │
│  - Musketeers [M] blocked by tanks                          │
│  - Only Archers [A] can fire                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              STAGGERED LINE (Balanced)                       │
│                                                              │
│  Row 1: [T][ ][T][ ][T][ ][T][ ]  ← Gaps between tanks      │
│  Row 0: [ ][M][ ][M][ ][M][ ][M]  ← Musketeers in gaps      │
│                                                              │
│  + Musketeers have clear LoS                                │
│  + Some Phalanx bonus                                       │
│  - Corridors exist (enemy can reach musketeers)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              CHECKERBOARD (Maximum Fire)                     │
│                                                              │
│  Row 1: [T][ ][T][ ][T][ ][T][ ]                            │
│  Row 0: [ ][M][ ][M][ ][M][ ][M]                            │
│                                                              │
│  + All musketeers have clear LoS                            │
│  - Minimal Phalanx bonus                                    │
│  - Many corridors (very vulnerable to cavalry)              │
└─────────────────────────────────────────────────────────────┘
```

### Visual Feedback

```
LoS Clear:     Green line from shooter to target
LoS Blocked:   Red X on blocking unit, dashed red line
Corridor:      Yellow highlight on empty cells (vulnerability)
Firing Lane:   Subtle green overlay on valid fire path
Arc Fire:      Curved arrow animation over obstacles
```

---

## Riposte System (Counter-Attack)

### Overview

Riposte makes melee combat a two-way exchange. The defender can strike back immediately, with effectiveness based on Initiative comparison.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLASH SEQUENCE                            │
│                                                              │
│  1. Attacker strikes → Target takes damage                  │
│  2. Check Riposte conditions                                │
│  3. If allowed: Target strikes back (100% or 50% damage)    │
│  4. Attacker takes Riposte damage                           │
│                                                              │
│  "Every melee attack is a duel"                             │
└─────────────────────────────────────────────────────────────┘
```

### Core Mechanics

```typescript
interface RiposteState {
  chargesRemaining: number;  // = attackCount, resets each round
  canRiposte: boolean;
}

function initRiposteCharges(unit: BattleUnit): void {
  unit.riposte.chargesRemaining = unit.attackCount;
}

// Called at start of each round
function resetRiposteCharges(state: BattleState): void {
  for (const unit of state.allUnits) {
    unit.riposte.chargesRemaining = unit.attackCount;
  }
}
```

### Riposte Eligibility

```typescript
function canRiposte(target: BattleUnit, attacker: BattleUnit): boolean {
  // Must be alive
  if (target.hp <= 0) return false;
  
  // Must have Resolve (not broken)
  if (target.resolve.current <= 0) return false;
  
  // Must have charges
  if (target.riposte.chargesRemaining <= 0) return false;
  
  // Must be melee unit
  if (target.range > 1) return false;
  
  // Must NOT be flanked
  if (isFlanking(attacker.position, target)) return false;
  
  // Attacker must be in melee range
  if (getDistance(attacker.position, target.position) > 1) return false;
  
  return true;
}
```

### Initiative-Based Damage

```typescript
function calculateRiposteDamage(target: BattleUnit, attacker: BattleUnit): number {
  const baseDamage = calculatePhysicalDamage(target, attacker);
  
  // "Master" vs "Clumsy" comparison
  const multiplier = target.initiative >= attacker.initiative ? 1.0 : 0.5;
  
  return Math.floor(baseDamage * multiplier);
}
```

### Clash Execution

```typescript
interface ClashResult {
  attackDamage: number;
  attackResolveDamage: number;
  riposteDamage: number;
  riposteResolveDamage: number;
  wasFlanked: boolean;
  riposteOccurred: boolean;
}

function executeClash(attacker: BattleUnit, target: BattleUnit): ClashResult {
  const flankingEffects = applyFlankingEffects(attacker, target);
  
  // Phase 1: Attacker strikes
  const attackDamage = calculatePhysicalDamage(attacker, target, flankingEffects.bypassShield);
  const attackResolveDamage = attacker.atk + flankingEffects.bonusResolveDamage;
  
  applyDamage(target, attackDamage);
  applyResolveDamage(target, attackResolveDamage);
  
  // Phase 2: Check Riposte
  let riposteDamage = 0;
  let riposteResolveDamage = 0;
  let riposteOccurred = false;
  
  if (!flankingEffects.noRiposte && canRiposte(target, attacker)) {
    riposteDamage = calculateRiposteDamage(target, attacker);
    riposteResolveDamage = Math.floor(target.atk * (target.initiative >= attacker.initiative ? 1.0 : 0.5));
    
    applyDamage(attacker, riposteDamage);
    applyResolveDamage(attacker, riposteResolveDamage);
    
    target.riposte.chargesRemaining--;
    riposteOccurred = true;
  }
  
  return {
    attackDamage,
    attackResolveDamage,
    riposteDamage,
    riposteResolveDamage,
    wasFlanked: flankingEffects.noRiposte,
    riposteOccurred,
  };
}
```

### Faction Tactics

#### Empire (Humans)
```typescript
// High Initiative = 100% Riposte damage
// Knights (Init 20) vs Zombies (Init 4) = Knights always get full Riposte
// Strategy: Quality over quantity, dangerous to attack head-on

// T3 Ability: "Coordinated Defense"
function coordinatedDefense(unit: BattleUnit): void {
  // Riposte deals +25% damage
  unit.riposteDamageBonus = 0.25;
}
```

#### Undead
```typescript
// Low Initiative = 50% Riposte damage
// Zombies (Init 4) vs Knights (Init 20) = Zombies get weak Riposte
// Strategy: Swarm to exhaust enemy Riposte charges

// Tactical advantage: Cheap units "soak" Ripostes
// Example: 3 Zombies attack Knight
// - Zombie 1: Knight Ripostes (charge 1 used)
// - Zombie 2: Knight Ripostes (charge 2 used, if attackCount=2)
// - Zombie 3: Knight has no charges left, no Riposte!
```

### Visual Feedback

```typescript
interface RiposteVisuals {
  fullRiposte: 'parry_animation' | 'spark_effect';
  weakRiposte: 'flail_animation';
  noRiposte: 'flanked_icon' | 'no_charges_icon' | 'broken_icon';
}

// Animation sequence
function animateClash(result: ClashResult): void {
  // 1. Attacker swing animation
  playAnimation('attack', attacker);
  
  // 2. Damage numbers on target
  showDamage(target, result.attackDamage);
  
  // 3. Riposte (if occurred)
  if (result.riposteOccurred) {
    const riposteType = target.initiative >= attacker.initiative ? 'full' : 'weak';
    playAnimation(riposteType === 'full' ? 'parry' : 'flail', target);
    showDamage(attacker, result.riposteDamage);
  } else if (result.wasFlanked) {
    showIcon(target, 'flanked');
  } else {
    showIcon(target, 'no_charges');
  }
}
```

### Battle Events

```typescript
// Events for battle log
interface ClashEvent {
  type: 'clash';
  attackerId: string;
  targetId: string;
  attackDamage: number;
  riposteDamage: number;
  wasFlanked: boolean;
  riposteType: 'full' | 'weak' | 'none';
}

// Example battle log entry:
// "Knight attacks Zombie for 25 damage. Zombie ripostes for 8 damage (weak)."
// "Ghoul flanks Archer for 18 damage. No riposte (flanked)."
```

---

## Charge System (Cavalry Momentum)

### Overview

Charge transforms distance into damage, making cavalry devastating on open fields but useless in tight formations.

```
┌─────────────────────────────────────────────────────────────┐
│                    CHARGE SEQUENCE                           │
│                                                              │
│  [K]────────────→[E]                                        │
│   ↑               ↑                                          │
│   Knight         Enemy                                       │
│   (4 cells)                                                  │
│                                                              │
│  Momentum: +80% ATK (4 × 20%)                               │
│  Shock: -10 Resolve (instant)                               │
│  Initiative: +5 (for Riposte calculation)                   │
└─────────────────────────────────────────────────────────────┘
```

### Core Mechanics

```typescript
interface ChargeState {
  isCharging: boolean;
  cellsMoved: number;
  momentumBonus: number;
  path: Position[];
}

const CHARGE_CONFIG = {
  minDistance: 2,           // Minimum cells for charge
  momentumPerCell: 0.2,     // +20% ATK per cell
  shockResolveDamage: 10,   // Instant Resolve damage
  initiativeBonus: 5,       // +5 Initiative during clash
};
```

### Charge Validation

```typescript
function canCharge(
  unit: BattleUnit,
  target: BattleUnit,
  state: BattleState
): { canCharge: boolean; path: Position[]; reason?: string } {
  // Must have Cavalry or Charger tag
  if (!hasTag(unit, 'Cavalry') && !hasTag(unit, 'Charger')) {
    return { canCharge: false, path: [], reason: 'not_cavalry' };
  }
  
  // Find straight-line path to target
  const path = findStraightLinePath(unit.position, target.position, state);
  
  if (!path) {
    return { canCharge: false, path: [], reason: 'no_straight_path' };
  }
  
  // Must be at least 2 cells
  if (path.length < CHARGE_CONFIG.minDistance) {
    return { canCharge: false, path: [], reason: 'too_close' };
  }
  
  // Check for ZoC interruption
  const zocInterrupt = findZoCInterruption(path, unit, state);
  if (zocInterrupt) {
    return { canCharge: false, path: path.slice(0, zocInterrupt.index), reason: 'zoc_interrupt' };
  }
  
  return { canCharge: true, path };
}

function findStraightLinePath(
  start: Position,
  end: Position,
  state: BattleState
): Position[] | null {
  // Must be horizontal, vertical, or diagonal straight line
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // Check if straight line (same row, column, or diagonal)
  if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) {
    return null;  // Not a straight line
  }
  
  const path: Position[] = [];
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
  
  let x = start.x + stepX;
  let y = start.y + stepY;
  
  while (x !== end.x || y !== end.y) {
    const pos = { x, y };
    
    // Check if cell is blocked
    if (isOccupied(pos, state)) {
      return null;  // Path blocked
    }
    
    path.push(pos);
    x += stepX;
    y += stepY;
  }
  
  return path;
}
```

### Charge Execution

```typescript
interface ChargeResult {
  cellsMoved: number;
  momentumBonus: number;
  totalDamage: number;
  shockDamage: number;
  wasInterrupted: boolean;
  interruptPosition?: Position;
}

function executeCharge(
  attacker: BattleUnit,
  target: BattleUnit,
  path: Position[],
  state: BattleState
): ChargeResult {
  const cellsMoved = path.length;
  const momentumBonus = cellsMoved * CHARGE_CONFIG.momentumPerCell;
  
  // Apply shock damage (instant Resolve hit)
  applyResolveDamage(target, CHARGE_CONFIG.shockResolveDamage);
  state.events.push({
    type: 'charge_shock',
    attackerId: attacker.id,
    targetId: target.id,
    resolveDamage: CHARGE_CONFIG.shockResolveDamage,
  });
  
  // Calculate charge damage
  const baseDamage = calculatePhysicalDamage(attacker, target);
  const totalDamage = Math.floor(baseDamage * (1 + momentumBonus));
  
  // Apply Initiative bonus for this clash
  const originalInitiative = attacker.initiative;
  attacker.initiative += CHARGE_CONFIG.initiativeBonus;
  
  // Execute clash with boosted stats
  applyDamage(target, totalDamage);
  
  // Restore Initiative
  attacker.initiative = originalInitiative;
  
  // Move attacker to adjacent position
  attacker.position = getAdjacentPosition(target.position, path);
  
  state.events.push({
    type: 'charge_impact',
    attackerId: attacker.id,
    targetId: target.id,
    cellsMoved,
    momentumBonus: Math.floor(momentumBonus * 100),
    damage: totalDamage,
  });
  
  return {
    cellsMoved,
    momentumBonus,
    totalDamage,
    shockDamage: CHARGE_CONFIG.shockResolveDamage,
    wasInterrupted: false,
  };
}
```

### Counter-Charge (Spear Wall)

```typescript
function checkSpearWall(
  charger: BattleUnit,
  target: BattleUnit
): { negatesCharge: boolean; strikesFirst: boolean; bonusDamage: number } {
  if (!hasTag(target, 'SpearWall')) {
    return { negatesCharge: false, strikesFirst: false, bonusDamage: 0 };
  }
  
  // Spear Wall negates ALL charge bonuses
  // AND strikes first
  const bonusDamage = hasTag(target, 'AntiCavalry') ? 0.5 : 0;  // Halberdier bonus
  
  return {
    negatesCharge: true,
    strikesFirst: true,
    bonusDamage,
  };
}

function executeChargeVsSpearWall(
  charger: BattleUnit,
  spearman: BattleUnit,
  state: BattleState
): void {
  // Spearman strikes FIRST
  const spearDamage = calculatePhysicalDamage(spearman, charger);
  const bonusMultiplier = hasTag(spearman, 'AntiCavalry') ? 1.5 : 1.0;
  const totalSpearDamage = Math.floor(spearDamage * bonusMultiplier);
  
  applyDamage(charger, totalSpearDamage);
  
  state.events.push({
    type: 'spear_wall_counter',
    spearmanId: spearman.id,
    chargerId: charger.id,
    damage: totalSpearDamage,
  });
  
  // Charger attacks with NO momentum bonus (if still alive)
  if (charger.hp > 0) {
    const chargerDamage = calculatePhysicalDamage(charger, spearman);
    applyDamage(spearman, chargerDamage);
  }
}
```

### AI Charge Behavior

```typescript
function findBestChargeTarget(
  cavalry: BattleUnit,
  state: BattleState
): { target: BattleUnit; path: Position[] } | null {
  const enemies = getEnemyUnits(cavalry, state);
  
  let bestTarget: BattleUnit | null = null;
  let bestPath: Position[] = [];
  let bestScore = 0;
  
  for (const enemy of enemies) {
    const result = canCharge(cavalry, enemy, state);
    
    if (result.canCharge) {
      // Score = momentum bonus × target value
      const momentum = result.path.length * CHARGE_CONFIG.momentumPerCell;
      const targetValue = getTargetPriority(enemy);  // Ranged > Support > Melee > Tank
      const score = momentum * targetValue;
      
      // Avoid SpearWall targets unless no other option
      if (hasTag(enemy, 'SpearWall')) {
        continue;  // Skip spearmen
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestTarget = enemy;
        bestPath = result.path;
      }
    }
  }
  
  return bestTarget ? { target: bestTarget, path: bestPath } : null;
}

function shouldDisengageForCharge(
  cavalry: BattleUnit,
  state: BattleState
): boolean {
  // If engaged, check if disengaging would enable a valuable charge
  if (!cavalry.engagement.isEngaged) return false;
  
  // Simulate disengage position
  const disengagePos = findDisengagePosition(cavalry, state);
  if (!disengagePos) return false;
  
  // Check if charge would be possible from new position
  const potentialTargets = getEnemyUnits(cavalry, state);
  for (const target of potentialTargets) {
    const mockState = { ...state };
    mockState.units = mockState.units.map(u => 
      u.id === cavalry.id ? { ...u, position: disengagePos } : u
    );
    
    const chargeResult = canCharge({ ...cavalry, position: disengagePos }, target, mockState);
    if (chargeResult.canCharge && chargeResult.path.length >= 3) {
      // Worth it: 3+ cell charge is valuable
      return true;
    }
  }
  
  return false;
}
```

### Deployment Implications

```
┌─────────────────────────────────────────────────────────────┐
│              CHARGE LANE FORMATION                           │
│                                                              │
│  Row 1: [T][T][ ][ ][T][T][ ][ ]  ← Gaps for cavalry        │
│  Row 0: [M][M][K][ ][M][M][K][ ]  ← Knights [K] in lanes    │
│                                                              │
│  + Knights have 4+ cell charge lanes                        │
│  + Musketeers protected by tanks                            │
│  - Fewer tanks = weaker front line                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              ANTI-CAVALRY FORMATION                          │
│                                                              │
│  Row 1: [S][S][S][S][S][S][S][S]  ← Full spearman line      │
│  Row 0: [A][A][A][A][A][A][A][A]  ← Archers behind          │
│                                                              │
│  + Spear Wall negates ALL enemy charges                     │
│  + Dense formation = maximum Phalanx bonus                  │
│  - No friendly cavalry charges possible                     │
│  - Vulnerable to magic/ranged                               │
└─────────────────────────────────────────────────────────────┘
```

### Visual Feedback

```typescript
interface ChargeVisuals {
  chargePath: Position[];        // Green arrow showing path
  momentumCounter: string;       // "+60%" overlay
  impactAnimation: 'dust_cloud' | 'screen_shake';
  spearWallCounter: 'pike_brace' | 'impale';
}

function animateCharge(result: ChargeResult, attacker: BattleUnit, target: BattleUnit): void {
  // 1. Show charge path preview
  highlightPath(result.path, 'charge_green');
  
  // 2. Show momentum counter
  showFloatingText(attacker, `+${Math.floor(result.momentumBonus * 100)}%`);
  
  // 3. Animate movement (fast)
  animateMovement(attacker, result.path, 'charge_speed');
  
  // 4. Impact effects
  playAnimation('charge_impact', target.position);
  shakeScreen(0.3);
  
  // 5. Damage numbers
  showDamage(target, result.totalDamage, 'critical');
  showResolveDamage(target, result.shockDamage);
}
```

---

## Phalanx System (Formation Depth)

### Overview

Phalanx transforms a chaotic mob into a unified fighting organism. Units gain defensive bonuses when supported by allies, creating meaningful deployment decisions.

```
┌─────────────────────────────────────────────────────────────┐
│                    PHALANX FORMATION                         │
│                                                              │
│              [R]        ← Rear support (+1 Armor, +15 Resolve)│
│           [L][U][R]     ← Full Phalanx (+5 Armor, +25 Resolve)│
│              ↑                                               │
│         Left Flank      Unit      Right Flank               │
│         (+2/+5)                   (+2/+5)                   │
│                                                              │
│  "Close ranks! Shield wall!"                                │
└─────────────────────────────────────────────────────────────┘
```

### Core Mechanics

```typescript
interface PhalanxState {
  leftSupport: boolean;
  rightSupport: boolean;
  rearSupport: boolean;
  armorBonus: number;
  resolveBonus: number;
}

const PHALANX_BONUSES = {
  flank: { armor: 2, resolve: 5 },      // Per flank (left or right)
  rear: { armor: 1, resolve: 15 },      // Rear support
  maxArmor: 5,                          // Full phalanx
  maxResolve: 25,                       // Full phalanx
};
```

### Support Position Calculation

```typescript
function getSupportPositions(
  unit: BattleUnit
): { left: Position; right: Position; rear: Position } {
  const { x, y } = unit.position;
  const facing = unit.facing.direction;
  
  // Positions relative to facing direction
  switch (facing) {
    case 'north':
      return {
        left: { x: x - 1, y },
        right: { x: x + 1, y },
        rear: { x, y: y + 1 },
      };
    case 'south':
      return {
        left: { x: x + 1, y },
        right: { x: x - 1, y },
        rear: { x, y: y - 1 },
      };
    case 'east':
      return {
        left: { x, y: y - 1 },
        right: { x, y: y + 1 },
        rear: { x: x - 1, y },
      };
    case 'west':
      return {
        left: { x, y: y + 1 },
        right: { x, y: y - 1 },
        rear: { x: x + 1, y },
      };
  }
}

function canProvideSupport(supporter: BattleUnit): boolean {
  // Only Infantry or Shielded units can provide support
  return hasTag(supporter, 'Infantry') || hasTag(supporter, 'Shielded');
}
```

### Phalanx Bonus Calculation

```typescript
function calculatePhalanxBonus(
  unit: BattleUnit,
  state: BattleState
): PhalanxState {
  // Only Infantry can receive Phalanx bonuses
  if (!hasTag(unit, 'Infantry')) {
    return { leftSupport: false, rightSupport: false, rearSupport: false, armorBonus: 0, resolveBonus: 0 };
  }
  
  const positions = getSupportPositions(unit);
  const allies = getAlliedUnits(unit, state);
  
  // Check each support position
  const leftSupport = allies.some(a => 
    a.position.x === positions.left.x && 
    a.position.y === positions.left.y && 
    canProvideSupport(a)
  );
  
  const rightSupport = allies.some(a => 
    a.position.x === positions.right.x && 
    a.position.y === positions.right.y && 
    canProvideSupport(a)
  );
  
  const rearSupport = allies.some(a => 
    a.position.x === positions.rear.x && 
    a.position.y === positions.rear.y && 
    canProvideSupport(a)
  );
  
  // Calculate bonuses
  let armorBonus = 0;
  let resolveBonus = 0;
  
  if (leftSupport) {
    armorBonus += PHALANX_BONUSES.flank.armor;
    resolveBonus += PHALANX_BONUSES.flank.resolve;
  }
  
  if (rightSupport) {
    armorBonus += PHALANX_BONUSES.flank.armor;
    resolveBonus += PHALANX_BONUSES.flank.resolve;
  }
  
  if (rearSupport) {
    armorBonus += PHALANX_BONUSES.rear.armor;
    resolveBonus += PHALANX_BONUSES.rear.resolve;
    
    // Check for Officer bonus (2× Resolve)
    const rearUnit = allies.find(a => 
      a.position.x === positions.rear.x && 
      a.position.y === positions.rear.y
    );
    if (rearUnit && hasTag(rearUnit, 'Officer')) {
      resolveBonus += PHALANX_BONUSES.rear.resolve;  // Double rear Resolve
    }
  }
  
  // Shielded units provide extra Armor
  if (hasTag(unit, 'Shielded')) {
    armorBonus += 1;
  }
  
  return {
    leftSupport,
    rightSupport,
    rearSupport,
    armorBonus: Math.min(armorBonus, PHALANX_BONUSES.maxArmor),
    resolveBonus: Math.min(resolveBonus, PHALANX_BONUSES.maxResolve),
  };
}
```

### Phalanx vs Flanking Interaction

```typescript
function applyPhalanxToDefense(
  defender: BattleUnit,
  attacker: BattleUnit,
  state: BattleState
): { effectiveArmor: number; effectiveResolve: number } {
  const phalanx = calculatePhalanxBonus(defender, state);
  const attackArc = getAttackArc(attacker.position, defender);
  
  // Phalanx ONLY applies to frontal attacks
  if (attackArc === 'front') {
    return {
      effectiveArmor: defender.armor + phalanx.armorBonus,
      effectiveResolve: defender.resolve.current + phalanx.resolveBonus,
    };
  }
  
  // Flanking/Rear attacks ignore Phalanx entirely
  return {
    effectiveArmor: defender.armor,
    effectiveResolve: defender.resolve.current,
  };
}
```

### Faction Specializations

#### Empire (Disciplined Phalanx)

```typescript
// Empire focuses on Armor bonuses
const EMPIRE_PHALANX_MODIFIERS = {
  shieldwallBonus: 2,        // Extra Armor for Shieldwall units
  officerResolveMultiplier: 2,  // Officer doubles Resolve bonus
};

function applyEmpirePhalanx(unit: BattleUnit, phalanx: PhalanxState): PhalanxState {
  if (hasTag(unit, 'Shieldwall')) {
    phalanx.armorBonus += EMPIRE_PHALANX_MODIFIERS.shieldwallBonus;
  }
  return phalanx;
}
```

#### Undead (Wall of Bones)

```typescript
// Undead focuses on Resolve (magical cohesion) and damage sharing
const UNDEAD_PHALANX_MODIFIERS = {
  damageSharePercent: 0.2,   // 20% damage shared to adjacent
  crumblingResistance: 5,    // Extra turns before crumbling in formation
};

function applyUndeadDamageShare(
  target: BattleUnit,
  damage: number,
  state: BattleState
): void {
  if (!hasTag(target, 'Undead')) return;
  
  const phalanx = calculatePhalanxBonus(target, state);
  if (phalanx.armorBonus === 0) return;  // Not in formation
  
  // Share 20% of damage to adjacent undead
  const sharedDamage = Math.floor(damage * UNDEAD_PHALANX_MODIFIERS.damageSharePercent);
  const adjacentUndead = getAdjacentAllies(target, state)
    .filter(a => hasTag(a, 'Undead'));
  
  const damagePerUnit = Math.floor(sharedDamage / adjacentUndead.length);
  for (const ally of adjacentUndead) {
    applyDamage(ally, damagePerUnit);
  }
  
  // Reduce damage to original target
  return damage - sharedDamage;
}
```

### T3 Ability: Unbreakable Square

```typescript
function hasUnbreakableSquare(unit: BattleUnit): boolean {
  return hasTag(unit, 'UnbreakableSquare') || hasAbility(unit, 'back_to_back');
}

function calculatePhalanxBonusWithSquare(
  unit: BattleUnit,
  attacker: BattleUnit,
  state: BattleState
): PhalanxState {
  const phalanx = calculatePhalanxBonus(unit, state);
  
  // Unbreakable Square: Phalanx applies to ALL attacks (360°)
  if (hasUnbreakableSquare(unit)) {
    // Always return full phalanx bonus regardless of attack direction
    return phalanx;
  }
  
  // Normal units: Phalanx only for frontal attacks
  const attackArc = getAttackArc(attacker.position, unit);
  if (attackArc !== 'front') {
    return { ...phalanx, armorBonus: 0, resolveBonus: 0 };
  }
  
  return phalanx;
}
```

### Formation Breaking Events

```typescript
function onSupporterDeath(
  deadUnit: BattleUnit,
  state: BattleState
): void {
  // Find all units that were supported by the dead unit
  const affectedUnits = getAlliedUnits(deadUnit, state).filter(ally => {
    const positions = getSupportPositions(ally);
    return (
      (positions.left.x === deadUnit.position.x && positions.left.y === deadUnit.position.y) ||
      (positions.right.x === deadUnit.position.x && positions.right.y === deadUnit.position.y) ||
      (positions.rear.x === deadUnit.position.x && positions.rear.y === deadUnit.position.y)
    );
  });
  
  for (const unit of affectedUnits) {
    state.events.push({
      type: 'formation_broken',
      unitId: unit.id,
      lostSupporterId: deadUnit.id,
    });
    
    // Recalculate phalanx bonus
    unit.phalanx = calculatePhalanxBonus(unit, state);
  }
}
```

### Deployment Strategies

```
┌─────────────────────────────────────────────────────────────┐
│              TIGHT BOX (Maximum Phalanx)                     │
│                                                              │
│  Row 1: [S][S][S][S][S][S][S][S]  ← Full shield line        │
│  Row 0: [S][S][S][S][S][S][S][S]  ← Rear support            │
│                                                              │
│  + Maximum Phalanx (+5 Armor, +25 Resolve)                  │
│  + Extremely hard to break frontally                        │
│  - No ranged fire (LoS blocked)                             │
│  - No cavalry charges                                       │
│  - Vulnerable to magic AoE                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              LINE FORMATION (Balanced)                       │
│                                                              │
│  Row 1: [S][S][S][S][S][S][S][S]  ← Shield line             │
│  Row 0: [A][ ][A][ ][A][ ][A][ ]  ← Archers in gaps         │
│                                                              │
│  + Shields get flank support (+4 Armor, +10 Resolve)        │
│  + Archers have clear LoS                                   │
│  - No rear support for shields                              │
│  - Archers have no Phalanx bonus                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              COMBINED ARMS (Empire Special)                  │
│                                                              │
│  Row 1: [S][S][O][S][S][S][O][S]  ← Shields + Officers [O]  │
│  Row 0: [S][S][S][S][S][S][S][S]  ← Full rear support       │
│                                                              │
│  + Officers double Resolve bonus for front row              │
│  + Full Phalanx for rear row                                │
│  - Still no ranged fire                                     │
│  - Officers are high-value targets                          │
└─────────────────────────────────────────────────────────────┘
```

### Visual Feedback

```typescript
interface PhalanxVisuals {
  supportLines: { from: Position; to: Position }[];  // White connecting lines
  armorIcon: { position: Position; value: number };  // Shield with +2/+4/+5
  resolveGlow: Position[];                           // Blue glow on full phalanx
  formationBroken: Position;                         // "Formation Broken!" popup
}

function renderPhalanxVisuals(unit: BattleUnit, phalanx: PhalanxState): void {
  const positions = getSupportPositions(unit);
  
  // Draw support lines
  if (phalanx.leftSupport) {
    drawLine(unit.position, positions.left, 'white', 2);
  }
  if (phalanx.rightSupport) {
    drawLine(unit.position, positions.right, 'white', 2);
  }
  if (phalanx.rearSupport) {
    drawLine(unit.position, positions.rear, 'white', 2);
  }
  
  // Show armor bonus icon
  if (phalanx.armorBonus > 0) {
    showIcon(unit.position, 'shield', `+${phalanx.armorBonus}`);
  }
  
  // Blue glow for full phalanx
  if (phalanx.armorBonus >= PHALANX_BONUSES.maxArmor) {
    addGlow(unit.position, 'blue', 0.5);
  }
}
```

---

## Aura System (Magical Fields)

### Overview

Auras transform support units into "strategic anchors" that control territory. On an 8×10 grid, aura zones create meaningful positioning decisions and faction-specific synergies.

```
┌─────────────────────────────────────────────────────────────┐
│                    AURA ZONES                                │
│                                                              │
│        [·][·][·]                                            │
│        [·][H][·]  ← Hierophant with Holy Light (range 2)    │
│        [·][·][·]                                            │
│                                                              │
│  All cells marked [·] are affected by the aura              │
│  Ghosts in this zone lose their 50% Dodge                   │
└─────────────────────────────────────────────────────────────┘
```

### Core Mechanics

```typescript
type AuraType = 'static' | 'pulse' | 'relic';

interface Aura {
  id: string;
  name: string;
  type: AuraType;
  range: number;                    // Manhattan distance
  affectsAllies: boolean;
  affectsEnemies: boolean;
  effect: AuraEffect;
  relicDuration?: number;           // For relic auras
}

interface AuraEffect {
  statModifier?: { stat: string; value: number };
  statusEffect?: string;
  special?: string;                 // Custom effect ID
}

interface ActiveAura {
  aura: Aura;
  carrier: BattleUnit | null;       // null for relic auras
  position: Position;               // Center of aura
  remainingDuration?: number;       // For relic auras
}
```

### Aura Zone Calculation

```typescript
function getAuraZone(center: Position, range: number): Position[] {
  const zone: Position[] = [];
  
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      // Manhattan distance check
      if (Math.abs(dx) + Math.abs(dy) <= range) {
        const pos = { x: center.x + dx, y: center.y + dy };
        if (isValidPosition(pos)) {
          zone.push(pos);
        }
      }
    }
  }
  
  return zone;
}

function isInAuraZone(unit: BattleUnit, aura: ActiveAura): boolean {
  const zone = getAuraZone(aura.position, aura.aura.range);
  return zone.some(p => p.x === unit.position.x && p.y === unit.position.y);
}
```

### Aura Processing

```typescript
function processAuras(state: BattleState): BattleState {
  // Collect all active auras
  const activeAuras: ActiveAura[] = [];
  
  // Static auras from living carriers
  for (const unit of state.allUnits) {
    if (unit.hp > 0 && hasTag(unit, 'AuraCarrier')) {
      const aura = getUnitAura(unit);
      if (aura && aura.type === 'static') {
        activeAuras.push({
          aura,
          carrier: unit,
          position: unit.position,
        });
      }
    }
  }
  
  // Relic auras (from dead carriers)
  activeAuras.push(...state.relicAuras);
  
  // Apply aura effects to all units
  for (const unit of state.allUnits) {
    unit.activeAuraEffects = [];
    
    for (const activeAura of activeAuras) {
      if (isInAuraZone(unit, activeAura)) {
        const shouldAffect = 
          (activeAura.aura.affectsAllies && isSameTeam(unit, activeAura.carrier)) ||
          (activeAura.aura.affectsEnemies && !isSameTeam(unit, activeAura.carrier));
        
        if (shouldAffect) {
          applyAuraEffect(unit, activeAura.aura.effect);
          unit.activeAuraEffects.push(activeAura.aura.id);
        }
      }
    }
  }
  
  return state;
}

function processPulseAuras(state: BattleState): BattleState {
  // Called at start of each turn
  for (const unit of state.allUnits) {
    if (unit.hp > 0 && hasTag(unit, 'AuraCarrier')) {
      const aura = getUnitAura(unit);
      if (aura && aura.type === 'pulse') {
        const zone = getAuraZone(unit.position, aura.range);
        
        for (const pos of zone) {
          const target = getUnitAtPosition(pos, state);
          if (target && shouldAffect(target, unit, aura)) {
            applyAuraEffect(target, aura.effect);
            state.events.push({
              type: 'aura_pulse',
              auraId: aura.id,
              carrierId: unit.id,
              targetId: target.id,
            });
          }
        }
      }
    }
  }
  
  return state;
}
```

### Relic Auras (Posthumous)

```typescript
function onAuraCarrierDeath(unit: BattleUnit, state: BattleState): void {
  const aura = getUnitAura(unit);
  
  if (aura && aura.type === 'relic') {
    // Create relic aura at death position
    state.relicAuras.push({
      aura,
      carrier: null,
      position: unit.position,
      remainingDuration: aura.relicDuration || 2,
    });
    
    state.events.push({
      type: 'relic_aura_created',
      auraId: aura.id,
      position: unit.position,
      duration: aura.relicDuration || 2,
    });
  }
}

function processRelicAuraDecay(state: BattleState): BattleState {
  // Called at end of each round
  state.relicAuras = state.relicAuras.filter(relic => {
    relic.remainingDuration!--;
    
    if (relic.remainingDuration! <= 0) {
      state.events.push({
        type: 'relic_aura_expired',
        auraId: relic.aura.id,
        position: relic.position,
      });
      return false;
    }
    
    return true;
  });
  
  return state;
}
```

### Empire Auras

```typescript
const EMPIRE_AURAS: Record<string, Aura> = {
  holy_light: {
    id: 'holy_light',
    name: 'Holy Light',
    type: 'static',
    range: 2,
    affectsAllies: false,
    affectsEnemies: true,
    effect: {
      special: 'remove_incorporeal_dodge',  // Ghosts lose 50% Dodge
    },
  },
  
  storm_front: {
    id: 'storm_front',
    name: 'Storm Front',
    type: 'static',
    range: 2,
    affectsAllies: false,
    affectsEnemies: true,
    effect: {
      statModifier: { stat: 'rangedAccuracy', value: -50 },
    },
  },
  
  rally_banner: {
    id: 'rally_banner',
    name: 'Rally Banner',
    type: 'pulse',
    range: 2,
    affectsAllies: true,
    affectsEnemies: false,
    effect: {
      statModifier: { stat: 'resolveRecovery', value: 5 },
    },
  },
  
  sigmars_shield: {
    id: 'sigmars_shield',
    name: "Sigmar's Shield",
    type: 'static',
    range: 1,
    affectsAllies: true,
    affectsEnemies: false,
    effect: {
      statusEffect: 'fear_immune',
    },
  },
};
```

### Undead Auras

```typescript
const UNDEAD_AURAS: Record<string, Aura> = {
  defiled_ground: {
    id: 'defiled_ground',
    name: 'Defiled Ground',
    type: 'static',
    range: 1,
    affectsAllies: true,
    affectsEnemies: false,
    effect: {
      special: 'ignore_crumbling',  // Undead ignore Crumbling damage
    },
  },
  
  icy_grave: {
    id: 'icy_grave',
    name: 'Icy Grave',
    type: 'static',
    range: 2,
    affectsAllies: false,
    affectsEnemies: true,
    effect: {
      statModifier: { stat: 'initiative', value: -10 },
    },
  },
  
  dark_will: {
    id: 'dark_will',
    name: 'Dark Will',
    type: 'pulse',
    range: 2,
    affectsAllies: true,
    affectsEnemies: false,
    effect: {
      statModifier: { stat: 'resolveRecovery', value: 8 },
    },
  },
  
  reliquary: {
    id: 'reliquary',
    name: 'Reliquary',
    type: 'relic',
    range: 3,
    affectsAllies: false,
    affectsEnemies: true,
    relicDuration: 3,
    effect: {
      statModifier: { stat: 'hp', value: -5 },  // -5 HP per turn
    },
  },
};
```

### Aura Stacking Rules

```typescript
function resolveAuraStacking(
  unit: BattleUnit,
  auras: ActiveAura[]
): Map<string, number> {
  const effectiveModifiers = new Map<string, number>();
  
  // Group auras by effect type
  const aurasByEffect = new Map<string, ActiveAura[]>();
  
  for (const aura of auras) {
    const effectKey = aura.aura.effect.statModifier?.stat || aura.aura.effect.special || '';
    if (!aurasByEffect.has(effectKey)) {
      aurasByEffect.set(effectKey, []);
    }
    aurasByEffect.get(effectKey)!.push(aura);
  }
  
  // Apply stacking rules
  for (const [effectKey, effectAuras] of aurasByEffect) {
    // Same aura type: highest value wins (no stacking)
    const sameTypeAuras = effectAuras.filter(a => 
      effectAuras.filter(b => b.aura.id === a.aura.id).length > 1
    );
    
    if (sameTypeAuras.length > 0) {
      const maxValue = Math.max(...sameTypeAuras.map(a => 
        a.aura.effect.statModifier?.value || 0
      ));
      effectiveModifiers.set(effectKey, maxValue);
    }
    
    // Different aura types: stack normally
    const differentTypeAuras = effectAuras.filter(a => 
      effectAuras.filter(b => b.aura.id === a.aura.id).length === 1
    );
    
    for (const aura of differentTypeAuras) {
      const current = effectiveModifiers.get(effectKey) || 0;
      effectiveModifiers.set(effectKey, current + (aura.aura.effect.statModifier?.value || 0));
    }
  }
  
  return effectiveModifiers;
}
```

### AI Aura Awareness

```typescript
function evaluateAuraZones(unit: BattleUnit, state: BattleState): AuraEvaluation {
  const currentAuras = getAurasAtPosition(unit.position, state);
  const evaluation: AuraEvaluation = {
    beneficialAuras: [],
    harmfulAuras: [],
    shouldMove: false,
    preferredPositions: [],
  };
  
  for (const aura of currentAuras) {
    if (isHarmfulAura(aura, unit)) {
      evaluation.harmfulAuras.push(aura);
      evaluation.shouldMove = true;
    } else if (isBeneficialAura(aura, unit)) {
      evaluation.beneficialAuras.push(aura);
    }
  }
  
  // Find positions outside harmful auras
  if (evaluation.shouldMove) {
    evaluation.preferredPositions = findPositionsOutsideAuras(
      unit,
      evaluation.harmfulAuras,
      state
    );
  }
  
  return evaluation;
}

function prioritizeAuraCarriers(unit: BattleUnit, state: BattleState): BattleUnit[] {
  // AI prioritizes killing aura carriers
  const enemies = getEnemyUnits(unit, state);
  
  return enemies
    .filter(e => hasTag(e, 'AuraCarrier'))
    .sort((a, b) => {
      // Prioritize by aura impact
      const auraA = getUnitAura(a);
      const auraB = getUnitAura(b);
      const impactA = auraA ? auraA.range * getAuraValue(auraA) : 0;
      const impactB = auraB ? auraB.range * getAuraValue(auraB) : 0;
      return impactB - impactA;
    });
}
```

### Deployment Synergies

```
┌─────────────────────────────────────────────────────────────┐
│              HOLY TRIANGLE (Empire)                          │
│                                                              │
│  Row 1: [S][S][ ][ ][ ][ ][ ][ ]                            │
│  Row 0: [ ][H][ ][ ][ ][ ][ ][ ]  ← Hierophant [H]          │
│                                                              │
│  Swordsmen [S] in Holy Light aura:                          │
│  + Ghosts attacking them lose Dodge                         │
│  + Rally Banner gives +5 Resolve/turn                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              DEATH CONVOY (Undead)                           │
│                                                              │
│  Row 1: [Z][C][Z][ ][ ][ ][ ][ ]  ← Corpse Cart [C]         │
│  Row 0: [Z][Z][Z][ ][ ][ ][ ][ ]  ← Zombies [Z]             │
│                                                              │
│  Zombies in Defiled Ground aura:                            │
│  + Ignore Crumbling damage (even at Resolve 0)              │
│  + Slow but nearly invincible mass                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              CONTROL ZONE (Combined)                         │
│                                                              │
│  Row 1: [S][S][B][S][S][ ][ ][ ]  ← Banshee [B] center      │
│  Row 0: [N][ ][ ][ ][N][ ][ ][ ]  ← Necromancers [N]        │
│                                                              │
│  Overlapping auras:                                         │
│  + Icy Grave: Enemies -10 Initiative                        │
│  + Dark Will: Undead +8 Resolve/turn                        │
│  = Enemies can't Riposte effectively, Undead never break    │
└─────────────────────────────────────────────────────────────┘
```

### Visual Feedback

```typescript
interface AuraVisuals {
  zoneCircle: { center: Position; radius: number; color: string };
  affectedUnits: { unitId: string; auraIcon: string }[];
  pulseAnimation: boolean;
  relicGhost: boolean;
}

function renderAuraVisuals(aura: ActiveAura, state: BattleState): void {
  const zone = getAuraZone(aura.position, aura.aura.range);
  
  // Draw zone circle
  const color = aura.aura.affectsAllies ? 'blue' : 
                aura.aura.affectsEnemies ? 'red' : 'purple';
  drawZoneCircle(aura.position, aura.aura.range, color, 0.3);
  
  // Pulse animation for pulse auras
  if (aura.aura.type === 'pulse') {
    animatePulse(aura.position, aura.aura.range, color);
  }
  
  // Ghost effect for relic auras
  if (aura.aura.type === 'relic') {
    drawGhostCircle(aura.position, aura.aura.range, 0.5);
    showFloatingText(aura.position, `${aura.remainingDuration} turns`);
  }
  
  // Show aura icons on affected units
  for (const pos of zone) {
    const unit = getUnitAtPosition(pos, state);
    if (unit && unit.activeAuraEffects.includes(aura.aura.id)) {
      showAuraIcon(unit.position, aura.aura.id);
    }
  }
}
```

---

## Ammunition & Cooldown System

### Overview

Ammunition limits ranged units' effectiveness over time, preventing infinite kiting. Cooldowns gate powerful mage spells, creating windows of vulnerability.

```
┌─────────────────────────────────────────────────────────────┐
│                    AMMO LIFECYCLE                            │
│                                                              │
│  [A] Archer with 6 Ammo                                     │
│   ↓                                                          │
│  Turn 1: Shoot → 5 Ammo                                     │
│  Turn 2: Shoot → 4 Ammo                                     │
│  Turn 3: Volley (AoE) → 2 Ammo                              │
│  Turn 4: Shoot → 1 Ammo                                     │
│  Turn 5: Shoot → 0 Ammo → "Out of Ammo!"                    │
│  Turn 6: Switches to weak melee mode                        │
│                                                              │
│  "Every arrow counts"                                       │
└─────────────────────────────────────────────────────────────┘
```

### Core Mechanics

```typescript
interface AmmoState {
  current: number;
  max: number;
  isOutOfAmmo: boolean;
}

interface CooldownState {
  spellId: string;
  remainingTurns: number;
}

interface RangedUnit extends BattleUnit {
  ammo: AmmoState;
  cooldowns: CooldownState[];
}

const AMMO_CONFIG: Record<string, number> = {
  archer: 6,
  musketeer: 4,
  crossbowman: 5,
  artillery: 3,
  skeleton_archer: 8,
  mage: 0,  // Mages use cooldowns, not ammo
};

const COOLDOWN_CONFIG: Record<string, number> = {
  basic_spell: 0,      // Can cast every turn
  power_spell: 2,      // 2 turn cooldown
  ultimate_spell: 4,   // 4 turn cooldown
};
```

### Ammo Consumption

```typescript
function consumeAmmo(unit: RangedUnit, amount: number): boolean {
  if (unit.ammo.current < amount) {
    return false;  // Not enough ammo
  }
  
  unit.ammo.current -= amount;
  
  if (unit.ammo.current <= 0) {
    unit.ammo.isOutOfAmmo = true;
    onOutOfAmmo(unit);
  }
  
  return true;
}

function onOutOfAmmo(unit: RangedUnit): void {
  // Switch to melee mode
  unit.range = 1;
  unit.effectiveAtk = unit.meleeAtk || Math.floor(unit.atk * 0.3);  // Weak melee
  
  // Visual feedback
  state.events.push({
    type: 'out_of_ammo',
    unitId: unit.id,
  });
}

function getAmmoCost(action: string): number {
  switch (action) {
    case 'attack': return 1;
    case 'overwatch': return 1;
    case 'volley': return 2;
    case 'piercing_shot': return 1;
    default: return 1;
  }
}
```

### Ammo Recovery

```typescript
function processAmmoRecovery(unit: RangedUnit, state: BattleState): void {
  // Rest recovery: +1 if unit didn't move or attack
  if (!unit.hasActed && !unit.hasMoved) {
    unit.ammo.current = Math.min(unit.ammo.max, unit.ammo.current + 1);
    
    if (unit.ammo.isOutOfAmmo && unit.ammo.current > 0) {
      // Restore ranged capability
      unit.ammo.isOutOfAmmo = false;
      unit.range = unit.baseRange;
      unit.effectiveAtk = unit.atk;
    }
    
    state.events.push({
      type: 'ammo_recovered',
      unitId: unit.id,
      amount: 1,
      source: 'rest',
    });
  }
  
  // Supply Wagon aura recovery
  if (isInSupplyWagonRange(unit, state)) {
    unit.ammo.current = Math.min(unit.ammo.max, unit.ammo.current + 2);
    
    state.events.push({
      type: 'ammo_recovered',
      unitId: unit.id,
      amount: 2,
      source: 'supply_wagon',
    });
  }
}

function isInSupplyWagonRange(unit: BattleUnit, state: BattleState): boolean {
  const wagons = getAlliedUnits(unit, state).filter(u => hasTag(u, 'SupplyWagon'));
  
  for (const wagon of wagons) {
    if (manhattanDistance(unit.position, wagon.position) <= 1) {
      return true;
    }
  }
  
  return false;
}
```

### Cooldown System (Mages)

```typescript
function castSpell(mage: RangedUnit, spellId: string, target: BattleUnit, state: BattleState): boolean {
  const spell = getSpell(spellId);
  
  // Check cooldown
  const cooldown = mage.cooldowns.find(c => c.spellId === spellId);
  if (cooldown && cooldown.remainingTurns > 0) {
    return false;  // Spell on cooldown
  }
  
  // Execute spell
  executeSpellEffect(mage, spell, target, state);
  
  // Start cooldown
  if (spell.cooldown > 0) {
    mage.cooldowns.push({
      spellId,
      remainingTurns: spell.cooldown,
    });
  }
  
  state.events.push({
    type: 'spell_cast',
    casterId: mage.id,
    spellId,
    targetId: target.id,
    cooldown: spell.cooldown,
  });
  
  return true;
}

function processCooldowns(mage: RangedUnit): void {
  // Reduce all cooldowns by 1 at start of turn
  mage.cooldowns = mage.cooldowns
    .map(c => ({ ...c, remainingTurns: c.remainingTurns - 1 }))
    .filter(c => c.remainingTurns > 0);
}

function getAvailableSpells(mage: RangedUnit): Spell[] {
  const allSpells = getMageSpells(mage);
  
  return allSpells.filter(spell => {
    const cooldown = mage.cooldowns.find(c => c.spellId === spell.id);
    return !cooldown || cooldown.remainingTurns <= 0;
  });
}
```

### T3 Abilities

```typescript
const T3_AMMO_ABILITIES: Record<string, T3Ability> = {
  conserve_ammo: {
    id: 'conserve_ammo',
    name: 'Conserve Ammo',
    unit: 'musketeer_t3',
    effect: (attacker, target, damage) => {
      // Kill shot doesn't consume ammo
      if (target.hp - damage <= 0) {
        attacker.ammo.current += 1;  // Refund the ammo
        return { ammoRefunded: true };
      }
      return { ammoRefunded: false };
    },
  },
  
  burnout: {
    id: 'burnout',
    name: 'Burnout',
    unit: 'fire_mage_t3',
    effect: (mage, spell) => {
      // Can cast even with all spells on cooldown, but takes self-damage
      const selfDamage = Math.floor(mage.maxHp * 0.15);
      applyDamage(mage, selfDamage);
      return { selfDamage };
    },
  },
  
  endless_quiver: {
    id: 'endless_quiver',
    name: 'Endless Quiver',
    unit: 'skeleton_archer',
    effect: (archer) => {
      // +2 max ammo, -20% damage
      archer.ammo.max += 2;
      archer.ammo.current += 2;
      archer.atk = Math.floor(archer.atk * 0.8);
    },
  },
  
  rapid_reload: {
    id: 'rapid_reload',
    name: 'Rapid Reload',
    unit: 'artillery_t3',
    effect: (artillery) => {
      // -1 cooldown on all abilities
      for (const cooldown of artillery.cooldowns) {
        cooldown.remainingTurns = Math.max(0, cooldown.remainingTurns - 1);
      }
    },
  },
};
```

### AI Ammo Management

```typescript
function evaluateRangedTarget(
  shooter: RangedUnit,
  target: BattleUnit,
  state: BattleState
): number {
  let score = getBaseTargetPriority(target);
  
  // Penalize shooting fodder when low on ammo
  if (shooter.ammo.current <= 2) {
    if (target.cost <= 3) {
      score *= 0.3;  // Don't waste precious ammo on cheap units
    }
    if (target.role === 'tank') {
      score *= 0.5;  // Tanks are ammo sinks
    }
  }
  
  // Bonus for kill shots (conserve ammo)
  const estimatedDamage = calculateDamage(shooter, target);
  if (target.hp <= estimatedDamage) {
    score *= 1.5;  // Prioritize kills
  }
  
  return score;
}

function shouldUseOverwatch(shooter: RangedUnit, state: BattleState): boolean {
  // Don't use Overwatch if low on ammo
  if (shooter.ammo.current <= 1) {
    return false;
  }
  
  // Don't use Overwatch if only fodder approaching
  const approachingEnemies = getEnemiesMovingToward(shooter, state);
  const highValueApproaching = approachingEnemies.some(e => e.cost >= 5);
  
  return highValueApproaching;
}

function shouldRest(shooter: RangedUnit, state: BattleState): boolean {
  // Rest if low on ammo and no good targets
  if (shooter.ammo.current >= shooter.ammo.max * 0.5) {
    return false;  // Enough ammo
  }
  
  const targets = getValidTargets(shooter, state);
  const goodTargets = targets.filter(t => evaluateRangedTarget(shooter, t, state) > 0.5);
  
  return goodTargets.length === 0;
}
```

### Strategic Implications

```
┌─────────────────────────────────────────────────────────────┐
│              AMMO DRAIN STRATEGY                             │
│                                                              │
│  Undead sends waves of cheap Zombies                        │
│  Empire archers shoot Zombies (waste ammo)                  │
│  After 4-5 turns: Archers out of ammo                       │
│  Undead elite units (Grave Guard) advance safely            │
│                                                              │
│  Counter: AI must prioritize targets, not shoot everything  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              PHALANX OUTLAST STRATEGY                        │
│                                                              │
│  Empire forms dense Phalanx (+5 Armor)                      │
│  Undead ranged units shoot into shields                     │
│  High Armor = low damage per shot                           │
│  Undead runs out of ammo before breaking Phalanx            │
│  Empire counter-attacks with fresh melee units              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              SUPPLY LINE STRATEGY                            │
│                                                              │
│  Row 1: [A][A][W][A][A]  ← Supply Wagon [W] center          │
│  Row 0: [S][S][S][S][S]  ← Shield wall                      │
│                                                              │
│  Archers get +2 Ammo/turn from Wagon                        │
│  Can sustain fire indefinitely                              │
│  Wagon is high-priority target for enemy                    │
└─────────────────────────────────────────────────────────────┘
```

### Visual Feedback

```typescript
interface AmmoVisuals {
  ammoCounter: { current: number; max: number };
  outOfAmmoIcon: boolean;
  reloadingStatus: boolean;
  cooldownTimers: { spellId: string; turns: number }[];
}

function renderAmmoUI(unit: RangedUnit): void {
  // Ammo counter (bullets/arrows icon)
  if (unit.ammo.max > 0) {
    drawAmmoCounter(unit.position, unit.ammo.current, unit.ammo.max);
    
    // Low ammo warning (yellow when ≤2)
    if (unit.ammo.current <= 2 && unit.ammo.current > 0) {
      addWarningGlow(unit.position, 'yellow');
    }
    
    // Out of ammo (red X)
    if (unit.ammo.isOutOfAmmo) {
      showIcon(unit.position, 'crossed_arrow', 'red');
    }
  }
  
  // Cooldown timers on spell bar
  for (const cooldown of unit.cooldowns) {
    const spell = getSpell(cooldown.spellId);
    drawCooldownOverlay(spell.icon, cooldown.remainingTurns);
  }
}

function animateAmmoConsumption(unit: RangedUnit, amount: number): void {
  // Show "-1" floating text
  showFloatingText(unit.position, `-${amount}`, 'ammo');
  
  // Flash ammo counter
  flashElement('ammo_counter', unit.id);
}
```


---

## Overwatch & Intercept System

### Overview

Overwatch and Intercept complete the "movement control cycle" — punishing enemies for approaching, not just for leaving combat. This makes defensive positioning meaningful and creates "kill zones" that shape battlefield flow.

```
┌─────────────────────────────────────────────────────────────┐
│                 MOVEMENT CONTROL CYCLE                       │
│                                                              │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│  │ INTERCEPT│ ──► │ENGAGEMENT│ ──► │   AoO    │            │
│  │(entering)│     │(in place)│     │(leaving) │            │
│  └──────────┘     └──────────┘     └──────────┘            │
│                                                              │
│  "Punish approach"  "Lock in place"  "Punish retreat"       │
└─────────────────────────────────────────────────────────────┘
```

### Core Types

```typescript
/**
 * Vigilance state for units that didn't move
 */
interface VigilanceState {
  /** Whether unit is in Vigilance mode */
  isVigilant: boolean;
  /** Turn when Vigilance was activated */
  activatedOnTurn: number;
  /** Whether Overwatch/Intercept was used this round */
  hasUsedIntercept: boolean;
}

/**
 * Types of intercept based on unit role
 */
type InterceptType = 'hard' | 'soft' | 'counter_charge' | 'none';

/**
 * Result of an intercept attempt
 */
interface InterceptResult {
  /** Whether intercept triggered */
  triggered: boolean;
  /** Type of intercept */
  type: InterceptType;
  /** Damage dealt by interceptor */
  damage: number;
  /** Whether target movement was stopped */
  movementStopped: boolean;
  /** Whether target became Engaged */
  targetEngaged: boolean;
  /** Resolve damage dealt */
  resolveDamage: number;
}

/**
 * Overwatch result for ranged units
 */
interface OverwatchResult {
  /** Whether Overwatch triggered */
  triggered: boolean;
  /** Damage dealt */
  damage: number;
  /** Ammo consumed */
  ammoConsumed: number;
  /** Whether target was suppressed (Speed -1) */
  targetSuppressed: boolean;
}

/**
 * Unit tags that affect intercept behavior
 */
type InterceptTag = 
  | 'SpearWall'      // Hard Intercept (stops movement)
  | 'HeavyInfantry'  // Soft Intercept (50% damage)
  | 'Cavalry'        // Counter-Charge (100% damage, no stop)
  | 'Skirmisher'     // Ignores Soft Intercept
  | 'Unstoppable';   // Ignores Hard Intercept from infantry
```

### Vigilance System

```typescript
/**
 * Updates Vigilance state at end of unit's turn.
 * Unit becomes Vigilant if it didn't move this turn.
 * 
 * @param unit - The unit to update
 * @param state - Current battle state
 */
function updateVigilance(unit: BattleUnit, state: BattleState): void {
  // Vigilance activates if unit didn't move
  if (!unit.hasMoved) {
    unit.vigilance = {
      isVigilant: true,
      activatedOnTurn: state.currentTurn,
      hasUsedIntercept: false,
    };
    
    state.events.push({
      type: 'vigilance_activated',
      unitId: unit.id,
    });
  } else {
    // Moving cancels Vigilance
    unit.vigilance = {
      isVigilant: false,
      activatedOnTurn: -1,
      hasUsedIntercept: false,
    };
  }
}

/**
 * Checks if unit can perform intercept.
 * 
 * @param unit - The potential interceptor
 * @returns Whether unit can intercept
 */
function canIntercept(unit: BattleUnit): boolean {
  return (
    unit.vigilance.isVigilant &&
    !unit.vigilance.hasUsedIntercept &&
    unit.hp > 0 &&
    unit.resolve.current > 0
  );
}

/**
 * Cancels Vigilance due to forced movement.
 * Called when unit retreats, is knocked back, etc.
 * 
 * @param unit - The unit losing Vigilance
 * @param reason - Why Vigilance was cancelled
 * @param state - Current battle state
 */
function cancelVigilance(
  unit: BattleUnit, 
  reason: 'retreat' | 'knockback' | 'forced_move',
  state: BattleState
): void {
  if (unit.vigilance.isVigilant) {
    unit.vigilance.isVigilant = false;
    
    state.events.push({
      type: 'vigilance_cancelled',
      unitId: unit.id,
      reason,
    });
  }
}
```

### Intercept Detection

```typescript
/**
 * Gets the intercept type for a unit based on its tags.
 * 
 * @param unit - The unit to check
 * @returns The type of intercept this unit can perform
 */
function getInterceptType(unit: BattleUnit): InterceptType {
  if (hasTag(unit, 'SpearWall')) {
    return 'hard';
  }
  if (hasTag(unit, 'Cavalry')) {
    return 'counter_charge';
  }
  if (hasTag(unit, 'HeavyInfantry')) {
    return 'soft';
  }
  if (unit.range > 1) {
    return 'none';  // Ranged units can't melee intercept
  }
  return 'none';
}

/**
 * Checks if moving unit triggers any intercepts.
 * Called for each cell the unit moves through.
 * 
 * @param movingUnit - The unit that is moving
 * @param fromPos - Starting position
 * @param toPos - Target position
 * @param state - Current battle state
 * @returns List of potential interceptors
 */
function checkInterceptTriggers(
  movingUnit: BattleUnit,
  fromPos: Position,
  toPos: Position,
  state: BattleState
): BattleUnit[] {
  const interceptors: BattleUnit[] = [];
  
  // Get all enemy units adjacent to the path
  const pathCells = getPathCells(fromPos, toPos);
  
  for (const cell of pathCells) {
    const adjacentEnemies = getAdjacentUnits(cell, state)
      .filter(u => u.team !== movingUnit.team);
    
    for (const enemy of adjacentEnemies) {
      if (canIntercept(enemy) && getInterceptType(enemy) !== 'none') {
        // Check if moving unit can ignore this intercept
        if (hasTag(movingUnit, 'Skirmisher') && getInterceptType(enemy) === 'soft') {
          continue;  // Skirmishers ignore Soft Intercept
        }
        if (hasTag(movingUnit, 'Unstoppable') && getInterceptType(enemy) === 'hard') {
          // Unstoppable ignores Hard Intercept from infantry
          if (!hasTag(enemy, 'Heavy') && !hasTag(enemy, 'Unstoppable')) {
            continue;
          }
        }
        
        interceptors.push(enemy);
      }
    }
  }
  
  return interceptors;
}
```

### Intercept Execution

```typescript
/**
 * Executes a Hard Intercept (Spearmen).
 * Stops enemy movement and strikes first.
 * 
 * @param interceptor - The spearman performing intercept
 * @param target - The moving enemy
 * @param state - Current battle state
 * @returns Result of the intercept
 */
function executeHardIntercept(
  interceptor: BattleUnit,
  target: BattleUnit,
  state: BattleState
): InterceptResult {
  // Mark intercept as used
  interceptor.vigilance.hasUsedIntercept = true;
  
  // Calculate damage (full damage)
  const damage = calculatePhysicalDamage(interceptor, target);
  applyDamage(target, damage, state);
  
  // Resolve shock damage
  const resolveDamage = 10;
  applyResolveDamage(target, resolveDamage, state);
  
  // Cancel any Charge bonuses
  if (target.chargeState?.isCharging) {
    target.chargeState.isCharging = false;
    target.chargeState.momentumBonus = 0;
    
    state.events.push({
      type: 'charge_cancelled',
      unitId: target.id,
      reason: 'intercepted',
    });
  }
  
  state.events.push({
    type: 'hard_intercept',
    interceptorId: interceptor.id,
    targetId: target.id,
    damage,
    resolveDamage,
    movementStopped: true,
  });
  
  return {
    triggered: true,
    type: 'hard',
    damage,
    movementStopped: true,
    targetEngaged: true,
    resolveDamage,
  };
}

/**
 * Executes a Soft Intercept (Infantry).
 * Deals damage but doesn't stop movement.
 * 
 * @param interceptor - The infantry performing intercept
 * @param target - The moving enemy
 * @param state - Current battle state
 * @returns Result of the intercept
 */
function executeSoftIntercept(
  interceptor: BattleUnit,
  target: BattleUnit,
  state: BattleState
): InterceptResult {
  interceptor.vigilance.hasUsedIntercept = true;
  
  // Calculate damage (50% for heavy infantry)
  const damageMultiplier = hasTag(interceptor, 'HeavyInfantry') ? 0.5 : 1.0;
  const damage = Math.floor(calculatePhysicalDamage(interceptor, target) * damageMultiplier);
  applyDamage(target, damage, state);
  
  // Resolve shock damage
  const resolveDamage = 10;
  applyResolveDamage(target, resolveDamage, state);
  
  // Apply Engaged status
  setEngaged(target, interceptor, state);
  
  state.events.push({
    type: 'soft_intercept',
    interceptorId: interceptor.id,
    targetId: target.id,
    damage,
    resolveDamage,
    movementStopped: false,
  });
  
  return {
    triggered: true,
    type: 'soft',
    damage,
    movementStopped: false,
    targetEngaged: true,
    resolveDamage,
  };
}

/**
 * Executes a Counter-Charge (Cavalry).
 * Full damage but no movement stop.
 * 
 * @param interceptor - The cavalry performing counter-charge
 * @param target - The moving enemy
 * @param state - Current battle state
 * @returns Result of the intercept
 */
function executeCounterCharge(
  interceptor: BattleUnit,
  target: BattleUnit,
  state: BattleState
): InterceptResult {
  interceptor.vigilance.hasUsedIntercept = true;
  
  // Full damage
  const damage = calculatePhysicalDamage(interceptor, target);
  applyDamage(target, damage, state);
  
  // Resolve shock damage
  const resolveDamage = 10;
  applyResolveDamage(target, resolveDamage, state);
  
  state.events.push({
    type: 'counter_charge',
    interceptorId: interceptor.id,
    targetId: target.id,
    damage,
    resolveDamage,
  });
  
  return {
    triggered: true,
    type: 'counter_charge',
    damage,
    movementStopped: false,
    targetEngaged: false,
    resolveDamage,
  };
}
```

### Ranged Overwatch

```typescript
/**
 * Checks if ranged unit can perform Overwatch.
 * 
 * @param shooter - The ranged unit
 * @returns Whether Overwatch is possible
 */
function canOverwatch(shooter: BattleUnit): boolean {
  return (
    shooter.vigilance.isVigilant &&
    !shooter.vigilance.hasUsedIntercept &&
    shooter.range > 1 &&
    shooter.ammo.current > 0 &&
    shooter.hp > 0 &&
    shooter.resolve.current > 0
  );
}

/**
 * Executes Overwatch shot against moving enemy.
 * 
 * @param shooter - The ranged unit in Overwatch
 * @param target - The moving enemy
 * @param state - Current battle state
 * @returns Result of the Overwatch
 */
function executeOverwatch(
  shooter: BattleUnit,
  target: BattleUnit,
  state: BattleState
): OverwatchResult {
  // Check Line of Sight
  if (!hasLineOfSight(shooter, target, state)) {
    return { triggered: false, damage: 0, ammoConsumed: 0, targetSuppressed: false };
  }
  
  // Mark Overwatch as used
  shooter.vigilance.hasUsedIntercept = true;
  
  // Consume ammo
  consumeAmmo(shooter, 1);
  
  // Calculate and apply damage
  const damage = calculateRangedDamage(shooter, target);
  applyDamage(target, damage, state);
  
  // Suppression effect: -1 Speed if damage dealt
  let targetSuppressed = false;
  if (damage > 0) {
    target.effectiveSpeed = Math.max(0, target.effectiveSpeed - 1);
    targetSuppressed = true;
  }
  
  state.events.push({
    type: 'overwatch',
    shooterId: shooter.id,
    targetId: target.id,
    damage,
    suppressed: targetSuppressed,
  });
  
  return {
    triggered: true,
    damage,
    ammoConsumed: 1,
    targetSuppressed,
  };
}

/**
 * Checks for Overwatch triggers during enemy movement.
 * 
 * @param movingUnit - The unit that is moving
 * @param state - Current battle state
 * @returns List of Overwatch results
 */
function checkOverwatchTriggers(
  movingUnit: BattleUnit,
  state: BattleState
): OverwatchResult[] {
  const results: OverwatchResult[] = [];
  
  // Find all enemy ranged units in Overwatch
  const enemyShooters = getEnemyUnits(movingUnit, state)
    .filter(u => canOverwatch(u));
  
  for (const shooter of enemyShooters) {
    // Check if moving unit is in range and LoS
    if (isInRange(shooter, movingUnit) && hasLineOfSight(shooter, movingUnit, state)) {
      const result = executeOverwatch(shooter, movingUnit, state);
      results.push(result);
      
      // Only one Overwatch per shooter per round
      if (result.triggered) {
        break;  // First valid shooter fires
      }
    }
  }
  
  return results;
}
```

### Undead Special: Sticky Intercept

```typescript
/**
 * Skeleton Pikemen T3 ability: Sticky Intercept.
 * On intercept, immediately applies Engaged status even without stopping.
 * 
 * @param interceptor - The Skeleton Pikeman
 * @param target - The intercepted enemy
 * @param state - Current battle state
 */
function applyStickyIntercept(
  interceptor: BattleUnit,
  target: BattleUnit,
  state: BattleState
): void {
  if (!hasTag(interceptor, 'StickyIntercept')) {
    return;
  }
  
  // Apply Engaged even if movement wasn't stopped
  setEngaged(target, interceptor, state);
  
  // "Tar pit" effect: target's next Disengage costs +1 Speed
  target.statusEffects.push({
    type: 'tar_pit',
    duration: 1,
    source: interceptor.id,
  });
  
  state.events.push({
    type: 'sticky_intercept',
    interceptorId: interceptor.id,
    targetId: target.id,
  });
}
```

### AI Intercept Behavior

```typescript
/**
 * AI evaluation for Overwatch usage.
 * Decides whether to hold Overwatch for better targets.
 * 
 * @param shooter - The ranged unit considering Overwatch
 * @param potentialTarget - The enemy that might trigger Overwatch
 * @param state - Current battle state
 * @returns Whether to use Overwatch on this target
 */
function shouldUseOverwatch(
  shooter: BattleUnit,
  potentialTarget: BattleUnit,
  state: BattleState
): boolean {
  // Don't waste last ammo on fodder
  if (shooter.ammo.current <= 1 && potentialTarget.cost <= 3) {
    return false;
  }
  
  // Always shoot high-value targets
  if (potentialTarget.cost >= 6 || potentialTarget.role === 'support') {
    return true;
  }
  
  // Check if better targets are approaching
  const approachingEnemies = getEnemiesMovingToward(shooter, state);
  const betterTargetComing = approachingEnemies.some(e => 
    e.cost > potentialTarget.cost && e.id !== potentialTarget.id
  );
  
  if (betterTargetComing && shooter.ammo.current <= 2) {
    return false;  // Save ammo for better target
  }
  
  return true;
}

/**
 * AI pathfinding that avoids Hard Intercept zones.
 * 
 * @param unit - The unit planning movement
 * @param target - Destination position
 * @param state - Current battle state
 * @returns Safe path avoiding intercepts, or null if impossible
 */
function findSafePathAvoidingIntercepts(
  unit: BattleUnit,
  target: Position,
  state: BattleState
): Position[] | null {
  // Get all enemy units with Hard Intercept
  const hardInterceptors = getEnemyUnits(unit, state)
    .filter(e => canIntercept(e) && getInterceptType(e) === 'hard');
  
  // Mark their ZoC as dangerous
  const dangerZones = new Set<string>();
  for (const interceptor of hardInterceptors) {
    const zoc = getAdjacentPositions(interceptor.position);
    for (const pos of zoc) {
      dangerZones.add(`${pos.x},${pos.y}`);
    }
  }
  
  // Find path avoiding danger zones
  return findPathWithAvoidance(unit.position, target, dangerZones, state);
}

/**
 * AI decision to sacrifice fodder to drain intercepts.
 * 
 * @param fodderUnit - Cheap unit to sacrifice
 * @param targetInterceptor - Enemy interceptor to drain
 * @param state - Current battle state
 * @returns Whether to execute fodder sacrifice
 */
function shouldSacrificeFodder(
  fodderUnit: BattleUnit,
  targetInterceptor: BattleUnit,
  state: BattleState
): boolean {
  // Only sacrifice cheap units
  if (fodderUnit.cost > 3) {
    return false;
  }
  
  // Check if elite units are waiting to advance
  const eliteAllies = getAlliedUnits(fodderUnit, state)
    .filter(u => u.cost >= 5 && !u.hasMoved);
  
  if (eliteAllies.length === 0) {
    return false;  // No one to benefit from sacrifice
  }
  
  // Check if interceptor is blocking elite's path
  const interceptorZoC = getAdjacentPositions(targetInterceptor.position);
  const eliteBlocked = eliteAllies.some(elite => {
    const pathToTarget = findPath(elite.position, elite.targetPosition, state);
    return pathToTarget?.some(pos => 
      interceptorZoC.some(zoc => zoc.x === pos.x && zoc.y === pos.y)
    );
  });
  
  return eliteBlocked;
}
```

### Integration with Movement System

```typescript
/**
 * Processes all intercepts and Overwatch during unit movement.
 * Called by the movement system for each moving unit.
 * 
 * @param unit - The unit that is moving
 * @param path - The movement path
 * @param state - Current battle state
 * @returns Final position after all intercepts processed
 */
function processMovementWithIntercepts(
  unit: BattleUnit,
  path: Position[],
  state: BattleState
): Position {
  let currentPos = unit.position;
  
  for (let i = 0; i < path.length; i++) {
    const nextPos = path[i];
    
    // Check for Overwatch triggers
    const overwatchResults = checkOverwatchTriggers(unit, state);
    for (const result of overwatchResults) {
      if (result.targetSuppressed) {
        // Reduce remaining movement
        unit.effectiveSpeed -= 1;
        if (unit.effectiveSpeed <= 0) {
          return currentPos;  // Can't continue moving
        }
      }
    }
    
    // Check for melee intercepts
    const interceptors = checkInterceptTriggers(unit, currentPos, nextPos, state);
    
    for (const interceptor of interceptors) {
      const interceptType = getInterceptType(interceptor);
      let result: InterceptResult;
      
      switch (interceptType) {
        case 'hard':
          result = executeHardIntercept(interceptor, unit, state);
          if (result.movementStopped) {
            return currentPos;  // Movement halted
          }
          break;
        case 'soft':
          result = executeSoftIntercept(interceptor, unit, state);
          // Movement continues but unit is now Engaged
          break;
        case 'counter_charge':
          result = executeCounterCharge(interceptor, unit, state);
          break;
      }
      
      // Check if unit died from intercept
      if (unit.hp <= 0) {
        return currentPos;
      }
    }
    
    currentPos = nextPos;
  }
  
  return currentPos;
}
```

### Visual Feedback

```typescript
/**
 * Renders Vigilance and intercept zone indicators.
 * 
 * @param unit - The unit to render indicators for
 * @param state - Current battle state
 */
function renderInterceptIndicators(unit: BattleUnit, state: BattleState): void {
  // Vigilance icon (eye)
  if (unit.vigilance.isVigilant) {
    showIcon(unit.position, 'vigilance_eye', 'blue');
    
    // Show intercept zone for spearmen
    if (getInterceptType(unit) === 'hard') {
      const zoc = getAdjacentPositions(unit.position);
      for (const pos of zoc) {
        highlightCell(pos, 'red', 0.3);  // Red danger zone
      }
    }
    
    // Show Overwatch arc for ranged
    if (unit.range > 1 && canOverwatch(unit)) {
      const firingArc = getLoSCells(unit, state);
      for (const pos of firingArc) {
        highlightCell(pos, 'orange', 0.2);  // Orange Overwatch zone
      }
    }
  }
}

/**
 * Animates intercept events.
 * 
 * @param event - The intercept event to animate
 */
function animateIntercept(event: InterceptEvent): void {
  switch (event.type) {
    case 'hard_intercept':
      // Spear thrust animation
      playAnimation('spear_thrust', event.interceptorId, event.targetId);
      showPopup(event.targetId, 'STOPPED!', 'red');
      break;
      
    case 'soft_intercept':
      // Quick slash animation
      playAnimation('quick_slash', event.interceptorId, event.targetId);
      showPopup(event.targetId, 'Intercepted!', 'orange');
      break;
      
    case 'counter_charge':
      // Cavalry clash animation
      playAnimation('cavalry_clash', event.interceptorId, event.targetId);
      showPopup(event.targetId, 'Counter-Charge!', 'yellow');
      break;
      
    case 'overwatch':
      // Ranged shot animation
      playAnimation('overwatch_shot', event.shooterId, event.targetId);
      if (event.suppressed) {
        showPopup(event.targetId, 'Suppressed!', 'blue');
      }
      break;
  }
}
```

### Strategic Diagrams

```
┌─────────────────────────────────────────────────────────────┐
│              KILL ZONE FORMATION                             │
│                                                              │
│  Row 2: [ ][A][ ][A][ ]  ← Archers in Overwatch             │
│  Row 1: [S][ ][S][ ][S]  ← Spearmen in Vigilance            │
│  Row 0: [ ][ ][ ][ ][ ]  ← Empty "kill zone"                │
│                                                              │
│  Enemy entering Row 0:                                       │
│  1. Triggers Overwatch from Archers (damage + suppress)     │
│  2. Triggers Hard Intercept from Spearmen (stop + damage)   │
│  3. Now Engaged, can't reach Archers                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              FODDER DRAIN TACTIC                             │
│                                                              │
│  Undead Turn 1: Send Zombie into kill zone                  │
│  - Zombie triggers Archer Overwatch (Archer loses ammo)     │
│  - Zombie triggers Spearman Intercept (Spearman used)       │
│  - Zombie dies, but intercepts are "spent"                  │
│                                                              │
│  Undead Turn 2: Send Grave Guard through same path          │
│  - No Overwatch (Archer already fired)                      │
│  - No Intercept (Spearman already used)                     │
│  - Grave Guard reaches Archers safely                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              CHARGE VS SPEAR WALL                            │
│                                                              │
│  Empire Knight charges Undead Skeleton Pikeman:             │
│                                                              │
│  Without Intercept:                                          │
│  - Knight moves 4 cells, gains +80% ATK                     │
│  - Knight strikes first with massive damage                 │
│  - Pikeman dies before attacking                            │
│                                                              │
│  With Hard Intercept:                                        │
│  - Knight moves 2 cells toward Pikeman                      │
│  - Pikeman triggers Intercept, strikes FIRST                │
│  - Knight's Charge cancelled, stops at cell 2               │
│  - Knight takes damage + -10 Resolve                        │
│  - Knight is now Engaged, can't continue charge             │
└─────────────────────────────────────────────────────────────┘
```


---

## Contagion System (Effect Spreading)

### Overview

Contagion creates a direct counter to Phalanx formations. Dense formations gain defensive bonuses but become vulnerable to chain-spreading effects like Fire, Poison, and Plague. This forces players to choose between formation strength and spread safety.

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTAGION DILEMMA                         │
│                                                              │
│  TIGHT PHALANX:                 SPREAD FORMATION:           │
│  ┌───┬───┬───┐                  ┌───┬───┬───┬───┬───┐       │
│  │ S │ S │ S │  +5 Armor        │ S │   │ S │   │ S │       │
│  ├───┼───┼───┤  +25 Resolve     ├───┼───┼───┼───┼───┤       │
│  │ S │🔥│ S │  HIGH SPREAD      │   │ S │   │ S │   │       │
│  ├───┼───┼───┤  RISK            ├───┼───┼───┼───┼───┤       │
│  │ S │ S │ S │                  │ S │   │🔥│   │ S │       │
│  └───┴───┴───┘                  └───┴───┴───┴───┴───┘       │
│                                  +0 Armor, NO SPREAD RISK   │
└─────────────────────────────────────────────────────────────┘
```

### Core Types

```typescript
/**
 * Types of contagious effects that can spread between units
 */
type ContagionType = 'fire' | 'poison' | 'curse' | 'frost' | 'plague';

/**
 * Configuration for each contagion type
 */
interface ContagionConfig {
  /** Type identifier */
  type: ContagionType;
  /** Chance to spread to adjacent unit (0-100) */
  spreadChance: number;
  /** HP damage per turn */
  damagePerTurn: number;
  /** Duration in turns */
  duration: number;
  /** Additional stat modifiers */
  statModifiers?: {
    atk?: number;      // Percentage modifier
    speed?: number;    // Flat modifier
    resolve?: number;  // Flat modifier per turn
  };
  /** Visual effect identifier */
  visualEffect: string;
}

/**
 * Active contagion on a unit
 */
interface ActiveContagion {
  /** Contagion type */
  type: ContagionType;
  /** Remaining duration */
  remainingTurns: number;
  /** Source unit that applied this contagion */
  sourceId: string;
  /** Turn when contagion was applied */
  appliedOnTurn: number;
}

/**
 * Result of a spread attempt
 */
interface SpreadResult {
  /** Whether spread occurred */
  spread: boolean;
  /** Target unit that caught the contagion */
  targetId: string | null;
  /** Roll result (for determinism) */
  rollResult: number;
  /** Required roll to spread */
  spreadThreshold: number;
}
```

### Contagion Configuration

```typescript
const CONTAGION_CONFIG: Record<ContagionType, ContagionConfig> = {
  fire: {
    type: 'fire',
    spreadChance: 50,
    damagePerTurn: 8,
    duration: 3,
    statModifiers: { resolve: -5 },
    visualEffect: 'flames_orange',
  },
  
  poison: {
    type: 'poison',
    spreadChance: 30,
    damagePerTurn: 5,
    duration: 5,
    statModifiers: { atk: -10 },
    visualEffect: 'bubbles_green',
  },
  
  curse: {
    type: 'curse',
    spreadChance: 40,
    damagePerTurn: 0,
    duration: 4,
    statModifiers: { atk: -20, resolve: -10 },
    visualEffect: 'wisps_purple',
  },
  
  frost: {
    type: 'frost',
    spreadChance: 25,
    damagePerTurn: 3,
    duration: 3,
    statModifiers: { speed: -1 },
    visualEffect: 'crystals_blue',
  },
  
  plague: {
    type: 'plague',
    spreadChance: 60,
    damagePerTurn: 10,
    duration: 2,
    statModifiers: { resolve: -8 },
    visualEffect: 'miasma_sickly',
  },
};
```

### Contagion Application

```typescript
/**
 * Applies a contagion effect to a unit.
 * If unit already has this contagion, refreshes duration instead of stacking.
 * 
 * @param unit - Target unit
 * @param type - Contagion type to apply
 * @param sourceId - ID of unit/ability that caused the contagion
 * @param state - Current battle state
 * @returns Whether contagion was applied (false if immune)
 */
function applyContagion(
  unit: BattleUnit,
  type: ContagionType,
  sourceId: string,
  state: BattleState
): boolean {
  // Check immunity
  if (isImmuneToContagion(unit, type)) {
    state.events.push({
      type: 'contagion_immune',
      unitId: unit.id,
      contagionType: type,
    });
    return false;
  }
  
  const config = CONTAGION_CONFIG[type];
  
  // Check if already has this contagion
  const existing = unit.contagions.find(c => c.type === type);
  
  if (existing) {
    // Refresh duration (don't stack)
    existing.remainingTurns = config.duration;
    existing.appliedOnTurn = state.currentTurn;
    
    state.events.push({
      type: 'contagion_refreshed',
      unitId: unit.id,
      contagionType: type,
      newDuration: config.duration,
    });
  } else {
    // Apply new contagion
    unit.contagions.push({
      type,
      remainingTurns: config.duration,
      sourceId,
      appliedOnTurn: state.currentTurn,
    });
    
    state.events.push({
      type: 'contagion_applied',
      unitId: unit.id,
      contagionType: type,
      sourceId,
      duration: config.duration,
    });
  }
  
  return true;
}

/**
 * Checks if unit is immune to a specific contagion type.
 * 
 * @param unit - Unit to check
 * @param type - Contagion type
 * @returns Whether unit is immune
 */
function isImmuneToContagion(unit: BattleUnit, type: ContagionType): boolean {
  // Tag-based immunity
  const immunityTags: Record<ContagionType, string> = {
    fire: 'FireImmune',
    poison: 'PoisonImmune',
    curse: 'CurseImmune',
    frost: 'FrostImmune',
    plague: 'PlagueImmune',
  };
  
  if (hasTag(unit, immunityTags[type])) {
    return true;
  }
  
  // Undead are immune to poison
  if (type === 'poison' && unit.faction === 'undead') {
    return true;
  }
  
  // Check for Purifier aura protection
  if (isInPurifierAura(unit, state)) {
    return true;
  }
  
  return false;
}
```

### Spread Mechanics

```typescript
/**
 * Processes contagion spread at the start of an infected unit's turn.
 * Checks all 4 orthogonal neighbors for potential spread.
 * 
 * @param unit - The infected unit
 * @param state - Current battle state
 * @returns Array of spread results
 */
function processContagionSpread(
  unit: BattleUnit,
  state: BattleState
): SpreadResult[] {
  const results: SpreadResult[] = [];
  
  for (const contagion of unit.contagions) {
    const config = CONTAGION_CONFIG[contagion.type];
    
    // Get orthogonal neighbors (not diagonals)
    const neighbors = getOrthogonalNeighbors(unit.position, state);
    
    for (const neighbor of neighbors) {
      // Skip if neighbor already has this contagion
      if (neighbor.contagions.some(c => c.type === contagion.type)) {
        continue;
      }
      
      // Calculate spread chance with modifiers
      let spreadChance = config.spreadChance;
      
      // Empire units are more vulnerable to fire
      if (contagion.type === 'fire' && neighbor.faction === 'empire') {
        spreadChance += 10;
      }
      
      // Roll for spread (using seeded random for determinism)
      const roll = state.random.next() * 100;
      const spread = roll < spreadChance;
      
      results.push({
        spread,
        targetId: spread ? neighbor.id : null,
        rollResult: roll,
        spreadThreshold: spreadChance,
      });
      
      if (spread) {
        applyContagion(neighbor, contagion.type, unit.id, state);
        
        state.events.push({
          type: 'contagion_spread',
          sourceId: unit.id,
          targetId: neighbor.id,
          contagionType: contagion.type,
          roll,
          threshold: spreadChance,
        });
      }
    }
  }
  
  return results;
}

/**
 * Gets units in orthogonal positions (up, down, left, right).
 * Does NOT include diagonals.
 * 
 * @param position - Center position
 * @param state - Current battle state
 * @returns Array of adjacent units
 */
function getOrthogonalNeighbors(
  position: Position,
  state: BattleState
): BattleUnit[] {
  const directions = [
    { x: 0, y: -1 },  // Up
    { x: 0, y: 1 },   // Down
    { x: -1, y: 0 },  // Left
    { x: 1, y: 0 },   // Right
  ];
  
  const neighbors: BattleUnit[] = [];
  
  for (const dir of directions) {
    const neighborPos = {
      x: position.x + dir.x,
      y: position.y + dir.y,
    };
    
    const unit = getUnitAtPosition(neighborPos, state);
    if (unit && unit.hp > 0) {
      neighbors.push(unit);
    }
  }
  
  return neighbors;
}
```

### Contagion Damage Processing

```typescript
/**
 * Processes contagion damage and effects at the start of unit's turn.
 * 
 * @param unit - The infected unit
 * @param state - Current battle state
 */
function processContagionDamage(
  unit: BattleUnit,
  state: BattleState
): void {
  for (const contagion of unit.contagions) {
    const config = CONTAGION_CONFIG[contagion.type];
    
    // Apply HP damage
    if (config.damagePerTurn > 0) {
      applyDamage(unit, config.damagePerTurn, state);
      
      state.events.push({
        type: 'contagion_damage',
        unitId: unit.id,
        contagionType: contagion.type,
        damage: config.damagePerTurn,
      });
    }
    
    // Apply Resolve damage
    if (config.statModifiers?.resolve) {
      applyResolveDamage(unit, Math.abs(config.statModifiers.resolve), state);
    }
    
    // Reduce duration
    contagion.remainingTurns--;
  }
  
  // Remove expired contagions
  unit.contagions = unit.contagions.filter(c => c.remainingTurns > 0);
  
  // Notify adjacent allies (watching ally burn = -3 Resolve)
  if (unit.contagions.some(c => c.type === 'fire')) {
    const allies = getOrthogonalNeighbors(unit.position, state)
      .filter(u => u.team === unit.team);
    
    for (const ally of allies) {
      applyResolveDamage(ally, 3, state);
      
      state.events.push({
        type: 'witness_burning',
        witnessId: ally.id,
        burningUnitId: unit.id,
        resolveDamage: 3,
      });
    }
  }
}

/**
 * Applies stat modifiers from active contagions.
 * Called when calculating effective stats.
 * 
 * @param unit - Unit with contagions
 * @returns Stat modifiers to apply
 */
function getContagionStatModifiers(unit: BattleUnit): StatModifiers {
  const modifiers: StatModifiers = {
    atk: 0,
    speed: 0,
    armor: 0,
  };
  
  for (const contagion of unit.contagions) {
    const config = CONTAGION_CONFIG[contagion.type];
    
    if (config.statModifiers?.atk) {
      modifiers.atk += config.statModifiers.atk;
    }
    if (config.statModifiers?.speed) {
      modifiers.speed += config.statModifiers.speed;
    }
  }
  
  return modifiers;
}
```

### Contagion Removal

```typescript
/**
 * Removes contagion via Purify ability.
 * Affects all units within radius.
 * 
 * @param caster - Unit casting Purify
 * @param radius - Effect radius
 * @param state - Current battle state
 */
function castPurify(
  caster: BattleUnit,
  radius: number,
  state: BattleState
): void {
  const affectedUnits = getUnitsInRadius(caster.position, radius, state)
    .filter(u => u.team === caster.team);
  
  for (const unit of affectedUnits) {
    const removedCount = unit.contagions.length;
    unit.contagions = [];
    
    if (removedCount > 0) {
      state.events.push({
        type: 'contagion_purified',
        casterId: caster.id,
        targetId: unit.id,
        removedCount,
      });
    }
  }
}

/**
 * Attempts to remove contagion via Rest action.
 * 50% chance to remove one random contagion.
 * 
 * @param unit - Resting unit
 * @param state - Current battle state
 * @returns Whether a contagion was removed
 */
function attemptRestCure(
  unit: BattleUnit,
  state: BattleState
): boolean {
  if (unit.contagions.length === 0) {
    return false;
  }
  
  const roll = state.random.next() * 100;
  
  if (roll < 50) {
    // Remove random contagion
    const index = Math.floor(state.random.next() * unit.contagions.length);
    const removed = unit.contagions.splice(index, 1)[0];
    
    state.events.push({
      type: 'contagion_rest_cured',
      unitId: unit.id,
      contagionType: removed.type,
      roll,
    });
    
    return true;
  }
  
  return false;
}
```

### Death Spread (Plague Bearer)

```typescript
/**
 * Processes death spread for units with [DeathSpread] tag.
 * On death, spreads contagion to all adjacent units.
 * 
 * @param dyingUnit - Unit that just died
 * @param state - Current battle state
 */
function processDeathSpread(
  dyingUnit: BattleUnit,
  state: BattleState
): void {
  if (!hasTag(dyingUnit, 'DeathSpread')) {
    return;
  }
  
  // Get the contagion type this unit spreads
  const spreadType = getDeathSpreadType(dyingUnit);
  if (!spreadType) {
    return;
  }
  
  // Get ALL adjacent units (including diagonals for death spread)
  const adjacentUnits = getAdjacentUnits(dyingUnit.position, state);
  
  for (const target of adjacentUnits) {
    applyContagion(target, spreadType, dyingUnit.id, state);
    
    state.events.push({
      type: 'death_spread',
      sourceId: dyingUnit.id,
      targetId: target.id,
      contagionType: spreadType,
    });
  }
}

/**
 * Gets the contagion type a unit spreads on death.
 * 
 * @param unit - Unit with DeathSpread tag
 * @returns Contagion type or null
 */
function getDeathSpreadType(unit: BattleUnit): ContagionType | null {
  if (unit.unitType === 'plague_bearer') {
    return 'plague';
  }
  if (unit.unitType === 'fire_elemental') {
    return 'fire';
  }
  return null;
}
```

### AI Contagion Behavior

```typescript
/**
 * AI evaluation for targeting with contagion abilities.
 * Prioritizes targets in dense formations.
 * 
 * @param caster - Unit with contagion ability
 * @param targets - Potential targets
 * @param state - Current battle state
 * @returns Best target for contagion
 */
function findBestContagionTarget(
  caster: BattleUnit,
  targets: BattleUnit[],
  state: BattleState
): BattleUnit | null {
  let bestTarget: BattleUnit | null = null;
  let bestScore = 0;
  
  for (const target of targets) {
    let score = 1;
    
    // Count adjacent allies (spread potential)
    const adjacentAllies = getOrthogonalNeighbors(target.position, state)
      .filter(u => u.team === target.team);
    
    score += adjacentAllies.length * 2;  // Each neighbor = +2 score
    
    // Bonus for targets in Phalanx formation
    if (isInPhalanx(target, state)) {
      score += 3;
    }
    
    // Bonus for Empire targets (fire vulnerability)
    if (target.faction === 'empire' && caster.contagionType === 'fire') {
      score += 2;
    }
    
    // Penalty for targets with Purifier nearby
    if (hasPurifierNearby(target, state)) {
      score -= 5;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestTarget = target;
    }
  }
  
  return bestTarget;
}

/**
 * AI decision to spread formation when contagion detected.
 * 
 * @param unit - Unit considering movement
 * @param state - Current battle state
 * @returns Whether unit should move away from infected allies
 */
function shouldSpreadFormation(
  unit: BattleUnit,
  state: BattleState
): boolean {
  // Check if any adjacent ally is infected
  const adjacentAllies = getOrthogonalNeighbors(unit.position, state)
    .filter(u => u.team === unit.team);
  
  const infectedNearby = adjacentAllies.some(ally => 
    ally.contagions.length > 0
  );
  
  if (!infectedNearby) {
    return false;
  }
  
  // Calculate risk vs benefit
  const phalanxBonus = calculatePhalanxBonus(unit, state);
  const spreadRisk = calculateSpreadRisk(unit, state);
  
  // If spread risk outweighs Phalanx bonus, move away
  return spreadRisk > phalanxBonus.armor * 2;
}

/**
 * Calculates spread risk for a unit based on nearby infections.
 * 
 * @param unit - Unit to evaluate
 * @param state - Current battle state
 * @returns Risk score (higher = more dangerous)
 */
function calculateSpreadRisk(
  unit: BattleUnit,
  state: BattleState
): number {
  let risk = 0;
  
  const adjacentAllies = getOrthogonalNeighbors(unit.position, state)
    .filter(u => u.team === unit.team);
  
  for (const ally of adjacentAllies) {
    for (const contagion of ally.contagions) {
      const config = CONTAGION_CONFIG[contagion.type];
      risk += config.spreadChance * config.damagePerTurn / 10;
    }
  }
  
  return risk;
}
```

### Visual Feedback

```typescript
/**
 * Renders contagion visual effects on affected units.
 * 
 * @param unit - Unit with contagions
 */
function renderContagionEffects(unit: BattleUnit): void {
  for (const contagion of unit.contagions) {
    const config = CONTAGION_CONFIG[contagion.type];
    
    // Particle effect
    playParticleEffect(unit.position, config.visualEffect);
    
    // Status icon
    showStatusIcon(unit.position, contagion.type);
    
    // Duration indicator
    showDurationCounter(unit.position, contagion.remainingTurns);
  }
  
  // Highlight units at risk of catching contagion
  const neighbors = getOrthogonalNeighbors(unit.position, state);
  for (const neighbor of neighbors) {
    if (!neighbor.contagions.some(c => c.type === unit.contagions[0]?.type)) {
      showWarningGlow(neighbor.position, 'yellow');
    }
  }
}

/**
 * Animates contagion spread event.
 * 
 * @param event - Spread event data
 */
function animateContagionSpread(event: ContagionSpreadEvent): void {
  const config = CONTAGION_CONFIG[event.contagionType];
  
  // Draw spread arrow
  drawSpreadArrow(event.sourceId, event.targetId, config.visualEffect);
  
  // Show popup
  showPopup(event.targetId, 'SPREAD!', getContagionColor(event.contagionType));
  
  // Play sound
  playSound(`contagion_${event.contagionType}_spread`);
}

/**
 * Gets color for contagion type.
 */
function getContagionColor(type: ContagionType): string {
  const colors: Record<ContagionType, string> = {
    fire: '#FF6B00',
    poison: '#00FF00',
    curse: '#9B30FF',
    frost: '#00BFFF',
    plague: '#8B4513',
  };
  return colors[type];
}
```

### Strategic Diagrams

```
┌─────────────────────────────────────────────────────────────┐
│              CHAIN REACTION EXAMPLE                          │
│                                                              │
│  Turn 1: Fire Mage casts Fireball on center unit            │
│  ┌───┬───┬───┐                                              │
│  │ S │ S │ S │                                              │
│  ├───┼───┼───┤                                              │
│  │ S │🔥│ S │  ← Center unit burning                        │
│  ├───┼───┼───┤                                              │
│  │ S │ S │ S │                                              │
│  └───┴───┴───┘                                              │
│                                                              │
│  Turn 2: Fire spreads (50% each direction)                  │
│  ┌───┬───┬───┐                                              │
│  │ S │🔥│ S │  ← Spread up (success)                        │
│  ├───┼───┼───┤                                              │
│  │🔥│🔥│ S │  ← Spread left (success), right (fail)        │
│  ├───┼───┼───┤                                              │
│  │ S │🔥│ S │  ← Spread down (success)                      │
│  └───┴───┴───┘                                              │
│                                                              │
│  Result: 1 spell → 5 units burning → 40 HP/turn!            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              PLAGUE BEARER SACRIFICE                         │
│                                                              │
│  Undead sends Plague Bearer [P] into Empire formation:      │
│                                                              │
│  Before:                        After [P] dies:             │
│  ┌───┬───┬───┐                  ┌───┬───┬───┐               │
│  │ S │ S │ S │                  │☠️│☠️│☠️│  ← All adjacent  │
│  ├───┼───┼───┤                  ├───┼───┼───┤    get Plague │
│  │ S │ P │ S │                  │☠️│💀│☠️│                  │
│  ├───┼───┼───┤                  ├───┼───┼───┤               │
│  │ S │ S │ S │                  │☠️│☠️│☠️│                  │
│  └───┴───┴───┘                  └───┴───┴───┘               │
│                                                              │
│  8 units infected with Plague (60% spread, 10 HP/turn)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              SAFE FORMATION (CHECKERBOARD)                   │
│                                                              │
│  ┌───┬───┬───┬───┬───┐                                      │
│  │ S │   │ S │   │ S │  No orthogonal neighbors             │
│  ├───┼───┼───┼───┼───┤  = No spread possible                │
│  │   │ S │   │ S │   │                                      │
│  ├───┼───┼───┼───┼───┤  Trade-off:                          │
│  │ S │   │🔥│   │ S │  - No Phalanx bonuses                 │
│  ├───┼───┼───┼───┼───┤  - Fire cannot spread                │
│  │   │ S │   │ S │   │  - Vulnerable to flanking            │
│  ├───┼───┼───┼───┼───┤                                      │
│  │ S │   │ S │   │ S │                                      │
│  └───┴───┴───┴───┴───┘                                      │
└─────────────────────────────────────────────────────────────┘
```


---

## Armor Shred System

### Overview

Armor Shred creates attrition warfare where prolonged battles favor aggressive attackers. Each physical attack chips away at the target's armor, making tanks progressively more vulnerable over time.

```
┌─────────────────────────────────────────────────────────────┐
│                    ARMOR DEGRADATION                         │
│                                                              │
│  Knight with 10 Armor:                                      │
│                                                              │
│  Turn 1: Hit → 9 Armor (1 shred)                            │
│  Turn 2: Hit → 8 Armor (2 shred)                            │
│  Turn 3: Hit × 2 → 6 Armor (4 shred = MAX)                  │
│  Turn 4+: Stays at 6 Armor (60% of base)                    │
│                                                              │
│  "Even the mightiest armor crumbles under sustained assault" │
└─────────────────────────────────────────────────────────────┘
```

### Core Types

```typescript
/**
 * Armor shred state for a unit
 */
interface ArmorShredState {
  /** Current shred stacks */
  shredStacks: number;
  /** Maximum shred stacks (40% of base armor) */
  maxShred: number;
  /** Base armor before any shred */
  baseArmor: number;
}

/**
 * Configuration for armor shred system
 */
const ARMOR_SHRED_CONFIG = {
  /** Shred applied per physical attack */
  shredPerAttack: 1,
  /** Maximum shred as percentage of base armor */
  maxShredPercent: 0.4,
  /** Minimum armor percentage after shred */
  minArmorPercent: 0.6,
};

/**
 * Unit tags that modify shred behavior
 */
type ShredTag = 
  | 'Ethereal'         // Immune to shred (no physical armor)
  | 'Regenerating'     // Recovers 1 shred stack per turn
  | 'AdamantineArmor'  // Shred cap reduced to 20%
  | 'ArmorPiercer'     // +2 shred per attack
  | 'RendingBlows';    // Shred cap increased to 60%
```

### Shred Calculation

```typescript
/**
 * Initializes armor shred state for a unit.
 * Called at battle start.
 * 
 * @param unit - Unit to initialize
 */
function initArmorShred(unit: BattleUnit): void {
  const maxShredPercent = hasTag(unit, 'AdamantineArmor') 
    ? 0.2 
    : ARMOR_SHRED_CONFIG.maxShredPercent;
  
  unit.armorShred = {
    shredStacks: 0,
    maxShred: Math.floor(unit.armor * maxShredPercent),
    baseArmor: unit.armor,
  };
}

/**
 * Calculates current effective armor after shred.
 * 
 * @param unit - Unit to calculate armor for
 * @returns Current effective armor value
 * 
 * @example
 * // Knight with 10 base armor, 4 shred stacks
 * const armor = getCurrentArmor(knight);
 * // Returns: 6 (10 - 4 = 6, which is 60% minimum)
 */
function getCurrentArmor(unit: BattleUnit): number {
  const shredReduction = Math.min(
    unit.armorShred.shredStacks,
    unit.armorShred.maxShred
  );
  
  const currentArmor = unit.armorShred.baseArmor - shredReduction;
  const minArmor = Math.floor(
    unit.armorShred.baseArmor * ARMOR_SHRED_CONFIG.minArmorPercent
  );
  
  return Math.max(currentArmor, minArmor);
}

/**
 * Applies armor shred from a physical attack.
 * 
 * @param attacker - Unit dealing damage
 * @param target - Unit receiving damage
 * @param state - Current battle state
 * @returns Number of shred stacks applied
 */
function applyArmorShred(
  attacker: BattleUnit,
  target: BattleUnit,
  state: BattleState
): number {
  // Ethereal units are immune to shred
  if (hasTag(target, 'Ethereal')) {
    return 0;
  }
  
  // Calculate shred amount
  let shredAmount = ARMOR_SHRED_CONFIG.shredPerAttack;
  
  // Armor Piercer applies extra shred
  if (hasTag(attacker, 'ArmorPiercer')) {
    shredAmount += 2;
  }
  
  // Check if target has Rending Blows vulnerability
  const maxShred = hasTag(attacker, 'RendingBlows')
    ? Math.floor(target.armorShred.baseArmor * 0.6)
    : target.armorShred.maxShred;
  
  // Apply shred up to maximum
  const previousStacks = target.armorShred.shredStacks;
  target.armorShred.shredStacks = Math.min(
    target.armorShred.shredStacks + shredAmount,
    maxShred
  );
  
  const actualShred = target.armorShred.shredStacks - previousStacks;
  
  if (actualShred > 0) {
    state.events.push({
      type: 'armor_shredded',
      attackerId: attacker.id,
      targetId: target.id,
      shredAmount: actualShred,
      totalShred: target.armorShred.shredStacks,
      currentArmor: getCurrentArmor(target),
    });
  }
  
  return actualShred;
}
```

### Multi-Attack Interaction

```typescript
/**
 * Processes shred for multi-attack units.
 * Each attack in attackCount applies shred separately.
 * 
 * @param attacker - Unit with multiple attacks
 * @param target - Target unit
 * @param state - Current battle state
 * 
 * @example
 * // Assassin with attackCount=3 attacks Knight
 * processMultiAttackShred(assassin, knight, state);
 * // Knight receives 3 shred stacks (one per attack)
 */
function processMultiAttackShred(
  attacker: BattleUnit,
  target: BattleUnit,
  state: BattleState
): void {
  for (let i = 0; i < attacker.attackCount; i++) {
    applyArmorShred(attacker, target, state);
  }
}

/**
 * Integrates shred into damage calculation.
 * Called during combat resolution.
 * 
 * @param attacker - Attacking unit
 * @param target - Target unit
 * @param state - Current battle state
 * @returns Damage dealt after armor calculation
 */
function calculateDamageWithShred(
  attacker: BattleUnit,
  target: BattleUnit,
  state: BattleState
): number {
  // Get current armor (reduced by shred)
  const effectiveArmor = getCurrentArmor(target);
  
  // Calculate damage with reduced armor
  const baseDamage = attacker.atk * attacker.attackCount;
  const damage = Math.max(1, baseDamage - effectiveArmor);
  
  // Apply shred AFTER damage calculation
  processMultiAttackShred(attacker, target, state);
  
  return damage;
}
```

### Shred Recovery

```typescript
/**
 * Processes shred recovery for Regenerating units.
 * Called at start of unit's turn.
 * 
 * @param unit - Unit with Regenerating tag
 * @param state - Current battle state
 */
function processShredRecovery(
  unit: BattleUnit,
  state: BattleState
): void {
  if (!hasTag(unit, 'Regenerating')) {
    return;
  }
  
  if (unit.armorShred.shredStacks > 0) {
    unit.armorShred.shredStacks -= 1;
    
    state.events.push({
      type: 'shred_recovered',
      unitId: unit.id,
      newShredStacks: unit.armorShred.shredStacks,
      currentArmor: getCurrentArmor(unit),
    });
  }
}

/**
 * Field Repairs ability - removes shred from adjacent ally.
 * T3 Blacksmith ability.
 * 
 * @param blacksmith - Unit with Field Repairs ability
 * @param target - Adjacent ally to repair
 * @param state - Current battle state
 */
function fieldRepairs(
  blacksmith: BattleUnit,
  target: BattleUnit,
  state: BattleState
): void {
  if (!isAdjacent(blacksmith.position, target.position)) {
    return;
  }
  
  const repairAmount = 2;
  const previousStacks = target.armorShred.shredStacks;
  target.armorShred.shredStacks = Math.max(
    0,
    target.armorShred.shredStacks - repairAmount
  );
  
  const actualRepair = previousStacks - target.armorShred.shredStacks;
  
  if (actualRepair > 0) {
    state.events.push({
      type: 'armor_repaired',
      blacksmithId: blacksmith.id,
      targetId: target.id,
      repairAmount: actualRepair,
      currentArmor: getCurrentArmor(target),
    });
  }
}
```

### T3 Abilities

```typescript
/**
 * T3 abilities related to armor shred
 */
const SHRED_T3_ABILITIES: Record<string, T3Ability> = {
  armor_piercer: {
    id: 'armor_piercer',
    name: 'Armor Piercer',
    unit: 'assassin_t3',
    description: '+2 shred per attack',
    effect: (attacker, target, state) => {
      // Handled in applyArmorShred via tag check
      return { extraShred: 2 };
    },
  },
  
  rending_blows: {
    id: 'rending_blows',
    name: 'Rending Blows',
    unit: 'berserker_t3',
    description: 'Shred cap increased to 60%',
    effect: (attacker, target, state) => {
      // Handled in applyArmorShred via tag check
      return { maxShredPercent: 0.6 };
    },
  },
  
  field_repairs: {
    id: 'field_repairs',
    name: 'Field Repairs',
    unit: 'blacksmith',
    description: 'Remove 2 shred stacks from adjacent ally',
    effect: (blacksmith, target, state) => {
      fieldRepairs(blacksmith, target, state);
      return { repaired: true };
    },
  },
  
  cursed_blades: {
    id: 'cursed_blades',
    name: 'Cursed Blades',
    unit: 'grave_guard_t3',
    description: 'Shred also reduces Resolve recovery by 2',
    effect: (attacker, target, state) => {
      // Apply debuff that reduces Resolve recovery
      target.statusEffects.push({
        type: 'cursed_wound',
        duration: 3,
        effect: { resolveRecovery: -2 },
      });
      return { cursed: true };
    },
  },
};
```

### Shred vs Other Systems

```typescript
/**
 * Checks if shred applies based on attack type.
 * Only physical attacks apply shred.
 * 
 * @param attackType - Type of attack
 * @returns Whether shred should be applied
 */
function shouldApplyShred(attackType: AttackType): boolean {
  // Physical attacks apply shred
  if (attackType === 'physical' || attackType === 'melee') {
    return true;
  }
  
  // Magic attacks do NOT apply shred
  if (attackType === 'magic' || attackType === 'fire' || attackType === 'frost') {
    return false;
  }
  
  // Riposte, Intercept, Charge all apply shred
  if (attackType === 'riposte' || attackType === 'intercept' || attackType === 'charge') {
    return true;
  }
  
  return false;
}

/**
 * Phalanx bonus is NOT affected by shred.
 * Shred only reduces base armor.
 * 
 * @param unit - Unit in Phalanx
 * @param state - Current battle state
 * @returns Total effective armor
 */
function getEffectiveArmorWithPhalanx(
  unit: BattleUnit,
  state: BattleState
): number {
  const baseArmor = getCurrentArmor(unit);  // Shred applied to base
  const phalanxBonus = calculatePhalanxBonus(unit, state).armorBonus;
  
  return baseArmor + phalanxBonus;  // Phalanx bonus unaffected
}
```

### AI Shred Behavior

```typescript
/**
 * AI evaluation for targeting based on shred state.
 * Prioritizes already-shredded targets.
 * 
 * @param attacker - Attacking unit
 * @param targets - Potential targets
 * @param state - Current battle state
 * @returns Sorted targets by priority
 */
function prioritizeShredTargets(
  attacker: BattleUnit,
  targets: BattleUnit[],
  state: BattleState
): BattleUnit[] {
  return targets.sort((a, b) => {
    const shredA = a.armorShred.shredStacks / a.armorShred.maxShred;
    const shredB = b.armorShred.shredStacks / b.armorShred.maxShred;
    
    // Prioritize targets closer to max shred (more vulnerable)
    if (shredA !== shredB) {
      return shredB - shredA;  // Higher shred = higher priority
    }
    
    // Secondary: prioritize high-armor targets for shred buildup
    return b.armorShred.baseArmor - a.armorShred.baseArmor;
  });
}

/**
 * AI decision for focus fire strategy.
 * Concentrates attacks on one tank to maximize shred.
 * 
 * @param units - Friendly units
 * @param enemies - Enemy units
 * @param state - Current battle state
 * @returns Target for focus fire
 */
function selectFocusFireTarget(
  units: BattleUnit[],
  enemies: BattleUnit[],
  state: BattleState
): BattleUnit | null {
  // Find enemy tanks
  const tanks = enemies.filter(e => e.role === 'tank' && e.hp > 0);
  
  if (tanks.length === 0) {
    return null;
  }
  
  // Select tank with most shred (closest to breaking)
  return tanks.reduce((best, tank) => {
    const bestShredRatio = best.armorShred.shredStacks / best.armorShred.maxShred;
    const tankShredRatio = tank.armorShred.shredStacks / tank.armorShred.maxShred;
    
    return tankShredRatio > bestShredRatio ? tank : best;
  });
}

/**
 * AI decision for tank rotation.
 * Swaps damaged tanks to preserve armor.
 * 
 * @param tank - Current front-line tank
 * @param reserves - Available reserve tanks
 * @param state - Current battle state
 * @returns Whether to rotate tanks
 */
function shouldRotateTank(
  tank: BattleUnit,
  reserves: BattleUnit[],
  state: BattleState
): boolean {
  // Rotate if shred is at 75%+ of max
  const shredRatio = tank.armorShred.shredStacks / tank.armorShred.maxShred;
  
  if (shredRatio < 0.75) {
    return false;
  }
  
  // Check if reserve has less shred
  const bestReserve = reserves.find(r => 
    r.armorShred.shredStacks < tank.armorShred.shredStacks * 0.5
  );
  
  return bestReserve !== null;
}
```

### Visual Feedback

```typescript
/**
 * Renders armor shred visual indicators.
 * 
 * @param unit - Unit with shred
 */
function renderArmorShredUI(unit: BattleUnit): void {
  const shred = unit.armorShred;
  const currentArmor = getCurrentArmor(unit);
  
  // Armor bar with shred indicator
  const shredPercent = shred.shredStacks / shred.baseArmor;
  
  // Draw armor bar
  drawArmorBar(unit.position, {
    current: currentArmor,
    base: shred.baseArmor,
    shredStacks: shred.shredStacks,
  });
  
  // Cracked armor icon when shredded
  if (shred.shredStacks > 0) {
    showIcon(unit.position, 'cracked_armor', shred.shredStacks.toString());
  }
  
  // Warning glow when approaching max shred
  if (shredPercent >= 0.75) {
    addWarningGlow(unit.position, 'red');
  }
}

/**
 * Animates armor shred application.
 * 
 * @param event - Shred event data
 */
function animateArmorShred(event: ArmorShredEvent): void {
  // Sparks/metal fragments particle effect
  playParticleEffect(event.targetPosition, 'metal_sparks');
  
  // Floating text showing shred
  showFloatingText(event.targetPosition, `-${event.shredAmount} Armor`, 'orange');
  
  // Sound effect
  playSound('armor_crack');
  
  // Flash armor bar
  flashElement('armor_bar', event.targetId, 'red');
}
```

### Strategic Diagrams

```
┌─────────────────────────────────────────────────────────────┐
│              FOCUS FIRE STRATEGY                             │
│                                                              │
│  Turn 1: All units attack Knight [K]                        │
│  ┌───┬───┬───┐                                              │
│  │ A │ A │ A │  3 Archers shoot Knight                      │
│  ├───┼───┼───┤                                              │
│  │ S │ K │ S │  Knight: 10 → 7 Armor (3 shred)              │
│  └───┴───┴───┘                                              │
│                                                              │
│  Turn 2: Continue focus fire                                │
│  Knight: 7 → 6 Armor (4 shred = MAX)                        │
│                                                              │
│  Turn 3+: Knight stuck at 60% armor                         │
│  Now takes 40% more damage from all attacks!                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              SWARM TACTICS (Undead)                          │
│                                                              │
│  Undead strategy: Use cheap Skeletons to shred              │
│                                                              │
│  ┌───┬───┬───┬───┬───┐                                      │
│  │ Z │ Z │ Z │ Z │ Z │  5 Zombies attack Knight             │
│  ├───┼───┼───┼───┼───┤                                      │
│  │   │   │ K │   │   │  Knight: 10 → 6 Armor (max shred)    │
│  └───┴───┴───┴───┴───┘                                      │
│                                                              │
│  Zombies die, but Knight is now vulnerable                  │
│  Grave Guard [G] finishes the softened Knight               │
│                                                              │
│  "Quantity has a quality all its own"                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              TANK ROTATION (Empire)                          │
│                                                              │
│  Empire strategy: Rotate damaged tanks                      │
│                                                              │
│  Phase 1:           Phase 2:           Phase 3:             │
│  ┌───┬───┐          ┌───┬───┐          ┌───┬───┐            │
│  │K1 │K2 │          │K2 │K1 │          │K1 │K2 │            │
│  └───┴───┘          └───┴───┘          └───┴───┘            │
│  K1: 4 shred        K1: resting        K1: 4 shred          │
│  K2: 0 shred        K2: 4 shred        K2: 4 shred          │
│                                                              │
│  By rotating, both Knights share the shred burden           │
│  Neither reaches max shred as quickly                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              SHRED vs PHALANX                                │
│                                                              │
│  Phalanx bonus is NOT affected by shred!                    │
│                                                              │
│  Knight in Phalanx:                                         │
│  - Base Armor: 10 → 6 (after max shred)                     │
│  - Phalanx Bonus: +5 (unaffected)                           │
│  - Total: 11 Armor                                          │
│                                                              │
│  Strategy: Phalanx partially counters shred                 │
│  Counter-strategy: Flank to bypass Phalanx bonus            │
└─────────────────────────────────────────────────────────────┘
```

### Faction Implications

```typescript
/**
 * Empire (High Armor) - Vulnerable to shred
 * 
 * Knights (10 Armor) → min 6 Armor after shred
 * Strategy: Rotate damaged tanks, use healing to extend lifespan
 * Vulnerability: Swarm attacks from cheap units
 */
const EMPIRE_SHRED_STRATEGY = {
  tankRotation: true,
  healingPriority: 'high_shred_units',
  counterPlay: 'kill_fast_attackers',
};

/**
 * Undead (Low Armor, High Numbers) - Shred specialists
 * 
 * Skeletons (2 Armor) → min 1 Armor after shred
 * Strategy: Use numbers to shred enemy armor
 * Advantage: Cheap units "soften" elite targets for elites
 */
const UNDEAD_SHRED_STRATEGY = {
  swarmTactics: true,
  focusFire: 'enemy_tanks',
  sacrificeFodder: true,
};
```
