# Roguelike Units - Phase 1

## Phase 1 Scope
- 2 factions: Humans and Undead
- 12 unique T1 units per faction (purchasable)
- Each T1 unit has T2 and T3 upgrade versions (not purchasable)
- 1 leader per faction
- 2 spells per faction

## Unit Structure

```typescript
interface FactionUnit {
  id: string;
  name: string;
  faction: 'humans' | 'undead';
  role: 'tank' | 'melee_dps' | 'ranged_dps' | 'mage' | 'support';
  tier: 1 | 2 | 3;
  cost: number;           // T1 purchase cost (3-8g)
  upgradeCost?: number;   // Cost to upgrade to this tier
  purchasable: boolean;   // Only T1 can be purchased
  
  // Stats
  hp: number;
  atk: number;
  armor: number;
  speed: number;
  initiative: number;
  range: number;
  attackCount: number;
  dodge: number;
  
  // Resolve (Morale)
  resolve: number;        // Base max resolve (40-100)
  resolveResist: number;  // % resistance to resolve damage (0-50%)
  resolveTrait?: ResolveTrait;  // Special trait (steadfast, inspiring, etc.)
  
  ability?: string;       // T3 units have unique abilities
}

type ResolveTrait = 'steadfast' | 'stubborn' | 'cold_blooded' | 'fearless' | 'inspiring';
```

## Upgrade System

| Tier | Stats | Upgrade Cost | Purchasable | Ability | Resolve Bonus |
|------|-------|--------------|-------------|---------|---------------|
| T1 | Base (100%) | - | ✅ Yes | No | Base |
| T2 | +50% stats | 100% of T1 cost | ❌ No (upgrade only) | No | +15 max, +10% resist |
| T3 | +100% stats | 150% of T1 cost (rounded) | ❌ No (upgrade only) | ✅ Yes | +15 max, +10% resist |

**Пример для Swordsman (T1 cost: 3g):**
- T1 Swordsman: HP 65, ATK 18 — покупается за 3g
- T2 Veteran Swordsman: HP 97, ATK 27 (+50%) — апгрейд за 3g (100%)
- T3 Elite Swordsman: HP 130, ATK 36 (+100%) + Cleave ability — апгрейд за 5g (150%, округлено)

**Общая стоимость T3 юнита:** 3g (покупка) + 3g (T2) + 5g (T3) = 11g

---

## Humans Faction

**Faction Bonus**: +10% HP to all units

**Theme**: Balanced, defensive, organized military

### Leader

| Leader | Passive | Spells |
|--------|---------|--------|
| **Commander Aldric** | Formation: Adjacent allies gain +5 armor | Holy Light, Rally |

### Spells

| Spell | Effect | Best Timing |
|-------|--------|-------------|
| **Holy Light** | Heal lowest HP ally for 30 HP | Mid/Late |
| **Rally** | All allies gain +15% ATK for 3 rounds | Early |

### Units (12 T1 + upgrades)

#### Tanks (3)

**Footman Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Footman | 3g | 100 | 12 | 20 | 2 | 8 | 1 | 1 | 5% | 80 | - |
| T2 | Veteran Footman | +3g | 150 | 18 | 30 | 2 | 8 | 1 | 1 | 5% | 95 | - |
| T3 | Shield Master | +5g | 200 | 24 | 40 | 2 | 8 | 1 | 1 | 5% | 100 | **Shield Wall**: +50% armor for 2 turns |

**Knight Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Knight | 5g | 140 | 16 | 28 | 2 | 10 | 1 | 1 | 8% | 85 | - |
| T2 | Veteran Knight | +5g | 210 | 24 | 42 | 2 | 10 | 1 | 1 | 8% | 100 | - |
| T3 | Royal Guard | +8g | 280 | 32 | 56 | 2 | 10 | 1 | 1 | 8% | 100 | **Taunt**: Force enemies to attack this unit |

