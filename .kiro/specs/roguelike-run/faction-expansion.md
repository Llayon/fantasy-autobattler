# Roguelike Faction Expansion Analysis

## Overview
Existing factions are **Order** (HP-focused, Defensive) and **Chaos** (Attack-focused, Aggressive). The goal is to propose additional factions that explore *new mechanical spaces* (Utility, Mobility, Magic, etc.) to create a diverse ecosystem.

## Proposed Factions (from GDD Roadmap)

### 1. Nature (The Wilds)
*   **Theme:** Beasts, Druids, Overgrowth.
*   **Bonus:** `+10% Regeneration` (Heals % of max HP each round).
*   **Playstyle:** **Sustain & Swarm**. Units are individually weaker but hard to kill immediately.
*   **Key Mechanics:**
    *   **Thorns:** Return damage on hit.
    *   **Summoning:** Spawning "Treants" or "Wolves" to fill the board.
    *   **Entangle:** Rooting enemies in place (counters Mobility).

### 2. Shadow (Assassins Guild)
*   **Theme:** Ninjas, Rogues, Smoke.
*   **Bonus:** `+20% Dodge`.
*   **Playstyle:** **Evasion & Burst**. High risk, high reward. Relies on avoiding damage entirely rather than tanking it.
*   **Key Mechanics:**
    *   **Stealth:** Untargetable for the first X rounds.
    *   **Backstab:** Critical damage when attacking from behind (requires Phase 2 Facing mechanics).
    *   **Poison:** Damage over Time (DoT) that ignores armor.

### 3. Arcane (Mage Council)
*   **Theme:** Wizards, Constructs, Energy.
*   **Bonus:** `+15% Magic Damage`.
*   **Playstyle:** **Glass Cannon AoE**. Extremely fragile units that deal massive area damage.
*   **Key Mechanics:**
    *   **Mana Shield:** Uses Mana bar as HP.
    *   **Teleport:** Swap positions instantly when threatened.
    *   **Silence:** Prevent enemies from using Active Abilities.

### 4. Machine (Iron Legion)
*   **Theme:** Steampunk Mechs, Dwarves.
*   **Bonus:** `+15% Armor`.
*   **Playstyle:** **Utility & Range**. Slow, heavily armored units with long range and artillery support.
*   **Key Mechanics:**
    *   **Overheat:** Gain ATK each round but take self-damage.
    *   **Repair:** Mechanical healing (cannot be healed by normal spells).
    *   **Explode:** Deal damage on death.

## Recommendation for Next Implementation
**Priority: Nature.**
*   **Why:** "Regeneration" is mechanically distinct from HP (Order) and ATK (Chaos), offering a clear "Sustain" archetype.
*   **Complexity:** Low. Implementing a `regeneration` status effect is simpler than `Dodge` (RNG-heavy) or `Magic` (requires Mana system overhaul).

## Implementation Steps for "Nature" Faction
1.  **Define Bonus:** Add `regeneration: number` to `UnitStats`.
2.  **Update Simulator:** in `tickStatusEffects`, apply healing based on `maxHp * regeneration`.
3.  **Create Units:**
    *   *Tank:* Bear Form Druid (High HP).
    *   *DPS:* Wolf Pack (Low HP, fast).
    *   *Support:* Dryad (Heals, Roots).
4.  **Create Leader:** "Archdruid Malfurion" (Passive: Summons a Treant on unit death).
