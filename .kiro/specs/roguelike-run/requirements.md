# Requirements: Roguelike Run Mode

## Overview

Roguelike progression mode where players complete runs with 9 wins or 4 losses, building their team through faction-based deck building, drafting, and unit upgrades.

## Major Changes from MVP

| Aspect | MVP | Roguelike Run |
|--------|-----|---------------|
| Factions | 1 (generic) | 6 factions, 25 units each (150 total) |
| Leaders | None | 18 leaders (3 per faction) with passives + spells |
| Spells | None | 2 spells per deck, timing selection |
| Deck | N/A | 12 units + 2 spells (faction-specific) |
| Hand | N/A | 3-12 units (grows via draft) |
| Battle Grid | 8×10 | 8×10 (same as MVP) |
| Deployment Zone | 8×2 (rows 0-1) | 8×2 (same as MVP) |
| Budget | 30 fixed | 10g start, Win +7g, Lose +8g |
| Unit Tiers | None | T1 → T2 → T3 upgrades |
| Unit Selling | Allowed | Not allowed (reposition only) |
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
│  Place units on 8×2 grid                                    │
│  Select spell timing (Early/Mid/Late)                       │
│  Fight opponent snapshot (async, deterministic)             │
│  Win: +1 win, +7g                                           │
│  Lose: +1 loss, +8g                                         │
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

#### REQ-3.2: Spell Timing (HP-Based)
Spells trigger based on team HP thresholds:

| Timing | Trigger Condition |
|--------|-------------------|
| Early | Immediately at battle start |
| Mid | When any ally drops below 70% HP |
| Late | When any ally drops below 40% HP |

Each spell triggers only once per battle when its condition is met.

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
  
  // Deck System
  deck: DeckCard[];           // Full deck: 12 units + 2 spells (fixed at run start)
  remainingDeck: DeckCard[];  // Cards not yet drafted to hand
  hand: DeckCard[];           // Units available for placement (3-12)
  spells: SpellCard[];        // 2 spells (always available)
  
  // Progress
  wins: number;               // 0-9
  losses: number;             // 0-4
  consecutiveWins: number;    // For win streak bonus
  
  // Economy
  gold: number;               // Current gold (starts at 10)
  
  // History
  battleHistory: BattleSnapshot[];
  
  // Status
  status: 'active' | 'won' | 'lost';
  rating: number;             // Run rating for matchmaking
  
  createdAt: Date;
  updatedAt: Date;
}

interface DeckCard {
  unitId: string;
  tier: 1 | 2 | 3;
}