**Paladin Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Paladin | 7g | 200 | 22 | 40 | 2 | 12 | 1 | 1 | 10% | 90 | - |
| T2 | Veteran Paladin | +7g | 300 | 33 | 60 | 2 | 12 | 1 | 1 | 10% | 100 | - |
| T3 | Grand Paladin | +11g | 400 | 44 | 80 | 2 | 12 | 1 | 1 | 10% | 100 | **Divine Shield**: Immune to damage for 1 turn |

#### Melee DPS (3)

**Swordsman Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Swordsman | 3g | 65 | 18 | 8 | 3 | 12 | 1 | 1 | 10% | 60 | - |
| T2 | Veteran Swordsman | +3g | 97 | 27 | 12 | 3 | 12 | 1 | 1 | 10% | 75 | - |
| T3 | Blade Master | +5g | 130 | 36 | 16 | 3 | 12 | 1 | 1 | 10% | 90 | **Cleave**: Attack hits adjacent enemies |

**Crusader Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Crusader | 5g | 85 | 26 | 12 | 3 | 15 | 1 | 1 | 12% | 75 | - |
| T2 | Veteran Crusader | +5g | 127 | 39 | 18 | 3 | 15 | 1 | 1 | 12% | 90 | - |
| T3 | Holy Crusader | +8g | 170 | 52 | 24 | 3 | 15 | 1 | 1 | 12% | 100 | **Zealous Strike**: +50% damage to low HP enemies |

**Champion Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Champion | 8g | 110 | 38 | 16 | 3 | 18 | 1 | 2 | 15% | 80 | - |
| T2 | Veteran Champion | +8g | 165 | 57 | 24 | 3 | 18 | 1 | 2 | 15% | 95 | - |
| T3 | Grand Champion | +12g | 220 | 76 | 32 | 3 | 18 | 1 | 2 | 15% | 100 | **Whirlwind**: Attack all adjacent enemies |

#### Ranged DPS (3)

**Archer Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Archer | 4g | 50 | 16 | 4 | 2 | 14 | 4 | 1 | 8% | 55 | - |
| T2 | Veteran Archer | +4g | 75 | 24 | 6 | 2 | 14 | 4 | 1 | 8% | 70 | - |
| T3 | Longbowman | +6g | 100 | 32 | 8 | 2 | 14 | 5 | 1 | 8% | 85 | **Volley**: AoE attack in 2-cell radius |

**Crossbowman Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Crossbowman | 6g | 65 | 24 | 6 | 2 | 16 | 5 | 1 | 10% | 65 | - |
| T2 | Veteran Crossbowman | +6g | 97 | 36 | 9 | 2 | 16 | 5 | 1 | 10% | 80 | - |
| T3 | Siege Crossbowman | +9g | 130 | 48 | 12 | 2 | 16 | 6 | 1 | 10% | 95 | **Piercing Shot**: Ignores 50% armor |

**Marksman Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Marksman | 8g | 80 | 35 | 8 | 2 | 20 | 6 | 1 | 12% | 70 | - |
| T2 | Veteran Marksman | +8g | 120 | 52 | 12 | 2 | 20 | 6 | 1 | 12% | 85 | - |
| T3 | Sniper | +12g | 160 | 70 | 16 | 2 | 20 | 7 | 1 | 12% | 100 | **Headshot**: 25% chance for double damage |

#### Mages (2)

**Apprentice Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Apprentice | 4g | 45 | 20 | 2 | 2 | 10 | 3 | 1 | 5% | 50 | - |
| T2 | Mage | +4g | 67 | 30 | 3 | 2 | 10 | 3 | 1 | 5% | 65 | - |
| T3 | Archmage | +6g | 90 | 40 | 4 | 2 | 10 | 4 | 1 | 5% | 80 | **Fireball**: AoE magic damage |

**Battle Mage Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Battle Mage | 6g | 60 | 32 | 4 | 2 | 13 | 4 | 1 | 8% | 65 | - |
| T2 | War Mage | +6g | 90 | 48 | 6 | 2 | 13 | 4 | 1 | 8% | 80 | - |
| T3 | Battlemage Lord | +9g | 120 | 64 | 8 | 2 | 13 | 5 | 1 | 8% | 95 | **Chain Lightning**: Hits 3 enemies |

