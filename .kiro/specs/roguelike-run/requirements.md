# Requirements: Roguelike Run Mode

## Overview
Add roguelike progression mode where players complete runs with 9 wins or 4 losses, building their team through drafting and upgrades.

## Game Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      RUN START                               │
│  Player selects faction → Gets 12-unit deck                 │
│  Initial draft: Choose 3 from 4 random cards                │
│  Starting gold: 10g, Starting hand: 3 cards                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BATTLE PHASE                              │
│  Place units from hand (budget: 10g → 65g)                  │
│  Fight opponent (async, deterministic)                       │
│  Win: +1 win, +gold reward                                  │
│  Lose: +1 loss                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DRAFT PHASE                               │
│  Choose 1 from 3 cards (add to hand)                        │
│  Hand grows: 3 → 4 → ... → 14 cards                         │
│  Optional: Upgrade units (T1 → T2 → T3)                     │
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
              [Back to Battle]  [RUN END]
```

## Requirements

### REQ-1: Run Entity
**Priority**: Critical

```typescript
interface Run {
  id: string;
  playerId: string;
  faction: string;
  deck: string[];        // 12 unit IDs
  hand: string[];        // 3-14 unit IDs
  wins: number;          // 0-9
  losses: number;        // 0-4
  gold: number;          // Current gold
  currentBudget: number; // Battle budget (10-65)
  battleHistory: string[]; // Battle log IDs
  status: 'active' | 'won' | 'lost';
  createdAt: Date;
  updatedAt: Date;
}
```

### REQ-2: Faction System
**Priority**: High

- 3+ factions with unique unit pools
- Each faction has 12 units (mix of roles)
- Faction bonuses (e.g., +10% HP for all units)

### REQ-3: Draft System
**Priority**: Critical

#### REQ-3.1: Initial Draft
- Show 4 random cards from deck
- Player picks 3 cards
- Remaining card returns to deck

#### REQ-3.2: Post-Battle Draft
- Show 3 random cards from deck
- Player picks 1 card
- Add to hand (hand grows each battle)

### REQ-4: Upgrade System
**Priority**: High

- Units have tiers: T1 (base) → T2 → T3
- Upgrade costs gold
- T2: +20% stats, T3: +50% stats
- Visual indicator for tier

### REQ-5: Budget Progression
**Priority**: High

| Battles | Budget |
|---------|--------|
| 1-2     | 10g    |
| 3-4     | 20g    |
| 5-6     | 35g    |
| 7-8     | 50g    |
| 9+      | 65g    |

### REQ-6: Gold Economy
**Priority**: High

- Win reward: 5g + bonus for streak
- Lose reward: 2g (consolation)
- Upgrade costs: T2 = 5g, T3 = 10g

### REQ-7: Run End Conditions
**Priority**: Critical

- **Victory**: 9 wins → Rewards, stats update
- **Defeat**: 4 losses → Stats update, retry option
- Show run summary with stats

### REQ-8: Matchmaking
**Priority**: Medium

- Match against bots with similar win count
- Bot difficulty scales with player wins
- Optional: PvP matchmaking by wins

### REQ-9: UI Requirements
**Priority**: High

- Run status bar (wins/losses, gold, budget)
- Draft screen with card selection
- Upgrade shop interface
- Run history page

## Success Criteria
1. Complete run flow works end-to-end
2. Draft system is intuitive
3. Progression feels rewarding
4. Existing MVP mode still works

## Out of Scope (Phase 1)
- Multiple save slots
- Leaderboards
- Achievements
- PvP runs