interface SpellCard {
  spellId: string;
  timing?: 'early' | 'mid' | 'late';  // Set before battle
}
```

### REQ-5: Draft System
**Priority**: Critical

#### REQ-5.1: Deck Building (Future Feature)
Full deck building flow (unlocked via progression):
1. Player selects faction
2. Player selects leader (determines available spells)
3. Player builds deck: 12 units from 25 faction units + 2 spells from leader's 3 spells
4. Deck is saved and used for the run

#### REQ-5.2: Starter Deck (Phase 1)
For Phase 1, each faction has a pre-built balanced starter deck:
- 12 T1 units (fixed composition)
- 2 spells (from leader's options)
- Available to all players immediately
- Custom deck building unlocked via progression (future)

#### REQ-5.3: Initial Draft
- Show 5 random units from deck
- Player picks 3 units → move to hand
- Remaining deck: 9 units

#### REQ-5.4: Post-Battle Draft
- Show 3 random units from remaining deck
- Player picks 1 unit → add to hand
- Repeat after each battle until deck empty
- Hand max: 12 units (all units drafted)

#### REQ-5.5: Draft Progression
| Stage | Remaining Deck | Hand Size |
|-------|----------------|-----------|
| Start | 12 units | 0 |
| Initial Draft | 9 units | 3 |
| After Battle 1 | 8 units | 4 |
| After Battle 2 | 7 units | 5 |
| ... | ... | ... |
| After Battle 9 | 0 units | 12 |

### REQ-6: Upgrade System
**Priority**: High

#### REQ-6.1: Tier Progression (Percentage-Based)
| Tier | Stats | Upgrade Cost | Purchasable |
|------|-------|--------------|-------------|
| T1 | Base (100%) | - | ✅ Yes |
| T2 | +50% all stats | 100% of T1 cost | ❌ Upgrade only |
| T3 | +100% all stats + ability | 150% of T1 cost (rounded) | ❌ Upgrade only |

#### REQ-6.2: Upgrade Rules
- Can only upgrade cards in hand
- T1 → T2 → T3 (sequential)
- Visual indicator for tier (border color)
- T3 units gain unique abilities

### REQ-7: Gold Economy
**Priority**: High

#### REQ-7.1: Starting Gold
- Starting gold: 10g

#### REQ-7.2: Battle Rewards
| Event | Gold |
|-------|------|
| Win | +7g + streak bonus |
| Lose | +9g (catch-up mechanic) |
| Win streak (3+) | +2g per streak |

Note: Losing gives more gold (+9g) than winning (+7g) to help players catch up after losses.

#### REQ-7.3: Gold Progression Example
| Battle | Result | Gold Earned | Total Gold |
|--------|--------|-------------|------------|
| Start  | -      | 10g         | 10         |
| 1      | Win    | +7g         | 17         |
| 2      | Win    | +7g         | 24         |
| 3      | Lose   | +9g         | 33         |
| 4      | Lose   | +9g         | 42         |
| 5      | Win    | +7g         | 49         |

#### REQ-7.4: Unit Selling
- Units CANNOT be sold after purchase
- Units can only be repositioned on deployment grid
- This prevents gold manipulation exploits

### REQ-8: Grid (Same as MVP)
**Priority**: High

#### REQ-9.1: Battle Grid
- Full battle grid: 8×10 (same as MVP)
- Player deployment zone: rows 0-1 (8×2)
- Enemy deployment zone: rows 8-9 (8×2)

#### REQ-9.2: No Grid Changes Required
- Roguelike uses identical grid configuration as MVP
- No modifications to core grid system needed

### REQ-9: Async PvP
**Priority**: High

#### REQ-10.1: Snapshot System
- Save team snapshot after each battle
- Match against other players' snapshots
- Deterministic simulation (same seed = same result)

#### REQ-10.2: Matchmaking
- Match by: wins count + rating
- Fallback: bot opponent if no match

### REQ-10: Rating System
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

### REQ-11: Resolve System (Morale)
**Priority**: High

#### REQ-11.1: Resolve Bar
- Each unit has Resolve (0-100) in addition to HP
- Resolve displayed as blue bar under HP bar (purple for Undead)
- When Resolve = 0, unit enters broken state (faction-specific)

#### REQ-11.2: Resolve Damage
- **Primary Rule:** Resolve Damage = 100% of attacker's ATK
- Armor does NOT reduce Resolve damage
- Additional triggers:

| Trigger | Resolve Damage |
|---------|----------------|
| Direct Attack | -100% ATK |
| Ally Death (adjacent, 1 cell) | -15 |
| Ally Death (nearby, 3 cells) | -8 |
| Flank/Rear Attack | -12 (additional) |
| Surrounded (3+ enemies) | -20 (at turn start) |
| Terror Aura | -10/turn |

#### REQ-11.3: Resolve Recovery
| Source | Recovery |
|--------|----------|
| Base Regeneration | MAX(5, 5% Max) — living units only |
| "Rest" Multiplier | x2.5 if wasAttacked == false |
| Safe Zone (no enemies in 3 cells) | +5 |
| Kill Enemy | +10 |
| Support Aura (2 cells) | +8 |
| Rally Spell | +30 |

**Note:** Undead have Base Regeneration = 0

#### REQ-11.4: Faction Asymmetry — Humans (Retreating)
- When Resolve = 0: unit enters "Retreating" state
- Behavior: moves 1-2 cells toward own edge
- Cannot attack or use abilities
- Loses Zone of Control
- Enemies in contact get 1 free attack (hit in back)
- **Rally:** Returns to Ready when Resolve ≥ 25

#### REQ-11.5: Faction Asymmetry — Undead (Crumbling)
- When Resolve = 0: unit enters "Crumbling" state
- Does NOT retreat — continues blocking cell
- Loses 15% current HP at start of each turn
- ATK and Armor reduced by 50%
- Base Regeneration = 0 (cannot self-recover)
- **Recovery:** Only through Necromancer Aura or Spell

#### REQ-11.6: wasAttacked Flag
- Boolean flag set to true when unit receives any damage (HP or Resolve)
- Resets to false at start of unit's turn
- Used for "Rest" multiplier calculation

#### REQ-11.7: Visual Indicators
- Blue bar (Humans) / Purple bar (Undead) under HP
- Bar flashes white on Resolve damage
- "Broken Shield" icon for Retreating (Humans)
- "Skull in Mist" icon for Crumbling (Undead)

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

### REQ-14: Engagement System (Zone of Control)
**Priority**: High

#### REQ-14.1: Engagement State
- Unit is "Engaged" when adjacent to enemy (8 cells around, including diagonals)
- Engaged units cannot move normally
- Engaged units must attack the unit that engaged them
- AI target priority: Nearest > Lowest HP > Random

#### REQ-14.2: Archery Penalty
- Ranged units (range > 1) cannot shoot distant targets while Engaged
- They use weak melee attack or skip turn

#### REQ-14.3: Disengage Action
- Unit can attempt to break Engagement voluntarily
- Cost: Skip attack this turn, move only 1 cell
- Triggers Attack of Opportunity from all engaging enemies
- Attack of Opportunity deals 100% damage to HP AND Resolve

#### REQ-14.4: Disengage AI Priority
| Unit Type | Disengage Priority | Condition |
|-----------|-------------------|-----------|
| Ranged/Mage | 100% | Always try to escape melee |
| Assassin/Wolf | 70% | If higher priority target nearby |
| Blocker | 30% | If blocking stronger ally's path |

#### REQ-14.5: Unit Tags (Engagement Modifiers)

| Tag | Effect | Units |
|-----|--------|-------|
| [Incorporeal] | Ignores Engagement, passes through enemies | Wraith, Tomb Guardian |
| [Flyer] | Ignores enemies during movement, Engaged on landing | Vargheist, Griffon |
| [Skirmisher] | Can move through enemy ZoC with enough Speed | Hunter, Dire Wolf |
| [Unstoppable] | Ignores Engagement from small/medium infantry | Steam Tank, Demigryph Knight |
| [Long Reach] | Engages enemies 1 empty cell away (straight line) | Spearman, Halberdier |

#### REQ-14.6: Engagement Interaction Table

| Tag | Can be stopped? | Triggers AoO? | Pass through enemy? |
|-----|-----------------|---------------|---------------------|
| Normal | Yes (immediately) | Yes (on Disengage) | No |
| Incorporeal | No | No | Yes |
| Flyer | Only on landing | Yes (on takeoff) | Yes (by air) |
| Skirmisher | No (if has Speed) | Yes (per cell) | No |
| Unstoppable | Only by Heavy/Unstoppable | No (from infantry) | Yes (with micro-damage) |

#### REQ-14.7: Retreat Types Comparison

| Retreat Type | Cause | Distance | Consequence |
|--------------|-------|----------|-------------|
| Tactical Disengage | AI decision | 1 cell | AoO, skip attack |
| Panic Retreat | Resolve = 0 | 1-2 cells | AoO, Shaken status |
| Victory | Enemy destroyed | Free | Unit free for full turn |

### REQ-15: Flanking System
**Priority**: High

#### REQ-15.1: Unit Facing
- Each unit has a facing direction: north, south, east, west
- Facing determined by last movement or attack direction
- Front arc: 3 cells in facing direction
- Flank arc: 2 cells on each side
- Rear arc: 3 cells behind

#### REQ-15.2: Flanking Attack Definition
- Attack is "Flanking" if attacker is in target's flank or rear arc
- Flanking attacks receive combat bonuses
- Flanking is checked at moment of attack, not movement

#### REQ-15.3: Flanking Effects

| Effect | Value | Description |
|--------|-------|-------------|
| No Riposte | 100% | Target cannot counter-attack |
| Resolve Damage | +12 | Additional shock damage |
| Shield Bypass | 100% | Shield armor bonus ignored |

#### REQ-15.4: Flanking + Engagement Interaction
- If unit is Engaged from front, flanking attacks from sides/rear are devastating
- Engaged unit cannot turn to face new attackers
- Unit only turns after frontal enemy dies or Disengages

#### REQ-15.5: Tactical Implications
- **Wide Front**: Spread units in line to prevent flanking
- **Mobile Reserve**: Fast units on flanks for encirclement
- **Pincer Attack**: Engage front, strike rear

#### REQ-15.6: Visual Indicators
- Facing arrow on unit (subtle)
- "Flanked!" popup on flanking attack
- Broken shield icon when shield bypassed

### REQ-16: Riposte System (Counter-Attack)
**Priority**: High

#### REQ-16.1: Riposte Definition
- Riposte = immediate counter-attack after being hit in melee
- Only triggers on frontal attacks (not flanking)
- Only melee units can Riposte (range = 1)

#### REQ-16.2: Initiative-Based Effectiveness

| Condition | Riposte Damage | Description |
|-----------|----------------|-------------|
| Target Initiative ≥ Attacker | 100% ATK | "Master" - full counter |
| Target Initiative < Attacker | 50% ATK | "Clumsy" - weak counter |

#### REQ-16.3: Riposte Charges
- Charges per round = unit's attackCount stat
- Each Riposte consumes 1 charge
- Charges reset at start of each round
- Example: attackCount=2 → can Riposte twice per round

#### REQ-16.4: Riposte Blockers (No Counter-Attack)

| Condition | Riposte Allowed? |
|-----------|------------------|
| Flanking attack | ❌ No |
| Target HP = 0 | ❌ No |
| Target Resolve = 0 | ❌ No |
| No charges left | ❌ No |
| Ranged attacker | ❌ No (out of reach) |

#### REQ-16.5: Riposte Damage
- Deals damage to both HP and Resolve
- Uses same formula as normal attack
- Affected by attacker's armor

#### REQ-16.6: Faction Tactics

**Empire (Humans)**:
- High Initiative units (Knights, Champions) = 100% Riposte
- Strategy: Quality over quantity, dangerous to attack head-on
- T3 Ability: "Coordinated Defense" — Riposte deals +25% damage

**Undead**:
- Low Initiative units (Zombies, Skeletons) = 50% Riposte
- Strategy: Swarm to exhaust enemy Riposte charges
- Advantage: Cheap units "soak" Ripostes, elites strike freely

#### REQ-16.7: Visual Feedback
- 100% Riposte: Parry animation + spark effect
- 50% Riposte: Quick "flail" animation
- No Riposte: "!" icon (flanked) or "🔒" icon (no charges)

### REQ-17: Line of Sight System (Ranged Attack Trajectories)
**Priority**: High

#### REQ-17.1: Trajectory Types

| Type | Name | Description | Units |
|------|------|-------------|-------|
| Direct | Прямая наводка | Cannot shoot through occupied cells | Musketeer, Crossbowman, Sniper, Magic Ray |
| Arc | Навесной огонь | Can shoot over allies | Archer, Mortar, Mage (AoE spells) |

#### REQ-17.2: Direct Fire Rules
- Units with [DirectFire] tag cannot attack if any cell between them and target is occupied
- Blocked by both allies AND enemies
- Check performed along straight line (Bresenham algorithm)
- If blocked: unit skips ranged attack or moves to find clear LoS

#### REQ-17.3: Arc Fire Rules
- Units with [ArcFire] tag can shoot over any units
- Trade-off: typically lower damage or armor penetration
- No LoS check required

#### REQ-17.4: LoS Blocking Scenarios

| Scenario | Direct Fire | Arc Fire |
|----------|-------------|----------|
| Ally directly in front | ❌ Blocked | ✅ Can fire |
| Enemy directly in front | ❌ Blocked | ✅ Can fire |
| Diagonal obstruction | ✅ Can fire | ✅ Can fire |
| Empty cell corridor | ✅ Can fire | ✅ Can fire |

#### REQ-17.5: Dynamic LoS Changes
- LoS recalculated each turn
- Retreating units may block allied shooters
- Dying units open new firing lanes
- AI exploits newly opened corridors

#### REQ-17.6: AI Behavior (LoS-Aware)
- Fast units (Speed 3+) prioritize paths to unprotected ranged units
- AI identifies "corridors" (empty cells leading to shooters)
- Ranged AI attempts to reposition if LoS blocked

#### REQ-17.7: Deployment Preview (UI)
- When placing ranged unit: highlight valid firing lanes
- When placing blocker in front of ranged: show red "blocked" indicator
- Show potential enemy approach paths through corridors

#### REQ-17.8: Formation Trade-offs

| Formation | Phalanx Bonus | Ranged Effectiveness | Vulnerability |
|-----------|---------------|---------------------|---------------|
| Tight Defense | Maximum | Low (blocked LoS) | Low |
| Staggered Line | Medium | High (clear lanes) | Medium (corridors) |
| Checkerboard | Low | Maximum | High (gaps everywhere) |

#### REQ-17.9: Unit Tags for LoS

| Tag | Effect | Units |
|-----|--------|-------|
| [DirectFire] | Requires clear LoS | Musketeer, Crossbowman, Sniper |
| [ArcFire] | Ignores LoS | Archer, Mortar, Catapult |
| [MagicMissile] | Ignores LoS (homing) | Mage (single target spells) |

### REQ-18: Charge System (Cavalry Momentum)
**Priority**: High

#### REQ-18.1: Charge Activation
- Triggers when melee unit moves ≥2 cells in straight line AND ends adjacent to enemy
- Must be unobstructed path (no units blocking)
- Only units with [Cavalry] or [Charger] tag can charge

#### REQ-18.2: Charge Bonuses

| Bonus | Value | Description |
|-------|-------|-------------|
| Momentum | +20% ATK per cell moved | Distance = damage |
| Shock | -10 Resolve (instant) | Fear before impact |
| Initiative | +5 Initiative | Better Riposte chance |

#### REQ-18.3: Momentum Calculation
```
Charge Damage = Base ATK × (1 + 0.2 × cells_moved)
Example: ATK 20, moved 4 cells = 20 × 1.8 = 36 damage
```

#### REQ-18.4: Counter-Charge (Spear Wall)
- Units with [SpearWall] passive negate ALL charge bonuses
- Spearman strikes FIRST against charging unit
- Charging unit takes full damage before attacking

| Unit | Effect vs Charge |
|------|------------------|
| Spearman | Negates charge, strikes first |
| Halberdier | Negates charge, +50% damage vs cavalry |
| Pike Formation | Negates charge in 3-cell front arc |

#### REQ-18.5: Charge Interruption
- Charge stops if path crosses enemy Zone of Control
- All momentum bonuses lost on interruption
- Unit becomes Engaged at interruption point

#### REQ-18.6: AI Charge Behavior
- AI seeks longest straight-line path to target
- Prioritizes "clean paths" (no ZoC interruption)
- May use Disengage to create charge distance

#### REQ-18.7: Disengage for Charge Setup
- Cavalry can Disengage (take AoO) to gain distance
- Next turn: attempt charge with full momentum
- Risk/reward: take damage now for big hit later

#### REQ-18.8: Deployment Implications
- Players must leave "charge lanes" (empty rows)
- Dense formations prevent friendly cavalry charges
- Trade-off: Phalanx density vs cavalry effectiveness

#### REQ-18.9: Unit Tags for Charge

| Tag | Effect | Units |
|-----|--------|-------|
| [Cavalry] | Can charge, +20% ATK/cell | Knight, Demigryph, Wolf Rider |
| [Charger] | Can charge, +15% ATK/cell | Berserker, Dire Wolf |
| [SpearWall] | Negates enemy charge | Spearman, Halberdier, Pike |
| [Unstoppable] | Ignores ZoC during charge | Steam Tank, Varghulf |

#### REQ-18.10: Visual Feedback
- Charge path preview (green arrow with distance)
- Momentum counter (+20%, +40%, etc.)
- Impact animation (dust cloud, screen shake)
- "Charge Blocked!" popup when interrupted

### REQ-19: Phalanx System (Formation Depth)
**Priority**: High

#### REQ-19.1: Activation Condition
- Bonus calculated at start of each unit's turn
- Checks 3 positions: left flank, right flank, rear (based on Facing)
- Only units with [Infantry] or [Shielded] tag provide support
- Bonuses stack from multiple supporters

#### REQ-19.2: Support Bonuses

| Support Position | Armor Bonus | Resolve Bonus | Description |
|------------------|-------------|---------------|-------------|
| 1 flank (left OR right) | +2 | +5 | Shoulder support |
| 2 flanks (left AND right) | +4 | +10 | Full line formation |
| 1 rear | +1 | +15 | Depth of ranks |
| Full Phalanx (flanks + rear) | +5 | +25 | Maximum formation |

#### REQ-19.3: Phalanx vs Flanking Interaction
- Phalanx bonuses ONLY apply against frontal attacks
- Flanking attacks ignore ALL Phalanx bonuses
- This makes flanking maneuvers critical against formations

#### REQ-19.4: Faction Specializations

**Empire (Disciplined Phalanx)**:
- Focus on Armor bonuses
- Special: Officer/Hierophant in rear = 2× Resolve bonus
- Shieldwall units gain +2 additional Armor in formation

**Undead (Wall of Bones)**:
- Focus on Resolve (magical cohesion)
- Special: Damage distribution — 20% damage shared to adjacent undead
- Skeletons in formation resist crumbling longer

#### REQ-19.5: Support Check Logic
```
Left Flank:  position (x-1, y) relative to facing
Right Flank: position (x+1, y) relative to facing
Rear:        position behind unit based on facing direction
```

#### REQ-19.6: T3 Ability: Unbreakable Square
- Elite units (Greatswords, Grave Guard) can unlock
- Effect: Phalanx bonuses apply to ALL 360° attacks
- Cannot be "flanked" in traditional sense
- Still vulnerable to magic and ranged

#### REQ-19.7: Phalanx vs Other Systems

| System | Interaction |
|--------|-------------|
| Flanking | Flanking ignores Phalanx bonuses |
| Riposte | High Resolve from Phalanx = reliable Riposte |
| LoS | Dense Phalanx blocks Direct Fire shooters |
| Charge | Phalanx + SpearWall = cavalry death trap |

#### REQ-19.8: Deployment Trade-offs

| Formation | Phalanx Bonus | LoS | Charge Lanes | Vulnerability |
|-----------|---------------|-----|--------------|---------------|
| Tight Box | Maximum (+5/+25) | Blocked | None | Magic, AoE |
| Line | Medium (+4/+10) | Partial | Side lanes | Flanking |
| Checkerboard | None | Clear | Many | No formation bonus |

#### REQ-19.9: Unit Tags for Phalanx

| Tag | Effect | Units |
|-----|--------|-------|
| [Infantry] | Can provide/receive Phalanx support | Swordsman, Spearman, Skeleton |
| [Shielded] | +1 additional Armor when supporting | Shieldbearer, Grave Guard |
| [Officer] | 2× Resolve bonus to unit in front | Captain, Necromancer |
| [UnbreakableSquare] | T3 ability, 360° Phalanx | Greatswords, Black Guard |

#### REQ-19.10: Visual Feedback
- White connecting lines between supported units
- Shield icon with number (+2, +4, +5) showing Armor bonus
- Blue glow on units with full Phalanx bonus
- "Formation Broken!" popup when supporter dies

### REQ-20: Aura System (Magical Fields)
**Priority**: High

#### REQ-20.1: Aura Types

| Type | Trigger | Duration | Description |
|------|---------|----------|-------------|
| Static | Always active | Permanent | Constant effect while carrier alive |
| Pulse | Turn start | Instant | Triggers once per turn |
| Relic | On death | 2 turns | Persists after carrier dies |

#### REQ-20.2: Aura Range
- Default radius: 1-2 cells from carrier
- Affects all units in range (ally or enemy based on aura type)
- Range calculated using Manhattan distance

#### REQ-20.3: Empire Auras

| Unit | Aura Name | Range | Effect |
|------|-----------|-------|--------|
| Hierophant | Holy Light | 2 | Ghosts lose Dodge (50% → 0%) |
| Celestial Mage | Storm Front | 2 | Enemy ranged attacks -50% accuracy |
| Captain | Rally Banner | 2 | Allies +5 Resolve recovery/turn |
| Warrior Priest | Sigmar's Shield | 1 | Allies immune to Fear effects |

#### REQ-20.4: Undead Auras

| Unit | Aura Name | Range | Effect |
|------|-----------|-------|--------|
| Corpse Cart | Defiled Ground | 1 | Undead ignore Crumbling damage |
| Banshee | Icy Grave | 2 | Enemies -10 Initiative |
| Necromancer | Dark Will | 2 | Undead +8 Resolve recovery |
| Mortis Engine | Reliquary | 3 | Enemies -5 HP/turn (Relic: persists 3 turns) |

#### REQ-20.5: Aura Stacking Rules
- Same aura type: Does NOT stack (highest value wins)
- Different aura types: Stack normally
- Opposing auras: Cancel each other (Holy Light vs Dark Will)

#### REQ-20.6: Aura vs Engagement/Disengage

| Scenario | Effect |
|----------|--------|
| Retreating into Rally Banner | Rally 1 turn faster |
| Engaged on Defiled Ground | AI prioritizes Disengage (knows it can't win attrition) |
| Leaving aura range | Effect ends immediately |

#### REQ-20.7: Relic Auras (Posthumous)
- When carrier dies, aura zone remains at death position
- Duration: 2 turns (configurable per aura)
- Visual: Ghostly circle on ground
- Strategic: Sacrifice support unit to create "control point"

#### REQ-20.8: Deployment Synergies

**"Holy Triangle" (Empire)**:
```
Row 1: [S][S][ ]
Row 0: [ ][H][ ]  ← Hierophant [H] behind Swordsmen [S]
```
- Swordsmen get +Resolve from Hierophant
- Ghosts attacking them lose Dodge

**"Death Convoy" (Undead)**:
```
Row 1: [Z][C][Z]
Row 0: [Z][Z][Z]  ← Corpse Cart [C] surrounded by Zombies [Z]
```
- Zombies ignore Crumbling while in Cart's aura
- Slow but nearly invincible mass

#### REQ-20.9: AI Aura Awareness
- AI identifies aura zones before moving
- Avoids entering negative auras if possible
- Prioritizes killing aura carriers (high-value targets)
- Uses fast units to "dive" past aura zones

#### REQ-20.10: Unit Tags for Auras

| Tag | Effect | Units |
|-----|--------|-------|
| [AuraCarrier] | Has an aura ability | Hierophant, Corpse Cart, Necromancer |
| [AuraImmune] | Ignores enemy auras | Daemon Prince, Vampire Lord |
| [AuraAmplifier] | +1 range to nearby auras | Battle Standard Bearer |

#### REQ-20.11: Visual Feedback
- Colored circle on ground showing aura range
- Blue = friendly buff, Red = enemy debuff, Purple = Undead
- Pulsing animation for Pulse auras
- Fading ghost circle for Relic auras
- Icon on affected units showing active aura effects

### REQ-21: Ammunition & Cooldown System
**Priority**: High

#### REQ-21.1: Ammunition (Ranged Units)

| Unit Type | Ammo | Description |
|-----------|------|-------------|
| Archer/Bowman | 6 | Standard ranged |
| Musketeer/Crossbow | 4 | High damage, limited shots |
| Artillery | 3 | Devastating but scarce |
| Skeleton Archer | 8 | Low damage, high volume |

#### REQ-21.2: Ammo Consumption

| Action | Ammo Cost |
|--------|-----------|
| Normal ranged attack | 1 |
| Overwatch (reaction shot) | 1 |
| Volley (AoE ability) | 2 |
| Piercing Shot (ability) | 1 |

#### REQ-21.3: Out of Ammo State
- When Ammo = 0, unit switches to melee mode
- Ranged units have weak melee stats (low ATK, low Armor)
- Visual: Crossed-out arrow/bullet icon
- AI behavior: Move toward enemies for melee combat

#### REQ-21.4: Ammo Recovery

| Source | Recovery | Condition |
|--------|----------|-----------|
| Rest (skip turn) | +1 Ammo | No move, no attack |
| Supply Wagon (Empire) | +2 Ammo/turn | Within 1 cell of wagon |
| Necromancer Transfer | Convert Resolve → Ammo | Undead mages only |

#### REQ-21.5: Cooldowns (Mages)

| Spell Type | Cooldown | Description |
|------------|----------|-------------|
| Basic spell | 0 | Can cast every turn |
| Power spell | 2 turns | Strong single-target |
| Ultimate spell | 4 turns | AoE or game-changing |

#### REQ-21.6: Cooldown Mechanics
- Cooldown starts AFTER spell is cast
- Cooldown reduces by 1 at start of mage's turn
- Mage can use basic attack while spells on cooldown
- Some abilities reduce cooldowns (Chronomancer)

#### REQ-21.7: T3 Abilities (Ammo/Cooldown)

| Unit | Ability | Effect |
|------|---------|--------|
| Musketeer T3 | Conserve Ammo | Kill shot doesn't consume ammo |
| Fire Mage T3 | Burnout | Can cast at 0 mana, takes self-damage |
| Skeleton Archer | Endless Quiver | +2 Ammo capacity, -20% damage |
| Artillery T3 | Rapid Reload | -1 cooldown on all abilities |

#### REQ-21.8: AI Ammo Management
- AI prioritizes high-value targets (don't waste ammo on fodder)
- AI considers ammo before using Overwatch
- AI retreats ranged units when low on ammo (if safe)
- AI uses Rest action when no good targets available

#### REQ-21.9: Strategic Implications

| Strategy | Description |
|----------|-------------|
| Ammo Drain | Use cheap units to absorb enemy shots |
| Phalanx Outlast | Dense formation tanks shots until enemy runs dry |
| Supply Line | Protect Supply Wagon to sustain ranged fire |
| Burst Window | Save ammo for critical moment |

#### REQ-21.10: Overwatch Interaction
- Overwatch consumes ammo on trigger
- Risk: May waste last shot on low-priority target
- AI evaluates threat before committing Overwatch

#### REQ-21.11: Visual Feedback
- Ammo counter on unit (bullets/arrows icon with number)
- Cooldown timer on spell icons (circular countdown)
- "Out of Ammo!" popup when depleted
- "Reloading..." status when using Rest
- Red highlight on spells on cooldown

### REQ-22: Overwatch & Intercept System
**Priority**: High

#### REQ-22.1: Vigilance State (Бдительность)
- Unit enters "Vigilance" state automatically if it did NOT move during its turn
- Visual: "Eye" or shield icon above unit
- Duration: Until start of unit's next turn
- Cancellation: Any forced movement (Retreat, knockback) removes Vigilance

#### REQ-22.2: Ranged Overwatch (Стрелковый перехват)

| Aspect | Description |
|--------|-------------|
| Applies to | Units with range > 1 (Archers, Musketeers, Mages) |
| Trigger | Enemy moves within Line of Sight |
| Effect | Immediate out-of-turn ranged attack |
| Suppression | If damage dealt, target loses 1 Speed for current turn |
| Limit | 1 Overwatch shot per round (consumes 1 Ammo) |

#### REQ-22.3: Melee Intercept Types

| Type | Units | Effect | Stops Movement? |
|------|-------|--------|-----------------|
| Hard Intercept | Spearman, Halberdier, Pike | Strike BEFORE enemy attacks | ✅ Yes (immediately) |
| Soft Intercept | Swordsman, Zombie, Infantry | Strike + apply Engaged | ❌ No (enemy continues) |
| Counter-Charge | Cavalry, Knights | Strike during enemy approach | ❌ No (100% damage) |
| None | Ranged, Mages | Cannot intercept in melee | ❌ N/A |

#### REQ-22.4: Hard Intercept (Spearmen)
- Trigger: Enemy enters cell adjacent to spearman OR passes through Zone of Control
- Effect: Spearman strikes FIRST, before enemy can attack
- Movement Stop: Enemy movement immediately halts at current cell
- Charge Nullification: ALL Charge bonuses are cancelled
- Resolve Damage: Additional -10 Resolve (shock from unexpected attack)

#### REQ-22.5: Soft Intercept (Infantry)
- Trigger: Enemy enters Zone of Control
- Effect: Free attack (50% damage for heavy infantry, 100% for cavalry)
- No Movement Stop: Enemy can continue if Speed remains
- Engaged Status: Target becomes Engaged with intercepting unit
- Resolve Damage: Additional -10 Resolve

#### REQ-22.6: Intercept vs Charge Interaction

| Scenario | Result |
|----------|--------|
| Cavalry charges Spearman (Vigilant) | Spearman strikes first, Charge cancelled, cavalry stops |
| Cavalry charges Swordsman (Vigilant) | Swordsman strikes (50%), cavalry continues with Charge |
| Cavalry charges Spearman (moved) | No intercept, Charge succeeds |
| Infantry charges Spearman (Vigilant) | Spearman strikes first, infantry stops |

#### REQ-22.7: Overwatch vs Ammunition

| Scenario | Effect |
|----------|--------|
| Overwatch triggers | -1 Ammo |
| Out of Ammo | Cannot Overwatch |
| Multiple enemies move | Only first triggers Overwatch |
| Low-value target triggers | Ammo "wasted" on fodder |

#### REQ-22.8: AI Overwatch Behavior
- AI evaluates threat level before committing Overwatch
- Prioritizes high-value targets (cavalry, elites)
- May hold Overwatch if expecting better target
- Sacrifices cheap units (Zombies) to "drain" enemy Overwatch

#### REQ-22.9: AI Intercept Avoidance
- AI identifies Vigilant spearmen before moving
- Seeks paths that avoid Hard Intercept zones
- May sacrifice fodder to "absorb" intercepts
- Fast units attempt to bypass spearman flanks

#### REQ-22.10: Undead Special: Sticky Intercept
- Skeleton Pikemen (T3): On intercept, immediately apply Engaged status
- Effect: Enemy "stuck in bone swamp" even without stopping
- Tactical: Creates "tar pit" zones that slow enemy advance

#### REQ-22.11: Unit Tags for Intercept

| Tag | Effect | Units |
|-----|--------|-------|
| [SpearWall] | Hard Intercept (stops movement) | Spearman, Halberdier, Pike |
| [HeavyInfantry] | Soft Intercept (50% damage) | Swordsman, Shieldbearer |
| [Cavalry] | Counter-Charge (100% damage, no stop) | Knight, Demigryph |
| [Skirmisher] | Ignores Soft Intercept | Hunter, Dire Wolf |
| [Unstoppable] | Ignores Hard Intercept from infantry | Steam Tank, Varghulf |

#### REQ-22.12: Intercept vs Other Systems

| System | Interaction |
|--------|-------------|
| Engagement | Soft Intercept applies Engaged status |
| Charge | Hard Intercept cancels ALL Charge bonuses |
| Flanking | Intercept from flank/rear = no counter-attack |
| Resolve | All intercepts deal -10 Resolve (shock) |
| Phalanx | Spearmen in Phalanx = overlapping intercept zones |
| LoS | Overwatch requires clear Line of Sight |
| Ammunition | Overwatch consumes 1 Ammo |

#### REQ-22.13: Movement Control Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                    MOVEMENT CONTROL CYCLE                    │
│                                                              │
│  INTERCEPT ──────► ENGAGEMENT ──────► ATTACK OF OPPORTUNITY │
│  (entering ZoC)    (in contact)       (leaving ZoC)         │
│                                                              │
│  "Punish approach"  "Lock in place"   "Punish retreat"      │
└─────────────────────────────────────────────────────────────┘
```

