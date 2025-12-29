# Clarification: Backstab in MVP vs Core 2.0

**Question**: "Как работает бэкстаб у роги в МВП если там нет фейсинга?"

**Answer**: В текущем MVP коде **Backstab вообще не реализован**. Вместо этого у Rogue есть **Evasion** (пассивный +15% dodge).

---

## Current MVP State

### What Rogue Actually Has

```typescript
// backend/src/battle/passive.abilities.ts

export const UNIT_PASSIVE_MAP: Record<string, PassiveAbilityId> = {
  rogue: 'evasion',  // ← Rogue has EVASION, not Backstab
  berserker: 'rage',
  guardian: 'thorns',
  warlock: 'lifesteal',
};

export const PASSIVE_CONSTANTS = {
  EVASION_DODGE_BONUS: 0.15, // +15% dodge permanently
  // ... other passives
};
```

**Rogue's Current Passive**: +15% dodge (permanent)

### Why No Backstab in MVP?

1. **No Facing System** — MVP doesn't have directional combat
2. **No Attack Arcs** — Can't determine front/flank/rear attacks
3. **No Position-Based Mechanics** — All attacks are treated equally

So Backstab (which requires knowing attack direction) **cannot exist in MVP**.

---

## How Core 2.0 Solves This

### Core 2.0 Adds Facing

```typescript
// backend/src/core/mechanics/tier0/facing/facing.processor.ts

interface FacingProcessor {
  /**
   * Determines attack arc (front/flank/rear).
   */
  getAttackArc(attacker: BattleUnit, target: BattleUnit): AttackArc;
}

type AttackArc = 'front' | 'flank' | 'rear';
```

### Core 2.0 Adds Flanking

```typescript
// backend/src/core/mechanics/tier1/flanking/flanking.processor.ts

interface FlankingProcessor {
  /**
   * Calculates damage modifier based on attack arc.
   */
  getDamageModifier(arc: AttackArc): number;
}

// Results:
// - front: 1.0x damage (no bonus)
// - flank: 1.15x damage (+15%)
// - rear: 1.30x damage (+30%)
```

### MVP Adds Backstab Ability

```typescript
// backend/src/game/abilities/ability.data.ts (MVP layer)

const backstab: PassiveAbility = {
  id: 'backstab',
  name: 'Backstab',
  type: 'passive',
  trigger: 'on_attack',
  effects: [
    {
      type: 'damage_multiplier',
      condition: 'arc === "rear"',  // ← Requires Facing from Core 2.0
      value: 2.0,  // +100% damage from behind
    },
  ],
};
```

---

## How They Work Together

### Scenario: Rogue Attacks Archer from Behind

```
LAYER 1: Core 1.0 (Base Damage)
├─ damage = 10 (Rogue's ATK)

LAYER 2: Core 2.0 (Flanking Processor)
├─ arc = getAttackArc(rogue, archer)  // → 'rear'
├─ modifier = getDamageModifier('rear')  // → 1.30
├─ damage = 10 * 1.30 = 13

LAYER 3: MVP (Backstab Ability)
├─ if (arc === 'rear' && hasBackstab(rogue))
├─ damage = 13 * 2.0 = 26

Result: 26 damage (no duplication)
```

### Why No Duplication?

1. **Core 2.0 Flanking** applies to ALL units
   - Determines attack arc
   - Applies +15% (flank) or +30% (rear) damage
   - System-wide rule

2. **MVP Backstab** applies only to Rogue
   - Checks if attack is from rear
   - Applies additional +100% damage
   - Unit-specific ability

3. **They complement each other**
   - Flanking: "How does the system work?"
   - Backstab: "What can Rogue do?"

---

## Current MVP Abilities

### What Rogue Actually Has Now

```typescript
// Rogue's current passive in MVP
export const PASSIVE_CONSTANTS = {
  EVASION_DODGE_BONUS: 0.15, // +15% dodge
};

// This is applied at battle start
export function applyEvasionPassive(unit: BattleUnitWithPassives): BattleUnitWithPassives {
  // Adds +15% dodge permanently
  // No position-based logic needed
}
```

