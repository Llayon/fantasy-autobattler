# Requirements Document

## Introduction

This feature integrates the existing battle simulation system into roguelike mode, enabling players to watch replays of their roguelike battles. Currently, roguelike battles use mock results (random win/loss) without actual simulation. This feature will:
1. Run real battle simulations using the existing `battle.simulator.ts`
2. Save battle logs to the database for replay
3. Provide a "Watch Replay" button after each battle
4. Reuse the existing `BattleReplay` component for visualization

## Glossary

- **Battle Simulator**: The `simulateBattle()` function that deterministically simulates combat between two teams on an 8×10 grid
- **Battle Log**: Database entity storing complete battle data including team snapshots, events, and results
- **Roguelike Run**: A progression mode where players build a deck, draft units, and battle opponents to reach 9 wins before 4 losses
- **Snapshot**: A saved state of a player's team composition used for async matchmaking
- **Team Setup**: Structure containing unit templates and their positions on the battlefield
- **Unit Mapping**: Process of converting `RoguelikeUnit` (with faction, tier, position) to `UnitTemplate` (battle-compatible format) with tier-based stat modifiers applied
- **Tier Modifiers**: Stat multipliers based on unit tier: T1 = ×1.0, T2 = ×1.5, T3 = ×2.0 (per GDD)
- **Team Colors**: Player team is always rendered as blue, opponent team as red, regardless of actual faction

## Requirements

### Requirement 1

**User Story:** As a roguelike player, I want my battles to be actually simulated, so that the outcome depends on my team composition and positioning.

#### Acceptance Criteria

1. WHEN a player submits a battle in roguelike mode THEN the System SHALL simulate the battle using the existing `simulateBattle()` function
2. WHEN simulating a roguelike battle THEN the System SHALL convert roguelike units to battle-compatible `UnitTemplate` format
3. WHEN simulating a roguelike battle THEN the System SHALL use a deterministic seed based on run ID and battle number
4. WHEN the battle simulation completes THEN the System SHALL determine win/loss based on the simulation result (not random)

### Requirement 2

**User Story:** As a roguelike player, I want my battle results saved, so that I can watch replays later.

#### Acceptance Criteria

1. WHEN a roguelike battle completes THEN the System SHALL save a `BattleLog` entity to the database
2. WHEN saving a roguelike battle log THEN the System SHALL include both player and opponent team snapshots
3. WHEN saving a roguelike battle log THEN the System SHALL include all battle events for replay
4. WHEN saving a roguelike battle log THEN the System SHALL store the battle ID in the run's battle history

### Requirement 3

**User Story:** As a roguelike player, I want to watch a replay of my battle, so that I can understand what happened and improve my strategy.

#### Acceptance Criteria

1. WHEN a battle result is displayed THEN the System SHALL show a "Watch Replay" button
2. WHEN a player clicks "Watch Replay" THEN the System SHALL navigate to the battle replay page with the battle ID
3. WHEN viewing a roguelike battle replay THEN the System SHALL display the battle using the existing `BattleReplay` component
4. WHEN viewing a roguelike battle replay THEN the System SHALL show correct team colors (player = blue, opponent = red)

### Requirement 4

**User Story:** As a roguelike player, I want the battle result response to include the battle ID, so that the frontend can link to the replay.

#### Acceptance Criteria

1. WHEN a roguelike battle completes THEN the API response SHALL include the actual battle log ID (not a mock ID)
2. WHEN returning battle results THEN the System SHALL include a flag indicating if replay is available
3. WHEN a battle fails to save after 2 retry attempts THEN the System SHALL still return the battle result but indicate replay is unavailable

### Requirement 5

**User Story:** As a roguelike player, I want opponent teams to be properly formatted for battle, so that battles work correctly against both bot and player opponents.

#### Acceptance Criteria

1. WHEN battling a bot opponent THEN the System SHALL generate a valid team using bot generation logic
2. WHEN battling a player snapshot THEN the System SHALL convert the snapshot's placed units to battle format
3. WHEN converting units for battle THEN the System SHALL apply tier-based stat modifiers (T1: ×1.0, T2: ×1.5, T3: ×2.0)
4. WHEN converting units for battle THEN the System SHALL include unit abilities based on unit type

### Requirement 6

**User Story:** As a roguelike player, I want to access my battle history from the run, so that I can review past battles.

#### Acceptance Criteria

1. WHEN a battle completes THEN the System SHALL store an object `{ battleId: string, result: 'win' | 'loss', round: number }` in the run's battleHistory array
2. WHEN viewing run details THEN the System SHALL display a list of past battles with results and round numbers
3. WHEN clicking on a past battle THEN the System SHALL navigate to the replay page for that battle

### Requirement 7

**User Story:** As a roguelike player, I want edge cases handled gracefully, so that battles don't crash or produce unexpected results.

#### Acceptance Criteria

1. WHEN the player team has 0 units placed THEN the System SHALL immediately resolve as loss without simulation
2. WHEN the opponent team has 0 units THEN the System SHALL immediately resolve as win without simulation
3. WHEN both teams have 0 units THEN the System SHALL resolve as loss for the player
