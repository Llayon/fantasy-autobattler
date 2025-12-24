# Requirements: Roguelike Run Mode

## Overview

Roguelike progression mode where players complete runs with 9 wins or 4 losses, building their team through faction-based deck building, drafting, and unit upgrades.

## Major Changes from MVP

| Aspect | MVP | Roguelike Run |
|--------|-----|---------------|
| Factions | 1 (generic) | 6 factions, 25 units each (150 total) |
| Leaders | None | 18 leaders (3 per faction) with passives + spells |
| Spells | None | 2 spells per deck, timing selection |
| Deck Size | N/A | 14 cards (12 units + 2 spells) |
| Grid | 8×10 | 8×2 (landing zone only) |
| Budget | 30 fixed | 10g → 65g progression |
| Unit Tiers | None | T1 → T2 → T3 upgrades |
| Game Mode | Single battle | 9 wins / 4 losses run |
| Matchmaking | PvP queue | Async vs snapshots |

---

## Game Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      RUN START                               │
│  1. Select Faction (6 options)                              │
│  2. Select Leader (3 per faction)                           │
│  3. Initial Draft: Choose 3 from 5 random cards             │
│  Starting: 10g budget, 3 cards in hand                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BATTLE PHASE                              │
│  Place units on 8×2 grid (budget: 10g → 65g)                │
│  Select spell timing (Early/Mid/Late)                       │
│  Fight opponent snapshot (async, deterministic)             │
│  Win: +1 win, +gold reward                                  │
│  Lose: +1 loss                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DRAFT PHASE                               │
│  Choose 1 from 3 cards (add to hand)                        │
│  Hand grows: 3 → 4 → ... → 14 cards max                     │
│  Optional: Upgrade units (T1 → T2 → T3)                     │
│  Optional: Buy spells from shop                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────┴───────┐
                    │ 9 wins OR     │
                    │ 4 losses?     │
                    └───────┬───────┘
                      No    │    Yes
                      │     │     │
                      ▼     │     ▼
              [Back to Battle]  [RUN END → Rating Update]
```

---

## Requirements

### REQ-1: Faction System
**Priority**: Critical

#### REQ-1.1: Factions (6 total)
| Faction | Theme | Bonus |
|---------|-------|-------|
| Order | Knights, Paladins | +10% HP |
| Chaos | Demons, Warlocks | +15% ATK |
| Nature | Druids, Beasts | +10% Regen |
| Shadow | Assassins, Rogues | +20% Dodge |
| Arcane | Mages, Elementals | +15% Magic DMG |
| Machine | Constructs, Engineers | +15% Armor |

#### REQ-1.2: Units per Faction
- 25 units per faction (150 total)
- Mix of roles: Tank, Melee DPS, Ranged DPS, Mage, Support, Control
- Tiers: T1 (common), T2 (rare), T3 (epic)

### REQ-2: Leader System
**Priority**: Critical

#### REQ-2.1: Leader Structure
```typescript
interface Leader {
  id: string;
  name: string;
  faction: Faction;
  passive: PassiveAbility;  // Always active
  spells: Spell[];          // 2 spells to choose from
  portrait: string;
}
```

#### REQ-2.2: Leaders per Faction
- 3 leaders per faction (18 total)
- Each leader has unique passive + 2 spell options
- Leader passive affects all units

### REQ-3: Spell System
**Priority**: High

#### REQ-3.1: Spell Structure
```typescript
interface Spell {
  id: string;
  name: string;
  effect: SpellEffect;
  timing: 'early' | 'mid' | 'late';  // Player selects
  cooldown?: number;
}
```

#### REQ-3.2: Spell Timing
| Timing | Trigger |
|--------|---------|
| Early | Round 1-3 |
| Mid | Round 4-6 |
| Late | Round 7+ |

#### REQ-3.3: Deck Spells
- 2 spells per deck (from leader's options)
- Player selects timing before battle

### REQ-4: Run Entity
**Priority**: Critical

```typescript
interface Run {
  id: string;
  playerId: string;
  
  // Faction & Leader
  faction: Faction;
  leaderId: string;
  
  // Deck (14 cards max)
  deck: DeckCard[];        // 12 units + 2 spells
  hand: DeckCard[];        // Current hand (3-14)
  
  // Progress
  wins: number;            // 0-9
  losses: number;          // 0-4
  