#### REQ-22.14: Strategic Implications

| Strategy | Description |
|----------|-------------|
| Kill Zone | Staggered Vigilant archers create overlapping Overwatch |
| Spear Wall | Line of Vigilant spearmen = impassable for cavalry |
| Fodder Drain | Sacrifice cheap units to trigger enemy intercepts |
| Flank Bypass | Fast units go around spearmen to avoid Hard Intercept |
| Suppression Fire | Overwatch reduces enemy Speed, slowing advance |

#### REQ-22.15: Visual Feedback
- "Eye" icon above Vigilant units
- Red zone highlight showing intercept coverage
- "Intercepted!" popup when triggered
- "Stopped!" popup for Hard Intercept
- "Suppressed!" popup when Speed reduced
- Dotted line showing Overwatch firing arc

### REQ-23: Contagion System (Effect Spreading)
**Priority**: High

#### REQ-23.1: Core Concept
- Some status effects can spread to adjacent units
- Creates direct counter to Phalanx formations
- Denser formations = higher spread risk
- Forces tactical choice: formation bonuses vs spread vulnerability

#### REQ-23.2: Contagion Types

| Type | Spread Chance | Damage/Turn | Duration | Source |
|------|---------------|-------------|----------|--------|
| Fire | 50% | 8 HP | 3 turns | Fire Mage, Fireball |
| Poison | 30% | 5 HP | 5 turns | Ghoul, Plague Bearer |
| Curse | 40% | 0 HP, -20% ATK | 4 turns | Warlock, Necromancer |
| Frost | 25% | 3 HP, -1 Speed | 3 turns | Ice Mage, Banshee |
| Plague | 60% | 10 HP | 2 turns | Mortis Engine (Undead) |

