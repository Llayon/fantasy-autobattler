# Hand & Field Mechanics (Updated)

## Overview

This document clarifies the correct mechanics for the roguelike mode's hand and field system.

## Key Concepts

### Terminology

| Term | Description |
|------|-------------|
| **Deck** | 12 cards total. Fixed at run start based on faction. |
| **Remaining Deck** | Cards not yet drafted to hand. |
| **Hand** | Cards available for purchase/placement. NOT on the field. |
| **Field** | 8×2 deployment grid. Units placed here fight in battle. |
| **Gold** | Currency used to buy units from hand to field. |

### Critical Distinction: Hand ≠ Field

```
┌─────────────────────────────────────────────────────────────┐
│  HAND (Cards available for purchase)                        │
│  - Cards from draft go here                                 │
│  - NOT on the battlefield                                   │
│  - Must PAY GOLD to place on field                          │
│  - Can hold up to 12 cards                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Pay gold (unit cost)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FIELD (8×2 deployment zone)                                │
│  - Units that will fight in battle                          │
│  - Drag from hand to place (costs gold)                     │
│  - Can reposition freely (no cost)                          │
│  - Cannot sell units (only reposition)                      │
└─────────────────────────────────────────────────────────────┘
```

## Draft Flow (Corrected)

### Initial Draft (Run Start)
1. Show 5 cards from deck
2. Player picks 3 cards (FREE, no gold cost)
3. Picked cards go to **HAND** (not field!)
4. Unpicked 2 cards return to END of deck
5. Player must then BUY units from hand to place on field

### Post-Battle Draft
1. Show 3 cards from remaining deck
2. Player picks 1 card (FREE)
3. Picked card goes to **HAND**
4. Unpicked 2 cards return to END of deck

### All 12 Cards Reach Hand
- Draft only determines ORDER of receiving cards
- No cards are "burned" or lost
- Eventually all 12 cards will be in hand

## Placement Mechanics

### Buying Units (Hand → Field)
```typescript
// Cost to place unit on field = unit's gold cost
function placeUnit(hand: Card[], field: PlacedUnit[], gold: number, cardIndex: number, position: Position): Result {
  const card = hand[cardIndex];
  
  // Check if player has enough gold
  if (gold < card.cost) {
    return { error: 'Not enough gold' };
  }
  
  // Remove from hand, add to field
  const newHand = hand.filter((_, i) => i !== cardIndex);
  const newField = [...field, { ...card, position }];
  const newGold = gold - card.cost;
  
  return { hand: newHand, field: newField, gold: newGold };
}
```

### Repositioning (Free)
```typescript
// Moving unit on field is FREE
function repositionUnit(field: PlacedUnit[], fromIndex: number, newPosition: Position): PlacedUnit[] {
  return field.map((unit, i) => 
    i === fromIndex ? { ...unit, position: newPosition } : unit
  );
}
```

### No Selling
- Units cannot be sold back for gold
- Once placed, units stay on field
- Can only reposition, not remove

## UI Layout (Adapted from MVP)

The MVP TeamBuilder interface can be adapted:

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Run Status (Wins/Losses/Gold/Leader)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  FIELD (8×2 Deployment Zone)                        │    │
│  │  - Drag units here from hand                        │    │
│  │  - Shows placed units with positions                │    │
│  │  - Green highlight = valid drop zone                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  HAND (Cards from Draft)                            │    │
│  │  - Shows all cards in hand                          │    │
│  │  - Each card shows: name, stats, cost               │    │
│  │  - Drag to field to place (costs gold)              │    │
│  │  - Grayed out if not enough gold                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  FOOTER: Actions (Spell Timing, Find Opponent, etc.)        │
└─────────────────────────────────────────────────────────────┘
```

## Components to Reuse from MVP

### From `frontend/src/components/`

| Component | Reuse For | Modifications Needed |
|-----------|-----------|---------------------|
| `ResponsiveTeamBuilder.tsx` | Layout structure | Adapt for hand/field split |
| `EnhancedBattleGrid.tsx` | Field display (8×2) | Already supports compactMode |
| `UnitCard.tsx` | Hand card display | Add cost indicator, tier badge |
| `DragDropProvider.tsx` | Drag & drop | Add gold cost validation |
| `BudgetIndicator.tsx` | Gold display | Rename to GoldIndicator |

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `RoguelikeHand.tsx` | Display cards in hand with costs |
| `RoguelikeField.tsx` | 8×2 deployment grid |
| `PlacementCost.tsx` | Show cost when dragging |
| `GoldIndicator.tsx` | Current gold display |

## State Management

### Run State (Updated)

```typescript
interface RoguelikeRunState {
  // Deck management
  deck: DeckCard[];           // Full deck (12 cards)
  remainingDeck: DeckCard[];  // Cards not yet drafted
  hand: DeckCard[];           // Cards available for purchase
  
  // Field (NEW - separate from hand)
  field: PlacedUnit[];        // Units on deployment grid
  
  // Economy
  gold: number;               // Current gold
  
  // Progress
  wins: number;
  losses: number;
  status: 'active' | 'won' | 'lost';
  
  // Spells (always available)
  spells: SpellCard[];
}

interface PlacedUnit {
  instanceId: string;
  unitId: string;
  tier: 1 | 2 | 3;
  position: { x: number; y: number };
}
```

## Gold Economy (Clarified)

### Starting Gold
- Run starts with **10 gold**

### Earning Gold
- Win: +7g base + streak bonus
- Lose: +9g (catch-up mechanic)

### Spending Gold
- **Place unit on field**: Unit's cost (3-8g)
- **Upgrade unit**: Tier upgrade cost

### Example Run Economy

| Event | Gold Change | Total Gold | Hand | Field |
|-------|-------------|------------|------|-------|
| Start | +10 | 10 | 0 | 0 |
| Initial Draft | 0 | 10 | 3 | 0 |
| Place Footman (4g) | -4 | 6 | 2 | 1 |
| Place Archer (3g) | -3 | 3 | 1 | 2 |
| Battle 1 Win | +7 | 10 | 1 | 2 |
| Post-Draft | 0 | 10 | 2 | 2 |
| Place Priest (4g) | -4 | 6 | 1 | 3 |
| ... | ... | ... | ... | ... |

## Implementation Priority

### Phase 1: Core Mechanics
1. ✅ Draft service (cards to hand)
2. ✅ Separate hand from field in entity
3. ✅ Add `field` array to run state
4. ✅ Placement service (hand → field with gold cost)

### Phase 2: UI
1. ✅ Create RoguelikeBattlePage with hand/field split
2. ⬜ Adapt ResponsiveTeamBuilder layout (optional - current UI works)
3. ✅ Add gold cost validation to placement
4. ✅ Show placement cost preview

### Phase 3: Polish
1. ⬜ Animations for placement
2. ⬜ Gold change indicators
3. ⬜ Insufficient gold feedback