### Other MVP Passives

| Unit | Passive | Effect |
|------|---------|--------|
| **Rogue** | Evasion | +15% dodge (permanent) |
| **Berserker** | Rage | +50% ATK when HP < 50% |
| **Guardian** | Thorns | Reflects 20% of damage received |
| **Warlock** | Lifesteal | Heals 20% of damage dealt |

**None of these require Facing or directional combat.**

---

## Migration Path: MVP → Core 2.0

### Phase 1: MVP (Current)
```
Rogue: Evasion (+15% dodge)
├─ No Facing system
├─ No Attack arcs
└─ No Backstab
```

### Phase 2: Core 2.0 (New)
```
Rogue: Evasion + Backstab
├─ Facing system enabled
├─ Attack arcs determined (front/flank/rear)
├─ Flanking applies +15%/+30% damage
└─ Backstab applies additional +100% from rear
```

### How to Migrate

1. **Enable Facing** (Tier 0)
   ```typescript
   const config = {
     facing: true,  // ← Enable directional combat
     // ... other mechanics
   };
   ```

2. **Enable Flanking** (Tier 1)
   ```typescript
   const config = {
     facing: true,
     flanking: true,  // ← Enable attack arcs
     // ... other mechanics
   };
   ```

3. **Rogue Automatically Gets Backstab**
   ```typescript
   // MVP layer automatically uses Facing + Flanking
   // Backstab now works because arc is available
   if (arc === 'rear' && hasBackstab(rogue)) {
     damage *= 2.0;  // +100% from behind
   }
   ```

---

## Key Insight

**The question "How does Backstab work without Facing?" reveals the architecture perfectly:**

- **MVP Mode**: No Facing → No Backstab (only Evasion)
- **Core 2.0 Mode**: Facing enabled → Backstab works

This is exactly why Core 2.0 and MVP don't duplicate:
- **Core 2.0 provides the infrastructure** (Facing, attack arcs)
- **MVP provides the abilities** (Backstab, Evasion, etc.)
- **Together they create rich mechanics** (Backstab uses Facing)

---

## Implementation in Core 2.0

### Task: Add Backstab to Rogue

When implementing Core 2.0, Backstab will be added to MVP layer:

```typescript
// backend/src/game/abilities/ability.data.ts

const backstab: PassiveAbility = {
  id: 'backstab',
  name: 'Backstab',
  type: 'passive',
  trigger: 'on_attack',
  effects: [
    {
      type: 'damage_multiplier',
      condition: (context) => {
        // This requires Facing from Core 2.0
        const arc = context.processor?.processors.facing?.getAttackArc(
          context.attacker,
          context.target
        );
        return arc === 'rear';
      },
      value: 2.0,  // +100% damage
    },
  ],
};

// Apply in battle simulator
if (backstab.condition(context)) {
  damage *= backstab.value;  // +100% from behind
}
```

---

## Summary

| Aspect | MVP | Core 2.0 |
|--------|-----|----------|
| **Rogue Passive** | Evasion (+15% dodge) | Evasion + Backstab |
| **Facing System** | ❌ No | ✅ Yes (Tier 0) |
| **Attack Arcs** | ❌ No | ✅ Yes (Tier 1) |
| **Flanking Bonus** | ❌ No | ✅ Yes (+15%/+30%) |
| **Backstab Bonus** | ❌ No | ✅ Yes (+100% from rear) |
| **Duplication?** | N/A | ❌ No (different layers) |

---

## Conclusion

**Backstab doesn't work in MVP because there's no Facing system.**

When Core 2.0 is implemented:
1. Facing system is added (Tier 0)
2. Attack arcs are determined (Tier 1 Flanking)
3. Backstab ability can now use arc information
4. No duplication because they work on different layers

This is a perfect example of how Core 2.0 and MVP complement each other without duplicating.