#### REQ-23.3: Spread Mechanics
- Spread check occurs at START of infected unit's turn
- Checks all 4 orthogonal neighbors (not diagonals)
- Each neighbor rolls independently
- Same effect doesn't stack (refreshes duration instead)
- Spread can chain: A→B→C over multiple turns

#### REQ-23.4: Spread Direction Rules

| Formation | Spread Pattern | Risk Level |
|-----------|----------------|------------|
| Tight Phalanx (4 neighbors) | All directions | Critical |
| Line Formation (2 neighbors) | Left/Right only | Medium |
| Checkerboard (0 neighbors) | No spread | Safe |
| Staggered (1 neighbor) | Single direction | Low |

#### REQ-23.5: Contagion vs Phalanx Trade-off

```
┌─────────────────────────────────────────────────────────────┐
│                    FORMATION DILEMMA                         │
│                                                              │
│  TIGHT PHALANX:                 SPREAD FORMATION:           │
│  [S][S][S]                      [S][ ][S][ ][S]              │
│  [S][S][S]  ← +5 Armor          [ ][S][ ][S][ ]  ← +0 Armor  │
│  [S][S][S]    +25 Resolve       [S][ ][S][ ][S]    +0 Resolve│
│                                                              │
│  Fire hits center:              Fire hits center:            │
│  → 8 units at risk              → 0 units at risk            │
│  → Potential 40+ HP/turn        → Only 8 HP/turn             │
└─────────────────────────────────────────────────────────────┘
```