#### Support (1)

**Priest Line** *(Has Support Aura: +8 Resolve/turn to allies within 2 cells)*
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Priest | 5g | 55 | 10 | 6 | 2 | 6 | 3 | 1 | 5% | 70 | Support Aura |
| T2 | High Priest | +5g | 82 | 15 | 9 | 2 | 6 | 3 | 1 | 5% | 85 | Support Aura |
| T3 | Archbishop | +8g | 110 | 20 | 12 | 2 | 6 | 4 | 1 | 5% | 100 | **Mass Heal**: Heal all allies for 20 HP + Support Aura |

---

## Undead Faction

**Faction Bonus**: +15% ATK to all units

**Theme**: Aggressive, high damage, life steal, swarm

### Leader

| Leader | Passive | Spells |
|--------|---------|--------|
| **Lich King Malachar** | Life Drain: Units heal 10% of damage dealt | Death Coil, Raise Dead |

### Spells

| Spell | Effect | Best Timing |
|-------|--------|-------------|
| **Death Coil** | Deal 40 damage to enemy, heal caster for 20 | Mid |
| **Raise Dead** | Summon 2 Skeleton Warriors (T1) | Late |

### Units (12 T1 + upgrades)

#### Tanks (3)

**Zombie Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Zombie | 3g | 120 | 10 | 12 | 1 | 4 | 1 | 1 | 0% | 100 | - |
| T2 | Bloated Zombie | +3g | 180 | 15 | 18 | 1 | 4 | 1 | 1 | 0% | 100 | - |
| T3 | Plague Zombie | +5g | 240 | 20 | 24 | 1 | 4 | 1 | 1 | 0% | 100 | **Plague**: On death, poison nearby enemies |

**Abomination Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Abomination | 5g | 170 | 14 | 18 | 1 | 5 | 1 | 1 | 0% | 100 | - |
| T2 | Greater Abomination | +5g | 255 | 21 | 27 | 1 | 5 | 1 | 1 | 0% | 100 | - |
| T3 | Flesh Titan | +8g | 340 | 28 | 36 | 1 | 5 | 1 | 1 | 0% | 100 | **Hook**: Pull enemy to melee range |

**Bone Golem Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Bone Golem | 7g | 240 | 20 | 25 | 1 | 6 | 1 | 1 | 0% | 100 | - |
| T2 | Greater Bone Golem | +7g | 360 | 30 | 37 | 1 | 6 | 1 | 1 | 0% | 100 | - |
| T3 | Bone Colossus | +11g | 480 | 40 | 50 | 1 | 6 | 1 | 1 | 0% | 100 | **Bone Armor**: Regenerate 5% HP per turn |

#### Melee DPS (3)

**Skeleton Warrior Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Skeleton Warrior | 3g | 50 | 20 | 5 | 3 | 14 | 1 | 1 | 15% | 100 | - |
| T2 | Skeleton Champion | +3g | 75 | 30 | 7 | 3 | 14 | 1 | 1 | 15% | 100 | - |
| T3 | Bone Lord | +5g | 100 | 40 | 10 | 3 | 14 | 1 | 1 | 15% | 100 | **Bone Spear**: Ranged attack (range 3) |

**Ghoul Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Ghoul | 5g | 70 | 30 | 8 | 4 | 18 | 1 | 2 | 18% | 100 | - |
| T2 | Crypt Ghoul | +5g | 105 | 45 | 12 | 4 | 18 | 1 | 2 | 18% | 100 | - |
| T3 | Ghoul King | +8g | 140 | 60 | 16 | 4 | 18 | 1 | 3 | 18% | 100 | **Frenzy**: 3 attacks, +20% speed |

