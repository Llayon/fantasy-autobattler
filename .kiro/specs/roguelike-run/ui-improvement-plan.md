# Roguelike UI Improvement Plan

## 1. Overview
This plan focuses on enhancing the user interface and experience for the Roguelike Run mode, based on the `roguelike-run` specifications. The goal is to move from "functional" to "premium/immersive".

## 2. Strategic Improvements

### 2.1. Immersive Run Status (HUD)
*   **Current:** `RunStatusBar` just lists stats (Wins, Gold).
*   **Proposed:** Transform into a persistent "HUD" (Heads-Up Display) visible across all non-battle screens.
    *   **Visuals:** Use faction-specific borders (Gold/Blue for Order, Purple/Green for Undead).
    *   **Animation:** Animated counters for Gold and Lives when they change.
    *   **Tooltip:** Hovering over "Wins" shows the current run's "Path" or a mini-map of progress.

### 2.2. Draft Screen "Card Reveal"
*   **Current:** Functional list of 3-5 options.
*   **Proposed:** "Pack Opening" experience.
    *   **Animation:** Cards slide in face-down, then flip one by one.
    *   **Rarity Glow:** T2/T3 units (if draftable later) or rare spells should have distinct glow effects (Blue/Gold particles).
    *   **Interaction:** "Long Press" to see full unit details/stats before picking.

### 2.3. Upgrade Shop "Blacksmith" Vibe
*   **Current:** List of cards with an "Upgrade" button.
*   **Proposed:** Thematic "Blacksmith/Laboratory" interface.
    *   **Visuals:** Background image matches faction (Forge for Humans, Crypt for Undead).
    *   **Feedback:** When upgrading, play a "hammer strike" or "spell chant" sound/animation. The card should physically transform (shake -> flash -> new T2 art).
    *   **Preview:** Hovering the upgrade button shows a "Diff" tooltip (e.g., "HP: 100 -> 150 (+50)").

### 2.4. Leader & Faction Selection
*   **Current:** Simple grid of cards.
*   **Proposed:** "Hero Selection" stage.
    *   **Layout:** Split screen. Left side: Faction list. Right side: Large portrait of selected Leader.
    *   **Details:** Description of the "Passive Ability" should be prominent, maybe with a small video/gif preview of it in action.

### 2.5. Battle Prep "Tactics Board"
*   **Current:** Standard 8x2 grid.
*   **Proposed:** Enhanced tactical view.
    *   **Synergy Indicators:** When dragging a unit, highlight other units that share a synergy (if added in future) or Leadership aura range.
    *   **Enemy Intel:** "Spy Report" button (since you see the enemy snapshot). Show enemy "Threat Level" or "Key Units" to watch out for.

## 3. Implementation Tasks

### Phase 1: Visual Polish (CSS/Tailwind)
- [ ] Create `FactionThemeWrapper` component to apply dynamic color palettes based on active run faction.
- [ ] Add `AnimatePresence` (Framer Motion) to Draft cards for entrance/exit animations.
- [ ] Style the `RunStatusBar` to look like a game HUD (glassmorphism background).

### Phase 2: UX Enhancements (Interaction)
- [ ] Implement "Hold-to-Confirm" for Draft picks to prevent accidental misclicks.
- [ ] Add "Upgrade Preview" tooltip in the Shop.
- [ ] Add "Run History" mini-log in the sidebar (e.g., "Battle 3: Won vs Bot").

### Phase 3: Feedback & Juice
- [ ] Add sound effects for: Draft Pick, Gold Spend, Battle Win/Loss (using a simple hook).
- [ ] Add "Floating Text" for gold changes (+7g floating up near the resource bar).