#### REQ-23.6: Faction-Specific Effects

**Empire (Vulnerable to Fire)**:
- Wooden shields catch fire easily
- Fire spread +10% in Empire formations
- Counter: Priest "Purify" removes all contagions in 2-cell radius

**Undead (Spreaders of Plague)**:
- Immune to Poison (already dead)
- Ghouls apply Poison on melee attack
- Plague Bearer: On death, applies Plague to all adjacent units
- Mortis Engine aura: Enemies in range get Plague (60% spread)

#### REQ-23.7: Contagion Immunity

| Tag | Effect | Units |
|-----|--------|-------|
| [FireImmune] | Cannot catch or spread Fire | Fire Elemental, Daemon |
| [PoisonImmune] | Cannot catch or spread Poison | Undead, Construct |
| [CurseImmune] | Cannot catch or spread Curse | Priest, Paladin |
| [Purifier] | Adjacent allies immune to contagion | Warrior Priest, Hierophant |

#### REQ-23.8: Contagion Removal

| Method | Effect | Cooldown |
|--------|--------|----------|
| Priest "Purify" | Remove all contagions, 2-cell radius | 3 turns |
| Rest (skip turn) | 50% chance to remove 1 contagion | - |
| Water terrain | Fire extinguished immediately | - |
| Holy Ground (aura) | Contagions cannot spread | - |