**Death Knight Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Death Knight | 8g | 95 | 45 | 14 | 3 | 20 | 1 | 2 | 20% | 100 | - |
| T2 | Doom Knight | +8g | 142 | 67 | 21 | 3 | 20 | 1 | 2 | 20% | 100 | - |
| T3 | Horseman of Death | +12g | 190 | 90 | 28 | 3 | 20 | 1 | 2 | 20% | 100 | **Death Strike**: Execute enemies below 20% HP |

#### Ranged DPS (3)

**Skeleton Archer Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Skeleton Archer | 4g | 40 | 18 | 2 | 2 | 12 | 4 | 1 | 12% | 100 | - |
| T2 | Skeleton Marksman | +4g | 60 | 27 | 3 | 2 | 12 | 4 | 1 | 12% | 100 | - |
| T3 | Bone Sniper | +6g | 80 | 36 | 4 | 2 | 12 | 5 | 1 | 12% | 100 | **Poison Arrow**: Apply poison (5% HP/turn) |

**Banshee Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Banshee | 6g | 55 | 28 | 3 | 2 | 15 | 4 | 1 | 20% | 100 | - |
| T2 | Wailing Banshee | +6g | 82 | 42 | 4 | 2 | 15 | 4 | 1 | 20% | 100 | - |
| T3 | Banshee Queen | +9g | 110 | 56 | 6 | 2 | 15 | 5 | 1 | 20% | 100 | **Wail of Terror**: -30 Resolve to all enemies |

**Lich Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Lich | 8g | 70 | 42 | 5 | 2 | 18 | 5 | 1 | 15% | 100 | - |
| T2 | Elder Lich | +8g | 105 | 63 | 7 | 2 | 18 | 5 | 1 | 15% | 100 | - |
| T3 | Archlich | +12g | 140 | 84 | 10 | 2 | 18 | 6 | 1 | 15% | 100 | **Frost Nova**: AoE damage + slow |

#### Mages (2)

**Necromancer Line** *(Has Support Aura: +8 Resolve/turn to allies within 2 cells)*
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Necromancer | 4g | 40 | 22 | 2 | 2 | 8 | 3 | 1 | 8% | 100 | Support Aura |
| T2 | Dark Necromancer | +4g | 60 | 33 | 3 | 2 | 8 | 3 | 1 | 8% | 100 | Support Aura |
| T3 | Master Necromancer | +6g | 80 | 44 | 4 | 2 | 8 | 4 | 1 | 8% | 100 | **Raise Skeleton**: Summon skeleton on kill + Support Aura |

**Dark Sorcerer Line**
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Dark Sorcerer | 6g | 55 | 36 | 3 | 2 | 11 | 4 | 1 | 10% | 100 | - |
| T2 | Shadow Sorcerer | +6g | 82 | 54 | 4 | 2 | 11 | 4 | 1 | 10% | 100 | - |
| T3 | Void Sorcerer | +9g | 110 | 72 | 6 | 2 | 11 | 5 | 1 | 10% | 100 | **Soul Drain**: Damage + heal for 50% |

#### Support (1)

**Vampire Line** *(Has Support Aura: +8 Resolve/turn to allies within 2 cells)*
| Tier | Name | Cost | HP | ATK | Armor | Speed | Init | Range | AtkCnt | Dodge | Resolve | Ability |
|------|------|------|-----|-----|-------|-------|------|-------|--------|-------|---------|---------|
| T1 | Vampire | 5g | 65 | 18 | 8 | 3 | 16 | 1 | 1 | 25% | 100 | Support Aura |
| T2 | Vampire Lord | +5g | 97 | 27 | 12 | 3 | 16 | 1 | 1 | 25% | 100 | Support Aura |
| T3 | Blood Prince | +8g | 130 | 36 | 16 | 3 | 16 | 1 | 1 | 25% | 100 | **Blood Feast**: Heal all allies for 15% of damage dealt + Support Aura |

---

## Starter Deck Composition (12 T1 units)