  // Economy
  gold: number;            // Current gold
  currentBudget: number;   // Battle budget (10-65)
  
  // History
  battleHistory: BattleSnapshot[];
  
  // Status
  status: 'active' | 'won' | 'lost';
  rating: number;          // Run rating for matchmaking
  
  createdAt: Date;
  updatedAt: Date;
}

interface DeckCard {
  unitId: string;
  tier: 1 | 2 | 3;
  isSpell?: boolean;
}
```

### REQ-5: Draft System
**Priority**: Critical

#### REQ-5.1: Initial Draft
- Show 5 random cards from faction pool
- Player picks 3 cards
- Cards go to hand

#### REQ-5.2: Post-Battle Draft
- Show 3 random cards from faction pool
- Player picks 1 card
- Card added to hand
- Hand max: 14 cards

### REQ-6: Upgrade System
**Priority**: High

#### REQ-6.1: Tier Progression
| Tier | Stats | Cost |
|------|-------|------|
| T1 | Base | Free |
| T2 | +25% all stats | 5g |
| T3 | +50% all stats | 10g |

#### REQ-6.2: Upgrade Rules
- Can only upgrade cards in hand
- T1 → T2 → T3 (sequential)
- Visual indicator for tier (border color)

### REQ-7: Budget Progression
**Priority**: High

| Battle # | Budget |
|----------|--------|
| 1-2 | 10g |
| 3-4 | 20g |
| 5-6 | 35g |
| 7-8 | 50g |
| 9+ | 65g |

### REQ-8: Gold Economy
**Priority**: High

| Event | Gold |
|-------|------|
| Win | 5g + streak bonus |
| Lose | 2g |
| Win streak (3+) | +2g per streak |

### REQ-9: Grid Changes
**Priority**: High

#### REQ-9.1: Landing Zone
- Grid: 8×2 (width × height)
- Player places units in 2 rows
- Battle expands to full grid during simulation

### REQ-10: Async PvP
**Priority**: High

#### REQ-10.1: Snapshot System
- Save team snapshot after each battle
- Match against other players' snapshots
- Deterministic simulation (same seed = same result)

#### REQ-10.2: Matchmaking
- Match by: wins count + rating
- Fallback: bot opponent if no match

### REQ-11: Rating System
**Priority**: Medium

#### REQ-11.1: Run Rating
- Start: 1000
- Win: +25 (adjusted by opponent rating)
- Lose: -15 (adjusted by opponent rating)

#### REQ-11.2: Leagues
| League | Rating |
|--------|--------|
| Bronze | 0-999 |
| Silver | 1000-1499 |
| Gold | 1500-1999 |
| Platinum | 2000-2499 |
| Diamond | 2500+ |

### REQ-12: Run End Conditions
**Priority**: Critical

#### REQ-12.1: Victory (9 wins)
- Show victory screen
- Award rewards based on losses
- Update player rating

#### REQ-12.2: Defeat (4 losses)
- Show defeat screen
- Update player rating
- Offer retry option

### REQ-13: UI Requirements
**Priority**: High

#### REQ-13.1: Run Status Bar
- Wins/Losses display (9 slots)
- Current gold
- Current budget
- Leader portrait + passive

#### REQ-13.2: Faction Select Screen
- 6 faction cards with bonuses
- Leader selection (3 per faction)
- Faction lore/description

#### REQ-13.3: Draft Screen
- Card display (3 or 5 cards)
- Card details on hover
- Pick animation

#### REQ-13.4: Upgrade Shop
- Hand display with upgrade buttons
- Cost display
- Tier indicators

#### REQ-13.5: Battle Prep Screen
- 8×2 grid for placement
- Spell timing selection
- Budget indicator

---

## Success Criteria

1. Complete run flow works end-to-end
2. All 6 factions playable with unique units
3. Leader passives and spells functional
4. Draft system intuitive
5. Upgrade system balanced
6. Async PvP works reliably
7. Rating system accurate
8. Existing MVP mode still works (backward compatibility)

---

## Out of Scope (Phase 1)

- Multiple save slots
- Leaderboards UI
- Achievements
- Cosmetics/skins
- Tournament mode
- Spectator mode

---

## Dependencies

- Core extraction must be complete (REQ-1 from core-extraction spec)
- Grid system must support configurable dimensions
- Battle simulator must support spells and leader passives