#### REQ-23.9: Resolve Interaction
- Burning/Poisoned units lose -5 Resolve/turn (additional)
- Cursed units have -10 max Resolve
- Watching ally burn: -3 Resolve to adjacent allies

#### REQ-23.10: AI Contagion Behavior

**Offensive AI**:
- Prioritizes targets in dense formations for Fire/Plague
- Aims AoE at formation centers
- Sacrifices Plague Bearers in enemy formations

**Defensive AI**:
- Spreads formation when contagion detected
- Prioritizes killing contagion sources
- Moves Purifiers toward infected clusters

#### REQ-23.11: Chain Reaction Scenarios

```
Turn 1: Fire Mage hits [A]
        [A]🔥[B][C]
        
Turn 2: Fire spreads to [B] (50% roll success)
        [A]🔥[B]🔥[C]
        
Turn 3: Fire spreads to [C] (50% roll success)
        [A]🔥[B]🔥[C]🔥
        
Result: 1 spell → 3 units burning → 24 HP/turn total
```

#### REQ-23.12: Contagion vs Other Systems

| System | Interaction |
|--------|-------------|
| Phalanx | Dense formation = high spread risk (direct counter) |
| Engagement | Engaged units can't move to avoid spread |
| Aura | Some auras block spread (Holy Ground) |
| Resolve | Contagion causes additional Resolve damage |
| Charge | Cavalry can "deliver" contagion deep into enemy lines |