### Humans Starter Deck
| Unit | Cost | Role |
|------|------|------|
| Footman | 3 | Tank |
| Footman | 3 | Tank |
| Swordsman | 3 | Melee DPS |
| Swordsman | 3 | Melee DPS |
| Archer | 4 | Ranged DPS |
| Archer | 4 | Ranged DPS |
| Apprentice | 4 | Mage |
| Knight | 5 | Tank |
| Crusader | 5 | Melee DPS |
| Crossbowman | 6 | Ranged DPS |
| Battle Mage | 6 | Mage |
| Priest | 5 | Support |

### Undead Starter Deck
| Unit | Cost | Role |
|------|------|------|
| Zombie | 3 | Tank |
| Zombie | 3 | Tank |
| Skeleton Warrior | 3 | Melee DPS |
| Skeleton Warrior | 3 | Melee DPS |
| Skeleton Archer | 4 | Ranged DPS |
| Skeleton Archer | 4 | Ranged DPS |
| Necromancer | 4 | Mage |
| Abomination | 5 | Tank |
| Ghoul | 5 | Melee DPS |
| Banshee | 6 | Ranged DPS |
| Dark Sorcerer | 6 | Mage |
| Vampire | 5 | Support |

---

## Upgrade Cost Summary

| T1 Cost | T2 Upgrade (100%) | T3 Upgrade (150%) | Total to T3 |
|---------|-------------------|-------------------|-------------|
| 3g | 3g | 5g | 11g |
| 4g | 4g | 6g | 14g |
| 5g | 5g | 8g | 18g |
| 6g | 6g | 9g | 21g |
| 7g | 7g | 11g | 25g |
| 8g | 8g | 12g | 28g |


---

## Resolve Summary by Faction

### Humans — Resolve Values

| Unit Type | T1 Resolve | Notes |
|-----------|------------|-------|
| **Tanks** | 80-90 | High resolve, hard to break |
| **Melee DPS** | 60-80 | Medium resolve |
| **Ranged DPS** | 55-70 | Lower resolve, vulnerable |
| **Mages** | 50-65 | Lowest resolve, needs protection |
| **Support** | 70 | Medium resolve, provides Support Aura |

**Broken State:** Retreating — flees toward edge, can Rally at 25+ Resolve

**Recovery:** Base Regeneration + Rest Multiplier (x2.5 if not attacked)

### Undead — Resolve Values

| Unit Type | Resolve | Notes |
|-----------|---------|-------|
| **All Units** | 100 | High starting resolve |

**Broken State:** Crumbling — stays in place, loses 15% HP/turn, -50% ATK/Armor

**Recovery:** Base Regeneration = 0. Only through Necromancer Aura (+8/turn) or Spells.

**Faction Advantage:** Undead block cells even when broken, forcing enemies to hack through.

**Faction Disadvantage:** Cannot self-recover. Once broken, they slowly die unless healed.

---

## Resolve Damage Calculation

**Primary Rule:** Resolve Damage = 100% ATK (ignores Armor)

**Example:**
- Swordsman (ATK 18) attacks Zombie (Resolve 100)
- Zombie takes 18 Resolve damage → Resolve drops to 82
- After 6 attacks: Resolve = 100 - (18 × 6) = -8 → Crumbling state

**High-ATK units are effective at breaking morale!**

---

## Support Units with Auras

| Unit | Aura Effect | Range |
|------|-------------|-------|
| Priest (Humans) | +8 Resolve/turn to allies | 2 cells |
| Necromancer (Undead) | +8 Resolve/turn to allies | 2 cells |
| Vampire (Undead) | +8 Resolve/turn to allies | 2 cells |

**Note:** Support Aura is the only way for Undead to recover Resolve!

---

## Summoned Units Resolve

Units summoned by spells (e.g., Raise Dead) have reduced resolve:

| Summoned Unit | Resolve | Notes |
|---------------|---------|-------|
| Skeleton Warrior (summoned) | 40 | Fragile, breaks easily |
| Skeleton (from Necromancer) | 40 | Temporary fodder |

**Design Note:** Summoned units are expendable. They provide tactical value but will crumble quickly under pressure.