#### REQ-23.13: Unit Tags for Contagion

| Tag | Effect | Units |
|-----|--------|-------|
| [Contagious] | Applies effect on melee attack | Ghoul, Plague Bearer |
| [DeathSpread] | On death, spreads effect to adjacent | Plague Bearer, Fire Elemental |
| [Purifier] | Blocks spread in aura range | Priest, Warrior Priest |
| [Carrier] | Immune to effect but can spread it | Corpse Cart |

#### REQ-23.14: Visual Feedback
- Fire: Orange flames particle effect, crackling sound
- Poison: Green bubbles, sickly glow
- Curse: Purple wisps, dark aura
- Frost: Blue crystals, slow movement animation
- Spread event: Arrow showing direction of spread
- "Spread!" popup when contagion jumps to new unit
- Pulsing warning on units at risk of catching contagion

### REQ-24: Armor Shred System (Взлом брони)
**Priority**: High

#### REQ-24.1: Core Concept
- Each physical attack reduces target's Armor by 1 point
- Armor reduction persists until end of battle
- Maximum reduction: 40% of unit's base Armor
- Makes prolonged battles dynamic — tanks become vulnerable over time

#### REQ-24.2: Shred Mechanics

| Aspect | Value | Description |
|--------|-------|-------------|
| Shred per attack | -1 Armor | Each physical hit |
| Maximum shred | 40% base Armor | Cannot reduce below 60% |
| Duration | Until battle end | Permanent for this battle |
| Applies to | Physical attacks only | Magic ignores armor anyway |

#### REQ-24.3: Shred Calculation
```
Current Armor = Base Armor - Shred Stacks
Minimum Armor = Base Armor × 0.6 (60%)
Shred Stacks = min(attacks_received, floor(Base Armor × 0.4))

Example: Knight with 10 Armor
- After 2 attacks: 10 - 2 = 8 Armor
- After 4 attacks: 10 - 4 = 6 Armor (max shred reached)
- Cannot go below 6 Armor (60% of 10)
```

#### REQ-24.4: Multi-Attack Interaction
- Each attack in attackCount applies shred separately
- Unit with attackCount=3 applies 3 shred stacks per turn
- Fast attackers (Assassins, Wolves) are effective armor shredders

#### REQ-24.5: Faction Implications

**Empire (High Armor)**:
- Knights (10 Armor) → min 6 Armor after shred
- Strategy: Rotate damaged tanks, use healing to extend lifespan
- Vulnerability: Swarm attacks from cheap units

**Undead (Low Armor, High Numbers)**:
- Skeletons (2 Armor) → min 1.2 → 1 Armor after shred
- Strategy: Use numbers to shred enemy armor
- Advantage: Cheap units "soften" elite targets for elites

#### REQ-24.6: Shred vs Other Systems

| System | Interaction |
|--------|-------------|
| Phalanx | Phalanx Armor bonus NOT affected by shred (only base) |
| Riposte | Riposte attacks also apply shred |
| Charge | Charge attacks apply shred normally |
| Intercept | Intercept attacks apply shred |
| Contagion | Fire damage does NOT apply shred (magic) |

#### REQ-24.7: Shred Immunity

| Tag | Effect | Units |
|-----|--------|-------|
| [Ethereal] | Immune to shred (no physical armor) | Wraith, Ghost |
| [Regenerating] | Recovers 1 shred stack per turn | Troll, Hydra |
| [AdamantineArmor] | Shred cap reduced to 20% | Steam Tank, Ironclad |

#### REQ-24.8: T3 Abilities (Shred-Related)

| Unit | Ability | Effect |
|------|---------|--------|
| Assassin T3 | Armor Piercer | +2 shred per attack |
| Berserker T3 | Rending Blows | Shred cap increased to 60% |
| Blacksmith (Support) | Field Repairs | Remove 2 shred stacks from adjacent ally |
| Grave Guard T3 | Cursed Blades | Shred also reduces Resolve recovery by 2 |

#### REQ-24.9: Strategic Implications

| Strategy | Description |
|----------|-------------|
| Focus Fire | Concentrate attacks on one tank to maximize shred |
| Swarm Tactics | Use cheap units to shred, elites to kill |
| Tank Rotation | Swap damaged tanks to preserve armor |
| Attrition War | Prolonged battles favor shred-heavy armies |
| Burst Damage | Kill before shred matters (anti-shred strategy) |

#### REQ-24.10: AI Shred Behavior

**Offensive AI**:
- Prioritizes attacking already-shredded targets
- Uses multi-attack units against high-armor targets
- Tracks shred stacks to identify "softened" targets

**Defensive AI**:
- Rotates damaged tanks when possible
- Prioritizes healing/repairing high-shred units
- Retreats heavily shredded tanks to safety

#### REQ-24.11: Visual Feedback
- Cracked armor icon with number showing shred stacks
- Armor bar shows current vs base armor (darker section = shredded)
- "Armor Shredded!" popup on each shred application
- Red warning when approaching max shred (40%)
- Sparks/metal fragments particle effect on shred

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
9. Resolve system creates meaningful tactical decisions
10. Engagement system creates stable front lines
11. Flanking rewards positioning and maneuver
12. Riposte makes Initiative valuable for defense
13. LoS system creates formation trade-offs (Phalanx vs Fire lanes)
14. Charge system rewards open formations and punishes dense packing
15. Phalanx system rewards tight formations but conflicts with LoS/Charge
16. Aura system creates territorial control and synergy clusters
17. Ammunition/Cooldown system creates resource management and attrition warfare
18. Overwatch/Intercept system creates "kill zones" and punishes reckless movement
19. Contagion system creates formation dilemma (Phalanx bonuses vs spread vulnerability)
20. Armor Shred system creates attrition warfare and rewards focus fire tactics

---

## Out of Scope (Phase 1)

- Multiple save slots
- Leaderboards UI
- Achievements
- Cosmetics/skins
- Tournament mode
- Spectator mode
- Custom deck building (starter decks only)
- Synergy system adaptation (will use MVP synergies initially, adapt later)

---

## Dependencies

- Core extraction must be complete (REQ-1 from core-extraction spec)
- Grid system must support configurable dimensions
- Battle simulator must support spells and leader passives
